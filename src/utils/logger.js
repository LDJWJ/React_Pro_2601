// Google Apps Script 웹 앱 URL (Tracking_Sheet 용)
// 개발 환경에서는 Vite 프록시를 사용하여 COEP 문제 회피
const SCRIPT_URL = import.meta.env.DEV
  ? '/api/tracking'
  : (import.meta.env.VITE_TRACKING_SCRIPT_URL || '');

// 화면 이름 한글 매핑
const SCREEN_LABELS = {
  login: '로그인',
  mission_main: '메인 미션 화면',
  mission1_1: '미션9',
  mission1_2: '미션9',
  template_detail_a: '미션9 A안',
  template_detail_b: '미션9 B안',
  mission2_1: '미션1',
  mission2_2: '미션1',
  story_planning_a: '미션1 A안',
  story_planning_b: '미션1 B안',
  mission3_1: '미션2',
  mission3_2: '미션2',
  content_upload_a: '미션2 A안',
  content_upload_b: '미션2 B안',
  mission1_1_1: '미션1-1',
  mission1_1_2: '미션1-1',
  content_upload_1_1a: '미션1-1 A안',
  content_upload_1_1b: '미션1-1 B안',
  mission2_1_1: '미션2-1',
  mission2_1_2: '미션2-1',
  content_upload_2a: '미션2-1 A안',
  content_upload_2b: '미션2-1 B안',
  mission7_1: '미션6-1',
  mission7_2: '미션6-1',
  mission6_screen_a: '미션6-1 A안',
  mission6_screen_b: '미션6-1 B안',
  mission99_1: '미션99',
  mission99_2: '미션99',
  sample_template_a: '미션99 A안',
  sample_template_b: '미션99 B안',
};

// 이벤트 타입 한글 매핑
const EVENT_LABELS = {
  screen_view: '화면 진입',
  button_click: '버튼 클릭',
  select: '선택',
  login: '로그인',
  mission_start: '미션 시작',
  mission_complete: '미션 완료',
  screen_exit: '화면 이탈',
};

// 대상(target) 한글 매핑
const TARGET_LABELS = {
  // 로그인
  google_login_button: '구글 로그인',
  google: '구글',
  // 미션 메인
  mission_1: '미션 9',
  mission_2: '미션 1',
  mission_3: '미션 2',
  mission_4: '미션 4',
  mission_5: '미션 99',
  mission_7: '미션 2-1',
  mission_9: '미션 1-1',
  mission_8: '미션 6-1',
  logout_button: '로그아웃',
  // 미션 스텝
  next_button: '다음',
  // 템플릿 상세A
  hook_note_button: '훅 노트',
  // 템플릿 상세B
  story_planning_button: '영상기획하기',
  // 콘텐츠 업로드
  timeline_cut_select: '타임라인 컷 선택',
  duration_chip_select: '시간 칩 선택',
  video_upload: '영상 업로드',
  add_video_button: '영상 추가 버튼',
  ai_subtitle: 'AI 자막 추천',
  ai_suggestion_select: 'AI 추천 선택',
  complete: '완성하기',
  save_progress: '저장하기',
  // 공통
  save_toggle: '저장 토글',
  back: '뒤로가기',
};

// 행동 라벨 자동 생성
function generateAction(screen, event, target) {
  const screenKr = SCREEN_LABELS[screen] || screen;
  const eventKr = EVENT_LABELS[event] || event;
  const targetKr = TARGET_LABELS[target] || target;

  if (event === 'screen_view') {
    return `${screenKr} ${eventKr}`;
  }
  if (event === 'screen_exit') {
    return `${screenKr} ${eventKr} ${target}`;
  }
  if (!target) {
    return `${screenKr} ${eventKr}`;
  }
  return `${targetKr} ${eventKr}`;
}

// 세션 ID 생성 (브라우저 세션 동안 유지)
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
};

// 디바이스 타입 감지
const getDeviceType = () => {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
  return 'desktop';
};

// 로그 전송 함수
// 시트 컬럼: 타임스탬프 | 사용자ID | 화면 | 이벤트 | 대상 | 값 | 행동 | 브라우저 | 세션ID | 체류시간(ms)
export const sendLog = async (logData) => {
  if (!SCRIPT_URL) {
    console.log('[Tracking] URL not configured:', logData);
    return;
  }

  try {
    const screenKr = SCREEN_LABELS[logData.screen] || logData.screen;
    const eventKr = EVENT_LABELS[logData.event] || logData.event;
    const targetKr = TARGET_LABELS[logData.target] || logData.target || '';
    const action = generateAction(logData.screen, logData.event, logData.target);

    const payload = {
      userId: getSessionId(),
      screen: screenKr,
      event: eventKr,
      target: targetKr,
      value: logData.value || '',
      action: action,
      browser: navigator.userAgent,
      device: getDeviceType(),
    };

    const fetchOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };

    // 프로덕션에서는 no-cors 모드 사용 (Google Apps Script 직접 호출)
    if (!import.meta.env.DEV) {
      fetchOptions.mode = 'no-cors';
    }

    await fetch(SCRIPT_URL, fetchOptions);
  } catch (error) {
    console.error('[Tracking] Failed to send log:', error);
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

// 미션 시작 로그
export const logMissionStart = (screenName, missionTarget) => {
  sendLog({
    screen: screenName,
    event: 'mission_start',
    target: missionTarget,
    value: '',
  });
};

// 미션 완료 로그
export const logMissionComplete = (screenName, missionTarget, value = '') => {
  sendLog({
    screen: screenName,
    event: 'mission_complete',
    target: missionTarget,
    value: value,
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

// 화면 이탈 로그
export const logScreenExit = (screenName, dwellTimeMs) => {
  const dwellTimeSec = (dwellTimeMs / 1000).toFixed(1);
  sendLog({
    screen: screenName,
    event: 'screen_exit',
    target: '',
    value: dwellTimeSec + '초',
    dwellTime: dwellTimeMs,
  });
};

export default {
  sendLog,
  logScreenView,
  logButtonClick,
  logSelect,
  logMissionStart,
  logMissionComplete,
  logLogin,
  logScreenExit,
};
