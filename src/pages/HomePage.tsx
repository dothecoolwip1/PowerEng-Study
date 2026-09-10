import { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, Brain, Calculator, Search, Sigma, Sparkles, Bookmark } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../db/db';
import { getManifest } from '../services/content';
import type { StudyManifest } from '../types/models';
import { useStudyStore } from '../store/useStudyStore';

export function HomePage(){
  const [manifest,setManifest]=useState<StudyManifest>(); const [stats,setStats]=useState({attempts:0,accuracy:0,bookmarks:0,mistakes:0});
  const last=useStudyStore(s=>s.lastChapterId);
  useEffect(()=>{getManifest().then(setManifest); Promise.all([db.attempts.toArray(),db.bookmarks.count(),db.mistakes.where('resolved').equals(0).count()]).then(([a,b,m])=>setStats({attempts:a.length,accuracy:a.length?Math.round(a.filter(x=>x.correct).length/a.length*100):0,bookmarks:b,mistakes:m}));},[]);
  const first=manifest?.units[0]?.chapters[0];
  const continueChapter=manifest?.units.flatMap(u=>u.chapters.map(c=>({u,c}))).find(x=>x.c.id===last) ?? (first?{u:manifest!.units[0]!,c:first}:undefined);
  return <div className="stack-lg">
    <section className="hero-card"><div><p className="eyebrow">Your study dashboard</p><h1>Make the textbook work for you.</h1><p>Learn, practice, review mistakes, and jump straight back to the source.</p></div>{continueChapter&&<Link className="primary-button" to={`/learn/${continueChapter.u.id}/${continueChapter.c.id}`}>Continue studying <ArrowRight size={18}/></Link>}</section>
    <section className="stat-grid">
      <div className="stat"><strong>{stats.attempts}</strong><span>Questions answered</span></div><div className="stat"><strong>{stats.accuracy}%</strong><span>Quiz accuracy</span></div><div className="stat"><strong>{stats.mistakes}</strong><span>Weak items</span></div><div className="stat"><strong>{stats.bookmarks}</strong><span>Saved items</span></div>
    </section>
    <section><div className="section-head"><div><p className="eyebrow">Quick study</p><h2>What do you want to work on?</h2></div></div>
      <div className="action-grid">
        <Link className="action-card" to="/learn"><BookOpen/><div><strong>Learn</strong><span>56 chapters across 12 units</span></div></Link>
        <Link className="action-card" to="/reference/formulas"><Sigma/><div><strong>Formula review</strong><span>Verified formulas plus extracted candidates</span></div></Link>
        <Link className="action-card" to="/practice/calculations"><Calculator/><div><strong>Calculations</strong><span>Progressive hints and generated practice</span></div></Link>
        <Link className="action-card" to="/practice/flashcards"><Brain/><div><strong>Flashcards</strong><span>Spaced review of key concepts</span></div></Link>
        <Link className="action-card" to="/reference/search"><Search/><div><strong>Search</strong><span>Search the local textbook database</span></div></Link>
        <Link className="action-card" to="/ask"><Sparkles/><div><strong>Ask the textbook</strong><span>Retrieve the most relevant source sections</span></div></Link>
      <Link className="action-card" to="/saved"><Bookmark/><div><strong>Bookmarks & notes</strong><span>Return to saved lessons and personal notes.</span></div></Link></div>
    </section>
    <section className="callout"><strong>Built around the uploaded Fourth Class Part A textbook.</strong><span>Every study item keeps a source page so you can verify it against the original.</span></section>
  </div>;
}
