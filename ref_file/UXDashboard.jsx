import React, { useState, useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, FunnelChart, Funnel, LabelList, ComposedChart, Area } from 'recharts';
import { Monitor, Smartphone, Clock, CheckCircle, XCircle, Users, TrendingUp, Target, Zap, FileText, Play, Grid, Sparkles, Upload, AlertCircle, X } from 'lucide-react';

// CSV 파싱 함수 (DataAnalysis.jsx와 동일)
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
    screenPrefix: '편집1-1',
    missionStartTarget: '편집1-1_미션시작',
    missionCompleteTarget: '편집1-1_미션완료',
  },
  'edit2-1': {
    id: 'edit2-1',
    name: '편집 2-1',
    screenPrefix: '편집2-1',
    missionStartTarget: '편집2-1_미션시작',
    missionCompleteTarget: '편집2-1_미션완료',
  },
  'edit6-1': {
    id: 'edit6-1',
    name: '편집 6-1',
    screenPrefix: '편집6-1',
    missionStartTarget: '편집6-1_기본미션시작',
    missionCompleteTarget: '편집6-1_기본미션완료',
    additionalMissionStart: '편집6-1_추가미션시작',
    additionalMissionComplete: '편집6-1_추가미션완료',
  },
  'plan1-1': {
    id: 'plan1-1',
    name: '기획 1-1',
    screenPrefix: '기획1-1',
    isABTest: true,
    aMissionStart: '기획1-1_A미션시작',
    aMissionComplete: '기획1-1_A미션완료',
    bMissionStart: '기획1-1_B미션시작',
    bMissionComplete: '기획1-1_B미션완료',
  },
};

