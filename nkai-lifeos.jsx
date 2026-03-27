import { useState, useEffect, useCallback, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, Cell, AreaChart, Area, ScatterChart, Scatter, CartesianGrid, Legend, ReferenceLine } from "recharts";

// ═══════════════════════════════════════════════════════════════
// N-KAI LIVING PROFILE · AUTONOMOUS LIFE OS
// 5 Core Algorithms United: Neural CDE × Bayesian × Clustering × ROC × Compatibility
// Patent P25KAI001KR — Dynamic Evolving Kairos Persona Engine
// ═══════════════════════════════════════════════════════════════

// ─── Brand Constants ───
const BRAND = {
  economic: "#2D8CFF",    // 💰 경제감각
  expression: "#5AA8FF",  // ⚡ 표현에너지
  crisis: "#00D68F",      // 🛡️ 위기대응력
  accent: "#FF6B35",
  warning: "#FFB800",
  bg: "#0A0E1A",
  surface: "#111827",
  surfaceLight: "#1F2937",
  text: "#E5E7EB",
  textDim: "#9CA3AF",
  border: "#374151",
  glow: "rgba(45, 140, 255, 0.15)",
};

// ─── Five Elements ───
const ELEMENTS = {
  木: { color: "#22C55E", en: "Wood", trait: "성장·창의" },
  火: { color: "#EF4444", en: "Fire", trait: "열정·표현" },
  土: { color: "#EAB308", en: "Earth", trait: "안정·중재" },
  金: { color: "#A855F7", en: "Metal", trait: "분석·원칙" },
  水: { color: "#3B82F6", en: "Water", trait: "지혜·적응" },
};

// ─── 16 Archetypes ───
const ARCHETYPES = [
  { id: "RI", name: "Rational Investor", kr: "분석투자가", group: "분석가", icon: "📊" },
  { id: "SP", name: "Stable Planner", kr: "안정기획자", group: "실용주의", icon: "🏛️" },
  { id: "RS", name: "Risk Seeker", kr: "도전항해사", group: "항해사", icon: "⚡" },
  { id: "EC", name: "Emotional Creator", kr: "감성창조자", group: "비전가", icon: "🎨" },
  { id: "SM", name: "Strategic Master", kr: "전략마스터", group: "분석가", icon: "♟️" },
  { id: "GK", name: "Guardian Keeper", kr: "수호관리자", group: "실용주의", icon: "🛡️" },
  { id: "VA", name: "Venture Admiral", kr: "벤처제독", group: "항해사", icon: "🚀" },
  { id: "IF", name: "Intuitive Futurist", kr: "직관미래가", group: "비전가", icon: "🔮" },
  { id: "DT", name: "Data Tactician", kr: "데이터전략가", group: "분석가", icon: "📈" },
  { id: "BM", name: "Budget Manager", kr: "예산관리자", group: "실용주의", icon: "💼" },
  { id: "TK", name: "Trend Tracker", kr: "트렌드추적자", group: "항해사", icon: "🌊" },
  { id: "VS", name: "Visionary Sage", kr: "비전현자", group: "비전가", icon: "🌟" },
  { id: "LP", name: "Logic Pioneer", kr: "논리개척자", group: "분석가", icon: "🧬" },
  { id: "HB", name: "Harmony Builder", kr: "조화구축자", group: "실용주의", icon: "⚖️" },
  { id: "WP", name: "Wave Pilot", kr: "파동조종사", group: "항해사", icon: "🌀" },
  { id: "DC", name: "Dream Catalyst", kr: "꿈촉매자", group: "비전가", icon: "✨" },
];

// ─── Seeded Random for Reproducibility ───
const seededRandom = (seed) => {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
};

