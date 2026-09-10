import { useEffect, useMemo, useState } from 'react';
import { Bookmark, Brain, ChevronDown, FileText, Search, Sigma, Sparkles } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { db } from '../db/db';
import { getCuratedData, getUnit } from '../services/content';
import type { Chapter, LessonEnhancement } from '../types/models';
import { SourceRef } from '../components/SourceRef';
import { useStudyStore } from '../store/useStudyStore';

const textbookLineClass=(line:string)=>{
  const value=line.trim();
  if(/^Example\s+\d+/i.test(value))return 'textbook-heading example';
  if(/^Solution\s+\d+/i.test(value))return 'textbook-heading solution';
  if(/^Self-Test\s+\d+/i.test(value))return 'textbook-heading self-test';
  if(/^Note:?$/i.test(value))return 'textbook-heading note';
  if(/^Objective\s+\d+/i.test(value))return 'textbook-heading objective';
  return '';
};

export function LessonPage(){
  const {unitId,chapterId}=useParams();
  const num=Number(unitId?.split('-')[1]);
  const [chapter,setChapter]=useState<Chapter>();
  const [enh,setEnh]=useState<LessonEnhancement>();
  const [open,setOpen]=useState<string>('');
  const [note,setNote]=useState('');
  const setLast=useStudyStore(s=>s.setLastChapterId);

  useEffect(()=>{if(!num||!chapterId)return;Promise.all([getUnit(num),getCuratedData()]).then(([unit,curated])=>{const found=unit.chapters.find(item=>item.id===chapterId);setChapter(found);setEnh(curated.lessonEnhancements[chapterId]);if(found){setLast(found.id);setOpen(found.sections[0]?.id??'');}});},[num,chapterId,setLast]);
  useEffect(()=>{if(!chapterId)return;db.notes.where('targetId').equals(chapterId).first().then(saved=>setNote(saved?.text??''));},[chapterId]);
  const pages=useMemo(()=>chapter?.sourcePages??[],[chapter]);

  if(!chapter)return <div className="loading-card">Loading textbook chapter…</div>;

  const saveNote=async()=>{const now=new Date().toISOString();await db.notes.put({id:`note:${chapter.id}`,targetType:'lesson',targetId:chapter.id,text:note,createdAt:now,updatedAt:now,syncStatus:'local'});};
  const bookmark=async()=>{await db.bookmarks.put({id:`chapter:${chapter.id}`,targetType:'lesson',targetId:chapter.id,title:chapter.title,createdAt:new Date().toISOString(),syncStatus:'local'});};

  return <div className="stack-lg lesson-page-pro">
    <section className="lesson-course-header"><div><span className="course-chip">Unit A-{num} • Chapter {chapter.number}</span><h1>{chapter.title}</h1><p>{chapter.learningOutcome}</p></div><button className="icon-button" onClick={bookmark} aria-label="Save this chapter"><Bookmark/></button></section>

    <section className="lesson-objectives"><div><p className="eyebrow">What you need to learn</p><h2>Learning objectives</h2></div><ol>{chapter.learningObjectives.map(objective=><li key={objective}>{objective.replace(/^\d+\.\s*/,'')}</li>)}</ol></section>

    <nav className="lesson-quick-actions" aria-label="Chapter study tools">
      <Link to={`/practice/quiz?chapter=${chapter.id}`}><Brain/><span>Quiz this chapter</span></Link>
      <Link to={`/reference/formulas?chapter=${chapter.id}`}><Sigma/><span>Formulas</span></Link>
      <Link to="/ask"><Sparkles/><span>Ask textbook</span></Link>
      <Link to="/reference/search"><Search/><span>Search</span></Link>
    </nav>

    <section className="textbook-lesson-section"><div className="section-head"><div><p className="eyebrow">From the textbook</p><h2>Chapter lesson</h2><p className="muted">This is the textbook wording, cleaned only for PDF text-layer character errors and formatted for easier reading.</p></div></div>
      <div className="lesson-section-list">{chapter.sections.map(section=><article className="lesson-section-card" key={section.id}>
        <button onClick={()=>setOpen(open===section.id?'':section.id)}><div><span>{section.objectiveNumber?`Objective ${section.objectiveNumber}`:'Chapter introduction'}</span><strong>{section.title}</strong><small>{section.sourcePages.length} textbook page{section.sourcePages.length===1?'':'s'}</small></div><ChevronDown className={open===section.id?'rot':''}/></button>
        {open===section.id&&<div className="lesson-section-body">{section.pages.map(page=><section className="textbook-page-card" key={page.pdfPage}><div className="source-page-head"><FileText size={17}/><strong>Textbook page {page.pdfPage}</strong></div><div className="textbook-reading">{page.text.split('\n').filter(line=>line.trim()).map((line,index)=><p className={textbookLineClass(line)} key={`${page.pdfPage}-${index}`}>{line}</p>)}</div><SourceRef pages={[page.pdfPage]}/></section>)}</div>}
      </article>)}</div>
    </section>

    {enh&&<section className="study-help-section"><div className="section-head"><div><p className="eyebrow">Study help</p><h2>Make the chapter easier to remember</h2><p className="muted">These study aids are separate from the textbook text above.</p></div></div><div className="two-col"><div className="study-block accent"><h2>Key concepts</h2><ul>{enh.keyConcepts.map(item=><li key={item}>{item}</li>)}</ul></div><div className="study-block warn"><h2>Remember this</h2><ul>{enh.remember.map(item=><li key={item}>{item}</li>)}</ul></div></div>{enh.commonMistakes.length>0&&<div className="study-block danger"><h2>Common mistakes</h2><ul>{enh.commonMistakes.map(item=><li key={item}>{item}</li>)}</ul></div>}</section>}

    <section className="study-block"><h2>My chapter notes</h2><textarea className="note-editor" value={note} onChange={event=>setNote(event.target.value)} placeholder="Write your own notes for this chapter…"/><button className="secondary-button" onClick={saveNote}>Save note offline</button></section>
    <SourceRef pages={pages.slice(0,6)}/>
  </div>;
}
