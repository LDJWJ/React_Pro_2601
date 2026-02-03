import { useState, useEffect, useRef } from 'react';
import './StoryPlanningScreen.css';
import { logScreenView, logButtonClick } from '../utils/logger';

const VIDEO_URL = '/videos/sample-2.mp4';

const defaultCuts = [
  { id: 1, label: "ㄷ1", title: "인트로 (첫 장면)", description: "패키지 전체가 보이도록 제품을 한 컷으로 보여주세요.", time: "", startTime: 0 },
  { id: 2, label: "ㄷ2-4", title: "제품 보여주기", description: "제품이 손이나 얼굴에 닿는 순간만 보여줘도 좋아요.", time: "3초", startTime: 3 },
  { id: 3, label: "ㄷ5", title: "사용 장면", description: "이 제품의 특징이 잘 보이는 부분을 담아요.\n가까이에서 촬영하면 포인트에요.", time: "3초", startTime: 6 },
];

function StoryPlanningScreenB({ onComplete, onBack }) {
  const [memos, setMemos] = useState({});
  const [activeCutId, setActiveCutId] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [cutThumbnails, setCutThumbnails] = useState({});
  const scrollRef = useRef(null);

  const cuts = defaultCuts;

  useEffect(() => {
    logScreenView('story_planning_b');
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
    setActiveCutId(cut.id);
    logButtonClick('story_planning_b', 'cut_select', String(cut.id));
  };

  const handleMemoChange = (cutId, value) => {
    setMemos(prev => ({ ...prev, [cutId]: value }));
  };

  const handleSave = () => {
    logButtonClick('story_planning_b', 'save');
    setCompleted(true);
  };

  const handleBack = () => {
    logButtonClick('story_planning_b', 'back');
    onBack();
  };

  const scenes = cuts.map(cut => ({ ...cut, memo: memos[cut.id] || '' }));
  const activeCount = scenes.filter(s => s.memo.trim() !== '').length;
  const progressWidths = cuts.map(cut => cut.duration || parseInt(cut.time) || 2);

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
        <span className="story-header-title">체험단용 뷰티 브이로그</span>
      </div>

      <div className="story-scroll-content" ref={scrollRef}>
        <div className="story-content-section">
          <div className="story-guide-header">
            <h2 className="story-guide-title">영상 가이드</h2>
          </div>

          <div className="story-step-box">
            <span className="story-step-label">step 1</span>
            <span className="story-step-text">장면별로 필요한 내용을 메모해보세요.</span>
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
                  {activeCutId !== cut.id && cut.time && (
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
                    <span className="sp-cut-label">{cut.label}</span>
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
                  placeholder="메모 입력 구간"
                  value={memos[cut.id] || ''}
                  onChange={(e) => handleMemoChange(cut.id, e.target.value)}
                  onFocus={() => handleCutSelect(cut)}
                />
              </div>
            ))}
          </div>

          <div className="story-step-box">
            <span className="story-step-label">step 2</span>
            <span className="story-step-text">메모를 바탕으로 바로 편집을 시작해보세요.</span>
          </div>

          <div className="story-bottom-buttons-dual">
            <button className="story-secondary-btn" onClick={handleSave}>
              아이디어 저장
            </button>
            <button className="story-primary-btn" onClick={onComplete}>
              이대로 편집 시작하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StoryPlanningScreenB;
