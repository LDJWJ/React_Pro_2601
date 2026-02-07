import { useState, useMemo } from 'react';
import './ExtendedDataAnalysis.css';

// ============================================
// CSV 파싱 (쉼표 구분, 따옴표 처리)
// ============================================
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

// ============================================
// 미션 정의
// ============================================
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

// ============================================
// 미션별 통계 계산 (고유 사용자 기준)
// ============================================
function computeMissionStats(data, mission) {
  const validRows = data.filter(r => r['사용자ID']);

  // 해당 미션 관련 로우만 필터링
  const missionRows = validRows.filter(r =>
    r['화면']?.includes(mission.screenPrefix) ||
    r['대상']?.includes(mission.screenPrefix)
  );

  // 세션 수 (화면에 진입한 고유 사용자)
  const sessions = new Set(missionRows.map(r => r['사용자ID']));

  // 전체 데이터에서 사용자별 디바이스 정보 수집
  const userDeviceMap = new Map();
  validRows.forEach(r => {
    const userId = r['사용자ID'];
    const device = r['디바이스'] || '';
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

  const unknownDeviceUsers = sessions.size - desktopUsers - mobileUsers;

  // 미션 시작한 고유 사용자
  const startedUsers = new Set();
  validRows.forEach(r => {
    if (r['이벤트'] === '미션 시작' && r['대상'] === mission.missionStartTarget) {
      startedUsers.add(r['사용자ID']);
    }
  });

  // 미션 완료한 고유 사용자
  const completedUsers = new Set();
  const completionTimesByUser = new Map();
  validRows.forEach(r => {
    if (r['이벤트'] === '미션 완료' && r['대상'] === mission.missionCompleteTarget) {
      const userId = r['사용자ID'];
      completedUsers.add(userId);
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
    const basicCompletionTimesByUser = new Map();
    const additionalCompletionTimesByUser = new Map();

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

    const basicNotStarted = sessionCount - basicStartedUsers.size;
    const basicNotCompleted = basicStartedUsers.size - basicCompletedUsers.size;
    const additionalNotStarted = basicCompletedUsers.size - additionalStartedUsers.size;
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

// ============================================
// 전체 요약 통계
// ============================================
function computeOverallStats(data) {
  const validRows = data.filter(r => r['사용자ID']);
  const missionPrefixes = Object.values(MISSIONS).map(m => m.screenPrefix);

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

  const userDeviceMap = new Map();
  validRows.forEach(r => {
    const userId = r['사용자ID'];
    const device = r['디바이스'] || '';
    if (missionUsers.has(userId) && !userDeviceMap.has(userId) && device) {
      userDeviceMap.set(userId, device);
    }
  });

  let desktopUsers = 0;
  let mobileUsers = 0;
  userDeviceMap.forEach((device) => {
    if (device === 'desktop') desktopUsers++;
    else if (device === 'mobile') mobileUsers++;
  });

  const unknownDeviceUsers = missionUsers.size - desktopUsers - mobileUsers;

  return {
    totalSessions: missionUsers.size,
    totalEvents: validRows.length,
    desktopUsers,
    mobileUsers,
    unknownDeviceUsers,
  };
}

// ============================================
// 확장 데이터 분석 컴포넌트
// ============================================
function ExtendedDataAnalysis({ onBack }) {
  const [csvData, setCsvData] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [fileName, setFileName] = useState('');

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

  return (
    <div className="eda-container">
      <div className="eda-header">
        <button className="eda-back-btn" onClick={onBack}>&#8249;</button>
        <span className="eda-title">확장 데이터 분석</span>
      </div>

      <div className="eda-content">
        {/* CSV 업로드 */}
        <div className="eda-upload-section">
          <label className="eda-upload-btn">
            CSV 파일 선택
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </label>
          {fileName && <span className="eda-file-name">{fileName}</span>}
        </div>

        {csvData && (
          <>
            {/* 탭 네비게이션 */}
            <div className="eda-tabs">
              <button
                className={`eda-tab ${activeTab === 'summary' ? 'active' : ''}`}
                onClick={() => setActiveTab('summary')}
              >
                종합
              </button>
              {Object.values(MISSIONS).map(mission => (
                <button
                  key={mission.id}
                  className={`eda-tab ${activeTab === mission.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(mission.id)}
                >
                  {mission.name}
                </button>
              ))}
            </div>

            {/* 종합 탭 */}
            {activeTab === 'summary' && overallStats && (
              <div className="eda-tab-content">
                {/* 전체 요약 테이블 */}
                <div className="eda-section">
                  <div className="eda-section-title">전체 요약</div>
                  <table className="eda-table">
                    <tbody>
                      <tr>
                        <th>총 세션 수</th>
                        <td>{overallStats.totalSessions} 세션</td>
                      </tr>
                      <tr>
                        <th>총 이벤트 수</th>
                        <td>{overallStats.totalEvents}건</td>
                      </tr>
                      <tr>
                        <th>PC</th>
                        <td>{overallStats.desktopUsers} 세션</td>
                      </tr>
                      <tr>
                        <th>모바일</th>
                        <td>{overallStats.mobileUsers} 세션</td>
                      </tr>
                      {overallStats.unknownDeviceUsers > 0 && (
                        <tr>
                          <th>알 수 없음</th>
                          <td>{overallStats.unknownDeviceUsers} 세션</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 미션별 요약 테이블 */}
                <div className="eda-section">
                  <div className="eda-section-title">미션별 요약</div>
                  <table className="eda-table eda-table-full">
                    <thead>
                      <tr>
                        <th>미션</th>
                        <th>방문</th>
                        <th>시작</th>
                        <th>완료</th>
                        <th>참여율</th>
                        <th>완료율</th>
                        <th>평균시간</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.values(MISSIONS).map(mission => {
                        const stats = missionStatsMap[mission.id];
                        return (
                          <tr key={mission.id}>
                            <td className="eda-mission-name">{mission.name}</td>
                            <td>{stats?.sessions || 0}</td>
                            <td>{stats?.started || 0}</td>
                            <td>{stats?.completed || 0}</td>
                            <td>{stats?.participationRate || 0}%</td>
                            <td className="eda-highlight">{stats?.completionRate || 0}%</td>
                            <td>{stats?.avgTime ? `${stats.avgTime}초` : '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* ============================================ */}
                {/* 확장 기능 영역 - 추후 기능 추가 */}
                {/* ============================================ */}
                <div className="eda-section eda-extension-area">
                  <div className="eda-section-title">확장 분석</div>
                  <div className="eda-extension-placeholder">
                    <p>추가 분석 기능이 여기에 표시됩니다.</p>
                    {/* TODO: 추가 분석 기능 구현 */}
                  </div>
                </div>
              </div>
            )}

            {/* 미션별 탭 */}
            {activeTab !== 'summary' && currentMission && currentStats && (
              <div className="eda-tab-content">
                <div className="eda-mission-header">
                  <div className="eda-mission-title">{currentMission.name}</div>
                  <div className="eda-mission-desc">{currentMission.description}</div>
                </div>

                {/* 기본 통계 테이블 */}
                <div className="eda-section">
                  <div className="eda-section-title">기본 통계</div>
                  <table className="eda-table">
                    <tbody>
                      <tr>
                        <th>화면 방문</th>
                        <td>{currentStats.sessions} 세션</td>
                      </tr>
                      <tr>
                        <th>미션 시작</th>
                        <td>{currentStats.started} 세션 ({currentStats.participationRate}%)</td>
                      </tr>
                      <tr>
                        <th>미션 완료</th>
                        <td>{currentStats.completed} 세션 ({currentStats.completionRate}%)</td>
                      </tr>
                      <tr>
                        <th>미시작 이탈</th>
                        <td>{currentStats.notStarted} 세션</td>
                      </tr>
                      <tr>
                        <th>미완료 이탈</th>
                        <td>{currentStats.notCompleted} 세션</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 디바이스별 통계 */}
                <div className="eda-section">
                  <div className="eda-section-title">디바이스별 분포</div>
                  <table className="eda-table">
                    <tbody>
                      <tr>
                        <th>PC</th>
                        <td>{currentStats.desktopUsers} 세션</td>
                      </tr>
                      <tr>
                        <th>모바일</th>
                        <td>{currentStats.mobileUsers} 세션</td>
                      </tr>
                      {currentStats.unknownDeviceUsers > 0 && (
                        <tr>
                          <th>알 수 없음</th>
                          <td>{currentStats.unknownDeviceUsers} 세션</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 시간 통계 */}
                <div className="eda-section">
                  <div className="eda-section-title">완료 시간</div>
                  <table className="eda-table">
                    <tbody>
                      <tr>
                        <th>평균</th>
                        <td>{currentStats.avgTime ? `${currentStats.avgTime}초` : '-'}</td>
                      </tr>
                      {currentStats.minTime && (
                        <>
                          <tr>
                            <th>최소</th>
                            <td>{currentStats.minTime}초</td>
                          </tr>
                          <tr>
                            <th>최대</th>
                            <td>{currentStats.maxTime}초</td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 2단계 미션 추가 정보 (편집 6-1) */}
                {currentMission.additionalMissionStart && (
                  <>
                    <div className="eda-section">
                      <div className="eda-section-title">기본 미션</div>
                      <table className="eda-table">
                        <tbody>
                          <tr>
                            <th>시작</th>
                            <td>{currentStats.basicStarted} 세션</td>
                          </tr>
                          <tr>
                            <th>완료</th>
                            <td>{currentStats.basicCompleted} 세션 ({currentStats.basicCompletionRate}%)</td>
                          </tr>
                          <tr>
                            <th>평균 시간</th>
                            <td>{currentStats.basicAvgTime ? `${currentStats.basicAvgTime}초` : '-'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="eda-section">
                      <div className="eda-section-title">추가 미션</div>
                      <table className="eda-table">
                        <tbody>
                          <tr>
                            <th>시작</th>
                            <td>{currentStats.additionalStarted} 세션 ({currentStats.additionalParticipationRate}%)</td>
                          </tr>
                          <tr>
                            <th>완료</th>
                            <td>{currentStats.additionalCompleted} 세션 ({currentStats.additionalCompletionRate}%)</td>
                          </tr>
                          <tr>
                            <th>평균 시간</th>
                            <td>{currentStats.avgTime ? `${currentStats.avgTime}초` : '-'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {/* ============================================ */}
                {/* 확장 기능 영역 - 미션별 추가 분석 */}
                {/* ============================================ */}
                <div className="eda-section eda-extension-area">
                  <div className="eda-section-title">확장 분석</div>
                  <div className="eda-extension-placeholder">
                    <p>{currentMission.name} 추가 분석 기능이 여기에 표시됩니다.</p>
                    {/* TODO: 미션별 추가 분석 기능 구현 */}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {!csvData && (
          <div className="eda-empty">
            <p>CSV 파일을 업로드하면 분석 결과가 표시됩니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// 외부에서 사용할 수 있도록 유틸리티 함수 export
export { parseCSV, MISSIONS, computeMissionStats, computeOverallStats };
export default ExtendedDataAnalysis;
