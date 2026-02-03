import { useState, useEffect, useRef, useCallback } from 'react';
import './ContentUploadScreen.css';
import { logScreenView, logButtonClick } from '../utils/logger';

const defaultCuts = [
  { id: 1, title: '인트로 (첫 장면)', duration: '2초', description: '시선을 끌고 분위기를 시작하는 장면이에요.', memo: '' },
  { id: 2, title: '제품 보여주기', duration: '3초', description: '제품이 손이나 얼굴에 닿는 순간만 보여줘도 좋아요.', memo: '' },
  { id: 3, title: '사용 장면', duration: '3초', description: '이 제품의 특징이 잘 보이는 부분을 담아요.', memo: '' },
  { id: 4, title: '리액션 컷', duration: '2초', description: '사용 후 만족스러운 표정이나 반응을 보여주세요.', memo: '' },
  { id: 5, title: '마무리 컷', duration: '2초', description: '제품과 함께 자연스러운 엔딩 장면을 담아요.', memo: '' },
];

function ContentUploadScreenA({ onComplete, onBack }) {
  const [currentCutIndex, setCurrentCutIndex] = useState(0);
  const [cutData, setCutData] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(null);
  const [thumbnails, setThumbnails] = useState({});
  const [completed, setCompleted] = useState(false);
  const fileInputRef = useRef(null);
  const mainScrollRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    logScreenView('content_upload_a');
    setCutData(defaultCuts.map(cut => ({
      ...cut,
      videoFile: null,
      videoPreview: null,
      subtitle: '',
    })));
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

  // "2초" → "2s" 변환
  const parseDuration = (durationStr) => {
    if (!durationStr) return '';
    const match = durationStr.match(/(\d+)/);
    return match ? `${match[1]}s` : durationStr;
  };

  // 타임라인 클릭 시 컷 전환
  const handleTimelineCutSelect = (index) => {
    logButtonClick('content_upload_a', 'timeline_cut_select', String(index + 1));
    setAiSuggestions([]);
    setSelectedSuggestionIndex(null);
    setCurrentCutIndex(index);
  };

  // duration 칩 클릭 시 컷 전환
  const handleDurationChipSelect = (index) => {
    logButtonClick('content_upload_a', 'duration_chip_select', String(index + 1));
    setAiSuggestions([]);
    setSelectedSuggestionIndex(null);
    setCurrentCutIndex(index);
  };

  // 뒤로가기
  const handleBack = () => {
    logButtonClick('content_upload_a', 'back');
    onBack();
  };

  // 영상 업로드
  const handleVideoUpload = (e, targetIndex) => {
    const file = e.target.files[0];
    if (file) {
      logButtonClick('content_upload_a', 'video_upload');
      const videoUrl = URL.createObjectURL(file);
      const idx = targetIndex !== undefined ? targetIndex : currentCutIndex;
      setCutData(prev => prev.map((cut, index) =>
        index === idx
          ? { ...cut, videoFile: file, videoPreview: videoUrl }
          : cut
      ));
      generateThumbnail(videoUrl, idx);
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

  // 영상에서 첫 프레임(0초) 캡처 (Base64) - Promise 기반
  const captureVideoFrame = () => {
    return new Promise((resolve) => {
      if (!videoRef.current) {
        console.log('videoRef가 없습니다');
        resolve(null);
        return;
      }

      const video = videoRef.current;

      // 첫 프레임 캡처를 위한 함수
      const seekAndCapture = () => {
        // 이미 0초면 바로 캡처
        if (video.currentTime === 0) {
          captureFrame(video, resolve);
          return;
        }

        // 0초로 이동 후 캡처
        const handleSeeked = () => {
          video.removeEventListener('seeked', handleSeeked);
          captureFrame(video, resolve);
        };
        video.addEventListener('seeked', handleSeeked);
        video.currentTime = 0;
      };

      // 비디오가 로드되지 않았으면 로드 대기
      if (video.readyState < 2) {
        console.log('비디오 로드 대기 중...');
        video.addEventListener('loadeddata', () => {
          seekAndCapture();
        }, { once: true });
        video.load();
      } else {
        seekAndCapture();
      }
    });
  };

  // 실제 프레임 캡처 함수
  const captureFrame = (video, resolve) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 288;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      console.log('프레임 캡처 성공, 크기:', dataUrl.length);
      resolve(dataUrl);
    } catch (error) {
      console.error('프레임 캡처 오류:', error);
      resolve(null);
    }
  };

  const handleAISubtitle = async () => {
    logButtonClick('content_upload_a', 'ai_subtitle');
    setIsLoadingAI(true);
    setAiSuggestions([]);
    setSelectedSuggestionIndex(null);

    try {
      // 영상이 있으면 현재 프레임 캡처
      let imageBase64 = null;
      if (currentCut?.videoPreview) {
        imageBase64 = await captureVideoFrame();
        console.log('이미지 캡처 결과:', imageBase64 ? '성공' : '실패');
      }

      // AI 자막 생성 API 호출 (Netlify Function)
      const response = await fetch('/.netlify/functions/generate-subtitle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cutTitle: currentCut?.title || '',
          cutDescription: currentCut?.description || '',
          memo: currentCut?.memo || '',
          userKeyword: currentCut?.subtitle || '', // 사용자 입력 키워드
          imageBase64, // 이미지 데이터 추가
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate subtitles');
      }

      const data = await response.json();
      setAiSuggestions(data.subtitles || []);

      // Vision API 사용 여부 로그
      if (data.usedVision) {
        console.log('AI 자막 추천: 이미지 분석 사용');
      }
    } catch (error) {
      console.error('AI 자막 생성 오류:', error);
      // 폴백: 더미 자막 표시
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
    logButtonClick('content_upload_a', 'ai_suggestion_select', suggestion);
    setSelectedSuggestionIndex(index);
    setCutData(prev => prev.map((cut, i) =>
      i === currentCutIndex
        ? { ...cut, subtitle: suggestion }
        : cut
    ));
  };

  // + 버튼 (영상 추가 파일 선택 트리거)
  const handleAddVideoButton = () => {
    logButtonClick('content_upload_a', 'add_video_button', String(currentCutIndex + 1));
    fileInputRef.current?.click();
  };

  // "완성하기"
  const handleComplete = () => {
    logButtonClick('content_upload_a', 'complete');
    setCompleted(true);
  };

  // "저장하기"
  const handleSaveProgress = () => {
    logButtonClick('content_upload_a', 'save_progress');
    const saveData = {
      cutData: cutData.map(cut => ({
        id: cut.id,
        title: cut.title,
        description: cut.description,
        duration: cut.duration,
        memo: cut.memo,
        subtitle: cut.subtitle,
      })),
      currentCutIndex,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem('content_upload_progress_a', JSON.stringify(saveData));
    alert('진행 상황이 저장되었습니다.');
  };

  if (!currentCut) {
    return (
      <div className="content-upload-container">
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

  // 완료 화면
  if (completed) {
    return (
      <div className="content-upload-container">
        <div className="content-complete-overlay">
          <div className="content-complete-message">
            <div className="content-complete-check">✓</div>
            <p>미션을 완료했습니다.</p>
          </div>
          <div className="content-complete-footer">
            <button className="content-complete-btn" onClick={onComplete}>
              완료
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="content-upload-container">
      {/* 상단 헤더 */}
      <div className="content-upload-header">
        <button className="back-button" onClick={handleBack}>
          ←
        </button>
      </div>

      {/* 비디오 미리보기 영역 */}
      <div className="preview-section">
        <div className="preview-thumbnail">
          {currentCut.videoPreview ? (
            <video ref={videoRef} src={currentCut.videoPreview} className="preview-video" preload="auto" playsInline />
          ) : (
            <div className="preview-placeholder">영상을 추가해주세요</div>
          )}
        </div>
        <div className="preview-info">
          <span className="preview-duration">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
            </svg>
            00:12
          </span>
          <span className="preview-cuts">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" />
            </svg>
            {totalCuts}컷
          </span>
        </div>
      </div>

      {/* 썸네일 타임라인 */}
      <div className="thumbnail-timeline-container">
        <div className="thumbnail-timeline-scroll">
          {cutData.map((cut, index) => (
            <button
              key={cut.id}
              className={`timeline-thumbnail ${index === currentCutIndex ? 'active' : ''}`}
              onClick={() => handleTimelineCutSelect(index)}
            >
              {thumbnails[index] ? (
                <img src={thumbnails[index]} alt={`컷 ${index + 1}`} />
              ) : (
                <span className="timeline-thumbnail-number">{index + 1}</span>
              )}
            </button>
          ))}

          {/* + 버튼 */}
          <button
            className="timeline-add-button"
            onClick={handleAddVideoButton}
          >
            +
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={(e) => handleVideoUpload(e, currentCutIndex)}
            style={{ display: 'none' }}
          />

          {/* 구분선 */}
          <div className="timeline-divider" />

          {/* duration 칩들 */}
          {cutData.map((cut, index) => (
            <button
              key={`dur-${cut.id}`}
              className={`timeline-duration-chip ${index === currentCutIndex ? 'active' : ''}`}
              onClick={() => handleDurationChipSelect(index)}
            >
              {parseDuration(cut.duration)}
            </button>
          ))}
        </div>
        <div className="timeline-accent-line" />
      </div>

      {/* 메인 콘텐츠 영역 */}
      <div className="content-upload-main" ref={mainScrollRef}>
        {/* 콘텐츠 기획 섹션 */}
        <div className="content-planning-section">
          <div className="content-planning-header">
            <span className="content-planning-label">콘텐츠 기획 {currentCutIndex + 1}</span>
          </div>
          <div className={`content-planning-card ${currentCut.memo ? 'content-planning-card-filled' : ''}`}>
            <div className="planning-card-badge">{currentCutIndex + 1}</div>
            <div className="planning-card-body">
              <div className="planning-card-header-row">
                <span className="planning-card-title">{currentCut.title || `${currentCutIndex + 1}번째 영상 포인트`}</span>
                <span className="planning-card-time-chip">{currentCut.duration}</span>
              </div>
              <p className="planning-card-description">{currentCut.description}</p>
              {currentCut.memo && (
                <div className="planning-card-memo">{currentCut.memo}</div>
              )}
            </div>
          </div>
        </div>

        {/* 자막 섹션 */}
        <div className="subtitle-section-redesign">
          <div className="subtitle-header-row">
            <span className="subtitle-label">자막</span>
            <button
              className={`ai-subtitle-chip ${isLoadingAI ? 'loading' : ''}`}
              onClick={handleAISubtitle}
              disabled={isLoadingAI}
            >
              {isLoadingAI ? (
                <>
                  <span className="spinner"></span>
                  생성 중...
                </>
              ) : (
                'AI 자막 추천'
              )}
            </button>
          </div>
          <input
            type="text"
            className="subtitle-input-redesign"
            placeholder="자막을 입력하세요"
            value={currentCut.subtitle || ''}
            onChange={handleSubtitleChange}
          />

          {/* AI 추천 자막 Chips */}
          {aiSuggestions.length > 0 && (
            <div className="ai-suggestions">
              {aiSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className={`suggestion-chip ${selectedSuggestionIndex === index ? 'selected' : ''}`}
                  onClick={() => handleSelectSuggestion(suggestion, index)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="content-upload-footer-redesign">
          <button className="content-upload-btn-secondary" onClick={handleSaveProgress}>
            저장하기
          </button>
          <button className="content-upload-btn-primary" onClick={handleComplete}>
            완성하기
          </button>
        </div>
      </div>
    </div>
  );
}

export default ContentUploadScreenA;
