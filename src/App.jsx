import { useState } from 'react';
import './App.css';
import LoginScreen from './components/LoginScreen';
import CategoryPurpose from './components/CategoryPurpose';
import CategoryTopic from './components/CategoryTopic';
import CategoryPlatform from './components/CategoryPlatform';
import Home from './components/Home';
import Editor from './components/Editor';

function App() {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [activeTab, setActiveTab] = useState('template');
  const [user, setUser] = useState(null);
  const [selections, setSelections] = useState({
    purpose: null,
    topics: [],
    platforms: [],
  });

  const handleLogin = (userInfo) => {
    setUser(userInfo);
    setCurrentScreen('purpose');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentScreen('login');
    setSelections({ purpose: null, topics: [], platforms: [] });
  };

  const handlePurposeNext = (purpose) => {
    setSelections((prev) => ({ ...prev, purpose }));
    setCurrentScreen('topic');
  };

  const handleTopicNext = (topics) => {
    setSelections((prev) => ({ ...prev, topics }));
    setCurrentScreen('platform');
  };

  const handlePlatformNext = (platforms) => {
    const finalSelections = { ...selections, platforms };
    setSelections(finalSelections);
    console.log('온보딩 완료:', finalSelections);
    setCurrentScreen('home');
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleEditorBack = () => {
    setActiveTab('template');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'login':
        return <LoginScreen onLogin={handleLogin} />;
      case 'purpose':
        return <CategoryPurpose onNext={handlePurposeNext} />;
      case 'topic':
        return <CategoryTopic onNext={handleTopicNext} />;
      case 'platform':
        return <CategoryPlatform onNext={handlePlatformNext} />;
      case 'home':
        if (activeTab === 'editor') {
          return <Editor onBack={handleEditorBack} />;
        }
        return (
          <Home
            user={user}
            selections={selections}
            onLogout={handleLogout}
            onTabChange={handleTabChange}
            activeTab={activeTab}
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
