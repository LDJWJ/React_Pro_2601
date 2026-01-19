// Google Apps Script 웹 앱 URL을 여기에 입력하세요
const SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL || '';

// 세션 ID 생성 (브라우저 세션 동안 유지)
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
};

// 로그 전송 함수
export const sendLog = async (logData) => {
  if (!SCRIPT_URL) {
    console.log('[Logger] URL not configured:', logData);
    return;
  }

  try {
    const payload = {
      userId: getSessionId(),
      userAgent: navigator.userAgent,
      ...logData,
    };

    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('[Logger] Failed to send log:', error);
  }
};

// 화면 진입 로그
export const logScreenView = (screenName) => {
  sendLog({
    screen: screenName,
    event: 'screen_view',
    target: '',
    value: '',
  });
};

// 버튼 클릭 로그
export const logButtonClick = (screenName, buttonName, value = '') => {
  sendLog({
    screen: screenName,
    event: 'button_click',
    target: buttonName,
    value: value,
  });
};

// 선택 이벤트 로그
export const logSelect = (screenName, itemName, value) => {
  sendLog({
    screen: screenName,
    event: 'select',
    target: itemName,
    value: Array.isArray(value) ? value.join(', ') : value,
  });
};

// 로그인 이벤트 로그
export const logLogin = (method, userEmail = '') => {
  sendLog({
    screen: 'login',
    event: 'login',
    target: method,
    value: userEmail,
  });
};

export default {
  sendLog,
  logScreenView,
  logButtonClick,
  logSelect,
  logLogin,
};
