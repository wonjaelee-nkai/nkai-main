import { useState, useEffect, useRef } from "react";

const BRAND = {
  bg: "#07060E",
  card: "#0E0C18",
  cardAlt: "#12101F",
  accent: "#A855F7",
  accentGlow: "rgba(168, 85, 247, 0.25)",
  accentSoft: "rgba(168, 85, 247, 0.08)",
  gold: "#F59E0B",
  goldGlow: "rgba(245, 158, 11, 0.15)",
  economic: "#2D8CFF",
  expression: "#5AA8FF",
  crisis: "#00D68F",
  text: "#F4F4FB",
  textBright: "#FFFFFF",
  sub: "#8B8DA3",
  subLight: "#B0B2C3",
  border: "rgba(168, 85, 247, 0.12)",
  borderLight: "rgba(255,255,255,0.06)",
  risk: "#EF4444",
  prime: "#00D68F",
};

const GRADES = {
  N1: { label: "Prime", color: BRAND.prime, glow: "rgba(0,214,143,0.3)" },
  N2: { label: "High", color: "#34D399", glow: "rgba(52,211,153,0.3)" },
  N3: { label: "Upper Mid", color: "#60A5FA", glow: "rgba(96,165,250,0.3)" },
  N4: { label: "Mid Plus", color: "#818CF8", glow: "rgba(129,140,248,0.3)" },
  N5: { label: "Balanced", color: BRAND.accent, glow: BRAND.accentGlow },
  N6: { label: "Mid", color: "#F59E0B", glow: "rgba(245,158,11,0.3)" },
  N7: { label: "Lower Mid", color: "#FB923C", glow: "rgba(251,146,60,0.3)" },
  N8: { label: "Caution", color: "#F87171", glow: "rgba(248,113,113,0.3)" },
  N9: { label: "Risk", color: BRAND.risk, glow: "rgba(239,68,68,0.3)" },
};

/* ─── Animated Orb (개선: 더 부드러운 글로우) ─── */
function Orb({ size = 120, color1 = BRAND.accent, color2 = BRAND.economic, delay = 0 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `radial-gradient(circle at 38% 38%, ${color1}cc, ${color2}88, transparent 70%)`,
      filter: "blur(2px)",
      animation: `orbFloat 5s ease-in-out ${delay}s infinite alternate`,
      position: "relative",
    }}>
      <div style={{
        position: "absolute", inset: -8, borderRadius: "50%",
        background: `radial-gradient(circle at 38% 38%, ${color1}30, transparent 65%)`,
        filter: "blur(16px)",
        animation: `orbPulse 3.5s ease-in-out ${delay + 0.5}s infinite alternate`,
      }} />
    </div>
  );
}

/* ─── Metric Bar (개선: 수치 애니메이션 + 글로우 강화) ─── */
function MetricBar({ icon, label, value, color, delay = 0 }) {
  const [width, setWidth] = useState(0);
  const [displayVal, setDisplayVal] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setWidth(value);
      let start = 0;
      const step = Math.ceil(value / 30);
      const interval = setInterval(() => {
        start += step;
        if (start >= value) { start = value; clearInterval(interval); }
        setDisplayVal(start);
      }, 30);
      return () => clearInterval(interval);
    }, 400 + delay * 250);
    return () => clearTimeout(t);
  }, [value, delay]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
      <span style={{ fontSize: 14, width: 20, textAlign: "center" }}>{icon}</span>
      <span style={{ fontSize: 10, color: BRAND.sub, width: 52, fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 500 }}>{label}</span>
      <div style={{
        flex: 1, height: 5, borderRadius: 3,
        background: "rgba(255,255,255,0.04)",
        overflow: "hidden", position: "relative",
      }}>
        <div style={{
          height: "100%", borderRadius: 3,
          background: `linear-gradient(90deg, ${color}cc, ${color})`,
          width: `${width}%`,
          transition: "width 1.4s cubic-bezier(0.16,1,0.3,1)",
          boxShadow: `0 0 14px ${color}50, inset 0 1px 0 rgba(255,255,255,0.15)`,
        }} />
      </div>
      <span style={{
        fontSize: 12, fontWeight: 700, color,
        fontFamily: "'Orbitron', monospace", width: 28, textAlign: "right",
      }}>{displayVal}</span>
    </div>
  );
}

