import { useState, useEffect, useRef } from 'react';
import './EditScreen.css';
import { logScreenView, logButtonClick, logMissionComplete, logMissionStart, logScreenExit } from '../utils/logger';

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


function Edit2_1Screen({ onComplete, onBack }) {
  const [currentCutIndex, setCurrentCutIndex] = useState(0);
  const [cutData, setCutData] = useState([]);
  const [thumbnails, setThumbnails] = useState({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [selectedAiIndex, setSelectedAiIndex] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const missionStartTime = useRef(null);
  const missionStartLogged = useRef(false);
  const missionCompletingRef = useRef(false);  // 중복 완료 방지용 ref

  useEffect(() => {
    const enterTime = Date.now();
    // 화면 진입 시점을 미션 시작 시간으로 사용
    missionStartTime.current = enterTime;

    // 화면 진입 로그를 먼저 전송 (완료 대기)
    const initLogs = async () => {
      await logScreenView('편집2-1_화면');
      // 미션 시작 로그는 화면 진입 로그 후에 전송
      if (!missionStartLogged.current) {
        missionStartLogged.current = true;
        setTimeout(() => {
          logMissionStart('편집2-1_화면', '편집2-1_미션시작');
        }, 500);
      }
    };
    initLogs();

    setCutData(defaultCuts.map(cut => ({
      ...cut,
      videoFile: null,
      videoPreview: null,
      subtitle: '',
    })));
    return () => {
      const dwellTime = Date.now() - enterTime;
      logScreenExit('편집2-1_화면', dwellTime);
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

  // 컷 선택 — 4번째 컷(index 3) 선택 시 자동 완료
  const handleCutSelect = (index) => {
    // 미션 완료 대기 중에는 로그 남기지 않음
    if (isCompleting) return;

    const state = {
      currentCut: currentCutIndex + 1,
      targetCut: index + 1,
      hasVideo: !!cutData[index]?.videoPreview,
      isPlaying,
      expected: index === 3  // 4번째 컷 선택이 미션 목표
    };
    logButtonClick('편집2-1_화면', `컷${index + 1}`, JSON.stringify(state));
    if (videoRef.current && isPlaying) {
      videoRef.current.pause();
    }
    setIsPlaying(false);
    setCurrentCutIndex(index);
    setAiSuggestions([]);
    setSelectedAiIndex(null);

    // missionCompletingRef로 동기적 중복 방지
    if (index === 3 && !missionCompletingRef.current) {
      missionCompletingRef.current = true;  // 동기적으로 즉시 설정
      setIsCompleting(true);
      // 미션 완료 시간은 버튼 클릭 시점에 계산 (2초 대기 시간 제외)
      const completionTime = ((Date.now() - missionStartTime.current) / 1000).toFixed(1);
      logMissionComplete('편집2-1_화면', '편집2-1_미션완료', `완료시간:${completionTime}초`);
      setTimeout(() => {
        setCompleted(true);
      }, 2000);
    }
  };

  // 뒤로가기 (미션 포기)
  const handleBack = () => {
    const uploadedCuts = cutData.filter(cut => cut.videoPreview).length;
    const subtitledCuts = cutData.filter(cut => cut.subtitle?.trim()).length;
    const state = {
      currentCut: currentCutIndex + 1,
      uploadedCuts,
      subtitledCuts
    };
    logButtonClick('편집2-1_화면', '미션포기', JSON.stringify(state));
    onBack();
  };

  // 영상 추가 버튼 클릭 (플러스 아이콘)
  const handleVideoAddClick = () => {
    if (isCompleting) return;
    const state = {
      currentCut: currentCutIndex + 1,
      hasVideo: !!currentCut?.videoPreview,
      isPlaying
    };
    logButtonClick('편집2-1_화면', '영상추가', JSON.stringify(state));
    fileInputRef.current?.click();
  };

  // 영상 교체 버튼 클릭 (편집 아이콘)
  const handleVideoReplaceClick = () => {
    if (isCompleting) return;
    const state = {
      currentCut: currentCutIndex + 1,
      hasVideo: !!currentCut?.videoPreview,
      isPlaying
    };
    logButtonClick('편집2-1_화면', '영상교체', JSON.stringify(state));
    fileInputRef.current?.click();
  };

  // 영상 업로드
  const handleVideoUpload = (e) => {
    if (isCompleting) return;
    const file = e.target.files[0];
    if (file) {
      const state = {
        currentCut: currentCutIndex + 1,
        fileName: file.name,
        fileSize: file.size
      };
      logButtonClick('편집2-1_화면', '영상업로드완료', JSON.stringify(state));
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
    if (isCompleting) return;
    const buttonName = isPlaying ? '정지' : '재생';
    const state = {
      currentCut: currentCutIndex + 1,
      hasVideo: !!currentCut?.videoPreview,
      isPlaying
    };
    logButtonClick('편집2-1_화면', buttonName, JSON.stringify(state));
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
    if (isCompleting) return;
    const state = {
      currentCut: currentCutIndex + 1,
      hasVideo: !!currentCut?.videoPreview,
      currentSubtitle: currentCut?.subtitle || ''
    };
    logButtonClick('편집2-1_화면', 'AI자막추천', JSON.stringify(state));
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
    if (isCompleting) return;
    const state = {
      currentCut: currentCutIndex + 1,
      selectedIndex: index + 1,
      selectedText: suggestion
    };
    logButtonClick('편집2-1_화면', `AI추천${index + 1}`, JSON.stringify(state));
    setSelectedAiIndex(index);
    setCutData(prev => prev.map((cut, i) =>
      i === currentCutIndex ? { ...cut, subtitle: suggestion } : cut
    ));
  };

  // 자막 입력 필드 포커스
  const handleSubtitleFocus = () => {
    if (isCompleting) return;
    const state = {
      currentCut: currentCutIndex + 1,
      hasVideo: !!currentCut?.videoPreview,
      currentSubtitle: currentCut?.subtitle || ''
    };
    logButtonClick('편집2-1_화면', '자막입력필드', JSON.stringify(state));
  };

  // 자막 직접 입력 (직접 입력 시 AI 추천 숨김)
  const handleSubtitleChange = (e) => {
    if (isCompleting) return;
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
    const uploadedCuts = cutData.filter(cut => cut.videoPreview).length;
    const subtitledCuts = cutData.filter(cut => cut.subtitle?.trim()).length;
    const state = {
      currentCut: currentCutIndex + 1,
      uploadedCuts,
      subtitledCuts
    };
    logButtonClick('편집2-1_화면', '저장하기', JSON.stringify(state));
    const saveData = {
      cutData: cutData.map(cut => ({
        id: cut.id,
        title: cut.title,
        subtitle: cut.subtitle,
      })),
      currentCutIndex,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem('content_upload_progress_2b', JSON.stringify(saveData));
    alert('저장되었습니다.');
  };

  // 완료 — 로그만 남기고, 완료 처리는 4번째 컷 선택 시에만 동작
  const handleComplete = () => {
    const uploadedCuts = cutData.filter(cut => cut.videoPreview).length;
    const state = {
      currentCut: currentCutIndex + 1,
      uploadedCuts
    };
    logButtonClick('편집2-1_화면', '바로편집시작', JSON.stringify(state));
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
            <p className="cub-complete-next">화면을 닫고 이어서 다음 미션을 수행해 주세요.</p>
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
          <div className="cub-preview-placeholder" onClick={handleVideoAddClick}>
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

        {/* 편집 버튼 (영상 교체) */}
        <button className="cub-edit-btn" onClick={handleVideoReplaceClick}>
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
            onFocus={handleSubtitleFocus}
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

export default Edit2_1Screen;
