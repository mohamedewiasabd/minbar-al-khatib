import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext';
import { AdMobProvider } from './context/AdMobContext';
import { PointsProvider } from './context/PointsContext';
import './index.css';

// دعم العمل دون اتصال على الويب (يُسجَّل في الإنتاج فقط، وفي Capacitor تُحمّل الأصول محلياً أصلاً)
if ('serviceWorker' in navigator && import.meta.env.PROD && window.location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // فشل التسجيل لا يؤثر على عمل التطبيق
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AdMobProvider>
      <AuthProvider>
        <PointsProvider>
          <App />
        </PointsProvider>
      </AuthProvider>
    </AdMobProvider>
  </StrictMode>,
);

