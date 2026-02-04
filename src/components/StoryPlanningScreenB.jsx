import { useState, useEffect, useRef } from 'react';
import './StoryPlanningScreen.css';
import { logScreenView, logButtonClick, logMissionComplete, logScreenExit } from '../utils/logger';

const VIDEO_URL = '/videos/sample-2.mp4';

const defaultCuts = [
  { id: 1, label: "1", title: "인트로(첫 장면)", description: "시선을 사로잡을 수 있는 포인트를 담아주세요. 디저트나 커피 클로즈업도 좋아요.", time: "1초~3초", startTime: 0 },
  { id: 2, label: "2 - 5", title: "카페 보여주기", description: "이 장면에서는 '작업하기 좋다'는 이유가 보이는 장면을 담아주세요.", time: "3초", startTime: 3 },
  { id: 3, label: "6", title: "마무리 장면", description: "여운을 남길 수 있는 장면이에요. 분위기를 한 번 더 강조하면 좋아요.", time: "3초", startTime: 6 },
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
    const enterTime = Date.now();
    return () => {
      const dwellTime = Date.now() - enterTime;
      logScreenExit('story_planning_b', dwellTime);
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
    setActiveCutId(cut.id);
    logButtonClick('story_planning_b', 'cut_select', String(cut.id));
  };

  const handleMemoChange = (cutId, value) => {
    setMemos(prev => ({ ...prev, [cutId]: value }));
  };

  const handleSave = () => {
    logButtonClick('story_planning_b', 'save');
    alert('아이디어가 저장되었습니다.');
  };

  const handleStartEdit = () => {
    logButtonClick('story_planning_b', 'start_edit');
    logMissionComplete('story_planning_b', 'mission_2');
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
        <span className="story-header-title">작업하기 좋은 카페 추천</span>
      </div>

      <div className="story-scroll-content" ref={scrollRef}>
        <div className="story-content-section">
          {/* 진행 상태 바 */}
          <div className="story-progress-bar">
            {progressWidths.map((width, index) => (
              <div
                key={index}
                className={`sp-progress-segment ${index < activeCount ? 'active' : ''}`}
                style={{ flex: width }}
              />
            ))}
          </div>

          {/* Step 1 - 타임라인 밖에 위치 */}
          <div className="story-step-box-left story-step-box-with-line-bottom">
            <span className="story-step-label">step 1</span>
            <span className="story-step-text">각 컷을 간단하게 메모해보세요.</span>
          </div>

          <div className="sp-cut-list-container">
            <div className="sp-timeline-wrapper">

              {cuts.map((cut, index) => {
                const isActive = activeCutId === cut.id;
                const hasMemo = memos[cut.id]?.trim();
                const isLast = index === cuts.length - 1;

                return (
                  <div key={cut.id} className="sp-timeline-row" onClick={() => handleCutSelect(cut)}>
                    {/* 왼쪽 타임라인 */}
                    <div className="sp-timeline-indicator">
                      <div className={`sp-timeline-dot ${isActive ? 'active' : ''}`} />
                      <div className={`sp-timeline-line ${isActive ? 'active' : ''}`} />
                    </div>

                    <div className="sp-cut-wrapper">
                      {/* 타이틀 행 (카드 바깥) */}
                      <div className="sp-cut-header-outside">
                        <div className="sp-cut-header-left">
                          {cut.label.includes(' - ') ? (
                            // 범위 라벨 (예: "2 - 5")
                            <>
                              <img src="/icons/media.png" alt="" className={`sp-cut-icon ${isActive ? 'active' : ''}`} />
                              <span className={`sp-cut-label ${isActive ? 'active' : ''}`}>{cut.label.split(' - ')[0]}</span>
                              <span className={`sp-cut-label-separator ${isActive ? 'active' : ''}`}>-</span>
                              <img src="/icons/media.png" alt="" className={`sp-cut-icon ${isActive ? 'active' : ''}`} />
                              <span className={`sp-cut-label ${isActive ? 'active' : ''}`}>{cut.label.split(' - ')[1]}</span>
                            </>
                          ) : (
                            // 단일 라벨 (예: "1", "6")
                            <>
                              <img src="/icons/media.png" alt="" className={`sp-cut-icon ${isActive ? 'active' : ''}`} />
                              <span className={`sp-cut-label ${isActive ? 'active' : ''}`}>{cut.label}</span>
                            </>
                          )}
                          <span className={`sp-cut-title ${isActive ? 'active' : ''}`}>{cut.title}</span>
                        </div>
                        {isActive && cut.time && (
                          <span className="sp-cut-time-tag active">{cut.time}</span>
                        )}
                      </div>

                      {/* 컷 카드 (썸네일 + 설명) */}
                      <div className={`sp-cut-card ${isActive ? 'active' : ''}`}>
                        <div className={`sp-cut-thumbnail ${isActive ? 'active' : ''}`}>
                          {cutThumbnails[cut.id] ? (
                            <img src={cutThumbnails[cut.id]} alt={`컷 ${index + 1}`} />
                          ) : (
                            <div className="sp-cut-thumbnail-empty" />
                          )}
                          {!isActive && cut.time && (
                            <div className="sp-cut-thumbnail-dim">
                              <span className="sp-cut-thumbnail-time">{cut.time.replace('초', 's')}</span>
                            </div>
                          )}
                          {hasMemo && !isActive && (
                            <div className="sp-cut-thumbnail-check">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="#F8FF33"/>
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="sp-cut-description-area">
                          {cut.description && (
                            <p className="sp-cut-description">{cut.description}</p>
                          )}
                          {!isActive && hasMemo && (
                            <p className="sp-cut-memo-display">{memos[cut.id]}</p>
                          )}
                        </div>
                      </div>

                      {/* 메모 섹션 (선택 시에만 표시) */}
                      {isActive && (
                        <div className="sp-memo-section">
                          <label className="sp-memo-label">메모</label>
                          <input
                            type="text"
                            className="sp-memo-input"
                            placeholder=""
                            value={memos[cut.id] || ''}
                            onChange={(e) => handleMemoChange(cut.id, e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

            </div>
          </div>

          {/* Step 2 - 타임라인 밖에 위치 */}
          <div className="story-step-box-left story-step-box-with-line-top">
            <span className="story-step-label">step 2</span>
            <span className="story-step-text">작성한 메모는 영상 설명으로 사용돼요.</span>
          </div>
        </div>
      </div>

      {/* 하단 버튼 - 고정 */}
      <div className="story-bottom-buttons-fixed">
        <button className="story-save-btn" onClick={handleStartEdit}>
          저장하기
        </button>
      </div>
    </div>
  );
}

export default StoryPlanningScreenB;
