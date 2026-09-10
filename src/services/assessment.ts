import { normalizeTextbookText } from '../utils/textNormalization';

export type AssessmentPartKind = 'short' | 'multiple_choice';

export interface AssessmentChoice {
  label: string;
  text: string;
}

export interface AssessmentPart {
  id: string;
  label?: string;
  prompt: string;
  kind: AssessmentPartKind;
  choices?: AssessmentChoice[];
  expectedAnswer: string | null;
}

export interface AssessmentPartGrade {
  partId: string;
  studentAnswer: string;
  expectedAnswer: string | null;
  correct: boolean | null;
  reason: 'exact' | 'numeric' | 'choice' | 'keyword' | 'missing-answer' | 'mismatch';
}

export interface AssessmentGrade {
  parts: AssessmentPartGrade[];
  correct: boolean | null;
  answeredParts: number;
  totalParts: number;
}

const STOP_WORDS = new Set([
  'a','an','and','are','as','at','be','because','by','for','from','has','have','in','is','it','its','of','on','or','that','the','their','this','to','was','were','when','where','which','with','will','would'
]);

const tidy = (value: string) => normalizeTextbookText(value)
  .replace(/\s+/g, ' ')
  .replace(/\s+([,.;:!?])/g, '$1')
  .trim();

const normalized = (value: string) => tidy(value)
  .toLowerCase()
  .replace(/[×x]/g, '*')
  .replace(/[–—−]/g, '-')
  .replace(/²/g, '2')
  .replace(/³/g, '3')
  .replace(/[^a-z0-9%°/+*.-]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const stripAnswerMarkers = (value: string) => tidy(value)
  .replace(/\(?\s*Ans\.?\s*[a-z]?\s*\)?/gi, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const extractNumbers = (value: string): number[] => {
  const matches = normalized(value).match(/[-+]?\d+(?:\.\d+)?/g) ?? [];
  return matches.map(Number).filter(Number.isFinite);
};

const canonicalUnit = (value: string): string | null => {
  const compact = normalized(value).replace(/\s+/g, '');
  const unitMatchers: Array<[RegExp,string]> = [
    [/kn\*?m|knm/, 'knm'], [/n\*?m|nm/, 'nm'], [/m\/s2/, 'm/s2'], [/m\/s/, 'm/s'],
    [/mpa/, 'mpa'], [/kpa/, 'kpa'], [/pa/, 'pa'], [/mw/, 'mw'], [/kw/, 'kw'], [/w/, 'w'],
    [/mj/, 'mj'], [/kj/, 'kj'], [/j/, 'j'], [/kg/, 'kg'], [/m2/, 'm2'], [/°c|degc/, 'c'], [/k$/, 'k'], [/%/, '%']
  ];
  for (const [pattern, unit] of unitMatchers) if (pattern.test(compact)) return unit;
  return null;
};

const contentTokens = (value: string) => normalized(value)
  .split(' ')
  .map((x) => x.trim())
  .filter((x) => x.length > 1 && !STOP_WORDS.has(x) && !/^\d+(?:\.\d+)?$/.test(x));

function parseLetteredSegments(prompt: string): AssessmentChoice[] {
  const clean = tidy(prompt);
  const matches = [...clean.matchAll(/(?:^|\s)([a-z])\)\s*(.*?)(?=(?:\s+[a-z]\)\s)|$)/gi)];
  return matches.flatMap((match) => {
    const label = match[1]?.toLowerCase();
    const text = match[2]?.trim();
    return label && text ? [{ label, text }] : [];
  });
}

function parseMarkedAnswers(answer: string): Map<string,string> {
  const clean = tidy(answer);
  const result = new Map<string,string>();
  for (const match of clean.matchAll(/([^()]{1,180}?)\s*\(Ans\.\s*([a-z])\)/gi)) {
    const value = match[1]?.trim();
    const label = match[2]?.toLowerCase();
    if (label && value) result.set(label, stripAnswerMarkers(value));
  }
  return result;
}

function findMultipleChoiceAnswer(answer: string): string | null {
  const clean = tidy(answer);
  const direct = clean.match(/\b(?:Ans\.?|Answer)\s*[:=-]?\s*([a-d])\b/i);
  if (direct?.[1]) return direct[1].toLowerCase();
  const optionMarked = clean.match(/\b([a-d])\)\s*[^()]{1,180}?\s*\(Ans\.\)/i);
  return optionMarked?.[1]?.toLowerCase() ?? null;
}

