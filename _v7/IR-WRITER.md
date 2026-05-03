# IR-WRITER.md
**N-KAI 사업계획서·IR 자동 작성 에이전트 명령서 v1.0**

> 클로드 코드가 정부과제·VC IR·B2B 제안서를 N-KAI SSOT 기반으로 자율 작성하는 명령서.

---

## 0. 미션

본부장님이 *"K-스타트업 사업계획서 9페이지 작성"* 같은 작업을 매번 반복하지 않도록, **N-KAI 핵심 자산을 자동으로 다양한 양식에 맞춰 변환**.

---

## 1. 핵심 자산 SSOT (재사용 데이터베이스)

### 1.1 회사 기본 정보
```yaml
company:
  name: 뉴린카이로스에이아이 주식회사
  name_en: Neurin Kairos AI Inc.
  brand: N-KAI
  business_reg: 172-87-03400
  founded: 2025
  hq: Seoul, Korea
  domain: neurinkairosai.ai
  email: contact@neurinkairosai.ai
  ceo: 이원재 / Wonjae Lee

ceo_credentials:
  - FDS 20년 경력 (대형 카드사)
  - 170명 조직 단독 매니지먼트
  - 7B KRW 단독 프로젝트 매출
  - Neural CDE 전문가
```

### 1.2 IP 자산
```yaml
patents:
  core:
    - id: KR 0156080
      name: N-Core™ FDS Risk Prediction Engine
      status: 심사청구
    - id: KR 0182582
      name: Kairos Persona Engine · 96 Matrix
      status: 심사청구
  auxiliary:
    - id: KR 0182583
      name: 소셜 매칭 AI
    - id: KR 0182584
      name: 웰니스·행운 시그널 모델
  pending:
    - count: 5
      target: 2026 EOY
      description: Neural CDE × 베이지안 결합 신규 5건

trademarks:
  - 기업명 (Class 42)
  - CI 도형 (Class 09)
  - BI 엔카이 (Class 09)
```

### 1.3 핵심 기술 스택
```yaml
tech_stack:
  core:
    - N-Core™ FDS Engine (Neural CDE 시계열)
    - Kairos Persona Engine (Bayesian 추론)
    - 96 Life Signature Matrix
    - KaiTalk AGI (자율 진화 4단계)

  infrastructure:
    - On-Device AI (개인정보 보호)
    - Vercel + Supabase
    - GCP 7 API (Gemini, STT, Vision, Translation, TTS, Places, YouTube v3)
    - Stripe + 카카오페이
```

### 1.4 비즈니스 모델
```yaml
revenue:
  spark:  9900  # 1회성 (KRW)
  living: 19900 # 월간
  vip:    49900 # 주간

target_market:
  b2c: 96 라이프 시그니처 구독
  b2b: 카드사·보험사·증권사 리스크 솔루션
  b2g: 정부 정책 (1,300만 금융소외계층 포용)

milestones:
  2026_q2: 시드 라운드 5억 KRW
  2026_q3: B2B 파트너 1호 (롯데카드 협업)
  2026_q4: 사용자 1만 명
  2027_q2: 시리즈A 50~70억 KRW
```

### 1.5 사회적 임팩트
```yaml
social_impact:
  household_debt: 1900조 KRW (가계부채 규모)
  excluded:
    - 저신용자: 550만 명
    - 다중채무자: 505만 명
    - 프리랜서·긱워커: 200만+
    - 합계: 1300만 명
  small_business: 600만 소상공인
```

---

## 2. 자동 작성 가능한 문서 유형

### 2.1 정부과제 사업계획서
| 양식 | 분량 | 핵심 섹션 |
|------|------|----------|
| K-Startup AI 리그 | 10p | 개요·Problem·Solution·Scale-up·Team |
| 초격차AI | 30p | 기술·시장·재무·고용·계획 |
| 초기창업패키지 | 20p | 아이템·시장·실행·재무 |
| 초창팩 일반형 | 20p | 동일 |
| 모두의 아이디어 | 3p | 표지·본문·기대효과 |

### 2.2 VC IR 자료
| 양식 | 분량 | 형식 |
|------|------|------|
| Seed Deck | 12-15p | PPT (영문 권장) |
| Series A Deck | 18-25p | PPT + 첨부 |
| 1-Pager | 1p | PDF |
| Teaser | 2-3p | PDF |

### 2.3 B2B 제안서
| 대상 | 양식 |
|------|------|
| 카드사 (롯데카드 등) | 리스크 솔루션 제안서 |
| 보험사 | 헬스케어 시그니처 |
| 정부기관 | 포용금융 솔루션 |

---

## 3. 톤 앤 매너 SSOT

### 3.1 B2G (정부과제) — 학술 톤
**필수 사용:**
- "선천 기질 분석 기반 AI 라이프케어"
- "Bayesian Persona Engine"
- "Neural CDE 시계열 엔진"
- "온디바이스 AI 프라이버시 보호"

