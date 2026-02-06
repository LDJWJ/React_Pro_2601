import { useState, useEffect } from 'react';
import './App.css';
import LoginScreen from './components/LoginScreen';
import MissionMain from './components/MissionMain';
import MissionStep from './components/MissionStep';
import TemplateDetailA from './components/TemplateDetailA';
import TemplateDetailB from './components/TemplateDetailB';
import StoryPlanningScreenA from './components/StoryPlanningScreenA';
import StoryPlanningScreenB from './components/StoryPlanningScreenB';
import ContentUploadScreenA from './components/ContentUploadScreenA';
import ContentUploadScreenB from './components/ContentUploadScreenB';
import Edit2_1Screen from './components/Edit2_1Screen';
import Edit1_1Screen from './components/Edit1_1Screen';
import Edit6_1Screen from './components/Edit6_1Screen';
import SampleTemplateA from './components/SampleTemplateA';
import SampleTemplateB from './components/SampleTemplateB';
import DataAnalysis from './components/DataAnalysis';
import DataVisualizer from './components/DataVisualizer';
import Plan1_1AScreen from './components/Plan1_1AScreen';
import Plan1_1BScreen from './components/Plan1_1BScreen';
import { startInteractionLogging, setInteractionScreen } from './utils/interactionLogger';

// URL 해시와 화면 매핑
const SCREEN_ROUTES = {
  'edit1-1': '편집1-1',
  'edit1-1-screen': '편집1-1_화면',
  'edit2-1': '편집2-1',
  'edit2-1-screen': '편집2-1_화면',
  'edit6-1': '편집6-1',
  'edit6-1-screen': '편집6-1_화면',
  'plan1-1': '기획1-1',
  'plan1-1-screen': '기획1-1_화면',
  'plan1-2': '기획1-2',
  'plan1-2-screen': '기획1-2_화면',
  'main': 'missionMain',
  'login': 'login',
};

// 화면에서 URL 해시로 역매핑
const ROUTE_FROM_SCREEN = Object.fromEntries(
  Object.entries(SCREEN_ROUTES).map(([k, v]) => [v, k])
);

