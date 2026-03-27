"""
Downloads 폴더 자동 분류 스크립트
대상: C:/Users/ULTRA/Downloads
모드: python organize_downloads.py         → 1회 분류
      python organize_downloads.py --watch  → 실시간 감시 (watchdog)
"""

import sys
import time
import shutil
from pathlib import Path
from datetime import datetime

DOWNLOADS = Path(r"C:\Users\ULTRA\Downloads")

# ──────────────────────────────────────────────
# 분류 대상 폴더
# ──────────────────────────────────────────────
CATEGORIES = {
    "법무":    DOWNLOADS / "법무",
    "카드금융": DOWNLOADS / "카드금융",
    "특허":    DOWNLOADS / "특허",
    "N-Kai":  DOWNLOADS / "N-Kai",
    "정부과제": DOWNLOADS / "정부과제",
    "창업지원": DOWNLOADS / "창업지원",
    "대학원":  DOWNLOADS / "대학원",
    "의료":    DOWNLOADS / "의료",
    "IR":     DOWNLOADS / "IR",
    "사진":    DOWNLOADS / "사진",
    "설치파일": DOWNLOADS / "설치파일",
    "기타":    DOWNLOADS / "기타",
}

# ──────────────────────────────────────────────
# 키워드 기반 분류 규칙 (우선순위 순)
# ──────────────────────────────────────────────
KEYWORD_RULES = [
    ("법무", [
        # 일반 법률
        "계약서", "contract", "법무", "법률", "소송", "판결", "합의서",
        "위임장", "내용증명", "공증", "인감", "법인등기",
        "정관", "이사회", "주주총회", "의사록", "각서", "약정서",
        "고소", "고발", "변호사", "법원", "재판", "조정",
        "피고", "원고", "준비서면", "참고서면", "판결문",
        # 이혼·형사
        "이혼", "협의서", "재산분할", "고소장", "고발장",
        "형사", "수사", "경찰", "검찰",
        # 증거·진술
        "카카오톡", "대화내역", "녹취", "녹음",
        "사실확인서", "진술서",
        # 법인서류
        "등기", "등기부등본", "인감증명",
        # 금융계약
        "금전소비대차", "위임계약",
        # 특정 사건
        "엄성임", "천안지원", "2026가소", "충남동남경찰서",
        "이정훈",
    ]),
    ("카드금융", [
        "카드", "금융", "은행", "계좌", "이체", "입금", "출금",
        "명세서", "영수증", "receipt", "invoice", "세금계산서",
        "부가세", "원천징수", "연말정산", "급여", "payslip",
        "대출", "보험", "증권", "주식", "펀드", "적금", "예금",
        "신용", "체크카드", "결제", "billing", "payment",
        "국민은행", "신한은행", "우리은행", "하나은행", "농협",
        "삼성카드", "현대카드", "롯데카드", "비씨카드",
        "신한", "롯데", "배민", "배달",
    ]),
    ("특허", [
        "특허", "patent", "실용신안", "디자인출원", "상표",
        "trademark", "출원", "등록", "심사", "명세서_특허",
        "청구항", "claim", "PCT", "ip_", "지식재산", "발명",
        "선행기술", "거절이유", "의견서", "보정서",
        "이석기", "sprint", "스프린트",
    ]),
    ("N-Kai", [
        "nkai", "n-kai", "n_kai", "엔카이",
        "living profile", "poc", "n-score",
    ]),
    ("정부과제", [
        "초창팩", "kisa", "기술자문", "초격차", "딥테크",
        "정부과제", "국책과제", "수행기관", "과제신청",
    ]),
    ("창업지원", [
        "창업지원", "공고문", "매뉴얼", "k-starthub", "ip디딤돌",
        "유니콘", "공모", "창업사업", "통합공고", "모집공고",
    ]),
    ("대학원", [
        "강의자료", "과제", "인간관계론", "경영학",
        "대학원", "학기", "수강", "논문", "학점",
    ]),
    ("의료", [
        "진단서", "처방전", "세브란스", "이창영",
        "의료", "병원", "진료", "건강검진", "소견서", "검사결과",
    ]),
    ("IR", [
        "보도자료", "투자자료", "발표자료", "pitch",
        "ir_", "ir-", "투자제안", "사업계획서", "deck",
    ]),
]

# ──────────────────────────────────────────────
# 법무 서브폴더 규칙 (키워드 -> 서브폴더)
# ──────────────────────────────────────────────
LEGAL_SUB_RULES = [
    ("엄성임_소송",  ["엄성임", "천안지원", "2026가소"]),
    ("이혼_소송",   ["이혼", "협의서", "재산분할"]),
    ("형사_고소",   [
        "고소장", "고발장", "형사", "수사", "경찰", "검찰",
        "충남동남경찰서", "녹취", "녹음",
    ]),
    ("법인서류",    ["등기", "등기부등본", "정관", "인감", "인감증명", "위임장"]),
    ("소송서류",    ["준비서면", "참고서면", "판결문"]),
    ("사실확인서",  ["사실확인서", "이정훈"]),
    ("금융계약",    ["금전소비대차", "위임계약"]),
]