/* ─── N-Score Gauge Bar (신규: 게이지바 + ▼ 마커) ─── */
function NScoreGauge({ score = 632, max = 1000, grade = "N5", low = 581, high = 683 }) {
  const pct = (score / max) * 100;
  const gradeInfo = GRADES[grade] || GRADES.N5;
  const [show, setShow] = useState(false);
  useEffect(() => { setTimeout(() => setShow(true), 600); }, []);

  return (
    <div style={{ width: "100%" }}>
      {/* Score + Grade row */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{
            fontSize: 36, fontWeight: 900, color: BRAND.textBright,
            fontFamily: "'Orbitron', monospace", lineHeight: 1,
          }}>{score}</span>
          <span style={{ fontSize: 12, color: BRAND.sub, fontFamily: "'Orbitron', monospace" }}>/ {max}</span>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{
            fontSize: 14, fontWeight: 800, color: gradeInfo.color,
            fontFamily: "'Orbitron', monospace",
          }}>{grade} {gradeInfo.label}</div>
        </div>
      </div>

      {/* Gauge bar with marker */}
      <div style={{ position: "relative", height: 18, marginBottom: 6 }}>
        {/* Bar track */}
        <div style={{
          position: "absolute", top: 6, left: 0, right: 0, height: 6, borderRadius: 3,
          background: "linear-gradient(90deg, #EF4444 0%, #F59E0B 30%, #A855F7 55%, #60A5FA 75%, #00D68F 100%)",
          opacity: 0.7,
        }} />
        {/* Glass overlay */}
        <div style={{
          position: "absolute", top: 6, left: 0, right: 0, height: 6, borderRadius: 3,
          background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 100%)",
        }} />
        {/* Position marker ▼ */}
        <div style={{
          position: "absolute",
          left: show ? `${pct}%` : "0%",
          top: 0,
          transform: "translateX(-50%)",
          transition: "left 1.5s cubic-bezier(0.16,1,0.3,1)",
          display: "flex", flexDirection: "column", alignItems: "center",
        }}>
          <div style={{
            width: 0, height: 0,
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderTop: `6px solid ${gradeInfo.color}`,
            filter: `drop-shadow(0 0 4px ${gradeInfo.glow})`,
          }} />
          <div style={{
            width: 2, height: 8, borderRadius: 1,
            background: gradeInfo.color,
            boxShadow: `0 0 8px ${gradeInfo.glow}`,
          }} />
        </div>
      </div>

      {/* Grade labels */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        fontSize: 8, color: BRAND.sub, fontFamily: "'Orbitron', monospace",
      }}>
        <span>N9 Risk</span>
        <span>N5 Mid</span>
        <span>N1 Prime</span>
      </div>

      {/* Confidence interval */}
      <div style={{
        marginTop: 8, textAlign: "center",
        fontSize: 10, color: BRAND.sub, fontFamily: "'Noto Sans KR', sans-serif",
      }}>
        95% 신뢰구간: <span style={{ color: BRAND.subLight, fontFamily: "'Orbitron', monospace", fontWeight: 600 }}>{low} ~ {high}</span>
      </div>
    </div>
  );
}

/* ─── N-Score Circle (개선: 더 정교한 SVG + 카운트업) ─── */
function NScoreCircle({ score = 95, grade = "N5", size = 80 }) {
  const r = (size / 2) - 8;
  const c = 2 * Math.PI * r;
  const [offset, setOffset] = useState(c);
  const [displayVal, setDisplayVal] = useState(0);
  const gradeInfo = GRADES[grade] || GRADES.N5;

  useEffect(() => {
    const t = setTimeout(() => {
      setOffset(c - (score / 100) * c);
      let v = 0;
      const interval = setInterval(() => {
        v += 2;
        if (v >= score) { v = score; clearInterval(interval); }
        setDisplayVal(v);
      }, 25);
    }, 500);
    return () => clearTimeout(t);
  }, [score, c]);

  return (
    <div style={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size} style={{ position: "absolute", transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={4} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={gradeInfo.color} strokeWidth={4}
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.8s cubic-bezier(0.16,1,0.3,1)", filter: `drop-shadow(0 0 6px ${gradeInfo.glow})` }}
        />
      </svg>
      <div style={{ textAlign: "center", zIndex: 1 }}>
        <div style={{ fontSize: size * 0.26, fontWeight: 800, color: BRAND.textBright, fontFamily: "'Orbitron', monospace", lineHeight: 1 }}>{displayVal}</div>
        <div style={{ fontSize: size * 0.1, color: gradeInfo.color, fontWeight: 700, marginTop: 2, fontFamily: "'Orbitron', monospace" }}>{grade}</div>
      </div>
    </div>
  );
}

/* ─── Particle Background (신규: 미세 파티클 배경) ─── */
function ParticleBg({ count = 20, color = BRAND.accent }) {
  const particles = useRef(
    Array.from({ length: count }).map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 2,
      duration: 3 + Math.random() * 4,
      delay: Math.random() * 3,
      opacity: 0.1 + Math.random() * 0.2,
    }))
  ).current;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {particles.map((p, i) => (
        <div key={i} style={{
          position: "absolute",
          left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.size, borderRadius: "50%",
          background: color,
          opacity: p.opacity,
          animation: `particleDrift ${p.duration}s ease-in-out ${p.delay}s infinite alternate`,
        }} />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TEMPLATE 1: 인스타 피드 — "당신의 금융 DNA는?" 티저
   (개선: 파티클 배경, 타이포 강화, CTA 펄스)
   ═══════════════════════════════════════════════════════ */
function Template1() {
  const [show, setShow] = useState(false);
  useEffect(() => { setTimeout(() => setShow(true), 100); }, []);

  return (
    <div style={{
      width: 380, height: 380, background: BRAND.bg, borderRadius: 8, overflow: "hidden",
      position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    }}>
      {/* Grid bg */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.03,
        backgroundImage: `linear-gradient(rgba(168,85,247,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.4) 1px, transparent 1px)`,
        backgroundSize: "40px 40px",
      }} />

      <ParticleBg count={15} />

      {/* Glow orbs */}
      <div style={{ position: "absolute", top: -40, right: -30, opacity: 0.12 }}>
        <Orb size={180} color1="#A855F7" color2="#2D8CFF" />
      </div>
      <div style={{ position: "absolute", bottom: -50, left: -30, opacity: 0.08 }}>
        <Orb size={140} color1="#00D68F" color2="#5AA8FF" delay={1.5} />
      </div>

      {/* Content */}
      <div style={{
        position: "relative", zIndex: 2, textAlign: "center",
        opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(24px)",
        transition: "all 0.9s cubic-bezier(0.16,1,0.3,1)",
      }}>
        <div style={{
          fontSize: 9, letterSpacing: 5, color: BRAND.accent, fontWeight: 700,
          fontFamily: "'Orbitron', monospace", marginBottom: 18, textTransform: "uppercase",
          opacity: 0.9,
        }}>N-KAI · Financial DNA Engine</div>

        <div style={{
          fontSize: 28, fontWeight: 900, color: BRAND.text, lineHeight: 1.35,
          fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 6,
        }}>
          당신의<br />
          <span style={{
            background: "linear-gradient(135deg, #A855F7 0%, #2D8CFF 50%, #00D68F 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            fontSize: 36, fontWeight: 900,
          }}>금융 DNA</span>는?
        </div>

        <div style={{
          fontSize: 11.5, color: BRAND.sub, lineHeight: 1.7,
          fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 22,
        }}>
          AI가 읽는 16가지 금융 페르소나<br />
          <span style={{ color: BRAND.subLight }}>선천적 기질</span> × <span style={{ color: BRAND.subLight }}>행동 성향</span> 융합 엔진
        </div>

        {/* 16 type dots — 개선: 4x4 깔끔한 그리드 */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 5,
          maxWidth: 200, margin: "0 auto 22px",
        }}>
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} style={{
              width: 14, height: 14, borderRadius: 3,
              background: [BRAND.economic, BRAND.crisis, BRAND.accent, BRAND.gold][i % 4],
              opacity: 0.25 + (i % 4) * 0.18,
              animation: `dotPop 0.35s ease ${0.04 * i}s both`,
              boxShadow: `0 0 6px ${[BRAND.economic, BRAND.crisis, BRAND.accent, BRAND.gold][i % 4]}30`,
            }} />
          ))}
        </div>

        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "10px 24px", borderRadius: 24,
          background: "linear-gradient(135deg, #A855F7, #7C3AED)",
          fontSize: 13, fontWeight: 700, color: "#fff",
          fontFamily: "'Noto Sans KR', sans-serif",
          boxShadow: "0 4px 28px rgba(168,85,247,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
          animation: "ctaPulse 2.5s ease-in-out infinite",
        }}>
          무료 분석 시작하기 →
        </div>
      </div>

      {/* Bottom brand */}
      <div style={{
        position: "absolute", bottom: 12, fontSize: 8, color: "rgba(255,255,255,0.18)",
        fontFamily: "'Orbitron', monospace", letterSpacing: 3,
      }}>neurinkairosai.com</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TEMPLATE 2: 인스타 스토리 — 개인 결과 공유 카드
   (대폭 개선: N-Score 게이지바+마커, 정밀도 수정, 랭킹 강화)
   ═══════════════════════════════════════════════════════ */
