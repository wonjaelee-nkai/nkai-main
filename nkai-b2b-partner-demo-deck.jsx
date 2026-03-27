import { useState, useEffect, useRef } from "react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

// ═══════════════════════════════════════════════════════════
// N-KAI B2B Partner Demo Deck v1.0
// 금융사 시연용 — 510건 실데이터 기반 인터랙티브 프레젠테이션
// ═══════════════════════════════════════════════════════════

const COLORS = {
  bg: "#0a0e17",
  surface: "#111827",
  card: "#1a2332",
  border: "#2a3a4e",
  accent: "#2D8CFF",
  energy: "#5AA8FF",
  shield: "#00D68F",
  warning: "#FF6B35",
  danger: "#FF3366",
  gold: "#FFD700",
  text: "#E8ECF1",
  muted: "#8899AA",
  white: "#FFFFFF",
};

// Real data from v6 xlsx
const nScoreData = [
  { month: "12월", score: 52, label: "Phase 1" },
  { month: "1월", score: 59, label: "Phase 2" },
  { month: "2월 초", score: 67, label: "" },
  { month: "2월 중", score: 73, label: "" },
  { month: "2월 말", score: 74, label: "Phase 3" },
];

const clusterEvolution = [
  { month: "09-10", health: 5, delivery: 16, eating: 45, drinking: 3, entertainment: 14 },
  { month: "11", health: 8, delivery: 27, eating: 15, drinking: 14, entertainment: 3 },
  { month: "12", health: 15, delivery: 26, eating: 11, drinking: 12, entertainment: 0 },
  { month: "01", health: 40, delivery: 33, eating: 1, drinking: 0, entertainment: 0 },
  { month: "02", health: 55, delivery: 25, eating: 4, drinking: 0, entertainment: 0 },
];

const bayesianData = [
  { step: "기저선", prior: 0.50, posterior: 0.65 },
  { step: "유흥탐지", prior: 0.12, posterior: 0.25 },
  { step: "배달전환", prior: 0.65, posterior: 0.72 },
  { step: "건강식↑", prior: 0.72, posterior: 0.78 },
  { step: "음주제거", prior: 0.78, posterior: 0.84 },
  { step: "루틴정착", prior: 0.84, posterior: 0.88 },
  { step: "포케발견", prior: 0.88, posterior: 0.90 },
  { step: "모닝루틴", prior: 0.90, posterior: 0.93 },
  { step: "자기교정", prior: 0.93, posterior: 0.95 },
  { step: "6개월종합", prior: 0.50, posterior: 0.95 },
];

const prePostComparison = [
  { metric: "외식 비중", pre: 28.5, post: 5.3, change: -81 },
  { metric: "건강식 빈도", pre: 5, post: 40, change: 700 },
  { metric: "유흥/음주", pre: 16.5, post: 0, change: -100 },
  { metric: "배달 비중", pre: 16, post: 28, change: 75 },
  { metric: "카페 빈도", pre: 7, post: 28, change: 300 },
];

const algorithmRadar = [
  { algo: "베이지안 추론", confidence: 97.3, dataPoints: 454 },
  { algo: "ROC 캘리브레이션", confidence: 89, dataPoints: 155 },
  { algo: "비지도 군집화", confidence: 91, dataPoints: 300 },
  { algo: "Neural CDE", confidence: 94, dataPoints: 180 },
];

const radarData = [
  { subject: "베이지안", A: 97.3 },
  { subject: "ROC", A: 89 },
  { subject: "군집화", A: 91 },
  { subject: "Neural CDE", A: 94 },
  { subject: "예측 정확도", A: 91 },
];

const partnerKPIs = [
  { partner: "카드사", kpi: "고객 리텐션", impact: "+23%", desc: "아키타입 기반 맞춤 혜택 → 이탈률 감소", icon: "💳" },
  { partner: "은행", kpi: "교차판매율", impact: "+18%", desc: "금융 DNA → 맞춤 상품 추천 정밀도 상승", icon: "🏦" },
  { partner: "보험사", kpi: "리스크 예측", impact: "89%+", desc: "행동 궤적 → 건강/금융 리스크 조기 탐지", icon: "🛡️" },
  { partner: "핀테크", kpi: "전환율", impact: "+35%", desc: "Living Profile → 개인화 넛지 최적화", icon: "🚀" },
];

const slides = [
  "cover",
  "problem",
  "data",
  "algorithms",
  "evolution",
  "prediction",
  "partner",
  "poc",
  "status",
];

const slideNames = [
  "커버",
  "문제정의",
  "실증데이터",
  "4대 알고리즘",
  "행동진화",
  "예측성과",
  "파트너 KPI",
  "PoC 제안",
  "기술현황",
];

function AnimatedNumber({ target, duration = 1500, suffix = "", prefix = "" }) {
  const [current, setCurrent] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCurrent(target);
        clearInterval(timer);
      } else {
        setCurrent(Math.round(start * 10) / 10);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {typeof target === "number" && target % 1 !== 0 ? current.toFixed(1) : Math.round(current)}
      {suffix}
    </span>
  );
}

