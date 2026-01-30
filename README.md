# 국내주식 주가 검색 챗봇

Google Gemini API를 활용한 자연어 기반 국내주식 주가 검색 챗봇입니다.

## 주요 기능

- 🤖 **Gemini AI 연동**: 자연어로 주식 정보를 질문할 수 있습니다
- 📊 **실시간 주가 조회**: 네이버 금융에서 최신 주가 정보를 가져옵니다
- 💬 **대화형 인터페이스**: 챗봇 형태로 편리하게 사용할 수 있습니다
- 🔍 **종목명/종목코드 지원**: "삼성전자" 또는 "005930" 모두 검색 가능합니다

## 기술 스택

- **백엔드**: Node.js, Express
- **AI**: Google Gemini API (@google/generative-ai)
- **데이터 수집**: axios, cheerio (네이버 금융 스크래핑)
- **프론트엔드**: HTML, CSS, JavaScript (Vanilla)

## 설치 방법

### 1. 프로젝트 클론 및 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env` 파일을 생성하고 Gemini API 키를 설정하세요:

```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
```

**Gemini API 키 발급 방법:**
1. [Google AI Studio](https://makersuite.google.com/app/apikey)에 접속
2. API 키 생성
3. 생성된 키를 `.env` 파일에 입력

### 3. 서버 실행

```bash
npm start
```

서버가 실행되면 브라우저에서 `http://localhost:3000`으로 접속하세요.

## 사용 방법

### 예시 질문

- "삼성전자 주가 알려줘"
- "005930 현재가는?"
- "SK하이닉스 주가 조회해줘"
- "000660 주가 알려줘"

### API 엔드포인트

#### 채팅 API
```
POST /api/chat
Content-Type: application/json

{
  "message": "삼성전자 주가 알려줘",
  "history": []
}
```

#### 주가 조회 API
```
GET /api/stock/:symbol

예시:
GET /api/stock/005930
GET /api/stock/삼성전자
```

## 프로젝트 구조

```
cursortest3/
├── package.json          # 의존성 관리
├── server.js             # Express 서버 메인 파일
├── .env                  # 환경 변수 (API 키)
├── routes/
│   ├── chat.js           # Gemini 채팅 API 라우트
│   └── stock.js          # 주가 검색 API 라우트
├── services/
│   ├── geminiService.js  # Gemini API 서비스
│   └── naverStock.js     # 네이버 금융 스크래핑 서비스
├── public/
│   ├── index.html        # 챗봇 UI 메인 페이지
│   ├── style.css         # 스타일시트
│   └── script.js         # 프론트엔드 JavaScript
└── README.md             # 프로젝트 설명서
```

## 작동 원리

1. 사용자가 자연어로 주식 종목에 대해 질문합니다
2. Gemini API가 메시지를 분석하고 Function Calling을 통해 주가 검색 함수를 호출합니다
3. 백엔드에서 네이버 금융에서 주가 정보를 스크래핑합니다
4. Gemini가 주가 정보를 자연스러운 언어로 가공하여 응답합니다
5. 챗봇 인터페이스에 응답이 표시됩니다

## 주의사항

- 네이버 금융 스크래핑은 해당 사이트의 이용약관을 준수해야 합니다
- 과도한 요청은 IP 차단을 받을 수 있으니 주의하세요
- Gemini API는 사용량에 따라 비용이 발생할 수 있습니다

## 라이선스

ISC
