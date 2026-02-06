import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
  ComposedChart, Area
} from 'recharts';
import {
  Monitor, Smartphone, Clock, CheckCircle, XCircle, Users,
  TrendingUp, Target, Zap, FileText, Upload, Database,
  Play, Grid, Sparkles
} from 'lucide-react';
import './DataVisualizer.css';

// 샘플 데이터 (Tracking_Sheet_260206_04.csv 기반)
const SAMPLE_DATA = {
  // 전체 미션 퍼널
  funnel: [
    { name: '로그인', value: 100, fill: '#3b82f6' },
    { name: '미션 1-1 시작', value: 95, fill: '#60a5fa' },
    { name: '미션 1-1 완료', value: 88, fill: '#93c5fd' },
    { name: '미션 2-1 시작', value: 82, fill: '#6366f1' },
    { name: '미션 2-1 완료', value: 78, fill: '#818cf8' },
    { name: '미션 6-1 시작', value: 70, fill: '#8b5cf6' },
    { name: '미션 6-1 완료', value: 62, fill: '#a78bfa' },
  ],
  // 미션별 디바이스 완료율
  device: [
    { name: '편집 1-1', PC: 92, 모바일: 85 },
    { name: '편집 2-1', PC: 88, 모바일: 72 },
    { name: '편집 6-1', PC: 75, 모바일: 58 },
    { name: '기획 1-1', PC: 82, 모바일: 65 },
  ],
  // 시간대별 테스트 참여
  time: [
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
  ],
  // 디바이스 분포
  category: [
    { name: '모바일', value: 68, color: '#f59e0b' },
    { name: 'PC', value: 28, color: '#3b82f6' },
    { name: '태블릿', value: 4, color: '#22c55e' },
  ],
  // 미션별 완료율
  missionCompletion: [
    { name: '편집 1-1', rate: 88, avgTime: 9.3 },
    { name: '편집 2-1', rate: 78, avgTime: 4.0 },
    { name: '편집 6-1', rate: 62, avgTime: 18.5 },
    { name: '기획 1-1', rate: 55, avgTime: 32.0 },
  ],
  // 편집 1-1 상세 퍼널
  mission1Funnel: [
    { name: '화면 진입', value: 100, fill: '#3b82f6' },
    { name: '영상추가 클릭', value: 92, fill: '#60a5fa' },
    { name: '업로드 완료', value: 85, fill: '#93c5fd' },
    { name: '재생 클릭', value: 82, fill: '#6366f1' },
    { name: '미션 완료', value: 80, fill: '#818cf8' },
  ],
  // 편집 2-1 컷 선택 분포
  cutSelection: [
    { cut: '컷 1', clicks: 8, isAnswer: false },
    { cut: '컷 2', clicks: 12, isAnswer: false },
    { cut: '컷 3', clicks: 25, isAnswer: false },
    { cut: '컷 4', clicks: 85, isAnswer: true },
    { cut: '컷 5', clicks: 15, isAnswer: false },
    { cut: '컷 6', clicks: 5, isAnswer: false },
  ],
  // 완료 시간 분포
  completionTime: [
    { range: '0-5초', count: 15 },
    { range: '5-10초', count: 42 },
    { range: '10-15초', count: 28 },
    { range: '15-20초', count: 10 },
    { range: '20초+', count: 5 },
  ],
  // 첫 시도 성공률
  firstTrySuccess: [
    { name: '첫 시도 성공', value: 78, color: '#22c55e' },
    { name: '재시도 후 성공', value: 22, color: '#f59e0b' },
  ],
  // KPI 데이터
  kpi: {
    totalUsers: 32,
    conversionRate: 62,
    avgTime: '9.3초',
    mobileRatio: 68,
    firstTryRate: 78,
    completionRate: 88,
  }
};

// CSV 파싱 함수
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

