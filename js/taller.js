// taller.js — Taller del investigador (proyecto «Pienso, luego investigo»).
// El alumno entra con grupo, nombre y PIN. Todo lo que escribe se guarda
// automáticamente en grupos/{grupo}/alumnos/{alumno}/investigacion/taller
// (y una copia en el navegador). El docente ve el avance en el Panel docente.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";
import { descargarAPA } from "./apa-word.js?v=2026102706";

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
const vacio = () => ({ tema: '', problema: '', pregunta: '', tipoManual: '', brujula: { resp: [], clave: '' }, objetivos: { general: '', especificos: ['', '', ''], hipotesis: '', refutaria: '' }, matriz: [], respuestas: {}, etica: [], apa: [], guion: '', etapaMax: 0, e1: {}, e1paso: 0, refs: { sel: [], otras: '' } });

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
  // La matriz es para la Entrega 2: si alguien se quedó ahí, abre en las 18 preguntas.
  if (D.etapas[etapa].id === 'matriz' && !T.matriz.some(f => f.tecnica)) etapa = D.etapas.findIndex(e => e.id === 'cuaderno');
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
  const hecho = {
    pregunta: !!T.pregunta && r.problemas === 0,
    brujula: !!T.brujula.clave,
    objetivos: !!o.general.trim() && o.especificos.filter(x => x.trim()).length >= 2 && !!o.hipotesis.trim() && !!o.refutaria.trim(),
    cuaderno: D.preguntas.every(p => palabras(T.respuestas[p.n]) >= 150),
    matriz: T.matriz.length > 0 && T.matriz.every(f => f.tecnica && f.instrumento.trim() && f.participantes.trim()),
    cierre: T.etica.length === D.etica.length && T.etica.every(Boolean),
  };
  return D.etapas.map(e => hecho[e.id]);
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
  const P = /(relaci[oó]n|efecto|influ|impacto|diferencia|cu[aá]nto|en qu[eé] medida|nivel de|correlaci|frecuencia|porcentaje|compar|factores|se asocia)/.test(t);
  const I = /(c[oó]mo viven|c[oó]mo vive\b|significad|percepci|experiencia|perciben|sentido|interpretan|qu[eé] piensan|narrativ|vivencia|c[oó]mo describen|c[oó]mo explican|representacion|creencias|estereotipos|qu[eé] aprenden|qu[eé] aprendizajes|qu[eé] esperan|qu[eé] valores|qu[eé] estrategias|qu[eé] barreras|qu[eé] se gan[oó]|^¿\s*c[oó]mo (?!puede|podemos|pueden|se puede|mejorar|fomentar|impulsar|lograr|aumentar|desarrollar)\S+)/.test(t);
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
  const sujetos = /\b(alumnos?|alumnas?|estudiantes?|docentes?|maestros?|maestras?|profesores|profesoras|educadoras?|educadores|padres|madres|familias|directivos|directores|directoras|supervisores|ni[nñ]os?|ni[nñ]as?|beb[eé]s|j[oó]venes|adolescentes|orientadores|colectivo|grupo|empleados|trabajadores|trabajadoras|pacientes|adultos|adultas|personas|abuelos|abuelas|l[ií]deres|asesores|asesoras|gu[ií]as|guardaparques|m[eé]dicos|enfermeras|enfermeros|mujeres|hombres|tutores|pedagogos?|comit[eé]|egresados|hijos|hijas|visitantes|usuarios)\b/.test(tl);
  add(sujetos, sujetos ? 'Dice quiénes participan' : 'No dice quiénes participan', 'Nombra a los sujetos: alumnos, docentes, familias…');
  const contexto = /\b(grados?|secundarias?|primarias?|preescolar(es)?|bachillerato|preparatoria|universidad|universitari[oa]s|licenciatura|telesecundarias?|escuelas?|planteles?|campeche|carmen|champot[oó]n|calkin[ií]|esc[aá]rcega|hopelch[eé]n|calakmul|candelaria|tenabo|hecelchak[aá]n|palizada|seybaplaya|dzitbalch[eé]|municipio|comunidad(es)?|localidad(es)?|rurales?|urbanas?|ind[ií]genas?|ciclo|cuatrimestre|semestre|turno|grupo|hospital(es)?|cl[ií]nica|centro de salud|empresas?|hotel(es)?|industria|cadena comercial|inea|conafe|museos?|bibliotecas?|dif|casa hogar|reserva|colonias?|centro penitenciario|c[ií]rculo de estudio|educaci[oó]n b[aá]sica|usaer|cam|centro de atenci[oó]n|jard[ií]n de ni[nñ]os|normal|ciudad|pa[ií]s|estado|consejo t[eé]cnico|pediatr[ií]a|aula hospitalaria)\b/.test(tl);
  add(contexto, contexto ? 'Tiene contexto (nivel, lugar o tiempo)' : 'Le falta contexto', 'Agrega el grado o nivel, el tipo de escuela y el lugar; si sirve, el periodo (ciclo escolar).');
  const vaga = /\b(la educaci[oó]n(?! (para|de|escolar|financiera|ambiental|especial|comunitaria|ind[ií]gena|inicial|socioemocional|b[aá]sica|media|superior))|el aprendizaje en general|la sociedad|los j[oó]venes de hoy|todos los|todas las)\b|(?<!sobre )\btodo\b/.test(tl);
  add(!vaga, !vaga ? 'Evita expresiones demasiado amplias' : 'Usa expresiones demasiado amplias', 'Cambia «la educación» o «todos» por algo que puedas observar en tu escuela.');
  const objetivo = /^¿\s*c[oó]mo\s+(mejorar|fomentar|impulsar|lograr|aumentar|desarrollar)\b/i.test(t);
  add(!objetivo, !objetivo ? 'Es una pregunta, no un deseo' : 'Suena a deseo u objetivo («¿cómo mejorar…?»)', 'Di quién transforma qué, con quién y cómo lo pondrás a prueba, o conviértelo en un objetivo.');
  return { lista: out, problemas: out.filter(x => !x.ok).length };
}
function etapaPregunta(c) {
  c.insertAdjacentHTML('beforeend', `
    <p class="lab-ayuda">Una investigación es tan buena como su pregunta. Vamos del tema amplio al problema concreto y, de ahí, a una pregunta que se pueda investigar. Esto te resuelve las preguntas 1 y 2 de tu proyecto.</p>
    <h3 class="t-h3">La fórmula de una buena pregunta</h3>
    <p class="lab-ayuda">Casi toda buena pregunta de investigación junta cinco piezas. Si a la tuya le falta una, el revisor te lo dirá.</p>
    <div class="t-tabla-wrap"><table class="t-formula"><thead><tr><th>Pieza</th><th>Pregunta que responde</th><th>Ejemplo</th><th>Para qué sirve</th></tr></thead><tbody>
      ${D.guia.formula.filas.map(([a, b, c2, d]) => `<tr><th scope="row">${esc(a)}</th><td>${esc(b)}</td><td><i>${esc(c2)}</i></td><td>${esc(d)}</td></tr>`).join('')}</tbody></table></div>
    <p class="t-formula-res"><b>Resultado:</b> <i>${esc(D.guia.formula.resultado)}</i></p>
    <h3 class="t-h3">Antes de elegir: cuatro advertencias</h3>
    <div class="t-advert">${D.guia.advertencias.map(([t, x], i) => `<div><span class="t-paso">${i + 1}</span><b>${esc(t)}</b><p>${esc(x)}</p></div>`).join('')}</div>
    <details class="t-banco" id="banco"><summary><b>¿No sabes por dónde empezar?</b> Explora 160 preguntas de ejemplo</summary>
      <p class="lab-ayuda">Son puntos de partida, no preguntas terminadas. Elige una que te interese y que puedas investigar en un lugar al que tengas acceso; luego <b>cámbiale el lugar, los sujetos y el tiempo por los tuyos</b> y deja que el revisor te ayude a afinarla. Si te interesa el tema pero no el enfoque, cambia la entrada: «¿Qué relación existe…?» mide, «¿Cómo viven…?» comprende y «¿Cómo puede… junto con…?» transforma.</p>
      <div class="t-banco-filtros">
        <label>Lugar o problema<select id="bk-amb"><option value="">Todos</option><optgroup label="Por lugar de trabajo">${D.banco.ambitos.filter(a => a.grupo === 'lugar').map(a => `<option value="${a.id}">${esc(a.nombre)}</option>`).join('')}</optgroup><optgroup label="Por tipo de problema">${D.banco.ambitos.filter(a => a.grupo === 'problema').map(a => `<option value="${a.id}">${esc(a.nombre)}</option>`).join('')}</optgroup></select></label>
        <label>Buscar<input id="bk-q" type="search" placeholder="Ejemplo: lectura, autismo, hospital…"></label>
      </div>
      <div class="lab-chips" id="bk-tipo">${[['', 'Todos los tipos'], ['E', 'Explicativas'], ['C', 'Comprensivas'], ['T', 'Transformadoras']].map(([k, n]) => `<button type="button" class="chip-lab" data-t="${k}" aria-pressed="${k === ''}">${n}</button>`).join('')}</div>
      <p class="t-nota" id="bk-cuenta"></p>
      <ol class="t-banco-lista" id="bk-lista"></ol>
    </details>
    <div class="t-embudo">
      <div class="t-campo"><label for="f-tema"><span class="t-paso">1</span> Tu tema, en pocas palabras</label><input id="f-tema" type="text" placeholder="Ejemplo: la comprensión lectora en secundaria" value="${esc(T.tema)}"></div>
      <div class="t-campo"><label for="f-problema"><span class="t-paso">2</span> El problema: ¿qué observaste?, ¿dónde?, ¿a quiénes afecta?, ¿por qué importa?</label><textarea id="f-problema" rows="4" placeholder="Ejemplo: en mis prácticas en una secundaria de Campeche vi que muchos alumnos de primero leen en voz alta con fluidez, pero no pueden explicar lo que leyeron.">${esc(T.problema)}</textarea></div>
      <div class="t-campo"><label for="f-pregunta"><span class="t-paso">3</span> Tu pregunta de investigación</label><textarea id="f-pregunta" rows="3" placeholder="¿…?">${esc(T.pregunta)}</textarea></div>
    </div>
    <div class="t-revisor" id="revisor"></div>
    <h3 class="t-h3" id="tipos-fondo">Los tres tipos de pregunta, a fondo</h3>
    <p class="lab-ayuda">La palabra con la que empieza tu pregunta casi decide el paradigma, el enfoque, las técnicas y hasta cómo se verán tus resultados. Elige un tipo para conocerlo a fondo.</p>
    <div class="lab-chips" id="tf-tabs" role="tablist">${['P', 'I', 'S'].map((k, i) => `<button type="button" role="tab" class="chip-lab" data-k="${k}" aria-pressed="${i === 0}">${D.guia.tipos[k].letra} · ${D.guia.tipos[k].nombre}</button>`).join('')}</div>
    <div id="tf-ficha"></div>
    <p class="t-nota">${md(D.guia.mixta)}</p>
    <h3 class="t-h3">Un mismo tema, tres preguntas distintas</h3>
    <p class="lab-ayuda">Tema: <b>${esc(D.guia.comparativa.tema)}</b>. Fíjate cómo cambia todo al cambiar solo la entrada de la pregunta.</p>
    <div class="t-compara">${D.guia.comparativa.filas.map(([k, q, r, t]) => `<article style="--c:${D.tipos[k].color}"><span class="t-tipo" style="--c:${D.tipos[k].color}">${D.tipos[k].nombre}</span><p class="t-compara-q">${esc(q)}</p><p><b>Lo que obtendrías:</b> ${esc(r)}</p><p><b>Con qué:</b> ${esc(t)}</p></article>`).join('')}</div>
    <h3 class="t-h3">Pon a prueba tu ojo</h3>
    <p class="lab-ayuda">¿Qué tipo es cada pregunta? Elige y revisa la explicación.</p>
    <ol class="t-prueba" id="tp">${D.guia.prueba.map(([q], i) => `<li data-i="${i}"><p>${esc(q)}</p><div class="t-prueba-ops">${['P', 'I', 'S'].map(k => `<button type="button" class="chip-lab" data-k="${k}">${D.tipos[k].nombre}</button>`).join('')}</div><p class="t-prueba-fb" hidden></p></li>`).join('')}</ol>
    <p class="t-nota" id="tp-total"></p>
    <h3 class="t-h3">Ocho rasgos de una buena pregunta</h3>
    <div class="t-criterios">${D.criterios.map(([t, x]) => `<div><b>${esc(t)}</b><p>${esc(x)}</p></div>`).join('')}</div>
    <h3 class="t-h3">De una pregunta débil a una fuerte</h3>
    <div class="t-ejemplos">${D.ejemplos.map(e => `<article><p class="t-debil">✗ ${esc(e.debil)}</p><p class="t-fuerte">✓ ${esc(e.fuerte)}</p><p class="t-por"><span class="t-tipo" style="--c:${D.tipos[e.tipo].color}">${D.tipos[e.tipo].nombre}</span> ${esc(e.por)}</p></article>`).join('')}</div>`);
  enlazar('#f-tema', v => T.tema = v); enlazar('#f-problema', v => T.problema = v);
  enlazar('#f-pregunta', v => T.pregunta = v, pintarRevisor);
  pintarRevisor();
  iniciarBanco();
  iniciarTipos();
}
function fichaTipo(k) {
  const t = D.guia.tipos[k], fila = (r, x) => `<div class="t-ff"><dt>${r}</dt><dd>${md(x)}</dd></div>`;
  $('#tf-ficha').innerHTML = `<article class="t-ficha-tipo" style="--c:${D.tipos[k].color}">
    <header><span class="t-letra">${t.letra}</span><div><h4>Pregunta ${t.nombre.toLowerCase()}</h4><p>Paradigma <b>${esc(t.paradigma)}</b> · Enfoque <b>${esc(t.enfoque)}</b></p></div></header>
    <p class="t-ficha-idea">${md(t.idea)}</p>
    <p><b>Cómo suele empezar:</b></p><ul class="t-entradas">${t.entradas.map(e => `<li>${esc(e)}</li>`).join('')}</ul>
    <p class="t-ficha-clave"><b>La clave para reconocerla.</b> ${md(t.clave)}</p>
    <dl class="t-ff-lista">${fila('Qué tipo de respuesta produce', t.produce)}${fila('Técnicas que usa', t.tecnicas)}${fila('Papel del investigador', t.investigador)}${fila('Cómo se cuida el rigor', t.rigor)}${fila('¿Hipótesis?', t.hipotesis)}${fila('De dónde viene', t.raices)}</dl>
    <p class="t-ficha-tuya"><b>Es tu tipo si…</b> ${md(t.esTuya)}</p>
    <p class="aviso-lab"><b>Confusión común:</b> ${md(t.confusion)}</p>
    <p><b>Ejemplo:</b> <i>${esc(t.ejemplo)}</i></p></article>`;
}
function iniciarTipos() {
  const elegir = k => { $$('#tf-tabs .chip-lab').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.k === k))); fichaTipo(k); };
  $$('#tf-tabs .chip-lab').forEach(b => b.addEventListener('click', () => elegir(b.dataset.k)));
  const t0 = T.tipoManual || tipoDe(T.pregunta); elegir(['P', 'I', 'S'].includes(t0) ? t0 : 'P');
  let bien = 0, hechas = 0;
  $$('#tp li').forEach(li => li.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
    if (li.dataset.ok) return;
    const [, k, por] = D.guia.prueba[+li.dataset.i], ok = b.dataset.k === k;
    li.dataset.ok = '1'; hechas++; if (ok) bien++;
    li.querySelectorAll('button').forEach(x => { x.disabled = true; if (x.dataset.k === k) x.classList.add('t-ok'); else if (x === b) x.classList.add('t-mal'); });
    const fb = li.querySelector('.t-prueba-fb'); fb.hidden = false;
    fb.innerHTML = `<b>${ok ? '¡Correcto!' : `Es ${D.tipos[k].nombre.toLowerCase()}.`}</b> ${esc(por)}`;
    $('#tp-total').textContent = `Llevas ${bien} de ${hechas} correctas${hechas === D.guia.prueba.length ? (bien === hechas ? '. ¡Excelente ojo!' : '. Repasa la ficha del tipo que más se te dificultó.') : '.'}`;
  })));
}
const TIPO_BANCO = { E: 'P', C: 'I', T: 'S' };
function iniciarBanco() {
  let tipo = '';
  const norm = x => x.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // cada palabra buscada debe aparecer; las largas también por su raíz (autismo ~ autista)
  const coincide = (texto, q) => q.split(/\s+/).every(w => texto.includes(w) || (w.length >= 6 && texto.includes(w.slice(0, 5))));
  const nombreAmb = Object.fromEntries(D.banco.ambitos.map(a => [a.id, a.nombre]));
  const pintar = () => {
    const amb = $('#bk-amb').value, q = norm($('#bk-q').value.trim());
    const lista = D.banco.preguntas.filter(p => (!amb || p.a === amb) && (!tipo || p.t === tipo) && (!q || coincide(norm(p.q + ' ' + nombreAmb[p.a]), q)));
    $('#bk-cuenta').textContent = lista.length ? `${lista.length} pregunta${lista.length === 1 ? '' : 's'}` : 'Ninguna pregunta coincide. Prueba con otra palabra o quita un filtro.';
    $('#bk-lista').innerHTML = lista.map(p => { const k = TIPO_BANCO[p.t]; return `<li><p class="t-banco-q"><span class="t-pn">${p.n}</span>${esc(p.q)}</p>
      <p class="t-banco-meta"><span class="t-tipo" style="--c:${D.tipos[k].color}">${D.tipos[k].nombre}</span> <small>${esc(nombreAmb[p.a])}</small>
      <button type="button" class="btn-lab-l t-banco-usar" data-n="${p.n}">Usar como punto de partida</button></p></li>`; }).join('');
    $$('#bk-lista .t-banco-usar').forEach(b => b.addEventListener('click', () => {
      const p = D.banco.preguntas[+b.dataset.n - 1];
      if (T.pregunta.trim() && T.pregunta.trim() !== p.q && !confirm('Ya tienes una pregunta escrita. ¿La reemplazas por esta para adaptarla?')) return;
      T.pregunta = p.q; T.tipoManual = ''; $('#f-pregunta').value = p.q; cambio(); pintarRevisor();
      $('#banco').open = false;
      const f = $('#f-pregunta'); f.scrollIntoView({ behavior: 'smooth', block: 'center' }); f.focus();
      let av = $('#bk-aviso'); if (!av) { av = document.createElement('p'); av.id = 'bk-aviso'; av.className = 'aviso-lab'; f.parentElement.appendChild(av); }
      av.innerHTML = '<b>Ahora hazla tuya:</b> cambia el lugar, los sujetos y, si quieres, el tiempo por los de tu realidad (tu escuela de prácticas, tu trabajo, tu comunidad). Una pregunta copiada tal cual no es tu pregunta.';
    }));
  };
  $('#bk-amb').addEventListener('change', pintar);
  $('#bk-q').addEventListener('input', pintar);
  $$('#bk-tipo .chip-lab').forEach(b => b.addEventListener('click', () => { tipo = b.dataset.t; $$('#bk-tipo .chip-lab').forEach(x => x.setAttribute('aria-pressed', String(x === b))); pintar(); }));
  pintar();
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
      ${tipo && tipo !== 'M' ? `<p><button type="button" class="link-btn" id="rev-ver-tipo">Ver qué significa una pregunta ${D.tipos[tipo].nombre.toLowerCase()} →</button></p>` : ''}
      <p class="t-nota">La revisión es automática y orientadora: busca palabras y formas comunes. Tu docente y tu asesor tienen la última palabra.</p></div>`;
  $('#f-tipo').addEventListener('change', e => { T.tipoManual = e.target.value; cambio(); pintarRevisor(); });
  const vt = $('#rev-ver-tipo'); if (vt) vt.addEventListener('click', () => { const k = T.tipoManual || tipoDe(T.pregunta); $(`#tf-tabs [data-k="${k}"]`).click(); $('#tipos-fondo').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
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
  const o = T.objetivos, kk = PASOS_ESP[k] ? k : 'I';
  // Lo que el alumno arma en cuadritos. Si ya tenía texto escrito, empieza en «Prefiero escribirlo yo» para no tocarlo.
  const A = o.arma = Object.assign({ mg: o.general.trim() ? 'libre' : 'armar', me: o.especificos.some(x => x.trim()) ? 'libre' : 'armar', mh: o.hipotesis.trim() ? 'libre' : 'armar', g: {}, e: [], h: {} }, o.arma || {});
  A.g.con = A.g.con || CONECTOR[k] || 'en';
  const nPasos = Math.max(PASOS_ESP[kk].length, A.e.length);
  while (A.e.length < nPasos) A.e.push({});
  const sug = sugerenciasPregunta(T.pregunta);
  const nombreH = k === 'I' ? 'supuesto inicial' : k === 'S' ? 'supuesto de acción' : 'hipótesis';
  const modo = (id, m) => `<div class="t-modo" role="group" aria-label="Cómo quieres escribirlo"><button type="button" data-m="armar" data-s="${id}" aria-pressed="${m === 'armar'}">🧩 Armar con cuadritos</button><button type="button" data-m="libre" data-s="${id}" aria-pressed="${m === 'libre'}">✍️ Prefiero escribirlo yo</button></div>`;

  c.insertAdjacentHTML('beforeend', `<p class="lab-ayuda">El <b>objetivo general</b> es tu pregunta convertida en una meta; los <b>específicos</b> son los pasos para lograrla. Empiezan con un verbo en infinitivo que debe ser coherente con tu paradigma. Te ayuda con la pregunta 5.</p>
    ${guiaObjetivos(k)}
    ${T.pregunta ? `<p class="t-recuerda"><b>Tu pregunta:</b> ${esc(T.pregunta)}</p>` : ''}
    <h3 class="t-h3">Objetivo general</h3>
    ${modo('g', A.mg)}
    <div id="og-armar" ${A.mg === 'armar' ? '' : 'hidden'}>${armadorHTML('g', piezasGeneral(k, sug), A.g)}<div class="t-arma-prev" id="og-prev"></div></div>
    <div id="og-libre" class="t-campo" ${A.mg === 'libre' ? '' : 'hidden'}><label for="o-general">Objetivo general</label>
      ${selVerbo('g', 'general', k)}
      <textarea id="o-general" rows="2" placeholder="${esc((EJ_OBJ[k] || EJ_OBJ.I).g.split(' ')[0])} …">${esc(o.general)}</textarea></div>
    <h3 class="t-h3">Objetivos específicos: los pasos</h3>
    ${modo('e', A.me)}
    <div id="oe-armar" ${A.me === 'armar' ? '' : 'hidden'}>
      <p class="t-nota">Cada objetivo específico es un paso para lograr el general, en orden. Solo escribe el verbo y qué harás: los participantes y el lugar ya están en tu objetivo general.</p>
      <div id="oe-pasos"></div>
      <button type="button" class="btn-lab-l" id="oe-mas">+ Agregar otro paso</button>
      <div class="t-arma-prev" id="oe-prev"></div></div>
    <div id="oe-libre" ${A.me === 'libre' ? '' : 'hidden'}><div id="o-esp"></div>
      <button type="button" class="btn-lab-l" id="o-mas">+ Agregar objetivo específico</button></div>
    <div class="t-verif" id="o-verif"></div>
    <h3 class="t-h3">Hipótesis o supuesto, y la prueba de Popper</h3>
    <p class="lab-ayuda">En la investigación cuantitativa escribe una <b>hipótesis</b>; en la cualitativa, un <b>supuesto inicial</b>. En ambos casos, di qué resultado te obligaría a replantearlo: eso la vuelve honesta y, en el caso de la hipótesis, falsable.</p>
    ${guiaHipotesis(k)}
    <p class="t-h4">Mi ${nombreH}</p>
    ${modo('h', A.mh)}
    <div id="oh-armar" ${A.mh === 'armar' ? '' : 'hidden'}>${armadorHTML('h', piezasHip(k), A.h)}<div class="t-arma-prev" id="oh-prev"></div></div>
    <div id="oh-libre" class="t-campo" ${A.mh === 'libre' ? '' : 'hidden'}><label for="o-hip">Mi ${nombreH}</label><textarea id="o-hip" rows="3" placeholder="${esc((EJ_HIP[k] || EJ_HIP.I).inicio)}">${esc(o.hipotesis)}</textarea></div>
    <div class="t-campo"><label for="o-ref">Me desmentiría que…</label><textarea id="o-ref" rows="2" placeholder="${esc((EJ_HIP[k] || EJ_HIP.I).r)}">${esc(o.refutaria)}</textarea></div>
    <div class="t-verif" id="o-verif2"></div>`);

  // ---------- modo libre (como antes)
  const pintarEsp = () => {
    $('#o-esp').innerHTML = o.especificos.map((x, i) => `<div class="t-campo t-esp"><label for="o-e${i}">Objetivo específico ${i + 1}</label>${selVerbo('e' + i, 'esp', k)}<div class="t-fila"><textarea id="o-e${i}" rows="2">${esc(x)}</textarea>${o.especificos.length > 1 ? `<button type="button" class="btn-lab-l t-quitar" data-i="${i}" aria-label="Quitar objetivo ${i + 1}">✕</button>` : ''}</div></div>`).join('');
    o.especificos.forEach((x, i) => { enlazar(`#o-e${i}`, v => o.especificos[i] = v, verificar); });
    $$('#o-esp .t-selverbo').forEach(conVerbo);
    $$('#o-esp .t-quitar').forEach(b => b.addEventListener('click', () => { o.especificos.splice(+b.dataset.i, 1); cambio(); pintarEsp(); verificar(); }));
  };
  function conVerbo(sel) {
    sel.addEventListener('change', () => {
      const v = sel.value; if (!v) return;
      const el = $('#' + sel.dataset.para); el.value = ponerVerbo(el.value, v); el.dispatchEvent(new Event('input'));
      sel.value = ''; el.focus(); el.setSelectionRange(el.value.length, el.value.length);
    });
  }

  // ---------- modo armar
  const prev = (sel, txt, vacioTxt) => { $(sel).innerHTML = txt ? `<p class="t-ej-k">Así queda</p><p>${esc(txt)}</p>` : `<p class="t-nota">${vacioTxt}</p>`; };
  const sugHip = () => {
    const el = $('#arma-h .t-sug-gen'); if (!el) return;
    const q = [limpia(A.g.quien) && minus(limpia(A.g.quien)), conEn(A.g.donde), k === 'S' && minus(limpia(A.g.cuando))].filter(Boolean).join(' ');
    el.hidden = !q; if (!q) return;
    el.dataset.v = k === 'P' && !/^en\s/i.test(q) ? 'en ' + q : q; el.textContent = '📌 De tu objetivo general: «' + el.dataset.v + '»';
  };
  const armarG = () => {
    sugHip();
    const t = oracionGeneral(A.g); prev('#og-prev', t, o.general.trim() ? `Llena los cuadritos. Mientras tanto se conserva lo que tenías: «${esc(o.general)}»` : 'Llena los cuadritos y aquí verás tu objetivo general completo.');
    if (t && A.mg === 'armar') { o.general = t; $('#o-general').value = t; }
  };
  const armarH = () => {
    const t = oracionHip(k, A.h); prev('#oh-prev', t, o.hipotesis.trim() ? `Llena los cuadritos. Mientras tanto se conserva lo que tenías: «${esc(o.hipotesis)}»` : `Llena los cuadritos y aquí verás tu ${nombreH} completo.`);
    if (t && A.mh === 'armar') { o.hipotesis = t; $('#o-hip').value = t; }
  };
  const armarE = () => {
    const L = A.e.map(oracionEsp).filter(Boolean);
    $('#oe-prev').innerHTML = L.length ? `<p class="t-ej-k">Así quedan tus objetivos específicos</p><ol>${L.map(x => `<li>${esc(x)}</li>`).join('')}</ol>` : '<p class="t-nota">Llena cada paso y aquí verás tus objetivos específicos en orden.</p>';
    if (L.length && A.me === 'armar') { o.especificos = L; }
  };
  const pintarPasosEsp = () => {
    $('#oe-pasos').innerHTML = A.e.map((p, i) => {
      const P = PASOS_ESP[kk][i] || ['Otro paso', 'Algo más que necesites hacer para lograr el general.', [], ''];
      return `<article class="t-paso-esp"><p class="t-paso-n">Paso ${i + 1} · ${esc(P[0])}${i >= PASOS_ESP[kk].length ? ` <button type="button" class="t-quitar-paso" data-i="${i}" aria-label="Quitar paso ${i + 1}">✕</button>` : ''}</p>
        <p class="t-pieza-ayuda">${esc(P[1])}</p>
        <div class="t-paso-fila">${selPaso(i, k, P[2], p.verbo)}<textarea rows="2" id="oe-q${i}" placeholder="${esc(P[3] ? 'Ej.: ' + P[3] : 'qué vas a hacer')}" aria-label="Qué harás en el paso ${i + 1}">${esc(p.que || '')}</textarea></div></article>`;
    }).join('');
    A.e.forEach((p, i) => {
      $(`#oe-v${i}`).addEventListener('change', e => { p.verbo = e.target.value; armarE(); cambio(); verificar(); });
      $(`#oe-q${i}`).addEventListener('input', e => { p.que = e.target.value; armarE(); cambio(); verificar(); });
    });
    $$('#oe-pasos .t-quitar-paso').forEach(b => b.addEventListener('click', () => { A.e.splice(+b.dataset.i, 1); pintarPasosEsp(); armarE(); cambio(); verificar(); }));
  };
  const ligarArmador = (id, datos, despues) => {
    const caja = $(`#arma-${id}`), piezas = [...caja.querySelectorAll('.t-pieza')];
    const revelar = () => { let ok = true; piezas.forEach(el => { el.hidden = !ok; const v = datos[el.dataset.k]; if (!el.dataset.opc && !(v && String(v).trim())) ok = false; }); };
    caja.querySelectorAll('[data-campo]').forEach(el => el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', () => { datos[el.dataset.campo] = el.value; revelar(); despues(); cambio(); verificar(); }));
    caja.querySelectorAll('.t-sug').forEach(b => b.addEventListener('click', () => { const el = caja.querySelector(`[data-campo="${b.dataset.k}"]`); el.value = b.dataset.v; el.dispatchEvent(new Event('input')); el.focus(); }));
    revelar(); despues();
  };

  // ---------- revisión
  const verificar = () => {
    const avisos = [];
    const inicio = s => s.trim().toLowerCase().split(/\s+/)[0] || '';
    if (o.general.trim() && /^¿|\?$/.test(o.general.trim())) avisos.push('El objetivo general no se escribe como pregunta: empieza con un verbo en infinitivo.');
    if (o.general.trim() && !/(ar|er|ir)$/.test(inicio(o.general))) avisos.push('El objetivo general debería empezar con un verbo en infinitivo (comprender, determinar, diseñar…).');
    o.especificos.forEach((x, i) => { if (x.trim() && !/(ar|er|ir)$/.test(inicio(x))) avisos.push(`El objetivo específico ${i + 1} debería empezar con un verbo en infinitivo.`); });
    if (o.especificos.filter(x => x.trim()).length < 2) avisos.push('Escribe al menos dos objetivos específicos.');
    const malos = { P: /^(comprender|interpretar|reconstruir)/, I: /^(medir|determinar|correlacionar)/ };
    if (malos[k] && [o.general, ...o.especificos].some(x => malos[k].test(x.trim().toLowerCase()))) avisos.push(`Algún verbo no encaja con un enfoque ${D.tipos[k].nombre.toLowerCase()}. Revísalo o considera un enfoque mixto.`);
    if (o.general.trim() && !A.g.quien && A.mg === 'libre' && o.general.trim().split(/\s+/).length < 9) avisos.push('Tu objetivo general parece corto: revisa que diga en quiénes, dónde y cuándo.');
    if (k === 'S' && o.especificos.filter(x => x.trim()).length >= 2 && !o.especificos.some(x => /^(evaluar|valorar|sistematizar)/i.test(x.trim()))) avisos.push('En una investigación transformadora falta un paso para ver si funcionó (evaluar o valorar participativamente).');
    if (/ciber\s+acoso/i.test([o.general, ...o.especificos, o.hipotesis].join(' '))) avisos.push('Ortografía: «ciberacoso» se escribe junto.');
    $('#o-verif').innerHTML = avisos.length ? `<ul class="t-avisos">${avisos.map(a => `<li>${esc(a)}</li>`).join('')}</ul>` : (o.general.trim() ? '<p class="t-bien">✓ Tus objetivos están bien planteados en la forma.</p>' : '');
    const av2 = [];
    if (o.hipotesis.trim() && !o.refutaria.trim()) av2.push('Te falta decir qué resultado te desmentiría. Sin eso, la hipótesis no es falsable.');
    if (/\b(siempre|nunca|todos|ninguno)\b/i.test(o.hipotesis)) av2.push('Cuidado con «siempre», «nunca» o «todos»: son afirmaciones fáciles de refutar con un solo caso. ¿Es lo que quieres decir?');
    if (/\bdeber[íi]a/i.test(o.hipotesis)) av2.push('«Debería» expresa un deseo, no una hipótesis: di lo que crees que pasa o pasará.');
    if (o.refutaria.trim() && /(necesitan más tiempo|no se aplicó bien|depende)/i.test(o.refutaria)) av2.push('Tu condición de refutación deja una salida: si cualquier resultado puede explicarse a tu favor, la hipótesis se protege sola (tema 4.2).');
    $('#o-verif2').innerHTML = av2.length ? `<ul class="t-avisos">${av2.map(a => `<li>${esc(a)}</li>`).join('')}</ul>` : (o.refutaria.trim() ? '<p class="t-bien">✓ Dijiste qué te desmentiría: buena señal de falsabilidad.</p>' : '');
  };

  // ---------- cambiar de modo
  $$('.t-modo button').forEach(b => b.addEventListener('click', () => {
    const s = b.dataset.s, m = b.dataset.m; A['m' + s] = m;
    b.parentElement.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    $(`#o${s}-armar`).hidden = m !== 'armar'; $(`#o${s}-libre`).hidden = m !== 'libre';
    if (m === 'armar') { if (s === 'g') armarG(); else if (s === 'h') armarH(); else armarE(); }
    if (s === 'e' && m === 'libre') { if (!o.especificos.length) o.especificos = ['']; pintarEsp(); }
    cambio(); verificar();
  }));

  enlazar('#o-general', v => o.general = v, verificar);
  ['#o-hip', '#o-ref'].forEach((s, i) => enlazar(s, v => { if (i) o.refutaria = v; else o.hipotesis = v; }, verificar));
  conVerbo($('#sv-g'));
  $('#o-mas').addEventListener('click', () => { if (o.especificos.length < 6) { o.especificos.push(''); cambio(); pintarEsp(); } });
  $('#oe-mas').addEventListener('click', () => { if (A.e.length < 6) { A.e.push({}); cambio(); pintarPasosEsp(); armarE(); } });
  ligarArmador('g', A.g, armarG);
  ligarArmador('h', A.h, armarH);
  // En la hipótesis, proponer los participantes del objetivo general.
  pintarPasosEsp(); armarE(); pintarEsp(); verificar();
}

// ---------- piezas de los cuadritos
const CONECTOR = { P: 'en', I: 'de', S: 'junto con', M: 'en' };
function piezasGeneral(k, sug) {
  const ej = { P: ['la relación entre las horas de sueño y el promedio escolar', 'los alumnos de segundo grado'], I: ['cómo viven su primer año frente a grupo', 'los docentes de nuevo ingreso'], S: ['la forma en que previenen y enfrentan el ciberacoso', 'los alumnos de segundo grado'] }[k === 'M' ? 'P' : k] || [];
  return [
    { k: 'verbo', tipo: 'verbo', label: 'Verbo en infinitivo', ayuda: 'Es la meta: lo que lograrás al final. Elige uno de la lista; los primeros encajan con tu tipo de pregunta.', cual: 'general' },
    { k: 'que', label: '¿Qué vas a estudiar o lograr?', ayuda: 'El fenómeno de tu pregunta, sin signos de interrogación. Suele ser casi igual a tu pregunta.', ej: ej[0] },
    { k: 'quien', label: '¿En quiénes o con quiénes?', ayuda: 'Los participantes: quiénes y de qué grado o grupo.', ej: ej[1], con: true, sug: sug.quien },
    { k: 'donde', label: '¿Dónde?', ayuda: 'La escuela, comunidad o lugar.', ej: 'en la Secundaria Técnica 17 de Campeche', sug: sug.donde },
    { k: 'cuando', label: '¿Cuándo?', ayuda: 'El periodo en el que harás la investigación.', ej: 'durante el ciclo escolar 2026-2027', sug: sug.cuando },
  ];
}
function piezasHip(k) {
  if (k === 'I') return [
    { k: 'quien', label: 'Supongo que… (¿quiénes?)', ayuda: 'Los participantes de tu investigación.', ej: 'los docentes de nuevo ingreso de secundarias públicas de Campeche', gen: true },
    { k: 'como', label: '¿Cómo crees que lo viven o lo entienden?', ayuda: 'Tu idea previa, dicha con honestidad. Empieza con un verbo: viven, entienden, sienten, perciben…', ej: 'viven su primer año con una sensación de soledad' },
    { k: 'aunque', label: 'Aunque… (opcional)', ayuda: 'Lo que podría sorprenderte. Te recuerda que vas a escuchar, no a confirmar.', ej: 'puede que encuentre experiencias muy distintas entre escuelas', opc: true },
  ];
  if (k === 'S') return [
    { k: 'si', label: 'Si… (¿qué acción harán?)', ayuda: 'Lo que el grupo hará junto contigo: tu estrategia o propuesta.', ej: 'el grupo construye con su tutor un reglamento basado en acuerdos' },
    { k: 'entonces', label: 'Entonces… (¿qué cambiará?)', ayuda: 'El cambio concreto que esperas y que se puede observar.', ej: 'los conflictos que llegan a orientación disminuirán' },
    { k: 'quien', label: '¿En quiénes, dónde y cuándo?', ayuda: 'Participantes, lugar y periodo.', ej: 'en el grupo de segundo grado durante el segundo trimestre', gen: true },
  ];
  return [
    { k: 'quien', label: 'En… (¿quiénes y dónde?)', ayuda: 'Los participantes y el lugar.', ej: 'en los alumnos de segundo grado de la Secundaria Técnica 17', gen: true },
    { k: 'causa', label: '¿Qué crees que influye?', ayuda: 'La primera variable: la que crees que provoca o se relaciona con el cambio.', ej: 'quienes duermen menos de siete horas entre semana' },
    { k: 'efecto', label: '¿Qué le pasa a lo otro?', ayuda: 'La segunda variable y en qué dirección cambia: más, menos, mayor, menor.', ej: 'tienen un promedio escolar más bajo' },
    { k: 'compara', label: 'Comparado con… (opcional)', ayuda: 'El grupo o la situación contra la que comparas.', ej: 'que quienes duermen siete horas o más', opc: true },
  ];
}
function armadorHTML(id, piezas, datos) {
  return `<div class="t-arma" id="arma-${id}">${piezas.map((p, i) => `<div class="t-pieza" data-k="${p.k}"${p.opc ? ' data-opc="1"' : ''}>
    <p class="t-pieza-t"><span class="t-pieza-n">${i + 1}</span>${esc(p.label)}</p>
    <p class="t-pieza-ayuda">${esc(p.ayuda)}</p>
    ${p.tipo === 'verbo' ? selVerbo(`a${id}`, p.cual, T.brujula.clave || T.tipoManual || tipoDe(T.pregunta) || 'I').replace('class="t-selverbo"', `class="t-selverbo" data-campo="verbo"`).replace(/<option value="([^"]*)">/g, (m, v) => v && v === datos.verbo ? `<option value="${v}" selected>` : m)
      : `<div class="t-paso-fila">${p.con ? `<select data-campo="con" aria-label="Palabra que une">${['en', 'de', 'con', 'junto con', ''].map(x => `<option value="${x}" ${x === (datos.con ?? '') ? 'selected' : ''}>${x || '(ninguna)'}</option>`).join('')}</select>` : ''}<textarea rows="2" data-campo="${p.k}" placeholder="${esc(p.ej ? 'Ej.: ' + p.ej : '')}">${esc(datos[p.k] || '')}</textarea></div>`}
    ${p.sug ? `<button type="button" class="t-sug chip-lab" data-k="${p.k}" data-v="${esc(p.sug)}">📌 De tu pregunta: «${esc(p.sug)}»</button>` : ''}
    ${p.gen ? `<button type="button" class="t-sug t-sug-gen chip-lab" data-k="${p.k}" data-v="" hidden></button>` : ''}
  </div>`).join('')}</div>`;
}
function selPaso(i, k, recomendados, actual) {
  const L = VERBOS_OBJ.esp[k] || VERBOS_OBJ.esp.I, todos = Object.values(VERBOS_OBJ.esp).flat();
  const rec = recomendados.map(v => todos.find(x => x[0] === v) || [v, '']), resto = [...new Map(todos.filter(x => !recomendados.includes(x[0])).map(x => [x[0], x])).values()];
  const op = v => `<option value="${esc(v[0])}" ${v[0] === actual ? 'selected' : ''}>${esc(v[0])}${v[1] ? ' — ' + esc(v[1]) : ''}</option>`;
  return `<select class="t-selverbo" id="oe-v${i}" aria-label="Verbo del paso ${i + 1}"><option value="">📋 Verbo…</option>${rec.length ? `<optgroup label="✓ Recomendados para este paso">${rec.map(op).join('')}</optgroup>` : ''}<optgroup label="Otros verbos">${resto.map(op).join('')}</optgroup></select>`;
}
// Pasos de los objetivos específicos según el tipo de pregunta: [nombre, ayuda, verbos recomendados, ejemplo de «qué»].
const PASOS_ESP = {
  P: [['Medir lo primero', 'Obtén los datos de lo que crees que influye.', ['medir', 'identificar', 'describir'], 'las horas de sueño entre semana de los alumnos'],
    ['Medir lo segundo', 'Obtén los datos de lo que crees que cambia.', ['identificar', 'medir', 'describir'], 'el promedio escolar del primer trimestre'],
    ['Comparar o relacionar', 'Junta las dos cosas para responder tu pregunta.', ['comparar', 'relacionar', 'calcular'], 'el promedio de quienes duermen menos de siete horas con el de quienes duermen más']],
  I: [['Describir lo que viven', 'Primero conoce la experiencia tal como la cuentan.', ['describir', 'identificar', 'caracterizar', 'documentar'], 'los retos que enfrentan en el aula durante su primer año'],
    ['Interpretar lo que significa', 'Después busca el sentido que le dan.', ['interpretar', 'analizar'], 'el significado que le dan al acompañamiento de sus compañeros y directivos'],
    ['Contrastar o reconstruir', 'Al final, compara visiones o reconstruye la historia completa.', ['reconstruir', 'contrastar'], 'los momentos que consideran decisivos en su formación']],
  S: [['Conocer el problema', 'Antes de cambiar algo, diagnostica con el grupo cómo está.', ['diagnosticar', 'identificar'], 'las formas y la frecuencia del ciberacoso que viven en sus redes sociales'],
    ['Planear', 'Diseña la propuesta junto con los participantes.', ['diseñar', 'acordar'], 'con el grupo estrategias de prevención y de respuesta ante el ciberacoso'],
    ['Actuar', 'Pon en marcha lo que planearon.', ['implementar'], 'las estrategias durante el primer trimestre'],
    ['Ver si funcionó', 'Valora qué cambió y qué no. Sin este paso no puedes responder tu pregunta.', ['evaluar', 'valorar participativamente', 'sistematizar'], 'qué cambió en la frecuencia del ciberacoso y en la forma de responder del grupo']],
};
PASOS_ESP.M = [PASOS_ESP.P[0], PASOS_ESP.P[2], PASOS_ESP.I[1]];
// ---------- armar las oraciones
const limpia = s => (s || '').trim().replace(/[.\s]+$/, '').replace(/^¿|\?$/g, '');
const mayus = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
const minus = s => s && !/^[A-ZÁÉÍÓÚÑ]{2}|^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+[A-ZÁÉÍÓÚÑ0-9]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s;
const conEn = s => { s = limpia(s); return !s ? '' : /^(en|de|del|dentro|durante)\s/i.test(s) ? minus(s) : 'en ' + s; };
function oracionGeneral(g) {
  if (!g.verbo || !limpia(g.que)) return '';
  const quien = limpia(g.quien) ? [g.con, minus(limpia(g.quien))].filter(Boolean).join(' ') : '';
  return [mayus(g.verbo), minus(limpia(g.que)), quien, conEn(g.donde), minus(limpia(g.cuando))].filter(Boolean).join(' ') + '.';
}
const oracionEsp = p => p.verbo && limpia(p.que) ? mayus(p.verbo) + ' ' + minus(limpia(p.que)) + '.' : '';
function oracionHip(k, h) {
  const q = minus(limpia(h.quien));
  if (k === 'I') return q && limpia(h.como) ? `Supongo que ${q} ${minus(limpia(h.como))}${limpia(h.aunque) ? ', aunque ' + minus(limpia(h.aunque)) : ''}.` : '';
  if (k === 'S') return limpia(h.si) && limpia(h.entonces) ? `Si ${minus(limpia(h.si))}, entonces ${minus(limpia(h.entonces))}${q ? ' ' + (/^(en|con|de|durante)\s/i.test(q) ? q : 'en ' + q) : ''}.` : '';
  return q && limpia(h.causa) && limpia(h.efecto) ? `${mayus(/^en\s/i.test(q) ? q : 'en ' + q)}, ${minus(limpia(h.causa))} ${minus(limpia(h.efecto))}${limpia(h.compara) ? ' ' + minus(limpia(h.compara)) : ''}.` : '';
}
// Toma de la pregunta de investigación los participantes, el lugar y el periodo, si los trae.
function sugerenciasPregunta(q) {
  q = (q || '').replace(/[¿?]/g, ' ').replace(/\s+/g, ' ');
  const cap = w => `[${w[0]}${w[0].toUpperCase()}]${w.slice(1)}`;
  const gente = ['alumnos', 'alumnas', 'estudiantes', 'docentes', 'maestros', 'maestras', 'profesores', 'padres', 'madres', 'familias', 'niños', 'niñas', 'jóvenes', 'adolescentes', 'directivos', 'tutores'].join('|');
  const lugar = ['secundaria', 'escuela', 'primaria', 'telesecundaria', 'preparatoria', 'bachillerato', 'universidad', 'instituto', 'colegio', 'comunidad', 'licenciatura', 'normal'].map(cap).join('|');
  const mq = q.match(new RegExp(`\\b((?:los|las|sus)\\s+(?:${gente})(?:\\s+(?:de|del)\\s+(?:(?:primer|segundo|tercer|primero|tercero|cuarto|quinto|sexto|séptimo|\\d+\\.?[°º]?)\\s+(?:grado|año|semestre|cuatrimestre)|nuevo\\s+ingreso))?)`, 'iu'));
  const md = q.match(new RegExp(`\\b((?:una|un|la|el)\\s+(?:${lugar})(?:\\s+(?:[Tt]écnica|[Gg]eneral|[Pp]ública|[Pp]rivada|[Rr]ural|[Uu]rbana|[Ii]ndígena|[Nn]o\\.|[Nn]úm\\.|\\d+|[A-ZÁÉÍÓÚÑ][\\p{L}]+))*(?:\\s+de\\s+[A-ZÁÉÍÓÚÑ][\\p{L}]+(?:\\s+[A-ZÁÉÍÓÚÑ][\\p{L}]+)*)?)`, 'u'));
  const mc = q.match(/\b((?:durante|a lo largo de|en)\s+(?:el|la|un|una)\s+(?:ciclo escolar|ciclo|periodo|semestre|cuatrimestre|trimestre|curso|año|bimestre)(?:\s+[\d\-–]+)?)/iu);
  return { quien: mq ? mq[1].trim() : '', donde: md ? 'en ' + md[1].trim() : '', cuando: mc ? mc[1].trim() : '' };
}

