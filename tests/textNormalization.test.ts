import { describe, expect, it } from 'vitest';
import { normalizeTextbookText } from '../src/utils/textNormalization';

describe('textbook text normalization', () => {
  it('repairs embedded font ligature artifacts', () => {
    expect(normalizeTextbookText('What is its direcƟon?')).toBe('What is its direction?');
    expect(normalizeTextbookText('acceleraƟon')).toBe('acceleration');
    expect(normalizeTextbookText('combusƟon eĸciency')).toBe('combustion efficiency');
    expect(normalizeTextbookText('Ňue gas')).toBe('flue gas');
  });

  it('repairs common dropped-letter extraction artifacts', () => {
    expect(normalizeTextbookText('Tis is the teoreƟcal value.')).toBe('This is the theoretical value.');
    expect(normalizeTextbookText('Te shif engineer checked the shaf afer startup.')).toBe('The shift engineer checked the shaft after startup.');
    expect(normalizeTextbookText('Externally Àred boiler with SpeciÀc heat.')).toBe('Externally fired boiler with Specific heat.');
    expect(normalizeTextbookText('Tree common types are used. Ten, they are checked on Tursday.')).toBe('Three common types are used. Then, they are checked on Thursday.');
  });
});
