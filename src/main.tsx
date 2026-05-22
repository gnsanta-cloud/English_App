import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initStandaloneMode } from './utils/pwaStandalone';
import './index.css';

initStandaloneMode();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
