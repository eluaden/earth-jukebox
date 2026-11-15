import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

if (import.meta.env.DEV) {
  // Dev-only inspection hook (not in the production build).
  Promise.all([import('./state/store.js'), import('./state/live.js'), import('./state/controller.js')]).then(([s, l, c]) => {
    window.__ej = { store: s.useStore, live: l.live, controller: c.controller };
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
