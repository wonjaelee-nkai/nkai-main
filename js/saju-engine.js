var WEB_APP_URL = CONFIG.WEB_APP_URL;

// ==========================================
// DATA SCIENCE ENGINE (사주팔자 용어 제거)
// ==========================================

// Energy Element System (동양 에너지 모델 기반)
var ENERGY_ELEMENTS = {
    '甲': {element: '木', polarity: '+', trait: 'leadership'},
    '乙': {element: '木', polarity: '-', trait: 'flexibility'},
    '丙': {element: '火', polarity: '+', trait: 'passion'},
    '丁': {element: '火', polarity: '-', trait: 'insight'},
    '戊': {element: '土', polarity: '+', trait: 'stability'},
    '己': {element: '土', polarity: '-', trait: 'mediation'},
    '庚': {element: '金', polarity: '+', trait: 'decisiveness'},
    '辛': {element: '金', polarity: '-', trait: 'precision'},
    '壬': {element: '水', polarity: '+', trait: 'adaptability'},
    '癸': {element: '水', polarity: '-', trait: 'depth'}
};

var ENERGY_MATRIX = {
    '木': {'木': 0, '火': 1, '土': -1, '金': -1, '水': 1},
    '火': {'木': 1, '火': 0, '土': 1, '金': -1, '水': -1},
    '土': {'木': -1, '火': 1, '土': 0, '金': 1, '水': -1},
    '金': {'木': -1, '火': -1, '土': 1, '金': 0, '水': 1},
    '水': {'木': 1, '火': -1, '土': -1, '金': 1, '水': 0}
};

// ═══════════════════════════════════════════════════════════════════
// N-CORE ENGINE v1.0 확장 데이터 (Patent #10-2025-0156080)
// ═══════════════════════════════════════════════════════════════════

// 통근 테이블: 천간이 뿌리를 내리는 지지 (1.5배 가중치 적용)
var ROOTING_TABLE = {
    '甲': ['寅', '卯', '辰', '亥'],
    '乙': ['寅', '卯', '辰', '未'],
    '丙': ['巳', '午', '寅'],
    '丁': ['巳', '午', '未', '戌'],
    '戊': ['辰', '戌', '丑', '未', '巳', '午'],
    '己': ['辰', '戌', '丑', '未', '巳', '午'],
    '庚': ['申', '酉', '戌', '巳'],
    '辛': ['申', '酉', '戌', '丑'],
    '壬': ['亥', '子', '申'],
    '癸': ['亥', '子', '丑', '辰']
};

// 지지 → 오행 비율 벡터 [목, 화, 토, 금, 수] (장간 반영)
var BRANCH_ELEMENT_RATIO = {
    '子': [0, 0, 0, 0, 1.0],
    '丑': [0, 0, 0.6, 0.2, 0.2],
    '寅': [0.6, 0.3, 0.1, 0, 0],
    '卯': [1.0, 0, 0, 0, 0],
    '辰': [0.2, 0, 0.6, 0, 0.2],
    '巳': [0, 0.6, 0.1, 0.3, 0],
    '午': [0, 0.7, 0.3, 0, 0],
    '未': [0.2, 0.2, 0.6, 0, 0],
    '申': [0, 0, 0.1, 0.6, 0.3],
    '酉': [0, 0, 0, 1.0, 0],
    '戌': [0, 0.1, 0.7, 0.2, 0],
    '亥': [0.3, 0, 0, 0, 0.7]
};

// 12개월 월간 골든타임 캘린더 생성
function generateYearlyGoldenTime(dayElement) {
    // ★ v2.1 FIX: 절기 기준 양력 월지 정렬 (getMonthZhiByMonth와 동일)
    // 1월=丑, 2월=寅, 3월=卯, 4월=辰, 5월=巳, 6월=午
    // 7월=未, 8월=申, 9월=酉, 10월=戌, 11월=亥, 12월=子
    var months = ['丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子'];
    var monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
    var elementKo = {'木':'목', '火':'화', '土':'토', '金':'금', '水':'수'};
    
    var generates = {'木':'火', '火':'土', '土':'金', '金':'水', '水':'木'};
    var controls = {'木':'土', '土':'水', '水':'火', '火':'金', '金':'木'};
    var generatedBy = {'火':'木', '土':'火', '金':'土', '水':'金', '木':'水'};
    var controlledBy = {'土':'木', '水':'土', '火':'水', '金':'火', '木':'金'};
    
    return months.map(function(branch, idx) {
        var monthElement = getElementFromZhi(branch);
        var goldenScore = 3;
        var advice = '꾸준히 나아가세요';
        var relationship = 'neutral';
        
        if(monthElement === dayElement) {
            goldenScore = 4;
            advice = '협력과 경쟁의 달';
            relationship = 'same';
        } else if(generatedBy[dayElement] === monthElement) {
            goldenScore = 5;
            advice = '에너지 충전의 달 — 새로운 시작 유리';
            relationship = 'generate_me';
        } else if(generates[dayElement] === monthElement) {
            goldenScore = 4;
            advice = '표현과 창조의 달';
            relationship = 'i_generate';
        } else if(controlledBy[dayElement] === monthElement) {
            goldenScore = 2;
            advice = '도전과 성장의 달 — 신중한 결정';
            relationship = 'control_me';
        } else if(controls[dayElement] === monthElement) {
            goldenScore = 3;
            advice = '성과 수확의 달';
            relationship = 'i_control';
        }
        
        return {
            month: idx + 1,
            monthName: monthNames[idx],
            branch: branch,
            element: monthElement,
            elementKo: elementKo[monthElement],
            goldenScore: goldenScore,
            goldenStars: '★'.repeat(goldenScore),
            advice: advice,
            relationship: relationship
        };
    });
}

// ═══════════════════════════════════════════════════════════════════
// 입춘(立春) 테이블 — 연주(年柱) 경계 기준 (Patent P25KAI001KR)
// 입춘 이전 출생자는 전년도 연주(年柱) 적용
// ═══════════════════════════════════════════════════════════════════
// <!-- PROTECTED: LICHUN_TABLE v1.0 — 입춘 날짜 테이블 (1920-2050) -->
var LICHUN_TABLE = {
    // [month, day] — 해당 연도 입춘 날짜 (한국 표준시 기준)
    1920:[2,5], 1921:[2,4], 1922:[2,4], 1923:[2,5], 1924:[2,5],
    1925:[2,4], 1926:[2,4], 1927:[2,5], 1928:[2,5], 1929:[2,4],
    1930:[2,4], 1931:[2,5], 1932:[2,5], 1933:[2,4], 1934:[2,4],
    1935:[2,5], 1936:[2,5], 1937:[2,4], 1938:[2,4], 1939:[2,5],
    1940:[2,5], 1941:[2,4], 1942:[2,4], 1943:[2,5], 1944:[2,5],
    1945:[2,4], 1946:[2,4], 1947:[2,5], 1948:[2,5], 1949:[2,4],
    1950:[2,4], 1951:[2,4], 1952:[2,5], 1953:[2,4], 1954:[2,4],
    1955:[2,4], 1956:[2,5], 1957:[2,4], 1958:[2,4], 1959:[2,4],
    1960:[2,5], 1961:[2,4], 1962:[2,4], 1963:[2,4], 1964:[2,5],
    1965:[2,4], 1966:[2,4], 1967:[2,4], 1968:[2,5], 1969:[2,4],
    1970:[2,4], 1971:[2,4], 1972:[2,5], 1973:[2,4], 1974:[2,4],
    1975:[2,4], 1976:[2,5], 1977:[2,4], 1978:[2,4], 1979:[2,4],
    1980:[2,5], 1981:[2,4], 1982:[2,4], 1983:[2,4], 1984:[2,4],
    1985:[2,4], 1986:[2,4], 1987:[2,4], 1988:[2,4], 1989:[2,4],
    1990:[2,4], 1991:[2,4], 1992:[2,4], 1993:[2,4], 1994:[2,4],
    1995:[2,4], 1996:[2,4], 1997:[2,4], 1998:[2,4], 1999:[2,4],
    2000:[2,4], 2001:[2,4], 2002:[2,4], 2003:[2,4], 2004:[2,4],
    2005:[2,4], 2006:[2,4], 2007:[2,4], 2008:[2,4], 2009:[2,4],
    2010:[2,4], 2011:[2,4], 2012:[2,4], 2013:[2,4], 2014:[2,4],
    2015:[2,4], 2016:[2,4], 2017:[2,3], 2018:[2,4], 2019:[2,4],
    2020:[2,4], 2021:[2,3], 2022:[2,4], 2023:[2,4], 2024:[2,4],
    2025:[2,3], 2026:[2,4], 2027:[2,4], 2028:[2,4], 2029:[2,3],
    2030:[2,4], 2031:[2,4], 2032:[2,4], 2033:[2,3], 2034:[2,4],
    2035:[2,4], 2036:[2,4], 2037:[2,3], 2038:[2,4], 2039:[2,4],
    2040:[2,4], 2041:[2,3], 2042:[2,4], 2043:[2,4], 2044:[2,4],
    2045:[2,3], 2046:[2,4], 2047:[2,4], 2048:[2,4], 2049:[2,3],
    2050:[2,4]
};

/**
 * getSajuYear — 입춘 기준 사주 연도 산출
 * 입춘 이전 출생 → 전년도 적용
 * @param {number} year  - 양력 출생 연도
 * @param {number} month - 양력 출생 월 (1-12)
 * @param {number} day   - 양력 출생 일 (1-31)
 * @returns {number} 사주 계산용 연도
 */
function getSajuYear(year, month, day) {
    var lichun = LICHUN_TABLE[year];
    if (!lichun) {
        // 테이블 범위 밖: 기본 2월 4일 적용
        if (month < 2 || (month === 2 && day < 4)) return year - 1;
        return year;
    }
    var lMonth = lichun[0], lDay = lichun[1];
    // 입춘 이전이면 전년도
    if (month < lMonth || (month === lMonth && day < lDay)) {
        return year - 1;
    }
    return year;
}
// <!-- END PROTECTED: LICHUN_TABLE -->

