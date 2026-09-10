import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getManifest } from '../services/content';
import type { StudyManifest } from '../types/models';
import { useStudyStore } from '../store/useStudyStore';

export function LearnPage(){
  const [manifest,setManifest]=useState<StudyManifest>();
  const [open,setOpen]=useState<number>(1);
  const lastChapterId=useStudyStore(state=>state.lastChapterId);

  useEffect(()=>{getManifest().then(data=>{setManifest(data);const current=data.units.find(unit=>unit.chapters.some(chapter=>chapter.id===lastChapterId));if(current)setOpen(current.number);});},[lastChapterId]);
  if(!manifest)return <div className="loading-card">Loading your course…</div>;

  return <div className="stack-lg learn-path-page">
    <div className="page-title"><p className="eyebrow">Learn</p><h1>Your course path</h1><p>Work through Fourth Class Power Engineering Part A by unit, chapter, and textbook objective.</p></div>
    <div className="course-overview-strip"><div><strong>{manifest.units.length}</strong><span>Units</span></div><div><strong>{manifest.units.reduce((sum,unit)=>sum+unit.chapters.length,0)}</strong><span>Chapters</span></div><div><strong>{manifest.textbook.pdfPageCount}</strong><span>Textbook pages</span></div></div>
    <div className="learn-unit-list">{manifest.units.map(unit=><section className={`unit-card learn-unit ${open===unit.number?'open':''}`} key={unit.id}>
      <button className="unit-toggle" onClick={()=>setOpen(open===unit.number?0:unit.number)}><div><span>Unit A-{unit.number}</span><strong>{unit.title}</strong><small>{unit.chapters.length} chapter{unit.chapters.length===1?'':'s'} • textbook pages {unit.startPdfPage} to {unit.endPdfPage}</small></div>{open===unit.number?<ChevronDown/>:<ChevronRight/>}</button>
      {open===unit.number&&<div className="chapter-list">{unit.chapters.map(chapter=><Link className={chapter.id===lastChapterId?'current-chapter':''} key={chapter.id} to={`/learn/${unit.id}/${chapter.id}`}><div><span>Chapter {chapter.number}{chapter.id===lastChapterId?' • Continue here':''}</span><strong>{chapter.title}</strong><small>{chapter.learningOutcome}</small></div><ChevronRight/></Link>)}</div>}
    </section>)}</div>
  </div>;
}
