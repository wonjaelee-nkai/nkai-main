"""
N-Kai YouTube Auto Pipeline
===========================
전체 파이프라인:
  1. Anthropic API → 스크립트 생성
  2. ElevenLabs TTS → 한국어 음성 MP3
  3. D-ID → 립싱크 영상 생성
  4. YouTube Data API v3 → 영상 업로드

실행: python nkai-youtube-auto.py
"""

import os
import sys
import time
import json
import requests
import tempfile
import logging
from pathlib import Path
from datetime import datetime

# ── Google / YouTube ──────────────────────────────────────────────────────────
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

# ── Anthropic ─────────────────────────────────────────────────────────────────
import anthropic

# ─────────────────────────────────────────────────────────────────────────────
# 설정
# ─────────────────────────────────────────────────────────────────────────────

ANTHROPIC_API_KEY   = os.environ.get("ANTHROPIC_API_KEY", "")
ELEVENLABS_API_KEY  = os.environ.get("ELEVENLABS_API_KEY", "")  # GitHub Secrets: ELEVENLABS_API_KEY
DID_API_KEY         = os.environ.get("DID_API_KEY", "")         # GitHub Secrets: DID_API_KEY

# ElevenLabs 설정
ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1"
ELEVENLABS_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"   # Rachel (다국어 지원, 한국어 가능)
ELEVENLABS_MODEL_ID = "eleven_multilingual_v2"  # 한국어 지원 모델

# D-ID 설정
DID_BASE_URL  = "https://api.d-id.com"
DID_PRESENTER = "amy-jcwCkr1grs"               # 기본 아바타 (D-ID 제공 기본 캐릭터)

# YouTube OAuth
YOUTUBE_SCOPES         = ["https://www.googleapis.com/auth/youtube.upload"]
YOUTUBE_CLIENT_SECRET  = "client_secret.json"
YOUTUBE_TOKEN_FILE     = "youtube_token.json"

# 출력 디렉터리
OUTPUT_DIR = Path("output")
OUTPUT_DIR.mkdir(exist_ok=True)

# 로깅
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(OUTPUT_DIR / "pipeline.log", encoding="utf-8"),
    ],
)
log = logging.getLogger("nkai-pipeline")


# ─────────────────────────────────────────────────────────────────────────────
# Step 1 — 스크립트 생성 (Anthropic)
# ─────────────────────────────────────────────────────────────────────────────

def generate_script(topic: str | None = None) -> dict:
    """
    Anthropic Claude 로 YouTube 콘텐츠 스크립트를 생성합니다.
    반환: {"title": str, "description": str, "tags": list[str], "script": str}
    """
    log.info("▶ Step 1: 스크립트 생성 시작")

    if not ANTHROPIC_API_KEY:
        raise EnvironmentError("ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.")

    topic = topic or "N-Kai MBTI 사주 분석 AI — 오늘의 운세"

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    prompt = f"""당신은 N-Kai(뉴린카이로스에이아이)의 YouTube 콘텐츠 크리에이터입니다.
아래 주제로 YouTube 숏폼(60초 이내) 스크립트를 작성하세요.

주제: {topic}

출력 형식 (JSON만 출력, 코드블록 없이):
{{
  "title": "YouTube 제목 (60자 이내, SEO 최적화)",
  "description": "YouTube 설명 (200자 이내, 해시태그 포함)",
  "tags": ["태그1", "태그2", "태그3", "태그4", "태그5"],
  "script": "실제 음성 낭독용 스크립트 (자연스러운 한국어, 500자 이내)"
}}"""

    message = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text.strip()

    # JSON 파싱 (마크다운 코드블록 제거 방어 처리)
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    result = json.loads(raw.strip())

    # 결과 보존
    script_path = OUTPUT_DIR / "script.json"
    script_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    log.info(f"✅ Step 1 완료 — 스크립트 저장: {script_path}")
    log.info(f"   제목: {result['title']}")

    return result


# ─────────────────────────────────────────────────────────────────────────────
# Step 2 — ElevenLabs TTS
# ─────────────────────────────────────────────────────────────────────────────

def generate_audio(script_text: str) -> Path:
    """
    ElevenLabs API 로 한국어 음성 MP3 를 생성합니다.
    반환: 저장된 MP3 파일 경로
    """
    log.info("▶ Step 2: ElevenLabs TTS 시작")

    if not ELEVENLABS_API_KEY:
        raise EnvironmentError("ELEVENLABS_API_KEY 환경변수가 설정되지 않았습니다.")

    url = f"{ELEVENLABS_BASE_URL}/text-to-speech/{ELEVENLABS_VOICE_ID}"
    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
    }
    payload = {
        "text": script_text,
        "model_id": ELEVENLABS_MODEL_ID,
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75,
            "style": 0.0,
            "use_speaker_boost": True,
        },
    }

    resp = requests.post(url, headers=headers, json=payload, timeout=120)
    if resp.status_code != 200:
        raise RuntimeError(
            f"ElevenLabs API 오류 [{resp.status_code}]: {resp.text[:300]}"
        )

    audio_path = OUTPUT_DIR / "audio.mp3"
    audio_path.write_bytes(resp.content)
    size_kb = audio_path.stat().st_size // 1024
    log.info(f"✅ Step 2 완료 — 음성 저장: {audio_path} ({size_kb} KB)")

    return audio_path


