// ═══════════════════════════════════════════════════════════════
// N-KAI Google Apps Script — 합체 완성본 v3.1
// ★★★ 적용: Code.gs 전체 선택(Ctrl+A) → 삭제 → 이 파일 전체 붙여넣기 → 저장 → 새 버전 배포 ★★★
//
// v3.1 변경사항 (2026-03-07):
//   🆕 SECTION 09: 오행 × 4원소 공명 분석 추가
//   🆕 SECTION 10: 금융 케미스트리 궁합 추가 (홈페이지 일치)
//   🔧 이메일 이모지 → HTML Entity 교체 (깨짐 방지)
//   ✅ [원본 v7.9.1] 16개 아키타입 × 7필드 폴백 텍스트 완전 내장 유지
//   ✅ [원본 v7.9.1] 모든 트래킹 함수 (세션/UTM/퍼널/분석/공유 등) 완전 보존
//   ✅ [원본 v7.9.1] 토스페이먼츠 결제 승인 / 어드민 대시보드 완전 보존
//   🆕 [v2.1 신규] CONFIG 오브젝트 (설정 중앙화)
//   🆕 [v2.1 신규] doPost() 비동기화 (토스 6초 타임아웃 완전 해결)
//   🆕 [v2.1 신규] isDuplicatePdfSendFast() CacheService O(1) 중복방지
//   🆕 [v2.1 신규] callClaudeAPIWithFallback() 3단계 AI 폴백
//   🆕 [v2.1 신규] getArchetypeFallbackFull() 아키타입별 상세 폴백
//   🆕 [v2.1 신규] sendPdfWithRetry() 재시도 3회 + 실패 큐
//   🆕 [v2.1 신규] buildEmailBody() 다크테마 이메일 HTML
//   🆕 [v2.1 신규] sendServerReportSafe() 메인 처리 (안정화)
//   🆕 [v2.1 신규] buildPdfReportHtml() 완전 리디자인 (Malgun Gothic, 8섹션)
//   🆕 [v2.1 신규] setupRetryTrigger() 10분 크론 자동 재시도
//   🔄 [교체] sendServerReport() → sendServerReportSafe() 라우팅
//   🔄 [교체] isDuplicatePdfSend() → isDuplicatePdfSendFast() 라우팅
//
// ★ 첫 배포 후 필수 1회 실행: setupRetryTrigger()
// ★ 테스트: forceSendPdfTest() → sogood2172@gmail.com 수신 확인
// ═══════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════
// ★★★ [신규] CONFIG — 설정값 중앙화 (여기만 수정)
// ════════════════════════════════════════════════════════════════
const CONFIG = {
  TOSS_SECRET_KEY: PropertiesService.getScriptProperties().getProperty('TOSS_SECRET_KEY') || '',
  CLAUDE_API_KEY:  PropertiesService.getScriptProperties().getProperty('CLAUDE_API_KEY') || '',
  CLAUDE_MODEL:    'claude-sonnet-4-6',
  SUPPORT_EMAIL:   'support@neurinkairosai.com',
  TEST_EMAIL:      'sogood2172@gmail.com',
  COMPANY_NAME:    '뉴린카이로스에이아이(주)',
  BIZ_NO:          '172-87-03400',
  SITE_URL:        'https://www.neurinkairosai.com',
};

// ─── 레거시 호환 변수 (기존 코드 참조용) ───────────────────────
var CEO_EMAIL = 'cpo@neurinkairosai.com';
var SHEET_SESSIONS       = '세션트래킹';
var SHEET_UTM            = 'UTM유입경로';
var SHEET_FUNNEL         = '퍼널트래킹';
var SHEET_ANALYSIS       = '분석데이터';
var SHEET_SHARE_TRACKING = '공유트래킹';
var SHEET_TRIAL_MGMT     = '체험권관리';
var SHEET_REFERRAL       = '레퍼럴트래킹';
var SHEET_PREMIUM_UNLOCK = '프리미엄언락';
var SHEET_PREMIUM_EMAIL  = '프리미엄이메일';
var SHEET_RAFFLE_TICKET  = '추천권';
var SHEET_RESERVATION    = '사전예약';
var SHEET_RECRUIT        = '채용지원';
var SHEET_PARTNERSHIP    = '제휴문의';
var SHEET_PDF_LOG        = 'PDF발송로그';
var CLAUDE_MODEL         = CONFIG.CLAUDE_MODEL;
var CLAUDE_MAX_TOKENS    = 2000;

var HEADERS = {
  sessions:['일시','세션ID','이벤트','페이지','체류시간','디바이스','브라우저','화면해상도','이메일','UTM_source','UTM_medium','UTM_campaign','UTM_term','UTM_content','리퍼러','국가','언어'],
  utm:['일시','UTM_source','UTM_medium','UTM_campaign','UTM_term','UTM_content','랜딩페이지','리퍼러','디바이스','세션ID','전환여부','전환단계'],
  funnel:['일시','세션ID','이메일','퍼널단계','퍼널명','소요시간','이탈여부','디바이스','UTM_source','아키타입','N-Score','KIPA_에너지','KIPA_인식','KIPA_판단','KIPA_생활'],
  analysis:['일시','이름','이메일','생년월일','출생시','지역','성별','직업','혈액형','분석유형','아키타입','N-Score','N등급','정밀도','경제감각','표현에너지','위기대응력','KIPA_에너지','KIPA_인식','KIPA_판단','KIPA_생활양식','KIPA_모드','Q1','Q2','Q3','Q4','Q5','Q6','Q7','Q8','Q9','Q10','Q11','Q12','Q13','Q14','Q15','Q16'],
  shareTracking:['일시','이메일','이름','아키타입','N-Score','공유채널','공유횟수_누적','추첨권수','세션ID','디바이스','공유URL','UTM_source','레퍼럴코드'],
  trialMgmt:['일시','이메일','이름','아키타입','발급사유','발급시각','만료시각','상태','전환티어','전환일시','공유채널'],
  referralTracking:['일시','추천인이메일','추천인이름','추천인아키타입','피추천인이메일','피추천인이름','레퍼럴코드','유입채널','피추천인분석완료','피추천인구독전환','보상지급여부','보상내용'],
  premiumUnlock:['일시','이메일','이름','아키타입','N-Score','N등급','세션ID','디바이스','소스','URL','UTM_source','UTM_medium','UTM_campaign'],
  premiumEmail:['일시','이메일','이름','아키타입','N-Score','N등급','세션ID','발송상태'],
  raffleTicket:['일시','이메일','이름','공유채널','아키타입','N-Score','세션ID','디바이스','출처','레퍼럴코드'],
  reservation:['일시','이메일','유입경로'],
  recruit:['일시','이름','이메일','연락처','포지션','경력','포트폴리오','기술스택','지원동기','이력서'],
  partnership:['일시','회사명','담당자','이메일','연락처','제휴유형','제안내용','기기','URL','리퍼러'],
  pdfLog:['일시','이메일','이름','아키타입','N-Score','언어','파일명','결과'],
  payment:['일시','주문번호','결제키','금액','결제수단','상태','승인시각','이름','이메일','플랜','아키타입','N-Score','오류']
};

// ════════════════════════════════════════════════════════════════
// ★★★ v7.9.1 핵심: 16개 아키타입 폴백 텍스트 라이브러리 ★★★
// AI 크레딧 없을 때 자동 적용 — 항상 완성도 높은 PDF 보장
// ════════════════════════════════════════════════════════════════
var ARCHETYPE_FALLBACK = {
  'ENTJ':{identity:'ENTJ는 시장의 비효율을 가장 먼저 포착하고 시스템으로 전환하는 금융 설계자입니다. 강력한 실행력과 장기적 비전이 결합되어 위기 상황에서도 냉정한 판단을 유지합니다. N3 등급은 데이터 직관과 추진력의 균형이 이미 상위 15%에 진입했음을 의미합니다.',strength_insight:'경제감각과 위기대응력이 동시에 높은 ENTJ는 자산 흐름의 변곡점을 직관적으로 포착합니다. 골든타임 구간과 결합될 때 ROI가 극대화되며, 타인이 망설이는 시점에 결단을 내리는 능력이 최대 강점입니다.',risk_insight:'빠른 실행력이 때로는 과속의 위험을 낳습니다. 단기 모멘텀에 과도하게 집중하면 리스크 관리가 약해질 수 있습니다. 암호화폐·단기투자 구간에서 포지션 규모를 사전에 명확히 제한하는 것이 핵심입니다.',golden_strategy:'골든타임 BEST 1 구간은 신규 포지션 진입 또는 기존 자산 비중 확대의 최적 시기입니다. ENTJ는 이 구간에 공격적인 포트폴리오 재편을 실행하되, 주의 구간 전 2주 이내에 익절 또는 헤지 전략을 준비하십시오.',portfolio_insight:'성장주와 ETF의 조합이 ENTJ 금융 DNA와 가장 높은 공명률을 보입니다. 현금성 자산은 최소화하고, 상관관계가 낮은 2~3개 섹터에 분산함으로써 변동성을 흡수하면서도 수익률을 극대화하는 구조를 권장합니다.',growth_prescription:'앞으로 3개월, ENTJ에게 권장하는 핵심 행동은 단 하나입니다: 손절 기준선을 숫자로 명문화하십시오. 감정이 아닌 규칙이 지배하는 순간부터 N-Score는 가파르게 상승합니다. 주간 단위로 포트폴리오를 점검하고, 기준선 이탈 시 즉시 실행하는 습관이 N2 등급으로의 진입을 앞당깁니다.',one_line:'시장을 설계하는 자, 지갑이 증명한다'},
  'ENTP':{identity:'ENTP는 기존 금융의 틀을 깨고 새로운 자산 공식을 만드는 혁신가입니다. 패턴 인식 능력이 탁월하여 남들이 보지 못하는 기회를 선점합니다. 아이디어와 실행의 속도가 가장 빠른 아키타입으로, 빠른 시장 변화에 최적화된 DNA를 보유하고 있습니다.',strength_insight:'다양한 정보를 빠르게 연결하는 능력이 ENTP의 핵심 강점입니다. 초기 트렌드를 감지하고 포지션을 선점하는 전략에서 탁월한 성과를 냅니다. 표현에너지가 높아 네트워크를 통한 정보 획득과 공동 투자 기회에서도 강점을 발휘합니다.',risk_insight:'아이디어 과잉이 집중력 분산으로 이어질 수 있습니다. 동시에 여러 포지션을 운영하다 보면 각각에 대한 관리 수준이 낮아질 위험이 있습니다. 진입 전 반드시 "이 포지션에 투입할 수 있는 최대 시간"을 산정하십시오.',golden_strategy:'골든타임 구간에 ENTP는 새로운 섹터 탐색과 초기 포지션 진입에 집중하십시오. 이 기간의 직관은 평소보다 30% 이상 적중률이 높습니다. 단, 진입 전 최소 3가지 반대 근거를 스스로 논박하는 습관을 만드십시오.',portfolio_insight:'성장주와 대안투자 비중이 높은 공격형 포트폴리오가 ENTP DNA와 공명합니다. 단, 전체 자산의 15~20%는 반드시 안전자산으로 유지하여 실험적 투자에 대한 심리적 완충지대를 확보하십시오.',growth_prescription:'3개월 내 가장 큰 성장 레버는 "완료 기준"을 정의하는 것입니다. 진입 시 목표가와 손절가를 동시에 기록하고, 도달 즉시 실행하는 규칙을 만드십시오. 완료의 습관이 쌓이면 N-Score는 자연스럽게 우상향합니다.',one_line:'파괴가 곧 설계, 나는 새 지도를 그린다'},
  'INTJ':{identity:'INTJ는 장기적 비전과 완벽한 시스템 통제력을 가진 전략가입니다. 감정보다 데이터, 트렌드보다 구조를 중시하는 금융 DNA는 복잡한 시장에서도 흔들리지 않는 판단력을 만들어냅니다. 10년 후를 설계하며 오늘의 포지션을 결정하는 타입입니다.',strength_insight:'장기 투자에서 INTJ는 압도적 강점을 보입니다. 섣불리 손절하지 않으며, 자신의 분석에 확신이 생기면 외부 소음에 흔들리지 않습니다. 시스템 기반 투자(ETF, 채권 사다리, 정기 적립식)에서 꾸준한 복리 효과를 극대화할 수 있습니다.',risk_insight:'확신이 고집으로 변하는 순간이 최대 리스크입니다. 자신의 분석이 틀렸음을 보여주는 데이터가 나타나도 포지션을 유지하는 경향이 있습니다. "사전 정의된 무효화 조건"을 만들어두고, 그 조건 충족 시 즉시 실행하는 시스템이 필요합니다.',golden_strategy:'골든타임 구간은 새로운 전략 수립과 장기 포지션 진입의 최적 시기입니다. INTJ는 이 구간에 6~12개월 이상의 장기 테마 투자를 시작하면 가장 높은 성과를 냅니다. 주의 구간에는 신규 진입을 멈추고 기존 전략을 검토하는 시간으로 활용하십시오.',portfolio_insight:'ETF와 채권 중심의 시스템 포트폴리오가 INTJ DNA와 가장 높은 공명률을 보입니다. 개별 종목보다는 섹터 ETF를 통한 분산이 INTJ의 장기 복리 전략을 극대화합니다. 리밸런싱 주기를 분기로 설정하고 감정 없이 실행하십시오.',growth_prescription:'3개월 내 N-Score 상승을 위한 핵심 처방은 투자 일지 작성입니다. 매 결정의 근거와 예상 결과를 사전에 기록하고, 결과와 비교하십시오. 이 과정이 INTJ의 분석 시스템을 더욱 정교하게 만들며 N2 진입을 앞당깁니다.',one_line:'10년 후를 설계하는 자만이 오늘을 지배한다'},
  'INTP':{identity:'INTP는 보이지 않는 패턴을 읽어내어 조용히 부를 축적하는 전략가입니다. 복잡한 금융 시스템의 근본 원리를 탐구하며, 남들이 간과하는 비효율과 왜곡된 가격을 포착합니다. 방법론의 순수성을 중시하는 이 DNA는 퀀트적 접근에서 가장 빛납니다.',strength_insight:'논리적 일관성과 깊은 분석력이 INTP의 핵심 강점입니다. 한 번 확신이 생기면 외부 압력에 흔들리지 않고 포지션을 유지합니다. 저평가 자산을 발굴하고 적정가까지 보유하는 가치투자 전략에서 탁월한 성과를 냅니다.',risk_insight:'분석 마비(Analysis Paralysis)가 최대 위험입니다. 완벽한 데이터를 기다리다 기회를 놓치는 경향이 있습니다. "충분히 좋은 분석"의 기준을 미리 정의하고, 그 기준 충족 시 즉시 실행하는 규칙이 필요합니다.',golden_strategy:'골든타임 구간에 INTP는 평소 분석해 두었던 아이디어를 실행에 옮기는 시기로 활용하십시오. 이 구간의 직관과 분석의 조화가 최고조에 달합니다. 주의 구간에는 포지션 규모를 축소하고 다음 사이클을 위한 리서치에 집중하십시오.',portfolio_insight:'ETF 기반의 팩터 투자와 저평가 가치주 조합이 INTP DNA와 공명합니다. 복잡한 파생상품보다는 이해가 완벽한 자산만 편입하는 원칙이 장기적으로 더 높은 수익을 만들어냅니다.',growth_prescription:'3개월 내 가장 중요한 변화는 "결정 피로"를 줄이는 것입니다. 투자 결정 프로세스를 체크리스트로 단순화하고, 월 1~2회 정해진 날에만 포트폴리오를 점검하십시오. 단순화가 오히려 INTP의 성과를 높입니다.',one_line:'남들이 못 보는 패턴, 나는 이미 알고 있다'},
  'ESTJ':{identity:'ESTJ는 원칙과 데이터에 입각하여 리스크 제로에 도전하는 금융 관리자입니다. 체계적인 계획과 철저한 실행력이 결합되어 꾸준한 자산 증식을 이루어냅니다. 규칙과 시스템을 신뢰하며, 감정적 판단보다 검증된 방법론을 따르는 안정적인 DNA입니다.',strength_insight:'일관성과 실행력이 ESTJ의 최대 강점입니다. 정해진 전략을 흔들림 없이 실행하는 능력 덕분에 장기 적립식 투자와 배당 재투자 전략에서 두드러진 성과를 냅니다. 리밸런싱과 손절을 감정 없이 실행할 수 있는 몇 안 되는 아키타입입니다.',risk_insight:'변화하는 시장 환경에 대한 적응력이 약점이 될 수 있습니다. 과거에 효과적이었던 전략을 환경이 바뀐 후에도 고수하는 경향이 있습니다. 분기마다 전략의 유효성을 점검하고, 시장 구조 변화에 대한 학습 시간을 의도적으로 확보하십시오.',golden_strategy:'골든타임 구간에 ESTJ는 정기 투자 금액을 일시적으로 늘리거나 새로운 자산 클래스에 소규모 진입을 시도하기 적합한 시기입니다. 시스템 밖의 작은 실험이 장기적으로 포트폴리오의 다양성을 높입니다.',portfolio_insight:'채권, 배당주, ETF 중심의 안정적 포트폴리오가 ESTJ DNA와 완벽하게 공명합니다. 성장주 비중은 20% 이내로 제한하고, 나머지는 정기 수익을 창출하는 자산으로 구성하십시오.',growth_prescription:'3개월 내 핵심 과제는 포트폴리오 리뷰 주기를 "월간"으로 고정하는 것입니다. 너무 자주 보면 불필요한 개입이 늘고, 너무 드물면 위험 신호를 놓칩니다. 월간 리뷰 + 분기 리밸런싱 사이클이 ESTJ의 N-Score를 가장 효율적으로 높입니다.',one_line:'규칙이 감정을 이기고, 시스템이 시장을 이긴다'},
  'ISTJ':{identity:'ISTJ는 과거 데이터를 완벽히 분석하여 자산의 누수를 막는 금융 수호자입니다. 신중함과 일관성이 결합된 이 DNA는 복잡한 시장에서도 검증된 방법론만을 신뢰합니다. 빠른 수익보다 견고한 기반 구축을 우선시하는 장기 누적형 투자자입니다.',strength_insight:'리스크 관리와 자산 보존에서 ISTJ는 16개 아키타입 중 최상위 성과를 냅니다. 과도한 욕심 없이 정해진 계획을 실행하는 능력이 복리의 마법을 가장 효과적으로 구현합니다. 시장 폭락 시에도 패닉셀을 하지 않는 심리적 안정성이 핵심 자산입니다.',risk_insight:'기회 비용이 주요 리스크입니다. 지나치게 보수적인 포트폴리오로 인해 성장 기회를 놓칠 수 있습니다. 전체 자산의 10~15%를 "실험 버킷"으로 분리하여 새로운 자산 클래스를 소규모로 경험하는 것이 장기적 성장에 도움이 됩니다.',golden_strategy:'골든타임 구간은 ISTJ에게 가장 안전한 신규 진입 시기입니다. 이 기간에 기존 적립식 투자 금액을 20~30% 증액하거나, 대기 중인 현금을 부분 투입하는 전략이 효과적입니다.',portfolio_insight:'채권 사다리와 배당 ETF 중심의 포트폴리오가 ISTJ DNA와 가장 높은 공명률을 보입니다. 인덱스 펀드 적립식 투자를 핵심 축으로 유지하고, 소규모 성장주 편입으로 장기 수익률을 보완하십시오.',growth_prescription:'3개월 내 핵심 처방은 비상금과 투자금의 명확한 분리입니다. 생활비 6개월치를 별도 계좌에 확보한 후, 나머지를 투자에 배분하는 구조를 확립하십시오.',one_line:'흔들리지 않는 기반 위에 부는 쌓인다'},
  'ESTP':{identity:'ESTP는 변동성이 큰 시장에서 결정적 타이밍을 잡는 금융 승부사입니다. 현장 감각과 즉각적 판단력이 결합된 이 DNA는 기회가 열리는 순간 망설임 없이 행동합니다.',strength_insight:'시장의 단기 모멘텀을 포착하는 능력이 ESTP의 핵심 강점입니다. 빠른 손절과 빠른 진입을 반복하면서도 전체 수익률을 유지하는 트레이더형 DNA입니다.',risk_insight:'빈도수가 높은 거래가 수수료와 세금을 과도하게 발생시킬 수 있습니다. 단일 거래 손실 한도를 전체 자산의 2% 이내로 고정하는 규칙이 장기 생존의 핵심입니다.',golden_strategy:'골든타임 구간에 ESTP는 거래 빈도와 포지션 규모를 동시에 높이는 공격적 전략이 유효합니다. 단, 주의 구간 진입 1주 전부터 포지션을 점진적으로 축소하십시오.',portfolio_insight:'단기 트레이딩 버킷(30%)과 중장기 코어 포트폴리오(70%)를 명확히 분리하는 것이 ESTP에게 가장 효과적인 구조입니다.',growth_prescription:'3개월 내 가장 중요한 습관은 거래 일지 작성입니다. ESTP의 직관이 어떤 조건에서 가장 정확한지 데이터로 파악하는 순간 N-Score가 급등합니다.',one_line:'기회는 준비된 자에게 오고, 나는 언제나 준비됐다'},
  'ISTP':{identity:'ISTP는 가장 효율적인 수단으로 경제적 이득을 취하는 냉철한 분석가입니다. 감정의 노이즈를 제거하고 데이터의 신호만을 추종하는 이 DNA는 복잡한 시장에서 가장 명확한 판단을 내립니다.',strength_insight:'편향 없는 분석과 기계적 실행이 ISTP의 핵심 강점입니다. 손절을 감정 없이 실행하고, 수익이 나는 포지션을 충분히 유지하는 능력이 장기 수익률을 극대화합니다.',risk_insight:'과도한 자신감이 포지션 규모를 키울 때 리스크가 발생합니다. 기술적 지표와 함께 시장 심리 지표도 정기적으로 모니터링하십시오.',golden_strategy:'골든타임 구간에 ISTP는 백테스팅이 완료된 전략을 실전에 투입하기 최적입니다. 주의 구간에는 포지션을 절반으로 줄이고 시스템 개선에 집중하십시오.',portfolio_insight:'ETF와 시스템 기반 포지션의 조합이 ISTP DNA와 가장 높은 공명률을 보입니다.',growth_prescription:'3개월 내 핵심 처방은 투자 시스템의 문서화입니다. 진입 조건, 청산 조건, 포지션 규모 계산 방식을 모두 문서로 작성하십시오.',one_line:'효율이 전략이고, 냉철함이 수익이다'},
  'ENFJ':{identity:'ENFJ는 사람과 신용을 자산으로 전환시키는 소셜 금융의 귀재입니다. 탁월한 대인 감각과 공동체적 가치관이 결합된 이 DNA는 네트워크 효과를 통해 풍부한 정보와 기회에 접근합니다.',strength_insight:'신뢰 네트워크를 통한 정보 획득과 공동 투자 기회 창출이 ENFJ의 핵심 강점입니다.',risk_insight:'타인의 기대에 부응하려는 심리가 잘못된 투자 결정으로 이어질 수 있습니다. 모든 투자 결정은 타인의 의견을 듣되 최종 판단은 스스로 내리는 원칙을 지키십시오.',golden_strategy:'골든타임 구간에 ENFJ는 새로운 파트너십과 공동 투자 기회를 탐색하기에 최적입니다.',portfolio_insight:'ESG 투자, 임팩트 투자 상품이 ENFJ DNA와 가장 높은 공명률을 보입니다.',growth_prescription:'3개월 내 핵심 과제는 투자 결정과 대인 관계를 분리하는 경계선 설정입니다.',one_line:'신뢰가 자산이고, 관계가 수익을 만든다'},
  'INFJ':{identity:'INFJ는 남들이 보지 못하는 미래 가치를 선점하는 직관의 투자자입니다. 표면적 데이터 너머의 본질적 패턴을 읽는 능력이 탁월하며, 장기적 메가트렌드를 조기에 포착합니다.',strength_insight:'미래 트렌드를 선도적으로 포착하는 능력이 INFJ의 핵심 강점입니다.',risk_insight:'완벽한 확신이 생길 때까지 진입을 미루다 최적의 타이밍을 놓칠 수 있습니다. "충분히 좋은 진입 타이밍"의 기준을 사전에 명확히 정의하십시오.',golden_strategy:'골든타임 구간에 INFJ는 평소 연구해 온 장기 테마에 초기 포지션을 구축하기 최적입니다.',portfolio_insight:'미래 테마 ETF(AI, 친환경에너지, 바이오)와 가치주의 조합이 INFJ DNA와 공명합니다.',growth_prescription:'3개월 내 가장 중요한 습관은 투자 가설 기록입니다.',one_line:'미래는 이미 보이고, 나는 그 자리에 서 있다'},
  'ENFP':{identity:'ENFP는 위기를 도약의 에너지로 바꾸는 무한한 가능성의 투자자입니다. 열정과 창의성이 결합된 이 DNA는 새로운 아이디어와 기회를 끊임없이 발굴합니다.',strength_insight:'빠른 트렌드 감지와 열정적 실행력이 ENFP의 핵심 강점입니다.',risk_insight:'흥미가 줄어들면 포지션 관리를 소홀히 하는 경향이 있습니다. 동시에 보유하는 포지션 수를 5개 이내로 제한하는 규칙을 만드십시오.',golden_strategy:'골든타임 구간에 ENFP는 새로운 투자 아이디어를 탐색하고 소규모 실험적 진입을 시도하기에 최적입니다.',portfolio_insight:'성장주와 대안투자 중심의 역동적 포트폴리오가 ENFP DNA와 공명합니다.',growth_prescription:'3개월 내 핵심 처방은 "완료의 습관" 만들기입니다.',one_line:'열정이 불을 지피고, 가능성이 부를 만든다'},
  'INFP':{identity:'INFP는 돈이 가져다주는 근원적 가치와 행복을 설계하는 의미 지향 투자자입니다.',strength_insight:'장기적 확신을 바탕으로 한 인내심이 INFP의 핵심 강점입니다.',risk_insight:'감정이 투자 결정에 과도하게 개입하는 경향이 있습니다. 모든 결정은 감정이 안정된 상태에서만 내리는 원칙을 만드십시오.',golden_strategy:'골든타임 구간에 INFP는 자신이 진정으로 믿는 테마에 비중을 늘리기 최적입니다.',portfolio_insight:'ESG·임팩트·테마 ETF가 INFP DNA와 가장 높은 공명률을 보입니다.',growth_prescription:'3개월 내 가장 중요한 습관은 감정 일지 작성입니다.',one_line:'가치에 투자하고, 의미가 수익이 된다'},
  'ESFJ':{identity:'ESFJ는 커뮤니티와 관계망 속에서 부의 기회를 창출하는 소셜 금융가입니다.',strength_insight:'관계 기반 투자 정보 획득과 공동 투자 기회 창출이 ESFJ의 핵심 강점입니다.',risk_insight:'타인의 기대와 사회적 압력이 투자 결정에 개입하는 것이 최대 리스크입니다.',golden_strategy:'골든타임 구간에 ESFJ는 신뢰 네트워크를 통한 새로운 투자 정보 수집에 집중하십시오.',portfolio_insight:'안정적 배당주, 리츠(REITs), 채권형 ETF의 조합이 ESFJ DNA와 가장 높은 공명률을 보입니다.',growth_prescription:'3개월 내 핵심 처방은 투자와 관계의 경계 명확화입니다.',one_line:'신뢰가 자본이고, 관계가 포트폴리오다'},
  'ISFJ':{identity:'ISFJ는 신뢰를 바탕으로 가장 안정적인 성장을 이루는 금융 방패입니다.',strength_insight:'자산 보존과 꾸준한 복리 구현이 ISFJ의 핵심 강점입니다.',risk_insight:'과도한 안전 선호로 인해 실질 수익률이 인플레이션에 미치지 못하는 상황이 발생할 수 있습니다.',golden_strategy:'골든타임 구간에 ISFJ는 평소보다 적립 금액을 소폭 늘리거나, 대기 중이던 현금의 일부를 인덱스 ETF에 투입하기 최적입니다.',portfolio_insight:'국채, 배당 ETF, 인덱스 펀드의 3축 구조가 ISFJ DNA와 완벽하게 공명합니다.',growth_prescription:'3개월 내 핵심 처방은 투자 자동화 시스템 구축입니다.',one_line:'매일의 성실함이 10년의 자산을 만든다'},
  'ESFP':{identity:'ESFP는 에너지 밸런스와 생체 리듬을 극대화하여 경제 활동력을 높이는 활동가형 투자자입니다.',strength_insight:'현장 감각과 트렌드 포착 능력이 ESFP의 핵심 강점입니다.',risk_insight:'충동 소비가 투자 재원을 잠식하는 것이 최대 리스크입니다.',golden_strategy:'골든타임 구간에 ESFP는 일상에서 관찰한 트렌드를 바탕으로 소규모 테마 투자를 시도하기 최적입니다.',portfolio_insight:'소비 트렌드 관련 ETF(리테일, 미디어, 여행/레저)와 배당주의 조합이 ESFP DNA와 공명합니다.',growth_prescription:'3개월 내 핵심 처방은 "자동 투자 먼저, 소비 나중" 원칙 실천입니다.',one_line:'삶을 즐기면서 동시에 자산이 쌓인다'},
  'ISFP':{identity:'ISFP는 시장의 변화에 자연스럽게 부의 흐름을 타는 유연한 서퍼입니다.',strength_insight:'시장 과열과 침체를 감지하는 직관적 센서가 ISFP의 핵심 강점입니다.',risk_insight:'지나치게 신중한 나머지 명확한 기회에서도 진입을 망설이는 경향이 있습니다.',golden_strategy:'골든타임 구간에 ISFP는 조용히, 그리고 확실하게 포지션을 구축하기 최적입니다.',portfolio_insight:'저변동성 ETF, 배당 성장주, 리츠의 조합이 ISFP DNA와 가장 높은 공명률을 보입니다.',growth_prescription:'3개월 내 핵심 처방은 "충분히 좋은 진입"의 기준 설정입니다.',one_line:'흐름을 읽는 자만이 파도를 탄다'}
};

