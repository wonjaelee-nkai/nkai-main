import { useState, useEffect, useCallback } from "react";

// ══ MOCK DATA (실제는 Google Sheets API or GAS Web App으로 교체) ══
const MOCK_SALES = [
  { id:"ORD-2403-001", date:"2026-03-07 14:32", name:"김민준", email:"min@test.com", tier:"standard", amount:9900, archetype:"ENTJ", nscore:720, status:"sent" },
  { id:"ORD-2403-002", date:"2026-03-07 15:11", name:"이수연", email:"su@test.com", tier:"premium", amount:19900, archetype:"INFJ", nscore:810, status:"sent" },
  { id:"ORD-2403-003", date:"2026-03-07 16:45", name:"박지훈", email:"ji@test.com", tier:"standard", amount:9900, archetype:"ISTP", nscore:650, status:"sent" },
  { id:"ORD-2403-004", date:"2026-03-07 17:02", name:"최유리", email:"yu@test.com", tier:"standard", amount:9900, archetype:"ENFP", nscore:780, status:"pending" },
  { id:"ORD-2402-012", date:"2026-02-28 11:20", name:"정도현", email:"do@test.com", tier:"premium", amount:19900, archetype:"INTJ", nscore:890, status:"sent" },
  { id:"ORD-2402-011", date:"2026-02-27 09:15", name:"강서연", email:"se@test.com", tier:"standard", amount:9900, archetype:"ESFP", nscore:610, status:"sent" },
];

const MOCK_FREE = [
  { date:"2026-03-07", count:47 }, { date:"2026-03-06", count:38 },
  { date:"2026-03-05", count:55 }, { date:"2026-03-04", count:29 },
  { date:"2026-03-03", count:41 }, { date:"2026-03-02", count:33 },
  { date:"2026-03-01", count:62 },
];

const ARCHETYPE_DIST = [
  { type:"ENTJ", count:18 }, { type:"INTJ", count:15 }, { type:"ENFP", count:14 },
  { type:"INFJ", count:12 }, { type:"ISTP", count:10 }, { type:"ENTP", count:9 },
  { type:"ISFJ", count:8 },  { type:"기타", count:14 },
];

const GRADE_DIST = [
  { grade:"N1", count:5, color:"#EF4444" }, { grade:"N2", count:12, color:"#F59E0B" },
  { grade:"N3", count:28, color:"#3B82F6" }, { grade:"N4", count:35, color:"#6366F1" },
  { grade:"N5+", count:20, color:"#9CA3AF" },
];

