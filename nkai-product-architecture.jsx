import { useState } from "react";

// ═══════════════════════════════════════════════════════════
// N-KAI PRODUCT ARCHITECTURE — Full Vision Map
// On-Device Edge AI · SDK Engine · Voice · Crime · Wellness
// ═══════════════════════════════════════════════════════════

const TIERS = {
  basic: {
    price: "₩9,900", name: "Basic", color: "#22c55e", icon: "📊",
    tag: "나를 기록하다",
    features: [
      { f: "주간 진화 브리프 (4개국어)", done: true },
      { f: "월간 상세 PDF 리포트", done: true },
      { f: "N-Score 추적", done: true },
      { f: "카카오/공유/저장", done: true },
      { f: "기본 행동 패턴 분석", done: true }
    ],
    data: "카드결제 + 수동입력",
    algo: "베이지안 + ROC (기본)"
  },
  pro: {
    price: "₩19,900", name: "Pro", color: "#8b5cf6", icon: "🧬",
    tag: "나를 이해하다",
    features: [
      { f: "Living Profile 실시간 대시보드", done: true },
      { f: "9축 프로필 레이더 차트", done: true },
      { f: "행동 법칙 발견 & 검증", done: true },
      { f: "클러스터 분화 시각화", done: true },
      { f: "오행 DNA 보정 트래킹", done: true },
      { f: "아키타입 분류 리포트", done: false }
    ],
    data: "Basic + SDK 자동수집",
    algo: "4대 알고리즘 전체"
  },
  premium: {
    price: "₩49,900", name: "Premium", color: "#c9a84c", icon: "👁️",
    tag: "나를 예측하다",
    features: [
      { f: "AI 실시간 대화 (보이스)", done: false },
      { f: "음성 파동 패턴 분석", done: false },
      { f: "다음 행동 예측 (55~100%)", done: true },
      { f: "T-60 골든타임 경고", done: true },
      { f: "오행×식습관 맞춤 웰니스 솔루션", done: false },
      { f: "아키타입별 맞춤 코칭", done: false },
      { f: "전체 리포트 + 대시보드 + 공유/저장", done: true }
    ],
    data: "Pro + 보이스 + 웨어러블",
    algo: "4대 알고리즘 + Neural Voice CDE"
  }
};

const B2B = [
  {
    sector: "🏦 금융/핀테크",
    app: "신용평가 보정, 이상거래 탐지, 맞춤 상품 추천",
    sdk: "행동 리스크 스코어링 API",
    color: "#22c55e"
  },
  {
    sector: "🔍 범죄수사/공공안전",
    app: "고정밀 행동예측, 용의자 프로파일링, 재범 위험도 평가",
    sdk: "Forensic Persona Engine API",
    color: "#ef4444"
  },
  {
    sector: "🏥 헬스케어/웰니스",
    app: "오행 맞춤 건강관리, 식습관 교정, 정신건강 모니터링",
    sdk: "Wellness Prediction API",
    color: "#06b6d4"
  },
  {
    sector: "🛡️ 보이스피싱 방지",
    app: "실시간 음성 분석, 사기 패턴 탐지, 사전 차단",
    sdk: "Voice Phishing Shield API",
    color: "#f59e0b"
  },
  {
    sector: "🎮 콘텐츠/게임",
    app: "유저 이탈 예측, 맞춤 콘텐츠 추천, 감정 분석",
    sdk: "Engagement Prediction API",
    color: "#8b5cf6"
  }
];

const VOICE_PIPELINE = [
  { step: "음성 입력", desc: "실시간 대화 녹음", icon: "🎙️" },
  { step: "파동 추출", desc: "주파수·톤·리듬·침묵패턴", icon: "〰️" },
  { step: "감정 매핑", desc: "분노/불안/기쁨/무기력 분류", icon: "🧠" },
  { step: "아키타입 판별", desc: "MBTI+오행+행동DNA 융합", icon: "🔮" },
  { step: "예측 생성", desc: "다음 행동·리스크 확률", icon: "📡" },
  { step: "경고/코칭", desc: "T-60 발동 또는 맞춤 가이드", icon: "🛡️" }
];

