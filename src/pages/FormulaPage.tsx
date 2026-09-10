import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Calculator, LayoutGrid, List, Search } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { db } from '../db/db';
import { seedOfflineDatabase } from '../services/content';
import type { Formula } from '../types/models';
import { FormulaRenderer } from '../components/FormulaRenderer';
import { SourceRef } from '../components/SourceRef';

type ViewMode='handbook'|'sheet';
const formulaUnit=(formula:Formula)=>Number(formula.chapterId.match(/^a-(\d+)-c-/)?.[1]??0);
const formulaChapter=(formula:Formula)=>Number(formula.chapterId.match(/-c-(\d+)$/)?.[1]??0);

export function FormulaPage(){
  const [params]=useSearchParams();
  const [items,setItems]=useState<Formula[]>([]);
  const [query,setQuery]=useState('');
  const [unit,setUnit]=useState(0);
  const [view,setView]=useState<ViewMode>('handbook');
  const chapterFilter=params.get('chapter');

  useEffect(()=>{seedOfflineDatabase().then(()=>db.formulas.toArray()).then(data=>setItems(data.filter(formula=>formula.verificationStatus==='verified')))},[]);

  const filtered=useMemo(()=>items.filter(formula=>{
    const matchesUnit=unit===0||formulaUnit(formula)===unit;
    const matchesChapter=!chapterFilter||formula.chapterId===chapterFilter;
    const haystack=`${formula.name} ${formula.description} ${formula.plainExpression??''} ${formula.tags.join(' ')} ${formula.variables?.map(v=>`${v.symbol} ${v.meaning} ${v.unit}`).join(' ')??''}`.toLowerCase();
    return matchesUnit&&matchesChapter&&haystack.includes(query.trim().toLowerCase());
  }).sort((a,b)=>formulaUnit(a)-formulaUnit(b)||formulaChapter(a)-formulaChapter(b)||a.name.localeCompare(b.name)),[items,unit,query,chapterFilter]);

  const availableUnits=useMemo(()=>[...new Set(items.map(formulaUnit).filter(Boolean))].sort((a,b)=>a-b),[items]);

  return <div className="stack-lg formula-handbook-page">
    <div className="page-title"><p className="eyebrow">Reference</p><h1>Formula handbook</h1><p>Only verified textbook formulas are shown here. Search by name, variable, unit, or topic.</p></div>

    <div className="formula-controls">
      <label className="formula-search"><Search size={20}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search force, pressure, steam, efficiency…"/></label>
      <div className="view-switch"><button className={view==='handbook'?'active':''} onClick={()=>setView('handbook')}><LayoutGrid size={17}/> Handbook</button><button className={view==='sheet'?'active':''} onClick={()=>setView('sheet')}><List size={17}/> Exam sheet</button></div>
    </div>

    {!chapterFilter&&<div className="chip-row formula-unit-row"><button className={unit===0?'chip active':'chip'} onClick={()=>setUnit(0)}>All units</button>{availableUnits.map(n=><button key={n} className={unit===n?'chip active':'chip'} onClick={()=>setUnit(n)}>A-{n}</button>)}</div>}

    <div className="formula-count"><strong>{filtered.length}</strong> verified formula{filtered.length===1?'':'s'}{chapterFilter?' in this chapter':''}</div>

    {view==='sheet'?<div className="exam-formula-sheet">{filtered.map(formula=><article key={formula.id}><div><span>A-{formulaUnit(formula)} • Ch. {formulaChapter(formula)}</span><strong>{formula.name}</strong></div><FormulaRenderer expression={formula.expression}/><small>{formula.plainExpression}</small><SourceRef pages={formula.sourcePages}/></article>)}</div>:<div className="formula-handbook-list">{filtered.map(formula=>{
      const unitNumber=formulaUnit(formula);
      const chapterNumber=formulaChapter(formula);
      return <article className="formula-detail-card" key={formula.id}>
        <div className="formula-card-heading"><div><span className="course-chip">Unit A-{unitNumber} • Chapter {chapterNumber}</span><h2>{formula.name}</h2></div><span className="verified-badge">Textbook verified</span></div>
        <div className="formula-equation"><FormulaRenderer expression={formula.expression}/></div>
        {formula.plainExpression&&<p className="formula-plain">{formula.plainExpression}</p>}
        <div className="formula-use"><strong>What it is for</strong><p>{formula.description}</p></div>
        {formula.variables?.length?<div className="formula-variable-list"><div className="formula-variable-head"><span>Symbol</span><span>Meaning</span><span>Unit</span></div>{formula.variables.map(variable=><div key={`${formula.id}-${variable.symbol}`}><strong>{variable.symbol}</strong><span>{variable.meaning}</span><span>{variable.unit||'—'}</span></div>)}</div>:null}
        <SourceRef pages={formula.sourcePages}/>
        <div className="formula-actions"><Link className="secondary-button" to={`/learn/a-${unitNumber}/${formula.chapterId}`}><BookOpen size={17}/> Open chapter</Link><Link className="primary-button" to="/practice/calculations"><Calculator size={17}/> Practice calculations</Link></div>
      </article>;
    })}</div>}

    {filtered.length===0&&<div className="empty-state"><h2>No verified formulas found</h2><p>Try a different search term or unit.</p></div>}
  </div>;
}
