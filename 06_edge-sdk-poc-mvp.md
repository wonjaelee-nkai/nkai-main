# N-KAI 온디바이스 AI 엣지 SDK + PoC/MVP (SKILL v1.0)

## 트리거
"SDK", "온디바이스", "엣지", "PoC", "MVP", "Phase2", "Claude Code", "GitHub Actions" 언급 시 실행

---

## 온디바이스 AI 엣지 아키텍처

### 왜 엣지인가
```
문제: 금융 데이터는 서버 전송 불가 (보안/개인정보)
해결: 디바이스 내 추론 → 결과만 서버 전송

N-KAI 엣지 SDK 구조:
┌─────────────────────────────────┐
│  Device (사용자 단말)             │
│  ┌──────────────────────────┐   │
│  │ Kairos Engine (경량화)    │   │
│  │ - 베이지안 추론 (JS)       │   │
│  │ - 아키타입 분류기 (규칙기반) │  │
│  │ - N-Score 계산 엔진       │   │
│  │ - 행동법칙 감지기          │   │
│  └──────────────────────────┘   │
│  ↓ N-Score + 아키타입만 전송     │
└─────────────────────────────────┘
         ↓ (익명화된 결과만)
┌─────────────────────────────────┐
│  Server (GAS + Google Sheets)    │
│  - 집계 분석                     │
│  - 행동법칙 업데이트              │
│  - 모델 파라미터 배포             │
└─────────────────────────────────┘
```

### 경량 SDK 구현 (ES5 필수)

```javascript
// nkai-edge-sdk.js (약 15KB)
(function(global) {
  'use strict';

  var NKAIEngine = {
    version: '1.0.0',

    // 베이지안 추론 (온디바이스)
    bayesianUpdate: function(prior, likelihood) {
      var Z = prior * likelihood + (1 - prior) * (1 - likelihood);
      return Z > 0 ? (prior * likelihood) / Z : prior;
    },

    // N-Score 계산 (서버 불필요)
    computeScore: function(vCore, vFused) {
      var base = 500;
      var coreBoost  = (vCore.wealthScore  || 0.5) * 80;
      var fusedBoost = (vFused.NS || 0) * 30 + (vFused.TF || 0) * 25;
      var score = Math.round(Math.min(999, Math.max(200,
        base + coreBoost + fusedBoost
      )));
      return {
        score: score,
        grade: this.gradeOf(score),
        ciLow:  Math.round(score * 0.92),
        ciHigh: Math.round(score * 1.08)
      };
    },

    gradeOf: function(s) {
      return s>=900?'N1':s>=800?'N2':s>=720?'N3':s>=650?'N4':
             s>=580?'N5':s>=510?'N6':s>=440?'N7':s>=370?'N8':'N9';
    },

    // 행동법칙 온디바이스 감지
    detectPatterns: function(history) {
      var laws = [];
      // 음주 해장법칙
      var drinkDays = history.filter(function(d){ return d.drink; });
      var healDays  = history.filter(function(d,i){
        return i>0 && history[i-1].drink && d.healthCluster <= 4;
      });
      if (drinkDays.length >= 2 && healDays.length/drinkDays.length >= 0.8) {
        laws.push({ name:'음주해장법칙', confidence:healDays.length/drinkDays.length });
      }
      return laws;
    }
  };

  global.NKAIEngine = NKAIEngine;
})(window || global);
```

---

## PoC → MVP → 상용화 로드맵

### Phase 1: Proving Ground (현재 ~2026.Q2)
```
✅ 완료:
- Architect 104일 생체 PoC (N-Score 520→820)
- 4대 알고리즘 수동 실증 (베이지안 97.3%, ROC F1=0.882)
- 9개 확정 행동법칙
- index.html 8,975줄 모놀리식 구축
- PDF 3종 + 결제 파이프라인 설계

🔄 진행 중:
- 통판신고 동대문구 변경 → Toss live 키 교체
- N-Score 100점→1000점 통일

목표: MAU 500 / 첫 유료 결제
```

