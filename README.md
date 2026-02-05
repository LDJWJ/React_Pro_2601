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
│   ├── icons/                      # UI 아이콘
│   ├── images/                     # 이미지 리소스
│   └── videos/                     # 샘플 비디오
├── src/
│   ├── App.jsx                     # 메인 앱 (화면 라우팅)
│   ├── main.jsx                    # 엔트리 포인트
│   ├── components/
│   │   ├── LoginScreen.jsx         # 로그인 화면
│   │   ├── MissionMain.jsx         # 미션 선택 메인
│   │   ├── MissionStep.jsx         # 미션 단계 안내
│   │   │
│   │   │── # 편집 미션 스크린
│   │   ├── Edit1_1Screen.jsx       # 편집 1-1 (영상 업로드 + 재생)
│   │   ├── Edit2_1Screen.jsx       # 편집 2-1 (컷 선택)
│   │   ├── Edit6_1Screen.jsx       # 편집 6-1 (AI 자막 2단계)
│   │   │
│   │   │── # 기획 미션 스크린
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
퍼널: 화면 진입 → 미션 시작 → 영상 추가 → 업로드 완료 → 재생 → 미션 완료
완료 조건: 영상 업로드 후 재생 버튼 클릭
```

### 편집 2-1: 4번째 컷 선택
```
목표: 타임라인에서 4번째 컷 선택
퍼널: 화면 진입 → 미션 시작 → 컷 선택 → 미션 완료
완료 조건: 4번째 컷(index 3) 클릭
```

### 편집 6-1: AI 자막 추천 (2단계)
```
목표: AI 자막 추천 기능 사용
퍼널:
  [기본 미션] 화면 진입 → AI 자막 추천 클릭 → 기본 미션 완료 → 팝업
  [추가 미션] 팝업 확인 → AI 자막 재추천 클릭 → 추가 미션 완료
완료 조건: AI 자막 추천 버튼 2회 클릭 (기본 + 추가)
```

### 기획 1-1: 아이디어 노트 (A/B 비교)
```
A안: 영상 프레임 기반 메모 작성 (6컷, 영상 썸네일 추출)
B안: 타임라인 기반 메모 작성 (3컷, 정적 이미지)
완료 조건: 1개 이상의 메모 작성 후 저장
```

---

## 데이터 분석 기능

### 분석 항목

| 항목 | 설명 |
|------|------|
| **퍼널 분석** | 단계별 사용자 이탈 시각화, 드롭오프 포인트 식별 |
| **완료율** | 미션 시작 대비 완료 비율 (%) |
| **소요시간** | 미션 완료까지 평균/최소/최대 시간 |
| **첫시도 성공률** | 오답 없이 완료한 비율 |
| **버튼 클릭 히트맵** | 버튼별 클릭 빈도 시각화 (그라데이션) |
| **A/B 비교** | A안 vs B안 성과 비교 (완료율, 소요시간) |
| **디바이스별 통계** | 모바일/데스크톱 분리 분석 |

### 로깅 이벤트

| 이벤트 | 설명 | 예시 |
|--------|------|------|
| `화면 진입` | 화면 방문 시점 | 편집1-1_화면, 기획1-1A_화면 |
| `미션 시작` | 미션 시작 시점 | 편집1-1_미션시작, 기획1-1_A미션시작 |
| `버튼 클릭` | 버튼 인터랙션 | 영상추가, 재생, AI자막추천, 저장하기 |
| `미션 완료` | 미션 성공 완료 | 편집1-1_미션완료, 기획1-1_A미션완료 |
| `미션 포기` | 미완료 상태로 이탈 | 진행 상태 JSON 포함 |
| `화면 이탈` | 화면 떠남 | dwellTime: 45000 (체류시간 ms) |

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

### v2.4.2 (2026-02-06 02:24) - 로그 순서 및 중복 버그 수정

#### 버그 수정
| 시간 | 커밋 | 내용 |
|------|------|------|
| 02:24 | `5710399` | 모바일 캐시 제어 헤더 추가 |
| 02:15 | `960f8fa` | 데이터 분석 로직 수정 |
| 02:12 | - | **로그 순서 문제 해결**: `async/await` 패턴으로 화면 진입 → 미션 시작 순서 보장 |
| 02:12 | - | **중복 완료 방지**: `useRef`로 동기적 중복 클릭 방지 (완료율 200% → 100% 정상화) |

#### 기술적 변경 사항
```javascript
// Before: setState 비동기 문제로 중복 발생
if (missionStage === 0) {
  setIsCompleting(true);  // ❌ 비동기, 즉시 반영 안됨
  setTimeout(() => { logMissionComplete(...) }, 2000);
}

