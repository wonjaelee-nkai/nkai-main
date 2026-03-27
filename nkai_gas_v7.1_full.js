// ═══════════════════════════════════════════════════════════════
// N-KAI Google Apps Script v7.1
// ═══════════════════════════════════════════════════════════════
//
// v7.1 변경사항 (2026-02-26):
//   ★ [FIX] HEADERS.payment 추가 — 결제기록 한글 13컬럼 정의
//   ★ [FIX] logPaymentRecord — 한글 헤더 순서 정합성 교정 (safeStr/safeNum 활용)
//   ★ [FIX] fixAllHeaders에 '결제기록' 시트 포함
//
// v7.0 변경사항 (2026-02-25):
//   ★ [ADD] send_server_report — 서버사이드 PDF 생성 (jsPDF 퇴역)
//   ★ [ADD] buildPdfReportHtml — 풀리포트 HTML (Google PDF 렌더러용)
//   ★ [ADD] processData 라우터에 send_server_report case 추가
//   ★ 기존 send_pdf_report는 하위호환용으로 유지 (deprecated)
//
// v6.4 변경사항 (2026-02-25):
//   ★ [FIX] getPdfEmailHtml 뒤 떠다니던 CEO알림/catch 잔여코드 제거
//   ★ [FIX] 구버전 getPdfEmailHtml_ (언더스코어) 함수 제거
//   ★ [UPD] sendPdfReport v2.0 — 테마 아이콘/테두리/그룹명 지원
//   ★ [UPD] getPdfEmailHtml v2.0 — EmailJS와 동일 디자인 품질
//
// 배포 방법:
//   1. Apps Script 에디터에서 기존 코드 전체 삭제 (Ctrl+A → Delete)
//   2. 이 파일 전체 복사 → 붙여넣기
//   3. Ctrl+S 저장
//   4. 배포 → 배포 관리 → 연필 아이콘(✏️) → 버전: 새 버전 → 배포
//      ⚠️ "새 배포 생성" 금지! 기존 배포 편집만!
//   5. ★ fixAllHeaders() 수동 실행 → 결제기록 헤더 자동 교정
//
// 시트 구성 (15개 + 결제기록):
//   세션트래킹 / UTM유입경로 / 퍼널트래킹 / 분석데이터
//   공유트래킹 / 체험권관리 / 레퍼럴트래킹
//   프리미엄언락 / 프리미엄이메일 / 추천권
//   사전예약 / 채용지원 / 제휴문의 / 디버그로그
//   ★ PDF발송로그 / ★ 결제기록
//
// ═══════════════════════════════════════════════════════════════


// ─── 공통 설정 ───
var CEO_EMAIL = 'cpo@neurinkairosai.com';


// ─── 시트명 설정 (15개) ───
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


// ─── 시트 헤더 정의 ───
var HEADERS = {
  sessions: [
    '일시', '세션ID', '이벤트', '페이지',
    '체류시간', '디바이스', '브라우저', '화면해상도',
    '이메일', 'UTM_source', 'UTM_medium',
    'UTM_campaign', 'UTM_term', 'UTM_content',
    '리퍼러', '국가', '언어'
  ],
  utm: [
    '일시', 'UTM_source', 'UTM_medium',
    'UTM_campaign', 'UTM_term', 'UTM_content',
    '랜딩페이지', '리퍼러', '디바이스',
    '세션ID', '전환여부', '전환단계'
  ],
  funnel: [
    '일시', '세션ID', '이메일', '퍼널단계', '퍼널명',
    '소요시간', '이탈여부', '디바이스', 'UTM_source',
    '아키타입', 'N-Score',
    'KIPA_에너지', 'KIPA_인식', 'KIPA_판단', 'KIPA_생활'
  ],
  analysis: [
    '일시', '이름', '이메일', '생년월일', '출생시',
    '지역', '성별', '직업', '혈액형', '분석유형', '아키타입',
    'N-Score', 'N등급', '정밀도',
    'KIPA_에너지', 'KIPA_인식', 'KIPA_판단', 'KIPA_생활양식',
    'KIPA_모드',
    'Q1','Q2','Q3','Q4','Q5','Q6','Q7','Q8',
    'Q9','Q10','Q11','Q12','Q13','Q14','Q15','Q16'
  ],
  shareTracking: [
    '일시', '이메일', '이름', '아키타입', 'N-Score',
    '공유채널', '공유횟수_누적', '추첨권수',
    '세션ID', '디바이스', '공유URL', 'UTM_source', '레퍼럴코드'
  ],
  trialMgmt: [
    '일시', '이메일', '이름', '아키타입', '발급사유',
    '발급시각', '만료시각', '상태', '전환티어', '전환일시', '공유채널'
  ],
  referralTracking: [
    '일시', '추천인이메일', '추천인이름', '추천인아키타입',
    '피추천인이메일', '피추천인이름', '레퍼럴코드', '유입채널',
    '피추천인분석완료', '피추천인구독전환', '보상지급여부', '보상내용'
  ],
  premiumUnlock: [
    '일시', '이메일', '이름', '아키타입', 'N-Score', 'N등급',
    '세션ID', '디바이스', '소스', 'URL', 'UTM_source', 'UTM_medium', 'UTM_campaign'
  ],
  premiumEmail: [
    '일시', '이메일', '이름', '아키타입', 'N-Score', 'N등급', '세션ID', '발송상태'
  ],
  raffleTicket: [
    '일시', '이메일', '이름', '공유채널', '아키타입', 'N-Score',
    '세션ID', '디바이스', '출처', '레퍼럴코드'
  ],
  reservation: [
    '일시', '이메일', '유입경로'
  ],
  recruit: [
    '일시', '이름', '이메일', '연락처', '포지션', '경력',
    '포트폴리오', '기술스택', '지원동기', '이력서'
  ],
  partnership: [
    '일시', '회사명', '담당자', '이메일', '연락처',
    '제휴유형', '제안내용', '기기', 'URL', '리퍼러'
  ],
  pdfLog: [
    '일시', '이메일', '이름', '아키타입', 'N-Score', '언어', '파일명', '결과'
  ],
  // ★ v7.1 추가: 결제기록 한글 헤더 (13컬럼)
  payment: [
    '일시', '주문번호', '결제키', '금액', '결제수단',
    '상태', '승인시각', '이름', '이메일', '플랜',
    '아키타입', 'N-Score', '오류'
  ]
};


// ═══════════════════════════════════════════
// [1] POST 수신
// ═══════════════════════════════════════════
function doPost(e) {
  try {
    var data = {};
    
    if (!e) {
      Logger.log('doPost: e가 undefined');
      return jsonResponse({ status: 'error', message: 'no event object' });
    }
    
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch(parseErr) {
        Logger.log('JSON 파싱 실패: ' + parseErr.message + ' | contents: ' + e.postData.contents.substring(0, 200));
      }
    }
    
    if (!data.type && !data.action && e.parameter) {
      data = flatParamsToData(e.parameter);
    }
    
    return processData(data);
  } catch(err) {
    Logger.log('doPost 에러: ' + err.message);
    return jsonResponse({ status: 'error', message: err.message });
  }
}


// ═══════════════════════════════════════════
// [2] GET 수신
// ═══════════════════════════════════════════
function doGet(e) {
  try {
    var data = {};
    
    if (!e) {
      return jsonResponse({ status: 'error', message: 'no event object' });
    }
    
    if (e.parameter && e.parameter.data) {
      try {
        data = JSON.parse(decodeURIComponent(e.parameter.data));
      } catch(parseErr) {
        Logger.log('GET data 파싱 실패: ' + parseErr.message);
      }
    }
    
    if (!data.type && !data.action && e.parameter && (e.parameter.type || e.parameter.action)) {
      data = flatParamsToData(e.parameter);
    }
    
    if (data.type || data.action) {
      return processData(data);
    }
    
    return jsonResponse({ status: 'ok', message: 'N-KAI Apps Script v7.1 running' });
  } catch(err) {
    Logger.log('doGet 에러: ' + err.message);
    return jsonResponse({ status: 'error', message: err.message });
  }
}


