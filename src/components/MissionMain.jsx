import { useEffect } from 'react';
import './MissionMain.css';
import { logScreenView, logButtonClick, logMissionStart } from '../utils/logger';

const missions = [
  { id: 9, title: '편집1-1', subtitle: '영상 추가 후 재생하기', enabled: true },
  { id: 7, title: '편집2-1', subtitle: '컷을 이동하며 원하는 구간 찾기', enabled: true },
  { id: 8, title: '편집6-1', subtitle: 'AI 자막 추천', enabled: true },
  { id: 10, title: '기획1-1', subtitle: '아이디어 메모 (6컷 개별)', enabled: true },
  { id: 12, title: '기획1-2', subtitle: '아이디어 메모 (3컷 그룹)', enabled: true },
  { id: 6, title: '데이터 분석', subtitle: '트래킹 로그 분석', enabled: true },
  { id: 11, title: '데이터 시각화', subtitle: 'CSV/샘플 데이터 차트', enabled: true },
  { id: 2, title: '(미사용) 미션 1', subtitle: '영상 기획하기', enabled: false },
  { id: 3, title: '(미사용) 미션 2', subtitle: '콘텐츠 업로드', enabled: false },
  { id: 1, title: '(미사용) 미션 9', subtitle: '영상 기획하기', enabled: false },
  { id: 5, title: '(미사용) 미션 99', subtitle: 'A/B안 샘플미션', enabled: false },
];

function MissionMain({ user, onMissionSelect, onLogout }) {
  useEffect(() => {
    logScreenView('mission_main');
  }, []);

  const handleMissionClick = (mission) => {
    if (!mission.enabled) return;
    logButtonClick('mission_main', `mission_${mission.id}`);
    logMissionStart('mission_main', `mission_${mission.id}`);
    onMissionSelect(mission.id);
  };

  return (
    <div className="mission-main-container">
      <div className="mission-main-header">
        <h1 className="mission-main-title">미션 선택</h1>
        <button className="mission-logout-btn" onClick={onLogout}>
          로그아웃
        </button>
      </div>

      {user && (
        <p className="mission-main-greeting">
          안녕하세요, {user.name || user.email || '사용자'}님!
        </p>
      )}

      <div className="mission-grid">
        {missions.map((mission) => (
          <button
            key={mission.id}
            className={`mission-card${mission.enabled ? '' : ' mission-card-disabled'}`}
            onClick={() => handleMissionClick(mission)}
            disabled={!mission.enabled}
          >
            <span className="mission-card-number">{mission.title}</span>
            <span className="mission-card-subtitle">{mission.subtitle}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default MissionMain;