// Verbos para los objetivos, con lo que significa cada uno. El general usa verbos amplios (la meta);
// los específicos, verbos concretos (los pasos). P = explicativa, I = comprensiva, S = transformadora.
const VERBOS_OBJ = {
  general: {
    P: [['determinar', 'establecer con datos si algo ocurre y cuánto'], ['explicar', 'mostrar por qué ocurre algo'], ['analizar la relación entre', 'ver si dos cosas se mueven juntas'], ['evaluar el efecto de', 'medir qué cambia por algo'], ['comparar', 'medir las diferencias entre dos grupos o momentos'], ['establecer', 'fijar con evidencia una relación o un nivel']],
    I: [['comprender', 'entender el sentido que algo tiene para las personas'], ['interpretar', 'descifrar los significados detrás de lo que dicen y hacen'], ['analizar', 'descomponer una experiencia para entenderla a fondo'], ['explorar', 'acercarse a algo poco estudiado'], ['reconstruir', 'contar de nuevo, con las voces de los participantes, cómo pasó algo'], ['describir en profundidad', 'retratar con detalle cómo se vive algo']],
    S: [['transformar', 'cambiar una situación junto con quienes la viven'], ['construir colectivamente', 'crear algo con los participantes, no para ellos'], ['mejorar', 'hacer que una práctica funcione mejor, con evidencia'], ['fortalecer', 'hacer más sólida una práctica que ya existe'], ['diseñar e implementar con', 'crear una propuesta y ponerla en marcha con el grupo'], ['sistematizar', 'ordenar y reflexionar una experiencia para aprender de ella']],
    M: [['analizar y comprender', 'medir algo y entender su sentido'], ['evaluar e interpretar', 'medir resultados y explicar lo que significan'], ['describir y explicar', 'retratar un fenómeno y dar sus causas']],
  },
  esp: {
    P: [['medir', 'obtener un número con un instrumento'], ['identificar', 'reconocer cuál, cuánto o quién'], ['describir', 'decir cómo es algo con datos'], ['comparar', 'poner lado a lado dos grupos o momentos'], ['calcular', 'obtener un resultado con operaciones'], ['relacionar', 'ver si dos variables se mueven juntas'], ['clasificar', 'ordenar en categorías'], ['estimar', 'calcular de forma aproximada']],
    I: [['describir', 'contar cómo es algo según los participantes'], ['identificar', 'reconocer temas, momentos o actores'], ['caracterizar', 'señalar los rasgos propios de algo'], ['interpretar', 'descifrar lo que significa lo que dicen'], ['analizar', 'examinar por partes'], ['reconstruir', 'contar de nuevo una historia con sus voces'], ['contrastar', 'ver semejanzas y diferencias entre visiones'], ['documentar', 'registrar con evidencia lo que pasa']],
    S: [['diagnosticar', 'conocer con el grupo el problema de partida'], ['diseñar', 'crear con ellos la propuesta'], ['implementar', 'ponerla en marcha'], ['evaluar', 'valorar qué cambió y qué no'], ['acordar', 'llegar a decisiones con los participantes'], ['reflexionar con', 'pensar juntos sobre lo vivido'], ['sistematizar', 'ordenar la experiencia para aprender de ella'], ['valorar participativamente', 'que el grupo juzgue los resultados']],
  },
};
VERBOS_OBJ.esp.M = [...VERBOS_OBJ.esp.P.slice(0, 4), ...VERBOS_OBJ.esp.I.slice(2, 6)];
const NOMBRE_ENF = { P: 'Explicativas (cuantitativo)', I: 'Comprensivas (cualitativo)', S: 'Transformadoras (sociocrítico)', M: 'Mixtas' };
function selVerbo(id, cual, k) {
  const L = VERBOS_OBJ[cual], orden = [k, ...['P', 'I', 'S', 'M'].filter(x => x !== k && L[x])];
  const op = v => `<option value="${esc(v[0])}">${esc(v[0])} — ${esc(v[1])}</option>`;
  return `<select class="t-selverbo" id="sv-${id}" data-para="${id === 'g' ? 'o-general' : 'o-' + id}" aria-label="Elegir verbo para el objetivo ${cual === 'general' ? 'general' : 'específico'}">
    <option value="">📋 Elige un verbo que encaje…</option>
    ${orden.map((x, i) => `<optgroup label="${i ? 'Otros enfoques · ' : '✓ Encajan con tu pregunta · '}${esc(NOMBRE_ENF[x])}">${L[x].map(op).join('')}</optgroup>`).join('')}
  </select>`;
}
// Cambia el verbo inicial si ya había uno de la lista; si no, lo antepone.
function ponerVerbo(texto, v) {
  const todos = [...new Set(Object.values(VERBOS_OBJ).flatMap(o => Object.values(o).flat().map(x => x[0])))].sort((a, b) => b.length - a.length);
  let t = texto.trim(); const bajo = t.toLowerCase();
  const ya = todos.find(x => bajo === x || bajo.startsWith(x + ' '));
  if (ya) t = t.slice(ya.length).trim();
  else if (t && /^\p{L}+(ar|er|ir)\b/iu.test(t)) t = t.replace(/^\p{L}+\s*/u, '');
  if (t) t = t.charAt(0).toLowerCase() + t.slice(1);
  return v.charAt(0).toUpperCase() + v.slice(1) + ' ' + t;
}

