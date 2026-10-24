// tareas.js — «Tareas» de Epistemología y Pedagogía: tareas digitales del Parcial 2 (cuentan en el
// catálogo de tareas como dig-{id}), juegos de práctica y la Arena en vivo.
// · Cuadros comparativos: en equipo (grupos/{g}/equipos/{e}/atlas/{id}) o individual (alumnos/{a}/atlas/{ind}).
// · Arena en vivo: grupos/{g}/arena/sala (la controla el docente) y .../sala/jugadores/{alumno}.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot, FieldPath, collection, getDocs, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";
import { TEMAS_TAREAS, TAREAS_DIG, califica, catalogoId, CUADROS, sugerirCuadro, MIN_PALABRAS_CELDA, QUE_PARADIGMA, PARADIGMAS_OP, ARENA, COEV, COEV_NIV } from "./tareas-datos.js";
import { DocITES } from "./docx-ites.js";
import { brillar, autoresEn, recordarAlumno, olvidarAlumno, cieloLocal, encendidas, rango, TOTAL_ESTRELLAS, BRILLA, NOVA } from "./cielo.js";
import { formacionDe, formaciones, formacionDeTarea, abiertas as inscAbiertas, equipoDe, tareasDeFormacion, enEquipo } from "./equipos.js";

const db = getFirestore(initializeApp(firebaseConfig));
const SESSION_KEY = 'ep_sesion_alumno';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const slug = n => n.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
const lsGet = k => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /* */ } };
const palabras = t => (String(t || '').trim().match(/\S+/g) || []).length;
const barajar = a => { const c = [...a]; for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [c[i], c[j]] = [c[j], c[i]]; } return c; };
const punto = t => /\.$/.test(t) ? t : t + '.';
const fechaHora = ts => { const d = ts && ts.toDate ? ts.toDate() : typeof ts === 'number' ? new Date(ts) : null; return d ? d.toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''; };
let sesion = null; try { sesion = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); } catch { sesion = null; }
recordarAlumno(sesion);
let EQS = null, GDATA = {}, ESTADO = {}, unsubGrupo = null, detener = null;
const abierta = id => !(ESTADO[id] && ESTADO[id].abierta === false);

// ======================================================= acceso y equipo
async function cargarGruposEn(sel) {
  try { const sn = await getDocs(query(collection(db, 'grupos'), orderBy('nombre'))); sel.innerHTML = '<option value="">— Elige tu grupo —</option>' + sn.docs.map(d => `<option value="${d.id}">${esc(d.data().nombre)}</option>`).join(''); }
  catch { sel.innerHTML = '<option value="">No se pudieron cargar los grupos</option>'; }
}
function formAcceso(cont, alEntrar, titulo = 'Entra con tu nombre y PIN') {
  cont.innerHTML = `<div class="ma-login cl-login"><h3>${titulo}</h3>
    <form id="cl-form"><label for="cl-grupo">Tu grupo</label><select id="cl-grupo"><option value="">Cargando grupos…</option></select>
    <label for="cl-nombre">Tu nombre completo</label><input id="cl-nombre" type="text" autocomplete="name" placeholder="Como te registró tu docente">
    <label for="cl-pin">PIN</label><input id="cl-pin" type="text" inputmode="numeric" placeholder="4 dígitos">
    <button type="submit" class="btn-at">Entrar</button><p class="ma-error" id="cl-error" hidden></p></form></div>`;
  cargarGruposEn($('#cl-grupo'));
  $('#cl-form').addEventListener('submit', async e => {
    e.preventDefault(); const err = $('#cl-error'); err.hidden = true;
    const g = $('#cl-grupo').value, n = $('#cl-nombre').value.trim(), pin = $('#cl-pin').value.trim();
    if (!g || !n || !pin) { err.textContent = 'Completa grupo, nombre y PIN.'; err.hidden = false; return; }
    try {
      const id = slug(n), s = await getDoc(doc(db, 'grupos', g, 'alumnos', id));
      if (!s.exists() || String(s.data().pin) !== pin) { err.textContent = 'No encontramos ese nombre y PIN en el grupo elegido. Verifica con tu docente.'; err.hidden = false; return; }
      sesion = { grupoId: g, alumnoId: id, nombre: s.data().nombre, pin }; recordarAlumno(sesion);
      try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(sesion)); } catch { /* */ }
      EQS = null; escucharGrupo(); alEntrar();
    } catch (e2) { err.textContent = 'No se pudo entrar: ' + (e2.message || e2); err.hidden = false; }
  });
}
// Los equipos van por «formaciones»: cada tarea en equipo usa una (ver equipos.js).
async function cargarEquipos(forzar) {
  if (EQS && !forzar) return;
  const [g, sn] = await Promise.all([getDoc(doc(db, 'grupos', sesion.grupoId)), getDocs(collection(db, 'grupos', sesion.grupoId, 'equipos'))]);
  GDATA = g.exists() ? g.data() : {}; EQS = sn.docs.map(d => ({ id: d.id, ...d.data() }));
}
async function equipo(tareaId) {
  try { await cargarEquipos(); } catch { return null; }
  return equipoDe(EQS, formacionDeTarea(GDATA, tareaId), sesion.alumnoId);
}
// une al alumno al equipo del código; si se pasa la tarea, el código debe ser de sus equipos
async function unirseCodigo(codigo, tareaId) {
  codigo = String(codigo || '').trim().toUpperCase();
  if (!/^[A-Z0-9]{4}$/.test(codigo)) throw new Error('El código de equipo tiene 4 letras o números.');
  await cargarEquipos(true);
  const t = EQS.find(e => (e.codigo || '').toUpperCase() === codigo);
  if (!t) throw new Error(`No hay un equipo con el código ${codigo} en tu grupo.`);
  const fid = formacionDe(t), F = formaciones(GDATA)[fid] || {};
  if (tareaId && formacionDeTarea(GDATA, tareaId) !== fid) throw new Error(`El código ${codigo} es de otros equipos («${F.nombre}»), no de los de esta tarea. Revisa el código con tu maestro.`);
  const integ = t.integrantes || [];
  if (integ.includes(sesion.alumnoId)) return t;
  if (!inscAbiertas(GDATA, fid)) throw new Error('Las inscripciones a estos equipos están cerradas. Pídele a tu maestro que te agregue.');
  if (t.max && integ.length >= t.max) throw new Error(`«${t.nombre}» ya está completo (${t.max} integrantes). Elige otro equipo.`);
  const previo = equipoDe(EQS, fid, sesion.alumnoId);   // en la misma formación solo se está en un equipo
  if (previo) { const vi = previo.integrantes || [], vn = previo.nombres || [], k = vi.indexOf(sesion.alumnoId);
    await updateDoc(doc(db, 'grupos', sesion.grupoId, 'equipos', previo.id), { integrantes: vi.filter((_, i) => i !== k), nombres: vn.filter((_, i) => i !== k), ultimoAutor: sesion.alumnoId, ultimoPin: sesion.pin }); }
  await updateDoc(doc(db, 'grupos', sesion.grupoId, 'equipos', t.id), { integrantes: [...integ, sesion.alumnoId], nombres: [...(t.nombres || []), sesion.nombre], ultimoAutor: sesion.alumnoId, ultimoPin: sesion.pin });
  await cargarEquipos(true);
  return EQS.find(e => e.id === t.id) || t;
}
// estado de cada tarea (abierta/cerrada) que pone el docente en grupos/{g}.tareasDig
function escucharGrupo() {
  if (unsubGrupo) unsubGrupo();
  if (!sesion) return;
  unsubGrupo = onSnapshot(doc(db, 'grupos', sesion.grupoId), sn => {
    ESTADO = (sn.exists() && sn.data().tareasDig) || {};
    window.dispatchEvent(new CustomEvent('estado-tareas', { detail: sn.exists() ? sn.data() : {} }));
  }, () => {});
}

