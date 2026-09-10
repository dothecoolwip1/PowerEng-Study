import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './app/App';
import './styles/app.css';
import './styles/study-pro.css';
import './styles/learn.css';
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><BrowserRouter basename={basename}><App/></BrowserRouter></React.StrictMode>);
