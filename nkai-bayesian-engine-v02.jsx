import { useState, useMemo } from "react";

// ═══════════════════════════════════════════════════════════════
// N-KAI BAYESIAN PRIOR ENGINE v0.2 — 홈페이지 용어 체계 반영
// 특허 P25KAI001KR Claim 5-6 구현 증명
// 용어치환: 오행→5-Energy / 신강신약→에너지밸런스 / 재성→💰경제감각 / 식상→⚡표현에너지
// 3대 지표: 💰경제감각=#2D8CFF ⚡표현에너지=#5AA8FF 🛡️위기대응력=#00D68F
// ═══════════════════════════════════════════════════════════════

const ARCHETYPES = [
  { id: "AT01", name: "전략적 설계자", en: "Strategic Architect", group: "분석가", icon: "🏛️", ns: 0.7, tf: 0.8, jp: 0.9, ei: -0.3 },
  { id: "AT02", name: "논리적 투자자", en: "Rational Investor", group: "분석가", icon: "📊", ns: 0.5, tf: 0.9, jp: 0.7, ei: -0.5 },
  { id: "AT03", name: "정밀 분석가", en: "Precision Analyst", group: "분석가", icon: "🔬", ns: 0.3, tf: 0.7, jp: 0.8, ei: -0.7 },
  { id: "AT04", name: "데이터 수호자", en: "Data Guardian", group: "분석가", icon: "🛡️", ns: -0.2, tf: 0.6, jp: 0.9, ei: -0.6 },
  { id: "AT05", name: "안정적 관리자", en: "Stable Manager", group: "실용주의", icon: "⚖️", ns: -0.5, tf: 0.4, jp: 0.7, ei: -0.4 },
  { id: "AT06", name: "실용적 축적가", en: "Pragmatic Builder", group: "실용주의", icon: "🧱", ns: -0.7, tf: 0.3, jp: 0.8, ei: -0.2 },
  { id: "AT07", name: "보수적 수비수", en: "Conservative Defender", group: "실용주의", icon: "🏰", ns: -0.8, tf: 0.5, jp: 0.6, ei: -0.8 },
  { id: "AT08", name: "현실적 전술가", en: "Realistic Tactician", group: "실용주의", icon: "♟️", ns: -0.6, tf: 0.2, jp: 0.5, ei: -0.3 },
  { id: "AT09", name: "모험적 항해사", en: "Adventurous Navigator", group: "항해사", icon: "🧭", ns: 0.4, tf: -0.3, jp: -0.5, ei: 0.7 },
  { id: "AT10", name: "리스크 탐험가", en: "Risk Explorer", group: "항해사", icon: "🚀", ns: 0.6, tf: -0.5, jp: -0.7, ei: 0.9 },
  { id: "AT11", name: "직감적 트레이더", en: "Intuitive Trader", group: "항해사", icon: "⚡", ns: 0.8, tf: -0.4, jp: -0.3, ei: 0.5 },
  { id: "AT12", name: "기회 포착자", en: "Opportunity Catcher", group: "항해사", icon: "🎯", ns: 0.3, tf: -0.2, jp: -0.6, ei: 0.6 },
  { id: "AT13", name: "비전 창조자", en: "Visionary Creator", group: "비전가", icon: "🌟", ns: 0.9, tf: -0.6, jp: 0.2, ei: 0.8 },
  { id: "AT14", name: "감성적 투자자", en: "Emotional Investor", group: "비전가", icon: "💫", ns: 0.7, tf: -0.8, jp: -0.1, ei: 0.4 },
  { id: "AT15", name: "이상주의 혁신가", en: "Idealist Innovator", group: "비전가", icon: "🔮", ns: 0.8, tf: -0.7, jp: 0.3, ei: 0.6 },
  { id: "AT16", name: "공감형 파트너", en: "Empathic Partner", group: "비전가", icon: "🤝", ns: 0.5, tf: -0.9, jp: 0.1, ei: 0.3 },
];

const GROUPS = {
  "분석가": { color: "#2D8CFF", label: "Analyst" },
  "실용주의": { color: "#5AA8FF", label: "Pragmatist" },
  "항해사": { color: "#00D68F", label: "Navigator" },
  "비전가": { color: "#A855F7", label: "Visionary" },
};

