import { Link } from 'react-router-dom';
export function SourceRef({pages}:{pages:number[]}) {
  const unique=[...new Set(pages)].slice(0,6);
  return <div className="source-ref"><span>Source</span>{unique.map(p=><Link key={p} to={`/reference/textbook?page=${p}`}>PDF p. {p}</Link>)}</div>;
}
