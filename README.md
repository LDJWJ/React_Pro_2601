# HookHook - 숏폼 영상 제작 앱 프로토타입

숏폼 영상 제작 앱의 UX/UI 사용성 테스트를 위한 React 기반 프로토타입입니다.
A/B 테스트 및 미션 기반 사용자 행동 분석 기능을 포함합니다.

---

## 목차

- [기술 스택](#기술-스택)
- [주요 기능](#주요-기능)
- [프로젝트 구조](#프로젝트-구조)
- [화면 흐름](#화면-흐름)
- [미션 상세](#미션-상세)
- [데이터 분석 기능](#데이터-분석-기능)
- [실행 방법](#실행-방법)
- [환경 변수](#환경-변수)
- [배포](#배포)
- [버전 히스토리](#버전-히스토리)

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| **Frontend** | React 19.2.0, Vite 7.2.4 |
| **인증** | Google OAuth (@react-oauth/google) |
| **배포** | Netlify (서버리스 함수 포함) |
| **AI 기능** | OpenAI API (자막 생성) |
| **데이터 수집** | Google Sheets API (사용자 행동 로깅) |

---

## 주요 기능

### 1. 로그인 (`LoginScreen`)
- Google 소셜 로그인
- 사용자 세션 관리

### 2. 미션 메인 (`MissionMain`)
- 4가지 미션 카테고리 선택
- 미션별 A/B안 프로토타입 테스트
- 진행 상태 표시

### 3. 편집 미션 (Edit)
| 미션 | 컴포넌트 | 목표 |
|------|----------|------|
| 편집 1-1 | `Edit1_1Screen` | 영상 업로드 후 재생하기 |
| 편집 2-1 | `Edit2_1Screen` | 4번째 컷 선택하기 |
| 편집 6-1 | `Edit6_1Screen` | AI 자막 추천 (2단계 미션) |

### 4. 기획 미션 (Plan)
| 미션 | 컴포넌트 | 목표 |
|------|----------|------|
| 기획 1-1 A안 | `Plan1_1AScreen` | 아이디어 노트 작성 (영상 기반) |
| 기획 1-1 B안 | `Plan1_1BScreen` | 아이디어 노트 작성 (타임라인 기반) |

### 5. 데이터 분석 (`DataAnalysis`)
- 퍼널 분석 (사용자 흐름 시각화)
- 미션 완료율/소요시간 통계
- 버튼 클릭 히트맵
- A/B 비교 분석
- 디바이스별 통계

---

## 프로젝트 구조

```
React_Pro_2601/
├── public/
│   ├── icons/              # UI 아이콘
│   ├── images/             # 이미지 리소스
│   └── videos/             # 샘플 비디오
├── src/
│   ├── App.jsx             # 메인 앱 (화면 라우팅)
│   ├── main.jsx            # 엔트리 포인트
│   ├── components/
│   │   ├── LoginScreen.jsx         # 로그인 화면
│   │   ├── MissionMain.jsx         # 미션 선택 메인
│   │   ├── MissionStep.jsx         # 미션 단계 안내
│   │   │
│   │   │── # 편집 미션
│   │   ├── Edit1_1Screen.jsx       # 편집 1-1 (영상 업로드 + 재생)
│   │   ├── Edit2_1Screen.jsx       # 편집 2-1 (컷 선택)
│   │   ├── Edit6_1Screen.jsx       # 편집 6-1 (AI 자막 2단계)
│   │   │
│   │   │── # 기획 미션
│   │   ├── Plan1_1AScreen.jsx      # 기획 1-1 A안
│   │   ├── Plan1_1BScreen.jsx      # 기획 1-1 B안
│   │   │
│   │   │── # 기존 미션 (Legacy)
│   │   ├── TemplateDetailA.jsx     # 템플릿 상세 A안
│   │   ├── TemplateDetailB.jsx     # 템플릿 상세 B안
│   │   ├── StoryPlanningScreenA.jsx
│   │   ├── StoryPlanningScreenB.jsx
│   │   ├── ContentUploadScreenA.jsx
│   │   ├── ContentUploadScreenB.jsx
│   │   ├── SampleTemplateA.jsx
│   │   ├── SampleTemplateB.jsx
│   │   │
│   │   │── # 데이터 분석
│   │   ├── DataAnalysis.jsx        # 데이터 분석 대시보드
│   │   └── DataAnalysis.css
│   │
│   └── utils/
│       ├── logger.js               # 사용자 행동 로깅 (큐 시스템)
│       └── interactionLogger.js    # 인터랙션 로깅
│
├── netlify/
│   └── functions/
│       └── generate-subtitle.js    # AI 자막 생성 API
│
├── ref_file/                       # 참조 데이터
│   └── Tracking_Sheet_*.csv        # 트래킹 데이터
│
├── netlify.toml                    # Netlify 설정
├── vite.config.js                  # Vite 설정
└── package.json
```

---

## 화면 흐름

```
┌─────────────┐
│   로그인     │
└──────┬──────┘
       ▼
┌─────────────┐
│  미션 메인   │
└──────┬──────┘
       │
       ├──► 편집 미션 ──┬──► Edit1_1 (영상 업로드 + 재생)
       │               ├──► Edit2_1 (컷 선택)
       │               └──► Edit6_1 (AI 자막 2단계)
       │
       ├──► 기획 미션 ──┬──► Plan1_1A (A안)
       │               └──► Plan1_1B (B안)
       │
       └──► 데이터 분석 ──► DataAnalysis (대시보드)
```

---

## 미션 상세

### 편집 1-1: 영상 업로드 후 재생
```
목표: 영상을 업로드하고 재생 버튼 클릭
흐름: 화면 진입 → 미션 시작 → 영상 추가 → 업로드 완료 → 재생 → 미션 완료
완료 조건: 영상 업로드 후 재생 버튼 클릭
```

### 편집 2-1: 4번째 컷 선택
```
목표: 타임라인에서 4번째 컷 선택
흐름: 화면 진입 → 미션 시작 → 컷 선택 → 미션 완료
완료 조건: 4번째 컷(index 3) 클릭
```

### 편집 6-1: AI 자막 추천 (2단계)
```
목표: AI 자막 추천 기능 사용
흐름:
  [기본 미션] 화면 진입 → AI 자막 추천 클릭 → 기본 미션 완료 → 팝업
  [추가 미션] 팝업 확인 → AI 자막 재추천 클릭 → 추가 미션 완료
완료 조건: AI 자막 추천 버튼 2회 클릭 (기본 + 추가)
```

### 기획 1-1: 아이디어 노트 (A/B 비교)
```
A안: 영상 프레임 기반 메모 작성
B안: 타임라인 기반 메모 작성
완료 조건: 1개 이상의 메모 작성 후 저장
```

---

## 데이터 분석 기능

### 분석 항목

| 항목 | 설명 |
|------|------|
| **퍼널 분석** | 단계별 사용자 이탈 시각화 |
| **완료율** | 미션 시작 대비 완료 비율 |
| **소요시간** | 미션 완료까지 평균 시간 |
| **첫시도 성공률** | 오답 없이 완료한 비율 |
| **버튼 클릭 히트맵** | 버튼별 클릭 빈도 시각화 |
| **A/B 비교** | A안 vs B안 성과 비교 |
| **디바이스별 통계** | 모바일/데스크톱 분리 분석 |

### 로깅 이벤트

| 이벤트 | 설명 | 예시 |
|--------|------|------|
| `화면 진입` | 화면 방문 | 편집1-1_화면 |
| `미션 시작` | 미션 시작 시점 | 편집1-1_미션시작 |
| `버튼 클릭` | 버튼 인터랙션 | 영상추가, 재생, AI자막추천 |
| `미션 완료` | 미션 성공 완료 | 편집1-1_미션완료 |
| `화면 이탈` | 화면 떠남 (체류시간 포함) | dwellTime: 45000 |

---

## 실행 방법

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# Netlify 개발 서버 실행 (서버리스 함수 포함)
npm run netlify

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview
```

---

## 환경 변수

`.env.example`을 참고하여 `.env` 파일을 생성하세요:

```env
# Google OAuth
VITE_GOOGLE_CLIENT_ID=your_google_client_id

# OpenAI API (서버리스 함수용)
OPENAI_API_KEY=your_openai_api_key

# Google Sheets API (로깅용)
VITE_GOOGLE_SCRIPT_URL=your_google_script_url
```

---

## 배포

Netlify를 통해 자동 배포됩니다.

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[functions]
  directory = "netlify/functions"
```

---

## 버전 히스토리

### v2.4.0 (2026-02-06) - 데이터 분석 고도화

#### 새로운 기능
- **퍼널 분석 기능 추가**: 단계별 사용자 흐름 시각화
- **히트맵 시각화**: 버튼별 클릭 빈도 표시
- **디바이스별 통계**: 모바일/데스크톱 분리 분석

#### 버그 수정
- **로그 순서 문제 해결**: `async/await` 패턴으로 화면 진입 → 미션 시작 순서 보장
- **중복 로그 방지**: `useRef`로 동기적 중복 클릭 방지 (완료율 200% 문제 해결)
- **퍼널 0명 버그 수정**: 화면 매칭 로직 개선 (`includes()` 사용)

#### 변경된 파일
- `src/components/DataAnalysis.jsx` - 퍼널/히트맵 추가
- `src/components/DataAnalysis.css` - 히트맵 스타일
- `src/utils/logger.js` - 로그 큐 시스템 추가
- `src/components/Edit*.jsx` - async/await 로깅 패턴
- `src/components/Plan1_1*.jsx` - async/await 로깅 패턴

---

### v2.3.0 (2026-02-05) - 미션 시스템 개선

#### 새로운 기능
- **미션별 로깅 시스템**: 상세한 사용자 행동 추적
- **미션 포기 로깅**: 이탈 시점 및 진행 상태 기록
- **메모 입력 로깅**: 컷별 메모 작성 추적

#### 버그 수정
- AI 자막 추천 API 오류 처리 개선
- 로깅 타이밍 조정 (300ms 지연)

#### 변경된 파일
- `src/utils/logger.js` - 로깅 함수 개선
- `src/components/Edit6_1Screen.jsx` - 2단계 미션 로직
- `src/components/Plan1_1AScreen.jsx` - 메모 로깅 추가
- `src/components/Plan1_1BScreen.jsx` - 메모 로깅 추가

---

### v2.2.0 (2026-02-04) - 편집/기획 미션 추가

#### 새로운 기능
- **Edit1_1Screen**: 영상 업로드 + 재생 미션
- **Edit2_1Screen**: 컷 선택 미션
- **Edit6_1Screen**: AI 자막 2단계 미션
- **Plan1_1AScreen**: 영상 기반 아이디어 노트
- **Plan1_1BScreen**: 타임라인 기반 아이디어 노트

#### UI/UX 개선
- 컷 타임라인 UI 개선
- 썸네일 자동 생성 기능
- 프로그레스 바 시각화

#### 변경된 파일
- 신규: `Edit1_1Screen.jsx`, `Edit2_1Screen.jsx`, `Edit6_1Screen.jsx`
- 신규: `Plan1_1AScreen.jsx`, `Plan1_1BScreen.jsx`
- `ContentUploadScreenB.css` - 공통 스타일
- `StoryPlanningScreen.css` - 타임라인 스타일

---

### v2.1.0 (2026-02-03) - Netlify 배포 설정

#### 새로운 기능
- **Netlify 서버리스 함수**: AI 자막 생성 API
- **배포 자동화**: GitHub 연동 CI/CD

#### 변경된 파일
- 신규: `netlify.toml`
- 신규: `netlify/functions/generate-subtitle.js`

---

### v2.0.0 (2026-01-20) - A/B 테스트 시스템

#### 새로운 기능
- **MissionMain**: 미션 선택 메인 화면
- **MissionStep**: 단계별 안내 컴포넌트
- **A/B 테스트 구조**: 각 미션별 A/B안 분리

#### 변경된 파일
- 신규: `MissionMain.jsx`, `MissionStep.jsx`
- 신규: `TemplateDetailA.jsx`, `TemplateDetailB.jsx`
- 신규: `StoryPlanningScreenA.jsx`, `StoryPlanningScreenB.jsx`
- 신규: `ContentUploadScreenA.jsx`, `ContentUploadScreenB.jsx`

---

### v1.0.0 (2026-01-19) - 초기 릴리즈

#### 새로운 기능
- **LoginScreen**: Google 소셜 로그인
- **기본 프로젝트 구조**: React + Vite 설정
- **로깅 유틸리티**: `logger.js` 초기 버전

---

## 기여자

- **개발**: HookHook Team
- **AI 지원**: Claude Code (Anthropic)

---

## 라이선스

Private - All Rights Reserved
