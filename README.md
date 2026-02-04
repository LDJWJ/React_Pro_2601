# HookHook - 프로토타입 사용성 테스트 앱

숏폼 영상 제작 앱의 A/B 테스트를 위한 React 기반 프로토타입입니다.

## 기술 스택

- **React** 19.2.0
- **Vite** 7.2.4
- **Google OAuth** (@react-oauth/google)
- **Netlify** (배포 및 서버리스 함수)

## 주요 기능

### 1. 로그인 화면 (`LoginScreen`)
- Google 소셜 로그인

### 2. 미션 메인 화면 (`MissionMain`)
3가지 미션을 선택하여 A/B안 프로토타입을 테스트할 수 있습니다:
- 미션 1: 템플릿 상세 보기
- 미션 2: 영상 기획하기
- 미션 3: 콘텐츠 업로드

### 3. 미션 1 - 템플릿 상세 (`TemplateDetail`)
- **A안**: 템플릿 상세 화면 A 버전
- **B안**: 템플릿 상세 화면 B 버전

### 4. 미션 2 - 영상 기획하기 (`StoryPlanningScreen`)
- **A안**: 영상 아이디어 노트 작성 화면 A 버전
- **B안**: 영상 아이디어 노트 작성 화면 B 버전

### 5. 미션 3 - 콘텐츠 업로드 (`ContentUploadScreen`)
- **A안**: 콘텐츠 업로드 및 AI 자막 추천 화면 A 버전
- **B안**: 콘텐츠 업로드 화면 B 버전

### 6. 미션 99 - A/B안 샘플미션 (`SampleTemplate`)
- **A안**: 빈 샘플 화면 A 버전
- **B안**: 빈 샘플 화면 B 버전

## 프로젝트 구조

```
src/
├── App.jsx                      # 메인 앱 (화면 라우팅)
├── App.css
├── main.jsx                     # 엔트리 포인트
├── index.css
├── components/
│   ├── LoginScreen.jsx          # 로그인 화면
│   ├── LoginScreen.css
│   ├── MissionMain.jsx          # 미션 선택 메인 화면
│   ├── MissionMain.css
│   ├── MissionStep.jsx          # 미션 단계 안내 컴포넌트
│   ├── MissionStep.css
│   ├── TemplateDetailA.jsx      # 템플릿 상세 A안
│   ├── TemplateDetailB.jsx      # 템플릿 상세 B안
│   ├── TemplateDetailA.css
│   ├── TemplateDetailB.css
│   ├── StoryPlanningScreenA.jsx # 영상 기획 A안
│   ├── StoryPlanningScreenB.jsx # 영상 기획 B안
│   ├── StoryPlanningScreen.css
│   ├── ContentUploadScreenA.jsx # 콘텐츠 업로드 A안
│   ├── ContentUploadScreenB.jsx # 콘텐츠 업로드 B안
│   ├── ContentUploadScreen.css
│   ├── ContentUploadScreenB.css
│   ├── SampleTemplateA.jsx      # 샘플미션 A안
│   └── SampleTemplateB.jsx      # 샘플미션 B안
└── utils/
    └── logger.js                # 사용자 행동 로깅 유틸리티
```

## 화면 흐름

```
로그인 → 미션 메인
           ├── 미션 1 → 템플릿 상세 A → 템플릿 상세 B → 미션 메인
           ├── 미션 2 → 영상 기획 A → 영상 기획 B → 미션 메인
           ├── 미션 3 → 콘텐츠 업로드 A → 콘텐츠 업로드 B → 미션 메인
           └── 미션 99 → 샘플 A안 → 샘플 B안 → 미션 메인
```

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

## 환경 변수

`.env.example`을 참고하여 `.env` 파일을 생성하세요:

```
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

## 배포

Netlify를 통해 자동 배포됩니다. `netlify.toml` 설정 파일이 포함되어 있습니다.