# ─────────────────────────────────────────────────────────────────────────────
# Step 3 — D-ID 립싱크 영상 생성
# ─────────────────────────────────────────────────────────────────────────────

def _did_headers() -> dict:
    import base64
    token = base64.b64encode(f"{DID_API_KEY}".encode()).decode()
    return {
        "Authorization": f"Basic {token}",
        "Content-Type": "application/json",
    }


def upload_audio_to_did(audio_path: Path) -> str:
    """
    D-ID 에 오디오 파일을 업로드하고 URL 을 반환합니다.
    (D-ID 는 공개 URL 또는 자체 업로드 엔드포인트를 지원)
    """
    log.info("   D-ID 오디오 업로드 중...")

    url = f"{DID_BASE_URL}/audios"
    headers = {"Authorization": _did_headers()["Authorization"]}

    with open(audio_path, "rb") as f:
        resp = requests.post(
            url,
            headers=headers,
            files={"audio": (audio_path.name, f, "audio/mpeg")},
            timeout=120,
        )

    if resp.status_code not in (200, 201):
        raise RuntimeError(f"D-ID 오디오 업로드 오류 [{resp.status_code}]: {resp.text[:300]}")

    audio_url = resp.json().get("url") or resp.json().get("audio_url", "")
    log.info(f"   오디오 업로드 완료: {audio_url[:60]}...")
    return audio_url


def generate_video(audio_path: Path) -> Path:
    """
    D-ID API 로 립싱크 영상을 생성합니다.
    반환: 저장된 MP4 파일 경로
    """
    log.info("▶ Step 3: D-ID 영상 생성 시작")

    if not DID_API_KEY:
        raise EnvironmentError("DID_API_KEY 환경변수가 설정되지 않았습니다.")

    # 오디오 업로드
    audio_url = upload_audio_to_did(audio_path)

    # talks 생성 요청
    create_url = f"{DID_BASE_URL}/talks"
    payload = {
        "source_url": f"https://create-images-results.d-id.com/DefaultPresenters/{DID_PRESENTER}/v1_thumbnail.jpeg",
        "script": {
            "type": "audio",
            "audio_url": audio_url,
        },
        "config": {
            "fluent": True,
            "pad_audio": 0.0,
            "result_format": "mp4",
        },
    }

    resp = requests.post(create_url, headers=_did_headers(), json=payload, timeout=60)
    if resp.status_code not in (200, 201):
        raise RuntimeError(f"D-ID talks 생성 오류 [{resp.status_code}]: {resp.text[:300]}")

    talk_id = resp.json().get("id")
    log.info(f"   D-ID 작업 생성됨 (id: {talk_id}), 완료 대기 중...")

    # 폴링 — 최대 10분
    status_url = f"{DID_BASE_URL}/talks/{talk_id}"
    for attempt in range(60):
        time.sleep(10)
        poll = requests.get(status_url, headers=_did_headers(), timeout=30)
        data = poll.json()
        status = data.get("status", "")
        log.info(f"   폴링 {attempt + 1}/60 — status: {status}")

        if status == "done":
            result_url = data.get("result_url", "")
            break
        elif status == "error":
            raise RuntimeError(f"D-ID 처리 오류: {data.get('error', {})}")
    else:
        raise TimeoutError("D-ID 영상 생성 타임아웃 (10분 초과)")

    # 영상 다운로드
    log.info(f"   영상 다운로드 중: {result_url[:60]}...")
    video_resp = requests.get(result_url, timeout=120)
    video_resp.raise_for_status()

    video_path = OUTPUT_DIR / "video.mp4"
    video_path.write_bytes(video_resp.content)
    size_mb = video_path.stat().st_size / (1024 * 1024)
    log.info(f"✅ Step 3 완료 — 영상 저장: {video_path} ({size_mb:.1f} MB)")

    return video_path


# ─────────────────────────────────────────────────────────────────────────────
# Step 4 — YouTube 업로드
# ─────────────────────────────────────────────────────────────────────────────

