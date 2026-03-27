# N-KAI 카이로스 엔진 코어 (SKILL v1.0)

## 트리거
"카이로스 엔진", "N-Score 계산", "베이지안", "ROC", "자율진화", "Neural CDE", "페르소나 분석" 언급 시 실행

---

## 엔진 아키텍처

### 동적 진화형 카이로스 페르소나 엔진 (특허 P25KAI001KR)

```
입력 레이어
├── 선천 벡터 (V_core): 생년월일 → 사주팔자 → 코어 에너지·위기대응력·경제감각·표현에너지
├── 후천 벡터 (V_behavior): KIPA 16문항 → N/S·T/F·J/P·E/I 4축
└── 소비 벡터 (V_mcc): MCC 카드 거래 데이터 → 16 카테고리 클러스터

융합 레이어
└── calibrateVectors(V_core, V_behavior) → V_fused

분류 레이어
└── classifyArchetype(V_fused) → 16 아키타입 코드

점수 레이어
└── computeNScore(V_core, V_fused) → N-Score 1000점 만점 + 등급(N1~N9)

진화 레이어 (4대 알고리즘)
├── 베이지안 추론: Prior → Likelihood → Posterior 갱신
├── 비지도 클러스터링: K-means/GMM → 8클러스터 행동 DNA
├── ROC 임계치 자동보정: T-60 골든타임 경고 F1=0.882
└── Neural CDE: 불규칙 시계열 → 미래 행동 예측 (+0.30점/일)
```

### 실증 데이터 (Architect 90일 PoC)
- 데이터 510건 (카드 454 + 질적 44 + 기존 12)
- N-Score: 520 → 820점 (+57.7%)
- 베이지안 수렴: Prior 0.50 → Posterior 0.95 (97.3%)
- 확정 행동법칙 9개 (모두 100% 검증)
- D180 예측: N-Score 1,040점 (선형회귀 y=0.30×Day+501)

---

## 코드 구현 원칙

### ES5 필수 (file:// 환경)
```javascript
// ❌ 금지
const score = data?.score ?? 500;

// ✅ 필수
var score = (data && data.score) ? data.score : 500;
```

### N-Score 1000점 환산
```javascript
// saju-engine.js는 0~100 반환 → index.html에서 ×10 변환
var finalScore = Math.round((nScoreResult.score || 0) * 10);
nScoreResult.ciLow  = Math.round((nScoreResult.ciLow  || 0) * 10);
nScoreResult.ciHigh = Math.round((nScoreResult.ciHigh || 0) * 10);
```

### 등급 임계값 (1000점 기준)
```javascript
function calculateNGrade(score) {
  if (score >= 900) return { grade:'N1', label:'Prime',   color:'#FFD700' };
  if (score >= 800) return { grade:'N2', label:'Elite',   color:'#2D8CFF' };
  if (score >= 720) return { grade:'N3', label:'Advanced',color:'#00D68F' };
  if (score >= 650) return { grade:'N4', label:'Growth',  color:'#5AA8FF' };
  if (score >= 580) return { grade:'N5', label:'Balanced',color:'#7C5BF0' };
  if (score >= 510) return { grade:'N6', label:'Stable',  color:'#FFD93D' };
  if (score >= 440) return { grade:'N7', label:'Caution', color:'#FF8C42' };
  if (score >= 370) return { grade:'N8', label:'Risk',    color:'#FF4D6D' };
  return                    { grade:'N9', label:'Alert',  color:'#CC0000' };
}
```

### 3대 지표 색상 (전 화면 통일 필수)
```
💰 경제감각 = #2D8CFF
⚡ 표현에너지 = #5AA8FF
🛡️ 위기대응력 = #00D68F
```

---

## 대외 용어 치환 (절대 준수)
| 내부(금지) | 대외(공식) |
|-----------|-----------|
| 사주팔자 | 선천적 기질 데이터 |
| 일간 | 코어 에너지 |
| 신강/신약 | 위기대응력 (높음/신중) |
| 오행 | 에너지 밸런스 |
| 월운 | 골든타임 |
| 운세 | 에너지 플로우 |

## 킬링 카피
"MBTI는 입이 말하고 N-KAI는 지갑이 말한다"
트리플 미러: 🧬DNA가 설계한 나 × 🧠내가 인식하는 나 × 💳데이터가 증명하는 나
