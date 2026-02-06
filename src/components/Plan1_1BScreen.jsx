import { useState, useEffect, useRef } from 'react';
import './StoryPlanningScreen.css';
import { logScreenView, logButtonClick, logMissionComplete, logMissionStart, logScreenExit } from '../utils/logger';

const defaultCuts = [
  { id: 1, label: "1", title: "인트로(첫 장면)", description: "시선을 사로잡을 수 있는 포인트를 담아주세요. 디저트나 커피 클로즈업도 좋아요.", time: "3초", startTime: 0, thumbnail: '/images/story01.png' },
  { id: 2, label: "2 - 5", title: "카페 보여주기", description: "이 장면에서는 '작업하기 좋다'는 이유가 보이는 장면을 담아주세요.", time: "3초", startTime: 3, thumbnail: '/images/story03.png' },
  { id: 3, label: "6", title: "마무리 장면", description: "여운을 남길 수 있는 장면이에요. 분위기를 한 번 더 강조하면 좋아요.", time: "3초", startTime: 6, thumbnail: '/images/story06.png' },
];

function Plan1_1BScreen({ onComplete, onBack }) {
  const [memos, setMemos] = useState({});
  const [activeCutId, setActiveCutId] = useState(1);
  const [completed, setCompleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const scrollRef = useRef(null);
  const missionStartTime = useRef(null);
  const missionStartLogged = useRef(false);
  const savingRef = useRef(false);  // 중복 저장 방지용 ref

  const cuts = defaultCuts;

  useEffect(() => {
    const enterTime = Date.now();
    // 화면 진입 시점을 미션 시작 시간으로 사용
    missionStartTime.current = enterTime;

    // 화면 진입 로그를 먼저 전송 (완료 대기)
    const initLogs = async () => {
      await logScreenView('기획1-2_화면');
      // 미션 시작 로그는 화면 진입 로그 후에 전송
      if (!missionStartLogged.current) {
        missionStartLogged.current = true;
        setTimeout(() => {
          logMissionStart('기획1-2_화면', '기획1-2_미션시작');
        }, 500);
      }
    };
    initLogs();

    return () => {
      const dwellTime = Date.now() - enterTime;
      logScreenExit('기획1-2_화면', dwellTime);
    };
  }, []);

  const handleCutSelect = (cut) => {
    // 저장 중에는 로그 남기지 않음
    if (isSaving) return;
    const prevCutId = activeCutId;
    setActiveCutId(cut.id);
    const state = {
      cutId: cut.id,
      cutLabel: cut.label,
      cutTitle: cut.title,
      prevCutId: prevCutId,
      hasMemo: !!memos[cut.id]?.trim(),
      memoLength: memos[cut.id]?.length || 0
    };
    logButtonClick('기획1-2_화면', 'cut_select', JSON.stringify(state));
  };

  // 모든 컷에 메모가 작성되면 step2 활성화
  const allMemosCompleted = cuts.every(cut => memos[cut.id]?.trim());
  const activeStep = allMemosCompleted ? 2 : 1;

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
        cutLabel: cut?.label || '',
        cutTitle: cut?.title || '',
        memoLength: value.length,
        memoText: value.substring(0, 50) + (value.length > 50 ? '...' : '')
      };
      logButtonClick('기획1-2_화면', '메모입력완료', JSON.stringify(state));
    }
  };

  const handleSave = () => {
    // 중복 클릭 방지 (ref로 동기적 체크)
    if (isSaving || savingRef.current) return;
    savingRef.current = true;  // 동기적으로 즉시 설정
    setIsSaving(true);

    // 메모 개수 및 길이 계산
    const memoCount = Object.values(memos).filter(memo => memo.trim() !== '').length;
    const totalMemoLength = Object.values(memos).reduce((sum, memo) => sum + (memo?.length || 0), 0);
    const memoDetails = cuts.map(cut => ({
      cutId: cut.id,
      cutLabel: cut.label,
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
    logButtonClick('기획1-2_화면', '저장하기', JSON.stringify(state));

    // 미션 완료 시간은 버튼 클릭 시점에 계산 (2초 대기 시간 제외)
    const completionTime = ((Date.now() - missionStartTime.current) / 1000).toFixed(1);
    logMissionComplete('기획1-2_화면', '기획1-2_미션완료', `완료시간:${completionTime}초,메모수:${memoCount},총길이:${totalMemoLength}`);

    // 2초 후 완료 화면 표시
    setTimeout(() => {
      setCompleted(true);
    }, 2000);
  };

  const handleBack = () => {
    // 미션 포기 로그 (미완료 상태로 이탈)
    const memoCount = Object.values(memos).filter(memo => memo.trim() !== '').length;
    const totalMemoLength = Object.values(memos).reduce((sum, memo) => sum + (memo?.length || 0), 0);
    const memoDetails = cuts.map(cut => ({
      cutId: cut.id,
      cutLabel: cut.label,
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
    logButtonClick('기획1-2_화면', '미션포기', JSON.stringify(state));
    onBack();
  };

  const scenes = cuts.map(cut => ({ ...cut, memo: memos[cut.id] || '' }));
  const activeCount = scenes.filter(s => s.memo.trim() !== '').length;
  const isSaveEnabled = activeCount >= 1;

  if (completed) {
    return (
      <div className="story-planning-container">
        <div className="story-complete-overlay">
          <div className="story-complete-message">
            <div className="story-complete-check">✓</div>
            <p>미션을 완료했습니다.</p>
            <p className="story-complete-next">이어서 다음 미션을 수행해 주세요.</p>
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
        <span className="story-header-title">아이디어 노트 B안</span>
      </div>

      <div className="story-scroll-content" ref={scrollRef}>
        <div className="story-content-section">
          {/* Step 1 - 타임라인 밖에 위치 */}
          <div className="story-step-box-left story-step-box-with-line-bottom">
            <span className="story-step-label">step 1</span>
            <span className={`story-step-text ${activeStep === 1 ? 'active' : 'inactive'}`}>각 컷을 간단하게 메모해보세요.</span>
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
                          <span className="sp-cut-time-tag active">{cut.startTime}초~{cut.startTime + parseInt(cut.time)}초</span>
                        )}
                      </div>

                      {/* 컷 카드 (썸네일 + 설명) */}
                      <div className={`sp-cut-card ${isActive ? 'active' : ''}`}>
                        <div className={`sp-cut-thumbnail ${isActive ? 'active' : ''}`}>
                          <img src={cut.thumbnail} alt={`컷 ${index + 1}`} />
                          {!isActive && cut.time && (
                            <div className="sp-cut-thumbnail-dim">
                              <span className="sp-cut-thumbnail-time">{cut.time.replaceAll('초', 's')}</span>
                            </div>
                          )}
                        </div>
                        <div className="sp-cut-description-area">
                          {cut.description && (
                            <p className="sp-cut-description">{cut.description}</p>
                          )}
                        </div>
                      </div>

                      {/* 메모 표시 (비선택 시, 메모가 있으면 카드 아래에 표시) */}
                      {!isActive && hasMemo && (
                        <div className="sp-memo-display-box">
                          <p className="sp-memo-display-text">{memos[cut.id]}</p>
                        </div>
                      )}

                      {/* 메모 섹션 (선택 시에만 표시) */}
                      {isActive && (
                        <div className="sp-memo-section">
                          <label className="sp-memo-label">메모</label>
                          <textarea
                            className="sp-memo-input"
                            placeholder="떠오르는 생각을 자유롭게 작성해주세요"
                            value={memos[cut.id] || ''}
                            onChange={(e) => handleMemoChange(cut.id, e.target.value)}
                            onBlur={(e) => handleMemoBlur(cut.id, e.target.value)}
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
            <span className={`story-step-text ${activeStep === 2 ? 'active' : 'inactive'}`}>작성한 메모는 영상 설명으로 사용돼요.</span>
          </div>

        </div>
      </div>

      {/* 저장 버튼 - 화면 하단 고정 */}
      <div className="story-fixed-bottom">
        <button
          className={`story-save-btn ${!isSaveEnabled ? 'disabled' : ''}`}
          onClick={handleSave}
          disabled={!isSaveEnabled}
        >
          저장하기
        </button>
      </div>
    </div>
  );
}

export default Plan1_1BScreen;
