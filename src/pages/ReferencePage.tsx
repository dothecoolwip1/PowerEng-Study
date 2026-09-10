import { BookOpenText, ChevronRight, Search, Sigma } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ReferencePage(){
  return <div className="stack-lg">
    <div className="page-title"><p className="eyebrow">Reference</p><h1>Find what you need fast.</h1><p>Formulas, textbook search, and the original PDF are kept together so you do not have to hunt through the app.</p></div>
    <div className="reference-grid">
      <Link className="reference-card primary" to="/reference/formulas"><Sigma/><div><strong>Formula handbook</strong><span>Verified equations, variable meanings, units, and source pages.</span></div><ChevronRight/></Link>
      <Link className="reference-card" to="/reference/search"><Search/><div><strong>Search the textbook</strong><span>Search the local textbook content by word, concept, chapter, or topic.</span></div><ChevronRight/></Link>
      <Link className="reference-card" to="/reference/textbook"><BookOpenText/><div><strong>Original textbook</strong><span>Open the PDF and jump directly to referenced pages.</span></div><ChevronRight/></Link>
    </div>
  </div>;
}
