// Vercel Serverless Function — POST /api/skin-analyze
// Claude Vision API로 피부/두피/헤어 이미지 분석

const Anthropic = require('@anthropic-ai/sdk');

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

const ANALYSIS_PROMPTS = {
  skin: `당신은 N-KAI 오행 피부 분석 전문가입니다.
이미지에서 피부 상태를 분석하고, 사용자의 오행 프로필을 참고하여 다음 JSON 형식으로만 답하세요:
{
  "skin_type": "지성|건성|복합성|중성|민감성",
  "condition": "분석 요약 (2문장)",
  "moisture_level": 0~100 숫자,
  "oil_level": 0~100 숫자,
  "elasticity": 0~100 숫자,
  "issues": ["트러블", "모공", "홍조" 등 최대 3개],
  "recommendations": ["케어 방법 1", "케어 방법 2", "케어 방법 3"],
  "products": [
    {"name": "제품명", "type": "세럼|크림|클렌저 등", "ingredient": "핵심 성분"}
  ]
}
JSON 외 텍스트는 절대 출력하지 마세요.`,

  scalp: `당신은 N-KAI 오행 두피 분석 전문가입니다.
이미지에서 두피 상태를 분석하고, 사용자의 오행 프로필을 참고하여 다음 JSON 형식으로만 답하세요:
{
  "skin_type": "지성두피|건성두피|복합성두피|민감두피",
  "condition": "분석 요약 (2문장)",
  "moisture_level": 0~100 숫자,
  "oil_level": 0~100 숫자,
  "elasticity": 0~100 숫자,
  "issues": ["비듬", "탈모 우려", "두피 발적" 등 최대 3개],
  "recommendations": ["두피 케어 방법 1", "방법 2", "방법 3"],
  "products": [
    {"name": "제품명", "type": "샴푸|두피에센스|트리트먼트 등", "ingredient": "핵심 성분"}
  ]
}
JSON 외 텍스트는 절대 출력하지 마세요.`,

  hair: `당신은 N-KAI 오행 헤어 분석 전문가입니다.
이미지에서 모발 상태를 분석하고, 사용자의 오행 프로필을 참고하여 다음 JSON 형식으로만 답하세요:
{
  "skin_type": "손상모|건강모|건성모|지성모",
  "condition": "분석 요약 (2문장)",
  "moisture_level": 0~100 숫자,
  "oil_level": 0~100 숫자,
  "elasticity": 0~100 숫자,
  "issues": ["손상", "푸석거림", "갈라짐" 등 최대 3개],
  "recommendations": ["모발 케어 방법 1", "방법 2", "방법 3"],
  "products": [
    {"name": "제품명", "type": "트리트먼트|헤어오일|에센스 등", "ingredient": "핵심 성분"}
  ]
}
JSON 외 텍스트는 절대 출력하지 마세요.`,
};

function buildOhangContext(ohang_profile) {
  if (!ohang_profile || Object.keys(ohang_profile).length === 0) return '';
  const { core, wood, fire, earth, metal, water, name } = ohang_profile;
  return `\n[사용자 오행 프로필: ${name || '사용자'} / 코어:${core || '未'} / 木${wood || 0}% 火${fire || 0}% 土${earth || 0}% 金${metal || 0}% 水${water || 0}%]\n오행 특성을 반드시 추천에 반영하세요.`;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image_base64, ohang_profile, analysis_type = 'skin' } = req.body || {};

  if (!image_base64) {
    return res.status(400).json({ error: '이미지 데이터(image_base64)가 필요합니다.' });
  }

  if (!['skin', 'scalp', 'hair'].includes(analysis_type)) {
    return res.status(400).json({ error: 'analysis_type은 skin|scalp|hair 중 하나여야 합니다.' });
  }

  // base64 크기 검증 (5MB 제한)
  const byteSize = Buffer.byteLength(image_base64, 'base64');
  if (byteSize > MAX_IMAGE_BYTES) {
    return res.status(413).json({ error: '이미지 크기는 5MB 이하여야 합니다.' });
  }

  // MIME 타입 추출 (data:image/jpeg;base64,... 형식 지원)
  let mediaType = 'image/jpeg';
  let pureBase64 = image_base64;
  const dataUriMatch = image_base64.match(/^data:(image\/[a-z]+);base64,(.+)$/);
  if (dataUriMatch) {
    mediaType = dataUriMatch[1];
    pureBase64 = dataUriMatch[2];
  }

  const systemPrompt = ANALYSIS_PROMPTS[analysis_type] + buildOhangContext(ohang_profile);

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: pureBase64 },
            },
            {
              type: 'text',
              text: '이 이미지를 분석해주세요.',
            },
          ],
        },
      ],
    });

    const raw = response.content[0].text.trim();
    let result;
    try {
      // JSON 블록 추출 (마크다운 코드펜스 대응)
      const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]+?)\s*```/) || [null, raw];
      result = JSON.parse(jsonMatch[1]);
    } catch {
      return res.status(502).json({ error: 'AI 응답 파싱 실패', raw });
    }

    return res.status(200).json({
      analysis_type,
      ...result,
      tokens_used: response.usage.input_tokens + response.usage.output_tokens,
    });
  } catch (err) {
    console.error('[api/skin-analyze] error:', err.message);
    return res.status(500).json({ error: 'AI 분석 서비스에 일시적 오류가 발생했습니다.' });
  }
};
