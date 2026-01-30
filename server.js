const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
require('dotenv').config();

const chatRoutes = require('./routes/chat');
const stockRoutes = require('./routes/stock');

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));

// API 라우트
app.use('/api/chat', chatRoutes);
app.use('/api/stock', stockRoutes);

// 루트 경로는 index.html 제공
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 에러 핸들링
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false,
    error: '서버 오류가 발생했습니다.',
    message: err.message 
  });
});

// 로컬 환경에서만 서버 시작 (Vercel 환경 제외)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
  });
}

module.exports = app;
