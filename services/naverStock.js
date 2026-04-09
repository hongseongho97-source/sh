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

/**
 * 서울 기준 오늘 날짜 YYYYMMDD
 */
function getSeoulTodayYmd() {
  const parts = {};
  for (const p of new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())) {
    if (p.type !== 'literal') parts[p.type] = p.value;
  }
  return `${parts.year}${parts.month}${parts.day}`;
}

/**
 * 같은 월·일 기준 작년 YYYYMMDD (2/29 → 평년이면 2/28)
 */
function ymdSameDayLastYear(ymd) {
  const y = parseInt(ymd.slice(0, 4), 10) - 1;
  const md = ymd.slice(4);
  if (md === '0229') {
    const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    return leap ? `${y}0229` : `${y}0228`;
  }
  return `${y}${md}`;
}

/**
 * YYYYMMDD에 calendar day 더하기 (UTC 기준 단순 일수)
 */
function ymdAddDays(ymd, deltaDays) {
  const y = parseInt(ymd.slice(0, 4), 10);
  const m = parseInt(ymd.slice(4, 6), 10) - 1;
  const d = parseInt(ymd.slice(6, 8), 10);
  const t = Date.UTC(y, m, d) + deltaDays * 86400000;
  const dt = new Date(t);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}${mm}${dd}`;
}

/**
 * 네이버 일봉 JSON 문자열에서 행 파싱 (종가 = close)
 */
function parseNaverSiseRows(raw) {
  if (typeof raw !== 'string') return [];
  const rows = [];
  const re = /\["(\d{8})"\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\]/g;
  let m;
  while ((m = re.exec(raw)) !== null) {
    rows.push({
      date: m[1],
      open: Number(m[2]),
      high: Number(m[3]),
      low: Number(m[4]),
      close: Number(m[5]),
      volume: Number(m[6]),
    });
  }
  return rows.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * 네이버 API: startTime ~ endTime 일봉 (YYYYMMDD)
 */
async function fetchNaverDailyRange(code, startYmd, endYmd) {
  const url = `https://api.finance.naver.com/siseJson.naver?symbol=${code}&requestType=1&startTime=${startYmd}&endTime=${endYmd}&timeframe=day`;
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      Referer: 'https://finance.naver.com/',
    },
    responseType: 'text',
    timeout: 8000,
  });
  return parseNaverSiseRows(response.data);
}

/**
 * 기준일(YYYYMMDD) 이전 또는 당일 중 가장 늦은 거래일 종가
 */
function pickCloseOnOrBefore(rows, referenceYmd) {
  let best = null;
  for (const row of rows) {
    if (row.date <= referenceYmd && (!best || row.date > best.date)) best = row;
  }
  return best;
}

/**
 * 작년 같은 날짜(서울)에 가장 가까운 이전(또는 당일) 영업일 종가와 현재가 비교
 */
async function getStockYearOverYear(code, nameHint) {
  const today = getSeoulTodayYmd();
  const referenceYmd = ymdSameDayLastYear(today);
  const startYmd = ymdAddDays(referenceYmd, -50);
  const endYmd = ymdAddDays(referenceYmd, 10);

  let rows;
  try {
    rows = await fetchNaverDailyRange(code, startYmd, endYmd);
  } catch (e) {
    console.error('[YoY] Historic fetch error:', e.message);
    return { success: false, error: '과거 시세를 불러오지 못했습니다.' };
  }

  const refRow = pickCloseOnOrBefore(rows, referenceYmd);
  if (!refRow) {
    return { success: false, error: '작년 기준일 근처 거래 데이터가 없습니다.' };
  }

  const current = await getStockPrice(code);
  if (!current.success) return current;

  const pastClose = refRow.close;
  const cur = current.currentPrice;
  const diff = cur - pastClose;
  const pct = pastClose ? ((diff / pastClose) * 100).toFixed(2) : '0.00';

  return {
    success: true,
    symbol: code,
    name: current.name || nameHint || code,
    currentPrice: cur,
    referenceDate: referenceYmd,
    tradingDateUsed: refRow.date,
    yearAgoClose: pastClose,
    changeSinceYearAgo: diff,
    changeSinceYearAgoPercent: `${pct}%`,
    direction: diff > 0 ? '상승' : diff < 0 ? '하락' : '보합',
    url: current.url,
  };
}

async function getStockInfo(input) {
  if (/^\d{6}$/.test(input)) {
    return await getStockPrice(input);
  }
  
  const code = await searchStockCode(input);
  if (!code) return { success: false, error: `"${input}" 종목을 찾을 수 없습니다.` };
  
  return await getStockPrice(code);
}

/**
 * 종목명/코드 입력 → 작년 대비 비교
 */
async function getStockInfoYearOverYear(input) {
  let code;
  let nameHint = input;
  if (/^\d{6}$/.test(input)) {
    code = input;
    nameHint = input;
  } else {
    code = await searchStockCode(input);
    if (!code) return { success: false, error: `"${input}" 종목을 찾을 수 없습니다.` };
  }
  return getStockYearOverYear(code, nameHint);
}

module.exports = {
  getStockPrice,
  searchStockCode,
  getStockInfo,
  getStockInfoYearOverYear,
};
