// Prueba con los ejemplos 9.1 y 9.2 de la guía "Resistencia de un SPT por el método de Schwarz"
global.FILT = require('./filt.json'); global.CAT = require('./catalog.json');
const MG = require('./engine.js');
const d = Math.sqrt(4 * 25 / Math.PI) / 1000; // 25 mm² -> 5,64 mm
const casos = [
  ['9.1', { rhoEq: 85, a: 6, b: 4, Lc: 34, h: 0.6, d, n: 4, Lb: 3, rb: 0.0079 }, { R1: 7.97, R2: 8.63, Rm: 5.63, RT: 6.94, If: 1344 }],
  ['9.2', { rhoEq: 97.09, a: 2, b: 2, Lc: 12, h: 1, d, n: 4, Lb: 3, rb: 0.0079 }, { R1: 15.54, R2: 9.06, Rm: 8.62, RT: 9.03, If: 1161 }],
];
let ok = true;
for (const [n, p, esp] of casos) {
  const o = MG.sistema(p), If = MG.fallaIf(23000, 21.078, o.RT);
  const got = { R1: +o.R1.toFixed(2), R2: +o.R2.toFixed(2), Rm: +o.Rm.toFixed(2), RT: +o.RT.toFixed(2), If: Math.round(If) };
  const pass = Object.keys(esp).every(k => Math.abs(got[k] - esp[k]) <= (k === 'If' ? 1 : 0.01));
  ok = ok && pass;
  console.log(`Ejemplo ${n}:`, got, pass ? 'OK' : 'DIFERENCIA', o.valid ? '(en rango)' : '(fuera de rango)');
}
process.exit(ok ? 0 : 1);
