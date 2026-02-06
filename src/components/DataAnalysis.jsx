import { useState, useEffect, useMemo } from 'react';
import './DataAnalysis.css';
import { logScreenView, logButtonClick } from '../utils/logger';

// CSV 파싱 (쉼표 구분, 따옴표 처리)
function parseCSV(text) {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  const parseLine = (line) => {
    const fields = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        // CSV 표준: "" 는 "로 변환 (이스케이프된 따옴표)
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // 다음 따옴표 건너뛰기
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    fields.push(current.trim());
    return fields;
  };

  const headers = parseLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });
    rows.push(row);
  }
  return rows;
}

// 미션 정의
const MISSIONS = {
  'edit1-1': {
    id: 'edit1-1',
    name: '편집 1-1',
    description: '영상 업로드 후 재생하기',
    screenPrefix: '편집1-1',
    missionStartTarget: '편집1-1_미션시작',
    missionCompleteTarget: '편집1-1_미션완료',
    analysisItems: ['funnel', 'completionRate', 'avgTime', 'timeAnalysis', 'firstTrySuccess', 'heatmap', 'buttonClicks', 'deviceStats'],
    // 퍼널 단계 정의
    funnelSteps: [
      { id: 'screenEnter', name: '화면 진입', event: '화면 진입', screen: '편집1-1_화면' },
      { id: 'missionStart', name: '미션 시작', event: '미션 시작', target: '편집1-1_미션시작' },
      { id: 'videoAdd', name: '영상 추가', event: '버튼 클릭', target: '영상추가' },
      { id: 'videoUpload', name: '업로드 완료', event: '버튼 클릭', target: '영상업로드완료' },
      { id: 'play', name: '재생 클릭', event: '버튼 클릭', target: '재생' },
      { id: 'missionComplete', name: '미션 완료', event: '미션 완료', target: '편집1-1_미션완료' },
    ],
  },
  'edit2-1': {
    id: 'edit2-1',
    name: '편집 2-1',
    description: '4번째 컷 선택하기',
    screenPrefix: '편집2-1',
    missionStartTarget: '편집2-1_미션시작',
    missionCompleteTarget: '편집2-1_미션완료',
    analysisItems: ['funnel', 'completionRate', 'avgTime', 'timeAnalysis', 'firstTrySuccess', 'wrongPattern', 'heatmap', 'buttonClicks', 'deviceStats'],
    funnelSteps: [
      { id: 'screenEnter', name: '화면 진입', event: '화면 진입', screen: '편집2-1_화면' },
      { id: 'missionStart', name: '미션 시작', event: '미션 시작', target: '편집2-1_미션시작' },
      { id: 'cutSelect', name: '컷 선택', event: '버튼 클릭', targetPrefix: '컷' },
      { id: 'missionComplete', name: '미션 완료', event: '미션 완료', target: '편집2-1_미션완료' },
    ],
  },
  'edit6-1': {
    id: 'edit6-1',
    name: '편집 6-1',
    description: 'AI 자막 추천 (2단계)',
    screenPrefix: '편집6-1',
    missionStartTarget: '편집6-1_기본미션시작',
    missionCompleteTarget: '편집6-1_기본미션완료',
    additionalMissionStart: '편집6-1_추가미션시작',
    additionalMissionComplete: '편집6-1_추가미션완료',
    analysisItems: ['funnel', 'completionRate', 'avgTime', 'timeAnalysis', 'stageFlow', 'aiUsage', 'heatmap', 'buttonClicks', 'deviceStats'],
    funnelSteps: [
      { id: 'screenEnter', name: '화면 진입', event: '화면 진입', screen: '편집6-1_화면' },
      { id: 'basicStart', name: '기본 미션 시작', event: '미션 시작', target: '편집6-1_기본미션시작' },
      { id: 'videoAdd', name: '영상 추가', event: '버튼 클릭', target: '영상추가' },
      { id: 'aiSubtitle', name: 'AI 자막 추천', event: '버튼 클릭', target: 'AI자막추천' },
      { id: 'basicComplete', name: '기본 미션 완료', event: '미션 완료', target: '편집6-1_기본미션완료' },
      { id: 'additionalStart', name: '추가 미션 시작', event: '미션 시작', target: '편집6-1_추가미션시작' },
      { id: 'additionalComplete', name: '추가 미션 완료', event: '미션 완료', target: '편집6-1_추가미션완료' },
    ],
  },
  'plan1-1': {
    id: 'plan1-1',
    name: '기획 1-1',
    description: '아이디어 메모 (6컷 개별)',
    screenPrefix: '기획1-1',
    missionStartTarget: '기획1-1_미션시작',
    missionCompleteTarget: '기획1-1_미션완료',
    analysisItems: ['funnel', 'completionRate', 'avgTime', 'timeAnalysis', 'memoAnalysis', 'heatmap', 'buttonClicks', 'deviceStats'],
    funnelSteps: [
      { id: 'screenEnter', name: '화면 진입', event: '화면 진입', screen: '기획1-1_화면' },
      { id: 'missionStart', name: '미션 시작', event: '미션 시작', target: '기획1-1_미션시작' },
      { id: 'memoInput', name: '메모 입력', event: '버튼 클릭', target: '메모입력완료' },
      { id: 'save', name: '저장하기', event: '버튼 클릭', target: '저장하기' },
      { id: 'missionComplete', name: '미션 완료', event: '미션 완료', target: '기획1-1_미션완료' },
    ],
  },
  'plan1-2': {
    id: 'plan1-2',
    name: '기획 1-2',
    description: '아이디어 메모 (3컷 그룹)',
    screenPrefix: '기획1-2',
    missionStartTarget: '기획1-2_미션시작',
    missionCompleteTarget: '기획1-2_미션완료',
    analysisItems: ['funnel', 'completionRate', 'avgTime', 'timeAnalysis', 'memoAnalysis', 'heatmap', 'buttonClicks', 'deviceStats'],
    funnelSteps: [
      { id: 'screenEnter', name: '화면 진입', event: '화면 진입', screen: '기획1-2_화면' },
      { id: 'missionStart', name: '미션 시작', event: '미션 시작', target: '기획1-2_미션시작' },
      { id: 'memoInput', name: '메모 입력', event: '버튼 클릭', target: '메모입력완료' },
      { id: 'save', name: '저장하기', event: '버튼 클릭', target: '저장하기' },
      { id: 'missionComplete', name: '미션 완료', event: '미션 완료', target: '기획1-2_미션완료' },
    ],
  },
};

// 분석 항목 정의
const ANALYSIS_ITEMS = {
  funnel: { id: 'funnel', name: '퍼널 분석', icon: '🔥' },
  completionRate: { id: 'completionRate', name: '완료율', icon: '📊' },
  avgTime: { id: 'avgTime', name: '소요시간', icon: '⏱️' },
  timeAnalysis: { id: 'timeAnalysis', name: '시간 분석', icon: '⏰' },
  firstTrySuccess: { id: 'firstTrySuccess', name: '첫시도 성공률', icon: '🎯' },
  wrongPattern: { id: 'wrongPattern', name: '오답 패턴', icon: '❌' },
  buttonClicks: { id: 'buttonClicks', name: '버튼 클릭', icon: '👆' },
  heatmap: { id: 'heatmap', name: '히트맵', icon: '🔥' },
  deviceStats: { id: 'deviceStats', name: '디바이스별', icon: '📱' },
  stageFlow: { id: 'stageFlow', name: '단계별 흐름', icon: '🔄' },
  aiUsage: { id: 'aiUsage', name: 'AI 사용률', icon: '🤖' },
  memoAnalysis: { id: 'memoAnalysis', name: '메모 분석', icon: '📝' },
  abComparison: { id: 'abComparison', name: 'A/B 비교', icon: '⚖️' },
};

