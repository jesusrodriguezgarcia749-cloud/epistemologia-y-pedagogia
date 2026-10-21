// taller.js — Taller del investigador (proyecto «Pienso, luego investigo»).
// El alumno entra con grupo, nombre y PIN. Todo lo que escribe se guarda
// automáticamente en grupos/{grupo}/alumnos/{alumno}/investigacion/taller
// (y una copia en el navegador). El docente ve el avance en el Panel docente.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const db = getFirestore(initializeApp(firebaseConfig));
const SESSION_KEY = 'ep_sesion_alumno';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const md = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?![*\w])/g, '$1<em>$2</em>');
const palabras = t => (String(t || '').trim().match(/\S+/g) || []).length;
const slug = n => n.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
const lsGet = k => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento */ } };

let D = null, LAB = null, sesion = null, T = null, etapa = 0, timer = null, nube = true;
const NOMBRES_AUT = {};

// ======================================================= acceso
async function cargarGrupos() {
  const s = $('#t-grupo');
  try {
    const snap = await getDocs(query(collection(db, 'grupos'), orderBy('nombre')));
    s.innerHTML = '<option value="">— Elige tu grupo —</option>';
    snap.forEach(d => { const o = document.createElement('option'); o.value = d.id; o.textContent = d.data().nombre; s.appendChild(o); });
  } catch { s.innerHTML = '<option value="">No se pudieron cargar los grupos</option>'; }
}
$('#t-form').addEventListener('submit', async e => {
  e.preventDefault();
  const err = $('#t-error'); err.hidden = true;
  const grupoId = $('#t-grupo').value, nombre = $('#t-nombre').value.trim(), pin = $('#t-pin').value.trim();
  if (!grupoId || !nombre || !pin) { err.textContent = 'Completa grupo, nombre y PIN.'; err.hidden = false; return; }
  try {
    const alumnoId = slug(nombre);
    const snap = await getDoc(doc(db, 'grupos', grupoId, 'alumnos', alumnoId));
    if (!snap.exists() || String(snap.data().pin) !== pin) { err.textContent = 'No encontramos ese nombre y PIN en el grupo elegido. Verifica con tu docente.'; err.hidden = false; return; }
    sesion = { grupoId, alumnoId, nombre: snap.data().nombre, pin };
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(sesion)); } catch { /* */ }
    entrar();
  } catch (e2) { err.textContent = 'No se pudo entrar: ' + (e2.message || e2); err.hidden = false; }
});
$('#t-sin-cuenta').addEventListener('click', () => { sesion = { anon: true, nombre: 'invitado' }; entrar(); });
$('#t-salir').addEventListener('click', async () => { await guardarYa(); try { sessionStorage.removeItem(SESSION_KEY); } catch { /* */ } location.reload(); });

const claveLocal = () => sesion.anon ? 'taller_invitado' : `taller_${sesion.grupoId}_${sesion.alumnoId}`;
const vacio = () => ({ tema: '', problema: '', pregunta: '', tipoManual: '', brujula: { resp: [], clave: '' }, objetivos: { general: '', especificos: ['', '', ''], hipotesis: '', refutaria: '' }, matriz: [], respuestas: {}, etica: [], apa: [], guion: '', etapaMax: 0 });

async function entrar() {
  $('#t-acceso').hidden = true; $('#t-app').hidden = false;
  $('#t-quien').textContent = sesion.anon ? 'invitado (sin cuenta)' : sesion.nombre;
  [D, LAB] = await Promise.all([fetch('data/taller.json').then(r => r.json()), fetch('data/laboratorio.json').then(r => r.json())]);
  LAB.autores.forEach(a => { NOMBRES_AUT[a.id] = a.nombre; });
  let local = null; try { local = JSON.parse(lsGet(claveLocal()) || 'null'); } catch { local = null; }
  let remoto = null;
  if (!sesion.anon) {
    try { const s = await getDoc(doc(db, 'grupos', sesion.grupoId, 'alumnos', sesion.alumnoId, 'investigacion', 'taller')); if (s.exists()) remoto = s.data().datos || null; }
    catch { nube = false; }
  }
  // gana la versión más reciente
  const t = x => (x && x._t) || 0;
  T = Object.assign(vacio(), (t(local) > t(remoto) ? local : remoto) || local || remoto || {});
  estado(sesion.anon ? 'Se guarda solo en este dispositivo' : 'Tu avance se guarda en tu cuenta');
  etapa = Math.min(T.etapaMax || 0, D.etapas.length - 1);
  pintarPasos(); pintarEtapa();
}

// ======================================================= guardado
function estado(t, clase = '') { const e = $('#t-estado'); e.textContent = t; e.className = 't-estado ' + clase; }
function cambio() {
  T._t = Date.now(); lsSet(claveLocal(), JSON.stringify(T));
  estado('Guardando…'); clearTimeout(timer); timer = setTimeout(guardarYa, 1200);
  pintarPasos(false);
}
function resumenAvance() {
  const c = completas(), por = {};
  D.preguntas.forEach(p => { por[p.entrega] = (por[p.entrega] || 0) + (palabras(T.respuestas[p.n]) >= 150 ? 1 : 0); });
  return { etapas: c, respuestas: por, palabras: D.preguntas.reduce((s, p) => s + palabras(T.respuestas[p.n]), 0) };
}
async function guardarYa() {
  clearTimeout(timer);
  if (!T) return;
  if (sesion.anon) { estado('Guardado en este dispositivo ✓', 'ok'); return; }
  try {
    await setDoc(doc(db, 'grupos', sesion.grupoId, 'alumnos', sesion.alumnoId, 'investigacion', 'taller'), {
      pinVerificado: sesion.pin, nombre: sesion.nombre, datos: T, pregunta: T.pregunta || '', paradigma: T.brujula.clave || '',
      avance: resumenAvance(), actualizado: serverTimestamp()
    });
    nube = true; estado('Guardado en tu cuenta ✓', 'ok');
  } catch (e) {
    nube = false; estado('Guardado solo en este dispositivo (no se pudo subir a tu cuenta). Avísale a tu docente.', 'mal');
  }
}
window.addEventListener('beforeunload', () => { if (timer) guardarYa(); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && timer) guardarYa(); });