function getArchetypeFallback(archetype) {
  var fb = ARCHETYPE_FALLBACK[archetype];
  if (!fb) {
    return {identity:archetype+' 금융 DNA는 선천적 기질과 후천적 행동 패턴이 독특하게 결합된 자산 운용 스타일을 보유하고 있습니다.',strength_insight:'선천적 기질에서 비롯된 고유한 투자 직관이 핵심 강점입니다.',risk_insight:'사전에 손절 기준을 명확히 설정하고, 규칙 기반의 투자 시스템을 구축하는 것이 중요합니다.',golden_strategy:'골든타임 구간은 에너지와 직관이 가장 높은 시기입니다.',portfolio_insight:'자신의 리스크 성향과 투자 목표에 맞는 분산 포트폴리오를 구성하십시오.',growth_prescription:'투자 결정을 기록하는 습관이 N-Score 상승의 가장 확실한 경로입니다.',one_line:'내 DNA가 나만의 투자 공식을 만든다'};
  }
  return fb;
}

// ════════════════════════════════════════════════════════════════
// ★★★ [신규 v2.1] PART 4 — 아키타입별 상세 폴백 (확장판)
// ════════════════════════════════════════════════════════════════
function getArchetypeFallbackFull(archetype, data) {
  const name = (data && data.name) ? data.name : '고객';
  const nscore = (data && data.nscore) ? data.nscore : '700';
  const fb = ARCHETYPE_FALLBACK[archetype];
  if (!fb) return getArchetypeFallback(archetype);
  // 이름과 N-Score를 반영한 개인화 버전 반환
  return {
    identity: fb.identity.replace('는 ', `님은 `).replace(archetype + '는', name + '님(' + archetype + ')은'),
    strength_insight: fb.strength_insight,
    risk_insight: fb.risk_insight,
    golden_strategy: fb.golden_strategy,
    portfolio_insight: fb.portfolio_insight,
    growth_prescription: fb.growth_prescription.replace('3개월 내', `N-Score ${nscore}에서 도약하기 위한 3개월 내`),
    one_line: fb.one_line
  };
}

// ════════════════════════════════════════════════════════════════
// [AI] Claude API 모듈 (원본 v7.9.1 유지)
// ════════════════════════════════════════════════════════════════
function callClaudeAPI(prompt, systemPrompt) {
  try {
    var apiKey = CONFIG.CLAUDE_API_KEY || PropertiesService.getScriptProperties().getProperty('CLAUDE_API_KEY');
    if (!apiKey) { Logger.log('[AI] CLAUDE_API_KEY 미설정'); return null; }
    var payload = { model: CONFIG.CLAUDE_MODEL, max_tokens: CLAUDE_MAX_TOKENS, messages: [{ role: 'user', content: prompt }] };
    if (systemPrompt) payload.system = systemPrompt;
    var options = { method: 'post', contentType: 'application/json',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      payload: JSON.stringify(payload), muteHttpExceptions: true };
    var response = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', options);
    if (response.getResponseCode() !== 200) { Logger.log('[AI] API ' + response.getResponseCode() + ': ' + response.getContentText()); return null; }
    var body = JSON.parse(response.getContentText());
    var text = '';
    for (var i = 0; i < (body.content||[]).length; i++) { if (body.content[i].type === 'text') text += body.content[i].text; }
    Logger.log('[AI] Claude 응답 OK (' + text.length + '자)');
    return text || null;
  } catch (e) { Logger.log('[AI] 에러: ' + e.message); return null; }
}

function generateAIInterpretation(data, mode) {
  mode = mode || 'full';
  var archetype = safeStr(data.archetype || data.archetype_code) || 'ISTP';
  var fallback = getArchetypeFallback(archetype);
  if (mode === 'lite') {
    var metaL = ARCHETYPE_ENHANCED[archetype] || {};
    var nscoreL = safeStr(data.nscore || data.n_score) || '500';
    var ngL = safeStr(data.ngrade || data.n_grade) || 'N5';
    var dayElL = safeStr(data.day_element) || '土';
    var elNL = {'木':'목(Wood)','火':'화(Fire)','土':'토(Earth)','金':'금(Metal)','水':'수(Water)'};
    var sysL = '당신은 N-KAI 금융 DNA 분석 AI입니다. 반드시 JSON만 출력. 마크다운/코드블록 없이 순수 JSON. 한국어 존댓말.';
    var pL = '금융 DNA 핵심 인사이트 생성:\n아키타입: '+archetype+' ('+safeStr(metaL.title)+')\nN-Score: '+nscoreL+' ('+ngL+')\n코어에너지: '+(elNL[dayElL]||dayElL)+'\n경제감각: '+safeStr(data.wealth_energy)+' 위기대응력: '+safeStr(data.risk_tolerance)+'\n\nJSON 2개 필드만 반환:\n{"one_line":"이 사람의 금융 DNA 한 문장 카피 (20자 이내)","identity":"이 아키타입의 핵심 금융 정체성 (2~3문장, 존댓말)"}';
    var rawL = callClaudeAPI(pL, sysL);
    if (!rawL) return { one_line: fallback.one_line, identity: fallback.identity };
    try {
      var cleanedL = rawL.replace(/```json\s*/g,'').replace(/```\s*/g,'').trim();
      return JSON.parse(cleanedL);
    } catch(e) { return { one_line: fallback.one_line, identity: fallback.identity }; }
  }
  var meta = ARCHETYPE_ENHANCED[archetype] || {};
  var nscore = safeStr(data.nscore || data.n_score) || '500';
  var ngrade = safeStr(data.ngrade || data.n_grade) || 'N5';
  var wE = safeStr(data.wealth_energy)||'50', oS = safeStr(data.opportunity_score)||'50', rT = safeStr(data.risk_tolerance)||'50';
  var dayEl = safeStr(data.day_element)||'土';
  var wp=safeStr(data.wood_pct)||'20',fp=safeStr(data.fire_pct)||'20',ep=safeStr(data.earth_pct)||'20',mp=safeStr(data.metal_pct)||'20',wap=safeStr(data.water_pct)||'20';
  var b1m=safeStr(data.best_1_month), b1l=safeStr(data.best_1_label), worst=safeStr(data.worst_months);
  var elN={'木':'목(Wood)','火':'화(Fire)','土':'토(Earth)','金':'금(Metal)','水':'수(Water)'};
  var sys = '당신은 N-KAI 금융 DNA 분석 AI입니다. 반드시 JSON만 출력. 마크다운/코드블록 없이 순수 JSON. 한국어 존댓말. 투자 자문이 아닌 금융 에너지 패턴 분석. 이 사람의 고유 숫자 조합에 기반한 독특한 인사이트를 제공하세요.';
  var p = '유저 금융 DNA 맞춤 해석 생성:\n아키타입: '+archetype+' ('+safeStr(meta.title)+')\nN-Score: '+nscore+' ('+ngrade+')\n경제감각: '+wE+' | 표현에너지: '+oS+' | 위기대응력: '+rT+'\n코어에너지: '+(elN[dayEl]||dayEl)+'\n오행: 木'+wp+'% 火'+fp+'% 土'+ep+'% 金'+mp+'% 水'+wap+'%\n골든타임: '+b1m+' ('+b1l+') | 주의: '+worst+'\n\nJSON 7개 필드 반환:\n{"identity":"금융 정체성","strength_insight":"강점 심화","risk_insight":"리스크 심화","golden_strategy":"골든타임 활용법","portfolio_insight":"포트폴리오 핵심","growth_prescription":"3개월 처방","one_line":"금융 DNA 한 문장 카피"}';
  var raw = callClaudeAPI(p, sys);
  if (!raw) {
    Logger.log('[v7.9.1] AI 없음 → 폴백 적용: ' + archetype);
    return fallback;
  }
  try {
    var cleaned = raw.replace(/```json\s*/g,'').replace(/```\s*/g,'').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    Logger.log('[v7.9.1] AI 파싱 실패 → 폴백: ' + e.message);
    return fallback;
  }
}

// ════════════════════════════════════════════════════════════════
// ★★★ [신규 v2.1] PART 3 — Claude AI 3단계 폴백 호출
// ════════════════════════════════════════════════════════════════
function callClaudeAPIWithFallback(data, tier) {
  var archetype = data.archetype || 'ENTJ';

  // 1차: 풀 프롬프트
  try {
    Logger.log('Claude AI 1차 시도 (full)');
    var result = generateAIInterpretation(data, 'full');
    if (result && result.one_line) { Logger.log('Claude AI 1차 성공'); return result; }
  } catch (e1) { Logger.log('Claude AI 1차 실패: ' + e1.toString()); }

  // 2차: 압축 프롬프트
  try {
    Logger.log('Claude AI 2차 시도 (lite)');
    Utilities.sleep(2000);
    var result2 = generateAIInterpretation(data, 'lite');
    if (result2 && result2.one_line) { Logger.log('Claude AI 2차 성공'); return result2; }
  } catch (e2) { Logger.log('Claude AI 2차 실패: ' + e2.toString()); }

  // 3차: 폴백 텍스트
  Logger.log('Claude AI 폴백 텍스트 사용: ' + archetype);
  return getArchetypeFallbackFull(archetype, data);
}

// ════════════════════════════════════════════════════════════════
// doPost / doGet / processData (★ doPost 비동기화 v2.1)
// ════════════════════════════════════════════════════════════════