### Phase 2: Scale Engine (2026.Q3~Q4)
```
기술 전환:
- 모놀리식 → Next.js + PostgreSQL
- Claude Code + GitHub Actions 자율 진화
- MyData API 연동 (카드사 실거래)
- 베이지안 알고리즘 실코드 구현

자동화:
- GitHub Actions 주간 자동 캘리브레이션
  → ROC 임계치 자동 업데이트
  → 행동법칙 파라미터 자동 갱신
  → Notion 개발로그 자동 기록

인력: CTO/풀스택 채용 필수
목표: MAU 10,000 / B2B 1건
```

### Phase 3: Living Platform (2027~)
```
AI 고도화:
- Neural CDE PyTorch 실구현
- 온디바이스 SDK 경량화 배포
- 웨어러블 데이터 연동

수익 다각화:
- 웰니스 구독 추가
- 보험사/HR테크 B2B
- 정부 바우처 자동화 B2G

목표: MAU 100,000 / ARR 100억
```

---

## GitHub Actions 자율진화 워크플로우

```yaml
# .github/workflows/nkai-evolve.yml
name: N-KAI 자율진화 파이프라인

on:
  schedule:
    - cron: '0 9 * * 1'  # 매주 월요일 09시
  workflow_dispatch:

jobs:
  calibrate:
    runs-on: ubuntu-latest
    steps:
      - name: ROC 임계치 재보정
        run: python scripts/roc_calibrate.py --update-threshold

      - name: 베이지안 파라미터 갱신
        run: python scripts/bayesian_update.py --new-data

      - name: 행동법칙 검증
        run: python scripts/law_validator.py --confidence-threshold 0.85

      - name: N-Score 모델 파라미터 업데이트
        run: python scripts/update_model_params.py

      - name: Notion 개발로그 자동 기록
        run: python scripts/notion_log.py --type "자율진화 캘리브레이션 완료"

      - name: 변경사항 커밋
        run: |
          git config user.name "N-KAI AutoEvolver"
          git commit -am "auto: 알고리즘 자율진화 $(date +%Y-%m-%d)"
          git push
```

## 현재 인프라 스택
```
Frontend:  index.html (ES5, 모놀리식 9,300줄+)
Frontend2: nkai-next (Next.js Phase2, Vercel 배포)
Backend:   Google Apps Script v5.9 (Code.gs 4,780줄)
DB:        Google Sheets (14개 시트)
CDN:       가비아 웹호스팅 FTP (211.47.74.55)
Deploy:    GitHub Actions deploy-ftp.yml + curl FTP 자동배포
Payment:   Toss Payments API 개별연동 (toss-key.js .gitignore 분리)
Email:     EmailJS v5
PDF:       jsPDF 클라이언트 + GAS 서버사이드
Analytics: GTM + GA4
YouTube:   nkai-youtube-auto.py v2.0 (Claude→TTS→D-ID→업로드)
```

### 2026.03.29 업데이트 — 인프라 현황

#### GitHub Secrets 6종 등록 완료
| Secret | 용도 |
|--------|------|
| ANTHROPIC_API_KEY | Claude API (전략 브리핑 + 스크립트 생성) |
| ELEVENLABS_API_KEY | ElevenLabs TTS MP3 생성 |
| DID_API_KEY | D-ID 아바타 MP4 영상 생성 |
| FTP_USERNAME / FTP_PASSWORD | 가비아 FTP 자동 배포 |
| NOTION_TOKEN | Notion 주간 로그 자동 기록 |

#### YouTube 자동화 파이프라인 v2.0
```
Step 1: Claude API → 스크립트 JSON 생성
Step 2: PIL → 썸네일 1280x720
Step 3a: ElevenLabs → TTS MP3
Step 3b: D-ID → 아바타 MP4 영상
Step 4: YouTube API → 비공개 업로드
```

#### FTP 배포 구조
```
실제 웹루트: / (FTP 루트)
GitHub Actions: deploy-ftp.yml (push 시 자동)
수동 배포: curl -T [파일] ftp://211.47.74.55/[경로]
```

#### Toss 라이브키 보안
```
toss-key.js → .gitignore (GitHub 미추적)
window.NKAI_TOSS_CK → 런타임 주입
4개 HTML에서 하드코딩 제거 완료
```

#### 추가 배포 페이지
- neurinkairosai.com/kaizen-live.html (카이젠 라이브)
- neurinkairosai.com/admin-partner.html (파트너 관리)

#### TODO
- actions/checkout@v4 → v4.2.2 업그레이드