// ======================================================= etapas
function completas() {
  const r = revisar(T.pregunta);
  const o = T.objetivos;
  return [
    !!T.pregunta && r.problemas === 0,
    !!T.brujula.clave,
    !!o.general.trim() && o.especificos.filter(x => x.trim()).length >= 2 && !!o.hipotesis.trim() && !!o.refutaria.trim(),
    T.matriz.length > 0 && T.matriz.every(f => f.tecnica && f.instrumento.trim() && f.participantes.trim()),
    D.preguntas.every(p => palabras(T.respuestas[p.n]) >= 150),
    T.etica.length === D.etica.length && T.etica.every(Boolean),
  ];
}
function pintarPasos(todo = true) {
  const c = completas();
  if (todo) {
    $('#t-pasos').innerHTML = D.etapas.map((e, i) => `<button type="button" data-i="${i}"><span class="t-num">${c[i] ? '✓' : e.n}</span><span><b>${esc(e.titulo)}</b><small>${esc(e.sub)}</small></span></button>`).join('');
    $$('#t-pasos button').forEach(b => b.addEventListener('click', () => irA(+b.dataset.i)));
  }
  $$('#t-pasos button').forEach((b, i) => { b.classList.toggle('actual', i === etapa); b.classList.toggle('hecha', c[i]); b.querySelector('.t-num').textContent = c[i] ? '✓' : D.etapas[i].n; });
}
function irA(i) { etapa = Math.max(0, Math.min(D.etapas.length - 1, i)); if (etapa > (T.etapaMax || 0)) { T.etapaMax = etapa; cambio(); } pintarPasos(); pintarEtapa(); $('#t-app').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
$('#t-ant').addEventListener('click', () => irA(etapa - 1));
$('#t-sig').addEventListener('click', () => irA(etapa + 1));
function pintarEtapa() {
  const e = D.etapas[etapa];
  $('#t-ant').disabled = etapa === 0; $('#t-sig').disabled = etapa === D.etapas.length - 1;
  const cont = $('#t-etapa');
  cont.innerHTML = `<p class="ficha-kicker">Etapa ${e.n} de ${D.etapas.length}</p><h2 class="t-h2">${esc(e.titulo)}</h2>`;
  ({ pregunta: etapaPregunta, brujula: etapaBrujula, objetivos: etapaObjetivos, matriz: etapaMatriz, cuaderno: etapaCuaderno, cierre: etapaCierre })[e.id](cont);
}
const enlazar = (sel, campo, fn) => { const el = $(sel); el.addEventListener('input', () => { campo(el.value); cambio(); fn && fn(); }); return el; };

// ------------------------------------------------ Etapa 1: la pregunta
function tipoDe(q) {
  const t = q.toLowerCase();
  const P = /(relaci[oó]n|efecto|influ|impacto|diferencia|cu[aá]nto|en qu[eé] medida|nivel de|correlaci|frecuencia|porcentaje|compar)/.test(t);
  const I = /(c[oó]mo viven|significad|percepci|experiencia|perciben|sentido|interpretan|qu[eé] piensan|narrativ|vivencia|c[oó]mo describen|c[oó]mo explican|representacion)/.test(t);
  const S = /(c[oó]mo (puede|podemos|pueden)|transformar|propuesta|intervenci|construir|junto con|participativ|investigaci[oó]n-acci[oó]n|dise[nñ]ar y poner a prueba|colectiv)/.test(t);
  if (S) return 'S'; if (P && I) return 'M'; if (I) return 'I'; if (P) return 'P'; return '';
}
function revisar(q) {
  const t = (q || '').trim(), tl = t.toLowerCase(), out = [];
  const add = (ok, msg, consejo) => out.push({ ok, msg, consejo });
  if (!t) return { lista: [], problemas: 1 };
  const n = palabras(t);
  add(n >= 10, n >= 10 ? 'Tiene una extensión suficiente' : 'Es muy corta', 'Una buena pregunta suele tener entre 15 y 45 palabras: necesita decir qué, quiénes y dónde.');
  add(n <= 60, n <= 60 ? 'No es demasiado larga' : 'Es demasiado larga', 'Si pasa de 60 palabras, probablemente mezcla varias preguntas: quédate con la principal y pasa las demás a objetivos específicos.');
  add(/^¿/.test(t) && /\?$/.test(t), /^¿/.test(t) && /\?$/.test(t) ? 'Está escrita como pregunta' : 'Le faltan los signos de interrogación', 'En español la pregunta abre con «¿» y cierra con «?».');
  add((t.match(/¿/g) || []).length <= 1, (t.match(/¿/g) || []).length <= 1 ? 'Es una sola pregunta' : 'Tiene más de una pregunta', 'Elige una pregunta general; las demás pueden ser preguntas específicas en la matriz.');
  const siNo = /^¿\s*(es|son|existe|existen|hay|influye|influyen|afecta|afectan|puede|pueden|se puede|tiene|tienen|mejora|mejoran|sirve|funciona|ayuda|ayudan)\b/i.test(t);
  add(!siNo, !siNo ? 'No se responde con sí o no' : 'Se puede responder con sí o no', 'Cámbiala por ¿Qué relación…?, ¿Cómo…?, ¿De qué manera…? o ¿En qué medida…?');
  const opinion = /\b(bueno|buena|malo|mala|mejor que|peor que|deber[ií]a|deben|correcto|incorrecto|vale la pena)\b/.test(tl);
  add(!opinion, !opinion ? 'No es una pregunta de opinión' : 'Parece una pregunta de opinión o de valor', 'Investigar no es decidir si algo es bueno: pregunta por relaciones, experiencias o transformaciones observables.');
  const sesgo = /\b(negativamente|positivamente|perjudica|beneficia|da[nñ]a|lamentable|grave problema)\b/.test(tl);
  add(!sesgo, !sesgo ? 'No da por hecha la respuesta' : 'Ya da por hecha la respuesta', 'Quita adjetivos como «negativamente» o «perjudica»: deja que los datos digan hacia dónde va el efecto.');
  const sujetos = /\b(alumnos|alumnas|estudiantes|docentes|maestros|maestras|profesores|padres|madres|familias|directivos|ni[nñ]os|ni[nñ]as|j[oó]venes|adolescentes|orientadores|colectivo)\b/.test(tl);
  add(sujetos, sujetos ? 'Dice quiénes participan' : 'No dice quiénes participan', 'Nombra a los sujetos: alumnos, docentes, familias…');
  const contexto = /\b(grado|secundaria|primaria|preescolar|bachillerato|preparatoria|universidad|licenciatura|telesecundaria|escuela|plantel|campeche|carmen|champot[oó]n|calkin[ií]|escárcega|hopelch[eé]n|municipio|comunidad|rural|urbana|ind[ií]gena|ciclo|cuatrimestre|semestre|turno|grupo)\b/.test(tl);
  add(contexto, contexto ? 'Tiene contexto (nivel, lugar o tiempo)' : 'Le falta contexto', 'Agrega el grado o nivel, el tipo de escuela y el lugar; si sirve, el periodo (ciclo escolar).');
  const vaga = /\b(la educaci[oó]n|el aprendizaje en general|la sociedad|los j[oó]venes de hoy|todo|todos los)\b/.test(tl);
  add(!vaga, !vaga ? 'Evita expresiones demasiado amplias' : 'Usa expresiones demasiado amplias', 'Cambia «la educación» o «todos» por algo que puedas observar en tu escuela.');
  const objetivo = /^¿\s*c[oó]mo\s+(mejorar|fomentar|impulsar|lograr|aumentar|desarrollar)\b/i.test(t);
  add(!objetivo, !objetivo ? 'Es una pregunta, no un deseo' : 'Suena a deseo u objetivo («¿cómo mejorar…?»)', 'Di quién transforma qué, con quién y cómo lo pondrás a prueba, o conviértelo en un objetivo.');
  return { lista: out, problemas: out.filter(x => !x.ok).length };
}
function etapaPregunta(c) {
  c.insertAdjacentHTML('beforeend', `
    <p class="lab-ayuda">Una investigación es tan buena como su pregunta. Vamos del tema amplio al problema concreto y, de ahí, a una pregunta que se pueda investigar. Esto te resuelve las preguntas 1 y 2 de tu proyecto.</p>
    <div class="t-embudo">
      <div class="t-campo"><label for="f-tema"><span class="t-paso">1</span> Tu tema, en pocas palabras</label><input id="f-tema" type="text" placeholder="Ejemplo: la comprensión lectora en secundaria" value="${esc(T.tema)}"></div>
      <div class="t-campo"><label for="f-problema"><span class="t-paso">2</span> El problema: ¿qué observaste?, ¿dónde?, ¿a quiénes afecta?, ¿por qué importa?</label><textarea id="f-problema" rows="4" placeholder="Ejemplo: en mis prácticas en una secundaria de Campeche vi que muchos alumnos de primero leen en voz alta con fluidez, pero no pueden explicar lo que leyeron.">${esc(T.problema)}</textarea></div>
      <div class="t-campo"><label for="f-pregunta"><span class="t-paso">3</span> Tu pregunta de investigación</label><textarea id="f-pregunta" rows="3" placeholder="¿…?">${esc(T.pregunta)}</textarea></div>
    </div>
    <div class="t-revisor" id="revisor"></div>
    <h3 class="t-h3">Ocho rasgos de una buena pregunta</h3>
    <div class="t-criterios">${D.criterios.map(([t, x]) => `<div><b>${esc(t)}</b><p>${esc(x)}</p></div>`).join('')}</div>
    <h3 class="t-h3">De una pregunta débil a una fuerte</h3>
    <div class="t-ejemplos">${D.ejemplos.map(e => `<article><p class="t-debil">✗ ${esc(e.debil)}</p><p class="t-fuerte">✓ ${esc(e.fuerte)}</p><p class="t-por"><span class="t-tipo" style="--c:${D.tipos[e.tipo].color}">${D.tipos[e.tipo].nombre}</span> ${esc(e.por)}</p></article>`).join('')}</div>`);
  enlazar('#f-tema', v => T.tema = v); enlazar('#f-problema', v => T.problema = v);
  enlazar('#f-pregunta', v => T.pregunta = v, pintarRevisor);
  pintarRevisor();
}
function pintarRevisor() {
  const r = revisar(T.pregunta), box = $('#revisor');
  if (!T.pregunta.trim()) { box.innerHTML = '<p class="t-vacio">Escribe tu pregunta y aquí verás, mientras escribes, qué tan bien planteada está.</p>'; return; }
  const auto = tipoDe(T.pregunta), tipo = T.tipoManual || auto;
  box.innerHTML = `<div class="t-rev-cab"><b>${r.problemas === 0 ? '¡Tu pregunta pasa la revisión!' : `Revisión: ${r.lista.length - r.problemas} de ${r.lista.length} puntos bien`}</b>
      <span class="t-medidor"><i style="width:${Math.round(100 * (r.lista.length - r.problemas) / r.lista.length)}%"></i></span></div>
    <ul class="t-rev">${r.lista.map(x => `<li class="${x.ok ? 'ok' : 'mal'}"><span>${x.ok ? '✓' : '!'}</span><div><b>${esc(x.msg)}</b>${x.ok ? '' : `<p>${esc(x.consejo)}</p>`}</div></li>`).join('')}</ul>
    <div class="t-tipo-box"><p><b>Tipo de pregunta:</b> ${tipo ? `<span class="t-tipo" style="--c:${D.tipos[tipo].color}">${D.tipos[tipo].nombre}</span> ${esc(D.tipos[tipo].txt)}` : 'todavía no se distingue si es explicativa, comprensiva o transformadora.'}</p>
      <label>¿No es correcto? Elige tú: <select id="f-tipo"><option value="">Detectar automáticamente</option>${Object.entries(D.tipos).map(([k, v]) => `<option value="${k}" ${T.tipoManual === k ? 'selected' : ''}>${v.nombre}</option>`).join('')}</select></label>
      <p class="t-nota">La revisión es automática y orientadora: busca palabras y formas comunes. Tu docente y tu asesor tienen la última palabra.</p></div>`;
  $('#f-tipo').addEventListener('change', e => { T.tipoManual = e.target.value; cambio(); pintarRevisor(); });
}

// ------------------------------------------------ Etapa 2: brújula
function etapaBrujula(c) {
  const B = LAB.brujula;
  c.insertAdjacentHTML('beforeend', `<p class="lab-ayuda">Cinco preguntas para ubicar tu investigación en un paradigma (tema 3.1). Te ayuda con las preguntas 2, 4 y 12 del proyecto.</p>
    ${T.pregunta ? `<p class="t-recuerda"><b>Tu pregunta:</b> ${esc(T.pregunta)}</p>` : '<p class="t-recuerda">Te conviene escribir primero tu pregunta en la Etapa 1.</p>'}
    <form id="b-form">${B.preguntas.map((q, i) => `<fieldset class="b-q"><legend>${i + 1}. ${esc(q.t)}</legend>${q.o.map(([t, v]) => `<label><input type="radio" name="q${i}" value="${v}" ${T.brujula.resp[i] === v ? 'checked' : ''}> ${esc(t)}</label>`).join('')}</fieldset>`).join('')}</form>
    <div id="b-res"></div>`);
  $$('#b-form input').forEach(r => r.addEventListener('change', () => { const i = +r.name.slice(1); T.brujula.resp[i] = r.value; calcular(); cambio(); }));
  calcular();
}
function perfil() { return T.brujula.clave ? LAB.brujula.perfiles[T.brujula.clave] : null; }
function calcular() {
  const B = LAB.brujula, puntos = { P: 0, I: 0, S: 0 }; let mixto = false;
  const resp = T.brujula.resp;
  if (B.preguntas.some((q, i) => !resp[i])) { T.brujula.clave = ''; $('#b-res').innerHTML = `<p class="t-vacio">Responde las ${B.preguntas.length} preguntas para ver tu resultado.</p>`; return; }
  resp.forEach(v => { if (v === 'M') { mixto = true; puntos.P += .5; puntos.I += .5; } else puntos[v]++; });
  const ord = Object.entries(puntos).sort((a, b) => b[1] - a[1]); let clave = ord[0][0];
  if (mixto && ['P', 'I'].includes(ord[0][0]) && ['P', 'I'].includes(ord[1][0]) && ord[0][1] - ord[1][1] <= 1) clave = 'M';
  T.brujula.clave = clave;
  const pf = perfil(), tot = puntos.P + puntos.I + puntos.S, N = { P: 'Positivista', I: 'Interpretativo', S: 'Sociocrítico' };
  const tipo = T.tipoManual || tipoDe(T.pregunta);
  const choque = tipo && tipo !== clave && !(tipo === 'M' && ['P', 'I'].includes(clave)) && !(clave === 'M' && ['P', 'I'].includes(tipo));
  $('#b-res').innerHTML = `<div class="b-res"><div class="b-barras">${['P', 'I', 'S'].map(k => `<div class="b-barra"><span>${N[k]}</span><div><i style="width:${Math.round(100 * puntos[k] / tot)}%"></i></div><b>${Math.round(100 * puntos[k] / tot)} %</b></div>`).join('')}</div>
    <p class="ficha-kicker">Tu brújula apunta a</p><h2>${esc(pf.nombre)}</h2><p><b>Enfoque:</b> ${esc(pf.enfoque)} · <b>Finalidad:</b> ${esc(pf.finalidad)}</p>
    ${choque ? `<p class="aviso-lab"><b>Ojo:</b> tu pregunta parece <b>${D.tipos[tipo].nombre.toLowerCase()}</b>, pero tus respuestas apuntan a otro paradigma. Revisa si tu pregunta dice lo que de verdad quieres investigar, o ajusta tus respuestas.</p>` : ''}
    <div class="b-cols"><div><h3>Técnicas que encajan</h3><ul>${pf.tecnicas.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div><div><h3>Criterios de rigor</h3><ul>${pf.rigor.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div><div><h3>Autores para fundamentar</h3><ul>${pf.autores.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div></div>
    <p class="aviso-lab"><b>Riesgo que debes vigilar:</b> ${esc(pf.riesgo)}</p>
    <h3>Borrador de tu fundamentación (te sirve para la pregunta 4)</h3><p class="b-parrafo">${esc(parrafoBrujula())}</p></div>`;
}
function parrafoBrujula() {
  const pf = perfil(); if (!pf) return '';
  const lista = a => a.length > 1 ? a.slice(0, -1).join(', ') + ' y ' + a[a.length - 1] : a[0];
  return `Esta investigación se ubica en ${T.brujula.clave === 'M' ? 'una perspectiva de complementariedad de paradigmas' : 'el ' + pf.nombre.toLowerCase()}, con un enfoque ${pf.enfoque.toLowerCase()}. Esta elección ${pf.frase}. ${T.pregunta ? `Para responder a la pregunta «${T.pregunta.replace(/[«»]/g, '').trim()}», se` : 'Se'} recurrirá a técnicas como ${lista(pf.tecnicas.slice(0, 2).map(t => t.toLowerCase()))}, y la calidad del estudio se cuidará con criterios de ${lista(pf.rigor.map(t => t.toLowerCase()))}. Esta postura se fundamenta en autores como ${lista(pf.autores)}.`;
}

// ------------------------------------------------ Etapa 3: objetivos e hipótesis
function etapaObjetivos(c) {
  const k = T.brujula.clave || T.tipoManual || tipoDe(T.pregunta) || 'I';
  const o = T.objetivos;
  c.insertAdjacentHTML('beforeend', `<p class="lab-ayuda">El <b>objetivo general</b> es tu pregunta convertida en una meta; los <b>específicos</b> son los pasos para lograrla. Empiezan con un verbo en infinitivo que debe ser coherente con tu paradigma. Te ayuda con la pregunta 5.</p>
    ${T.pregunta ? `<p class="t-recuerda"><b>Tu pregunta:</b> ${esc(T.pregunta)}</p>` : ''}
    <p class="t-verbos-t">Verbos que encajan con tu enfoque (${esc(D.tipos[k].nombre.toLowerCase())}): ${D.verbos[k].map(v => `<button type="button" class="chip-lab t-verbo" data-v="${esc(v)}">${esc(v)}</button>`).join(' ')}</p>
    <p class="t-nota">Toca un verbo para agregarlo al campo donde estás escribiendo.</p>
    <div class="t-campo"><label for="o-general">Objetivo general</label><textarea id="o-general" rows="2" placeholder="Comprender cómo…">${esc(o.general)}</textarea></div>
    <div id="o-esp"></div>
    <button type="button" class="btn-lab-l" id="o-mas">+ Agregar objetivo específico</button>
    <div class="t-verif" id="o-verif"></div>
    <h3 class="t-h3">Hipótesis o supuesto, y la prueba de Popper</h3>
    <p class="lab-ayuda">En la investigación cuantitativa escribe una <b>hipótesis</b>; en la cualitativa, un <b>supuesto inicial</b>. En ambos casos, di qué resultado te obligaría a replantearlo: eso la vuelve honesta y, en el caso de la hipótesis, falsable.</p>
    <div class="t-campo"><label for="o-hip">Mi hipótesis o supuesto</label><textarea id="o-hip" rows="2" placeholder="Los alumnos que…">${esc(o.hipotesis)}</textarea></div>
    <div class="t-campo"><label for="o-ref">Me desmentiría que…</label><textarea id="o-ref" rows="2" placeholder="…después de un ciclo escolar, el grupo que participó no supere en comprensión a un grupo comparable.">${esc(o.refutaria)}</textarea></div>
    <div class="t-verif" id="o-verif2"></div>`);
  let foco = $('#o-general');
  const pintarEsp = () => {
    $('#o-esp').innerHTML = o.especificos.map((x, i) => `<div class="t-campo t-esp"><label for="o-e${i}">Objetivo específico ${i + 1}</label><div class="t-fila"><textarea id="o-e${i}" rows="2">${esc(x)}</textarea>${o.especificos.length > 1 ? `<button type="button" class="btn-lab-l t-quitar" data-i="${i}" aria-label="Quitar objetivo ${i + 1}">✕</button>` : ''}</div></div>`).join('');
    o.especificos.forEach((x, i) => { const el = enlazar(`#o-e${i}`, v => o.especificos[i] = v, verificar); el.addEventListener('focus', () => foco = el); });
    $$('#o-esp .t-quitar').forEach(b => b.addEventListener('click', () => { o.especificos.splice(+b.dataset.i, 1); cambio(); pintarEsp(); verificar(); }));
  };
  const verificar = () => {
    const P = Object.values(D.verbos).flat(), avisos = [];
    const inicio = s => s.trim().toLowerCase().split(/\s+/)[0] || '';
    if (o.general.trim() && /^¿|\?$/.test(o.general.trim())) avisos.push('El objetivo general no se escribe como pregunta: empieza con un verbo en infinitivo.');
    if (o.general.trim() && !/(ar|er|ir)$/.test(inicio(o.general))) avisos.push('El objetivo general debería empezar con un verbo en infinitivo (comprender, determinar, diseñar…).');
    o.especificos.forEach((x, i) => { if (x.trim() && !/(ar|er|ir)$/.test(inicio(x))) avisos.push(`El objetivo específico ${i + 1} debería empezar con un verbo en infinitivo.`); });
    if (o.especificos.filter(x => x.trim()).length < 2) avisos.push('Escribe al menos dos objetivos específicos.');
    const malos = { P: /^(comprender|interpretar|reconstruir)/, I: /^(medir|determinar|correlacionar)/ };
    if (malos[k] && [o.general, ...o.especificos].some(x => malos[k].test(x.trim().toLowerCase()))) avisos.push(`Algún verbo no encaja con un enfoque ${D.tipos[k].nombre.toLowerCase()}. Revísalo o considera un enfoque mixto.`);
    $('#o-verif').innerHTML = avisos.length ? `<ul class="t-avisos">${avisos.map(a => `<li>${esc(a)}</li>`).join('')}</ul>` : (o.general.trim() ? '<p class="t-bien">✓ Tus objetivos están bien planteados en la forma.</p>' : '');
    const av2 = [];
    if (o.hipotesis.trim() && !o.refutaria.trim()) av2.push('Te falta decir qué resultado te desmentiría. Sin eso, la hipótesis no es falsable.');
    if (/\b(siempre|nunca|todos|ninguno)\b/i.test(o.hipotesis)) av2.push('Cuidado con «siempre», «nunca» o «todos»: son afirmaciones fáciles de refutar con un solo caso. ¿Es lo que quieres decir?');
    if (o.refutaria.trim() && /(necesitan más tiempo|no se aplicó bien|depende)/i.test(o.refutaria)) av2.push('Tu condición de refutación deja una salida: si cualquier resultado puede explicarse a tu favor, la hipótesis se protege sola (tema 4.2).');
    $('#o-verif2').innerHTML = av2.length ? `<ul class="t-avisos">${av2.map(a => `<li>${esc(a)}</li>`).join('')}</ul>` : (o.refutaria.trim() ? '<p class="t-bien">✓ Dijiste qué te desmentiría: buena señal de falsabilidad.</p>' : '');
  };
  const g = enlazar('#o-general', v => o.general = v, verificar); g.addEventListener('focus', () => foco = g);
  ['#o-hip', '#o-ref'].forEach((s, i) => { const el = enlazar(s, v => { if (i) o.refutaria = v; else o.hipotesis = v; }, verificar); el.addEventListener('focus', () => foco = el); });
  $('#o-mas').addEventListener('click', () => { if (o.especificos.length < 6) { o.especificos.push(''); cambio(); pintarEsp(); } });
  $$('.t-verbo').forEach(b => b.addEventListener('mousedown', e => e.preventDefault()));
  $$('.t-verbo').forEach(b => b.addEventListener('click', () => { const v = b.dataset.v; const el = foco; el.value = (el.value.trim() ? el.value.replace(/\s*$/, ' ') : '') + v.charAt(0).toUpperCase() + v.slice(1) + ' '; el.dispatchEvent(new Event('input')); el.focus(); }));
  pintarEsp(); verificar();
}

// ------------------------------------------------ Etapa 4: matriz de congruencia
function grupoTec(t) { for (const [g, l] of Object.entries(D.tecnicas)) if (l.includes(t)) return g; return ''; }
function etapaMatriz(c) {
  const esp = T.objetivos.especificos.filter(x => x.trim());
  if (!T.matriz.length || T.matriz.length !== Math.max(1, esp.length)) {
    const vieja = T.matriz; T.matriz = (esp.length ? esp : ['']).map((x, i) => Object.assign({ objetivo: x, pregunta: '', tecnica: '', instrumento: '', participantes: '' }, vieja[i] || {}, { objetivo: x }));
  } else T.matriz.forEach((f, i) => { f.objetivo = esp[i] || f.objetivo; });
  const opciones = sel => Object.entries({ cuanti: 'Cuantitativas', cuali: 'Cualitativas', part: 'Participativas' }).map(([g, n]) => `<optgroup label="${n}">${D.tecnicas[g].map(t => `<option ${t === sel ? 'selected' : ''}>${esc(t)}</option>`).join('')}</optgroup>`).join('');
  c.insertAdjacentHTML('beforeend', `<p class="lab-ayuda">La matriz de congruencia muestra que todo cuadra: cada objetivo específico tiene una pregunta, una técnica, un instrumento y unos participantes. Es lo que un sínodo revisa primero. Te sirve para las preguntas 8 y 10.</p>
    ${esp.length ? '' : '<p class="aviso-lab">Primero escribe tus objetivos específicos en la Etapa 3: aquí aparecerá una fila por cada uno.</p>'}
    <div class="t-matriz" id="mz">${T.matriz.map((f, i) => `<article class="t-mz"><p class="ficha-kicker">Objetivo específico ${i + 1}</p><p class="t-mz-obj">${esc(f.objetivo || '(sin escribir)')}</p>
      <div class="t-mz-grid"><label>Pregunta específica<input data-i="${i}" data-c="pregunta" value="${esc(f.pregunta)}" placeholder="¿…?"></label>
      <label>Técnica<select data-i="${i}" data-c="tecnica"><option value="">— Elige —</option>${opciones(f.tecnica)}</select></label>
      <label>Instrumento<input data-i="${i}" data-c="instrumento" value="${esc(f.instrumento)}" placeholder="Guion de entrevista, cuestionario de 20 reactivos…"></label>
      <label>Participantes o fuentes<input data-i="${i}" data-c="participantes" value="${esc(f.participantes)}" placeholder="6 docentes de 1.º, 2.º y 3.º…"></label></div>
      <div class="t-mz-av" id="mz-av${i}"></div></article>`).join('')}</div>
    <div id="mz-global"></div>`);
  const revisarMz = () => {
    const k = T.brujula.clave, esperado = { P: ['cuanti'], I: ['cuali'], S: ['part', 'cuali'], M: ['cuanti', 'cuali'] }[k] || null;
    T.matriz.forEach((f, i) => {
      const av = [];
      if (!f.pregunta.trim() || !f.tecnica || !f.instrumento.trim() || !f.participantes.trim()) av.push(['mal', 'Faltan datos en esta fila.']);
      if (f.tecnica && esperado && !esperado.includes(grupoTec(f.tecnica))) av.push(['mal', `«${f.tecnica}» es una técnica ${{ cuanti: 'cuantitativa', cuali: 'cualitativa', part: 'participativa' }[grupoTec(f.tecnica)]}, y tu brújula apunta al ${perfil().nombre.toLowerCase()}. O ajustas la técnica, o justificas un enfoque mixto.`]);
      if (f.pregunta.trim() && /^¿\s*(es|hay|existe|influye|afecta|puede)\b/i.test(f.pregunta.trim())) av.push(['mal', 'La pregunta específica se responde con sí o no: ábrela.']);
      if (!av.length && f.tecnica) av.push(['ok', 'Esta fila es congruente.']);
      $('#mz-av' + i).innerHTML = av.map(([c, t]) => `<p class="t-${c === 'ok' ? 'bien' : 'aviso'}">${c === 'ok' ? '✓' : '!'} ${esc(t)}</p>`).join('');
    });
    const grupos = new Set(T.matriz.map(f => grupoTec(f.tecnica)).filter(Boolean));
    $('#mz-global').innerHTML = !k ? '<p class="aviso-lab">Completa la brújula (Etapa 2) para revisar la congruencia con tu paradigma.</p>'
      : grupos.size > 1 && k !== 'M' ? '<p class="aviso-lab">Usas técnicas de más de un tipo. Puede estar bien si lo justificas como un diseño mixto o como triangulación (pregunta 10).</p>' : '';
  };
  $$('#mz input, #mz select').forEach(el => el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', () => { T.matriz[+el.dataset.i][el.dataset.c] = el.value; cambio(); revisarMz(); }));
  revisarMz();
}

// ------------------------------------------------ Etapa 5: las 18 preguntas
let entregaSel = 'entrega1';
function apoyo(p) {
  const o = T.objetivos, pf = perfil();
  switch (p.usa) {
    case 'pregunta': return T.pregunta ? `Mi tema es ${T.tema || '…'}. ${T.problema ? T.problema.trim() + ' ' : ''}Por eso, mi pregunta de investigación es: ${T.pregunta.trim()}` : '';
    case 'tipo': { const t = T.tipoManual || tipoDe(T.pregunta); return t ? `Mi pregunta es de tipo ${D.tipos[t].nombre.toLowerCase()}: ${D.tipos[t].txt}` : ''; }
    case 'brujula': return parrafoBrujula();
    case 'hipotesis': return o.hipotesis ? `Mi ${T.brujula.clave === 'I' ? 'supuesto inicial' : 'hipótesis'} es: ${o.hipotesis.trim()} Me desmentiría que ${o.refutaria.trim().replace(/^…/, '')}` : '';
    case 'matriz': return T.matriz.filter(f => f.tecnica).length ? `Para responder a mi pregunta usaré ${T.matriz.filter(f => f.tecnica).map(f => `${f.tecnica.toLowerCase()} (${f.instrumento || 'instrumento por definir'}) con ${f.participantes || 'participantes por definir'}`).join('; ')}.` : '';
    case 'rigor': return pf ? `Como mi enfoque es ${pf.enfoque.toLowerCase()}, cuidaré criterios de ${pf.rigor.join(', ').toLowerCase()}.` : '';
    case 'etica': { const si = D.etica.filter((_, i) => T.etica[i]); return si.length ? 'Para atender la ética de mi investigación: ' + si.map(x => x.charAt(0).toLowerCase() + x.slice(1).replace(/\.$/, '')).join('; ') + '.' : ''; }
    default: return '';
  }
}
function etapaCuaderno(c) {
  c.insertAdjacentHTML('beforeend', `<p class="lab-ayuda">Aquí escribes tu proyecto. Cada pregunta te dice qué te piden, te da pistas y te sugiere autores. Lo que hiciste en las etapas anteriores aparece como punto de partida. Busca de 150 a 250 palabras por respuesta.</p>
    <div class="lab-chips" id="c-ent">${Object.entries(D.entregas).map(([k, e]) => `<button type="button" class="chip-lab" aria-pressed="${k === entregaSel}" data-e="${k}">${esc(e.nombre)}</button>`).join('')}</div>
    <div id="c-lista"></div>`);
  $$('#c-ent .chip-lab').forEach(b => b.addEventListener('click', () => { entregaSel = b.dataset.e; $$('#c-ent .chip-lab').forEach(x => x.setAttribute('aria-pressed', String(x === b))); pintarCuaderno(); }));
  pintarCuaderno();
}
function pintarCuaderno() {
  const e = D.entregas[entregaSel], lista = D.preguntas.filter(p => p.entrega === entregaSel);
  const hechas = lista.filter(p => palabras(T.respuestas[p.n]) >= 150).length;
  $('#c-lista').innerHTML = `<div class="t-entrega"><b>${esc(e.nombre)}</b> · ${esc(e.fecha)}<p>${esc(e.req)}</p><p>Llevas <b>${hechas} de ${lista.length}</b> respuestas con al menos 150 palabras.</p>
      <button type="button" class="btn-lab" id="c-word">Descargar en Word (preguntas 1 a ${lista[lista.length - 1].n})</button></div>
    ${lista.map(p => { const ap = apoyo(p); return `<article class="t-preg" id="preg-${p.n}"><h3><span class="t-pn">${p.n}</span>${esc(p.texto)}</h3>
      <p class="t-pide"><b>Qué te piden:</b> ${esc(p.pide)}</p>
      <details class="t-pistas"><summary>Pistas, error común y autores</summary><ul>${p.pistas.map(x => `<li>${esc(x)}</li>`).join('')}</ul><p class="t-error-comun"><b>Error común:</b> ${esc(p.error)}</p>
        <p class="t-aut"><b>Autores:</b> ${p.autores.map(a => `<a href="laboratorio.html#constelacion=${a}" target="_blank" rel="noopener">${esc(NOMBRES_AUT[a] || a)}</a>`).join(' · ')} · <b>Compendio:</b> ${p.temas.map(t => `<a href="tema.html?id=${t}" target="_blank" rel="noopener">${t}</a>`).join(' · ')}</p></details>
      ${ap ? `<div class="t-apoyo"><p><b>Punto de partida con lo que ya hiciste:</b> ${esc(ap)}</p><button type="button" class="btn-lab-l t-usar" data-n="${p.n}">Usarlo en mi respuesta</button></div>` : ''}
      <textarea class="t-resp" data-n="${p.n}" rows="7" placeholder="Escribe aquí tu respuesta con tus palabras y tus citas en APA.">${esc(T.respuestas[p.n] || '')}</textarea>
      <p class="t-cuenta" id="cnt-${p.n}"></p></article>`; }).join('')}`;
  const cuenta = n => { const w = palabras(T.respuestas[n]), el = $('#cnt-' + n); el.textContent = `${w} palabras ${w < 150 ? `· te faltan ${150 - w} para el mínimo` : w > 250 ? '· pasaste el máximo de 250' : '· ✓ dentro del rango'}`; el.className = 't-cuenta ' + (w < 150 ? '' : w > 250 ? 'mal' : 'ok'); };
  $$('.t-resp').forEach(t => { cuenta(t.dataset.n); t.addEventListener('input', () => { T.respuestas[t.dataset.n] = t.value; cuenta(t.dataset.n); cambio(); }); });
  $$('.t-usar').forEach(b => b.addEventListener('click', () => { const p = D.preguntas.find(x => x.n === +b.dataset.n), t = $(`.t-resp[data-n="${p.n}"]`); t.value = (t.value.trim() ? t.value.trim() + '\n\n' : '') + apoyo(p); t.dispatchEvent(new Event('input')); t.focus(); }));
  $('#c-word').addEventListener('click', () => descargarWord(entregaSel));
}
function descargarWord(ent) {
  const hasta = D.preguntas.filter(p => p.entrega === ent).slice(-1)[0].n;
  const lista = D.preguntas.filter(p => p.n <= hasta), e = D.entregas[ent];
  const parr = t => String(t || '').split(/\n+/).filter(x => x.trim()).map(x => `<p class="txt">${esc(x.trim())}</p>`).join('') || '<p class="txt"><i>(sin respuesta)</i></p>';
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${esc(e.nombre)}</title>
    <style>@page{size:21.59cm 27.94cm;margin:2.54cm} body{font-family:'Times New Roman';font-size:12pt;line-height:200%} p{margin:0} .txt{text-indent:1.27cm} h1{font-size:12pt;text-align:center;font-weight:bold} h2{font-size:12pt;font-weight:bold;margin-top:12pt} .port{text-align:center}</style></head><body>
    <p class="port"><b>Pienso, luego investigo</b></p><p class="port">${esc(sesion.anon ? '' : sesion.nombre)}</p><p class="port">Epistemología y Pedagogía · ITES René Descartes</p><p class="port">${esc(e.nombre)} · ${esc(e.fecha)}</p><br>
    <h1>${esc(T.pregunta || 'Pregunta de investigación')}</h1>
    ${lista.map(p => `<h2>${p.n}. ${esc(p.texto)}</h2>${parr(T.respuestas[p.n])}`).join('')}
    <h1 style="margin-top:24pt">Referencias</h1><p class="txt"><i>Agrega aquí tus referencias en orden alfabético y con sangría francesa.</i></p></body></html>`;
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿', html], { type: 'application/msword' }));
  a.download = `Pienso_luego_investigo_${ent}_${slug(sesion.anon ? 'borrador' : sesion.nombre)}.doc`; document.body.appendChild(a); a.click(); a.remove();
}

// ------------------------------------------------ Etapa 6: ética, APA y defensa
function etapaCierre(c) {
  const lista = (arr, campo, id) => `<div class="t-check" id="${id}">${arr.map((x, i) => `<label><input type="checkbox" data-i="${i}" ${T[campo][i] ? 'checked' : ''}> ${esc(x)}</label>`).join('')}</div>`;
  c.insertAdjacentHTML('beforeend', `<h3 class="t-h3">Lista de ética (pregunta 16)</h3><p class="lab-ayuda">Toda investigación con personas tiene dilemas éticos. Marca lo que ya tienes resuelto; lo que no puedas marcar es lo que debes atender (tema 9.1).</p>${lista(D.etica, 'etica', 'l-etica')}
    <h3 class="t-h3">Revisión de APA antes de entregar</h3>${lista(D.apa, 'apa', 'l-apa')}
    <h3 class="t-h3">Guion para tu defensa oral de 3 minutos</h3>
    <p class="lab-ayuda">Se arma con lo que escribiste. Edítalo, léelo en voz alta y cronométrate: en 3 minutos se dicen unas 400 palabras.</p>
    <button type="button" class="btn-lab-l" id="g-armar">Armar guion con mis respuestas</button>
    <textarea id="g-texto" rows="14" placeholder="Tu guion aparecerá aquí.">${esc(T.guion)}</textarea><p class="t-cuenta" id="g-cnt"></p>
    <div class="t-crono"><span id="g-reloj">3:00</span><button type="button" class="btn-lab" id="g-start">▶ Ensayar</button><button type="button" class="btn-lab-l" id="g-reset">Reiniciar</button></div>`);
  [['#l-etica', 'etica'], ['#l-apa', 'apa']].forEach(([s, campo]) => $$(s + ' input').forEach(ch => ch.addEventListener('change', () => { T[campo][+ch.dataset.i] = ch.checked; cambio(); })));
  const cnt = () => { const w = palabras(T.guion); $('#g-cnt').textContent = `${w} palabras · unos ${Math.round(w / 135 * 60)} segundos leyendo con calma`; };
  enlazar('#g-texto', v => T.guion = v, cnt); cnt();
  $('#g-armar').addEventListener('click', () => {
    if (T.guion.trim() && !confirm('¿Reemplazar tu guion actual por uno nuevo armado con tus respuestas?')) return;
    const primera = n => { const t = String(T.respuestas[n] || '').replace(/\s+/g, ' ').trim(); const m = t.match(/^(.+?[.!?])\s+(.+?[.!?])?/); return m ? (m[1] + ' ' + (m[2] || '')).trim() : t.slice(0, 280); };
    const bloques = [
      ['0:00 · El problema y la pregunta (30 s)', primera(1) || T.pregunta],
      ['0:30 · Mi postura epistemológica (40 s)', primera(4) || parrafoBrujula().split('. ').slice(0, 2).join('. ')],
      ['1:10 · Cómo lo voy a investigar (40 s)', primera(8)],
      ['1:50 · Rigor y ética (30 s)', [primera(10), primera(16)].filter(Boolean).join(' ')],
      ['2:20 · Mi respuesta: ¿es ciencia? (30 s)', primera(18) || primera(14)],
      ['2:50 · Cierre (10 s)', 'Gracias. Estoy listo para sus preguntas.'],
    ];
    T.guion = bloques.map(([t, x]) => `[${t}]\n${x || '(escribe aquí)'}`).join('\n\n');
    $('#g-texto').value = T.guion; cnt(); cambio();
  });
  let rest = 180, iv = null;
  const pinta = () => { $('#g-reloj').textContent = `${Math.floor(rest / 60)}:${String(rest % 60).padStart(2, '0')}`; $('#g-reloj').classList.toggle('fin', rest <= 20); };
  $('#g-start').addEventListener('click', () => { if (iv) { clearInterval(iv); iv = null; $('#g-start').textContent = '▶ Continuar'; return; } $('#g-start').textContent = '⏸ Pausa'; iv = setInterval(() => { rest = Math.max(0, rest - 1); pinta(); if (!rest) { clearInterval(iv); iv = null; $('#g-start').textContent = '▶ Ensayar'; } }, 1000); });
  $('#g-reset').addEventListener('click', () => { clearInterval(iv); iv = null; rest = 180; pinta(); $('#g-start').textContent = '▶ Ensayar'; });
}

// ======================================================= inicio
(async () => {
  let s = null; try { s = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); } catch { s = null; }
  if (s && s.grupoId && s.alumnoId && s.pin) { sesion = s; entrar(); } else cargarGrupos();
})();