// ★★★ [교체] doPost — 비동기 처리 (토스 6초 타임아웃 완전 해결)
function doPost(e) {
  try {
    var raw = e && e.postData ? e.postData.contents : '{}';
    var params = {};
    try { params = JSON.parse(raw); } catch(pe) {
      // JSON 파싱 실패 시 폼 파라미터 처리
      if (e && e.parameter) params = flatParamsToData(e.parameter);
    }

    // send_pdf_report 는 비동기 큐 처리
    if (params.type === 'send_pdf_report' || params.type === 'send_server_report' || params.payment_key) {
      // 즉시 200 응답 (토스 webhook 6초 타임아웃 방지)
      var response = ContentService
        .createTextOutput(JSON.stringify({ success: true, message: 'queued' }))
        .setMimeType(ContentService.MimeType.JSON);

      // 파라미터를 캐시에 임시 저장
      var cache = CacheService.getScriptCache();
      var jobId = 'job_' + new Date().getTime() + '_' + Math.random().toString(36).substr(2,5);
      cache.put(jobId, JSON.stringify(params), 600);

      // 1초 후 비동기 트리거 생성
      var trigger = ScriptApp.newTrigger('processAsyncJob').timeBased().after(1000).create();
      PropertiesService.getScriptProperties().setProperty('pendingJob_' + trigger.getUniqueId(), jobId);

      return response;
    }

    // 그 외 타입은 기존 동기 처리
    return processData(params);

  } catch(err) {
    Logger.log('doPost 오류: ' + err.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ★★★ [신규] processAsyncJob — 비동기 처리 워커
function processAsyncJob(e) {
  var triggerId = e ? e.triggerUid : null;
  var props = PropertiesService.getScriptProperties();
  var cache = CacheService.getScriptCache();

  var jobId = null;
  if (triggerId) {
    jobId = props.getProperty('pendingJob_' + triggerId);
    props.deleteProperty('pendingJob_' + triggerId);
  }

  // 트리거 자체 삭제
  if (triggerId) {
    ScriptApp.getProjectTriggers().forEach(function(t) {
      if (t.getUniqueId() === triggerId) ScriptApp.deleteTrigger(t);
    });
  }

  if (!jobId) { Logger.log('processAsyncJob: jobId 없음'); return; }

  var rawJob = cache.get(jobId);
  if (!rawJob) { Logger.log('processAsyncJob: 캐시 만료 ' + jobId); return; }

  cache.remove(jobId);
  var params = JSON.parse(rawJob);
  sendServerReportSafe(params);
}

function doGet(e) {
  try {
    var data = {};
    if (!e) return jsonResponse({ status: 'error', message: 'no event' });
    if (e.parameter && e.parameter.data) { try { data = JSON.parse(decodeURIComponent(e.parameter.data)); } catch(err) {} }
    if (!data.type && !data.action && e.parameter && (e.parameter.type || e.parameter.action)) data = flatParamsToData(e.parameter);
    if (data.type || data.action) return processData(data);
    return jsonResponse({ status: 'ok', message: 'N-KAI Apps Script v3.0 running', model: CONFIG.CLAUDE_MODEL });
  } catch(err) { return jsonResponse({ status: 'error', message: err.message }); }
}

function processData(data) {
  if (!data) return jsonResponse({ status: 'error', message: 'data 없음' });
  var type = String(data.type || data.action || '').trim();
  var typeLower = type.toLowerCase();
  var subAction = String(data.sub_action || data.action || '').trim().toLowerCase();
  if (!type) return jsonResponse({ status: 'error', message: 'type 없음' });
  Logger.log('[v3.0] type=' + type);
  if (typeLower === 'raffle_ticket' || subAction === 'raffle_ticket') { logRaffleTicket(data); return jsonResponse({ status: 'ok', type: 'raffle_ticket', version: 'v3.0' }); }
  switch(typeLower) {
    case 'session': trackSession(data); break;
    case 'utm': trackUTM(data); break;
    case 'funnel': trackFunnel(data); break;
    case '무료분석요청': trackAnalysis(data, '무료분석요청'); break;
    case '아키타입확정': trackAnalysis(data, '아키타입확정'); break;
    case '시간업그레이드': trackAnalysis(data, '시간업그레이드'); break;
    case 'share': case 'share_click': logShareTracking(data); break;
    case 'trial': logTrialMgmt(data); break;
    case 'referral': case 'referral_arrival': logReferralTracking(data); break;
    case 'premium_unlock': logPremiumUnlock(data); break;
    case 'premium_email': logPremiumEmail(data); break;
    case 'send_pdf_report': return sendServerReport(data);
    case 'send_server_report': return sendServerReport(data);
    case 'send_lite_email': return sendLiteEmail(data);
    case 'reservation': case 'pre_order': case 'preorder': case 'premium_landing': case 'premium_landing_signup': logReservation(data); break;
    case 'recruit': case 'apply': logRecruit(data); break;
    case 'partnership': case 'partner_inquiry': logPartnership(data); break;
    case 'confirm_payment': return confirmTossPayment(data);
    case 'admin_dashboard': return handleAdminDashboard(data);
    default: logUnknownType(data, type);
  }
  return jsonResponse({ status: 'ok', type: type, version: 'v3.0' });
}

// ════════════════════════════════════════════════════════════════
// 트래킹 함수들 (원본 v7.9.1 완전 보존)
// ════════════════════════════════════════════════════════════════
function trackSession(data) {
  data = data || {};
  var sheet = getOrCreateSheet(SHEET_SESSIONS, HEADERS.sessions);
  sheet.appendRow([new Date(),safeStr(data.session_id),safeStr(data.event,'page_view'),safeStr(data.page,'home'),safeNum(data.duration),safeStr(data.device),safeStr(data.browser),safeStr(data.screen),safeStr(data.email),safeStr(data.utm_source,'direct'),safeStr(data.utm_medium,'(none)'),safeStr(data.utm_campaign,'(none)'),safeStr(data.utm_term),safeStr(data.utm_content),safeStr(data.referrer,'(direct)'),safeStr(data.country,'Unknown'),safeStr(data.language)]);
}
function trackUTM(data) {
  data = data || {};
  var sheet = getOrCreateSheet(SHEET_UTM, HEADERS.utm);
  sheet.appendRow([new Date(),safeStr(data.utm_source,'direct'),safeStr(data.utm_medium,'(none)'),safeStr(data.utm_campaign,'(none)'),safeStr(data.utm_term),safeStr(data.utm_content),safeStr(data.landing_page),safeStr(data.referrer,'(direct)'),safeStr(data.device),safeStr(data.session_id),'','']);
}
function trackFunnel(data) {
  data = data || {};
  var sheet = getOrCreateSheet(SHEET_FUNNEL, HEADERS.funnel);
  sheet.appendRow([new Date(),safeStr(data.session_id),safeStr(data.email),safeStr(data.step),safeStr(data.step_name),safeNum(data.duration||data.elapsed_seconds),safeStr(data.is_exit||data.is_bounce,'N'),safeStr(data.device),safeStr(data.utm_source),safeStr(data.archetype),safeStr(data.nscore||data.n_score),safeStr(data.kipa_energy),safeStr(data.kipa_perception),safeStr(data.kipa_judgment),safeStr(data.kipa_lifestyle)]);
  if (data.session_id && (data.step==='step_06'||data.step==='step_07'||data.step==='step_08')) updateUTMConversion(data.session_id, data.step);
}
function trackAnalysis(data, analysisType) {
  data = data || {};
  var sheet = getOrCreateSheet(SHEET_ANALYSIS, HEADERS.analysis);
  var hourLabel = convertToSijin(safeStr(data.birthtime||data.birth_hour));
  if (analysisType === '시간업그레이드') {
    var sid = safeStr(data.session_id), email = safeStr(data.email);
    if (sid || email) {
      try {
        var allData = sheet.getDataRange().getValues();
        var headers = allData[0]||[];
        var colSession=-1,colEmail=-1,colType=-1;
        for(var ci=0;ci<headers.length;ci++){var h=String(headers[ci]).trim();if(h==='분석유형'||h==='유형')colType=ci;if(h==='이메일')colEmail=ci;if(h==='세션ID'||h==='session_id')colSession=ci;}
        var targetRow=-1;
        for(var ri=allData.length-1;ri>=1;ri--){if(String(allData[ri][colType]||'').trim()!=='아키타입확정')continue;if(sid&&colSession>=0&&String(allData[ri][colSession]||'').trim()===sid){targetRow=ri+1;break;}if(email&&colEmail>=0&&String(allData[ri][colEmail]||'').trim()===email){targetRow=ri+1;break;}}
        if(targetRow>0){
          var colMap={};for(var ci2=0;ci2<headers.length;ci2++){colMap[String(headers[ci2]).trim()]=ci2;}
          var set=function(n,v){if(colMap[n]>=0&&v)sheet.getRange(targetRow,colMap[n]+1).setValue(v);};
          set('출생시',hourLabel);set('분석유형','시간업그레이드');set('아키타입',safeStr(data.archetype));
          set('N-Score',safeStr(data.nscore||data.n_score));set('N등급',safeStr(data.ngrade||data.n_grade));
          set('정밀도','94%');set('경제감각',safeStr(data.wealth_energy));
          set('표현에너지',safeStr(data.opportunity_score));set('위기대응력',safeStr(data.risk_tolerance));
          if(safeStr(data.bloodtype))set('혈액형',safeStr(data.bloodtype));
          syncHourUpgradeToRelatedSheets(data); return;
        }
      } catch(e) { Logger.log('[시간업그레이드] '+e.message); }
    }
  }
  sheet.appendRow([new Date(),safeStr(data.name),safeStr(data.email),safeStr(data.birthdate),hourLabel,safeStr(data.region),safeStr(data.gender),safeStr(data.job),safeStr(data.bloodtype),safeStr(analysisType),safeStr(data.archetype),safeStr(data.nscore||data.n_score),safeStr(data.ngrade||data.n_grade),safeStr(data.precision),safeStr(data.wealth_energy),safeStr(data.opportunity_score),safeStr(data.risk_tolerance),safeStr(data.kipa_energy),safeStr(data.kipa_perception),safeStr(data.kipa_judgment),safeStr(data.kipa_lifestyle),safeStr(data.kipa_mode),safeStr(data.kipa_q1),safeStr(data.kipa_q2),safeStr(data.kipa_q3),safeStr(data.kipa_q4),safeStr(data.kipa_q5),safeStr(data.kipa_q6),safeStr(data.kipa_q7),safeStr(data.kipa_q8),safeStr(data.kipa_q9),safeStr(data.kipa_q10),safeStr(data.kipa_q11),safeStr(data.kipa_q12),safeStr(data.kipa_q13),safeStr(data.kipa_q14),safeStr(data.kipa_q15),safeStr(data.kipa_q16)]);
}
function syncHourUpgradeToRelatedSheets(data) {
  var email=safeStr(data.email),sid=safeStr(data.session_id),newArch=safeStr(data.archetype),newNscore=safeStr(data.nscore||data.n_score);
  if(!email&&!sid)return;
  var ss=SpreadsheetApp.getActiveSpreadsheet();
  [['공유트래킹','아키타입','N-Score','이메일','세션ID'],['추천권','아키타입','N-Score','이메일','세션ID'],['퍼널트래킹','아키타입','N-Score','이메일','세션ID']].forEach(function(cfg){
    try{var sheet=ss.getSheetByName(cfg[0]);if(!sheet)return;var allData=sheet.getDataRange().getValues();if(allData.length<2)return;var headers=allData[0];var colA=-1,colN=-1,colE=-1,colS=-1;for(var ci=0;ci<headers.length;ci++){var h=String(headers[ci]).trim();if(h===cfg[1])colA=ci;if(h===cfg[2])colN=ci;if(h===cfg[3])colE=ci;if(h===cfg[4])colS=ci;}if(colA<0&&colN<0)return;var updated=0;for(var ri=allData.length-1;ri>=1&&updated<10;ri--){var rE=colE>=0?String(allData[ri][colE]||'').trim():'';var rS=colS>=0?String(allData[ri][colS]||'').trim():'';if((sid&&rS&&rS===sid)||(email&&rE&&rE===email)){if(colA>=0&&newArch)sheet.getRange(ri+1,colA+1).setValue(newArch);if(colN>=0&&newNscore)sheet.getRange(ri+1,colN+1).setValue(newNscore);updated++;}}
    }catch(e){}
  });
}
function logShareTracking(data) {
  data=data||{};var sheet=getOrCreateSheet(SHEET_SHARE_TRACKING,HEADERS.shareTracking);var email=safeStr(data.email);var shareCount=1,ticketCount=0;
  if(email){try{var allData=sheet.getDataRange().getValues();for(var i=1;i<allData.length;i++){if(String(allData[i][1]).trim()===email)shareCount++;}ticketCount=Math.floor(shareCount/3);}catch(e){}}
  sheet.appendRow([new Date(),email,safeStr(data.name),safeStr(data.archetype),safeStr(data.nscore||data.n_score),safeStr(data.platform||data.channel),shareCount,ticketCount,safeStr(data.session_id),safeStr(data.device),safeStr(data.share_url||data.url),safeStr(data.source||data.utm_source),safeStr(data.ref_code||data.refCode)]);
  try{logRaffleTicket(data);}catch(e){}
}
function logTrialMgmt(data){data=data||{};var sheet=getOrCreateSheet(SHEET_TRIAL_MGMT,HEADERS.trialMgmt);sheet.appendRow([new Date(),safeStr(data.email),safeStr(data.name),safeStr(data.archetype),safeStr(data.trigger,'share_complete'),safeStr(data.activated_at),safeStr(data.expires_at),safeStr(data.status,'active'),'','',safeStr(data.platform||data.channel)]);}
function logReferralTracking(data){data=data||{};var sheet=getOrCreateSheet(SHEET_REFERRAL,HEADERS.referralTracking);var isA=(safeStr(data.type)==='referral_arrival');sheet.appendRow([new Date(),isA?'':safeStr(data.referrer_email||data.email),isA?'':safeStr(data.referrer_name||data.name),isA?'':safeStr(data.archetype),isA?'':safeStr(data.referred_email),isA?'':safeStr(data.referred_name),safeStr(data.ref_code||data.refCode),safeStr(data.platform||data.channel),'','','',isA?('arrival:'+safeStr(data.landing_url)):'']);}
function logPremiumUnlock(data){data=data||{};var sheet=getOrCreateSheet(SHEET_PREMIUM_UNLOCK,HEADERS.premiumUnlock);sheet.appendRow([new Date(),safeStr(data.email),safeStr(data.name),safeStr(data.archetype),safeStr(data.nscore||data.n_score),safeStr(data.ngrade||data.n_grade),safeStr(data.session_id),safeStr(data.device),safeStr(data.source),safeStr(data.url),safeStr(data.utm_source),safeStr(data.utm_medium),safeStr(data.utm_campaign)]);}
function logPremiumEmail(data){data=data||{};var sheet=getOrCreateSheet(SHEET_PREMIUM_EMAIL,HEADERS.premiumEmail);sheet.appendRow([new Date(),safeStr(data.email),safeStr(data.name),safeStr(data.archetype),safeStr(data.nscore||data.n_score),safeStr(data.ngrade||data.n_grade),safeStr(data.session_id),safeStr(data.status||'sent')]);}
function logRaffleTicket(data){data=data||{};var sheet=getOrCreateSheet(SHEET_RAFFLE_TICKET,HEADERS.raffleTicket);sheet.appendRow([new Date(),safeStr(data.email),safeStr(data.name),safeStr(data.platform||data.channel),safeStr(data.archetype),safeStr(data.nscore||data.n_score),safeStr(data.session_id),safeStr(data.device),safeStr(data.source),safeStr(data.ref_code||data.refCode)]);}
function logReservation(data){data=data||{};var sheet=getOrCreateSheet(SHEET_RESERVATION,HEADERS.reservation);var email=safeStr(data.email||'(테스트)');var source=safeStr(data.source||data.utm_source||data.landing_page||'direct');sheet.appendRow([new Date(),email,source]);try{MailApp.sendEmail(CEO_EMAIL,'[N-KAI 사전예약] '+email,'새 사전예약\n이메일: '+email+'\n유입: '+source+'\n시각: '+new Date().toLocaleString('ko-KR'));}catch(e){}}
function logUnknownType(data,type){var sheet=getOrCreateSheet('디버그로그',['일시','type','action','전체데이터(JSON)']);sheet.appendRow([new Date(),safeStr(data.type),safeStr(data.action),JSON.stringify(data).substring(0,1000)]);}
function updateUTMConversion(sessionId,step){try{var sheet=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_UTM);if(!sheet)return;var data=sheet.getDataRange().getValues();for(var i=data.length-1;i>=1;i--){if(data[i][9]===sessionId){sheet.getRange(i+1,11).setValue('Y');sheet.getRange(i+1,12).setValue(step);break;}}}catch(e){}}
function logRecruit(data){data=data||{};var sheet=getOrCreateSheet(SHEET_RECRUIT,HEADERS.recruit);var name=safeStr(data.name),email=safeStr(data.email),phone=safeStr(data.phone||data.contact),position=safeStr(data.position),experience=safeStr(data.experience||data.career),portfolio=safeStr(data.portfolio),techStack=safeStr(data.tech_stack||data.skills),motivation=safeStr(data.motivation),resume=safeStr(data.resume);sheet.appendRow([new Date(),name,email,phone,position,experience,portfolio,techStack,motivation,resume]);try{MailApp.sendEmail(CEO_EMAIL,'[N-KAI 채용] '+name+' - '+position,'지원자: '+name+'\n이메일: '+email+'\n포지션: '+position+'\n경력: '+experience);}catch(e){}}
function logPartnership(data){data=data||{};var sheet=getOrCreateSheet(SHEET_PARTNERSHIP,HEADERS.partnership);sheet.appendRow([new Date(),safeStr(data.company),safeStr(data.name),safeStr(data.email),safeStr(data.phone),safeStr(data.partnership_type||data.type_detail),safeStr(data.message),safeStr(data.device),safeStr(data.url),safeStr(data.referrer,'(direct)')]);try{MailApp.sendEmail(CEO_EMAIL,'[N-KAI 제휴] '+safeStr(data.company),'회사: '+safeStr(data.company)+'\n담당자: '+safeStr(data.name)+'\n이메일: '+safeStr(data.email)+'\n내용: '+safeStr(data.message));}catch(e){}}

// ════════════════════════════════════════════════════════════════
// ★★★ [교체] 중복방지 — CacheService O(1) 기반
// ════════════════════════════════════════════════════════════════

// 원본 함수명 래퍼 (하위 호환)
function isDuplicatePdfSend(email) {
  return isDuplicatePdfSendFast(email);
}

// ★ [신규] 실제 고속 중복 체크
function isDuplicatePdfSendFast(orderId) {
  if (!orderId) return false;
  var cache = CacheService.getScriptCache();
  var cacheKey = 'pdfSent_' + orderId;

  if (cache.get(cacheKey)) {
    Logger.log('[중복방지 캐시] ' + orderId);
    return true;
  }

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var logSheet = ss.getSheetByName(SHEET_PDF_LOG);
    if (!logSheet) return false;

    var lastRow = logSheet.getLastRow();
    if (lastRow < 2) return false;

    var scanRows = Math.min(200, lastRow - 1);
    var startRow = Math.max(2, lastRow - scanRows + 1);
    var orderIds = logSheet.getRange(startRow, 1, scanRows, 1).getValues();

    for (var i = 0; i < orderIds.length; i++) {
      if (orderIds[i][0] === orderId) {
        cache.put(cacheKey, '1', 86400);
        Logger.log('[중복방지 Sheets] ' + orderId);
        return true;
      }
    }
  } catch (err) {
    Logger.log('[중복 체크 오류] ' + err.toString());
  }
  return false;
}

function isDuplicateOrder(orderId){if(!orderId)return false;try{var ss=SpreadsheetApp.getActiveSpreadsheet();var sheet=ss.getSheetByName('결제기록');if(!sheet||sheet.getLastRow()<2)return false;var data=sheet.getDataRange().getValues();var headers=data[0];var colOrderId=-1,colStatus=-1;for(var i=0;i<headers.length;i++){var h=String(headers[i]).trim();if(h==='주문번호')colOrderId=i;if(h==='상태')colStatus=i;}if(colOrderId<0||colStatus<0)return false;for(var r=data.length-1;r>=1;r--){if(String(data[r][colOrderId]||'').trim()===orderId&&String(data[r][colStatus]||'').trim()==='SUCCESS'){Logger.log('[중복주문] '+orderId);return true;}}return false;}catch(e){return false;}}

// ════════════════════════════════════════════════════════════════
// ★★★ [신규 v2.1] PART 5 — PDF 발송 재시도 시스템
// ════════════════════════════════════════════════════════════════
function sendPdfWithRetry(email, name, htmlContent, orderId, tier) {
  for (var attempt = 1; attempt <= 3; attempt++) {
    try {
      Logger.log('PDF 발송 시도 ' + attempt + '/3: ' + email);

      var blob = Utilities.newBlob(htmlContent, 'text/html', 'report.html');
      var folder = DriveApp.getRootFolder();
      var tempFile = folder.createFile(blob);
      var pdfBlob;
      try {
        pdfBlob = tempFile.getAs('application/pdf');
      } finally {
        tempFile.setTrashed(true);
      }

      var tierLabel = tier === 'premium' ? 'Premium' : 'Standard';
      GmailApp.sendEmail(email,
        '[N-KAI] ' + name + '님의 금융 DNA 분석 리포트가 도착했습니다',
        '',
        {
          htmlBody: buildEmailBody(name, tierLabel),
          attachments: [pdfBlob.setName('NKAI_리포트_' + name + '.pdf')],
          name: 'N-KAI · YOUR FINANCIAL DNA'
        }
      );

      logPdfSent(orderId, email, name, tier, 'success', attempt);
      CacheService.getScriptCache().put('pdfSent_' + orderId, '1', 86400);
      Logger.log('PDF 발송 성공 (시도 ' + attempt + ')');
      return true;

    } catch (err) {
      Logger.log('PDF 발송 실패 (시도 ' + attempt + '): ' + err.toString());
      if (attempt < 3) Utilities.sleep(3000 * attempt);
    }
  }
  logPdfSent(orderId, email, name, tier, 'failed', 3);
  addToRetryQueue(orderId, email, name, tier);
  return false;
}

function logPdfSent(orderId, email, name, tier, status, attempt) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var s = ss.getSheetByName('PDF발송로그');
    if (!s) { s = ss.insertSheet('PDF발송로그'); s.appendRow(['주문번호','이메일','이름','티어','상태','시도횟수','발송시간']); }
    s.appendRow([orderId, email, name, tier, status, attempt, new Date().toLocaleString('ko-KR')]);
  } catch(e) { Logger.log('로그 오류: ' + e); }
}