// 미션별 통계 계산
function computeMissionStats(data, mission) {
  const validRows = data.filter(r => r['사용자ID']);

  // 해당 미션 관련 로우만 필터링
  const missionRows = validRows.filter(r =>
    r['화면']?.includes(mission.screenPrefix) ||
    r['대상']?.includes(mission.screenPrefix)
  );

  // 세션 수 (미션 화면에 진입한 고유 사용자)
  const sessions = new Set(missionRows.map(r => r['사용자ID']));

  // 디바이스별 세션
  const deviceSessions = { mobile: new Set(), desktop: new Set(), tablet: new Set() };
  missionRows.forEach(r => {
    const device = r['디바이스'] || 'desktop';
    if (deviceSessions[device]) {
      deviceSessions[device].add(r['사용자ID']);
    }
  });

  // 미션 시작/완료 카운트
  let starts = 0;
  let completes = 0;
  const completionTimes = [];

  if (mission.isABTest) {
    // A/B 테스트 미션
    const aStarts = validRows.filter(r => r['이벤트'] === '미션 시작' && r['대상'] === mission.aMissionStart).length;
    const aCompletes = validRows.filter(r => r['이벤트'] === '미션 완료' && r['대상'] === mission.aMissionComplete).length;
    const bStarts = validRows.filter(r => r['이벤트'] === '미션 시작' && r['대상'] === mission.bMissionStart).length;
    const bCompletes = validRows.filter(r => r['이벤트'] === '미션 완료' && r['대상'] === mission.bMissionComplete).length;

    starts = aStarts; // A 시작 기준
    completes = bCompletes; // B 완료 기준 (전체 완료)

    // A/B 각각의 완료 시간
    validRows.forEach(r => {
      if (r['이벤트'] === '미션 완료' && (r['대상'] === mission.aMissionComplete || r['대상'] === mission.bMissionComplete)) {
        const match = r['값']?.match(/완료시간:(\d+\.?\d*)초/);
        if (match) completionTimes.push(parseFloat(match[1]));
      }
    });

    return {
      sessions: sessions.size,
      deviceSessions: {
        mobile: deviceSessions.mobile.size,
        desktop: deviceSessions.desktop.size,
        tablet: deviceSessions.tablet.size,
      },
      aStarts,
      aCompletes,
      bStarts,
      bCompletes,
      aCompletionRate: aStarts > 0 ? ((aCompletes / aStarts) * 100).toFixed(1) : '0.0',
      bCompletionRate: bStarts > 0 ? ((bCompletes / bStarts) * 100).toFixed(1) : '0.0',
      completionTimes,
      avgTime: completionTimes.length > 0
        ? (completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length).toFixed(1)
        : null,
    };
  } else if (mission.additionalMissionStart) {
    // 2단계 미션 (편집 6-1)
    const basicStarts = validRows.filter(r => r['이벤트'] === '미션 시작' && r['대상'] === mission.missionStartTarget).length;
    const basicCompletes = validRows.filter(r => r['이벤트'] === '미션 완료' && r['대상'] === mission.missionCompleteTarget).length;
    const additionalStarts = validRows.filter(r => r['이벤트'] === '미션 시작' && r['대상'] === mission.additionalMissionStart).length;
    const additionalCompletes = validRows.filter(r => r['이벤트'] === '미션 완료' && r['대상'] === mission.additionalMissionComplete).length;

    validRows.forEach(r => {
      if (r['이벤트'] === '미션 완료' && (r['대상'] === mission.missionCompleteTarget || r['대상'] === mission.additionalMissionComplete)) {
        const match = r['값']?.match(/완료시간:(\d+\.?\d*)초/);
        if (match) completionTimes.push(parseFloat(match[1]));
      }
    });

    return {
      sessions: sessions.size,
      deviceSessions: {
        mobile: deviceSessions.mobile.size,
        desktop: deviceSessions.desktop.size,
        tablet: deviceSessions.tablet.size,
      },
      basicStarts,
      basicCompletes,
      additionalStarts,
      additionalCompletes,
      basicCompletionRate: basicStarts > 0 ? ((basicCompletes / basicStarts) * 100).toFixed(1) : '0.0',
      additionalCompletionRate: additionalStarts > 0 ? ((additionalCompletes / additionalStarts) * 100).toFixed(1) : '0.0',
      completionTimes,
      avgTime: completionTimes.length > 0
        ? (completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length).toFixed(1)
        : null,
    };
  } else {
    // 일반 미션
    starts = validRows.filter(r => r['이벤트'] === '미션 시작' && r['대상'] === mission.missionStartTarget).length;
    completes = validRows.filter(r => r['이벤트'] === '미션 완료' && r['대상'] === mission.missionCompleteTarget).length;

    validRows.forEach(r => {
      if (r['이벤트'] === '미션 완료' && r['대상'] === mission.missionCompleteTarget) {
        const match = r['값']?.match(/완료시간:(\d+\.?\d*)초/);
        if (match) completionTimes.push(parseFloat(match[1]));
      }
    });

    return {
      sessions: sessions.size,
      deviceSessions: {
        mobile: deviceSessions.mobile.size,
        desktop: deviceSessions.desktop.size,
        tablet: deviceSessions.tablet.size,
      },
      starts,
      completes,
      completionRate: starts > 0 ? ((completes / starts) * 100).toFixed(1) : '0.0',
      completionTimes,
      avgTime: completionTimes.length > 0
        ? (completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length).toFixed(1)
        : null,
      minTime: completionTimes.length > 0 ? Math.min(...completionTimes).toFixed(1) : null,
      maxTime: completionTimes.length > 0 ? Math.max(...completionTimes).toFixed(1) : null,
    };
  }
}

// 첫 시도 성공률 계산
function computeFirstTrySuccess(data, mission) {
  const validRows = data.filter(r => r['사용자ID']);
  const screenName = `${mission.screenPrefix}_화면`;

  // 세션별 첫 번째 관련 버튼 클릭 찾기
  const sessionFirstClick = {};

  validRows.forEach(r => {
    if (r['화면'] !== screenName || r['이벤트'] !== '버튼 클릭') return;

    const session = r['사용자ID'];
    const target = r['대상'];

    // 편집 1-1: 재생 버튼의 expected
    if (mission.id === 'edit1-1' && target === '재생') {
      if (!sessionFirstClick[session]) {
        try {
          const value = JSON.parse(r['값'] || '{}');
          sessionFirstClick[session] = value.expected === true;
        } catch (e) {
          sessionFirstClick[session] = false;
        }
      }
    }

    // 편집 2-1: 컷 선택의 expected (targetCut === 4)
    if (mission.id === 'edit2-1' && target?.startsWith('컷')) {
      if (!sessionFirstClick[session]) {
        try {
          const value = JSON.parse(r['값'] || '{}');
          sessionFirstClick[session] = value.expected === true;
        } catch (e) {
          sessionFirstClick[session] = false;
        }
      }
    }
  });

  const total = Object.keys(sessionFirstClick).length;
  const success = Object.values(sessionFirstClick).filter(v => v).length;

  return {
    total,
    success,
    rate: total > 0 ? ((success / total) * 100).toFixed(1) : '0.0',
  };
}

// 오답 패턴 계산 (편집 2-1)
function computeWrongPattern(data, mission) {
  if (mission.id !== 'edit2-1') return null;

  const validRows = data.filter(r => r['사용자ID']);
  const screenName = `${mission.screenPrefix}_화면`;

  const wrongClicks = {};

  validRows.forEach(r => {
    if (r['화면'] !== screenName || r['이벤트'] !== '버튼 클릭') return;
    if (!r['대상']?.startsWith('컷')) return;

    try {
      const value = JSON.parse(r['값'] || '{}');
      if (value.expected === false && value.targetCut) {
        const cut = `컷${value.targetCut}`;
        wrongClicks[cut] = (wrongClicks[cut] || 0) + 1;
      }
    } catch (e) {}
  });

  return Object.entries(wrongClicks)
    .sort((a, b) => b[1] - a[1])
    .map(([cut, count]) => ({ cut, count }));
}

