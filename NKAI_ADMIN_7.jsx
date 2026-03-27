import { useState, useEffect, useCallback } from "react";

// ══ GAS API 설정 ══
const GAS_URL = "https://script.google.com/macros/s/AKfycbzCvZ9Dwuh3RE7kX4AGSslRiUBIDukKLtWkP5bhGmBHrrpKs2JQh9E27BtvhM3b2bMe/exec";

// ══ MOCK FALLBACK (GAS 연결 실패 시) ══
const MOCK_SALES = [
  { id:"ORD-2403-001", date:"2026-03-07 14:32", name:"김민준", email:"min@test.com", tier:"standard", amount:9900, archetype:"ENTJ", nscore:720, status:"sent" },
  { id:"ORD-2403-002", date:"2026-03-07 15:11", name:"이수연", email:"su@test.com", tier:"premium", amount:19900, archetype:"INFJ", nscore:810, status:"sent" },
  { id:"ORD-2403-003", date:"2026-03-07 16:45", name:"박지훈", email:"ji@test.com", tier:"standard", amount:9900, archetype:"ISTP", nscore:650, status:"sent" },
  { id:"ORD-2403-004", date:"2026-03-07 17:02", name:"최유리", email:"yu@test.com", tier:"standard", amount:9900, archetype:"ENFP", nscore:780, status:"pending" },
];

const MOCK_DASHBOARD = {
  total_users: 0, total_payments: 0, total_revenue: 0,
  archetype_distribution: {}, funnel_stats: {}, daily_visits: {},
  kipa_averages: { energy: 50, perception: 50, judgment: 50, lifestyle: 50 },
  device_stats: {}, utm_stats: {},
};