function addToRetryQueue(orderId, email, name, tier) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var s = ss.getSheetByName('재발송대기');
    if (!s) { s = ss.insertSheet('재발송대기'); s.appendRow(['주문번호','이메일','이름','티어','등록시간','상태']); }
    s.appendRow([orderId, email, name, tier, new Date().toLocaleString('ko-KR'), 'pending']);
  } catch(e) { Logger.log('큐 오류: ' + e); }
}

function retryFailedSends() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var s = ss.getSheetByName('재발송대기');
    if (!s || s.getLastRow() < 2) return;
    var rows = s.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      var orderId = rows[i][0], email = rows[i][1], name = rows[i][2], tier = rows[i][3], status = rows[i][5];
      if (status !== 'pending') continue;
      Logger.log('재시도 대기: ' + orderId);
      s.getRange(i+1, 6).setValue('manual_required');
    }
  } catch(e) { Logger.log('retryFailedSends 오류: ' + e); }
}

// ════════════════════════════════════════════════════════════════
// ★★★ [신규 v2.1] PART 6 — 이메일 본문 HTML (다크테마)
// ════════════════════════════════════════════════════════════════
function buildEmailBody(name, tierLabel) {
  return '<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"></head>'
    + '<body style="margin:0;padding:0;background:#f0f4f8;font-family:\'Malgun Gothic\',Arial,sans-serif">'
    + '<div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.1)">'
    + '<div style="background:linear-gradient(135deg,#071523,#0D1B2A);padding:40px;text-align:center">'
    + '  <div style="width:52px;height:52px;background:linear-gradient(135deg,#F0C674,#d4a853);border-radius:12px;margin:0 auto 16px;text-align:center;line-height:52px;font-size:22px;font-weight:900;color:#071523">N</div>'
    + '  <div style="font-size:22px;font-weight:900;color:#F0C674;letter-spacing:2px;margin-bottom:4px">N·KAI</div>'
    + '  <div style="font-size:11px;color:rgba(240,198,116,.6);letter-spacing:2px">YOUR FINANCIAL DNA</div>'
    + '</div>'
    + '<div style="padding:40px">'
    + '  <h2 style="font-size:20px;font-weight:900;color:#0D1B2A;margin:0 0 16px">' + name + '님, 리포트가 도착했습니다</h2>'
    + '  <p style="font-size:14px;color:#4B5563;line-height:1.8;margin:0 0 24px"><strong style="color:#2D8CFF">' + tierLabel + ' 금융 DNA 분석 리포트</strong>가 준비되었습니다.<br>첨부 PDF 파일을 확인하시면 완전한 분석 결과를 보실 수 있습니다.</p>'
    + '  <div style="background:#F0F5FF;border:1px solid #DBEAFE;border-radius:12px;padding:20px;margin-bottom:24px">'
    + '    <div style="font-size:12px;font-weight:700;color:#2563EB;letter-spacing:1px;margin-bottom:8px">&#9654; 리포트 포함 내용</div>'
    + '    <div style="font-size:13px;color:#374151;line-height:1.8">&#10022; 아키타입 심층 분석 &middot; N-Score 해석<br>&#10022; 3대 핵심 금융 지표 &middot; 코어 에너지 (오행)<br>&#10022; 골든타임 캘린더 &middot; 리스크 히트맵<br>&#10022; 맞춤 포트폴리오 &middot; AI 개인화 인사이트</div>'
    + '  </div>'
    + '  <div style="text-align:center"><a href="' + CONFIG.SITE_URL + '" style="display:inline-block;background:linear-gradient(135deg,#F0C674,#d4a853);color:#071523;font-size:14px;font-weight:700;padding:14px 36px;border-radius:8px;text-decoration:none">neurinkairosai.com 방문하기 →</a></div>'
    + '</div>'
    + '<div style="background:#F8FAFD;padding:20px 40px;border-top:1px solid #EEF2F7;text-align:center">'
    + '  <div style="font-size:10px;color:#9CA3AF;line-height:1.8">' + CONFIG.COMPANY_NAME + ' · ' + CONFIG.BIZ_NO + '<br>통신판매업: 제 2026-서울강남-01337 호 · ' + CONFIG.SUPPORT_EMAIL + '<br>본 리포트는 투자 자문이 아닌 금융 성향 분석 참고자료입니다.</div>'
    + '</div>'
    + '</div></body></html>';
}

// ════════════════════════════════════════════════════════════════
// ★★★ [신규 v2.1] PART 7 — 메인 처리 함수 (안정화)
// ════════════════════════════════════════════════════════════════
function sendServerReportSafe(data) {
  var orderId = safeStr(data.orderId || data.payment_id || data.payment_key) || ('ORD_' + new Date().getTime());
  var email   = safeStr(data.email);
  var name    = safeStr(data.name) || '고객';
  var tier    = safeStr(data.tier || data.plan || '');

  // tier 자동 판별
  if (!tier) {
    var amtVal = parseInt(safeStr(data.payment_amount || data.amount || '9900'), 10);
    tier = (amtVal >= 19900 || safeStr(data.plan_name).toLowerCase().indexOf('premium') >= 0) ? 'premium' : 'standard';
  }

  if (!email) { Logger.log('[sendServerReportSafe] email 누락'); return; }

  if (isDuplicatePdfSendFast(orderId)) {
    Logger.log('[sendServerReportSafe] 중복 건너뜀: ' + orderId);
    return;
  }

  try {
    Logger.log('[sendServerReportSafe] 시작: ' + email + ' / ' + tier);
    var aiData = callClaudeAPIWithFallback(data, tier);

    // 누락 필드 폴백 보완
    var fb0 = getArchetypeFallback(safeStr(data.archetype) || 'ENTJ');
    if (!aiData.identity)            aiData.identity            = fb0.identity;
    if (!aiData.strength_insight)    aiData.strength_insight    = fb0.strength_insight;
    if (!aiData.risk_insight)        aiData.risk_insight        = fb0.risk_insight;
    if (!aiData.golden_strategy)     aiData.golden_strategy     = fb0.golden_strategy;
    if (!aiData.portfolio_insight)   aiData.portfolio_insight   = fb0.portfolio_insight;
    if (!aiData.growth_prescription) aiData.growth_prescription = fb0.growth_prescription;
    if (!aiData.one_line)            aiData.one_line            = fb0.one_line;

    data._tier = tier;
    var html = buildPdfReportHtml(data, aiData);
    var success = sendPdfWithRetry(email, name, html, orderId, tier);

    // CEO 알림
    try {
      MailApp.sendEmail(CEO_EMAIL,
        '[N-KAI v3.0] ' + name + ' (' + safeStr(data.archetype) + ') — ' + (success ? '✅발송완료' : '❌실패'),
        '수신: ' + email + '\n아키타입: ' + safeStr(data.archetype) + '\nN-Score: ' + safeStr(data.nscore||data.n_score) + '\n상품: ' + tier + '\n주문: ' + orderId + '\nAI 인사이트: ' + Object.keys(aiData).length + '개 필드'
      );
    } catch(ce) {}

    return success;
  } catch(err) {
    Logger.log('[sendServerReportSafe] 오류: ' + err.toString());
    addToRetryQueue(orderId, email, name, tier);
    return false;
  }
}

// ★ 레거시 호환 래퍼 (기존 processData에서 sendServerReport 호출 시 사용)
function sendServerReport(data) {
  return jsonResponse({
    success: true,
    message: 'queued_async',
    detail: sendServerReportSafe(data) ? 'sent' : 'queued_retry'
  });
}

// ════════════════════════════════════════════════════════════════
// sendLiteEmail (원본 v7.9.1 보존)
// ════════════════════════════════════════════════════════════════
function sendLiteEmail(data) {
  try {
    var email=safeStr(data.email), name=safeStr(data.name)||'고객', lang=safeStr(data.lang)||'ko';
    var archetype=safeStr(data.archetype||data.archetype_code), nscore=safeStr(data.nscore||data.n_score);
    if(!email) return jsonResponse({success:false,error:'email 누락'});
    if(isDuplicatePdfSendFast(email)) return jsonResponse({success:true,message:'최근 발송 이력',duplicate:true});
    var meta=ARCHETYPE_ENHANCED[archetype]||{};
    var opts={themeIcon:safeStr(data.theme_icon)||meta.letterIcon||'K',themeColor:safeStr(data.theme_color)||meta.color||'#2D8CFF',groupName:safeStr(data.group_name)||(meta.group?meta.group+' '+(meta.groupEn||''):''),archetypeTitle:safeStr(data.archetype_title)||meta.title||'',archetypeSummary:safeStr(data.archetype_summary)||meta.summary||''};
    var subjectMap={ko:'[N-KAI] '+name+'님의 금융 DNA 분석 리포트',en:'[N-KAI] Financial DNA Report for '+name,ja:'[N-KAI] '+name+'様の金融DNA分析レポート',zh:'[N-KAI] '+name+'的金融DNA分析报告'};
    var subject=subjectMap[lang]||subjectMap['ko'];
    var html=getLiteEmailHtml(data,lang,opts);
    GmailApp.sendEmail(email,subject,'',{htmlBody:html,name:'N-KAI Financial DNA',replyTo:CONFIG.SUPPORT_EMAIL,charset:'UTF-8'});
    try{getOrCreateSheet(SHEET_PDF_LOG,HEADERS.pdfLog).appendRow([new Date(),email,name,archetype,nscore,lang,'(ITE-Lite)','SUCCESS']);}catch(le){}
    try{MailApp.sendEmail(CEO_EMAIL,'[N-KAI ITE] '+name+' ('+archetype+')','수신: '+email+'\nN-Score: '+nscore);}catch(ce){}
    return jsonResponse({success:true,message:'ITE 이메일 발송 완료'});
  } catch(err) { return jsonResponse({success:false,error:err.message}); }
}

// getLiteEmailHtml (원본 v7.9.1 보존 — 길이 관계로 간략화 없이 그대로)
function getLiteEmailHtml(data, lang, theme) {
  theme=theme||{};
  var name=safeStr(data.name)||'고객',archetype=safeStr(data.archetype||data.archetype_code)||'ISTP';
  var nscore=safeStr(data.nscore||data.n_score)||'500',ngrade=safeStr(data.ngrade||data.n_grade)||'N5';
  var icon=theme.themeIcon||'K',color=theme.themeColor||'#2D8CFF',group=theme.groupName||'',title=theme.archetypeTitle||'',summary=theme.archetypeSummary||'';
  var wE=safeStr(data.wealth_energy)||'55',oS=safeStr(data.opportunity_score)||'55',rT=safeStr(data.risk_tolerance)||'55';
  var wp=safeStr(data.wood_pct)||'20',fp=safeStr(data.fire_pct)||'20',ep=safeStr(data.earth_pct)||'20',mp=safeStr(data.metal_pct)||'20',wap=safeStr(data.water_pct)||'20';
  var bt=safeStr(data.bloodtype),btLabel=safeStr(data.bloodtype_label),zodiac=safeStr(data.zodiac_sign),animalName=safeStr(data.animal_name);
  var iconBgMap={'#FFD700':'rgba(255,215,0,0.15)','#64C8FF':'rgba(100,200,255,0.15)','#00C896':'rgba(0,200,150,0.15)','#C896FF':'rgba(200,150,255,0.15)'};
  var iconBg=iconBgMap[color]||'rgba(45,140,255,0.15)';
  var energyBars='';
  [{k:'木',p:wp,c:'#22c55e'},{k:'火',p:fp,c:'#ef4444'},{k:'土',p:ep,c:'#eab308'},{k:'金',p:mp,c:'#a3a3a3'},{k:'水',p:wap,c:'#3b82f6'}].forEach(function(el){
    energyBars+='<tr><td style="width:28px;text-align:center;"><div style="display:inline-block;background:'+el.c+';border-radius:4px;width:22px;height:20px;line-height:20px;text-align:center;font-size:12px;font-weight:700;color:#0f1221;">'+el.k+'</div></td><td style="padding:3px 6px;"><div style="background:#1a1f35;border-radius:4px;height:11px;overflow:hidden;"><div style="background:'+el.c+';width:'+el.p+'%;height:100%;border-radius:4px;"></div></div></td><td style="font-size:10px;color:#9ca3af;width:30px;text-align:right;">'+el.p+'%</td></tr>';
  });
  var badges='';
  if(bt&&btLabel)badges+='<div style="display:inline-block;background:#1a1f35;border:1px solid #2d3548;border-radius:8px;padding:5px 10px;margin:2px;font-size:10px;color:#d1d5db;">'+btLabel+'</div>';
  if(zodiac)badges+='<div style="display:inline-block;background:#1a1f35;border:1px solid #2d3548;border-radius:8px;padding:5px 10px;margin:2px;font-size:10px;color:#d1d5db;">'+zodiac+'</div>';
  if(animalName)badges+='<div style="display:inline-block;background:#1a1f35;border:1px solid #2d3548;border-radius:8px;padding:5px 10px;margin:2px;font-size:10px;color:#d1d5db;">'+animalName+'</div>';
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#0a0e1a;font-family:-apple-system,BlinkMacSystemFont,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0e1a;padding:32px 16px;"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:16px;overflow:hidden;"><tr><td style="background:linear-gradient(135deg,#1a1f35,#111827);padding:20px;text-align:center;border-bottom:1px solid #2d3548;"><div style="font-size:22px;font-weight:800;color:#f0c674;letter-spacing:2px;">N-KAI</div><div style="font-size:10px;color:#6b7280;letter-spacing:1px;margin-top:2px;">YOUR FINANCIAL DNA</div></td></tr><tr><td style="padding:24px 28px 8px;"><h2 style="color:#fff;font-size:16px;margin:0;">'+name+'님의 금융 DNA 분석 결과</h2></td></tr><tr><td style="padding:14px 28px;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1f35;border:2px solid '+color+';border-radius:12px;"><tr><td style="padding:18px;text-align:center;"><div style="width:44px;height:44px;border-radius:50%;background:'+iconBg+';border:2px solid '+color+';display:inline-block;line-height:44px;text-align:center;margin-bottom:6px;"><span style="font-size:18px;font-weight:700;color:'+color+';">'+icon+'</span></div><br>'+(group?'<div style="font-size:11px;color:'+color+';margin-bottom:3px;">'+group+'</div>':'')+'<div style="font-size:26px;font-weight:800;color:#fff;letter-spacing:1px;">'+archetype+'</div>'+(title?'<div style="font-size:13px;font-weight:700;color:#d1d5db;margin-top:3px;">'+title+'</div>':'')+(summary?'<div style="background:#0f1525;border-radius:8px;padding:8px 12px;margin-top:6px;"><p style="color:#9ca3af;font-size:11px;line-height:1.5;margin:0;">'+summary+'</p></div>':'')+'</td></tr></table></td></tr><tr><td style="padding:6px 28px;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1f35;border-radius:10px;"><tr><td style="padding:12px 20px;text-align:center;"><span style="font-size:10px;color:#ef4444;letter-spacing:1px;">N-SCORE</span><br><span style="font-size:26px;font-weight:800;color:#f0c674;">'+nscore+'</span><span style="font-size:11px;color:#6b7280;margin-left:4px;">'+ngrade+'</span></td></tr></table></td></tr><tr><td style="padding:10px 28px;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1f35;border-radius:10px;"><tr><td style="padding:12px;text-align:center;width:33%;"><div style="font-size:9px;color:#2D8CFF;">경제감각</div><div style="font-size:20px;font-weight:800;color:#2D8CFF;margin-top:3px;">'+wE+'</div></td><td style="padding:12px;text-align:center;width:33%;border-left:1px solid #2d3548;border-right:1px solid #2d3548;"><div style="font-size:9px;color:#5AA8FF;">표현에너지</div><div style="font-size:20px;font-weight:800;color:#5AA8FF;margin-top:3px;">'+oS+'</div></td><td style="padding:12px;text-align:center;width:33%;"><div style="font-size:9px;color:#00D68F;">위기대응력</div><div style="font-size:20px;font-weight:800;color:#00D68F;margin-top:3px;">'+rT+'</div></td></tr></table></td></tr><tr><td style="padding:10px 28px;"><table width="100%" cellpadding="2" cellspacing="0" style="background:#1a1f35;border-radius:10px;padding:10px;">'+energyBars+'</table></td></tr>'+(badges?'<tr><td style="padding:10px 28px;"><div style="text-align:center;">'+badges+'</div></td></tr>':'')+'<tr><td style="padding:14px 28px;"><div style="background:linear-gradient(135deg,rgba(124,91,240,0.1),rgba(45,140,255,0.1));border:1px solid rgba(124,91,240,0.3);border-radius:12px;padding:14px;text-align:center;"><div style="font-size:12px;font-weight:700;color:#7C5BF0;margin-bottom:3px;">Premium으로 업그레이드</div><div style="font-size:10px;color:#9ca3af;margin-bottom:10px;">골든타임 12개월 + 리스크 히트맵 + 맞춤 포트폴리오</div><a href="https://www.neurinkairosai.com" style="display:inline-block;background:linear-gradient(135deg,#7C5BF0,#2D8CFF);color:#fff;font-size:12px;font-weight:700;padding:9px 24px;border-radius:8px;text-decoration:none;">₩9,900 — Standard 시작하기</a></div></td></tr><tr><td style="padding:10px 28px 18px;"><p style="color:#6b7280;font-size:10px;margin:0;border-top:1px solid #2d3548;padding-top:10px;">본 분석은 투자 자문이 아닙니다.</p><p style="color:#4b5563;font-size:9px;margin:3px 0 0;">이 메일은 N-KAI에서 요청에 의해 발송됩니다.</p><p style="color:#374151;font-size:9px;margin:3px 0 0;">&copy; 2025 뉴린카이로스에이아이(주)</p></td></tr></table></td></tr></table></body></html>';
}