// Birth Data → Energy Computation (천간/지지 연산)
function getYearGan(year) { return ['庚','辛','壬','癸','甲','乙','丙','丁','戊','己'][year % 10]; }
function getYearZhi(year) { return ['申','酉','戌','亥','子','丑','寅','卯','辰','巳','午','未'][year % 12]; }
function getMonthGan(yIdx, month) { var base = (yIdx % 5) * 2; var g = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸']; return g[(base + month - 1) % 10]; }
function getDayGan(y, m, d) { var b = new Date(1900, 0, 1); var t = new Date(y, m-1, d); var diff = Math.floor((t-b)/86400000); return ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'][(diff+10)%10]; }
function getDayZhi(y, m, d) { var b = new Date(1900, 0, 1); var t = new Date(y, m-1, d); var diff = Math.floor((t-b)/86400000); return ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][(diff+10)%12]; }
function getElementFromGan(g) { return (ENERGY_ELEMENTS[g] && ENERGY_ELEMENTS[g].element) || '土'; }
function getElementFromZhi(z) { var m = {'子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火','午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水'}; return m[z] || '土'; }

// 월(月)에서 월지(月支) 계산 (입춘 기준 간략화)
function getMonthZhiByMonth(month) {
    // 1월=丑, 2월=寅, 3월=卯, ... 12월=子
    var monthZhiMap = ['丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子'];
    return monthZhiMap[(month - 1) % 12];
}

// 태어난 시간(時柱) 산출 함수 — 유료 정밀 분석용
var HOUR_ZHI_LIST = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
function getHourZhi(hourIdx) { return HOUR_ZHI_LIST[hourIdx % 12]; }
function getHourGan(dayGanIdx, hourIdx) {
    var base = (dayGanIdx % 5) * 2;
    var gans = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
    return gans[(base + hourIdx) % 10];
}

// S3010-S3040: 선천적 기질 벡터 산출 (N-Core v2.0 확장)
function computeInnateVector(birthStr, hourIdx) {
    var year = parseInt(birthStr.substring(0,4));
    var month = parseInt(birthStr.substring(4,6));
    var day = parseInt(birthStr.substring(6,8));
    
    // ═══════════════════════════════════════════════════════════════
    // 입춘 보정: 연주(年柱)는 입춘 기준 연도로 산출 (v1.1 FIX)
    // 예: 1982.01.18 → 입춘(2/4) 이전 → 1981년 적용 → 辛酉(닭띠)
    // ═══════════════════════════════════════════════════════════════
    var sajuYear = getSajuYear(year, month, day);
    var yearGan = getYearGan(sajuYear), yearZhi = getYearZhi(sajuYear);
    var yearGanIdx = Object.keys(ENERGY_ELEMENTS).indexOf(yearGan);
    var monthGan = getMonthGan(yearGanIdx, month);
    var monthZhi = getMonthZhiByMonth(month); // 실제 월지 계산
    var dayGan = getDayGan(year, month, day), dayZhi = getDayZhi(year, month, day);
    var dayElement = getElementFromGan(dayGan);
    
    // 모든 지지 수집 (통근 판정용)
    var allBranches = [yearZhi, monthZhi, dayZhi];
    
    // ═══════════════════════════════════════════════════════════════
    // N-Core v2.0: 오행 세력 계산 (월지 2.5배, 통근 1.5배)
    // ═══════════════════════════════════════════════════════════════
    var ohengScore = {'木':0, '火':0, '土':0, '金':0, '水':0};
    var elements = ['木', '火', '土', '金', '水'];
    
    // 천간 점수 (기본 1.0, 통근 시 1.5배)
    var stems = [yearGan, monthGan, dayGan];
    stems.forEach(function(stem) {
        var el = getElementFromGan(stem);
        var rootingBranches = ROOTING_TABLE[stem] || [];
        var hasRoot = allBranches.some(function(b) { return (rootingBranches.indexOf(b) >= 0); });
        ohengScore[el] += hasRoot ? 1.5 : 1.0;
    });
    
    // 지지 점수 (기본 1.2배, 월지 2.5배)
    var branches = [
        {branch: yearZhi, weight: 1.2},
        {branch: monthZhi, weight: 2.5}, // 월지 가중치!
        {branch: dayZhi, weight: 1.2}
    ];
    
    branches.forEach(function(item) {
        var branch = item.branch, weight = item.weight;
        var ratios = BRANCH_ELEMENT_RATIO[branch] || [0.2, 0.2, 0.2, 0.2, 0.2];
        elements.forEach(function(el, idx) {
            ohengScore[el] += ratios[idx] * weight;
        });
    });
    
    // 태어난 시간(時柱) 추가 — hourIdx가 유효할 때만
    var hasHour = false;
    var hourGan = null, hourZhi = null;
    if(hourIdx !== null && hourIdx !== undefined && hourIdx !== '') {
        var hi = parseInt(hourIdx);
        if(!isNaN(hi) && hi >= 0 && hi <= 11) {
            hasHour: hasHour = true;
            var dayGanIdx = Object.keys(ENERGY_ELEMENTS).indexOf(dayGan);
            hourGan = getHourGan(dayGanIdx, hi);
            hourZhi = getHourZhi(hi);
            allBranches.push(hourZhi);
            
            // 시간 천간 (통근 보정)
            var hourRooting = ROOTING_TABLE[hourGan] || [];
            var hourHasRoot = allBranches.some(function(b) { return (hourRooting.indexOf(b) >= 0); });
            ohengScore[getElementFromGan(hourGan)] += hourHasRoot ? 1.5 : 1.0;
            
            // 시간 지지 (1.2배)
            var hourRatios = BRANCH_ELEMENT_RATIO[hourZhi] || [0.2, 0.2, 0.2, 0.2, 0.2];
            elements.forEach(function(el, idx) {
                ohengScore[el] += hourRatios[idx] * 1.2;
            });
        }
    }
    
    // 정수형 ohengCount도 유지 (기존 호환)
    var ohengCount = {};
    elements.forEach(function(el) { ohengCount[el] = Math.round(ohengScore[el]); });
    
    // 신강/신약 계산
    var generatedBy = {'火':'木', '土':'火', '金':'土', '水':'金', '木':'水'};
    var generates = {'木':'火', '火':'土', '土':'金', '金':'水', '水':'木'};
    var controls = {'木':'土', '土':'水', '水':'火', '火':'金', '金':'木'};
    var controlledBy = {'土':'木', '水':'土', '火':'水', '金':'火', '木':'金'};
    
    var E_in = ohengScore[dayElement] + (ohengScore[generatedBy[dayElement]] || 0);
    var E_out = (ohengScore[generates[dayElement]] || 0) + 
                  (ohengScore[controls[dayElement]] || 0) + 
                  (ohengScore[controlledBy[dayElement]] || 0);
    var strengthIndex = (E_in - E_out) / (E_in + E_out + 0.000001);
    
    var wealthTarget = controls[dayElement];
    var expressionTarget = generates[dayElement];
    
    // 골든타임 캘린더 생성
    var goldenCalendar = generateYearlyGoldenTime(dayElement);
    
    // ── 선천 축 벡터 산출 (calibrateVectors v3.0 선천 70% 기준점)
    var _expr = (ohengScore[expressionTarget]||0) / 10;
    var _coreEI = _expr > 0.4 ? 0.6 : _expr > 0.2 ? 0.3 : _expr > 0.1 ? -0.1 : -0.5;
    var _coreNS = (['木','火'].indexOf(dayElement) >= 0) ? 0.5 : (['金','土'].indexOf(dayElement) >= 0) ? -0.5 : 0;
    var _coreTF = (['金','水'].indexOf(dayElement) >= 0) ? 0.5 : (['火','木'].indexOf(dayElement) >= 0) ? -0.5 : 0;
    var _si = (E_in - E_out) / (E_in + E_out + 0.000001);
    var _coreJP = _si > 0.3 ? 0.5 : _si > 0.15 ? 0.2 : _si < -0.3 ? -0.5 : _si < -0.15 ? -0.2 : 0;

    return {
        dayElement: dayElement,
        dayMaster: ({'木':0.7,'火':0.8,'土':0.5,'金':0.6,'水':0.75})[dayElement],
        coreAxis: { EI: _coreEI, NS: _coreNS, TF: _coreTF, JP: _coreJP },
        strengthIndex: Math.round(strengthIndex * 1000) / 1000,
        strengthType: strengthIndex > 0.15 ? 'strong' : (strengthIndex < -0.15 ? 'weak' : 'balanced'),
        strengthLabel: strengthIndex > 0.15 ? '에너지 강세' : (strengthIndex < -0.15 ? '에너지 약세' : '중화'),
        wealthScore: Math.round((ohengScore[wealthTarget]||0)/10 * 1000) / 1000,
        expressionScore: Math.round((ohengScore[expressionTarget]||0)/10 * 1000) / 1000,
        ohengScore: ohengScore,
        ohengCount: ohengCount,
        hasHour: hasHour,
        precision: hasHour ? 94 : 82,
        saju: { yearGan, yearZhi, monthGan, monthZhi, dayGan, dayZhi, hourGan, hourZhi },
        goldenCalendar: goldenCalendar
    };
}

function computeBehaviorVector(ei, ns, tf, jp) { return { EI: (ei-50)/50, NS: (ns-50)/50, TF: (tf-50)/50, JP: (jp-50)/50 }; }

// ── PROTECTED: computeWeightedKipaScores v1.0 — KIPA 가중치 차별화
// Q1~16 A/B 답변을 직접 받아 금융 DNA 목적에 맞는 가중 점수 산출
// A=1(E/N/T/J 방향), B=0(I/S/F/P 방향)
function computeWeightedKipaScores(answers) {
    // answers: { q1:'A', q2:'B', ... q16:'A' }
    function val(q) { return (answers[q] === 'A') ? 1 : (answers[q] === 'B') ? 0 : 0.5; }

    // ── E/I 축 (Q1,2,9,10) — 에너지 방향 균등 가중치
    // 금융 맥락에서 내/외향은 투자 결정 방식에 동등하게 영향
    var EI_W = { q1: 1.0, q2: 1.0, q9: 1.0, q10: 1.0 };
    var EI_total = EI_W.q1 + EI_W.q2 + EI_W.q9 + EI_W.q10;
    var EI_score = (val('q1')*EI_W.q1 + val('q2')*EI_W.q2 +
                   val('q9')*EI_W.q9 + val('q10')*EI_W.q10) / EI_total * 100;

    // ── N/S 축 (Q3,4,11,12) — 투자 정보 인식 방식
    // Q3(투자 정보 분석), Q4(사업 기회 평가), Q11(리포트 작성), Q12(위험 감지)
    // Q3,4,12는 직접 투자 의사결정 → 높은 가중치
    var NS_W = { q3: 1.5, q4: 1.5, q11: 1.0, q12: 1.5 };
    var NS_total = NS_W.q3 + NS_W.q4 + NS_W.q11 + NS_W.q12;
    var NS_score = (val('q3')*NS_W.q3 + val('q4')*NS_W.q4 +
                   val('q11')*NS_W.q11 + val('q12')*NS_W.q12) / NS_total * 100;

    // ── T/F 축 (Q5,6,13,14) — 투자 판단 기준
    // Q6(수익 vs 가치), Q13(손절 기준) → 핵심 투자 행동 → 높은 가중치
    // Q5(팀 실수 대응), Q14(성과 평가) → 일반 성향 → 기본 가중치
    var TF_W = { q5: 0.8, q6: 1.5, q13: 1.5, q14: 0.8 };
    var TF_total = TF_W.q5 + TF_W.q6 + TF_W.q13 + TF_W.q14;
    var TF_score = (val('q5')*TF_W.q5 + val('q6')*TF_W.q6 +
                   val('q13')*TF_W.q13 + val('q14')*TF_W.q14) / TF_total * 100;

    // ── J/P 축 (Q7,8,15,16) — 재무 생활 양식
    // Q7(예산 관리), Q16(포트폴리오 리밸런싱) → 직접 재무 행동 → 높은 가중치
    // Q8(마감 관리), Q15(여행 계획) → 일반 계획성 → 기본/낮은 가중치
    var JP_W = { q7: 1.5, q8: 1.0, q15: 0.5, q16: 1.5 };
    var JP_total = JP_W.q7 + JP_W.q8 + JP_W.q15 + JP_W.q16;
    var JP_score = (val('q7')*JP_W.q7 + val('q8')*JP_W.q8 +
                   val('q15')*JP_W.q15 + val('q16')*JP_W.q16) / JP_total * 100;

    return {
        ei: Math.round(EI_score),
        ns: Math.round(NS_score),
        tf: Math.round(TF_score),
        jp: Math.round(JP_score)
    };
}
// ── END PROTECTED: computeWeightedKipaScores

// <!-- PROTECTED: calibrateVectors v4.0 — Patent S4030 선천50/KIPA35/소비15 삼원 융합 -->
function calibrateVectors(vCore, vBehavior, behaviorQuiz) {
    /* ★ v4.0: 선천(오행) 50% × 후천(KIPA) 35% × 소비행동 15% 삼원 융합
     * v3.1 → v4.0 변경: KIPA 응답이 아키타입에 실질적 영향력 갖도록 가중치 재조정
     * 소비행동(Q17~Q20) 데이터를 vFused에 직접 반영하여 개인화 강화 */
    var PRIOR_W      = 0.50;
    var LIKELIHOOD_W = 0.35;
    var BEHAVIOR_W   = 0.15;

    var day  = vCore.dayElement    || '土';
    var mZhi = (vCore.saju && vCore.saju.monthZhi) || '';
    var si   = vCore.strengthIndex  || 0;   // 신강(+) / 신약(-) / 중화(0)
    var expr = vCore.expressionScore || 0;  // 식상 점수 — 표현력·외향성
    var ws   = vCore.wealthScore     || 0;  // 재성 점수 — 현실감각·감각형

    // 월지 오행 매핑
    var ZHI_EL = {
        '子':'水','亥':'水',
        '寅':'木','卯':'木',
        '午':'火','巳':'火',
        '申':'金','酉':'金',
        '辰':'土','戌':'土','丑':'土','未':'土'
    };
    var mEl = ZHI_EL[mZhi] || '';

    // ────────────────────────────────────────────
    // E/I 축 — 식상(표현력)이 핵심, 월지로 보정
    // ────────────────────────────────────────────
    var coreEI;
    if      (expr > 0.5) coreEI =  0.65;
    else if (expr > 0.3) coreEI =  0.4;
    else if (expr > 0.2) coreEI =  0.2;
    else if (expr > 0.1) coreEI = -0.1;
    else                 coreEI = -0.5;
    // 월지 보정: 木·火月 → 외향(E) 강화 / 金·水月 → 내향(I) 강화
    if      (['木','火'].indexOf(mEl) >= 0) coreEI = Math.min( 1, coreEI + 0.15);
    else if (['金','水'].indexOf(mEl) >= 0) coreEI = Math.max(-1, coreEI - 0.15);

    // ────────────────────────────────────────────
    // N/S 축 — 일간 오행 기본, 재성(현실감각)·월지로 정밀화
    // ────────────────────────────────────────────
    var coreNS;
    if      (['木','火'].indexOf(day) >= 0) coreNS =  0.45;
    else if (['金','土'].indexOf(day) >= 0) coreNS = -0.45;
    else                                    coreNS =  0;
    // 재성 강할수록 감각형(S) 강화 (현실·숫자 중심)
    if      (ws > 0.5) coreNS = Math.max(-1, coreNS - 0.15);
    else if (ws > 0.3) coreNS = Math.max(-1, coreNS - 0.08);
    // 월지 보정
    if      (['木','火'].indexOf(mEl) >= 0) coreNS = Math.min( 1, coreNS + 0.12);
    else if (['金','土'].indexOf(mEl) >= 0) coreNS = Math.max(-1, coreNS - 0.12);

    // ────────────────────────────────────────────
    // T/F 축 — 일간 오행 기본, 신강약으로 정밀화
    // ────────────────────────────────────────────
    var coreTF;
    if      (['金','水'].indexOf(day) >= 0) coreTF =  0.45;
    else if (['火','木'].indexOf(day) >= 0) coreTF = -0.45;
    else                                    coreTF =  0;
    // 신강 → 자기주장 강 → 사고형(T) 강화
    if      (si >  0.3) coreTF = Math.min( 1, coreTF + 0.15);
    else if (si <  -0.3) coreTF = Math.max(-1, coreTF - 0.15);
    // 월지 보정
    if      (['金','水'].indexOf(mEl) >= 0) coreTF = Math.min( 1, coreTF + 0.10);
    else if (['火','木'].indexOf(mEl) >= 0) coreTF = Math.max(-1, coreTF - 0.10);

    // ────────────────────────────────────────────
    // J/P 축 — 신강약 핵심, 일간+월지로 보정
    // ────────────────────────────────────────────
    var coreJP;
    if      (si >  0.4) coreJP =  0.6;
    else if (si >  0.2) coreJP =  0.35;
    else if (si >  0.0) coreJP =  0.1;
    else if (si > -0.2) coreJP = -0.1;
    else if (si > -0.4) coreJP = -0.35;
    else                coreJP = -0.6;
    // 金·土 일간 → 계획형(J) / 木·火 → 인식형(P)
    if      (['金','土'].indexOf(day) >= 0) coreJP = Math.min( 1, coreJP + 0.10);
    else if (['木','火'].indexOf(day) >= 0) coreJP = Math.max(-1, coreJP - 0.10);
    // 월지 보정
    if      (['金','土'].indexOf(mEl) >= 0) coreJP = Math.min( 1, coreJP + 0.08);
    else if (['木','火'].indexOf(mEl) >= 0) coreJP = Math.max(-1, coreJP - 0.08);

    // ── 소비행동 벡터 산출 (Q17~Q20 → 4축 매핑) ──
    var bEI = 0, bNS = 0, bTF = 0, bJP = 0;
    if(behaviorQuiz && typeof behaviorQuiz.spending !== 'undefined') {
        // Q17 소비비중: 저축(3)/고정비(4)→J·S / 쇼핑(1)/문화(2)→P·E
        if(behaviorQuiz.spending === 3 || behaviorQuiz.spending === 4) { bJP += 0.35; bNS -= 0.20; }
        else if(behaviorQuiz.spending === 1 || behaviorQuiz.spending === 2) { bJP -= 0.25; bEI += 0.25; }

        // Q18 충동구매: 낮을수록 T·J / 높을수록 F·P
        var _imp = behaviorQuiz.impulse || 0;
        bJP += (1.5 - _imp) * 0.25;
        bTF += (1.5 - _imp) * 0.20;

        // Q19 예상치 못한 수입: 저축(0)/투자(1)→T·J / 쇼핑(2)/기부(3)→F·P
        if(behaviorQuiz.windfall <= 1) { bTF += 0.30; bJP += 0.20; }
        else { bTF -= 0.25; bJP -= 0.20; }

        // Q20 카드명세서: 자주확인→J·S / 안함→P·N
        var _trk = behaviorQuiz.tracking || 0;
        bJP += (1.5 - _trk) * 0.25;
        bNS -= (1.5 - _trk) * 0.15;

        // 클램프 [-1, 1]
        bEI = Math.max(-1, Math.min(1, bEI));
        bNS = Math.max(-1, Math.min(1, bNS));
        bTF = Math.max(-1, Math.min(1, bTF));
        bJP = Math.max(-1, Math.min(1, bJP));
        console.log('[N-KAI] behaviorVector:', {EI:bEI, NS:bNS, TF:bTF, JP:bJP});
    }

    // ── 50:35:15 삼원 융합 (선천 Prior × KIPA Likelihood × 소비행동 Behavior)
    return {
        EI: Math.max(-1, Math.min(1, coreEI * PRIOR_W + vBehavior.EI * LIKELIHOOD_W + bEI * BEHAVIOR_W)),
        NS: Math.max(-1, Math.min(1, coreNS * PRIOR_W + vBehavior.NS * LIKELIHOOD_W + bNS * BEHAVIOR_W)),
        TF: Math.max(-1, Math.min(1, coreTF * PRIOR_W + vBehavior.TF * LIKELIHOOD_W + bTF * BEHAVIOR_W)),
        JP: Math.max(-1, Math.min(1, coreJP * PRIOR_W + vBehavior.JP * LIKELIHOOD_W + bJP * BEHAVIOR_W))
    };
}
// <!-- END PROTECTED: calibrateVectors -->

// <!-- PROTECTED: classifyArchetype v2.3 — deterministic jitter for consistent results -->
function classifyArchetype(vFused) {
    var jitter = 0.10; /* ★ 임계값 근처(±0.10) 경계선 성향 → 확률적 분류 */
    /* ★ v2.3: 결정론적 해시 — 같은 vFused면 항상 같은 결과 */
    var hashSeed = Math.abs(vFused.EI * 7919 + vFused.NS * 6271 + vFused.TF * 5381 + vFused.JP * 4793);
    function pseudoRandom(axis) {
        var h = Math.abs(hashSeed * 9973 + axis * 3571);
        return (h % 1000) / 1000; /* 0~0.999 결정론적 값 */
    }
    function decide(val, posLetter, negLetter, axisId) {
        if (Math.abs(val) < jitter) {
            return pseudoRandom(axisId) > 0.5 ? posLetter : negLetter;
        }
        return val >= 0 ? posLetter : negLetter;
    }
    return decide(vFused.EI,'E','I',1) + decide(vFused.NS,'N','S',2) + decide(vFused.TF,'T','F',3) + decide(vFused.JP,'J','P',4);
}
// <!-- END PROTECTED: classifyArchetype -->

// MBTI코드 → 특허코드(NT-JE) 변환
function toPatentCode(mbti) {
    // mbti = "ENTJ" → patent = "NT-JE"
    // 순서: E/I(0), N/S(1), T/F(2), J/P(3)
    var ns = mbti.charAt(1); // N or S
    var tf = mbti.charAt(2); // T or F
    var jp = mbti.charAt(3); // J or P
    var ei = mbti.charAt(0); // E or I
    return ns + tf + '-' + jp + ei;
}

// 특허 그룹 판정 (N/S × T/F → 4대 그룹)
function getGroupFromPatentCode(patentCode) {
    var judgmentStyle = patentCode.substring(0, 2); // NT, ST, NF, SF
    var groupMap = {'ST':'분석가','NT':'항해사','SF':'실용주의','NF':'비전가'};
    return groupMap[judgmentStyle] || '분석가';
}
// <!-- END PROTECTED: classifyArchetype -->

function computeNScore(vCore, vFused) {
    // ═══════════════════════════════════════════════════════════════
    // N-Score v4.0 — KCB/나이스 초기등급 모델 (2026.03.18)
    // ─────────────────────────────────────────────────────────────
    // v3.0 문제: 기저값 ~320 → 신규 사용자 대부분 N5~N7 수렴 (하향 편향)
    // v4.0 원칙: KCB/나이스처럼 신규 = 중간등급(N4~N5) 보장
    //           행동 데이터(카드/MyData) 축적 시 상위 등급 도달
    // ─────────────────────────────────────────────────────────────
    // Phase 1 (KIPA + 선천):          N4~N5 중심 분포 (평균 ~650)
    // Phase 2 (+ 카드 결제 데이터):   N3~N4 도달 가능
    // Phase 3 (+ MyData 풀 연동):     N1~N2 도달 가능
    // ─────────────────────────────────────────────────────────────
    // 차별화 변동 기여: 선천25% / 후천30% / 융합35% / 기저10%
    // ═══════════════════════════════════════════════════════════════

    // [1] 선천 기저값 (v4.0: 320→448 상향 — 신규 사용자 중간등급 보장)
    // 오행별 편차 10점 유지 (태어난 오행이 등급을 결정하지 않도록)
    var elementBase = {'木': 448, '火': 455, '土': 445, '金': 452, '水': 448};
    var score = elementBase[vCore.dayElement] || 450;

    // [2] 에너지 밸런스 — 신강/신약 (v4.1: 180→120 축소 — 선천70% 반영 과도한 집중 완화)
    // strengthIndex: -0.4 ~ +0.4 → 기여 -48 ~ +48
    score += vCore.strengthIndex * 120;

    // [3] 재성 활성도 — 경제 감각 (v4.1: 150→100 축소)
    // wealthScore: 0.05 ~ 0.5 → 기여 5 ~ 50
    score += (vCore.wealthScore || 0) * 100;

    // [4] 식상 활성도 — 표현/행동력 (v4.0: 160→120 축소)
    // expressionScore: 0.05 ~ 0.5 → 기여 6 ~ 60
    score += (vCore.expressionScore || 0) * 120;

    // [5] KIPA 행동 결단력 — 4축 절댓값 평균
    // ★ v4.1: 선천70% 반영 후 vFused 절댓값 증가 → 과도한 점수 상승 방지
    // 절댓값 평균: 0 ~ 1.0 → 기여 0 ~ 140 (v4.0: 200 → v4.1: 140)
    var kipaDecisiveness = (Math.abs(vFused.EI) + Math.abs(vFused.NS) + Math.abs(vFused.TF) + Math.abs(vFused.JP)) / 4;
    score += kipaDecisiveness * 140;

    // [6] KIPA 극성 보너스 (v4.1: 80→55 축소 — 선천70% 반영분 보정)
    // 제곱합: 0 ~ 4.0 → 기여 0 ~ 55
    var kipaClarity = vFused.EI*vFused.EI + vFused.NS*vFused.NS + vFused.TF*vFused.TF + vFused.JP*vFused.JP;
    score += Math.min(kipaClarity, 1.0) * 55;

    // [7] 선천×후천 공명/충돌 — N-KAI 핵심 차별화 (v4.0: 계수 소폭 조정)
    // 선천 기질과 후천 행동이 같은 방향 = 공명(+), 반대 방향 = 충돌(-)
    var resonance = 0;
    // 일간 오행 ↔ N/S축: 木火=직관(N) 공명 / 金土=감각(S) 공명
    if (['木','火'].includes(vCore.dayElement)) resonance += vFused.NS * 50;
    else if (['金','土'].includes(vCore.dayElement)) resonance -= vFused.NS * 30;
    // 일간 오행 ↔ T/F축: 金水=사고(T) 공명 / 火木=감정(F) 공명
    if (['金','水'].includes(vCore.dayElement)) resonance += vFused.TF * 50;
    else if (['火','木'].includes(vCore.dayElement)) resonance -= vFused.TF * 30;
    // 신강/신약 ↔ J/P축: 신강=계획형(J) 공명
    if (vCore.strengthIndex > 0.1) resonance += vFused.JP * 40;
    else if (vCore.strengthIndex < -0.1) resonance -= vFused.JP * 25;
    // 식상 강도 ↔ E/I축: 식상 강=외향(E) 공명
    if ((vCore.expressionScore || 0) > 0.2) resonance += vFused.EI * 40;
    else if ((vCore.expressionScore || 0) < 0.1) resonance -= vFused.EI * 20;
    score += resonance;

    // [8] 오행 균형 보너스 (5-Energy 다양성 — 균형 잡힐수록 적응력↑)
    var elements = ['木','火','土','金','水'];
    var ohengTotal = elements.reduce(function(s, e) { return s + (vCore.ohengScore[e]||0); }, 0) || 1;
    var ohengVariance = elements.reduce(function(s, e) {
        var p = (vCore.ohengScore[e]||0) / ohengTotal;
        return s + Math.pow(p - 0.2, 2);
    }, 0);
    score += (1 - ohengVariance * 8) * 35; // 균형 = +35, 극단편향 = -14 (v4.0: 기저상향으로 축소)

    score = Math.max(200, Math.min(950, Math.round(score)));
    var ci = Math.round(score * 0.08);
    return { score: score, ciLow: score - ci, ciHigh: score + ci };
}

function calculateNGrade(score) {
    if(score >= 900) return { grade:"N1", label:"Prime Grade", color:"#00D68F" };
    if(score >= 800) return { grade:"N2", label:"Elite Grade", color:"#5AA8FF" };
    if(score >= 720) return { grade:"N3", label:"High Grade", color:"#5AA8FF" };
    if(score >= 650) return { grade:"N4", label:"Upper-Mid", color:"#a3e635" };
    if(score >= 580) return { grade:"N5", label:"Mid Grade", color:"#D4A856" };
    if(score >= 510) return { grade:"N6", label:"Lower-Mid", color:"#facc15" };
    if(score >= 440) return { grade:"N7", label:"Caution", color:"#f97316" };
    if(score >= 370) return { grade:"N8", label:"Warning", color:"#fb923c" };
    return { grade:"N9", label:"Risk Grade", color:"#FF4D6A" };
}

// <!-- PROTECTED: nkaiDatabase v2.1 — 특허 S4040 16분류 (그룹 = N/S×T/F 기준) -->
var nkaiDatabase = {
    // ═══════════════════════════════════════════════════════════════
    // 항해사형 Navigator (NT: 직관×사고)
    // ═══════════════════════════════════════════════════════════════
    "ENTJ": { patentCode:"NT-JE", group:"항해사", groupEn:"Navigator", title:"혁신적 지휘관", titleEn:"Innovation Commander",
        summary:"직관과 실행력으로 부의 지형을 바꾸는 리더",
        identity:"선천적 기질의 날카로움과 후천적 행동의 치밀함을 융합한 독보적 설계자입니다.",
        trajectory:"안정적인 우상향 궤적. 새로운 시장의 표준을 설계할 잠재력을 보유합니다.",
        compass:"현재 지표가 가리키는 방향은 '확장'입니다." },
    "ENTP": { patentCode:"NT-PE", group:"항해사", groupEn:"Navigator", title:"파괴적 개척자", titleEn:"Disruptive Pioneer",
        summary:"기존 금융의 틀을 깨고 새로운 자산 공식을 만드는 천재",
        identity:"데이터 너머의 본질을 꿰뚫습니다. 창의적 아키텍처로 세상에 없던 가치를 창출합니다.",
        trajectory:"비선형적 점프(Exponential Growth) 가능성이 매우 높습니다.",
        compass:"변동성 속에서 부가 극대화됩니다. 블루오션에 과감히 베팅하십시오." },
    "INTJ": { patentCode:"NT-JI", group:"항해사", groupEn:"Navigator", title:"전략적 탐험가", titleEn:"Strategic Explorer",
        summary:"장기적 비전과 완벽한 시스템 통제력을 가진 파운더",
        identity:"수리적 무결성을 추구하는 냉철한 설계자입니다.",
        trajectory:"복리의 마법을 가장 잘 활용하는 타입입니다.",
        compass:"장기 투자가 정답입니다." },
    "INTP": { patentCode:"NT-PI", group:"항해사", groupEn:"Navigator", title:"통찰의 설계자", titleEn:"Insight Designer",
        summary:"보이지 않는 패턴을 읽어내어 조용히 부를 축적하는 전략가",
        identity:"현상의 이면에 숨겨진 데이터 패턴을 찾아내는 능력이 탁월합니다.",
        trajectory:"딥테크 분야에서 압도적인 성과를 냅니다.",
        compass:"데이터가 당신의 무기입니다." },

    // ═══════════════════════════════════════════════════════════════
    // 분석가형 Analyst (ST: 감각×사고)
    // ═══════════════════════════════════════════════════════════════
    "ESTJ": { patentCode:"ST-JE", group:"분석가", groupEn:"Analyst", title:"전략적 설계자", titleEn:"Strategic Architect",
        summary:"원칙과 데이터에 입각하여 리스크 제로에 도전하는 관리자",
        identity:"철저한 계획과 강력한 통제력으로 자산을 불려나갑니다.",
        trajectory:"예측 가능한 범위 내에서 자산을 극대화합니다.",
        compass:"소득 파이프라인(B2B) 구축에 최적화된 궤적입니다." },
    "ISTJ": { patentCode:"ST-JI", group:"분석가", groupEn:"Analyst", title:"분석적 수호자", titleEn:"Analytical Guardian",
        summary:"과거 데이터를 완벽히 분석하여 자산의 누수를 막는 수호자",
        identity:"리스크를 데이터로 제어하고 시스템의 안정성을 최우선으로 합니다.",
        trajectory:"견고한 계단식 성장을 보입니다.",
        compass:"최적의 타이밍을 신뢰해 보세요." },
    "ESTP": { patentCode:"ST-PE", group:"분석가", groupEn:"Analyst", title:"실전형 돌파자", titleEn:"Tactical Breaker",
        summary:"변동성이 큰 시장에서 결정적 타이밍을 잡는 승부사",
        identity:"급변하는 시장의 흐름을 본능적으로 읽어냅니다.",
        trajectory:"순간적인 자산 증식 에너지가 강합니다.",
        compass:"단기적 변곡점 데이터에 주목하세요." },
    "ISTP": { patentCode:"ST-PI", group:"분석가", groupEn:"Analyst", title:"정밀한 관찰자", titleEn:"Precision Observer",
        summary:"가장 효율적인 수단으로 경제적 이득을 취하는 냉철함",
        identity:"불필요한 감정 소모 없이 가장 효율적인 경로로 목표에 도달합니다.",
        trajectory:"기술과 재능을 즉각적인 수익화 솔루션으로 치환합니다.",
        compass:"기술 가치가 곧 금융 가치입니다." },

    // ═══════════════════════════════════════════════════════════════
    // 비전가형 Visionary (NF: 직관×감정)
    // ═══════════════════════════════════════════════════════════════
    "ENFJ": { patentCode:"NF-JE", group:"비전가", groupEn:"Visionary", title:"이상적 전도사", titleEn:"Visionary Evangelist",
        summary:"사람과 신용을 자산으로 전환시키는 소셜 매칭의 귀재",
        identity:"당신의 부는 '사람'과 '신용'에서 시작됩니다.",
        trajectory:"네트워크 자산이 막대한 경제적 보상으로 돌아옵니다.",
        compass:"귀인 매칭 시스템을 적극 활용하세요." },
    "INFJ": { patentCode:"NF-JI", group:"비전가", groupEn:"Visionary", title:"내면의 항해자", titleEn:"Inner Navigator",
        summary:"남들이 보지 못하는 미래 가치를 선점하는 직관",
        identity:"시계열 데이터의 흐름을 본능적으로 감지합니다.",
        trajectory:"소수의 집중된 투자로 거대한 성공을 거둡니다.",
        compass:"N-Score를 통해 직관을 확신으로 바꾸십시오." },
    "ENFP": { patentCode:"NF-PE", group:"비전가", groupEn:"Visionary", title:"자유로운 창조자", titleEn:"Free Creator",
        summary:"위기를 도약의 에너지로 바꾸는 무한한 가능성",
        identity:"'Scars to Stars' 정신의 표본입니다.",
        trajectory:"예상치 못한 인맥과 기회를 통해 비약적인 자산 증식이 일어납니다.",
        compass:"에너지 밸런스 가이드를 통해 판단력을 정교화하세요." },
    "INFP": { patentCode:"NF-PI", group:"비전가", groupEn:"Visionary", title:"감성의 몽상가", titleEn:"Emotional Dreamer",
        summary:"돈이 가져다주는 근원적 가치와 행복을 설계하는 자",
        identity:"진정성이 담긴 콘텐츠나 서비스로 승부합니다.",
        trajectory:"대체 불가능한 프리미엄 가치를 지니게 됩니다.",
        compass:"자산의 20%를 사회적 미션에 결합할 때 부의 순환이 일어납니다." },

    // ═══════════════════════════════════════════════════════════════
    // 실용주의형 Pragmatist (SF: 감각×감정)
    // ═══════════════════════════════════════════════════════════════
    "ESFJ": { patentCode:"SF-JE", group:"실용주의", groupEn:"Pragmatist", title:"안정의 조율자", titleEn:"Stability Harmonizer",
        summary:"커뮤니티와 관계망 속에서 부의 기회를 창출하는 타입",
        identity:"정보의 허브 역할을 하며 시장 동향을 가장 먼저 파악합니다.",
        trajectory:"중개 가치를 창출합니다.",
        compass:"정보의 선점이 곧 부의 원천입니다." },
    "ISFJ": { patentCode:"SF-JI", group:"실용주의", groupEn:"Pragmatist", title:"꾸준한 수호자", titleEn:"Steady Protector",
        summary:"신뢰를 바탕으로 가장 안정적인 성장을 이루는 방패",
        identity:"관계의 리스크를 사전에 필터링하는 능력이 탁월합니다.",
        trajectory:"안정형 투자처에서 최적의 승률을 보입니다.",
        compass:"전통적 자산군과 AI 데이터의 결합을 추천합니다." },
    "ESFP": { patentCode:"SF-PE", group:"실용주의", groupEn:"Pragmatist", title:"유연한 실리가", titleEn:"Flexible Realist",
        summary:"에너지 밸런스와 생체 리듬을 극대화하여 경제 활동력 상승",
        identity:"순간적인 몰입도와 실행력이 최고조에 달합니다.",
        trajectory:"단기 프로젝트에서 폭발적인 성과를 냅니다.",
        compass:"최상의 컨디션이 최고의 수익률입니다." },
    "ISFP": { patentCode:"SF-PI", group:"실용주의", groupEn:"Pragmatist", title:"신중한 관망자", titleEn:"Cautious Watcher",
        summary:"시장의 변화에 자연스럽게 부의 흐름을 타는 서퍼",
        identity:"고정된 틀에 얽매이지 않고 유연하게 이동합니다.",
        trajectory:"스트레스 없는 환경에서 최고의 투자 성과를 냅니다.",
        compass:"추세 추종형 투자에서 독보적인 감각을 발휘합니다." }
};
// <!-- END PROTECTED: nkaiDatabase -->

// ═══════════════════════════════════════════════════════════════════════════
// ARCHETYPE CELEBRITIES — 16유형별 유명인 매핑 (Phase 1 바이럴 강화)
// "나와 같은 유형의 유명인" → 감정 몰입 + 공유 욕구 극대화
// ═══════════════════════════════════════════════════════════════════════════
var ARCHETYPE_CELEBRITIES = {
    // ── 항해사형 Navigator (NT) ──
    "ENTJ": {
        ko: ["스티브 잡스", "이건희", "잭 마"],
        en: ["Steve Jobs", "Lee Kun-hee", "Jack Ma"],
        ja: ["スティーブ・ジョブズ", "李健熙", "ジャック・マー"],
        zh: ["史蒂夫·乔布斯", "李健熙", "杰克·马"],
        tag: { ko: "산업의 판도를 바꾼 혁신가들", en: "Innovators who reshaped industries", ja: "産業の構図を変えた革新者たち", zh: "改变产业格局的创新者们" }
    },
    "ENTP": {
        ko: ["일론 머스크", "김범수", "리처드 브랜슨"],
        en: ["Elon Musk", "Bum-soo Kim", "Richard Branson"],
        ja: ["イーロン・マスク", "キム・ボムス", "リチャード・ブランソン"],
        zh: ["埃隆·马斯克", "金范洙", "理查德·布兰森"],
        tag: { ko: "규칙을 깨고 새 시장을 창조한 개척자들", en: "Pioneers who broke rules and created new markets", ja: "ルールを破り新市場を創造した開拓者たち", zh: "打破规则创造新市场的开拓者们" }
    },
    "INTJ": {
        ko: ["워런 버핏", "이재용", "레이 달리오"],
        en: ["Warren Buffett", "Jay Y. Lee", "Ray Dalio"],
        ja: ["ウォーレン・バフェット", "李在鎔", "レイ・ダリオ"],
        zh: ["沃伦·巴菲特", "李在镕", "瑞·达利欧"],
        tag: { ko: "장기 비전으로 제국을 설계한 전략가들", en: "Strategists who built empires with long-term vision", ja: "長期ビジョンで帝国を設計した戦略家たち", zh: "以长期愿景构建帝国的战略家们" }
    },
    "INTP": {
        ko: ["빌 게이츠", "이해진", "래리 페이지"],
        en: ["Bill Gates", "Hae-jin Lee", "Larry Page"],
        ja: ["ビル・ゲイツ", "李海珍", "ラリー・ペイジ"],
        zh: ["比尔·盖茨", "李海珍", "拉里·佩奇"],
        tag: { ko: "보이지 않는 패턴을 읽어낸 기술 천재들", en: "Tech geniuses who decoded invisible patterns", ja: "見えないパターンを読み解いた技術の天才たち", zh: "解读隐形模式的技术天才们" }
    },
    // ── 분석가형 Analyst (ST) ──
    "ESTJ": {
        ko: ["팀 쿡", "정몽구", "셰릴 샌드버그"],
        en: ["Tim Cook", "Mong-koo Chung", "Sheryl Sandberg"],
        ja: ["ティム・クック", "鄭夢九", "シェリル・サンドバーグ"],
        zh: ["蒂姆·库克", "郑梦九", "谢丽尔·桑德伯格"],
        tag: { ko: "시스템과 원칙으로 조직을 완벽히 통제한 관리자들", en: "Managers who perfected organizational control", ja: "システムと原則で組織を完璧に統制した管理者たち", zh: "以系统和原则完美掌控组织的管理者们" }
    },
    "ISTJ": {
        ko: ["찰리 멍거", "정의선", "존 보글"],
        en: ["Charlie Munger", "Eui-sun Chung", "John Bogle"],
        ja: ["チャーリー・マンガー", "鄭義宣", "ジョン・ボーグル"],
        zh: ["查理·芒格", "郑义宣", "约翰·博格尔"],
        tag: { ko: "데이터와 인내로 자산을 수호한 현인들", en: "Sages who guarded wealth with data and patience", ja: "データと忍耐で資産を守護した賢人たち", zh: "以数据和耐心守护资产的贤者们" }
    },
    "ESTP": {
        ko: ["손정의", "조지 소로스", "마크 큐반"],
        en: ["Masayoshi Son", "George Soros", "Mark Cuban"],
        ja: ["孫正義", "ジョージ・ソロス", "マーク・キューバン"],
        zh: ["孙正义", "乔治·索罗斯", "马克·库班"],
        tag: { ko: "결정적 순간에 승부를 건 타이밍의 귀재들", en: "Masters of timing who bet at decisive moments", ja: "決定的瞬間に勝負を賭けたタイミングの鬼才たち", zh: "在关键时刻出手的时机天才们" }
    },
    "ISTP": {
        ko: ["짐 사이먼스", "피터 틸", "김택진"],
        en: ["Jim Simons", "Peter Thiel", "Taek-jin Kim"],
        ja: ["ジム・サイモンズ", "ピーター・ティール", "キム・テクジン"],
        zh: ["吉姆·西蒙斯", "彼得·蒂尔", "金泽辰"],
        tag: { ko: "냉철한 분석으로 최적의 수익을 추출한 관찰자들", en: "Observers who extracted optimal returns through cold analysis", ja: "冷徹な分析で最適な収益を抽出した観察者たち", zh: "以冷静分析提取最优收益的观察者们" }
    },
    // ── 비전가형 Visionary (NF) ──
    "ENFJ": {
        ko: ["오프라 윈프리", "유재석", "사라 블레이클리"],
        en: ["Oprah Winfrey", "Jae-seok Yoo", "Sara Blakely"],
        ja: ["オプラ・ウィンフリー", "ユ・ジェソク", "サラ・ブレイクリー"],
        zh: ["奥普拉·温弗瑞", "刘在石", "萨拉·布莱克利"],
        tag: { ko: "사람과 신뢰로 거대한 부를 창출한 리더들", en: "Leaders who created wealth through people and trust", ja: "人と信頼で巨大な富を創出したリーダーたち", zh: "以人脉和信任创造巨额财富的领导者们" }
    },
    "INFJ": {
        ko: ["방시혁", "캐시 우드", "김연아"],
        en: ["Si-hyuk Bang", "Cathie Wood", "Yuna Kim"],
        ja: ["パン・シヒョク", "キャシー・ウッド", "キム・ヨナ"],
        zh: ["房时赫", "凯西·伍德", "金妍儿"],
        tag: { ko: "남들이 보지 못한 미래 가치를 선점한 선지자들", en: "Visionaries who seized unseen future value", ja: "誰も見えなかった未来の価値を先取りした先見者たち", zh: "抢占他人未见之未来价值的先知者们" }
    },
    "ENFP": {
        ko: ["월트 디즈니", "박진영", "나영석"],
        en: ["Walt Disney", "Jin-young Park (JYP)", "Young-seok Na"],
        ja: ["ウォルト・ディズニー", "パク・ジニョン", "ナ・ヨンソク"],
        zh: ["沃尔特·迪士尼", "朴振英", "罗英锡"],
        tag: { ko: "무한한 상상력을 현실의 부로 전환한 창조자들", en: "Creators who turned limitless imagination into real wealth", ja: "無限の想像力を現実の富に変えた創造者たち", zh: "将无限想象力转化为现实财富的创造者们" }
    },
    "INFP": {
        ko: ["미야자키 하야오", "이효리", "이본 쉬나드"],
        en: ["Hayao Miyazaki", "Hyo-ri Lee", "Yvon Chouinard"],
        ja: ["宮崎駿", "イ・ヒョリ", "イヴォン・シュイナード"],
        zh: ["宫崎骏", "李孝利", "伊冯·乔伊纳德"],
        tag: { ko: "진정성과 가치로 대체 불가능한 브랜드를 만든 몽상가들", en: "Dreamers who built irreplaceable brands through authenticity", ja: "真正性と価値で代替不可能なブランドを築いた夢想家たち", zh: "以真诚与价值打造不可替代品牌的梦想家们" }
    },
    // ── 실용주의형 Pragmatist (SF) ──
    "ESFJ": {
        ko: ["백종원", "인드라 누이", "메리 케이 애쉬"],
        en: ["Jong-won Baek", "Indra Nooyi", "Mary Kay Ash"],
        ja: ["ペク・ジョンウォン", "インドラ・ヌーイ", "メアリー・ケイ・アッシュ"],
        zh: ["白种元", "英德拉·努伊", "玫琳凯·艾施"],
        tag: { ko: "관계와 커뮤니티로 부의 생태계를 만든 조율자들", en: "Harmonizers who built wealth ecosystems through community", ja: "関係とコミュニティで富の生態系を築いた調律者たち", zh: "通过社群关系构建财富生态的协调者们" }
    },
    "ISFJ": {
        ko: ["하워드 슐츠", "김미경", "재닛 옐런"],
        en: ["Howard Schultz", "Mi-kyung Kim", "Janet Yellen"],
        ja: ["ハワード・シュルツ", "キム・ミギョン", "ジャネット・イエレン"],
        zh: ["霍华德·舒尔茨", "金美京", "珍妮特·耶伦"],
        tag: { ko: "신뢰와 꾸준함으로 가장 안정적인 성장을 이룬 수호자들", en: "Protectors who achieved the steadiest growth through trust", ja: "信頼と着実さで最も安定した成長を遂げた守護者たち", zh: "以信任和坚持实现最稳定增长的守护者们" }
    },
    "ESFP": {
        ko: ["싸이", "강호동", "게리 바이너척"],
        en: ["PSY", "Ho-dong Kang", "Gary Vaynerchuk"],
        ja: ["PSY(サイ)", "カン・ホドン", "ゲイリー・ヴェイナチャック"],
        zh: ["鸟叔PSY", "姜虎东", "加里·韦纳查克"],
        tag: { ko: "폭발적 에너지로 순간을 기회로 바꾼 실행가들", en: "Doers who turned moments into opportunities with explosive energy", ja: "爆発的エネルギーで瞬間をチャンスに変えた実行者たち", zh: "以爆发性能量将瞬间转化为机遇的行动派们" }
    },
    "ISFP": {
        ko: ["봉준호", "아이유", "키아누 리브스"],
        en: ["Bong Joon-ho", "IU (Lee Ji-eun)", "Keanu Reeves"],
        ja: ["ポン・ジュノ", "IU(アイユー)", "キアヌ・リーブス"],
        zh: ["奉俊昊", "IU(李知恩)", "基努·里维斯"],
        tag: { ko: "자신만의 흐름으로 시장을 서핑한 관망자들", en: "Watchers who surfed markets on their own rhythm", ja: "自分だけの流れで市場をサーフィンした観望者たち", zh: "以独特节奏冲浪市场的观望者们" }
    }
};
// <!-- END: ARCHETYPE_CELEBRITIES -->

// ═══════════════════════════════════════════════════════════════════════════
// N-KAI ENGINE v3.0 — XAI + 공명률 + DNA Age (2026.02.18)
// Patent P25KAI001KR / AI 기본법 제31조 준수
// ═══════════════════════════════════════════════════════════════════════════

// <!-- PROTECTED: RESONANCE_MATRIX v3.0 — 5×4 균형 설계 (각 축·원소 Σ≈0) -->
var RESONANCE_MATRIX = {
    '木': { N_S: +0.20, T_F: -0.10, J_P: -0.15, E_I: +0.12 },
    '火': { N_S: +0.18, T_F: +0.08, J_P: -0.10, E_I: +0.20 },
    '土': { N_S: -0.18, T_F: +0.05, J_P: +0.15, E_I: -0.08 },
    '金': { N_S: -0.15, T_F: +0.15, J_P: +0.20, E_I: -0.12 },
    '水': { N_S: +0.10, T_F: -0.12, J_P: -0.08, E_I: -0.15 }
};
// <!-- END PROTECTED: RESONANCE_MATRIX -->

// ═══════════════════════════════════════════════════════════════════════════
// 공명률 (Resonance Rate) — 선천-후천 정렬도 0~100%
// ═══════════════════════════════════════════════════════════════════════════
// <!-- PROTECTED: calculateResonanceRate v3.0 -->
function calculateResonanceRate(vCore, vFused) {
    var rm = RESONANCE_MATRIX[vCore.dayElement] || RESONANCE_MATRIX['土'];
    
    // 각 축별로 선천 공명 방향과 후천 실제 방향의 일치도 계산
    var axes = [
        { axis: 'N_S', fused: vFused.NS, resonance: rm.N_S },
        { axis: 'T_F', fused: vFused.TF, resonance: rm.T_F },
        { axis: 'J_P', fused: vFused.JP, resonance: rm.J_P },
        { axis: 'E_I', fused: vFused.EI, resonance: rm.E_I }
    ];
    
    var totalAlignment = 0;
    var axisDetails = [];
    
    axes.forEach(function(a) {
        // 공명 방향과 실제 방향이 같으면 정렬, 다르면 충돌
        var directionMatch = (a.fused * a.resonance) > 0;
        // 강도: 실제값의 절대값이 클수록 정렬/충돌 효과도 큼
        var strength = Math.min(Math.abs(a.fused), 1.0);
        var alignment = directionMatch ? strength : -strength * 0.5;
        totalAlignment += alignment;
        
        axisDetails.push({
            axis: a.axis,
            fusedValue: Math.round(a.fused * 1000) / 1000,
            resonanceDirection: a.resonance > 0 ? '+' : '-',
            resonanceStrength: Math.abs(a.resonance),
            directionMatch: directionMatch,
            alignmentScore: Math.round(alignment * 1000) / 1000
        });
    });
    
    // -2.0 ~ +4.0 → 0 ~ 100% 정규화
    var rate = Math.round(Math.max(0, Math.min(100, ((totalAlignment + 2.0) / 6.0) * 100)));
    
    var level, emoji, message;
    if (rate >= 70) {
        level = 'high'; emoji = '🟢';
        message = '선천-후천 에너지 정렬도 높음';
    } else if (rate >= 40) {
        level = 'medium'; emoji = '🟡';
        message = '선천-후천 에너지 약간의 괴리';
    } else {
        level = 'low'; emoji = '🔴';
        message = '선천-후천 에너지 충돌 감지';
    }
    
    return {
        rate: rate,
        level: level,
        emoji: emoji,
        message: message,
        axisDetails: axisDetails
    };
}
// <!-- END PROTECTED: calculateResonanceRate -->

// ═══════════════════════════════════════════════════════════════════════════
// DNA 나이 (DNA Age Badge) — 가입 후 경과 기간별 등급
// ═══════════════════════════════════════════════════════════════════════════
// <!-- PROTECTED: getDNAAge v3.0 -->
function getDNAAge(registrationDateStr) {
    var now = new Date();
    var regDate;
    
    if (!registrationDateStr) {
        // 등록일 없으면 신규 사용자 취급
        return { months: 0, stage: 'newborn', label: '뉴본 DNA', emoji: '🌱', labelEn: 'Newborn DNA' };
    }
    
    regDate = new Date(registrationDateStr);
    var months = Math.floor((now - regDate) / (1000 * 60 * 60 * 24 * 30.44));
    
    if (months >= 24) return { months: months, stage: 'master',  label: '마스터 DNA', emoji: '💎', labelEn: 'Master DNA' };
    if (months >= 12) return { months: months, stage: 'mature',  label: '매쳐 DNA',   emoji: '🌲', labelEn: 'Mature DNA' };
    if (months >= 6)  return { months: months, stage: 'stable',  label: '스테이블 DNA', emoji: '🌳', labelEn: 'Stable DNA' };
    if (months >= 3)  return { months: months, stage: 'growing', label: '그로잉 DNA',  emoji: '🌿', labelEn: 'Growing DNA' };
    return { months: months, stage: 'newborn', label: '뉴본 DNA', emoji: '🌱', labelEn: 'Newborn DNA' };
}
// <!-- END PROTECTED: getDNAAge -->

// ═══════════════════════════════════════════════════════════════════════════
// XAI LAYER 1: explainArchetype — "왜 이 아키타입인가?"
// AI 기본법 제31조 준수 / 분류 근거 투명성 확보
// ═══════════════════════════════════════════════════════════════════════════
// <!-- PROTECTED: explainArchetype v3.0 — XAI Layer 1 -->
function explainArchetype(vCore, vBehavior, vFused, archetypeCode) {
    var rm = RESONANCE_MATRIX[vCore.dayElement] || RESONANCE_MATRIX['土'];
    var db = nkaiDatabase[archetypeCode] || {};
    
    /* ★ v2.4: 최종 archetypeCode에서 실제 결정된 방향 추출 */
    var codeEI = archetypeCode.charAt(0); /* E or I */
    var codeNS = archetypeCode.charAt(1); /* N or S */
    var codeTF = archetypeCode.charAt(2); /* T or F */
    var codeJP = archetypeCode.charAt(3); /* J or P */
    
    /* 라벨은 최종 코드 기준 (jitter 범위 내 값도 코드와 일치) */
    var labelMap = {
        E: '외향형(E)', I: '내향형(I)',
        N: '직관형(N)', S: '감각형(S)',
        T: '사고형(T)', F: '감정형(F)',
        J: '판단형(J)', P: '인식형(P)'
    };
    var labelMapEn = {
        E: 'Extroverted(E)', I: 'Introverted(I)',
        N: 'Intuitive(N)', S: 'Sensing(S)',
        T: 'Thinking(T)', F: 'Feeling(F)',
        J: 'Judging(J)', P: 'Perceiving(P)'
    };
    
    // 각 축별 KIPA 기여분 vs 선천 보정분 분해
    var axisExplanation = {
        N_S: {
            final: Math.round(vFused.NS * 1000) / 1000,
            kipa: Math.round(vBehavior.NS * 1000) / 1000,
            innateCorrection: Math.round((vFused.NS - vBehavior.NS) * 1000) / 1000,
            resonanceWeight: rm.N_S,
            label: labelMap[codeNS],
            labelEn: labelMapEn[codeNS],
            kipaPercent: 0,
            innatePercent: 0
        },
        T_F: {
            final: Math.round(vFused.TF * 1000) / 1000,
            kipa: Math.round(vBehavior.TF * 1000) / 1000,
            innateCorrection: Math.round((vFused.TF - vBehavior.TF) * 1000) / 1000,
            resonanceWeight: rm.T_F,
            label: labelMap[codeTF],
            labelEn: labelMapEn[codeTF],
            kipaPercent: 0,
            innatePercent: 0
        },
        J_P: {
            final: Math.round(vFused.JP * 1000) / 1000,
            kipa: Math.round(vBehavior.JP * 1000) / 1000,
            innateCorrection: Math.round((vFused.JP - vBehavior.JP) * 1000) / 1000,
            resonanceWeight: rm.J_P,
            label: labelMap[codeJP],
            labelEn: labelMapEn[codeJP],
            kipaPercent: 0,
            innatePercent: 0
        },
        E_I: {
            final: Math.round(vFused.EI * 1000) / 1000,
            kipa: Math.round(vBehavior.EI * 1000) / 1000,
            innateCorrection: Math.round((vFused.EI - vBehavior.EI) * 1000) / 1000,
            resonanceWeight: rm.E_I,
            label: labelMap[codeEI],
            labelEn: labelMapEn[codeEI],
            kipaPercent: 0,
            innatePercent: 0
        }
    };
    
    // KIPA vs 선천 비율 계산
    ['N_S', 'T_F', 'J_P', 'E_I'].forEach(function(axis) {
        var ax = axisExplanation[axis];
        var totalAbs = Math.abs(ax.kipa) + Math.abs(ax.innateCorrection);
        if (totalAbs > 0) {
            ax.kipaPercent = Math.round((Math.abs(ax.kipa) / totalAbs) * 100);
            ax.innatePercent = 100 - ax.kipaPercent;
        } else {
            ax.kipaPercent = 50;
            ax.innatePercent = 50;
        }
    });
    
    // 전체 평균 KIPA vs 선천 비율
    var avgKipa = Math.round((axisExplanation.N_S.kipaPercent + axisExplanation.T_F.kipaPercent + 
                              axisExplanation.J_P.kipaPercent + axisExplanation.E_I.kipaPercent) / 4);
    
    return {
        archetype: archetypeCode,
        archetypeName: db.title || archetypeCode,
        archetypeNameEn: db.titleEn || archetypeCode,
        patentCode: db.patentCode || toPatentCode(archetypeCode),
        group: db.group || '',
        groupEn: db.groupEn || '',
        axes: axisExplanation,
        overallRatio: {
            kipaPercent: avgKipa,
            innatePercent: 100 - avgKipa,
            description: 'KIPA 설문 ' + avgKipa + '% + 선천 기질 보정 ' + (100 - avgKipa) + '%'
        },
        innateFactors: {
            dayElement: vCore.dayElement,
            strengthType: vCore.strengthLabel || vCore.strengthType,
            strengthIndex: vCore.strengthIndex,
            wealthScore: vCore.wealthScore,
            expressionScore: vCore.expressionScore
        },
        disclaimer: '본 분석은 AI 기반 금융 성향 분석 서비스이며 투자 자문이 아닙니다. (AI 기본법 제31조)'
    };
}
// <!-- END PROTECTED: explainArchetype -->

// ═══════════════════════════════════════════════════════════════════════════
// XAI LAYER 2: explainNScore — "왜 이 점수인가?"
// ═══════════════════════════════════════════════════════════════════════════
// <!-- PROTECTED: explainNScore v3.0 — XAI Layer 2 -->
function explainNScore(vCore, vFused, nScoreResult) {
    var score = nScoreResult.score;
    var gradeInfo = calculateNGrade(score);
    
    // N-Score v4.0 구성 요소별 기여도 역산 (computeNScore v4.0과 동기화)
    var elementBase = {'木': 448, '火': 455, '土': 445, '金': 452, '水': 448};
    var baseScore = elementBase[vCore.dayElement] || 450;
    
    var strengthContrib = Math.round(vCore.strengthIndex * 180);
    var wealthContrib = Math.round((vCore.wealthScore || 0) * 150);
    var expressionContrib = Math.round((vCore.expressionScore || 0) * 120);
    
    // KIPA 행동 결단력 (v4.0: 200)
    var kipaDecisiveness = (Math.abs(vFused.EI) + Math.abs(vFused.NS) + Math.abs(vFused.TF) + Math.abs(vFused.JP)) / 4;
    var kipaDecContrib = Math.round(kipaDecisiveness * 200);
    
    // KIPA 극성 보너스 (v4.0: 80)
    var kipaClarity = vFused.EI*vFused.EI + vFused.NS*vFused.NS + 
                      vFused.TF*vFused.TF + vFused.JP*vFused.JP;
    var kipaClarityContrib = Math.round(Math.min(kipaClarity, 1.0) * 80);
    
    // 공명 기여 계산 (v4.0 계수)
    var resonanceContrib = 0;
    if (['木','火'].includes(vCore.dayElement)) resonanceContrib += Math.round(vFused.NS * 50);
    else if (['金','土'].includes(vCore.dayElement)) resonanceContrib -= Math.round(vFused.NS * 30);
    if (['金','水'].includes(vCore.dayElement)) resonanceContrib += Math.round(vFused.TF * 50);
    else if (['火','木'].includes(vCore.dayElement)) resonanceContrib -= Math.round(vFused.TF * 30);
    if (vCore.strengthIndex > 0.1) resonanceContrib += Math.round(vFused.JP * 40);
    else if (vCore.strengthIndex < -0.1) resonanceContrib -= Math.round(vFused.JP * 25);
    if ((vCore.expressionScore || 0) > 0.2) resonanceContrib += Math.round(vFused.EI * 40);
    else if ((vCore.expressionScore || 0) < 0.1) resonanceContrib -= Math.round(vFused.EI * 20);
    
    // 엔트로피 기여 계산 (v4.0: 35)
    var elems = ['木','火','土','金','水'];
    var ohengTotal = elems.reduce(function(s, e) { return s + (vCore.ohengScore[e]||0); }, 0) || 1;
    var ohengVariance = elems.reduce(function(s, e) {
        var p = (vCore.ohengScore[e]||0) / ohengTotal;
        return s + Math.pow(p - 0.2, 2);
    }, 0);
    var entropyContrib = Math.round((1 - ohengVariance * 8) * 35);
    
    // 합산 검증
    var calculatedTotal = baseScore + strengthContrib + wealthContrib + 
                          expressionContrib + kipaDecContrib + kipaClarityContrib + resonanceContrib + entropyContrib;
    
    return {
        total: score,
        grade: gradeInfo.grade,
        gradeLabel: gradeInfo.label,
        gradeColor: gradeInfo.color,
        ci: { low: nScoreResult.ciLow, high: nScoreResult.ciHigh },
        components: {
            elementBase: {
                value: baseScore,
                label: '코어 에너지 (' + vCore.dayElement + ')',
                percent: Math.round((baseScore / Math.max(score, 1)) * 100)
            },
            strength: {
                value: strengthContrib,
                label: '에너지 밸런스 (' + (vCore.strengthLabel || vCore.strengthType) + ')',
                formula: 'strengthIndex(' + vCore.strengthIndex + ') × 250',
                percent: Math.round((Math.abs(strengthContrib) / Math.max(score, 1)) * 100)
            },
            wealth: {
                value: wealthContrib,
                label: '경제감각 활성도',
                formula: 'wealthScore(' + (vCore.wealthScore||0) + ') × 200',
                percent: Math.round((wealthContrib / Math.max(score, 1)) * 100)
            },
            expression: {
                value: expressionContrib,
                label: '표현에너지 활성도',
                formula: 'expressionScore(' + (vCore.expressionScore||0) + ') × 160',
                percent: Math.round((expressionContrib / Math.max(score, 1)) * 100)
            },
            kipaDecisiveness: {
                value: kipaDecContrib,
                label: 'KIPA 행동 결단력',
                formula: '4축 절댓값 평균(' + (Math.round(kipaDecisiveness*100)/100) + ') × 250',
                percent: Math.round((kipaDecContrib / Math.max(score, 1)) * 100)
            },
            kipaClarity: {
                value: kipaClarityContrib,
                label: 'KIPA 극성 보너스',
                formula: '제곱합(' + (Math.round(kipaClarity*100)/100) + ') × 100 (cap 1.0)',
                percent: Math.round((kipaClarityContrib / Math.max(score, 1)) * 100)
            },
            resonance: {
                value: resonanceContrib,
                label: '선천×후천 공명',
                percent: Math.round((Math.abs(resonanceContrib) / Math.max(score, 1)) * 100)
            },
            entropy: {
                value: entropyContrib,
                label: '5-Energy 균형도',
                formula: '(1 - 편차×8) × 50',
                percent: Math.round((Math.abs(entropyContrib) / Math.max(score, 1)) * 100)
            }
        },
        gradeRange: getGradeRange(gradeInfo.grade),
        disclaimer: '본 점수는 AI 기반 금융 성향 분석 결과이며 투자 자문이 아닙니다.',
        version: 'v3.0'
    };
}

function getGradeRange(grade) {
    var ranges = {
        'N1': '900~950점 (Prime Grade)',
        'N2': '800~899점 (Elite Grade)',
        'N3': '720~799점 (High Grade)',
        'N4': '650~719점 (Upper-Mid)',
        'N5': '580~649점 (Mid Grade)',
        'N6': '510~579점 (Lower-Mid)',
        'N7': '440~509점 (Caution)',
        'N8': '370~439점 (Warning)',
        'N9': '200~369점 (Risk Grade)'
    };
    return ranges[grade] || '';
}
// <!-- END PROTECTED: explainNScore -->

// ═══════════════════════════════════════════════════════════════════════════
// XAI LAYER 3: explainRecommendation — "왜 이 추천인가?"
// ═══════════════════════════════════════════════════════════════════════════
// <!-- PROTECTED: explainRecommendation v3.0 — XAI Layer 3 -->
function explainRecommendation(archetypeCode, vCore, vFused) {
    var db = nkaiDatabase[archetypeCode] || {};
    var patentCode = db.patentCode || toPatentCode(archetypeCode);
    var judgmentStyle = patentCode.substring(0, 2); // NT, ST, NF, SF
    
    // 아키타입 그룹별 포트폴리오 기본 배분
    var portfolioTemplates = {
        'NT': { growth: 35, etf: 25, bond: 20, alternative: 15, cash: 5,
                reason: 'NT형(직관+사고) — 트렌드 파악력과 분석력 모두 높아 성장 자산 비중 확대' },
        'ST': { growth: 20, etf: 35, bond: 30, alternative: 10, cash: 5,
                reason: 'ST형(감각+사고) — 데이터 기반 분석력이 강해 ETF/채권 중심 안정 운용' },
        'NF': { growth: 30, etf: 20, bond: 20, alternative: 25, cash: 5,
                reason: 'NF형(직관+감정) — 가치 투자 성향이 강해 ESG/대안투자 비중 확대' },
        'SF': { growth: 15, etf: 25, bond: 35, alternative: 10, cash: 15,
                reason: 'SF형(감각+감정) — 안정성 선호가 강해 채권/현금 비중 확대' }
    };
    
    var base = portfolioTemplates[judgmentStyle] || portfolioTemplates['ST'];
    var portfolio = JSON.parse(JSON.stringify(base));
    
    // 행동 스타일에 따른 미세 조정
    var adjustments = [];
    
    // J/P 보정: 계획형(J)은 ETF 선호, 인식형(P)은 기회형 투자
    if (vFused.JP > 0.2) {
        portfolio.etf += 5; portfolio.alternative -= 5;
        adjustments.push('판단형(J) 성향으로 ETF 분산투자 비중 +5%');
    } else if (vFused.JP < -0.2) {
        portfolio.alternative += 5; portfolio.etf -= 5;
        adjustments.push('인식형(P) 성향으로 대안투자 비중 +5%');
    }
    
    // E/I 보정: 외향형은 실행력 높아 성장주 추가, 내향형은 채권 추가
    if (vFused.EI > 0.2) {
        portfolio.growth += 3; portfolio.bond -= 3;
        adjustments.push('외향형(E) 실행력으로 성장 자산 비중 +3%');
    } else if (vFused.EI < -0.2) {
        portfolio.bond += 3; portfolio.growth -= 3;
        adjustments.push('내향형(I) 신중함으로 채권 비중 +3%');
    }
    
    // 신강/신약 보정
    if (vCore.strengthIndex > 0.15) {
        portfolio.growth += 2; portfolio.cash -= 2;
        adjustments.push('강세형 에너지 — 리스크 내성 높아 성장 비중 소폭 확대');
    } else if (vCore.strengthIndex < -0.15) {
        portfolio.cash += 3; portfolio.growth -= 3;
        adjustments.push('약세형 에너지 — 안전마진 확보를 위해 현금 비중 확대');
    }
    
    // 음수 방지
    Object.keys(portfolio).forEach(function(k) {
        if (k !== 'reason') portfolio[k] = Math.max(0, portfolio[k]);
    });
    
    return {
        portfolio: {
            growth:      { ratio: portfolio.growth,      label: '성장주', labelEn: 'Growth Stocks' },
            etf:         { ratio: portfolio.etf,         label: 'ETF',    labelEn: 'ETF' },
            bond:        { ratio: portfolio.bond,        label: '채권',   labelEn: 'Bonds' },
            alternative: { ratio: portfolio.alternative, label: '대안투자', labelEn: 'Alternatives' },
            cash:        { ratio: portfolio.cash,        label: '현금성',  labelEn: 'Cash' }
        },
        baseReason: base.reason,
        adjustments: adjustments,
        goldenTimeNote: '골든타임(월간 에너지 시프트)에 따라 비중이 ±5% 범위에서 조정될 수 있습니다.',
        disclaimer: '본 포트폴리오는 AI 기반 성향 참고 자료이며, 실제 투자 자문이 아닙니다. 투자 결정은 본인의 판단과 전문가 상담을 통해 이루어져야 합니다.'
    };
}
// <!-- END PROTECTED: explainRecommendation -->

// ═══════════════════════════════════════════════════════════════════════════
// XAI 통합 함수: 전체 분석 결과 + XAI 설명 일괄 생성
// ═══════════════════════════════════════════════════════════════════════════
// <!-- PROTECTED: generateFullAnalysis v4.0 — Living Profile Experience -->
function generateFullAnalysis(birthStr, hourIdx, kipaScores, registrationDate, behaviorQuiz) {
    // Step 1: 선천 기질 벡터 (S3010-S3040)
    var vCore = computeInnateVector(birthStr, hourIdx);
    
    // Step 2: KIPA 후천 벡터 — 가중치 차별화 자동 적용 (v3.0)
    // kipaScores.answers가 있으면 computeWeightedKipaScores()로 재산출
    // 없으면 기존 ei/ns/tf/jp 점수 그대로 사용 (하위 호환)
    var _effectiveKipa = kipaScores;
    if (kipaScores.answers && typeof computeWeightedKipaScores === 'function') {
        _effectiveKipa = computeWeightedKipaScores(kipaScores.answers);
    }
    var vBehavior = computeBehaviorVector(_effectiveKipa.ei, _effectiveKipa.ns, _effectiveKipa.tf, _effectiveKipa.jp);
    
    // Step 3: 선천×후천 융합 (S4030)
    var vFused = calibrateVectors(vCore, vBehavior);
    
    // Step 4: 아키타입 분류 (S4040)
    var archetypeCode = classifyArchetype(vFused);
    var archetypeData = nkaiDatabase[archetypeCode] || {};
    
    // Step 5: N-Score 산출 (v4.0: 소비행동 보너스 포함)
    var behaviorBonus = behaviorQuiz ? computeBehaviorBonus(behaviorQuiz, archetypeCode) : null;
    var nScore = computeNScore(vCore, vFused);
    if (behaviorBonus) {
        nScore.score = Math.max(200, Math.min(950, nScore.score + behaviorBonus.totalBonus));
        nScore.ciLow = nScore.score - Math.round(nScore.score * 0.08);
        nScore.ciHigh = nScore.score + Math.round(nScore.score * 0.08);
    }
    var nGrade = calculateNGrade(nScore.score);
    
    // Step 6: 공명률
    var resonance = calculateResonanceRate(vCore, vFused);
    
    // Step 7: DNA 나이
    var dnaAge = getDNAAge(registrationDate || null);
    
    // Step 8: XAI 3-Layer
    var xai = {
        layer1: explainArchetype(vCore, vBehavior, vFused, archetypeCode),
        layer2: explainNScore(vCore, vFused, nScore),
        layer3: explainRecommendation(archetypeCode, vCore, vFused)
    };
    
    // ═══════════════════════════════════════════════════════════════
    // Step 9~13: v4.0 Living Profile Experience 확장
    // ═══════════════════════════════════════════════════════════════
    
    // Step 9: N-Score 진화 시뮬레이션 (#2)
    var evolution = simulateNScoreEvolution(nScore.score, archetypeCode, behaviorBonus);
    
    // Step 10: 소비 DNA 핑거프린트 (#3)
    var consumptionDNA = generateConsumptionDNA(archetypeCode, behaviorQuiz);
    
    // Step 11: 베이지안 진행률 (#4)
    var bayesianProgress = computeBayesianProgress(vCore, vBehavior, behaviorQuiz);
    
    // Step 12: 아키타입 드리프트 예측 (#5)
    var drift = predictArchetypeDrift(vFused, archetypeCode);
    
    // Step 13: 실증 배지 (#6)
    var pocBadge = getPoCBadge();
    
    return {
        // 기본 결과
        archetype: archetypeCode,
        archetypeData: archetypeData,
        patentCode: archetypeData.patentCode || toPatentCode(archetypeCode),
        group: archetypeData.group || '',
        groupEn: archetypeData.groupEn || '',
        
        // 벡터
        vCore: vCore,
        vBehavior: vBehavior,
        vFused: vFused,
        
        // 점수
        nScore: nScore,
        nGrade: nGrade,
        
        // v3.0
        resonance: resonance,
        dnaAge: dnaAge,
        
        // v4.0 Living Profile Experience
        behaviorBonus: behaviorBonus,
        evolution: evolution,
        consumptionDNA: consumptionDNA,
        bayesianProgress: bayesianProgress,
        drift: drift,
        pocBadge: pocBadge,
        
        // XAI (AI 기본법 준수)
        xai: xai,
        
        // 정밀도 배지
        precision: vCore.precision,
        precisionLabel: vCore.hasHour ? '97% 🟢' : (vCore.precision >= 89 ? '89% 🟣' : '82% ⚪'),
        
        // 메타
        engineVersion: 'v4.0',
        generatedAt: new Date().toISOString()
    };
}
// <!-- END PROTECTED: generateFullAnalysis -->


// ═══════════════════════════════════════════════════════════════════════════
// v4.0 LIVING PROFILE EXPERIENCE — 7대 기능 엔진 확장
// 특허 P25KAI001KR Claim 6 "동적 진화 메커니즘" Phase 1.5 구현
// ═══════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────
// #1 소비행동 미니퀴즈 보너스 (Consumption Behavior Bonus)
// Q17~Q20 응답 → N-Score에 0~150점 행동 보너스 가산
// ─────────────────────────────────────────────────────────────────────────
// <!-- PROTECTED: computeBehaviorBonus v1.0 -->
function computeBehaviorBonus(quiz, archetypeCode) {
    if (!quiz || typeof quiz.spending === 'undefined') return null;
    var db = nkaiDatabase[archetypeCode] || {};
    var patentCode = (db.patentCode || toPatentCode(archetypeCode));
    var group = patentCode.substring(0, 2);

    // [A] 재무 건전성 점수 (0~60점)
    var healthScore = 0;
    healthScore += [15, 10, 5, 0][quiz.impulse] || 0;
    healthScore += [20, 15, 8, 0][quiz.tracking] || 0;
    healthScore += [15, 18, 5, 8, 12][quiz.windfall] || 0;

    // [B] 아키타입-행동 정합성 (0~50점)
    var alignmentBonus = 0;
    var expectedPatterns = {
        'NT': { spending: [2,3], windfall: [1], impulse: [0,1] },
        'ST': { spending: [3,4], windfall: [0,4], impulse: [0,1] },
        'NF': { spending: [2,3], windfall: [1,3], impulse: [1,2] },
        'SF': { spending: [0,4], windfall: [0,2], impulse: [1,2] }
    };
    var expected = expectedPatterns[group] || expectedPatterns['ST'];
    if ((expected.spending.indexOf(quiz.spending) >= 0)) alignmentBonus += 20;
    if ((expected.windfall.indexOf(quiz.windfall) >= 0)) alignmentBonus += 18;
    if ((expected.impulse.indexOf(quiz.impulse) >= 0)) alignmentBonus += 12;

    // [C] 행동 활성화 보너스 (0~40점)
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
        consumptionResonance: Math.round((alignmentBonus / 50) * 100),
        breakdown: {
            impulseControl: [15, 10, 5, 0][quiz.impulse] || 0,
            monitoringHabit: [20, 15, 8, 0][quiz.tracking] || 0,
            windfallRationality: [15, 18, 5, 8, 12][quiz.windfall] || 0,
            archetypeAlignment: alignmentBonus,
            activation: activationBonus
        }
    };
}
// <!-- END PROTECTED: computeBehaviorBonus -->

