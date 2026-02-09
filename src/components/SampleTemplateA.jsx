import { useEffect, useRef } from 'react';
import './SampleTemplate.css';
import { logScreenView, logButtonClick, logMissionComplete, logScreenExit } from '../utils/logger';

function SampleTemplateA({ onComplete, onBack }) {
  const missionStartTime = useRef(null);

  useEffect(() => {
    logScreenView('sample_template_a');
    const enterTime = Date.now();
    // 화면 진입 시점을 미션 시작 시간으로 사용
    missionStartTime.current = enterTime;
    return () => {
      const dwellTime = Date.now() - enterTime;
      logScreenExit('sample_template_a', dwellTime);
    };
  }, []);

  const handleBack = () => {
    logButtonClick('sample_template_a', 'back');
    onBack();
  };

  const handleNext = async () => {
    logButtonClick('sample_template_a', 'next');
    const completionTime = ((Date.now() - missionStartTime.current) / 1000).toFixed(1);
    // 미션 완료 로그 전송 완료를 기다림 (로그 누락 방지)
    await logMissionComplete('sample_template_a', 'mission_99', `완료시간:${completionTime}초`);
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
