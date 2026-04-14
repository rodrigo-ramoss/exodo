import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { BibleVersionProvider } from './state/BibleVersionContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BibleVersionProvider>
      <App />
    </BibleVersionProvider>
  </StrictMode>,
);
