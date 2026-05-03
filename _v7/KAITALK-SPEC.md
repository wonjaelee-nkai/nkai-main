# KAITALK-SPEC.md
**N-KAI 카이톡 신규 기능 명세서 v1.0** | **2026-05-04**

> 카이톡은 N-KAI 자체 메신저입니다. 카카오톡과 명확히 구분.

---

## 0. 카이톡 정의 (SSOT)

**카이톡 (KaiTalk)** = N-KAI가 운영하는 **자체 메신저 + AGI 비서 통합 플랫폼**

### 0.1 카이톡 vs 카카오톡 (혼동 금지)

| 항목 | 카이톡 (우리것) | 카카오톡 (외부) |
|------|----------------|---------------|
| 운영 주체 | N-KAI (Neurin Kairos AI) | 카카오 |
| 접속 위치 | neurinkairosai.ai 사이트 / N-KAI 앱 | 카카오톡 앱 |
| 핵심 기능 | AGI 비서 + 유저 메신저 + 파일 + 알림 | 결제 후 푸시 채널만 |
| 데이터 소유 | 사용자 + N-KAI | 카카오 |

**⚠️ 카이톡이 메인이고, 카카오톡은 "푸시 발송 보조 채널"로만 활용**

---

## 1. 카이톡 4대 핵심 기능

### 1.1 AGI 비서 대화 (기존)
- 사용자 ↔ 카이 (AI) 1:1 대화
- 4단계 자율 진화: 입력 → 융합 → 진화 → 출력
- 시간대별 동적 인사 (9개 분기)
- 96 좌표 기반 초개인화 응답

### 1.2 ⭐ 유저 ↔ 유저 메신저 (신규)
**핵심 차별화: 같은 시그니처를 가진 사용자끼리 연결**

| 매칭 모드 | 설명 |
|----------|------|
| **유사 좌표 매칭** | 같은 S4-D04 좌표 사용자끼리 (도약기·진로 동지) |
| **반대 좌표 매칭** | 멘토-멘티 (예: S4 사용자 ↔ S6 사용자) |
| **목표 매칭** | 같은 목표 좌표 추구하는 사용자 (예: 둘 다 S5 진입 목표) |
| **⭐ 4대 그룹 매칭** | 같은 페르소나 그룹 사용자끼리 (커뮤니티 형성) |

