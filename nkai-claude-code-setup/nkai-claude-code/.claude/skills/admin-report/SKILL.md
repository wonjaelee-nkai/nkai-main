---
name: admin-report
description: |
  일일/주간/월간 ADMIN 대시보드 리포트 자동 생성.
  "리포트", "대시보드", "현황", "통계", "요약", "보고" 키워드 시 자동 호출.
  4대 알고리즘 결과 + 유저 현황 + 이상징후 종합 브리핑.
allowed-tools: Bash, Read, Write, mcp__notion__retrieve-a-database, mcp__notion__create-page
---

# ADMIN 자동 리포트 프로토콜

## 일일 리포트 구조
```
📊 N-Kai ADMIN 일일 브리핑
날짜: YYYY-MM-DD
━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1] 유저 현황
  신규 신청: X명
  활성 유저: X명
  고가치 유저(85+): X명
  이탈 위험 유저: X명 ⚠️

[2] N-Score 현황
  평균: XX.X
  최고: XX.X (유저명)
  최저: XX.X (유저명)
  전일 대비: ±X.X

[3] 4대 알고리즘 신호
  베이지안: 전환 임박 유저 X명
  ROC: 이탈 위험 유저 X명
  클러스터: 분포 변화 감지 여부
  CDE: 7일 예측 신호

[4] ⚠️ 이상징후 경보
  (임계값 초과 항목 자동 나열)

[5] 권장 액션
  즉시: ...
  이번 주: ...
━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 자동 알림 트리거
- ROC < 0.65 유저 3명 이상: 🔴 즉시 알림
- 신규 신청 0명 (24시간): 🟡 경고
- N-Score 전주 대비 -5 이하: 🔴 경고
- 서버 응답시간 > 3초: 🔴 인프라 경보

## 리포트 저장
- Notion: Living Profile Hub (315f60bb) 자동 저장
- 파일: /reports/YYYY-MM-DD-daily.md
