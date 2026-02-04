import { useState, useEffect, useRef } from 'react';
import './ContentUploadScreenA.css';
import { logScreenView, logButtonClick, logScreenExit } from '../utils/logger';

const defaultCuts = [
  { id: 1, title: '인트로 (첫 장면)', duration: '2초', description: '시선을 끌고 분위기를 시작하는 장면이에요.' },
  { id: 2, title: '제품 보여주기', duration: '0.5초', description: '제품이 손이나 얼굴에 닿는 순간만 보여줘도 좋아요.' },
  { id: 3, title: '사용 장면', duration: '1초', description: '이 제품의 특징이 잘 보이는 부분을 담아요.' },
  { id: 4, title: '리액션 컷', duration: '2초', description: '사용 후 만족스러운 표정이나 반응을 보여주세요.' },
  { id: 5, title: '마무리 컷', duration: '0.5초', description: '제품과 함께 자연스러운 엔딩 장면을 담아요.' },
];

function Mission6ScreenA({ onComplete, onBack }) {
  const [currentCutIndex, setCurrentCutIndex] = useState(0);
  const [cutData, setCutData] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(null);
  const [thumbnails, setThumbnails] = useState({});
  const [completed, setCompleted] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    logScreenView('mission6_screen_a');
    const enterTime = Date.now();
    setCutData(defaultCuts.map(cut => ({
      ...cut,
      videoFile: null,
      videoPreview: null,
      subtitle: '',
    })));
    return () => {
      const dwellTime = Date.now() - enterTime;
      logScreenExit('mission6_screen_a', dwellTime);
    };
  }, []);

  const currentCut = cutData[currentCutIndex];
  const totalCuts = cutData.length;

  // 영상에서 썸네일 프레임 추출
  const generateThumbnail = (videoUrl, cutIndex) => {
    const video = document.createElement('video');
    video.src = videoUrl;
    video.crossOrigin = 'anonymous';
    video.muted = true;

    video.addEventListener('loadeddata', () => {
      video.currentTime = 0.5;
    });

    video.addEventListener('seeked', () => {
      const canvas = document.createElement('canvas');
      canvas.width = 120;
      canvas.height = 80;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7);
      setThumbnails(prev => ({ ...prev, [cutIndex]: thumbnailUrl }));
    });
  };

  // 타임라인 클릭 시 컷 전환
  const handleTimelineCutSelect = (index) => {
    logButtonClick('mission6_screen_a', 'timeline_cut_select', String(index + 1));
    setAiSuggestions([]);
    setSelectedSuggestionIndex(null);
    setCurrentCutIndex(index);
  };

  // 뒤로가기
  const handleBack = () => {
    logButtonClick('mission6_screen_a', 'back');
    onBack();
  };

  // 영상 업로드
  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      logButtonClick('mission6_screen_a', 'video_upload');
      const videoUrl = URL.createObjectURL(file);
      setCutData(prev => prev.map((cut, index) =>
        index === currentCutIndex
          ? { ...cut, videoFile: file, videoPreview: videoUrl }
          : cut
      ));
      generateThumbnail(videoUrl, currentCutIndex);
    }
  };

  const handleSubtitleChange = (e) => {
    const value = e.target.value;
    setCutData(prev => prev.map((cut, index) =>
      index === currentCutIndex
        ? { ...cut, subtitle: value }
        : cut
    ));
  };

  const handleAISubtitle = async () => {
    logButtonClick('mission6_screen_a', 'ai_subtitle');
    setIsLoadingAI(true);
    setAiSuggestions([]);
    setSelectedSuggestionIndex(null);

    try {
      const response = await fetch('/.netlify/functions/generate-subtitle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cutTitle: currentCut?.title || '',
          cutDescription: currentCut?.description || '',
          userKeyword: currentCut?.subtitle || '',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate subtitles');
      }

      const data = await response.json();
      setAiSuggestions(data.subtitles || []);
    } catch (error) {
      console.error('AI 자막 생성 오류:', error);
      setAiSuggestions([
        '지금 바로 확인해보세요!',
        '이 순간을 놓치지 마세요!',
        '함께 즐겨보세요!',
      ]);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleSelectSuggestion = (suggestion, index) => {
    logButtonClick('mission6_screen_a', 'ai_suggestion_select', suggestion);
    setSelectedSuggestionIndex(index);
    setCutData(prev => prev.map((cut, i) =>
      i === currentCutIndex
        ? { ...cut, subtitle: suggestion }
        : cut
    ));
  };

  // "완성하기"
  const handleComplete = () => {
    logButtonClick('mission6_screen_a', 'complete');
    setCompleted(true);
  };

  if (!currentCut) {
    return (
      <div className="cua-container">
        <div className="cua-loading">로딩 중...</div>
      </div>
    );
  }

  // 완료 화면
  if (completed) {
    return (
      <div className="cua-container">
        <div className="cua-complete-overlay">
          <div className="cua-complete-message">
            <div className="cua-complete-check">✓</div>
            <p>미션을 완료했습니다.</p>
          </div>
          <div className="cua-complete-footer">
            <button className="cua-complete-btn" onClick={onComplete}>
              완료
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cua-container">
      <div className="cua-scroll-content">
        {/* 메인 영역: 영상 추가 */}
        <div className="cua-main-preview">
          {/* 왼쪽 하단 정보 */}
          <div className="cua-info-overlay">
            <div className="cua-info-item">
              <span className="cua-info-icon">⏱</span>
              <span className="cua-info-text">00:12</span>
            </div>
            <div className="cua-info-item">
              <img src="/icons/Icons_v2.png" alt="" className="cua-info-icon" style={{ width: 16, height: 16 }} />
              <span className="cua-info-text">{totalCuts}컷</span>
            </div>
          </div>

          {/* 영상 추가 영역 - 중앙 */}
          <div className="cua-video-area" onClick={() => !currentCut.videoPreview && fileInputRef.current?.click()}>
            {currentCut.videoPreview ? (
              <>
                <video
                  ref={videoRef}
                  src={currentCut.videoPreview}
                  className="cua-video-player"
                  preload="auto"
                  playsInline
                />
                <button
                  className="cua-play-overlay"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (videoRef.current) {
                      if (videoRef.current.paused) {
                        videoRef.current.play();
                      } else {
                        videoRef.current.pause();
                      }
                    }
                  }}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    zIndex: 2,
                  }}
                >
                  <img src="/icons/PLAY.png" alt="재생" style={{ width: 24, height: 24 }} />
                </button>
              </>
            ) : (
              <div className="cua-video-placeholder">
                <span className="cua-plus-icon">+</span>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleVideoUpload}
            style={{ display: 'none' }}
          />
        </div>

        {/* 하단 타임라인 - duration이 썸네일 위에 오버레이 */}
        <div className="cua-timeline">
          <div className="cua-timeline-scroll">
            {cutData.map((cut, index) => (
              <div
                key={cut.id}
                className={`cua-timeline-item ${index === currentCutIndex ? 'active' : ''}`}
                onClick={() => handleTimelineCutSelect(index)}
              >
                <div className="cua-timeline-thumb">
                  {thumbnails[index] ? (
                    <img src={thumbnails[index]} alt={`컷 ${index + 1}`} />
                  ) : (
                    <div className="cua-thumb-empty" />
                  )}
                  <span className="cua-timeline-duration">{cut.duration}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 컷 정보 카드 */}
        <div className="cua-cut-info">
          <img src="/icons/Icons_v2.png" alt="" className="cua-cut-icon" style={{ width: 16, height: 16 }} />
          <span className="cua-cut-number">{currentCutIndex + 1}</span>
          <span className="cua-cut-title">{currentCut.title}</span>
        </div>

        {/* 자막 섹션 */}
        <div className="cua-subtitle-section">
          <div className="cua-subtitle-header">
            <span className="cua-subtitle-label">자막</span>
            <button
              className={`cua-ai-button ${isLoadingAI ? 'loading' : ''}`}
              onClick={handleAISubtitle}
              disabled={isLoadingAI}
            >
              {isLoadingAI ? '생성 중...' : '+ Ai 자막 추천'}
            </button>
          </div>
          <input
            type="text"
            className="cua-subtitle-input"
            placeholder="자막을 입력하세요"
            value={currentCut.subtitle || ''}
            onChange={handleSubtitleChange}
          />

          {/* AI 추천 자막 */}
          {aiSuggestions.length > 0 && (
            <div className="cua-ai-suggestions">
              {aiSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className={`cua-suggestion-chip ${selectedSuggestionIndex === index ? 'selected' : ''}`}
                  onClick={() => handleSelectSuggestion(suggestion, index)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 하단 버튼 - 고정 */}
      <div className="cua-footer">
        <button className="cua-complete-button" onClick={handleComplete}>
          완성하기
        </button>
      </div>
    </div>
  );
}

export default Mission6ScreenA;