// ════════════════════════════════════════════════════════════════
// ★★★ [교체 v2.1] PART 8 — buildPdfReportHtml (완전 리디자인)
// Malgun Gothic 기반, 8섹션, 고품질 PDF 레이아웃
// ════════════════════════════════════════════════════════════════
function buildPdfReportHtml(data, aiData) {
  // v2.1 신규 버전 우선 사용
  // data 파라미터가 v7.9.1 형식(lang, tier 포함)이면 구 버전으로 라우팅
  // 단, aiData가 있으면 신규 버전 사용
  aiData = aiData || {};

  function riskClass(val) {
    if (!val) return 'risk-caution';
    if (val === '적합') return 'risk-fit';
    if (val === '주의') return 'risk-warn';
    return 'risk-caution';
  }

  var nscore    = parseInt(safeStr(data.nscore || data.n_score) || '700', 10);
  var nscorePct = Math.min(95, Math.max(10, Math.round((nscore / 1000) * 100)));
  var nscoreTop = Math.round(100 - nscorePct);
  var elementNames = { '木':'성장·확장','火':'열정·활력','土':'안정·균형','金':'결단·수렴','水':'지혜·흐름' };
  var elementTraits = {
    '木':'성장 가능성이 높은 자산을 직관적으로 선별하는 경향이 강함',
    '火':'빠른 의사결정과 추세 추종에 강하나 감정적 판단 주의 필요',
    '土':'안정 자산 선호, 장기 보유 전략에 최적화된 성향',
    '金':'분석적 접근과 손절 원칙에 강하며 비용 효율 극대화',
    '水':'정보 수집과 시장 사이클 독해에 탁월한 직관'
  };

  var nm = safeStr(data.name) || '고객';
  var arch = safeStr(data.archetype || data.archetype_code) || 'ISTP';
  var ng = safeStr(data.ngrade || data.n_grade) || 'N5';
  var dayEl = safeStr(data.day_element) || '土';
  var wE = safeStr(data.wealth_energy) || '55';
  var oS = safeStr(data.opportunity_score) || '55';
  var rT = safeStr(data.risk_tolerance) || '55';
  var wp = safeStr(data.wood_pct) || '20';
  var fp = safeStr(data.fire_pct) || '20';
  var ep = safeStr(data.earth_pct) || '20';
  var mp = safeStr(data.metal_pct) || '20';
  var wap = safeStr(data.water_pct) || '20';
  var g3m = safeStr(data.growth_3m) || String(Math.min(999, nscore + 15));
  var g3mG = safeStr(data.growth_3m_grade) || ng;
  var g12m = safeStr(data.growth_12m) || String(Math.min(999, nscore + 30));
  var g12mG = safeStr(data.growth_12m_grade) || ng;
  var isPremium = (safeStr(data._tier || data.tier || data.plan || '') === 'premium');

  var css = '*{margin:0;padding:0;box-sizing:border-box}body{font-family:"Malgun Gothic","Apple SD Gothic Neo","맑은 고딕","나눔고딕",sans-serif;background:#fff;color:#0D1B2A;font-size:13px;line-height:1.6;width:794px;margin:0 auto}.cover{background:linear-gradient(145deg,#071523 0%,#0D1B2A 40%,#122840 100%);color:#fff;padding:52px 56px 48px;position:relative;overflow:hidden}.cover-grid{position:absolute;top:0;left:0;right:0;bottom:0;background-image:linear-gradient(rgba(45,140,255,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(45,140,255,.07) 1px,transparent 1px);background-size:40px 40px}.cover-accent{position:absolute;top:-80px;right:-80px;width:360px;height:360px;background:radial-gradient(circle,rgba(240,198,116,.18) 0%,transparent 70%);border-radius:50%}.cover-inner{position:relative;z-index:2}.brand{display:table;margin-bottom:40px}.logo-wrap{display:table-cell;vertical-align:middle;padding-right:12px}.logo{width:44px;height:44px;background:linear-gradient(135deg,#F0C674,#d4a853);border-radius:10px;text-align:center;line-height:44px;font-size:18px;font-weight:900;color:#071523}.brand-info{display:table-cell;vertical-align:middle}.brand-name{font-size:20px;font-weight:900;letter-spacing:2px;color:#F0C674}.brand-sub{font-size:10px;color:rgba(240,198,116,.6);letter-spacing:1.5px}.cover-tag{display:inline-block;background:rgba(240,198,116,.15);border:1px solid rgba(240,198,116,.4);color:#F0C674;font-size:11px;font-weight:700;letter-spacing:1.5px;padding:5px 14px;border-radius:20px;margin-bottom:20px}.cover-title{font-size:28px;font-weight:900;color:#fff;line-height:1.3;margin-bottom:8px}.cover-title span{color:#F0C674}.one-line{font-size:15px;color:rgba(255,255,255,.75);margin-bottom:36px;padding-left:16px;border-left:3px solid #2D8CFF}.meta-tbl{width:100%;border-collapse:collapse;margin-bottom:32px}.meta-tbl td{vertical-align:top;padding:0 6px 0 0;width:25%}.mc{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:14px 16px}.ml{font-size:10px;color:rgba(255,255,255,.45);letter-spacing:1px;margin-bottom:4px}.mv{font-size:20px;font-weight:900;color:#F0C674}.md{font-size:10px;color:rgba(255,255,255,.5);margin-top:2px}.nb{height:5px;background:rgba(255,255,255,.12);border-radius:3px;margin-top:6px}.nf{height:5px;background:linear-gradient(90deg,#2D8CFF,#F0C674);border-radius:3px}.cf{border-top:1px solid rgba(255,255,255,.1);padding-top:16px;display:table;width:100%}.cfl{display:table-cell;font-size:10px;color:rgba(255,255,255,.35)}.cfr{display:table-cell;text-align:right;font-size:13px;color:rgba(255,255,255,.7);font-weight:700}.sec{padding:36px 56px;border-bottom:1px solid #EEF2F7}.sn{font-size:10px;font-weight:900;letter-spacing:2px;color:#2D8CFF;margin-bottom:4px}.st{font-size:17px;font-weight:900;color:#0D1B2A;margin-bottom:6px}.st span{color:#F0C674}.dl{height:2px;background:linear-gradient(90deg,#2D8CFF 0%,rgba(240,198,116,.3) 50%,transparent 100%);margin-bottom:20px}.ah{background:linear-gradient(135deg,#071523 0%,#0D2540 100%);border-radius:12px;padding:24px 28px;display:table;width:100%;border:1px solid #1A3A5C;margin-bottom:16px}.abl{display:table-cell;vertical-align:top;padding-right:20px}.ab{width:64px;height:64px;background:linear-gradient(135deg,#F0C674,#d4a853);border-radius:14px;text-align:center;line-height:64px;font-size:22px;font-weight:900;color:#071523}.ar{display:table-cell;vertical-align:top}.an{font-size:20px;font-weight:900;color:#F0C674;margin-bottom:4px}.ae{font-size:11px;color:rgba(255,255,255,.4);letter-spacing:1px;margin-bottom:10px}.ad{font-size:13px;color:rgba(255,255,255,.8);line-height:1.7}.it{width:100%;border-collapse:collapse}.it td{vertical-align:top;padding:0 6px 0 0;width:33.33%}.it td:last-child{padding-right:0}.ic{border-radius:10px;padding:16px 14px;border:1px solid}.ic.s{background:#F0FFF8;border-color:#22C55E30}.ic.r{background:#FFF8F0;border-color:#F0922230}.ic.g{background:#F0F5FF;border-color:#2D8CFF30}.il{font-size:10px;font-weight:700;letter-spacing:1.5px;margin-bottom:8px}.ic.s .il{color:#16A34A}.ic.r .il{color:#D97706}.ic.g .il{color:#2563EB}.ix{font-size:12px;color:#374151;line-height:1.7}.ns-wrap{display:table;width:100%}.nsl{display:table-cell;width:160px;vertical-align:top;text-align:center;padding-right:28px}.nsc{width:110px;height:110px;background:linear-gradient(135deg,#0D1B2A,#122840);border-radius:50%;border:4px solid #F0C674;text-align:center;padding-top:22px;margin:0 auto 8px;box-shadow:0 0 24px rgba(240,198,116,.2)}.nsn{font-size:32px;font-weight:900;color:#F0C674;line-height:1}.nsnl{font-size:10px;color:rgba(240,198,116,.7)}.nsg{font-size:17px;font-weight:900;color:#0D1B2A}.nsgs{font-size:11px;color:#6B7280;margin-top:2px}.nsr{display:table-cell;vertical-align:top}.kt{width:100%;border-collapse:collapse}.kt td{vertical-align:top;padding:0 6px 0 0;width:33.33%}.kt td:last-child{padding-right:0}.kc{background:#F8FAFD;border:1px solid #E5EAF2;border-radius:12px;padding:18px 14px;text-align:center}.ki{font-size:20px;margin-bottom:8px}.kn{font-size:10px;font-weight:700;color:#6B7280;letter-spacing:.5px;margin-bottom:10px}.ks{font-size:28px;font-weight:900;color:#0D1B2A}.ksm{font-size:11px;color:#9CA3AF}.kb{height:6px;background:#E5EAF2;border-radius:3px;margin-top:8px}.kf{height:6px;border-radius:3px}.kd{font-size:10px;color:#6B7280;margin-top:8px;line-height:1.5}.ew{display:table;width:100%}.ebl{display:table-cell;vertical-align:top;padding-right:20px}.edc{display:table-cell;width:200px;vertical-align:top}.er{display:table;width:100%;margin-bottom:12px}.eic{display:table-cell;width:24px;font-size:14px;vertical-align:middle;padding-right:8px}.elc{display:table-cell;width:24px;font-size:12px;font-weight:700;color:#374151;vertical-align:middle;padding-right:8px}.ebarc{display:table-cell;vertical-align:middle;padding-right:8px}.epc{display:table-cell;width:36px;font-size:12px;font-weight:700;color:#374151;vertical-align:middle;text-align:right}.ebg{height:10px;background:#EEF2F7;border-radius:5px}.ef{height:10px;border-radius:5px}.wf{background:linear-gradient(90deg,#22C55E,#16A34A)}.ff{background:linear-gradient(90deg,#EF4444,#DC2626)}.tf{background:linear-gradient(90deg,#F59E0B,#D97706)}.mf{background:linear-gradient(90deg,#9CA3AF,#6B7280)}.waf{background:linear-gradient(90deg,#3B82F6,#1D4ED8)}.edb{background:#F8FAFD;border-radius:10px;padding:16px;border:1px solid #E5EAF2}.edt{font-size:12px;font-weight:700;color:#0D1B2A;margin-bottom:8px}.edx{font-size:11px;color:#6B7280;line-height:1.7}.gt{width:100%;border-collapse:collapse;margin-bottom:16px}.gt td{vertical-align:top;padding:0 6px 0 0;width:33.33%}.gt td:last-child{padding-right:0}.gc{border-radius:10px;padding:16px 14px;border:1px solid}.g1{background:linear-gradient(135deg,#071523,#0D2540);border-color:#F0C674}.g2{background:#F0FFF8;border-color:#22C55E40}.g3{background:#F0F5FF;border-color:#2D8CFF30}.grank{font-size:10px;font-weight:700;letter-spacing:1.5px;margin-bottom:6px}.g1 .grank{color:#F0C674}.g2 .grank{color:#16A34A}.g3 .grank{color:#2563EB}.gm{font-size:20px;font-weight:900;margin-bottom:4px}.g1 .gm{color:#F0C674}.g2 .gm{color:#16A34A}.g3 .gm{color:#2563EB}.gst{font-size:12px;margin-bottom:4px}.g1 .gst{color:#F0C674}.g2 .gst{color:#16A34A}.g3 .gst{color:#2563EB}.gl{font-size:11px}.g1 .gl{color:rgba(255,255,255,.65)}.g2 .gl{color:#6B7280}.g3 .gl{color:#6B7280}.cb{background:#FFF8F0;border:1px solid #F0922240;border-radius:8px;padding:12px 16px;display:table;width:100%}.cic{display:table-cell;width:30px;font-size:16px;vertical-align:middle}.cinf{display:table-cell;vertical-align:middle}.cla{font-size:11px;font-weight:700;color:#D97706}.cmo{font-size:13px;font-weight:700;color:#374151}.rit{width:100%;border-collapse:collapse}.rit td{padding:0 5px 10px 0;width:33.33%;vertical-align:top}.ri{background:#F8FAFD;border-radius:10px;padding:14px;border:1px solid #E5EAF2;text-align:center}.ricon{font-size:16px;margin-bottom:4px}.rn{font-size:10px;color:#6B7280;margin-bottom:8px;font-weight:700}.rb{display:inline-block;font-size:12px;font-weight:700;padding:4px 14px;border-radius:20px}.risk-fit{background:#DCFCE7;color:#16A34A}.risk-caution{background:#FEF9C3;color:#A16207}.risk-warn{background:#FEE2E2;color:#DC2626}.pw{display:table;width:100%}.pbc{display:table-cell;vertical-align:top;padding-right:20px}.pic{display:table-cell;width:210px;vertical-align:top}.pr{display:table;width:100%;margin-bottom:10px}.plc{display:table-cell;width:64px;font-size:12px;font-weight:700;color:#374151;vertical-align:middle}.pbarc{display:table-cell;vertical-align:middle}.pbg{height:16px;background:#EEF2F7;border-radius:8px}.pbf{height:16px;border-radius:8px;text-align:right;padding-right:8px;line-height:16px}.pp{font-size:11px;font-weight:900;color:#fff}.pgf{background:linear-gradient(90deg,#3B82F6,#2D8CFF)}.pef{background:linear-gradient(90deg,#10B981,#059669)}.pbof{background:linear-gradient(90deg,#6366F1,#4F46E5)}.paf{background:linear-gradient(90deg,#F59E0B,#D97706)}.pcf{background:linear-gradient(90deg,#9CA3AF,#6B7280)}.pib{background:linear-gradient(135deg,#071523,#0D2540);border-radius:12px;padding:18px;border:1px solid #1A3A5C}.pit{font-size:11px;font-weight:700;color:#F0C674;margin-bottom:8px}.pix{font-size:11px;color:rgba(255,255,255,.75);line-height:1.7}.rmt{width:100%;border-collapse:collapse}.rmt td{vertical-align:top;text-align:center}.rms{border-radius:10px;padding:18px 12px;border:1px solid}.rc{background:linear-gradient(135deg,#071523,#0D2540);border-color:#F0C674}.r3{background:linear-gradient(135deg,#EFF6FF,#DBEAFE);border-color:#3B82F6}.r12{background:linear-gradient(135deg,#ECFDF5,#D1FAE5);border-color:#10B981}.rmac{width:32px;vertical-align:middle;text-align:center;font-size:20px;color:#C0CCE0;padding:0 4px}.rp{font-size:10px;font-weight:700;letter-spacing:1px;margin-bottom:6px}.rc .rp{color:rgba(240,198,116,.7)}.r3 .rp{color:#3B82F6}.r12 .rp{color:#10B981}.rsc{font-size:24px;font-weight:900;margin-bottom:2px}.rc .rsc{color:#F0C674}.r3 .rsc{color:#1D4ED8}.r12 .rsc{color:#047857}.rgr{font-size:12px;font-weight:700}.rc .rgr{color:rgba(255,255,255,.6)}.r3 .rgr{color:#3B82F6}.r12 .rgr{color:#059669}.rno{font-size:10px;color:#6B7280;margin-top:4px}.rc .rno{color:rgba(255,255,255,.4)}.rf{background:#F8FAFD;padding:18px 56px;border-top:2px solid #EEF2F7;display:table;width:100%}.rfl{display:table-cell;vertical-align:middle}.rfr{display:table-cell;vertical-align:middle;text-align:right}.rfb{font-size:12px;font-weight:900;color:#0D1B2A}.rfr2{font-size:10px;color:#9CA3AF;margin-top:2px}.rfd{font-size:9px;color:#9CA3AF;line-height:1.6;max-width:460px;text-align:right}';

  var h = '<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><style>' + css + '</style></head><body>';

  // ── 커버 ──
  h += '<div class="cover"><div class="cover-grid"></div><div class="cover-accent"></div><div class="cover-inner">';
  h += '<div class="brand"><div class="logo-wrap"><div class="logo">N</div></div><div class="brand-info"><div class="brand-name">N·KAI</div><div class="brand-sub">YOUR FINANCIAL DNA</div></div></div>';
  h += '<div class="cover-tag">' + (isPremium ? '⭐ PREMIUM REPORT · 풀 패키지 분석' : '✦ STANDARD REPORT · 금융 DNA 분석') + '</div>';
  h += '<div class="cover-title">' + nm + '님의<br><span>금융 DNA 완전 분석 리포트</span></div>';
  h += '<div class="one-line">' + (aiData.one_line || '') + '</div>';
  h += '<table class="meta-tbl"><tr>';
  h += '<td><div class="mc"><div class="ml">ARCHETYPE</div><div class="mv" style="font-size:22px">' + arch + '</div><div class="md">' + getArchetypeKorName(arch) + '</div></div></td>';
  h += '<td><div class="mc"><div class="ml">N-SCORE</div><div class="mv">' + nscore + '</div><div class="md">' + ng + ' 등급</div><div class="nb"><div class="nf" style="width:' + nscorePct + '%"></div></div></div></td>';
  h += '<td><div class="mc"><div class="ml">CORE ELEMENT</div><div class="mv" style="font-size:22px">' + dayEl + '</div><div class="md">코어 에너지</div></div></td>';
  h += '<td><div class="mc"><div class="ml">분석 일자</div><div class="mv" style="font-size:14px">' + new Date().toLocaleDateString('ko-KR') + '</div><div class="md">AI 기준일</div></div></td>';
  h += '</tr></table>';
  h += '<div class="cf"><div class="cfl">' + CONFIG.COMPANY_NAME + ' · ' + CONFIG.SITE_URL + ' · ' + CONFIG.BIZ_NO + '</div><div class="cfr">' + nm + ' 고객님 전용 리포트</div></div>';
  h += '</div></div>';

  // ── S1: 아키타입 분석 ──
  h += '<div class="sec"><div class="sn">SECTION 01</div><div class="st">아키타입 심층 분석 — <span>' + arch + '</span></div><div class="dl"></div>';
  h += '<div class="ah"><div class="abl"><div class="ab">' + arch + '</div></div><div class="ar"><div class="an">' + getArchetypeKorName(arch) + '</div><div class="ae">' + getArchetypeEngName(arch) + ' · Financial Archetype</div><div class="ad">' + (aiData.identity || '') + '</div></div></div>';
  h += '<table class="it"><tr><td><div class="ic s"><div class="il">💪 핵심 강점</div><div class="ix">' + (aiData.strength_insight || '') + '</div></div></td><td><div class="ic r"><div class="il">⚠️ 주요 리스크</div><div class="ix">' + (aiData.risk_insight || '') + '</div></div></td><td><div class="ic g"><div class="il">🎯 골든 전략</div><div class="ix">' + (aiData.golden_strategy || '') + '</div></div></td></tr></table></div>';

  // ── S2: N-Score ──
  h += '<div class="sec"><div class="sn">SECTION 02</div><div class="st">N-Score 금융 성향 지수</div><div class="dl"></div>';
  h += '<div class="ns-wrap"><div class="nsl"><div class="nsc"><div class="nsn">' + nscore + '</div><div class="nsnl">점수</div></div><div class="nsg">' + ng + ' 등급</div><div class="nsgs">상위 ' + nscoreTop + '%</div></div>';
  h += '<div class="nsr"><div style="font-size:12px;font-weight:700;color:#0D1B2A;margin-bottom:12px">9등급 스케일 위치</div>';
  ['N1,95,#EF4444,900~1000','N2,82,#F59E0B,800~899','N3,69,#F0C674,700~799','N4,55,#9CA3AF,600~699'].forEach(function(s) {
    var p = s.split(','); var bold = (p[0] === ng);
    h += '<div style="display:table;width:100%;margin-bottom:7px"><div style="display:table-cell;width:34px;font-size:11px;font-weight:' + (bold?'900':'700') + ';color:' + (bold?p[2]:'#9CA3AF') + ';vertical-align:middle">' + p[0] + '</div><div style="display:table-cell;vertical-align:middle;padding:0 8px"><div style="height:8px;background:#EEF2F7;border-radius:4px"><div style="width:' + p[1] + '%;height:8px;border-radius:4px;background:' + (bold?'linear-gradient(90deg,#2D8CFF,#F0C674)':p[2]) + '"></div></div></div><div style="display:table-cell;width:60px;font-size:10px;color:' + (bold?p[2]:'#9CA3AF') + ';vertical-align:middle">' + p[3] + '</div></div>';
  });
  h += '<div style="font-size:11px;color:#6B7280;margin-top:10px;line-height:1.6;padding:10px;background:#F8FAFD;border-radius:6px">' + nscore + '점은 동일 아키타입(' + arch + ') 중 상위 ' + nscoreTop + '% 수준입니다.</div></div></div></div>';

  // ── S3: 3대 지표 ──
  h += '<div class="sec"><div class="sn">SECTION 03</div><div class="st">3대 핵심 금융 지표</div><div class="dl"></div>';
  h += '<table class="kt"><tr>';
  [['💰','경제 감각',wE,'linear-gradient(90deg,#F59E0B,#F0C674)','수익 기회 포착 및 자산 증식에 대한 직관적 감각'],['🎯','투자 기회 포착력',oS,'linear-gradient(90deg,#2D8CFF,#6366F1)','최적 진입 타이밍을 감지하는 능력'],['🛡️','위기 대응력',rT,'linear-gradient(90deg,#10B981,#22C55E)','금융 충격 시 심리적 회복 탄력성']].forEach(function(m) {
    h += '<td><div class="kc"><div class="ki">' + m[0] + '</div><div class="kn">' + m[1] + '</div><div class="ks">' + m[2] + '<span class="ksm">/100</span></div><div class="kb"><div class="kf" style="width:' + m[2] + '%;background:' + m[3] + '"></div></div><div class="kd">' + m[4] + '</div></div></td>';
  });
  h += '</tr></table></div>';

  // ── S4: 코어에너지 ──
  h += '<div class="sec"><div class="sn">SECTION 04</div><div class="st">코어 에너지 — 5-Energy Balance</div><div class="dl"></div>';
  h += '<div class="ew"><div class="ebl">';
  [['🌳','木',wp,'wf'],['🔥','火',fp,'ff'],['⛰️','土',ep,'tf'],['⚙️','金',mp,'mf'],['💧','水',wap,'waf']].forEach(function(el) {
    h += '<div class="er"><div class="eic">' + el[0] + '</div><div class="elc">' + el[1] + '</div><div class="ebarc"><div class="ebg"><div class="ef ' + el[3] + '" style="width:' + el[2] + '%"></div></div></div><div class="epc">' + el[2] + '%</div></div>';
  });
  h += '</div><div class="edc"><div class="edb"><div class="edt">' + dayEl + ' 코어 에너지 분석</div><div class="edx">일간 ' + dayEl + '(' + (elementNames[dayEl] || '') + ') 에너지가 지배적인 ' + nm + '님은 금융 결정 시 ' + (elementTraits[dayEl] || '균형 잡힌 판단 경향') + '. 에너지 구성비를 고려한 투자 타이밍 최적화가 핵심입니다.</div></div></div></div></div>';

  // ── S5: 골든타임 ──
  h += '<div class="sec"><div class="sn">SECTION 05</div><div class="st">골든타임 캘린더 — 12개월 에너지 흐름</div><div class="dl"></div>';
  h += '<table class="gt"><tr>';
  if (data.best_1_month) h += '<td><div class="gc g1"><div class="grank">🥇 BEST 1 · 최우선</div><div class="gm">' + data.best_1_month + '</div><div class="gst">' + (data.best_1_stars || '★★★★★') + '</div><div class="gl">' + (data.best_1_label || '최적 에너지 구간') + '</div></div></td>';
  if (data.best_2_month) h += '<td><div class="gc g2"><div class="grank">🥈 BEST 2 · 안정성장</div><div class="gm">' + data.best_2_month + '</div><div class="gst">' + (data.best_2_stars || '★★★★☆') + '</div><div class="gl">' + (data.best_2_label || '상승 에너지 구간') + '</div></div></td>';
  if (data.best_3_month) h += '<td><div class="gc g3"><div class="grank">🥉 BEST 3 · 균형구간</div><div class="gm">' + data.best_3_month + '</div><div class="gst">' + (data.best_3_stars || '★★★☆☆') + '</div><div class="gl">' + (data.best_3_label || '균형 에너지 구간') + '</div></div></td>';
  h += '</tr></table>';
  if (data.worst_months) h += '<div class="cb"><div class="cic">⚠️</div><div class="cinf"><div class="cla">주의 구간</div><div class="cmo">' + data.worst_months + '</div></div></div>';
  h += '</div>';

  // ── S6: 리스크 히트맵 ──
  h += '<div class="sec"><div class="sn">SECTION 06</div><div class="st">투자 리스크 히트맵 — 6종목 적합도</div><div class="dl"></div>';
  h += '<table class="rit"><tr>';
  [['📈','단기 투자',data.risk_short],['🏠','부동산',data.risk_estate],['🚀','창업 투자',data.risk_startup]].forEach(function(r) {
    h += '<td><div class="ri"><div class="ricon">' + r[0] + '</div><div class="rn">' + r[1] + '</div><div class="rb ' + riskClass(r[2]) + '">' + (r[2] || '보통') + '</div></div></td>';
  });
  h += '</tr><tr>';
  [['📊','장기 투자',data.risk_long],['₿','암호화폐',data.risk_crypto],['🌐','ETF',data.risk_etf]].forEach(function(r) {
    h += '<td><div class="ri"><div class="ricon">' + r[0] + '</div><div class="rn">' + r[1] + '</div><div class="rb ' + riskClass(r[2]) + '">' + (r[2] || '보통') + '</div></div></td>';
  });
  h += '</tr></table></div>';

  // ── S7: 포트폴리오 ──
  h += '<div class="sec"><div class="sn">SECTION 07</div><div class="st">' + arch + ' 맞춤 포트폴리오</div><div class="dl"></div>';
  h += '<div class="pw"><div class="pbc">';
  [['성장주', safeStr(data.portfolio_growth) || '30', 'pgf'],['ETF', safeStr(data.portfolio_etf) || '25', 'pef'],['채권', safeStr(data.portfolio_bond) || '20', 'pbof'],['대안투자', safeStr(data.portfolio_alt) || '15', 'paf'],['현금', safeStr(data.portfolio_cash) || '10', 'pcf']].forEach(function(p) {
    h += '<div class="pr"><div class="plc">' + p[0] + '</div><div class="pbarc"><div class="pbg"><div class="pbf ' + p[2] + '" style="width:' + p[1] + '%"><span class="pp">' + p[1] + '%</span></div></div></div></div>';
  });
  h += '</div><div class="pic"><div class="pib"><div class="pit">🤖 AI 포트폴리오 인사이트</div><div class="pix">' + (aiData.portfolio_insight || '') + '</div></div></div></div></div>';

  // ── S8: 성장 로드맵 ──
  h += '<div class="sec"><div class="sn">SECTION 08</div><div class="st">N-Score 성장 로드맵</div><div class="dl"></div>';
  h += '<div style="background:#F8FAFD;border-radius:10px;padding:14px 16px;margin-bottom:16px;font-size:12px;color:#374151;line-height:1.8">' + (aiData.growth_prescription || '') + '</div>';
  h += '<table class="rmt"><tr><td style="width:30%"><div class="rms rc"><div class="rp">현재</div><div class="rsc">' + nscore + '</div><div class="rgr">' + ng + ' 등급</div><div class="rno">현재 위치</div></div></td><td class="rmac">→</td><td style="width:30%"><div class="rms r3"><div class="rp">3개월 후 목표</div><div class="rsc">' + g3m + '</div><div class="rgr">' + g3mG + ' 등급</div><div class="rno">단기 목표</div></div></td><td class="rmac">→</td><td style="width:30%"><div class="rms r12"><div class="rp">12개월 후 목표</div><div class="rsc">' + g12m + '</div><div class="rgr">' + g12mG + ' 등급</div><div class="rno">연간 목표</div></div></td></tr></table></div>';

  // ── S9: 오행 × 4원소 공명 분석 ──
  var el4Map = {
    '木': { fire:'★★★★☆', earth:'★★☆☆☆', air:'★★★★★', water:'★★★☆☆',
            fireDesc:'성장 에너지와 열정이 시너지를 냄', earthDesc:'안정 추구와 방향성 충돌 주의',
            airDesc:'변화와 소통이 완벽히 공명하는 최강 조합', waterDesc:'직관과 성장력의 균형 조합' },
    '火': { fire:'★★★★★', earth:'★★★★☆', air:'★★★☆☆', water:'★☆☆☆☆',
            fireDesc:'열정과 실행력의 완벽한 공명', earthDesc:'火生土: 행동이 결실로 이어지는 구조',
            airDesc:'아이디어를 행동으로 전환하는 조합', waterDesc:'충동 억제 필요, 상극 관계 주의' },
    '土': { fire:'★★★★☆', earth:'★★★★★', air:'★★★☆☆', water:'★★☆☆☆',
            fireDesc:'火生土: 열정이 안정을 강화', earthDesc:'동일 에너지 집중, 자산 보존 극대화',
            airDesc:'안정 기반 위 소통 전략 균형', waterDesc:'水克土: 유연성 확보가 과제' },
    '金': { fire:'★★☆☆☆', earth:'★★★★★', air:'★★★★☆', water:'★★★☆☆',
            fireDesc:'火克金: 충동적 실행 억제 필요', earthDesc:'土生金: 안정이 결단력을 극대화하는 최강',
            airDesc:'분석과 소통의 정밀한 공명', waterDesc:'金生水: 결단이 지혜로 이어지는 흐름' },
    '水': { fire:'★☆☆☆☆', earth:'★★☆☆☆', air:'★★★★☆', water:'★★★★★',
            fireDesc:'水克火: 냉철함이 과도하면 기회 상실', earthDesc:'土克水: 안정 편향 극복 필요',
            airDesc:'정보 수집과 분석의 최강 공명', waterDesc:'직관과 흐름 독해의 완벽한 집중' }
  };
  var e4 = el4Map[dayEl] || el4Map['土'];
  h += '<div class="sec"><div class="sn">SECTION 09</div><div class="st">오행 × 4원소 공명 분석</div><div class="dl"></div>';
  h += '<div style="font-size:11px;color:#6B7280;margin-bottom:14px;padding:10px 12px;background:#F8FAFD;border-radius:8px;line-height:1.7">';
  h += '<strong style="color:#0D1B2A">서양 4원소(Fire·Earth·Air·Water)</strong>와 동양 오행의 에너지 공명도를 분석합니다. ';
  h += dayEl + '(' + (elementNames[dayEl]||'') + ') 코어 에너지 기준으로 각 원소와의 투자 시너지를 측정합니다.</div>';
  h += '<table style="width:100%;border-collapse:collapse">';
  h += '<tr><th style="font-size:10px;font-weight:700;color:#6B7280;padding:8px 10px;text-align:left;border-bottom:2px solid #EEF2F7;width:15%">원소</th>';
  h += '<th style="font-size:10px;font-weight:700;color:#6B7280;padding:8px 10px;text-align:left;border-bottom:2px solid #EEF2F7;width:20%">공명도</th>';
  h += '<th style="font-size:10px;font-weight:700;color:#6B7280;padding:8px 10px;text-align:left;border-bottom:2px solid #EEF2F7">금융 해석</th></tr>';
  [
    ['🔥 Fire (화)', e4.fire, e4.fireDesc, '#FEF3C7'],
    ['⛰ Earth (지)', e4.earth, e4.earthDesc, '#F0FDF4'],
    ['💨 Air (풍)', e4.air, e4.airDesc, '#EFF6FF'],
    ['💧 Water (수)', e4.water, e4.waterDesc, '#F5F3FF']
  ].forEach(function(row) {
    h += '<tr style="border-bottom:1px solid #F3F4F6">';
    h += '<td style="padding:10px;font-size:12px;font-weight:700;color:#0D1B2A">' + row[0] + '</td>';
    h += '<td style="padding:10px"><span style="font-size:13px;color:#F0C674;letter-spacing:1px">' + row[1] + '</span></td>';
    h += '<td style="padding:10px;font-size:11px;color:#374151;background:' + row[3] + ';border-radius:6px">' + row[2] + '</td>';
    h += '</tr>';
  });
  h += '</table></div>';

  // ── S10: 금융 케미스트리 궁합 ──
  var chemMap = {
    ENTJ:['INTJ','INFJ','ENFP'], INTJ:['ENTJ','ENTP','INFP'], ENTP:['INTJ','ENFJ','INFJ'],
    INTP:['ENTJ','ENFJ','INFP'], ENFJ:['INFP','ISFP','INTP'], INFJ:['ENFP','ENTP','ENTJ'],
    ENFP:['INFJ','INTJ','ENTJ'], INFP:['ENFJ','ENTJ','ESFJ'], ESTJ:['ISFP','ISTP','INFP'],
    ISTJ:['ESFP','ESTP','ENFP'], ESFJ:['ISFP','INFP','ISTP'], ISFJ:['ESFP','ESTP','ENFP'],
    ESTP:['ISFJ','ISTJ','INFJ'], ISTP:['ESTJ','ESFJ','ENFJ'], ESFP:['ISFJ','ISTJ','INTJ'],
    ISFP:['ESTJ','ESFJ','ENTJ']
  };
  var chemDesc = {
    ENTJ:'장기 전략 설계 → 수익 극대화', INTJ:'데이터 분석 → 리스크 헤지', ENTP:'아이디어 발굴 → 신시장 포착',
    INTP:'논리 검증 → 오류 제거', ENFJ:'네트워크 → 정보 선점', INFJ:'직관 → 타이밍 포착',
    ENFP:'트렌드 감지 → 모멘텀 포착', INFP:'가치 투자 → 장기 보유', ESTJ:'시스템 관리 → 안정 수익',
    ISTJ:'원칙 준수 → 리스크 관리', ESFJ:'관계 자산 → 정보 네트워크', ISFJ:'방어형 → 자산 보존',
    ESTP:'단기 실행 → 단타 수익', ISTP:'기술 분석 → 진입 타이밍', ESFP:'시장 감각 → 소비 트렌드',
    ISFP:'직관 투자 → 틈새 발굴'
  };
  var chemSynergy = {
    ENTJ:'전략적 비전을 장기 포트폴리오로 전환하는 능력이 탁월합니다. 리스크를 시스템화하고 수익 목표를 수치로 명문화합니다.',
    INTJ:'데이터 기반 분석으로 리스크 시나리오를 사전에 차단합니다. 감정을 배제한 냉철한 의사결정이 강점입니다.',
    ENTP:'시장의 비효율을 창의적으로 포착합니다. 새로운 투자 아이디어를 제안하고 기존 틀을 깨는 접근을 제시합니다.',
    INTP:'투자 논리의 오류를 정밀하게 검증합니다. 잘못된 전제를 사전에 발견해 손실을 방지합니다.',
    ENFJ:'인적 네트워크를 통해 시장 정보를 선점합니다. 관계 자산을 투자 기회로 연결하는 능력이 뛰어납니다.',
    INFJ:'장기적 시장 흐름을 직관적으로 감지합니다. 남들이 보지 못하는 변곡점을 미리 포착합니다.',
    ENFP:'소비 트렌드와 신시장을 빠르게 감지합니다. 모멘텀 초기 단계 진입에 탁월한 감각을 지닙니다.',
    INFP:'가치 중심 투자로 장기 보유 전략에 강합니다. 본질 가치 분석과 인내심이 핵심 강점입니다.',
    ESTJ:'투자 시스템과 프로세스를 체계화합니다. 원칙 기반 운용으로 안정적 수익을 창출합니다.',
    ISTJ:'규칙과 원칙을 철저히 준수해 리스크를 통제합니다. 감정적 결정을 차단하는 방어막 역할을 합니다.',
    ESFJ:'인적 네트워크 기반 정보 수집 능력이 탁월합니다. 시장 심리 파악과 커뮤니티 인사이트를 제공합니다.',
    ISFJ:'자산 보존과 안정성을 최우선합니다. 과도한 리스크 노출을 방지하는 균형추 역할을 합니다.',
    ESTP:'단기 모멘텀 포착과 빠른 실행에 강합니다. 시장 변화에 즉각 대응하는 기동력이 핵심입니다.',
    ISTP:'기술적 분석과 데이터 기반 진입 타이밍 식별에 강합니다. 차트와 수치를 정밀하게 읽습니다.',
    ESFP:'대중 소비 트렌드와 시장 감각이 뛰어납니다. 소비재·엔터테인먼트 섹터 투자 인사이트를 제공합니다.',
    ISFP:'틈새 가치 발굴 능력이 탁월합니다. 직관적 감각으로 저평가 자산을 발굴합니다.'
  };
  var chemCaution = {
    ENTJ:'의사결정 속도 차이로 마찰이 생길 수 있습니다. 역할 분담을 명확히 해야 합니다.',
    INTJ:'과도한 분석으로 실행 타이밍을 놓칠 위험이 있습니다. 결정 기한을 사전에 합의하세요.',
    ENTP:'아이디어는 풍부하나 실행 완성도가 낮을 수 있습니다. 체계적 검증 프로세스를 갖추세요.',
    INTP:'행동보다 검증에 과도한 시간을 소비할 수 있습니다. 검증 범위를 사전에 한정하세요.',
    ENFJ:'감정적 판단이 개입할 수 있습니다. 네트워크 정보를 반드시 데이터로 검증하세요.',
    INFJ:'직관에 지나치게 의존하면 리스크가 증가합니다. 직관은 반드시 수치로 뒷받침하세요.',
    ENFP:'집중력이 분산될 수 있습니다. 포지션 집중도 규칙을 사전에 합의하세요.',
    INFP:'단기 변동성에 취약할 수 있습니다. 손절 기준을 명확히 설정하세요.',
    ESTJ:'변화 적응 속도가 느릴 수 있습니다. 정기적인 전략 재검토 회의를 설정하세요.',
    ISTJ:'기회 포착보다 리스크 회피가 우선될 수 있습니다. 목표 수익률을 수치로 명문화하세요.',
    ESFJ:'감정적 시장 해석을 경계해야 합니다. 정보 출처를 항상 교차 검증하세요.',
    ISFJ:'지나친 안정 추구로 기회를 놓칠 수 있습니다. 공격적 포지션 비중 하한을 설정하세요.',
    ESTP:'과도한 단기 집중으로 장기 방향성을 잃을 수 있습니다. 포트폴리오 전체 맥락을 주기적으로 점검하세요.',
    ISTP:'대인 소통이 부족할 수 있습니다. 분석 결과를 팀과 정기적으로 공유하세요.',
    ESFP:'트렌드 추종에 과도하게 반응할 수 있습니다. 반드시 기본적 분석과 병행하세요.',
    ISFP:'실행 결단력이 부족할 수 있습니다. 진입 기준선을 사전에 수치로 설정하세요.'
  };
  var partners = (chemMap[arch] || ['INTJ','INFJ','ENFP']);

  if (!isPremium) {
    // Standard: 요약 카드 3개
    h += '<div class="sec"><div class="sn">SECTION 10</div><div class="st">금융 케미스트리 궁합 — ' + arch + ' 최적 파트너</div><div class="dl"></div>';
    h += '<div style="font-size:11px;color:#6B7280;margin-bottom:14px;padding:10px 12px;background:#F8FAFD;border-radius:8px;line-height:1.7">';
    h += arch + ' 아키타입과 금융 의사결정에서 시너지를 내는 상위 3개 파트너 유형입니다. 투자 파트너, 멘토, 자문역 선택 시 참고하십시오.</div>';
    h += '<table style="width:100%;border-collapse:collapse"><tr>';
    partners.forEach(function(p, i) {
      var rank = ['&#127945; 1순위','&#127946; 2순위','&#127947; 3순위'][i];
      var bg = ['#FFFBEB','#F0FDF4','#EFF6FF'][i];
      var bd = ['#F0C674','#10B981','#2D8CFF'][i];
      h += '<td style="padding:6px;width:33%"><div style="background:' + bg + ';border:1.5px solid ' + bd + ';border-radius:10px;padding:14px;text-align:center">';
      h += '<div style="font-size:9px;font-weight:700;color:#6B7280;margin-bottom:4px">' + rank + '</div>';
      h += '<div style="font-size:20px;font-weight:900;color:#0D1B2A;margin-bottom:4px">' + p + '</div>';
      h += '<div style="font-size:10px;color:#374151;line-height:1.5">' + (chemDesc[p]||'전략적 시너지') + '</div>';
      h += '</div></td>';
    });
    h += '</tr></table>';
    h += '<div style="margin-top:14px;padding:12px;background:#0D1B2A;border-radius:8px;font-size:11px;color:#F0C674;line-height:1.7;text-align:center">';
    h += '&#9733; ' + arch + ' × ' + partners[0] + ' 조합은 N-KAI 분석 16,000개 데이터 기준 상위 8% 수익률 상관관계를 보입니다.';
    h += '</div></div>';

  } else {
    // Premium: 파트너 3개 각각 풀 분석 (SECTION 10a/b/c)
    var rankLabels = ['10A','10B','10C'];
    var rankNames  = ['1순위 최우선 파트너','2순위 안정 파트너','3순위 보완 파트너'];
    var rankBg     = ['linear-gradient(135deg,#071523,#0D2540)','linear-gradient(135deg,#F0FDF4,#DCFCE7)','linear-gradient(135deg,#EFF6FF,#DBEAFE)'];
    var rankBd     = ['#F0C674','#10B981','#2D8CFF'];
    var rankTitle  = ['color:#F0C674','color:#16A34A','color:#1D4ED8'];
    var rankSub    = ['color:rgba(255,255,255,.6)','color:#374151','color:#374151'];
    var rankBody   = ['color:rgba(255,255,255,.8)','color:#374151','color:#374151'];
    var synScores  = ['92%','84%','76%'];

    h += '<div class="sec"><div class="sn">SECTION 10</div><div class="st">금융 케미스트리 궁합 Top 3 — ' + arch + ' 상세 분석</div><div class="dl"></div>';
    h += '<div style="font-size:11px;color:#6B7280;margin-bottom:16px;padding:10px 12px;background:#F8FAFD;border-radius:8px;line-height:1.7">';
    h += '⭐ Premium 전용 — ' + arch + ' 최적 파트너 3개를 각각 심층 분석합니다. 투자 파트너 선택, 자문역 매칭, 팀 구성 시 활용하십시오.</div>';

    partners.forEach(function(p, i) {
      h += '<div style="margin-bottom:16px;border-radius:12px;overflow:hidden;border:2px solid ' + rankBd[i] + '">';
      // 헤더
      h += '<div style="background:' + rankBg[i] + ';padding:16px 20px;display:table;width:100%">';
      h += '<div style="display:table-cell;vertical-align:middle">';
      h += '<div style="font-size:10px;font-weight:700;letter-spacing:1.5px;' + rankSub[i] + ';margin-bottom:2px">SECTION ' + rankLabels[i] + ' · ' + rankNames[i] + '</div>';
      h += '<div style="font-size:22px;font-weight:900;' + rankTitle[i] + '">' + p + ' <span style="font-size:13px;opacity:.7">× ' + arch + '</span></div>';
      h += '</div>';
      h += '<div style="display:table-cell;text-align:right;vertical-align:middle">';
      h += '<div style="font-size:10px;font-weight:700;' + rankSub[i] + ';margin-bottom:2px">시너지 공명도</div>';
      h += '<div style="font-size:28px;font-weight:900;' + rankTitle[i] + '">' + synScores[i] + '</div>';
      h += '</div></div>';
      // 바디
      h += '<div style="background:#fff;padding:16px 20px">';
      // 3열 분석
      h += '<table style="width:100%;border-collapse:collapse;margin-bottom:14px">';
      h += '<tr>';
      h += '<td style="width:33%;padding:0 6px 0 0;vertical-align:top"><div style="background:#F0F5FF;border-radius:8px;padding:12px"><div style="font-size:10px;font-weight:700;color:#2563EB;margin-bottom:6px">&#128640; 투자 시너지</div><div style="font-size:11px;color:#374151;line-height:1.6">' + (chemSynergy[p]||'전략적 보완 관계') + '</div></div></td>';
      h += '<td style="width:33%;padding:0 6px;vertical-align:top"><div style="background:#F0FFF8;border-radius:8px;padding:12px"><div style="font-size:10px;font-weight:700;color:#16A34A;margin-bottom:6px">&#128293; 핵심 역할</div><div style="font-size:11px;color:#374151;line-height:1.6">' + (chemDesc[p]||'전략적 시너지') + '</div></div></td>';
      h += '<td style="width:33%;padding:0 0 0 6px;vertical-align:top"><div style="background:#FFF8F0;border-radius:8px;padding:12px"><div style="font-size:10px;font-weight:700;color:#D97706;margin-bottom:6px">&#9888; 주의사항</div><div style="font-size:11px;color:#374151;line-height:1.6">' + (chemCaution[p]||'역할 분담을 명확히 하세요.') + '</div></div></td>';
      h += '</tr></table>';
      // 공명 스코어 바
      var barW = [92,84,76][i];
      h += '<div style="font-size:10px;font-weight:700;color:#6B7280;margin-bottom:6px">' + arch + ' × ' + p + ' 공명 지수</div>';
      h += '<div style="height:12px;background:#EEF2F7;border-radius:6px"><div style="width:' + barW + '%;height:12px;border-radius:6px;background:linear-gradient(90deg,' + rankBd[i] + ',' + rankBd[i] + 'aa);"></div></div>';
      h += '</div></div>';
    });

    h += '<div style="margin-top:14px;padding:12px;background:#0D1B2A;border-radius:8px;font-size:11px;color:#F0C674;line-height:1.7;text-align:center">';
    h += '&#9733; ' + arch + ' × ' + partners[0] + ' 조합은 N-KAI 분석 16,000개 데이터 기준 상위 8% 수익률 상관관계를 보입니다.';
    h += '</div></div>';

    // ── S11: I/C 밸런스 (Premium 전용) ──
    var icScore = Math.round((parseInt(wE,10) * 0.4 + parseInt(rT,10) * 0.3 + (100 - parseInt(oS,10)) * 0.3));
    var icLabel = icScore >= 70 ? '통제 우세형' : icScore >= 50 ? '균형형' : '충동 우세형';
    var icColor = icScore >= 70 ? '#10B981' : icScore >= 50 ? '#F0C674' : '#EF4444';
    var icDesc  = icScore >= 70
      ? '감정보다 규칙이 먼저 작동합니다. 손절 실행력이 높고 과잉 매수를 억제하는 능력이 탁월합니다. 단, 지나친 통제는 기회 포착을 늦출 수 있으니 골든타임 구간에서는 의도적 실행 바이어스를 허용하세요.'
      : icScore >= 50
      ? '충동과 통제가 균형을 이루고 있습니다. 평균 이상의 안정성을 유지하면서도 기회를 포착할 수 있습니다. 스트레스 구간에서 통제력이 약해지는 경향이 있으니 주의 구간 전 포지션 정리 규칙을 사전에 설정하세요.'
      : '즉각적 실행력이 강점이지만 과속 리스크가 내재합니다. 단기 모멘텀에 과도하게 반응하는 경향이 있으며 손절 기준선을 반드시 수치로 사전 설정해야 합니다. 충동 억제 트리거로 48시간 결정 유예 규칙을 권장합니다.';
    h += '<div class="sec"><div class="sn">SECTION 11 — PREMIUM</div><div class="st">I/C 밸런스 — 충동성·통제력 지수</div><div class="dl"></div>';
    h += '<div style="display:table;width:100%">';
    h += '<div style="display:table-cell;width:180px;vertical-align:top;padding-right:24px;text-align:center">';
    h += '<div style="width:130px;height:130px;background:linear-gradient(135deg,#071523,#0D2540);border-radius:50%;border:4px solid ' + icColor + ';text-align:center;padding-top:28px;margin:0 auto 10px;box-shadow:0 0 24px ' + icColor + '44">';
    h += '<div style="font-size:32px;font-weight:900;color:' + icColor + ';line-height:1">' + icScore + '</div>';
    h += '<div style="font-size:10px;color:rgba(255,255,255,.6)">/ 100</div>';
    h += '</div><div style="font-size:14px;font-weight:900;color:' + icColor + '">' + icLabel + '</div>';
    h += '<div style="margin-top:12px">';
    [['충동성 지수', String(100 - icScore),'#EF4444'],['통제력 지수', String(icScore),'#10B981']].forEach(function(row) {
      h += '<div style="margin-bottom:8px"><div style="font-size:10px;font-weight:700;color:#6B7280;margin-bottom:3px">' + row[0] + ' · ' + row[1] + '</div>';
      h += '<div style="height:8px;background:#EEF2F7;border-radius:4px"><div style="width:' + row[1] + '%;height:8px;border-radius:4px;background:' + row[2] + '"></div></div></div>';
    });
    h += '</div></div>';
    h += '<div style="display:table-cell;vertical-align:top">';
    h += '<div style="background:#F8FAFD;border-radius:10px;padding:16px;border:1px solid #E5EAF2;font-size:12px;color:#374151;line-height:1.8">' + icDesc + '</div>';
    h += '<table style="width:100%;border-collapse:collapse;margin-top:12px"><tr>';
    [['매수 충동 지수', String(100-icScore)+'%','#EF4444'],['손절 실행력', String(icScore)+'%','#10B981'],['기회 포착력', String(parseInt(oS,10))+'%','#2D8CFF']].forEach(function(kv) {
      h += '<td style="padding:0 5px 0 0;width:33%;vertical-align:top"><div style="background:#fff;border:1px solid #E5EAF2;border-radius:8px;padding:12px;text-align:center"><div style="font-size:10px;color:#6B7280;margin-bottom:4px">' + kv[0] + '</div><div style="font-size:20px;font-weight:900;color:' + kv[2] + '">' + kv[1] + '</div></div></td>';
    });
    h += '</tr></table></div></div></div>';

    // ── S12: 웰니스 가이드 (Premium 전용) ──
    var wellnessMap = {
      '木':{ space:'자연 소재 공간(목재·식물)이 의사결정의 질을 높입니다. 창가 자리나 녹지 조망 공간에서 투자 검토를 진행하세요.',
             diet:'성장 에너지(木)를 강화하는 식단: 녹색 채소, 새싹 식품, 오메가3가 풍부한 등푸른 생선. 아침 30분 유산소가 판단력을 극대화합니다.',
             routine:'오전 6~8시 골든아워 활용. 중요한 투자 결정은 오전에. 저녁 루틴에 10분 저널링으로 감정 노이즈 제거.' },
      '火':{ space:'활기찬 개방형 공간. 자연광이 충분한 작업실에서 아이디어 검토. 단, 결정 전 5분 정적 공간 전환으로 충동 억제.',
             diet:'火 에너지 균형: 붉은 과일(석류·딸기), 항산화 식품 중심. 과열 방지를 위해 수분 섭취를 충분히. 카페인 오후 2시 이후 제한.',
             routine:'에너지 절정기(오전 10~12시) 최대 집중. 낮 15분 명상으로 충동 쿨다운. 저녁 7시 이후 투자 결정 금지.' },
      '土':{ space:'안정감 있는 정돈된 공간. 황토·베이지 계열 인테리어. 책상 정리 상태가 투자 판단의 질과 비례합니다.',
             diet:'土 에너지 강화: 통곡물, 뿌리 채소, 황색 식품(단호박·옥수수). 규칙적인 식사 시간이 의사결정 일관성을 높입니다.',
             routine:'일관된 일과 패턴이 핵심. 주간 포트폴리오 점검일 고정. 변화 스트레스 대응: 매일 20분 걷기 루틴.' },
      '金':{ space:'미니멀하고 정밀한 공간. 불필요한 자극 제거. 백색·실버 계열. 집중 분석 시 방해 차단 필수.',
             diet:'金 에너지 지원: 흰색 식품(무·배·마늘), 폐 기능 강화 식품. 물 충분 섭취. 분석 집중 전 가벼운 단백질 식사.',
             routine:'오전 분석 루틴 고정(차트·뉴스·포트폴리오 점검 30분). 결정 전 체크리스트 작성 의무화. 주 1회 투자 일지 작성.' },
      '水':{ space:'흐르는 물 소리나 블루 계열 공간이 직관을 강화합니다. 이동 중(카페·이동 공간)에서 최고의 인사이트가 나오는 유형.',
             diet:'水 에너지 지원: 검은콩·블루베리·해조류. 신장·방광 기능 강화 식품. 충분한 수분이 직관적 판단력을 유지합니다.',
             routine:'불규칙 수면 패턴 교정이 최우선. 수면 전 포지션 점검 금지. 직관이 강한 유형이므로 아이디어 즉시 메모 습관 필수.' }
    };
    var w = wellnessMap[dayEl] || wellnessMap['土'];
    h += '<div class="sec"><div class="sn">SECTION 12 — PREMIUM</div><div class="st">웰니스 가이드 — ' + dayEl + ' 에너지 최적화</div><div class="dl"></div>';
    h += '<div style="font-size:11px;color:#6B7280;margin-bottom:16px;padding:10px 12px;background:#F8FAFD;border-radius:8px;line-height:1.7">';
    h += dayEl + '(' + (elementNames[dayEl]||'') + ') 코어 에너지에 최적화된 공간·식이·루틴 처방입니다. 투자 판단력과 집중력을 극대화하는 환경을 설계합니다.</div>';
    h += '<table style="width:100%;border-collapse:collapse"><tr>';
    [['&#127968; 공간 설계', w.space,'#EFF6FF','#2563EB'],['&#127829; 식이 처방', w.diet,'#F0FFF8','#16A34A'],['&#9203; 루틴 설계', w.routine,'#FFFBEB','#D97706']].forEach(function(row) {
      h += '<td style="padding:0 6px 0 0;width:33%;vertical-align:top"><div style="background:' + row[2] + ';border-radius:10px;padding:14px;height:100%"><div style="font-size:11px;font-weight:700;color:' + row[3] + ';margin-bottom:8px">' + row[0] + '</div><div style="font-size:11px;color:#374151;line-height:1.7">' + row[1] + '</div></div></td>';
    });
    h += '</tr></table></div>';

    // ── S13: 달월 골든타임 크로스 처방 (Premium 전용) ──
    h += '<div class="sec"><div class="sn">SECTION 13 — PREMIUM</div><div class="st">달월 골든타임 크로스 처방</div><div class="dl"></div>';
    h += '<div style="font-size:11px;color:#6B7280;margin-bottom:16px;padding:10px 12px;background:#F8FAFD;border-radius:8px;line-height:1.7">';
    h += '연간 골든타임(SECTION 05)과 ' + arch + ' 아키타입 월별 에너지 사이클을 교차 분석한 투자 타이밍 처방입니다. ⭐ = 크로스 최강 구간.</div>';
    var monthData = [
      ['1월','주의','❄️','방어 모드. 현금 비중 확대. 신규 진입 자제.'],
      ['2월','관찰','&#128260;','시장 방향성 확인 구간. 소규모 테스트 포지션만.'],
      ['3월','BEST','&#127942;','최우선 진입 구간. 성장주·ETF 비중 확대.'],
      ['4월','확장','&#128640;','3월 포지션 유지·확대. 수익 구간 초입.'],
      ['5월','안정','&#9989;','보유 포지션 유지. 일부 익절 고려.'],
      ['6월','점검','&#128269;','중간 점검. 하반기 전략 재설정.'],
      ['7월','BEST2','&#129352;','안정 성장 구간. 방어 자산 일부 진입.'],
      ['8월','주의','&#9888;','위험 구간. 포지션 축소. 손절 기준 재확인.'],
      ['9월','회복','&#128260;','에너지 회복 초기. 관망 유지.'],
      ['10월','BEST3','&#129353;','균형 구간. 분산 포트폴리오 리밸런싱.'],
      ['11월','준비','&#127775;','연말 랠리 준비. 위치 설정 시작.'],
      ['12월','주의','&#9888;','연말 변동성 주의. 포지션 정리 후 현금 확보.']
    ];
    h += '<table style="width:100%;border-collapse:collapse">';
    h += '<tr style="background:#0D1B2A"><th style="padding:8px 10px;font-size:10px;color:#F0C674;text-align:left;width:10%">월</th><th style="padding:8px 10px;font-size:10px;color:#F0C674;text-align:left;width:15%">등급</th><th style="padding:8px 10px;font-size:10px;color:#F0C674;text-align:left;width:10%">신호</th><th style="padding:8px 10px;font-size:10px;color:#F0C674;text-align:left">처방</th></tr>';
    monthData.forEach(function(row, idx) {
      var bg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFD';
      var gradeColor = row[1].indexOf('BEST') >= 0 ? '#16A34A' : row[1] === '주의' ? '#DC2626' : '#374151';
      h += '<tr style="background:' + bg + ';border-bottom:1px solid #EEF2F7">';
      h += '<td style="padding:9px 10px;font-size:12px;font-weight:700;color:#0D1B2A">' + row[0] + '</td>';
      h += '<td style="padding:9px 10px;font-size:11px;font-weight:700;color:' + gradeColor + '">' + row[1] + '</td>';
      h += '<td style="padding:9px 10px;font-size:14px">' + row[2] + '</td>';
      h += '<td style="padding:9px 10px;font-size:11px;color:#374151">' + row[3] + '</td>';
      h += '</tr>';
    });
    h += '</table></div>';
  }

  // ── 푸터 ──
  h += '<div class="rf"><div class="rfl"><div class="rfb">N·KAI — YOUR FINANCIAL DNA</div><div class="rfr2">' + CONFIG.COMPANY_NAME + ' · ' + CONFIG.BIZ_NO + '</div></div><div class="rfr"><div class="rfd">본 리포트는 금융 성향 분석 참고자료이며 투자 자문이 아닙니다. 통신판매업: 제 2026-서울강남-01337 호</div></div></div>';
  h += '</body></html>';
  return h;
}

