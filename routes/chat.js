const express = require('express');
const router = express.Router();
const { chatWithGemini } = require('../services/geminiService');
const { getStockInfo, getStockInfoYearOverYear } = require('../services/naverStock');

/**
 * POST /api/chat
 * Gemini API를 사용한 채팅 처리
 */
router.post('/', async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: '메시지를 입력해주세요.'
      });
    }

    // 대화 히스토리 구성
    const chatHistory = [
      ...history,
      {
        role: 'user',
        content: message
      }
    ];

    const executeTool = async (toolName, args) => {
      const symbol = args.symbol;
      if (!symbol || typeof symbol !== 'string') {
        return { success: false, error: '종목명 또는 종목코드가 필요합니다.' };
      }
      if (toolName === 'getStockPrice') return getStockInfo(symbol.trim());
      if (toolName === 'getStockYearOverYearComparison') return getStockInfoYearOverYear(symbol.trim());
      return { success: false, error: '지원하지 않는 도구입니다.' };
    };

    const result = await chatWithGemini(chatHistory, executeTool);

    if (!result.success) {
      return res.status(500).json(result);
    }

    // 응답에 사용자 메시지와 봇 응답 추가
    res.json({
      success: true,
      message: result.message,
      functionCalled: result.functionCalled || false
    });

  } catch (error) {
    console.error('채팅 처리 오류:', error);
    res.status(500).json({
      success: false,
      error: '채팅 처리 중 오류가 발생했습니다.',
      message: error.message
    });
  }
});

module.exports = router;