// 버튼 클릭 분포 계산
// 분석에 불필요한 필수 단계 버튼은 제외
const EXCLUDED_BUTTONS = ['다음', '팝업확인', '완료'];

function computeButtonClicks(data, mission) {
  const validRows = data.filter(r => r['사용자ID']);
  const screenName = `${mission.screenPrefix}_화면`;

  const buttonClicks = {};

  validRows.forEach(r => {
    if (!r['화면']?.includes(mission.screenPrefix) || r['이벤트'] !== '버튼 클릭') return;

    const target = r['대상'];
    // 필수 단계 버튼은 제외
    if (target && !EXCLUDED_BUTTONS.includes(target)) {
      buttonClicks[target] = (buttonClicks[target] || 0) + 1;
    }
  });

  return Object.entries(buttonClicks)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));
}

// A/B 비교 분석 (기획 1-1)
function computeABComparison(data, mission) {
  if (!mission.isABTest) return null;

  const validRows = data.filter(r => r['사용자ID']);

  // A안 분석
  const aRows = validRows.filter(r => r['화면'] === mission.aScreen);
  const aCompleteTimes = [];
  const aMemoStats = { totalLength: 0, count: 0, details: [] };

  validRows.forEach(r => {
    if (r['이벤트'] === '미션 완료' && r['대상'] === mission.aMissionComplete) {
      const match = r['값']?.match(/완료시간:(\d+\.?\d*)초/);
      if (match) aCompleteTimes.push(parseFloat(match[1]));

      const memoMatch = r['값']?.match(/메모수:(\d+)/);
      const lengthMatch = r['값']?.match(/총길이:(\d+)/);
      if (memoMatch) aMemoStats.count = parseInt(memoMatch[1]);
      if (lengthMatch) aMemoStats.totalLength = parseInt(lengthMatch[1]);
    }
  });

  // B안 분석
  const bRows = validRows.filter(r => r['화면'] === mission.bScreen);
  const bCompleteTimes = [];
  const bMemoStats = { totalLength: 0, count: 0, details: [] };

  validRows.forEach(r => {
    if (r['이벤트'] === '미션 완료' && r['대상'] === mission.bMissionComplete) {
      const match = r['값']?.match(/완료시간:(\d+\.?\d*)초/);
      if (match) bCompleteTimes.push(parseFloat(match[1]));

      const memoMatch = r['값']?.match(/메모수:(\d+)/);
      const lengthMatch = r['값']?.match(/총길이:(\d+)/);
      if (memoMatch) bMemoStats.count = parseInt(memoMatch[1]);
      if (lengthMatch) bMemoStats.totalLength = parseInt(lengthMatch[1]);
    }
  });

  // 저장하기 버튼에서 상세 메모 정보 추출
  validRows.forEach(r => {
    if (r['이벤트'] !== '버튼 클릭' || r['대상'] !== '저장하기') return;

    try {
      const value = JSON.parse(r['값'] || '{}');
      if (r['화면'] === mission.aScreen && value.memoDetails) {
        aMemoStats.details = value.memoDetails;
        aMemoStats.totalCuts = value.totalCuts;
        aMemoStats.avgLength = value.avgMemoLength;
      }
      if (r['화면'] === mission.bScreen && value.memoDetails) {
        bMemoStats.details = value.memoDetails;
        bMemoStats.totalCuts = value.totalCuts;
        bMemoStats.avgLength = value.avgMemoLength;
      }
    } catch (e) {}
  });

  return {
    a: {
      avgTime: aCompleteTimes.length > 0
        ? (aCompleteTimes.reduce((a, b) => a + b, 0) / aCompleteTimes.length).toFixed(1)
        : null,
      memoStats: aMemoStats,
    },
    b: {
      avgTime: bCompleteTimes.length > 0
        ? (bCompleteTimes.reduce((a, b) => a + b, 0) / bCompleteTimes.length).toFixed(1)
        : null,
      memoStats: bMemoStats,
    },
  };
}

// AI 사용률 계산 (편집 6-1)
function computeAIUsage(data, mission) {
  if (mission.id !== 'edit6-1') return null;

  const validRows = data.filter(r => r['사용자ID']);
  const screenName = `${mission.screenPrefix}_화면`;

  const aiClicks = validRows.filter(r =>
    r['화면'] === screenName &&
    r['이벤트'] === '버튼 클릭' &&
    r['대상'] === 'AI자막추천'
  ).length;

  const aiRecommendClicks = validRows.filter(r => {
    if (r['화면'] !== screenName || r['이벤트'] !== '버튼 클릭') return false;
    if (!r['대상']?.startsWith('AI추천')) return false;
    return true;
  }).length;

  return {
    aiButtonClicks: aiClicks,
    aiRecommendSelections: aiRecommendClicks,
  };
}

// 시간 분석 계산
function computeTimeAnalysis(data, mission) {
  const validRows = data.filter(r => r['사용자ID'] && r['타임스탬프']);

  // 타임스탬프 파싱 함수
  const parseTimestamp = (ts) => {
    if (!ts) return null;
    // "2026. 2. 6 오전 1:37:26" 형식 파싱
    const match = ts.match(/(\d+)\.\s*(\d+)\.\s*(\d+)\s*(오전|오후)\s*(\d+):(\d+):(\d+)/);
    if (!match) return null;
    let [, year, month, day, ampm, hour, min, sec] = match;
    hour = parseInt(hour);
    if (ampm === '오후' && hour !== 12) hour += 12;
    if (ampm === '오전' && hour === 12) hour = 0;
    return new Date(year, month - 1, day, hour, min, sec);
  };

  // 세션별 데이터 그룹화
  const sessionData = {};
  validRows.forEach(r => {
    const session = r['사용자ID'];
    if (!sessionData[session]) sessionData[session] = [];
    sessionData[session].push({
      ...r,
      parsedTime: parseTimestamp(r['타임스탬프']),
    });
  });

  // 세션별 시간순 정렬
  Object.values(sessionData).forEach(events => {
    events.sort((a, b) => (a.parsedTime || 0) - (b.parsedTime || 0));
  });

  const results = {
    // 화면별 체류 시간
    dwellTimes: [],
    avgDwellTime: null,
    // 첫 인터랙션까지 시간
    firstInteractionTimes: [],
    avgFirstInteraction: null,
    // 동작 간 간격 (망설임 시간)
    actionIntervals: [],
    avgActionInterval: null,
    // 미션 완료 시간 분포
    completionTimeDistribution: [],
  };

  // 각 세션 분석
  Object.entries(sessionData).forEach(([sessionId, events]) => {
    // 해당 미션 화면 이벤트만 필터링
    const missionEvents = events.filter(e =>
      e['화면']?.includes(mission.screenPrefix)
    );

    if (missionEvents.length === 0) return;

    // 1. 화면 진입 찾기
    const screenEntry = missionEvents.find(e => e['이벤트'] === '화면 진입');
    const screenExit = missionEvents.find(e => e['이벤트'] === '화면 이탈');

    // 체류 시간 (화면 이탈 로그의 값에서 추출)
    if (screenExit && screenExit['값']) {
      const match = screenExit['값'].match(/([\d.]+)초/);
      if (match) {
        results.dwellTimes.push(parseFloat(match[1]));
      }
    }

    // 2. 첫 인터랙션까지 시간
    if (screenEntry && screenEntry.parsedTime) {
      const firstAction = missionEvents.find(e =>
        e['이벤트'] === '버튼 클릭' && e.parsedTime > screenEntry.parsedTime
      );
      if (firstAction && firstAction.parsedTime) {
        const timeToFirst = (firstAction.parsedTime - screenEntry.parsedTime) / 1000;
        if (timeToFirst > 0 && timeToFirst < 300) { // 5분 이내만
          results.firstInteractionTimes.push(timeToFirst);
        }
      }
    }

    // 3. 동작 간 간격 (버튼 클릭 사이 시간)
    const buttonClicks = missionEvents.filter(e =>
      e['이벤트'] === '버튼 클릭' && e.parsedTime
    );
    for (let i = 1; i < buttonClicks.length; i++) {
      const interval = (buttonClicks[i].parsedTime - buttonClicks[i - 1].parsedTime) / 1000;
      if (interval > 0 && interval < 60) { // 1분 이내만 (비정상적 간격 제외)
        results.actionIntervals.push({
          from: buttonClicks[i - 1]['대상'],
          to: buttonClicks[i]['대상'],
          interval,
        });
      }
    }

    // 4. 미션 완료 시간
    const missionComplete = missionEvents.find(e => e['이벤트'] === '미션 완료');
    if (missionComplete && missionComplete['값']) {
      const match = missionComplete['값'].match(/완료시간:([\d.]+)초/);
      if (match) {
        results.completionTimeDistribution.push(parseFloat(match[1]));
      }
    }
  });

  // 평균 계산
  const calcAvg = (arr) => arr.length > 0
    ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1)
    : null;

  results.avgDwellTime = calcAvg(results.dwellTimes);
  results.avgFirstInteraction = calcAvg(results.firstInteractionTimes);

  // 동작 간격 평균
  const intervals = results.actionIntervals.map(a => a.interval);
  results.avgActionInterval = calcAvg(intervals);

  // 시간 분포 구간화 (히스토그램용)
  const createDistribution = (times, bucketSize = 5) => {
    if (times.length === 0) return [];
    const buckets = {};
    times.forEach(t => {
      const bucket = Math.floor(t / bucketSize) * bucketSize;
      const label = `${bucket}-${bucket + bucketSize}초`;
      buckets[label] = (buckets[label] || 0) + 1;
    });
    return Object.entries(buckets)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => parseInt(a.label) - parseInt(b.label));
  };

  results.dwellTimeDistribution = createDistribution(results.dwellTimes, 5);
  results.completionTimeHist = createDistribution(results.completionTimeDistribution, 5);

  // 망설임 구간 분석 (어떤 동작 후에 오래 머물렀나)
  const hesitationByAction = {};
  results.actionIntervals.forEach(({ from, interval }) => {
    if (!hesitationByAction[from]) {
      hesitationByAction[from] = { total: 0, count: 0 };
    }
    hesitationByAction[from].total += interval;
    hesitationByAction[from].count += 1;
  });

  results.hesitationByAction = Object.entries(hesitationByAction)
    .map(([action, data]) => ({
      action,
      avgTime: (data.total / data.count).toFixed(1),
      count: data.count,
    }))
    .sort((a, b) => parseFloat(b.avgTime) - parseFloat(a.avgTime))
    .slice(0, 5); // 상위 5개

  return results;
}

