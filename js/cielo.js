// cielo.js — 🌌 Mi cielo: las estrellas de la Constelación que cada alumno enciende al jugar.
// Cada acierto sobre un autor le da un brillo a su estrella: 1 la enciende, 3 la hace brillar, 5 es supernova.
// Se guarda en grupos/{g}/alumnos/{a}/atlas/tarea-cielo = {pinVerificado, nombre, estrellas: {autorId: brillos}, total, t}
// y también en este navegador (ep_cielo_local), para que funcione aunque el alumno no haya entrado.
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export const CIELO_DOC = 'tarea-cielo';
export const TOTAL_ESTRELLAS = 55;
export const BRILLA = 3, NOVA = 5;
export const RANGOS = [
  [0, '🌑', 'Aprendiz de astrónomo'],
  [5, '🔭', 'Observador'],
  [12, '✨', 'Curioso de las ideas'],
  [22, '🌠', 'Investigador'],
  [34, '🪐', 'Epistemólogo'],
  [46, '🌌', 'Cartógrafo del cielo'],
  [55, '👑', 'Maestro de la Constelación'],
];
export function rango(n) {
  let k = 0; RANGOS.forEach((r, i) => { if (n >= r[0]) k = i; });
  const sig = RANGOS[k + 1];
  return { ico: RANGOS[k][1], nombre: RANGOS[k][2], nivel: k, sig: sig ? { ico: sig[1], nombre: sig[2], faltan: sig[0] - n, desde: RANGOS[k][0], hasta: sig[0] } : null };
}

// Palabras que, en una pregunta o su explicación, nombran a un autor de la Constelación (sensibles a mayúsculas).
export const CLAVES_AUTOR = {
  heraclito: ['Heráclito'], platon: ['Platón'], aristoteles: ['Aristóteles'], descartes: ['Descartes', 'cartesian'], locke: ['Locke'], hume: ['Hume'], kant: ['Kant'], hegel: ['Hegel'], marx: ['Marx'],
  comte: ['Comte'], durkheim: ['Durkheim'], dilthey: ['Dilthey'], weber: ['Weber'],
  viena: ['Círculo de Viena', 'Carnap', 'positivismo lógico', 'Positivismo lógico'], bachelard: ['Bachelard'], popper: ['Popper'], kuhn: ['Kuhn'], lakatos: ['Lakatos'], feyerabend: ['Feyerabend'], polanyi: ['Polanyi'], bunge: ['Bunge'], villoro: ['Villoro'],
  bertalanffy: ['Bertalanffy', 'Teoría General de los Sistemas'], prigogine: ['Prigogine'], maturana: ['Maturana', 'Varela'], morin: ['Morin'], martinez: ['Miguélez'],
  gadamer: ['Gadamer'], habermas: ['Habermas'], freire: ['Freire'], carrkemmis: ['Kemmis'], sousa: ['Sousa Santos', 'Boaventura'], bourdieu: ['Bourdieu'],
  piaget: ['Piaget'], vygotsky: ['Vygotsky', 'Vigotsky'], schon: ['Schön'], stenhouse: ['Stenhouse'], booth: ['Ainscow', 'Booth'], parsons: ['Parsons'], super: ['Donald Super'], bisquerra: ['Bisquerra'], rogers: ['Rogers'], skinner: ['Skinner'], papert: ['Papert'],
  damasio: ['Damasio'], dehaene: ['Dehaene'], hebb: ['Hebb'], sperry: ['Sperry'], mora: ['Francisco Mora'],
  sen: ['Amartya Sen'], jonas: ['Jonas'], potter: ['Potter'], brundtland: ['Brundtland'], schultz: ['Schultz'], delors: ['Delors'],
};
const RE = Object.entries(CLAVES_AUTOR).map(([id, ks]) => [id, new RegExp(`(^|[^\\p{L}])(${ks.join('|')})`, 'u')]);
export const autoresEn = (...textos) => { const t = textos.filter(Boolean).join(' '); return RE.filter(([, r]) => r.test(t)).map(([id]) => id); };

// ---------- almacenamiento
const LS = 'ep_cielo_local', LS_YO = 'ep_cielo_yo';
const lsGet = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* */ } };
export const cieloLocal = () => lsGet(LS) || {};
// El laboratorio (otra pestaña) necesita saber quién eres para leer tu cielo; el PIN no se guarda aquí.
// Si en este navegador entra otro alumno, su cielo local empieza vacío (no hereda las estrellas del anterior).
export function recordarAlumno(sesion) {
  if (!sesion) return;
  const prev = lsGet(LS_YO);
  if (prev && (prev.grupoId !== sesion.grupoId || prev.alumnoId !== sesion.alumnoId)) { lsSet(LS, {}); CACHE = null; }
  lsSet(LS_YO, { grupoId: sesion.grupoId, alumnoId: sesion.alumnoId, nombre: sesion.nombre });
}
export function olvidarAlumno() { try { localStorage.removeItem(LS_YO); localStorage.removeItem(LS); } catch { /* */ } CACHE = null; }
export const alumnoRecordado = () => lsGet(LS_YO);
export const mezclar = (a = {}, b = {}) => { const o = { ...a }; for (const [k, v] of Object.entries(b)) o[k] = Math.max(o[k] || 0, v || 0); return o; };
export const encendidas = E => Object.values(E || {}).filter(v => v > 0).length;

let CACHE = null, CACHE_DE = '', COLA = Promise.resolve();
// Da un brillo a cada autor de «ids». Devuelve {antes, despues, nuevas: [ids encendidas por primera vez], subeRango}.
export function brillar(db, sesion, ids) {
  ids = [...new Set((ids || []).filter(id => CLAVES_AUTOR[id]))];
  const tarea = COLA.then(async () => {
    const quien = sesion ? sesion.grupoId + '/' + sesion.alumnoId : '';
    if (CACHE === null || CACHE_DE !== quien) {
      if (sesion) recordarAlumno(sesion);
      CACHE = cieloLocal(); CACHE_DE = quien;
      if (sesion) { try { const s = await getDoc(doc(db, 'grupos', sesion.grupoId, 'alumnos', sesion.alumnoId, 'atlas', CIELO_DOC)); if (s.exists()) CACHE = mezclar(CACHE, s.data().estrellas); } catch { /* sin red: seguimos con lo local */ } }
    }
    const antes = { ...CACHE }, nAntes = encendidas(antes);
    ids.forEach(id => { CACHE[id] = (CACHE[id] || 0) + 1; });
    lsSet(LS, CACHE);
    const nDesp = encendidas(CACHE);
    if (sesion && ids.length) {
      try { await setDoc(doc(db, 'grupos', sesion.grupoId, 'alumnos', sesion.alumnoId, 'atlas', CIELO_DOC), { pinVerificado: sesion.pin, nombre: sesion.nombre, estrellas: CACHE, total: nDesp, t: serverTimestamp() }); } catch { /* se sube la próxima vez */ }
    }
    return { antes, despues: { ...CACHE }, nuevas: ids.filter(id => !(antes[id] > 0)), total: nDesp, subeRango: rango(nDesp).nivel > rango(nAntes).nivel ? rango(nDesp) : null };
  });
  COLA = tarea.catch(() => {});
  return tarea;
}