// ═══════════════════════════════════════════
// [3] 데이터 라우터
// ═══════════════════════════════════════════
function processData(data) {
  if (!data) {
    return jsonResponse({ status: 'error', message: 'data 없음' });
  }
  
  var type = data.type || data.action || '';
  type = String(type).trim();
  var typeLower = type.toLowerCase();
  
  var subAction = String(data.sub_action || data.action || '').trim().toLowerCase();
  
  if (!type) {
    Logger.log('type/action 필드 없음. data: ' + JSON.stringify(data).substring(0, 300));
    return jsonResponse({ status: 'error', message: 'type/action 필드 없음' });
  }
  
  Logger.log('[v7.1] 수신: type=' + type + ' sub_action=' + subAction + ' | keys=' + Object.keys(data).join(','));
  
  if (typeLower === 'raffle_ticket' || subAction === 'raffle_ticket') {
    logRaffleTicket(data);
    return jsonResponse({ status: 'ok', type: 'raffle_ticket', version: 'v7.1' });
  }
  
  switch(typeLower) {
    case 'session':
      trackSession(data);
      break;
    case 'utm':
      trackUTM(data);
      break;
    case 'funnel':
      trackFunnel(data);
      break;
    case '무료분석요청':
      trackAnalysis(data, '무료분석요청');
      break;
    case '아키타입확정':
      trackAnalysis(data, '아키타입확정');
      break;
    case '시간업그레이드':
      trackAnalysis(data, '시간업그레이드');
      break;
    case 'share':
    case 'share_click':
      logShareTracking(data);
      break;
    case 'trial':
      logTrialMgmt(data);
      break;
    case 'referral':
    case 'referral_arrival':
      logReferralTracking(data);
      break;
    case 'premium_unlock':
      logPremiumUnlock(data);
      break;
    case 'premium_email':
      logPremiumEmail(data);
      break;
    case 'send_pdf_report':
      return sendPdfReport(data);
    // ★ v7.0: 서버사이드 PDF 생성 + 이메일 1통 발송
    case 'send_server_report':
      return sendServerReport(data);
    case 'reservation':
    case 'pre_order':
    case 'preorder':
    case 'premium_landing':
    case 'premium_landing_signup':
      logReservation(data);
      break;
    case 'recruit':
    case 'apply':
      logRecruit(data);
      break;
    case 'partnership':
    case 'partner_inquiry':
      logPartnership(data);
      break;
    case 'confirm_payment':
      return confirmTossPayment(data);
    case 'admin_dashboard':
      return handleAdminDashboard(data);
    default:
      if (type === '무료분석요청') {
        trackAnalysis(data, '무료분석요청');
      } else if (type === '아키타입확정') {
        trackAnalysis(data, '아키타입확정');
      } else if (type === '시간업그레이드') {
        trackAnalysis(data, '시간업그레이드');
      } else {
        Logger.log('알 수 없는 type: ' + type);
        logUnknownType(data, type);
      }
  }
  
  return jsonResponse({ status: 'ok', type: type, version: 'v7.1' });
}


// ═══════════════════════════════════════════
// [4] 세션 트래킹
// ═══════════════════════════════════════════
function trackSession(data) {
  data = data || {};
  var sheet = getOrCreateSheet(SHEET_SESSIONS, HEADERS.sessions);
  var row = [
    new Date(),
    safeStr(data.session_id),
    safeStr(data.event, 'page_view'),
    safeStr(data.page, 'home'),
    safeNum(data.duration),
    safeStr(data.device),
    safeStr(data.browser),
    safeStr(data.screen),
    safeStr(data.email),
    safeStr(data.utm_source, 'direct'),
    safeStr(data.utm_medium, '(none)'),
    safeStr(data.utm_campaign, '(none)'),
    safeStr(data.utm_term),
    safeStr(data.utm_content),
    safeStr(data.referrer, '(direct)'),
    safeStr(data.country, 'Unknown'),
    safeStr(data.language)
  ];
  sheet.appendRow(row);
}


// ═══════════════════════════════════════════
// [5] UTM 유입경로
// ═══════════════════════════════════════════
function trackUTM(data) {
  data = data || {};
  var sheet = getOrCreateSheet(SHEET_UTM, HEADERS.utm);
  var row = [
    new Date(),
    safeStr(data.utm_source, 'direct'),
    safeStr(data.utm_medium, '(none)'),
    safeStr(data.utm_campaign, '(none)'),
    safeStr(data.utm_term),
    safeStr(data.utm_content),
    safeStr(data.landing_page),
    safeStr(data.referrer, '(direct)'),
    safeStr(data.device),
    safeStr(data.session_id),
    '',
    ''
  ];
  sheet.appendRow(row);
}


// ═══════════════════════════════════════════
// [6] 퍼널 트래킹
// ═══════════════════════════════════════════
function trackFunnel(data) {
  data = data || {};
  var sheet = getOrCreateSheet(SHEET_FUNNEL, HEADERS.funnel);
  var row = [
    new Date(),
    safeStr(data.session_id),
    safeStr(data.email),
    safeStr(data.step),
    safeStr(data.step_name),
    safeNum(data.duration || data.elapsed_seconds),
    safeStr(data.is_exit || data.is_bounce, 'N'),
    safeStr(data.device),
    safeStr(data.utm_source),
    safeStr(data.archetype),
    safeStr(data.nscore || data.n_score),
    safeStr(data.kipa_energy),
    safeStr(data.kipa_perception),
    safeStr(data.kipa_judgment),
    safeStr(data.kipa_lifestyle)
  ];
  sheet.appendRow(row);
  
  if (data.session_id && (data.step === 'step_06' || data.step === 'step_07' || data.step === 'step_08')) {
    updateUTMConversion(data.session_id, data.step);
  }
}


// ═══════════════════════════════════════════
// [7] 분석데이터
// ═══════════════════════════════════════════
function trackAnalysis(data, analysisType) {
  data = data || {};
  var sheet = getOrCreateSheet(SHEET_ANALYSIS, HEADERS.analysis);
  
  var hourRaw = safeStr(data.birthtime || data.birth_hour);
  var hourLabel = convertToSijin(hourRaw);
  
  if (analysisType === '시간업그레이드') {
    var sid = safeStr(data.session_id);
    var email = safeStr(data.email);
    if (sid || email) {
      try {
        var allData = sheet.getDataRange().getValues();
        var headers = allData[0] || [];
        var colSession = -1, colEmail = -1, colType = -1;
        for (var ci = 0; ci < headers.length; ci++) {
          var h = String(headers[ci]).trim();
          if (h === '분석유형' || h === '유형') colType = ci;
          if (h === '이메일') colEmail = ci;
          if (h === '세션ID' || h === 'session_id') colSession = ci;
        }
        var targetRow = -1;
        for (var ri = allData.length - 1; ri >= 1; ri--) {
          var rowType = String(allData[ri][colType] || '').trim();
          if (rowType !== '아키타입확정') continue;
          if (sid && colSession >= 0 && String(allData[ri][colSession] || '').trim() === sid) { targetRow = ri + 1; break; }
          if (email && colEmail >= 0 && String(allData[ri][colEmail] || '').trim() === email) { targetRow = ri + 1; break; }
        }
        if (targetRow > 0) {
          var colHour = -1, colArch = -1, colNscore = -1, colNgrade = -1, colPrecision = -1, colBlood = -1;
          for (var ci2 = 0; ci2 < headers.length; ci2++) {
            var h2 = String(headers[ci2]).trim();
            if (h2 === '출생시') colHour = ci2;
            if (h2 === '분석유형' || h2 === '유형') colType = ci2;
            if (h2 === '아키타입') colArch = ci2;
            if (h2 === 'N-Score') colNscore = ci2;
            if (h2 === 'N등급') colNgrade = ci2;
            if (h2 === '정밀도') colPrecision = ci2;
            if (h2 === '혈액형') colBlood = ci2;
          }
          if (colHour >= 0) sheet.getRange(targetRow, colHour + 1).setValue(hourLabel);
          if (colType >= 0) sheet.getRange(targetRow, colType + 1).setValue('시간업그레이드');
          if (colArch >= 0) sheet.getRange(targetRow, colArch + 1).setValue(safeStr(data.archetype));
          if (colNscore >= 0) sheet.getRange(targetRow, colNscore + 1).setValue(safeStr(data.nscore || data.n_score));
          if (colBlood >= 0 && safeStr(data.bloodtype)) sheet.getRange(targetRow, colBlood + 1).setValue(safeStr(data.bloodtype));
          if (colNgrade >= 0) sheet.getRange(targetRow, colNgrade + 1).setValue(safeStr(data.ngrade || data.n_grade));
          if (colPrecision >= 0) sheet.getRange(targetRow, colPrecision + 1).setValue('94%');
          Logger.log('[v7.1] 시간업그레이드: 기존 행 ' + targetRow + ' 덮어쓰기 완료');
          syncHourUpgradeToRelatedSheets(data);
          return;
        }
        Logger.log('[v7.1] 시간업그레이드: 기존 아키타입확정 행 없음 → 새 행 추가');
      } catch (e) {
        Logger.log('[v7.1] 시간업그레이드 덮어쓰기 에러: ' + e.message);
      }
    }
  }
  
  var row = [
    new Date(),
    safeStr(data.name),
    safeStr(data.email),
    safeStr(data.birthdate),
    hourLabel,
    safeStr(data.region),
    safeStr(data.gender),
    safeStr(data.job),
    safeStr(data.bloodtype),
    safeStr(analysisType),
    safeStr(data.archetype),
    safeStr(data.nscore || data.n_score),
    safeStr(data.ngrade || data.n_grade),
    safeStr(data.precision),
    safeStr(data.kipa_energy),
    safeStr(data.kipa_perception),
    safeStr(data.kipa_judgment),
    safeStr(data.kipa_lifestyle),
    safeStr(data.kipa_mode),
    safeStr(data.kipa_q1), safeStr(data.kipa_q2),
    safeStr(data.kipa_q3), safeStr(data.kipa_q4),
    safeStr(data.kipa_q5), safeStr(data.kipa_q6),
    safeStr(data.kipa_q7), safeStr(data.kipa_q8),
    safeStr(data.kipa_q9), safeStr(data.kipa_q10),
    safeStr(data.kipa_q11), safeStr(data.kipa_q12),
    safeStr(data.kipa_q13), safeStr(data.kipa_q14),
    safeStr(data.kipa_q15), safeStr(data.kipa_q16)
  ];
  sheet.appendRow(row);
}


