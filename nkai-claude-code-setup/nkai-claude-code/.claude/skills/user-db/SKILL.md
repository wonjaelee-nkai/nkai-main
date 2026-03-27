---
name: user-db
description: |
  홈페이지 유저 신청, DB 조회, 유저 상태 변경, 신규 등록 관련 작업.
  "유저", "신청", "등록", "DB", "회원", "고객" 키워드 시 자동 호출.
  PostgreSQL + Notion 이중 저장 프로토콜 자동 실행.
allowed-tools: Bash, Read, Write, mcp__notion__create-database-row, mcp__notion__database-query
---

# 유저 DB 관리 프로토콜

## DB 연결 정보
```
Host: [AWS RDS 엔드포인트]
DB: nkai_users
Port: 5432
Schema: public
```

## 신규 유저 등록 플로우
```
1. 홈페이지 신청폼 수신
2. 데이터 유효성 검증
   - 이메일 형식 확인
   - 연락처 형식 확인
   - 개인정보 동의 타임스탬프 확인
3. PostgreSQL INSERT (users 테이블)
4. Notion DB 동기 (즉시)
5. 4대 알고리즘 초기값 산출
6. N-Score 초기화 (기본값 50.0)
7. ADMIN 대시보드 실시간 업데이트
```

## 핵심 테이블 구조
```sql
users:
  id, name, email, phone,
  service_interest[], status,
  n_score, created_at, consent_at

user_analysis:
  user_id, bayesian_prob, roc_score,
  cluster_id, ncde_vector, n_score, analyzed_at

user_events:
  user_id, event_type, payload, created_at
```

## 상태 코드
- `pending`: 신청 완료, 검토 전
- `active`: 활성 유저
- `high_value`: N-Score 85+ 고가치
- `at_risk`: ROC < 0.65 이탈 위험
- `inactive`: 비활성

## 조회 자주 쓰는 쿼리
```sql
-- 오늘 신규 신청
SELECT * FROM users WHERE DATE(created_at) = CURRENT_DATE;

-- 이탈 위험 유저
SELECT u.*, a.roc_score
FROM users u JOIN user_analysis a ON u.id = a.user_id
WHERE a.roc_score < 0.65 ORDER BY a.roc_score;

-- N-Score 상위 10명
SELECT name, email, n_score FROM users
ORDER BY n_score DESC LIMIT 10;
```
