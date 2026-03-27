// ╔══════════════════════════════════════════════════════════════╗
// ║   N-KAI Code.gs — 완전 통합본 v2.1                          ║
// ║   ※ 기존 Code.gs 전체 내용을 이것으로 교체하세요            ║
// ║   ※ 추가 작업: setupRetryTrigger() 1회 수동 실행 필요       ║
// ╚══════════════════════════════════════════════════════════════╝

// ══════════════════════════════════════════
//  [설정값] — 여기만 수정
// ══════════════════════════════════════════
const CONFIG = {
  TOSS_SECRET_KEY: PropertiesService.getScriptProperties().getProperty('TOSS_SECRET_KEY') || '',
  CLAUDE_API_KEY:  PropertiesService.getScriptProperties().getProperty('CLAUDE_API_KEY') || '',
  CLAUDE_MODEL:    'claude-sonnet-4-20250514',
  SUPPORT_EMAIL:   'support@neurinkairosai.com',
  TEST_EMAIL:      'sogood2172@gmail.com',
  COMPANY_NAME:    '뉴린카이로스에이아이(주)',
  BIZ_NO:          '172-87-03400',
  SITE_URL:        'https://www.neurinkairosai.com',
};

// ════════════════════════════════════════════════════════════════
//  PART 1 — 웹훅 수신 + 비동기 처리
// ════════════════════════════════════════════════════════════════

function doPost(e) {
  try {
    const raw = e.postData ? e.postData.contents : '{}';
    const params = JSON.parse(raw);

    // 즉시 200 응답 (토스 webhook 6초 타임아웃 방지)
    const response = ContentService
      .createTextOutput(JSON.stringify({ success: true, message: 'queued' }))
      .setMimeType(ContentService.MimeType.JSON);

    // 파라미터를 캐시에 임시 저장
    const cache = CacheService.getScriptCache();
    const jobId = 'job_' + new Date().getTime() + '_' + Math.random().toString(36).substr(2,5);
    cache.put(jobId, JSON.stringify(params), 600);

    // 1초 후 비동기 트리거 생성
    const trigger = ScriptApp.newTrigger('processAsyncJob')
      .timeBased().after(1000).create();

    PropertiesService.getScriptProperties()
      .setProperty('pendingJob_' + trigger.getUniqueId(), jobId);

    return response;

  } catch (err) {
    Logger.log('doPost 오류: ' + err.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function processAsyncJob(e) {
  const triggerId = e ? e.triggerUid : null;
  const props = PropertiesService.getScriptProperties();
  const cache = CacheService.getScriptCache();

  let jobId = null;
  if (triggerId) {
    jobId = props.getProperty('pendingJob_' + triggerId);
    props.deleteProperty('pendingJob_' + triggerId);
  }

  // 트리거 자체 삭제
  if (triggerId) {
    ScriptApp.getProjectTriggers().forEach(t => {
      if (t.getUniqueId() === triggerId) ScriptApp.deleteTrigger(t);
    });
  }

  if (!jobId) { Logger.log('processAsyncJob: jobId 없음'); return; }

  const raw = cache.get(jobId);
  if (!raw) { Logger.log('processAsyncJob: 캐시 만료 ' + jobId); return; }

  cache.remove(jobId);
  const params = JSON.parse(raw);

  if (params.type === 'send_pdf_report' || params.payment_key) {
    sendServerReportSafe(params);
  }
}

// ════════════════════════════════════════════════════════════════
//  PART 2 — 중복 방지 (캐시 기반 O(1))
// ════════════════════════════════════════════════════════════════

function isDuplicatePdfSendFast(orderId) {
  if (!orderId) return false;
  const cache = CacheService.getScriptCache();
  const cacheKey = 'pdfSent_' + orderId;

  if (cache.get(cacheKey)) {
    Logger.log('중복 발송 방지 (캐시): ' + orderId);
    return true;
  }

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const logSheet = ss.getSheetByName('PDF발송로그');
    if (!logSheet) return false;

    const lastRow = logSheet.getLastRow();
    if (lastRow < 2) return false;

    const scanRows = Math.min(200, lastRow - 1);
    const startRow = Math.max(2, lastRow - scanRows + 1);
    const orderIds = logSheet.getRange(startRow, 1, scanRows, 1).getValues();

    for (let i = 0; i < orderIds.length; i++) {
      if (orderIds[i][0] === orderId) {
        cache.put(cacheKey, '1', 86400);
        Logger.log('중복 발송 방지 (Sheets): ' + orderId);
        return true;
      }
    }
  } catch (err) {
    Logger.log('중복 체크 오류: ' + err.toString());
  }
  return false;
}

// ════════════════════════════════════════════════════════════════
//  PART 3 — Claude AI 호출 + 3단계 폴백
// ════════════════════════════════════════════════════════════════

function callClaudeAPIWithFallback(data, tier) {
  const archetype = data.archetype || 'ENTJ';

  // 1차: 풀 프롬프트
  try {
    Logger.log('Claude AI 1차 시도');
    const result = generateAIInterpretation(data, 'full');
    if (result && result.one_line) { Logger.log('Claude AI 1차 성공'); return result; }
  } catch (e1) { Logger.log('Claude AI 1차 실패: ' + e1.toString()); }

  // 2차: 압축 프롬프트
  try {
    Logger.log('Claude AI 2차 시도 (lite)');
    Utilities.sleep(2000);
    const result = generateAIInterpretation(data, 'lite');
    if (result && result.one_line) { Logger.log('Claude AI 2차 성공'); return result; }
  } catch (e2) { Logger.log('Claude AI 2차 실패: ' + e2.toString()); }

  // 3차: 폴백 텍스트
  Logger.log('Claude AI 폴백 텍스트 사용: ' + archetype);
  return getArchetypeFallbackFull(archetype, data);
}

function generateAIInterpretation(data, mode) {
  const apiKey = CONFIG.CLAUDE_API_KEY;
  if (!apiKey) throw new Error('CLAUDE_API_KEY 미등록');

  const isLite = mode === 'lite';
  const prompt = isLite
    ? buildLitePrompt(data)
    : buildFullPrompt(data);

  const response = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    payload: JSON.stringify({
      model: CONFIG.CLAUDE_MODEL,
      max_tokens: isLite ? 500 : 1500,
      messages: [{ role: 'user', content: prompt }]
    }),
    muteHttpExceptions: true
  });

  const result = JSON.parse(response.getContentText());
  if (result.error) throw new Error(result.error.message);

  const text = result.content[0].text;
  return JSON.parse(text.replace(/```json|```/g, '').trim());
}

function buildFullPrompt(data) {
  return `당신은 금융 성향 분석 전문가입니다. 아래 고객 데이터를 분석하여 7개 항목을 JSON으로 반환하세요.

고객 정보:
- 이름: ${data.name}
- 아키타입: ${data.archetype}
- N-Score: ${data.nscore} (${data.ngrade}등급)
- 경제감각: ${data.wealth_energy}/100
- 투자기회포착: ${data.opportunity_score}/100
- 위기대응력: ${data.risk_tolerance}/100
- 코어에너지: 木${data.wood_pct}% 火${data.fire_pct}% 土${data.earth_pct}% 金${data.metal_pct}% 水${data.water_pct}%

다음 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{
  "identity": "2~3문장 아키타입 정체성 설명",
  "strength_insight": "2~3문장 핵심 강점",
  "risk_insight": "2~3문장 주요 리스크",
  "golden_strategy": "2~3문장 최적 투자 전략",
  "portfolio_insight": "2~3문장 포트폴리오 인사이트",
  "growth_prescription": "2~3문장 N-Score 향상 처방",
  "one_line": "15자 이내 핵심 한 줄 정의"
}`;
}

function buildLitePrompt(data) {
  return `금융 성향 분석가입니다. 아키타입 ${data.archetype}, N-Score ${data.nscore}점 고객 분석:
{"identity":"2문장","one_line":"15자이내"}
JSON만 반환하세요.`;
}

// ════════════════════════════════════════════════════════════════
//  PART 4 — 16개 아키타입 폴백 텍스트 (API 실패 시 사용)
// ════════════════════════════════════════════════════════════════

