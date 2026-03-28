// ============================================================
//  N-KAI 리포트 개편 v2.0 — 초등학생도 이해 + 냉철한 인사이트
//  쉬운 말 + 냉철한 숫자 | 2026-03-27 by Kai
//  ※ ES5 문법 전용 (const/let/arrow function 사용 금지)
// ============================================================

// ─────────────────────────────────────────
// 1. N-Score 언어 순화 함수
// ─────────────────────────────────────────
function getNScoreSimpleText(nScore) {
  var percentile = Math.round(100 - (nScore / 10));
  var strongerThan = Math.max(1, Math.min(99, 100 - percentile));
  var grade = '';
  if (nScore >= 900) { grade = '상위 5% 🏆'; }
  else if (nScore >= 800) { grade = '상위 15% 🥇'; }
  else if (nScore >= 700) { grade = '상위 30% 🥈'; }
  else if (nScore >= 600) { grade = '상위 50% 🥉'; }
  else if (nScore >= 500) { grade = '평균 수준'; }
  else { grade = '성장 중 💪'; }

  return {
    score: nScore,
    simple: nScore + '점 — 100명 중 ' + strongerThan + '번째로 강한 사람',
    grade: grade,
    raw: strongerThan
  };
}

// ─────────────────────────────────────────
// 2. 3대 지표 언어 순화
// ─────────────────────────────────────────
var INDICATOR_LABELS = {
  economic: {
    icon: '💰',
    name: '돈 버는 감각',
    highMsg: '돈 냄새를 잘 맡는 편. 단 감각만 믿다 실패하는 패턴 주의',
    lowMsg:  '분석형 지출 패턴. 충동 소비 없음. 새로운 기회엔 좀 더 과감해도 됨',
    color: '#2D8CFF'
  },
  expression: {
    icon: '⚡',
    name: '행동 에너지',
    highMsg: '실행력 강함. 빠른 결정이 장점이자 위험. 멈추는 연습 필요',
    lowMsg:  '생각은 많은데 실행이 느림. 오늘 못 하면 내일도 못 함',
    color: '#5AA8FF'
  },
  risk: {
    icon: '🛡️',
    name: '위기 버티는 힘',
    highMsg: '웬만한 충격엔 안 흔들림. 위기 때 오히려 기회를 잡는 타입',
    lowMsg:  '변동성에 취약. 안전자산 비중 높게 유지하는 것이 맞음',
    color: '#00D68F'
  }
};

function getIndicatorMessage(type, score) {
  var label = INDICATOR_LABELS[type];
  var isHigh = score >= 60;
  var rankText = score >= 80 ? '상위 10%' : score >= 60 ? '상위 30%' : score >= 40 ? '평균' : '하위 30%';
  return {
    icon: label.icon,
    name: label.name,
    score: score,
    rankText: rankText,
    message: isHigh ? label.highMsg : label.lowMsg,
    color: label.color
  };
}

// ─────────────────────────────────────────
// 3. 골든타임 언어 순화
// ─────────────────────────────────────────
function getGoldenTimeSimpleText(goldenTimeData) {
  if (!goldenTimeData) { return null; }
  var isGood = goldenTimeData.phase === 'peak' || goldenTimeData.score >= 70;
  return {
    badge: isGood ? '⭐ 지금이 기회입니다' : '⚠️ 신중한 시기입니다',
    action: isGood
      ? '새로운 계약·투자 결정하기 좋은 달. 단 충동적 큰 지출은 다음 달까지 참을 것'
      : '큰 결정은 다음 달로 미룰 것. 기존 자산 지키는 데 집중',
    color: isGood ? '#00D68F' : '#FF6B6B'
  };
}

