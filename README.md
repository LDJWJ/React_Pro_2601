# HookHook - 숏폼 영상 편집 앱

모바일 숏폼 영상 제작을 위한 React 기반 웹 애플리케이션 프로토타입입니다.

## 기술 스택

- **React** 19.2.0
- **Vite** 7.2.4
- **Google OAuth** (@react-oauth/google)

## 주요 기능

### 1. 로그인 화면 (`LoginScreen`)
- Google 소셜 로그인 (구현 완료)
- 네이버 로그인 (UI만 구현)
- Apple 로그인 (UI만 구현)

### 2. 온보딩 플로우
사용자 맞춤 템플릿 추천을 위한 3단계 온보딩:

**목적 선택 (`CategoryPurpose`)**
- 가게/브랜드 소개
- 제품/메뉴 홍보
- 일상/경험 공유
- 리뷰/정보 전달

**주제 선택 (`CategoryTopic`)** - 복수 선택 가능
- 일상기록, 홍보, 여행
- 패션·뷰티, 맛집·카페, 운동·건강

**플랫폼 선택 (`CategoryPlatform`)** - 복수 선택 가능
- 인스타그램 릴스, 유튜브 쇼츠, 틱톡
- 네이버 클립, 카카오톡 지금

### 3. 홈 화면 (`Home`)
- 검색 바
- **3D 캐러셀**: 사용자 맞춤 추천 템플릿 표시
- 주말 추천 템플릿 그리드
- 하단 네비게이션 (템플릿, 편집기, 마이페이지)

### 4. 영상 편집기 (`Editor`)
- **미디어 추가**: 영상/이미지 업로드
- **텍스트 오버레이**: 드래그 가능, 시간 범위 설정
- **자막 추가**: 시작/종료 시간 지정
- **BGM 추가**: 배경 음악 선택
- **음성 녹음**: 마이크 녹음 기능
- **타임라인**: 미디어, 자막, 음악, 음성 트랙 시각화
- **재생 컨트롤**: 재생/일시정지, 시간 탐색

## 프로젝트 구조

```
src/
├── App.jsx                 # 메인 앱 (화면 라우팅)
├── App.css
├── main.jsx               # 엔트리 포인트
├── index.css
├── assets/
│   └── logo.png           # 앱 로고
├── components/
│   ├── LoginScreen.jsx    # 로그인 화면
│   ├── LoginScreen.css
│   ├── CategoryPurpose.jsx # 목적 선택
│   ├── CategoryTopic.jsx   # 주제 선택
│   ├── CategoryPlatform.jsx # 플랫폼 선택
│   ├── Category.css
│   ├── Home.jsx           # 홈 화면
│   ├── Home.css
│   ├── Editor.jsx         # 영상 편집기
│   └── Editor.css
└── utils/
    └── logger.js          # 로깅 유틸리티
```

## 실행 방법

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview
```

## 화면 흐름

```
로그인 → 목적 선택 → 주제 선택 → 플랫폼 선택 → 홈
                                              ↓
                                          편집기
```

## 버전 히스토리

### v1.6.0 (2026-01-20)
**텍스트 크기 조절 슬라이더 추가**
- 텍스트 선택 시 크기 조절 슬라이더 표시
- 12px ~ 72px 범위 조절 가능
- 현재 크기 실시간 표시

| 파일 | 변경 내용 |
|------|----------|
| `src/components/Editor.jsx` | `handleTextSize`, `getEditingText` 함수, 슬라이더 UI 추가 |
| `src/components/Editor.css` | `.size-control`, `.size-slider`, `.size-value` 스타일 추가 |

---

### v1.5.0 (2026-01-20)
**Canvas 미리보기 동기화 - 편집/내보내기 일치**
- 미리보기 영역에 Canvas 레이어 추가
- 공통 텍스트 렌더링 함수 `drawTextOnCanvas` 구현
- 편집 화면과 내보내기 결과의 텍스트 크기/위치 100% 일치
- 편집용 투명 오버레이로 드래그/클릭 기능 유지

| 파일 | 변경 내용 |
|------|----------|
| `src/components/Editor.jsx` | `previewCanvasRef`, `drawTextOnCanvas`, Canvas 미리보기 추가 |
| `src/components/Editor.css` | `.preview-canvas`, `.text-overlay-edit`, `.hidden-video` 스타일 추가 |

---

### v1.4.0 (2026-01-20)
**Canvas 기반 텍스트 포함 내보내기 기능 추가**
- Canvas + MediaRecorder 방식으로 텍스트 오버레이가 포함된 영상 내보내기
- 내보내기 방식 선택 모달 UI 추가
- 실시간 녹화 방식으로 한글 텍스트 완벽 지원
- WebM 형식 출력

| 파일 | 변경 내용 |
|------|----------|
| `src/components/Editor.jsx` | `handleCanvasExport` 함수, 내보내기 옵션 모달 추가 |
| `src/components/Editor.css` | `.export-options-modal`, `.export-option-item` 스타일 추가 |

---

### v1.3.0 (2026-01-20)
**FFmpeg.wasm 내보내기 기능 추가**
- `@ffmpeg/ffmpeg`, `@ffmpeg/util` 패키지 추가
- 텍스트 오버레이가 적용된 영상 내보내기 기능
- 내보내기 진행률 UI 추가
- Vite 설정에 SharedArrayBuffer 지원 헤더 추가

| 파일 | 변경 내용 |
|------|----------|
| `package.json` | FFmpeg 패키지 의존성 추가 |
| `vite.config.js` | CORS 헤더 설정 추가 |
| `src/components/Editor.jsx` | FFmpeg 로드, 내보내기 함수, 진행 모달 추가 |
| `src/components/Editor.css` | 내보내기 모달 스타일 추가 |

---

### v1.2.0 (2026-01-20)
**텍스트 위치 조절 기능 개선**
- 9방향 프리셋 위치 버튼 추가 (↖↑↗←●→↙↓↘)
- 버튼 클릭 시 현재 위치에서 3%씩 이동 (약 10px)
- 중앙 버튼(●)은 정중앙(50%, 50%)으로 리셋
- 드래그 앤 드롭으로 미세 조정 가능

| 파일 | 변경 내용 |
|------|----------|
| `src/components/Editor.jsx` | `handleTextPosition` 함수, 위치 조절 패널 UI 추가 |
| `src/components/Editor.css` | `.text-position-panel`, `.position-grid`, `.position-btn` 스타일 추가 |

---

### v1.1.0 (2026-01-20)
**편집기 UI 개선**
- 자막 추가 버튼 섹션 제거
- 음악 트랙 섹션 제거
- 타임라인 트랙 높이 증가 (28px → 44px)

| 파일 | 변경 내용 |
|------|----------|
| `src/components/Editor.jsx` | `subtitle-section`, `music-track-section` 제거 |
| `src/components/Editor.css` | `.timeline-track` 높이 44px로 변경 |

---

### v1.0.0 (2026-01-20)
**초기 버전**
- 로그인 화면 (Google OAuth)
- 온보딩 플로우 (목적/주제/플랫폼 선택)
- 홈 화면 (3D 캐러셀 템플릿 추천)
- 영상 편집기 (미디어, 텍스트, 자막, BGM, 음성 녹음, 타임라인)

