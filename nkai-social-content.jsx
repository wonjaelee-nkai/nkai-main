import { useState, useEffect, useRef } from "react";

const BRAND = {
  bg: "#07060E",
  card: "#0F0D1A",
  accent: "#A855F7",
  accentGlow: "rgba(168, 85, 247, 0.3)",
  gold: "#F59E0B",
  economic: "#2D8CFF",
  expression: "#5AA8FF",
  crisis: "#00D68F",
  text: "#F8F8FF",
  sub: "#9CA3AF",
  border: "rgba(168, 85, 247, 0.15)",
};

/* ─── Animated Orb ─── */
function Orb({ size = 120, color1 = BRAND.accent, color2 = BRAND.economic, delay = 0 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `radial-gradient(circle at 35% 35%, ${color1}, ${color2}, transparent)`,
      filter: "blur(1px)",
      animation: `orbFloat 4s ease-in-out ${delay}s infinite alternate`,
      position: "relative",
    }}>
      <div style={{
        position: "absolute", inset: -4, borderRadius: "50%",
        background: `radial-gradient(circle at 35% 35%, ${color1}40, transparent 70%)`,
        filter: "blur(12px)",
        animation: `orbPulse 3s ease-in-out ${delay + 0.5}s infinite alternate`,
      }} />
    </div>
  );
}

/* ─── Metric Bar ─── */
function MetricBar({ icon, label, value, color, delay = 0 }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 300 + delay * 200);
    return () => clearTimeout(t);
  }, [value, delay]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <span style={{ fontSize: 14, width: 20 }}>{icon}</span>
      <span style={{ fontSize: 11, color: BRAND.sub, width: 56, fontFamily: "'Noto Sans KR', sans-serif" }}>{label}</span>
      <div style={{
        flex: 1, height: 6, borderRadius: 3,
        background: "rgba(255,255,255,0.06)",
        overflow: "hidden",
      }}>
        <div style={{
          height: "100%", borderRadius: 3,
          background: `linear-gradient(90deg, ${color}, ${color}aa)`,
          width: `${width}%`,
          transition: "width 1.2s cubic-bezier(0.16,1,0.3,1)",
          boxShadow: `0 0 12px ${color}60`,
        }} />
      </div>
      <span style={{
        fontSize: 13, fontWeight: 700, color,
        fontFamily: "'Orbitron', monospace", width: 28, textAlign: "right"
      }}>{value}</span>
    </div>
  );
}

