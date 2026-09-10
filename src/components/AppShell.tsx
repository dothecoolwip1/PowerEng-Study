import { BookOpen, Gauge, Home, Search, Sigma, Settings } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { seedOfflineDatabase } from '../services/content';
import { useStudyStore } from '../store/useStudyStore';
import { UpdatePrompt } from './UpdatePrompt';
export function AppShell(){
  const theme=useStudyStore(s=>s.theme); const [online,setOnline]=useState(navigator.onLine); const [seed,setSeed]=useState<string>('');
  useEffect(()=>{const apply=()=>{const dark=theme==='dark'||(theme==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=dark?'dark':'light';};apply();},[theme]);
  useEffect(()=>{const a=()=>setOnline(true),b=()=>setOnline(false);addEventListener('online',a);addEventListener('offline',b);return()=>{removeEventListener('online',a);removeEventListener('offline',b);};},[]);
  useEffect(()=>{const id=window.setTimeout(()=>seedOfflineDatabase((d,t)=>setSeed(`Preparing offline textbook ${d}/${t}`)).then(()=>setSeed('')).catch(()=>setSeed('Offline data setup needs attention.')),250);return()=>clearTimeout(id);},[]);
  const nav=[['/','Home',Home],['/learn','Learn',BookOpen],['/practice','Practice',Gauge],['/reference/formulas','Formulas',Sigma],['/reference/search','Search',Search]] as const;
  return <div className="app-shell">
    <header className="topbar"><div><strong>POWER STUDY</strong><small>Fourth Class • Part A</small></div><div className="top-actions"><span className={online?'online':'offline'}>{online?'Online':'Offline'}</span><NavLink aria-label="Settings" to="/settings"><Settings size={21}/></NavLink></div></header>
    {seed&&<div className="seed-banner">{seed}</div>}
    <main className="page"><Outlet/></main>
    <UpdatePrompt/>
    <nav className="bottom-nav" aria-label="Primary navigation">{nav.map(([to,label,Icon])=><NavLink key={to} to={to} end={to==='/'}><Icon size={21}/><span>{label}</span></NavLink>)}</nav>
  </div>;
}