// ─────────────────────────────────────────
// 4. 아키타입 언어 순화
// ─────────────────────────────────────────
var ARCHETYPE_SIMPLE = {
  'ENTJ': { name: '전략가',    strength: '큰 그림을 봄',          trap: '완벽하게 준비되면... 이라는 말이 가장 비싼 핑계' },
  'INTJ': { name: '설계자',    strength: '체계적 계획의 달인',      trap: '분석에 너무 오래 걸려 기회를 놓침' },
  'ENTP': { name: '발명가',    strength: '새 기회를 먼저 발견',     trap: '아이디어만 많고 실행이 약함' },
  'INTP': { name: '사색가',    strength: '깊이 있는 분석',          trap: '결정을 너무 오래 미룸' },
  'ENFJ': { name: '선도자',    strength: '사람과 돈을 함께 움직임', trap: '남을 위해 내 자산을 희생하는 패턴' },
  'INFJ': { name: '통찰가',    strength: '트렌드를 미리 읽음',      trap: '직감을 믿다 데이터를 무시함' },
  'ENFP': { name: '활동가',    strength: '새로운 시장을 만듦',      trap: '충동적 소비와 투자를 반복' },
  'INFP': { name: '이상가',    strength: '가치 중심 소비',          trap: '수익성보다 의미를 너무 중시' },
  'ESTJ': { name: '관리자',    strength: '체계적 자산 관리',        trap: '너무 보수적이라 수익 기회를 놓침' },
  'ISTJ': { name: '검사관',    strength: '안정적 장기 투자',        trap: '변화를 너무 늦게 받아들임' },
  'ESFJ': { name: '집정관',    strength: '신뢰 기반 네트워크 자산', trap: '주변 눈치 보느라 결정이 늦음' },
  'ISFJ': { name: '수호자',    strength: '리스크 최소화의 달인',    trap: '너무 안전만 추구해 자산이 안 자람' },
  'ESTP': { name: '사업가',    strength: '빠른 실행과 수익화',      trap: '장기 계획 없이 단기 수익만 쫓음' },
  'ISTP': { name: '장인',      strength: '실용적 투자 판단',        trap: '감정 없는 판단이 관계 비용 증가' },
  'ESFP': { name: '연예인',    strength: '소비가 곧 마케팅',        trap: '현재 소비 중심 — 미래 대비 부족' },
  'ISFP': { name: '모험가',    strength: '직관적 가치 투자',        trap: '수익보다 경험에 과투자' }
};

function getArchetypeSimpleText(archetypeCode) {
  var data = ARCHETYPE_SIMPLE[archetypeCode] || { name: archetypeCode, strength: '균형잡힌 성향', trap: '방향성을 좀 더 명확히 할 것' };
  return {
    code: archetypeCode,
    name: '당신의 금융 성격: ' + data.name,
    strength: '💪 강점: ' + data.strength,
    trap: '⚠️ 함정: ' + data.trap
  };
}

// ─────────────────────────────────────────
// 5. 5단계 공식 자동 생성
// ─────────────────────────────────────────
function generate5StepInsight(type, score, archetypeCode) {
  var insights = {
    economic: {
      conclusion:  score >= 60 ? '돈 버는 감각이 날카롭습니다' : '안정 지향형 소비 패턴입니다',
      data:        '경제감각 ' + score + '점 — 상위 ' + Math.round((100 - score)) + '%',
      doNow:       score >= 60 ? '이번 달 새로운 수익 채널 1개 탐색' : '고정 지출 1개 줄이기',
      doNot:       score >= 60 ? '감각만 믿고 데이터 없이 큰 결정 금지' : '조급한 마음에 남 따라 투자 금지',
      nextMonth:   score >= 60 ? '투자 포트폴리오 리밸런싱 시기' : '저축률 5% 높이기 도전'
    },
    expression: {
      conclusion:  score >= 60 ? '행동력이 강한 실행가입니다' : '신중한 준비형입니다',
      data:        '행동에너지 ' + score + '점 — 실행 속도 ' + (score >= 60 ? '빠름' : '느림'),
      doNow:       score >= 60 ? '지금 미루고 있는 결정 1개 오늘 실행' : '작은 것부터 1개 즉시 실행',
      doNot:       score >= 60 ? '충동적 결정 전 24시간 기다리기' : '완벽한 준비 기다리다 기회 놓치지 말기',
      nextMonth:   score >= 60 ? '실행 속도 유지하되 방향성 점검' : '실행 근육 키우는 달'
    },
    risk: {
      conclusion:  score >= 60 ? '위기에 강한 사람입니다' : '안전을 선호하는 타입입니다',
      data:        '위기대응력 ' + score + '점 — 시장 하락 시 침착도 ' + (score >= 60 ? '상위권' : '보완 필요'),
      doNow:       score >= 60 ? '위기 대비 비상금 6개월치 확인' : '변동성 낮은 자산 비중 높이기',
      doNot:       score >= 60 ? '강한 멘탈 믿고 과도한 리스크 테이킹 금지' : '공포에 휩쓸려 자산 매도 금지',
      nextMonth:   score >= 60 ? '공격적 투자 비중 점진적 확대 검토' : '안전자산 포트폴리오 정비'
    }
  };

  var insight = insights[type];
  return insight ? [
    '📌 ' + insight.conclusion,
    '📊 ' + insight.data,
    '✅ 지금 당장: ' + insight.doNow,
    '❌ 절대 금지: ' + insight.doNot,
    '📅 다음 달 예고: ' + insight.nextMonth
  ] : [];
}

