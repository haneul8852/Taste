import { useEffect, useState, useRef } from 'react';
import axios from 'axios';

// 스타일 객체
const styles = {
  container: {
    position: 'fixed',
    top: 0, left: 0, width: '100%', height: '100vh',
    margin: 0, padding: 0,
    backgroundColor: '#121212', color: 'white',
    zIndex: 9999,
  },
  loginContainer: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    height: '100vh', width: '100%',
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
    color: 'white',
    position: 'fixed', top: 0, left: 0, zIndex: 10000,
  },
  loginTitle: {
    fontSize: '3.5rem',
    fontWeight: '900',
    background: 'linear-gradient(135deg, #1db954 0%, #1ed760 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '16px',
    letterSpacing: '-2px',
    textAlign: 'center',
  },
  loginSubtitle: {
    fontSize: '1.3rem',
    color: '#888',
    marginBottom: '56px',
    fontWeight: '300',
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#1db954', color: 'white', padding: '20px 60px',
    borderRadius: '500px', border: 'none', fontSize: '1.3rem', fontWeight: '800',
    cursor: 'pointer',
    boxShadow: '0 8px 32px rgba(29, 185, 84, 0.5)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: 'scale(1)',
  },
  loginButtonHover: {
    transform: 'scale(1.05) translateY(-2px)',
    boxShadow: '0 12px 40px rgba(29, 185, 84, 0.6)',
  },
  mapContainer: { width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 },
  mapElement: { width: '100%', height: '100%' },
  floatingPanel: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    width: '380px',
    backgroundColor: 'rgba(18, 18, 18, 0.98)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    padding: '24px',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    maxHeight: 'calc(100vh - 40px)',
    overflowY: 'auto',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  title: {
    margin: 0,
    fontSize: '1.6rem',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #fff 0%, #ccc 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    margin: 0,
    fontSize: '0.9rem',
    color: '#888',
    fontWeight: '400',
  },
  searchBox: {
    width: '100%',
    padding: '14px 16px',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    background: 'rgba(255, 255, 255, 0.05)',
    color: 'white',
    fontSize: '1rem',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease',
    outline: 'none',
  },
  locationButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '10px 20px',
    borderRadius: '24px',
    border: '1px solid rgba(29, 185, 84, 0.3)',
    background: 'rgba(29, 185, 84, 0.1)',
    color: '#1db954',
    fontSize: '0.9rem',
    fontWeight: '700',
    cursor: 'pointer',
    width: 'fit-content',
    alignSelf: 'flex-end',
    marginBottom: '12px',
    transition: 'all 0.2s ease',
  },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '10px' },
  label: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#aaa',
    letterSpacing: '0.3px',
    textTransform: 'uppercase',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    background: 'rgba(255, 255, 255, 0.04)',
    color: 'white',
    boxSizing: 'border-box',
    fontSize: '0.95rem',
    transition: 'all 0.2s ease',
    outline: 'none',
  },
  textArea: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    background: 'rgba(255, 255, 255, 0.04)',
    color: 'white',
    height: '90px',
    resize: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    fontSize: '0.95rem',
    transition: 'all 0.2s ease',
    outline: 'none',
  },
  uploadButton: {
    backgroundColor: '#1db954',
    color: 'white',
    padding: '14px 24px',
    borderRadius: '500px',
    border: 'none',
    fontWeight: '800',
    fontSize: '1rem',
    cursor: 'pointer',
    width: '100%',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 12px rgba(29, 185, 84, 0.3)',
  },
  uploadButtonDisabled: { backgroundColor: '#535353', color: '#b3b3b3', cursor: 'not-allowed' },
  divider: { height: '1px', backgroundColor: '#333', margin: '10px 0' },
  locationBadge: {
    display: 'inline-block', padding: '6px 12px', borderRadius: '20px',
    backgroundColor: 'rgba(29, 185, 84, 0.2)', color: '#1db954',
    fontSize: '0.85rem', fontWeight: 'bold', marginTop: '4px'
  },
  loadingOverlay: {
    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: '#121212', display: 'flex', justifyContent: 'center', alignItems: 'center',
    color: '#888', zIndex: 1
  },
  notification: {
    position: 'fixed',
    bottom: '30px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#1db954',
    color: 'white',
    padding: '14px 28px',
    borderRadius: '500px',
    fontWeight: '700',
    fontSize: '0.95rem',
    boxShadow: '0 8px 24px rgba(29, 185, 84, 0.4)',
    zIndex: 20000,
    animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  loadingSpinner: {
    display: 'inline-block',
    width: '18px',
    height: '18px',
    border: '3px solid rgba(255, 255, 255, 0.3)',
    borderTop: '3px solid white',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    marginRight: '10px',
  },
  listItem: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '12px', borderRadius: '8px', backgroundColor: '#2a2a2a',
    cursor: 'pointer', transition: 'background 0.2s',
    border: '1px solid #333'
  },
  listItemImg: {
    width: '50px', height: '50px', borderRadius: '6px', objectFit: 'cover', backgroundColor: '#444'
  },
  listItemContent: {
    display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden'
  },
  listItemText: {
    fontSize: '0.9rem', fontWeight: 'bold', color: 'white',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
  },
  listItemDate: {
    fontSize: '0.75rem', color: '#888', marginTop: '4px'
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '0.8rem',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'background 0.2s'
  },
  // 네비게이션 바
  navbar: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: '70px',
    background: 'rgba(10, 10, 10, 0.95)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 5%',
    zIndex: 1000,
    boxSizing: 'border-box',
  },
  navLogo: {
    fontSize: '1.5rem',
    fontWeight: '900',
    background: 'linear-gradient(135deg, #1db954 0%, #1ed760 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  navMenu: {
    display: 'flex',
    gap: '32px',
    alignItems: 'center',
  },
  navLink: {
    color: '#ccc',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'color 0.2s',
    textDecoration: 'none',
  },
  navLinkActive: {
    color: '#1db954',
  },
  landingContainer: {
    width: '100%',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
    color: 'white',
    overflowX: 'hidden',
  },
  heroSection: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '0 20px',
    position: 'relative',
  },
  howItWorksSection: {
    padding: '80px 20px',
    maxWidth: '900px',
    margin: '0 auto',
    color: '#ddd',
    lineHeight: 1.8,
    textAlign: 'center'
  },
  heroTitle: {
    fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
    fontWeight: '900',
    background: 'linear-gradient(135deg, #fff 0%, #1db954 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '24px',
    letterSpacing: '-2px',
    lineHeight: '1.1',
    maxWidth: '90%',
  },
  heroSubtitle: {
    fontSize: 'clamp(1rem, 3vw, 1.5rem)',
    color: '#999',
    marginBottom: '48px',
    fontWeight: '400',
    maxWidth: '90%',
    lineHeight: '1.6',
  },
  ctaButton: {
    backgroundColor: '#1db954',
    color: 'white',
    padding: '20px 60px',
    borderRadius: '500px',
    border: 'none',
    fontSize: '1.3rem',
    fontWeight: '800',
    cursor: 'pointer',
    boxShadow: '0 8px 32px rgba(29, 185, 84, 0.5)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  featuresSection: {
    padding: '100px 40px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  sectionTitle: {
    fontSize: '3rem',
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: '80px',
    background: 'linear-gradient(135deg, #fff 0%, #aaa 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '40px',
  },
  featureCard: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '20px',
    padding: '40px',
    transition: 'all 0.3s ease',
  },
  featureIcon: {
    fontSize: '3rem',
    marginBottom: '20px',
  },
  featureTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    marginBottom: '12px',
    color: '#fff',
  },
  featureDesc: {
    fontSize: '1rem',
    color: '#999',
    lineHeight: '1.6',
  },
  footer: {
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '40px',
    textAlign: 'center',
    color: '#666',
    fontSize: '0.9rem',
  },
};

