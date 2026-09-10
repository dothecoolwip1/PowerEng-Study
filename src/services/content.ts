import { db } from '../db/db';
import type { CuratedData, StudyManifest, UnitPayload } from '../types/models';

let manifestCache: StudyManifest | null = null;
let curatedCache: CuratedData | null = null;
const unitCache = new Map<number, UnitPayload>();

const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;

export async function getManifest(): Promise<StudyManifest> {
  if (manifestCache) return manifestCache;
  const r = await fetch(assetUrl('data/manifest.json'));
  if (!r.ok) throw new Error('Could not load textbook manifest.');
  manifestCache = await r.json() as StudyManifest;
  return manifestCache;
}

export async function getCuratedData(): Promise<CuratedData> {
  if (curatedCache) return curatedCache;
  const r = await fetch(assetUrl('data/curated.json'));
  if (!r.ok) throw new Error('Could not load curated study data.');
  curatedCache = await r.json() as CuratedData;
  return curatedCache;
}

export async function getUnit(number: number): Promise<UnitPayload> {
  const cached = unitCache.get(number);
  if (cached) return cached;
  const inDb = await db.chapters.where('unitId').equals(`a-${number}`).toArray();
  if (inDb.length) {
    const manifest = await getManifest();
    const unitMeta = manifest.units.find((u) => u.number === number);
    const payload: UnitPayload = { id:`a-${number}`, number, title:unitMeta?.title ?? `Unit A-${number}`, sourcePages:[unitMeta?.startPdfPage ?? 0, unitMeta?.endPdfPage ?? 0], chapters:inDb, knowledgeExercises:[] };
    unitCache.set(number, payload);
    return payload;
  }
  const r = await fetch(assetUrl(`data/unit-a-${number}.json`));
  if (!r.ok) throw new Error(`Could not load Unit A-${number}.`);
  const payload = await r.json() as UnitPayload;
  unitCache.set(number, payload);
  return payload;
}

export async function seedOfflineDatabase(onProgress?: (done:number,total:number)=>void): Promise<void> {
  const manifest = await getManifest();
  const curated = await getCuratedData();
  const already = await db.settings.get('contentVersion');
  if (already?.value === manifest.textbook.importVersion) return;
  const total = manifest.units.length;
  let done = 0;
  await db.transaction('rw', db.formulas, db.flashcards, async () => {
    await db.formulas.bulkPut(curated.formulas);
    await db.flashcards.bulkPut(curated.flashcards.map((f) => ({ ...f, reviewInterval: 0, easeFactor: 2.5, successfulReviews: 0, failedReviews: 0, starred: false })));
  });
  for (const unit of manifest.units) {
    const payload = await getUnit(unit.number);
    await db.transaction('rw', db.units, db.chapters, db.formulas, async () => {
      await db.units.put(unit);
      await db.chapters.bulkPut(payload.chapters);
      const rawFormulas = payload.chapters.flatMap((c) => c.formulaCandidates);
      if (rawFormulas.length) await db.formulas.bulkPut(rawFormulas);
    });
    unitCache.delete(unit.number);
    done += 1;
    onProgress?.(done,total);
  }
  await db.settings.put({ key:'contentVersion', value:manifest.textbook.importVersion, updatedAt:new Date().toISOString() });
}
