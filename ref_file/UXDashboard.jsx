import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, FunnelChart, Funnel, LabelList, ComposedChart, Area } from 'recharts';
import { Monitor, Smartphone, Clock, CheckCircle, XCircle, Users, TrendingUp, Target, Zap, FileText, Play, Grid, Sparkles } from 'lucide-react';

// 샘플 데이터 (실제 CSV 기반 추정)
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

  const renderOverview = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="전체 완료율" value="55%" subtitle="4개 미션 모두 완료" icon={CheckCircle} trend={8} color="green" />
        <KPICard title="평균 완료 시간" value="2분 35초" subtitle="전체 미션 기준" icon={Clock} trend={-12} color="blue" />
        <KPICard title="첫 시도 성공률" value="72%" subtitle="정답 행동 비율" icon={Target} trend={5} color="purple" />
        <KPICard title="모바일 비율" value="68%" subtitle="전체 사용자 중" icon={Smartphone} color="orange" />
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="📊 전체 미션 퍼널" subtitle="단계별 이탈률 확인">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={overallFunnelData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {overallFunnelData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="💻 디바이스별 완료율" subtitle="PC vs 모바일 성과 비교">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={deviceData}>
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
      <ChartCard title="⏰ 시간대별 테스트 참여" subtitle="가장 활발한 시간대 파악">
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={timeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
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

  const renderMission1 = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <h3 className="font-semibold text-blue-900 flex items-center gap-2">
          <Play size={18} /> 핵심 질문: "영상 업로드 후 재생 버튼을 바로 찾는가?"
        </h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="미션 완료율" value="88%" subtitle="시작 대비" icon={CheckCircle} color="green" />
        <KPICard title="평균 완료 시간" value="18.5초" subtitle="업로드→재생" icon={Clock} color="blue" />
        <KPICard title="첫 시도 성공" value="78%" subtitle="바로 재생 클릭" icon={Target} color="purple" />
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
                data={mission1SuccessData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}%`}
              >
                {mission1SuccessData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );

  const renderMission2 = () => (
    <div className="space-y-6">
      <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
        <h3 className="font-semibold text-indigo-900 flex items-center gap-2">
          <Grid size={18} /> 핵심 질문: "타임라인 UI에서 원하는 컷을 쉽게 찾는가?"
        </h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="첫 시도 정답률" value="65%" subtitle="바로 컷4 선택" icon={Target} color="green" />
        <KPICard title="평균 시도 횟수" value="1.5회" subtitle="정답까지" icon={TrendingUp} color="blue" />
        <KPICard title="평균 완료 시간" value="5.2초" subtitle="미션 완료" icon={Clock} color="purple" />
        <KPICard title="미션 완료율" value="95%" subtitle="시작 대비" icon={CheckCircle} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="🎯 컷별 클릭 히트맵" subtitle="어떤 컷을 4번으로 착각하는지">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={mission2HeatmapData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="cut" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="clicks" radius={[4, 4, 0, 0]}>
                {mission2HeatmapData.map((entry, index) => (
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

  const renderMission6 = () => (
    <div className="space-y-6">
      <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
        <h3 className="font-semibold text-purple-900 flex items-center gap-2">
          <Sparkles size={18} /> 핵심 질문: "AI 자막 추천 기능을 자연스럽게 발견하고 사용하는가?"
        </h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="기본 미션 완료율" value="85%" subtitle="AI 버튼 발견" icon={CheckCircle} color="green" />
        <KPICard title="추가 미션 완료율" value="68%" subtitle="재추천 사용" icon={Target} color="blue" />
        <KPICard title="기본→추가 이탈률" value="20%" subtitle="팝업 후 이탈" icon={XCircle} color="orange" />
        <KPICard title="AI 추천 채택률" value="82%" subtitle="직접입력 대비" icon={Sparkles} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="2단계 미션 퍼널" subtitle="기본 → 추가 미션 진행률">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={mission6FunnelData} layout="vertical">
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

  const renderPlanning1 = () => (
    <div className="space-y-6">
      <div className="bg-teal-50 rounded-xl p-4 border border-teal-100">
        <h3 className="font-semibold text-teal-900 flex items-center gap-2">
          <FileText size={18} /> 핵심 질문: "6컷 개별 UI vs 3컷 그룹 UI 중 어떤 게 메모 작성에 효과적인가?"
        </h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="A파트 완료율" value="92%" subtitle="6컷 개별" icon={CheckCircle} color="green" />
        <KPICard title="B파트 완료율" value="88%" subtitle="3컷 그룹" icon={CheckCircle} color="blue" />
        <KPICard title="A 평균 메모 길이" value="12.5자" subtitle="6컷 기준" icon={FileText} color="purple" />
        <KPICard title="B 평균 메모 길이" value="18.2자" subtitle="3컷 기준" icon={FileText} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="A vs B 성과 비교" subtitle="완료율, 시간, 메모작성률">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={planning1CompareData}>
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">📊 UX 테스트 분석 대시보드</h1>
          <p className="text-gray-500">미션별 사용자 행동 데이터 시각화</p>
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
