import { useState, useEffect, useRef } from 'react';
import './StoryPlanningScreen.css';
import { logScreenView, logButtonClick } from '../utils/logger';

const VIDEO_URL = '/videos/sample-2.mp4';

const defaultCuts = [
  { id: 1, title: "디테일 포인트", description: "패키지 전체가 보이도록 제품을 한 컷으로 보여주세요.", time: "2초", startTime: 0 },
  { id: 2, title: "사용 장면 컷", description: "제품이 손이나 얼굴에 닿는 순간만 보여줘도 좋아요.", time: "2초", startTime: 2 },
  { id: 3, title: "디테일 포인트", description: "이 제품의 특징이 잘 보이는 부분을 담아요.", time: "2초", startTime: 4 },
  { id: 4, title: "효과 전달 컷", description: "사용 후 어떤 느낌을 전달하고 싶은지 정리해보세요.", time: "2초", startTime: 6 },
  { id: 5, title: "마무리 장면", description: "제품과 함께 자연스럽게 마무리해 주세요.", time: "2초", startTime: 8 },
];

function StoryPlanningScreenA({ onComplete, onBack }) {
  const [memos, setMemos] = useState({});
  const [activeCutId, setActiveCutId] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [cutThumbnails, setCutThumbnails] = useState({});
  const scrollRef = useRef(null);

  const cuts = defaultCuts;

  useEffect(() => {
    logScreenView('story_planning_a');
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
    logButtonClick('story_planning_a', 'cut_select', String(cut.id));
  };

  const handleMemoChange = (cutId, value) => {
    setMemos(prev => ({ ...prev, [cutId]: value }));
  };

  const handleSave = () => {
    logButtonClick('story_planning_a', 'save');
    setCompleted(true);
  };

  const handleBack = () => {
    logButtonClick('story_planning_a', 'back');
    onBack();
  };

  const scenes = cuts.map(cut => ({ ...cut, memo: memos[cut.id] || '' }));
  const activeCount = scenes.filter(s => s.memo.trim() !== '').length;
  const progressWidths = cuts.map(cut => parseInt(cut.time) || 2);

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
              다음
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
        <span className="story-header-title">기획노트 A안</span>
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
            <h2 className="story-title">훅 노트</h2>
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
                />
              </div>
            ))}
          </div>

          <div className="story-bottom-buttons">
            <button className="story-save-btn" onClick={handleSave}>
              저장하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StoryPlanningScreenA;