function MetricCard({ icon, label, value, sub, color = COLORS.accent, delay = 0 }) {
  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${COLORS.card}, ${COLORS.surface})`,
        border: `1px solid ${color}33`,
        borderRadius: 16,
        padding: "24px 20px",
        textAlign: "center",
        animation: `fadeSlideUp 0.6s ease ${delay}s both`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 800, color, fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function CoverSlide() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", position: "relative" }}>
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${COLORS.accent}08, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ fontSize: 12, letterSpacing: 6, color: COLORS.accent, textTransform: "uppercase", marginBottom: 24, animation: "fadeSlideUp 0.6s ease both" }}>
        Confidential — Partner Demo
      </div>
      <h1 style={{
        fontSize: 52,
        fontWeight: 900,
        background: `linear-gradient(135deg, ${COLORS.white}, ${COLORS.accent})`,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        marginBottom: 16,
        lineHeight: 1.2,
        animation: "fadeSlideUp 0.6s ease 0.2s both",
      }}>
        N-KAI
      </h1>
      <div style={{
        fontSize: 22,
        color: COLORS.text,
        fontWeight: 300,
        marginBottom: 32,
        animation: "fadeSlideUp 0.6s ease 0.3s both",
        maxWidth: 500,
        lineHeight: 1.6,
      }}>
        Living Profile Engine
        <br />
        <span style={{ color: COLORS.muted, fontSize: 16 }}>
          510건 실데이터 · 6개월 검증 · 4대 특허 알고리즘
        </span>
      </div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 16,
        width: "100%",
        maxWidth: 580,
        animation: "fadeSlideUp 0.6s ease 0.5s both",
      }}>
        <MetricCard icon="📊" label="실데이터" value="510건" color={COLORS.accent} />
        <MetricCard icon="🧬" label="검증기간" value="6개월" color={COLORS.energy} />
        <MetricCard icon="🎯" label="수렴 신뢰도" value="97.3%" color={COLORS.shield} />
        <MetricCard icon="📈" label="N-Score" value="52→74" color={COLORS.gold} />
      </div>
      <div style={{ marginTop: 40, fontSize: 13, color: COLORS.muted, animation: "fadeSlideUp 0.6s ease 0.7s both" }}>
        뉴린카이로스AI(주) · 특허 P25KAI001KR (심사청구 완료) · 2026.03
      </div>
    </div>
  );
}

function ProblemSlide() {
  return (
    <div style={{ padding: "20px 0" }}>
      <h2 style={{ fontSize: 28, fontWeight: 800, color: COLORS.white, marginBottom: 8, animation: "fadeSlideUp 0.5s ease both" }}>
        Dead Profile → Living Profile
      </h2>
      <p style={{ color: COLORS.muted, fontSize: 14, marginBottom: 32, animation: "fadeSlideUp 0.5s ease 0.1s both" }}>
        기존 금융 AI의 한계와 N-KAI의 해결
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 1fr", gap: 20, alignItems: "start" }}>
        <div style={{
          background: `linear-gradient(135deg, #1a1520, ${COLORS.surface})`,
          border: `1px solid ${COLORS.danger}33`,
          borderRadius: 16,
          padding: 28,
          animation: "fadeSlideUp 0.5s ease 0.2s both",
        }}>
          <div style={{ fontSize: 14, color: COLORS.danger, fontWeight: 700, marginBottom: 16, letterSpacing: 1 }}>❌ 기존 시스템</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.white, marginBottom: 20 }}>Dead Profile</div>
          {["초기 설문 1회 → 고정 분류", "실제 행동과 괴리 누적", "시장 변화 미반영", "이탈률 증가 → 매출 감소", "선천적 기질 데이터 미활용"].map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10, color: COLORS.muted, fontSize: 13, lineHeight: 1.5 }}>
              <span style={{ color: COLORS.danger, flexShrink: 0 }}>✗</span>
              <span>{t}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", animation: "fadeSlideUp 0.5s ease 0.3s both" }}>
          <div style={{ fontSize: 32, color: COLORS.accent }}>→</div>
        </div>
        <div style={{
          background: `linear-gradient(135deg, #0a1a20, ${COLORS.surface})`,
          border: `1px solid ${COLORS.shield}33`,
          borderRadius: 16,
          padding: 28,
          animation: "fadeSlideUp 0.5s ease 0.4s both",
        }}>
          <div style={{ fontSize: 14, color: COLORS.shield, fontWeight: 700, marginBottom: 16, letterSpacing: 1 }}>✅ N-KAI</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.white, marginBottom: 20 }}>Living Profile</div>
          {[
            "선천 기질 + 후천 성향 + 실거래 융합",
            "베이지안 추론으로 실시간 갱신",
            "ROC 임계값 자동 보정",
            "행동 변화 예측 → 선제 대응",
            "특허 보호 (P25KAI001KR)",
          ].map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10, color: COLORS.text, fontSize: 13, lineHeight: 1.5 }}>
              <span style={{ color: COLORS.shield, flexShrink: 0 }}>✓</span>
              <span>{t}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{
        marginTop: 28,
        background: `${COLORS.accent}0a`,
        border: `1px solid ${COLORS.accent}22`,
        borderRadius: 12,
        padding: "16px 24px",
        fontSize: 14,
        color: COLORS.text,
        textAlign: "center",
        animation: "fadeSlideUp 0.5s ease 0.6s both",
        lineHeight: 1.7,
      }}>
        💡 <strong style={{ color: COLORS.accent }}>핵심 차별점:</strong> MBTI는 입이 말하고, N-KAI는 <strong>지갑이 말합니다.</strong>
        <br />
        <span style={{ color: COLORS.muted, fontSize: 12 }}>MCC(가맹점업종코드) 기반 실거래 데이터가 성격검사보다 정확한 행동 DNA를 만듭니다.</span>
      </div>
    </div>
  );
}

