#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# ============================================================
#  N-KAI 유튜브 자동화 v1.0
#  Claude API → 스크립트 생성 → 썸네일 → YouTube 자동 업로드
#  뉴린카이로스에이아이(주) | Architect: 이원재 | 2026-03-27
# ============================================================
#  사용법:
#    pip install anthropic google-api-python-client google-auth-httplib2
#         google-auth-oauthlib pillow requests
#    python nkai-youtube-auto.py --type archetype --code ESTJ
#    python nkai-youtube-auto.py --type golden    --month 4
#    python nkai-youtube-auto.py --type mbti      (킬링 카피 영상)
# ============================================================

import os
import json
import argparse
import time
import anthropic
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont
import io

# ─────────────────────────────────────────
# 0. 설정
# ─────────────────────────────────────────
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
YOUTUBE_CLIENT_SECRET = os.environ.get("YOUTUBE_CLIENT_SECRET_FILE", "client_secret.json")
CHANNEL_ID = os.environ.get("NKAI_YOUTUBE_CHANNEL_ID", "")

BRAND_COLORS = {
    "primary":    "#2D8CFF",
    "expression": "#5AA8FF",
    "success":    "#00D68F",
    "danger":     "#FF6B6B",
    "bg":         "#0A0F1E",
    "text":       "#FFFFFF",
}

KILLING_COPY = "MBTI는 입이 말하고 N-KAI는 지갑이 말한다"

# ─────────────────────────────────────────
# 1. Claude API — 스크립트 자동 생성
# ─────────────────────────────────────────
def generate_script(content_type, params={}):
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    prompts = {
        "archetype": f"""
N-KAI 금융 DNA 플랫폼의 유튜브 영상 스크립트를 작성하세요.
아키타입: {params.get('code', 'ESTJ')}

형식:
- 총 길이: 3-5분 (약 500-700자)
- 후킹 오프닝 (10초): 충격적인 질문이나 숫자로 시작
- 본문: 해당 아키타입의 금융 패턴, 강점, 함정
- CTA: N-KAI 무료 분석 유도

규칙:
- 초등학생도 이해하는 쉬운 말 사용
- 사주/운세/생년월일 언급 금지
- 대신: 소비 DNA, 금융 성격, 지갑 데이터 사용
- 킬링 카피 포함: "{KILLING_COPY}"
- 숫자와 구체적 예시 반드시 포함

출력 형식 (JSON):
{{
  "title": "영상 제목 (클릭 유도)",
  "description": "유튜브 설명 (SEO 최적화, 300자)",
  "tags": ["태그1", "태그2", ...],
  "script": "전체 스크립트",
  "thumbnail_text": "썸네일에 들어갈 핵심 문구 (20자 이내)",
  "hook_line": "오프닝 후킹 한 줄"
}}
""",
        "golden": f"""
N-KAI 이번 달 골든타임 예보 유튜브 영상 스크립트를 작성하세요.
대상 월: {params.get('month', datetime.now().month)}월

형식:
- 총 길이: 2-3분 (약 350-450자)
- 오프닝: "이번 달 이 타이밍 놓치면 후회합니다"
- 본문: 16개 아키타입별 골든타임 TOP3
- CTA: N-KAI 내 골든타임 확인 유도

규칙:
- 초등학생도 이해하는 쉬운 말
- 월운/에너지 시프트 → 타이밍/기회/조심 시기 로 표현
- 킬링 카피 포함: "{KILLING_COPY}"

출력 형식 (JSON):
{{
  "title": "영상 제목",
  "description": "유튜브 설명",
  "tags": ["태그1", "태그2"],
  "script": "전체 스크립트",
  "thumbnail_text": "썸네일 핵심 문구",
  "hook_line": "오프닝 후킹 한 줄"
}}
""",
        "mbti": f"""
N-KAI 킬링 콘텐츠 유튜브 영상 스크립트를 작성하세요.
주제: MBTI vs N-KAI 비교

형식:
- 총 길이: 4-5분
- 오프닝: "MBTI가 못 알려주는 당신의 진짜 금융 성격"
- 본문: MBTI 한계 → N-KAI 차별점 → 실제 사례
- CTA: 무료 분석 유도

킬링 카피 반드시 포함: "{KILLING_COPY}"

출력 형식 (JSON):
{{
  "title": "영상 제목",
  "description": "유튜브 설명",
  "tags": ["태그1", "태그2"],
  "script": "전체 스크립트",
  "thumbnail_text": "썸네일 핵심 문구",
  "hook_line": "오프닝 후킹 한 줄"
}}
"""
    }

    prompt = prompts.get(content_type, prompts["mbti"])

    print(f"[스크립트 생성 중] 타입: {content_type}...")
    message = None
    for attempt in range(3):
        try:
            message = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=4096,
                messages=[{"role": "user", "content": prompt}]
            )
            break
        except anthropic._exceptions.OverloadedError:
            wait = 5 * (attempt + 1)
            print(f"[API 과부하] {wait}초 후 재시도 ({attempt + 1}/3)...")
            time.sleep(wait)
    if message is None:
        raise RuntimeError("Claude API 3회 재시도 실패")

    raw = message.content[0].text.strip()
    # JSON 파싱
    if "```json" in raw:
        raw = raw.split("```json")[1].split("```")[0].strip()
    elif "```" in raw:
        raw = raw.split("```")[1].split("```")[0].strip()

    import re
    raw = re.sub(r',\s*}', '}', raw)
    raw = re.sub(r',\s*]', ']', raw)

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        # 잘린 JSON 복구 시도
        for suffix in ['"}', '"]}', '"}]}']:
            try:
                data = json.loads(raw + suffix)
                break
            except json.JSONDecodeError:
                continue
        else:
            print("[경고] JSON 파싱 실패 — 원본 텍스트로 폴백")
            data = {
                "title": "N-KAI " + content_type + " 콘텐츠",
                "description": raw[:300],
                "tags": ["N-KAI", "금융DNA"],
                "script": raw,
                "thumbnail_text": "N-KAI 금융 DNA",
                "hook_line": ""
            }
    print(f"[스크립트 완료] 제목: {data.get('title', '')}")
    return data


