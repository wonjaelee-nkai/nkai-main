// Supabase 클라이언트 — 공통 모듈
// SUPABASE_URL, SUPABASE_KEY는 Vercel 환경변수에서 주입

const { createClient } = require('@supabase/supabase-js');

let _client = null;

function getSupabase() {
  if (!_client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_KEY;
    if (!url || !key) {
      throw new Error('SUPABASE_URL 또는 SUPABASE_KEY 환경변수가 설정되지 않았습니다.');
    }
    _client = createClient(url, key);
  }
  return _client;
}

module.exports = { getSupabase };