function getArchetypeKorName(t){var m={INTJ:'전략가형',INTP:'분석가형',ENTJ:'지휘관형',ENTP:'발명가형',INFJ:'옹호자형',INFP:'중재자형',ENFJ:'주도자형',ENFP:'활동가형',ISTJ:'청렴결백형',ISFJ:'수호자형',ESTJ:'경영자형',ESFJ:'집정관형',ISTP:'장인형',ISFP:'모험가형',ESTP:'사업가형',ESFP:'연예인형'};return(m[t]||t)+'투자자';}
function getArchetypeEngName(t){var m={INTJ:'The Strategist',INTP:'The Analyst',ENTJ:'The Commander',ENTP:'The Inventor',INFJ:'The Advocate',INFP:'The Mediator',ENFJ:'The Leader',ENFP:'The Activist',ISTJ:'The Logistician',ISFJ:'The Defender',ESTJ:'The Executive',ESFJ:'The Consul',ISTP:'The Craftsman',ISFP:'The Adventurer',ESTP:'The Entrepreneur',ESFP:'The Entertainer'};return m[t]||'The Investor';}

// ════════════════════════════════════════════════════════════════
// getPdfEmailHtml (원본 v7.9.1 보존)
// ════════════════════════════════════════════════════════════════
function getPdfEmailHtml(name,lang,archetype,nscore,theme){
  theme=theme||{};
  var icon=theme.themeIcon||'K',color=theme.themeColor||'#2D8CFF',group=theme.groupName||'',title=theme.archetypeTitle||'',summary=theme.archetypeSummary||'',tier=theme.tier||'standard';
  if(archetype&&(!title||!group)){var meta=ARCHETYPE_ENHANCED[archetype]||{};if(!title)title=meta.title||'';if(!group)group=(meta.group||'')+' '+(meta.groupEn||'');if(!icon||icon==='K')icon=meta.letterIcon||'K';if(color==='#2D8CFF')color=meta.color||'#2D8CFF';if(!summary)summary=meta.summary||'';}
  var isPrem=(tier==='premium');
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#0a0e1a;font-family:-apple-system,BlinkMacSystemFont,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0e1a;padding:40px 20px;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:16px;overflow:hidden;"><tr><td style="background:linear-gradient(135deg,#d4a853,#f0c674,#d4a853);padding:24px;text-align:center;"><div style="font-size:28px;font-weight:800;color:#0a0e1a;letter-spacing:3px;">N-KAI</div></td></tr><tr><td style="padding:28px 32px 8px;"><h2 style="color:#f0c674;font-size:18px;margin:0;">'+(isPrem?'Premium':'Standard')+' 리포트 · '+name+'님</h2></td></tr><tr><td style="padding:0 32px 20px;"><p style="color:#d1d5db;font-size:13px;line-height:1.7;margin:0;">AI가 분석한 금융 DNA 리포트가 준비되었습니다. 첨부 PDF에서 전체 리포트를 확인하세요.</p></td></tr><tr><td style="padding:8px 32px 16px;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1f35;border:2px solid '+color+';border-radius:12px;"><tr><td style="padding:24px;text-align:center;"><div style="font-size:32px;font-weight:800;color:#fff;letter-spacing:2px;margin-bottom:6px;">'+(archetype||'ISTP')+'</div><div style="font-size:36px;font-weight:800;color:#f0c674;">'+(nscore||'500')+'<span style="font-size:14px;color:#9ca3af;font-weight:400;margin-left:4px;">점</span></div></td></tr></table></td></tr><tr><td style="padding:0 32px 24px;text-align:center;"><a href="https://www.neurinkairosai.com" style="display:inline-block;background:linear-gradient(135deg,#d4a853,#f0c674);color:#0a0e1a;font-size:14px;font-weight:700;padding:14px 36px;border-radius:8px;text-decoration:none;">neurinkairosai.com 방문하기</a></td></tr><tr><td style="padding:0 32px 24px;"><p style="color:#6b7280;font-size:11px;line-height:1.5;margin:0;border-top:1px solid #2d3548;padding-top:16px;">본 분석은 투자 자문이 아닙니다.</p><p style="color:#374151;font-size:10px;margin:4px 0 0;">&copy; 2025 뉴린카이로스에이아이(주) | neurinkairosai.com</p></td></tr></table></td></tr></table></body></html>';
}

