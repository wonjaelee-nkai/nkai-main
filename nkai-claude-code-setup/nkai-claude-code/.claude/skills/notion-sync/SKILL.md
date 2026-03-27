---
name: notion-sync
description: |
  유저 신청, 카드 데이터, PoC 결과, 행동 데이터 등
  모든 데이터 수신 시 Notion DB에 자동 기록.
  "기록", "저장", "로그", "노션에", "적재" 키워드 시 자동 호출.
  행동로그·타임라인·예측검증 DB 동시 업데이트.
allowed-tools: mcp__notion__create-database-row, mcp__notion__update-page, mcp__notion__retrieve-a-database
---

# Notion 자동 기록 프로토콜

## 트리거 조건
- 유저 신청 데이터 수신
- 카드 트랜잭션 데이터 (454건+)
- PoC 분석 결과
- 행동패턴 감지
- 세션 종료 시 자동 요약

## 실행 순서 (이중 적재)

### Step 1: 행동로그 DB 기록
```
DB ID: 28c47e2c
필드: 날짜 / 행동유형 / 내용 / N-Score 변화 / 알고리즘 결과
```

### Step 2: 통합타임라인 업데이트
```
DB ID: ed9d9d32
필드: 날짜 / 이벤트 / 카테고리 / 연관DB
```

### Step 3: 예측검증 반영
```
DB ID: e9cbe5ea
조건: N-Score 변동 ±5 이상일 때만
```

### Step 4: 4대 알고리즘 엔진 업데이트
```
DB ID: 588821dd
필드: 베이지안확률 / ROC점수 / 클러스터ID / CDE벡터
```

## 데이터 포맷 규칙
- 날짜: YYYY-MM-DD HH:mm KST
- N-Score: 소수점 1자리
- 확률값: % 단위 (소수점 1자리)
- 클러스터: 정수 (0-9)