// Guía para la hipótesis o el supuesto, según el tipo de pregunta.
const EJ_HIP = {
  P: { nombre: 'Hipótesis', que: 'Es una <b>respuesta tentativa</b> a tu pregunta que vas a poner a prueba con datos. Relaciona dos cosas que puedes medir (variables): una que crees que influye y otra que crees que cambia.',
    formula: '<b>En</b> [quiénes, dónde] <b>,</b> [la variable que influye] <b>se relaciona con / produce</b> [la variable que cambia] <b>de esta forma:</b> [más, menos, mayor, menor…]',
    h: 'En los alumnos de segundo grado de la Secundaria Técnica 17, quienes duermen menos de siete horas entre semana tienen un promedio escolar más bajo que quienes duermen siete horas o más.',
    r: 'el promedio de quienes duermen menos de siete horas sea igual o mayor que el de quienes duermen más.',
    inicio: 'En los alumnos de…, quienes… tienen…' },
  I: { nombre: 'Supuesto inicial', que: 'En una investigación comprensiva <b>no se comprueba una hipótesis</b>: se parte de un <b>supuesto inicial</b>, una idea previa honesta de lo que crees que vas a encontrar. Sirve para que reconozcas tus ideas previas desde el principio (Gadamer las llama «prejuicios»), no para defenderlos.',
    formula: '<b>Supongo que</b> [los participantes] <b>viven / entienden</b> [el fenómeno] <b>como</b> [lo que crees], <b>aunque</b> [lo que podría sorprenderte].',
    h: 'Supongo que los docentes de nuevo ingreso viven su primer año con una sensación de soledad, y que el acompañamiento de sus compañeros pesa más que el de los directivos, aunque puede que encuentre experiencias muy distintas entre escuelas.',
    r: 'la mayoría de los docentes describan su primer año sin sentirse solos, o que el acompañamiento que más valoran sea el de los directivos.',
    inicio: 'Supongo que… viven… como…, aunque…' },
  S: { nombre: 'Supuesto de acción', que: 'En una investigación transformadora el supuesto es una <b>apuesta de cambio</b>: qué crees que pasará si el grupo hace algo juntos. Se pone a prueba en la práctica, en ciclos de planear, actuar, observar y reflexionar (Carr y Kemmis).',
    formula: '<b>Si</b> [el grupo hace esta acción] <b>, entonces</b> [esto cambiará] <b>en</b> [quiénes, dónde].',
    h: 'Si el grupo de segundo grado construye con su tutor un reglamento basado en acuerdos y formas de reparar, entonces los conflictos que llegan a orientación disminuirán durante el segundo trimestre.',
    r: 'los reportes a orientación se mantengan iguales o aumenten, o que el grupo deje de usar los acuerdos a las pocas semanas.',
    inicio: 'Si el grupo…, entonces… en…' },
};
EJ_HIP.M = EJ_HIP.P;
function guiaHipotesis(k) {
  const e = EJ_HIP[k] || EJ_HIP.I;
  const fila = x => `<tr${x === k ? ' class="t-hip-tuyo"' : ''}><th>${esc(EJ_HIP[x].nombre)}${x === k ? ' ← el tuyo' : ''}<small>pregunta ${esc(D.tipos[x].nombre.toLowerCase())}</small></th><td>${x === 'P' ? 'Se comprueba o se rechaza con datos' : x === 'I' ? 'Se confirma, se matiza o se abandona al escuchar a los participantes' : 'Se pone a prueba al actuar y reflexionar con el grupo'}</td></tr>`;
  return `<details class="t-guia-obj t-guia-hip" open><summary>🔎 ¿Qué es una hipótesis y cómo se escribe? (ábrelo si te atoras)</summary>
    <p>Tu hipótesis o supuesto <b>responde por adelantado a tu pregunta</b>: es lo que crees que vas a encontrar. La investigación sirve para ver si tenías razón. No es una pregunta ni una opinión de lo que «debería» ser; es una afirmación que la realidad puede confirmar o desmentir.</p>
    <div class="t-tabla-scroll"><table class="t-hip-tabla"><thead><tr><th>Qué escribes</th><th>Qué pasa con ella</th></tr></thead><tbody>${['P', 'I', 'S'].map(fila).join('')}</tbody></table></div>
    <h4>Tu caso: ${esc(e.nombre.toLowerCase())}</h4>
    <p>${e.que}</p>
    <p class="t-formula">${e.formula}</p>
    <div class="t-ejemplo"><p class="t-ej-k">Ejemplo, con la misma pregunta del ejemplo de objetivos</p>
      <p><b>${esc(e.nombre)}:</b> ${esc(e.h)}</p>
      <p><b>Me desmentiría que…</b> ${esc(e.r)}</p></div>
    <h4>La prueba de Popper: «me desmentiría que…»</h4>
    <p>Popper (tema 4) dice que una idea es científica si se puede decir <b>qué resultado la haría falsa</b>. Por eso escribes también qué te desmentiría. Si ningún resultado posible te haría cambiar de idea, no estás investigando: solo estás confirmando lo que ya creías.</p>
    <p class="t-errores"><b>Errores comunes:</b> escribirla como pregunta · que sea obvia («la lectura ayuda a aprender») · usar «debería» (eso es un deseo, no una hipótesis) · usar «siempre», «nunca» o «todos» · que no tenga nada que ver con tu objetivo general · que el «me desmentiría» deje salida («a menos que no se haya aplicado bien»).</p>
    <p class="t-nota">Revisa que tu hipótesis o supuesto y tu objetivo general hablen de lo mismo: los mismos participantes, el mismo lugar y el mismo fenómeno.</p>
  </details>`;
}