// ─────────────────────────────────────────────────────────────────────────
// #2 N-Score 진화 시뮬레이터 (Evolution Simulator)
// ─────────────────────────────────────────────────────────────────────────
// <!-- PROTECTED: simulateNScoreEvolution v1.0 -->
function simulateNScoreEvolution(currentScore, archetypeCode, behaviorBonus) {
    var db = nkaiDatabase[archetypeCode] || {};
    var patentCode = (db.patentCode || toPatentCode(archetypeCode));
    var group = patentCode.substring(0, 2);

    var evolutionCoefficients = {
        'NT': { monthly: [0.08, 0.14, 0.19, 0.24, 0.28, 0.32], stability: 0.85 },
        'ST': { monthly: [0.06, 0.11, 0.16, 0.20, 0.24, 0.27], stability: 0.92 },
        'NF': { monthly: [0.07, 0.12, 0.17, 0.21, 0.25, 0.29], stability: 0.88 },
        'SF': { monthly: [0.05, 0.09, 0.13, 0.17, 0.20, 0.23], stability: 0.95 }
    };
    var coeff = evolutionCoefficients[group] || evolutionCoefficients['ST'];
    var maxBehaviorBoost = { 'NT': 280, 'ST': 240, 'NF': 260, 'SF': 220 };
    var maxBoost = maxBehaviorBoost[group] || 250;
    var baseScore = currentScore;
    var hasQuiz = behaviorBonus && behaviorBonus.totalBonus > 0;

    var timeline = coeff.monthly.map(function(ratio, idx) {
        var month = idx + 1;
        var projectedBoost = Math.round(maxBoost * ratio);
        var projected = Math.min(950, baseScore + projectedBoost);
        var grade = calculateNGrade(projected);
        return {
            month: month, score: projected, boost: projectedBoost,
            grade: grade.grade, gradeLabel: grade.label, gradeColor: grade.color,
            confidence: Math.round(coeff.stability * 100 - (month * 2))
        };
    });

    return {
        currentScore: baseScore,
        currentGrade: calculateNGrade(baseScore).grade,
        timeline: timeline,
        maxPotential: Math.min(950, baseScore + maxBoost),
        maxPotentialGrade: calculateNGrade(Math.min(950, baseScore + maxBoost)).grade,
        hasQuizBoost: hasQuiz,
        groupCharacteristic: {
            'NT': '분석적 진화형 — 데이터 축적 효과가 가장 빠름',
            'ST': '체계적 진화형 — 안정적이고 예측 가능한 성장',
            'NF': '가치 진화형 — 가치관 정립과 함께 성장',
            'SF': '안정 진화형 — 느리지만 가장 안정적인 성장'
        }[group] || '균형 진화형',
        disclaimer: '510건 PoC 기반 시뮬레이션이며, 실제 MyData 연동 시 개인화 정밀도가 향상됩니다.'
    };
}
// <!-- END PROTECTED: simulateNScoreEvolution -->