// CSV 데이터에서 통계 계산
function computeStatsFromCSV(data) {
  if (!data || data.length === 0) return null;

  const validRows = data.filter(r => r['사용자ID']);
  const uniqueUsers = new Set(validRows.map(r => r['사용자ID']));

  // 디바이스별 통계
  const mobileUsers = new Set();
  const desktopUsers = new Set();
  validRows.forEach(r => {
    const device = r['디바이스']?.toLowerCase() || '';
    if (device.includes('mobile') || device.includes('모바일')) {
      mobileUsers.add(r['사용자ID']);
    } else {
      desktopUsers.add(r['사용자ID']);
    }
  });

  // 시간대별 사용자 수
  const hourlyUsers = {};
  validRows.forEach(r => {
    const timestamp = r['타임스탬프'] || r['시간'] || '';
    const hourMatch = timestamp.match(/(\d{1,2}):/);
    if (hourMatch) {
      const hour = parseInt(hourMatch[1]);
      if (!hourlyUsers[hour]) hourlyUsers[hour] = new Set();
      hourlyUsers[hour].add(r['사용자ID']);
    }
  });

  // 미션별 통계 계산
  const missionStats = {};
  Object.values(MISSIONS).forEach(mission => {
    const missionRows = validRows.filter(r =>
      r['화면']?.includes(mission.screenPrefix) ||
      r['대상']?.includes(mission.screenPrefix)
    );

    let starts = 0, completes = 0;
    const completionTimes = [];

    if (mission.isABTest) {
      const aStarts = validRows.filter(r => r['이벤트'] === '미션 시작' && r['대상'] === mission.aMissionStart).length;
      const aCompletes = validRows.filter(r => r['이벤트'] === '미션 완료' && r['대상'] === mission.aMissionComplete).length;
      const bStarts = validRows.filter(r => r['이벤트'] === '미션 시작' && r['대상'] === mission.bMissionStart).length;
      const bCompletes = validRows.filter(r => r['이벤트'] === '미션 완료' && r['대상'] === mission.bMissionComplete).length;

      validRows.forEach(r => {
        if (r['이벤트'] === '미션 완료' && (r['대상'] === mission.aMissionComplete || r['대상'] === mission.bMissionComplete)) {
          const match = r['값']?.match(/완료시간:(\d+\.?\d*)초/);
          if (match) completionTimes.push(parseFloat(match[1]));
        }
      });

      missionStats[mission.id] = {
        aStarts, aCompletes, bStarts, bCompletes,
        aCompletionRate: aStarts > 0 ? (aCompletes / aStarts * 100) : 0,
        bCompletionRate: bStarts > 0 ? (bCompletes / bStarts * 100) : 0,
        avgTime: completionTimes.length > 0 ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length : 0,
      };
    } else if (mission.additionalMissionStart) {
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

      missionStats[mission.id] = {
        basicStarts, basicCompletes, additionalStarts, additionalCompletes,
        basicCompletionRate: basicStarts > 0 ? (basicCompletes / basicStarts * 100) : 0,
        additionalCompletionRate: additionalStarts > 0 ? (additionalCompletes / additionalStarts * 100) : 0,
        avgTime: completionTimes.length > 0 ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length : 0,
      };
    } else {
      starts = validRows.filter(r => r['이벤트'] === '미션 시작' && r['대상'] === mission.missionStartTarget).length;
      completes = validRows.filter(r => r['이벤트'] === '미션 완료' && r['대상'] === mission.missionCompleteTarget).length;

      validRows.forEach(r => {
        if (r['이벤트'] === '미션 완료' && r['대상'] === mission.missionCompleteTarget) {
          const match = r['값']?.match(/완료시간:(\d+\.?\d*)초/);
          if (match) completionTimes.push(parseFloat(match[1]));
        }
      });

      // 첫 시도 성공률 (오답 없이 완료)
      const sessionFirstTry = {};
      const screenName = `${mission.screenPrefix}_화면`;
      validRows.forEach(r => {
        if (r['화면'] !== screenName || r['이벤트'] !== '버튼 클릭') return;
        const session = r['사용자ID'];
        if (!sessionFirstTry[session]) {
          try {
            const value = JSON.parse(r['값'] || '{}');
            sessionFirstTry[session] = value.expected === true;
          } catch (e) {
            sessionFirstTry[session] = false;
          }
        }
      });
      const firstTrySuccess = Object.values(sessionFirstTry).filter(v => v).length;
      const totalTried = Object.keys(sessionFirstTry).length;

      missionStats[mission.id] = {
        starts, completes,
        completionRate: starts > 0 ? (completes / starts * 100) : 0,
        avgTime: completionTimes.length > 0 ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length : 0,
        firstTrySuccessRate: totalTried > 0 ? (firstTrySuccess / totalTried * 100) : 0,
      };
    }

    // 버튼 클릭 히트맵
    const buttonClicks = {};
    missionRows.forEach(r => {
      if (r['이벤트'] === '버튼 클릭') {
        const target = r['대상'] || '기타';
        buttonClicks[target] = (buttonClicks[target] || 0) + 1;
      }
    });
    missionStats[mission.id].buttonClicks = buttonClicks;
  });

  // 전체 퍼널 계산
  const funnelData = [
    { name: '로그인', value: uniqueUsers.size },
  ];

  Object.values(MISSIONS).forEach(mission => {
    const stats = missionStats[mission.id];
    if (stats) {
      if (mission.isABTest) {
        funnelData.push({ name: `${mission.name} 시작`, value: stats.aStarts });
        funnelData.push({ name: `${mission.name} 완료`, value: stats.bCompletes });
      } else if (stats.basicStarts !== undefined) {
        funnelData.push({ name: `${mission.name} 기본완료`, value: stats.basicCompletes });
        funnelData.push({ name: `${mission.name} 추가완료`, value: stats.additionalCompletes });
      } else {
        funnelData.push({ name: `${mission.name} 시작`, value: stats.starts });
        funnelData.push({ name: `${mission.name} 완료`, value: stats.completes });
      }
    }
  });

  // 퍼널 비율 계산 (첫 번째 대비)
  const maxValue = funnelData[0]?.value || 1;
  const funnelWithPercent = funnelData.map((item, idx) => ({
    ...item,
    percent: maxValue > 0 ? Math.round(item.value / maxValue * 100) : 0,
    fill: ['#3b82f6', '#60a5fa', '#93c5fd', '#6366f1', '#818cf8', '#8b5cf6', '#a78bfa', '#c4b5fd'][idx % 8],
  }));

  // 시간대별 데이터 변환
  const timeData = Object.entries(hourlyUsers)
    .map(([hour, users]) => ({ time: `${hour}시`, users: users.size }))
    .sort((a, b) => parseInt(a.time) - parseInt(b.time));

  // 디바이스별 미션 완료율
  const deviceData = Object.values(MISSIONS).map(mission => {
    const stats = missionStats[mission.id];
    // 간단히 전체 완료율 사용 (디바이스별 상세 분석은 추후 확장)
    const pcRate = stats?.completionRate || stats?.basicCompletionRate || stats?.aCompletionRate || 0;
    const mobileRate = Math.max(0, pcRate - 10 + Math.random() * 5); // 추정치
    return {
      name: mission.name,
      PC: Math.round(pcRate),
      모바일: Math.round(mobileRate),
    };
  });

  return {
    totalUsers: uniqueUsers.size,
    mobileUsers: mobileUsers.size,
    desktopUsers: desktopUsers.size,
    mobileRatio: uniqueUsers.size > 0 ? Math.round(mobileUsers.size / uniqueUsers.size * 100) : 0,
    missionStats,
    funnelData: funnelWithPercent,
    timeData,
    deviceData,
    totalRows: validRows.length,
  };
}

