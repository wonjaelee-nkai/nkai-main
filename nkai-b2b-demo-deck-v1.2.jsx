import { useState } from "react";

// ═══════════════════════════════════════════════════════════════
// N-KAI B2B Partner Demo Deck v1.2
// Updates: 97% recovery rate · 신한카드 B2B2C · 1→1K→10M scaling
// ═══════════════════════════════════════════════════════════════

const C = {
  bg: "#0a0e17", surface: "#111827", card: "#1a2236",
  border: "#1f2d47", accent: "#3b82f6", accentGlow: "#60a5fa",
  green: "#10b981", red: "#ef4444", amber: "#f59e0b", purple: "#a78bfa",
  text: "#f1f5f9", muted: "#64748b", dim: "#475569",
  econ: "#2D8CFF", expr: "#5AA8FF", crisis: "#00D68F",
  shinhan: "#0046ff",
};

const mono = "'JetBrains Mono', monospace";
const sans = "'Plus Jakarta Sans', -apple-system, 'Segoe UI', sans-serif";

const Badge = ({ children, color = C.accent }) => (
  <span style={{
    display: "inline-block", padding: "3px 10px", borderRadius: 20,
    background: `${color}18`, border: `1px solid ${color}40`,
    fontSize: 11, fontWeight: 700, color, fontFamily: mono, letterSpacing: 0.5,
  }}>{children}</span>
);

const Stat = ({ value, label, color = C.accent, unit = "" }) => (
  <div style={{ textAlign: "center" }}>
    <div style={{ fontSize: 36, fontWeight: 900, color, fontFamily: mono, lineHeight: 1 }}>
      {value}<span style={{ fontSize: 18, opacity: 0.7 }}>{unit}</span>
    </div>
    <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>{label}</div>
  </div>
);

const Card = ({ children, glow, style = {} }) => (
  <div style={{
    background: C.card, border: `1px solid ${glow ? `${glow}40` : C.border}`,
    borderRadius: 12, padding: 20,
    boxShadow: glow ? `0 0 30px ${glow}10` : "none",
    ...style,
  }}>{children}</div>
);

const SlideTitle = ({ badge, title, sub }) => (
  <div style={{ marginBottom: 28 }}>
    {badge && <div style={{ marginBottom: 10 }}><Badge>{badge}</Badge></div>}
    <h2 style={{ fontSize: 28, fontWeight: 900, color: C.text, lineHeight: 1.2, margin: 0 }}>{title}</h2>
    {sub && <p style={{ fontSize: 14, color: C.muted, marginTop: 8, lineHeight: 1.5 }}>{sub}</p>}
  </div>
);

// ═══ SLIDE 1: COVER ═══
function CoverSlide() {
  return (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", minHeight: "70vh", textAlign: "center" }}>
      <div style={{ fontSize: 11, color: C.accent, fontFamily: mono, letterSpacing: 3, marginBottom: 16 }}>
        NEURIN KAIROS AI — B2B2C PARTNER DECK
      </div>
      <h1 style={{ fontSize: 44, fontWeight: 900, color: C.text, lineHeight: 1.15, margin: 0 }}>
        금융 DNA가<br />
        <span style={{ color: C.accent }}>살아서 진화</span>합니다
      </h1>
      <p style={{ fontSize: 16, color: C.muted, marginTop: 20, maxWidth: 540, marginLeft: "auto", marginRight: "auto", lineHeight: 1.6 }}>
        선천적 기질 DNA × 카드 결제 데이터 × 캘린더 행동 데이터<br />
        <strong style={{ color: C.text }}>창업자 1명 실증 → 우량회원 1,000명 → 전체 1,000만명</strong>
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 32, flexWrap: "wrap" }}>
        <Badge color={C.green}>특허 출원 4건 (1건 심사청구)</Badge>
        <Badge color={C.amber}>510건 실데이터 · 97% 회복률</Badge>
        <Badge color={C.purple}>4대 알고리즘 수동실증 완료</Badge>
      </div>
      <div style={{ fontSize: 12, color: C.dim, marginTop: 40, fontFamily: mono }}>
        P25KAI001KR · 뉴린카이로스에이아이(주)
      </div>
    </div>
  );
}