// Guía para escribir objetivos: fórmula, ejemplo de su mismo tipo de pregunta y errores comunes.
const EJ_OBJ = {
  P: { q: '¿Qué relación existe entre las horas de sueño y el promedio escolar de los alumnos de segundo grado de la Secundaria Técnica 17 de Campeche durante el ciclo 2026-2027?',
    g: 'Determinar la relación entre las horas de sueño y el promedio escolar de los alumnos de segundo grado de la Secundaria Técnica 17 de Campeche durante el ciclo 2026-2027.',
    e: ['Medir las horas de sueño entre semana de los alumnos de segundo grado.', 'Identificar el promedio escolar de esos alumnos en el primer trimestre.', 'Comparar el promedio de quienes duermen menos de siete horas con el de quienes duermen más.'] },
  I: { q: '¿Cómo viven los docentes de nuevo ingreso su primer año frente a grupo en secundarias públicas de Campeche?',
    g: 'Comprender cómo viven los docentes de nuevo ingreso su primer año frente a grupo en secundarias públicas de Campeche.',
    e: ['Describir los retos que enfrentan en el aula durante su primer año.', 'Interpretar el significado que le dan al acompañamiento de sus compañeros y directivos.', 'Reconstruir los momentos que consideran decisivos en su formación como docentes.'] },
  S: { q: '¿Cómo puede un grupo de segundo grado, junto con su tutor, construir un reglamento de aula basado en acuerdos y no en castigos?',
    g: 'Construir colectivamente, con un grupo de segundo grado y su tutor, un reglamento de aula basado en acuerdos.',
    e: ['Diagnosticar con los alumnos los conflictos más frecuentes del grupo.', 'Diseñar con ellos los acuerdos y la forma de reparar cuando no se cumplen.', 'Implementar los acuerdos durante el segundo trimestre.', 'Evaluar participativamente si el reglamento redujo los conflictos.'] },
};
EJ_OBJ.M = EJ_OBJ.P;
function guiaObjetivos(k) {
  const ej = EJ_OBJ[k] || EJ_OBJ.I;
  return `<details class="t-guia-obj" open><summary>📐 ¿Cómo se escribe un objetivo? (ábrelo si te atoras)</summary>
    <div class="t-guia-dos">
      <div><h4>Objetivo general</h4><p>Es <b>tu pregunta de investigación convertida en meta</b>. Si la pregunta es «¿Cómo viven…?», el objetivo es «Comprender cómo viven…». Es uno solo.</p>
        <p class="t-formula"><b>Verbo en infinitivo</b> + <b>qué</b> vas a estudiar + <b>en quiénes</b> + <b>dónde</b> + <b>cuándo</b></p></div>
      <div><h4>Objetivos específicos</h4><p>Son <b>los pasos</b> para lograr el general: de 2 a 4. Cada uno con su verbo y algo concreto que puedas lograr. Si los cumples todos, cumples el general.</p>
        <p class="t-formula">Pregúntate: <b>¿qué necesito saber o hacer primero, después y al final</b> para responder mi pregunta?</p></div>
    </div>
    <div class="t-ejemplo"><p class="t-ej-k">Ejemplo con una pregunta como la tuya (${esc((D.tipos[k] || D.tipos.I).nombre.toLowerCase())})</p>
      <p><b>Pregunta:</b> ${esc(ej.q)}</p><p><b>Objetivo general:</b> ${esc(ej.g)}</p>
      <p><b>Objetivos específicos:</b></p><ol>${ej.e.map(x => `<li>${esc(x)}</li>`).join('')}</ol></div>
    <p class="t-nota">👇 Abajo puedes <b>armar tu objetivo con cuadritos</b>, uno por cada parte de la fórmula, o escribirlo tú mismo. En ambos casos hay un desplegable con <b>verbos que encajan</b> y lo que significa cada uno.</p>
    <p class="t-errores"><b>Errores comunes:</b> escribirlo como pregunta · usar verbos de actividad (<i>aplicar, realizar, investigar, hacer una encuesta</i>: esas son tareas, no objetivos) · que el general no responda tu pregunta · poner más de un objetivo general.</p>
  </details>`;
}

