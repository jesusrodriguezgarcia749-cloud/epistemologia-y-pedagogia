// actividades.js — Actividades de repaso con valor.
// Desde el Parcial 2 valen 15 de los 25 puntos de participación. El alumno
// entra con su nombre y PIN, elige un tema y responde. Las preguntas que
// falla vuelven a aparecer en la siguiente ronda, hasta que todas le salgan
// bien: en ese momento el tema queda TERMINADO y se guarda en Firestore
// (alumnos/{id}/actividades/tema-N). El avance parcial se recuerda en el
// navegador. Los temas que no cuentan en el bloque actual quedan como
// repaso libre.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, doc, getDoc, setDoc, collection, getDocs, query, orderBy, serverTimestamp, increment
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";
import { elegirConCuotas } from "./seleccion-examen.js?v=2026111801";
import { ACTIVIDADES_PARCIAL, NOMBRES_PARCIAL, PARTICIPACION_MIXTA, CIERRE_ACTIVIDADES, actividadesAbiertas, textoCierre } from "./calculo.js";
// Fecha en que terminó cada tema: lo terminado después del cierre del parcial ya no suma (igual que en el cálculo).
let fechaTema = {};
const msF = f => f && typeof f.toMillis === 'function' ? f.toMillis() : null;
const tarde = (p, n) => { const c = CIERRE_ACTIVIDADES[p], ms = fechaTema[n]; return !!(c && ms && ms > Date.parse(c)); };

// ------------------------------------------------------------ configuración
const SESSION_KEY = 'ep_sesion_alumno';
const TEMAS_INFO = [
  { n: 1, nombre: 'Introducción a la epistemología', archivo: 'data/actividades_bloque1.json' },
  { n: 2, nombre: 'Naturaleza del conocimiento', archivo: 'data/actividades_bloque2.json' },
  { n: 3, nombre: 'La racionalidad científica clásica', archivo: 'data/actividades_bloque3.json' },
  { n: 4, nombre: 'Concepción contemporánea de la ciencia', archivo: 'data/actividades_bloque4.json' },
  { n: 5, nombre: 'Nuevo paradigma epistemológico de la ciencia', archivo: 'data/actividades_bloque5.json' },
  { n: 6, nombre: 'Conocimiento científico y conocimiento ordinario', archivo: 'data/actividades_bloque6.json' },
  { n: 7, nombre: 'El proceso de enseñanza-aprendizaje a la luz de la neurociencia', archivo: 'data/actividades_bloque7.json' },
  { n: 8, nombre: 'Nuevo paradigma en orientación', archivo: 'data/actividades_bloque8.json' },
  { n: 9, nombre: 'Nuevos enfoques paradigmáticos', archivo: 'data/actividades_bloque9.json' },
  { n: 10, nombre: 'Integración: la pedagogía como ciencia en la NEM', archivo: 'data/actividades_bloque10.json' },
];
// ---------------------------------------------------------------------------

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let sesion = null;
let terminados = new Set();   // temas ya guardados como terminados
let temaActivo = null;
let todos = [];               // todos los reactivos del tema
let ronda = [];               // reactivos de la ronda actual
let indice = 0;
let correctasRonda = 0;
let contestadoActual = false;
let aciertos = new Set();     // ids contestados bien al menos una vez

const $ = (id) => document.getElementById(id);
function esc(s) { const d = document.createElement('div'); d.textContent = s ?? ''; return d.innerHTML; }
function slugNombre(n) {
  return n.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
}
function barajar(arr) {
  const c = [...arr];
  for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [c[i], c[j]] = [c[j], c[i]]; }
  return c;
}
function bloqueDeTema(n) {
  for (const [p, temas] of Object.entries(ACTIVIDADES_PARCIAL)) if (temas.includes(n) && actividadesAbiertas(p)) return p;
  return null;
}
const ptsPorTema = (p) => PARTICIPACION_MIXTA.actividades / ACTIVIDADES_PARCIAL[p].length;

// Avance parcial (en este navegador), por alumno y tema.
const claveAvance = (n) => `act_${sesion.grupoId}_${sesion.alumnoId}_t${n}`;
function leerAvance(n) { try { return new Set(JSON.parse(localStorage.getItem(claveAvance(n))) || []); } catch { return new Set(); } }
function guardarAvance(n) { try { localStorage.setItem(claveAvance(n), JSON.stringify([...aciertos])); } catch { /* sin almacenamiento */ } }
const totalesCache = {};

// ------------------------------------------------------------------ acceso
async function cargarGrupos() {
  const select = $('act-login-grupo');
  try {
    const snap = await getDocs(query(collection(db, 'grupos'), orderBy('nombre')));
    select.innerHTML = '<option value="">— Elige tu grupo —</option>';
    snap.forEach(d => { const o = document.createElement('option'); o.value = d.id; o.textContent = d.data().nombre; select.appendChild(o); });
  } catch { select.innerHTML = '<option value="">No se pudieron cargar los grupos</option>'; }
}

$('act-form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  const err = $('act-login-error');
  err.hidden = true;
  const grupoId = $('act-login-grupo').value;
  const nombre = $('act-login-nombre').value.trim();
  const pin = $('act-login-pin').value.trim();
  if (!grupoId || !nombre || !pin) return;
  try {
    const alumnoId = slugNombre(nombre);
    const snap = await getDoc(doc(db, 'grupos', grupoId, 'alumnos', alumnoId));
    if (!snap.exists() || String(snap.data().pin) !== pin) {
      err.textContent = 'No encontramos ese nombre y PIN en el grupo elegido. Verifica con tu docente.';
      err.hidden = false;
      return;
    }
    sesion = { grupoId, alumnoId, nombre: snap.data().nombre, pin };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sesion));
    await entrar();
  } catch (e2) {
    err.textContent = 'No se pudo entrar: ' + (e2.message || e2);
    err.hidden = false;
  }
});