function Template2() {
  const [show, setShow] = useState(false);
  useEffect(() => { setTimeout(() => setShow(true), 200); }, []);

  return (
    <div style={{
      width: 280, height: 580, background: BRAND.bg, borderRadius: 12, overflow: "hidden",
      position: "relative", display: "flex", flexDirection: "column",
    }}>
      {/* Top glow */}
      <div style={{
        position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)",
        width: 220, height: 220, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(168,85,247,0.15), transparent 70%)",
        filter: "blur(20px)",
      }} />

      <ParticleBg count={10} />

      {/* Header */}
      <div style={{ padding: "14px 18px 0", position: "relative", zIndex: 2 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 9, color: BRAND.accent, fontFamily: "'Orbitron', monospace", letterSpacing: 2, fontWeight: 700 }}>N-KAI</span>
          <span style={{ fontSize: 8, color: BRAND.sub, fontFamily: "'Orbitron', monospace", letterSpacing: 1 }}>FINANCIAL DNA ANALYSIS</span>
        </div>

        {/* Archetype */}
        <div style={{
          textAlign: "center",
          opacity: show ? 1 : 0, transform: show ? "scale(1)" : "scale(0.85)",
          transition: "all 0.6s cubic-bezier(0.16,1,0.3,1) 0.2s",
        }}>
          <div style={{ marginBottom: 6 }}>
            <Orb size={52} color1="#A855F7" color2="#7C3AED" />
          </div>
          <div style={{
            fontSize: 28, fontWeight: 900, color: BRAND.textBright,
            fontFamily: "'Orbitron', monospace", letterSpacing: 3,
            textShadow: "0 0 24px rgba(168,85,247,0.4)",
          }}>ENFJ</div>
          <div style={{
            display: "inline-block", padding: "2px 10px", borderRadius: 4,
            background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.25)",
            fontSize: 9, color: BRAND.accent, fontWeight: 600, marginTop: 4,
            fontFamily: "'Noto Sans KR', sans-serif",
          }}>비전가형 · 이상적 전도사</div>
        </div>
      </div>

      {/* Metrics */}
      <div style={{
        margin: "12px 16px 0", padding: "12px 14px", borderRadius: 10,
        background: "rgba(255,255,255,0.02)", border: `1px solid ${BRAND.borderLight}`,
        opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(12px)",
        transition: "all 0.6s cubic-bezier(0.16,1,0.3,1) 0.5s",
      }}>
        <MetricBar icon="💰" label="경제감각" value={80} color={BRAND.economic} delay={0} />
        <MetricBar icon="⚡" label="표현에너지" value={95} color={BRAND.expression} delay={1} />
        <MetricBar icon="🛡️" label="위기대응력" value={82} color={BRAND.crisis} delay={2} />
      </div>

      {/* N-Score Gauge — 킬링 포인트: 게이지바 + ▼ 마커 */}
      <div style={{
        margin: "10px 16px 0", padding: "12px 14px", borderRadius: 10,
        background: "rgba(255,255,255,0.02)", border: `1px solid ${BRAND.borderLight}`,
        opacity: show ? 1 : 0, transition: "opacity 0.6s 0.7s",
      }}>
        <NScoreGauge score={632} grade="N5" low={581} high={683} />
      </div>

      {/* 정밀도 + 랭킹 (오타 수정: 결밀도→정밀도, 시주→출생시간) */}
      <div style={{
        margin: "8px 16px 0", display: "flex", gap: 8,
        opacity: show ? 1 : 0, transition: "opacity 0.6s 0.9s",
      }}>
        <div style={{
          flex: 1, padding: "8px 10px", borderRadius: 8,
          background: "rgba(168,85,247,0.06)", border: `1px solid rgba(168,85,247,0.12)`,
          textAlign: "center",
        }}>
          <div style={{ fontSize: 8, color: BRAND.sub, marginBottom: 3, fontFamily: "'Noto Sans KR', sans-serif" }}>
            정밀도
          </div>
          <div style={{
            fontSize: 18, fontWeight: 800, color: BRAND.accent,
            fontFamily: "'Orbitron', monospace",
          }}>94%</div>
          <div style={{ fontSize: 7, color: BRAND.sub, marginTop: 2, fontFamily: "'Noto Sans KR', sans-serif" }}>
            출생시간 반영
          </div>
        </div>
        <div style={{
          flex: 1, padding: "8px 10px", borderRadius: 8,
          background: "rgba(0,214,143,0.06)", border: `1px solid rgba(0,214,143,0.12)`,
          textAlign: "center",
        }}>
          <div style={{ fontSize: 8, color: BRAND.sub, marginBottom: 3, fontFamily: "'Noto Sans KR', sans-serif" }}>
            RANKING
          </div>
          <div style={{
            fontSize: 18, fontWeight: 800, color: BRAND.prime,
            fontFamily: "'Orbitron', monospace",
          }}>37%</div>
          <div style={{ fontSize: 7, color: BRAND.sub, marginTop: 2, fontFamily: "'Noto Sans KR', sans-serif" }}>
            전체 분석자 중 상위
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ marginTop: "auto", padding: "0 16px 14px", textAlign: "center" }}>
        <div style={{
          padding: "10px 0", borderRadius: 8,
          background: "linear-gradient(135deg, #A855F7, #7C3AED)",
          fontSize: 12, fontWeight: 700, color: "#fff",
          fontFamily: "'Noto Sans KR', sans-serif",
          boxShadow: "0 4px 20px rgba(168,85,247,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
        }}>나도 금융 DNA 분석받기 →</div>
        <div style={{ fontSize: 7, color: "rgba(255,255,255,0.18)", marginTop: 5, fontFamily: "'Orbitron', monospace", letterSpacing: 1 }}>
          neurinkairosai.com
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TEMPLATE 3: 틱톡/릴스 — "워런 버핏과 같은 유형?" 훅
   (개선: 전환 타이밍 최적화, 글로우 강화)
   ═══════════════════════════════════════════════════════ */
