from __future__ import annotations
import fitz, re, json, sys, hashlib
from pathlib import Path

PDF = Path(sys.argv[1])
OUT = Path(sys.argv[2])
OUT.mkdir(parents=True, exist_ok=True)
doc = fitz.open(PDF)

def clean(s:str)->str:
    s=s.replace('\u0000','').replace('\ufeff','').replace('ﬁ','fi').replace('ﬂ','fl')
    s=s.replace('\x1f','').replace('\x1e','')
    s=re.sub(r'[ \t]+',' ',s)
    s=re.sub(r'\n{3,}','\n\n',s)
    return s.strip()

def lines_of(pno):
    t=clean(doc[pno-1].get_text('text'))
    return [clean(x) for x in t.splitlines() if clean(x)]

unit_starts=[]
for i,p in enumerate(doc, start=1):
    lines=lines_of(i)
    if lines and re.fullmatch(r'U\d+-1', lines[0]) and re.search(r'U\s*N\s*I\s*T\s+A\s*-\s*\d+', '\n'.join(lines), re.I):
        n=int(re.search(r'U(\d+)-1', lines[0]).group(1))
        title=[]
        for l in lines[1:]:
            if re.match(r'U\s*N\s*I\s*T', l, re.I) or '4th Class Edition' in l: break
            title.append(l)
        unit_starts.append((i,n,' '.join(title)))

chapters=[]
chpat=re.compile(r'C\s*h\s*a\s*p\s*t\s*e\s*r\s*(\d+)', re.I)
for i,p in enumerate(doc, start=1):
    t=clean(p.get_text('text'))
    if 'Learning Outcome' in t and 'Learning Objectives' in t:
        m=chpat.search(t)
        if not m: continue
        lines=[clean(x) for x in t.splitlines() if clean(x)]
        chnum=int(m.group(1))
        idx=next((j for j,l in enumerate(lines) if chpat.fullmatch(l)), 2)
        title=' '.join(lines[1:idx]) if idx>1 else lines[1]
        # map unit
        prev=[u for u in unit_starts if u[0] <= i]
        if not prev: continue
        upage, unum, utitle=prev[-1]
        # outcome
        outcome=''
        try:
            lo=lines.index('Learning Outcome')
            li=lines.index('Learning Objectives')
            chunk=[x for x in lines[lo+1:li] if not x.startswith('When you complete')]
            outcome=' '.join(chunk)
        except ValueError: pass
        objectives=[]
        try:
            li=lines.index('Learning Objectives')
            tail=lines[li+1:]
            buf=''
            for l in tail:
                if '4th Class Edition' in l: break
                if re.match(r'^\d+\.', l):
                    if buf: objectives.append(buf)
                    buf=l
                elif buf: buf += ' '+l
            if buf: objectives.append(buf)
        except ValueError: pass
        chapters.append({'unit':unum,'number':chnum,'title':title,'startPdfPage':i,'learningOutcome':outcome,'learningObjectives':objectives})

# ranges
for idx,ch in enumerate(chapters):
    next_same = next((x for x in chapters[idx+1:] if x['unit']==ch['unit']), None)
    unit_next = next((u for u in unit_starts if u[1]==ch['unit']+1), None)
    if next_same:
        ch['endPdfPage']=next_same['startPdfPage']-1
    elif unit_next:
        ch['endPdfPage']=unit_next[0]-1
    else:
        ch['endPdfPage']=doc.page_count

footer_re=re.compile(r'4th Class Edition 3\.5.*',re.I)
page_label_re=re.compile(r'^(?:U\d+-\d+|\d+-\d+)$')

def page_text(pno):
    lines=lines_of(pno)
    out=[]
    for l in lines:
        if page_label_re.fullmatch(l): continue
        if footer_re.search(l): continue
        if re.match(r'^(?:Unit A-\d+ .*|.* • Unit A-\d+)$',l): continue
        out.append(l)
    return '\n'.join(out)

def extract_selftests(text,pno,chapter_id):
    lines=[x.strip() for x in text.splitlines() if x.strip()]
    out=[]
    for i,l in enumerate(lines):
        m=re.match(r'^Self-Test\s+(\d+)',l,re.I)
        if not m: continue
        end=len(lines)
        for j in range(i+1,len(lines)):
            if j>i+1 and re.match(r'^(Objective\s+\d+|Chapter Summary|Self-Test\s+\d+)', lines[j], re.I):
                end=j; break
        seg=lines[i+1:end]
        ans=[]; prompt=[]
        for x in seg:
            if 'Ans.' in x or '(Ans' in x or re.search(r'\bAns\b',x): ans.append(x)
            else: prompt.append(x)
        # keep prompt compact, remove figure labels if immediately after question
        out.append({
            'id':f'{chapter_id}-self-{m.group(1)}-p{pno}',
            'questionNumber':m.group(1),
            'prompt':' '.join(prompt)[:2400],
            'textbookAnswer':' '.join(ans)[:800] if ans else None,
            'sourcePages':[pno],
            'sourceType':'textbook',
            'verificationStatus':'raw_extraction'
        })
    return out