$('act-salir').addEventListener('click', () => { sessionStorage.removeItem(SESSION_KEY); location.reload(); });

async function entrar() {
  $('act-login').hidden = true;
  pintarPrep();
  $('act-selector').hidden = false;
  $('act-quien').textContent = sesion.nombre;
  try {
    const snap = await getDocs(collection(db, 'grupos', sesion.grupoId, 'alumnos', sesion.alumnoId, 'actividades'));
    const D = snap.docs.map(d => d.data()).filter(a => a.completado);
    terminados = new Set(D.map(a => Number(a.tema))); fechaTema = {}; D.forEach(a => { fechaTema[Number(a.tema)] = msF(a.fecha); });
  } catch { terminados = new Set(); }
  pintarPrep();
  renderSelectorTemas();
}

// ------------------------------------------------------- selector de temas
async function totalDe(t) {
  if (totalesCache[t.n]) return totalesCache[t.n];
  try { const d = await (await fetch(t.archivo)).json(); totalesCache[t.n] = d.reactivos.length; } catch { totalesCache[t.n] = 0; }
  return totalesCache[t.n];
}

function renderSelectorTemas() {
  const cont = $('act-lista-temas');
  const resumen = Object.keys(ACTIVIDADES_PARCIAL).map(p => {
    const temas = ACTIVIDADES_PARCIAL[p];
    const hechos = temas.filter(n => terminados.has(n) && !tarde(p, n)).length;
    const valor = p === 'final'
      ? 'cuentan dentro de «Tareas y participación»'
      : `<strong>${(hechos * ptsPorTema(p)).toFixed(2)} de ${PARTICIPACION_MIXTA.actividades} pts</strong>${actividadesAbiertas(p) ? (textoCierre(p) ? ` · se cierra el ${textoCierre(p)}` : '') : ' · ya cerrado'}`;
    return `<div class="act-resumen-bloque"><b>${NOMBRES_PARCIAL[p]}</b> · ${hechos} de ${temas.length} temas terminados · ${valor}</div>`;
  }).join('');
  $('act-resumen-puntos').innerHTML = resumen;

  cont.innerHTML = TEMAS_INFO.map(t => {
    const bloque = bloqueDeTema(t.n);
    const hecho = terminados.has(t.n);
    const etiqueta = bloque
      ? `<span class="act-badge act-badge-valor">Cuenta para el ${NOMBRES_PARCIAL[bloque]}${bloque === 'final' ? '' : ` · ${ptsPorTema(bloque).toFixed(2)} pts`}</span>`
      : '<span class="act-badge">Repaso libre</span>';
    const ex = estadoExamenTema(t.n);
    return `
    <div class="act-tema-wrap${ex.entra ? ' act-entra' : ''}">
    <button type="button" class="act-tema-card${hecho ? ' act-terminado' : ''}${ex.entra ? ' act-examen' : ''}" data-tema="${t.n}">
      <span class="act-tema-num">Tema ${t.n}${hecho ? ' · ✔ Terminado' : ''}</span>
      <span class="act-tema-nombre">${esc(t.nombre)}</span>
      ${ex.html}
      ${etiqueta}
      <span class="act-tema-avance" data-avance="${t.n}"></span>
    </button>
    ${ex.parcial ? `<button type="button" class="btn btn-small act-solo-examen" data-solo="${t.n}">📝 Estudiar solo lo que entra (${esc(ex.rango)})${bloque && !hecho ? ' · también cuenta para tu participación' : ''}</button>` : ''}
    </div>`;
  }).join('');
  cont.querySelectorAll('.act-tema-card').forEach(btn => btn.addEventListener('click', () => iniciarTema(Number(btn.dataset.tema))));
  cont.querySelectorAll('[data-solo]').forEach(btn => btn.addEventListener('click', () => iniciarTema(Number(btn.dataset.solo), true)));
  // Avance de los temas no terminados (lo que ya sabe bien en este navegador).
  TEMAS_INFO.forEach(async t => {
    const el = cont.querySelector(`[data-avance="${t.n}"]`);
    if (!el) return;
    if (terminados.has(t.n)) { const p = Object.keys(ACTIVIDADES_PARCIAL).find(k => ACTIVIDADES_PARCIAL[k].includes(t.n));
      el.textContent = p && tarde(p, t.n) ? `¡Ya lo dominas! Pero lo terminaste después del cierre (${textoCierre(p)}), así que no suma a tu participación.` : '¡Ya lo dominas! Puedes repasarlo cuando quieras.'; return; }
    const total = await totalDe(t);
    const bien = leerAvance(t.n).size;
    if (bien > 0 && total) el.innerHTML = `<span class="act-mini-barra"><span style="width:${Math.round(bien / total * 100)}%"></span></span>${bien} de ${total} correctas`;
  });
}

// ----------------------------------------------------------------- un tema
async function iniciarTema(n, soloExamen = false) {
  const info = TEMAS_INFO.find(t => t.n === n);
  $('act-selector').hidden = true;
  $('act-resumen').hidden = true;
  $('act-prep').hidden = true;
  $('act-curso').hidden = false;
  $('act-reactivo-root').innerHTML = '<p class="empty-inline">Cargando…</p>';
  try {
    const datos = await (await fetch(info.archivo, { cache: 'no-store' })).json();
    todos = datos.reactivos;
  } catch {
    $('act-reactivo-root').innerHTML = '<p class="subtema-retry-msg">No se pudo cargar este tema. Intenta de nuevo.</p>';
    return;
  }
  temaActivo = n;
  totalesCache[n] = todos.length;
  aciertos = terminados.has(n) ? new Set() : leerAvance(n);
  // En «Estudiar solo lo que entra», el tema se da por terminado cuando salen
  // bien todas las preguntas de esa parte (así cuenta para la participación).
  modoExamen = !!(soloExamen && EXAMEN);
  baseTema = modoExamen ? todos.filter(r => EXAMEN.subtemas.has(r.subtema)) : todos;
  const pendientes = baseTema.filter(r => !aciertos.has(r.id));
  iniciarRonda(pendientes.length ? pendientes : baseTema);
}

