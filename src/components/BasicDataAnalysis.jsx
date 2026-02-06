import { useState, useMemo, useRef } from 'react';
import './BasicDataAnalysis.css';

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
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
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
  },
  'edit2-1': {
    id: 'edit2-1',
    name: '편집 2-1',
    description: '4번째 컷 선택하기',
    screenPrefix: '편집2-1',
    missionStartTarget: '편집2-1_미션시작',
    missionCompleteTarget: '편집2-1_미션완료',
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
  },
  'plan1-1': {
    id: 'plan1-1',
    name: '기획 1-1',
    description: '아이디어 메모 (6컷)',
    screenPrefix: '기획1-1',
    missionStartTarget: '기획1-1_미션시작',
    missionCompleteTarget: '기획1-1_미션완료',
  },
  'plan1-2': {
    id: 'plan1-2',
    name: '기획 1-2',
    description: '아이디어 메모 (3컷)',
    screenPrefix: '기획1-2',
    missionStartTarget: '기획1-2_미션시작',
    missionCompleteTarget: '기획1-2_미션완료',
  },
};

// 미션별 통계 계산 (고유 사용자 기준)
function computeMissionStats(data, mission) {
  const validRows = data.filter(r => r['사용자ID']);

  // 해당 미션 관련 로우만 필터링
  const missionRows = validRows.filter(r =>
    r['화면']?.includes(mission.screenPrefix) ||
    r['대상']?.includes(mission.screenPrefix)
  );

  // 세션 수 (화면에 진입한 고유 사용자)
  const sessions = new Set(missionRows.map(r => r['사용자ID']));

  // 전체 데이터에서 사용자별 디바이스 정보 수집 (세션에 해당하는 사용자만)
  const userDeviceMap = new Map();
  validRows.forEach(r => {
    const userId = r['사용자ID'];
    const device = r['디바이스'] || '';
    // 이 미션의 세션에 해당하는 사용자이고, 아직 디바이스 정보가 없으면 저장
    if (sessions.has(userId) && !userDeviceMap.has(userId) && device) {
      userDeviceMap.set(userId, device);
    }
  });

  // 디바이스별 사용자 수
  let desktopUsers = 0;
  let mobileUsers = 0;
  userDeviceMap.forEach((device) => {
    if (device === 'desktop') desktopUsers++;
    else if (device === 'mobile') mobileUsers++;
  });

  // 디바이스 정보가 없는 사용자 수
  const unknownDeviceUsers = sessions.size - desktopUsers - mobileUsers;

  // 미션 시작한 고유 사용자
  const startedUsers = new Set();
  validRows.forEach(r => {
    if (r['이벤트'] === '미션 시작' && r['대상'] === mission.missionStartTarget) {
      startedUsers.add(r['사용자ID']);
    }
  });

  // 미션 완료한 고유 사용자 (세션별 첫 번째 완료 시간만 기록)
  const completedUsers = new Set();
  const completionTimesByUser = new Map(); // 사용자별 첫 완료 시간
  validRows.forEach(r => {
    if (r['이벤트'] === '미션 완료' && r['대상'] === mission.missionCompleteTarget) {
      const userId = r['사용자ID'];
      completedUsers.add(userId);
      // 첫 번째 완료 시간만 기록 (이후 중복은 무시)
      if (!completionTimesByUser.has(userId)) {
        const match = r['값']?.match(/완료시간:(\d+\.?\d*)초/);
        if (match) {
          completionTimesByUser.set(userId, parseFloat(match[1]));
        }
      }
    }
  });
  const completionTimes = Array.from(completionTimesByUser.values());

  const sessionCount = sessions.size;
  const startedCount = startedUsers.size;
  const completedCount = completedUsers.size;
  const notStartedCount = sessionCount - startedCount;
  const notCompletedCount = startedCount - completedCount;

  // 2단계 미션 (편집 6-1)
  if (mission.additionalMissionStart) {
    const basicStartedUsers = new Set();
    const basicCompletedUsers = new Set();
    const additionalStartedUsers = new Set();
    const additionalCompletedUsers = new Set();
    const basicCompletionTimesByUser = new Map(); // 기본 미션 완료 시간
    const additionalCompletionTimesByUser = new Map(); // 추가 미션 완료 시간

    validRows.forEach(r => {
      const userId = r['사용자ID'];
      if (r['이벤트'] === '미션 시작' && r['대상'] === mission.missionStartTarget) {
        basicStartedUsers.add(userId);
      }
      if (r['이벤트'] === '미션 완료' && r['대상'] === mission.missionCompleteTarget) {
        basicCompletedUsers.add(userId);
        if (!basicCompletionTimesByUser.has(userId)) {
          const match = r['값']?.match(/완료시간:(\d+\.?\d*)초/);
          if (match) {
            basicCompletionTimesByUser.set(userId, parseFloat(match[1]));
          }
        }
      }
      if (r['이벤트'] === '미션 시작' && r['대상'] === mission.additionalMissionStart) {
        additionalStartedUsers.add(userId);
      }
      if (r['이벤트'] === '미션 완료' && r['대상'] === mission.additionalMissionComplete) {
        additionalCompletedUsers.add(userId);
        if (!additionalCompletionTimesByUser.has(userId)) {
          const match = r['값']?.match(/완료시간:(\d+\.?\d*)초/);
          if (match) {
            additionalCompletionTimesByUser.set(userId, parseFloat(match[1]));
          }
        }
      }
    });
    const basicCompletionTimes = Array.from(basicCompletionTimesByUser.values());
    const additionalCompletionTimes = Array.from(additionalCompletionTimesByUser.values());

    // 이탈 계산
    const basicNotStarted = sessionCount - basicStartedUsers.size;
    const basicNotCompleted = basicStartedUsers.size - basicCompletedUsers.size;
    const additionalNotStarted = basicCompletedUsers.size - additionalStartedUsers.size; // 기본 완료 후 추가 미시작
    const additionalNotCompleted = additionalStartedUsers.size - additionalCompletedUsers.size;

    return {
      sessions: sessionCount,
      desktopUsers,
      mobileUsers,
      unknownDeviceUsers,
      started: basicStartedUsers.size,
      completed: basicCompletedUsers.size,
      notStarted: basicNotStarted,
      notCompleted: basicNotCompleted,
      basicStarted: basicStartedUsers.size,
      basicCompleted: basicCompletedUsers.size,
      basicNotStarted,
      basicNotCompleted,
      additionalStarted: additionalStartedUsers.size,
      additionalCompleted: additionalCompletedUsers.size,
      additionalNotStarted,
      additionalNotCompleted,
      participationRate: sessionCount > 0 ? ((basicStartedUsers.size / sessionCount) * 100).toFixed(1) : '0.0',
      basicCompletionRate: basicStartedUsers.size > 0 ? ((basicCompletedUsers.size / basicStartedUsers.size) * 100).toFixed(1) : '0.0',
      additionalParticipationRate: basicCompletedUsers.size > 0 ? ((additionalStartedUsers.size / basicCompletedUsers.size) * 100).toFixed(1) : '0.0',
      additionalCompletionRate: additionalStartedUsers.size > 0 ? ((additionalCompletedUsers.size / additionalStartedUsers.size) * 100).toFixed(1) : '0.0',
      completionRate: basicStartedUsers.size > 0 ? ((basicCompletedUsers.size / basicStartedUsers.size) * 100).toFixed(1) : '0.0',
      basicCompletionTimes,
      basicAvgTime: basicCompletionTimes.length > 0
        ? (basicCompletionTimes.reduce((a, b) => a + b, 0) / basicCompletionTimes.length).toFixed(1)
        : null,
      completionTimes: additionalCompletionTimes,
      avgTime: additionalCompletionTimes.length > 0
        ? (additionalCompletionTimes.reduce((a, b) => a + b, 0) / additionalCompletionTimes.length).toFixed(1)
        : null,
    };
  } else {
    return {
      sessions: sessionCount,
      desktopUsers,
      mobileUsers,
      unknownDeviceUsers,
      started: startedCount,
      completed: completedCount,
      notStarted: notStartedCount,
      notCompleted: notCompletedCount,
      participationRate: sessionCount > 0 ? ((startedCount / sessionCount) * 100).toFixed(1) : '0.0',
      completionRate: startedCount > 0 ? ((completedCount / startedCount) * 100).toFixed(1) : '0.0',
      completionTimes,
      avgTime: completionTimes.length > 0
        ? (completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length).toFixed(1)
        : null,
      minTime: completionTimes.length > 0 ? Math.min(...completionTimes).toFixed(1) : null,
      maxTime: completionTimes.length > 0 ? Math.max(...completionTimes).toFixed(1) : null,
    };
  }
}

