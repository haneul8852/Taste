# 🎵 추억 재생 지도 - 배포 가이드

## 🎉 완성된 기능

### ✅ 핵심 기능
1. **Spotify 로그인 연동**
2. **지도에 추억 마킹 및 저장**
3. **사진 업로드 (Supabase Storage)**
4. **AI 감정 분석 기반 노래 추천** (OpenAI + Spotify)
5. **사용자별 추억 필터링**
6. **추억 삭제 기능**
7. **추억 공개/비공개 설정**
8. **공개 추억 탐색 모드**
9. **모바일 반응형 디자인**
10. **추억 리스트 보기 및 지도 이동**

---

## 📋 배포 전 체크리스트

### 1. Supabase 데이터베이스 설정

#### `photos` 테이블에 컬럼 추가 필요:
```sql
-- is_public 컬럼이 없다면 추가
ALTER TABLE photos ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_photos_user_id ON photos(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_is_public ON photos(is_public);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at DESC);
```

### 2. 필요한 패키지 설치

#### 서버:
```bash
cd server
npm install openai
```

#### 클라이언트:
```bash
cd client
# 이미 모든 패키지가 설치되어 있습니다
npm install
```

### 3. 환경 변수 설정

#### **서버 `.env`** (server/.env)
```env
# Spotify API
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:5173

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# OpenAI (선택사항 - 없으면 기본 검색 사용)
OPENAI_API_KEY=your_openai_api_key

# CORS (배포 시 변경)
ALLOWED_ORIGIN=http://localhost:5173
```

#### **클라이언트 `.env`** (client/.env)
```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VITE_API_URL=http://localhost:5000
```

---

## 🚀 로컬 실행

### 1. 서버 실행
```bash
cd server
npm install
node index.js
# 또는 nodemon index.js
```
→ `http://localhost:5000` 에서 실행됨

### 2. 클라이언트 실행
```bash
cd client
npm install
npm run dev
```
→ `http://localhost:5173` 에서 실행됨

### 3. 브라우저에서 접속
- `http://localhost:5173` 열기
- "Spotify로 시작하기" 버튼 클릭
- Spotify 로그인 후 추억 남기기!

---

## 🌐 배포 가이드

### 프론트엔드 배포 (Vercel 추천)

1. **GitHub에 푸시**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Vercel 배포**
   - https://vercel.com 접속
   - "New Project" → GitHub 저장소 연결
   - Root Directory: `client` 선택
   - 환경 변수 설정:
     - `VITE_GOOGLE_MAPS_API_KEY`
     - `VITE_API_URL` (배포된 백엔드 URL)

3. **Deploy 버튼 클릭!**

### 백엔드 배포 (Railway 추천)

1. **Railway 배포**
   - https://railway.app 접속
   - "New Project" → "Deploy from GitHub repo"
   - Root Directory: `server` 선택

2. **환경 변수 설정** (Railway 대시보드에서):
   ```
   SPOTIFY_CLIENT_ID=...
   SPOTIFY_CLIENT_SECRET=...
   SPOTIFY_REDIRECT_URI=https://your-frontend-url.vercel.app
   SUPABASE_URL=...
   SUPABASE_KEY=...
   OPENAI_API_KEY=... (선택)
   ```

3. **Start Command 설정**:
   ```
   node index.js
   ```

4. **Deploy!**

### 배포 후 추가 설정

#### Spotify Developer Console
1. https://developer.spotify.com/dashboard 접속
2. 앱 설정 → "Redirect URIs"
3. 배포된 프론트엔드 URL 추가:
   ```
   https://your-app.vercel.app
   ```

#### CORS 설정 (서버)
`server/index.js`에서 CORS 설정 업데이트:
```javascript
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'https://your-app.vercel.app',
  credentials: true
}));
```

---

## 🎯 사용 방법

### 1. 추억 남기기
1. 지도에서 위치 클릭 또는 검색
2. 사진 업로드 (선택)
3. 추억 이야기 작성
4. 공개 설정 선택
5. "저장하기" 클릭
6. AI가 감정을 분석하여 어울리는 노래 추천!

### 2. 추억 보기
- **내 추억**: 나만의 추억 보기
- **둘러보기**: 다른 사람들의 공개 추억 탐색

### 3. 추억 관리
- 리스트에서 항목 클릭 → 지도에서 해당 위치로 이동
- 🗑️ 버튼으로 추억 삭제

---

## 🔧 기술 스택

### 프론트엔드
- React + Vite
- Google Maps API
- Axios
- CSS-in-JS

### 백엔드
- Node.js + Express
- Supabase (데이터베이스 + Storage)
- Spotify API
- OpenAI API (GPT-4o-mini)
- Multer (파일 업로드)

---

## 📊 데이터베이스 스키마

### `users` 테이블
```sql
- spotify_id (VARCHAR, PRIMARY KEY)
- display_name (VARCHAR)
- refresh_token (VARCHAR)
- created_at (TIMESTAMP)
```

### `photos` 테이블
```sql
- id (UUID, PRIMARY KEY)
- user_id (VARCHAR, FOREIGN KEY)
- photo_url (TEXT)
- review_text (TEXT)
- latitude (FLOAT)
- longitude (FLOAT)
- spotify_track_id (VARCHAR)
- is_public (BOOLEAN, DEFAULT false)
- created_at (TIMESTAMP)
```

---

## 🐛 트러블슈팅

### Google Maps가 로드되지 않음
- API 키 확인
- 환경 변수 이름 확인 (`VITE_` 접두사)
- Billing 활성화 확인

### Spotify 로그인 실패
- Redirect URI 확인
- Client ID/Secret 확인
- 개발자 콘솔에서 앱 상태 확인

### OpenAI 노래 추천 안됨
- API 키 확인
- OpenAI API 크레딧 확인
- 없어도 기본 검색으로 작동함

### 추억이 안 보임
- 보기 모드 확인 (내 추억 / 둘러보기)
- 네트워크 탭에서 API 응답 확인
- Supabase 데이터베이스 확인

---

## 💰 예상 비용

### 무료 티어로 충분!
- **Vercel**: 무료 (Hobby plan)
- **Railway**: 무료 ($5 크레딧/월)
- **Supabase**: 무료 (500MB 저장소, 50,000 rows)
- **Google Maps**: 무료 ($200 크레딧/월)
- **Spotify API**: 무료
- **OpenAI**: 사용량 기반 (~$0.01/추억)

→ 소규모 사용자라면 월 $0~5 정도!

---

## 🎨 향후 개선 아이디어

- [ ] 추억 수정 기능
- [ ] 좋아요/댓글 기능
- [ ] 친구 시스템
- [ ] 추억 통계 (연도별, 장소별)
- [ ] 추억 백업/다운로드
- [ ] 다크모드 토글
- [ ] 다국어 지원
- [ ] PWA (모바일 앱처럼 설치)
- [ ] 추억 공유 링크
- [ ] 음악 재생 기능

---

## 📞 문의 & 기여

이슈나 개선사항이 있다면 GitHub Issues에 남겨주세요!

**즐거운 추억 재생 되세요! 🎵🗺️**
