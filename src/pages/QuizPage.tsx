import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, ClipboardCheck, GraduationCap, RotateCcw, XCircle } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { getManifest, getUnit } from '../services/content';
import { buildAssessmentParts, gradeAssessment, serializeAnswers, type AssessmentGrade } from '../services/assessment';
import { QuestionAnswerForm } from '../components/QuestionAnswerForm';
import { SourceRef } from '../components/SourceRef';
import { db } from '../db/db';
import type { TextbookQuestion } from '../types/models';

interface QuizQuestion extends TextbookQuestion { chapterId:string; chapterTitle:string; unit:number; }
type RunMode='practice'|'exam';

function shuffled<T>(items:T[],limit:number,seed:number):T[]{
  let state=seed||1;
  const random=()=>{state=(state*1664525+1013904223)>>>0;return state/4294967296;};
  return [...items].map(item=>({item,sort:random()})).sort((a,b)=>a.sort-b.sort).slice(0,Math.min(limit,items.length)).map(x=>x.item);
}

export function QuizPage(){
  const [params,setParams]=useSearchParams();
  const initialMode:RunMode=params.get('mode')==='exam'?'exam':'practice';
  const [mode,setMode]=useState<RunMode>(initialMode);
  const [count,setCount]=useState(initialMode==='exam'?25:10);
  const [all,setAll]=useState<QuizQuestion[]>([]);
  const [index,setIndex]=useState(0);
  const [runSeed,setRunSeed]=useState(()=>Date.now());
  const [answers,setAnswers]=useState<Record<string,Record<string,string>>>({});
  const [practiceGrade,setPracticeGrade]=useState<AssessmentGrade|null>(null);
  const [examGrades,setExamGrades]=useState<Record<string,AssessmentGrade>|null>(null);
  const chapterFilter=params.get('chapter');

  useEffect(()=>{(async()=>{const manifest=await getManifest();const pool:QuizQuestion[]=[];for(const unit of manifest.units){const payload=await getUnit(unit.number);for(const chapter of payload.chapters){for(const question of chapter.selfTests){pool.push({...question,chapterId:chapter.id,chapterTitle:chapter.title,unit:unit.number});}}}setAll(pool);})();},[]);

  const pool=useMemo(()=>chapterFilter?all.filter(q=>q.chapterId===chapterFilter):all,[all,chapterFilter]);
  const questions=useMemo(()=>shuffled(pool,count,runSeed),[pool,count,runSeed]);
  const q=questions[index];
  const parts=useMemo(()=>q?buildAssessmentParts(q.prompt,q.textbookAnswer):[],[q]);
  const currentAnswers=q?answers[q.id]??{}:{};

  const setAnswer=(partId:string,value:string)=>{if(!q)return;setAnswers(old=>({...old,[q.id]:{...(old[q.id]??{}),[partId]:value}}));};

  const recordGrade=async(question:QuizQuestion,grade:AssessmentGrade,submitted:Record<string,string>)=>{
    if(grade.correct===null)return;
    const studentAnswer=serializeAnswers(buildAssessmentParts(question.prompt,question.textbookAnswer),submitted);
    await db.attempts.put({id:crypto.randomUUID(),questionId:question.id,chapterId:question.chapterId,correct:grade.correct,studentAnswer,createdAt:new Date().toISOString()});
    if(!grade.correct){
      const old=await db.mistakes.get(question.id);
      await db.mistakes.put({id:question.id,questionId:question.id,chapterId:question.chapterId,question:question.prompt,studentAnswer,correctAnswer:question.textbookAnswer??'Verify with the source page.',timesMissed:(old?.timesMissed??0)+1,lastMissedDate:new Date().toISOString(),resolved:false});
    }else{
      const old=await db.mistakes.get(question.id);
      if(old)await db.mistakes.update(question.id,{lastCorrectDate:new Date().toISOString(),resolved:true});
    }
  };

  const submitPractice=async()=>{if(!q)return;const grade=gradeAssessment(parts,currentAnswers);setPracticeGrade(grade);await recordGrade(q,grade,currentAnswers);};
  const nextPractice=()=>{setPracticeGrade(null);setIndex(i=>Math.min(i+1,questions.length));};

  const submitExam=async()=>{
    const results:Record<string,AssessmentGrade>={};
    for(const question of questions){
      const questionParts=buildAssessmentParts(question.prompt,question.textbookAnswer);
      const submitted=answers[question.id]??{};
      const grade=gradeAssessment(questionParts,submitted);
      results[question.id]=grade;
      await recordGrade(question,grade,submitted);
    }
    setExamGrades(results);
    setIndex(0);
    window.scrollTo({top:0,behavior:'smooth'});
  };

  const restart=(nextMode=mode)=>{setMode(nextMode);setCount(nextMode==='exam'?25:10);setIndex(0);setRunSeed(Date.now());setAnswers({});setPracticeGrade(null);setExamGrades(null);setParams(nextMode==='exam'?{mode:'exam'}:{});};

  if(all.length===0)return <div className="loading-card">Preparing textbook questions…</div>;
  if(pool.length===0)return <div className="empty-state"><h2>No textbook questions found here</h2><p>Try the full question bank instead.</p><button className="primary-button" onClick={()=>{setParams({});setIndex(0);}}>Use all chapters</button></div>;

  if(examGrades){
    const gradeList=questions.map(question=>examGrades[question.id]).filter((grade):grade is AssessmentGrade=>Boolean(grade));
    const gradable=gradeList.filter(grade=>grade.correct!==null);
    const correct=gradable.filter(grade=>grade.correct===true).length;
    const percent=gradable.length?Math.round(correct/gradable.length*100):0;
    const needsReview=gradeList.filter(grade=>grade.correct===null).length;
    return <div className="stack-lg assessment-results-page">
      <section className="exam-score-card"><p className="eyebrow">Exam complete</p><div className="exam-score">{percent}%</div><h1>{correct} of {gradable.length} gradable questions correct</h1>{needsReview>0&&<p>{needsReview} question{needsReview===1?'':'s'} could not be safely auto-graded because the textbook answer was not captured.</p>}</section>
      <div className="result-summary-row"><div><strong>{correct}</strong><span>Correct</span></div><div><strong>{gradable.length-correct}</strong><span>Incorrect</span></div><div><strong>{needsReview}</strong><span>Source review</span></div></div>
      <section className="stack"><h2>Review your exam</h2>{questions.map((question,questionIndex)=>{const grade=examGrades[question.id];const questionParts=buildAssessmentParts(question.prompt,question.textbookAnswer);return <article className="question-card exam-review-card" key={question.id}><div className="question-number-row"><span>Question {questionIndex+1}</span><span className={`result-pill ${grade?.correct===true?'correct':grade?.correct===false?'wrong':'review'}`}>{grade?.correct===true?'Correct':grade?.correct===false?'Incorrect':'Review source'}</span></div><h2>{question.prompt}</h2><QuestionAnswerForm parts={questionParts} answers={answers[question.id]??{}} onChange={()=>undefined} disabled grades={grade?.parts}/><SourceRef pages={question.sourcePages}/></article>;})}</section>
      <button className="primary-button full-button" onClick={()=>restart('exam')}><RotateCcw size={18}/> Take another exam</button>
    </div>;
  }

  if(!q)return <div className="empty-state"><h2>Run complete</h2><button className="primary-button" onClick={()=>restart(mode)}>Start again</button></div>;

  const answered=Object.values(currentAnswers).filter(value=>value.trim()).length;
  const canSubmit=answered===parts.length&&parts.length>0;
  const examAnswered=questions.filter(question=>Object.values(answers[question.id]??{}).some(value=>value.trim())).length;

  return <div className="stack-lg assessment-page">
    <section className="assessment-header">
      <div><p className="eyebrow">Assessment</p><h1>{mode==='exam'?'Exam mode':'Practice quiz'}</h1><p>{mode==='exam'?'Answers stay hidden until you submit the whole exam.':'Enter your answer, submit it, then get immediate feedback from the textbook answer.'}</p></div>
      <div className="assessment-mode-switch"><button className={mode==='practice'?'active':''} onClick={()=>restart('practice')}><ClipboardCheck size={17}/> Practice</button><button className={mode==='exam'?'active':''} onClick={()=>restart('exam')}><GraduationCap size={17}/> Exam</button></div>
    </section>

    <div className="assessment-toolbar"><div className="chip-row">{[5,10,25,50].map(n=><button key={n} className={count===n?'chip active':'chip'} onClick={()=>{setCount(n);setIndex(0);setRunSeed(Date.now());setAnswers({});setPracticeGrade(null);setExamGrades(null);}}>{n} questions</button>)}</div><span>{mode==='exam'?`${examAnswered}/${questions.length} answered`:`Question ${index+1} of ${questions.length}`}</span></div>

    <article className="question-card assessment-card">
      <div className="question-number-row"><span>Question {index+1}</span><span>Unit A-{q.unit} • Chapter {q.chapterId.split('-').pop()}</span></div>
      <p className="assessment-source-title">{q.chapterTitle}</p>
      {parts.length===1&&parts[0]?.kind==='short'?null:<h2 className="full-question-text">{q.prompt}</h2>}
      <QuestionAnswerForm parts={parts} answers={currentAnswers} onChange={setAnswer} disabled={Boolean(practiceGrade)} grades={practiceGrade?.parts}/>
      <SourceRef pages={q.sourcePages}/>

      {mode==='practice'&&<div className="assessment-submit-row">{!practiceGrade?<button className="primary-button full-button" disabled={!canSubmit} onClick={submitPractice}>Submit answer</button>:<><div className={`overall-feedback ${practiceGrade.correct===true?'correct':practiceGrade.correct===false?'wrong':'review'}`}>{practiceGrade.correct===true?<CheckCircle2/>:practiceGrade.correct===false?<XCircle/>:<ClipboardCheck/>}<div><strong>{practiceGrade.correct===true?'Correct':practiceGrade.correct===false?'Not quite':'Needs source verification'}</strong><span>{practiceGrade.correct===true?'Nice work. Your answer matches the textbook.':practiceGrade.correct===false?'Review the textbook answer above before moving on.':'The source answer was not captured well enough to auto-grade this one.'}</span></div></div><button className="primary-button full-button" onClick={nextPractice}>{index+1>=questions.length?'Finish practice':'Next question'} <ChevronRight size={18}/></button></>}</div>}

      {mode==='exam'&&<div className="exam-nav"><button className="secondary-button" disabled={index===0} onClick={()=>setIndex(i=>Math.max(0,i-1))}><ChevronLeft size={18}/> Previous</button>{index+1<questions.length?<button className="primary-button" onClick={()=>setIndex(i=>Math.min(questions.length-1,i+1))}>Next <ChevronRight size={18}/></button>:<button className="primary-button" onClick={submitExam}>Submit exam</button>}</div>}
    </article>

    {mode==='exam'&&<div className="exam-question-grid" aria-label="Exam question navigation">{questions.map((question,i)=>{const hasAnswer=Object.values(answers[question.id]??{}).some(value=>value.trim());return <button key={question.id} className={`${i===index?'current':''} ${hasAnswer?'answered':''}`} onClick={()=>setIndex(i)}>{i+1}</button>;})}</div>}
    {chapterFilter&&<Link className="text-button" to="/practice/quiz">Use questions from all chapters</Link>}
  </div>;
}
