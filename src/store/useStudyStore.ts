import { create } from 'zustand';
type Theme='light'|'dark'|'system';
interface StudyState { theme:Theme; setTheme:(t:Theme)=>void; lastChapterId?:string; setLastChapterId:(id:string)=>void; }
export const useStudyStore=create<StudyState>((set)=>({
  theme:(localStorage.getItem('theme') as Theme | null) ?? 'system',
  setTheme:(theme)=>{localStorage.setItem('theme',theme);set({theme});},
  lastChapterId:localStorage.getItem('lastChapterId') ?? undefined,
  setLastChapterId:(id)=>{localStorage.setItem('lastChapterId',id);set({lastChapterId:id});}
}));