const FUNNEL = [
  { step:"홈페이지 방문", count:1240, color:"#2D8CFF" },
  { step:"무료 분석 시작", count:623, color:"#3B82F6" },
  { step:"무료 분석 완료", count:441, color:"#6366F1" },
  { step:"결제 페이지 진입", count:89, color:"#F59E0B" },
  { step:"결제 완료", count:52, color:"#F0C674" },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState("overview");
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterTier, setFilterTier] = useState("all");
  const [searchQ, setSearchQ] = useState("");
  const [pulse, setPulse] = useState(false);

  // 실시간 펄스 효과
  useEffect(() => {
    const t = setInterval(() => setPulse(p => !p), 1500);
    return () => clearInterval(t);
  }, []);

  const totalRevenue = MOCK_SALES.reduce((s, o) => s + o.amount, 0);
  const todaySales = MOCK_SALES.filter(o => o.date.startsWith("2026-03-07"));
  const convRate = ((52 / 441) * 100).toFixed(1);
  const avgNscore = Math.round(MOCK_SALES.reduce((s, o) => s + o.nscore, 0) / MOCK_SALES.length);

  const filteredSales = MOCK_SALES.filter(o => {
    const tierOk = filterTier === "all" || o.tier === filterTier;
    const searchOk = !searchQ || o.name.includes(searchQ) || o.email.includes(searchQ) || o.id.includes(searchQ);
    return tierOk && searchOk;
  });

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
    liveTag: { display:"flex", alignItems:"center", gap:6, background:"rgba(34,197,94,.1)", border:"1px solid rgba(34,197,94,.3)", borderRadius:20, padding:"4px 12px", fontSize:11, color:c.green, fontWeight:700 },
    liveDot: { width:7, height:7, borderRadius:"50%", background:c.green, opacity: pulse ? 1 : 0.3, transition:"opacity .3s" },
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
      <div style={{ height:"100%", width:`${pct}%`, background:color, borderRadius:4, transition:".6s" }} />
    </div>
  );

  const TabNav = ({ items }) => (
    <div style={{ display:"flex", gap:4, marginBottom:20, background:c.mid, borderRadius:10, padding:4, border:`1px solid ${c.border}` }}>
      {items.map(({ id, label, icon }) => (
        <button key={id} onClick={() => setTab(id)} style={{
          ...styles.btn(c.blue, tab !== id), flex:1, border:"none",
          background: tab === id ? c.blue : "transparent",
          color: tab === id ? "#fff" : c.sub, borderRadius:7, padding:"8px 0"
        }}>{icon} {label}</button>
      ))}
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
          <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:10, color:c.green }}>
            <div style={{ ...styles.liveDot }} /> 실시간 운영 중
          </div>
        </div>
        <div style={styles.sbNav}>
          {[
            { id:"overview", icon:"📊", label:"대시보드" },
            { id:"sales", icon:"💳", label:"결제 내역" },
            { id:"funnel", icon:"🎯", label:"전환 퍼널" },
            { id:"users", icon:"👥", label:"고객 분석" },
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
          <div>GAS ✅ 토스 ✅ Gmail ✅</div>
          <div style={{ marginTop:4 }}>마지막 결제: 방금 전</div>
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
            {tab === "ai" && "🤖 AI 인사이트 엔진"}
            {tab === "system" && "⚙️ 자동화 시스템 상태"}
          </div>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <div style={styles.liveTag}><div style={styles.liveDot} />LIVE</div>
            <div style={{ fontSize:11, color:c.sub }}>2026-03-07 · 뉴린카이로스에이아이(주)</div>
          </div>
        </div>

        <div style={styles.content}>

          {/* ═══════════ OVERVIEW ═══════════ */}
          {tab === "overview" && (
            <>
              <div style={styles.grid4}>
                {[
                  { label:"누적 매출", val:`${(totalRevenue/10000).toFixed(1)}만원`, sub:`결제 ${MOCK_SALES.length}건`, color:c.gold },
                  { label:"오늘 결제", val:`${todaySales.length}건`, sub:`${(todaySales.reduce((s,o)=>s+o.amount,0)/10000).toFixed(1)}만원`, color:c.green },
                  { label:"전환율 (무료→유료)", val:`${convRate}%`, sub:"분석완료 대비", color:c.blue },
                  { label:"평균 N-Score", val:avgNscore, sub:"전체 고객", color:c.purple },
                ].map((k, i) => (
                  <div key={i} style={styles.kpiCard}>
                    <div style={styles.kpiLabel}>{k.label}</div>
                    <div style={{ ...styles.kpiVal, color:k.color }}>{k.val}</div>
                    <div style={styles.kpiSub}>{k.sub}</div>
                  </div>
                ))}
              </div>

              <div style={styles.grid2}>
                {/* 무료 분석 트렌드 */}
                <div style={styles.card}>
                  <div style={styles.cardTitle}>📈 무료 분석 트렌드 (7일)</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {MOCK_FREE.map((d, i) => (
                      <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ fontSize:11, color:c.sub, width:60 }}>{d.date.slice(5)}</div>
                        <MiniBar pct={(d.count/70)*100} color={i===0?c.gold:c.blue} />
                        <div style={{ fontSize:12, fontWeight:700, width:28, textAlign:"right" }}>{d.count}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 최근 결제 */}
                <div style={styles.card}>
                  <div style={styles.cardTitle}>💳 최근 결제
                    <span style={{ ...styles.badge(c.green), marginLeft:"auto" }}>{MOCK_SALES.filter(o=>o.status==="sent").length} 발송완료</span>
                  </div>
                  {MOCK_SALES.slice(0,5).map((o, i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:`1px solid rgba(26,58,92,.3)` }}>
                      <div style={{ width:36, height:36, background:`linear-gradient(135deg,${c.card},${c.mid})`, border:`1px solid ${c.border}`, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:900, color:c.gold }}>{o.archetype.slice(0,2)}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700 }}>{o.name}</div>
                        <div style={{ fontSize:10, color:c.sub }}>{o.date.slice(11)} · {o.archetype} · N{Math.floor(o.nscore/100)}</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontWeight:700, color:o.tier==="premium"?c.purple:c.gold }}>{(o.amount/10000).toFixed(1)}만</div>
                        <span style={styles.badge(o.status==="sent"?c.green:c.gold)}>{o.status==="sent"?"✓ 발송":"대기"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 아키타입 분포 */}
              <div style={styles.card}>
                <div style={styles.cardTitle}>🧬 아키타입 분포</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
                  {ARCHETYPE_DIST.map((a, i) => (
                    <div key={i} style={{ flex:"0 0 calc(25% - 8px)", background:"rgba(255,255,255,.03)", border:`1px solid ${c.border}`, borderRadius:8, padding:"12px 14px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                        <span style={{ fontWeight:700, color:c.gold }}>{a.type}</span>
                        <span style={{ fontSize:11, color:c.sub }}>{a.count}명</span>
                      </div>
                      <MiniBar pct={(a.count/20)*100} color={c.blue} height={6} />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ═══════════ SALES ═══════════ */}
          {tab === "sales" && (
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
                        <td style={{ ...styles.td, fontWeight:700, color:c.gold }}>{o.amount.toLocaleString()}원</td>
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
                      ["N-Score", selectedOrder.nscore], ["결제금액", `${selectedOrder.amount.toLocaleString()}원`],
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
          {tab === "funnel" && (
            <>
              <div style={styles.card}>
                <div style={styles.cardTitle}>🎯 전환 퍼널 — 실시간</div>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {FUNNEL.map((f, i) => {
                    const pct = i===0 ? 100 : Math.round((f.count/FUNNEL[0].count)*100);
                    const convFromPrev = i===0 ? 100 : Math.round((f.count/FUNNEL[i-1].count)*100);
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
                <div style={{ marginTop:20, padding:"14px 16px", background:"rgba(240,198,116,.08)", border:`1px solid rgba(240,198,116,.2)`, borderRadius:8 }}>
                  <div style={{ color:c.gold, fontWeight:700, marginBottom:6 }}>📌 핵심 지표</div>
                  <div style={{ display:"flex", gap:24, fontSize:12, color:c.sub }}>
                    <span>방문→분석완료: <strong style={{color:c.text}}>35.6%</strong></span>
                    <span>분석→결제: <strong style={{color:c.gold}}>11.8%</strong></span>
                    <span>방문→최종결제: <strong style={{color:c.green}}>4.2%</strong></span>
                  </div>
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
          {tab === "users" && (
            <>
              <div style={styles.grid2}>
                <div style={styles.card}>
                  <div style={styles.cardTitle}>🧬 상위 아키타입 TOP 5</div>
                  {ARCHETYPE_DIST.slice(0,5).map((a, i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                      <div style={{ width:20, height:20, background:`rgba(240,198,116,.15)`, borderRadius:4, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:900, color:c.gold }}>{i+1}</div>
                      <div style={{ fontWeight:700, color:c.gold, width:40 }}>{a.type}</div>
                      <MiniBar pct={(a.count/20)*100} color={c.blue} height={10} />
                      <div style={{ fontWeight:700, width:28, textAlign:"right" }}>{a.count}</div>
                    </div>
                  ))}
                </div>
                <div style={styles.card}>
                  <div style={styles.cardTitle}>💰 상품별 구매 비율</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                    {[
                      { label:"Standard (9,900원)", pct:68, count:MOCK_SALES.filter(o=>o.tier==="standard").length, color:c.gold },
                      { label:"Premium (19,900원)", pct:32, count:MOCK_SALES.filter(o=>o.tier==="premium").length, color:c.purple },
                    ].map((t, i) => (
                      <div key={i}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                          <span style={{ fontWeight:700, color:t.color }}>{t.label}</span>
                          <span style={{ fontSize:12, color:c.sub }}>{t.count}건 · {t.pct}%</span>
                        </div>
                        <MiniBar pct={t.pct} color={t.color} height={16} />
                      </div>
                    ))}
                    <div style={{ padding:"12px 14px", background:"rgba(45,140,255,.08)", borderRadius:8, fontSize:12, color:c.sub }}>
                      Premium 업셀 전환율 향상 여지 있음 — 현재 32% → 목표 40%
                    </div>
                  </div>
                </div>
              </div>

              <div style={styles.card}>
                <div style={styles.cardTitle}>🎯 3대 지표 고객 평균</div>
                <div style={{ display:"flex", gap:16 }}>
                  {[
                    { label:"경제 감각", val:72, color:"#F0C674" },
                    { label:"투자 기회 포착력", val:68, color:c.blue },
                    { label:"위기 대응력", val:75, color:c.green },
                  ].map((k, i) => (
                    <div key={i} style={{ flex:1, background:"rgba(255,255,255,.03)", border:`1px solid ${c.border}`, borderRadius:10, padding:"16px 14px", textAlign:"center" }}>
                      <div style={{ fontSize:10, color:c.sub, marginBottom:8, fontWeight:700 }}>{k.label}</div>
                      <div style={{ fontSize:32, fontWeight:900, color:k.color, marginBottom:8 }}>{k.val}</div>
                      <MiniBar pct={k.val} color={k.color} height={6} />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ═══════════ AI INSIGHTS ═══════════ */}
          {tab === "ai" && (
            <>
              <div style={{ ...styles.card, border:`1px solid rgba(240,198,116,.3)`, background:"rgba(240,198,116,.04)" }}>
                <div style={styles.cardTitle}>🤖 AI 분석 엔진 — Claude Sonnet 직접 연동</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginBottom:16 }}>
                  {[
                    { label:"📊 전체 매출 인사이트 분석", prompt:`N-KAI 플랫폼 운영 데이터를 분석해줘. 총 매출 ${totalRevenue.toLocaleString()}원, 결제 ${MOCK_SALES.length}건, 전환율 ${convRate}%, 평균 N-Score ${avgNscore}. 가장 많은 아키타입은 ENTJ(18명). 현재 비즈니스 상태 진단과 즉시 실행 가능한 개선안 3가지를 제시해줘.` },
                    { label:"🎯 전환율 개선 전략", prompt:`N-KAI 서비스의 전환 퍼널: 방문 1240 → 무료분석시작 623 → 완료 441 → 결제진입 89 → 결제완료 52. 전환율이 가장 낮은 병목 구간을 찾고 개선 전략 3가지를 구체적 수치와 함께 제시해줘.` },
                    { label:"💰 수익화 확대 방안", prompt:`N-KAI의 현재 상품: Standard 9,900원(68%), Premium 19,900원(32%). 평균 N-Score ${avgNscore}점. 최다 아키타입 ENTJ. 수익을 30% 이상 늘리기 위한 새로운 수익화 전략 3가지를 제시해줘.` },
                    { label:"🧬 아키타입별 맞춤 마케팅", prompt:`N-KAI 고객 중 ENTJ 18명, INTJ 15명, ENFP 14명이 가장 많아. 각 아키타입의 금융 성향 특성에 맞는 맞춤 마케팅 메시지를 각각 2줄씩 작성해줘.` },
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

              <div style={styles.card}>
                <div style={styles.cardTitle}>📋 자동 분석 스케줄</div>
                {[
                  { time:"매일 09:00", task:"전일 매출 자동 요약 + Claude 인사이트 생성", status:"active" },
                  { time:"매주 월요일", task:"주간 전환율 분석 + 아키타입 트렌드 리포트", status:"active" },
                  { time:"결제 즉시", task:"신규 고객 아키타입 자동 분류 + PDF 발송", status:"active" },
                  { time:"매월 1일", task:"월간 성과 분석 + 다음달 전략 수립 브리핑", status:"pending" },
                ].map((s, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:`1px solid rgba(26,58,92,.3)` }}>
                    <span style={styles.badge(s.status==="active"?c.green:c.sub)}>{s.status==="active"?"● 활성":"○ 준비"}</span>
                    <div style={{ width:120, fontSize:11, color:c.gold, fontWeight:700 }}>{s.time}</div>
                    <div style={{ flex:1, fontSize:12 }}>{s.task}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ═══════════ SYSTEM ═══════════ */}
          {tab === "system" && (
            <>
              <div style={styles.card}>
                <div style={styles.cardTitle}>⚙️ 자동화 파이프라인 상태</div>
                <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
                  {[
                    { name:"토스페이먼츠 Webhook", status:"정상", latency:"~10초", color:c.green, desc:"결제 승인 → GAS confirmTossPayment()" },
                    { name:"Claude AI API", status:"정상", latency:"~15초", color:c.green, desc:"generateAIInterpretation() — full 모드" },
                    { name:"buildPdfReportHtml()", status:"v2.0 적용 대기", latency:"~2초", color:c.gold, desc:"코어에너지 통일, 시스템폰트 적용 버전" },
                    { name:"DriveApp PDF 변환", status:"정상", latency:"~20초", color:c.green, desc:"HTML → PDF (시스템폰트 안전)" },
                    { name:"Gmail 자동발송", status:"정상", latency:"~5초", color:c.green, desc:"GmailApp.sendEmail() — PDF 첨부" },
                    { name:"Google Sheets 로그", status:"정상", latency:"실시간", color:c.green, desc:"결제기록 · PDF발송로그 · 사용자DB 자동 기록" },
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
                  <div style={styles.cardTitle}>📁 Google Sheets 연결 DB</div>
                  {[
                    { name:"결제기록", cols:"주문번호·이메일·금액·상태·일시", rows:MOCK_SALES.length, active:true },
                    { name:"PDF발송로그", cols:"발송완료여부·발송시각·수신확인", rows:MOCK_SALES.filter(o=>o.status==="sent").length, active:true },
                    { name:"무료분석기록", cols:"분석ID·아키타입·N-Score·일시", rows:441, active:true },
                    { name:"사용자DB", cols:"이메일·이름·아키타입·등급", rows:441, active:true },
                  ].map((s, i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:`1px solid rgba(26,58,92,.3)` }}>
                      <span style={{ color:c.green, fontSize:16 }}>📊</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700 }}>{s.name}</div>
                        <div style={{ fontSize:10, color:c.sub }}>{s.cols}</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontWeight:700, color:c.gold }}>{s.rows}행</div>
                        <span style={styles.badge(s.active?c.green:c.sub)}>연결됨</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={styles.card}>
                  <div style={styles.cardTitle}>🔧 긴급 실행 도구</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {[
                      { label:"🧪 forceSendPdfTest()", desc:"테스트 PDF 즉시 발송", color:c.blue },
                      { label:"🗑️ clearPdfLog()", desc:"중복방지 로그 초기화", color:c.gold },
                      { label:"✅ testV791()", desc:"폴백 텍스트 검증", color:c.green },
                      { label:"🔄 buildPdfReportHtml v2 적용", desc:"코어에너지 통일 버전 교체", color:c.purple },
                    ].map((t, i) => (
                      <div key={i} style={{ display:"flex", alignItems:"center", gap:10, background:"rgba(255,255,255,.03)", borderRadius:8, padding:"10px 12px", border:`1px solid ${c.border}` }}>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:700, color:t.color, fontSize:12 }}>{t.label}</div>
                          <div style={{ fontSize:10, color:c.sub }}>{t.desc}</div>
                        </div>
                        <button style={{ ...styles.btn(t.color, true), padding:"5px 10px", fontSize:11 }}>실행</button>
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
