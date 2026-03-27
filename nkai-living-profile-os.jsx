import { useState, useMemo, useEffect, useCallback } from "react";
import { AreaChart, Area, LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";

// ═══════════════════════════════════════════════════════════════
// N-KAI LIVING PROFILE OS v1.0
// "Dead Profile은 끝났다. 이것은 살아있는 프로필이다."
// 실데이터: 510건 6개월 + 매일 적재되는 다차원 행동 데이터
// 특허 P25KAI001KR · 4대 알고리즘 실시간 구동
// ═══════════════════════════════════════════════════════════════

// ─── 6개월 축적 히스토리 (실데이터 기반) ───
const HISTORY = [
  { day: 0, date: "09/24", phase: 0, nScore: null, eating: 45, drinking: 35, nightlife: 12, health: 0, morning: 0, social: 8, infra: 0, posterior: 0.50, sigma: 1.0, event: "Pre-PoC 시작" },
  { day: 30, date: "10/24", phase: 0, nScore: null, eating: 50, drinking: 30, nightlife: 25, health: 0, morning: 0, social: 5, infra: 0, posterior: 0.55, sigma: 0.95, event: "유흥 496K 탐지" },
  { day: 45, date: "11/08", phase: 0, nScore: null, eating: 30, drinking: 20, nightlife: 10, health: 5, morning: 0, social: 3, infra: 2, posterior: 0.55, sigma: 0.70, event: "카드 교체(개명)" },
  { day: 60, date: "11/23", phase: 0, nScore: null, eating: 15, drinking: 14, nightlife: 8, health: 10, morning: 0, social: 5, infra: 5, posterior: 0.60, sigma: 0.55, event: "배달 전환 시작" },
  { day: 75, date: "12/08", phase: 1, nScore: 52, eating: 10, drinking: 12, nightlife: 0, health: 18, morning: 0, social: 4, infra: 8, posterior: 0.70, sigma: 0.40, event: "홈쿡 최초" },
  { day: 90, date: "12/23", phase: 1, nScore: 55, eating: 8, drinking: 8, nightlife: 0, health: 25, morning: 0, social: 3, infra: 10, posterior: 0.72, sigma: 0.35, event: "음주 급감" },
  { day: 105, date: "01/07", phase: 2, nScore: 59, eating: 5, drinking: 5, nightlife: 0, health: 33, morning: 2, social: 5, infra: 12, posterior: 0.82, sigma: 0.25, event: "비빔밥 루틴" },
  { day: 120, date: "01/22", phase: 2, nScore: 65, eating: 4, drinking: 0, nightlife: 0, health: 40, morning: 5, social: 4, infra: 15, posterior: 0.85, sigma: 0.20, event: "포케볼 발견" },
  { day: 135, date: "02/06", phase: 3, nScore: 73, eating: 3, drinking: 0, nightlife: 0, health: 50, morning: 50, social: 6, infra: 18, posterior: 0.88, sigma: 0.10, event: "모닝루틴 시작" },
  { day: 145, date: "02/16", phase: 3, nScore: 74, eating: 2, drinking: 0, nightlife: 0, health: 55, morning: 90, social: 5, infra: 20, posterior: 0.93, sigma: 0.05, event: "9일 연속 루틴" },
  { day: 155, date: "02/26", phase: 3, nScore: 74, eating: 2, drinking: 2, nightlife: 0, health: 58, morning: 95, social: 8, infra: 22, posterior: 0.95, sigma: 0.02, event: "3분 자기교정" },
];

// ─── 8차원 라이프 벡터 정의 ───
const LIFE_DIMS = [
  { key: "health", name: "건강식", emoji: "🥗", color: "#00D68F", group: "wellness" },
  { key: "morning", name: "모닝루틴", emoji: "🌅", color: "#F59E0B", group: "wellness" },
  { key: "social", name: "사회적 만남", emoji: "🤝", color: "#3B82F6", group: "social" },
  { key: "infra", name: "사업 투자", emoji: "💻", color: "#A855F7", group: "growth" },
  { key: "eating", name: "외식 의존", emoji: "🍽️", color: "#EF4444", group: "risk" },
  { key: "drinking", name: "음주", emoji: "🍺", color: "#DC2626", group: "risk" },
  { key: "nightlife", name: "유흥", emoji: "🌙", color: "#991B1B", group: "risk" },
  { key: "bowel", name: "장 건강", emoji: "💚", color: "#22C55E", group: "wellness" },
];

// ─── 행동 카테고리 입력 옵션 ───
const INPUT_CATEGORIES = [
  { id: "morning_routine", label: "🌅 모닝루틴", desc: "물+계란+요거트", dim: "morning", wellness: 95, healthBoost: 5, morningBoost: 8 },
  { id: "healthy_meal", label: "🥗 건강식", desc: "비빔밥/포케볼/샐러드", dim: "health", wellness: 85, healthBoost: 6, morningBoost: 0 },
  { id: "home_cook", label: "🍳 자취요리", desc: "계란후라이+브로콜리", dim: "health", wellness: 90, healthBoost: 7, morningBoost: 0 },
  { id: "delivery_healthy", label: "📦 건강배달", desc: "된장비빔밥/김치찌개", dim: "health", wellness: 70, healthBoost: 3, morningBoost: 0 },
  { id: "delivery_junk", label: "🍕 가공식배달", desc: "치킨/돈까스/피자", dim: "eating", wellness: 30, healthBoost: -3, morningBoost: 0 },
  { id: "eating_out", label: "🍽️ 외식", desc: "식당/고깃집", dim: "eating", wellness: 50, healthBoost: -2, morningBoost: 0 },
  { id: "drinking", label: "🍺 음주", desc: "소주/맥주/와인", dim: "drinking", wellness: 25, healthBoost: -5, morningBoost: -8 },
  { id: "nightlife", label: "🌙 유흥", desc: "나이트/바", dim: "nightlife", wellness: 15, healthBoost: -8, morningBoost: -10 },
  { id: "cafe", label: "☕ 카페", desc: "아메리카노/라떼", dim: "social", wellness: 60, healthBoost: 1, morningBoost: 0 },
  { id: "social_meet", label: "🤝 사회적 만남", desc: "가족/친구/비즈니스", dim: "social", wellness: 70, healthBoost: 0, morningBoost: 0 },
  { id: "exercise", label: "🏃 운동", desc: "걷기/스트레칭", dim: "health", wellness: 95, healthBoost: 8, morningBoost: 3 },
  { id: "bowel_good", label: "💚 쾌변", desc: "아침 장건강 체크", dim: "bowel", wellness: 98, healthBoost: 4, morningBoost: 5 },
  { id: "infra_invest", label: "💻 사업투자", desc: "AWS/구글/도메인", dim: "infra", wellness: 60, healthBoost: 0, morningBoost: 0 },
  { id: "sleep_late", label: "😴 심야활동", desc: "새벽 2시 이후", dim: "nightlife", wellness: 20, healthBoost: -4, morningBoost: -6 },
  { id: "skip_meal", label: "⚠️ 식사 스킵", desc: "업무몰입/번아웃", dim: "eating", wellness: 15, healthBoost: -6, morningBoost: -3 },
];

// ─── Bayesian Engine ───
function bayesianUpdate(prior, evidence) {
  const posEvents = ["morning_routine", "healthy_meal", "home_cook", "delivery_healthy", "exercise", "bowel_good", "cafe"];
  const negEvents = ["drinking", "nightlife", "sleep_late", "skip_meal", "delivery_junk"];
  let likelihood = 0.5;
  evidence.forEach(e => {
    if (posEvents.includes(e)) likelihood = Math.min(0.99, likelihood + 0.08);
    if (negEvents.includes(e)) likelihood = Math.max(0.05, likelihood - 0.12);
  });
  const unnorm = prior * likelihood;
  const marginal = unnorm + (1 - prior) * (1 - likelihood);
  return Math.max(0.01, Math.min(0.99, unnorm / marginal));
}

// ─── ROC Alert Engine ───
function checkAlerts(todayEvents, history) {
  const alerts = [];
  if (todayEvents.includes("drinking") && todayEvents.includes("nightlife"))
    alerts.push({ level: "CRITICAL", msg: "음주+유흥 동시 발생", value: 0.92 });
  if (todayEvents.includes("drinking"))
    alerts.push({ level: "WARNING", msg: "음주 감지 — 모닝루틴 영향 예상", value: 0.65 });
  if (todayEvents.includes("sleep_late"))
    alerts.push({ level: "WARNING", msg: "심야활동 — 수면패턴 교란", value: 0.60 });
  if (todayEvents.includes("skip_meal"))
    alerts.push({ level: "WARNING", msg: "식사 스킵 — 번아웃 시그널", value: 0.70 });
  if (todayEvents.filter(e => e === "delivery_junk").length >= 2)
    alerts.push({ level: "WARNING", msg: "가공식 2회+ — 건강식 이탈 위험", value: 0.55 });
  return alerts;
}

// ─── Prediction Engine ───
function predictNext(history, todayEvents) {
  const predictions = [];
  const hasHealthy = todayEvents.some(e => ["healthy_meal", "home_cook", "delivery_healthy"].includes(e));
  const hasDrinking = todayEvents.includes("drinking");
  const hasMorning = todayEvents.includes("morning_routine");

  if (hasMorning && hasHealthy) {
    predictions.push({ item: "내일 쾌변 예상", confidence: 91, algo: "ROC+CDE", emoji: "💚" });
    predictions.push({ item: "내일 모닝루틴 유지", confidence: 95, algo: "베이지안", emoji: "🌅" });
  }
  if (hasDrinking) {
    predictions.push({ item: "내일 아침 경량식 전환", confidence: 75, algo: "Neural CDE", emoji: "🍞" });
    predictions.push({ item: "24h 후 국물/해장 선택", confidence: 70, algo: "CDE 궤적", emoji: "🍲" });
  }
  if (hasHealthy && !hasDrinking) {
    predictions.push({ item: "건강식 루틴 강화 중", confidence: 88, algo: "베이지안", emoji: "📈" });
  }
  if (predictions.length === 0) {
    predictions.push({ item: "데이터 수집 중...", confidence: 50, algo: "대기", emoji: "⏳" });
  }
  return predictions;
}

// ─── N-Score Calculator ───
function calcNScore(dims) {
  const positive = (dims.health || 0) * 0.25 + (dims.morning || 0) * 0.20 + (dims.social || 0) * 0.10 + (dims.infra || 0) * 0.10 + (dims.bowel || 0) * 0.10;
  const negative = (dims.eating || 0) * 0.08 + (dims.drinking || 0) * 0.12 + (dims.nightlife || 0) * 0.05;
  return Math.min(99, Math.max(1, Math.round(40 + positive * 0.5 - negative * 0.8)));
}

// ─── Phase Detector ───
function detectPhase(nScore, sigma) {
  if (nScore === null || nScore < 50) return { phase: 0, name: "기저선 수집", color: "#EF4444" };
  if (nScore < 58) return { phase: 1, name: "변화 시작", color: "#F59E0B" };
  if (nScore < 70) return { phase: 2, name: "안정화", color: "#3B82F6" };
  return { phase: 3, name: "자율 진화", color: "#00D68F" };
}

// ─── UI Components ───
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "rgba(8,8,15,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", fontSize: 11 }}>
      <div style={{ fontWeight: 700, color: "#fff", marginBottom: 3 }}>{label}</div>
      {payload.map((p, i) => p.value != null && (
        <div key={i} style={{ color: p.color || "#fff", display: "flex", justifyContent: "space-between", gap: 14 }}>
          <span>{p.name}</span>
          <span style={{ fontWeight: 700, fontFamily: "monospace" }}>{typeof p.value === "number" ? p.value.toFixed(1) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

const Pulse = ({ color, size = 8 }) => (
  <span style={{ display: "inline-block", width: size, height: size, borderRadius: "50%", background: color, boxShadow: `0 0 ${size}px ${color}`, animation: "pulse 2s infinite" }} />
);

// ═══════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════

export default function LivingProfileOS() {
  const [todayEvents, setTodayEvents] = useState([]);
  const [dayLog, setDayLog] = useState([]); // accumulated daily entries
  const [liveHistory, setLiveHistory] = useState([...HISTORY]);
  const [currentPosterior, setCurrentPosterior] = useState(0.95);
  const [liveDims, setLiveDims] = useState({ health: 58, morning: 95, social: 8, infra: 22, eating: 2, drinking: 2, nightlife: 0, bowel: 80 });
  const [showInput, setShowInput] = useState(false);
  const [activeView, setActiveView] = useState("live");
  const [animPulse, setAnimPulse] = useState(false);

  const nScore = useMemo(() => calcNScore(liveDims), [liveDims]);
  const phaseInfo = useMemo(() => detectPhase(nScore, 0.02), [nScore]);
  const alerts = useMemo(() => checkAlerts(todayEvents, liveHistory), [todayEvents, liveHistory]);
  const predictions = useMemo(() => predictNext(liveHistory, todayEvents), [liveHistory, todayEvents]);

  const addEvent = useCallback((catId) => {
    const cat = INPUT_CATEGORIES.find(c => c.id === catId);
    if (!cat) return;
    setTodayEvents(prev => [...prev, catId]);
    setDayLog(prev => [...prev, { id: catId, time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }), ...cat }]);

    // Bayesian update
    setCurrentPosterior(prev => bayesianUpdate(prev, [...todayEvents, catId]));

    // Update dimensions
    setLiveDims(prev => {
      const next = { ...prev };
      if (cat.healthBoost > 0) next.health = Math.min(99, next.health + cat.healthBoost * 0.3);
      if (cat.healthBoost < 0) next.health = Math.max(0, next.health + cat.healthBoost * 0.5);
      if (cat.morningBoost > 0) next.morning = Math.min(99, next.morning + cat.morningBoost * 0.2);
      if (cat.morningBoost < 0) next.morning = Math.max(0, next.morning + cat.morningBoost * 0.4);
      if (catId === "bowel_good") next.bowel = Math.min(99, next.bowel + 5);
      if (catId === "social_meet" || catId === "cafe") next.social = Math.min(99, next.social + 3);
      if (catId === "infra_invest") next.infra = Math.min(99, next.infra + 2);
      if (catId === "drinking") { next.drinking = Math.min(99, next.drinking + 15); next.morning = Math.max(0, next.morning - 10); }
      if (catId === "nightlife") { next.nightlife = Math.min(99, next.nightlife + 20); next.drinking = Math.min(99, next.drinking + 10); }
      if (catId === "eating_out") next.eating = Math.min(99, next.eating + 5);
      if (catId === "delivery_junk") next.eating = Math.min(99, next.eating + 8);
      return next;
    });

    setAnimPulse(true);
    setTimeout(() => setAnimPulse(false), 800);
  }, [todayEvents]);

  const resetDay = () => {
    setTodayEvents([]);
    setDayLog([]);
    setLiveDims({ health: 58, morning: 95, social: 8, infra: 22, eating: 2, drinking: 2, nightlife: 0, bowel: 80 });
    setCurrentPosterior(0.95);
  };

  // Radar data
  const radarData = LIFE_DIMS.map(d => ({
    axis: d.emoji + " " + d.name,
    value: liveDims[d.key] || 0,
    fullMark: 100,
  }));

  // N-Score history for chart
  const nScoreHistory = liveHistory.filter(h => h.nScore !== null).map(h => ({ date: h.date, nScore: h.nScore, posterior: h.posterior * 100 }));
  nScoreHistory.push({ date: "Today", nScore, posterior: currentPosterior * 100 });

  // 3대 지표
  const threeInd = {
    economic: Math.min(99, Math.max(1, Math.round(45 + liveDims.infra * 0.5 + liveDims.health * 0.2 - liveDims.nightlife * 0.3))),
    expressive: Math.min(99, Math.max(1, Math.round(40 + liveDims.social * 0.8 + liveDims.morning * 0.3))),
    crisis: Math.min(99, Math.max(1, Math.round(50 + liveDims.morning * 0.25 + liveDims.health * 0.15 + liveDims.bowel * 0.1 - liveDims.drinking * 0.4))),
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(170deg, #05050a 0%, #08091a 40%, #060812 100%)",
      color: "#fff", fontFamily: "'Segoe UI', -apple-system, sans-serif",
    }}>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes glow { 0%, 100% { box-shadow: 0 0 5px rgba(0,214,143,0.2); } 50% { box-shadow: 0 0 20px rgba(0,214,143,0.4); } }`}
      </style>

      <div style={{ maxWidth: 880, margin: "0 auto", padding: "14px 12px" }}>

        {/* ─── HEADER ─── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Pulse color="#00D68F" size={10} />
              <span style={{ fontSize: 9, letterSpacing: "0.3em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase" }}>
                Living Profile OS · ALIVE
              </span>
            </div>
            <h1 style={{
              fontSize: 22, fontWeight: 900, margin: "4px 0 0",
              background: "linear-gradient(135deg, #00D68F, #2D8CFF, #A855F7)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>N-KAI 자율진화 엔진</h1>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: phaseInfo.color, fontFamily: "monospace", lineHeight: 1, animation: animPulse ? "glow 0.8s ease" : "none" }}>
              {nScore}
            </div>
            <div style={{ fontSize: 10, color: phaseInfo.color, fontWeight: 600 }}>N-Score · Phase {phaseInfo.phase}</div>
          </div>
        </div>

        {/* ─── LIVE STRIP ─── */}
        <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
          {/* 3대 지표 */}
          {[
            { emoji: "💰", name: "경제감각", value: threeInd.economic, color: "#2D8CFF" },
            { emoji: "⚡", name: "표현에너지", value: threeInd.expressive, color: "#5AA8FF" },
            { emoji: "🛡️", name: "위기대응력", value: threeInd.crisis, color: "#00D68F" },
          ].map(ind => (
            <div key={ind.name} style={{
              flex: 1, minWidth: 80, padding: "8px 10px", borderRadius: 10, textAlign: "center",
              background: `${ind.color}08`, border: `1px solid ${ind.color}22`,
            }}>
              <div style={{ fontSize: 13 }}>{ind.emoji}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: ind.color, fontFamily: "monospace" }}>{ind.value}</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)" }}>{ind.name}</div>
            </div>
          ))}
          {/* Bayesian */}
          <div style={{ flex: 1, minWidth: 80, padding: "8px 10px", borderRadius: 10, textAlign: "center", background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.15)" }}>
            <div style={{ fontSize: 13 }}>🔮</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#A855F7", fontFamily: "monospace" }}>{(currentPosterior * 100).toFixed(1)}%</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)" }}>Posterior</div>
          </div>
          {/* Phase */}
          <div style={{ flex: 1, minWidth: 80, padding: "8px 10px", borderRadius: 10, textAlign: "center", background: `${phaseInfo.color}08`, border: `1px solid ${phaseInfo.color}22` }}>
            <div style={{ fontSize: 13 }}>🌊</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: phaseInfo.color }}>{phaseInfo.name}</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)" }}>Phase {phaseInfo.phase}</div>
          </div>
        </div>

        {/* ─── DATA INPUT TOGGLE ─── */}
        <button onClick={() => setShowInput(!showInput)} style={{
          width: "100%", padding: "10px 16px", borderRadius: 10, cursor: "pointer", marginBottom: 10,
          border: "1px solid rgba(0,214,143,0.3)", fontSize: 13, fontWeight: 700,
          background: showInput ? "rgba(0,214,143,0.1)" : "linear-gradient(135deg, rgba(0,214,143,0.08), rgba(45,140,255,0.08))",
          color: "#00D68F", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          <Pulse color="#00D68F" /> {showInput ? "입력 닫기" : "📥 오늘의 데이터 입력 — 프로필이 실시간 진화합니다"}
        </button>

        {/* ─── DATA INPUT PANEL ─── */}
        {showInput && (
          <div style={{ background: "rgba(0,214,143,0.03)", border: "1px solid rgba(0,214,143,0.1)", borderRadius: 12, padding: 14, marginBottom: 12, animation: "slideIn 0.3s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#00D68F" }}>행동 데이터 입력</div>
              <button onClick={resetDay} style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", background: "none", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "3px 10px", cursor: "pointer" }}>초기화</button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {INPUT_CATEGORIES.map(cat => {
                const count = todayEvents.filter(e => e === cat.id).length;
                return (
                  <button key={cat.id} onClick={() => addEvent(cat.id)} style={{
                    padding: "6px 10px", borderRadius: 8, cursor: "pointer", fontSize: 11, position: "relative",
                    border: count > 0 ? `1px solid ${cat.wellness > 60 ? "rgba(0,214,143,0.3)" : "rgba(239,68,68,0.3)"}` : "1px solid rgba(255,255,255,0.06)",
                    background: count > 0 ? (cat.wellness > 60 ? "rgba(0,214,143,0.08)" : "rgba(239,68,68,0.08)") : "rgba(255,255,255,0.02)",
                    color: count > 0 ? "#fff" : "rgba(255,255,255,0.5)",
                  }}>
                    {cat.label}
                    {count > 0 && <span style={{ position: "absolute", top: -4, right: -4, background: "#00D68F", color: "#000", fontSize: 9, fontWeight: 800, borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>{count}</span>}
                  </button>
                );
              })}
            </div>

            {/* Today Log */}
            {dayLog.length > 0 && (
              <div style={{ marginTop: 10, padding: 8, borderRadius: 8, background: "rgba(0,0,0,0.2)", maxHeight: 100, overflowY: "auto" }}>
                {dayLog.map((log, i) => (
                  <div key={i} style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", padding: "2px 0", animation: "slideIn 0.3s ease" }}>
                    <span style={{ color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>{log.time}</span> {log.label} <span style={{ color: log.wellness > 60 ? "#00D68F" : "#EF4444" }}>W:{log.wellness}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── ALERTS ─── */}
        {alerts.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            {alerts.map((a, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", borderRadius: 8, marginBottom: 3,
                background: a.level === "CRITICAL" ? "rgba(239,68,68,0.08)" : "rgba(245,158,11,0.06)",
                border: `1px solid ${a.level === "CRITICAL" ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.15)"}`,
                animation: "slideIn 0.4s ease",
              }}>
                <span style={{ fontSize: 12 }}>{a.level === "CRITICAL" ? "🔴" : "🟡"}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: a.level === "CRITICAL" ? "#EF4444" : "#F59E0B" }}>T-60</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", flex: 1 }}>{a.msg}</span>
                <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "monospace", color: a.level === "CRITICAL" ? "#EF4444" : "#F59E0B" }}>{(a.value*100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        )}

        {/* ─── VIEW TABS ─── */}
        <div style={{ display: "flex", gap: 3, marginBottom: 10 }}>
          {[
            { id: "live", label: "🔮 라이브 레이더" },
            { id: "trajectory", label: "🌊 궤적" },
            { id: "predict", label: "⚡ 예측" },
            { id: "evolution", label: "🧬 진화" },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveView(t.id)} style={{
              flex: 1, padding: "7px 8px", borderRadius: 8, cursor: "pointer", fontSize: 11,
              border: activeView === t.id ? "1px solid rgba(0,214,143,0.3)" : "1px solid rgba(255,255,255,0.04)",
              background: activeView === t.id ? "rgba(0,214,143,0.08)" : "transparent",
              color: activeView === t.id ? "#00D68F" : "rgba(255,255,255,0.35)", fontWeight: activeView === t.id ? 700 : 400,
            }}>{t.label}</button>
          ))}
        </div>

        {/* ─── LIVE RADAR VIEW ─── */}
        {activeView === "live" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 12, padding: 14, border: "1px solid rgba(0,214,143,0.08)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#00D68F", marginBottom: 6 }}>🔮 8차원 라이프 레이더</div>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.06)" />
                  <PolarAngleAxis dataKey="axis" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.5)" }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 8, fill: "rgba(255,255,255,0.2)" }} />
                  <Radar name="Living Profile" dataKey="value" stroke="#00D68F" fill="#00D68F" fillOpacity={0.15} strokeWidth={2} dot={{ r: 4, fill: "#00D68F" }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {LIFE_DIMS.map(d => {
                const val = liveDims[d.key] || 0;
                return (
                  <div key={d.key} style={{ background: "rgba(255,255,255,0.02)", borderRadius: 8, padding: "6px 10px", border: `1px solid ${d.color}10` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>{d.emoji} {d.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: d.color, fontFamily: "monospace" }}>{val}</span>
                    </div>
                    <div style={{ height: 4, background: "rgba(255,255,255,0.04)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${val}%`, background: d.group === "risk" ? `linear-gradient(90deg, ${d.color}88, ${d.color})` : `linear-gradient(90deg, ${d.color}44, ${d.color})`, borderRadius: 2, transition: "width 0.6s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── TRAJECTORY VIEW ─── */}
        {activeView === "trajectory" && (
          <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 12, padding: 14, border: "1px solid rgba(0,214,143,0.08)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#00D68F", marginBottom: 2 }}>🌊 N-Score + Posterior 궤적</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 10 }}>6개월 축적 + 오늘 실시간</div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={nScoreHistory} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="nsGrd" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00D68F" stopOpacity={0.3} /><stop offset="100%" stopColor="#00D68F" stopOpacity={0} /></linearGradient>
                  <linearGradient id="bGrd" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#A855F7" stopOpacity={0.2} /><stop offset="100%" stopColor="#A855F7" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} />
                <YAxis domain={[40, 100]} tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="nScore" stroke="#00D68F" fill="url(#nsGrd)" strokeWidth={3} name="N-Score" dot={{ r: 4, fill: "#00D68F" }} />
                <Area type="monotone" dataKey="posterior" stroke="#A855F7" fill="url(#bGrd)" strokeWidth={2} strokeDasharray="4 4" name="Posterior %" dot={{ r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>

            {/* σ(h) bar */}
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>확산 σ(h) 수렴 추적 — 높을수록 불안정</div>
              <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 50 }}>
                {HISTORY.map((h, i) => {
                  const ht = Math.max(3, h.sigma * 50);
                  const col = h.sigma > 0.6 ? "#EF4444" : h.sigma > 0.3 ? "#F59E0B" : "#00D68F";
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                      <div style={{ width: "100%", height: ht, background: `linear-gradient(180deg, ${col}, ${col}33)`, borderRadius: "3px 3px 0 0", transition: "all 0.5s" }} />
                      <span style={{ fontSize: 7, color: "rgba(255,255,255,0.2)" }}>{h.date}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ─── PREDICTION VIEW ─── */}
        {activeView === "predict" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 12, padding: 14, border: "1px solid rgba(245,158,11,0.1)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#F59E0B", marginBottom: 2 }}>⚡ AI 예측 엔진</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 10 }}>오늘 입력 데이터 기반 내일 행동 예측</div>
              {predictions.map((p, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, marginBottom: 4,
                  background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.08)",
                }}>
                  <span style={{ fontSize: 18 }}>{p.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{p.item}</div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)" }}>{p.algo}</div>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: p.confidence >= 80 ? "#00D68F" : "#F59E0B", fontFamily: "monospace" }}>
                    {p.confidence}%
                  </div>
                </div>
              ))}
              {todayEvents.length === 0 && (
                <div style={{ textAlign: "center", padding: "20px 0", color: "rgba(255,255,255,0.2)", fontSize: 12 }}>
                  ☝️ 위에서 오늘의 데이터를 입력하면 예측이 활성화됩니다
                </div>
              )}
            </div>

            {/* 검증된 법칙 */}
            <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 12, padding: 14, border: "1px solid rgba(0,214,143,0.08)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#00D68F", marginBottom: 8 }}>📜 검증된 행동 법칙</div>
              {[
                { name: "크레이빙 3일 포화", desc: "동일 크레이빙 3일 → 반대 전환", conf: 85 },
                { name: "서브클러스터 분화", desc: "반복 3회+ → 미세 변주 자동생성", conf: 90 },
                { name: "쾌변 공식 v1", desc: "발효식+식이섬유 저녁+모닝루틴 → 쾌변", conf: 90 },
                { name: "모닝루틴 내구성", desc: "7일+ 누적 시 1회 이탈에도 유지", conf: 75 },
              ].map((l, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <span style={{ fontSize: 10, color: l.conf >= 85 ? "#00D68F" : "#F59E0B" }}>{l.conf >= 85 ? "✅" : "⚠️"}</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 11, color: "#fff", fontWeight: 600 }}>{l.name}</span>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginLeft: 8 }}>{l.desc}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "monospace", color: l.conf >= 85 ? "#00D68F" : "#F59E0B" }}>{l.conf}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── EVOLUTION VIEW ─── */}
        {activeView === "evolution" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 12, padding: 14, border: "1px solid rgba(168,85,247,0.1)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#A855F7", marginBottom: 2 }}>🧬 6개월 클러스터 진화</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 10 }}>외식/유흥 → 건강식/루틴 구조 전환</div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={[
                  { m: "09~10", health: 0, risk: 57, morning: 0 },
                  { m: "11월", health: 10, risk: 37, morning: 0 },
                  { m: "12월", health: 30, risk: 23, morning: 0 },
                  { m: "1월", health: 60, risk: 1, morning: 5 },
                  { m: "2월", health: 67, risk: 4, morning: 95 },
                  { m: "Today", health: liveDims.health, risk: liveDims.eating + liveDims.drinking + liveDims.nightlife, morning: liveDims.morning },
                ]} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="m" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} />
                  <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="risk" stroke="#EF4444" fill="#EF444422" strokeWidth={2} name="🔴 외식/음주/유흥" />
                  <Area type="monotone" dataKey="health" stroke="#00D68F" fill="#00D68F22" strokeWidth={3} name="🟢 건강식" />
                  <Area type="monotone" dataKey="morning" stroke="#F59E0B" fill="#F59E0B22" strokeWidth={2} name="🌅 모닝루틴" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Phase Timeline */}
            <div style={{ display: "flex", gap: 4 }}>
              {[
                { p: 0, label: "Pre-PoC", period: "09~11월", desc: "외식+음주+유흥", color: "#EF4444", icon: "🔴" },
                { p: 1, label: "변화 시작", period: "12월", desc: "배달전환+홈쿡", color: "#F59E0B", icon: "🟡" },
                { p: 2, label: "안정화", period: "1월", desc: "비빔밥루틴+5극", color: "#3B82F6", icon: "🔵" },
                { p: 3, label: "자율 진화", period: "2월", desc: "모닝루틴+97.3%", color: "#00D68F", icon: "🟢" },
              ].map(ph => (
                <div key={ph.p} style={{
                  flex: 1, padding: "8px 8px", borderRadius: 8, textAlign: "center",
                  background: phaseInfo.phase === ph.p ? `${ph.color}12` : "rgba(255,255,255,0.02)",
                  border: `1px solid ${phaseInfo.phase === ph.p ? ph.color + "44" : "rgba(255,255,255,0.04)"}`,
                }}>
                  <div style={{ fontSize: 16 }}>{ph.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: ph.color, marginTop: 2 }}>Phase {ph.p}</div>
                  <div style={{ fontSize: 10, color: "#fff", marginTop: 2 }}>{ph.label}</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{ph.period}</div>
                  <div style={{ fontSize: 8, color: "rgba(255,255,255,0.25)", marginTop: 1 }}>{ph.desc}</div>
                </div>
              ))}
            </div>

            {/* Key Transformation */}
            <div style={{ background: "rgba(0,214,143,0.04)", borderRadius: 12, padding: 14, border: "1px solid rgba(0,214,143,0.12)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#00D68F", marginBottom: 8 }}>⭐ 핵심 행동 전환 — Living Profile 실증</div>
              {[
                { label: "외식 의존", from: "28.5%", to: "5.3%", change: "-81%", color: "#EF4444" },
                { label: "건강식", from: "5%", to: "40%", change: "+700%", color: "#00D68F" },
                { label: "유흥/음주", from: "496K/3개월", to: "₩0", change: "-100%", color: "#DC2626" },
                { label: "모닝루틴", from: "없음", to: "11일+ 연속", change: "NEW", color: "#F59E0B" },
                { label: "N-Score", from: "측정불가", to: "74", change: "+42%", color: "#A855F7" },
              ].map((t, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", flex: 1 }}>{t.label}</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "monospace", width: 80, textAlign: "right" }}>{t.from}</span>
                  <span style={{ color: "rgba(255,255,255,0.2)" }}>→</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: t.color, fontFamily: "monospace", width: 80 }}>{t.to}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: t.change.startsWith("+") || t.change === "NEW" ? "#00D68F" : "#EF4444", width: 50, textAlign: "right" }}>{t.change}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "14px 0 6px", fontSize: 9, color: "rgba(255,255,255,0.15)" }}>
          N-KAI Living Profile OS v1.0 · P25KAI001KR · 510건 실데이터 기반
          <br />Dead Profile은 끝났다. 이것은 살아있는 프로필이다.
        </div>
      </div>
    </div>
  );
}