/* ─── N-Score Circle ─── */
function NScoreCircle({ score = 95, grade = "N5" }) {
  const r = 32;
  const c = 2 * Math.PI * r;
  const [offset, setOffset] = useState(c);

  useEffect(() => {
    const t = setTimeout(() => setOffset(c - (score / 100) * c), 500);
    return () => clearTimeout(t);
  }, [score, c]);

  return (
    <div style={{ position: "relative", width: 80, height: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={80} height={80} style={{ position: "absolute", transform: "rotate(-90deg)" }}>
        <circle cx={40} cy={40} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5} />
        <circle cx={40} cy={40} r={r} fill="none" stroke={BRAND.accent} strokeWidth={5}
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.16,1,0.3,1)", filter: `drop-shadow(0 0 6px ${BRAND.accentGlow})` }}
        />
      </svg>
      <div style={{ textAlign: "center", zIndex: 1 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: BRAND.text, fontFamily: "'Orbitron', monospace", lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: 9, color: BRAND.accent, fontWeight: 600, marginTop: 2 }}>{grade}</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TEMPLATE 1: 인스타 피드 — "당신의 금융 DNA는?" 티저
   ═══════════════════════════════════════════════════════ */
function Template1() {
  const [show, setShow] = useState(false);
  useEffect(() => { setTimeout(() => setShow(true), 100); }, []);

  return (
    <div style={{
      width: 380, height: 380, background: BRAND.bg, borderRadius: 8, overflow: "hidden",
      position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    }}>
      {/* Background grid */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.04,
        backgroundImage: `linear-gradient(rgba(168,85,247,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.5) 1px, transparent 1px)`,
        backgroundSize: "40px 40px",
      }} />

      {/* Glow orbs */}
      <div style={{ position: "absolute", top: -30, right: -30, opacity: 0.15 }}>
        <Orb size={160} color1="#A855F7" color2="#2D8CFF" />
      </div>
      <div style={{ position: "absolute", bottom: -40, left: -20, opacity: 0.1 }}>
        <Orb size={120} color1="#00D68F" color2="#5AA8FF" delay={1} />
      </div>

      {/* Content */}
      <div style={{
        position: "relative", zIndex: 2, textAlign: "center",
        opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(20px)",
        transition: "all 0.8s cubic-bezier(0.16,1,0.3,1)",
      }}>
        <div style={{
          fontSize: 10, letterSpacing: 4, color: BRAND.accent, fontWeight: 600,
          fontFamily: "'Orbitron', monospace", marginBottom: 16, textTransform: "uppercase",
        }}>N-KAI · Financial DNA</div>

        <div style={{
          fontSize: 28, fontWeight: 900, color: BRAND.text, lineHeight: 1.3,
          fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 8,
        }}>
          당신의<br />
          <span style={{
            background: "linear-gradient(135deg, #A855F7, #2D8CFF, #00D68F)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            fontSize: 34,
          }}>금융 DNA</span>는?
        </div>

        <div style={{
          fontSize: 12, color: BRAND.sub, lineHeight: 1.6,
          fontFamily: "'Noto Sans KR', sans-serif",
          marginBottom: 24,
        }}>
          AI가 분석하는 16가지 금융 페르소나<br />
          선천적 기질 × 행동 성향 융합 엔진
        </div>

        {/* 16 type dots */}
        <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap", maxWidth: 220, margin: "0 auto 20px" }}>
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} style={{
              width: 16, height: 16, borderRadius: 4,
              background: [BRAND.accent, BRAND.economic, BRAND.expression, BRAND.crisis][i % 4],
              opacity: 0.3 + (i % 4) * 0.2,
              animation: `dotPop 0.4s ease ${0.05 * i}s both`,
              boxShadow: `0 0 8px ${[BRAND.accent, BRAND.economic, BRAND.expression, BRAND.crisis][i % 4]}40`,
            }} />
          ))}
        </div>

        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "8px 20px", borderRadius: 20,
          background: "linear-gradient(135deg, #A855F7, #7C3AED)",
          fontSize: 13, fontWeight: 700, color: "#fff",
          fontFamily: "'Noto Sans KR', sans-serif",
          boxShadow: "0 4px 24px rgba(168,85,247,0.4)",
        }}>
          무료 분석 시작하기 →
        </div>
      </div>

      {/* Bottom brand */}
      <div style={{
        position: "absolute", bottom: 12, fontSize: 9, color: "rgba(255,255,255,0.2)",
        fontFamily: "'Orbitron', monospace", letterSpacing: 2,
      }}>neurinkairosai.com</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TEMPLATE 2: 인스타 스토리 — 개인 결과 공유 카드
   ═══════════════════════════════════════════════════════ */
