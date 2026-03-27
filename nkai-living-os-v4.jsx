import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

// ═══════════════════════════════════════════════════════════════════
// N-KAI LIVING PROFILE OS v4.0 — 선천×후천×행동 삼중 융합 엔진
// "선천 기질이 행동 예측의 시드가 된다" — 특허 P25KAI001KR Claim 5
// z₀ + KIPA + Behavior → Dynamic Evolving Kairos Persona
// ═══════════════════════════════════════════════════════════════════

const STORAGE_KEYS = { main: "nkai-os-v4", cats: "nkai-os-v4-cats", subs: "nkai-os-v4-subs" };
const TODAY = () => new Date().toISOString().slice(0, 10);
const NOW = () => new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });

// ═══════════════════════════════════════════════════════════════════
// [MODULE 1] 선천적 기질 DNA — z₀ 벡터 (특허 S3010~S3040)
// 사주팔자: 辛酉(년)·辛丑(월)·辛丑(일)·己亥(시) | 일간: 辛金
// ═══════════════════════════════════════════════════════════════════
const DNA_INNATE = {
  // z₀ = [I, S, F, X] — 4대 핵심 인자 (대외용 용어 매핑)
  dayMaster: { value: 0.75, label: "金 · 분석형", element: "金", yinyang: "음", desc: "정교한 분석력 · 원칙 중심 의사결정", publicName: "코어 에너지" },
  strength: { value: 0.857, label: "고밀도", type: "strong", desc: "7번의 위기를 넘긴 구조적 견고함", publicName: "🛡️ 위기대응력" },
  wealth: { value: 0.0, label: "선천 부재", desc: "선천 경제 에너지 부재 → 후천적 금융 역량이 핵심", publicName: "💰 경제감각" },
  expression: { value: 0.143, label: "집중형", desc: "표현 채널이 좁지만 존재 · 집중된 출력", publicName: "⚡ 표현에너지" },

  // 5-Energy 분포 (선천적 기질 데이터 중)
  fiveEnergy: { 木: 0, 火: 0, 土: 3, 金: 4, 水: 1 },
  missingEnergy: "火", // 완전 결핍 — 열정/표현/에너지의 외부 보충 필요

  // 아키타입 (16형 중)
  archetype: { code: "NT-JI", mbti: "INTJ", korean: "항해사", full: "전략적 탐험가" },

  // 에너지 밀도 계산 근거
  supportCount: 6, // 나를 돕는 에너지
  drainCount: 1,   // 나를 소모하는 에너지
  sIndex: 0.857,   // 에너지 밀도 지수
};

// ═══════════════════════════════════════════════════════════════════
// [MODULE 2] 후천적 성향 — KIPA 16Q (특허 S4010)
// 정보필터링(N/S), 의사결정(T/F), 실행습관(J/P), 대외지향성(E/I)
// ═══════════════════════════════════════════════════════════════════
const KIPA_SCORES = {
  NS: { value: +0.06, label: "N (약한 직관형)", publicName: "정보 필터링", direction: "intuitive", confidence: "low" },
  TF: { value: +0.46, label: "T (확실한 사고형)", publicName: "의사결정 경향", direction: "thinking", confidence: "high" },
  JP: { value: +0.20, label: "J (중간 판단형)", publicName: "실행 습관", direction: "judging", confidence: "medium" },
  EI: { value: -0.04, label: "I (미세 내향형)", publicName: "대외 지향성", direction: "introverted", confidence: "low" },
};

// ═══════════════════════════════════════════════════════════════════
// [MODULE 3] 선천×후천 에너지 시너지/텐션 매트릭스 (특허 S4030)
// ═══════════════════════════════════════════════════════════════════
const RESONANCE_MAP = {
  NS_dayMaster: {
    axis: "정보 필터링 (N/S)", innate: "金 · 분석형 코어", kipa: KIPA_SCORES.NS.label,
    relation: "텐션", delta: -0.20,
    reason: "金 에너지는 현실지향(S)이나, KIPA는 약한 N → 미약한 텐션",
    corrected: +0.06 + (+0.06 * -0.20),
  },
  TF_strength: {
    axis: "의사결정 (T/F)", innate: "위기대응력 고밀도(0.857)", kipa: KIPA_SCORES.TF.label,
    relation: "강한 시너지", delta: +0.15,
    reason: "고밀도 에너지는 논리적 방어력(T) 강화 → 선천과 후천이 동일 방향",
    corrected: +0.46 + (+0.46 * +0.15),
  },
  JP_wealth: {
    axis: "실행 습관 (J/P)", innate: "경제감각 선천 부재(0.0)", kipa: KIPA_SCORES.JP.label,
    relation: "주목할 텐션", delta: -0.10,
    reason: "선천 경제 에너지 부재인데 계획형(J) → 후천적 훈련으로 계획 능력 구축",
    corrected: +0.20 + (+0.20 * -0.10),
  },
  EI_expression: {
    axis: "대외 지향성 (E/I)", innate: "표현에너지 집중형(0.143)", kipa: KIPA_SCORES.EI.label,
    relation: "약한 시너지", delta: +0.10,
    reason: "표현 에너지 집중형 → 내향 경향 → KIPA의 미세 내향과 일치",
    corrected: -0.04 + (-0.04 * +0.10),
  },
};

// 최종 융합 벡터 V_fused
const V_FUSED = {
  NS: RESONANCE_MAP.NS_dayMaster.corrected,    // +0.048
  TF: RESONANCE_MAP.TF_strength.corrected,      // +0.529
  JP: RESONANCE_MAP.JP_wealth.corrected,         // +0.180
  EI: RESONANCE_MAP.EI_expression.corrected,     // -0.044
};

// ═══════════════════════════════════════════════════════════════════
// [MODULE 4] Phase 가중치 체계 (v5.5 인스트럭션 A10)
// Phase 1: 선천40% + KIPA35% + 동적25%
// Phase 2: 선천25% + KIPA20% + 행동40% + 동적15%
// Phase 3: 선천15% + KIPA10% + 행동60% + 동적15%
// ═══════════════════════════════════════════════════════════════════
const PHASE_WEIGHTS = {
  1: { innate: 0.40, kipa: 0.35, behavior: 0.00, dynamic: 0.25, label: "Proving Ground", color: "#F59E0B" },
  2: { innate: 0.25, kipa: 0.20, behavior: 0.40, dynamic: 0.15, label: "Scale Engine", color: "#3B82F6" },
  3: { innate: 0.15, kipa: 0.10, behavior: 0.60, dynamic: 0.15, label: "Living Platform", color: "#00D68F" },
};

// 현재 Phase (Phase 1)
const CURRENT_PHASE = 1;

// ─── 기본 차원 정의 ───
const BASE_DIMS = {
  health: { name: "건강식", emoji: "🥗", color: "#00D68F", direction: "positive" },
  morning: { name: "모닝루틴", emoji: "🌅", color: "#F59E0B", direction: "positive" },
  bowel: { name: "장건강", emoji: "💚", color: "#22C55E", direction: "positive" },
  exercise: { name: "운동", emoji: "🏃", color: "#10B981", direction: "positive" },
  social: { name: "소셜/만남", emoji: "🤝", color: "#3B82F6", direction: "positive" },
  infra: { name: "사업/성장", emoji: "💻", color: "#A855F7", direction: "positive" },
  mind: { name: "멘탈/감정", emoji: "🧠", color: "#6366F1", direction: "positive" },
  eating: { name: "외식의존", emoji: "🍽️", color: "#EF4444", direction: "negative" },
  drinking: { name: "음주", emoji: "🍺", color: "#DC2626", direction: "negative" },
  nightlife: { name: "유흥/심야", emoji: "🌙", color: "#991B1B", direction: "negative" },
};

