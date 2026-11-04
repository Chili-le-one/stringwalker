/* Stringwalker — module de calcul pur (interpolation, polynôme)
   Fonctions indépendantes du DOM et du stockage : elles reçoivent le profil
   en paramètre, ce qui permet de les tester unitairement (tests/calc.test.js).
   Charge comme script classique (expose window.SWCalc) ou comme module Node. */
(function (global) {
  'use strict';
  const r2 = n => Math.round(n * 100) / 100;
  /* Degré du polynôme : « auto » → 2, borné par le nombre de mesures */
  const polyDegFor = (p, n) => { const q = p.deg || 'auto', m = q === 'auto' ? 2 : parseInt(q); return Math.max(1, Math.min(m, n - 1)) };
  /* Ajustement polynomial par moindres carrés (pivot de Gauss, variables centrées-réduites) */
  function polyFit(x, y, deg) {
    const n = x.length, m = deg + 1, mx = x.reduce((a, b) => a + b, 0) / n, sc = (Math.max(...x) - Math.min(...x)) || 1, t = x.map(v => (v - mx) / sc);
    const A = Array.from({ length: m }, () => new Array(m).fill(0)), b = new Array(m).fill(0);
    for (let k = 0; k < n; k++) { const pw = [1]; for (let j = 1; j < 2 * m; j++) pw[j] = pw[j - 1] * t[k]; for (let i = 0; i < m; i++) { b[i] += pw[i] * y[k]; for (let j = 0; j < m; j++) A[i][j] += pw[i + j] } }
    for (let i = 0; i < m; i++) { let q = i; for (let r = i + 1; r < m; r++) if (Math.abs(A[r][i]) > Math.abs(A[q][i])) q = r; [A[i], A[q]] = [A[q], A[i]]; [b[i], b[q]] = [b[q], b[i]];
      for (let r = i + 1; r < m; r++) { const f = A[r][i] / A[i][i]; for (let c = i; c < m; c++) A[r][c] -= f * A[i][c]; b[r] -= f * b[i] } }
    const c = new Array(m).fill(0); for (let i = m - 1; i >= 0; i--) { let v = b[i]; for (let j = i + 1; j < m; j++) v -= A[i][j] * c[j]; c[i] = v / A[i][i] }
    return { c, mx, sc };
  }
  function polyVal(f, d) { const t = (d - f.mx) / f.sc; let v = 0; for (let i = f.c.length - 1; i >= 0; i--) v = v * t + f.c[i]; return v }
  function polySlope(f, d) { const t = (d - f.mx) / f.sc; let v = 0; for (let i = f.c.length - 1; i >= 1; i--) v = v * t + i * f.c[i]; return v / f.sc }
  /* Estimation de la position (mm) pour la distance d, à partir du profil p.
     p.method : 'poly' (courbe théorique), 'linear' (interpolation linéaire),
     sinon courbe monotone (Fritsch–Carlson) avec extrapolation linéaire aux extrémités. */
  function estimateFor(p, d) {
    const M = p.measures.slice().sort((a, b) => a.dist - b.dist), n = M.length;
    if (!n) return null;
    if (p.method === 'poly' && n >= 2) {
      const xs = M.map(m => m.dist), f = polyFit(xs, M.map(m => m.mm), polyDegFor(p, n)), a = xs[0], z = xs[n - 1];
      if (d < a) return { mm: polyVal(f, a) + polySlope(f, a) * (d - a), extra: true };
      if (d > z) return { mm: polyVal(f, z) + polySlope(f, z) * (d - z), extra: true };
      return { mm: polyVal(f, d), extra: false };
    }
    const ex = M.find(m => m.dist === d); if (ex) return { mm: ex.mm, extra: false };
    if (n < 2) return null;
    const x = M.map(m => m.dist), y = M.map(m => m.mm), dl = [];
    for (let i = 0; i < n - 1; i++) dl.push((y[i + 1] - y[i]) / (x[i + 1] - x[i]));
    const m = new Array(n);
    if (p.method === 'linear') { for (let i = 0; i < n; i++) m[i] = null }
    else {
      m[0] = dl[0]; m[n - 1] = dl[n - 2];
      for (let i = 1; i < n - 1; i++) m[i] = dl[i - 1] * dl[i] > 0 ? 2 * dl[i - 1] * dl[i] / (dl[i - 1] + dl[i]) : 0;
    }
    if (d < x[0]) return { mm: r2(y[0] + (d - x[0]) * dl[0]), extra: true };
    if (d > x[n - 1]) return { mm: r2(y[n - 1] + (d - x[n - 1]) * dl[n - 2]), extra: true };
    let i = 0; while (!(x[i] < d && d < x[i + 1])) i++;
    if (m[i] === null) return { mm: r2(y[i] + (d - x[i]) * dl[i]), extra: false };
    const h = x[i + 1] - x[i], t = (d - x[i]) / h, t2 = t * t, t3 = t2 * t;
    const v = (2 * t3 - 3 * t2 + 1) * y[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * y[i + 1] + (t3 - t2) * h * m[i + 1];
    return { mm: r2(v), extra: false };
  }
  global.SWCalc = { r2, polyDegFor, polyFit, polyVal, polySlope, estimateFor };
  if (typeof module !== 'undefined' && module.exports) module.exports = global.SWCalc;
})(typeof window !== 'undefined' ? window : globalThis);
