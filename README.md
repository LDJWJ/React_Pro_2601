# HookHook - 숏폼 영상 제작 앱 프로토타입

> 숏폼 영상 제작 앱의 UX/UI 사용성 테스트를 위한 React 기반 프로토타입
>
> A/B 테스트 및 미션 기반 사용자 행동 분석 기능 포함

**프로젝트 기간**: 2026-01-19 ~ 현재
**현재 버전**: v2.6.0 (2026-02-07)
**GitHub**: https://github.com/LDJWJ/React_Pro_2601

---

## 목차

1. [기술 스택](#1-기술-스택)
2. [주요 기능](#2-주요-기능)
3. [프로젝트 구조](#3-프로젝트-구조)
4. [화면 흐름](#4-화면-흐름)
5. [미션 시스템](#5-미션-시스템)
6. [데이터 분석 기능](#6-데이터-분석-기능)
7. [로깅 시스템](#7-로깅-시스템)
8. [실행 방법](#8-실행-방법)
9. [환경 변수](#9-환경-변수)
10. [배포](#10-배포)
11. [버전 히스토리](#11-버전-히스토리)
12. [알려진 이슈 및 해결](#12-알려진-이슈-및-해결)

---

## 1. 기술 스택

### Frontend
| 기술 | 버전 | 용도 |
|------|------|------|
| React | 19.2.0 | UI 컴포넌트 |
| Vite | 7.2.4 | 빌드 도구 |
| CSS Modules | - | 컴포넌트 스타일링 |
| Recharts | - | 차트 시각화 |
| Lucide React | - | 아이콘 라이브러리 |

### Backend & Infrastructure
| 기술 | 용도 |
|------|------|
| Netlify Functions | 서버리스 API (AI 자막 생성) |
| Google Apps Script | 사용자 행동 로깅 수집 |
| Google Sheets | 로그 데이터 저장소 |

### External APIs
| API | 용도 |
|-----|------|
| Google OAuth | 소셜 로그인 |
| OpenAI GPT-4 | AI 자막 생성 |

---

## 2. 주요 기능

### 2.1 로그인 시스템
```
컴포넌트: LoginScreen.jsx
기능: Google OAuth 소셜 로그인
특징: 세션 기반 사용자 관리
```

### 2.2 미션 메인
```
컴포넌트: MissionMain.jsx
기능: 미션 카테고리 선택 및 진행 상태 표시
특징: 4가지 미션 카테고리, A/B안 분기
```

### 2.3 편집 미션 (Edit)

| 미션 ID | 컴포넌트 | 목표 | 완료 조건 |
|---------|----------|------|----------|
| 편집 1-1 | `Edit1_1Screen.jsx` | 영상 업로드 후 재생 | 영상 업로드 → 재생 버튼 클릭 |
| 편집 2-1 | `Edit2_1Screen.jsx` | 4번째 컷 선택 | 타임라인에서 4번째 컷 클릭 |
| 편집 6-1 | `Edit6_1Screen.jsx` | AI 자막 추천 2단계 | AI 자막 추천 2회 클릭 |

### 2.4 기획 미션 (Plan)

| 미션 ID | 컴포넌트 | 특징 | 완료 조건 |
|---------|----------|------|----------|
| 기획 1-1 A안 | `Plan1_1AScreen.jsx` | 영상 프레임 기반, 6컷 | 메모 1개 이상 작성 후 저장 |
| 기획 1-1 B안 | `Plan1_1BScreen.jsx` | 타임라인 기반, 3컷 | 메모 1개 이상 작성 후 저장 |

### 2.5 데이터 분석 대시보드
```
컴포넌트: DataAnalysis.jsx
기능: CSV 데이터 기반 사용자 행동 분석
지표: 퍼널, 완료율, 소요시간, 히트맵, A/B 비교
```

### 2.6 기본 데이터 분석 (신규)
```
컴포넌트: BasicDataAnalysis.jsx
기능: 미션별 기본 통계 분석 (라이트 모드 UI)
특징:
  - 종합 탭: 전체 세션 수, 디바이스 분류, 미션별 완료율
  - 미션별 탭: 사용자 흐름 퍼널, 평균 소요 시간, 시간 분포
  - 고유 사용자(세션) 기준 통계
  - 세션별 첫 번째 완료 시간만 집계
```

### 2.7 데이터 시각화
```
컴포넌트: DataVisualizer.jsx
기능: 미션별 UX 분석 시각화 대시보드
특징:
  - CSV 불러오기 / 샘플 데이터 선택
  - 모바일/PC 뷰 모드 전환
  - 5개 탭 (종합, 편집1-1, 편집2-1, 편집6-1, 기획1-1)
  - Recharts 기반 차트 (퍼널, 바, 파이, 라인)
  - 반응형 PC 확대 지원
CSS 분리: 공통 + 모바일 전용 + PC 전용
```

---

## 3. 프로젝트 구조

```
React_Pro_2601/
│
├── 📁 public/
│   ├── 📁 icons/                      # UI 아이콘 (24개)
│   │   ├── plus.png                   # 추가 버튼
│   │   ├── PLAY.png                   # 재생 버튼
│   │   ├── video-stop.png             # 정지 버튼
│   │   ├── edit.png                   # 편집 버튼
│   │   ├── star.png                   # AI 추천 버튼
│   │   ├── media.png                  # 미디어 아이콘
│   │   └── ...
│   ├── 📁 images/                     # 이미지 리소스
│   │   └── story01~06.png             # 기획 미션 B안 썸네일
│   └── 📁 videos/
│       └── sample-2.mp4               # 기획 미션 A안 영상
│
├── 📁 src/
│   ├── App.jsx                        # 메인 앱 (화면 라우팅)
│   ├── App.css                        # 전역 스타일
│   ├── main.jsx                       # 엔트리 포인트
│   ├── index.css                      # 기본 스타일
│   │
│   ├── 📁 components/
│   │   │
│   │   │── # ===== 공통 컴포넌트 =====
│   │   ├── LoginScreen.jsx            # 로그인 (1.8KB)
│   │   ├── LoginScreen.css
│   │   ├── MissionMain.jsx            # 미션 메인 (2.4KB)
│   │   ├── MissionMain.css
│   │   ├── MissionStep.jsx            # 미션 단계 안내 (1.4KB)
│   │   ├── MissionStep.css
│   │   │
│   │   │── # ===== 편집 미션 (Edit) =====
│   │   ├── Edit1_1Screen.jsx          # 영상 업로드+재생 (19.9KB)
│   │   ├── Edit2_1Screen.jsx          # 컷 선택 (20.3KB)
│   │   ├── Edit6_1Screen.jsx          # AI 자막 2단계 (24.4KB)
│   │   ├── ContentUploadScreenB.css   # 편집 미션 공통 스타일
│   │   │
│   │   │── # ===== 기획 미션 (Plan) =====
│   │   ├── Plan1_1AScreen.jsx         # A안: 영상 기반 (11.5KB)
│   │   ├── Plan1_1BScreen.jsx         # B안: 타임라인 기반 (12.7KB)
│   │   ├── StoryPlanningScreen.css    # 기획 미션 공통 스타일
│   │   │
│   │   │── # ===== 데이터 분석 =====
│   │   ├── DataAnalysis.jsx           # 분석 대시보드 (72.3KB)
│   │   ├── DataAnalysis.css           # 분석 스타일
│   │   │
│   │   │── # ===== 기본 데이터 분석 (신규) =====
│   │   ├── BasicDataAnalysis.jsx      # 기본 통계 분석 (라이트 모드)
│   │   ├── BasicDataAnalysis.css      # 기본 분석 스타일
│   │   │
│   │   │── # ===== 데이터 시각화 =====
│   │   ├── DataVisualizer.jsx         # 시각화 대시보드
│   │   ├── DataVisualizer.css         # 공통 스타일
│   │   ├── DataVisualizer.mobile.css  # 모바일 전용 스타일
│   │   ├── DataVisualizer.pc.css      # PC 전용 스타일 (반응형)
│   │   │
│   │   │── # ===== 레거시 컴포넌트 =====
│   │   ├── TemplateDetailA.jsx        # 템플릿 상세 A안
│   │   ├── TemplateDetailB.jsx        # 템플릿 상세 B안
│   │   ├── StoryPlanningScreenA.jsx   # 영상 기획 A안 (레거시)
│   │   ├── StoryPlanningScreenB.jsx   # 영상 기획 B안 (레거시)
│   │   ├── ContentUploadScreenA.jsx   # 콘텐츠 업로드 A안
│   │   ├── ContentUploadScreenB.jsx   # 콘텐츠 업로드 B안
│   │   ├── SampleTemplateA.jsx        # 샘플 A안
│   │   ├── SampleTemplateB.jsx        # 샘플 B안
│   │   │
│   │   └── 📁 _old/                   # 미사용 컴포넌트
│   │
│   └── 📁 utils/
│       ├── logger.js                  # 행동 로깅 (큐 시스템)
│       └── interactionLogger.js       # 인터랙션 로깅
│
├── 📁 netlify/
│   └── 📁 functions/
│       └── generate-subtitle.js       # AI 자막 생성 API
│
├── 📁 ref_file/                       # 참조 데이터
│   ├── Tracking_Sheet_260206.csv      # 트래킹 데이터 1
│   ├── Tracking_Sheet_260206_02.csv   # 트래킹 데이터 2
│   ├── Tracking_Sheet_260206_03.csv   # 트래킹 데이터 3
│   ├── Tracking_Sheet_260206_04.csv   # 트래킹 데이터 4 (시각화용)
│   └── UXDashboard.jsx                # 참조 컴포넌트
│
├── netlify.toml                       # Netlify 설정
├── vite.config.js                     # Vite 설정
├── package.json                       # 의존성 관리
└── README.md                          # 프로젝트 문서
```

---

## 4. 화면 흐름

### 4.1 전체 흐름도

```
┌─────────────────┐
│    로그인        │ ← Google OAuth
│  LoginScreen    │
└────────┬────────┘
         │ 로그인 성공
         ▼
┌─────────────────┐
│   미션 메인      │ ← 미션 선택
│  MissionMain    │
└────────┬────────┘
         │
    ┌────┴────┬─────────────┬─────────────┐
    │         │             │             │
    ▼         ▼             ▼             ▼
┌───────┐ ┌───────┐   ┌───────────┐  ┌──────────┐
│편집    │ │기획    │   │데이터분석  │  │레거시    │
│미션    │ │미션    │   │           │  │미션      │
└───┬───┘ └───┬───┘   └───────────┘  └──────────┘
    │         │
    ▼         ▼
┌───────────────────────────────────────┐
│              미션 선택 화면             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │편집 1-1 │ │편집 2-1 │ │편집 6-1 │  │
│  │영상업로드│ │컷 선택  │ │AI자막   │  │
│  └────┬────┘ └────┬────┘ └────┬────┘  │
│       │          │          │        │
│       ▼          ▼          ▼        │
│  ┌─────────────────────────────────┐ │
│  │        미션 완료 화면            │ │
│  │     ✓ 미션을 완료했습니다.       │ │
│  │        [완료] 버튼              │ │
│  └─────────────────────────────────┘ │
└───────────────────────────────────────┘
```

### 4.2 미션별 상세 흐름

#### 편집 1-1: 영상 업로드 후 재생
```
화면 진입 → 미션 시작 로그
    │
    ▼
┌─────────────────────┐
│  영상 추가 버튼 (+)  │ ← 클릭: "영상추가" 로그
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  파일 선택 다이얼로그 │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  영상 업로드 완료    │ ← "영상업로드완료" 로그
│  (썸네일 자동 생성)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  재생 버튼 (▶)      │ ← 클릭: "재생" 로그
└──────────┬──────────┘
           │
           ▼ (2초 대기)
┌─────────────────────┐
│  미션 완료!          │ ← "미션완료" 로그
└─────────────────────┘
```

#### 편집 6-1: AI 자막 2단계 미션
```
화면 진입 → 기본 미션 시작 로그
    │
    ▼
┌─────────────────────┐
│ [AI 자막 추천] 버튼  │ ← 클릭: "AI자막추천" 로그
└──────────┬──────────┘
           │
           ▼ (API 호출)
┌─────────────────────┐
│  자막 추천 결과 표시  │
│  - 추천1             │
│  - 추천2             │
│  - 추천3             │
└──────────┬──────────┘
           │
           ▼ (2초 대기)
┌─────────────────────┐
│  기본 미션 완료!      │ ← "기본미션완료" 로그
│                     │
│  ┌─────────────────┐│
│  │    팝 업         ││
│  │ 추가 미션 안내    ││
│  │    [확인]        ││
│  └─────────────────┘│
└──────────┬──────────┘
           │ 확인 클릭
           ▼
┌─────────────────────┐
│ [AI 자막 추천] 재클릭 │ ← "AI자막추천" 로그 (재추천)
└──────────┬──────────┘
           │
           ▼ (2초 대기)
┌─────────────────────┐
│  추가 미션 완료!      │ ← "추가미션완료" 로그
└─────────────────────┘
```

---

## 5. 미션 시스템

### 5.1 미션 정의 (DataAnalysis.jsx)

```javascript
const MISSIONS = {
  'edit1-1': {
    id: 'edit1-1',
    name: '편집 1-1',
    description: '영상 업로드 후 재생하기',
    screenPrefix: '편집1-1',
    missionStartTarget: '편집1-1_미션시작',
    missionCompleteTarget: '편집1-1_미션완료',
    funnelSteps: [
      { id: 'screenEnter', name: '화면 진입', event: '화면 진입' },
      { id: 'missionStart', name: '미션 시작', event: '미션 시작' },
      { id: 'videoAdd', name: '영상 추가', event: '버튼 클릭', target: '영상추가' },
      { id: 'videoUpload', name: '업로드 완료', event: '버튼 클릭', target: '영상업로드완료' },
      { id: 'play', name: '재생 클릭', event: '버튼 클릭', target: '재생' },
      { id: 'missionComplete', name: '미션 완료', event: '미션 완료' },
    ],
  },
  // ... 다른 미션들
};
```

### 5.2 미션별 컷 구성

#### 편집 미션 (6컷 공통)
```javascript
const defaultCuts = [
  { id: 1, title: '인트로 (첫 장면)', duration: 6, description: '...' },
  { id: 2, title: '제품 보여주기', duration: 4, description: '...' },
  { id: 3, title: '사용 장면', duration: 5, description: '...' },
  { id: 4, title: '리액션 컷', duration: 5, description: '...' },
  { id: 5, title: '마무리 컷', duration: 8, description: '...' },
  { id: 6, title: '엔딩 장면', duration: 5, description: '...' },
];
```

#### 기획 1-1 A안 (6컷, 영상 기반)
```javascript
const defaultCuts = [
  { id: 1, title: '디테일 포인트', time: '2초', startTime: 0 },
  { id: 2, title: '사용 장면 컷', time: '2초', startTime: 2 },
  { id: 3, title: '디테일 포인트', time: '2초', startTime: 4 },
  { id: 4, title: '효과 전달 컷', time: '2초', startTime: 6 },
  { id: 5, title: '마무리 장면', time: '2초', startTime: 8 },
  { id: 6, title: '엔딩 장면', time: '2초', startTime: 10 },
];
```

#### 기획 1-1 B안 (3컷, 정적 이미지)
```javascript
const defaultCuts = [
  { id: 1, label: '1', title: '인트로(첫 장면)', thumbnail: '/images/story01.png' },
  { id: 2, label: '2 - 5', title: '카페 보여주기', thumbnail: '/images/story03.png' },
  { id: 3, label: '6', title: '마무리 장면', thumbnail: '/images/story06.png' },
];
```

---

## 6. 데이터 분석 기능

### 6.1 분석 항목

| 항목 | 함수 | 설명 |
|------|------|------|
| 퍼널 분석 | `computeFunnelAnalysis()` | 단계별 사용자 수, 이탈률, 전환율 |
| 완료율 | `computeMissionStats()` | 미션 시작 대비 완료 비율 |
| 소요시간 | `computeMissionStats()` | 평균/최소/최대 완료 시간 |
| 첫시도 성공률 | `computeMissionStats()` | 오답 없이 완료한 비율 |
| 버튼 히트맵 | `computeHeatmapData()` | 버튼별 클릭 빈도 시각화 |
| A/B 비교 | `computeABComparison()` | A안 vs B안 성과 비교 |
| 디바이스별 | `computeDeviceStats()` | 모바일/데스크톱 분리 통계 |

### 6.2 퍼널 분석 로직

```javascript
function computeFunnelAnalysis(data, mission) {
  const funnelData = mission.funnelSteps.map((step, index) => {
    let sessionSet = new Set();

    validRows.forEach(r => {
      const event = r['이벤트']?.trim();
      const screen = r['화면']?.trim();
      const target = r['대상']?.trim();

      // 이벤트 매칭
      if (event !== step.event) return;

      // 화면 매칭 (prefix 기반 유연 매칭)
      if (step.screen) {
        const screenPrefix = step.screen.replace('_화면', '');
        if (!screen?.includes(screenPrefix)) return;
      }

      // 대상 매칭
      if (step.target && target !== step.target) return;

      sessionSet.add(r['사용자ID']);
    });

    return {
      name: step.name,
      sessions: sessionSet.size,
      // 이전 단계 대비 전환율
      conversionRate: index > 0
        ? (sessionSet.size / prevSessions * 100).toFixed(1)
        : '100.0'
    };
  });

  return funnelData;
}
```

### 6.3 기본 데이터 분석 통계 계산 (BasicDataAnalysis.jsx)

#### 6.3.1 개요

기본 데이터 분석은 CSV 로그 데이터를 기반으로 **고유 사용자(세션)** 단위로 통계를 계산합니다.
모든 지표는 중복을 제거한 고유 사용자 수를 기준으로 합니다.

#### 6.3.2 CSV 컬럼 구조

```
타임스탬프, 사용자ID, 화면, 이벤트, 대상, 값, 행동, 브라우저, 디바이스
```

| 컬럼 | 설명 | 예시 |
|------|------|------|
| 타임스탬프 | 이벤트 발생 시간 | `2026. 2. 6 오후 4:54:59` |
| 사용자ID | 세션 고유 ID | `session_1770362890762_pq9w493p4` |
| 화면 | 현재 화면명 | `기획1-1_화면` |
| 이벤트 | 이벤트 타입 | `미션 시작`, `미션 완료`, `버튼 클릭` |
| 대상 | 이벤트 대상 | `기획1-1_미션시작`, `기획1-1_미션완료` |
| 값 | 추가 데이터 | `완료시간:15.2초` |
| 디바이스 | 기기 유형 | `desktop`, `mobile` |

#### 6.3.3 전체 세션 수 계산

**정의**: 정의된 미션에 참여한 고유 사용자의 **합집합**

```javascript
// 1단계: 정의된 미션 화면에 방문한 사용자 수집
const missionUsers = new Set();
validRows.forEach(r => {
  const isInMission = missionPrefixes.some(prefix =>
    screen.includes(prefix) || target.includes(prefix)
  );
  if (isInMission) {
    missionUsers.add(r['사용자ID']);
  }
});

// 결과: 전체 세션 수 = missionUsers.size
```

**예시**:
- 사용자A → 기획1-1, 기획1-2 참여
- 사용자B → 기획1-1만 참여
- 사용자C → 기획1-2만 참여
- **전체 세션 수 = 3명** (합집합, 단순 합계 4가 아님)

#### 6.3.4 디바이스별 사용자 수 계산

**핵심 로직**: 세션에 해당하는 사용자의 디바이스 정보를 **전체 CSV 데이터**에서 검색

```javascript
// 1단계: 미션에 참여한 세션(고유 사용자) 목록 확보
const sessions = new Set(missionRows.map(r => r['사용자ID']));

// 2단계: 전체 데이터에서 해당 사용자들의 디바이스 정보 검색
const userDeviceMap = new Map();
validRows.forEach(r => {
  const userId = r['사용자ID'];
  const device = r['디바이스'] || '';
  // 이 미션의 세션에 해당하고, 아직 디바이스 정보가 없으면 저장
  if (sessions.has(userId) && !userDeviceMap.has(userId) && device) {
    userDeviceMap.set(userId, device);
  }
});

// 3단계: 디바이스별 집계
let desktopUsers = 0, mobileUsers = 0;
userDeviceMap.forEach((device) => {
  if (device === 'desktop') desktopUsers++;
  else if (device === 'mobile') mobileUsers++;
});
```

**왜 전체 데이터에서 검색하는가?**
- 일부 사용자는 미션 화면에서 디바이스 정보가 기록되지 않을 수 있음
- 로그인 화면, 메인 화면 등 다른 화면에서 기록된 디바이스 정보 활용
- 예: 세션 9명인데 미션 화면에서만 검색하면 6명만 디바이스 확인 가능 → 전체 검색 시 9명 모두 확인

#### 6.3.5 미션별 통계 계산

**세션 수** (화면 방문자)
```javascript
const sessions = new Set(missionRows.map(r => r['사용자ID']));
```

**미션 시작 사용자**
```javascript
const startedUsers = new Set();
validRows.forEach(r => {
  if (r['이벤트'] === '미션 시작' && r['대상'] === mission.missionStartTarget) {
    startedUsers.add(r['사용자ID']);
  }
});
```

**미션 완료 사용자 + 완료 시간**
```javascript
const completedUsers = new Set();
const completionTimesByUser = new Map(); // 사용자별 첫 완료 시간만

validRows.forEach(r => {
  if (r['이벤트'] === '미션 완료' && r['대상'] === mission.missionCompleteTarget) {
    const userId = r['사용자ID'];
    completedUsers.add(userId);

    // ⚠️ 첫 번째 완료 시간만 기록 (중복 시도는 무시)
    if (!completionTimesByUser.has(userId)) {
      const match = r['값']?.match(/완료시간:(\d+\.?\d*)초/);
      if (match) {
        completionTimesByUser.set(userId, parseFloat(match[1]));
      }
    }
  }
});
```

**왜 첫 번째 완료 시간만 사용하는가?**
- 같은 사용자가 여러 번 미션을 완료할 수 있음
- 분석 목적상 첫 시도의 소요 시간이 의미 있음
- 이후 시도는 학습 효과로 인해 더 빠를 수 있어 통계 왜곡 방지

#### 6.3.6 참여율 / 완료율 계산

| 지표 | 공식 | 설명 |
|------|------|------|
| 참여율 | 시작 사용자 / 세션 수 × 100 | 화면 방문 후 미션 시작 비율 |
| 완료율 | 완료 사용자 / 시작 사용자 × 100 | 미션 시작 후 완료 비율 |
| 미시작 이탈 | 세션 수 - 시작 사용자 | 화면만 보고 이탈 |
| 미완료 이탈 | 시작 사용자 - 완료 사용자 | 시작 후 완료 못함 |

```javascript
participationRate: (startedCount / sessionCount * 100).toFixed(1)
completionRate: (completedCount / startedCount * 100).toFixed(1)
notStarted: sessionCount - startedCount
notCompleted: startedCount - completedCount
```

#### 6.3.7 2단계 미션 (편집 6-1) 통계

편집 6-1은 기본 미션 + 추가 미션 2단계 구조

```javascript
// 기본 미션
missionStartTarget: '편집6-1_기본미션시작'
missionCompleteTarget: '편집6-1_기본미션완료'

// 추가 미션
additionalMissionStart: '편집6-1_추가미션시작'
additionalMissionComplete: '편집6-1_추가미션완료'
```

**2단계 퍼널 구조**:
```
화면 방문 (14명)
  ↳ 미시작 이탈 (1명, 7.1%)
기본 미션 시작 (13명, 92.9%)
기본 미션 완료 (12명, 92.3%)
  ↳ 기본 미션 이탈 (1명, 7.7%)
추가 미션 시작 (10명, 83.3%)
추가 미션 완료 (8명, 80.0%)
  ↳ 추가 미션 이탈 (2명, 20.0%)
```

**추가 미션 참여율 계산**:
```javascript
// 기본 미션 완료자 중 추가 미션 시작 비율
additionalParticipationRate: (additionalStarted / basicCompleted * 100)
```

#### 6.3.8 평균 소요 시간 계산

```javascript
// 세션별 첫 완료 시간만 사용
const completionTimes = Array.from(completionTimesByUser.values());

avgTime: completionTimes.length > 0
  ? (completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length).toFixed(1)
  : null

minTime: Math.min(...completionTimes).toFixed(1)
maxTime: Math.max(...completionTimes).toFixed(1)
```

#### 6.3.9 완료 시간 분포 (히스토그램)

5초 단위로 구간을 나누어 사용자 수 집계

```javascript
const bucketSize = 5;
const buckets = {};

times.forEach(t => {
  const bucket = Math.floor(t / bucketSize) * bucketSize;
  const label = `${bucket}-${bucket + bucketSize}`;
  buckets[label] = (buckets[label] || 0) + 1;
});

// 결과 예시:
// 0-5초: 2명
// 5-10초: 5명
// 10-15초: 3명
// 15-20초: 1명
```

### 6.4 히트맵 시각화

```javascript
function computeHeatmapData(data, mission) {
  const buttonClicks = {};

  // 버튼 클릭 집계
  validRows.forEach(r => {
    if (r['이벤트'] === '버튼 클릭') {
      const target = r['대상'];
      buttonClicks[target] = (buttonClicks[target] || 0) + 1;
    }
  });

  // 최대값 기준 비율 계산 (0~100%)
  const maxClicks = Math.max(...Object.values(buttonClicks));

  return Object.entries(buttonClicks).map(([button, count]) => ({
    button,
    count,
    intensity: (count / maxClicks * 100).toFixed(0)
  }));
}
```

---

## 7. 로깅 시스템

### 7.1 로그 이벤트 타입

| 이벤트 | 함수 | 매개변수 | 설명 |
|--------|------|----------|------|
| 화면 진입 | `logScreenView(screen)` | 화면명 | 화면 방문 시점 |
| 미션 시작 | `logMissionStart(screen, target)` | 화면명, 미션ID | 미션 시작 시점 |
| 버튼 클릭 | `logButtonClick(screen, target, state)` | 화면명, 버튼명, 상태JSON | 버튼 인터랙션 |
| 미션 완료 | `logMissionComplete(screen, target, details)` | 화면명, 미션ID, 상세 | 미션 성공 |
| 화면 이탈 | `logScreenExit(screen, dwellTime)` | 화면명, 체류시간 | 화면 떠남 |

### 7.2 로그 큐 시스템 (logger.js)

```javascript
// 로그 순서 보장을 위한 큐 시스템
const logQueue = [];
let isProcessingQueue = false;

const processLogQueue = async () => {
  if (isProcessingQueue || logQueue.length === 0) return;
  isProcessingQueue = true;

  while (logQueue.length > 0) {
    const { payload, resolve } = logQueue.shift();
    try {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      // 로그 간 50ms 간격 유지
      await new Promise(r => setTimeout(r, 50));
    } catch (error) {
      console.error('[Tracking] Failed:', error);
    }
    if (resolve) resolve();
  }

  isProcessingQueue = false;
};

// 로그 전송 (큐에 추가)
export const sendLog = (payload) => {
  return new Promise((resolve) => {
    logQueue.push({ payload, resolve });
    processLogQueue();
  });
};
```

### 7.3 화면 컴포넌트 로깅 패턴

```javascript
// 권장 패턴: async/await + 500ms 지연
useEffect(() => {
  const enterTime = Date.now();
  missionStartTime.current = enterTime;

  const initLogs = async () => {
    // 1. 화면 진입 로그 (완료 대기)
    await logScreenView('편집1-1_화면');

    // 2. 미션 시작 로그 (500ms 지연)
    if (!missionStartLogged.current) {
      missionStartLogged.current = true;
      setTimeout(() => {
        logMissionStart('편집1-1_화면', '편집1-1_미션시작');
      }, 500);
    }
  };
  initLogs();

  // 3. 화면 이탈 로그 (cleanup)
  return () => {
    const dwellTime = Date.now() - enterTime;
    logScreenExit('편집1-1_화면', dwellTime);
  };
}, []);
```

---

## 8. 실행 방법

### 8.1 개발 환경 설정

```bash
# 1. 저장소 클론
git clone https://github.com/LDJWJ/React_Pro_2601.git
cd React_Pro_2601

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
cp .env.example .env
# .env 파일 편집하여 API 키 입력

# 4. 개발 서버 실행
npm run dev
# → http://localhost:5173
```

### 8.2 Netlify Functions 로컬 테스트

```bash
# Netlify CLI 설치
npm install -g netlify-cli

# Netlify 개발 서버 실행 (Functions 포함)
npm run netlify
# → http://localhost:8888
```

### 8.3 프로덕션 빌드

```bash
# 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

---

## 9. 환경 변수

### 9.1 `.env` 파일 설정

```env
# ===== Google OAuth =====
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here

# ===== OpenAI API (Netlify Functions) =====
OPENAI_API_KEY=sk-your_openai_api_key_here

# ===== Google Sheets 로깅 =====
VITE_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/your_script_id/exec
```

### 9.2 Netlify 환경 변수 설정

```
Site settings → Environment variables에서 설정:
- OPENAI_API_KEY: OpenAI API 키
```

---

## 10. 배포

### 10.1 Netlify 설정 (netlify.toml)

```toml
[build]
  command = "npm run build"
  publish = "dist"

[functions]
  directory = "netlify/functions"

[[headers]]
  for = "/*"
  [headers.values]
    Cache-Control = "no-cache, no-store, must-revalidate"
```

### 10.2 배포 프로세스

```
1. GitHub main 브랜치에 push
2. Netlify 자동 빌드 트리거
3. 빌드 완료 후 자동 배포
4. 배포 URL: https://your-site.netlify.app
```

---

## 11. 버전 히스토리

---

### v2.6.0 (2026-02-07)
**기본 데이터 분석 대시보드 추가**

#### 새로운 기능
CSV 로그 데이터 기반 미션별 기본 통계 분석 컴포넌트

#### 주요 특징

**1. 탭 구성**
| 탭 | 내용 |
|---|---|
| 종합 | 전체 세션 수, 디바이스 분류(PC/모바일), 미션별 참여율/완료율, 평균 완료 시간 |
| 미션별 | 사용자 흐름 퍼널, 이탈 분석, 평균 소요 시간, 완료 시간 분포 |

**2. 통계 계산 원칙**
- 모든 지표는 **고유 사용자(세션)** 기준
- 같은 사용자의 중복 미션 수행은 1회로 카운트
- 완료 시간은 **세션별 첫 번째 완료만** 집계
- 디바이스 정보는 **전체 CSV 데이터**에서 검색

**3. 2단계 미션 지원 (편집 6-1)**
- 기본 미션 / 추가 미션 분리 퍼널
- 각 단계별 시작/완료/이탈 통계
- 기본 미션, 추가 미션 별도 평균 소요 시간

**4. UI 스타일**
- 라이트 모드 (다크 모드 X)
- 파란색 계열 강조색 (#3b82f6)
- 카드 기반 레이아웃, 부드러운 그림자

#### 변경 내역
| 파일 | 내용 |
|------|------|
| `BasicDataAnalysis.jsx` | **신규** - 기본 통계 분석 컴포넌트 |
| `BasicDataAnalysis.css` | **신규** - 라이트 모드 스타일 |
| `App.jsx` | BasicDataAnalysis 라우팅 추가 |
| `MissionMain.jsx` | 기본 분석 / 확장 분석 메뉴 분리 |

#### 통계 계산 상세
자세한 내용은 [6.3 기본 데이터 분석 통계 계산](#63-기본-데이터-분석-통계-계산-basicdataanalysisjsx) 참조

---

### v2.5.0 (2026-02-06)
**데이터 시각화 대시보드 신규 추가**

#### 새로운 기능
UXDashboard.jsx를 참고하여 새로운 데이터 시각화 컴포넌트 개발

#### 주요 특징

**1. 데이터 소스 선택**
- CSV 파일 불러오기
- 샘플 데이터 사용 (Tracking_Sheet_260206_04.csv 기반)

**2. 뷰 모드 전환**
- 모바일 뷰 (기본): 375px 프레임, 2행 탭 배치
- PC 뷰: 전체 화면 반응형 확대

**3. 5개 탭 구성**
| 탭 | 아이콘 | 내용 |
|---|---|---|
| 종합 | TrendingUp | 전체 미션 퍼널, 디바이스별 완료율, 시간대별 참여 |
| 편집 1-1 | Play | 영상 업로드 후 재생 분석 (퍼널, 완료시간, 첫시도 성공률) |
| 편집 2-1 | Grid | 컷 선택 분석 (히트맵, 시도횟수 분포) |
| 편집 6-1 | Sparkles | AI 자막 추천 분석 (2단계 퍼널, AI 선택 분포) |
| 기획 1-1 | FileText | A/B 비교 분석 (완료율, 메모작성률) |

**4. CSS 파일 분리**
```
DataVisualizer.css         # 공통 스타일
DataVisualizer.mobile.css  # 모바일 전용 (2행 탭, 좁은 레이아웃)
DataVisualizer.pc.css      # PC 전용 (반응형 확대)
```

**5. PC 반응형 확대**
- 768px ~ 1024px: 2열 KPI, 1열 차트
- 1024px ~ 1440px: 4열 KPI, 2열 차트
- 1440px ~ 1920px: 확대된 폰트와 여백
- 1920px+: 최대 확대 (KPI 36px)

#### 신규 의존성
```bash
npm install recharts lucide-react
```

#### 변경 내역
| 파일 | 내용 |
|------|------|
| `DataVisualizer.jsx` | **신규** - 메인 컴포넌트 |
| `DataVisualizer.css` | **신규** - 공통 스타일 |
| `DataVisualizer.mobile.css` | **신규** - 모바일 전용 |
| `DataVisualizer.pc.css` | **신규** - PC 전용 (반응형) |
| `App.jsx` | DataVisualizer 라우팅 추가, 전체화면 렌더링 |
| `MissionMain.jsx` | 데이터 시각화 메뉴 추가 (ID: 11) |
| `package.json` | recharts, lucide-react 의존성 추가 |

---

### v2.4.2 (2026-02-06 02:12~02:24)
**로그 순서 및 중복 완료 버그 수정**

#### 배경
- 퍼널 분석에서 "화면 진입"이 0명으로 표시되는 문제 발생
- 편집 6-1 미션에서 기본 미션 완료율이 200%로 표시되는 문제 발생

#### 원인 분석

**문제 1: 로그 순서 뒤바뀜**
```
예상: 화면진입 → 미션시작 → 버튼클릭 → 미션완료
실제: 미션시작 → 버튼클릭 → 화면진입 → 미션완료
```
- 원인: 비동기 네트워크 요청으로 인해 로그 도착 순서가 보장되지 않음

**문제 2: 미션 완료 중복 (200%)**
```javascript
// 문제 코드: setState는 비동기
if (missionStage === 0) {
  setIsCompleting(true);  // ❌ 즉시 반영 안됨
  setTimeout(() => { logMissionComplete(...) }, 2000);
}
// → 빠른 연속 클릭 시 setTimeout이 2번 등록됨
```

#### 해결 방법

**해결 1: async/await + 500ms 지연**
```javascript
const initLogs = async () => {
  await logScreenView('편집1-1_화면');  // 완료 대기
  setTimeout(() => {
    logMissionStart('편집1-1_화면', '편집1-1_미션시작');
  }, 500);  // 충분한 지연
};
```

**해결 2: useRef로 동기적 중복 방지**
```javascript
const missionCompletingRef = useRef(false);

if (missionStage === 0 && !missionCompletingRef.current) {
  missionCompletingRef.current = true;  // ✅ 즉시 반영
  setIsCompleting(true);
  setTimeout(() => { logMissionComplete(...) }, 2000);
}
```

#### 변경 내역
| 시간 | 커밋 | 파일 | 내용 |
|------|------|------|------|
| 02:24 | `5710399` | `netlify.toml` | 모바일 캐시 제어 헤더 추가 |
| 02:15 | `960f8fa` | `DataAnalysis.jsx` | 데이터 분석 로직 수정 |
| 02:12 | - | `Edit1_1Screen.jsx` | `missionCompletingRef` 추가 |
| 02:12 | - | `Edit2_1Screen.jsx` | `missionCompletingRef` 추가 |
| 02:12 | - | `Edit6_1Screen.jsx` | `missionCompletingRef` 추가 |
| 02:12 | - | `Plan1_1AScreen.jsx` | `savingRef` 추가, async/await |
| 02:12 | - | `Plan1_1BScreen.jsx` | `savingRef` 추가, async/await |

---

### v2.4.1 (2026-02-06 01:59~02:06)
**버튼 클릭 히트맵 기능 추가**

#### 새로운 기능
- 버튼별 클릭 횟수 집계 및 시각화
- 최대값 기준 비율 계산 (0~100%)
- 그라데이션 색상 표시 (회색 → 빨강)

#### 구현 상세
```javascript
// 히트맵 데이터 계산
function computeHeatmapData(data, mission) {
  const buttonClicks = {};
  validRows.forEach(r => {
    if (r['이벤트'] === '버튼 클릭') {
      buttonClicks[r['대상']] = (buttonClicks[r['대상']] || 0) + 1;
    }
  });
  const maxClicks = Math.max(...Object.values(buttonClicks));
  return Object.entries(buttonClicks).map(([btn, cnt]) => ({
    button: btn,
    count: cnt,
    intensity: (cnt / maxClicks * 100).toFixed(0)
  }));
}
```

```css
/* 히트맵 스타일 */
.da-heatmap-cell {
  background: linear-gradient(90deg,
    rgba(200,200,200,0.3) 0%,
    rgba(255,100,100,var(--intensity)) 100%
  );
}
```

#### 변경 내역
| 시간 | 커밋 | 파일 | 내용 |
|------|------|------|------|
| 02:06 | `f1d865d` | `DataAnalysis.jsx` | 히트맵 버그 수정 |
| 02:02 | `1ba63c4` | `ref_file/` | 트래킹 데이터 CSV 추가 |
| 01:59 | `054cee2` | `DataAnalysis.jsx` | `computeHeatmapData()` 함수 추가 |
| 01:59 | `054cee2` | `DataAnalysis.css` | `.da-heatmap-*` 스타일 추가 |

---

### v2.4.0 (2026-02-06 01:06~01:43)
**데이터 분석 대시보드 구현**

#### 새로운 기능
- CSV 파일 로드 및 파싱
- 미션별 통계 계산 (완료율, 소요시간, 첫시도 성공률)
- 퍼널 분석 시각화 (단계별 이탈률)
- A/B 비교 분석 (기획 1-1)
- 미션 선택 UI

#### 컴포넌트 구조
```
DataAnalysis.jsx (72.3KB)
├── CSV 파싱: parseCSV()
├── 미션 정의: MISSIONS 객체
├── 통계 계산
│   ├── computeMissionStats()
│   ├── computeFunnelAnalysis()
│   └── computeABComparison()
└── UI 렌더링
    ├── 미션 목록 사이드바
    ├── 분석 항목 선택
    └── 결과 시각화
```

#### 변경 내역
| 시간 | 커밋 | 파일 | 내용 |
|------|------|------|------|
| 01:43 | `2af7cad` | `ref_file/` | 참조 파일 추가 |
| 01:35 | `66a31e6` | `Edit6_1Screen.jsx` | AI 자막 추천 버그 수정 |
| 01:31 | `31da9f6` | `DataAnalysis.jsx` | 데이터 분석 컴포넌트 개선 |
| 01:06 | `8d33966` | `DataAnalysis.jsx` | **신규 생성** (72KB) |
| 01:06 | `8d33966` | `DataAnalysis.css` | **신규 생성** |

---

### v2.3.1 (2026-02-06 00:49)
**일반 업데이트**

| 시간 | 커밋 | 내용 |
|------|------|------|
| 00:49 | `39d41c0` | 전체 코드 정리 및 업데이트 |

---

### v2.3.0 (2026-02-05 19:05~23:47)
**로깅 시스템 개선**

#### 개선 사항
1. **로그 큐 시스템 도입**: 순차적 로그 전송 보장
2. **지연 시간 조정**: 100ms → 300ms
3. **미션 포기 로깅**: 이탈 시 진행 상태 기록
4. **메모 입력 로깅**: 컷별 메모 작성 추적

#### 로그 큐 시스템
```javascript
// logger.js
const logQueue = [];
let isProcessingQueue = false;

const processLogQueue = async () => {
  if (isProcessingQueue) return;
  isProcessingQueue = true;
  while (logQueue.length > 0) {
    const { payload } = logQueue.shift();
    await fetch(SCRIPT_URL, { ... });
    await new Promise(r => setTimeout(r, 50));
  }
  isProcessingQueue = false;
};
```

#### 변경 내역
| 시간 | 커밋 | 파일 | 내용 |
|------|------|------|------|
| 23:47 | `7b97c06` | `logger.js` | tracking.js 업데이트 |
| 23:44 | `c98e499` | - | 전체 업데이트 |
| 23:33 | `07ecb40` | `Edit*.jsx` | 로깅 타이밍 버그 수정 (300ms) |
| 23:28 | `87142b2` | - | 업데이트 |
| 19:10 | `3955d37` | - | URL 생성 기능 |
| 19:05 | `2414804` | - | 업데이트 |

---

### v2.2.3 (2026-02-04 17:35~20:03)
**UI/UX 개선 (저녁 작업)**

#### 변경 내역
| 시간 | 커밋 | 내용 |
|------|------|------|
| 20:03 | `7cbae94` | 최종 업데이트 |
| 18:49 | `75e6e7e` | UI 조정 |
| 18:40 | `532d0e7` | 스타일 수정 |
| 18:34 | `d08e751` | 레이아웃 개선 |
| 17:46 | `cdcec96` | 컴포넌트 수정 |
| 17:35 | `a040bad` | 업데이트 시작 |

---

### v2.2.2 (2026-02-04 14:29~17:04)
**화면 업데이트 (오후 작업)**

#### 주요 변경
- StoryPlanningScreen 타임라인 UI 개선
- ContentUploadScreenB 스타일 조정
- 컷 카드 레이아웃 수정

#### 변경 내역
| 시간 | 커밋 | 파일 | 내용 |
|------|------|------|------|
| 17:04 | `5765971` | - | 업데이트 |
| 16:31 | `1671ba3` | - | 업데이트 |
| 16:25 | `65a466d` | `ContentUploadScreenB.css` | 스타일 수정 |
| 16:10 | `4959eff` | `ContentUploadScreenB.css` | 스타일 수정 |
| 15:50 | `e85f30f` | `StoryPlanningScreen*` | 편집 |
| 15:43 | `3b949da` | `StoryPlanningScreen.css` | 타임라인 스타일 |
| 14:29 | `374d20c` | - | 화면 업데이트 시작 |

---

### v2.2.1 (2026-02-04 10:32~13:54)
**화면 업데이트 (오전 작업)**

| 시간 | 커밋 | 내용 |
|------|------|------|
| 13:54 | `0fd9f9f` | 업데이트 |
| 12:27 | `8d5a6c7` | 업데이트 |
| 10:42 | `a064023` | 업데이트 |
| 10:32 | `c6024b1` | 업데이트 시작 |

---

### v2.2.0 (2026-02-04 00:15~02:12)
**편집/기획 미션 시스템 추가 (새벽 작업)**

#### 새로운 컴포넌트

**편집 미션**
| 파일 | 크기 | 기능 |
|------|------|------|
| `Edit1_1Screen.jsx` | 19.9KB | 영상 업로드 + 재생 |
| `Edit2_1Screen.jsx` | 20.3KB | 4번째 컷 선택 |
| `Edit6_1Screen.jsx` | 24.4KB | AI 자막 2단계 |

**기획 미션**
| 파일 | 크기 | 기능 |
|------|------|------|
| `Plan1_1AScreen.jsx` | 11.5KB | 영상 기반 메모 (6컷) |
| `Plan1_1BScreen.jsx` | 12.7KB | 타임라인 기반 메모 (3컷) |

#### 주요 기능
- 영상 썸네일 자동 생성 (Canvas API)
- AI 자막 추천 (OpenAI GPT-4)
- 2단계 미션 시스템 (기본 + 추가)
- 미션 진행 상태 저장 (localStorage)

#### 변경 내역
| 시간 | 커밋 | 내용 |
|------|------|------|
| 02:12 | `5e9e0f7` | 최종 업데이트 |
| 02:08 | `7a4a724` | CSS 수정 |
| 01:46 | `b130849` | 컴포넌트 개선 |
| 01:06 | `2078b39` | 브랜치 병합 |
| 00:31 | `fa542f8` | 기능 추가 |
| 00:15 | `882c6a0` | **미션 시스템 초기 구현** |

---

### v2.1.0 (2026-02-03 10:50~19:10)
**Netlify 배포 설정**

#### 새로운 기능
- Netlify 서버리스 함수 설정
- AI 자막 생성 API 구현
- GitHub 연동 CI/CD 배포

#### 신규 파일
```
netlify.toml                    # Netlify 설정
netlify/functions/
└── generate-subtitle.js        # AI 자막 API
```

#### AI 자막 생성 API
```javascript
// generate-subtitle.js
exports.handler = async (event) => {
  const { cutTitle, cutDescription, userKeyword } = JSON.parse(event.body);

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{
      role: 'user',
      content: `컷 제목: ${cutTitle}\n설명: ${cutDescription}\n
                사용자 키워드: ${userKeyword}\n
                짧은 자막 3개를 추천해주세요.`
    }]
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ subtitles: response.choices[0].message.content })
  };
};
```

#### 변경 내역
| 시간 | 커밋 | 내용 |
|------|------|------|
| 19:10 | `d41c903` | 최종 업데이트 |
| 18:43 | `f5a8212` | 기능 개선 |
| 16:30 | `89dcf34` | **netlify.toml 생성** |
| 16:29 | `a43fc89` | 함수 추가 |
| 10:50 | `43936e8` | 초기 설정 |

---

### v2.0.0 (2026-01-20 17:42~17:44)
**A/B 테스트 시스템 구축**

#### 새로운 컴포넌트
| 파일 | 기능 |
|------|------|
| `MissionMain.jsx` | 미션 선택 메인 화면 |
| `MissionStep.jsx` | 단계별 안내 컴포넌트 |
| `TemplateDetailA/B.jsx` | 템플릿 상세 A/B안 |
| `StoryPlanningScreenA/B.jsx` | 영상 기획 A/B안 |
| `ContentUploadScreenA/B.jsx` | 콘텐츠 업로드 A/B안 |
| `SampleTemplateA/B.jsx` | 샘플 A/B안 |

#### A/B 테스트 구조
```
미션 메인 → 미션 선택 → A안 → B안 → 미션 메인
                         ↑___비교___↓
```

---

### v1.0.0 (2026-01-19 23:35 ~ 2026-01-20 00:05)
**초기 릴리즈**

#### 기본 구조
```
src/
├── App.jsx          # 메인 앱
├── main.jsx         # 엔트리 포인트
├── components/
│   └── LoginScreen.jsx
└── utils/
    └── logger.js
```

#### 변경 내역
| 시간 | 커밋 | 내용 |
|------|------|------|
| 00:05 | `e2318af` | 첫 빌드 완료 |
| 23:35 | `88be558` | **Initial commit** |

---

## 12. 알려진 이슈 및 해결

### 12.1 해결된 이슈

| 이슈 | 원인 | 해결 | 버전 |
|------|------|------|------|
| 퍼널 분석 0명 | 로그 순서 뒤바뀜 | async/await + 500ms 지연 | v2.4.2 |
| 완료율 200% | setState 비동기 | useRef 동기적 체크 | v2.4.2 |
| AI 자막 오류 | API 타임아웃 | fallback 자막 추가 | v2.4.0 |

### 12.2 알려진 제한 사항

1. **모바일 영상 업로드**: 일부 iOS 기기에서 영상 썸네일 추출 실패 가능
2. **오프라인 모드**: 로깅 실패 시 재시도 미지원
3. **대용량 CSV**: 10MB 이상 파일 파싱 시 성능 저하 가능

---

## 버전 요약표

| 버전 | 날짜 | 시간 | 주요 내용 | 파일 수 |
|------|------|------|----------|--------|
| **v2.6.0** | 2026-02-07 | - | 기본 데이터 분석 대시보드 | 4 |
| **v2.5.0** | 2026-02-06 | - | 데이터 시각화 대시보드 | 6 |
| **v2.4.2** | 2026-02-06 | 02:12~02:24 | 로그 버그 수정 | 5 |
| **v2.4.1** | 2026-02-06 | 01:59~02:06 | 히트맵 기능 | 3 |
| **v2.4.0** | 2026-02-06 | 01:06~01:43 | 데이터 분석 | 2 |
| **v2.3.1** | 2026-02-06 | 00:49 | 업데이트 | - |
| **v2.3.0** | 2026-02-05 | 19:05~23:47 | 로깅 개선 | 4 |
| **v2.2.3** | 2026-02-04 | 17:35~20:03 | UI/UX (저녁) | - |
| **v2.2.2** | 2026-02-04 | 14:29~17:04 | UI/UX (오후) | 3 |
| **v2.2.1** | 2026-02-04 | 10:32~13:54 | UI/UX (오전) | - |
| **v2.2.0** | 2026-02-04 | 00:15~02:12 | 미션 시스템 | 5 |
| **v2.1.0** | 2026-02-03 | 10:50~19:10 | Netlify 배포 | 2 |
| **v2.0.0** | 2026-01-20 | 17:42~17:44 | A/B 테스트 | 10 |
| **v1.0.0** | 2026-01-19 | 23:35~00:05 | 초기 릴리즈 | 4 |

---

## 기여자

- **개발**: HookHook Team
- **AI 지원**: Claude Code (Anthropic)

---

## 라이선스

Private - All Rights Reserved

---

*마지막 업데이트: 2026-02-07*