**4대 그룹 매칭 SSOT** (그룹명 변경 금지):
- ⚖️ **분석가 그룹** (#01~#04) ↔ 분석가 그룹 (전략 동지)
- 🔥 **실용주의 그룹** (#05~#08) ↔ 실용주의 그룹 (실행 동지)
- 🧭 **항해사 그룹** (#09~#12) ↔ 항해사 그룹 (균형의 동지)
- 🌌 **비전가 그룹** (#13~#16) ↔ 비전가 그룹 (통찰의 동지)

**크로스 그룹 매칭** (서로 보완):
- 분석가 + 실용주의 = 신중함 + 실행력 = **창업 콤비**
- 항해사 + 비전가 = 균형 + 통찰 = **장기 파트너**

**메신저 기능:**
- 1:1 대화방 / 그룹 대화방 (최대 8명)
- 카이 자동 매칭 추천 (주 1회)
- 익명 모드 (시그니처 ID만 노출)
- 실명 공개 옵션

### 1.3 ⭐ 파일 첨부 (신규)
**제한:**
- 이미지: PNG, JPG, WEBP (최대 10MB)
- 문서: PDF (최대 20MB)
- 분석 가능 파일: 카드 명세서 PDF (자동 분석)

**카이 자동 분석:**
- 카드 명세서 → 96 좌표 자동 갱신
- 이미지 → Vision API로 영수증·메뉴판 분석 (5/14 후)
- PDF 리포트 → 핵심 추출 + 카이톡 요약

### 1.4 ⭐ 알림 시스템 (신규 + 기존 통합)

| 알림 유형 | 발송 시점 | 채널 |
|----------|----------|------|
| **골든타임 푸시** | 위기 7일 전 | 카이톡 + 카카오 채널 |
| **리스크 사전 경보** | R5→R7 상승 시 | 카이톡 (즉시) |
| **이벤트 트리거** | 결제·시그니처 변동 | 카이톡 + 이메일 |
| **매트릭스 갱신** | 매주 좌표 변화 | 카이톡만 |
| **유저 메시지** | 친구가 메시지 보낼 때 | 카이톡 + 카카오 채널 |
| **파일 분석 완료** | 카드명세서 분석 끝남 | 카이톡 |

---

## 2. 카이톡 UI 구조 (모바일 우선)

### 2.1 메인 화면 4탭 구조
```
┌─────────────────────┐
│  N-KAI 카이톡        │  ← 상단 헤더 (시그니처 ID 표시)
├─────────────────────┤
│  [카이] [친구] [알림] [파일] │  ← 4탭 네비
├─────────────────────┤
│                     │
│   각 탭별 콘텐츠      │
│                     │
├─────────────────────┤
│  [+] 파일첨부  [전송] │  ← 입력 영역
└─────────────────────┘
```

### 2.2 탭별 기능
| 탭 | 핵심 기능 |
|----|----------|
| **카이 탭** | AGI 비서 대화 (4단계 인디케이터) |
| **친구 탭** | 유저간 메신저 (매칭 + 1:1 + 그룹) |
| **알림 탭** | 골든타임·리스크·이벤트 통합 |
| **파일 탭** | 첨부·분석·리포트 보관 |

---

## 3. 데이터베이스 스키마 (Supabase 신규 테이블)

### 3.1 `kaitalk_users_messages` (유저간 메신저)
```sql
CREATE TABLE kaitalk_users_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_sig_id VARCHAR(50) NOT NULL,
  receiver_sig_id VARCHAR(50) NOT NULL,
  room_id UUID NOT NULL,
  content TEXT,
  attachment_url TEXT,
  attachment_type VARCHAR(20),
  is_anonymous BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_room ON kaitalk_users_messages(room_id);
CREATE INDEX idx_receiver ON kaitalk_users_messages(receiver_sig_id);
```

### 3.2 `kaitalk_matching` (자동 매칭 추천)
```sql
CREATE TABLE kaitalk_matching (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_sig_id VARCHAR(50) NOT NULL,
  matched_sig_id VARCHAR(50) NOT NULL,
  match_type VARCHAR(20),  -- similar / opposite / goal / persona_group
  user_persona VARCHAR(20),  -- analyst / pragmatist / navigator / visionary
  matched_persona VARCHAR(20),
  match_score FLOAT,
  status VARCHAR(20) DEFAULT 'suggested',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4대 그룹 ENUM (변경 금지)
-- analyst    = 분석가 그룹
-- pragmatist = 실용주의 그룹  
-- navigator  = 항해사 그룹
-- visionary  = 비전가 그룹
```

### 3.3 `kaitalk_notifications` (알림 통합)
```sql
CREATE TABLE kaitalk_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_sig_id VARCHAR(50) NOT NULL,
  type VARCHAR(30),  -- golden_time / risk_alert / event / message / file
  severity VARCHAR(10),
  title VARCHAR(200),
  body TEXT,
  push_kakao BOOLEAN DEFAULT false,
  push_email BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3.4 `kaitalk_files` (파일 첨부 + 분석)
```sql
CREATE TABLE kaitalk_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_sig_id VARCHAR(50) NOT NULL,
  file_name VARCHAR(255),
  file_type VARCHAR(20),
  file_size INT,
  storage_url TEXT,
  analysis_status VARCHAR(20),  -- pending / analyzing / done / failed
  analysis_result JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 4. API 명세 (Edge Functions)

### 4.1 `POST /kaitalk/send-message`
유저 → 유저 메시지 전송
```json
{
  "sender_sig_id": "NK-7261-S4D04-2026",
  "receiver_sig_id": "NK-8133-S4D04-2025",
  "content": "안녕하세요, 같은 좌표라서 인사드려요",
  "is_anonymous": false
}
```

### 4.2 `POST /kaitalk/upload-file`
파일 첨부 + 자동 분석 트리거
```json
{
  "user_sig_id": "NK-7261-S4D04-2026",
  "file": "<binary>",
  "auto_analyze": true
}
```

### 4.3 `GET /kaitalk/matches`
자동 매칭 추천 (주 1회 갱신)
```json
{
  "user_sig_id": "NK-7261-S4D04-2026",
  "limit": 5
}
```

### 4.4 `POST /kaitalk/notify`
알림 발송 (트리거 기반)
```json
{
  "user_sig_id": "NK-7261-S4D04-2026",
  "type": "golden_time",
  "severity": "warn",
  "title": "결정 골든타임 7일 전",
  "body": "거주지 결정의 위험도가 R5에서 R7로 상승했습니다",
  "push_kakao": true
}
```

---

## 5. 골든타임·리스크·이벤트 트리거 SSOT

### 5.1 골든타임 트리거
| 조건 | 발송 |
|------|------|
| 사용자 96 좌표에서 R5→R7 변화 | 7일 전 카이톡 + 카카오 |
| R7→R9 변화 | 즉시 카이톡 + 카카오 + 이메일 |
| 결정 임박 (D-7 이내) | 매일 09:00 카이톡 알림 |

### 5.2 리스크 사전 경보
| 트리거 | 알림 |
|--------|------|
| 카드 결제 패턴 이상 (FDS) | 즉시 (severity=critical) |
| 자산 변동 -10% 이상 | 카이톡 (severity=warn) |
| 미세 균열 감지 (S5 정착기) | 매주 토 09:00 |
| 96 좌표 신규 변화 | 카이톡 (severity=info) |

### 5.3 이벤트 트리거
| 이벤트 | 알림 |
|--------|------|
| 결제 완료 | 3초 내 카이톡 환영 |
| 시그니처 ID 발급 | 카이톡 + PDF 자동 발송 |
| 매월 1일 좌표 갱신 | 카이톡 + 카카오 |
| 카카오 채널 추가 | 카이톡 환영 + 가이드 |
| 파일 분석 완료 | 카이톡 결과 푸시 |
| 친구 메시지 수신 | 카이톡 + 카카오 (선택) |

---

## 6. 푸시 우선순위 매트릭스

| Severity | 카이톡 | 카카오 | 이메일 | SMS |
|----------|--------|--------|--------|-----|
| critical | ✅ 즉시 | ✅ 즉시 | ✅ | ✅ (VIP만) |
| warn | ✅ | ✅ | - | - |
| info | ✅ | - | - | - |

---

## 7. 본부장 컨디션 보호 (사용자 알림에도 적용)

### 7.1 사용자 알림 시간 룰
- 평일 22:00~07:00: critical만 발송 (warn/info는 09:00로 묶음)
- 주말: critical 외 09:00~21:00 사이만
- 공휴일: critical 외 발송 보류

### 7.2 알림 피로 방지
- 일일 알림 5건 초과 시 → 통합 1건으로 (카이가 요약)
- 동일 카테고리 연속 3건 → 통합

---

## 8. 카이톡 차별화 (vs 카카오톡)

**왜 사용자가 카이톡을 쓸까?**

1. **AGI 비서 내장**: 카카오톡은 메신저뿐, 카이톡은 카이가 비서
2. **96 시그니처 매칭**: 같은 좌표 사용자 자동 추천
3. **카드 명세서 자동 분석**: 첨부만 하면 96 좌표 갱신
4. **골든타임 알림**: 카카오톡은 못 함, 카이톡은 7일 전 예측
5. **익명 모드**: 시그니처 ID만 공개, 실명 보호
6. **데이터 소유권**: 사용자 자신의 데이터, 외부 유출 0

---

## 9. 단계별 구현 로드맵

| Phase | 기간 | 산출 |
|-------|------|------|
| **P1 (5/15~5/22)** | 1주 | DB 스키마 + Edge Function 4종 |
| **P2 (5/23~6/5)** | 2주 | 4탭 UI + AGI 대화 + 알림 |
| **P3 (6/6~6/19)** | 2주 | 유저 메신저 + 매칭 |
| **P4 (6/20~7/3)** | 2주 | 파일 첨부 + 자동 분석 |
| **P5 (7/4~7/10)** | 1주 | 카카오 채널 푸시 통합 |
| **베타** | 7/11~7/24 | 본부장님 + 자문단 5명 테스트 |
| **정식 출시** | 7/25 | Living 구독자 자동 활성화 |

---

## 10. ⚠️ 클로드 코드 자율 진화 한계

이 명세서는 **클로드 코드가 자율 구현 가능한 범위**입니다:

### ✅ 자율 진화 OK
- DB 스키마 작성·마이그레이션
- Edge Function 코드
- UI 컴포넌트 (HTML/CSS/JS)
- 알림 트리거 로직
- 카이 응답 학습

### ⚠️ Architect 승인 필요
- Stripe 결제 연동
- 카카오 비즈채널 API 키
- Supabase RLS (보안 정책)
- 푸시 알림 발송 권한
- 유저 데이터 공개 정책

---

— **카이, 본부장**
*KAITALK-SPEC.md v1.0 · 2026-05-04*