function getArchetypeFallbackFull(archetype, data) {
  const name = data.name || '고객';
  const nscore = data.nscore || '700';
  const fb = {
    ENTJ:{ identity:`${name}님은 전형적인 지휘관형 투자자입니다. 빠른 의사결정과 목표 지향적 사고를 바탕으로 시장을 주도하는 성향이 강하며, 큰 그림을 설계하고 실행하는 데 탁월합니다.`, strength_insight:`전략적 사고와 결단력이 핵심 강점입니다. 복잡한 시장에서도 핵심을 빠르게 파악하고, 타인이 망설일 때 과감히 실행하는 능력이 장기 자산 형성의 원동력입니다.`, risk_insight:`과도한 자신감이 리스크를 키울 수 있습니다. 단기 수익 집착이나 타인 의견 무시로 예상치 못한 손실로 이어질 가능성이 있습니다.`, golden_strategy:`하향식(Top-down) 투자 전략이 최적입니다. 거시경제→섹터→개별 종목 순서로 접근하며 3~5년 단위 장기 테마에 집중하십시오.`, portfolio_insight:`성장주 비중을 높게 유지하되 ETF로 변동성을 헤지하십시오. 현금 비율 최소 10% 유지로 기회 포착 준비 상태를 항상 확보하십시오.`, growth_prescription:`N-Score ${nscore}에서 도약하려면 손절 원칙의 명문화가 선행되어야 합니다. -8% 자동 손절 규칙 설정과 분기별 리밸런싱 루틴을 만드십시오.`, one_line:`시장을 지휘하는 타고난 금융 지휘관` },
    INTJ:{ identity:`${name}님은 치밀한 전략가형 투자자입니다. 감정보다 데이터를 신뢰하며 장기적 관점에서 체계적으로 자산을 설계하는 능력이 탁월합니다.`, strength_insight:`독립적 분석력과 장기적 비전이 최대 강점입니다. 남들이 놓치는 구조적 변화를 조기에 포착하고 확신이 생기면 흔들리지 않고 보유하는 인내력이 있습니다.`, risk_insight:`완벽주의로 인한 진입 타이밍 지연이 주요 리스크입니다. 분석 마비(Analysis Paralysis)로 매수 기회를 놓치는 패턴을 주의하십시오.`, golden_strategy:`퀀트 기반 시스템 투자가 가장 잘 맞습니다. 규칙 기반 매매 시스템을 구축하고 감정 개입 여지를 사전에 차단하십시오.`, portfolio_insight:`성장주와 ETF 균형 배분이 최적입니다. 개별 종목 집중보다 섹터 ETF로 아이디어를 표현하면 리스크 대비 수익률이 극대화됩니다.`, growth_prescription:`N-Score ${nscore} 향상을 위해 투자 일지 작성을 시작하십시오. 매 투자 결정의 근거와 결과를 기록하면 3개월 내 의사결정 정확도가 크게 향상됩니다.`, one_line:`데이터로 미래를 설계하는 냉철한 전략가` },
    ENTP:{ identity:`${name}님은 혁신적인 발명가형 투자자입니다. 새로운 아이디어와 트렌드에 민감하며 남들이 주목하기 전에 기회를 발견하는 선구자적 성향을 가집니다.`, strength_insight:`창의적 발상과 트렌드 포착력이 강점입니다. 기존 패러다임을 의심하고 새로운 관점으로 시장을 바라보는 능력이 한발 앞선 투자를 가능하게 합니다.`, risk_insight:`실행 지속성 부족이 최대 리스크입니다. 새 아이디어에 쉽게 흥분하여 포지션을 자주 바꾸거나 검증 전 과도한 베팅으로 변동성이 커질 수 있습니다.`, golden_strategy:`테마 투자와 조기 진입 전략이 최적입니다. 메가트렌드 초기 단계에서 소규모 진입 후 점진적으로 확대하십시오. 분산 투자가 필수입니다.`, portfolio_insight:`성장주와 대안투자 비중을 높이되 채권으로 안전망을 확보하십시오. 암호화폐 등 고위험 자산은 10% 이내로 제한하는 것이 중요합니다.`, growth_prescription:`N-Score ${nscore}에서 다음 단계로 가려면 하나의 투자 테마에 3개월 이상 집중하는 훈련이 필요합니다. 아이디어 노트를 만들고 주간 단위로 검증하십시오.`, one_line:`트렌드 최전선에서 미래 가치를 발굴하는 혁신가` },
    INTP:{ identity:`${name}님은 분석가형 투자자로 철저한 논리와 체계적 사고를 바탕으로 투자를 접근합니다. 복잡한 금융 데이터를 해독하는 능력이 탁월합니다.`, strength_insight:`논리적 분석력과 독창적 사고가 강점입니다. 다수가 놓치는 숨겨진 패턴을 발견하고 감정 없이 냉정하게 데이터를 해석하는 능력이 장기 수익의 근거입니다.`, risk_insight:`실행력 부족과 과분석이 주요 리스크입니다. 완벽한 타이밍을 찾다 기회를 놓치거나 이론에 치우쳐 시장의 비합리성을 과소평가할 수 있습니다.`, golden_strategy:`가치투자와 퀀트 전략의 결합이 최적입니다. 내재가치 대비 저평가 자산을 체계적으로 발굴하고 소규모 테스트 후 확대 적용하십시오.`, portfolio_insight:`ETF와 채권 중심의 안정적 포트폴리오를 기반으로 확신 있는 개별 종목에 소량 집중 투자하는 전략이 성향에 맞습니다.`, growth_prescription:`N-Score ${nscore} 향상을 위해 소액 실전 매매를 시작하십시오. 분석과 실행 사이의 간격을 좁히는 훈련이 다음 등급으로의 핵심 열쇠입니다.`, one_line:`논리와 데이터로 시장의 진실을 꿰뚫는 분석가` },
    ENFJ:{ identity:`${name}님은 사람 중심의 주도자형 투자자입니다. 공동체와 사회적 가치를 중시하며 ESG 투자와 장기적 임팩트 투자에 강한 친화력을 가집니다.`, strength_insight:`공감 능력과 네트워크 활용이 강점입니다. 주변의 정보와 트렌드를 빠르게 흡수하고 집단 지성을 활용한 투자 결정에서 평균 이상의 성과를 냅니다.`, risk_insight:`타인 의견 과의존과 사회적 압력에 의한 충동 매수가 리스크입니다. 군중 심리에 휩쓸린 고점 매수 패턴을 주의해야 합니다.`, golden_strategy:`ESG·임팩트 투자와 배당 성장주 전략이 최적입니다. 사회적 가치와 재무적 성과를 동시에 추구하는 기업에 장기 투자하십시오.`, portfolio_insight:`배당주와 ETF 중심의 안정적 포트폴리오가 성향에 맞습니다. 분기 배당 수익으로 현금흐름을 확보하면서 장기 성장주를 꾸준히 적립하십시오.`, growth_prescription:`N-Score ${nscore} 향상을 위해 독립적 투자 판단 훈련이 필요합니다. 매 투자 전 타인 의견과 무관하게 스스로 결론을 먼저 내린 후 검증하는 루틴을 만드십시오.`, one_line:`사람과 가치를 연결하며 함께 성장하는 임팩트 투자자` },
    INFJ:{ identity:`${name}님은 깊은 통찰력을 가진 옹호자형 투자자입니다. 표면 너머의 본질을 읽는 능력이 탁월하며 신념 기반 장기 투자에서 진가를 발휘합니다.`, strength_insight:`직관적 통찰과 장기적 일관성이 강점입니다. 트렌드의 본질적 변화를 먼저 감지하고 한번 확신한 투자 테마는 흔들림 없이 보유하는 인내력이 있습니다.`, risk_insight:`직관 과신과 반대 신호 무시가 리스크입니다. 자신의 비전에 집착하여 시장 변화에 유연하게 대응하지 못할 수 있습니다.`, golden_strategy:`테마 기반 장기투자와 가치투자의 결합이 최적입니다. 10년 후 메가트렌드를 선정하고 연관 ETF와 개별 종목에 분할 매수하십시오.`, portfolio_insight:`성장주와 채권의 균형 잡힌 배분이 심리적 안정과 수익률을 동시에 확보합니다. 변동성 큰 구간에서 채권 비중이 완충 역할을 합니다.`, growth_prescription:`N-Score ${nscore} 향상을 위해 투자 테제를 글로 쓰는 습관을 기르십시오. 생각을 명문화하는 과정에서 비논리적 직관과 근거 있는 통찰이 분리됩니다.`, one_line:`세상의 흐름을 먼저 읽고 조용히 포지션을 잡는 통찰가` },
    ENFP:{ identity:`${name}님은 열정적인 활동가형 투자자입니다. 새로운 가능성에 흥분하고 긍정적 에너지로 주변을 이끄는 성향이 투자에서도 강하게 발현됩니다.`, strength_insight:`열정과 빠른 학습력이 강점입니다. 새로운 투자 분야를 빠르게 흡수하고 긍정적 전망으로 과감한 베팅을 통해 큰 수익 기회를 포착합니다.`, risk_insight:`충동적 결정과 포트폴리오 산만함이 리스크입니다. 흥미로운 종목에 분산 투자하다 관리 불가 수준으로 종목이 늘어날 수 있습니다.`, golden_strategy:`핵심 10종목 집중 전략과 정기 정리 루틴이 필요합니다. 매 분기말 보유 종목을 검토하고 하위 20%를 정리하는 원칙을 세우십시오.`, portfolio_insight:`성장주 중심이되 ETF로 코어를 잡고 고성장 개별 종목을 위성 포지션으로 보유하는 코어-위성 전략이 성향에 맞습니다.`, growth_prescription:`N-Score ${nscore} 향상의 핵심은 집중력입니다. 보유 종목을 10개 이내로 제한하고 신규 매수 전 반드시 기존 종목 하나를 정리하는 원칙을 지키십시오.`, one_line:`무한한 가능성을 보는 열정의 투자 활동가` },
    INFP:{ identity:`${name}님은 가치 중심의 중재자형 투자자입니다. 재무적 수익보다 의미와 가치를 중시하며 자신의 신념과 일치하는 투자에서 최고의 성과를 냅니다.`, strength_insight:`가치 일관성과 장기 보유 능력이 강점입니다. 신념에 맞는 투자처를 발굴하면 강한 확신으로 장기 보유하며 이는 복리 수익의 가장 강력한 원천입니다.`, risk_insight:`손절 회피와 감정적 보유가 리스크입니다. 손실 중인 종목에 감정적 애착을 형성하여 합리적 손절 타이밍을 놓치는 패턴이 자주 나타납니다.`, golden_strategy:`ESG 중심 장기투자와 자동 적립식 매수가 최적입니다. 감정 개입을 최소화하는 자동화 투자 시스템을 구축하고 손절 기준을 사전에 명문화하십시오.`, portfolio_insight:`ETF와 채권 중심의 방어적 포트폴리오가 성향에 맞습니다. 개별 종목 비중을 줄이고 지수 추종 ETF로 감정 개입 없는 수익을 추구하십시오.`, growth_prescription:`N-Score ${nscore} 향상을 위해 손절 원칙 설정이 최우선입니다. -10% 손절 규칙을 설정하고 알림을 걸어두면 감정적 보유 패턴을 효과적으로 차단합니다.`, one_line:`신념과 가치로 투자하는 조용한 원칙주의자` },
    ISTJ:{ identity:`${name}님은 청렴결백형 투자자로 원칙과 규율을 바탕으로 체계적인 자산 관리를 추구합니다. 안정성과 예측 가능성을 가장 중시합니다.`, strength_insight:`원칙 준수와 리스크 관리가 최대 강점입니다. 정해진 원칙을 일관되게 실행하고 충동적 결정 없이 시스템에 따라 투자하는 능력이 장기적으로 안정적 수익을 만듭니다.`, risk_insight:`변화 적응 속도 지연이 리스크입니다. 새로운 투자 패러다임에 대한 진입이 늦어 상승 초기 국면을 놓칠 가능성이 있습니다.`, golden_strategy:`인덱스 ETF 중심의 패시브 전략이 가장 잘 맞습니다. S&P500, 코스피 ETF를 기반으로 하되 분기별 리밸런싱으로 목표 비율을 유지하십시오.`, portfolio_insight:`ETF와 채권 중심의 안정적 배분이 최적입니다. 변동성을 최소화하면서 인플레이션을 이기는 수익률을 목표로 하는 전략이 심리적으로도 가장 편안합니다.`, growth_prescription:`N-Score ${nscore} 향상을 위해 포트폴리오 리뷰 주기를 단축하십시오. 월 1회 리뷰 루틴을 만들고 시장 변화에 조금씩 빠르게 반응하는 연습을 하십시오.`, one_line:`원칙과 규율로 흔들림 없이 자산을 지키는 수호자` },
    ISFJ:{ identity:`${name}님은 수호자형 투자자로 가족과 소중한 사람들을 위한 안전한 자산 보전에 최우선 가치를 둡니다.`, strength_insight:`안정 추구와 손실 회피 능력이 강점입니다. 과도한 리스크를 본능적으로 피하고 검증된 자산에 장기 투자하는 성향이 자본 보전과 안정적 수익을 만듭니다.`, risk_insight:`기회 비용 손실이 주요 리스크입니다. 지나친 안전 추구로 성장 자산 배분이 낮아져 장기적으로 인플레이션 대비 실질 수익률이 낮아질 수 있습니다.`, golden_strategy:`배당 성장주와 안전 자산 균형 전략이 최적입니다. 꾸준한 배당 수익으로 현금흐름을 확보하면서 성장주 ETF로 장기 자산 성장을 도모하십시오.`, portfolio_insight:`채권과 배당주 중심으로 하되 성장주 ETF를 20~25% 편입하여 장기 수익률을 보완하는 전략을 추천합니다.`, growth_prescription:`N-Score ${nscore} 향상을 위해 성장 자산 비중을 점진적으로 늘리십시오. 매 분기 5%씩 성장주 ETF 비중을 높이는 점진적 전환이 심리적 저항을 최소화합니다.`, one_line:`소중한 것을 지키며 조용히 자산을 키우는 안정의 수호자` },
    ESTJ:{ identity:`${name}님은 경영자형 투자자로 효율과 성과를 최우선으로 추구합니다. 명확한 목표와 체계적 실행력이 투자에서도 강하게 발현됩니다.`, strength_insight:`실행력과 목표 지향성이 핵심 강점입니다. 투자 목표를 수치화하고 계획적으로 실행하는 능력이 탁월하며 의사결정이 빠르고 결과에 책임집니다.`, risk_insight:`경직된 사고와 새로운 전략 수용 저항이 리스크입니다. 검증된 방식만 고집하다 새로운 투자 기회를 놓칠 수 있습니다.`, golden_strategy:`목표 기반 포트폴리오 운용이 최적입니다. 3년·5년·10년 단위 재무 목표를 수립하고 역산으로 필요 수익률을 계산한 후 자산 배분을 결정하십시오.`, portfolio_insight:`성장주와 ETF의 균형 배분으로 수익성과 안정성을 동시에 확보하십시오. 분기별 성과 리뷰와 목표 대비 달성률 추적이 동기 부여의 원천입니다.`, growth_prescription:`N-Score ${nscore} 향상을 위해 투자 KPI를 설정하십시오. 연간 목표 수익률·최대 허용 손실·포트폴리오 회전율 3가지 지표를 월별로 추적하십시오.`, one_line:`목표를 수치로 설정하고 반드시 달성하는 경영자 투자자` },
    ESFJ:{ identity:`${name}님은 집정관형 투자자로 주변의 신뢰와 공동체 가치를 중시하며 안정적이고 예측 가능한 투자를 선호합니다.`, strength_insight:`사회적 신호 감지와 안정 추구 능력이 강점입니다. 주변 환경의 변화를 빠르게 감지하고 관계 네트워크를 통한 실용적 투자 정보 수집에 탁월합니다.`, risk_insight:`군중 심리 추종과 확증 편향이 리스크입니다. 주변 투자 열풍에 동조하여 고점에 매수하거나 불편한 진실을 외면하는 경향이 있습니다.`, golden_strategy:`인덱스 ETF 자동 적립과 배당주 투자가 최적입니다. 감정과 군중 심리를 배제한 자동화 투자 시스템이 성향의 약점을 효과적으로 보완합니다.`, portfolio_insight:`ETF와 배당주 중심으로 안정적 현금흐름을 만들고 성장주는 소량만 편입하는 보수적 전략이 심리적 안정과 수익률을 균형 있게 확보합니다.`, growth_prescription:`N-Score ${nscore} 향상을 위해 독립적 투자 판단 훈련이 필요합니다. 모든 투자 결정 전 타인 의견과 무관하게 자신만의 근거를 먼저 작성하는 습관을 기르십시오.`, one_line:`신뢰와 안정으로 함께 성장하는 공동체의 투자 조력자` },
    ISTP:{ identity:`${name}님은 장인형 투자자로 현실적이고 실용적인 접근을 선호합니다. 시장의 기계적 패턴을 분석하고 최적의 실행 타이밍을 포착하는 능력이 탁월합니다.`, strength_insight:`기술적 분석과 냉정한 실행력이 강점입니다. 차트 패턴과 수급 데이터를 통한 단기 트레이딩에서 뛰어난 성과를 보이며 손절 실행에 감정이 개입되지 않습니다.`, risk_insight:`장기 비전 부재와 잦은 매매로 인한 수수료 비용이 리스크입니다. 단기 수익에 집중하다 장기 복리 효과를 놓칠 수 있습니다.`, golden_strategy:`단기 트레이딩+장기 ETF 코어 분리 운용이 최적입니다. 전체 자산의 70%는 장기 ETF로 묶어두고 30%만 단기 트레이딩에 활용하십시오.`, portfolio_insight:`ETF 코어(70%)와 단기 트레이딩 위성(30%) 구조로 운용하면 기술적 강점을 살리면서 장기 복리도 확보할 수 있습니다.`, growth_prescription:`N-Score ${nscore} 향상을 위해 매매 일지 작성이 핵심입니다. 매 거래의 진입 근거·청산 이유·결과를 기록하면 패턴이 보이고 승률이 향상됩니다.`, one_line:`시장의 움직임을 손끝으로 느끼는 현장형 투자 장인` },
    ISFP:{ identity:`${name}님은 모험가형 투자자로 자유롭고 유연한 접근을 선호합니다. 현재의 기회에 집중하며 직관과 감각을 활용한 투자에서 독특한 성과를 냅니다.`, strength_insight:`유연성과 현재 집중력이 강점입니다. 시장 상황 변화에 유연하게 적응하고 과거 손실에 집착하지 않고 현재 최선의 결정을 내리는 능력이 있습니다.`, risk_insight:`장기 계획 부재와 충동적 결정이 리스크입니다. 현재 감각에 의존한 즉흥적 매매가 장기적 자산 형성을 방해할 수 있습니다.`, golden_strategy:`자동 적립식 ETF 투자와 소액 테마 투자의 결합이 최적입니다. 기계적 적립으로 장기 자산을 쌓으면서 소액으로 현재 관심 테마에 도전하는 이원화 전략을 추천합니다.`, portfolio_insight:`ETF 자동 적립을 기반으로 하고 흥미 있는 테마에 소액만 투자하는 구조가 성향에 맞습니다. 테마 투자는 전체의 20% 이내로 제한하십시오.`, growth_prescription:`N-Score ${nscore} 향상을 위해 투자 목표를 1년 단위로 설정하십시오. 구체적인 금액 목표가 행동을 체계화하는 데 효과적입니다.`, one_line:`지금 이 순간에 집중하며 자유롭게 기회를 포착하는 투자가` },
    ESTP:{ identity:`${name}님은 사업가형 투자자로 빠른 상황 판단과 대담한 실행력이 핵심입니다. 위기 속에서 기회를 발견하고 즉각 행동하는 능력이 탁월합니다.`, strength_insight:`빠른 결단력과 위기 속 기회 포착이 강점입니다. 시장이 패닉일 때 역발상 매수를 실행하는 담력과 단기 수급 변화를 빠르게 읽는 능력이 뛰어납니다.`, risk_insight:`과도한 레버리지와 리스크 과소평가가 주요 위험입니다. 흥분 상태에서 포지션을 과도하게 키우거나 리스크를 충분히 고려하지 않은 채 진입할 수 있습니다.`, golden_strategy:`역발상 투자와 이벤트 드리븐 전략이 최적입니다. 시장 공포 지수 극단 시 단계적 매수하고 레버리지는 자기자본의 1.5배를 절대 넘지 않는 원칙을 지키십시오.`, portfolio_insight:`성장주와 대안투자 비중을 높이되 포지션별 최대 손실 한도를 사전에 설정하십시오. 전체 포트폴리오 최대 손실 -15% 제한 규칙이 필수입니다.`, growth_prescription:`N-Score ${nscore} 향상의 핵심은 리스크 관리 시스템 구축입니다. 포지션 진입 전 최대 손실 시나리오를 먼저 계산하고 감내 가능할 때만 실행하는 습관을 기르십시오.`, one_line:`위기 속에서 기회를 보고 대담하게 실행하는 사업가 투자자` },
    ESFP:{ identity:`${name}님은 연예인형 투자자로 에너지 넘치는 현재 지향적 성향을 가집니다. 트렌드에 민감하고 새로운 것에 빠르게 반응하는 투자 스타일입니다.`, strength_insight:`트렌드 감지력과 긍정적 에너지가 강점입니다. 새로운 소비 트렌드와 라이프스타일 변화를 빠르게 포착하고 이를 투자 아이디어로 연결하는 능력이 있습니다.`, risk_insight:`충동 매수와 단기 수익 집착이 리스크입니다. 화제 종목에 고점 진입하거나 지루한 장기 보유를 견디지 못하고 조기 청산하는 패턴이 있습니다.`, golden_strategy:`소비 트렌드 기반 ETF 투자가 최적입니다. 관심 있는 라이프스타일 트렌드를 ETF로 표현하고 개별 종목 직접 투자 비중은 20% 이내로 제한하십시오.`, portfolio_insight:`ETF 중심으로 트렌드 테마를 표현하되 배당주로 안정적 현금흐름을 확보하는 전략이 성향에 맞습니다. 암호화폐 등 고위험 자산은 5% 이내로 제한하십시오.`, growth_prescription:`N-Score ${nscore} 향상을 위해 자동 투자 설정이 가장 효과적입니다. 매월 일정 금액을 ETF에 자동 적립하면 충동적 결정을 차단하고 복리 효과를 극대화합니다.`, one_line:`트렌드를 투자로 연결하는 감각적인 현재형 투자자` }
  };
  return fb[archetype] || fb['ENTJ'];
}