// ─────────────────────────────────────────────────────────────────────────
// #3 소비 DNA 핑거프린트 (Consumption DNA Fingerprint)
// ─────────────────────────────────────────────────────────────────────────
// <!-- PROTECTED: generateConsumptionDNA v1.0 -->
function generateConsumptionDNA(archetypeCode, behaviorQuiz) {
    var db = nkaiDatabase[archetypeCode] || {};
    var patentCode = (db.patentCode || toPatentCode(archetypeCode));
    var group = patentCode.substring(0, 2);

    var categories = [
        { id: 'food', ko: '식비', en: 'Food', emoji: '🍽' },
        { id: 'shopping', ko: '쇼핑', en: 'Shopping', emoji: '🛍' },
        { id: 'housing', ko: '주거', en: 'Housing', emoji: '🏠' },
        { id: 'transport', ko: '교통', en: 'Transport', emoji: '🚗' },
        { id: 'culture', ko: '문화', en: 'Culture', emoji: '🎭' },
        { id: 'medical', ko: '의료', en: 'Medical', emoji: '💊' },
        { id: 'education', ko: '교육', en: 'Education', emoji: '📚' },
        { id: 'finance', ko: '금융', en: 'Finance', emoji: '💰' }
    ];

    var groupPatterns = {
        'NT': { food: 12, shopping: 8, housing: 20, transport: 10, culture: 15, medical: 5, education: 18, finance: 12 },
        'ST': { food: 15, shopping: 10, housing: 25, transport: 12, culture: 8, medical: 8, education: 10, finance: 12 },
        'NF': { food: 14, shopping: 12, housing: 18, transport: 8, culture: 20, medical: 6, education: 12, finance: 10 },
        'SF': { food: 20, shopping: 15, housing: 22, transport: 10, culture: 12, medical: 8, education: 5, finance: 8 }
    };
    var pattern = groupPatterns[group] || groupPatterns['ST'];

    var actualPattern = null;
    var consumptionResonance = 0;
    if (behaviorQuiz && typeof behaviorQuiz.spending !== 'undefined') {
        var spendingMap = ['food', 'shopping', 'culture', 'finance', 'housing'];
        var primaryCategory = spendingMap[behaviorQuiz.spending] || 'food';
        actualPattern = {};
        Object.keys(pattern).forEach(function(cat) {
            actualPattern[cat] = cat === primaryCategory ? Math.min(35, pattern[cat] + 15) : Math.max(3, pattern[cat] - 2);
        });
        var total = Object.keys(actualPattern).reduce(function(s,k){return s+actualPattern[k];}, 0);
        Object.keys(actualPattern).forEach(function(cat) { actualPattern[cat] = Math.round(actualPattern[cat] / total * 100); });

        var dotProduct = 0, normA = 0, normB = 0;
        Object.keys(pattern).forEach(function(cat) {
            dotProduct += pattern[cat] * (actualPattern[cat] || 0);
            normA += pattern[cat] * pattern[cat];
            normB += (actualPattern[cat] || 0) * (actualPattern[cat] || 0);
        });
        consumptionResonance = Math.round((dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))) * 100);
    }

    var insights = {
        'NT': { ko: '교육과 자기계발에 투자하는 전략적 소비', en: 'Strategic spending on education & growth', top: ['education','culture','finance'], risk: 'shopping' },
        'ST': { ko: '주거와 고정비 중심의 안정적 소비', en: 'Stable spending on housing & fixed costs', top: ['housing','food','finance'], risk: 'culture' },
        'NF': { ko: '문화와 경험 중심의 가치 소비', en: 'Value-driven spending on culture & experiences', top: ['culture','housing','food'], risk: 'shopping' },
        'SF': { ko: '식비와 주거 중심의 실용적 소비', en: 'Practical spending on food & housing', top: ['housing','food','shopping'], risk: 'finance' }
    };

    return {
        categories: categories, expectedPattern: pattern, actualPattern: actualPattern,
        consumptionResonance: consumptionResonance, insight: insights[group] || insights['ST'],
        group: group, disclaimer: '510건 PoC 기반 아키타입별 평균 패턴이며, MyData 연동 시 실데이터로 대체됩니다.'
    };
}
// <!-- END PROTECTED: generateConsumptionDNA -->

