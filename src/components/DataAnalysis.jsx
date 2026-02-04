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

// 한국어 타임스탬프 파싱: "2026. 2. 4 오후 12:06:51"
function parseTimestamp(ts) {
  if (!ts) return null;
  const match = ts.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\s*(오전|오후)\s*(\d{1,2}):(\d{2}):(\d{2})/);
  if (!match) return null;
  let [, year, month, day, ampm, hour, min, sec] = match;
  hour = parseInt(hour);
  if (ampm === '오후' && hour < 12) hour += 12;
  if (ampm === '오전' && hour === 12) hour = 0;
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hour, parseInt(min), parseInt(sec));
}

// 기본 분석 계산
function computeBasicStats(data) {
  const validRows = data.filter(r => r['사용자ID']);
  const sessions = new Set(validRows.map(r => r['사용자ID']));
  const totalEvents = validRows.length;

  // 이벤트 타입별 카운트
  const eventCounts = {};
  validRows.forEach(r => {
    const evt = r['이벤트'];
    if (evt) {
      eventCounts[evt] = (eventCounts[evt] || 0) + 1;
    }
  });

  // 화면별 체류시간 평균 (화면 이탈 이벤트)
  const screenDwell = {};
  validRows.forEach(r => {
    if (r['이벤트'] === '화면 이탈') {
      const screen = r['화면'];
      const ms = parseInt(r['체류시간(ms)']);
      if (screen && !isNaN(ms) && ms > 0) {
        if (!screenDwell[screen]) screenDwell[screen] = [];
        screenDwell[screen].push(ms);
      }
    }
  });

  const screenDwellAvg = {};
  Object.entries(screenDwell).forEach(([screen, times]) => {
    screenDwellAvg[screen] = {
      avg: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
      count: times.length,
    };
  });

  // 화면별 미션 완료 통계
  // 먼저 미션별 전체 시작 수 집계 (화면 무관)
  const missionTotalStarts = {};
  validRows.forEach(r => {
    if (r['이벤트'] === '미션 시작' && r['대상']) {
      missionTotalStarts[r['대상']] = (missionTotalStarts[r['대상']] || 0) + 1;
    }
  });

  const screenMissionMap = {};
  validRows.forEach(r => {
    const screen = r['화면'];
    const evt = r['이벤트'];
    const target = r['대상'];
    if (!screen || !target) return;
    if (evt !== '미션 시작' && evt !== '미션 완료') return;

    if (!screenMissionMap[screen]) screenMissionMap[screen] = {};
    if (!screenMissionMap[screen][target]) {
      screenMissionMap[screen][target] = { starts: 0, completes: 0, users: new Set() };
    }
    if (evt === '미션 시작') {
      screenMissionMap[screen][target].starts += 1;
      screenMissionMap[screen][target].users.add(r['사용자ID']);
    } else if (evt === '미션 완료') {
      screenMissionMap[screen][target].completes += 1;
      screenMissionMap[screen][target].users.add(r['사용자ID']);
    }
  });

  const screenMissionStats = Object.entries(screenMissionMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([screen, missions]) => ({
      screen,
      missions: Object.entries(missions)
        .map(([name, { starts, completes, users }]) => {
          // 해당 화면에 시작이 없으면 전체 시작 수를 참조하여 완료율 계산
          const effectiveStarts = starts > 0 ? starts : (missionTotalStarts[name] || 0);
          return {
            name,
            starts,
            completes,
            totalStarts: missionTotalStarts[name] || 0,
            rate: effectiveStarts > 0 ? ((completes / effectiveStarts) * 100).toFixed(1) : '0.0',
            userCount: users.size,
          };
        })
        .sort((a, b) => b.completes - a.completes),
    }));

  return {
    sessionCount: sessions.size,
    totalEvents,
    eventCounts,
    screenDwellAvg,
    screenMissionStats,
  };
}

