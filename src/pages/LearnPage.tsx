import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getManifest } from '../services/content';
import type { StudyManifest } from '../types/models';
export function LearnPage(){
  const [m,setM]=useState<StudyManifest>(); const [open,setOpen]=useState<number>(1);
  useEffect(()=>{getManifest().then(setM)},[]);
  if(!m) return <div className="loading-card">Loading textbook structure…</div>;
  return <div className="stack"><div className="page-title"><p className="eyebrow">Learn</p><h1>Fourth Class • Part A</h1><p>{m.units.length} units • {m.units.reduce((n,u)=>n+u.chapters.length,0)} chapters • {m.textbook.pdfPageCount} PDF pages</p></div>
    {m.units.map(u=><section className="unit-card" key={u.id}><button className="unit-toggle" onClick={()=>setOpen(open===u.number?0:u.number)}><div><span>Unit A-{u.number}</span><strong>{u.title}</strong><small>PDF pages {u.startPdfPage}–{u.endPdfPage}</small></div>{open===u.number?<ChevronDown/>:<ChevronRight/>}</button>{open===u.number&&<div className="chapter-list">{u.chapters.map(c=><Link key={c.id} to={`/learn/${u.id}/${c.id}`}><div><span>Chapter {c.number}</span><strong>{c.title}</strong><small>{c.learningOutcome}</small></div><ChevronRight/></Link>)}</div>}</section>)}
  </div>;
}