// ════════════════════════════════════════════════════════════════
//  PART 5 — PDF 발송 (재시도 3회 + 실패 큐)
// ════════════════════════════════════════════════════════════════

function sendPdfWithRetry(email, name, htmlContent, orderId, tier) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      Logger.log(`PDF 발송 시도 ${attempt}/3: ${email}`);

      const blob = Utilities.newBlob(htmlContent, 'text/html', 'report.html');
      const folder = DriveApp.getRootFolder();
      const tempFile = folder.createFile(blob);
      let pdfBlob;
      try {
        pdfBlob = tempFile.getAs('application/pdf');
      } finally {
        tempFile.setTrashed(true);
      }

      const tierLabel = tier === 'premium' ? 'Premium' : 'Standard';
      GmailApp.sendEmail(email,
        `[N-KAI] ${name}님의 금융 DNA 분석 리포트가 도착했습니다`,
        '',
        {
          htmlBody: buildEmailBody(name, tierLabel),
          attachments: [pdfBlob.setName(`NKAI_리포트_${name}.pdf`)],
          name: 'N-KAI · YOUR FINANCIAL DNA'
        }
      );

      logPdfSent(orderId, email, name, tier, 'success', attempt);
      CacheService.getScriptCache().put('pdfSent_' + orderId, '1', 86400);
      Logger.log(`발송 성공 (시도 ${attempt})`);
      return true;

    } catch (err) {
      Logger.log(`발송 실패 (시도 ${attempt}): ${err.toString()}`);
      if (attempt < 3) Utilities.sleep(3000 * attempt);
    }
  }
  logPdfSent(orderId, email, name, tier, 'failed', 3);
  addToRetryQueue(orderId, email, name, tier);
  return false;
}