// 전체 요약 통계 (정의된 미션에 참여한 사용자의 합집합)
function computeOverallStats(data) {
  const validRows = data.filter(r => r['사용자ID']);

  // 정의된 미션들의 화면 prefix 목록
  const missionPrefixes = Object.values(MISSIONS).map(m => m.screenPrefix);

  // 1단계: 정의된 미션 화면에 방문한 사용자 수집 (합집합)
  const missionUsers = new Set();
  validRows.forEach(r => {
    const screen = r['화면'] || '';
    const target = r['대상'] || '';
    const isInMission = missionPrefixes.some(prefix =>
      screen.includes(prefix) || target.includes(prefix)
    );
    if (isInMission) {
      missionUsers.add(r['사용자ID']);
    }
  });

  // 2단계: 전체 데이터에서 해당 사용자들의 디바이스 정보 수집
  const userDeviceMap = new Map();
  validRows.forEach(r => {
    const userId = r['사용자ID'];
    const device = r['디바이스'] || '';
    // 미션 참여 사용자이고, 아직 디바이스 정보가 없으면 저장
    if (missionUsers.has(userId) && !userDeviceMap.has(userId) && device) {
      userDeviceMap.set(userId, device);
    }
  });

  // 디바이스별 사용자 수 계산
  let desktopUsers = 0;
  let mobileUsers = 0;
  userDeviceMap.forEach((device) => {
    if (device === 'desktop') desktopUsers++;
    else if (device === 'mobile') mobileUsers++;
  });

  // 디바이스 정보가 없는 사용자 수
  const unknownDeviceUsers = missionUsers.size - desktopUsers - mobileUsers;

  return {
    totalSessions: missionUsers.size,
    totalEvents: validRows.length,
    desktopUsers,
    mobileUsers,
    unknownDeviceUsers,
  };
}