function iniciarRonda(lista) {
  ronda = barajar(lista);
  indice = 0;
  correctasRonda = 0;
  renderReactivoActual();
}

function actualizarBarra() {
  const total = todos.length;
  const bien = terminados.has(temaActivo) ? total : aciertos.size;
  $('act-avance').innerHTML = `Pregunta ${indice + 1} de ${ronda.length} · <b>${bien} de ${total}</b> dominadas`;
  $('act-progreso-tema').style.width = Math.round((bien / total) * 100) + '%';
}

function etiquetaTipo(t) {
  return { opcion_multiple: 'Opción múltiple', verdadero_falso: 'Verdadero o falso', relacionar: 'Relaciona columnas', caso: 'Caso (multirreactivo)', completar: 'Completa el enunciado', jerarquizar: 'Jerarquización', abierta_breve: 'Respuesta breve' }[t] || '';
}

function renderReactivoActual() {
  contestadoActual = false;
  const r = ronda[indice];
  actualizarBarra();
  let cuerpo;
  if (r.tipo === 'relacionar') {
    const derechas = barajar(r.pares.map((p, i) => ({ t: p.derecha, i }))).filter((d, k, L) => L.findIndex(x => x.t === d.t) === k);   // sin repetidos
    cuerpo = `<div class="relacionar-list">${r.pares.map((p, i) => `
      <div class="relacionar-row">
        <span class="relacionar-izq">${esc(p.izquierda)}</span>
        <select class="relacionar-select" data-idx="${i}">
          <option value="">— Elige —</option>
          ${derechas.map(d => `<option value="${d.i}">${esc(d.t)}</option>`).join('')}
        </select>
      </div>`).join('')}</div>
      <button class="btn btn-primary btn-block" id="btn-comprobar" style="margin-top:14px;">Comprobar</button>`;
  } else {
    const ops = barajar(r.opciones.map((o, i) => ({ t: o, i })));
    cuerpo = `<div class="quiz-options">${ops.map(o => `
      <label class="quiz-option" data-idx="${o.i}">
        <input type="radio" name="q-${r.id}" value="${o.i}">
        <span>${esc(o.t)}</span>
      </label>`).join('')}</div>`;
  }
  $('act-reactivo-root').innerHTML = `
    <div class="reactivo-card">
      <div class="reactivo-head"><span class="reactivo-tipo">${etiquetaTipo(r.tipo)}</span></div>
      <h3 class="reactivo-pregunta">${esc(r.pregunta)}</h3>
      ${cuerpo}
      <div id="act-feedback"></div>
    </div>`;
  if (r.tipo === 'relacionar') {
    $('btn-comprobar').addEventListener('click', () => comprobarRelacionar(r));
  } else {
    $('act-reactivo-root').querySelectorAll('.quiz-option').forEach(l => l.addEventListener('click', () => {
      if (!contestadoActual) comprobarOpcion(r, Number(l.dataset.idx));
    }));
  }
  $('btn-act-siguiente').disabled = true;
  $('btn-act-siguiente').textContent = indice === ronda.length - 1 ? 'Ver resultado de la ronda' : 'Siguiente →';
}

function marcarFeedback(r, correcto) {
  contestadoActual = true;
  if (correcto) { aciertos.add(r.id); correctasRonda++; if (!terminados.has(temaActivo)) guardarAvance(temaActivo); }
  actualizarBarra();
  $('act-feedback').innerHTML = `
    <div class="act-feedback ${correcto ? 'act-feedback-ok' : 'act-feedback-mal'}">
      <p class="act-feedback-titulo">${correcto ? '✓ Correcto' : '✗ Incorrecto · esta pregunta volverá en la siguiente ronda'}</p>
      <p>${esc(r.explicacion || '')}</p>
    </div>`;
  $('btn-act-siguiente').disabled = false;
}

function comprobarOpcion(r, idx) {
  $('act-reactivo-root').querySelectorAll('.quiz-option').forEach(l => {
    if (Number(l.dataset.idx) === r.correcta) l.classList.add('opcion-correcta-act');
    if (Number(l.dataset.idx) === idx && idx !== r.correcta) l.classList.add('opcion-elegida-mal-act');
  });
  marcarFeedback(r, idx === r.correcta);
}

function comprobarRelacionar(r) {
  let todoCorrecto = true;
  document.querySelectorAll('.relacionar-select').forEach(sel => {
    const elegido = sel.value === '' ? null : Number(sel.value);
    const i = Number(sel.dataset.idx);   // se compara el texto: si dos pares comparten respuesta, cualquiera vale
    if (elegido === null || !r.pares[elegido] || r.pares[elegido].derecha !== r.pares[i].derecha) todoCorrecto = false;
    sel.disabled = true;
  });
  $('btn-comprobar').remove();
  marcarFeedback(r, todoCorrecto);
}

$('btn-act-siguiente').addEventListener('click', () => {
  if (!contestadoActual) return;
  if (indice < ronda.length - 1) { indice++; renderReactivoActual(); }
  else finDeRonda();
});

$('btn-salir-act').addEventListener('click', volverASelector);
function volverASelector() {
  $('act-curso').hidden = true;
  $('act-resumen').hidden = true;
  $('act-selector').hidden = false;
  if (EXAMEN) { pintarPrep(); $('act-prep').hidden = false; }
  renderSelectorTemas();
}

let modoExamen = false;
let baseTema = [];

