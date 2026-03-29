// Vercel Serverless Function — GET /api/lucky
// 오행 에너지 + 날짜 → 행운 숫자, 최적 타이밍 (특허④)

// 오행별 행운 숫자 매핑
const OHANG_LUCKY_NUMS = {
  '木': [3, 8],
  '火': [2, 7],
  '土': [5, 0],
  '金': [4, 9],
  '水': [1, 6],
};

// 오행별 길한 방향
const OHANG_DIRECTION = {
  '木': '동쪽(東)',
  '火': '남쪽(南)',
  '土': '중앙(中)',
  '金': '서쪽(西)',
  '水': '북쪽(北)',
};

// 오행별 길한 색상
const OHANG_COLOR = {
  '木': '초록·청록',
  '火': '빨강·주황',
  '土': '노랑·황토',
  '金': '흰색·은색',
  '水': '검정·진남',
};

// 천간 오행
const GAN_OHANG = ['木','木','火','火','土','土','金','金','水','水'];
// 지지 오행
const JI_OHANG  = ['水','土','木','木','土','火','火','土','金','金','土','水'];

// 오행 상생(相生) 관계
const SHENGKE = {
  '木': { generates: '火', controls: '土', generated_by: '水', controlled_by: '金' },
  '火': { generates: '土', controls: '金', generated_by: '木', controlled_by: '水' },
  '土': { generates: '金', controls: '水', generated_by: '火', controlled_by: '木' },
  '金': { generates: '水', controls: '木', generated_by: '土', controlled_by: '火' },
  '水': { generates: '木', controls: '火', generated_by: '金', controlled_by: '土' },
};

function getCoreOhang(year, month, day, hour) {
  const weights = [1.0, 1.2, 1.5, 0.8];
  const score = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 };

  // 연주
  const yGan = ((year - 4) % 10 + 10) % 10;
  const yJi  = ((year - 4) % 12 + 12) % 12;
  // 월주
  const mJi  = (month + 1) % 12;
  const mGan = ((year * 12 + month + 1) % 10 + 10) % 10;
  // 일주
  const a = Math.floor((14 - month) / 12);
  const y2 = year + 4800 - a;
  const m2 = month + 12 * a - 3;
  const jdn = day + Math.floor((153 * m2 + 2) / 5) + 365 * y2 + Math.floor(y2 / 4)
    - Math.floor(y2 / 100) + Math.floor(y2 / 400) - 32045;
  const dGan = (jdn + 9) % 10;
  const dJi  = (jdn + 1) % 12;
  // 시주
  const hJi  = Math.round(hour / 2) % 12;
  const hGan = ((dGan % 5) * 2 + hJi) % 10;

  const pillars = [
    [yGan, yJi], [mGan, mJi], [dGan, dJi], [hGan, hJi],
  ];
  pillars.forEach(([g, j], i) => {
    score[GAN_OHANG[g]] += weights[i];
    score[JI_OHANG[j]]  += weights[i];
  });

  return Object.keys(score).reduce((a, b) => score[a] > score[b] ? a : b);
}

function getDateOhang(dateStr) {
  // 날짜의 오행 에너지 계산 (일진 기반)
  const year  = parseInt(dateStr.slice(0, 4), 10);
  const month = parseInt(dateStr.slice(4, 6), 10);
  const day   = parseInt(dateStr.slice(6, 8), 10);

  const a = Math.floor((14 - month) / 12);
  const y2 = year + 4800 - a;
  const m2 = month + 12 * a - 3;
  const jdn = day + Math.floor((153 * m2 + 2) / 5) + 365 * y2 + Math.floor(y2 / 4)
    - Math.floor(y2 / 100) + Math.floor(y2 / 400) - 32045;

  return GAN_OHANG[(jdn + 9) % 10];
}

function getBestDays(core, dateStr, count = 5) {
  const year  = parseInt(dateStr.slice(0, 4), 10);
  const month = parseInt(dateStr.slice(4, 6), 10);
  const day   = parseInt(dateStr.slice(6, 8), 10);

  const favorable = [core, SHENGKE[core].generated_by, SHENGKE[core].generates];
  const results = [];

  for (let i = 1; i <= 30 && results.length < count; i++) {
    const testDate = new Date(year, month - 1, day + i);
    const y = testDate.getFullYear();
    const m = testDate.getMonth() + 1;
    const d = testDate.getDate();
    const dateKey = String(y) + String(m).padStart(2, '0') + String(d).padStart(2, '0');
    const dayOhang = getDateOhang(dateKey);
    if (favorable.includes(dayOhang)) {
      results.push(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }
  }
  return results;
}

function getEnergyTrend(core, dateStr) {
  const dateOhang = getDateOhang(dateStr);
  const rel = SHENGKE[core];

  if (dateOhang === core) return { level: 'high', desc: '오늘은 나의 에너지와 완전히 일치. 최고의 하루입니다.' };
  if (dateOhang === rel.generated_by) return { level: 'high', desc: '나를 생(生)하는 날. 에너지 충전에 최적.' };
  if (dateOhang === rel.generates) return { level: 'medium', desc: '내가 생(生)하는 날. 베푸는 활동에 좋음.' };
  if (dateOhang === rel.controls) return { level: 'medium', desc: '내가 극(剋)하는 날. 결단·정리에 유리.' };
  if (dateOhang === rel.controlled_by) return { level: 'low', desc: '나를 극(剋)하는 날. 신중하고 수비적으로.' };
  return { level: 'medium', desc: '평범한 에너지의 날. 루틴 유지 권장.' };
}

module.exports = function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { birth, date, hour = '12' } = req.query;

  if (!birth || !/^\d{8}$/.test(birth)) {
    return res.status(400).json({ error: 'birth 파라미터는 YYYYMMDD 형식이어야 합니다.' });
  }

  const todayStr = date || new Date().toISOString().slice(0, 10).replace(/-/g, '');

  const year  = parseInt(birth.slice(0, 4), 10);
  const month = parseInt(birth.slice(4, 6), 10);
  const day   = parseInt(birth.slice(6, 8), 10);
  const hourN = parseInt(hour, 10);

  const core = getCoreOhang(year, month, day, hourN);
  const luckyNums = OHANG_LUCKY_NUMS[core];
  const direction = OHANG_DIRECTION[core];
  const color = OHANG_COLOR[core];
  const best_days = getBestDays(core, todayStr);
  const energy_trend = getEnergyTrend(core, todayStr);

  return res.status(200).json({
    core_energy:  core,
    lucky_numbers: luckyNums,
    lucky_direction: direction,
    lucky_color:  color,
    best_day:     best_days[0] || null,
    best_days,
    energy_trend,
    today_ohang:  getDateOhang(todayStr),
  });
};
