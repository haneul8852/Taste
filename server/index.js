// C:\project\Taste\server\index.js (수정 완료)

require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const querystring = require('querystring');
const multer = require('multer');
const path = require('path');
const upload = multer({ storage: multer.memoryStorage() }); 
// 파일 상단 근처 어딘가에 이미 추가했다면 중복 X, 안 했다면 추가
const STORAGE_BUCKET = 'memories';   // Supabase Storage 버킷 이름

const app = express();
const PORT = process.env.PORT || 5000;
// --- 환경 변수 및 상수 ---
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;

// 🚨🚨🚨 임시 디버그 코드: CLIENT_SECRET의 첫 4글자만 표시하여 로드 확인
console.log(`CLIENT_ID Loaded: ${CLIENT_ID ? 'OK' : 'FAIL'}`);
console.log(`CLIENT_SECRET Loaded: ${CLIENT_SECRET ? 'OK (' + CLIENT_SECRET.substring(0, 4) + '...)' : 'FAIL'}`);

// 🟢 수정 완료: Spotify 공식 인증 및 API URL 사용
const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_USER_PROFILE_URL = 'https://api.spotify.com/v1/me';
const SPOTIFY_SEARCH_URL = 'https://api.spotify.com/v1/search';
const SPOTIFY_SCOPE = 'user-read-private user-read-email playlist-modify-public playlist-modify-private user-library-read user-library-modify streaming';

// --- Supabase 클라이언트 초기화 ---
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// --- 미들웨어 설정 ---
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'] })); 
app.use(express.json());