function logPdfSent(orderId, email, name, tier, status, attempt) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let s = ss.getSheetByName('PDF발송로그');
    if (!s) { s = ss.insertSheet('PDF발송로그'); s.appendRow(['주문번호','이메일','이름','티어','상태','시도횟수','발송시간']); }
    s.appendRow([orderId, email, name, tier, status, attempt, new Date().toLocaleString('ko-KR')]);
  } catch(e) { Logger.log('로그 오류: ' + e); }
}

function addToRetryQueue(orderId, email, name, tier) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let s = ss.getSheetByName('재발송대기');
    if (!s) { s = ss.insertSheet('재발송대기'); s.appendRow(['주문번호','이메일','이름','티어','등록시간','상태']); }
    s.appendRow([orderId, email, name, tier, new Date().toLocaleString('ko-KR'), 'pending']);
  } catch(e) { Logger.log('큐 오류: ' + e); }
}

function retryFailedSends() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const s = ss.getSheetByName('재발송대기');
    if (!s || s.getLastRow() < 2) return;
    const rows = s.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      const [orderId, email, name, tier,,status] = rows[i];
      if (status !== 'pending') continue;
      Logger.log('재시도: ' + orderId);
      // 재시도는 원본 데이터 없이 간단 알림만
      s.getRange(i+1, 6).setValue('manual_required');
    }
  } catch(e) { Logger.log('retryFailedSends 오류: ' + e); }
}

// ════════════════════════════════════════════════════════════════
//  PART 6 — 이메일 본문 HTML
// ════════════════════════════════════════════════════════════════

