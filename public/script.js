// DOM 요소
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const loading = document.getElementById('loading');

// 대화 히스토리
let chatHistory = [];

// 메시지 추가 함수
function addMessage(content, isUser = false) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  contentDiv.textContent = content;
  
  messageDiv.appendChild(contentDiv);
  chatMessages.appendChild(messageDiv);
  
  // 스크롤을 맨 아래로
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 로딩 표시/숨김
function setLoading(isLoading) {
  loading.style.display = isLoading ? 'flex' : 'none';
  sendButton.disabled = isLoading;
  messageInput.disabled = isLoading;
}

// API 호출 함수
async function sendMessage(message) {
  try {
    setLoading(true);
    
    // 사용자 메시지 추가
    addMessage(message, true);
    chatHistory.push({
      role: 'user',
      content: message
    });

    // API 호출
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: message,
        history: chatHistory
      })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || '응답을 받는 중 오류가 발생했습니다.');
    }

    // 봇 응답 추가
    addMessage(data.message, false);
    chatHistory.push({
      role: 'assistant',
      content: data.message
    });

  } catch (error) {
    console.error('오류:', error);
    addMessage(`오류가 발생했습니다: ${error.message}`, false);
  } finally {
    setLoading(false);
    messageInput.focus();
  }
}

// 전송 버튼 클릭 이벤트
sendButton.addEventListener('click', () => {
  const message = messageInput.value.trim();
  if (message) {
    messageInput.value = '';
    sendMessage(message);
  }
});

// Enter 키 이벤트
messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    const message = messageInput.value.trim();
    if (message) {
      messageInput.value = '';
      sendMessage(message);
    }
  }
});

// 페이지 로드 시 입력창에 포커스
window.addEventListener('load', () => {
  messageInput.focus();
});
