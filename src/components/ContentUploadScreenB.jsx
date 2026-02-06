import { useState, useEffect, useRef } from 'react';
import './ContentUploadScreenB.css';
import { logScreenView, logButtonClick, logMissionComplete, logScreenExit } from '../utils/logger';

const defaultCuts = [
  { id: 1, title: '인트로 (첫 장면)', duration: 6, description: '성수동 자주 가는 카페에서 분위기 있게 셀카 찍기' },
  { id: 2, title: '제품 보여주기', duration: 4, description: '제품이 손이나 얼굴에 닿는 순간만 보여줘도 좋아요.' },
  { id: 3, title: '사용 장면', duration: 5, description: '이 제품의 특징이 잘 보이는 부분을 담아요.' },
  { id: 4, title: '리액션 컷', duration: 5, description: '사용 후 만족스러운 표정이나 반응을 보여주세요.' },
  { id: 5, title: '마무리 컷', duration: 8, description: '제품과 함께 자연스러운 엔딩 장면을 담아요.' },
  { id: 6, title: '엔딩 장면', duration: 5, description: '영상의 마지막을 장식하는 인상적인 엔딩을 담아요.' },
];

// 시간 형식 변환 (초 → "Xs")
const formatTime = (seconds) => `${seconds}s`;


function ContentUploadScreenB({ onComplete, onBack }) {
  const [currentCutIndex, setCurrentCutIndex] = useState(0);
  const [cutData, setCutData] = useState([]);
  const [thumbnails, setThumbnails] = useState({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [selectedAiIndex, setSelectedAiIndex] = useState(null);
  const [completed, setCompleted] = useState(false);


  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const missionStartTime = useRef(null);

  useEffect(() => {
    logScreenView('content_upload_b');
    const enterTime = Date.now();
    // MissionStep에서 다음 버튼 클릭 시점을 미션 시작 시간으로 사용
    const savedStartTime = sessionStorage.getItem('missionStartTime');
    missionStartTime.current = savedStartTime ? parseInt(savedStartTime, 10) : enterTime;
    setCutData(defaultCuts.map(cut => ({
      ...cut,
      videoFile: null,
      videoPreview: null,
      subtitle: '',
    })));
    return () => {
      const dwellTime = Date.now() - enterTime;
      logScreenExit('content_upload_b', dwellTime);
    };
  }, []);

  const currentCut = cutData[currentCutIndex];
  const totalCuts = cutData.length;
  // 총 재생시간 계산
  const totalSeconds = cutData.reduce((sum, cut) => sum + (cut.duration || 0), 0);
  const totalDuration = `00:${String(totalSeconds).padStart(2, '0')}`;

  // 썸네일 생성
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

  // 컷 선택
  const handleCutSelect = (index) => {
    logButtonClick('content_upload_b', 'cut_select', String(index + 1));
    if (videoRef.current && isPlaying) {
      videoRef.current.pause();
    }
    setIsPlaying(false);
    setCurrentCutIndex(index);
    setAiSuggestions([]);
    setSelectedAiIndex(null);
  };

  // 뒤로가기
  const handleBack = () => {
    logButtonClick('content_upload_b', 'back');
    onBack();
  };

  // 영상 업로드
  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      logButtonClick('content_upload_b', 'video_upload');
      const videoUrl = URL.createObjectURL(file);
      setCutData(prev => prev.map((cut, index) =>
        index === currentCutIndex
          ? { ...cut, videoFile: file, videoPreview: videoUrl }
          : cut
      ));
      generateThumbnail(videoUrl, currentCutIndex);
    }
  };

  // 재생/정지
  const handlePlayToggle = () => {
    logButtonClick('content_upload_b', 'play_toggle');
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
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

  // AI 자막 추천
  const handleAISubtitle = async () => {
    logButtonClick('content_upload_b', 'ai_subtitle');
    setIsLoadingAI(true);
    setAiSuggestions([]);
    setSelectedAiIndex(null);

    try {
      // AI 자막 생성 API 호출 (Netlify Function) - 텍스트 기반
      const response = await fetch('/.netlify/functions/generate-subtitle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cutTitle: currentCut?.title || '',
          cutDescription: currentCut?.description || '',
          memo: currentCut?.memo || '',
          userKeyword: currentCut?.subtitle || '', // 사용자 입력 키워드
        }),
      });

      if (!response.ok) throw new Error('Failed');

      const data = await response.json();
      const subtitles = data.subtitles || [];
      setAiSuggestions(subtitles);

      // 자막이 비어있으면 가장 좋은 안(첫번째)을 자동으로 입력
      if (!currentCut?.subtitle && subtitles.length > 0) {
        setSelectedAiIndex(0);
        setCutData(prev => prev.map((cut, i) =>
          i === currentCutIndex ? { ...cut, subtitle: subtitles[0] } : cut
        ));
      }

      // Vision API 사용 여부 로그
      if (data.usedVision) {
        console.log('AI 자막 추천: 이미지 분석 사용');
      }
    } catch (error) {
      console.error('AI 자막 생성 오류:', error);
      const fallbackSubtitles = [
        '지금 바로 확인해보세요!',
        '이 순간을 놓치지 마세요!',
        '함께 즐겨보세요!',
      ];
      setAiSuggestions(fallbackSubtitles);

      // 자막이 비어있으면 가장 좋은 안(첫번째)을 자동으로 입력
      if (!currentCut?.subtitle) {
        setSelectedAiIndex(0);
        setCutData(prev => prev.map((cut, i) =>
          i === currentCutIndex ? { ...cut, subtitle: fallbackSubtitles[0] } : cut
        ));
      }
    } finally {
      setIsLoadingAI(false);
    }
  };

  // AI 추천 선택
  const handleSelectAiSuggestion = (suggestion, index) => {
    logButtonClick('content_upload_b', 'ai_suggestion_select', suggestion);
    setSelectedAiIndex(index);
    setCutData(prev => prev.map((cut, i) =>
      i === currentCutIndex ? { ...cut, subtitle: suggestion } : cut
    ));
  };

  // 자막 직접 입력 (직접 입력 시 AI 추천 숨김)
  const handleSubtitleChange = (e) => {
    const value = e.target.value;
    setCutData(prev => prev.map((cut, index) =>
      index === currentCutIndex ? { ...cut, subtitle: value } : cut
    ));
    // 직접 입력하면 AI 추천 숨김
    setAiSuggestions([]);
    setSelectedAiIndex(null);
  };

  // 저장하기
  const handleSave = () => {
    logButtonClick('content_upload_b', 'save_progress');
    const saveData = {
      cutData: cutData.map(cut => ({
        id: cut.id,
        title: cut.title,
        subtitle: cut.subtitle,
      })),
      currentCutIndex,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem('content_upload_progress_b', JSON.stringify(saveData));
    alert('저장되었습니다.');
  };

  // 완료
  const handleComplete = () => {
    logButtonClick('content_upload_b', 'complete');
    const completionTime = ((Date.now() - missionStartTime.current) / 1000).toFixed(1);
    logMissionComplete('content_upload_b', 'mission_3', `완료시간:${completionTime}초`);
    setCompleted(true);
  };

  if (!currentCut) {
    return (
      <div className="content-upload-b">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#888' }}>
          로딩 중...
        </div>
      </div>
    );
  }

  // 완료 화면
  if (completed) {
    return (
      <div className="content-upload-b">
        <div className="cub-complete-overlay">
          <div className="cub-complete-message">
            <div className="cub-complete-check">✓</div>
            <p>미션을 완료했습니다.</p>
          </div>
          <div className="cub-complete-footer">
            <button className="cub-complete-btn" onClick={onComplete}>
              완료
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="content-upload-b">
      {/* 헤더 */}
      <div className="cub-header">
        <button className="cub-back-btn" onClick={handleBack}>
          ‹
        </button>
        <span className="cub-title">작업하기 좋은 카페 추천</span>
      </div>

      {/* 컷 타임라인 */}
      <div className="cub-timeline">
        <div className="cub-timeline-scroll">
          {cutData.map((cut, index) => (
            <button
              key={cut.id}
              className={`cub-cut-card ${index === currentCutIndex ? 'active' : ''}`}
              onClick={() => handleCutSelect(index)}
            >
              {/* 썸네일 이미지 (있으면 표시) */}
              {thumbnails[index] && (
                <img src={thumbnails[index]} alt={`컷 ${index + 1}`} className="cub-cut-thumb-img" />
              )}
              {/* 숫자 오버레이 (항상 표시) */}
              <span className="cub-cut-number-overlay">{index + 1}</span>
              {/* 시간 오버레이 (항상 표시) */}
              <span className="cub-cut-time-overlay">{formatTime(cut.duration)}</span>
            </button>
          ))}

          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleVideoUpload}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {/* 메인 프리뷰 영역 */}
      <div className="cub-preview">
        {currentCut.videoPreview ? (
          <video
            ref={videoRef}
            src={currentCut.videoPreview}
            className="cub-preview-video"
            preload="auto"
            playsInline
            onEnded={() => setIsPlaying(false)}
          />
        ) : (
          <div className="cub-preview-placeholder" onClick={() => fileInputRef.current?.click()}>
            <div className="cub-mobile-frame">
              <img src="/icons/plus.png" alt="+" className="cub-plus-icon" />
            </div>
          </div>
        )}

        {/* 왼쪽 상단 정보 */}
        <div className="cub-preview-info">
          <div className="cub-info-badge">
            <img src="/icons/vedio-time.svg" alt="" />
            {totalDuration}
          </div>
          <div className="cub-info-badge">
            <img src="/icons/media.png" alt="" />
            {totalCuts}
          </div>
        </div>

        {/* 재생 버튼 */}
        <button className="cub-play-btn" onClick={handlePlayToggle}>
          <img src={isPlaying ? '/icons/video-stop.png' : '/icons/PLAY.png'} alt="" />
        </button>

        {/* 편집 버튼 */}
        <button className="cub-edit-btn" onClick={() => fileInputRef.current?.click()}>
          <img src="/icons/edit.png" alt="" />
        </button>
      </div>

      {/* 메인 스크롤 영역 */}
      <div className="cub-main">
        {/* 컷 정보 카드 */}
        <div className="cub-cut-info">
          <div className="cub-cut-badge">
            <img src="/icons/Icons_v2.png" alt="" className="cub-cut-icon" />
            <span className="cub-cut-number">{currentCutIndex + 1}</span>
          </div>
          <div className="cub-cut-text">
            <span className="cub-cut-title">{currentCut.title}</span>
            <p className="cub-cut-desc">{currentCut.description}</p>
          </div>
        </div>

        {/* 자막 작성 섹션 */}
        <div className="cub-subtitle-section">
          <div className="cub-subtitle-header">
            <span className="cub-subtitle-label">자막 작성</span>
            <button
              className="cub-ai-btn"
              onClick={handleAISubtitle}
              disabled={isLoadingAI}
            >
              {isLoadingAI ? (
                <>
                  <span className="spinner"></span>
                  생성 중...
                </>
              ) : (
                <><img src="/icons/star.png" alt="" className="cub-ai-btn-icon" /> AI 자막 추천</>
              )}
            </button>
          </div>

          {/* 자막 입력 */}
          <input
            type="text"
            className="cub-subtitle-input"
            placeholder="자막을 입력해주세요."
            value={currentCut.subtitle || ''}
            onChange={handleSubtitleChange}
          />

          {/* AI 추천 자막 (A안처럼 버튼 형태) */}
          {aiSuggestions.length > 0 && (
            <div className="cub-ai-suggestions">
              {aiSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className={`cub-ai-suggestion ${selectedAiIndex === index ? 'selected' : ''}`}
                  onClick={() => handleSelectAiSuggestion(suggestion, index)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 하단 액션 버튼 - 고정 */}
      <div className="cub-footer">
        <button className="cub-btn-secondary" onClick={handleSave}>
          저장하기
        </button>
        <button className="cub-btn-primary" onClick={handleComplete}>
          바로 편집 시작하기
        </button>
      </div>
    </div>
  );
}

export default ContentUploadScreenB;
