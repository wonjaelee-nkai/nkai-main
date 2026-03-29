-- N-KAI Supabase PostgreSQL 스키마
-- Supabase SQL Editor에서 실행

-- ─────────────────────────────────────────
-- 사용자 테이블
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  birth_date  DATE NOT NULL,
  birth_hour  INT CHECK (birth_hour >= 0 AND birth_hour <= 23),
  birth_min   INT CHECK (birth_min  >= 0 AND birth_min  <= 59),
  gender      VARCHAR(1) CHECK (gender IN ('M', 'F')),
  core_ohang  VARCHAR(2), -- 木火土金水
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 오행 분석 결과
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analyses (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             UUID REFERENCES users(id) ON DELETE CASCADE,
  wood                FLOAT CHECK (wood  >= 0 AND wood  <= 100),
  fire                FLOAT CHECK (fire  >= 0 AND fire  <= 100),
  earth               FLOAT CHECK (earth >= 0 AND earth <= 100),
  metal               FLOAT CHECK (metal >= 0 AND metal <= 100),
  water               FLOAT CHECK (water >= 0 AND water <= 100),
  saju_year           VARCHAR(4),
  saju_month          VARCHAR(4),
  saju_day            VARCHAR(4),
  saju_hour           VARCHAR(4),
  posterior_accuracy  FLOAT DEFAULT 0.5 CHECK (posterior_accuracy >= 0 AND posterior_accuracy <= 1), -- 베이지안 Posterior
  roc_threshold       FLOAT DEFAULT 0.35 CHECK (roc_threshold >= 0 AND roc_threshold <= 1),           -- ROC 임계치
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- AI 상담 세션 이력
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_sessions (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID REFERENCES users(id) ON DELETE SET NULL,
  session_key      VARCHAR(64) UNIQUE, -- 프론트 session_id와 매핑
  messages         JSONB DEFAULT '[]',
  tokens_used      INT DEFAULT 0 CHECK (tokens_used >= 0),
  duration_seconds INT DEFAULT 0 CHECK (duration_seconds >= 0),
  amount_charged   INT DEFAULT 0 CHECK (amount_charged >= 0), -- 원(KRW)
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 파트너 (살롱/에스테틱/피트니스)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS partners (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name                VARCHAR(100) NOT NULL,
  business_type       VARCHAR(50) CHECK (business_type IN ('salon', 'esthetic', 'fitness', 'clinic', 'other')),
  api_key             VARCHAR(64) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  license_tier        VARCHAR(20) DEFAULT 'basic' CHECK (license_tier IN ('basic', 'pro', 'enterprise')),
  revenue_share_rate  FLOAT DEFAULT 0.3 CHECK (revenue_share_rate >= 0 AND revenue_share_rate <= 1),
  contact_email       VARCHAR(200),
  is_active           BOOLEAN DEFAULT true,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 상품 (PB 포함)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id  UUID REFERENCES partners(id) ON DELETE CASCADE,
  name        VARCHAR(200) NOT NULL,
  category    VARCHAR(50) CHECK (category IN ('skincare', 'haircare', 'supplement', 'fitness', 'wellness', 'other')),
  ohang_tag   VARCHAR(2),  -- 오행 타겟 (木火土金水)
  price       INT NOT NULL CHECK (price >= 0),
  stock       INT DEFAULT 0 CHECK (stock >= 0),
  is_pb       BOOLEAN DEFAULT false, -- PB(Private Brand) 여부
  description TEXT,
  image_url   VARCHAR(500),
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- API 호출 로그 (과금·모니터링용)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_logs (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id   UUID REFERENCES partners(id) ON DELETE SET NULL,
  endpoint     VARCHAR(50) NOT NULL,
  method       VARCHAR(10) DEFAULT 'GET',
  status_code  INT,
  response_ms  INT CHECK (response_ms >= 0),
  tokens_used  INT DEFAULT 0,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 인덱스
-- ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_analyses_user_id      ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_key     ON chat_sessions(session_key);
CREATE INDEX IF NOT EXISTS idx_products_partner_id   ON products(partner_id);
CREATE INDEX IF NOT EXISTS idx_products_ohang_tag    ON products(ohang_tag);
CREATE INDEX IF NOT EXISTS idx_api_logs_partner_id   ON api_logs(partner_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_created_at   ON api_logs(created_at DESC);

-- ─────────────────────────────────────────
-- updated_at 자동 갱신 트리거 (chat_sessions)
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────
-- RLS (Row Level Security) — 기본 활성화
-- ─────────────────────────────────────────
ALTER TABLE users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses      ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners      ENABLE ROW LEVEL SECURITY;
ALTER TABLE products      ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_logs      ENABLE ROW LEVEL SECURITY;

-- 서비스 롤(service_role)은 모든 행 접근 허용 (Vercel API에서 사용)
CREATE POLICY "service_role_all" ON users         FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON analyses      FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON chat_sessions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON partners      FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON products      FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON api_logs      FOR ALL USING (auth.role() = 'service_role');