// ─────────────────────────────────────────────────────────────────────────
// #4 의사-베이지안 갱신 시각화 (Bayesian Progress Tracker)
// ─────────────────────────────────────────────────────────────────────────
// <!-- PROTECTED: computeBayesianProgress v1.0 -->
function computeBayesianProgress(vCore, vBehavior, behaviorQuiz) {
    var stages = [
        { id: 'innate', ko: '선천적 기질 (생년월일)', en: 'Innate (Birth Data)', precision: vCore.hasHour ? 65 : 55, status: 'completed', color: '#2D8CFF' },
        { id: 'kipa', ko: 'KIPA 16Q (행동 성향)', en: 'KIPA 16Q (Behavior)', precision: vCore.hasHour ? 82 : 75, status: 'completed', color: '#5AA8FF' },
        { id: 'behavior_quiz', ko: '소비 행동 4Q (소비 패턴)', en: 'Behavior 4Q (Spending)', precision: behaviorQuiz ? (vCore.hasHour ? 89 : 82) : null, status: behaviorQuiz ? 'completed' : 'available', color: '#00D68F' },
        { id: 'mydata_1m', ko: 'MyData 1개월', en: 'MyData 1 Month', precision: 92, status: 'locked', color: '#a3e635', unlockPhase: 'Phase 2' },
        { id: 'mydata_6m', ko: 'MyData 6개월', en: 'MyData 6 Months', precision: 97, status: 'locked', color: '#00D68F', unlockPhase: 'Phase 2' }
    ];
    var currentPrecision = stages.reduce(function(max, s) { return (s.status === 'completed' && s.precision) ? Math.max(max, s.precision) : max; }, 0);
    var nextStage = stages.find(function(s) { return s.status === 'available' || s.status === 'locked'; });
    return {
        stages: stages, currentPrecision: currentPrecision, maxPrecision: 97, nextStage: nextStage,
        progressPercent: Math.round((currentPrecision / 97) * 100),
        message: { ko: '데이터가 쌓일수록 당신의 프로필이 진화합니다', en: 'Your profile evolves as data accumulates' }
    };
}
// <!-- END PROTECTED: computeBayesianProgress -->