function BasicDataAnalysis({ onBack }) {
  const [csvData, setCsvData] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [fileName, setFileName] = useState('');
  const [showVisualization, setShowVisualization] = useState(false);
  const [viewMode, setViewMode] = useState('mobile'); // 'mobile' | 'pc'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const visualizationRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const parsed = parseCSV(text);
      setCsvData(parsed);
      setActiveTab('summary');
    };
    reader.readAsText(file, 'UTF-8');
  };

  // 전체 통계
  const overallStats = useMemo(() => {
    if (!csvData) return null;
    return computeOverallStats(csvData);
  }, [csvData]);

  // 미션별 통계
  const missionStatsMap = useMemo(() => {
    if (!csvData) return {};
    const stats = {};
    Object.values(MISSIONS).forEach(mission => {
      stats[mission.id] = computeMissionStats(csvData, mission);
    });
    return stats;
  }, [csvData]);

  const currentMission = activeTab !== 'summary' ? MISSIONS[activeTab] : null;
  const currentStats = activeTab !== 'summary' ? missionStatsMap[activeTab] : null;

  // 전체화면 토글
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      visualizationRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // 시각화 화면 렌더링
  if (showVisualization && csvData) {
    return (
      <div
        ref={visualizationRef}
        className={`bda-visualization-container ${viewMode === 'pc' ? 'pc-view' : ''} ${isFullscreen ? 'fullscreen' : ''}`}
      >
        <div className="bda-viz-header">
          <button className="bda-back-btn" onClick={() => setShowVisualization(false)}>&#8249;</button>
          <span className="bda-title">데이터 시각화</span>
          <div className="bda-viz-controls">
            <div className="bda-view-toggle">
              <button
                className={`bda-view-btn ${viewMode === 'mobile' ? 'active' : ''}`}
                onClick={() => setViewMode('mobile')}
                title="모바일 뷰"
              >
                📱
              </button>
              <button
                className={`bda-view-btn ${viewMode === 'pc' ? 'active' : ''}`}
                onClick={() => setViewMode('pc')}
                title="PC 뷰"
              >
                🖥️
              </button>
            </div>
            <button className="bda-fullscreen-btn" onClick={toggleFullscreen} title="전체화면">
              {isFullscreen ? '⛶' : '⛶'}
            </button>
          </div>
        </div>

        <div className="bda-viz-content">
          {/* 1. 미션별 완료율 바 차트 */}
          <div className="bda-viz-section">
            <div className="bda-viz-title">미션별 완료율</div>
            <div className="bda-bar-chart">
              {Object.values(MISSIONS).map(mission => {
                const stats = missionStatsMap[mission.id];
                const rate = parseFloat(stats?.completionRate || 0);
                return (
                  <div key={mission.id} className="bda-bar-item">
                    <div className="bda-bar-label">{mission.name}</div>
                    <div className="bda-bar-track">
                      <div
                        className="bda-bar-fill"
                        style={{ width: `${rate}%` }}
                      >
                        <span className="bda-bar-value">{rate}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. 디바이스 분포 파이 차트 */}
          <div className="bda-viz-section">
            <div className="bda-viz-title">디바이스 분포</div>
            <div className="bda-pie-chart-container">
              <svg className="bda-pie-svg" viewBox="0 0 100 100">
                {(() => {
                  const total = overallStats?.totalSessions || 1;
                  const desktop = overallStats?.desktopUsers || 0;
                  const mobile = overallStats?.mobileUsers || 0;
                  const unknown = overallStats?.unknownDeviceUsers || 0;

                  const desktopPct = (desktop / total) * 100;
                  const mobilePct = (mobile / total) * 100;
                  const unknownPct = (unknown / total) * 100;

                  // SVG 파이 차트 계산
                  const createArc = (startAngle, endAngle, color) => {
                    const start = (startAngle - 90) * Math.PI / 180;
                    const end = (endAngle - 90) * Math.PI / 180;
                    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
                    const x1 = 50 + 40 * Math.cos(start);
                    const y1 = 50 + 40 * Math.sin(start);
                    const x2 = 50 + 40 * Math.cos(end);
                    const y2 = 50 + 40 * Math.sin(end);
                    return (
                      <path
                        key={color}
                        d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                        fill={color}
                      />
                    );
                  };

                  const arcs = [];
                  let currentAngle = 0;

                  if (desktopPct > 0) {
                    arcs.push(createArc(currentAngle, currentAngle + desktopPct * 3.6, '#3b82f6'));
                    currentAngle += desktopPct * 3.6;
                  }
                  if (mobilePct > 0) {
                    arcs.push(createArc(currentAngle, currentAngle + mobilePct * 3.6, '#22c55e'));
                    currentAngle += mobilePct * 3.6;
                  }
                  if (unknownPct > 0) {
                    arcs.push(createArc(currentAngle, currentAngle + unknownPct * 3.6, '#9ca3af'));
                  }

                  return arcs.length > 0 ? arcs : <circle cx="50" cy="50" r="40" fill="#e5e7eb" />;
                })()}
              </svg>
              <div className="bda-pie-legend">
                <div className="bda-legend-item">
                  <span className="bda-legend-color" style={{ background: '#3b82f6' }}></span>
                  <span>PC {overallStats?.desktopUsers || 0}명 ({((overallStats?.desktopUsers || 0) / (overallStats?.totalSessions || 1) * 100).toFixed(1)}%)</span>
                </div>
                <div className="bda-legend-item">
                  <span className="bda-legend-color" style={{ background: '#22c55e' }}></span>
                  <span>모바일 {overallStats?.mobileUsers || 0}명 ({((overallStats?.mobileUsers || 0) / (overallStats?.totalSessions || 1) * 100).toFixed(1)}%)</span>
                </div>
                {(overallStats?.unknownDeviceUsers || 0) > 0 && (
                  <div className="bda-legend-item">
                    <span className="bda-legend-color" style={{ background: '#9ca3af' }}></span>
                    <span>알 수 없음 {overallStats?.unknownDeviceUsers || 0}명 ({((overallStats?.unknownDeviceUsers || 0) / (overallStats?.totalSessions || 1) * 100).toFixed(1)}%)</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. 완료 시간 분포 히스토그램 */}
          <div className="bda-viz-section">
            <div className="bda-viz-title">완료 시간 분포 (전체 미션)</div>
            <div className="bda-histogram">
              {(() => {
                // 모든 미션의 완료 시간 수집
                const allTimes = [];
                Object.values(missionStatsMap).forEach(stats => {
                  if (stats?.completionTimes) {
                    allTimes.push(...stats.completionTimes);
                  }
                  if (stats?.basicCompletionTimes) {
                    allTimes.push(...stats.basicCompletionTimes);
                  }
                });

                if (allTimes.length === 0) {
                  return <div className="bda-empty-chart">완료 시간 데이터가 없습니다.</div>;
                }

                // 10초 단위 버킷
                const bucketSize = 10;
                const buckets = {};
                allTimes.forEach(t => {
                  const bucket = Math.floor(t / bucketSize) * bucketSize;
                  const label = `${bucket}-${bucket + bucketSize}`;
                  buckets[label] = (buckets[label] || 0) + 1;
                });

                const data = Object.entries(buckets)
                  .map(([label, count]) => ({ label, count }))
                  .sort((a, b) => parseInt(a.label) - parseInt(b.label));

                const maxCount = Math.max(...data.map(d => d.count), 1);

                return data.map(({ label, count }) => (
                  <div key={label} className="bda-histogram-bar">
                    <div className="bda-histogram-label">{label}초</div>
                    <div className="bda-histogram-track">
                      <div
                        className="bda-histogram-fill"
                        style={{ height: `${(count / maxCount) * 100}%` }}
                      ></div>
                    </div>
                    <div className="bda-histogram-count">{count}명</div>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* 4. 전체 퍼널 차트 */}
          <div className="bda-viz-section">
            <div className="bda-viz-title">전체 사용자 흐름 (퍼널)</div>
            <div className="bda-funnel-chart">
              {(() => {
                // 전체 미션의 합산 퍼널
                let totalSessions = 0;
                let totalStarted = 0;
                let totalCompleted = 0;

                Object.values(missionStatsMap).forEach(stats => {
                  totalSessions += stats?.sessions || 0;
                  totalStarted += stats?.started || 0;
                  totalCompleted += stats?.completed || 0;
                });

                const maxWidth = 100;
                const sessionWidth = maxWidth;
                const startedWidth = totalSessions > 0 ? (totalStarted / totalSessions) * maxWidth : 0;
                const completedWidth = totalSessions > 0 ? (totalCompleted / totalSessions) * maxWidth : 0;

                return (
                  <>
                    <div className="bda-funnel-step">
                      <div className="bda-funnel-bar-container">
                        <div className="bda-funnel-bar visit" style={{ width: `${sessionWidth}%` }}>
                          화면 방문
                        </div>
                      </div>
                      <div className="bda-funnel-stat">{totalSessions}명 (100%)</div>
                    </div>
                    <div className="bda-funnel-arrow">▼</div>
                    <div className="bda-funnel-step">
                      <div className="bda-funnel-bar-container">
                        <div className="bda-funnel-bar started" style={{ width: `${startedWidth}%` }}>
                          미션 시작
                        </div>
                      </div>
                      <div className="bda-funnel-stat">
                        {totalStarted}명 ({totalSessions > 0 ? ((totalStarted / totalSessions) * 100).toFixed(1) : 0}%)
                      </div>
                    </div>
                    <div className="bda-funnel-arrow">▼</div>
                    <div className="bda-funnel-step">
                      <div className="bda-funnel-bar-container">
                        <div className="bda-funnel-bar completed" style={{ width: `${completedWidth}%` }}>
                          미션 완료
                        </div>
                      </div>
                      <div className="bda-funnel-stat">
                        {totalCompleted}명 ({totalSessions > 0 ? ((totalCompleted / totalSessions) * 100).toFixed(1) : 0}%)
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* 5. 미션별 참여율 vs 완료율 비교 */}
          <div className="bda-viz-section">
            <div className="bda-viz-title">미션별 참여율 vs 완료율</div>
            <div className="bda-grouped-bar-chart">
              {Object.values(MISSIONS).map(mission => {
                const stats = missionStatsMap[mission.id];
                const participationRate = parseFloat(stats?.participationRate || 0);
                const completionRate = parseFloat(stats?.completionRate || 0);
                return (
                  <div key={mission.id} className="bda-grouped-bar-item">
                    <div className="bda-grouped-bar-label">{mission.name}</div>
                    <div className="bda-grouped-bars">
                      <div className="bda-grouped-bar-row">
                        <span className="bda-grouped-bar-type">참여율</span>
                        <div className="bda-grouped-bar-track">
                          <div
                            className="bda-grouped-bar-fill participation"
                            style={{ width: `${participationRate}%` }}
                          ></div>
                        </div>
                        <span className="bda-grouped-bar-value">{participationRate}%</span>
                      </div>
                      <div className="bda-grouped-bar-row">
                        <span className="bda-grouped-bar-type">완료율</span>
                        <div className="bda-grouped-bar-track">
                          <div
                            className="bda-grouped-bar-fill completion"
                            style={{ width: `${completionRate}%` }}
                          ></div>
                        </div>
                        <span className="bda-grouped-bar-value">{completionRate}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bda-container">
      <div className="bda-header">
        <button className="bda-back-btn" onClick={onBack}>&#8249;</button>
        <span className="bda-title">기본 데이터 분석</span>
      </div>

      <div className="bda-content">
        {/* CSV 업로드 */}
        <div className="bda-upload-section">
          <label className="bda-upload-btn">
            CSV 파일 선택
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </label>
          {fileName && <span className="bda-file-name">{fileName}</span>}
          {csvData && (
            <button
              className="bda-viz-btn"
              onClick={() => setShowVisualization(true)}
            >
              데이터 시각화
            </button>
          )}
        </div>

        {csvData && (
          <>
            {/* 탭 네비게이션 */}
            <div className="bda-tabs">
              <button
                className={`bda-tab ${activeTab === 'summary' ? 'active' : ''}`}
                onClick={() => setActiveTab('summary')}
              >
                종합
              </button>
              {Object.values(MISSIONS).map(mission => (
                <button
                  key={mission.id}
                  className={`bda-tab ${activeTab === mission.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(mission.id)}
                >
                  {mission.name}
                </button>
              ))}
            </div>

            {/* 종합 탭 */}
            {activeTab === 'summary' && overallStats && (
              <div className="bda-tab-content">
                {/* 전체 세션 수 */}
                <div className="bda-section">
                  <div className="bda-section-title">전체 세션 수</div>
                  <div className="bda-big-number">{overallStats.totalSessions}<span className="bda-unit">명</span></div>
                  <div className="bda-device-breakdown">
                    <span className="bda-device-item">
                      <span className="bda-device-icon">🖥️</span> PC {overallStats.desktopUsers}명
                    </span>
                    <span className="bda-device-item">
                      <span className="bda-device-icon">📱</span> 모바일 {overallStats.mobileUsers}명
                    </span>
                    {overallStats.unknownDeviceUsers > 0 && (
                      <span className="bda-device-item unknown">
                        <span className="bda-device-icon">❓</span> 알 수 없음 {overallStats.unknownDeviceUsers}명
                      </span>
                    )}
                  </div>
                </div>

                {/* 미션별 참여율/완료율 */}
                <div className="bda-section">
                  <div className="bda-section-title">미션별 참여율 / 완료율</div>
                  <div className="bda-chart-list">
                    {Object.values(MISSIONS).map(mission => {
                      const stats = missionStatsMap[mission.id];
                      return (
                        <div key={mission.id} className="bda-chart-item">
                          <div className="bda-chart-row">
                            <span className="bda-chart-label">{mission.name}</span>
                            <span className="bda-chart-value">{stats?.completionRate || 0}%</span>
                          </div>
                          <div className="bda-chart-bar-bg">
                            <div
                              className="bda-chart-bar-fill"
                              style={{ width: `${stats?.completionRate || 0}%` }}
                            />
                          </div>
                          <div className="bda-chart-detail">
                            방문 {stats?.sessions || 0}명 → 시작 {stats?.started || 0}명 (참여 {stats?.participationRate || 0}%) → 완료 {stats?.completed || 0}명 (완료 {stats?.completionRate || 0}%)
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 미션별 평균 완료 시간 */}
                <div className="bda-section">
                  <div className="bda-section-title">미션별 평균 완료 시간</div>
                  <div className="bda-time-grid">
                    {Object.values(MISSIONS).map(mission => {
                      const stats = missionStatsMap[mission.id];
                      return (
                        <div key={mission.id} className="bda-time-card">
                          <div className="bda-time-card-name">{mission.name}</div>
                          <div className="bda-time-card-value">
                            {stats?.avgTime ? `${stats.avgTime}초` : '-'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 미션별 탭 */}
            {activeTab !== 'summary' && currentMission && currentStats && (
              <div className="bda-tab-content">
                <div className="bda-mission-header">
                  <div className="bda-mission-name">{currentMission.name}</div>
                  <div className="bda-mission-desc">{currentMission.description}</div>
                  <div className="bda-device-breakdown mission">
                    <span className="bda-device-label">세션 {currentStats.sessions}명:</span>
                    <span className="bda-device-item">
                      <span className="bda-device-icon">🖥️</span> PC {currentStats.desktopUsers}명
                    </span>
                    <span className="bda-device-item">
                      <span className="bda-device-icon">📱</span> 모바일 {currentStats.mobileUsers}명
                    </span>
                    {currentStats.unknownDeviceUsers > 0 && (
                      <span className="bda-device-item unknown">
                        <span className="bda-device-icon">❓</span> 알 수 없음 {currentStats.unknownDeviceUsers}명
                      </span>
                    )}
                  </div>
                </div>

                {/* 일반 미션 퍼널 (2단계 미션이 아닌 경우) */}
                {!currentMission.additionalMissionStart && (
                  <div className="bda-section">
                    <div className="bda-section-title">사용자 흐름</div>
                    <div className="bda-funnel">
                      {/* 1. 화면 방문 */}
                      <div className="bda-funnel-step">
                        <div className="bda-funnel-label">화면 방문</div>
                        <div className="bda-funnel-bar-wrap">
                          <div className="bda-funnel-bar" style={{ width: '100%' }}></div>
                        </div>
                        <div className="bda-funnel-value">{currentStats.sessions}명</div>
                      </div>

                      {/* 2. 미시작 이탈 */}
                      <div className="bda-funnel-step dropout">
                        <div className="bda-funnel-label">↳ 미시작 이탈</div>
                        <div className="bda-funnel-bar-wrap">
                          <div className="bda-funnel-bar dropout-bar" style={{ width: `${currentStats.sessions > 0 ? (currentStats.notStarted / currentStats.sessions * 100) : 0}%` }}></div>
                        </div>
                        <div className="bda-funnel-value dropout-value">
                          {currentStats.notStarted}명
                          <span className="bda-funnel-rate">({currentStats.sessions > 0 ? ((currentStats.notStarted / currentStats.sessions) * 100).toFixed(1) : 0}%)</span>
                        </div>
                      </div>

                      {/* 3. 미션 시작 */}
                      <div className="bda-funnel-step">
                        <div className="bda-funnel-label">미션 시작</div>
                        <div className="bda-funnel-bar-wrap">
                          <div className="bda-funnel-bar started" style={{ width: `${currentStats.participationRate}%` }}></div>
                        </div>
                        <div className="bda-funnel-value">
                          {currentStats.started}명
                          <span className="bda-funnel-rate">({currentStats.participationRate}%)</span>
                        </div>
                      </div>

                      {/* 4. 미션 완료 */}
                      <div className="bda-funnel-step">
                        <div className="bda-funnel-label">미션 완료</div>
                        <div className="bda-funnel-bar-wrap">
                          <div className="bda-funnel-bar completed" style={{ width: `${currentStats.sessions > 0 ? (currentStats.completed / currentStats.sessions * 100) : 0}%` }}></div>
                        </div>
                        <div className="bda-funnel-value">
                          {currentStats.completed}명
                          <span className="bda-funnel-rate">({currentStats.completionRate}%)</span>
                        </div>
                      </div>

                      {/* 5. 미완료 이탈 */}
                      <div className="bda-funnel-step dropout">
                        <div className="bda-funnel-label">↳ 미완료 이탈</div>
                        <div className="bda-funnel-bar-wrap">
                          <div className="bda-funnel-bar dropout-bar" style={{ width: `${currentStats.started > 0 ? (currentStats.notCompleted / currentStats.started * 100) : 0}%` }}></div>
                        </div>
                        <div className="bda-funnel-value dropout-value">
                          {currentStats.notCompleted}명
                          <span className="bda-funnel-rate">({currentStats.started > 0 ? ((currentStats.notCompleted / currentStats.started) * 100).toFixed(1) : 0}%)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2단계 미션 퍼널 (편집 6-1) - 화면 방문 */}
                {currentMission.additionalMissionStart && (
                  <div className="bda-section">
                    <div className="bda-section-title">화면 방문</div>
                    <div className="bda-funnel">
                      <div className="bda-funnel-step">
                        <div className="bda-funnel-label">화면 방문</div>
                        <div className="bda-funnel-bar-wrap">
                          <div className="bda-funnel-bar" style={{ width: '100%' }}></div>
                        </div>
                        <div className="bda-funnel-value">{currentStats.sessions}명</div>
                      </div>
                      <div className="bda-funnel-step dropout">
                        <div className="bda-funnel-label">↳ 미시작 이탈</div>
                        <div className="bda-funnel-bar-wrap">
                          <div className="bda-funnel-bar dropout-bar" style={{ width: `${currentStats.sessions > 0 ? (currentStats.basicNotStarted / currentStats.sessions * 100) : 0}%` }}></div>
                        </div>
                        <div className="bda-funnel-value dropout-value">
                          {currentStats.basicNotStarted}명
                          <span className="bda-funnel-rate">({currentStats.sessions > 0 ? ((currentStats.basicNotStarted / currentStats.sessions) * 100).toFixed(1) : 0}%)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2단계 미션 (편집 6-1) - 기본 미션 퍼널 */}
                {currentMission.additionalMissionStart && (
                  <>
                    <div className="bda-section">
                      <div className="bda-section-title">기본 미션</div>
                      <div className="bda-funnel">
                        {/* 기본 미션 시작 */}
                        <div className="bda-funnel-step">
                          <div className="bda-funnel-label">기본 미션 시작</div>
                          <div className="bda-funnel-bar-wrap">
                            <div className="bda-funnel-bar started" style={{ width: `${currentStats.participationRate}%` }}></div>
                          </div>
                          <div className="bda-funnel-value">
                            {currentStats.basicStarted}명
                            <span className="bda-funnel-rate">({currentStats.participationRate}%)</span>
                          </div>
                        </div>

                        {/* 기본 미션 완료 */}
                        <div className="bda-funnel-step">
                          <div className="bda-funnel-label">기본 미션 완료</div>
                          <div className="bda-funnel-bar-wrap">
                            <div className="bda-funnel-bar completed" style={{ width: `${currentStats.sessions > 0 ? (currentStats.basicCompleted / currentStats.sessions * 100) : 0}%` }}></div>
                          </div>
                          <div className="bda-funnel-value">
                            {currentStats.basicCompleted}명
                            <span className="bda-funnel-rate">({currentStats.basicCompletionRate}%)</span>
                          </div>
                        </div>

                        {/* 기본 미션 이탈 */}
                        <div className="bda-funnel-step dropout">
                          <div className="bda-funnel-label">↳ 기본 미션 이탈</div>
                          <div className="bda-funnel-bar-wrap">
                            <div className="bda-funnel-bar dropout-bar" style={{ width: `${currentStats.basicStarted > 0 ? (currentStats.basicNotCompleted / currentStats.basicStarted * 100) : 0}%` }}></div>
                          </div>
                          <div className="bda-funnel-value dropout-value">
                            {currentStats.basicNotCompleted}명
                            <span className="bda-funnel-rate">({currentStats.basicStarted > 0 ? ((currentStats.basicNotCompleted / currentStats.basicStarted) * 100).toFixed(1) : 0}%)</span>
                          </div>
                        </div>
                      </div>
                      {currentStats.basicAvgTime && (
                        <div className="bda-time-summary">
                          평균 소요 시간: <strong>{currentStats.basicAvgTime}초</strong>
                        </div>
                      )}
                    </div>

                    <div className="bda-section">
                      <div className="bda-section-title">추가 미션</div>
                      <div className="bda-funnel">
                        {/* 추가 미션 시작 */}
                        <div className="bda-funnel-step">
                          <div className="bda-funnel-label">추가 미션 시작</div>
                          <div className="bda-funnel-bar-wrap">
                            <div className="bda-funnel-bar started" style={{ width: `${currentStats.additionalParticipationRate}%` }}></div>
                          </div>
                          <div className="bda-funnel-value">
                            {currentStats.additionalStarted}명
                            <span className="bda-funnel-rate">({currentStats.additionalParticipationRate}%)</span>
                          </div>
                        </div>

                        {/* 추가 미션 완료 */}
                        <div className="bda-funnel-step">
                          <div className="bda-funnel-label">추가 미션 완료</div>
                          <div className="bda-funnel-bar-wrap">
                            <div className="bda-funnel-bar completed" style={{ width: `${currentStats.basicCompleted > 0 ? (currentStats.additionalCompleted / currentStats.basicCompleted * 100) : 0}%` }}></div>
                          </div>
                          <div className="bda-funnel-value">
                            {currentStats.additionalCompleted}명
                            <span className="bda-funnel-rate">({currentStats.additionalCompletionRate}%)</span>
                          </div>
                        </div>

                        {/* 추가 미션 이탈 */}
                        <div className="bda-funnel-step dropout">
                          <div className="bda-funnel-label">↳ 추가 미션 이탈</div>
                          <div className="bda-funnel-bar-wrap">
                            <div className="bda-funnel-bar dropout-bar" style={{ width: `${currentStats.additionalStarted > 0 ? (currentStats.additionalNotCompleted / currentStats.additionalStarted * 100) : 0}%` }}></div>
                          </div>
                          <div className="bda-funnel-value dropout-value">
                            {currentStats.additionalNotCompleted}명
                            <span className="bda-funnel-rate">({currentStats.additionalStarted > 0 ? ((currentStats.additionalNotCompleted / currentStats.additionalStarted) * 100).toFixed(1) : 0}%)</span>
                          </div>
                        </div>
                      </div>
                      {currentStats.avgTime && (
                        <div className="bda-time-summary">
                          평균 소요 시간: <strong>{currentStats.avgTime}초</strong>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* 평균 소요 시간 (일반 미션만) */}
                {!currentMission.additionalMissionStart && (
                  <div className="bda-section">
                    <div className="bda-section-title">평균 소요 시간</div>
                    <div className="bda-time-display">
                      <span className="bda-time-value">{currentStats.avgTime || '-'}</span>
                      <span className="bda-time-unit">초</span>
                    </div>
                    {currentStats.minTime && (
                      <div className="bda-time-range">
                        최소 {currentStats.minTime}초 ~ 최대 {currentStats.maxTime}초
                      </div>
                    )}
                  </div>
                )}

                {/* 완료 시간 분포 */}
                {currentStats.completionTimes && currentStats.completionTimes.length > 0 && (
                  <div className="bda-section">
                    <div className="bda-section-title">완료 시간 분포</div>
                    <TimeDistributionChart times={currentStats.completionTimes} />
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {!csvData && (
          <div className="bda-empty">
            <p>CSV 파일을 업로드하면 분석 결과가 표시됩니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// 시간 분포 차트 컴포넌트
function TimeDistributionChart({ times }) {
  const bucketSize = 5;
  const buckets = {};

  times.forEach(t => {
    const bucket = Math.floor(t / bucketSize) * bucketSize;
    const label = `${bucket}-${bucket + bucketSize}`;
    buckets[label] = (buckets[label] || 0) + 1;
  });

  const data = Object.entries(buckets)
    .map(([label, count]) => ({ label: `${label}초`, count }))
    .sort((a, b) => parseInt(a.label) - parseInt(b.label));

  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="bda-time-dist">
      {data.map(({ label, count }) => (
        <div key={label} className="bda-time-dist-item">
          <span className="bda-time-dist-label">{label}</span>
          <div className="bda-time-dist-bar-bg">
            <div
              className="bda-time-dist-bar-fill"
              style={{ width: `${(count / maxCount) * 100}%` }}
            />
          </div>
          <span className="bda-time-dist-count">{count}명</span>
        </div>
      ))}
    </div>
  );
}

export default BasicDataAnalysis;
