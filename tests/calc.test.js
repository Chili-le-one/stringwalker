/* Tests unitaires du module de calcul Stringwalker (calc.js).
   Les fonctions sont pures : elles reçoivent un profil, pas le DOM ni localStorage. */
import { describe, expect, test } from 'vitest';
import SWCalc from '../calc.js';

/* Profil d'exemple : palette 0–35 mm, 10 coutures, 2 mesures connues */
const prof = (over = {}) => ({
  id: 'x', name: 'Test', first: 0, last: 35, count: 10, direction: 'up',
  method: 'poly', prot: 'tab',
  measures: [{ id: '1', dist: 18, mm: 11 }, { id: '2', dist: 30, mm: 25 }],
  ...over,
});
const r2 = SWCalc.r2;

describe('estimateFor — méthode linéaire', () => {
  const p = prof({ method: 'linear' });
  test('mesure exacte : la valeur saisie est renvoyée telle quelle', () => {
    expect(SWCalc.estimateFor(p, 18)).toEqual({ mm: 11, extra: false });
    expect(SWCalc.estimateFor(p, 30)).toEqual({ mm: 25, extra: false });
  });
  test('interpolation entre 18 m/11 mm et 30 m/25 mm : à 24 m → 18 mm', () => {
    expect(SWCalc.estimateFor(p, 24)).toEqual({ mm: 18, extra: false });
  });
  test('extrapolation avant la première mesure : linéaire, marquée extra', () => {
    // pente = (25-11)/(30-18) = 14/12 ; à 12 m : 11 - 6*14/12 = 4
    expect(SWCalc.estimateFor(p, 12)).toEqual({ mm: r2(4), extra: true });
  });
  test('extrapolation après la dernière mesure : linéaire, marquée extra', () => {
    // à 36 m : 25 + 6*14/12 = 32
    expect(SWCalc.estimateFor(p, 36)).toEqual({ mm: r2(32), extra: true });
  });
});

describe('estimateFor — courbe monotone (méthode par défaut, non linéaire, non poly)', () => {
  const p = prof({ method: 'curve' });
  test('avec 2 mesures, le résultat est identique au linéaire (une seule pente)', () => {
    expect(SWCalc.estimateFor(p, 24)).toEqual({ mm: 18, extra: false });
  });
  test('trois mesures monotones : la valeur reste dans la plage [min, max] des mesures', () => {
    const p3 = prof({
      method: 'curve',
      measures: [{ dist: 10, mm: 2 }, { dist: 20, mm: 10 }, { dist: 40, mm: 34 }],
    });
    for (const d of [12, 15, 25, 30, 38]) {
      const e = SWCalc.estimateFor(p3, d);
      expect(e).not.toBeNull();
      expect(e.extra).toBe(false);
      expect(e.mm).toBeGreaterThanOrEqual(2);
      expect(e.mm).toBeLessThanOrEqual(34);
    }
  });
});

describe('estimateFor — polynôme (méthode par défaut de l\'appli)', () => {
  const p = prof({ method: 'poly' });
  test('2 mesures → degré 1 : passe exactement par les 2 points', () => {
    expect(SWCalc.polyDegFor(p, 2)).toBe(1);
    expect(SWCalc.estimateFor(p, 18).mm).toBeCloseTo(11, 5);
    expect(SWCalc.estimateFor(p, 30).mm).toBeCloseTo(25, 5);
  });
  test('3 mesures → degré auto 2 : passe exactement par les 3 points', () => {
    const p3 = prof({
      measures: [{ dist: 10, mm: 2 }, { dist: 20, mm: 10 }, { dist: 40, mm: 34 }],
    });
    expect(SWCalc.polyDegFor(p3, 3)).toBe(2);
    for (const m of p3.measures) {
      expect(SWCalc.estimateFor(p3, m.dist).mm).toBeCloseTo(m.mm, 5);
      expect(SWCalc.estimateFor(p3, m.dist).extra).toBe(false);
    }
  });
  test('extrapolation : suit la tangente au point extrême, marquée extra', () => {
    const e = SWCalc.estimateFor(p, 36);
    expect(e.extra).toBe(true);
    // tangente en 30 m : 25 + 6 * pente_polynôme ; pente = 14/12, tolérance arrondi
    expect(e.mm).toBeGreaterThan(31);
    expect(e.mm).toBeLessThan(33);
  });
});

describe('estimateFor — cas limites', () => {
  test('aucune mesure → null', () => {
    expect(SWCalc.estimateFor(prof({ measures: [] }), 20)).toBeNull();
  });
  test('une seule mesure → null en dehors, valeur exacte dessus', () => {
    const p1 = prof({ measures: [{ id: '1', dist: 20, mm: 12 }] });
    expect(SWCalc.estimateFor(p1, 20)).toEqual({ mm: 12, extra: false });
    expect(SWCalc.estimateFor(p1, 25)).toBeNull();
  });
  test('les mesures sont triées par distance avant calcul (ordre de saisie libre)', () => {
    const p = prof({ method: 'linear', measures: [{ dist: 30, mm: 25 }, { dist: 18, mm: 11 }] });
    expect(SWCalc.estimateFor(p, 24)).toEqual({ mm: 18, extra: false });
  });
});

describe('polyFit / polyVal / polySlope', () => {
  test('ajustement exact d\'une droite', () => {
    const x = [0, 1, 2], y = [3, 5, 7]; // y = 2x + 3
    const f = SWCalc.polyFit(x, y, 1);
    expect(SWCalc.polyVal(f, 10)).toBeCloseTo(23, 6);
    expect(SWCalc.polyVal(f, -2)).toBeCloseTo(-1, 6);
  });
  test('ajustement exact d\'une parabole', () => {
    const x = [-1, 0, 1], y = [2, 1, 2]; // y = x² + 1
    const f = SWCalc.polyFit(x, y, 2);
    expect(SWCalc.polyVal(f, 2)).toBeCloseTo(5, 6);
    expect(SWCalc.polySlope(f, 0)).toBeCloseTo(0, 6);
  });
  test('degré borné : jamais plus grand que le nombre de points - 1', () => {
    expect(SWCalc.polyDegFor(prof({ deg: 'auto' }), 2)).toBe(1);
    expect(SWCalc.polyDegFor(prof({ deg: 'auto' }), 5)).toBe(2);
    expect(SWCalc.polyDegFor(prof({ deg: '3' }), 3)).toBe(2);
    expect(SWCalc.polyDegFor(prof({ deg: '1' }), 5)).toBe(1);
  });
});