export function buildAssessmentParts(prompt: string, textbookAnswer?: string | null): AssessmentPart[] {
  const cleanPrompt = tidy(prompt);
  const cleanAnswer = textbookAnswer ? tidy(textbookAnswer) : '';
  const lettered = parseLetteredSegments(cleanPrompt);
  const markedAnswers = cleanAnswer ? parseMarkedAnswers(cleanAnswer) : new Map<string,string>();

  if (markedAnswers.size > 1) {
    const parts = lettered.filter((part) => markedAnswers.has(part.label)).map((part) => ({
      id: part.label,
      label: part.label,
      prompt: part.text,
      kind: 'short' as const,
      expectedAnswer: markedAnswers.get(part.label) ?? null,
    }));
    if (parts.length) return parts;
  }

  const multipleChoiceAnswer = cleanAnswer ? findMultipleChoiceAnswer(cleanAnswer) : null;
  if (lettered.length >= 3 && multipleChoiceAnswer) {
    const firstMatch = cleanPrompt.search(/(?:^|\s)[a-z]\)\s/i);
    const stem = firstMatch > 0 ? cleanPrompt.slice(0, firstMatch).trim() : cleanPrompt;
    const expectedChoice = lettered.find((choice) => choice.label === multipleChoiceAnswer);
    return [{
      id: 'main',
      prompt: stem,
      kind: 'multiple_choice',
      choices: lettered,
      expectedAnswer: expectedChoice?.label ?? multipleChoiceAnswer,
    }];
  }

  return [{
    id: 'main',
    prompt: cleanPrompt,
    kind: 'short',
    expectedAnswer: cleanAnswer ? stripAnswerMarkers(cleanAnswer) : null,
  }];
}

export function gradeAnswer(studentAnswer: string, expectedAnswer: string | null, choices?: AssessmentChoice[]): Omit<AssessmentPartGrade,'partId'> {
  const student = tidy(studentAnswer);
  const expected = expectedAnswer ? stripAnswerMarkers(expectedAnswer) : null;
  if (!expected) return { studentAnswer: student, expectedAnswer: null, correct: null, reason: 'missing-answer' };
  if (!student) return { studentAnswer: student, expectedAnswer: expected, correct: false, reason: 'mismatch' };

  const s = normalized(student);
  const e = normalized(expected);
  if (s === e) return { studentAnswer: student, expectedAnswer: expected, correct: true, reason: 'exact' };

  if (choices?.length) {
    const choice = choices.find((item) => item.label === s || normalized(item.text) === s);
    const expectedChoice = choices.find((item) => item.label === e || normalized(item.text) === e);
    const correct = Boolean(choice && expectedChoice && choice.label === expectedChoice.label);
    return { studentAnswer: student, expectedAnswer: expectedChoice ? `${expectedChoice.label}) ${expectedChoice.text}` : expected, correct, reason: correct ? 'choice' : 'mismatch' };
  }

  const expectedNumbers = extractNumbers(expected);
  const studentNumbers = extractNumbers(student);
  if (expectedNumbers.length > 0 && expectedNumbers.length === studentNumbers.length) {
    const numbersMatch = expectedNumbers.every((target, index) => {
      const actual = studentNumbers[index];
      if (actual === undefined) return false;
      const tolerance = Math.max(Math.abs(target) * 0.015, 0.01);
      return Math.abs(actual - target) <= tolerance;
    });
    if (numbersMatch) {
      const expectedUnit = canonicalUnit(expected);
      const studentUnit = canonicalUnit(student);
      const unitsMatch = !expectedUnit || expectedUnit === studentUnit;
      return { studentAnswer: student, expectedAnswer: expected, correct: unitsMatch, reason: unitsMatch ? 'numeric' : 'mismatch' };
    }
  }

  if ((s.length >= 4 && e.includes(s)) || (e.length >= 4 && s.includes(e))) {
    return { studentAnswer: student, expectedAnswer: expected, correct: true, reason: 'keyword' };
  }

  const expectedTokens = [...new Set(contentTokens(expected))];
  const studentTokens = new Set(contentTokens(student));
  if (expectedTokens.length) {
    const matches = expectedTokens.filter((token) => studentTokens.has(token)).length;
    const recall = matches / expectedTokens.length;
    const precision = matches / Math.max(studentTokens.size, 1);
    const threshold = expectedTokens.length <= 2 ? recall === 1 : recall >= 0.75 && precision >= 0.55;
    if (threshold) return { studentAnswer: student, expectedAnswer: expected, correct: true, reason: 'keyword' };
  }

  return { studentAnswer: student, expectedAnswer: expected, correct: false, reason: 'mismatch' };
}

export function gradeAssessment(parts: AssessmentPart[], answers: Record<string,string>): AssessmentGrade {
  const grades = parts.map((part) => ({
    partId: part.id,
    ...gradeAnswer(answers[part.id] ?? '', part.expectedAnswer, part.choices),
  }));
  const graded = grades.filter((grade) => grade.correct !== null);
  const correct = graded.length === 0 ? null : grades.some((grade) => grade.correct === false) ? false : grades.every((grade) => grade.correct === true || grade.correct === null) ? true : null;
  return {
    parts: grades,
    correct,
    answeredParts: grades.filter((grade) => grade.studentAnswer.trim().length > 0).length,
    totalParts: grades.length,
  };
}

export function serializeAnswers(parts: AssessmentPart[], answers: Record<string,string>): string {
  return parts.map((part) => `${part.label ? `${part.label}) ` : ''}${answers[part.id] ?? ''}`.trim()).join(' | ');
}