function Template2() {
  const [show, setShow] = useState(false);
  useEffect(() => { setTimeout(() => setShow(true), 200); }, []);

  return (
    <div style={{
      width: 280, height: 500, background: BRAND.bg, borderRadius: 12, overflow: "hidden",
      position: "relative", display: "flex", flexDirection: "column",
    }}>
      {/* Top glow */}
      <div style={{
        position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)",
        width: 200, height: 200, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(168,85,247,0.2), transparent 70%)",
        filter: "blur(20px)",
      }} />

      {/* Header */}
      <div style={{ padding: "20px 20px 0", position: "relative", zIndex: 2 }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16,
        }}>
          <span style={{ fontSize: 9, color: BRAND.accent, fontFamily: "'Orbitron', monospace", letterSpacing: 2 }}>N-KAI</span>
          <span style={{ fontSize: 9, color: BRAND.sub, fontFamily: "'Orbitron', monospace" }}>AI 금융 DNA 분석</span>
        </div>

        {/* Archetype */}
        <div style={{
          textAlign: "center",
          opacity: show ? 1 : 0, transform: show ? "scale(1)" : "scale(0.8)",
          transition: "all 0.6s cubic-bezier(0.16,1,0.3,1) 0.2s",
        }}>
          <div style={{ marginBottom: 8 }}>
            <Orb size={64} color1="#A855F7" color2="#7C3AED" />
          </div>
          <div style={{
            fontSize: 32, fontWeight: 800, color: BRAND.text,
            fontFamily: "'Orbitron', monospace", letterSpacing: 2,
            textShadow: "0 0 30px rgba(168,85,247,0.5)",
          }}>ENFJ</div>
          <div style={{
            display: "inline-block", padding: "3px 10px", borderRadius: 4,
            background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)",
            fontSize: 10, color: BRAND.accent, fontWeight: 600, marginTop: 4,
            fontFamily: "'Noto Sans KR', sans-serif",
          }}>비전가형</div>
          <div style={{
            fontSize: 18, fontWeight: 800, color: BRAND.text, marginTop: 8,
            fontFamily: "'Noto Sans KR', sans-serif",
          }}>"이상적 전도사"</div>
          <div style={{
            fontSize: 11, color: BRAND.sub, marginTop: 4, lineHeight: 1.5,
            fontFamily: "'Noto Sans KR', sans-serif",
          }}>사람과 신용을 자산으로 전환시키는<br />소셜 매칭의 귀재</div>
        </div>
      </div>

      {/* Metrics */}
      <div style={{
        margin: "16px 20px 0", padding: 14, borderRadius: 10,
        background: "rgba(255,255,255,0.03)", border: `1px solid ${BRAND.border}`,
        opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(15px)",
        transition: "all 0.6s cubic-bezier(0.16,1,0.3,1) 0.5s",
      }}>
        <MetricBar icon="💰" label="경제감각" value={80} color={BRAND.economic} delay={0} />
        <MetricBar icon="⚡" label="표현에너지" value={95} color={BRAND.expression} delay={1} />
        <MetricBar icon="🛡️" label="위기대응력" value={82} color={BRAND.crisis} delay={2} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
          <NScoreCircle score={95} grade="N5" />
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: BRAND.sub }}>종합력</div>
            <div style={{
              fontSize: 28, fontWeight: 800, color: BRAND.text,
              fontFamily: "'Orbitron', monospace",
              background: "linear-gradient(135deg, #A855F7, #2D8CFF)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>86</div>
          </div>
        </div>
      </div>

      {/* Celebrity */}
      <div style={{
        margin: "12px 20px", padding: "10px 14px", borderRadius: 8,
        background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)",
        opacity: show ? 1 : 0, transition: "opacity 0.6s 0.8s",
      }}>
        <div style={{ fontSize: 9, color: BRAND.gold, fontWeight: 600, marginBottom: 4 }}>
          ⭐ 유사 성향 인물
        </div>
        <div style={{ fontSize: 12, color: BRAND.text, fontWeight: 700, fontFamily: "'Noto Sans KR', sans-serif" }}>
          오프라 윈프리 · 유재석 · 사라 블레이클리
        </div>
      </div>

      {/* CTA */}
      <div style={{ marginTop: "auto", padding: "0 20px 16px", textAlign: "center" }}>
        <div style={{
          padding: "10px 0", borderRadius: 8,
          background: "linear-gradient(135deg, #A855F7, #7C3AED)",
          fontSize: 13, fontWeight: 700, color: "#fff",
          fontFamily: "'Noto Sans KR', sans-serif",
          boxShadow: "0 4px 20px rgba(168,85,247,0.3)",
        }}>나도 금융 DNA 분석받기 →</div>
        <div style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", marginTop: 6, fontFamily: "'Orbitron', monospace" }}>
          neurinkairosai.com
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TEMPLATE 3: 틱톡/릴스 — "워런 버핏과 같은 유형?" 훅
   ═══════════════════════════════════════════════════════ */
function Template3() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 500),
      setTimeout(() => setStep(2), 1500),
      setTimeout(() => setStep(3), 2800),
      setTimeout(() => setStep(4), 4000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div style={{
      width: 280, height: 500, background: BRAND.bg, borderRadius: 12, overflow: "hidden",
      position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    }}>
      {/* Background pulse */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(circle at 50% 50%, rgba(168,85,247,0.08), transparent 70%)",
        animation: "bgPulse 3s ease-in-out infinite",
      }} />

      {/* Step 1: Hook question */}
      <div style={{
        position: "absolute", textAlign: "center", zIndex: 2,
        opacity: step >= 1 && step < 2 ? 1 : 0,
        transform: step >= 1 && step < 2 ? "scale(1)" : "scale(0.8)",
        transition: "all 0.5s cubic-bezier(0.16,1,0.3,1)",
      }}>
        <div style={{
          fontSize: 26, fontWeight: 900, color: BRAND.text, lineHeight: 1.4,
          fontFamily: "'Noto Sans KR', sans-serif",
        }}>
          나는 정말<br />
          <span style={{ color: BRAND.gold, fontSize: 30 }}>워런 버핏</span>과<br />
          같은 유형일까?
        </div>
      </div>

      {/* Step 2: AI analyzing */}
      <div style={{
        position: "absolute", textAlign: "center", zIndex: 2,
        opacity: step >= 2 && step < 3 ? 1 : 0,
        transform: step >= 2 && step < 3 ? "scale(1)" : "scale(0.9)",
        transition: "all 0.5s cubic-bezier(0.16,1,0.3,1)",
      }}>
        <div style={{ marginBottom: 16 }}>
          <Orb size={80} color1="#A855F7" color2="#2D8CFF" />
        </div>
        <div style={{
          fontSize: 11, color: BRAND.accent, letterSpacing: 3,
          fontFamily: "'Orbitron', monospace", marginBottom: 8,
        }}>ANALYZING...</div>
        <div style={{
          fontSize: 14, color: BRAND.sub,
          fontFamily: "'Noto Sans KR', sans-serif",
        }}>
          선천적 기질 × 행동 성향<br />AI 융합 분석 중
        </div>
        <div style={{
          width: 160, height: 3, borderRadius: 2, margin: "16px auto 0",
          background: "rgba(255,255,255,0.06)", overflow: "hidden",
        }}>
          <div style={{
            height: "100%", borderRadius: 2,
            background: `linear-gradient(90deg, ${BRAND.accent}, ${BRAND.economic})`,
            animation: "loadBar 1.5s ease-in-out infinite",
          }} />
        </div>
      </div>

      {/* Step 3: Result reveal */}
      <div style={{
        position: "absolute", textAlign: "center", zIndex: 2,
        opacity: step >= 3 && step < 4 ? 1 : 0,
        transform: step >= 3 && step < 4 ? "scale(1)" : "scale(0.7)",
        transition: "all 0.6s cubic-bezier(0.16,1,0.3,1)",
      }}>
        <div style={{
          fontSize: 40, fontWeight: 900, fontFamily: "'Orbitron', monospace",
          background: "linear-gradient(135deg, #F59E0B, #A855F7)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          textShadow: "none", marginBottom: 8,
        }}>ISTJ</div>
        <div style={{
          fontSize: 10, padding: "3px 12px", borderRadius: 4,
          background: "rgba(168,85,247,0.15)", color: BRAND.accent,
          display: "inline-block", marginBottom: 8, fontWeight: 600,
        }}>분석가형</div>
        <div style={{
          fontSize: 20, fontWeight: 800, color: BRAND.text,
          fontFamily: "'Noto Sans KR', sans-serif",
        }}>"냉철한 전략가"</div>
        <div style={{
          fontSize: 12, color: BRAND.gold, marginTop: 8, fontWeight: 600,
          fontFamily: "'Noto Sans KR', sans-serif",
        }}>⭐ 워런 버핏 · 벤저민 그레이엄</div>
      </div>

      {/* Step 4: CTA */}
      <div style={{
        position: "absolute", textAlign: "center", zIndex: 2,
        opacity: step >= 4 ? 1 : 0,
        transform: step >= 4 ? "translateY(0)" : "translateY(30px)",
        transition: "all 0.6s cubic-bezier(0.16,1,0.3,1)",
      }}>
        <div style={{
          fontSize: 22, fontWeight: 900, color: BRAND.text, marginBottom: 6,
          fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.4,
        }}>
          당신의<br />
          <span style={{
            background: "linear-gradient(135deg, #A855F7, #00D68F)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>금융 DNA</span>는<br />
          누구와 같을까?
        </div>
        <div style={{
          marginTop: 20, padding: "12px 28px", borderRadius: 24,
          background: "linear-gradient(135deg, #A855F7, #7C3AED)",
          fontSize: 14, fontWeight: 700, color: "#fff",
          fontFamily: "'Noto Sans KR', sans-serif",
          boxShadow: "0 4px 30px rgba(168,85,247,0.5)",
          animation: "ctaPulse 2s ease-in-out infinite",
        }}>지금 무료 분석 →</div>
        <div style={{ fontSize: 9, color: BRAND.sub, marginTop: 10, fontFamily: "'Orbitron', monospace" }}>
          neurinkairosai.com
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TEMPLATE 4: 캐러셀 — 16유형 미니 카드 그리드
   ═══════════════════════════════════════════════════════ */
function Template4() {
  const types = [
    { code: "ISTJ", name: "냉철한 전략가", group: "분석가", color: "#2D8CFF" },
    { code: "ISFJ", name: "꾸준한 수호자", group: "실용주의", color: "#00D68F" },
    { code: "INFJ", name: "통찰의 설계자", group: "비전가", color: "#A855F7" },
    { code: "INTJ", name: "원칙의 건축가", group: "항해사", color: "#F59E0B" },
    { code: "ISTP", name: "정밀한 관찰자", group: "분석가", color: "#2D8CFF" },
    { code: "ISFP", name: "감성 큐레이터", group: "실용주의", color: "#00D68F" },
    { code: "INFP", name: "이상적 탐험가", group: "비전가", color: "#A855F7" },
    { code: "INTP", name: "논리의 해체자", group: "항해사", color: "#F59E0B" },
    { code: "ESTP", name: "본능의 트레이더", group: "분석가", color: "#2D8CFF" },
    { code: "ESFP", name: "기회의 서퍼", group: "실용주의", color: "#00D68F" },
    { code: "ENFP", name: "영감의 연금술사", group: "비전가", color: "#A855F7" },
    { code: "ENTP", name: "파괴적 개척자", group: "항해사", color: "#F59E0B" },
    { code: "ESTJ", name: "체계의 사령관", group: "분석가", color: "#2D8CFF" },
    { code: "ESFJ", name: "신뢰의 매니저", group: "실용주의", color: "#00D68F" },
    { code: "ENFJ", name: "이상적 전도사", group: "비전가", color: "#A855F7" },
    { code: "ENTJ", name: "제국의 총사령관", group: "항해사", color: "#F59E0B" },
  ];

  return (
    <div style={{
      width: 380, height: 380, background: BRAND.bg, borderRadius: 8, overflow: "hidden",
      position: "relative", padding: 16,
    }}>
      <div style={{
        position: "absolute", inset: 0, opacity: 0.03,
        backgroundImage: `radial-gradient(circle at 2px 2px, rgba(168,85,247,0.5) 1px, transparent 0)`,
        backgroundSize: "20px 20px",
      }} />

      <div style={{
        textAlign: "center", marginBottom: 12, position: "relative", zIndex: 2,
      }}>
        <div style={{ fontSize: 9, color: BRAND.accent, fontFamily: "'Orbitron', monospace", letterSpacing: 3, marginBottom: 4 }}>
          N-KAI ARCHETYPES
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: BRAND.text, fontFamily: "'Noto Sans KR', sans-serif" }}>
          16가지 금융 DNA 유형
        </div>
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6,
        position: "relative", zIndex: 2,
      }}>
        {types.map((t, i) => (
          <div key={t.code} style={{
            background: "rgba(255,255,255,0.03)",
            border: `1px solid ${t.color}25`,
            borderRadius: 6, padding: "8px 4px", textAlign: "center",
            animation: `cardReveal 0.4s ease ${i * 0.04}s both`,
            cursor: "default",
            transition: "border-color 0.2s",
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%", margin: "0 auto 4px",
              background: t.color, boxShadow: `0 0 8px ${t.color}60`,
            }} />
            <div style={{
              fontSize: 10, fontWeight: 800, color: BRAND.text,
              fontFamily: "'Orbitron', monospace",
            }}>{t.code}</div>
            <div style={{
              fontSize: 8, color: BRAND.sub, marginTop: 2, lineHeight: 1.2,
              fontFamily: "'Noto Sans KR', sans-serif",
            }}>{t.name}</div>
            <div style={{
              fontSize: 7, color: t.color, marginTop: 2, fontWeight: 600,
            }}>{t.group}</div>
          </div>
        ))}
      </div>

      <div style={{
        textAlign: "center", marginTop: 10, position: "relative", zIndex: 2,
      }}>
        <span style={{
          fontSize: 11, color: BRAND.accent, fontWeight: 600,
          fontFamily: "'Noto Sans KR', sans-serif",
        }}>당신은 어떤 유형? → neurinkairosai.com</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TEMPLATE 5: 인스타 스토리 — 질문 스토리용
   ═══════════════════════════════════════════════════════ */
