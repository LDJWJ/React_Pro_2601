import { useEffect, useRef } from 'react';
import './StoryPlanningScreen.css';
import { logScreenView, logButtonClick, logMissionComplete, logScreenExit } from '../utils/logger';

function SampleTemplateA({ onComplete, onBack }) {
  const missionStartTime = useRef(null);

  useEffect(() => {
    logScreenView('sample_template_a');
    const enterTime = Date.now();
    // MissionStep에서 다음 버튼 클릭 시점을 미션 시작 시간으로 사용
    const savedStartTime = sessionStorage.getItem('missionStartTime');
    missionStartTime.current = savedStartTime ? parseInt(savedStartTime, 10) : enterTime;
    return () => {
      const dwellTime = Date.now() - enterTime;
      logScreenExit('sample_template_a', dwellTime);
    };
  }, []);

  const handleBack = () => {
    logButtonClick('sample_template_a', 'back');
    onBack();
  };

  const handleNext = () => {
    logButtonClick('sample_template_a', 'next');
    const completionTime = ((Date.now() - missionStartTime.current) / 1000).toFixed(1);
    logMissionComplete('sample_template_a', 'mission_99', `완료시간:${completionTime}초`);
    onComplete();
  };

  return (
    <div className="story-planning-container">
      <div className="story-header-bar">
        <button className="story-back-button" onClick={handleBack}>
          ‹
        </button>
        <span className="story-header-title">A안 화면</span>
      </div>

      <div className="story-scroll-content">
        <div className="story-content-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <p style={{ color: '#999', fontSize: '16px' }}>A안 화면</p>
        </div>
      </div>

      <div className="story-bottom-buttons">
        <button className="story-save-btn" onClick={handleNext}>
          다음
        </button>
      </div>
    </div>
  );
}

export default SampleTemplateA;
