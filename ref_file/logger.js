// Google Apps Script 웹 앱 URL
// 개발 환경에서는 Vite 프록시를 사용하여 COEP 문제 회피
const SCRIPT_URL = import.meta.env.DEV
  ? '/api/log'
  : (import.meta.env.VITE_GOOGLE_SCRIPT_URL || '');

// 화면 이름 한글 매핑
const SCREEN_LABELS = {
  login: '로그인',
  category_purpose: '카테고리(목적)',
  category_topic: '카테고리(주제)',
  category_platform: '카테고리(플랫폼)',
  home: '홈',
  content_upload: '콘텐츠 업로드',
  template_detail: '템플릿 상세',
  story_planning: '스토리 기획',
  video_editor: '비디오 편집기',
  search_category: '검색',
  story_edit: '스토리 편집',
  export_preview: '내보내기 미리보기',
};

// 이벤트 타입 한글 매핑
const EVENT_LABELS = {
  screen_view: '화면 진입',
  button_click: '버튼 클릭',
  select: '선택',
  login: '로그인',
  scroll: '스크롤',
};

// 대상(target) 한글 매핑
const TARGET_LABELS = {
  // 로그인
  google_login_button: '구글 로그인',
  naver_login_button: '네이버 로그인',
  apple_login_button: '애플 로그인',
  google: '구글',
  // 온보딩
  purpose_card: '목적 카드',
  next_button: '다음',
  topic_card: '주제 카드',
  platform_item: '플랫폼 항목',
  start_button: '시작하기',
  // 홈
  search_bar: '검색바',
  more_button: '더보기',
  // 콘텐츠
  timeline_cut_select: '타임라인 컷',
  duration_chip_select: '재생시간 칩',
  back: '뒤로가기',
  video_upload: '영상 업로드',
  ai_subtitle: 'AI 자막 추천',
  ai_suggestion_select: 'AI 자막 추천 항목',
  add_video_button: '영상 추가',
  subtitle_input_focus: '자막 입력(포커스)',
  subtitle_input_blur: '자막 입력(완료)',
  complete: '완성하기',
  save_progress: '진행 저장',
  // 템플릿 상세
  start_edit_button: '편집 시작하기',
  save_toggle: '저장 토글',
  story_planning: '스토리 기획',
  // 스토리 기획
  video_pause: '영상 일시정지',
  video_play: '영상 재생',
  cut_select: '컷 선택',
  cancel: '취소',
  save: '저장하기',
  // 비디오 편집기
  timeline_seek: '타임라인 탐색',
  undo: '실행 취소',
  redo: '다시 실행',
  export: '내보내기',
  nav_tab_change: '탭 변경',
  timeline_scroll: '타임라인 스크롤',
  // 검색
  category: '카테고리',
  template: '템플릿',
  like: '좋아요',
  // 내보내기 미리보기
  setting_change: '설정 변경',
  open_settings: '설정 열기',
  close_settings: '설정 닫기',
  export_start: '내보내기 시작',
  export_complete: '내보내기 완료',
  go_home: '홈으로 이동',
  // 스크롤
  scroll: '스크롤',
};

// 한글 라벨 자동 생성
function generateLabel(screen, event, target) {
  const screenKr = SCREEN_LABELS[screen] || screen;
  const eventKr = EVENT_LABELS[event] || event;
  const targetKr = TARGET_LABELS[target] || target;

  if (event === 'screen_view') {
    return `${screenKr} ${eventKr}`;
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

// 로그 전송 함수
export const sendLog = async (logData) => {
  if (!SCRIPT_URL) {
    console.log('[Logger] URL not configured:', logData);
    return;
  }

  try {
    const payload = {
      userId: getSessionId(),
      browser: navigator.userAgent,
      label: generateLabel(logData.screen, logData.event, logData.target),
      ...logData,
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

// 스크롤 이벤트 로그 (디바운스 포함)
export const logScroll = (screenName, scrollPercent) => {
  sendLog({
    screen: screenName,
    event: 'scroll',
    target: 'scroll',
    value: `${Math.round(scrollPercent)}%`,
  });
};

export default {
  sendLog,
  logScreenView,
  logButtonClick,
  logSelect,
  logLogin,
  logScroll,
};
