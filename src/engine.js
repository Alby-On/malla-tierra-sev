// Motor de cálculo: SEV Schlumberger, homologación, Burgsdorf-Yakobs, Schwarz
// FILT = {base:[...], j0:[...]} se inyecta antes de este archivo.
const MG = (() => {
  const LOG10 = Math.log10, PI = Math.PI;
  const MOD = 62.5; // mm por década

  // ---------- Fórmulas del curso ----------
  const K = (L, s) => PI * ((L / s) ** 2 - 0.25) * s;
  const rhoA = (L, s, VI) => K(L, s) * VI;
  const codX = L => LOG10(10 * L) * MOD;
  const codY = r => LOG10(r) * MOD;
  const decX = mm => Math.pow(10, mm / MOD) / 10;
  const decY = mm => Math.pow(10, mm / MOD);

  // ---------- Modelo directo ----------
  // Transformada de resistividad de Pekeris para n capas
  function T(lam, rho, h) {
    const n = rho.length;
    let t = rho[n - 1];
    for (let i = n - 2; i >= 0; i--) {
      const th = Math.tanh(lam * h[i]);
      t = (t + rho[i] * th) / (1 + t * th / rho[i]);
    }
    return t;
  }
  // G(r) = ∫ T(λ) J0(λr) dλ  (potencial de fuente puntual · 2π/I)
  function G(r, rho, h) {
    const b = FILT.base, w = FILT.j0, r1 = rho[0];
    let s = 0;
    for (let k = 0; k < b.length; k++) s += (T(b[k] / r, rho, h) - r1) * w[k];
    return (r1 + s) / r;
  }
  // ρa Schlumberger con MN finito (geometría real del curso)
  function rhoAmodel(L, s, rho, h) {
    const dV = (G(L - s / 2, rho, h) - G(L + s / 2, rho, h)) / PI;
    return K(L, s) * dV;
  }
  // ρa Schlumberger ideal (MN→0), como en las láminas de Orellana-Mooney
  function rhoAideal(L, rho, h) {
    const s = L * 0.02;
    return rhoAmodel(L, s, rho, h);
  }

  // ---------- Biblioteca de curvas patrón (ρ1 = 1, E1 = 1) ----------
  const U0 = -2, U1 = 5, DU = 0.05; // log10(L/E1)
  const NU = Math.round((U1 - U0) / DU) + 1;
  // Catálogo de las láminas Orellana-Mooney (CAT se inyecta antes de este archivo)
  const INF = 1e4, ZERO = 1e-4;
  const val = x => x === 'inf' ? INF : (+x === 0 ? ZERO : +x);
  const fmtR = x => x === 'inf' ? '∞' : String(x);
  let LIB = null;
  function curveOf(rho, h) {
    const out = new Float64Array(NU);
    for (let j = 0; j < NU; j++) out[j] = LOG10(rhoAideal(Math.pow(10, U0 + j * DU), rho, h));
    return out;
  }
  // Lista de curvas de una familia (para dibujarla como en la lámina)
  function familyMembers(fam) {
    if (fam.n === 2) return CAT.two.filter(m => +m !== 1 && m !== 0).map(m => ({ label: fmtR(m), mu: [1, val(m)], nu: [] }));
    if (fam.n === 3) return [{ label: '0', mu: fam.mu, nu: [ZERO] }, ...(fam.e2 || CAT.E2).map(e => ({ label: String(e), mu: fam.mu, nu: [e] })), { label: '∞', mu: fam.mu, nu: [INF] }];
    return [...CAT.codes4].map((c, k) => ({ label: c, code: c, mu: fam.mu, nu: [CAT.E2_4[k % 4], CAT.E3_4[Math.floor(k / 4)]] }));
  }
  function families() {
    const out = [{ n: 2, lam: 1, name: '2 capas', ratio: '1-ρ2', mu: null }];
    for (const [lam, name, r, e2] of CAT.f3) { const p = r.split('-'); out.push({ n: 3, lam, name, ratio: p.map(fmtR).join('-'), mu: p.map(val), e2 }); }
    for (const [lam, name, r] of CAT.f4) { const p = r.split('-'); out.push({ n: 4, lam, name, ratio: p.map(fmtR).join('-'), mu: p.map(val) }); }
    return out;
  }
  function buildLibrary() {
    if (LIB) return LIB;
    LIB = [];
    for (const m of CAT.two) { if (+m === 1 || m === 0 || m === 'inf') continue;
      LIB.push({ n: 2, lam: 1, name: '2 capas', ratio: '1-' + fmtR(m), mu: [1, val(m)], nu: [], label: fmtR(m), c: curveOf([1, val(m)], [1]) }); }
    for (const f of families()) {
      if (f.n === 2) continue;
      for (const mb of familyMembers(f)) {
        const h = [1, ...mb.nu];
        LIB.push({ n: f.n, lam: f.lam, name: f.name, ratio: f.ratio, mu: f.mu, nu: mb.nu, label: mb.label, code: mb.code, c: curveOf(f.mu, h) });
      }
    }
    return LIB;
  }
  // Superpone una curva patrón sobre los datos (desplazamiento puro en log-log)
  function matchCurve(c, lx, ly) {
    let best = { sse: Infinity };
    const lo = Math.max(...lx) - U1 + 0.01, hi = Math.min(...lx) - U0 - 0.01;
    for (let e = lo; e <= hi; e += 0.02) {
      const f = new Array(lx.length);
      let mean = 0;
      for (let i = 0; i < lx.length; i++) {
        const p = (lx[i] - e - U0) / DU, j = Math.floor(p), t = p - j;
        f[i] = c[j] * (1 - t) + c[j + 1] * t;
        mean += ly[i] - f[i];
      }
      mean /= lx.length;
      let sse = 0;
      for (let i = 0; i < lx.length; i++) sse += (ly[i] - mean - f[i]) ** 2;
      if (sse < best.sse) best = { sse, logE1: e, logR1: mean };
    }
    return best;
  }
  function homologar(Ls, rhos, nLayers) {
    const lib = buildLibrary();
    const lx = Ls.map(LOG10), ly = rhos.map(LOG10);
    const res = [];
    for (const cur of lib) {
      if (nLayers && cur.n !== nLayers) continue;
      const m = matchCurve(cur.c, lx, ly);
      if (!isFinite(m.sse)) continue;
      const E1 = Math.pow(10, m.logE1), r1 = Math.pow(10, m.logR1);
      res.push({
        n: cur.n, lam: cur.lam, name: cur.name, ratio: cur.ratio, label: cur.label, code: cur.code, mu: cur.mu, nu: cur.nu, E1, rho1: r1,
        rms: Math.sqrt(m.sse / lx.length) * Math.LN10 * 100,
        rho: cur.mu.map(x => x * r1), h: [E1, ...cur.nu.map(x => x * E1)].slice(0, cur.n - 1),
        Ec: codX(E1), rhoc: codY(r1)
      });
    }
    res.sort((a, b) => a.rms - b.rms);
    return res;
  }

  // ---------- Ajuste fino (Levenberg-Marquardt en log) ----------
  function misfit(p, n, data) {
    const rho = p.slice(0, n).map(x => Math.exp(x)), h = p.slice(n).map(x => Math.exp(x));
    return data.map(d => Math.log(rhoAmodel(d.L, d.s, rho, h)) - Math.log(d.rho));
  }
  function lm(p0, n, data, iters = 60) {
    const rs = data.map(d => d.rho), Ls = data.map(d => d.L);
    const lo = [], hi = [];
    for (let k = 0; k < p0.length; k++) {
      if (k < n) { lo.push(Math.log(Math.min(...rs) / 10)); hi.push(Math.log(Math.max(...rs) * 10)); }
      else { lo.push(Math.log(Math.min(...Ls) / 10)); hi.push(Math.log(Math.max(...Ls) * 3)); }
    }
    const clamp = q => q.map((x, k) => Math.max(lo[k], Math.min(hi[k], x)));
    let p = clamp(p0.slice()), r = misfit(p, n, data), f = r.reduce((a, x) => a + x * x, 0), lam = 1e-2;
    const m = p.length;
    for (let it = 0; it < iters; it++) {
      const J = [];
      for (let k = 0; k < m; k++) {
        const q = p.slice(); q[k] += 1e-4;
        const rk = misfit(q, n, data);
        J.push(rk.map((x, i) => (x - r[i]) / 1e-4));
      }
      const A = [], g = [];
      for (let a = 0; a < m; a++) {
        A.push([]); g.push(J[a].reduce((s, x, i) => s + x * r[i], 0));
        for (let b = 0; b < m; b++) A[a].push(J[a].reduce((s, x, i) => s + x * J[b][i], 0));
      }
      let improved = false;
      for (let tries = 0; tries < 8; tries++) {
        const M = A.map((row, a) => row.map((v, b) => v + (a === b ? lam * (A[a][a] + 1e-9) : 0)));
        const dp = solve(M, g.map(x => -x));
        if (!dp) { lam *= 10; continue; }
        const q = p.map((x, k) => x + Math.max(-1.5, Math.min(1.5, dp[k])));
        // limitar espesores y resistividades a rangos físicos
        const qc = clamp(q); for (let k = 0; k < m; k++) q[k] = qc[k];
        const rq = misfit(q, n, data), fq = rq.reduce((a, x) => a + x * x, 0);
        if (isFinite(fq) && fq < f) { p = q; r = rq; lam = Math.max(lam / 5, 1e-7); improved = (f - fq) / f > 1e-6; f = fq; break; }
        lam *= 8;
      }
      if (!improved) break;
    }
    return { p, sse: f };
  }
  function solve(A, b) {
    const n = b.length, M = A.map((r, i) => [...r, b[i]]);
    for (let c = 0; c < n; c++) {
      let piv = c;
      for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
      if (Math.abs(M[piv][c]) < 1e-14) return null;
      [M[c], M[piv]] = [M[piv], M[c]];
      for (let r = 0; r < n; r++) if (r !== c) {
        const f = M[r][c] / M[c][c];
        for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
      }
    }
    return M.map((r, i) => r[n] / r[i]);
  }
  function packModel(p, n, data, sse) {
    const rho = p.slice(0, n).map(Math.exp), h = p.slice(n).map(Math.exp);
    return { n, rho, h, rms: Math.sqrt(sse / data.length) * 100 };
  }
  function ajustar(data, hom) {
    const out = {};
    const startsFor = n => hom.filter(c => c.n === n || (n === 4 && c.n === 3)).slice(0, n === 2 ? 2 : 4);
    for (const n of [2, 3, 4]) {
      let best = null;
      const starts = [];
      for (const c of startsFor(n)) {
        if (c.n === n) starts.push([...c.rho.map(Math.log), ...c.h.map(Math.log)]);
        else {
          // insertar una capa: dividir cada capa del modelo de 3 capas
          const r = c.rho, h = c.h;
          starts.push([r[0], r[0], r[1], r[2]].map(Math.log).concat([h[0] / 2, h[0] / 2, h[1]].map(Math.log)));
          starts.push([r[0], r[1], r[1], r[2]].map(Math.log).concat([h[0], h[1] / 2, h[1] / 2].map(Math.log)));
          starts.push([r[0], r[1], r[2], r[2]].map(Math.log).concat([h[0], h[1], h[1] * 2].map(Math.log)));
          starts.push([r[0], r[1], Math.sqrt(r[1] * r[2]), r[2]].map(Math.log).concat([h[0], h[1], h[1]].map(Math.log)));
        }
      }
      if (n === 4 && out[3]) starts.push([out[3].rho[0], out[3].rho[1], out[3].rho[2], out[3].rho[2] * 0.5].map(Math.log).concat([out[3].h[0], out[3].h[1], (out[3].h[0] + out[3].h[1]) * 3].map(Math.log)), [out[3].rho[0], out[3].rho[1], out[3].rho[2], out[3].rho[2] * 2].map(Math.log).concat([out[3].h[0], out[3].h[1], (out[3].h[0] + out[3].h[1]) * 3].map(Math.log)));
      for (const s0 of starts) {
        const r = lm(s0, n, data);
        if (!best || r.sse < best.sse) best = r;
      }
      if (best) out[n] = packModel(best.p, n, data, best.sse);
    }
    // recomendación: menos capas salvo mejora clara
    let rec = 2;
    if (out[3] && out[3].rms < 0.6 * out[2].rms && out[2].rms > 2) rec = 3;
    if (rec === 3 && out[4] && out[4].rms < 0.6 * out[3].rms && out[3].rms > 2) rec = 4;
    out.rec = rec;
    return out;
  }
  function tipo(rho) {
    let s = '';
    for (let i = 1; i < rho.length - 1; i++) {
      const a = rho[i - 1], b = rho[i], c = rho[i + 1];
      s += b > a && b > c ? 'K' : b < a && b < c ? 'H' : b > a ? 'A' : 'Q';
    }
    return s || (rho[1] > rho[0] ? 'ascendente' : 'descendente');
  }

  // ---------- Burgsdorf-Yakobs ----------
  function burgsdorf(rho, h, S, b) {
    const r = Math.sqrt(S / PI), r02 = r * r - b * b, q02 = 2 * r * (r + b);
    const rows = []; let z = 0, Fprev = 0, den = 0;
    for (let i = 0; i < rho.length; i++) {
      let F, v2;
      if (i < rho.length - 1) {
        z += h[i];
        const x = z * z + q02 + r02;
        v2 = 0.5 * (x - Math.sqrt(x * x - 4 * q02 * r02));
        F = Math.sqrt(Math.max(0, 1 - v2 / r02));
      } else { v2 = 0; F = 1; }
      den += (F - Fprev) / rho[i];
      rows.push({ i: i + 1, z: i < rho.length - 1 ? z : Infinity, v2, F, rho: rho[i] });
      Fprev = F;
    }
    return { r, r02, q02, rows, rhoEq: 1 / den };
  }

  // ---------- Schwarz (malla sola, IEEE 80) ----------
  // Coeficientes de Schwarz (expresiones analíticas originales, IEEE 80 ec. 54-55 en forma de curvas)
  function k12(x, hRel) { // x = largo/ancho, hRel = h/√S
    return [1.43 - 2.3 * hRel - 0.044 * x, 5.50 - 8 * hRel + (0.15 - hRel) * x];
  }
  function malla(g) {
    const largo = Math.max(g.a, g.b), ancho = Math.min(g.a, g.b);
    const nL = Math.round(ancho / g.ca) + 1; // conductores paralelos al largo
    const nA = Math.round(largo / g.cl) + 1; // conductores paralelos al ancho
    const Lt = nL * largo + nA * ancho, S = largo * ancho;
    const d = g.d, hp = Math.sqrt(d * g.h), x = largo / ancho;
    const [k1, k2] = k12(x, g.h / Math.sqrt(S));
    return { largo, ancho, nL, nA, Lt, S, d, hp, x, k1, k2 };
  }
  function schwarz(rhoEq, m) {
    return rhoEq / (PI * m.Lt) * (Math.log(2 * m.Lt / m.hp) + m.k1 * m.Lt / Math.sqrt(m.S) - m.k2);
  }
  function laurent(rhoEq, m) { return rhoEq / (4 * Math.sqrt(m.S / PI)) + rhoEq / m.Lt; }


  // ---------- Schwarz completo: malla + barras + resistencia mutua (guía de Schwarz) ----------
  function sistema(p) { // p: rhoEq, a, b, Lc, h, d, n, Lb, rb
    const a = Math.max(p.a, p.b), b = Math.min(p.a, p.b), A = a * b, sA = Math.sqrt(A), x = a / b, hRel = p.h / sA;
    const ap = Math.sqrt(p.d * p.h), K1 = 1.43 - 2.3 * hRel - 0.044 * x, K2 = 5.50 - 8 * hRel + (0.15 - hRel) * x;
    const f = p.rhoEq / (PI * p.Lc);
    const R1 = f * (Math.log(2 * p.Lc / ap) + K1 * p.Lc / sA - K2);
    const o = { A, sA, x, hRel, valid: hRel <= 1 / 6 + 1e-9, ap, K1, K2, f, R1, RT: R1 };
    if (p.n > 0 && p.Lb > 0 && p.rb > 0) {
      o.R2 = p.rhoEq / (2 * PI * p.n * p.Lb) * (Math.log(4 * p.Lb / p.rb) - 1 + 2 * K1 * (p.Lb / sA) * (Math.sqrt(p.n) - 1) ** 2);
      o.Rm = f * (Math.log(2 * p.Lc / p.Lb) + K1 * p.Lc / sA - K2 + 1);
      o.Rm2 = R1 - f * (Math.log(p.Lb / ap) - 1);
      o.RT = (R1 * o.R2 - o.Rm ** 2) / (R1 + o.R2 - 2 * o.Rm);
      o.Rpar = R1 * o.R2 / (R1 + o.R2);
      o.senseOk = o.Rpar < o.RT && o.RT < Math.min(R1, o.R2);
    }
    return o;
  }
  // Barra sola
  function barra(rho, Lb, rb) { return rho / (2 * PI * Lb) * (Math.log(4 * Lb / rb) - 1); }
  // Resistividad que ve una barra: media ponderada (en paralelo) de las capas que atraviesa
  function rhoBarra(rho, h, t, Lb) {
    let z = 0, g = 0;
    for (let i = 0; i < rho.length; i++) {
      const top = z, bot = i < h.length ? z + h[i] : Infinity;
      const seg = Math.max(0, Math.min(bot, t + Lb) - Math.max(top, t));
      g += seg / rho[i]; z = bot;
    }
    return Lb / g;
  }
  // Corriente real de falla monofásica (guía): If = 3·VL / [√3·√((3R)² + XΣ²)]
  function fallaIf(VL, X, R) { return 3 * VL / (Math.sqrt(3) * Math.sqrt((3 * R) ** 2 + X * X)); }


  // ---------- Media y alta tensión (guías de resistencia máxima y de tensiones de contacto y paso) ----------
  // Parámetros de la red a partir de los niveles de cortocircuito (VL en V)
  function red(p) { // p: VL (V), Icc3, Icc1, ST (kVA, opcional)
    const X1 = p.VL / (Math.sqrt(3) * p.Icc3), X2 = X1;
    const X0 = 3 * p.VL / (Math.sqrt(3) * p.Icc1) - (X1 + X2);
    const o = { X1, X2, X0, SX: X0 + X1 + X2 };
    if (p.ST > 0) o.IA = 1.5 * p.ST / (Math.sqrt(3) * p.VL / 1000);
    return o;
  }
  // Resistencia máxima: Rmáx = (1/3)·√(3·VL²/Ifaux² − ΣX²)
  function rmax(VL, Ifaux, SX) { const q = 3 * VL * VL / (Ifaux * Ifaux) - SX * SX; return q > 0 ? Math.sqrt(q) / 3 : NaN; }
  // Tiempo de operación del fusible: interpolación log-log en la tabla tiempo–corriente
  function fusible(tabla, I, col) { // tabla: [{t, imin, iclr}], col: 'iclr' o 'imin'
    const pts = tabla.filter(r => r.t > 0 && r[col] > 0).map(r => [r[col], r.t]).sort((a, b) => a[0] - b[0]);
    if (pts.length < 2 || !(I > 0)) return { estado: 'sin datos' };
    if (I < pts[0][0]) return { estado: 'no opera', t: Infinity };
    if (I > pts[pts.length - 1][0]) return { estado: 'menor', t: pts[pts.length - 1][1] };
    for (let k = 0; k < pts.length - 1; k++) {
      const [i1, t1] = pts[k], [i2, t2] = pts[k + 1];
      if (I >= i1 && I <= i2) { const f = (Math.log(I) - Math.log(i1)) / (Math.log(i2) - Math.log(i1)); return { estado: 'ok', t: Math.exp(Math.log(t1) + f * (Math.log(t2) - Math.log(t1))) }; }
    }
    return { estado: 'sin datos' };
  }
  // Factor de decremento (Colman 2020, tabla 8.1), interpolación lineal
  const FDT = [[0.01, 1.70], [0.02, 1.62], [0.04, 1.50], [0.08, 1.32], [0.1, 1.25], [0.25, 1.10], [0.5, 1.00]];
  function fd(t) {
    if (t <= FDT[0][0]) return FDT[0][1]; if (t >= 0.5) return 1;
    for (let k = 0; k < FDT.length - 1; k++) { const [a, fa] = FDT[k], [b, fb] = FDT[k + 1]; if (t >= a && t <= b) return fa + (fb - fa) * (t - a) / (b - a); }
    return 1;
  }
  // Constante de Onderdonk para cobre y sección mínima: Smín = K·If·FD·√t / 1973
  function kCu(Tm, Ta) { return Math.sqrt(33 / LOG10((Tm - Ta) / (234 + Ta) + 1)); }
  function smin(K, I, FD, t) { return K * I * FD * Math.sqrt(t) / 1973; }
  // Tensiones tolerables por el cuerpo (IEEE 80-2013), 50 kg: 0,116 · 70 kg: 0,157
  function cs(rhoS, hs, rho) { return 1 - 0.09 * (1 - rho / rhoS) / (2 * hs + 0.09); }
  function tolerables(p) { // p: rhoS, Cs, t, kg
    const k = p.kg === 70 ? 0.157 : 0.116, IB = k / Math.sqrt(p.t);
    return { IB, Etc: (1000 + 1.5 * p.Cs * p.rhoS) * IB, Etp: (1000 + 6 * p.Cs * p.rhoS) * IB };
  }
  // Tensión de malla y de paso (IEEE 80-2013)
  function tensiones(p) { // p: rhoEq, IG, Lc, a, b, D, h, d, nb (barras), Lb, perim (barras en esquinas/perímetro)
    const Lx = Math.max(p.a, p.b), Ly = Math.min(p.a, p.b), A = Lx * Ly, Lp = 2 * (Lx + Ly);
    const na = 2 * p.Lc / Lp, nbF = Math.sqrt(Lp / (4 * Math.sqrt(A))), n = na * nbF;
    const LR = (p.nb || 0) * (p.Lb || 0), D = p.D, h = p.h, d = p.d;
    const Kii = LR > 0 && p.perim ? 1 : 1 / Math.pow(2 * n, 2 / n);
    const Kh = Math.sqrt(1 + h / 1);
    const arg = D * D / (16 * h * d) + (D + 2 * h) ** 2 / (8 * D * d) - h / (4 * d);
    const Km = (Math.log(arg) + Kii / Kh * Math.log(8 / (PI * (2 * n - 1)))) / (2 * PI);
    const Ks = (1 / (2 * h) + 1 / (D + h) + (1 - Math.pow(0.5, n - 2)) / D) / PI;
    const Ki = 0.644 + 0.148 * n;
    const LM = LR > 0 && p.perim ? p.Lc + (1.55 + 1.22 * p.Lb / Math.sqrt(Lx * Lx + Ly * Ly)) * LR : p.Lc + LR;
    const LS = 0.75 * p.Lc + 0.85 * LR;
    const f = p.rhoEq * Ki * p.IG;
    const valid = { n: n <= 25, h: h >= 0.25 && h <= 2.5, d: d < 0.25 * h, D: D >= 2.5 };
    return { Lx, Ly, A, Lp, na, nbF, n, LR, Kii, Kh, Km, Ks, Ki, LM, LS, f, Em: Km * f / LM, Es: Ks * f / LS, valid, inRange: Object.values(valid).every(Boolean) };
  }

  // ---------- Sección mínima (Onderdonk) ----------
  function onderdonk(IkA, t, Ta, Tm) {
    const cmil = IkA * 1000 * Math.sqrt(33 * t / LOG10((Tm - Ta) / (234 + Ta) + 1));
    return { cmil, mm2: cmil * 5.067075e-4 };
  }

  return { K, rhoA, codX, codY, decX, decY, T, G, rhoAmodel, rhoAideal, homologar, ajustar, tipo, burgsdorf, malla, schwarz, laurent, onderdonk, sistema, barra, rhoBarra, fallaIf, red, rmax, fusible, fd, kCu, smin, cs, tolerables, tensiones, buildLibrary, families, familyMembers, curveOf };
})();
if (typeof module !== 'undefined') module.exports = MG;