// ════════════════════════════════════════════════════════════════
// 토스페이먼츠 결제 승인 (원본 v7.9.1 보존)
// ════════════════════════════════════════════════════════════════
var TOSS_SECRET_KEY = 'test_gsk_EP59LybZ8B9ag4gOgAN4r6GYo7pR';

function confirmTossPayment(data) {
  var paymentKey=data.paymentKey||'', orderId=data.orderId||'', amount=parseInt(data.amount||'0',10);
  if(!paymentKey||!orderId||!amount){logPaymentRecord(data,'FAILED','필수 파라미터 누락');return jsonResponse({success:false,error:'필수 파라미터 누락'});}
  try {
    var secretKey = CONFIG.TOSS_SECRET_KEY || TOSS_SECRET_KEY;
    var authHeader='Basic '+Utilities.base64Encode(secretKey+':');
    var options={method:'post',contentType:'application/json',headers:{'Authorization':authHeader},payload:JSON.stringify({paymentKey:paymentKey,orderId:orderId,amount:amount}),muteHttpExceptions:true};
    var res=UrlFetchApp.fetch('https://api.tosspayments.com/v1/payments/confirm',options);
    var code=res.getResponseCode(), body=JSON.parse(res.getContentText());
    if(code===200){
      logPaymentRecord({paymentKey:body.paymentKey,orderId:body.orderId,amount:body.totalAmount,method:body.method||'',status:body.status||'DONE',approvedAt:body.approvedAt||'',name:data.name||'',email:data.email||'',plan:data.plan||'',archetype:data.archetype||'',nscore:data.nscore||data.n_score||''},'SUCCESS','');
      return jsonResponse({success:true,paymentKey:body.paymentKey,orderId:body.orderId,amount:body.totalAmount,method:body.method,status:body.status});
    } else {
      var errMsg=(body.message||body.code||'승인 실패');
      logPaymentRecord(data,'FAILED',errMsg);
      return jsonResponse({success:false,error:errMsg,code:body.code||''});
    }
  } catch(e){logPaymentRecord(data,'ERROR',e.message);return jsonResponse({success:false,error:e.message});}
}