// ─── 6개월 시드 (510건 실데이터 기반) ───
const SEED = [
  { date: "2025-09-24", nScore: 35, post: 0.50, sigma: 1.0, dims: { health: 0, morning: 0, bowel: 30, exercise: 0, social: 8, infra: 0, mind: 40, eating: 45, drinking: 35, nightlife: 12 }, entries: [], label: "Pre-PoC" },
  { date: "2025-10-24", nScore: 38, post: 0.55, sigma: 0.95, dims: { health: 0, morning: 0, bowel: 25, exercise: 0, social: 5, infra: 0, mind: 35, eating: 50, drinking: 30, nightlife: 25 }, entries: [], label: "유흥 496K" },
  { date: "2025-11-23", nScore: 42, post: 0.60, sigma: 0.55, dims: { health: 10, morning: 0, bowel: 35, exercise: 0, social: 5, infra: 5, mind: 40, eating: 15, drinking: 14, nightlife: 8 }, entries: [], label: "배달 전환" },
  { date: "2025-12-08", nScore: 52, post: 0.70, sigma: 0.40, dims: { health: 18, morning: 0, bowel: 45, exercise: 0, social: 4, infra: 8, mind: 45, eating: 10, drinking: 12, nightlife: 0 }, entries: [], label: "Phase 1" },
  { date: "2026-01-07", nScore: 59, post: 0.82, sigma: 0.25, dims: { health: 33, morning: 2, bowel: 60, exercise: 5, social: 5, infra: 12, mind: 55, eating: 5, drinking: 5, nightlife: 0 }, entries: [], label: "비빔밥 루틴" },
  { date: "2026-01-22", nScore: 65, post: 0.85, sigma: 0.20, dims: { health: 40, morning: 5, bowel: 70, exercise: 8, social: 4, infra: 15, mind: 60, eating: 4, drinking: 0, nightlife: 0 }, entries: [], label: "포케볼" },
  { date: "2026-02-06", nScore: 73, post: 0.88, sigma: 0.10, dims: { health: 50, morning: 50, bowel: 80, exercise: 15, social: 6, infra: 18, mind: 65, eating: 3, drinking: 0, nightlife: 0 }, entries: [], label: "모닝루틴" },
  { date: "2026-02-16", nScore: 74, post: 0.93, sigma: 0.05, dims: { health: 55, morning: 90, bowel: 88, exercise: 20, social: 5, infra: 20, mind: 70, eating: 2, drinking: 0, nightlife: 0 }, entries: [], label: "9일 연속" },
  { date: "2026-02-27", nScore: 74, post: 0.95, sigma: 0.02, dims: { health: 58, morning: 95, bowel: 90, exercise: 22, social: 8, infra: 22, mind: 72, eating: 2, drinking: 2, nightlife: 0 }, entries: [], label: "97.3% 복원" },
];

// ─── AI Classification ───
const CLASSIFY_PROMPT = `당신은 N-KAI 행동 분류 AI입니다. 사용자의 자유 텍스트를 분석하여 JSON으로 분류합니다.

차원 목록: health(건강식), morning(모닝루틴), bowel(장건강), exercise(운동), social(소셜), infra(사업), mind(멘탈), eating(외식), drinking(음주), nightlife(유흥)

중요 컨텍스트 — 이 사용자의 선천적 기질:
- 코어 에너지: 金 분석형 (위기대응력 고밀도 0.857) → 원칙적·분석적 성향. 기존 루틴 강화가 자연스러움
- 경제감각: 선천 부재(0.0) → 물질적 소비 충동이 선천적으로 낮음. 외식/유흥 시 "이탈"의 의미가 큼
- 표현에너지: 집중형(0.143) → 표현 채널이 좁아 소셜 활동 후 에너지 소진 빠름
- 火 에너지 완전 결핍 → 열정/자극 추구 행동은 보상 행동일 가능성

규칙:
1. 여러 행동 추출 가능
2. wellness 0~100 (건강할수록 높음)
3. 새 음식/장소/사람 → sub_cluster에 구체적 이름
4. 사람 이름 → who 필드
5. 감정 → mood 필드
6. innate_note: 선천 기질과의 관계 한줄 (예: "고밀도 루틴 강화", "경제감각 부재인데 소비 이탈")

반드시 JSON만:
{"items":[{"text":"행동","dim":"key","sub_cluster":"이름","wellness":점수,"effects":{"key":값},"who":null,"mood":null,"innate_note":"선천 관계"}],"summary":"요약","risk_flags":[],"resonance_note":"선천×행동 시너지/텐션 판정"}`;

async function classifyWithAI(text) {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: CLASSIFY_PROMPT,
        messages: [{ role: "user", content: text }],
      }),
    });
    const data = await response.json();
    const raw = data.content?.map(b => b.text || "").join("") || "";
    return JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch (err) {
    console.error("AI err:", err);
    return null;
  }
}

function classifyFallback(text) {
  const t = text.toLowerCase();
  const items = [];
  const kw = {
    health: ["비빔밥", "포케", "샐러드", "현미", "잡곡", "건강", "채소", "야채", "두부", "닭가슴살", "고구마", "오트밀", "김치찌개", "된장"],
    morning: ["모닝", "아침루틴", "계란", "요거트", "물한잔", "아침물"],
    bowel: ["쾌변", "배변", "장건강", "화장실"],
    exercise: ["운동", "걷기", "산책", "헬스", "스트레칭", "조깅", "러닝", "요가", "필라"],
    social: ["만남", "만났", "미팅", "약속", "가족", "친구", "동료", "형님", "누나"],
    infra: ["코딩", "개발", "aws", "서버", "도메인", "투자", "사업", "공부", "강의"],
    mind: ["기분", "스트레스", "명상", "행복", "짜증", "피곤", "컨디션"],
    eating: ["외식", "식당", "고깃집", "삼겹살", "치킨", "피자", "돈까스", "햄버거", "라면", "배달"],
    drinking: ["소주", "맥주", "와인", "막걸리", "음주", "술", "한잔"],
    nightlife: ["나이트", "노래방", "바", "클럽", "새벽", "야식"],
  };
  Object.entries(kw).forEach(([dim, words]) => {
    words.forEach(w => {
      if (t.includes(w)) {
        const isNeg = ["eating", "drinking", "nightlife"].includes(dim);
        // 선천 기질 반영: 극신강이므로 긍정 행동의 강화폭이 크고, 이탈 시 충격도 큼
        const innateBoost = isNeg ? (DNA_INNATE.wealth.value === 0 ? "경제감각 부재 이탈" : "") : (DNA_INNATE.strength.value > 0.7 ? "고밀도 루틴 강화" : "");
        items.push({
          text: w + " 감지", dim, sub_cluster: w,
          wellness: isNeg ? 30 : 75,
          effects: { [dim]: isNeg ? 8 : 5, ...(dim === "drinking" ? { morning: -6, health: -3 } : {}) },
          who: null, mood: null, innate_note: innateBoost,
        });
      }
    });
  });
  if (items.length === 0) items.push({ text: text.slice(0, 30), dim: "mind", sub_cluster: "기타", wellness: 50, effects: { mind: 1 }, who: null, mood: null, innate_note: "" });
  const unique = []; const seen = new Set();
  items.forEach(i => { const k = i.dim + i.sub_cluster; if (!seen.has(k)) { seen.add(k); unique.push(i); } });
  return { items: unique, summary: `${unique.length}개 행동 감지`, risk_flags: items.some(i => i.dim === "drinking") ? ["음주 감지"] : [], resonance_note: "" };
}

// ═══════════════════════════════════════════════════════════════════
// [MODULE 5] N-Score 삼중 융합 계산 (Phase 가중치 적용)
// ═══════════════════════════════════════════════════════════════════