// 히트맵 데이터 계산
function computeHeatmapData(data, mission) {
  const validRows = data.filter(r => r['사용자ID']);

  // 미션별 버튼 위치 정의
  const buttonLayouts = {
    'edit1-1': {
      type: 'standard',
      buttons: [
        { id: '영상추가', label: '영상 추가', row: 0 },
        { id: '재생', label: '재생', row: 1 },
        { id: '일시정지', label: '일시정지', row: 1 },
      ],
    },
    'edit2-1': {
      type: 'timeline',
      buttons: [
        { id: '컷1', label: '1' },
        { id: '컷2', label: '2' },
        { id: '컷3', label: '3' },
        { id: '컷4', label: '4' },
        { id: '컷5', label: '5' },
        { id: '컷6', label: '6' },
      ],
    },
    'edit6-1': {
      type: 'standard',
      buttons: [
        { id: '영상추가', label: '영상 추가', row: 0 },
        { id: 'AI자막추천', label: 'AI 자막 추천', row: 1 },
        { id: 'AI추천1', label: 'AI 추천 1', row: 2 },
        { id: 'AI추천2', label: 'AI 추천 2', row: 2 },
        { id: 'AI추천3', label: 'AI 추천 3', row: 2 },
        { id: '완료', label: '완료', row: 3 },
      ],
    },
    'plan1-1': {
      type: 'cuts',
      aButtons: [
        { id: 'cut1', label: '컷1', title: '디테일 포인트' },
        { id: 'cut2', label: '컷2', title: '사용 장면 컷' },
        { id: 'cut3', label: '컷3', title: '제품 소개 컷' },
        { id: 'cut4', label: '컷4', title: '비포/애프터' },
        { id: 'cut5', label: '컷5', title: '후기/리뷰 컷' },
        { id: 'cut6', label: '컷6', title: '마무리 장면' },
      ],
      bButtons: [
        { id: 'cut1', label: '1', title: '인트로(첫 장면)' },
        { id: 'cut2', label: '2-5', title: '본문(중간 장면)' },
        { id: 'cut3', label: '6', title: '마무리 장면' },
      ],
    },
  };

  const layout = buttonLayouts[mission.id];
  if (!layout) return null;

  // 버튼 클릭 수 집계
  const clickCounts = {};

  validRows.forEach(r => {
    if (r['이벤트'] !== '버튼 클릭') return;
    if (!r['화면']?.includes(mission.screenPrefix)) return;

    const target = r['대상'];
    if (!target) return;

    // 기획 1-1의 경우 cut_select에서 cutId 추출
    if (mission.id === 'plan1-1' && target === 'cut_select') {
      try {
        const value = JSON.parse(r['값'] || '{}');
        const cutKey = `cut${value.cutId}`;
        const screenType = r['화면']?.includes('A') ? 'a' : 'b';
        const key = `${screenType}_${cutKey}`;
        clickCounts[key] = (clickCounts[key] || 0) + 1;
      } catch (e) {}
    } else {
      clickCounts[target] = (clickCounts[target] || 0) + 1;
    }
  });

  // 최대 클릭 수 계산 (히트 레벨 계산용)
  const maxClicks = Math.max(...Object.values(clickCounts), 1);

  // 히트 레벨 계산 (0-5)
  const getHeatLevel = (count) => {
    if (!count || count === 0) return 0;
    const ratio = count / maxClicks;
    if (ratio >= 0.8) return 5;
    if (ratio >= 0.6) return 4;
    if (ratio >= 0.4) return 3;
    if (ratio >= 0.2) return 2;
    return 1;
  };

  return {
    layout,
    clickCounts,
    maxClicks,
    getHeatLevel,
  };
}