// 환경 변수에서 API 키 가져오기
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'; 

const defaultCenter = { lat: 37.5665, lng: 126.9780 };

function App() {
  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [review, setReview] = useState("");
  const [file, setFile] = useState(null);
  const [locations, setLocations] = useState([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isPublic, setIsPublic] = useState(false);
  const [viewMode, setViewMode] = useState('my'); // 'my' | 'public'
  const [isUploading, setIsUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState('landing'); // 'landing' | 'map' | 'mypage'

  const mapRef = useRef(null);
  const googleMapObj = useRef(null);
  const markersRef = useRef([]);
  const searchInputRef = useRef(null);
  const currentInfoWindowRef = useRef(null);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflowX = 'hidden';
    document.body.style.overflowY = token ? 'hidden' : 'auto';

    const style = document.createElement('style');
    style.innerHTML = `
      .pac-container { z-index: 20000 !important; background-color: #2a2a2a; border: 1px solid #444; }
      .pac-item { border-top: 1px solid #444; color: #ccc; cursor: pointer; }
      .pac-item:hover { background-color: #333; }
      .pac-item-query { color: #fff; }
      
      /* ★★★ 지도 깨짐 방지 CSS 추가 (중요) ★★★ */
      .gm-style img {
        max-width: none !important;
        height: auto !important;
        border: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      /* 스크롤바 스타일 */
      ::-webkit-scrollbar { width: 8px; }
      ::-webkit-scrollbar-track { background: #181818; }
      ::-webkit-scrollbar-thumb { background: #444; border-radius: 4px; }
      ::-webkit-scrollbar-thumb:hover { background: #555; }

      /* 모바일 반응형 */
      @media (max-width: 768px) {
        .floating-panel {
          width: calc(100% - 40px) !important;
          left: 20px !important;
          right: 20px !important;
          max-height: 60vh !important;
        }
        .memory-list {
          max-height: 200px !important;
        }
      }

      @media (max-width: 480px) {
        .floating-panel {
          top: 10px !important;
          left: 10px !important;
          right: 10px !important;
          width: calc(100% - 20px) !important;
          padding: 15px !important;
          max-height: 70vh !important;
        }
      }

      /* 섹션 등장 애니메이션 */
      [data-animate] { opacity: 0; transform: translateY(24px); transition: all 600ms cubic-bezier(0.2,0.9,0.2,1); }
      [data-animate].in-view { opacity: 1; transform: translateY(0); }
    `;
    document.head.appendChild(style);

    return () => {
      document.body.style.margin = '';
      document.body.style.padding = '';
      document.body.style.overflowX = '';
      document.body.style.overflowY = '';
      document.head.removeChild(style);
    };
  }, [token]);

  // 섹션 애니메이션
  useEffect(() => {
    const els = document.querySelectorAll('[data-animate]');
    if (!els || els.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
        }
      });
    }, { threshold: 0.12 });

    els.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!token) return;

    const scriptId = 'google-map-script';
    
    if (document.getElementById(scriptId)) {
        if (window.google && window.google.maps && mapRef.current && !googleMapObj.current) {
            initMap();
        }
        return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      if (mapRef.current) {
        initMap();
        setIsMapLoaded(true);
      }
    };

    script.onerror = () => showNotification("구글 지도 로딩 실패. API 키를 확인하세요.");
    document.head.appendChild(script);
  }, [token]);

  const initMap = () => {
    if (!window.google) return;

    googleMapObj.current = new window.google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 13,
      disableDefaultUI: false,
      zoomControl: true,
      styles: [ { elementType: "geometry", stylers: [{ color: "#242f3e" }] } ]
    });

    if (searchInputRef.current) {
        const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current, {
            fields: ["geometry", "name"],
        });

        autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (!place.geometry || !place.geometry.location) {
                showNotification("장소를 찾을 수 없습니다.");
                return;
            }
            if (place.geometry.viewport) {
                googleMapObj.current.fitBounds(place.geometry.viewport);
            } else {
                googleMapObj.current.setCenter(place.geometry.location);
                googleMapObj.current.setZoom(17);
            }
            setSelectedLocation({
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng()
            });
        });
    }

    googleMapObj.current.addListener('click', (e) => {
      setSelectedLocation({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    });
    
    setIsMapLoaded(true);
  };

  const handleCurrentLocation = () => {
    if (!googleMapObj.current || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
            googleMapObj.current.setCenter(pos);
            googleMapObj.current.setZoom(16);
            new window.google.maps.Marker({
                position: pos, map: googleMapObj.current,
                icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 12, fillColor: "#4285F4", fillOpacity: 1, strokeWeight: 3, strokeColor: "white" }
            });
            setSelectedLocation(pos);
        },
        () => showNotification("위치 정보를 가져올 수 없습니다.")
    );
  };

  // 리스트 항목 클릭 시 이동
  const flyToLocation = (loc) => {
    if(!googleMapObj.current) return;

    const pos = { lat: loc.latitude, lng: loc.longitude };
    googleMapObj.current.setCenter(pos);
    googleMapObj.current.setZoom(16);

    const targetMarker = markersRef.current.find(marker => {
      const markerPos = marker.getPosition();
      return markerPos.lat() === loc.latitude && markerPos.lng() === loc.longitude;
    });
    if (targetMarker) {
      window.google.maps.event.trigger(targetMarker, 'click');
    }
  };

  // 추억 삭제
  const handleDeleteMemory = async (memoryId, e) => {
    e.stopPropagation();
    if (!window.confirm('정말로 이 추억을 삭제하시겠습니까?')) return;

    try {
      await axios.delete(`${API_URL}/photos/${memoryId}`, {
        params: { user_id: userId }
      });
      showNotification('추억이 삭제되었습니다.');
      fetchLocations();
    } catch (err) {
      console.error('삭제 실패:', err);
      showNotification('삭제 중 오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('access_token');
    const spotifyId = params.get('spotify_id');

    if (accessToken) {
      setToken(accessToken);
      setUserId(spotifyId);
      window.history.pushState({}, null, '/');
      fetchLocations();
    }
  }, []);

  const fetchLocations = async (mode = viewMode) => {
    try {
      const res = await axios.get(`${API_URL}/locations`, {
        params: {
          user_id: userId,
          view_mode: mode
        }
      });
      setLocations(res.data);
    } catch (err) {
      console.error("데이터 로드 실패:", err);
    }
  };

  // 마커 및 팝업 렌더링
  useEffect(() => {
    if (!googleMapObj.current || !window.google) return;
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    locations.forEach(loc => {
      const marker = new window.google.maps.Marker({
        position: { lat: loc.latitude, lng: loc.longitude },
        map: googleMapObj.current,
        icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: "#1db954",
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "white",
        },
        title: loc.review_text
      });
      
      const formatDate = (dateString) => {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}.${month}.${day}`;
      };

      const infoWindowContent = `
        <div style="color: black; padding: 10px; max-width: 310px; box-sizing: border-box; overflow: visible;">
            <h4 style="margin:0 0 4px 0; font-size:15px; font-weight:600; word-wrap: break-word;">${loc.review_text || '추억'}</h4>
            <p style="margin:0 0 10px 0; font-size:11px; color:#666;">📅 ${formatDate(loc.created_at)}</p>

            ${loc.photo_url ? `
                <div style="margin-bottom:10px; width:100%; height:160px; background-color:#eee; border-radius:8px; overflow:hidden; box-sizing: border-box;">
                    <img src="${loc.photo_url}" style="width:100%; height:100%; object-fit:cover; display:block;" />
                </div>
            ` : ''}

            ${loc.spotify_track_id ? `
                <div style="width:100%; height:80px; box-sizing: border-box; margin:0;">
                    <iframe 
                        src="https://open.spotify.com/embed/track/${loc.spotify_track_id}?utm_source=generator&theme=0" 
                        width="100%" 
                        height="80" 
                        frameborder="0" 
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                        loading="lazy"
                        style="border-radius:12px; display:block; border:none;"
                    ></iframe>
                </div>
            ` : '<p style="font-size:12px; color:#888; margin:0;">추천된 노래가 없습니다.</p>'}
        </div>
      `;

      const infoWindow = new window.google.maps.InfoWindow({
        content: infoWindowContent,
        maxWidth: 340,
        pixelOffset: new window.google.maps.Size(0, -10),
        disableAutoPan: false
      });

      marker.addListener('click', () => {
        if (currentInfoWindowRef.current) {
          currentInfoWindowRef.current.close();
        }
        infoWindow.open(googleMapObj.current, marker);
        currentInfoWindowRef.current = infoWindow;
        googleMapObj.current.panTo(marker.getPosition());
      });

      markersRef.current.push(marker);
    });
  }, [locations, isMapLoaded]);

  const selectedMarkerRef = useRef(null);
  useEffect(() => {
    if (!googleMapObj.current || !window.google) return;
    if (selectedMarkerRef.current) selectedMarkerRef.current.setMap(null);

    if (selectedLocation) {
        selectedMarkerRef.current = new window.google.maps.Marker({
            position: selectedLocation,
            map: googleMapObj.current,
            animation: window.google.maps.Animation.DROP,
            icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
        });
    }
  }, [selectedLocation]);

  const handleUpload = async () => {
    if (!selectedLocation || !review) {
        showNotification("위치와 내용을 입력해주세요!");
        return;
    }

    const formData = new FormData();
    if (file) formData.append('photo', file);
    formData.append('user_id', userId);
    formData.append('review_text', review);
    formData.append('lat', selectedLocation.lat);
    formData.append('lng', selectedLocation.lng);
    formData.append('is_public', isPublic);

    setIsUploading(true);
    try {
        await axios.post(`${API_URL}/photos`, formData, {
            headers: { 
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${token}` 
            }
        });
        showNotification("저장 완료! 🎵 노래를 찾았어요.");
        setReview("");
        setFile(null);
        setSelectedLocation(null);
        setIsPublic(false);
        fetchLocations();
    } catch (err) {
        console.error(err);
        showNotification("업로드 실패");
    } finally {
        setIsUploading(false);
    }
  };

  const [loginButtonHover, setLoginButtonHover] = useState(false);
  const [ctaButtonHover, setCtaButtonHover] = useState(false);

  if (!token) {
    return (
      <div style={styles.landingContainer}>
        {/* 네비게이션 바 */}
        <nav style={styles.navbar}>
          <div style={styles.navLogo}>
            🎵 Taste
          </div>
          <div style={styles.navMenu}>
            <a style={styles.navLink} href="#features">기능</a>
            <a style={styles.navLink} href="#how-it-works">사용방법</a>
            <button 
              style={{
                ...styles.loginButton, 
                padding: '12px 32px', 
                fontSize: '1rem',
                ...(loginButtonHover ? { transform: 'scale(1.05)' } : {})
              }}
              onMouseEnter={() => setLoginButtonHover(true)}
              onMouseLeave={() => setLoginButtonHover(false)}
              onClick={() => window.location.href = `${API_URL}/login/spotify`}
            >
              시작하기
            </button>
          </div>
        </nav>

        {/* 히어로 섹션 */}
        <section style={styles.heroSection} data-animate>
          <h1 style={styles.heroTitle}>
            당신의 추억에<br/>
            완벽한 노래를 찾아드립니다
          </h1>
          <p style={styles.heroSubtitle}>
            AI가 당신의 추억을 분석하고, Spotify에서 가장 어울리는 노래를 추천합니다.<br/>
            지도 위에 추억을 표시하고 언제든 다시 떠올려보세요.
          </p>
          <button 
            style={{
              ...styles.ctaButton,
              ...(ctaButtonHover ? { transform: 'scale(1.05) translateY(-2px)', boxShadow: '0 12px 40px rgba(29, 185, 84, 0.6)' } : {})
            }}
            onMouseEnter={() => setCtaButtonHover(true)}
            onMouseLeave={() => setCtaButtonHover(false)}
            onClick={() => window.location.href = `${API_URL}/login/spotify`}
          >
            🎧 Spotify로 시작하기
          </button>
        </section>

        <section id="how-it-works" style={styles.howItWorksSection} data-animate>
          <h2 style={{fontSize:'2rem', fontWeight:800, marginBottom:'20px', background: 'linear-gradient(135deg, #fff 0%, #aaa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>사용 방법</h2>
          <p>1) '시작하기'로 Spotify로 로그인하세요.<br/>2) 지도에서 위치를 선택하거나 검색해 추억을 입력하세요.<br/>3) 사진을 업로드하고 공개 여부를 설정한 뒤 저장합니다..</p>
        </section>

        <section id="features" style={styles.featuresSection} data-animate>
          <h2 style={styles.sectionTitle}>주요 기능</h2>
          <div style={styles.featuresGrid}>
            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>🗺️</div>
              <h3 style={styles.featureTitle}>지도 기반 추억 관리</h3>
              <p style={styles.featureDesc}>Google Maps를 이용해 정확한 위치에 추억을 저장하고, 언제든 지도에서 다시 찾아볼 수 있습니다.</p>
            </div>
            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>🤖</div>
              <h3 style={styles.featureTitle}>AI 감정 분석</h3>
              <p style={styles.featureDesc}>OpenAI GPT가 당신의 추억 내용을 분석하여, 그 순간의 감정과 분위기에 딱 맞는 노래를 찾아드립니다.</p>
            </div>
            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>🎵</div>
              <h3 style={styles.featureTitle}>Spotify 연동</h3>
              <p style={styles.featureDesc}>Spotify의 방대한 음악 라이브러리에서 추억에 어울리는 완벽한 노래를 추천받고, 바로 재생할 수 있습니다.</p>
            </div>
            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>📸</div>
              <h3 style={styles.featureTitle}>사진과 함께</h3>
              <p style={styles.featureDesc}>추억이 담긴 사진을 업로드하여 노래와 함께 저장하고, 나중에 다시 보며 그때의 감정을 되살릴 수 있습니다.</p>
            </div>
            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>🌍</div>
              <h3 style={styles.featureTitle}>공유 기능</h3>
              <p style={styles.featureDesc}>원하는 추억을 공개 설정하여 다른 사람들과 공유하거나, 다른 사람들의 추억을 둘러볼 수 있습니다.</p>
            </div>
            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>🔒</div>
              <h3 style={styles.featureTitle}>프라이버시 보호</h3>
              <p style={styles.featureDesc}>모든 추억은 기본적으로 비공개 설정되며, 본인만 확인하고 관리할 수 있습니다.</p>
            </div>
          </div>
        </section>

        <footer style={styles.footer}>
          <p>© 2025 추억 재생. All rights reserved.</p>
          <p style={{marginTop: '10px', fontSize: '0.8rem'}}>Powered by Spotify, Google Maps, OpenAI</p>
        </footer>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {notification && <div style={styles.notification}>{notification}</div>}

      <div style={styles.mapContainer}>
        <div ref={mapRef} style={styles.mapElement} /> 
        {!isMapLoaded && <div style={styles.loadingOverlay}>지도를 불러오는 중...</div>}
      </div>

      <div className="floating-panel" style={styles.floatingPanel}>
        <div style={{marginBottom: '10px'}}>
            <h3 style={styles.title}>🗺️ 추억 재생 지도</h3>
            <p style={styles.subtitle}>지도 클릭 또는 검색</p>
        </div>

        <div style={{display: 'flex', gap: '8px', marginBottom: '10px'}}>
          <button
            onClick={() => { setViewMode('my'); fetchLocations('my'); }}
            style={{
              flex: 1, padding: '10px', borderRadius: '8px',
              border: viewMode === 'my' ? '2px solid #1db954' : '1px solid #444',
              background: viewMode === 'my' ? 'rgba(29, 185, 84, 0.2)' : '#2a2a2a',
              color: viewMode === 'my' ? '#1db954' : '#999',
              cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem'
            }}
          >
            내 추억
          </button>
          <button
            onClick={() => { setViewMode('public'); fetchLocations('public'); }}
            style={{
              flex: 1, padding: '10px', borderRadius: '8px',
              border: viewMode === 'public' ? '2px solid #1db954' : '1px solid #444',
              background: viewMode === 'public' ? 'rgba(29, 185, 84, 0.2)' : '#2a2a2a',
              color: viewMode === 'public' ? '#1db954' : '#999',
              cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem'
            }}
          >
            둘러보기
          </button>
        </div>

        <input ref={searchInputRef} type="text" placeholder="장소 검색 (예: 강남역)" style={styles.searchBox} />
        <button onClick={handleCurrentLocation} style={styles.locationButton}><span>📍 내 위치 찾기</span></button>
        
        <div style={{backgroundColor: '#222', padding: '15px', borderRadius: '12px', marginBottom: '20px'}}>
            <div style={{minHeight: '20px', marginBottom: '10px', fontSize: '0.85rem', color: '#888'}}>
                {selectedLocation ? <span style={{color: '#1db954', fontWeight:'bold'}}>📍 위치 선택됨</span> : "아직 선택된 위치가 없습니다."}
            </div>

            <div style={styles.inputGroup}>
                <input type="file" onChange={(e) => setFile(e.target.files[0])} accept="image/*" style={styles.input} />
            </div>
            
            <div style={{...styles.inputGroup, marginTop:'8px'}}>
                <textarea placeholder="이 장소의 추억 (노래 추천에 사용돼요!)" value={review} onChange={(e) => setReview(e.target.value)} style={styles.textArea} />
            </div>

            <div style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 0'}}>
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                style={{width: '18px', height: '18px', cursor: 'pointer'}}
              />
              <label htmlFor="isPublic" style={{color: '#ddd', fontSize: '0.9rem', cursor: 'pointer'}}>
                🌍 이 추억을 다른 사람들과 공유하기
              </label>
            </div>

            <button 
                onClick={handleUpload} 
                disabled={!selectedLocation || isUploading}
                style={{...styles.uploadButton, ...(!selectedLocation || isUploading ? styles.uploadButtonDisabled : {})}}
            >
                {isUploading ? <><span style={styles.loadingSpinner}></span>업로드 중...</> : '💾 저장하기'}
            </button>
        </div>

        <div style={styles.divider}></div>
        
        <h4 style={{margin:'0 0 10px 0', color:'#ddd'}}>📂 {viewMode === 'my' ? '나의 추억 목록' : '공유된 추억들'} ({locations.length})</h4>
        <div className="memory-list" style={{display:'flex', flexDirection:'column', gap:'10px', maxHeight:'300px', overflowY:'auto'}}>
            {locations.map((loc) => (
                <div key={loc.id} style={styles.listItem} onClick={() => flyToLocation(loc)}>
                    {loc.photo_url ? (
                        <img src={loc.photo_url} style={styles.listItemImg} alt="memory" />
                    ) : (
                        <div style={styles.listItemImg}></div>
                    )}
                    <div style={styles.listItemContent}>
                        <div style={styles.listItemText}>{loc.review_text}</div>
                        <div style={styles.listItemDate}>{new Date(loc.created_at).toLocaleDateString()}</div>
                    </div>
                    {viewMode === 'my' && (
                        <button 
                          style={styles.deleteButton} 
                          onClick={(e) => handleDeleteMemory(loc.id, e)}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#c82333'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#dc3545'}
                        >
                          🗑️
                        </button>
                    )}
                </div>
            ))}
            {locations.length === 0 && <div style={{color:'#666', textAlign:'center', padding:'20px'}}>아직 기록된 추억이 없어요.</div>}
        </div>

      </div>
    </div>
  );
}

export default App;