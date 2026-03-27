---
name: poc-analysis
description: |
  카드 데이터, 유저 행동 데이터, PoC 결과 분석 요청 시 자동 호출.
  4대 알고리즘(베이지안/ROC/비지도학습/Neural CDE) 자동 적용.
  "분석", "N-Score", "예측", "패턴", "알고리즘", "PoC" 키워드 시 호출.
allowed-tools: mcp__notion__retrieve-a-database, mcp__notion__create-database-row, Bash, Read, Write
---

# 4대 알고리즘 분석 프로토콜

## 알고리즘 적용 순서

### ① 베이지안 추론 (확률 업데이트)
```python
# 사전확률 → 데이터 관측 → 사후확률 업데이트
prior = 기존_N-Score / 100
likelihood = 새_데이터_신호강도
posterior = (likelihood * prior) / evidence
```
출력: 전환확률 %, 신뢰구간

### ② ROC 임계값 보정 (이탈 위험)
```
threshold = 0.65  # 고정값 (2026 병오년 리스크 상승 반영)
if score < threshold:
    flag = "⚠️ 이탈 위험 — 즉시 대응 필요"
elif score >= 0.85:
    flag = "✅ 고가치 유저"
```
출력: 위험 플래그, AUC 값

### ③ 비지도학습 (숨겨진 패턴)
```
클러스터 분류 기준:
0: 탐색형 (저빈도, 고다양성)
1: 전환임박형 (중빈도, 특정패턴 집중)
2: 고관여형 (고빈도, 반복행동)
3: 이탈위험형 (감소추세)
```
출력: 클러스터 ID, 특성 요약

### ④ Neural CDE (시계열 예측)
```
입력: 최근 30일 행동 시계열
출력: 7일 후 행동 예측 벡터
형식: [구매확률, 이탈확률, 재방문확률]
```

## 97.3% 표현 규칙
- 항상 "내러티브 복원율(NRA)" 사용
- "정확도" 표현 절대 금지
- 가설 검증 시작점임을 명시

## 분석 결과 포맷
```
📊 N-Kai 알고리즘 분석 결과
━━━━━━━━━━━━━━━━━━━━
①베이지안: XX.X% (↑/↓ X.X%)
②ROC:      X.XX (임계값 대비: ✅/⚠️)
③클러스터: #X (유형명)
④CDE예측:  [XX%, XX%, XX%]
━━━━━━━━━━━━━━━━━━━━
N-Score: XX.X (전일대비 ±X.X)
```