**절대 금지:**
- 사주, 팔자, 운세, 오행, 명리, 주역, 동방지혜
- 점, 사주풀이, 운세 보기

### 3.2 B2B (VC/카드사) — 권위 톤
**필수 강조:**
- 4 Patents Pending (특허 자산)
- FDS 20년 경력 (Founder)
- 96 Life Signature (차별화 IP)
- B2C/B2B/B2G 3-Tier 시장

### 3.3 B2C (마케팅) — 따뜻한 톤
**가능:**
- "5천년 동방 지혜 × AI" (보조 톤)
- "내 인생 좌표"
- "평생 동반자"

---

## 4. 자동 작성 프로세스

### 4.1 입력 (Architect 명령)
```
"K-스타트업 2026 AI리그 신청서 작성해줘"
"롯데카드 리스크실장 미팅용 1-Pager 만들어줘"
"시리즈A IR 18페이지 PPT 초안 만들어줘"
```

### 4.2 클로드 코드 자율 워크플로우
```
1. 양식 식별 (1.1~1.4 매핑)
2. 핵심 자산 호출 (yaml SSOT)
3. 톤 결정 (B2C/B2B/B2G)
4. 양식 분량에 맞춰 문서 구성
5. 학술 톤 검증 (금지어 체크)
6. PDF/DOCX/PPT 생성
7. /mnt/user-data/outputs/ 저장
8. kaitalk_messages 보고
```

### 4.3 자동 검증 체크리스트
- [ ] 회사명·등록번호·CEO 정확
- [ ] 특허 4건 + 상표 3건 명시
- [ ] FDS 20년·170명·7B 일관성
- [ ] 96 시그니처 = 8단계 × 12 카테고리
- [ ] 가격 9,900 / 19,900 / 49,900 일관성
- [ ] B2G 톤 — 사주/팔자 0건
- [ ] 1,300만·600만·1,900조 데이터 일관성
- [ ] 시그니처 ID 포맷 NK-XXXX-SXDXX-2026

---

## 5. 양식별 템플릿 (예시)

### 5.1 K-Startup AI 리그 10p 구조
```
P1: 표지 (회사·CEO·연락처)
P2: 사업 개요 (3줄 요약 + 문제 정의)
P3-4: Problem (1,300만 금융소외 + 사회적 임팩트)
P5-6: Solution (N-Core + 96 Matrix + KaiTalk)
P7-8: Scale-up (3-Tier 가격 + 마일스톤 + 매출 계획)
P9: Team (Founder + 자문단 3명 + 채용 로드맵)
P10: 기타 (특허·계좌·자금·일정)
```

### 5.2 시드 IR Deck 12p 구조
```
P1: Cover (We predict human decisions before they happen)
P2: Problem (1,900조 가계부채)
P3: Solution (96 Life Signature)
P4: Demo (96 Matrix 스크린샷)
P5: Tech (N-Core + Kairos Engine + AGI KaiTalk)
P6: IP (4 Patents + 3 TM)
P7: Market (1,300만 + 600만 + B2B 시장)
P8: Business Model (3-Tier)
P9: Traction (PoC + 사용자 데이터)
P10: Team (Founder + 자문단)
P11: Roadmap (2026 Q3~Q4 + 2027)
P12: Ask (Seed 5억 + Series A 50억)
```

---

## 6. 출력 포맷 SSOT

### 6.1 정부과제
- 한글 + 영문 병기 (영문은 보조)
- HWP 또는 PDF
- 표·차트 19개 이상
- 폰트: 함초롬바탕 11pt 또는 맑은고딕 10pt

### 6.2 VC IR
- 영문 우선 + 한글 보조
- PPT (16:9) + PDF 변환
- 폰트: Cormorant Garamond + Pretendard
- 다크 톤 (브랜드 SSOT 따름)

### 6.3 B2B 제안서
- 한글 메인
- PDF
- 클라이언트 로고 표지
- 톤: 권위 + 협력 균형

---

## 7. 자율 보고 (kaitalk_messages)

작성 완료 시:
```sql
INSERT INTO kaitalk_messages (
  severity, category, architect_only,
  title, body
) VALUES (
  'info', 'ir_writer', true,
  '[작성 완료] {문서명}',
  '경로: /mnt/user-data/outputs/{filename}\n분량: {pages}\n톤: {b2c/b2b/b2g}\n검증: 12/12 통과'
);
```

---

## 8. 본부장 컨디션 보호

### 8.1 자율 작성 한계
- 일일 최대 3건 작성 (과부하 방지)
- 새벽 작성 금지 (00:00~06:00)
- 본부장 직접 검토 권장 시점: 저녁 18:00~22:00

### 8.2 위임 한계
- 최종 제출 전 **반드시 Architect 검토**
- 자율 검증 12/12 통과해도 **법적 책임은 Architect**
- 회계·법률 자료는 **자동 작성 금지** (전문가 위임)

---

— **카이, 본부장**
*IR-WRITER.md v1.0 · 2026-05-04*