function syncHourUpgradeToRelatedSheets(data) {
  var email = safeStr(data.email);
  var sid = safeStr(data.session_id);
  var newArch = safeStr(data.archetype);
  var newNscore = safeStr(data.nscore || data.n_score);
  if (!email && !sid) return;
  
  var sheetsToSync = [
    { name: '공유트래킹', archCol: '아키타입', scoreCol: 'N-Score', matchCol: '이메일', matchCol2: '세션ID' },
    { name: '추천권', archCol: '아키타입', scoreCol: 'N-Score', matchCol: '이메일', matchCol2: '세션ID' },
    { name: '퍼널트래킹', archCol: '아키타입', scoreCol: 'N-Score', matchCol: '이메일', matchCol2: '세션ID' }
  ];
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  sheetsToSync.forEach(function(cfg) {
    try {
      var sheet = ss.getSheetByName(cfg.name);
      if (!sheet) return;
      var allData = sheet.getDataRange().getValues();
      if (allData.length < 2) return;
      var headers = allData[0];
      
      var colArch = -1, colScore = -1, colMatch = -1, colMatch2 = -1;
      for (var ci = 0; ci < headers.length; ci++) {
        var h = String(headers[ci]).trim();
        if (h === cfg.archCol) colArch = ci;
        if (h === cfg.scoreCol) colScore = ci;
        if (h === cfg.matchCol) colMatch = ci;
        if (h === cfg.matchCol2) colMatch2 = ci;
      }
      if (colArch < 0 && colScore < 0) return;
      
      var updated = 0;
      for (var ri = allData.length - 1; ri >= 1 && updated < 10; ri--) {
        var rowEmail = colMatch >= 0 ? String(allData[ri][colMatch] || '').trim() : '';
        var rowSid = colMatch2 >= 0 ? String(allData[ri][colMatch2] || '').trim() : '';
        var matched = false;
        if (sid && rowSid && rowSid === sid) matched = true;
        else if (email && rowEmail && rowEmail === email) matched = true;
        
        if (matched) {
          if (colArch >= 0 && newArch) sheet.getRange(ri + 1, colArch + 1).setValue(newArch);
          if (colScore >= 0 && newNscore) sheet.getRange(ri + 1, colScore + 1).setValue(newNscore);
          updated++;
        }
      }
      if (updated > 0) Logger.log('[v7.1] ' + cfg.name + ': ' + updated + '행 동기 업데이트');
    } catch (e) {
      Logger.log('[v7.1] ' + cfg.name + ' 동기 에러: ' + e.message);
    }
  });
}


// ═══════════════════════════════════════════
// [8] 공유트래킹
// ═══════════════════════════════════════════
function logShareTracking(data) {
  data = data || {};
  var sheet = getOrCreateSheet(SHEET_SHARE_TRACKING, HEADERS.shareTracking);
  var email = safeStr(data.email);
  
  var shareCount = 1;
  var ticketCount = 0;
  if (email) {
    try {
      var allData = sheet.getDataRange().getValues();
      for (var i = 1; i < allData.length; i++) {
        if (String(allData[i][1]).trim() === email) shareCount++;
      }
      ticketCount = Math.floor(shareCount / 3);
    } catch(e) {
      Logger.log('[v7.1] 누적카운트 에러: ' + e.message);
    }
  }
  
  var row = [
    new Date(),
    email,
    safeStr(data.name),
    safeStr(data.archetype),
    safeStr(data.nscore || data.n_score),
    safeStr(data.platform || data.channel),
    shareCount,
    ticketCount,
    safeStr(data.session_id),
    safeStr(data.device),
    safeStr(data.share_url || data.url),
    safeStr(data.source || data.utm_source),
    safeStr(data.ref_code || data.refCode)
  ];
  sheet.appendRow(row);

  try {
    logRaffleTicket(data);
    Logger.log('[v7.1] ✅ 추천권 자동 적재 완료 (공유 연동)');
  } catch(e) {
    Logger.log('[v7.1] 추천권 자동 적재 실패: ' + e.message);
  }
}


// ═══════════════════════════════════════════
// [9] 체험권관리
// ═══════════════════════════════════════════
function logTrialMgmt(data) {
  data = data || {};
  var sheet = getOrCreateSheet(SHEET_TRIAL_MGMT, HEADERS.trialMgmt);
  var row = [
    new Date(),
    safeStr(data.email),
    safeStr(data.name),
    safeStr(data.archetype),
    safeStr(data.trigger, 'share_complete'),
    safeStr(data.activated_at),
    safeStr(data.expires_at),
    safeStr(data.status, 'active'),
    '',
    '',
    safeStr(data.platform || data.channel)
  ];
  sheet.appendRow(row);
}


// ═══════════════════════════════════════════
// [10] 레퍼럴트래킹
// ═══════════════════════════════════════════
function logReferralTracking(data) {
  data = data || {};
  var sheet = getOrCreateSheet(SHEET_REFERRAL, HEADERS.referralTracking);
  var isArrival = (safeStr(data.type) === 'referral_arrival');
  var row = [
    new Date(),
    isArrival ? '' : safeStr(data.referrer_email || data.email),
    isArrival ? '' : safeStr(data.referrer_name || data.name),
    isArrival ? '' : safeStr(data.archetype),
    isArrival ? '' : safeStr(data.referred_email),
    isArrival ? '' : safeStr(data.referred_name),
    safeStr(data.ref_code || data.refCode),
    safeStr(data.platform || data.channel),
    '',
    '',
    '',
    isArrival ? ('arrival: ' + safeStr(data.landing_url)) : ''
  ];
  sheet.appendRow(row);
}


// ═══════════════════════════════════════════
// [11] 프리미엄 언락
// ═══════════════════════════════════════════
function logPremiumUnlock(data) {
  data = data || {};
  var sheet = getOrCreateSheet(SHEET_PREMIUM_UNLOCK, HEADERS.premiumUnlock);
  var row = [
    new Date(),
    safeStr(data.email),
    safeStr(data.name),
    safeStr(data.archetype),
    safeStr(data.nscore || data.n_score),
    safeStr(data.ngrade || data.n_grade),
    safeStr(data.session_id),
    safeStr(data.device),
    safeStr(data.source),
    safeStr(data.url),
    safeStr(data.utm_source),
    safeStr(data.utm_medium),
    safeStr(data.utm_campaign)
  ];
  sheet.appendRow(row);
}


// ═══════════════════════════════════════════
// [12] 프리미엄 이메일
// ═══════════════════════════════════════════
function logPremiumEmail(data) {
  data = data || {};
  var sheet = getOrCreateSheet(SHEET_PREMIUM_EMAIL, HEADERS.premiumEmail);
  var row = [
    new Date(),
    safeStr(data.email),
    safeStr(data.name),
    safeStr(data.archetype),
    safeStr(data.nscore || data.n_score),
    safeStr(data.ngrade || data.n_grade),
    safeStr(data.session_id),
    safeStr(data.status || 'sent')
  ];
  sheet.appendRow(row);
}


// ═══════════════════════════════════════════
// [13] 추천권
// ═══════════════════════════════════════════
function logRaffleTicket(data) {
  data = data || {};
  var sheet = getOrCreateSheet(SHEET_RAFFLE_TICKET, HEADERS.raffleTicket);
  var row = [
    new Date(),
    safeStr(data.email),
    safeStr(data.name),
    safeStr(data.platform || data.channel),
    safeStr(data.archetype),
    safeStr(data.nscore || data.n_score),
    safeStr(data.session_id),
    safeStr(data.device),
    safeStr(data.source),
    safeStr(data.ref_code || data.refCode)
  ];
  sheet.appendRow(row);
}


