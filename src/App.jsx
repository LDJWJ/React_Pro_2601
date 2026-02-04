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
import SampleTemplateA from './components/SampleTemplateA';
import SampleTemplateB from './components/SampleTemplateB';
import DataAnalysis from './components/DataAnalysis';
import { startInteractionLogging, setInteractionScreen } from './utils/interactionLogger';

function App() {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [user, setUser] = useState(null);

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

      case 'dataAnalysis':
        return (
          <DataAnalysis
            onBack={() => setCurrentScreen('missionMain')}
          />
        );

      default:
        return <LoginScreen onLogin={handleLogin} />;
    }
  };

  return (
    <div className="mobile-app-container">
      <div className="mobile-app-frame">
        {renderScreen()}
      </div>
    </div>
  );
}

export default App;