function buildEmailBody(name, tierLabel) {
  return `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Malgun Gothic',Arial,sans-serif">
<div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.1)">
<div style="background:linear-gradient(135deg,#071523,#0D1B2A);padding:40px;text-align:center">
  <div style="width:52px;height:52px;background:linear-gradient(135deg,#F0C674,#d4a853);border-radius:12px;margin:0 auto 16px;text-align:center;line-height:52px;font-size:22px;font-weight:900;color:#071523">N</div>
  <div style="font-size:22px;font-weight:900;color:#F0C674;letter-spacing:2px;margin-bottom:4px">N·KAI</div>
  <div style="font-size:11px;color:rgba(240,198,116,.6);letter-spacing:2px">YOUR FINANCIAL DNA</div>
</div>
<div style="padding:40px">
  <h2 style="font-size:20px;font-weight:900;color:#0D1B2A;margin:0 0 16px">${name}님, 리포트가 도착했습니다 🎉</h2>
  <p style="font-size:14px;color:#4B5563;line-height:1.8;margin:0 0 24px"><strong style="color:#2D8CFF">${tierLabel} 금융 DNA 분석 리포트</strong>가 준비되었습니다.<br>첨부 PDF 파일을 확인하시면 완전한 분석 결과를 보실 수 있습니다.</p>
  <div style="background:#F0F5FF;border:1px solid #DBEAFE;border-radius:12px;padding:20px;margin-bottom:24px">
    <div style="font-size:12px;font-weight:700;color:#2563EB;letter-spacing:1px;margin-bottom:8px">📋 리포트 포함 내용</div>
    <div style="font-size:13px;color:#374151;line-height:1.8">✦ 아키타입 심층 분석 · N-Score 해석<br>✦ 3대 핵심 금융 지표 · 코어 에너지 (오행)<br>✦ 골든타임 캘린더 · 리스크 히트맵<br>✦ 맞춤 포트폴리오 · AI 개인화 인사이트</div>
  </div>
  <div style="text-align:center"><a href="${CONFIG.SITE_URL}" style="display:inline-block;background:linear-gradient(135deg,#F0C674,#d4a853);color:#071523;font-size:14px;font-weight:700;padding:14px 36px;border-radius:8px;text-decoration:none">neurinkairosai.com 방문하기 →</a></div>
</div>
<div style="background:#F8FAFD;padding:20px 40px;border-top:1px solid #EEF2F7;text-align:center">
  <div style="font-size:10px;color:#9CA3AF;line-height:1.8">${CONFIG.COMPANY_NAME} · ${CONFIG.BIZ_NO}<br>통신판매업: 제 2026-서울강남-01337 호 · ${CONFIG.SUPPORT_EMAIL}<br>본 리포트는 투자 자문이 아닌 금융 성향 분석 참고자료입니다.</div>
</div>
</div></body></html>`;
}

// ════════════════════════════════════════════════════════════════
//  PART 7 — 메인 처리 함수
// ════════════════════════════════════════════════════════════════

function sendServerReportSafe(data) {
  const orderId = data.orderId || data.payment_key || ('ORD_' + new Date().getTime());
  const email   = data.email;
  const name    = data.name || '고객';
  const tier    = data.tier || 'standard';

  if (isDuplicatePdfSendFast(orderId)) {
    Logger.log('중복 건너뜀: ' + orderId);
    return;
  }

  try {
    const aiData = callClaudeAPIWithFallback(data, tier);
    const html   = buildPdfReportHtml(data, aiData);
    sendPdfWithRetry(email, name, html, orderId, tier);
  } catch(err) {
    Logger.log('sendServerReportSafe 오류: ' + err.toString());
    addToRetryQueue(orderId, email, name, tier);
  }
}

// ════════════════════════════════════════════════════════════════
//  PART 8 — PDF HTML 빌더 (buildPdfReportHtml)
// ════════════════════════════════════════════════════════════════