function Template5() {
  return (
    <div style={{
      width: 280, height: 500, background: BRAND.bg, borderRadius: 12, overflow: "hidden",
      position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "50%",
        background: "linear-gradient(180deg, rgba(168,85,247,0.1), transparent)",
      }} />

      <div style={{ position: "relative", zIndex: 2, textAlign: "center", padding: "0 24px" }}>
        <div style={{
          fontSize: 9, color: BRAND.accent, fontFamily: "'Orbitron', monospace",
          letterSpacing: 3, marginBottom: 20,
        }}>N-KAI · QUIZ</div>

        <div style={{
          fontSize: 22, fontWeight: 900, color: BRAND.text, lineHeight: 1.4,
          fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 24,
        }}>
          예상치 못한<br />
          <span style={{ color: BRAND.economic }}>100만원</span>이<br />
          생겼다면?
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
          {[
            { emoji: "📈", text: "바로 투자한다", color: BRAND.economic },
            { emoji: "🏦", text: "일단 저축한다", color: BRAND.crisis },
            { emoji: "🎁", text: "나를 위해 쓴다", color: BRAND.expression },
            { emoji: "📊", text: "계획을 세운다", color: BRAND.accent },
          ].map((opt, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
              borderRadius: 10, background: "rgba(255,255,255,0.04)",
              border: `1px solid ${opt.color}20`,
              fontSize: 14, color: BRAND.text, fontWeight: 600,
              fontFamily: "'Noto Sans KR', sans-serif",
              animation: `slideUp 0.4s ease ${0.1 * i + 0.3}s both`,
            }}>
              <span style={{ fontSize: 18 }}>{opt.emoji}</span>
              {opt.text}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24, fontSize: 11, color: BRAND.sub, fontFamily: "'Noto Sans KR', sans-serif" }}>
          당신의 선택이 금융 DNA를 말해줍니다
        </div>
        <div style={{
          marginTop: 12, padding: "8px 20px", borderRadius: 20,
          background: "linear-gradient(135deg, #A855F7, #7C3AED)",
          fontSize: 12, fontWeight: 700, color: "#fff", display: "inline-block",
          fontFamily: "'Noto Sans KR', sans-serif",
        }}>내 금융 DNA 확인하기 →</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════════ */
export default function App() {
  const [active, setActive] = useState(0);

  const templates = [
    { name: "피드: 티저", desc: "인스타 정사각 피드", component: <Template1 /> },
    { name: "스토리: 결과 공유", desc: "인스타/틱톡 스토리", component: <Template2 /> },
    { name: "릴스: 유명인 훅", desc: "틱톡/릴스 애니메이션", component: <Template3 /> },
    { name: "피드: 16유형", desc: "캐러셀/그리드", component: <Template4 /> },
    { name: "스토리: 퀴즈", desc: "참여 유도형", component: <Template5 /> },
  ];

  return (
    <div style={{ background: "#050510", minHeight: "100vh", padding: "24px 0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;600;700;800;900&family=Orbitron:wght@600;700;800;900&display=swap');

        @keyframes orbFloat {
          0% { transform: translateY(0) rotate(0deg); }
          100% { transform: translateY(-10px) rotate(5deg); }
        }
        @keyframes orbPulse {
          0% { opacity: 0.4; }
          100% { opacity: 0.8; }
        }
        @keyframes dotPop {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes bgPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes loadBar {
          0% { width: 0; }
          50% { width: 80%; }
          100% { width: 100%; }
        }
        @keyframes ctaPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        @keyframes cardReveal {
          from { transform: scale(0.8) translateY(8px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(15px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{
          fontSize: 10, letterSpacing: 4, color: BRAND.accent,
          fontFamily: "'Orbitron', monospace", marginBottom: 6,
        }}>N-KAI · MUSE MODE</div>
        <div style={{
          fontSize: 20, fontWeight: 800, color: BRAND.text,
          fontFamily: "'Noto Sans KR', sans-serif",
        }}>소셜 미디어 콘텐츠 시안</div>
        <div style={{
          fontSize: 12, color: BRAND.sub, marginTop: 4,
          fontFamily: "'Noto Sans KR', sans-serif",
        }}>인스타그램 · 틱톡 · 릴스용</div>
      </div>

      {/* Tab navigation */}
      <div style={{
        display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap",
        marginBottom: 24, padding: "0 16px",
      }}>
        {templates.map((t, i) => (
          <button key={i} onClick={() => setActive(i)} style={{
            padding: "6px 14px", borderRadius: 20, border: "none",
            background: active === i ? "linear-gradient(135deg, #A855F7, #7C3AED)" : "rgba(255,255,255,0.05)",
            color: active === i ? "#fff" : BRAND.sub,
            fontSize: 11, fontWeight: 600, cursor: "pointer",
            fontFamily: "'Noto Sans KR', sans-serif",
            transition: "all 0.2s",
          }}>{t.name}</button>
        ))}
      </div>

      {/* Preview */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <div style={{
          padding: 24, borderRadius: 16,
          background: "rgba(255,255,255,0.02)",
          border: `1px solid ${BRAND.border}`,
          boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
        }}>
          {templates[active].component}
        </div>
        <div style={{
          fontSize: 11, color: BRAND.sub, textAlign: "center",
          fontFamily: "'Noto Sans KR', sans-serif",
        }}>
          {templates[active].desc} · 스크린샷으로 즉시 사용 가능
        </div>
      </div>

      {/* Usage guide */}
      <div style={{
        maxWidth: 420, margin: "28px auto 0", padding: "16px 20px",
        borderRadius: 12, background: "rgba(168,85,247,0.05)",
        border: `1px solid ${BRAND.border}`,
      }}>
        <div style={{
          fontSize: 12, fontWeight: 700, color: BRAND.accent, marginBottom: 8,
          fontFamily: "'Noto Sans KR', sans-serif",
        }}>📱 활용 가이드</div>
        <div style={{
          fontSize: 11, color: BRAND.sub, lineHeight: 1.8,
          fontFamily: "'Noto Sans KR', sans-serif",
        }}>
          <strong style={{ color: BRAND.text }}>피드 티저:</strong> "당신의 금융 DNA는?" → 프로필 첫 고정 게시물<br/>
          <strong style={{ color: BRAND.text }}>결과 공유:</strong> 분석 후 유저가 직접 캡처·공유하는 포맷<br/>
          <strong style={{ color: BRAND.text }}>릴스/틱톡:</strong> 훅→분석→결과→CTA 4단계 15초 시퀀스<br/>
          <strong style={{ color: BRAND.text }}>16유형 그리드:</strong> 캐러셀 2장째 or 단독 피드<br/>
          <strong style={{ color: BRAND.text }}>퀴즈 스토리:</strong> "투표하기" 스티커와 함께 참여 유도
        </div>
      </div>
    </div>
  );
}
