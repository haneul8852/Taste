// src/App.jsx

import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from './config';
import styled from 'styled-components';
import { LoadScript, GoogleMap, Marker, Autocomplete } from '@react-google-maps/api';

// ====== Styled Components ======
const Layout = styled.div`
  display: block;
  position: relative;
  min-height: 100vh;
  background-color: #e9ecef;
`;

// Sidebar는 카드 컨테이너 역할
const Sidebar = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
  width: 440px;
  padding: 0;
  background: transparent;
  display: flex;
  flex-direction: column;
  z-index: 1001;
  border-radius: 12px;
  overflow: visible;

  @media (max-width: 900px) {
    width: calc(100% - 40px);
    left: 10px;
    right: 10px;
    top: 10px;
  }
`;

const MapWrapper = styled.div`
  width: 100%;
  height: 100vh;
  position: relative;
`;

// ✅ 두 카드 공통 크기(폭 + 높이) 고정
const Card = styled.div`
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  width: 100%;
  box-sizing: border-box;
  min-height: 520px; /* 폼 카드 기준 높이 */
`;

const Title = styled.h2`
  color: #333;
  margin-bottom: 16px;
  text-align: left;
`;

const InputGroup = styled.div`
  margin-bottom: 16px;
  position: relative;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 6px;
  font-weight: bold;
  color: #555;
`;

const Input = styled.input`
  width: 100%;
  padding: 9px 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  box-sizing: border-box;
`;

const Button = styled.button`
  background-color: ${(props) => (props.$spotify ? '#1DB954' : '#007bff')};
  color: white;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 15px;
  margin-top: 8px;
  width: 100%;
  transition: background-color 0.2s ease;

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background-color: ${(props) => (props.$spotify ? '#1ed760' : '#0056b3')};
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  box-sizing: border-box;
  min-height: 80px;
  resize: vertical;
`;

// ✅ ResultBox도 Card를 상속 → 같은 크기 유지
const ResultBox = styled(Card)`
  background: #ffff;
  border: 1px dashed #ced4da;
`;

const ResultLayout = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 6px;
`;

const PhotoPreview = styled.img`
  width: 100%;
  max-width: 220px;
  border-radius: 12px;
  object-fit: cover;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
`;

const ResultInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;

  p {
    margin: 0;
    color: #495057;
  }

  strong {
    color: #212529;
  }
`;

const SpotifyPlayer = styled.iframe`
  border-radius: 12px;
  border: none;
  width: 100%;
  min-height: 80px;
  margin-top: 4px;
`;

const LocateButton = styled.button`
  position: absolute;
  right: 18px;
  top: 18px;
  z-index: 999;
  background: #1e88e5;
  color: #fff;
  border: none;
  padding: 10px 12px;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12);
  cursor: pointer;
  font-weight: 600;

  &:hover {
    background: #1669c1;
  }