async function finDeRonda() {
  $('act-curso').hidden = true;
  const res = $('act-resumen');
  res.hidden = false;
  const objetivo = baseTema.length ? baseTema : todos;
  const total = objetivo.length;
  const pendientes = objetivo.filter(r => !aciertos.has(r.id));
  const yaEstaba = terminados.has(temaActivo);
  const bloque = bloqueDeTema(temaActivo);

  if (pendientes.length === 0 && !yaEstaba) {
    res.innerHTML = '<p class="empty-inline">Guardando tu resultado…</p>';
    try {
      await setDoc(doc(db, 'grupos', sesion.grupoId, 'alumnos', sesion.alumnoId, 'actividades', `tema-${temaActivo}`), {
        tema: temaActivo, completado: true, correcto: true, pinVerificado: sesion.pin, total, nombre: sesion.nombre, fecha: serverTimestamp(),
        modo: modoExamen ? 'examen' : 'completo',
      });
      terminados.add(temaActivo);
      try { localStorage.removeItem(claveAvance(temaActivo)); } catch { /* nada */ }
    } catch (e) {
      res.innerHTML = `<div class="resultado-hero res-bajo"><p class="res-etq">Tema ${temaActivo}</p><p class="res-sub">Terminaste, pero no se pudo guardar (${esc(e.message || e)}). Revisa tu conexión y vuelve a contestar la última ronda.</p></div>
        <button class="btn btn-primary btn-block" id="btn-otro-tema">Elegir otro tema</button>`;
      $('btn-otro-tema').addEventListener('click', volverASelector);
      return;
    }
    res.innerHTML = `
      <div class="resultado-hero res-ok act-celebra">
        <p class="res-etq">Tema ${temaActivo} · ✔ Terminado</p>
        <p class="res-calif">${total} / ${total}</p>
        <p class="res-sub">${bloque === 'final' ? '¡Listo! Este tema ya cuenta en tu participación del Examen Final. Ya aparece en Mi progreso.' : bloque ? `¡Listo! Sumaste <strong>${ptsPorTema(bloque).toFixed(2)} puntos</strong> de participación del ${NOMBRES_PARCIAL[bloque]}. Ya aparece en Mi progreso.` : '¡Dominaste este tema! (Repaso libre: no suma puntos).'}</p>
      </div>
      <button class="btn btn-primary btn-block" id="btn-otro-tema">Elegir otro tema</button>`;
  } else if (yaEstaba) {
    res.innerHTML = `
      <div class="resultado-hero res-ok"><p class="res-etq">Tema ${temaActivo} · repaso</p>
        <p class="res-calif">${correctasRonda} / ${ronda.length}</p>
        <p class="res-sub">Este tema ya lo tenías terminado: tu puntaje se queda igual, aunque en este repaso falles alguna.</p></div>
      <button class="btn btn-primary btn-block" id="btn-repetir">Repasarlo otra vez</button>
      <button class="btn btn-ghost-dark btn-block" id="btn-otro-tema" style="margin-top:10px;">Elegir otro tema</button>`;
  } else {
    res.innerHTML = `
      <div class="resultado-hero ${aciertos.size / total >= 0.8 ? 'res-riesgo' : 'res-bajo'}">
        <p class="res-etq">Tema ${temaActivo} · fin de la ronda</p>
        <p class="res-calif">${aciertos.size} / ${total}</p>
        <p class="res-sub">Te ${pendientes.length === 1 ? 'falta 1 pregunta' : `faltan ${pendientes.length} preguntas`}. El tema se termina cuando todas te salgan bien. Lee con calma la retroalimentación y vuelve a intentarlo.</p>
      </div>
      <button class="btn btn-primary btn-block" id="btn-pendientes">Contestar las que me faltan (${pendientes.length})</button>
      <button class="btn btn-ghost-dark btn-block" id="btn-otro-tema" style="margin-top:10px;">Seguir después</button>`;
    $('btn-pendientes').addEventListener('click', () => { res.hidden = true; $('act-curso').hidden = false; iniciarRonda(pendientes); });
  }
  const rep = $('btn-repetir');
  if (rep) rep.addEventListener('click', () => { res.hidden = true; $('act-curso').hidden = false; iniciarRonda(objetivo); });
  $('btn-otro-tema').addEventListener('click', volverASelector);
}

// ------------------------------------------------------------------ inicio
document.addEventListener('DOMContentLoaded', async () => {
  await cargarGrupos();
  const g = sessionStorage.getItem(SESSION_KEY);
  prepararExamen();
  if (g) {
    try {
      sesion = JSON.parse(g);
      const snap = await getDoc(doc(db, 'grupos', sesion.grupoId, 'alumnos', sesion.alumnoId));
      if (snap.exists() && String(snap.data().pin) === String(sesion.pin)) { await entrar(); return; }
    } catch { /* sesión inválida */ }
    sessionStorage.removeItem(SESSION_KEY);
  }
});

