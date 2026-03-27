import { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════════════
// N-KAI 자율진화 OS — SDK ENGINE v3 LIVE
// 510건 완전체 (카드466+질적44) · v6 질적통합
// 5축 입력 · 4대 특허 · 8대 행동법칙 · 예측 100%
// ═══════════════════════════════════════════════════════════

const TABS = ["▶ ENGINE", "📊 DATA", "🧬 DNA", "⚖ LAWS", "🎯 PREDICT"];

// ── 5-AXIS INPUT SOURCES ──
const FIVE_AXES_INPUT = [
  { axis: "①", name: "카드결제", eng: "MCC Transaction", count: "466건", color: "#00D4FF", desc: "MCC업종코드 · 가맹점 · 금액 · 시간 · 요일", examples: "배민 비빔밥 ₩11,900 / 한국관광나이트 ₩256,000" },
  { axis: "②", name: "선천기질DNA", eng: "Innate DNA", count: "사주 4주", color: "#F39C12", desc: "생년월일시 → 오행 에너지 매핑 → 9축 기질 벡터", examples: "辛酉/辛丑/辛丑/己亥 → 극강금국 → 분석95/실행25" },
  { axis: "③", name: "캘린더/관계", eng: "Social Graph", count: "42건", color: "#9B59B6", desc: "미팅 · 만남 · 이동 · 가족행사 · 사업미팅", examples: "장명형 부산미팅 / 아버지 샤브샤브 / 김교완 회장" },
  { axis: "④", name: "생리데이터", eng: "Bio Signal", count: "44건", color: "#27AE60", desc: "모닝루틴 · 쾌변 · 수면 · 건강검진 · 절주상태", examples: "모닝루틴 13일연속 / 쾌변 연속 / 폐CT 이상없음" },
  { axis: "⑤", name: "질적관측", eng: "Qualitative", count: "44건", color: "#FF6B6B", desc: "자가선언 · 음주회피 · 가족의례 · 셀프케어", examples: "'매일 루틴이다' 선언 / 카모마일차 선택(음주확률95%)" },
];

// ── REAL Transaction Feed (from 466건 timeline) ──
const TX_FEED = [
  { id:1, date:"09/24", merchant:"하나모리", amt:3100, cat:"기타", phase:0, type:"양적" },
  { id:11, date:"09/27", merchant:"오징어세상", amt:82000, cat:"외식", phase:0, flag:"⚠ 고액사교", type:"양적" },
  { id:49, date:"10/09", merchant:"가가네 꼼장어", amt:63000, cat:"외식", phase:0, flag:"⚠ 음주", type:"양적" },
  { id:179, date:"11/24", merchant:"한국관광나이트", amt:256000, cat:"유흥", phase:0, flag:"🔴", type:"양적" },
  { id:215, date:"12/08", merchant:"페이스토리(사무)", amt:1500, cat:"사무", phase:1, type:"양적" },
  { id:0, date:"12/중", merchant:"계란후라이+브로콜리(홈쿡최초)", amt:0, cat:"질적", phase:1, flag:"⭐", type:"질적" },
  { id:300, date:"01/10", merchant:"배민(포케볼)", amt:13000, cat:"배달", phase:2, ws:82, type:"양적" },
  { id:0, date:"01/12", merchant:"3일 결제공백(번아웃의심)", amt:0, cat:"질적", phase:2, flag:"⚠ T-60", type:"질적" },
  { id:0, date:"02/12", merchant:"물+계란2+요거트(모닝루틴 첫보고)", amt:0, cat:"질적", phase:3, flag:"⭐⭐", type:"질적" },
  { id:0, date:"02/13", merchant:"세브란스 폐CT '이상없음'", amt:0, cat:"질적", phase:3, flag:"⭐⭐⭐", type:"질적" },
  { id:0, date:"02/14", merchant:"카모마일차 선택(음주확률95%)", amt:0, cat:"질적", phase:3, flag:"⭐⭐", type:"질적" },
  { id:0, date:"02/14", merchant:"'매일 루틴이다' 자가선언", amt:0, cat:"질적", phase:3, flag:"⭐⭐⭐", type:"질적" },
  { id:445, date:"02/24", merchant:"배민(강된장비빔밥)", amt:10500, cat:"배달", phase:3, ws:85, type:"양적" },
  { id:452, date:"02/25", merchant:"배민취소→3분후김치찌개교정", amt:13000, cat:"배달", phase:3, flag:"⭐", type:"양적" },
  { id:0, date:"02/25", merchant:"완전쾌변(음주후에도 유지)", amt:0, cat:"질적", phase:3, flag:"⭐⭐⭐", type:"질적" },
  { id:0, date:"02/26", merchant:"밤샘후에도 모닝루틴 유지", amt:0, cat:"질적", phase:3, flag:"⭐", type:"질적" },
  { id:0, date:"02/27", merchant:"모닝루틴 사진확인(13일+실제1270일)", amt:0, cat:"질적", phase:3, flag:"⭐", type:"질적" },
  { id:0, date:"02/28", merchant:"동해횟집 장명형미팅", amt:85000, cat:"외식", phase:3, flag:"✅사업", type:"양적" },
  { id:0, date:"03/01", merchant:"오늘 — SDK 데모 완성", amt:0, cat:"질적", phase:3, flag:"🚀", type:"질적" },
];

// ── Bayesian v6 (10회 + B-CORRECTION) ──
const BAYES = [
  { id:1, period:"09~10월", evidence:"외식45%+음주35%", prior:0.50, post:0.65, delta:"+0.15", verdict:"외식 중심 확인" },
  { id:2, period:"10월", evidence:"유흥 496K (나이트+어썸바)", prior:0.12, post:0.25, delta:"+0.13", verdict:"⚠ 유흥 탐지" },
  { id:3, period:"10월말", evidence:"카드교체(개명)", prior:0.65, post:0.55, delta:"-0.10", verdict:"🆕 행동 리셋" },
  { id:4, period:"11월", evidence:"배달512K(27%)+유흥256K", prior:0.55, post:0.60, delta:"+0.05", verdict:"전환기 혼재" },
  { id:5, period:"12월", evidence:"배달523K+홈쿡최초", prior:0.60, post:0.70, delta:"+0.10", verdict:"건강식 전환" },
  { id:6, period:"1월", evidence:"비빔밥루틴+음주0건", prior:0.70, post:0.82, delta:"+0.12", verdict:"5극 확정" },
  { id:7, period:"2월초", evidence:"포케볼+모닝루틴시작", prior:0.82, post:0.88, delta:"+0.06", verdict:"강화 학습" },
  { id:8, period:"2월중", evidence:"모닝루틴9일+쾌변", prior:0.88, post:0.93, delta:"+0.05", verdict:"습관 고착" },
  { id:9, period:"2월말", evidence:"배민취소→김치찌개3분교정", prior:0.93, post:0.95, delta:"+0.02", verdict:"자기교정" },
  { id:10, period:"종합", evidence:"454건 전체 궤적", prior:0.50, post:0.95, delta:"+0.45", verdict:"⭐ 수렴 완료" },
  { id:"B", period:"B-COR", evidence:"모닝루틴 3.5년=1270일+ 확인", prior:0.84, post:0.99, delta:"+0.15", verdict:"⭐⭐ 전면 재분류" },
];

// ── ROC v6 ──
const ROC = [
  { date:"10/16", grade:"🔴", item:"해외결제 거절 6회", val:0.95 },
  { date:"10월", grade:"🔴", item:"유흥비 496K", val:0.80 },
  { date:"11/24", grade:"🔴", item:"심야유흥 256K", val:0.92 },
  { date:"12/05", grade:"🟡", item:"치킨 226K 심야", val:0.72 },
  { date:"01/12", grade:"🟡", item:"3일 결제공백(번아웃)", val:0.70 },
  { date:"02/02", grade:"🔴", item:"AWS 결제 거절 1차", val:0.85 },
  { date:"02/06", grade:"🔴", item:"AWS 결제 거절 2차", val:0.88 },
  { date:"02/08", grade:"🟡", item:"심야택시 04:06", val:0.68 },
  { date:"02/16", grade:"🟡", item:"설연휴 음주2회", val:0.72 },
  { date:"02/25", grade:"🟡", item:"모닝변형(음주영향)", val:0.67 },
  { date:"02/27", grade:"🟢", item:"모닝루틴 13일연속", val:0.05 },
  { date:"03/01", grade:"🟢", item:"전 항목 최적상태", val:0.03 },
];

// ── Clusters v6 ──
const CLUSTERS = [
  { name:"C1 비빔밥", pct:["-","-","출현","10%","35%","40%"], verdict:"⭐ 핵심1", color:"#27AE60" },
  { name:"C2 포케볼", pct:["-","-","-","-","발견","15%"], verdict:"⭐ 핵심2", color:"#00D4FF" },
  { name:"C3 베이글", pct:["-","-","-","출현","12%","10%"], verdict:"간식 안정", color:"#F39C12" },
  { name:"C4 국물해장", pct:["-","-","8%","5%","8%","8%"], verdict:"리셋식", color:"#9B59B6" },
  { name:"C5 김치찜", pct:["-","-","-","-","5%","12%"], verdict:"🆕 성장", color:"#FF6B6B" },
  { name:"CX 유흥", pct:["45%","35%","13%","12%","0%","0%"], verdict:"✅ 소멸", color:"#555" },
];

// ── 8 Behavior Laws ──
const LAWS = [
  { name:"크레이빙 3일 포화", def:"동일 크레이빙 3일 → 반대 전환", verify:"2회", conf:"85%", status:"✅", algo:"ROC+CDE" },
  { name:"충족 안 된 의도", def:"이월된 의도 3회째 반드시 실행", verify:"1회", conf:"70%", status:"⚠", algo:"베이지안" },
  { name:"모닝루틴 내구성", def:"7일+ 루틴 → 1회 이탈에도 유지", verify:"1회", conf:"75%", status:"⚠", algo:"CDE" },
  { name:"습관 vs 신체 교정", def:"음주 후 신체시그널이 3분에 override", verify:"1회", conf:"70%", status:"⚠", algo:"4대통합" },
  { name:"서브클러스터 분화", def:"3회+ 반복 → 미세변주 자동생성", verify:"4회", conf:"90%", status:"✅", algo:"비지도학습" },
  { name:"쾌변 공식 v1", def:"발효식+식이섬유+모닝루틴→쾌변", verify:"4회", conf:"90%", status:"✅", algo:"ROC+건강축" },
  { name:"쾌변 공식 v2", def:"7일+ 루틴 → 이탈해도 쾌변 유지", verify:"1회", conf:"75%", status:"⚠", algo:"CDE+베이지안" },
  { name:"음주 후 24h 궤적", def:"고기+음주→경량아침→쾌변→국물해장", verify:"1회", conf:"70%", status:"🆕", algo:"CDE 전구간" },
];

// ── Prediction Performance ──
const PREDICTIONS = [
  { date:"02/23 점심", predict:"비빔밥 60%", actual:"고추장 비빔밥", hit:"Y", key:"이월의도 3회차", algo:"베이지안+CDE" },
  { date:"02/23 저녁", predict:"포케볼 40%", actual:"새우아보카도 샐러드볼", hit:"Y", key:"매콤3일 포화→담백전환", algo:"ROC+비지도" },
  { date:"02/24 점심", predict:"비빔밥/국물 60%", actual:"강된장 비빔밥", hit:"Y", key:"담백→한식 복귀", algo:"베이지안" },
  { date:"02/25 저녁", predict:"국물 한식 55%", actual:"김치찌개(3분교정)", hit:"Y", key:"음주후 신체교정", algo:"4대 통합" },
  { date:"02/25 쾌변", predict:"쾌변 가능 70%", actual:"완전쾌변", hit:"Y", key:"루틴내구성 검증", algo:"CDE+ROC" },
];

// ── DNA Profile ──
const DNA = {
  birth: "1982.01.18 亥時 (辛酉/辛丑/辛丑/己亥)",
  type: "辛金 3개 극강금국",
  axes: [
    { name:"분석력(金)", innate:95, current:92, note:"극강 핵심기질" },
    { name:"실행력(火)", innate:25, current:68, note:"丙辛合 활성화" },
    { name:"사교성(水)", innate:60, current:55, note:"선택적 관계" },
    { name:"안정성(土)", innate:70, current:78, note:"丑土 루틴력" },
    { name:"성장성(木)", innate:15, current:45, note:"金克木 극복중" },
  ]
};

// ── Neural CDE Phases ──
const CDE = [
  { phase:"Phase 0", period:"09~11월", data:"194건", nscore:"-", h:"h₀=[외식0.45,음주0.35,유흥0.12]", sigma:"최대", verdict:"기저선" },
  { phase:"Phase 1", period:"12월", data:"90건", nscore:"52", h:"h₁=[배달0.26,건강식0.10]", sigma:"↓안정화", verdict:"5극 원형" },
  { phase:"Phase 2", period:"1월", data:"85건", nscore:"59→66", h:"h₂=[건강식0.40,음주0.00]", sigma:"↓↓수렴", verdict:"5극 확정" },
  { phase:"Phase 3", period:"2월", data:"97건", nscore:"74", h:"h₃=[루틴0.95,5극0.85]", sigma:"최저", verdict:"⭐ 자율진화" },
];

// ── Shared UI Components ──
const Box = ({ children, border, glow, style={} }) => (
  <div style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${border||"rgba(255,255,255,0.06)"}`, borderRadius:14, padding:"14px 12px", boxShadow:glow?`0 0 16px ${glow}`:"none", marginBottom:8, ...style }}>{children}</div>
);
const Lbl = ({ children, color }) => <div style={{ fontSize:8, fontWeight:700, letterSpacing:"0.12em", color:color||"rgba(255,255,255,0.3)", textTransform:"uppercase", marginBottom:6 }}>{children}</div>;
const P = ({ children, color }) => <span style={{ fontSize:7, fontWeight:700, color, background:`${color}15`, border:`1px solid ${color}30`, borderRadius:4, padding:"1px 5px", marginRight:3 }}>{children}</span>;
const M = ({ children, color, size }) => <span style={{ fontFamily:"'JetBrains Mono',monospace", color:color||"#00D4FF", fontSize:size||13, fontWeight:700 }}>{children}</span>;
const Bar = ({ val, max=100, color, h=4 }) => (
  <div style={{ width:"100%", height:h, background:"rgba(255,255,255,0.05)", borderRadius:h, overflow:"hidden" }}>
    <div style={{ width:`${Math.min((val/max)*100,100)}%`, height:"100%", background:color, borderRadius:h, transition:"width 0.6s" }} />
  </div>
);

// ═══════════════ MAIN APP ═══════════════
export default function NKaiSDKv3() {
  const [tab, setTab] = useState(0);
  const [phase, setPhase] = useState(0);
  const [txIdx, setTxIdx] = useState(0);
  const [logs, setLogs] = useState([]);
  const [detailPanel, setDetailPanel] = useState(null);
  const logRef = useRef(null);

  const addLog = (t, c) => setLogs(p => [...p, { t, c, ts: new Date().toLocaleTimeString("ko-KR",{hour12:false}) }]);

  useEffect(() => { if(logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [logs]);

  const runEngine = () => {
    setPhase(1); setLogs([]); setTxIdx(0); setDetailPanel(null);
    const S = [
      // L1 Data Collection
      {d:250, fn:()=>{ addLog("━━━ N-KAI SDK ENGINE v3.0 · 510건 완전체 ━━━","#9B59B6"); }},
      {d:300, fn:()=>{ addLog("[L1] ① 카드결제 466건 로딩 · MCC업종 매핑","#00D4FF"); setTxIdx(1); }},
      {d:250, fn:()=>{ addLog("[L1]   식비47% | 생필품22% | 교통8% | 의료6% | 유흥3% | IT4% | 기타10%","#00D4FF"); }},
      {d:250, fn:()=>{ addLog("[L1] ② 선천기질DNA · 辛酉/辛丑/辛丑/己亥 · 극강금국 벡터 로딩","#F39C12"); }},
      {d:250, fn:()=>{ addLog("[L1] ③ 캘린더 42건 · 미팅23회+만남15회+이동12회","#9B59B6"); }},
      {d:250, fn:()=>{ addLog("[L1] ④ 생리데이터 · 모닝루틴13일+쾌변연속+폐CT정상","#27AE60"); }},
      {d:300, fn:()=>{ addLog("[L1] ⑤ 질적관측 44건 · 자가선언+음주회피+가족의례+셀프케어","#FF6B6B"); setPhase(2); }},
      {d:200, fn:()=>{ addLog("[L1] → 5축 입력 완료: 510건 (양적466+질적44)","#C0C0C0"); }},

      // Bayesian
      {d:400, fn:()=>{ addLog("",""); addLog("━━━ ① 베이지안 추론 · 10회 갱신+B-보정 (특허①) ━━━","#FF6B6B"); }},
      {d:300, fn:()=>{ addLog("[BAYES] #1 P(외식)=0.50→0.65 | #2 P(유흥)=0.12→0.25 | #3 리셋 0.65→0.55","#FF6B6B"); setTxIdx(3); }},
      {d:300, fn:()=>{ addLog("[BAYES] #4~6 전환기→건강전환→5극확정 | 0.55→0.60→0.70→0.82","#FF6B6B"); setTxIdx(6); }},
      {d:300, fn:()=>{ addLog("[BAYES] #7~9 모닝루틴+쾌변+3분교정 | 0.82→0.88→0.93→0.95","#FF6B6B"); setTxIdx(10); }},
      {d:350, fn:()=>{ addLog("[BAYES] B-CORRECTION: 모닝루틴 12일→1,270일+ 재분류 → P=0.99+ ⭐","#FF6B6B"); setPhase(3); }},

      // ROC
      {d:400, fn:()=>{ addLog("",""); addLog("━━━ ② ROC 임계치 캘리브레이션 · 12건 (특허②) ━━━","#00D4FF"); }},
      {d:250, fn:()=>{ addLog("[ROC] 🔴 해외결제6회(0.95) | 유흥496K(0.80) | 심야유흥(0.92) | AWS거절×2(0.85,0.88)","#FF6B6B"); }},
      {d:250, fn:()=>{ addLog("[ROC] 🟡 치킨226K(0.72) | 3일공백(0.70) | 심야택시(0.68) | 설연휴음주(0.72)","#F39C12"); }},
      {d:300, fn:()=>{ addLog("[ROC] 🟢 모닝루틴13일(0.05) | 전항목 최적(0.03) → T-60 임계 0.65 기준","#27AE60"); setPhase(4); }},

      // Clustering
      {d:400, fn:()=>{ addLog("",""); addLog("━━━ ③ 비지도학습 클러스터 · 5극+소멸 (특허③) ━━━","#27AE60"); }},
      {d:300, fn:()=>{ addLog("[CLUSTER] C1 비빔밥 40% ⭐ | C2 포케볼 15% ⭐ | C3 베이글 10%","#27AE60"); setTxIdx(13); }},
      {d:250, fn:()=>{ addLog("[CLUSTER] C4 국물해장 8% | C5 김치찜 12% 🆕 | CX 유흥 0% ✅소멸","#27AE60"); }},
      {d:300, fn:()=>{ addLog("[CLUSTER] 서브클러스터 분화: 1.0→1.1 | 2.0→2.1 | 3.0→3.2 | 5.0→5.1","#27AE60"); setPhase(5); }},

      // Neural CDE
      {d:400, fn:()=>{ addLog("",""); addLog("━━━ ④ Neural CDE 궤적 시뮬레이션 (특허④) ━━━","#F39C12"); }},
      {d:250, fn:()=>{ addLog("[CDE] Phase0 h₀=[외식0.45,음주0.35] σ=최대 → Phase1 h₁=[배달0.26] σ↓ N=52","#F39C12"); }},
      {d:250, fn:()=>{ addLog("[CDE] Phase2 h₂=[건강식0.40,음주0.00] σ↓↓ N=66 → Phase3 h₃=[루틴0.95] σ=최저 N=74","#F39C12"); setTxIdx(15); }},
      {d:300, fn:()=>{ addLog("[CDE] 60일 예측: D+30 N-Score 77(±3) | D+60 N-Score 80(±4)","#F39C12"); setPhase(6); }},

      // Behavior Laws
      {d:400, fn:()=>{ addLog("",""); addLog("━━━ ⚡ 행동법칙 엔진 · 8대 법칙 적용 ━━━","#9B59B6"); }},
      {d:300, fn:()=>{ addLog("[LAW] ✅ 크레이빙3일포화(85%) | ✅ 서브클러스터분화(90%) | ✅ 쾌변공식v1(90%)","#27AE60"); }},
      {d:250, fn:()=>{ addLog("[LAW] ⚠ 충족안된의도(70%) | 루틴내구성(75%) | 습관vs신체(70%) | 쾌변v2(75%)","#F39C12"); }},
      {d:300, fn:()=>{ addLog("[LAW] 🆕 음주후24h궤적(70%) — 신규 발견 · 추가 검증 대기","#9B59B6"); }},

      // Profile + Prediction
      {d:400, fn:()=>{ addLog("",""); addLog("━━━ 🎯 프로파일 갱신 + 예측 성과 ━━━","#9B59B6"); }},
      {d:300, fn:()=>{ addLog("[PROFILE] 아키타입: '전략적 설계자' | 상위 23% | 진화 확률 78%","#9B59B6"); setTxIdx(17); }},
      {d:250, fn:()=>{ addLog("[PROFILE] DNA 융합: 선천 金95 × 후천 火68 = 丙辛合 활성화 62%","#9B59B6"); }},
      {d:300, fn:()=>{ addLog("[PREDICT] 최근 5건 예측: 5/5 적중 (100%) | 누적 식사예측 73%+ | 쾌변 91%","#27AE60"); setTxIdx(18); }},

      // Complete
      {d:500, fn:()=>{
        addLog("","");
        addLog("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━","#27AE60");
        addLog("✅ SDK CYCLE COMPLETE — 자율진화 1회전 완료","#27AE60");
        addLog("입력: 5축 510건 | 베이지안 10회+B보정 | ROC 12건 | 클러스터 5극+소멸","#C0C0C0");
        addLog("법칙: 8대 행동법칙 | 예측: 최근 5/5 (100%) | N-Score: 52→74","#C0C0C0");
        addLog("내러티브 복원율: 97.3% | 모닝루틴: 1,270일+ 확정경로","#27AE60");
        addLog("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━","#27AE60");
        addLog("매일 이 사이클이 자동 반복 → 자율진화 OS","#9B59B6");
        setPhase(7);
      }},
    ];
    let cum=0;
    S.forEach(s=>{ cum+=s.d; setTimeout(s.fn,cum); });
  };

  const pL=["대기","L1 5축수집","①베이지안","②ROC","③클러스터","④CDE","⚡법칙+프로파일","✅완료"];
  const pC=["#555","#C0C0C0","#FF6B6B","#00D4FF","#27AE60","#F39C12","#9B59B6","#27AE60"];

  // ── TAB: ENGINE ──
  const EngineTab = () => (
    <div>
      {/* Pipeline */}
      <div style={{display:"flex",gap:1,marginBottom:8}}>
        {pL.map((l,i)=>(
          <div key={i} style={{flex:1,textAlign:"center"}}>
            <div style={{height:3,borderRadius:2,background:i<=phase?pC[i]:"rgba(255,255,255,0.04)",transition:"background 0.4s",boxShadow:i===phase&&phase>0?`0 0 5px ${pC[i]}50`:"none"}} />
            <div style={{fontSize:5.5,marginTop:2,color:i<=phase?pC[i]:"rgba(255,255,255,0.12)",fontWeight:i===phase?700:400}}>{l}</div>
          </div>
        ))}
      </div>

      {/* Run Button */}
      <div onClick={phase===0||phase===7?runEngine:undefined} style={{
        padding:"12px",borderRadius:12,textAlign:"center",marginBottom:8,cursor:phase===0||phase===7?"pointer":"default",
        background:phase>0&&phase<7?`${pC[phase]}10`:"linear-gradient(135deg,rgba(0,212,255,0.1),rgba(155,89,182,0.1))",
        border:`1px solid ${phase>0&&phase<7?pC[phase]+"40":"rgba(0,212,255,0.15)"}`,
      }}>
        <div style={{fontSize:14,fontWeight:800,color:phase===0?"#fff":phase===7?"#27AE60":pC[phase]}}>
          {phase===0?"▶ SDK 엔진 실행 — 510건 5축 데이터":phase===7?"✅ 완료 — 다시 실행":`⚡ ${pL[phase]} 처리 중...`}
        </div>
        {phase===0&&<div style={{fontSize:8,color:"rgba(255,255,255,0.25)",marginTop:3}}>카드466건+질적44건 → 4대 알고리즘+8대 법칙 → 자율진화 프로파일</div>}
      </div>

      {/* TX Feed */}
      {phase>0&&(
        <Box border="rgba(243,156,18,0.12)" style={{maxHeight:90,overflowY:"auto"}}>
          <Lbl color="#F39C12">실시간 데이터 피드</Lbl>
          {TX_FEED.slice(0,txIdx+1).map((tx,i)=>(
            <div key={i} style={{display:"flex",gap:4,padding:"3px 0",borderBottom:"1px solid rgba(255,255,255,0.02)",fontSize:8,opacity:i===txIdx?1:0.4}}>
              <span style={{width:32,color:"rgba(255,255,255,0.25)"}}>{tx.date}</span>
              <P color={tx.type==="질적"?"#FF6B6B":"#00D4FF"}>{tx.type}</P>
              <span style={{flex:1,color:"rgba(255,255,255,0.5)"}}>{tx.merchant}</span>
              {tx.amt>0&&<M size={8} color={tx.amt>50000?"#FF6B6B":"#27AE60"}>₩{tx.amt.toLocaleString()}</M>}
              {tx.flag&&<span style={{fontSize:6}}>{tx.flag}</span>}
            </div>
          ))}
        </Box>
      )}

      {/* Console */}
      <Box border={phase>0?`${pC[Math.min(phase,7)]}15`:undefined}>
        <Lbl>SDK ENGINE CONSOLE</Lbl>
        <div ref={logRef} style={{background:"rgba(0,0,0,0.5)",borderRadius:8,padding:8,fontFamily:"'JetBrains Mono',monospace",fontSize:8,height:200,overflowY:"auto"}}>
          {logs.length===0?(
            <div style={{color:"rgba(255,255,255,0.12)"}}>
              {">"} nkai-sdk v3.0 ready · 510건 loaded{"\n"}
              {">"} 5-axis: card(466)+dna+calendar+bio+qual(44){"\n"}
              {">"} patents: 4 active · laws: 8 discovered{"\n"}
              {">"} press RUN to start autonomous cycle
            </div>
          ):logs.map((l,i)=>(
            <div key={i} style={{color:l.c||"rgba(255,255,255,0.25)",marginBottom:l.t===""?3:1.5,lineHeight:1.5}}>
              {l.t&&<><span style={{color:"rgba(255,255,255,0.08)"}}>[{l.ts}]</span> {l.t}</>}
            </div>
          ))}
        </div>
      </Box>

      {/* Post-run panels */}
      {phase===7&&(<>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr",gap:4,marginBottom:8}}>
          {[
            {l:"총 데이터",v:"510",u:"건",c:"#C0C0C0"},
            {l:"N-Score",v:"74",u:"점",c:"#9B59B6"},
            {l:"복원율",v:"97.3",u:"%",c:"#FF6B6B"},
            {l:"최근예측",v:"100",u:"%",c:"#27AE60"},
            {l:"D+60",v:"80",u:"점",c:"#F39C12"},
          ].map((c,i)=>(
            <div key={i} style={{padding:"8px 4px",textAlign:"center",background:`${c.c}08`,border:`1px solid ${c.c}12`,borderRadius:8}}>
              <div style={{fontSize:6,color:c.c}}>{c.l}</div>
              <M size={16} color={c.c}>{c.v}</M>
              <div style={{fontSize:6,color:"rgba(255,255,255,0.15)"}}>{c.u}</div>
            </div>
          ))}
        </div>

        {/* Detail toggles */}
        <div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:8}}>
          {[
            {k:"5axis",l:"5축 입력",c:"#00D4FF"},{k:"bayes",l:"베이지안",c:"#FF6B6B"},
            {k:"roc",l:"ROC",c:"#00D4FF"},{k:"cluster",l:"클러스터",c:"#27AE60"},
            {k:"cde",l:"CDE",c:"#F39C12"},{k:"profile",l:"프로파일",c:"#9B59B6"},
          ].map(b=>(
            <div key={b.k} onClick={()=>setDetailPanel(detailPanel===b.k?null:b.k)} style={{padding:"5px 8px",borderRadius:6,fontSize:8,fontWeight:700,cursor:"pointer",
              background:detailPanel===b.k?`${b.c}18`:"rgba(255,255,255,0.02)",color:detailPanel===b.k?b.c:"rgba(255,255,255,0.3)",
              border:`1px solid ${detailPanel===b.k?b.c+"35":"rgba(255,255,255,0.05)"}`}}>{b.l}</div>
          ))}
        </div>

        {detailPanel==="5axis"&&(
          <Box border="rgba(0,212,255,0.15)">
            <Lbl color="#00D4FF">5축 입력 소스 — SDK 데이터 파이프라인</Lbl>
            {FIVE_AXES_INPUT.map((a,i)=>(
              <div key={i} style={{padding:"8px 0",borderBottom:i<4?"1px solid rgba(255,255,255,0.03)":"none"}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                  <span style={{fontSize:12,fontWeight:800,color:a.color}}>{a.axis}</span>
                  <span style={{fontSize:11,fontWeight:700}}>{a.name}</span>
                  <span style={{fontSize:8,color:"rgba(255,255,255,0.25)"}}>{a.eng}</span>
                  <span style={{marginLeft:"auto"}}><M size={10} color={a.color}>{a.count}</M></span>
                </div>
                <div style={{fontSize:8,color:"rgba(255,255,255,0.35)",paddingLeft:22}}>{a.desc}</div>
                <div style={{fontSize:7,color:`${a.color}80`,paddingLeft:22,marginTop:2,fontStyle:"italic"}}>예: {a.examples}</div>
              </div>
            ))}
          </Box>
        )}

        {detailPanel==="bayes"&&(
          <Box border="rgba(255,107,107,0.15)">
            <Lbl color="#FF6B6B">① 베이지안 추론 — 10회 갱신 + B-보정</Lbl>
            {BAYES.map((b,i)=>(
              <div key={i} style={{display:"flex",gap:6,padding:"5px 0",borderBottom:i<BAYES.length-1?"1px solid rgba(255,255,255,0.02)":"none",fontSize:8,
                background:b.id==="B"?"rgba(255,107,107,0.05)":"transparent",borderRadius:b.id==="B"?6:0,padding:b.id==="B"?"6px":"5px 0"}}>
                <M size={8} color="#FF6B6B">{b.id==="B"?"B":` #${b.id}`}</M>
                <span style={{width:40,color:"rgba(255,255,255,0.25)"}}>{b.period}</span>
                <span style={{flex:1,color:"rgba(255,255,255,0.4)"}}>{b.evidence}</span>
                <span style={{color:"rgba(255,255,255,0.2)"}}>{b.prior}→</span>
                <M size={9} color="#FF6B6B">{b.post}</M>
                <span style={{width:50,textAlign:"right",color:"rgba(255,255,255,0.3)"}}>{b.verdict}</span>
              </div>
            ))}
          </Box>
        )}

        {detailPanel==="roc"&&(
          <Box border="rgba(0,212,255,0.15)">
            <Lbl color="#00D4FF">② ROC 임계치 · 12건 경고 (기준 0.65)</Lbl>
            {ROC.map((r,i)=>(
              <div key={i} style={{display:"flex",gap:6,padding:"4px 0",fontSize:8,borderBottom:i<ROC.length-1?"1px solid rgba(255,255,255,0.02)":"none"}}>
                <span>{r.grade}</span>
                <span style={{width:36,color:"rgba(255,255,255,0.25)"}}>{r.date}</span>
                <span style={{flex:1,color:"rgba(255,255,255,0.4)"}}>{r.item}</span>
                <M size={9} color={r.val>0.65?"#FF6B6B":"#27AE60"}>{r.val.toFixed(2)}</M>
              </div>
            ))}
          </Box>
        )}

        {detailPanel==="cluster"&&(
          <Box border="rgba(39,174,96,0.15)">
            <Lbl color="#27AE60">③ 클러스터 5극 진화 (6개월)</Lbl>
            {CLUSTERS.map((c,i)=>(
              <div key={i} style={{marginBottom:6}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                  <span style={{fontSize:10,fontWeight:700,color:c.color}}>{c.name}</span>
                  <span style={{fontSize:7,color:"rgba(255,255,255,0.25)",marginLeft:"auto"}}>{c.verdict}</span>
                </div>
                <div style={{display:"flex",gap:2}}>
                  {["9월","10월","11월","12월","1월","2월"].map((m,j)=>(
                    <div key={j} style={{flex:1,textAlign:"center",fontSize:7,padding:"3px 0",borderRadius:3,
                      background:c.pct[j]==="-"?"rgba(255,255,255,0.02)":`${c.color}12`,
                      color:c.pct[j]==="-"?"rgba(255,255,255,0.08)":c.pct[j]==="0%"?"#FF6B6B":c.color}}>
                      <div style={{fontSize:5,color:"rgba(255,255,255,0.15)"}}>{m}</div>
                      {c.pct[j]}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </Box>
        )}

        {detailPanel==="cde"&&(
          <Box border="rgba(243,156,18,0.15)">
            <Lbl color="#F39C12">④ Neural CDE 궤적 Phase 0→3</Lbl>
            {CDE.map((p,i)=>(
              <div key={i} style={{padding:"8px 0",borderBottom:i<3?"1px solid rgba(255,255,255,0.03)":"none"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                  <div><P color="#F39C12">{p.phase}</P><span style={{fontSize:8,color:"rgba(255,255,255,0.25)"}}>{p.period} · {p.data}</span></div>
                  {p.nscore!=="-"&&<M size={14} color="#F39C12">N={p.nscore}</M>}
                </div>
                <div style={{fontSize:7,color:"rgba(255,255,255,0.3)",fontFamily:"'JetBrains Mono',monospace"}}>{p.h} | σ={p.sigma}</div>
              </div>
            ))}
            <div style={{marginTop:6,padding:8,background:"rgba(243,156,18,0.06)",borderRadius:8,textAlign:"center"}}>
              <div style={{fontSize:10,fontWeight:700,color:"#F39C12"}}>60일 예측: D+30 = 77(±3) | D+60 = 80(±4)</div>
            </div>
          </Box>
        )}

        {detailPanel==="profile"&&(
          <Box border="rgba(155,89,182,0.2)" glow="rgba(155,89,182,0.06)">
            <Lbl color="#9B59B6">Living Profile — 현재 상태</Lbl>
            <div style={{textAlign:"center",padding:"8px 0",marginBottom:8,borderBottom:"1px solid rgba(155,89,182,0.1)"}}>
              <div style={{fontSize:16,fontWeight:800}}>전략적 설계자</div>
              <div style={{fontSize:8,color:"rgba(255,255,255,0.3)",marginTop:3}}>상위 <M size={10} color="#F39C12">23%</M> · 진화확률 <M size={10} color="#27AE60">78%</M> · 루틴 <M size={10} color="#9B59B6">1,270일+</M></div>
            </div>
            {DNA.axes.map((a,i)=>(
              <div key={i} style={{marginBottom:6}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:9,marginBottom:2}}>
                  <span style={{color:"rgba(255,255,255,0.5)"}}>{a.name}</span>
                  <span style={{fontSize:7,color:"rgba(255,255,255,0.2)"}}>{a.note}</span>
                </div>
                <div style={{display:"flex",gap:3,alignItems:"center"}}>
                  <div style={{width:22,fontSize:6,color:"rgba(255,255,255,0.2)"}}>선천</div>
                  <div style={{flex:1}}><Bar val={a.innate} color="rgba(243,156,18,0.35)" /></div>
                  <M size={8} color="#F39C12">{a.innate}</M>
                </div>
                <div style={{display:"flex",gap:3,alignItems:"center",marginTop:1}}>
                  <div style={{width:22,fontSize:6,color:"rgba(255,255,255,0.2)"}}>현재</div>
                  <div style={{flex:1}}><Bar val={a.current} color={a.current>=a.innate?"#27AE60":"#FF6B6B"} /></div>
                  <M size={8} color={a.current>=a.innate?"#27AE60":"#FF6B6B"}>{a.current}</M>
                </div>
              </div>
            ))}
          </Box>
        )}

        {/* One-Stop Message */}
        <Box border="rgba(0,212,255,0.15)" style={{marginTop:4}}>
          <div style={{textAlign:"center",padding:"6px 0"}}>
            <div style={{fontSize:13,fontWeight:800,background:"linear-gradient(135deg,#00D4FF,#9B59B6)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
              이 전체 프로세스가 SDK 하나입니다
            </div>
            <div style={{fontSize:9,color:"rgba(255,255,255,0.35)",marginTop:4,lineHeight:1.6}}>
              5축 데이터 → 4대 알고리즘 → 8대 법칙 → 자율진화 프로파일<br/>
              <strong style={{color:"#F39C12"}}>이 SDK를 귀사 앱에 심으면 Phase 0~3이 한 번에 돌아갑니다</strong>
            </div>
          </div>
        </Box>
      </>)}
    </div>
  );

  // ── TAB: DATA ──
  const DataTab = () => (
    <div>
      <Lbl color="#00D4FF">510건 데이터 구성</Lbl>
      <Box border="rgba(0,212,255,0.15)">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
          {[
            {l:"양적(카드)",v:"466건",c:"#00D4FF",sub:"MCC·가맹점·금액·시간"},
            {l:"질적(관측)",v:"44건",c:"#FF6B6B",sub:"루틴·쾌변·음주·선언"},
            {l:"수집기간",v:"157일",c:"#F39C12",sub:"2025.09.24~2026.03.01"},
            {l:"Phase 분포",v:"4단계",c:"#9B59B6",sub:"Pre→1→2→3 진화"},
          ].map((d,i)=>(
            <div key={i} style={{padding:10,background:`${d.c}06`,border:`1px solid ${d.c}12`,borderRadius:8,textAlign:"center"}}>
              <div style={{fontSize:7,color:d.c}}>{d.l}</div>
              <M size={16} color={d.c}>{d.v}</M>
              <div style={{fontSize:7,color:"rgba(255,255,255,0.2)",marginTop:2}}>{d.sub}</div>
            </div>
          ))}
        </div>
      </Box>

      <Lbl color="#FF6B6B">질적관측 하이라이트 (44건)</Lbl>
      <Box>
        {[
          {cat:"모닝루틴",cnt:"13건",desc:"3.5년=1,270일+ 확정경로 · 밤샘·귀향에도 유지",c:"#27AE60"},
          {cat:"음주이벤트",cnt:"7건",desc:"12월2+1월2+설연휴2+1 → 절주39일 달성",c:"#F39C12"},
          {cat:"건강검진",cnt:"1건",desc:"02/13 세브란스 폐CT '이상없음' ⭐⭐⭐",c:"#00D4FF"},
          {cat:"쾌변기록",cnt:"2건",desc:"02/24~25 연속 · 음주후에도 유지 = 내구성",c:"#9B59B6"},
          {cat:"가족이벤트",cnt:"4건",desc:"설 연휴 가족순회 · 조부모 참배 · 원점회귀",c:"#FF6B6B"},
          {cat:"T-60 시그널",cnt:"6건",desc:"심야3+인프라2+공백1 → 선제경고 발동",c:"#FF6B6B"},
          {cat:"자가선언",cnt:"1건",desc:"'매일 루틴이다' — 가장 강력한 Evidence",c:"#27AE60"},
        ].map((q,i)=>(
          <div key={i} style={{display:"flex",gap:6,padding:"5px 0",borderBottom:i<6?"1px solid rgba(255,255,255,0.02)":"none",fontSize:9}}>
            <P color={q.c}>{q.cat}</P>
            <M size={8} color={q.c}>{q.cnt}</M>
            <span style={{flex:1,color:"rgba(255,255,255,0.4)"}}>{q.desc}</span>
          </div>
        ))}
      </Box>

      <Lbl>Pre-PoC vs PoC 핵심 변화</Lbl>
      <Box>
        {[
          {k:"외식 비중",pre:"28.5%",poc:"5.3%",delta:"-81%",c:"#27AE60"},
          {k:"유흥/음주",pre:"496K",poc:"0원",delta:"-100%",c:"#27AE60"},
          {k:"건강식",pre:"~5%",poc:"~40%",delta:"+700%",c:"#27AE60"},
          {k:"배달 비중",pre:"16%",poc:"28%",delta:"+75%",c:"#00D4FF"},
          {k:"IT 투자",pre:"0원",poc:"월~70K",delta:"NEW",c:"#F39C12"},
          {k:"N-Score",pre:"측정불가",poc:"52→74",delta:"+22",c:"#9B59B6"},
          {k:"모닝루틴",pre:"없음",poc:"13일+연속",delta:"NEW",c:"#9B59B6"},
        ].map((r,i)=>(
          <div key={i} style={{display:"flex",gap:4,padding:"4px 0",fontSize:8,borderBottom:i<6?"1px solid rgba(255,255,255,0.02)":"none"}}>
            <span style={{width:60,color:"rgba(255,255,255,0.4)"}}>{r.k}</span>
            <span style={{width:45,color:"rgba(255,255,255,0.2)",textAlign:"right"}}>{r.pre}</span>
            <span style={{color:"rgba(255,255,255,0.15)"}}>→</span>
            <M size={8} color={r.c}>{r.poc}</M>
            <span style={{marginLeft:"auto",color:r.c,fontWeight:700}}>{r.delta}</span>
          </div>
        ))}
      </Box>
    </div>
  );

  // ── TAB: DNA ──
  const DNATab = () => (
    <div>
      <Lbl color="#F39C12">선천적 기질 DNA × 후천 데이터 융합</Lbl>
      <Box border="rgba(243,156,18,0.15)">
        <div style={{textAlign:"center",marginBottom:10}}>
          <div style={{fontSize:11,fontWeight:700,color:"#F39C12"}}>{DNA.birth}</div>
          <div style={{fontSize:9,color:"rgba(255,255,255,0.3)"}}>{DNA.type}</div>
        </div>
        {DNA.axes.map((a,i)=>(
          <div key={i} style={{marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:10,marginBottom:3}}>
              <span style={{fontWeight:600}}>{a.name}</span>
              <span style={{fontSize:8,color:"rgba(255,255,255,0.25)"}}>{a.note}</span>
            </div>
            <div style={{display:"flex",gap:4,alignItems:"center",marginBottom:2}}>
              <div style={{width:28,fontSize:7,color:"rgba(255,255,255,0.2)"}}>선천</div>
              <div style={{flex:1}}><Bar val={a.innate} color="rgba(243,156,18,0.4)" h={5} /></div>
              <M size={10} color="#F39C12">{a.innate}</M>
            </div>
            <div style={{display:"flex",gap:4,alignItems:"center"}}>
              <div style={{width:28,fontSize:7,color:"rgba(255,255,255,0.2)"}}>현재</div>
              <div style={{flex:1}}><Bar val={a.current} color={a.current>=a.innate?"#27AE60":"#FF6B6B"} h={5} /></div>
              <M size={10} color={a.current>=a.innate?"#27AE60":"#FF6B6B"}>{a.current}</M>
            </div>
            <div style={{display:"flex",justifyContent:"flex-end",marginTop:1}}>
              <span style={{fontSize:7,color:a.current>=a.innate?"#27AE60":"#FF6B6B"}}>{a.current>=a.innate?`▲${a.current-a.innate} 후천보강`:`▼${a.innate-a.current} 환경적응`}</span>
            </div>
          </div>
        ))}
      </Box>
      <Box>
        <Lbl>DNA 융합 인사이트</Lbl>
        <div style={{fontSize:10,color:"rgba(255,255,255,0.45)",lineHeight:1.8}}>
          <strong style={{color:"#F39C12"}}>핵심:</strong> 선천 金95(분석력)가 최강이나 火25(실행력)가 최약<br/>
          <strong style={{color:"#27AE60"}}>후천 보강:</strong> PoC 7개월간 火25→68 (+43p) · 丙辛合 활성화 62%<br/>
          <strong style={{color:"#9B59B6"}}>丑土 2개:</strong> 루틴 정착력 선천적 강점 · 모닝루틴 1,270일+ 근거<br/>
          <strong style={{color:"#FF6B6B"}}>과제:</strong> 木15→45 성장중이나 여전히 최약축 · J커브 트리거 필요
        </div>
      </Box>
    </div>
  );

  // ── TAB: LAWS ──
  const LawsTab = () => (
    <div>
      <Lbl color="#9B59B6">8대 행동법칙 — PoC에서 발견된 인간행동 패턴</Lbl>
      {LAWS.map((l,i)=>(
        <Box key={i} border={l.status==="✅"?"rgba(39,174,96,0.12)":l.status==="🆕"?"rgba(155,89,182,0.12)":"rgba(243,156,18,0.12)"}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
            <span style={{fontSize:12}}>{l.status}</span>
            <span style={{fontSize:11,fontWeight:700}}>{l.name}</span>
            <span style={{marginLeft:"auto"}}><M size={10} color={parseInt(l.conf)>=85?"#27AE60":"#F39C12"}>{l.conf}</M></span>
          </div>
          <div style={{fontSize:9,color:"rgba(255,255,255,0.45)",marginBottom:3}}>{l.def}</div>
          <div style={{display:"flex",gap:8,fontSize:8}}>
            <span style={{color:"rgba(255,255,255,0.25)"}}>검증 {l.verify}</span>
            <span style={{color:"rgba(255,255,255,0.25)"}}>알고리즘: {l.algo}</span>
          </div>
        </Box>
      ))}
      <Box border="rgba(39,174,96,0.15)">
        <div style={{textAlign:"center",fontSize:10,color:"rgba(255,255,255,0.4)"}}>
          ✅ 검증완료 3건 (85~90%) · ⚠ 추가검증 4건 (70~75%) · 🆕 신규 1건
        </div>
      </Box>
    </div>
  );

  // ── TAB: PREDICT ──
  const PredictTab = () => (
    <div>
      <Lbl color="#27AE60">예측 성과 — 최근 5/5 적중 (100%)</Lbl>
      {PREDICTIONS.map((p,i)=>(
        <Box key={i} border="rgba(39,174,96,0.12)">
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
            <span style={{fontSize:10,fontWeight:600}}>{p.date}</span>
            <P color="#27AE60">{p.hit==="Y"?"적중":"미스"}</P>
          </div>
          <div style={{display:"flex",gap:4,fontSize:9,marginBottom:3}}>
            <span style={{color:"rgba(255,255,255,0.3)"}}>예측:</span>
            <span style={{color:"#F39C12"}}>{p.predict}</span>
            <span style={{color:"rgba(255,255,255,0.15)"}}>→</span>
            <span style={{color:"#27AE60",fontWeight:600}}>실제: {p.actual}</span>
          </div>
          <div style={{fontSize:8,color:"rgba(255,255,255,0.3)"}}>핵심변수: {p.key} | {p.algo}</div>
        </Box>
      ))}
      <Box border="rgba(39,174,96,0.2)" glow="rgba(39,174,96,0.06)">
        <Lbl color="#27AE60">누적 예측 성과</Lbl>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,textAlign:"center"}}>
          {[
            {l:"최근 5건",v:"100%",c:"#27AE60"},
            {l:"식사 예측",v:"73%+",c:"#F39C12"},
            {l:"쾌변 예측",v:"91%",c:"#9B59B6"},
          ].map((s,i)=>(
            <div key={i} style={{padding:8,background:`${s.c}08`,borderRadius:8}}>
              <div style={{fontSize:7,color:s.c}}>{s.l}</div>
              <M size={18} color={s.c}>{s.v}</M>
            </div>
          ))}
        </div>
      </Box>
    </div>
  );

  const tabContent = [EngineTab, DataTab, DNATab, LawsTab, PredictTab];

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(170deg,#080C18 0%,#0D1117 40%,#111827 100%)",color:"#E8ECF1",fontFamily:"'Pretendard','Apple SD Gothic Neo',-apple-system,sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&display=swap" rel="stylesheet"/>

      {/* Header */}
      <div style={{padding:"14px 14px 8px",textAlign:"center",borderBottom:"1px solid rgba(255,255,255,0.03)"}}>
        <div style={{fontSize:6,letterSpacing:"0.3em",color:"rgba(155,89,182,0.35)",fontWeight:700}}>N-KAI AUTONOMOUS EVOLUTION OS · SDK v3.0</div>
        <div style={{fontSize:18,fontWeight:900,marginTop:3,background:"linear-gradient(135deg,#00D4FF 0%,#9B59B6 50%,#FF6B6B 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
          510건 · 5축 · 자율진화
        </div>
        <div style={{fontSize:8,color:"rgba(255,255,255,0.2)",marginTop:2}}>카드466+질적44 · 4대특허 · 8대법칙 · 예측100%</div>
      </div>

      {/* Tab Bar */}
      <div style={{display:"flex",borderBottom:"1px solid rgba(255,255,255,0.04)",background:"rgba(10,15,28,0.9)",position:"sticky",top:0,zIndex:100}}>
        {TABS.map((t,i)=>(
          <button key={i} onClick={()=>setTab(i)} style={{flex:1,padding:"10px 4px",background:tab===i?"rgba(255,255,255,0.04)":"transparent",
            border:"none",borderBottom:`2px solid ${tab===i?"#00D4FF":"transparent"}`,color:tab===i?"#00D4FF":"rgba(255,255,255,0.25)",
            fontSize:9,fontWeight:700,cursor:"pointer"}}>{t}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{padding:"10px 12px"}}>
        {tabContent[tab]()}
      </div>

      {/* Footer */}
      <div style={{textAlign:"center",padding:"14px 0 24px",borderTop:"1px solid rgba(255,255,255,0.03)"}}>
        <div style={{fontSize:6,letterSpacing:"0.15em",color:"rgba(155,89,182,0.2)"}}>뉴린카이로스에이아이(주) · N-KAI SDK v3.0</div>
        <div style={{fontSize:5,color:"rgba(255,255,255,0.06)",marginTop:2}}>510건 · 157일 · 특허4건 · 법칙8건 · Day 84 PoC</div>
      </div>
    </div>
  );
}
