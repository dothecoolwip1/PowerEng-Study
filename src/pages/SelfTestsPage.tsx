import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import { db } from '../db/db';
import { getUnit } from '../services/content';
import { buildAssessmentParts, gradeAssessment, serializeAnswers, type AssessmentGrade } from '../services/assessment';
import type { TextbookQuestion } from '../types/models';
import { SourceRef } from '../components/SourceRef';
import { QuestionAnswerForm } from '../components/QuestionAnswerForm';

interface Item extends TextbookQuestion { chapterId:string; chapterTitle:string; unit:number; }

export function SelfTestsPage(){
  const [items,setItems]=useState<Item[]>([]);
  const [unit,setUnit]=useState(1);
  const [chapter,setChapter]=useState('all');
  const [answers,setAnswers]=useState<Record<string,Record<string,string>>>({});
  const [grades,setGrades]=useState<Record<string,AssessmentGrade>>({});

  useEffect(()=>{getUnit(unit).then(payload=>{setItems(payload.chapters.flatMap(c=>c.selfTests.map(q=>({...q,chapterId:c.id,chapterTitle:c.title,unit}))));setChapter('all');setAnswers({});setGrades({});});},[unit]);

  const chapters=useMemo(()=>[...new Map(items.map(item=>[item.chapterId,item.chapterTitle])).entries()],[items]);
  const shown=chapter==='all'?items:items.filter(item=>item.chapterId===chapter);

  const setAnswer=(itemId:string,partId:string,value:string)=>setAnswers(old=>({...old,[itemId]:{...(old[itemId]??{}),[partId]:value}}));

  const submit=async(item:Item)=>{
    const parts=buildAssessmentParts(item.prompt,item.textbookAnswer);
    const submitted=answers[item.id]??{};
    const grade=gradeAssessment(parts,submitted);
    setGrades(old=>({...old,[item.id]:grade}));
    if(grade.correct===null)return;
    const studentAnswer=serializeAnswers(parts,submitted);
    await db.attempts.put({id:crypto.randomUUID(),questionId:item.id,chapterId:item.chapterId,correct:grade.correct,studentAnswer,createdAt:new Date().toISOString()});
    if(!grade.correct){
      const old=await db.mistakes.get(item.id);
      await db.mistakes.put({id:item.id,questionId:item.id,chapterId:item.chapterId,question:item.prompt,studentAnswer,correctAnswer:item.textbookAnswer??'Verify with the source page.',timesMissed:(old?.timesMissed??0)+1,lastMissedDate:new Date().toISOString(),resolved:false});
    }else{
      const old=await db.mistakes.get(item.id);
      if(old)await db.mistakes.update(item.id,{lastCorrectDate:new Date().toISOString(),resolved:true});
    }
  };

  const resetItem=(itemId:string)=>{setAnswers(old=>{const next={...old};delete next[itemId];return next;});setGrades(old=>{const next={...old};delete next[itemId];return next;});};

  return <div className="stack-lg">
    <div className="page-title"><p className="eyebrow">Textbook practice</p><h1>Self tests</h1><p>Answer the original textbook questions yourself. The app checks your response only after you press Submit.</p></div>
    <div className="filter-panel"><div><span className="filter-label">Unit</span><div className="chip-row">{Array.from({length:12},(_,i)=>i+1).map(n=><button className={unit===n?'chip active':'chip'} onClick={()=>setUnit(n)} key={n}>A-{n}</button>)}</div></div>{chapters.length>1&&<label className="select-field"><span>Chapter</span><select value={chapter} onChange={event=>setChapter(event.target.value)}><option value="all">All chapters</option>{chapters.map(([id,title])=><option key={id} value={id}>{title}</option>)}</select></label>}</div>
    {shown.length===0&&<div className="empty-state"><h2>No self tests found</h2><p>No textbook self-test question was detected for this selection.</p></div>}
    <div className="question-list">{shown.map((item,index)=>{
      const parts=buildAssessmentParts(item.prompt,item.textbookAnswer);
      const itemAnswers=answers[item.id]??{};
      const grade=grades[item.id];
      const answered=Object.values(itemAnswers).filter(value=>value.trim()).length;
      return <article className="question-card assessment-card" key={item.id}>
        <div className="question-number-row"><span>Self-Test {item.questionNumber}</span><span>Question {index+1} of {shown.length}</span></div>
        <p className="assessment-source-title">Unit A-{item.unit} • {item.chapterTitle}</p>
        {parts.length===1&&parts[0]?.kind==='short'?null:<h2 className="full-question-text">{item.prompt}</h2>}
        <QuestionAnswerForm parts={parts} answers={itemAnswers} onChange={(partId,value)=>setAnswer(item.id,partId,value)} disabled={Boolean(grade)} grades={grade?.parts}/>
        <SourceRef pages={item.sourcePages}/>
        {!grade?<button className="primary-button full-button" disabled={answered!==parts.length} onClick={()=>submit(item)}>Submit answer</button>:<div className="assessment-submit-row"><div className={`overall-feedback ${grade.correct===true?'correct':grade.correct===false?'wrong':'review'}`}>{grade.correct===true?<CheckCircle2/>:grade.correct===false?<XCircle/>:<RotateCcw/>}<div><strong>{grade.correct===true?'Correct':grade.correct===false?'Incorrect':'Needs source verification'}</strong><span>{grade.correct===true?'Your response matches the textbook answer.':grade.correct===false?'Compare your answer with the textbook answer shown above.':'The automatic extraction did not capture a reliable textbook answer for this question.'}</span></div></div><button className="secondary-button" onClick={()=>resetItem(item.id)}><RotateCcw size={17}/> Try again</button></div>}
      </article>;
    })}</div>
  </div>;
}