// ─────────────────────────────────────────
// 6. 1장 요약 카드 HTML 렌더링
// ─────────────────────────────────────────
function renderSummaryCard(data) {
  var nScore   = data.nScore || 726;
  var economic = data.economic || 68;
  var expression = data.expression || 42;
  var risk     = data.risk || 87;
  var archetype = data.archetype || 'ESTJ';
  var name     = data.name || '고객';
  var goldenTime = data.goldenTime || null;

  var scoreInfo = getNScoreSimpleText(nScore);
  var archetypeInfo = getArchetypeSimpleText(archetype);
  var goldenInfo = getGoldenTimeSimpleText(goldenTime);

  var html = '<div class="nkai-summary-card" translate="no">';

  // 헤더
  html += '<div class="nsc-header">';
  html += '<p class="nsc-title">' + name + '님의 금융 DNA</p>';
  html += '<div class="nsc-score">';
  html += '<span class="nsc-score-num">' + nScore + '점</span>';
  html += '<span class="nsc-score-grade">' + scoreInfo.grade + '</span>';
  html += '</div>';
  html += '<p class="nsc-score-desc">' + scoreInfo.simple + '</p>';
  html += '</div>';

  // 3대 지표
  html += '<div class="nsc-indicators">';
  var indicators = [
    { type: 'economic',   score: economic },
    { type: 'expression', score: expression },
    { type: 'risk',       score: risk }
  ];
  for (var i = 0; i < indicators.length; i++) {
    var ind = getIndicatorMessage(indicators[i].type, indicators[i].score);
    html += '<div class="nsc-ind-item">';
    html += '<span class="nsc-ind-icon" style="color:' + ind.color + '">' + ind.icon + '</span>';
    html += '<span class="nsc-ind-name">' + ind.name + '</span>';
    html += '<span class="nsc-ind-score" style="color:' + ind.color + '">' + ind.score + '</span>';
    html += '<span class="nsc-ind-rank">' + ind.rankText + '</span>';
    html += '</div>';
  }
  html += '</div>';

  // 아키타입
  html += '<div class="nsc-archetype">';
  html += '<p class="nsc-arch-name">' + archetypeInfo.name + '</p>';
  html += '<p class="nsc-arch-strength">' + archetypeInfo.strength + '</p>';
  html += '<p class="nsc-arch-trap">' + archetypeInfo.trap + '</p>';
  html += '</div>';

  // 골든타임
  if (goldenInfo) {
    html += '<div class="nsc-golden" style="border-color:' + goldenInfo.color + '">';
    html += '<p class="nsc-golden-badge" style="color:' + goldenInfo.color + '">' + goldenInfo.badge + '</p>';
    html += '<p class="nsc-golden-action">' + goldenInfo.action + '</p>';
    html += '</div>';
  }

  // 킬링 카피
  html += '<p class="nsc-tagline">MBTI는 입이 말하고 N-KAI는 지갑이 말한다</p>';

  // CTA
  html += '<button class="nsc-cta" onclick="showFullReport()">';
  html += '전체 리포트 보기 →</button>';

  html += '</div>';
  return html;
}

