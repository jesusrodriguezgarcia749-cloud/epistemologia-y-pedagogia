// cielo.js — 🌌 Mi cielo: las estrellas de la Constelación que cada alumno enciende al jugar.
// Para que adivinar no sirva, una estrella se ENCIENDE cuando el alumno acierta sobre ese autor en DOS tipos de pregunta
// distintos (su frase, su idea, su concepto, su ejemplo en el aula, su gancho, la Arena, el Tribunal…). Con un solo tipo
// queda en «chispa». Cada acierto suma brillo: BRILLA y NOVA puntos. Si pidió pista, el acierto vale medio y no cuenta como tipo.
// Se guarda en grupos/{g}/alumnos/{a}/atlas/tarea-cielo = {pinVerificado, nombre, ac: {autor: {tipo: n}}, desc: {autor: 1},
//   estrellas: {autor: brillo de las encendidas}, total, t}
// y también en este navegador (ep_cielo_local), para que funcione aunque el alumno no haya entrado.
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export const CIELO_DOC = 'tarea-cielo';
export const TOTAL_ESTRELLAS = 55;
export const BRILLA = 4, NOVA = 7, TIPOS_PARA_ENCENDER = 2;
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

// ---------- modelo
export const vacio = () => ({ ac: {}, desc: {} });
// Acepta el formato nuevo o el viejo ({autor: brillos}) y devuelve {ac, desc}.
export function normal(x) {
  if (!x) return vacio();
  if (x.ac || x.desc) return { ac: x.ac || {}, desc: x.desc || {} };
  const o = vacio(), src = x.estrellas && typeof x.estrellas === 'object' ? x.estrellas : x;
  for (const [k, v] of Object.entries(src)) if (CLAVES_AUTOR[k] && typeof v === 'number' && v > 0) o.ac[k] = { antes: v }; return o;
}
export function mezclar(a, b) {
  a = normal(a); b = normal(b); const o = { ac: {}, desc: { ...a.desc, ...b.desc } };
  for (const id of new Set([...Object.keys(a.ac), ...Object.keys(b.ac)])) { const x = a.ac[id] || {}, y = b.ac[id] || {}; o.ac[id] = {}; for (const t of new Set([...Object.keys(x), ...Object.keys(y)])) o.ac[id][t] = Math.max(x[t] || 0, y[t] || 0); }
  return o;
}
// Estado de un autor: apagada → descubierta (leyó su tarjeta) → chispa (1 tipo) → encendida (2 tipos) → brilla → nova.
export function estadoAutor(S, id) {
  const ac = (S.ac || {})[id] || {}, tipos = Object.entries(ac).filter(([t, n]) => t !== 'pista' && n >= 1).length;
  const pts = Object.entries(ac).reduce((s, [t, n]) => s + (t === 'pista' ? n / 2 : n), 0);
  const est = tipos >= TIPOS_PARA_ENCENDER ? (pts >= NOVA ? 'nova' : pts >= BRILLA ? 'brilla' : 'encendida') : pts > 0 ? 'chispa' : (S.desc || {})[id] ? 'descubierta' : 'apagada';
  return { est, tipos, pts, encendida: tipos >= TIPOS_PARA_ENCENDER };
}
export const estrellasDe = S => Object.fromEntries(Object.keys(normal(S).ac).map(id => [id, estadoAutor(normal(S), id)]).filter(([, e]) => e.encendida).map(([id, e]) => [id, e.pts]));
export const encendidas = S => Object.keys(estrellasDe(S)).length;
export const NOMBRE_TIPO = { frase: 'su frase', obra: 'su obra', idea: 'su idea', concepto: 'su concepto', aula: 'su ejemplo en el aula', gancho: 'su gancho', arena: 'la Arena', paradigma: '¿Qué paradigma es?', tribunal: 'el Tribunal', antes: 'tus juegos' };

