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
        inQuotes = !inQuotes;
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
    analysisItems: ['completionRate', 'avgTime', 'firstTrySuccess', 'buttonClicks', 'deviceStats'],
  },
  'edit2-1': {
    id: 'edit2-1',
    name: '편집 2-1',
    description: '4번째 컷 선택하기',
    screenPrefix: '편집2-1',
    missionStartTarget: '편집2-1_미션시작',
    missionCompleteTarget: '편집2-1_미션완료',
    analysisItems: ['completionRate', 'avgTime', 'firstTrySuccess', 'wrongPattern', 'buttonClicks', 'deviceStats'],
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
    analysisItems: ['completionRate', 'avgTime', 'stageFlow', 'aiUsage', 'buttonClicks', 'deviceStats'],
  },
  'plan1-1': {
    id: 'plan1-1',
    name: '기획 1-1',
    description: '메모 작성 (A/B 비교)',
    screenPrefix: '기획1-1',
    isABTest: true,
    aScreen: '기획1-1A_화면',
    bScreen: '기획1-1B_화면',
    aMissionStart: '기획1-1_A미션시작',
    aMissionComplete: '기획1-1_A미션완료',
    bMissionStart: '기획1-1_B미션시작',
    bMissionComplete: '기획1-1_B미션완료',
    analysisItems: ['completionRate', 'avgTime', 'memoAnalysis', 'abComparison', 'buttonClicks', 'deviceStats'],
  },
};

// 분석 항목 정의
const ANALYSIS_ITEMS = {
  completionRate: { id: 'completionRate', name: '완료율', icon: '📊' },
  avgTime: { id: 'avgTime', name: '소요시간', icon: '⏱️' },
  firstTrySuccess: { id: 'firstTrySuccess', name: '첫시도 성공률', icon: '🎯' },
  wrongPattern: { id: 'wrongPattern', name: '오답 패턴', icon: '❌' },
  buttonClicks: { id: 'buttonClicks', name: '버튼 클릭', icon: '👆' },
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
function computeButtonClicks(data, mission) {
  const validRows = data.filter(r => r['사용자ID']);
  const screenName = `${mission.screenPrefix}_화면`;

  const buttonClicks = {};

  validRows.forEach(r => {
    if (!r['화면']?.includes(mission.screenPrefix) || r['이벤트'] !== '버튼 클릭') return;

    const target = r['대상'];
    if (target) {
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
      firstTrySuccess: computeFirstTrySuccess(csvData, mission),
      wrongPattern: computeWrongPattern(csvData, mission),
      buttonClicks: computeButtonClicks(csvData, mission),
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