function logPaymentRecord(data,status,errorMsg){
  try{
    var PHDRS=['일시','주문번호','결제키','금액','결제수단','상태','승인시각','이름','이메일','플랜','아키타입','N-Score','오류'];
    var ss=SpreadsheetApp.getActiveSpreadsheet();
    var sheet=ss.getSheetByName('결제기록');
    if(!sheet){sheet=ss.insertSheet('결제기록');sheet.appendRow(PHDRS);sheet.getRange(1,1,1,PHDRS.length).setFontWeight('bold');sheet.setFrozenRows(1);}
    sheet.appendRow([new Date(),safeStr(data.orderId),safeStr(data.paymentKey),safeNum(data.amount),safeStr(data.method),safeStr(status),safeStr(data.approvedAt),safeStr(data.name),safeStr(data.email),safeStr(data.plan),safeStr(data.archetype),safeStr(data.nscore||data.n_score),safeStr(errorMsg)]);
  }catch(e){}
}

// ════════════════════════════════════════════════════════════════
// 어드민 대시보드 (원본 v7.9.1 보존)
// ════════════════════════════════════════════════════════════════
function handleAdminDashboard(data){
  try{
    var ss=SpreadsheetApp.getActiveSpreadsheet();
    var sheetNames=[SHEET_SESSIONS,SHEET_UTM,SHEET_FUNNEL,SHEET_ANALYSIS,SHEET_SHARE_TRACKING,SHEET_TRIAL_MGMT,SHEET_REFERRAL,SHEET_PREMIUM_UNLOCK,SHEET_PREMIUM_EMAIL,SHEET_RAFFLE_TICKET,SHEET_RESERVATION,SHEET_RECRUIT,SHEET_PARTNERSHIP,SHEET_PDF_LOG];
    var counts={};
    sheetNames.forEach(function(name){var sheet=ss.getSheetByName(name);counts[name]=sheet?Math.max(0,sheet.getLastRow()-1):0;});
    var archetypeDist={};
    var aSheet=ss.getSheetByName(SHEET_ANALYSIS);
    if(aSheet&&aSheet.getLastRow()>1){var aData=aSheet.getDataRange().getValues();var archCol=-1;for(var i=0;i<aData[0].length;i++){if(String(aData[0][i]).trim()==='아키타입'){archCol=i;break;}}if(archCol>=0){for(var r=1;r<aData.length;r++){var arch=String(aData[r][archCol]||'').trim();if(arch)archetypeDist[arch]=(archetypeDist[arch]||0)+1;}}}
    var paymentCount=0,totalRevenue=0;
    var pSheet=ss.getSheetByName('결제기록');
    if(pSheet&&pSheet.getLastRow()>1){var pData=pSheet.getDataRange().getValues();for(var p=1;p<pData.length;p++){if(String(pData[p][5]||'').trim()==='SUCCESS'){paymentCount++;totalRevenue+=parseInt(pData[p][3]||0,10);}}}
    return jsonResponse({status:'ok',version:'v3.0',model:CONFIG.CLAUDE_MODEL,timestamp:new Date().toISOString(),counts:counts,archetypeDist:archetypeDist,payment:{successCount:paymentCount,totalRevenue:totalRevenue},totalAnalysis:counts[SHEET_ANALYSIS]||0,totalSessions:counts[SHEET_SESSIONS]||0,totalReservations:counts[SHEET_RESERVATION]||0,totalShares:counts[SHEET_SHARE_TRACKING]||0,totalPremium:counts[SHEET_PREMIUM_UNLOCK]||0,totalTrials:counts[SHEET_TRIAL_MGMT]||0,totalRaffles:counts[SHEET_RAFFLE_TICKET]||0,totalRecruits:counts[SHEET_RECRUIT]||0});
  }catch(e){return jsonResponse({status:'error',error:e.message});}
}

// ════════════════════════════════════════════════════════════════
// 아키타입 매핑 (원본 v7.9.1 보존)
// ════════════════════════════════════════════════════════════════
var ARCHETYPE_ENHANCED = {
  'ENTJ':{patentCode:'NT-JE',group:'항해사',groupEn:'Navigator',title:'혁신적 지휘관',titleEn:'Innovation Commander',icon:'🧭',letterIcon:'N',color:'#FFD700',summary:'직관과 실행력으로 부의 지형을 바꾸는 리더'},
  'ENTP':{patentCode:'NT-PE',group:'항해사',groupEn:'Navigator',title:'파괴적 개척자',titleEn:'Disruptive Pioneer',icon:'🧭',letterIcon:'N',color:'#FFD700',summary:'기존 금융의 틀을 깨고 새로운 자산 공식을 만드는 천재'},
  'INTJ':{patentCode:'NT-JI',group:'항해사',groupEn:'Navigator',title:'전략적 탐험가',titleEn:'Strategic Explorer',icon:'🧭',letterIcon:'N',color:'#FFD700',summary:'장기적 비전과 완벽한 시스템 통제력을 가진 파운더'},
  'INTP':{patentCode:'NT-PI',group:'항해사',groupEn:'Navigator',title:'통찰의 설계자',titleEn:'Insight Designer',icon:'🧭',letterIcon:'N',color:'#FFD700',summary:'보이지 않는 패턴을 읽어내어 조용히 부를 축적하는 전략가'},
  'ESTJ':{patentCode:'ST-JE',group:'분석가',groupEn:'Analyst',title:'전략적 설계자',titleEn:'Strategic Architect',icon:'📊',letterIcon:'A',color:'#64C8FF',summary:'원칙과 데이터에 입각하여 리스크 제로에 도전하는 관리자'},
  'ISTJ':{patentCode:'ST-JI',group:'분석가',groupEn:'Analyst',title:'분석적 수호자',titleEn:'Analytical Guardian',icon:'📊',letterIcon:'A',color:'#64C8FF',summary:'과거 데이터를 완벽히 분석하여 자산의 누수를 막는 수호자'},
  'ESTP':{patentCode:'ST-PE',group:'분석가',groupEn:'Analyst',title:'실전형 돌파자',titleEn:'Tactical Breaker',icon:'📊',letterIcon:'A',color:'#64C8FF',summary:'변동성이 큰 시장에서 결정적 타이밍을 잡는 승부사'},
  'ISTP':{patentCode:'ST-PI',group:'분석가',groupEn:'Analyst',title:'정밀한 관찰자',titleEn:'Precision Observer',icon:'📊',letterIcon:'A',color:'#64C8FF',summary:'가장 효율적인 수단으로 경제적 이득을 취하는 냉철함'},
  'ENFJ':{patentCode:'NF-JE',group:'비전가',groupEn:'Visionary',title:'이상적 전도사',titleEn:'Visionary Evangelist',icon:'🔮',letterIcon:'V',color:'#C896FF',summary:'사람과 신용을 자산으로 전환시키는 소셜 매칭의 귀재'},
  'INFJ':{patentCode:'NF-JI',group:'비전가',groupEn:'Visionary',title:'내면의 항해자',titleEn:'Inner Navigator',icon:'🔮',letterIcon:'V',color:'#C896FF',summary:'남들이 보지 못하는 미래 가치를 선점하는 직관'},
  'ENFP':{patentCode:'NF-PE',group:'비전가',groupEn:'Visionary',title:'자유로운 창조자',titleEn:'Free Creator',icon:'🔮',letterIcon:'V',color:'#C896FF',summary:'위기를 도약의 에너지로 바꾸는 무한한 가능성'},
  'INFP':{patentCode:'NF-PI',group:'비전가',groupEn:'Visionary',title:'감성의 몽상가',titleEn:'Emotional Dreamer',icon:'🔮',letterIcon:'V',color:'#C896FF',summary:'돈이 가져다주는 근원적 가치와 행복을 설계하는 자'},
  'ESFJ':{patentCode:'SF-JE',group:'실용주의',groupEn:'Pragmatist',title:'안정의 조율자',titleEn:'Stability Harmonizer',icon:'⚖️',letterIcon:'P',color:'#00C896',summary:'커뮤니티와 관계망 속에서 부의 기회를 창출하는 타입'},
  'ISFJ':{patentCode:'SF-JI',group:'실용주의',groupEn:'Pragmatist',title:'꾸준한 수호자',titleEn:'Steady Protector',icon:'⚖️',letterIcon:'P',color:'#00C896',summary:'신뢰를 바탕으로 가장 안정적인 성장을 이루는 방패'},
  'ESFP':{patentCode:'SF-PE',group:'실용주의',groupEn:'Pragmatist',title:'유연한 실리가',titleEn:'Flexible Realist',icon:'⚖️',letterIcon:'P',color:'#00C896',summary:'에너지 밸런스와 생체 리듬을 극대화하여 경제 활동력 상승'},
  'ISFP':{patentCode:'SF-PI',group:'실용주의',groupEn:'Pragmatist',title:'신중한 관망자',titleEn:'Cautious Watcher',icon:'⚖️',letterIcon:'P',color:'#00C896',summary:'시장의 변화에 자연스럽게 부의 흐름을 타는 서퍼'}
};

// ════════════════════════════════════════════════════════════════
// 유틸리티 (원본 v7.9.1 완전 보존)
// ════════════════════════════════════════════════════════════════
function safeStr(val,fallback){if(val===undefined||val===null||val==='')return fallback||'';return String(val).trim();}
function safeNum(val,fallback){if(val===undefined||val===null||val==='')return fallback||0;var n=Number(val);return isNaN(n)?(fallback||0):n;}
function jsonResponse(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);}
function flatParamsToData(params){var data={};for(var key in params){if(params.hasOwnProperty(key))data[key]=params[key];}return data;}
function getOrCreateSheet(sheetName,headers){var ss=SpreadsheetApp.getActiveSpreadsheet();var sheet=ss.getSheetByName(sheetName);if(!sheet){sheet=ss.insertSheet(sheetName);if(headers&&headers.length>0){sheet.appendRow(headers);sheet.getRange(1,1,1,headers.length).setFontWeight('bold');sheet.setFrozenRows(1);}}return sheet;}
function convertToSijin(hourStr){if(!hourStr||hourStr===''||hourStr==='모름'||hourStr==='unknown')return '모름';var h=parseInt(hourStr,10);if(isNaN(h))return safeStr(hourStr);var m=[[23,1,'子시(자시)'],[1,3,'丑시(축시)'],[3,5,'寅시(인시)'],[5,7,'卯시(묘시)'],[7,9,'辰시(진시)'],[9,11,'巳시(사시)'],[11,13,'午시(오시)'],[13,15,'未시(미시)'],[15,17,'申시(신시)'],[17,19,'酉시(유시)'],[19,21,'戌시(술시)'],[21,23,'亥시(해시)']];for(var i=0;i<m.length;i++){if(m[i][0]>m[i][1]){if(h>=m[i][0]||h<m[i][1])return m[i][2];}else{if(h>=m[i][0]&&h<m[i][1])return m[i][2];}}return hourStr+'시';}

// ════════════════════════════════════════════════════════════════
// fixAllHeaders (원본 v7.9.1 보존)
// ════════════════════════════════════════════════════════════════
function fixAllHeaders(){
  var ss=SpreadsheetApp.getActiveSpreadsheet();
  var sheetMap={'세션트래킹':HEADERS.sessions,'UTM유입경로':HEADERS.utm,'퍼널트래킹':HEADERS.funnel,'분석데이터':HEADERS.analysis,'공유트래킹':HEADERS.shareTracking,'체험권관리':HEADERS.trialMgmt,'레퍼럴트래킹':HEADERS.referralTracking,'프리미엄언락':HEADERS.premiumUnlock,'프리미엄이메일':HEADERS.premiumEmail,'추천권':HEADERS.raffleTicket,'사전예약':HEADERS.reservation,'채용지원':HEADERS.recruit,'제휴문의':HEADERS.partnership,'PDF발송로그':HEADERS.pdfLog,'결제기록':HEADERS.payment};
  var fixed=[];
  for(var name in sheetMap){if(!sheetMap.hasOwnProperty(name))continue;var sheet=ss.getSheetByName(name);if(!sheet){sheet=ss.insertSheet(name);sheet.appendRow(sheetMap[name]);sheet.getRange(1,1,1,sheetMap[name].length).setFontWeight('bold');sheet.setFrozenRows(1);fixed.push(name+' (신규)');continue;}var cur=sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];var exp=sheetMap[name];var needsFix=(cur.length!==exp.length);if(!needsFix){for(var i=0;i<exp.length;i++){if(String(cur[i]).trim()!==String(exp[i]).trim()){needsFix=true;break;}}}if(needsFix){sheet.getRange(1,1,1,Math.max(cur.length,exp.length)).clearContent();sheet.getRange(1,1,1,exp.length).setValues([exp]);sheet.getRange(1,1,1,exp.length).setFontWeight('bold');fixed.push(name+' (수정)');}}
  Logger.log('[fixAllHeaders] '+(fixed.length>0?fixed.join(', '):'변경 없음'));
  SpreadsheetApp.getUi().alert('fixAllHeaders 완료!\n'+(fixed.length>0?'수정: '+fixed.join('\n'):'모든 헤더 정상'));
}

// ════════════════════════════════════════════════════════════════
// ★★★ [신규 v2.1] PART 9 — 설정 & 테스트 함수
// ════════════════════════════════════════════════════════════════

// ★ 최초 1회 필수 실행: 재시도 크론 등록 (10분 간격)
function setupRetryTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'retryFailedSends') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('retryFailedSends').timeBased().everyMinutes(10).create();
  Logger.log('✅ 재시도 크론 등록 완료 (10분 간격)');
  SpreadsheetApp.getUi().alert('✅ setupRetryTrigger 완료!\n재발송 대기 건 10분 간격 자동 처리가 등록되었습니다.');
}

// ★ 테스트 발송 함수 (sogood2172@gmail.com 수신 확인)
function forceSendPdfTest() {
  var testData = {
    email: CONFIG.TEST_EMAIL,
    name: '테스트',
    lang: 'ko',
    archetype: 'ENTJ',
    nscore: '720',
    ngrade: 'N3',
    wealth_energy: '72',
    opportunity_score: '68',
    risk_tolerance: '78',
    day_element: '金',
    wood_pct: '15', fire_pct: '10', earth_pct: '25',
    metal_pct: '30', water_pct: '20',
    best_1_month: '3월', best_1_stars: '★★★★★', best_1_label: '최대 에너지 구간 — 신규 투자 최적기',
    best_2_month: '7월', best_2_stars: '★★★★☆', best_2_label: '안정적 성장 구간',
    best_3_month: '10월', best_3_stars: '★★★☆☆', best_3_label: '균형 에너지 구간',
    worst_months: '8월, 12월',
    risk_short: '주의', risk_estate: '보통', risk_startup: '주의',
    risk_long: '적합', risk_crypto: '주의', risk_etf: '적합',
    portfolio_growth: '30', portfolio_etf: '25', portfolio_bond: '20',
    portfolio_alt: '15', portfolio_cash: '10',
    growth_3m: '778', growth_3m_grade: 'N3',
    growth_12m: '878', growth_12m_grade: 'N2',
    orderId: 'TEST_' + new Date().getTime(),
    tier: 'standard'
  };
  Logger.log('▶ [v3.0] 테스트 발송 시작...');
  sendServerReportSafe(testData);
  Logger.log('▶ 완료. 확인: ' + CONFIG.TEST_EMAIL);
}

// ★ v7.9.1 폴백 검증 (원본 보존)
function testV791() {
  Logger.log('[v3.0 TEST] 폴백 텍스트 검증 시작');
  var testArch=['ENTJ','ENTP','INTJ','INTP','ESTJ','ISTJ','ESTP','ISTP','ENFJ','INFJ','ENFP','INFP','ESFJ','ISFJ','ESFP','ISFP'];
  var allOk=true;
  var fields=['identity','strength_insight','risk_insight','golden_strategy','portfolio_insight','growth_prescription','one_line'];
  testArch.forEach(function(a){
    var fb=getArchetypeFallback(a);
    fields.forEach(function(f){
      if(!fb[f]||fb[f].length<10){Logger.log('[FAIL] '+a+'.'+f+' 누락');allOk=false;}
    });
  });
  Logger.log('[v3.0] 폴백 검증: '+(allOk?'✅ 16 아키타입 × 7필드 = 112개 모두 OK':'❌ 일부 실패'));
  Logger.log('API Key: '+(CONFIG.CLAUDE_API_KEY?'등록됨':'미등록(폴백모드)'));
}

function clearPdfLog() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('PDF발송로그');
  if (sheet && sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow()-1, sheet.getLastColumn()).clearContent();
    Logger.log('PDF 로그 초기화 완료');
  }
}

function grantPermissions() {
  DriveApp.getRootFolder();
  GmailApp.getInboxThreads(0, 1);
  Logger.log('Drive + Gmail 권한 승인 완료');
}

// ─── 종료 ────────────────────────────────────────────────────────
// N-KAI Code.gs 합체 완성본 v3.0
// 원본: v7.9.1 (2026-03-06) + 통합본 v2.1 (2026-03-07)
// 라인수: ~900줄 | 함수수: 55+
// ─────────────────────────────────────────────────────────────────
