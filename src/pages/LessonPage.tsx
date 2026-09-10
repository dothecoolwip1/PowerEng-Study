import { useEffect, useMemo, useState } from 'react';
import { Bookmark, CheckCircle2, ChevronDown, FileText } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { db } from '../db/db';
import { getCuratedData, getUnit } from '../services/content';
import type { Chapter, LessonEnhancement } from '../types/models';
import { SourceRef } from '../components/SourceRef';
import { useStudyStore } from '../store/useStudyStore';

export function LessonPage(){
  const {unitId,chapterId}=useParams(); const num=Number(unitId?.split('-')[1]);
  const [chapter,setChapter]=useState<Chapter>(); const [enh,setEnh]=useState<LessonEnhancement>(); const [open,setOpen]=useState<string>('intro'); const setLast=useStudyStore(s=>s.setLastChapterId);
  useEffect(()=>{if(!num||!chapterId)return; Promise.all([getUnit(num),getCuratedData()]).then(([u,c])=>{const ch=u.chapters.find(x=>x.id===chapterId);setChapter(ch);setEnh(c.lessonEnhancements[chapterId]);if(ch)setLast(ch.id);});},[num,chapterId,setLast]);
  const pages=useMemo(()=>chapter?.sourcePages ?? [],[chapter]);
  const [note,setNote]=useState('');
  useEffect(()=>{if(!chapterId)return;db.notes.where('targetId').equals(chapterId).first().then(n=>setNote(n?.text??''));},[chapterId]);
  if(!chapter) return <div className="loading-card">Loading lesson…</div>;
  const saveNote=async()=>{if(!chapter)return;const now=new Date().toISOString();await db.notes.put({id:`note:${chapter.id}`,targetType:'lesson',targetId:chapter.id,text:note,createdAt:now,updatedAt:now,syncStatus:'local'});};
  const bookmark=async()=>{await db.bookmarks.put({id:`chapter:${chapter.id}`,targetType:'lesson',targetId:chapter.id,title:chapter.title,createdAt:new Date().toISOString(),syncStatus:'local'});};
  return <div className="stack-lg">
    <div className="lesson-hero"><div><p className="eyebrow">Unit A-{num} • Chapter {chapter.number}</p><h1>{chapter.title}</h1><p>{chapter.learningOutcome}</p></div><button className="icon-button" onClick={bookmark} aria-label="Bookmark lesson"><Bookmark/></button></div>
    {enh&&<section className="study-block"><h2>Overview</h2><p>{enh.overview}</p></section>}
    <section className="study-block"><h2>Learning objectives</h2><ol>{chapter.learningObjectives.map(x=><li key={x}>{x.replace(/^\d+\.\s*/, '')}</li>)}</ol></section>
    {enh&&<div className="two-col"><section className="study-block accent"><h2>Key concepts</h2><ul>{enh.keyConcepts.map(x=><li key={x}>{x}</li>)}</ul></section><section className="study-block warn"><h2>Remember this</h2><ul>{enh.remember.map(x=><li key={x}>{x}</li>)}</ul></section></div>}
    <section><div className="section-head"><div><p className="eyebrow">Textbook material</p><h2>Study by objective</h2></div></div>{chapter.sections.map(s=><article className="accordion" key={s.id}><button onClick={()=>setOpen(open===s.id?'':s.id)}><div><span>{s.objectiveNumber?`Objective ${s.objectiveNumber}`:'Introduction'}</span><strong>{s.title}</strong><small>{s.sourcePages.length} source pages</small></div><ChevronDown className={open===s.id?'rot':''}/></button>{open===s.id&&<div className="accordion-body">{s.pages.map(p=><div className="source-page" key={p.pdfPage}><div className="source-page-head"><FileText size={17}/><strong>PDF page {p.pdfPage}</strong></div><div className="textbook-text">{p.text.split('\n').map((line,i)=><p key={i}>{line}</p>)}</div><SourceRef pages={[p.pdfPage]}/></div>)}</div>}</article>)}</section>
    {enh&&<section className="study-block danger"><h2>Common mistakes</h2><ul>{enh.commonMistakes.map(x=><li key={x}>{x}</li>)}</ul></section>}
    {enh&&<section className="study-block"><h2>Quick check</h2>{enh.quickCheck.map((q,i)=><details key={q.prompt}><summary>{i+1}. {q.prompt}</summary><p><CheckCircle2 size={17}/> {q.answer}</p></details>)}</section>}
    <section className="study-block"><h2>My notes</h2><textarea className="note-editor" value={note} onChange={e=>setNote(e.target.value)} placeholder="Write notes tied to this chapter…"/><button className="secondary-button" onClick={saveNote}>Save note offline</button></section>
    <SourceRef pages={pages.slice(0,4)}/>
  </div>;
}
