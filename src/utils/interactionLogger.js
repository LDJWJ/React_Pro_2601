// ============================================
// 사용자 인터랙션 로그 수집기
// 마우스 움직임, 터치, 스크롤을 수집하여 배치 전송
// ============================================

const INTERACTION_URL = import.meta.env.DEV
  ? '/api/interaction'
  : (import.meta.env.VITE_INTERACTION_LOG_URL || '');

// 설정
const CONFIG = {
  THROTTLE_MS: 150,        // 이벤트 샘플링 간격 (ms)
  FLUSH_INTERVAL_MS: 15000, // 배치 전송 간격 (ms)
  MAX_BUFFER_SIZE: 500,     // 버퍼 최대 크기 (초과 시 즉시 전송)
};

// 이벤트 버퍼
let eventBuffer = [];
let flushTimer = null;
let isInitialized = false;
let currentScreen = '';

// 디바이스 감지
const getDeviceType = () => {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
  return 'desktop';
};

// 세션 ID 가져오기 (기존 logger.js와 공유)
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
};

// 사용자 이메일 가져오기
const getUserEmail = () => {
  try {
    const user = sessionStorage.getItem('userEmail');
    return user || '';
  } catch {
    return '';
  }
};

// throttle 유틸
const throttle = (fn, delay) => {
  let lastCall = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  };
};

// 이벤트를 버퍼에 추가
const pushEvent = (type, data) => {
  eventBuffer.push({
    type,
    ...data,
    timestamp: Date.now(),
  });

  if (eventBuffer.length >= CONFIG.MAX_BUFFER_SIZE) {
    flush();
  }
};

// 버퍼 데이터를 서버로 전송
const flush = async () => {
  if (eventBuffer.length === 0 || !INTERACTION_URL) return;

  const eventsToSend = [...eventBuffer];
  eventBuffer = [];

  const payload = {
    logType: 'interaction',
    sessionId: getSessionId(),
    userEmail: getUserEmail(),
    screen: currentScreen,
    device: getDeviceType(),
    browser: navigator.userAgent,
    events: eventsToSend,
  };

  try {
    const fetchOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    };

    if (!import.meta.env.DEV) {
      fetchOptions.mode = 'no-cors';
    }

    await fetch(INTERACTION_URL, fetchOptions);
  } catch (error) {
    console.error('[InteractionLog] 전송 실패:', error);
    // 전송 실패 시 버퍼에 복원 (최대 크기 초과 방지)
    if (eventBuffer.length + eventsToSend.length <= CONFIG.MAX_BUFFER_SIZE * 2) {
      eventBuffer = [...eventsToSend, ...eventBuffer];
    }
  }
};

// --- 이벤트 핸들러 ---

const handleMouseMove = throttle((e) => {
  pushEvent('mousemove', {
    x: e.clientX,
    y: e.clientY,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
  });
}, CONFIG.THROTTLE_MS);

const handleTouchMove = throttle((e) => {
  const touch = e.touches[0];
  if (!touch) return;
  pushEvent('touchmove', {
    x: Math.round(touch.clientX),
    y: Math.round(touch.clientY),
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
  });
}, CONFIG.THROTTLE_MS);

const handleScroll = throttle(() => {
  pushEvent('scroll', {
    scrollX: Math.round(window.scrollX),
    scrollY: Math.round(window.scrollY),
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
  });
}, CONFIG.THROTTLE_MS);

const handleClick = (e) => {
  pushEvent('click', {
    x: e.clientX,
    y: e.clientY,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
  });
};

const handleTouchStart = (e) => {
  const touch = e.touches[0];
  if (!touch) return;
  pushEvent('touchstart', {
    x: Math.round(touch.clientX),
    y: Math.round(touch.clientY),
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
  });
};

// --- 공개 API ---

/** 현재 화면 이름 설정 (각 화면 컴포넌트에서 호출) */
export const setInteractionScreen = (screenName) => {
  // 화면 전환 시 이전 화면 데이터 전송
  if (currentScreen && currentScreen !== screenName) {
    flush();
  }
  currentScreen = screenName;
};

/** 인터랙션 로그 수집 시작 */
export const startInteractionLogging = () => {
  if (isInitialized) return;
  isInitialized = true;

  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('touchmove', handleTouchMove, { passive: true });
  window.addEventListener('touchstart', handleTouchStart, { passive: true });
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('click', handleClick);

  // 주기적 배치 전송
  flushTimer = setInterval(flush, CONFIG.FLUSH_INTERVAL_MS);

  // 페이지 이탈 시 남은 데이터 전송
  window.addEventListener('beforeunload', flush);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });

  console.log('[InteractionLog] 수집 시작 - 디바이스:', getDeviceType());
};

/** 인터랙션 로그 수집 중지 */
export const stopInteractionLogging = () => {
  if (!isInitialized) return;

  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('touchmove', handleTouchMove);
  window.removeEventListener('touchstart', handleTouchStart);
  window.removeEventListener('scroll', handleScroll);
  window.removeEventListener('click', handleClick);
  window.removeEventListener('beforeunload', flush);

  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }

  flush(); // 남은 데이터 전송
  isInitialized = false;
  console.log('[InteractionLog] 수집 중지');
};

export default {
  startInteractionLogging,
  stopInteractionLogging,
  setInteractionScreen,
};
