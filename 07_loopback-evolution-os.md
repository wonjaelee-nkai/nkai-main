# N-KAI 루프백 기반 자율진화 OS (SKILL v1.0)

## 트리거
"자율진화", "루프백", "자기보정", "KEP", "학습", "진화", "Notion Agent", "Custom Agent" 언급 시 실행

---

## KEP v3.0 (Kairos Evolution Protocol)

### 3단계 자기보정 루프

```
Loop 1: 패턴 인식 (Pattern Detection)
├── 모든 전략 제언에 #KD-YYMMDD-NNN 태그
├── 세션 시작 시 과거 5개 #KD 태그 자동 스캔
└── 이전 판단 vs 현재 판단 차이 → 명시적 보고

Loop 2: 선제 제안 (Proactive Proposal)
├── 위기 매트릭스 자동 스캔 (D-30/14/7/3)
├── 반복 버그 5항목 자동 체크리스트
└── 재무 트리거: 현금흐름 대화 → 번레이트/런웨이 자동 계산

Loop 3: 결과 검증 (Outcome Validation)
├── 월요일 주간 회고 자동 트리거
├── 전략 제언 후 2주 팔로업
└── 제언 채택률 낮은 영역 → 접근법 재검토
```

### 작동 예시
```
[세션 시작 자동 출력]
Kai: "🟠 ALERT — 통판신고 D-3.
      이전 #KD-260320-001에서 '03.26 이전 후 즉시 변경' 권장.
      현재 상태: 진행 중 → 오늘 동대문구청 방문 확정 필요.
      반복 버그 체크: KIPA 16Q ✅ / UTM ⬜"
```

---

## 루프백 자율진화 알고리즘

### 베이지안 자기보정
```javascript
// 제언 채택 여부 → Prior 업데이트
function updateAdvicePrior(adviceId, wasAdopted) {
  var prior = getAdvicePrior(adviceId) || 0.5;
  var likelihood = wasAdopted ? 0.9 : 0.2;
  var newPrior = bayesianUpdate(prior, likelihood);
  saveAdvicePrior(adviceId, newPrior);

  // Posterior 0.3 이하 → 해당 영역 접근법 재검토 플래그
  if (newPrior < 0.3) {
    flagForReview(adviceId, '채택률 저조 → 접근법 재검토 필요');
  }
}
```

### ROC 자동보정 루프
```javascript
// 주간 자동 임계치 재보정
function weeklyROCCalibration(predictions, actuals) {
  var results = [];
  var thresholds = [0.25, 0.30, 0.35, 0.40, 0.45, 0.50];

  thresholds.forEach(function(t) {
    var tp=0, fp=0, fn=0, tn=0;
    predictions.forEach(function(p, i) {
      var pred = p >= t, actual = actuals[i];
      if (pred && actual) tp++;
      else if (pred && !actual) fp++;
      else if (!pred && actual) fn++;
      else tn++;
    });
    var precision = tp/(tp+fp)||0;
    var recall    = tp/(tp+fn)||0;
    var f1 = precision+recall>0 ? 2*precision*recall/(precision+recall) : 0;
    results.push({ threshold:t, f1:f1, precision:precision, recall:recall });
  });

  // F1 최대 임계치 선택 → 자동 적용
  var best = results.reduce(function(a,b){ return b.f1>a.f1?b:a; });
  updateGlobalThreshold(best.threshold);
  return best;
}
```

---

## Notion Custom Agent 3종

### Agent 1: Context Guardian (매일 09시)
```
트리거: 매일 오전 09:00 자동 실행
기능:
- 전날 Notion 개발로그 요약
- D-30 이내 마감 스캔 → 우선순위 정렬
- N-KAI 현재 상태 브리핑 자동 생성
- Architect에게 Slack/이메일 발송

브리핑 형식:
📊 오늘의 N-KAI 현황 (날짜)
- N-Score: 820점 (전일 대비 +2)
- 수익화 블로커: 통판신고 D-N
- 오늘 최우선 1가지: [자동 선정]
- Kai 예측: [행동법칙 기반]
```

### Agent 2: Deadline Watchdog (상시)
```
트리거: Notion DB 마감일 필드 변경 감지
기능:
- D-30 → INFO 알림
- D-14 → WATCH 알림
- D-7  → ALERT 알림
- D-3  → CRITICAL + 즉시 Kai 개입

현재 감시 대상:
⏰ 통판신고 변경 (동대문구청)
⏰ 법인등기 주소 변경 (04.09)
⏰ Toss live 키 교체 (통판 완료 후)
⏰ Notion 무료기간 만료 (05.03)
```

### Agent 3: Weekly Digest (매주 월요일 09시)
```
트리거: 매주 월요일 09:00
기능:
- 지난주 개발 로그 자동 요약
- N-Score 주간 변화 그래프 생성
- 수익화 진행률 업데이트
- 다음주 최우선 3가지 자동 선정
- Kai 전략 제언 #KD 태그와 연동

출력: Notion 페이지 자동 생성 + 이메일 발송
```

---

## 자율진화 진화 지표 (Architect PoC 기준)

| 지표 | 시작값 | 현재값 | 목표값 |
|------|--------|--------|--------|
| 베이지안 Posterior | 0.50 | 0.95 | 0.99 |
| ROC AUC | 0.50 | 0.89 | 0.95 |
| 확정 행동법칙 | 0개 | 9개 | 20개 |
| N-Score | 520점 | 820점 | 1,040점 (D180) |
| 예측 적중률 | - | 73%+ | 90% |
| 복원력 | - | 1.0일 | 0.5일 |

---

## 반복 버그 자동 체크 (코드 세션 진입 시 필수)
```
□ [1] KIPA 16Q 회귀 (<!-- KIPA-16Q-START/END --> 보호 주석)
□ [2] Overview 버튼 /cdn-cgi/ 404
□ [3] Evolution Simulation font-size 13px+!important
□ [4] 3대 지표 통일 (💰#2D8CFF ⚡#5AA8FF 🛡️#00D68F)
□ [5] UTM NULL (세션트래킹 다국어 혼조)
□ [6] 모바일 오버플로우
□ [7] ES5 전용 (optional chaining ?. 금지)
□ [8] translate="no" 속성 유지
□ [9] N-Score 0점 방지 (localStorage nkai_full_result 복원)
□ [10] FAQ 팝업 showPage 래핑 (main.js 로드 확인)
```

### 2026.03.29 업데이트 — 자율진화 OS 현황

#### GitHub Actions 워크플로우 3종
| 워크플로우 | 파일 | 스케줄 |
|-----------|------|--------|
| CI Check | ci-check.yml | push/PR 시 |
| FTP Deploy | deploy-ftp.yml | push 시 (index.html/js 변경) |
| 자율진화 OS | nkai-auto-os.yml | 매주 월 09시 KST + 수동 |

#### 자율진화 OS — 5개 Job
```
strategy-ai:  전략본부 — Claude API 주간 브리핑
rnd-ai:       R&D본부 — ROC 임계치 주간 보정
ops-check:    운영본부 — Vercel + 메인도메인 상태체크
notion-log:   Notion 주간 브리핑 자동 기록
patent-watch: IP본부 — 특허 심사청구 기한 감시
```

#### Notion Agent 3종
| Agent | DB/Page ID | 역할 |
|-------|-----------|------|
| 행동로그 | b5557811 | 작업 완료 시 자동 기록 |
| 통합타임라인 | ed9d9d32 | 주요 이벤트 기록 |
| Living Profile Hub | 315f60bb | 주간 브리핑 기록 |
