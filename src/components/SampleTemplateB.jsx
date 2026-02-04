import { useEffect } from 'react';
import './StoryPlanningScreen.css';
import { logScreenView, logButtonClick, logMissionComplete, logScreenExit } from '../utils/logger';

function SampleTemplateB({ onComplete, onBack }) {
  useEffect(() => {
    logScreenView('sample_template_b');
    const enterTime = Date.now();
    return () => {
      const dwellTime = Date.now() - enterTime;
      logScreenExit('sample_template_b', dwellTime);
    };
  }, []);

  const handleBack = () => {
    logButtonClick('sample_template_b', 'back');
    onBack();
  };

  const handleComplete = () => {
    logButtonClick('sample_template_b', 'complete');
    logMissionComplete('sample_template_b', 'mission_99');
    onComplete();
  };

  return (
    <div className="story-planning-container">
      <div className="story-header-bar">
        <button className="story-back-button" onClick={handleBack}>
          ‹
        </button>
        <span className="story-header-title">B안 화면</span>
      </div>

      <div className="story-scroll-content">
        <div className="story-content-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <p style={{ color: '#999', fontSize: '16px' }}>B안 화면</p>
        </div>
      </div>

      <div className="story-bottom-buttons">
        <button className="story-save-btn" onClick={handleComplete}>
          완료
        </button>
      </div>
    </div>
  );
}

export default SampleTemplateB;