const ARCHETYPE_EXAMPLES = [
  { type: "辛金 분석가", trait: "데이터 기반 의사결정, 루틴 의존형", wellness: "발효식+단백질 중심, 국물 해장 패턴", color: "#c9a84c" },
  { type: "丙火 표현가", trait: "감정 표현 활발, 사교 중심형", wellness: "매운맛+자극식 선호, 에너지 보충형", color: "#ef4444" },
  { type: "壬水 탐험가", trait: "변화 추구, 다양성 선호형", wellness: "퓨전식+새로운 메뉴 도전, 스트레스성 과식 주의", color: "#3b82f6" },
  { type: "甲木 성장가", trait: "목표 지향, 자기계발형", wellness: "채식+건강식 선호, 과도한 절제 주의", color: "#22c55e" }
];

const ROADMAP = [
  { phase: "NOW", period: "~2026.03", items: ["PoC 475건+ 실증 데이터", "Living Profile OS v5.2", "주간 브리프 4개국어", "예측 6연속 100%"], color: "#22c55e" },
  { phase: "Q2", period: "2026.04~06", items: ["SDK 모듈화 (초경량)", "B2B 파트너 1호 연동", "₩9,900 Basic 상용화", "아키타입 분류 v1"], color: "#06b6d4" },
  { phase: "Q3", period: "2026.07~09", items: ["음성 분석 엔진 v1", "₩19,900 Pro 출시", "온디바이스 엣지 AI 적용", "범죄수사 PoC 시작"], color: "#8b5cf6" },
  { phase: "Q4", period: "2026.10~12", items: ["₩49,900 Premium 출시", "보이스 AI 실시간 대화", "오행×웰니스 맞춤 솔루션", "B2B API 정식 오픈"], color: "#c9a84c" }
];

const Pill = ({ children, c = "#c9a84c" }) => (
  <span style={{
    padding: "2px 8px", borderRadius: 10, fontSize: 9, fontWeight: 700,
    background: `${c}15`, color: c, letterSpacing: 0.3
  }}>{children}</span>
);