// ─────────────────────────────────────────
// 7. CSS (index.html <style>에 추가)
// ─────────────────────────────────────────
var SUMMARY_CARD_CSS = '\n' +
'.nkai-summary-card{background:linear-gradient(135deg,#0a0f1e 0%,#0d1530 100%);border:1px solid rgba(45,140,255,0.3);border-radius:20px;padding:28px 24px;max-width:420px;margin:0 auto;font-family:inherit;color:#fff;}\n' +
'.nsc-header{text-align:center;margin-bottom:20px;}\n' +
'.nsc-title{font-size:14px;color:#8899BB;margin:0 0 8px;}\n' +
'.nsc-score{display:flex;align-items:center;justify-content:center;gap:12px;}\n' +
'.nsc-score-num{font-size:48px;font-weight:900;color:#2D8CFF;line-height:1;}\n' +
'.nsc-score-grade{font-size:16px;font-weight:700;color:#00D68F;}\n' +
'.nsc-score-desc{font-size:13px;color:#AAC0E0;margin:8px 0 0;}\n' +
'.nsc-indicators{display:flex;flex-direction:column;gap:10px;margin:20px 0;padding:16px;background:rgba(255,255,255,0.04);border-radius:12px;}\n' +
'.nsc-ind-item{display:grid;grid-template-columns:28px 1fr 36px 64px;align-items:center;gap:8px;}\n' +
'.nsc-ind-icon{font-size:18px;}\n' +
'.nsc-ind-name{font-size:13px;font-weight:600;}\n' +
'.nsc-ind-score{font-size:18px;font-weight:800;text-align:right;}\n' +
'.nsc-ind-rank{font-size:11px;color:#8899BB;text-align:right;}\n' +
'.nsc-archetype{background:rgba(45,140,255,0.08);border-left:3px solid #2D8CFF;border-radius:8px;padding:14px 16px;margin:16px 0;}\n' +
'.nsc-arch-name{font-size:15px;font-weight:700;margin:0 0 6px;}\n' +
'.nsc-arch-strength{font-size:12px;color:#7AC4FF;margin:0 0 4px;}\n' +
'.nsc-arch-trap{font-size:12px;color:#FFB347;margin:0;}\n' +
'.nsc-golden{border:1px solid;border-radius:10px;padding:12px 16px;margin:16px 0;background:rgba(0,214,143,0.06);}\n' +
'.nsc-golden-badge{font-size:14px;font-weight:700;margin:0 0 6px;}\n' +
'.nsc-golden-action{font-size:12px;color:#CCE8FF;margin:0;}\n' +
'.nsc-tagline{text-align:center;font-size:11px;color:#5570AA;margin:16px 0 12px;font-style:italic;}\n' +
'.nsc-cta{width:100%;padding:14px;background:linear-gradient(135deg,#2D8CFF,#0060E0);border:none;border-radius:12px;color:#fff;font-size:15px;font-weight:700;cursor:pointer;transition:opacity .2s;}\n' +
'.nsc-cta:hover{opacity:.85;}\n';

// ─────────────────────────────────────────
// 8. 드립 시퀀스 이메일 템플릿
// ─────────────────────────────────────────
var DRIP_TEMPLATES = {
  // 분석 완료 즉시
  instant: function(name, nScore, archetype) {
    var scoreInfo = getNScoreSimpleText(nScore);
    var archetypeInfo = getArchetypeSimpleText(archetype);
    return {
      subject: name + '님의 금융 DNA 분석 완료 — ' + scoreInfo.grade,
      body:    name + '님, 분석 완료됐습니다.\n\n' +
               '💡 한 줄 결론: ' + scoreInfo.simple + '\n' +
               archetypeInfo.name + '\n\n' +
               '전체 리포트는 아래에서 확인하세요 👇'
    };
  },
  // D+1: 골든타임
  day1: function(name, goldenTimeData) {
    var g = getGoldenTimeSimpleText(goldenTimeData || { phase: 'peak', score: 75 });
    return {
      subject: name + '님의 이번 달 타이밍 예보 ' + g.badge,
      body:    name + '님, 이번 달 주의사항 알려드립니다.\n\n' +
               g.badge + '\n' + g.action + '\n\n' +
               '더 자세한 골든타임 TOP3 리포트 →'
    };
  },
  // D+3: 아키타입
  day3: function(name, archetype) {
    var a = getArchetypeSimpleText(archetype);
    return {
      subject: name + '님이 ' + a.name.replace('당신의 금융 성격: ', '') + '인 이유',
      body:    name + '님,\n\n' +
               a.name + '\n' +
               a.strength + '\n' +
               a.trap + '\n\n' +
               '지갑 데이터로 증명된 당신의 금융 DNA 전체 보고서 →'
    };
  },
  // D+7: 전체 리포트 CTA
  day7: function(name, nScore) {
    var scoreInfo = getNScoreSimpleText(nScore);
    return {
      subject: '7일 전 분석 이후 ' + name + '님 달라진 게 있나요?',
      body:    name + '님,\n\n' +
               '지난주 분석 이후 골든타임을 얼마나 활용하셨나요?\n\n' +
               '지금 전체 리포트로 업그레이드하시면\n' +
               '✅ 아키타입별 포트폴리오 추천\n' +
               '✅ T-60 위기 선행 신호\n' +
               '✅ 다음 달 행동 예측까지 확인 가능합니다.\n\n' +
               '[전체 리포트 보기 ₩9,900 →]'
    };
  }
};

