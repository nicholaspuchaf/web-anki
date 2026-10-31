import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import './style.css';
import { initializeTheme } from './features/theme/use-theme';
initializeTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
