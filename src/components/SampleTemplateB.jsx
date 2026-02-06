import { useEffect, useRef } from 'react';
import './SampleTemplate.css';
import { logScreenView, logButtonClick, logMissionComplete, logScreenExit } from '../utils/logger';

function SampleTemplateB({ onComplete, onBack }) {
  const missionStartTime = useRef(null);

  useEffect(() => {
    logScreenView('sample_template_b');
    const enterTime = Date.now();
    // 화면 진입 시점을 미션 시작 시간으로 사용
    missionStartTime.current = enterTime;
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
    const completionTime = ((Date.now() - missionStartTime.current) / 1000).toFixed(1);
    logMissionComplete('sample_template_b', 'mission_99', `완료시간:${completionTime}초`);
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
