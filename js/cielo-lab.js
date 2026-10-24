// cielo-lab.js — lleva «Mi cielo» (o el cielo del grupo) a la Constelación del Laboratorio.
// laboratorio.js no es módulo: aquí se leen los datos y se le avisan con el evento «ep-cielo».
//   laboratorio.html#constelacion            → el cielo del alumno que entró en Tareas (o el de este navegador)
//   laboratorio.html?cielo=GRUPO#constelacion → el cielo de todo el grupo, para proyectar en vivo
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, getDocs, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";
import { CIELO_DOC, RANGOS, rango, cieloLocal, alumnoRecordado, mezclar, encendidas, BRILLA, NOVA, TOTAL_ESTRELLAS } from "./cielo.js";

const db = getFirestore(initializeApp(firebaseConfig));
const avisar = d => { window.EP_CIELO = { BRILLA, NOVA, TOTAL: TOTAL_ESTRELLAS, RANGOS, ...d }; window.dispatchEvent(new CustomEvent('ep-cielo', { detail: window.EP_CIELO })); };
const grupo = new URLSearchParams(location.search).get('cielo');

if (grupo) {
  // ---------- cielo del grupo
  const por = {}; let nombre = '', alumnos = [];
  const pintar = () => {
    const cuenta = {}, ranking = [];
    alumnos.forEach(a => { const E = por[a.id] || {}, n = encendidas(E); if (n) ranking.push({ nombre: a.nombre, n, r: rango(n) }); Object.entries(E).forEach(([k, v]) => { if (v > 0) cuenta[k] = (cuenta[k] || 0) + 1; }); });
    ranking.sort((x, y) => y.n - x.n || x.nombre.localeCompare(y.nombre));
    avisar({ modo: 'grupo', nombre, alumnos: alumnos.length, jugando: ranking.length, cuenta, ranking });
  };
  (async () => {
    try { const g = await getDoc(doc(db, 'grupos', grupo)); nombre = g.exists() ? g.data().nombre || '' : ''; } catch { /* */ }
    try { const sn = await getDocs(collection(db, 'grupos', grupo, 'alumnos')); alumnos = sn.docs.map(d => ({ id: d.id, nombre: d.data().nombre || d.id })); }
    catch { avisar({ modo: 'grupo', error: 'No se pudo leer el grupo. Revisa la conexión.' }); return; }
    pintar();
    alumnos.forEach(a => onSnapshot(doc(db, 'grupos', grupo, 'alumnos', a.id, 'atlas', CIELO_DOC), s => { por[a.id] = s.exists() ? s.data().estrellas || {} : {}; pintar(); }, () => {}));
  })();
} else {
  // ---------- mi cielo
  const yo = alumnoRecordado(); let E = cieloLocal();
  const pintar = () => { const n = encendidas(E); avisar({ modo: 'mio', yo, estrellas: E, total: n, rango: rango(n) }); };
  pintar();
  if (yo) onSnapshot(doc(db, 'grupos', yo.grupoId, 'alumnos', yo.alumnoId, 'atlas', CIELO_DOC), s => { if (s.exists()) { E = mezclar(cieloLocal(), s.data().estrellas); pintar(); } }, () => {});
  window.addEventListener('storage', e => { if (e.key === 'ep_cielo_local') { E = mezclar(E, cieloLocal()); pintar(); } });
}