function calcInnateScore() {
  // 선천 기질에서 N-Score 기여분 계산
  // 金 코어 에너지 고밀도 → 위기대응력 높음, 경제감각 선천 부재
  const base = 50;
  const strengthBonus = (DNA_INNATE.strength.value - 0.5) * 30;   // 고밀도: +10.7
  const wealthPenalty = (0.5 - DNA_INNATE.wealth.value) * 20;     // 경제감각 부재: -10
  const expressionFactor = (DNA_INNATE.expression.value - 0.5) * 15; // 표현에너지 집중: -5.4
  return Math.max(20, Math.min(80, Math.round(base + strengthBonus - wealthPenalty + expressionFactor)));
}

function calcKipaScore() {
  // KIPA V_fused에서 N-Score 기여분 계산
  const tfContrib = V_FUSED.TF * 25;    // 사고형 강함: +13.2
  const jpContrib = V_FUSED.JP * 15;    // 판단형 중간: +2.7
  const eiContrib = V_FUSED.EI * -10;   // 내향 미세: +0.44
  return Math.max(20, Math.min(80, Math.round(50 + tfContrib + jpContrib + eiContrib)));
}

function calcBehaviorScore(dims) {
  const p = (dims.health || 0) * 0.20 + (dims.morning || 0) * 0.16 + (dims.bowel || 0) * 0.10 +
            (dims.exercise || 0) * 0.08 + (dims.social || 0) * 0.07 + (dims.infra || 0) * 0.07 + (dims.mind || 0) * 0.06;
  const n = (dims.eating || 0) * 0.08 + (dims.drinking || 0) * 0.12 + (dims.nightlife || 0) * 0.06;
  return Math.min(99, Math.max(1, Math.round(36 + p * 0.55 - n * 0.65)));
}

function calcDynamicScore(dims, history) {
  // 공명충돌10% + 골든타임10% + 오행엔트로피5%
  const resonanceScore = Object.values(RESONANCE_MAP).reduce((sum, r) => {
    return sum + (r.relation.includes("시너지") ? 5 : -3);
  }, 50);
  const recentTrend = history.length >= 2 ?
    (history[history.length - 1]?.nScore || 50) - (history[history.length - 2]?.nScore || 50) : 0;
  const trendScore = Math.max(30, Math.min(70, 50 + recentTrend));
  // 5-Energy 엔트로피: 편중도 높을수록 낮음
  const elements = Object.values(DNA_INNATE.fiveEnergy);
  const total = elements.reduce((s, v) => s + v, 0) || 1;
  const entropy = -elements.reduce((s, v) => { const p = v / total; return s + (p > 0 ? p * Math.log2(p) : 0); }, 0);
  const maxEntropy = Math.log2(5);
  const entropyScore = Math.round((entropy / maxEntropy) * 100);
  return Math.round(resonanceScore * 0.4 + trendScore * 0.4 + entropyScore * 0.2);
}

function calcNScoreFused(dims, history) {
  const w = PHASE_WEIGHTS[CURRENT_PHASE];
  const innate = calcInnateScore();
  const kipa = calcKipaScore();
  const behavior = calcBehaviorScore(dims);
  const dynamic = calcDynamicScore(dims, history);

  // Phase 1: 선천40% + KIPA35% + 행동0% + 동적25%
  // 하지만 행동 데이터가 있으면 점진적으로 반영 (Phase 1에서도 행동이 전혀 무시되면 의미 없음)
  // 실제 구현: Phase 1에서도 행동 데이터 가중치를 일부 적용 (학습 효과)
  const behaviorPresence = Math.min(1, (dims.health + dims.morning + dims.exercise + dims.infra) / 200);
  const effectiveBehaviorWeight = w.behavior + behaviorPresence * 0.15; // 행동 데이터가 쌓이면 최대 15% 추가
  const totalWeight = w.innate + w.kipa + effectiveBehaviorWeight + w.dynamic;

  const fused = Math.round(
    (innate * w.innate + kipa * w.kipa + behavior * effectiveBehaviorWeight + dynamic * w.dynamic) / totalWeight
  );

  return {
    total: Math.max(1, Math.min(99, fused)),
    components: { innate, kipa, behavior, dynamic },
    weights: { innate: w.innate, kipa: w.kipa, behavior: effectiveBehaviorWeight, dynamic: w.dynamic },
  };
}

// ─── Other Engines ───
function bayesianUpdate(prior, items) {
  let lk = 0.5;
  items.forEach(it => {
    if (it.wellness >= 70) lk = Math.min(0.98, lk + 0.06);
    else if (it.wellness <= 35) lk = Math.max(0.05, lk - 0.09);
  });
  const u = prior * lk;
  return Math.max(0.01, Math.min(0.99, u / (u + (1 - prior) * (1 - lk))));
}

function detectPhase(ns) {
  if (ns < 45) return { p: 0, name: "기저선", color: "#EF4444", emoji: "🔴" };
  if (ns < 55) return { p: 1, name: "변화 시작", color: "#F59E0B", emoji: "🟡" };
  if (ns < 68) return { p: 2, name: "안정화", color: "#3B82F6", emoji: "🔵" };
  return { p: 3, name: "자율 진화", color: "#00D68F", emoji: "🟢" };
}

function calcThree(dims) {
  // 3대 지표에 선천 기질 반영
  const innateEcon = DNA_INNATE.wealth.value * 20;      // 재성 0 → 0
  const innateExpr = DNA_INNATE.expression.value * 25;   // 식상 0.143 → 3.6
  const innateCrisis = DNA_INNATE.strength.value * 20;   // 극신강 → 17.1

  return {
    economic: Math.min(99, Math.max(1, Math.round(42 + innateEcon + (dims.infra || 0) * 0.35 + (dims.health || 0) * 0.12 - (dims.nightlife || 0) * 0.25))),
    expressive: Math.min(99, Math.max(1, Math.round(32 + innateExpr + (dims.social || 0) * 0.5 + (dims.morning || 0) * 0.2 + (dims.mind || 0) * 0.18))),
    crisis: Math.min(99, Math.max(1, Math.round(38 + innateCrisis + (dims.morning || 0) * 0.15 + (dims.health || 0) * 0.1 + (dims.bowel || 0) * 0.08 + (dims.exercise || 0) * 0.07 - (dims.drinking || 0) * 0.25))),
  };
}

function generateAlerts(items, dims, history) {
  const a = [];
  const hasDrink = items.some(i => i.dim === "drinking");
  const hasNight = items.some(i => i.dim === "nightlife");
  const hasStress = items.some(i => i.mood === "스트레스" || (i.dim === "mind" && i.wellness < 40));

  if (hasDrink && hasNight) a.push({ lv: "CRITICAL", msg: "음주+유흥 동시 — 경제감각 부재 기질상 72h 루틴 파괴 위험", v: 0.92 });
  else if (hasDrink) a.push({ lv: "WARNING", msg: "음주 감지 → 고밀도 루틴 내구성 테스트", v: 0.65 });
  if (hasStress && hasDrink) a.push({ lv: "CRITICAL", msg: "스트레스+음주 — 火 에너지 결핍 보상행동 패턴", v: 0.85 });
  else if (hasStress) a.push({ lv: "WARNING", msg: "스트레스 감지 — 분석형 코어 → 논리적 대응 권장", v: 0.50 });

  const recent3 = (history || []).slice(-3);
  const drinkDays = recent3.filter(d => (d.entries || []).some(e => e.dim === "drinking")).length;
  if (drinkDays >= 2) a.push({ lv: "CRITICAL", msg: `최근 3일 중 ${drinkDays}일 음주 — 패턴 재발 경고`, v: 0.88 });
  return a;
}

