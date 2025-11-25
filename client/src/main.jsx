import React from 'react';
import ReactDOM from 'react-dom/client';
// 🚨 react-router-dom 추가
import { BrowserRouter, Routes, Route } from 'react-router-dom'; 
import App from './App.jsx';
import CallbackPage from './CallbackPage.jsx'; // 👈 새 파일 import
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* BrowserRouter로 전체 앱을 감싸 라우팅 활성화 */}
    <BrowserRouter>
      <Routes>
        {/* 메인 기능 컴포넌트 */}
        <Route path="/" element={<App />} /> 
        {/* Spotify 콜백 처리 컴포넌트 */}
        <Route path="/callback" element={<CallbackPage />} /> 
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);