# N-KAI 수익 파이프라인 자동화 (SKILL v1.0)

## 트리거
"수익화", "결제", "파이프라인", "Toss", "통판신고", "Basic/Pro/Premium", "전환" 언급 시 실행

---

## 수익 구조 (3단 유료)

| 플랜 | 가격 | N-Score 트리거 | 핵심 기능 |
|------|------|---------------|-----------|
| Basic | ₩9,900/월 | 550점+ | 주간 브리프 4개국어 + 월간 PDF + 공유 저장 |
| Pro | ₩19,900/월 | 650점+ | Living 대시보드 실시간 + 아키타입 + T-60 기본 + 패턴 예측 |
| Premium | ₩49,900/월 | 750점+ | 보이스 AI + 음성 파동 분석 + 맞춤 웰니스 + T-60 고정밀 + 다음 행동 확률 예측 |

**핵심 원칙: Premium이 진짜 제품. Basic/Pro는 Premium으로 가는 계단.**

---

## 결제 파이프라인

```
[1] 분석 완료 → N-Score 산출
[2] 수익 전환 트리거 감지 (550/650/750점)
[3] Toss 결제 위젯 호출
    ck=live_gck_... (index.html 프론트엔드)
    sk=live_gsk_... (Code.gs 서버사이드)
[4] 결제 승인 → GAS confirmPayment()
[5] PDF 3종 자동 생성 (jsPDF)
    SNAPSHOT(10p) / MONTHLY(19p) / VIP(28p)
[6] 이메일 2통 동시 발송
    A: EmailJS HTML 즉시 (template_7ob3djf)
    B: GAS PDF 첨부 5~15초 후
[7] Google Sheets 기록 자동 저장
```

## 수익화 블로커 체크
```
□ 통신판매업 신고번호 갱신 (동대문구청)
□ Toss live 키 교체 (2줄)
  index.html: test_ck_ → live_gck_
  Code.gs:    test_sk_ → live_gsk_
□ neurinkairosai.com 사업자 정보 업데이트
```

## N-Score → 수익 전환 자동 감지 코드
```javascript
function checkRevenueTrigger(nScore) {
  var tiers = [
    { min:750, plan:'Premium', price:49900, action:'premium_cta' },
    { min:650, plan:'Pro',     price:19900, action:'pro_cta' },
    { min:550, plan:'Basic',   price:9900,  action:'basic_cta' },
  ];
  for (var i=0; i<tiers.length; i++) {
    if (nScore >= tiers[i].min) {
      triggerCTA(tiers[i]);
      return;
    }
  }
}
```

## GAS 결제 데이터 전송
```javascript
// CORS 안전: text/plain + fetch(keepalive)
fetch(gasUrl, {
  method: 'POST',
  mode: 'no-cors',
  keepalive: true,
  headers: { 'Content-Type': 'text/plain' },
  body: JSON.stringify({
    type: 'payment',
    nscore: finalScore,
    plan: planName,
    amount: amount,
    archetype: archetypeCode
  })
});
```

## B2B 수익 모델
- 카드사 API 라이선싱: 월 ₩5,000만~1억 (MCC 데이터 + N-Score API)
- 보험사 리스크 분류: 건당 ₩500~2,000
- 금융사 초개인화 마케팅 툴: 연간 계약
- ROI 시뮬레이터: 전환율 +23%, CAC -31% 실증 제공

## ROI 핵심 수치 (B2B 피칭용)
```
기존 금융 마케팅: 전환율 2~3%
N-KAI 적용 후: 전환율 예측 +23%
이탈 고객 사전 감지: D-30 정확도 89% (ROC AUC)
개인화 추천 클릭률: 기존 대비 +340% (Posterior 0.85+ 구간)
```