// After: useRef로 동기적 중복 방지
if (missionStage === 0 && !missionCompletingRef.current) {
  missionCompletingRef.current = true;  // ✅ 동기적, 즉시 반영
  setIsCompleting(true);
  setTimeout(() => { logMissionComplete(...) }, 2000);
}
```

#### 변경된 파일
- `src/components/Edit1_1Screen.jsx` - `missionCompletingRef` 추가
- `src/components/Edit2_1Screen.jsx` - `missionCompletingRef` 추가
- `src/components/Edit6_1Screen.jsx` - `missionCompletingRef` 추가
- `src/components/Plan1_1AScreen.jsx` - `savingRef` 추가, async/await 패턴
- `src/components/Plan1_1BScreen.jsx` - `savingRef` 추가, async/await 패턴

---

### v2.4.1 (2026-02-06 01:59~02:06) - 히트맵 기능 추가

#### 새로운 기능
| 시간 | 커밋 | 내용 |
|------|------|------|
| 02:06 | `f1d865d` | 히트맵 버그 수정 |
| 02:02 | `1ba63c4` | 트래킹 데이터 CSV 추가 |
| 01:59 | `054cee2` | **히트맵 기능 추가**: 버튼별 클릭 빈도 시각화 |

#### 히트맵 기능 상세
- 버튼별 클릭 횟수 집계
- 최대값 기준 비율 계산 (0~100%)
- 그라데이션 색상 표시 (회색 → 빨강)
- 클릭 횟수 텍스트 표시

#### 변경된 파일
- `src/components/DataAnalysis.jsx` - `computeHeatmapData()` 함수 추가
- `src/components/DataAnalysis.css` - `.da-heatmap-*` 스타일 추가
- `ref_file/Tracking_Sheet_260206_03.csv` - 테스트 데이터

---

### v2.4.0 (2026-02-06 01:06~01:43) - 데이터 분석 대시보드

#### 새로운 기능
| 시간 | 커밋 | 내용 |
|------|------|------|
| 01:43 | `2af7cad` | 참조 파일 추가 |
| 01:35 | `66a31e6` | AI 자막 추천 버그 수정 |
| 01:31 | `31da9f6` | 데이터 분석 컴포넌트 개선 |
| 01:06 | `8d33966` | **DataAnalysis 컴포넌트 추가** |

#### 데이터 분석 기능 상세
- **CSV 파싱**: 트래킹 데이터 로드 및 파싱
- **미션별 통계**: 완료율, 소요시간, 첫시도 성공률
- **퍼널 분석**: 단계별 이탈률 시각화
- **A/B 비교**: 기획 1-1 A안 vs B안 성과 비교

#### 변경된 파일
- 신규: `src/components/DataAnalysis.jsx` (72KB)
- 신규: `src/components/DataAnalysis.css`

---

### v2.3.1 (2026-02-06 00:49) - 업데이트

| 시간 | 커밋 | 내용 |
|------|------|------|
| 00:49 | `39d41c0` | 전체 업데이트 |

---

### v2.3.0 (2026-02-05 19:05~23:47) - 로깅 시스템 개선

#### 변경 내역
| 시간 | 커밋 | 내용 |
|------|------|------|
| 23:47 | `7b97c06` | tracking.js 업데이트 |
| 23:44 | `c98e499` | 전체 업데이트 |
| 23:33 | `07ecb40` | **버그 수정**: 로깅 타이밍 이슈 |
| 23:28 | `87142b2` | 업데이트 |
| 19:10 | `3955d37` | URL 생성 기능 |
| 19:05 | `2414804` | 업데이트 |

#### 로깅 시스템 개선 사항
- **로그 큐 시스템**: 순차적 로그 전송 보장
- **지연 시간 조정**: 100ms → 300ms → 500ms
- **미션 포기 로깅**: 이탈 시 진행 상태 기록
- **메모 입력 로깅**: 컷별 메모 작성 추적

#### 변경된 파일
- `src/utils/logger.js` - 로그 큐 시스템 추가
- `src/components/Edit6_1Screen.jsx` - 2단계 미션 로깅
- `src/components/Plan1_1AScreen.jsx` - 메모 로깅
- `src/components/Plan1_1BScreen.jsx` - 메모 로깅

---

### v2.2.3 (2026-02-04 17:35~20:03) - UI/UX 개선 (저녁)

#### 변경 내역
| 시간 | 커밋 | 내용 |
|------|------|------|
| 20:03 | `7cbae94` | 최종 업데이트 |
| 18:49 | `75e6e7e` | 업데이트 |
| 18:40 | `532d0e7` | 업데이트 |
| 18:34 | `d08e751` | 업데이트 |
| 17:46 | `cdcec96` | 업데이트 |
| 17:35 | `a040bad` | 업데이트 |

---

### v2.2.2 (2026-02-04 14:29~17:04) - 화면 업데이트 (오후)

#### 변경 내역
| 시간 | 커밋 | 내용 |
|------|------|------|
| 17:04 | `5765971` | 업데이트 |
| 16:31 | `1671ba3` | 업데이트 |
| 16:25 | `65a466d` | ContentUploadScreenB.css 수정 |
| 16:25 | `35fa473` | 업데이트 |
| 16:10 | `4959eff` | ContentUploadScreenB.css 수정 |
| 16:09 | `727c45d` | 업데이트 |
| 16:00 | `bca6580` | 업데이트 |
| 15:50 | `e85f30f` | **StoryPlanning 편집** |
| 15:43 | `3b949da` | StoryPlanningScreen.css 수정 |
| 15:43 | `2c16b99` | 업데이트 |
| 14:34 | `6d8dfbd` | 업데이트 |
| 14:29 | `374d20c` | **화면 업데이트** |

#### 주요 변경 사항
- StoryPlanningScreen 타임라인 UI 개선
- ContentUploadScreenB 스타일 조정
- 컷 카드 레이아웃 수정

---

### v2.2.1 (2026-02-04 10:32~13:54) - 화면 업데이트 (오전)

#### 변경 내역
| 시간 | 커밋 | 내용 |
|------|------|------|
| 13:54 | `0fd9f9f` | 업데이트 |
| 12:27 | `8d5a6c7` | 업데이트 |
| 10:42 | `a064023` | 업데이트 |
| 10:32 | `c6024b1` | 업데이트 |

---

### v2.2.0 (2026-02-04 00:15~02:12) - 편집/기획 미션 추가 (새벽)

#### 변경 내역
| 시간 | 커밋 | 내용 |
|------|------|------|
| 02:12 | `5e9e0f7` | 업데이트 |
| 02:08 | `7a4a724` | ContentUploadScreenA.css 수정 |
| 02:08 | `1f747e8` | 업데이트 |
| 01:46 | `b130849` | 업데이트 |
| 01:22 | `c2f57b0` | 업데이트 |
| 01:06 | `2078b39` | 브랜치 병합 |
| 01:06 | `b6dfee1` | 업데이트 |
| 00:57 | `3a812a0` | 업데이트 |
| 00:44 | `2b75ed8` | 업데이트 |
| 00:31 | `fa542f8` | 업데이트 |
| 00:28 | `875981a` | 업데이트 |
| 00:15 | `882c6a0` | **편집/기획 미션 시스템 추가** |

#### 새로운 기능
- **Edit1_1Screen**: 영상 업로드 + 재생 미션
- **Edit2_1Screen**: 컷 선택 미션
- **Edit6_1Screen**: AI 자막 2단계 미션
- **Plan1_1AScreen**: 영상 기반 아이디어 노트
- **Plan1_1BScreen**: 타임라인 기반 아이디어 노트

#### 신규 파일
- `src/components/Edit1_1Screen.jsx`
- `src/components/Edit2_1Screen.jsx`
- `src/components/Edit6_1Screen.jsx`
- `src/components/Plan1_1AScreen.jsx`
- `src/components/Plan1_1BScreen.jsx`

---

### v2.1.0 (2026-02-03 10:50~19:10) - Netlify 배포 설정

#### 변경 내역
| 시간 | 커밋 | 내용 |
|------|------|------|
| 19:10 | `d41c903` | 업데이트 |
| 18:43 | `f5a8212` | 업데이트 |
| 18:36 | `86b75ed` | 업데이트 |
| 16:30 | `89dcf34` | **netlify.toml 생성** |
| 16:29 | `a43fc89` | 업데이트 |
| 15:24 | `3611fb9` | 업데이트 |
| 10:50 | `43936e8` | 업데이트 |

#### 새로운 기능
- **Netlify 서버리스 함수**: AI 자막 생성 API
- **배포 자동화**: GitHub 연동 CI/CD
- **환경 변수 설정**: OpenAI API 키 관리

#### 신규 파일
- `netlify.toml`
- `netlify/functions/generate-subtitle.js`

---

### v2.0.0 (2026-01-20 17:42~17:44) - A/B 테스트 시스템

#### 변경 내역
| 시간 | 커밋 | 내용 |
|------|------|------|
| 17:44 | `af1caa1` | 업데이트 |
| 17:42 | `86ead61` | **A/B 테스트 구조 구현** |

#### 새로운 기능
- **MissionMain**: 미션 선택 메인 화면
- **MissionStep**: 단계별 안내 컴포넌트
- **A/B 테스트 구조**: 각 미션별 A/B안 분리

#### 신규 파일
- `src/components/MissionMain.jsx`
- `src/components/MissionStep.jsx`
- `src/components/TemplateDetailA.jsx`
- `src/components/TemplateDetailB.jsx`
- `src/components/StoryPlanningScreenA.jsx`
- `src/components/StoryPlanningScreenB.jsx`
- `src/components/ContentUploadScreenA.jsx`
- `src/components/ContentUploadScreenB.jsx`
- `src/components/SampleTemplateA.jsx`
- `src/components/SampleTemplateB.jsx`

---

### v1.0.0 (2026-01-19 23:35 ~ 2026-01-20 00:05) - 초기 릴리즈

#### 변경 내역
| 시간 | 커밋 | 내용 |
|------|------|------|
| 00:05 | `e2318af` | 첫 빌드 완료 |
| 23:35 | `88be558` | **Initial commit** |

#### 새로운 기능
- **LoginScreen**: Google 소셜 로그인
- **기본 프로젝트 구조**: React + Vite 설정
- **로깅 유틸리티**: `logger.js` 초기 버전

#### 신규 파일
- `src/App.jsx`
- `src/main.jsx`
- `src/components/LoginScreen.jsx`
- `src/utils/logger.js`
- `package.json`
- `vite.config.js`

---

## 버전 요약표

| 버전 | 날짜 | 시간 | 주요 내용 |
|------|------|------|----------|
| v2.4.2 | 2026-02-06 | 02:12~02:24 | 로그 순서/중복 버그 수정 |
| v2.4.1 | 2026-02-06 | 01:59~02:06 | 히트맵 기능 추가 |
| v2.4.0 | 2026-02-06 | 01:06~01:43 | 데이터 분석 대시보드 |
| v2.3.1 | 2026-02-06 | 00:49 | 업데이트 |
| v2.3.0 | 2026-02-05 | 19:05~23:47 | 로깅 시스템 개선 |
| v2.2.3 | 2026-02-04 | 17:35~20:03 | UI/UX 개선 (저녁) |
| v2.2.2 | 2026-02-04 | 14:29~17:04 | 화면 업데이트 (오후) |
| v2.2.1 | 2026-02-04 | 10:32~13:54 | 화면 업데이트 (오전) |
| v2.2.0 | 2026-02-04 | 00:15~02:12 | 편집/기획 미션 추가 |
| v2.1.0 | 2026-02-03 | 10:50~19:10 | Netlify 배포 설정 |
| v2.0.0 | 2026-01-20 | 17:42~17:44 | A/B 테스트 시스템 |
| v1.0.0 | 2026-01-19 | 23:35~00:05 | 초기 릴리즈 |

---

## 기여자

- **개발**: HookHook Team
- **AI 지원**: Claude Code (Anthropic)

---

## 라이선스

Private - All Rights Reserved
