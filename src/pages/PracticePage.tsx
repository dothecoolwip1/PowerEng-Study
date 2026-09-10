import { Brain, Calculator, ChevronRight, ClipboardCheck, GraduationCap, ListChecks, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PracticePage(){
  return <div className="stack-lg">
    <div className="page-title"><p className="eyebrow">Practice</p><h1>Choose how you want to study.</h1><p>Use quick feedback while learning, or switch to exam mode when you want a more realistic test.</p></div>
    <div className="practice-feature-grid">
      <Link className="practice-feature practice" to="/practice/quiz"><ClipboardCheck/><div><span className="course-chip">Practice mode</span><strong>Answer questions with feedback</strong><p>Type or choose your answer, submit it, and see whether you are correct before moving on.</p></div><ChevronRight/></Link>
      <Link className="practice-feature exam" to="/practice/quiz?mode=exam"><GraduationCap/><div><span className="course-chip">Exam mode</span><strong>Take a full test</strong><p>Answer everything first. Your score and correct answers stay hidden until the exam is submitted.</p></div><ChevronRight/></Link>
    </div>
    <div className="section-head"><div><p className="eyebrow">Other study tools</p><h2>Practice one skill at a time</h2></div></div>
    <div className="reference-grid">
      <Link className="reference-card" to="/practice/self-tests"><ListChecks/><div><strong>Textbook self tests</strong><span>Original textbook questions with automatic answer checking where the source answer is available.</span></div><ChevronRight/></Link>
      <Link className="reference-card" to="/practice/calculations"><Calculator/><div><strong>Calculation practice</strong><span>Work through formula problems with units, hints, and answer checking.</span></div><ChevronRight/></Link>
      <Link className="reference-card" to="/practice/flashcards"><Brain/><div><strong>Flashcards</strong><span>Review definitions, formulas, rules, and concepts.</span></div><ChevronRight/></Link>
      <Link className="reference-card" to="/practice/mistakes"><RotateCcw/><div><strong>Mistake review</strong><span>Go straight back to questions and topics you have missed.</span></div><ChevronRight/></Link>
    </div>
  </div>;
}
