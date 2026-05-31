import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './screens.css';
import { AppProvider } from './state/store';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
);