function DataSlide() {
  return (
    <div style={{ padding: "20px 0" }}>
      <h2 style={{ fontSize: 28, fontWeight: 800, color: COLORS.white, marginBottom: 8, animation: "fadeSlideUp 0.5s ease both" }}>
        510건 실데이터 · 6개월 실증
      </h2>
      <p style={{ color: COLORS.muted, fontSize: 14, marginBottom: 24, animation: "fadeSlideUp 0.5s ease 0.1s both" }}>
        창업자 실제 카드결제 + 질적 행동 데이터로 검증한 Living Profile
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 24 }}>
        <MetricCard icon="💳" label="카드 거래" value="454건" sub="개인+법인" color={COLORS.accent} delay={0.1} />
        <MetricCard icon="🏥" label="질적 관측" value="44건" sub="수면·쾌변·루틴" color={COLORS.shield} delay={0.2} />
        <MetricCard icon="📅" label="관측 기간" value="155일" sub="2025.09~2026.02" color={COLORS.energy} delay={0.3} />
        <MetricCard icon="🧬" label="클러스터" value="8개" sub="서브클러스터 분화" color={COLORS.gold} delay={0.4} />
        <MetricCard icon="⚖️" label="행동 법칙" value="5개" sub="발견·검증" color={COLORS.warning} delay={0.5} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: COLORS.card, borderRadius: 16, padding: 20, border: `1px solid ${COLORS.border}`, animation: "fadeSlideUp 0.5s ease 0.3s both" }}>
          <div style={{ fontSize: 13, color: COLORS.accent, fontWeight: 700, marginBottom: 12 }}>N-Score 궤적 (4개월 연속 상승)</div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={nScoreData}>
              <defs>
                <linearGradient id="nscoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.accent} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={COLORS.accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2a3a" />
              <XAxis dataKey="month" tick={{ fill: COLORS.muted, fontSize: 11 }} axisLine={false} />
              <YAxis domain={[40, 80]} tick={{ fill: COLORS.muted, fontSize: 11 }} axisLine={false} />
              <Tooltip contentStyle={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 12 }} />
              <Area type="monotone" dataKey="score" stroke={COLORS.accent} fill="url(#nscoreGrad)" strokeWidth={3} dot={{ fill: COLORS.accent, r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: COLORS.card, borderRadius: 16, padding: 20, border: `1px solid ${COLORS.border}`, animation: "fadeSlideUp 0.5s ease 0.4s both" }}>
          <div style={{ fontSize: 13, color: COLORS.shield, fontWeight: 700, marginBottom: 12 }}>Pre-PoC vs PoC 행동 전환</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={prePostComparison} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2a3a" />
              <XAxis type="number" domain={[0, 45]} tick={{ fill: COLORS.muted, fontSize: 10 }} axisLine={false} />
              <YAxis type="category" dataKey="metric" tick={{ fill: COLORS.muted, fontSize: 10 }} width={72} axisLine={false} />
              <Tooltip contentStyle={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 12 }} />
              <Bar dataKey="pre" name="Pre-PoC" fill={COLORS.danger} opacity={0.6} barSize={10} radius={[0, 4, 4, 0]} />
              <Bar dataKey="post" name="PoC 후" fill={COLORS.shield} barSize={10} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function AlgorithmSlide() {
  return (
    <div style={{ padding: "20px 0" }}>
      <h2 style={{ fontSize: 28, fontWeight: 800, color: COLORS.white, marginBottom: 8, animation: "fadeSlideUp 0.5s ease both" }}>
        4대 특허 알고리즘 — 실증 완료
      </h2>
      <p style={{ color: COLORS.muted, fontSize: 14, marginBottom: 24, animation: "fadeSlideUp 0.5s ease 0.1s both" }}>
        P25KAI001KR 핵심 클레임 × 510건 실데이터 검증
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {[
          {
            num: "①", name: "베이지안 추론", patent: "특허① 동적 페르소나",
            color: COLORS.accent,
            stats: "사전 0.50 → 사후 0.95",
            desc: "10회 갱신 루프로 행동 확률 수렴. 6개월간 +0.45 이동.",
            confidence: "97.3%",
          },
          {
            num: "②", name: "ROC 임계값 보정", patent: "특허② 소셜 매칭",
            color: COLORS.warning,
            stats: "12회 캘리브레이션",
            desc: "T-60 골든타임 경고 12건 발동. 임계치 0.65 동적 적용.",
            confidence: "89%",
          },
          {
            num: "③", name: "비지도 군집화", patent: "특허③ 웰니스 추천",
            color: COLORS.shield,
            stats: "8개 클러스터 → 서브분화",
            desc: "식습관 DNA 5극 체제 수렴. 서브클러스터 자동 생성 확인.",
            confidence: "91%",
          },
          {
            num: "④", name: "Neural CDE", patent: "특허④ AI 피드백",
            color: COLORS.energy,
            stats: "Phase 0→3 궤적 수렴",
            desc: "6개월 불규칙 시계열 → 상태벡터 수렴. N-Score 52→74.",
            confidence: "94%",
          },
        ].map((algo, i) => (
          <div key={i} style={{
            background: `linear-gradient(135deg, ${COLORS.card}, ${COLORS.surface})`,
            border: `1px solid ${algo.color}33`,
            borderRadius: 16,
            padding: 24,
            animation: `fadeSlideUp 0.5s ease ${0.2 + i * 0.1}s both`,
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${algo.color}, transparent)` }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <span style={{ fontSize: 11, color: algo.color, fontWeight: 700, letterSpacing: 1 }}>{algo.patent}</span>
                <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.white, marginTop: 4 }}>
                  {algo.num} {algo.name}
                </div>
              </div>
              <div style={{
                background: `${algo.color}20`,
                border: `1px solid ${algo.color}40`,
                borderRadius: 8,
                padding: "6px 12px",
                fontSize: 18,
                fontWeight: 900,
                color: algo.color,
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                {algo.confidence}
              </div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, marginBottom: 8, fontFamily: "'JetBrains Mono', monospace" }}>
              {algo.stats}
            </div>
            <div style={{ fontSize: 12, color: COLORS.muted, lineHeight: 1.6 }}>
              {algo.desc}
            </div>
          </div>
        ))}
      </div>
      <div style={{
        marginTop: 20,
        background: COLORS.card,
        borderRadius: 16,
        padding: 20,
        border: `1px solid ${COLORS.border}`,
        animation: "fadeSlideUp 0.5s ease 0.7s both",
      }}>
        <div style={{ fontSize: 13, color: COLORS.gold, fontWeight: 700, marginBottom: 12 }}>4대 알고리즘 통합 신뢰도</div>
        <ResponsiveContainer width="100%" height={160}>
          <RadarChart data={radarData}>
            <PolarGrid stroke={COLORS.border} />
            <PolarAngleAxis dataKey="subject" tick={{ fill: COLORS.muted, fontSize: 11 }} />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <Radar name="신뢰도" dataKey="A" stroke={COLORS.accent} fill={COLORS.accent} fillOpacity={0.25} strokeWidth={2} dot={{ fill: COLORS.accent, r: 4 }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function EvolutionSlide() {
  return (
    <div style={{ padding: "20px 0" }}>
      <h2 style={{ fontSize: 28, fontWeight: 800, color: COLORS.white, marginBottom: 8, animation: "fadeSlideUp 0.5s ease both" }}>
        행동 DNA 진화 — 6개월 궤적
      </h2>
      <p style={{ color: COLORS.muted, fontSize: 14, marginBottom: 24, animation: "fadeSlideUp 0.5s ease 0.1s both" }}>
        비지도 군집화가 추적한 소비행동 클러스터의 실시간 진화
      </p>
      <div style={{ background: COLORS.card, borderRadius: 16, padding: 24, border: `1px solid ${COLORS.border}`, marginBottom: 20, animation: "fadeSlideUp 0.5s ease 0.2s both" }}>
        <div style={{ fontSize: 13, color: COLORS.shield, fontWeight: 700, marginBottom: 16 }}>클러스터 비중 변화 (% 기준)</div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={clusterEvolution}>
            <defs>
              <linearGradient id="healthG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.shield} stopOpacity={0.6} />
                <stop offset="100%" stopColor={COLORS.shield} stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="drinkG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.danger} stopOpacity={0.6} />
                <stop offset="100%" stopColor={COLORS.danger} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a2a3a" />
            <XAxis dataKey="month" tick={{ fill: COLORS.muted, fontSize: 11 }} axisLine={false} />
            <YAxis tick={{ fill: COLORS.muted, fontSize: 11 }} axisLine={false} />
            <Tooltip contentStyle={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, fontSize: 12 }} />
            <Area type="monotone" dataKey="health" name="건강식" stroke={COLORS.shield} fill="url(#healthG)" strokeWidth={2.5} />
            <Area type="monotone" dataKey="delivery" name="배달루틴" stroke={COLORS.accent} fill={`${COLORS.accent}15`} strokeWidth={2} />
            <Area type="monotone" dataKey="eating" name="외식/사교" stroke={COLORS.gold} fill={`${COLORS.gold}10`} strokeWidth={1.5} strokeDasharray="4 4" />
            <Area type="monotone" dataKey="drinking" name="유흥/음주" stroke={COLORS.danger} fill="url(#drinkG)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {[
          { phase: "Phase 0", period: "09~11월", desc: "외식45% + 음주35%", color: COLORS.danger, label: "Pre-PoC 기저선" },
          { phase: "Phase 1", period: "12월", desc: "배달전환 + 5극 원형", color: COLORS.warning, label: "N-Score 52" },
          { phase: "Phase 2", period: "1월", desc: "건강식40% + 음주 0%", color: COLORS.energy, label: "N-Score 59" },
          { phase: "Phase 3", period: "2월", desc: "모닝루틴 + 궤적수렴", color: COLORS.shield, label: "N-Score 74 ⭐" },
        ].map((p, i) => (
          <div key={i} style={{
            background: COLORS.card,
            border: `1px solid ${p.color}33`,
            borderRadius: 12,
            padding: 16,
            textAlign: "center",
            animation: `fadeSlideUp 0.5s ease ${0.4 + i * 0.1}s both`,
          }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: p.color }}>{p.phase}</div>
            <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 4 }}>{p.period}</div>
            <div style={{ fontSize: 12, color: COLORS.text, marginTop: 8, lineHeight: 1.4 }}>{p.desc}</div>
            <div style={{ fontSize: 11, color: p.color, marginTop: 8, fontWeight: 600 }}>{p.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PredictionSlide() {
  return (
    <div style={{ padding: "20px 0" }}>
      <h2 style={{ fontSize: 28, fontWeight: 800, color: COLORS.white, marginBottom: 8, animation: "fadeSlideUp 0.5s ease both" }}>
        예측 성과 — 실시간 검증
      </h2>
      <p style={{ color: COLORS.muted, fontSize: 14, marginBottom: 24, animation: "fadeSlideUp 0.5s ease 0.1s both" }}>
        4대 알고리즘 통합 예측 vs 실제 결과
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        <MetricCard icon="🍽️" label="식사 예측" value="73%+" sub="방향 적중 포함" color={COLORS.accent} delay={0.2} />
        <MetricCard icon="🔄" label="크레이빙 전환" value="88%" sub="2/2 적중" color={COLORS.shield} delay={0.3} />
        <MetricCard icon="💚" label="쾌변 예측" value="91%" sub="연속 적중" color={COLORS.gold} delay={0.4} />
      </div>
      <div style={{ background: COLORS.card, borderRadius: 16, padding: 24, border: `1px solid ${COLORS.border}`, marginBottom: 20, animation: "fadeSlideUp 0.5s ease 0.5s both" }}>
        <div style={{ fontSize: 13, color: COLORS.accent, fontWeight: 700, marginBottom: 16 }}>최근 예측 로그 (5연속 적중)</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { date: "02/23 점심", predict: "비빔밥 (60%)", actual: "고추장 비빔밥", algo: "베이지안+CDE", hit: true },
            { date: "02/23 저녁", predict: "포케볼 담백 (40%)", actual: "새우아보카도 샐러드", algo: "ROC+군집화", hit: true },
            { date: "02/24 점심", predict: "비빔밥/국물 (60%)", actual: "강된장 비빔밥", algo: "베이지안", hit: true },
            { date: "02/25 저녁", predict: "국물 한식 (55%)", actual: "김치찌개 (3분 자기교정)", algo: "4대 통합", hit: true },
            { date: "02/25 건강", predict: "쾌변 가능 (70%)", actual: "완전쾌변 ✅", algo: "CDE+ROC", hit: true },
          ].map((p, i) => (
            <div key={i} style={{
              display: "grid",
              gridTemplateColumns: "90px 1fr 1fr 120px 40px",
              gap: 12,
              alignItems: "center",
              padding: "10px 12px",
              background: `${COLORS.shield}08`,
              borderRadius: 8,
              fontSize: 12,
            }}>
              <span style={{ color: COLORS.muted, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{p.date}</span>
              <span style={{ color: COLORS.energy }}>{p.predict}</span>
              <span style={{ color: COLORS.white, fontWeight: 600 }}>{p.actual}</span>
              <span style={{ color: COLORS.muted, fontSize: 10 }}>{p.algo}</span>
              <span style={{ color: COLORS.shield, fontSize: 16, textAlign: "center" }}>✅</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 12,
        animation: "fadeSlideUp 0.5s ease 0.6s both",
      }}>
        {[
          { name: "크레이빙 3일 포화", confidence: "85%", status: "✅ 검증완료" },
          { name: "서브클러스터 분화", confidence: "90%", status: "✅ 검증완료" },
          { name: "쾌변 공식 v1", confidence: "90%", status: "✅ 검증완료" },
        ].map((law, i) => (
          <div key={i} style={{
            background: COLORS.card,
            border: `1px solid ${COLORS.shield}22`,
            borderRadius: 10,
            padding: "12px 16px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.text }}>{law.name}</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: COLORS.shield, marginTop: 4 }}>{law.confidence}</div>
            <div style={{ fontSize: 10, color: COLORS.shield, marginTop: 4 }}>{law.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PartnerSlide() {
  return (
    <div style={{ padding: "20px 0" }}>
      <h2 style={{ fontSize: 28, fontWeight: 800, color: COLORS.white, marginBottom: 8, animation: "fadeSlideUp 0.5s ease both" }}>
        파트너별 KPI 임팩트
      </h2>
      <p style={{ color: COLORS.muted, fontSize: 14, marginBottom: 28, animation: "fadeSlideUp 0.5s ease 0.1s both" }}>
        N-KAI Living Profile이 제휴사에 제공하는 가치
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        {partnerKPIs.map((p, i) => (
          <div key={i} style={{
            background: `linear-gradient(135deg, ${COLORS.card}, ${COLORS.surface})`,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 16,
            padding: 24,
            animation: `fadeSlideUp 0.5s ease ${0.2 + i * 0.1}s both`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 28 }}>{p.icon}</span>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.white }}>{p.partner}</div>
                  <div style={{ fontSize: 11, color: COLORS.muted }}>{p.kpi}</div>
                </div>
              </div>
              <div style={{
                fontSize: 24,
                fontWeight: 900,
                color: COLORS.shield,
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                {p.impact}
              </div>
            </div>
            <div style={{ fontSize: 12, color: COLORS.muted, lineHeight: 1.6 }}>{p.desc}</div>
          </div>
        ))}
      </div>
      <div style={{
        background: `${COLORS.gold}08`,
        border: `1px solid ${COLORS.gold}22`,
        borderRadius: 12,
        padding: "16px 24px",
        animation: "fadeSlideUp 0.5s ease 0.7s both",
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.gold, marginBottom: 8 }}>💰 수익 모델</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, fontSize: 12, color: COLORS.text }}>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>건당 과금</div>
            <div style={{ color: COLORS.muted }}>분석 1회 ₩200~500</div>
            <div style={{ color: COLORS.muted }}>100만 고객 × 10% = 월 3,000만</div>
          </div>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>월정액 라이선싱</div>
            <div style={{ color: COLORS.muted }}>₩2,000~5,000만/월</div>
            <div style={{ color: COLORS.muted }}>연 2.4~6억 안정 수익</div>
          </div>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>하이브리드 (권고)</div>
            <div style={{ color: COLORS.muted }}>기본료 + 건당 + 분기보고서</div>
            <div style={{ color: COLORS.gold, fontWeight: 700 }}>연 3.2억+α</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PocSlide() {
  return (
    <div style={{ padding: "20px 0" }}>
      <h2 style={{ fontSize: 28, fontWeight: 800, color: COLORS.white, marginBottom: 8, animation: "fadeSlideUp 0.5s ease both" }}>
        PoC 제안 — 3개월 검증 프로그램
      </h2>
      <p style={{ color: COLORS.muted, fontSize: 14, marginBottom: 28, animation: "fadeSlideUp 0.5s ease 0.1s both" }}>
        최소 리스크로 Living Profile의 가치를 직접 확인하세요
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          {
            month: "1개월차",
            title: "데이터 연동",
            items: ["테스트 고객 1,000명 MCC 데이터 수집", "16 아키타입 초기 분류", "기존 세그먼트 대비 정밀도 비교"],
            color: COLORS.accent,
            icon: "🔌",
          },
          {
            month: "2개월차",
            title: "엔진 구동",
            items: ["베이지안 추론 실시간 갱신 시작", "ROC 임계값 자동 보정 적용", "행동 변화 예측 vs 실제 A/B 테스트"],
            color: COLORS.energy,
            icon: "⚙️",
          },
          {
            month: "3개월차",
            title: "성과 검증",
            items: ["리텐션/전환율 KPI 비교 보고서", "N-Score ↔ 고객가치(CLV) 상관분석", "정식 계약 여부 의사결정"],
            color: COLORS.shield,
            icon: "📊",
          },
        ].map((step, i) => (
          <div key={i} style={{
            background: COLORS.card,
            border: `1px solid ${step.color}33`,
            borderRadius: 16,
            padding: 24,
            animation: `fadeSlideUp 0.5s ease ${0.2 + i * 0.15}s both`,
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: step.color }} />
            <div style={{ fontSize: 28, marginBottom: 8 }}>{step.icon}</div>
            <div style={{ fontSize: 11, color: step.color, fontWeight: 700, letterSpacing: 1 }}>{step.month}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.white, margin: "8px 0 16px" }}>{step.title}</div>
            {step.items.map((item, j) => (
              <div key={j} style={{ display: "flex", gap: 8, marginBottom: 8, fontSize: 12, color: COLORS.muted, lineHeight: 1.5 }}>
                <span style={{ color: step.color, flexShrink: 0 }}>→</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.accent}12, ${COLORS.shield}08)`,
        border: `1px solid ${COLORS.accent}33`,
        borderRadius: 16,
        padding: 24,
        textAlign: "center",
        animation: "fadeSlideUp 0.5s ease 0.7s both",
      }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.white, marginBottom: 8 }}>
          PoC 비용: <span style={{ color: COLORS.shield }}>₩0</span>
        </div>
        <div style={{ fontSize: 13, color: COLORS.muted, lineHeight: 1.8 }}>
          N-KAI가 기술·인력을 전액 부담합니다. 파트너사는 테스트 데이터 제공만 해주시면 됩니다.
          <br />
          <span style={{ color: COLORS.accent }}>웹뷰 방식으로 기존 앱에 즉시 삽입 가능</span> — 별도 앱 개발 불필요.
        </div>
      </div>
    </div>
  );
}

function StatusSlide() {
  return (
    <div style={{ padding: "20px 0" }}>
      <h2 style={{ fontSize: 28, fontWeight: 800, color: COLORS.white, marginBottom: 8, animation: "fadeSlideUp 0.5s ease both" }}>
        기술 현황 — 정직한 3단계
      </h2>
      <p style={{ color: COLORS.muted, fontSize: 14, marginBottom: 24, animation: "fadeSlideUp 0.5s ease 0.1s both" }}>
        구현 완료 / 수동 실증 완료 / 자동화 로드맵
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Tier 1: 구현 완료 */}
        <div style={{
          background: `${COLORS.shield}08`,
          border: `1px solid ${COLORS.shield}33`,
          borderRadius: 16,
          padding: 20,
          animation: "fadeSlideUp 0.5s ease 0.2s both",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ background: COLORS.shield, borderRadius: 8, padding: "4px 12px", fontSize: 12, fontWeight: 800, color: COLORS.bg }}>
              ✅ 구현 완료 — 즉시 시연 가능
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {[
              "16 아키타입 분류 엔진",
              "N-Score 9등급 산출",
              "MCC 가중치 소비 DNA",
              "4개 언어 지원 (ko/en/ja/zh)",
              "결제→PDF→이메일 파이프라인",
              "어드민 대시보드 v7.0",
              "Triple Mirror 갭 분석",
              "에너지 타임라인 3구간",
              "골든타임 예보 시스템",
            ].map((item, i) => (
              <div key={i} style={{ fontSize: 12, color: COLORS.text, display: "flex", gap: 6, alignItems: "flex-start" }}>
                <span style={{ color: COLORS.shield, flexShrink: 0 }}>✓</span> {item}
              </div>
            ))}
          </div>
        </div>
        {/* Tier 2: 수동 실증 완료 */}
        <div style={{
          background: `${COLORS.accent}08`,
          border: `1px solid ${COLORS.accent}33`,
          borderRadius: 16,
          padding: 20,
          animation: "fadeSlideUp 0.5s ease 0.4s both",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ background: COLORS.accent, borderRadius: 8, padding: "4px 12px", fontSize: 12, fontWeight: 800, color: COLORS.bg }}>
              🔬 수동 실증 완료 — PoC 시 자동화
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
            {[
              { name: "베이지안 추론 (10회 갱신)", detail: "0.50→0.95 수렴 검증 완료. 코드 자동화 3주 소요" },
              { name: "ROC 임계값 보정 (12회)", detail: "T-60 경고 동작 확인. A/B 테스트 데이터 500건 필요" },
              { name: "비지도 군집화 (8클러스터)", detail: "규칙기반→K-means 전환 시 유저 1,000명 데이터 필요" },
              { name: "Neural CDE 궤적 (9상태벡터)", detail: "시뮬레이션 완료. PyTorch 구현 시 6개월 종단 데이터 필요" },
            ].map((item, i) => (
              <div key={i} style={{ fontSize: 12, color: COLORS.text, lineHeight: 1.6 }}>
                <span style={{ color: COLORS.accent, fontWeight: 700 }}>▸ {item.name}</span>
                <div style={{ color: COLORS.muted, fontSize: 11, marginTop: 2 }}>{item.detail}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Tier 3: 로드맵 */}
        <div style={{
          background: `${COLORS.gold}06`,
          border: `1px solid ${COLORS.gold}22`,
          borderRadius: 16,
          padding: 20,
          animation: "fadeSlideUp 0.5s ease 0.6s both",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ background: COLORS.gold, borderRadius: 8, padding: "4px 12px", fontSize: 12, fontWeight: 800, color: COLORS.bg }}>
              🗺️ 로드맵 — Phase 2~3
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {[
              { name: "MyData API 연동", timeline: "Phase 2 (유저 500+)" },
              { name: "실시간 베이지안 자동 갱신", timeline: "Phase 2 (유저 1,000+)" },
              { name: "온디바이스 SDK 경량화", timeline: "Phase 3 (유저 10,000+)" },
            ].map((item, i) => (
              <div key={i} style={{ fontSize: 12, color: COLORS.muted }}>
                <span style={{ color: COLORS.gold }}>◇</span> {item.name}
                <div style={{ fontSize: 10, marginTop: 2 }}>{item.timeline}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{
        marginTop: 16,
        padding: "12px 20px",
        background: COLORS.card,
        borderRadius: 10,
        fontSize: 12,
        color: COLORS.muted,
        textAlign: "center",
        animation: "fadeSlideUp 0.5s ease 0.8s both",
        lineHeight: 1.7,
      }}>
        특허 P25KAI001KR 심사청구 완료 · 보조특허 3건 · 상표 3건 출원 · 발명자 20년 금융업 경력
      </div>
    </div>
  );
}

export default function NKAIPartnerDeck() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const renderSlide = () => {
    switch (slides[currentSlide]) {
      case "cover": return <CoverSlide />;
      case "problem": return <ProblemSlide />;
      case "data": return <DataSlide />;
      case "algorithms": return <AlgorithmSlide />;
      case "evolution": return <EvolutionSlide />;
      case "prediction": return <PredictionSlide />;
      case "partner": return <PartnerSlide />;
      case "poc": return <PocSlide />;
      case "status": return <StatusSlide />;
      default: return <CoverSlide />;
    }
  };

  return (
    <div style={{
      background: COLORS.bg,
      minHeight: "100vh",
      color: COLORS.text,
      fontFamily: "'Pretendard', -apple-system, 'Segoe UI', sans-serif",
      display: "flex",
      flexDirection: "column",
    }}>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;900&display=swap');
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: ${COLORS.bg}; }
        ::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 4px; }
      `}</style>

      {/* Navigation */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 24px",
        borderBottom: `1px solid ${COLORS.border}`,
        background: `${COLORS.surface}cc`,
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 900, color: COLORS.accent }}>N-KAI</span>
          <span style={{ fontSize: 11, color: COLORS.muted }}>B2B Partner Demo</span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {slideNames.map((name, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              style={{
                background: currentSlide === i ? `${COLORS.accent}20` : "transparent",
                border: `1px solid ${currentSlide === i ? COLORS.accent : "transparent"}`,
                borderRadius: 6,
                padding: "5px 10px",
                fontSize: 11,
                color: currentSlide === i ? COLORS.accent : COLORS.muted,
                cursor: "pointer",
                fontWeight: currentSlide === i ? 700 : 400,
                transition: "all 0.2s",
              }}
            >
              {name}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 11, color: COLORS.muted, fontFamily: "'JetBrains Mono', monospace" }}>
          {currentSlide + 1} / {slides.length}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "20px 40px", maxWidth: 900, margin: "0 auto", width: "100%" }} key={currentSlide}>
        {renderSlide()}
      </div>

      {/* Footer Navigation */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 40px",
        borderTop: `1px solid ${COLORS.border}`,
      }}>
        <button
          onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
          disabled={currentSlide === 0}
          style={{
            background: currentSlide === 0 ? "transparent" : `${COLORS.accent}15`,
            border: `1px solid ${currentSlide === 0 ? COLORS.border : COLORS.accent}44`,
            borderRadius: 8,
            padding: "8px 20px",
            color: currentSlide === 0 ? COLORS.muted : COLORS.accent,
            fontSize: 13,
            cursor: currentSlide === 0 ? "default" : "pointer",
            fontWeight: 600,
          }}
        >
          ← 이전
        </button>
        <div style={{ display: "flex", gap: 6 }}>
          {slides.map((_, i) => (
            <div
              key={i}
              onClick={() => setCurrentSlide(i)}
              style={{
                width: currentSlide === i ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background: currentSlide === i ? COLORS.accent : COLORS.border,
                cursor: "pointer",
                transition: "all 0.3s",
              }}
            />
          ))}
        </div>
        <button
          onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
          disabled={currentSlide === slides.length - 1}
          style={{
            background: currentSlide === slides.length - 1 ? "transparent" : `${COLORS.accent}15`,
            border: `1px solid ${currentSlide === slides.length - 1 ? COLORS.border : COLORS.accent}44`,
            borderRadius: 8,
            padding: "8px 20px",
            color: currentSlide === slides.length - 1 ? COLORS.muted : COLORS.accent,
            fontSize: 13,
            cursor: currentSlide === slides.length - 1 ? "default" : "pointer",
            fontWeight: 600,
          }}
        >
          다음 →
        </button>
      </div>
    </div>
  );
}
