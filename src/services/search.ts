import { getManifest, getUnit, getCuratedData } from './content';
export interface SearchHit { id:string; type:'chapter'|'section'|'formula'|'self_test'|'page'; title:string; snippet:string; chapterId?:string; unitNumber?:number; sourcePages:number[]; score:number; }
const norm=(s:string)=>s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9°²μσ τ]+/g,' ').replace(/\s+/g,' ').trim();
export async function searchTextbook(query:string,limit=40):Promise<SearchHit[]> {
  const q=norm(query); if (!q) return [];
  const terms=q.split(' ').filter(Boolean);
  const [manifest, curated]=await Promise.all([getManifest(),getCuratedData()]);
  const hits:SearchHit[]=[];
  for (const f of curated.formulas) {
    const hay=norm(`${f.name} ${f.description} ${f.plainExpression ?? ''} ${f.tags.join(' ')}`);
    const score=terms.reduce((s,t)=>s+(hay.includes(t)?4:0),0);
    if(score) hits.push({id:f.id,type:'formula',title:f.name,snippet:f.description,chapterId:f.chapterId,sourcePages:f.sourcePages,score:score+4});
  }
  for (const u of manifest.units) {
    const payload=await getUnit(u.number);
    for (const c of payload.chapters) {
      const chay=norm(`${c.title} ${c.learningOutcome} ${c.learningObjectives.join(' ')}`);
      const cscore=terms.reduce((s,t)=>s+(chay.includes(t)?3:0),0);
      if(cscore) hits.push({id:c.id,type:'chapter',title:`A-${u.number} • Chapter ${c.number}: ${c.title}`,snippet:c.learningOutcome,chapterId:c.id,unitNumber:u.number,sourcePages:[c.startPdfPage],score:cscore+3});
      for(const s of c.sections){
        for(const p of s.pages){
          const hay=norm(p.text); const score=terms.reduce((sum,t)=>sum+(hay.includes(t)?1:0),0);
          if(score===terms.length){
            const idx=Math.max(0, hay.indexOf(terms[0] ?? '')-80); const raw=p.text.replace(/\s+/g,' ');
            hits.push({id:`${s.id}-p${p.pdfPage}`,type:'page',title:`${c.title} • ${s.title}`,snippet:raw.slice(Math.min(idx,raw.length),Math.min(idx+260,raw.length)),chapterId:c.id,unitNumber:u.number,sourcePages:[p.pdfPage],score:score+2});
          }
        }
      }
      for(const qn of c.selfTests){
        const hay=norm(`${qn.prompt} ${qn.textbookAnswer ?? ''}`); const score=terms.reduce((s,t)=>s+(hay.includes(t)?2:0),0);
        if(score) hits.push({id:qn.id,type:'self_test',title:`Self-Test ${qn.questionNumber} • ${c.title}`,snippet:qn.prompt,chapterId:c.id,unitNumber:u.number,sourcePages:qn.sourcePages,score:score+2});
      }
    }
  }
  return hits.sort((a,b)=>b.score-a.score).slice(0,limit);
}