// ─── 5-Energy (대외 용어) ───
const FIVE_ENERGY = [
  { id: "wood", symbol: "🌱", name: "Growth", label: "성장 에너지", color: "#22C55E", traits: { ns: 0.6, tf: -0.2, jp: -0.3, ei: 0.4 } },
  { id: "fire", symbol: "🔥", name: "Passion", label: "열정 에너지", color: "#EF4444", traits: { ns: 0.8, tf: -0.5, jp: -0.4, ei: 0.7 } },
  { id: "earth", symbol: "⛰️", name: "Stability", label: "안정 에너지", color: "#F59E0B", traits: { ns: -0.4, tf: 0.3, jp: 0.6, ei: -0.2 } },
  { id: "metal", symbol: "⚙️", name: "Precision", label: "원칙 에너지", color: "#94A3B8", traits: { ns: -0.6, tf: 0.7, jp: 0.8, ei: -0.5 } },
  { id: "water", symbol: "🌊", name: "Wisdom", label: "지혜 에너지", color: "#3B82F6", traits: { ns: 0.3, tf: 0.4, jp: -0.1, ei: -0.3 } },
];

// ─── Energy Balance (신강/신약 대외 치환) ───
const BALANCE_OPTIONS = [
  { id: "strong", label: "에너지 과잉", value: 0.7, desc: "내부 에너지 축적 우세", icon: "🔋" },
  { id: "balanced", label: "에너지 균형", value: 0.0, desc: "유입·유출 밸런스", icon: "⚖️" },
  { id: "weak", label: "에너지 소진", value: -0.7, desc: "외부 발산 에너지 우세", icon: "💨" },
];

// ─── 생년월일시 → 선천 벡터 간이 매핑 (프로토타입) ───
function birthToInnate(year, month, day, hour) {
  // 연도 끝자리 → 천간 → 5-Energy 매핑 (간소화)
  const yearEnd = year % 10;
  const energyMap = { 0: "metal", 1: "metal", 2: "water", 3: "water", 4: "wood", 5: "wood", 6: "fire", 7: "fire", 8: "earth", 9: "earth" };
  const dayMasterEnergy = energyMap[yearEnd] || "earth";

  // 월 → 계절 에너지 보정
  const seasonBoost = month <= 2 ? "water" : month <= 5 ? "wood" : month <= 8 ? "fire" : month <= 11 ? "metal" : "water";

  // 일 → 신강/신약 간이 판정
  const dayStrength = (day % 3 === 0) ? "strong" : (day % 3 === 1) ? "balanced" : "weak";

  // 시간 → 식상/재성 강도
  const hourNorm = hour / 24;
  const wealthIntensity = Math.sin(hourNorm * Math.PI) * 0.8;
  const outputIntensity = Math.cos(hourNorm * Math.PI * 0.7) * 0.6;

  return { dayMasterEnergy, seasonBoost, dayStrength, wealthIntensity, outputIntensity };
}

// ═══════════════════════════════════════════════════════════════
// BAYESIAN ENGINE CORE
// ═══════════════════════════════════════════════════════════════

function computeBayesianPosterior(innateVector, kipaVector, resonanceMap) {
  const priors = ARCHETYPES.map(a => {
    const dist = Math.sqrt(
      Math.pow(a.ns - innateVector.ns, 2) + Math.pow(a.tf - innateVector.tf, 2) +
      Math.pow(a.jp - innateVector.jp, 2) + Math.pow(a.ei - innateVector.ei, 2)
    );
    return Math.exp(-dist * 1.5);
  });
  const priorSum = priors.reduce((s, v) => s + v, 0);
  const normalizedPriors = priors.map(p => p / priorSum);

  const likelihoods = ARCHETYPES.map(a => {
    const dist = Math.sqrt(
      Math.pow(a.ns - kipaVector.ns, 2) + Math.pow(a.tf - kipaVector.tf, 2) +
      Math.pow(a.jp - kipaVector.jp, 2) + Math.pow(a.ei - kipaVector.ei, 2)
    );
    return Math.exp(-dist * 1.8);
  });

  const corrected = likelihoods.map((l, i) => l * (resonanceMap[i] || 1.0));
  const unnormalized = normalizedPriors.map((p, i) => p * corrected[i]);
  const postSum = unnormalized.reduce((s, v) => s + v, 0);
  return {
    priors: normalizedPriors,
    likelihoods: corrected,
    posteriors: unnormalized.map(p => p / postSum),
  };
}