def _get_youtube_credentials() -> Credentials:
    """OAuth2 인증 (토큰 캐시 지원)"""
    creds = None

    if Path(YOUTUBE_TOKEN_FILE).exists():
        creds = Credentials.from_authorized_user_file(YOUTUBE_TOKEN_FILE, YOUTUBE_SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not Path(YOUTUBE_CLIENT_SECRET).exists():
                raise FileNotFoundError(
                    f"YouTube OAuth 클라이언트 시크릿 파일 없음: {YOUTUBE_CLIENT_SECRET}"
                )
            flow = InstalledAppFlow.from_client_secrets_file(
                YOUTUBE_CLIENT_SECRET, YOUTUBE_SCOPES
            )
            creds = flow.run_local_server(port=0)

        Path(YOUTUBE_TOKEN_FILE).write_text(creds.to_json(), encoding="utf-8")

    return creds


def upload_to_youtube(
    video_path: Path,
    title: str,
    description: str,
    tags: list[str],
    category_id: str = "22",   # 22 = People & Blogs
    privacy: str = "private",  # 초기 비공개, 확인 후 공개 전환 권장
) -> str:
    """
    YouTube Data API v3 로 영상을 업로드합니다.
    반환: YouTube 영상 URL
    """
    log.info("▶ Step 4: YouTube 업로드 시작")

    creds = _get_youtube_credentials()
    youtube = build("youtube", "v3", credentials=creds)

    body = {
        "snippet": {
            "title": title,
            "description": description,
            "tags": tags,
            "categoryId": category_id,
            "defaultLanguage": "ko",
        },
        "status": {
            "privacyStatus": privacy,
            "selfDeclaredMadeForKids": False,
        },
    }

    media = MediaFileUpload(str(video_path), mimetype="video/mp4", resumable=True)
    request = youtube.videos().insert(part="snippet,status", body=body, media_body=media)

    response = None
    while response is None:
        status, response = request.next_chunk()
        if status:
            progress = int(status.progress() * 100)
            log.info(f"   업로드 진행: {progress}%")

    video_id  = response.get("id", "")
    video_url = f"https://www.youtube.com/watch?v={video_id}"
    log.info(f"✅ Step 4 완료 — 업로드 성공: {video_url}")

    return video_url


# ─────────────────────────────────────────────────────────────────────────────
# 전체 파이프라인 실행
# ─────────────────────────────────────────────────────────────────────────────

def run_pipeline(topic: str | None = None) -> None:
    """
    전체 파이프라인을 순서대로 실행합니다.
    각 단계 실패 시 이전 단계 결과물(.json / .mp3 / .mp4)은 output/ 에 보존됩니다.
    """
    start = datetime.now()
    log.info("=" * 60)
    log.info("N-Kai YouTube Auto Pipeline 시작")
    log.info(f"시작 시각: {start.strftime('%Y-%m-%d %H:%M:%S')}")
    log.info("=" * 60)

    # ── Step 1: 스크립트 ──────────────────────────────────────────────────────
    script_cache = OUTPUT_DIR / "script.json"
    if script_cache.exists():
        log.info("ℹ  script.json 캐시 발견 — Step 1 스킵")
        script_data = json.loads(script_cache.read_text(encoding="utf-8"))
    else:
        script_data = generate_script(topic)

    # ── Step 2: TTS ───────────────────────────────────────────────────────────
    audio_cache = OUTPUT_DIR / "audio.mp3"
    if audio_cache.exists():
        log.info("ℹ  audio.mp3 캐시 발견 — Step 2 스킵")
        audio_path = audio_cache
    else:
        audio_path = generate_audio(script_data["script"])

    # ── Step 3: D-ID 영상 ─────────────────────────────────────────────────────
    video_cache = OUTPUT_DIR / "video.mp4"
    if video_cache.exists():
        log.info("ℹ  video.mp4 캐시 발견 — Step 3 스킵")
        video_path = video_cache
    else:
        video_path = generate_video(audio_path)

    # ── Step 4: YouTube 업로드 ────────────────────────────────────────────────
    video_url = upload_to_youtube(
        video_path=video_path,
        title=script_data["title"],
        description=script_data["description"],
        tags=script_data["tags"],
    )

    # ── 완료 요약 ─────────────────────────────────────────────────────────────
    elapsed = (datetime.now() - start).seconds
    log.info("=" * 60)
    log.info("🎉 파이프라인 완료!")
    log.info(f"   소요 시간: {elapsed // 60}분 {elapsed % 60}초")
    log.info(f"   영상 URL : {video_url}")
    log.info("=" * 60)

    # 결과 저장
    result = {
        "completed_at": datetime.now().isoformat(),
        "topic": topic,
        "title": script_data["title"],
        "video_url": video_url,
        "files": {
            "script": str(script_cache),
            "audio": str(audio_path),
            "video": str(video_path),
        },
    }
    (OUTPUT_DIR / "result.json").write_text(
        json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8"
    )


# ─────────────────────────────────────────────────────────────────────────────
# 진입점
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    # 커맨드라인 인자로 주제 지정 가능: python nkai-youtube-auto.py "오늘의 MBTI 운세"
    topic_arg = sys.argv[1] if len(sys.argv) > 1 else None
    run_pipeline(topic=topic_arg)
