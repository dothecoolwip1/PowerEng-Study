import { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, Brain, Calculator, FileSearch, GraduationCap, Search, Sigma, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../db/db';
import { getManifest } from '../services/content';
import type { StudyManifest } from '../types/models';
import { useStudyStore } from '../store/useStudyStore';

export function HomePage(){
  const [manifest,setManifest]=useState<StudyManifest>();
  const [stats,setStats]=useState({attempts:0,accuracy:0,mistakes:0});
  const last=useStudyStore(s=>s.lastChapterId);
  useEffect(()=>{
    getManifest().then(setManifest);
    Promise.all([db.attempts.toArray(),db.mistakes.where('resolved').equals(0).count()]).then(([attempts,mistakes])=>setStats({attempts:attempts.length,accuracy:attempts.length?Math.round(attempts.filter(x=>x.correct).length/attempts.length*100):0,mistakes}));
  },[]);
  const first=manifest?.units[0]?.chapters[0];
  const continueChapter=manifest?.units.flatMap(unit=>unit.chapters.map(chapter=>({unit,chapter}))).find(item=>item.chapter.id===last) ?? (first&&manifest?{unit:manifest.units[0]!,chapter:first}:undefined);
  const chapterCount=manifest?.units.reduce((sum,unit)=>sum+unit.chapters.length,0)??0;

  return <div className="stack-lg school-home">
    <section className="course-heading"><p className="eyebrow">Your course</p><h1>Fourth Class Power Engineering</h1><p>Part A • {manifest?.units.length??12} units • {chapterCount||56} chapters</p></section>

    {continueChapter&&<section className="continue-card">
      <div className="continue-card-top"><div><span className="course-chip">Unit A-{continueChapter.unit.number} • Chapter {continueChapter.chapter.number}</span><h2>{continueChapter.chapter.title}</h2><p>{continueChapter.chapter.learningOutcome}</p></div><BookOpen size={28}/></div>
      <Link className="primary-button full-button" to={`/learn/${continueChapter.unit.id}/${continueChapter.chapter.id}`}>Continue studying <ArrowRight size={18}/></Link>
    </section>}

    <section className="home-status"><div><strong>{stats.accuracy}%</strong><span>Practice accuracy</span></div><div><strong>{stats.mistakes}</strong><span>Topics to review</span></div><div><strong>{stats.attempts}</strong><span>Answers submitted</span></div></section>

    <section><div className="section-head"><div><p className="eyebrow">Start here</p><h2>What are you trying to do?</h2></div></div>
      <div className="home-primary-grid">
        <Link className="home-task-card learn" to="/learn"><BookOpen/><div><strong>Learn the course</strong><span>Work through the textbook in order.</span></div><ArrowRight/></Link>
        <Link className="home-task-card practice" to="/practice"><GraduationCap/><div><strong>Practice & exams</strong><span>Answer questions, calculations, and self tests.</span></div><ArrowRight/></Link>
        <Link className="home-task-card formulas" to="/reference/formulas"><Sigma/><div><strong>Find a formula</strong><span>Use the formula handbook and exam sheet.</span></div><ArrowRight/></Link>
        <Link className="home-task-card search" to="/reference/search"><Search/><div><strong>Find something</strong><span>Search the textbook by topic or word.</span></div><ArrowRight/></Link>
      </div>
    </section>

    <section><div className="section-head"><div><p className="eyebrow">Study tools</p><h2>More ways to study</h2></div></div>
      <div className="compact-tool-grid">
        <Link to="/practice/calculations"><Calculator/><span>Calculations</span></Link>
        <Link to="/practice/flashcards"><Brain/><span>Flashcards</span></Link>
        <Link to="/ask"><Sparkles/><span>Ask textbook</span></Link>
        <Link to="/reference/textbook"><FileSearch/><span>Original PDF</span></Link>
      </div>
    </section>
  </div>;
}
