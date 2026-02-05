import { useState, useEffect, useRef } from 'react';
import './StoryPlanningScreen.css';
import { logScreenView, logButtonClick, logMissionComplete, logMissionStart, logScreenExit } from '../utils/logger';

const VIDEO_URL = '/videos/sample-2.mp4';

const defaultCuts = [
  { id: 1, title: "디테일 포인트", description: "패키지 전체가 보이도록 제품을 한 컷으로 보여주세요.", time: "2초", startTime: 0 },
  { id: 2, title: "사용 장면 컷", description: "제품이 손이나 얼굴에 닿는 순간만 보여줘도 좋아요.", time: "2초", startTime: 2 },
  { id: 3, title: "디테일 포인트", description: "이 제품의 특징이 잘 보이는 부분을 담아요.", time: "2초", startTime: 4 },
  { id: 4, title: "효과 전달 컷", description: "사용 후 어떤 느낌을 전달하고 싶은지 정리해보세요.", time: "2초", startTime: 6 },
  { id: 5, title: "마무리 장면", description: "제품과 함께 자연스럽게 마무리해 주세요.", time: "2초", startTime: 8 },
  { id: 6, title: "엔딩 장면", description: "영상의 마지막을 장식하는 인상적인 엔딩을 담아요.", time: "2초", startTime: 10 },
];

