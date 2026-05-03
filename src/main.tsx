import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.scss';
import { initToolbar } from '@stagewise/toolbar';

if (process.env.NODE_ENV === 'development') {
  // 显式初始化工具栏，避免只 import 但未真正挂载
  initToolbar({ plugins: [] });
}

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);