export default function ProductArch() {
  const [tab, setTab] = useState("tiers");
  const tabs = [
    { id: "tiers", l: "가격 티어" },
    { id: "voice", l: "보이스 AI" },
    { id: "archetype", l: "아키타입" },
    { id: "b2b", l: "B2B 확장" },
    { id: "roadmap", l: "로드맵" }
  ];

  return (
    <div style={{
      fontFamily: "'Cormorant Garamond','Noto Serif KR',Georgia,serif",
      background: "#060910", color: "#e2e8f0", minHeight: "100vh"
    }}>
      <div style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse at 20% 30%, #c9a84c05 0%, transparent 50%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{
          padding: "24px 24px 16px",
          background: "linear-gradient(180deg, #0c1220 0%, #060910 100%)",
          borderBottom: "1px solid #c9a84c20"
        }}>
          <div style={{ fontSize: 8, color: "#c9a84c80", letterSpacing: 6, fontFamily: "'Helvetica Neue',sans-serif" }}>
            N-KAI PRODUCT ARCHITECTURE
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#f1f5f9", marginTop: 6 }}>
            제품 아키텍처 <span style={{ color: "#c9a84c" }}>풀 비전</span>
          </div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 4, fontStyle: "italic" }}>
            On-Device Edge AI · 초경량 SDK · Voice · Crime · Wellness
          </div>

          <div style={{ display: "flex", gap: 3, marginTop: 14, overflowX: "auto" }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: "6px 14px", fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer",
                borderRadius: 8, transition: "all 0.2s", fontFamily: "inherit", whiteSpace: "nowrap",
                background: tab === t.id ? "#c9a84c" : "transparent",
                color: tab === t.id ? "#060910" : "#64748b"
              }}>{t.l}</button>
            ))}
          </div>
        </div>

        <div style={{ padding: "20px 24px", maxWidth: 800, margin: "0 auto" }}>

          {/* ═══ TIERS ═══ */}
          {tab === "tiers" && <div>
            {/* Core Engine Banner */}
            <div style={{
              padding: 16, marginBottom: 20, borderRadius: 12,
              background: "linear-gradient(135deg, #c9a84c08, #c9a84c03)",
              border: "1px solid #c9a84c15", textAlign: "center"
            }}>
              <div style={{ fontSize: 9, color: "#c9a84c", letterSpacing: 4, fontFamily: "'Helvetica Neue',sans-serif" }}>
                CORE ENGINE
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0", marginTop: 6 }}>
                온디바이스 엣지 AI 초경량 SDK
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                4대 특허 알고리즘 · ZKP 프라이버시 · Neural CDE 시계열
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                {["베이지안 추론", "ROC 임계치", "비지도학습", "Neural CDE"].map((a, i) => (
                  <Pill key={i} c="#c9a84c">{a}</Pill>
                ))}
              </div>
            </div>

            {/* Tier Cards */}
            <div style={{ display: "grid", gap: 14 }}>
              {Object.entries(TIERS).map(([k, t]) => (
                <div key={k} style={{
                  padding: 20, borderRadius: 14,
                  background: `${t.color}04`, border: `1px solid ${t.color}20`,
                  position: "relative", overflow: "hidden"
                }}>
                  <div style={{
                    position: "absolute", top: 0, right: 0, width: 120, height: 120,
                    background: `radial-gradient(circle at 100% 0%, ${t.color}08, transparent 70%)`,
                    pointerEvents: "none"
                  }} />

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 24 }}>{t.icon}</span>
                        <div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: t.color }}>{t.name}</div>
                          <div style={{ fontSize: 10, color: "#64748b", fontStyle: "italic" }}>{t.tag}</div>
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{
                        fontSize: 26, fontWeight: 300, color: t.color,
                        fontFamily: "'Cormorant Garamond',Georgia,serif"
                      }}>{t.price}</div>
                      <div style={{ fontSize: 9, color: "#475569" }}>/월</div>
                    </div>
                  </div>

                  <div style={{
                    display: "grid", gap: 4, marginTop: 14,
                    padding: "12px 0", borderTop: `1px solid ${t.color}10`
                  }}>
                    {t.features.map((f, i) => (
                      <div key={i} style={{
                        display: "flex", alignItems: "center", gap: 8,
                        fontSize: 12, color: f.done ? "#cbd5e1" : "#64748b"
                      }}>
                        <span style={{
                          fontSize: 10, color: f.done ? "#22c55e" : "#f59e0b",
                          fontWeight: 700, minWidth: 16
                        }}>{f.done ? "✓" : "◎"}</span>
                        {f.f}
                        {!f.done && <Pill c="#f59e0b">개발중</Pill>}
                      </div>
                    ))}
                  </div>

                  <div style={{
                    display: "flex", gap: 12, marginTop: 10, paddingTop: 10,
                    borderTop: `1px solid ${t.color}08`, fontSize: 10, color: "#475569"
                  }}>
                    <span>데이터: {t.data}</span>
                    <span>·</span>
                    <span>엔진: {t.algo}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Upsell Flow */}
            <div style={{
              marginTop: 20, padding: 16, borderRadius: 12,
              background: "#ffffff03", border: "1px solid #ffffff08", textAlign: "center"
            }}>
              <div style={{ fontSize: 10, color: "#64748b", letterSpacing: 2 }}>GROWTH ENGINE</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginTop: 6 }}>
                데이터가 쌓일수록 기능이 열린다
              </div>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: 8, marginTop: 12, flexWrap: "wrap"
              }}>
                <Pill c="#22c55e">1~2주: Basic 활성</Pill>
                <span style={{ color: "#475569" }}>→</span>
                <Pill c="#8b5cf6">3~4주: Pro 잠금해제</Pill>
                <span style={{ color: "#475569" }}>→</span>
                <Pill c="#c9a84c">5주+: Premium 전체 활성</Pill>
              </div>
              <div style={{ fontSize: 10, color: "#475569", marginTop: 8, fontStyle: "italic" }}>
                "3개월 넣은 내 데이터를 버릴 수 없다" → 자연 유지율 극대화
              </div>
            </div>
          </div>}

          {/* ═══ VOICE AI ═══ */}
          {tab === "voice" && <div>
            <div style={{
              padding: 16, marginBottom: 20, borderRadius: 12,
              background: "linear-gradient(135deg, #c9a84c08, #8b5cf608)",
              border: "1px solid #c9a84c15", textAlign: "center"
            }}>
              <div style={{ fontSize: 28 }}>🎙️</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 8 }}>
                Voice Persona Engine
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                목소리에서 성격을 읽고, 다음 행동을 예측한다
              </div>
            </div>

            {/* Pipeline */}
            <div style={{ display: "grid", gap: 4 }}>
              {VOICE_PIPELINE.map((s, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "12px 16px",
                  background: "#ffffff03", borderRadius: 10,
                  borderLeft: "3px solid #c9a84c30"
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, background: "#c9a84c08",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18
                  }}>{s.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{s.step}</div>
                    <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{s.desc}</div>
                  </div>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%", background: "#c9a84c10",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, color: "#c9a84c", fontWeight: 900
                  }}>{i + 1}</div>
                </div>
              ))}
            </div>

            {/* Voice Analysis Details */}
            <div style={{
              marginTop: 20, padding: 16, borderRadius: 12,
              background: "#8b5cf606", border: "1px solid #8b5cf615"
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#8b5cf6", marginBottom: 10 }}>
                음성 파동에서 추출하는 것들
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {[
                  { l: "주파수 밴드", d: "기본 톤 높낮이 → 에너지 수준" },
                  { l: "말속도 변화", d: "가속/감속 → 불안/확신 판별" },
                  { l: "침묵 패턴", d: "멈춤 길이/빈도 → 사고 깊이" },
                  { l: "감정 스펙트럼", d: "분노/불안/기쁨/무기력 실시간" },
                  { l: "호흡 리듬", d: "깊이/빈도 → 스트레스 지표" },
                  { l: "어휘 밀도", d: "단어 선택 패턴 → 인지 상태" }
                ].map((v, i) => (
                  <div key={i} style={{ padding: "8px 10px", background: "#ffffff03", borderRadius: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#8b5cf6" }}>{v.l}</div>
                    <div style={{ fontSize: 9.5, color: "#64748b", marginTop: 2 }}>{v.d}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Crime Application */}
            <div style={{
              marginTop: 16, padding: 16, borderRadius: 12,
              background: "#ef444406", border: "1px solid #ef444415"
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#ef4444", marginBottom: 8 }}>
                🔍 범죄수사 적용 — 고정밀 예측
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7 }}>
                동일한 음성 분석 파이프라인을 범죄수사에 적용하면: 용의자 진술의 진위 판별 (침묵패턴+말속도 변화),
                행동 프로파일링 (과거 행동 데이터 기반 재범 예측), 보이스피싱 실시간 탐지 (사기 패턴 음성 서명),
                실종자 심리상태 추론 (마지막 통화 음성 분석).
              </div>
              <div style={{ marginTop: 10 }}>
                <Pill c="#ef4444">B2G: 경찰청·검찰·국정원</Pill>
                {" "}
                <Pill c="#f59e0b">B2B: 보험사 사기조사</Pill>
              </div>
            </div>
          </div>}

          {/* ═══ ARCHETYPE ═══ */}
          {tab === "archetype" && <div>
            <div style={{
              padding: 16, marginBottom: 20, borderRadius: 12,
              background: "linear-gradient(135deg, #c9a84c08, #22c55e08)",
              border: "1px solid #c9a84c15", textAlign: "center"
            }}>
              <div style={{ fontSize: 28 }}>🔮</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 8 }}>
                오행 × 행동DNA = 아키타입
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                타고난 오행 + 실제 행동 패턴 → 맞춤 웰니스 솔루션
              </div>
            </div>

            {/* Fusion Formula */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 8, marginBottom: 20, flexWrap: "wrap"
            }}>
              <div style={{ padding: "8px 14px", background: "#ef444410", borderRadius: 8, textAlign: "center" }}>
                <div style={{ fontSize: 9, color: "#ef4444" }}>선천</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>오행 사주</div>
              </div>
              <span style={{ fontSize: 18, color: "#c9a84c" }}>×</span>
              <div style={{ padding: "8px 14px", background: "#22c55e10", borderRadius: 8, textAlign: "center" }}>
                <div style={{ fontSize: 9, color: "#22c55e" }}>후천</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>행동 데이터</div>
              </div>
              <span style={{ fontSize: 18, color: "#c9a84c" }}>×</span>
              <div style={{ padding: "8px 14px", background: "#8b5cf610", borderRadius: 8, textAlign: "center" }}>
                <div style={{ fontSize: 9, color: "#8b5cf6" }}>실시간</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>음성 파동</div>
              </div>
              <span style={{ fontSize: 18, color: "#c9a84c" }}>=</span>
              <div style={{ padding: "8px 14px", background: "#c9a84c10", borderRadius: 8, textAlign: "center" }}>
                <div style={{ fontSize: 9, color: "#c9a84c" }}>결과</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#c9a84c" }}>아키타입</div>
              </div>
            </div>

            {/* Archetype Examples */}
            <div style={{ display: "grid", gap: 10 }}>
              {ARCHETYPE_EXAMPLES.map((a, i) => (
                <div key={i} style={{
                  padding: 16, borderRadius: 12,
                  background: `${a.color}05`, border: `1px solid ${a.color}15`
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: a.color }}>{a.type}</div>
                    {i === 0 && <Pill c="#c9a84c">Architect 현재</Pill>}
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>
                    <b style={{ color: "#e2e8f0" }}>성향:</b> {a.trait}
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>
                    <b style={{ color: "#e2e8f0" }}>맞춤 웰니스:</b> {a.wellness}
                  </div>
                </div>
              ))}
            </div>

            {/* Architect's Case */}
            <div style={{
              marginTop: 16, padding: 16, borderRadius: 12,
              background: "#c9a84c06", border: "1px solid #c9a84c15"
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#c9a84c", marginBottom: 8 }}>
                💎 실증 사례: Architect 이원재 (辛金 분석가)
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 11 }}>
                <div style={{ padding: 10, background: "#ffffff03", borderRadius: 8 }}>
                  <div style={{ color: "#c9a84c", fontWeight: 700, marginBottom: 4 }}>선천 오행</div>
                  <div style={{ color: "#94a3b8" }}>辛金 3개 극강금국<br/>火(표현) 14% 결핍<br/>木(재성) 0% 결핍</div>
                </div>
                <div style={{ padding: 10, background: "#ffffff03", borderRadius: 8 }}>
                  <div style={{ color: "#22c55e", fontWeight: 700, marginBottom: 4 }}>실제 행동</div>
                  <div style={{ color: "#94a3b8" }}>식습관 5극 패턴 확정<br/>국물 동반율 85%+<br/>모닝루틴 3.5년 유지</div>
                </div>
                <div style={{ padding: 10, background: "#ffffff03", borderRadius: 8 }}>
                  <div style={{ color: "#8b5cf6", fontWeight: 700, marginBottom: 4 }}>맞춤 웰니스</div>
                  <div style={{ color: "#94a3b8" }}>발효식+단백질 중심<br/>국물 해장 회복 프로토콜<br/>수분 섭취 우선</div>
                </div>
                <div style={{ padding: 10, background: "#ffffff03", borderRadius: 8 }}>
                  <div style={{ color: "#f59e0b", fontWeight: 700, marginBottom: 4 }}>보정 처방</div>
                  <div style={{ color: "#94a3b8" }}>火 보정: 사교활동 권장<br/>木 보정: 간접 수익구조<br/>水 보정: 산책+수분</div>
                </div>
              </div>
            </div>
          </div>}

          {/* ═══ B2B ═══ */}
          {tab === "b2b" && <div>
            <div style={{
              padding: 16, marginBottom: 20, borderRadius: 12,
              background: "#c9a84c06", border: "1px solid #c9a84c15", textAlign: "center"
            }}>
              <div style={{ fontSize: 9, color: "#c9a84c", letterSpacing: 4, fontFamily: "'Helvetica Neue',sans-serif" }}>
                B2B2C SDK INTEGRATION
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 8 }}>
                기존 앱에 SDK 삽입 → 즉시 페르소나 엔진 탑재
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                독립 앱이 아닌 API/SDK — 파트너의 기존 인프라 활용
              </div>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {B2B.map((b, i) => (
                <div key={i} style={{
                  padding: 16, borderRadius: 12,
                  background: `${b.color}04`, border: `1px solid ${b.color}15`
                }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: b.color }}>{b.sector}</div>
                  <div style={{ fontSize: 12, color: "#cbd5e1", marginTop: 8, lineHeight: 1.6 }}>{b.app}</div>
                  <div style={{ marginTop: 8 }}>
                    <Pill c={b.color}>{b.sdk}</Pill>
                  </div>
                </div>
              ))}
            </div>

            {/* Revenue Model */}
            <div style={{
              marginTop: 16, padding: 16, borderRadius: 12,
              background: "#ffffff03", border: "1px solid #ffffff08"
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#c9a84c", marginBottom: 10 }}>
                💰 B2B 수익 모델
              </div>
              <div style={{ display: "grid", gap: 6 }}>
                {[
                  { model: "API Call 과금", desc: "10원/call · 금융사 일일 수십만 건", rev: "월 수천만원+" },
                  { model: "연간 라이선스", desc: "1억원/년 · 대기업 맞춤 구축", rev: "연 수억원" },
                  { model: "B2C 구독 쉐어", desc: "파트너 앱 내 구독 수익 30% 분배", rev: "스케일 비례" }
                ].map((r, i) => (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "10px 12px", background: "#ffffff03", borderRadius: 8
                  }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{r.model}</div>
                      <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{r.desc}</div>
                    </div>
                    <Pill c="#c9a84c">{r.rev}</Pill>
                  </div>
                ))}
              </div>
            </div>
          </div>}

          {/* ═══ ROADMAP ═══ */}
          {tab === "roadmap" && <div>
            <div style={{ display: "grid", gap: 12 }}>
              {ROADMAP.map((r, i) => (
                <div key={i} style={{
                  padding: 18, borderRadius: 14,
                  background: `${r.color}04`, border: `1px solid ${r.color}15`,
                  borderLeft: `4px solid ${r.color}`,
                  position: "relative"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: r.color }}>{r.phase}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{r.period}</div>
                  </div>
                  <div style={{ display: "grid", gap: 4, marginTop: 10 }}>
                    {r.items.map((item, j) => (
                      <div key={j} style={{
                        display: "flex", alignItems: "center", gap: 8,
                        fontSize: 12, color: "#cbd5e1"
                      }}>
                        <span style={{ color: r.color, fontSize: 10 }}>
                          {i === 0 ? "✓" : "◎"}
                        </span>
                        {item}
                        {i === 0 && <Pill c="#22c55e">완료</Pill>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* IPO Target */}
            <div style={{
              marginTop: 20, padding: 20, borderRadius: 14,
              background: "linear-gradient(135deg, #c9a84c10, #c9a84c05)",
              border: "1px solid #c9a84c25", textAlign: "center"
            }}>
              <div style={{ fontSize: 9, color: "#c9a84c", letterSpacing: 4 }}>TARGET</div>
              <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8, color: "#c9a84c" }}>
                IPO 2029
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>
                B2C 구독 100만 + B2B API 파트너 30+ + B2G 범죄수사 계약
              </div>
            </div>
          </div>}

          {/* Footer */}
          <div style={{
            marginTop: 28, paddingTop: 16, borderTop: "1px solid #c9a84c10",
            textAlign: "center"
          }}>
            <div style={{ fontSize: 8, color: "#334155", letterSpacing: 1, fontFamily: "'Helvetica Neue',sans-serif" }}>
              © 2026 뉴린카이로스에이아이(주) · 특허 4건 출원 · neurinkairosai.com
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
