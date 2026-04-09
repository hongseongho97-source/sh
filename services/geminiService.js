const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Gemini API를 사용하여 채팅을 처리하는 함수
 * @param {Function} executeTool (toolName, args) => Promise<object>
 */
async function chatWithGemini(chatHistory, executeTool) {
  console.log('--- Gemini Chat Start ---');
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY가 설정되지 않았습니다.');
    }

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      tools: [{
        functionDeclarations: [
          {
            name: 'getStockPrice',
            description: '한국 주식의 현재 주가 정보만 조회합니다. 당일 등락 등. 작년 대비 비교가 아닐 때 사용합니다.',
            parameters: {
              type: 'object',
              properties: {
                symbol: {
                  type: 'string',
                  description: '주식 종목명 또는 종목코드 (예: "삼성전자", "005930")',
                },
              },
              required: ['symbol'],
            },
          },
          {
            name: 'getStockYearOverYearComparison',
            description:
              '한국 주식의 현재 주가와 "작년 같은 날짜(서울 기준)"에 가장 가까운 영업일 종가를 비교합니다. YoY, 전년 동월대비, 1년 전과 비교 등의 질문에 사용합니다.',
            parameters: {
              type: 'object',
              properties: {
                symbol: {
                  type: 'string',
                  description: '주식 종목명 또는 종목코드 (예: "삼성전자", "005930")',
                },
              },
              required: ['symbol'],
            },
          },
        ],
      }],
    });

    const formattedHistory = chatHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const lastMessage = formattedHistory[formattedHistory.length - 1];
    console.log('[User Message]:', lastMessage.parts[0].text);

    const chat = model.startChat({
      history: formattedHistory.slice(0, -1),
    });

    const result = await chat.sendMessage(lastMessage.parts[0].text);
    const response = result.response;
    const functionCalls = response.functionCalls();
    
    if (functionCalls && functionCalls.length > 0) {
      const functionCall = functionCalls[0];
      console.log('[Gemini Request Function]:', functionCall.name, functionCall.args);

      const toolName = functionCall.name;
      const allowed = ['getStockPrice', 'getStockYearOverYearComparison'];
      if (allowed.includes(toolName)) {
        const payload = await executeTool(toolName, functionCall.args || {});
        console.log('[Function Result]:', payload);

        const followUpResult = await chat.sendMessage([
          {
            functionResponse: {
              name: toolName,
              response: { content: payload },
            },
          },
        ]);

        const followUpResponse = followUpResult.response;
        console.log('[Gemini Final Response]:', followUpResponse.text());
        return {
          success: true,
          message: followUpResponse.text(),
          functionCalled: true,
        };
      }
    }

    console.log('[Gemini Response]:', response.text());
    return {
      success: true,
      message: response.text(),
      functionCalled: false
    };

  } catch (error) {
    console.error('[Gemini API Error]:', error);
    return {
      success: false,
      error: error.message || 'Gemini API 호출 중 오류가 발생했습니다.'
    };
  } finally {
    console.log('--- Gemini Chat End ---');
  }
}

module.exports = { chatWithGemini };