// =================================================== preparación del examen
// Lee el próximo examen del calendario (data/curso.json) y su banco; con eso:
// · resalta los temas que entran (y avisa si de un tema solo entran algunos subtemas),
// · arma el recuadro «Prepárate» con la cuenta regresiva, el simulacro y la guía.
// Pasada la fecha, cambia solo al siguiente examen del calendario.
let EXAMEN = null;   // { titulo, fecha, fechaTexto, archivo, clave, subtemas:Set, temas:Map, config, nombres:{} }
const ARCHIVO_EXAMEN = t => /final/i.test(t) ? ['final', 'data/examen_final.json'] : /parcial\s*2/i.test(t) ? ['p2', 'data/examen_p2.json'] : /parcial\s*1/i.test(t) ? ['p1', 'data/examen_p1.json'] : null;
const hoyISO = () => new Date().toLocaleDateString('en-CA');
async function prepararExamen() {
  try {
    const curso = await (await fetch('data/curso.json', { cache: 'no-store' })).json();
    const ev = (curso.eventos || []).filter(e => e.tipo === 'examen' && e.fecha >= hoyISO() && ARCHIVO_EXAMEN(e.titulo)).sort((a, b) => a.fecha.localeCompare(b.fecha))[0];
    if (!ev) return;
    const [clave, archivo] = ARCHIVO_EXAMEN(ev.titulo);
    const banco = await (await fetch(archivo, { cache: 'no-store' })).json();
    const subtemas = new Set(banco.reactivos.map(r => r.subtema));
    const temas = new Map();
    [...subtemas].sort((a, b) => a.localeCompare(b, 'es', { numeric: true })).forEach(st => { const t = Number(st.split('.')[0]); if (!temas.has(t)) temas.set(t, []); temas.get(t).push(st); });
    EXAMEN = { titulo: ev.titulo, fecha: ev.fecha, fechaTexto: ev.fechaTexto || ev.fecha, clave, archivo, subtemas, temas, config: banco.config || {}, nombres: {} };
    // Nombres de los subtemas (para el resultado del simulacro).
    await Promise.all([...temas.keys()].map(async t => { try { (await (await fetch(`data/bloque${t}.json`)).json()).subtemas.forEach(s => { EXAMEN.nombres[s.id] = s.titulo; }); } catch { /* sin nombres */ } }));
    pintarPrep();
    if (!$('act-selector').hidden) renderSelectorTemas();
  } catch (e) { console.warn('Sin datos del próximo examen', e); }
}
function diasPara(fecha) { const [y, m, d] = fecha.split('-').map(Number); return Math.round((new Date(y, m - 1, d) - new Date(new Date().toDateString())) / 864e5); }
function estadoExamenTema(n) {
  if (!EXAMEN) return { entra: false, html: '' };
  const lista = EXAMEN.temas.get(n);
  if (lista) {
    const rango = lista.length > 1 ? `${lista[0]} a ${lista[lista.length - 1]}` : lista[0];
    // ¿Entra todo el tema o solo una parte? Se compara con los subtemas que hay en Actividades.
    const parcial = n in SUBTEMAS_TEMA && SUBTEMAS_TEMA[n].some(st => !EXAMEN.subtemas.has(st));
    return { entra: true, parcial, rango, html: `<span class="act-badge act-badge-examen">📝 Entra en tu examen del ${esc(fechaCorta(EXAMEN.fecha))}${parcial ? ` · solo ${esc(rango)}` : ''}</span>` };
  }
  const max = Math.max(...EXAMEN.temas.keys()), min = Math.min(...EXAMEN.temas.keys());
  if (n < min) return { entra: false, html: `<span class="act-badge act-badge-gris">Ya se evaluó · repaso para el Examen Final</span>` };
  if (n > max) return { entra: false, html: `<span class="act-badge act-badge-gris">Todavía no lo vemos · entra en el Examen Final</span>` };
  return { entra: false, html: '' };
}
// Subtemas de cada tema en Actividades (para saber si un tema entra completo o solo una parte).
const SUBTEMAS_TEMA = {};
async function cargarSubtemasTemas() {
  await Promise.all(TEMAS_INFO.map(async t => { try { SUBTEMAS_TEMA[t.n] = [...new Set((await (await fetch(t.archivo)).json()).reactivos.map(r => r.subtema))]; } catch { /* */ } }));
}
const MESES_C = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS_C = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
function fechaCorta(iso) { const [y, m, d] = iso.split('-').map(Number); return `${DIAS_C[new Date(y, m - 1, d).getDay()]} ${d} de ${MESES_C[m - 1]}`; }