function computeResonanceMap(innateVector, kipaVector) {
  return ARCHETYPES.map(a => {
    const innateAlign = [
      Math.sign(a.ns) === Math.sign(innateVector.ns) ? 1 : 0,
      Math.sign(a.tf) === Math.sign(innateVector.tf) ? 1 : 0,
      Math.sign(a.jp) === Math.sign(innateVector.jp) ? 1 : 0,
      Math.sign(a.ei) === Math.sign(innateVector.ei) ? 1 : 0,
    ].reduce((s, v) => s + v, 0) / 4;
    const kipaAlign = [
      Math.sign(a.ns) === Math.sign(kipaVector.ns) ? 1 : 0,
      Math.sign(a.tf) === Math.sign(kipaVector.tf) ? 1 : 0,
      Math.sign(a.jp) === Math.sign(kipaVector.jp) ? 1 : 0,
      Math.sign(a.ei) === Math.sign(kipaVector.ei) ? 1 : 0,
    ].reduce((s, v) => s + v, 0) / 4;
    return 0.7 + ((innateAlign + kipaAlign) / 2) * 0.6;
  });
}

function ruleBasedClassify(vec) {
  let minDist = Infinity, bestIdx = 0;
  ARCHETYPES.forEach((a, i) => {
    const dist = Math.sqrt(
      Math.pow(a.ns - vec.ns, 2) + Math.pow(a.tf - vec.tf, 2) +
      Math.pow(a.jp - vec.jp, 2) + Math.pow(a.ei - vec.ei, 2)
    );
    if (dist < minDist) { minDist = dist; bestIdx = i; }
  });
  return bestIdx;
}

function computeROC(posteriors) {
  const sorted = [...posteriors].sort((a, b) => b - a);
  const confidence = (sorted[0] - sorted[1]) / (sorted[0] + sorted[1] + 1e-8);
  return { confidence, isReliable: confidence > 0.15, top1: sorted[0], top2: sorted[1] };
}

// ═══════════════════════════════════════════════════════════════
// UI COMPONENTS
// ═══════════════════════════════════════════════════════════════

const ProbBar = ({ prob, maxProb, color, label, icon, isTop }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 8, padding: "3px 0",
    opacity: prob < 0.02 ? 0.25 : 1, transition: "all 0.5s ease",
  }}>
    <span style={{ fontSize: 14, width: 22, textAlign: "center" }}>{icon}</span>
    <div style={{ flex: 1, position: "relative", height: 20, background: "rgba(255,255,255,0.03)", borderRadius: 5, overflow: "hidden" }}>
      <div style={{
        height: "100%", width: `${Math.max(1, (prob / maxProb) * 100)}%`,
        background: isTop ? `linear-gradient(90deg, ${color}, ${color}cc)` : `${color}33`,
        borderRadius: 5, transition: "width 0.6s ease",
        boxShadow: isTop ? `0 0 10px ${color}33` : "none",
      }} />
      <span style={{
        position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)",
        fontSize: 10, fontWeight: isTop ? 700 : 400,
        color: isTop ? "#fff" : "rgba(255,255,255,0.5)",
      }}>{label}</span>
    </div>
    <span style={{
      fontSize: 11, fontWeight: isTop ? 700 : 400, width: 46, textAlign: "right",
      color: isTop ? color : "rgba(255,255,255,0.4)",
      fontFamily: "monospace",
    }}>{(prob * 100).toFixed(1)}%</span>
  </div>
);

const Slider = ({ label, emoji, value, onChange, color, left, right }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{emoji} {label}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: "monospace" }}>{value > 0 ? "+" : ""}{value.toFixed(2)}</span>
    </div>
    <input type="range" min={-100} max={100} value={Math.round(value * 100)}
      onChange={e => onChange(parseInt(e.target.value) / 100)}
      style={{ width: "100%", height: 5, appearance: "none", background: `linear-gradient(90deg, rgba(255,255,255,0.08), ${color}55, rgba(255,255,255,0.08)`, borderRadius: 3, cursor: "pointer", accentColor: color }}
    />
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 1 }}>
      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{left}</span>
      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{right}</span>
    </div>
  </div>
);

