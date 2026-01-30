const axios = require('axios');

/**
 * 다음(Daum) 금융 API를 사용하여 주식 정보를 가져오는 함수
 */
async function getStockPrice(symbol) {
  console.log(`[Price] Fetching price for: ${symbol}`);
  try {
    const url = `https://finance.daum.net/api/quotes/A${symbol}?summary=false`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://finance.daum.net/',
        'x-requested-with': 'XMLHttpRequest'
      },
      timeout: 5000
    });

    const data = response.data;
    if (!data) throw new Error('데이터가 비어있습니다.');

    console.log(`[Price] Success: ${data.name} - ${data.tradePrice}`);
    return {
      success: true,
      symbol: symbol,
      name: data.name || symbol,
      currentPrice: data.tradePrice || 0,
      change: data.change === 'RISE' ? '상승' : data.change === 'FALL' ? '하락' : '보합',
      changeValue: data.changePrice || 0,
      changePercent: ((data.changeRate || 0) * 100).toFixed(2) + '%',
      url: `https://finance.daum.net/quotes/A${symbol}`
    };
  } catch (error) {
    console.error(`[Price Error]:`, error.message);
    return { success: false, symbol: symbol, error: '주가 정보를 가져오는 중 오류가 발생했습니다.' };
  }
}

/**
 * 다중 소스를 이용한 종목코드 검색 함수 (Daum + Naver)
 */
async function searchStockCode(stockName) {
  console.log(`[Search] Query: ${stockName}`);
  
  // 1. 다음(Daum) 검색 API 시도 (가장 깔끔함)
  try {
    const daumUrl = `https://finance.daum.net/api/search/quotes?limit=10&query=${encodeURIComponent(stockName)}`;
    const response = await axios.get(daumUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://finance.daum.net/',
        'x-requested-with': 'XMLHttpRequest'
      },
      timeout: 3000
    });

    const items = response.data?.data;
    if (items && items.length > 0) {
      const code = items[0].code.replace('A', '');
      console.log(`[Search] Daum Success: ${code}`);
      return code;
    }
  } catch (e) {
    console.log(`[Search] Daum API Failed, trying Naver...`);
  }

  // 2. 네이버(Naver) 자동완성 API 시도 ( finance.naver.com 도메인 사용 )
  try {
    const naverUrl = `https://finance.naver.com/ac?q=${encodeURIComponent(stockName)}&q_enc=utf-8&st=1&frm=stock&r_format=json&r_enc=utf-8&r_unicode=1&t_koreng=1&ans=2&run=2&rev=4&con_query=1`;
    const response = await axios.get(naverUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://finance.naver.com/'
      },
      timeout: 3000
    });

    const items = response.data?.items?.[0];
    if (items && items.length > 0) {
      const code = items[0][1];
      console.log(`[Search] Naver Success: ${code}`);
      return code;
    }
  } catch (e) {
    console.error(`[Search] Naver API Failed:`, e.message);
  }

  return null;
}

async function getStockInfo(input) {
  if (/^\d{6}$/.test(input)) {
    return await getStockPrice(input);
  }
  
  const code = await searchStockCode(input);
  if (!code) return { success: false, error: `"${input}" 종목을 찾을 수 없습니다.` };
  
  return await getStockPrice(code);
}

module.exports = { getStockPrice, searchStockCode, getStockInfo };