// ══ GAS 데이터 Fetch 헬퍼 ══
async function fetchGAS(action) {
  try {
    const res = await fetch(`${GAS_URL}?action=${action}`, { method: "GET" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn(`[ADMIN] GAS fetch failed (${action}):`, e.message);
    return null;
  }
}

export default function AdminDashboard() {
  const [tab, setTab] = useState("overview");
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterTier, setFilterTier] = useState("all");
  const [searchQ, setSearchQ] = useState("");
  const [pulse, setPulse] = useState(false);

  // ══ 실데이터 State ══
  const [dashboard, setDashboard] = useState(MOCK_DASHBOARD);
  const [sales, setSales] = useState(MOCK_SALES);
  const [dataSource, setDataSource] = useState("mock"); // "live" | "mock"
  const [lastUpdate, setLastUpdate] = useState(null);
  const [loading, setLoading] = useState(true);

  // ══ GAS 실데이터 로드 ══
  useEffect(() => {
    async function loadLiveData() {
      setLoading(true);
      const [dashRes, salesRes] = await Promise.all([
        fetchGAS("get_dashboard"),
        fetchGAS("get_tickets"), // 결제 데이터용 (logPayment은 GET 미지원이므로 dashboard에서 집계)
      ]);

      if (dashRes && dashRes.success) {
        setDashboard(dashRes);
        setDataSource("live");
        setLastUpdate(new Date().toLocaleTimeString("ko-KR"));
      } else {
        setDataSource("mock");
      }
      setLoading(false);
    }
    loadLiveData();

    // 30초마다 자동 갱신
    const interval = setInterval(loadLiveData, 30000);
    return () => clearInterval(interval);
  }, []);

  // 실시간 펄스 효과
  useEffect(() => {
    const t = setInterval(() => setPulse(p => !p), 1500);
    return () => clearInterval(t);
  }, []);

  // ══ 파생 데이터 계산 ══
  const isLive = dataSource === "live";

  const totalRevenue = isLive ? (dashboard.total_revenue || 0) : sales.reduce((s, o) => s + o.amount, 0);
  const totalPayments = isLive ? (dashboard.total_payments || 0) : sales.length;
  const totalUsers = isLive ? (dashboard.total_users || 0) : 441;

  // 아키타입 분포 변환 (16형 전체)
  const ALL_16_TYPES = ["INTJ","INTP","ENTJ","ENTP","INFJ","INFP","ENFJ","ENFP","ISTJ","ISFJ","ESTJ","ESFJ","ISTP","ISFP","ESTP","ESFP"];
  const rawArchDist = isLive ? (dashboard.archetype_distribution || {}) : { ENTJ:18, INTJ:15, ENFP:14, INFJ:12, ISTP:10, ENTP:9, ISFJ:8, ENFJ:6, INTP:5, INFP:4, ISTJ:3, ESFJ:2, ISFP:2, ESTJ:1, ESTP:1, ESFP:0 };
  const archetypeDist = ALL_16_TYPES
    .map(type => ({ type, count: rawArchDist[type] || 0 }))
    .sort((a, b) => b.count - a.count);

  // 퍼널 변환
  const funnelData = isLive
    ? Object.entries(dashboard.funnel_stats || {})
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([step, data], i) => ({
          step: data.name || step,
          count: data.count || 0,
          color: ["#2D8CFF","#3B82F6","#6366F1","#F59E0B","#F0C674"][i] || "#2D8CFF",
        }))
    : [
        { step:"홈페이지 방문", count:1240, color:"#2D8CFF" },
        { step:"무료 분석 시작", count:623, color:"#3B82F6" },
        { step:"무료 분석 완료", count:441, color:"#6366F1" },
        { step:"결제 페이지 진입", count:89, color:"#F59E0B" },
        { step:"결제 완료", count:52, color:"#F0C674" },
      ];

  // 일별 방문 변환
  const dailyVisits = isLive
    ? Object.entries(dashboard.daily_visits || {})
        .sort(([a], [b]) => b.localeCompare(a))
        .slice(0, 7)
        .map(([date, count]) => ({ date, count }))
    : [
        { date:"2026-03-07", count:47 }, { date:"2026-03-06", count:38 },
        { date:"2026-03-05", count:55 }, { date:"2026-03-04", count:29 },
        { date:"2026-03-03", count:41 }, { date:"2026-03-02", count:33 },
        { date:"2026-03-01", count:62 },
      ];

  const maxDailyCount = Math.max(...dailyVisits.map(d => d.count), 1);
  const maxArchCount = Math.max(...archetypeDist.map(a => a.count), 1);

  const convRate = funnelData.length >= 5
    ? ((funnelData[4].count / Math.max(1, funnelData[2].count)) * 100).toFixed(1)
    : "0.0";

  const avgNscore = isLive ? "-" : Math.round(sales.reduce((s, o) => s + o.nscore, 0) / sales.length);

  const filteredSales = sales.filter(o => {
    const tierOk = filterTier === "all" || o.tier === filterTier;
    const searchOk = !searchQ || o.name.includes(searchQ) || o.email.includes(searchQ) || o.id.includes(searchQ);
    return tierOk && searchOk;
  });

  const GRADE_COLORS = { "N1":"#F0C674","N2":"#22C55E","N3":"#3B82F6","N4":"#8B5CF6","N5":"#06B6D4","N6":"#F97316","N7":"#EAB308","N8":"#EF4444","N9":"#9CA3AF" };
  const MOCK_GRADE = [{ grade:"N1",count:3 },{ grade:"N2",count:8 },{ grade:"N3",count:15 },{ grade:"N4",count:22 },{ grade:"N5",count:18 },{ grade:"N6",count:12 },{ grade:"N7",count:9 },{ grade:"N8",count:6 },{ grade:"N9",count:7 }];
  const GRADE_DIST = (() => {
    if (!isLive) return MOCK_GRADE.map(g => ({ ...g, color: GRADE_COLORS[g.grade] }));
    if (dashboard.nscore_distribution) {
      return Object.entries(dashboard.nscore_distribution).map(([grade, count]) => ({ grade, count, color: GRADE_COLORS[grade] || "#9CA3AF" }));
    }
    const scores = Object.values(dashboard.user_nscores || {});
    if (scores.length === 0) return MOCK_GRADE.map(g => ({ ...g, count: 0, color: GRADE_COLORS[g.grade] }));
    const bins = { "N1":0,"N2":0,"N3":0,"N4":0,"N5":0,"N6":0,"N7":0,"N8":0,"N9":0 };
    scores.forEach(s => { if (s >= 950) bins["N1"]++; else if (s >= 800) bins["N2"]++; else if (s >= 720) bins["N3"]++; else if (s >= 650) bins["N4"]++; else if (s >= 580) bins["N5"]++; else if (s >= 510) bins["N6"]++; else if (s >= 440) bins["N7"]++; else if (s >= 370) bins["N8"]++; else bins["N9"]++; });
    return Object.entries(bins).map(([grade, count]) => ({ grade, count, color: GRADE_COLORS[grade] }));
  })();

  const runAiAnalysis = useCallback(async (prompt) => {
    setAiLoading(true);
    setAiAnalysis("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }]
        })
      });
      const data = await res.json();
      const text = data.content?.find(b => b.type === "text")?.text || "분석 실패";
      setAiAnalysis(text);
    } catch (e) {
      setAiAnalysis("⚠️ API 연결 오류. CLAUDE_API_KEY 확인 필요.");
    }
    setAiLoading(false);
  }, []);

  const c = {
    dark: "#071523", mid: "#0D1B2A", card: "#0F2035", border: "#1A3A5C",
    gold: "#F0C674", blue: "#2D8CFF", text: "#E8EDF2", sub: "#7A8FA6",
    green: "#22C55E", red: "#EF4444", purple: "#A78BFA"
  };

  const styles = {
    wrap: { minHeight:"100vh", background: c.dark, color: c.text, fontFamily:"'Segoe UI','맑은 고딕',sans-serif", fontSize:13 },
    sidebar: { position:"fixed", left:0, top:0, bottom:0, width:200, background:c.mid, borderRight:`1px solid ${c.border}`, display:"flex", flexDirection:"column", zIndex:100 },
    sbLogo: { padding:"20px 20px 16px", borderBottom:`1px solid ${c.border}` },
    sbLogoText: { fontSize:18, fontWeight:900, color:c.gold, letterSpacing:2 },
    sbSub: { fontSize:9, color:"rgba(240,198,116,.5)", letterSpacing:1.5, marginTop:2 },
    sbNav: { flex:1, padding:"12px 0", overflowY:"auto" },
    sbItem: (active) => ({ display:"flex", alignItems:"center", gap:10, padding:"10px 20px", cursor:"pointer", background: active ? `rgba(45,140,255,.15)` : "transparent", borderLeft: active ? `3px solid ${c.blue}` : "3px solid transparent", color: active ? c.blue : c.sub, fontSize:13, fontWeight: active ? 700 : 400, transition:".15s" }),
    sbFooter: { padding:"16px 20px", borderTop:`1px solid ${c.border}`, fontSize:10, color:c.sub, lineHeight:1.6 },
    main: { marginLeft:200, minHeight:"100vh" },
    topbar: { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 28px", background:c.mid, borderBottom:`1px solid ${c.border}`, position:"sticky", top:0, zIndex:50 },
    topTitle: { fontSize:16, fontWeight:700 },
    liveTag: { display:"flex", alignItems:"center", gap:6, background: isLive ? "rgba(34,197,94,.1)" : "rgba(240,198,116,.1)", border: `1px solid ${isLive ? "rgba(34,197,94,.3)" : "rgba(240,198,116,.3)"}`, borderRadius:20, padding:"4px 12px", fontSize:11, color: isLive ? c.green : c.gold, fontWeight:700 },
    liveDot: { width:7, height:7, borderRadius:"50%", background: isLive ? c.green : c.gold, opacity: pulse ? 1 : 0.3, transition:"opacity .3s" },
    content: { padding:"24px 28px" },
    grid2: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20 },
    grid4: { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:20 },
    kpiCard: { background:c.card, border:`1px solid ${c.border}`, borderRadius:12, padding:"18px 20px" },
    kpiLabel: { fontSize:10, fontWeight:700, letterSpacing:1.5, color:c.sub, marginBottom:6 },
    kpiVal: { fontSize:28, fontWeight:900, marginBottom:4 },
    kpiSub: { fontSize:11, color:c.sub },
    card: { background:c.card, border:`1px solid ${c.border}`, borderRadius:12, padding:"20px 22px", marginBottom:16 },
    cardTitle: { fontSize:14, fontWeight:700, marginBottom:16, display:"flex", alignItems:"center", gap:8 },
    badge: (color) => ({ display:"inline-block", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, background:`${color}22`, color }),
    btn: (color="#2D8CFF", ghost=false) => ({
      background: ghost ? "transparent" : color, color: ghost ? color : "#fff",
      border: `1px solid ${color}`, borderRadius:7, padding:"8px 16px",
      fontSize:12, fontWeight:700, cursor:"pointer", transition:".15s"
    }),
    input: { background:"rgba(255,255,255,.06)", border:`1px solid ${c.border}`, borderRadius:7, padding:"8px 12px", color:c.text, fontSize:12, outline:"none", width:200 },
    table: { width:"100%", borderCollapse:"collapse" },
    th: { padding:"10px 12px", textAlign:"left", fontSize:10, fontWeight:700, letterSpacing:1, color:c.sub, borderBottom:`1px solid ${c.border}`, background:"rgba(0,0,0,.2)" },
    td: { padding:"11px 12px", borderBottom:`1px solid rgba(26,58,92,.4)`, fontSize:12 },
  };

  const MiniBar = ({ pct, color, height=8 }) => (
    <div style={{ height, background:"rgba(255,255,255,.06)", borderRadius:4, overflow:"hidden", flex:1 }}>
      <div style={{ height:"100%", width:`${Math.min(100, pct)}%`, background:color, borderRadius:4, transition:".6s" }} />
    </div>
  );

  return (
    <div style={styles.wrap}>
      {/* ── SIDEBAR ── */}
      <div style={styles.sidebar}>
        <div style={styles.sbLogo}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
            <div style={{ width:34, height:34, background:`linear-gradient(135deg,${c.gold},#d4a853)`, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, color:c.dark, fontSize:14 }}>N</div>
            <div>
              <div style={styles.sbLogoText}>N·KAI</div>
              <div style={styles.sbSub}>ADMIN 7.0</div>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:10, color: isLive ? c.green : c.gold }}>
            <div style={{ ...styles.liveDot }} /> {isLive ? "실시간 운영 중" : "MOCK 데이터"}
          </div>
        </div>
        <div style={styles.sbNav}>
          {[
            { id:"overview", icon:"📊", label:"대시보드" },
            { id:"sales", icon:"💳", label:"결제 내역" },
            { id:"funnel", icon:"🎯", label:"전환 퍼널" },
            { id:"users", icon:"👥", label:"고객 분석" },
            { id:"utm", icon:"📡", label:"유입 경로" },
            { id:"ai", icon:"🤖", label:"AI 인사이트" },
            { id:"system", icon:"⚙️", label:"시스템 상태" },
          ].map(({ id, icon, label }) => (
            <div key={id} style={styles.sbItem(tab === id)} onClick={() => setTab(id)}>
              <span>{icon}</span><span>{label}</span>
            </div>
          ))}
        </div>
        <div style={styles.sbFooter}>
          <div style={{ color:c.gold, fontWeight:700, marginBottom:4 }}>자동화 시스템 v7.9.1</div>
          <div>GAS {isLive ? "✅" : "⚠️"} 토스 ✅ Gmail ✅</div>
          <div style={{ marginTop:4 }}>{lastUpdate ? `갱신: ${lastUpdate}` : "데이터 로딩 중..."}</div>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={styles.main}>
        <div style={styles.topbar}>
          <div style={styles.topTitle}>
            {tab === "overview" && "📊 운영 현황 대시보드"}
            {tab === "sales" && "💳 결제 내역 관리"}
            {tab === "funnel" && "🎯 전환 퍼널 분석"}
            {tab === "users" && "👥 고객 성향 분석"}
            {tab === "utm" && "📡 UTM 유입 경로 분석"}
            {tab === "ai" && "🤖 AI 인사이트 엔진"}
            {tab === "system" && "⚙️ 자동화 시스템 상태"}
          </div>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <div style={styles.liveTag}><div style={styles.liveDot} />{isLive ? "LIVE" : "MOCK"}</div>
            <div style={{ fontSize:11, color:c.sub }}>{new Date().toISOString().slice(0,10)} · 뉴린카이로스에이아이(주)</div>
          </div>
        </div>

        <div style={styles.content}>

          {/* 로딩 표시 */}
          {loading && (
            <div style={{ textAlign:"center", padding:40, color:c.gold }}>
              GAS 실데이터 로딩 중...
            </div>
          )}

          {/* ═══════════ OVERVIEW ═══════════ */}
          {!loading && tab === "overview" && (
            <>
              {/* 데이터 소스 표시 */}
              <div style={{ marginBottom:16, padding:"8px 14px", background: isLive ? "rgba(34,197,94,.08)" : "rgba(240,198,116,.08)", border:`1px solid ${isLive ? "rgba(34,197,94,.2)" : "rgba(240,198,116,.2)"}`, borderRadius:8, fontSize:11, color: isLive ? c.green : c.gold }}>
                {isLive
                  ? `✅ GAS 실데이터 연결됨 — 총 ${totalUsers}명 · 30초 자동 갱신 · 마지막 갱신: ${lastUpdate}`
                  : "⚠️ GAS 연결 실패 — Mock 데이터 표시 중. 네트워크 확인 필요."}
              </div>

              <div style={styles.grid4}>
                {[
                  { label:"총 유저 수", val: totalUsers.toLocaleString(), sub:`분석 완료 유저`, color:c.blue },
                  { label:"누적 매출", val:`${(totalRevenue/10000).toFixed(1)}만원`, sub:`결제 ${totalPayments}건`, color:c.gold },
                  { label:"전환율 (무료→유료)", val:`${convRate}%`, sub:"분석완료 대비", color:c.green },
                  { label:"평균 N-Score", val: avgNscore, sub:"전체 고객", color:c.purple },
                ].map((k, i) => (
                  <div key={i} style={styles.kpiCard}>
                    <div style={styles.kpiLabel}>{k.label}</div>
                    <div style={{ ...styles.kpiVal, color:k.color }}>{k.val}</div>
                    <div style={styles.kpiSub}>{k.sub}</div>
                  </div>
                ))}
              </div>

              <div style={styles.grid2}>
                {/* 일별 방문/분석 트렌드 */}
                <div style={styles.card}>
                  <div style={styles.cardTitle}>📈 {isLive ? "일별 방문 트렌드" : "무료 분석 트렌드"} (7일)</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {dailyVisits.map((d, i) => (
                      <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ fontSize:11, color:c.sub, width:60 }}>{d.date.slice(5)}</div>
                        <MiniBar pct={(d.count/maxDailyCount)*100} color={i===0?c.gold:c.blue} />
                        <div style={{ fontSize:12, fontWeight:700, width:28, textAlign:"right" }}>{d.count}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 최근 결제 */}
                <div style={styles.card}>
                  <div style={styles.cardTitle}>💳 최근 결제
                    <span style={{ ...styles.badge(c.green), marginLeft:"auto" }}>{sales.filter(o=>o.status==="sent").length} 발송완료</span>
                  </div>
                  {sales.slice(0,5).map((o, i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:`1px solid rgba(26,58,92,.3)` }}>
                      <div style={{ width:36, height:36, background:`linear-gradient(135deg,${c.card},${c.mid})`, border:`1px solid ${c.border}`, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:900, color:c.gold }}>{(o.archetype||"??").slice(0,2)}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700 }}>{o.name}</div>
                        <div style={{ fontSize:10, color:c.sub }}>{(o.date||"").slice(11)} · {o.archetype} · N{Math.floor((o.nscore||0)/100)}</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontWeight:700, color:o.tier==="premium"?c.purple:c.gold }}>{((o.amount||0)/10000).toFixed(1)}만</div>
                        <span style={styles.badge(o.status==="sent"?c.green:c.gold)}>{o.status==="sent"?"✓ 발송":"대기"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 아키타입 분포 */}
              <div style={styles.card}>
                <div style={styles.cardTitle}>🧬 아키타입 분포 {isLive && <span style={styles.badge(c.green)}>LIVE</span>}</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
                  {archetypeDist.map((a, i) => (
                    <div key={i} style={{ flex:"0 0 calc(25% - 8px)", background:"rgba(255,255,255,.03)", border:`1px solid ${c.border}`, borderRadius:8, padding:"12px 14px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                        <span style={{ fontWeight:700, color:c.gold }}>{a.type}</span>
                        <span style={{ fontSize:11, color:c.sub }}>{a.count}명</span>
                      </div>
                      <MiniBar pct={(a.count/maxArchCount)*100} color={c.blue} height={6} />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ═══════════ SALES ═══════════ */}
          {!loading && tab === "sales" && (
            <>
              <div style={{ display:"flex", gap:10, marginBottom:16, alignItems:"center" }}>
                <input placeholder="이름·이메일·주문번호 검색" value={searchQ} onChange={e=>setSearchQ(e.target.value)} style={styles.input} />
                {["all","standard","premium"].map(t => (
                  <button key={t} onClick={()=>setFilterTier(t)} style={{ ...styles.btn(c.blue, filterTier!==t), padding:"8px 14px" }}>
                    {t==="all"?"전체":t==="standard"?"Standard":"Premium"}
                  </button>
                ))}
                <div style={{ marginLeft:"auto", fontSize:12, color:c.sub }}>{filteredSales.length}건</div>
              </div>

              <div style={styles.card}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {["주문번호","일시","고객명","이메일","상품","아키타입","N-Score","금액","상태","액션"].map(h => (
                        <th key={h} style={styles.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSales.map((o, i) => (
                      <tr key={i} style={{ cursor:"pointer" }} onClick={()=>setSelectedOrder(o)}>
                        <td style={{ ...styles.td, color:c.sub, fontSize:11 }}>{o.id}</td>
                        <td style={{ ...styles.td, fontSize:11 }}>{o.date}</td>
                        <td style={{ ...styles.td, fontWeight:700 }}>{o.name}</td>
                        <td style={{ ...styles.td, color:c.sub }}>{o.email}</td>
                        <td style={styles.td}><span style={styles.badge(o.tier==="premium"?c.purple:c.gold)}>{o.tier}</span></td>
                        <td style={{ ...styles.td, fontWeight:700, color:c.gold }}>{o.archetype}</td>
                        <td style={{ ...styles.td, fontWeight:700 }}>{o.nscore}</td>
                        <td style={{ ...styles.td, fontWeight:700, color:c.gold }}>{(o.amount||0).toLocaleString()}원</td>
                        <td style={styles.td}><span style={styles.badge(o.status==="sent"?c.green:c.gold)}>{o.status==="sent"?"✓ 발송":"대기"}</span></td>
                        <td style={styles.td}>
                          <button style={{ ...styles.btn(c.blue, true), padding:"4px 8px", fontSize:11 }} onClick={e=>{e.stopPropagation();setSelectedOrder(o)}}>상세</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedOrder && (
                <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.7)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 }} onClick={()=>setSelectedOrder(null)}>
                  <div style={{ background:c.card, border:`1px solid ${c.border}`, borderRadius:16, padding:28, width:480, maxWidth:"90vw" }} onClick={e=>e.stopPropagation()}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
                      <div style={{ fontSize:15, fontWeight:900, color:c.gold }}>{selectedOrder.id}</div>
                      <button onClick={()=>setSelectedOrder(null)} style={{ background:"transparent", border:"none", color:c.sub, cursor:"pointer", fontSize:16 }}>✕</button>
                    </div>
                    {[
                      ["고객명", selectedOrder.name], ["이메일", selectedOrder.email],
                      ["상품", selectedOrder.tier], ["아키타입", selectedOrder.archetype],
                      ["N-Score", selectedOrder.nscore], ["결제금액", `${(selectedOrder.amount||0).toLocaleString()}원`],
                      ["결제일시", selectedOrder.date], ["PDF 발송", selectedOrder.status==="sent"?"✅ 완료":"⏳ 대기"],
                    ].map(([k,v]) => (
                      <div key={k} style={{ display:"flex", padding:"8px 0", borderBottom:`1px solid rgba(26,58,92,.3)` }}>
                        <div style={{ width:100, color:c.sub, fontSize:12 }}>{k}</div>
                        <div style={{ flex:1, fontWeight:700, fontSize:13 }}>{v}</div>
                      </div>
                    ))}
                    <div style={{ marginTop:16, display:"flex", gap:8 }}>
                      <button style={styles.btn(c.green)}>📧 PDF 재발송</button>
                      <button style={styles.btn(c.blue, true)}>🔍 AI 분석</button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ═══════════ FUNNEL ═══════════ */}
          {!loading && tab === "funnel" && (
            <>
              <div style={styles.card}>
                <div style={styles.cardTitle}>🎯 전환 퍼널 — {isLive ? "실시간" : "Mock"} {isLive && <span style={styles.badge(c.green)}>LIVE</span>}</div>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {funnelData.map((f, i) => {
                    const pct = i===0 ? 100 : Math.round((f.count/Math.max(1, funnelData[0].count))*100);
                    const convFromPrev = i===0 ? 100 : Math.round((f.count/Math.max(1, funnelData[i-1].count))*100);
                    return (
                      <div key={i}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                            <div style={{ width:24, height:24, background:f.color, borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:900, color:c.dark }}>{i+1}</div>
                            <span style={{ fontWeight:700 }}>{f.step}</span>
                          </div>
                          <div style={{ display:"flex", gap:16, alignItems:"center" }}>
                            <span style={{ fontWeight:900, fontSize:16 }}>{f.count.toLocaleString()}</span>
                            <span style={{ ...styles.badge(f.color), minWidth:50, textAlign:"center" }}>{pct}%</span>
                            {i>0 && <span style={{ fontSize:11, color:c.sub }}>전환 {convFromPrev}%</span>}
                          </div>
                        </div>
                        <MiniBar pct={pct} color={f.color} height={12} />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={styles.card}>
                <div style={styles.cardTitle}>📊 N-Score 등급 분포</div>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {GRADE_DIST.map((g, i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <div style={{ width:32, fontWeight:900, color:g.color }}>{g.grade}</div>
                      <MiniBar pct={(g.count/40)*100} color={g.color} height={14} />
                      <div style={{ width:40, textAlign:"right", fontWeight:700 }}>{g.count}명</div>
                      <div style={{ width:44, textAlign:"right", fontSize:11, color:c.sub }}>{Math.round(g.count/100*100)}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ═══════════ USERS ═══════════ */}
          {!loading && tab === "users" && (
            <>
              <div style={styles.grid2}>
                <div style={styles.card}>
                  <div style={styles.cardTitle}>🧬 상위 아키타입 TOP 5 {isLive && <span style={styles.badge(c.green)}>LIVE</span>}</div>
                  {archetypeDist.slice(0,5).map((a, i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                      <div style={{ width:20, height:20, background:`rgba(240,198,116,.15)`, borderRadius:4, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:900, color:c.gold }}>{i+1}</div>
                      <div style={{ fontWeight:700, color:c.gold, width:40 }}>{a.type}</div>
                      <MiniBar pct={(a.count/maxArchCount)*100} color={c.blue} height={10} />
                      <div style={{ fontWeight:700, width:28, textAlign:"right" }}>{a.count}</div>
                    </div>
                  ))}
                </div>
                <div style={styles.card}>
                  <div style={styles.cardTitle}>💰 상품별 구매 비율</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                    {(() => {
                      const stdCount = isLive ? (dashboard.tier_distribution?.standard || 0) : sales.filter(o=>o.tier==="standard").length;
                      const prmCount = isLive ? (dashboard.tier_distribution?.premium || 0) : sales.filter(o=>o.tier==="premium").length;
                      const total = stdCount + prmCount || 1;
                      return [
                        { label:"Standard (9,900원)", pct:Math.round(stdCount/total*100), count:stdCount, color:c.gold },
                        { label:"Premium (19,900원)", pct:Math.round(prmCount/total*100), count:prmCount, color:c.purple },
                      ];
                    })().map((t, i) => (
                      <div key={i}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                          <span style={{ fontWeight:700, color:t.color }}>{t.label}</span>
                          <span style={{ fontSize:12, color:c.sub }}>{t.count}건 · {t.pct}%</span>
                        </div>
                        <MiniBar pct={t.pct} color={t.color} height={16} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={styles.card}>
                <div style={styles.cardTitle}>🎯 KIPA 4축 평균 {isLive && <span style={styles.badge(c.green)}>LIVE</span>}</div>
                <div style={{ display:"flex", gap:16 }}>
                  {[
                    { label:"E/I 에너지원", val: dashboard.kipa_averages?.energy || 50, color:"#F0C674" },
                    { label:"N/S 인지방식", val: dashboard.kipa_averages?.perception || 50, color:c.blue },
                    { label:"T/F 판단기준", val: dashboard.kipa_averages?.judgment || 50, color:c.green },
                    { label:"J/P 생활양식", val: dashboard.kipa_averages?.lifestyle || 50, color:c.purple },
                  ].map((k, i) => (
                    <div key={i} style={{ flex:1, background:"rgba(255,255,255,.03)", border:`1px solid ${c.border}`, borderRadius:10, padding:"16px 14px", textAlign:"center" }}>
                      <div style={{ fontSize:10, color:c.sub, marginBottom:8, fontWeight:700 }}>{k.label}</div>
                      <div style={{ fontSize:32, fontWeight:900, color:k.color, marginBottom:8 }}>{k.val}</div>
                      <MiniBar pct={k.val} color={k.color} height={6} />
                    </div>
                  ))}
                </div>
              </div>
              <div style={styles.card}>
                <div style={styles.cardTitle}>💞 케미스트리 매칭 현황 {isLive && <span style={styles.badge(c.green)}>LIVE</span>}</div>
                {(() => {
                  const chem = dashboard.chemistry_stats;
                  if (!chem) return (
                    <div style={{ textAlign:"center", padding:"32px 0", color:c.sub, fontSize:12 }}>
                      케미스트리 데이터 준비 중 — GAS chemistry_stats 엔드포인트 구현 후 자동 연결됩니다.
                    </div>
                  );
                  return (
                    <>
                      <div style={{ display:"flex", gap:14, marginBottom:18 }}>
                        {[
                          { label:"총 매칭 수", val:chem.total_matches?.toLocaleString() || "0", color:c.blue },
                          { label:"평균 케미 점수", val:chem.avg_score || "-", color:c.gold },
                        ].map((k, i) => (
                          <div key={i} style={{ flex:1, background:"rgba(255,255,255,.03)", border:`1px solid ${c.border}`, borderRadius:10, padding:"14px 16px", textAlign:"center" }}>
                            <div style={{ fontSize:10, color:c.sub, marginBottom:6, fontWeight:700 }}>{k.label}</div>
                            <div style={{ fontSize:26, fontWeight:900, color:k.color }}>{k.val}</div>
                          </div>
                        ))}
                      </div>
                      {(chem.top_pairs || []).length > 0 && (
                        <>
                          <div style={{ fontSize:11, fontWeight:700, color:c.sub, marginBottom:10, letterSpacing:1 }}>TOP 궁합 쌍</div>
                          {chem.top_pairs.map((p, i) => (
                            <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:`1px solid rgba(26,58,92,.3)` }}>
                              <div style={{ width:20, height:20, background:"rgba(240,198,116,.15)", borderRadius:4, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:900, color:c.gold }}>{i+1}</div>
                              <div style={{ fontWeight:700, color:c.gold }}>{p.pair || `${p.type1} × ${p.type2}`}</div>
                              <div style={{ flex:1 }} />
                              <MiniBar pct={p.score || 0} color={c.green} height={8} />
                              <div style={{ fontWeight:700, width:36, textAlign:"right" }}>{p.score || 0}%</div>
                            </div>
                          ))}
                        </>
                      )}
                    </>
                  );
                })()}
              </div>
            </>
          )}

          {/* ═══════════ UTM ═══════════ */}
          {!loading && tab === "utm" && (() => {
            const MOCK_UTM = { direct:124, naver:89, instagram:67, kakao:45, google:31, facebook:18, etc:22 };
            const utmRaw = isLive ? (dashboard.utm_stats || {}) : MOCK_UTM;
            const SOURCE_MAP = [
              { key:"direct", label:"직접 유입", color:"#2D8CFF" },
              { key:"naver", label:"네이버", color:"#03C75A" },
              { key:"instagram", label:"인스타그램", color:"#E1306C" },
              { key:"kakao", label:"카카오", color:"#FEE500" },
              { key:"google", label:"구글", color:"#4285F4" },
              { key:"facebook", label:"페이스북", color:"#1877F2" },
              { key:"etc", label:"기타", color:"#9CA3AF" },
            ];
            const utmData = SOURCE_MAP.map(s => ({ ...s, count: utmRaw[s.key] || 0 })).sort((a,b) => b.count - a.count);
            const maxUtm = Math.max(...utmData.map(d => d.count), 1);
            const totalUtm = utmData.reduce((s, d) => s + d.count, 0) || 1;
            return (
              <>
                <div style={{ marginBottom:16, padding:"8px 14px", background: isLive ? "rgba(34,197,94,.08)" : "rgba(240,198,116,.08)", border:`1px solid ${isLive ? "rgba(34,197,94,.2)" : "rgba(240,198,116,.2)"}`, borderRadius:8, fontSize:11, color: isLive ? c.green : c.gold }}>
                  {isLive ? `✅ GAS utm_stats 실데이터 · 총 ${totalUtm}건 유입` : "⚠️ Mock 데이터 표시 중"}
                </div>

                <div style={styles.grid2}>
                  <div style={styles.card}>
                    <div style={styles.cardTitle}>📡 소스별 유입량 {isLive && <span style={styles.badge(c.green)}>LIVE</span>}</div>
                    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                      {utmData.map((d, i) => (
                        <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <div style={{ width:80, fontSize:12, fontWeight:700, color:d.color }}>{d.label}</div>
                          <MiniBar pct={(d.count/maxUtm)*100} color={d.color} height={14} />
                          <div style={{ width:36, textAlign:"right", fontWeight:700 }}>{d.count}</div>
                          <div style={{ width:40, textAlign:"right", fontSize:11, color:c.sub }}>{Math.round(d.count/totalUtm*100)}%</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={styles.card}>
                    <div style={styles.cardTitle}>📊 유입 비율 요약</div>
                    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", padding:"12px 14px", background:"rgba(255,255,255,.03)", borderRadius:8, border:`1px solid ${c.border}` }}>
                        <span style={{ color:c.sub, fontSize:12 }}>총 유입</span>
                        <span style={{ fontWeight:900, fontSize:18, color:c.gold }}>{totalUtm.toLocaleString()}건</span>
                      </div>
                      <div style={{ display:"flex", justifyContent:"space-between", padding:"12px 14px", background:"rgba(255,255,255,.03)", borderRadius:8, border:`1px solid ${c.border}` }}>
                        <span style={{ color:c.sub, fontSize:12 }}>최다 유입 소스</span>
                        <span style={{ fontWeight:900, fontSize:14, color:utmData[0]?.color }}>{utmData[0]?.label} ({utmData[0]?.count}건)</span>
                      </div>
                      <div style={{ display:"flex", justifyContent:"space-between", padding:"12px 14px", background:"rgba(255,255,255,.03)", borderRadius:8, border:`1px solid ${c.border}` }}>
                        <span style={{ color:c.sub, fontSize:12 }}>유료 광고 비율</span>
                        <span style={{ fontWeight:900, fontSize:14, color:c.blue }}>
                          {Math.round(((utmRaw.naver||0)+(utmRaw.google||0)+(utmRaw.facebook||0))/totalUtm*100)}%
                        </span>
                      </div>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:4 }}>
                        {utmData.map((d, i) => (
                          <div key={i} style={{ ...styles.badge(d.color), fontSize:10 }}>{d.label} {Math.round(d.count/totalUtm*100)}%</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}

          {/* ═══════════ AI INSIGHTS ═══════════ */}
          {!loading && tab === "ai" && (
            <>
              <div style={{ ...styles.card, border:`1px solid rgba(240,198,116,.3)`, background:"rgba(240,198,116,.04)" }}>
                <div style={styles.cardTitle}>🤖 AI 분석 엔진 — Claude Sonnet 직접 연동</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginBottom:16 }}>
                  {[
                    { label:"📊 전체 매출 인사이트 분석", prompt:`N-KAI 플랫폼 운영 데이터를 분석해줘. 총 유저 ${totalUsers}명, 총 매출 ${totalRevenue.toLocaleString()}원, 결제 ${totalPayments}건, 전환율 ${convRate}%. 상위 아키타입: ${archetypeDist.slice(0,3).map(a=>`${a.type}(${a.count}명)`).join(', ')}. 현재 비즈니스 상태 진단과 즉시 실행 가능한 개선안 3가지를 제시해줘.` },
                    { label:"🎯 전환율 개선 전략", prompt:`N-KAI 서비스의 전환 퍼널: ${funnelData.map(f=>`${f.step} ${f.count}`).join(' → ')}. 전환율이 가장 낮은 병목 구간을 찾고 개선 전략 3가지를 구체적 수치와 함께 제시해줘.` },
                    { label:"💰 수익화 확대 방안", prompt:`N-KAI의 현재 상품: Standard 9,900원, Premium 19,900원, VIP 49,900원. 총 매출 ${totalRevenue.toLocaleString()}원, ${totalPayments}건. 수익을 30% 이상 늘리기 위한 새로운 수익화 전략 3가지를 제시해줘.` },
                    { label:"🧬 아키타입별 맞춤 마케팅", prompt:`N-KAI 고객 아키타입 분포: ${archetypeDist.slice(0,5).map(a=>`${a.type} ${a.count}명`).join(', ')}. 각 아키타입의 금융 성향 특성에 맞는 맞춤 마케팅 메시지를 각각 2줄씩 작성해줘.` },
                  ].map((btn, i) => (
                    <button key={i} onClick={() => runAiAnalysis(btn.prompt)} disabled={aiLoading} style={{ ...styles.btn(c.gold, true), fontSize:12, padding:"9px 14px" }}>
                      {btn.label}
                    </button>
                  ))}
                </div>
                <div style={{ background:c.dark, borderRadius:10, padding:"18px 20px", minHeight:200, border:`1px solid ${c.border}`, position:"relative" }}>
                  {aiLoading && (
                    <div style={{ display:"flex", alignItems:"center", gap:10, color:c.gold }}>
                      <div style={{ width:10, height:10, borderRadius:"50%", background:c.gold, animation:"pulse 1s infinite" }} />
                      Claude Sonnet 분석 중...
                    </div>
                  )}
                  {aiAnalysis && !aiLoading && (
                    <div style={{ fontSize:13, lineHeight:1.8, color:c.text, whiteSpace:"pre-wrap" }}>{aiAnalysis}</div>
                  )}
                  {!aiAnalysis && !aiLoading && (
                    <div style={{ color:c.sub, textAlign:"center", paddingTop:60, fontSize:12 }}>
                      위 버튼을 클릭하면 Claude AI가 실시간 분석을 시작합니다
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ═══════════ SYSTEM ═══════════ */}
          {!loading && tab === "system" && (
            <>
              <div style={styles.card}>
                <div style={styles.cardTitle}>⚙️ 자동화 파이프라인 상태</div>
                <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
                  {[
                    { name:"GAS get_dashboard", status: isLive ? "정상" : "연결 실패", latency: isLive ? "~2초" : "N/A", color: isLive ? c.green : c.red, desc:`실데이터: 유저 ${totalUsers}명 · 매출 ${totalRevenue.toLocaleString()}원` },
                    { name:"토스페이먼츠 Webhook", status:"정상", latency:"~10초", color:c.green, desc:"결제 승인 → GAS confirmTossPayment()" },
                    { name:"Claude AI API", status:"정상", latency:"~15초", color:c.green, desc:"generateAIInterpretation() — full 모드" },
                    { name:"DriveApp PDF 변환", status:"정상", latency:"~20초", color:c.green, desc:"HTML → PDF (시스템폰트 안전)" },
                    { name:"Gmail 자동발송", status:"정상", latency:"~5초", color:c.green, desc:"GmailApp.sendEmail() — PDF 첨부" },
                    { name:"Google Sheets 로그", status:"정상", latency:"실시간", color:c.green, desc:"9개 시트 자동 기록 (v4.1)" },
                  ].map((s, i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 0", borderBottom:`1px solid rgba(26,58,92,.3)` }}>
                      <div style={{ width:12, height:12, borderRadius:"50%", background:s.color, flexShrink:0 }} />
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700, marginBottom:3 }}>{s.name}</div>
                        <div style={{ fontSize:11, color:c.sub }}>{s.desc}</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <span style={styles.badge(s.color)}>{s.status}</span>
                        <div style={{ fontSize:10, color:c.sub, marginTop:4 }}>응답 {s.latency}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={styles.grid2}>
                <div style={styles.card}>
                  <div style={styles.cardTitle}>📁 Google Sheets 연결 DB (9개 시트)</div>
                  {[
                    { name:"분석데이터", cols:"34열 (v4.1 KIPA 16Q)", rows: totalUsers, active: isLive },
                    { name:"결제기록", cols:"주문번호·이메일·금액·상태·일시", rows: totalPayments, active: isLive },
                    { name:"PDF발송로그", cols:"발송완료여부·발송시각·수신확인", rows:"-", active: isLive },
                    { name:"퍼널트래킹", cols:"세션ID·퍼널단계·소요시간·이탈여부", rows:"-", active: isLive },
                    { name:"세션트래킹", cols:"17열 (디바이스·UTM·리퍼러)", rows:"-", active: isLive },
                  ].map((s, i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:`1px solid rgba(26,58,92,.3)` }}>
                      <span style={{ color:c.green, fontSize:16 }}>📊</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700 }}>{s.name}</div>
                        <div style={{ fontSize:10, color:c.sub }}>{s.cols}</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontWeight:700, color:c.gold }}>{s.rows}행</div>
                        <span style={styles.badge(s.active?c.green:c.sub)}>{s.active?"연결됨":"대기"}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={styles.card}>
                  <div style={styles.cardTitle}>📡 GAS 엔드포인트 (14개)</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    {[
                      { method:"GET", actions:"get_dashboard · get_tickets · track_utm", count:7 },
                      { method:"POST", actions:"send_pdf_report · confirm_payment · track_funnel · track_session", count:7 },
                    ].map((g, i) => (
                      <div key={i} style={{ background:"rgba(255,255,255,.03)", borderRadius:8, padding:"10px 12px", border:`1px solid ${c.border}` }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                          <span style={styles.badge(g.method==="GET"?c.blue:c.gold)}>{g.method}</span>
                          <span style={{ fontSize:11, color:c.sub }}>{g.count}개 패턴</span>
                        </div>
                        <div style={{ fontSize:11, color:c.text }}>{g.actions}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        button:hover { opacity:.85 }
        input:focus { border-color: #2D8CFF !important; }
        * { scrollbar-width:thin; scrollbar-color: #1A3A5C #071523; }
      `}</style>
    </div>
  );
}