// ─── Simulation Engine ───
function generateLifeOSData(seed = 42) {
  const rng = seededRandom(seed);
  const r = () => rng();

  // Innate Vector (z₀)
  const z0 = {
    dayMaster: 0.72 + r() * 0.1,
    strength: 0.35 + r() * 0.3,
    wealth: 0.55 + r() * 0.2,
    expression: 0.60 + r() * 0.2,
  };

  // KIPA scores
  const kipa = { NS: 0.3 + r()*0.4, TF: -0.2 + r()*0.4, JP: 0.1 + r()*0.5, EI: 0.2 + r()*0.3 };

  // Bayesian evolution (10 phases)
  const bayesianPhases = [];
  let prior = { ...z0 };
  for (let i = 0; i < 10; i++) {
    const evidence = r() * 0.15 - 0.05;
    const posterior = {
      dayMaster: Math.min(1, Math.max(0, prior.dayMaster + evidence * (1 - prior.dayMaster))),
      strength: Math.min(1, Math.max(0, prior.strength + (r() * 0.1 - 0.03))),
      wealth: Math.min(1, Math.max(0, prior.wealth + (r() * 0.12 - 0.04))),
      expression: Math.min(1, Math.max(0, prior.expression + (r() * 0.08 - 0.02))),
    };
    const accuracy = 0.55 + i * 0.038 + r() * 0.02;
    bayesianPhases.push({
      phase: i + 1,
      day: i * 18 + Math.floor(r() * 5),
      prior: { ...prior },
      posterior: { ...posterior },
      accuracy: Math.min(0.94, accuracy),
      evidence: Math.floor(20 + i * 40 + r() * 20),
    });
    prior = { ...posterior };
  }

  // Neural CDE trajectory (180 days)
  const trajectory = [];
  let vec = [z0.dayMaster, z0.strength, z0.wealth, z0.expression];
  for (let d = 0; d <= 180; d += 3) {
    const drift = vec.map((v, j) => {
      const trend = j === 2 ? 0.001 : (j === 1 ? -0.0005 : 0.0003);
      const noise = (r() - 0.5) * 0.02;
      const crisis = (d > 80 && d < 100) ? -0.015 * (j === 1 ? 2 : 1) : 0;
      return Math.min(1, Math.max(0, v + trend + noise + crisis));
    });
    vec = drift;
    const nScore = Math.round(200 + (vec[0]*200 + vec[1]*150 + vec[2]*180 + vec[3]*160) + r()*30);
    trajectory.push({
      day: d,
      dayMaster: +vec[0].toFixed(3),
      strength: +vec[1].toFixed(3),
      wealth: +vec[2].toFixed(3),
      expression: +vec[3].toFixed(3),
      nScore: Math.min(950, nScore),
      crisis: d > 80 && d < 100,
    });
  }

  // ROC curves per axis
  const rocData = ["N/S", "T/F", "J/P", "E/I"].map((axis, idx) => {
    const points = [];
    const auc = 0.78 + idx * 0.04 + r() * 0.05;
    for (let fpr = 0; fpr <= 1.0; fpr += 0.05) {
      const tpr = Math.min(1, Math.pow(fpr, 1 / (auc / (1 - auc + 0.01))));
      points.push({ fpr: +fpr.toFixed(2), tpr: +tpr.toFixed(3) });
    }
    const optIdx = Math.floor(points.length * (0.3 + r() * 0.2));
    return { axis, auc: +auc.toFixed(3), points, optimalIdx: optIdx, threshold: +(0.4 + r() * 0.2).toFixed(2) };
  });

  // Clustering (16 archetypes in 2D projection)
  const clusters = ARCHETYPES.map((a, i) => {
    const angle = (i / 16) * Math.PI * 2;
    const radius = 2.5 + r() * 1.5;
    return {
      ...a,
      x: +(Math.cos(angle) * radius).toFixed(2),
      y: +(Math.sin(angle) * radius).toFixed(2),
      size: Math.floor(30 + r() * 120),
      distance: +(r() * 3 + 0.5).toFixed(2),
    };
  });
  const userCluster = { x: +(clusters[2].x + r() * 0.8 - 0.4).toFixed(2), y: +(clusters[2].y + r() * 0.6 - 0.3).toFixed(2) };

  // Compatibility sample
  const compatData = [
    { pair: "火 × 木", score: 92, type: "상생", desc: "Triple Synergy" },
    { pair: "水 × 金", score: 85, type: "상생", desc: "Natural Flow" },
    { pair: "土 × 火", score: 78, type: "상생", desc: "Stable Growth" },
    { pair: "木 × 金", score: 42, type: "상극", desc: "Dynamic Tension" },
    { pair: "火 × 水", score: 35, type: "상극", desc: "Opposing Forces" },
  ];

  // Life OS timeline events
  const lifeEvents = [
    { day: 0, event: "DNA 분석 완료", type: "genesis", nGrade: "N7" },
    { day: 15, event: "KIPA 설문 완료", type: "kipa", nGrade: "N6" },
    { day: 30, event: "첫 투자 행동 감지", type: "behavior", nGrade: "N6" },
    { day: 60, event: "성향 이동 감지 (안정→성장)", type: "shift", nGrade: "N5" },
    { day: 90, event: "🔴 위기 구간 (시장 변동)", type: "crisis", nGrade: "N5" },
    { day: 95, event: "🛡️ 복원력 발동 (97.3%)", type: "recovery", nGrade: "N4" },
    { day: 120, event: "아키타입 재분류: RS→VA", type: "reclassify", nGrade: "N3" },
    { day: 150, event: "골든타임 최적화 달성", type: "golden", nGrade: "N2" },
    { day: 180, event: "Living Profile 안정화", type: "stable", nGrade: "N1" },
  ];

  // Five Energy distribution
  const fiveEnergy = [
    { element: "木", value: 15 + Math.floor(r()*10), color: ELEMENTS.木.color },
    { element: "火", value: 25 + Math.floor(r()*10), color: ELEMENTS.火.color },
    { element: "土", value: 30 + Math.floor(r()*8), color: ELEMENTS.土.color },
    { element: "金", value: 12 + Math.floor(r()*8), color: ELEMENTS.金.color },
    { element: "水", value: 10 + Math.floor(r()*10), color: ELEMENTS.水.color },
  ];

  return { z0, kipa, bayesianPhases, trajectory, rocData, clusters, userCluster, compatData, lifeEvents, fiveEnergy };
}

// ─── Animated Counter ───
function AnimNum({ value, suffix = "", prefix = "" }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = display;
    const diff = value - start;
    const steps = 20;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setDisplay(start + diff * (step / steps));
      if (step >= steps) clearInterval(timer);
    }, 25);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{prefix}{typeof value === "number" && value % 1 !== 0 ? display.toFixed(3) : Math.round(display)}{suffix}</span>;
}

