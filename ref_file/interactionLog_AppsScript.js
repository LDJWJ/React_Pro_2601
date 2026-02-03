// ============================================
// Google Apps Script - UX 통합 트래킹
// ============================================
// 파일명: UX_Tracking_Log
// 탭1: Tracking_Sheet   → 화면 진입, 버튼 클릭 등 (기존)
// 탭2: Interaction_Log  → 마우스/터치/스크롤 행동 로그
// ============================================
// 사용법:
// 1. Google Sheets 파일명을 'UX_Tracking_Log'로 설정
// 2. 시트 탭 2개 생성: 'Tracking_Sheet', 'Interaction_Log'
// 3. 확장 프로그램 > Apps Script 열기
// 4. 이 코드를 붙여넣기
// 5. 웹 앱으로 배포 (누구나 접근 가능하도록 설정)
// 6. 배포 URL을 .env에 설정

// 시트 탭 이름으로 가져오기 (없으면 자동 생성)
function getOrCreateSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var logType = data.logType || 'tracking';

    if (logType === 'interaction') {
      return handleInteractionLog(data);
    } else {
      return handleTrackingLog(data);
    }
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: 'error', message: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// --- Tracking_Sheet: 기존 화면 진입/버튼 클릭 로그 ---
function handleTrackingLog(data) {
  var sheet = getOrCreateSheet('Tracking_Sheet');

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      '타임스탬프',
      '사용자ID',
      '화면',
      '이벤트',
      '대상',
      '값',
      '행동',
      '브라우저',
    ]);
  }

  sheet.appendRow([
    new Date(),
    data.userId || '',
    data.screen || '',
    data.event || '',
    data.target || '',
    data.value || '',
    data.action || '',
    data.browser || '',
  ]);

  return ContentService.createTextOutput(
    JSON.stringify({ status: 'ok' })
  ).setMimeType(ContentService.MimeType.JSON);
}

// --- Interaction_Log: 마우스/터치/스크롤 행동 로그 ---
function handleInteractionLog(data) {
  var sheet = getOrCreateSheet('Interaction_Log');

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      '타임스탬프',
      '세션ID',
      '사용자이메일',
      '화면',
      '디바이스',
      '이벤트타입',
      'X좌표',
      'Y좌표',
      'scrollX',
      'scrollY',
      '뷰포트너비',
      '뷰포트높이',
      '이벤트시간',
      '브라우저',
    ]);
  }

  var events = data.events || [];
  var rows = [];

  for (var i = 0; i < events.length; i++) {
    var evt = events[i];
    rows.push([
      new Date(),
      data.sessionId || '',
      data.userEmail || '',
      data.screen || '',
      data.device || '',
      evt.type || '',
      evt.x || '',
      evt.y || '',
      evt.scrollX || '',
      evt.scrollY || '',
      evt.viewportWidth || '',
      evt.viewportHeight || '',
      evt.timestamp || '',
      data.browser || '',
    ]);
  }

  // 한 번에 여러 행 추가 (성능 최적화)
  if (rows.length > 0) {
    sheet
      .getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length)
      .setValues(rows);
  }

  return ContentService.createTextOutput(
    JSON.stringify({ status: 'ok', count: rows.length })
  ).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({ status: 'ok', message: 'UX Tracking Log API is running' })
  ).setMimeType(ContentService.MimeType.JSON);
}
