import { useEffect } from 'react';
import './MissionStep.css';
import { logScreenView, logButtonClick } from '../utils/logger';

function MissionStep({ stepTitle, description, buttonText, onNext, screenName }) {
  useEffect(() => {
    if (screenName) {
      logScreenView(screenName);
    }
  }, [screenName]);

  const handleClick = () => {
    logButtonClick(screenName || 'mission_step', 'next_button');
    // 미션 시작 시간 저장 (다음 버튼 클릭 시점)
    sessionStorage.setItem('missionStartTime', Date.now().toString());
    onNext();
  };

  const renderDescription = (text) => {
    const parts = text.split(/(\[기본 미션\]|\[추가 미션\]|\[미션\])/g);
    return parts.map((part, index) => {
      if (part === '[기본 미션]' || part === '[추가 미션]' || part === '[미션]') {
        return <strong key={index} className="mission-highlight">{part}</strong>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="mission-step-container">
      <div className="mission-step-content">
        <h2 className="mission-step-title">{stepTitle}</h2>
        <p className="mission-step-description">{renderDescription(description)}</p>
      </div>
      <div className="mission-step-footer">
        <button className="mission-step-btn" onClick={handleClick}>
          {buttonText || '다음'}
        </button>
      </div>
    </div>
  );
}

export default MissionStep;
