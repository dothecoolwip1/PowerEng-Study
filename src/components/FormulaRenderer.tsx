import katex from 'katex';
import 'katex/dist/katex.min.css';
export function FormulaRenderer({ expression }:{expression:string}) {
  let html='';
  try { html=katex.renderToString(expression,{throwOnError:false,displayMode:true}); }
  catch { html=expression; }
  return <div className="formula-render" dangerouslySetInnerHTML={{__html:html}} />;
}
