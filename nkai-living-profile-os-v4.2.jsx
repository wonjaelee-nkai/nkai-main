import { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════════════════
// N-KAI LIVING PROFILE OS v4.2 — MULTIMODAL ICON SYSTEM
// 5-Energy × Action Hero × Archetype Identity
// Patent: P25KAI001KR · Neurin Kairos AI Inc.
// ═══════════════════════════════════════════════════════════════

const ELEMENTS = {
  metal: { ko: "金", en: "Metal", color: "#C0C8D4", grad: ["#546E7A","#90A4AE","#CFD8DC"], bg: "linear-gradient(135deg,#546E7A,#90A4AE,#CFD8DC)", particle: "✦" },
  wood:  { ko: "木", en: "Wood",  color: "#66BB6A", grad: ["#2E7D32","#43A047","#81C784"], bg: "linear-gradient(135deg,#1B5E20,#388E3C,#81C784)", particle: "🍃" },
  fire:  { ko: "火", en: "Fire",  color: "#FF7043", grad: ["#BF360C","#E64A19","#FF8A65"], bg: "linear-gradient(135deg,#BF360C,#E64A19,#FFAB91)", particle: "✧" },
  water: { ko: "水", en: "Water", color: "#42A5F5", grad: ["#0D47A1","#1976D2","#64B5F6"], bg: "linear-gradient(135deg,#0D47A1,#1565C0,#90CAF9)", particle: "💧" },
  earth: { ko: "土", en: "Earth", color: "#FFD54F", grad: ["#F57F17","#FBC02D","#FFF176"], bg: "linear-gradient(135deg,#E65100,#F9A825,#FFF9C4)", particle: "⬡" },
};

const HERO_ICONS = {
  ENTJ: { hero: "👑", element: "fire" },   INTJ: { hero: "🧭", element: "metal" },
  ENTP: { hero: "⚡", element: "fire" },   INTP: { hero: "🔬", element: "water" },
  ESTJ: { hero: "🏛", element: "metal" },  ISTJ: { hero: "🛡", element: "earth" },
  ESTP: { hero: "⚔", element: "fire" },   ISTP: { hero: "🎯", element: "metal" },
  ENFJ: { hero: "🌟", element: "fire" },   INFJ: { hero: "🔮", element: "water" },
  ENFP: { hero: "🦋", element: "wood" },   INFP: { hero: "🌙", element: "water" },
  ESFJ: { hero: "⚖", element: "earth" },  ISFJ: { hero: "🏰", element: "earth" },
  ESFP: { hero: "🎪", element: "wood" },   ISFP: { hero: "🌊", element: "water" },
};

const HeroIcon = ({ mbti, size = 56, animated = false }) => {
  const hi = HERO_ICONS[mbti]; const el = ELEMENTS[hi.element];
  const [p, setP] = useState(false);
  useEffect(() => { if (!animated) return; const iv = setInterval(() => setP(x => !x), 1500); return () => clearInterval(iv); }, [animated]);
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <div style={{ width: size, height: size, borderRadius: size * 0.22, background: el.bg, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 ${animated && p ? 18 : 8}px ${el.color}55, inset 0 -2px 6px rgba(0,0,0,0.3)`, transition: "box-shadow 1s", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 2, borderRadius: size * 0.18, border: `1px solid ${el.color}66`, background: "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.15) 0%, transparent 60%)" }} />
        <span style={{ fontSize: size * 0.42, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.4))", position: "relative", zIndex: 2 }}>{hi.hero}</span>
        <div style={{ position: "absolute", bottom: -2, right: -2, width: size * 0.36, height: size * 0.36, borderRadius: "50%", background: `linear-gradient(135deg, ${el.grad[0]}, ${el.grad[2]})`, border: "2px solid #0A0E1A", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 6px ${el.color}44`, zIndex: 3 }}>
          <span style={{ fontSize: size * 0.16, fontWeight: 900, color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>{el.ko}</span>
        </div>
      </div>
      {animated && [0, 1, 2].map(i => (
        <span key={i} style={{ position: "absolute", fontSize: size * 0.14, color: el.color, top: ["-4px", "10%", "70%"][i], left: ["80%", "-8px", "90%"][i], opacity: p ? 0.8 : 0.2, transition: "opacity 1.5s" }}>{el.particle}</span>
      ))}
    </div>
  );
};

const MiniIcon = ({ mbti, size = 32 }) => {
  const hi = HERO_ICONS[mbti]; const el = ELEMENTS[hi.element];
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.25, background: el.bg, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 6px ${el.color}33`, position: "relative" }}>
      <span style={{ fontSize: size * 0.5, filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4))" }}>{hi.hero}</span>
      <div style={{ position: "absolute", bottom: -1, right: -1, width: size * 0.38, height: size * 0.38, borderRadius: "50%", background: el.grad[1], border: "1.5px solid #0A0E1A", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: size * 0.18, fontWeight: 900, color: "#fff" }}>{el.ko}</span>
      </div>
    </div>
  );
};

const GROUPS = [
  { id: "navigator", ko: "항해사형", en: "Navigator", code: "NT", color: "#2D8CFF", desc: "직관 × 사고 — 미래를 설계하는 전략가 집단", types: [
    { mbti: "ENTJ", patent: "NT-JE", ko: "혁신적 지휘관", en: "Innovation Commander", summary: "직관과 실행력으로 부의 지형을 바꾸는 리더", identity: "선천적 기질의 날카로움과 후천적 행동의 치밀함을 융합한 독보적 설계자", trajectory: "안정적인 우상향 궤적", compass: "현재 지표가 가리키는 방향은 '확장'" },
    { mbti: "INTJ", patent: "NT-JI", ko: "전략적 탐험가", en: "Strategic Explorer", active: true, summary: "장기적 비전과 완벽한 시스템 통제력을 가진 파운더", identity: "수리적 무결성을 추구하는 냉철한 설계자", trajectory: "복리의 마법을 가장 잘 활용하는 타입", compass: "장기 투자가 정답" },
    { mbti: "ENTP", patent: "NT-PE", ko: "파괴적 개척자", en: "Disruptive Pioneer", summary: "기존 금융의 틀을 깨고 새로운 자산 공식을 만드는 천재", identity: "데이터 너머의 본질을 꿰뚫는 창의적 아키텍처", trajectory: "비선형적 점프 가능성이 매우 높음", compass: "변동성 속에서 부가 극대화" },
    { mbti: "INTP", patent: "NT-PI", ko: "통찰의 설계자", en: "Insight Designer", summary: "보이지 않는 패턴을 읽어내어 조용히 부를 축적하는 전략가", identity: "현상의 이면에 숨겨진 데이터 패턴을 찾아내는 능력이 탁월", trajectory: "딥테크 분야에서 압도적인 성과", compass: "데이터가 당신의 무기" },
  ]},
  { id: "analyst", ko: "분석가형", en: "Analyst", code: "ST", color: "#00D68F", desc: "감각 × 사고 — 데이터로 리스크를 제어하는 집단", types: [
    { mbti: "ESTJ", patent: "ST-JE", ko: "전략적 설계자", en: "Strategic Architect", summary: "원칙과 데이터에 입각하여 리스크 제로에 도전하는 관리자", identity: "철저한 계획과 강력한 통제력으로 자산을 불려나감", trajectory: "예측 가능한 범위 내에서 자산을 극대화", compass: "소득 파이프라인 구축에 최적화된 궤적" },
    { mbti: "ISTJ", patent: "ST-JI", ko: "분석적 수호자", en: "Analytical Guardian", summary: "과거 데이터를 완벽히 분석하여 자산의 누수를 막는 수호자", identity: "리스크를 데이터로 제어하고 시스템의 안정성을 최우선", trajectory: "견고한 계단식 성장", compass: "최적의 타이밍을 신뢰" },
    { mbti: "ESTP", patent: "ST-PE", ko: "실전형 돌파자", en: "Tactical Breaker", summary: "변동성이 큰 시장에서 결정적 타이밍을 잡는 승부사", identity: "급변하는 시장의 흐름을 본능적으로 읽어냄", trajectory: "순간적인 자산 증식 에너지가 강함", compass: "단기적 변곡점 데이터에 주목" },
    { mbti: "ISTP", patent: "ST-PI", ko: "정밀한 관찰자", en: "Precision Observer", summary: "가장 효율적인 수단으로 경제적 이득을 취하는 냉철함", identity: "불필요한 감정 소모 없이 가장 효율적인 경로로 목표에 도달", trajectory: "기술과 재능을 즉각적인 수익화 솔루션으로 치환", compass: "기술 가치가 곧 금융 가치" },
  ]},
  { id: "visionary", ko: "비전가형", en: "Visionary", code: "NF", color: "#FF6B6B", desc: "직관 × 감정 — 가치와 비전으로 부를 창조하는 집단", types: [
    { mbti: "ENFJ", patent: "NF-JE", ko: "이상적 전도사", en: "Visionary Evangelist", summary: "사람과 신용을 자산으로 전환시키는 소셜 매칭의 귀재", identity: "당신의 부는 '사람'과 '신용'에서 시작", trajectory: "네트워크 자산이 막대한 경제적 보상으로 돌아옴", compass: "귀인 매칭 시스템을 적극 활용" },
    { mbti: "INFJ", patent: "NF-JI", ko: "내면의 항해자", en: "Inner Navigator", summary: "남들이 보지 못하는 미래 가치를 선점하는 직관", identity: "시계열 데이터의 흐름을 본능적으로 감지", trajectory: "소수의 집중된 투자로 거대한 성공", compass: "N-Score를 통해 직관을 확신으로" },
    { mbti: "ENFP", patent: "NF-PE", ko: "자유로운 창조자", en: "Free Creator", summary: "위기를 도약의 에너지로 바꾸는 무한한 가능성", identity: "'Scars to Stars' 정신의 표본", trajectory: "예상치 못한 인맥과 기회를 통해 비약적인 자산 증식", compass: "에너지 밸런스 가이드를 통해 판단력을 정교화" },
    { mbti: "INFP", patent: "NF-PI", ko: "감성의 몽상가", en: "Emotional Dreamer", summary: "돈이 가져다주는 근원적 가치와 행복을 설계하는 자", identity: "진정성이 담긴 콘텐츠나 서비스로 승부", trajectory: "대체 불가능한 프리미엄 가치", compass: "자산의 20%를 사회적 미션에 결합할 때 부의 순환" },
  ]},
  { id: "pragmatist", ko: "실용주의형", en: "Pragmatist", code: "SF", color: "#FFD93D", desc: "감각 × 감정 — 관계와 안정 속에서 부를 키우는 집단", types: [
    { mbti: "ESFJ", patent: "SF-JE", ko: "안정의 조율자", en: "Stability Harmonizer", summary: "커뮤니티와 관계망 속에서 부의 기회를 창출하는 타입", identity: "정보의 허브 역할을 하며 시장 동향을 가장 먼저 파악", trajectory: "중개 가치를 창출", compass: "정보의 선점이 곧 부의 원천" },
    { mbti: "ISFJ", patent: "SF-JI", ko: "꾸준한 수호자", en: "Steady Protector", summary: "신뢰를 바탕으로 가장 안정적인 성장을 이루는 방패", identity: "관계의 리스크를 사전에 필터링하는 능력이 탁월", trajectory: "안정형 투자처에서 최적의 승률", compass: "전통적 자산군과 AI 데이터의 결합을 추천" },
    { mbti: "ESFP", patent: "SF-PE", ko: "유연한 실리가", en: "Flexible Realist", summary: "에너지 밸런스와 생체 리듬을 극대화하여 경제 활동력 상승", identity: "순간적인 몰입도와 실행력이 최고조", trajectory: "단기 프로젝트에서 폭발적인 성과", compass: "최상의 컨디션이 최고의 수익률" },
    { mbti: "ISFP", patent: "SF-PI", ko: "신중한 관망자", en: "Cautious Watcher", summary: "시장의 변화에 자연스럽게 부의 흐름을 타는 서퍼", identity: "고정된 틀에 얽매이지 않고 유연하게 이동", trajectory: "스트레스 없는 환경에서 최고의 투자 성과", compass: "추세 추종형 투자에서 독보적인 감각" },
  ]},
];

const N_GRADES = [
  { grade: "N1", label: "Master", min: 90, color: "#FFD700" },
  { grade: "N2", label: "Expert", min: 80, color: "#C0C8D4" },
  { grade: "N3", label: "Advanced", min: 70, color: "#CD7F32" },
  { grade: "N4", label: "Skilled", min: 60, color: "#2D8CFF" },
  { grade: "N5", label: "Growing", min: 50, color: "#00D68F" },
  { grade: "N6", label: "Developing", min: 40, color: "#5AA8FF" },
  { grade: "N7", label: "Emerging", min: 30, color: "#FFD93D" },
  { grade: "N8", label: "Beginning", min: 20, color: "#FF6B6B" },
  { grade: "N9", label: "Seed", min: 0, color: "#6B7280" },
];

const MCC = [
  { code: "6011", name: "금융/ATM", w: 1.5, icon: "🏧" },
  { code: "8299", name: "교육", w: 1.3, icon: "📚" },
  { code: "5912", name: "약국/건강", w: 1.2, icon: "💊" },
  { code: "5411", name: "식료품", w: 1.0, icon: "🛒" },
  { code: "5541", name: "주유", w: 0.9, icon: "⛽" },
  { code: "4121", name: "택시/교통", w: 0.85, icon: "🚕" },
  { code: "5812", name: "외식", w: 0.8, icon: "🍽️" },
  { code: "7011", name: "숙박/여행", w: 0.7, icon: "🏨" },
  { code: "5311", name: "백화점", w: 0.6, icon: "🏬" },
  { code: "5691", name: "의류/쇼핑", w: 0.5, icon: "👔" },
];

const ME = {
  name: "이원재", mbti: "INTJ",
  archetype: { ko: "전략적 탐험가", en: "Strategic Explorer" },
  coreEnergy: { ko: "정밀·원칙형" },
  z0: [0.75, 0.857, 0.0, 0.143],
  fiveEnergy: [
    { ko: "金 Metal", pct: 50, color: "#90A4AE" },
    { ko: "土 Earth", pct: 37, color: "#FFD93D" },
    { ko: "水 Water", pct: 13, color: "#2196F3" },
    { ko: "火 Fire", pct: 0, color: "#FF6B6B" },
    { ko: "木 Wood", pct: 0, color: "#4CAF50" },
  ],
  behavioral: { card: 311, corp: 18, calendar: 47, app: 46, total: 422 },
};

const C = { bg: "#0A0E1A", card: "#111827", border: "#1F2937", text: "#E8ECF4", dim: "#6B7280", accent: "#2D8CFF", green: "#00D68F", gold: "#FFD93D", red: "#FF6B6B" };

export default function LivingProfileOS() {
  const [tab, setTab] = useState(0);
  const [tick, setTick] = useState(0);
  const [pulse, setPulse] = useState(true);
  const [nScore, setNScore] = useState(71.4);
  const [stream, setStream] = useState([]);
  const [bays, setBays] = useState({ ns: 0.62, tf: 0.78, jp: 0.55, ei: 0.41 });
  const [alerts, setAlerts] = useState([]);
  const [expandedType, setExpandedType] = useState(null);
  const cvRef = useRef(null);
  const tabs = ["프로필", "Living OS", "16 아키타입", "리포트", "AI 비서"];

  useEffect(() => {
    const iv = setInterval(() => {
      setTick(p => p + 1); setPulse(p => !p);
      const mcc = MCC[Math.floor(Math.random() * MCC.length)];
      const d = (Math.random() - 0.48) * 0.15 * mcc.w;
      setNScore(p => Math.min(100, Math.max(0, p + d)));
      setBays(p => ({ ns: Math.min(1, Math.max(0, p.ns + (Math.random() - 0.48) * 0.008)), tf: Math.min(1, Math.max(0, p.tf + (Math.random() - 0.48) * 0.006)), jp: Math.min(1, Math.max(0, p.jp + (Math.random() - 0.48) * 0.01)), ei: Math.min(1, Math.max(0, p.ei + (Math.random() - 0.48) * 0.007)) }));
      const srcs = [{ t: "💳", cat: `${mcc.icon} ${mcc.name}` }, { t: "📅", cat: "캘린더" }, { t: "❤️", cat: "생체리듬" }, { t: "📱", cat: "앱활동" }];
      const s = srcs[Math.floor(Math.random() * srcs.length)];
      setStream(prev => [{ ts: new Date().toLocaleTimeString("ko"), ...s, axis: ["N/S","T/F","J/P","E/I"][Math.floor(Math.random()*4)], delta: d.toFixed(4) }, ...prev].slice(0, 12));
      if (Math.random() < 0.07) {
        const as = [{ icon: "⏰", msg: "골든타임 진입: 목·금 경제감각 피크", c: C.gold }, { icon: "📈", msg: "N-Score 3일 연속 상승", c: C.green }, { icon: "⚠️", msg: "외식 지출 22%↑", c: C.red }, { icon: "🧭", msg: "INTJ 항해사: 장기 투자 최적 구간", c: C.accent }];
        const a = as[Math.floor(Math.random() * as.length)];
        setAlerts(prev => [{ ...a, ts: new Date().toLocaleTimeString("ko") }, ...prev].slice(0, 8));
      }
    }, 2500);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const cv = cvRef.current; if (!cv || tab !== 1) return;
    const ctx = cv.getContext("2d"); const W = cv.width = cv.parentElement?.offsetWidth || 340; const H = cv.height = 110;
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = C.accent; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i < W; i++) { const ph = tick * 0.05; const y = H/2 + Math.sin(i*.03+ph)*22*(1-i/W) + Math.cos(i*.07+ph*.7)*10 - Math.sin(i*.01+ph*1.3)*16*(i/W); i===0 ? ctx.moveTo(i,y) : ctx.lineTo(i,y); }
    ctx.stroke();
    ctx.strokeStyle = C.green; ctx.lineWidth = 1; ctx.setLineDash([3,3]); ctx.beginPath();
    for (let i = 0; i < W; i++) { const y = H/2-(i/W)*18+Math.sin(i*.05+tick*.03)*3; i===0?ctx.moveTo(i,y):ctx.lineTo(i,y); }
    ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = C.dim; ctx.font = "9px monospace"; ctx.fillText(`z₀=[${ME.z0.join(",")}]`, 6, 12);
    ctx.fillStyle = C.green; ctx.fillText("97.3% convergence →", W-120, 12);
  }, [tick, tab]);

  const gr = N_GRADES.find(g => nScore >= g.min) || N_GRADES[8];
  const bx = { background: C.card, borderRadius: 12, padding: 14, marginBottom: 10, border: `1px solid ${C.border}` };

  const ProfileTab = () => (
    <div>
      <div style={{ ...bx, textAlign: "center", padding: 24, background: "linear-gradient(135deg,#0f1729,#1a2640)", border: `1px solid ${C.accent}33` }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
          <HeroIcon mbti="INTJ" size={72} animated={true} />
        </div>
        <div style={{ fontSize: 10, color: C.accent, letterSpacing: 3, marginBottom: 4 }}>INTJ · NT-JI · 항해사형</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: C.text }}>전략적 탐험가</div>
        <div style={{ fontSize: 11, color: C.accent, marginTop: 2 }}>Strategic Explorer</div>
        <div style={{ fontSize: 10, color: C.dim, marginTop: 8, lineHeight: 1.5 }}>장기적 비전과 완벽한 시스템 통제력을 가진 파운더</div>
        <div style={{ fontSize: 9, color: ELEMENTS.metal.color, marginTop: 6, fontStyle: "italic" }}>{ELEMENTS.metal.particle} 金 Metal — 수리적 무결성을 추구하는 냉철한 설계자 {ELEMENTS.metal.particle}</div>
      </div>
      <div style={{ ...bx, display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ textAlign: "center", minWidth: 72 }}>
          <div style={{ fontSize: 8, color: C.dim }}>N-Grade</div>
          <div style={{ fontSize: 30, fontWeight: 900, color: gr.color }}>{gr.grade}</div>
          <div style={{ fontSize: 8, color: gr.color }}>{gr.label}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 4 }}>
            <span style={{ color: C.dim }}>N-Score</span>
            <span style={{ color: C.accent, fontWeight: 800, fontFamily: "monospace" }}>{nScore.toFixed(1)}</span>
          </div>
          <div style={{ height: 10, background: C.border, borderRadius: 5 }}>
            <div style={{ height: 10, borderRadius: 5, background: `linear-gradient(90deg, ${C.accent}, ${C.green})`, width: `${nScore}%`, transition: "width 0.8s" }} />
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
        {[{ e: "💰", n: "경제감각", s: 72, c: "#2D8CFF" }, { e: "⚡", n: "표현에너지", s: 38, c: "#5AA8FF" }, { e: "🛡️", n: "위기대응력", s: 94, c: "#00D68F" }].map((m, i) => (
          <div key={i} style={{ background: C.card, borderRadius: 10, padding: 10, textAlign: "center", border: `1px solid ${m.c}33` }}>
            <div style={{ fontSize: 16 }}>{m.e}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: m.c }}>{m.s}</div>
            <div style={{ fontSize: 8, color: C.dim }}>{m.n}</div>
          </div>
        ))}
      </div>
      <div style={bx}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.text, marginBottom: 8 }}>5-Energy</div>
        <div style={{ display: "flex", gap: 3, height: 26, borderRadius: 6, overflow: "hidden" }}>
          {ME.fiveEnergy.filter(e => e.pct > 0).map((e, i) => (
            <div key={i} style={{ flex: e.pct, background: e.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 8, color: "#000", fontWeight: 800 }}>{e.ko.split(" ")[0]} {e.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const LivingTab = () => (
    <div>
      <div style={{ ...bx, border: `1px solid ${C.accent}44` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><div style={{ fontSize: 13, fontWeight: 900, color: C.accent }}>LIVING PROFILE OS</div><div style={{ fontSize: 9, color: C.dim }}>{ME.behavioral.total}건 학습 · Tick #{tick}</div></div>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: pulse ? C.green : "#333", boxShadow: pulse ? `0 0 6px ${C.green}` : "none" }} />
        </div>
      </div>
      <div style={bx}><div style={{ fontSize: 10, color: C.accent, fontWeight: 700, marginBottom: 4 }}>Neural CDE 궤적</div><div style={{ background: "#050810", borderRadius: 8, padding: 4 }}><canvas ref={cvRef} style={{ width: "100%", height: 110 }} /></div></div>
      <div style={bx}>
        <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, marginBottom: 6 }}>베이지안 사후확률</div>
        {[{ axis: "N/S", val: bays.ns, pos: "직관(N)" }, { axis: "T/F", val: bays.tf, pos: "사고(T)" }, { axis: "J/P", val: bays.jp, pos: "계획(J)" }, { axis: "E/I", val: bays.ei, pos: "외향(E)" }].map((a, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, marginBottom: 2 }}>
              <span style={{ color: C.text, fontWeight: 600 }}>{a.axis}</span>
              <span style={{ color: C.accent, fontFamily: "monospace" }}>{a.val.toFixed(3)}</span>
            </div>
            <div style={{ height: 5, background: C.border, borderRadius: 3 }}><div style={{ height: 5, borderRadius: 3, background: C.accent, width: `${a.val*100}%`, transition: "width 0.5s" }} /></div>
          </div>
        ))}
      </div>
      <div style={bx}>
        <div style={{ fontSize: 10, color: C.green, fontWeight: 700, marginBottom: 4 }}>📡 데이터 스트림</div>
        <div style={{ background: "#050810", borderRadius: 6, padding: 6, fontFamily: "monospace", fontSize: 8, maxHeight: 120, overflow: "hidden" }}>
          {stream.length === 0 ? <div style={{ color: C.dim }}>수신 대기...</div> : stream.map((d, i) => (
            <div key={i} style={{ color: i === 0 ? C.green : C.dim, marginBottom: 1 }}>[{d.ts}] {d.t} {d.cat} <span style={{ color: parseFloat(d.delta) >= 0 ? C.green : C.red }}>{d.axis} {parseFloat(d.delta) >= 0 ? "+" : ""}{d.delta}</span></div>
          ))}
        </div>
      </div>
    </div>
  );

  const ArchetypeTab = () => (
    <div>
      <div style={{ ...bx, border: `1px solid ${C.accent}22` }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, marginBottom: 8, textAlign: "center" }}>16 금융 DNA 히어로 · 5-Energy × 아키타입</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {GROUPS.flatMap(g => g.types.map(t => {
            const isMe = t.active;
            return (
              <div key={t.mbti} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: 6, borderRadius: 10, background: isMe ? `${g.color}15` : "transparent", border: isMe ? `2px solid ${g.color}` : `1px solid ${C.border}` }}>
                <MiniIcon mbti={t.mbti} size={36} />
                <div style={{ fontSize: 8, fontWeight: isMe ? 800 : 600, color: isMe ? g.color : C.dim }}>{t.mbti}</div>
                <div style={{ fontSize: 7, color: C.dim, textAlign: "center", lineHeight: 1.2 }}>{t.ko}</div>
                {isMe && <div style={{ fontSize: 6, color: g.color, fontWeight: 800 }}>YOU</div>}
              </div>
            );
          }))}
        </div>
      </div>
      {GROUPS.map(g => (
        <div key={g.id} style={{ ...bx, borderLeft: `3px solid ${g.color}`, padding: 12 }}>
          <div style={{ marginBottom: 8 }}><span style={{ fontSize: 13, fontWeight: 800, color: g.color }}>{g.ko}</span><span style={{ fontSize: 10, color: C.dim, marginLeft: 6 }}>{g.en}</span></div>
          <div style={{ fontSize: 9, color: C.dim, marginBottom: 8 }}>{g.desc}</div>
          {g.types.map(t => {
            const isMe = t.active; const isExp = expandedType === t.mbti; const hi = HERO_ICONS[t.mbti]; const el = ELEMENTS[hi.element];
            return (
              <div key={t.mbti} onClick={() => setExpandedType(isExp ? null : t.mbti)} style={{ padding: "10px 12px", marginBottom: 4, borderRadius: 10, cursor: "pointer", background: isMe ? `${g.color}12` : "#0A0E1A", border: isMe ? `2px solid ${g.color}` : `1px solid ${C.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <MiniIcon mbti={t.mbti} size={38} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: isMe ? 800 : 600, color: isMe ? g.color : C.text }}>
                      {t.ko} {isMe && <span style={{ fontSize: 8, background: g.color, color: "#fff", padding: "1px 6px", borderRadius: 4, marginLeft: 4 }}>YOU</span>}
                    </div>
                    <div style={{ fontSize: 8, color: C.dim }}>{t.en} · {t.mbti} · <span style={{ color: el.color }}>{el.particle}{el.ko}</span></div>
                  </div>
                  <span style={{ fontSize: 10, color: C.dim }}>{isExp ? "▲" : "▼"}</span>
                </div>
                {isExp && (
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 10, color: C.text, marginBottom: 6, lineHeight: 1.5 }}>{t.summary}</div>
                    {[{ label: "정체성", value: t.identity, c: C.accent }, { label: "궤적", value: t.trajectory, c: C.green }, { label: "나침반", value: t.compass, c: C.gold }, { label: "엘리먼트", value: `${el.ko} ${el.en} — ${el.particle}`, c: el.color }].map((f, fi) => (
                      <div key={fi} style={{ fontSize: 9, marginBottom: 4 }}><span style={{ color: f.c, fontWeight: 700 }}>{f.label}:</span> <span style={{ color: C.text }}>{f.value}</span></div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );

  const ReportTab = () => (
    <div>
      <div style={{ ...bx, border: `1px solid ${C.accent}33` }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: C.accent, marginBottom: 8 }}>📊 주간 브리프</div>
        <div style={{ background: "#0A0E1A", borderRadius: 8, padding: 10 }}>
          {[{ l: "N-Score", v: "+2.3pt", c: C.green }, { l: "골든타임", v: "목·금 피크", c: C.gold }, { l: "지출 패턴", v: "외식↑22%", c: C.accent }, { l: "AI 제안", v: "리밸런싱 검토", c: C.green }].map((r, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 9, padding: "3px 0", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ color: C.dim }}>{r.l}</span><span style={{ color: r.c, fontWeight: 600 }}>{r.v}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={bx}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.text, marginBottom: 8 }}>공유</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
          {[{ i: "💬", l: "카카오톡" }, { i: "📧", l: "이메일" }, { i: "💾", l: "PDF" }].map((b, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: 10, background: "#0A0E1A", borderRadius: 8, border: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 18 }}>{b.i}</span><span style={{ fontSize: 9, color: C.text }}>{b.l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const AITab = () => (
    <div>
      <div style={{ ...bx, border: `1px solid ${C.green}33` }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: C.green, marginBottom: 8 }}>🤖 AI 비서 ({alerts.length}건)</div>
        {alerts.length === 0 ? <div style={{ textAlign: "center", padding: 20, fontSize: 10, color: C.dim }}>⏳ 패턴 분석 중...</div> : alerts.map((a, i) => (
          <div key={i} style={{ display: "flex", gap: 8, padding: "8px 10px", marginBottom: 4, background: `${a.c}08`, borderRadius: 8, border: `1px solid ${a.c}22` }}>
            <span style={{ fontSize: 16 }}>{a.icon}</span>
            <div style={{ flex: 1 }}><div style={{ fontSize: 10, color: a.c, fontWeight: 600 }}>{a.msg}</div><div style={{ fontSize: 8, color: C.dim }}>{a.ts}</div></div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ background: C.bg, minHeight: "100vh", maxWidth: 420, margin: "0 auto", fontFamily: "-apple-system,sans-serif", color: C.text }}>
      <div style={{ padding: "14px 16px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <HeroIcon mbti="INTJ" size={48} animated={true} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 800 }}>{ME.name} <span style={{ fontSize: 9, color: C.accent, padding: "1px 5px", background: `${C.accent}15`, borderRadius: 4 }}>INTJ 항해사</span></div>
            <div style={{ fontSize: 9, color: C.dim }}>전략적 탐험가 · <span style={{ color: gr.color }}>{gr.grade}</span> · {nScore.toFixed(1)}</div>
          </div>
        </div>
        <div style={{ width: 8, height: 8, borderRadius: 4, background: pulse ? C.green : "#333", boxShadow: pulse ? `0 0 6px ${C.green}` : "none" }} />
      </div>
      <div style={{ display: "flex", padding: "10px 16px 6px", gap: 3, overflowX: "auto" }}>
        {tabs.map((n, i) => (
          <button key={i} onClick={() => setTab(i)} style={{ padding: "7px 10px", borderRadius: 8, fontSize: 10, fontWeight: 600, whiteSpace: "nowrap", cursor: "pointer", background: tab === i ? C.accent : "transparent", color: tab === i ? "#fff" : C.dim, border: tab === i ? "none" : `1px solid ${C.border}` }}>
            {n}{i === 4 && alerts.length > 0 && <span style={{ marginLeft: 4, background: C.red, color: "#fff", borderRadius: 8, padding: "1px 5px", fontSize: 8 }}>{alerts.length}</span>}
          </button>
        ))}
      </div>
      <div style={{ padding: "0 16px 16px" }}>
        {tab === 0 && <ProfileTab />}
        {tab === 1 && <LivingTab />}
        {tab === 2 && <ArchetypeTab />}
        {tab === 3 && <ReportTab />}
        {tab === 4 && <AITab />}
      </div>
      <div style={{ textAlign: "center", padding: "4px 16px 16px", fontSize: 8, color: C.dim }}>P25KAI001KR · 뉴린카이로스AI(주) · © 2026</div>
    </div>
  );
}