// 미션별 분석 계산
function computeMissionStats(data) {
  const validRows = data.filter(r => r['사용자ID']);

  // 미션별 시작/완료 카운트
  const missionStart = {};
  const missionComplete = {};
  validRows.forEach(r => {
    const target = r['대상'];
    if (!target) return;
    if (r['이벤트'] === '미션 시작') {
      missionStart[target] = (missionStart[target] || 0) + 1;
    } else if (r['이벤트'] === '미션 완료') {
      missionComplete[target] = (missionComplete[target] || 0) + 1;
    }
  });

  const missions = [...new Set([...Object.keys(missionStart), ...Object.keys(missionComplete)])].sort();

  const missionSummary = missions.map(m => {
    const starts = missionStart[m] || 0;
    const completes = missionComplete[m] || 0;
    const rate = starts > 0 ? ((completes / starts) * 100).toFixed(1) : '0.0';
    return { name: m, starts, completes, rate };
  });

  // 미션별 소요 시간 (같은 세션에서 미션 시작 → 미션 완료 시간차)
  const missionDurations = {};
  const sessionMissionStarts = {};

  validRows.forEach(r => {
    const session = r['사용자ID'];
    const target = r['대상'];
    if (!target) return;
    const ts = parseTimestamp(r['타임스탬프']);
    if (!ts) return;

    if (r['이벤트'] === '미션 시작') {
      const key = `${session}__${target}`;
      sessionMissionStarts[key] = ts;
    } else if (r['이벤트'] === '미션 완료') {
      const key = `${session}__${target}`;
      if (sessionMissionStarts[key]) {
        const diff = ts - sessionMissionStarts[key];
        if (diff >= 0) {
          if (!missionDurations[target]) missionDurations[target] = [];
          missionDurations[target].push(diff);
        }
        delete sessionMissionStarts[key];
      }
    }
  });

  const missionAvgDuration = {};
  Object.entries(missionDurations).forEach(([m, durations]) => {
    missionAvgDuration[m] = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
  });

  // A/B안 종합 비교: 화면 이름에서 A안/B안 패턴 추출
  function extractVariant(screen) {
    if (!screen) return null;
    if (/A안/.test(screen)) return { mission: screen.replace(/\s*A안/, '').trim(), variant: 'A' };
    if (/B안/.test(screen)) return { mission: screen.replace(/\s*B안/, '').trim(), variant: 'B' };
    return null;
  }

  const abStats = {};
  const ensureAB = (mission) => {
    if (!abStats[mission]) {
      abStats[mission] = {
        A: { views: 0, clicks: 0, dwellTimes: [] },
        B: { views: 0, clicks: 0, dwellTimes: [] },
      };
    }
  };

  validRows.forEach(r => {
    const parsed = extractVariant(r['화면']);
    if (!parsed) return;
    const { mission, variant } = parsed;
    ensureAB(mission);

    const evt = r['이벤트'];
    if (evt === '화면 진입') {
      abStats[mission][variant].views += 1;
    } else if (evt === '버튼 클릭') {
      abStats[mission][variant].clicks += 1;
    } else if (evt === '화면 이탈') {
      const ms = parseInt(r['체류시간(ms)']);
      if (!isNaN(ms) && ms > 0) {
        abStats[mission][variant].dwellTimes.push(ms);
      }
    }
  });

  const abComparison = Object.entries(abStats)
    .filter(([, v]) => v.A.views > 0 || v.B.views > 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, v]) => {
      const avgDwell = (times) =>
        times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null;
      return {
        name,
        viewsA: v.A.views,
        viewsB: v.B.views,
        clicksA: v.A.clicks,
        clicksB: v.B.clicks,
        dwellAvgA: avgDwell(v.A.dwellTimes),
        dwellCountA: v.A.dwellTimes.length,
        dwellAvgB: avgDwell(v.B.dwellTimes),
        dwellCountB: v.B.dwellTimes.length,
      };
    });

  // 미션별 A/B 퍼널(이탈률) 분석
  // 각 미션의 시작 → A 화면 진입 → A 완료(버튼 클릭) → B 화면 진입 → B 완료(미션 완료) 추적
  const funnelData = {};
  const ensureFunnel = (mission) => {
    if (!funnelData[mission]) {
      funnelData[mission] = {
        startUsers: new Set(),
        aViewUsers: new Set(),
        aClickUsers: new Set(),
        bViewUsers: new Set(),
        bCompleteUsers: new Set(),
      };
    }
  };

  // 미션 시작 사용자 수집
  validRows.forEach(r => {
    if (r['이벤트'] === '미션 시작' && r['대상']) {
      const target = r['대상'];
      // target → mission 이름 매핑 (미션 1, 미션 2 등)
      // 여기서는 대상 값 자체를 키로 사용
      ensureFunnel(target);
      funnelData[target].startUsers.add(r['사용자ID']);
    }
  });

  // A/B 화면별 사용자 수집
  validRows.forEach(r => {
    const parsed = extractVariant(r['화면']);
    if (!parsed) return;
    const { mission, variant } = parsed;

    // mission 이름으로 funnelData의 키 찾기 (예: "미션1" → 대상 "미션 1" 매칭)
    const funnelKey = Object.keys(funnelData).find(k => {
      const normalized = k.replace(/\s/g, '');
      const missionNorm = mission.replace(/\s/g, '');
      return normalized === missionNorm;
    });
    if (!funnelKey) return;

    const userId = r['사용자ID'];
    const evt = r['이벤트'];

    if (variant === 'A') {
      if (evt === '화면 진입') funnelData[funnelKey].aViewUsers.add(userId);
      if (evt === '버튼 클릭') funnelData[funnelKey].aClickUsers.add(userId);
    } else if (variant === 'B') {
      if (evt === '화면 진입') funnelData[funnelKey].bViewUsers.add(userId);
      if (evt === '미션 완료') funnelData[funnelKey].bCompleteUsers.add(userId);
    }
  });

  // B에서 미션 완료가 아닌 버튼 클릭으로 완료를 추적하는 경우도 고려
  validRows.forEach(r => {
    if (r['이벤트'] !== '미션 완료') return;
    const parsed = extractVariant(r['화면']);
    if (!parsed) return;
    const { mission, variant } = parsed;
    if (variant !== 'B') return;
    const funnelKey = Object.keys(funnelData).find(k => {
      const normalized = k.replace(/\s/g, '');
      const missionNorm = mission.replace(/\s/g, '');
      return normalized === missionNorm;
    });
    if (funnelKey) {
      funnelData[funnelKey].bCompleteUsers.add(r['사용자ID']);
    }
  });

  const funnelStats = Object.entries(funnelData)
    .filter(([, v]) => v.startUsers.size > 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, v]) => {
      const started = v.startUsers.size;
      const aViewed = v.aViewUsers.size;
      const aClicked = v.aClickUsers.size;
      const bViewed = v.bViewUsers.size;
      const bCompleted = v.bCompleteUsers.size;
      const calcRate = (count) => started > 0 ? ((count / started) * 100).toFixed(1) : '0.0';
      const calcDropoff = (from, to) => from > 0 ? (((from - to) / from) * 100).toFixed(1) : '0.0';
      return {
        name,
        steps: [
          { label: '미션 시작', count: started, rate: '100.0', dropoff: '-' },
          { label: 'A안 진입', count: aViewed, rate: calcRate(aViewed), dropoff: calcDropoff(started, aViewed) },
          { label: 'A안 액션', count: aClicked, rate: calcRate(aClicked), dropoff: calcDropoff(aViewed, aClicked) },
          { label: 'B안 진입', count: bViewed, rate: calcRate(bViewed), dropoff: calcDropoff(aClicked, bViewed) },
          { label: 'B안 완료', count: bCompleted, rate: calcRate(bCompleted), dropoff: calcDropoff(bViewed, bCompleted) },
        ],
        overallDropoff: calcDropoff(started, bCompleted),
      };
    });

  return { missionSummary, missionAvgDuration, abComparison, funnelStats };
}

