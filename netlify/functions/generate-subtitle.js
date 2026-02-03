// Netlify Function: AI 자막 추천 생성
// ChatGPT API를 서버사이드에서 호출하여 API 키 보안 유지

export async function handler(event) {
  // CORS 헤더 설정
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // OPTIONS 요청 처리 (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // POST 요청만 허용
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { cutTitle, cutDescription, memo, templateTitle, templateCategory } = JSON.parse(event.body);

    // 환경 변수에서 API 키 가져오기
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'API key not configured' }),
      };
    }

    // 템플릿 컨텍스트 생성
    const templateContext = templateTitle || templateCategory
      ? `\n템플릿: ${templateTitle || ''}${templateCategory ? ` (${templateCategory})` : ''}`
      : '';

    // ChatGPT API 호출
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `당신은 짧은 영상 자막을 작성하는 전문가입니다.
사용자가 제공하는 콘텐츠 기획 정보를 바탕으로 짧고 매력적인 자막 3개를 추천해주세요.
각 자막은 20자 이내로, 시청자의 관심을 끌 수 있어야 합니다.
템플릿의 전체 콘텐츠 흐름과 해당 컷의 역할을 고려하여 자막을 작성하세요.
JSON 배열 형식으로만 응답하세요. 예: ["자막1", "자막2", "자막3"]`,
          },
          {
            role: 'user',
            content: `${templateContext}
컷 제목: ${cutTitle || '영상 컷'}
컷 설명: ${cutDescription || ''}
사용자 메모: ${memo || '없음'}

위 콘텐츠 기획 정보를 바탕으로 짧고 매력적인 자막 3개를 추천해주세요.`,
          },
        ],
        temperature: 0.8,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API Error:', errorData);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: 'Failed to generate subtitles', details: errorData }),
      };
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    // JSON 파싱 시도
    let subtitles;
    try {
      subtitles = JSON.parse(content);
    } catch {
      // JSON 파싱 실패 시 기본 자막 반환
      subtitles = [
        '지금 바로 확인해보세요!',
        '이 순간을 놓치지 마세요!',
        '함께 즐겨보세요!',
      ];
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ subtitles }),
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', message: error.message }),
    };
  }
}