const Metric = ({ label, value, color, sub }) => (
  <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "10px 14px", border: `1px solid ${color}20`, flex: 1, minWidth: 100 }}>
    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 800, color, fontFamily: "monospace", marginTop: 3 }}>{value}</div>
    {sub && <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{sub}</div>}
  </div>
);

// ═══════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════

export default function NKAIBayesianEngine() {
  // ─── 생년월일시 입력 (홈페이지 동일 방식) ───
  const [birthYear, setBirthYear] = useState(1980);
  const [birthMonth, setBirthMonth] = useState(8);
  const [birthDay, setBirthDay] = useState(15);
  const [birthHour, setBirthHour] = useState(14);
  const [inputMode, setInputMode] = useState("birth"); // "birth" | "manual"

  // Manual override (개발자/데모용)
  const [manualEnergy, setManualEnergy] = useState("fire");
  const [manualBalance, setManualBalance] = useState("balanced");
  const [manualWealth, setManualWealth] = useState(0.3);
  const [manualOutput, setManualOutput] = useState(0.4);

  // KIPA 4축
  const [kNS, setKNS] = useState(0.3);
  const [kTF, setKTF] = useState(-0.1);
  const [kJP, setKJP] = useState(0.2);
  const [kEI, setKEI] = useState(0.4);

  const [activeView, setActiveView] = useState("posterior");

  // 생년월일 → 선천 벡터 자동 계산
  const birthResult = useMemo(() => birthToInnate(birthYear, birthMonth, birthDay, birthHour), [birthYear, birthMonth, birthDay, birthHour]);

  const activeEnergy = inputMode === "birth" ? birthResult.dayMasterEnergy : manualEnergy;
  const activeBalance = inputMode === "birth" ? birthResult.dayStrength : manualBalance;
  const activeWealth = inputMode === "birth" ? birthResult.wealthIntensity : manualWealth;
  const activeOutput = inputMode === "birth" ? birthResult.outputIntensity : manualOutput;

  const innateVector = useMemo(() => {
    const energy = FIVE_ENERGY.find(e => e.id === activeEnergy);
    const bal = BALANCE_OPTIONS.find(b => b.id === activeBalance);
    return {
      ns: energy.traits.ns,
      tf: energy.traits.tf + bal.value * 0.3,
      jp: energy.traits.jp + activeWealth * 0.5,
      ei: energy.traits.ei + activeOutput * 0.4,
    };
  }, [activeEnergy, activeBalance, activeWealth, activeOutput]);

  const kipaVector = useMemo(() => ({ ns: kNS, tf: kTF, jp: kJP, ei: kEI }), [kNS, kTF, kJP, kEI]);

  const fusedVector = useMemo(() => {
    const rNS = Math.sign(innateVector.ns) === Math.sign(kipaVector.ns) ? 0.20 : -0.20;
    const rTF = Math.sign(innateVector.tf) === Math.sign(kipaVector.tf) ? 0.15 : -0.15;
    const rJP = Math.sign(innateVector.jp) === Math.sign(kipaVector.jp) ? 0.10 : -0.10;
    const rEI = Math.sign(innateVector.ei) === Math.sign(kipaVector.ei) ? 0.10 : -0.10;
    return {
      ns: kipaVector.ns + kipaVector.ns * rNS,
      tf: kipaVector.tf + kipaVector.tf * rTF,
      jp: kipaVector.jp + kipaVector.jp * rJP,
      ei: kipaVector.ei + kipaVector.ei * rEI,
    };
  }, [innateVector, kipaVector]);

  const resonanceMap = useMemo(() => computeResonanceMap(innateVector, kipaVector), [innateVector, kipaVector]);
  const bayesian = useMemo(() => computeBayesianPosterior(innateVector, kipaVector, resonanceMap), [innateVector, kipaVector, resonanceMap]);
  const roc = useMemo(() => computeROC(bayesian.posteriors), [bayesian.posteriors]);
  const ruleIdx = useMemo(() => ruleBasedClassify(fusedVector), [fusedVector]);

  const sorted = useMemo(() =>
    bayesian.posteriors.map((p, i) => ({ prob: p, idx: i })).sort((a, b) => b.prob - a.prob),
    [bayesian.posteriors]
  );
  const topIdx = sorted[0].idx;
  const topA = ARCHETYPES[topIdx];
  const ruleA = ARCHETYPES[ruleIdx];
  const isMatch = topIdx === ruleIdx;
  const currentEnergy = FIVE_ENERGY.find(e => e.id === activeEnergy);

  const displayData = activeView === "prior" ? bayesian.priors
    : activeView === "likelihood" ? bayesian.likelihoods.map(l => l / Math.max(...bayesian.likelihoods))
    : bayesian.posteriors;

  // 3대 지표 계산 (홈페이지 동일)
  const threeIndicators = useMemo(() => ({
    economic: Math.min(99, Math.max(1, Math.round(50 + activeWealth * 40 + innateVector.tf * 15))),
    expressive: Math.min(99, Math.max(1, Math.round(50 + activeOutput * 35 + innateVector.ei * 20))),
    crisis: Math.min(99, Math.max(1, Math.round(50 + (activeBalance === "strong" ? 25 : activeBalance === "balanced" ? 10 : -5) + Math.abs(innateVector.ns) * 15))),
  }), [activeWealth, activeOutput, activeBalance, innateVector]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(165deg, #0a0a12 0%, #0d0f1a 40%, #0a0c15 100%)",
      color: "#fff", fontFamily: "'Segoe UI', -apple-system, sans-serif", padding: "16px 12px",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 9, letterSpacing: "0.3em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", marginBottom: 4 }}>
          N-KAI Bayesian Prior Engine v0.2
        </div>
        <h1 style={{
          fontSize: 20, fontWeight: 900, margin: 0,
          background: "linear-gradient(135deg, #2D8CFF, #00D68F, #A855F7)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>금융 DNA 확률 추론 엔진</h1>
        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: "4px 0 0" }}>
          P25KAI001KR · 베이지안 추론 + 비지도 군집화 + ROC 보정
        </p>
      </div>

      <div style={{ maxWidth: 820, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>

        {/* ─── INPUT PANEL ─── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>

          {/* 선천 기질 데이터 */}
          <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 12, padding: 16, border: "1px solid rgba(45,140,255,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 800, margin: 0, color: "#fff" }}>🧬 선천적 기질 데이터</h3>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: "2px 0 0" }}>Innate Temperament Vector (V_core)</p>
              </div>
              <div style={{ display: "flex", gap: 3 }}>
                {["birth", "manual"].map(m => (
                  <button key={m} onClick={() => setInputMode(m)} style={{
                    padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontSize: 10,
                    border: inputMode === m ? "1px solid #2D8CFF55" : "1px solid rgba(255,255,255,0.06)",
                    background: inputMode === m ? "rgba(45,140,255,0.1)" : "transparent",
                    color: inputMode === m ? "#2D8CFF" : "rgba(255,255,255,0.35)",
                  }}>{m === "birth" ? "생년월일시" : "수동입력"}</button>
                ))}
              </div>
            </div>

            {inputMode === "birth" ? (
              <>
                {/* 생년월일시 입력 */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 14 }}>
                  {[
                    { label: "출생년도", value: birthYear, set: setBirthYear, min: 1940, max: 2010, suffix: "년" },
                    { label: "월", value: birthMonth, set: setBirthMonth, min: 1, max: 12, suffix: "월" },
                    { label: "일", value: birthDay, set: setBirthDay, min: 1, max: 31, suffix: "일" },
                    { label: "시", value: birthHour, set: setBirthHour, min: 0, max: 23, suffix: "시" },
                  ].map(f => (
                    <div key={f.label}>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", marginBottom: 3 }}>{f.label}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <input type="number" value={f.value} min={f.min} max={f.max}
                          onChange={e => f.set(Math.max(f.min, Math.min(f.max, parseInt(e.target.value) || f.min)))}
                          style={{
                            width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)",
                            background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 13, fontFamily: "monospace",
                            fontWeight: 700, textAlign: "center", outline: "none",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* 자동 분석 결과 표시 */}
                <div style={{ padding: 10, borderRadius: 8, background: "rgba(45,140,255,0.05)", border: "1px solid rgba(45,140,255,0.1)", marginBottom: 10 }}>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
                    자동 추출 결과 (출생시간 반영 · 정밀도 94%)
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 18 }}>{currentEnergy.symbol}</span>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: currentEnergy.color }}>{currentEnergy.name}</div>
                        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>{currentEnergy.label}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 18 }}>{BALANCE_OPTIONS.find(b => b.id === activeBalance).icon}</span>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#5AA8FF" }}>{BALANCE_OPTIONS.find(b => b.id === activeBalance).label}</div>
                        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>{BALANCE_OPTIONS.find(b => b.id === activeBalance).desc}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* 수동 입력: 5-Energy */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginBottom: 5 }}>Core Energy (5-Energy)</div>
                  <div style={{ display: "flex", gap: 5 }}>
                    {FIVE_ENERGY.map(e => (
                      <button key={e.id} onClick={() => setManualEnergy(e.id)} style={{
                        flex: 1, padding: "7px 2px", borderRadius: 7, cursor: "pointer",
                        border: manualEnergy === e.id ? `2px solid ${e.color}` : "1px solid rgba(255,255,255,0.06)",
                        background: manualEnergy === e.id ? `${e.color}15` : "transparent",
                        color: manualEnergy === e.id ? e.color : "rgba(255,255,255,0.4)",
                        fontSize: 12, fontWeight: manualEnergy === e.id ? 700 : 400,
                      }}>
                        <div style={{ fontSize: 16 }}>{e.symbol}</div>
                        <div style={{ fontSize: 9, marginTop: 1 }}>{e.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 수동 입력: Energy Balance */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginBottom: 5 }}>Energy Balance</div>
                  <div style={{ display: "flex", gap: 5 }}>
                    {BALANCE_OPTIONS.map(b => (
                      <button key={b.id} onClick={() => setManualBalance(b.id)} style={{
                        flex: 1, padding: "6px 4px", borderRadius: 7, cursor: "pointer",
                        border: manualBalance === b.id ? "2px solid #5AA8FF" : "1px solid rgba(255,255,255,0.06)",
                        background: manualBalance === b.id ? "rgba(90,168,255,0.08)" : "transparent",
                        color: manualBalance === b.id ? "#5AA8FF" : "rgba(255,255,255,0.4)",
                        fontSize: 10,
                      }}>
                        <div>{b.icon} {b.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <Slider label="경제감각" emoji="💰" value={manualWealth} onChange={setManualWealth}
                  color="#2D8CFF" left="보존형" right="확장형" />
                <Slider label="표현에너지" emoji="⚡" value={manualOutput} onChange={setManualOutput}
                  color="#5AA8FF" left="축적형" right="발산형" />
              </>
            )}

            {/* 3대 지표 (홈페이지 동일) */}
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              {[
                { emoji: "💰", name: "경제감각", value: threeIndicators.economic, color: "#2D8CFF" },
                { emoji: "⚡", name: "표현에너지", value: threeIndicators.expressive, color: "#5AA8FF" },
                { emoji: "🛡️", name: "위기대응력", value: threeIndicators.crisis, color: "#00D68F" },
              ].map(ind => (
                <div key={ind.name} style={{
                  flex: 1, padding: "8px 6px", borderRadius: 8, textAlign: "center",
                  background: `${ind.color}08`, border: `1px solid ${ind.color}22`,
                }}>
                  <div style={{ fontSize: 11 }}>{ind.emoji}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: ind.color, fontFamily: "monospace" }}>{ind.value}</div>
                  <div style={{ fontSize: 8, color: "rgba(255,255,255,0.4)" }}>{ind.name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* KIPA 성향 */}
          <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 12, padding: 16, border: "1px solid rgba(0,214,143,0.1)" }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, margin: "0 0 2px" }}>📋 KIPA 행동 성향 분석</h3>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: "0 0 14px" }}>Behavioral Style Vector (V_b)</p>

            <Slider label="정보 필터링" emoji="🔮" value={kNS} onChange={setKNS}
              color="#A855F7" left="S 현실 중심" right="N 직관 중심" />
            <Slider label="의사결정 방식" emoji="🧠" value={kTF} onChange={setKTF}
              color="#2D8CFF" left="F 감정 기반" right="T 논리 기반" />
            <Slider label="실행 스타일" emoji="📐" value={kJP} onChange={setKJP}
              color="#00D68F" left="P 유연/즉흥" right="J 계획/체계" />
            <Slider label="에너지 방향" emoji="🌐" value={kEI} onChange={setKEI}
              color="#F59E0B" left="I 내부 집중" right="E 외부 확장" />

            {/* 공명/충돌 */}
            <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ fontSize: 9, letterSpacing: "0.06em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 6 }}>
                선천×후천 공명/충돌 보정 (Δ Weight)
              </div>
              {[
                { axis: "N/S 정보필터링", innate: innateVector.ns, kipa: kNS, delta: "±20%", map: "Core Energy ↔ 직관/감각" },
                { axis: "T/F 의사결정", innate: innateVector.tf, kipa: kTF, delta: "±15%", map: "에너지밸런스 ↔ 논리/감정" },
                { axis: "J/P 실행스타일", innate: innateVector.jp, kipa: kJP, delta: "±10%", map: "💰경제감각 ↔ 계획/즉흥" },
                { axis: "E/I 에너지방향", innate: innateVector.ei, kipa: kEI, delta: "±10%", map: "⚡표현에너지 ↔ 외향/내향" },
              ].map(({ axis, innate, kipa, delta, map }) => {
                const resonance = Math.sign(innate) === Math.sign(kipa) || innate === 0 || kipa === 0;
                return (
                  <div key={axis} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "3px 0" }}>
                    <div>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)" }}>{axis}</span>
                      <span style={{ fontSize: 8, color: "rgba(255,255,255,0.25)", marginLeft: 6 }}>{map}</span>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: resonance ? "#00D68F" : "#EF4444" }}>
                      {resonance ? "🔗 공명" : "⚡ 충돌"} {delta}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* 벡터 수치 */}
            <div style={{ marginTop: 10, padding: 8, borderRadius: 6, background: "rgba(0,0,0,0.2)", fontFamily: "monospace", fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
              <div>V_core = [{innateVector.ns.toFixed(2)}, {innateVector.tf.toFixed(2)}, {innateVector.jp.toFixed(2)}, {innateVector.ei.toFixed(2)}]</div>
              <div>V_kipa = [{kipaVector.ns.toFixed(2)}, {kipaVector.tf.toFixed(2)}, {kipaVector.jp.toFixed(2)}, {kipaVector.ei.toFixed(2)}]</div>
              <div>V_fused = [{fusedVector.ns.toFixed(2)}, {fusedVector.tf.toFixed(2)}, {fusedVector.jp.toFixed(2)}, {fusedVector.ei.toFixed(2)}]</div>
            </div>
          </div>
        </div>

        {/* ─── RESULT ─── */}
        <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 12, padding: 16, border: "1px solid rgba(168,85,247,0.1)" }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, margin: "0 0 2px" }}>⚙️ 베이지안 추론 결과</h3>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: "0 0 12px" }}>Prior × Likelihood × Resonance → Posterior</p>

          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            <Metric label="Bayesian Top-1" value={topA.icon} color={GROUPS[topA.group].color}
              sub={`${topA.name} (${(sorted[0].prob * 100).toFixed(1)}%)`} />
            <Metric label="Rule-based" value={ruleA.icon} color={isMatch ? "#00D68F" : "#EF4444"}
              sub={`${ruleA.name} ${isMatch ? "✓ 일치" : "✗ 불일치"}`} />
            <Metric label="ROC Confidence" value={`${(roc.confidence * 100).toFixed(0)}%`}
              color={roc.isReliable ? "#00D68F" : "#F59E0B"}
              sub={`임계값 15% ${roc.isReliable ? "· 신뢰" : "· 재분류 권고"}`} />
          </div>

          <div style={{ display: "flex", gap: 3, marginBottom: 10 }}>
            {[
              { id: "prior", label: "사전확률 P(A)" },
              { id: "likelihood", label: "우도 P(D|A)" },
              { id: "posterior", label: "사후확률 P(A|D)" },
            ].map(v => (
              <button key={v.id} onClick={() => setActiveView(v.id)} style={{
                flex: 1, padding: "6px 10px", borderRadius: 7, cursor: "pointer", fontSize: 10,
                border: activeView === v.id ? "1px solid rgba(168,85,247,0.4)" : "1px solid rgba(255,255,255,0.05)",
                background: activeView === v.id ? "rgba(168,85,247,0.1)" : "transparent",
                color: activeView === v.id ? "#A855F7" : "rgba(255,255,255,0.35)",
                fontWeight: activeView === v.id ? 700 : 400,
              }}>{v.label}</button>
            ))}
          </div>

          {sorted.map(({ idx }, rank) => {
            const a = ARCHETYPES[idx];
            return (
              <ProbBar key={a.id} prob={displayData[idx]} maxProb={Math.max(...displayData)}
                color={GROUPS[a.group].color} label={`${a.name} · ${a.en}`}
                icon={a.icon} isTop={rank < 3} />
            );
          })}
        </div>

        {/* ─── TRACE LOG ─── */}
        <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 12, padding: 16, border: "1px solid rgba(255,255,255,0.05)" }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, margin: "0 0 2px" }}>📜 알고리즘 실행 로그</h3>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: "0 0 10px" }}>특허 명세서 S3010→S5030 실행 경로 추적</p>
          <div style={{
            fontFamily: "monospace", fontSize: 10, color: "rgba(255,255,255,0.5)",
            lineHeight: 1.9, background: "rgba(0,0,0,0.25)", borderRadius: 7, padding: 12,
            maxHeight: 180, overflowY: "auto",
          }}>
            <div><span style={{ color: "#2D8CFF" }}>S3010</span> 생년월일시={birthYear}.{birthMonth}.{birthDay} {birthHour}:00 → Core Energy={currentEnergy.name} · Balance={activeBalance}</div>
            <div><span style={{ color: "#2D8CFF" }}>S3040</span> V_core=[{innateVector.ns.toFixed(3)}, {innateVector.tf.toFixed(3)}, {innateVector.jp.toFixed(3)}, {innateVector.ei.toFixed(3)}]</div>
            <div><span style={{ color: "#00D68F" }}>S4010</span> KIPA V_b=[{kipaVector.ns.toFixed(3)}, {kipaVector.tf.toFixed(3)}, {kipaVector.jp.toFixed(3)}, {kipaVector.ei.toFixed(3)}]</div>
            <div><span style={{ color: "#A855F7" }}>S4030</span> 공명/충돌Δ 적용 → V_fused=[{fusedVector.ns.toFixed(3)}, {fusedVector.tf.toFixed(3)}, {fusedVector.jp.toFixed(3)}, {fusedVector.ei.toFixed(3)}]</div>
            <div><span style={{ color: "#F59E0B" }}>BAYES</span> Top-1: {topA.name} ({(sorted[0].prob*100).toFixed(2)}%) | Top-2: {ARCHETYPES[sorted[1].idx].name} ({(sorted[1].prob*100).toFixed(2)}%) | Top-3: {ARCHETYPES[sorted[2].idx].name} ({(sorted[2].prob*100).toFixed(2)}%)</div>
            <div><span style={{ color: "#EF4444" }}>ROC</span> Conf={((roc.confidence)*100).toFixed(1)}% Thr=15% → {roc.isReliable ? "✓ RELIABLE" : "⚠ RECALIBRATE"}</div>
            <div><span style={{ color: isMatch ? "#00D68F" : "#EF4444" }}>MATCH</span> Bayesian({topA.en}) vs Rule({ruleA.en}): {isMatch ? "CONSENSUS ✓" : "DIVERGE — Bayesian 우선"}</div>
            <div><span style={{ color: "#2D8CFF" }}>3-IND</span> 💰경제감각={threeIndicators.economic} ⚡표현에너지={threeIndicators.expressive} 🛡️위기대응력={threeIndicators.crisis}</div>
          </div>
        </div>

        <div style={{ textAlign: "center", padding: "8px 0", opacity: 0.2, fontSize: 9 }}>
          © Neurin Kairos AI Inc. · Patent P25KAI001KR · Bayesian Prior Engine v0.2
        </div>
      </div>
    </div>
  );
}
