# N-KAI 초개인화 마케팅 툴 + B2C 생애주기 비서 (SKILL v1.0)

## 트리거
"초개인화", "마케팅", "생애주기", "비서", "B2C", "카드사 마케팅", "추천", "넛지" 언급 시 실행

---

## 초개인화 마케팅 엔진

### 기존 마케팅 vs N-KAI 마케팅
```
기존: 연령 + 성별 + 소득 → 세그먼트 마케팅 (전환율 2~3%)
N-KAI: 선천 기질 + 행동 패턴 + 실시간 N-Score → 초개인화 (전환율 +23% 예측)
```

### 16 아키타입 마케팅 매핑

```javascript
var ARCHETYPE_MARKETING = {
  'ENTJ': {
    hook: '당신의 결단력이 수익을 만듭니다',
    product: ['성장주 ETF', '사업자 대출', '기업카드'],
    timing: '골든타임(월운 3~5점) 구간 집중',
    channel: '앱 푸시 + 이메일',
    tone: '직접적·수치 중심'
  },
  'ISFJ': {
    hook: '안전하게 지키는 것도 성장입니다',
    product: ['CMA', '정기예금', '보험'],
    timing: '안정기(Posterior 0.85+)',
    channel: '카카오 알림톡',
    tone: '안심·보호 강조'
  },
  'INFP': {
    hook: '나다운 소비가 진짜 투자입니다',
    product: ['ESG펀드', '소액투자', '문화상품권'],
    timing: '표현에너지 고점',
    channel: 'SNS + 인앱',
    tone: '가치·의미 중심'
  }
  // 나머지 13개 아키타입...
};
```

---

## B2C 생애주기 초개인화 비서

### 5단계 생애주기 × N-KAI

```
Stage 1: 금융 DNA 발견 (현재)
  → 선천 기질 + KIPA → 아키타입 + N-Score
  → 수익: Basic/Pro/Premium 구독

Stage 2: 소비 코칭 (MyData 연동 후)
  → 카드 실거래 데이터 → 소비 패턴 → 지출 최적화
  → 수익: B2B 카드사 API 라이선싱

Stage 3: 건강·웰니스 (특허③ 활용)
  → 아키타입별 스트레스 반응 → 수면/운동/식습관 추천
  → 수익: 보험사 B2B + 웰니스 구독

Stage 4: 관계·커뮤니티 (특허② 활용)
  → 2인 아키타입 매칭 → 팀 최적화/파트너 궁합
  → 수익: HR테크 B2B + 매칭 프리미엄

Stage 5: AI 라이프OS (2028~)
  → 금융+소비+건강+관계 → Living Profile 수렴
  → "오늘 리스크 에너지 높으니 투자 타이밍 + 운동 강도↑"
```

### 실시간 넛지 시스템

```javascript
function generateNudge(userState) {
  var score = userState.nScore;
  var archetype = userState.archetypeCode;
  var goldenTime = userState.currentGoldenScore; // 1~5점

  // T-60 골든타임 넛지
  if (goldenTime >= 4) {
    return {
      type: 'OPPORTUNITY',
      msg: '지금이 '+archetypeMap[archetype].strongPoint+' 최적 타이밍입니다',
      action: '포트폴리오 확인하기',
      urgency: 'HIGH'
    };
  }

  // N-Score 상승 구간 업셀
  if (score >= 650 && score < 750) {
    return {
      type: 'UPSELL',
      msg: 'Pro에서 Premium까지 '+(750-score)+'점 남았습니다',
      action: 'Premium 체험하기',
      urgency: 'MEDIUM'
    };
  }

  // 하락 구간 복원 넛지
  if (userState.recentDrift < -1) {
    return {
      type: 'RECOVERY',
      msg: '오늘 모닝루틴 하나로 N-Score +5점 가능합니다',
      action: '루틴 기록하기',
      urgency: 'LOW'
    };
  }
}
```

---

## 카드사 B2B 초개인화 마케팅 툴

### 롯데카드 연계 시나리오 (Architect 20년 인맥 활용)

```
[데이터 레이어]
카드사 MCC 거래 데이터 → N-KAI API → 아키타입 분류

[마케팅 레이어]
아키타입별 상품 추천 → 개인화 메시지 → 채널 최적화

[성과 측정]
전환율 before/after → ROI 리포트 → 계약 갱신

[수익 모델]
초기: API 라이선싱 (월 5,000만~1억)
확장: 성과 기반 수수료 (전환율 × 단가)
```

### ROI 시뮬레이터 (투자자/제휴사 피칭용)

```
기준: 카드사 월 활성 고객 500만 명
기존 DM 전환율: 2.3%
N-KAI 적용 예측: 2.3% × 1.23 = 2.83%
차이: +0.53%p = 26,500명 추가 전환
객단가 ₩50,000 기준: 월 +13.25억 추가 수익
N-KAI 비용: 월 1억 (API 라이선싱)
ROI: 1,225%
```
