import { useState, useEffect } from 'react';
import './Home.css';
import { logScreenView, logButtonClick } from '../utils/logger';

// 임시 템플릿 데이터
const recommendedTemplates = [
  { id: 1, title: '트렌디 브이로그', users: 300, thumbnail: '' },
  { id: 2, title: '감성 일상', users: 300, thumbnail: '' },
  { id: 3, title: '여행 하이라이트', users: 300, thumbnail: '' },
  { id: 4, title: '일상 기록', users: 280, thumbnail: '' },
  { id: 5, title: '맛집 투어', users: 250, thumbnail: '' },
];

const weekendTemplates = [
  { id: 6, title: '주말 브이로그', users: 300, thumbnail: '' },
  { id: 7, title: '카페 투어', users: 300, thumbnail: '' },
  { id: 8, title: '맛집 리뷰', users: 300, thumbnail: '' },
];

function Home({ user, selections, onLogout, onTabChange, activeTab = 'template' }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleTabClick = (tab) => {
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  useEffect(() => {
    logScreenView('home');
  }, []);

  const handleSearch = () => {
    logButtonClick('home', 'search_bar');
  };

  const handleTemplateClick = (template, section) => {
    logButtonClick('home', `template_${section}`, template.title);
  };

  const handleMoreClick = () => {
    logButtonClick('home', 'more_button');
  };

  const goToPrev = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) =>
      prev === 0 ? recommendedTemplates.length - 1 : prev - 1
    );
    setTimeout(() => setIsAnimating(false), 400);
  };

  const goToNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) =>
      prev === recommendedTemplates.length - 1 ? 0 : prev + 1
    );
    setTimeout(() => setIsAnimating(false), 400);
  };

  const getCardStyle = (index) => {
    const diff = index - currentIndex;
    const totalItems = recommendedTemplates.length;

    // 순환 처리
    let adjustedDiff = diff;
    if (diff > totalItems / 2) adjustedDiff = diff - totalItems;
    if (diff < -totalItems / 2) adjustedDiff = diff + totalItems;

    const isCenter = adjustedDiff === 0;
    const isLeft = adjustedDiff === -1 || (currentIndex === 0 && index === totalItems - 1 && totalItems > 2);
    const isRight = adjustedDiff === 1 || (currentIndex === totalItems - 1 && index === 0 && totalItems > 2);

    // 재계산
    if (currentIndex === 0 && index === totalItems - 1) {
      return {
        transform: 'translateX(-120%) scale(0.75) rotateY(25deg)',
        opacity: 0.6,
        zIndex: 1,
      };
    }
    if (currentIndex === totalItems - 1 && index === 0) {
      return {
        transform: 'translateX(120%) scale(0.75) rotateY(-25deg)',
        opacity: 0.6,
        zIndex: 1,
      };
    }

    if (isCenter) {
      return {
        transform: 'translateX(0) scale(1) rotateY(0deg)',
        opacity: 1,
        zIndex: 3,
      };
    } else if (adjustedDiff === -1) {
      return {
        transform: 'translateX(-120%) scale(0.75) rotateY(25deg)',
        opacity: 0.6,
        zIndex: 1,
      };
    } else if (adjustedDiff === 1) {
      return {
        transform: 'translateX(120%) scale(0.75) rotateY(-25deg)',
        opacity: 0.6,
        zIndex: 1,
      };
    } else {
      return {
        transform: 'translateX(0) scale(0.5)',
        opacity: 0,
        zIndex: 0,
      };
    }
  };

  // 사용자 이름 가져오기
  const userName = user?.name?.split(' ')[0] || '회원';

  // 선택한 주제에 따른 추천 이유 생성
  const getRecommendReason = () => {
    const topicMap = {
      daily: '일상기록',
      promotion: '홍보',
      travel: '여행',
      fashion: '패션·뷰티',
      food: '맛집·카페',
      fitness: '운동·건강',
    };

    if (selections?.topics?.length > 0) {
      const topicNames = selections.topics
        .slice(0, 2)
        .map(t => topicMap[t] || t)
        .join(' · ');
      return `${topicNames} 영상에서 200명이 사용했어요`;
    }
    return '홍보 · 기록 영상에서 200명이 사용했어요';
  };

  return (
    <div className="home-container">
      {/* 상단 검색창 */}
      <div className="search-section">
        <div className="search-bar" onClick={handleSearch}>
          <span className="search-icon">🔍</span>
          <span className="search-placeholder">원하는 템플릿을 검색해보세요</span>
        </div>
      </div>

      {/* 메인 추천 템플릿 3D 캐러셀 */}
      <div className="main-recommend-section">
        <div className="carousel-3d-container">
          {/* 왼쪽 화살표 */}
          <button className="carousel-arrow arrow-left" onClick={goToPrev}>
            ‹
          </button>

          <div className="carousel-3d-viewport">
            <div className="carousel-3d-track">
              {recommendedTemplates.map((template, index) => (
                <div
                  key={template.id}
                  className="carousel-3d-card"
                  style={getCardStyle(index)}
                  onClick={() => {
                    if (index === currentIndex) {
                      handleTemplateClick(template, 'main');
                    } else {
                      setCurrentIndex(index);
                    }
                  }}
                >
                  <div className="card-thumbnail-3d">
                    <div className="thumbnail-placeholder-3d"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 오른쪽 화살표 */}
          <button className="carousel-arrow arrow-right" onClick={goToNext}>
            ›
          </button>
        </div>

        <div className="recommend-text">
          <h2 className="recommend-title">
            {userName}님께 지금 가장
            <br />
            추천하는 템플릿이에요
          </h2>
          <p className="recommend-reason">{getRecommendReason()}</p>
        </div>

        {/* 인디케이터 */}
        <div className="carousel-indicators">
          {recommendedTemplates.map((_, index) => (
            <button
              key={index}
              className={`indicator-dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      </div>

      {/* 하단 추천 섹션 */}
      <div className="sub-recommend-section">
        <div className="section-header">
          <div className="section-title-group">
            <h3 className="section-title">주말 일상 올려보는 거 어때요?</h3>
            <p className="section-subtitle">어제 릴스에 가장 많이 업로드된 스타일이에요</p>
          </div>
          <button className="more-button" onClick={handleMoreClick}>
            더보기 &gt;
          </button>
        </div>

        <div className="template-grid">
          {weekendTemplates.map((template) => (
            <div
              key={template.id}
              className="template-card"
              onClick={() => handleTemplateClick(template, 'weekend')}
            >
              <div className="template-thumbnail">
                <div className="thumbnail-placeholder small"></div>
                <div className="template-users">
                  <span className="users-icon">👤</span>
                  <span className="users-count">{template.users}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 하단 고정 네비게이션 */}
      <nav className="bottom-nav">
        <button
          className={`bottom-nav-item ${activeTab === 'template' ? 'active' : ''}`}
          onClick={() => handleTabClick('template')}
        >
          <svg className="bottom-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          <span className="bottom-nav-label">템플릿</span>
        </button>
        <button
          className={`bottom-nav-item ${activeTab === 'editor' ? 'active' : ''}`}
          onClick={() => handleTabClick('editor')}
        >
          <svg className="bottom-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
            <line x1="12" y1="1" x2="12" y2="23" />
            <line x1="1" y1="12" x2="23" y2="12" />
          </svg>
          <span className="bottom-nav-label">편집기</span>
        </button>
        <button
          className={`bottom-nav-item ${activeTab === 'mypage' ? 'active' : ''}`}
          onClick={() => handleTabClick('mypage')}
        >
          <svg className="bottom-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
          </svg>
          <span className="bottom-nav-label">마이페이지</span>
        </button>
      </nav>
    </div>
  );
}

export default Home;
