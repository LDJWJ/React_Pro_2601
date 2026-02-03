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
    onNext();
  };

  return (
    <div className="mission-step-container">
      <div className="mission-step-content">
        <h2 className="mission-step-title">{stepTitle}</h2>
        <p className="mission-step-description">{description}</p>
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