// KPI 카드 컴포넌트
const KPICard = ({ title, value, subtitle, icon: Icon, trend, color = 'blue' }) => {
  const colorClasses = {
    blue: 'dv-kpi-icon-blue',
    green: 'dv-kpi-icon-green',
    purple: 'dv-kpi-icon-purple',
    orange: 'dv-kpi-icon-orange',
  };

  return (
    <div className="dv-kpi-card">
      <div className="dv-kpi-header">
        <span className="dv-kpi-title">{title}</span>
        <div className={`dv-kpi-icon ${colorClasses[color]}`}>
          <Icon size={18} />
        </div>
      </div>
      <div className="dv-kpi-value">{value}</div>
      <div className="dv-kpi-footer">
        {trend !== undefined && (
          <span className={`dv-kpi-trend ${trend > 0 ? 'positive' : 'negative'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
        <span className="dv-kpi-subtitle">{subtitle}</span>
      </div>
    </div>
  );
};

// 차트 카드 컴포넌트
const ChartCard = ({ title, subtitle, children }) => (
  <div className="dv-chart-card">
    <div className="dv-chart-header">
      <h3 className="dv-chart-title">{title}</h3>
      {subtitle && <p className="dv-chart-subtitle">{subtitle}</p>}
    </div>
    {children}
  </div>
);

// 메인 컴포넌트
export default function DataVisualizer({ onBack }) {
  const [viewMode, setViewMode] = useState('pc'); // 'pc' | 'mobile'
  const [useSampleData, setUseSampleData] = useState(true);
  const [csvData, setCsvData] = useState(null);
  const [fileName, setFileName] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // CSV 파일 업로드 처리
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const parsed = parseCSV(text);
      setCsvData(parsed);
      setUseSampleData(false);
    };
    reader.readAsText(file, 'UTF-8');
  };

  // 샘플 데이터 사용 토글
  const handleSampleToggle = () => {
    setUseSampleData(true);
    setCsvData(null);
    setFileName('');
  };

  // 현재 데이터 (샘플 또는 CSV)
  const currentData = useMemo(() => {
    if (useSampleData || !csvData) {
      return SAMPLE_DATA;
    }
    // CSV 데이터 변환 로직 (필요시 확장)
    return SAMPLE_DATA;
  }, [useSampleData, csvData]);

  // 개요 탭 렌더링
  const renderOverview = () => (
    <div className="dv-section">
      {/* KPI 카드 */}
      <div className="dv-kpi-grid">
        <KPICard
          title="전체 완료율"
          value={`${currentData.kpi.completionRate}%`}
          subtitle="4개 미션 모두 완료"
          icon={CheckCircle}
          trend={8}
          color="green"
        />
        <KPICard
          title="평균 완료 시간"
          value={currentData.kpi.avgTime}
          subtitle="미션 1-1 기준"
          icon={Clock}
          trend={-12}
          color="blue"
        />
        <KPICard
          title="첫 시도 성공률"
          value={`${currentData.kpi.firstTryRate}%`}
          subtitle="정답 행동 비율"
          icon={Target}
          trend={5}
          color="purple"
        />
        <KPICard
          title="모바일 비율"
          value={`${currentData.kpi.mobileRatio}%`}
          subtitle="전체 사용자 중"
          icon={Smartphone}
          color="orange"
        />
      </div>

      {/* 메인 차트 */}
      <div className="dv-charts-grid">
        <ChartCard title="전체 미션 퍼널" subtitle="단계별 이탈률 확인">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={currentData.funnel} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {currentData.funnel.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="디바이스별 완료율" subtitle="PC vs 모바일 성과 비교">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={currentData.device}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
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

      {/* 시간대별 차트 */}
      <ChartCard title="시간대별 테스트 참여" subtitle="가장 활발한 시간대 파악">
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={currentData.time}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="time" tick={{ fontSize: 11 }} />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="users" fill="#dbeafe" stroke="#3b82f6" />
            <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );

  // 사용자 분석 탭 렌더링
  const renderUsers = () => (
    <div className="dv-section">
      <div className="dv-charts-grid">
        <ChartCard title="디바이스 분포" subtitle="모바일/PC/태블릿 비율">
          <div className="dv-pie-container">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={currentData.category}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {currentData.category.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="첫 시도 성공률" subtitle="재생 버튼 직관성 평가">
          <div className="dv-pie-container">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={currentData.firstTrySuccess}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {currentData.firstTrySuccess.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <ChartCard title="컷 선택 히트맵 (편집 2-1)" subtitle="어떤 컷을 4번으로 착각하는지">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={currentData.cutSelection}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="cut" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v) => `${v}%`} />
            <Tooltip formatter={(v) => `${v}%`} />
            <Bar dataKey="clicks" radius={[4, 4, 0, 0]}>
              {currentData.cutSelection.map((entry, index) => (
                <Cell key={index} fill={entry.isAnswer ? '#22c55e' : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="dv-legend-row">
          <span className="dv-legend-item"><span className="dv-legend-dot success"></span> 정답 (컷4)</span>
          <span className="dv-legend-item"><span className="dv-legend-dot error"></span> 오답</span>
        </div>
      </ChartCard>

      {/* 인사이트 카드 */}
      <div className="dv-insight-card">
        <div className="dv-insight-icon">
          <Zap size={20} />
        </div>
        <div className="dv-insight-content">
          <h4 className="dv-insight-title">주요 인사이트</h4>
          <ul className="dv-insight-list">
            <li>모바일 사용자가 68%로 대다수를 차지합니다.</li>
            <li>컷3을 4번으로 착각하는 비율이 25%로 높음 → 컷 번호 표시 UI 개선 필요</li>
            <li>첫 시도 성공률 78% → 재생 버튼 발견성 양호</li>
          </ul>
        </div>
      </div>
    </div>
  );

  // 성과 분석 탭 렌더링
  const renderPerformance = () => (
    <div className="dv-section">
      <div className="dv-performance-grid">
        <div className="dv-metric-card">
          <div className="dv-metric-header">
            <CheckCircle className="dv-metric-icon success" size={24} />
            <span className="dv-metric-label">편집 1-1</span>
          </div>
          <div className="dv-metric-value">88%</div>
          <div className="dv-metric-bar">
            <div className="dv-metric-bar-fill success" style={{ width: '88%' }} />
          </div>
          <div className="dv-metric-desc">평균 9.3초 완료</div>
        </div>

        <div className="dv-metric-card">
          <div className="dv-metric-header">
            <TrendingUp className="dv-metric-icon growth" size={24} />
            <span className="dv-metric-label">편집 2-1</span>
          </div>
          <div className="dv-metric-value">78%</div>
          <div className="dv-metric-bar">
            <div className="dv-metric-bar-fill growth" style={{ width: '78%' }} />
          </div>
          <div className="dv-metric-desc">평균 4.0초 완료</div>
        </div>

        <div className="dv-metric-card">
          <div className="dv-metric-header">
            <Target className="dv-metric-icon warning" size={24} />
            <span className="dv-metric-label">편집 6-1</span>
          </div>
          <div className="dv-metric-value">62%</div>
          <div className="dv-metric-bar">
            <div className="dv-metric-bar-fill warning" style={{ width: '62%' }} />
          </div>
          <div className="dv-metric-desc">평균 18.5초 완료</div>
        </div>
      </div>

      <ChartCard title="편집 1-1 단계별 퍼널" subtitle="어느 단계에서 이탈하는지">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={currentData.mission1Funnel} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
            <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => `${v}%`} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {currentData.mission1Funnel.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="완료 시간 분포" subtitle="대부분 몇 초에 완료하는지">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={currentData.completionTime}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="range" tick={{ fontSize: 11 }} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );

  return (
    <div className={`dv-container ${viewMode === 'mobile' ? 'mobile-view' : ''}`}>
      {/* 헤더 */}
      <div className="dv-header">
        <button className="dv-back-btn" onClick={onBack}>←</button>
        <h1 className="dv-title">데이터 시각화</h1>
      </div>

      {/* 컨트롤 영역 */}
      <div className="dv-controls">
        {/* 데이터 소스 선택 */}
        <div className="dv-data-source">
          <label className="dv-upload-btn">
            <Upload size={16} />
            <span>CSV 불러오기</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </label>
          <button
            className={`dv-sample-btn ${useSampleData ? 'active' : ''}`}
            onClick={handleSampleToggle}
          >
            <Database size={16} />
            <span>샘플 데이터</span>
          </button>
          {fileName && !useSampleData && (
            <span className="dv-file-name">{fileName}</span>
          )}
        </div>

        {/* 뷰 모드 선택 */}
        <div className="dv-view-toggle">
          <button
            className={`dv-view-btn ${viewMode === 'pc' ? 'active' : ''}`}
            onClick={() => setViewMode('pc')}
          >
            <Monitor size={16} />
            <span>PC</span>
          </button>
          <button
            className={`dv-view-btn ${viewMode === 'mobile' ? 'active' : ''}`}
            onClick={() => setViewMode('mobile')}
          >
            <Smartphone size={16} />
            <span>모바일</span>
          </button>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="dv-tabs">
        <button
          className={`dv-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <TrendingUp size={16} />
          <span>개요</span>
        </button>
        <button
          className={`dv-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={16} />
          <span>사용자</span>
        </button>
        <button
          className={`dv-tab ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          <Target size={16} />
          <span>성과</span>
        </button>
      </div>

      {/* 프리뷰 컨테이너 */}
      <div className={`dv-preview-container ${viewMode === 'mobile' ? 'mobile' : 'pc'}`}>
        <div className="dv-preview-frame">
          <div className="dv-content">
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'users' && renderUsers()}
            {activeTab === 'performance' && renderPerformance()}
          </div>

          {/* 푸터 */}
          <div className="dv-footer">
            데이터 기준일: {new Date().toLocaleDateString('ko-KR')} |
            {useSampleData ? ' 샘플 데이터' : ` ${fileName}`}
          </div>
        </div>
      </div>
    </div>
  );
}