// ─────────────────────────────────────────
// 9. 오행별 몸 관리 데이터
// ─────────────────────────────────────────
var OHANG_BODY_DATA = {
  '木': {
    emoji: '🌿',
    name: '목(木)',
    body: '간, 눈, 근육, 손발톱',
    skin: '두피·헤어 건강',
    msg: '이번 달 눈 피로가 쌓이기 쉬워요. 스크린 타임을 줄이고 두피 마사지를 꾸준히 해주세요. 근육이 굳기 전에 가볍게 스트레칭을 습관화하세요.',
    caution: '눈 피로 과적, 근육 경직',
    color: '#22c55e'
  },
  '火': {
    emoji: '🔥',
    name: '화(火)',
    body: '심장, 혈관, 소장, 얼굴',
    skin: '안색, 홍조',
    msg: '이번 달 혈압과 심장 두근거림을 주의하세요. 얼굴에 홍조가 올라오기 쉬운 시기입니다. 카페인을 줄이고 충분한 수면을 취하세요.',
    caution: '혈압 상승, 심장 두근거림',
    color: '#ef4444'
  },
  '土': {
    emoji: '🌍',
    name: '토(土)',
    body: '위장, 비장, 소화기, 입술',
    skin: '피부 칙칙함',
    msg: '이번 달 소화기가 예민해질 수 있어요. 밀가루·찬 음식을 줄이고 규칙적으로 드세요. 과식하면 피부까지 칙칙해질 수 있으니 주의하세요.',
    caution: '소화불량, 부종',
    color: '#f59e0b'
  },
  '金': {
    emoji: '💎',
    name: '금(金)',
    body: '폐, 피부, 대장, 코',
    skin: '피부 건조·트러블',
    msg: '이번 달 피부가 예민해질 수 있어요. 보습에 집중하고 폐·호흡기 관리를 신경 쓰세요. 건조한 환경에서는 가습기를 사용하세요.',
    caution: '호흡기 민감, 피부 트러블',
    color: '#6366f1'
  },
  '水': {
    emoji: '💧',
    name: '수(水)',
    body: '신장, 뼈, 귀, 생식기',
    skin: '다크서클, 탈모',
    msg: '이번 달 허리와 뼈 관리가 중요합니다. 다크서클이 짙어지고 탈모가 늘 수 있어요. 수면을 충분히 취하고 과로를 피하세요.',
    caution: '부신 피로, 허리 통증',
    color: '#0ea5e9'
  }
};

// ─────────────────────────────────────────
// 10. 오행별 웰니스 식단 데이터
// ─────────────────────────────────────────
var OHANG_WELLNESS_DATA = {
  '木': {
    emoji: '🥗',
    good: '녹색채소, 식초·레몬(신맛), 보리, 부추',
    avoid: '기름진 음식, 과음',
    recommend: '나물류, 샐러드, 녹즙',
    msg: '이번 달 간과 눈을 위해 녹색채소를 자주 드세요. 나물류나 샐러드에 레몬즙을 더해보세요. 기름진 음식과 음주는 최대한 줄이는 게 좋아요.'
  },
  '火': {
    emoji: '🐟',
    good: '쑥·여주(쓴맛), 토마토, 오메가3, 견과류',
    avoid: '자극적 음식, 카페인 과다',
    recommend: '연어, 호두, 아보카도',
    msg: '이번 달 심장과 혈관을 위해 연어·호두·아보카도를 챙기세요. 오메가3가 풍부한 음식이 혈관을 깨끗하게 해줍니다. 카페인과 자극적인 음식은 줄이세요.'
  },
  '土': {
    emoji: '🍠',
    good: '고구마·호박(단맛), 잡곡, 발효식품',
    avoid: '밀가루, 찬 음식, 폭식',
    recommend: '현미밥, 된장국, 단호박',
    msg: '이번 달 위장을 위해 현미밥과 된장국을 기본으로 드세요. 단호박이나 고구마 같은 단맛 채소가 소화기를 도와줍니다. 밀가루와 찬 음식은 피하세요.'
  },
  '金': {
    emoji: '🍐',
    good: '마늘·생강(매운맛), 배, 도라지, 백합',
    avoid: '건조한 환경, 음주',
    recommend: '배즙, 도라지차, 무',
    msg: '이번 달 폐와 피부가 건조해질 수 있어요. 배즙이나 도라지차 한 잔씩 챙기고, 마늘·생강 요리를 자주 드세요. 음주는 피부 건조를 악화시키니 줄이세요.'
  },
  '水': {
    emoji: '🫘',
    good: '검은콩, 블루베리, 해산물, 적당한 짠맛',
    avoid: '과로, 수면 부족',
    recommend: '검은깨, 미역국, 콩류',
    msg: '이번 달 신장을 위해 검은깨와 미역국을 꾸준히 드세요. 블루베리와 콩류가 신장 기능을 도와줍니다. 과로와 수면 부족은 탈모와 허리에 직결되니 조심하세요.'
  }
};

