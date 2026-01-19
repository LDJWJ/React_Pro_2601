import { useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import logo from '../assets/logo.png';
import './LoginScreen.css';
import { logScreenView, logButtonClick, logLogin } from '../utils/logger';

function LoginScreen({ onLogin }) {
  useEffect(() => {
    logScreenView('login');
  }, []);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const userInfoResponse = await fetch(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
            },
          }
        );
        const userInfo = await userInfoResponse.json();
        console.log('Google 로그인 성공:', userInfo);
        logLogin('google', userInfo.email);
        onLogin(userInfo);
      } catch (error) {
        console.error('사용자 정보 가져오기 실패:', error);
      }
    },
    onError: (error) => {
      console.error('Google 로그인 실패:', error);
    },
  });

  const handleGoogleLogin = () => {
    logButtonClick('login', 'google_login_button');
    googleLogin();
  };

  const handleNaverLogin = () => {
    logButtonClick('login', 'naver_login_button');
    console.log('Naver login clicked');
    alert('네이버 로그인은 아직 구현되지 않았습니다.');
  };

  const handleAppleLogin = () => {
    logButtonClick('login', 'apple_login_button');
    console.log('Apple login clicked');
    alert('Apple 로그인은 아직 구현되지 않았습니다.');
  };

  return (
    <div className="login-container">
      <div className="login-content">
        <div className="logo-section">
          <img src={logo} alt="HookHook Logo" className="logo-image" />
          <h1 className="app-name">HookHook</h1>
        </div>

        <div className="button-section">
          <button className="login-button" onClick={handleGoogleLogin}>
            <span className="button-icon">G</span>
            <span className="button-text">구글 계정으로 시작하기</span>
          </button>

          <button className="login-button" onClick={handleNaverLogin}>
            <span className="button-icon">N</span>
            <span className="button-text">네이버 계정으로 시작하기</span>
          </button>

          <button className="login-button" onClick={handleAppleLogin}>
            <span className="button-icon">A</span>
            <span className="button-text">Apple 계정으로 시작하기</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginScreen;