function buildPdfReportHtml(data, aiData) {
  function riskClass(val) {
    if (!val) return 'risk-caution';
    if (val === '적합') return 'risk-fit';
    if (val === '주의') return 'risk-warn';
    return 'risk-caution';
  }
  const nscore    = parseInt(data.nscore) || 700;
  const nscorePct = Math.min(95, Math.max(10, Math.round((nscore / 1000) * 100)));
  const nscoreTop = Math.round(100 - nscorePct);
  const elementNames = { '木':'성장·확장','火':'열정·활력','土':'안정·균형','金':'결단·수렴','水':'지혜·흐름' };
  const elementTraits = {
    '木':'성장 가능성이 높은 자산을 직관적으로 선별하는 경향이 강함',
    '火':'빠른 의사결정과 추세 추종에 강하나 감정적 판단 주의 필요',
    '土':'안정 자산 선호, 장기 보유 전략에 최적화된 성향',
    '金':'분석적 접근과 손절 원칙에 강하며 비용 효율 극대화',
    '水':'정보 수집과 시장 사이클 독해에 탁월한 직관'
  };

  const css = `*{margin:0;padding:0;box-sizing:border-box}body{font-family:"Malgun Gothic","Apple SD Gothic Neo","맑은 고딕","나눔고딕",sans-serif;background:#fff;color:#0D1B2A;font-size:13px;line-height:1.6;width:794px;margin:0 auto}.cover{background:linear-gradient(145deg,#071523 0%,#0D1B2A 40%,#122840 100%);color:#fff;padding:52px 56px 48px;position:relative;overflow:hidden}.cover-grid{position:absolute;top:0;left:0;right:0;bottom:0;background-image:linear-gradient(rgba(45,140,255,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(45,140,255,.07) 1px,transparent 1px);background-size:40px 40px}.cover-accent{position:absolute;top:-80px;right:-80px;width:360px;height:360px;background:radial-gradient(circle,rgba(240,198,116,.18) 0%,transparent 70%);border-radius:50%}.cover-inner{position:relative;z-index:2}.cover-brand{display:table;margin-bottom:40px}.cover-logo-wrap{display:table-cell;vertical-align:middle;padding-right:12px}.cover-logo{width:44px;height:44px;background:linear-gradient(135deg,#F0C674,#d4a853);border-radius:10px;text-align:center;line-height:44px;font-size:18px;font-weight:900;color:#071523}.cover-brand-info{display:table-cell;vertical-align:middle}.cover-brand-name{font-size:20px;font-weight:900;letter-spacing:2px;color:#F0C674}.cover-brand-sub{font-size:10px;color:rgba(240,198,116,.6);letter-spacing:1.5px}.cover-tag{display:inline-block;background:rgba(240,198,116,.15);border:1px solid rgba(240,198,116,.4);color:#F0C674;font-size:11px;font-weight:700;letter-spacing:1.5px;padding:5px 14px;border-radius:20px;margin-bottom:20px}.cover-title{font-size:28px;font-weight:900;color:#fff;line-height:1.3;margin-bottom:8px}.cover-title span{color:#F0C674}.cover-oneline{font-size:15px;color:rgba(255,255,255,.75);margin-bottom:36px;padding-left:16px;border-left:3px solid #2D8CFF}.cover-meta-table{width:100%;border-collapse:collapse;margin-bottom:32px}.cover-meta-table td{vertical-align:top;padding:0 6px 0 0;width:25%}.meta-card{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:14px 16px}.meta-label{font-size:10px;color:rgba(255,255,255,.45);letter-spacing:1px;margin-bottom:4px}.meta-value{font-size:20px;font-weight:900;color:#F0C674}.meta-desc{font-size:10px;color:rgba(255,255,255,.5);margin-top:2px}.nscore-bar-bg{height:5px;background:rgba(255,255,255,.12);border-radius:3px;margin-top:6px}.nscore-bar-fill{height:5px;background:linear-gradient(90deg,#2D8CFF,#F0C674);border-radius:3px}.cover-footer-line{border-top:1px solid rgba(255,255,255,.1);padding-top:16px;display:table;width:100%}.cover-footer-l{display:table-cell;font-size:10px;color:rgba(255,255,255,.35)}.cover-footer-r{display:table-cell;text-align:right;font-size:13px;color:rgba(255,255,255,.7);font-weight:700}.section{padding:36px 56px;border-bottom:1px solid #EEF2F7}.snum{font-size:10px;font-weight:900;letter-spacing:2px;color:#2D8CFF;margin-bottom:4px}.stitle{font-size:17px;font-weight:900;color:#0D1B2A;margin-bottom:6px}.stitle span{color:#F0C674}.dline{height:2px;background:linear-gradient(90deg,#2D8CFF 0%,rgba(240,198,116,.3) 50%,transparent 100%);margin-bottom:20px}.archetype-hero{background:linear-gradient(135deg,#071523 0%,#0D2540 100%);border-radius:12px;padding:24px 28px;display:table;width:100%;border:1px solid #1A3A5C;margin-bottom:16px}.ab-cell{display:table-cell;vertical-align:top;padding-right:20px}.ab{width:64px;height:64px;background:linear-gradient(135deg,#F0C674,#d4a853);border-radius:14px;text-align:center;line-height:64px;font-size:22px;font-weight:900;color:#071523}.ai-cell{display:table-cell;vertical-align:top}.an{font-size:20px;font-weight:900;color:#F0C674;margin-bottom:4px}.ae{font-size:11px;color:rgba(255,255,255,.4);letter-spacing:1px;margin-bottom:10px}.aid{font-size:13px;color:rgba(255,255,255,.8);line-height:1.7}.it{width:100%;border-collapse:collapse}.it td{vertical-align:top;padding:0 6px 0 0;width:33.33%}.it td:last-child{padding-right:0}.ic{border-radius:10px;padding:16px 14px;border:1px solid}.ic.s{background:#F0FFF8;border-color:#22C55E30}.ic.r{background:#FFF8F0;border-color:#F0922230}.ic.g{background:#F0F5FF;border-color:#2D8CFF30}.il{font-size:10px;font-weight:700;letter-spacing:1.5px;margin-bottom:8px}.ic.s .il{color:#16A34A}.ic.r .il{color:#D97706}.ic.g .il{color:#2563EB}.ix{font-size:12px;color:#374151;line-height:1.7}.nw{display:table;width:100%}.nl{display:table-cell;width:160px;vertical-align:top;text-align:center;padding-right:28px}.nc{width:110px;height:110px;background:linear-gradient(135deg,#0D1B2A,#122840);border-radius:50%;border:4px solid #F0C674;text-align:center;padding-top:22px;margin:0 auto 8px;box-shadow:0 0 24px rgba(240,198,116,.2)}.nn{font-size:32px;font-weight:900;color:#F0C674;line-height:1}.nnl{font-size:10px;color:rgba(240,198,116,.7)}.ngb{font-size:17px;font-weight:900;color:#0D1B2A}.ngs{font-size:11px;color:#6B7280;margin-top:2px}.nr{display:table-cell;vertical-align:top}.gbt{font-size:12px;font-weight:700;color:#0D1B2A;margin-bottom:12px}.gr{display:table;width:100%;margin-bottom:7px}.glc{display:table-cell;width:34px;font-size:11px;font-weight:700;color:#9CA3AF;vertical-align:middle}.gbc{display:table-cell;vertical-align:middle;padding:0 8px}.grc{display:table-cell;width:60px;font-size:10px;color:#9CA3AF;vertical-align:middle}.gbg{height:8px;background:#EEF2F7;border-radius:4px}.gf{height:8px;border-radius:4px}.gn{font-size:11px;color:#6B7280;margin-top:10px;line-height:1.6;padding:10px;background:#F8FAFD;border-radius:6px}.kt{width:100%;border-collapse:collapse}.kt td{vertical-align:top;padding:0 6px 0 0;width:33.33%}.kt td:last-child{padding-right:0}.kc{background:#F8FAFD;border:1px solid #E5EAF2;border-radius:12px;padding:18px 14px;text-align:center}.ki{font-size:20px;margin-bottom:8px}.kn{font-size:10px;font-weight:700;color:#6B7280;letter-spacing:.5px;margin-bottom:10px}.ks{font-size:28px;font-weight:900;color:#0D1B2A}.ksm{font-size:11px;color:#9CA3AF}.kb{height:6px;background:#E5EAF2;border-radius:3px;margin-top:8px}.kf{height:6px;border-radius:3px}.kd{font-size:10px;color:#6B7280;margin-top:8px;line-height:1.5}.ew{display:table;width:100%}.ebc{display:table-cell;vertical-align:top;padding-right:20px}.edc{display:table-cell;width:200px;vertical-align:top}.er{display:table;width:100%;margin-bottom:12px}.eic{display:table-cell;width:24px;font-size:14px;vertical-align:middle;padding-right:8px}.elc{display:table-cell;width:24px;font-size:12px;font-weight:700;color:#374151;vertical-align:middle;padding-right:8px}.ebarc{display:table-cell;vertical-align:middle;padding-right:8px}.epc{display:table-cell;width:36px;font-size:12px;font-weight:700;color:#374151;vertical-align:middle;text-align:right}.ebg{height:10px;background:#EEF2F7;border-radius:5px}.ef{height:10px;border-radius:5px}.wf{background:linear-gradient(90deg,#22C55E,#16A34A)}.ff{background:linear-gradient(90deg,#EF4444,#DC2626)}.tf{background:linear-gradient(90deg,#F59E0B,#D97706)}.mf{background:linear-gradient(90deg,#9CA3AF,#6B7280)}.waf{background:linear-gradient(90deg,#3B82F6,#1D4ED8)}.edb{background:#F8FAFD;border-radius:10px;padding:16px;border:1px solid #E5EAF2}.edt{font-size:12px;font-weight:700;color:#0D1B2A;margin-bottom:8px}.edx{font-size:11px;color:#6B7280;line-height:1.7}.gt{width:100%;border-collapse:collapse;margin-bottom:16px}.gt td{vertical-align:top;padding:0 6px 0 0;width:33.33%}.gt td:last-child{padding-right:0}.gc{border-radius:10px;padding:16px 14px;border:1px solid}.g1{background:linear-gradient(135deg,#071523,#0D2540);border-color:#F0C674}.g2{background:#F0FFF8;border-color:#22C55E40}.g3{background:#F0F5FF;border-color:#2D8CFF30}.grank{font-size:10px;font-weight:700;letter-spacing:1.5px;margin-bottom:6px}.g1 .grank{color:#F0C674}.g2 .grank{color:#16A34A}.g3 .grank{color:#2563EB}.gm{font-size:20px;font-weight:900;margin-bottom:4px}.g1 .gm{color:#F0C674}.g2 .gm{color:#16A34A}.g3 .gm{color:#2563EB}.gst{font-size:12px;margin-bottom:4px}.g1 .gst{color:#F0C674}.g2 .gst,.g3 .gst{color:#16A34A}.g3 .gst{color:#2563EB}.gl{font-size:11px}.g1 .gl{color:rgba(255,255,255,.65)}.g2 .gl,.g3 .gl{color:#6B7280}.cb{background:#FFF8F0;border:1px solid #F0922240;border-radius:8px;padding:12px 16px;display:table;width:100%}.cic{display:table-cell;width:30px;font-size:16px;vertical-align:middle}.cinf{display:table-cell;vertical-align:middle}.cla{font-size:11px;font-weight:700;color:#D97706}.cmo{font-size:13px;font-weight:700;color:#374151}.rit{width:100%;border-collapse:collapse}.rit td{padding:0 5px 10px 0;width:33.33%;vertical-align:top}.ri{background:#F8FAFD;border-radius:10px;padding:14px;border:1px solid #E5EAF2;text-align:center}.ricon{font-size:16px;margin-bottom:4px}.rn{font-size:10px;color:#6B7280;margin-bottom:8px;font-weight:700}.rb{display:inline-block;font-size:12px;font-weight:700;padding:4px 14px;border-radius:20px}.risk-fit{background:#DCFCE7;color:#16A34A}.risk-caution{background:#FEF9C3;color:#A16207}.risk-warn{background:#FEE2E2;color:#DC2626}.pw{display:table;width:100%}.pbc{display:table-cell;vertical-align:top;padding-right:20px}.pic{display:table-cell;width:210px;vertical-align:top}.pr{display:table;width:100%;margin-bottom:10px}.plc{display:table-cell;width:64px;font-size:12px;font-weight:700;color:#374151;vertical-align:middle}.pbarc{display:table-cell;vertical-align:middle}.pbg{height:16px;background:#EEF2F7;border-radius:8px}.pbf{height:16px;border-radius:8px;text-align:right;padding-right:8px;line-height:16px}.pp{font-size:11px;font-weight:900;color:#fff}.pgf{background:linear-gradient(90deg,#3B82F6,#2D8CFF)}.pef{background:linear-gradient(90deg,#10B981,#059669)}.pbof{background:linear-gradient(90deg,#6366F1,#4F46E5)}.paf{background:linear-gradient(90deg,#F59E0B,#D97706)}.pcf{background:linear-gradient(90deg,#9CA3AF,#6B7280)}.pib{background:linear-gradient(135deg,#071523,#0D2540);border-radius:12px;padding:18px;border:1px solid #1A3A5C}.pit{font-size:11px;font-weight:700;color:#F0C674;margin-bottom:8px}.pix{font-size:11px;color:rgba(255,255,255,.75);line-height:1.7}.rmt{width:100%;border-collapse:collapse}.rmt td{vertical-align:top;text-align:center}.rms{border-radius:10px;padding:18px 12px;border:1px solid}.rc{background:linear-gradient(135deg,#071523,#0D2540);border-color:#F0C674}.r3{background:linear-gradient(135deg,#EFF6FF,#DBEAFE);border-color:#3B82F6}.r12{background:linear-gradient(135deg,#ECFDF5,#D1FAE5);border-color:#10B981}.rmac{width:32px;vertical-align:middle;text-align:center;font-size:20px;color:#C0CCE0;padding:0 4px}.rp{font-size:10px;font-weight:700;letter-spacing:1px;margin-bottom:6px}.rc .rp{color:rgba(240,198,116,.7)}.r3 .rp{color:#3B82F6}.r12 .rp{color:#10B981}.rsc{font-size:24px;font-weight:900;margin-bottom:2px}.rc .rsc{color:#F0C674}.r3 .rsc{color:#1D4ED8}.r12 .rsc{color:#047857}.rgr{font-size:12px;font-weight:700}.rc .rgr{color:rgba(255,255,255,.6)}.r3 .rgr{color:#3B82F6}.r12 .rgr{color:#059669}.rno{font-size:10px;color:#6B7280;margin-top:4px}.rc .rno{color:rgba(255,255,255,.4)}.rf{background:#F8FAFD;padding:18px 56px;border-top:2px solid #EEF2F7;display:table;width:100%}.rfl{display:table-cell;vertical-align:middle}.rfr{display:table-cell;vertical-align:middle;text-align:right}.rfb{font-size:12px;font-weight:900;color:#0D1B2A}.rfr2{font-size:10px;color:#9CA3AF;margin-top:2px}.rfd{font-size:9px;color:#9CA3AF;line-height:1.6;max-width:460px;text-align:right}`;

  return `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><style>${css}</style></head><body>
<div class="cover"><div class="cover-grid"></div><div class="cover-accent"></div>
<div class="cover-inner">
<div class="cover-brand"><div class="cover-logo-wrap"><div class="cover-logo">N</div></div><div class="cover-brand-info"><div class="cover-brand-name">N·KAI</div><div class="cover-brand-sub">YOUR FINANCIAL DNA</div></div></div>
<div class="cover-tag">✦ STANDARD REPORT · 금융 DNA 분석</div>
<div class="cover-title">${data.name}님의<br><span>금융 DNA 완전 분석 리포트</span></div>
<div class="cover-oneline">${aiData.one_line||''}</div>
<table class="cover-meta-table"><tr>
<td><div class="meta-card"><div class="meta-label">ARCHETYPE</div><div class="meta-value" style="font-size:22px">${data.archetype}</div><div class="meta-desc">${getArchetypeKorName(data.archetype)}</div></div></td>
<td><div class="meta-card"><div class="meta-label">N-SCORE</div><div class="meta-value">${data.nscore}</div><div class="meta-desc">${data.ngrade} 등급</div><div class="nscore-bar-bg"><div class="nscore-bar-fill" style="width:${nscorePct}%"></div></div></div></td>
<td><div class="meta-card"><div class="meta-label">CORE ELEMENT</div><div class="meta-value" style="font-size:22px">${data.day_element}</div><div class="meta-desc">코어 에너지</div></div></td>
<td><div class="meta-card"><div class="meta-label">분석 일자</div><div class="meta-value" style="font-size:14px">${new Date().toLocaleDateString('ko-KR')}</div><div class="meta-desc">AI 기준일</div></div></td>
</tr></table>
<div class="cover-footer-line"><div class="cover-footer-l">${CONFIG.COMPANY_NAME} · ${CONFIG.SITE_URL} · ${CONFIG.BIZ_NO}</div><div class="cover-footer-r">${data.name} 고객님 전용 리포트</div></div>
</div></div>

<div class="section"><div class="snum">SECTION 01</div><div class="stitle">아키타입 심층 분석 — <span>${data.archetype}</span></div><div class="dline"></div>
<div class="archetype-hero"><div class="ab-cell"><div class="ab">${data.archetype}</div></div><div class="ai-cell"><div class="an">${getArchetypeKorName(data.archetype)}</div><div class="ae">${getArchetypeEngName(data.archetype)} · Financial Archetype</div><div class="aid">${aiData.identity||''}</div></div></div>
<table class="it"><tr>
<td><div class="ic s"><div class="il">💪 핵심 강점</div><div class="ix">${aiData.strength_insight||''}</div></div></td>
<td><div class="ic r"><div class="il">⚠️ 주요 리스크</div><div class="ix">${aiData.risk_insight||''}</div></div></td>
<td><div class="ic g"><div class="il">🎯 골든 전략</div><div class="ix">${aiData.golden_strategy||''}</div></div></td>
</tr></table></div>

<div class="section"><div class="snum">SECTION 02</div><div class="stitle">N-Score 금융 성향 지수</div><div class="dline"></div>
<div class="nw"><div class="nl"><div class="nc"><div class="nn">${data.nscore}</div><div class="nnl">점수</div></div><div class="ngb">${data.ngrade} 등급</div><div class="ngs">상위 ${nscoreTop}%</div></div>
<div class="nr"><div class="gbt">9등급 스케일 위치</div>
<div class="gr"><div class="glc" style="color:#EF4444">N1</div><div class="gbc"><div class="gbg"><div class="gf" style="width:95%;background:#EF4444"></div></div></div><div class="grc">900~1000</div></div>
<div class="gr"><div class="glc" style="color:#F59E0B">N2</div><div class="gbc"><div class="gbg"><div class="gf" style="width:82%;background:#F59E0B"></div></div></div><div class="grc">800~899</div></div>
<div class="gr"><div class="glc" style="color:#F0C674;font-weight:900">${data.ngrade}</div><div class="gbc"><div class="gbg"><div class="gf" style="width:${nscorePct}%;background:linear-gradient(90deg,#2D8CFF,#F0C674)"></div></div></div><div class="grc" style="color:#F0C674;font-weight:700">▶ 현재</div></div>
<div class="gr"><div class="glc">N4</div><div class="gbc"><div class="gbg"><div class="gf" style="width:55%;background:#9CA3AF"></div></div></div><div class="grc">600~699</div></div>
<div class="gn">${data.nscore}점은 동일 아키타입(${data.archetype}) 중 상위 ${nscoreTop}% 수준입니다.</div></div></div></div>

<div class="section"><div class="snum">SECTION 03</div><div class="stitle">3대 핵심 금융 지표</div><div class="dline"></div>
<table class="kt"><tr>
<td><div class="kc"><div class="ki">💰</div><div class="kn">경제 감각</div><div class="ks">${data.wealth_energy}<span class="ksm">/100</span></div><div class="kb"><div class="kf" style="width:${data.wealth_energy}%;background:linear-gradient(90deg,#F59E0B,#F0C674)"></div></div><div class="kd">수익 기회 포착 및 자산 증식에 대한 직관적 감각</div></div></td>
<td><div class="kc"><div class="ki">🎯</div><div class="kn">투자 기회 포착력</div><div class="ks">${data.opportunity_score}<span class="ksm">/100</span></div><div class="kb"><div class="kf" style="width:${data.opportunity_score}%;background:linear-gradient(90deg,#2D8CFF,#6366F1)"></div></div><div class="kd">최적 진입 타이밍을 감지하는 능력</div></div></td>
<td><div class="kc"><div class="ki">🛡️</div><div class="kn">위기 대응력</div><div class="ks">${data.risk_tolerance}<span class="ksm">/100</span></div><div class="kb"><div class="kf" style="width:${data.risk_tolerance}%;background:linear-gradient(90deg,#10B981,#22C55E)"></div></div><div class="kd">금융 충격 시 심리적 회복 탄력성</div></div></td>
</tr></table></div>

<div class="section"><div class="snum">SECTION 04</div><div class="stitle">코어 에너지 — 5-Energy Balance</div><div class="dline"></div>
<div class="ew"><div class="ebc">
<div class="er"><div class="eic">🌳</div><div class="elc">木</div><div class="ebarc"><div class="ebg"><div class="ef wf" style="width:${data.wood_pct}%"></div></div></div><div class="epc">${data.wood_pct}%</div></div>
<div class="er"><div class="eic">🔥</div><div class="elc">火</div><div class="ebarc"><div class="ebg"><div class="ef ff" style="width:${data.fire_pct}%"></div></div></div><div class="epc">${data.fire_pct}%</div></div>
<div class="er"><div class="eic">⛰️</div><div class="elc">土</div><div class="ebarc"><div class="ebg"><div class="ef tf" style="width:${data.earth_pct}%"></div></div></div><div class="epc">${data.earth_pct}%</div></div>
<div class="er"><div class="eic">⚙️</div><div class="elc">金</div><div class="ebarc"><div class="ebg"><div class="ef mf" style="width:${data.metal_pct}%"></div></div></div><div class="epc">${data.metal_pct}%</div></div>
<div class="er"><div class="eic">💧</div><div class="elc">水</div><div class="ebarc"><div class="ebg"><div class="ef waf" style="width:${data.water_pct}%"></div></div></div><div class="epc">${data.water_pct}%</div></div>
</div><div class="edc"><div class="edb"><div class="edt">${data.day_element} 코어 에너지 분석</div><div class="edx">일간 ${data.day_element}(${elementNames[data.day_element]||''}) 에너지가 지배적인 ${data.name}님은 금융 결정 시 ${elementTraits[data.day_element]||'균형 잡힌 판단 경향'}. 에너지 구성비를 고려한 투자 타이밍 최적화가 핵심입니다.</div></div></div></div></div>

<div class="section"><div class="snum">SECTION 05</div><div class="stitle">골든타임 캘린더 — 12개월 에너지 흐름</div><div class="dline"></div>
<table class="gt"><tr>
<td><div class="gc g1"><div class="grank">🥇 BEST 1 · 최우선</div><div class="gm">${data.best_1_month}</div><div class="gst">${data.best_1_stars}</div><div class="gl">${data.best_1_label}</div></div></td>
<td><div class="gc g2"><div class="grank">🥈 BEST 2 · 안정성장</div><div class="gm">${data.best_2_month}</div><div class="gst">${data.best_2_stars}</div><div class="gl">${data.best_2_label}</div></div></td>
<td><div class="gc g3"><div class="grank">🥉 BEST 3 · 균형구간</div><div class="gm">${data.best_3_month}</div><div class="gst">${data.best_3_stars}</div><div class="gl">${data.best_3_label}</div></div></td>
</tr></table>
<div style="height:12px"></div>
<div class="cb"><div class="cic">⚠️</div><div class="cinf"><div class="cla">주의 구간</div><div class="cmo">${data.worst_months}</div></div></div></div>

<div class="section"><div class="snum">SECTION 06</div><div class="stitle">투자 리스크 히트맵 — 6종목 적합도</div><div class="dline"></div>
<table class="rit"><tr>
<td><div class="ri"><div class="ricon">📈</div><div class="rn">단기 투자</div><div class="rb ${riskClass(data.risk_short)}">${data.risk_short||'보통'}</div></div></td>
<td><div class="ri"><div class="ricon">🏠</div><div class="rn">부동산</div><div class="rb ${riskClass(data.risk_estate)}">${data.risk_estate||'보통'}</div></div></td>
<td><div class="ri"><div class="ricon">🚀</div><div class="rn">창업 투자</div><div class="rb ${riskClass(data.risk_startup)}">${data.risk_startup||'보통'}</div></div></td>
</tr><tr>
<td><div class="ri"><div class="ricon">📊</div><div class="rn">장기 투자</div><div class="rb ${riskClass(data.risk_long)}">${data.risk_long||'보통'}</div></div></td>
<td><div class="ri"><div class="ricon">₿</div><div class="rn">암호화폐</div><div class="rb ${riskClass(data.risk_crypto)}">${data.risk_crypto||'보통'}</div></div></td>
<td><div class="ri"><div class="ricon">🌐</div><div class="rn">ETF</div><div class="rb ${riskClass(data.risk_etf)}">${data.risk_etf||'보통'}</div></div></td>
</tr></table></div>

<div class="section"><div class="snum">SECTION 07</div><div class="stitle">${data.archetype} 맞춤 포트폴리오</div><div class="dline"></div>
<div class="pw"><div class="pbc">
<div class="pr"><div class="plc">성장주</div><div class="pbarc"><div class="pbg"><div class="pbf pgf" style="width:${data.portfolio_growth}%"><span class="pp">${data.portfolio_growth}%</span></div></div></div></div>
<div class="pr"><div class="plc">ETF</div><div class="pbarc"><div class="pbg"><div class="pbf pef" style="width:${data.portfolio_etf}%"><span class="pp">${data.portfolio_etf}%</span></div></div></div></div>
<div class="pr"><div class="plc">채권</div><div class="pbarc"><div class="pbg"><div class="pbf pbof" style="width:${data.portfolio_bond}%"><span class="pp">${data.portfolio_bond}%</span></div></div></div></div>
<div class="pr"><div class="plc">대안투자</div><div class="pbarc"><div class="pbg"><div class="pbf paf" style="width:${data.portfolio_alt}%"><span class="pp">${data.portfolio_alt}%</span></div></div></div></div>
<div class="pr"><div class="plc">현금</div><div class="pbarc"><div class="pbg"><div class="pbf pcf" style="width:${data.portfolio_cash}%"><span class="pp">${data.portfolio_cash}%</span></div></div></div></div>
</div><div class="pic"><div class="pib"><div class="pit">🤖 AI 포트폴리오 인사이트</div><div class="pix">${aiData.portfolio_insight||''}</div></div></div></div></div>

<div class="section"><div class="snum">SECTION 08</div><div class="stitle">N-Score 성장 로드맵</div><div class="dline"></div>
<table class="rmt"><tr>
<td style="width:30%"><div class="rms rc"><div class="rp">현재</div><div class="rsc">${data.nscore}</div><div class="rgr">${data.ngrade} 등급</div><div class="rno">현재 위치</div></div></td>
<td class="rmac">→</td>
<td style="width:30%"><div class="rms r3"><div class="rp">3개월 후 목표</div><div class="rsc">${data.growth_3m}</div><div class="rgr">${data.growth_3m_grade} 등급</div><div class="rno">단기 목표</div></div></td>
<td class="rmac">→</td>
<td style="width:30%"><div class="rms r12"><div class="rp">12개월 후 목표</div><div class="rsc">${data.growth_12m}</div><div class="rgr">${data.growth_12m_grade} 등급</div><div class="rno">연간 목표</div></div></td>
</tr></table></div>

<div class="rf"><div class="rfl"><div class="rfb">N·KAI — YOUR FINANCIAL DNA</div><div class="rfr2">${CONFIG.COMPANY_NAME} · ${CONFIG.BIZ_NO}</div></div>
<div class="rfr"><div class="rfd">본 리포트는 금융 성향 분석 참고자료이며 투자 자문이 아닙니다. 모든 투자 결정은 이용자 본인의 판단과 책임 하에 이루어집니다.</div></div></div>

</body></html>`;
}

