import { useState, useEffect, useRef } from 'react';
import './StoryPlanningScreen.css';
import { logScreenView, logButtonClick, logMissionComplete, logMissionStart, logScreenExit } from '../utils/logger';

// 필름 아이콘 컴포넌트 (이미지 기반)
const FilmIcon = ({ active }) => (
  <img
    src={active ? "/images/play_note/Icons_v2.png" : "/images/play_note/icon_v1.png"}
    alt="필름 아이콘"
    className="sp-film-icon"
  />
);

const defaultCuts = [
  { id: 1, title: "인트로(첫 장면)", description: "패키지 전체가 보이도록 제품을 한 컷으로 보여주세요.", time: "2초", image: "/images/play_note/cut_1.png" },
  { id: 2, title: "테이블 풀샷", description: "테이블 위의 한 장면 디저트와 음료, 노트북 위의 손까지 — 카페에서의 자연스러운 순간을 담아주세요.", time: "2초", image: "/images/play_note/cut_2.png" },
  { id: 3, title: "공간 무드", description: "공간의 무드 어둡고 낮은 톤의 좌석 공간을 와이드로 잡아, 카페만의 분위기를 보여주세요.", time: "2초", image: "/images/play_note/cut_3.png" },
  { id: 4, title: "인테리어 디테일", description: "디테일 한 컷 벽면 오브제, 소품 등 인테리어 디테일을 클로즈업해 공간의 감성을 전달하세요.", time: "2초", image: "/images/play_note/cut_4.png" },
  { id: 5, title: "공간 시그니처", description: "공간의 시그니처 유리 바닥, 돌, 계단 등 이 카페만의 독특한 건축 요소를 포착하세요.", time: "2초", image: "/images/play_note/cut_5.png" },
  { id: 6, title: "마무리 장면", description: "여운을 남길 수 있는 장면이에요.\n분위기를 한 번 더 강조하면 좋아요.", time: "2초", image: "/images/play_note/cut_6.png" },
];

function Plan1_1AScreen({ onComplete, onBack }) {
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
    // MissionStep에서 다음 버튼 클릭 시점을 미션 시작 시간으로 사용
    const savedStartTime = sessionStorage.getItem('missionStartTime');
    missionStartTime.current = savedStartTime ? parseInt(savedStartTime, 10) : enterTime;

    // 화면 진입 로그를 먼저 전송 (완료 대기)
    const initLogs = async () => {
      await logScreenView('기획1-1_화면');
      // 미션 시작 로그는 화면 진입 로그 후에 전송
      if (!missionStartLogged.current) {
        missionStartLogged.current = true;
        // 충분한 지연 후 미션 시작 로그
        setTimeout(() => {
          logMissionStart('기획1-1_화면', '기획1-1_미션시작');
        }, 500);
      }
    };
    initLogs();

    return () => {
      const dwellTime = Date.now() - enterTime;
      logScreenExit('기획1-1_화면', dwellTime);
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
    logButtonClick('기획1-1_화면', 'cut_select', JSON.stringify(state));
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
      logButtonClick('기획1-1_화면', '메모입력완료', JSON.stringify(state));
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
    logButtonClick('기획1-1_화면', '저장하기', JSON.stringify(state));

    // 2초 후 미션 완료
    setTimeout(() => {
      const completionTime = ((Date.now() - missionStartTime.current) / 1000).toFixed(1);
      logMissionComplete('기획1-1_화면', '기획1-1_미션완료', `완료시간:${completionTime}초,메모수:${memoCount},총길이:${totalMemoLength}`);
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
    logButtonClick('기획1-1_화면', '미션포기', JSON.stringify(state));
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
        <span className="story-header-title">체험단용 뷰티 브이로그</span>
      </div>

      <div className="story-scroll-content" ref={scrollRef}>
        <div className="story-content-section">
          <div className="story-header">
            <h2 className="story-title">훅 노트</h2>
            <p className="story-description">가이드대로 촬영을 진행해도 괜찮아요.<br/>더 담고 싶은 아이디어가 있다면 메모로 남겨보세요.</p>
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
                  <img src={cut.image} alt={`컷 ${index + 1}`} />
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
                    <span className="sp-cut-number-with-icon">
                      <FilmIcon active={activeCutId === cut.id} />
                      <span>{index + 1}</span>
                    </span>
                    <span className="sp-cut-title">{cut.title}</span>
                  </div>
                  {cut.description && (
                    <p className={`sp-cut-description ${memos[cut.id]?.trim() ? 'filled' : ''}`}>{cut.description.split('\n').map((line, i) => (
                      <span key={i}>{line}{i < cut.description.split('\n').length - 1 && <br/>}</span>
                    ))}</p>
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

export default Plan1_1AScreen;