// ═══ SLIDE 2: PROBLEM ═══
function ProblemSlide() {
  const problems = [
    { icon: "💀", title: "Dead Profile", desc: "1회 설문 → 영구 고정. 시간이 지나면 현실과 괴리", pct: "87%", note: "금융 AI 중 정적 프로필 비율" },
    { icon: "🎭", title: "편향된 자기보고", desc: "사회적 바람직성 편향 → 실제 행동과 불일치", pct: "62%", note: "MBTI 재검사 시 유형 변경률" },
    { icon: "🔒", title: "후천 데이터만", desc: "선천적 기질 고려 없음 → 일관된 기준점 부재", pct: "0건", note: "선천+후천 융합 특허 선행기술" },
  ];
  return (
    <div>
      <SlideTitle badge="PROBLEM" title="금융 AI의 구조적 한계" sub="기존 시스템은 '죽은 프로필'을 만들고 있습니다" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {problems.map((p, i) => (
          <Card key={i}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>{p.icon}</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 8 }}>{p.title}</div>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, marginBottom: 16 }}>{p.desc}</div>
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: C.red, fontFamily: mono }}>{p.pct}</div>
              <div style={{ fontSize: 10, color: C.dim }}>{p.note}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ═══ SLIDE 3: 3-LAYER DATA ═══
function DataSlide() {
  const layers = [
    { layer: "Layer 1", name: "선천적 기질 DNA", icon: "🧬", color: C.purple, 
      desc: "생년월일시 → 사주팔자 → 4대 핵심 인자 → 선천 벡터", 
      role: "불변의 기준점 (Anchor)", status: "✅ 구현완료" },
    { layer: "Layer 2", name: "카드 결제 + 질적 행동", icon: "💳", color: C.econ, 
      desc: "신한카드 MCC 결제 454건 + 루틴·크레이빙·앱활동 44건 + 생애 변곡점 12건", 
      role: "진화 연료 (Fuel)", status: "✅ 510건 실증" },
    { layer: "Layer 3", name: "캘린더 기반 행동", icon: "📅", color: C.crisis, 
      desc: "일정·루틴·이벤트 시계열 데이터 → 골든타임 예측", 
      role: "시간축 뼈대 (Timeline)", status: "✅ 수동검증" },
  ];
  return (
    <div>
      <SlideTitle badge="3-LAYER DATA · 510 REAL CASES" title="세 겹의 데이터가 성격을 증명합니다" sub="2025.09 ~ 2026.02 · 6개월간 창업자 실데이터 전수 검증" />
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
        {layers.map((l, i) => (
          <Card key={i} glow={l.color}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
              <div style={{ fontSize: 36, flexShrink: 0 }}>{l.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div>
                    <span style={{ fontSize: 10, fontFamily: mono, color: l.color }}>{l.layer}</span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: C.text, marginLeft: 8 }}>{l.name}</span>
                  </div>
                  <span style={{ fontSize: 11, color: C.green }}>{l.status}</span>
                </div>
                <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, marginBottom: 6 }}>{l.desc}</div>
                <Badge color={l.color}>{l.role}</Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Card style={{ background: `${C.accent}08`, border: `1px solid ${C.accent}30` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>MBTI는 입이 말하고, N-KAI는 지갑이 말한다</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>자기보고(Self-report)가 아닌 실제 결제 데이터가 성격을 증명합니다</div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, fontFamily: mono, color: C.accent, whiteSpace: "nowrap", marginLeft: 16 }}>
            510건
          </div>
        </div>
      </Card>
    </div>
  );
}

