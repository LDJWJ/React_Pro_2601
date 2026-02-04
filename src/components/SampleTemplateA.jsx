import { useEffect } from 'react';
import './StoryPlanningScreen.css';
import { logScreenView, logButtonClick, logScreenExit } from '../utils/logger';

function SampleTemplateA({ onComplete, onBack }) {
  useEffect(() => {
    logScreenView('sample_template_a');
    const enterTime = Date.now();
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