// ─────────────────────────────────────────
// 11. 지금 할 것 / 조심할 것 렌더링
// ─────────────────────────────────────────
function renderActionRisk(data) {
  var economic   = data.economic   || 50;
  var expression = data.expression || 50;
  var risk       = data.risk       || 50;

  // 가장 높은 지표로 중심 인사이트 결정
  var dominantType = 'economic';
  if (expression >= economic && expression >= risk) { dominantType = 'expression'; }
  else if (risk >= economic && risk >= expression)  { dominantType = 'risk'; }

  var insight = generate5StepInsight(dominantType, data[dominantType === 'economic' ? 'economic' : dominantType === 'expression' ? 'expression' : 'risk'], data.archetype);

  var doNow    = insight[2] ? insight[2].replace('✅ 지금 당장: ', '') : '오늘 재무 목표 1가지 적어보기';
  var doMonth  = insight[4] ? insight[4].replace('📅 다음 달 예고: ', '') : '저축률 점검';
  var doNot    = insight[3] ? insight[3].replace('❌ 절대 금지: ', '') : '충동구매 자제';

  // 골든타임 기반 리스크 경보
  var gtData   = data.goldenTime;
  var riskAlert = (gtData && gtData.phase !== 'peak') ? '큰 결정은 이번 달 미루세요. 기존 자산 지키는 데 집중.' : '이번 달 새로운 기회가 왔을 때 너무 큰 금액을 한 번에 베팅하지 마세요.';

  return '<div class="nkai-action-risk" translate="no">' +
    '<div class="nar-do">' +
      '<p class="nar-label" style="color:#00D68F">✅ 지금 해야 할 것</p>' +
      '<p class="nar-main">' + doNow + '</p>' +
      '<p class="nar-sub">이번 달 집중 → ' + doMonth + '</p>' +
    '</div>' +
    '<div class="nar-dont">' +
      '<p class="nar-label" style="color:#FF6B6B">⛔ 절대 하면 안 되는 것</p>' +
      '<p class="nar-main">' + doNot + '</p>' +
      '<p class="nar-sub">이번 달 리스크 경보 → ' + riskAlert + '</p>' +
    '</div>' +
  '</div>';
}

// ─────────────────────────────────────────
// 12. 오행별 몸 관리 렌더링
// ─────────────────────────────────────────
function renderOhangBody(dayElement) {
  var d = OHANG_BODY_DATA[dayElement] || OHANG_BODY_DATA['土'];
  return '<div class="nkai-ohang-body" translate="no">' +
    '<p class="noh-title">🏥 <span style="color:' + d.color + '">' + d.name + '</span> — 이번 달 몸 관리</p>' +
    '<p class="noh-msg">' + d.msg + '</p>' +
    '<div class="noh-tags">' +
      '<span class="noh-tag-body">🫀 ' + d.body + '</span>' +
      '<span class="noh-tag-skin">✨ ' + d.skin + '</span>' +
      '<span class="noh-tag-warn" style="color:#FF6B6B">⚠️ ' + d.caution + ' 주의</span>' +
    '</div>' +
  '</div>';
}

