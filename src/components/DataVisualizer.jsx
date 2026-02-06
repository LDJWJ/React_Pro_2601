import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
  ComposedChart, Area
} from 'recharts';
import {
  Monitor, Smartphone, Clock, CheckCircle, XCircle, Users,
  TrendingUp, Target, Zap, FileText, Upload, Database
} from 'lucide-react';
import './DataVisualizer.css';

// 샘플 데이터
const SAMPLE_DATA = {
  funnel: [
    { name: '페이지 방문', value: 100, fill: '#3b82f6' },
    { name: '회원가입 시작', value: 85, fill: '#60a5fa' },
    { name: '정보 입력', value: 72, fill: '#93c5fd' },
    { name: '이메일 인증', value: 65, fill: '#6366f1' },
    { name: '가입 완료', value: 58, fill: '#818cf8' },
  ],
  device: [
    { name: '1주차', PC: 68, 모바일: 45 },
    { name: '2주차', PC: 72, 모바일: 52 },
    { name: '3주차', PC: 78, 모바일: 58 },
    { name: '4주차', PC: 82, 모바일: 65 },
  ],
  time: [
    { time: '09시', users: 15 },
    { time: '10시', users: 28 },
    { time: '11시', users: 42 },
    { time: '12시', users: 35 },
    { time: '13시', users: 22 },
    { time: '14시', users: 48 },
    { time: '15시', users: 62 },
    { time: '16시', users: 55 },
    { time: '17시', users: 45 },
    { time: '18시', users: 32 },
  ],
  category: [
    { name: '신규 사용자', value: 45, color: '#3b82f6' },
    { name: '재방문', value: 35, color: '#22c55e' },
    { name: '휴면 복귀', value: 20, color: '#f59e0b' },
  ],
  conversion: [
    { stage: '인지', rate: 100 },
    { stage: '관심', rate: 72 },
    { stage: '고려', rate: 48 },
    { stage: '구매', rate: 28 },
    { stage: '충성', rate: 15 },
  ],
  kpi: {
    totalUsers: 1248,
    conversionRate: 58,
    avgTime: '2분 35초',
    mobileRatio: 68,
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
          title="총 사용자"
          value={currentData.kpi.totalUsers.toLocaleString()}
          subtitle="이번 주 기준"
          icon={Users}
          trend={12}
          color="blue"
        />
        <KPICard
          title="전환율"
          value={`${currentData.kpi.conversionRate}%`}
          subtitle="목표 대비"
          icon={Target}
          trend={8}
          color="green"
        />
        <KPICard
          title="평균 체류시간"
          value={currentData.kpi.avgTime}
          subtitle="전체 페이지"
          icon={Clock}
          trend={-5}
          color="purple"
        />
        <KPICard
          title="모바일 비율"
          value={`${currentData.kpi.mobileRatio}%`}
          subtitle="전체 트래픽"
          icon={Smartphone}
          color="orange"
        />
      </div>

      {/* 메인 차트 */}
      <div className="dv-charts-grid">
        <ChartCard title="사용자 퍼널 분석" subtitle="단계별 전환율 추적">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={currentData.funnel} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {currentData.funnel.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="디바이스별 성과 비교" subtitle="PC vs 모바일 전환율">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={currentData.device}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
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
      <ChartCard title="시간대별 사용자 활동" subtitle="피크 타임 분석">
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={currentData.time}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="time" tick={{ fontSize: 12 }} />
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
        <ChartCard title="사용자 유형 분포" subtitle="신규/재방문/휴면 비율">
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

        <ChartCard title="전환 단계별 분석" subtitle="마케팅 퍼널 성과">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={currentData.conversion} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="stage" width={60} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="rate" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* 인사이트 카드 */}
      <div className="dv-insight-card">
        <div className="dv-insight-icon">
          <Zap size={20} />
        </div>
        <div className="dv-insight-content">
          <h4 className="dv-insight-title">주요 인사이트</h4>
          <ul className="dv-insight-list">
            <li>신규 사용자 유입이 전월 대비 12% 증가했습니다.</li>
            <li>모바일 사용자의 전환율이 PC보다 15% 낮습니다. 모바일 UX 개선이 필요합니다.</li>
            <li>오후 3시(15시)에 사용자 활동이 가장 활발합니다.</li>
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
            <span className="dv-metric-label">목표 달성</span>
          </div>
          <div className="dv-metric-value">85%</div>
          <div className="dv-metric-bar">
            <div className="dv-metric-bar-fill success" style={{ width: '85%' }} />
          </div>
          <div className="dv-metric-desc">월간 목표 대비 달성률</div>
        </div>

        <div className="dv-metric-card">
          <div className="dv-metric-header">
            <TrendingUp className="dv-metric-icon growth" size={24} />
            <span className="dv-metric-label">성장률</span>
          </div>
          <div className="dv-metric-value">+23%</div>
          <div className="dv-metric-bar">
            <div className="dv-metric-bar-fill growth" style={{ width: '73%' }} />
          </div>
          <div className="dv-metric-desc">전월 대비 성장률</div>
        </div>

        <div className="dv-metric-card">
          <div className="dv-metric-header">
            <XCircle className="dv-metric-icon warning" size={24} />
            <span className="dv-metric-label">이탈률</span>
          </div>
          <div className="dv-metric-value">32%</div>
          <div className="dv-metric-bar">
            <div className="dv-metric-bar-fill warning" style={{ width: '32%' }} />
          </div>
          <div className="dv-metric-desc">첫 페이지 이탈률</div>
        </div>
      </div>

      <ChartCard title="주간 성과 추이" subtitle="최근 4주간 디바이스별 전환율">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={currentData.device}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={(v) => `${v}%`} />
            <Tooltip formatter={(v) => `${v}%`} />
            <Legend />
            <Line type="monotone" dataKey="PC" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 5 }} />
            <Line type="monotone" dataKey="모바일" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', r: 5 }} />
          </LineChart>
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
