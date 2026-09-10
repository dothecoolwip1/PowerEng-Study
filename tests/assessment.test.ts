import { describe, expect, it } from 'vitest';
import { buildAssessmentParts, gradeAssessment, gradeAnswer } from '../src/services/assessment';

describe('assessment engine',()=>{
  it('splits textbook multipart self tests into separately gradable answers',()=>{
    const prompt='A body moves from A to B. a) Calculate the constant velocity. b) Calculate the acceleration. c) Calculate the force applied.';
    const answer='8 m/s (Ans. a) 1.6 m/s2 (Ans. b) 1600 N (Ans. c)';
    const parts=buildAssessmentParts(prompt,answer);
    expect(parts).toHaveLength(3);
    expect(parts[0]?.expectedAnswer).toBe('8 m/s');
    expect(parts[1]?.expectedAnswer).toBe('1.6 m/s2');
    expect(parts[2]?.expectedAnswer).toBe('1600 N');
    const grade=gradeAssessment(parts,{a:'8 m/s',b:'1.6 m/s²',c:'1600 N'});
    expect(grade.correct).toBe(true);
  });

  it('checks numerical answers with units instead of asking the learner to self grade',()=>{
    expect(gradeAnswer('200 W','200 W').correct).toBe(true);
    expect(gradeAnswer('199 W','200 W').correct).toBe(true);
    expect(gradeAnswer('200 kW','200 W').correct).toBe(false);
  });

  it('accepts close wording when the important textbook terms are present',()=>{
    expect(gradeAnswer('Force divided by area','Pressure is force per unit area').correct).toBe(true);
  });
});