// ═══════════════════════════════════════════
// [14] 사전예약
// ═══════════════════════════════════════════
function logReservation(data) {
  data = data || {};
  var sheet = getOrCreateSheet(SHEET_RESERVATION, HEADERS.reservation);
  var email = safeStr(data.email || '(테스트)');
  var source = safeStr(data.source || data.utm_source || data.landing_page || 'direct');
  sheet.appendRow([new Date(), email, source]);
  
  try {
    MailApp.sendEmail(CEO_EMAIL,
      '[N-KAI 사전예약] ' + email,
      '새로운 사전예약이 접수되었습니다.\n\n'
      + '■ 이메일: ' + email + '\n'
      + '■ 유입경로: ' + source + '\n'
      + '■ 시각: ' + new Date().toLocaleString('ko-KR') + '\n\n'
      + '— N-KAI System v7.1');
  } catch(e) {
    Logger.log('[v7.1] 사전예약 이메일 실패: ' + e.message);
  }
}


// ═══════════════════════════════════════════
// [15] 채용지원
// ═══════════════════════════════════════════
function logRecruit(data) {
  data = data || {};
  var sheet = getOrCreateSheet(SHEET_RECRUIT, HEADERS.recruit);
  
  if (safeStr(data._phase) === 'file_upload' && data.resume_file && data.resume_filename) {
    var email = safeStr(data.email);
    var driveUrl = '';
    try {
      var blob = Utilities.newBlob(
        Utilities.base64Decode(data.resume_file),
        data.resume_mimetype || 'application/pdf',
        data.resume_filename
      );
      var folders = DriveApp.getFoldersByName('N-KAI 채용 이력서');
      var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder('N-KAI 채용 이력서');
      var name = safeStr(data.name) || 'unknown';
      var pos = safeStr(data.position) || '';
      var ext = data.resume_filename.split('.').pop();
      var safeName = name + '_' + pos + '_' + Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyyMMdd') + '.' + ext;
      var file = folder.createFile(blob.setName(safeName));
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      driveUrl = file.getUrl();
    } catch(e) {
      Logger.log('[v7.1] Phase2 이력서 Drive 실패: ' + e.message);
      return;
    }
    if (email && driveUrl) {
      try {
        var allData = sheet.getDataRange().getValues();
        for (var ri = allData.length - 1; ri >= 1; ri--) {
          if (String(allData[ri][2]).trim() === email) {
            sheet.getRange(ri + 1, 10).setValue(driveUrl);
            break;
          }
        }
      } catch(e2) {}
      try {
        MailApp.sendEmail(CEO_EMAIL,
          '[N-KAI 이력서] ' + safeStr(data.name) + ' — ' + safeStr(data.position),
          '이력서가 첨부 도착했습니다.\n\n■ 지원자: ' + safeStr(data.name)
          + '\n■ 포지션: ' + safeStr(data.position)
          + '\n■ Drive: ' + driveUrl
          + '\n\n— N-KAI System v7.1');
      } catch(e3) {}
    }
    return;
  }
  
  var phone = safeStr(data.phone || data.contact);
  var name = safeStr(data.name);
  var email = safeStr(data.email);
  var position = safeStr(data.position);
  var experience = safeStr(data.experience || data.career);
  var portfolio = safeStr(data.portfolio);
  var techStack = safeStr(data.tech_stack || data.skills);
  var motivation = safeStr(data.motivation);
  var resume = safeStr(data.resume);
  
  var driveFileUrl = '';
  var attachment = null;
  if (data.resume_file && data.resume_filename) {
    try {
      var blob = Utilities.newBlob(
        Utilities.base64Decode(data.resume_file),
        data.resume_mimetype || 'application/pdf',
        data.resume_filename
      );
      var folders = DriveApp.getFoldersByName('N-KAI 채용 이력서');
      var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder('N-KAI 채용 이력서');
      var ext = data.resume_filename.split('.').pop();
      var safeName = name + '_' + position + '_' + Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyyMMdd') + '.' + ext;
      var file = folder.createFile(blob.setName(safeName));
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      driveFileUrl = file.getUrl();
      resume = driveFileUrl;
      attachment = blob;
    } catch(fileErr) {
      Logger.log('[v7.1] 이력서 Drive 저장 실패: ' + fileErr.message);
      resume = safeStr(data.resume) || '(파일 업로드 실패)';
    }
  }
  
  var row = [
    new Date(), name, email, phone, position, experience,
    portfolio, techStack, motivation, resume
  ];
  sheet.appendRow(row);
  var lastRow = sheet.getLastRow();
  sheet.getRange(lastRow, 4).setNumberFormat('@').setValue(phone);
  
  try {
    var subject = '[N-KAI 채용지원] ' + name + ' — ' + position;
    var body = '━━━ N-KAI 채용지원 알림 ━━━\n\n'
      + '■ 지원자: ' + name + '\n'
      + '■ 이메일: ' + email + '\n'
      + '■ 연락처: ' + phone + '\n'
      + '■ 포지션: ' + position + '\n'
      + '■ 경력: ' + experience + '\n'
      + '■ 기술스택: ' + techStack + '\n'
      + '■ 포트폴리오: ' + portfolio + '\n'
      + '■ 지원동기: ' + motivation + '\n'
      + '■ 이력서: ' + (driveFileUrl || resume || '(미첨부)') + '\n\n'
      + '— N-KAI System v7.1';
    
    var mailOptions = {};
    if (attachment) mailOptions.attachments = [attachment];
    MailApp.sendEmail(CEO_EMAIL, subject, body, mailOptions);
  } catch(mailErr) {
    Logger.log('[v7.1] 채용 이메일 실패: ' + mailErr.message);
  }
}


// ═══════════════════════════════════════════
// [16] 제휴문의
// ═══════════════════════════════════════════
function logPartnership(data) {
  data = data || {};
  var sheet = getOrCreateSheet(SHEET_PARTNERSHIP, HEADERS.partnership);
  var company = safeStr(data.company);
  var name = safeStr(data.name);
  var email = safeStr(data.email);
  var phone = safeStr(data.phone);
  var pType = safeStr(data.partnership_type || data.type_detail);
  var message = safeStr(data.message);
  
  var row = [
    new Date(), company, name, email, phone, pType, message,
    safeStr(data.device),
    safeStr(data.url),
    safeStr(data.referrer, '(direct)')
  ];
  sheet.appendRow(row);
  if (phone && /^\d/.test(phone)) {
    var lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 5).setNumberFormat('@').setValue(phone);
  }
  
  try {
    var typeLabel = {
      'b2b_b2g': 'B2B·B2G API/SDK',
      'tech_research': '기술·연구',
      'business_investment': '사업·투자',
      'media': '미디어·취재',
      'other': '기타'
    };
    var subject = '[N-KAI 제휴문의] ' + company + ' — ' + (typeLabel[pType] || pType);
    var body = '━━━ N-KAI 제휴문의 알림 ━━━\n\n'
      + '■ 회사/기관: ' + company + '\n'
      + '■ 담당자: ' + name + '\n'
      + '■ 이메일: ' + email + '\n'
      + '■ 연락처: ' + phone + '\n'
      + '■ 제휴유형: ' + (typeLabel[pType] || pType) + '\n'
      + '■ 제안내용:\n' + message + '\n\n'
      + '— N-KAI System v7.1';
    MailApp.sendEmail(CEO_EMAIL, subject, body);
  } catch(e) {
    Logger.log('[v7.1] 제휴 이메일 실패: ' + e.message);
  }
}


// ═══════════════════════════════════════════════════════════════
// [17] PDF 리포트 이메일 발송 v2.0 (deprecated — v7.0에서 sendServerReport 사용 권장)
// ═══════════════════════════════════════════════════════════════