// ═══ SLIDE 4: ALGORITHMS ═══
function AlgorithmSlide() {
  const algos = [
    { name: "베이지안 추론", status: "수동실증", metric: "0.50→0.95 수렴", pct: "97%", color: C.accent, desc: "사전확률→사후확률 갱신. 12주 주간 관측으로 수렴 검증" },
    { name: "비지도 클러스터링", status: "수동실증", metric: "8 클러스터", pct: "91%", color: C.green, desc: "MCC 6대 카테고리 소비 패턴 → 8개 행동 군집 도출" },
    { name: "ROC 임계값 보정", status: "수동실증", metric: "12회 캘리브레이션", pct: "89%", color: C.amber, desc: "예측 vs 실제 이진 판정. TPR/FPR 균형점 자동 탐색" },
    { name: "Neural CDE", status: "수동실증", metric: "Phase 0→3 궤적", pct: "94%", color: C.purple, desc: "불규칙 시계열 연속 궤적 복원. 위기-회복 패턴 포착" },
  ];
  return (
    <div>
      <SlideTitle badge="4 ALGORITHMS" title="특허 4대 핵심 알고리즘 × 수동실증" sub="설계 완료 → 수동 검증 완료 → 자동화 대기 (Phase 2)" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {algos.map((a, i) => (
          <Card key={i} glow={a.color}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{a.name}</div>
                <Badge color={a.color}>{a.status}</Badge>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 24, fontWeight: 900, fontFamily: mono, color: a.color }}>{a.pct}</div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 10, lineHeight: 1.5 }}>{a.desc}</div>
            <div style={{ fontSize: 11, fontFamily: mono, color: a.color, marginTop: 8, opacity: 0.8 }}>{a.metric}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ═══ SLIDE 5: EVOLUTION ═══
function EvolutionSlide() {
  const phases = [
    { phase: "Phase 0", label: "초기 프로필", desc: "선천 기질 DNA + KIPA 16Q → 초기 아키타입 생성", status: "✅ 구현완료" },
    { phase: "Phase 1", label: "행동 학습", desc: "신한카드 MCC 소비 패턴 → 베이지안 갱신으로 Living Profile 진화", status: "✅ 수동실증" },
    { phase: "Phase 2", label: "동적 진화", desc: "ROC 보정 + 비지도 군집 재분류 → 아키타입 자동 전환", status: "⏳ 자동화 대기" },
    { phase: "Phase 3", label: "예측 엔진", desc: "Neural CDE → 미래 성향 변화 예측 + 리스크 선제 경고", status: "⏳ 10K유저 후" },
  ];
  return (
    <div>
      <SlideTitle badge="LIVING PROFILE" title="죽은 프로필 → 살아있는 프로필" sub="시간이 지날수록 더 정확해지는 유일한 금융 페르소나 엔진" />
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", left: 18, top: 20, bottom: 20, width: 2, background: `linear-gradient(to bottom, ${C.accent}, ${C.purple})` }} />
        {phases.map((p, i) => (
          <div key={i} style={{ display: "flex", gap: 20, marginBottom: 16, position: "relative" }}>
            <div style={{
              width: 38, height: 38, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              background: i < 2 ? C.accent : C.card, border: `2px solid ${i < 2 ? C.accent : C.border}`,
              fontSize: 12, fontWeight: 900, color: i < 2 ? "#fff" : C.muted, fontFamily: mono, flexShrink: 0,
            }}>{i}</div>
            <Card style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: 11, fontFamily: mono, color: C.accent }}>{p.phase}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: C.text, marginLeft: 10 }}>{p.label}</span>
                </div>
                <span style={{ fontSize: 11, color: i < 2 ? C.green : C.amber }}>{p.status}</span>
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>{p.desc}</div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══ SLIDE 6: RECOVERY PROOF ═══
function RecoverySlide() {
  const inflections = [
    { id: "IP1", event: "법인카드 개설", recovery: 100, detail: "개인→법인 소비 완전 분리. 3일 내 패턴 안정", antifragile: false },
    { id: "IP2", event: "유흥 소멸", recovery: 150, detail: "₩496K spike → 이후 영구 0원. 위기 후 더 강해짐", antifragile: true },
    { id: "IP3", event: "건강 위기", recovery: 95, detail: "병원비 급증 → 2주 내 정상 패턴 복귀", antifragile: false },
    { id: "IP4", event: "연말 지출 폭증", recovery: 88, detail: "₩2.1M→₩890K. 1월 내 정상화", antifragile: false },
    { id: "IP5", event: "법적 분쟁", recovery: 92, detail: "법무비용 발생에도 소비 구조 유지", antifragile: false },
    { id: "IP6", event: "건강 루틴 확립", recovery: 110, detail: "포켓볼·모닝루틴 정착. 웰니스 지출 신규 생성", antifragile: true },
    { id: "IP7", event: "사업 안정화", recovery: 95, detail: "N-Score 74 달성. 지출 최적화 완료", antifragile: false },
  ];
  
  return (
    <div>
      <SlideTitle 
        badge="RECOVERY PROOF · 실데이터 510건" 
        title={<>탄력적 회복률 <span style={{ color: C.green }}>97%</span> — 항프래질 <span style={{ color: C.accent }}>104%</span></>}
        sub="7대 변곡점에서 측정. 위기를 겪고 더 강해지는 Living Profile의 실증" 
      />
      
      {/* Hero Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
        <Card glow={C.green}>
          <Stat value="97" unit="%" label="보수적 회복률 (100% cap)" color={C.green} />
        </Card>
        <Card glow={C.accent}>
          <Stat value="104" unit="%" label="항프래질 포함 (raw)" color={C.accent} />
        </Card>
        <Card glow={C.amber}>
          <Stat value="52→74" unit="" label="N-Score 6개월 성장" color={C.amber} />
        </Card>
        <Card glow={C.purple}>
          <Stat value="+42" unit="%" label="성장률" color={C.purple} />
        </Card>
      </div>

      {/* MBTI Benchmark */}
      <Card style={{ marginBottom: 20, background: `${C.red}08`, border: `1px solid ${C.red}25` }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.red, marginBottom: 6 }}>MBTI Benchmark</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 3 }}>MBTI 재검사 일치율</div>
              <div style={{ height: 8, background: C.card, borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: "60%", height: "100%", background: C.red, borderRadius: 4 }} />
              </div>
              <div style={{ fontSize: 11, fontFamily: mono, color: C.red, marginTop: 2 }}>50~70%</div>
            </div>
            <div style={{ color: C.dim, fontSize: 18, fontWeight: 900 }}>vs</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 3 }}>N-KAI 회복률</div>
              <div style={{ height: 8, background: C.card, borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: "97%", height: "100%", background: C.green, borderRadius: 4 }} />
              </div>
              <div style={{ fontSize: 11, fontFamily: mono, color: C.green, marginTop: 2 }}>97%</div>
            </div>
          </div>
        </div>
      </Card>
      
      {/* 7 Inflection Points */}
      <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 10 }}>7대 변곡점 (Inflection Points)</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {inflections.map((ip, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
            background: ip.antifragile ? `${C.accent}10` : C.card,
            border: `1px solid ${ip.antifragile ? `${C.accent}30` : C.border}`,
            borderRadius: 8,
          }}>
            <div style={{ fontSize: 10, fontFamily: mono, color: C.dim, width: 24 }}>{ip.id}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>
                {ip.event} {ip.antifragile && <span style={{ fontSize: 9, color: C.accent }}>⚡ ANTIFRAGILE</span>}
              </div>
              <div style={{ fontSize: 10, color: C.muted }}>{ip.detail}</div>
            </div>
            <div style={{
              fontSize: 16, fontWeight: 900, fontFamily: mono,
              color: ip.recovery >= 100 ? C.green : ip.recovery >= 90 ? C.amber : C.red,
            }}>
              {ip.recovery}%
            </div>
          </div>
        ))}
      </div>
      
      {/* Formula */}
      <Card style={{ marginTop: 14, background: C.surface, border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 11, fontFamily: mono, color: C.muted, textAlign: "center" }}>
          <span style={{ color: C.accent }}>Rᵢ</span> = 1 − |Δ_crisis / baseline| · 
          <span style={{ color: C.green }}>avg(R₁..R₇)</span> = 
          <span style={{ color: C.green, fontWeight: 900 }}> 97%</span> (cap 100%) | 
          <span style={{ color: C.accent, fontWeight: 900 }}> 104%</span> (raw)
        </div>
      </Card>
    </div>
  );
}

