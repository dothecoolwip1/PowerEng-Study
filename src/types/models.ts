export type VerificationStatus = 'raw_extraction' | 'processed' | 'reviewed' | 'verified';
export type MasteryStatus = 'not_started' | 'learning' | 'needs_review' | 'strong' | 'mastered';

export interface LearningObjectiveSection {
  id: string;
  title: string;
  objectiveNumber?: number;
  order: number;
  sourcePages: number[];
  pages: Array<{ pdfPage: number; text: string }>;
}

export interface TextbookQuestion {
  id: string;
  questionNumber: string;
  prompt: string;
  textbookAnswer?: string | null;
  sourcePages: number[];
  sourceType: 'textbook' | 'generated';
  verificationStatus: VerificationStatus;
}

export interface Chapter {
  id: string;
  unitId: string;
  number: number;
  title: string;
  learningOutcome: string;
  learningObjectives: string[];
  startPdfPage: number;
  endPdfPage: number;
  sourcePages: number[];
  sections: LearningObjectiveSection[];
  selfTests: TextbookQuestion[];
  formulaCandidates: Formula[];
  verificationStatus: VerificationStatus;
}

export interface UnitPayload {
  id: string;
  number: number;
  title: string;
  sourcePages: number[];
  chapters: Chapter[];
  knowledgeExercises: Array<{ id: string; title: string; sourcePages: number[]; text: string; verificationStatus: VerificationStatus }>;
}

export interface ManifestChapter {
  id: string;
  number: number;
  title: string;
  learningOutcome: string;
  learningObjectives: string[];
  startPdfPage: number;
  endPdfPage: number;
}

export interface ManifestUnit {
  id: string;
  number: number;
  title: string;
  startPdfPage: number;
  endPdfPage: number;
  chapters: ManifestChapter[];
}

export interface StudyManifest {
  course: { id: string; name: string; level: string };
  textbook: { id: string; title: string; edition: string; revision: string; pdfPageCount: number; importVersion: string; sourceFile: string };
  units: ManifestUnit[];
}

export interface FormulaVariable { symbol: string; meaning: string; unit: string; }
export interface Formula {
  id: string;
  name: string;
  expression: string;
  plainExpression?: string;
  description: string;
  variables?: FormulaVariable[];
  chapterId: string;
  sourcePages: number[];
  tags: string[];
  verificationStatus: VerificationStatus;
}

export interface FlashcardSeed {
  id: string;
  front: string;
  back: string;
  chapterId: string;
  sourcePages: number[];
  tags: string[];
}

export interface LessonEnhancement {
  overview: string;
  keyConcepts: string[];
  remember: string[];
  commonMistakes: string[];
  quickCheck: Array<{ prompt: string; answer: string }>;
}

export interface CuratedData {
  formulas: Formula[];
  flashcards: FlashcardSeed[];
  lessonEnhancements: Record<string, LessonEnhancement>;
}

export interface TopicMastery {
  topicId: string;
  score: number;
  questionsAttempted: number;
  correctAnswers: number;
  recentAccuracy: number;
  lastReviewedAt?: string;
  status: MasteryStatus;
  updatedAt: string;
}

export interface QuestionAttempt {
  id: string;
  questionId: string;
  chapterId: string;
  correct: boolean;
  studentAnswer: string;
  createdAt: string;
}

export interface NoteRecord {
  id: string;
  targetType: 'lesson' | 'formula' | 'question' | 'pdf_page';
  targetId: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: 'local' | 'pending' | 'synced' | 'conflict';
}