function getArchetypeKorName(t){const m={INTJ:'전략가형',INTP:'분석가형',ENTJ:'지휘관형',ENTP:'발명가형',INFJ:'옹호자형',INFP:'중재자형',ENFJ:'주도자형',ENFP:'활동가형',ISTJ:'청렴결백형',ISFJ:'수호자형',ESTJ:'경영자형',ESFJ:'집정관형',ISTP:'장인형',ISFP:'모험가형',ESTP:'사업가형',ESFP:'연예인형'};return(m[t]||t)+'투자자';}
function getArchetypeEngName(t){const m={INTJ:'The Strategist',INTP:'The Analyst',ENTJ:'The Commander',ENTP:'The Inventor',INFJ:'The Advocate',INFP:'The Mediator',ENFJ:'The Leader',ENFP:'The Activist',ISTJ:'The Logistician',ISFJ:'The Defender',ESTJ:'The Executive',ESFJ:'The Consul',ISTP:'The Craftsman',ISFP:'The Adventurer',ESTP:'The Entrepreneur',ESFP:'The Entertainer'};return m[t]||'The Investor';}

// ════════════════════════════════════════════════════════════════
//  PART 9 — 설정 & 테스트 함수
// ════════════════════════════════════════════════════════════════

// ★ 최초 1회 실행: 재시도 크론 등록
function setupRetryTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'retryFailedSends') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('retryFailedSends').timeBased().everyMinutes(10).create();
  Logger.log('✅ 재시도 크론 등록 완료 (10분 간격)');
}