// ======================================================= portada: temas que se despliegan
async function estadoDe(a) {
  if (!sesion || !califica(a)) return null;
  const g = sesion.grupoId, al = sesion.alumnoId, eq = enEquipo(a) ? await equipo(a.id) : null;
  const out = { avance: '', entregado: null, cal: null };
  try { const c = await getDoc(doc(db, 'grupos', g, 'alumnos', al, 'tareas', catalogoId(a.id))); if (c.exists() && c.data().calificacion !== undefined && c.data().calificacion !== null) out.cal = c.data().calificacion; } catch { /* */ }
  try {
    if (a.tipo === 'cuadro') {
      const A = CUADROS[a.id], s = await getDoc(eq ? doc(db, 'grupos', g, 'equipos', eq.id, 'atlas', A.id) : doc(db, 'grupos', g, 'alumnos', al, 'atlas', A.ind));
      if (s.exists()) { out.avance = sugerirCuadro(A, s.data().celdas).detalle; out.entregado = s.data().entregado || null; }
    }
  } catch { /* */ }
  return out;
}
function insignia(a, st) {
  if (a.tipo === 'practica') return '<span class="tq tq-practica">Práctica · sin calificación</span>';
  if (a.tipo === 'coev') return '<span class="tq tq-practica">Participación · en vivo</span>';
  if (a.tipo === 'pronto') return '<span class="tq tq-pronto">Próximamente</span>';
  if (!st) return `<span class="tq">${abierta(a.id) ? 'Tarea' : '🔒 Cerrada'}</span>`;
  if (st.cal !== null) return `<span class="tq tq-cal">Calificada: <b>${st.cal}</b></span>`;
  if (st.entregado) return `<span class="tq tq-ent">Entregada ✓ ${esc(fechaHora(st.entregado.t))}</span>`;
  if (!abierta(a.id)) return '<span class="tq tq-cerr">🔒 Cerrada</span>';
  return st.avance ? '<span class="tq tq-prog">En progreso</span>' : '<span class="tq tq-pend">Pendiente</span>';
}
function tarjetaCielo() {
  const n = encendidas(cieloLocal()), R = rango(n);
  return `<a class="ar-tarjeta cielo-tarjeta" href="laboratorio.html#constelacion"><span>🌌</span><div><b>Mi cielo · ${n} de ${TOTAL_ESTRELLAS} estrellas</b><small>${R.ico} ${esc(R.nombre)}. Cada acierto en los juegos y en la Arena enciende la estrella de ese autor en la Constelación del Laboratorio.</small></div><em>Ver mi cielo →</em></a>`;
}
async function portada() {
  const d0 = new Date(), hoy = `${d0.getFullYear()}-${String(d0.getMonth() + 1).padStart(2, '0')}-${String(d0.getDate()).padStart(2, '0')}`;
  const actual = [...TEMAS_TAREAS].reverse().find(t => t.fecha <= hoy) || TEMAS_TAREAS[0];
  $('#cl-acceso').innerHTML = (sesion ? `<div class="tq-quien">👤 <b>${esc(sesion.nombre)}</b> · aquí ves tu avance y tus calificaciones <button type="button" class="ma-link" id="tq-salir">Salir</button></div>`
    : `<div class="tq-quien">Entra con tu nombre y PIN para ver tu avance, entregar y conocer tus calificaciones. <button type="button" class="btn-at" id="tq-entrar">Entrar</button></div>`)
    + `<a class="ar-tarjeta" href="#arena"><span>⚡</span><div><b>Arena en vivo</b><small>Cuando tu maestro abra la Arena, entra aquí: preguntas en vivo contra el reloj, con podio.</small></div><em>Entrar →</em></a>`
    + tarjetaCielo();
  if (sesion) $('#tq-salir').addEventListener('click', () => { try { sessionStorage.removeItem(SESSION_KEY); } catch { /* */ } olvidarAlumno(); sesion = null; EQS = null; if (unsubGrupo) unsubGrupo(); portada(); });
  else $('#tq-entrar').addEventListener('click', () => formAcceso($('#cl-acceso'), portada));
  $('#cl-sesiones').innerHTML = TEMAS_TAREAS.map((t, i) => `<details class="tq-tema" data-tema="${i}" ${t === actual ? 'open' : ''}><summary><span class="tq-num">${esc(t.tema)}</span><span><b>${esc(t.titulo)}</b><small>${esc(t.fechaTexto)} · ${t.acts.filter(califica).length} tarea${t.acts.filter(califica).length === 1 ? '' : 's'}</small></span></summary>
    <div class="cl-cards">${t.acts.map(a => `<a class="cl-card ${a.tipo === 'pronto' ? 'cl-pronto' : ''}" href="${a.tipo === 'pronto' ? '#' : '#' + a.id}" data-act="${a.id}"><span class="cl-ico">${a.icono}</span><b>${esc(a.nombre)}</b><small>${esc(a.modo)}</small><p>${esc(a.desc)}</p><span class="cl-estado" data-st="${a.id}">${insignia(a, null)}</span><p class="cl-avance" data-av="${a.id}"></p></a>`).join('')}</div></details>`).join('');
  $$('.cl-pronto').forEach(x => x.addEventListener('click', e => e.preventDefault()));
  if (sesion) {
    escucharGrupo();
    for (const a of Object.values(TAREAS_DIG).filter(califica)) estadoDe(a).then(st => { const s = $(`[data-st="${a.id}"]`), v = $(`[data-av="${a.id}"]`); if (s) s.innerHTML = insignia(a, st); if (v) v.textContent = st && st.avance ? st.avance : ''; });
    tareasNormales();
  }
}
// Tareas que el docente dejó a mano (no digitales): se acomodan en el tema de su fecha.
async function tareasNormales() {
  let cat = [];
  try { const sn = await getDocs(collection(db, 'grupos', sesion.grupoId, 'tareas_catalogo')); cat = sn.docs.map(d => ({ id: d.id, ...d.data() })).filter(t => t.parcial === 'p2' && !t.id.startsWith('dig-')).sort((a, b) => (a.fecha || '').localeCompare(b.fecha || '')); } catch { return; }
  if (!cat.length) return;
  const fechaTxt = f => { if (!f) return ''; const [y, m, d] = f.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'long' }); };
  const sueltas = [];
  for (const t of cat) {
    let cal = null;
    try { const c = await getDoc(doc(db, 'grupos', sesion.grupoId, 'alumnos', sesion.alumnoId, 'tareas', t.id)); if (c.exists() && c.data().calificacion !== undefined && c.data().calificacion !== null) cal = c.data().calificacion; } catch { /* */ }
    const html = `<div class="cl-card cl-normal"><span class="cl-ico">📝</span><b>${esc(t.nombre)}</b><small>Tarea en clase o en papel</small><p>${t.fecha ? `Fecha: ${esc(fechaTxt(t.fecha))}. ` : ''}Se entrega como indique tu maestro.</p><span class="cl-estado">${cal !== null ? `<span class="tq tq-cal">Calificada: <b>${cal}</b></span>` : '<span class="tq tq-pend">Sin calificar todavía</span>'}</span></div>`;
    const i = t.fecha ? TEMAS_TAREAS.map((x, k) => [x, k]).filter(([x]) => x.fecha <= t.fecha).map(([, k]) => k).pop() : undefined;
    const caja = i !== undefined ? $(`.tq-tema[data-tema="${i}"] .cl-cards`) : null;
    if (caja) caja.insertAdjacentHTML('beforeend', html); else sueltas.push(html);
  }
  if (sueltas.length) $('#cl-sesiones').insertAdjacentHTML('beforeend', `<details class="tq-tema" open><summary><span class="tq-num">📝</span><span><b>Otras tareas del parcial</b><small>Las que tu maestro dejó en clase o en papel</small></span></summary><div class="cl-cards">${sueltas.join('')}</div></details>`);
}

