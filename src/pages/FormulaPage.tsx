import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { db } from '../db/db';
import { seedOfflineDatabase } from '../services/content';
import type { Formula } from '../types/models';
import { FormulaRenderer } from '../components/FormulaRenderer';
import { SourceRef } from '../components/SourceRef';
export function FormulaPage(){
  const [items,setItems]=useState<Formula[]>([]); const [q,setQ]=useState(''); const [raw,setRaw]=useState(false);
  useEffect(()=>{seedOfflineDatabase().then(()=>db.formulas.toArray()).then(setItems)},[]);
  const filtered=useMemo(()=>items.filter(f=>(raw||f.verificationStatus==='verified')&&`${f.name} ${f.description} ${f.tags.join(' ')}`.toLowerCase().includes(q.toLowerCase())),[items,q,raw]);
  return <div className="stack"><div className="page-title"><p className="eyebrow">Reference</p><h1>Formula center</h1><p>Verified formulas are curated against the textbook. Raw extraction candidates remain visibly marked until reviewed.</p></div><div className="search-row"><Search/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search formulas, tags, or topics"/><label><input type="checkbox" checked={raw} onChange={e=>setRaw(e.target.checked)}/> Show raw candidates</label></div><div className="formula-list">{filtered.map(f=><article className="formula-card" key={f.id}><div className="card-head"><div><span className={`verify ${f.verificationStatus}`}>{f.verificationStatus.replace('_',' ')}</span><h2>{f.name}</h2></div></div><FormulaRenderer expression={f.expression}/><p>{f.description}</p>{f.variables?.length?<div className="variable-grid">{f.variables.map(v=><div key={v.symbol}><strong>{v.symbol}</strong><span>{v.meaning}</span><small>{v.unit}</small></div>)}</div>:null}<SourceRef pages={f.sourcePages}/></article>)}</div></div>;
}