function pintarPrep() {
  const box = $('act-prep'); if (!EXAMEN || !box) return;
  const dias = diasPara(EXAMEN.fecha);
  const cuando = dias === 0 ? '¡Es hoy!' : dias === 1 ? 'Es mañana' : `Faltan ${dias} días`;
  const temasTxt = [...EXAMEN.temas.entries()].map(([t, l]) => (SUBTEMAS_TEMA[t] || []).some(st => !EXAMEN.subtemas.has(st)) ? `Tema ${t} (solo ${l[0]} a ${l[l.length - 1]})` : `Tema ${t}`).join(', ').replace(/, ([^,]*)$/, ' y $1');
  const n = EXAMEN.config.preguntasPorExamen, min = EXAMEN.config.minutos;
  const mejor = (() => { try { return JSON.parse(localStorage.getItem(claveSim()) || 'null'); } catch { return null; } })();
  // Participación con valor ligada a este examen (Parcial 2): se muestra mientras esté abierta.
  const partP = EXAMEN.clave in ACTIVIDADES_PARCIAL && EXAMEN.clave !== 'final' && actividadesAbiertas(EXAMEN.clave) ? EXAMEN.clave : null;
  let partTxt = '';
  if (partP) {
    const temasP = ACTIVIDADES_PARCIAL[partP];
    const lista = temasP.join(', ').replace(/, (\d+)$/, ' y $1');
    const parteT = temasP.find(t => (SUBTEMAS_TEMA[t] || []).some(st => !EXAMEN.subtemas.has(st)));
    const hechos = sesion ? temasP.filter(t => terminados.has(t)).length : null;
    partTxt = `<div class="act-prep-part"><p><b>⭐ Estos mismos temas son tu participación.</b> Los ${PARTICIPACION_MIXTA.actividades} puntos de actividades del ${esc(NOMBRES_PARCIAL[partP])} salen de los Temas ${lista}: cada tema que termines sin errores vale ${ptsPorTema(partP).toFixed(2)} puntos.${parteT ? ` Del Tema ${parteT} basta la parte que entra al examen.` : ''} Tienes hasta el <b>${esc(textoCierre(partP))}</b>.</p>${hechos !== null ? `<p class="act-prep-part-avance">Llevas <b>${hechos} de ${temasP.length} temas</b> · ${(hechos * ptsPorTema(partP)).toFixed(2)} de ${PARTICIPACION_MIXTA.actividades} puntos.</p>` : ''}</div>`;
  }
  box.innerHTML = `
    <div class="act-prep-cab"><div><p class="act-prep-kicker">Prepárate para tu examen</p><h2>${esc(EXAMEN.titulo)} · ${esc(fechaCorta(EXAMEN.fecha))}</h2>
      <p>Entran: <b>${esc(temasTxt)}</b>.${n ? ` ${n} preguntas en ${min} minutos.` : ''} Las preguntas del examen se parecen a las de estas Actividades.</p></div>
      <div class="act-prep-cuenta"><b>${dias > 1 ? dias : dias === 1 ? '1' : '¡Hoy!'}</b>${dias > 1 ? 'días' : dias === 1 ? 'día' : ''}<small>${cuando}</small></div></div>
    ${partTxt}
    <ol class="act-prep-pasos">
      <li><b>① Estudia los temas resaltados</b> en dorado aquí abajo, hasta que todas sus preguntas te salgan bien${partP ? ': <b>así estudias para el examen y sumas tu participación al mismo tiempo</b>' : ''}.${[...EXAMEN.temas.keys()].some(t => (SUBTEMAS_TEMA[t] || []).some(st => !EXAMEN.subtemas.has(st))) ? ' Donde solo entra una parte, usa el botón «Estudiar solo lo que entra».' : ''}</li>
      <li><b>② Haz el simulacro</b>: ${n || 30} preguntas parecidas a las del examen, con reloj de ${min || 60} minutos. No vale calificación y lo puedes repetir las veces que quieras; al final te dice qué subtemas repasar.
        <div class="act-prep-botones"><button type="button" class="btn btn-primary" id="act-sim-ir">🎯 Hacer el simulacro</button>${mejor ? `<span class="act-prep-mejor">Tu mejor simulacro: <b>${mejor.cal}</b> (${mejor.bien} de ${mejor.n})</span>` : ''}</div></li>
      ${EXAMEN.config.guia ? `<li><b>③ Descarga la guía de estudio</b>: una página por tema con las ideas clave, los autores y lo que más se confunde.<div class="act-prep-botones"><a class="btn btn-ghost-dark" href="${esc(EXAMEN.config.guia)}" target="_blank" rel="noopener">📄 Abrir la guía de estudio</a></div></li>` : ''}
    </ol>`;
  box.hidden = false;
  $('act-sim-ir').addEventListener('click', () => {
    if (!sesion) { $('act-login').scrollIntoView({ behavior: 'smooth' }); $('act-login-error').hidden = false; $('act-login-error').textContent = 'Entra con tu nombre y PIN para hacer el simulacro: así se guarda tu mejor resultado.'; return; }
    iniciarSimulacro();
  });
}