// ★ 테스트 발송 (이메일 확인용)
function forceSendPdfTest() {
  const d = {
    name:'테스트', email: CONFIG.TEST_EMAIL,
    archetype:'ENTJ', nscore:'720', ngrade:'N3',
    wealth_energy:'72', opportunity_score:'68', risk_tolerance:'78',
    day_element:'金',
    wood_pct:'15', fire_pct:'10', earth_pct:'25', metal_pct:'30', water_pct:'20',
    best_1_month:'3월', best_1_stars:'★★★★★', best_1_label:'최대 에너지 구간',
    best_2_month:'7월', best_2_stars:'★★★★☆', best_2_label:'안정적 성장 구간',
    best_3_month:'10월',best_3_stars:'★★★☆☆', best_3_label:'균형 에너지 구간',
    worst_months:'8월, 12월',
    risk_short:'주의', risk_estate:'보통', risk_startup:'주의',
    risk_long:'적합', risk_crypto:'주의', risk_etf:'적합',
    portfolio_growth:'30', portfolio_etf:'25', portfolio_bond:'20',
    portfolio_alt:'15', portfolio_cash:'10',
    growth_3m:'778', growth_3m_grade:'N3',
    growth_12m:'878', growth_12m_grade:'N2',
    orderId:'TEST_'+new Date().getTime(), tier:'standard'
  };
  Logger.log('▶ 테스트 발송 시작...');
  sendServerReportSafe(d);
  Logger.log('▶ 완료. 확인: ' + CONFIG.TEST_EMAIL);
}