`;

// ====== Google Maps 설정 ======
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const LIBRARIES = ['places'];
const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };

function App() {
  const [reviewText, setReviewText] = useState('');
  const [location, setLocation] = useState(DEFAULT_CENTER);
  const [address, setAddress] = useState('위치 정보를 불러오는 중...');
  const [photo, setPhoto] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSpotifyConnected, setIsSpotifyConnected] = useState(false);
  const [markers, setMarkers] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [activeMemory, setActiveMemory] = useState(null);

  const fileInputRef = useRef(null);
  const mapRef = useRef(null);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `.pac-container { z-index: 10000 !important; }`;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('spotify_access_token');
    const id = localStorage.getItem('spotify_id');
    if (token && id) {
      setIsSpotifyConnected(true);
      fetchSavedLocations(id, token);
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLoc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setLocation(newLoc);
        },
        (error) => {
          console.warn('Geolocation on mount failed:', error);
        }
      );
    } else {
      console.warn('Browser does not support geolocation');
    }
  }, []);

  useEffect(() => {
    if (mapRef.current && location) {
      try {
        mapRef.current.panTo(location);
      } catch (e) {}
    }
    geocodeLatLng(location.lat, location.lng);
  }, [location]);

  const handleSpotifyLogin = () => {
    window.location.href = `${BASE_URL}/login/spotify`;
  };

  const fetchSavedLocations = async (spotifyId, accessToken) => {
    try {
      const response = await axios.get(`${BASE_URL}/photos`, {
        params: { user_id: spotifyId },
        headers: accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : undefined,
      });

      const photos = response.data.photos || [];
      const prepared = photos.map((p) => ({
        id: p.id,
        lat: p.latitude,
        lng: p.longitude,
        photoUrl: p.photo_url,
        reviewText: p.review_text,
        trackId: p.spotify_track_id,
      }));
      setMarkers(prepared);
    } catch (err) {
      console.error(
        'Fetch saved locations error:',
        err.response?.data || err.message
      );
    }
  };

  const getCleanTrackId = (rawId) => {
    if (!rawId) return '';
    return rawId.toString().replace('spotify:track:', '').trim();
  };

  const geocodeLatLng = async (lat, lng) => {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}&language=ko`
      );
      if (response.data.results && response.data.results.length > 0) {
        const addressComponents = response.data.results[0].address_components;
        let addressParts = [];
        addressComponents.forEach((component) => {
          if (component.types.includes('administrative_area_level_1')) {
            addressParts[0] = component.long_name;
          }
          if (component.types.includes('administrative_area_level_2')) {
            addressParts[1] = component.long_name;
          }
          if (component.types.includes('administrative_area_level_3')) {
            addressParts[2] = component.long_name;
          }
        });
        const formattedAddress = addressParts.filter(Boolean).join(' ');
        setAddress(
          formattedAddress || response.data.results[0].formatted_address
        );
      }
    } catch (err) {
      console.error('Geocoding error:', err);
      setAddress(`위도: ${lat.toFixed(4)}, 경도: ${lng.toFixed(4)}`);
    }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('브라우저가 GeoLocation을 지원하지 않습니다.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLoc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setLocation(newLoc);
        setCurrentLocation(newLoc);

        if (mapRef.current && mapRef.current.panTo) {
          try {
            mapRef.current.panTo(newLoc);
            mapRef.current.setZoom && mapRef.current.setZoom(15);
          } catch (e) {}
        }
      },
      (err) => {
        console.error('Locate me error:', err);
        alert('위치 정보를 가져올 수 없습니다. 브라우저 권한을 확인해주세요.');
      }
    );
  };

  const onAutocompleteLoad = (autocomplete) => {
    autocompleteRef.current = autocomplete;
  };

  const onPlaceChanged = () => {
    if (!autocompleteRef.current) return;
    const place = autocompleteRef.current.getPlace();
    if (!place.geometry || !place.geometry.location) {
      alert('장소 정보를 찾을 수 없습니다.');
      return;
    }

    const newLoc = {
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
    };
    setLocation(newLoc);
    setAddress(place.formatted_address || place.name || '');

    if (mapRef.current) {
      try {
        mapRef.current.panTo(newLoc);
        mapRef.current.setZoom && mapRef.current.setZoom(16);
      } catch (e) {}
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!photo || !reviewText.trim()) {
      alert('사진과 리뷰 텍스트를 모두 입력해주세요.');
      return;
    }

    const spotifyId = localStorage.getItem('spotify_id');
    const accessToken = localStorage.getItem('spotify_access_token');

    if (!spotifyId || !accessToken) {
      alert('먼저 상단의 Spotify 로그인 버튼으로 연동을 완료해 주세요.');
      return;
    }

    const formData = new FormData();
    formData.append('photo', photo);
    formData.append('review_text', reviewText);
    formData.append('latitude', location.lat);
    formData.append('longitude', location.lng);
    formData.append('user_id', spotifyId);

    setLoading(true);
    setResult(null);

    try {
      const response = await axios.post(`${BASE_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      setResult(response.data);
      alert('🎉 업로드 및 노래 추천 성공!');

      const newMarker = {
        id: response.data.id || Date.now(),
        lat: location.lat,
        lng: location.lng,
        photoUrl: response.data.photoUrl,
        reviewText,
        trackId: response.data.trackId,
      };

      setMarkers((prev) => [newMarker, ...prev]);
      setActiveMemory(newMarker);
    } catch (error) {
      console.error(
        'API Error:',
        error.response ? error.response.data : error.message
      );
      alert(
        `업로드 실패: ${
          error.response ? error.response.data.error : error.message
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <Layout>
        <div
          style={{
            width: '100%',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666',
          }}
        >
          VITE_GOOGLE_MAPS_API_KEY 가 설정되지 않았습니다.
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <LoadScript
        googleMapsApiKey={GOOGLE_MAPS_API_KEY}
        libraries={LIBRARIES}
      >
        {/* ===== 왼쪽 사이드바 ===== */}
        <Sidebar>
          <div style={{ position: 'relative' }}>
            {/* 기본 폼 카드 */}
            <div
              style={{
                transition: 'opacity 0.2s ease',
                opacity: activeMemory ? 0 : 1,
                pointerEvents: activeMemory ? 'none' : 'auto',
              }}
            >
              <Card>
                <Title>🎵 나의 메모리 & 음악 지도 만들기</Title>

                <InputGroup>
                  <Label>Spotify 연동</Label>
                  {!isSpotifyConnected ? (
                    <>
                      <Button $spotify onClick={handleSpotifyLogin}>
                        Spotify로 로그인하여 노래 추천 권한 얻기
                      </Button>
                      <p
                        style={{
                          marginTop: '8px',
                          color: '#888',
                          fontSize: '13px',
                        }}
                      >
                        아직 Spotify 연동이 안 되어 있어요. 먼저 위 버튼을 눌러
                        로그인해 주세요.
                      </p>
                    </>
                  ) : (
                    <p
                      style={{
                        marginTop: '8px',
                        color: '#28a745',
                        fontSize: '14px',
                        fontWeight: 600,
                      }}
                    >
                      ✅ Spotify 연동됨
                    </p>
                  )}
                </InputGroup>

                <hr
                  style={{
                    margin: '20px 0',
                    border: '0',
                    borderTop: '1px solid #ddd',
                  }}
                />

                <form onSubmit={handleSubmit}>
                  <InputGroup>
                    <Label>장소 검색</Label>
                    <Autocomplete
                      onLoad={onAutocompleteLoad}
                      onPlaceChanged={onPlaceChanged}
                    >
                      <Input
                        type="text"
                        placeholder="장소 검색 (예: 강남역)"
                      />
                    </Autocomplete>

                    <div
                      style={{
                        minHeight: '20px',
                        marginBottom: '10px',
                        fontSize: '0.85rem',
                        color: '#888',
                        marginTop: '8px',
                      }}
                    >
                      {address &&
                      address !== '위치 정보를 불러오는 중...' ? (
                        <span
                          style={{
                            color: '#1db954',
                            fontWeight: 'bold',
                          }}
                        >
                          📍 {address}
                        </span>
                      ) : (
                        '아직 선택된 위치가 없습니다.'
                      )}
                    </div>
                  </InputGroup>

                  <InputGroup
                    style={{
                      padding: '15px',
                      borderRadius: '12px',
                      marginBottom: '20px',
                      border: '1px solid #dddddd',
                    }}
                  >
                    <div
                      style={{
                        minHeight: '20px',
                        marginBottom: '10px',
                        fontSize: '0.85rem',
                        color: '#888',
                      }}
                    >
                      {address &&
                      address !== '위치 정보를 불러오는 중...' ? (
                        <span
                          style={{
                            color: '#1db954',
                            fontWeight: 'bold',
                          }}
                        >
                          📍 위치 선택됨
                        </span>
                      ) : (
                        '아직 선택된 위치가 없습니다.'
                      )}
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                      <Input
                        type="file"
                        id="photo"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={(e) => setPhoto(e.target.files[0])}
                        style={{
                          padding: '8px',
                          backgroundColor: '#f5f5f5',
                          color: '#333',
                          border: '1px solid #ddd',
                        }}
                      />
                    </div>

                    <div style={{ marginTop: '8px' }}>
                      <TextArea
                        id="reviewText"
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="이 장소의 추억 (노래 추천에 사용돼요!)"
                        style={{
                          backgroundColor: '#f5f5f5',
                          color: '#333',
                          border: '1px solid #ddd',
                        }}
                      />
                    </div>
                  </InputGroup>

                  <Button type="submit" disabled={loading}>
                    {loading ? '처리 중...' : '사진 업로드 & 노래 추천 받기'}
                  </Button>
                </form>
              </Card>
            </div>

            {/* 기억 카드 오버레이 */}
            {activeMemory && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 10,
                }}
              >
                <ResultBox>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <h3 style={{ margin: 0 }}>✨ 이번 순간의 기억 카드</h3>
                    <button
                      onClick={() => setActiveMemory(null)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        fontSize: '20px',
                        cursor: 'pointer',
                        lineHeight: 1,
                      }}
                      aria-label="닫기"
                    >
                      ×
                    </button>
                  </div>

                  <ResultLayout>
                    <div>
                      {activeMemory.photoUrl && (
                        <PhotoPreview
                          src={activeMemory.photoUrl}
                          alt="업로드한 사진"
                        />
                      )}
                    </div>

                    <ResultInfo>
                      <p>
                        <strong>나의 이야기</strong>
                        <br />
                        {activeMemory.reviewText}
                      </p>

                      {activeMemory.trackId && (
                        <>
                          <p>
                            <strong>추천된 곡</strong>
                            <br />
                            Spotify Track ID:&nbsp;
                            {getCleanTrackId(activeMemory.trackId)}
                          </p>

                          <SpotifyPlayer
                            src={`https://open.spotify.com/embed/track/${getCleanTrackId(
                              activeMemory.trackId
                            )}`}
                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                            loading="lazy"
                          />

                          <p
                            style={{
                              fontSize: '12px',
                              marginTop: '4px',
                            }}
                          >
                            또는&nbsp;
                            <a
                              href={`https://open.spotify.com/track/${getCleanTrackId(
                                activeMemory.trackId
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Spotify에서 트랙 전체 보기
                            </a>
                          </p>
                        </>
                      )}
                    </ResultInfo>
                  </ResultLayout>
                </ResultBox>
              </div>
            )}
          </div>
        </Sidebar>

        {/* ===== 오른쪽 Google 지도 ===== */}
        <MapWrapper>
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={location}
            zoom={13}
            onLoad={(map) => (mapRef.current = map)}
            options={{
              fullscreenControl: false,
              mapTypeControl: false,
              streetViewControl: false,
            }}
          >
            {markers.map((m) => (
              <Marker
                key={m.id}
                position={{ lat: m.lat, lng: m.lng }}
                onClick={() => {
                  setActiveMemory(m);
                }}
                draggable={true}
                onDragEnd={async (e) => {
                  const newLat = e.latLng.lat();
                  const newLng = e.latLng.lng();

                  setMarkers((prev) =>
                    prev.map((pm) =>
                      pm.id === m.id ? { ...pm, lat: newLat, lng: newLng } : pm
                    )
                  );

                  setActiveMemory((prev) =>
                    prev && prev.id === m.id
                      ? { ...prev, lat: newLat, lng: newLng }
                      : prev
                  );

                  try {
                    const token = localStorage.getItem(
                      'spotify_access_token'
                    );
                    await axios.patch(
                      `${BASE_URL}/photos/${m.id}`,
                      { latitude: newLat, longitude: newLng },
                      {
                        headers: token
                          ? { Authorization: `Bearer ${token}` }
                          : undefined,
                      }
                    );
                    console.log('Marker position updated on server');
                  } catch (err) {
                    console.error(
                      'Failed to persist marker position:',
                      err.response?.data || err.message
                    );
                    alert(
                      '마커 위치 저장에 실패했습니다. 네트워크를 확인하세요.'
                    );
                  }
                }}
              />
            ))}

            {currentLocation && (
              <Marker
                position={currentLocation}
                title="현재 위치"
                icon={{
                  url: "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Ccircle cx='12' cy='12' r='8' fill='%231E88E5' stroke='white' stroke-width='3'/%3E%3C/svg%3E",
                  scaledSize: { width: 24, height: 24 },
                }}
              />
            )}
          </GoogleMap>

          <LocateButton onClick={handleLocateMe}>내 위치</LocateButton>
        </MapWrapper>
      </LoadScript>
    </Layout>
  );
}

export default App;