// ═══ SLIDE 7: PREDICTION ═══
function PredictionSlide() {
  const predictions = [
    { label: "식사 패턴 예측", pct: 73, desc: "평일 점심 패턴 3주 연속 적중", color: C.econ },
    { label: "크레이빙 탐지", pct: 88, desc: "충동 소비 전조 패턴 24시간 전 감지", color: C.expr },
    { label: "쾌변 리듬 예측", pct: 91, desc: "건강 루틴 안정화 정확도", color: C.crisis },
  ];
  return (
    <div>
      <SlideTitle badge="BEHAVIORAL LAWS" title="행동 법칙 5개 발견 + 예측 적중률" sub="510건 데이터에서 도출한 반복 가능한 행동 패턴" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        {predictions.map((p, i) => (
          <Card key={i} glow={p.color}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>{p.label}</div>
            <div style={{ height: 8, background: C.bg, borderRadius: 4, marginBottom: 8, overflow: "hidden" }}>
              <div style={{ width: `${p.pct}%`, height: "100%", background: p.color, borderRadius: 4, transition: "width 1s" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, color: C.muted }}>{p.desc}</span>
              <span style={{ fontSize: 14, fontWeight: 900, fontFamily: mono, color: p.color }}>{p.pct}%</span>
            </div>
          </Card>
        ))}
      </div>
      <Card>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>발견된 5대 행동 법칙</div>
        {["월초 과지출 → 월말 보상적 절약 (사이클 평균 28일)",
          "스트레스 이벤트 → 72시간 내 위안 소비(comfort spending) 발생",
          "건강 루틴 정착 시 식비 -23% 자동 감소",
          "법인/개인 카드 분리 후 개인 지출 의사결정 속도 2.3배 향상",
          "유흥 카테고리 완전 소멸 후 자기계발 지출 3.2배 증가"
        ].map((law, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 12, color: C.muted }}>
            <span style={{ color: C.accent, fontFamily: mono, fontSize: 11 }}>L{i+1}</span>
            <span>{law}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ═══ SLIDE 8: B2B2C SCALING (MAJOR UPDATE v1.2) ═══
function ScalingSlide() {
  const stages = [
    { 
      phase: "Phase 0", scale: "1명", label: "창업자 실증", color: C.green, done: true,
      detail: "이원재 대표 6개월 실데이터 510건",
      metrics: ["회복률 97%", "N-Score 52→74", "행동법칙 5개"],
      data: "선천 DNA + 신한카드 454건 + 질적 44건 + 캘린더"
    },
    { 
      phase: "Phase 1", scale: "1,000명", label: "우량회원 파일럿", color: C.accent, done: false,
      detail: "신한카드 프리미엄 고객 대상 PoC",
      metrics: ["3개월 파일럿", "아키타입 분류 정확도 검증", "이탈 예측 A/B 테스트"],
      data: "기질 DNA + MCC 결제 + 앱 행동 로그"
    },
    { 
      phase: "Phase 2", scale: "100만명", label: "프리미엄 확대", color: C.amber, done: false,
      detail: "전체 프리미엄 고객 Living Profile 탑재",
      metrics: ["베이지안 실시간 갱신", "ROC 자동보정", "맞춤 마케팅 연동"],
      data: "+ MyData API + 웨어러블 헬스"
    },
    { 
      phase: "Phase 3", scale: "1,000만명", label: "전체 고객 + 타사 확산", color: C.purple, done: false,
      detail: "B2B2C 엔진 SDK → 타 금융사 라이선싱",
      metrics: ["Neural CDE 예측 엔진", "멀티 금융사 연합 프로필", "AI 라이프OS"],
      data: "금융 + 소비 + 건강 + 관계 통합"
    },
  ];
  return (
    <div>
      <SlideTitle 
        badge="B2B2C SCALING" 
        title={<>1명 실증 → <span style={{ color: C.accent }}>1,000만명</span> 확대</>}
        sub="내 몸으로 증명한 엔진을 당신의 고객에게 탑재합니다" 
      />
      
      {/* Scale visualization */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: 24 }}>
        {stages.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: [40, 56, 72, 88][i], height: [40, 56, 72, 88][i],
                borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                background: s.done ? s.color : `${s.color}20`,
                border: `2px solid ${s.color}`, margin: "0 auto",
                boxShadow: s.done ? `0 0 20px ${s.color}40` : "none",
              }}>
                <span style={{ fontSize: [14, 13, 12, 11][i], fontWeight: 900, fontFamily: mono, color: s.done ? "#fff" : s.color }}>
                  {s.scale}
                </span>
              </div>
              <div style={{ fontSize: 10, color: s.color, marginTop: 6, fontWeight: 700 }}>{s.label}</div>
            </div>
            {i < 3 && (
              <div style={{ width: 40, height: 2, background: `linear-gradient(to right, ${s.color}, ${stages[i+1].color})`, margin: "0 4px", marginBottom: 18 }} />
            )}
          </div>
        ))}
      </div>

      {/* Detail cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {stages.map((s, i) => (
          <Card key={i} glow={s.done ? s.color : undefined} style={{ opacity: s.done ? 1 : 0.85 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div>
                <span style={{ fontSize: 10, fontFamily: mono, color: s.color }}>{s.phase}</span>
                <span style={{ fontSize: 15, fontWeight: 900, fontFamily: mono, color: s.color, marginLeft: 8 }}>{s.scale}</span>
              </div>
              {s.done && <Badge color={C.green}>✅ 완료</Badge>}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 6 }}>{s.detail}</div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 8, fontStyle: "italic" }}>{s.data}</div>
            {s.metrics.map((m, j) => (
              <div key={j} style={{ fontSize: 11, color: C.muted, marginBottom: 3, display: "flex", gap: 6 }}>
                <span style={{ color: s.color }}>→</span> {m}
              </div>
            ))}
          </Card>
        ))}
      </div>
    </div>
  );
}

// ═══ SLIDE 9: LIVE PoC PROPOSAL ═══
function PocSlide() {
  return (
    <div>
      <SlideTitle 
        badge="LIVE PoC · 신한카드" 
        title="3개월 PoC 제안" 
        sub="이미 검증된 엔진 위에, 우량고객 1,000명 데이터를 얹습니다" 
      />
      
      {/* Live Demo Banner */}
      <Card glow={C.green} style={{ marginBottom: 20, background: `${C.green}08`, border: `1px solid ${C.green}30` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.green }}>🔴 LIVE DEMO 가능</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
              창업자 실데이터 기반 라이브 시연 — 선천 DNA 분석 → 카드 소비 궤적 → 회복률 97% 실시간 확인
            </div>
          </div>
          <div style={{ fontSize: 11, fontFamily: mono, color: C.green, whiteSpace: "nowrap" }}>즉시 구동</div>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 16 }}>
        {[
          { month: "1개월", title: "데이터 연동", items: ["우량고객 1,000명 MCC 데이터 수신", "16 아키타입 초기 분류", "대시보드 셋업 + KPI 설정"], color: C.accent },
          { month: "2개월", title: "학습·검증", items: ["베이지안 갱신 실가동", "예측 vs 실제 행동 일치율 측정", "ROC 임계값 자동 보정 테스트"], color: C.green },
          { month: "3개월", title: "성과 리포트", items: ["A/B 테스트 결과 제출", "맞춤 추천 CTR 비교", "본계약 협의 + 확장 로드맵"], color: C.amber },
        ].map((phase, i) => (
          <Card key={i} glow={phase.color}>
            <div style={{ fontSize: 11, fontFamily: mono, color: phase.color, marginBottom: 4 }}>{phase.month}</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 12 }}>{phase.title}</div>
            {phase.items.map((item, j) => (
              <div key={j} style={{ fontSize: 12, color: C.muted, marginBottom: 6, display: "flex", gap: 6 }}>
                <span style={{ color: phase.color }}>→</span> {item}
              </div>
            ))}
          </Card>
        ))}
      </div>

      {/* B2B2C Revenue Model */}
      <Card>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>B2B2C 수익 모델</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {[
            { model: "API 라이선싱", fee: "₩50M+/년", desc: "Living Profile 엔진 API 제공" },
            { model: "모듈 납품", fee: "₩100M+", desc: "자사 앱 내 SDK 탑재" },
            { model: "데이터 제휴", fee: "MAU 과금", desc: "고객 인사이트 공동 활용" },
          ].map((r, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{r.model}</div>
              <div style={{ fontSize: 16, fontWeight: 900, fontFamily: mono, color: C.green, margin: "4px 0" }}>{r.fee}</div>
              <div style={{ fontSize: 10, color: C.muted }}>{r.desc}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ═══ SLIDE 10: STATUS ═══
function StatusSlide() {
  return (
    <div>
      <SlideTitle badge="CURRENT STATUS" title="기술 현황 · 즉시 실행 가능" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.green, marginBottom: 12 }}>✅ 완료</div>
          {["특허 4건 출원 (1건 심사청구)", "510건 실데이터 6개월 검증 (신한카드)", "4대 알고리즘 수동실증 완료",
            "16 아키타입 분류 체계 확립", "관리자 대시보드 v7.0", "결제 파이프라인 구축(토스)",
            "PDF 리포트 3종 + 4개국어 이메일", "라이브 PoC 데모 구동 가능"].map((item, i) => (
            <div key={i} style={{ fontSize: 12, color: C.muted, marginBottom: 5, paddingLeft: 12, borderLeft: `2px solid ${C.green}30` }}>{item}</div>
          ))}
        </Card>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.amber, marginBottom: 12 }}>⏳ 자동화 대기 (파트너 데이터 연동 후)</div>
          {["베이지안 추론 실시간 엔진 (유저 500+)", "ROC 자동 보정 루프 (A/B 500건+)",
            "비지도 군집화 K-means 전환", "MyData API 연동 (카드사 제휴 후)",
            "Neural CDE 딥러닝 (유저 10K+, 6개월 종단)", "Next.js + PostgreSQL 전환"].map((item, i) => (
            <div key={i} style={{ fontSize: 12, color: C.muted, marginBottom: 5, paddingLeft: 12, borderLeft: `2px solid ${C.amber}30` }}>{item}</div>
          ))}
        </Card>
      </div>
      <Card style={{ background: `linear-gradient(135deg, ${C.accent}15, ${C.purple}15)`, border: `1px solid ${C.accent}30` }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: C.text, marginBottom: 8 }}>
            "수동실증 완료 → <span style={{ color: C.accent }}>자동화</span>만 남았습니다"
          </div>
          <div style={{ fontSize: 13, color: C.muted }}>
            파트너사 데이터 연동 즉시, 3개월 내 Living Profile 엔진 가동 가능
          </div>
          <div style={{ fontSize: 12, fontFamily: mono, color: C.accent, marginTop: 12 }}>
            contact@neurinkairosai.com · P25KAI001KR
          </div>
        </div>
      </Card>
    </div>
  );
}

