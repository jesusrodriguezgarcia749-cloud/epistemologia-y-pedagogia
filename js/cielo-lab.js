// cielo-lab.js — lleva «Mi cielo» (o el cielo del grupo) a la Constelación del Laboratorio.
// laboratorio.js no es módulo: aquí se leen los datos y se le avisan con el evento «ep-cielo».
//   laboratorio.html#constelacion            → el cielo del alumno que entró en Tareas (o el de este navegador)
//   laboratorio.html?cielo=GRUPO#constelacion → el cielo de todo el grupo, para proyectar en vivo
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, getDocs, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";
import { CIELO_DOC, RANGOS, rango, cieloLocal, alumnoRecordado, mezclar, encendidas, estrellasDe, estadoAutor, misionPorFecha, BRILLA, NOVA, TOTAL_ESTRELLAS, TIPOS_PARA_ENCENDER, NOMBRE_TIPO } from "./cielo.js";

const db = getFirestore(initializeApp(firebaseConfig));
const avisar = d => { window.EP_CIELO = { BRILLA, NOVA, TIPOS: TIPOS_PARA_ENCENDER, NOMBRE_TIPO, TOTAL: TOTAL_ESTRELLAS, RANGOS, ...d }; window.dispatchEvent(new CustomEvent('ep-cielo', { detail: window.EP_CIELO })); };
const grupo = new URLSearchParams(location.search).get('cielo');
let mision = misionPorFecha();
const escucharMision = (g, despues) => onSnapshot(doc(db, 'grupos', g), s => { const m = s.exists() && s.data().cieloMision; mision = m && m !== 'auto' ? m : misionPorFecha(); despues(); }, () => {});

if (grupo) {
  // ---------- cielo del grupo
  const por = {}; let nombre = '', alumnos = [];
  const pintar = () => {
    const cuenta = {}, ranking = [];
    alumnos.forEach(a => { const E = por[a.id], n = E ? encendidas(E) : 0; if (n) ranking.push({ nombre: a.nombre, n, r: rango(n) }); Object.keys(E ? estrellasDe(E) : {}).forEach(k => { cuenta[k] = (cuenta[k] || 0) + 1; }); });
    ranking.sort((x, y) => y.n - x.n || x.nombre.localeCompare(y.nombre));
    avisar({ modo: 'grupo', nombre, alumnos: alumnos.length, jugando: ranking.length, cuenta, ranking, mision });
  };
  (async () => {
    try { const g = await getDoc(doc(db, 'grupos', grupo)); nombre = g.exists() ? g.data().nombre || '' : ''; } catch { /* */ }
    try { const sn = await getDocs(collection(db, 'grupos', grupo, 'alumnos')); alumnos = sn.docs.map(d => ({ id: d.id, nombre: d.data().nombre || d.id })); }
    catch { avisar({ modo: 'grupo', error: 'No se pudo leer el grupo. Revisa la conexión.' }); return; }
    pintar(); escucharMision(grupo, pintar);
    alumnos.forEach(a => onSnapshot(doc(db, 'grupos', grupo, 'alumnos', a.id, 'atlas', CIELO_DOC), s => { por[a.id] = s.exists() ? s.data() : null; pintar(); }, () => {}));
  })();
} else {
  // ---------- mi cielo
  const yo = alumnoRecordado(); let S = cieloLocal();
  const pintar = () => {
    const ids = new Set([...Object.keys(S.ac), ...Object.keys(S.desc)]), estados = {};
    ids.forEach(id => { estados[id] = estadoAutor(S, id); estados[id].tiposDe = Object.keys(S.ac[id] || {}).filter(t => t !== 'pista'); });
    const n = encendidas(S); avisar({ modo: 'mio', yo, estados, total: n, rango: rango(n), mision });
  };
  pintar();
  if (yo) {
    escucharMision(yo.grupoId, pintar);
    onSnapshot(doc(db, 'grupos', yo.grupoId, 'alumnos', yo.alumnoId, 'atlas', CIELO_DOC), s => { if (s.exists()) { S = mezclar(cieloLocal(), s.data()); pintar(); } }, () => {});
  }
  window.addEventListener('storage', e => { if (e.key === 'ep_cielo_local') { S = mezclar(S, cieloLocal()); pintar(); } });
}