# ─────────────────────────────────────────
# 2. 썸네일 자동 생성 (PIL)
# ─────────────────────────────────────────
def _find_korean_font(bold=False):
    """Windows/Mac/Linux 한글 폰트 자동 감지"""
    import platform
    system = platform.system()

    if system == "Windows":
        base = os.path.join(os.environ.get("WINDIR", r"C:\Windows"), "Fonts")
        candidates = [
            os.path.join(base, "malgunbd.ttf" if bold else "malgun.ttf"),
            os.path.join(base, "NanumGothicBold.ttf" if bold else "NanumGothic.ttf"),
            os.path.join(base, "gulim.ttc"),
            os.path.join(base, "batang.ttc"),
        ]
    elif system == "Darwin":
        candidates = [
            "/System/Library/Fonts/AppleSDGothicNeo.ttc",
            "/Library/Fonts/NanumGothicBold.ttf" if bold else "/Library/Fonts/NanumGothic.ttf",
        ]
    else:
        candidates = [
            "/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf" if bold else "/usr/share/fonts/truetype/nanum/NanumGothic.ttf",
        ]

    for path in candidates:
        if os.path.exists(path):
            return path
    return None


def generate_thumbnail(title_text, sub_text, content_type="archetype", output_path="thumbnail.jpg"):
    W, H = 1280, 720

    # 배경 생성
    img = Image.new("RGB", (W, H), color=(10, 15, 30))
    draw = ImageDraw.Draw(img)

    # 그라디언트 효과 (좌상단 → 우하단)
    for y in range(H):
        alpha = int(y / H * 40)
        draw.line([(0, y), (W, y)], fill=(13 + alpha // 4, 21 + alpha // 3, 48 + alpha // 2))

    # 색상 맵핑
    color_map = {
        "archetype": (45, 140, 255),    # #2D8CFF
        "golden":    (0, 214, 143),     # #00D68F
        "mbti":      (90, 168, 255),    # #5AA8FF
    }
    accent = color_map.get(content_type, (45, 140, 255))

    # 사이드 액센트 바
    draw.rectangle([(0, 0), (8, H)], fill=accent)
    draw.rectangle([(W - 8, 0), (W, H)], fill=accent)

    # 한글 폰트 자동 감지
    kr_font = _find_korean_font(bold=False)
    kr_font_bold = _find_korean_font(bold=True)
    if kr_font_bold:
        print(f"[폰트] Bold: {kr_font_bold}")
    if kr_font:
        print(f"[폰트] Regular: {kr_font}")

    try:
        font_logo  = ImageFont.truetype(kr_font or "arial.ttf", 36)
        font_title = ImageFont.truetype(kr_font_bold or kr_font or "arialbd.ttf", 72)
        font_sub   = ImageFont.truetype(kr_font or "arial.ttf", 38)
        font_tag   = ImageFont.truetype(kr_font or "arial.ttf", 28)
    except Exception:
        font_logo  = ImageFont.load_default()
        font_title = font_logo
        font_sub   = font_logo
        font_tag   = font_logo

    # N-KAI 브랜드
    draw.text((40, 40), "N-KAI", font=font_logo, fill=accent)

    # 메인 타이틀 (중앙) — \n 존중 + 자동 줄바꿈
    if "\n" in title_text:
        lines = [l.strip() for l in title_text.split("\n") if l.strip()]
    else:
        lines = []
        for i in range(0, len(title_text), 14):
            lines.append(title_text[i:i+14])
    line_h = 95
    y_start = H // 2 - (len(lines) * line_h) // 2 - 30
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font_title)
        tw = bbox[2] - bbox[0]
        draw.text(((W - tw) // 2, y_start), line, font=font_title, fill=(255, 255, 255))
        y_start += line_h

    # 서브 텍스트
    if sub_text:
        bbox = draw.textbbox((0, 0), sub_text, font=font_sub)
        tw = bbox[2] - bbox[0]
        draw.text(((W - tw) // 2, y_start + 20), sub_text, font=font_sub, fill=accent)

    # 하단 킬링 카피
    killing = "MBTI는 입이 말하고 N-KAI는 지갑이 말한다"
    bbox = draw.textbbox((0, 0), killing, font=font_tag)
    tw = bbox[2] - bbox[0]
    draw.text(((W - tw) // 2, H - 70), killing, font=font_tag, fill=(100, 140, 200))

    # 하단 구분선
    draw.rectangle([(40, H - 85), (W - 40, H - 82)], fill=accent)

    img.save(output_path, "JPEG", quality=95)
    print(f"[썸네일 완료] {output_path} ({W}x{H})")
    return output_path


# ─────────────────────────────────────────
# 3. YouTube API — 자동 업로드
# ─────────────────────────────────────────
def upload_to_youtube(script_data, thumbnail_path, video_path=None):
    try:
        from googleapiclient.discovery import build
        from googleapiclient.http import MediaFileUpload
        from google_auth_oauthlib.flow import InstalledAppFlow
        from google.auth.transport.requests import Request
        import pickle

        SCOPES = [
            "https://www.googleapis.com/auth/youtube.upload",
            "https://www.googleapis.com/auth/youtube",
        ]

        creds = None
        token_file = "youtube_token.pickle"

        if os.path.exists(token_file):
            with open(token_file, "rb") as f:
                creds = pickle.load(f)

        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                flow = InstalledAppFlow.from_client_secrets_file(YOUTUBE_CLIENT_SECRET, SCOPES)
                creds = flow.run_local_server(port=0)
            with open(token_file, "wb") as f:
                pickle.dump(creds, f)

        youtube = build("youtube", "v3", credentials=creds)

        # 영상 메타데이터
        body = {
            "snippet": {
                "title":       script_data.get("title", "N-KAI 금융 DNA"),
                "description": script_data.get("description", "") + "\n\n#NKAI #금융DNA #MBTI #재테크 #금융",
                "tags":        script_data.get("tags", ["N-KAI", "금융DNA", "MBTI", "재테크"]),
                "categoryId":  "22",  # People & Blogs
                "defaultLanguage": "ko",
            },
            "status": {
                "privacyStatus": "private",  # 검토 후 public으로 변경
                "selfDeclaredMadeForKids": False,
            }
        }

        # 영상 파일 업로드 (있을 경우)
        if video_path and os.path.exists(video_path):
            media = MediaFileUpload(video_path, chunksize=-1, resumable=True, mimetype="video/*")
            request = youtube.videos().insert(part="snippet,status", body=body, media_body=media)
            response = None
            while response is None:
                status, response = request.next_chunk()
                if status:
                    print(f"  업로드 진행: {int(status.progress() * 100)}%")
            video_id = response["id"]
        else:
            # 영상 없을 시 더미 업로드 (스크립트+메타데이터만 저장)
            print("[주의] 영상 파일 없음 — 메타데이터만 저장합니다")
            video_id = "PREVIEW_ONLY"

        # 썸네일 업로드
        if video_id != "PREVIEW_ONLY" and os.path.exists(thumbnail_path):
            youtube.thumbnails().set(
                videoId=video_id,
                media_body=MediaFileUpload(thumbnail_path)
            ).execute()
            print(f"[썸네일 업로드 완료] video_id: {video_id}")

        print(f"[유튜브 업로드 완료] https://youtube.com/watch?v={video_id}")
        return video_id

    except ImportError:
        print("[안내] google-api-python-client 미설치 → 메타데이터만 저장")
        return None


# ─────────────────────────────────────────
# 4. 전체 파이프라인 실행
# ─────────────────────────────────────────
def run_pipeline(content_type, params={}, video_path=None):
    date_str = datetime.now().strftime("%Y%m%d_%H%M")

    print("\n" + "="*50)
    print(f" N-KAI 유튜브 자동화 파이프라인 v1.0")
    print(f" 타입: {content_type} | {date_str}")
    print("="*50 + "\n")

    # Step 1: 스크립트 생성
    script_data = generate_script(content_type, params)

    # Step 2: 썸네일 생성
    thumbnail_path = f"thumbnail_{content_type}_{date_str}.jpg"
    generate_thumbnail(
        title_text=script_data.get("thumbnail_text", "N-KAI 금융 DNA"),
        sub_text=script_data.get("hook_line", ""),
        content_type=content_type,
        output_path=thumbnail_path
    )

    # Step 3: 스크립트 저장
    script_path = f"script_{content_type}_{date_str}.json"
    with open(script_path, "w", encoding="utf-8") as f:
        json.dump(script_data, f, ensure_ascii=False, indent=2)
    print(f"[스크립트 저장] {script_path}")

    # Step 4: YouTube 업로드
    video_id = upload_to_youtube(script_data, thumbnail_path, video_path)

    # 결과 요약
    print("\n" + "="*50)
    print(" ✅ 파이프라인 완료")
    print(f" 제목: {script_data.get('title', '')}")
    print(f" 썸네일: {thumbnail_path}")
    print(f" 스크립트: {script_path}")
    print(f" YouTube ID: {video_id or '미업로드'}")
    print("="*50 + "\n")

    return {
        "script": script_data,
        "thumbnail": thumbnail_path,
        "script_file": script_path,
        "video_id": video_id
    }


# ─────────────────────────────────────────
# 5. 메인 실행
# ─────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="N-KAI 유튜브 자동화")
    parser.add_argument("--type",  default="mbti",
                        choices=["archetype", "golden", "mbti"],
                        help="콘텐츠 타입")
    parser.add_argument("--code",  default="ESTJ", help="아키타입 코드 (archetype 타입 시)")
    parser.add_argument("--month", default=str(datetime.now().month), help="월 (golden 타입 시)")
    parser.add_argument("--video", default=None, help="업로드할 영상 파일 경로")
    args = parser.parse_args()

    params = {"code": args.code, "month": args.month}
    run_pipeline(args.type, params, args.video)