function sendPdfReport(data) {
  try {
    var email    = data.email;
    var name     = data.name || '고객';
    var lang     = data.lang || 'ko';
    var subject  = data.subject || '[N-KAI] 프리미엄 분석 리포트 (PDF)';
    var pdfB64   = data.pdf_base64;
    var filename = data.filename || 'N-KAI_Premium_Report.pdf';
    var archetype = data.archetype || '';
    var nscore    = data.nscore || '';
    
    var themeIcon      = data.theme_icon || 'K';
    var themeColor     = data.theme_color || '#2D8CFF';
    var groupName      = data.group_name || '';
    var archetypeTitle = data.archetype_title || '';
    var archetypeCode  = data.archetype_code || archetype;
    var archetypeSummary = data.archetype_summary || '';
    
    if (!email || !pdfB64) {
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, error: 'email 또는 pdf_base64 누락' })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    
    var pdfBytes = Utilities.base64Decode(pdfB64);
    var pdfBlob  = Utilities.newBlob(pdfBytes, 'application/pdf', filename);
    
    var htmlBody = getPdfEmailHtml(name, lang, archetypeCode, nscore, {
      themeIcon: themeIcon, themeColor: themeColor, groupName: groupName,
      archetypeTitle: archetypeTitle, archetypeSummary: archetypeSummary
    });
    
    GmailApp.sendEmail(email, subject, '', {
      htmlBody: htmlBody, attachments: [pdfBlob],
      name: 'N-KAI Financial DNA', replyTo: 'support@neurinkairosai.com'
    });
    
    try { var logSheet = getOrCreateSheet(SHEET_PDF_LOG, HEADERS.pdfLog); logSheet.appendRow([new Date(), email, name, archetypeCode, nscore, lang, filename, 'SUCCESS']); } catch(logErr) {}
    try { MailApp.sendEmail(CEO_EMAIL, '[N-KAI PDF발송] ' + name + ' (' + archetypeCode + ')', '━━━ PDF 리포트 발송 알림 ━━━\n\n■ 수신자: ' + email + '\n■ 이름: ' + name + '\n■ 아키타입: ' + archetypeCode + '\n■ N-Score: ' + nscore + '\n■ 언어: ' + lang + '\n■ 시각: ' + new Date().toLocaleString('ko-KR') + '\n\n— N-KAI System v7.1'); } catch(ceoErr) {}
    
    return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'PDF 이메일 발송 완료' })).setMimeType(ContentService.MimeType.JSON);
    
  } catch(err) {
    Logger.log('[v7.1] sendPdfReport 오류: ' + err.message);
    try { var logSheet2 = getOrCreateSheet(SHEET_PDF_LOG, HEADERS.pdfLog); logSheet2.appendRow([new Date(), safeStr(data.email), safeStr(data.name), '', '', '', '', 'ERROR: ' + err.message]); } catch(e) {}
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message })).setMimeType(ContentService.MimeType.JSON);
  }
}


// ═══════════════════════════════════════════════════════════════
// PDF 이메일 HTML 템플릿 v2.0 — 아이콘/테두리 포함
// ═══════════════════════════════════════════════════════════════

function getPdfEmailHtml(name, lang, archetype, nscore, theme) {
  theme = theme || {};
  var icon    = theme.themeIcon || 'K';
  var color   = theme.themeColor || '#2D8CFF';
  var group   = theme.groupName || '';
  var title   = theme.archetypeTitle || '';
  var summary = theme.archetypeSummary || '';
  
  var iconBgMap = {
    '#FFD700': 'rgba(255,215,0,0.15)',
    '#64C8FF': 'rgba(100,200,255,0.15)',
    '#00C896': 'rgba(0,200,150,0.15)',
    '#C896FF': 'rgba(200,150,255,0.15)',
    '#2D8CFF': 'rgba(45,140,255,0.15)'
  };
  var iconBg = iconBgMap[color] || 'rgba(45,140,255,0.15)';
  
  var i18n = {
    ko: {
      greeting: name + '님의 프리미엄 분석 리포트',
      desc: 'AI가 분석한 당신만의 금융 DNA 프리미엄 리포트가 준비되었습니다. 첨부된 PDF에서 전체 리포트를 확인하세요.',
      dna: 'YOUR FINANCIAL DNA',
      scoreLabel: 'N-SCORE',
      includes: '리포트 포함 내용',
      item1: '16개 아키타입 심층 분석',
      item2: 'N-Score 9등급 상세 해석',
      item3: '3대 핵심 지표 (경제감각 · 표현에너지 · 위기대응력)',
      item4: '골든타임 TOP3 투자 기회',
      item5: '리스크 히트맵 & 웰니스 추천',
      cta: '사이트에서 전체 분석 보기',
      footer: '이 메일은 N-KAI 결제 고객에게 자동 발송됩니다.',
      disclaimer: '본 분석은 투자 자문이 아닙니다. 투자 결정은 본인의 판단과 책임 하에 이루어져야 합니다.'
    },
    en: {
      greeting: 'Premium Analysis Report for ' + name,
      desc: 'Your personalized Financial DNA premium report by N-KAI is ready. Check the attached PDF for the full report.',
      dna: 'YOUR FINANCIAL DNA',
      scoreLabel: 'N-SCORE',
      includes: 'Report Includes',
      item1: '16 Archetype Deep Analysis',
      item2: 'N-Score 9-Level Detailed Interpretation',
      item3: '3 Core Metrics (Financial Sense · Expression Energy · Crisis Response)',
      item4: 'Golden Time TOP3 Investment Opportunities',
      item5: 'Risk Heatmap & Wellness Recommendations',
      cta: 'View Full Analysis on Site',
      footer: 'This email is automatically sent to N-KAI paid subscribers.',
      disclaimer: 'This analysis is not investment advice. Investment decisions should be made at your own judgment and responsibility.'
    },
    ja: {
      greeting: name + '様のプレミアム分析レポート',
      desc: 'N-KAIが分析したあなただけの金融DNAプレミアムレポートが準備できました。添付PDFで全体レポートをご覧ください。',
      dna: 'YOUR FINANCIAL DNA',
      scoreLabel: 'N-SCORE',
      includes: 'レポート内容',
      item1: '16アーキタイプ深層分析',
      item2: 'N-Score 9等級詳細解釈',
      item3: '3大コア指標（経済感覚・表現エネルギー・危機対応力）',
      item4: 'ゴールデンタイムTOP3投資機会',
      item5: 'リスクヒートマップ＆ウェルネス推薦',
      cta: 'サイトで全体分析を見る',
      footer: 'このメールはN-KAI決済顧客に自動送信されます。',
      disclaimer: 'この分析は投資助言ではありません。投資判断はご自身の責任で行ってください。'
    },
    zh: {
      greeting: name + ' 的高级分析报告',
      desc: 'N-KAI分析的您专属金融DNA高级报告已准备好。请查看附件PDF获取完整报告。',
      dna: 'YOUR FINANCIAL DNA',
      scoreLabel: 'N-SCORE',
      includes: '报告内容',
      item1: '16种原型深度分析',
      item2: 'N-Score 9等级详细解读',
      item3: '3大核心指标（经济感觉·表达能量·危机应对力）',
      item4: '黄金时机TOP3投资机会',
      item5: '风险热图和健康建议',
      cta: '在网站查看完整分析',
      footer: '此邮件自动发送给N-KAI付费用户。',
      disclaimer: '本分析不构成投资建议。投资决策应由您自行判断和负责。'
    }
  };
  
  var t = i18n[lang] || i18n['ko'];
  
  return '<!DOCTYPE html>'
    + '<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>'
    + '<body style="margin:0;padding:0;background:#0a0e1a;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">'
    + '<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0e1a;padding:40px 20px;">'
    + '<tr><td align="center">'
    + '<table width="600" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:16px;overflow:hidden;">'
    + '<tr><td style="background:linear-gradient(135deg,#d4a853,#f0c674,#d4a853);padding:24px;text-align:center;">'
    + '<div style="font-size:28px;font-weight:800;color:#0a0e1a;letter-spacing:3px;">N-KAI</div>'
    + '<div style="font-size:11px;color:#0a0e1a;margin-top:4px;letter-spacing:2px;opacity:0.7;">YOUR FINANCIAL DNA IS READY</div>'
    + '</td></tr>'
    + '<tr><td style="padding:28px 32px 8px;">'
    + '<h2 style="color:#f0c674;font-size:18px;margin:0;font-weight:700;">' + t.greeting + '</h2>'
    + '</td></tr>'
    + '<tr><td style="padding:0 32px 20px;">'
    + '<p style="color:#d1d5db;font-size:13px;line-height:1.7;margin:0;">' + t.desc + '</p>'
    + '</td></tr>'
    + '<tr><td style="padding:0 32px 4px;">'
    + '<div style="font-size:11px;color:#f0c674;letter-spacing:1.5px;font-weight:600;border-left:3px solid #f0c674;padding-left:8px;">' + t.dna + '</div>'
    + '</td></tr>'
    + '<tr><td style="padding:8px 32px 20px;">'
    + '<table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1f35;border:2px solid ' + color + ';border-radius:12px;">'
    + '<tr><td style="padding:24px;text-align:center;">'
    + '<div style="width:56px;height:56px;border-radius:50%;background:' + iconBg + ';border:2px solid ' + color + ';display:inline-block;line-height:56px;text-align:center;margin-bottom:10px;">'
    + '<span style="font-size:24px;font-weight:700;color:' + color + ';">' + icon + '</span>'
    + '</div><br>'
    + (group ? '<div style="font-size:13px;color:' + color + ';margin-bottom:8px;">' + group + '</div>' : '')
    + '<div style="font-size:32px;font-weight:800;color:#ffffff;letter-spacing:2px;margin-bottom:6px;">' + (archetype || 'ISTP') + '</div>'
    + (title ? '<div style="font-size:16px;font-weight:700;color:#ffffff;margin-bottom:10px;">' + title + '</div>' : '')
    + (summary ? '<div style="background:#0f1525;border-radius:8px;padding:12px 16px;margin-top:4px;">'
    + '<p style="color:#d1d5db;font-size:13px;line-height:1.6;margin:0;">' + summary + '</p>'
    + '</div>' : '')
    + '</td></tr></table>'
    + '</td></tr>'
    + '<tr><td style="padding:0 32px 20px;">'
    + '<div style="border-left:3px solid #ef4444;padding-left:8px;font-size:11px;color:#ef4444;letter-spacing:1.5px;font-weight:600;margin-bottom:8px;">' + t.scoreLabel + '</div>'
    + '<table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1f35;border-radius:12px;">'
    + '<tr><td style="padding:16px 24px;">'
    + '<div style="font-size:36px;font-weight:800;color:#f0c674;text-align:center;">' + (nscore || '601') + '<span style="font-size:14px;color:#9ca3af;font-weight:400;margin-left:4px;">점</span></div>'
    + '</td></tr></table>'
    + '</td></tr>'
    + '<tr><td style="padding:0 32px 20px;">'
    + '<div style="font-size:12px;font-weight:600;color:#f0c674;margin-bottom:10px;">' + t.includes + '</div>'
    + '<div style="color:#d1d5db;font-size:12px;line-height:2.0;">'
    + '- ' + t.item1 + '<br>'
    + '- ' + t.item2 + '<br>'
    + '- ' + t.item3 + '<br>'
    + '- ' + t.item4 + '<br>'
    + '- ' + t.item5
    + '</div>'
    + '</td></tr>'
    + '<tr><td style="padding:0 32px 24px;text-align:center;">'
    + '<a href="https://www.neurinkairosai.com" style="display:inline-block;background:linear-gradient(135deg,#d4a853,#f0c674);color:#0a0e1a;font-size:14px;font-weight:700;padding:14px 36px;border-radius:8px;text-decoration:none;">'
    + t.cta + '</a>'
    + '</td></tr>'
    + '<tr><td style="padding:0 32px 24px;">'
    + '<p style="color:#6b7280;font-size:11px;line-height:1.5;margin:0;border-top:1px solid #2d3548;padding-top:16px;">'
    + t.disclaimer + '</p>'
    + '<p style="color:#4b5563;font-size:10px;margin:8px 0 0;">' + t.footer + '</p>'
    + '<p style="color:#374151;font-size:10px;margin:4px 0 0;">&copy; 2025 뉴린카이로스에이아이(주) | neurinkairosai.com</p>'
    + '</td></tr>'
    + '</table></td></tr></table></body></html>';
}