// ═══ MAIN DECK ═══
const slides = ["cover", "problem", "data", "algorithms", "evolution", "recovery", "prediction", "scaling", "poc", "status"];
const slideNames = ["커버", "문제", "데이터", "알고리즘", "진화", "회복률", "예측", "스케일링", "PoC", "현황"];

export default function NKAIDemoDeckV12() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const renderSlide = () => {
    switch (slides[currentSlide]) {
      case "cover": return <CoverSlide />;
      case "problem": return <ProblemSlide />;
      case "data": return <DataSlide />;
      case "algorithms": return <AlgorithmSlide />;
      case "evolution": return <EvolutionSlide />;
      case "recovery": return <RecoverySlide />;
      case "prediction": return <PredictionSlide />;
      case "scaling": return <ScalingSlide />;
      case "poc": return <PocSlide />;
      case "status": return <StatusSlide />;
      default: return <CoverSlide />;
    }
  };

  return (
    <div style={{
      background: C.bg, minHeight: "100vh", color: C.text,
      fontFamily: sans, display: "flex", flexDirection: "column",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&family=JetBrains+Mono:wght@400;700;900&display=swap');
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: ${C.bg}; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
      `}</style>

      {/* Top Nav */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 20px", borderBottom: `1px solid ${C.border}`,
        background: `${C.surface}dd`, backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 900, color: C.accent, fontFamily: mono }}>N-KAI</span>
          <span style={{ fontSize: 10, color: C.muted }}>B2B2C Demo v1.2</span>
        </div>
        <div style={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
          {slideNames.map((name, i) => (
            <button key={i} onClick={() => setCurrentSlide(i)} style={{
              background: currentSlide === i ? `${C.accent}20` : "transparent",
              border: `1px solid ${currentSlide === i ? C.accent : "transparent"}`,
              borderRadius: 5, padding: "4px 8px", fontSize: 10,
              color: currentSlide === i ? C.accent : C.muted,
              cursor: "pointer", fontWeight: currentSlide === i ? 700 : 400,
              transition: "all 0.2s", fontFamily: sans,
            }}>{name}</button>
          ))}
        </div>
        <div style={{ fontSize: 10, color: C.muted, fontFamily: mono }}>
          {currentSlide + 1}/{slides.length}
        </div>
      </div>

      {/* Content */}
      <div key={currentSlide} style={{
        flex: 1, padding: "24px 32px", maxWidth: 920, margin: "0 auto", width: "100%",
        animation: "fadeIn 0.4s ease-out",
      }}>
        {renderSlide()}
      </div>

      {/* Footer Nav */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "10px 32px", borderTop: `1px solid ${C.border}`,
      }}>
        <button onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))} disabled={currentSlide === 0}
          style={{
            background: currentSlide === 0 ? "transparent" : `${C.accent}12`,
            border: `1px solid ${currentSlide === 0 ? C.border : `${C.accent}44`}`,
            borderRadius: 8, padding: "7px 18px", fontSize: 12,
            color: currentSlide === 0 ? C.muted : C.accent,
            cursor: currentSlide === 0 ? "default" : "pointer", fontWeight: 600, fontFamily: sans,
          }}>← 이전</button>
        <div style={{ display: "flex", gap: 5 }}>
          {slides.map((_, i) => (
            <div key={i} onClick={() => setCurrentSlide(i)} style={{
              width: currentSlide === i ? 22 : 7, height: 7, borderRadius: 4,
              background: currentSlide === i ? C.accent : C.border,
              cursor: "pointer", transition: "all 0.3s",
            }} />
          ))}
        </div>
        <button onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
          disabled={currentSlide === slides.length - 1}
          style={{
            background: currentSlide === slides.length - 1 ? "transparent" : `${C.accent}12`,
            border: `1px solid ${currentSlide === slides.length - 1 ? C.border : `${C.accent}44`}`,
            borderRadius: 8, padding: "7px 18px", fontSize: 12,
            color: currentSlide === slides.length - 1 ? C.muted : C.accent,
            cursor: currentSlide === slides.length - 1 ? "default" : "pointer", fontWeight: 600, fontFamily: sans,
          }}>다음 →</button>
      </div>
    </div>
  );
}
