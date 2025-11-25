import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom'; 

const CallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    const accessToken = searchParams.get('access_token');
    let spotifyId = searchParams.get('spotify_id');

    if (success && accessToken) {
      // spotify_id 가 비어 있으면 임시 ID 생성 (로컬 프로젝트용)
      if (!spotifyId) {
        spotifyId = 'local_user_' + Date.now();
      }

      localStorage.setItem('spotify_access_token', accessToken);
      localStorage.setItem('spotify_id', spotifyId);

      alert('✅ Spotify 인증 완료! 이제 노래 추천을 받을 수 있습니다.');
    } else if (error) {
      alert(`❌ Spotify 인증 실패: ${error}`);
    } else {
      alert('⚠️ 알 수 없는 콜백 오류가 발생했습니다.');
    }

    navigate('/', { replace: true });
    
  }, [searchParams, navigate]);

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1>Spotify 인증 처리 중...</h1>
      <p>잠시 후 자동으로 메인 페이지로 돌아갑니다.</p>
    </div>
  );
};

export default CallbackPage;
