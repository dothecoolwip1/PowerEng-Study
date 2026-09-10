import { useEffect, useRef, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const TEXTBOOK_FILE = 'textbook/Power-Engineering-Fourth-Class-Part-A-Edition-3.5.pdf';
const textbookUrl = `${import.meta.env.BASE_URL}${TEXTBOOK_FILE}`;

export function TextbookPage(){
  const [params,setParams]=useSearchParams();
  const [page,setPage]=useState(Math.max(1,Number(params.get('page')||1)));
  const [pages,setPages]=useState(1858);
  const [doc,setDoc]=useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const canvas=useRef<HTMLCanvasElement>(null);
  const [status,setStatus]=useState('Loading the reference textbook…');
  const [loadError,setLoadError]=useState(false);

  useEffect(()=>{
    let cancelled=false;
    const loadingTask=pdfjsLib.getDocument({url:textbookUrl});
    loadingTask.promise.then((loaded)=>{
      if(cancelled){loaded.destroy();return;}
      setDoc(loaded);
      setPages(loaded.numPages);
      setLoadError(false);
      setStatus('');
    }).catch(()=>{
      if(!cancelled){
        setLoadError(true);
        setStatus('The built-in reference textbook has not finished deploying yet.');
      }
    });
    return()=>{cancelled=true;loadingTask.destroy();};
  },[]);

  useEffect(()=>{
    if(!doc||!canvas.current)return;
    let cancelled=false;
    let renderTask:ReturnType<pdfjsLib.PDFPageProxy['render']>|undefined;
    (async()=>{
      try{
        setStatus(`Rendering page ${page}…`);
        const pdfPage=await doc.getPage(Math.min(page,doc.numPages));
        const viewport=pdfPage.getViewport({scale:1.45});
        const c=canvas.current;
        if(!c||cancelled)return;
        const ctx=c.getContext('2d');
        if(!ctx)return;
        c.width=viewport.width;
        c.height=viewport.height;
        renderTask=pdfPage.render({canvasContext:ctx,viewport});
        await renderTask.promise;
        if(!cancelled)setStatus('');
      }catch(error){
        if(!cancelled && (error as {name?:string})?.name!=='RenderingCancelledException'){
          setStatus('Could not render this textbook page. Try refreshing the app.');
        }
      }
    })();
    return()=>{cancelled=true;renderTask?.cancel();};
  },[doc,page]);

  const go=(n:number)=>{
    const v=Math.min(Math.max(1,n),pages);
    setPage(v);
    setParams({page:String(v)});
  };

  return <div className="stack">
    <div className="page-title">
      <p className="eyebrow">Reference</p>
      <h1>Reference textbook</h1>
      <p>Power Engineering Fourth Class, Edition 3.5, Part A is built into the study app. You never need to upload a textbook.</p>
    </div>

    <section className="study-block accent">
      <h2>Always the same source</h2>
      <p>Lesson source links, formulas, self tests, and page references all point back to this built-in textbook.</p>
      <a className="secondary-button" href={textbookUrl} target="_blank" rel="noreferrer">Open full PDF <ExternalLink size={17}/></a>
    </section>

    <div className="pdf-toolbar">
      <button onClick={()=>go(page-1)} disabled={page<=1||!doc}>Previous</button>
      <label>Page <input inputMode="numeric" value={page} onChange={e=>go(Number(e.target.value)||1)} /> of {pages}</label>
      <button onClick={()=>go(page+1)} disabled={page>=pages||!doc}>Next</button>
    </div>

    {status&&<div className="seed-banner">{status}</div>}
    {loadError?<div className="empty-state"><h2>Reference textbook file is not available yet.</h2><p>The study content still works. Once the PDF file is added to the deployment, this page will open it automatically with no upload step.</p></div>:<div className="pdf-canvas-wrap"><canvas ref={canvas}/></div>}

    <section className="study-block">
      <h2>Textbook acknowledgement</h2>
      <p className="muted">This material has been made available by the Northern Alberta Institute of Technology (NAIT), the Southern Alberta Institute of Technology (SAIT), and the British Columbia Institute of Technology (BCIT). The textbook notes an intended Creative Commons Attribution-NonCommercial-ShareAlike 4.0 approach for non-commercial reuse.</p>
    </section>
  </div>;
}
