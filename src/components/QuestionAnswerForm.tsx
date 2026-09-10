import { useId } from 'react';
import type { AssessmentPart, AssessmentPartGrade } from '../services/assessment';

interface Props {
  parts: AssessmentPart[];
  answers: Record<string,string>;
  onChange: (partId: string, value: string) => void;
  disabled?: boolean;
  grades?: AssessmentPartGrade[];
}

export function QuestionAnswerForm({parts,answers,onChange,disabled=false,grades}:Props){
  const formId=useId();
  return <div className="assessment-parts">
    {parts.map((part,index)=>{
      const grade=grades?.find((item)=>item.partId===part.id);
      const inputId=`${formId}-answer-${part.id}-${index}`;
      return <section className="assessment-part" key={part.id}>
        {(parts.length>1||part.label)&&<div className="assessment-part-label">{part.label?`Part ${part.label.toUpperCase()}`:`Part ${index+1}`}</div>}
        <p className="assessment-prompt">{part.prompt}</p>
        {part.kind==='multiple_choice'&&part.choices?.length ? <div className="choice-list" role="radiogroup" aria-label={`Answer for ${part.prompt}`}>
          {part.choices.map((choice)=><label className={`choice-option ${answers[part.id]===choice.label?'selected':''}`} key={choice.label}>
            <input type="radio" name={`${formId}-${part.id}`} value={choice.label} checked={answers[part.id]===choice.label} disabled={disabled} onChange={()=>onChange(part.id,choice.label)}/>
            <span className="choice-letter">{choice.label.toUpperCase()}</span>
            <span>{choice.text}</span>
          </label>)}
        </div> : <label className="written-answer" htmlFor={inputId}>
          <span>Your answer</span>
          <textarea id={inputId} value={answers[part.id]??''} disabled={disabled} onChange={(event)=>onChange(part.id,event.target.value)} placeholder="Type your answer here" rows={parts.length>1?2:3}/>
        </label>}
        {grade&&<div className={`part-feedback ${grade.correct===true?'correct':grade.correct===false?'wrong':'review'}`}>
          <strong>{grade.correct===true?'Correct':grade.correct===false?'Incorrect':'Answer needs source verification'}</strong>
          {grade.expectedAnswer&&<span>Textbook answer: {grade.expectedAnswer}</span>}
        </div>}
      </section>;
    })}
  </div>;
}