function App() {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [user, setUser] = useState(null);

  // URL 해시에서 초기 화면 설정
  useEffect(() => {
    const hash = window.location.hash.slice(2); // '#/' 제거
    if (hash && SCREEN_ROUTES[hash]) {
      setCurrentScreen(SCREEN_ROUTES[hash]);
    }
  }, []);

  // 화면 변경 시 URL 해시 업데이트
  useEffect(() => {
    const route = ROUTE_FROM_SCREEN[currentScreen];
    if (route) {
      window.history.replaceState(null, '', `#/${route}`);
    }
  }, [currentScreen]);

  // 브라우저 뒤로가기/앞으로가기 처리
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(2);
      if (hash && SCREEN_ROUTES[hash]) {
        setCurrentScreen(SCREEN_ROUTES[hash]);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // 인터랙션 로깅 시작
  useEffect(() => {
    startInteractionLogging();
  }, []);

  // 화면 전환 시 인터랙션 로그에 화면 이름 설정
  useEffect(() => {
    setInteractionScreen(currentScreen);
  }, [currentScreen]);

  const handleLogin = (userInfo) => {
    setUser(userInfo);
    setCurrentScreen('missionMain');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentScreen('login');
  };

  const handleMissionSelect = (missionId) => {
    if (missionId === 1) {
      setCurrentScreen('mission1_1');
    } else if (missionId === 2) {
      setCurrentScreen('mission2_1');
    } else if (missionId === 3) {
      setCurrentScreen('mission3_1');
    } else if (missionId === 5) {
      setCurrentScreen('mission99_1');
    } else if (missionId === 6) {
      setCurrentScreen('dataAnalysis');
    } else if (missionId === 7) {
      setCurrentScreen('편집2-1');
    } else if (missionId === 8) {
      setCurrentScreen('편집6-1');
    } else if (missionId === 9) {
      setCurrentScreen('편집1-1');
    } else if (missionId === 10) {
      setCurrentScreen('기획1-1');
    } else if (missionId === 12) {
      setCurrentScreen('기획1-2');
    } else if (missionId === 11) {
      setCurrentScreen('dataVisualizer');
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'login':
        return <LoginScreen onLogin={handleLogin} />;

      case 'missionMain':
        return (
          <MissionMain
            user={user}
            onMissionSelect={handleMissionSelect}
            onLogout={handleLogout}
          />
        );

      case 'mission1_1':
        return (
          <MissionStep
            stepTitle="영상 기획하기"
            description="화면에서 영상 기획하기 버튼을 눌러주세요"
            buttonText="다음"
            screenName="mission1_1"
            onNext={() => setCurrentScreen('templateDetailA')}
          />
        );

      case 'templateDetailA':
        return (
          <TemplateDetailA
            onComplete={() => setCurrentScreen('mission1_2')}
            onBack={() => setCurrentScreen('mission1_1')}
          />
        );

      case 'mission1_2':
        return (
          <MissionStep
            stepTitle="영상 기획하기"
            description="화면에서 '영상 기획하기' 버튼을 눌러주세요"
            buttonText="다음"
            screenName="mission1_2"
            onNext={() => setCurrentScreen('templateDetailB')}
          />
        );

      case 'templateDetailB':
        return (
          <TemplateDetailB
            onComplete={() => setCurrentScreen('missionMain')}
            onBack={() => setCurrentScreen('mission1_2')}
          />
        );

      case 'mission2_1':
        return (
          <MissionStep
            stepTitle="영상 기획하기 A안"
            description="영상 아이디어 노트를 작성하고 저장하기를 눌러주세요."
            buttonText="다음"
            screenName="mission2_1"
            onNext={() => setCurrentScreen('storyPlanningA')}
          />
        );

      case 'storyPlanningA':
        return (
          <StoryPlanningScreenA
            onComplete={() => setCurrentScreen('mission2_2')}
            onBack={() => setCurrentScreen('mission2_1')}
          />
        );

      case 'mission2_2':
        return (
          <MissionStep
            stepTitle="영상 기획하기 B안"
            description="화면을 보고 영상 기획 메모를 작성하고 저장하기를 눌러주세요."
            buttonText="다음"
            screenName="mission2_2"
            onNext={() => setCurrentScreen('storyPlanningB')}
          />
        );

      case 'storyPlanningB':
        return (
          <StoryPlanningScreenB
            onComplete={() => setCurrentScreen('missionMain')}
            onBack={() => setCurrentScreen('mission2_2')}
          />
        );

      case 'mission3_1':
        return (
          <MissionStep
            stepTitle="콘텐츠 업로드 A안"
            description="화면을 보고 영상을 업로드하고 AI 자막 추천을 사용해보세요."
            buttonText="다음"
            screenName="mission3_1"
            onNext={() => setCurrentScreen('contentUploadA')}
          />
        );

      case 'contentUploadA':
        return (
          <ContentUploadScreenA
            onComplete={() => setCurrentScreen('mission3_2')}
            onBack={() => setCurrentScreen('mission3_1')}
          />
        );

      case 'mission3_2':
        return (
          <MissionStep
            stepTitle="콘텐츠 업로드 B안"
            description="화면을 보고 영상을 업로드하고 AI 자막 추천을 사용해보세요."
            buttonText="다음"
            screenName="mission3_2"
            onNext={() => setCurrentScreen('contentUploadB')}
          />
        );

      case 'contentUploadB':
        return (
          <ContentUploadScreenB
            onComplete={() => setCurrentScreen('missionMain')}
            onBack={() => setCurrentScreen('mission3_2')}
          />
        );

      case 'mission99_1':
        return (
          <MissionStep
            stepTitle="영상 기획하기 A안"
            description="영상 아이디어 노트를 작성하고 저장하기를 눌러주세요."
            buttonText="다음"
            screenName="mission99_1"
            onNext={() => setCurrentScreen('sampleTemplateA')}
          />
        );

      case 'sampleTemplateA':
        return (
          <SampleTemplateA
            onComplete={() => setCurrentScreen('mission99_2')}
            onBack={() => setCurrentScreen('mission99_1')}
          />
        );

      case 'mission99_2':
        return (
          <MissionStep
            stepTitle="영상 기획하기 B안"
            description="화면을 보고 영상 기획 메모를 작성하고 저장하기를 눌러주세요."
            buttonText="다음"
            screenName="mission99_2"
            onNext={() => setCurrentScreen('sampleTemplateB')}
          />
        );

      case 'sampleTemplateB':
        return (
          <SampleTemplateB
            onComplete={() => setCurrentScreen('missionMain')}
            onBack={() => setCurrentScreen('mission99_2')}
          />
        );

      case '편집1-1':
        return (
          <MissionStep
            stepTitle="템플릿을 이용해 편집 시작하기"
            description="[미션] 영상을 추가하고, 추가한 영상이 제대로 들어갔는지 재생해보세요."
            buttonText="다음"
            screenName="편집1-1_미션설명"
            onNext={() => setCurrentScreen('편집1-1_화면')}
          />
        );

      case '편집1-1_화면':
        return (
          <Edit1_1Screen
            onComplete={() => setCurrentScreen('missionMain')}
            onBack={() => setCurrentScreen('편집1-1')}
          />
        );

      case '편집2-1':
        return (
          <MissionStep
            stepTitle="컷을 이동하며 원하는 구간 찾기"
            description={`[미션] 현재 1번 컷을 편집 중입니다.\n👉 4번째 컷을 수정하고 싶습니다.\n4번째 컷을 선택해주세요.`}
            buttonText="다음"
            screenName="편집2-1_미션설명"
            onNext={() => setCurrentScreen('편집2-1_화면')}
          />
        );

      case '편집2-1_화면':
        return (
          <Edit2_1Screen
            onComplete={() => setCurrentScreen('missionMain')}
            onBack={() => setCurrentScreen('편집2-1')}
          />
        );

      case '편집6-1':
        return (
          <MissionStep
            stepTitle="추천 자막 중 하나 선택하기"
            description={`[기본 미션]\n이 장면에 어울리는 자막을 AI 추천 기능을 이용해 추가해보세요.\n\n[추가 미션]\n마음에 드는 자막이 없다면, AI 추천을 이용해서 다른 추천 자막을 확인해 보세요.`}
            buttonText="다음"
            screenName="편집6-1_미션설명"
            onNext={() => setCurrentScreen('편집6-1_화면')}
          />
        );

      case '편집6-1_화면':
        return (
          <Edit6_1Screen
            onComplete={() => setCurrentScreen('missionMain')}
            onBack={() => setCurrentScreen('편집6-1')}
          />
        );

      case '기획1-1':
        return (
          <MissionStep
            stepTitle={`기획 1-1: 아이디어 메모 \n(6컷 개별)`}
            description={`[미션]영상 아이디어를 메모하려고 합니다.\n아이디어 노트를 활용해, 메모 작성이 \n완료되면 저장하기를 선택해 주세요.\n하나 이상은 메모 작성이 필요합니다.`}
            buttonText="다음"
            screenName="기획1-1"
            onNext={() => setCurrentScreen('기획1-1_화면')}
          />
        );

      case '기획1-1_화면':
        return (
          <Plan1_1AScreen
            onComplete={() => setCurrentScreen('missionMain')}
            onBack={() => setCurrentScreen('기획1-1')}
          />
        );

      case '기획1-2':
        return (
          <MissionStep
            stepTitle={`기획 1-2: 아이디어 메모 \n(3컷 그룹)`}
            description={`[미션]영상 아이디어를 메모하려고 합니다.\n아이디어 노트를 활용해, 메모 작성이 \n완료되면 저장하기를 선택해 주세요.\n하나 이상은 메모 작성이 필요합니다.`}
            buttonText="다음"
            screenName="기획1-2"
            onNext={() => setCurrentScreen('기획1-2_화면')}
          />
        );

      case '기획1-2_화면':
        return (
          <Plan1_1BScreen
            onComplete={() => setCurrentScreen('missionMain')}
            onBack={() => setCurrentScreen('기획1-2')}
          />
        );

      case 'dataAnalysis':
        return (
          <DataAnalysis
            onBack={() => setCurrentScreen('missionMain')}
          />
        );

      case 'dataVisualizer':
        return (
          <DataVisualizer
            onBack={() => setCurrentScreen('missionMain')}
          />
        );

      default:
        return <LoginScreen onLogin={handleLogin} />;
    }
  };

  // DataVisualizer는 전체 화면 사용
  if (currentScreen === 'dataVisualizer') {
    return (
      <DataVisualizer
        onBack={() => setCurrentScreen('missionMain')}
      />
    );
  }

  return (
    <div className="mobile-app-container">
      <div className="mobile-app-frame">
        {renderScreen()}
      </div>
    </div>
  );
}

export default App;
