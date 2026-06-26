import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// ReactDOM.createRoot() initialises React 18's concurrent renderer.
// It mounts the entire component tree into the #root div in index.html.
//
// React.StrictMode runs every component twice in development.
// This deliberately exposes bugs caused by impure renders or bad side effects.
// It has zero effect in production builds.

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
