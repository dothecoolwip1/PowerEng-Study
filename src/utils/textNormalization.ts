/**
 * Repairs known text-layer extraction artifacts from the Power Engineering PDF.
 *
 * The source PDF uses several embedded font ligatures that some PDF parsers expose
 * as private or unrelated Unicode characters. A second class of artifacts drops
 * letters from common "th", "ft", "fi", and "fl" words. This normalizer is
 * intentionally conservative: it fixes only patterns confirmed against the
 * textbook, and does not rewrite technical meaning.
 */

const glyphReplacements: Record<string, string> = {
  'Ɵ': 'ti',
  'Ʃ': 'tt',
  'ƫ': 'tti',
  'Į': 'fi',
  'ĸ': 'ffi',
  'Ň': 'fl',
  'Ō': 'ft',
  'ī': 'ff',
  'ﬀ': 'ff',
  'ﬁ': 'fi',
  'ﬂ': 'fl',
  'ﬃ': 'ffi',
  'ﬄ': 'ffl',
  '¿': 'fi',
  'Ï': 'fi',
  'Á': 'fl',
  'À': 'fl',
  'ႇ': 'ff',
  'ႈ': 'ffi',
  'ႉ': 'ffl',
  '�': '',
};

const wordCorrections: Record<string, string> = {
  te: 'the', tis: 'this', tese: 'these', tey: 'they', tere: 'there', terefore: 'therefore',
  tat: 'that', teir: 'their', tose: 'those', tus: 'thus', tomas: 'thomas', tird: 'third',
  tursday: 'thursday', tickness: 'thickness', ticker: 'thicker', treaded: 'threaded',
  trottle: 'throttle', trottling: 'throttling', toroughly: 'thoroughly', 'tree-element': 'three-element',
  afer: 'after', aferward: 'afterward', aferwards: 'afterwards', ofen: 'often',
  draf: 'draft', drafs: 'drafts', drafed: 'drafted', redrafed: 'redrafted', aircraf: 'aircraft',
  shif: 'shift', shifs: 'shifts', shifed: 'shifted', shifwork: 'shiftwork', 'non-shif': 'non-shift',
  lef: 'left', 'lef-hand': 'left-hand', shaf: 'shaft', shafs: 'shafts', lif: 'lift', lifs: 'lifts',
  lifed: 'lifted', lifing: 'lifting', sof: 'soft', sofware: 'software', sofener: 'softener',
  sofeners: 'softeners', sofened: 'softened', sofening: 'softening',
  termal: 'thermal', termodynamics: 'thermodynamics', termodynamic: 'thermodynamic',
  termostat: 'thermostat', termostats: 'thermostats', termistor: 'thermistor', termistors: 'thermistors',
  teoretical: 'theoretical', teoretically: 'theoretically', termoelectric: 'thermoelectric',
  'termo-hydraulic': 'thermo-hydraulic', 'termo-flooding': 'thermo-flooding',
  flre: 'fire', flred: 'fired', flretube: 'firetube', 'fluid-flred': 'fluid-fired',
  overflre: 'overfire', underflre: 'underfire', fltter: 'fitter', liquefled: 'liquefied',
  speciflc: 'specific', coefflcient: 'coefficient', coefflcients: 'coefficients', thef: 'theft',
};

function preserveCase(original: string, replacement: string): string {
  if (original.toUpperCase() === original) return replacement.toUpperCase();
  if (original[0]?.toUpperCase() === original[0] && original.slice(1).toLowerCase() === original.slice(1)) {
    return replacement[0]?.toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

export function normalizeTextbookText(input: string): string {
  let text = input.replace(/[ƟƩƫĮĸŇŌīﬀﬁﬂﬃﬄ¿ÏÁÀႇႈႉ�]/g, (ch) => glyphReplacements[ch] ?? ch);

  // These capitalized words were confirmed as dropped-letter artifacts in the textbook text layer.
  text = text.replace(/\bTe\b/g, 'The');
  text = text.replace(/\bTen\b/g, 'Then');
  text = text.replace(/\bTree\b/g, 'Three');

  for (const [bad, good] of Object.entries(wordCorrections)) {
    if (bad === 'te') continue;
    const escaped = bad.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`\\b${escaped}\\b`, 'gi');
    text = text.replace(pattern, (match) => preserveCase(match, good));
  }
  return text;
}

export function normalizeTextbookData<T>(value: T): T {
  if (typeof value === 'string') return normalizeTextbookText(value) as T;
  if (Array.isArray(value)) return value.map((item) => normalizeTextbookData(item)) as T;
  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      result[key] = normalizeTextbookData(item);
    }
    return result as T;
  }
  return value;
}