# ──────────────────────────────────────────────
# 확장자 기반 분류
# ──────────────────────────────────────────────
PHOTO_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".tif",
    ".webp", ".svg", ".ico", ".heic", ".heif", ".raw", ".cr2",
    ".nef", ".arw", ".dng", ".psd", ".ai",
}

INSTALLER_EXTENSIONS = {
    ".exe", ".msi", ".msix", ".appx", ".appxbundle",
    ".dmg", ".pkg", ".deb", ".rpm", ".appimage",
    ".cab", ".iso",
}


# ──────────────────────────────────────────────
# 분류 로직
# ──────────────────────────────────────────────
def _match_keywords(name_lower: str, keywords: list[str]) -> bool:
    return any(kw.lower() in name_lower for kw in keywords)


def classify_legal_sub(name_lower: str) -> str | None:
    for subfolder, keywords in LEGAL_SUB_RULES:
        if _match_keywords(name_lower, keywords):
            return subfolder
    return None


def classify_file(filepath: Path) -> tuple[str, str | None]:
    """(카테고리, 서브폴더|None) 반환. 미분류시 ('기타', None)."""
    name_lower = filepath.name.lower()
    ext_lower = filepath.suffix.lower()

    # 1) 키워드 매칭
    for category, keywords in KEYWORD_RULES:
        if _match_keywords(name_lower, keywords):
            sub = classify_legal_sub(name_lower) if category == "법무" else None
            return (category, sub)

    # 2) 확장자 매칭
    if ext_lower in PHOTO_EXTENSIONS:
        return ("사진", None)
    if ext_lower in INSTALLER_EXTENSIONS:
        return ("설치파일", None)

    return ("기타", None)


def _ensure_dirs():
    """분류 폴더 및 법무 서브폴더 생성."""
    for folder in CATEGORIES.values():
        folder.mkdir(exist_ok=True)
    for subfolder, _ in LEGAL_SUB_RULES:
        (CATEGORIES["법무"] / subfolder).mkdir(exist_ok=True)


def move_file(filepath: Path) -> bool:
    """단일 파일을 분류하여 이동. 성공시 True."""
    if not filepath.is_file() or filepath.name.startswith("."):
        return False
    # 다운로드 중인 임시 파일 무시
    if filepath.suffix.lower() in (".tmp", ".crdownload", ".part"):
        return False

    category, sub = classify_file(filepath)
    dest_dir = CATEGORIES[category]
    if sub:
        dest_dir = dest_dir / sub
    dest_dir.mkdir(parents=True, exist_ok=True)

    dest_path = dest_dir / filepath.name
    if dest_path.exists():
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        dest_path = dest_dir / f"{filepath.stem}_{ts}{filepath.suffix}"

    try:
        shutil.move(str(filepath), str(dest_path))
        label = f"{category}/{sub}" if sub else category
        print(f"  [{label}] {filepath.name}")
        return True
    except Exception as e:
        print(f"  오류: {filepath.name} - {e}")
        return False


# ──────────────────────────────────────────────
# 1회 분류
# ──────────────────────────────────────────────
def organize():
    _ensure_dirs()
    moved = 0
    for item in DOWNLOADS.iterdir():
        if item.is_dir():
            continue
        if move_file(item):
            moved += 1
    print(f"\n완료: {moved}개 파일 이동")


# ──────────────────────────────────────────────
# 실시간 감시 (watchdog)
# ──────────────────────────────────────────────
def watch():
    try:
        from watchdog.observers import Observer
        from watchdog.events import FileSystemEventHandler
    except ImportError:
        print("watchdog 패키지가 필요합니다. 설치 중...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "watchdog"])
        from watchdog.observers import Observer
        from watchdog.events import FileSystemEventHandler

    _ensure_dirs()

    class DownloadHandler(FileSystemEventHandler):
        def on_created(self, event):
            if event.is_directory:
                return
            filepath = Path(event.src_path)
            # Downloads 루트의 파일만 처리 (서브폴더 내 파일 무시)
            if filepath.parent != DOWNLOADS:
                return
            # 다운로드 완료 대기 (파일 크기 안정화)
            time.sleep(1)
            if filepath.exists():
                move_file(filepath)

        def on_moved(self, event):
            """브라우저가 .tmp -> 최종파일로 rename 하는 경우 처리."""
            if event.is_directory:
                return
            filepath = Path(event.dest_path)
            if filepath.parent != DOWNLOADS:
                return
            time.sleep(0.5)
            if filepath.exists():
                move_file(filepath)

    observer = Observer()
    observer.schedule(DownloadHandler(), str(DOWNLOADS), recursive=False)
    observer.start()

    print(f"Downloads 폴더 실시간 감시 시작 (Ctrl+C로 종료)\n")
    print(f"감시 대상: {DOWNLOADS}\n")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
        print("\n감시 종료")
    observer.join()


# ──────────────────────────────────────────────
# 엔트리포인트
# ──────────────────────────────────────────────
if __name__ == "__main__":
    if "--watch" in sys.argv:
        watch()
    else:
        print("Downloads 폴더 자동 분류 시작...\n")
        organize()
