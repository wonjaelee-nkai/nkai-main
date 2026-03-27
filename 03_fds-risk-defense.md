# N-KAI FDS 리스크 사전 감지 방어 시스템 (SKILL v1.0)

## 트리거
"FDS", "리스크", "이상거래", "보이스피싱", "사기 감지", "ROC", "T-60 경고", "위기대응력" 언급 시 실행

---

## N-KAI FDS 아키텍처

### 기존 FDS vs N-KAI FDS
| 항목 | 기존 FDS | N-KAI FDS |
|------|---------|-----------|
| 분석 기준 | 거래 패턴 (행동) | 선천 기질 + 행동 패턴 융합 |
| 경보 방식 | 사후 탐지 | T-60 사전 예측 |
| 오탐률 | 높음 (정상 거래 차단) | ROC 최적 임계치 자동보정 |
| 개인화 | 없음 | 16 아키타입별 위험 프로파일 |
| 진화 | 정적 룰 | 베이지안 자율 갱신 |

---

## T-60 골든타임 수호자 알고리즘

```
ROC 임계치 캘리브레이션:
- 최적 임계값: 0.30 (기존 0.65 → 하향 조정)
- F1 Score: 0.882
- 정밀도: 100% @ threshold 0.35
- 재현율: 77.8% (7/9 검증)

경보 에스컬레이션:
D-30: 🟢 INFO   "다음달 마감 건 있음"
D-14: 🟡 WATCH  "2주 후 마감, 준비 상태 확인"
D-7:  🟠 ALERT  "1주 후 마감, 미완료 집중"
D-3:  🔴 CRITICAL "3일 후, 긴급 모드"
T-60: ⚡ GOLDEN  "60분 전 개입 시점"
```

## 위기대응력 기반 FDS 분류

```javascript
function classifyRiskProfile(vCore, nScore) {
  var strengthIndex = vCore.strengthIndex || 0.5;
  var riskTolerance = Math.min(99, Math.max(35,
    Math.round(strengthIndex * 55 + oheng['水'] * 9 + oheng['金'] * 7 + 20)
  ));

  // 위기대응력 기반 FDS 임계치 동적 조정
  var threshold = riskTolerance >= 80 ? 0.70 :  // 신강 → 관대
                  riskTolerance >= 60 ? 0.50 :  // 중간
                  0.30;                           // 신약 → 엄격

  return {
    profile: riskTolerance >= 80 ? '공격형' :
             riskTolerance >= 60 ? '균형형' : '안정형',
    fdsThreshold: threshold,
    alertLevel: nScore < 500 ? 'HIGH' : nScore < 650 ? 'MEDIUM' : 'LOW'
  };
}
```

## 보이스피싱 탐지 (P3 정부사업 연계 - 28.2억)

```
탐지 특징 벡터:
1. 시간대 이상: 심야 대규모 이체 (Neural CDE σ 급등)
2. 수신처 패턴: 신규 계좌 + 고액 = ROC 임계 초과
3. 행동 불일치: 아키타입 소비 패턴 대비 3σ 이탈
4. 사회적 신호: 동행자 오버라이드 법칙 위반 패턴

베이지안 보이스피싱 탐지:
Prior: 아키타입별 사기 취약도 (N8~N9 등급 = 고위험)
Likelihood: 이상 거래 패턴 매칭
Posterior: 0.85+ 시 즉시 거래 차단 + 본인 확인
```

## FDS 자율진화 루프백

```
[데이터 수집] MCC 거래 + 시간 + 위치 + 행동
     ↓
[패턴 추출] 비지도 클러스터링 → 8클러스터 이상 탐지
     ↓
[임계치 보정] ROC 캘리브레이션 → F1 최대화
     ↓
[베이지안 갱신] 오탐/미탐 피드백 → Prior 업데이트
     ↓
[루프백] 갱신된 Prior → 다음 탐지에 반영
```

## B2G 연계: 금융소외계층 보호
- 저신용자 (N8~N9): FDS 임계치 엄격 적용 → 사기 피해 사전 차단
- 고령자 아키타입: 보이스피싱 취약 패턴 자동 분류 → 선제 경고
- 정부 바우처 이상 사용 감지: 수혜 대상 외 사용 자동 플래그
