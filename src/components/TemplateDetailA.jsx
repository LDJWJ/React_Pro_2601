import { useState, useEffect, useRef } from 'react';
import './TemplateDetailA.css';
import { logScreenView, logButtonClick, logMissionComplete } from '../utils/logger';

const defaultTemplate = {
  id: 1,
  title: '맛집 브이로그',
  thumbnail: 'https://picsum.photos/400/700?random=1',
  videoUrl: '',
  duration: 18,
  cuts: 6,
  usedCount: 200,
  tags: ['맛집', '브이로그'],
  overlayText: '오늘의 맛집\n소개합니다',
};

function TemplateDetailA({ onComplete, onBack }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const videoRef = useRef(null);
  const missionStartTime = useRef(null);
  const template = defaultTemplate;

  useEffect(() => {
    logScreenView('template_detail_a');
    // 화면 진입 시점을 미션 시작 시간으로 사용
    missionStartTime.current = Date.now();
  }, []);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleHookNote = () => {
    logButtonClick('template_detail_a', 'hook_note_button');
    const completionTime = ((Date.now() - missionStartTime.current) / 1000).toFixed(1);
    logMissionComplete('template_detail_a', 'mission_1', `완료시간:${completionTime}초`);
    setShowComplete(true);
    setTimeout(() => {
      onComplete();
    }, 1500);
  };

  const handleSaveToggle = () => {
    setIsSaved(!isSaved);
    logButtonClick('template_detail_a', 'save_toggle');
  };

  const formatDuration = (duration) => {
    const seconds = typeof duration === 'number' ? duration : parseInt(String(duration).replace(/[^0-9]/g, ''), 10) || 0;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (showComplete) {
    return (
      <div className="td-a-container td-a-complete-screen">
        <div className="td-a-complete-content">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ffd700" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <p className="td-a-complete-text">훅 노트 작성 완료!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="td-a-container">
      <div className="template-detail-header">
        <button className="back-button" onClick={onBack}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="header-title">{template.title}</span>
      </div>

      <div className="template-main-content">
        <div className="template-preview-section">
          <div className="video-player-container" onClick={handlePlayPause}>
            {template.videoUrl ? (
              <>
                <video
                  ref={videoRef}
                  className="video-player"
                  src={template.videoUrl}
                  onEnded={() => setIsPlaying(false)}
                  playsInline
                  muted
                  poster={template.thumbnail}
                />
                {!isPlaying && (
                  <button className="play-button-overlay">▶</button>
                )}
              </>
            ) : (
              <div className="no-video-placeholder">
                <img
                  src={template.thumbnail}
                  alt="템플릿"
                  onError={(e) => {
                    e.target.src = 'https://picsum.photos/400/700?random=' + template.id;
                  }}
                />
                <button className="play-button-overlay">▶</button>
              </div>
            )}
            {template.overlayText && (
              <div className="video-overlay-text">
                {template.overlayText.split('\n').map((line, i) => (
                  <span key={i}>{line}<br /></span>
                ))}
              </div>
            )}
          </div>

          <div className="info-items-column">
            <div className="info-item">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="info-label">{formatDuration(template.duration)}</span>
            </div>
            <div className="info-item">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="2" width="20" height="20" rx="2" />
                <line x1="8" y1="2" x2="8" y2="22" />
                <line x1="16" y1="2" x2="16" y2="22" />
              </svg>
              <span className="info-label">{template.cuts}컷</span>
            </div>
            <div className="info-item">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span className="info-label">{template.usedCount}명</span>
            </div>
          </div>

          <div className="template-bottom-overlay">
            <div className="template-hashtags-overlay">
              <div className="hashtag-list">
                {template.tags.map((tag, idx) => (
                  <span className="hashtag-chip" key={idx}>#{tag}</span>
                ))}
              </div>
              <button
                className={`bookmark-btn${isSaved ? ' bookmark-active' : ''}`}
                onClick={(e) => { e.stopPropagation(); handleSaveToggle(); }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill={isSaved ? '#ffd700' : 'none'} stroke={isSaved ? '#ffd700' : '#ffffff'} strokeWidth="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </button>
            </div>

            <div className="template-bottom-buttons">
              <button className="hh-btn hh-btn-secondary" onClick={handleHookNote}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="8" y1="8" x2="16" y2="8" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                  <line x1="8" y1="16" x2="12" y2="16" />
                </svg>
                훅 노트
              </button>
              <button className="hh-btn hh-btn-primary" onClick={handleHookNote}>
                템플릿 사용하기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TemplateDetailA;
