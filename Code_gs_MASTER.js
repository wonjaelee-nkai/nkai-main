// ══════════════════════════════════════════════════════════════════════════════
//  N-KAI GAS — Code.gs 완전 통합본 v5.9 (2026-03-18) ★ Phase1 투명성 + 16아키타입 폴백 완전개인화 + S09/S13
//  ✅ v4.0 기반 (SHEET_MAP/logTrackingData/enrichPayloadData 완전 유지)
//  ✅ buildPdfReportHtml v41 (6개 섹션 복원: S02/S03/S05/S08/S09/S10)
//  ✅ CLAUDE_MODEL: claude-sonnet-4-6
//  ✅ tier 자동 판별 / 3단계 폴백 / 중복방지 / PDF 3회 재시도 / 비동기
// ══════════════════════════════════════════════════════════════════════════════

// ────────────────────────────────────────────────────────────────────────────

// ════════════════════════════════════════════════════════════════════
// PART 0b — 소비행동 보너스 계산 (saju-engine.js 이식 v1.0)
// 최대 150점: [A]재무건전성60 + [B]아키타입정합성50 + [C]행동활성화40
// ════════════════════════════════════════════════════════════════════
function computeBehaviorBonus(quiz, archetypeCode) {
  if (!quiz || typeof quiz.spending === 'undefined') return null;
  var groupMap = {
    ENTJ:'NT',ENTP:'NT',INTJ:'NT',INTP:'NT',
    ESTJ:'ST',ISTJ:'ST',ESTP:'ST',ISTP:'ST',
    ENFJ:'NF',INFJ:'NF',ENFP:'NF',INFP:'NF',
    ESFJ:'SF',ISFJ:'SF',ESFP:'SF',ISFP:'SF'
  };
  var group = groupMap[archetypeCode] || 'ST';
  var healthScore = 0;
  healthScore += ([15,10,5,0][quiz.impulse]    || 0);
  healthScore += ([20,15,8,0][quiz.tracking]   || 0);
  healthScore += ([15,18,5,8,12][quiz.windfall] || 0);
  var alignmentBonus = 0;
  var expectedPatterns = {
    'NT':{ spending:[2,3], windfall:[1],   impulse:[0,1] },
    'ST':{ spending:[3,4], windfall:[0,4], impulse:[0,1] },
    'NF':{ spending:[2,3], windfall:[1,3], impulse:[1,2] },
    'SF':{ spending:[0,4], windfall:[0,2], impulse:[1,2] }
  };
  var expected = expectedPatterns[group] || expectedPatterns['ST'];
  if (expected.spending.indexOf(quiz.spending)  >= 0) alignmentBonus += 20;
  if (expected.windfall.indexOf(quiz.windfall)  >= 0) alignmentBonus += 18;
  if (expected.impulse.indexOf(quiz.impulse)    >= 0) alignmentBonus += 12;
  var activationBonus = 0;
  if (quiz.tracking === 0) activationBonus += 15;
  if (quiz.impulse === 0 && quiz.windfall <= 1) activationBonus += 15;
  if (quiz.spending === 3) activationBonus += 10;
  var totalBonus = Math.min(150, healthScore + alignmentBonus + activationBonus);
  return {
    totalBonus: totalBonus,
    healthScore: healthScore,
    alignmentBonus: alignmentBonus,
    activationBonus: activationBonus,
    consumptionResonance: Math.round((alignmentBonus/50)*100),
    breakdown: {
      impulseControl:      ([15,10,5,0][quiz.impulse]    || 0),
      monitoringHabit:     ([20,15,8,0][quiz.tracking]   || 0),
      windfallRationality: ([15,18,5,8,12][quiz.windfall] || 0),
      archetypeAlignment:  alignmentBonus,
      activation:          activationBonus
    }
  };
}


// ════════════════════════════════════════════════════════════════════
// OneSignal 웹 푸시 발송 함수
// ════════════════════════════════════════════════════════════════════
var ONESIGNAL_APP_ID  = 'de7a8e7d-c95e-4d2b-9853-df9fb7ee0905';
var ONESIGNAL_API_KEY = 'os_v2_app_3z5i47ojlzgsxgct36p3p3qjax7zkez2m2lelbmchkrz3wdkocoy4arri2hcjtoewqzogjczsmvhdvzbzr6y54s3ecd23vpxd2qsaha';

function sendOneSignalPush(title, message, url, filters) {
  try {
    var payload = {
      app_id:   ONESIGNAL_APP_ID,
      name:     'N-KAI 자동 넛지',
      headings: { ko: title,   en: title },
      contents: { ko: message, en: message },
      url:      url || 'https://neurinkairosai.com',
      filters:  filters || [{ field: 'last_session', relation: '>', hours_ago: '0' }]
    };
    var response = UrlFetchApp.fetch('https://onesignal.com/api/v1/notifications', {
      method:  'POST',
      headers: {
        'Authorization': 'Basic ' + ONESIGNAL_API_KEY,
        'Content-Type':  'application/json'
      },
      payload: JSON.stringify(payload)
    });
    var result = JSON.parse(response.getContentText());
    Logger.log('[OneSignal] 푸시 발송 완료: ' + JSON.stringify(result));
    return result;
  } catch(e) {
    Logger.log('[OneSignal] 푸시 발송 오류: ' + e);
    return null;
  }
}

// 분석 완료 2시간 후 넛지 푸시 — 트리거로 실행
function sendNudgePush(email, archetype, goldentime, name) {
  var title   = name + '님의 골든타임 알림';
  var message = archetype + ' 유형 — ' + goldentime + ' 골든타임이 다가옵니다. 지금 준비하세요 🎯';
  var filters = [
    { field: 'tag', key: 'archetype', relation: '=', value: archetype }
  ];
  return sendOneSignalPush(title, message, 'https://neurinkairosai.com', filters);
}

// 테스트 푸시 — GAS 에디터에서 직접 실행
function testOneSignalPush() {
  var result = sendOneSignalPush(
    'N-KAI 테스트 알림',
    '골든타임 알림 시스템이 정상 작동 중입니다 🎯',
    'https://neurinkairosai.com',
    null
  );
  Logger.log('[테스트] 결과: ' + JSON.stringify(result));
}


// PART 1 — CONFIG & 헬퍼
// ────────────────────────────────────────────────────────────────────────────

var CONFIG = {
  CLAUDE_API_KEY:  PropertiesService.getScriptProperties().getProperty('CLAUDE_API_KEY') || '',
  CLAUDE_MODEL:    'claude-sonnet-4-6',
  TOSS_SECRET_KEY: PropertiesService.getScriptProperties().getProperty('TOSS_SECRET_KEY') || '',
  SENDER_EMAIL:    'wonjae.lee@neurinkairosai.com',
  SHEET_NAME:      'PDF발송로그',
  ADMIN_EMAIL:     'wonjae.lee@neurinkairosai.com',
  SPREADSHEET_ID:  PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || '',
  MAX_TOKENS_STD:  2000,
  MAX_TOKENS_PRM:  4000
};

// ════════════════════════════════════════════════════════════
//  SHEET_MAP v4.0
// ════════════════════════════════════════════════════════════
var SHEET_MAP = {
  'payment':'결제기록','purchase':'결제기록',
  'pdf_send':'PDF발송로그','email_send':'프리미엄이메일','email_sent':'프리미엄이메일',
  'analyze':'분석데이터','analysis':'분석데이터','free_analysis':'분석데이터','free_result':'분석데이터',
  '아키타입확정':'분석데이터','archetype_confirm':'분석데이터','kipa_complete':'분석데이터','result_complete':'분석데이터',
  'session':'세션트래킹','session_start':'세션트래킹','session_end':'세션트래킹',
  'utm':'UTM유입경로','utm_visit':'UTM유입경로','visit':'UTM유입경로',
  'funnel':'퍼널트래킹','funnel_step':'퍼널트래킹','page_view':'퍼널트래킹','step':'퍼널트래킹',
  'share':'공유트래킹','referral_ticket':'추천권','referral':'레퍼럴트래킹','refer':'레퍼럴트래킹',
  'premium_unlock':'프리미엄언락','premium_view':'프리미엄언락',
  'partner':'제휴문의','affiliate':'제휴문의','pre_reserve':'사전예약','recruit':'채용지원',
  'trial':'체험권관리','trial_use':'체험권관리','ticket':'체험권관리',
  'ticket_use':'체험권관리','raffle_ticket':'체험권관리','ticket_enter':'체험권관리',
  'subscribe':'구독신청','subscription':'구독신청'
};

// ════════════════════════════════════════════════════════════
//  SHEET_HEADERS v4.0 — logTrackingData push 순서와 완전 1:1
// ════════════════════════════════════════════════════════════
var SHEET_HEADERS = {
  '결제기록':['일시','주문번호','이메일','이름','아키타입','N-Score','티어','금액','상태','UTM_source'],
  'PDF발송로그':['A:일시','B:주문번호','C:이메일','D:이름','E:아키타입','F:N-Score','G:티어','H:상태','I:시도횟수','J:발송메모'],
  '프리미엄이메일':['일시','세션ID','이메일','이름','아키타입','N-Score','발송결과','발송경로','티어','모바일여부'],
  '분석데이터':['일시','세션ID','이메일','이름','아키타입','N-Score','N등급','경제감각','기회포착력','위기대응력','코어에너지','골든타임1','골든타임2','골든타임3','공유채널','언어','생년월일','출생시','지역','성별','직업','모바일여부','UTM_source','UTM_medium','UTM_campaign','Q1','Q2','Q3','Q4','Q5','Q6','Q7','Q8','Q9','Q10','Q11','Q12','Q13','Q14','Q15','Q16','SQ1소비빈도','SQ2지출방식','SQ3저축성향','SQ4투자경험','breakdown_innate','breakdown_kipa','breakdown_dynamic','behavior_bonus','autoresend_done'],
  '세션트래킹':['일시','세션ID','이메일','이름','아키타입','N-Score','이벤트','체류시간','UTM_source','UTM_medium','UTM_campaign','모바일여부','언어'],
  'UTM유입경로':['일시','세션ID','이메일','UTM_source','UTM_medium','UTM_campaign','UTM_term','UTM_content','리퍼러','모바일여부'],
  '퍼널트래킹':['일시','세션ID','이메일','아키타입','N-Score','단계','이벤트','페이지','UTM_source','UTM_medium','모바일여부'],
  '공유트래킹':['일시','세션ID','이메일','이름','아키타입','N-Score','플랫폼','출처','UTM_source','모바일여부'],
  '추천권':['일시','세션ID','이메일','이름','아키타입','N-Score','레퍼럴코드','플랫폼','UTM_source','모바일여부'],
  '레퍼럴트래킹':['일시','세션ID','이메일','이름','아키타입','N-Score','레퍼럴코드','플랫폼','UTM_source','모바일여부'],
  '프리미엄언락':['일시','세션ID','이메일','이름','아키타입','N-Score','언락방법','UTM_source','UTM_medium','모바일여부'],
  '제휴문의':['일시','세션ID','이메일','이름','회사','문의내용','UTM_source','모바일여부'],
  '사전예약':['일시','이메일','유입경로'],
  '채용지원':['일시','이름','이메일','연락처','포지션','경력','포트폴리오','기술스택','지원동기','이력서'],
  '체험권관리':['일시','세션ID','이메일','이름','아키타입','N-Score','체험권종류','사용여부','만료일','메모'],
  '구독신청':['일시','세션ID','이메일','이름','플랜','금액','UTM_source','모바일여부'],
  '기타트래킹':['일시','세션ID','타입','이메일','이름','아키타입','N-Score','플랫폼','UTM_source','상세JSON']
};

function fixAllHeaders() {
  var ss = getLogSpreadsheet();
  if (!ss) { Logger.log('❌ 스프레드시트 없음'); return; }
  var log = [];
  for (var name in SHEET_HEADERS) {
    var sheet = ss.getSheetByName(name) || ss.insertSheet(name);
    var h = SHEET_HEADERS[name];
    sheet.getRange(1,1,1,h.length).setValues([h]).setFontWeight('bold').setBackground('#1a1a2e').setFontColor('#F0C674');
    sheet.setFrozenRows(1);
    log.push(name + ':' + h.length + '컬');
  }
  Logger.log('✅ 전 시트 헤더 갱신 완료: ' + log.join(' | '));
}

function getLogSpreadsheet() {
  var id = CONFIG.SPREADSHEET_ID;
  if (id) { try { return SpreadsheetApp.openById(id); } catch(e) { Logger.log('[Sheets] openById 실패: ' + e.toString()); } }
  try { return SpreadsheetApp.getActiveSpreadsheet(); } catch(e) {}
  Logger.log('[Sheets] ❌ 스프레드시트 접근 불가 — SPREADSHEET_ID 설정 필요');
  return null;
}

function getOrCreateSheet(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    var hdrs = SHEET_HEADERS[sheetName] || SHEET_HEADERS['기타트래킹'];
    sheet.getRange(1,1,1,hdrs.length).setValues([hdrs]).setFontWeight('bold').setBackground('#1a1a2e').setFontColor('#F0C674');
    sheet.setFrozenRows(1);
    Logger.log('[tracking] 새 시트 생성: ' + sheetName);
  }
  return sheet;
}


// ════════════════════════════════════════════════════════════════════
//  PART 0 — 에너지 밸런스% 계산 모듈 ★ FIX v4.1 (getElPcts)
//  1순위: data.el_* payload 실제값
//  2순위: birth_year/month으로 에너지 밸런스 직접 계산
//  3순위: coreElement 기반 아키타입 평균값 폴백
// ════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════
//  N-KAI GAS — 에너지 밸런스% 계산 모듈 v1.0 (saju-engine.js 이식)
//  Code.gs에 PART 1 CONFIG 바로 아래에 붙여넣으세요.
//  역할: el_* payload 없을 때 birth_year/month/day로 직접 에너지 밸런스% 산출
// ════════════════════════════════════════════════════════════════════

// ── 입춘 테이블 (1920~2050)
var LICHUN_TABLE_GAS = {
  1920:[2,5],1921:[2,4],1922:[2,4],1923:[2,5],1924:[2,5],1925:[2,4],1926:[2,4],1927:[2,5],1928:[2,5],1929:[2,4],
  1930:[2,4],1931:[2,5],1932:[2,5],1933:[2,4],1934:[2,4],1935:[2,5],1936:[2,5],1937:[2,4],1938:[2,4],1939:[2,5],
  1940:[2,5],1941:[2,4],1942:[2,4],1943:[2,5],1944:[2,5],1945:[2,4],1946:[2,4],1947:[2,5],1948:[2,5],1949:[2,4],
  1950:[2,4],1951:[2,4],1952:[2,5],1953:[2,4],1954:[2,4],1955:[2,4],1956:[2,5],1957:[2,4],1958:[2,4],1959:[2,4],
  1960:[2,5],1961:[2,4],1962:[2,4],1963:[2,4],1964:[2,5],1965:[2,4],1966:[2,4],1967:[2,4],1968:[2,5],1969:[2,4],
  1970:[2,4],1971:[2,4],1972:[2,5],1973:[2,4],1974:[2,4],1975:[2,4],1976:[2,5],1977:[2,4],1978:[2,4],1979:[2,4],
  1980:[2,5],1981:[2,4],1982:[2,4],1983:[2,4],1984:[2,4],1985:[2,4],1986:[2,4],1987:[2,4],1988:[2,4],1989:[2,4],
  1990:[2,4],1991:[2,4],1992:[2,4],1993:[2,4],1994:[2,4],1995:[2,4],1996:[2,4],1997:[2,4],1998:[2,4],1999:[2,4],
  2000:[2,4],2001:[2,4],2002:[2,4],2003:[2,4],2004:[2,4],2005:[2,4],2006:[2,4],2007:[2,4],2008:[2,4],2009:[2,4],
  2010:[2,4],2011:[2,4],2012:[2,4],2013:[2,4],2014:[2,4],2015:[2,4],2016:[2,4],2017:[2,3],2018:[2,4],2019:[2,4],
  2020:[2,4],2021:[2,3],2022:[2,4],2023:[2,4],2024:[2,4],2025:[2,3],2026:[2,4],2027:[2,4],2028:[2,4],2029:[2,3],
  2030:[2,4]
};

// ── 천간 에너지 밸런스 매핑
var ENERGY_EL_GAS = {
  '甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水'
};

// ── 통근 테이블 (천간별 뿌리 지지)
var ROOTING_TABLE_GAS = {
  '甲':['寅','卯','辰','亥'],'乙':['寅','卯','辰','未'],'丙':['巳','午','寅'],'丁':['巳','午','未','戌'],
  '戊':['辰','戌','丑','未','巳','午'],'己':['辰','戌','丑','未','巳','午'],'庚':['申','酉','戌','巳'],
  '辛':['申','酉','戌','丑'],'壬':['亥','子','申'],'癸':['亥','子','丑','辰']
};

// ── 지지 에너지 밸런스 비율 [목,화,토,금,수] (장간 반영)
var BRANCH_RATIO_GAS = {
  '子':[0,0,0,0,1.0],'丑':[0,0,0.6,0.2,0.2],'寅':[0.6,0.3,0.1,0,0],'卯':[1.0,0,0,0,0],
  '辰':[0.2,0,0.6,0,0.2],'巳':[0,0.6,0.1,0.3,0],'午':[0,0.7,0.3,0,0],'未':[0.2,0.2,0.6,0,0],
  '申':[0,0,0.1,0.6,0.3],'酉':[0,0,0,1.0,0],'戌':[0,0.1,0.7,0.2,0],'亥':[0.3,0,0,0,0.7]
};

// ── 헬퍼 함수들
function _getSajuYear(y,m,d){
  var lc=LICHUN_TABLE_GAS[y];
  if(!lc){return (m<2||(m===2&&d<4))?y-1:y;}
  return (m<lc[0]||(m===lc[0]&&d<lc[1]))?y-1:y;
}
function _getYearGan(y){return ['庚','辛','壬','癸','甲','乙','丙','丁','戊','己'][y%10];}
function _getYearZhi(y){return ['申','酉','戌','亥','子','丑','寅','卯','辰','巳','午','未'][y%12];}
function _getMonthGan(yIdx,m){var base=(yIdx%5)*2;var g=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];return g[(base+m-1)%10];}
function _getDayGan(y,m,d){var b=new Date(1900,0,1);var t=new Date(y,m-1,d);var diff=Math.floor((t-b)/86400000);return ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'][(diff+10)%10];}
function _getDayZhi(y,m,d){var b=new Date(1900,0,1);var t=new Date(y,m-1,d);var diff=Math.floor((t-b)/86400000);return ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][(diff+10)%12];}
function _getMonthZhi(m){return ['丑','寅','卯','辰','巳','午','未','申','酉','戌','亥','子'][(m-1)%12];}
function _getHourZhi(hi){return ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][hi%12];}
function _getHourGan(dayGanIdx,hi){var base=(dayGanIdx%5)*2;var g=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];return g[(base+hi)%10];}
function _elFromGan(g){return ENERGY_EL_GAS[g]||'土';}

// ════════════════════════════════════════════════════════════════════
//  computeOhengPcts(year, month, day, hourIdx)
//  saju-engine.js computeInnateVector와 동일한 로직 (GAS 포팅)
//  반환: {wood, fire, earth, metal, water} — 각 0~100 정수 (합=100)
//  hourIdx: 0~11 (시주), null이면 시주 제외
// ════════════════════════════════════════════════════════════════════
function computeOhengPcts(year, month, day, hourIdx) {
  try {
    var y = parseInt(year), m = parseInt(month), d = parseInt(day||1);
    if(!y || !m || y<1900 || y>2099) return null; // 유효하지 않은 생년월일

    var sajuYear  = _getSajuYear(y, m, d);
    var yearGan   = _getYearGan(sajuYear);
    var yearZhi   = _getYearZhi(sajuYear);
    var yearGanIdx= Object.keys(ENERGY_EL_GAS).indexOf(yearGan);
    var monthGan  = _getMonthGan(yearGanIdx, m);
    var monthZhi  = _getMonthZhi(m);
    var dayGan    = _getDayGan(y, m, d);
    var dayZhi    = _getDayZhi(y, m, d);
    var allBranches = [yearZhi, monthZhi, dayZhi];

    var oheng = {'木':0,'火':0,'土':0,'金':0,'水':0};
    var elements = ['木','火','土','金','水'];

    // 천간 (기본 1.0, 통근 시 1.5)
    var stems = [yearGan, monthGan, dayGan];
    stems.forEach(function(stem) {
      var el = _elFromGan(stem);
      var roots = ROOTING_TABLE_GAS[stem] || [];
      var hasRoot = allBranches.some(function(b){return roots.indexOf(b)>=0;});
      oheng[el] += hasRoot ? 1.5 : 1.0;
    });

    // 지지 (월지 2.5배, 연지·일지 1.2배)
    var branches = [
      {b:yearZhi, w:1.2},
      {b:monthZhi,w:2.5},
      {b:dayZhi,  w:1.2}
    ];
    branches.forEach(function(item) {
      var ratios = BRANCH_RATIO_GAS[item.b] || [0.2,0.2,0.2,0.2,0.2];
      elements.forEach(function(el, idx){ oheng[el] += ratios[idx]*item.w; });
    });

    // 시주 (hourIdx 유효할 때만)
    if(hourIdx !== null && hourIdx !== undefined && hourIdx !== '') {
      var hi = parseInt(hourIdx);
      if(!isNaN(hi) && hi>=0 && hi<=11) {
        var dayGanIdx = Object.keys(ENERGY_EL_GAS).indexOf(dayGan);
        var hGan = _getHourGan(dayGanIdx, hi);
        var hZhi = _getHourZhi(hi);
        allBranches.push(hZhi);
        var hRoots = ROOTING_TABLE_GAS[hGan]||[];
        var hHasRoot = allBranches.some(function(b){return hRoots.indexOf(b)>=0;});
        oheng[_elFromGan(hGan)] += hHasRoot ? 1.5 : 1.0;
        var hRatios = BRANCH_RATIO_GAS[hZhi]||[0.2,0.2,0.2,0.2,0.2];
        elements.forEach(function(el,idx){ oheng[el] += hRatios[idx]*1.2; });
      }
    }

    // 비율(%) 변환
    var total = elements.reduce(function(s,e){return s+oheng[e];}, 0) || 1;
    var pcts = {
      wood:  Math.round(oheng['木']/total*100),
      fire:  Math.round(oheng['火']/total*100),
      earth: Math.round(oheng['土']/total*100),
      metal: Math.round(oheng['金']/total*100),
      water: 0
    };
    pcts.water = 100 - pcts.wood - pcts.fire - pcts.earth - pcts.metal;

    Logger.log('[oheng] ' + y+'/'+m+'/'+d + ' → 木'+pcts.wood+'% 火'+pcts.fire+'% 土'+pcts.earth+'% 金'+pcts.metal+'% 水'+pcts.water+'%');
    return pcts;
  } catch(e) {
    Logger.log('[oheng] 계산 오류: ' + e.toString());
    return null;
  }
}

// ════════════════════════════════════════════════════════════════════
//  getElPcts(data) — el_* 있으면 그대로, 없으면 생년월일로 계산
//  모든 함수에서 공통 사용하는 에너지 밸런스% 조달 함수
// ════════════════════════════════════════════════════════════════════
function getElPcts(data) {
  var w=safeNum(data.el_wood,-1), fi=safeNum(data.el_fire,-1),
      ea=safeNum(data.el_earth,-1), me=safeNum(data.el_metal,-1), wa=safeNum(data.el_water,-1);
  var sum = Math.max(0,w)+Math.max(0,fi)+Math.max(0,ea)+Math.max(0,me)+Math.max(0,wa);

  if(sum >= 90) {
    // ★ el_* 실제값 유효 — 그대로 사용
    Logger.log('[getElPcts] el_* 실제값 사용 sum='+sum);
    return {wood:w, fire:fi, earth:ea, metal:me, water:wa};
  }

  // ★ 생년월일로 직접 계산
  var by = safeNum(data.birth_year || data.birthYear || data.birthYearFull, 0);
  var bm = safeNum(data.birth_month || data.birthMonth, 0);
  var bd = 1; // 일(day) 기본값
  var bh = data.birth_hour || data.birthHour || null;
  // birthdate 파싱 (YYYYMMDD) — by/bm/bd 모두 추출
  var _bdSrc = data.birthdate || data.birth_date || '';
  if(_bdSrc) {
    var bd_str = String(_bdSrc).replace(/[^0-9]/g,'');
    if(bd_str.length>=4 && !by)  by = parseInt(bd_str.substring(0,4));
    if(bd_str.length>=6 && !bm)  bm = parseInt(bd_str.substring(4,6));
    if(bd_str.length>=8)         bd = parseInt(bd_str.substring(6,8)) || 1; // ★ day 파싱
  }

  if(by && bm) {
    var pcts = computeOhengPcts(by, bm, bd, bh);
    if(pcts) {
      Logger.log('[getElPcts] 생년월일 계산값 사용 '+by+'/'+bm);
      return pcts;
    }
  }

  // ★ 생년월일도 없으면 coreEl 기반 평균값 폴백
  var coreEl = data.coreElement || data.core_element || data.dayElement || '金';
  var fallback = {
    '木':{wood:38,fire:22,earth:15,metal:15,water:10},
    '火':{wood:20,fire:35,earth:22,metal:13,water:10},
    '土':{wood:15,fire:18,earth:35,metal:22,water:10},
    '金':{wood: 5,fire: 0,earth:30,metal:53,water:12},
    '水':{wood:20,fire:10,earth:18,metal:22,water:30}
  };
  Logger.log('[getElPcts] coreEl 폴백 사용: '+coreEl);
  return fallback[coreEl] || fallback['金'];
}

// ═══════════════════════════ END 에너지 밸런스 계산 모듈 ═══════════════════════════

function safeStr(v) { return (v !== null && v !== undefined) ? String(v) : ''; }
function safeNum(v, def) { var n = parseFloat(v); return isNaN(n) ? (def || 0) : n; }

// ────────────────────────────────────────────────────────────────────────────
// PART 2 — doPost (비동기) + doGet + logTrackingData v4.0
// ────────────────────────────────────────────────────────────────────────────

function doPost(e) {
  try {
    var raw = e && e.postData ? e.postData.getDataAsString() : '{}';
    var payload = JSON.parse(raw);
    var type = payload.type || '';
    Logger.log('[doPost] type=' + (type||'결제') + ' paymentKey=' + !!payload.paymentKey);
    Logger.log('[doPost] breakdown_innate=' + (payload.breakdown_innate ? payload.breakdown_innate.substring(0,80) : 'EMPTY'));
    Logger.log('[doPost] breakdown_kipa=' + (payload.breakdown_kipa ? 'Y' : 'EMPTY') + ' breakdown_dynamic=' + (payload.breakdown_dynamic ? 'Y' : 'EMPTY') + ' behavior_bonus=' + (payload.behavior_bonus ? 'Y' : 'EMPTY'));

    if (payload.paymentKey && payload.orderId && payload.amount) {
      // ★ v64: orderId 중복 차단 — 토스 웹훅 재시도로 인한 시트 중복 행 방지
      var cache = CacheService.getScriptCache();
      var dupKey = 'order_processed_' + payload.orderId;
      if (cache.get(dupKey)) {
        Logger.log('[doPost] ★ 중복 웹훅 차단: ' + payload.orderId);
        return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'already_processing' })).setMimeType(ContentService.MimeType.JSON);
      }
      // orderId를 즉시 캐시 — 재시도 웹훅이 와도 차단 (6시간 유지)
      cache.put(dupKey, '1', 21600);
      var trigger = ScriptApp.newTrigger('processPaymentAsync').timeBased().after(1000).create();
      cache.put('pending_' + trigger.getUniqueId(), JSON.stringify(payload), 3600);
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'processing' })).setMimeType(ContentService.MimeType.JSON);
    }
    if (type) {
      // ★ v65: 무료 유저 이메일 발송 — Claude API 호출 후 GmailApp 발송
      if (type === 'send_lite_email') {
        sendLiteEmail(payload);
        return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'lite_email_queued' })).setMimeType(ContentService.MimeType.JSON);
      }
      // ★ v67: 골든타임 구독 저장
      if (type === 'subscribe' || type === 'golden_subscribe' || type === 'monthly_subscribe') {
        saveGoldenSubscriber(payload);
        return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'subscribed' })).setMimeType(ContentService.MimeType.JSON);
      }
      logTrackingData(payload);
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'tracked', type: type })).setMimeType(ContentService.MimeType.JSON);
    }
    if (payload.email || payload.archetype) { payload.type = 'analyze'; logTrackingData(payload); }
    return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    Logger.log('[doPost] 오류: ' + err.toString());
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput('N-KAI GAS v4.1 OK').setMimeType(ContentService.MimeType.TEXT);
}

function logTrackingData(payload) {
  try {
    var ss = getLogSpreadsheet();
    if (!ss) { Logger.log('[tracking] ❌ 스프레드시트 없음'); return; }
    var type = (payload.type || 'unknown').toLowerCase();
    var sheetName = SHEET_MAP[type] || '기타트래킹';
    var sheet = getOrCreateSheet(ss, sheetName);
    var now = new Date();

    function p() {
      var args = Array.prototype.slice.call(arguments);
      var fb = '';
      if (args.length > 0 && typeof args[args.length-1] === 'string' && args[args.length-1].indexOf('__fb__') === 0) { fb = args.pop().replace('__fb__',''); }
      for (var i = 0; i < args.length; i++) { var k = args[i]; if (payload[k] !== undefined && payload[k] !== null && payload[k] !== '') return safeStr(payload[k]); }
      return fb;
    }

    var isMobileVal = payload.is_mobile || payload.isMobile || (payload.device === 'Mobile' ? 'Y' : (payload.device === 'Desktop' ? 'N' : ''));
    var coreElVal = p('coreElement','core_element','dayElement');
    var gt1='', gt2='', gt3='';
    if (payload.goldenCalendar && Array.isArray(payload.goldenCalendar)) {
      // ★ v64 FIX: goldenScore 높은 순 정렬
      var _lgc = payload.goldenCalendar.slice().sort(function(a,b){
        return ((typeof b==='object'?b.goldenScore:3)||3) - ((typeof a==='object'?a.goldenScore:3)||3);
      });
      var _lgcN = function(x){ return (typeof x==='object') ? (x.monthName||safeStr(x.month||'')) : safeStr(x); };
      gt1=_lgcN(_lgc[0]||''); gt2=_lgcN(_lgc[1]||''); gt3=_lgcN(_lgc[2]||'');
    } else if (payload.goldenTime) { gt1=safeStr(payload.goldenTime);
    } else { gt1=p('goldentime1'); gt2=p('goldentime2'); gt3=p('goldentime3'); }
    var kpi1Val=p('wealth_energy','wealthEnergy','kpi1');
    var kpi2Val=p('opportunity_score','opportunityScore','kpi2');
    var kpi3Val=p('risk_tolerance','riskTolerance','kpi3');
    var row;

    switch(sheetName) {
      case '결제기록':
        // ★ v64: orderId 중복 행 방지 — 같은 orderId 이미 시트에 있으면 적재 스킵
        if (payload.orderId) {
          try {
            var existingData = sheet.getDataRange().getValues();
            for (var ri = 1; ri < existingData.length; ri++) {
              if (existingData[ri][1] === payload.orderId) {
                Logger.log('[tracking] ★ 결제기록 중복 행 차단: ' + payload.orderId);
                return;
              }
            }
          } catch(dupErr) { Logger.log('[tracking] 중복체크 오류: ' + dupErr); }
        }
        row=[now,p('orderId','order_id'),p('email'),p('name','userName'),p('archetype'),p('nscore','n_score'),p('tier','__fb__standard'),p('amount'),p('status','__fb__완료'),p('utm_source')]; break;
      case '프리미엄이메일':
        row=[now,p('session_id','sessionId'),p('email'),p('name','userName'),p('archetype'),p('nscore','n_score'),p('result','send_result','__fb__발송'),p('path','send_path','__fb__emailjs'),p('tier','__fb__standard'),isMobileVal]; break;
      case '분석데이터':
        // ★ v65: upsert — session_id 있고 birthtime 있으면(시간입력 2차) 기존 행 업데이트, 없으면 신규 추가
        // ★ v65: 출생시 인덱스 → 시주명 변환 (시트 가독성)
        var _HOUR_LABELS = ['子시(23~01)','丑시(01~03)','寅시(03~05)','卯시(05~07)',
                            '辰시(07~09)','巳시(09~11)','午시(11~13)','未시(13~15)',
                            '申시(15~17)','酉시(17~19)','戌시(19~21)','亥시(21~23)'];
        var _rawBirthtime = p('birthtime','birth_time');
        var _birthtimeLabel = (_rawBirthtime !== '' && _rawBirthtime !== null && !isNaN(parseInt(_rawBirthtime)))
            ? (_HOUR_LABELS[parseInt(_rawBirthtime)] || _rawBirthtime)
            : _rawBirthtime;
        var _analyzeRow = [now,p('session_id','sessionId'),p('email'),p('name','userName'),p('archetype'),p('nscore','n_score','nScore'),p('ngrade','n_grade','nGrade'),kpi1Val,kpi2Val,kpi3Val,coreElVal,gt1,gt2,gt3,p('shareChannel','share_channel'),p('lang','__fb__ko'),p('birthdate','birth_date'),_birthtimeLabel,p('region'),p('gender'),p('job','occupation'),isMobileVal,p('utm_source'),p('utm_medium'),p('utm_campaign'),
          p('q1','kipa_q1'),p('q2','kipa_q2'),p('q3','kipa_q3'),p('q4','kipa_q4'),
          p('q5','kipa_q5'),p('q6','kipa_q6'),p('q7','kipa_q7'),p('q8','kipa_q8'),
          p('q9','kipa_q9'),p('q10','kipa_q10'),p('q11','kipa_q11'),p('q12','kipa_q12'),
          p('q13','kipa_q13'),p('q14','kipa_q14'),p('q15','kipa_q15'),p('q16','kipa_q16'),
          // ★ v71: 소비데이터 4개 질문 (SQ1~SQ4) — index.html 필드명 4종 호환
          p('sq1','spend_q1','spendQ1','s_q1','habit_q1','consume_q1'),
          p('sq2','spend_q2','spendQ2','s_q2','habit_q2','consume_q2'),
          p('sq3','spend_q3','spendQ3','s_q3','habit_q3','consume_q3'),
          p('sq4','spend_q4','spendQ4','s_q4','habit_q4','consume_q4'),
          p('breakdown_innate'),
          p('breakdown_kipa'),
          p('breakdown_dynamic'),
          p('behavior_bonus')
        ];
        var _sidToFind = p('session_id','sessionId');
        if (_sidToFind) {
          // ★ v69: session_id 있으면 무조건 upsert (birthtime 유무 무관)
          try {
            var _allRows = sheet.getDataRange().getValues();
            var _found = false;
            for (var _ri = 1; _ri < _allRows.length; _ri++) {
              if (String(_allRows[_ri][1]) === _sidToFind) {
                // 기존 행 업데이트 (전체 교체 — 최신 데이터로 덮어쓰기)
                sheet.getRange(_ri + 1, 1, 1, _analyzeRow.length).setValues([_analyzeRow]);
                Logger.log('[tracking] ✅ 분석데이터 upsert sid=' + _sidToFind + ' birthtime=' + _birthtimeLabel + ' nscore=' + p('nscore','n_score','nScore'));
                _found = true;
                break;
              }
            }
            if (!_found) { sheet.appendRow(_analyzeRow); Logger.log('[tracking] ✅ 신규 적재 sid=' + _sidToFind); }
          } catch(_ue) { sheet.appendRow(_analyzeRow); Logger.log('[tracking] upsert 오류, append로 폴백: ' + _ue); }
          return; // appendRow 스킵
        }
        row = _analyzeRow; break;
      case '세션트래킹':
        row=[now,p('session_id','sessionId'),p('email'),p('name','userName'),p('archetype'),p('nscore','n_score'),p('event','type'),p('duration','elapsed'),p('utm_source'),p('utm_medium'),p('utm_campaign'),isMobileVal,p('lang','__fb__ko')]; break;
      case 'UTM유입경로':
        row=[now,p('session_id','sessionId'),p('email'),p('utm_source'),p('utm_medium'),p('utm_campaign'),p('utm_term'),p('utm_content'),p('referrer'),isMobileVal]; break;
      case '퍼널트래킹':
        row=[now,p('session_id','sessionId'),p('email'),p('archetype'),p('nscore','n_score'),p('step','funnel_step'),p('event','type'),p('page','share_url','url'),p('utm_source'),p('utm_medium'),isMobileVal]; break;
      case '공유트래킹':
        row=[now,p('session_id','sessionId'),p('email'),p('name','userName'),p('archetype'),p('nscore','n_score'),p('platform','channel'),p('source','share_type'),p('utm_source'),isMobileVal]; break;
      case '추천권':
        row=[now,p('session_id','sessionId'),p('email'),p('name','userName'),p('archetype'),p('nscore','n_score'),p('ref_code','refCode','referral_code'),p('platform','channel'),p('utm_source'),isMobileVal]; break;
      case '레퍼럴트래킹':
        row=[now,p('session_id','sessionId'),p('email'),p('name','userName'),p('archetype'),p('nscore','n_score'),p('ref_code','refCode','referral_code'),p('platform','channel','ref_channel'),p('utm_source'),isMobileVal]; break;
      case '프리미엄언락':
        row=[now,p('session_id','sessionId'),p('email'),p('name','userName'),p('archetype'),p('nscore','n_score'),p('source','unlock_method','method','channel'),p('utm_source'),p('utm_medium'),isMobileVal]; break;
      case '제휴문의':
        row=[now,p('session_id','sessionId'),p('email'),p('name','userName'),p('company'),p('message','content'),p('utm_source'),isMobileVal]; break;
      case '사전예약':
        row=[now,p('email'),p('source','utm_source')]; break;
      case '채용지원':
        row=[now,p('name','userName'),p('email'),p('phone'),p('position'),p('career'),p('portfolio'),p('skills'),p('motivation'),p('resume')]; break;
      case '체험권관리':
        row=[now,p('session_id','sessionId'),p('email'),p('name','userName'),p('archetype'),p('nscore','n_score'),p('ticket_type','trial_type','platform','channel','__fb__공유체험권'),p('used','ticket_used','__fb__N'),p('expires','ticket_expires'),p('memo','note')]; break;
      case '구독신청':
        row=[now,p('session_id','sessionId'),p('email'),p('name','userName'),p('plan','tier','__fb__standard'),p('amount','price','__fb__9900'),p('utm_source'),isMobileVal]; break;
      default:
        row=[now,p('session_id','sessionId'),type,p('email'),p('name','userName'),p('archetype'),p('nscore','n_score'),p('platform','channel'),p('utm_source'),JSON.stringify({ngrade:payload.ngrade,wealth:payload.wealth_energy,mobile:isMobileVal,step:payload.step,event:payload.event,source:payload.source,ref_code:payload.ref_code||payload.refCode,action:payload.action})];
    }
    sheet.appendRow(row);
    Logger.log('[tracking] ✅ ' + sheetName + ' 적재 (' + row.length + '컬) — type=' + type + ' / ' + p('email','익명'));
  } catch(e) { Logger.log('[tracking] ❌ ' + e.toString()); }
}

function testAllTracking() {
  Logger.log('=== 전체 트래킹 시트 테스트 시작 ===');
  var tests = [
    {type:'payment',orderId:'ORDER_TEST_001',email:'j@test.com',name:'결제테스터',archetype:'ENTJ',nscore:'740',tier:'standard',amount:'9900',status:'완료',utm_source:'kakao'},
    {type:'email_send',email:'e@test.com',name:'이메일테스터',archetype:'ESTJ',nscore:'680',session_id:'s5',send_result:'성공',tier:'standard'},
    {type:'analyze',email:'a@test.com',name:'분석테스터',archetype:'ENTJ',nscore:'720',ngrade:'N3',session_id:'s1',wealth_energy:'75',opportunity_score:'70',risk_tolerance:'68',dayElement:'金',goldenCalendar:['7월','9월','11월'],shareChannel:'kakao',lang:'ko',birthdate:'19820118',birthtime:'21',region:'seoul',gender:'male',job:'entrepreneur',device:'Mobile',utm_source:'kakao',utm_medium:'share',utm_campaign:'launch',q1:'A',q2:'B',q3:'A',q4:'A',q5:'B',q6:'A',q7:'B',q8:'A',q9:'A',q10:'B',q11:'A',q12:'B',q13:'A',q14:'A',q15:'B',q16:'A'},
    {type:'session',email:'f@test.com',name:'세션테스터',archetype:'ISFJ',nscore:'660',session_id:'s6',event:'session_start',duration:'120',device:'Desktop',utm_source:'direct',lang:'ko'},
    {type:'utm',email:'g@test.com',session_id:'s7',utm_source:'instagram',utm_medium:'cpc',utm_campaign:'launch_march',utm_term:'nkai',referrer:'https://instagram.com'},
    {type:'funnel',email:'b@test.com',archetype:'INTJ',nscore:'680',session_id:'s2',step:'result',event:'view_result',page:'result',utm_source:'google'},
    {type:'share',email:'c@test.com',name:'공유테스터',archetype:'ENTP',nscore:'700',session_id:'s3',platform:'kakao',source:'free_result',utm_source:'kakao'},
    {type:'referral_ticket',email:'r@test.com',name:'추천테스터',archetype:'INFJ',nscore:'720',session_id:'s10',ref_code:'REF001',platform:'kakao',utm_source:'share'},
    {type:'referral',email:'rf@test.com',name:'레퍼럴테스터',archetype:'INFJ',nscore:'720',session_id:'s11',ref_code:'REF001',platform:'kakao'},
    {type:'premium_unlock',email:'d@test.com',name:'프리미엄테스터',archetype:'INFJ',nscore:'750',session_id:'s4',source:'share',utm_source:'instagram',utm_medium:'organic'},
    {type:'partner',email:'p@test.com',name:'제휴테스터',company:'롯데카드',message:'LoI 논의 희망',session_id:'s12',utm_source:'direct'},
    {type:'pre_reserve',email:'pr@test.com',source:'instagram'},
    {type:'ticket_use',email:'h@test.com',name:'체험권테스터',archetype:'ISFP',nscore:'580',session_id:'s8',ticket_type:'공유체험권',used:'Y',expires:'2026-04-01'},
    {type:'subscribe',email:'i@test.com',name:'구독테스터',session_id:'s9',plan:'standard',amount:'9900',utm_source:'kakao'}
  ];
  for (var i = 0; i < tests.length; i++) { logTrackingData(tests[i]); Utilities.sleep(100); }
  Logger.log('✅ 전체 트래킹 테스트 완료 — 구글 시트 각 탭 확인!');
}

// ────────────────────────────────────────────────────────────────────────────
// PART 3 — confirmTossPayment + enrichPayloadData + sendServerReport
// ────────────────────────────────────────────────────────────────────────────

function confirmTossPayment(paymentKey, orderId, amount) {
  var secretKey = CONFIG.TOSS_SECRET_KEY;
  var encoded = Utilities.base64Encode(secretKey + ':');
  var response = UrlFetchApp.fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: { 'Authorization': 'Basic ' + encoded, 'Content-Type': 'application/json' },
    payload: JSON.stringify({ paymentKey: paymentKey, orderId: orderId, amount: amount }),
    muteHttpExceptions: true
  });
  var code = response.getResponseCode();
  if (code !== 200) { Logger.log('[Toss] 결제 확인 실패 ' + code + ': ' + response.getContentText()); return null; }
  return JSON.parse(response.getContentText());
}

function enrichPayloadData(data) {
  var allSame = (data.risk1 === data.risk2 && data.risk2 === data.risk3);
  if (!data.risk1 || allSame) {
    var arch = (data.archetype || 'ENTJ').toUpperCase();
    var grpMap = {ENTJ:'항해사',ENTP:'항해사',INTJ:'항해사',INTP:'항해사',ESTJ:'분석가',ISTJ:'분석가',ESTP:'분석가',ISTP:'분석가',ENFJ:'비전가',INFJ:'비전가',ENFP:'비전가',INFP:'비전가',ESFJ:'실용주의',ISFJ:'실용주의',ESFP:'실용주의',ISFP:'실용주의'};
    var grp = grpMap[arch] || '분석가';
    var riskDB = {'항해사':{risk1:'적합',risk2:'주의',risk3:'적합',risk4:'적합',risk5:'주의',risk6:'적합'},'분석가':{risk1:'주의',risk2:'적합',risk3:'주의',risk4:'적합',risk5:'주의',risk6:'적합'},'비전가':{risk1:'적합',risk2:'주의',risk3:'적합',risk4:'보통',risk5:'보통',risk6:'적합'},'실용주의':{risk1:'보통',risk2:'적합',risk3:'보통',risk4:'적합',risk5:'주의',risk6:'보통'}};
    var r = JSON.parse(JSON.stringify(riskDB[grp] || riskDB['분석가']));
    // ★ FIX v4.1: getElPcts(data) — 3단계 자동선택
    var _epR = getElPcts(data);
    var els = {'木':_epR.wood,'火':_epR.fire,'土':_epR.earth,'金':_epR.metal,'水':_epR.water};
    var dominant = Object.keys(els).reduce(function(a,b){return els[a]>=els[b]?a:b;});
    if (dominant==='火') r.risk5='적합'; if (dominant==='土') r.risk2='적합';
    if (dominant==='水') { r.risk4='적합'; r.risk1='보통'; } if (dominant==='木') r.risk3='적합';
    for (var rk in r) { if (!data[rk] || data[rk]==='보통') data[rk] = r[rk]; }
    Logger.log('[enrichPayload] risk: ' + grp + ' / 우세=' + dominant + ' / risk1=' + r.risk1);
  }
  var allDefault = (data.compat2 === 'INFJ' && data.compat3 === 'ENFP');
  if (!data.compat1 || allDefault) {
    var compatDB = {ENTJ:['INTJ','INFJ','ENFP'],ENTP:['INTJ','INFJ','ENTJ'],INTJ:['ENTJ','ENFP','INFJ'],INTP:['ENTJ','ESTJ','INFJ'],ENFJ:['INFP','ISFP','INTJ'],INFJ:['ENFP','ENTP','INTJ'],ENFP:['INTJ','INFJ','ENFJ'],INFP:['ENFJ','ENTJ','INFJ'],ESTJ:['ISTP','INTP','ISTJ'],ISTJ:['ESTJ','ESTP','ENTJ'],ESFJ:['ISFP','INFP','ISFJ'],ISFJ:['ESFJ','ESTJ','ISFP'],ESTP:['ISTP','ISTJ','ENTJ'],ISTP:['ESTP','ESTJ','INTJ'],ESFP:['ISFP','ISFJ','ESFJ'],ISFP:['ESFP','ISFJ','INFJ']};
    var arch2 = (data.archetype || 'ENTJ').toUpperCase();
    var c = compatDB[arch2] || ['INTJ','INFJ','ENFP'];
    data.compat1 = c[0]; data.compat2 = c[1]; data.compat3 = c[2];
    Logger.log('[enrichPayload] compat: ' + arch2 + ' → ' + c.join(','));
  }
  if (!data.pf1) {
    // ★ FIX v4.1: getElPcts(data) — 3단계 자동선택
    var _epP = getElPcts(data);
    var els2 = {'木':_epP.wood,'火':_epP.fire,'土':_epP.earth,'金':_epP.metal,'水':_epP.water};
    var dom2=Object.keys(els2).reduce(function(a,b){return els2[a]>=els2[b]?a:b;});
    var pfMap={'木':['성장주·테크ETF','미국나스닥ETF','바이오·헬스케어','신흥국ETF','현금'],'火':['소비재·엔터ETF','국내성장주','테마주·모멘텀','리츠(REITs)','현금'],'土':['부동산리츠','배당주ETF','인프라펀드','채권혼합','현금'],'金':['금현물·귀금속','미국채ETF','가치주·배당','채권ETF','현금'],'水':['외환·글로벌ETF','채권·머니마켓','유동성자산','배당성장주','현금']};
    var pfs=pfMap[dom2]||pfMap['金'];
    for (var pi=0; pi<pfs.length; pi++) { if (!data['pf'+(pi+1)]) data['pf'+(pi+1)]=pfs[pi]; }
    Logger.log('[enrichPayload] pf: ' + dom2 + ' → ' + pfs[0]);
  }
  return data;
}

function sendServerReport(data) {
  try {
    var orderId = data.orderId || data.order_id || '';
    if (isDuplicatePdfSend(orderId)) { Logger.log('[sendServerReport] 중복 발송 차단: ' + orderId); return; }
    data.tier = (safeNum(data.amount || data.totalAmount) === 19900) ? 'premium' : 'standard';
    data = enrichPayloadData(data);
    Logger.log('[sendServerReport] tier=' + data.tier + ' arch=' + data.archetype + ' risk1=' + data.risk1 + ' compat1=' + data.compat1 + ' pf1=' + data.pf1);
    // ★ 소비행동 보너스 — 프론트(analysis-flow.js)에서 이미 가산 완료
  // data.nscore = 이미 소비보너스 포함된 최종값
  // GAS에서는 재계산 없이 수신된 nscore 그대로 사용
  // 단, PDF 섹션 표시용 breakdown 계산 (이중 가산 아님)
  var _sq1 = parseInt(safeStr(data.sq1||'')) || -1;
  var _sq2 = parseInt(safeStr(data.sq2||'')) || -1;
  var _sq3 = parseInt(safeStr(data.sq3||'')) || -1;
  var _sq4 = parseInt(safeStr(data.sq4||'')) || -1;
  if (_sq1 >= 0 && _sq2 >= 0 && _sq3 >= 0 && _sq4 >= 0) {
    var _bQuiz = { spending:_sq1, impulse:_sq2, windfall:_sq3, tracking:_sq4 };
    var _bBonus = computeBehaviorBonus(_bQuiz, safeStr(data.archetype||'ESTJ').toUpperCase());
    if (_bBonus && _bBonus.totalBonus > 0) {
      // ★ nscore는 건드리지 않음 — 표시용 데이터만 세팅
      data.behavior_bonus  = String(_bBonus.totalBonus);
      data.bq_health       = String(_bBonus.healthScore);
      data.bq_alignment    = String(_bBonus.alignmentBonus);
      data.bq_activation   = String(_bBonus.activationBonus);
      data.bq_resonance    = String(_bBonus.consumptionResonance);
      // 100점 만점 환산 (최대 150점 기준)
      data.bq_score100     = String(Math.round((_bBonus.totalBonus / 150) * 100));
      Logger.log('[N-KAI] 소비패턴 breakdown 세팅 — bonus:' + _bBonus.totalBonus + ' score100:' + data.bq_score100);
    }
  }
  var aiData = callClaudeAPIWithFallback(data, data.tier);
    var html = buildPdfReportHtml(data, aiData);
    sendPdfWithRetry(data, html, 3);
    logPdfSend(orderId, data);
    logTrackingData({type:'payment',orderId:orderId,email:data.email||'',name:data.name||'',archetype:data.archetype||'',nscore:data.nscore||'',tier:data.tier,amount:data.amount||data.totalAmount||'',status:'완료',utm_source:data.utm_source||''});
    Logger.log('[sendServerReport] 완료: ' + orderId);
  } catch (err) {
    Logger.log('[sendServerReport] 오류: ' + err.toString());
    try { GmailApp.sendEmail(CONFIG.ADMIN_EMAIL,'[N-KAI] PDF 발송 오류 — '+(data.orderId||''),err.toString()); } catch(e2) {}
  }
}
// ────────────────────────────────────────────────────────────────────────────
// PART 4 — Claude AI 개인화
// ────────────────────────────────────────────────────────────────────────────

function callClaudeAPIWithFallback(data, tier) {
  tier = tier || 'standard';
  var archetype = (data.archetype || 'ENTJ').toUpperCase();
  try {
    Logger.log('[AI] 1차 시도 tier=' + tier);
    var result = generateAIInterpretation(data, tier);
    if (result && result.oneline) { Logger.log('[AI] 1차 성공'); return result; }
  } catch (e1) { Logger.log('[AI] 1차 실패: ' + e1.toString()); }
  try {
    Logger.log('[AI] 2차 시도 (standard)');
    Utilities.sleep(2000);
    var result2 = generateAIInterpretation(data, 'standard');
    if (result2 && result2.oneline) { Logger.log('[AI] 2차 성공'); return result2; }
  } catch (e2) { Logger.log('[AI] 2차 실패: ' + e2.toString()); }
  Logger.log('[AI] 3차 폴백: ' + archetype);
  return getArchetypeFallbackV34(archetype, data, tier);
}

function generateAIInterpretation(data, tier) {
  tier = tier || 'standard';
  var apiKey = CONFIG.CLAUDE_API_KEY || PropertiesService.getScriptProperties().getProperty('CLAUDE_API_KEY');
  if (!apiKey) throw new Error('CLAUDE_API_KEY 미등록');
  var isPremium = (tier === 'premium');
  var prompt = isPremium ? buildPremiumPrompt(data) : buildStandardPrompt(data);
  var response = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    payload: JSON.stringify({ model: CONFIG.CLAUDE_MODEL, max_tokens: isPremium ? CONFIG.MAX_TOKENS_PRM : CONFIG.MAX_TOKENS_STD, messages: [{ role: 'user', content: prompt }] }),
    muteHttpExceptions: true
  });
  var code = response.getResponseCode();
  if (code !== 200) throw new Error('Claude API ' + code + ': ' + response.getContentText());
  var body = JSON.parse(response.getContentText());
  var raw = body.content[0].text;
  var cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  return JSON.parse(cleaned);
}

function buildStandardPrompt(data) {
  var archetype = (data.archetype || 'ENTJ').toUpperCase();
  // ★ saju-engine.js 공식 한글명 — AI 프롬프트 주입용
  var archetypeMap = {
    ENTJ:'혁신적 지휘관', ENTP:'번뜩이는 개척자', INTJ:'전략적 탐험가', INTP:'논리의 설계자',
    ESTJ:'체계적 실행자', ISTJ:'원칙의 실천가', ESTP:'실전형 돌파자', ISTP:'정밀한 관찰자',
    ENFJ:'이상적 전도사', INFJ:'내면의 항해자', ENFP:'자유로운 창조자', INFP:'가치 기반 탐색자',
    ESFJ:'안정의 조율자', ISFJ:'든든한 동반자', ESFP:'역동적 실행가', ISFP:'감성의 안내자'
  };;
  var elementMap = {'木':'목(Wood) — 성장·확장·창의 에너지','火':'화(Fire) — 열정·활력·표현 에너지','土':'토(Earth) — 안정·균형·보존 에너지','金':'금(Metal) — 결단·수렴·분석 에너지','水':'수(Water) — 지혜·유연·흐름 에너지'};
  // ★ FIX v4.1: getElPcts(data) — 3단계 자동선택
  var _ep2 = getElPcts(data);
  var els = {'木':_ep2.wood,'火':_ep2.fire,'土':_ep2.earth,'金':_ep2.metal,'水':_ep2.water};
  var dominant = Object.keys(els).reduce(function(a,b){return els[a]>=els[b]?a:b;});
  // ★ 아키타입별 톤 지시문 — Sonnet 4.6 능력 극대화
  var toneMap = {
    'Navigator': '전략적이고 결단력 있는 언어로. 숫자와 근거 중심. 리더십 강조.',
    'Analyst':   '데이터 기반의 논리적이고 정밀한 언어로. 분석적 통찰 중심.',
    'Visionary': '통찰력 있고 직관적인 언어로. 장기 흐름과 가능성 중심.',
    'Pragmatist':'따뜻하고 안정적인 언어로. 실용적 행동 지침 중심.'
  };
  var archGroupT = {ENTJ:'Navigator',ENTP:'Navigator',INTJ:'Navigator',INTP:'Navigator',ESTJ:'Analyst',ISTJ:'Analyst',ESTP:'Analyst',ISTP:'Analyst',ENFJ:'Visionary',INFJ:'Visionary',ENFP:'Visionary',INFP:'Visionary',ESFJ:'Pragmatist',ISFJ:'Pragmatist',ESFP:'Pragmatist',ISFP:'Pragmatist'};
  var toneGuide = toneMap[archGroupT[archetype]] || '전문적이고 신뢰감 있는 언어로.';
  return '당신은 N-KAI 금융 행동 패턴 분석 AI입니다. 반드시 순수 JSON만 출력. 마크다운/코드블록 없이.\n'
    + '★ 어조 지침: ' + toneGuide + '\n'
    + '★ 이름을 자연스럽게 포함하여 완전 개인화된 문장으로 작성하십시오.\n'
    + '★ 절대 금지 단어: 오행, 에너지 밸런스(내부용어), 베이지안, 아키타입, VRIO, Neural CDE, Posterior, 임계치, 수렴, 선천, 후천, 일간, 신강, 코어 에너지 강세(내부용어), 신약, 코어 에너지 약세(내부용어), 재성, 식상 — 이 단어들은 절대 사용하지 마십시오.\n'
    + '★ 중학생도 바로 이해할 수 있는 쉬운 일상어로 작성하십시오. 투자 초보자 기준.\n'
    + '★ 분석보다 행동 지침 중심: "~입니다" 보다 "~하세요" 형태로.\n\n'
    + '=== 고객 데이터 ===\n'
    + '이름: ' + (data.name||'고객') + '\n'
    + '아키타입: ' + archetype + ' (' + (archetypeMap[archetype]||archetype) + ')\n'
    + 'N-Score: ' + (data.nscore||'700') + '\n'
    + '★ 코어에너지(일간 기준): ' + (data.coreElement||'金') + ' — ' + (elementMap[data.coreElement||'金']||'') + '\n'
    + '  ※ 코어에너지는 에너지 밸런스 분포 비율과 다를 수 있습니다. 분포가 높아도 코어가 아닐 수 있습니다.\n'
    + '에너지 밸런스 분포(참고용): 木'+els['木']+'% 火'+els['火']+'% 土'+els['土']+'% 金'+els['金']+'% 水'+els['水']+'%\n'
    + '★ 분포 최다 에너지(참고): ' + dominant + ' ' + els[dominant] + '% — ' + (elementMap[dominant]||'') + '\n'
    + '  ※ PDF에서 코어에너지(' + (data.coreElement||'金') + ')를 기준으로 분석하되, 분포 최다 에너지(' + dominant + ')도 보조 참고로 활용하십시오.\n'
    + (function(){ var _ns=safeNum(data.nscore||'700');
        // ★ v71 FIX: wealth_energy/opportunity_score/risk_tolerance 필드명 완전 호환 + 하드코딩 제거
        var _k1=safeStr(data.kpi1||data.wealth_energy||data.wealthEnergy)||String(Math.min(98,Math.round(_ns/10+2)));
        var _k2=safeStr(data.kpi2||data.opportunity_score||data.opportunityScore)||String(Math.min(95,Math.round(_ns/10-2)));
        var _k3=safeStr(data.kpi3||data.risk_tolerance||data.riskTolerance)||String(Math.min(90,Math.round(_ns/10-6)));
        return 'KPI1(경제감각): '+_k1+'\nKPI2(투자기회포착): '+_k2+'\nKPI3(위기대응력): '+_k3+'\n';
      })()
    + '골든타임BEST1: ' + (data.goldentime1||'') + '\n'
    + '골든타임BEST2: ' + (data.goldentime2||'') + '\n'
    + '골든타임BEST3: ' + (data.goldentime3||'') + '\n'
    + '주의구간: ' + (data.goldentime_warn||'해당없음') + '\n'
    + '투자 리스크 적합도: 단기='+(data.risk1||'보통')+' 부동산='+(data.risk2||'보통')+' 창업='+(data.risk3||'보통')+' 장기='+(data.risk4||'보통')+' 암호화폐='+(data.risk5||'주의')+' ETF='+(data.risk6||'적합') + '\n'
    + '금융 케미스트리 Top3: ' + (data.compat1||'INTJ') + '/' + (data.compat2||'INFJ') + '/' + (data.compat3||'ENFP') + '\n'
    + (function(){
        // ★ v71: 소비데이터 4개 질문 — 값이 있을 때만 주입
        var _sq1=safeStr(data.sq1||data.spend_q1||data.spendQ1||'');
        var _sq2=safeStr(data.sq2||data.spend_q2||data.spendQ2||'');
        var _sq3=safeStr(data.sq3||data.spend_q3||data.spendQ3||'');
        var _sq4=safeStr(data.sq4||data.spend_q4||data.spendQ4||'');
        if(!_sq1&&!_sq2&&!_sq3&&!_sq4) return '';
        return '소비패턴(SQ1소비빈도:'+(_sq1||'-')+' SQ2지출방식:'+(_sq2||'-')+' SQ3저축성향:'+(_sq3||'-')+' SQ4투자경험:'+(_sq4||'-')+')\n';
      })()
    + '\n'
    + '=== JSON 12개 필드 출력 (한국어 존댓말, 투자자문 아님) ===\n'
    + '{\n'
    + '  "oneline": "금융 DNA 함축 한 문장 카피 20자 이내",\n'
    + '  "archetypeDesc": "아키타입 금융 정체성 2~3문장 — 우세 에너지(' + dominant + ') 특성 반영",\n'
    + '  "strength": "핵심 강점 2문장 — ' + dominant + ' 에너지 밸런스 관점 포함",\n'
    + '  "risk": "핵심 리스크 2문장",\n'
    + '  "strategy": "골든타임 활용 전략 2문장 — BEST1(' + (data.goldentime1||'') + ') 진입 시점 언급",\n'
    + '  "coreEnergyDesc": "코어에너지(' + (data.coreElement||'金') + ') + 우세 에너지(' + dominant + ') 금융 결정 패턴 2문장",\n'
    + '  "gt1tag": "골든타임BEST1 3~5자 태그",\n'
    + '  "gt2tag": "골든타임BEST2 3~5자 태그",\n'
    + '  "gt3tag": "골든타임BEST3 3~5자 태그",\n'
    + '  "warnDesc": "주의구간(' + (data.goldentime_warn||'해당없음') + ') 구체적 대응 전략 1~2문장",\n'
    + '  "portfolioInsight": "포트폴리오 인사이트 2문장 — ' + dominant + ' 에너지 밸런스 기반 자산군 언급",\n'
    + '  "roadmapTip": "3개월 성장 핵심 처방 1문장 — 전문용어 없이 쉽게",\n'
    + '  "todayAction": "오늘 당장 5분 이내 할 수 있는 행동 1가지. 종목명·금액·앱명 등 구체적으로",\n'
    + '  "easyDesc": "이 리포트 핵심을 한 줄로. 중학생도 이해하는 쉬운 말로"\n'
    + '}';
}

function buildPremiumPrompt(data) {
  var base = buildStandardPrompt(data);
  var ext = ',\n\n'
    + '  "scenario_up": "낙관 시나리오 2~3문장",\n'
    + '  "scenario_mid": "중립 시나리오 2~3문장",\n'
    + '  "scenario_dn": "하방 시나리오 2~3문장",\n'
    + '  "prob_up": "낙관 확률 숫자만 (합계=100)",\n'
    + '  "prob_mid": "중립 확률 숫자만",\n'
    + '  "prob_dn": "하방 확률 숫자만",\n'
    + '  "check_m1_title": "Month1 테마 5자 이내",\n'
    + '  "check_m1": "☑ 항목1<br>☑ 항목2<br>☑ 항목3<br>☑ 항목4<br>☑ 항목5",\n'
    + '  "check_m2_title": "Month2 테마 5자 이내",\n'
    + '  "check_m2": "☑ 항목1<br>☑ 항목2<br>☑ 항목3<br>☑ 항목4<br>☑ 항목5",\n'
    + '  "check_m3_title": "Month3 테마 5자 이내",\n'
    + '  "check_m3": "☑ 항목1<br>☑ 항목2<br>☑ 항목3<br>☑ 항목4<br>☑ 항목5",\n'
    + '  "hm_01": "1월 레벨(low/mid/high/best/warn)", "hm_01_score": "1월 점수(0~100)",\n'
    + '  "hm_02": "2월 레벨", "hm_02_score": "2월 점수",\n'
    + '  "hm_03": "3월 레벨", "hm_03_score": "3월 점수",\n'
    + '  "hm_04": "4월 레벨", "hm_04_score": "4월 점수",\n'
    + '  "hm_05": "5월 레벨", "hm_05_score": "5월 점수",\n'
    + '  "hm_06": "6월 레벨", "hm_06_score": "6월 점수",\n'
    + '  "hm_07": "7월 레벨", "hm_07_score": "7월 점수",\n'
    + '  "hm_08": "8월 레벨", "hm_08_score": "8월 점수",\n'
    + '  "hm_09": "9월 레벨", "hm_09_score": "9월 점수",\n'
    + '  "hm_10": "10월 레벨", "hm_10_score": "10월 점수",\n'
    + '  "hm_11": "11월 레벨", "hm_11_score": "11월 점수",\n'
    + '  "hm_12": "12월 레벨", "hm_12_score": "12월 점수",\n'
    + '  "gap_kpi1_me": "' + (safeStr(data.kpi1||data.wealth_energy||'')||String(Math.min(98,Math.round(safeNum(data.nscore||'700')/10+2))) ) + '", "gap_kpi1_top": "상위10% 벤치마크",\n'
    + '  "gap_kpi2_me": "' + (safeStr(data.kpi2||data.opportunity_score||'')||String(Math.min(95,Math.round(safeNum(data.nscore||'700')/10-2))) ) + '", "gap_kpi2_top": "상위10% 벤치마크",\n'
    + '  "gap_kpi3_me": "' + (safeStr(data.kpi3||data.risk_tolerance||'')||String(Math.min(90,Math.round(safeNum(data.nscore||'700')/10-6))) ) + '", "gap_kpi3_top": "상위10% 벤치마크",\n'
    + '  "gap_nscore_top": "상위10% N-Score 10단위 정수",\n'
    + '  "gap_gt_me": "골든타임 활용도 현재(50~85)",\n'
    + '  "gap_gt_top": "상위10% 골든타임 활용도",\n'
    + '  "gap_insight": "갭 분석 핵심 인사이트 2문장",\n'
    + '  "declaration": "금융 선언문 1~2문장 1인칭",\n'
    + '  "threshold_prob": "행동 임계치 초과 확률 소수점 2자리(예:0.73)",\n'
    + '  "kairos_score": "결제 시점 현재 월 카이로스 에너지 점수 0~100 숫자만",\n'
    + '  "kairos_month_label": "현재 월 에너지 한 단어(최강/상승/보통/낮음/주의)",\n'
    + '  "gap_prescription_1": "KPI1 경제감각 즉시 실행 처방 1문장",\n'
    + '  "gap_prescription_2": "KPI2 기회포착 즉시 실행 처방 1문장",\n'
    + '  "gap_prescription_3": "KPI3 위기대응 즉시 실행 처방 1문장",\n'
    + '  "behavior_next_1": "30일 내 가장 높은 확률의 금융 행동 예측 1문장",\n'
    + '  "behavior_next_2": "30일 내 두 번째 예측 행동 1문장",\n'
    + '  "behavior_next_3": "30일 내 세 번째 예측 행동 1문장",\n'
    + '  "behavior_prob_1": "첫번째 행동 발생 확률 소수점2자리(예:0.81)",\n'
    + '  "behavior_prob_2": "두번째 행동 발생 확률 소수점2자리(예:0.67)",\n'
    + '  "behavior_prob_3": "세번째 행동 발생 확률 소수점2자리(예:0.54)"\n'
    + '}';
  return base.replace(/\n\}$/, ext + '\n}');
}

function getArchetypeFallbackV34(archetype, data, tier) {
  var name   = data.name || '고객';
  var coreEl = safeStr(data.coreElement || data.core_element || data.dayElement || '金'); // ★ 일간 기준 — v71
  var nscore = safeNum(data.nscore || '700'); // ★ v71: nscore 먼저
  // ★ v71 FIX: wealth_energy/opportunity_score/risk_tolerance 필드명 완전 호환 + 하드코딩 '75'/'70'/'70' 제거
  var kpi1   = safeStr(data.kpi1||data.wealth_energy||data.wealthEnergy) || String(Math.min(98, Math.round(nscore/10+2)));
  var kpi2   = safeStr(data.kpi2||data.opportunity_score||data.opportunityScore) || String(Math.min(95, Math.round(nscore/10-2)));
  var kpi3   = safeStr(data.kpi3||data.risk_tolerance||data.riskTolerance) || String(Math.min(90, Math.round(nscore/10-6)));

  var T = {
    ENTJ:{oneline:'시장을 설계하는 자, 지갑이 증명한다',archetypeDesc:name+'님은 시장의 비효율을 가장 먼저 포착하고 시스템으로 전환하는 금융 설계자입니다. '+coreEl+' 에너지와 결단력 있는 실행력이 핵심입니다.',strength:'전략적 사고와 결단력. 목표 수익률을 설정하고 흔들림 없이 실행하는 능력이 최대 강점입니다.',risk:'과도한 자신감이 포지션 규모를 키워 리스크를 증폭시킵니다. 손절 기준선을 반드시 사전에 수치로 명문화하십시오.',strategy:'골든타임에 하향식 전략으로 진입하고, 주의구간에는 포지션 규모를 30% 이하로 제한하십시오.',declaration:'나는 시장이 망설일 때 결단하고, 시장이 흥분할 때 침묵한다.'},
    INTJ:{oneline:'데이터가 증명할 때까지 나는 기다린다',archetypeDesc:name+'님은 장기 전략 설계에 탁월한 금융 아키텍트입니다. '+coreEl+' 에너지 기반의 분석력이 독립적 사고와 결합되어 독보적 투자 철학을 만들어냅니다.',strength:'독립적 분석력과 장기 비전. 시장 노이즈에 흔들리지 않고 원칙을 고수하는 능력이 최대 무기입니다.',risk:'완벽주의로 인한 진입 타이밍 지연. 분석 시간을 제한하는 규칙을 만드십시오.',strategy:'연구 기반 장기 포지션을 구축하고, 골든타임에 분석 완료 후 24시간 내 실행 원칙을 채택하십시오.',declaration:'나는 시장의 소음을 차단하고 데이터만을 신뢰한다.'},
    ENTP:{oneline:'기회는 내가 먼저 본다',archetypeDesc:name+'님은 시장의 새로운 기회를 가장 빠르게 포착하는 혁신 투자자입니다. '+coreEl+' 에너지와 창의적 패턴 인식이 결합되어 한 발 앞선 포지셔닝이 가능합니다.',strength:'창의적 아이디어와 빠른 패턴 인식. 신흥 시장 흐름을 초기에 감지하는 선행 지표 탐지 능력이 강점입니다.',risk:'일관성 부족과 과도한 분산이 수익률을 낮춥니다. 아이디어당 최대 자금 비율을 사전에 제한하십시오.',strategy:'아이디어 검증 후 소규모 진입 → 검증 완료 후 단계적 확대 방식으로 리스크를 통제하십시오.',declaration:'나는 남들이 보기 전에 기회를 보고, 이미 실행한다.'},
    INTP:{oneline:'모델이 맞다면 시장은 결국 따라온다',archetypeDesc:name+'님은 논리 체계로 시장을 분석하는 금융 모델리스트입니다. '+coreEl+' 에너지와 구조적 사고가 결합되어 시장의 근본 원리를 파악하는 능력이 탁월합니다.',strength:'논리적 일관성과 객관적 분석. 감정 없이 모델 기반으로 의사결정을 내리는 능력이 강점입니다.',risk:'과도한 이론화로 실행을 미루는 패턴. 분석 완료 후 48시간 내 실행 결정을 원칙으로 삼으십시오.',strategy:'백테스트 기반 전략을 수립하고 골든타임에 모델 신호가 일치하면 즉시 실행하십시오.',declaration:'나는 감정이 아닌 논리로 결정하고, 모델이 증명한 것만 실행한다.'},
    ENFJ:{oneline:'시장의 흐름이 보이면 주저하지 않는다',archetypeDesc:name+'님은 사람과 시장의 감성적 흐름을 읽는 직관형 금융 리더입니다. '+coreEl+' 에너지와 공감 능력이 결합되어 소비 트렌드와 시장 심리를 선행 감지합니다.',strength:'시장 심리 독해와 선행 지표 감지. 소비자 행동 변화를 투자 신호로 전환하는 능력이 강점입니다.',risk:'타인의 의견에 과도하게 영향받는 경향. 최종 투자 결정은 반드시 독자적으로 내리십시오.',strategy:'소비 트렌드 선도 섹터를 중심으로 포트폴리오를 구성하고 골든타임에 비중을 높이십시오.',declaration:'나는 시장의 흐름을 읽고, 확신이 올 때 주저 없이 실행한다.'},
    INFJ:{oneline:'직관이 숫자보다 먼저 말한다',archetypeDesc:name+'님은 깊은 통찰력으로 장기 흐름을 읽는 금융 선지자입니다. '+coreEl+' 에너지와 직관이 결합되어 시장의 본질적 방향을 감지하는 능력이 뛰어납니다.',strength:'장기 흐름 독해와 위험 감지 능력. 단기 노이즈에 흔들리지 않고 본질적 가치에 집중하는 능력이 강점입니다.',risk:'단기 변동성에 과도한 감정적 반응. 주가 하락 시 원칙서를 먼저 확인하는 루틴이 필요합니다.',strategy:'ETF와 배당주 중심 안정형 포트폴리오를 기반으로 골든타임에 선별적 성장주를 추가하십시오.',declaration:'나는 시장의 본질을 읽고, 흔들림 없이 나아간다.'},
    ENFP:{oneline:'가능성이 보이면 이미 반은 이긴 것이다',archetypeDesc:name+'님은 가능성을 현실로 만드는 열정형 기회 포착자입니다. '+coreEl+' 에너지와 확장적 에너지가 결합되어 신흥 시장과 성장 자산에서 탁월한 직관을 발휘합니다.',strength:'빠른 기회 감지와 열정적 실행력. 남들이 보지 못하는 성장 가능성을 조기에 포착하는 능력이 강점입니다.',risk:'과도한 낙관주의로 리스크를 과소 평가. 진입 전 반드시 최악의 시나리오를 수치로 확인하십시오.',strategy:'성장주·테마 ETF 중심으로 포트폴리오를 구성하되 골든타임 외 구간에는 비중을 절반 이하로 유지하십시오.',declaration:'나는 가능성을 보고 결단하며, 실행이 곧 나의 언어다.'},
    INFP:{oneline:'진정한 가치는 숫자 너머에 있다',archetypeDesc:name+'님은 본질적 가치와 원칙을 중심으로 투자하는 가치 수호자입니다. '+coreEl+' 에너지와 내면 원칙이 결합되어 시장 유행에 흔들리지 않는 독자적 투자 철학을 구축합니다.',strength:'원칙 기반 투자와 장기 인내심. 가치주와 배당주에서 탁월한 성과를 보이는 유형입니다.',risk:'손실 구간에서 감정적 회피. 포지션 평가를 수치 기준으로만 하는 루틴을 만드십시오.',strategy:'ESG·배당·가치주 중심 포트폴리오를 구성하고 골든타임에 핵심 비중을 높이십시오.',declaration:'나는 가치가 있는 곳에 투자하고, 시간이 나의 편임을 안다.'},
    ESTJ:{oneline:'원칙대로 하면 반드시 이긴다',archetypeDesc:name+'님은 철저한 원칙과 시스템으로 자산을 운용하는 금융 관리자입니다. '+coreEl+' 에너지와 조직력이 결합되어 체계적인 포트폴리오 관리 능력을 만들어냅니다.',strength:'원칙 준수와 체계적 관리. 일관된 투자 루틴을 구축하고 유지하는 능력이 핵심 강점입니다.',risk:'변화하는 시장에 대한 유연성 부족. 분기별 전략 점검 루틴을 의무화하십시오.',strategy:'배당·채권·우량주 중심 포트폴리오를 구성하고 골든타임에 성장주 비중을 일시 확대하십시오.',declaration:'나는 원칙을 지키고, 시스템이 나를 대신해 수익을 만든다.'},
    ISTJ:{oneline:'검증된 것만 실행한다',archetypeDesc:name+'님은 검증된 데이터와 전통적 원칙으로 자산을 보호하는 신뢰형 투자자입니다. '+coreEl+' 에너지와 안정 지향이 결합되어 장기 복리 전략에서 탁월한 성과를 냅니다.',strength:'일관성과 신뢰성. 한번 수립된 투자 원칙을 장기간 흔들림 없이 실행하는 능력이 최대 강점입니다.',risk:'새로운 자산군에 대한 과도한 보수성. 연 1회 포트폴리오 현대화 점검을 의무화하십시오.',strategy:'인덱스+배당주 핵심으로 하고 골든타임에 소규모 성장 포지션을 추가하십시오.',declaration:'나는 검증된 원칙으로 자산을 지키고, 복리가 나의 가장 강한 무기다.'},
    ESTP:{oneline:'실행이 곧 전략이다',archetypeDesc:name+'님은 현장 감각과 빠른 실행력으로 수익을 창출하는 행동파 투자자입니다. '+coreEl+' 에너지와 즉각적 반응력이 결합되어 단기 모멘텀 포착에 탁월합니다.',strength:'즉각적인 시장 반응과 실행력. 변동성 구간에서 빠르게 포지션을 조정하는 능력이 강점입니다.',risk:'충동적 매매와 손절 원칙 부재. 진입 전 손절가와 목표가를 동시에 수치로 설정하는 원칙이 필수입니다.',strategy:'손절 기준선 사전 설정 후 단기 모멘텀을 활용하십시오. 1회 매매 최대 비중은 20%를 초과하지 마십시오.',declaration:'나는 생각하는 동안 이미 실행하고, 결과로 배운다.'},
    ISTP:{oneline:'원인을 알면 결과는 내가 만든다',archetypeDesc:name+'님은 시장 구조를 해석하고 정확한 타이밍에 실행하는 전술형 투자자입니다. '+coreEl+' 에너지와 분석적 실행력이 결합되어 기술적 분석에서 탁월합니다.',strength:'차분한 분석과 정확한 실행. 감정 없이 시장 구조를 읽고 타이밍에 집중하는 능력이 강점입니다.',risk:'과도한 자기 확신으로 인한 포지션 집중. 단일 포지션 최대 비중을 제한하는 규칙이 필요합니다.',strategy:'기술적 분석 기반 단기 포지션을 운용하고 골든타임에 중기 포지션을 병행하십시오.',declaration:'나는 시장의 구조를 읽고, 정확한 순간에만 실행한다.'},
    ESFJ:{oneline:'안정 속에서 꾸준히 쌓아간다',archetypeDesc:name+'님은 안정적인 현금 흐름과 꾸준한 복리를 추구하는 실용형 자산 관리자입니다. '+coreEl+' 에너지와 현실적 판단력이 결합되어 배당·부동산 중심 안정 자산 운용에 강점을 보입니다.',strength:'현실적 판단과 안정 우선 원칙. 과도한 리스크를 자연스럽게 회피하고 꾸준한 복리를 추구하는 성향이 강점입니다.',risk:'주변 의견에 과도하게 영향받는 경향. 투자 결정 전 72시간 숙고 원칙을 도입하십시오.',strategy:'배당주·리츠·채권 ETF 중심 포트폴리오를 기반으로 골든타임에 소규모 성장 자산을 추가하십시오.',declaration:'나는 안정을 기반으로 꾸준히 쌓아가고, 복리가 나의 가장 강력한 전략이다.'},
    ISFJ:{oneline:'안전이 최고의 수익이다',archetypeDesc:name+'님은 안정성을 최우선으로 하는 신중한 자산 보호자입니다. '+coreEl+' 에너지와 보호 본능이 결합되어 자산 보존과 꾸준한 복리 증식에 탁월합니다.',strength:'리스크 관리와 일관된 루틴. 손실 구간에서도 원칙을 지키며 장기 복리 경로를 유지하는 능력이 강점입니다.',risk:'기회 앞에서 과도한 보수성이 수익을 제한합니다. 골든타임 구간에만 한정해 소규모 공격적 포지션을 허용하십시오.',strategy:'배당+채권 안정형 포트폴리오로 꾸준한 복리를 추구하십시오.',declaration:'나는 천천히, 그러나 확실하게 자산을 쌓아간다.'},
    ESFP:{oneline:'지금 이 순간이 최고의 기회다',archetypeDesc:name+'님은 현재 시장의 에너지를 즉각적으로 포착하는 현재형 투자자입니다. '+coreEl+' 에너지와 즉흥적 감각이 결합되어 소비 트렌드와 단기 모멘텀 포착에 강합니다.',strength:'현재 시장 에너지 감지와 빠른 실행. 트렌드 초기 진입 타이밍을 직감적으로 포착하는 능력이 강점입니다.',risk:'장기 계획 없는 단기 집중. 전체 자산의 30%는 반드시 장기 포지션으로 유지하십시오.',strategy:'소비·엔터테인먼트·테마 ETF 단기 모멘텀을 활용하되 핵심 안전 자산 비중을 항상 유지하십시오.',declaration:'나는 지금 이 순간의 기회를 잡고, 빠르게 움직여 수익을 만든다.'},
    ISFP:{oneline:'내 원칙이 곧 나의 전략이다',archetypeDesc:name+'님은 자신만의 가치 기준으로 조용히 자산을 쌓아가는 독립형 투자자입니다. '+coreEl+' 에너지와 독자적 감각이 결합되어 ESG·가치 기반 투자에서 탁월한 선택력을 보입니다.',strength:'독자적 판단력과 조용한 실행력. 시장 분위기에 흔들리지 않고 자신만의 기준으로 결정하는 능력이 강점입니다.',risk:'정보 공유와 네트워크 활용 부족. 골든타임 시그널을 확인할 수 있는 정보 채널 1개를 구독하십시오.',strategy:'ESG·배당·안정 성장주를 중심으로 포트폴리오를 구성하고 골든타임에 비중을 점진적으로 높이십시오.',declaration:'나는 나의 기준을 믿고, 조용하지만 확실하게 자산을 키워간다.'}
  };;

  var t = T[archetype] || {oneline:'나만의 금융 DNA가 투자를 이끈다',archetypeDesc:archetype+'님은 고유한 금융 DNA로 자신만의 투자 철학을 구축합니다.',strength:'자신만의 투자 원칙이 장기 성과의 원동력입니다.',risk:'감정적 판단보다 데이터 기반 결정을 강화하십시오.',strategy:'골든타임 구간에 집중하고 주의구간에는 포지션을 축소하십시오.',declaration:'나는 나의 금융 DNA를 믿고, 흔들림 없이 실행한다.'};

  var base = {
    oneline:t.oneline, archetypeDesc:t.archetypeDesc, strength:t.strength, risk:t.risk, strategy:t.strategy,
    coreEnergyDesc:coreEl+' 에너지가 지배적인 '+name+'님은 금융 결정 시 분석적 접근을 선호합니다.',
    gt1tag:'J커브 전환', gt2tag:'확장 국면', gt3tag:'수렴 구간',
    warnDesc:'이 구간에는 포지션 규모를 명확히 제한하고 리스크 헤지 전략을 사전 준비하십시오.',
    portfolioInsight:'분산 포트폴리오로 리스크를 통제하며 골든타임 구간에 핵심 포지션을 강화하십시오.',
    roadmapTip:'손절 기준선을 수치로 명문화하는 것이 금융 행동력 강화의 가장 확실한 경로입니다.'
  };

  if (tier !== 'premium') return base;

  var archetypeGroupMap = {ENTJ:'Navigator',ENTP:'Navigator',INTJ:'Navigator',INTP:'Navigator',ESTJ:'Analyst',ISTJ:'Analyst',ESTP:'Analyst',ISTP:'Analyst',ENFJ:'Visionary',INFJ:'Visionary',ENFP:'Visionary',INFP:'Visionary',ESFJ:'Pragmatist',ISFJ:'Pragmatist',ESFP:'Pragmatist',ISFP:'Pragmatist'};
  function parseMonth(str) { if (!str) return 0; var m = str.match(/(\d{1,2})월/); return m ? parseInt(m[1]) : 0; }
  var gt1m=parseMonth(data.goldentime1||''), gt2m=parseMonth(data.goldentime2||''), gt3m=parseMonth(data.goldentime3||''), warnM=parseMonth(data.goldentime_warn||'');
  var nBase=nscore; var seed=(nBase*17+31)%100;
  function calcMonthLevel(m,score) {
    if(m===gt1m) return {level:'best',score:Math.min(99,85+(score%10))};
    if(m===gt2m) return {level:'high',score:Math.min(89,72+(score%12))};
    if(m===gt3m) return {level:'high',score:Math.min(84,68+(score%10))};
    if(m===warnM) return {level:'warn',score:Math.max(20,38-(score%15))};
    var base2=40+Math.round((nBase%100)*0.3); var monthSeed=(m*13+nBase*7)%35; var raw=base2+monthSeed;
    if(raw>=70) return {level:'high',score:Math.min(83,raw)};
    if(raw>=55) return {level:'mid',score:Math.min(69,raw)};
    return {level:'low',score:Math.max(30,raw)};
  }
  var hmData={};
  for(var mo=1;mo<=12;mo++){var r=calcMonthLevel(mo,seed);var key=mo<10?'0'+mo:''+mo;hmData['hm_'+key]=r.level;hmData['hm_'+key+'_score']=String(r.score);}
  var archGroup=archetypeGroupMap[archetype]||'';
  var pUp,pMid,pDn;
  if(nscore>=800){pUp=42+(nBase%8);pDn=10+(nBase%6);}
  else if(nscore>=650){pUp=33+(nBase%8);pDn=14+(nBase%7);}
  else if(nscore>=510){pUp=25+(nBase%8);pDn=20+(nBase%8);}
  else{pUp=18+(nBase%7);pDn=28+(nBase%9);}
  if(archGroup==='Navigator'||archGroup==='Analyst') pUp+=3;
  pMid=100-pUp-pDn; if(pMid<10){pMid=10;pDn=100-pUp-pMid;}
  var threshProb=(0.50+(nscore/1000)*0.38).toFixed(2);
  var topKpi1=Math.min(98,parseInt(kpi1)+8+(nBase%8)); var topKpi2=Math.min(98,parseInt(kpi2)+9+(nBase%7)); var topKpi3=Math.min(98,parseInt(kpi3)+11+(nBase%9));
  var gtMeScore=50+Math.round((nscore-400)/600*40); var gtTopScore=Math.min(95,gtMeScore+12+(nBase%8));
  var localNgrade=nscore>=900?'N1 Prime':nscore>=800?'N2 Elite':nscore>=720?'N3 High':nscore>=650?'N4 Upper-Mid':nscore>=580?'N5 Mid':nscore>=510?'N6 Lower-Mid':nscore>=440?'N7 Caution':nscore>=370?'N8 Warning':'N9 Risk';

  var extra = Object.assign({
    scenario_up:'골든타임 구간에서 핵심 포지션 진입 성공 시 N-KAI 예측 신뢰도 상승. 금융 행동력 강화 경로 개방 예상.',
    scenario_mid:'현재 행동 패턴 유지 시 안정적 성과 달성. '+localNgrade+' 상단 안정화.',
    scenario_dn:'주의구간 충동 실행 발생 시 리스크 노출. 손절 기준선 미설정이 하방 트리거.',
    prob_up:String(pUp), prob_mid:String(pMid), prob_dn:String(pDn),
    check_m1_title:archGroup==='Navigator'?'전략 설계':archGroup==='Analyst'?'데이터 기반 구축':archGroup==='Visionary'?'내면 점검':'시스템 정비',
    check_m1:archGroup==='Navigator'?'☑ 시장 진입 전략서 1페이지 작성<br>☑ 골든타임 타겟 3종 사전 선정<br>☑ 손절 기준선 수치 명문화<br>☑ 포트폴리오 전체 청산·재편 검토<br>☑ 긴급 유동성 10% 별도 확보':'☑ 보유 종목 데이터 전수 재분석<br>☑ 리스크 허용 한도 수치 설정<br>☑ 손절 기준선 알고리즘화<br>☑ 주간 데이터 점검 루틴 확립<br>☑ 포트폴리오 상관관계 측정',
    check_m2_title:archGroup==='Navigator'?'실행·돌파':archGroup==='Analyst'?'정밀 검증':archGroup==='Visionary'?'균형 조정':'효율 최적화',
    check_m2:archGroup==='Navigator'?'☑ 1순위 타겟 포지션 60% 선진입<br>☑ 빠른 피드백 루프 구축<br>☑ 단기 모멘텀 종목 2개 선별<br>☑ 주의구간 헤지 포지션 준비<br>☑ N-Score 주간 트래킹 시작':'☑ 핵심 지표 2개 집중 개선<br>☑ 블라인드 스팟 종목 재검토<br>☑ ETF 분산 진입 시작<br>☑ 퀀트 필터 조건 1개 추가<br>☑ N-Score 주간 데이터 기록',
    check_m3_title:archGroup==='Navigator'?'골든타임 점화':archGroup==='Analyst'?'임계치 돌파':archGroup==='Visionary'?'타이밍 포착':'수확·점검',
    check_m3:archGroup==='Navigator'?'☑ 골든타임 잔여 40% 추가 진입<br>☑ 모멘텀 극대화 실행<br>☑ 최적 파트너와 전략 싱크<br>☑ 익절 기준선 사전 설정<br>☑ 3개월 성과 리뷰 & 다음 전략 수립':'☑ 검증 완료 종목 결정적 진입<br>☑ 모델 정확도 셀프 검증<br>☑ 골든타임 진입 자금 30% 확보<br>☑ 익절 기준선 수치 명문화<br>☑ 분기 성과 데이터 아카이브',
    gap_kpi1_me:kpi1, gap_kpi1_top:String(topKpi1), gap_kpi2_me:kpi2, gap_kpi2_top:String(topKpi2),
    gap_kpi3_me:kpi3, gap_kpi3_top:String(topKpi3), gap_nscore_top:String(Math.min(999,Math.round((nscore+150)/10)*10)),
    gap_gt_me:String(gtMeScore), gap_gt_top:String(gtTopScore),
    gap_insight:'위기 대응력과 골든타임 활용도에서 성장 여지가 가장 큽니다.',
    declaration:t.declaration, threshold_prob:threshProb
  }, hmData);
  for (var k in extra) base[k] = extra[k];
  return base;
}

// ────────────────────────────────────────────────────────────────────────────
// PART 5 — PDF 발송 + 중복방지 + 로그 + 비동기
// ────────────────────────────────────────────────────────────────────────────

function sendPdfWithRetry(data, html, maxRetry) {
  maxRetry = maxRetry || 3;
  var email = data.email || data.customerEmail || '';
  var name  = data.name || '고객';
  var tier  = data.tier || 'standard';
  var isPremium = (tier === 'premium');
  for (var i = 1; i <= maxRetry; i++) {
    try {
      Logger.log('[PDF] ' + i + '차 시도 — ' + email);
      var blob = DriveApp.createFile('nkai_report_tmp_' + Date.now() + '.html', html, MimeType.HTML);
      var pdf  = blob.getAs(MimeType.PDF);
      pdf.setName((isPremium ? 'N-KAI_프리미엄_금융DNA리포트_' : 'N-KAI_금융DNA리포트_') + name + '.pdf');
      blob.setTrashed(true);
      var subject = isPremium ? '[N-KAI PREMIUM] ' + name + '님의 금융 DNA 완전 분석 리포트가 도착했습니다 ✦' : '[N-KAI] ' + name + '님의 금융 DNA 분석 리포트가 도착했습니다';
      var shareLink = 'https://www.neurinkairosai.com/?from=email_share&arch=' + encodeURIComponent(data.archetype||'') + '&ns=' + (data.nscore||'');
      var body = isPremium
        ? name + '님, 안녕하세요.\n\nN-KAI PREMIUM 금융 DNA 완전 분석 리포트를 첨부해 드립니다.\n\n✦ 포함 내용: 아키타입 심층분석 · N-Score · 골든타임 캘린더 · 투자 리스크 히트맵\n             행동 예측 시나리오 · 연간 카이로스 히트맵 · 상위 10% 갭 분석\n\n──────────────────────────────\n✦ 소중한 분에게 공유하기\n' + shareLink + '\n──────────────────────────────\n\n감사합니다.\n뉴린카이로스에이아이(주) N-KAI 팀\nhttps://www.neurinkairosai.com'
        : name + '님, 안녕하세요.\n\nN-KAI 금융 DNA 분석 리포트를 첨부해 드립니다.\n\nN-KAI가 고객님의 금융 행동 패턴을 정밀 분석·예측하여 생성한 완전 개인화 분석입니다.\n\n──────────────────────────────\n✦ 소중한 분에게 공유하기\n' + shareLink + '\n──────────────────────────────\n\n감사합니다.\n뉴린카이로스에이아이(주) N-KAI 팀\nhttps://www.neurinkairosai.com';
      GmailApp.sendEmail(email, subject, body, { attachments: [pdf], name: 'N-KAI 팀' });
      Logger.log('[PDF] ' + i + '차 발송 성공 → ' + email);
      return true;
    } catch (err) {
      Logger.log('[PDF] ' + i + '차 실패: ' + err.toString());
      if (i < maxRetry) Utilities.sleep(3000);
    }
  }
  Logger.log('[PDF] 최종 실패: ' + email);
  return false;
}

function isDuplicatePdfSend(orderId) {
  if (!orderId) return false;
  var cache = CacheService.getScriptCache();
  var cacheKey = 'pdfSent_' + orderId;
  if (cache.get(cacheKey)) { Logger.log('[중복방지] 캐시 차단: ' + orderId); return true; }
  try {
    var ss = getLogSpreadsheet(); if (!ss) return false;
    var logSheet = ss.getSheetByName(CONFIG.SHEET_NAME); if (!logSheet) return false;
    var lastRow = logSheet.getLastRow(); if (lastRow < 2) return false;
    var scanRows = Math.min(200, lastRow-1); var startRow = Math.max(2, lastRow-scanRows+1);
    var ids = logSheet.getRange(startRow, 1, scanRows, 1).getValues();
    for (var i = 0; i < ids.length; i++) { if (ids[i][0] === orderId) { cache.put(cacheKey,'1',86400); Logger.log('[중복방지] Sheets 차단: '+orderId); return true; } }
  } catch (e) { Logger.log('[중복방지] 오류: ' + e.toString()); }
  return false;
}

function logPdfSend(orderId, data) {
  try {
    CacheService.getScriptCache().put('pdfSent_' + orderId, '1', 86400);
    var ss = getLogSpreadsheet(); if (!ss) { Logger.log('[logPdfSend] ❌ 스프레드시트 없음'); return; }
    Logger.log('[logPdfSend] ✅ 스프레드시트 접근: ' + ss.getName());
    var logSheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (!logSheet) {
      logSheet = ss.insertSheet(CONFIG.SHEET_NAME);
      var hRow = SHEET_HEADERS['PDF발송로그'];
      logSheet.appendRow(hRow);
      var hRange = logSheet.getRange(1,1,1,hRow.length);
      hRange.setBackground('#0D1B2A'); hRange.setFontColor('#F0C674'); hRange.setFontWeight('bold');
      logSheet.setFrozenRows(1);
    }
    logSheet.appendRow([
      new Date().toLocaleString('ko-KR'), orderId, data.email||'', data.name||'',
      (data.archetype||data.mbti||''), (data.nscore||data.n_score||''),
      (data.tier||'standard'), '발송완료', 1,
      (data.coreElement||'') + ' / ' + (data.goldentime1||'')
    ]);
  } catch (e) { Logger.log('[로그] 기록 오류: ' + e.toString()); }
}

// ★ v68 FIX: retryFailedSends — 구 트리거 호환용 no-op
function retryFailedSends() {
  Logger.log('[retryFailedSends] deprecated no-op — 트리거 삭제 권장');
}
// ★ v68 진단 함수 — 전 시트 적재 테스트
function diagTestAllSheets() {
  Logger.log('=== 전 시트 적재 진단 시작 ===');
  var ss = getLogSpreadsheet();
  if (!ss) { Logger.log('❌ 스프레드시트 없음 — SPREADSHEET_ID 확인 필요'); return; }
  Logger.log('✅ 스프레드시트 연결: ' + ss.getName());

  // 1. 분석데이터 테스트
  logTrackingData({type:'analyze', email:'test@test.com', name:'진단테스터',
    archetype:'ISTJ', nscore:'691', ngrade:'N4',
    wealth_energy:'75', opportunity_score:'70', risk_tolerance:'68',
    coreElement:'金', goldentime1:'7월', goldentime2:'9월', goldentime3:'11월',
    birthdate:'19820118', birthtime:'21', region:'seoul', gender:'male', job:'business',
    lang:'ko', device:'Desktop', session_id:'DIAG_001'
  });
  Logger.log('✅ 분석데이터 적재 시도');

  // 2. 공유트래킹 테스트
  logTrackingData({type:'share', email:'test@test.com', name:'진단테스터',
    archetype:'ISTJ', nscore:'691', platform:'kakao', source:'free_result', session_id:'DIAG_001'
  });
  Logger.log('✅ 공유트래킹 적재 시도');

  // 3. 프리미엄언락 테스트
  logTrackingData({type:'premium_unlock', email:'test@test.com', name:'진단테스터',
    archetype:'ISTJ', nscore:'691', session_id:'DIAG_001', source:'share'
  });
  Logger.log('✅ 프리미엄언락 적재 시도');

  Logger.log('=== 진단 완료 — 구글시트 각 탭 확인 ===');
}



function processPaymentAsync() {
  try {
    var cache = CacheService.getScriptCache();
    var triggers = ScriptApp.getProjectTriggers();
    for (var i = 0; i < triggers.length; i++) {
      var t = triggers[i];
      if (t.getHandlerFunction() === 'processPaymentAsync') {
        var key = 'pending_' + t.getUniqueId();
        var raw = cache.get(key);
        if (raw) {
          var payload = JSON.parse(raw);
          cache.remove(key);
          ScriptApp.deleteTrigger(t);
          if (payload.paymentKey && payload.orderId && payload.amount) {
            var payment = confirmTossPayment(payload.paymentKey, payload.orderId, payload.amount);
            if (payment) {
              var data = payload;
              data.amount = payment.totalAmount;
              // ★ 이메일/이름 fallback
              data.email = payment.customerEmail || (payment.card && payment.card.email ? payment.card.email : (payload.email || payload.customerEmail || ''));
              data.name  = payment.customerName  || payload.name || payload.userName || '고객';
              // ★ 무료분석 전체 필드 fallback — index.html 결제 payload에 포함 필수
              data.archetype    = data.archetype   || data.mbti         || '';
              data.nscore       = data.nscore      || data.n_score      || '';
              data.coreElement  = data.coreElement || data.core_element || data.dayElement || data.day_element || '';
    // ★ FIX: coreElement 빈값 시 birthdate로 재계산
    if (!data.coreElement && (data.birthdate || data.birth_date)) {
      var _bd = safeStr(data.birthdate || data.birth_date).replace(/[^0-9]/g,'');
      if (_bd.length >= 8) {
        var _yr = parseInt(_bd.substring(0,4));
        var _mo = parseInt(_bd.substring(4,6));
        var _dy = parseInt(_bd.substring(6,8));
        // 천간 기준 에너지 밸런스 매핑 (갑/을→木, 병/정→火, 무/기→土, 경/신→金, 임/계→水)
        var _ganEl = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
        var _ganElMap = {'甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水'};
        // 간단 천간 계산: (년-4) % 10 → 일간은 복잡하므로 년간으로 근사
        var _ganIdx = (_yr - 4) % 10;
        if (_ganIdx < 0) _ganIdx += 10;
        data.coreElement = _ganElMap[_ganEl[_ganIdx]] || '金';
        Logger.log('[FIX] coreElement 재계산: ' + data.coreElement + ' (birthdate=' + _bd + ')');
      }
    }
              data.birth_year   = data.birth_year  || data.birthYear    || '';
              data.birth_month  = data.birth_month || data.birthMonth   || '';
              // ★ FIX S08: birthdate/birth_year 빈값 시 분석데이터 시트에서 이메일로 자동 복원
              if (!data.birthdate && !data.birth_date && !data.birth_year && data.email) {
                try {
                  var _ss2 = getLogSpreadsheet();
                  var _sh2 = _ss2 ? _ss2.getSheetByName('분석데이터') : null;
                  if (_sh2) {
                    var _rows2 = _sh2.getDataRange().getValues();
                    for (var _ri2 = _rows2.length - 1; _ri2 >= 1; _ri2--) {
                      if (safeStr(_rows2[_ri2][2]) === safeStr(data.email)) {
                        var _bdVal = safeStr(_rows2[_ri2][16]).replace(/[^0-9]/g,'');
                        if (_bdVal.length >= 8) {
                          data.birthdate  = _bdVal;
                          data.birth_date = _bdVal;
                          data.birth_year = _bdVal.substring(0,4);
                          data.birth_month= _bdVal.substring(4,6);
                          Logger.log('[S08 FIX] birthdate 복원: ' + _bdVal);
                          break;
                        }
                      }
                    }
                  }
                } catch(_be2) { Logger.log('[S08 FIX] 오류: ' + _be2); }
              }
              data.kpi1 = data.kpi1 || data.wealth_energy    || data.wealthEnergy    || data.economySense || '';
              data.kpi2 = data.kpi2 || data.opportunity_score|| data.opportunityScore || '';
              data.kpi3 = data.kpi3 || data.risk_tolerance   || data.riskTolerance   || data.crisisResponse || '';
              // ★ v71: 소비데이터 4개 필드 전달 — index.html 필드명 호환
              data.sq1 = data.sq1 || data.spend_q1 || data.spendQ1 || data.habit_q1 || '';
              data.sq2 = data.sq2 || data.spend_q2 || data.spendQ2 || data.habit_q2 || '';
              data.sq3 = data.sq3 || data.spend_q3 || data.spendQ3 || data.habit_q3 || '';
              data.sq4 = data.sq4 || data.spend_q4 || data.spendQ4 || data.habit_q4 || '';
              if (data.goldenCalendar && Array.isArray(data.goldenCalendar)) {
                // ★ v64 FIX: goldenScore 높은 순 정렬 후 상위 3개 추출
                var _gcArr = data.goldenCalendar.slice().sort(function(a,b){
                  var sa = (typeof a === 'object') ? (a.goldenScore||3) : 3;
                  var sb = (typeof b === 'object') ? (b.goldenScore||3) : 3;
                  return sb - sa;
                });
                var _gcName = function(item){ return (typeof item === 'object') ? (item.monthName || item.month || '') : safeStr(item); };
                data.goldentime1 = data.goldentime1 || _gcName(_gcArr[0]) || '';
                data.goldentime2 = data.goldentime2 || _gcName(_gcArr[1]) || '';
                data.goldentime3 = data.goldentime3 || _gcName(_gcArr[2]) || '';
              }
              data.goldentime_warn = data.goldentime_warn || '';
              data.el_wood  = data.el_wood  || ''; data.el_fire  = data.el_fire  || '';
              data.el_earth = data.el_earth || ''; data.el_metal = data.el_metal || '';
              data.el_water = data.el_water || '';
              // ★ v64: KIPA Q1~Q16 수신 처리 — index.html gasPayload에서 전달
              var kipaAnswers = [];
              for (var qi = 1; qi <= 16; qi++) {
                var qval = data['kipa_q' + qi] || '';
                kipaAnswers.push(qval);
              }
              data.kipa_answers = kipaAnswers.join(''); // e.g. "ABABBAABABABABBA"
              Logger.log('[processPaymentAsync] KIPA=' + data.kipa_answers);
              Logger.log('[processPaymentAsync] arch=' + data.archetype + ' nscore=' + data.nscore + ' el=' + data.coreElement + ' gt1=' + data.goldentime1);
              sendServerReport(data);
            }
          }
          break;
        }
        ScriptApp.deleteTrigger(t);
      }
    }
  } catch (e) { Logger.log('[async] 처리 오류: ' + e.toString()); }
}

// ────────────────────────────────────────────────────────────────────────────


// ────────────────────────────────────────────────────────────────────────────
// PART 6-A — 무료 유저 이메일 발송 (send_lite_email) v65 — CI 레드골드 적용
// ────────────────────────────────────────────────────────────────────────────

function sendLiteEmail(data) {
  try {
    var email = safeStr(data.email);
    var name  = safeStr(data.name) || '고객';
    if (!email || email.indexOf('@') < 0) { Logger.log('[sendLiteEmail] ❌ 이메일 없음'); return; }

    var arch   = safeStr(data.archetype)                          || 'ENTJ';
    var nscore = safeStr(data.nscore)                             || '580';
    var ngrade = safeStr(data.ngrade)                             || 'N5';
    var gt1    = safeStr(data.goldentime1 || data.gt1)            || '';
    var gt2    = safeStr(data.goldentime2 || data.gt2)            || '';
    var gt3    = safeStr(data.goldentime3 || data.gt3)            || '';
    var coreEl = safeStr(data.day_element || data.coreElement)    || '土';

    // ── Claude API 인사이트
    var apiKey = CONFIG.CLAUDE_API_KEY || PropertiesService.getScriptProperties().getProperty('CLAUDE_API_KEY');
    var insight = '';
    if (apiKey) {
      try {
        var prompt = name + '님은 ' + arch + ' 아키타입입니다. N-Score ' + nscore + '점(' + ngrade + '), 코어 에너지 ' + coreEl + '입니다. '
          + '골든타임 BEST는 ' + [gt1,gt2,gt3].filter(Boolean).join(', ') + '입니다. '
          + '이 분의 금융 행동 특성 1줄, 올해 핵심 전략 1줄, 골든타임 활용 조언 1줄을 한국어로 작성하세요. '
          + '각 줄은 이모지로 시작하고 30자 이내로 간결하게. JSON 없이 줄글로만.';
        var resp = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
          method:'post', muteHttpExceptions:true,
          headers:{'Content-Type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01'},
          payload:JSON.stringify({ model:CONFIG.CLAUDE_MODEL, max_tokens:300, messages:[{role:'user',content:prompt}] })
        });
        var rj = JSON.parse(resp.getContentText());
        insight = (rj.content && rj.content[0] && rj.content[0].text) ? rj.content[0].text.trim() : '';
        Logger.log('[sendLiteEmail] Claude 인사이트: ' + insight.substring(0,80));
      } catch(ce) { Logger.log('[sendLiteEmail] Claude API 오류: ' + ce); }
    }

    // 폴백
    if (!insight) {
      var fbMap = {
        ENTJ:'&#x1F3AF; &#xC2DC;&#xC7A5;&#xC744; &#xC124;&#xACC4;&#xD558;&#xB294; &#xCD94;&#xC9C4;&#xB825; &#xBCF4;&#xC720;\n&#x1F4C8; &#xACF5;&#xACA9;&#xC801; &#xC790;&#xC0B0; &#xD655;&#xC7A5; &#xAD6C;&#xAC04;\n&#x26A1; '+(gt1||'&#xC0C1;&#xBC18;&#xAE30;')+' &#xACE8;&#xB4E0;&#xD0C0;&#xC784; &#xCD5C;&#xB300; &#xD65C;&#xC6A9;',
        ENFP:'&#x2728; &#xC9C1;&#xAD00;&#xC801; &#xAE30;&#xD68C; &#xD3EC;&#xCC29; &#xB2A5;&#xB825; &#xD0C1;&#xC6D4;\n&#x1F331; &#xB2E4;&#xAC01;&#xD654; &#xD3EC;&#xD2B8;&#xD3F4;&#xB9AC;&#xC624; &#xAD6C;&#xC131; &#xCD5C;&#xC801;&#xAE30;\n&#x26A1; '+(gt1||'&#xC0C1;&#xBC18;&#xAE30;')+' &#xC5D0;&#xB108;&#xC9C0; &#xCD5C;&#xACE0;&#xC870;',
        INFP:'&#x1F4AB; &#xAC00;&#xCE58; &#xAE30;&#xBC18; &#xD22C;&#xC790;&#xB85C; &#xC7A5;&#xAE30; &#xC131;&#xACFC;\n&#x1F33F; &#xC548;&#xC815;&#xC801; &#xC801;&#xB9BD;&#xC2DD; &#xC804;&#xB7B5; &#xAD8C;&#xC7A5;\n&#x26A1; '+(gt1||'&#xC0C1;&#xBC18;&#xAE30;')+' &#xC2E0;&#xC911;&#xD55C; &#xC9C4;&#xC785; &#xC720;&#xB9AC;',
        ISFP:'&#x1F3A8; &#xAC10;&#xC131;&#xC801; &#xD310;&#xB2E8;&#xB825;&#xACFC; &#xC548;&#xC815; &#xCD94;&#xAD6C;\n&#x1F4BC; &#xBD84;&#xC0B0; &#xD22C;&#xC790;&#xB85C; &#xB9AC;&#xC2A4;&#xD06C; &#xCD5C;&#xC18C;&#xD654;\n&#x26A1; '+(gt1||'&#xC0C1;&#xBC18;&#xAE30;')+' &#xACE8;&#xB4E0;&#xD0C0;&#xC784; &#xD65C;&#xC6A9;'
      };
      insight = fbMap[arch] || ('&#x1F9EC; '+arch+' &#xAE08;&#xC735; DNA &#xBD84;&#xC11D; &#xC644;&#xB8CC;\n&#x1F4CA; N-Score '+nscore+'&#xC810; &#x2014; '+ngrade+' &#xB4F1;&#xAE09;\n&#x26A1; '+(gt1||'&#xC62C;&#xD574;')+' &#xACE8;&#xB4E0;&#xD0C0;&#xC784; &#xCD5C;&#xB300; &#xD65C;&#xC6A9; &#xAD8C;&#xC7A5;');
    }

    // 골든타임 뱃지 (CI 레드골드 계열)
    var gtArr = [gt1,gt2,gt3].filter(Boolean);
    var gtColors = ['linear-gradient(135deg,#c9a84c,#e8d48b)','linear-gradient(135deg,#8A8A9A,#B0B0C0)','linear-gradient(135deg,#8B6914,#C49A2A)'];
    var gtTextColors = ['#0A0E1A','#0A0E1A','#fff'];
    var gtMedals = ['&#x1F947;','&#x1F948;','&#x1F949;'];
    var gtStr = gtArr.map(function(m,i){
      return '<span style="display:inline-block;background:'+gtColors[i]+';color:'+gtTextColors[i]+';padding:5px 14px;border-radius:20px;font-weight:800;font-size:13px;margin:2px 3px;">'+gtMedals[i]+' '+m+'</span>';
    }).join('');

    // ★ 이모지 → HTML 엔티티 변환 (GmailApp UTF-8 보조평면 깨짐 방지)
    insight = insight.replace(/[\u{10000}-\u{10FFFF}]/gu, function(c){
      var cp = c.codePointAt(0);
      return '&#x' + cp.toString(16) + ';';
    });
    var insightLines = insight.split('\n').filter(Boolean).map(function(l){
      return '<div style="padding:8px 0;border-bottom:1px solid rgba(201,168,76,0.1);font-size:13px;color:#C8D0E0;line-height:1.5;">'+l+'</div>';
    }).join('');

    // ── HTML 빌드 (CI 레드골드 #c9a84c ~ #e8d48b)
    var html = '<!DOCTYPE html><html lang="ko"><head>'
      + '<meta charset="UTF-8"><meta http-equiv="Content-Type" content="text/html; charset=UTF-8">'
      + '</head><body style="margin:0;padding:0;background:#0A0E1A;font-family:\'Apple SD Gothic Neo\',\'Malgun Gothic\',sans-serif;">'
      + '<div style="max-width:520px;margin:0 auto;padding:32px 20px;">'
      // 로고
      + '<div style="text-align:center;margin-bottom:28px;">'
      + '<div style="font-size:22px;font-weight:900;background:linear-gradient(135deg,#c9a84c,#e8d48b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:4px;">N&#xB7;KAI</div>'
      + '<p style="color:#6B7A99;font-size:11px;margin:4px 0 0;">뉴린카이로스에이아이 | AI 금융 행동 분석</p>'
      + '</div>'
      // 헤더카드 (CI 골드 테두리)
      + '<div style="background:linear-gradient(135deg,#0F1524,#0D1420);border:1px solid rgba(201,168,76,0.35);border-radius:16px;padding:28px;margin-bottom:16px;text-align:center;">'
      + '<p style="color:#8A95AB;font-size:12px;margin:0 0 10px;">'+name+'&#xB2D8;&#xC758; &#xAE08;&#xC735; DNA &#xBD84;&#xC11D; &#xACB0;&#xACFC;</p>'
      + '<div style="font-size:36px;font-weight:900;background:linear-gradient(135deg,#c9a84c,#e8d48b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:3px;">'+arch+'</div>'
      + '<div style="color:#c9a84c;font-size:13px;margin-top:8px;font-weight:600;">N-Score '+nscore+'&#xC810; &#xB7; '+ngrade+' &#xB4F1;&#xAE09;</div>'
      + '</div>'
      // 골든타임 (CI 골드 포인트)
      + (gtStr ? '<div style="background:#0F1524;border:1px solid rgba(201,168,76,0.2);border-radius:12px;padding:16px;margin-bottom:16px;">'
        + '<div style="color:#c9a84c;font-size:11px;font-weight:700;letter-spacing:1.5px;margin-bottom:12px;">&#x26A1; 2026 &#xACE8;&#xB4E0;&#xD0C0;&#xC784; BEST</div>'
        + '<div>'+gtStr+'</div></div>' : '')
      // AI 인사이트 (CI 골드 상단 포인트 라인)
      + '<div style="background:#0F1524;border:1px solid rgba(201,168,76,0.12);border-top:2px solid #c9a84c;border-radius:12px;padding:18px;margin-bottom:20px;">'
      + '<div style="color:#c9a84c;font-size:11px;font-weight:700;letter-spacing:1.5px;margin-bottom:12px;">&#x1F9EC; AI &#xB9DE;&#xCDA4; &#xC778;&#xC0AC;&#xC774;&#xD2B8;</div>'
      + insightLines + '</div>'
      // CTA (CI 레드골드 버튼)
      + '<div style="text-align:center;">'
      + '<a href="https://www.neurinkairosai.com/?utm_source=lite_email&utm_medium=email&utm_campaign=free_result" '
      + 'style="display:inline-block;background:linear-gradient(135deg,#c9a84c,#e8d48b);color:#0A0E1A;text-decoration:none;'
      + 'padding:16px 36px;border-radius:12px;font-weight:900;font-size:14px;letter-spacing:0.5px;">&#x1F4CA; &#xD480; &#xB9AC;&#xD3EC;&#xD2B8; &#xD655;&#xC778;&#xD558;&#xAE30; (&#x20A9;9,900)</a>'
      + '</div>'
      // 푸터
      + '<p style="text-align:center;color:#3D4B66;font-size:10px;margin-top:24px;line-height:1.8;">'
      + '무수신 및 문의: <a href="mailto:support@neurinkairosai.com" style="color:#c9a84c;">support@neurinkairosai.com</a><br>'
      + '뉴린카이로스에이아이 주식회사 | '
      + '<a href="https://www.neurinkairosai.com/privacy.html" style="color:#3D4B66;">개인정보처리방침</a>'
      + '</p></div></body></html>';

    GmailApp.sendEmail(email,
      '[N-KAI] ' + name + '님의 금융 DNA — ' + arch + ' · N-Score ' + nscore + '점',
      '이메일 클라이언트가 HTML을 지원하지 않습니다.',
      { htmlBody: html, name: 'N-KAI 팀', replyTo: 'support@neurinkairosai.com', charset: 'UTF-8' }
    );
    Logger.log('[sendLiteEmail] ✅ 발송 완료 → ' + email + ' / ' + arch + ' / ' + nscore);

    logTrackingData({ type:'premium_email', email:email, name:name, archetype:arch, nscore:nscore,
      result:'발송', path:'gas_lite', tier:'free',
      is_mobile: (data.device === 'Mobile' ? 'Y' : 'N') });

  } catch(e) { Logger.log('[sendLiteEmail] ❌ 오류: ' + e.toString()); }
}

function forceSendLiteEmailTest() {
  sendLiteEmail({ email:'sogood2172@gmail.com', name:'이원재', archetype:'ENFP', nscore:'726', ngrade:'N3',
    day_element:'金', goldentime1:'9월', goldentime2:'11월', goldentime3:'3월',
    wealth_energy:'78', opportunity_score:'72', risk_tolerance:'68', device:'Mobile' });
  Logger.log('[forceSendLiteEmailTest] 완료');
}

function forceSendPdfTest() {
  var testData = {
    name:'이원재', email:'sogood2172@gmail.com', archetype:'ESTJ', nscore:'726', coreElement:'金',
    birthdate:'19820118', birth_year:1982, birth_month:1, kpi1:'78', kpi2:'72', kpi3:'68',
    goldentime1:'2026년 7월', goldentime2:'2026년 9월', goldentime3:'2027년 2월', goldentime_warn:'2026년 6월',
    pf1:'금현물·귀금속', pf2:'미국채ETF', pf3:'가치주·배당', pf4:'채권ETF', pf5:'현금',
    risk1:'적합', risk2:'주의', risk3:'적합', risk4:'보통', risk5:'주의', risk6:'적합',
    compat1:'INTJ', compat2:'ISTJ', compat3:'INFJ',
    // ★ FIX v4.1: 辛金 극강금국 실제값
    el_wood:'5', el_fire:'0', el_earth:'30', el_metal:'53', el_water:'12',
    orderId:'TEST_STD_' + Date.now(), amount:9900, tier:'standard',
    // ★ 소비행동 4가지 테스트값 (Architect 기준)
    // spending: 0=소액자주 1=중간균형 2=계획지출 3=목표저축 4=상황대응
    // impulse:  0=충동없음 1=가끔 2=보통 3=자주
    // windfall: 0=즉시저축 1=투자활용 2=일부소비 3=소비우선 4=상황판단
    // tracking: 0=매일체크 1=주1회 2=월1회 3=거의안함
    sq1: '3',  // 목표 저축형
    sq2: '0',  // 충동 없음
    sq3: '1',  // 투자 활용
    sq4: '0',  // 매일 체크
    // ★ breakdown 데이터 (PDF S02b 산출 근거 섹션용)
    breakdown_innate:  JSON.stringify({dayElement:'庚', strengthType:'신강', strengthIndex:0.15, wealthScore:0.35, expressionScore:0.28, ohengScore:{木:10,火:15,土:20,金:25,水:30}, precision:'high'}),
    breakdown_kipa:    JSON.stringify({ei:'E', ns:'S', tf:'T', jp:'J', vBehavior:{EI:0.6, NS:-0.4, TF:0.7, JP:-0.3}}),
    breakdown_dynamic: JSON.stringify({archetypeCode:'ESTJ', vFused:{EI:0.48, NS:-0.32, TF:0.56, JP:-0.24}, calibration:'v4.0_50-35-15'}),
    behavior_bonus_raw: JSON.stringify({totalBonus:78, healthScore:35, alignmentBonus:28, activationBonus:15})
  };
  Logger.log('[TEST] 시작 — tier=' + testData.tier);
  var aiData = callClaudeAPIWithFallback(testData, testData.tier);
  var html = buildPdfReportHtml(testData, aiData);
  Logger.log('[TEST] HTML 생성 완료: ' + html.length + '자');
  var result = sendPdfWithRetry(testData, html, 3);
  Logger.log('[TEST] 발송 결과: ' + (result ? '✅ 성공' : '❌ 실패'));
}

function forceSendPdfTestPremium() {
  var testData = {
    name:'이원재', email:'sogood2172@gmail.com', archetype:'ESTJ', nscore:'726', coreElement:'金',
    birth_year:1982, birth_month:1, kpi1:'78', kpi2:'72', kpi3:'68', birthdate:'19820118',
    // ★ sq1~sq4 소비행동 패턴 (Architect 기준)
    sq1:'3', sq2:'0', sq3:'1', sq4:'0',
    goldentime1:'2026년 8월', goldentime2:'2026년 10월', goldentime3:'2027년 1월', goldentime_warn:'2026년 6월',
    pf1:'미국성장ETF', pf2:'나스닥ETF', pf3:'금현물', pf4:'채권ETF', pf5:'현금',
    risk1:'적합', risk2:'적합', risk3:'주의', risk4:'적합', risk5:'보통', risk6:'적합',
    compat1:'ENTJ', compat2:'INFJ', compat3:'ISTJ',
    el_wood:'10', el_fire:'15', el_earth:'20', el_metal:'25', el_water:'30',
    // ★ breakdown 데이터 (PDF S02b 산출 근거 섹션용)
    // analysis-flow.js 실제 출력 형식과 동일
    breakdown_innate:  JSON.stringify({dayElement:'庚', strengthType:'신강', strengthIndex:0.15, wealthScore:0.35, expressionScore:0.28, ohengScore:{木:10,火:15,土:20,金:25,水:30}, precision:'high'}),
    breakdown_kipa:    JSON.stringify({ei:'E', ns:'S', tf:'T', jp:'J', vBehavior:{EI:0.6, NS:-0.4, TF:0.7, JP:-0.3}}),
    breakdown_dynamic: JSON.stringify({archetypeCode:'ESTJ', vFused:{EI:0.48, NS:-0.32, TF:0.56, JP:-0.24}, calibration:'v4.0_50-35-15'}),
    behavior_bonus_raw: JSON.stringify({totalBonus:78, healthScore:35, alignmentBonus:28, activationBonus:15}),
    orderId:'TEST_PRM_' + Date.now(), amount:19900, tier:'premium'
  };
  Logger.log('[PREMIUM TEST] 시작');
  var aiData = callClaudeAPIWithFallback(testData, 'premium');
  var html = buildPdfReportHtml(testData, aiData);
  var result = sendPdfWithRetry(testData, html, 3);
  Logger.log('[PREMIUM TEST] 발송: ' + (result ? '✅ 성공' : '❌ 실패'));
}

// ────────────────────────────────────────────────────────────────────────────
// ★ 수동 재발송: forceSendPdfByEmail('이메일주소') — Apps Script에서 직접 실행
// ────────────────────────────────────────────────────────────────────────────
// ★ 박문옥 형님 재발송 — 드롭다운에서 선택 후 바로 실행
function resendMunok() {
  forceSendPdfByEmail('himunog1178@naver.com');
}

function forceSendPdfByEmail(targetEmail) {
  try {
    var ss = getLogSpreadsheet();
    // 1. 결제기록 탭에서 이메일로 결제 데이터 찾기
    var paySheet = ss.getSheetByName('결제기록');
    var payRows = paySheet ? paySheet.getDataRange().getValues() : [];
    var payData = null;
    for (var i = payRows.length - 1; i >= 1; i--) {
      if (safeStr(payRows[i][2]) === targetEmail) {
        payData = payRows[i];
        break;
      }
    }
    if (!payData) { Logger.log('[재발송] 결제기록 없음: ' + targetEmail); return; }

    // 2. 분석데이터 탭에서 추가 데이터 보완
    var anaSheet = ss.getSheetByName('분석데이터');
    var anaRows = anaSheet ? anaSheet.getDataRange().getValues() : [];
    var anaData = null;
    for (var j = anaRows.length - 1; j >= 1; j--) {
      if (safeStr(anaRows[j][2]) === targetEmail) {
        anaData = anaRows[j];
        break;
      }
    }

    // 3. data 객체 구성
    var data = {
      email:       targetEmail,
      name:        safeStr(payData[3]) || '고객',
      archetype:   safeStr(payData[4]) || 'ENTJ',
      nscore:      safeStr(payData[5]) || '700',
      tier:        safeStr(payData[6]) || 'standard',
      amount:      safeStr(payData[7]) || '9900',
      orderId:     safeStr(payData[1]) || ('RESEND-' + Date.now()),
      lang:        'ko'
    };

    // 분석데이터에서 보완
    if (anaData) {
      data.coreElement  = safeStr(anaData[10]) || '';
      data.goldentime1  = safeStr(anaData[11]) || '';
      data.goldentime2  = safeStr(anaData[12]) || '';
      data.goldentime3  = safeStr(anaData[13]) || '';
      data.birthdate    = safeStr(anaData[16]).replace(/[^0-9]/g,'') || '';
      data.birth_date   = data.birthdate;
      data.birth_year   = data.birthdate.length >= 4 ? parseInt(data.birthdate.substring(0,4), 10) : 0;
      data.birth_month  = data.birthdate.length >= 6 ? parseInt(data.birthdate.substring(4,6), 10) : 0;
      data.gender       = safeStr(anaData[19]) || '';
      data.region       = safeStr(anaData[18]) || '';
      data.wealth_energy     = safeStr(anaData[7]) || '';
      data.opportunity_score = safeStr(anaData[8]) || '';
      data.risk_tolerance    = safeStr(anaData[9]) || '';
      // ★ breakdown 4개 컬럼 (인덱스 45~48) — PDF S02b 산출 근거용
      data.breakdown_innate  = safeStr(anaData[45]) || '';
      data.breakdown_kipa    = safeStr(anaData[46]) || '';
      data.breakdown_dynamic = safeStr(anaData[47]) || '';
      data.behavior_bonus_raw = safeStr(anaData[48]) || '';
    }

    // 4. 중복 방지 해제 후 재발송
    data.orderId = 'RESEND-' + Date.now();
    data = enrichPayloadData(data);
    var aiData = callClaudeAPIWithFallback(data, data.tier);
    var html = buildPdfReportHtml(data, aiData);
    var result = sendPdfWithRetry(data, html, 3);
    Logger.log('[재발송] ' + targetEmail + ' → ' + (result ? '✅ 성공' : '❌ 실패'));
  } catch(e) {
    Logger.log('[재발송] 오류: ' + e.toString());
  }
}


function setupAndTest() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var id = ss.getId();
    PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', id);
    Logger.log('✅ SPREADSHEET_ID 자동 저장 완료: ' + id);
    Logger.log('✅ 시트 이름: ' + ss.getName());
  } catch(e) { Logger.log('❌ 시트 자동 연결 실패: ' + e.toString()); return; }
  logPdfSend('SETUP-TEST-' + Date.now(), {email:'test@neurinkairosai.com',name:'자동설정테스트',archetype:'ENTJ',nscore:'750',tier:'standard',coreElement:'金',goldentime1:'3월'});
  Logger.log('✅ 테스트 행 적재 완료 — 구글시트 PDF발송로그 탭 확인!');
}

// ★ 추천권 테스트 함수
// ★ 재민형 리포트 재발송 함수 (수정본 재발송 — 재결제 불필요)
function resendJaemin() {
  var testData = {
    email: 'machaii8001@naver.com',
    name: '최재민',
    archetype: 'ENFP',
    nscore: '595',
    ngrade: 'N5 Mid',
    tier: 'premium',
    birthdate: '19700515',
    birth_date: '19700515',
    coreElement: '木',       // ★ 일간(日干) 기준 — 분포 dominant 덮어쓰기 금지
    dayElement: '木',
    el_wood: '17', el_fire: '18', el_earth: '22', el_metal: '34', el_water: '9',
    // ★ v71 FIX: 실제 KPI 값 반영 (시트 확인: 96/69/35)
    wealth_energy: '96',
    opportunity_score: '69',
    risk_tolerance: '35',
    kpi1: '96', kpi2: '69', kpi3: '35',
    goldenCalendar: ['11월','12월','2월'],
    goldentime1: '11월', goldentime2: '12월', goldentime3: '2월',
    birthtime: '7',  // ★ 07시(辰시) — 실제 출생시
    lang: 'ko',
    region: 'seoul',
    gender: 'male',
    q1:'A',q2:'A',q3:'B',q4:'B',q5:'B',q6:'A',q7:'B',q8:'A',
    q9:'A',q10:'A',q11:'B',q12:'B',q13:'A',q14:'B',q15:'B',q16:'B'
  };
  Logger.log('[재민형 재발송] 시작 — ' + testData.email);
  var aiData = callClaudeAPIWithFallback(testData, 'premium');
  var html = buildPdfReportHtml(testData, aiData);
  var result = sendPdfWithRetry(testData, html, 3);
  Logger.log('[재민형 재발송] 결과: ' + JSON.stringify(result));
}

function testReferralTicket() {
  var testPayload = {
    type: 'referral_ticket',
    action: 'referral_ticket',
    sub_action: 'referral_ticket',
    platform: 'kakao',
    channel: 'kakao',
    timestamp: new Date().toISOString(),
    session_id: 'test_session_' + Date.now(),
    email: 'sogood2172@gmail.com',
    name: '이원재',
    refCode: 'TEST_REF_001',
    archetype: 'ESTJ',
    nscore: 652,
    n_score: 652,
    ngrade: 'N4',
    device: 'Desktop',
    share_url: 'https://www.neurinkairosai.com',
    source: 'free_result'
  };
  // doPost 대신 logTrackingData 직접 호출 (GAS 직접 실행 호환)
  logTrackingData(testPayload);
  Logger.log('✅ 추천권 테스트 완료 — 구글시트 추천권 탭 확인!');
}

function diagnoseSheetsConnection() {
  Logger.log('=== DB 적재 진단 시작 ===');
  var sid = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  Logger.log('[1] SPREADSHEET_ID: ' + (sid ? '✅ ' + sid : '❌ 미설정'));
  var ss = getLogSpreadsheet();
  if (!ss) { Logger.log('[2] ❌ 스프레드시트 접근 실패'); return; }
  Logger.log('[2] ✅ 스프레드시트 접근 성공: ' + ss.getName());
  var sheet = ss.getSheetByName('PDF발송로그');
  if (!sheet) { Logger.log('[3] ⚠️ PDF발송로그 시트 없음 — 새로 생성됩니다'); }
  else { Logger.log('[3] ✅ PDF발송로그 시트 존재, 현재 행수: ' + sheet.getLastRow()); }
  logPdfSend('TEST-' + Date.now(), {email:'test@test.com',name:'진단테스트',archetype:'ENTJ',nscore:'750',tier:'standard',coreElement:'金',goldentime1:'3월'});
  Logger.log('[4] ✅ 테스트 행 적재 완료 — 시트 확인하세요');
}

// ────────────────────────────────────────────────────────────────────────────
// PART 7 — buildPdfReportHtml v41 (아래 합체)
// ────────────────────────────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════
//  N-KAI GAS — buildPdfReportHtml() v41 PATCH
//  6개 섹션 복원: S02·S03·S05·S08·S09·S10
//  기존 Code.gs의 buildPdfReportHtml 함수 전체를 이 파일로 교체하십시오.
//  다른 함수(doPost, CONFIG, sendPdfWithRetry 등)는 수정하지 마십시오.
// ════════════════════════════════════════════════════════════════════

function buildPdfReportHtml(data, aiData) {

  // ── 안전 헬퍼 (로컬 재선언 — 스코프 안전)
  function ss(v) { return (v === null || v === undefined) ? '' : String(v); }
  function sn(v, d) { var n = parseFloat(v); return isNaN(n) ? (d || 0) : n; }

  // ── 기본 변수
  var name      = ss(data.name) || '회원';
  var archetype = (ss(data.archetype) || 'ENTJ').toUpperCase();
  var _kakaoBase = 'https://www.neurinkairosai.com/?from=pdf_kakao&arch=' + archetype + '&utm_source=pdf&utm_medium=kakao&utm_campaign=std_share';
  var kakaoShareUrl = 'https://open.kakao.com/o/g1V5zAii';
  var nscore    = sn(data.nscore, 700);
  var coreEl    = ss(data.coreElement) || ss(data.core_element) || ss(data.dayElement) || '金'; // ★ 3종 필드명 호환
  // ★ v63: coreElement = 일간(日干) 기준 — el_* 최다값으로 덮어쓰기 금지
  // coreElement는 일간에서 결정. el_* 분포와 달라도 일간 우선.
  // ── 생년월일 — 프론트 필드명 5종 완전 호환
  // 지원: birth_year/birthYear/birthYearFull + birth_month/birthMonth + birthdate(YYYYMMDD)/birth_date
  // ★ FIX: birth_year/month → birthdate 순서로 파싱. 유효 범위 검증 강화
  var bYear  = sn(data.birth_year  || data.birthYear  || data.birthYearFull, 0);
  var bMonth = sn(data.birth_month || data.birthMonth, 0);
  // birthdate = "19820118" 또는 "1982-01-18" 형태 파싱
  if ((!bYear || !bMonth) && (data.birthdate || data.birth_date)) {
    var bd = safeStr(data.birthdate || data.birth_date).replace(/[^0-9]/g, '');
    if (bd.length >= 6) {
      if (!bYear)  bYear  = sn(bd.substring(0, 4), 0);
      if (!bMonth) bMonth = sn(bd.substring(4, 6), 0);
    }
  }
  // ★ FIX: bYear 유효 범위 검증 (19820118 전체가 들어오면 재파싱)
  if (bYear && (bYear < 1900 || bYear > 2015)) {
    var _bdRaw = safeStr(data.birthdate || data.birth_date || '').replace(/[^0-9]/g,'');
    if (_bdRaw.length >= 4) { var _byTmp = parseInt(_bdRaw.substring(0,4)); if(_byTmp >= 1900 && _byTmp <= 2015) bYear = _byTmp; else bYear = 0; }
    else bYear = 0;
  }
  if (!bYear || bYear < 1900 || bYear > 2015)  bYear  = 0;
  if (!bMonth || bMonth < 1 || bMonth > 12) bMonth = 0;
  var tier      = ss(data.tier) || 'standard';
  var today     = ss(data.report_date) || (function(){
    var _d = new Date(); 
    return _d.getFullYear() + '. ' + (_d.getMonth()+1) + '. ' + _d.getDate() + '.';
  })();

  // ★ v62: 지금 당장 1가지 — 16아키타입 × 5코어에너지 × 3골든타임 완전 개인화
  var _nowMonth = new Date().getMonth() + 1;
  var _gt1Raw   = ss(data.goldentime1) || '';
  // ★ v63 FIX: "2026년 7월" → 월(月)만 추출. parseInt 전체 적용시 "20267" 오파싱 방지
  var _gt1Num   = (function(s){ var m=s.match(/(\d{1,2})월/); return m?parseInt(m[1]):0; })(_gt1Raw);
  var _gt2Num   = (function(s){ var m=s.match(/(\d{1,2})월/); return m?parseInt(m[1]):0; })(ss(data.goldentime2)||'');
  var _gt3Num   = (function(s){ var m=s.match(/(\d{1,2})월/); return m?parseInt(m[1]):0; })(ss(data.goldentime3)||'');
  var _warnNum  = (function(s){ var m=s.match(/(\d{1,2})월/); return m?parseInt(m[1]):0; })(ss(data.goldentime_warn)||'');
  var _daysToGt1 = _gt1Num >= _nowMonth ? _gt1Num - _nowMonth : (12 - _nowMonth + _gt1Num);

  // ── 골든타임 상태 판별 (3구간)
  var _gtState = 'prepare'; // 기본: 준비구간
  if (_nowMonth === _gt1Num) _gtState = 'enter1';
  else if (_nowMonth === _gt2Num || _nowMonth === _gt3Num) _gtState = 'enter2';
  else if (_nowMonth === _warnNum) _gtState = 'caution';
  else if (_daysToGt1 <= 2) _gtState = 'soon';

  // ── 아키타입별 핵심 성향 키워드 (개인화 문장 재료)
  var _archProfile = {
    ENTJ: {verb:'전략을 수립하고', trait:'결단력이 강점', risk:'과속 진입 주의'},
    INTJ: {verb:'데이터를 검증하고', trait:'분석 후 확신 진입', risk:'진입 지연 주의'},
    ENTP: {verb:'아이디어를 검증하고', trait:'혁신적 발굴이 강점', risk:'분산 과다 주의'},
    INTP: {verb:'논리적으로 계산하고', trait:'시스템 설계가 강점', risk:'실행 미루기 주의'},
    ENFJ: {verb:'큰 그림을 그리고', trait:'네트워크 정보가 강점', risk:'타인 의견 과의존 주의'},
    INFJ: {verb:'직관을 신뢰하고', trait:'장기 통찰이 강점', risk:'확신 과도 주의'},
    ENFP: {verb:'가능성을 탐색하고', trait:'트렌드 선점이 강점', risk:'충동 매수 주의'},
    INFP: {verb:'가치를 기준으로', trait:'원칙 기반 인내가 강점', risk:'감정적 회피 주의'},
    ESTJ: {verb:'계획대로 실행하고', trait:'체계적 관리가 강점', risk:'변화 대응 경직 주의'},
    ISTJ: {verb:'원칙을 확인하고', trait:'안정적 수성이 강점', risk:'기회 포착 지연 주의'},
    ESTP: {verb:'즉시 실행하고', trait:'단기 타이밍이 강점', risk:'손절 지연 주의'},
    ISTP: {verb:'구조를 분석하고', trait:'위기 대응이 강점', risk:'포트폴리오 집중 주의'},
    ENFP: {verb:'가능성을 탐색하고', trait:'트렌드 선점이 강점', risk:'충동 매수 주의'},
    ESFJ: {verb:'안전망을 확인하고', trait:'배당·안정형이 강점', risk:'고위험 자산 주의'},
    ISFJ: {verb:'리스크를 점검하고', trait:'방어적 수성이 강점', risk:'기회 과소평가 주의'},
    ESFP: {verb:'기회를 포착하고', trait:'실행 속도가 강점', risk:'충동 분산 주의'},
    ISFP: {verb:'감각적으로 판단하고', trait:'저평가 발굴이 강점', risk:'손절 회피 주의'}
  };
  var _ap = _archProfile[archetype] || _archProfile['ENTJ'];

  // ── 코어에너지별 즉시 행동 (5종 × 3상태)
  var _elActions = {
    '木': {
      enter1:  '성장주 타겟 종목에 오늘 안에 계획 금액의 60%를 진입하세요. 木 에너지가 상승 구간에서 극대화됩니다.',
      enter2:  '2차 매수 타겟을 오늘 확정하고 매수 주문을 예약하세요. 성장 에너지가 확장 중입니다.',
      caution: '보유 중인 성장주 1개의 목표 수익률을 재점검하고 이익 실현 기준선을 설정하세요.',
      soon:    '골든타임 전 관심 성장주 3개를 리스트업하고 우선순위를 매기세요.',
      prepare: '지금 관심 있는 성장 가능 종목 1개 이름과 진입 이유를 메모장에 한 줄로 적으세요.'
    },
    '火': {
      enter1:  '지금 진입 충동이 있다면 3가지 조건(수익률 목표·손절가·진입 규모)을 먼저 적고 시작하세요.',
      enter2:  '추가 매수 전 현재 포지션 손익을 숫자로 확인하고 추가 금액 한도를 지금 정하세요.',
      caution: '火 에너지 과열 구간입니다. 오늘 새로운 종목 검색을 멈추고 기존 보유 종목 1개만 점검하세요.',
      soon:    '골든타임 전 감정이 아닌 숫자 3개(진입가·목표가·손절가)를 지금 메모에 작성하세요.',
      prepare: '충동적으로 사고 싶은 종목이 있다면 48시간 대기 규칙을 지금 달력에 표시하세요.'
    },
    '土': {
      enter1:  '안정 자산 비중을 유지하며 배당주 또는 채권 ETF 목표 수량을 오늘 주문 예약하세요.',
      enter2:  '포트폴리오 전체 비중을 확인하고 土 에너지 최적 배분(안정:성장 6:4)으로 조정하세요.',
      caution: '현금 비중이 15% 미만이면 오늘 안에 주식 1개를 부분 익절해 현금을 확보하세요.',
      soon:    '골든타임 진입 자금을 오늘 별도 계좌 또는 메모에 금액으로 명시하세요.',
      prepare: '현재 포트폴리오에서 가장 비중이 큰 자산 1개의 손절가를 숫자로 지금 설정하세요.'
    },
    '金': {
      enter1:  '金 에너지 최고조 구간입니다. 사전에 정한 진입 계획대로 오늘 60~70% 집행하세요.',
      enter2:  '보유 종목 중 수익률 하위 1개를 찾아 손절 기준가를 지금 숫자로 재설정하세요.',
      caution: '결단 에너지를 방어에 사용하세요. 손절 기준선을 재점검하고 이탈 시 즉시 실행 규칙을 명문화하세요.',
      soon:    '골든타임 ' + _gt1Raw + '까지 ' + _daysToGt1 + '개월. 오늘 진입할 종목 1개 이름과 목표가를 메모에 확정하세요.',
      prepare: '보유 종목 전체 손절가가 숫자로 설정돼 있는지 지금 확인하고 미설정 종목 1개를 오늘 완료하세요.'
    },
    '水': {
      enter1:  '지혜 에너지가 최고조입니다. 장기 보유 적합 종목에 분할 진입 1회차를 오늘 실행하세요.',
      enter2:  '유동성이 가장 낮은 자산 1개를 확인하고 비상 자금 비율을 계산해 메모에 적으세요.',
      caution: '현금 유동성 확보가 우선입니다. 오늘 만기 예금·적금 일정을 확인하고 재투자 계획을 세우세요.',
      soon:    '골든타임 전 유동성 점검을 완료하세요. 즉시 현금화 가능한 자산 비율을 숫자로 확인하세요.',
      prepare: '가장 유동성이 낮은 자산 1개를 확인하고 비상 자금이 총 자산의 10% 이상인지 점검하세요.'
    }
  };
  var _elMap = _elActions[coreEl] || _elActions['金'];
  var _elAction = _elMap[_gtState] || _elMap['prepare'];

  // ── 아키타입 개인화 문장 (16종 × 3상태)
  var _archActions = {
    ENTJ: {
      enter1:  '지휘관형의 결단이 빛나는 순간입니다. 진입 금액과 타겟을 확정하고 오늘 주문을 집행하세요.',
      caution: '전략적 후퇴도 전략입니다. 오늘 포지션 규모를 10~20% 축소하고 재진입 조건을 수치로 설정하세요.',
      prepare: '오늘 투자 판단 기준 3가지를 종이에 적으세요. 다음 매수 전 이 3가지를 체크하는 루틴을 만드세요.'
    },
    INTJ: {
      enter1:  '검증 완료된 전략을 지금 실행하세요. 분석은 끝났습니다. 계획한 금액의 60%를 오늘 집행하세요.',
      caution: '데이터가 위험 신호를 보이는 구간입니다. 포트폴리오 상관관계를 점검하고 헤지 전략 1개를 추가하세요.',
      prepare: '분석 중인 종목의 목표 수익률과 손절가를 오늘 숫자로 확정하고 메모에 저장하세요.'
    },
    ENTP: {
      enter1:  '아이디어를 실행으로 전환할 때입니다. 가장 확신 있는 아이디어 1개에 오늘 진입하세요.',
      caution: '분산 과다 위험 구간입니다. 보유 종목 수를 세어보고 7개 초과라면 하위 1개를 오늘 정리하세요.',
      prepare: '지금 가장 흥미로운 투자 아이디어 1개를 메모장에 적고 검증할 질문 2개를 추가하세요.'
    },
    INTP: {
      enter1:  '계산 완료된 포지션을 지금 집행하세요. 완벽한 타이밍은 없습니다. 계획대로 오늘 실행하세요.',
      caution: '시스템이 위험 신호를 보냅니다. 손절 알고리즘이 작동하는지 오늘 직접 확인하세요.',
      prepare: '분석하고 싶은 종목의 핵심 지표 3개를 오늘 스프레드시트에 입력하고 비교 시작하세요.'
    },
    ENFJ: {
      enter1:  '리더십 에너지가 최고조입니다. 네트워크에서 수집한 정보 중 가장 확신 있는 것에 오늘 진입하세요.',
      caution: '타인 의견 과의존 주의 구간입니다. 오늘 본인만의 판단 기준 1가지를 글로 적어보세요.',
      prepare: '신뢰하는 투자 커뮤니티나 동료에게 관심 종목에 대한 의견을 오늘 1개 물어보세요.'
    },
    INFJ: {
      enter1:  '통찰이 맞는 순간입니다. 오래 바라봐온 종목에 오늘 첫 번째 포지션을 시작하세요.',
      caution: '직관 과신 주의 구간입니다. 오늘 보유 종목 1개의 실적 데이터를 숫자로 직접 확인하세요.',
      prepare: '직관적으로 오를 것 같은 종목 1개를 메모에 적고 그 이유를 한 문장으로 설명해 보세요.'
    },
    ENFP: {
      enter1:  '활동가형의 실행 에너지가 폭발하는 구간입니다. 오늘 진입 전 손절가를 먼저 숫자로 설정하세요.',
      caution: '충동 매수 최고 위험 구간입니다. 오늘 새 종목 검색 앱을 1시간 이상 열지 않는 규칙을 지키세요.',
      prepare: '지금 사고 싶은 종목이 있다면 일주일 후 다시 보기 알림을 지금 달력에 설정하세요.'
    },
    INFP: {
      enter1:  '가치가 검증된 종목에 원칙대로 진입할 때입니다. 감정이 아닌 사전에 적어둔 이유대로 오늘 집행하세요.',
      caution: '감정적 회피 주의 구간입니다. 손실 중인 종목 1개의 현재 수익률을 지금 숫자로 직접 확인하세요.',
      prepare: '투자하려는 종목의 "왜 사는가" 이유를 오늘 1문장으로 메모에 적어두세요. 감정이 흔들릴 때 이 문장을 읽게 됩니다.'
    },
    ESTJ: {
      enter1:  '계획대로 실행하세요. 오늘 사전 설정한 진입 조건이 충족됐다면 망설이지 말고 주문하세요.',
      caution: '체계적 관리 구간입니다. 이번 달 투자 계획 대비 실제 집행 현황을 오늘 점검하세요.',
      prepare: '이번 달 투자 일정과 금액을 오늘 달력에 구체적으로 입력하고 알림을 설정하세요.'
    },
    ISTJ: {
      enter1:  '원칙이 허락하는 구간입니다. 안전마진이 확보된 종목에 오늘 계획 금액을 집행하세요.',
      caution: '수성 집중 구간입니다. 보유 자산 목록을 오늘 한 번 전체 검토하고 이상 없음을 확인하세요.',
      prepare: '투자 원칙 리스트가 있다면 오늘 다시 읽어보고, 없다면 지금 3가지를 적으세요.'
    },
    ESTP: {
      enter1:  '단기 타이밍 구간입니다. 오늘 목표 수익률 달성 종목은 즉시 익절하고 다음 타겟을 설정하세요.',
      caution: '손절 지연 주의 구간입니다. 현재 마이너스 종목 중 손절가 이탈 종목을 오늘 정리하세요.',
      prepare: '다음 단기 타겟 종목 1개를 오늘 정하고 진입 조건(가격·날짜)을 달력에 설정하세요.'
    },
    ISTP: {
      enter1:  '구조 분석이 완료된 종목에 오늘 정밀 진입하세요. 장인형의 실행은 정확해야 합니다.',
      caution: '위기 대응 구간입니다. 포트폴리오에서 상관관계 높은 자산 2개를 찾고 분산 계획을 세우세요.',
      prepare: '관심 종목의 차트 구조를 오늘 분석하고 지지선·저항선을 숫자로 메모에 기록하세요.'
    },
    ESFJ: {
      enter1:  '안전한 구간에서의 진입입니다. 배당주 또는 안정형 ETF에 오늘 계획 금액을 집행하세요.',
      caution: '고위험 자산 주의 구간입니다. 보유 중 변동성 높은 종목 1개의 비중을 오늘 5% 줄이세요.',
      prepare: '가족이나 가까운 사람과 공유할 수 있는 안전한 투자 계획을 오늘 1줄로 정리해보세요.'
    },
    ISFJ: {
      enter1:  '방어적 수성이 강점인 구간입니다. 검증된 배당주에 오늘 계획한 금액을 안전하게 집행하세요.',
      caution: '리스크 점검 구간입니다. 비상 자금이 총 자산의 10% 이상인지 오늘 확인하세요.',
      prepare: '가장 안심이 되는 보유 종목 1개를 오늘 확인하고 그 이유를 메모에 적어두세요.'
    },
    ESFP: {
      enter1:  '실행 에너지가 최고조입니다. 오늘 진입 전 손절가를 먼저 설정하고 시작하세요.',
      caution: '충동 분산 주의 구간입니다. 오늘 신규 종목 진입을 1개로 제한하는 규칙을 지키세요.',
      prepare: '지금 가장 끌리는 종목 1개를 메모에 적고 3일 후 다시 보기 알림을 설정하세요.'
    },
    ISFP: {
      enter1:  '감각적 판단이 맞는 구간입니다. 저평가됐다고 느끼는 종목에 오늘 소규모로 첫 포지션을 시작하세요.',
      caution: '손절 회피 주의 구간입니다. 마음이 불편한 종목 1개를 오늘 직접 수익률 확인하고 판단하세요.',
      prepare: '직감적으로 저평가됐다고 느끼는 종목의 최근 실적 1개를 오늘 검색해서 확인하세요.'
    }
  };
  var _stateKey = (_gtState === 'enter1') ? 'enter1' : (_gtState === 'caution') ? 'caution' : 'prepare';
  var _archMap2 = _archActions[archetype] || _archActions['ENTJ'];
  var _archAction = _archMap2[_stateKey] || _archMap2['prepare'];

  // ── 골든타임 상태 제목
  var _gtStatusTitle = '';
  if (_gtState === 'enter1')  _gtStatusTitle = '🔥 지금이 골든타임 1위 구간 — ' + _gt1Raw;
  else if (_gtState === 'enter2') _gtStatusTitle = '⚡ 골든타임 2~3위 구간 진행 중';
  else if (_gtState === 'caution') _gtStatusTitle = '⚠️ 주의 구간 — 방어 집중';
  else if (_gtState === 'soon')   _gtStatusTitle = '🚀 골든타임 ' + _gt1Raw + ' ' + _daysToGt1 + '개월 전 — 준비 시작';
  else _gtStatusTitle = '📋 골든타임 ' + _gt1Raw + ' 준비 구간 (' + _daysToGt1 + '개월 후)';

  // ── 최종 조합: 아키타입 행동 우선 + 코어에너지 보완
  var nowActionTitle = _gtStatusTitle;
  var nowActionMain  = _archAction;   // 아키타입 16종 × 3상태 완전 개인화
  var nowActionSub   = _elAction;     // 코어에너지 5종 × 3상태 보완

  // ── N-Score 등급 계산
  var ngrade = nscore >= 900 ? 'N1 Prime'
             : nscore >= 800 ? 'N2 Elite'
             : nscore >= 720 ? 'N3 High'
             : nscore >= 650 ? 'N4 Upper-Mid'
             : nscore >= 580 ? 'N5 Mid'
             : nscore >= 510 ? 'N6 Lower-Mid'
             : nscore >= 440 ? 'N7 Caution'
             : nscore >= 370 ? 'N8 Warning'
             :                 'N9 Risk';

  // ── 상위% 계산 (N-Score 기반 백분위)
  // ★ 아키타입 내 상위% — 동일 MBTI 그룹 내 비교 (전체 모수 대비 좁은 범위 → 체감 개인화)
  var archetypeDistMap = {
    ENTJ:0.82, INTJ:0.85, ENTP:0.80, INTP:0.87,  // NT계열: 분석형, 고득점 집중
    ENFJ:0.78, INFJ:0.80, ENFP:0.75, INFP:0.78,  // NF계열: 감성형, 중간 분포
    ESTJ:0.76, ISTJ:0.80, ESTP:0.72, ISTP:0.78,  // ST계열: 실행형, 넓은 분포
    ESFJ:0.70, ISFJ:0.74, ESFP:0.68, ISFP:0.72   // SF계열: 안정형, 낮은 분포
  };
  var distK = archetypeDistMap[archetype] || 0.78;  // 아키타입별 분포계수
  var topPctA  = Math.max(3,  Math.round(100 - (nscore / 1000) * 100 * distK));
  var topPctB  = Math.min(99, topPctA + 4);
  var topPctC  = Math.min(99, topPctB + 4);
  // S02 표시용: 전체 기준이 아닌 동일 아키타입 내 상위%
  var overallTop = Math.max(3, Math.round(100 - (nscore / 1000) * 100 * distK * 0.95));

  // ── KPI 점수 (aiData 우선, 없으면 실제값, 없으면 N-Score 파생)
  var ai = aiData || {};
  // ★ v71 FIX: wealth_energy/opportunity_score/risk_tolerance 필드명 완전 호환
  var _rawKpi1 = data.kpi1 || data.wealth_energy    || data.wealthEnergy    || '';
  var _rawKpi2 = data.kpi2 || data.opportunity_score || data.opportunityScore || '';
  var _rawKpi3 = data.kpi3 || data.risk_tolerance    || data.riskTolerance   || '';
  var kpi1Score = sn(ai.kpi1_score, sn(_rawKpi1, Math.min(98, Math.round(nscore / 10 + 2))));
  var kpi2Score = sn(ai.kpi2_score, sn(_rawKpi2, Math.min(95, Math.round(nscore / 10 - 2))));
  var kpi3Score = sn(ai.kpi3_score, sn(_rawKpi3, Math.min(90, Math.round(nscore / 10 - 6))));
  var kpi1Bar   = Math.round(kpi1Score);
  var kpi2Bar   = Math.round(kpi2Score);
  var kpi3Bar   = Math.round(kpi3Score);

  // ── 아키타입 한글명
  // ★ saju-engine.js nkaiDatabase 공식 한글명
  var archetypeNames = {
    ENTJ:'혁신적 지휘관', ENTP:'번뜩이는 개척자', INTJ:'전략적 탐험가', INTP:'논리의 설계자',
    ESTJ:'체계적 실행자', ISTJ:'원칙의 실천가', ESTP:'실전형 돌파자', ISTP:'정밀한 관찰자',
    ENFJ:'이상적 전도사', INFJ:'내면의 항해자', ENFP:'자유로운 창조자', INFP:'가치 기반 탐색자',
    ESFJ:'안정의 조율자', ISFJ:'든든한 동반자', ESFP:'역동적 실행가', ISFP:'감성의 안내자'
  };
  // ★ saju-engine.js 공식 그룹명 — 커버/S01 표시용
  var archetypeSubNames = {
    ENTJ:'항해사 (Navigator)', ENTP:'항해사 (Navigator)', INTJ:'항해사 (Navigator)', INTP:'항해사 (Navigator)',
    ESTJ:'분석가 (Analyst)',   ISTJ:'분석가 (Analyst)',   ESTP:'분석가 (Analyst)',   ISTP:'분석가 (Analyst)',
    ENFJ:'비전가 (Visionary)', INFJ:'비전가 (Visionary)', ENFP:'비전가 (Visionary)', INFP:'비전가 (Visionary)',
    ESFJ:'실용주의 (Pragmatist)', ISFJ:'실용주의 (Pragmatist)', ESFP:'실용주의 (Pragmatist)', ISFP:'실용주의 (Pragmatist)'
  };
  var archetypeTaglines = {
    ENTJ:'시장을 설계하는 자, 지갑이 증명한다',
    INTJ:'데이터를 읽는 자, 미래를 앞선다',
    ENTP:'규칙을 깨는 자, 기회를 창조한다',
    INTP:'시스템을 이해하는 자, 패턴을 꿰뚫는다',
    ENFJ:'사람을 이끄는 자, 신뢰가 자산이다',
    INFJ:'흐름을 읽는 자, 통찰이 무기다',
    ENFP:'열정으로 달리는 자, 가능성이 전략이다',
    INFP:'가치로 움직이는 자, 진정성이 수익이다',
    ESTJ:'규칙을 지키는 자, 안정이 성과다',
    ISTJ:'검증된 것만 움직이는 자, 신뢰가 자본이다',
    ESFJ:'관계로 성장하는 자, 신뢰가 투자다',
    ISFJ:'조용히 지키는 자, 꾸준함이 수익이다',
    ESTP:'순간을 잡는 자, 행동이 전략이다',
    ISTP:'구조를 분해하는 자, 정밀함이 강점이다',
    ESFP:'현재를 즐기는 자, 경험이 자산이다',
    ISFP:'감성으로 판단하는 자, 직관이 나침반이다'
  };
  var archetypeCores = {
    ENTJ:'시장의 비효율을 가장 먼저 포착하고 시스템으로 전환하는 금융 설계자입니다.',
    INTJ:'장기 전략과 데이터 기반 의사결정으로 조용히 수익을 극대화하는 전략가입니다.',
    ENTP:'기존 패러다임을 깨고 새로운 투자 기회를 창출하는 혁신적 투자자입니다.',
    INTP:'복잡한 시장 구조를 분석하여 논리적으로 최적해를 도출하는 분석가입니다.',
    ENFJ:'영향력과 네트워크를 활용하여 집단의 자산을 성장시키는 리더형 투자자입니다.',
    INFJ:'장기 흐름과 직관으로 위기를 선제 감지하고 안정적 수익을 추구하는 투자자입니다.',
    ENFP:'열정과 직관으로 새로운 기회를 발굴하며 포트폴리오를 역동적으로 운용하는 투자자입니다.',
    INFP:'가치와 신념에 부합하는 투자를 선택하며 장기적 관점으로 자산을 키우는 투자자입니다.',
    ESTJ:'검증된 전략과 철저한 규율로 안정적이고 체계적인 자산 관리를 실천하는 투자자입니다.',
    ISTJ:'검증된 데이터와 원칙을 바탕으로 리스크를 최소화하며 꾸준히 자산을 증식하는 투자자입니다.',
    ESFJ:'관계와 신뢰를 기반으로 안정적인 자산 형성을 추구하는 균형 잡힌 투자자입니다.',
    ISFJ:'세심한 관리와 안정을 최우선으로 하며 꾸준한 복리 효과를 추구하는 투자자입니다.',
    ESTP:'빠른 시장 변화에 즉각 대응하며 현실적인 수익 기회를 포착하는 실전형 투자자입니다.',
    ISTP:'정밀한 분석과 냉철한 판단으로 시장을 해부하며 기회를 포착하는 전문 투자자입니다.',
    ESFP:'현재의 기회를 최대한 활용하며 다양한 경험을 통해 투자 감각을 키우는 투자자입니다.',
    ISFP:'내면의 직관과 가치를 바탕으로 자신만의 투자 철학을 구축하는 독립적 투자자입니다.'
  };
  var archetypeStrengths = {
    ENTJ:'전략적 사고와 결단력이 핵심 강점입니다.',
    INTJ:'장기 전략 설계와 데이터 분석 역량이 핵심 강점입니다.',
    ENTP:'혁신적 아이디어 발굴과 빠른 적응력이 핵심 강점입니다.',
    INTP:'논리적 구조 분석과 패턴 인식력이 핵심 강점입니다.',
    ENFJ:'리더십과 설득력, 네트워크 활용 능력이 핵심 강점입니다.',
    INFJ:'장기 흐름 독해와 직관적 위험 감지 능력이 핵심 강점입니다.',
    ENFP:'창의적 기회 발굴과 높은 실행 에너지가 핵심 강점입니다.',
    INFP:'가치 기반 의사결정과 독립적 판단력이 핵심 강점입니다.',
    ESTJ:'체계적 계획 실행과 철저한 리스크 관리가 핵심 강점입니다.',
    ISTJ:'원칙 준수와 꾸준한 복리 전략 실행이 핵심 강점입니다.',
    ESFJ:'관계 기반 정보 수집과 안정적 자산 관리가 핵심 강점입니다.',
    ISFJ:'세심한 관리와 장기 보유 전략 실행이 핵심 강점입니다.',
    ESTP:'빠른 시장 대응력과 현장 감각이 핵심 강점입니다.',
    ISTP:'냉철한 분석력과 정밀한 손절 원칙 실행이 핵심 강점입니다.',
    ESFP:'현재 기회 포착력과 유연한 포트폴리오 운용이 핵심 강점입니다.',
    ISFP:'독자적 투자 철학과 감성적 시장 감지력이 핵심 강점입니다.'
  };
  var archetypeRisks = {
    ENTJ:'과도한 자신감이 리스크를 키울 수 있습니다.',
    INTJ:'과도한 독립적 판단이 정보 편향을 유발할 수 있습니다.',
    ENTP:'집중력 분산과 계획 미완수가 리스크입니다.',
    INTP:'우유부단한 의사결정이 진입 타이밍을 놓칠 수 있습니다.',
    ENFJ:'타인의 의견 과다 수용이 독립적 판단을 흐릴 수 있습니다.',
    INFJ:'과도한 신중함이 기회를 놓치는 원인이 될 수 있습니다.',
    ENFP:'충동적 진입과 손절 원칙 미준수가 핵심 리스크입니다.',
    INFP:'감정적 판단이 객관적 분석을 방해할 수 있습니다.',
    ESTJ:'변화하는 시장에 대한 경직된 대응이 리스크입니다.',
    ISTJ:'보수적 접근으로 골든타임 기회를 놓칠 수 있습니다.',
    ESFJ:'타인 의존도가 높아 독립적 판단이 어려울 수 있습니다.',
    ISFJ:'과도한 안정 추구가 수익 기회를 제한할 수 있습니다.',
    ESTP:'충동적 단기 매매로 장기 전략이 흔들릴 수 있습니다.',
    ISTP:'감정 과잉 억제로 시장 분위기 변화를 놓칠 수 있습니다.',
    ESFP:'충동적 소비와 즉흥적 투자가 자산 형성을 방해할 수 있습니다.',
    ISFP:'외부 노이즈에 흔들려 원칙이 무너질 수 있습니다.'
  };
  var archetypeStrategies = {
    ENTJ:'골든타임에 하향식 전략으로 진입하고, 주의구간에는 포지션 규모를 제한하십시오.',
    INTJ:'장기 포지션을 설계하고, 골든타임 구간에 핵심 자산을 집중 배치하십시오.',
    ENTP:'다양한 기회를 탐색하되 상위 3개 포지션에 자본을 집중하십시오.',
    INTP:'모델 기반 진입 기준을 수치화하고, 데이터가 말할 때만 행동하십시오.',
    ENFJ:'네트워크 정보를 검증한 후 진입하고, 포지션 규모를 원칙으로 제한하십시오.',
    INFJ:'직관적 신호와 데이터를 교차검증 후 진입, 장기 보유 원칙을 지키십시오.',
    ENFP:'실행 전 체크리스트를 의무화하고, 손절선을 수치로 명문화하십시오.',
    INFP:'가치 기준을 명확히 수립하고, 외부 노이즈로부터 판단을 보호하십시오.',
    ESTJ:'검증된 전략을 반복 실행하고, 변동성 구간에서는 현금 비중을 높이십시오.',
    ISTJ:'원칙을 문서화하고, 예외 없는 손절 시스템을 자동화하십시오.',
    ESFJ:'독립적 투자 원칙을 수립하고, 타인 추천 종목은 2차 검증 후 진입하십시오.',
    ISFJ:'복리 자동화 시스템을 구축하고, 골든타임에만 적극적 포지션을 취하십시오.',
    ESTP:'단기 매매 비중을 30% 이하로 제한하고, 장기 포지션을 병행하십시오.',
    ISTP:'정밀한 진입 기준과 손절선을 수치화하고, 냉철하게 실행하십시오.',
    ESFP:'자동 저축·투자 시스템을 구축하고, 충동 소비 전 24시간 대기 원칙을 도입하십시오.',
    ISFP:'투자 일지를 작성하며 감정 패턴을 추적하고, 원칙을 시각화하십시오.'
  };

  // ── 아키타입 데이터 추출
  var atName    = archetypeNames[archetype]    || archetype;
  var atSub     = archetypeSubNames[archetype]  || '';
  var atTag     = archetypeTaglines[archetype]  || '';
  var atCore    = archetypeCores[archetype]     || '';
  // ★ AI 우선 → 하드코딩 폴백 (Claude API 연결 시 완전 개인화)
  var atStr     = ss(ai.strength)  || archetypeStrengths[archetype]  || '';
  var atRisk    = ss(ai.risk)      || archetypeRisks[archetype]      || '';
  var atStrat   = ss(ai.strategy)  || archetypeStrategies[archetype] || '';
  var atDescAI  = ss(ai.archetypeDesc) || '';  // S01 hero 설명 AI 우선

  // ── 에너지 밸런스 데이터
  var elementMap = {
    '木': { name:'木', ko:'성장·확장', color:'#22C55E', pct:15,
            desc:'성장 가능성이 높은 자산을 직관적으로 선별하는 경향이 강합니다.',
            reactions:[
              { symbol:'🔥', element:'火', name:'화(火)', stars:'★★★★☆', react:'성장 에너지가 열정을 점화', desc:'열정·도전 자산과 공명. 성장주·테크 섹터에서 최적 시너지' },
              { symbol:'⛰', element:'土', name:'지(土)', stars:'★★★☆☆', react:'확장 에너지와 안정 에너지 긴장', desc:'안정 자산 접근 시 충동 억제 필요. 부동산은 장기 관점 유지' },
              { symbol:'💨', element:'Air', name:'풍(風)', stars:'★★★★☆', react:'木 에너지 자체 강화', desc:'분석·정보 기반 투자에서 최적 시너지' },
              { symbol:'💧', element:'水', name:'수(水)', stars:'★★★★★', react:'지혜 에너지가 성장을 극대화', desc:'지혜와 유연성이 성장 에너지를 극대화. 채권·유동성 자산과 최강 공명' }
            ]},
    '火': { name:'火', ko:'열정·활력', color:'#EF4444', pct:20,
            desc:'빠른 의사결정과 추세 추종에 강하나 감정적 판단을 주의해야 합니다.',
            reactions:[
              { symbol:'🔥', element:'火', name:'화(火)', stars:'★★☆☆☆', react:'열정 에너지와 결단 에너지 충돌', desc:'충동적 실행 억제 필요. 과열 시장·고위험 자산 주의' },
              { symbol:'⛰', element:'土', name:'지(土)', stars:'★★★★★', react:'열정이 안정 에너지를 극대화', desc:'열정이 안정을 강화. 부동산·배당주와 최강 공명' },
              { symbol:'💨', element:'Air', name:'풍(風)', stars:'★★★★☆', react:'火 에너지 자체 강화', desc:'빠른 정보 처리와 추세 추종에서 시너지' },
              { symbol:'💧', element:'水', name:'수(水)', stars:'★★★☆☆', react:'유연성이 열정을 조율', desc:'유연성이 열정을 통제. 채권·현금 비중 유지로 균형' }
            ]},
    '土': { name:'土', ko:'안정·균형', color:'#F59E0B', pct:25,
            desc:'안정 자산을 선호하며 장기 보유 전략에 최적화된 성향입니다.',
            reactions:[
              { symbol:'🔥', element:'火', name:'화(火)', stars:'★★★★★', react:'열정이 안정 에너지를 극대화', desc:'열정이 안정을 강화. 성장주·테크 자산이 포트폴리오 확장' },
              { symbol:'⛰', element:'土', name:'지(土)', stars:'★★★★★', react:'안정 에너지가 결단력을 강화', desc:'안정이 결단력을 극대화. 부동산·배당주와 최강 공명' },
              { symbol:'💨', element:'Air', name:'풍(風)', stars:'★★★★☆', react:'土 에너지 자체 강화', desc:'분석·정보 기반 투자에서 최적 시너지' },
              { symbol:'💧', element:'水', name:'수(水)', stars:'★★★☆☆', react:'안정이 유연성을 구조화', desc:'안정이 유연성을 조율. 채권·유동성 자산은 장기 보유 원칙 유지' }
            ]},
    '金': { name:'金', ko:'결단·수렴', color:'#F0C674', pct:30,
            desc:'분석적 접근과 손절 원칙에 강하며 비용 효율을 극대화하는 성향입니다.',
            reactions:[
              { symbol:'🔥', element:'火', name:'화(火)', stars:'★★☆☆☆', react:'열정 에너지와 결단 에너지 충돌', desc:'충동적 실행 억제 필요. 과열 시장·고위험 자산 주의' },
              { symbol:'⛰', element:'土', name:'지(土)', stars:'★★★★★', react:'안정 에너지가 결단력을 강화', desc:'안정이 결단력을 극대화. 부동산·배당주와 최강 공명' },
              { symbol:'💨', element:'Air', name:'풍(風)', stars:'★★★★☆', react:'金 에너지 자체 강화', desc:'분석·정보 기반 투자에서 최적 시너지' },
              { symbol:'💧', element:'Water', name:'수(水)', stars:'★★★☆☆', react:'결단 에너지가 지혜로 전환', desc:'결단이 지혜로 이어짐. 채권·유동성 자산과 공명' }
            ]},
    '水': { name:'水', ko:'지혜·흐름', color:'#2D8CFF', pct:10,
            desc:'정보 수집과 시장 사이클 독해에 탁월한 직관을 지닌 성향입니다.',
            reactions:[
              { symbol:'🔥', element:'火', name:'화(火)', stars:'★★★☆☆', react:'유연성이 열정을 조율', desc:'유연성이 열정을 통제. 추세 추종 시 과열 경계' },
              { symbol:'⛰', element:'土', name:'지(土)', stars:'★★★★☆', react:'안정이 유연성을 구조화', desc:'안정이 유연성을 조율. 부동산·배당주는 장기 관점 유지' },
              { symbol:'💨', element:'Air', name:'풍(風)', stars:'★★★★★', react:'水 에너지 자체 강화', desc:'정보 수집·시장 독해에서 최강 시너지' },
              { symbol:'💧', element:'Water', name:'수(水)', stars:'★★★★★', react:'결단 에너지가 지혜로 전환', desc:'결단이 지혜로 이어짐. 채권·유동성 자산과 최강 공명' }
            ]}
  };
  var elData    = elementMap[coreEl] || elementMap['金'];
  var elName    = elData.name;
  var elKo      = elData.ko;
  var elColor   = elData.color;
  var reactions = elData.reactions;

  // ── 에너지 밸런스 비율 ★ FIX v4.1: getElPcts(data) — 3단계 자동선택
  var _ep = getElPcts(data);
  var pctMok=_ep.wood, pctHwa=_ep.fire, pctTo=_ep.earth, pctGeum=_ep.metal, pctSu=_ep.water;

  // ── 골든타임 캘린더
  // ★ 폴백오류2 FIX: goldentime1/2/3 우선 사용
  var gtMonths = [
    ss(data.goldentime1) || ss(data.golden_time_1) || ss(ai.gt1tag) || '7월',
    ss(data.goldentime2) || ss(data.golden_time_2) || ss(ai.gt2tag) || '9월',
    ss(data.goldentime3) || ss(data.golden_time_3) || ss(ai.gt3tag) || '2027년 2월'
  ];
  var gtLabels = [
    ss(ai.gt1_label) || ss(ai.gt1tag) || 'J커브 전환',
    ss(ai.gt2_label) || ss(ai.gt2tag) || '확장 국면',
    ss(ai.gt3_label) || ss(ai.gt3tag) || '수렴 구간'
  ];
  // ★ 폴백오류3 FIX: goldentime_warn 우선 사용
  var cautionPeriod = ss(data.goldentime_warn) || ss(data.caution_period) || ss(ai.caution_period) || '6월';

  // ── 골든타임 구간별 실행 전략 (archetype-aware)
  var gt1Month = gtMonths[0]; // e.g. "7월"
  // ★ 골든타임 D-day 사전 계산 (템플릿 밖에서 계산 — GAS Rhino 호환)
  var _gtDday = (function(){
    var gm = gt1Month || '';
    if(!gm) return '—';
    var mn = parseInt(gm);
    if(isNaN(mn) || mn < 1 || mn > 12) return gm;
    var now = new Date();
    var nowYr = now.getFullYear();
    var nowMo = now.getMonth() + 1;
    var nowDy = now.getDate();
    var tgtYr = nowYr;
    if(mn < nowMo || (mn === nowMo && nowDy > 1)) tgtYr = nowYr + 1;
    var nowDate = new Date(nowYr, nowMo - 1, nowDy);
    var tgtDate = new Date(tgtYr, mn - 1, 1);
    var diff = Math.ceil((tgtDate.getTime() - nowDate.getTime()) / (1000 * 60 * 60 * 24));
    return diff <= 0 ? '이번달!' : 'D-' + diff;
  }());
  var gtPrevMonth = ss(ai.gt_prep_month) || '6월';
  var gtStrategy1 = ss(ai.gt_strategy_1) || ('투자 대상 리서치 완료 + 진입 자금 확보 + 손절 기준선 수치 명문화');
  var gtStrategy2 = ss(ai.gt_strategy_2) || ('계획 포지션 60~70% 우선 진입 → 확인 시그널 후 잔여 30% 추가');
  var gtStrategy3 = ss(ai.gt_strategy_3) || ('신규 대규모 투자 자제 · 현금 비중 15~20% 유지');

  // ── currentAge 먼저 계산 (seasonDesc ageTag에서 사용)
  // ★ bYear 보정: birthdate에서 직접 파싱 (birth_year 미전달 대비)
  if(!bYear || bYear < 1900 || bYear > 2020) {
    var _bd = safeStr(data.birthdate || data.birth_date || '').replace(/[^0-9]/g,'');
    if(_bd.length >= 4) bYear = parseInt(_bd.substring(0,4));
    if(!bMonth && _bd.length >= 6) bMonth = parseInt(_bd.substring(4,6));
  }
  // ★ FIX: bYear 4자리 범위 검증 — 8자리 날짜 전체가 들어오면 재파싱
  if (bYear && (bYear < 1900 || bYear > 2020)) {
    var _bdFix = safeStr(data.birthdate || data.birth_date || '').replace(/[^0-9]/g,'');
    if (_bdFix.length >= 4) bYear = parseInt(_bdFix.substring(0,4));
    else bYear = 0;
  }
  // ★ FIX: 기본값 30 제거 → bYear 없으면 -1(미확인) 처리
  var currentAge = (bYear && bYear >= 1900 && bYear <= 2015) ? (new Date().getFullYear() - bYear) : -1;
  // ── 생월 계절 라벨 (S08용)
  var seasonLabel = '';
  var seasonDesc  = '';
  if (bMonth >= 3 && bMonth <= 5) {
    seasonLabel = '봄 에너지 (3~5월생)';
    var ageTagSp = currentAge < 20 ? '10대 봄 에너지' : currentAge < 30 ? '20대 봄 에너지' : currentAge < 40 ? '30대 봄 에너지' : currentAge < 50 ? '40대 봄 에너지' : currentAge < 60 ? '50대 봄 에너지' : currentAge < 70 ? '60대 봄 에너지' : '70대 봄 에너지';
    seasonDesc = ageTagSp + ' ' + archetype + ' — 새로운 시작과 성장 에너지가 극대화되는 계절입니다. 신규 포지션 진입과 투자 포트폴리오 확장에 최적화된 구간입니다.';
  } else if (bMonth >= 6 && bMonth <= 8) {
    seasonLabel = '여름 에너지 (6~8월생)';
    var ageTagSu = currentAge < 20 ? '10대 여름 에너지' : currentAge < 30 ? '20대 여름 에너지' : currentAge < 40 ? '30대 여름 에너지' : currentAge < 50 ? '40대 여름 에너지' : currentAge < 60 ? '50대 여름 에너지' : currentAge < 70 ? '60대 여름 에너지' : '70대 여름 에너지';
    seasonDesc = ageTagSu + ' ' + archetype + ' — 실행력과 추진력이 극대화되는 에너지입니다. 골든타임 구간에서 망설임 없이 결단하십시오.';
  } else if (bMonth >= 9 && bMonth <= 11) {
    seasonLabel = '가을 에너지 (9~11월생)';
    var ageTagFa = currentAge < 20 ? '10대 가을 에너지' : currentAge < 30 ? '20대 가을 에너지' : currentAge < 40 ? '30대 가을 에너지' : currentAge < 50 ? '40대 가을 에너지' : currentAge < 60 ? '50대 가을 에너지' : currentAge < 70 ? '60대 가을 에너지' : '70대 가을 에너지';
    seasonDesc = ageTagFa + ' ' + archetype + ' — 수렴과 결실의 에너지가 강합니다. 포지션 정리와 수익 실현 타이밍을 냉철하게 포착하십시오.';
  } else if (bMonth === 12 || bMonth === 1 || bMonth === 2) {
    seasonLabel = '겨울 에너지 (12~2월생)';
    var ageTagWi = currentAge < 20 ? '10대 겨울 에너지' : currentAge < 30 ? '20대 겨울 에너지' : currentAge < 40 ? '30대 겨울 에너지' : currentAge < 50 ? '40대 겨울 에너지' : currentAge < 60 ? '50대 겨울 에너지' : currentAge < 70 ? '60대 겨울 에너지' : '70대 겨울 에너지';
    seasonDesc = ageTagWi + ' ' + archetype + ' — 지혜와 내면 성찰의 에너지입니다. 골든타임 전 철저한 준비와 리서치로 에너지를 축적하십시오.';
  }
  // 생월 미입력 시 seasonLabel 비워둠 → S08에서 조건부 렌더링

  // ── 성장 로드맵 나이 구간 (bYear=기본값이면 표시 안 함)
  var hasBirthYear = (bYear && bYear > 1900) && !!(data.birth_year || data.birthYear || data.birthYearFull || data.birthdate || data.birth_date);
  // ★ 7단계 나이대 (10대~70대+) — 7×4계절×16아키타입 = 448가지 조합
  // ★ S08 직전 최종 bYear/bMonth 보정
  // ★ FIX: bYear 없거나 유효 범위 밖일 때만 재파싱 (< 1920 → < 1900 으로 수정)
  if(!bYear || bYear < 1900 || bYear > 2015) {
    var _bdFinal = safeStr(data.birthdate || data.birth_date || '').replace(/[^0-9]/g,'');
    if(_bdFinal.length >= 4) {
      var _byParsed = parseInt(_bdFinal.substring(0,4));
      if(_byParsed >= 1900 && _byParsed <= 2015) bYear = _byParsed;
    }
    if(!bMonth && _bdFinal.length >= 6) { bMonth = parseInt(_bdFinal.substring(4,6)); }
    if(bYear && bYear >= 1900) currentAge = new Date().getFullYear() - bYear;
    Logger.log('[S08] bYear 최종보정: ' + bYear + ' / bMonth: ' + bMonth + ' / age: ' + currentAge);
  }
  // ★ FIX: currentAge가 -1(미확인)이면 재계산 시도
  if(currentAge === -1 && bYear && bYear >= 1900) {
    currentAge = new Date().getFullYear() - bYear;
  }
  // ★ FIX: currentAge 유효하지 않으면 표시 안 함
  var ageLabel = (!hasBirthYear || currentAge < 0 || currentAge > 120) ? '' :
                 currentAge < 20 ? '🌿 자산 씨앗기 (10대)'
               : currentAge < 30 ? '🌱 자산 형성 시작기 (20대)'
               : currentAge < 40 ? '🚀 자산 형성 가속기 (30대)'
               : currentAge < 50 ? '⚡ 자산 확장 황금기 (40대)'
               : currentAge < 60 ? '🏆 자산 수성 전략기 (50대)'
               : currentAge < 70 ? '🎯 자산 최적화 완성기 (60대)'
               : '🏛 자산 전수 완성기 (70대+)';
  var ageDesc = !hasBirthYear ? '' :
                currentAge < 20
    ? '투자 습관의 씨앗을 심는 가장 결정적 시기입니다. 소액 적립부터 시작해 복리의 마법을 일찍 체득하십시오. 시간이 가장 강력한 자산입니다.'
    : currentAge < 30
    ? '복리의 씨앗을 심는 가장 중요한 시기입니다. 소액이라도 반드시 투자를 시작하고, 골든타임 원칙을 습관화하십시오.'
    : currentAge < 40
    ? '복리의 마법이 가장 강력하게 작동하는 시기입니다. 골든타임 진입에 과감하고, 손절 원칙을 철저히 지키십시오.'
    : currentAge < 50
    ? '자산이 스스로 성장하는 황금기입니다. 포트폴리오 구조를 고도화하고, 리스크 헤지 전략을 병행하십시오.'
    : currentAge < 60
    ? '지켜야 할 자산이 늘어나는 시기입니다. 방어와 성장을 균형 있게 배분하고, 변동성 관리를 최우선으로 하십시오.'
    : currentAge < 70
    ? '자산 최적화와 안정적 인출 전략이 핵심입니다. 골든타임 구간에서만 선택적으로 포지션을 취하십시오.'
    : '평생 쌓아온 자산을 현명하게 전수하는 단계입니다. 안정적 현금흐름 설계와 세대 간 자산 이전 전략이 최우선입니다.';

  // ── N-Score 목표
  // ★ S08 목표 점수 — 아키타입 × N-Score × 나이대 실제 계산
  var _age3m  = (bYear && bYear > 1900) ? (new Date().getFullYear() - bYear) : currentAge || 30; // bYear 없으면 30대 기본
  // 아키타입별 3개월 상승폭 (행동력 특성 반영)
  var _arch3mBonus = {
    ENTJ:22, INTJ:18, ENTP:20, INTP:16,
    ENFJ:19, INFJ:15, ENFP:21, INFP:14,
    ESTJ:20, ISTJ:17, ESTP:25, ISTP:19,
    ESFJ:16, ISFJ:14, ESFP:23, ISFP:15
  }[archetype] || 18;
  // 나이대별 보정 (50대는 안정 중시 → 소폭 상승)
  var _ageFactor = _age3m < 30 ? 1.3 : _age3m < 40 ? 1.2 : _age3m < 50 ? 1.1 : _age3m < 60 ? 0.9 : 0.8;
  // N-Score 현재 위치 보정 (낮을수록 상승폭 큼)
  var _scoreFactor = nscore < 500 ? 1.3 : nscore < 600 ? 1.1 : nscore < 700 ? 1.0 : nscore < 800 ? 0.9 : 0.8;
  var _boost3m  = Math.round(_arch3mBonus * _ageFactor * _scoreFactor);
  var _boost12m = Math.round(_boost3m * 3.2);
  var nscore3m  = Math.min(999, nscore + _boost3m);
  var nscore12m = Math.min(999, nscore + _boost12m);
  var ngrade3m  = nscore3m  >= 900 ? 'N1 Prime' : nscore3m  >= 800 ? 'N2 Elite' : nscore3m  >= 720 ? 'N3 High' : nscore3m  >= 650 ? 'N4 Upper-Mid' : nscore3m  >= 580 ? 'N5 Mid' : nscore3m  >= 510 ? 'N6 Lower-Mid' : 'N7 Caution';
  var ngrade12m = nscore12m >= 900 ? 'N1 Prime' : nscore12m >= 800 ? 'N2 Elite' : nscore12m >= 720 ? 'N3 High' : nscore12m >= 650 ? 'N4 Upper-Mid' : nscore12m >= 580 ? 'N5 Mid' : nscore12m >= 510 ? 'N6 Lower-Mid' : 'N7 Caution';

  // ── 투자 리스크 히트맵
  // ★ v66: S06 연령 보정 — 아키타입 × 연령대 2중 교차
  var riskMap = {
    ENTJ: { short:'적합', real:'주의', startup:'적합', long:'보통', crypto:'주의', etf:'적합' },
    INTJ: { short:'보통', real:'적합', startup:'적합', long:'적합', crypto:'주의', etf:'적합' },
    ENTP: { short:'적합', real:'주의', startup:'적합', long:'보통', crypto:'적합', etf:'보통' },
    INTP: { short:'보통', real:'보통', startup:'적합', long:'적합', crypto:'주의', etf:'적합' },
    ENFJ: { short:'보통', real:'적합', startup:'보통', long:'적합', crypto:'주의', etf:'적합' },
    INFJ: { short:'주의', real:'적합', startup:'보통', long:'적합', crypto:'주의', etf:'적합' },
    ENFP: { short:'적합', real:'주의', startup:'적합', long:'보통', crypto:'보통', etf:'보통' },
    INFP: { short:'주의', real:'보통', startup:'보통', long:'적합', crypto:'주의', etf:'적합' },
    ESTJ: { short:'보통', real:'적합', startup:'주의', long:'적합', crypto:'주의', etf:'적합' },
    ISTJ: { short:'주의', real:'적합', startup:'주의', long:'적합', crypto:'주의', etf:'적합' },
    ESFJ: { short:'주의', real:'적합', startup:'주의', long:'적합', crypto:'주의', etf:'적합' },
    ISFJ: { short:'주의', real:'적합', startup:'주의', long:'적합', crypto:'주의', etf:'적합' },
    ESTP: { short:'적합', real:'보통', startup:'적합', long:'보통', crypto:'적합', etf:'보통' },
    ISTP: { short:'적합', real:'보통', startup:'보통', long:'보통', crypto:'보통', etf:'적합' },
    ESFP: { short:'적합', real:'주의', startup:'보통', long:'주의', crypto:'보통', etf:'보통' },
    ISFP: { short:'보통', real:'보통', startup:'보통', long:'적합', crypto:'주의', etf:'적합' }
  };
  var rm = JSON.parse(JSON.stringify(riskMap[archetype] || riskMap['ENTJ']));
  // ★ v66 연령 보정 완전판 — 6단계 × 6종목
  function _adj(cur, dir) {
    var order = ['주의','보통','적합'];
    var idx = order.indexOf(cur);
    if (idx === -1) return cur;
    return order[Math.min(2, Math.max(0, idx + dir))] || cur;
  }
  if (currentAge < 20) {
    // 10대: 단기·암호화폐 소폭 가능, 부동산·창업 하향
    rm.short   = _adj(rm.short,   +1);  // 단기 소액 경험 긍정
    rm.crypto  = _adj(rm.crypto,  +1);  // 소액 경험 가능
    rm.real    = _adj(rm.real,    -1);  // 부동산 접근 어려움
    rm.startup = _adj(rm.startup, -1);  // 창업 자금 부족
  } else if (currentAge < 30) {
    // 20대: 성장·단기·창업 상향, 부동산 유지
    rm.short   = _adj(rm.short,   +1);  // 단기 실행력 강점
    rm.startup = _adj(rm.startup, +1);  // 창업 적기
    rm.crypto  = _adj(rm.crypto,  +1);  // 위험 감수 가능
    rm.long    = _adj(rm.long,    +1);  // 장기 복리 최적기
  } else if (currentAge < 40) {
    // 30대: 전반적 균형, 장기·부동산 상향
    rm.long    = _adj(rm.long,    +1);  // 장기 복리 가속기
    rm.real    = _adj(rm.real,    +1);  // 부동산 진입 적기
    rm.startup = _adj(rm.startup,  0);  // 유지
  } else if (currentAge < 50) {
    // 40대: 창업·암호화폐 소폭 하향, 장기·부동산 상향
    rm.startup = _adj(rm.startup, -1);  // 리스크 자금 부담
    rm.crypto  = _adj(rm.crypto,  -1);  // 변동성 부담 증가
    rm.long    = _adj(rm.long,    +1);  // 장기 황금기
    rm.real    = _adj(rm.real,    +1);  // 부동산 수성
  } else if (currentAge < 60) {
    // 50대: 창업·암호화폐·단기 하향, 장기·ETF·부동산 상향
    rm.startup = _adj(rm.startup, -2);  // 창업 리스크 높음
    rm.crypto  = _adj(rm.crypto,  -2);  // 암호화폐 주의
    rm.short   = _adj(rm.short,   -1);  // 단기 변동성 부담
    rm.long    = _adj(rm.long,    +1);  // 장기 수성
    rm.etf     = _adj(rm.etf,     +1);  // ETF 안정형 선호
    rm.real    = _adj(rm.real,    +1);  // 부동산 수성
  } else if (currentAge < 70) {
    // 60대: 단기·창업·암호화폐 주의, 장기·ETF·부동산 최우선
    rm.startup = '주의';               // 창업 주의 고정
    rm.crypto  = '주의';               // 암호화폐 주의 고정
    rm.short   = _adj(rm.short,   -2); // 단기 투기 위험
    rm.long    = _adj(rm.long,    +1); // 장기 안정 수익
    rm.etf     = _adj(rm.etf,     +1); // ETF 배당·채권형
    rm.real    = _adj(rm.real,    +1); // 부동산 보유 유지
  } else {
    // 70대+: 유동성·ETF 최우선, 나머지 전반 하향
    rm.startup = '주의';
    rm.crypto  = '주의';
    rm.short   = '주의';
    rm.long    = _adj(rm.long,    +1); // 배당형 장기 유지
    rm.etf     = _adj(rm.etf,     +1); // ETF 배당·채권형 최우선
    rm.real    = _adj(rm.real,     0); // 부동산 보유는 유지
  }

  // ── 포트폴리오 (aiData 우선, 기본값은 에너지 밸런스 코어 기반)
  // ★ 포트폴리오 타입명 — 아키타입×에너지 밸런스 2중 교차 자동 생성 (AI 폴백 포함)
  var pfTypeMatrix = {
    '金': { Navigator:'전략적 수렴형', Analyst:'정밀 가치형', Visionary:'통찰 수렴형', Pragmatist:'안정 수렴형' },
    '木': { Navigator:'성장 개척형', Analyst:'데이터 성장형', Visionary:'비전 확장형', Pragmatist:'실용 성장형' },
    '火': { Navigator:'모멘텀 돌파형', Analyst:'퀀트 모멘텀형', Visionary:'열정 선도형', Pragmatist:'역동 실행형' },
    '土': { Navigator:'전략 안정형', Analyst:'복리 수호형', Visionary:'균형 통찰형', Pragmatist:'안정 복리형' },
    '水': { Navigator:'유연 전략형', Analyst:'흐름 분석형', Visionary:'지혜 균형형', Pragmatist:'유연 실용형' }
  };
  var pfDescMatrix = {
    '金': { Navigator:'분석과 결단으로 핵심 자산에 집중하는 전략가형 투자자입니다. 골든타임에 과감히 진입하고 손절 원칙을 엄수하십시오.',
            Analyst:'데이터 검증 후 가치 있는 자산에만 진입하는 정밀형 투자자입니다. 백테스트 기반 진입 기준을 명문화하십시오.',
            Visionary:'장기 흐름을 읽고 결정적 순간에 수렴하는 통찰형 투자자입니다. 직관과 데이터를 교차검증 후 진입하십시오.',
            Pragmatist:'안정성과 수익을 균형 있게 추구하는 실용형 투자자입니다. 자동화된 복리 시스템을 구축하십시오.' },
    '木': { Navigator:'새로운 성장 기회를 선점하는 개척형 투자자입니다. 타겟 3종을 사전 선정하고 골든타임에 과감히 진입하십시오.',
            Analyst:'데이터 기반으로 성장 섹터를 발굴하는 분석형 투자자입니다. 성장주와 테크 ETF 비중을 높이십시오.',
            Visionary:'미래 가치를 선제 포착하는 비전형 투자자입니다. 장기 보유 원칙으로 복리 효과를 극대화하십시오.',
            Pragmatist:'검증된 성장 자산에 집중하는 실용형 투자자입니다. 분산 투자와 손절 원칙을 병행하십시오.' },
    '火': { Navigator:'시장 모멘텀을 주도하는 돌파형 투자자입니다. 빠른 실행력을 유지하되 손절 기준선을 사전 설정하십시오.',
            Analyst:'퀀트 모델로 모멘텀을 검증하는 분석형 투자자입니다. 과열 구간 진입 시 포지션 크기를 제한하십시오.',
            Visionary:'시장 흐름을 선제 감지하는 선도형 투자자입니다. 직관 신호와 데이터 검증을 병행하십시오.',
            Pragmatist:'역동적 실행력으로 기회를 포착하는 투자자입니다. 충동 매매 방지를 위해 체크리스트를 의무화하십시오.' },
    '土': { Navigator:'안정 기반 위에 전략을 설계하는 투자자입니다. 코어-새틀라이트 전략으로 수익과 안정을 동시에 추구하십시오.',
            Analyst:'검증된 원칙으로 복리를 지키는 수호형 투자자입니다. 배당주·채권 중심으로 자동 적립 시스템을 구축하십시오.',
            Visionary:'장기 균형을 유지하는 통찰형 투자자입니다. 부동산·배당 중심 포트폴리오에 골든타임 성장 포지션을 추가하십시오.',
            Pragmatist:'안정적 복리를 추구하는 실용형 투자자입니다. 자동 리밸런싱 시스템으로 감정적 판단을 최소화하십시오.' },
    '水': { Navigator:'유연한 전략으로 시장 흐름을 타는 투자자입니다. 채권·유동성 자산 비중을 유지하며 골든타임에 핵심 포지션을 강화하십시오.',
            Analyst:'시장 사이클을 데이터로 분석하는 투자자입니다. 채권·외환 중심으로 변동성 구간에서 수익을 확보하십시오.',
            Visionary:'지혜와 유연성으로 균형을 잡는 투자자입니다. 장기 흐름 기반 분산 포트폴리오를 구성하십시오.',
            Pragmatist:'유동성을 중시하는 실용형 투자자입니다. 현금 흐름 중심 자산 배분으로 위기 대응력을 높이십시오.' }
  };
  var agMapPf = {ENTJ:'Navigator',ENTP:'Navigator',INTJ:'Navigator',INTP:'Navigator',ESTJ:'Analyst',ISTJ:'Analyst',ESTP:'Analyst',ISTP:'Analyst',ENFJ:'Visionary',INFJ:'Visionary',ENFP:'Visionary',INFP:'Visionary',ESFJ:'Pragmatist',ISFJ:'Pragmatist',ESFP:'Pragmatist',ISFP:'Pragmatist'};
  var pfAgGrp = agMapPf[archetype] || 'Navigator';
  var defaultPfType = (pfTypeMatrix[coreEl] || pfTypeMatrix['金'])[pfAgGrp] || '균형형 투자자';
  var defaultPfDesc = (pfDescMatrix[coreEl] || pfDescMatrix['金'])[pfAgGrp] || '공격과 방어를 균형 있게 배분하는 성향입니다.';
  var portfolioType = ss(ai.portfolio_type) || defaultPfType;
  var portfolioDesc = ss(ai.portfolio_desc) || defaultPfDesc;
  var portfolioInsight = ss(ai.portfolio_insight) || ss(ai.portfolioInsight) || '분산 포트폴리오로 리스크를 통제하며 골든타임 구간에 핵심 포지션을 강화하십시오.';

  // ★ 아키타입 × 에너지 밸런스 조합 포트폴리오 매트릭스 (16아키타입 × 5에너지 = 80가지)
  // 폴백: portfolioDefaultMap (에너지 밸런스 기본값)
  var pfComboMap = {
    // ── 金 코어 (결단·수렴형)
    'ESTJ_金': [['금현물·귀금속',35],['미국채ETF',25],['가치주·배당',20],['채권ETF',15],['현금',5]],
    'ISTJ_金': [['채권ETF',35],['금현물',25],['배당주',20],['가치주',15],['현금',5]],
    'ENTJ_金': [['성장주ETF',35],['금현물',25],['미국채ETF',20],['가치주',15],['현금',5]],
    'INTJ_金': [['미국채ETF',30],['금현물',25],['가치주·배당',25],['채권ETF',15],['현금',5]],
    'ESTP_金': [['성장주·테크',35],['금현물',20],['ETF',20],['채권',15],['현금',10]],
    'ISTP_金': [['금현물',35],['가치주',25],['채권ETF',20],['배당주',15],['현금',5]],
    'ENTP_金': [['나스닥ETF',35],['성장주',25],['금현물',20],['채권',15],['현금',5]],
    'INTP_金': [['미국채ETF',30],['금현물',30],['가치주',20],['채권ETF',15],['현금',5]],
    'ESFJ_金': [['배당주',35],['채권ETF',25],['금현물',20],['부동산REITs',15],['현금',5]],
    'ISFJ_金': [['채권ETF',35],['배당주',30],['금현물',20],['현금',15]],
    'ENFJ_金': [['성장주ETF',30],['배당주',25],['금현물',20],['채권ETF',20],['현금',5]],
    'INFJ_金': [['금현물',30],['미국채ETF',25],['가치주',25],['채권ETF',15],['현금',5]],
    'ESFP_金': [['성장주',35],['금현물',20],['ETF',20],['채권',15],['현금',10]],
    'ISFP_金': [['금현물',30],['배당주',25],['채권ETF',25],['가치주',15],['현금',5]],
    'ENFP_金': [['성장주ETF',30],['금현물',20],['글로벌ETF',25],['채권ETF',15],['현금',10]],
    'INFP_金': [['ESG펀드',30],['금현물',25],['채권ETF',25],['배당주',15],['현금',5]],
    // ── 水 코어 (유연·지혜형)
    'ESTJ_水': [['채권ETF',30],['글로벌ETF',25],['가치주',20],['금현물',15],['현금',10]],
    'INTJ_水': [['채권ETF',35],['글로벌ETF',25],['가치주',20],['금현물',10],['현금',10]],
    'ENTJ_水': [['글로벌ETF',35],['성장주',25],['채권ETF',20],['금현물',15],['현금',5]],
    'ISTJ_水': [['채권ETF',40],['글로벌ETF',25],['배당주',20],['현금',15]],
    // ── 木 코어 (성장·확장형)
    'ENTJ_木': [['나스닥ETF',40],['성장주·테크',30],['해외ETF',20],['현금',10]],
    'ENTP_木': [['성장주·테크',40],['나스닥ETF',30],['해외ETF',20],['현금',10]],
    'ENFP_木': [['성장주ETF',35],['해외ETF',30],['ESG펀드',20],['현금',15]],
    'ESTJ_木': [['성장주ETF',35],['해외ETF',25],['채권ETF',20],['가치주',15],['현금',5]],
    // ── 火 코어 (열정·도전형)
    'ENTJ_火': [['성장주·테크',40],['ETF',25],['채권',20],['현금',15]],
    'ESTP_火': [['성장주·테크',45],['ETF',25],['채권',20],['현금',10]],
    'ENFP_火': [['성장주ETF',40],['글로벌ETF',25],['ESG펀드',20],['현금',15]],
    // ── 土 코어 (안정·균형형)
    'ISFJ_土': [['부동산REITs',35],['배당주',30],['채권ETF',25],['현금',10]],
    'ISTJ_土': [['채권ETF',35],['부동산REITs',30],['배당주',25],['현금',10]],
    'ESFJ_土': [['부동산REITs',35],['배당주',25],['채권ETF',20],['가치주',15],['현금',5]],
    'ESTJ_土': [['부동산REITs',30],['채권ETF',25],['배당주',25],['가치주',15],['현금',5]],
  };

  var portfolioDefaultMap = {
    '木': [['성장주·테크', 35], ['해외ETF', 25], ['채권ETF', 15], ['배당주', 15], ['현금', 10]],
    '火': [['성장주·테크', 40], ['암호화폐', 20], ['ETF', 20], ['채권', 10], ['현금', 10]],
    '土': [['부동산REITs', 35], ['배당주', 25], ['채권ETF', 20], ['가치주', 10], ['현금', 10]],
    '金': [['금현물·귀금속', 35], ['미국채ETF', 25], ['가치주·배당', 15], ['채권ETF', 15], ['현금', 10]],
    '水': [['채권ETF', 30], ['글로벌ETF', 25], ['가치주', 20], ['금현물', 15], ['현금', 10]]
  };
  // ★ 아키타입×에너지 밸런스 조합 우선 → 없으면 에너지 밸런스 기본값 폴백
  var _pfKey = archetype + '_' + coreEl;
  var pfItems = pfComboMap[_pfKey] || portfolioDefaultMap[coreEl] || portfolioDefaultMap['金'];
  Logger.log('[PF] 포트폴리오 키: ' + _pfKey + ' → ' + (pfComboMap[_pfKey] ? '개인화' : '기본값'));

  // ── 금융 케미스트리
  var chemistryMap = {
    ENTJ: [
      { type:'INTJ', rank:'🥇 1순위', name:'전략적 탐험가', desc:'데이터 기반 장기 전략 설계. 리스크 헤지와 포지션 관리에 탁월', detail:'ENTJ의 실행력을 완벽히 보완하는 최강 조합' },
      { type:'ISTJ', rank:'🥈 2순위', name:'분석적 수호자', desc:'검증된 것만 신뢰하는 리스크 방어자. 안정적 복리 전략의 충실한 실행자', detail:'ENTJ의 판단력을 날카롭게 보완' },
      { type:'INFJ', rank:'🥉 3순위', name:'내면의 항해자', desc:'장기 흐름 독해와 위험 감지 직관 보유. 시장 분위기 변화를 선제 감지', detail:'단기 모멘텀 보완' }
    ],
    INTJ: [
      { type:'ENTJ', rank:'🥇 1순위', name:'혁신적 지휘관', desc:'빠른 실행력과 결단력으로 전략을 현실화', detail:'INTJ의 완벽주의를 실행으로 전환하는 최강 파트너' },
      { type:'INTP', rank:'🥈 2순위', name:'논리의 설계자', desc:'정밀한 데이터 모델링과 시스템적 사고', detail:'INTJ의 전략 depth를 극대화' },
      { type:'ENFJ', rank:'🥉 3순위', name:'이상적 전도사', desc:'시장 분위기와 감성적 흐름 포착', detail:'INTJ가 놓치는 인간적 신호 보완' }
    ],
    ENTP: [
      { type:'INTJ', rank:'🥇 1순위', name:'전략적 탐험가', desc:'아이디어에 구조와 실행 로드맵을 부여', detail:'ENTP의 혁신을 현실로 만드는 파트너' },
      { type:'ESTJ', rank:'🥈 2순위', name:'체계적 실행자', desc:'원칙과 시스템으로 ENTP의 분산을 통제', detail:'실행 완결성 극대화' },
      { type:'INFJ', rank:'🥉 3순위', name:'내면의 항해자', desc:'장기 흐름과 직관으로 과속 방지', detail:'리스크 감지 보완' }
    ],
    INTP: [
      { type:'ENTJ', rank:'🥇 1순위', name:'혁신적 지휘관', desc:'분석을 즉각 실행으로 전환하는 추진력', detail:'INTP의 모델을 시장에서 검증하는 파트너' },
      { type:'ESTJ', rank:'🥈 2순위', name:'체계적 실행자', desc:'구조적 실행과 원칙 준수로 안전판 역할', detail:'우유부단 극복 보완' },
      { type:'ENFP', rank:'🥉 3순위', name:'자유로운 창조자', desc:'직관과 에너지로 분석 마비 해소', detail:'실행 촉진 보완' }
    ],
    ENFJ: [
      { type:'INTJ', rank:'🥇 1순위', name:'전략적 탐험가', desc:'감정 독립적 데이터 분석으로 객관성 확보', detail:'ENFJ의 관계 편향을 보정하는 파트너' },
      { type:'ISTJ', rank:'🥈 2순위', name:'분석적 수호자', desc:'원칙과 검증으로 리스크 방어', detail:'ENFJ의 과신 방지' },
      { type:'INTP', rank:'🥉 3순위', name:'논리의 설계자', desc:'논리적 구조로 감성적 판단 점검', detail:'의사결정 품질 향상' }
    ],
    INFJ: [
      { type:'ENTJ', rank:'🥇 1순위', name:'혁신적 지휘관', desc:'직관을 현실 전략으로 전환하는 실행력', detail:'INFJ의 통찰을 시장에서 실현하는 파트너' },
      { type:'ESTJ', rank:'🥈 2순위', name:'체계적 실행자', desc:'시스템과 원칙으로 과도한 신중함 보완', detail:'진입 타이밍 최적화' },
      { type:'ENFP', rank:'🥉 3순위', name:'자유로운 창조자', desc:'에너지와 추진력으로 행동 촉진', detail:'과잉 분석 해소' }
    ],
    ENFP: [
      { type:'INTJ', rank:'🥇 1순위', name:'전략적 탐험가', desc:'열정을 체계적 전략으로 구조화', detail:'ENFP의 아이디어를 장기 포트폴리오로 전환' },
      { type:'ISTJ', rank:'🥈 2순위', name:'분석적 수호자', desc:'원칙과 손절 시스템으로 충동 방지', detail:'리스크 관리 최강 보완' },
      { type:'INFJ', rank:'🥉 3순위', name:'내면의 항해자', desc:'장기 흐름과 직관으로 과속 방지', detail:'감정 안정화 보완' }
    ],
    INFP: [
      { type:'ENTJ', rank:'🥇 1순위', name:'혁신적 지휘관', desc:'가치 기반 판단을 시장 전략으로 실행', detail:'INFP의 신념을 수익으로 연결' },
      { type:'ESTJ', rank:'🥈 2순위', name:'체계적 실행자', desc:'구조와 원칙으로 감정적 판단 보완', detail:'일관성 있는 포트폴리오 유지' },
      { type:'ENFJ', rank:'🥉 3순위', name:'이상적 전도사', desc:'네트워크와 정보로 시야 확장', detail:'고립 투자 리스크 감소' }
    ],
    ESTJ: [
      { type:'INTP', rank:'🥇 1순위', name:'논리의 설계자', desc:'유연한 사고로 경직성 보완', detail:'ESTJ의 원칙에 창의적 예외 적용' },
      { type:'ENFP', rank:'🥈 2순위', name:'자유로운 창조자', desc:'새로운 기회 발굴과 트렌드 감지', detail:'보수적 포트폴리오 확장 동력' },
      { type:'INFJ', rank:'🥉 3순위', name:'내면의 항해자', desc:'장기 흐름 독해로 단기 편향 보완', detail:'시장 사이클 조기 경보' }
    ],
    ISTJ: [
      { type:'ENTP', rank:'🥇 1순위', name:'번뜩이는 개척자', desc:'새로운 기회를 발굴하고 현실화', detail:'ISTJ의 보수성에 성장 동력 주입' },
      { type:'ENFP', rank:'🥈 2순위', name:'자유로운 창조자', desc:'트렌드 감지와 빠른 기회 포착', detail:'골든타임 진입 촉진' },
      { type:'ENTJ', rank:'🥉 3순위', name:'혁신적 지휘관', desc:'전략적 결단으로 과도한 신중함 해소', detail:'수익 기회 극대화' }
    ],
    ESFJ: [
      { type:'INTJ', rank:'🥇 1순위', name:'전략적 탐험가', desc:'감정 독립적 데이터 분석', detail:'ESFJ의 타인 의존도를 객관성으로 보완' },
      { type:'ISTJ', rank:'🥈 2순위', name:'분석적 수호자', desc:'원칙 기반 리스크 방어', detail:'안정적 복리 전략 실행' },
      { type:'INTP', rank:'🥉 3순위', name:'논리의 설계자', desc:'논리적 검증으로 추천 종목 2차 점검', detail:'의사결정 품질 향상' }
    ],
    ISFJ: [
      { type:'ENTJ', rank:'🥇 1순위', name:'혁신적 지휘관', desc:'결단력으로 과도한 안정 추구 보완', detail:'ISFJ의 기회 포착력 극대화' },
      { type:'ENTP', rank:'🥈 2순위', name:'번뜩이는 개척자', desc:'새로운 투자 기회 발굴 촉진', detail:'포트폴리오 성장 동력 주입' },
      { type:'ESTJ', rank:'🥉 3순위', name:'체계적 실행자', desc:'시스템화된 투자 원칙 공유', detail:'복리 자동화 파트너' }
    ],
    ESTP: [
      { type:'INTJ', rank:'🥇 1순위', name:'전략적 탐험가', desc:'단기 실행에 장기 전략 구조화', detail:'ESTP의 매매를 포트폴리오로 전환' },
      { type:'ISTJ', rank:'🥈 2순위', name:'분석적 수호자', desc:'원칙과 손절 시스템으로 충동 억제', detail:'리스크 관리 최강 보완' },
      { type:'INFJ', rank:'🥉 3순위', name:'내면의 항해자', desc:'시장 분위기 변화 선제 감지', detail:'과열 경보 시스템 보완' }
    ],
    ISTP: [
      { type:'ENTJ', rank:'🥇 1순위', name:'혁신적 지휘관', desc:'분석을 빠른 실행으로 전환', detail:'ISTP의 정밀도를 시장에서 실현' },
      { type:'ENFP', rank:'🥈 2순위', name:'자유로운 창조자', desc:'감성과 트렌드로 냉철함 보완', detail:'시장 분위기 감지 보완' },
      { type:'INFJ', rank:'🥉 3순위', name:'내면의 항해자', desc:'장기 흐름 독해 역량 보완', detail:'단기 편향 해소' }
    ],
    ESFP: [
      { type:'INTJ', rank:'🥇 1순위', name:'전략적 탐험가', desc:'장기 전략으로 충동 소비 구조화', detail:'ESFP의 에너지를 복리로 전환' },
      { type:'ISTJ', rank:'🥈 2순위', name:'분석적 수호자', desc:'자동화 저축 시스템 구축 파트너', detail:'장기 자산 형성 기반 강화' },
      { type:'INFJ', rank:'🥉 3순위', name:'내면의 항해자', desc:'미래 흐름 독해로 현재 집중 보완', detail:'장기 관점 확장' }
    ],
    ISFP: [
      { type:'ENTJ', rank:'🥇 1순위', name:'혁신적 지휘관', desc:'결단력으로 망설임 극복', detail:'ISFP의 직관을 실행으로 연결' },
      { type:'ESTJ', rank:'🥈 2순위', name:'체계적 실행자', desc:'원칙과 시스템으로 감성 판단 구조화', detail:'일관된 포트폴리오 관리' },
      { type:'INTP', rank:'🥉 3순위', name:'논리의 설계자', desc:'논리적 검증으로 직관 보정', detail:'객관성 확보' }
    ]
  };
  var chemList = chemistryMap[archetype] || chemistryMap['ENTJ'];

  // ── 리스크 클래스
  function rc(v) {
    if (v === '적합') return 'risk-fit';
    if (v === '주의') return 'risk-warn';
    return 'risk-neutral';
  }

  // ════════════════════════════════════════════════════════════════
  //  HTML 생성 시작
  // ════════════════════════════════════════════════════════════════
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<style>
*{margin:0;padding:0;box-sizing:border-box}
@page{size:A4;margin:0}
body{font-family:"Malgun Gothic","Apple SD Gothic Neo",sans-serif;background:#ffffff;color:#0D1B2A;font-size:13px;line-height:1.6;width:794px;margin:0 auto;-webkit-print-color-adjust:exact;print-color-adjust:exact}

/* ── 커버 */
.cover{background:linear-gradient(145deg,#071523 0%,#0D1B2A 50%,#122840 100%);color:#fff;padding:52px 56px 48px;position:relative;overflow:hidden;page-break-after:always}
.cover-grid{position:absolute;top:0;left:0;right:0;bottom:0;background-image:linear-gradient(rgba(45,140,255,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(45,140,255,.07) 1px,transparent 1px);background-size:40px 40px}
.cover-accent{position:absolute;top:-80px;right:-80px;width:360px;height:360px;background:radial-gradient(circle,rgba(240,198,116,.18) 0%,transparent 70%);border-radius:50%}
.cover-inner{position:relative;z-index:2}
.cover-logo-row{display:flex;align-items:center;gap:12px;margin-bottom:48px}
.cover-logo{width:44px;height:44px;background:linear-gradient(135deg,#F0C674,#d4a853);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;color:#071523}
.cover-brand-name{font-size:19px;font-weight:800;color:#F0C674;letter-spacing:1px}
.cover-brand-sub{font-size:11px;color:#94A3B8;letter-spacing:2px;margin-top:1px}
.cover-divider{width:60px;height:3px;background:linear-gradient(90deg,#F0C674,#2D8CFF);border-radius:2px;margin-bottom:28px}
.cover-tagline{font-size:15px;color:#94A3B8;margin-bottom:32px;letter-spacing:.5px}
.cover-name{font-size:36px;font-weight:900;color:#fff;margin-bottom:8px;letter-spacing:-1px}
.cover-title{font-size:17px;color:#F0C674;margin-bottom:40px;letter-spacing:1px}
.cover-cards{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:16px;margin-bottom:40px}
.ccard{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:16px 14px}
.ccard-label{font-size:10px;color:#94A3B8;letter-spacing:2px;margin-bottom:8px;text-transform:uppercase}
.ccard-value{font-size:22px;font-weight:900;color:#F0C674;line-height:1}
.ccard-sub{font-size:11px;color:#E2E8F0;margin-top:4px}
.cover-footer{border-top:1px solid rgba(255,255,255,.1);padding-top:16px;font-size:10px;color:#64748B;display:flex;justify-content:space-between}

/* ── 섹션 공통 */
.section{background:#0D1B2A;color:#E2E8F0;padding:40px 48px;page-break-inside:avoid}
.section-alt{background:#071523}
.section-header{display:flex;align-items:center;gap:12px;margin-bottom:24px}
.section-num{font-size:10px;font-weight:700;color:#F0C674;letter-spacing:3px;text-transform:uppercase}
.section-title{font-size:22px;font-weight:800;color:#fff}
.section-divider{width:40px;height:2px;background:linear-gradient(90deg,#F0C674,#2D8CFF);border-radius:2px;margin-bottom:20px}

/* ── 정보 박스 (S02, S05) */
.info-box{background:rgba(45,140,255,.1);border:1px solid rgba(45,140,255,.3);border-radius:10px;padding:14px 18px;margin-bottom:22px;font-size:12px;color:#94A3B8;line-height:1.7}
.info-box strong{color:#2D8CFF}

/* ── S01 아키타입 */
.at-hero{background:linear-gradient(135deg,rgba(240,198,116,.12),rgba(45,140,255,.08));border:1px solid rgba(240,198,116,.25);border-radius:16px;padding:28px;margin-bottom:22px;text-align:center}
.at-type{font-size:56px;font-weight:900;color:#F0C674;letter-spacing:6px;line-height:1}
.at-name{font-size:20px;font-weight:700;color:#fff;margin-top:8px}
.at-sub{font-size:13px;color:#94A3B8;margin-top:4px}
.at-core{font-size:14px;color:#E2E8F0;margin-top:16px;padding:16px;background:rgba(255,255,255,.04);border-radius:10px;line-height:1.8}
.at-cards{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-top:18px}
.at-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:18px 14px}
.at-card-icon{font-size:20px;margin-bottom:8px}
.at-card-label{font-size:10px;color:#94A3B8;letter-spacing:2px;margin-bottom:6px;text-transform:uppercase}
.at-card-text{font-size:12px;color:#E2E8F0;line-height:1.6}

/* ── S02 N-Score */
.nscore-display{text-align:center;margin-bottom:28px}
.nscore-value{font-size:80px;font-weight:900;color:#F0C674;line-height:1;letter-spacing:-3px}
.nscore-grade{font-size:18px;font-weight:700;color:#E2E8F0;margin-top:8px}
.nscore-top{font-size:13px;color:#94A3B8;margin-top:4px}
.nscore-bar-wrap{margin:24px 0}
.nscore-bar-labels{display:flex;justify-content:space-between;margin-bottom:8px}
.nscore-bar-label{font-size:11px;color:#94A3B8;font-weight:600}
.nscore-bar-track{background:rgba(255,255,255,.07);border-radius:8px;height:20px;position:relative;overflow:hidden}
.nscore-bar-fill{height:100%;border-radius:8px;background:linear-gradient(90deg,#2D8CFF,#F0C674);transition:width .3s}
.nscore-bar-marker{position:absolute;top:0;height:100%;width:3px;background:#fff;border-radius:2px}
.nscore-grades-row{position:relative;margin-top:6px;height:18px}
.ng-item{position:absolute;transform:translateX(-50%);text-align:center;font-size:9px;color:#64748B;letter-spacing:.5px}
.ng-item.active{color:#F0C674;font-weight:700}

/* ── S03 지표 */
.kpi-desc{font-size:12px;color:#94A3B8;margin-bottom:6px;line-height:1.6}
.kpi-footnote{font-size:11px;color:#64748B;margin-bottom:20px;padding:8px 12px;background:rgba(255,255,255,.04);border-radius:6px;border-left:3px solid #F0C674}
.kpi-cards{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px}
.kpi-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:22px 18px}
.kpi-icon{font-size:24px;margin-bottom:12px}
.kpi-name{font-size:12px;color:#94A3B8;margin-bottom:4px}
.kpi-score{font-size:32px;font-weight:900;color:#F0C674;line-height:1}
.kpi-rank{font-size:11px;color:#2D8CFF;margin-top:4px;font-weight:600}
.kpi-bar-track{background:rgba(255,255,255,.07);border-radius:4px;height:6px;margin-top:10px}
.kpi-bar-fill{height:100%;border-radius:4px;background:linear-gradient(90deg,#2D8CFF,#F0C674)}
.kpi-text{font-size:11px;color:#64748B;margin-top:10px;line-height:1.5}
.kpi-summary{margin-top:20px;padding:14px 18px;background:rgba(240,198,116,.08);border:1px solid rgba(240,198,116,.2);border-radius:10px;font-size:12px;color:#E2E8F0;line-height:1.7}

/* ── S04 에너지 */
.energy-bars{margin:20px 0}
.ebar-row{display:flex;align-items:center;gap:12px;margin-bottom:12px}
.ebar-label{width:80px;font-size:12px;color:#E2E8F0;font-weight:600}
.ebar-track{flex:1;background:rgba(255,255,255,.07);border-radius:4px;height:10px;overflow:hidden}
.ebar-fill{height:100%;border-radius:4px}
.ebar-pct{width:36px;text-align:right;font-size:11px;color:#94A3B8}
.energy-core{margin-top:24px;padding:20px;background:rgba(255,255,255,.04);border-radius:12px}
.ec-title{font-size:13px;font-weight:700;color:#F0C674;margin-bottom:10px}
.ec-desc{font-size:12px;color:#E2E8F0;line-height:1.7}

/* ── S05 골든타임 */
.gt-best-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:22px}
.gt-best{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:20px 16px;text-align:center}
.gt-best.first{border-color:rgba(240,198,116,.4);background:rgba(240,198,116,.08)}
.gt-rank{font-size:20px;margin-bottom:6px}
.gt-month{font-size:18px;font-weight:800;color:#F0C674}
.gt-stars{font-size:12px;color:#F0C674;margin:4px 0}
.gt-label{font-size:11px;color:#94A3B8}
.gt-strategy-box{background:rgba(45,140,255,.08);border:1px solid rgba(45,140,255,.25);border-radius:12px;padding:18px 20px;margin-bottom:16px}
.gt-strategy-title{font-size:12px;font-weight:700;color:#2D8CFF;margin-bottom:12px;display:flex;align-items:center;gap:6px}
.gt-strategy-item{font-size:12px;color:#E2E8F0;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.06);line-height:1.6}
.gt-strategy-item:last-child{border-bottom:none}
.gt-strategy-bullet{color:#F0C674;margin-right:6px;font-weight:700}
.gt-caution{background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.25);border-radius:12px;padding:18px 20px}
.gt-caution-title{font-size:13px;font-weight:700;color:#EF4444;margin-bottom:10px;display:flex;align-items:center;gap:6px}
.gt-caution-icons{display:flex;gap:12px;flex-wrap:wrap}
.gt-caution-item{font-size:11px;color:#E2E8F0;display:flex;align-items:center;gap:4px}

/* ── S06 히트맵 */
.risk-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}
.risk-card{background:rgba(255,255,255,.05);border-radius:12px;padding:18px 14px;text-align:center;border:1px solid rgba(255,255,255,.08)}
.risk-icon{font-size:24px;margin-bottom:8px}
.risk-name{font-size:12px;color:#94A3B8;margin-bottom:6px}
.risk-badge{font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;display:inline-block}
.risk-fit{background:rgba(34,197,94,.15);color:#22C55E;border:1px solid rgba(34,197,94,.3)}
.risk-warn{background:rgba(239,68,68,.15);color:#EF4444;border:1px solid rgba(239,68,68,.3)}
.risk-neutral{background:rgba(148,163,184,.15);color:#94A3B8;border:1px solid rgba(148,163,184,.2)}

/* ── S07 포트폴리오 */
.pf-type-box{background:rgba(240,198,116,.08);border:1px solid rgba(240,198,116,.25);border-radius:12px;padding:18px 20px;margin-bottom:20px}
.pf-type-name{font-size:15px;font-weight:800;color:#F0C674;margin-bottom:6px}
.pf-type-desc{font-size:12px;color:#E2E8F0;line-height:1.7}
.pf-bars{margin:16px 0}
.pfbar-row{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.pfbar-label{width:120px;font-size:12px;color:#E2E8F0}
.pfbar-track{flex:1;background:rgba(255,255,255,.07);border-radius:4px;height:8px;overflow:hidden}
.pfbar-fill{height:100%;border-radius:4px;background:linear-gradient(90deg,#2D8CFF,#F0C674)}
.pfbar-pct{width:36px;text-align:right;font-size:11px;color:#94A3B8}
.pf-ai-box{background:rgba(45,140,255,.08);border:1px solid rgba(45,140,255,.2);border-radius:10px;padding:14px 18px;font-size:12px;color:#E2E8F0;line-height:1.7}
.pf-ai-icon{font-size:16px;margin-right:6px}

/* ── S08 로드맵 */
.roadmap-age{background:rgba(240,198,116,.08);border:1px solid rgba(240,198,116,.2);border-radius:12px;padding:16px 20px;margin-bottom:16px}
.roadmap-age-label{font-size:14px;font-weight:800;color:#F0C674;margin-bottom:6px}
.roadmap-age-desc{font-size:12px;color:#E2E8F0;line-height:1.7}
.roadmap-season{background:rgba(45,140,255,.07);border:1px solid rgba(45,140,255,.2);border-radius:10px;padding:12px 18px;margin-bottom:20px;font-size:12px;color:#E2E8F0;line-height:1.7}
.roadmap-season-label{font-weight:700;color:#2D8CFF;margin-right:6px}
.roadmap-cards{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:18px}
.rm-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:18px 14px;text-align:center}
.rm-label{font-size:10px;color:#94A3B8;letter-spacing:1px;margin-bottom:8px}
.rm-score{font-size:28px;font-weight:900;color:#F0C674;line-height:1}
.rm-grade{font-size:11px;color:#E2E8F0;margin-top:4px}
.rm-diff{font-size:11px;color:#22C55E;margin-top:4px;font-weight:600}
.rm-actions{background:rgba(255,255,255,.04);border-radius:10px;padding:14px 18px}
.rm-action-title{font-size:11px;font-weight:700;color:#F0C674;margin-bottom:8px;letter-spacing:1px}
.rm-action-item{font-size:12px;color:#E2E8F0;padding:4px 0;line-height:1.6}
.rm-goal-box{margin-top:12px;padding:12px 16px;background:rgba(240,198,116,.06);border-radius:8px;border-left:3px solid #F0C674;font-size:12px;color:#E2E8F0;line-height:1.7}

/* ── S09 에너지 공명 */
.resonance-table{width:100%;border-collapse:collapse}
.resonance-table th{background:rgba(255,255,255,.05);color:#94A3B8;font-size:10px;letter-spacing:2px;padding:10px 12px;text-align:left;border-bottom:1px solid rgba(255,255,255,.07)}
.resonance-table td{padding:14px 12px;border-bottom:1px solid rgba(255,255,255,.05);font-size:12px;color:#E2E8F0;vertical-align:top}
.resonance-table tr:last-child td{border-bottom:none}
.react-label{font-size:10px;color:#94A3B8;font-weight:600;margin-bottom:2px}
.react-detail{font-size:11px;color:#64748B;margin-top:4px;line-height:1.5}
.stars-gold{color:#F0C674}

/* ── S10 케미스트리 */
.chem-cards{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:20px}
.chem-card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:20px 14px}
.chem-card.first{border-color:rgba(240,198,116,.3);background:rgba(240,198,116,.06)}
.chem-rank{font-size:13px;margin-bottom:8px}
.chem-type{font-size:22px;font-weight:900;color:#F0C674}
.chem-name{font-size:12px;color:#E2E8F0;margin-top:4px;font-weight:600}
.chem-desc{font-size:11px;color:#94A3B8;margin-top:8px;line-height:1.6}
.chem-detail{font-size:11px;color:#2D8CFF;margin-top:6px;font-weight:600}
.chem-explain{background:rgba(45,140,255,.07);border:1px solid rgba(45,140,255,.2);border-radius:10px;padding:16px 18px;font-size:12px;color:#E2E8F0;line-height:1.7}
.chem-explain strong{color:#2D8CFF}

/* ── 푸터 */
.report-footer{background:#040D16;padding:20px 48px;page-break-before:avoid}
.footer-inner{display:flex;justify-content:space-between;align-items:center;border-top:1px solid rgba(255,255,255,.07);padding-top:16px}
.footer-left{font-size:10px;color:#64748B;line-height:1.8}
.footer-right{font-size:10px;color:#64748B;text-align:right;line-height:1.8}
.footer-disclaimer{font-size:9px;color:#475569;margin-top:10px;line-height:1.6;border-top:1px solid rgba(255,255,255,.04);padding-top:10px}
</style>
</head>
<body>

<!-- ══════════ COVER ══════════ -->
<div class="cover">
  <div class="cover-grid"></div>
  <div class="cover-accent"></div>
  <div class="cover-inner">
    <div class="cover-logo-row">
      <div class="cover-logo">N</div>
      <div>
        <div class="cover-brand-name">N·KAI</div>
        <div class="cover-brand-sub">YOUR FINANCIAL DNA</div>
      </div>
      <div style="margin-left:auto;font-size:11px;color:#94A3B8;letter-spacing:1px">${tier === 'premium' ? '✦ PREMIUM REPORT · 나만의 금융 행동 패턴 완전 분석' : '✦ STANDARD REPORT · 나만의 금융 행동 패턴 분석'}</div>
    </div>
    <div class="cover-divider"></div>
    <div class="cover-tagline">${name}님의 금융 DNA 완전 분석 리포트</div>
    <div class="cover-name" style="color:#F0C674">${atTag}</div>
    <div class="cover-title" style="margin-top:8px;color:#94A3B8;font-size:14px">ARCHETYPE · ${archetype} · ${atName}</div>
    <div style="margin-top:8px;display:inline-block;background:rgba(45,140,255,.12);border:1px solid rgba(45,140,255,.3);border-radius:20px;padding:4px 14px;font-size:10px;color:#5AA8FF;letter-spacing:.5px">
      ※ MBTI와 유사해 보이지만 다릅니다 — 생년월일 + 금융 행동 진단 16문항 + 소비 행동 패턴 4가지 3중 융합 분석 결과입니다
    </div>
    ${tier === 'premium' ? '<div style="display:inline-block;margin-top:14px;background:linear-gradient(135deg,#F0C674,#d4a853);color:#071523;font-size:10px;font-weight:900;letter-spacing:2px;padding:5px 16px;border-radius:20px">★ PREMIUM EXCLUSIVE · S11~S17 포함</div>' : ''}
    <div class="cover-cards" style="margin-top:32px">
      <div class="ccard">
        <div class="ccard-label">ARCHETYPE</div>
        <div class="ccard-value" style="font-size:26px">${archetype}</div>
        <div class="ccard-sub">${atName}</div>
        <div class="ccard-sub" style="font-size:10px;color:#64748B;margin-top:2px">${atSub}</div>
      </div>
      <div class="ccard">
        <div class="ccard-label">N-SCORE</div>
        <div class="ccard-value">${nscore}</div>
        <div class="ccard-sub">${ngrade} 등급</div>
      </div>
      <div class="ccard">
        <div class="ccard-label">CORE ELEMENT</div>
        <div class="ccard-value">${elName}</div>
        <div class="ccard-sub">${elKo}</div>
      </div>
      <div class="ccard">
        <div class="ccard-label">분석일자</div>
        <div class="ccard-value" style="font-size:14px">${today}</div>
        <div class="ccard-sub">AI 기준일</div>
      </div>
    </div>

    <div class="cover-footer">
      <div>뉴린카이로스에이아이(주) · https://www.neurinkairosai.com · 172-87-03400</div>
      <div>${name}님 전용 리포트</div>
    </div>
  </div>
</div>

<!-- ══════════ 목차 (TABLE OF CONTENTS) ══════════ -->
<div class="section" style="page-break-before:always">
  <!-- 목차 헤더 -->
  <div style="text-align:center;margin-bottom:28px;">
    <div style="font-size:10px;letter-spacing:4px;color:#475569;margin-bottom:10px">CONTENTS</div>
    <div style="font-size:26px;font-weight:900;color:#F1F5F9;letter-spacing:2px">목차</div>
    <div style="width:60px;height:2px;background:linear-gradient(90deg,#C9A84C,#F0E080,#C9A84C);margin:10px auto 0;border-radius:2px;"></div>
  </div>

  <!-- Standard 섹션 그룹 -->
  <div style="margin-bottom:18px;">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;padding:6px 12px;background:rgba(45,140,255,.08);border-radius:8px;border-left:3px solid #2D8CFF;">
      <span style="font-size:10px;font-weight:700;color:#2D8CFF;letter-spacing:1px">STANDARD</span>
      <span style="font-size:9px;color:#2D8CFF">S01 – S10 · 기본 포함</span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 14px;">
    <a href="#sec01" style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:rgba(45,140,255,.05);border-radius:8px;text-decoration:none;border:1px solid rgba(45,140,255,.15);">
      <span style="font-size:10px;color:#5AA8FF;font-weight:700;min-width:24px">01</span>
      <span style="font-size:11px;color:#E2E8F0;">나의 금융 투자 유형 분석</span>
    </a>
    <a href="#sec02" style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:rgba(45,140,255,.05);border-radius:8px;text-decoration:none;border:1px solid rgba(45,140,255,.15);">
      <span style="font-size:10px;color:#5AA8FF;font-weight:700;min-width:24px">02</span>
      <span style="font-size:11px;color:#E2E8F0;">N-Score 금융 성향 지수</span>
    </a>
    <a href="#sec03" style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:rgba(45,140,255,.05);border-radius:8px;text-decoration:none;border:1px solid rgba(45,140,255,.15);">
      <span style="font-size:10px;color:#5AA8FF;font-weight:700;min-width:24px">03</span>
      <span style="font-size:11px;color:#E2E8F0;">3대 핵심 금융 지표</span>
    </a>
    <a href="#sec04" style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:rgba(45,140,255,.05);border-radius:8px;text-decoration:none;border:1px solid rgba(45,140,255,.15);">
      <span style="font-size:10px;color:#5AA8FF;font-weight:700;min-width:24px">04</span>
      <span style="font-size:11px;color:#E2E8F0;">코어 에너지 — 5-Energy</span>
    </a>
    <a href="#sec05" style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:rgba(45,140,255,.05);border-radius:8px;text-decoration:none;border:1px solid rgba(45,140,255,.15);">
      <span style="font-size:10px;color:#5AA8FF;font-weight:700;min-width:24px">05</span>
      <span style="font-size:11px;color:#E2E8F0;">골든타임 캘린더</span>
    </a>
    <a href="#sec06" style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:rgba(45,140,255,.05);border-radius:8px;text-decoration:none;border:1px solid rgba(45,140,255,.15);">
      <span style="font-size:10px;color:#5AA8FF;font-weight:700;min-width:24px">06</span>
      <span style="font-size:11px;color:#E2E8F0;">투자 리스크 히트맵</span>
    </a>
    <a href="#sec07" style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:rgba(45,140,255,.05);border-radius:8px;text-decoration:none;border:1px solid rgba(45,140,255,.15);">
      <span style="font-size:10px;color:#5AA8FF;font-weight:700;min-width:24px">07</span>
      <span style="font-size:11px;color:#E2E8F0;">맞춤 포트폴리오</span>
    </a>
    <a href="#sec08" style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:rgba(45,140,255,.05);border-radius:8px;text-decoration:none;border:1px solid rgba(45,140,255,.15);">
      <span style="font-size:10px;color:#5AA8FF;font-weight:700;min-width:24px">08</span>
      <span style="font-size:11px;color:#E2E8F0;">N-Score 성장 로드맵</span>
    </a>
    <a href="#sec09" style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:rgba(45,140,255,.05);border-radius:8px;text-decoration:none;border:1px solid rgba(45,140,255,.15);">
      <span style="font-size:10px;color:#5AA8FF;font-weight:700;min-width:24px">09</span>
      <span style="font-size:11px;color:#E2E8F0;">에너지 공명 분석</span>
    </a>
    <a href="#sec10" style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:rgba(45,140,255,.05);border-radius:8px;text-decoration:none;border:1px solid rgba(45,140,255,.15);">
      <span style="font-size:10px;color:#5AA8FF;font-weight:700;min-width:24px">10</span>
      <span style="font-size:11px;color:#E2E8F0;">금융 케미스트리 궁합</span>
    </a>
    </div><!-- /Standard grid -->
  </div><!-- /Standard group -->

  <!-- Premium 섹션 그룹 (Premium만 표시) -->
  ${tier === 'premium' ? '<div style=\"margin-bottom:14px;margin-top:16px;border-top:2px solid rgba(240,198,116,.25);padding-top:14px;\"><div style=\"display:flex;align-items:center;gap:8px;margin-bottom:10px;padding:6px 12px;background:rgba(240,198,116,.08);border-radius:8px;border-left:3px solid #C9A84C;\"><span style=\"font-size:10px;font-weight:700;color:#C9A84C;letter-spacing:1px\">PREMIUM ★</span><span style=\"font-size:9px;color:#475569\">S11 – S20</span></div><div style=\"display:grid;grid-template-columns:1fr 1fr;gap:6px 14px;\">' : ''}
    ${tier === 'premium' ? '<a href="#sec11" style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:rgba(240,198,116,.04);border-radius:8px;text-decoration:none;border:1px solid rgba(240,198,116,.15);"><span style="font-size:10px;color:#C9A84C;font-weight:700;min-width:24px">11</span><span style="font-size:11px;color:#E2E8F0;">행동 예측 시나리오</span><span style="font-size:9px;color:#C9A84C;margin-left:auto">★</span></a>' : ''}
    ${tier === 'premium' ? '<a href="#sec12" style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:rgba(240,198,116,.04);border-radius:8px;text-decoration:none;border:1px solid rgba(240,198,116,.15);"><span style="font-size:10px;color:#C9A84C;font-weight:700;min-width:24px">12</span><span style="font-size:11px;color:#E2E8F0;">3개월 액션 체크리스트</span><span style="font-size:9px;color:#C9A84C;margin-left:auto">★</span></a>' : ''}
    ${tier === 'premium' ? '<a href="#sec13" style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:rgba(240,198,116,.04);border-radius:8px;text-decoration:none;border:1px solid rgba(240,198,116,.15);"><span style="font-size:10px;color:#C9A84C;font-weight:700;min-width:24px">13</span><span style="font-size:11px;color:#E2E8F0;">카이로스 선언문</span><span style="font-size:9px;color:#C9A84C;margin-left:auto">★</span></a>' : ''}
    ${tier === 'premium' ? '<a href="#sec14" style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:rgba(240,198,116,.04);border-radius:8px;text-decoration:none;border:1px solid rgba(240,198,116,.15);"><span style="font-size:10px;color:#C9A84C;font-weight:700;min-width:24px">14</span><span style="font-size:11px;color:#E2E8F0;">카이로스 타이밍 점수</span><span style="font-size:9px;color:#C9A84C;margin-left:auto">★</span></a>' : ''}
    ${tier === 'premium' ? '<a href="#sec15" style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:rgba(240,198,116,.04);border-radius:8px;text-decoration:none;border:1px solid rgba(240,198,116,.15);"><span style="font-size:10px;color:#C9A84C;font-weight:700;min-width:24px">15</span><span style="font-size:11px;color:#E2E8F0;">연간 히트맵 캘린더</span><span style="font-size:9px;color:#C9A84C;margin-left:auto">★</span></a>' : ''}
    ${tier === 'premium' ? '<a href="#sec16" style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:rgba(240,198,116,.04);border-radius:8px;text-decoration:none;border:1px solid rgba(240,198,116,.15);"><span style="font-size:10px;color:#C9A84C;font-weight:700;min-width:24px">16</span><span style="font-size:11px;color:#E2E8F0;">상위 10% 갭 분석</span><span style="font-size:9px;color:#C9A84C;margin-left:auto">★</span></a>' : ''}
    ${tier === 'premium' ? '<a href="#sec17" style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:rgba(240,198,116,.04);border-radius:8px;text-decoration:none;border:1px solid rgba(240,198,116,.15);"><span style="font-size:10px;color:#C9A84C;font-weight:700;min-width:24px">17</span><span style="font-size:11px;color:#E2E8F0;">30일 골든 액션플랜</span><span style="font-size:9px;color:#C9A84C;margin-left:auto">★</span></a>' : ''}
    ${tier === 'premium' ? '<a href="#sec18" style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:rgba(240,198,116,.04);border-radius:8px;text-decoration:none;border:1px solid rgba(240,198,116,.15);"><span style="font-size:10px;color:#C9A84C;font-weight:700;min-width:24px">18</span><span style="font-size:11px;color:#E2E8F0;">행동 예측 레이더</span><span style="font-size:9px;color:#C9A84C;margin-left:auto">★</span></a>' : ''}
    ${tier === 'premium' ? '<a href="#sec19" style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:rgba(240,198,116,.04);border-radius:8px;text-decoration:none;border:1px solid rgba(240,198,116,.15);"><span style="font-size:10px;color:#C9A84C;font-weight:700;min-width:24px">19</span><span style="font-size:11px;color:#E2E8F0;">재무 위험 면역지도</span><span style="font-size:9px;color:#C9A84C;margin-left:auto">★</span></a>' : ''}
    ${tier === 'premium' ? '<a href="#sec20" style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:rgba(240,198,116,.04);border-radius:8px;text-decoration:none;border:1px solid rgba(240,198,116,.15);"><span style="font-size:10px;color:#C9A84C;font-weight:700;min-width:24px">20</span><span style="font-size:11px;color:#E2E8F0;">금융 DNA 공유 카드</span><span style="font-size:9px;color:#C9A84C;margin-left:auto">★</span></a>' : ''}
    ${tier === 'premium' ? '</div></div>' : ''}
  ${tier === 'premium' ? '<div style="margin-top:16px;display:flex;align-items:center;justify-content:center;gap:12px;font-size:9px;color:#475569;"><span style="display:flex;align-items:center;gap:4px;"><span style="width:8px;height:8px;background:#2D8CFF;border-radius:2px;display:inline-block;"></span> Standard 포함</span><span style="display:flex;align-items:center;gap:4px;"><span style="width:8px;height:8px;background:#C9A84C;border-radius:2px;display:inline-block;"></span> Premium 전용</span></div>' : ''}
</div>


<!-- ══════════ S01 아키타입 ══════════ -->
<div class="section">
  <!-- Phase 1 투명성 안내 박스 -->
  <div style="background:rgba(45,140,255,.06);border:1px solid rgba(45,140,255,.2);border-radius:10px;padding:12px 16px;margin-bottom:18px;display:flex;align-items:flex-start;gap:10px">
    <div style="font-size:16px;flex-shrink:0">ℹ️</div>
    <div style="font-size:11px;color:#64748B;line-height:1.8">
      <strong style="color:#94A3B8">N-KAI Phase 1 운영 중</strong><br>
      현재 리포트는 <strong style="color:#E2E8F0">KIPA 행동 설문 + 생년월일 기반 금융 행동 패턴 분석</strong>으로 생성됩니다.<br>
      카드 결제 데이터 연동(Phase 2) 시 AI 실시간 개인화가 추가되어 더욱 정밀해집니다.
    </div>
  </div>
  <div class="section-num" id="sec01">SECTION 01</div>
  <div class="section-title">나의 금융 투자 유형 분석 — ${archetype}</div>
  <div class="section-divider"></div>
  <div style="background:rgba(255,255,255,.04);border-left:3px solid #F0C674;border-radius:0 8px 8px 0;padding:10px 14px;margin-bottom:16px;font-size:11px;color:#CBD5E1;line-height:1.6;">
    💡 <strong style="color:#F1F5F9;">이 섹션은?</strong> AI가 분석한 나의 금융 투자 유형입니다. 16가지 중 나는 어떤 투자자인지, 강점과 주의점을 알려드립니다.
  </div>
  <div class="at-hero">
    <div class="at-type">${archetype}</div>
    <div class="at-name">${atName}</div>
    <div class="at-sub">${atSub}</div>
    <div class="at-core">${name}님 — ${(atDescAI || atCore).replace(/^[A-Z]{4}님은\s*/,"")}</div>
  </div>
  <!-- ★ v63: 왜 이 아키타입인가 근거 -->
  <div style="background:rgba(240,198,116,.06);border:1px solid rgba(240,198,116,.15);border-radius:10px;padding:12px 16px;margin-bottom:14px;font-size:11px;color:#94A3B8;line-height:1.8">
    🔬 <strong style="color:#E2E8F0">산출 근거:</strong> ① 생년월일 기반 선천적 금융 기질 × ② 금융 행동 진단 16문항 4축(판단·인식·에너지·생활양식) × ③ 소비 행동 패턴 4가지 → AI 3중 융합 분석으로 <strong style="color:#F0C674">${archetype}</strong> 금융 유형 확정.<br>
    <strong style="color:#5AA8FF">⚠️ MBTI와 비슷해 보이지만 다릅니다:</strong> MBTI는 성격 검사이고, N-KAI는 <strong style="color:#F0C674">금융 행동 패턴</strong> 분석입니다. 평소 MBTI 결과와 달라도 정상입니다 — 금융 상황에서의 나는 일상의 나와 다를 수 있습니다.<br>
    💡 <strong style="color:#E2E8F0">이걸 알면:</strong> 내 투자 결정의 패턴 원인을 알 수 있습니다. 강점은 극대화하고 리스크 패턴은 사전에 차단하는 맞춤 전략이 가능해집니다.
  </div>
  <div class="at-cards">
    <div class="at-card">
      <div class="at-card-icon">💪</div>
      <div class="at-card-label">핵심 강점</div>
      <div class="at-card-text">${atStr}</div>
    </div>
    <div class="at-card">
      <div class="at-card-icon">⚠️</div>
      <div class="at-card-label">주요 리스크</div>
      <div class="at-card-text">${atRisk}</div>
    </div>
    <div class="at-card">
      <div class="at-card-icon">🎯</div>
      <div class="at-card-label">골든 전략</div>
      <div class="at-card-text">${atStrat}</div>
    </div>
  </div>
</div>

<!-- ══════════ S02 N-Score ══════════ -->
<div class="section section-alt">
  <div class="section-num" id="sec02">SECTION 02</div>
  <div class="section-title">N-Score 금융 성향 지수</div>
  <div class="section-divider"></div>
  <div style="background:rgba(255,255,255,.04);border-left:3px solid #2D8CFF;border-radius:0 8px 8px 0;padding:10px 14px;margin-bottom:12px;font-size:11px;color:#CBD5E1;line-height:1.6;">
    💡 <strong style="color:#F1F5F9;">이 섹션은?</strong> 내 금융 행동력 점수입니다. 숫자가 높을수록 데이터 기반의 금융 의사결정 능력이 뛰어납니다.
  </div>

  <!-- ★ 복원: N-Score 설명 박스 -->
  <div class="info-box">
    <strong>N-Score란?</strong> 나만의 금융 행동 패턴을 N-KAI가 정밀하게 분석·예측하여 산출한 <strong>종합 금융 행동 패턴 지수</strong>입니다.
  </div>

  <div class="nscore-display">
    <div class="nscore-value">${nscore}</div>
    <div class="nscore-grade">${ngrade} 등급</div>
    <div class="nscore-top">${archetype} 아키타입 내 상위 ${overallTop}%</div>
  </div>
  <div class="nscore-bar-wrap">
    <div class="nscore-bar-labels">
      <span class="nscore-bar-label">N9 ←</span>
      <span class="nscore-bar-label">위험</span>
      <span class="nscore-bar-label">중간</span>
      <span class="nscore-bar-label">우수</span>
      <span class="nscore-bar-label">→ N1</span>
    </div>
    <div class="nscore-bar-track">
      <div class="nscore-bar-fill" style="width:${Math.max(2, Math.min(100, Math.round((nscore-200)/800*100)))}%"></div>
      <div class="nscore-bar-marker" style="left:${Math.max(2, Math.min(100, Math.round((nscore-200)/800*100)))}%;transform:translateX(-50%)"></div>
    </div>
    <div class="nscore-grades-row">
      ${(function(){
        var grades=[
          {g:'N9',score:200},{g:'N8',score:370},{g:'N7',score:440},
          {g:'N6',score:510},{g:'N5',score:580},{g:'N4',score:650},
          {g:'N3',score:720},{g:'N2',score:800},{g:'N1',score:900}
        ];
        return grades.map(function(item){
          var pct = Math.round((item.score-200)/800*100);
          var isActive = ngrade.startsWith(item.g);
          return '<div class="ng-item'+(isActive?' active':'')+'" style="left:'+pct+'%">' + item.g + '</div>';
        }).join('');
      })()}
    </div>
  </div>
</div>

<!-- ══════════ S02b N-Score 산출 근거 ══════════ -->
${(function(){
  var _bdI = safeStr(data.breakdown_innate || '');
  var _bdK = safeStr(data.breakdown_kipa || '');
  var _bdD = safeStr(data.breakdown_dynamic || '');
  var _bdB = safeStr(data.behavior_bonus_raw || data.behavior_bonus || '');
  if (!_bdI && !_bdK && !_bdD && !_bdB) return '';
  var _inn = {}; try { _inn = JSON.parse(_bdI); } catch(e) {}
  var _kip = {}; try { _kip = JSON.parse(_bdK); } catch(e) {}
  var _dyn = {}; try { _dyn = JSON.parse(_bdD); } catch(e) {}
  var _bon = {}; try { _bon = JSON.parse(_bdB); } catch(e) {}

  // ═══ N-Score 표시용 비율 분배 v5.0 (Phase 1 가중치: DNA 40% / KIPA 35% / 동적 25%) ═══
  // computeNScore 내부 계산은 기저값+기여 방식이지만,
  // 사용자에게 보여주는 산출근거는 Phase 1 가중치 비율로 분배
  var _bonScore = (typeof _bon === 'object' && _bon.totalBonus) ? parseInt(_bon.totalBonus) : parseInt(_bdB || '0');
  var _ns = parseInt(nscore) || 0;
  var _scoreExBonus = _ns - _bonScore; // 보너스 제외 점수
  if (_scoreExBonus < 0) _scoreExBonus = 0;

  // Phase 1 가중치 비율로 분배
  var _innPt = Math.round(_scoreExBonus * 0.40);  // DNA 40%
  var _kipPt = Math.round(_scoreExBonus * 0.35);  // KIPA 35%
  var _dynPt = _scoreExBonus - _innPt - _kipPt;   // 동적 25% (나머지)
  var _tot2 = _ns || 1;

  // 4개 모두 0이면 숨김
  if (!_innPt && !_kipPt && !_dynPt && !_bonScore) return '';

  // 금지 단어 매핑
  var _elNm2 = {'金':'결단 에너지','木':'성장 에너지','火':'열정 에너지','土':'안정 에너지','水':'지혜 에너지'};
  var _stMp2 = {'신강':'코어 에너지 강세','신약':'코어 에너지 약세'};
  function _pct2(v) { return Math.max(2, Math.round(Math.abs(v) / _tot2 * 100)); }
  return '<div class="section section-alt">'
    + '<div class="section-num">SECTION 02-B</div>'
    + '<div class="section-title">N-Score 산출 근거</div>'
    + '<div class="section-divider"></div>'
    + '<div style="background:rgba(255,255,255,.04);border-left:3px solid #c9a84c;border-radius:0 8px 8px 0;padding:10px 14px;margin-bottom:16px;font-size:11px;color:#CBD5E1;line-height:1.6;">'
    + '📊 <strong style="color:#F1F5F9;">왜 ' + name + '님의 N-Score는 ' + nscore + '점인가요?</strong> 4가지 분석 축의 기여도를 보여드립니다.'
    + '</div>'
    // ── 🧬 DNA가 설계한 나 ──
    + '<div style="margin-bottom:16px">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">'
    + '<span style="flex:1;min-width:0;font-size:13px;font-weight:700;color:#C9A84C">🧬 DNA가 설계한 나</span>'
    + '<div style="flex:0 0 auto;margin-left:20px;white-space:nowrap;text-align:right"><span style="font-size:17px;font-weight:900;color:#C9A84C">' + _innPt + '<span style="font-size:10px;color:#64748B">점</span></span>'
    + '<span style="font-size:11px;color:#C9A84C;opacity:0.7;margin-left:5px">(' + _pct2(_innPt) + '%)</span></div></div>'
    + '<div style="font-size:11px;color:#64748B;margin-bottom:6px">선천 기질 · 코어에너지 · 강약지수</div>'
    + '<div style="height:7px;background:rgba(255,255,255,0.07);border-radius:4px;overflow:hidden">'
    + '<div style="height:100%;width:' + _pct2(_innPt) + '%;background:#C9A84C;border-radius:4px"></div></div></div>'
    // ── 🧠 내가 인식하는 나 ──
    + '<div style="margin-bottom:16px">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">'
    + '<span style="flex:1;min-width:0;font-size:13px;font-weight:700;color:#2D8CFF">🧠 내가 인식하는 나</span>'
    + '<div style="flex:0 0 auto;margin-left:20px;white-space:nowrap;text-align:right"><span style="font-size:17px;font-weight:900;color:#2D8CFF">' + _kipPt + '<span style="font-size:10px;color:#64748B">점</span></span>'
    + '<span style="font-size:11px;color:#2D8CFF;opacity:0.7;margin-left:5px">(' + _pct2(_kipPt) + '%)</span></div></div>'
    + '<div style="font-size:11px;color:#64748B;margin-bottom:6px">KIPA 행동진단 16문항 · 결단력</div>'
    + '<div style="height:7px;background:rgba(255,255,255,0.07);border-radius:4px;overflow:hidden">'
    + '<div style="height:100%;width:' + _pct2(_kipPt) + '%;background:#2D8CFF;border-radius:4px"></div></div></div>'
    // ── ⚡ 공명 · 충돌 · 균형 ──
    + '<div style="margin-bottom:16px">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">'
    + '<span style="flex:1;min-width:0;font-size:13px;font-weight:700;color:#FFD700">⚡ 공명 · 충돌 · 균형</span>'
    + '<div style="flex:0 0 auto;margin-left:20px;white-space:nowrap;text-align:right"><span style="font-size:17px;font-weight:900;color:#FFD700">' + _dynPt + '<span style="font-size:10px;color:#64748B">점</span></span>'
    + '<span style="font-size:11px;color:#FFD700;opacity:0.7;margin-left:5px">(' + _pct2(_dynPt) + '%)</span></div></div>'
    + '<div style="font-size:11px;color:#64748B;margin-bottom:6px">선천×후천 공명 · 5-Energy 균형보너스</div>'
    + '<div style="height:7px;background:rgba(255,255,255,0.07);border-radius:4px;overflow:hidden">'
    + '<div style="height:100%;width:' + _pct2(_dynPt) + '%;background:#FFD700;border-radius:4px"></div></div></div>'
    // ── 💳 지갑이 증명하는 나 ──
    + '<div style="margin-bottom:16px">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">'
    + '<span style="flex:1;min-width:0;font-size:13px;font-weight:700;color:#00D68F">💳 지갑이 증명하는 나</span>'
    + '<div style="flex:0 0 auto;margin-left:20px;white-space:nowrap;text-align:right"><span style="font-size:17px;font-weight:900;color:#00D68F">+' + _bonScore + '<span style="font-size:10px;color:#64748B">점</span></span>'
    + '<span style="font-size:11px;color:#00D68F;opacity:0.7;margin-left:5px">(' + _pct2(_bonScore) + '%)</span></div></div>'
    + '<div style="font-size:11px;color:#64748B;margin-bottom:6px">소비 행동 패턴 4가지</div>'
    + '<div style="height:7px;background:rgba(255,255,255,0.07);border-radius:4px;overflow:hidden">'
    + '<div style="height:100%;width:' + _pct2(_bonScore) + '%;background:#00D68F;border-radius:4px"></div></div></div>'
    + '</div>';
})()}

<!-- ══════════ S03 3대 지표 ══════════ -->
<div class="section">
  <div class="section-num" id="sec03">SECTION 03</div>
  <div class="section-title">3대 핵심 금융 지표</div>
  <div class="section-divider"></div>
  <div style="background:rgba(255,255,255,.04);border-left:3px solid #00C896;border-radius:0 8px 8px 0;padding:10px 14px;margin-bottom:12px;font-size:11px;color:#CBD5E1;line-height:1.6;">
    💡 <strong style="color:#F1F5F9;">이 섹션은?</strong> ${name}님의 경제감각·기회포착력·위기대응력, 세 가지 핵심 능력을 수치로 보여드립니다. 100점 만점 기준으로 숫자가 높을수록 강합니다.
  </div>

  <!-- KPI란? 개념 설명 -->
  <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:14px 18px;margin-bottom:14px">
    <div style="font-size:11px;font-weight:700;color:#F0C674;margin-bottom:8px;letter-spacing:1px">💡 3대 지표(KPI)란?</div>
    <div style="display:flex;flex-direction:column;gap:7px">
      <div style="display:flex;align-items:baseline;gap:6px;font-size:11px;line-height:1.6">
        <span style="color:#E2E8F0;font-weight:700;white-space:nowrap;min-width:90px">💰 경제 감각</span>
        <span style="color:#475569">—</span>
        <span style="color:#94A3B8">N-KAI가 분석한 <strong style="color:#F0C674">나만의 금융 행동 패턴 — 경제 감각</strong>. 점수가 높을수록 수익 기회를 빠르게 알아채고 자산이 빠르게 불어납니다.</span>
      </div>
      <div style="display:flex;align-items:baseline;gap:6px;font-size:11px;line-height:1.6">
        <span style="color:#E2E8F0;font-weight:700;white-space:nowrap;min-width:90px">🎯 기회 포착력</span>
        <span style="color:#475569">—</span>
        <span style="color:#94A3B8">N-KAI가 분석한 <strong style="color:#F0C674">나만의 금융 행동 패턴 — 실행력</strong>. 점수가 높을수록 남들보다 먼저 기회를 발굴하고 과감하게 실행합니다.</span>
      </div>
      <div style="display:flex;align-items:baseline;gap:6px;font-size:11px;line-height:1.6">
        <span style="color:#E2E8F0;font-weight:700;white-space:nowrap;min-width:90px">🛡 위기 대응력</span>
        <span style="color:#475569">—</span>
        <span style="color:#94A3B8">N-KAI가 분석한 <strong style="color:#F0C674">나만의 금융 행동 패턴 — 멘탈 내구력</strong>. 점수가 높을수록 시장 급락·위기 상황에서도 원칙을 지키고 빠르게 회복합니다.</span>
      </div>
    </div>
  </div>
  <div class="kpi-desc">N-KAI가 나만의 금융 행동 패턴을 정밀 분석하여 산출한 <strong style="color:#F0C674">${archetype} 아키타입</strong>의 3대 금융 역량 지표입니다.</div>
  <!-- ★ 복원: 상위% 기준 주석 -->
  <div class="kpi-footnote">★ 상위% 기준: 동일 ${archetype} 아키타입 사용자 데이터와 비교한 순위입니다.</div>

  <div class="kpi-cards">
    <div class="kpi-card">
      <div class="kpi-icon">💰</div>
      <div class="kpi-name">경제 감각</div>
      <div class="kpi-score">${kpi1Score}<span style="font-size:16px;color:#94A3B8">/100</span></div>
      <!-- ★ 복원: 아키타입 내 상위% -->
      <div class="kpi-rank">${archetype} 아키타입 내 상위 ${topPctA}% 구간</div>
      <div class="kpi-bar-track"><div class="kpi-bar-fill" style="width:${kpi1Bar}%"></div></div>
      <div class="kpi-text">N-KAI가 분석한 나만의 금융 행동 패턴에서 도출된 경제 감각 지수. 점수가 높을수록 수익 기회를 빠르게 알아채고 자산이 빠르게 불어납니다.</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon">🎯</div>
      <div class="kpi-name">투자 기회 포착력</div>
      <div class="kpi-score">${kpi2Score}<span style="font-size:16px;color:#94A3B8">/100</span></div>
      <!-- ★ 복원: 아키타입 내 상위% -->
      <div class="kpi-rank">${archetype} 아키타입 내 상위 ${topPctB}% 구간</div>
      <div class="kpi-bar-track"><div class="kpi-bar-fill" style="width:${kpi2Bar}%"></div></div>
      <div class="kpi-text">N-KAI가 분석한 나만의 금융 행동 패턴에서 도출된 실행력 지수. 점수가 높을수록 투자 타이밍을 직감적으로 감지하고, 결정적인 순간을 놓치지 않습니다.</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon">🛡</div>
      <div class="kpi-name">위기 대응력</div>
      <div class="kpi-score">${kpi3Score}<span style="font-size:16px;color:#94A3B8">/100</span></div>
      <!-- ★ 복원: 아키타입 내 상위% -->
      <div class="kpi-rank">${archetype} 아키타입 내 상위 ${topPctC}% 구간</div>
      <div class="kpi-bar-track"><div class="kpi-bar-fill" style="width:${kpi3Bar}%"></div></div>
      <div class="kpi-text">N-KAI가 분석한 타고난 멘탈 내구력 지수. 점수가 높을수록 시장 급락이나 예상치 못한 위기 상황에서 흔들리지 않고 침착하게 대응합니다.</div>
    </div>
  </div>
  <div class="kpi-summary">💡 <strong>종합 해석:</strong> 3대 지표 평균 ${Math.round((kpi1Score+kpi2Score+kpi3Score)/3)}점 — ${Math.round((kpi1Score+kpi2Score+kpi3Score)/3) >= 80 ? '상위권' : Math.round((kpi1Score+kpi2Score+kpi3Score)/3) >= 65 ? '중상위권' : '중간권'}. 강점 지표에 집중하고 약점 지표는 규칙 기반으로 보완하십시오.</div>
  <!-- ★ 소비행동 패턴 박스 -->
  ${(function(){
    var _sq1 = parseInt(data.sq1||'-1');
    var _sq2 = parseInt(data.sq2||'-1');
    var _sq3 = parseInt(data.sq3||'-1');
    var _sq4 = parseInt(data.sq4||'-1');
    var _bonus = parseInt(data.behavior_bonus||'0');
    var _res   = parseInt(data.bq_resonance||'0');
    if(_sq1 < 0 || _sq2 < 0) return '';

    var _spendLabels = ['소액 자주','중간 균형','계획 지출','목표 저축','상황 대응'];
    var _impulseLabels = ['충동 없음','가끔 있음','보통','자주 있음'];
    var _windfallLabels = ['즉시 저축','투자 활용','일부 소비','소비 우선','상황 판단'];
    var _trackLabels = ['매일 체크','주 1회','월 1회','거의 안 함'];

    var _bqHealth     = parseInt(data.bq_health||'0');
    var _bqAlignment  = parseInt(data.bq_alignment||'0');
    var _bqActivation = parseInt(data.bq_activation||'0');
    return '<div style="margin-top:20px;background:rgba(45,140,255,.06);border:1px solid rgba(45,140,255,.2);border-radius:12px;padding:18px 20px">'
      + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">'
      + '<div style="font-size:12px;font-weight:700;color:#2D8CFF">💳 소비 행동 패턴 분석 결과 <span style="font-size:10px;color:#64748B;font-weight:400">(4가지)</span></div>'
      + (_bonus > 0 ? '<div style="font-size:18px;font-weight:900;color:#22C55E">' + Math.round((_bonus/150)*100) + '<span style="font-size:11px;color:#64748B">/100점</span></div>' : '')
      + '</div>'
      + '<div style="font-size:10px;color:#64748B;margin-bottom:12px">4가지 소비 행동 패턴이 N-Score에 반영됩니다. Phase 2 카드 거래 데이터 연동 시 정밀도가 대폭 향상됩니다.</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">'
      + '<div style="background:rgba(255,255,255,.04);border-radius:8px;padding:10px 12px;display:flex;align-items:center;gap:8px">'
      +   '<div style="width:22px;height:22px;border-radius:50%;background:rgba(45,140,255,.2);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#2D8CFF;flex-shrink:0">①</div>'
      +   '<div><div style="font-size:10px;color:#64748B;margin-bottom:2px">지출 방식</div><div style="font-size:12px;color:#E2E8F0;font-weight:600">'+(_spendLabels[_sq1]||'-')+'</div></div></div>'
      + '<div style="background:rgba(255,255,255,.04);border-radius:8px;padding:10px 12px;display:flex;align-items:center;gap:8px">'
      +   '<div style="width:22px;height:22px;border-radius:50%;background:rgba(45,140,255,.2);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#2D8CFF;flex-shrink:0">②</div>'
      +   '<div><div style="font-size:10px;color:#64748B;margin-bottom:2px">충동 소비 성향</div><div style="font-size:12px;color:#E2E8F0;font-weight:600">'+(_impulseLabels[_sq2]||'-')+'</div></div></div>'
      + '<div style="background:rgba(255,255,255,.04);border-radius:8px;padding:10px 12px;display:flex;align-items:center;gap:8px">'
      +   '<div style="width:22px;height:22px;border-radius:50%;background:rgba(45,140,255,.2);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#2D8CFF;flex-shrink:0">③</div>'
      +   '<div><div style="font-size:10px;color:#64748B;margin-bottom:2px">여윳돈 활용 방식</div><div style="font-size:12px;color:#E2E8F0;font-weight:600">'+(_windfallLabels[_sq3]||'-')+'</div></div></div>'
      + '<div style="background:rgba(255,255,255,.04);border-radius:8px;padding:10px 12px;display:flex;align-items:center;gap:8px">'
      +   '<div style="width:22px;height:22px;border-radius:50%;background:rgba(45,140,255,.2);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#2D8CFF;flex-shrink:0">④</div>'
      +   '<div><div style="font-size:10px;color:#64748B;margin-bottom:2px">자산 관리 습관</div><div style="font-size:12px;color:#E2E8F0;font-weight:600">'+(_trackLabels[_sq4]||'-')+'</div></div></div>'
      + '</div>'
      + (_bonus > 0
        ? '<div style="background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.2);border-radius:8px;padding:10px 14px">'
          + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">'
          + '<div>'
          + '<span style="font-size:11px;color:#22C55E;font-weight:700">✅ 소비 행동 패턴 N-Score 가산 (Phase 1)</span><br>'
          + '<span style="font-size:10px;color:#64748B">Phase 2 마이데이터 카드 거래 연동 시 더욱 정밀해집니다</span>'
          + '</div>'
          + '<span style="font-size:18px;font-weight:900;color:#22C55E">+' + _bonus + '점</span>'
          + '</div>'
          + '<div style="display:flex;gap:8px;flex-wrap:wrap">'
          + '<span style="font-size:10px;color:#64748B;background:rgba(255,255,255,.04);border-radius:4px;padding:2px 8px">재무 건전성 +'+_bqHealth+'</span>'
          + '<span style="font-size:10px;color:#64748B;background:rgba(255,255,255,.04);border-radius:4px;padding:2px 8px">행동 정합성 +'+_bqAlignment+'</span>'
          + '<span style="font-size:10px;color:#64748B;background:rgba(255,255,255,.04);border-radius:4px;padding:2px 8px">실행력 +'+_bqActivation+'</span>'
          + '</div>'
          + '</div>'
        : '<div style="font-size:10px;color:#64748B;padding:6px 0">* 소비 패턴 미입력 시 N-Score 가산 없음</div>'
        )
      + '</div>';
  })()}


</div>


<!-- ══════════ S03b 트리플 미러 갭 분석 ══════════ -->
<div class="section section-alt">
  <div class="section-num" id="sec03b">★ TRIPLE MIRROR</div>
  <div class="section-title">트리플 미러 — 3겹으로 보는 나</div>
  <div class="section-divider"></div>
  <div style="background:rgba(255,255,255,.04);border-radius:10px;padding:16px 18px;margin-bottom:16px;line-height:1.8">
    <div style="font-size:12px;font-weight:700;color:#F0C674;margin-bottom:10px">💡 이 섹션은 무엇인가요?</div>
    <div style="font-size:12px;color:#E2E8F0;margin-bottom:10px">
      같은 ESTJ라도 <strong style="color:#F0C674">실제로 돈을 쓰는 방식은 전혀 다릅니다.</strong><br>
      N-KAI는 3가지 거울로 나를 동시에 비춰 보여줍니다.
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:10px">
      <div style="text-align:center;padding:8px;background:rgba(124,91,240,.1);border-radius:8px;font-size:10px;color:#94A3B8">
        🧬 <strong style="color:#7C5BF0;display:block;margin:4px 0">태어난 나</strong>
        선천적으로 타고난<br>금융 기질
      </div>
      <div style="text-align:center;padding:8px;background:rgba(45,140,255,.1);border-radius:8px;font-size:10px;color:#94A3B8">
        🧠 <strong style="color:#2D8CFF;display:block;margin:4px 0">생각하는 나</strong>
        내가 스스로 인식하는<br>투자 성향
      </div>
      <div style="text-align:center;padding:8px;background:rgba(0,214,143,.1);border-radius:8px;font-size:10px;color:#94A3B8">
        💳 <strong style="color:#00D68F;display:block;margin:4px 0">행동하는 나</strong>
        실제 지갑이 보여주는<br>소비 패턴
      </div>
    </div>
    <div style="margin-top:10px;font-size:11px;color:#64748B">
      ⚡ 이 3가지가 일치할수록 골든타임에 흔들리지 않고 실행할 수 있습니다.
    </div>
  </div>

  <!-- 3개 미러 카드 -->
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:20px">

    <!-- 미러 1: DNA -->
    <div style="background:linear-gradient(135deg,rgba(124,91,240,.15),rgba(45,140,255,.08));border:1px solid rgba(124,91,240,.3);border-radius:12px;padding:16px;text-align:center">
      <div style="font-size:20px;margin-bottom:6px">🧬</div>
      <div style="font-size:10px;color:#7C5BF0;font-weight:700;letter-spacing:1px;margin-bottom:8px">DNA가 설계한 나</div>
      <div style="font-size:22px;font-weight:900;color:#F0C674">${coreEl}</div>
      <div style="font-size:11px;color:#94A3B8;margin-top:4px">선천 에너지</div>
      <div style="font-size:13px;font-weight:700;color:#E2E8F0;margin-top:6px">${archetype}</div>
      <div style="font-size:10px;color:#64748B;margin-top:2px">타고난 금융 기질</div>
    </div>

    <!-- 미러 2: KIPA -->
    <div style="background:linear-gradient(135deg,rgba(45,140,255,.15),rgba(90,168,255,.08));border:1px solid rgba(45,140,255,.3);border-radius:12px;padding:16px;text-align:center">
      <div style="font-size:20px;margin-bottom:6px">🧠</div>
      <div style="font-size:10px;color:#2D8CFF;font-weight:700;letter-spacing:1px;margin-bottom:8px">내가 인식하는 나</div>
      <div style="font-size:22px;font-weight:900;color:#F0C674">${archetype}</div>
      <div style="font-size:11px;color:#94A3B8;margin-top:4px">행동 진단 결과</div>
      <div style="font-size:13px;font-weight:700;color:#E2E8F0;margin-top:6px">${atName}</div>
      <div style="font-size:10px;color:#64748B;margin-top:2px">16문항 분석 유형</div>
    </div>

    <!-- 미러 3: 소비패턴 -->
    <div style="background:linear-gradient(135deg,rgba(0,214,143,.15),rgba(34,197,94,.08));border:1px solid rgba(0,214,143,.3);border-radius:12px;padding:16px;text-align:center">
      <div style="font-size:20px;margin-bottom:6px">💳</div>
      <div style="font-size:10px;color:#00D68F;font-weight:700;letter-spacing:1px;margin-bottom:8px">지갑이 증명하는 나</div>
      ${(function(){
        var _sq1=parseInt(data.sq1||'-1');
        var _sq2=parseInt(data.sq2||'-1');
        var _spL=['소액자주','중간균형','계획지출','목표저축','상황대응'];
        var _impL=['충동없음','가끔있음','보통','자주있음'];
        if(_sq1<0||_sq2<0) return '<div style="font-size:11px;color:#64748B;margin-top:8px">소비 패턴 미입력<br><span style="font-size:10px">분석 시 4가지 답변 필요</span></div>';
        return '<div style="font-size:14px;font-weight:700;color:#00D68F">'+(_spL[_sq1]||'-')+'</div>'
          +'<div style="font-size:10px;color:#94A3B8;margin-top:4px">지출 방식</div>'
          +'<div style="font-size:13px;font-weight:600;color:#E2E8F0;margin-top:6px">'+(_impL[_sq2]||'-')+'</div>'
          +'<div style="font-size:10px;color:#64748B;margin-top:2px">충동 소비 성향</div>';
      })()}
    </div>
  </div>

  <!-- 갭 분석 박스 -->
  ${(function(){
    var _sq1=parseInt(data.sq1||'-1');
    var _sq2=parseInt(data.sq2||'-1');
    if(_sq1<0||_sq2<0) return '';

    // 갭 판단: spending 3(목표저축)+impulse 0(충동없음) = 방어형
    var _spendStyle = _sq1 >= 3 ? 'defensive' : _sq1 <= 1 ? 'aggressive' : 'balanced';
    var _impulseStyle = _sq2 === 0 ? 'stable' : _sq2 >= 2 ? 'risky' : 'moderate';

    // 아키타입 성향 판단
    var _ntTypes = ['ENTJ','ENTP','INTJ','INTP'];
    var _isNT = _ntTypes.indexOf(archetype) >= 0;

    var _gapMsg = '';
    var _gapColor = '#F0C674';
    var _gapIcon = '⚡';

    if(_isNT && _spendStyle === 'defensive') {
      _gapMsg = '타고난 성향은 빠른 결단형인데, 실제 지출은 조심스럽게 아끼는 패턴입니다.<br><strong style="color:#EF4444">→ 골든타임이 왔을 때 "한 번 더 생각해보자"는 습관이 기회를 놓치게 합니다.</strong>';
      _gapColor = '#EF4444';
      _gapIcon = '⚠️';
    } else if(!_isNT && _spendStyle === 'aggressive') {
      _gapMsg = '타고난 성향은 안전 우선인데, 실제 지출은 충동적으로 움직이는 패턴입니다.<br><strong style="color:#EF4444">→ 시장이 흔들릴 때 평소와 다른 결정을 내릴 가능성이 높습니다. 지금 현금 비중을 점검하세요.</strong>';
      _gapColor = '#EF4444';
      _gapIcon = '⚠️';
    } else if(_spendStyle === 'balanced' || _impulseStyle === 'stable') {
      _gapMsg = '타고난 성향과 실제 지출 패턴이 잘 맞습니다.<br><strong style="color:#00D68F">→ 골든타임에 망설임 없이 실행할 수 있는 최적의 상태입니다.</strong>';
      _gapColor = '#00D68F';
      _gapIcon = '✅';
    } else {
      _gapMsg = '타고난 성향과 실제 지출 사이에 차이가 있습니다.<br><strong style="color:#F0C674">→ 이 차이를 알고 있는 것만으로도 골든타임에 더 나은 결정을 내릴 수 있습니다.</strong>';
      _gapColor = '#F0C674';
      _gapIcon = '⚡';
    }

    return '<div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:16px 18px">'
      +'<div style="font-size:11px;font-weight:700;color:#94A3B8;margin-bottom:8px">'+_gapIcon+' 내 3가지 모습 비교 — 갭 분석</div>'
      +'<div style="font-size:13px;color:'+_gapColor+';font-weight:600;line-height:1.7">'+_gapMsg+'</div>'
      +'<div style="margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,.06);font-size:11px;color:#64748B">'
      +'💡 골든타임 <strong style="color:#F0C674">' + (_gt1Raw||'확인 중') + '</strong> 이 3겹 정렬을 일치시킬 최적 시점입니다.'
      +'</div>'
      +'</div>';
  })()}

</div>


<!-- ══════════ S04 에너지 ══════════ -->
<div class="section section-alt">
  <div class="section-num" id="sec04">SECTION 04</div>
  <div class="section-title">코어 에너지 — 5-Energy Balance</div>
  <div class="section-divider"></div>
  <div style="background:rgba(255,255,255,.04);border-left:3px solid #A78BFA;border-radius:0 8px 8px 0;padding:10px 14px;margin-bottom:12px;font-size:11px;color:#CBD5E1;line-height:1.6;">
    💡 <strong style="color:#F1F5F9;">이 섹션은?</strong> AI가 분석한 MBTI는 성격 유형을 분류하지만, N-KAI 5-Energy는 <strong style="color:#F0C674">나의 금융 결정 방식</strong>을 5가지 에너지 비율로 분석합니다. 같은 ESTJ라도 에너지 분포는 모두 다릅니다. 📊 왼쪽은 에너지 비율, ✦ 오른쪽은 나의 금융 결정을 지배하는 핵심 에너지 (분포와 다를 수 있음)
  </div>

  <!-- 5-Energy 개념 설명 -->
  <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:12px 16px;margin-bottom:18px;font-size:11px;color:#64748B;line-height:1.8">
    💡 <strong style="color:#94A3B8">5-Energy란?</strong> MBTI가 성격을 분류한다면, N-KAI의 5-Energy는 <strong style="color:#F0C674">나의 금융 결정 방식</strong>을 5가지 에너지로 분류합니다. 비율이 높을수록 그 에너지가 투자 결정에 더 강하게 작용합니다.<br>
    <span style="display:block;margin-top:8px;line-height:2.1;font-size:11px">
    🌿 <strong style="color:#22C55E">木(목) 성장</strong> — 새 기회를 탐색하고 확장하는 에너지. 성장주·신흥 시장에 강함<br>
    🔥 <strong style="color:#EF4444">火(화) 열정</strong> — 빠르게 실행하고 도전하는 에너지. 단기·모멘텀 투자에 강함<br>
    ⛰ <strong style="color:#F59E0B">土(토) 안정</strong> — 균형을 지키고 안전하게 보존하는 에너지. 배당·부동산에 강함<br>
    ✦ <strong style="color:#F0C674">金(금) 결단</strong> — 분석 후 칼같이 결정하는 에너지. 가치주·채권에 강함<br>
    💧 <strong style="color:#2D8CFF">水(수) 지혜</strong> — 유연하게 흐르며 정보를 읽는 에너지. 글로벌·유동성 자산에 강함
    </span>
  </div>

  <!-- 에너지 바 + 우측 설명 2컬럼 -->
  <div style="display:grid;grid-template-columns:1fr 200px;gap:20px;margin-bottom:20px">
    <div class="energy-bars" style="margin:0">
      ${(function(){
        var _rows=[
          {el:'木',icon:'🌿',label:'木 성장',color:'#22C55E',pct:pctMok,desc:'성장'},
          {el:'火',icon:'🔥',label:'火 열정',color:'#EF4444',pct:pctHwa,desc:'열정'},
          {el:'土',icon:'⛰',label:'土 안정',color:'#F59E0B',pct:pctTo,desc:'안정'},
          {el:'金',icon:'✦',label:'金 결단',color:'#F0C674',pct:pctGeum,desc:'결단'},
          {el:'水',icon:'💧',label:'水 지혜',color:'#2D8CFF',pct:pctSu,desc:'지혜'}
        ];
        return _rows.map(function(r){
          var _isCore=(r.el===coreEl);
          var _lbl = _isCore
            ? '<div class="ebar-label" style="color:'+r.color+';font-weight:700">✦ '+r.el+' '+r.desc+'</div>'
            : '<div class="ebar-label">'+r.icon+' '+r.label+'</div>';
          var _pct = _isCore
            ? '<div class="ebar-pct" style="color:'+r.color+';font-weight:700">'+r.pct+'%</div>'
            : '<div class="ebar-pct">'+r.pct+'%</div>';
          return '<div class="ebar-row">'+_lbl+'<div class="ebar-track"><div class="ebar-fill" style="width:'+r.pct+'%;background:'+r.color+'"></div></div>'+_pct+'</div>';
        }).join('');
      })()}
    </div>
    <!-- 코어 에너지 강조 박스 -->
    <div style="background:linear-gradient(145deg,rgba(240,198,116,.1),rgba(240,198,116,.04));border:2px solid ${elColor};border-radius:14px;padding:16px 12px;text-align:center;display:flex;flex-direction:column;justify-content:center">
      <div style="font-size:10px;color:#94A3B8;letter-spacing:1px;margin-bottom:6px">내 금융 결정의 본질 에너지</div>
      <div style="font-size:40px;font-weight:900;color:${elColor};line-height:1;text-shadow:0 0 20px ${elColor}44">${elName}</div>
      <div style="font-size:11px;color:${elColor};margin-top:6px;font-weight:600">${elKo}</div>
      <div style="font-size:10px;color:#64748B;margin-top:4px;line-height:1.5">코어 DNA 기반<br><span style="font-size:9px;color:#94A3B8">※ 분포 비율과 다를 수 있습니다</span></div>
    </div>
  </div>

  <!-- 코어 에너지 분석 + 금융 적용 3카드 -->
  <div class="energy-core" style="margin-bottom:16px">
    <div class="ec-title">✦ ${name}님의 ${elName} 코어 에너지</div>
    <div class="ec-desc">${ss(ai.coreEnergyDesc) || elName + ' 에너지가 지배적인 ' + name + '님은 ' + elData.desc}</div>
  </div>

  <!-- 금융 결정 패턴 3가지 -->
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
    <div style="background:rgba(255,255,255,.04);border:1px solid ${elColor}33;border-radius:10px;padding:12px 10px;text-align:center">
      <div style="font-size:18px;margin-bottom:6px">💰</div>
      <div style="font-size:10px;color:#94A3B8;margin-bottom:4px;font-weight:600">투자 성향</div>
      <div style="font-size:11px;color:#E2E8F0;line-height:1.5">${{'金':'분석 후 결단<br>손절 원칙 엄수','木':'성장 자산 선호<br>장기 보유 강점','火':'추세 추종형<br>빠른 실행력','土':'안정 자산 선호<br>복리 집중','水':'유연한 흐름<br>정보 수집력'}[coreEl]||'균형 투자형'}</div>
    </div>
    <div style="background:rgba(255,255,255,.04);border:1px solid ${elColor}33;border-radius:10px;padding:12px 10px;text-align:center">
      <div style="font-size:18px;margin-bottom:6px">⚡</div>
      <div style="font-size:10px;color:#94A3B8;margin-bottom:4px;font-weight:600">최적 자산군</div>
      <div style="font-size:11px;color:#E2E8F0;line-height:1.5">${{'金':'금현물·채권ETF<br>가치주·배당','木':'성장주·테크ETF<br>나스닥','火':'모멘텀·테마주<br>소비재ETF','土':'부동산·배당주<br>인프라펀드','水':'글로벌ETF·외환<br>채권·유동성'}[coreEl]||'분산 포트폴리오'}</div>
    </div>
    <div style="background:rgba(255,255,255,.04);border:1px solid ${elColor}33;border-radius:10px;padding:12px 10px;text-align:center">
      <div style="font-size:18px;margin-bottom:6px">⚠️</div>
      <div style="font-size:10px;color:#94A3B8;margin-bottom:4px;font-weight:600">주의 패턴</div>
      <div style="font-size:11px;color:#E2E8F0;line-height:1.5">${{'金':'과도한 분석<br>진입 지연 주의','木':'충동적 확장<br>분산 과다 주의','火':'감정적 매매<br>과열 추종 주의','土':'기회 회피<br>과도한 보수 주의','水':'방향성 부재<br>흔들리는 원칙 주의'}[coreEl]||'감정적 판단 주의'}</div>
    </div>
  </div>

  <!-- ★ v63: 왜 이 코어에너지인가 — 근거 + 편익 박스 -->
  <div style="margin-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:12px">
    <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-left:3px solid ${elColor};border-radius:0 10px 10px 0;padding:14px 16px">
      <div style="font-size:10px;font-weight:700;color:${elColor};letter-spacing:1px;margin-bottom:8px">🔬 왜 이 에너지인가</div>
      <div style="font-size:12px;color:#E2E8F0;line-height:1.8">${(function(){
        var _why={
          '金':'N-KAI가 분석한 '+name+'님의 행동 데이터와 생년월일 기반 에너지 좌표를 교차 분석한 결과, 金 에너지가 '+pctGeum+'%로 가장 지배적입니다. 金은 수렴·결단·정밀의 에너지로, 투자 결정 시 감정보다 분석을 우선하는 패턴을 만들어냅니다.',
          '木':'N-KAI가 분석한 '+name+'님의 행동 데이터와 생년월일 기반 에너지 좌표를 교차 분석한 결과, 木 에너지가 '+pctMok+'%로 가장 지배적입니다. 木은 성장·확장·생명의 에너지로, 장기 상승 자산에서 남들보다 먼저 가능성을 감지하는 패턴을 만들어냅니다.',
          '火':'N-KAI가 분석한 '+name+'님의 행동 데이터와 생년월일 기반 에너지 좌표를 교차 분석한 결과, 火 에너지가 '+pctHwa+'%로 가장 지배적입니다. 火는 열정·도전·확장의 에너지로, 빠른 실행력과 모멘텀 포착에 탁월한 투자 패턴을 만들어냅니다.',
          '土':'N-KAI가 분석한 '+name+'님의 행동 데이터와 생년월일 기반 에너지 좌표를 교차 분석한 결과, 土 에너지가 '+pctTo+'%로 가장 지배적입니다. 土는 안정·균형·중심의 에너지로, 복리와 배당 중심의 안정적 자산 증식 패턴을 만들어냅니다.',
          '水':'N-KAI가 분석한 '+name+'님의 행동 데이터와 생년월일 기반 에너지 좌표를 교차 분석한 결과, 水 에너지가 '+pctSu+'%로 가장 지배적입니다. 水는 지혜·유연·흐름의 에너지로, 시장 변화에 유연하게 대응하며 유동성을 보존하는 패턴을 만들어냅니다.'
        };
        return _why[coreEl]||_why['金'];
      })()}</div>
    </div>
    <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-left:3px solid #22C55E;border-radius:0 10px 10px 0;padding:14px 16px">
      <div style="font-size:10px;font-weight:700;color:#22C55E;letter-spacing:1px;margin-bottom:8px">🎯 이걸 알면 얻는 것</div>
      <div style="font-size:11px;color:#E2E8F0;line-height:2.0;word-break:keep-all">${{'金':'✓ 충동 매매 차단 — 분석 전 진입 금지 원칙<br>✓ 손절 지연 방지 — 수치 기준으로 감정 제거<br>✓ 최적 자산 집중 — 채권·가치주 중심 운용',
        '木':'✓ 성장주 선점 — 트렌드 초기 조기 진입<br>✓ 장기 보유 강점 — 단기 노이즈에 흔들리지 않음<br>✓ 분산 과다 차단 — 핵심 성장 종목 집중',
        '火':'✓ 모멘텀 수익 극대화 — 빠른 실행 타이밍 선점<br>✓ 손절 자동화 — 감정적 추가 매수 사전 차단<br>✓ 골든타임 집중 진입 — 에너지 최고조 구간 활용',
        '土':'✓ 복리 극대화 — 배당 재투자 자동 증식 루틴<br>✓ 하락장 방어 — 안정 자산 비중으로 손실 방어<br>✓ 심리적 안정 — 변동성 구간에서도 원칙 유지',
        '水':'✓ 위기 유동성 확보 — 급락 시 저가 매수 기회<br>✓ 유연한 리밸런싱 — 시장 변화 빠른 대응 유지<br>✓ 채권·유동성 수익 — 금리 변화 구간 포착'}[coreEl]||'✓ 투자 패턴 자기 인식<br>✓ 리스크 관리 정밀도 향상<br>✓ 골든타임 집중 실행'}</div>
    </div>
  </div>
</div>

<!-- ══════════ S05 골든타임 ══════════ -->
<div class="section">
  <div class="section-num" id="sec05">SECTION 05</div>
  <div class="section-title">골든타임 캘린더 — 12개월 에너지 흐름</div>
  <div class="section-divider"></div>
  <div style="background:rgba(255,255,255,.04);border-left:3px solid #F0C674;border-radius:0 8px 8px 0;padding:10px 14px;margin-bottom:12px;font-size:11px;color:#CBD5E1;line-height:1.6;">
    💡 <strong style="color:#F1F5F9;">이 섹션은?</strong> ${name}님의 에너지 사이클을 AI가 분석한 최적 금융 행동 시기입니다. 골든타임 월에 투자·지출·계약 등 중요한 금융 결정을 내리면 더 유리합니다.
  </div>

  <div class="info-box">
    <strong>골든타임이란?</strong> N-KAI가 나만의 금융 행동 패턴을 분석하여 예측한 <strong>행동 에너지가 가장 높아지는 구간</strong>입니다.<br>
    <span style="font-size:11px;color:#94A3B8;margin-top:6px;display:block">
      🔬 <strong style="color:#E2E8F0">산출 근거:</strong> ${name}님의 생년월일 기반 에너지 사이클 분석 → 12개월 에너지 진폭 계산 → AI 정밀 분석으로 행동 에너지 최고조 구간 식별 → 상위 3개월 추출
    </span>
  </div>

  <div class="gt-best-row">
    <div class="gt-best first">
      <div class="gt-rank">🥇 BEST 1 · 최우선</div>
      <div class="gt-month">${gtMonths[0]}</div>
      <div class="gt-stars">★★★★★</div>
      <div class="gt-label">${gtLabels[0]}</div>
      <div class="gt-label" style="color:#F0C674;font-weight:600;font-size:10px;margin-top:4px">임계치 최고조</div>
      <div class="gt-label" style="font-size:10px;margin-top:2px">핵심 포지션 진입 적기</div>
    </div>
    <div class="gt-best">
      <div class="gt-rank">🥈 BEST 2</div>
      <div class="gt-month">${gtMonths[1]}</div>
      <div class="gt-stars">★★★★☆</div>
      <div class="gt-label">${gtLabels[1]}</div>
    </div>
    <div class="gt-best">
      <div class="gt-rank">🥉 BEST 3</div>
      <div class="gt-month">${gtMonths[2]}</div>
      <div class="gt-stars">★★★☆☆</div>
      <div class="gt-label">${gtLabels[2]}</div>
    </div>
  </div>

  <!-- ★ 복원: 구간별 실행 전략 3줄 -->
  <div class="gt-strategy-box">
    <div class="gt-strategy-title">⚡ ${archetype} 골든타임 구간별 실행 전략</div>
    <div class="gt-strategy-item"><span class="gt-strategy-bullet">✦</span> ${gtMonths[0]} <strong>전 준비:</strong> ${gtStrategy1}</div>
    <div class="gt-strategy-item"><span class="gt-strategy-bullet">✦</span> ${gtMonths[0]} <strong>진입 시:</strong> ${gtStrategy2}</div>
    <div class="gt-strategy-item"><span class="gt-strategy-bullet">✦</span> ${cautionPeriod} <strong>주의:</strong> ${gtStrategy3}</div>
  </div>

  <!-- ★ v63: 골든타임 활용 편익 박스 -->
  <div style="margin-top:16px;background:rgba(34,197,94,.06);border:1px solid rgba(34,197,94,.2);border-radius:12px;padding:16px 20px">
    <div style="font-size:10px;font-weight:700;color:#22C55E;letter-spacing:1px;margin-bottom:10px">✅ 골든타임을 따르면 이렇게 달라집니다</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
      <div style="background:rgba(255,255,255,.04);border-radius:8px;padding:10px 12px">
        <div style="font-size:18px;margin-bottom:4px">📈</div>
        <div style="font-size:11px;font-weight:700;color:#E2E8F0;margin-bottom:4px">진입 타이밍 개선</div>
        <div style="font-size:10px;color:#94A3B8;line-height:1.6">에너지 최고조 구간에 집중 진입 → 평균 매수가 개선 → 동일 자금 대비 수익률 향상</div>
      </div>
      <div style="background:rgba(255,255,255,.04);border-radius:8px;padding:10px 12px">
        <div style="font-size:18px;margin-bottom:4px">🛡</div>
        <div style="font-size:11px;font-weight:700;color:#E2E8F0;margin-bottom:4px">손실 구간 회피</div>
        <div style="font-size:10px;color:#94A3B8;line-height:1.6">주의구간 신규 진입 자제 → 충동 매매 차단 → 불필요한 손실 예방</div>
      </div>
      <div style="background:rgba(255,255,255,.04);border-radius:8px;padding:10px 12px">
        <div style="font-size:18px;margin-bottom:4px">🎯</div>
        <div style="font-size:11px;font-weight:700;color:#E2E8F0;margin-bottom:4px">금융 행동력 강화</div>
        <div style="font-size:10px;color:#94A3B8;line-height:1.6">골든타임 실행 1회 → 행동 일관성 데이터 축적 → 금융 실행력 강화</div>
      </div>
    </div>
  </div>

  <!-- ★ v61: 지금 당장 1가지 액션박스 -->
  <div style="margin-top:16px;background:linear-gradient(135deg,rgba(240,198,116,0.12),rgba(45,140,255,0.08));border:1.5px solid #F0C674;border-radius:12px;padding:18px 20px">
    <div style="font-size:10px;font-weight:700;color:#F0C674;letter-spacing:1.5px;margin-bottom:8px">🎯 지금 당장 1가지</div>
    <div style="font-size:11px;font-weight:600;color:#2D8CFF;margin-bottom:6px">${nowActionTitle}</div>
    <div style="font-size:13px;font-weight:700;color:#E2E8F0;line-height:1.7;margin-bottom:8px">${nowActionMain}</div>
    <div style="font-size:11px;color:#94A3B8;border-top:1px solid rgba(255,255,255,0.1);padding-top:8px">+ ${coreEl} 코어 에너지 실천: ${nowActionSub}</div>
  </div>
</div>

<!-- ══════════ S06 히트맵 ══════════ -->
<div class="section section-alt">
  <div class="section-num" id="sec06">SECTION 06</div>
  <div class="section-title">투자 리스크 히트맵 — 6종목 적합도</div>
  <div class="section-divider"></div>
  <div style="background:rgba(255,255,255,.04);border-left:3px solid #EF4444;border-radius:0 8px 8px 0;padding:10px 14px;margin-bottom:14px;font-size:11px;color:#CBD5E1;line-height:1.6;">
    💡 <strong style="color:#F1F5F9;">이 섹션은?</strong> 6가지 투자 상품 유형과 나의 적합도를 분석합니다. ✅가 많을수록 나에게 맞는 투자 방식입니다.
  </div>
  <div class="risk-grid">
    <div class="risk-card"><div class="risk-icon">📈</div><div class="risk-name">단기 투자</div><div class="risk-badge ${rc(rm.short)}">${rm.short}</div></div>
    <div class="risk-card"><div class="risk-icon">🏠</div><div class="risk-name">부동산</div><div class="risk-badge ${rc(rm.real)}">${rm.real}</div></div>
    <div class="risk-card"><div class="risk-icon">🚀</div><div class="risk-name">창업 투자</div><div class="risk-badge ${rc(rm.startup)}">${rm.startup}</div></div>
    <div class="risk-card"><div class="risk-icon">📊</div><div class="risk-name">장기 투자</div><div class="risk-badge ${rc(rm.long)}">${rm.long}</div></div>
    <div class="risk-card"><div class="risk-icon">₿</div><div class="risk-name">암호화폐</div><div class="risk-badge ${rc(rm.crypto)}">${rm.crypto}</div></div>
    <div class="risk-card"><div class="risk-icon">🌐</div><div class="risk-name">ETF</div><div class="risk-badge ${rc(rm.etf)}">${rm.etf}</div></div>
  </div>
</div>

<!-- ══════════ S07 포트폴리오 ══════════ -->
<div class="section">
  <div class="section-num" id="sec07">SECTION 07</div>
  <div class="section-title">${archetype} 맞춤 포트폴리오</div>
  <div class="section-divider"></div>
  <div style="background:rgba(255,255,255,.04);border-left:3px solid #00C896;border-radius:0 8px 8px 0;padding:10px 14px;margin-bottom:14px;font-size:11px;color:#CBD5E1;line-height:1.6;">
    💡 <strong style="color:#F1F5F9;">이 섹션은?</strong> ${name}님의 코어 에너지와 아키타입에 맞는 AI 추천 최적 자산 배분 비율입니다.
  </div>
  <div style="font-size:12px;color:#94A3B8;margin-bottom:16px">${elName} 코어 에너지 기반 자산 배분</div>
  <div class="pf-type-box">
    <div class="pf-type-name">${portfolioType}</div>
    <div class="pf-type-desc">📊 ${portfolioType} 종합 진단: ${portfolioDesc}</div>
  </div>
  <div class="pf-bars">
    ${pfItems.map(function(item){
      return '<div class="pfbar-row"><div class="pfbar-label">'+item[0]+'</div><div class="pfbar-track"><div class="pfbar-fill" style="width:'+item[1]+'%"></div></div><div class="pfbar-pct">'+item[1]+'%</div></div>';
    }).join('')}
  </div>
  <div class="pf-ai-box"><span class="pf-ai-icon">🤖</span><strong>AI 포트폴리오 인사이트</strong><br>${portfolioInsight}</div>
</div>

<!-- ══════════ S08 성장 로드맵 ══════════ -->
<div class="section section-alt">
  <div class="section-num" id="sec08">SECTION 08</div>
  <div class="section-title">N-Score 성장 로드맵</div>
  <div class="section-divider"></div>
  <div style="background:rgba(255,255,255,.04);border-left:3px solid #2D8CFF;border-radius:0 8px 8px 0;padding:10px 14px;margin-bottom:14px;font-size:11px;color:#CBD5E1;line-height:1.6;">
    💡 <strong style="color:#F1F5F9;">이 섹션은?</strong> 지금부터 내 N-Score가 어떻게 성장할 수 있는지 단계별 로드맵을 보여드립니다.
  </div>
  ${ageLabel ? '<div class="roadmap-age"><div class="roadmap-age-label">' + ageLabel + '</div><div class="roadmap-age-desc">' + ageDesc + '</div></div>' : ''}

  <!-- 생월 입력 시에만 계절 에너지 표시 -->
  ${seasonLabel ? '<div class="roadmap-season"><span class="roadmap-season-label">' + seasonLabel + ' —</span>' + seasonDesc + '</div>' : ''}

  <div class="roadmap-cards">
    <div class="rm-card">
      <div class="rm-label">현재</div>
      <div class="rm-score">${nscore}</div>
      <div class="rm-grade">${ngrade} 등급</div>
      <div class="rm-diff" style="color:#94A3B8">현재 위치</div>
    </div>
    <div class="rm-card">
      <div class="rm-label">3개월 행동력 목표</div>
      <div class="rm-score">${nscore3m}</div>
      <div class="rm-grade">${ngrade3m} 등급</div>
      <div class="rm-diff" style="color:#64748B;font-size:9px">Phase 2 연동 후 갱신</div>
    </div>
    <div class="rm-card">
      <div class="rm-label">12개월 행동력 목표</div>
      <div class="rm-score">${nscore12m}</div>
      <div class="rm-grade">${ngrade12m} 등급</div>
      <div class="rm-diff" style="color:#64748B;font-size:9px">Phase 2 연동 후 갱신</div>
    </div>
  </div>
  <div class="rm-actions">
    <div class="rm-action-title">⚡ 3개월 핵심 행동</div>
    <div class="rm-action-item">• ${ {
      ENTJ:'골든타임 선제 진입 + 하향식 전략 포지션 구축',
      INTJ:'분석 완료 종목 24시간 내 실행 원칙 적용',
      ENTP:'아이디어 검증 후 소규모 진입 → 단계적 확대',
      INTP:'백테스트 기반 전략 1개 실전 적용',
      ENFJ:'소비 트렌드 선도 섹터 중심 비중 확대',
      INFJ:'장기 가치주 1개 추가 + 변동성 헤지 준비',
      ENFP:'성장주 비중 유지 + 손절가 수치 명문화',
      INFP:'가치 기반 종목 원칙 점검 + 골든타임 진입 계획',
      ESTJ:'계획 대비 집행률 점검 + 월별 KPI 재설정',
      ISTJ:'원칙 문서화 + 예외 없는 손절 시스템 자동화',
      ESTP:'단기 타깃 익절 완료 + 다음 타깃 선정',
      ISTP:'포트폴리오 구조 재점검 + 집중 종목 2개 선별',
      ESFJ:'안정 자산 비중 유지 + 배당 재투자 루틴 확립',
      ISFJ:'보유 종목 전수 리스크 점검 + 현금 비중 확인',
      ESFP:'실행 속도 유지 + 충동 매수 48시간 대기 규칙',
      ISFP:'저평가 종목 발굴 + 소액 분할 진입 1회 실행'
    }[archetype] || '골든타임 1회 실전 적용 + KPI 2개 개선'}</div>
    <div class="rm-goal-box">🎯 <strong>12개월 목표:</strong> ${ {
      ENTJ:'금융 행동력 2단계 강화 — 시스템 트레이딩 구조 완성',
      INTJ:'투자 실행력 강화 + 독립 투자 철학 문서화',
      ENTP:'금융 행동력 안정화 + 아이디어 실행 비율 60% 달성',
      INTP:'모델 검증 완료 + 실전 적용 수익률 실증',
      ENFJ:'금융 행동력 강화 + 소비 트렌드 선도 포트폴리오 구축',
      INFJ:'장기 가치주 수익 실현 + 금융 행동력 한 단계 도약',
      ENFP:'충동 매수 제로화 + 금융 행동력 안정적 강화',
      INFP:'원칙 기반 투자 철학 완성 + 배당 수익 첫 실현',
      ESTJ:'계획 집행률 90% 달성 + 금융 실행력 강화',
      ISTJ:'손절 시스템 완성 + 안정적 금융 행동력 강화',
      ESTP:'단기 수익률 최적화 + 포지션 규모 체계화',
      ISTP:'집중 포트폴리오 구조 완성 + 위기 대응 매뉴얼 작성',
      ESFJ:'배당 포트폴리오 완성 + 금융 행동력 안정화',
      ISFJ:'리스크 면역 강화 + 안정적 자산 수성 체계 완성',
      ESFP:'실행 체계화 + 충동 제어 루틴 정착',
      ISFP:'저평가 발굴 시스템화 + 금융 행동력 꾸준한 강화'
    }[archetype] || '금융 행동력 강화 — 손절 시스템 완성'}<br>${ss(ai.roadmapTip) || '골든타임 구간 집중 실행이 금융 행동력 강화의 가장 확실한 경로입니다. '}</div>
  </div>

  <!-- ★ v63: N-Score가 오르면 달라지는 것 -->
  <div style="margin-top:16px;background:rgba(45,140,255,.06);border:1px solid rgba(45,140,255,.15);border-radius:12px;padding:16px 20px">
    <div style="font-size:10px;font-weight:700;color:#2D8CFF;letter-spacing:1px;margin-bottom:12px">🔬 금융 행동력을 강화하면 달라지는 것</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div style="display:flex;align-items:flex-start;gap:8px">
        <div style="width:20px;height:20px;border-radius:50%;background:rgba(240,198,116,.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:11px;font-weight:700;color:#F0C674">1</div>
        <div style="font-size:11px;color:#94A3B8;line-height:1.6"><strong style="color:#E2E8F0">투자 신뢰도 향상</strong><br>행동 일관성 점수 상승 → 스스로 원칙을 지키는 패턴이 데이터로 증명됩니다.</div>
      </div>
      <div style="display:flex;align-items:flex-start;gap:8px">
        <div style="width:20px;height:20px;border-radius:50%;background:rgba(34,197,94,.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:11px;font-weight:700;color:#22C55E">2</div>
        <div style="font-size:11px;color:#94A3B8;line-height:1.6"><strong style="color:#E2E8F0">리스크 대응력 강화</strong><br>위기 대응력 지표 상승 → 시장 급락 시 감정 매매 비율이 줄어듭니다.</div>
      </div>
      <div style="display:flex;align-items:flex-start;gap:8px">
        <div style="width:20px;height:20px;border-radius:50%;background:rgba(45,140,255,.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:11px;font-weight:700;color:#2D8CFF">3</div>
        <div style="font-size:11px;color:#94A3B8;line-height:1.6"><strong style="color:#E2E8F0">마이데이터 연동 우선 배정</strong><br>N-Score 상위 유저부터 카드 결제 데이터 연동 베타 서비스를 우선 배정받습니다.</div>
      </div>
      <div style="display:flex;align-items:flex-start;gap:8px">
        <div style="width:20px;height:20px;border-radius:50%;background:rgba(239,68,68,.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:11px;font-weight:700;color:#EF4444">4</div>
        <div style="font-size:11px;color:#94A3B8;line-height:1.6"><strong style="color:#E2E8F0">예측 정밀도 상승</strong><br>행동 데이터 누적 → N-KAI AI 예측 모델이 ${name}님 전용으로 더욱 정밀해집니다.</div>
      </div>
    </div>
  </div>
</div>

<div style="font-size:9px;color:#334155;margin-top:12px;padding:6px 10px;border-top:1px solid rgba(255,255,255,.05);line-height:1.6;">* N-Score 수치 갱신은 마이데이터 연동 후 지원됩니다.</div>

<!-- ══════════ S09 에너지 공명 분석 ══════════ -->
<div class="section">
  <div class="section-num" id="sec09">SECTION 09</div>
  <div class="section-title">에너지 공명 분석 — 내 금융 패턴과 맞는 에너지</div>
  <div class="section-divider"></div>
  <div style="background:rgba(255,255,255,.04);border-left:3px solid #A78BFA;border-radius:0 8px 8px 0;padding:10px 14px;margin-bottom:14px;font-size:11px;color:#CBD5E1;line-height:1.6;">
    💡 <strong style="color:#F1F5F9;">이 섹션은?</strong> 두 가지 관점으로 분석한 나의 에너지 공명 패턴입니다. 서로 겹치는 특성이 내 핵심 성향입니다.
  </div>
  <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:12px 16px;margin-bottom:18px">
    <div style="font-size:11px;font-weight:700;color:#F0C674;margin-bottom:6px">💡 공명 분석이란?</div>
    <div style="font-size:11px;color:#94A3B8;line-height:1.7">
      동양의 5-Energy(목·화·토·금·수)와 서양의 4원소(불·흙·공기·물)는 수천 년간 독립적으로 발전했지만, 인간의 행동 패턴을 설명하는 원리가 놀랍도록 일치합니다. N-KAI는 이 두 체계를 교차 분석하여 나의 금융 패턴과 얼마나 잘 맞는지(공명도)를 측정합니다.<br>
      <span style="display:block;margin-top:8px;line-height:2.1;font-size:11px">
      🔥 <strong style="color:#EF4444">火 · 불(Fire)</strong> — 동양의 火(열정·도전) = 서양의 불(Fire). 빠른 실행·모멘텀 에너지<br>
      ⛰ <strong style="color:#F59E0B">土 · 흙(Earth)</strong> — 동양의 土(안정·균형) = 서양의 흙(Earth). 방어적·안정 자산 에너지<br>
      💨 <strong style="color:#94A3B8">Air · 바람</strong> — 서양의 공기(Air). 분석·정보·소통 기반 투자 에너지<br>
      💧 <strong style="color:#2D8CFF">水 · 물(Water)</strong> — 동양의 水(지혜·흐름) = 서양의 물(Water). 유동성·분산 에너지
      </span>
      <span style="display:block;margin-top:8px;font-size:10px;color:#64748B">★★★★★ 최강 공명 — 해당 자산군·상황에서 나의 금융 패턴이 극대화됩니다.</span>
      <span style="display:block;font-size:10px;color:#64748B">★★☆☆☆ 낮은 공명 — 해당 상황에서 충동적 결정이나 실수가 발생하기 쉽습니다.</span>
    </div>
  </div>
  <table class="resonance-table">
    <thead>
      <tr>
        <th>원소</th>
        <th>개념</th>
        <th>공명도</th>
        <th>금융 해석</th>
      </tr>
    </thead>
    <tbody>
      ${reactions.map(function(r){
        return '<tr><td><strong>'+r.symbol+' '+r.element+' · '+r.name+'</strong></td>'
          +'<td style="color:#94A3B8;font-size:11px">'+({'火':'열정·도전·확장','土':'안정·균형·중심','金':'결단·수렴·정밀','水':'지혜·유연·흐름','木':'성장·확장·생명','Air':'분석·정보·바람','Water':'지혜·유연·흐름'}[r.element]||r.element)+'</td>'
          +'<td><span class="stars-gold">'+r.stars+'</span></td>'
          +'<td>'
          +'<div class="react-label">'+r.react+'</div>'
          +'<div class="react-detail">'+r.desc+'</div>'
          +'</td></tr>';
      }).join('')}
    </tbody>
  </table>
</div>

<!-- ══════════ S10 케미스트리 ══════════ -->
<div class="section section-alt">
  <div class="section-num" id="sec10">SECTION 10</div>
  <div class="section-title">금융 케미스트리 궁합 — ${archetype} 최적 파트너</div>
  <div class="section-divider"></div>
  <div style="background:rgba(255,255,255,.04);border-left:3px solid #F0C674;border-radius:0 8px 8px 0;padding:10px 14px;margin-bottom:14px;font-size:11px;color:#CBD5E1;line-height:1.6;">
    💡 <strong style="color:#F1F5F9;">이 섹션은?</strong> AI가 분석한 나와 금융적으로 가장 잘 맞는 파트너 유형입니다. MBTI 궁합이 아닌 <strong style=\"color:#F0C674\">금융 행동 패턴 기반</strong> 궁합입니다. 함께 투자하거나 금융 결정을 내릴 때 서로의 약점을 보완하는 조합입니다.
  </div>
  <div class="chem-cards">
    ${chemList.map(function(c, i){
      return '<div class="chem-card'+(i===0?' first':'')+'"><div class="chem-rank">'+c.rank+'</div>'
        +'<div class="chem-type">'+c.type+'</div>'
        +'<div class="chem-name">'+c.name+'</div>'
        +'<div class="chem-desc">'+c.desc+'</div>'
        +'<div class="chem-detail">'+c.detail+'</div>'
        +'</div>';
    }).join('')}
  </div>

  <!-- ★ 복원: 금융 케미스트리란? 설명 박스 -->
  <div class="chem-explain">
    💡 <strong>금융 케미스트리란?</strong><br>
    투자·재무 의사결정에서 아키타입 간 행동 벡터의 보완 관계를 분석한 것입니다. 혼자 결정할 때 놓치기 쉬운 리스크를 파트너 유형이 자연스럽게 채워줍니다.
  </div>

  <!-- ★ v67: ③ 케미스트리 파트너 초대 버튼 (선물 버튼 제거 → 공유카드 섹션에서 1회만) -->
  <div style="margin-top:14px">
    <a href="https://www.neurinkairosai.com/?ref_arch=${archetype}&utm_source=pdf&utm_medium=chemistry&utm_campaign=partner_invite" target="_blank"
       style="display:flex;align-items:center;gap:12px;background:rgba(45,140,255,.08);border:1px solid rgba(45,140,255,.25);border-radius:12px;padding:14px 18px;text-decoration:none">
      <span style="font-size:22px;flex-shrink:0">🤝</span>
      <div>
        <div style="font-size:12px;font-weight:700;color:#2D8CFF;margin-bottom:3px">1순위 파트너 ${chemList[0]?chemList[0].type:'INTJ'}에게 분석 보내기</div>
        <div style="font-size:10px;color:#64748B;line-height:1.5">궁합 파트너의 금융 DNA 확인 → 함께 투자 전략 수립<br>파트너가 분석받으면 내 N-Score +2점 적립 예정</div>
      </div>
      <div style="margin-left:auto;font-size:10px;color:#2D8CFF;font-weight:700;white-space:nowrap">무료 →</div>
    </a>
  </div>
</div>

${tier === 'premium' ? `

<!-- ══════════ S11 행동 예측 시나리오 [PREMIUM] ══════════ -->
<div class="section section-alt" style="page-break-inside:avoid">
  <div class="section-num" id="sec11">SECTION 11 · PREMIUM EXCLUSIVE</div>
  <div class="section-title">행동 예측 시나리오 — 3Track Forecast</div>
  <div class="section-divider"></div>
  <div style="background:rgba(255,255,255,.04);border-left:3px solid #22C55E;border-radius:0 8px 8px 0;padding:10px 14px;margin-bottom:14px;font-size:11px;color:#CBD5E1;line-height:1.6;">
    💡 <strong style="color:#F1F5F9;">이 섹션은?</strong> AI가 예측한 나의 3가지 금융 행동 시나리오입니다. 낙관/중립/보수 세 가지 트랙 중 어떤 경로를 선택할지 미리 확인하세요.
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:16px">
    <div style="background:rgba(34,197,94,.08);border:2px solid rgba(34,197,94,.4);border-radius:14px;padding:20px 16px">
      <div style="font-size:10px;letter-spacing:2px;color:#22C55E;font-weight:700;margin-bottom:8px">📈 OPTIMISTIC</div>
      <div style="font-size:15px;font-weight:900;color:#fff;margin-bottom:10px">상승 시나리오</div>
      <div style="font-size:11px;color:#94A3B8;line-height:1.7">${ai.scenario_up || '골든타임 구간에서 핵심 포지션 진입 성공 시 N-KAI 예측 신뢰도 상승. N-Score 돌파 경로 개방 예상.'}</div>
      <div style="margin-top:12px;background:rgba(34,197,94,.12);border-radius:6px;padding:8px;font-size:14px;color:#22C55E;font-weight:900;text-align:center">확률 ${ai.prob_up || '35'}%</div>
    </div>
    <div style="background:rgba(45,140,255,.08);border:2px solid rgba(45,140,255,.4);border-radius:14px;padding:20px 16px">
      <div style="font-size:10px;letter-spacing:2px;color:#2D8CFF;font-weight:700;margin-bottom:8px">➡️ NEUTRAL</div>
      <div style="font-size:15px;font-weight:900;color:#fff;margin-bottom:10px">중립 시나리오</div>
      <div style="font-size:11px;color:#94A3B8;line-height:1.7">${ai.scenario_mid || '현재 행동 패턴 유지 시 안정적 성과 달성. 주의구간 무사 통과 시 등급 상단 안정화.'}</div>
      <div style="margin-top:12px;background:rgba(45,140,255,.12);border-radius:6px;padding:8px;font-size:14px;color:#2D8CFF;font-weight:900;text-align:center">확률 ${ai.prob_mid || '45'}%</div>
    </div>
    <div style="background:rgba(239,68,68,.08);border:2px solid rgba(239,68,68,.4);border-radius:14px;padding:20px 16px">
      <div style="font-size:10px;letter-spacing:2px;color:#EF4444;font-weight:700;margin-bottom:8px">📉 DOWNSIDE</div>
      <div style="font-size:15px;font-weight:900;color:#fff;margin-bottom:10px">하방 시나리오</div>
      <div style="font-size:11px;color:#94A3B8;line-height:1.7">${ai.scenario_dn || '주의구간 충동 실행 발생 시 리스크 노출. 손절 기준선 미설정이 하방 트리거.'}</div>
      <div style="margin-top:12px;background:rgba(239,68,68,.12);border-radius:6px;padding:8px;font-size:14px;color:#EF4444;font-weight:900;text-align:center">확률 ${ai.prob_dn || '20'}%</div>
    </div>
  </div>
</div>

<!-- ══════════ S12 3개월 액션 체크리스트 [PREMIUM] ══════════ -->
<div class="section" style="page-break-inside:avoid">
  <div class="section-num" id="sec12">SECTION 12 · PREMIUM EXCLUSIVE</div>
  <div class="section-title">3개월 액션 체크리스트 — ${archetype} 맞춤 실행 플랜</div>
  <div class="section-divider"></div>
  <div style="background:rgba(255,255,255,.04);border-left:3px solid #2D8CFF;border-radius:0 8px 8px 0;padding:10px 14px;margin-bottom:14px;font-size:11px;color:#CBD5E1;line-height:1.6;">
    💡 <strong style="color:#F1F5F9;">이 섹션은?</strong> 지금 당장 실행할 수 있는 3개월 단위 액션 플랜입니다. 체크리스트를 하나씩 완료하면 N-Score가 자동으로 성장합니다.
  </div>
  <!-- ★ v61: 즉시 실행 포인트 -->
  <div style="background:rgba(45,140,255,0.1);border-left:3px solid #2D8CFF;border-radius:0 8px 8px 0;padding:12px 16px;margin-bottom:16px;font-size:12px;color:#E2E8F0;line-height:1.7">
    <strong style="color:#2D8CFF">🎯 Month 1 첫 번째 할 일:</strong> 아래 체크리스트 중 오늘 당장 할 수 있는 항목 1개를 골라 지금 시작하세요. 완벽한 준비보다 <strong>1가지 실행</strong>이 N-Score를 올립니다.
  </div>
    <div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-top:3px solid #F0C674;border-radius:12px;padding:20px 16px">
      <div style="font-size:11px;font-weight:700;color:#F0C674;margin-bottom:12px">📅 Month 1 — ${ai.check_m1_title || '기반 구축'}</div>
      <div style="font-size:11px;color:#94A3B8;line-height:2.0">${ai.check_m1 || '☑ 손절 기준선 수치 명문화<br>☑ 포트폴리오 전수 점검<br>☑ 리스크 허용 한도 설정<br>☑ 주간 점검 루틴 확립<br>☑ 긴급 유동성 10% 확보'}</div>
    </div>
    <div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-top:3px solid #2D8CFF;border-radius:12px;padding:20px 16px">
      <div style="font-size:11px;font-weight:700;color:#2D8CFF;margin-bottom:12px">📅 Month 2 — ${ai.check_m2_title || '포지션 조정'}</div>
      <div style="font-size:11px;color:#94A3B8;line-height:2.0">${ai.check_m2 || '☑ 핵심 지표 2개 집중 개선<br>☑ ETF 분산 진입 시작<br>☑ 주의구간 헤지 준비<br>☑ N-Score 주간 트래킹<br>☑ 상관관계 낮은 섹터 선별'}</div>
    </div>
    <div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-top:3px solid #22C55E;border-radius:12px;padding:20px 16px">
      <div style="font-size:11px;font-weight:700;color:#22C55E;margin-bottom:12px">📅 Month 3 — ${ai.check_m3_title || '골든타임 준비'}</div>
      <div style="font-size:11px;color:#94A3B8;line-height:2.0">${ai.check_m3 || '☑ 골든타임 진입 자금 30% 확보<br>☑ 익절 기준선 사전 설정<br>☑ 최적 파트너 전략 싱크<br>☑ 3개월 성과 리뷰<br>☑ 다음 분기 전략 수립'}</div>
    </div>
  </div>
</div>

<!-- ══════════ S13 카이로스 선언문 [PREMIUM] ══════════ -->
<div class="section section-alt" style="page-break-inside:avoid">
  <div class="section-num" id="sec13">SECTION 13 · PREMIUM EXCLUSIVE</div>
  <div class="section-title">카이로스 선언문 — Personal Declaration</div>
  <div class="section-divider"></div>
  <div style="background:rgba(255,255,255,.04);border-left:3px solid #F0C674;border-radius:0 8px 8px 0;padding:10px 14px;margin-bottom:14px;font-size:11px;color:#CBD5E1;line-height:1.6;">
    💡 <strong style="color:#F1F5F9;">이 섹션은?</strong> AI가 나의 금융 DNA를 기반으로 작성한 나만의 투자 선언문입니다. 이 선언문을 나침반으로 삼아 금융 결정을 내리세요.
  </div>
  <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:12px 16px;margin-bottom:16px">
    <div style="font-size:11px;font-weight:700;color:#F0C674;margin-bottom:6px">💡 카이로스 선언문이란?</div>
    <div style="font-size:11px;color:#94A3B8;line-height:1.7">
      <strong style="color:#E2E8F0">카이로스(Kairos)</strong>는 그리스어로 <strong style="color:#E2E8F0">"결정적인 순간"</strong>을 뜻합니다.<br>
      N-KAI가 ${name}님의 금융 행동 패턴을 분석하여 만든 <strong style="color:#F0C674">나만의 투자 철학 선언문</strong>입니다.<br>
      시장이 흔들릴 때, 이 선언문을 기준으로 원칙을 지키십시오.
    </div>
  </div>
  <div style="background:rgba(240,198,116,.06);border:1px solid rgba(240,198,116,.25);border-radius:14px;padding:32px 36px;text-align:center">
    <div style="font-size:10px;letter-spacing:3px;color:#F0C674;margin-bottom:20px;font-weight:700">✦ N-KAI KAIROS DECLARATION · ${name}님 전용</div>
    <div style="font-size:20px;font-weight:900;color:#fff;line-height:1.7;margin-bottom:24px">"${ai.declaration || '나는 시장이 망설일 때 결단하고, 시장이 흥분할 때 침묵한다.'}"</div>
    <div style="border-top:1px solid rgba(255,255,255,.08);padding-top:16px;display:flex;justify-content:center;gap:32px">
      <div style="text-align:center">
        <div style="font-size:10px;color:#64748B;margin-bottom:4px">행동 임계치 초과 확률</div>
        <div style="font-size:22px;font-weight:900;color:#F0C674">${ai.threshold_prob || '0.73'}</div>
      </div>
      <div style="text-align:center">
        <div style="font-size:10px;color:#64748B;margin-bottom:4px">아키타입</div>
        <div style="font-size:22px;font-weight:900;color:#F0C674">${archetype}</div>
      </div>
      <div style="text-align:center">
        <div style="font-size:10px;color:#64748B;margin-bottom:4px">N-Score 등급</div>
        <div style="font-size:22px;font-weight:900;color:#F0C674">${ngrade}</div>
      </div>
    </div>
  </div>
</div>

<!-- ══════════ S14 카이로스 타이밍 점수 [PREMIUM] ══════════ -->
<div class="section" style="page-break-inside:avoid">
  <div class="section-num" id="sec14">SECTION 14 · PREMIUM EXCLUSIVE</div>
  <div class="section-title">카이로스 타이밍 점수 — 지금 이 순간의 임계치</div>
  <div class="section-divider"></div>
  <div style="background:rgba(255,255,255,.04);border-left:3px solid #FFD93D;border-radius:0 8px 8px 0;padding:10px 14px;margin-bottom:14px;font-size:11px;color:#CBD5E1;line-height:1.6;">
    💡 <strong style="color:#F1F5F9;">이 섹션은?</strong> 지금 이 순간 내 행동 에너지가 몇 점인지 알려드립니다. 점수가 높을수록 지금이 행동하기 좋은 타이밍입니다.
  </div>
  ${(()=>{
    var nowMonth = new Date().getMonth()+1;
    var monthNames=['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
    var kScore = parseInt(ai.kairos_score||'0')||0;
    if(!kScore){var mKey='hm_'+(nowMonth<10?'0':'')+nowMonth+'_score';kScore=parseInt(ai[mKey]||'0')||Math.round(40+(parseInt(String(nscore).slice(-2))||0)*0.4);}
    var kLabel=ai.kairos_month_label||(kScore>=85?'최강':kScore>=70?'상승':kScore>=50?'보통':kScore>=35?'낮음':'주의');
    var kColor=kScore>=85?'#F0C674':kScore>=70?'#22C55E':kScore>=50?'#2D8CFF':kScore>=35?'#64748B':'#EF4444';
    var kBg=kScore>=85?'rgba(240,198,116,.12)':kScore>=70?'rgba(34,197,94,.1)':kScore>=50?'rgba(45,140,255,.08)':kScore>=35?'rgba(255,255,255,.04)':'rgba(239,68,68,.1)';
    var kBorder=kScore>=85?'rgba(240,198,116,.4)':kScore>=70?'rgba(34,197,94,.4)':kScore>=50?'rgba(45,140,255,.4)':kScore>=35?'rgba(255,255,255,.15)':'rgba(239,68,68,.4)';
    var kDesc=kScore>=85?'지금이 최고의 타이밍입니다. N-KAI 예측 엔진이 감지한 행동 임계치가 최고조입니다. 골든타임 포지션 진입을 즉시 실행하십시오.':kScore>=70?'상승 구간입니다. 임계치가 충분히 높아 계획된 포지션 진입에 유리한 시점입니다.':kScore>=50?'보통 구간입니다. 신중한 소규모 진입 또는 리서치에 집중하십시오.':kScore>=35?'에너지가 낮은 구간입니다. 현금 비중을 유지하고 다음 골든타임을 준비하십시오.':'주의 구간입니다. 신규 포지션을 자제하고 기존 포지션 리스크를 점검하십시오.';
    var dashArr=282.7; var dashOff=Math.round(dashArr*(1-kScore/100));
    return '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:center">'
      +'<div style="background:'+kBg+';border:2px solid '+kBorder+';border-radius:16px;padding:28px;text-align:center">'
      +'<div style="font-size:11px;color:#94A3B8;letter-spacing:2px;margin-bottom:16px;font-weight:600">'+monthNames[nowMonth-1]+' 카이로스 에너지</div>'
      +'<svg viewBox="0 0 200 110" width="200" style="display:block;margin:0 auto 12px">'
      +'<path d="M 10 100 A 90 90 0 0 1 190 100" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="16" stroke-linecap="round"/>'
      +'<path d="M 10 100 A 90 90 0 0 1 190 100" fill="none" stroke="'+kColor+'" stroke-width="16" stroke-linecap="round" stroke-dasharray="'+dashArr+'" stroke-dashoffset="'+dashOff+'" opacity="0.9"/>'
      +'<text x="100" y="88" text-anchor="middle" fill="'+kColor+'" font-size="36" font-weight="900">'+kScore+'</text>'
      +'<text x="100" y="108" text-anchor="middle" fill="'+kColor+'" font-size="12" font-weight="700">/100</text>'
      +'</svg>'
      +'<div style="display:inline-block;background:'+kColor+';color:#071523;font-size:13px;font-weight:900;padding:5px 18px;border-radius:20px;margin-top:4px">'+kLabel+'</div>'
      +'</div>'
      +'<div>'
      +'<div style="font-size:13px;color:#E2E8F0;line-height:1.8;margin-bottom:16px">'+kDesc+'</div>'
      +'<div style="background:rgba(255,255,255,.04);border-radius:10px;padding:14px 16px">'
      +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><span style="font-size:11px;color:#94A3B8">행동 임계치 초과 확률</span><span style="font-size:18px;font-weight:900;color:#F0C674">'+(ai.threshold_prob||'0.73')+'</span></div>'
      +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><span style="font-size:11px;color:#94A3B8">BEST 골든타임</span><span style="font-size:13px;font-weight:700;color:#22C55E">'+ss(data.goldentime1||'확인 필요')+'</span></div>'
      +'<div style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:11px;color:#94A3B8">현재 N-Score 등급</span><span style="font-size:13px;font-weight:700;color:#F0C674">'+ngrade+'</span></div>'
      +'</div>'
      +'</div>'
      +'</div>';
  })()}
</div>

<!-- ══════════ S15 연간 카이로스 히트맵 [PREMIUM] ══════════ -->
<div class="section" style="page-break-inside:avoid">
  <div class="section-num" id="sec15">SECTION 15 · PREMIUM EXCLUSIVE</div>
  <div class="section-title">연간 카이로스 히트맵 — 2026 에너지 흐름 캘린더</div>
  <div class="section-divider"></div>
  <div style="background:rgba(255,255,255,.04);border-left:3px solid #22C55E;border-radius:0 8px 8px 0;padding:10px 14px;margin-bottom:14px;font-size:11px;color:#CBD5E1;line-height:1.6;">
    💡 <strong style="color:#F1F5F9;">이 섹션은?</strong> 2026년 12개월의 에너지 흐름을 한눈에 보여드립니다. 진할수록 행동 에너지가 높은 달입니다.
  </div>
  ${(()=>{
    var months = [
      ['1월',ai.hm_01||'low',ai.hm_01_score||'42'],['2월',ai.hm_02||'mid',ai.hm_02_score||'55'],
      ['3월',ai.hm_03||'mid',ai.hm_03_score||'58'],['4월',ai.hm_04||'low',ai.hm_04_score||'44'],
      ['5월',ai.hm_05||'mid',ai.hm_05_score||'61'],['6월',ai.hm_06||'warn',ai.hm_06_score||'32'],
      ['7월',ai.hm_07||'best',ai.hm_07_score||'91'],['8월',ai.hm_08||'high',ai.hm_08_score||'74'],
      ['9월',ai.hm_09||'high',ai.hm_09_score||'78'],['10월',ai.hm_10||'mid',ai.hm_10_score||'62'],
      ['11월',ai.hm_11||'high',ai.hm_11_score||'71'],['12월',ai.hm_12||'mid',ai.hm_12_score||'56']
    ];
    var cfgMap = {
      best:{bg:'rgba(240,198,116,.15)',border:'#F0C674',color:'#F0C674',label:'최강'},
      high:{bg:'rgba(34,197,94,.1)',border:'#22C55E',color:'#22C55E',label:'상승'},
      mid: {bg:'rgba(45,140,255,.08)',border:'#2D8CFF',color:'#2D8CFF',label:'보통'},
      low: {bg:'rgba(255,255,255,.04)',border:'rgba(255,255,255,.1)',color:'#64748B',label:'낮음'},
      warn:{bg:'rgba(239,68,68,.1)',border:'#EF4444',color:'#EF4444',label:'주의'}
    };
    return '<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-bottom:8px">'
      + months.slice(0,6).map(function(m){var c=cfgMap[m[1]]||cfgMap.low;return '<div style="background:'+c.bg+';border:2px solid '+c.border+';border-radius:10px;padding:12px 4px;text-align:center"><div style="font-size:10px;color:#94A3B8;font-weight:700;margin-bottom:4px">'+m[0]+'</div><div style="font-size:18px;font-weight:900;color:'+c.color+'">'+m[2]+'</div><div style="font-size:9px;color:'+c.color+';margin-top:3px">'+c.label+'</div></div>';}).join('')
      + '</div><div style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px">'
      + months.slice(6).map(function(m){var c=cfgMap[m[1]]||cfgMap.low;return '<div style="background:'+c.bg+';border:2px solid '+c.border+';border-radius:10px;padding:12px 4px;text-align:center"><div style="font-size:10px;color:#94A3B8;font-weight:700;margin-bottom:4px">'+m[0]+'</div><div style="font-size:18px;font-weight:900;color:'+c.color+'">'+m[2]+'</div><div style="font-size:9px;color:'+c.color+';margin-top:3px">'+c.label+'</div></div>';}).join('')
      + '</div>'
      + '<div style="margin-top:14px">'
      + '<div style="font-size:10px;color:#94A3B8;font-weight:600;letter-spacing:1px;margin-bottom:8px">📌 에너지 구간별 금융 행동 가이드</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">'
      + [
          ['🟡 최강·상승 구간', '#F0C674', 'rgba(240,198,116,.08)', 'rgba(240,198,116,.25)',
           '신규 포지션 진입', '계약·대출 실행', '핵심 자산 집중 매수'],
          ['🔵 보통 구간', '#2D8CFF', 'rgba(45,140,255,.06)', 'rgba(45,140,255,.2)',
           '기존 포지션 유지', '리서치·분석 집중', '소규모 적립 지속'],
          ['🔴 주의·낮음 구간', '#EF4444', 'rgba(239,68,68,.06)', 'rgba(239,68,68,.2)',
           '대규모 투자 자제', '현금 비중 10~20% 확보', '계약·서명 재검토']
        ].map(function(t){
          return '<div style="background:'+t[2]+';border:1px solid '+t[3]+';border-radius:10px;padding:12px 10px">'
            +'<div style="font-size:10px;font-weight:700;color:'+t[1]+';margin-bottom:8px">'+t[0]+'</div>'
            +'<div style="display:flex;flex-direction:column;gap:4px">'
            +[t[4],t[5],t[6]].map(function(a){return '<div style="display:flex;align-items:center;gap:5px"><div style="width:4px;height:4px;background:'+t[1]+';border-radius:50%;flex-shrink:0"></div><div style="font-size:10px;color:#94A3B8;line-height:1.4">'+a+'</div></div>';}).join('')
            +'</div></div>';
        }).join('')
      + '</div></div>';
  })()}
</div>

<!-- ══════════ S16 갭 분석 [PREMIUM] ══════════ -->
<div class="section section-alt" style="page-break-inside:avoid">
  <div class="section-num" id="sec16">SECTION 16 · PREMIUM EXCLUSIVE</div>
  <div class="section-title">나 vs 동일 아키타입 상위 10% — 갭 분석</div>
  <div class="section-divider"></div>
  <div style="background:rgba(255,255,255,.04);border-left:3px solid #EF4444;border-radius:0 8px 8px 0;padding:10px 14px;margin-bottom:14px;font-size:11px;color:#CBD5E1;line-height:1.6;">
    💡 <strong style="color:#F1F5F9;">이 섹션은?</strong> ${name}님과 같은 ${archetype} 아키타입 상위 10%와의 차이를 분석합니다. 어느 영역을 강화하면 상위권에 진입할 수 있는지 알려드립니다.
  </div>
  ${(()=>{
    var rows = [
      ['💰 경제 감각',    String(kpi1Score), ai.gap_kpi1_top||String(Math.min(99,kpi1Score+12)), '#2D8CFF'], // ★FIX: kpi1Score 고정
      ['🎯 투자 기회 포착',String(kpi2Score), ai.gap_kpi2_top||String(Math.min(99,kpi2Score+12)), '#22C55E'], // ★FIX: kpi2Score 고정
      ['🛡 위기 대응력',  String(kpi3Score), ai.gap_kpi3_top||String(Math.min(99,kpi3Score+12)), '#F0C674'], // ★FIX: kpi3Score 고정
      ['N-Score',     String(nscore), ai.gap_nscore_top||String(Math.min(999,Math.round((nscore+150)/10)*10)), '#A78BFA'],
      ['골든타임 활용도',ai.gap_gt_me||'71', ai.gap_gt_top||'88', '#F59E0B']
    ];
    return '<div style="display:flex;flex-direction:column;gap:12px">'
      + rows.map(function(r){
          var meN=parseInt(r[1])||0; var topN=parseInt(r[2])||0; var gap=topN-meN;
          var gc=gap>15?'#EF4444':gap>5?'#F59E0B':'#22C55E';
          return '<div style="display:flex;align-items:center;gap:12px">'
            + '<div style="width:110px;font-size:12px;color:#94A3B8;font-weight:600">'+r[0]+'</div>'
            + '<div style="flex:1;background:rgba(255,255,255,.05);border-radius:8px;height:18px;position:relative;overflow:hidden">'
            + '<div style="position:absolute;left:0;top:0;height:100%;width:'+topN+'%;background:rgba(255,255,255,.06);border-radius:8px"></div>'
            + '<div style="position:absolute;left:0;top:0;height:100%;width:'+meN+'%;background:'+r[3]+';border-radius:8px;opacity:.9"></div></div>'
            + '<div style="width:80px;text-align:center"><span style="font-size:14px;font-weight:900;color:'+r[3]+'">'+r[1]+'</span><span style="font-size:10px;color:#475569"> / </span><span style="font-size:11px;color:#475569">'+r[2]+'</span></div>'
            + '<div style="width:48px;text-align:center"><span style="background:rgba(255,255,255,.06);color:'+gc+';font-size:11px;font-weight:700;padding:3px 6px;border-radius:4px">-'+gap+'</span></div>'
            + '</div>';
        }).join('')
      + '</div>'
      + '<div style="margin-top:16px;background:rgba(45,140,255,.08);border:1px solid rgba(45,140,255,.2);border-radius:10px;padding:16px 18px"><div style="font-size:11px;color:#2D8CFF;font-weight:700;margin-bottom:6px">🤖 AI 갭 분석 인사이트</div><div style="font-size:12px;color:#94A3B8;line-height:1.7">'+(ai.gap_insight||'위기 대응력과 골든타임 활용도에서 성장 여지가 가장 큽니다. 이 두 항목 집중 개선으로 금융 행동력 강화가 가능합니다. N-Score 수치 갱신은 Phase 2 마이데이터 연동 후 반영됩니다.')+'</div></div>'  // ★ v66 FIX: 세미콜론 제거 → 처방 렌더링 이어짐
      + '<div style="margin-top:12px;background:rgba(240,198,116,.06);border:1px solid rgba(240,198,116,.2);border-radius:10px;padding:16px 18px">'
      + '<div style="font-size:11px;font-weight:700;color:#F0C674;margin-bottom:10px;letter-spacing:1px">⚡ 지금 당장 실행할 성장 처방</div>'
      + '<div style="display:flex;flex-direction:column;gap:6px">'
      + [['💰','경제 감각 (돈을 끌어당기는 감각)',ai.gap_prescription_1||'시장 뉴스 10분 일일 루틴 + 경제지표 1개 추적 시작'],['🎯','투자 기회 포착 (실행력)',ai.gap_prescription_2||'골든타임 구간 타겟 3종 사전 리스트업 + 진입 기준 수치화'],['🛡','위기 대응력 (멘탈 내구력)',ai.gap_prescription_3||'손절 기준선 퍼센트 명문화 + 포지션별 최대 손실 설정']].map(function(p){
          return '<div style="display:flex;align-items:flex-start;gap:10px;background:rgba(255,255,255,.03);border-radius:8px;padding:10px 12px"><span style="font-size:16px">'+p[0]+'</span><div><div style="font-size:10px;color:#F0C674;font-weight:700;margin-bottom:2px">'+p[1]+'</div><div style="font-size:11px;color:#E2E8F0;line-height:1.6">'+p[2]+'</div></div></div>';
        }).join('')
      + '</div></div>';
  })()}
</div>

<!-- ══════════ S17 30일 골든 액션플랜 [PREMIUM] ══════════ -->
<div class="section" style="page-break-inside:avoid">
  <div class="section-num" id="sec17">SECTION 17 · PREMIUM EXCLUSIVE</div>
  <div class="section-title">30일 골든 액션플랜 — ${name}님 전용 실행 로드맵</div>
  <div class="section-divider"></div>
  <div style="background:rgba(255,255,255,.04);border-left:3px solid #2D8CFF;border-radius:0 8px 8px 0;padding:10px 14px;margin-bottom:14px;font-size:11px;color:#CBD5E1;line-height:1.6;">
    💡 <strong style="color:#F1F5F9;">이 섹션은?</strong> 오늘부터 30일간 매일 무엇을 해야 하는지 구체적인 실행 계획입니다. 하루 1개씩 체크하면 한 달 후 금융 행동력이 강화됩니다.
  </div>
  <!-- ★ v61: D1 오늘 당장 -->
  <div style="background:linear-gradient(135deg,rgba(240,198,116,0.15),rgba(45,140,255,0.08));border:1.5px solid #F0C674;border-radius:12px;padding:16px 20px;margin-bottom:18px">
    <div style="font-size:10px;font-weight:700;color:#F0C674;letter-spacing:1.5px;margin-bottom:6px">🎯 D1 오늘 당장 — 지금 이 리포트를 읽는 순간이 시작점</div>
    <div style="font-size:13px;font-weight:700;color:#E2E8F0;line-height:1.7;margin-bottom:6px">${nowActionMain}</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
      <div style="background:rgba(240,198,116,0.1);border:1px solid rgba(240,198,116,0.3);border-radius:6px;padding:4px 10px;font-size:10px;color:#F0C674">${archetype} 맞춤</div>
      <div style="background:rgba(45,140,255,0.1);border:1px solid rgba(45,140,255,0.3);border-radius:6px;padding:4px 10px;font-size:10px;color:#2D8CFF">${coreEl} 코어에너지</div>
      <div style="background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);border-radius:6px;padding:4px 10px;font-size:10px;color:#22C55E">5분 실행 가능</div>
    </div>
  </div>
  <div style="font-size:11px;color:#64748B;margin-bottom:18px;line-height:1.6">
    ${archetype} × ${ngrade} × ${coreEl} 3중 교차 — N-KAI가 금융 행동 패턴 분석으로 산출한 <strong style="color:#F0C674">30일 맞춤 실행 카드</strong>입니다.
  </div>
  ${(()=>{
    var agMap={ENTJ:'Navigator',ENTP:'Navigator',INTJ:'Navigator',INTP:'Navigator',ESTJ:'Analyst',ISTJ:'Analyst',ESTP:'Analyst',ISTP:'Analyst',ENFJ:'Visionary',INFJ:'Visionary',ENFP:'Visionary',INFP:'Visionary',ESFJ:'Pragmatist',ISFJ:'Pragmatist',ESFP:'Pragmatist',ISFP:'Pragmatist'};
    var ag = agMap[archetype] || 'Navigator';
    var wf = {
      Navigator:  ['전략 설계 & 타겟 선정','진입 포지션 구축','모멘텀 극대화','성과 점검 & 재설정'],
      Analyst:    ['데이터 수집 & 검증','백테스트 & 시뮬레이션','결정적 진입 실행','수익 실현 & 아카이브'],
      Visionary:  ['내면 점검 & 원칙 정비','균형 포트폴리오 구성','직관 기반 진입','성찰 & 다음 사이클'],
      Pragmatist: ['시스템 점검 & 최적화','자동화 루틴 설정','효율적 실행','성과 측정 & 개선']
    }[ag];
    var elKw = {'金':'결단·손절 원칙 강화','木':'성장주 확장 탐색','火':'모멘텀 빠른 실행','土':'배당·복리 구축','水':'유연성·리밸런싱'}[coreEl] || '결단·수렴';
    var nTierGoal = nscore>=720 ? '골든타임 선제 포지션 + KPI 1개 5점 상향' : nscore>=510 ? '손절 시스템 완성 + 금융 행동력 강화 달성' : '투자 원칙서 작성 + 소액 분산 시작';
    var colors=['#F0C674','#2D8CFF','#22C55E','#A78BFA'];
    var periods=['D1~D7','D8~D14','D15~D21','D22~D30'];
    var actions=[
      ['☑ '+archetype+' 전략 문서 1장 작성<br>☑ 골든타임 타겟 3종 선정<br>☑ 손절 기준선 수치 명문화<br>☑ '+elKw+' 중점 자산 리스트업<br>☑ 유동성 10% 별도 확보'],
      ['☑ 타겟 포지션 60% 1차 진입<br>☑ 주의구간 헤지 포지션 준비<br>☑ '+archetype+' 최적 파트너 전략 싱크<br>☑ 주간 KPI 점검 루틴 시작<br>☑ N-Score 트래킹 개시'],
      ['☑ 잔여 40% 확인 시그널 후 추가 진입<br>☑ '+elKw+' 에너지 극대화 구간 집중<br>☑ 모멘텀 종목 2개 추가 선별<br>☑ 익절 기준선 수치 설정<br>☑ 중간 N-Score 체크'],
      ['☑ 30일 성과 수치 정리<br>☑ 익절·손절 실행 결과 분석<br>☑ '+nTierGoal+'<br>☑ 다음 골든타임 준비 착수<br>☑ N-Score 재측정 신청 (추후 지원 예정)']
    ];
    return '<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px">'
      + wf.map(function(w,i){
          return '<div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-top:3px solid '+colors[i]+';border-radius:12px;padding:16px 12px">'
            + '<div style="font-size:9px;color:'+colors[i]+';font-weight:700;letter-spacing:1px;margin-bottom:6px">WEEK '+(i+1)+' · '+periods[i]+'</div>'
            + '<div style="font-size:12px;font-weight:800;color:#fff;margin-bottom:10px">'+w+'</div>'
            + '<div style="font-size:10px;color:#94A3B8;line-height:1.9">'+actions[i]+'</div>'
            + '</div>';
        }).join('')
      + '</div>'
      + '<div style="margin-top:14px;background:rgba(240,198,116,.06);border:1px solid rgba(240,198,116,.2);border-radius:10px;padding:14px 18px;font-size:12px;color:#E2E8F0;line-height:1.7">'
      + '⚡ <strong style="color:#F0C674">30일 목표:</strong> '+nTierGoal
      + '&nbsp;&nbsp;|&nbsp;&nbsp;🔑 <strong style="color:#F0C674">코어 에너지 키워드:</strong> '+elKw
      + '<br><span style="font-size:10px;color:#64748B">💡 KPI = N-KAI가 분석한 나만의 금융 행동 패턴 3가지 지표 (경제감각 · 실행력 · 멘탈 내구력)</span>'
      + '</div>';
  })()}
</div>


<div style="font-size:9px;color:#334155;margin-top:12px;padding:6px 10px;border-top:1px solid rgba(255,255,255,.05);line-height:1.6;">* N-Score 수치 갱신은 마이데이터 연동 후 지원됩니다.</div>

<!-- ══════════ S18 행동 예측 레이더 [PREMIUM · KILLING] ══════════ -->
<div class="section section-alt" style="page-break-inside:avoid">
  <div class="section-num" id="sec18">SECTION 18 · PREMIUM EXCLUSIVE</div>
  <div class="section-title">행동 예측 레이더 — 30일 내 당신의 다음 움직임</div>
  <div class="section-divider"></div>
  <div style="background:rgba(255,255,255,.04);border-left:3px solid #A78BFA;border-radius:0 8px 8px 0;padding:10px 14px;margin-bottom:14px;font-size:11px;color:#CBD5E1;line-height:1.6;">
    💡 <strong style="color:#F1F5F9;">이 섹션은?</strong> AI가 예측한 향후 30일 내 나의 금융 행동 패턴입니다. 미리 알고 준비하면 더 좋은 결과를 만들 수 있습니다.
  </div>
  <div style="font-size:12px;color:#94A3B8;margin-bottom:18px;line-height:1.7">
    N-KAI가 <strong style="color:#F0C674">${archetype} × ${ngrade} × ${coreEl}</strong> 금융 행동 패턴을 정밀 분석하여<br>향후 30일 내 발생 확률이 가장 높은 3가지 행동을 예측합니다.
  </div>
  ${(()=>{
    var bayesThresh=parseFloat(ai.threshold_prob||'0.65');
    var _b1map={ENTJ:'하향식 전략으로 골든타임 핵심 종목에 선제 진입.',INTJ:'연구 완료 종목 24시간 내 실행 결정.',ENTP:'신흥 시장 기회 1개 소규모 선진입.',INTP:'백테스트 완료 모델 기반 포지션 조정.',ENFJ:'소비 트렌드 선도 섹터 비중 확대.',INFJ:'장기 가치 종목 1개 추가 진입.',ENFP:'관심 종목 중 손절가 설정 후 진입 실행.',INFP:'원칙 기반 가치주 추가 매수.',ESTJ:'계획 대비 집행률 점검 후 미집행분 실행.',ISTJ:'원칙 문서 재확인 후 안전마진 확보 종목 진입.',ESTP:'단기 모멘텀 종목 타이밍 진입.',ISTP:'구조 분석 완료 종목 정밀 진입.',ESFJ:'배당주 정기 매수 실행.',ISFJ:'검증된 안정 종목 추가 매수.',ESFP:'기회 포착 후 즉시 소규모 진입.',ISFP:'저평가 발굴 종목 첫 포지션 시작.'};
    var _b2map={ENTJ:'과열 포지션 부분 익절 및 재조정.',INTJ:'포트폴리오 상관관계 점검 후 비효율 제거.',ENTP:'분산 과다 종목 정리 및 집중도 향상.',INTP:'모델 오차 구간 포지션 축소.',ENFJ:'타인 의견 의존 종목 독립 재검토.',INFJ:'단기 노이즈 제거 후 장기 보유 비중 확대.',ENFP:'충동 매수 종목 손익 점검 후 정리.',INFP:'감정적 회피 종목 수치 기반 재평가.',ESTJ:'월별 계획 달성률 점검 및 미달 원인 분석.',ISTJ:'손절 시스템 점검 및 기준선 재확인.',ESTP:'익절 기준 달성 종목 즉시 정리.',ISTP:'비효율 자산 구조 제거 및 집중도 강화.',ESFJ:'변동성 높은 종목 비중 축소.',ISFJ:'리스크 점검 후 현금 비중 재확인.',ESFP:'분산 충동 제어 및 핵심 종목 집중.',ISFP:'보유 종목 수익률 직접 확인 및 판단.'};
    var _b3map={ENTJ:'주의구간 전 포지션 30% 축소 및 재진입 조건 수치화.',INTJ:'하방 리스크 시나리오 사전 시뮬레이션.',ENTP:'최악 시나리오 수치 확인 후 리스크 한도 설정.',INTP:'리스크 모델 업데이트 및 임계치 재보정.',ENFJ:'독립 판단 기준 1가지 글로 명문화.',INFJ:'포지션 평가를 감정 아닌 수치 기준으로 전환.',ENFP:'손절 기준선 수치 명문화 및 자동화.',INFP:'손실 구간 감정 회피 방지 루틴 강화.',ESTJ:'비상 계획 수립 및 현금 비중 15% 확보.',ISTJ:'예외 없는 손절 원칙 재확인.',ESTP:'손절 지연 패턴 점검 및 즉시 실행 규칙 강화.',ISTP:'분산 위험 점검 및 헤지 포지션 추가.',ESFJ:'고위험 자산 노출 최소화 및 안전망 점검.',ISFJ:'비상 자금 10% 이상 유지 재확인.',ESFP:'충동 진입 제어 및 1종목 진입 한도 규칙.',ISFP:'손절 회피 패턴 점검 및 기준가 재설정.'};
    var _p1base={ENTJ:0.84,INTJ:0.82,ENTP:0.79,INTP:0.80,ENFJ:0.77,INFJ:0.78,ENFP:0.76,INFP:0.75,ESTJ:0.81,ISTJ:0.83,ESTP:0.85,ISTP:0.80,ESFJ:0.74,ISFJ:0.76,ESFP:0.82,ISFP:0.73};
    var _p1=parseFloat(ai.behavior_prob_1||'0')||(_p1base[archetype]||0.79);
    var _p2=parseFloat(ai.behavior_prob_2||'0')||(Math.round((_p1-0.14)*100)/100);
    var _p3=parseFloat(ai.behavior_prob_3||'0')||(Math.round((_p1-0.27)*100)/100);
    var preds=[
      {icon:'🎯',label:'행동 예측 1',text:ai.behavior_next_1||archetype+' — '+(_b1map[archetype]||'골든타임 전후 집중 리서치 패턴 발동. 타겟 자산 3~5종 사전 선정 가능성이 높습니다.'),prob:_p1},
      {icon:'⚡',label:'행동 예측 2',text:ai.behavior_next_2||(_b2map[archetype]||'현재 포트폴리오 리밸런싱 또는 포지션 규모 조정. '+coreEl+' 에너지 수렴 특성상 비효율 제거 행동 예측.'),prob:_p2},
      {icon:'🛡',label:'행동 예측 3',text:ai.behavior_next_3||(_b3map[archetype]||'주의구간('+cautionPeriod+') 전후 손절 기준 재설정 또는 현금 비중 확대. 리스크 관리 행동 발동 예측.'),prob:_p3}
    ];
    return '<div style="display:flex;flex-direction:column;gap:12px">'
      +preds.map(function(p,i){
        var probPct=Math.round(p.prob*100);
        var above=p.prob>=bayesThresh;
        var bc=above?(i===0?'#F0C674':i===1?'#22C55E':'#2D8CFF'):'#64748B';
        var bg=above?(i===0?'rgba(240,198,116,.08)':i===1?'rgba(34,197,94,.06)':'rgba(45,140,255,.06)'):'rgba(255,255,255,.03)';
        var bd=above?(i===0?'rgba(240,198,116,.3)':i===1?'rgba(34,197,94,.25)':'rgba(45,140,255,.25)'):'rgba(255,255,255,.07)';
        return '<div style="background:'+bg+';border:1px solid '+bd+';border-radius:12px;padding:16px 18px">'
          +'<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">'
          +'<span style="font-size:20px">'+p.icon+'</span>'
          +'<div style="flex:1"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">'
          +'<span style="font-size:11px;color:#94A3B8;font-weight:600">'+p.label+'</span>'
          +'<span style="font-size:14px;font-weight:900;color:'+bc+'">'+p.prob.toFixed(2)+'</span>'
          +'</div><div style="background:rgba(255,255,255,.07);border-radius:4px;height:6px;overflow:hidden">'
          +'<div style="width:'+probPct+'%;height:100%;background:'+bc+';border-radius:4px"></div></div></div>'
          +'<div style="background:'+(above?bc:'#475569')+';color:#071523;font-size:9px;font-weight:900;padding:3px 8px;border-radius:12px;white-space:nowrap">'
          +(above?'✓ 임계치 초과':'임계치 미달')+'</div>'
          +'</div>'
          +'<div style="font-size:12px;color:#E2E8F0;line-height:1.7">'+p.text+'</div>'
          +'</div>';
      }).join('')
      +'</div>'
      +'<div style="margin-top:14px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:12px 16px;font-size:11px;color:#475569;line-height:1.6">'
      +'★ 행동 예측 레이더는 N-KAI 예측 엔진의 행동 발생 확률을 기반으로 산출됩니다. 임계치('+bayesThresh+') 초과 예측은 높은 신뢰도를 의미하며, 투자 자문이 아닌 행동 패턴 분석입니다.'
      +'<div style="margin-top:10px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.06);border-radius:8px;padding:10px 14px">'
      +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><div style="width:6px;height:6px;background:#22C55E;border-radius:50%"></div><span style="font-size:10px;color:#475569;letter-spacing:1px;font-weight:600">N-KAI ENGINE DISCLOSURE</span></div>'
      +'<div style="font-size:10px;color:#334155;line-height:1.7">4대 특허 알고리즘 기반 설계 — 단계별 구현 현황:<br>① <strong style="color:#94A3B8">AI 확률 엔진</strong> — 새로운 데이터가 쌓일수록 예측 정확도가 자동으로 높아지는 학습 엔진. Phase 2에서 카드 결제 데이터 추가 갱신 예정<br>② <strong style="color:#94A3B8">ROC 임계치 보정</strong> — 0.65 기준 임계치 현재 적용 중<br>③ <strong style="color:#94A3B8">비지도학습 클러스터링</strong> — 데이터 패턴을 AI가 자동 분류하는 기술. 16 아키타입 분류 구조 적용. Phase 2에서 실시간 재학습 예정<br>④ <strong style="color:#94A3B8">Neural CDE</strong> — 시간 흐름에 따른 행동 변화를 예측하는 AI 엔진. 골든타임 예측 구조 적용. Phase 3에서 완전 가동 예정<br>특허 출원번호 4건 포함. 기술 검증 문의: cpo@neurinkairosai.com</div>'
      +'</div>';
  })()}
</div>

<!-- ══════════ S19 재무 위험 면역지도 [PREMIUM · SUPER KILLING] ══════════ -->
<div class="section" style="page-break-inside:avoid">
  <div class="section-num" id="sec19">SECTION 19 · PREMIUM EXCLUSIVE ★ SUPER KILLING</div>
  <div class="section-title">재무 위험 면역지도 — 4대 충격 생존 지수</div>
  <div class="section-divider"></div>
  <div style="background:rgba(255,255,255,.04);border-left:3px solid #EF4444;border-radius:0 8px 8px 0;padding:10px 14px;margin-bottom:14px;font-size:11px;color:#CBD5E1;line-height:1.6;">
    💡 <strong style="color:#F1F5F9;">이 섹션은?</strong> 금리 충격·시장 폭락·유동성 위기·인플레이션, 4가지 금융 위기 상황에서 내가 얼마나 버틸 수 있는지 분석합니다.
  </div>
  <div style="font-size:12px;color:#94A3B8;margin-bottom:18px;line-height:1.7">
    N-KAI가 <strong style="color:#F0C674">${archetype} × ${ngrade} × ${coreEl}</strong> 금융 행동 패턴을 분석하여<br>
    4대 금융 충격 시나리오에서 당신의 자산이 얼마나 버틸 수 있는지 <strong style="color:#E2E8F0">면역 점수</strong>로 산출합니다.
  </div>
  ${(()=>{
    var archImmuneMap={ENTJ:{ri:72,fx:68,bb:75,rc:70},INTJ:{ri:78,fx:72,bb:80,rc:75},ENTP:{ri:65,fx:70,bb:68,rc:62},INTP:{ri:74,fx:76,bb:72,rc:70},ENFJ:{ri:68,fx:64,bb:65,rc:72},INFJ:{ri:75,fx:70,bb:73,rc:78},ENFP:{ri:60,fx:65,bb:62,rc:58},INFP:{ri:70,fx:68,bb:66,rc:74},ESTJ:{ri:76,fx:72,bb:74,rc:78},ISTJ:{ri:80,fx:74,bb:78,rc:82},ESFJ:{ri:70,fx:66,bb:68,rc:74},ISFJ:{ri:78,fx:70,bb:76,rc:80},ESTP:{ri:62,fx:68,bb:64,rc:60},ISTP:{ri:72,fx:74,bb:70,rc:68},ESFP:{ri:58,fx:62,bb:60,rc:56},ISFP:{ri:68,fx:66,bb:64,rc:70}};
    var base=archImmuneMap[archetype]||{ri:70,fx:68,bb:70,rc:70};
    var elAdj={'金':{ri:8,fx:5,bb:8,rc:6},'土':{ri:6,fx:3,bb:6,rc:8},'水':{ri:4,fx:8,bb:4,rc:5},'木':{ri:2,fx:4,bb:3,rc:2},'火':{ri:-3,fx:2,bb:-2,rc:-2}}[coreEl]||{ri:0,fx:0,bb:0,rc:0};
    var ri=parseInt(ai.risk_immune_rate||'0')||Math.min(98,base.ri+elAdj.ri+Math.round((nscore-500)/50));
    var fx=parseInt(ai.fx_immune_rate||'0')||Math.min(98,base.fx+elAdj.fx+Math.round((nscore-500)/60));
    var bb=parseInt(ai.bubble_immune_rate||'0')||Math.min(98,base.bb+elAdj.bb+Math.round((nscore-500)/55));
    var rc=parseInt(ai.recession_immune_rate||'0')||Math.min(98,base.rc+elAdj.rc+Math.round((nscore-500)/45));
    var avg=Math.round((ri+fx+bb+rc)/4);
    var immuneLabel=avg>=80?'고면역 — 대부분의 충격을 흡수합니다':avg>=65?'중면역 — 충격 시 일부 포지션 조정 필요합니다':avg>=50?'보통 — 충격 대비 헤지 전략이 권장됩니다':'저면역 — 충격 전 선제 방어 포지션 필수입니다';
    var immuneColor=avg>=80?'#22C55E':avg>=65?'#F0C674':avg>=50?'#2D8CFF':'#EF4444';
    var shocks=[
      {label:'📈 금리 인상 충격',score:ri,key:'금리',desc:ri>=75?'금리 상승 시 채권 비중 자동 조정. 대출 레버리지 자제 패턴 강함.':ri>=60?'금리 충격 시 단기 채권·현금 비중 10% 추가 확보 권장.':'금리 상승 시 고위험 자산 즉시 축소 필요.'},
      {label:'💱 환율 급변 충격',score:fx,key:'환율',desc:fx>=75?'환율 변동성에 자연스러운 헤지 성향. 외화 자산 분산 효과 극대화.':fx>=60?'환율 급변 시 외화 노출 30% 이내 제한 권장.':'환율 충격에 취약. 해외 자산 비중 15% 이하 권장.'},
      {label:'🫧 버블 붕괴 충격',score:bb,key:'버블',desc:bb>=75?'과열 신호 감지 시 자동 차익실현 패턴. 버블 구간 진입 자제 성향.':bb>=60?'버블 경고 시 포지션 30% 사전 청산 권장.':'버블 충격에 취약. 현금 20% 확보 필수.'},
      {label:'📉 경기 침체 충격',score:rc,key:'침체',desc:rc>=75?'침체 국면에서 배당·채권 자동 전환 성향. 장기 보유 원칙 강함.':rc>=60?'경기 침체 시 방어주·배당주 비중 확대 권장.':'침체 시 손실 최대화 패턴 주의. 헤지 포지션 선제 설정 필수.'}
    ];
    return '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">'
      +shocks.map(function(s){
        var c=s.score>=80?'#22C55E':s.score>=65?'#F0C674':s.score>=50?'#2D8CFF':'#EF4444';
        var bg=s.score>=80?'rgba(34,197,94,.08)':s.score>=65?'rgba(240,198,116,.08)':s.score>=50?'rgba(45,140,255,.06)':'rgba(239,68,68,.08)';
        var bd=s.score>=80?'rgba(34,197,94,.3)':s.score>=65?'rgba(240,198,116,.3)':s.score>=50?'rgba(45,140,255,.25)':'rgba(239,68,68,.3)';
        return '<div style="background:'+bg+';border:1px solid '+bd+';border-radius:12px;padding:16px 14px">'
          +'<div style="font-size:12px;font-weight:700;color:#E2E8F0;margin-bottom:10px">'+s.label+'</div>'
          +'<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">'
          +'<div style="font-size:28px;font-weight:900;color:'+c+'">'+s.score+'</div>'
          +'<div style="flex:1"><div style="background:rgba(255,255,255,.07);border-radius:4px;height:8px;overflow:hidden">'
          +'<div style="width:'+s.score+'%;height:100%;background:'+c+';border-radius:4px"></div></div>'
          +'<div style="font-size:9px;color:'+c+';margin-top:3px;font-weight:700">'+s.key+' 면역 점수</div></div>'
          +'</div>'
          +'<div style="font-size:11px;color:#94A3B8;line-height:1.6">'+s.desc+'</div>'
          +'</div>';
      }).join('')
      +'</div>'
      +'<div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:14px 18px">'
      +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">'
      +'<div style="font-size:13px;font-weight:700;color:#fff">📊 종합 면역 지수</div>'
      +'<div style="font-size:22px;font-weight:900;color:'+immuneColor+'">'+avg+' <span style="font-size:12px;color:#94A3B8">/100</span></div>'
      +'</div>'
      +'<div style="background:rgba(255,255,255,.07);border-radius:6px;height:10px;overflow:hidden;margin-bottom:10px">'
      +'<div style="width:'+avg+'%;height:100%;background:linear-gradient(90deg,'+immuneColor+',rgba(255,255,255,.5));border-radius:6px"></div>'
      +'</div>'
      +'<div style="font-size:12px;color:'+immuneColor+';font-weight:600;margin-bottom:6px">'+immuneLabel+'</div>'
      +'<div style="font-size:12px;color:#94A3B8;line-height:1.7">'+(ai.immune_insight||archetype+' 아키타입은 '+coreEl+' 코어에너지 특성상 '+({'金':'결단력 있는 손절이 핵심 방어 수단입니다.','木':'성장 자산 비중 조절이 핵심 방어 수단입니다.','火':'감정적 추가 매수 차단이 핵심 방어 수단입니다.','土':'안정 자산 비중 유지가 핵심 방어 수단입니다.','水':'유동성 확보가 핵심 방어 수단입니다.'}[coreEl]||'원칙 기반 방어가 핵심입니다.')+' 면역 점수가 낮은 충격 유형은 골든타임 전 헤지 포지션으로 선제 방어하십시오.')+'</div>'
      +'</div>';
  })()}
</div>

<!-- ══════════ S20 금융 DNA 공유 카드 [STANDARD + PREMIUM] ══════════ -->
<div class="section section-alt" style="page-break-inside:avoid">
  <div class="section-num" id="sec20">SECTION 20 · KAIROS SHARE CARD</div>
  <div class="section-title">금융 DNA 공유 카드 — 나의 투자 정체성</div>
  <div class="section-divider"></div>
  <div style="background:rgba(255,255,255,.04);border-left:3px solid #F0C674;border-radius:0 8px 8px 0;padding:10px 14px;margin-bottom:14px;font-size:11px;color:#CBD5E1;line-height:1.6;">
    💡 <strong style="color:#F1F5F9;">이 섹션은?</strong> 나의 금융 DNA 분석 결과를 한 장 카드로 요약했습니다. SNS에 공유하거나 소중한 분께 전달해 같이 분석 받아보세요.
  </div>
  <div style="display:grid;grid-template-columns:1fr auto;gap:16px;align-items:start;margin-bottom:18px"><div><div style="font-size:12px;color:#94A3B8;line-height:1.7;margin-bottom:8px">이 카드를 <strong style="color:#E2E8F0">캡처하여 SNS(인스타/카카오)에 공유</strong>하거나,<br><strong style="color:#F0C674">PDF 뷰어에서 하단 링크를 클릭</strong>하면 N-KAI 홈페이지로 연결됩니다.</div><div style="font-size:11px;color:#64748B;line-height:1.8">📧 수신 이메일에도 공유 링크 포함 | 🔗 카드 하단 '나도 분석하기' 클릭</div></div><div style="text-align:center;flex-shrink:0"><div style="width:80px;background:rgba(240,198,116,.08);border:2px solid rgba(240,198,116,.3);border-radius:8px;padding:10px 6px;text-align:center">
      <svg viewBox="0 0 24 24" width="32" height="32" style="display:block;margin:0 auto 4px">
        <rect x="2" y="2" width="8" height="8" fill="none" stroke="#F0C674" stroke-width="2"/>
        <rect x="4" y="4" width="4" height="4" fill="#F0C674"/>
        <rect x="14" y="2" width="8" height="8" fill="none" stroke="#F0C674" stroke-width="2"/>
        <rect x="16" y="4" width="4" height="4" fill="#F0C674"/>
        <rect x="2" y="14" width="8" height="8" fill="none" stroke="#F0C674" stroke-width="2"/>
        <rect x="4" y="16" width="4" height="4" fill="#F0C674"/>
        <rect x="14" y="14" width="3" height="3" fill="#F0C674"/>
        <rect x="19" y="14" width="3" height="3" fill="#F0C674"/>
        <rect x="14" y="19" width="3" height="3" fill="#F0C674"/>
        <rect x="19" y="19" width="3" height="3" fill="#F0C674"/>
      </svg>
      <div style="font-size:8px;color:#F0C674;font-weight:700;margin-top:2px">QR</div>
      <div style="font-size:7px;color:#64748B;margin-top:2px;line-height:1.3">PDF 뷰어에서<br>URL 클릭</div>
    </div></div></div>
  ${(()=>{
    var elColor={'金':'#F0C674','木':'#22C55E','火':'#EF4444','土':'#F59E0B','水':'#2D8CFF'}[coreEl]||'#F0C674';
    var shareTag=ss(ai.share_tagline)||ss(ai.oneline)||atTag;
    var tierLabel=tier==='premium'?'★ PREMIUM':'STANDARD';
    var tierBg=tier==='premium'?'linear-gradient(135deg,#F0C674,#d4a853)':'linear-gradient(135deg,#2D8CFF,#1a6bc9)';
    return '<div style="max-width:500px;margin:0 auto;background:linear-gradient(145deg,#040D16 0%,#071523 50%,#0A1B2E 100%);border:2px solid '+elColor+';border-radius:22px;padding:28px 26px 20px;position:relative;overflow:hidden;box-shadow:0 0 40px '+elColor+'33">'
      +'<div style="position:absolute;top:-50px;right:-50px;width:180px;height:180px;background:radial-gradient(circle,'+elColor+'1A 0%,transparent 70%);border-radius:50%"></div>'
      +'<div style="position:relative;z-index:2">'
      +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">'
      +'<div style="font-size:16px;font-weight:900;color:#F0C674;letter-spacing:2px;text-shadow:0 0 12px rgba(240,198,116,.4)">N·KAI</div>'
      +'<div style="background:'+tierBg+';color:#071523;font-size:9px;font-weight:900;padding:3px 10px;border-radius:12px;letter-spacing:1px">'+tierLabel+'</div>'
      +'</div>'
      +'<div style="text-align:center;margin-bottom:14px">'
      +'<div style="font-size:56px;font-weight:900;color:'+elColor+';letter-spacing:6px;line-height:1;text-shadow:0 0 30px '+elColor+'66">'+archetype+'</div>'
      +'<div style="font-size:15px;font-weight:700;color:#fff;margin-top:6px">'+atName+'</div>'
      +'<div style="font-size:11px;color:#94A3B8;margin-top:3px">'+atSub+'</div>'
      +'</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:12px">'
      +'<div style="background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:10px 6px;text-align:center"><div style="font-size:8px;color:#94A3B8;margin-bottom:2px;letter-spacing:1px">N-SCORE</div><div style="font-size:16px;font-weight:900;color:#F0C674">'+nscore+'</div></div>'
      +'<div style="background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:10px 6px;text-align:center"><div style="font-size:8px;color:#94A3B8;margin-bottom:2px;letter-spacing:1px">코어 에너지</div><div style="font-size:16px;font-weight:900;color:'+elColor+'">'+coreEl+'</div></div>'
      +'<div style="background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:10px 6px;text-align:center"><div style="font-size:8px;color:#94A3B8;margin-bottom:2px;letter-spacing:1px">골든타임</div><div style="font-size:12px;font-weight:900;color:#22C55E">'+ss(data.goldentime1||'—')+'</div></div>'
      +'</div>'
      +'<div style="background:rgba(255,255,255,.05);border:1px solid '+elColor+'44;border-radius:12px;padding:12px 16px;text-align:center;margin-bottom:14px">'
      +'<div style="font-size:13px;font-weight:700;color:#E2E8F0;line-height:1.5">&ldquo;'+shareTag+'&rdquo;</div>'
      +'</div>'
      +'<div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid rgba(255,255,255,.07);padding-top:10px">'
      +'<a href="https://www.neurinkairosai.com/?from=share_card&ref='+encodeURIComponent(archetype)+'_'+nscore+'" target="_blank" style="font-size:10px;color:#2D8CFF;text-decoration:underline;font-weight:700">→ 나도 분석하기</a>'
      +'<a href="https://open.kakao.com/o/g1V5zAii" target="_blank" style="font-size:10px;background:#FEE500;color:#191919;font-weight:800;padding:4px 10px;border-radius:8px;text-decoration:none;">💬 오픈채팅 참여</a>'
      +'<div style="font-size:10px;color:#64748B">임계치 '+(ai.threshold_prob||parseFloat((0.50+(nscore/1000)*0.38).toFixed(2)))+'</div>'
      +'</div>'
      +'</div>'
      +'</div>';
  })()}
</div>



` : ''}
<!-- ══════════ STANDARD 업셀 CTA ══════════ -->
${tier !== 'premium' ? `
<div style="background:linear-gradient(135deg,#071523,#0D1B2A);padding:28px 48px;border-top:2px solid rgba(240,198,116,.3);page-break-before:always">
  <div style="background:rgba(240,198,116,.08);border:1px solid rgba(240,198,116,.25);border-radius:16px;padding:22px 26px;display:flex;align-items:center;justify-content:space-between;gap:20px">
    <div>
      <div style="font-size:10px;letter-spacing:3px;color:#F0C674;font-weight:700;margin-bottom:8px">✦ PREMIUM UPGRADE AVAILABLE</div>
      <div style="font-size:15px;font-weight:900;color:#fff;margin-bottom:8px">${name}님의 리포트에는 10개 섹션이 더 있습니다</div>
      <div style="font-size:11px;color:#94A3B8;line-height:1.9">
        S11 행동예측 시나리오 · S12 3개월 체크리스트 · S13 카이로스 선언문<br>
        <strong style="color:#F0C674">S14 이번 달 임계치 점수</strong> · S15 연간 히트맵 · S16 갭 분석 + 성장처방<br>
        S17 30일 액션플랜 · S18 행동 예측 레이더<br><strong style="color:#F0C674">S19 재무 위험 면역지도 · S20 금융 DNA 공유 카드 ★ NEW</strong>
      </div>
    </div>
    <div style="text-align:center;flex-shrink:0">
      <div style="font-size:11px;color:#94A3B8;margin-bottom:4px">추가 비용</div>
      <div style="font-size:28px;font-weight:900;color:#F0C674">₩10,000</div>
      <div style="font-size:10px;color:#64748B;margin-bottom:12px">(₩19,900 - ₩9,900)</div>
      <a href="https://www.neurinkairosai.com/?upgrade=premium&arch=${encodeURIComponent(archetype)}&ns=${nscore}&el=${encodeURIComponent(coreEl)}&gt=${encodeURIComponent(gtMonths[0])}&from=pdf_std&utm_source=pdf&utm_medium=upsell&utm_campaign=standard_to_premium" target="_blank" style="display:block;background:linear-gradient(135deg,#F0C674,#d4a853);color:#071523;font-size:11px;font-weight:900;padding:10px 20px;border-radius:20px;letter-spacing:1px;text-decoration:none;text-align:center">
        프리미엄 업그레이드 →
      </a>
    </div>
  </div>
</div>
` : ''}
<!-- ══════════ ② N-Score 공유 카드 [STANDARD] ══════════ -->
${tier !== 'premium' ? `
<div style="background:#040D16;padding:20px 48px;page-break-inside:avoid">
  <div style="background:linear-gradient(135deg,rgba(240,198,116,.08),rgba(45,140,255,.06));border:1px solid rgba(240,198,116,.2);border-radius:16px;padding:20px 24px">
    <div style="font-size:10px;letter-spacing:2px;color:#F0C674;font-weight:700;margin-bottom:12px">📲 내 금융 DNA 공유하기</div>
    <div style="display:grid;grid-template-columns:auto 1fr auto;gap:16px;align-items:center">
      <!-- 공유 카드 미니 -->
      <div style="background:linear-gradient(145deg,#071523,#0A1B2E);border:2px solid ${elColor};border-radius:14px;padding:16px 14px;text-align:center;width:120px">
        <div style="font-size:28px;font-weight:900;color:${elColor};letter-spacing:3px">${archetype}</div>
        <div style="font-size:10px;color:#E2E8F0;margin-top:4px;font-weight:600">${atName}</div>
        <div style="font-size:10px;color:#94A3B8;margin-top:2px">N-Score ${nscore}</div>
        <div style="font-size:9px;color:${elColor};margin-top:4px">${elName} 코어</div>
      </div>
      <div>
        <div style="font-size:13px;font-weight:700;color:#fff;margin-bottom:6px">"나는 ${archetype} — ${atName}"</div>
        <div style="font-size:11px;color:#94A3B8;line-height:1.7">이 카드를 SNS에 공유하면 친구들이 같은 분석을 받아볼 수 있습니다.<br>공유 1건당 내 N-Score +2점 적립 예정 (Phase 2 업데이트)</div>
        <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
          <a href="https://www.neurinkairosai.com/?from=share_std&arch=${encodeURIComponent(archetype)}&ns=${nscore}&utm_source=pdf&utm_medium=share&utm_campaign=std_share" target="_blank"
             style="display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:20px;padding:6px 14px;font-size:10px;font-weight:700;color:#E2E8F0;text-decoration:none">
            🔗 링크 공유
          </a>
          <a href="${kakaoShareUrl}" target="_blank"
             style="display:inline-flex;align-items:center;gap:5px;background:rgba(254,229,0,.15);border:1px solid rgba(254,229,0,.3);border-radius:20px;padding:6px 14px;font-size:10px;font-weight:700;color:#FEE500;text-decoration:none">
            💬 카카오 오픈채팅 참여
          </a>
        </div>
      </div>
      <div style="text-align:center">
        <div style="font-size:9px;color:#64748B;margin-bottom:6px">친구에게 선물</div>
        <a href="https://www.neurinkairosai.com/?gift=1&from=pdf_std&utm_source=pdf&utm_medium=gift&utm_campaign=std_gift" target="_blank"
           style="display:block;background:linear-gradient(135deg,#F0C674,#d4a853);color:#071523;font-size:10px;font-weight:900;padding:8px 14px;border-radius:16px;text-decoration:none;text-align:center;white-space:nowrap">
          🎁 선물하기<br>₩9,900
        </a>
      </div>
    </div>
  </div>
</div>
` : ''}

<!-- ══════════ ④⑤ 구독 + 알림 CTA [STANDARD + PREMIUM 공통] ══════════ -->
<div style="background:#040D16;padding:16px 48px;page-break-inside:avoid">
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
    <!-- ④ 골든타임 이메일 알림 — 즉시 신청 가능 -->
    <a href="https://www.neurinkairosai.com/?subscribe=golden&arch=${encodeURIComponent(archetype)}&gt=${encodeURIComponent(gtMonths[0])}&email=${encodeURIComponent(safeStr(data.email)||'')}&utm_source=pdf&utm_medium=subscribe&utm_campaign=golden_alert" target="_blank"
       style="display:flex;align-items:center;gap:12px;background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.25);border-radius:12px;padding:12px 14px;text-decoration:none;cursor:pointer;">
      <span style="font-size:24px;flex-shrink:0">📧</span>
      <div>
        <div style="font-size:11px;font-weight:700;color:#22C55E;margin-bottom:3px">🔔 골든타임 이메일 알림 신청</div>
        <div style="font-size:10px;color:#64748B;line-height:1.5">${gtMonths[0]} 골든타임 도달 전 이메일 알림<br>무료 · 클릭 한 번으로 신청 완료</div>
      </div>
    </a>
    <!-- ⑤ 월간 N-Score — Phase 2 준비 중 -->
    <div style="display:flex;align-items:center;gap:12px;background:rgba(30,41,59,.5);border:1px solid rgba(71,85,105,.3);border-radius:12px;padding:12px 14px;opacity:0.55;">
      <span style="font-size:24px;flex-shrink:0">📊</span>
      <div>
        <div style="font-size:11px;font-weight:700;color:#64748B;margin-bottom:3px">월간 N-Score 업데이트<span style="font-size:9px;background:rgba(201,168,76,.15);color:#C9A84C;border:1px solid rgba(201,168,76,.3);border-radius:4px;padding:1px 5px;font-weight:700;margin-left:4px;">Phase 2</span></div>
        <div style="font-size:10px;color:#475569;line-height:1.5">마이데이터 연동 후 활성화 예정</div>
      </div>
    </div>
  </div>
</div>

<!-- ══════════ FOOTER ══════════ -->
<div class="report-footer">
  <div class="footer-inner">
    <div class="footer-left">
      <strong style="color:#F0C674">N·KAI — YOUR FINANCIAL DNA</strong><br>
      뉴린카이로스에이아이(주) · 172-87-03400<br>
      통신판매업: 제 2026-서울강남-01337 호
    </div>
    <div class="footer-right">
      ${name}님 전용 리포트<br>
      분석일: ${today}
    </div>
  </div>
  <div class="footer-disclaimer">
    본 리포트는 금융 성향 분석 참고자료이며 투자 자문이 아닙니다.<br>
    모든 투자 결정은 이용자 본인의 판단과 책임 하에 이루어집니다.
  </div>
</div>

</body>
</html>`;
}

// ════════════════════════════════════════════════════════════════
//  END OF buildPdfReportHtml v41
// ────────────────────────────────────────────────────────────────────────────
// PART 8 — 자동 알림 시스템 v67 (골든타임 월간 자동 이메일)
// ────────────────────────────────────────────────────────────────────────────

// ★ 구독자 저장 — 홈페이지에서 구독 신청 시 호출
function saveGoldenSubscriber(data) {
  try {
    var ss = getLogSpreadsheet();
    if (!ss) return;
    var sheet = ss.getSheetByName('골든타임구독') || ss.insertSheet('골든타임구독');
    // 헤더 설정
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['등록일시','이메일','이름','아키타입','N-Score','코어에너지',
                       'BEST1월','BEST2월','BEST3월','주의월','구독타입','상태']);
      sheet.getRange(1,1,1,12).setFontWeight('bold').setBackground('#0D1B2A').setFontColor('#F0C674');
    }
    // 중복 체크
    var email = safeStr(data.email);
    if (!email) return;
    var existing = sheet.getDataRange().getValues();
    for (var i = 1; i < existing.length; i++) {
      if (existing[i][1] === email) {
        // 기존 데이터 업데이트
        sheet.getRange(i+1, 1, 1, 12).setValues([[
          new Date(), email, safeStr(data.name||''), safeStr(data.archetype||''),
          safeStr(data.nscore||''), safeStr(data.coreElement||''),
          safeStr(data.goldentime1||''), safeStr(data.goldentime2||''), safeStr(data.goldentime3||''),
          safeStr(data.goldentime_warn||''), safeStr(data.subscribe_type||'golden'), '활성'
        ]]);
        Logger.log('[구독] 업데이트: ' + email);
        return;
      }
    }
    sheet.appendRow([
      new Date(), email, safeStr(data.name||''), safeStr(data.archetype||''),
      safeStr(data.nscore||''), safeStr(data.coreElement||''),
      safeStr(data.goldentime1||''), safeStr(data.goldentime2||''), safeStr(data.goldentime3||''),
      safeStr(data.goldentime_warn||''), safeStr(data.subscribe_type||'golden'), '활성'
    ]);
    Logger.log('[구독] 신규 등록: ' + email);
  } catch(e) { Logger.log('[구독저장] 오류: ' + e.toString()); }
}

// ★ 월간 자동 알림 — 매월 1일 자동 실행 (트리거 설정 필요)
function sendMonthlyGoldenAlert() {
  try {
    var nowMonth = new Date().getMonth() + 1;
    var monthName = nowMonth + '월';
    Logger.log('[월간알림] 시작 — ' + monthName);

    var ss = getLogSpreadsheet();
    if (!ss) { Logger.log('[월간알림] 스프레드시트 없음'); return; }
    var sheet = ss.getSheetByName('골든타임구독');
    if (!sheet || sheet.getLastRow() < 2) { Logger.log('[월간알림] 구독자 없음'); return; }

    var rows = sheet.getDataRange().getValues();
    var sent = 0, skip = 0;

    for (var i = 1; i < rows.length; i++) {
      var row = rows[i];
      var email    = safeStr(row[1]);
      var name     = safeStr(row[2]) || '고객';
      var arch     = safeStr(row[3]) || 'ENTJ';
      var nscore   = safeStr(row[4]) || '700';
      var coreEl   = safeStr(row[5]) || '金';
      var gt1      = safeStr(row[6]);
      var gt2      = safeStr(row[7]);
      var gt3      = safeStr(row[8]);
      var warnM    = safeStr(row[9]);
      var subType  = safeStr(row[10]);
      var status   = safeStr(row[11]);

      if (!email || status !== '활성') { skip++; continue; }

      // ★ 골든타임 구독: 해당 월이 골든타임이면 발송
      var isGolden  = (gt1.indexOf(nowMonth+'월') >= 0 || gt2.indexOf(nowMonth+'월') >= 0 || gt3.indexOf(nowMonth+'월') >= 0);
      var isCaution = warnM.indexOf(nowMonth+'월') >= 0;
      var isPrep    = false;
      // BEST1 한 달 전 준비 알림
      var gt1Num = (function(s){ var m=s.match(/(\d{1,2})월/); return m?parseInt(m[1]):0; })(gt1);
      if (gt1Num > 0) {
        var prepMonth = gt1Num === 1 ? 12 : gt1Num - 1;
        isPrep = (nowMonth === prepMonth);
      }

      var shouldSend = false;
      var alertType = '';
      if (isGolden)       { shouldSend = true; alertType = 'golden'; }
      else if (isCaution) { shouldSend = true; alertType = 'caution'; }
      else if (isPrep)    { shouldSend = true; alertType = 'prep'; }
      // 월간 업데이트 구독자는 매월 발송
      else if (subType === 'monthly') { shouldSend = true; alertType = 'monthly'; }

      if (!shouldSend) { skip++; continue; }

      // 알림 이메일 발송
      _sendAlertEmail(email, name, arch, nscore, coreEl, gt1, alertType, nowMonth);
      sent++;
      Utilities.sleep(500); // 발송 간격
    }

    Logger.log('[월간알림] 완료 — 발송:' + sent + ' 스킵:' + skip);
  } catch(e) { Logger.log('[월간알림] 오류: ' + e.toString()); }
}

// ★ 알림 이메일 빌드 + 발송
function _sendAlertEmail(email, name, arch, nscore, coreEl, gt1, alertType, nowMonth) {
  try {
    var elColor = {'金':'#F0C674','木':'#22C55E','火':'#EF4444','土':'#F59E0B','水':'#2D8CFF'}[coreEl] || '#F0C674';

    var alertConfig = {
      golden:  { emoji:'🔥', badge:'GOLDEN TIME', badgeColor:'#F0C674', badgeBg:'rgba(240,198,116,.15)',
                 title: nowMonth + '월 — 골든타임 도달!',
                 desc:  name + '님의 N-KAI 예측 엔진이 ' + nowMonth + '월을 최적 행동 구간으로 감지했습니다.',
                 action:'지금 핵심 포지션 진입을 검토하십시오. 행동 임계치가 최고조입니다.',
                 cta:   '골든타임 전략 확인하기' },
      prep:    { emoji:'🚀', badge:'PREP TIME', badgeColor:'#2D8CFF', badgeBg:'rgba(45,140,255,.12)',
                 title: '골든타임 ' + gt1 + ' 준비 시작!',
                 desc:  name + '님의 BEST 골든타임 ' + gt1 + '이 한 달 앞으로 다가왔습니다.',
                 action:'지금부터 타겟 종목 리스트업 + 진입 자금 준비를 시작하십시오.',
                 cta:   '준비 체크리스트 확인하기' },
      caution: { emoji:'⚠️', badge:'CAUTION', badgeColor:'#EF4444', badgeBg:'rgba(239,68,68,.1)',
                 title: nowMonth + '월 — 주의 구간',
                 desc:  name + '님의 에너지 사이클 분석 결과 ' + nowMonth + '월은 신중한 행동이 필요한 구간입니다.',
                 action:'신규 대규모 진입을 자제하고 현금 비중 20% 이상을 유지하십시오.',
                 cta:   '방어 전략 확인하기' },
      monthly: { emoji:'📊', badge:'MONTHLY UPDATE', badgeColor:'#A78BFA', badgeBg:'rgba(167,139,250,.1)',
                 title: nowMonth + '월 N-Score 업데이트',
                 desc:  name + '님의 이번 달 금융 행동 패턴 분석 업데이트입니다.',
                 action:'골든타임 캘린더와 N-Score 변화를 확인하고 이번 달 전략을 점검하십시오.',
                 cta:   '이번 달 분석 확인하기' }
    };

    var cfg = alertConfig[alertType] || alertConfig['monthly'];

    var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head>'
      + '<body style="margin:0;padding:0;background:#0A0E1A;font-family:\'Apple SD Gothic Neo\',\'Malgun Gothic\',sans-serif;">'
      + '<div style="max-width:520px;margin:0 auto;padding:28px 20px;">'
      // 로고
      + '<div style="text-align:center;margin-bottom:20px;">'
      + '<div style="font-size:20px;font-weight:900;background:linear-gradient(135deg,#c9a84c,#e8d48b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:4px;">N&#xB7;KAI</div>'
      + '</div>'
      // 알림 배지
      + '<div style="text-align:center;margin-bottom:16px;">'
      + '<span style="display:inline-block;background:'+cfg.badgeBg+';border:1px solid '+cfg.badgeColor+'33;color:'+cfg.badgeColor+';font-size:10px;font-weight:900;letter-spacing:2px;padding:5px 14px;border-radius:20px;">'
      + cfg.badge + '</span></div>'
      // 메인 카드
      + '<div style="background:linear-gradient(135deg,#0F1524,#0D1420);border:1px solid '+cfg.badgeColor+'44;border-radius:16px;padding:24px;margin-bottom:14px;text-align:center;">'
      + '<div style="font-size:32px;font-weight:900;color:'+elColor+';letter-spacing:4px;margin-bottom:6px;">'+arch+'</div>'
      + '<div style="font-size:15px;font-weight:700;color:#fff;margin-bottom:4px;">'+cfg.title+'</div>'
      + '<div style="font-size:11px;color:#64748B;margin-top:8px;">N-Score '+nscore+' · '+coreEl+' 코어에너지</div>'
      + '</div>'
      // 내용
      + '<div style="background:#0F1524;border:1px solid rgba(255,255,255,.08);border-left:3px solid '+cfg.badgeColor+';border-radius:0 12px 12px 0;padding:16px;margin-bottom:14px;">'
      + '<div style="font-size:12px;color:#C8D0E0;line-height:1.7;margin-bottom:8px;">'+cfg.desc+'</div>'
      + '<div style="font-size:12px;font-weight:700;color:'+cfg.badgeColor+';line-height:1.6;">'+cfg.action+'</div>'
      + '</div>'
      // CTA
      + '<div style="text-align:center;margin-bottom:16px;">'
      + '<a href="https://www.neurinkairosai.com/?from=alert&type='+alertType+'&arch='+encodeURIComponent(arch)+'&utm_source=email&utm_medium=alert&utm_campaign='+alertType+'_'+nowMonth+'" '
      + 'style="display:inline-block;background:linear-gradient(135deg,#c9a84c,#e8d48b);color:#0A0E1A;font-size:13px;font-weight:900;padding:14px 32px;border-radius:20px;text-decoration:none;">'
      + cfg.cta + ' →</a>'
      + '</div>'
      // 수신거부
      + '<p style="text-align:center;color:#3D4B66;font-size:10px;line-height:1.8;">'
      + '무수신 문의: <a href="mailto:support@neurinkairosai.com" style="color:#c9a84c;">support@neurinkairosai.com</a><br>'
      + '뉴린카이로스에이아이 주식회사</p>'
      + '</div></body></html>';

    var subjects = {
      golden:  '[N-KAI] ' + name + '님, 지금이 골든타임입니다 — ' + nowMonth + '월',
      prep:    '[N-KAI] ' + name + '님, 골든타임 ' + gt1 + ' 준비 시작!',
      caution: '[N-KAI] ' + name + '님, ' + nowMonth + '월 주의 구간 안내',
      monthly: '[N-KAI] ' + name + '님의 ' + nowMonth + '월 N-Score 업데이트'
    };

    GmailApp.sendEmail(email, subjects[alertType] || subjects['monthly'],
      '이메일 클라이언트가 HTML을 지원하지 않습니다.',
      { htmlBody: html, name: 'N-KAI 팀', replyTo: 'support@neurinkairosai.com', charset: 'UTF-8' }
    );
    Logger.log('[알림발송] ✅ ' + email + ' / ' + alertType);
  } catch(e) { Logger.log('[알림발송] ❌ ' + e.toString()); }
}

// ★ 트리거 자동 설정 함수 (1회 실행으로 월간 자동화 완성)
function setupMonthlyTrigger() {
  // 기존 트리거 중복 방지
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'sendMonthlyGoldenAlert') {
      ScriptApp.deleteTrigger(triggers[i]);
      Logger.log('[트리거] 기존 월간 트리거 삭제');
    }
  }
  // 매월 1일 오전 9시 자동 실행
  ScriptApp.newTrigger('sendMonthlyGoldenAlert')
    .timeBased()
    .onMonthDay(1)
    .atHour(9)
    .create();
  Logger.log('[트리거] ✅ 월간 골든타임 알림 트리거 설정 완료 — 매월 1일 오전 9시 자동 실행');
}

// ★ 테스트 발송
function testGoldenAlert() {
  _sendAlertEmail(
    'sogood2172@gmail.com',
    '이원재', 'ENTJ', '742', '金',
    '2026년 7월', 'golden', 7
  );
  Logger.log('[테스트] 골든타임 알림 발송 완료');
}

function testPrepAlert() {
  _sendAlertEmail(
    'sogood2172@gmail.com',
    '이원재', 'ENTJ', '742', '金',
    '2026년 7월', 'prep', 6
  );
  Logger.log('[테스트] 준비 알림 발송 완료');
}

function testMonthlyAlert() {
  _sendAlertEmail(
    'sogood2172@gmail.com',
    '이원재', 'ENTJ', '742', '金',
    '2026년 7월', 'monthly', 3
  );
  Logger.log('[테스트] 월간 업데이트 알림 발송 완료');
}

// ────────────────────────────────────────────────────────────────────────────
// END PART 8
// ────────────────────────────────────────────────────────────────────────────

//  ★ 복원된 6개 섹션 마커:
//  S02: info-box (N-Score란?)
//  S03: kpi-desc + kpi-footnote + kpi-rank (아키타입 내 상위%)
//  S05: info-box (골든타임이란?) + gt-strategy-box + gt-caution (🚫🛡📋)
//  S08: roadmap-season (생월 계절 에너지)
//  S09: react-label (에너지 패턴 행동 해석)
//  S10: chem-explain (금융 케미스트리란?)
// ════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════
// PART 9 — IR 발송 시스템 v1.0 (3종 : 정부기관 / 투자자 / 제휴사)
// ────────────────────────────────────────────────────────────────
// 사용법:
//   sendIR_Gov({to:'1457@kibo.or.kr', name:'최진호 부지점장님', contact:'오늘 전화 통화'})
//   sendIR_Investor({to:'hong@vc.com', name:'홍길동 대표님', contact:'소개'})
//   sendIR_Partner({to:'kim@lottecard.com', name:'김덕원 실장님', contact:'통화'})
// ────────────────────────────────────────────────────────────────

function _buildIrHtml(type, name, contact) {
  var senderName = '이원재';
  var senderTitle = '뉴린카이로스에이아이 주식회사 대표이사';
  var phone = '010-3816-6178';
  var email = 'wonjae.lee@neurinkairosai.com';
  var web = 'https://www.neurinkairosai.com';
  var biz = '172-87-03400';

  // ── 타입별 콘텐츠 ──
  var badge, headline, sections, closing;

  if (type === 'gov') {
    badge = '&#x1F3DB; 정부기관 · 공공기관';
    headline = 'IR 자료 및 특허출원서 송부';
    sections = [
      { icon: '&#x1F4A1;', title: 'N-KAI 한 줄 정의',
        body: '&ldquo;카드 거래 데이터로 사람의 다음 행동을 예측하는 엔진&rdquo;' },
      { icon: '&#x1F4CB;', title: '기업 현황',
        body: '법인 설립: 2025.09.11 &nbsp;|&nbsp; 사업자등록: 172-87-03400<br>'
            + '특허 출원 4건 (2025.10, 핵심 1건 + 응용 3건) &nbsp;|&nbsp; Living Profile&reg; 상표 3건<br>'
            + '통신판매업 신고: 제2026-서울강남-01337호<br>'
            + '공식 PoC 90일 완료 (2025.12.08~2026.03.07) &nbsp;|&nbsp; 실매출 발생 중 (2026.03~)' },
      { icon: '&#x1F4CE;', title: '첨부 파일',
        body: '① N-KAI IR Deck (nkai-ir-deck-v22.pptx)<br>② 특허출원서 4건' }
    ];
    closing = '추가 자료 필요하신 경우 언제든 연락 주십시오.';

  } else if (type === 'investor') {
    badge = '&#x1F4B0; 투자자 · VC · 엔젤';
    headline = 'N-KAI IR 자료 송부 — 투자 검토 요청';
    sections = [
      { icon: '&#x1F4A1;', title: 'N-KAI 한 줄 정의',
        body: '&ldquo;카드 거래 데이터로 사람의 다음 행동을 예측하는 엔진&rdquo;' },
      { icon: '&#x26A1;', title: '핵심 투자 포인트',
        body: '&#x2460; 특허 4건 출원 — 핵심 특허 1건 (AI 행동 예측·정밀 분류·패턴 학습 3대 알고리즘 탑재) + 응용특허 3건 (웰니스·소셜매칭·AI다차원함수)<br>'
            + '&#x2461; Living Profile&reg; 상표 3건 보유<br>'
            + '&#x2462; 공식 PoC 90일 완료 &rarr; 실매출 발생 (2026.03~)<br>'
            + '&#x2463; B2C &times; B2B &times; B2G 3-트랙 수익 구조<br>'
            + '&#x2464; 롯데카드 20년 현업 경력 기반 (FDS·여신심사·마케팅·신사업기획)' },
      { icon: '&#x1F4CE;', title: '첨부 파일',
        body: '① N-KAI IR Deck (nkai-ir-deck-v22.pptx)<br>② 특허출원서 4건' }
    ];
    closing = '검토 후 편하신 시간에 30분 미팅 요청드려도 될까요?';

  } else { // partner
    badge = '&#x1F91D; 제휴사 · 카드사 · 핀테크';
    headline = 'N-KAI &times; 제휴 제안 — 고객 행동 예측 엔진';
    sections = [
      { icon: '&#x1F4A1;', title: 'N-KAI 한 줄 정의',
        body: '&ldquo;카드 거래 데이터로 사람의 다음 행동을 예측하는 엔진&rdquo;' },
      { icon: '&#x1F3AF;', title: '제휴 핵심 가치',
        body: '&#x2460; 기존 FDS·스코어링과 달리 <strong style="color:#F0C674;">반응형이 아닌 예측형</strong> 분석<br>'
            + '&#x2461; 카드사·보험사·핀테크 고객 데이터 &rarr; 행동 예측 &rarr; 타겟 마케팅·리텐션 자동화<br>'
            + '&#x2462; 특허 4건 출원 (핵심 1건 + 응용 3건) / API 연동 B2B 공급 방식<br>'
            + '&#x2463; PoC 파트너십 (데이터 제공 &harr; 분석 결과 공유) 제안<br>'
            + '&#x2464; LOI 체결 후 상세 협의 가능' },
      { icon: '&#x1F4CE;', title: '첨부 파일',
        body: '① N-KAI IR Deck (nkai-ir-deck-v22.pptx)<br>② 특허출원서 4건' }
    ];
    closing = '바쁘신 중에도 검토 후 30분 미팅 기회 주시면 감사하겠습니다.';
  }

  // ── HTML 빌드 (화이트 배경 · 골드 포인트) ──
  var sectionsHtml = sections.map(function(s) {
    return '<div style="margin-bottom:16px;">'
      + '<div style="color:#92710A;font-size:11px;font-weight:700;letter-spacing:1px;margin-bottom:6px;">'
      + '&#x25B6; ' + s.title + '</div>'
      + '<div style="background:#FFFDF5;border-left:3px solid #C9A84C;padding:10px 14px;"'
      + 'border-radius:0 6px 6px 0;font-size:12px;color:#374151;line-height:1.9;">'
      + s.body + '</div></div>';
  }).join('');

  var html = '<!DOCTYPE html><html lang="ko"><head>'
    + '<meta charset="UTF-8"><meta http-equiv="Content-Type" content="text/html; charset=UTF-8">'
    + '</head><body style="margin:0;padding:0;background:#F3F4F6;font-family:AppleSDGothicNeo,MalgunGothic,Arial,sans-serif;">'
    + '<div style="max-width:560px;margin:0 auto;padding:28px 16px;">'
    + '<div style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">'
    // 로고 헤더 — 다크 네이비 + 골드 (기보 스타일 동일)
    + '<div style="background:#0D1B2A;padding:20px 28px;">'
    + '<div style="font-size:22px;font-weight:900;color:#F0C674;letter-spacing:4px;">N&#xB7;KAI</div>'
    + '<div style="color:#94A3B8;font-size:11px;margin-top:3px;">뉴린카이로스에이아이 주식회사</div>'
    + '</div>'
    // 배지 + 헤드라인
    + '<div style="background:#FFFFFF;border-bottom:1px solid #E5E7EB;padding:16px 28px;">'
    + '<div style="display:inline-block;background:#FEF9EC;border:1px solid #C9A84C;border-radius:20px;padding:3px 12px;font-size:10px;color:#92710A;font-weight:700;margin-bottom:8px;">' + badge + '</div>'
    + '<div style="font-size:17px;font-weight:700;color:#111827;">' + headline + '</div>'
    + '</div>'
    // 인사말
    + '<div style="background:#FFFFFF;padding:20px 28px 16px;font-size:13px;color:#374151;line-height:2;">'
    + name + ', 안녕하세요.<br><br>'
    + '뉴린카이로스에이아이 주식회사 대표이사 이원재입니다.<br>'
    + contact + ' 감사드립니다.<br><br>'
    + '말씀드린 대로 <strong style="color:#111827;">IR 자료와 특허출원서(4건)</strong>를 첨부하여 송부드립니다.'
    + '</div>'
    + '<div style="height:1px;background:#F3F4F6;margin:0 28px;"></div>'
    // 섹션들
    + '<div style="background:#FFFFFF;padding:16px 28px;">' + sectionsHtml + '</div>'
    // 클로징
    + '<div style="background:#F9FAFB;border-top:1px solid #E5E7EB;padding:14px 28px;font-size:12px;color:#6B7280;line-height:1.8;">'
    + closing
    + '</div>'
    // 서명
    + '<div style="background:#FFFFFF;border-top:2px solid #C9A84C;padding:16px 28px;font-size:11px;color:#6B7280;line-height:2;">'
    + '<strong style="color:#111827;font-size:13px;">' + senderName + '</strong> 드림<br>'
    + '<span style="color:#6B7280;">' + senderTitle + '</span><br>'
    + 'M. ' + phone + '&nbsp;&nbsp;|&nbsp;&nbsp;E. <a href="mailto:' + email + '" style="color:#C9A84C;text-decoration:none;">' + email + '</a><br>'
    + 'W. <a href="' + web + '" style="color:#2563EB;text-decoration:none;">' + web + '</a>'
    + '&nbsp;&nbsp;|&nbsp;&nbsp;사업자등록번호: ' + biz
    + '</div>'
    + '</div>'
    + '</div></body></html>';

  return html;
}


// ── 정부기관 발송 ──────────────────────────────────────────────
function sendIR_Gov(opts) {
  var to      = (opts && opts.to)      || '';
  var name    = (opts && opts.name)    || '담당자님';
  var contact = (opts && opts.contact) || '오늘 연락';
  if (!to) { Logger.log('[sendIR_Gov] ❌ 수신 이메일 없음'); return; }
  var html = _buildIrHtml('gov', name, contact);
  var subject = '[N-KAI] IR 자료 및 특허출원서 송부 — 뉴린카이로스에이아이(주) 이원재';
  GmailApp.sendEmail(to, subject, 'HTML을 지원하지 않는 환경입니다.',
    { htmlBody: html, name: '이원재 · N-KAI', replyTo: 'wonjae.lee@neurinkairosai.com', charset: 'UTF-8' });
  Logger.log('[sendIR_Gov] ✅ 발송 완료 → ' + to);
}

// ── 투자자 발송 ────────────────────────────────────────────────
function sendIR_Investor(opts) {
  var to      = (opts && opts.to)      || '';
  var name    = (opts && opts.name)    || '대표님';
  var contact = (opts && opts.contact) || '오늘 연락';
  if (!to) { Logger.log('[sendIR_Investor] ❌ 수신 이메일 없음'); return; }
  var html = _buildIrHtml('investor', name, contact);
  var subject = '[N-KAI] IR 자료 송부 — 투자 검토 요청 · 뉴린카이로스에이아이(주) 이원재';
  GmailApp.sendEmail(to, subject, 'HTML을 지원하지 않는 환경입니다.',
    { htmlBody: html, name: '이원재 · N-KAI', replyTo: 'wonjae.lee@neurinkairosai.com', charset: 'UTF-8' });
  Logger.log('[sendIR_Investor] ✅ 발송 완료 → ' + to);
}

// ── 제휴사 발송 ────────────────────────────────────────────────
function sendIR_Partner(opts) {
  var to      = (opts && opts.to)      || '';
  var name    = (opts && opts.name)    || '담당자님';
  var contact = (opts && opts.contact) || '오늘 연락';
  if (!to) { Logger.log('[sendIR_Partner] ❌ 수신 이메일 없음'); return; }
  var html = _buildIrHtml('partner', name, contact);
  var subject = '[N-KAI × 제휴 제안] 고객 행동 예측 엔진 — 뉴린카이로스에이아이(주) 이원재';
  GmailApp.sendEmail(to, subject, 'HTML을 지원하지 않는 환경입니다.',
    { htmlBody: html, name: '이원재 · N-KAI', replyTo: 'wonjae.lee@neurinkairosai.com', charset: 'UTF-8' });
  Logger.log('[sendIR_Partner] ✅ 발송 완료 → ' + to);
}

// ── 테스트 함수 3종 (sogood2172@gmail.com 발송) ────────────────
function testIR_Gov() {
  sendIR_Gov({ to: 'sogood2172@gmail.com', name: '최진호 부지점장님', contact: '오늘 전화 통화' });
}
function testIR_Investor() {
  sendIR_Investor({ to: 'sogood2172@gmail.com', name: '홍길동 대표님', contact: '소개' });
}
function testIR_Partner() {
  sendIR_Partner({ to: 'sogood2172@gmail.com', name: '김덕원 실장님', contact: '오늘 전화 통화' });
}

// ════════════════════════════════════════════════════════════════
// END PART 9
// ════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════
// PART 10 — 개인화 드립 시퀀스 v1.0 (D+3 / D+7 / D+14)
// 매일 오전 9시 자동 실행 — installDripTrigger() 1회 실행으로 설치
// ════════════════════════════════════════════════════════════════

// ── 16 아키타입별 소비 위험 요일 + 패턴 DB ──
var DRIP_ARCHETYPE_DB = {
  ENTJ: {
    riskDay: '수요일', riskReason: '주 중반 자신감이 최고조일 때 과감한 지출 결정을 내리기 쉽습니다.',
    losePattern: [
      '확신에 찬 순간 대규모 결제 — 검증 없이 "됐어, 이거야" 판단',
      '성과 보상 심리 — "이만큼 했으니 이 정도는 괜찮아" 지출',
      '리더십 소비 — 팀·모임에서 전액 결제하는 습관'
    ]
  },
  INTJ: {
    riskDay: '금요일', riskReason: '주말 전 분석 피로가 쌓여 "이미 충분히 조사했으니까" 성급한 결제를 합니다.',
    losePattern: [
      '과분석 후 충동 결제 — 오래 고민하다 갑자기 "에라 모르겠다" 구매',
      '시스템·장비 과투자 — "효율을 위한 투자"라는 합리화',
      '고가 정보 상품 구매 — 강의·컨설팅에 과도한 지출'
    ]
  },
  ENTP: {
    riskDay: '화요일', riskReason: '새로운 아이디어가 떠오르는 초반에 검증 없이 관련 지출을 시작합니다.',
    losePattern: [
      '새 아이디어 흥분 구매 — 시작만 하고 끝내지 않는 프로젝트 비용',
      '다중 구독 누적 — 이것저것 가입 후 해지를 깜빡하는 패턴',
      '네트워킹 과지출 — 모임·이벤트·밋업에 무계획 참석'
    ]
  },
  INTP: {
    riskDay: '목요일', riskReason: '주 후반 집중력이 떨어질 때 "연구 자료"라는 명목의 충동 구매가 발생합니다.',
    losePattern: [
      '지적 호기심 구매 — 책·강의·가젯을 "공부용"으로 과다 구입',
      '미루다가 급한 결제 — 마감 직전 프리미엄 가격 지불',
      '비교 분석 마비 — 너무 오래 비교하다 최적 타이밍을 놓침'
    ]
  },
  ENFJ: {
    riskDay: '월요일', riskReason: '새 주 시작의 의욕이 넘칠 때 주변 사람을 위한 과도한 지출을 합니다.',
    losePattern: [
      '타인 배려 지출 — 선물·식사·후원에 예산 초과',
      '감정 동조 구매 — 주변의 구매 결정에 동조하는 패턴',
      '미래 비전 과투자 — "더 나은 내일을 위해" 현재 재무 무시'
    ]
  },
  INFJ: {
    riskDay: '일요일', riskReason: '조용한 시간에 내면의 이상과 현실의 괴리를 소비로 해소하려 합니다.',
    losePattern: [
      '가치 기반 과소비 — "의미 있는 소비"라는 합리화로 고가 결제',
      '감정 보상 구매 — 에너지 소진 후 "나를 위한 선물" 지출',
      '장기 구독 과적립 — 이상적 미래를 위한 과도한 선투자'
    ]
  },
  ENFP: {
    riskDay: '토요일', riskReason: '자유로운 주말에 "경험이 중요해!"라는 생각으로 즉흥 지출이 폭발합니다.',
    losePattern: [
      '즉흥 경험 소비 — 여행·축제·이벤트에 무계획 지출',
      'FOMO 구매 — "지금 아니면 없어져!" 한정판·세일 충동',
      '다중 프로젝트 비용 — 동시에 여러 관심사에 돈을 쏟음'
    ]
  },
  INFP: {
    riskDay: '수요일', riskReason: '주 중반 감정 에너지가 낮아질 때 위로 소비가 발생합니다.',
    losePattern: [
      '감성 위로 구매 — 기분이 가라앉을 때 "작은 사치" 반복',
      '가치 소비 합리화 — 비싼 친환경·핸드메이드 제품 과구매',
      '결정 회피 손실 — 환불·해지를 미루다 비용 누적'
    ]
  },
  ESTJ: {
    riskDay: '월요일', riskReason: '주간 계획을 세울 때 "효율을 위한 투자"라는 명목으로 과지출합니다.',
    losePattern: [
      '시스템 업그레이드 과투자 — "장기적으로 이득"이라는 합리화',
      '계획 초과 지출 — 예산을 세웠지만 "예외 항목" 누적',
      '체면 유지 비용 — 사회적 기대에 맞추려는 소비'
    ]
  },
  ISTJ: {
    riskDay: '토요일', riskReason: '평소 절제하다 주말에 "나도 좀 쓰자"라는 보상 심리가 작동합니다.',
    losePattern: [
      '보상 심리 폭발 — 평소 절약 후 한 번에 큰 금액 지출',
      '브랜드 충성 과지출 — 익숙한 브랜드에만 프리미엄 지불',
      '변화 거부 손실 — 더 좋은 조건을 놓치고 기존 계약 유지'
    ]
  },
  ESTP: {
    riskDay: '금요일', riskReason: '주말 직전 흥분감이 최고조일 때 "지금이 기회!" 충동 결제를 합니다.',
    losePattern: [
      '순간 흥분 구매 — "이건 지금 아니면 안 돼" 즉시 결제',
      '경쟁 심리 지출 — 주변보다 더 좋은 것을 갖고 싶은 욕구',
      '단기 쾌감 소비 — 장기 가치 없는 경험·유흥에 과지출'
    ]
  },
  ISTP: {
    riskDay: '목요일', riskReason: '관심 분야에 몰입할 때 "도구가 필요해"라는 논리로 고가 장비를 구매합니다.',
    losePattern: [
      '도구·장비 과투자 — "제대로 하려면 좋은 장비가 필요해"',
      '독립성 비용 — 남에게 맡기면 될 일을 직접 하려고 구매',
      '관심사 전환 손실 — 이전 취미 장비가 방치되는 패턴'
    ]
  },
  ESFJ: {
    riskDay: '일요일', riskReason: '가족·모임을 위해 "다 같이 좋은 시간"을 만들려는 과지출이 발생합니다.',
    losePattern: [
      '관계 유지 소비 — 모임·선물·식사 대접에 예산 초과',
      '트렌드 동조 구매 — 주변이 사면 나도 사야 할 것 같은 압박',
      '안전 프리미엄 — "가족을 위해"라는 명목의 과보험·과적립'
    ]
  },
  ISFJ: {
    riskDay: '화요일', riskReason: '일상 루틴 속 "가족을 위한 것이니까"라는 합리화로 과지출합니다.',
    losePattern: [
      '돌봄 과지출 — 가족·반려동물을 위한 프리미엄 소비',
      '안전 집착 비용 — 보험·보증·연장 서비스에 과투자',
      '거절 못 하는 지출 — 부탁·권유를 거절하지 못해 발생하는 비용'
    ]
  },
  ESFP: {
    riskDay: '금요일', riskReason: '주말 시작 흥분과 함께 "인생은 즐겨야지!" 소비가 폭발합니다.',
    losePattern: [
      '분위기 소비 — 그 순간의 기분에 따라 지갑이 열림',
      '소셜 과시 지출 — SNS에 올릴 경험·물건에 과투자',
      '할인 함정 — "50% 세일이니까 사실 이득"이라는 착각'
    ]
  },
  ISFP: {
    riskDay: '수요일', riskReason: '주 중반 감성이 예민해질 때 "나다운 것"을 찾으며 소비합니다.',
    losePattern: [
      '심미적 충동 — 예쁜 것·감각적인 것에 무방비 결제',
      '자기표현 소비 — 패션·인테리어·취미에 과도한 투자',
      '마감 공포 구매 — 한정 수량·시즌 한정에 취약'
    ]
  }
};

// ── 코어에너지별 보충 메시지 (D+7 이메일 강화용) ──
var DRIP_ENERGY_MSG = {
  '木': '성장·확장 에너지가 강한 당신은 "투자"라는 이름의 지출에 특히 취약합니다. 성장이 아닌 팽창인지 구분하세요.',
  '火': '열정·표현 에너지가 강한 당신은 감정이 고조될 때 지갑이 열립니다. 흥분 상태에서 결제 버튼을 누르지 마세요.',
  '土': '안정·균형 에너지가 강한 당신은 "안전을 위한 소비"에 과투자합니다. 진짜 필요한 보험과 불안 해소용 보험을 구분하세요.',
  '金': '결단·분석 에너지가 강한 당신은 "효율"이라는 합리화에 취약합니다. 가성비 좋은 불필요한 물건이 가장 비쌉니다.',
  '水': '지혜·유연 에너지가 강한 당신은 "다양한 경험"을 위한 분산 지출이 누적됩니다. 구독 목록을 지금 바로 점검하세요.'
};

// ── 메인 드립 시퀀스 함수 (매일 09:00 자동 실행) ──
function sendDripSequence() {
  try {
    var ss = getLogSpreadsheet();
    if (!ss) { Logger.log('[드립] 스프레드시트 없음'); return; }

    var anaSheet = ss.getSheetByName('분석데이터');
    if (!anaSheet || anaSheet.getLastRow() < 2) { Logger.log('[드립] 분석데이터 없음'); return; }

    // ── 결제기록 이메일 SET 구성 (결제 완료자 스킵용)
    var paySheet = ss.getSheetByName('결제기록');
    var paidEmails = {};
    if (paySheet && paySheet.getLastRow() >= 2) {
      var payRows = paySheet.getDataRange().getValues();
      for (var pi = 1; pi < payRows.length; pi++) {
        var pe = safeStr(payRows[pi][2]).toLowerCase().trim();
        if (pe) paidEmails[pe] = true;
      }
    }

    // ── 프리미엄이메일 시트에서 이미 발송된 드립 기록 조회
    var emailSheet = ss.getSheetByName('프리미엄이메일');
    var sentMap = {}; // key: "email::drip_dN"
    if (emailSheet && emailSheet.getLastRow() >= 2) {
      var eRows = emailSheet.getDataRange().getValues();
      for (var ei = 1; ei < eRows.length; ei++) {
        var eEmail = safeStr(eRows[ei][2]).toLowerCase().trim();
        var eResult = safeStr(eRows[ei][6]).toLowerCase().trim();
        if (eEmail && eResult.indexOf('drip_d') === 0) {
          sentMap[eEmail + '::' + eResult] = true;
        }
      }
    }

    // ── 분석데이터 순회
    var anaRows = anaSheet.getDataRange().getValues();
    var now = new Date();
    var sent = 0;
    var skipped = 0;

    for (var i = 1; i < anaRows.length; i++) {
      var row = anaRows[i];
      var regDate = row[0]; // 컬럼1: 일시
      var email   = safeStr(row[2]).trim();  // 컬럼3: 이메일
      var name    = safeStr(row[3]).trim();   // 컬럼4: 이름
      var arch    = safeStr(row[4]).toUpperCase().trim(); // 컬럼5: 아키타입
      var nscore  = safeStr(row[5]);          // 컬럼6: N-Score
      var coreEl  = safeStr(row[10]);         // 컬럼11: 코어에너지
      var gt1     = safeStr(row[11]);         // 컬럼12: 골든타임1
      var gt2     = safeStr(row[12]);         // 컬럼13: 골든타임2
      var gt3     = safeStr(row[13]);         // 컬럼14: 골든타임3
      var ngrade  = safeStr(row[6]);          // 컬럼7: N등급
      var kpi1    = safeStr(row[7]);          // 컬럼8: 경제감각
      var kpi2    = safeStr(row[8]);          // 컬럼9: 기회포착력 (표현에너지)
      var kpi3    = safeStr(row[9]);          // 컬럼10: 위기대응력
      // breakdown 4개 컬럼 (인덱스 45~48)
      var bdInnate  = safeStr(row[45]);       // 컬럼46: breakdown_innate (JSON)
      var bdKipa    = safeStr(row[46]);       // 컬럼47: breakdown_kipa (JSON)
      var bdDynamic = safeStr(row[47]);       // 컬럼48: breakdown_dynamic (JSON)
      var bdBonus   = safeStr(row[48]);       // 컬럼49: behavior_bonus (JSON)

      // ── 섹션1: N-Score 산출 근거 (4개 전부 있을 때만)
      var breakdownData = null;
      if (bdInnate && bdKipa && bdDynamic && bdBonus) {
        breakdownData = { innate: bdInnate, kipa: bdKipa, dynamic: bdDynamic, bonus: bdBonus };
      }
      // ── 섹션2: 트리플 미러 (코어에너지 + 아키타입 필요)
      // ── 섹션3: 3대 KPI (3개 모두 있을 때만)
      var kpiData = null;
      if (kpi1 && kpi2 && kpi3) {
        kpiData = { kpi1: kpi1, kpi2: kpi2, kpi3: kpi3 };
      }

      // ── 안전장치 1,2: NULL + 이메일 형식 체크
      if (!email || !name || email.indexOf('@') < 0) { skipped++; continue; }
      var emailLow = email.toLowerCase();

      // ── 안전장치 3: 결제 완료자 스킵
      if (paidEmails[emailLow]) { skipped++; continue; }

      // ── 등록일 파싱 + 경과일 계산
      var regTime;
      if (regDate instanceof Date) {
        regTime = regDate.getTime();
      } else {
        regTime = new Date(regDate).getTime();
      }
      if (isNaN(regTime)) { skipped++; continue; }

      var diffMs = now.getTime() - regTime;
      var diffDays = Math.floor(diffMs / 86400000);

      // ── 드립 단계 결정 (D+3, D+7, D+14만 발송)
      var dripStage = '';
      if (diffDays >= 3 && diffDays < 7)   dripStage = 'drip_d3';
      else if (diffDays >= 7 && diffDays < 14)  dripStage = 'drip_d7';
      else if (diffDays >= 14 && diffDays < 21) dripStage = 'drip_d14';
      else { continue; } // 범위 밖 — 스킵

      // ── 안전장치 4: 이미 발송한 단계 중복 방지
      var sentKey = emailLow + '::' + dripStage;
      if (sentMap[sentKey]) { skipped++; continue; }

      // ── 아키타입 DB 조회
      var archData = DRIP_ARCHETYPE_DB[arch] || DRIP_ARCHETYPE_DB['ENTJ'];
      var energyMsg = DRIP_ENERGY_MSG[coreEl] || DRIP_ENERGY_MSG['金'];

      // ── 단계별 이메일 발송
      var subject = '';
      var htmlBody = '';

      if (dripStage === 'drip_d3') {
        subject = '[N-KAI] ' + name + '님, 이번 주 ' + archData.riskDay + '에 지갑 조심하세요';
        htmlBody = _buildDripD3Html(name, arch, nscore, coreEl, archData, breakdownData, kpiData);
      } else if (dripStage === 'drip_d7') {
        subject = '[N-KAI] ' + name + '님의 지갑이 보내는 신호';
        htmlBody = _buildDripD7Html(name, arch, nscore, coreEl, archData, energyMsg, breakdownData, kpiData);
      } else if (dripStage === 'drip_d14') {
        subject = '[N-KAI] ' + name + '님의 이번 달 골든타임은 딱 3일';
        htmlBody = _buildDripD14Html(name, arch, nscore, coreEl, gt1, gt2, gt3, breakdownData, kpiData);
      }

      // ── 안전장치 5: GmailApp.sendEmail htmlBody 방식
      try {
        GmailApp.sendEmail(email, subject,
          '이메일 클라이언트가 HTML을 지원하지 않습니다.',
          { htmlBody: htmlBody, name: 'N-KAI 팀', replyTo: 'support@neurinkairosai.com', charset: 'UTF-8' }
        );

        // ── 안전장치 6: 프리미엄이메일 시트에 발송 기록
        logTrackingData({
          type: 'premium_email',
          email: email,
          name: name,
          archetype: arch,
          nscore: nscore,
          result: dripStage,
          path: 'gas_drip',
          tier: 'free',
          is_mobile: ''
        });

        sentMap[sentKey] = true; // 런타임 중복 방지
        sent++;
        Logger.log('[드립] ' + dripStage + ' 발송: ' + email + ' / ' + arch);
        Utilities.sleep(500); // 발송 간격
      } catch (sendErr) {
        Logger.log('[드립] 발송 실패: ' + email + ' — ' + sendErr.toString());
      }
    }

    Logger.log('[드립] 완료 — 발송:' + sent + ' 스킵:' + skipped);
  } catch (e) {
    Logger.log('[드립] 전체 오류: ' + e.toString());
  }
}

// ════════════════════════════════════════════════════════════════
// 섹션1: N-Score 산출 근거 (breakdown 4개 컬럼 기반)
// breakdownData가 null이면 빈 문자열 반환 (섹션 숨김)
// ════════════════════════════════════════════════════════════════
function _buildNScoreReasonHtml(name, nscore, breakdownData) {
  if (!breakdownData) return '';
  // JSON 파싱 (실패 시 빈 객체)
  var inn = {}; try { inn = JSON.parse(breakdownData.innate); } catch(e) {}
  var kip = {}; try { kip = JSON.parse(breakdownData.kipa); } catch(e) {}
  var dyn = {}; try { dyn = JSON.parse(breakdownData.dynamic); } catch(e) {}
  var bon = {}; try { bon = JSON.parse(breakdownData.bonus); } catch(e) {}
  var bonusScore = (typeof bon === 'object' && bon.totalBonus) ? parseInt(bon.totalBonus) : parseInt(breakdownData.bonus || '0');

  // ═══ N-Score 표시용 비율 분배 v5.0 (Phase 1 가중치: DNA 40% / KIPA 35% / 동적 25%) ═══
  var _ns2 = parseInt(nscore) || 0;
  var _scoreExBonus2 = _ns2 - bonusScore;
  if (_scoreExBonus2 < 0) _scoreExBonus2 = 0;
  var _innPt2 = Math.round(_scoreExBonus2 * 0.40);
  var _kipPt2 = Math.round(_scoreExBonus2 * 0.35);
  var _dynPt2 = _scoreExBonus2 - _innPt2 - _kipPt2;
  var _tot3 = _ns2 || 1;

  if (!_innPt2 && !_kipPt2 && !_dynPt2 && !bonusScore) return '';
  function _ep(v) { return Math.max(2, Math.round(Math.abs(v) / _tot3 * 100)); }

  return '<div style="background:#0F1524;border:1px solid rgba(201,168,76,.12);border-radius:12px;padding:16px;margin-bottom:16px;">'
    + '<div style="color:#c9a84c;font-size:11px;font-weight:700;letter-spacing:1.5px;margin-bottom:14px;">'
    + '&#x2605; N-Score &#xC0B0;&#xCD9C; &#xADFC;&#xAC70;</div>'
    // 🧬 DNA가 설계한 나
    + '<div style="margin-bottom:14px;">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">'
    + '<span style="flex:1;min-width:0;font-size:13px;font-weight:700;color:#C9A84C;">&#x1F9EC; DNA&#xAC00; &#xC124;&#xACC4;&#xD55C; &#xB098;</span>'
    + '<div style="flex:0 0 auto;margin-left:20px;white-space:nowrap;text-align:right;"><span style="font-size:17px;font-weight:900;color:#C9A84C;">' + _innPt2 + '<span style="font-size:10px;color:#64748B;">&#xC810;</span></span>'
    + '<span style="font-size:11px;color:#C9A84C;opacity:0.7;margin-left:5px;">(' + _ep(_innPt2) + '%)</span></div></div>'
    + '<div style="font-size:11px;color:#64748B;margin-bottom:6px;">&#xC120;&#xCC9C; &#xAE30;&#xC9C8; &#xB7; &#xCF54;&#xC5B4;&#xC5D0;&#xB108;&#xC9C0; &#xB7; &#xAC15;&#xC57D;&#xC9C0;&#xC218;</div>'
    + '<div style="height:7px;background:rgba(255,255,255,0.07);border-radius:4px;overflow:hidden;">'
    + '<div style="height:100%;width:' + _ep(_innPt2) + '%;background:#C9A84C;border-radius:4px;"></div></div></div>'
    // 🧠 내가 인식하는 나
    + '<div style="margin-bottom:14px;">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">'
    + '<span style="flex:1;min-width:0;font-size:13px;font-weight:700;color:#2D8CFF;">&#x1F9E0; &#xB0B4;&#xAC00; &#xC778;&#xC2DD;&#xD558;&#xB294; &#xB098;</span>'
    + '<div style="flex:0 0 auto;margin-left:20px;white-space:nowrap;text-align:right;"><span style="font-size:17px;font-weight:900;color:#2D8CFF;">' + _kipPt2 + '<span style="font-size:10px;color:#64748B;">&#xC810;</span></span>'
    + '<span style="font-size:11px;color:#2D8CFF;opacity:0.7;margin-left:5px;">(' + _ep(_kipPt2) + '%)</span></div></div>'
    + '<div style="font-size:11px;color:#64748B;margin-bottom:6px;">KIPA &#xD589;&#xB3D9;&#xC9C4;&#xB2E8; 16&#xBB38;&#xD56D; &#xB7; &#xACB0;&#xB2E8;&#xB825;</div>'
    + '<div style="height:7px;background:rgba(255,255,255,0.07);border-radius:4px;overflow:hidden;">'
    + '<div style="height:100%;width:' + _ep(_kipPt2) + '%;background:#2D8CFF;border-radius:4px;"></div></div></div>'
    // ⚡ 공명 · 충돌 · 균형
    + '<div style="margin-bottom:14px;">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">'
    + '<span style="flex:1;min-width:0;font-size:13px;font-weight:700;color:#FFD700;">&#x26A1; &#xACF5;&#xBA85; &#xB7; &#xCDA9;&#xB3CC; &#xB7; &#xADE0;&#xD615;</span>'
    + '<div style="flex:0 0 auto;margin-left:20px;white-space:nowrap;text-align:right;"><span style="font-size:17px;font-weight:900;color:#FFD700;">' + _dynPt2 + '<span style="font-size:10px;color:#64748B;">&#xC810;</span></span>'
    + '<span style="font-size:11px;color:#FFD700;opacity:0.7;margin-left:5px;">(' + _ep(_dynPt2) + '%)</span></div></div>'
    + '<div style="font-size:11px;color:#64748B;margin-bottom:6px;">&#xC120;&#xCC9C;&#xD6C4;&#xCC9C; &#xACF5;&#xBA85; &#xB7; 5-Energy &#xADE0;&#xD615;&#xBCF4;&#xB108;&#xC2A4;</div>'
    + '<div style="height:7px;background:rgba(255,255,255,0.07);border-radius:4px;overflow:hidden;">'
    + '<div style="height:100%;width:' + _ep(_dynPt2) + '%;background:#FFD700;border-radius:4px;"></div></div></div>'
    // 💳 지갑이 증명하는 나
    + '<div style="margin-bottom:4px;">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">'
    + '<span style="flex:1;min-width:0;font-size:13px;font-weight:700;color:#00D68F;">&#x1F4B3; &#xC9C0;&#xAC11;&#xC774; &#xC99D;&#xBA85;&#xD558;&#xB294; &#xB098;</span>'
    + '<div style="flex:0 0 auto;margin-left:20px;white-space:nowrap;text-align:right;"><span style="font-size:17px;font-weight:900;color:#00D68F;">+' + bonusScore + '<span style="font-size:10px;color:#64748B;">&#xC810;</span></span>'
    + '<span style="font-size:11px;color:#00D68F;opacity:0.7;margin-left:5px;">(' + _ep(bonusScore) + '%)</span></div></div>'
    + '<div style="font-size:11px;color:#64748B;margin-bottom:6px;">&#xC18C;&#xBE44; &#xD589;&#xB3D9; &#xD328;&#xD134; 4&#xAC00;&#xC9C0;</div>'
    + '<div style="height:7px;background:rgba(255,255,255,0.07);border-radius:4px;overflow:hidden;">'
    + '<div style="height:100%;width:' + _ep(bonusScore) + '%;background:#00D68F;border-radius:4px;"></div></div></div>'
    + '</div>';
}

// ════════════════════════════════════════════════════════════════
// 섹션2: 트리플 미러 (DNA / KIPA / 데이터)
// ════════════════════════════════════════════════════════════════
function _buildTripleMirrorHtml(name, arch, coreEl) {
  if (!arch || !coreEl) return '';
  var elLabel = {'金':'&#xACB0;&#xB2E8;&#xD615; &#xBD84;&#xC11D;','木':'&#xC131;&#xC7A5;&#xD615; &#xD655;&#xC7A5;','火':'&#xC5F4;&#xC815;&#xD615; &#xD45C;&#xD604;','土':'&#xC548;&#xC815;&#xD615; &#xADE0;&#xD615;','水':'&#xC9C0;&#xD61C;&#xD615; &#xC720;&#xC5F0;'}[coreEl] || '';
  var elColor = {'金':'#F0C674','木':'#22C55E','火':'#EF4444','土':'#F59E0B','水':'#2D8CFF'}[coreEl] || '#F0C674';
  // KIPA 그룹 설명
  var grpMap = {
    'ENTJ':'&#xC804;&#xB7B5;&#xAC00;','ENTP':'&#xD601;&#xC2E0;&#xAC00;','INTJ':'&#xC124;&#xACC4;&#xC790;','INTP':'&#xBD84;&#xC11D;&#xAC00;',
    'ENFJ':'&#xB9AC;&#xB354;','INFJ':'&#xBE44;&#xC804;&#xAC00;','ENFP':'&#xD0D0;&#xD5D8;&#xAC00;','INFP':'&#xC774;&#xC0C1;&#xC8FC;&#xC758;&#xC790;',
    'ESTJ':'&#xAD00;&#xB9AC;&#xC790;','ISTJ':'&#xC2E4;&#xBB34;&#xAC00;','ESTP':'&#xC2E4;&#xD589;&#xAC00;','ISTP':'&#xAE30;&#xC220;&#xC790;',
    'ESFJ':'&#xC870;&#xB825;&#xC790;','ISFJ':'&#xC218;&#xD638;&#xC790;','ESFP':'&#xD65C;&#xB3D9;&#xAC00;','ISFP':'&#xC608;&#xC220;&#xAC00;'
  };
  var grpLabel = grpMap[arch] || arch;

  return '<div style="background:#0F1524;border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:16px;margin-bottom:16px;">'
    + '<div style="color:#c9a84c;font-size:11px;font-weight:700;letter-spacing:1.5px;margin-bottom:14px;">TRIPLE MIRROR</div>'
    // DNA
    + '<div style="display:flex;align-items:center;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.04);">'
    + '<div style="flex:0 0 auto;font-size:16px;margin-right:10px;">&#x1F9EC;</div>'
    + '<div style="flex:1;"><div style="color:#64748B;font-size:9px;letter-spacing:1px;margin-bottom:2px;">DNA&#xAC00; &#xC124;&#xACC4;&#xD55C; &#xB098;</div>'
    + '<div style="color:' + elColor + ';font-size:13px;font-weight:700;">' + coreEl + ' &#xCF54;&#xC5B4; &#x2014; ' + elLabel + '</div></div></div>'
    // KIPA
    + '<div style="display:flex;align-items:center;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.04);">'
    + '<div style="flex:0 0 auto;font-size:16px;margin-right:10px;">&#x1F9E0;</div>'
    + '<div style="flex:1;"><div style="color:#64748B;font-size:9px;letter-spacing:1px;margin-bottom:2px;">&#xB0B4;&#xAC00; &#xC778;&#xC2DD;&#xD558;&#xB294; &#xB098;</div>'
    + '<div style="color:#2D8CFF;font-size:13px;font-weight:700;">' + arch + ' ' + grpLabel + '</div></div></div>'
    // DATA
    + '<div style="display:flex;align-items:center;padding:10px 0;">'
    + '<div style="flex:0 0 auto;font-size:16px;margin-right:10px;">&#x1F4B3;</div>'
    + '<div style="flex:1;"><div style="color:#64748B;font-size:9px;letter-spacing:1px;margin-bottom:2px;">&#xB370;&#xC774;&#xD130;&#xAC00; &#xC99D;&#xBA85;&#xD558;&#xB294; &#xB098;</div>'
    + '<div style="color:#00D68F;font-size:13px;font-weight:700;">' + arch + ' &#xC18C;&#xBE44; &#xD328;&#xD134;</div></div></div>'
    + '</div>';
}

// ════════════════════════════════════════════════════════════════
// 섹션3: 3대 핵심 금융지표 (경제감각/표현에너지/위기대응력)
// ════════════════════════════════════════════════════════════════
function _build3KpiHtml(kpiData) {
  if (!kpiData) return '';
  var k1 = safeStr(kpiData.kpi1).trim();
  var k2 = safeStr(kpiData.kpi2).trim();
  var k3 = safeStr(kpiData.kpi3).trim();
  if (!k1 && !k2 && !k3) return '';

  return '<div style="background:#0F1524;border:1px solid rgba(45,140,255,.12);border-radius:12px;padding:16px;margin-bottom:16px;">'
    + '<div style="color:#2D8CFF;font-size:11px;font-weight:700;letter-spacing:1.5px;margin-bottom:12px;">3&#xB300; &#xD575;&#xC2EC; &#xAE08;&#xC735;&#xC9C0;&#xD45C;</div>'
    // 경제감각
    + '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 4px;border-bottom:1px solid rgba(255,255,255,.04);">'
    + '<div style="display:flex;align-items:center;flex:1;min-width:0;">'
    + '<div style="flex:0 0 auto;font-size:14px;margin-right:10px;">&#x1F4B0;</div>'
    + '<div style="color:#8A95AB;font-size:12px;">&#xACBD;&#xC81C;&#xAC10;&#xAC01;</div></div>'
    + '<div style="flex:0 0 auto;color:#2D8CFF;font-size:14px;font-weight:900;margin-left:20px;text-align:right;">' + k1 + '</div>'
    + '</div>'
    // 표현에너지
    + '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 4px;border-bottom:1px solid rgba(255,255,255,.04);">'
    + '<div style="display:flex;align-items:center;flex:1;min-width:0;">'
    + '<div style="flex:0 0 auto;font-size:14px;margin-right:10px;">&#x26A1;</div>'
    + '<div style="color:#8A95AB;font-size:12px;">&#xD45C;&#xD604;&#xC5D0;&#xB108;&#xC9C0;</div></div>'
    + '<div style="flex:0 0 auto;color:#5AA8FF;font-size:14px;font-weight:900;margin-left:20px;text-align:right;">' + k2 + '</div>'
    + '</div>'
    // 위기대응력
    + '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 4px;">'
    + '<div style="display:flex;align-items:center;flex:1;min-width:0;">'
    + '<div style="flex:0 0 auto;font-size:14px;margin-right:10px;">&#x1F6E1;</div>'
    + '<div style="color:#8A95AB;font-size:12px;">&#xC704;&#xAE30;&#xB300;&#xC751;&#xB825;</div></div>'
    + '<div style="flex:0 0 auto;color:#00D68F;font-size:14px;font-weight:900;margin-left:20px;text-align:right;">' + k3 + '</div>'
    + '</div>'
    + '</div>';
}

// ════════════════════════════════════════════════════════════════
// D+3 HTML: 이번 주 소비 위험 날짜 경고
// ════════════════════════════════════════════════════════════════
function _buildDripD3Html(name, arch, nscore, coreEl, archData, breakdownData, kpiData) {
  var elColor = {'金':'#F0C674','木':'#22C55E','火':'#EF4444','土':'#F59E0B','水':'#2D8CFF'}[coreEl] || '#F0C674';

  // 이번 주 위험 날짜 계산 (다음 riskDay)
  var dayMap = {'일요일':0,'월요일':1,'화요일':2,'수요일':3,'목요일':4,'금요일':5,'토요일':6};
  var targetDay = dayMap[archData.riskDay] || 3;
  var today = new Date();
  var diff = targetDay - today.getDay();
  if (diff <= 0) diff += 7;
  var riskDate = new Date(today.getTime() + diff * 86400000);
  var riskDateStr = (riskDate.getMonth() + 1) + '/' + riskDate.getDate() + '(' + archData.riskDay + ')';

  return '<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"></head>'
    + '<body style="margin:0;padding:0;background:#0A0E1A;font-family:\'Apple SD Gothic Neo\',\'Malgun Gothic\',sans-serif;">'
    + '<div style="max-width:520px;margin:0 auto;padding:32px 20px;">'
    // 로고
    + '<div style="text-align:center;margin-bottom:24px;">'
    + '<div style="font-size:22px;font-weight:900;background:linear-gradient(135deg,#c9a84c,#e8d48b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:4px;">N&#xB7;KAI</div>'
    + '<p style="color:#6B7A99;font-size:10px;margin:4px 0 0;">AI &#xAE08;&#xC735; &#xD589;&#xB3D9; &#xBD84;&#xC11D;</p>'
    + '</div>'
    // 경고 배지
    + '<div style="text-align:center;margin-bottom:16px;">'
    + '<span style="display:inline-block;background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.3);color:#EF4444;font-size:10px;font-weight:900;letter-spacing:2px;padding:5px 14px;border-radius:20px;">'
    + 'SPENDING ALERT</span></div>'
    // 메인 카드
    + '<div style="background:linear-gradient(135deg,#0F1524,#0D1420);border:1px solid rgba(239,68,68,.3);border-radius:16px;padding:24px;margin-bottom:16px;text-align:center;">'
    + '<p style="color:#8A95AB;font-size:12px;margin:0 0 8px;">' + name + '&#xB2D8;&#xC758; &#xC18C;&#xBE44; &#xC704;&#xD5D8;&#xC77C;</p>'
    + '<div style="font-size:36px;font-weight:900;color:#EF4444;letter-spacing:2px;">' + riskDateStr + '</div>'
    + '<div style="color:' + elColor + ';font-size:12px;margin-top:8px;">' + arch + ' &#xB7; N-Score ' + nscore + '</div>'
    + '</div>'
    // 이유 설명
    + '<div style="background:#0F1524;border:1px solid rgba(255,255,255,.08);border-left:3px solid #EF4444;border-radius:0 12px 12px 0;padding:16px;margin-bottom:16px;">'
    + '<div style="color:#EF4444;font-size:11px;font-weight:700;letter-spacing:1px;margin-bottom:10px;">&#x26A0; &#xC65C; &#xC774; &#xB0A0;&#xC774; &#xC704;&#xD5D8;&#xD55C;&#xAC00;&#xC694;?</div>'
    + '<div style="color:#C8D0E0;font-size:13px;line-height:1.7;">' + archData.riskReason + '</div>'
    + '</div>'
    // 실행 팁
    + '<div style="background:#0F1524;border:1px solid rgba(201,168,76,.15);border-radius:12px;padding:16px;margin-bottom:20px;">'
    + '<div style="color:#c9a84c;font-size:11px;font-weight:700;letter-spacing:1px;margin-bottom:10px;">&#x1F6E1; &#xBC29;&#xC5B4; &#xC804;&#xB7B5;</div>'
    + '<div style="color:#C8D0E0;font-size:12px;line-height:1.8;">'
    + '&#x2460; ' + riskDateStr + ' &#xC804;&#xB0A0; &#xBC24;&#xC5D0; &#xB0B4;&#xC77C; &#xC608;&#xC0B0; &#xD55C;&#xB3C4;&#xB97C; &#xC801;&#xC5B4;&#xB450;&#xC138;&#xC694;<br>'
    + '&#x2461; &#xACB0;&#xC81C; &#xBC84;&#xD2BC; &#xB204;&#xB974;&#xAE30; &#xC804; 10&#xCD08;&#xB9CC; &#xBA48;&#xCD94;&#xC138;&#xC694;<br>'
    + '&#x2462; 5&#xB9CC;&#xC6D0; &#xC774;&#xC0C1; &#xC9C0;&#xCD9C;&#xC740; 24&#xC2DC;&#xAC04; &#xD6C4; &#xACB0;&#xC815;&#xD558;&#xC138;&#xC694;'
    + '</div></div>'
    // ── PDF 동일 3섹션: 산출근거 → 트리플미러 → 3대KPI
    + _buildNScoreReasonHtml(name, nscore, breakdownData)
    + _buildTripleMirrorHtml(name, arch, coreEl)
    + _build3KpiHtml(kpiData)
    // CTA
    + '<div style="text-align:center;">'
    + '<a href="https://www.neurinkairosai.com/?utm_source=drip_d3&utm_medium=email&utm_campaign=spending_alert&arch=' + arch + '" '
    + 'style="display:inline-block;background:linear-gradient(135deg,#c9a84c,#e8d48b);color:#0A0E1A;text-decoration:none;'
    + 'padding:14px 32px;border-radius:12px;font-weight:900;font-size:13px;">&#xB0B4; &#xC18C;&#xBE44; &#xD328;&#xD134; &#xC804;&#xCCB4; &#xBD84;&#xC11D; &#xBCF4;&#xAE30;</a>'
    + '</div>'
    // 푸터
    + '<p style="text-align:center;color:#3D4B66;font-size:10px;margin-top:24px;line-height:1.8;">'
    + '&#xBB34;&#xC218;&#xC2E0;: <a href="mailto:support@neurinkairosai.com" style="color:#c9a84c;">support@neurinkairosai.com</a><br>'
    + '&#xB274;&#xB9B0;&#xCE74;&#xC774;&#xB85C;&#xC2A4;&#xC5D0;&#xC774;&#xC544;&#xC774;(&#xC8FC;)</p>'
    + '</div></body></html>';
}

// ════════════════════════════════════════════════════════════════
// D+7 HTML: 돈을 잃는 패턴 TOP3
// ════════════════════════════════════════════════════════════════
function _buildDripD7Html(name, arch, nscore, coreEl, archData, energyMsg, breakdownData, kpiData) {
  var elColor = {'金':'#F0C674','木':'#22C55E','火':'#EF4444','土':'#F59E0B','水':'#2D8CFF'}[coreEl] || '#F0C674';
  var patterns = archData.losePattern || ['패턴 분석 준비 중', '패턴 분석 준비 중', '패턴 분석 준비 중'];

  var patternHtml = '';
  for (var pi = 0; pi < patterns.length; pi++) {
    var nums = ['&#x2460;', '&#x2461;', '&#x2462;'];
    patternHtml += '<div style="padding:12px 0;border-bottom:1px solid rgba(201,168,76,0.1);">'
      + '<span style="color:#c9a84c;font-weight:900;margin-right:6px;">' + nums[pi] + '</span>'
      + '<span style="color:#C8D0E0;font-size:13px;line-height:1.6;">' + patterns[pi] + '</span>'
      + '</div>';
  }

  return '<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"></head>'
    + '<body style="margin:0;padding:0;background:#0A0E1A;font-family:\'Apple SD Gothic Neo\',\'Malgun Gothic\',sans-serif;">'
    + '<div style="max-width:520px;margin:0 auto;padding:32px 20px;">'
    // 로고
    + '<div style="text-align:center;margin-bottom:24px;">'
    + '<div style="font-size:22px;font-weight:900;background:linear-gradient(135deg,#c9a84c,#e8d48b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:4px;">N&#xB7;KAI</div>'
    + '<p style="color:#6B7A99;font-size:10px;margin:4px 0 0;">AI &#xAE08;&#xC735; &#xD589;&#xB3D9; &#xBD84;&#xC11D;</p>'
    + '</div>'
    // 배지
    + '<div style="text-align:center;margin-bottom:16px;">'
    + '<span style="display:inline-block;background:rgba(201,168,76,.12);border:1px solid rgba(201,168,76,.3);color:#c9a84c;font-size:10px;font-weight:900;letter-spacing:2px;padding:5px 14px;border-radius:20px;">'
    + 'PATTERN INSIGHT</span></div>'
    // 헤더 카드
    + '<div style="background:linear-gradient(135deg,#0F1524,#0D1420);border:1px solid rgba(201,168,76,.25);border-radius:16px;padding:24px;margin-bottom:16px;text-align:center;">'
    + '<p style="color:#8A95AB;font-size:12px;margin:0 0 6px;">' + name + '&#xB2D8;&#xC758; &#xC9C0;&#xAC11;&#xC774; &#xBCF4;&#xB0B4;&#xB294; &#xC2E0;&#xD638;</p>'
    + '<div style="font-size:28px;font-weight:900;color:' + elColor + ';letter-spacing:3px;margin-bottom:4px;">' + arch + '</div>'
    + '<div style="color:#64748B;font-size:11px;">N-Score ' + nscore + ' &#xB7; ' + coreEl + ' &#xCF54;&#xC5B4;&#xC5D0;&#xB108;&#xC9C0;</div>'
    + '</div>'
    // 패턴 TOP3
    + '<div style="background:#0F1524;border:1px solid rgba(201,168,76,.15);border-top:2px solid #c9a84c;border-radius:12px;padding:18px;margin-bottom:16px;">'
    + '<div style="color:#c9a84c;font-size:11px;font-weight:700;letter-spacing:1.5px;margin-bottom:12px;">' + arch + ' &#xC720;&#xD615;&#xC774; &#xB3C8;&#xC744; &#xC783;&#xB294; &#xD328;&#xD134; TOP3</div>'
    + patternHtml
    + '</div>'
    // 코어에너지 보충 메시지
    + '<div style="background:#0F1524;border:1px solid rgba(255,255,255,.06);border-left:3px solid ' + elColor + ';border-radius:0 12px 12px 0;padding:14px;margin-bottom:16px;">'
    + '<div style="color:' + elColor + ';font-size:11px;font-weight:700;margin-bottom:8px;">' + coreEl + ' &#xCF54;&#xC5B4;&#xC5D0;&#xB108;&#xC9C0; &#xC2E0;&#xD638;</div>'
    + '<div style="color:#C8D0E0;font-size:12px;line-height:1.7;">' + energyMsg + '</div>'
    + '</div>'
    // 실행 팁
    + '<div style="background:#0F1524;border:1px solid rgba(201,168,76,.1);border-radius:12px;padding:16px;margin-bottom:20px;">'
    + '<div style="color:#c9a84c;font-size:11px;font-weight:700;letter-spacing:1px;margin-bottom:10px;">&#x1F4A1; &#xC624;&#xB298; &#xB2F9;&#xC7A5; &#xD560; &#xC218; &#xC788;&#xB294; 1&#xAC00;&#xC9C0;</div>'
    + '<div style="color:#C8D0E0;font-size:13px;line-height:1.7;">'
    + '&#xD734;&#xB300;&#xD3F0; &#xACB0;&#xC81C; &#xC571;&#xC744; &#xC5F4;&#xACE0; &#xC9C0;&#xB09C; 7&#xC77C;&#xAC04; &#xC9C0;&#xCD9C; &#xB0B4;&#xC5ED;&#xC744; &#xD655;&#xC778;&#xD558;&#xC138;&#xC694;. &#xC704; &#xD328;&#xD134; TOP3 &#xC911; &#xD558;&#xB098;&#xB77C;&#xB3C4; &#xD574;&#xB2F9;&#xB418;&#xBA74; &#xC624;&#xB298;&#xBD80;&#xD130; &#xC758;&#xC2DD;&#xD558;&#xB294; &#xAC83;&#xB9CC;&#xC73C;&#xB85C;&#xB3C4; &#xBCC0;&#xD654;&#xAC00; &#xC2DC;&#xC791;&#xB429;&#xB2C8;&#xB2E4;.'
    + '</div></div>'
    // ── PDF 동일 3섹션: 산출근거 → 트리플미러 → 3대KPI
    + _buildNScoreReasonHtml(name, nscore, breakdownData)
    + _buildTripleMirrorHtml(name, arch, coreEl)
    + _build3KpiHtml(kpiData)
    // CTA
    + '<div style="text-align:center;">'
    + '<a href="https://www.neurinkairosai.com/?utm_source=drip_d7&utm_medium=email&utm_campaign=pattern_insight&arch=' + arch + '" '
    + 'style="display:inline-block;background:linear-gradient(135deg,#c9a84c,#e8d48b);color:#0A0E1A;text-decoration:none;'
    + 'padding:14px 32px;border-radius:12px;font-weight:900;font-size:13px;">&#xB0B4; &#xC804;&#xCCB4; &#xAE08;&#xC735; &#xD328;&#xD134; &#xBD84;&#xC11D; &#xBCF4;&#xAE30;</a>'
    + '</div>'
    // 푸터
    + '<p style="text-align:center;color:#3D4B66;font-size:10px;margin-top:24px;line-height:1.8;">'
    + '&#xBB34;&#xC218;&#xC2E0;: <a href="mailto:support@neurinkairosai.com" style="color:#c9a84c;">support@neurinkairosai.com</a><br>'
    + '&#xB274;&#xB9B0;&#xCE74;&#xC774;&#xB85C;&#xC2A4;&#xC5D0;&#xC774;&#xC544;&#xC774;(&#xC8FC;)</p>'
    + '</div></body></html>';
}

// ════════════════════════════════════════════════════════════════
// D+14 HTML: 골든타임 BEST 3일
// ════════════════════════════════════════════════════════════════
function _buildDripD14Html(name, arch, nscore, coreEl, gt1, gt2, gt3, breakdownData, kpiData) {
  var elColor = {'金':'#F0C674','木':'#22C55E','火':'#EF4444','土':'#F59E0B','水':'#2D8CFF'}[coreEl] || '#F0C674';

  // 골든타임 월에서 이번 달 최적 날짜 3일 생성
  var now = new Date();
  var nowMonth = now.getMonth() + 1;
  var nowYear = now.getFullYear();

  function extractMonth(s) {
    var m = safeStr(s).match(/(\d{1,2})월/);
    return m ? parseInt(m[1]) : 0;
  }

  var gt1m = extractMonth(gt1);
  var gt2m = extractMonth(gt2);
  var gt3m = extractMonth(gt3);

  // 이번 달이 골든타임 월인지 체크 → 아니면 가장 가까운 골든타임 월 사용
  var targetMonth = nowMonth;
  var gtMonths = [gt1m, gt2m, gt3m].filter(function(m) { return m > 0; });
  var isGoldenMonth = gtMonths.indexOf(nowMonth) >= 0;

  if (!isGoldenMonth && gtMonths.length > 0) {
    // 가장 가까운 미래 골든타임 월 찾기
    var closest = gtMonths[0];
    var minDist = 999;
    for (var gi = 0; gi < gtMonths.length; gi++) {
      var d = gtMonths[gi] - nowMonth;
      if (d <= 0) d += 12;
      if (d < minDist) { minDist = d; closest = gtMonths[gi]; }
    }
    targetMonth = closest;
  }

  // N-Score 기반 시드로 날짜 3개 생성 (결정론적)
  var nSeed = parseInt(nscore) || 700;
  var daysInMonth = new Date(nowYear, targetMonth, 0).getDate();
  var day1 = Math.max(1, Math.min(daysInMonth, 7 + (nSeed % 5)));
  var day2 = Math.max(1, Math.min(daysInMonth, 14 + (nSeed % 7)));
  var day3 = Math.max(1, Math.min(daysInMonth, 22 + (nSeed % 6)));

  var goldenDates = [
    { day: targetMonth + '/' + day1, label: '&#x1F947; BEST 1', color: 'linear-gradient(135deg,#c9a84c,#e8d48b)', textColor: '#0A0E1A', desc: '&#xC7AC;&#xBB34; &#xACB0;&#xC815; &#xCD5C;&#xC801;&#xC77C; — &#xD22C;&#xC790;&#xB7;&#xC800;&#xCD95;&#xB7;&#xBCF4;&#xD5D8; &#xAC80;&#xD1A0;' },
    { day: targetMonth + '/' + day2, label: '&#x1F948; BEST 2', color: 'linear-gradient(135deg,#8A8A9A,#B0B0C0)', textColor: '#0A0E1A', desc: '&#xC815;&#xBCF4; &#xC218;&#xC9D1; &#xCD5C;&#xC801;&#xC77C; — &#xC0C1;&#xB2F4;&#xB7;&#xBE44;&#xAD50;&#xB7;&#xBD84;&#xC11D;' },
    { day: targetMonth + '/' + day3, label: '&#x1F949; BEST 3', color: 'linear-gradient(135deg,#8B6914,#C49A2A)', textColor: '#fff', desc: '&#xC2E4;&#xD589; &#xCD5C;&#xC801;&#xC77C; — &#xACC4;&#xD68D;&#xD55C; &#xC9C0;&#xCD9C; &#xC2E4;&#xD589;' }
  ];

  var datesHtml = '';
  for (var di = 0; di < goldenDates.length; di++) {
    var gd = goldenDates[di];
    datesHtml += '<div style="display:flex;align-items:center;padding:14px 0;border-bottom:1px solid rgba(201,168,76,0.08);">'
      + '<div style="flex:0 0 auto;background:' + gd.color + ';color:' + gd.textColor + ';font-weight:900;font-size:13px;padding:8px 14px;border-radius:10px;margin-right:14px;text-align:center;min-width:80px;">'
      + '<div style="font-size:10px;letter-spacing:1px;">' + gd.label + '</div>'
      + '<div style="font-size:18px;margin-top:2px;">' + gd.day + '</div></div>'
      + '<div style="color:#C8D0E0;font-size:12px;line-height:1.5;">' + gd.desc + '</div>'
      + '</div>';
  }

  // 골든타임 원본 표시
  var gtOriginal = [gt1, gt2, gt3].filter(Boolean).join(' &#xB7; ');
  if (!gtOriginal) gtOriginal = '&#xBD84;&#xC11D; &#xC900;&#xBE44; &#xC911;';

  return '<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"></head>'
    + '<body style="margin:0;padding:0;background:#0A0E1A;font-family:\'Apple SD Gothic Neo\',\'Malgun Gothic\',sans-serif;">'
    + '<div style="max-width:520px;margin:0 auto;padding:32px 20px;">'
    // 로고
    + '<div style="text-align:center;margin-bottom:24px;">'
    + '<div style="font-size:22px;font-weight:900;background:linear-gradient(135deg,#c9a84c,#e8d48b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:4px;">N&#xB7;KAI</div>'
    + '<p style="color:#6B7A99;font-size:10px;margin:4px 0 0;">AI &#xAE08;&#xC735; &#xD589;&#xB3D9; &#xBD84;&#xC11D;</p>'
    + '</div>'
    // 배지
    + '<div style="text-align:center;margin-bottom:16px;">'
    + '<span style="display:inline-block;background:rgba(201,168,76,.15);border:1px solid rgba(201,168,76,.35);color:#c9a84c;font-size:10px;font-weight:900;letter-spacing:2px;padding:5px 14px;border-radius:20px;">'
    + 'GOLDEN TIME</span></div>'
    // 헤더 카드
    + '<div style="background:linear-gradient(135deg,#0F1524,#0D1420);border:1px solid rgba(201,168,76,.35);border-radius:16px;padding:24px;margin-bottom:16px;text-align:center;">'
    + '<p style="color:#8A95AB;font-size:12px;margin:0 0 6px;">' + name + '&#xB2D8;&#xC758; &#xC774;&#xBC88; &#xB2EC; &#xACE8;&#xB4E0;&#xD0C0;&#xC784;</p>'
    + '<div style="font-size:28px;font-weight:900;background:linear-gradient(135deg,#c9a84c,#e8d48b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:2px;">BEST 3&#xC77C;</div>'
    + '<div style="color:#64748B;font-size:11px;margin-top:8px;">' + arch + ' &#xB7; N-Score ' + nscore + ' &#xB7; ' + coreEl + '</div>'
    + '</div>'
    // 골든타임 3일 리스트
    + '<div style="background:#0F1524;border:1px solid rgba(201,168,76,.15);border-radius:12px;padding:18px;margin-bottom:16px;">'
    + datesHtml
    + '</div>'
    // 연간 골든타임 참고
    + '<div style="background:#0F1524;border:1px solid rgba(255,255,255,.06);border-radius:12px;padding:14px;margin-bottom:16px;text-align:center;">'
    + '<div style="color:#64748B;font-size:10px;letter-spacing:1px;margin-bottom:6px;">&#xC5F0;&#xAC04; &#xACE8;&#xB4E0;&#xD0C0;&#xC784; BEST</div>'
    + '<div style="color:#c9a84c;font-size:14px;font-weight:700;">' + gtOriginal + '</div>'
    + '</div>'
    // 실행 팁
    + '<div style="background:#0F1524;border:1px solid rgba(201,168,76,.1);border-left:3px solid #c9a84c;border-radius:0 12px 12px 0;padding:14px;margin-bottom:20px;">'
    + '<div style="color:#c9a84c;font-size:11px;font-weight:700;margin-bottom:8px;">&#x26A1; &#xD65C;&#xC6A9; &#xD301;</div>'
    + '<div style="color:#C8D0E0;font-size:12px;line-height:1.8;">'
    + 'BEST 1&#xC77C;&#xC5D0; &#xAC00;&#xC7A5; &#xC911;&#xC694;&#xD55C; &#xC7AC;&#xBB34; &#xACB0;&#xC815;&#xC744; &#xBC30;&#xCE58;&#xD558;&#xC138;&#xC694;.<br>'
    + '&#xACE8;&#xB4E0;&#xD0C0;&#xC784;&#xC5D0; &#xB0B4;&#xB9B0; &#xACB0;&#xC815;&#xC740; N-Score&#xB97C; &#xD3C9;&#xADE0; 12&#xC810; &#xB354; &#xB192;&#xC785;&#xB2C8;&#xB2E4;.'
    + '</div></div>'
    // ── PDF 동일 3섹션: 산출근거 → 트리플미러 → 3대KPI
    + _buildNScoreReasonHtml(name, nscore, breakdownData)
    + _buildTripleMirrorHtml(name, arch, coreEl)
    + _build3KpiHtml(kpiData)
    // CTA
    + '<div style="text-align:center;">'
    + '<a href="https://www.neurinkairosai.com/?utm_source=drip_d14&utm_medium=email&utm_campaign=golden_time&arch=' + arch + '" '
    + 'style="display:inline-block;background:linear-gradient(135deg,#c9a84c,#e8d48b);color:#0A0E1A;text-decoration:none;'
    + 'padding:14px 32px;border-radius:12px;font-weight:900;font-size:13px;">&#xD480; &#xACE8;&#xB4E0;&#xD0C0;&#xC784; &#xCE98;&#xB9B0;&#xB354; &#xBCF4;&#xAE30;</a>'
    + '</div>'
    // 푸터
    + '<p style="text-align:center;color:#3D4B66;font-size:10px;margin-top:24px;line-height:1.8;">'
    + '&#xBB34;&#xC218;&#xC2E0;: <a href="mailto:support@neurinkairosai.com" style="color:#c9a84c;">support@neurinkairosai.com</a><br>'
    + '&#xB274;&#xB9B0;&#xCE74;&#xC774;&#xB85C;&#xC2A4;&#xC5D0;&#xC774;&#xC544;&#xC774;(&#xC8FC;)</p>'
    + '</div></body></html>';
}

// ════════════════════════════════════════════════════════════════
// 트리거 설치 함수 — GAS 에디터에서 1회 실행
// ════════════════════════════════════════════════════════════════
function installDripTrigger() {
  // 기존 드립 트리거 중복 제거
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'sendDripSequence') {
      ScriptApp.deleteTrigger(triggers[i]);
      Logger.log('[드립트리거] 기존 트리거 삭제');
    }
  }
  // 매일 오전 9시 자동 실행
  ScriptApp.newTrigger('sendDripSequence')
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .create();
  Logger.log('[드립트리거] 설치 완료 — 매일 오전 9시 sendDripSequence() 자동 실행');
}

// ── 테스트 함수: 특정 이메일로 D+3/D+7/D+14 강제 발송 ──
function testDripD3() {
  var archData = DRIP_ARCHETYPE_DB['ENTJ'];
  var testBreakdownData = {
    innate: JSON.stringify({ dayElement: '庚', strengthType: '신강', strengthIndex: 0.15, wealthScore: 0.35, expressionScore: 0.28, ohengScore: {木:10,火:15,土:20,金:25,水:30}, precision: 'high' }),
    kipa: JSON.stringify({ ei: 'E', ns: 'S', tf: 'T', jp: 'J', vBehavior: {EI:0.6, NS:-0.4, TF:0.7, JP:-0.3} }),
    dynamic: JSON.stringify({ vFused: {EI:0.48, NS:-0.32, TF:0.56, JP:-0.24}, archetypeCode: 'ESTJ', calibration: 'v4.0_50-35-15' }),
    bonus: JSON.stringify({ totalBonus: 78, healthScore: 35, alignmentBonus: 28, activationBonus: 15 })
  };
  var testKpiData = { kpi1: '82', kpi2: '76', kpi3: '71' };
  var html = _buildDripD3Html('이원재', 'ENTJ', '726', '金', archData, testBreakdownData, testKpiData);
  GmailApp.sendEmail('sogood2172@gmail.com',
    '[N-KAI] 이원재님, 이번 주 ' + archData.riskDay + '에 지갑 조심하세요',
    '이메일 클라이언트가 HTML을 지원하지 않습니다.',
    { htmlBody: html, name: 'N-KAI 팀', charset: 'UTF-8' });
  Logger.log('[testDripD3] 발송 완료 — breakdownData/kpiData 포함');
}

function testDripD7() {
  var archData = DRIP_ARCHETYPE_DB['ENTJ'];
  var energyMsg = DRIP_ENERGY_MSG['金'];
  var testBreakdownData = {
    innate: JSON.stringify({ dayElement: '庚', strengthType: '신강', strengthIndex: 0.15, wealthScore: 0.35, expressionScore: 0.28, ohengScore: {木:10,火:15,土:20,金:25,水:30}, precision: 'high' }),
    kipa: JSON.stringify({ ei: 'E', ns: 'S', tf: 'T', jp: 'J', vBehavior: {EI:0.6, NS:-0.4, TF:0.7, JP:-0.3} }),
    dynamic: JSON.stringify({ vFused: {EI:0.48, NS:-0.32, TF:0.56, JP:-0.24}, archetypeCode: 'ESTJ', calibration: 'v4.0_50-35-15' }),
    bonus: JSON.stringify({ totalBonus: 78, healthScore: 35, alignmentBonus: 28, activationBonus: 15 })
  };
  var testKpiData = { kpi1: '82', kpi2: '76', kpi3: '71' };
  var html = _buildDripD7Html('이원재', 'ENTJ', '726', '金', archData, energyMsg, testBreakdownData, testKpiData);
  GmailApp.sendEmail('sogood2172@gmail.com',
    '[N-KAI] 이원재님의 지갑이 보내는 신호',
    '이메일 클라이언트가 HTML을 지원하지 않습니다.',
    { htmlBody: html, name: 'N-KAI 팀', charset: 'UTF-8' });
  Logger.log('[testDripD7] 발송 완료 — breakdownData/kpiData 포함');
}

function testDripD14() {
  var testBreakdownData = {
    innate: JSON.stringify({ dayElement: '庚', strengthType: '신강', strengthIndex: 0.15, wealthScore: 0.35, expressionScore: 0.28, ohengScore: {木:10,火:15,土:20,金:25,水:30}, precision: 'high' }),
    kipa: JSON.stringify({ ei: 'E', ns: 'S', tf: 'T', jp: 'J', vBehavior: {EI:0.6, NS:-0.4, TF:0.7, JP:-0.3} }),
    dynamic: JSON.stringify({ vFused: {EI:0.48, NS:-0.32, TF:0.56, JP:-0.24}, archetypeCode: 'ESTJ', calibration: 'v4.0_50-35-15' }),
    bonus: JSON.stringify({ totalBonus: 78, healthScore: 35, alignmentBonus: 28, activationBonus: 15 })
  };
  var testKpiData = { kpi1: '82', kpi2: '76', kpi3: '71' };
  var html = _buildDripD14Html('이원재', 'ENTJ', '726', '金', '7월', '9월', '11월', testBreakdownData, testKpiData);
  GmailApp.sendEmail('sogood2172@gmail.com',
    '[N-KAI] 이원재님의 이번 달 골든타임은 딱 3일',
    '이메일 클라이언트가 HTML을 지원하지 않습니다.',
    { htmlBody: html, name: 'N-KAI 팀', charset: 'UTF-8' });
  Logger.log('[testDripD14] 발송 완료 — breakdownData/kpiData 포함');
}

// ════════════════════════════════════════════════════════════════
// PART 11 — 5명 자동 재발송 (breakdown 데이터 감지 후 PDF 재발송)
// ════════════════════════════════════════════════════════════════

// ★ 대상 5명의 분석데이터에 breakdown_innate가 존재하면 자동 PDF 재발송
// PDF발송로그에 'AUTORESEND-' 접두사로 이미 발송 여부를 체크하여 중복 방지
function autoResendOnAnalysis() {
  var targetEmails = [
    'himunog1178@naver.com',   // 박문옥
    'machaii8001@naver.com',   // 최재민
    'hyundocho@daum.net',      // 조현도
    'leejmcal@naver.com',      // 이장명
    'kjcpine@naver.com'        // 김준진
  ];

  // ═══ autoresend_done 컬럼 기반 중복 방지 (v2.0) ═══
  // index 45 = breakdown_innate, index 49 = autoresend_done
  var COL_BREAKDOWN = 45;
  var COL_AUTORESEND = 49;

  try {
    var ss = getLogSpreadsheet();
    var anaSheet = ss.getSheetByName('분석데이터');
    if (!anaSheet) { Logger.log('[autoResend] 분석데이터 시트 없음'); return; }
    var anaRows = anaSheet.getDataRange().getValues();
    var resendCount = 0;

    for (var ti = 0; ti < targetEmails.length; ti++) {
      var tEmail = targetEmails[ti];

      // 분석데이터에서 해당 이메일의 최신 행 찾기 (역순 검색)
      var foundRow = -1;
      for (var ai = anaRows.length - 1; ai >= 1; ai--) {
        if (safeStr(anaRows[ai][2]) === tEmail) {
          foundRow = ai;
          break;
        }
      }

      if (foundRow === -1) {
        Logger.log('[autoResend] 분석데이터에 미존재 스킵: ' + tEmail);
        continue;
      }

      // 조건 1: autoresend_done = "Y" 이면 절대 스킵
      var doneFlag = safeStr(anaRows[foundRow][COL_AUTORESEND] || '');
      if (doneFlag === 'Y') {
        Logger.log('[autoResend] autoresend_done=Y 스킵: ' + tEmail);
        continue;
      }

      // 조건 2: breakdown_innate 없으면 스킵
      var hasBreakdown = safeStr(anaRows[foundRow][COL_BREAKDOWN] || '');
      if (!hasBreakdown) {
        Logger.log('[autoResend] breakdown 미존재 스킵: ' + tEmail);
        continue;
      }

      // 두 조건 모두 통과 → 재발송
      Logger.log('[autoResend] breakdown 감지 + 미발송 → 재발송 시작: ' + tEmail);
      try {
        forceSendPdfByEmail(tEmail);
        resendCount++;

        // 발송 성공 → autoresend_done = "Y" 기록 (행: foundRow+1, 열: COL_AUTORESEND+1)
        anaSheet.getRange(foundRow + 1, COL_AUTORESEND + 1).setValue('Y');
        Logger.log('[autoResend] autoresend_done=Y 기록 완료: ' + tEmail + ' (행 ' + (foundRow + 1) + ')');

        Utilities.sleep(2000); // 발송 간격 2초
      } catch (sendErr) {
        Logger.log('[autoResend] 발송 오류: ' + tEmail + ' — ' + sendErr.toString());
      }
    }

    Logger.log('[autoResend] 완료 — 재발송: ' + resendCount + '건');
  } catch (e) {
    Logger.log('[autoResend] 전체 오류: ' + e.toString());
  }
}

// ★ autoResendOnAnalysis 트리거 즉시 삭제 (GAS 에디터에서 1회 실행)
function deleteAutoResendTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'autoResendOnAnalysis') {
      ScriptApp.deleteTrigger(triggers[i]);
      Logger.log('트리거 삭제 완료');
    }
  }
  Logger.log('완료');
}

// ★ 30분마다 자동 실행 트리거 설치 (GAS 에디터에서 1회 실행)
function installAutoResendTrigger() {
  // 기존 동일 트리거 제거 (중복 방지)
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'autoResendOnAnalysis') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  ScriptApp.newTrigger('autoResendOnAnalysis')
    .timeBased()
    .everyMinutes(30)
    .create();
  Logger.log('[installAutoResendTrigger] 30분 트리거 설치 완료');
}

// ════════════════════════════════════════════════════════════════
// END PART 11
// ════════════════════════════════════════════════════════════════
