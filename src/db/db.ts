import Dexie, { type Table } from 'dexie';
import type { Chapter, FlashcardSeed, Formula, ManifestUnit, NoteRecord, QuestionAttempt, TopicMastery } from '../types/models';

export interface BookmarkRecord { id: string; targetType: string; targetId: string; title: string; createdAt: string; syncStatus: 'local'|'pending'|'synced'|'conflict'; }
export interface SettingRecord { key: string; value: string; updatedAt: string; }
export interface MistakeRecord { id: string; questionId: string; chapterId: string; question: string; studentAnswer: string; correctAnswer: string; timesMissed: number; lastMissedDate: string; lastCorrectDate?: string; resolved: boolean; }
export interface PdfRecord { id: string; name: string; blob: Blob; importedAt: string; }
export interface FlashcardProgress extends FlashcardSeed { lastReviewedDate?: string; nextReviewDate?: string; reviewInterval: number; easeFactor: number; successfulReviews: number; failedReviews: number; starred: boolean; }

export class StudyDatabase extends Dexie {
  units!: Table<ManifestUnit, string>;
  chapters!: Table<Chapter, string>;
  formulas!: Table<Formula, string>;
  flashcards!: Table<FlashcardProgress, string>;
  progress!: Table<TopicMastery, string>;
  attempts!: Table<QuestionAttempt, string>;
  bookmarks!: Table<BookmarkRecord, string>;
  notes!: Table<NoteRecord, string>;
  mistakes!: Table<MistakeRecord, string>;
  settings!: Table<SettingRecord, string>;
  pdfFiles!: Table<PdfRecord, string>;

  constructor() {
    super('powerEngineeringStudy');
    this.version(1).stores({
      units: 'id, number',
      chapters: 'id, unitId, number, title',
      formulas: 'id, chapterId, name, *tags, verificationStatus',
      flashcards: 'id, chapterId, nextReviewDate, starred, *tags',
      progress: 'topicId, score, status, updatedAt',
      attempts: 'id, questionId, chapterId, createdAt, correct',
      bookmarks: 'id, targetType, targetId, createdAt',
      notes: 'id, targetType, targetId, updatedAt',
      mistakes: 'id, questionId, chapterId, timesMissed, lastMissedDate, resolved',
      settings: 'key, updatedAt',
      pdfFiles: 'id, importedAt'
    });
    this.version(2).stores({
      units: 'id, number',
      chapters: 'id, unitId, number, title, verificationStatus',
      formulas: 'id, chapterId, name, *tags, verificationStatus',
      flashcards: 'id, chapterId, nextReviewDate, starred, *tags',
      progress: 'topicId, score, status, updatedAt',
      attempts: 'id, questionId, chapterId, createdAt, correct',
      bookmarks: 'id, targetType, targetId, createdAt',
      notes: 'id, targetType, targetId, updatedAt',
      mistakes: 'id, questionId, chapterId, timesMissed, lastMissedDate, resolved',
      settings: 'key, updatedAt',
      pdfFiles: 'id, importedAt'
    }).upgrade(() => undefined);
  }
}
export const db = new StudyDatabase();
