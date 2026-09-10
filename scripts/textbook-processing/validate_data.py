from __future__ import annotations
import json, glob, sys
from pathlib import Path
root=Path(sys.argv[1])
manifest=json.loads((root/'manifest.json').read_text())
errors=[]; warnings=[]; ids=set(); chapter_ids=set(); section_ids=set(); question_ids=set(); formula_ids=set();
page_count=manifest['textbook']['pdfPageCount']
for uf in sorted(root.glob('unit-a-*.json')):
    u=json.loads(uf.read_text())
    if not u['chapters']: warnings.append(f"{u['id']} has no chapters")
    for c in u['chapters']:
        if c['id'] in ids: errors.append(f"Duplicate id {c['id']}")
        ids.add(c['id']); chapter_ids.add(c['id'])
        if not c['sourcePages']: errors.append(f"Chapter {c['id']} missing source pages")
        for p in c['sourcePages']:
            if not (1<=p<=page_count): errors.append(f"Invalid page {p} in {c['id']}")
        for s in c['sections']:
            if s['id'] in ids: errors.append(f"Duplicate id {s['id']}")
            ids.add(s['id']); section_ids.add(s['id'])
            if not s['sourcePages']: warnings.append(f"Section {s['id']} has no source pages")
        for q in c['selfTests']:
            if q['id'] in ids: errors.append(f"Duplicate id {q['id']}")
            ids.add(q['id']); question_ids.add(q['id'])
            if not q.get('textbookAnswer'): warnings.append(f"Self test {q['id']} has no same-page answer extraction")
        for f in c['formulaCandidates']:
            if f['id'] in ids: errors.append(f"Duplicate id {f['id']}")
            ids.add(f['id']); formula_ids.add(f['id'])
curated=json.loads((root/'curated.json').read_text())
for f in curated['formulas']:
    if f['id'] in ids: errors.append(f"Duplicate curated formula id {f['id']}")
    ids.add(f['id']); formula_ids.add(f['id'])
    if f['chapterId'] not in chapter_ids: errors.append(f"Orphan curated formula {f['id']} chapter {f['chapterId']}")
    for p in f['sourcePages']:
        if not (1<=p<=page_count): errors.append(f"Invalid curated formula page {p}: {f['id']}")
for fc in curated['flashcards']:
    if fc['chapterId'] not in chapter_ids: errors.append(f"Orphan flashcard {fc['id']} chapter {fc['chapterId']}")
report={
    'status':'PASS' if not errors else 'FAIL',
    'textbookPages':page_count,
    'units':len(manifest['units']),
    'chapters':len(chapter_ids),
    'sections':len(section_ids),
    'textbookSelfTests':len(question_ids),
    'formulaRecords':len(formula_ids),
    'errors':errors,
    'warningsCount':len(warnings),
    'warnings':warnings[:100]
}
print(json.dumps(report,indent=2))
if errors: raise SystemExit(1)