function Plan1_1AScreen({ onComplete, onBack }) {
  const [memos, setMemos] = useState({});
  const [activeCutId, setActiveCutId] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [cutThumbnails, setCutThumbnails] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const scrollRef = useRef(null);
  const missionStartTime = useRef(null);
  const missionStartLogged = useRef(false);

  const cuts = defaultCuts;

  useEffect(() => {
    const enterTime = Date.now();
    missionStartTime.current = enterTime;
    // 화면 진입 로그를 먼저 전송
    logScreenView('기획1-1A_화면');
    // 미션 시작 로그는 화면 진입 로그 후에 전송 (지연 시간 증가)
    if (!missionStartLogged.current) {
      missionStartLogged.current = true;
      setTimeout(() => {
        logMissionStart('기획1-1A_화면', '기획1-1_A미션시작');
      }, 300);
    }
    return () => {
      const dwellTime = Date.now() - enterTime;
      logScreenExit('기획1-1A_화면', dwellTime);
    };
  }, []);

  // 영상에서 각 컷 시간대의 프레임을 썸네일로 추출
  useEffect(() => {
    const video = document.createElement('video');
    video.muted = true;
    video.preload = 'auto';
    video.src = VIDEO_URL;

    let cancelled = false;

    const extractFrames = async () => {
      await new Promise((resolve, reject) => {
        video.onloadeddata = resolve;
        video.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      canvas.width = 112;
      canvas.height = 112;
      const ctx = canvas.getContext('2d');
      const thumbnails = {};

      for (const cut of cuts) {
        if (cancelled) break;
        video.currentTime = cut.startTime || 0;
        await new Promise((resolve) => {
          video.onseeked = resolve;
        });
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        thumbnails[cut.id] = canvas.toDataURL('image/jpeg', 0.7);
      }

      if (!cancelled) {
        setCutThumbnails(thumbnails);
      }
    };

    extractFrames().catch(() => {});

    return () => {
      cancelled = true;
      video.src = '';
    };
  }, []);

  const handleCutSelect = (cut) => {
    // 저장 중에는 로그 남기지 않음
    if (isSaving) return;
    const prevCutId = activeCutId;
    setActiveCutId(cut.id);
    const state = {
      cutId: cut.id,
      cutTitle: cut.title,
      prevCutId: prevCutId,
      hasMemo: !!memos[cut.id]?.trim(),
      memoLength: memos[cut.id]?.length || 0
    };
    logButtonClick('기획1-1A_화면', 'cut_select', JSON.stringify(state));
  };

  const handleMemoChange = (cutId, value) => {
    if (isSaving) return;
    setMemos(prev => ({ ...prev, [cutId]: value }));
  };

  // 메모 입력 완료 시 (포커스 해제 시) 로그
  const handleMemoBlur = (cutId, value) => {
    // 저장 중에는 로그 남기지 않음
    if (isSaving) return;
    if (value && value.trim()) {
      const cut = cuts.find(c => c.id === cutId);
      const state = {
        cutId: cutId,
        cutTitle: cut?.title || '',
        memoLength: value.length,
        memoText: value.substring(0, 50) + (value.length > 50 ? '...' : '')
      };
      logButtonClick('기획1-1A_화면', '메모입력완료', JSON.stringify(state));
    }
  };

  const handleSave = () => {
    // 중복 클릭 방지
    if (isSaving) return;
    setIsSaving(true);

    // 메모 개수 및 길이 계산
    const memoCount = Object.values(memos).filter(memo => memo.trim() !== '').length;
    const totalMemoLength = Object.values(memos).reduce((sum, memo) => sum + (memo?.length || 0), 0);
    const memoDetails = cuts.map(cut => ({
      cutId: cut.id,
      hasMemo: !!memos[cut.id]?.trim(),
      memoLength: memos[cut.id]?.length || 0
    }));
    const state = {
      memoCount,
      totalCuts: cuts.length,
      totalMemoLength,
      avgMemoLength: memoCount > 0 ? (totalMemoLength / memoCount).toFixed(1) : 0,
      memoDetails
    };
    logButtonClick('기획1-1A_화면', '저장하기', JSON.stringify(state));

    // 2초 후 미션 완료
    setTimeout(() => {
      const completionTime = ((Date.now() - missionStartTime.current) / 1000).toFixed(1);
      logMissionComplete('기획1-1A_화면', '기획1-1_A미션완료', `완료시간:${completionTime}초,메모수:${memoCount},총길이:${totalMemoLength}`);
      setCompleted(true);
    }, 2000);
  };

  const handleBack = () => {
    // 미션 포기 로그 (미완료 상태로 이탈)
    const memoCount = Object.values(memos).filter(memo => memo.trim() !== '').length;
    const totalMemoLength = Object.values(memos).reduce((sum, memo) => sum + (memo?.length || 0), 0);
    const memoDetails = cuts.map(cut => ({
      cutId: cut.id,
      hasMemo: !!memos[cut.id]?.trim(),
      memoLength: memos[cut.id]?.length || 0
    }));
    const state = {
      memoCount,
      totalCuts: cuts.length,
      totalMemoLength,
      memoDetails,
      completed: false
    };
    logButtonClick('기획1-1A_화면', '미션포기', JSON.stringify(state));
    onBack();
  };

  const scenes = cuts.map(cut => ({ ...cut, memo: memos[cut.id] || '' }));
  const activeCount = scenes.filter(s => s.memo.trim() !== '').length;
  const progressWidths = cuts.map(cut => parseInt(cut.time) || 2);
  const isSaveEnabled = activeCount >= 1;

  if (completed) {
    return (
      <div className="story-planning-container">
        <div className="story-complete-overlay">
          <div className="story-complete-message">
            <div className="story-complete-check">✓</div>
            <p>미션을 완료했습니다.</p>
          </div>
          <div className="story-complete-footer">
            <button className="story-save-btn" onClick={onComplete}>
              완료
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="story-planning-container">
      <div className="story-header-bar">
        <button className="story-back-button" onClick={handleBack}>
          ‹
        </button>
        <span className="story-header-title">아이디어 노트 A안</span>
      </div>

      <div className="story-scroll-content" ref={scrollRef}>
        <div className="story-content-section">
          <div className="story-progress-bar">
            {progressWidths.map((width, index) => (
              <div
                key={index}
                className={`sp-progress-segment ${index < activeCount ? 'active' : ''}`}
                style={{ flex: width }}
              />
            ))}
          </div>

          <div className="story-header">
            <h2 className="story-title">아이디어 노트</h2>
            <p className="story-description">각 컷에 넣을 장면을 미리 생각해보고 적어보세요.</p>
          </div>

          <div className="sp-cut-list-container">
            {cuts.map((cut, index) => (
              <div
                key={cut.id}
                className={`sp-cut-item ${
                  activeCutId === cut.id
                    ? 'sp-cut-item-active'
                    : memos[cut.id]?.trim()
                      ? 'sp-cut-item-filled'
                      : ''
                }`}
                onClick={() => handleCutSelect(cut)}
              >
                <div className="sp-cut-thumbnail">
                  {cutThumbnails[cut.id] ? (
                    <img src={cutThumbnails[cut.id]} alt={`컷 ${index + 1}`} />
                  ) : (
                    <div className="sp-cut-thumbnail-empty" />
                  )}
                  {activeCutId !== cut.id && (
                    <div className="sp-cut-thumbnail-dim">
                      <span className="sp-cut-thumbnail-time">{cut.time}</span>
                    </div>
                  )}
                  {memos[cut.id]?.trim() && (
                    <div className="sp-cut-thumbnail-check">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="#FFD600"/>
                      </svg>
                    </div>
                  )}
                </div>
                <div className="sp-cut-content">
                  <div className="sp-cut-header">
                    <span className="sp-cut-number-inline">{index + 1}</span>
                    <span className="sp-cut-title">{cut.title}</span>
                  </div>
                  {cut.description && (
                    <p className="sp-cut-description">{cut.description}</p>
                  )}
                  {activeCutId !== cut.id && memos[cut.id]?.trim() && (
                    <p className="sp-cut-memo-display">{memos[cut.id]}</p>
                  )}
                </div>
                <input
                  type="text"
                  className="sp-cut-memo-input"
                  placeholder="메모를 입력해주세요."
                  value={memos[cut.id] || ''}
                  onChange={(e) => handleMemoChange(cut.id, e.target.value)}
                  onFocus={() => handleCutSelect(cut)}
                  onBlur={(e) => handleMemoBlur(cut.id, e.target.value)}
                />
              </div>
            ))}
          </div>

          <div className="story-bottom-buttons">
            <button
              className={`story-save-btn ${!isSaveEnabled ? 'disabled' : ''}`}
              onClick={handleSave}
              disabled={!isSaveEnabled}
            >
              저장하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Plan1_1AScreen;