// 버튼 클릭 상세 분석
function computeButtonStats(data) {
  const validRows = data.filter(r => r['사용자ID'] && r['이벤트'] === '버튼 클릭' && r['대상']);

  // 화면별 버튼 클릭 집계
  const screenButtonMap = {};
  validRows.forEach(r => {
    const screen = r['화면'];
    const target = r['대상'];
    if (!screenButtonMap[screen]) screenButtonMap[screen] = {};
    if (!screenButtonMap[screen][target]) {
      screenButtonMap[screen][target] = { count: 0, users: new Set() };
    }
    screenButtonMap[screen][target].count += 1;
    screenButtonMap[screen][target].users.add(r['사용자ID']);
  });

  // 화면별 버튼 클릭 요약 (정렬: 클릭 수 내림차순)
  const screenButtonSummary = Object.entries(screenButtonMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([screen, buttons]) => ({
      screen,
      buttons: Object.entries(buttons)
        .map(([name, { count, users }]) => ({ name, count, userCount: users.size }))
        .sort((a, b) => b.count - a.count),
      totalClicks: Object.values(buttons).reduce((sum, b) => sum + b.count, 0),
    }));

  // A/B안 버튼 비교: 같은 미션의 A안/B안에서 어떤 버튼이 클릭되었는지
  function extractVariant(screen) {
    if (!screen) return null;
    if (/A안/.test(screen)) return { mission: screen.replace(/\s*A안/, '').trim(), variant: 'A' };
    if (/B안/.test(screen)) return { mission: screen.replace(/\s*B안/, '').trim(), variant: 'B' };
    return null;
  }

  const abButtonMap = {};
  validRows.forEach(r => {
    const parsed = extractVariant(r['화면']);
    if (!parsed) return;
    const { mission, variant } = parsed;
    const target = r['대상'];
    if (!abButtonMap[mission]) abButtonMap[mission] = { A: {}, B: {} };
    if (!abButtonMap[mission][variant][target]) {
      abButtonMap[mission][variant][target] = { count: 0, users: new Set() };
    }
    abButtonMap[mission][variant][target].count += 1;
    abButtonMap[mission][variant][target].users.add(r['사용자ID']);
  });

  const abButtonComparison = Object.entries(abButtonMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mission, variants]) => {
      const allButtons = new Set([
        ...Object.keys(variants.A),
        ...Object.keys(variants.B),
      ]);
      const buttons = [...allButtons].map(name => ({
        name,
        countA: variants.A[name]?.count || 0,
        usersA: variants.A[name]?.users.size || 0,
        countB: variants.B[name]?.count || 0,
        usersB: variants.B[name]?.users.size || 0,
      }));
      return { mission, buttons };
    });

  return { screenButtonSummary, abButtonComparison };
}

