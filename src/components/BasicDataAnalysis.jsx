import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
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
    description: '영상 아이디어를 메모하려고 합니다. 아이디어 노트를 활용해, 메모 작성이 완료되면 저장하기를 선택해 주세요. 하나 이상은 메모 작성이 필요합니다.',
    screenPrefix: '기획1-1',
    missionStartTarget: '기획1-1_미션시작',
    missionCompleteTarget: '기획1-1_미션완료',
  },
  'plan1-2': {
    id: 'plan1-2',
    name: '기획 1-2',
    description: '영상 아이디어를 메모하려고 합니다. 아이디어 노트를 활용해, 메모 작성이 완료되면 저장하기를 선택해 주세요. 하나 이상은 메모 작성이 필요합니다.',
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

// 전체 요약 통계
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

function BasicDataAnalysis({ onBack }) {
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

  // 차트용 데이터
  const chartData = useMemo(() => {
    return Object.values(MISSIONS).map(mission => {
      const stats = missionStatsMap[mission.id];
      return {
        name: mission.name,
        참여율: parseFloat(stats?.participationRate || 0),
        완료율: parseFloat(stats?.completionRate || 0),
        avgTime: parseFloat(stats?.avgTime || stats?.basicAvgTime || 0),
      };
    });
  }, [missionStatsMap]);

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
                  <div className="bda-big-number">{overallStats.totalSessions}<span className="bda-unit">세션</span></div>
                  <div className="bda-device-breakdown">
                    <span className="bda-device-item">
                      <span className="bda-device-icon">🖥️</span> PC {overallStats.desktopUsers} 세션
                    </span>
                    <span className="bda-device-item">
                      <span className="bda-device-icon">📱</span> 모바일 {overallStats.mobileUsers} 세션
                    </span>
                    {overallStats.unknownDeviceUsers > 0 && (
                      <span className="bda-device-item unknown">
                        <span className="bda-device-icon">❓</span> 알 수 없음 {overallStats.unknownDeviceUsers} 세션
                      </span>
                    )}
                  </div>
                </div>

                {/* 미션별 참여율/완료율 테이블 */}
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
                            방문 {stats?.sessions || 0} 세션 → 시작 {stats?.started || 0} 세션 (참여 {stats?.participationRate || 0}%) → 완료 {stats?.completed || 0} 세션 (완료 {stats?.completionRate || 0}%)
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 미션별 참여율 차트 */}
                <div className="bda-section">
                  <div className="bda-section-title">미션별 참여율</div>
                  <div className="bda-section-subtitle">화면 방문자 중 미션을 시작한 비율</div>
                  <div className="bda-recharts-container">
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart
                        data={chartData}
                        margin={{ top: 20, right: 20, left: 20, bottom: 80 }}
                        barCategoryGap="25%"
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 12, fill: '#666' }}
                          tickLine={false}
                          axisLine={{ stroke: '#e5e7eb' }}
                          interval={0}
                          angle={-45}
                          textAnchor="end"
                          dy={10}
                        />
                        <YAxis
                          domain={[0, 100]}
                          ticks={[0, 25, 50, 75, 100]}
                          tick={{ fontSize: 12, fill: '#666' }}
                          tickFormatter={(value) => `${value}%`}
                          tickLine={false}
                          axisLine={{ stroke: '#e5e7eb' }}
                        />
                        <Tooltip
                          formatter={(value) => [`${value}%`, '참여율']}
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                          }}
                        />
                        <Bar
                          dataKey="참여율"
                          fill="#f59e0b"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={50}
                          label={{
                            position: 'top',
                            formatter: (value) => `${value}%`,
                            fontSize: 11,
                            fill: '#666'
                          }}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 미션별 완료율 차트 */}
                <div className="bda-section">
                  <div className="bda-section-title">미션별 완료율</div>
                  <div className="bda-section-subtitle">미션 시작자 중 완료한 비율</div>
                  <div className="bda-recharts-container">
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart
                        data={chartData}
                        margin={{ top: 20, right: 20, left: 20, bottom: 80 }}
                        barCategoryGap="25%"
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 12, fill: '#666' }}
                          tickLine={false}
                          axisLine={{ stroke: '#e5e7eb' }}
                          interval={0}
                          angle={-45}
                          textAnchor="end"
                          dy={10}
                        />
                        <YAxis
                          domain={[0, 100]}
                          ticks={[0, 25, 50, 75, 100]}
                          tick={{ fontSize: 12, fill: '#666' }}
                          tickFormatter={(value) => `${value}%`}
                          tickLine={false}
                          axisLine={{ stroke: '#e5e7eb' }}
                        />
                        <Tooltip
                          formatter={(value) => [`${value}%`, '완료율']}
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                          }}
                        />
                        <Bar
                          dataKey="완료율"
                          fill="#22c55e"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={50}
                          label={{
                            position: 'top',
                            formatter: (value) => `${value}%`,
                            fontSize: 11,
                            fill: '#666'
                          }}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 미션별 평균 완료 시간 테이블 */}
                <div className="bda-section">
                  <div className="bda-section-title">미션별 평균 완료 시간</div>
                  <div className="bda-time-grid">
                    {Object.values(MISSIONS).map(mission => {
                      const stats = missionStatsMap[mission.id];
                      return (
                        <div key={mission.id} className="bda-time-card">
                          <div className="bda-time-card-name">{mission.name}</div>
                          <div className="bda-time-card-value">
                            {stats?.avgTime || stats?.basicAvgTime ? `${stats?.avgTime || stats?.basicAvgTime}초` : '-'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 미션별 평균 완료 시간 차트 */}
                <div className="bda-section">
                  <div className="bda-section-title">미션별 평균 완료 시간 (차트)</div>
                  <div className="bda-recharts-container">
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart
                        data={chartData.filter(d => d.avgTime > 0)}
                        margin={{ top: 30, right: 30, left: 20, bottom: 80 }}
                        barCategoryGap="25%"
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 12, fill: '#666' }}
                          tickLine={false}
                          axisLine={{ stroke: '#e5e7eb' }}
                          interval={0}
                          angle={-45}
                          textAnchor="end"
                          dy={10}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: '#666' }}
                          tickFormatter={(value) => `${value}초`}
                          tickLine={false}
                          axisLine={{ stroke: '#e5e7eb' }}
                        />
                        <Tooltip
                          formatter={(value) => [`${value}초`, '평균 완료 시간']}
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                          }}
                        />
                        <Bar
                          dataKey="avgTime"
                          fill="#3b82f6"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={50}
                          label={{
                            position: 'top',
                            formatter: (value) => `${value}초`,
                            fontSize: 11,
                            fill: '#666'
                          }}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 디바이스 분포 차트 */}
                <div className="bda-section">
                  <div className="bda-section-title">디바이스 분포</div>
                  <div className="bda-recharts-container">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'PC', value: overallStats?.desktopUsers || 0, color: '#3b82f6' },
                            { name: '모바일', value: overallStats?.mobileUsers || 0, color: '#22c55e' },
                            ...(overallStats?.unknownDeviceUsers > 0 ? [{ name: '알 수 없음', value: overallStats.unknownDeviceUsers, color: '#9ca3af' }] : [])
                          ].filter(d => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, value, percent }) => `${name} ${value}명 (${(percent * 100).toFixed(0)}%)`}
                          labelLine={{ stroke: '#999', strokeWidth: 1 }}
                        >
                          {[
                            { name: 'PC', value: overallStats?.desktopUsers || 0, color: '#3b82f6' },
                            { name: '모바일', value: overallStats?.mobileUsers || 0, color: '#22c55e' },
                            ...(overallStats?.unknownDeviceUsers > 0 ? [{ name: '알 수 없음', value: overallStats.unknownDeviceUsers, color: '#9ca3af' }] : [])
                          ].filter(d => d.value > 0).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name) => [`${value}명`, name]}
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* 미션별 탭 */}
            {activeTab !== 'summary' && currentMission && currentStats && (
              <div className="bda-tab-content">
                <div className="bda-mission-header">
                  <div className="bda-mission-name">{currentMission.name}: {currentMission.description}</div>
                  <div className="bda-device-breakdown mission">
                    <span className="bda-device-label">세션 {currentStats.sessions}개:</span>
                    <span className="bda-device-item">
                      <span className="bda-device-icon">🖥️</span> PC {currentStats.desktopUsers} 세션
                    </span>
                    <span className="bda-device-item">
                      <span className="bda-device-icon">📱</span> 모바일 {currentStats.mobileUsers} 세션
                    </span>
                    {currentStats.unknownDeviceUsers > 0 && (
                      <span className="bda-device-item unknown">
                        <span className="bda-device-icon">❓</span> 알 수 없음 {currentStats.unknownDeviceUsers} 세션
                      </span>
                    )}
                  </div>
                </div>

                {/* 일반 미션 퍼널 */}
                {!currentMission.additionalMissionStart && (
                  <div className="bda-section">
                    <div className="bda-section-title">사용자 흐름</div>
                    <div className="bda-funnel">
                      <div className="bda-funnel-step">
                        <div className="bda-funnel-label">화면 방문</div>
                        <div className="bda-funnel-bar-wrap">
                          <div className="bda-funnel-bar" style={{ width: '100%' }}></div>
                        </div>
                        <div className="bda-funnel-value">{currentStats.sessions} 세션</div>
                      </div>
                      <div className="bda-funnel-step dropout">
                        <div className="bda-funnel-label">↳ 미시작 이탈</div>
                        <div className="bda-funnel-bar-wrap">
                          <div className="bda-funnel-bar dropout-bar" style={{ width: `${currentStats.sessions > 0 ? (currentStats.notStarted / currentStats.sessions * 100) : 0}%` }}></div>
                        </div>
                        <div className="bda-funnel-value dropout-value">
                          {currentStats.notStarted} 세션
                          <span className="bda-funnel-rate">({currentStats.sessions > 0 ? ((currentStats.notStarted / currentStats.sessions) * 100).toFixed(1) : 0}%)</span>
                        </div>
                      </div>
                      <div className="bda-funnel-step">
                        <div className="bda-funnel-label">미션 시작</div>
                        <div className="bda-funnel-bar-wrap">
                          <div className="bda-funnel-bar started" style={{ width: `${currentStats.participationRate}%` }}></div>
                        </div>
                        <div className="bda-funnel-value">
                          {currentStats.started} 세션
                          <span className="bda-funnel-rate">({currentStats.participationRate}%)</span>
                        </div>
                      </div>
                      <div className="bda-funnel-step">
                        <div className="bda-funnel-label">미션 완료</div>
                        <div className="bda-funnel-bar-wrap">
                          <div className="bda-funnel-bar completed" style={{ width: `${currentStats.sessions > 0 ? (currentStats.completed / currentStats.sessions * 100) : 0}%` }}></div>
                        </div>
                        <div className="bda-funnel-value">
                          {currentStats.completed} 세션
                          <span className="bda-funnel-rate">({currentStats.completionRate}%)</span>
                        </div>
                      </div>
                      <div className="bda-funnel-step dropout">
                        <div className="bda-funnel-label">↳ 미완료 이탈</div>
                        <div className="bda-funnel-bar-wrap">
                          <div className="bda-funnel-bar dropout-bar" style={{ width: `${currentStats.started > 0 ? (currentStats.notCompleted / currentStats.started * 100) : 0}%` }}></div>
                        </div>
                        <div className="bda-funnel-value dropout-value">
                          {currentStats.notCompleted} 세션
                          <span className="bda-funnel-rate">({currentStats.started > 0 ? ((currentStats.notCompleted / currentStats.started) * 100).toFixed(1) : 0}%)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2단계 미션 (편집 6-1) */}
                {currentMission.additionalMissionStart && (
                  <>
                    <div className="bda-section">
                      <div className="bda-section-title">화면 방문</div>
                      <div className="bda-funnel">
                        <div className="bda-funnel-step">
                          <div className="bda-funnel-label">화면 방문</div>
                          <div className="bda-funnel-bar-wrap">
                            <div className="bda-funnel-bar" style={{ width: '100%' }}></div>
                          </div>
                          <div className="bda-funnel-value">{currentStats.sessions} 세션</div>
                        </div>
                        <div className="bda-funnel-step dropout">
                          <div className="bda-funnel-label">↳ 미시작 이탈</div>
                          <div className="bda-funnel-bar-wrap">
                            <div className="bda-funnel-bar dropout-bar" style={{ width: `${currentStats.sessions > 0 ? (currentStats.basicNotStarted / currentStats.sessions * 100) : 0}%` }}></div>
                          </div>
                          <div className="bda-funnel-value dropout-value">
                            {currentStats.basicNotStarted} 세션
                            <span className="bda-funnel-rate">({currentStats.sessions > 0 ? ((currentStats.basicNotStarted / currentStats.sessions) * 100).toFixed(1) : 0}%)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bda-section">
                      <div className="bda-section-title">기본 미션</div>
                      <div className="bda-funnel">
                        <div className="bda-funnel-step">
                          <div className="bda-funnel-label">기본 미션 시작</div>
                          <div className="bda-funnel-bar-wrap">
                            <div className="bda-funnel-bar started" style={{ width: `${currentStats.participationRate}%` }}></div>
                          </div>
                          <div className="bda-funnel-value">
                            {currentStats.basicStarted} 세션
                            <span className="bda-funnel-rate">({currentStats.participationRate}%)</span>
                          </div>
                        </div>
                        <div className="bda-funnel-step">
                          <div className="bda-funnel-label">기본 미션 완료</div>
                          <div className="bda-funnel-bar-wrap">
                            <div className="bda-funnel-bar completed" style={{ width: `${currentStats.sessions > 0 ? (currentStats.basicCompleted / currentStats.sessions * 100) : 0}%` }}></div>
                          </div>
                          <div className="bda-funnel-value">
                            {currentStats.basicCompleted} 세션
                            <span className="bda-funnel-rate">({currentStats.basicCompletionRate}%)</span>
                          </div>
                        </div>
                        <div className="bda-funnel-step dropout">
                          <div className="bda-funnel-label">↳ 기본 미션 이탈</div>
                          <div className="bda-funnel-bar-wrap">
                            <div className="bda-funnel-bar dropout-bar" style={{ width: `${currentStats.basicStarted > 0 ? (currentStats.basicNotCompleted / currentStats.basicStarted * 100) : 0}%` }}></div>
                          </div>
                          <div className="bda-funnel-value dropout-value">
                            {currentStats.basicNotCompleted} 세션
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
                        <div className="bda-funnel-step">
                          <div className="bda-funnel-label">추가 미션 시작</div>
                          <div className="bda-funnel-bar-wrap">
                            <div className="bda-funnel-bar started" style={{ width: `${currentStats.additionalParticipationRate}%` }}></div>
                          </div>
                          <div className="bda-funnel-value">
                            {currentStats.additionalStarted} 세션
                            <span className="bda-funnel-rate">({currentStats.additionalParticipationRate}%)</span>
                          </div>
                        </div>
                        <div className="bda-funnel-step">
                          <div className="bda-funnel-label">추가 미션 완료</div>
                          <div className="bda-funnel-bar-wrap">
                            <div className="bda-funnel-bar completed" style={{ width: `${currentStats.basicCompleted > 0 ? (currentStats.additionalCompleted / currentStats.basicCompleted * 100) : 0}%` }}></div>
                          </div>
                          <div className="bda-funnel-value">
                            {currentStats.additionalCompleted} 세션
                            <span className="bda-funnel-rate">({currentStats.additionalCompletionRate}%)</span>
                          </div>
                        </div>
                        <div className="bda-funnel-step dropout">
                          <div className="bda-funnel-label">↳ 추가 미션 이탈</div>
                          <div className="bda-funnel-bar-wrap">
                            <div className="bda-funnel-bar dropout-bar" style={{ width: `${currentStats.additionalStarted > 0 ? (currentStats.additionalNotCompleted / currentStats.additionalStarted * 100) : 0}%` }}></div>
                          </div>
                          <div className="bda-funnel-value dropout-value">
                            {currentStats.additionalNotCompleted} 세션
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

                {/* 완료 시간 분포 차트 */}
                {currentStats.completionTimes && currentStats.completionTimes.length > 0 && (
                  <div className="bda-section">
                    <div className="bda-section-title">완료 시간 분포</div>
                    <div className="bda-recharts-container">
                      {(() => {
                        const times = currentStats.completionTimes;
                        const bucketSize = 5;
                        const buckets = {};
                        times.forEach(t => {
                          const bucket = Math.floor(t / bucketSize) * bucketSize;
                          const label = `${bucket}-${bucket + bucketSize}`;
                          buckets[label] = (buckets[label] || 0) + 1;
                        });

                        const data = Object.entries(buckets)
                          .map(([label, count]) => ({
                            시간구간: label + '초',
                            인원: count,
                            sortKey: parseInt(label)
                          }))
                          .sort((a, b) => a.sortKey - b.sortKey);

                        return (
                          <ResponsiveContainer width="100%" height={280}>
                            <BarChart
                              data={data}
                              margin={{ top: 20, right: 20, left: 20, bottom: 60 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis
                                dataKey="시간구간"
                                tick={{ fontSize: 11, fill: '#666' }}
                                tickLine={false}
                                interval={0}
                                angle={-45}
                                textAnchor="end"
                                dy={10}
                              />
                              <YAxis
                                tick={{ fontSize: 12, fill: '#666' }}
                                tickFormatter={(value) => `${value}명`}
                                allowDecimals={false}
                              />
                              <Tooltip
                                formatter={(value) => [`${value}명`, '인원']}
                                contentStyle={{
                                  backgroundColor: '#fff',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '8px'
                                }}
                              />
                              <Bar
                                dataKey="인원"
                                fill="#22c55e"
                                radius={[4, 4, 0, 0]}
                                label={{
                                  position: 'top',
                                  formatter: (value) => value > 0 ? `${value}` : '',
                                  fontSize: 11,
                                  fill: '#666'
                                }}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* 기본 미션 완료 시간 분포 (2단계 미션) */}
                {currentMission.additionalMissionStart && currentStats.basicCompletionTimes && currentStats.basicCompletionTimes.length > 0 && (
                  <div className="bda-section">
                    <div className="bda-section-title">기본 미션 완료 시간 분포</div>
                    <div className="bda-recharts-container">
                      {(() => {
                        const times = currentStats.basicCompletionTimes;
                        const bucketSize = 10;
                        const buckets = {};
                        times.forEach(t => {
                          const bucket = Math.floor(t / bucketSize) * bucketSize;
                          const label = `${bucket}-${bucket + bucketSize}`;
                          buckets[label] = (buckets[label] || 0) + 1;
                        });

                        const data = Object.entries(buckets)
                          .map(([label, count]) => ({
                            시간구간: label + '초',
                            인원: count,
                            sortKey: parseInt(label)
                          }))
                          .sort((a, b) => a.sortKey - b.sortKey);

                        return (
                          <ResponsiveContainer width="100%" height={280}>
                            <BarChart
                              data={data}
                              margin={{ top: 20, right: 20, left: 20, bottom: 60 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis
                                dataKey="시간구간"
                                tick={{ fontSize: 11, fill: '#666' }}
                                tickLine={false}
                                interval={0}
                                angle={-45}
                                textAnchor="end"
                                dy={10}
                              />
                              <YAxis
                                tick={{ fontSize: 12, fill: '#666' }}
                                tickFormatter={(value) => `${value}명`}
                                allowDecimals={false}
                              />
                              <Tooltip
                                formatter={(value) => [`${value}명`, '인원']}
                                contentStyle={{
                                  backgroundColor: '#fff',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '8px'
                                }}
                              />
                              <Bar
                                dataKey="인원"
                                fill="#3b82f6"
                                radius={[4, 4, 0, 0]}
                                label={{
                                  position: 'top',
                                  formatter: (value) => value > 0 ? `${value}` : '',
                                  fontSize: 11,
                                  fill: '#666'
                                }}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        );
                      })()}
                    </div>
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

export default BasicDataAnalysis;
