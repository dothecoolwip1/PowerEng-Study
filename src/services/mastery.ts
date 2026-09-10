import type { MasteryStatus } from '../types/models';
export function masteryStatus(score:number): MasteryStatus {
  if (score <= 0) return 'not_started';
  if (score < 45) return 'learning';
  if (score < 65) return 'needs_review';
  if (score < 85) return 'strong';
  return 'mastered';
}
export function calculateMastery(input:{quizAccuracy:number; calculationAccuracy:number; selfTestAccuracy:number; flashcardScore:number; lessonCompletion:number; recentMistakePenalty:number;}):number {
  const raw = input.quizAccuracy * 0.25 + input.calculationAccuracy * 0.25 + input.selfTestAccuracy * 0.2 + input.flashcardScore * 0.15 + input.lessonCompletion * 0.15 - input.recentMistakePenalty * 0.15;
  return Math.max(0, Math.min(100, Math.round(raw)));
}
