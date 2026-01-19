import { useState, useEffect } from 'react';
import './Category.css';
import { logScreenView, logButtonClick, logSelect } from '../utils/logger';

const platforms = [
  {
    id: 'instagram',
    icon: '📷',
    name: '인스타그램 릴스',
    logo: 'instagram',
  },
  {
    id: 'youtube',
    icon: '▶️',
    name: '유튜브 쇼츠',
    logo: 'youtube',
  },
  {
    id: 'tiktok',
    icon: '🎵',
    name: '틱톡',
    logo: 'tiktok',
  },
  {
    id: 'naver',
    icon: '🟢',
    name: '네이버 클립',
    logo: 'naver',
  },
  {
    id: 'kakao',
    icon: '💬',
    name: '카카오톡 지금',
    logo: 'kakao',
  },
  {
    id: 'other',
    icon: '❓',
    name: '다른 플랫폼',
    logo: 'other',
  },
];

function CategoryPlatform({ onNext, onBack }) {
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    logScreenView('category_platform');
  }, []);

  const handleSelect = (id) => {
    setSelected((prev) => {
      const newSelected = prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id];
      logSelect('category_platform', 'platform_item', newSelected);
      return newSelected;
    });
  };

  const handleNext = () => {
    if (selected.length > 0) {
      logButtonClick('category_platform', 'start_button', selected.join(', '));
      onNext(selected);
    }
  };

  return (
    <div className="category-container">
      <div className="category-content">
        <div className="category-header">
          <h1 className="category-title">
            영상을 주로 업로드할
            <br />
            플랫폼은 어디인지 알려주세요!
          </h1>
          <p className="category-subtitle">여러가지 플랫폼을 선택해도 좋아요</p>
        </div>

        <div className="platform-list">
          {platforms.map((platform) => (
            <button
              key={platform.id}
              className={`platform-item ${selected.includes(platform.id) ? 'selected' : ''}`}
              onClick={() => handleSelect(platform.id)}
            >
              <span className="platform-icon">{platform.icon}</span>
              <span className="platform-name">{platform.name}</span>
              {selected.includes(platform.id) && (
                <span className="platform-check">✓</span>
              )}
            </button>
          ))}
        </div>

        <button
          className={`next-button ${selected.length > 0 ? 'active' : ''}`}
          onClick={handleNext}
          disabled={selected.length === 0}
        >
          시작하기
        </button>
      </div>
    </div>
  );
}

export default CategoryPlatform;