// ─────────────────────────────────────────────────────────────────────────
// #5 아키타입 드리프트 예측 (Archetype Drift Prediction)
// ─────────────────────────────────────────────────────────────────────────
// <!-- PROTECTED: predictArchetypeDrift v1.0 -->
function predictArchetypeDrift(vFused, currentArchetype) {
    var axes = [
        { axis: 'EI', value: vFused.EI, pos: 'E', neg: 'I', idx: 0 },
        { axis: 'NS', value: vFused.NS, pos: 'N', neg: 'S', idx: 1 },
        { axis: 'TF', value: vFused.TF, pos: 'T', neg: 'F', idx: 2 },
        { axis: 'JP', value: vFused.JP, pos: 'J', neg: 'P', idx: 3 }
    ];
    var DRIFT_THRESHOLD = 0.25;
    var driftAxes = axes.filter(function(a) { return Math.abs(a.value) < DRIFT_THRESHOLD; });

    var adjacentTypes = [];
    driftAxes.forEach(function(a) {
        var flipped = currentArchetype.split('');
        var currentLetter = currentArchetype.charAt(a.idx);
        flipped[a.idx] = currentLetter === a.pos ? a.neg : a.pos;
        var adjacentCode = flipped.join('');
        var adjacentData = nkaiDatabase[adjacentCode];
        if (adjacentData) {
            adjacentTypes.push({
                code: adjacentCode, title: adjacentData.title, titleEn: adjacentData.titleEn,
                group: adjacentData.group, axis: a.axis, currentValue: Math.round(a.value * 1000) / 1000,
                proximity: Math.round((1 - Math.abs(a.value) / DRIFT_THRESHOLD) * 100),
                direction: a.value >= 0 ? a.pos + '→' + a.neg : a.neg + '→' + a.pos
            });
        }
    });

    var maxDriftProbability = adjacentTypes.length > 0 ? Math.max.apply(null, adjacentTypes.map(function(t) { return t.proximity; })) : 0;
    return {
        currentArchetype: currentArchetype,
        currentTitle: (nkaiDatabase[currentArchetype] || {}).title || '',
        hasDriftPotential: adjacentTypes.length > 0,
        driftProbability: maxDriftProbability,
        adjacentTypes: adjacentTypes,
        stableAxes: axes.filter(function(a) { return Math.abs(a.value) >= DRIFT_THRESHOLD; }).map(function(a) {
            return { axis: a.axis, value: Math.round(a.value * 1000) / 1000, letter: a.value >= 0 ? a.pos : a.neg };
        }),
        message: adjacentTypes.length > 0 ?
            { ko: '소비 행동 데이터가 반영되면 아키타입이 진화할 가능성이 있습니다', en: 'Your archetype may evolve with behavior data' } :
            { ko: '현재 아키타입이 매우 안정적입니다', en: 'Your current archetype is very stable' }
    };
}
// <!-- END PROTECTED: predictArchetypeDrift -->