// ================================================================ simulacro
// Mismo formato que el examen (cuotas por tema y tope de casos), pero con las preguntas
// de Actividades. Sin retroalimentación hasta entregar; al final, calificación, subtemas
// a repasar y la explicación de cada pregunta. No vale calificación.
// El docente lo ve en Monitor › Juegos de práctica en vivo (grupos/…/atlas/tarea-juego-simulacro-…).
const SIM = { items: [], resp: {}, i: 0, fin: 0, reloj: null, id: '' };
const claveSim = () => sesion && EXAMEN ? `sim_${EXAMEN.clave}_${sesion.grupoId}_${sesion.alumnoId}` : 'sim_x';
function reportarSim(d) {
  if (!sesion || !SIM.id) return;
  setDoc(doc(db, 'grupos', sesion.grupoId, 'alumnos', sesion.alumnoId, 'atlas', 'tarea-juego-' + SIM.id),
    { ...d, juego: SIM.id, nombre: sesion.nombre, pinVerificado: sesion.pin, ultimoMs: Date.now(), ultimo: serverTimestamp() }, { merge: true }).catch(() => {});
}
async function iniciarSimulacro() {
  const box = $('act-sim');
  ['act-selector', 'act-curso', 'act-resumen', 'act-prep'].forEach(id => { $(id).hidden = true; });
  box.hidden = false; box.innerHTML = '<p class="empty-inline">Armando tu simulacro…</p>';
  let banco = [];
  try {
    for (const t of EXAMEN.temas.keys()) {
      const info = TEMAS_INFO.find(x => x.n === t); if (!info) continue;
      banco.push(...(await (await fetch(info.archivo, { cache: 'no-store' })).json()).reactivos.filter(r => EXAMEN.subtemas.has(r.subtema)));
    }
  } catch { box.innerHTML = '<p class="subtema-retry-msg">No se pudo cargar el simulacro. Revisa tu conexión e intenta de nuevo.</p>'; return; }
  const n = Math.min(EXAMEN.config.preguntasPorExamen || 30, banco.length);
  SIM.items = elegirConCuotas(banco, n, Math.random, { cuotas: EXAMEN.config.cuotas, maxPorTipo: EXAMEN.config.maxPorTipo });
  SIM.items.forEach(r => { if (r.tipo === 'relacionar') r._der = barajar(r.pares.map((p, i) => ({ t: p.derecha, i }))).filter((d, k, L) => L.findIndex(x => x.t === d.t) === k); else r._ops = barajar(r.opciones.map((o, i) => ({ t: o, i }))); });
  SIM.resp = {}; SIM.i = 0; SIM.id = 'simulacro-' + EXAMEN.clave;
  SIM.fin = Date.now() + (EXAMEN.config.minutos || 60) * 60000;
  clearInterval(SIM.reloj); SIM.reloj = setInterval(tictac, 1000);
  reportarSim({ estado: 'jugando', nivel: 'Simulacro', nivelId: 'sim', i: 0, n: SIM.items.length, bien: 0, malos: 0, pts: 0, reto: false });
  pintarSim(); window.scrollTo({ top: 0 });
}
function tictac() {
  const r = Math.max(0, SIM.fin - Date.now()), el = document.getElementById('sim-reloj');
  if (el) { el.textContent = `⏱ ${Math.floor(r / 60000)}:${String(Math.floor(r / 1000) % 60).padStart(2, '0')}`; el.classList.toggle('sim-poco', r < 5 * 60000); }
  if (r <= 0) { clearInterval(SIM.reloj); calificarSim(true); }
}
const contestada = r => { const v = SIM.resp[r.id]; return r.tipo === 'relacionar' ? !!v && r.pares.every((p, i) => v[i] !== undefined && v[i] !== '') : v !== undefined; };
function pintarSim() {
  const r = SIM.items[SIM.i], N = SIM.items.length, hechas = SIM.items.filter(contestada).length;
  let cuerpo;
  if (r.tipo === 'relacionar') {
    const v = SIM.resp[r.id] || {};
    cuerpo = `<div class="relacionar-list">${r.pares.map((p, i) => `<div class="relacionar-row"><span class="relacionar-izq">${esc(p.izquierda)}</span>
      <select class="relacionar-select" data-idx="${i}"><option value="">— Elige —</option>${r._der.map(d => `<option value="${d.i}"${String(v[i]) === String(d.i) ? ' selected' : ''}>${esc(d.t)}</option>`).join('')}</select></div>`).join('')}</div>`;
  } else {
    cuerpo = `<div class="quiz-options">${r._ops.map(o => `<label class="quiz-option${SIM.resp[r.id] === o.i ? ' sim-elegida' : ''}" data-idx="${o.i}"><input type="radio" name="sim-${r.id}" value="${o.i}"${SIM.resp[r.id] === o.i ? ' checked' : ''}><span>${esc(o.t)}</span></label>`).join('')}</div>`;
  }
  $('act-sim').innerHTML = `
    <div class="act-barra-top"><button id="sim-salir" class="btn-ghost-dark btn-small">← Salir del simulacro</button><span>Pregunta <b>${SIM.i + 1}</b> de ${N} · contestadas ${hechas}</span><span id="sim-reloj" class="sim-reloj"></span></div>
    <div class="act-progreso-tema"><span style="width:${Math.round(hechas / N * 100)}%"></span></div>
    <div class="reactivo-card"><div class="reactivo-head"><span class="reactivo-tipo">${etiquetaTipo(r.tipo)}</span><span class="sim-sub">Subtema ${esc(r.subtema)}</span></div>
      <h3 class="reactivo-pregunta">${esc(r.pregunta)}</h3>${cuerpo}</div>
    <div class="act-nav-botones sim-nav"><button id="sim-ant" class="btn btn-ghost-dark"${SIM.i === 0 ? ' disabled' : ''}>← Anterior</button>
      ${SIM.i < N - 1 ? '<button id="sim-sig" class="btn btn-primary">Siguiente →</button>' : '<button id="sim-entregar" class="btn btn-primary">Entregar simulacro</button>'}</div>
    <div class="sim-mapa">${SIM.items.map((x, k) => `<button type="button" data-k="${k}" class="${k === SIM.i ? 'sim-aqui' : ''}${contestada(x) ? ' sim-ok' : ''}">${k + 1}</button>`).join('')}</div>
    ${SIM.i < N - 1 ? '<p class="field-hint" style="text-align:center"><button type="button" class="btn-texto" id="sim-entregar2">Entregar ya mi simulacro</button></p>' : ''}`;
  tictac();
  if (r.tipo === 'relacionar') $('act-sim').querySelectorAll('.relacionar-select').forEach(sel => sel.addEventListener('change', () => { SIM.resp[r.id] = { ...(SIM.resp[r.id] || {}), [sel.dataset.idx]: sel.value }; avanceSim(); }));
  else $('act-sim').querySelectorAll('.quiz-option').forEach(l => l.addEventListener('click', () => { SIM.resp[r.id] = Number(l.dataset.idx); $('act-sim').querySelectorAll('.quiz-option').forEach(x => x.classList.toggle('sim-elegida', x === l)); avanceSim(); }));
  const ir = k => { SIM.i = k; pintarSim(); window.scrollTo({ top: 0 }); };
  $('sim-ant').addEventListener('click', () => ir(SIM.i - 1));
  if ($('sim-sig')) $('sim-sig').addEventListener('click', () => ir(SIM.i + 1));
  [$('sim-entregar'), $('sim-entregar2')].forEach(b => b && b.addEventListener('click', () => {
    const faltan = SIM.items.filter(x => !contestada(x)).length;
    if (faltan && !confirm(`Te ${faltan === 1 ? 'falta 1 pregunta' : `faltan ${faltan} preguntas`} por contestar. ¿Entregar de todos modos?`)) return;
    calificarSim(false);
  }));
  $('act-sim').querySelectorAll('.sim-mapa [data-k]').forEach(b => b.addEventListener('click', () => ir(Number(b.dataset.k))));
  $('sim-salir').addEventListener('click', () => { if (!confirm('¿Salir del simulacro? Se pierde lo que llevas.')) return; clearInterval(SIM.reloj); reportarSim({ estado: 'menu' }); $('act-sim').hidden = true; volverASelector(); pintarPrep(); });
}
let tAvance = 0;
function avanceSim() {
  const hechas = SIM.items.filter(contestada).length;
  const mapa = $('act-sim').querySelector(`.sim-mapa [data-k="${SIM.i}"]`); if (mapa) mapa.classList.toggle('sim-ok', contestada(SIM.items[SIM.i]));
  clearTimeout(tAvance); tAvance = setTimeout(() => reportarSim({ estado: 'jugando', i: hechas }), 800);
}
function esCorrecta(r) {
  const v = SIM.resp[r.id];
  if (r.tipo === 'relacionar') return !!v && r.pares.every((p, i) => v[i] !== undefined && v[i] !== '' && r.pares[Number(v[i])] && r.pares[Number(v[i])].derecha === p.derecha);
  return v === r.correcta;
}
function calificarSim(porTiempo) {
  clearInterval(SIM.reloj); clearTimeout(tAvance);
  const N = SIM.items.length, bien = SIM.items.filter(esCorrecta).length, cal = Math.round(bien / N * 100) / 10;
  const porSub = {};
  SIM.items.forEach(r => { const s = porSub[r.subtema] = porSub[r.subtema] || { b: 0, t: 0 }; s.t++; if (esCorrecta(r)) s.b++; });
  const repasar = Object.entries(porSub).filter(([, x]) => x.b / x.t < 0.7).sort((a, b) => a[1].b / a[1].t - b[1].b / b[1].t);
  // Mejor resultado (en este teléfono y en la nube).
  let mejor = null; try { mejor = JSON.parse(localStorage.getItem(claveSim()) || 'null'); } catch { /* */ }
  const esMejor = !mejor || bien / N > mejor.bien / mejor.n;
  if (esMejor) { try { localStorage.setItem(claveSim(), JSON.stringify({ bien, n: N, cal: cal.toFixed(1) })); } catch { /* */ } }
  const f = hoyISO(), kh = `jv_hoy_${SIM.id}_${f}`; let prevHoy = -1; try { prevHoy = Number(localStorage.getItem(kh) || -1); } catch { /* */ }
  const extra = {}; if (bien * 100 > prevHoy) { try { localStorage.setItem(kh, String(bien * 100)); } catch { /* */ } extra.hoy = { fecha: f, marca: bien * 100, bien, n: N, nivel: 'Simulacro', reto: false }; }
  reportarSim({ estado: 'termino', i: N, n: N, bien, malos: N - bien, pts: 0, reto: false, nivel: 'Simulacro', nivelId: 'sim', rondas: increment(1), mejor_sim: esMejor ? `${bien}/${N}` : `${mejor.bien}/${mejor.n}`, calificacion: cal, ...extra });
  const tono = cal >= 8 ? 'res-ok' : cal >= 6 ? 'res-riesgo' : 'res-bajo';
  const nombre = st => EXAMEN.nombres[st] ? `${st} ${EXAMEN.nombres[st]}` : `Subtema ${st}`;
  $('act-sim').innerHTML = `
    <div class="resultado-hero ${tono}"><p class="res-etq">Simulacro · ${esc(EXAMEN.titulo)}${porTiempo ? ' · se acabó el tiempo' : ''}</p>
      <p class="res-calif">${cal.toFixed(1)}</p><p class="res-sub">${bien} de ${N} correctas.${esMejor && mejor ? ' ¡Es tu mejor simulacro!' : mejor ? ` Tu mejor sigue siendo ${mejor.cal}.` : ''} No vale calificación: es para que llegues preparado.</p></div>
    <div class="sim-subtemas"><h3>${repasar.length ? '📌 Repasa estos subtemas' : '✓ Vas bien en todos los subtemas'}</h3>
      ${repasar.length ? `<ul>${repasar.map(([st, x]) => `<li><b>${esc(nombre(st))}</b> · ${x.b} de ${x.t}</li>`).join('')}</ul><p class="field-hint">Búscalos en el compendio y vuelve a contestar su tema aquí en Actividades.</p>` : ''}
      <details><summary>Ver mi resultado por subtema</summary><ul>${Object.entries(porSub).sort((a, b) => a[0].localeCompare(b[0], 'es', { numeric: true })).map(([st, x]) => `<li>${esc(nombre(st))}: ${x.b} de ${x.t}</li>`).join('')}</ul></details></div>
    <div class="act-nav-botones"><button id="sim-otra" class="btn btn-primary">🎯 Hacer otro simulacro</button><button id="sim-volver" class="btn btn-ghost-dark">Volver a Actividades</button></div>
    <h3 class="sim-rev-tit">Revisa tus respuestas</h3>
    ${SIM.items.map((r, k) => { const ok = esCorrecta(r), v = SIM.resp[r.id];
      const tuya = r.tipo === 'relacionar' ? (v ? r.pares.map((p, i) => `${esc(p.izquierda)} → ${v[i] !== undefined && v[i] !== '' ? esc(r.pares[Number(v[i])].derecha) : '—'}`).join('<br>') : 'Sin contestar') : (v === undefined ? 'Sin contestar' : esc(r.opciones[v]));
      const buena = r.tipo === 'relacionar' ? r.pares.map(p => `${esc(p.izquierda)} → ${esc(p.derecha)}`).join('<br>') : esc(r.opciones[r.correcta]);
      return `<div class="sim-rev ${ok ? 'sim-rev-ok' : 'sim-rev-mal'}"><p class="sim-rev-n">${k + 1}. ${ok ? '✓' : '✗'} <small>Subtema ${esc(r.subtema)}</small></p><p class="sim-rev-q">${esc(r.pregunta)}</p>
        ${ok ? '' : `<p><b>Tu respuesta:</b><br>${tuya}</p>`}<p><b>Respuesta correcta:</b><br>${buena}</p>${r.explicacion ? `<p class="sim-rev-exp">${esc(r.explicacion)}</p>` : ''}</div>`; }).join('')}`;
  window.scrollTo({ top: 0 });
  $('sim-otra').addEventListener('click', iniciarSimulacro);
  $('sim-volver').addEventListener('click', () => { $('act-sim').hidden = true; volverASelector(); pintarPrep(); $('act-prep').hidden = false; });
}
cargarSubtemasTemas().then(() => { if (EXAMEN) { pintarPrep(); if (!$('act-selector').hidden) renderSelectorTemas(); } });
