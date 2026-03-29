# N-KAI B2G 금융소외계층 바우처 자동 분류 (SKILL v1.0)

## 트리거
"B2G", "바우처", "금융소외", "세제혜택", "저소득", "고령층", "정부사업", "공공AX", "행안부" 언급 시 실행

---

## N-KAI B2G 핵심 가치 제안

### 기존 정부 바우처 문제
```
문제 1: 수혜 대상자가 본인 해당 여부 모름
문제 2: 신청 절차 복잡 → 실제 수혜율 저조
문제 3: 부정 수급 탐지 어려움
문제 4: 개인 상황 변화 미반영 (정적 DB)
```

### N-KAI 솔루션
```
N-Score 낮은 구간 (N7~N9, 200~440점)
→ 자동 분류: 금융소외계층 해당 여부 판단
→ 적격 바우처 자동 매핑
→ 신청 가이드 + 자동 알림 발송
→ 수혜 이력 → 베이지안 업데이트 → N-Score 상향
```

---

## 대상 분류 알고리즘

```javascript
function classifyWelfareEligibility(profile) {
  var score = profile.nScore;
  var age = profile.age;
  var archetype = profile.archetypeCode;

  var eligibility = [];

  // 금융소외계층 (N8~N9 + 저소득 패턴)
  if (score < 440) {
    eligibility.push({
      category: 'financial_exclusion',
      label: '금융소외계층',
      benefits: ['서민금융 우대', '소액보험 지원', '금융교육 바우처'],
      priority: 'HIGH'
    });
  }

  // 고령층 (65세 이상 + 위기대응력 낮음)
  if (age >= 65 && profile.riskTolerance < 50) {
    eligibility.push({
      category: 'senior_protection',
      label: '고령 금융취약',
      benefits: ['노인 일자리 바우처', '의료비 세제혜택', '치매안심 서비스'],
      priority: 'HIGH'
    });
  }

  // 저소득 소비 패턴 (MCC 클러스터 C8~C9)
  if (profile.consumptionCluster >= 8) {
    eligibility.push({
      category: 'low_income',
      label: '저소득 소비패턴',
      benefits: ['에너지 바우처', '통신비 지원', '식품 지원'],
      priority: 'MEDIUM'
    });
  }

  return eligibility;
}
```

## 자동 배포 파이프라인

```
[1] 사용자 N-Score + 아키타입 분석 완료
[2] 복지 적격성 자동 분류 (classifyWelfareEligibility)
[3] 정부 DB API 조회 (복지로, 정부24 연계)
[4] 해당 바우처/혜택 목록 생성
[5] 개인화 안내문 자동 생성 (4개국어)
[6] 신청 링크 + 기한 알림 자동 발송
[7] 수혜 이력 기록 → N-Score 갱신
```

## 행안부 AI 민원혁신 챌린지 연계

```
과제명: N-KAI 기반 금융소외계층 바우처 자동 매칭 시스템
핵심 기능:
- 민원 신청 없이 자동 분류 및 안내
- 16 아키타입 기반 개인화 혜택 추천
- 챗봇 연계: Kai가 수혜자와 직접 상담
- 부정 수급 FDS 자동 탐지

기대 효과:
- 바우처 수혜율 현재 23% → 목표 67% (+44%p)
- 민원 처리 시간 평균 3일 → 실시간 자동
- 부정 수급 탐지율 ROC AUC 0.89
```

## 세제혜택 자동 분류 엔진

```javascript
function autoTaxBenefit(userProfile) {
  var benefits = [];

  // 소득 구간별 세제혜택
  var incomeCluster = estimateIncomeCluster(userProfile.mccData);

  if (incomeCluster <= 3) {
    benefits.push({ type:'근로장려금', amount:'최대 330만원', deadline:'9월' });
    benefits.push({ type:'자녀장려금', amount:'최대 100만원', deadline:'9월' });
  }

  // 의료비 세액공제 (N9 등급 취약계층 우선)
  if (userProfile.nScore < 370) {
    benefits.push({ type:'의료비공제', amount:'700만원 한도', deadline:'연말정산' });
  }

  // 아키타입 기반 금융상품 세제혜택
  var archetypeMap = {
    'ISFJ': ['ISA 비과세', '연금저축 세액공제'],
    'ENTJ': ['벤처투자 소득공제', '청년도약계좌'],
    'INFP': ['주택청약 소득공제', '월세 세액공제'],
  };

  return benefits;
}
```

## B2G 영업 타겟

| 기관 | 사업 | 예산 규모 |
|------|------|---------|
| 행안부 | AI 민원혁신 | 상금 100만원 → 본사업 확장 |
| KISA/과기부 | 보이스피싱 공동대응 | 28.2억 |
| NIPA | 소상공인 AI 컨설팅 | 12.5억 |
| 금융위 | 금융소외계층 디지털 포용 | 별도 예산 |