// ═══════════════════════════════════════════
// [18] 알 수 없는 type 로깅
// ═══════════════════════════════════════════
function logUnknownType(data, type) {
  var sheetName = '디버그로그';
  var headers = ['일시', 'type', 'action', '전체데이터(JSON)'];
  var sheet = getOrCreateSheet(sheetName, headers);
  sheet.appendRow([
    new Date(),
    safeStr(data.type),
    safeStr(data.action),
    JSON.stringify(data).substring(0, 1000)
  ]);
}


// ═══════════════════════════════════════════
// [19] UTM 전환 업데이트
// ═══════════════════════════════════════════
function updateUTMConversion(sessionId, step) {
  try {
    var utmSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_UTM);
    if (!utmSheet) return;
    var data = utmSheet.getDataRange().getValues();
    for (var i = data.length - 1; i >= 1; i--) {
      if (data[i][9] === sessionId) {
        utmSheet.getRange(i + 1, 11).setValue('Y');
        utmSheet.getRange(i + 1, 12).setValue(step);
        break;
      }
    }
  } catch(e) {
    Logger.log('UTM 전환 업데이트 실패: ' + e.message);
  }
}


// ═══════════════════════════════════════════════════════════════
// [20] 토스페이먼츠 결제 승인 (confirm_payment)
// ═══════════════════════════════════════════════════════════════
var TOSS_SECRET_KEY = 'test_sk_XZYkKL4MrjqaNnPRWEORV0zJwlEW';
// ★ 통판 완료 후 live_sk_ 로 교체

