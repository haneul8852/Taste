const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');
const querystring = require('querystring');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

dotenv.config();

// OpenAI는 API 키가 있을 때만 초기화
let openai = null;
if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    console.log('✓ OpenAI API 사용 가능 - AI 감정 분석 기반 노래 추천');
} else {
    console.log('⚠ OpenAI API 키 없음 - 기본 검색으로 노래 추천');
}

const app = express();
const PORT = 5000;

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;

// 1. Spotify 로그인
app.get('/login/spotify', (req, res) => {
    const scope = 'user-read-private user-read-email streaming user-read-playback-state user-modify-playback-state';
    const queryParams = querystring.stringify({
        response_type: 'code',
        client_id: CLIENT_ID,
        scope: scope,
        redirect_uri: REDIRECT_URI,
    });
    res.redirect(`https://accounts.spotify.com/authorize?${queryParams}`);
});

app.get('/callback', async (req, res) => {
    const code = req.query.code || null;
    if (!code) return res.send('로그인 실패');

    try {
        const tokenResponse = await axios({
            method: 'post',
            url: 'https://accounts.spotify.com/api/token',
            data: querystring.stringify({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: REDIRECT_URI
            }),
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`
            }
        });

        const { access_token, refresh_token } = tokenResponse.data;
        const userResponse = await axios.get('https://api.spotify.com/v1/me', {
            headers: { Authorization: `Bearer ${access_token}` }
        });
        const spotifyUser = userResponse.data;

        await supabase.from('users').upsert({
            spotify_id: spotifyUser.id,
            display_name: spotifyUser.display_name,
            refresh_token: refresh_token,
        }, { onConflict: 'spotify_id' });

        res.redirect(`http://localhost:5173?access_token=${access_token}&spotify_id=${spotifyUser.id}`);

    } catch (error) {
        console.error(error);
        res.send('에러 발생');
    }
});

// 2. 추억 업로드 + [NEW] 노래 추천 로직
app.post('/photos', upload.single('photo'), async (req, res) => {
    const file = req.file;
    const { user_id, review_text, lat, lng, is_public } = req.body;
    // 프론트에서 보낸 토큰 받기 (노래 검색용)
    const accessToken = req.headers.authorization?.split(' ')[1];

    if (!file) return res.status(400).send('사진이 없습니다.');

    try {
        // (1) 이미지 업로드
        const fileName = `${Date.now()}_${file.originalname}`;
        const { error: uploadError } = await supabase.storage
            .from('memories')
            .upload(fileName, file.buffer, { contentType: file.mimetype });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('memories')
            .getPublicUrl(fileName);

        // (2) [NEW] AI 감정 분석 기반 Spotify 노래 검색
        let spotifyTrackId = null;
        if (review_text && accessToken) {
            try {
                let searchQuery = review_text;

                // OpenAI를 사용한 감정 분석 및 노래 추천
                if (openai) {
                    try {
                        console.log(`Analyzing emotion for: ${review_text}`);
                        const completion = await openai.chat.completions.create({
                            model: "gpt-4o-mini",
                            messages: [
                                {
                                    role: "system",
                                    content: "당신은 사용자의 추억과 감정을 분석하여 어울리는 노래를 추천하는 전문가입니다. 사용자의 추억 내용을 읽고, 그 순간의 감정과 분위기를 파악한 뒤, Spotify에서 검색할 최적의 검색어를 제안해주세요. 검색어는 '장르 + 분위기 + 키워드' 형식으로 간단하게 작성해주세요. 예: 'upbeat pop summer', 'melancholic indie rain', 'energetic rock party'"
                                },
                                {
                                    role: "user",
                                    content: `다음 추억 내용을 분석하여 Spotify 검색에 최적화된 영어 검색어를 제시해주세요:\n\n"${review_text}"\n\n검색어만 답변해주세요.`
                                }
                            ],
                            max_tokens: 50,
                            temperature: 0.7
                        });

                        searchQuery = completion.choices[0]?.message?.content?.trim() || review_text;
                        console.log(`AI suggested search query: ${searchQuery}`);
                    } catch (aiErr) {
                        console.error("OpenAI Analysis Failed:", aiErr.message);
                        // AI 실패 시 원본 텍스트 사용
                    }
                }

                // Spotify 검색
                console.log(`Searching Spotify for: ${searchQuery}`);
                const searchRes = await axios.get('https://api.spotify.com/v1/search', {
                    params: {
                        q: searchQuery,
                        type: 'track',
                        limit: 1
                    },
                    headers: { Authorization: `Bearer ${accessToken}` }
                });

                const track = searchRes.data.tracks.items[0];
                if (track) {
                    spotifyTrackId = track.id;
                    console.log(`Recommended Song: ${track.name} by ${track.artists[0].name} (${track.id})`);
                }
            } catch (searchErr) {
                console.error("Spotify Search Failed:", searchErr.message);
                // 노래 추천 실패해도 저장은 계속 진행
            }
        }

        // (3) DB 저장 (노래 ID 포함)
        const { data, error } = await supabase
            .from('photos')
            .insert([{
                user_id: user_id,
                photo_url: publicUrl,
                review_text: review_text,
                latitude: parseFloat(lat),
                longitude: parseFloat(lng),
                spotify_track_id: spotifyTrackId, // 추천된 노래 ID 저장
                is_public: is_public === 'true' || is_public === true // 공개 여부
            }])
            .select();

        if (error) throw error;

        res.json({ success: true, data });

    } catch (error) {
        console.error('업로드 실패:', error);
        res.status(500).send('업로드 중 에러 발생');
    }
});

// 3. 목록 가져오기 (사용자별 필터링)
app.get('/locations', async (req, res) => {
    const userId = req.query.user_id;
    const viewMode = req.query.view_mode || 'my'; // 'my' | 'public' | 'all'

    let query = supabase.from('photos').select('*');

    if (viewMode === 'my' && userId) {
        // 내 추억만
        query = query.eq('user_id', userId);
    } else if (viewMode === 'public') {
        // 공개된 추억만
        query = query.eq('is_public', true);
    }
    // 'all'이면 필터 없음 (관리자용)

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) return res.status(500).send(error);
    res.json(data);
});

// 4. 추억 수정
app.put('/photos/:id', async (req, res) => {
    const { id } = req.params;
    const { review_text, is_public, user_id } = req.body;

    // 본인 확인
    const { data: existing } = await supabase
        .from('photos')
        .select('user_id')
        .eq('id', id)
        .single();

    if (existing?.user_id !== user_id) {
        return res.status(403).json({ error: '권한이 없습니다.' });
    }

    const { data, error } = await supabase
        .from('photos')
        .update({ review_text, is_public })
        .eq('id', id)
        .select();

    if (error) return res.status(500).send(error);
    res.json(data);
});

// 5. 추억 삭제
app.delete('/photos/:id', async (req, res) => {
    const { id } = req.params;
    const { user_id } = req.query;

    // 본인 확인
    const { data: existing } = await supabase
        .from('photos')
        .select('user_id, photo_url')
        .eq('id', id)
        .single();

    if (existing?.user_id !== user_id) {
        return res.status(403).json({ error: '권한이 없습니다.' });
    }

    // 사진 파일도 삭제
    if (existing.photo_url) {
        const fileName = existing.photo_url.split('/').pop();
        await supabase.storage.from('memories').remove([fileName]);
    }

    const { error } = await supabase
        .from('photos')
        .delete()
        .eq('id', id);

    if (error) return res.status(500).send(error);
    res.json({ success: true });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));