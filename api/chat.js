// Vercel Serverless Function — POST /api/chat
// Claude API 프록시: 오행 프로필 컨텍스트 + 대화 이력 유지

const Anthropic = require('@anthropic-ai/sdk');

// 세션별 대화 이력 (서버리스 특성상 cold start 시 초기화됨 — 필요시 Redis/Supabase로 이관)
const sessionHistory = {};

const SYSTEM_PROMPT = `당신은 N-KAI의 오행 뷰티 AI 상담사입니다.
사용자의 오행 프로필(木火土金水 비율)을 기반으로 피부/헤어/식단/운동/제품을 추천합니다.

핵심 원칙:
- 오행 에너지 비율에 따라 맞춤형 답변 제공
- 木(목): 봄 에너지, 성장, 유연성 — 수분 케어, 녹색 채소, 스트레칭
- 火(화): 여름 에너지, 열정, 활력 — 진정 케어, 붉은 음식, 유산소
- 土(토): 환절기 에너지, 안정, 중심 — 보습 강화, 노란 음식, 코어 운동
- 金(금): 가을 에너지, 정밀, 단단함 — 화이트닝, 흰 음식, 근력 운동
- 水(수): 겨울 에너지, 깊이, 재생 — 재생 케어, 검은 음식, 명상/요가

답변은 한국어로, 친근하고 전문적으로 2-4문장 이내로 간결하게.
의료/법률 자문이 아님을 필요시 명시.`;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, ohang_profile, session_id } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: '메시지를 입력해주세요.' });
  }

  const sid = session_id || 'default';

  // 세션 이력 초기화
  if (!sessionHistory[sid]) {
    sessionHistory[sid] = [];
  }

  // 오행 프로필 컨텍스트 삽입
  let contextualMessage = message;
  if (ohang_profile && Object.keys(ohang_profile).length > 0) {
    const { core, wood, fire, earth, metal, water, name } = ohang_profile;
    const profileContext = `[사용자 오행 프로필: ${name || '사용자'} / 코어에너지:${core || '未'} / 木${wood || 0}% 火${fire || 0}% 土${earth || 0}% 金${metal || 0}% 水${water || 0}%]`;
    contextualMessage = profileContext + '\n질문: ' + message;
  }

  // 이력에 사용자 메시지 추가
  sessionHistory[sid].push({ role: 'user', content: contextualMessage });

  // 이력 최대 20턴 유지 (토큰 절약)
  if (sessionHistory[sid].length > 40) {
    sessionHistory[sid] = sessionHistory[sid].slice(-40);
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: sessionHistory[sid],
    });

    const reply = response.content[0].text;
    const tokens_used = response.usage.input_tokens + response.usage.output_tokens;

    // AI 응답 이력에 추가
    sessionHistory[sid].push({ role: 'assistant', content: reply });

    return res.status(200).json({ reply, tokens_used, session_id: sid });
  } catch (err) {
    console.error('[api/chat] Claude API error:', err.message);
    return res.status(500).json({ error: 'AI 상담 서비스에 일시적 오류가 발생했습니다.' });
  }
};