function confirmTossPayment(data) {
  var paymentKey = data.paymentKey || '';
  var orderId = data.orderId || '';
  var amount = parseInt(data.amount || '0', 10);
  
  Logger.log('[TOSS] 결제 승인 요청: orderId=' + orderId + ' amount=' + amount);
  
  if (!paymentKey || !orderId || !amount) {
    logPaymentRecord(data, 'FAILED', '필수 파라미터 누락');
    return jsonResponse({ success: false, error: '필수 파라미터 누락 (paymentKey, orderId, amount)' });
  }
  
  try {
    var authHeader = 'Basic ' + Utilities.base64Encode(TOSS_SECRET_KEY + ':');
    var payload = { paymentKey: paymentKey, orderId: orderId, amount: amount };
    var options = {
      method: 'post',
      contentType: 'application/json',
      headers: { 'Authorization': authHeader },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    var response = UrlFetchApp.fetch('https://api.tosspayments.com/v1/payments/confirm', options);
    var responseCode = response.getResponseCode();
    var responseBody = JSON.parse(response.getContentText());
    
    Logger.log('[TOSS] 응답 코드: ' + responseCode);
    
    if (responseCode === 200) {
      Logger.log('[TOSS] ✅ 결제 승인 성공: ' + responseBody.paymentKey);
      logPaymentRecord({
        paymentKey: responseBody.paymentKey,
        orderId: responseBody.orderId,
        amount: responseBody.totalAmount,
        method: responseBody.method || '',
        status: responseBody.status || 'DONE',
        approvedAt: responseBody.approvedAt || '',
        name: data.name || '',
        email: data.email || '',
        plan: data.plan || '',
        archetype: data.archetype || '',
        nscore: data.nscore || data.n_score || ''
      }, 'SUCCESS', '');
      
      return jsonResponse({
        success: true,
        paymentKey: responseBody.paymentKey,
        orderId: responseBody.orderId,
        amount: responseBody.totalAmount,
        method: responseBody.method,
        status: responseBody.status
      });
    } else {
      var errMsg = (responseBody.message || responseBody.code || '승인 실패');
      Logger.log('[TOSS] ❌ 결제 승인 실패: ' + errMsg);
      logPaymentRecord(data, 'FAILED', errMsg);
      return jsonResponse({ success: false, error: errMsg, code: responseBody.code || '' });
    }
  } catch(e) {
    Logger.log('[TOSS] 결제 승인 예외: ' + e.message);
    logPaymentRecord(data, 'ERROR', e.message);
    return jsonResponse({ success: false, error: e.message });
  }
}


// ═══════════════════════════════════════════════════════════════
// ★★★ v7.1 수정: logPaymentRecord — 한글 13컬럼 정합성 ★★★
// ═══════════════════════════════════════════════════════════════
function logPaymentRecord(data, status, errorMsg) {
  try {
    var PAYMENT_HEADERS = [
      '일시', '주문번호', '결제키', '금액', '결제수단',
      '상태', '승인시각', '이름', '이메일', '플랜',
      '아키타입', 'N-Score', '오류'
    ];
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('결제기록');
    
    if (!sheet) {
      sheet = ss.insertSheet('결제기록');
      sheet.appendRow(PAYMENT_HEADERS);
      sheet.getRange(1, 1, 1, PAYMENT_HEADERS.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
    
    // ★ 헤더 순서와 완벽히 일치하는 appendRow
    sheet.appendRow([
      new Date(),                              // 일시
      safeStr(data.orderId),                   // 주문번호
      safeStr(data.paymentKey),                // 결제키
      safeNum(data.amount),                    // 금액
      safeStr(data.method),                    // 결제수단
      safeStr(status),                         // 상태
      safeStr(data.approvedAt),                // 승인시각
      safeStr(data.name),                      // 이름
      safeStr(data.email),                     // 이메일
      safeStr(data.plan),                      // 플랜
      safeStr(data.archetype),                 // 아키타입
      safeStr(data.nscore || data.n_score),    // N-Score
      safeStr(errorMsg)                        // 오류
    ]);
    
  } catch(e) {
    Logger.log('[결제기록] 시트 기록 실패: ' + e.message);
  }
}


// ═══════════════════════════════════════════════════════════════
// [21] 서버사이드 PDF 리포트 (v7.0 신규)
// ═══════════════════════════════════════════════════════════════
function sendServerReport(data) {
  try {
    var email = data.email;
    var name = data.name || '고객';
    var lang = data.lang || 'ko';
    var archetype = data.archetype || '';
    var nscore = data.nscore || data.n_score || '';
    
    if (!email) {
      return jsonResponse({ success: false, error: 'email 누락' });
    }
    
    // HTML → PDF 변환 (Google Apps Script 내장)
    var html = buildPdfReportHtml(data, lang);
    var blob = Utilities.newBlob(html, 'text/html', 'report.html');
    
    // HTML을 PDF로 변환 시도
    var pdfBlob;
    try {
      var tempFile = DriveApp.createFile(blob);
      pdfBlob = tempFile.getAs('application/pdf');
      var filename = 'N-KAI_Report_' + archetype + '_' + Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyyMMdd') + '.pdf';
      pdfBlob.setName(filename);
      DriveApp.removeFile(tempFile);
    } catch(pdfErr) {
      Logger.log('[v7.1] PDF 변환 실패, HTML 이메일만 발송: ' + pdfErr.message);
      pdfBlob = null;
    }
    
    var subject = {
      ko: '[N-KAI] ' + name + '님의 프리미엄 분석 리포트',
      en: '[N-KAI] Premium Analysis Report for ' + name,
      ja: '[N-KAI] ' + name + '様のプレミアム分析レポート',
      zh: '[N-KAI] ' + name + ' 的高级分析报告'
    }[lang] || '[N-KAI] 프리미엄 분석 리포트';
    
    var emailHtml = getPdfEmailHtml(name, lang, archetype, nscore, {
      themeIcon: data.theme_icon || 'K',
      themeColor: data.theme_color || '#2D8CFF',
      groupName: data.group_name || '',
      archetypeTitle: data.archetype_title || '',
      archetypeSummary: data.archetype_summary || ''
    });
    
    var mailOptions = {
      htmlBody: emailHtml,
      name: 'N-KAI Financial DNA',
      replyTo: 'support@neurinkairosai.com'
    };
    if (pdfBlob) mailOptions.attachments = [pdfBlob];
    
    GmailApp.sendEmail(email, subject, '', mailOptions);
    
    // 로그 기록
    try {
      var logSheet = getOrCreateSheet(SHEET_PDF_LOG, HEADERS.pdfLog);
      logSheet.appendRow([new Date(), email, name, archetype, nscore, lang, pdfBlob ? pdfBlob.getName() : '(HTML only)', 'SUCCESS']);
    } catch(logErr) {}
    
    // CEO 알림
    try {
      MailApp.sendEmail(CEO_EMAIL, '[N-KAI 서버PDF] ' + name + ' (' + archetype + ')',
        '━━━ 서버 PDF 리포트 발송 알림 ━━━\n\n■ 수신자: ' + email
        + '\n■ 이름: ' + name + '\n■ 아키타입: ' + archetype
        + '\n■ N-Score: ' + nscore + '\n■ 언어: ' + lang
        + '\n■ PDF: ' + (pdfBlob ? '첨부' : 'HTML only')
        + '\n■ 시각: ' + new Date().toLocaleString('ko-KR') + '\n\n— N-KAI System v7.1');
    } catch(ceoErr) {}
    
    return jsonResponse({ success: true, message: '서버 PDF 리포트 발송 완료', hasPdf: !!pdfBlob });
    
  } catch(err) {
    Logger.log('[v7.1] sendServerReport 오류: ' + err.message);
    return jsonResponse({ success: false, error: err.message });
  }
}


function buildPdfReportHtml(data, lang) {
  var name = data.name || '고객';
  var archetype = data.archetype || 'ISTP';
  var nscore = data.nscore || data.n_score || '601';
  
  return '<!DOCTYPE html><html><head><meta charset="utf-8">'
    + '<style>body{font-family:sans-serif;background:#0a0e1a;color:#d1d5db;padding:40px;}'
    + 'h1{color:#f0c674;font-size:24px;}h2{color:#d4a853;font-size:18px;border-bottom:1px solid #2d3548;padding-bottom:8px;}'
    + '.card{background:#111827;border-radius:12px;padding:24px;margin:16px 0;}'
    + '.score{font-size:48px;color:#f0c674;font-weight:800;text-align:center;}'
    + '.label{font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;}'
    + '</style></head><body>'
    + '<h1>N-KAI Premium Report</h1>'
    + '<div class="card"><div class="label">ARCHETYPE</div>'
    + '<div style="font-size:28px;color:#fff;font-weight:700;">' + archetype + '</div></div>'
    + '<div class="card"><div class="label">N-SCORE</div>'
    + '<div class="score">' + nscore + '</div></div>'
    + '<div class="card"><h2>Analysis Summary</h2>'
    + '<p>' + (data.archetype_summary || 'Your Financial DNA analysis results.') + '</p></div>'
    + '<p style="color:#4b5563;font-size:10px;margin-top:40px;">'
    + '© 2025 뉴린카이로스에이아이(주) | 본 분석은 투자 자문이 아닙니다.</p>'
    + '</body></html>';
}


// ═══════════════════════════════════════════════════════════════
// [22] 어드민 대시보드 API
// ═══════════════════════════════════════════════════════════════
function handleAdminDashboard(data) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var result = {};
    
    // 각 시트 행 수 카운트
    var sheetNames = [
      SHEET_SESSIONS, SHEET_UTM, SHEET_FUNNEL, SHEET_ANALYSIS,
      SHEET_SHARE_TRACKING, SHEET_TRIAL_MGMT, SHEET_REFERRAL,
      SHEET_PREMIUM_UNLOCK, SHEET_PREMIUM_EMAIL, SHEET_RAFFLE_TICKET,
      SHEET_RESERVATION, SHEET_RECRUIT, SHEET_PARTNERSHIP, SHEET_PDF_LOG
    ];
    
    var counts = {};
    sheetNames.forEach(function(name) {
      var sheet = ss.getSheetByName(name);
      counts[name] = sheet ? Math.max(0, sheet.getLastRow() - 1) : 0;
    });
    
    // 분석데이터에서 아키타입 분포
    var archetypeDist = {};
    var analysisSheet = ss.getSheetByName(SHEET_ANALYSIS);
    if (analysisSheet && analysisSheet.getLastRow() > 1) {
      var aData = analysisSheet.getDataRange().getValues();
      var headers = aData[0];
      var archCol = -1;
      for (var i = 0; i < headers.length; i++) {
        if (String(headers[i]).trim() === '아키타입') { archCol = i; break; }
      }
      if (archCol >= 0) {
        for (var r = 1; r < aData.length; r++) {
          var arch = String(aData[r][archCol] || '').trim();
          if (arch) archetypeDist[arch] = (archetypeDist[arch] || 0) + 1;
        }
      }
    }
    
    // 결제 현황
    var paymentSheet = ss.getSheetByName('결제기록');
    var paymentCount = 0;
    var totalRevenue = 0;
    if (paymentSheet && paymentSheet.getLastRow() > 1) {
      var pData = paymentSheet.getDataRange().getValues();
      for (var p = 1; p < pData.length; p++) {
        var status = String(pData[p][5] || '').trim();
        if (status === 'SUCCESS') {
          paymentCount++;
          totalRevenue += parseInt(pData[p][3] || 0, 10);
        }
      }
    }
    
    result = {
      status: 'ok',
      version: 'v7.1',
      timestamp: new Date().toISOString(),
      counts: counts,
      archetypeDist: archetypeDist,
      payment: { successCount: paymentCount, totalRevenue: totalRevenue },
      totalAnalysis: counts[SHEET_ANALYSIS] || 0,
      totalSessions: counts[SHEET_SESSIONS] || 0,
      totalReservations: counts[SHEET_RESERVATION] || 0,
      totalShares: counts[SHEET_SHARE_TRACKING] || 0,
      totalPremium: counts[SHEET_PREMIUM_UNLOCK] || 0,
      totalTrials: counts[SHEET_TRIAL_MGMT] || 0,
      totalRaffles: counts[SHEET_RAFFLE_TICKET] || 0,
      totalRecruits: counts[SHEET_RECRUIT] || 0
    };
    
    return jsonResponse(result);
  } catch(e) {
    Logger.log('[v7.1] admin_dashboard 에러: ' + e.message);
    return jsonResponse({ status: 'error', error: e.message });
  }
}


// ═══════════════════════════════════════════════════════════════
// [23] 아키타입 상세 매핑 (admin/PDF/이메일용)
// ═══════════════════════════════════════════════════════════════
var ARCHETYPE_ENHANCED = {
  'ENTJ': { group: '항해사', groupEn: 'Navigator', title: '전략적 사령관', icon: '⚔️', color: '#FFD700' },
  'INTJ': { group: '항해사', groupEn: 'Navigator', title: '심층 전략가', icon: '🔭', color: '#FFD700' },
  'ENTP': { group: '항해사', groupEn: 'Navigator', title: '혁신적 도전자', icon: '🚀', color: '#FFD700' },
  'INTP': { group: '항해사', groupEn: 'Navigator', title: '논리적 분석자', icon: '🧬', color: '#FFD700' },
  'ESTJ': { group: '분석가', groupEn: 'Analyst', title: '체계적 관리자', icon: '📊', color: '#64C8FF' },
  'ISTJ': { group: '분석가', groupEn: 'Analyst', title: '안정적 수호자', icon: '🛡️', color: '#64C8FF' },
  'ESTP': { group: '분석가', groupEn: 'Analyst', title: '실전형 행동가', icon: '⚡', color: '#64C8FF' },
  'ISTP': { group: '분석가', groupEn: 'Analyst', title: '냉철한 해결사', icon: '🔧', color: '#64C8FF' },
  'ESFJ': { group: '실용주의', groupEn: 'Pragmatist', title: '조화로운 운영자', icon: '🤝', color: '#00C896' },
  'ISFJ': { group: '실용주의', groupEn: 'Pragmatist', title: '신뢰의 수호자', icon: '🏠', color: '#00C896' },
  'ESFP': { group: '실용주의', groupEn: 'Pragmatist', title: '자유로운 실행자', icon: '🎯', color: '#00C896' },
  'ISFP': { group: '실용주의', groupEn: 'Pragmatist', title: '감성적 탐험가', icon: '🎨', color: '#00C896' },
  'ENFJ': { group: '비전가', groupEn: 'Visionary', title: '카리스마 리더', icon: '✨', color: '#C896FF' },
  'INFJ': { group: '비전가', groupEn: 'Visionary', title: '통찰의 예언자', icon: '🔮', color: '#C896FF' },
  'ENFP': { group: '비전가', groupEn: 'Visionary', title: '열정적 탐험가', icon: '🌟', color: '#C896FF' },
  'INFP': { group: '비전가', groupEn: 'Visionary', title: '이상주의 치유자', icon: '🌙', color: '#C896FF' }
};


// ═══════════════════════════════════════════════════════════════
// [30] 유틸리티 함수들
// ═══════════════════════════════════════════════════════════════

function safeStr(val, fallback) {
  if (val === undefined || val === null || val === '') return fallback || '';
  return String(val).trim();
}

function safeNum(val, fallback) {
  if (val === undefined || val === null || val === '') return fallback || 0;
  var n = Number(val);
  return isNaN(n) ? (fallback || 0) : n;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function flatParamsToData(params) {
  var data = {};
  for (var key in params) {
    if (params.hasOwnProperty(key)) {
      data[key] = params[key];
    }
  }
  return data;
}

function getOrCreateSheet(sheetName, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (headers && headers.length > 0) {
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
    Logger.log('[v7.1] 시트 생성: ' + sheetName);
  }
  return sheet;
}

function convertToSijin(hourStr) {
  if (!hourStr || hourStr === '' || hourStr === '모름' || hourStr === 'unknown') return '모름';
  var h = parseInt(hourStr, 10);
  if (isNaN(h)) return safeStr(hourStr);
  var sijinMap = [
    [23, 1, '子시(자시)'], [1, 3, '丑시(축시)'], [3, 5, '寅시(인시)'],
    [5, 7, '卯시(묘시)'], [7, 9, '辰시(진시)'], [9, 11, '巳시(사시)'],
    [11, 13, '午시(오시)'], [13, 15, '未시(미시)'], [15, 17, '申시(신시)'],
    [17, 19, '酉시(유시)'], [19, 21, '戌시(술시)'], [21, 23, '亥시(해시)']
  ];
  for (var i = 0; i < sijinMap.length; i++) {
    var start = sijinMap[i][0], end = sijinMap[i][1], label = sijinMap[i][2];
    if (start > end) {
      if (h >= start || h < end) return label;
    } else {
      if (h >= start && h < end) return label;
    }
  }
  return hourStr + '시';
}


// ═══════════════════════════════════════════════════════════════
// ★ v7.1 수정: fixAllHeaders — '결제기록' 시트 포함
// ═══════════════════════════════════════════════════════════════
function fixAllHeaders() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetMap = {
    '세션트래킹':     HEADERS.sessions,
    'UTM유입경로':    HEADERS.utm,
    '퍼널트래킹':     HEADERS.funnel,
    '분석데이터':     HEADERS.analysis,
    '공유트래킹':     HEADERS.shareTracking,
    '체험권관리':     HEADERS.trialMgmt,
    '레퍼럴트래킹':   HEADERS.referralTracking,
    '프리미엄언락':   HEADERS.premiumUnlock,
    '프리미엄이메일': HEADERS.premiumEmail,
    '추천권':         HEADERS.raffleTicket,
    '사전예약':       HEADERS.reservation,
    '채용지원':       HEADERS.recruit,
    '제휴문의':       HEADERS.partnership,
    'PDF발송로그':    HEADERS.pdfLog,
    // ★ v7.1 추가
    '결제기록':       HEADERS.payment
  };
  
  var fixed = [];
  for (var name in sheetMap) {
    if (!sheetMap.hasOwnProperty(name)) continue;
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.appendRow(sheetMap[name]);
      sheet.getRange(1, 1, 1, sheetMap[name].length).setFontWeight('bold');
      sheet.setFrozenRows(1);
      fixed.push(name + ' (신규 생성)');
      continue;
    }
    var currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var expectedHeaders = sheetMap[name];
    var needsFix = false;
    if (currentHeaders.length !== expectedHeaders.length) {
      needsFix = true;
    } else {
      for (var i = 0; i < expectedHeaders.length; i++) {
        if (String(currentHeaders[i]).trim() !== String(expectedHeaders[i]).trim()) {
          needsFix = true;
          break;
        }
      }
    }
    if (needsFix) {
      sheet.getRange(1, 1, 1, Math.max(currentHeaders.length, expectedHeaders.length)).clearContent();
      sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]).setFontWeight('bold');
      sheet.setFrozenRows(1);
      fixed.push(name);
    }
  }
  
  if (fixed.length > 0) {
    Logger.log('[v7.1] 교정된 시트: ' + fixed.join(', '));
    SpreadsheetApp.getUi().alert('헤더 교정 완료!\n\n교정된 시트: ' + fixed.join(', '));
  } else {
    Logger.log('[v7.1] 모든 시트 헤더 정상');
    SpreadsheetApp.getUi().alert('모든 시트 헤더가 정상입니다.');
  }
}