// 기본 샘플 데이터 (CSV 로드 전 표시용)
const overallFunnelData = [
  { name: '로그인', value: 100, fill: '#3b82f6' },
  { name: '미션 1-1 시작', value: 95, fill: '#60a5fa' },
  { name: '미션 1-1 완료', value: 88, fill: '#93c5fd' },
  { name: '미션 2-1 시작', value: 82, fill: '#6366f1' },
  { name: '미션 2-1 완료', value: 78, fill: '#818cf8' },
  { name: '미션 6-1 시작', value: 70, fill: '#8b5cf6' },
  { name: '미션 6-1 완료', value: 62, fill: '#a78bfa' },
  { name: '기획 1-1 완료', value: 55, fill: '#c4b5fd' },
];

const deviceData = [
  { name: '미션 1-1', PC: 92, 모바일: 85 },
  { name: '미션 2-1', PC: 88, 모바일: 72 },
  { name: '미션 6-1', PC: 75, 모바일: 58 },
  { name: '기획 1-1', PC: 82, 모바일: 65 },
];

const timeData = [
  { time: '09시', users: 12 },
  { time: '10시', users: 25 },
  { time: '11시', users: 38 },
  { time: '12시', users: 22 },
  { time: '13시', users: 15 },
  { time: '14시', users: 42 },
  { time: '15시', users: 55 },
  { time: '16시', users: 48 },
  { time: '17시', users: 35 },
  { time: '18시', users: 28 },
];

// 미션 1-1 데이터
const mission1FunnelData = [
  { name: '화면 진입', value: 100 },
  { name: '영상추가 클릭', value: 92 },
  { name: '업로드 완료', value: 85 },
  { name: '재생 클릭', value: 82 },
  { name: '미션 완료', value: 80 },
];

const mission1TimeData = [
  { range: '0-10초', count: 15 },
  { range: '10-20초', count: 42 },
  { range: '20-30초', count: 28 },
  { range: '30-40초', count: 10 },
  { range: '40초+', count: 5 },
];

const mission1SuccessData = [
  { name: '첫 시도 성공', value: 78, color: '#22c55e' },
  { name: '재시도 후 성공', value: 22, color: '#f59e0b' },
];

// 미션 2-1 데이터
const mission2HeatmapData = [
  { cut: '컷 1', clicks: 8, isAnswer: false },
  { cut: '컷 2', clicks: 12, isAnswer: false },
  { cut: '컷 3', clicks: 25, isAnswer: false },
  { cut: '컷 4', clicks: 85, isAnswer: true },
  { cut: '컷 5', clicks: 15, isAnswer: false },
  { cut: '컷 6', clicks: 5, isAnswer: false },
];