// ------------------------------------------------ Etapa 5: matriz de congruencia (para la Entrega 2: preguntas 8 y 10)
function grupoTec(t) { for (const [g, l] of Object.entries(D.tecnicas)) if (l.includes(t)) return g; return ''; }
// Qué es cada técnica y qué instrumento se usa con ella.
const TEC_INFO = {
  'Cuestionario o encuesta cerrada': ['Preguntas con opciones fijas que contestan muchas personas; da números y porcentajes.', 'Cuestionario de 15 a 20 preguntas cerradas'],
  'Prueba o examen estandarizado': ['Un examen igual para todos que mide un aprendizaje o una habilidad.', 'Prueba de comprensión lectora con sus respuestas correctas'],
  'Escala tipo Likert': ['Afirmaciones que se califican de «totalmente de acuerdo» a «totalmente en desacuerdo»; mide actitudes.', 'Escala de 20 afirmaciones con 5 opciones de respuesta'],
  'Registro estadístico o de calificaciones': ['Datos que ya existen: calificaciones, asistencias, reportes.', 'Hoja de registro de calificaciones o reportes por alumno'],
  'Diseño experimental o cuasiexperimental': ['Comparar un grupo que recibe algo con otro que no, antes y después.', 'Prueba antes y después (pretest y postest) para dos grupos'],
  'Entrevista a profundidad': ['Conversación larga, una a una, para conocer una experiencia a fondo.', 'Guion de entrevista con 6 a 8 temas abiertos'],
  'Entrevista semiestructurada': ['Conversación con preguntas preparadas, pero con libertad para preguntar más.', 'Guion de entrevista de 8 a 10 preguntas abiertas'],
  'Grupo focal': ['Conversación guiada con 6 a 10 personas a la vez sobre un tema.', 'Guía de grupo focal con 5 o 6 preguntas detonadoras'],
  'Observación participante': ['Estar dentro del grupo y registrar lo que pasa mientras participas.', 'Guía de observación y notas de campo'],
  'Diario de campo': ['Registro diario de lo que observas, lo que pasa y lo que piensas.', 'Formato de diario de campo (fecha, hecho, reflexión)'],
  'Historia de vida': ['Una persona cuenta su vida o una etapa de ella.', 'Guion de entrevista biográfica por etapas'],
  'Análisis de documentos': ['Revisar documentos existentes: planeaciones, reglamentos, trabajos de alumnos.', 'Ficha de análisis de documentos'],
  'Taller participativo': ['Sesión de trabajo donde el grupo analiza y crea algo junto.', 'Carta descriptiva del taller y registro de productos'],
  'Diagnóstico participativo': ['El grupo identifica sus propios problemas con dinámicas (árbol de problemas, lluvia de ideas).', 'Guía de diagnóstico con árbol de problemas'],
  'Ciclo de investigación-acción': ['Planear, actuar, observar y reflexionar, y volver a empezar (Carr y Kemmis).', 'Plan de acción y bitácora de cada ciclo'],
  'Diario del investigador': ['Tu registro personal de cómo va la intervención y qué vas aprendiendo.', 'Formato de diario reflexivo'],
  'Asamblea o círculo de diálogo': ['Reunión del grupo para dialogar, decidir o valorar juntos.', 'Guía de asamblea y acta de acuerdos'],
};
// Técnicas recomendadas según el verbo del objetivo específico.
const TEC_POR_VERBO = [
  [/^(medir|estimar|calcular)/, ['Cuestionario o encuesta cerrada', 'Prueba o examen estandarizado', 'Escala tipo Likert']],
  [/^(comparar|relacionar)/, ['Registro estadístico o de calificaciones', 'Diseño experimental o cuasiexperimental', 'Cuestionario o encuesta cerrada']],
  [/^(diagnosticar)/, ['Diagnóstico participativo', 'Cuestionario o encuesta cerrada', 'Grupo focal']],
  [/^(identificar|describir|caracterizar|clasificar)/, ['Entrevista semiestructurada', 'Cuestionario o encuesta cerrada', 'Observación participante']],
  [/^(interpretar|analizar)/, ['Entrevista a profundidad', 'Grupo focal', 'Análisis de documentos']],
  [/^(reconstruir)/, ['Historia de vida', 'Entrevista a profundidad']],
  [/^(contrastar)/, ['Grupo focal', 'Entrevista semiestructurada']],
  [/^(documentar)/, ['Diario de campo', 'Observación participante', 'Análisis de documentos']],
  [/^(diseñar|acordar|construir)/, ['Taller participativo', 'Asamblea o círculo de diálogo']],
  [/^(implementar)/, ['Ciclo de investigación-acción', 'Diario del investigador', 'Observación participante']],
  [/^(evaluar|valorar)/, ['Grupo focal', 'Asamblea o círculo de diálogo', 'Registro estadístico o de calificaciones']],
  [/^(sistematizar|reflexionar)/, ['Diario del investigador', 'Asamblea o círculo de diálogo']],
];
const tecRecomendadas = obj => { const v = (obj || '').trim().toLowerCase(); const r = TEC_POR_VERBO.find(([re]) => re.test(v)); return r ? r[1] : []; };
// Propone una pregunta específica a partir del objetivo («Diagnosticar las formas…» → «¿Cuáles son las formas…?»).
function preguntaDeObjetivo(obj) {
  const t = (obj || '').trim().replace(/[.\s]+$/, ''); if (!t) return '';
  const m = t.match(/^(\S+)\s+(.*)$/); if (!m) return '';
  const v = m[1].toLowerCase(); let r = m[2].replace(/^(participativamente|colectivamente|con el grupo|junto con el grupo)\s+/i, '');
  const may = s => s.charAt(0).toUpperCase() + s.slice(1);
  if (/^(qué|cómo|cuál|cuáles|cuánto|cuántos|cuántas|por qué|en qué|quiénes)(?=\s|$)/i.test(r)) return `¿${may(r)}?`;
  const art = s => /^(los|las)\s/i.test(s) ? `¿Cuáles son ${s}?` : /^(el|la|lo)\s/i.test(s) ? `¿Cuál es ${s}?` : '';
  if (/^(comparar)/.test(v)) return `¿Qué diferencias hay al comparar ${r}?`;
  if (/^(relacionar)/.test(v)) return `¿Qué relación hay entre ${r.replace(/^(la relación entre)\s+/i, '')}?`;
  if (/^(contrastar)/.test(v)) return `¿En qué coinciden y en qué difieren ${r}?`;
  if (/^(diseñar|construir)/.test(v)) return `¿Cómo diseñar ${m[2].replace(/^con el grupo\s+/i, 'con el grupo ')}?`.replace('¿Cómo diseñar', /^construir/.test(v) ? '¿Cómo construir' : '¿Cómo diseñar');
  if (/^(implementar)/.test(v)) return `¿Qué ocurre al implementar ${r}?`;
  if (/^(acordar)/.test(v)) return `¿Qué acuerdos logra el grupo sobre ${r}?`;
  if (/^(sistematizar|reflexionar)/.test(v)) return `¿Qué aprendizajes deja ${r}?`;
  if (/^(evaluar|valorar)/.test(v)) return art(r) || `¿Qué resultados hubo en ${r}?`;
  if (/^(reconstruir)/.test(v)) return art(r).replace('¿Cuáles son', '¿Cómo fueron').replace('¿Cuál es', '¿Cómo fue') || `¿Cómo fue ${r}?`;
  return art(r) || `¿Cómo se presenta ${r}?`;
}
const EJ_MZ = {
  P: [['Medir las horas de sueño entre semana de los alumnos de segundo grado.', '¿Cuántas horas duermen entre semana?', 'Cuestionario o encuesta cerrada', 'Cuestionario de 12 preguntas cerradas', '120 alumnos de segundo grado'],
    ['Identificar el promedio escolar de esos alumnos en el primer trimestre.', '¿Cuál es su promedio del primer trimestre?', 'Registro estadístico o de calificaciones', 'Hoja de registro de calificaciones', 'Boletas de los 120 alumnos (con permiso de la escuela)'],
    ['Comparar el promedio de quienes duermen menos de siete horas con el de quienes duermen más.', '¿Qué diferencias hay entre ambos grupos?', 'Registro estadístico o de calificaciones', 'Tabla comparativa de promedios', 'Los mismos 120 alumnos, en dos grupos']],
  I: [['Describir los retos que enfrentan en el aula durante su primer año.', '¿Cuáles son los retos que enfrentan?', 'Entrevista semiestructurada', 'Guion de entrevista de 10 preguntas abiertas', '6 docentes de nuevo ingreso'],
    ['Interpretar el significado que le dan al acompañamiento.', '¿Qué significado le dan al acompañamiento?', 'Entrevista a profundidad', 'Guion con 6 temas abiertos', '3 de esos 6 docentes'],
    ['Reconstruir los momentos que consideran decisivos.', '¿Cómo fueron los momentos decisivos?', 'Historia de vida', 'Guion de entrevista biográfica', '2 docentes con experiencias contrastantes']],
  S: [['Diagnosticar con los alumnos los conflictos más frecuentes del grupo.', '¿Cuáles son los conflictos más frecuentes?', 'Diagnóstico participativo', 'Guía de diagnóstico con árbol de problemas', 'El grupo de 2.º B (32 alumnos) y su tutor'],
    ['Diseñar con ellos los acuerdos y la forma de reparar.', '¿Cómo diseñar acuerdos que el grupo respete?', 'Taller participativo', 'Carta descriptiva de 3 sesiones', 'El mismo grupo y su tutor'],
    ['Implementar los acuerdos durante el segundo trimestre.', '¿Qué ocurre al implementar los acuerdos?', 'Ciclo de investigación-acción', 'Plan de acción y bitácora', 'El grupo, su tutor y orientación'],
    ['Evaluar participativamente si el reglamento redujo los conflictos.', '¿Qué cambió en los conflictos del grupo?', 'Asamblea o círculo de diálogo', 'Guía de asamblea y comparación de reportes de orientación', 'El grupo, su tutor y orientación']],
};
EJ_MZ.M = EJ_MZ.P;
function guiaMatriz(k) {
  const ej = EJ_MZ[k] || EJ_MZ.I;
  return `<details class="t-guia-obj" open><summary>🧭 ¿Qué es la matriz y cómo se llena? (ábrelo si te atoras)</summary>
    <p>La matriz es una tabla que muestra que <b>todo cuadra</b>: para cada objetivo específico dices qué pregunta vas a responder, con qué método, con qué herramienta y con quiénes. Si una fila no cuadra, tu proyecto tiene un hueco.</p>
    <div class="t-guia-dos">
      <div><h4>Pregunta específica</h4><p>Tu objetivo específico convertido en pregunta. Debe poder contestarse con lo que vas a hacer, y no con sí o no.</p></div>
      <div><h4>Técnica</h4><p>El <b>método</b> para obtener la información: entrevista, cuestionario, grupo focal, taller…</p></div>
      <div><h4>Instrumento</h4><p>La <b>herramienta concreta</b> que vas a preparar: el guion de la entrevista, el cuestionario con sus preguntas, la guía de observación.</p></div>
      <div><h4>Participantes o fuentes</h4><p><b>Con quiénes</b> (y cuántos) o de dónde sale la información: alumnos, docentes, boletas, documentos.</p></div>
    </div>
    <p class="t-formula">Truco: la <b>técnica</b> es lo que <i>haces</i> (entrevistar); el <b>instrumento</b> es lo que <i>llevas en la mano</i> (el guion).</p>
    <div class="t-ejemplo"><p class="t-ej-k">Ejemplo con una pregunta como la tuya (${esc((D.tipos[k] || D.tipos.I).nombre.toLowerCase())})</p>
      ${ej.map((f, i) => `<p><b>${i + 1}. ${esc(f[0])}</b><br>Pregunta: ${esc(f[1])} · Técnica: ${esc(f[2])} · Instrumento: ${esc(f[3])} · Participantes: ${esc(f[4])}</p>`).join('')}</div>
    <p class="t-errores"><b>Errores comunes:</b> confundir técnica con instrumento · usar la misma técnica para todo sin pensarlo · una técnica que no encaja con tu paradigma (un cuestionario cerrado para «comprender» experiencias) · no decir cuántos participantes.</p>
  </details>`;
}
function etapaMatriz(c) {
  const k = T.brujula.clave || T.tipoManual || tipoDe(T.pregunta) || 'I';
  const esp = T.objetivos.especificos.filter(x => x.trim());
  if (!T.matriz.length || T.matriz.length !== Math.max(1, esp.length)) {
    const vieja = T.matriz; T.matriz = (esp.length ? esp : ['']).map((x, i) => Object.assign({ objetivo: x, pregunta: '', tecnica: '', instrumento: '', participantes: '' }, vieja[i] || {}, { objetivo: x }));
  } else T.matriz.forEach((f, i) => { f.objetivo = esp[i] || f.objetivo; });
  // Participantes sugeridos: del objetivo general armado o, si no, de la pregunta.
  const g = (T.objetivos.arma || {}).g || {}, sp = sugerenciasPregunta(T.pregunta);
  const partSug = [g.quien || sp.quien, g.donde ? conEn(g.donde) : sp.donde].filter(Boolean).join(' ');
  const opciones = (sel, rec) => {
    const op = t => `<option value="${esc(t)}" ${t === sel ? 'selected' : ''}>${esc(t)}</option>`;
    return (rec.length ? `<optgroup label="✓ Recomendadas para este objetivo">${rec.map(op).join('')}</optgroup>` : '')
      + Object.entries({ cuanti: 'Cuantitativas', cuali: 'Cualitativas', part: 'Participativas' }).map(([gr, n]) => `<optgroup label="${n}">${D.tecnicas[gr].filter(t => !rec.includes(t)).map(op).join('')}</optgroup>`).join('');
  };
  c.insertAdjacentHTML('beforeend', `<p class="t-recuerda"><b>📌 Esta etapa es para la Entrega 2</b> (preguntas 8 y 10). Si todavía estás en la Entrega 1, regresa a la etapa anterior y descarga tu Word.</p>
    <p class="lab-ayuda">La matriz de congruencia muestra que todo cuadra: cada objetivo específico tiene una pregunta, una técnica, un instrumento y unos participantes. Es lo que un sínodo revisa primero. Te sirve para las preguntas 8 y 10.</p>
    ${guiaMatriz(k)}
    ${esp.length ? '' : '<p class="aviso-lab">Primero escribe tus objetivos específicos en la Etapa 3 (Objetivos e hipótesis): aquí aparecerá una fila por cada uno.</p>'}
    <div class="t-matriz" id="mz">${T.matriz.map((f, i) => { const rec = tecRecomendadas(f.objetivo), pq = preguntaDeObjetivo(f.objetivo); return `<article class="t-mz"><p class="ficha-kicker">Objetivo específico ${i + 1}</p><p class="t-mz-obj">${esc(f.objetivo || '(sin escribir)')}</p>
      <div class="t-mz-grid">
        <label class="t-mz-ancho"><span>1 · Pregunta específica <small>Tu objetivo convertido en pregunta.</small></span><textarea rows="2" data-i="${i}" data-c="pregunta" placeholder="¿…?">${esc(f.pregunta)}</textarea>
          ${pq ? `<button type="button" class="t-sug chip-lab" data-i="${i}" data-c="pregunta" data-v="${esc(pq)}">💡 Propuesta: «${esc(pq)}»</button>` : ''}</label>
        <label><span>2 · Técnica <small>El método: lo que harás para obtener la información.</small></span><select data-i="${i}" data-c="tecnica"><option value="">— Elige —</option>${opciones(f.tecnica, rec)}</select>
          <small class="t-tec-info" id="mz-ti${i}"></small></label>
        <label><span>3 · Instrumento <small>La herramienta que vas a preparar.</small></span><input data-i="${i}" data-c="instrumento" value="${esc(f.instrumento)}" placeholder="Guion de entrevista, cuestionario de 20 preguntas…">
          <button type="button" class="t-sug chip-lab" data-i="${i}" data-c="instrumento" id="mz-is${i}" hidden></button></label>
        <label class="t-mz-ancho"><span>4 · Participantes o fuentes <small>Con quiénes y cuántos, o de dónde sale la información.</small></span><input data-i="${i}" data-c="participantes" value="${esc(f.participantes)}" placeholder="6 docentes de 1.º, 2.º y 3.º…">
          ${partSug ? `<button type="button" class="t-sug chip-lab" data-i="${i}" data-c="participantes" data-v="${esc(partSug)}">📌 De tu objetivo general: «${esc(partSug)}» (agrega cuántos)</button>` : ''}</label></div>
      <div class="t-mz-av" id="mz-av${i}"></div></article>`; }).join('')}</div>
    <div id="mz-global"></div>`);
  const infoTec = i => {
    const f = T.matriz[i], inf = TEC_INFO[f.tecnica], b = $('#mz-is' + i);
    $('#mz-ti' + i).textContent = inf ? inf[0] : '';
    if (inf && f.instrumento.trim() !== inf[1]) { b.dataset.v = inf[1]; b.textContent = `💡 Instrumento sugerido: «${inf[1]}»`; b.hidden = false; } else b.hidden = true;
  };
  const revisarMz = () => {
    const esperado = { P: ['cuanti'], I: ['cuali'], S: ['part', 'cuali'], M: ['cuanti', 'cuali'] }[T.brujula.clave] || null;
    T.matriz.forEach((f, i) => {
      const av = [];
      if (!f.pregunta.trim() || !f.tecnica || !f.instrumento.trim() || !f.participantes.trim()) av.push(['mal', 'Faltan datos en esta fila.']);
      if (f.tecnica && esperado && !esperado.includes(grupoTec(f.tecnica))) av.push(['mal', `«${f.tecnica}» es una técnica ${{ cuanti: 'cuantitativa', cuali: 'cualitativa', part: 'participativa' }[grupoTec(f.tecnica)]}, y tu brújula apunta al ${perfil().nombre.toLowerCase()}. O ajustas la técnica, o justificas un enfoque mixto.`]);
      if (f.pregunta.trim() && /^¿\s*(es|hay|existe|influye|afecta|puede)\b/i.test(f.pregunta.trim())) av.push(['mal', 'La pregunta específica se responde con sí o no: ábrela.']);
      if (f.instrumento.trim() && D.tecnicas && Object.values(D.tecnicas).flat().some(t => t.toLowerCase() === f.instrumento.trim().toLowerCase())) av.push(['mal', 'En «Instrumento» escribiste una técnica. El instrumento es la herramienta: el guion, el cuestionario, la guía.']);
      if (f.participantes.trim() && !/\d|todos|todas|el grupo|un grupo/i.test(f.participantes)) av.push(['mal', 'Di cuántos participantes son (por ejemplo, «6 docentes» o «el grupo de 32 alumnos»).']);
      if (!av.length && f.tecnica) av.push(['ok', 'Esta fila es congruente.']);
      $('#mz-av' + i).innerHTML = av.map(([cl, t]) => `<p class="t-${cl === 'ok' ? 'bien' : 'aviso'}">${cl === 'ok' ? '✓' : '!'} ${esc(t)}</p>`).join('');
      infoTec(i);
    });
    const grupos = new Set(T.matriz.map(f => grupoTec(f.tecnica)).filter(Boolean));
    $('#mz-global').innerHTML = !T.brujula.clave ? '<p class="aviso-lab">Completa la brújula (Etapa 2) para revisar la congruencia con tu paradigma.</p>'
      : grupos.size > 1 && T.brujula.clave !== 'M' ? '<p class="aviso-lab">Usas técnicas de más de un tipo. Puede estar bien si lo justificas como un diseño mixto o como triangulación (pregunta 10).</p>' : '';
  };
  $$('#mz input, #mz select, #mz textarea').forEach(el => el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', () => { T.matriz[+el.dataset.i][el.dataset.c] = el.value; cambio(); revisarMz(); }));
  $$('#mz .t-sug').forEach(b => b.addEventListener('click', e => { e.preventDefault(); const el = $(`#mz [data-i="${b.dataset.i}"][data-c="${b.dataset.c}"]:not(button)`); el.value = b.dataset.v; el.dispatchEvent(new Event('input')); el.focus(); }));
  revisarMz();
}

// ------------------------------------------------ Etapa 4: las 18 preguntas
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
// ---- Entrega 1, pregunta por pregunta: respuesta base (con lo que ya hizo en el Taller) + «Ahora hazla tuya»
// (indicaciones cortas con su propio espacio) → la plataforma arma su respuesta final, que él corrige.
const TIPO_VERBO = { P: 'explicar: encontrar causas, relaciones o efectos que se puedan medir', I: 'comprender: entender los significados y las experiencias de las personas', S: 'transformar: cambiar una situación junto con quienes la viven', M: 'explicar y comprender a la vez' };
const tipoActual = () => T.tipoManual || tipoDe(T.pregunta) || T.brujula.clave || '';
const GUIA_E1 = {
  1: { titulo: 'Tema y pregunta de investigación', base: () => apoyo(D.preguntas[0]), sinBase: 'Primero termina la Etapa 1 (De la idea a la pregunta): con tu pregunta aquí aparecerá tu respuesta base.',
    pasos: [['¿Qué viste que te llevó a este tema?', 'Una situación concreta de tus prácticas, tu escuela o tu comunidad: qué pasó, con quién, dónde.'],
      ['¿Por qué importa? ¿A quién le serviría la respuesta?', 'Alumnos, docentes, familias, la escuela, la comunidad…'],
      ['¿Por qué te interesa a ti?', 'Tu experiencia, lo que quieres aportar como pedagoga o pedagogo.']] },
  2: { titulo: 'Tipo de conocimiento que quiero producir', base: () => { const t = tipoActual(); return t ? `Con mi investigación quiero ${TIPO_VERBO[t]}. Mi pregunta es de tipo ${D.tipos[t].nombre.toLowerCase()}: ${D.tipos[t].txt.charAt(0).toLowerCase() + D.tipos[t].txt.slice(1)}` : ''; }, sinBase: 'Cuando tengas tu pregunta en la Etapa 1, aquí aparecerá si explica, comprende o transforma.',
    pasos: [['¿Qué palabra o parte de tu pregunta lo demuestra?', 'Por ejemplo: «¿Cómo viven…?» busca significados; «¿Qué relación…?» busca medir; «¿Cómo puede… junto con…?» busca transformar.'],
      ['¿Qué NO busca tu investigación?', 'Decir lo que no haces aclara lo que sí haces. Por ejemplo: «No busco medir cuántos…, sino entender cómo…».'],
      ['¿Qué autor lo sostiene? Escribe su idea con su cita', 'Dilthey distingue explicar y comprender (Dilthey, 1883/1949); Habermas, los intereses técnico, práctico y emancipatorio (Habermas, 1968/1982).']] },
  3: { titulo: 'Ubicación en la clasificación de las ciencias', base: () => { const t = tipoActual(); if (!T.pregunta) return '';
      const extra = { P: 'Como busca explicar con medición, se acerca al modelo de ciencia que proponía Comte: estudiar la sociedad con el mismo espíritu que la física.', I: 'Desde la distinción de Dilthey, se ubica en las ciencias del espíritu, que no buscan explicar con leyes, sino comprender la vida humana.', S: 'Al buscar transformar una situación junto con sus participantes, se ubica en una ciencia social crítica, que no solo explica o comprende, sino que busca cambiar la realidad.', M: 'Como combina medir y comprender, toma algo del modelo explicativo de Comte y algo de las ciencias del espíritu de Dilthey.' }[t] || '';
      return `Según la clasificación de Bunge, mi investigación pertenece a las ciencias fácticas, porque estudia hechos de la realidad y no relaciones entre signos, como la lógica o las matemáticas; y, dentro de ellas, a las ciencias sociales, porque estudia un fenómeno educativo en el que participan personas. ${extra}`.trim(); },
    sinBase: 'Cuando tengas tu pregunta en la Etapa 1, aquí aparecerá tu ubicación.',
    pasos: [['¿Por qué es fáctica y no formal?', '¿Qué hechos reales vas a observar, medir o escuchar en tu investigación?'],
      ['¿Por qué es social y no natural?', 'Aunque midas algo, ¿quiénes son los protagonistas de tu estudio?'],
      ['¿Qué autor la ubicaría ahí? Escribe su idea con su cita', 'Bunge: ciencias formales y fácticas (Bunge, 1960); Dilthey: ciencias del espíritu (Dilthey, 1883/1949); Comte: la física social (Comte, 1844/1980).']] },
  4: { titulo: 'Paradigma de la investigación', base: () => parrafoBrujula(), sinBase: 'Primero contesta la Etapa 2 (La brújula): aquí aparecerá tu paradigma explicado.',
    pasos: [['Rasgo 1 de TU protocolo que lo demuestra: ¿para qué investigas?', 'Explicar y predecir (positivista), comprender (interpretativo) o transformar (sociocrítico): dilo con tu propio tema.'],
      ['Rasgo 2: ¿cómo te relacionas con los participantes o qué técnicas usarás?', 'Distancia y encuestas, convivencia y entrevistas, o trabajo junto con ellos en talleres.'],
      ['¿Qué autor sostiene tu postura? Escribe su idea con su cita', 'Comte (Comte, 1844/1980), Weber (Weber, 1922/1973), Habermas (Habermas, 1968/1982) o Carr y Kemmis (Carr y Kemmis, 1986/1988).']] },
  5: { titulo: 'Hipótesis o supuesto y falsabilidad', base: () => apoyo(D.preguntas[4]), sinBase: 'Primero escribe tu hipótesis o supuesto y «Me desmentiría que…» en la Etapa 3: aquí aparecerán.',
    pasos: [['¿Por qué es falsable? ¿Qué observarías exactamente?', 'Di qué dato, qué resultado o qué comportamiento verías si estuvieras equivocado.'],
      ['¿Qué excusas NO vas a usar si sale mal?', 'Por ejemplo: «No diré que faltó tiempo». Así tu hipótesis no se protege sola (tema 4.2). Si es cualitativa: ¿qué te haría replantear tu supuesto?'],
      ['Popper o Lakatos con su cita', 'Popper: una teoría es científica si puede ser refutada (Popper, 1934/2008). Lakatos: núcleo duro y cinturón protector (Lakatos, 1978/1989).']] },
  6: { titulo: 'Paradigma dominante y anomalías', base: () => '', guia: 'Frase guía para empezar: «En mi tema suelen investigar con ____. Eso supone que ____. Algo que esos estudios no logran explicar es ____. Como diría Kuhn, ____.»',
    pasos: [['¿Cómo se suele investigar tu tema?', 'Revisa tus antecedentes: ¿la mayoría son encuestas, experimentos, entrevistas, estudios de caso?'],
      ['¿Qué supuesto comparten esos estudios? Ese es el paradigma dominante', 'Por ejemplo: «suponen que la comprensión se mide con una prueba» o «que el problema está solo en el alumno».'],
      ['¿Qué no logran explicar? Esa es la anomalía', 'Algo que no cuadra. Por ejemplo: alumnos que leen bien en voz alta pero no comprenden.'],
      ['Kuhn con su cita', 'La ciencia normal trabaja dentro de un paradigma hasta que las anomalías provocan una crisis (Kuhn, 1962/2013).']] },
};
const oracion = x => { let t = String(x || '').trim(); if (!t) return ''; t = t.charAt(0).toUpperCase() + t.slice(1); return /[.!?»]$/.test(t) ? t : t + '.'; };
const armarE1 = n => { const G = GUIA_E1[n], b = G.base(), ps = (T.e1[n] || []).map(oracion).filter(Boolean); return [b, ps.join(' ')].filter(x => x && x.trim()).join('\n\n'); };
const tieneCita = t => /\([^()]*\d{4}[^()]*\)/.test(t || '');
const refsSugeridas = () => { const ids = [...new Set(D.preguntas.filter(p => p.n <= 6).flatMap(p => p.autores))]; return ids.flatMap(id => ((LAB.autores.find(a => a.id === id) || {}).refs || []).map((r, i) => ({ id: `${id}-${i}`, apa: r.apa }))); };
const refsElegidas = () => { const S = new Set(T.refs.sel); return [...refsSugeridas().filter(r => S.has(r.id)).map(r => r.apa), ...String(T.refs.otras || '').split('\n').map(x => x.trim()).filter(Boolean)]; };

function pintarE1() {
  T.e1paso = Math.max(0, Math.min(6, T.e1paso || 0));
  const paso = T.e1paso, e = D.entregas.entrega1;
  const hecha = n => palabras(T.respuestas[n]) >= 150;
  $('#c-lista').innerHTML = `<div class="t-entrega"><b>${esc(e.nombre)}</b> · ${esc(e.fecha)}<p>${esc(e.req)}</p><p>Vas pregunta por pregunta. <b>Todo se guarda solo</b> mientras escribes.</p></div>
    <nav class="e1-pasos" aria-label="Preguntas de la Entrega 1">${[1, 2, 3, 4, 5, 6].map(n => `<button type="button" data-p="${n - 1}" class="${paso === n - 1 ? 'actual' : ''} ${hecha(n) ? 'hecha' : ''}">${hecha(n) ? '✓' : n}</button>`).join('')}<button type="button" data-p="6" class="e1-desc ${paso === 6 ? 'actual' : ''}">📄 Referencias y Word</button></nav>
    <div id="e1-cuerpo"></div>`;
  $$('.e1-pasos button').forEach(b => b.addEventListener('click', () => { T.e1paso = +b.dataset.p; cambio(); pintarE1(); $('#c-lista').scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
  const cuerpo = $('#e1-cuerpo');
  if (paso === 6) return pintarE1Final(cuerpo);
  const n = paso + 1, p = D.preguntas[paso], G = GUIA_E1[n], base = G.base();
  T.e1[n] = T.e1[n] || G.pasos.map(() => '');
  cuerpo.innerHTML = `<article class="t-preg e1">
    <p class="e1-n">Pregunta ${n} de 6 · ${esc(G.titulo)}</p><h3>${esc(p.texto)}</h3>
    <p class="t-pide"><b>Qué te piden:</b> ${esc(p.pide)}</p>
    <div class="e1-base ${base ? '' : 'vacia'}"><p class="e1-k">${base ? `💡 Tu respuesta base a la pregunta ${n}` : n === 6 ? '💡 Cómo empezar' : '💡 Tu respuesta base'}</p>
      <p>${base ? esc(base) : esc(G.guia || G.sinBase)}</p>
      ${base ? '<small>Sale de lo que hiciste en el Taller. Es tu punto de partida: entra como primer párrafo, pero sola no llega a las 150 palabras. Abajo la argumentas con tus palabras.</small>' : ''}</div>
    <h4 class="e1-h">✍️ Ahora hazla tuya: argumenta y profundiza</h4>
    ${G.pasos.map(([t, a], i) => `<label class="e1-sub"><span><b>${['①', '②', '③', '④'][i]} ${esc(t)}</b><small>${esc(a)}</small></span><textarea data-i="${i}" rows="3">${esc(T.e1[n][i] || '')}</textarea></label>`).join('')}
    <details class="t-pistas"><summary>Pistas, error común y autores</summary><ul>${p.pistas.map(x => `<li>${esc(x)}</li>`).join('')}</ul><p class="t-error-comun"><b>Error común:</b> ${esc(p.error)}</p>
      <p class="t-aut"><b>Autores:</b> ${p.autores.map(a => `<a href="laboratorio.html#constelacion=${a}" target="_blank" rel="noopener">${esc(NOMBRES_AUT[a] || a)}</a>`).join(' · ')} · <b>Compendio:</b> ${p.temas.map(t => `<a href="tema.html?id=${t}" target="_blank" rel="noopener">${t}</a>`).join(' · ')}</p></details>
    <h4 class="e1-h">📝 Tu respuesta final</h4>
    <p class="lab-ayuda">Toca <b>Armar mi respuesta</b> para juntar tu respuesta base con lo que escribiste arriba. Después léela completa, corrígela y une las ideas para que suene a ti: esto es lo que va al Word.</p>
    <button type="button" class="btn-lab-l" id="e1-armar">🧩 Armar mi respuesta con lo anterior</button>
    <textarea class="t-resp" id="e1-final" rows="10" placeholder="Aquí queda tu respuesta completa.">${esc(T.respuestas[n] || '')}</textarea>
    <ul class="e1-checks" id="e1-checks"></ul>
    <div class="e1-nav">${paso ? '<button type="button" class="btn-lab-l" id="e1-ant">← Pregunta anterior</button>' : '<span></span>'}<button type="button" class="btn-lab" id="e1-sig">${n < 6 ? `Siguiente: pregunta ${n + 1} →` : 'Siguiente: referencias y Word →'}</button></div>
  </article>`;
  const checks = () => {
    const t = T.respuestas[n] || '', w = palabras(t), sub = (T.e1[n] || []).filter(x => palabras(x) >= 5).length;
    $('#e1-checks').innerHTML = [
      [w >= 150 && w <= 250, w < 150 ? `${w} palabras: te faltan ${150 - w} para el mínimo de 150` : w > 250 ? `${w} palabras: pasaste el máximo de 250, recorta` : `${w} palabras ✓ dentro del rango`],
      [sub === G.pasos.length, `Argumentaste ${sub} de ${G.pasos.length} puntos de «Ahora hazla tuya»`],
      [tieneCita(t), tieneCita(t) ? 'Incluye al menos una cita (Autor, año) ✓' : 'Falta al menos una cita en APA: (Autor, año)'],
    ].map(([ok, txt]) => `<li class="${ok ? 'ok' : ''}">${ok ? '✓' : '○'} ${esc(txt)}</li>`).join('');
  };
  $$('.e1-sub textarea', cuerpo).forEach(ta => ta.addEventListener('input', () => { T.e1[n][+ta.dataset.i] = ta.value; cambio(); checks(); }));
  $('#e1-final').addEventListener('input', e2 => { T.respuestas[n] = e2.target.value; cambio(); checks(); });
  $('#e1-armar').addEventListener('click', () => {
    const nuevo = armarE1(n); if (!nuevo.trim()) { alert('Primero escribe en «Ahora hazla tuya».'); return; }
    if ((T.respuestas[n] || '').trim() && !confirm('Ya tienes una respuesta final. ¿Reemplazarla por una nueva armada con tu respuesta base y lo que escribiste arriba?')) return;
    T.respuestas[n] = nuevo; $('#e1-final').value = nuevo; cambio(); checks(); $('#e1-final').focus();
  });
  const ir = d => { T.e1paso = paso + d; cambio(); pintarE1(); $('#c-lista').scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  const ba = $('#e1-ant'); if (ba) ba.addEventListener('click', () => ir(-1));
  $('#e1-sig').addEventListener('click', () => ir(1));
  checks();
}
function pintarE1Final(cuerpo) {
  const sug = refsSugeridas(), S = new Set(T.refs.sel);
  const md2 = t => esc(t).replace(/\*([^*]+)\*/g, '<i>$1</i>');
  cuerpo.innerHTML = `<article class="t-preg e1">
    <p class="e1-n">Último paso</p><h3>Referencias y descarga de la primera parte del ensayo</h3>
    <p class="lab-ayuda">La Entrega 1 pide <b>al menos 3 referencias en APA 7</b>. Marca las obras de los autores que citaste (vienen del compendio, ya en formato APA) y agrega las que tú encontraste, una por renglón.</p>
    <div class="e1-refs">${sug.map(r => `<label><input type="checkbox" data-r="${r.id}" ${S.has(r.id) ? 'checked' : ''}> <span>${md2(r.apa)}</span></label>`).join('')}</div>
    <label class="e1-sub"><span><b>Otras referencias</b><small>Una por renglón, en APA 7. Para poner un título en cursivas, enciérralo entre asteriscos: *Título del libro*.</small></span><textarea id="e1-otras" rows="4">${esc(T.refs.otras || '')}</textarea></label>
    <h4 class="e1-h">Antes de descargar</h4><ul class="e1-checks" id="e1-rev"></ul>
    <button type="button" class="btn-lab e1-word" id="e1-word">⬇ Descargar la primera parte del ensayo (preguntas 1 a 6) en Word</button>
    <p class="t-nota">Sale en formato APA 7: portada con el escudo, Times New Roman 12, doble espacio, sangría, número de página y referencias con sangría francesa. Puedes descargarlo las veces que quieras.</p>
    <p class="t-recuerda">🎉 Con esto terminas la Entrega 1. Lo que sigue (la Matriz de congruencia y la Entrega 2) lo verás cuando tu docente lo indique.</p>
    <div class="e1-nav"><button type="button" class="btn-lab-l" id="e1-ant">← Pregunta 6</button><span></span></div></article>`;
  const rev = () => {
    const faltan = [1, 2, 3, 4, 5, 6].filter(n => palabras(T.respuestas[n]) < 150), sinCita = [1, 2, 3, 4, 5, 6].filter(n => !tieneCita(T.respuestas[n])), nr = refsElegidas().length;
    $('#e1-rev').innerHTML = [
      [!faltan.length, faltan.length ? `Preguntas con menos de 150 palabras: ${faltan.join(', ')}` : 'Las 6 respuestas tienen al menos 150 palabras ✓'],
      [!sinCita.length, sinCita.length ? `Preguntas sin cita (Autor, año): ${sinCita.join(', ')}` : 'Las 6 respuestas tienen al menos una cita ✓'],
      [nr >= 3, `${nr} referencia${nr === 1 ? '' : 's'} ${nr >= 3 ? '✓' : `· te faltan ${3 - nr} para el mínimo de 3`}`],
    ].map(([ok, txt]) => `<li class="${ok ? 'ok' : ''}">${ok ? '✓' : '○'} ${esc(txt)}</li>`).join('');
  };
  $$('.e1-refs input', cuerpo).forEach(ch => ch.addEventListener('change', () => { const set = new Set(T.refs.sel); ch.checked ? set.add(ch.dataset.r) : set.delete(ch.dataset.r); T.refs.sel = [...set]; cambio(); rev(); }));
  $('#e1-otras').addEventListener('input', ev => { T.refs.otras = ev.target.value; cambio(); rev(); });
  $('#e1-ant').addEventListener('click', () => { T.e1paso = 5; cambio(); pintarE1(); });
  $('#e1-word').addEventListener('click', () => descargarWord('entrega1'));
  rev();
}
function pintarCuaderno() {
  if (entregaSel === 'entrega1') return pintarE1();
  const e = D.entregas[entregaSel], lista = D.preguntas.filter(p => p.entrega === entregaSel);
  const hechas = lista.filter(p => palabras(T.respuestas[p.n]) >= 150).length;
  const iMz = D.etapas.findIndex(x => x.id === 'matriz'), usaMz = lista.filter(p => p.usa === 'matriz' || p.n === 8 || p.n === 10).map(p => p.n);
  const avisoMz = usaMz.length ? `<p class="t-recuerda">🧭 Las preguntas ${usaMz.join(' y ')} usan tu <b>Matriz de congruencia</b>. Llénala primero en la Etapa ${iMz + 1}: aquí aparecerá como punto de partida. <button type="button" class="btn-lab-l t-ir-mz">Ir a la matriz →</button></p>` : '';
  $('#c-lista').innerHTML = `<div class="t-entrega"><b>${esc(e.nombre)}</b> · ${esc(e.fecha)}<p>${esc(e.req)}</p><p>Llevas <b>${hechas} de ${lista.length}</b> respuestas con al menos 150 palabras.</p>${avisoMz}
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
  $$('.t-ir-mz').forEach(b => b.addEventListener('click', () => irA(D.etapas.findIndex(x => x.id === 'matriz'))));
}
async function descargarWord(ent) {
  await guardarYa();
  const hasta = D.preguntas.filter(p => p.entrega === ent).slice(-1)[0].n, e = D.entregas[ent];
  await descargarAPA({
    titulo: `Pienso, luego investigo: ${ent === 'entrega1' ? 'primera parte del ensayo' : e.nombre.replace(/^Entrega[^·]*·\s*/, '').toLowerCase()}`,
    autor: sesion.anon ? '' : sesion.nombre,
    programa: 'Licenciatura en Pedagogía', institucion: 'ITES René Descartes',
    curso: 'Epistemología y Pedagogía', docente: 'Mtro. Jesús Rodríguez García',
    secciones: D.preguntas.filter(p => p.n <= hasta).map(p => ({ titulo: `${p.n}. ${(GUIA_E1[p.n] && GUIA_E1[p.n].titulo) || p.texto}`, parrafos: String(T.respuestas[p.n] || '').split(/\n+/) })),
    referencias: refsElegidas().length ? refsElegidas() : ['Agrega aquí tus referencias en APA 7, en orden alfabético y con sangría francesa.'],
    archivo: `Pienso_luego_investigo_${ent === 'entrega1' ? 'preguntas_1_a_6' : ent}_${slug(sesion.anon ? 'borrador' : sesion.nombre)}`,
  });
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
