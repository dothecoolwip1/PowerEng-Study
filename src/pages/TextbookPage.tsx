import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { db } from '../db/db';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export function TextbookPage(){
  const [params,setParams]=useSearchParams(); const [page,setPage]=useState(Math.max(1,Number(params.get('page')||1))); const [blob,setBlob]=useState<Blob>(); const [pages,setPages]=useState(1858); const canvas=useRef<HTMLCanvasElement>(null); const [status,setStatus]=useState('');
  useEffect(()=>{db.pdfFiles.get('primary').then(r=>setBlob(r?.blob));},[]);
  useEffect(()=>{if(!blob||!canvas.current)return;let cancelled=false;const url=URL.createObjectURL(blob);(async()=>{try{setStatus('Rendering page…');const doc=await pdfjsLib.getDocument(url).promise;setPages(doc.numPages);const p=await doc.getPage(Math.min(page,doc.numPages));const viewport=p.getViewport({scale:1.45});const c=canvas.current!;const ctx=c.getContext('2d')!;c.width=viewport.width;c.height=viewport.height;await p.render({canvasContext:ctx,viewport}).promise;if(!cancelled)setStatus('');}catch{if(!cancelled)setStatus('Could not render this PDF page. Re-import the textbook if needed.');}finally{URL.revokeObjectURL(url);}})();return()=>{cancelled=true;};},[blob,page]);
  const importPdf=async(e:ChangeEvent<HTMLInputElement>)=>{const f=e.target.files?.[0];if(!f)return;await db.pdfFiles.put({id:'primary',name:f.name,blob:f,importedAt:new Date().toISOString()});setBlob(f);setStatus('Textbook saved locally for offline viewing.');};
  const go=(n:number)=>{const v=Math.min(Math.max(1,n),pages);setPage(v);setParams({page:String(v)});};
  return <div className="stack"><div className="page-title"><p className="eyebrow">Reference</p><h1>Original textbook</h1><p>Import your copy once. It is stored locally in IndexedDB and source links open directly to the selected PDF page.</p></div>{!blob&&<label className="pdf-import"><strong>Import the uploaded textbook into this browser</strong><span>The PDF stays on this device.</span><input type="file" accept="application/pdf" onChange={importPdf}/></label>}<div className="pdf-toolbar"><button onClick={()=>go(page-1)} disabled={page<=1}>Previous</button><label>Page <input inputMode="numeric" value={page} onChange={e=>go(Number(e.target.value)||1)}/> of {pages}</label><button onClick={()=>go(page+1)} disabled={page>=pages}>Next</button></div>{status&&<div className="seed-banner">{status}</div>}{blob?<div className="pdf-canvas-wrap"><canvas ref={canvas}/></div>:<div className="empty-state"><h2>No local PDF imported yet.</h2><p>The study database is already available. Import the original PDF only if you want direct page viewing offline.</p></div>}</div>;
}