function formatMs(ms) {
  if (ms == null) return '-';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}초`;
}

function DataAnalysis({ onBack }) {
  const [csvData, setCsvData] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    logScreenView('data_analysis');
  }, []);

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
      setActiveTab('basic');
    };
    reader.readAsText(file, 'UTF-8');
  };

  const basicStats = useMemo(() => {
    if (!csvData) return null;
    return computeBasicStats(csvData);
  }, [csvData]);

  const missionStats = useMemo(() => {
    if (!csvData) return null;
    return computeMissionStats(csvData);
  }, [csvData]);

  const buttonStats = useMemo(() => {
    if (!csvData) return null;
    return computeButtonStats(csvData);
  }, [csvData]);

  return (
    <div className="da-container">
      <div className="da-header">
        <button className="da-back-btn" onClick={handleBack}>‹</button>
        <span className="da-title">데이터 분석</span>
      </div>

      <div className="da-content">
        {/* CSV 업로드 영역 */}
        <div className="da-upload-section">
          <h3 className="da-section-title">트래킹 로그 분석</h3>
          <p className="da-section-desc">CSV 파일을 업로드하여 사용자 행동 데이터를 분석합니다.</p>
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

        {/* 탭 UI */}
        {csvData && (
          <>
            <div className="da-tabs">
              <button
                className={`da-tab ${activeTab === 'basic' ? 'active' : ''}`}
                onClick={() => setActiveTab('basic')}
              >
                기본 분석
              </button>
              <button
                className={`da-tab ${activeTab === 'mission' ? 'active' : ''}`}
                onClick={() => setActiveTab('mission')}
              >
                미션별 분석
              </button>
              <button
                className={`da-tab ${activeTab === 'button' ? 'active' : ''}`}
                onClick={() => setActiveTab('button')}
              >
                버튼 분석
              </button>
            </div>

            {/* 탭 1: 기본 분석 */}
            {activeTab === 'basic' && basicStats && (
              <div className="da-tab-content">
                <div className="da-cards-row">
                  <div className="da-card">
                    <div className="da-card-label">총 세션 수</div>
                    <div className="da-card-value">{basicStats.sessionCount}</div>
                  </div>
                  <div className="da-card">
                    <div className="da-card-label">총 이벤트 수</div>
                    <div className="da-card-value">{basicStats.totalEvents}</div>
                  </div>
                </div>

                <div className="da-sub-title">이벤트 타입별 횟수</div>
                <div className="da-cards-grid">
                  {Object.entries(basicStats.eventCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([evt, count]) => (
                      <div className="da-card-small" key={evt}>
                        <div className="da-card-label">{evt}</div>
                        <div className="da-card-value-sm">{count}</div>
                      </div>
                    ))}
                </div>

                <div className="da-sub-title">화면별 평균 체류시간</div>
                <div className="da-table-wrap">
                  <table className="da-table">
                    <thead>
                      <tr>
                        <th>화면</th>
                        <th>평균 체류시간</th>
                        <th>건수</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(basicStats.screenDwellAvg)
                        .sort((a, b) => b[1].avg - a[1].avg)
                        .map(([screen, { avg, count }]) => (
                          <tr key={screen}>
                            <td>{screen}</td>
                            <td className="da-num">{formatMs(avg)}</td>
                            <td className="da-num">{count}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {basicStats.screenMissionStats.length > 0 && (
                  <>
                    <div className="da-sub-title">화면별 미션 완료 통계</div>
                    {basicStats.screenMissionStats.map(s => (
                      <div key={s.screen} style={{ marginBottom: 16 }}>
                        <div className="da-screen-label">{s.screen}</div>
                        <div className="da-table-wrap">
                          <table className="da-table">
                            <thead>
                              <tr>
                                <th>미션</th>
                                <th>시작(화면)</th>
                                <th>시작(전체)</th>
                                <th>완료</th>
                                <th>완료율</th>
                                <th>사용자</th>
                              </tr>
                            </thead>
                            <tbody>
                              {s.missions.map(m => (
                                <tr key={m.name}>
                                  <td>{m.name}</td>
                                  <td className="da-num">{m.starts}</td>
                                  <td className="da-num" style={{ color: '#888' }}>{m.totalStarts}</td>
                                  <td className="da-num">{m.completes}</td>
                                  <td className="da-num da-highlight">{m.rate}%</td>
                                  <td className="da-num">{m.userCount}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* 탭 2: 미션별 분석 */}
            {activeTab === 'mission' && missionStats && (
              <div className="da-tab-content">
                <div className="da-sub-title">미션별 시작/완료 수 및 완료율</div>
                <div className="da-table-wrap">
                  <table className="da-table">
                    <thead>
                      <tr>
                        <th>미션</th>
                        <th>시작</th>
                        <th>완료</th>
                        <th>완료율</th>
                      </tr>
                    </thead>
                    <tbody>
                      {missionStats.missionSummary.map(m => (
                        <tr key={m.name}>
                          <td>{m.name}</td>
                          <td className="da-num">{m.starts}</td>
                          <td className="da-num">{m.completes}</td>
                          <td className="da-num da-highlight">{m.rate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="da-sub-title">미션별 평균 소요 시간</div>
                <div className="da-cards-grid">
                  {missionStats.missionSummary.map(m => (
                    <div className="da-card-small" key={m.name}>
                      <div className="da-card-label">{m.name}</div>
                      <div className="da-card-value-sm">
                        {missionStats.missionAvgDuration[m.name] != null
                          ? formatMs(missionStats.missionAvgDuration[m.name])
                          : '-'}
                      </div>
                    </div>
                  ))}
                </div>

                {missionStats.abComparison.length > 0 && (
                  <>
                    <div className="da-sub-title">A/B안 화면 진입 횟수</div>
                    <div className="da-table-wrap">
                      <table className="da-table">
                        <thead>
                          <tr>
                            <th>미션</th>
                            <th>A안</th>
                            <th>B안</th>
                          </tr>
                        </thead>
                        <tbody>
                          {missionStats.abComparison.map(ab => (
                            <tr key={ab.name}>
                              <td>{ab.name}</td>
                              <td className="da-num">{ab.viewsA}</td>
                              <td className="da-num">{ab.viewsB}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="da-sub-title">A/B안 버튼 클릭 횟수</div>
                    <div className="da-table-wrap">
                      <table className="da-table">
                        <thead>
                          <tr>
                            <th>미션</th>
                            <th>A안</th>
                            <th>B안</th>
                          </tr>
                        </thead>
                        <tbody>
                          {missionStats.abComparison.map(ab => (
                            <tr key={ab.name}>
                              <td>{ab.name}</td>
                              <td className="da-num">{ab.clicksA}</td>
                              <td className="da-num">{ab.clicksB}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="da-sub-title">A/B안 평균 체류시간</div>
                    <div className="da-table-wrap">
                      <table className="da-table">
                        <thead>
                          <tr>
                            <th>미션</th>
                            <th>A안 평균</th>
                            <th>A안 건수</th>
                            <th>B안 평균</th>
                            <th>B안 건수</th>
                          </tr>
                        </thead>
                        <tbody>
                          {missionStats.abComparison.map(ab => (
                            <tr key={ab.name}>
                              <td>{ab.name}</td>
                              <td className="da-num">{formatMs(ab.dwellAvgA)}</td>
                              <td className="da-num">{ab.dwellCountA}</td>
                              <td className="da-num">{formatMs(ab.dwellAvgB)}</td>
                              <td className="da-num">{ab.dwellCountB}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {missionStats.funnelStats.length > 0 && (
                  <>
                    <div className="da-sub-title" style={{ marginTop: 24 }}>미션별 퍼널 / 이탈률 분석</div>
                    {missionStats.funnelStats.map(f => (
                      <div key={f.name} style={{ marginBottom: 20 }}>
                        <div className="da-screen-label">
                          {f.name} <span className="da-screen-total">전체 이탈률 {f.overallDropoff}%</span>
                        </div>
                        <div className="da-table-wrap">
                          <table className="da-table">
                            <thead>
                              <tr>
                                <th>단계</th>
                                <th>사용자</th>
                                <th>잔존율</th>
                                <th>이탈률</th>
                              </tr>
                            </thead>
                            <tbody>
                              {f.steps.map((s, i) => (
                                <tr key={i}>
                                  <td>{s.label}</td>
                                  <td className="da-num">{s.count}</td>
                                  <td className="da-num" style={{ color: '#4CAF50' }}>{s.rate}%</td>
                                  <td className="da-num" style={{ color: s.dropoff !== '-' && parseFloat(s.dropoff) > 0 ? '#ff6b6b' : '#888' }}>
                                    {s.dropoff === '-' ? '-' : `${s.dropoff}%`}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {/* 퍼널 바 시각화 */}
                        <div className="da-funnel-bars">
                          {f.steps.map((s, i) => (
                            <div key={i} className="da-funnel-step">
                              <div className="da-funnel-label">{s.label}</div>
                              <div className="da-funnel-bar-bg">
                                <div
                                  className="da-funnel-bar-fill"
                                  style={{ width: `${s.rate}%` }}
                                />
                              </div>
                              <div className="da-funnel-pct">{s.rate}%</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* 탭 3: 버튼 분석 */}
            {activeTab === 'button' && buttonStats && (
              <div className="da-tab-content">
                <div className="da-sub-title">화면별 버튼 클릭 상세</div>
                {buttonStats.screenButtonSummary.map(s => (
                  <div key={s.screen} style={{ marginBottom: 16 }}>
                    <div className="da-screen-label">
                      {s.screen} <span className="da-screen-total">총 {s.totalClicks}회</span>
                    </div>
                    <div className="da-table-wrap">
                      <table className="da-table">
                        <thead>
                          <tr>
                            <th>버튼</th>
                            <th>클릭 수</th>
                            <th>사용자 수</th>
                          </tr>
                        </thead>
                        <tbody>
                          {s.buttons.map(b => (
                            <tr key={b.name}>
                              <td>{b.name}</td>
                              <td className="da-num">{b.count}</td>
                              <td className="da-num">{b.userCount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}

                {buttonStats.abButtonComparison.length > 0 && (
                  <>
                    <div className="da-sub-title" style={{ marginTop: 24 }}>A/B안 버튼 클릭 비교</div>
                    {buttonStats.abButtonComparison.map(ab => (
                      <div key={ab.mission} style={{ marginBottom: 16 }}>
                        <div className="da-screen-label">{ab.mission}</div>
                        <div className="da-table-wrap">
                          <table className="da-table">
                            <thead>
                              <tr>
                                <th>버튼</th>
                                <th>A안 클릭</th>
                                <th>A안 사용자</th>
                                <th>B안 클릭</th>
                                <th>B안 사용자</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ab.buttons.map(b => (
                                <tr key={b.name}>
                                  <td>{b.name}</td>
                                  <td className="da-num">{b.countA}</td>
                                  <td className="da-num">{b.usersA}</td>
                                  <td className="da-num">{b.countB}</td>
                                  <td className="da-num">{b.usersB}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
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
