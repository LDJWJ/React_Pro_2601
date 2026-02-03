// 로컬 개발용 API 서버
// 실행: node server.js

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // 이미지 데이터를 위해 크기 제한 증가

// Netlify Function과 동일한 엔드포인트
app.post('/.netlify/functions/generate-subtitle', async (req, res) => {
  try {
    const { cutTitle, cutDescription, memo, templateTitle, templateCategory, imageBase64 } = req.body;

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'OPENAI_API_KEY not configured in .env file' });
    }

    // 템플릿 컨텍스트 생성
    const templateContext = templateTitle || templateCategory
      ? `\n템플릿: ${templateTitle || ''}${templateCategory ? ` (${templateCategory})` : ''}`
      : '';

    // 메시지 구성
    let messages;

    if (imageBase64) {
      console.log('🖼️  이미지 분석 모드 (GPT-4 Vision)');
      messages = [
        {
          role: 'system',
          content: `당신은 짧은 영상 자막을 작성하는 전문가입니다.
사용자가 제공하는 영상 프레임 이미지와 콘텐츠 기획 정보를 분석하여 짧고 매력적인 자막 3개를 추천해주세요.
이미지에서 보이는 장면, 제품, 분위기, 행동 등을 파악하여 자막에 반영하세요.
각 자막은 20자 이내로, 시청자의 관심을 끌 수 있어야 합니다.
JSON 배열 형식으로만 응답하세요. 예: ["자막1", "자막2", "자막3"]`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
                detail: 'low',
              },
            },
            {
              type: 'text',
              text: `${templateContext}
컷 제목: ${cutTitle || '영상 컷'}
컷 설명: ${cutDescription || ''}
사용자 메모: ${memo || '없음'}

위 이미지와 콘텐츠 기획 정보를 분석하여 이 장면에 어울리는 짧고 매력적인 자막 3개를 추천해주세요.`,
            },
          ],
        },
      ];
    } else {
      console.log('📝 텍스트 분석 모드 (GPT-4o-mini)');
      messages = [
        {
          role: 'system',
          content: `당신은 짧은 영상 자막을 작성하는 전문가입니다.
사용자가 제공하는 콘텐츠 기획 정보를 바탕으로 짧고 매력적인 자막 3개를 추천해주세요.
각 자막은 20자 이내로, 시청자의 관심을 끌 수 있어야 합니다.
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
      ];
    }

    // OpenAI API 호출
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: imageBase64 ? 'gpt-4o' : 'gpt-4o-mini',
        messages,
        temperature: 0.8,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API Error:', errorData);
      return res.status(response.status).json({ error: 'OpenAI API Error', details: errorData });
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    console.log('✅ AI 응답:', content);

    let subtitles;
    try {
      subtitles = JSON.parse(content);
    } catch {
      subtitles = [
        '지금 바로 확인해보세요!',
        '이 순간을 놓치지 마세요!',
        '함께 즐겨보세요!',
      ];
    }

    res.json({
      subtitles,
      usedVision: !!imageBase64,
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 로컬 API 서버 실행 중: http://localhost:${PORT}`);
  console.log(`📌 Vite 프록시가 이 서버로 API 요청을 전달합니다.\n`);
});
