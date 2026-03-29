// Vercel Serverless Function — GET /api/analyze
// 생년월일+시간 → 오행 분석 결과 JSON (만세력 서버사이드)

// 천간(天干) 오행 매핑
const GAN_OHANG = ['木','木','火','火','土','土','金','金','水','水']; // 甲乙丙丁戊己庚辛壬癸
const GAN_NAMES = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
// 지지(地支) 오행 매핑
const JI_OHANG  = ['水','土','木','木','土','火','火','土','金','金','土','水']; // 子丑寅卯辰巳午未申酉戌亥
const JI_NAMES  = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

// 오행별 성격/피부/식단 특성
const OHANG_TRAITS = {
  '木': {
    personality: '창의적이고 성장 지향적. 새로운 아이디어에 민감하며 독립심이 강함.',
    skin_type:   '지성~복합성 피부. 트러블 경향. 수분 밸런스 케어 필요.',
    diet:        '녹색 채소, 새싹, 신 음식(레몬·식초). 간 기능 지원.',
    exercise:    '스트레칭, 필라테스, 등산. 유연성 향상 집중.',
    beauty:      '수분 앰플, 비타C, 녹차 성분. 트러블 진정 제품.',
    color:       '#7CB87A',
  },
  '火': {
    personality: '열정적이고 사교적. 표현력이 뛰어나며 순간적 결단력 강함.',
    skin_type:   '건성~민감성. 홍조 경향. 진정·항산화 케어 필요.',
    diet:        '붉은 음식(토마토·고추·대추). 심장 기능 지원. 쓴 음식 소량.',
    exercise:    '유산소(달리기·자전거), HIIT. 심폐기능 강화.',
    beauty:      '시카·알로에 진정 크림, 자외선 차단 강화, 항산화 세럼.',
    color:       '#E8654A',
  },
  '土': {
    personality: '안정적이고 신뢰감 있음. 포용력이 크며 실용적 사고.',
    skin_type:   '복합성. 모공 케어 필요. 수분·유분 밸런스 유지.',
    diet:        '노란 음식(단호박·옥수수·고구마). 비위 기능 지원. 단 음식 소량.',
    exercise:    '코어 운동, 플랭크, 요가. 중심 안정성 향상.',
    beauty:      '히알루론산 수분 크림, 모공 세럼, 클레이 마스크.',
    color:       '#C4A05A',
  },
  '金': {
    personality: '완벽주의적이고 분석적. 원칙을 중시하며 집중력이 뛰어남.',
    skin_type:   '건성~중성. 각질 케어 필요. 화이트닝·재생 관리.',
    diet:        '흰 음식(배·무·양파·도라지). 폐 기능 지원. 매운 음식 소량.',
    exercise:    '근력 운동, 웨이트 트레이닝. 근육량 증가 집중.',
    beauty:      '레티놀 세럼, 나이아신아마이드 화이트닝, AHA 각질 케어.',
    color:       '#8EAFC9',
  },
  '水': {
    personality: '깊이 있고 직관적. 지혜롭고 내성적이며 장기 계획에 강함.',
    skin_type:   '건성~민감성. 재생·노화 케어 필요. 보습 집중.',
    diet:        '검은 음식(흑임자·흑두부·미역·블루베리). 신장 기능 지원.',
    exercise:    '명상, 수영, 요가. 정신·신체 이완 집중.',
    beauty:      '오일 세럼, 장벽 강화 크림, 콜라겐 부스터.',
    color:       '#5A9BC4',
  },
};

// 간단한 만세력 계산 (서버사이드 경량 버전)
function calcFourPillars(year, month, day, hour) {
  // 연주(年柱): 천간 = (year - 4) % 10, 지지 = (year - 4) % 12
  const yGan = ((year - 4) % 10 + 10) % 10;
  const yJi  = ((year - 4) % 12 + 12) % 12;

  // 월주(月柱): 절기 기준 간략화 (천문학적 정밀 계산 생략, 양력 월 기준)
  const mJi  = (month + 1) % 12;
  const mGan = ((year * 12 + month + 1) % 10 + 10) % 10;

  // 일주(日柱): 율리우스일 기반
  const a = Math.floor((14 - month) / 12);
  const y2 = year + 4800 - a;
  const m2 = month + 12 * a - 3;
  const jdn = day + Math.floor((153 * m2 + 2) / 5) + 365 * y2 + Math.floor(y2 / 4) - Math.floor(y2 / 100) + Math.floor(y2 / 400) - 32045;
  const dGan = (jdn + 9) % 10;
  const dJi  = (jdn + 1) % 12;

  // 시주(時柱)
  const hJi  = Math.round(hour / 2) % 12;
  const hGan = ((dGan % 5) * 2 + hJi) % 10;

  return [
    { gan: yGan, ji: yJi, ganName: GAN_NAMES[yGan], jiName: JI_NAMES[yJi] },
    { gan: mGan, ji: mJi, ganName: GAN_NAMES[mGan], jiName: JI_NAMES[mJi] },
    { gan: dGan, ji: dJi, ganName: GAN_NAMES[dGan], jiName: JI_NAMES[dJi] },
    { gan: hGan, ji: hJi, ganName: GAN_NAMES[hGan], jiName: JI_NAMES[hJi] },
  ];
}

function calcOhang(pillars) {
  const weights = [1.0, 1.2, 1.5, 0.8]; // 연/월/일/시 가중치
  const score = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 };

  pillars.forEach(function(p, i) {
    score[GAN_OHANG[p.gan]] += weights[i];
    score[JI_OHANG[p.ji]]   += weights[i];
  });

  const total = Object.values(score).reduce((a, b) => a + b, 0);
  const ratios = {};
  Object.keys(score).forEach(k => { ratios[k] = Math.round(score[k] / total * 100); });

  // 코어 에너지 (최댓값)
  const core = Object.keys(ratios).reduce((a, b) => ratios[a] > ratios[b] ? a : b);

  return { ratios, core };
}

module.exports = function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { birth, hour = '12', min = '0', gender = 'M' } = req.query;

  if (!birth || !/^\d{8}$/.test(birth)) {
    return res.status(400).json({ error: 'birth 파라미터는 YYYYMMDD 형식이어야 합니다.' });
  }

  const year  = parseInt(birth.slice(0, 4), 10);
  const month = parseInt(birth.slice(4, 6), 10);
  const day   = parseInt(birth.slice(6, 8), 10);
  const hourN = parseInt(hour, 10);

  if (year < 1900 || year > 2050 || month < 1 || month > 12 || day < 1 || day > 31) {
    return res.status(400).json({ error: '올바른 생년월일을 입력해주세요.' });
  }

  const pillars = calcFourPillars(year, month, day, hourN);
  const { ratios, core } = calcOhang(pillars);
  const traits = OHANG_TRAITS[core];

  return res.status(200).json({
    saju: {
      year:  pillars[0].ganName + pillars[0].jiName,
      month: pillars[1].ganName + pillars[1].jiName,
      day:   pillars[2].ganName + pillars[2].jiName,
      hour:  pillars[3].ganName + pillars[3].jiName,
    },
    ohang: {
      wood:  ratios['木'],
      fire:  ratios['火'],
      earth: ratios['土'],
      metal: ratios['金'],
      water: ratios['水'],
    },
    core_energy:  core,
    personality:  traits.personality,
    skin_type:    traits.skin_type,
    recommendations: {
      diet:    traits.diet,
      exercise: traits.exercise,
      beauty:  traits.beauty,
      color:   traits.color,
    },
  });
};