// ─────────────────────────────────────────
// 13. 오행별 웰니스 식단 렌더링
// ─────────────────────────────────────────
function renderOhangWellness(dayElement) {
  var d = OHANG_WELLNESS_DATA[dayElement] || OHANG_WELLNESS_DATA['土'];
  return '<div class="nkai-ohang-wellness" translate="no">' +
    '<p class="now-title">🥘 이번 달 추천 식단</p>' +
    '<p class="now-msg">' + d.msg + '</p>' +
    '<div class="now-grid">' +
      '<div class="now-item now-good"><p class="now-item-label">✅ 좋은 식품</p><p class="now-item-val">' + d.good + '</p></div>' +
      '<div class="now-item now-avoid"><p class="now-item-label">⛔ 피할 것</p><p class="now-item-val">' + d.avoid + '</p></div>' +
    '</div>' +
    '<p class="now-recommend">' + d.emoji + ' 이번 달 추천: <strong>' + d.recommend + '</strong></p>' +
  '</div>';
}

// ─────────────────────────────────────────
// 14. 오행 섹션 통합 CSS
// ─────────────────────────────────────────
var OHANG_CSS = '\n' +
'.nkai-action-risk{display:grid;gap:12px;margin:0 auto;}\n' +
'.nar-do,.nar-dont{background:rgba(255,255,255,0.04);border-radius:14px;padding:16px;}\n' +
'.nar-do{border-left:3px solid #00D68F;}\n' +
'.nar-dont{border-left:3px solid #FF6B6B;}\n' +
'.nar-label{font-size:11px;font-weight:800;letter-spacing:0.5px;margin:0 0 6px;}\n' +
'.nar-main{font-size:14px;font-weight:700;color:#fff;margin:0 0 4px;line-height:1.5;}\n' +
'.nar-sub{font-size:11px;color:#8899BB;margin:0;line-height:1.5;}\n' +
'.nkai-ohang-body,.nkai-ohang-wellness{background:rgba(255,255,255,0.04);border-radius:14px;padding:16px;}\n' +
'.noh-title,.now-title{font-size:13px;font-weight:800;margin:0 0 10px;color:#E2E8F0;}\n' +
'.noh-msg,.now-msg{font-size:13px;color:#CBD5E1;line-height:1.7;margin:0 0 12px;word-break:keep-all;}\n' +
'.noh-tags{display:flex;flex-wrap:wrap;gap:6px;}\n' +
'.noh-tag-body,.noh-tag-skin,.noh-tag-warn{font-size:11px;background:rgba(255,255,255,0.06);border-radius:20px;padding:4px 10px;color:#94A3B8;}\n' +
'.noh-tag-warn{background:rgba(255,107,107,0.08);}\n' +
'.now-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;}\n' +
'.now-item{background:rgba(255,255,255,0.06);border-radius:10px;padding:10px 12px;}\n' +
'.now-good{border-top:2px solid #00D68F;}\n' +
'.now-avoid{border-top:2px solid #FF6B6B;}\n' +
'.now-item-label{font-size:10px;font-weight:700;color:#94A3B8;margin:0 0 4px;}\n' +
'.now-item-val{font-size:11px;color:#E2E8F0;margin:0;line-height:1.5;}\n' +
'.now-recommend{font-size:13px;color:#AAC0E0;margin:0;}\n';

// ─────────────────────────────────────────
// 15. 외부 노출 (전역)
// ─────────────────────────────────────────
window.NKAIReportV2 = {
  getNScoreSimpleText: getNScoreSimpleText,
  getIndicatorMessage: getIndicatorMessage,
  getGoldenTimeSimpleText: getGoldenTimeSimpleText,
  getArchetypeSimpleText: getArchetypeSimpleText,
  generate5StepInsight: generate5StepInsight,
  renderSummaryCard: renderSummaryCard,
  renderActionRisk: renderActionRisk,
  renderOhangBody: renderOhangBody,
  renderOhangWellness: renderOhangWellness,
  SUMMARY_CARD_CSS: SUMMARY_CARD_CSS,
  OHANG_CSS: OHANG_CSS,
  DRIP_TEMPLATES: DRIP_TEMPLATES
};

console.log('[N-KAI] 리포트 v2.0 로드 완료 — 초등학생도 이해 + 냉철한 인사이트');