def formula_candidates(text,pno,chapter_id):
    out=[]
    seen=set()
    for raw in text.splitlines():
        l=raw.strip()
        if len(l)<5 or len(l)>180: continue
        if '=' not in l: continue
        if not re.search(r'[A-Za-zμστ]|\d',l): continue
        if any(z in l for z in ['Name:','Date:','Instructor:','Course:']): continue
        norm=re.sub(r'\s+',' ',l)
        if norm in seen: continue
        seen.add(norm)
        hid=hashlib.sha1(f'{chapter_id}:{pno}:{norm}'.encode()).hexdigest()[:10]
        out.append({'id':f'raw-{hid}','name':'Extracted equation','expression':norm,'description':'Automatically extracted equation candidate. Verify against the source page before relying on it.','chapterId':chapter_id,'sourcePages':[pno],'tags':['raw extraction'],'verificationStatus':'raw_extraction'})
    return out[:18]

manifest={'course':{'id':'fourth-class-part-a','name':'Fourth Class Power Engineering • Part A','level':'Fourth Class'},'textbook':{'id':'panglobal-4a-ed35','title':'Power Engineering Fourth Class, Part A','edition':'3.5','revision':'September 2024','pdfPageCount':doc.page_count,'importVersion':'0.1.0','sourceFile':PDF.name},'units':[]}

for upage,unum,utitle in unit_starts:
    uend=(next((x[0] for x in unit_starts if x[1]==unum+1), doc.page_count+1)-1)
    uch=[c for c in chapters if c['unit']==unum]
    unit={'id':f'a-{unum}','number':unum,'title':utitle,'startPdfPage':upage,'endPdfPage':uend,'chapters':[]}
    unit_payload={'id':unit['id'],'number':unum,'title':utitle,'sourcePages':[upage,uend],'chapters':[],'knowledgeExercises':[]}
    for c in uch:
        cid=f'a-{unum}-c-{c["number"]}'
        sections=[]
        current={'id':cid+'-intro','title':'Chapter Introduction','order':0,'sourcePages':[],'pages':[]}
        sections.append(current)
        selftests=[]; raws=[]
        for pno in range(c['startPdfPage'], c['endPdfPage']+1):
            text=page_text(pno)
            if not text.strip(): continue
            m=re.search(r'(?:^|\n)Objective\s+(\d+)(?:\n|$)',text,re.I)
            if m:
                objnum=int(m.group(1))
                # objective title from first lines after marker
                ll=[x for x in text.splitlines() if x.strip()]
                try:
                    oi=next(i for i,x in enumerate(ll) if re.fullmatch(r'Objective\s+\d+',x,re.I))
                    ot=ll[oi+1] if oi+1<len(ll) else f'Objective {objnum}'
                except StopIteration: ot=f'Objective {objnum}'
                sid=f'{cid}-o-{objnum}'
                if not any(s['id']==sid for s in sections):
                    current={'id':sid,'title':ot,'objectiveNumber':objnum,'order':len(sections),'sourcePages':[],'pages':[]}
                    sections.append(current)
                else:
                    current=next(s for s in sections if s['id']==sid)
            current['pages'].append({'pdfPage':pno,'text':text})
            current['sourcePages'].append(pno)
            selftests.extend(extract_selftests(text,pno,cid))
            raws.extend(formula_candidates(text,pno,cid))
        # de-dup selftests same number keep first with answer preferentially
        ded={}
        for q in selftests:
            key=q['questionNumber']
            if key not in ded or (q['textbookAnswer'] and not ded[key]['textbookAnswer']): ded[key]=q
        selftests=list(ded.values())
        chapter={'id':cid,'unitId':unit['id'],'number':c['number'],'title':c['title'],'learningOutcome':c['learningOutcome'],'learningObjectives':c['learningObjectives'],'startPdfPage':c['startPdfPage'],'endPdfPage':c['endPdfPage'],'sourcePages':list(range(c['startPdfPage'],c['endPdfPage']+1)),'sections':sections,'selfTests':selftests,'formulaCandidates':raws[:80],'verificationStatus':'processed'}
        unit_payload['chapters'].append(chapter)
        unit['chapters'].append({k:chapter[k] for k in ['id','number','title','learningOutcome','learningObjectives','startPdfPage','endPdfPage']})
    # knowledge exercise pages after last chapter where phrase occurs
    for pno in range(upage,uend+1):
        text=page_text(pno)
        if 'Knowledge Exercises' in text:
            unit_payload['knowledgeExercises'].append({'id':f'a-{unum}-ke-p{pno}','title':next((x for x in text.splitlines() if 'Knowledge Exercises' in x),'Knowledge Exercises'),'sourcePages':[pno],'text':text,'verificationStatus':'raw_extraction'})
    manifest['units'].append(unit)
    (OUT/f'unit-a-{unum}.json').write_text(json.dumps(unit_payload,ensure_ascii=False,separators=(',',':')),encoding='utf-8')

(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')

# compact source index for page number + chapter lookup
index=[]
for c in chapters:
    index.append({'unit':c['unit'],'chapter':c['number'],'title':c['title'],'startPdfPage':c['startPdfPage'],'endPdfPage':c['endPdfPage']})
(OUT/'source-index.json').write_text(json.dumps(index,ensure_ascii=False,indent=2),encoding='utf-8')

print(json.dumps({'pages':doc.page_count,'units':len(unit_starts),'chapters':len(chapters),'unitStarts':unit_starts},indent=2))