// 히트맵 컴포넌트
function HeatmapVisualization({ data, mission }) {
  if (!data) return null;
  const { layout, clickCounts, getHeatLevel } = data;

  // 편집 2-1 타임라인 스타일
  if (layout.type === 'timeline') {
    return (
      <div className="da-heatmap-container">
        <div className="da-heatmap-screen">
          <div className="da-heatmap-screen-header">
            <span className="da-heatmap-screen-title">📍 {mission.name} 버튼 클릭 히트맵</span>
          </div>
          <div className="da-heatmap-preview-area">
            <span className="da-heatmap-preview-text">영상 미리보기 영역</span>
          </div>
          <div className="da-heatmap-timeline">
            {layout.buttons.map(btn => {
              const count = clickCounts[btn.id] || 0;
              const heatLevel = getHeatLevel(count);
              return (
                <div
                  key={btn.id}
                  className={`da-heatmap-timeline-item heat-${heatLevel}`}
                  title={`${btn.id}: ${count}회 클릭`}
                >
                  {btn.label}
                  {count > 0 && <span className="count">{count}</span>}
                </div>
              );
            })}
          </div>
        </div>
        <HeatmapLegend />
      </div>
    );
  }

  // 기획 1-1 컷 리스트 스타일 (세로 1열)
  if (layout.type === 'cuts') {
    return (
      <div className="da-heatmap-container">
        {/* A안 */}
        <div className="da-heatmap-screen" style={{ marginBottom: 12 }}>
          <div className="da-heatmap-screen-header">
            <span className="da-heatmap-screen-title">📍 A안 (6컷) 클릭 히트맵</span>
          </div>
          <div className="da-heatmap-cuts-list">
            {layout.aButtons.map(btn => {
              const count = clickCounts[`a_${btn.id}`] || 0;
              const heatLevel = getHeatLevel(count);
              return (
                <div
                  key={btn.id}
                  className={`da-heatmap-cut-item heat-${heatLevel}`}
                  title={`${btn.label}: ${count}회 클릭`}
                >
                  <span className="cut-label">{btn.label}</span>
                  <span className="cut-title">{btn.title}</span>
                  <span className="click-count">{count}회</span>
                </div>
              );
            })}
          </div>
          <div className="da-heatmap-btn-row">
            <div
              className={`da-heatmap-btn heat-${getHeatLevel(clickCounts['저장하기'] || 0)}`}
              title={`저장하기: ${clickCounts['저장하기'] || 0}회 클릭`}
            >
              저장하기
              {(clickCounts['저장하기'] || 0) > 0 && (
                <span className="da-heatmap-btn-count">{clickCounts['저장하기']}</span>
              )}
            </div>
          </div>
        </div>

        {/* B안 */}
        <div className="da-heatmap-screen">
          <div className="da-heatmap-screen-header">
            <span className="da-heatmap-screen-title">📍 B안 (3컷) 클릭 히트맵</span>
          </div>
          <div className="da-heatmap-cuts-list">
            {layout.bButtons.map(btn => {
              const count = clickCounts[`b_${btn.id}`] || 0;
              const heatLevel = getHeatLevel(count);
              return (
                <div
                  key={btn.id}
                  className={`da-heatmap-cut-item heat-${heatLevel}`}
                  title={`${btn.label}: ${count}회 클릭`}
                >
                  <span className="cut-label">{btn.label}</span>
                  <span className="cut-title">{btn.title}</span>
                  <span className="click-count">{count}회</span>
                </div>
              );
            })}
          </div>
          <div className="da-heatmap-btn-row">
            <div
              className={`da-heatmap-btn heat-${getHeatLevel(clickCounts['저장하기'] || 0)}`}
            >
              저장하기
            </div>
          </div>
        </div>
        <HeatmapLegend />
      </div>
    );
  }

  // 일반 버튼 레이아웃 (편집 1-1, 편집 6-1)
  const rowGroups = {};
  layout.buttons.forEach(btn => {
    const row = btn.row || 0;
    if (!rowGroups[row]) rowGroups[row] = [];
    rowGroups[row].push(btn);
  });

  return (
    <div className="da-heatmap-container">
      <div className="da-heatmap-screen">
        <div className="da-heatmap-screen-header">
          <span className="da-heatmap-screen-title">📍 {mission.name} 버튼 클릭 히트맵</span>
        </div>
        <div className="da-heatmap-preview-area">
          <span className="da-heatmap-preview-text">영상 미리보기 영역</span>
        </div>
        <div className="da-heatmap-buttons">
          {Object.keys(rowGroups).sort().map(row => (
            <div key={row} className="da-heatmap-btn-row">
              {rowGroups[row].map(btn => {
                const count = clickCounts[btn.id] || 0;
                const heatLevel = getHeatLevel(count);
                return (
                  <div
                    key={btn.id}
                    className={`da-heatmap-btn heat-${heatLevel}`}
                    title={`${btn.label}: ${count}회 클릭`}
                  >
                    {btn.label}
                    {count > 0 && <span className="da-heatmap-btn-count">{count}</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <HeatmapLegend />
    </div>
  );
}

// 히트맵 범례 컴포넌트
function HeatmapLegend() {
  return (
    <div className="da-heatmap-legend">
      <span className="da-heatmap-legend-label">적음</span>
      <div className="da-heatmap-legend-bar">
        <div className="da-heatmap-legend-item l0" />
        <div className="da-heatmap-legend-item l1" />
        <div className="da-heatmap-legend-item l2" />
        <div className="da-heatmap-legend-item l3" />
        <div className="da-heatmap-legend-item l4" />
        <div className="da-heatmap-legend-item l5" />
      </div>
      <span className="da-heatmap-legend-label">많음</span>
    </div>
  );
}

// 퍼널 분석 계산
function computeFunnelAnalysis(data, mission) {
  if (!mission.funnelSteps) return null;

  const validRows = data.filter(r => r['사용자ID']);

  // 각 단계별 고유 세션 수 계산
  const funnelData = mission.funnelSteps.map((step, index) => {
    let sessionSet = new Set();

    validRows.forEach(r => {
      const event = r['이벤트']?.trim();
      const screen = r['화면']?.trim();
      const target = r['대상']?.trim();
      const session = r['사용자ID'];

      // 이벤트 타입 매칭
      if (event !== step.event) return;

      // 화면 매칭 - 정확한 일치 또는 prefix 포함 확인
      if (step.screen) {
        const screenPrefix = step.screen.replace('_화면', '');
        const screenMatches = screen === step.screen || screen?.includes(screenPrefix);
        if (!screenMatches) return;
      }

      // 대상 매칭
      if (step.target && target !== step.target) return;
      if (step.targetPrefix && !target?.startsWith(step.targetPrefix)) return;

      sessionSet.add(session);
    });

    return {
      id: step.id,
      name: step.name,
      sessions: sessionSet.size,
      sessionList: Array.from(sessionSet),
    };
  });

  // 첫 단계 기준 전환율 계산
  const firstStepSessions = funnelData[0]?.sessions || 0;

  const result = funnelData.map((step, index) => {
    const prevStep = index > 0 ? funnelData[index - 1] : null;
    const prevSessions = prevStep?.sessions || firstStepSessions;

    return {
      ...step,
      // 전체 대비 전환율 (첫 단계 기준)
      overallRate: firstStepSessions > 0
        ? ((step.sessions / firstStepSessions) * 100).toFixed(1)
        : '0.0',
      // 이전 단계 대비 전환율
      stepRate: prevSessions > 0
        ? ((step.sessions / prevSessions) * 100).toFixed(1)
        : '0.0',
      // 드롭오프 (이전 단계에서 이탈한 수)
      dropoff: prevStep ? prevStep.sessions - step.sessions : 0,
      dropoffRate: prevStep && prevStep.sessions > 0
        ? (((prevStep.sessions - step.sessions) / prevStep.sessions) * 100).toFixed(1)
        : '0.0',
    };
  });

  // 가장 큰 드롭오프 지점 찾기
  let maxDropoffIndex = -1;
  let maxDropoffRate = 0;
  result.forEach((step, index) => {
    if (index > 0 && parseFloat(step.dropoffRate) > maxDropoffRate) {
      maxDropoffRate = parseFloat(step.dropoffRate);
      maxDropoffIndex = index;
    }
  });

  return {
    steps: result,
    totalSteps: result.length,
    firstStepSessions,
    lastStepSessions: result[result.length - 1]?.sessions || 0,
    overallConversion: firstStepSessions > 0
      ? ((result[result.length - 1]?.sessions / firstStepSessions) * 100).toFixed(1)
      : '0.0',
    maxDropoffStep: maxDropoffIndex >= 0 ? result[maxDropoffIndex] : null,
    maxDropoffPrevStep: maxDropoffIndex > 0 ? result[maxDropoffIndex - 1] : null,
  };
}

// 전체 요약 통계
function computeOverallStats(data) {
  const validRows = data.filter(r => r['사용자ID']);
  const sessions = new Set(validRows.map(r => r['사용자ID']));

  const deviceCounts = { mobile: 0, desktop: 0, tablet: 0 };
  const sessionDevices = {};

  validRows.forEach(r => {
    const session = r['사용자ID'];
    const device = r['디바이스'] || 'desktop';
    if (!sessionDevices[session]) {
      sessionDevices[session] = device;
    }
  });

  Object.values(sessionDevices).forEach(device => {
    if (deviceCounts[device] !== undefined) {
      deviceCounts[device]++;
    }
  });

  return {
    totalSessions: sessions.size,
    totalEvents: validRows.length,
    deviceCounts,
  };
}

function formatMs(ms) {
  if (ms == null) return '-';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}초`;
}

function DataAnalysis({ onBack }) {
  const [csvData, setCsvData] = useState(null);
  const [selectedMission, setSelectedMission] = useState(null);
  const [selectedItems, setSelectedItems] = useState({});
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    logScreenView('data_analysis');
  }, []);

  // 미션 선택 시 기본 분석 항목 선택
  useEffect(() => {
    if (selectedMission) {
      const mission = MISSIONS[selectedMission];
      const defaultItems = {};
      mission.analysisItems.forEach(item => {
        defaultItems[item] = true;
      });
      setSelectedItems(defaultItems);
    }
  }, [selectedMission]);

  const handleBack = () => {
    logButtonClick('data_analysis', 'back');
    onBack();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const parsed = parseCSV(text);
      setCsvData(parsed);
      setSelectedMission(null);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const toggleItem = (itemId) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  // 전체 통계
  const overallStats = useMemo(() => {
    if (!csvData) return null;
    return computeOverallStats(csvData);
  }, [csvData]);

  // 미션별 기본 통계
  const missionStatsMap = useMemo(() => {
    if (!csvData) return {};
    const stats = {};
    Object.values(MISSIONS).forEach(mission => {
      stats[mission.id] = computeMissionStats(csvData, mission);
    });
    return stats;
  }, [csvData]);

  // 선택된 미션의 상세 분석
  const selectedMissionAnalysis = useMemo(() => {
    if (!csvData || !selectedMission) return null;

    const mission = MISSIONS[selectedMission];
    const stats = missionStatsMap[selectedMission];

    return {
      stats,
      funnel: computeFunnelAnalysis(csvData, mission),
      firstTrySuccess: computeFirstTrySuccess(csvData, mission),
      wrongPattern: computeWrongPattern(csvData, mission),
      buttonClicks: computeButtonClicks(csvData, mission),
      heatmap: computeHeatmapData(csvData, mission),
      timeAnalysis: computeTimeAnalysis(csvData, mission),
      abComparison: computeABComparison(csvData, mission),
      aiUsage: computeAIUsage(csvData, mission),
    };
  }, [csvData, selectedMission, missionStatsMap]);

  const currentMission = selectedMission ? MISSIONS[selectedMission] : null;

  return (
    <div className="da-container">
      <div className="da-header">
        <button className="da-back-btn" onClick={handleBack}>‹</button>
        <span className="da-title">데이터 분석</span>
      </div>

      <div className="da-content">
        {/* CSV 업로드 영역 */}
        <div className="da-upload-section">
          <h3 className="da-section-title">미션별 데이터 분석</h3>
          <p className="da-section-desc">CSV 파일을 업로드하여 미션별 사용자 행동을 분석합니다.</p>
          <label className="da-upload-btn">
            CSV 파일 선택
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </label>
          {fileName && <span className="da-file-name">{fileName}</span>}
        </div>

        {csvData && overallStats && (
          <>
            {/* 전체 요약 */}
            <div className="da-cards-row">
              <div className="da-card">
                <div className="da-card-label">총 세션</div>
                <div className="da-card-value">{overallStats.totalSessions}</div>
              </div>
              <div className="da-card">
                <div className="da-card-label">총 이벤트</div>
                <div className="da-card-value">{overallStats.totalEvents}</div>
              </div>
              <div className="da-card">
                <div className="da-card-label">PC</div>
                <div className="da-card-value">{overallStats.deviceCounts.desktop}</div>
              </div>
              <div className="da-card">
                <div className="da-card-label">모바일</div>
                <div className="da-card-value">{overallStats.deviceCounts.mobile}</div>
              </div>
            </div>

            {/* 미션 선택 카드 */}
            <div className="da-sub-title">미션 선택</div>
            <div className="da-mission-cards">
              {Object.values(MISSIONS).map(mission => {
                const stats = missionStatsMap[mission.id];
                const isSelected = selectedMission === mission.id;

                return (
                  <div
                    key={mission.id}
                    className={`da-mission-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedMission(mission.id)}
                  >
                    <div className="da-mission-card-header">
                      <span className="da-mission-card-name">{mission.name}</span>
                      {isSelected && <span className="da-mission-card-check">✓</span>}
                    </div>
                    <div className="da-mission-card-desc">{mission.description}</div>
                    <div className="da-mission-card-stats">
                      <div className="da-mission-card-stat">
                        <span className="da-mission-card-stat-icon">👤</span>
                        <span>{stats?.sessions || 0}명</span>
                      </div>
                      <div className="da-mission-card-stat">
                        <span className="da-mission-card-stat-icon">📱</span>
                        <span>{stats?.deviceSessions?.mobile || 0}</span>
                      </div>
                      <div className="da-mission-card-stat">
                        <span className="da-mission-card-stat-icon">💻</span>
                        <span>{stats?.deviceSessions?.desktop || 0}</span>
                      </div>
                    </div>
                    <div className="da-mission-card-rate">
                      {mission.isABTest ? (
                        <>A {stats?.aCompletionRate || 0}% / B {stats?.bCompletionRate || 0}%</>
                      ) : mission.additionalMissionStart ? (
                        <>기본 {stats?.basicCompletionRate || 0}% / 추가 {stats?.additionalCompletionRate || 0}%</>
                      ) : (
                        <>완료율 {stats?.completionRate || 0}%</>
                      )}
                    </div>
                    <div className="da-mission-card-bar">
                      <div
                        className="da-mission-card-bar-fill"
                        style={{
                          width: `${mission.isABTest
                            ? stats?.bCompletionRate
                            : mission.additionalMissionStart
                              ? stats?.additionalCompletionRate
                              : stats?.completionRate || 0}%`
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 분석 항목 선택 */}
            {selectedMission && currentMission && (
              <>
                <div className="da-sub-title" style={{ marginTop: 20 }}>분석 항목 선택</div>
                <div className="da-analysis-items">
                  {currentMission.analysisItems.map(itemId => {
                    const item = ANALYSIS_ITEMS[itemId];
                    return (
                      <button
                        key={itemId}
                        className={`da-analysis-item ${selectedItems[itemId] ? 'selected' : ''}`}
                        onClick={() => toggleItem(itemId)}
                      >
                        <span className="da-analysis-item-check">
                          {selectedItems[itemId] ? '✅' : '☐'}
                        </span>
                        <span className="da-analysis-item-name">{item.name}</span>
                      </button>
                    );
                  })}
                </div>

                {/* 분석 결과 */}
                <div className="da-sub-title" style={{ marginTop: 20 }}>
                  📈 분석 결과: {currentMission.name}
                </div>
                <div className="da-results">
                  <div className="da-result-header">
                    {currentMission.isABTest ? '📝' : '🎬'} {currentMission.description}
                  </div>

                  {/* 퍼널 분석 */}
                  {selectedItems.funnel && selectedMissionAnalysis?.funnel && (
                    <div className="da-result-section">
                      <div className="da-result-section-title">▸ 사용자 흐름 (퍼널)</div>
                      <div className="da-result-section-content">
                        {/* 전체 전환율 요약 */}
                        <div className="da-funnel-summary">
                          <span className="da-funnel-summary-label">전체 전환율:</span>
                          <span className="da-funnel-summary-value">
                            {selectedMissionAnalysis.funnel.overallConversion}%
                          </span>
                          <span className="da-funnel-summary-detail">
                            ({selectedMissionAnalysis.funnel.lastStepSessions}/{selectedMissionAnalysis.funnel.firstStepSessions}명 완료)
                          </span>
                        </div>

                        {/* 퍼널 바 시각화 */}
                        <div className="da-funnel-bars">
                          {selectedMissionAnalysis.funnel.steps.map((step, index) => (
                            <div key={step.id} className="da-funnel-step">
                              <span className="da-funnel-label">{step.name}</span>
                              <div className="da-funnel-bar-bg">
                                <div
                                  className="da-funnel-bar-fill"
                                  style={{ width: `${step.overallRate}%` }}
                                />
                              </div>
                              <span className="da-funnel-pct">
                                {step.sessions}명
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* 단계별 드롭오프 */}
                        <div className="da-funnel-dropoff">
                          <div className="da-funnel-dropoff-title">단계별 이탈률</div>
                          {selectedMissionAnalysis.funnel.steps.slice(1).map((step, index) => {
                            const prevStep = selectedMissionAnalysis.funnel.steps[index];
                            const isMaxDropoff = selectedMissionAnalysis.funnel.maxDropoffStep?.id === step.id;
                            return (
                              <div
                                key={step.id}
                                className={`da-funnel-dropoff-item ${isMaxDropoff ? 'warning' : ''}`}
                              >
                                <span className="da-funnel-dropoff-label">
                                  {prevStep.name} → {step.name}
                                </span>
                                <span className={`da-funnel-dropoff-value ${parseFloat(step.dropoffRate) > 20 ? 'high' : ''}`}>
                                  {step.dropoff > 0 ? `-${step.dropoff}명` : '0명'}
                                  {step.dropoff > 0 && ` (${step.dropoffRate}%)`}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* 병목 지점 알림 */}
                        {selectedMissionAnalysis.funnel.maxDropoffStep && parseFloat(selectedMissionAnalysis.funnel.maxDropoffStep.dropoffRate) > 10 && (
                          <div className="da-funnel-insight">
                            <span className="da-funnel-insight-icon">⚠️</span>
                            <span className="da-funnel-insight-text">
                              <strong>{selectedMissionAnalysis.funnel.maxDropoffPrevStep?.name}</strong> →{' '}
                              <strong>{selectedMissionAnalysis.funnel.maxDropoffStep?.name}</strong> 단계에서{' '}
                              {selectedMissionAnalysis.funnel.maxDropoffStep?.dropoffRate}% 이탈 발생
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 참여 현황 */}
                  {selectedItems.deviceStats && selectedMissionAnalysis?.stats && (
                    <div className="da-result-section">
                      <div className="da-result-section-title">▸ 참여 현황</div>
                      <div className="da-result-section-content">
                        세션 수: {selectedMissionAnalysis.stats.sessions}명 |
                        PC: {selectedMissionAnalysis.stats.deviceSessions?.desktop || 0}명 |
                        모바일: {selectedMissionAnalysis.stats.deviceSessions?.mobile || 0}명
                      </div>
                    </div>
                  )}

                  {/* 완료율 */}
                  {selectedItems.completionRate && selectedMissionAnalysis?.stats && (
                    <div className="da-result-section">
                      <div className="da-result-section-title">▸ 미션 완료율</div>
                      {currentMission.isABTest ? (
                        <div className="da-result-ab-compare">
                          <div className="da-result-ab-item">
                            <div className="da-result-ab-label">A안 (6컷)</div>
                            <div className="da-result-ab-value">{selectedMissionAnalysis.stats.aCompletionRate}%</div>
                            <div className="da-result-ab-detail">
                              ({selectedMissionAnalysis.stats.aCompletes}/{selectedMissionAnalysis.stats.aStarts} 완료)
                            </div>
                            <div className="da-progress-bar">
                              <div className="da-progress-fill" style={{ width: `${selectedMissionAnalysis.stats.aCompletionRate}%` }} />
                            </div>
                          </div>
                          <div className="da-result-ab-item">
                            <div className="da-result-ab-label">B안 (3컷)</div>
                            <div className="da-result-ab-value">{selectedMissionAnalysis.stats.bCompletionRate}%</div>
                            <div className="da-result-ab-detail">
                              ({selectedMissionAnalysis.stats.bCompletes}/{selectedMissionAnalysis.stats.bStarts} 완료)
                            </div>
                            <div className="da-progress-bar">
                              <div className="da-progress-fill" style={{ width: `${selectedMissionAnalysis.stats.bCompletionRate}%` }} />
                            </div>
                          </div>
                        </div>
                      ) : currentMission.additionalMissionStart ? (
                        <div className="da-result-ab-compare">
                          <div className="da-result-ab-item">
                            <div className="da-result-ab-label">기본 미션</div>
                            <div className="da-result-ab-value">{selectedMissionAnalysis.stats.basicCompletionRate}%</div>
                            <div className="da-result-ab-detail">
                              ({selectedMissionAnalysis.stats.basicCompletes}/{selectedMissionAnalysis.stats.basicStarts})
                            </div>
                            <div className="da-progress-bar">
                              <div className="da-progress-fill" style={{ width: `${selectedMissionAnalysis.stats.basicCompletionRate}%` }} />
                            </div>
                          </div>
                          <div className="da-result-ab-item">
                            <div className="da-result-ab-label">추가 미션</div>
                            <div className="da-result-ab-value">{selectedMissionAnalysis.stats.additionalCompletionRate}%</div>
                            <div className="da-result-ab-detail">
                              ({selectedMissionAnalysis.stats.additionalCompletes}/{selectedMissionAnalysis.stats.additionalStarts})
                            </div>
                            <div className="da-progress-bar">
                              <div className="da-progress-fill" style={{ width: `${selectedMissionAnalysis.stats.additionalCompletionRate}%` }} />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="da-result-section-content">
                          <div className="da-progress-bar large">
                            <div className="da-progress-fill" style={{ width: `${selectedMissionAnalysis.stats.completionRate}%` }} />
                          </div>
                          <div className="da-result-rate">
                            {selectedMissionAnalysis.stats.completionRate}%
                            ({selectedMissionAnalysis.stats.completes}/{selectedMissionAnalysis.stats.starts} 완료)
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 소요 시간 */}
                  {selectedItems.avgTime && selectedMissionAnalysis?.stats && (
                    <div className="da-result-section">
                      <div className="da-result-section-title">▸ 평균 소요 시간</div>
                      {currentMission.isABTest && selectedMissionAnalysis.abComparison ? (
                        <div className="da-result-ab-compare">
                          <div className="da-result-ab-item">
                            <div className="da-result-ab-label">A안</div>
                            <div className="da-result-ab-value">{selectedMissionAnalysis.abComparison.a.avgTime || '-'}초</div>
                          </div>
                          <div className="da-result-ab-item">
                            <div className="da-result-ab-label">B안</div>
                            <div className="da-result-ab-value">{selectedMissionAnalysis.abComparison.b.avgTime || '-'}초</div>
                          </div>
                        </div>
                      ) : (
                        <div className="da-result-section-content">
                          <span className="da-result-time">{selectedMissionAnalysis.stats.avgTime || '-'}초</span>
                          {selectedMissionAnalysis.stats.minTime && (
                            <span className="da-result-time-detail">
                              (최소: {selectedMissionAnalysis.stats.minTime}초 / 최대: {selectedMissionAnalysis.stats.maxTime}초)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 시간 분석 */}
                  {selectedItems.timeAnalysis && selectedMissionAnalysis?.timeAnalysis && (
                    <div className="da-result-section">
                      <div className="da-result-section-title">▸ 시간 분석</div>
                      <div className="da-result-section-content">
                        {/* 주요 시간 지표 */}
                        <div className="da-time-metrics">
                          <div className="da-time-metric-item">
                            <span className="da-time-metric-label">평균 체류시간</span>
                            <span className="da-time-metric-value">
                              {selectedMissionAnalysis.timeAnalysis.avgDwellTime || '-'}초
                            </span>
                          </div>
                          <div className="da-time-metric-item">
                            <span className="da-time-metric-label">첫 인터랙션</span>
                            <span className="da-time-metric-value">
                              {selectedMissionAnalysis.timeAnalysis.avgFirstInteraction || '-'}초
                            </span>
                          </div>
                          <div className="da-time-metric-item">
                            <span className="da-time-metric-label">동작 간 간격</span>
                            <span className="da-time-metric-value">
                              {selectedMissionAnalysis.timeAnalysis.avgActionInterval || '-'}초
                            </span>
                          </div>
                        </div>

                        {/* 망설임 구간 (어떤 동작 후에 오래 머물렀나) */}
                        {selectedMissionAnalysis.timeAnalysis.hesitationByAction?.length > 0 && (
                          <div className="da-hesitation-section">
                            <div className="da-hesitation-title">🤔 망설임 구간 (동작 후 평균 대기시간)</div>
                            {selectedMissionAnalysis.timeAnalysis.hesitationByAction.map(({ action, avgTime, count }) => (
                              <div key={action} className="da-hesitation-item">
                                <span className="da-hesitation-action">{action}</span>
                                <div className="da-hesitation-bar-bg">
                                  <div
                                    className="da-hesitation-bar-fill"
                                    style={{ width: `${Math.min(parseFloat(avgTime) * 10, 100)}%` }}
                                  />
                                </div>
                                <span className="da-hesitation-time">{avgTime}초</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* 완료 시간 분포 */}
                        {selectedMissionAnalysis.timeAnalysis.completionTimeHist?.length > 0 && (
                          <div className="da-time-distribution">
                            <div className="da-time-dist-title">📊 완료 시간 분포</div>
                            {selectedMissionAnalysis.timeAnalysis.completionTimeHist.map(({ label, count }) => (
                              <div key={label} className="da-time-dist-item">
                                <span className="da-time-dist-label">{label}</span>
                                <div className="da-time-dist-bar-bg">
                                  <div
                                    className="da-time-dist-bar-fill"
                                    style={{
                                      width: `${Math.min(count * 25, 100)}%`
                                    }}
                                  />
                                </div>
                                <span className="da-time-dist-count">{count}명</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 첫 시도 성공률 */}
                  {selectedItems.firstTrySuccess && selectedMissionAnalysis?.firstTrySuccess && (
                    <div className="da-result-section">
                      <div className="da-result-section-title">▸ 첫 시도 성공률</div>
                      <div className="da-result-section-content">
                        <div className="da-progress-bar large">
                          <div className="da-progress-fill" style={{ width: `${selectedMissionAnalysis.firstTrySuccess.rate}%` }} />
                        </div>
                        <div className="da-result-rate">
                          {selectedMissionAnalysis.firstTrySuccess.rate}%
                          ({selectedMissionAnalysis.firstTrySuccess.success}/{selectedMissionAnalysis.firstTrySuccess.total})
                        </div>
                        <div className="da-result-note">
                          {currentMission.id === 'edit1-1' && '(재생 버튼 expected=true)'}
                          {currentMission.id === 'edit2-1' && '(컷4 선택 expected=true)'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 오답 패턴 */}
                  {selectedItems.wrongPattern && selectedMissionAnalysis?.wrongPattern && selectedMissionAnalysis.wrongPattern.length > 0 && (
                    <div className="da-result-section">
                      <div className="da-result-section-title">▸ 오답 패턴 (잘못 선택한 컷)</div>
                      <div className="da-result-section-content">
                        {selectedMissionAnalysis.wrongPattern.map(({ cut, count }) => (
                          <div key={cut} className="da-result-bar-item">
                            <span className="da-result-bar-label">{cut}</span>
                            <div className="da-result-bar-bg">
                              <div
                                className="da-result-bar-fill wrong"
                                style={{ width: `${Math.min(count * 20, 100)}%` }}
                              />
                            </div>
                            <span className="da-result-bar-count">{count}회</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 버튼 클릭 분포 */}
                  {selectedItems.buttonClicks && selectedMissionAnalysis?.buttonClicks && (
                    <div className="da-result-section">
                      <div className="da-result-section-title">▸ 버튼 클릭 분포</div>
                      <div className="da-result-section-content">
                        {selectedMissionAnalysis.buttonClicks.slice(0, 10).map(({ name, count }) => (
                          <div key={name} className="da-result-bar-item">
                            <span className="da-result-bar-label">{name}</span>
                            <div className="da-result-bar-bg">
                              <div
                                className="da-result-bar-fill"
                                style={{
                                  width: `${Math.min((count / (selectedMissionAnalysis.buttonClicks[0]?.count || 1)) * 100, 100)}%`
                                }}
                              />
                            </div>
                            <span className="da-result-bar-count">{count}회</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 히트맵 */}
                  {selectedItems.heatmap && selectedMissionAnalysis?.heatmap && (
                    <div className="da-result-section">
                      <div className="da-result-section-title">▸ 버튼 클릭 히트맵</div>
                      <HeatmapVisualization
                        data={selectedMissionAnalysis.heatmap}
                        mission={currentMission}
                      />
                    </div>
                  )}

                  {/* AI 사용률 (편집 6-1) */}
                  {selectedItems.aiUsage && selectedMissionAnalysis?.aiUsage && (
                    <div className="da-result-section">
                      <div className="da-result-section-title">▸ AI 자막 사용 현황</div>
                      <div className="da-result-section-content">
                        <div className="da-result-stat-row">
                          <span>AI자막추천 버튼 클릭:</span>
                          <span className="da-result-stat-value">{selectedMissionAnalysis.aiUsage.aiButtonClicks}회</span>
                        </div>
                        <div className="da-result-stat-row">
                          <span>AI 추천 자막 선택:</span>
                          <span className="da-result-stat-value">{selectedMissionAnalysis.aiUsage.aiRecommendSelections}회</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* A/B 메모 비교 (기획 1-1) */}
                  {selectedItems.memoAnalysis && selectedMissionAnalysis?.abComparison && (
                    <div className="da-result-section">
                      <div className="da-result-section-title">▸ 메모 작성 비교</div>
                      <div className="da-result-ab-compare">
                        <div className="da-result-ab-item">
                          <div className="da-result-ab-label">A안 (6컷)</div>
                          <div className="da-result-memo-stats">
                            <div>작성 컷: {selectedMissionAnalysis.abComparison.a.memoStats.count}/{selectedMissionAnalysis.abComparison.a.memoStats.totalCuts || 6}</div>
                            <div>평균 길이: {selectedMissionAnalysis.abComparison.a.memoStats.avgLength || 0}자</div>
                            <div>총 길이: {selectedMissionAnalysis.abComparison.a.memoStats.totalLength}자</div>
                          </div>
                        </div>
                        <div className="da-result-ab-item">
                          <div className="da-result-ab-label">B안 (3컷)</div>
                          <div className="da-result-memo-stats">
                            <div>작성 컷: {selectedMissionAnalysis.abComparison.b.memoStats.count}/{selectedMissionAnalysis.abComparison.b.memoStats.totalCuts || 3}</div>
                            <div>평균 길이: {selectedMissionAnalysis.abComparison.b.memoStats.avgLength || 0}자</div>
                            <div>총 길이: {selectedMissionAnalysis.abComparison.b.memoStats.totalLength}자</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 컷별 메모 작성 현황 */}
                  {selectedItems.abComparison && selectedMissionAnalysis?.abComparison && (
                    <div className="da-result-section">
                      <div className="da-result-section-title">▸ 컷별 메모 작성 현황</div>
                      <div className="da-result-section-content">
                        <div className="da-result-cut-status">
                          <div className="da-result-cut-label">A안:</div>
                          <div className="da-result-cut-items">
                            {(selectedMissionAnalysis.abComparison.a.memoStats.details || []).map((d, i) => (
                              <span key={i} className={`da-result-cut-item ${d.hasMemo ? 'filled' : ''}`}>
                                컷{d.cutId}{d.hasMemo ? '✅' : '☐'}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="da-result-cut-status">
                          <div className="da-result-cut-label">B안:</div>
                          <div className="da-result-cut-items">
                            {(selectedMissionAnalysis.abComparison.b.memoStats.details || []).map((d, i) => (
                              <span key={i} className={`da-result-cut-item ${d.hasMemo ? 'filled' : ''}`}>
                                {d.cutLabel || `컷${d.cutId}`}{d.hasMemo ? '✅' : '☐'}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {/* CSV 미업로드 상태 */}
        {!csvData && (
          <div className="da-empty">
            <p>CSV 파일을 업로드하면 분석 결과가 표시됩니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default DataAnalysis;