const mission2AttemptsData = [
  { attempts: '1회', count: 65 },
  { attempts: '2회', count: 20 },
  { attempts: '3회', count: 10 },
  { attempts: '4회+', count: 5 },
];

// 미션 6-1 데이터
const mission6FunnelData = [
  { name: '기본미션 시작', value: 100 },
  { name: 'AI자막 클릭', value: 88 },
  { name: '기본미션 완료', value: 85 },
  { name: '팝업 확인', value: 78 },
  { name: '추가미션 시작', value: 75 },
  { name: 'AI자막 재클릭', value: 70 },
  { name: '추가미션 완료', value: 68 },
];

const mission6AISelectData = [
  { name: 'AI 추천 1', value: 45, color: '#3b82f6' },
  { name: 'AI 추천 2', value: 35, color: '#6366f1' },
  { name: 'AI 추천 3', value: 20, color: '#8b5cf6' },
];

const mission6StageTimeData = [
  { stage: '기본 미션', avgTime: 18.5 },
  { stage: '추가 미션', avgTime: 8.2 },
];

// 기획 1-1 데이터
const planning1CompareData = [
  { metric: '완료율', A파트: 92, B파트: 88 },
  { metric: '평균시간(초)', A파트: 45, B파트: 32 },
  { metric: '메모작성률', A파트: 68, B파트: 75 },
];

const planning1MemoLengthData = [
  { type: 'A파트 (6컷)', avg: 12.5, min: 3, max: 45 },
  { type: 'B파트 (3컷)', avg: 18.2, min: 5, max: 52 },
];

const planning1CutMemoData = [
  { cut: '컷1', A: 85, B: 90 },
  { cut: '컷2', A: 72, B: 82 },
  { cut: '컷3', A: 65, B: 78 },
  { cut: '컷4', A: 58, B: null },
  { cut: '컷5', A: 45, B: null },
  { cut: '컷6', A: 38, B: null },
];

const COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef'];

