import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext';
import { AdMobProvider } from './context/AdMobContext';
import { PointsProvider } from './context/PointsContext';
import './index.css';

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