function generatePredictions(items, dims, history) {
  const preds = [];
  const hasMorning = items.some(i => i.dim === "morning");
  const hasHealthy = items.some(i => i.dim === "health");
  const hasDrink = items.some(i => i.dim === "drinking");
  const hasExercise = items.some(i => i.dim === "exercise");

  if (hasMorning && hasHealthy && !hasDrink) {
    preds.push({ emoji: "🌅", text: "내일 모닝루틴 유지", conf: 95, algo: "베이지안+고밀도 관성" });
    preds.push({ emoji: "💚", text: "내일 쾌변 예상", conf: 91, algo: "쾌변공식v1" });
  }
  if (hasDrink) {
    preds.push({ emoji: "🍞", text: "내일 아침 경량식 전환", conf: 78, algo: "음주24h궤적" });
    if (dims.morning > 60) preds.push({ emoji: "🛡️", text: "고밀도 루틴 내구성 작동", conf: 80, algo: "위기대응력×내구성법칙" });
  }
  if (hasExercise) preds.push({ emoji: "😴", text: "오늘 수면 품질 향상", conf: 80, algo: "운동-수면 상관" });
  if (preds.length === 0) preds.push({ emoji: "⏳", text: "데이터 분석 중...", conf: 0, algo: "-" });
  return preds.slice(0, 5);
}

