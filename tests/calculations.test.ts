import { describe, expect, it } from 'vitest';
import { withinTolerance } from '../src/services/calculations';
import { calculateMastery, masteryStatus } from '../src/services/mastery';

describe('calculation tolerances', () => {
  it('accepts an answer inside relative tolerance', () => {
    expect(withinTolerance(99, 100, 0.02)).toBe(true);
  });
  it('rejects an answer outside tolerance', () => {
    expect(withinTolerance(95, 100, 0.02)).toBe(false);
  });
});

describe('mastery', () => {
  it('normalizes mastery to 0 to 100', () => {
    expect(calculateMastery({quizAccuracy:100,calculationAccuracy:100,selfTestAccuracy:100,flashcardScore:100,lessonCompletion:100,recentMistakePenalty:0})).toBe(100);
  });
  it('maps strong scores to mastered', () => {
    expect(masteryStatus(90)).toBe('mastered');
  });
});
