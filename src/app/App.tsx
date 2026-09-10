import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { HomePage } from '../pages/HomePage';
import { LearnPage } from '../pages/LearnPage';
import { LessonPage } from '../pages/LessonPage';
import { PracticePage } from '../pages/PracticePage';
import { ReferencePage } from '../pages/ReferencePage';
import { FormulaPage } from '../pages/FormulaPage';
import { SearchPage } from '../pages/SearchPage';
import { ProgressPage } from '../pages/ProgressPage';
import { SettingsPage } from '../pages/SettingsPage';
import { TextbookPage } from '../pages/TextbookPage';
import { FlashcardsPage } from '../pages/FlashcardsPage';
import { MistakesPage } from '../pages/MistakesPage';
import { AskTextbookPage } from '../pages/AskTextbookPage';
import { SelfTestsPage } from '../pages/SelfTestsPage';
import { CalculationsPage } from '../pages/CalculationsPage';
import { QuizPage } from '../pages/QuizPage';
import { SavedPage } from '../pages/SavedPage';

export function App(){
  return <Routes><Route element={<AppShell/>}>
    <Route path="/" element={<HomePage/>}/>
    <Route path="/learn" element={<LearnPage/>}/>
    <Route path="/learn/:unitId/:chapterId" element={<LessonPage/>}/>
    <Route path="/practice" element={<PracticePage/>}/>
    <Route path="/practice/quiz" element={<QuizPage/>}/>
    <Route path="/practice/self-tests" element={<SelfTestsPage/>}/>
    <Route path="/practice/calculations" element={<CalculationsPage/>}/>
    <Route path="/practice/flashcards" element={<FlashcardsPage/>}/>
    <Route path="/practice/mistakes" element={<MistakesPage/>}/>
    <Route path="/reference" element={<ReferencePage/>}/>
    <Route path="/reference/formulas" element={<FormulaPage/>}/>
    <Route path="/reference/search" element={<SearchPage/>}/>
    <Route path="/reference/textbook" element={<TextbookPage/>}/>
    <Route path="/ask" element={<AskTextbookPage/>}/>
    <Route path="/progress" element={<ProgressPage/>}/>
    <Route path="/saved" element={<SavedPage/>}/>
    <Route path="/settings" element={<SettingsPage/>}/>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Route></Routes>;
}