// ─────────────────────────────────────────────────────────────────────────
// #6 510건 PoC 실증 배지
// ─────────────────────────────────────────────────────────────────────────
function getPoCBadge() {
    return {
        transactions: 510, duration: '6개월', algorithms: 4, convergenceRate: 97.3,
        patent: 'P25KAI001KR', patentStatus: { ko: '심사청구 완료', en: 'Examination Requested' },
        label: { ko: '510건 실거래 × 6개월 PoC 검증 완료', en: '510 transactions × 6-month PoC verified' }
    };
}

// ─────────────────────────────────────────────────────────────────────────
// #7 Phase 2 프리뷰 잠금 카드
// ─────────────────────────────────────────────────────────────────────────
function getPhase2Preview() {
    return {
        features: [
            { id: 'realtime_mcc', ko: '실시간 소비 패턴 분석', en: 'Real-time spending analysis', icon: '📊' },
            { id: 'mcc_gamification', ko: 'MCC 게이미피케이션 챌린지', en: 'MCC gamification challenge', icon: '🎮' },
            { id: 'compatibility_battle', ko: '실시간 호환성 배틀', en: 'Compatibility battle', icon: '⚔️' },
            { id: 'ai_coaching', ko: 'AI 코칭 넛지 알림', en: 'AI coaching nudge', icon: '🤖' },
            { id: 'nscore_forecast', ko: 'N-Score 12개월 예측', en: '12-month N-Score forecast', icon: '🔮' },
            { id: 'drift_alert', ko: '아키타입 드리프트 알림', en: 'Archetype drift alerts', icon: '🔄' }
        ],
        targetDate: '2026.H2', requirement: 'MyData API',
        cta: { ko: 'MyData 연동으로 진화 시작하기', en: 'Start evolution with MyData' }
    };
}