// ─── UI Helpers ───
const Pulse = ({ color, s = 8 }) => <span style={{ display: "inline-block", width: s, height: s, borderRadius: "50%", background: color, boxShadow: `0 0 ${s}px ${color}`, animation: "pulse 2s infinite" }} />;
const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "rgba(6,6,12,.95)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, padding: "6px 10px", fontSize: 10 }}>
      <div style={{ fontWeight: 700, color: "#fff", marginBottom: 2 }}>{label}</div>
      {payload.filter(p => p.value != null).map((p, i) => (
        <div key={i} style={{ color: p.color, display: "flex", justifyContent: "space-between", gap: 12 }}>
          <span>{p.name}</span><span style={{ fontWeight: 700, fontFamily: "monospace" }}>{typeof p.value === "number" ? p.value.toFixed(1) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════
export default function LivingOS() {
  const [history, setHistory] = useState(SEED);
  const [todayEntries, setTodayEntries] = useState([]);
  const [dims, setDims] = useState({ ...SEED[SEED.length - 1].dims });
  const [posterior, setPosterior] = useState(0.95);
  const [subClusters, setSubClusters] = useState({});
  const [people, setPeople] = useState({});
  const [inputText, setInputText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [view, setView] = useState("dna");
  const [loading, setLoading] = useState(true);
  const [aiResponse, setAiResponse] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get(STORAGE_KEYS.main);
        if (r?.value) { const s = JSON.parse(r.value); if (s.history?.length > 0) setHistory(s.history); if (s.dims) setDims(s.dims); if (s.posterior) setPosterior(s.posterior); if (s.todayDate === TODAY() && s.todayEntries) setTodayEntries(s.todayEntries); }
        const r2 = await window.storage.get(STORAGE_KEYS.subs);
        if (r2?.value) { const s2 = JSON.parse(r2.value); if (s2.subClusters) setSubClusters(s2.subClusters); if (s2.people) setPeople(s2.people); }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const saveAll = useCallback(async (h, te, d, p) => {
    try { await window.storage.set(STORAGE_KEYS.main, JSON.stringify({ history: h, todayEntries: te, dims: d, posterior: p, todayDate: TODAY(), saved: new Date().toISOString() })); } catch {}
  }, []);
  const saveSubs = useCallback(async (sc, pp) => {
    try { await window.storage.set(STORAGE_KEYS.subs, JSON.stringify({ subClusters: sc, people: pp })); } catch {}
  }, []);

  const processInput = useCallback(async () => {
    if (!inputText.trim() || processing) return;
    setProcessing(true);
    const text = inputText.trim();
    setInputText("");
    let result = await classifyWithAI(text);
    if (!result || !result.items?.length) result = classifyFallback(text);
    const time = NOW();
    const newEntries = result.items.map(it => ({ ...it, time, raw: text }));
    const newDims = { ...dims };
    newEntries.forEach(it => {
      Object.entries(it.effects || {}).forEach(([k, v]) => { if (BASE_DIMS[k]) newDims[k] = Math.max(0, Math.min(99, (newDims[k] || 0) + v * 0.4)); });
      ["eating", "drinking", "nightlife"].forEach(k => { if (!it.effects?.[k] && it.wellness > 60) newDims[k] = Math.max(0, (newDims[k] || 0) - 0.2); });
    });
    const newPost = bayesianUpdate(posterior, newEntries);
    const newSubs = { ...subClusters }; const newPeople = { ...people };
    newEntries.forEach(it => {
      if (it.sub_cluster && it.sub_cluster !== "기타") newSubs[`${it.dim}:${it.sub_cluster}`] = (newSubs[`${it.dim}:${it.sub_cluster}`] || 0) + 1;
      if (it.who) newPeople[it.who] = (newPeople[it.who] || 0) + 1;
    });
    const updated = [...todayEntries, ...newEntries];
    setTodayEntries(updated); setDims(newDims); setPosterior(newPost); setSubClusters(newSubs); setPeople(newPeople);
    setAiResponse({ summary: result.summary, items: newEntries, risks: result.risk_flags || [], resonance: result.resonance_note || "" });
    await saveAll(history, updated, newDims, newPost); await saveSubs(newSubs, newPeople);
    setProcessing(false);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, [inputText, processing, dims, posterior, todayEntries, history, subClusters, people, saveAll, saveSubs]);

  const closeDay = useCallback(async () => {
    if (todayEntries.length === 0) return;
    const entry = {
      date: TODAY(), nScore: nScoreData.total, post: posterior,
      sigma: Math.max(0.01, (history[history.length - 1]?.sigma || 0.02) * (todayEntries.some(e => e.dim === "drinking" || e.dim === "nightlife") ? 1.3 : 0.95)),
      dims: { ...dims }, entries: todayEntries, label: `${todayEntries.length}건`,
    };
    const newHist = [...history, entry];
    setHistory(newHist); setTodayEntries([]); setAiResponse(null);
    await saveAll(newHist, [], dims, posterior);
  }, [todayEntries, dims, posterior, history, saveAll]);

  // ─── Computed ───
  const nScoreData = useMemo(() => calcNScoreFused(dims, history), [dims, history]);
  const nScore = nScoreData.total;
  const phase = detectPhase(nScore);
  const three = calcThree(dims);
  const alerts = useMemo(() => generateAlerts(todayEntries, dims, history), [todayEntries, dims, history]);
  const predictions = useMemo(() => generatePredictions(todayEntries, dims, history), [todayEntries, dims, history]);
  const radarData = Object.entries(BASE_DIMS).map(([k, v]) => ({ axis: v.emoji + v.name, value: Math.round(dims[k] || 0), fullMark: 100 }));
  const chartData = useMemo(() => {
    const d = history.filter(h => h.nScore).map(h => ({ date: h.date?.slice(5) || "", nScore: h.nScore, post: (h.post || 0) * 100 }));
    d.push({ date: "오늘", nScore, post: posterior * 100 });
    return d;
  }, [history, nScore, posterior]);

  const topSubs = Object.entries(subClusters).sort((a, b) => b[1] - a[1]).slice(0, 12);
  const topPeople = Object.entries(people).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const streaks = useMemo(() => {
    let m = 0, h = 0, b = 0;
    for (const d of [...history].reverse()) { if ((d.dims?.morning || 0) > 30) m++; else break; }
    if (todayEntries.some(e => e.dim === "morning")) m++;
    for (const d of [...history].reverse()) { if ((d.dims?.health || 0) > 20) h++; else break; }
    for (const d of [...history].reverse()) { if ((d.dims?.bowel || 0) > 50) b++; else break; }
    return { m, h, b };
  }, [history, todayEntries]);

  // Phase weight bars
  const phaseWeightData = [
    { name: "선천", weight: Math.round(nScoreData.weights.innate * 100), score: nScoreData.components.innate, color: "#F59E0B" },
    { name: "KIPA", weight: Math.round(nScoreData.weights.kipa * 100), score: nScoreData.components.kipa, color: "#A855F7" },
    { name: "행동", weight: Math.round(nScoreData.weights.behavior * 100), score: nScoreData.components.behavior, color: "#00D68F" },
    { name: "동적", weight: Math.round(nScoreData.weights.dynamic * 100), score: nScoreData.components.dynamic, color: "#3B82F6" },
  ];

  if (loading) return <div style={{ minHeight: "100vh", background: "#07070d", display: "flex", alignItems: "center", justifyContent: "center" }}><Pulse color="#00D68F" s={12} /><span style={{ color: "#00D68F", marginLeft: 10, fontSize: 13 }}>Living Profile v4.0 로딩...</span></div>;

  const S = { bg: "linear-gradient(170deg,#05050a 0%,#08091a 40%,#060812 100%)", card: "rgba(255,255,255,.02)", border: "rgba(255,255,255,.05)" };

  return (
    <div style={{ minHeight: "100vh", background: S.bg, color: "#fff", fontFamily: "'Segoe UI',-apple-system,sans-serif" }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}} @keyframes slideIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}} @keyframes typing{0%{opacity:.3}50%{opacity:1}100%{opacity:.3}} *::-webkit-scrollbar{width:3px} *::-webkit-scrollbar-thumb{background:rgba(255,255,255,.08);border-radius:3px}`}</style>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "10px 10px 80px" }}>

        {/* ═══ HEADER ═══ */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Pulse color="#00D68F" s={8} />
              <span style={{ fontSize: 7, letterSpacing: ".25em", color: "rgba(255,255,255,.18)", textTransform: "uppercase" }}>Living Profile OS v4.0 · 선천×후천×행동 삼중 융합</span>
            </div>
            <h1 style={{ fontSize: 17, fontWeight: 900, margin: "2px 0", background: "linear-gradient(135deg,#F59E0B,#00D68F,#A855F7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>N-KAI 금융 DNA 엔진</h1>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,.2)" }}>
              {DNA_INNATE.archetype.mbti} {DNA_INNATE.archetype.korean} · {DNA_INNATE.dayMaster.label} · Phase {CURRENT_PHASE}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 34, fontWeight: 900, color: phase.color, fontFamily: "monospace", lineHeight: 1 }}>{nScore}</div>
            <div style={{ fontSize: 9, color: phase.color, fontWeight: 600 }}>{phase.emoji} {phase.name}</div>
            <div style={{ fontSize: 7, color: "rgba(255,255,255,.15)", marginTop: 1 }}>
              선{Math.round(nScoreData.weights.innate * 100)}+K{Math.round(nScoreData.weights.kipa * 100)}+행{Math.round(nScoreData.weights.behavior * 100)}+동{Math.round(nScoreData.weights.dynamic * 100)}
            </div>
          </div>
        </div>

        {/* ═══ KPI STRIP ═══ */}
        <div style={{ display: "flex", gap: 4, marginBottom: 6, flexWrap: "wrap" }}>
          {[
            { e: "💰", n: "경제감각", v: three.economic, c: "#2D8CFF" },
            { e: "⚡", n: "표현에너지", v: three.expressive, c: "#5AA8FF" },
            { e: "🛡️", n: "위기대응", v: three.crisis, c: "#00D68F" },
            { e: "🔮", n: "Posterior", v: Math.round(posterior * 100), c: "#A855F7" },
          ].map(i => (
            <div key={i.n} style={{ flex: 1, minWidth: 62, padding: "4px 5px", borderRadius: 7, textAlign: "center", background: `${i.c}06`, border: `1px solid ${i.c}15` }}>
              <div style={{ fontSize: 10 }}>{i.e}</div>
              <div style={{ fontSize: 17, fontWeight: 900, color: i.c, fontFamily: "monospace" }}>{i.v}</div>
              <div style={{ fontSize: 7, color: "rgba(255,255,255,.25)" }}>{i.n}</div>
            </div>
          ))}
          <div style={{ flex: 1, minWidth: 62, padding: "4px 5px", borderRadius: 7, textAlign: "center", background: "rgba(245,158,11,.03)", border: "1px solid rgba(245,158,11,.1)" }}>
            <div style={{ fontSize: 7, color: "rgba(255,255,255,.25)" }}>연속기록</div>
            <div style={{ fontSize: 9, color: "#F59E0B", marginTop: 2 }}>🌅{streaks.m} 🥗{streaks.h} 💚{streaks.b}</div>
            <div style={{ fontSize: 7, color: "rgba(255,255,255,.15)", marginTop: 1 }}>오늘 {todayEntries.length}건</div>
          </div>
        </div>

        {/* ═══ ALERTS ═══ */}
        {alerts.map((a, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 7, marginBottom: 3, animation: "slideIn .3s", background: a.lv === "CRITICAL" ? "rgba(239,68,68,.07)" : "rgba(245,158,11,.04)", border: `1px solid ${a.lv === "CRITICAL" ? "rgba(239,68,68,.18)" : "rgba(245,158,11,.1)"}` }}>
            <span style={{ fontSize: 10 }}>{a.lv === "CRITICAL" ? "🔴" : "🟡"}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: a.lv === "CRITICAL" ? "#EF4444" : "#F59E0B" }}>T-60</span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,.65)", flex: 1 }}>{a.msg}</span>
            <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "monospace", color: a.lv === "CRITICAL" ? "#EF4444" : "#F59E0B" }}>{(a.v * 100).toFixed(0)}%</span>
          </div>
        ))}

        {/* ═══ TABS ═══ */}
        <div style={{ display: "flex", gap: 2, marginBottom: 8, marginTop: 4 }}>
          {[
            { id: "dna", l: "🧬 DNA" },
            { id: "chat", l: "💬 입력" },
            { id: "radar", l: "🔮 레이더" },
            { id: "trajectory", l: "🌊 궤적" },
            { id: "predict", l: "⚡ 예측" },
            { id: "clusters", l: "📊 분석" },
          ].map(t => (
            <button key={t.id} onClick={() => setView(t.id)} style={{
              flex: 1, padding: "5px 2px", borderRadius: 6, cursor: "pointer", fontSize: 9,
              border: view === t.id ? "1px solid rgba(0,214,143,.3)" : `1px solid ${S.border}`,
              background: view === t.id ? "rgba(0,214,143,.07)" : "transparent",
              color: view === t.id ? "#00D68F" : "rgba(255,255,255,.3)", fontWeight: view === t.id ? 700 : 400,
            }}>{t.l}</button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* ═══ DNA TAB — 선천×후천×행동 삼중 융합 패널 ═══ */}
        {/* ═══════════════════════════════════════════════════════ */}
        {view === "dna" && (
          <div style={{ animation: "slideIn .3s" }}>
            {/* z₀ Vector */}
            <div style={{ background: S.card, borderRadius: 10, padding: 10, border: "1px solid rgba(245,158,11,.12)", marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#F59E0B" }}>🧬 선천적 기질 DNA — 에너지 벡터</div>
                  <div style={{ fontSize: 8, color: "rgba(255,255,255,.2)", marginTop: 1 }}>N-KAI 금융 DNA 분석 엔진</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#F59E0B", fontFamily: "monospace" }}>{DNA_INNATE.dayMaster.publicName}</div>
                  <div style={{ fontSize: 8, color: "rgba(255,255,255,.3)" }}>{DNA_INNATE.archetype.mbti} · {DNA_INNATE.archetype.korean}</div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                {[
                  { label: DNA_INNATE.dayMaster.publicName, value: DNA_INNATE.dayMaster.value, desc: DNA_INNATE.dayMaster.desc, color: "#F59E0B" },
                  { label: DNA_INNATE.strength.publicName, value: DNA_INNATE.strength.value, desc: DNA_INNATE.strength.desc, color: "#00D68F" },
                  { label: DNA_INNATE.wealth.publicName, value: DNA_INNATE.wealth.value, desc: DNA_INNATE.wealth.desc, color: "#2D8CFF" },
                  { label: DNA_INNATE.expression.publicName, value: DNA_INNATE.expression.value, desc: DNA_INNATE.expression.desc, color: "#5AA8FF" },
                ].map(item => (
                  <div key={item.label} style={{ padding: "6px 8px", borderRadius: 6, background: `${item.color}06`, border: `1px solid ${item.color}15` }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 9, color: "rgba(255,255,255,.4)" }}>{item.label}</span>
                      <span style={{ fontSize: 14, fontWeight: 900, fontFamily: "monospace", color: item.color }}>{item.value.toFixed(3)}</span>
                    </div>
                    <div style={{ height: 3, background: "rgba(255,255,255,.03)", borderRadius: 2, margin: "3px 0", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${item.value * 100}%`, background: item.color, borderRadius: 2, transition: "width .5s" }} />
                    </div>
                    <div style={{ fontSize: 8, color: "rgba(255,255,255,.25)" }}>{item.desc}</div>
                  </div>
                ))}
              </div>
              {/* 오행 분포 */}
              <div style={{ display: "flex", gap: 3, marginTop: 6, justifyContent: "center" }}>
                {[
                  { el: "木", count: DNA_INNATE.fiveEnergy["木"], color: "#22C55E", name: "성장" },
                  { el: "火", count: DNA_INNATE.fiveEnergy["火"], color: "#EF4444", name: "열정" },
                  { el: "土", count: DNA_INNATE.fiveEnergy["土"], color: "#F59E0B", name: "안정" },
                  { el: "金", count: DNA_INNATE.fiveEnergy["金"], color: "#94A3B8", name: "분석" },
                  { el: "水", count: DNA_INNATE.fiveEnergy["水"], color: "#3B82F6", name: "지혜" },
                ].map(e => (
                  <div key={e.el} style={{ textAlign: "center", padding: "3px 8px", borderRadius: 5, background: e.count === 0 ? "rgba(239,68,68,.06)" : `${e.color}08`, border: `1px solid ${e.count === 0 ? "rgba(239,68,68,.15)" : e.color + "15"}` }}>
                    <div style={{ fontSize: 12, fontWeight: 900, color: e.count === 0 ? "#EF4444" : e.color }}>{e.el}</div>
                    <div style={{ fontSize: 7, color: "rgba(255,255,255,.25)" }}>{e.name}</div>
                    <div style={{ fontSize: 9, fontWeight: 700, fontFamily: "monospace", color: e.count === 0 ? "#EF4444" : e.color }}>{e.count === 0 ? "결핍" : `×${e.count}`}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* KIPA + 공명/충돌 */}
            <div style={{ background: S.card, borderRadius: 10, padding: 10, border: "1px solid rgba(168,85,247,.12)", marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#A855F7", marginBottom: 6 }}>🔄 선천×후천 에너지 시너지/텐션 매트릭스</div>
              <div style={{ fontSize: 8, color: "rgba(255,255,255,.2)", marginBottom: 6 }}>가중 보정식: Score_final = Score_KIPA ± (Score_KIPA × Δ)</div>
              {Object.values(RESONANCE_MAP).map((r, i) => {
                const isResonance = r.relation.includes("시너지");
                return (
                  <div key={i} style={{ padding: "6px 8px", borderRadius: 6, marginBottom: 3, background: isResonance ? "rgba(0,214,143,.03)" : "rgba(239,68,68,.03)", border: `1px solid ${isResonance ? "rgba(0,214,143,.1)" : "rgba(239,68,68,.08)"}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 900, color: isResonance ? "#00D68F" : "#EF4444" }}>{isResonance ? "⚡" : "💥"}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.7)" }}>{r.axis}</span>
                        <span style={{ fontSize: 8, padding: "1px 5px", borderRadius: 3, background: isResonance ? "rgba(0,214,143,.1)" : "rgba(239,68,68,.08)", color: isResonance ? "#00D68F" : "#EF4444", fontWeight: 700 }}>{r.relation}</span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 900, fontFamily: "monospace", color: isResonance ? "#00D68F" : "#EF4444" }}>
                        {r.delta > 0 ? "+" : ""}{(r.delta * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: "rgba(255,255,255,.25)" }}>
                      <span>선천: {r.innate}</span>
                      <span>후천: {r.kipa}</span>
                      <span style={{ fontFamily: "monospace", color: "rgba(255,255,255,.35)" }}>→ {r.corrected.toFixed(3)}</span>
                    </div>
                    <div style={{ fontSize: 8, color: "rgba(255,255,255,.2)", marginTop: 2 }}>{r.reason}</div>
                  </div>
                );
              })}
            </div>

            {/* Phase 가중치 */}
            <div style={{ background: S.card, borderRadius: 10, padding: 10, border: "1px solid rgba(0,214,143,.08)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#00D68F", marginBottom: 6 }}>⚖️ Phase {CURRENT_PHASE} N-Score 가중치 분해</div>
              <div style={{ display: "flex", gap: 3, marginBottom: 8 }}>
                {phaseWeightData.map(p => (
                  <div key={p.name} style={{ flex: 1, textAlign: "center", padding: "5px 4px", borderRadius: 6, background: `${p.color}06`, border: `1px solid ${p.color}15` }}>
                    <div style={{ fontSize: 8, color: "rgba(255,255,255,.3)" }}>{p.name}</div>
                    <div style={{ fontSize: 16, fontWeight: 900, fontFamily: "monospace", color: p.color }}>{p.score}</div>
                    <div style={{ height: 3, background: "rgba(255,255,255,.03)", borderRadius: 2, margin: "2px 4px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${p.weight}%`, background: p.color, borderRadius: 2 }} />
                    </div>
                    <div style={{ fontSize: 8, fontWeight: 700, color: p.color }}>{p.weight}%</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "6px 0", background: "rgba(0,214,143,.03)", borderRadius: 6, border: "1px solid rgba(0,214,143,.08)" }}>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,.4)" }}>융합 N-Score =</span>
                {phaseWeightData.map((p, i) => (
                  <span key={p.name}>
                    <span style={{ fontSize: 9, fontFamily: "monospace", color: p.color }}>{p.score}×{p.weight}%</span>
                    {i < phaseWeightData.length - 1 && <span style={{ color: "rgba(255,255,255,.15)", margin: "0 2px" }}>+</span>}
                  </span>
                ))}
                <span style={{ fontSize: 9, color: "rgba(255,255,255,.4)" }}>=</span>
                <span style={{ fontSize: 16, fontWeight: 900, fontFamily: "monospace", color: "#00D68F" }}>{nScore}</span>
              </div>

              {/* Phase 로드맵 */}
              <div style={{ display: "flex", gap: 3, marginTop: 8 }}>
                {[1, 2, 3].map(p => {
                  const pw = PHASE_WEIGHTS[p];
                  const isCurrent = p === CURRENT_PHASE;
                  return (
                    <div key={p} style={{ flex: 1, padding: "5px 6px", borderRadius: 6, textAlign: "center", background: isCurrent ? `${pw.color}08` : S.card, border: `1px solid ${isCurrent ? pw.color + "30" : S.border}` }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: isCurrent ? pw.color : "rgba(255,255,255,.25)" }}>Phase {p}</div>
                      <div style={{ fontSize: 7, color: "rgba(255,255,255,.2)", marginTop: 1 }}>{pw.label}</div>
                      <div style={{ fontSize: 7, fontFamily: "monospace", color: "rgba(255,255,255,.15)", marginTop: 2 }}>
                        선{Math.round(pw.innate * 100)}·K{Math.round(pw.kipa * 100)}·행{Math.round(pw.behavior * 100)}·동{Math.round(pw.dynamic * 100)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═══ CHAT ═══ */}
        {view === "chat" && (
          <div style={{ animation: "slideIn .3s" }}>
            <div style={{ background: S.card, borderRadius: 10, padding: 10, border: `1px solid ${S.border}`, marginBottom: 8, maxHeight: 400, overflowY: "auto" }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.2)", textAlign: "center", padding: "6px 0" }}>말하듯이 입력하세요. 선천 기질이 분류에 반영됩니다.</div>
              {todayEntries.length === 0 && !aiResponse && (
                <div style={{ textAlign: "center", padding: "20px 12px", color: "rgba(255,255,255,.15)", fontSize: 11 }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
                  예시: "아침에 모닝루틴 하고 포케볼 먹었어"<br />
                  "장명형님이랑 카페에서 미팅"<br />
                  "스트레스 받아서 소주 한잔"
                </div>
              )}
              {todayEntries.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  {(() => {
                    const groups = {};
                    todayEntries.forEach(e => { const r = e.raw || e.text; if (!groups[r]) groups[r] = []; groups[r].push(e); });
                    return Object.entries(groups).map(([raw, items], gi) => (
                      <div key={gi} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
                          <div style={{ background: "rgba(0,214,143,.08)", border: "1px solid rgba(0,214,143,.15)", borderRadius: "12px 12px 2px 12px", padding: "7px 11px", maxWidth: "80%", fontSize: 12, color: "rgba(255,255,255,.8)" }}>{raw}</div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-start" }}>
                          <div style={{ background: "rgba(168,85,247,.06)", border: "1px solid rgba(168,85,247,.12)", borderRadius: "12px 12px 12px 2px", padding: "7px 11px", maxWidth: "85%", fontSize: 11 }}>
                            <div style={{ color: "#A855F7", fontWeight: 700, fontSize: 10, marginBottom: 3 }}>Kai 분류 · DNA 반영</div>
                            {items.map((it, j) => (
                              <div key={j} style={{ padding: "2px 0" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <span style={{ fontSize: 12 }}>{BASE_DIMS[it.dim]?.emoji || "📌"}</span>
                                  <span style={{ color: "rgba(255,255,255,.7)" }}>{it.text}</span>
                                  {it.sub_cluster && it.sub_cluster !== "기타" && <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: "rgba(0,214,143,.08)", color: "#00D68F" }}>{it.sub_cluster}</span>}
                                  {it.who && <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: "rgba(59,130,246,.1)", color: "#3B82F6" }}>👤{it.who}</span>}
                                  <span style={{ marginLeft: "auto", fontSize: 10, fontFamily: "monospace", color: it.wellness >= 65 ? "#00D68F" : it.wellness >= 40 ? "#F59E0B" : "#EF4444" }}>W:{it.wellness}</span>
                                </div>
                                {it.innate_note && <div style={{ fontSize: 8, color: "#F59E0B", marginLeft: 22, marginTop: 1 }}>🧬 {it.innate_note}</div>}
                              </div>
                            ))}
                            {aiResponse?.resonance && <div style={{ fontSize: 8, color: "#A855F7", marginTop: 4, paddingTop: 3, borderTop: "1px solid rgba(168,85,247,.1)" }}>⚡ {aiResponse.resonance}</div>}
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div style={{ display: "flex", gap: 3, marginBottom: 6, flexWrap: "wrap" }}>
              {["🌅 모닝루틴 완료", "🥗 건강식 먹었어", "💚 쾌변!", "🏃 운동했어", "☕ 카페", "😊 컨디션 좋음"].map(q => (
                <button key={q} onClick={() => setInputText(q.slice(2).trim())} style={{
                  padding: "4px 8px", borderRadius: 6, fontSize: 10, cursor: "pointer",
                  background: "rgba(0,214,143,.04)", border: "1px solid rgba(0,214,143,.1)", color: "rgba(255,255,255,.45)",
                }}>{q}</button>
              ))}
            </div>
            {todayEntries.length > 0 && (
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
                <button onClick={closeDay} style={{ padding: "5px 14px", borderRadius: 7, fontSize: 10, fontWeight: 700, cursor: "pointer", background: "rgba(0,214,143,.08)", border: "1px solid rgba(0,214,143,.2)", color: "#00D68F" }}>✓ 하루 마감</button>
              </div>
            )}
          </div>
        )}

        {/* ═══ RADAR ═══ */}
        {view === "radar" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, animation: "slideIn .3s" }}>
            <div style={{ background: S.card, borderRadius: 10, padding: 10, border: "1px solid rgba(0,214,143,.08)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#00D68F", marginBottom: 4 }}>🔮 10차원 라이프 레이더</div>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,.05)" />
                  <PolarAngleAxis dataKey="axis" tick={{ fontSize: 7, fill: "rgba(255,255,255,.4)" }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                  <Radar dataKey="value" stroke="#00D68F" fill="#00D68F" fillOpacity={0.12} strokeWidth={2} dot={{ r: 3, fill: "#00D68F" }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {Object.entries(BASE_DIMS).map(([k, v]) => {
                const val = Math.round(dims[k] || 0);
                return (
                  <div key={k} style={{ background: S.card, borderRadius: 6, padding: "4px 7px", border: `1px solid ${v.color}10` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 1 }}>
                      <span style={{ fontSize: 9, color: "rgba(255,255,255,.5)" }}>{v.emoji} {v.name}</span>
                      <span style={{ fontSize: 10, fontWeight: 800, color: v.color, fontFamily: "monospace" }}>{val}</span>
                    </div>
                    <div style={{ height: 3, background: "rgba(255,255,255,.03)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${val}%`, background: v.color + "cc", borderRadius: 2, transition: "width .5s" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ TRAJECTORY ═══ */}
        {view === "trajectory" && (
          <div style={{ background: S.card, borderRadius: 10, padding: 12, border: "1px solid rgba(0,214,143,.08)", animation: "slideIn .3s" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#00D68F", marginBottom: 6 }}>🌊 N-Score 궤적 · 삼중 융합</div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="ng4" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00D68F" stopOpacity={.25} /><stop offset="100%" stopColor="#00D68F" stopOpacity={0} /></linearGradient>
                  <linearGradient id="pg4" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#A855F7" stopOpacity={.15} /><stop offset="100%" stopColor="#A855F7" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.03)" />
                <XAxis dataKey="date" tick={{ fontSize: 8, fill: "rgba(255,255,255,.3)" }} />
                <YAxis domain={[25, 100]} tick={{ fontSize: 8, fill: "rgba(255,255,255,.3)" }} />
                <Tooltip content={<Tip />} />
                <Area type="monotone" dataKey="nScore" stroke="#00D68F" fill="url(#ng4)" strokeWidth={2.5} name="N-Score" dot={{ r: 3, fill: "#00D68F" }} />
                <Area type="monotone" dataKey="post" stroke="#A855F7" fill="url(#pg4)" strokeWidth={1.5} strokeDasharray="4 4" name="Posterior%" dot={{ r: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
            {/* 선천 기저선 표시 */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, padding: "4px 8px", borderRadius: 5, background: "rgba(245,158,11,.04)", border: "1px solid rgba(245,158,11,.08)" }}>
              <span style={{ fontSize: 9, color: "#F59E0B" }}>🧬</span>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,.35)" }}>선천 기저 N-Score:</span>
              <span style={{ fontSize: 11, fontWeight: 900, fontFamily: "monospace", color: "#F59E0B" }}>{nScoreData.components.innate}</span>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,.2)", marginLeft: "auto" }}>행동 데이터가 기저선으로부터의 성장을 증명</span>
            </div>
          </div>
        )}

        {/* ═══ PREDICTIONS ═══ */}
        {view === "predict" && (
          <div style={{ animation: "slideIn .3s" }}>
            <div style={{ background: S.card, borderRadius: 10, padding: 10, border: "1px solid rgba(245,158,11,.08)", marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#F59E0B", marginBottom: 6 }}>⚡ DNA 기반 AI 예측</div>
              {predictions.map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 6, marginBottom: 2, background: "rgba(245,158,11,.02)", border: "1px solid rgba(245,158,11,.05)" }}>
                  <span style={{ fontSize: 15 }}>{p.emoji}</span>
                  <div style={{ flex: 1 }}><div style={{ fontSize: 11, fontWeight: 600 }}>{p.text}</div><div style={{ fontSize: 8, color: "rgba(255,255,255,.25)" }}>{p.algo}</div></div>
                  {p.conf > 0 && <span style={{ fontSize: 16, fontWeight: 900, fontFamily: "monospace", color: p.conf >= 80 ? "#00D68F" : "#F59E0B" }}>{p.conf}%</span>}
                </div>
              ))}
            </div>
            <div style={{ background: S.card, borderRadius: 10, padding: 10, border: "1px solid rgba(0,214,143,.08)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#00D68F", marginBottom: 6 }}>📜 DNA 강화 행동 법칙</div>
              {[
                { n: "극신강 관성 법칙", d: "신강0.857 → 루틴 유지력 +87%", c: 92 },
                { n: "재성제로 이탈 감지", d: "재성0.0 → 소비 이탈 시 경고 강화", c: 88 },
                { n: "火 결핍 보상 패턴", d: "火 없음 → 자극 추구 행동 = 보상", c: 80 },
                { n: "크레이빙 3일 포화", d: "동일 3일 → 반대 전환", c: 85 },
                { n: "모닝루틴 내구성", d: "7일+ → 1회 이탈 면역", c: 75 },
              ].map((l, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 0", borderBottom: "1px solid rgba(255,255,255,.02)", fontSize: 10 }}>
                  <span>{l.c >= 85 ? "✅" : "⚠️"}</span>
                  <span style={{ color: "#fff", flex: 1 }}>{l.n}</span>
                  <span style={{ color: "rgba(255,255,255,.2)", fontSize: 9 }}>{l.d}</span>
                  <span style={{ fontWeight: 700, fontFamily: "monospace", color: l.c >= 85 ? "#00D68F" : "#F59E0B" }}>{l.c}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ CLUSTERS / ANALYSIS ═══ */}
        {view === "clusters" && (
          <div style={{ animation: "slideIn .3s" }}>
            <div style={{ background: S.card, borderRadius: 10, padding: 10, border: "1px solid rgba(168,85,247,.08)", marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#A855F7", marginBottom: 6 }}>🧬 서브클러스터</div>
              {topSubs.length === 0 ? (
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.2)", textAlign: "center", padding: 12 }}>데이터 입력 시 자동 생성</div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {topSubs.map(([key, cnt], i) => {
                    const [dim, name] = key.split(":");
                    return (
                      <div key={i} style={{ padding: "4px 8px", borderRadius: 6, fontSize: 10, background: cnt >= 3 ? "rgba(0,214,143,.06)" : "rgba(255,255,255,.02)", border: `1px solid ${cnt >= 3 ? "rgba(0,214,143,.15)" : "rgba(255,255,255,.05)"}`, color: cnt >= 3 ? "#00D68F" : "rgba(255,255,255,.4)" }}>
                        {BASE_DIMS[dim]?.emoji || "📌"} {name} <span style={{ fontWeight: 700, fontFamily: "monospace" }}>×{cnt}</span>{cnt >= 3 && <span style={{ marginLeft: 3, fontSize: 8 }}>🆕</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div style={{ background: S.card, borderRadius: 10, padding: 10, border: "1px solid rgba(59,130,246,.08)", marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#3B82F6", marginBottom: 6 }}>👥 관계 네트워크</div>
              {topPeople.length === 0 ? (
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.2)", textAlign: "center", padding: 12 }}>사람 언급 시 자동 추적</div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {topPeople.map(([name, cnt], i) => (
                    <div key={i} style={{ padding: "4px 8px", borderRadius: 6, fontSize: 10, background: "rgba(59,130,246,.06)", border: "1px solid rgba(59,130,246,.12)", color: "#3B82F6" }}>👤 {name} <span style={{ fontWeight: 700, fontFamily: "monospace" }}>×{cnt}</span></div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ background: S.card, borderRadius: 10, padding: 10, border: "1px solid rgba(0,214,143,.08)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#00D68F", marginBottom: 6 }}>⭐ 6개월 진화 · DNA 기저선 대비</div>
              {[
                { l: "외식 의존", f: "45→2", c: "-96%", cl: "#EF4444" },
                { l: "유흥/음주", f: "47→2", c: "-96%", cl: "#DC2626" },
                { l: "건강식", f: "0→58", c: "+∞", cl: "#00D68F" },
                { l: "모닝루틴", f: "0→95", c: "NEW", cl: "#F59E0B" },
                { l: "N-Score(융합)", f: `35→${nScore}`, c: `+${Math.round((nScore / 35 - 1) * 100)}%`, cl: "#A855F7" },
                { l: "선천 기저 대비", f: `${nScoreData.components.innate}→${nScore}`, c: `+${nScore - nScoreData.components.innate}pt`, cl: "#F59E0B" },
              ].map((t, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", padding: "3px 0", borderBottom: "1px solid rgba(255,255,255,.02)", fontSize: 10 }}>
                  <span style={{ color: "rgba(255,255,255,.4)", flex: 1 }}>{t.l}</span>
                  <span style={{ color: "rgba(255,255,255,.25)", fontFamily: "monospace", width: 60, textAlign: "right" }}>{t.f}</span>
                  <span style={{ fontWeight: 700, color: t.c.startsWith("+") || t.c === "NEW" ? "#00D68F" : "#EF4444", width: 50, textAlign: "right" }}>{t.c}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ FIXED INPUT BAR ═══ */}
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "8px 10px", background: "linear-gradient(180deg, transparent, rgba(5,5,10,.95) 20%)", backdropFilter: "blur(10px)" }}>
          <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", gap: 6, alignItems: "center" }}>
            <input value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={e => e.key === "Enter" && processInput()}
              placeholder="오늘 뭐 했어? (선천 기질이 분석에 반영됩니다)"
              style={{ flex: 1, padding: "10px 14px", borderRadius: 10, fontSize: 13, background: "rgba(255,255,255,.04)", border: "1px solid rgba(0,214,143,.15)", color: "#fff", outline: "none" }} />
            <button onClick={processInput} disabled={processing} style={{
              padding: "10px 16px", borderRadius: 10, cursor: processing ? "wait" : "pointer",
              background: processing ? "rgba(168,85,247,.1)" : "rgba(0,214,143,.1)",
              border: `1px solid ${processing ? "rgba(168,85,247,.2)" : "rgba(0,214,143,.25)"}`,
              color: processing ? "#A855F7" : "#00D68F", fontWeight: 700, fontSize: 13, whiteSpace: "nowrap",
            }}>{processing ? <span style={{ animation: "typing 1s infinite" }}>분석중...</span> : "→ Kai"}</button>
          </div>
        </div>

        <div style={{ textAlign: "center", paddingTop: 6, fontSize: 7, color: "rgba(255,255,255,.08)" }}>
          P25KAI001KR · 선천×후천×행동 삼중 융합 · Phase {CURRENT_PHASE}
        </div>
      </div>
    </div>
  );
}