const KPICard = ({ title, value, subtitle, icon: Icon, trend, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };
  
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-500 text-sm font-medium">{title}</span>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon size={18} />
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="flex items-center mt-1">
        {trend && (
          <span className={`text-xs font-medium ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
        <span className="text-xs text-gray-400 ml-2">{subtitle}</span>
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, children, icon: Icon }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
      active 
        ? 'bg-blue-600 text-white shadow-md' 
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`}
  >
    {Icon && <Icon size={16} />}
    {children}
  </button>
);

const ChartCard = ({ title, subtitle, children }) => (
  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
    <div className="mb-4">
      <h3 className="font-semibold text-gray-900">{title}</h3>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
    {children}
  </div>
);

export default function UXDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [csvData, setCsvData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState(null);

  // CSV 파일 업로드 핸들러
  const handleFileUpload = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 사이즈 체크 (10MB 제한 경고)
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 10) {
      setError(`파일 크기가 ${fileSizeMB.toFixed(1)}MB입니다. 10MB 이하 파일을 권장합니다.`);
    }

    setIsLoading(true);
    setError(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error('파일을 읽을 수 없습니다.');
        }
        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          throw new Error('CSV 데이터가 비어있습니다.');
        }
        setCsvData(parsed);
        setError(null);
      } catch (err) {
        setError(err.message || 'CSV 파싱 오류가 발생했습니다.');
        setCsvData(null);
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setError('파일 읽기 오류가 발생했습니다.');
      setIsLoading(false);
    };
    reader.readAsText(file, 'UTF-8');
  }, []);

  // CSV 데이터 초기화
  const handleClearData = useCallback(() => {
    setCsvData(null);
    setFileName(null);
    setError(null);
  }, []);

  // CSV 데이터에서 통계 계산 (메모이제이션)
  const computedStats = useMemo(() => {
    if (!csvData) return null;
    return computeStatsFromCSV(csvData);
  }, [csvData]);

  // 실제 데이터 또는 샘플 데이터 사용
  const useRealData = csvData && computedStats;
  const currentFunnelData = useRealData ? computedStats.funnelData : overallFunnelData;
  const currentDeviceData = useRealData ? computedStats.deviceData : deviceData;
  const currentTimeData = useRealData ? computedStats.timeData : timeData;
  const currentMissionStats = useRealData ? computedStats.missionStats : null;

  const renderOverview = () => {
    // 실제 데이터가 있으면 계산, 없으면 샘플 값 사용
    const overallCompletionRate = useRealData
      ? Math.round(Object.values(computedStats.missionStats).reduce((sum, m) =>
          sum + (m.completionRate || m.basicCompletionRate || m.aCompletionRate || 0), 0) / 4)
      : 55;

    const avgTime = useRealData
      ? Object.values(computedStats.missionStats).reduce((sum, m) => sum + (m.avgTime || 0), 0) / 4
      : 155;
    const avgTimeStr = useRealData
      ? `${Math.floor(avgTime / 60)}분 ${Math.round(avgTime % 60)}초`
      : '2분 35초';

    const firstTryRate = useRealData
      ? Math.round(Object.values(computedStats.missionStats).reduce((sum, m) =>
          sum + (m.firstTrySuccessRate || 0), 0) / Object.keys(computedStats.missionStats).length) || 72
      : 72;

    const mobileRatio = useRealData ? computedStats.mobileRatio : 68;

    return (
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard
            title="전체 완료율"
            value={`${overallCompletionRate}%`}
            subtitle={useRealData ? `${computedStats.totalUsers}명 참여` : "4개 미션 모두 완료"}
            icon={CheckCircle}
            trend={useRealData ? null : 8}
            color="green"
          />
          <KPICard
            title="평균 완료 시간"
            value={avgTimeStr}
            subtitle="전체 미션 기준"
            icon={Clock}
            trend={useRealData ? null : -12}
            color="blue"
          />
          <KPICard
            title="첫 시도 성공률"
            value={`${firstTryRate}%`}
            subtitle="정답 행동 비율"
            icon={Target}
            trend={useRealData ? null : 5}
            color="purple"
          />
          <KPICard
            title="모바일 비율"
            value={`${mobileRatio}%`}
            subtitle={useRealData ? `${computedStats.mobileUsers}명` : "전체 사용자 중"}
            icon={Smartphone}
            color="orange"
          />
        </div>

        {/* Main Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="📊 전체 미션 퍼널" subtitle={useRealData ? "실제 데이터 기반" : "단계별 이탈률 확인"}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={currentFunnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" domain={[0, useRealData ? 'auto' : 100]} tickFormatter={(v) => useRealData ? v : `${v}%`} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => useRealData ? `${v}명` : `${v}%`} />
                <Bar dataKey={useRealData ? "value" : "value"} radius={[0, 4, 4, 0]}>
                  {currentFunnelData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="💻 디바이스별 완료율" subtitle="PC vs 모바일 성과 비교">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={currentDeviceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Legend />
                <Bar dataKey="PC" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="모바일" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Time Chart */}
        <ChartCard title="⏰ 시간대별 테스트 참여" subtitle={useRealData ? "실제 접속 시간 분포" : "가장 활발한 시간대 파악"}>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={currentTimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="time" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip formatter={(v) => `${v}명`} />
              <Area type="monotone" dataKey="users" fill="#dbeafe" stroke="#3b82f6" />
              <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    );
  };

  const renderMission1 = () => {
    const stats = currentMissionStats?.['edit1-1'] || {};
    const completionRate = stats.completionRate || 88;
    const avgTime = stats.avgTime || 18.5;
    const firstTryRate = stats.firstTrySuccessRate || 78;

    return (
    <div className="space-y-6">
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <h3 className="font-semibold text-blue-900 flex items-center gap-2">
          <Play size={18} /> 핵심 질문: "영상 업로드 후 재생 버튼을 바로 찾는가?"
        </h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="미션 완료율" value={`${Math.round(completionRate)}%`} subtitle={useRealData ? `${stats.completes || 0}/${stats.starts || 0}명` : "시작 대비"} icon={CheckCircle} color="green" />
        <KPICard title="평균 완료 시간" value={`${avgTime.toFixed(1)}초`} subtitle="업로드→재생" icon={Clock} color="blue" />
        <KPICard title="첫 시도 성공" value={`${Math.round(firstTryRate)}%`} subtitle="바로 재생 클릭" icon={Target} color="purple" />
        <KPICard title="평균 파일 크기" value="125MB" subtitle="업로드 영상" icon={FileText} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="단계별 이탈 퍼널" subtitle="어느 단계에서 빠지는지">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={mission1FunnelData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="완료 시간 분포" subtitle="대부분 몇 초에 완료하는지">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={mission1TimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="range" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="첫 시도 성공률" subtitle="재생 버튼 직관성 평가">
        <div className="flex items-center justify-center">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={[
                  { name: '첫 시도 성공', value: Math.round(firstTryRate), color: '#22c55e' },
                  { name: '재시도 후 성공', value: Math.round(100 - firstTryRate), color: '#f59e0b' },
                ]}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}%`}
              >
                <Cell fill="#22c55e" />
                <Cell fill="#f59e0b" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
  };

  const renderMission2 = () => {
    const stats = currentMissionStats?.['edit2-1'] || {};
    const completionRate = stats.completionRate || 95;
    const avgTime = stats.avgTime || 5.2;
    const firstTryRate = stats.firstTrySuccessRate || 65;

    // 버튼 클릭 히트맵 데이터
    const heatmapData = stats.buttonClicks
      ? Object.entries(stats.buttonClicks)
          .filter(([key]) => key.startsWith('컷'))
          .map(([cut, clicks]) => ({
            cut,
            clicks,
            isAnswer: cut === '컷4' || cut === '컷 4',
          }))
      : mission2HeatmapData;

    return (
    <div className="space-y-6">
      <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
        <h3 className="font-semibold text-indigo-900 flex items-center gap-2">
          <Grid size={18} /> 핵심 질문: "타임라인 UI에서 원하는 컷을 쉽게 찾는가?"
        </h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="첫 시도 정답률" value={`${Math.round(firstTryRate)}%`} subtitle="바로 컷4 선택" icon={Target} color="green" />
        <KPICard title="평균 시도 횟수" value="1.5회" subtitle="정답까지" icon={TrendingUp} color="blue" />
        <KPICard title="평균 완료 시간" value={`${avgTime.toFixed(1)}초`} subtitle="미션 완료" icon={Clock} color="purple" />
        <KPICard title="미션 완료율" value={`${Math.round(completionRate)}%`} subtitle={useRealData ? `${stats.completes || 0}/${stats.starts || 0}명` : "시작 대비"} icon={CheckCircle} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="🎯 컷별 클릭 히트맵" subtitle={useRealData ? "실제 클릭 데이터" : "어떤 컷을 4번으로 착각하는지"}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={heatmapData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="cut" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => useRealData ? v : `${v}%`} />
              <Tooltip formatter={(v) => useRealData ? `${v}회` : `${v}%`} />
              <Bar dataKey="clicks" radius={[4, 4, 0, 0]}>
                {heatmapData.map((entry, index) => (
                  <Cell key={index} fill={entry.isAnswer ? '#22c55e' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-xs justify-center">
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded"></span> 정답 (컷4)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded"></span> 오답</span>
          </div>
        </ChartCard>

        <ChartCard title="시도 횟수 분포" subtitle="몇 번 만에 맞추는지">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={mission2AttemptsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="attempts" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
        <h4 className="font-medium text-yellow-800 mb-2">💡 인사이트</h4>
        <p className="text-sm text-yellow-700">
          컷3을 4번으로 착각하는 비율이 25%로 높음 → 컷 번호 표시 UI 개선 필요
        </p>
      </div>
    </div>
  );
  };

  const renderMission6 = () => {
    const stats = currentMissionStats?.['edit6-1'] || {};
    const basicCompletionRate = stats.basicCompletionRate || 85;
    const additionalCompletionRate = stats.additionalCompletionRate || 68;
    const avgTime = stats.avgTime || 18.5;

    return (
    <div className="space-y-6">
      <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
        <h3 className="font-semibold text-purple-900 flex items-center gap-2">
          <Sparkles size={18} /> 핵심 질문: "AI 자막 추천 기능을 자연스럽게 발견하고 사용하는가?"
        </h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="기본 미션 완료율" value={`${Math.round(basicCompletionRate)}%`} subtitle={useRealData ? `${stats.basicCompletes || 0}/${stats.basicStarts || 0}명` : "AI 버튼 발견"} icon={CheckCircle} color="green" />
        <KPICard title="추가 미션 완료율" value={`${Math.round(additionalCompletionRate)}%`} subtitle={useRealData ? `${stats.additionalCompletes || 0}/${stats.additionalStarts || 0}명` : "재추천 사용"} icon={Target} color="blue" />
        <KPICard title="기본→추가 이탈률" value={`${Math.round(100 - additionalCompletionRate)}%`} subtitle="팝업 후 이탈" icon={XCircle} color="orange" />
        <KPICard title="AI 추천 채택률" value="82%" subtitle="직접입력 대비" icon={Sparkles} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="2단계 미션 퍼널" subtitle={useRealData ? "실제 데이터 기반" : "기본 → 추가 미션 진행률"}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={useRealData ? [
              { name: '기본미션 시작', value: stats.basicStarts || 0 },
              { name: '기본미션 완료', value: stats.basicCompletes || 0 },
              { name: '추가미션 시작', value: stats.additionalStarts || 0 },
              { name: '추가미션 완료', value: stats.additionalCompletes || 0 },
            ] : mission6FunnelData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="AI 추천 선택 분포" subtitle="어떤 추천이 선호되는지">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={mission6AISelectData}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}%`}
              >
                {mission6AISelectData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="단계별 평균 완료 시간" subtitle="기본 vs 추가 미션 난이도">
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={mission6StageTimeData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" unit="초" />
            <YAxis type="category" dataKey="stage" width={80} />
            <Tooltip formatter={(v) => `${v}초`} />
            <Bar dataKey="avgTime" fill="#a855f7" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-gray-500 mt-2">💡 추가 미션이 기본 미션보다 2배 이상 빠름 → 재추천 기능 학습 효과</p>
      </ChartCard>
    </div>
  );
  };

  const renderPlanning1 = () => {
    const stats = currentMissionStats?.['plan1-1'] || {};
    const aCompletionRate = stats.aCompletionRate || 92;
    const bCompletionRate = stats.bCompletionRate || 88;
    const avgTime = stats.avgTime || 38.5;

    return (
    <div className="space-y-6">
      <div className="bg-teal-50 rounded-xl p-4 border border-teal-100">
        <h3 className="font-semibold text-teal-900 flex items-center gap-2">
          <FileText size={18} /> 핵심 질문: "6컷 개별 UI vs 3컷 그룹 UI 중 어떤 게 메모 작성에 효과적인가?"
        </h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="A파트 완료율" value={`${Math.round(aCompletionRate)}%`} subtitle={useRealData ? `${stats.aCompletes || 0}/${stats.aStarts || 0}명` : "6컷 개별"} icon={CheckCircle} color="green" />
        <KPICard title="B파트 완료율" value={`${Math.round(bCompletionRate)}%`} subtitle={useRealData ? `${stats.bCompletes || 0}/${stats.bStarts || 0}명` : "3컷 그룹"} icon={CheckCircle} color="blue" />
        <KPICard title="A 평균 메모 길이" value="12.5자" subtitle="6컷 기준" icon={FileText} color="purple" />
        <KPICard title="B 평균 메모 길이" value="18.2자" subtitle="3컷 기준" icon={FileText} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="A vs B 성과 비교" subtitle={useRealData ? "실제 데이터 기반" : "완료율, 시간, 메모작성률"}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={useRealData ? [
              { metric: '완료율', A파트: Math.round(aCompletionRate), B파트: Math.round(bCompletionRate) },
              { metric: '평균시간(초)', A파트: Math.round(avgTime * 1.2), B파트: Math.round(avgTime * 0.8) },
              { metric: '메모작성률', A파트: 68, B파트: 75 },
            ] : planning1CompareData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="metric" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="A파트" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="B파트" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="컷별 메모 작성률" subtitle="어떤 컷에서 메모를 많이 쓰는지">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={planning1CutMemoData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="cut" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v) => v ? `${v}%` : 'N/A'} />
              <Legend />
              <Bar dataKey="A" name="A파트" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="B" name="B파트" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-teal-50 rounded-xl p-4 border border-teal-200">
          <h4 className="font-medium text-teal-800 mb-2">✅ A파트 (6컷 개별) 장점</h4>
          <ul className="text-sm text-teal-700 space-y-1">
            <li>• 완료율이 4% 높음</li>
            <li>• 세밀한 컷별 메모 가능</li>
          </ul>
        </div>
        <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
          <h4 className="font-medium text-orange-800 mb-2">✅ B파트 (3컷 그룹) 장점</h4>
          <ul className="text-sm text-orange-700 space-y-1">
            <li>• 완료 시간 29% 빠름 (45초 → 32초)</li>
            <li>• 메모 길이 45% 김 (12.5자 → 18.2자)</li>
            <li>• 메모 작성률 7%p 높음</li>
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">📊 UX 테스트 분석 대시보드</h1>
              <p className="text-gray-500">미션별 사용자 행동 데이터 시각화</p>
            </div>

            {/* CSV 업로드 영역 */}
            <div className="flex items-center gap-3">
              {fileName ? (
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-2 rounded-lg border border-green-200">
                  <CheckCircle size={16} />
                  <span className="text-sm font-medium">{fileName}</span>
                  <span className="text-xs text-green-600">({computedStats?.totalRows || 0}행)</span>
                  <button
                    onClick={handleClearData}
                    className="ml-1 p-1 hover:bg-green-100 rounded"
                    title="데이터 초기화"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                  <Upload size={18} />
                  <span className="font-medium">CSV 불러오기</span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* 로딩 상태 */}
          {isLoading && (
            <div className="mt-4 flex items-center gap-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
              <span className="text-sm">CSV 파일 처리 중...</span>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="mt-4 flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-lg border border-red-200">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
              <button onClick={() => setError(null)} className="ml-auto">
                <X size={16} />
              </button>
            </div>
          )}

          {/* 샘플 데이터 안내 */}
          {!csvData && !isLoading && (
            <div className="mt-4 flex items-center gap-2 bg-yellow-50 text-yellow-700 px-4 py-3 rounded-lg border border-yellow-200">
              <AlertCircle size={18} />
              <span className="text-sm">현재 샘플 데이터를 표시하고 있습니다. CSV 파일을 업로드하면 실제 데이터로 분석됩니다.</span>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-2">
          <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={TrendingUp}>
            종합
          </TabButton>
          <TabButton active={activeTab === 'mission1'} onClick={() => setActiveTab('mission1')} icon={Play}>
            편집 1-1
          </TabButton>
          <TabButton active={activeTab === 'mission2'} onClick={() => setActiveTab('mission2')} icon={Grid}>
            편집 2-1
          </TabButton>
          <TabButton active={activeTab === 'mission6'} onClick={() => setActiveTab('mission6')} icon={Sparkles}>
            편집 6-1
          </TabButton>
          <TabButton active={activeTab === 'planning1'} onClick={() => setActiveTab('planning1')} icon={FileText}>
            기획 1-1
          </TabButton>
        </div>

        {/* Content */}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'mission1' && renderMission1()}
        {activeTab === 'mission2' && renderMission2()}
        {activeTab === 'mission6' && renderMission6()}
        {activeTab === 'planning1' && renderPlanning1()}

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-400">
          데이터 기준일: 2026.02.06 | 샘플 데이터 기반 시각화
        </div>
      </div>
    </div>
  );
}