// CSRF 방지용 랜덤 문자열 생성 함수
const generateRandomString = (length) => {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

// Spotify 사용자 프로필 정보를 가져오는 함수
const getSpotifyUserProfile = async (accessToken) => {
    try {
        const response = await axios.get(SPOTIFY_USER_PROFILE_URL, {
            headers: { 'Authorization': 'Bearer ' + accessToken },
        });
        return response.data;
    } catch (error) {
        console.error("Spotify Profile Fetch Error:", error.message);
        return null;
    }
};

// 노래 추천 로직 함수 (구현된 DB 테이블에 맞게 수정 필요)
const recommendSong = async (reviewText, accessToken) => {
    // 항상 재생 가능한 기본 트랙 (검색 실패 / 403 대비용)
    const FALLBACK_TRACK_ID = '2GMKQPMXdOGXsQkDYBN6wF';

    // 토큰이 없으면 바로 기본곡 반환
    if (!accessToken) {
        console.warn('recommendSong: no access token, using fallback track.');
        return FALLBACK_TRACK_ID;
    }

    // 1) 리뷰 텍스트 정리
    const cleaned = (reviewText || '').trim();

    // 텍스트가 너무 짧으면 기본 검색어 사용
    const query =
        cleaned.length >= 2
            ? cleaned                      // 사용자가 쓴 감정 문장 그대로 사용
            : 'korean mood playlist';      // 아주 짧을 때 fallback 검색어

    try {
        const response = await axios.get(SPOTIFY_SEARCH_URL, {
            headers: { Authorization: 'Bearer ' + accessToken },
            params: {
                q: query,
                type: 'track',
                limit: 1,
                market: 'KR',  // 한국 기준 추천 원하면 유지, 아니면 지워도 됨
            },
        });

        const items = response.data?.tracks?.items || [];
        if (items.length > 0) {
            const track = items[0];
            console.log('🎧 Spotify auto recommendation:', query, '->', track.name, track.id);
            return track.id;
        }
    } catch (error) {
        if (error.response) {
            console.error(
                'Song Recommendation Error:',
                error.response.status,
                error.response.data
            );
        } else {
            console.error('Song Recommendation Error:', error.message);
        }
    }

    // 검색 실패/403 나면 이 기본 트랙 사용
    return FALLBACK_TRACK_ID;
};

// --- API 라우트: 기본 테스트 ---
app.get('/', (req, res) => {
    res.send('Memory Map API Server Running!');
});

// --- API 라우트: 1. Spotify 로그인 시작 ---
app.get('/login/spotify', (req, res) => {
    const state = generateRandomString(16);

    res.redirect(SPOTIFY_AUTH_URL + '?' +
        querystring.stringify({
            response_type: 'code',
            client_id: CLIENT_ID,
            scope: SPOTIFY_SCOPE,
            redirect_uri: REDIRECT_URI,
            state: state 
        }));
});

// --- API 라우트: 2. 콜백 및 토큰 교환 (인증) ---
// --- API 라우트: 2. 콜백 및 토큰 교환 (인증) ---
app.get('/callback', async (req, res) => {
    const code = req.query.code || null;
    
    if (!code) {
        return res.redirect(
            'http://localhost:5173/callback?' +
            querystring.stringify({ error: 'no_code' })
        );
    }

    try {
        // 1) 토큰 교환
        const response = await axios({
            method: 'post',
            url: SPOTIFY_TOKEN_URL,
            data: querystring.stringify({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: REDIRECT_URI
            }),
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                Authorization: 'Basic ' + (Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')),
            },
        });

        const { access_token, refresh_token } = response.data;

        let spotify_id = null;

        // 2) 프로필 조회 시도 (실패해도 앱은 계속 진행)
        try {
            const profile = await getSpotifyUserProfile(access_token);
            if (profile && profile.id) {
                spotify_id = profile.id;

                // 선택: 프로필 성공일 때만 DB upsert
                const { error } = await supabase
                    .from('users')
                    .upsert(
                        {
                            spotify_id,
                            access_token,
                            refresh_token,
                        },
                        { onConflict: 'spotify_id' }
                    )
                    .select();
                if (error) {
                    console.error('Supabase upsert error:', error);
                }
            }
        } catch (profileErr) {
            // 여기서 403 등 자세한 내용 로그
            if (profileErr.response) {
                console.error(
                    'Spotify Profile Fetch Error:',
                    profileErr.response.status,
                    profileErr.response.data
                );
            } else {
                console.error('Spotify Profile Fetch Error:', profileErr.message);
            }
            // spotify_id 는 null 그대로 두고 진행
        }

        // 3) 프론트로 토큰과(가능하면) spotify_id 전달
        return res.redirect(
            'http://localhost:5173/callback?' +
            querystring.stringify({
                success: true,
                access_token,
                // spotify_id가 없으면 프론트에서 임시 ID를 만들게 둔다
                spotify_id: spotify_id || '',
            })
        );

    } catch (error) {
        console.error(
            'Token Exchange Error:',
            error.response ? error.response.data : error.message
        );
        return res.redirect(
            'http://localhost:5173/callback?' +
            querystring.stringify({ error: 'token_exchange_failed' })
        );
    }
});
// --- API 라우트: 3. 사진 업로드 및 노래 추천 (/upload) ---
app.post('/upload', upload.single('photo'), async (req, res) => {
    // 폼데이터에서 값 꺼내오기
    const userId = req.body.user_id;                    // 프론트에서 append('user_id', spotifyId)
    const { review_text, latitude, longitude } = req.body; // 🔥 여기가 핵심! review_text 선언
    const photoFile = req.file;

    // (선택) 입력값 간단 검증
    if (!userId || !review_text || !latitude || !longitude || !photoFile) {
        return res.status(400).send({ error: 'Missing required fields.' });
    }

    try {
        // 1. Authorization 헤더에서 Spotify access token 꺼내기
        const authHeader = req.headers.authorization;
        const accessToken = authHeader ? authHeader.split(' ')[1] : null;

        // 2. 노래 추천 실행 (실패 시 내부에서 fallback track 사용)
        const recommendedTrackId = await recommendSong(review_text, accessToken);

        // 3. Supabase Storage 에 사진 업로드
        // 🔐 원본 파일 이름에 한글/특수문자가 들어가도 안전하게 처리
        const ext = path.extname(photoFile.originalname || '').toLowerCase() || '.jpg';
        const safeFileName = `${userId}/${Date.now()}${ext}`;   // 예: local_user_123/1764...1234.jpg

        const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(safeFileName, photoFile.buffer, { contentType: photoFile.mimetype });

        if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        throw uploadError;
        }

        // 4. 업로드한 파일의 공개 URL 얻기
        const { data: publicUrlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(safeFileName);

        const photoUrl = publicUrlData.publicUrl;

        // 5. DB photos 테이블에 레코드 저장
        const { error: dbError } = await supabase
            .from('photos') // 이건 테이블 이름이므로 기존처럼 'photos' 가 맞아요.
            .insert({
                user_id: userId,
                photo_url: photoUrl,
                review_text: review_text,          // 혹은 그냥 review_text,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                spotify_track_id: recommendedTrackId
            });

        if (dbError) {
            console.error('Supabase DB error:', dbError);
            throw dbError;
        }

        // 6. 프론트로 성공 응답
        res.status(201).send({
            message: 'Upload successful, recommendation complete!',
            photoUrl,
            trackId: recommendedTrackId
        });

    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).send({ error: 'Failed to process upload and save data.' });
    }
});
// --- API 라우트: 4. 특정 유저의 저장된 위치/사진 목록 조회 ---
app.get('/photos', async (req, res) => {
    const userId = req.query.user_id;

    if (!userId) {
        return res.status(400).send({ error: 'user_id query parameter is required.' });
    }

    try {
        const { data, error } = await supabase
            .from('photos')
            .select('id, latitude, longitude, photo_url, review_text, spotify_track_id, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase fetch photos error:', error);
            return res.status(500).send({ error: 'Failed to fetch photos.' });
        }

        res.send({ photos: data });
    } catch (err) {
        console.error('Photos API error:', err);
        res.status(500).send({ error: 'Unexpected error while fetching photos.' });
    }
});
// --- 서버 실행 ---
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// --- API 라우트: 5. 사진 위치 업데이트 (위도/경도 수정)
app.patch('/photos/:id', async (req, res) => {
    const id = req.params.id;
    const { latitude, longitude } = req.body;

    if (!id) return res.status(400).send({ error: 'Photo id is required.' });
    if (latitude === undefined || longitude === undefined) {
        return res.status(400).send({ error: 'latitude and longitude are required in body.' });
    }

    try {
        const { data, error } = await supabase
            .from('photos')
            .update({ latitude: parseFloat(latitude), longitude: parseFloat(longitude) })
            .eq('id', id)
            .select();

        if (error) {
            console.error('Supabase update photo error:', error);
            return res.status(500).send({ error: 'Failed to update photo location.' });
        }

        res.send({ photo: data && data[0] });
    } catch (err) {
        console.error('Photos update API error:', err);
        res.status(500).send({ error: 'Unexpected error while updating photo location.' });
    }
});