// ─── Glow Card ───
function GlowCard({ children, color = BRAND.economic, className = "", onClick, active }) {
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl border transition-all duration-300 ${className}`}
      style={{
        background: active ? `linear-gradient(135deg, ${color}15, ${BRAND.surface})` : BRAND.surface,
        borderColor: active ? color : BRAND.border,
        boxShadow: active ? `0 0 20px ${color}30, inset 0 0 20px ${color}08` : "none",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      {active && <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />}
      {children}
    </div>
  );
}

// ─── Pulse Dot ───
function PulseDot({ color, size = 8 }) {
  return (
    <span className="relative inline-flex" style={{ width: size, height: size }}>
      <span className="absolute inline-flex h-full w-full rounded-full opacity-40" style={{ background: color, animation: "ping 2s cubic-bezier(0,0,0.2,1) infinite" }} />
      <span className="relative inline-flex rounded-full" style={{ width: size, height: size, background: color }} />
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB 1: DNA GENESIS — 선천벡터 + KIPA → 융합
// ═══════════════════════════════════════════════════════════════
function DNAGenesis({ data }) {
  const radarData = [
    { axis: "일간\nDay Master", innate: data.z0.dayMaster * 100, kipa: (0.5 + data.kipa.NS) * 100, fused: ((data.z0.dayMaster + 0.5 + data.kipa.NS) / 2) * 100 },
    { axis: "신강/신약\nStrength", innate: data.z0.strength * 100, kipa: (0.5 + data.kipa.TF) * 100, fused: ((data.z0.strength + 0.5 + data.kipa.TF) / 2) * 100 },
    { axis: "재성\nWealth", innate: data.z0.wealth * 100, kipa: (0.5 + data.kipa.JP) * 100, fused: ((data.z0.wealth + 0.5 + data.kipa.JP) / 2) * 100 },
    { axis: "식상\nExpression", innate: data.z0.expression * 100, kipa: (0.5 + data.kipa.EI) * 100, fused: ((data.z0.expression + 0.5 + data.kipa.EI) / 2) * 100 },
  ];

  const fusionSteps = [
    { label: "생년월일시 입력", icon: "📅", detail: "사주팔자 8글자 생성", status: "done" },
    { label: "십신 관계도 생성", icon: "🔗", detail: "10-node Relation Graph", status: "done" },
    { label: "4대 핵심인자 산출", icon: "🧬", detail: "일간·신강·재성·식상", status: "done" },
    { label: "선천 벡터 V_core", icon: "💎", detail: `[${Object.values(data.z0).map(v => v.toFixed(2)).join(", ")}]`, status: "done" },
    { label: "KIPA 16Q 응답", icon: "📋", detail: "N/S, T/F, J/P, E/I", status: "done" },
    { label: "공명/충돌 보정", icon: "⚡", detail: "가중차 Δ ±10~20%", status: "done" },
    { label: "V_fused 생성", icon: "🔥", detail: "금융 DNA 융합 벡터", status: "active" },
  ];

  return (
    <div className="space-y-6">
      {/* Pipeline */}
      <div className="p-5 rounded-xl" style={{ background: `linear-gradient(135deg, ${BRAND.surface}, ${BRAND.bg})`, border: `1px solid ${BRAND.border}` }}>
        <h3 className="text-sm font-bold mb-4" style={{ color: BRAND.economic }}>
          ◆ FUSION PIPELINE — 선천×후천 융합 파이프라인 (Patent Claim 5)
        </h3>
        <div className="flex flex-wrap gap-2">
          {fusionSteps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs" style={{
                background: s.status === "active" ? `${BRAND.economic}20` : `${BRAND.surfaceLight}`,
                border: `1px solid ${s.status === "active" ? BRAND.economic : BRAND.border}`,
                color: s.status === "active" ? BRAND.economic : BRAND.text,
              }}>
                <span>{s.icon}</span>
                <div>
                  <div className="font-semibold">{s.label}</div>
                  <div style={{ color: BRAND.textDim, fontSize: 10 }}>{s.detail}</div>
                </div>
              </div>
              {i < fusionSteps.length - 1 && <span style={{ color: BRAND.textDim }}>→</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Radar: Innate vs KIPA vs Fused */}
        <GlowCard color={BRAND.economic} active>
          <div className="p-5">
            <h3 className="text-sm font-bold mb-1" style={{ color: BRAND.economic }}>
              4D VECTOR FUSION — 선천·후천·융합 비교
            </h3>
            <p className="text-xs mb-3" style={{ color: BRAND.textDim }}>Innate(z₀) × KIPA → Fused Vector</p>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke={BRAND.border} />
                <PolarAngleAxis dataKey="axis" tick={{ fill: BRAND.textDim, fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: BRAND.textDim, fontSize: 9 }} />
                <Radar name="선천 Innate" dataKey="innate" stroke={BRAND.accent} fill={BRAND.accent} fillOpacity={0.15} strokeWidth={2} />
                <Radar name="KIPA" dataKey="kipa" stroke={BRAND.expression} fill={BRAND.expression} fillOpacity={0.15} strokeWidth={2} />
                <Radar name="융합 Fused" dataKey="fused" stroke={BRAND.crisis} fill={BRAND.crisis} fillOpacity={0.25} strokeWidth={2.5} />
                <Legend wrapperStyle={{ fontSize: 10, color: BRAND.textDim }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </GlowCard>

        {/* Five Energy Distribution */}
        <GlowCard color={BRAND.expression} active>
          <div className="p-5">
            <h3 className="text-sm font-bold mb-1" style={{ color: BRAND.expression }}>
              5-ENERGY SPECTRUM — 오행 에너지 분포
            </h3>
            <p className="text-xs mb-3" style={{ color: BRAND.textDim }}>선천적 에너지 균형도 (Energy Balance Index)</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.fiveEnergy} layout="vertical">
                <XAxis type="number" domain={[0, 50]} tick={{ fill: BRAND.textDim, fontSize: 10 }} />
                <YAxis dataKey="element" type="category" width={30} tick={{ fill: BRAND.text, fontSize: 13 }} />
                <Tooltip contentStyle={{ background: BRAND.surface, border: `1px solid ${BRAND.border}`, borderRadius: 8, color: BRAND.text, fontSize: 12 }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {data.fiveEnergy.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-3 mt-3">
              {data.fiveEnergy.map((e, i) => (
                <div key={i} className="text-center">
                  <div className="text-lg">{e.element}</div>
                  <div className="text-xs font-bold" style={{ color: e.color }}>{e.value}%</div>
                  <div style={{ fontSize: 9, color: BRAND.textDim }}>{ELEMENTS[e.element].trait}</div>
                </div>
              ))}
            </div>
          </div>
        </GlowCard>
      </div>

      {/* KIPA Axis Details */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { axis: "N/S", label: "정보필터링", innate: "일간(日干)", val: data.kipa.NS, delta: "±20%", desc: "직관 vs 감각" },
          { axis: "T/F", label: "의사결정", innate: "신강/신약", val: data.kipa.TF, delta: "±15%", desc: "사고 vs 감정" },
          { axis: "J/P", label: "실행습관", innate: "재성(財星)", val: data.kipa.JP, delta: "±10%", desc: "계획 vs 유연" },
          { axis: "E/I", label: "대외지향성", innate: "식상(食傷)", val: data.kipa.EI, delta: "±10%", desc: "외향 vs 내향" },
        ].map((item, i) => (
          <div key={i} className="p-3 rounded-lg" style={{ background: BRAND.surfaceLight, border: `1px solid ${BRAND.border}` }}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold" style={{ color: BRAND.economic }}>{item.axis}</span>
              <span className="text-xs px-2 py-0.5 rounded" style={{ background: `${BRAND.crisis}20`, color: BRAND.crisis }}>{item.delta}</span>
            </div>
            <div className="text-xs mb-1" style={{ color: BRAND.text }}>{item.label} — {item.desc}</div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: BRAND.bg }}>
              <div className="h-full rounded-full transition-all duration-1000" style={{
                width: `${(item.val + 1) / 2 * 100}%`,
                background: `linear-gradient(90deg, ${BRAND.accent}, ${BRAND.economic})`,
              }} />
            </div>
            <div className="flex justify-between mt-1">
              <span style={{ fontSize: 9, color: BRAND.textDim }}>↔ {item.innate}</span>
              <span style={{ fontSize: 9, color: BRAND.text }}>{(item.val > 0 ? "+" : "")}{item.val.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB 2: ALGORITHM ENGINE — 4대 알고리즘 통합
// ═══════════════════════════════════════════════════════════════
function AlgorithmEngine({ data }) {
  const [algoTab, setAlgoTab] = useState(0);
  const algos = [
    { name: "Bayesian", icon: "🎲", color: BRAND.economic },
    { name: "Clustering", icon: "🔬", color: BRAND.expression },
    { name: "ROC", icon: "📐", color: BRAND.crisis },
    { name: "Neural CDE", icon: "🧠", color: BRAND.accent },
  ];

  return (
    <div className="space-y-4">
      {/* Algorithm selector */}
      <div className="flex gap-2">
        {algos.map((a, i) => (
          <button key={i} onClick={() => setAlgoTab(i)}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-lg text-xs font-bold transition-all"
            style={{
              background: algoTab === i ? `${a.color}20` : BRAND.surfaceLight,
              border: `1px solid ${algoTab === i ? a.color : BRAND.border}`,
              color: algoTab === i ? a.color : BRAND.textDim,
            }}>
            <span className="text-base">{a.icon}</span> {a.name}
          </button>
        ))}
      </div>

      {/* Bayesian */}
      {algoTab === 0 && (
        <div className="space-y-4">
          <GlowCard color={BRAND.economic} active>
            <div className="p-5">
              <h3 className="text-sm font-bold mb-1" style={{ color: BRAND.economic }}>
                BAYESIAN INFERENCE — 사전→사후 확률 갱신
              </h3>
              <p className="text-xs mb-3" style={{ color: BRAND.textDim }}>
                z₀(선천벡터)를 사전확률로 설정 → 행동 데이터 관측 → 사후확률로 점진적 갱신
              </p>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data.bayesianPhases}>
                  <CartesianGrid strokeDasharray="3 3" stroke={BRAND.border} />
                  <XAxis dataKey="day" tick={{ fill: BRAND.textDim, fontSize: 10 }} label={{ value: "Days", position: "insideBottom", offset: -5, fill: BRAND.textDim, fontSize: 10 }} />
                  <YAxis domain={[0.4, 1]} tick={{ fill: BRAND.textDim, fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: BRAND.surface, border: `1px solid ${BRAND.border}`, borderRadius: 8, color: BRAND.text, fontSize: 11 }}
                    formatter={(v, name) => [typeof v === "number" ? (v * 100).toFixed(1) + "%" : v, name]} />
                  <Line dataKey="accuracy" stroke={BRAND.crisis} strokeWidth={2.5} dot={{ fill: BRAND.crisis, r: 4 }} name="정확도 Accuracy" />
                  <ReferenceLine y={0.55} stroke={BRAND.textDim} strokeDasharray="5 5" label={{ value: "Flat Prior Baseline", fill: BRAND.textDim, fontSize: 9 }} />
                  <ReferenceLine y={0.93} stroke={BRAND.economic} strokeDasharray="5 5" label={{ value: "z₀ Convergence Target", fill: BRAND.economic, fontSize: 9 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlowCard>
          <div className="grid grid-cols-5 gap-2">
            {data.bayesianPhases.slice(0, 5).map((p, i) => (
              <div key={i} className="p-2 rounded-lg text-center" style={{ background: BRAND.surfaceLight, border: `1px solid ${BRAND.border}` }}>
                <div className="text-xs font-bold" style={{ color: BRAND.economic }}>Phase {p.phase}</div>
                <div className="text-lg font-bold" style={{ color: BRAND.text }}>{(p.accuracy * 100).toFixed(1)}%</div>
                <div style={{ fontSize: 9, color: BRAND.textDim }}>{p.evidence} 관측</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clustering */}
      {algoTab === 1 && (
        <div className="space-y-4">
          <GlowCard color={BRAND.expression} active>
            <div className="p-5">
              <h3 className="text-sm font-bold mb-1" style={{ color: BRAND.expression }}>
                UNSUPERVISED CLUSTERING — 16 아키타입 군집화
              </h3>
              <p className="text-xs mb-3" style={{ color: BRAND.textDim }}>
                V_fused → 판단스타일(N/S×T/F) 4그룹 → 행동스타일(J/P×E/I) 16형 세분화
              </p>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={BRAND.border} />
                  <XAxis dataKey="x" type="number" domain={[-5, 5]} tick={{ fill: BRAND.textDim, fontSize: 10 }} name="판단스타일" />
                  <YAxis dataKey="y" type="number" domain={[-5, 5]} tick={{ fill: BRAND.textDim, fontSize: 10 }} name="행동스타일" />
                  <Tooltip contentStyle={{ background: BRAND.surface, border: `1px solid ${BRAND.border}`, borderRadius: 8, color: BRAND.text, fontSize: 11 }}
                    formatter={(v, name) => [v, name]}
                    labelFormatter={(label) => ""} />
                  <Scatter data={data.clusters} fill={BRAND.expression}>
                    {data.clusters.map((c, i) => (
                      <Cell key={i} fill={
                        c.group === "분석가" ? BRAND.economic :
                        c.group === "실용주의" ? BRAND.crisis :
                        c.group === "항해사" ? BRAND.accent :
                        BRAND.expression
                      } opacity={0.7} />
                    ))}
                  </Scatter>
                  <Scatter data={[data.userCluster]} fill="#fff">
                    <Cell fill="#FFFFFF" />
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2" style={{ fontSize: 10 }}>
                {[
                  { label: "분석가", color: BRAND.economic },
                  { label: "실용주의", color: BRAND.crisis },
                  { label: "항해사", color: BRAND.accent },
                  { label: "비전가", color: BRAND.expression },
                  { label: "● 사용자", color: "#fff" },
                ].map((l, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: l.color, display: "inline-block" }} />
                    <span style={{ color: BRAND.textDim }}>{l.label}</span>
                  </span>
                ))}
              </div>
            </div>
          </GlowCard>
          <div className="grid grid-cols-4 gap-2">
            {data.clusters.slice(0, 8).map((c, i) => (
              <div key={i} className="p-2 rounded-lg flex items-center gap-2" style={{ background: BRAND.surfaceLight, border: `1px solid ${BRAND.border}` }}>
                <span className="text-lg">{c.icon}</span>
                <div>
                  <div className="text-xs font-bold" style={{ color: BRAND.text }}>{c.kr}</div>
                  <div style={{ fontSize: 9, color: BRAND.textDim }}>{c.name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ROC */}
      {algoTab === 2 && (
        <div className="space-y-4">
          <GlowCard color={BRAND.crisis} active>
            <div className="p-5">
              <h3 className="text-sm font-bold mb-1" style={{ color: BRAND.crisis }}>
                ROC THRESHOLD CALIBRATION — 민감도-특이도 자동 보정
              </h3>
              <p className="text-xs mb-3" style={{ color: BRAND.textDim }}>
                각 축별 TPR-FPR 곡선 → AUC 최대화 → 최적 임계점(Threshold*) 자동 탐색
              </p>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={BRAND.border} />
                  <XAxis dataKey="fpr" type="number" domain={[0, 1]} tick={{ fill: BRAND.textDim, fontSize: 10 }}
                    label={{ value: "FPR (False Positive Rate)", position: "insideBottom", offset: -5, fill: BRAND.textDim, fontSize: 10 }} />
                  <YAxis domain={[0, 1]} tick={{ fill: BRAND.textDim, fontSize: 10 }}
                    label={{ value: "TPR", angle: -90, position: "insideLeft", fill: BRAND.textDim, fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: BRAND.surface, border: `1px solid ${BRAND.border}`, borderRadius: 8, color: BRAND.text, fontSize: 11 }} />
                  {data.rocData.map((roc, i) => (
                    <Line key={i} data={roc.points} dataKey="tpr" stroke={[BRAND.economic, BRAND.expression, BRAND.crisis, BRAND.accent][i]}
                      strokeWidth={2} dot={false} name={`${roc.axis} (AUC=${roc.auc})`} />
                  ))}
                  <ReferenceLine stroke={BRAND.textDim} strokeDasharray="5 5" segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]} />
                  <Legend wrapperStyle={{ fontSize: 10, color: BRAND.textDim }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlowCard>
          <div className="grid grid-cols-4 gap-2">
            {data.rocData.map((roc, i) => (
              <div key={i} className="p-3 rounded-lg text-center" style={{ background: BRAND.surfaceLight, border: `1px solid ${BRAND.border}` }}>
                <div className="text-xs font-bold" style={{ color: [BRAND.economic, BRAND.expression, BRAND.crisis, BRAND.accent][i] }}>{roc.axis}</div>
                <div className="text-lg font-bold" style={{ color: BRAND.text }}>AUC {roc.auc}</div>
                <div style={{ fontSize: 9, color: BRAND.textDim }}>Threshold* = {roc.threshold}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Neural CDE */}
      {algoTab === 3 && (
        <div className="space-y-4">
          <GlowCard color={BRAND.accent} active>
            <div className="p-5">
              <h3 className="text-sm font-bold mb-1" style={{ color: BRAND.accent }}>
                NEURAL CDE — 시계열 동적 진화 예측
              </h3>
              <p className="text-xs mb-3" style={{ color: BRAND.textDim }}>
                z₀(초기조건) + 행동 시퀀스(경로) → 미래 성향 벡터 예측 | Concept Drift 자동 감지
              </p>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={data.trajectory}>
                  <CartesianGrid strokeDasharray="3 3" stroke={BRAND.border} />
                  <XAxis dataKey="day" tick={{ fill: BRAND.textDim, fontSize: 10 }} />
                  <YAxis domain={[0, 1]} tick={{ fill: BRAND.textDim, fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: BRAND.surface, border: `1px solid ${BRAND.border}`, borderRadius: 8, color: BRAND.text, fontSize: 11 }} />
                  <Area dataKey="dayMaster" stroke={BRAND.accent} fill={BRAND.accent} fillOpacity={0.1} strokeWidth={2} name="일간" />
                  <Area dataKey="strength" stroke={BRAND.crisis} fill={BRAND.crisis} fillOpacity={0.1} strokeWidth={2} name="신강/약" />
                  <Area dataKey="wealth" stroke={BRAND.economic} fill={BRAND.economic} fillOpacity={0.1} strokeWidth={2} name="재성" />
                  <Area dataKey="expression" stroke={BRAND.expression} fill={BRAND.expression} fillOpacity={0.1} strokeWidth={2} name="식상" />
                  <ReferenceLine x={90} stroke="#EF4444" strokeDasharray="5 5" label={{ value: "🔴 위기", fill: "#EF4444", fontSize: 10 }} />
                  <Legend wrapperStyle={{ fontSize: 10, color: BRAND.textDim }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlowCard>
          <div className="p-4 rounded-lg" style={{ background: `${BRAND.accent}10`, border: `1px solid ${BRAND.accent}30` }}>
            <div className="text-xs" style={{ color: BRAND.accent }}>
              <strong>97.3% 탄력적 복원력</strong> — Day 80~100 위기 구간에서 벡터가 급락하지만, Neural CDE가 Architect의 복원 패턴을 학습하여 Day 120까지 완전 회복을 예측합니다.
              이것이 "죽은 프로필(Dead Profile)"이 아닌 "살아있는 프로필(Living Profile)"의 핵심 차별점입니다.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB 3: LIVING PROFILE EVOLUTION — 동적 진화 타임라인
// ═══════════════════════════════════════════════════════════════
function LivingProfile({ data }) {
  const nScoreData = data.trajectory.filter((_, i) => i % 3 === 0);

  return (
    <div className="space-y-5">
      {/* N-Score Evolution */}
      <GlowCard color={BRAND.economic} active>
        <div className="p-5">
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-sm font-bold" style={{ color: BRAND.economic }}>
              N-SCORE EVOLUTION — 살아있는 프로필 성장 곡선
            </h3>
            <div className="flex items-center gap-2">
              <PulseDot color={BRAND.crisis} />
              <span className="text-xs" style={{ color: BRAND.crisis }}>LIVE</span>
            </div>
          </div>
          <p className="text-xs mb-3" style={{ color: BRAND.textDim }}>
            N9(200) → N1(950) | 선천 기질 시드 + 행동 학습으로 자율 성장
          </p>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={nScoreData}>
              <defs>
                <linearGradient id="nscoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={BRAND.economic} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={BRAND.economic} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={BRAND.border} />
              <XAxis dataKey="day" tick={{ fill: BRAND.textDim, fontSize: 10 }} />
              <YAxis domain={[200, 950]} tick={{ fill: BRAND.textDim, fontSize: 10 }} />
              <Tooltip contentStyle={{ background: BRAND.surface, border: `1px solid ${BRAND.border}`, borderRadius: 8, color: BRAND.text, fontSize: 11 }} />
              <Area dataKey="nScore" stroke={BRAND.economic} fill="url(#nscoreGrad)" strokeWidth={2.5} name="N-Score" />
              <ReferenceLine x={90} stroke="#EF4444" strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlowCard>

      {/* Life Event Timeline */}
      <GlowCard color={BRAND.expression} active>
        <div className="p-5">
          <h3 className="text-sm font-bold mb-4" style={{ color: BRAND.expression }}>
            LIFE GRAPH — 진화 타임라인 (Patent Claim 6)
          </h3>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5" style={{ background: `linear-gradient(to bottom, ${BRAND.economic}, ${BRAND.crisis}, ${BRAND.accent})` }} />
            {data.lifeEvents.map((evt, i) => {
              const colors = {
                genesis: BRAND.economic, kipa: BRAND.expression, behavior: BRAND.crisis,
                shift: BRAND.warning, crisis: "#EF4444", recovery: BRAND.crisis,
                reclassify: BRAND.accent, golden: BRAND.warning, stable: BRAND.crisis,
              };
              return (
                <div key={i} className="relative flex items-start gap-4 mb-4 ml-1">
                  <div className="relative z-10 flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: colors[evt.type], color: "#fff", boxShadow: `0 0 10px ${colors[evt.type]}50` }}>
                    {evt.day}
                  </div>
                  <div className="flex-1 p-3 rounded-lg" style={{ background: BRAND.surfaceLight, border: `1px solid ${BRAND.border}` }}>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold" style={{ color: BRAND.text }}>{evt.event}</span>
                      <span className="text-xs px-2 py-0.5 rounded font-bold" style={{
                        background: `${colors[evt.type]}20`,
                        color: colors[evt.type],
                      }}>{evt.nGrade}</span>
                    </div>
                    <div style={{ fontSize: 9, color: BRAND.textDim }}>Day {evt.day}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </GlowCard>

      {/* Phase Weight Evolution */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { phase: "Phase 1", period: "현재", innate: 40, kipa: 35, behavior: 0, dynamic: 25, color: BRAND.economic },
          { phase: "Phase 2", period: "유저500+", innate: 25, kipa: 20, behavior: 40, dynamic: 15, color: BRAND.expression },
          { phase: "Phase 3", period: "유저10K+", innate: 15, kipa: 10, behavior: 60, dynamic: 15, color: BRAND.accent },
        ].map((p, i) => (
          <div key={i} className="p-3 rounded-lg" style={{ background: BRAND.surfaceLight, border: `1px solid ${p.color}40` }}>
            <div className="text-xs font-bold mb-2" style={{ color: p.color }}>{p.phase} — {p.period}</div>
            {[
              { label: "선천", val: p.innate, col: BRAND.accent },
              { label: "KIPA", val: p.kipa, col: BRAND.expression },
              { label: "행동", val: p.behavior, col: BRAND.crisis },
              { label: "동적", val: p.dynamic, col: BRAND.warning },
            ].map((w, j) => (
              <div key={j} className="flex items-center gap-2 mb-1">
                <span style={{ fontSize: 9, color: BRAND.textDim, width: 28 }}>{w.label}</span>
                <div className="flex-1 h-2 rounded-full" style={{ background: BRAND.bg }}>
                  <div className="h-full rounded-full" style={{ width: `${w.val}%`, background: w.col, transition: "width 1s" }} />
                </div>
                <span style={{ fontSize: 9, color: BRAND.text, width: 24, textAlign: "right" }}>{w.val}%</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB 4: COMPATIBILITY ENGINE — 궁합 분석
// ═══════════════════════════════════════════════════════════════
function CompatEngine({ data }) {
  return (
    <div className="space-y-5">
      <GlowCard color={BRAND.accent} active>
        <div className="p-5">
          <h3 className="text-sm font-bold mb-1" style={{ color: BRAND.accent }}>
            2-TIER COMPATIBILITY — 오행 궁합 엔진 (보조특허 ②)
          </h3>
          <p className="text-xs mb-4" style={{ color: BRAND.textDim }}>
            Tier 1: 띠궁합 (바이럴) → Tier 2: 5-Energy 심층 궁합 (전환)
          </p>
          <div className="space-y-3">
            {data.compatData.map((c, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: BRAND.surfaceLight, border: `1px solid ${BRAND.border}` }}>
                <div className="text-lg font-bold" style={{ width: 80, color: BRAND.text }}>{c.pair}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs" style={{ color: c.type === "상생" ? BRAND.crisis : "#EF4444" }}>{c.desc}</span>
                    <span className="text-xs font-bold" style={{ color: BRAND.text }}>{c.score}%</span>
                  </div>
                  <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: BRAND.bg }}>
                    <div className="h-full rounded-full transition-all duration-1000" style={{
                      width: `${c.score}%`,
                      background: c.type === "상생"
                        ? `linear-gradient(90deg, ${BRAND.crisis}, ${BRAND.economic})`
                        : `linear-gradient(90deg, #EF4444, ${BRAND.warning})`,
                    }} />
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded" style={{
                  background: c.type === "상생" ? `${BRAND.crisis}20` : "#EF444420",
                  color: c.type === "상생" ? BRAND.crisis : "#EF4444",
                }}>{c.type}</span>
              </div>
            ))}
          </div>
        </div>
      </GlowCard>

      {/* Compatibility Matrix */}
      <GlowCard color={BRAND.expression} active>
        <div className="p-5">
          <h3 className="text-sm font-bold mb-3" style={{ color: BRAND.expression }}>
            5×5 상생·상극 매트릭스
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ color: BRAND.text }}>
              <thead>
                <tr>
                  <th className="p-2" style={{ color: BRAND.textDim }}>→</th>
                  {Object.keys(ELEMENTS).map(e => (
                    <th key={e} className="p-2 text-center" style={{ color: ELEMENTS[e].color }}>{e}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.keys(ELEMENTS).map((row, ri) => (
                  <tr key={row}>
                    <td className="p-2 font-bold" style={{ color: ELEMENTS[row].color }}>{row}</td>
                    {Object.keys(ELEMENTS).map((col, ci) => {
                      const genOrder = ["木", "火", "土", "金", "水"];
                      const ri2 = genOrder.indexOf(row);
                      const ci2 = genOrder.indexOf(col);
                      const isGen = (ri2 + 1) % 5 === ci2; // 상생
                      const isOver = (ri2 + 2) % 5 === ci2; // 상극
                      const isSame = ri2 === ci2;
                      return (
                        <td key={col} className="p-2 text-center rounded" style={{
                          background: isSame ? `${ELEMENTS[row].color}15` : isGen ? `${BRAND.crisis}10` : isOver ? "#EF444410" : "transparent",
                          color: isSame ? ELEMENTS[row].color : isGen ? BRAND.crisis : isOver ? "#EF4444" : BRAND.textDim,
                        }}>
                          {isSame ? "⬤" : isGen ? "生 +" : isOver ? "克 −" : "·"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </GlowCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB 5: LIFE OS — 통합 대시보드
// ═══════════════════════════════════════════════════════════════
function LifeOS({ data }) {
  const latestScore = data.trajectory[data.trajectory.length - 1];
  const archetype = ARCHETYPES[6]; // Venture Admiral

  return (
    <div className="space-y-5">
      {/* Hero Card */}
      <div className="relative overflow-hidden rounded-xl p-6" style={{
        background: `linear-gradient(135deg, ${BRAND.bg}, ${BRAND.surface}, ${BRAND.economic}15)`,
        border: `1px solid ${BRAND.economic}40`,
        boxShadow: `0 0 40px ${BRAND.economic}15`,
      }}>
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10" style={{ background: BRAND.economic, filter: "blur(60px)" }} />
        <div className="relative flex justify-between items-start">
          <div>
            <div className="text-xs mb-1" style={{ color: BRAND.textDim }}>LIVING PROFILE · AI LIFE OS</div>
            <div className="text-2xl font-black mb-1" style={{ color: BRAND.text }}>
              {archetype.icon} {archetype.kr}
            </div>
            <div className="text-sm mb-3" style={{ color: BRAND.economic }}>{archetype.name}</div>
            <div className="flex gap-4">
              {[
                { icon: "💰", label: "경제감각", val: 82, color: BRAND.economic },
                { icon: "⚡", label: "표현에너지", val: 75, color: BRAND.expression },
                { icon: "🛡️", label: "위기대응력", val: 91, color: BRAND.crisis },
              ].map((m, i) => (
                <div key={i} className="text-center">
                  <div className="text-lg">{m.icon}</div>
                  <div className="text-xs font-bold" style={{ color: m.color }}><AnimNum value={m.val} suffix="%" /></div>
                  <div style={{ fontSize: 9, color: BRAND.textDim }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs mb-1" style={{ color: BRAND.textDim }}>N-SCORE</div>
            <div className="text-4xl font-black" style={{
              background: `linear-gradient(135deg, ${BRAND.economic}, ${BRAND.crisis})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}><AnimNum value={latestScore.nScore} /></div>
            <div className="text-xs font-bold px-3 py-1 rounded-full mt-1" style={{
              background: `${BRAND.crisis}20`, color: BRAND.crisis
            }}>N1 GRADE</div>
          </div>
        </div>
      </div>

      {/* 5-Stage Life OS Roadmap */}
      <GlowCard color={BRAND.crisis} active>
        <div className="p-5">
          <h3 className="text-sm font-bold mb-4" style={{ color: BRAND.crisis }}>
            AI LIFE OS — 5단계 확장 로드맵
          </h3>
          <div className="flex gap-2">
            {[
              { stage: 1, name: "금융 DNA", period: "2026", active: true, icon: "💎" },
              { stage: 2, name: "소비 코칭", period: "2026.H2", active: false, icon: "🛒" },
              { stage: 3, name: "건강·웰니스", period: "2027.H1", active: false, icon: "❤️" },
              { stage: 4, name: "관계·커뮤니티", period: "2027.H2", active: false, icon: "🤝" },
              { stage: 5, name: "AI Life OS", period: "2028~", active: false, icon: "🌐" },
            ].map((s, i) => (
              <div key={i} className="flex-1 p-3 rounded-lg text-center relative" style={{
                background: s.active ? `${BRAND.crisis}15` : BRAND.surfaceLight,
                border: `1px solid ${s.active ? BRAND.crisis : BRAND.border}`,
              }}>
                {s.active && <div className="absolute -top-1 -right-1"><PulseDot color={BRAND.crisis} size={6} /></div>}
                <div className="text-xl mb-1">{s.icon}</div>
                <div className="text-xs font-bold" style={{ color: s.active ? BRAND.crisis : BRAND.text }}>{s.name}</div>
                <div style={{ fontSize: 9, color: BRAND.textDim }}>{s.period}</div>
              </div>
            ))}
          </div>
        </div>
      </GlowCard>

      {/* Technology Stack */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-lg" style={{ background: BRAND.surfaceLight, border: `1px solid ${BRAND.border}` }}>
          <h4 className="text-xs font-bold mb-3" style={{ color: BRAND.economic }}>◆ 4대 핵심 알고리즘</h4>
          {[
            { algo: "베이지안 추론", status: "Phase 2", desc: "Prior→Posterior 갱신" },
            { algo: "비지도 군집화", status: "Phase 1 ✅", desc: "16형 아키타입 분류" },
            { algo: "ROC 임계값 보정", status: "Phase 2", desc: "민감도-특이도 균형" },
            { algo: "Neural CDE", status: "Phase 3", desc: "시계열 동적 예측" },
          ].map((a, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b" style={{ borderColor: BRAND.border }}>
              <span className="text-xs" style={{ color: BRAND.text }}>{a.algo}</span>
              <span className="text-xs px-2 py-0.5 rounded" style={{
                background: a.status.includes("✅") ? `${BRAND.crisis}20` : `${BRAND.warning}20`,
                color: a.status.includes("✅") ? BRAND.crisis : BRAND.warning,
                fontSize: 9,
              }}>{a.status}</span>
            </div>
          ))}
        </div>
        <div className="p-4 rounded-lg" style={{ background: BRAND.surfaceLight, border: `1px solid ${BRAND.border}` }}>
          <h4 className="text-xs font-bold mb-3" style={{ color: BRAND.accent }}>◆ 특허 방어 체계</h4>
          {[
            { patent: "P25KAI001KR", name: "동적 진화 페르소나 엔진", status: "심사청구 ✅" },
            { patent: "특허 ②", name: "소셜 관계 매칭", status: "출원 완료" },
            { patent: "특허 ③", name: "웰니스 추천", status: "출원 완료" },
            { patent: "특허 ④", name: "행운 숫자 추천", status: "출원 완료" },
          ].map((p, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b" style={{ borderColor: BRAND.border }}>
              <span className="text-xs" style={{ color: BRAND.text }}>{p.name}</span>
              <span style={{ fontSize: 9, color: i === 0 ? BRAND.crisis : BRAND.textDim }}>{p.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Vision Statement */}
      <div className="p-4 rounded-xl text-center" style={{
        background: `linear-gradient(135deg, ${BRAND.economic}08, ${BRAND.crisis}08, ${BRAND.accent}08)`,
        border: `1px solid ${BRAND.border}`,
      }}>
        <div className="text-xs font-bold mb-2" style={{ color: BRAND.economic }}>VISION</div>
        <div className="text-sm" style={{ color: BRAND.text, lineHeight: 1.6 }}>
          "금융 DNA에서 시작해, 소비·건강·관계를 아우르는 <span style={{ color: BRAND.crisis, fontWeight: 700 }}>AI 라이프OS</span>로 진화 —
          당신의 선천적 기질을 <span style={{ color: BRAND.economic, fontWeight: 700 }}>과학</span>으로 읽고, AI가 매일의 선택을 코칭합니다"
        </div>
        <div className="text-xs mt-2" style={{ color: BRAND.textDim }}>
          특허로 보호된 선천×후천 융합 알고리즘 · 행동 학습 Living Profile · 금융업 20년 도메인 전문성 = 삼중 해자
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════
export default function NKAILifeOS() {
  const [activeTab, setActiveTab] = useState(0);
  const [time, setTime] = useState(0);
  const data = useMemo(() => generateLifeOSData(42), []);

  useEffect(() => {
    const t = setInterval(() => setTime(prev => prev + 1), 3000);
    return () => clearInterval(t);
  }, []);

  const tabs = [
    { name: "DNA Genesis", icon: "🧬", color: BRAND.economic },
    { name: "4 Algorithms", icon: "⚙️", color: BRAND.expression },
    { name: "Living Profile", icon: "📈", color: BRAND.crisis },
    { name: "Compatibility", icon: "💫", color: BRAND.accent },
    { name: "Life OS", icon: "🌐", color: BRAND.warning },
  ];

  return (
    <div className="min-h-screen" style={{ background: BRAND.bg, color: BRAND.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Outfit:wght@300;400;600;700;900&display=swap');
        * { font-family: 'Outfit', sans-serif; }
        code, .mono { font-family: 'JetBrains Mono', monospace; }
        @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: ${BRAND.bg}; }
        ::-webkit-scrollbar-thumb { background: ${BRAND.border}; border-radius: 4px; }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-50 px-4 py-3" style={{
        background: `${BRAND.bg}E8`,
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${BRAND.border}`,
      }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black"
              style={{ background: `linear-gradient(135deg, ${BRAND.economic}, ${BRAND.crisis})`, color: "#fff" }}>
              N
            </div>
            <div>
              <div className="text-sm font-bold" style={{ color: BRAND.text }}>N-KAI LIVING PROFILE</div>
              <div className="text-xs" style={{ color: BRAND.textDim }}>Autonomous Life OS · Patent P25KAI001KR</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PulseDot color={BRAND.crisis} />
            <span className="text-xs mono" style={{ color: BRAND.crisis }}>SELF-EVOLVING</span>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="px-4 py-2" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
        <div className="max-w-6xl mx-auto flex gap-1 overflow-x-auto">
          {tabs.map((tab, i) => (
            <button key={i} onClick={() => setActiveTab(i)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all"
              style={{
                background: activeTab === i ? `${tab.color}15` : "transparent",
                color: activeTab === i ? tab.color : BRAND.textDim,
                border: `1px solid ${activeTab === i ? tab.color + "40" : "transparent"}`,
              }}>
              <span>{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-5">
        {activeTab === 0 && <DNAGenesis data={data} />}
        {activeTab === 1 && <AlgorithmEngine data={data} />}
        {activeTab === 2 && <LivingProfile data={data} />}
        {activeTab === 3 && <CompatEngine data={data} />}
        {activeTab === 4 && <LifeOS data={data} />}
      </main>

      {/* Footer */}
      <footer className="px-4 py-4 mt-8" style={{ borderTop: `1px solid ${BRAND.border}` }}>
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="text-xs" style={{ color: BRAND.textDim }}>
            © 2026 Neurin Kairos AI Inc. · All Rights Reserved
          </div>
          <div className="text-xs" style={{ color: BRAND.textDim }}>
            5 Algorithms · 4 Patents · 16 Archetypes · ∞ Evolution
          </div>
        </div>
      </footer>
    </div>
  );
}