// ======================================================= navegación
function ruta() {
  const id = location.hash.slice(1).split('=')[0];
  if (detener) { detener(); detener = null; }
  const mu = location.hash.match(/^#unir-([A-Z0-9]{4})$/i);
  if (mu) return unirPorQR(mu[1].toUpperCase());
  if (id === 'arena') { $('#cl-sesiones').hidden = true; $('#cl-acceso').hidden = true; $('#cl-actividad').innerHTML = '<a class="cl-volver" href="#">← Todas las tareas</a><h2 class="cl-h2">⚡ Arena en vivo</h2><div id="cl-cuerpo"></div>'; actArena($('#cl-cuerpo')); window.scrollTo({ top: 0 }); return; }
  const a = TAREAS_DIG[id];
  if (!a || a.tipo === 'pronto') { $('#cl-sesiones').hidden = false; $('#cl-acceso').hidden = false; $('#cl-actividad').innerHTML = ''; portada(); return; }
  $('#cl-sesiones').hidden = true; $('#cl-acceso').hidden = true;
  const c = $('#cl-actividad');
  c.innerHTML = `<a class="cl-volver" href="#">← Todas las tareas</a><p class="cl-fecha">Tema ${esc(a.tema)} · ${esc(a.titulo)} · ${esc(a.fechaTexto)}</p><h2 class="cl-h2">${a.icono} ${esc(a.nombre)}</h2>
    ${a.tipo === 'coev' ? '<p class="cl-vale">🗣️ Cuenta en tu participación.</p>' : califica(a) ? '<p class="cl-vale">📌 Cuenta como una tarea del Parcial 2.</p>' : '<p class="cl-vale cl-vale-p">🎯 Práctica para repasar: no lleva calificación.</p>'}<div id="cl-cuerpo"></div>`;
  if (a.tipo === 'cuadro') actCuadro($('#cl-cuerpo'), a);
  else if (a.tipo === 'coev') actCoev($('#cl-cuerpo'));
  else ({ 'que-paradigma': actQueParadigma, 'quien-lo-dijo': actQuienLoDijo })[a.id]($('#cl-cuerpo'));
  window.scrollTo({ top: 0 });
}
// El QR de un equipo abre tareas.html#unir-CODIGO (vía unir.html): entra, se une y va a su tarea.
const hrefTarea = a => '#' + a.id;
function unirPorQR(codigo) {
  $('#cl-sesiones').hidden = true; $('#cl-acceso').hidden = true;
  const c = $('#cl-actividad');
  c.innerHTML = `<a class="cl-volver" href="#">← Todas las tareas</a><h2 class="cl-h2">👥 Unirme a mi equipo</h2><div id="cl-cuerpo"></div>`;
  const cuerpo = $('#cl-cuerpo');
  const hacer = async () => {
    cuerpo.innerHTML = `<p class="atlas-ayuda">Uniéndote al equipo con el código <b>${esc(codigo)}</b>…</p>`;
    try {
      const t = await unirseCodigo(codigo);
      const d0 = new Date(), hoy = `${d0.getFullYear()}-${String(d0.getMonth() + 1).padStart(2, '0')}-${String(d0.getDate()).padStart(2, '0')}`;
      const ts = tareasDeFormacion(GDATA, formacionDe(t), TAREAS_DIG).sort((x, y) => x.fecha.localeCompare(y.fecha));
      const abiertasT = ts.filter(a => !(((GDATA.tareasDig || {})[a.id] || {}).abierta === false));
      const destino = [...abiertasT].reverse().find(a => a.fecha <= hoy) || abiertasT[0] || ts[ts.length - 1];
      cuerpo.innerHTML = `<div class="cl-unido"><p class="cl-unido-ok">✅ ¡Listo, ${esc(sesion.nombre.split(' ')[0])}! Ya eres parte de <b>«${esc(t.nombre)}»</b>.</p>
        <p>Integrantes: ${esc((t.nombres || []).join(', '))}</p>
        ${destino ? `<a class="btn-at cl-ir" href="${hrefTarea(destino)}">Ir a ${esc(destino.nombre)} →</a>` : '<p class="atlas-ayuda">Tu maestro todavía no asigna una tarea a estos equipos. Te avisará en clase.</p>'}
        ${ts.length > 1 ? `<p class="cl-otras">Este equipo también es para: ${ts.filter(a => a !== destino).map(a => `<a href="${hrefTarea(a)}">${esc(a.nombre)}</a>`).join(' · ')}</p>` : ''}</div>`;
      history.replaceState(null, '', location.pathname + '#');
    } catch (e) {
      cuerpo.innerHTML = `<div class="cl-sin-eq"><p class="ma-msg mal">${esc(e.message || e)}</p><a class="btn-ruta" href="#">Ver mis tareas</a></div>`;
    }
  };
  if (sesion) hacer(); else formAcceso(cuerpo, () => { escucharGrupo(); hacer(); }, `Vas a unirte al equipo <b>${esc(codigo)}</b>. Entra con tu nombre y PIN`);
}

// ---- barra común: entregar tarea y aviso de tarea cerrada
function barraEntrega(cont, a, { entregado, alEntregar }) {
  const zona = $('[data-entrega]', cont);
  const pintar = () => {
    const ab = abierta(a.id);
    zona.innerHTML = !ab ? `<div class="cl-cerrada">🔒 Tu maestro cerró esta tarea: ya no se guardan cambios.${entregado() ? ` Entregada el ${esc(punto(fechaHora(entregado().t)))}` : ''}</div>`
      : entregado() ? `<div class="cl-entregada">✅ Entregada el ${esc(entregado().por ? fechaHora(entregado().t) + ' por ' + entregado().por + '.' : punto(fechaHora(entregado().t)))} Aún puedes corregir mientras la tarea siga abierta.</div>`
      : '<div class="cl-entregar"><span>¿Ya terminaron? Entreguen la tarea para que su maestro la califique.</span><button type="button" class="btn-at" data-entregar>📤 Entregar tarea</button></div>';
    const b = $('[data-entregar]', zona); if (b) b.addEventListener('click', async () => { if (!confirm('¿Entregar la tarea? Podrás seguir corrigiendo mientras tu maestro no la cierre.')) return; b.disabled = true; try { await alEntregar(); } catch (e) { alert('No se pudo entregar: ' + (e.message || e)); b.disabled = false; } pintar(); });
    $$('textarea, input:not([type=hidden])', cont).forEach(t => { if (!t.closest('[data-entrega]')) t.readOnly = !ab; });
  };
  window.addEventListener('estado-tareas', pintar);
  pintar();
  return pintar;
}

// ======================================================= 1. CUADRO COMPARATIVO (en equipo o individual, en vivo)
function actCuadro(cont, a) {
  const entrar = async () => {
    escucharGrupo();
    cont.innerHTML = '<p class="atlas-ayuda">Buscando a tu equipo…</p>';
    const eq = await equipo(a.id);
    if (eq) return cuadro(cont, eq, a);
    cont.innerHTML = `<div class="cl-sin-eq"><p><b>Todavía no estás en un equipo.</b> Escribe el código de 4 letras de tu equipo (o escanea el QR que proyecta tu maestro).</p>
      <form id="cl-unir" class="ma-unir"><div><input id="cl-cod" maxlength="4" autocomplete="off" placeholder="ABCD" aria-label="Código del equipo"><button class="btn-at" type="submit">Unirme</button></div></form>
      <p class="ma-msg mal" id="cl-unir-msg" hidden></p><p class="cl-o">o</p><button type="button" class="btn-ruta" id="cl-solo">Hacerla solo (se guarda en tu cuenta)</button></div>`;
    $('#cl-unir').addEventListener('submit', async e => { e.preventDefault(); try { cuadro(cont, await unirseCodigo($('#cl-cod').value, a.id), a); } catch (er) { const m = $('#cl-unir-msg'); m.textContent = er.message || er; m.hidden = false; } });
    $('#cl-solo').addEventListener('click', () => cuadro(cont, null, a));
  };
  if (sesion) entrar(); else formAcceso(cont, entrar, 'Entra con tu nombre y PIN para trabajar en esta tarea');
}
function cuadro(cont, eq, a) {
  const A = CUADROS[a.id], claves = A.filas.flatMap(([f]) => A.columnas.map(([c]) => `${f}_${c}`));
  let S = { celdas: {}, por: {}, entregado: null }, clave = false, pend = new Map(), vuelo = new Map(), pendT = null, existe = false, ultima = '';
  const ref = eq ? doc(db, 'grupos', sesion.grupoId, 'equipos', eq.id, 'atlas', A.id) : doc(db, 'grupos', sesion.grupoId, 'alumnos', sesion.alumnoId, 'atlas', A.ind);
  cont.innerHTML = `<div class="ma-barra"><span>${eq ? `👥 <b>${esc(eq.nombre)}</b>: ${esc((eq.nombres || []).join(', '))}` : `👤 <b>${esc(sesion.nombre)}</b> (individual)`}</span><span class="ma-estado" id="cu-estado"></span>
      <button type="button" class="btn-ruta" id="cu-word">⬇ Descargar en Word</button></div>
    <div data-entrega></div>
    <p class="atlas-ayuda">${A.ayuda}${eq ? ' Repártanse el trabajo en el equipo.' : ''} Se guarda solo${eq ? ' y todos ven al instante lo que escriben los demás' : ''}.</p>
    <p class="cu-progreso" id="cu-progreso"></p>
    <div class="cu-clave" id="cu-clave" hidden><b>🔑 Su maestro liberó la clave.</b> <button type="button" class="btn-at" id="cu-ver-clave" aria-pressed="false">Comparar con la clave</button></div>
    <div class="cu-tabla ${A.columnas.length === 1 ? 'cu-1col' : ''}">${A.filas.map(([f, t, ayuda, inv]) => `<section class="cu-fila ${inv ? 'cu-inv' : ''}"><h3>${inv ? '<span class="cu-tag">🔎 Investiga</span>' : ''}${esc(t)}<small>${esc(ayuda)}</small></h3>
      <div class="cu-celdas">${A.columnas.map(([c, nc], ci) => `<label class="cu-celda cu-${c}"><span>${esc(nc)} <small class="ma-autor" data-autor="${f}_${c}"></small></span><textarea data-k="${f}_${c}" rows="3"></textarea>
        ${A.sinClave ? '' : `<p class="cu-resp" data-resp="${f}_${c}" hidden><b>${inv ? 'Respuesta de referencia' : 'Según el compendio'}:</b> ${esc(A.respuestas[f][ci])}</p>`}</label>`).join('')}</div>
      ${inv ? `<label class="cu-fuente"><span>📚 Fuente: ¿de dónde lo sacaron? <small class="ma-autor" data-autor="${f}_fuente"></small></span><input data-k="${f}_fuente" type="text" placeholder="Autor o sitio, título y enlace (URL)"></label>` : ''}</section>`).join('')}</div>`;
  const estado = (t, c = '') => { const e = $('#cu-estado'); if (e) { e.textContent = t; e.className = 'ma-estado ' + c; } };
  const pintar = () => {
    const act = document.activeElement;
    $$('[data-k]', cont).forEach(t => { const v = S.celdas[t.dataset.k] || ''; if (t !== act && t.value !== v) t.value = v; });
    $$('[data-autor]', cont).forEach(s => { const au = eq && S.por[s.dataset.autor]; s.textContent = au ? `✍️ ${au}` : ''; });
    const pal = k => ((S.celdas[k] || '').trim().match(/\S+/g) || []).length;
    const n = claves.filter(k => pal(k) >= MIN_PALABRAS_CELDA).length, inv = A.filas.filter(x => x[3]), fu = inv.filter(([f]) => (S.celdas[`${f}_fuente`] || '').trim()).length;
    $$('[data-k]', cont).forEach(t => { const k = t.dataset.k; if (!k.endsWith('_fuente')) t.classList.toggle('cu-corta', pal(k) > 0 && pal(k) < MIN_PALABRAS_CELDA); });
    $('#cu-progreso').innerHTML = `<b>${n} de ${claves.length}</b> celdas llenas · <b>${fu} de ${inv.length}</b> fuentes <span class="ma-barra-p"><i style="width:${Math.round(100 * n / claves.length)}%"></i></span><small class="cu-regla">Una celda cuenta cuando tiene al menos ${MIN_PALABRAS_CELDA} palabras. ${inv.length ? `Las celdas valen 8 puntos y ${inv.length === 1 ? 'la fuente de investigación' : `las ${inv.length} fuentes de investigación`}, 2.` : ''}</small>`;
  };
  const aplicar = d => { const c = { celdas: { ...(d.celdas || {}) }, por: { ...(d.por || {}) }, entregado: d.entregado || null }; [...vuelo.values(), ...pend.values()].forEach(([r, v]) => { c[r[0]][r[1]] = v; }); return c; };
  const firma = () => eq ? { ultimoAutor: sesion.alumnoId, ultimoPin: sesion.pin, ultimoNombre: sesion.nombre } : { pinVerificado: sesion.pin, nombre: sesion.nombre };
  const flush = async () => {
    clearTimeout(pendT); pendT = null; if (!pend.size) return;
    const lote = [...pend.values()]; pend.forEach((v, k) => vuelo.set(k, v)); pend.clear();
    try {
      if (!eq) {
        await setDoc(ref, { celdas: S.celdas, ...firma(), ultimoCambio: ultima, actualizado: serverTimestamp() }, { merge: true });
      } else {
        if (!existe) { const s0 = await getDoc(ref); if (!s0.exists()) await setDoc(ref, { celdas: {}, por: {}, ...firma(), actualizado: serverTimestamp() }); existe = true; }
        const args = []; lote.forEach(([r, v]) => args.push(new FieldPath(...r), v));
        args.push('ultimoAutor', sesion.alumnoId, 'ultimoPin', sesion.pin, 'ultimoNombre', sesion.nombre, 'ultimoCambio', ultima, 'actualizado', serverTimestamp());
        await updateDoc(ref, ...args);
      }
      lote.forEach(([r]) => vuelo.delete(r.join('|')));
      if (!pend.size) estado(eq ? 'Guardado y compartido con tu equipo ✓' : 'Guardado en tu cuenta ✓', 'ok');
    } catch {
      lote.forEach(([r, v]) => { const k = r.join('|'); vuelo.delete(k); if (!pend.has(k)) pend.set(k, [r, v]); });
      estado('No se pudo guardar. Reintentando…', 'mal'); pendT = setTimeout(flush, 4000);
    }
  };
  $$('[data-k]', cont).forEach(t => t.addEventListener('input', () => {
    if (!abierta(a.id)) return;
    const k = t.dataset.k; S.celdas[k] = t.value; S.por[k] = sesion.nombre;
    const [f, c] = k.split('_'); ultima = `escribe ${A.filas.find(x => x[0] === f)[1].toLowerCase()} (${c === 'fuente' ? 'la fuente' : A.columnas.find(x => x[0] === c)[1]})`;
    pend.set('celdas|' + k, [['celdas', k], t.value]); pend.set('por|' + k, [['por', k], sesion.nombre]);
    estado('Guardando…'); clearTimeout(pendT); pendT = setTimeout(flush, 700); pintar();
  }));
  const subs = []; let repEntrega = () => {};
  estado('Conectando…');
  subs.push(onSnapshot(ref, sn => { existe = sn.exists(); S = aplicar(sn.exists() ? sn.data() : {}); if (!pend.size && !vuelo.size) estado(eq ? 'Sincronizado con tu equipo ✓' : 'Guardado en tu cuenta ✓', 'ok'); pintar(); repEntrega(); }, () => estado('Sin conexión. Revisa tu internet.', 'mal')));
  const verClave = d => { clave = !A.sinClave && !!((d.claves || {})[A.clave]); $('#cu-clave').hidden = !clave; if (!clave) $$('.cu-resp', cont).forEach(p => { p.hidden = true; }); };
  const onEstado = e => verClave(e.detail || {});
  window.addEventListener('estado-tareas', onEstado);
  getDoc(doc(db, 'grupos', sesion.grupoId)).then(s => verClave(s.exists() ? s.data() : {})).catch(() => {});
  $('#cu-ver-clave').addEventListener('click', e => { const on = e.currentTarget.getAttribute('aria-pressed') !== 'true'; e.currentTarget.setAttribute('aria-pressed', String(on)); e.currentTarget.textContent = on ? 'Ocultar la clave' : 'Comparar con la clave'; $$('.cu-resp', cont).forEach(p => { p.hidden = !on; }); });
  repEntrega = barraEntrega(cont, a, {
    entregado: () => S.entregado,
    alEntregar: async () => {
      await flush();
      const en = { t: serverTimestamp(), por: sesion.nombre };
      if (eq) { if (!existe) await setDoc(ref, { celdas: {}, por: {}, ...firma(), actualizado: serverTimestamp() }, { merge: true }); await updateDoc(ref, { entregado: en, ...firma(), ultimoCambio: 'entregó la tarea', actualizado: serverTimestamp() }); }
      else await setDoc(ref, { celdas: S.celdas, entregado: en, ...firma(), actualizado: serverTimestamp() }, { merge: true });
      S.entregado = { t: Date.now(), por: sesion.nombre };
    },
  });
  $('#cu-word').addEventListener('click', async () => {
    await flush();
    const D = new DocITES(); await D.cargarLogo();
    D.portada({ kicker: A.kicker, titulo: A.titulo, subtitulo: 'Cuadro comparativo', etiqueta: eq ? `Equipo «${eq.nombre}»` : 'Alumno', personas: eq ? eq.nombres || [] : [sesion.nombre] });
    D.h1('Cuadro comparativo');
    const celda = k => { const t = (S.celdas[k] || '').trim(), au = eq && S.por[k]; return { runs: [[t || '(sin escribir)', t ? {} : { i: true, color: '9A9389' }], ...(au ? [[`\n✍ ${au}`, { color: '3F7A4F', tam: 8 }]] : [])] }; };
    const cab = (f, t, inv) => { const fu = (S.celdas[`${f}_fuente`] || '').trim(); return inv ? { runs: [[t, { b: true }], [`\n🔎 Investigación${fu ? ' · Fuente: ' + fu : ' · sin fuente'}`, { color: '6B6358', tam: 8, i: !fu }]], fondo: 'F4EFE4' } : { t, b: true, fondo: 'F4EFE4' }; };
    D.tabla([['Apartado', ...A.columnas.map(c => c[1])], ...A.filas.map(([f, t, , inv]) => [cab(f, t, inv), ...A.columnas.map(([c]) => celda(`${f}_${c}`))])], { anchos: [1700, ...A.columnas.map(() => Math.floor(7660 / A.columnas.length))] });
    if (clave) {
      D.h1('Comparación con la clave', 'La clave que liberó el maestro (del compendio y, en las filas de investigación, respuestas de referencia), para revisar lo que escribimos.');
      D.tabla([['Apartado', ...A.columnas.map(c => c[1])], ...A.filas.map(([f, t]) => [{ t, b: true, fondo: 'F4EFE4' }, ...A.respuestas[f]])], { anchos: [1700, ...A.columnas.map(() => Math.floor(7660 / A.columnas.length))] });
    }
    D.descargar(`${A.archivo}_${slug(eq ? 'equipo ' + eq.nombre : sesion.nombre)}`);
  });
  pintar();
  const salir = () => flush();
  window.addEventListener('beforeunload', salir);
  detener = () => { subs.forEach(u => u()); window.removeEventListener('estado-tareas', onEstado); window.removeEventListener('estado-tareas', repEntrega); window.removeEventListener('beforeunload', salir); flush(); };
}

// ======================================================= JUEGOS DE PRÁCTICA del 3.2 (segunda parte)
// Motor común: niveles, modo reto con reloj, mejor marca, repaso de fallos y tabla para estudiar.
// Aviso pequeño bajo la explicación: qué estrella se encendió o ganó brillo, y si subió de rango.
function avisoBrillo(r, nombre) {
  const nombreDe = id => (nombre && nombre(id)) || id;
  const ids = Object.keys(r.despues).filter(id => r.despues[id] !== (r.antes[id] || 0));
  if (!ids.length) return '';
  const linea = id => { const n = r.despues[id]; return r.nuevas.includes(id) ? `🌟 <b>¡Encendiste la estrella de ${esc(nombreDe(id))}!</b>` : n === NOVA ? `💥 <b>¡${esc(nombreDe(id))} es supernova!</b>` : n === BRILLA ? `✨ <b>${esc(nombreDe(id))} ya brilla</b>` : `✦ ${esc(nombreDe(id))} +1 brillo <small>(${Math.min(n, NOVA)}/${NOVA})</small>`; };
  return `<div class="ci-aviso ${r.nuevas.length ? 'nueva' : ''}">${ids.map(linea).join('<br>')}<small>Tu cielo: ${r.total} de ${TOTAL_ESTRELLAS}</small></div>${r.subeRango ? `<div class="ci-rango">${r.subeRango.ico} <b>¡Subiste de rango: ${esc(r.subeRango.nombre)}!</b></div>` : ''}`;
}
function juegoPreguntas(cont, C) {
  const SEG = C.seg || 15;
  let reto = lsGet('clase_' + C.clave + '_reto') === '1', nuevasRonda = new Set(), N = null, items = [], i = 0, bien = 0, pts = 0, racha = 0, mejorRacha = 0, fallos = [], reloj = null, t0 = 0, malos = 0;
  const parar = () => { clearInterval(reloj); reloj = null; };
  detener = parar;
  const mejor = id => lsGet(`clase_${C.clave}_mejor_${id}`) || '—';
  const inicio = () => {
    parar();
    cont.innerHTML = `<p class="atlas-ayuda">${C.intro}</p>
      <div class="ap-niveles">${C.niveles.map(nv => `<button type="button" class="ap-nivel" data-n="${nv.id}"><span>${nv.ico}</span><b>${nv.n}</b><small>${esc(nv.desc)}</small><em>Tu mejor marca: ${mejor(nv.id)}</em></button>`).join('')}</div>
      <label class="ap-reto"><input type="checkbox" id="ap-reto" ${reto ? 'checked' : ''}> ⏱ <b>Modo reto:</b> ${SEG} segundos por pregunta; respondiendo rápido ganas más puntos y sumas racha.</label>
      <button type="button" class="btn-ruta" id="ap-estudiar">📚 ${esc(C.estudiar.boton)}</button>`;
    $('#ap-reto').addEventListener('change', e => { reto = e.target.checked; lsSet('clase_' + C.clave + '_reto', reto ? '1' : '0'); });
    $$('.ap-nivel', cont).forEach(b => b.addEventListener('click', () => { N = C.niveles.find(x => x.id === b.dataset.n); nueva(); }));
    $('#ap-estudiar').addEventListener('click', estudiar);
  };
  const nueva = () => { items = barajar(C.items.filter(N.filtro)).slice(0, N.preg); nuevasRonda = new Set(); i = 0; bien = 0; pts = 0; racha = 0; mejorRacha = 0; fallos = []; malos = 0; pregunta(); };
  const marcador = () => `${C.cabecera ? C.cabecera(bien, malos) : ''}<div class="ap-marcador"><span>${N.ico} ${N.n} · ${C.termina ? `pregunta ${i + 1}` : `${Math.min(i + 1, items.length)} de ${items.length}`}</span><span>✅ ${bien}</span>${reto ? `<span>⭐ ${pts} pts · 🔥 racha ${racha}</span>` : ''}</div>`;
  const terminado = () => i >= items.length || (C.termina && C.termina(bien, malos));
  const pregunta = () => {
    parar();
    if (terminado()) return fin();
    const x = items[i], P = C.preparar(x);
    cont.innerHTML = `<div id="ap-mk">${marcador()}</div>${reto ? '<div class="ap-tiempo"><i id="ap-t"></i></div>' : ''}
      <div class="ap-carta jp-carta">${P.carta}</div>
      <div class="jp-opciones ${P.clase || ''}">${P.opciones.map(o => `<button type="button" class="ap-bot jp-op" data-v="${esc(o.v)}" ${o.style ? `style="${o.style}"` : ''}>${o.t}</button>`).join('')}</div>
      <div id="ap-fb" aria-live="polite"></div>`;
    $$('.jp-op', cont).forEach(b => b.addEventListener('click', () => responder(b.dataset.v, P)));
    if (reto) { t0 = Date.now(); reloj = setInterval(() => { const q = Math.max(0, SEG - (Date.now() - t0) / 1000), b = $('#ap-t'); if (b) b.style.width = (100 * q / SEG) + '%'; if (q <= 0) { parar(); responder(null, P); } }, 100); }
  };
  const responder = (v, P) => {
    const q = reto ? Math.max(0, SEG - (Date.now() - t0) / 1000) : 0; parar();
    const x = items[i], ok = v !== null && P.correctas.includes(v);
    $$('.jp-op', cont).forEach(b => { b.disabled = true; if (P.correctas.includes(b.dataset.v)) b.classList.add('ok'); else if (b.dataset.v === v) b.classList.add('mal'); });
    if (ok) { bien++; racha++; mejorRacha = Math.max(mejorRacha, racha); if (reto) pts += 100 + Math.round(10 * q); } else { malos++; racha = 0; fallos.push(x); }
    const tit = v === null ? '⏱ Se acabó el tiempo.' : ok ? (C.bien ? C.bien(x, bien) : '¡Correcto!') : (C.mal ? C.mal(x, malos) : 'No es esa.');
    $('#ap-fb').innerHTML = `<div class="aviso ${ok ? 'ok' : 'mal'}"><strong>${tit}</strong>${C.explicar(x, ok)}</div><div id="jp-extra"></div><button class="btn-at" id="ap-sig" type="button">${terminado() || i + 1 >= items.length ? 'Ver resultado' : 'Siguiente →'}</button>`;
    if (C.despues) C.despues(x, v, $('#jp-extra'));
    if (ok && C.estrellas) { const ex = $('#jp-extra'); brillar(db, sesion, C.estrellas(x)).then(r => { r.nuevas.forEach(id => nuevasRonda.add(id)); if (ex && ex.isConnected) ex.insertAdjacentHTML('beforeend', avisoBrillo(r, C.nombreAutor)); }).catch(() => {}); }
    $('#ap-mk').innerHTML = marcador();
    if (C.escena) C.escena(ok, bien, malos);
    $('#ap-sig').addEventListener('click', () => { i++; pregunta(); }); $('#ap-sig').focus({ preventScroll: true });
  };
  const fin = async () => {
    parar();
    if (C.escenaFinal) { const e = C.escenaFinal(bien, malos); if (e) { cont.innerHTML = ''; await e; } }
    const marca = reto ? pts : bien, clave = `clase_${C.clave}_mejor_${N.id}`, previa = Number((lsGet(clave) || '0').split(/[ /]/)[0]) || 0, record = marca > previa;
    if (record) lsSet(clave, reto ? `${pts} pts` : `${bien}/${Math.min(i, items.length)}`);
    const tot = encendidas(cieloLocal()), Rg = rango(tot);
    const cielo = C.estrellas ? `<a class="ci-fin" href="laboratorio.html#constelacion"><span>🌌</span><div><b>${nuevasRonda.size ? `¡${nuevasRonda.size} estrella${nuevasRonda.size === 1 ? '' : 's'} nueva${nuevasRonda.size === 1 ? '' : 's'} en esta ronda!` : 'Tu cielo'}</b><small>${tot} de ${TOTAL_ESTRELLAS} encendidas · ${Rg.ico} ${esc(Rg.nombre)}${Rg.sig ? ` · te faltan ${Rg.sig.faltan} para ${Rg.sig.ico} ${esc(Rg.sig.nombre)}` : ''}</small></div><em>Ver mi cielo →</em></a>` : '';
    cont.innerHTML = `<div class="resumen">${C.final ? C.final(bien, malos) : ''}${cielo}<h3>${N.ico} ${N.n}: ${bien} acierto${bien === 1 ? '' : 's'} de ${Math.min(i, items.length)}</h3>
      <p>${reto ? `⭐ <b>${pts} puntos</b> · mejor racha: ${mejorRacha}. ` : ''}${record ? '🏅 ¡Nueva mejor marca!' : ''}</p>
      <p>${!fallos.length ? '¡Sin errores! Ya dominas este nivel.' : 'Estudia los que fallaste:'}</p>
      ${fallos.length ? `<ul class="ap-fallos">${fallos.map(x => `<li>${C.repaso(x)}</li>`).join('')}</ul>` : ''}
      <div class="ap-fin-bot"><button class="btn-at" id="ap-otra" type="button">Otra ronda</button>${C.niveles.length > 1 ? '<button class="btn-ruta" id="ap-niv" type="button">Cambiar de nivel</button>' : ''}<button class="btn-ruta" id="ap-est" type="button">📚 Estudiar</button></div></div>`;
    $('#ap-otra').addEventListener('click', nueva); const bn = $('#ap-niv'); if (bn) bn.addEventListener('click', inicio); $('#ap-est').addEventListener('click', estudiar);
  };
  const estudiar = () => {
    parar();
    const E = C.estudiar; let f = E.filtros[0][0], qq = '';
    cont.innerHTML = `<button type="button" class="ma-link" id="ap-volver">← Volver al juego</button>
      <p class="atlas-ayuda">${E.intro}</p>
      ${E.filtros.length > 1 ? `<div class="atlas-zoom" id="ap-filtros">${E.filtros.map(([k, n]) => `<button type="button" class="chip-at" data-f="${k}" aria-pressed="${k === f}">${n}</button>`).join('')}</div>` : ''}
      <input id="ap-buscar" class="ap-buscar" type="search" placeholder="Buscar…" aria-label="Buscar">
      <p class="ap-cuenta" id="ap-cuenta"></p><div class="ap-tabla ${E.clase || ''}" id="ap-tabla"></div>`;
    const sin = t => String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const pintar = () => {
      const fn = E.filtros.find(x => x[0] === f)[2];
      const xs = C.items.filter(x => fn(x) && (!qq || sin(E.texto(x)).includes(sin(qq))));
      $('#ap-cuenta').textContent = `${xs.length} ${xs.length === 1 ? E.uno : E.varios}`;
      $('#ap-tabla').innerHTML = xs.map(E.fila).join('') || '<p class="atlas-ayuda">No hay resultados.</p>';
    };
    $$('#ap-filtros .chip-at').forEach(b => b.addEventListener('click', () => { f = b.dataset.f; $$('#ap-filtros .chip-at').forEach(x => x.setAttribute('aria-pressed', String(x === b))); pintar(); }));
    $('#ap-buscar').addEventListener('input', e => { qq = e.target.value.trim(); pintar(); });
    $('#ap-volver').addEventListener('click', inicio);
    pintar(); window.scrollTo({ top: 0 });
  };
  inicio();
}

// ======================================================= 🧭 ¿QUÉ PARADIGMA ES? (práctica)
// Si el ejemplo no nombra a nadie, se enciende el autor que mejor representa esa respuesta.
const REPRESENTA = { par: { P: 'comte', I: 'weber', S: 'habermas' }, lin: { L: 'descartes', S: 'bertalanffy' } };
function actQueParadigma(cont) {
  cargarLab();
  const nom = (g, c) => (PARADIGMAS_OP[g].find(x => x[0] === c) || [])[1];
  juegoPreguntas(cont, {
    clave: 'paradigma', seg: 15,
    intro: 'Aparece el título de una tesis, un fragmento o una idea de un autor: ¿desde qué <b>paradigma</b> está planteado? Al responder verás por qué. También hay una ronda de <b>pensamiento lineal o sistémico</b> con el caso de Kevin. Te sirve para tu cuadro y para la pregunta 4 de tu proyecto.',
    niveles: [
      { id: 'paradigmas', n: 'Paradigmas', ico: '🧭', preg: 12, desc: 'Títulos de tesis y fragmentos: ¿positivista, interpretativo o sociocrítico?', filtro: x => x.g === 'par' && x.niv <= 2 },
      { id: 'lineal', n: '¿Lineal o sistémica?', ico: '🔄', preg: 8, desc: 'El caso de Kevin, Descartes, Bertalanffy y la escuela como sistema.', filtro: x => x.g === 'lin' },
      { id: 'experto', n: 'Experto', ico: '🏆', preg: 16, desc: 'Todo mezclado, con los autores y los tres intereses de Habermas.', filtro: () => true },
    ],
    items: QUE_PARADIGMA,
    estrellas: x => { const a = autoresEn(x.q, x.x); return a.length ? a : [REPRESENTA[x.g][x.c]]; }, nombreAutor,
    preparar: x => ({ carta: `<span class="ap-emo">${x.e}</span><b class="jp-q">${esc(x.q)}</b>`, opciones: PARADIGMAS_OP[x.g].map(([k, n, col]) => ({ v: k, t: esc(n), style: `--c:${col}` })), correctas: [x.c], clase: 'jp-infl' }),
    mal: x => `No: es ${nom(x.g, x.c).toLowerCase()}.`,
    explicar: x => `<p class="ap-dato">${esc(x.x)}</p>`,
    repaso: x => `${x.e} <b>${esc(x.q)}</b> → ${esc(nom(x.g, x.c))}. <span class="ap-dato">${esc(x.x)}</span>`,
    estudiar: { boton: 'Estudiar los paradigmas', intro: 'Todos los ejemplos del juego con su paradigma y su explicación (compendio, 3.1 a 3.3).', uno: 'ejemplo', varios: 'ejemplos', texto: x => x.q + ' ' + nom(x.g, x.c),
      filtros: [['todos', 'Todos', () => true], ['P', 'Positivista', x => x.g === 'par' && x.c === 'P'], ['I', 'Interpretativo', x => x.g === 'par' && x.c === 'I'], ['S', 'Sociocrítico', x => x.g === 'par' && x.c === 'S'], ['L', 'Lineal', x => x.g === 'lin' && x.c === 'L'], ['Y', 'Sistémica', x => x.g === 'lin' && x.c === 'S']],
      fila: x => { const o = PARADIGMAS_OP[x.g].find(y => y[0] === x.c); return `<div class="ap-fila" style="border-left-color:${o[2]}"><span class="ap-fe">${x.e}</span><div><b>${esc(x.q)}</b> <small class="ap-tag">${esc(o[1])}</small><p class="ap-dato">${esc(x.x)}</p></div></div>`; } },
  });
}

// ======================================================= ⚡ ARENA EN VIVO (alumno)
// El docente controla grupos/{g}/arena/sala: {estado, ronda, set, idx, orden[], dur}.
// Cada alumno guarda sus respuestas en .../sala/jugadores/{alumno}: r.{idx} = {o (índice original; 0 es la correcta), ms}.
const AR_FORMAS = [['▲', '#C0503F'], ['◆', '#2E6FA8'], ['●', '#D9A441'], ['■', '#3F7A4F']];
const arPuntos = (r, dur) => r && r.o === 0 ? Math.round(500 + 500 * Math.max(0, 1 - (r.ms || 0) / ((dur || 20) * 1000))) : 0;
const arTotal = (j, S) => Object.entries((j && j.ronda === S.ronda && j.r) || {}).reduce((s, [, r]) => s + arPuntos(r, S.dur), 0);
function actArena(cont) {
  if (!sesion) { formAcceso(cont, () => actArena(cont), 'Entra con tu nombre y PIN para jugar en la Arena'); return; }
  const g = sesion.grupoId, salaRef = doc(db, 'grupos', g, 'arena', 'sala'), yoRef = doc(db, 'grupos', g, 'arena', 'sala', 'jugadores', sesion.alumnoId);
  let S = null, YO = null, J = [], visto = { clave: '', t: 0 }, reloj = null;
  const brillados = new Set(), avisos = {}; cargarLab();
  const subs = [];
  const parar = () => { clearInterval(reloj); reloj = null; };
  detener = () => { parar(); subs.forEach(u => u()); };
  const unirme = async () => { try { await setDoc(yoRef, { nombre: sesion.nombre, pinVerificado: sesion.pin, ronda: S.ronda, r: {}, unido: serverTimestamp() }); } catch (e) { cont.innerHTML = `<p class="ma-msg mal">No se pudo entrar a la Arena: ${esc(e.message || e)}</p>`; } };
  const lugar = () => { const ts = J.filter(j => j.ronda === S.ronda).map(j => ({ id: j.id, n: j.nombre, p: arTotal(j, S) })).sort((a, b) => b.p - a.p); return { pos: ts.findIndex(x => x.id === sesion.alumnoId) + 1, de: ts.length, top: ts.slice(0, 5), mio: arTotal(YO, S) }; };
  const pintar = () => {
    parar();
    if (!S || !S.estado || S.estado === 'cerrada') { cont.innerHTML = '<div class="ar-espera"><span>⚡</span><b>La Arena está cerrada</b><p>Cuando tu maestro la abra, esta pantalla cambiará sola. No cierres la página.</p></div>'; return; }
    if (!YO || YO.ronda !== S.ronda) { cont.innerHTML = '<p class="atlas-ayuda">Entrando a la Arena…</p>'; unirme(); return; }
    const P = (ARENA[S.set] || { preguntas: [] }).preguntas[S.idx], L = lugar();
    if (S.estado === 'espera') { cont.innerHTML = `<div class="ar-espera"><span>✅</span><b>¡Estás dentro, ${esc(sesion.nombre.split(' ')[0])}!</b><p>${esc((ARENA[S.set] || {}).titulo || '')}</p><p class="ar-num">${L.de} jugador${L.de === 1 ? '' : 'es'} en la sala</p><p>Mira la pantalla del salón: el juego empieza cuando tu maestro lo indique.</p></div>`; return; }
    if (S.estado === 'pregunta' && P) {
      const clave = S.ronda + ':' + S.idx; if (visto.clave !== clave) visto = { clave, t: performance.now() };
      const mia = (YO.r || {})[S.idx];
      if (mia) { cont.innerHTML = `<div class="ar-espera"><span>📨</span><b>Respuesta enviada</b><p>Espera a que se acabe el tiempo…</p></div>`; return; }
      cont.innerHTML = `<div class="ar-cab"><span>Pregunta ${S.idx + 1} de ${S.n}</span><span>⭐ ${L.mio} pts</span></div><div class="ap-tiempo"><i id="ar-t"></i></div>
        <p class="ar-q">${esc(P.q)}</p><div class="ar-ops">${S.orden.map((o, k) => `<button type="button" class="ar-op" data-o="${o}" style="--c:${AR_FORMAS[k][1]}"><span>${AR_FORMAS[k][0]}</span>${esc(P.o[o])}</button>`).join('')}</div>`;
      const dur = (S.dur || 20) * 1000;
      const fin = () => { parar(); $$('.ar-op', cont).forEach(b => { b.disabled = true; }); const t = $('#ar-t'); if (t) t.style.width = '0'; if (!$('.ar-tarde', cont)) cont.insertAdjacentHTML('beforeend', '<p class="ar-tarde">⏱ ¡Se acabó el tiempo!</p>'); };
      reloj = setInterval(() => { const q = dur - (performance.now() - visto.t), t = $('#ar-t'); if (t) t.style.width = Math.max(0, 100 * q / dur) + '%'; if (q <= 0) fin(); }, 100);
      $$('.ar-op', cont).forEach(b => b.addEventListener('click', async () => {
        const ms = Math.round(performance.now() - visto.t); if (ms > dur) return fin();
        $$('.ar-op', cont).forEach(x => { x.disabled = true; x.classList.toggle('ar-yo', x === b); }); parar();
        try { await updateDoc(yoRef, new FieldPath('r', String(S.idx)), { o: Number(b.dataset.o), ms }, 'pinVerificado', sesion.pin); }
        catch (e) { cont.insertAdjacentHTML('beforeend', `<p class="ma-msg mal">No se pudo enviar: ${esc(e.message || e)}</p>`); }
      }));
      return;
    }
    if (S.estado === 'revela' && P) {
      const mia = (YO.r || {})[S.idx], ok = mia && mia.o === 0, gan = arPuntos(mia, S.dur), cl = S.ronda + ':' + S.idx;
      if (ok && !brillados.has(cl)) { brillados.add(cl); brillar(db, sesion, autoresEn(P.q, P.o[0], P.x)).then(r => { avisos[cl] = avisoBrillo(r, nombreAutor); const c = $('#ar-cielo', cont); if (c) c.innerHTML = avisos[cl]; }).catch(() => {}); }
      cont.innerHTML = `<div class="ar-res ${ok ? 'ok' : 'mal'}"><span>${ok ? '✅' : mia ? '❌' : '⏱'}</span><b>${ok ? `¡Correcto! +${gan}` : mia ? 'Incorrecto' : 'No respondiste a tiempo'}</b>
        <p>La respuesta era: <b>${esc(P.o[0])}</b></p><p class="ap-dato">${esc(P.x)}</p>
        <p class="ar-num">⭐ ${L.mio} puntos · vas en el lugar <b>${L.pos}</b> de ${L.de}</p><div id="ar-cielo">${avisos[cl] || ''}</div></div>`;
      return;
    }
    if (S.estado === 'fin') {
      cont.innerHTML = `<div class="ar-res ok"><span>🏁</span><b>¡Terminó la Arena!</b><p class="ar-num">Hiciste <b>${L.mio} puntos</b> · quedaste en el lugar <b>${L.pos}</b> de ${L.de}</p>
        <ol class="ar-podio">${L.top.map((x, k) => `<li class="${x.id === sesion.alumnoId ? 'yo' : ''}"><span>${['🥇', '🥈', '🥉', '4.º', '5.º'][k]}</span>${esc(x.n)}<b>${x.p}</b></li>`).join('')}</ol></div>`;
    }
  };
  subs.push(onSnapshot(salaRef, sn => { S = sn.exists() ? sn.data() : null; pintar(); }, () => { cont.innerHTML = '<p class="ma-msg mal">Sin conexión. Revisa tu internet.</p>'; }));
  subs.push(onSnapshot(yoRef, sn => { YO = sn.exists() ? sn.data() : null; pintar(); }, () => {}));
  subs.push(onSnapshot(collection(db, 'grupos', g, 'arena', 'sala', 'jugadores'), sn => { J = sn.docs.map(d => ({ id: d.id, ...d.data() })); if (S && (S.estado === 'espera' || S.estado === 'revela' || S.estado === 'fin')) pintar(); }, () => {}));
}

// ======================================================= 🗣️ COEVALUACIÓN DE LAS EXPOSICIONES (alumno)
// El docente pone en grupos/{g}.coev = {equipo, abierta}; cada alumno califica en alumnos/{a}/atlas/tarea-coev-{equipo}.
function actCoev(cont) {
  if (!sesion) { formAcceso(cont, () => actCoev(cont), 'Entra con tu nombre y PIN para evaluar las exposiciones'); return; }
  const g = sesion.grupoId; let C = {}, eqs = [], mia = null, unsubMia = null, autorDe = {};
  const subs = [];
  detener = () => { subs.forEach(u => u()); if (unsubMia) unsubMia(); };
  const pintar = async () => {
    const id = C.equipo, eq = eqs.find(e => e.id === id);
    if (!C.abierta || !eq) { cont.innerHTML = '<div class="ar-espera"><span>🗣️</span><b>Esperando la siguiente exposición</b><p>Cuando tu maestro indique qué equipo expone, aquí aparecerá la rúbrica para evaluarlo. No cierres la página.</p></div>'; return; }
    if (!(id in autorDe)) { try { const s = await getDoc(doc(db, 'grupos', g, 'equipos', id, 'atlas', CUADROS['ficha-autor'].id)); autorDe[id] = s.exists() ? ((s.data().celdas || {}).autor_ficha || '') : ''; } catch { autorDe[id] = ''; } }
    if ((eq.integrantes || []).includes(sesion.alumnoId)) { cont.innerHTML = `<div class="ar-espera"><span>🎤</span><b>¡Expone tu equipo, «${esc(eq.nombre)}»!</b><p>Tus compañeros los están evaluando. ¡Mucho éxito!</p></div>`; return; }
    const ref = doc(db, 'grupos', g, 'alumnos', sesion.alumnoId, 'atlas', 'tarea-coev-' + id);
    if (!mia || mia._eq !== id) { try { const s = await getDoc(ref); mia = { ...(s.exists() ? s.data() : {}), _eq: id }; } catch { mia = { _eq: id }; } }
    const cal = mia.cal || {};
    cont.innerHTML = `<div class="co-cab"><span>Expone</span><b>${esc(eq.nombre)}</b>${autorDe[id] ? `<small>${esc(autorDe[id])}</small>` : ''}</div>
      <p class="atlas-ayuda">Califica cada aspecto de 1 a 4 y déjales una pregunta. Puedes corregir mientras la evaluación esté abierta. Tu evaluación es anónima para el equipo.</p>
      ${COEV.map(([k, t, d]) => `<div class="co-crit"><p><b>${esc(t)}</b><small>${esc(d)}</small></p><div class="co-niv">${COEV_NIV.map(([n, nn]) => `<button type="button" data-k="${k}" data-n="${n}" aria-pressed="${cal[k] === n}"><b>${n}</b><small>${nn}</small></button>`).join('')}</div></div>`).join('')}
      <label class="de-lbl">Tu pregunta para el equipo<textarea id="co-preg" rows="2" placeholder="¿Qué diría tu autor sobre…?">${esc(mia.pregunta || '')}</textarea></label>
      <button type="button" class="btn-at" id="co-enviar">📤 Enviar mi evaluación</button><p class="ma-msg" id="co-msg" ${mia.t ? '' : 'hidden'}>${mia.t ? '✓ Evaluación enviada. Puedes corregirla.' : ''}</p>`;
    $$('.co-niv button', cont).forEach(b => b.addEventListener('click', () => { cal[b.dataset.k] = Number(b.dataset.n); mia.cal = cal; $$(`.co-niv button[data-k="${b.dataset.k}"]`, cont).forEach(x => x.setAttribute('aria-pressed', String(x === b))); }));
    $('#co-enviar').addEventListener('click', async () => {
      const m = $('#co-msg'), faltan = COEV.filter(([k]) => !cal[k]);
      if (faltan.length) { m.textContent = `Te falta calificar: ${faltan.map(x => x[1].toLowerCase()).join(', ')}.`; m.className = 'ma-msg mal'; m.hidden = false; return; }
      mia.pregunta = $('#co-preg').value.trim();
      try { await setDoc(ref, { pinVerificado: sesion.pin, nombre: sesion.nombre, equipo: id, cal, pregunta: mia.pregunta, t: serverTimestamp() }); mia.t = Date.now(); m.textContent = '✓ Evaluación enviada. Puedes corregirla mientras siga abierta.'; m.className = 'ma-msg ok'; m.hidden = false; }
      catch (e) { m.textContent = 'No se pudo enviar: ' + (e.message || e); m.className = 'ma-msg mal'; m.hidden = false; }
    });
  };
  subs.push(onSnapshot(doc(db, 'grupos', g), sn => { const n = (sn.exists() && sn.data().coev) || {}; const cambio = n.equipo !== C.equipo || n.abierta !== C.abierta; C = n; GDATA = sn.exists() ? sn.data() : {}; if (cambio) pintar(); }, () => {}));
  subs.push(onSnapshot(collection(db, 'grupos', g, 'equipos'), sn => { eqs = sn.docs.map(d => ({ id: d.id, ...d.data() })); pintar(); }, () => {}));
}

// ======================================================= 💬 ¿QUIÉN LO DIJO? (práctica, con los 55 autores de la Constelación)
let LAB = null, LAB_P = null;
const cargarLab = () => LAB_P || (LAB_P = fetch('data/laboratorio.json').then(r => r.json()).then(d => (LAB = d)).catch(() => { LAB_P = null; return null; }));
const nombreAutor = id => { const a = LAB && LAB.autores.find(x => x.id === id); return a ? a.nombre : id; };
async function actQuienLoDijo(cont) {
  cont.innerHTML = '<p class="atlas-ayuda">Cargando a los autores…</p>';
  try { LAB = LAB || await cargarLab(); if (!LAB) throw 0; } catch { cont.innerHTML = '<p class="ma-msg mal">No se pudieron cargar los autores.</p>'; return; }
  const A = LAB.autores, F = LAB.familias, tema = (a, n) => (a.temas || []).some(t => n.includes(t.split('.')[0]));
  const items = [...A.map(a => ({ tipo: 'frase', a })), ...A.filter(a => (a.obras || []).length).map(a => ({ tipo: 'obra', a }))];
  const distractores = a => { const misma = barajar(A.filter(x => x.id !== a.id && x.fam === a.fam)), otras = barajar(A.filter(x => x.id !== a.id && x.fam !== a.fam)); return [...misma, ...otras].slice(0, 3); };
  juegoPreguntas(cont, {
    clave: 'quien', seg: 15,
    intro: 'Aparece una frase (o una obra) y eliges quién la dijo o la escribió. Son los <b>55 pensadores de la Constelación</b> del Laboratorio. Empieza por el Tema 4, que es el de mañana… y del examen.',
    niveles: [
      { id: 'tema4', n: 'Tema 4', ico: '🔭', preg: 10, desc: 'Positivismo lógico, Popper, Kuhn, Lakatos, Feyerabend, Morin y compañía.', filtro: x => x.tipo === 'frase' && tema(x.a, ['4']) },
      { id: 'temas14', n: 'Temas 1 a 4', ico: '📚', preg: 15, desc: 'Todos los autores del repaso: de Platón a Morin.', filtro: x => x.tipo === 'frase' && tema(x.a, ['1', '2', '3', '4']) },
      { id: 'experto', n: 'Experto', ico: '🏆', preg: 20, desc: 'Los 55 autores, y también por sus obras.', filtro: () => true },
    ],
    items,
    estrellas: x => [x.a.id], nombreAutor,
    preparar: x => { const ops = barajar([x.a, ...distractores(x.a)]); return { carta: x.tipo === 'frase' ? `<span class="ap-emo">💬</span><b class="jp-q">«${esc(x.a.frase)}»</b>` : `<span class="ap-emo">📖</span><small class="jp-pista">¿Quién escribió…?</small><b class="jp-q">${esc(x.a.obras[0])}</b>`, opciones: ops.map(a => ({ v: a.id, t: esc(a.nombre), style: `--c:${(F[a.fam] || {}).color || '#3E5BA8'}` })), correctas: [x.a.id], clase: 'jp-infl jp-autores' }; },
    mal: x => `No: es de ${esc(x.a.nombre)}.`,
    explicar: x => `<p class="ap-orig"><b>${esc(x.a.nombre)}</b> (${esc(x.a.vida || '')}) · ${esc((F[x.a.fam] || {}).nombre || '')}</p><p class="ap-dato">${esc((x.a.obras || [])[0] || '')}${x.tipo === 'obra' ? ` · «${esc(x.a.frase)}»` : ''} · Temas ${esc((x.a.temas || []).join(', '))}. <a href="laboratorio.html" target="_blank" rel="noopener">Ver su ficha en la Constelación ↗</a></p>`,
    repaso: x => `<b>${esc(x.a.nombre)}</b>: ${x.tipo === 'frase' ? `«${esc(x.a.frase)}»` : esc(x.a.obras[0])}`,
    estudiar: { boton: 'Estudiar a los autores', intro: 'Los 55 pensadores con su frase, su obra principal y los temas donde aparecen. Su ficha completa está en el Laboratorio → Constelación.', uno: 'autor', varios: 'autores', texto: x => x.a.nombre + ' ' + x.a.frase,
      filtros: [['todos', 'Todos', x => x.tipo === 'frase'], ['t4', 'Tema 4', x => x.tipo === 'frase' && tema(x.a, ['4'])], ...Object.entries(F).map(([k, f]) => [k, f.nombre, x => x.tipo === 'frase' && x.a.fam === k])],
      fila: x => `<div class="ap-fila" style="border-left-color:${(F[x.a.fam] || {}).color || '#3E5BA8'}"><span class="ap-fe">✦</span><div><b>${esc(x.a.nombre)}</b> <small class="ap-tag">${esc(x.a.vida || '')} · Temas ${esc((x.a.temas || []).join(', '))}</small><p class="ap-orig">«${esc(x.a.frase)}»</p><p class="ap-dato">${esc((x.a.obras || [])[0] || '')}</p></div></div>` },
  });
}

window.addEventListener('hashchange', ruta);
ruta();
