const express = require('express');
const router = express.Router();
const { getStockInfo } = require('../services/naverStock');

/**
 * GET /api/stock/:symbol
 * 주식 종목코드 또는 종목명으로 주가 정보 조회
 */
router.get('/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: '종목코드 또는 종목명을 입력해주세요.'
      });
    }

    const stockInfo = await getStockInfo(symbol);
    
    if (!stockInfo.success) {
      return res.status(404).json(stockInfo);
    }

    res.json(stockInfo);
  } catch (error) {
    console.error('주가 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '주가 정보를 조회하는 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;