// ═══════════════════════════════════════════════════════════════
// [31] 테스트 함수
// ═══════════════════════════════════════════════════════════════
function testConfirmPayment() {
  var testData = {
    type: 'confirm_payment',
    paymentKey: 'test_pk_' + new Date().getTime(),
    orderId: 'NKAI-TEST-' + new Date().getTime(),
    amount: 9900,
    name: '테스트유저',
    email: 'test@test.com',
    plan: 'Standard',
    archetype: 'ENTJ',
    nscore: '720'
  };
  Logger.log('[TEST] 테스트 결제 시작...');
  var result = confirmTossPayment(testData);
  Logger.log('[TEST] 결과: ' + result.getContent());
}


function testSendPdfReport() {
  var testData = {
    email: CEO_EMAIL,
    name: '테스트',
    archetype: 'ENTJ',
    nscore: '720',
    lang: 'ko',
    theme_icon: '⚔️',
    theme_color: '#FFD700',
    group_name: '항해사 Navigator',
    archetype_title: '전략적 사령관',
    archetype_summary: '체계적 목표 수립과 강력한 실행력으로 금융 자산을 전략적으로 운용하는 유형입니다.'
  };
  Logger.log('[TEST] 서버 리포트 테스트...');
  var result = sendServerReport(testData);
  Logger.log('[TEST] 결과: ' + result.getContent());
}


function testAdminDashboard() {
  var testData = { type: 'admin_dashboard' };
  var result = handleAdminDashboard(testData);
  Logger.log('[TEST] 대시보드: ' + result.getContent());
}


// ═══════════════════════════════════════════════════════════════
// [32] 메뉴 설정
// ═══════════════════════════════════════════════════════════════
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('N-KAI v7.1')
    .addItem('🔧 전체 헤더 교정 (fixAllHeaders)', 'fixAllHeaders')
    .addSeparator()
    .addItem('📊 대시보드 테스트', 'testAdminDashboard')
    .addItem('💳 결제 테스트', 'testConfirmPayment')
    .addItem('📧 서버 PDF 테스트', 'testSendPdfReport')
    .addToUi();
}


// ═══════════════════════════════════════════════════════════════
// END — N-KAI GAS v7.1
// ═══════════════════════════════════════════════════════════════