function Template3() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 400),
      setTimeout(() => setStep(2), 1400),
      setTimeout(() => setStep(3), 2600),
      setTimeout(() => setStep(4), 3800),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const resetAnim = () => {
    setStep(0);
    setTimeout(() => setStep(1), 400);
    setTimeout(() => setStep(2), 1400);
    setTimeout(() => setStep(3), 2600);
    setTimeout(() => setStep(4), 3800);
  };

  return (
    <div style={{
      width: 280, height: 500, background: BRAND.bg, borderRadius: 12, overflow: "hidden",
      position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      cursor: "pointer",
    }} onClick={resetAnim}>
      {/* Background pulse */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(circle at 50% 45%, rgba(168,85,247,0.06), transparent 65%)",
        animation: "bgPulse 3s ease-in-out infinite",
      }} />
      <ParticleBg count={12} color={BRAND.gold} />

      {/* Step 1: Hook */}
      <div style={{
        position: "absolute", textAlign: "center", zIndex: 2, padding: "0 24px",
        opacity: step >= 1 && step < 2 ? 1 : 0,
        transform: step >= 1 && step < 2 ? "scale(1)" : "scale(0.85)",
        transition: "all 0.5s cubic-bezier(0.16,1,0.3,1)",
      }}>
        <div style={{
          fontSize: 24, fontWeight: 900, color: BRAND.text, lineHeight: 1.5,
          fontFamily: "'Noto Sans KR', sans-serif",
        }}>
          나는 정말<br />
          <span style={{
            color: BRAND.gold, fontSize: 30,
            textShadow: "0 0 20px rgba(245,158,11,0.3)",
          }}>워런 버핏</span>과<br />
          같은 유형일까?
        </div>
      </div>

      {/* Step 2: Analyzing */}
      <div style={{
        position: "absolute", textAlign: "center", zIndex: 2,
        opacity: step >= 2 && step < 3 ? 1 : 0,
        transform: step >= 2 && step < 3 ? "scale(1)" : "scale(0.9)",
        transition: "all 0.5s cubic-bezier(0.16,1,0.3,1)",
      }}>
        <div style={{ marginBottom: 14 }}>
          <Orb size={72} color1="#A855F7" color2="#2D8CFF" />
        </div>
        <div style={{
          fontSize: 10, color: BRAND.accent, letterSpacing: 4,
          fontFamily: "'Orbitron', monospace", marginBottom: 6, fontWeight: 700,
        }}>ANALYZING</div>
        <div style={{
          fontSize: 12, color: BRAND.sub, lineHeight: 1.6,
          fontFamily: "'Noto Sans KR', sans-serif",
        }}>
          선천적 기질 × 행동 성향<br />AI 융합 분석 중
        </div>
        <div style={{
          width: 140, height: 3, borderRadius: 2, margin: "14px auto 0",
          background: "rgba(255,255,255,0.04)", overflow: "hidden",
        }}>
          <div style={{
            height: "100%", borderRadius: 2,
            background: `linear-gradient(90deg, ${BRAND.accent}, ${BRAND.economic})`,
            animation: "loadBar 1.2s ease-in-out infinite",
          }} />
        </div>
      </div>

      {/* Step 3: Result */}
      <div style={{
        position: "absolute", textAlign: "center", zIndex: 2,
        opacity: step >= 3 && step < 4 ? 1 : 0,
        transform: step >= 3 && step < 4 ? "scale(1)" : "scale(0.7)",
        transition: "all 0.6s cubic-bezier(0.16,1,0.3,1)",
      }}>
        <div style={{
          fontSize: 42, fontWeight: 900, fontFamily: "'Orbitron', monospace",
          background: "linear-gradient(135deg, #F59E0B, #A855F7)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          marginBottom: 6, letterSpacing: 3,
        }}>ISTJ</div>
        <div style={{
          fontSize: 9, padding: "3px 14px", borderRadius: 4,
          background: "rgba(45,140,255,0.12)", color: BRAND.economic,
          display: "inline-block", marginBottom: 8, fontWeight: 600, letterSpacing: 1,
        }}>분석가형</div>
        <div style={{
          fontSize: 20, fontWeight: 800, color: BRAND.textBright,
          fontFamily: "'Noto Sans KR', sans-serif",
        }}>"냉철한 전략가"</div>
        <div style={{
          fontSize: 11, color: BRAND.gold, marginTop: 8, fontWeight: 600,
          fontFamily: "'Noto Sans KR', sans-serif",
        }}>⭐ 워런 버핏 · 벤저민 그레이엄</div>
      </div>

      {/* Step 4: CTA */}
      <div style={{
        position: "absolute", textAlign: "center", zIndex: 2, padding: "0 20px",
        opacity: step >= 4 ? 1 : 0,
        transform: step >= 4 ? "translateY(0)" : "translateY(24px)",
        transition: "all 0.6s cubic-bezier(0.16,1,0.3,1)",
      }}>
        <div style={{
          fontSize: 21, fontWeight: 900, color: BRAND.text, marginBottom: 4,
          fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.45,
        }}>
          당신의<br />
          <span style={{
            background: "linear-gradient(135deg, #A855F7, #00D68F)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>금융 DNA</span>는<br />
          누구와 같을까?
        </div>
        <div style={{
          marginTop: 18, padding: "12px 28px", borderRadius: 24,
          background: "linear-gradient(135deg, #A855F7, #7C3AED)",
          fontSize: 14, fontWeight: 700, color: "#fff",
          fontFamily: "'Noto Sans KR', sans-serif",
          boxShadow: "0 4px 30px rgba(168,85,247,0.45), inset 0 1px 0 rgba(255,255,255,0.12)",
          animation: "ctaPulse 2s ease-in-out infinite",
        }}>지금 무료 분석 →</div>
        <div style={{ fontSize: 8, color: BRAND.sub, marginTop: 10, fontFamily: "'Orbitron', monospace", letterSpacing: 2 }}>
          neurinkairosai.com
        </div>
      </div>

      {/* Replay hint */}
      <div style={{
        position: "absolute", bottom: 10, fontSize: 8, color: "rgba(255,255,255,0.12)",
        fontFamily: "'Noto Sans KR', sans-serif",
      }}>탭하여 다시 보기</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TEMPLATE 4: 캐러셀 — 16유형 미니 카드 그리드
   (개선: 그룹 컬러 매핑 정교화, 호버 효과)
   ═══════════════════════════════════════════════════════ */
function Template4() {
  const [hovered, setHovered] = useState(null);

  const types = [
    { code: "ISTJ", name: "냉철한 전략가", group: "분석가", color: BRAND.economic },
    { code: "ISFJ", name: "꾸준한 수호자", group: "실용주의", color: BRAND.crisis },
    { code: "INFJ", name: "통찰의 설계자", group: "비전가", color: BRAND.accent },
    { code: "INTJ", name: "원칙의 건축가", group: "항해사", color: BRAND.gold },
    { code: "ISTP", name: "정밀한 관찰자", group: "분석가", color: BRAND.economic },
    { code: "ISFP", name: "감성 큐레이터", group: "실용주의", color: BRAND.crisis },
    { code: "INFP", name: "이상적 탐험가", group: "비전가", color: BRAND.accent },
    { code: "INTP", name: "논리의 해체자", group: "항해사", color: BRAND.gold },
    { code: "ESTP", name: "본능의 트레이더", group: "분석가", color: BRAND.economic },
    { code: "ESFP", name: "기회의 서퍼", group: "실용주의", color: BRAND.crisis },
    { code: "ENFP", name: "영감의 연금술사", group: "비전가", color: BRAND.accent },
    { code: "ENTP", name: "파괴적 개척자", group: "항해사", color: BRAND.gold },
    { code: "ESTJ", name: "체계의 사령관", group: "분석가", color: BRAND.economic },
    { code: "ESFJ", name: "신뢰의 매니저", group: "실용주의", color: BRAND.crisis },
    { code: "ENFJ", name: "이상적 전도사", group: "비전가", color: BRAND.accent },
    { code: "ENTJ", name: "제국의 총사령관", group: "항해사", color: BRAND.gold },
  ];

  return (
    <div style={{
      width: 380, height: 380, background: BRAND.bg, borderRadius: 8, overflow: "hidden",
      position: "relative", padding: 16,
    }}>
      <div style={{
        position: "absolute", inset: 0, opacity: 0.025,
        backgroundImage: `radial-gradient(circle at 2px 2px, rgba(168,85,247,0.5) 1px, transparent 0)`,
        backgroundSize: "20px 20px",
      }} />

      <div style={{ textAlign: "center", marginBottom: 10, position: "relative", zIndex: 2 }}>
        <div style={{ fontSize: 8, color: BRAND.accent, fontFamily: "'Orbitron', monospace", letterSpacing: 4, marginBottom: 4, fontWeight: 700 }}>
          N-KAI ARCHETYPES
        </div>
        <div style={{ fontSize: 15, fontWeight: 800, color: BRAND.textBright, fontFamily: "'Noto Sans KR', sans-serif" }}>
          16가지 금융 DNA 유형
        </div>
        {/* 그룹 범례 */}
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 6 }}>
          {[
            { name: "분석가", color: BRAND.economic },
            { name: "실용주의", color: BRAND.crisis },
            { name: "비전가", color: BRAND.accent },
            { name: "항해사", color: BRAND.gold },
          ].map(g => (
            <div key={g.name} style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: g.color }} />
              <span style={{ fontSize: 7, color: BRAND.sub }}>{g.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 5,
        position: "relative", zIndex: 2,
      }}>
        {types.map((t, i) => (
          <div
            key={t.code}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{
              background: hovered === i ? `${t.color}12` : "rgba(255,255,255,0.02)",
              border: `1px solid ${hovered === i ? `${t.color}40` : `${t.color}18`}`,
              borderRadius: 6, padding: "7px 4px", textAlign: "center",
              animation: `cardReveal 0.35s ease ${i * 0.035}s both`,
              cursor: "default",
              transition: "all 0.2s",
              transform: hovered === i ? "scale(1.04)" : "scale(1)",
            }}
          >
            <div style={{
              width: 5, height: 5, borderRadius: "50%", margin: "0 auto 3px",
              background: t.color, boxShadow: `0 0 6px ${t.color}50`,
            }} />
            <div style={{
              fontSize: 10, fontWeight: 800, color: hovered === i ? BRAND.textBright : BRAND.text,
              fontFamily: "'Orbitron', monospace",
              transition: "color 0.2s",
            }}>{t.code}</div>
            <div style={{
              fontSize: 7.5, color: BRAND.sub, marginTop: 2, lineHeight: 1.2,
              fontFamily: "'Noto Sans KR', sans-serif",
            }}>{t.name}</div>
            <div style={{
              fontSize: 6.5, color: t.color, marginTop: 2, fontWeight: 600,
              fontFamily: "'Noto Sans KR', sans-serif",
            }}>{t.group}</div>
          </div>
        ))}
      </div>

      <div style={{
        textAlign: "center", marginTop: 8, position: "relative", zIndex: 2,
      }}>
        <span style={{
          fontSize: 10, color: BRAND.accent, fontWeight: 600,
          fontFamily: "'Noto Sans KR', sans-serif",
        }}>당신은 어떤 유형? → neurinkairosai.com</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TEMPLATE 5: 인스타 스토리 — 퀴즈형
   (개선: 선택지 호버, 더 매력적인 시나리오)
   ═══════════════════════════════════════════════════════ */
function Template5() {
  const [selected, setSelected] = useState(null);
  const options = [
    { emoji: "📈", text: "바로 투자한다", color: BRAND.economic, type: "항해사형 · Risk Seeker" },
    { emoji: "🏦", text: "일단 저축한다", color: BRAND.crisis, type: "실용주의 · Stable Planner" },
    { emoji: "🎁", text: "나를 위해 쓴다", color: BRAND.expression, type: "비전가형 · Emotional Creator" },
    { emoji: "📊", text: "계획을 세운다", color: BRAND.accent, type: "분석가형 · Rational Investor" },
  ];

  return (
    <div style={{
      width: 280, height: 500, background: BRAND.bg, borderRadius: 12, overflow: "hidden",
      position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "50%",
        background: "linear-gradient(180deg, rgba(168,85,247,0.08), transparent)",
      }} />
      <ParticleBg count={8} />

      <div style={{ position: "relative", zIndex: 2, textAlign: "center", padding: "0 20px", width: "100%" }}>
        <div style={{
          fontSize: 8, color: BRAND.accent, fontFamily: "'Orbitron', monospace",
          letterSpacing: 4, marginBottom: 18, fontWeight: 700,
        }}>N-KAI · FINANCIAL DNA QUIZ</div>

        <div style={{
          fontSize: 21, fontWeight: 900, color: BRAND.textBright, lineHeight: 1.45,
          fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 22,
        }}>
          예상치 못한<br />
          <span style={{
            color: BRAND.economic,
            textShadow: "0 0 16px rgba(45,140,255,0.25)",
          }}>100만원</span>이<br />
          생겼다면?
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
          {options.map((opt, i) => (
            <div
              key={i}
              onClick={() => setSelected(i)}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "11px 14px",
                borderRadius: 10,
                background: selected === i ? `${opt.color}15` : "rgba(255,255,255,0.03)",
                border: `1px solid ${selected === i ? `${opt.color}50` : `${opt.color}15`}`,
                fontSize: 13, color: BRAND.text, fontWeight: 600,
                fontFamily: "'Noto Sans KR', sans-serif",
                animation: `slideUp 0.4s ease ${0.08 * i + 0.2}s both`,
                cursor: "pointer",
                transition: "all 0.25s",
                transform: selected === i ? "scale(1.02)" : "scale(1)",
              }}
            >
              <span style={{ fontSize: 17 }}>{opt.emoji}</span>
              <div style={{ flex: 1 }}>
                <div>{opt.text}</div>
                {selected === i && (
                  <div style={{
                    fontSize: 9, color: opt.color, marginTop: 3, fontWeight: 500,
                    animation: "slideUp 0.3s ease both",
                  }}>→ {opt.type}</div>
                )}
              </div>
              {selected === i && (
                <div style={{
                  width: 18, height: 18, borderRadius: "50%",
                  background: opt.color, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, color: "#fff", fontWeight: 800,
                  animation: "dotPop 0.3s ease both",
                }}>✓</div>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 18, fontSize: 10, color: BRAND.sub, fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.5 }}>
          당신의 선택이 금융 DNA를 말해줍니다
        </div>
        <div style={{
          marginTop: 10, padding: "10px 22px", borderRadius: 22,
          background: "linear-gradient(135deg, #A855F7, #7C3AED)",
          fontSize: 12, fontWeight: 700, color: "#fff", display: "inline-block",
          fontFamily: "'Noto Sans KR', sans-serif",
          boxShadow: "0 4px 20px rgba(168,85,247,0.35), inset 0 1px 0 rgba(255,255,255,0.1)",
        }}>내 금융 DNA 확인하기 →</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TEMPLATE 6 (신규): N-Score 공유 전용 카드
   — SNS 공유 시 자동 생성되는 미니 카드 콘셉트
   ═══════════════════════════════════════════════════════ */
function Template6() {
  const [show, setShow] = useState(false);
  useEffect(() => { setTimeout(() => setShow(true), 200); }, []);

  return (
    <div style={{
      width: 380, height: 200, background: BRAND.bg, borderRadius: 12, overflow: "hidden",
      position: "relative", display: "flex",
      border: `1px solid ${BRAND.border}`,
    }}>
      {/* Left gradient */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: "40%",
        background: "linear-gradient(135deg, rgba(168,85,247,0.08), rgba(45,140,255,0.04))",
      }} />
      <ParticleBg count={8} />

      {/* Left: Score + Type */}
      <div style={{
        flex: "0 0 45%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
        position: "relative", zIndex: 2, padding: "16px 0",
        opacity: show ? 1 : 0, transform: show ? "translateX(0)" : "translateX(-16px)",
        transition: "all 0.7s cubic-bezier(0.16,1,0.3,1)",
      }}>
        <NScoreCircle score={86} grade="N5" size={72} />
        <div style={{
          fontSize: 18, fontWeight: 900, color: BRAND.textBright,
          fontFamily: "'Orbitron', monospace", marginTop: 6, letterSpacing: 2,
        }}>ENFJ</div>
        <div style={{
          fontSize: 8, color: BRAND.accent, fontWeight: 600, marginTop: 2,
          fontFamily: "'Noto Sans KR', sans-serif",
        }}>비전가형 · 이상적 전도사</div>
      </div>

      {/* Divider */}
      <div style={{
        width: 1, alignSelf: "center", height: "70%",
        background: "linear-gradient(180deg, transparent, rgba(168,85,247,0.2), transparent)",
      }} />

      {/* Right: Metrics */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "12px 18px", position: "relative", zIndex: 2,
        opacity: show ? 1 : 0, transform: show ? "translateX(0)" : "translateX(16px)",
        transition: "all 0.7s cubic-bezier(0.16,1,0.3,1) 0.15s",
      }}>
        <MetricBar icon="💰" label="경제감각" value={80} color={BRAND.economic} delay={0} />
        <MetricBar icon="⚡" label="표현에너지" value={95} color={BRAND.expression} delay={1} />
        <MetricBar icon="🛡️" label="위기대응력" value={82} color={BRAND.crisis} delay={2} />

        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginTop: 8, padding: "6px 8px", borderRadius: 6,
          background: "rgba(0,214,143,0.06)",
        }}>
          <span style={{ fontSize: 8, color: BRAND.sub, fontFamily: "'Noto Sans KR', sans-serif" }}>상위</span>
          <span style={{ fontSize: 16, fontWeight: 800, color: BRAND.prime, fontFamily: "'Orbitron', monospace" }}>37%</span>
        </div>

        <div style={{
          textAlign: "center", marginTop: 6,
          fontSize: 8, color: BRAND.accent, fontWeight: 600,
          fontFamily: "'Noto Sans KR', sans-serif",
        }}>나도 분석받기 → neurinkairosai.com</div>
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
    { name: "피드: 티저", desc: "인스타 정사각 피드 · 프로필 첫 고정 게시물", component: <Template1 /> },
    { name: "스토리: 결과", desc: "인스타/틱톡 스토리 · 분석 후 유저 공유용", component: <Template2 /> },
    { name: "릴스: 훅", desc: "틱톡/릴스 15초 시퀀스 · 탭하여 리플레이", component: <Template3 /> },
    { name: "피드: 16유형", desc: "캐러셀/그리드 · 호버로 하이라이트", component: <Template4 /> },
    { name: "스토리: 퀴즈", desc: "참여 유도형 · 선택 시 유형 힌트 표시", component: <Template5 /> },
    { name: "공유: N-Score", desc: "카카오톡/SNS 공유 시 자동 생성 미니카드", component: <Template6 /> },
  ];

  return (
    <div style={{ background: "#040410", minHeight: "100vh", padding: "28px 0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700;800;900&family=Orbitron:wght@600;700;800;900&display=swap');

        @keyframes orbFloat {
          0% { transform: translateY(0) rotate(0deg); }
          100% { transform: translateY(-12px) rotate(4deg); }
        }
        @keyframes orbPulse {
          0% { opacity: 0.3; }
          100% { opacity: 0.7; }
        }
        @keyframes dotPop {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes bgPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes loadBar {
          0% { width: 0; }
          50% { width: 80%; }
          100% { width: 100%; }
        }
        @keyframes ctaPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 4px 24px rgba(168,85,247,0.3); }
          50% { transform: scale(1.02); box-shadow: 0 6px 32px rgba(168,85,247,0.5); }
        }
        @keyframes cardReveal {
          from { transform: scale(0.85) translateY(6px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(12px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes particleDrift {
          0% { transform: translateY(0) translateX(0); }
          100% { transform: translateY(-8px) translateX(4px); }
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(168,85,247,0.2); border-radius: 4px; }
      `}</style>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{
          fontSize: 9, letterSpacing: 5, color: BRAND.accent,
          fontFamily: "'Orbitron', monospace", marginBottom: 6, fontWeight: 700,
        }}>N-KAI · SOCIAL CONTENT · v2</div>
        <div style={{
          fontSize: 20, fontWeight: 900, color: BRAND.textBright,
          fontFamily: "'Noto Sans KR', sans-serif",
        }}>소셜 미디어 콘텐츠</div>
        <div style={{
          fontSize: 11, color: BRAND.sub, marginTop: 4,
          fontFamily: "'Noto Sans KR', sans-serif",
        }}>인스타그램 · 틱톡 · 릴스 · 카카오톡</div>
      </div>

      {/* Tab */}
      <div style={{
        display: "flex", gap: 5, justifyContent: "center", flexWrap: "wrap",
        marginBottom: 20, padding: "0 12px",
      }}>
        {templates.map((t, i) => (
          <button key={i} onClick={() => setActive(i)} style={{
            padding: "6px 12px", borderRadius: 20, border: "none",
            background: active === i ? "linear-gradient(135deg, #A855F7, #7C3AED)" : "rgba(255,255,255,0.04)",
            color: active === i ? "#fff" : BRAND.sub,
            fontSize: 10, fontWeight: 600, cursor: "pointer",
            fontFamily: "'Noto Sans KR', sans-serif",
            transition: "all 0.25s",
            boxShadow: active === i ? "0 2px 12px rgba(168,85,247,0.3)" : "none",
          }}>{t.name}</button>
        ))}
      </div>

      {/* Preview */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <div style={{
          padding: 20, borderRadius: 16,
          background: "rgba(255,255,255,0.015)",
          border: `1px solid ${BRAND.border}`,
          boxShadow: "0 12px 48px rgba(0,0,0,0.4)",
        }}>
          {templates[active].component}
        </div>
        <div style={{
          fontSize: 10, color: BRAND.sub, textAlign: "center",
          fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.6,
        }}>
          {templates[active].desc}
        </div>
      </div>

      {/* Usage guide */}
      <div style={{
        maxWidth: 440, margin: "24px auto 0", padding: "16px 20px",
        borderRadius: 12, background: "rgba(168,85,247,0.03)",
        border: `1px solid ${BRAND.border}`,
      }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: BRAND.accent, marginBottom: 10,
          fontFamily: "'Noto Sans KR', sans-serif", display: "flex", alignItems: "center", gap: 6,
        }}>📱 콘텐츠 활용 가이드</div>
        <div style={{
          fontSize: 10, color: BRAND.sub, lineHeight: 2,
          fontFamily: "'Noto Sans KR', sans-serif",
        }}>
          <strong style={{ color: BRAND.text }}>1. 피드 티저</strong> → 프로필 첫 고정. "당신의 금융 DNA는?" 호기심 유발<br/>
          <strong style={{ color: BRAND.text }}>2. 결과 공유</strong> → 분석 완료 후 유저가 캡처·공유. N-Score 게이지바가 핵심<br/>
          <strong style={{ color: BRAND.text }}>3. 릴스/틱톡</strong> → 훅→분석→결과→CTA 4단계 15초. 탭하면 리플레이<br/>
          <strong style={{ color: BRAND.text }}>4. 16유형 그리드</strong> → 캐러셀 2장째. "나는 어디?" 탐색 욕구 자극<br/>
          <strong style={{ color: BRAND.text }}>5. 퀴즈 스토리</strong> → 선택지 클릭 시 유형 힌트. 인스타 투표 스티커와 연동<br/>
          <strong style={{ color: BRAND.text }}>6. N-Score 카드</strong> → <span style={{ color: BRAND.accent }}>신규</span> 카카오톡/SNS 공유 시 자동 생성 미니카드
        </div>

        <div style={{
          marginTop: 12, padding: "10px 12px", borderRadius: 8,
          background: "rgba(0,214,143,0.04)", border: "1px solid rgba(0,214,143,0.1)",
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: BRAND.crisis, marginBottom: 4,
            fontFamily: "'Noto Sans KR', sans-serif",
          }}>✅ v2 개선사항</div>
          <div style={{
            fontSize: 9, color: BRAND.sub, lineHeight: 1.9,
            fontFamily: "'Noto Sans KR', sans-serif",
          }}>
            · 결밀도→<strong style={{ color: BRAND.text }}>정밀도</strong> 오타 수정<br/>
            · 시주(확장)→<strong style={{ color: BRAND.text }}>출생시간 반영</strong> 용어 교체<br/>
            · 게이지바 <strong style={{ color: BRAND.text }}>▼ 위치 마커</strong> 추가<br/>
            · N-Score 카운트업 애니메이션 + 파티클 배경<br/>
            · 퀴즈 선택 시 유형 힌트 인터랙션 추가<br/>
            · 릴스 탭-리플레이 기능 추가<br/>
            · <strong style={{ color: BRAND.accent }}>N-Score 공유 미니카드</strong> 신규 템플릿
          </div>
        </div>
      </div>
    </div>
  );
}