// ---------- almacenamiento
const LS = 'ep_cielo_local', LS_YO = 'ep_cielo_yo';
const lsGet = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* */ } };
export const cieloLocal = () => normal(lsGet(LS));
// El laboratorio (otra pestaña) necesita saber quién eres para leer tu cielo; el PIN no se guarda aquí.
// Si en este navegador entra otro alumno, su cielo local empieza vacío (no hereda las estrellas del anterior).
export function recordarAlumno(sesion) {
  if (!sesion) return;
  const prev = lsGet(LS_YO);
  if (prev && (prev.grupoId !== sesion.grupoId || prev.alumnoId !== sesion.alumnoId)) { lsSet(LS, vacio()); CACHE = null; }
  lsSet(LS_YO, { grupoId: sesion.grupoId, alumnoId: sesion.alumnoId, nombre: sesion.nombre });
}
export function olvidarAlumno() { try { localStorage.removeItem(LS_YO); localStorage.removeItem(LS); } catch { /* */ } CACHE = null; }
export const alumnoRecordado = () => lsGet(LS_YO);

let CACHE = null, CACHE_DE = '', COLA = Promise.resolve();
const refDe = (db, sesion) => doc(db, 'grupos', sesion.grupoId, 'alumnos', sesion.alumnoId, 'atlas', CIELO_DOC);
function conCache(db, sesion, fn) {
  const tarea = COLA.then(async () => {
    const quien = sesion ? sesion.grupoId + '/' + sesion.alumnoId : '';
    if (CACHE === null || CACHE_DE !== quien) {
      if (sesion) recordarAlumno(sesion);
      CACHE = cieloLocal(); CACHE_DE = quien;
      if (sesion) { try { const s = await getDoc(refDe(db, sesion)); if (s.exists()) CACHE = mezclar(CACHE, s.data()); } catch { /* sin red: seguimos con lo local */ } }
    }
    const r = fn(CACHE);
    lsSet(LS, CACHE);
    if (sesion && r.cambio) {
      try { await setDoc(refDe(db, sesion), { pinVerificado: sesion.pin, nombre: sesion.nombre, ac: CACHE.ac, desc: CACHE.desc, estrellas: estrellasDe(CACHE), total: encendidas(CACHE), t: serverTimestamp() }); } catch { /* se sube la próxima vez */ }
    }
    return r;
  });
  COLA = tarea.catch(() => {});
  return tarea;
}
// Un acierto de tipo «tipo» sobre cada autor de «ids». Devuelve {progreso: [{id, antes, ahora, nueva}], nuevas, total, subeRango}.
export function brillar(db, sesion, ids, tipo = 'juego', { pista = false } = {}) {
  ids = [...new Set((ids || []).filter(id => CLAVES_AUTOR[id]))];
  return conCache(db, sesion, S => {
    const nAntes = encendidas(S), progreso = ids.map(id => {
      const antes = estadoAutor(S, id), t = pista ? 'pista' : tipo;
      S.ac[id] = S.ac[id] || {}; S.ac[id][t] = (S.ac[id][t] || 0) + 1;
      const ahora = estadoAutor(S, id);
      return { id, antes, ahora, nueva: ahora.encendida && !antes.encendida, tipoNuevo: !pista && S.ac[id][t] === 1, tipo: t };
    });
    const total = encendidas(S);
    return { cambio: ids.length > 0, progreso, nuevas: progreso.filter(x => x.nueva).map(x => x.id), total, subeRango: rango(total).nivel > rango(nAntes).nivel ? rango(total) : null, tipos: (id) => Object.keys(S.ac[id] || {}).filter(t => t !== 'pista') };
  });
}
// Leyó la tarjeta del autor.
export function descubrir(db, sesion, id) {
  return conCache(db, sesion, S => { const cambio = !S.desc[id]; S.desc[id] = 1; return { cambio }; });
}
export function miCielo(db, sesion) { return conCache(db, sesion, S => ({ cambio: false, S: JSON.parse(JSON.stringify(S)) })).then(r => r.S); }
// La misión de la semana: la elige el docente (grupos/{g}.cieloMision); si no, por fecha.
export const misionPorFecha = (hoy = new Date()) => { const d = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`; return d >= '2026-10-27' ? 't4' : 't3'; };
