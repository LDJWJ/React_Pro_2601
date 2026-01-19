import { useState, useEffect } from 'react';
import './Category.css';
import { logScreenView, logButtonClick, logSelect } from '../utils/logger';

const purposes = [
  {
    id: 'brand',
    icon: '🏪',
    title: '가게나 브랜드를',
    subtitle: '소개할래요',
  },
  {
    id: 'product',
    icon: '🗺️',
    title: '제품/메뉴를',
    subtitle: '보여주고 싶어요',
  },
  {
    id: 'daily',
    icon: '📷',
    title: '일상이나 경험을',
    subtitle: '공유할래요',
  },
  {
    id: 'review',
    icon: '📢',
    title: '리뷰나 꿀팁같은',
    subtitle: '정보를 전달할래요',
  },
  {
    id: 'unknown',
    icon: '🔍',
    title: '아직까지는',
    subtitle: '잘 모르겠어요...',
  },
];

function CategoryPurpose({ onNext, onBack }) {
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    logScreenView('category_purpose');
  }, []);

  const handleSelect = (id) => {
    setSelected(id);
    logSelect('category_purpose', 'purpose_card', id);
  };

  const handleNext = () => {
    if (selected) {
      logButtonClick('category_purpose', 'next_button', selected);
      onNext(selected);
    }
  };

  return (
    <div className="category-container">
      <div className="category-content">
        <div className="category-header">
          <h1 className="category-title">
            지금 만들고 싶은
            <br />
            영상의 목적은 무엇인가요?
          </h1>
          <p className="category-subtitle">지금 만들고 싶은 영상의 목적은 무엇인가요?</p>
        </div>

        <div className="purpose-grid">
          {purposes.map((purpose) => (
            <button
              key={purpose.id}
              className={`purpose-card ${selected === purpose.id ? 'selected' : ''}`}
              onClick={() => handleSelect(purpose.id)}
            >
              <span className="purpose-icon">{purpose.icon}</span>
              <span className="purpose-title">{purpose.title}</span>
              <span className="purpose-subtitle">{purpose.subtitle}</span>
            </button>
          ))}
        </div>

        <button
          className={`next-button ${selected ? 'active' : ''}`}
          onClick={handleNext}
          disabled={!selected}
        >
          다음
        </button>
      </div>
    </div>
  );
}

export default CategoryPurpose;
