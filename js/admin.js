// admin.js — Panel docente de Epistemología y Pedagogía.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut,
  EmailAuthProvider, reauthenticateWithCredential
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore, collection, doc, setDoc, deleteDoc, addDoc, getDoc, getDocs,
  query, orderBy, serverTimestamp, onSnapshot, updateDoc, deleteField
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { firebaseConfig } from "./firebase-config.js";
import { calcularParcial, calcularCuatrimestre, calcularCuatrimestreRedondeado, zonaDeDecision, textoCalificacion, NOMBRES_PARCIAL, NOMBRES_REDONDEO, TOPES } from "./calculo.js";
import { reporteGrupo, reporteAlumno, reporteExamenAlumno, reporteExamenGrupo } from "./reporte.js";
import { vistaRapida } from "./matriz.js";
import { TEMAS_TAREAS, TAREAS_DIG, califica, catalogoId, nombreCatalogo, CUADROS, sugerirCuadro, MIN_PALABRAS_CELDA, ARENA, COEV, TR_LENTES, TR_VER, TR_MIN_ARG, trPuntos, TR_CASOS_SUGERIDOS, PRUEBA_ID, PRUEBA_NOMBRE } from "./tareas-datos.js";
import { BASE, enEquipo, formacionDe, formaciones, ordenFormaciones, formacionDeTarea, equiposDe, tareasDeFormacion, urlUnir, qrSvg } from "./equipos.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// PARCIALES: usado únicamente para todo lo que depende de calculo.js
// (Historial, exportar CSV, resumen del alumno) — el Diagnóstico NO
// participa en ningún cálculo de calificación, así que NO va aquí.
const PARCIALES = ['p1', 'p2', 'final'];

// PARCIALES_EXAMEN: usado solo en la sección "Examen en línea" del panel,
// donde SÍ debe aparecer el Diagnóstico como una opción más para
// abrir/cerrar y revisar intentos — pero sin calificación oficial.
const PARCIALES_EXAMEN = ['diag', 'p1', 'p2', 'final'];
const ETIQUETAS_EXAMEN = { diag: 'Examen Diagnóstico', ...NOMBRES_PARCIAL };

const ETIQUETA_ESTADO = { presente: 'Presente', retardo: 'Retardo', justificado: 'Justificado', falta: 'Falta' };
const CICLO_ESTADO = { presente: 'retardo', retardo: 'justificado', justificado: 'falta', falta: 'presente' };

let grupoActivo = null;
let alumnosCache = [];

function on(id, evento, fn) {
  const el = document.getElementById(id);
  if (el) el.addEventListener(evento, fn);
  else console.warn(`[admin] No existe #${id} en este HTML.`);
  return el;
}
function escaparHTML(str) { const div = document.createElement('div'); div.textContent = str; return div.innerHTML; }

function marcarResultado(botonId, msgId, exito, textoExito, textoError) {
  const boton = document.getElementById(botonId);
  if (boton) {
    boton.style.transition = 'background-color .15s ease, color .15s ease';
    boton.style.backgroundColor = exito ? '#4A5D3C' : '#A63D2F';
    boton.style.color = '#fff';
    setTimeout(() => { boton.style.backgroundColor = ''; boton.style.color = ''; }, 1100);
  }
  const msg = document.getElementById(msgId);
  if (msg) { msg.textContent = exito ? textoExito : textoError; msg.hidden = false; setTimeout(() => { msg.hidden = true; }, exito ? 3000 : 6000); }
}

// ---------- LOGIN ----------
onAuthStateChanged(auth, async user => {
  if (user) {
    document.getElementById('login-screen').hidden = true;
    document.getElementById('app-screen').hidden = false;
    await cargarGrupos();
    const select = document.getElementById('grupo-select');
    const guardado = localStorage.getItem('ep_grupo_activo');
    if (guardado && [...select.options].some(o => o.value === guardado)) select.value = guardado;
    if (select.value) {
      grupoActivo = select.value;
      localStorage.setItem('ep_grupo_activo', grupoActivo);
      await cargarAlumnos();
      cargarTabActiva();
    }
  } else {
    document.getElementById('login-screen').hidden = false;
    document.getElementById('app-screen').hidden = true;
  }
});

on('login-form', 'submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-pass').value;
  const errorEl = document.getElementById('login-error');
  errorEl.hidden = true;
  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (err) {
    const MENSAJES = {
      'auth/user-not-found': 'Ese correo no está dado de alta en Firebase Authentication.',
      'auth/wrong-password': 'La contraseña no coincide con la de ese usuario.',
      'auth/invalid-credential': 'Correo o contraseña incorrectos, o el usuario no existe.',
      'auth/invalid-email': 'Ese correo no tiene un formato válido.',
      'auth/too-many-requests': 'Demasiados intentos fallidos — espera unos minutos.',
      'auth/network-request-failed': 'Falla de conexión a internet.',
    };
    errorEl.textContent = MENSAJES[err.code] || `No se pudo entrar (${err.code || err.message}).`;
    errorEl.hidden = false;
  }
});

on('btn-logout', 'click', () => signOut(auth));

document.querySelectorAll('.tab-btn').forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));

function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === `tab-${tab}`));
  cargarTabActiva();
}

function cargarTabActiva() {
  const btnActivo = document.querySelector('.tab-btn.active');
  if (!btnActivo) return;
  const tab = btnActivo.dataset.tab;
  // La tabla en vivo del examen solo escucha mientras esa pestaña está abierta.
  if (tab !== 'enlinea') detenerIntentosEnVivo();
  // Tabla de alumnos contra actividades, arriba de la captura de siempre.
  vistaRapida(tab, { db, grupoActivo, alumnos: alumnosCache, datosDeAlumno });
  if (tab === 'tareas') { cargarCatalogo('tareas'); cargarTareasDig(); }
  if (tab === 'equipos') cargarEquiposTab();
  if (tab === 'monitor') iniciarMonitor(); else detenerMonitor();
  if (tab === 'arena') iniciarArena(); else detenerArena();
  if (tab === 'tribunal') iniciarTribunal(); else detenerTribunal();
  if (tab === 'coev') iniciarCoev(); else detenerCoev();
  if (tab === 'participacion') cargarCatalogo('participaciones');
  if (tab === 'proyecto') cargarProyecto();
  if (tab === 'asistencia') cargarAsistencia();
  if (tab === 'uniformes') cargarUniformes();
  if (tab === 'enlinea') { cargarExamenesAbiertos(); cargarIntentos(); }
  if (tab === 'historial') cargarHistorial();
  if (tab === 'avisos') cargarAvisos();
}

// ---------- GRUPOS ----------
async function cargarGrupos() {
  const select = document.getElementById('grupo-select');
  const snap = await getDocs(query(collection(db, 'grupos'), orderBy('nombre')));
  select.innerHTML = '<option value="">— Elige un grupo —</option>';
  snap.forEach(d => { const opt = document.createElement('option'); opt.value = d.id; opt.textContent = d.data().nombre; select.appendChild(opt); });
}

on('btn-nuevo-grupo', 'click', crearGrupo);
on('grupo-select', 'change', async (e) => {
  grupoActivo = e.target.value || null;
  detenerIntentosEnVivo();
  if (grupoActivo) {
    localStorage.setItem('ep_grupo_activo', grupoActivo);
    await cargarAlumnos();
    cargarTabActiva();
  } else {
    localStorage.removeItem('ep_grupo_activo');
    renderAlumnos([]);
  }
});

async function crearGrupo() {
  const nombre = prompt('Nombre del nuevo grupo (ej. "Epistemología y Pedagogía — 7.º Pedagogía"):');
  if (!nombre || !nombre.trim()) return;
  const ref = await addDoc(collection(db, 'grupos'), { nombre: nombre.trim(), creado: serverTimestamp() });
  await cargarGrupos();
  document.getElementById('grupo-select').value = ref.id;
  grupoActivo = ref.id;
  localStorage.setItem('ep_grupo_activo', grupoActivo);
  cargarAlumnos();
}

on('btn-eliminar-grupo', 'click', eliminarGrupo);

async function eliminarGrupo() {
  if (!grupoActivo) { alert('Elige el grupo que quieres eliminar.'); return; }
  const select = document.getElementById('grupo-select');
  const nombreGrupo = select.options[select.selectedIndex].textContent;
  const ok = confirm(`¿ELIMINAR el grupo "${nombreGrupo}"?\n\nSe borrarán TODOS sus alumnos y calificaciones. Esto NO se puede deshacer.`);
  if (!ok) return;
  const pass = prompt('Para confirmar, escribe tu contraseña del panel docente:');
  if (!pass) return;
  try {
    const cred = EmailAuthProvider.credential(auth.currentUser.email, pass);
    await reauthenticateWithCredential(auth.currentUser, cred);
  } catch { alert('Contraseña incorrecta. No se eliminó nada.'); return; }

  const alumnosSnap = await getDocs(collection(db, 'grupos', grupoActivo, 'alumnos'));
  for (const alumnoDoc of alumnosSnap.docs) {
    const base = ['grupos', grupoActivo, 'alumnos', alumnoDoc.id];
    for (const sub of ['tareas', 'participaciones', 'asistencias', 'uniformes', 'examenes', 'externa', 'proyecto', 'intentos', 'actividades']) {
      const subSnap = await getDocs(collection(db, ...base, sub)).catch(() => null);
      if (subSnap) await Promise.all(subSnap.docs.map(d => deleteDoc(doc(db, ...base, sub, d.id))));
    }
    await deleteDoc(doc(db, 'grupos', grupoActivo, 'alumnos', alumnoDoc.id));
  }
  for (const sub of ['avisos', 'config', 'tareas_catalogo', 'participaciones_catalogo']) {
    const subSnap = await getDocs(collection(db, 'grupos', grupoActivo, sub)).catch(() => null);
    if (subSnap) await Promise.all(subSnap.docs.map(d => deleteDoc(doc(db, 'grupos', grupoActivo, sub, d.id))));
  }
  await deleteDoc(doc(db, 'grupos', grupoActivo));
  alert(`Grupo "${nombreGrupo}" eliminado.`);
  grupoActivo = null; alumnosCache = [];
  localStorage.removeItem('ep_grupo_activo');
  await cargarGrupos();
  renderAlumnos([]);
}

function nombreDelGrupo() {
  const select = document.getElementById('grupo-select');
  return select.options[select.selectedIndex]?.textContent || 'Sin grupo';
}

// ---------- ALUMNOS ----------
function slugNombre(nombre) {
  return nombre.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
}
function generarPIN() { return String(Math.floor(1000 + Math.random() * 9000)); }

on('form-alumno', 'submit', agregarAlumno);
on('btn-carga-masiva', 'click', cargaMasiva);

// Carga masiva: un nombre completo por renglón. Omite renglones vacíos y
// nombres que ya existen en el grupo (mismo nombre, sin importar acentos).
async function cargaMasiva() {
  if (!grupoActivo) { alert('Primero elige o crea un grupo.'); return; }
  const area = document.getElementById('carga-masiva-texto');
  const res = document.getElementById('carga-masiva-resultado');
  const nombres = area.value.split(/\r?\n/).map(x => x.replace(/\s+/g, ' ').trim()).filter(Boolean);
  if (nombres.length === 0) { alert('Pega al menos un nombre.'); return; }
  const btn = document.getElementById('btn-carga-masiva');
  btn.disabled = true; btn.textContent = 'Agregando…';

  const existentes = new Set();
  try {
    const snap = await getDocs(collection(db, 'grupos', grupoActivo, 'alumnos'));
    snap.docs.forEach(d => existentes.add(slugNombre(d.data().nombre || '')));
  } catch { /* si falla, se intenta de todos modos */ }

  const agregados = [], omitidos = [];
  for (const nombre of nombres) {
    const id = slugNombre(nombre);
    if (!id) { omitidos.push(`${nombre} (nombre no válido)`); continue; }
    if (existentes.has(id)) { omitidos.push(`${nombre} (ya estaba registrado)`); continue; }
    let idFinal = id, sufijo = 2;
    while ((await getDoc(doc(db, 'grupos', grupoActivo, 'alumnos', idFinal))).exists()) { idFinal = `${id}-${sufijo}`; sufijo++; }
    const pin = generarPIN();
    try {
      await setDoc(doc(db, 'grupos', grupoActivo, 'alumnos', idFinal), { nombre, pin, creado: serverTimestamp() });
      agregados.push({ nombre, pin });
      existentes.add(id);
    } catch (err) { omitidos.push(`${nombre} (error: ${err.message || err})`); }
  }

  btn.disabled = false; btn.textContent = 'Agregar todos';
  area.value = '';
  await cargarAlumnos();
  const textoPins = agregados.map(a => `${a.nombre} — PIN ${a.pin}`).join('\n');
  res.innerHTML = `
    <p class="field-hint" style="margin-top:12px;"><strong>${agregados.length}</strong> alumno(s) agregado(s)${omitidos.length ? ` · ${omitidos.length} omitido(s)` : ''}.</p>
    ${agregados.length ? `<table style="width:100%;border-collapse:collapse;font-size:.9rem;"><thead><tr><th style="text-align:left;padding:4px;border-bottom:1px solid #ccc;">Alumno</th><th style="text-align:right;padding:4px;border-bottom:1px solid #ccc;">PIN</th></tr></thead><tbody>${agregados.map(a => `<tr><td style="padding:4px;border-bottom:1px solid #eee;">${escaparHTML(a.nombre)}</td><td style="padding:4px;border-bottom:1px solid #eee;text-align:right;font-weight:700;">${a.pin}</td></tr>`).join('')}</tbody></table>
    <button type="button" id="btn-copiar-pins" class="btn btn-ghost btn-block" style="margin-top:8px;color:inherit;border-color:#ccc;">Copiar lista de PIN</button>` : ''}
    ${omitidos.length ? `<p class="field-hint" style="margin-top:8px;">Omitidos: ${omitidos.map(escaparHTML).join('; ')}</p>` : ''}`;
  document.getElementById('btn-copiar-pins')?.addEventListener('click', async (e) => {
    try { await navigator.clipboard.writeText(textoPins); e.target.textContent = '✓ Copiada'; }
    catch { e.target.textContent = 'No se pudo copiar'; }
  });
}

async function cargarAlumnos() {
  if (!grupoActivo) return;
  const snap = await getDocs(query(collection(db, 'grupos', grupoActivo, 'alumnos'), orderBy('nombre')));
  // OJO: el id del documento va AL FINAL para que siempre gane. Antes iba
  // primero y, si el documento traía guardado un campo "id" (lo dejaba la
  // corrección de nombre), ese id VIEJO lo pisaba: el panel leía el
  // expediente del nombre anterior, ya vacío, y el alumno salía en ceros.
  alumnosCache = snap.docs.map(d => ({ ...d.data(), id: d.id }));
  renderAlumnos(alumnosCache);
  // Limpieza: se borra ese campo "id" sobrante de los alumnos que lo traigan.
  snap.docs.filter(d => 'id' in d.data()).forEach(d => {
    updateDoc(d.ref, { id: deleteField() }).catch(err => console.warn('No se pudo limpiar el campo id de', d.id, err));
  });
}

function renderAlumnos(lista) {
  const ul = document.getElementById('lista-alumnos');
  const empty = document.getElementById('alumnos-empty');
  ul.innerHTML = '';
  empty.hidden = lista.length > 0;
  lista.forEach(a => {
    const li = document.createElement('li');
    li.className = 'student-row';
    li.innerHTML = `<span class="student-name">${escaparHTML(a.nombre)}</span><span class="student-pin" title="PIN de acceso del alumno">PIN: ${escaparHTML(a.pin || '—')}</span><button type="button" class="btn-editar-student" data-id="${a.id}" title="Corregir el nombre">Editar</button><button type="button" class="btn-delete-student" data-id="${a.id}" title="Eliminar alumno">Eliminar</button>`;
    ul.appendChild(li);
  });
  ul.querySelectorAll('.btn-editar-student').forEach(btn => btn.addEventListener('click', () => editarNombreAlumno(btn.dataset.id)));
  ul.querySelectorAll('.btn-delete-student').forEach(btn => btn.addEventListener('click', () => eliminarAlumno(btn.dataset.id)));
}

async function agregarAlumno(e) {
  e.preventDefault();
  if (!grupoActivo) { alert('Primero elige o crea un grupo.'); return; }
  const input = document.getElementById('input-alumno-nombre');
  const nombre = input.value.trim();
  if (!nombre) return;
  let id = slugNombre(nombre);
  if (!id) { alert('Ese nombre no es válido.'); return; }
  let idFinal = id, sufijo = 2;
  while ((await getDoc(doc(db, 'grupos', grupoActivo, 'alumnos', idFinal))).exists()) { idFinal = `${id}-${sufijo}`; sufijo++; }
  const pin = generarPIN();
  await setDoc(doc(db, 'grupos', grupoActivo, 'alumnos', idFinal), { nombre, pin, creado: serverTimestamp() });
  input.value = '';
  await cargarAlumnos();
  alert(`Alumno agregado.\n\nDale este PIN de acceso:\n\n${nombre} → PIN ${pin}`);
}

// Subcolecciones y documentos que forman el expediente de un alumno. Si al
// corregir el nombre cambia su identificador, todo esto se muda al nuevo.
const SUBCOLECCIONES_ALUMNO = ['tareas', 'participaciones', 'asistencias', 'uniformes', 'examenes', 'externa', 'proyecto', 'intentos', 'actividades'];

// Datos del alumno para guardar, sin el campo "id" (ese es el nombre del
// documento, no un dato; si se guarda, se queda con el valor viejo).
function sinId(alumno) { const { id, ...resto } = alumno; return resto; }

async function editarNombreAlumno(alumnoId) {
  const alumno = alumnosCache.find(a => a.id === alumnoId);
  if (!alumno) return;
  const nuevo = prompt('Corrige el nombre completo del alumno:', alumno.nombre);
  if (nuevo === null) return;
  const nombre = nuevo.trim();
  if (!nombre) { alert('El nombre no puede quedar vacío.'); return; }
  if (nombre === alumno.nombre) return;

  const idNuevo = slugNombre(nombre);
  if (!idNuevo) { alert('Ese nombre no es válido.'); return; }

  // Caso sencillo: cambian acentos o mayúsculas, pero el identificador es el
  // mismo. Se corrige el texto y ya; no hay nada que mudar.
  if (idNuevo === alumnoId) {
    try { await setDoc(doc(db, 'grupos', grupoActivo, 'alumnos', alumnoId), { ...sinId(alumno), nombre, actualizado: serverTimestamp() }); }
    catch (err) { alert('No se pudo guardar: ' + (err.message || err)); return; }
    await cargarAlumnos();
    alert(`Nombre corregido a "${nombre}".`);
    return;
  }

  if ((await getDoc(doc(db, 'grupos', grupoActivo, 'alumnos', idNuevo))).exists()) {
    alert('Ya hay otro alumno con ese nombre en este grupo. Usa un nombre distinto.');
    return;
  }

  // Si el alumno está contestando un examen en este momento, su celular
  // seguiría guardando en el registro viejo y esas respuestas se perderían.
  // Se pide esperar a que entregue.
  try {
    const intentosSnap = await getDocs(collection(db, 'grupos', grupoActivo, 'alumnos', alumnoId, 'intentos'));
    const enCurso = intentosSnap.docs.filter(d => d.data().estado === 'en_curso');
    if (enCurso.length > 0) {
      alert(`${alumno.nombre} tiene un examen EN CURSO (${enCurso.map(d => ETIQUETAS_EXAMEN[d.id] || d.id).join(', ')}).\n\nEspera a que lo entregue y luego corrige el nombre. Si lo cambias ahora, sus respuestas se guardarían en el registro viejo.`);
      return;
    }
  } catch { /* si no se pudo revisar, se sigue con el aviso normal */ }

  const ok = confirm(`¿Cambiar "${alumno.nombre}" por "${nombre}"?\n\nSe moverá todo su expediente: tareas, participaciones, asistencias, exámenes, proyecto e intentos. No se pierde nada.\n\nIMPORTANTE: a partir de ahora el alumno entrará con su nombre corregido. Su PIN sigue siendo el mismo (${alumno.pin || '—'}). Avísale.`);
  if (!ok) return;

  const li = document.querySelector(`.btn-editar-student[data-id="${CSS.escape(alumnoId)}"]`)?.closest('li');
  let barra = null;
  if (li) {
    barra = document.createElement('div');
    barra.className = 'mudanza-barra';
    barra.innerHTML = '<div class="mudanza-track"><div class="mudanza-fill" style="width:0%"></div></div><span class="mudanza-texto">Preparando…</span>';
    li.appendChild(barra);
  }
  const avanzar = (pct, texto) => {
    if (!barra) return;
    barra.querySelector('.mudanza-fill').style.width = `${pct}%`;
    barra.querySelector('.mudanza-texto').textContent = texto;
  };

  const viejo = ['grupos', grupoActivo, 'alumnos', alumnoId];
  const nuevoBase = ['grupos', grupoActivo, 'alumnos', idNuevo];

  try {
    // 1) Se crea primero el alumno nuevo, conservando su PIN.
    avanzar(5, 'Creando el registro nuevo…');
    await setDoc(doc(db, ...nuevoBase), { ...sinId(alumno), nombre, creado: alumno.creado || serverTimestamp(), actualizado: serverTimestamp() });

    // 2) Se copia el expediente completo.
    const copiados = [];
    for (let i = 0; i < SUBCOLECCIONES_ALUMNO.length; i++) {
      const sub = SUBCOLECCIONES_ALUMNO[i];
      avanzar(10 + Math.round(i / SUBCOLECCIONES_ALUMNO.length * 70), `Copiando ${sub}…`);
      const snap = await getDocs(collection(db, ...viejo, sub)).catch(() => null);
      if (!snap) continue;
      for (const d of snap.docs) {
        await setDoc(doc(db, ...nuevoBase, sub, d.id), d.data());
        copiados.push([sub, d.id]);
      }
    }

    // 3) Se verifica que todo haya llegado ANTES de borrar nada.
    avanzar(85, 'Verificando…');
    for (const [sub, id] of copiados) {
      const chk = await getDoc(doc(db, ...nuevoBase, sub, id));
      if (!chk.exists()) throw new Error(`No se copió ${sub}/${id}. No se borró nada: el alumno original sigue completo.`);
    }

    // 4) Hasta aquí, el registro viejo se borra.
    avanzar(92, 'Quitando el registro anterior…');
    for (const sub of SUBCOLECCIONES_ALUMNO) {
      const snap = await getDocs(collection(db, ...viejo, sub)).catch(() => null);
      if (snap) await Promise.all(snap.docs.map(d => deleteDoc(doc(db, ...viejo, sub, d.id))));
    }
    await deleteDoc(doc(db, ...viejo));

    avanzar(100, 'Listo');
    await cargarAlumnos();
    alert(`Nombre corregido a "${nombre}".\n\nSe movieron ${copiados.length} registro(s) de su expediente. Recuérdale que ahora entra con su nombre corregido y el mismo PIN.`);
  } catch (err) {
    if (barra) barra.querySelector('.mudanza-texto').textContent = 'Error';
    alert('No se completó el cambio de nombre: ' + (err.message || err) + '\n\nEl alumno original NO se borró. Vuelve a intentarlo.');
    await cargarAlumnos();
  }
}

async function eliminarAlumno(alumnoId) {
  const alumno = alumnosCache.find(a => a.id === alumnoId);
  if (!alumno) return;
  if (!confirm(`¿Eliminar a "${alumno.nombre}"? No se puede deshacer.`)) return;
  await deleteDoc(doc(db, 'grupos', grupoActivo, 'alumnos', alumnoId));
  await cargarAlumnos();
}

// ---------- TAREAS Y PARTICIPACIÓN ----------
const CONFIG_TIPO = {
  tareas: { catalogo: 'tareas_catalogo', sub: 'tareas', parcialSelect: 'tareas-parcial', nombreInput: 'tarea-nombre', fechaInput: 'tarea-fecha', btnAgregar: 'btn-agregar-tarea', msgNueva: 'tarea-nueva-msg', listaCatalogo: 'tareas-catalogo-lista', emptyCatalogo: 'tareas-catalogo-empty', calificarWrap: 'tarea-calificar', calificarTitulo: 'tarea-calificar-titulo', calificarLista: 'tarea-calificar-lista', btnGuardarCalif: 'btn-guardar-tarea-calif', msgCalif: 'tarea-calif-msg' },
  participaciones: { catalogo: 'participaciones_catalogo', sub: 'participaciones', parcialSelect: 'part-parcial', nombreInput: 'part-nombre', fechaInput: 'part-fecha', btnAgregar: 'btn-agregar-part', msgNueva: 'part-nueva-msg', listaCatalogo: 'part-catalogo-lista', emptyCatalogo: 'part-catalogo-empty', calificarWrap: 'part-calificar', calificarTitulo: 'part-calificar-titulo', calificarLista: 'part-calificar-lista', btnGuardarCalif: 'btn-guardar-part-calif', msgCalif: 'part-calif-msg' },
};
let itemCalificandoId = { tareas: null, participaciones: null };

on('tareas-parcial', 'change', () => { cargarCatalogo('tareas'); vistaRapida('tareas', { db, grupoActivo, alumnos: alumnosCache, datosDeAlumno }); });
on('part-parcial', 'change', () => { cargarCatalogo('participaciones'); vistaRapida('participacion', { db, grupoActivo, alumnos: alumnosCache, datosDeAlumno }); });
on('btn-agregar-tarea', 'click', () => agregarItemCatalogo('tareas'));
on('btn-agregar-part', 'click', () => agregarItemCatalogo('participaciones'));
on('btn-guardar-tarea-calif', 'click', () => guardarCalificaciones('tareas'));
on('btn-guardar-part-calif', 'click', () => guardarCalificaciones('participaciones'));

async function agregarItemCatalogo(tipo) {
  const cfg = CONFIG_TIPO[tipo];
  if (!grupoActivo) { alert('Elige un grupo primero.'); return; }
  const nombre = document.getElementById(cfg.nombreInput).value.trim();
  const fecha = document.getElementById(cfg.fechaInput).value;
  const parcial = document.getElementById(cfg.parcialSelect).value;
  if (!nombre) { alert('Escribe un nombre.'); return; }
  // Aviso importante: en cuanto una tarea entra al catálogo, empieza a contar
  // para la calificación. Quien no la entregue tendrá cero en ella.
  if (tipo === 'tareas') {
    const ok = confirm(`¿Agregar la tarea "${nombre}" al ${parcial === 'p1' ? 'Parcial 1' : parcial === 'p2' ? 'Parcial 2' : 'Examen Final'}?\n\nDesde este momento cuenta para la calificación: a quien no la entregue le contará como cero en el promedio de tareas.`);
    if (!ok) return;
  }
  try {
    await addDoc(collection(db, 'grupos', grupoActivo, cfg.catalogo), { nombre, fecha, parcial, creado: serverTimestamp() });
  } catch (err) { marcarResultado(cfg.btnAgregar, cfg.msgNueva, false, '', 'No se pudo agregar: ' + (err.message || err)); return; }
  document.getElementById(cfg.nombreInput).value = '';
  marcarResultado(cfg.btnAgregar, cfg.msgNueva, true, '✓ Agregada.', '');
  cargarCatalogo(tipo);
}

async function cargarCatalogo(tipo) {
  const cfg = CONFIG_TIPO[tipo];
  const cont = document.getElementById(cfg.listaCatalogo);
  const empty = document.getElementById(cfg.emptyCatalogo);
  const calificarWrap = document.getElementById(cfg.calificarWrap);
  if (!cont) return;
  cont.innerHTML = '';
  calificarWrap.hidden = true;
  itemCalificandoId[tipo] = null;
  if (!grupoActivo) { empty.hidden = false; empty.textContent = 'Elige un grupo primero.'; return; }
  const parcial = document.getElementById(cfg.parcialSelect).value;
  let items = [];
  try {
    const snap = await getDocs(collection(db, 'grupos', grupoActivo, cfg.catalogo));
    items = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(x => x.parcial === parcial).sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));
  } catch { items = []; }
  empty.hidden = items.length > 0;
  if (items.length === 0) { empty.textContent = 'Sin registros en este parcial todavía.'; return; }
  // Nota de ayuda arriba de la lista, distinta para cada tipo.
  if (tipo === 'participaciones') {
    const nota = document.createElement('p');
    nota.className = 'field-hint';
    nota.style.margin = '0 0 10px';
    nota.textContent = 'La participación se marca con palomita: cuenta cuántas veces participó cada alumno, no con qué calificación. Desde el Parcial 2, 4 participaciones en clase dan 10 puntos; los otros 15 los dan las actividades de repaso que el alumno termina sin errores en el Aula Virtual.';
    cont.appendChild(nota);
  }
  // Para tareas, se recuerda cuántas hay: es el denominador del promedio.
  if (tipo === 'tareas') {
    const nota = document.createElement('p');
    nota.className = 'field-hint';
    nota.style.margin = '0 0 10px';
    nota.textContent = `Hay ${items.length} tarea(s) en este parcial. El promedio se saca sobre ese total: lo no entregado cuenta como cero.`;
    cont.appendChild(nota);
  }
  items.forEach(item => {
    const row = document.createElement('button');
    row.type = 'button'; row.className = 'asis-row';
    row.innerHTML = `<span class="student-name">${escaparHTML(item.nombre)}${item.fecha ? ` <small class="res-extra">(${escaparHTML(item.fecha)})</small>` : ''}</span><span class="asis-estado-label">Calificar →</span>`;
    row.addEventListener('click', () => calificarItem(tipo, item));
    cont.appendChild(row);
  });
}

async function calificarItem(tipo, item) {
  const cfg = CONFIG_TIPO[tipo];
  itemCalificandoId[tipo] = item.id;
  document.getElementById(cfg.calificarWrap).hidden = false;
  document.getElementById(cfg.calificarTitulo).textContent = `Calificar: ${item.nombre}`;
  const cont = document.getElementById(cfg.calificarLista);
  cont.innerHTML = '<p class="empty-inline">Cargando…</p>';
  const valores = {};
  await Promise.all(alumnosCache.map(async (a) => {
    try { const snap = await getDoc(doc(db, 'grupos', grupoActivo, 'alumnos', a.id, cfg.sub, item.id)); valores[a.id] = snap.exists() ? snap.data().calificacion : ''; }
    catch { valores[a.id] = ''; }
  }));

  // La PARTICIPACIÓN se registra con palomita, no con número: lo que cuenta
  // es cuántas veces participó cada quien contra la meta del parcial, no qué
  // tan bien lo hizo. Las TAREAS sí se califican de 0 a 10.
  const esParticipacion = tipo === 'participaciones';

  cont.innerHTML = `<div class="quiz-actions" style="margin-bottom:12px; display:flex; gap:8px;"><button type="button" class="btn btn-ghost-dark btn-small" data-accion="marcar-diez">${esParticipacion ? 'Marcar a todos' : 'Marcar todos con 10'}</button><button type="button" class="btn btn-ghost-dark btn-small" data-accion="limpiar-todos">${esParticipacion ? 'Quitar a todos (nadie participó)' : 'Limpiar todos'}</button></div>`;
  const filasCont = document.createElement('div');
  filasCont.id = `${cfg.calificarLista}-filas`;
  cont.appendChild(filasCont);
  alumnosCache.forEach(a => {
    const row = document.createElement('div');
    row.className = 'ens-row'; row.dataset.alumnoId = a.id;
    if (esParticipacion) {
      const marcado = valores[a.id] !== '' && valores[a.id] !== undefined && valores[a.id] !== null;
      row.innerHTML = `<label class="part-check" style="display:flex; align-items:center; gap:10px; width:100%; cursor:pointer;"><input type="checkbox" class="part-input" ${marcado ? 'checked' : ''} style="width:22px; height:22px; flex:none;"><span class="student-name">${escaparHTML(a.nombre)}</span></label>`;
    } else {
      row.innerHTML = `<span class="student-name">${escaparHTML(a.nombre)}</span><input type="number" min="0" max="10" step="0.1" class="calif-input" value="${valores[a.id] ?? ''}" placeholder="0-10"><textarea class="proy-comentario" rows="2" placeholder="Comentarios para el alumno: qué salió bien y qué debe corregir (lo verá en Mi progreso)">${escaparHTML(comentarios[a.id] || '')}</textarea>`;
    }
    filasCont.appendChild(row);
  });
  cont.querySelector('[data-accion="marcar-diez"]').addEventListener('click', () => {
    if (esParticipacion) filasCont.querySelectorAll('.part-input').forEach(inp => { inp.checked = true; });
    else filasCont.querySelectorAll('.calif-input').forEach(inp => { inp.value = '10'; });
  });
  cont.querySelector('[data-accion="limpiar-todos"]').addEventListener('click', () => {
    if (!confirm('¿Vaciar la captura de todos los alumnos para esta actividad?')) return;
    if (esParticipacion) filasCont.querySelectorAll('.part-input').forEach(inp => { inp.checked = false; });
    else filasCont.querySelectorAll('.calif-input').forEach(inp => { inp.value = ''; });
  });
  document.getElementById(cfg.calificarWrap).scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function guardarCalificaciones(tipo) {
  const cfg = CONFIG_TIPO[tipo];
  const itemId = itemCalificandoId[tipo];
  if (!grupoActivo || !itemId) { alert('Elige una tarea o actividad primero.'); return; }
  let item;
  try { const snap = await getDoc(doc(db, 'grupos', grupoActivo, cfg.catalogo, itemId)); item = snap.data(); } catch { alert('No se pudo leer la tarea.'); return; }
  const filas = document.querySelectorAll(`#${cfg.calificarLista} .ens-row`);
  const escrituras = [];
  const esParticipacion = tipo === 'participaciones';
  filas.forEach(row => {
    const alumnoId = row.dataset.alumnoId;
    const ref = doc(db, 'grupos', grupoActivo, 'alumnos', alumnoId, cfg.sub, itemId);
    if (esParticipacion) {
      // Palomita puesta = participó. Se guarda con calificación 10 para que
      // los listados y el rubro combinado del Final la cuenten completa.
      const check = row.querySelector('.part-input');
      if (check && check.checked) {
        escrituras.push(setDoc(ref, { parcial: item.parcial, nombre: item.nombre, fecha: item.fecha, calificacion: 10, actualizado: serverTimestamp() }));
      } else {
        escrituras.push(deleteDoc(ref).catch(() => {}));
      }
      return;
    }
    const input = row.querySelector('.calif-input');
    if (input.value === '') { escrituras.push(deleteDoc(ref).catch(() => {})); }
    else {
      const calificacion = parseFloat(input.value);
      escrituras.push(setDoc(ref, { parcial: item.parcial, nombre: item.nombre, fecha: item.fecha, calificacion, actualizado: serverTimestamp() }));
    }
  });
  try { await Promise.all(escrituras); } catch (err) { marcarResultado(cfg.btnGuardarCalif, cfg.msgCalif, false, '', 'No se pudo guardar: ' + (err.message || err)); return; }
  marcarResultado(cfg.btnGuardarCalif, cfg.msgCalif, true, '✓ Calificaciones guardadas.', '');
}

// ---------- ASISTENCIA ----------
let asistenciaEstados = {};
on('asis-fecha', 'change', cargarAsistencia);
on('asis-parcial', 'change', () => { cargarAsistencia(); vistaRapida('asistencia', { db, grupoActivo, alumnos: alumnosCache, datosDeAlumno }); });
on('btn-guardar-asistencia', 'click', guardarAsistencia);
const _hoy = new Date();
const elFecha = document.getElementById('asis-fecha');
if (elFecha) elFecha.valueAsDate = _hoy;

async function cargarAsistencia() {
  const cont = document.getElementById('asistencia-lista');
  const empty = document.getElementById('asistencia-empty');
  cont.innerHTML = '';
  if (!grupoActivo) { empty.hidden = false; empty.textContent = 'Elige un grupo primero.'; return; }
  if (alumnosCache.length === 0) { empty.hidden = false; empty.textContent = 'Este grupo aún no tiene alumnos.'; return; }
  empty.hidden = true;
  const fecha = document.getElementById('asis-fecha').value;
  asistenciaEstados = {};
  await Promise.all(alumnosCache.map(async (a) => {
    try { const ref = doc(db, 'grupos', grupoActivo, 'alumnos', a.id, 'asistencias', fecha); const snap = await getDoc(ref); asistenciaEstados[a.id] = snap.exists() ? snap.data().estado : 'presente'; }
    catch { asistenciaEstados[a.id] = 'presente'; }
  }));
  renderAsistenciaLista();
}

function renderAsistenciaLista() {
  const cont = document.getElementById('asistencia-lista');
  cont.innerHTML = '';
  alumnosCache.forEach(a => {
    const estado = asistenciaEstados[a.id] || 'presente';
    const row = document.createElement('button');
    row.type = 'button'; row.className = `asis-row asis-${estado}`;
    row.innerHTML = `<span class="asis-dot"></span><span class="student-name">${escaparHTML(a.nombre)}</span><span class="asis-estado-label">${ETIQUETA_ESTADO[estado]}</span>`;
    row.addEventListener('click', () => { asistenciaEstados[a.id] = CICLO_ESTADO[estado]; renderAsistenciaLista(); });
    cont.appendChild(row);
  });
}

async function guardarAsistencia() {
  if (!grupoActivo) { alert('Elige un grupo primero.'); return; }
  const fecha = document.getElementById('asis-fecha').value;
  const parcial = document.getElementById('asis-parcial').value;
  if (!fecha) { alert('Elige una fecha.'); return; }
  try {
    await Promise.all(alumnosCache.map(a => {
      const ref = doc(db, 'grupos', grupoActivo, 'alumnos', a.id, 'asistencias', fecha);
      return setDoc(ref, { estado: asistenciaEstados[a.id] || 'presente', fecha, parcial, actualizado: serverTimestamp() });
    }));
  } catch (err) { marcarResultado('btn-guardar-asistencia', 'asis-msg', false, '', 'No se pudo guardar: ' + (err.message || err)); return; }
  marcarResultado('btn-guardar-asistencia', 'asis-msg', true, '✓ Asistencia guardada.', '');
}

// ---------- UNIFORMES ----------
on('unif-parcial', 'change', cargarUniformes);
on('btn-guardar-uniformes', 'click', guardarUniformes);

async function cargarUniformes() {
  const cont = document.getElementById('uniformes-lista');
  const empty = document.getElementById('uniformes-empty');
  cont.innerHTML = '';
  if (!grupoActivo) { empty.hidden = false; empty.textContent = 'Elige un grupo primero.'; return; }
  if (alumnosCache.length === 0) { empty.hidden = false; empty.textContent = 'Este grupo aún no tiene alumnos.'; return; }
  empty.hidden = true;
  const parcial = document.getElementById('unif-parcial').value;
  const valores = {};
  await Promise.all(alumnosCache.map(async (a) => {
    try { const snap = await getDoc(doc(db, 'grupos', grupoActivo, 'alumnos', a.id, 'uniformes', parcial)); valores[a.id] = snap.exists() ? (snap.data().faltas ?? 0) : 0; }
    catch { valores[a.id] = 0; }
  }));
  alumnosCache.forEach(a => {
    const row = document.createElement('div');
    row.className = 'ens-row'; row.dataset.alumnoId = a.id;
    row.innerHTML = `<span class="student-name">${escaparHTML(a.nombre)}</span><input type="number" min="0" step="1" class="calif-input" value="${valores[a.id]}" placeholder="Faltas">`;
    cont.appendChild(row);
  });
}

async function guardarUniformes() {
  if (!grupoActivo) { alert('Elige un grupo primero.'); return; }
  const parcial = document.getElementById('unif-parcial').value;
  const filas = document.querySelectorAll('#uniformes-lista .ens-row');
  const escrituras = [];
  filas.forEach(row => {
    const alumnoId = row.dataset.alumnoId;
    const input = row.querySelector('.calif-input');
    const faltas = input.value === '' ? 0 : parseInt(input.value, 10);
    escrituras.push(setDoc(doc(db, 'grupos', grupoActivo, 'alumnos', alumnoId, 'uniformes', parcial), { faltas, actualizado: serverTimestamp() }));
  });
  try { await Promise.all(escrituras); } catch (err) { marcarResultado('btn-guardar-uniformes', 'unif-msg', false, '', 'No se pudo guardar: ' + (err.message || err)); return; }
  marcarResultado('btn-guardar-uniformes', 'unif-msg', true, '✓ Uniformes guardados.', '');
}

// ---------- EXAMEN PRÁCTICO (solo Parcial 2) ----------
// La pestaña del examen práctico se captura únicamente desde la vista rápida
// de arriba. El bloque de abajo (una fila por alumno) quedó duplicado, así que
// se oculta en lugar de borrarlo del HTML, para no romper nada que lo busque.
function ocultarCapturaPracticoAntigua() {
  ['practico-lista', 'practico-empty', 'btn-guardar-practico', 'practico-msg']
    .forEach(id => { const el = document.getElementById(id); if (el) el.hidden = true; });
  // El texto de ayuda de esa sección también sobra: la vista rápida trae el suyo.
  const panel = document.getElementById('tab-practico');
  const ayuda = panel && panel.querySelector(':scope > .field-hint');
  if (ayuda) ayuda.hidden = true;
}
document.addEventListener('DOMContentLoaded', ocultarCapturaPracticoAntigua);

async function cargarPractico() {
  const cont = document.getElementById('practico-lista');
  const empty = document.getElementById('practico-empty');
  cont.innerHTML = '';
  if (!grupoActivo) { empty.hidden = false; empty.textContent = 'Elige un grupo primero.'; return; }
  if (alumnosCache.length === 0) { empty.hidden = false; empty.textContent = 'Este grupo aún no tiene alumnos.'; return; }
  empty.hidden = true;
  const valores = {};
  await Promise.all(alumnosCache.map(async (a) => {
    try { const snap = await getDoc(doc(db, 'grupos', grupoActivo, 'alumnos', a.id, 'practico', 'p2')); valores[a.id] = snap.exists() ? snap.data().calificacion : ''; }
    catch { valores[a.id] = ''; }
  }));
  alumnosCache.forEach(a => {
    const row = document.createElement('div');
    row.className = 'ens-row'; row.dataset.alumnoId = a.id;
    row.innerHTML = `<span class="student-name">${escaparHTML(a.nombre)}</span><input type="number" min="0" max="10" step="0.1" class="calif-input" value="${valores[a.id] ?? ''}" placeholder="0-10"><textarea class="proy-comentario" rows="2" placeholder="Comentarios para el alumno: qué salió bien y qué debe corregir (lo verá en Mi progreso)">${escaparHTML(comentarios[a.id] || '')}</textarea>`;
    cont.appendChild(row);
  });
}

async function guardarPractico() {
  if (!grupoActivo) { alert('Elige un grupo primero.'); return; }
  const filas = document.querySelectorAll('#practico-lista .ens-row');
  const escrituras = [];
  filas.forEach(row => {
    const alumnoId = row.dataset.alumnoId;
    const input = row.querySelector('.calif-input');
    const calificacion = input.value === '' ? null : parseFloat(input.value);
    escrituras.push(setDoc(doc(db, 'grupos', grupoActivo, 'alumnos', alumnoId, 'practico', 'p2'), { calificacion, actualizado: serverTimestamp() }));
  });
  try { await Promise.all(escrituras); } catch (err) { marcarResultado('btn-guardar-practico', 'practico-msg', false, '', 'No se pudo guardar: ' + (err.message || err)); return; }
  marcarResultado('btn-guardar-practico', 'practico-msg', true, '✓ Examen práctico guardado.', '');
}

// ---------- PROYECTO: MI PLATO, MI HISTORIA ----------
const ENTREGAS_PROYECTO = ['entrega1', 'entrega2', 'entregaFinal'];
ENTREGAS_PROYECTO.forEach(entrega => { on(`btn-guardar-${entrega}`, 'click', () => guardarEntregaProyecto(entrega)); });

async function cargarProyecto() {
  const empty = document.getElementById('proyecto-empty');
  if (!grupoActivo) { empty.hidden = false; empty.textContent = 'Elige un grupo primero.'; return; }
  if (alumnosCache.length === 0) { empty.hidden = false; empty.textContent = 'Este grupo aún no tiene alumnos.'; return; }
  empty.hidden = true;
  cargarAvanceTaller();
  for (const entrega of ENTREGAS_PROYECTO) { await cargarEntregaProyecto(entrega); }
}

// ---- Avance en el Taller del investigador (grupos/{g}/alumnos/{a}/investigacion/taller)
let TALLER_DATA = null;
async function cargarAvanceTaller() {
  const cont = document.getElementById('taller-avance');
  if (!cont) return;
  cont.innerHTML = '<p class="empty-inline">Cargando…</p>';
  try { TALLER_DATA = TALLER_DATA || await fetch('data/taller.json').then(r => r.json()); } catch { cont.innerHTML = '<p class="empty-inline">No se pudo cargar el taller.</p>'; return; }
  const totales = {}; TALLER_DATA.preguntas.forEach(p => { totales[p.entrega] = (totales[p.entrega] || 0) + 1; });
  const filas = await Promise.all(alumnosCache.map(async a => {
    try { const s = await getDoc(doc(db, 'grupos', grupoActivo, 'alumnos', a.id, 'investigacion', 'taller')); return [a, s.exists() ? s.data() : null]; }
    catch { return [a, null]; }
  }));
  const fecha = t => t && t.toDate ? t.toDate().toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
  const N = { P: 'Positivista', I: 'Interpretativo', S: 'Sociocrítico', M: 'Mixto' };
  const empezaron = filas.filter(([, d]) => d).length;
  cont.innerHTML = `<p class="field-hint"><b>${empezaron} de ${filas.length}</b> alumnos ya entraron al taller.</p>
    <div class="taller-tabla-wrap"><table class="taller-tabla"><thead><tr><th>Alumno</th><th>Pregunta de investigación</th><th>Etapas</th><th>E1</th><th>E2</th><th>Final</th><th>Última vez</th><th></th></tr></thead><tbody>
    ${filas.map(([a, d]) => {
      if (!d) return `<tr class="sin"><td>${escaparHTML(a.nombre)}</td><td colspan="7"><i>Aún no entra al taller</i></td></tr>`;
      const av = d.avance || {}, r = av.respuestas || {}, et = (av.etapas || []).filter(Boolean).length;
      const c = k => `<td class="${(r[k] || 0) === totales[k] ? 'ok' : ''}">${r[k] || 0}/${totales[k]}</td>`;
      return `<tr><td>${escaparHTML(a.nombre)}</td><td class="preg">${escaparHTML(d.pregunta || '—')}${d.paradigma ? `<br><small>${N[d.paradigma] || ''}</small>` : ''}</td><td>${et}/6</td>${c('entrega1')}${c('entrega2')}${c('entregaFinal')}<td>${fecha(d.actualizado)}</td><td><button type="button" class="btn btn-small taller-ver" data-id="${a.id}">Ver</button></td></tr>
        <tr class="taller-det" id="tdet-${a.id}" hidden><td colspan="8"></td></tr>`;
    }).join('')}</tbody></table></div>`;
  const datos = Object.fromEntries(filas.map(([a, d]) => [a.id, d]));
  cont.querySelectorAll('.taller-ver').forEach(b => b.addEventListener('click', () => {
    const tr = document.getElementById('tdet-' + b.dataset.id), d = datos[b.dataset.id].datos || {};
    if (!tr.hidden) { tr.hidden = true; b.textContent = 'Ver'; return; }
    const o = d.objetivos || {}, e = x => escaparHTML(x || '—');
    const pal = t => (String(t || '').trim().match(/\S+/g) || []).length;
    tr.firstElementChild.innerHTML = `<div class="taller-detalle">
      <p><b>Tema:</b> ${e(d.tema)}</p><p><b>Problema:</b> ${e(d.problema)}</p><p><b>Pregunta:</b> ${e(d.pregunta)}</p>
      <p><b>Objetivo general:</b> ${e(o.general)}</p><p><b>Específicos:</b></p><ol>${(o.especificos || []).filter(x => x.trim()).map(x => `<li>${e(x)}</li>`).join('') || '<li>—</li>'}</ol>
      <p><b>Hipótesis o supuesto:</b> ${e(o.hipotesis)} <b>Me desmentiría que:</b> ${e(o.refutaria)}</p>
      ${(d.matriz || []).length ? `<p><b>Matriz:</b></p><ul>${d.matriz.map(f => `<li>${e(f.objetivo)} → ${e(f.tecnica)} · ${e(f.instrumento)} · ${e(f.participantes)}</li>`).join('')}</ul>` : ''}
      ${TALLER_DATA.preguntas.map(p => `<details><summary>${p.n}. ${escaparHTML(p.texto)} <small>(${pal((d.respuestas || {})[p.n])} palabras)</small></summary><p class="taller-resp">${e((d.respuestas || {})[p.n])}</p></details>`).join('')}
      ${d.guion ? `<details><summary>Guion de defensa</summary><p class="taller-resp">${e(d.guion)}</p></details>` : ''}</div>`;
    tr.hidden = false; b.textContent = 'Ocultar';
  }));
}

async function cargarEntregaProyecto(entrega) {
  const cont = document.getElementById(`proyecto-${entrega}-lista`);
  if (!cont) return;
  cont.innerHTML = '<p class="empty-inline">Cargando…</p>';
  const valores = {};
  const comentarios = {};
  await Promise.all(alumnosCache.map(async (a) => {
    try { const snap = await getDoc(doc(db, 'grupos', grupoActivo, 'alumnos', a.id, 'proyecto', entrega)); valores[a.id] = snap.exists() ? snap.data().calificacion : ''; comentarios[a.id] = snap.exists() ? (snap.data().comentario || '') : ''; }
    catch { valores[a.id] = ''; comentarios[a.id] = ''; }
  }));
  cont.innerHTML = '';
  alumnosCache.forEach(a => {
    const row = document.createElement('div');
    row.className = 'ens-row'; row.dataset.alumnoId = a.id;
    row.innerHTML = `<span class="student-name">${escaparHTML(a.nombre)}</span><input type="number" min="0" max="10" step="0.1" class="calif-input" value="${valores[a.id] ?? ''}" placeholder="0-10"><textarea class="proy-comentario" rows="2" placeholder="Comentarios para el alumno: qué salió bien y qué debe corregir (lo verá en Mi progreso)">${escaparHTML(comentarios[a.id] || '')}</textarea>`;
    cont.appendChild(row);
  });
}

async function guardarEntregaProyecto(entrega) {
  if (!grupoActivo) { alert('Elige un grupo primero.'); return; }
  const filas = document.querySelectorAll(`#proyecto-${entrega}-lista .ens-row`);
  const escrituras = [];
  filas.forEach(row => {
    const alumnoId = row.dataset.alumnoId;
    const input = row.querySelector('.calif-input');
    const calificacion = input.value === '' ? null : parseFloat(input.value);
    const comentario = (row.querySelector('.proy-comentario')?.value || '').trim();
    escrituras.push(setDoc(doc(db, 'grupos', grupoActivo, 'alumnos', alumnoId, 'proyecto', entrega), { calificacion, comentario, actualizado: serverTimestamp() }));
  });
  try { await Promise.all(escrituras); } catch (err) { marcarResultado(`btn-guardar-${entrega}`, `${entrega}-msg`, false, '', 'No se pudo guardar: ' + (err.message || err)); return; }
  marcarResultado(`btn-guardar-${entrega}`, `${entrega}-msg`, true, '✓ Guardado.', '');
}

// ---------- EXAMEN EN LÍNEA ----------
let examenesAbiertos = [];
on('btn-guardar-examenes-abiertos', 'click', guardarExamenesAbiertos);
on('enlinea-parcial', 'change', cargarIntentos);

async function cargarExamenesAbiertos() {
  const cont = document.getElementById('examenes-abiertos-lista');
  if (!cont) return;
  if (!grupoActivo) { cont.innerHTML = '<p class="empty-inline">Elige un grupo primero.</p>'; return; }
  try { const snap = await getDoc(doc(db, 'grupos', grupoActivo, 'config', 'examenes')); examenesAbiertos = snap.exists() && Array.isArray(snap.data().abiertos) ? snap.data().abiertos : []; }
  catch { examenesAbiertos = []; }
  renderExamenesAbiertos();
}

function renderExamenesAbiertos() {
  const cont = document.getElementById('examenes-abiertos-lista');
  cont.innerHTML = '';
  PARCIALES_EXAMEN.forEach(p => {
    const abierto = examenesAbiertos.includes(p);
    const row = document.createElement('button');
    row.type = 'button'; row.className = 'asis-row ' + (abierto ? 'asis-presente' : 'asis-falta');
    row.innerHTML = `<span class="asis-dot"></span><span class="student-name">${ETIQUETAS_EXAMEN[p]}</span><span class="asis-estado-label">${abierto ? 'Abierto' : 'Cerrado'}</span>`;
    row.addEventListener('click', () => { examenesAbiertos = abierto ? examenesAbiertos.filter(x => x !== p) : [...examenesAbiertos, p]; renderExamenesAbiertos(); });
    cont.appendChild(row);
  });
}

async function guardarExamenesAbiertos() {
  if (!grupoActivo) { alert('Elige un grupo primero.'); return; }
  try { await setDoc(doc(db, 'grupos', grupoActivo, 'config', 'examenes'), { abiertos: examenesAbiertos, actualizado: serverTimestamp() }, { merge: true }); }
  catch (err) { marcarResultado('btn-guardar-examenes-abiertos', 'abiertos-msg', false, '', 'No se pudo guardar: ' + (err.message || err)); return; }
  marcarResultado('btn-guardar-examenes-abiertos', 'abiertos-msg', true, '✓ Guardado.', '');
}

// La tabla se mantiene EN VIVO: cada alumno tiene dos "escuchas" (su intento
// y su calificación de examen) y, en cuanto algo cambia en la base de datos,
// su fila se vuelve a pintar sola. No hace falta recargar la página.
let intentosSubs = [];
let intentosReloj = null;
let intentosPintado = null;
let intentosSesion = 0;

function detenerIntentosEnVivo() {
  intentosSubs.forEach(u => { try { u(); } catch { /* nada */ } });
  intentosSubs = [];
  clearInterval(intentosReloj); intentosReloj = null;
  clearTimeout(intentosPintado); intentosPintado = null;
  intentosSesion++;
}

const ESTADO_EXAMEN = {
  sin:       { texto: 'Sin iniciar', clase: 'mz-ex-sin' },
  en_curso:  { texto: 'En curso',    clase: 'mz-ex-curso' },
  bloqueado: { texto: 'Bloqueado',   clase: 'mz-ex-bloq' },
  entregado: { texto: 'Entregado',   clase: 'mz-ex-ok' },
};

// Tiempo restante de un intento en curso, con la misma cuenta que usa el
// examen del alumno (incluye pausas por reapertura y minutos extra).
function minutosRestantes(est) {
  const base = est.segundosAlPausar ?? ((est.minutos || 60) * 60);
  const desde = est.reanudadoEn || est.iniciado;
  if (!desde) return null;
  const seg = base + (est.minutosExtra || 0) * 60 - Math.floor((Date.now() - desde) / 1000);
  return Math.max(0, Math.ceil(seg / 60));
}

function filaIntentoHTML(parcial, { alumno, est, examenDoc }) {
  const clave = !est ? 'sin' : (est.estado || 'en_curso');
  const info = ESTADO_EXAMEN[clave] || ESTADO_EXAMEN.en_curso;
  let calif = '—', aciertos = '—', salidas = '—', acciones = '';

  if (clave === 'entregado') {
    calif = `${Number(est.calificacion ?? 0).toFixed(1)} / 10`;
    aciertos = `${est.aciertos}/${est.total}${est.automatico ? ' ⏱' : ''}`;
    salidas = est.salidas ? String(est.salidas) : '0';
    acciones = `<button type="button" class="mz-btn" data-descargar-examen="${alumno.id}">PDF</button><button type="button" class="mz-btn" data-reabrir-entregado="${alumno.id}" title="Vuelve a abrir el examen con sus respuestas guardadas y el tiempo que tú indiques">Reabrir</button>`;
  } else if (clave === 'bloqueado') {
    aciertos = `${Object.keys(est.respuestas || {}).length}/${(est.ids || []).length}`;
    salidas = String(est.salidas || 1);
    acciones = `<button type="button" class="mz-btn mz-btn-fuerte" data-reabrir="${alumno.id}">Reabrir</button><button type="button" class="mz-btn" data-extra="${alumno.id}">+ min</button>`;
  } else if (clave === 'en_curso') {
    const restante = minutosRestantes(est);
    calif = restante === null ? 'en curso' : `~${restante} min`;
    aciertos = `${Object.keys(est.respuestas || {}).length}/${(est.ids || []).length}`;
    salidas = String(est.salidas || 0);
    acciones = `<button type="button" class="mz-btn" data-extra="${alumno.id}">+ min</button>`;
  }

  // Permiso individual: sirve cuando el examen está cerrado para el grupo
  // (alumno que faltó o que se le reabrió). Si el examen está abierto para
  // todos, no hace falta.
  if (!examenesAbiertos.includes(parcial)) {
    const tiene = permisoIndividual(parcial).includes(alumno.id);
    acciones += tiene
      ? `<button type="button" class="mz-btn mz-btn-fuerte" data-permiso-quitar="${alumno.id}" title="Solo este alumno puede entrar a este examen, aunque esté cerrado para el grupo">Habilitado ✓</button>`
      : `<button type="button" class="mz-btn" data-permiso-dar="${alumno.id}" title="Abre este examen solo para este alumno">Habilitar</button>`;
  }

  // El Diagnóstico no tiene calificación oficial que ajustar.
  const esAjusteManual = examenDoc && examenDoc.origen && examenDoc.origen !== 'examen en línea';
  if (parcial !== 'diag') {
    if (esAjusteManual) calif = `${Number(examenDoc.calificacion).toFixed(1)} / 10 ✎`;
    acciones += `<button type="button" class="mz-btn" data-ajustar-examen="${alumno.id}">Ajustar</button>`;
  }

  return `
    <tr>
      <th class="mz-col-nombre" scope="row" title="${escaparHTML(alumno.nombre)}"><span class="mz-nombre-txt">${escaparHTML(alumno.nombre)}</span></th>
      <td class="mz-celda"><span class="mz-ex-chip ${info.clase}">${info.texto}</span></td>
      <td class="mz-celda mz-ex-dato"${esAjusteManual ? ' title="Calificación ajustada a mano por el docente"' : ''}>${calif}</td>
      <td class="mz-celda mz-ex-dato">${aciertos}</td>
      <td class="mz-celda mz-ex-dato">${salidas}</td>
      <td class="mz-celda mz-ex-acciones">${acciones || '—'}</td>
    </tr>`;
}

// Concentrado grupal por sección — solo para el Examen Diagnóstico.
// Usa las categorías codificadas en el id de cada reactivo
// (diag-a.. = Cultura filosófica y científica, diag-b.. = Metodología de
// la investigación, diag-c.. = Comprensión lectora, diag-d.. = Argumentación
// y pensamiento crítico, diag-e.. = Vocabulario pedagógico).
function pintarConcentradoDiag(contConcentrado, filas, bancoDiag) {
  const NOMBRE_CATEGORIA = {
    a: 'Cultura filosófica y científica general',
    b: 'Metodología de la investigación',
    c: 'Comprensión lectora',
    d: 'Argumentación y pensamiento crítico',
    e: 'Vocabulario pedagógico',
  };
  const categoriaDe = {};
  bancoDiag.reactivos.forEach(r => { categoriaDe[r.id] = (r.id.split('-')[1] || '')[0]; });
  const correctasPorCat = { a: 0, b: 0, c: 0, d: 0, e: 0 };
  const totalPorCat = { a: 0, b: 0, c: 0, d: 0, e: 0 };
  let entregados = 0, sumaCalif = 0;
  filas.forEach(({ est }) => {
    if (est && est.estado === 'entregado' && Array.isArray(est.detalle)) {
      entregados++;
      sumaCalif += Number(est.calificacion) || 0;
      est.detalle.forEach(d => {
        const cat = categoriaDe[d.id];
        if (!cat || !(cat in totalPorCat)) return;
        totalPorCat[cat]++;
        if (d.correcto) correctasPorCat[cat]++;
      });
    }
  });
  if (entregados === 0) {
    contConcentrado.innerHTML = '<h4>Concentrado grupal — Examen Diagnóstico</h4><p class="empty-inline">Todavía nadie ha entregado este examen.</p>';
    return;
  }
  const filasCategoria = Object.keys(NOMBRE_CATEGORIA).map(cat => {
    const pct = totalPorCat[cat] ? (correctasPorCat[cat] / totalPorCat[cat] * 100) : 0;
    return `<div class="res-row"><span>${NOMBRE_CATEGORIA[cat]}</span><strong>${pct.toFixed(0)}% de aciertos</strong></div>`;
  }).join('');
  contConcentrado.innerHTML = `
    <h4>Concentrado grupal — Examen Diagnóstico</h4>
    <div class="res-row"><span>Alumnos que entregaron</span><strong>${entregados} de ${filas.length}</strong></div>
    <div class="res-row"><span>Promedio general del grupo</span><strong>${(sumaCalif / entregados).toFixed(1)} / 10</strong></div>
    ${filasCategoria}
    <p class="field-hint" style="margin-top:10px;">Porcentaje de aciertos promedio por sección, considerando solo a quienes ya entregaron.</p>`;
}

async function cargarIntentos() {
  detenerIntentosEnVivo();
  const sesion = intentosSesion;
  const cont = document.getElementById('intentos-lista');
  const empty = document.getElementById('intentos-empty');
  if (!cont) return;
  cont.innerHTML = '';
  if (!grupoActivo) { empty.hidden = false; empty.textContent = 'Elige un grupo primero.'; return; }

  // Lista de alumnos recién leída, por si un nombre se corrigió en otro lado.
  try { await cargarAlumnos(); } catch { /* se usa la que ya está */ }
  if (sesion !== intentosSesion) return; // se cambió de pestaña o de examen mientras cargaba
  if (alumnosCache.length === 0) { empty.hidden = false; empty.textContent = 'Este grupo aún no tiene alumnos.'; return; }
  empty.hidden = true;
  const parcial = document.getElementById('enlinea-parcial').value;
  const grupo = grupoActivo;

  let btnTodos = document.getElementById('btn-descargar-examenes-grupo');
  if (!btnTodos) {
    btnTodos = document.createElement('button');
    btnTodos.id = 'btn-descargar-examenes-grupo'; btnTodos.type = 'button'; btnTodos.className = 'btn btn-ghost-dark btn-small'; btnTodos.style.marginBottom = '14px';
    cont.parentNode.insertBefore(btnTodos, cont);
  }
  btnTodos.textContent = `Descargar todos los exámenes de ${ETIQUETAS_EXAMEN[parcial]} (PDF)`;
  btnTodos.onclick = () => descargarExamenesGrupo(parcial);

  let contConcentrado = document.getElementById('concentrado-diag-grupal');
  let bancoDiag = null;
  if (parcial === 'diag') {
    if (!contConcentrado) {
      contConcentrado = document.createElement('div');
      contConcentrado.id = 'concentrado-diag-grupal';
      contConcentrado.className = 'res-card';
      contConcentrado.style.marginBottom = '14px';
      cont.parentNode.insertBefore(contConcentrado, cont);
    }
    contConcentrado.innerHTML = '<p class="empty-inline">Calculando concentrado grupal…</p>';
    try { bancoDiag = await cargarBancoExamen('diag'); }
    catch (err) { contConcentrado.innerHTML = `<p class="empty-inline">No se pudo calcular el concentrado: ${err.message || err}</p>`; }
    if (sesion !== intentosSesion) return;
  } else if (contConcentrado) {
    contConcentrado.remove(); contConcentrado = null;
  }

  // Estructura fija de la tabla; solo el cuerpo se repinta.
  cont.innerHTML = `
    <span class="en-vivo" id="intentos-en-vivo">En vivo — se actualiza solo</span>
    <div style="margin:10px 0;"><button type="button" class="btn btn-secondary" id="btn-tiempo-grupo">Dar más tiempo a todos los que no terminaron</button>
    <p class="field-hint" style="margin-top:6px;">Reabre, con los minutos que indiques, a todos los que no terminaron: todos los que lo abrieron y no contestaron todas las preguntas: los que se quedaron sin tiempo (⏱), los bloqueados, los que siguen en curso y los que lo entregaron incompleto o en blanco. Conservan sus respuestas. Quien contestó todo no se toca.</p></div>
    <div class="mz-scroll">
      <table class="mz-tabla">
        <thead>
          <tr>
            <th class="mz-col-nombre">Alumno</th>
            <th class="mz-col-act"><span class="mz-col-tit">Estado</span></th>
            <th class="mz-col-act"><span class="mz-col-tit">Calificación</span><span class="mz-col-sub">o tiempo</span></th>
            <th class="mz-col-act"><span class="mz-col-tit">Aciertos</span></th>
            <th class="mz-col-act"><span class="mz-col-tit">Salidas</span></th>
            <th class="mz-col-act mz-col-ancha"><span class="mz-col-tit">Acciones</span></th>
          </tr>
        </thead>
        <tbody id="intentos-tbody"><tr><td colspan="6" class="mz-celda">Cargando…</td></tr></tbody>
      </table>
    </div>
    <p class="field-hint" style="margin-top:10px;">Desliza la tabla de lado para ver todas las columnas. El reloj ⏱ marca que se entregó por tiempo agotado, y el lápiz ✎ que la calificación se ajustó a mano.</p>`;

  await cargarPermisos();
  const filas = alumnosCache.map(alumno => ({ alumno, est: null, examenDoc: null }));
  const btnGrupo = document.getElementById('btn-tiempo-grupo');
  if (btnGrupo) btnGrupo.addEventListener('click', () => darTiempoAlGrupo(parcial, filas));
  const porId = new Map(filas.map(f => [f.alumno.id, f]));
  let pendientesIniciales = filas.length * 2;

  const pintar = () => {
    if (sesion !== intentosSesion) return;
    const tbody = document.getElementById('intentos-tbody');
    if (!tbody) return;
    tbody.innerHTML = filas.map(f => filaIntentoHTML(parcial, f)).join('');
    tbody.querySelectorAll('[data-reabrir]').forEach(b => b.addEventListener('click', () => reabrirExamen(b.dataset.reabrir, parcial)));
    tbody.querySelectorAll('[data-extra]').forEach(b => b.addEventListener('click', () => darTiempoExtra(b.dataset.extra, parcial)));
    tbody.querySelectorAll('[data-permiso-dar]').forEach(b => b.addEventListener('click', async () => { await cambiarPermiso(parcial, b.dataset.permisoDar, true); pintar(); }));
    tbody.querySelectorAll('[data-permiso-quitar]').forEach(b => b.addEventListener('click', async () => { await cambiarPermiso(parcial, b.dataset.permisoQuitar, false); pintar(); }));
    tbody.querySelectorAll('[data-reabrir-entregado]').forEach(b => b.addEventListener('click', () => reabrirEntregado(b.dataset.reabrirEntregado, parcial)));
    tbody.querySelectorAll('[data-descargar-examen]').forEach(b => b.addEventListener('click', () => descargarExamenAlumno(b.dataset.descargarExamen, parcial)));
    tbody.querySelectorAll('[data-ajustar-examen]').forEach(b => b.addEventListener('click', () => ajustarCalificacionExamen(b.dataset.ajustarExamen, parcial)));
    if (contConcentrado && bancoDiag) pintarConcentradoDiag(contConcentrado, filas, bancoDiag);
  };
  // Varias actualizaciones seguidas (por ejemplo, 27 alumnos entrando a la
  // vez) se juntan en un solo repintado.
  const programarPintado = () => {
    if (pendientesIniciales > 0) return; // se pinta todo junto cuando llegó lo primero
    clearTimeout(intentosPintado);
    intentosPintado = setTimeout(pintar, 250);
  };
  const marcarConexion = (ok) => {
    const el = document.getElementById('intentos-en-vivo');
    if (!el) return;
    el.classList.toggle('sin-conexion', !ok);
    el.textContent = ok ? 'En vivo — se actualiza solo' : 'Sin conexión en vivo — recarga la página';
  };

  filas.forEach(f => {
    const base = ['grupos', grupo, 'alumnos', f.alumno.id];
    let primeraIntento = true, primeraExamen = true;
    const llegoPrimera = () => {
      pendientesIniciales--;
      if (pendientesIniciales === 0) pintar();
    };
    intentosSubs.push(onSnapshot(doc(db, ...base, 'intentos', parcial), snap => {
      const fila = porId.get(f.alumno.id); if (!fila) return;
      fila.est = snap.exists() ? snap.data() : null;
      marcarConexion(true);
      if (primeraIntento) { primeraIntento = false; llegoPrimera(); } else programarPintado();
    }, err => {
      console.warn('[en vivo] intento', f.alumno.id, err);
      marcarConexion(false);
      if (primeraIntento) { primeraIntento = false; llegoPrimera(); }
    }));
    intentosSubs.push(onSnapshot(doc(db, ...base, 'examenes', parcial), snap => {
      const fila = porId.get(f.alumno.id); if (!fila) return;
      fila.examenDoc = snap.exists() ? snap.data() : null;
      if (primeraExamen) { primeraExamen = false; llegoPrimera(); } else programarPintado();
    }, err => {
      console.warn('[en vivo] examen', f.alumno.id, err);
      if (primeraExamen) { primeraExamen = false; llegoPrimera(); }
    }));
  });

  // El tiempo restante de quienes están contestando se recalcula cada 30 s.
  intentosReloj = setInterval(() => {
    if (filas.some(f => f.est && f.est.estado === 'en_curso')) programarPintado();
  }, 30000);
}

let bancosExamenCache = {};
async function cargarBancoExamen(parcial) {
  if (bancosExamenCache[parcial]) return bancosExamenCache[parcial];
  // El Diagnóstico vive en un archivo con nombre distinto al patrón
  // examen_{parcial}.json de los demás parciales.
  const archivo = parcial === 'diag' ? 'data/examen_diagnostico.json' : `data/examen_${parcial}.json`;
  const res = await fetch(archivo, { cache: 'no-store' });
  if (!res.ok) throw new Error(`No se encontró el banco de reactivos de ${ETIQUETAS_EXAMEN[parcial]} (HTTP ${res.status})`);
  const banco = await res.json();
  bancosExamenCache[parcial] = banco;
  return banco;
}

async function descargarExamenAlumno(alumnoId, parcial) {
  const alumno = alumnosCache.find(a => a.id === alumnoId);
  if (!alumno) return;
  try {
    const [snap, banco] = await Promise.all([getDoc(doc(db, 'grupos', grupoActivo, 'alumnos', alumnoId, 'intentos', parcial)), cargarBancoExamen(parcial)]);
    if (!snap.exists()) { alert('Este alumno no tiene un examen registrado en este parcial.'); return; }
    await reporteExamenAlumno({ nombreGrupo: nombreDelGrupo(), alumno, parcial, intento: snap.data(), banco });
  } catch (err) { console.error(err); alert('No se pudo generar el examen: ' + (err.message || err)); }
}

async function descargarExamenesGrupo(parcial) {
  if (!grupoActivo) { alert('Elige un grupo primero.'); return; }
  if (alumnosCache.length === 0) { alert('Este grupo no tiene alumnos.'); return; }
  const btnTodos = document.getElementById('btn-descargar-examenes-grupo');
  const textoOriginal = btnTodos ? btnTodos.textContent : '';
  if (btnTodos) { btnTodos.disabled = true; btnTodos.textContent = 'Generando…'; }
  try {
    await cargarAlumnos();
    const banco = await cargarBancoExamen(parcial);
    const entregas = [];
    for (const alumno of alumnosCache) {
      let intento = null;
      try { const snap = await getDoc(doc(db, 'grupos', grupoActivo, 'alumnos', alumno.id, 'intentos', parcial)); intento = snap.exists() ? snap.data() : null; } catch { /* nada */ }
      entregas.push({ alumno, intento });
    }
    await reporteExamenGrupo({ nombreGrupo: nombreDelGrupo(), parcial, entregas, banco });
  } catch (err) { console.error(err); alert('No se pudo generar el PDF: ' + (err.message || err)); }
  finally { if (btnTodos) { btnTodos.disabled = false; btnTodos.textContent = textoOriginal; } }
}

async function reabrirExamen(alumnoId, parcial) {
  const alumno = alumnosCache.find(a => a.id === alumnoId);
  if (!confirm(`¿Reabrir el examen de ${alumno?.nombre || 'este alumno'}?`)) return;
  const ref = doc(db, 'grupos', grupoActivo, 'alumnos', alumnoId, 'intentos', parcial);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const est = snap.data();
  const seg = est.segundosAlPausar ?? ((est.minutos || 60) * 60);
  await setDoc(ref, { ...est, estado: 'en_curso', segundosAlPausar: seg, minutosExtra: 0, reanudadoEn: Date.now(), reabiertoEn: new Date().toISOString(), actualizado: serverTimestamp() });
  await asegurarAcceso(parcial, [alumnoId]);
  const m = Math.floor(seg / 60), s = seg % 60;
  alert(`Examen reabierto. Continuará con ${m}:${String(s).padStart(2, '0')}.`);
}

// ---------- Permiso individual de examen ----------
let permisosIndividuales = {};
function permisoIndividual(parcial) { return permisosIndividuales[parcial] || []; }

async function cargarPermisos() {
  try {
    const snap = await getDoc(doc(db, 'grupos', grupoActivo, 'config', 'examenes'));
    const d = snap.exists() ? snap.data() : {};
    permisosIndividuales = d.individual || {};
    examenesAbiertos = Array.isArray(d.abiertos) ? d.abiertos : [];
  } catch { /* se queda lo que había */ }
}

async function cambiarPermiso(parcial, alumnoId, dar) {
  await cargarPermisos();
  const lista = new Set(permisoIndividual(parcial));
  if (dar) lista.add(alumnoId); else lista.delete(alumnoId);
  permisosIndividuales[parcial] = [...lista];
  await setDoc(doc(db, 'grupos', grupoActivo, 'config', 'examenes'), { individual: { [parcial]: [...lista] }, actualizado: serverTimestamp() }, { merge: true });
}

// Si el examen está cerrado para el grupo, reabrirle a alguien también le
// da permiso individual; si no, no podría verlo.
async function asegurarAcceso(parcial, alumnoIds) {
  await cargarPermisos();
  if (examenesAbiertos.includes(parcial)) return;
  const lista = new Set(permisoIndividual(parcial));
  alumnoIds.forEach(id => lista.add(id));
  permisosIndividuales[parcial] = [...lista];
  await setDoc(doc(db, 'grupos', grupoActivo, 'config', 'examenes'), { individual: { [parcial]: [...lista] }, actualizado: serverTimestamp() }, { merge: true });
}

// Intento que vuelve a quedar abierto con sus respuestas y N minutos por
// delante. Se quitan los datos de la entrega anterior; al volver a entregar,
// el examen se califica de nuevo con todas sus respuestas.
function intentoReabierto(est, minutos) {
  const { aciertos, total, calificacion, detalle, entregadoEn, automatico, ...resto } = est;
  return { ...resto, estado: 'en_curso', segundosAlPausar: minutos * 60, minutosExtra: 0,
    reanudadoEn: Date.now(), reabiertoEn: new Date().toISOString(), actualizado: serverTimestamp() };
}

function pedirMinutos(texto) {
  const n = parseInt(prompt(texto, '20'), 10);
  return isNaN(n) || n <= 0 ? null : n;
}

async function reabrirEntregado(alumnoId, parcial) {
  const alumno = alumnosCache.find(a => a.id === alumnoId);
  const ref = doc(db, 'grupos', grupoActivo, 'alumnos', alumnoId, 'intentos', parcial);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const est = snap.data();
  const aviso = parcial === 'diag' ? '' : '\n\nOjo: es un examen con valor. Al volver a entregar, su calificación se reemplaza por la nueva.';
  const n = pedirMinutos(`${alumno?.nombre || 'Este alumno'} ya entregó (${est.aciertos}/${est.total}${est.automatico ? ', por tiempo agotado' : ''}).\n\nSe reabre con sus respuestas guardadas. ¿Cuántos minutos le das?${aviso}`);
  if (!n) return;
  await setDoc(ref, intentoReabierto(est, n));
  await asegurarAcceso(parcial, [alumnoId]);
  alert(`Examen reabierto con ${n} minutos. Que el alumno recargue la página y entre de nuevo a Examen.`);
}

async function darTiempoAlGrupo(parcial, filas) {
  // Cuenta como pendiente todo el que lo abrió y no contestó TODO: en curso,
  // bloqueado, entregado por tiempo, o entregado a medias (incluso en blanco).
  const contestadas = est => Object.keys(est.respuestas || {}).length;
  const pendientes = filas.filter(f => f.est && (f.est.estado !== 'entregado' || f.est.automatico || contestadas(f.est) < (f.est.ids || []).length));
  const sinAbrir = filas.filter(f => !f.est).length;
  if (pendientes.length === 0) { alert('Nadie tiene el examen pendiente: todos los que lo abrieron contestaron todas las preguntas.' + (sinAbrir ? `\n\n${sinAbrir} alumno(s) no lo han abierto: al iniciarlo tendrán el tiempo completo.` : '')); return; }
  const n = pedirMinutos(`Se reabrirá el ${ETIQUETAS_EXAMEN[parcial]} a ${pendientes.length} alumno(s) que no terminaron:\n\n${pendientes.map(f => '• ' + f.alumno.nombre).join('\n')}\n\nConservan sus respuestas.${sinAbrir ? `\n(${sinAbrir} que no lo han abierto tendrán el tiempo completo al iniciarlo.)` : ''}\n\n¿Cuántos minutos les das a partir de ahora?`);
  if (!n) return;
  const ahora = Date.now();
  await asegurarAcceso(parcial, pendientes.map(f => f.alumno.id));
  await Promise.all(pendientes.map(f => setDoc(doc(db, 'grupos', grupoActivo, 'alumnos', f.alumno.id, 'intentos', parcial), { ...intentoReabierto(f.est, n), reanudadoEn: ahora })));
  alert(`Listo: ${pendientes.length} alumno(s) con ${n} minutos. Que recarguen la página y entren de nuevo a Examen.\n\nEl tiempo empieza a correr desde ahora; si lo harán mañana en clase, usa este botón mañana al iniciar.`);
}

async function darTiempoExtra(alumnoId, parcial) {
  const alumno = alumnosCache.find(a => a.id === alumnoId);
  const ref = doc(db, 'grupos', grupoActivo, 'alumnos', alumnoId, 'intentos', parcial);
  const snap = await getDoc(ref);
  if (!snap.exists()) { alert('Ese alumno todavía no ha iniciado el examen.'); return; }
  const est = snap.data();
  const base = est.segundosAlPausar ?? ((est.minutos || 60) * 60);
  const desde = est.reanudadoEn || est.iniciado;
  const restante = est.estado === 'bloqueado' ? base : Math.max(0, base + (est.minutosExtra || 0) * 60 - Math.floor((Date.now() - desde) / 1000));
  const rm = Math.floor(restante / 60), rs = restante % 60;
  const min = prompt(`${alumno?.nombre || 'Este alumno'} tiene ${rm}:${String(rs).padStart(2, '0')} restantes.\n\n¿Cuántos minutos EXTRA le agrego?`, '10');
  const n = parseInt(min, 10);
  if (isNaN(n) || n <= 0) return;
  await setDoc(ref, { ...est, minutosExtra: (est.minutosExtra || 0) + n, actualizado: serverTimestamp() });
  await asegurarAcceso(parcial, [alumnoId]);
  alert(`Se agregaron ${n} minutos.`);
}

async function ajustarCalificacionExamen(alumnoId, parcial) {
  const alumno = alumnosCache.find(a => a.id === alumnoId);
  const actualRef = doc(db, 'grupos', grupoActivo, 'alumnos', alumnoId, 'examenes', parcial);
  let actual = null;
  try { const snap = await getDoc(actualRef); actual = snap.exists() ? snap.data() : null; } catch { /* nada */ }
  const sugerido = actual && actual.calificacion !== undefined ? actual.calificacion : '';
  const etiquetaParcial = parcial === 'p2' ? `${ETIQUETAS_EXAMEN[parcial]} (solo la parte escrita)` : ETIQUETAS_EXAMEN[parcial];
  const val = prompt(`Calificación de examen para ${alumno?.nombre || 'este alumno'} — ${etiquetaParcial} (0-10).`, sugerido !== '' ? String(sugerido) : '');
  if (val === null) return;
  const calificacion = parseFloat(val);
  if (isNaN(calificacion) || calificacion < 0 || calificacion > 10) { alert('Escribe un número entre 0 y 10.'); return; }
  try { await setDoc(actualRef, { calificacion, origen: 'ajuste manual del docente', actualizado: serverTimestamp() }); }
  catch (err) { alert('No se pudo guardar el ajuste: ' + (err.message || err)); return; }
  alert(`Calificación actualizada a ${calificacion.toFixed(1)} / 10.`);
}

// ---------- HISTORIAL ----------
async function datosDeAlumno(alumnoId) {
  const base = ['grupos', grupoActivo, 'alumnos', alumnoId];
  const [alumnoSnap, catalogoSnap, tarSnap, partSnap, asisSnap, unifP1, unifP2, exaP1, exaP2, exaFinal, externaP1, proyE1, proyE2, proyEF, actSnap] = await Promise.all([
    // Documento del alumno: ahí se guardan las decisiones de redondeo.
    getDoc(doc(db, ...base)).catch(() => null),
    // Catálogo de tareas del grupo: define cuántas tareas existen en cada
    // parcial. Es el denominador del promedio, para que una tarea del
    // catálogo que el alumno no entregó cuente como cero.
    getDocs(collection(db, 'grupos', grupoActivo, 'tareas_catalogo')).catch(() => null),
    getDocs(collection(db, ...base, 'tareas')).catch(() => null),
    getDocs(collection(db, ...base, 'participaciones')).catch(() => null),
    getDocs(collection(db, ...base, 'asistencias')).catch(() => null),
    getDoc(doc(db, ...base, 'uniformes', 'p1')).catch(() => null),
    getDoc(doc(db, ...base, 'uniformes', 'p2')).catch(() => null),
    getDoc(doc(db, ...base, 'examenes', 'p1')).catch(() => null),
    getDoc(doc(db, ...base, 'examenes', 'p2')).catch(() => null),
    getDoc(doc(db, ...base, 'examenes', 'final')).catch(() => null),
    getDoc(doc(db, ...base, 'externa', 'p1')).catch(() => null),
    getDoc(doc(db, ...base, 'proyecto', 'entrega1')).catch(() => null),
    getDoc(doc(db, ...base, 'proyecto', 'entrega2')).catch(() => null),
    getDoc(doc(db, ...base, 'proyecto', 'entregaFinal')).catch(() => null),
    getDocs(collection(db, ...base, 'actividades')).catch(() => null),
  ]);
  return {
    actividades: actSnap ? actSnap.docs.map(d => d.data()) : [],
    redondeos: alumnoSnap && alumnoSnap.exists() ? (alumnoSnap.data().redondeos || {}) : {},
    catalogoTareas: catalogoSnap ? catalogoSnap.docs.map(d => ({ id: d.id, ...d.data() })) : [],
    // Se conserva el id del documento: es el mismo id que la tarea tiene en
    // el catálogo, y es con lo que se emparejan entregadas contra esperadas.
    tareas: tarSnap ? tarSnap.docs.map(d => ({ id: d.id, ...d.data() })) : [],
    participaciones: partSnap ? partSnap.docs.map(d => ({ id: d.id, ...d.data() })) : [],
    asistencias: asisSnap ? asisSnap.docs.map(d => d.data()) : [],
    uniformes: { p1: unifP1 && unifP1.exists() ? unifP1.data() : null, p2: unifP2 && unifP2.exists() ? unifP2.data() : null },
    examenes: { p1: exaP1 && exaP1.exists() ? exaP1.data() : null, p2: exaP2 && exaP2.exists() ? exaP2.data() : null, final: exaFinal && exaFinal.exists() ? exaFinal.data() : null },
    externa: { p1: externaP1 && externaP1.exists() ? externaP1.data() : null },
    proyecto: { entrega1: proyE1 && proyE1.exists() ? proyE1.data() : null, entrega2: proyE2 && proyE2.exists() ? proyE2.data() : null, entregaFinal: proyEF && proyEF.exists() ? proyEF.data() : null },
  };
}

let parcialesReporte = ['p1', 'p2', 'final'];
function renderParcialesReporte() {
  const cont = document.getElementById('hist-parciales');
  if (!cont) return;
  cont.innerHTML = '';
  PARCIALES.forEach(p => {
    const incluido = parcialesReporte.includes(p);
    const row = document.createElement('button');
    row.type = 'button'; row.className = 'asis-row ' + (incluido ? 'asis-presente' : 'asis-falta');
    row.innerHTML = `<span class="asis-dot"></span><span class="student-name">${NOMBRES_PARCIAL[p]}</span><span class="asis-estado-label">${incluido ? 'Incluido' : 'Omitido'}</span>`;
    row.addEventListener('click', () => {
      if (incluido) { if (parcialesReporte.length === 1) { alert('Deja al menos un parcial incluido.'); return; } parcialesReporte = parcialesReporte.filter(x => x !== p); }
      else { parcialesReporte = [...parcialesReporte, p]; }
      renderParcialesReporte();
    });
    cont.appendChild(row);
  });
}

on('hist-modo', 'change', () => { document.getElementById('hist-alumno-wrap').hidden = document.getElementById('hist-modo').value !== 'alumno'; });

function renderSelectHistAlumno() {
  const selectHist = document.getElementById('hist-alumno-select');
  if (!selectHist) return;
  const actual = selectHist.value;
  selectHist.innerHTML = '<option value="">— Elige un alumno —</option>';
  alumnosCache.forEach(a => { const opt = document.createElement('option'); opt.value = a.id; opt.textContent = a.nombre; selectHist.appendChild(opt); });
  if (actual && alumnosCache.some(a => a.id === actual)) selectHist.value = actual;
}

on('btn-pdf', 'click', generarPDF);

// Antes de cualquier reporte se vuelve a leer la lista de alumnos desde la
// base de datos. Así, si un nombre se corrigió (en esta pestaña, en otra
// ventana o en el celular), el reporte usa el registro nuevo y no uno viejo
// que ya quedó vacío — eso era lo que sacaba a un alumno en ceros.
async function refrescarAlumnos() {
  await cargarAlumnos();
  renderSelectHistAlumno();
}

// Revisa si hay calificaciones en la zona .51-.59 sin decidir. Si las hay,
// pregunta antes de generar. Devuelve false si el docente prefiere decidir
// primero.
function confirmarPendientes(lista) {
  const pendientes = [];
  lista.forEach(({ alumno, datos }) => {
    const res = {};
    PARCIALES.forEach(p => { res[p] = calcularParcial(p, datos); });
    zonaDeDecision(res, datos.redondeos).filter(x => x.calif.pendiente)
      .forEach(x => pendientes.push(`• ${alumno.nombre} — ${NOMBRES_REDONDEO[x.clave]}: ${x.calif.cruda.toFixed(2)}`));
  });
  if (pendientes.length === 0) return true;
  return confirm(`Hay ${pendientes.length} calificación(es) por decidir (¿subir o dejar?):\n\n${pendientes.slice(0, 12).join('\n')}${pendientes.length > 12 ? '\n…' : ''}\n\nPuedes decidirlas en "Redondeos por decidir", aquí mismo en Historial.\n\n¿Generar de todos modos? Saldrán marcadas como "por decidir".`);
}

async function generarPDF() {
  if (!grupoActivo) { alert('Elige un grupo primero.'); return; }
  const modo = document.getElementById('hist-modo').value;
  const elegido = document.getElementById('hist-alumno-select').value;
  const msg = document.getElementById('export-msg');
  msg.textContent = 'Generando reporte…'; msg.hidden = false;
  try {
    await refrescarAlumnos();
    if (alumnosCache.length === 0) { alert('Este grupo no tiene alumnos.'); msg.hidden = true; return; }
    if (modo === 'alumno') {
      if (!elegido) { alert('Elige un alumno de la lista.'); msg.hidden = true; return; }
      const alumno = alumnosCache.find(a => a.id === elegido);
      if (!alumno) { alert('Ese alumno ya no está con ese nombre (probablemente se corrigió). La lista ya se actualizó: vuelve a elegirlo.'); msg.hidden = true; return; }
      const datos = await datosDeAlumno(alumno.id);
      if (!confirmarPendientes([{ alumno, datos }])) { msg.hidden = true; return; }
      await reporteAlumno({ nombreGrupo: nombreDelGrupo(), alumno, datos });
    } else {
      const alumnos = [];
      for (const alumno of alumnosCache) { alumnos.push({ alumno, datos: await datosDeAlumno(alumno.id) }); }
      if (!confirmarPendientes(alumnos)) { msg.hidden = true; return; }
      await reporteGrupo({ nombreGrupo: nombreDelGrupo(), grupoId: grupoActivo, alumnos, parciales: parcialesReporte });
    }
    msg.textContent = '✓ Reporte abierto en una ventana nueva.';
    setTimeout(() => { msg.hidden = true; }, 4000);
  } catch (err) { console.error(err); msg.textContent = 'No se pudo generar el reporte: ' + (err.message || err); }
}

// ---------- REDONDEOS POR DECIDIR ----------
// Lista de calificaciones en la zona .51-.59 (como 9.52). El docente decide
// si sube o se queda; la decisión se guarda en el documento del alumno.
async function cargarRedondeos() {
  const cont = document.getElementById('hist-redondeos');
  if (!cont) return;
  if (!grupoActivo || alumnosCache.length === 0) { cont.innerHTML = '<p class="empty-inline">Sin alumnos.</p>'; return; }
  cont.innerHTML = '<p class="empty-inline">Revisando calificaciones…</p>';
  const items = [];
  for (const alumno of alumnosCache) {
    let datos;
    try { datos = await datosDeAlumno(alumno.id); } catch { continue; }
    const res = {};
    PARCIALES.forEach(p => { res[p] = calcularParcial(p, datos); });
    zonaDeDecision(res, datos.redondeos).forEach(x => items.push({ alumno, ...x }));
  }
  if (items.length === 0) {
    cont.innerHTML = '<p class="empty-inline">✓ No hay calificaciones entre .51 y .59. Todo se redondea solo.</p>';
    return;
  }
  const pend = items.filter(x => x.calif.pendiente).length;
  cont.innerHTML = `
    <p class="field-hint" style="margin-top:0;">${pend > 0 ? `<strong>${pend} por decidir.</strong> ` : '✓ Todas decididas. '}Puedes cambiar una decisión cuando quieras.</p>
    ${items.map((x, i) => `
      <div class="redondeo-row${x.calif.pendiente ? ' redondeo-pend' : ''}">
        <div class="redondeo-info">
          <span class="student-name">${escaparHTML(x.alumno.nombre)}</span>
          <span class="redondeo-detalle">${NOMBRES_REDONDEO[x.clave]}: <strong>${x.calif.cruda.toFixed(2)}</strong>${x.calif.pendiente ? ' · por decidir' : ` · quedó en ${x.calif.oficial}`}</span>
        </div>
        <div class="redondeo-botones">
          <button type="button" class="mz-btn${x.calif.decidido && x.calif.oficial === x.calif.arriba ? ' mz-btn-fuerte' : ''}" data-r="${i}" data-valor="${x.calif.arriba}">Subir a ${x.calif.arriba}</button>
          <button type="button" class="mz-btn${x.calif.decidido && x.calif.oficial === x.calif.abajo ? ' mz-btn-fuerte' : ''}" data-r="${i}" data-valor="${x.calif.abajo}">Dejar en ${x.calif.abajo}</button>
        </div>
      </div>`).join('')}`;
  cont.querySelectorAll('[data-r]').forEach(btn => btn.addEventListener('click', async () => {
    const x = items[Number(btn.dataset.r)];
    const valor = Number(btn.dataset.valor);
    cont.querySelectorAll('button').forEach(b => { b.disabled = true; });
    try {
      await setDoc(doc(db, 'grupos', grupoActivo, 'alumnos', x.alumno.id),
        { redondeos: { [x.clave]: { centesimas: x.calif.centesimas, valor, decidido: serverTimestamp() } } }, { merge: true });
    } catch (err) {
      alert('No se pudo guardar la decisión: ' + (err.message || err));
    }
    await cargarRedondeos();
    vistaRapida('historial', { db, grupoActivo, alumnos: alumnosCache, datosDeAlumno });
  }));
}

function cargarHistorial() {
  const cont = document.getElementById('hist-lista-alumnos');
  const empty = document.getElementById('historial-empty');
  const resumen = document.getElementById('hist-resumen');
  if (!cont) return;
  cont.innerHTML = ''; resumen.hidden = true;
  renderParcialesReporte(); renderSelectHistAlumno(); cargarRedondeos();
  if (!grupoActivo) { empty.hidden = false; empty.textContent = 'Elige un grupo primero.'; return; }
  if (alumnosCache.length === 0) { empty.hidden = false; empty.textContent = 'Este grupo aún no tiene alumnos.'; return; }
  empty.hidden = true;
  alumnosCache.forEach(a => {
    const row = document.createElement('button');
    row.type = 'button'; row.className = 'asis-row';
    row.innerHTML = `<span class="student-name">${escaparHTML(a.nombre)}</span><span class="asis-estado-label">Ver resumen →</span>`;
    row.addEventListener('click', () => mostrarResumenAlumno(a));
    cont.appendChild(row);
  });
}

async function mostrarResumenAlumno(alumno) {
  const resumen = document.getElementById('hist-resumen');
  resumen.hidden = false;
  resumen.innerHTML = `<p class="eval-alumno-activo">Resumen de: ${escaparHTML(alumno.nombre)}</p><p class="empty-inline">Cargando…</p>`;
  resumen.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const datos = await datosDeAlumno(alumno.id);
  const resultados = {};
  PARCIALES.forEach(p => { resultados[p] = calcularParcial(p, datos); });
  const cuatri = calcularCuatrimestreRedondeado(resultados, datos.redondeos);

  const filaRubro = (nombre, pts, tope) => `<div class="res-row"><span>${nombre}</span><strong>${pts.toFixed(1)} / ${tope}</strong></div>`;
  const listaDetalleHTML = (lista, vacio, conCalificacion) => {
    if (!lista || lista.length === 0) return `<p class="empty-inline">${vacio}</p>`;
    const filas = lista.slice().sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''))
      .map(x => `<li>${escaparHTML(x.fecha || 'sin fecha')} — ${escaparHTML(x.nombre || '')}${conCalificacion ? `: <strong>${(Number(x.calificacion) || 0).toFixed(1)}/10</strong>` : ''}</li>`).join('');
    return `<ul style="margin:6px 0 0; padding-left:18px; font-size:.85em;">${filas}</ul>`;
  };
  // Lista de tareas que marca explícitamente las no entregadas.
  const listaTareasHTML = (entregadas, faltantes) => {
    const items = [
      ...(entregadas || []).map(x => ({ ...x, entregada: true })),
      ...(faltantes || []).map(x => ({ ...x, entregada: false })),
    ];
    if (items.length === 0) return `<p class="empty-inline">Sin tareas registradas.</p>`;
    const filas = items.sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''))
      .map(x => x.entregada
        ? `<li>${escaparHTML(x.fecha || 'sin fecha')} — ${escaparHTML(x.nombre || '')}: <strong>${(Number(x.calificacion) || 0).toFixed(1)}/10</strong></li>`
        : `<li>${escaparHTML(x.fecha || 'sin fecha')} — ${escaparHTML(x.nombre || '')}: <strong>no entregada (0/10)</strong></li>`)
      .join('');
    return `<ul style="margin:6px 0 0; padding-left:18px; font-size:.85em;">${filas}</ul>`;
  };
  const etiquetaTareas = (r) => `Tareas (${r.esperadas ? `${r.entregadas} de ${r.esperadas} entregadas` : 'sin tareas registradas'})`;

  resumen.innerHTML = `
    <p class="eval-alumno-activo">Resumen de: ${escaparHTML(alumno.nombre)}</p>
    ${PARCIALES.map(p => {
      const r = resultados[p];
      const esFinal = p === 'final';
      let cuerpo;
      if (esFinal) {
        cuerpo = filaRubro('Examen', r.examen.pts, r.examen.tope) +
          filaRubro('Ensayo — Entrega 1', r.proyecto.detalle.entrega1.pts, r.proyecto.detalle.entrega1.tope) +
          filaRubro('Ensayo — Entrega 2', r.proyecto.detalle.entrega2.pts, r.proyecto.detalle.entrega2.tope) +
          filaRubro('Ensayo — Entrega final', r.proyecto.detalle.entregaFinal.pts, r.proyecto.detalle.entregaFinal.tope) +
          filaRubro('Tareas y Participación', r.tareasParticipacion.pts, r.tareasParticipacion.tope) +
          filaRubro('Asistencia', r.asistencia.pts, r.asistencia.tope) +
          `<details class="prog-detalle-bloque" style="margin-top:8px;"><summary>Ver fechas — Tareas y Participación</summary>${listaDetalleHTML([...r.tareasParticipacion.lista], 'Sin capturas.', true)}</details>`;
      } else if (r.externa) {
        cuerpo = filaRubro('Calificación capturada del docente del primer bloque', r.total, 100);
      } else {
        cuerpo = filaRubro('Examen', r.examen.pts, r.examen.tope) +
          filaRubro(etiquetaTareas(r.tareas), r.tareas.pts, r.tareas.tope) +
          filaRubro(`Participación (${r.participacion.texto})`, r.participacion.pts, r.participacion.tope) +
          filaRubro('Asistencia', r.asistencia.pts, r.asistencia.tope) +
          filaRubro('Uniformes', r.uniformes.pts, r.uniformes.tope) +
          `<details class="prog-detalle-bloque" style="margin-top:8px;"><summary>Ver fechas — Tareas y Participación</summary><p class="field-hint" style="margin:8px 0 2px;">Tareas:</p>${listaTareasHTML(r.tareas.lista, r.tareas.faltantes)}<p class="field-hint" style="margin:10px 0 2px;">Participación:</p>${listaDetalleHTML(r.participacion.lista, 'Sin participación capturada.', false)}</details>`;
      }
      return `<div class="res-card"><h4>${NOMBRES_PARCIAL[p]}</h4>${cuerpo}<div class="res-row res-total"><span>Total</span><strong>${r.total.toFixed(1)} / 100 pts</strong></div><div class="res-row res-total"><span>Calificación (redondeada)</span><strong>${textoCalificacion(r.calif)}</strong></div></div>`;
    }).join('')}
    <div class="score-display">Calificación del cuatrimestre: ${textoCalificacion(cuatri.calif)} / 10</div>
    <p class="field-hint">Promedio de Parcial 1 y Parcial 2 (ya redondeados), promediado con el Examen Final (redondeado): ${cuatri.promedio.toFixed(2)}.${cuatri.bloquesPendientes.length ? ' Hay bloques por decidir en "Redondeos por decidir".' : ''}</p>
  `;
}

on('btn-exportar', 'click', exportarCalificaciones);

async function exportarCalificaciones() {
  if (!grupoActivo) { alert('Elige un grupo primero.'); return; }
  if (alumnosCache.length === 0) { alert('Este grupo no tiene alumnos.'); return; }
  const msg = document.getElementById('export-msg');
  msg.textContent = 'Preparando archivo…'; msg.hidden = false;

  try { await refrescarAlumnos(); } catch { /* se usa la lista que ya está */ }
  const filas = [['Alumno', 'Parcial', 'Examen', 'P1 capturado', 'Ensayo', 'Tareas', 'Tareas entregadas', 'Participación', 'Asistencia', 'Uniformes', 'TOTAL (100)', 'Calificación sin redondear', 'Calificación redondeada']];
  for (const alumno of alumnosCache) {
    const datos = await datosDeAlumno(alumno.id);
    const resultados = {};
    PARCIALES.forEach(p => {
      const r = calcularParcial(p, datos);
      resultados[p] = r;
      const califs = [r.calif.cruda.toFixed(2), r.calif.pendiente ? 'POR DECIDIR' : String(r.calif.oficial)];
      if (p === 'final') {
        filas.push([alumno.nombre, NOMBRES_PARCIAL[p], r.examen.pts.toFixed(1), '—', r.proyecto.pts.toFixed(1), r.tareasParticipacion.pts.toFixed(1), '—', '—', r.asistencia.pts.toFixed(1), '—', r.total.toFixed(1), ...califs]);
      } else if (r.externa) {
        filas.push([alumno.nombre, NOMBRES_PARCIAL[p], '—', String(r.externa.calificacion), '—', '—', '—', '—', '—', '—', r.total.toFixed(1), ...califs]);
      } else {
        filas.push([alumno.nombre, NOMBRES_PARCIAL[p], r.examen.pts.toFixed(1), '—', '—', r.tareas.pts.toFixed(1), `${r.tareas.entregadas ?? 0} de ${r.tareas.esperadas ?? 0}`, r.participacion.pts.toFixed(1), r.asistencia.pts.toFixed(1), r.uniformes.pts.toFixed(1), r.total.toFixed(1), ...califs]);
      }
    });
    const cuatri = calcularCuatrimestreRedondeado(resultados, datos.redondeos);
    filas.push([alumno.nombre, 'CUATRIMESTRE', '', '', '', '', '', '', '', '', '', cuatri.promedio.toFixed(2), cuatri.calif.pendiente ? 'POR DECIDIR' : String(cuatri.calif.oficial)]);
  }

  const csv = (arr) => arr.map(f => f.map(v => { const s = String(v ?? ''); return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }).join(',')).join('\n');
  const contenido = '\uFEFF' + `CALIFICACIONES — ${nombreDelGrupo()}\nGenerado: ${new Date().toLocaleString('es-MX')}\n\n` + csv(filas);
  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `calificaciones-grupo-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  msg.textContent = '✓ Archivo descargado. Ábrelo con Excel.';
  setTimeout(() => { msg.hidden = true; }, 4000);
}

// ---------- AVISOS ----------
on('btn-publicar-aviso', 'click', publicarAviso);

async function cargarAvisos() {
  const cont = document.getElementById('avisos-lista');
  const empty = document.getElementById('avisos-empty');
  cont.innerHTML = '';
  if (!grupoActivo) { empty.hidden = false; empty.textContent = 'Elige un grupo primero.'; return; }
  const snap = await getDocs(query(collection(db, 'grupos', grupoActivo, 'avisos'), orderBy('creado', 'desc')));
  empty.hidden = !snap.empty;
  if (snap.empty) { empty.textContent = 'Aún no has publicado avisos en este grupo.'; return; }
  snap.forEach(d => {
    const a = d.data();
    const div = document.createElement('div');
    div.className = 'aviso-card';
    div.innerHTML = `<div class="aviso-card-top"><span class="aviso-card-titulo">${escaparHTML(a.titulo || 'Sin título')}</span><button type="button" class="btn-delete-student" data-id="${d.id}">Eliminar</button></div><div class="aviso-card-texto">${escaparHTML(a.texto || '')}</div>`;
    div.querySelector('.btn-delete-student').addEventListener('click', async () => {
      if (!confirm('¿Eliminar este aviso?')) return;
      await deleteDoc(doc(db, 'grupos', grupoActivo, 'avisos', d.id));
      cargarAvisos();
    });
    cont.appendChild(div);
  });
}

async function publicarAviso() {
  if (!grupoActivo) { alert('Elige un grupo primero.'); return; }
  const titulo = document.getElementById('aviso-titulo').value.trim();
  const texto = document.getElementById('aviso-texto').value.trim();
  if (!titulo && !texto) { alert('Escribe al menos un título o contenido.'); return; }
  try { await addDoc(collection(db, 'grupos', grupoActivo, 'avisos'), { titulo, texto, creado: serverTimestamp() }); }
  catch (err) { marcarResultado('btn-publicar-aviso', 'aviso-msg', false, '', 'No se pudo publicar: ' + (err.message || err)); return; }
  document.getElementById('aviso-titulo').value = ''; document.getElementById('aviso-texto').value = '';
  marcarResultado('btn-publicar-aviso', 'aviso-msg', true, '✓ Aviso publicado.', '');
  cargarAvisos();
}

// ---- Equipos (grupos/{g}/equipos/{id}; su trabajo en .../equipos/{id}/atlas/{tarea})
// Se arman por «formaciones»: cada vez que formas equipos (con QR o a mano) queda una
// formación, y cada tarea en equipo usa una (grupos/{g}.equiposTarea[tarea] = formación).
// Así reutilizas los mismos equipos en varias tareas o formas nuevos solo para una.
const LETRAS_COD = 'ACDEFHJKMNPRTUVWXY3479';
let ATLAS_DATA = null;
let EQUIPOS = [], eqUnsub = null, gEqUnsub = null, eqGrupo = null, G_DATA = {}, FSEL = BASE, QR_FID = BASE, NUEVA_PARA = '';
const ordenEq = (a, b) => (a.numero || 999) - (b.numero || 999) || (a.nombre || '').localeCompare(b.nombre || '', 'es');
const eqDeF = fid => equiposDe(EQUIPOS, fid).sort(ordenEq);
const nombreF = fid => (formaciones(G_DATA)[fid] || {}).nombre || 'Equipos';
const tareasF = fid => tareasDeFormacion(G_DATA, fid, TAREAS_DIG);
const nombreTareaCorto = a => `${a.tema} · ${a.nombre}`;
function codigoNuevo(usados) { let c; do { c = Array.from({ length: 4 }, () => LETRAS_COD[Math.floor(Math.random() * LETRAS_COD.length)]).join(''); } while (usados.has(c)); usados.add(c); return c; }
function escucharEquiposAdmin() {
  if (!grupoActivo) return;
  if (eqGrupo === grupoActivo && eqUnsub) return;
  if (eqUnsub) eqUnsub(); if (gEqUnsub) gEqUnsub();
  eqGrupo = grupoActivo; EQUIPOS = []; G_DATA = {}; FSEL = BASE;
  gEqUnsub = onSnapshot(doc(db, 'grupos', grupoActivo), sn => { G_DATA = sn.exists() ? sn.data() : {}; if (!formaciones(G_DATA)[FSEL]) FSEL = BASE; refrescarEquiposUI(); }, () => {});
  eqUnsub = onSnapshot(collection(db, 'grupos', grupoActivo, 'equipos'), sn => { EQUIPOS = sn.docs.map(d => ({ id: d.id, ...d.data() })).sort(ordenEq); refrescarEquiposUI(); }, () => {});
}
function refrescarEquiposUI() {
  pintarEquipos();
  pintarTdEquipos();
  if (!document.getElementById('qr-proyeccion').hidden) pintarProyeccion();
}
function cargarEquiposTab() {
  const cont = document.getElementById('equipos-lista'); if (!cont) return;
  if (!grupoActivo) { cont.innerHTML = '<p class="empty-inline">Elige un grupo primero.</p>'; return; }
  escucharEquiposAdmin(); pintarEquipos();
}
function irAEquipos(fid, nuevaPara) {
  FSEL = fid || FSEL; NUEVA_PARA = nuevaPara || '';
  const b = document.querySelector('.tab-btn[data-tab="equipos"]'); if (b) b.click();
  pintarEquipos();
  if (nuevaPara) { const f = document.getElementById('eqn-nombre'); if (f) setTimeout(() => f.focus(), 50); }
  document.getElementById('tab-equipos').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function pintarEquipos() {
  const lista = document.getElementById('equipos-lista'); if (!lista || !grupoActivo) return;
  const F = formaciones(G_DATA), f = F[FSEL] || F[BASE];
  // formaciones
  document.getElementById('eq-formaciones').innerHTML = ordenFormaciones(G_DATA).map(([fid, x]) => `<button type="button" class="chip-mon" data-f="${fid}" aria-pressed="${fid === FSEL}">${x.abiertas ? '🔓' : '🔒'} ${escaparHTML(x.nombre)} <small>· ${eqDeF(fid).length} equipo${eqDeF(fid).length === 1 ? '' : 's'}</small></button>`).join('')
    + `<button type="button" class="chip-mon eq-nueva-btn" id="eq-nueva-abrir" aria-pressed="${!!NUEVA_PARA || document.getElementById('eq-nueva').hidden === false}">➕ Formar equipos nuevos</button>`;
  document.querySelectorAll('#eq-formaciones [data-f]').forEach(b => b.addEventListener('click', () => { FSEL = b.dataset.f; NUEVA_PARA = ''; document.getElementById('eq-nueva').hidden = true; pintarFormEquipo(null); pintarEquipos(); }));
  document.getElementById('eq-nueva-abrir').addEventListener('click', () => { const n = document.getElementById('eq-nueva'); n.hidden = !n.hidden; if (!n.hidden) pintarNueva(); pintarEquipos(); });
  if (NUEVA_PARA) { document.getElementById('eq-nueva').hidden = false; pintarNueva(); }
  // cabecera de la formación elegida
  const usan = tareasF(FSEL);
  document.getElementById('eq-f-cab').innerHTML = `<div class="eq-f-tit"><h3 class="section-title" style="margin:0">👥 ${escaparHTML(f.nombre)}</h3><button type="button" class="btn btn-small" id="eq-f-ren">✏️ Renombrar</button>${FSEL !== BASE && !usan.length ? '<button type="button" class="btn btn-small" id="eq-f-del">Eliminar</button>' : ''}</div>
    <p class="eq-f-usan"><b>La usan:</b> ${usan.length ? usan.map(a => `<span class="eq-tag">${a.icono} ${escaparHTML(nombreTareaCorto(a))}</span>`).join(' ') : '<i>ninguna tarea todavía</i> (asígnala en Tareas → Tareas digitales, botón 👥)'}</p>`;
  document.getElementById('eq-f-ren').addEventListener('click', async () => {
    const n = prompt('Nombre de esta formación de equipos:', f.nombre); if (!n || !n.trim()) return;
    await setDoc(doc(db, 'grupos', grupoActivo), { formaciones: { [FSEL]: { nombre: n.trim() } } }, { merge: true });
  });
  const bd = document.getElementById('eq-f-del');
  if (bd) bd.addEventListener('click', async () => {
    if (!confirm(`¿Eliminar «${f.nombre}» y sus ${eqDeF(FSEL).length} equipos? Ninguna tarea la usa.`)) return;
    const fid = FSEL; FSEL = BASE;
    await Promise.all(eqDeF(fid).map(e => deleteDoc(doc(db, 'grupos', grupoActivo, 'equipos', e.id))));
    await updateDoc(doc(db, 'grupos', grupoActivo), { [`formaciones.${fid}`]: deleteField() });
  });
  const ab = document.getElementById('eq-abierto');
  ab.setAttribute('aria-pressed', String(!!f.abiertas)); ab.textContent = f.abiertas ? '🔓 Inscripciones abiertas' : '🔒 Inscripciones cerradas';
  const mios = eqDeF(FSEL);
  const nombreDe = id => id === PRUEBA_ID ? '🧪 ' + PRUEBA_NOMBRE : (alumnosCache.find(a => a.id === id) || {}).nombre || id;
  const enEq = new Set(mios.flatMap(e => e.integrantes || []));
  const sin = alumnosCache.filter(a => !enEq.has(a.id));
  document.getElementById('eq-sin-lista').textContent = sin.length ? sin.map(a => a.nombre).join(', ') : 'nadie, ¡todos tienen equipo!';
  lista.innerHTML = mios.length ? `<div class="equipos-grid">${mios.map(eq => {
    const n = (eq.integrantes || []).length, lleno = eq.max && n >= eq.max;
    return `<div class="equipo-card"><div class="eq-card-cab"><div><b>${escaparHTML(eq.nombre)}</b>${eq.codigo ? `<span class="eq-codigo">${escaparHTML(eq.codigo)}</span>` : ''}</div>${eq.codigo ? `<button type="button" class="eq-qr-mini" data-eq-qr="${eq.id}" title="Ver el QR en grande">${qrSvg(urlUnir(eq.codigo), { titulo: eq.nombre })}</button>` : ''}</div>
      <p class="eq-cupo ${lleno ? 'lleno' : ''}">${n}${eq.max ? ` de ${eq.max}` : ''} integrante${n === 1 && !eq.max ? '' : 's'}${lleno ? ' · completo' : ''}</p>
      <p>${(eq.integrantes || []).map(i => escaparHTML(nombreDe(i))).join(', ') || '<i>sin integrantes</i>'}</p>
      <div><button type="button" class="btn btn-small" data-eq-edit="${eq.id}">Editar</button> <button type="button" class="btn btn-small" data-eq-del="${eq.id}">Eliminar</button></div></div>`;
  }).join('')}</div>` : '<p class="empty-inline">Esta formación todavía no tiene equipos: genéralos con QR o ármalos a mano.</p>';
  if (!document.getElementById('equipo-id').value) pintarFormEquipo(null);
  lista.querySelectorAll('[data-eq-qr]').forEach(b => b.addEventListener('click', () => abrirProyeccion(FSEL, false, b.dataset.eqQr)));
  lista.querySelectorAll('[data-eq-edit]').forEach(b => b.addEventListener('click', () => { pintarFormEquipo(EQUIPOS.find(x => x.id === b.dataset.eqEdit)); document.getElementById('equipo-nombre').focus(); }));
  lista.querySelectorAll('[data-eq-del]').forEach(b => b.addEventListener('click', async () => {
    const eq = EQUIPOS.find(x => x.id === b.dataset.eqDel);
    if (!confirm(`¿Eliminar el equipo «${eq.nombre}»? Sus integrantes ya no verán el trabajo del equipo (lo que escribieron no se borra).`)) return;
    await deleteDoc(doc(db, 'grupos', grupoActivo, 'equipos', eq.id));
  }));
}
// formulario «Formar equipos nuevos»: nombre, para qué tarea, cuántos y de cuántos
function pintarNueva() {
  const caja = document.getElementById('eq-nueva'); if (caja._para === NUEVA_PARA && caja.innerHTML) return; caja._para = NUEVA_PARA;
  const equipo = Object.values(TAREAS_DIG).filter(enEquipo);
  const hoy = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long' });
  const sug = NUEVA_PARA ? `Equipos para ${TAREAS_DIG[NUEVA_PARA].nombre}` : `Equipos del ${hoy}`;
  caja.innerHTML = `<h4 class="eq-sub" style="margin-top:0">➕ Formar equipos nuevos</h4>
    <p class="field-hint">Los equipos que ya tienes no se tocan: las tareas que los usan los siguen usando. Los nuevos tendrán sus propios códigos QR.</p>
    <label class="field-label" for="eqn-nombre">Nombre de esta formación</label><input id="eqn-nombre" type="text" maxlength="60" value="${escaparHTML(sug)}">
    <label class="field-label" for="eqn-tarea">¿Para qué tarea?</label><select id="eqn-tarea"><option value="">Ninguna por ahora (la asigno después)</option>${equipo.map(a => `<option value="${a.id}" ${a.id === NUEVA_PARA ? 'selected' : ''}>${escaparHTML(nombreTareaCorto(a))} — hoy usa «${escaparHTML(nombreF(formacionDeTarea(G_DATA, a.id)))}»</option>`).join('')}</select>
    <div class="eq-generar"><span>Generar</span><input id="eqn-n" type="number" min="1" max="20" value="6" aria-label="Número de equipos"><span>equipos de máximo</span><input id="eqn-max" type="number" min="1" max="15" value="4" aria-label="Máximo de integrantes"><span>integrantes, con código QR</span></div>
    <div class="equipo-botones"><button type="button" class="btn btn-primary" id="eqn-crear">Crear y generar los QR</button><button type="button" class="btn" id="eqn-cancelar">Cancelar</button></div>`;
  document.getElementById('eqn-cancelar').addEventListener('click', () => { NUEVA_PARA = ''; caja.hidden = true; caja._para = null; pintarEquipos(); });
  document.getElementById('eqn-crear').addEventListener('click', async () => {
    const nombre = document.getElementById('eqn-nombre').value.trim() || sug, tarea = document.getElementById('eqn-tarea').value;
    const n = Math.min(20, Math.max(1, parseInt(document.getElementById('eqn-n').value, 10) || 0)), max = Math.min(15, Math.max(1, parseInt(document.getElementById('eqn-max').value, 10) || 0));
    if (tarea && !confirm(`«${TAREAS_DIG[tarea].nombre}» va a usar estos equipos nuevos. Lo que ya hayan trabajado en ella con los equipos anteriores no se borra (vuelve a aparecer si regresas a esos equipos). ¿Continuar?`)) return;
    const fid = 'f' + Date.now().toString(36);
    await setDoc(doc(db, 'grupos', grupoActivo), { formaciones: { [fid]: { nombre, creada: Date.now(), abiertas: true } }, ...(tarea ? { equiposTarea: { [tarea]: fid } } : {}) }, { merge: true });
    await generarEquipos(fid, n, max);
    FSEL = fid; NUEVA_PARA = ''; caja.hidden = true; caja._para = null; pintarEquipos();
  });
}
async function generarEquipos(fid, n, max) {
  const base = Math.max(0, ...eqDeF(fid).map(x => x.numero || 0)), usados = new Set(EQUIPOS.map(e => e.codigo));
  await Promise.all(Array.from({ length: n }, (_, i) => setDoc(doc(db, 'grupos', grupoActivo, 'equipos', 'e' + Date.now().toString(36) + i),
    { nombre: `Equipo ${base + i + 1}`, numero: base + i + 1, codigo: codigoNuevo(usados), max, formacion: fid, integrantes: [], nombres: [], actualizado: serverTimestamp() })));
}
function pintarFormEquipo(eq) {
  document.getElementById('equipo-id').value = eq ? eq.id : '';
  document.getElementById('equipo-nombre').value = eq ? eq.nombre : '';
  document.getElementById('equipo-guardar').textContent = eq ? 'Guardar cambios' : 'Crear equipo';
  document.getElementById('equipo-cancelar').hidden = !eq;
  const enOtro = {}; eqDeF(FSEL).forEach(x => { if (!eq || x.id !== eq.id) (x.integrantes || []).forEach(i => { enOtro[i] = x.nombre; }); });
  const mios = new Set(eq ? eq.integrantes || [] : []);
  document.getElementById('equipo-alumnos').innerHTML = alumnosCache.map(a => `<label class="${enOtro[a.id] ? 'en-otro' : ''}"><input type="checkbox" value="${a.id}" ${mios.has(a.id) ? 'checked' : ''}> ${escaparHTML(a.nombre)}${enOtro[a.id] ? ` <small>(en «${escaparHTML(enOtro[a.id])}»)</small>` : ''}</label>`).join('');
}
const nombresDe = ids => ids.map(i => i === PRUEBA_ID ? PRUEBA_NOMBRE : (alumnosCache.find(a => a.id === i) || {}).nombre || i);
on('equipo-cancelar', 'click', () => pintarFormEquipo(null));
on('equipo-form', 'submit', async ev => {
  ev.preventDefault();
  const msg = document.getElementById('equipo-msg');
  const nombre = document.getElementById('equipo-nombre').value.trim();
  const ids = [...document.querySelectorAll('#equipo-alumnos input:checked')].map(i => i.value);
  if (!nombre || !ids.length) { msg.textContent = 'Escribe el nombre del equipo y elige al menos un integrante.'; msg.hidden = false; return; }
  const idEd = document.getElementById('equipo-id').value, id = idEd || ('e' + Date.now().toString(36));
  const previo = EQUIPOS.find(x => x.id === idEd) || {}, fid = idEd ? formacionDe(previo) : FSEL;
  try {
    // en una misma formación, un alumno solo puede estar en un equipo: se quita de los demás
    await Promise.all(eqDeF(fid).filter(x => x.id !== id && (x.integrantes || []).some(i => ids.includes(i))).map(x => {
      const integ = x.integrantes.filter(i => !ids.includes(i));
      return updateDoc(doc(db, 'grupos', grupoActivo, 'equipos', x.id), { integrantes: integ, nombres: nombresDe(integ) });
    }));
    await setDoc(doc(db, 'grupos', grupoActivo, 'equipos', id), {
      nombre, integrantes: ids, nombres: nombresDe(ids), codigo: previo.codigo || codigoNuevo(new Set(EQUIPOS.map(e => e.codigo))), max: Math.max(previo.max || 0, ids.length) || ids.length,
      numero: previo.numero || (Math.max(0, ...eqDeF(fid).map(x => x.numero || 0)) + 1), formacion: fid, actualizado: serverTimestamp()
    }, { merge: true });
    pintarFormEquipo(null);
    msg.textContent = 'Equipo guardado ✓'; msg.hidden = false; setTimeout(() => { msg.hidden = true; }, 2500);
  } catch (e) { msg.textContent = 'No se pudo guardar: ' + (e.message || e); msg.hidden = false; }
});
on('eq-generar', 'click', async () => {
  if (!grupoActivo) return;
  const n = Math.min(20, Math.max(1, parseInt(document.getElementById('eq-n').value, 10) || 0)), max = Math.min(15, Math.max(1, parseInt(document.getElementById('eq-max').value, 10) || 0));
  if (!confirm(`¿Agregar ${n} equipo${n === 1 ? '' : 's'} de máximo ${max} integrantes a «${nombreF(FSEL)}», cada uno con su código QR?${eqDeF(FSEL).length ? ' Los equipos que ya tiene se conservan.' : ''}`)) return;
  await generarEquipos(FSEL, n, max);
  if (!formaciones(G_DATA)[FSEL].abiertas) await alternarInscripciones(FSEL, true);
});
async function alternarInscripciones(fid, valor) {
  const v = typeof valor === 'boolean' ? valor : !formaciones(G_DATA)[fid].abiertas;
  await setDoc(doc(db, 'grupos', grupoActivo), { formaciones: { [fid]: { abiertas: v } }, ...(fid === BASE ? { equiposAbiertos: v } : {}) }, { merge: true });
}
on('eq-abierto', 'click', () => alternarInscripciones(FSEL));
function pintarProyeccion() {
  const grid = document.getElementById('qr-grid'), solo = grid.dataset.solo || '';
  const conCod = eqDeF(QR_FID).filter(e => e.codigo && (!solo || e.id === solo));
  const usan = tareasF(QR_FID);
  document.getElementById('qr-tit').textContent = `Únete a tu equipo · ${nombreF(QR_FID)}`;
  document.getElementById('qr-sub').textContent = `${usan.length ? 'Para: ' + usan.map(a => a.nombre).join(', ') + '. ' : ''}Escanea el código de tu equipo con la cámara del celular, o entra a Tareas y escribe sus 4 letras.${formaciones(G_DATA)[QR_FID].abiertas ? '' : ' (Las inscripciones están cerradas.)'}`;
  grid.classList.toggle('qr-uno', !!solo);
  grid.innerHTML = conCod.length ? conCod.map(eq => { const n = (eq.integrantes || []).length; return `<div class="qr-card"><h3>${escaparHTML(eq.nombre)}</h3>${qrSvg(urlUnir(eq.codigo), { titulo: eq.nombre })}<p class="qr-cod">${escaparHTML(eq.codigo)}</p><p class="qr-cupo">${n}${eq.max ? ` / ${eq.max}` : ''} integrantes${eq.max && n >= eq.max ? ' · completo' : ''}</p></div>`; }).join('')
    : '<p>Primero genera los equipos de esta formación.</p>';
}
function abrirProyeccion(fid, imprimir, solo) {
  escucharEquiposAdmin();
  QR_FID = fid || FSEL; document.getElementById('qr-grid').dataset.solo = solo || '';
  pintarProyeccion(); document.getElementById('qr-proyeccion').hidden = false; document.body.classList.add('con-qr');
  if (imprimir) setTimeout(() => window.print(), 400);
}
on('eq-proyectar', 'click', () => abrirProyeccion(FSEL, false));
on('eq-imprimir', 'click', () => abrirProyeccion(FSEL, true));
on('qr-cerrar', 'click', () => { document.getElementById('qr-proyeccion').hidden = true; document.body.classList.remove('con-qr'); });
// en Tareas digitales: qué equipos usa cada tarea en equipo
function pintarTdEquipos() {
  document.querySelectorAll('[data-eqt]').forEach(b => { const fid = formacionDeTarea(G_DATA, b.dataset.eqt); b.innerHTML = `👥 ${escaparHTML(nombreF(fid))} <small>(${eqDeF(fid).length})</small>`; });
  const caja = document.querySelector('.td-eqbox'); if (caja) pintarTdCaja(caja);
}
function pintarTdCaja(caja) {
  const id = caja.dataset.t, a = TAREAS_DIG[id], fid = formacionDeTarea(G_DATA, id), f = formaciones(G_DATA)[fid];
  const act = document.activeElement; if (act && caja.contains(act) && act.tagName === 'SELECT') return;
  caja.innerHTML = `<p><b>${a.icono} ${escaparHTML(a.nombre)}</b> usa los equipos de:</p>
    <select class="td-eqsel" aria-label="Formación de equipos de esta tarea">${ordenFormaciones(G_DATA).map(([k, x]) => `<option value="${k}" ${k === fid ? 'selected' : ''}>${escaparHTML(x.nombre)} (${eqDeF(k).length} equipo${eqDeF(k).length === 1 ? '' : 's'})</option>`).join('')}</select>
    <p class="field-hint" style="margin:6px 0">${eqDeF(fid).length} equipo${eqDeF(fid).length === 1 ? '' : 's'} · inscripciones ${f.abiertas ? 'abiertas 🔓' : 'cerradas 🔒'}. Lo que un equipo trabaja en esta tarea se queda con ese equipo.</p>
    <div class="td-eqacc"><button type="button" class="btn btn-small btn-primary" data-x="nueva">➕ Formar equipos nuevos solo para esta tarea</button><button type="button" class="btn btn-small" data-x="proy">📽️ Proyectar sus QR</button><button type="button" class="btn btn-small" data-x="imp">🖨️ Imprimir</button><button type="button" class="btn btn-small" data-x="ab">${f.abiertas ? '🔒 Cerrar inscripciones' : '🔓 Abrir inscripciones'}</button><button type="button" class="btn btn-small" data-x="ver">Editar equipos →</button></div>`;
  caja.querySelector('.td-eqsel').addEventListener('change', async e => {
    const nf = e.target.value;
    if (!confirm(`¿«${a.nombre}» usará los equipos de «${nombreF(nf)}»? Lo que ya hayan trabajado con los equipos anteriores no se borra.`)) { e.target.value = fid; return; }
    await setDoc(doc(db, 'grupos', grupoActivo), { equiposTarea: { [id]: nf } }, { merge: true });
  });
  caja.querySelectorAll('[data-x]').forEach(b => b.addEventListener('click', () => {
    const x = b.dataset.x;
    if (x === 'nueva') irAEquipos(fid, id);
    else if (x === 'proy') abrirProyeccion(fid, false);
    else if (x === 'imp') abrirProyeccion(fid, true);
    else if (x === 'ab') alternarInscripciones(fid);
    else irAEquipos(fid);
  }));
}


// ---- Tareas digitales: catálogo, abrir/cerrar y calificar con sugerencia
async function cargarTareasDig() {
  const cont = document.getElementById('td-lista'); if (!cont) return;
  if (!grupoActivo) { cont.innerHTML = '<p class="empty-inline">Elige un grupo primero.</p>'; return; }
  cont.innerHTML = '<p class="empty-inline">Cargando…</p>';
  let est = {}, enCat = new Set();
  try { const g = await getDoc(doc(db, 'grupos', grupoActivo)); est = (g.exists() && g.data().tareasDig) || {}; } catch { /* */ }
  try { const sn = await getDocs(collection(db, 'grupos', grupoActivo, 'tareas_catalogo')); sn.forEach(d => { if (d.id.startsWith('dig-')) enCat.add(d.id); }); } catch { /* */ }
  cont.innerHTML = TEMAS_TAREAS.map(t => `<div class="td-tema"><p class="td-tit"><b>${escaparHTML(t.tema)} · ${escaparHTML(t.titulo)}</b> <small>${escaparHTML(t.fechaTexto)}</small></p>${t.acts.filter(califica).map(a => {
    const cat = enCat.has(catalogoId(a.id)), ab = !(est[a.id] && est[a.id].abierta === false);
    return `<div class="td-fila"><span class="td-nom">${a.icono} ${escaparHTML(a.nombre)}</span>
      <button type="button" class="btn btn-small td-cat ${cat ? 'si' : ''}" data-cat="${a.id}" ${cat ? 'disabled' : ''}>${cat ? '✓ En el catálogo' : '+ Agregar al catálogo'}</button>
      <button type="button" class="btn btn-small td-ab ${ab ? 'si' : 'no'}" data-ab="${a.id}">${ab ? '🔓 Abierta' : '🔒 Cerrada'}</button>
      ${enEquipo(a) ? `<button type="button" class="btn btn-small td-eq" data-eqt="${a.id}" aria-expanded="false">👥 Equipos</button>` : ''}
      <button type="button" class="btn btn-small btn-primary" data-cal="${a.id}">Calificar</button></div>`;
  }).join('')}</div>`).join('');
  cont.querySelectorAll('[data-cat]').forEach(b => b.addEventListener('click', async () => {
    const a = TAREAS_DIG[b.dataset.cat];
    if (!confirm(`¿Agregar «${nombreCatalogo(a)}» a las tareas del Parcial 2?\n\nDesde este momento cuenta para la calificación: a quien no la entregue le contará como cero en el promedio de tareas.`)) return;
    await setDoc(doc(db, 'grupos', grupoActivo, 'tareas_catalogo', catalogoId(a.id)), { nombre: nombreCatalogo(a), fecha: a.fecha, parcial: 'p2', digital: a.id, creado: serverTimestamp() });
    cargarTareasDig(); cargarCatalogo('tareas');
  }));
  cont.querySelectorAll('[data-ab]').forEach(b => b.addEventListener('click', async () => {
    const id = b.dataset.ab, ab = !(est[id] && est[id].abierta === false);
    if (ab && !confirm('¿Cerrar la tarea? Los alumnos ya no podrán hacer cambios (lo que llevan se conserva).')) return;
    await setDoc(doc(db, 'grupos', grupoActivo), { tareasDig: { [id]: { abierta: !ab } } }, { merge: true });
    cargarTareasDig();
  }));
  escucharEquiposAdmin(); pintarTdEquipos();
  cont.querySelectorAll('[data-eqt]').forEach(b => b.addEventListener('click', () => {
    const previa = cont.querySelector('.td-eqbox'), mismo = previa && previa.dataset.t === b.dataset.eqt;
    if (previa) previa.remove(); cont.querySelectorAll('[data-eqt]').forEach(x => x.setAttribute('aria-expanded', 'false'));
    if (mismo) return;
    const caja = document.createElement('div'); caja.className = 'td-eqbox'; caja.dataset.t = b.dataset.eqt;
    b.closest('.td-fila').after(caja); b.setAttribute('aria-expanded', 'true'); pintarTdCaja(caja);
  }));
  cont.querySelectorAll('[data-cal]').forEach(b => b.addEventListener('click', () => calificarTareaDig(TAREAS_DIG[b.dataset.cal], enCat.has(catalogoId(b.dataset.cal)))));
}

async function calificarTareaDig(a, enCatalogo) {
  const wrap = document.getElementById('td-calificar'); wrap.hidden = false;
  wrap.innerHTML = '<p class="empty-inline">Reuniendo el trabajo de cada alumno…</p>';
  wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const g = grupoActivo, A = CUADROS[a.id];
  let equipos = [];
  try { const [gs, sn] = await Promise.all([getDoc(doc(db, 'grupos', g)), getDocs(collection(db, 'grupos', g, 'equipos'))]); equipos = equiposDe(sn.docs.map(d => ({ id: d.id, ...d.data() })), formacionDeTarea(gs.exists() ? gs.data() : {}, a.id)); } catch { /* */ }
  const cacheEq = {};
  const docEquipo = async eq => { if (!(eq.id in cacheEq)) { try { const s = await getDoc(doc(db, 'grupos', g, 'equipos', eq.id, 'atlas', A.id)); cacheEq[eq.id] = s.exists() ? s.data() : null; } catch { cacheEq[eq.id] = null; } } return cacheEq[eq.id]; };
  const filas = await Promise.all(alumnosCache.map(async al => {
    const eq = equipos.find(e => (e.integrantes || []).includes(al.id)) || null;
    let sug = { nota: 0, detalle: 'Sin trabajo' }, entregado = null, resumen = '', cal = '';
    try { const c = await getDoc(doc(db, 'grupos', g, 'alumnos', al.id, 'tareas', catalogoId(a.id))); if (c.exists()) cal = c.data().calificacion ?? ''; } catch { /* */ }
    try {
      let datos = eq ? await docEquipo(eq) : null;
      if (!datos) { const s = await getDoc(doc(db, 'grupos', g, 'alumnos', al.id, 'atlas', A.ind)); datos = s.exists() ? s.data() : null; }
      if (datos) { sug = sugerirCuadro(A, datos.celdas); entregado = datos.entregado || null; resumen = A.filas.map(([f, t]) => `${t}: ${A.columnas.map(([c]) => ((datos.celdas || {})[`${f}_${c}`] || '').trim().split(/\s+/).filter(Boolean).length >= MIN_PALABRAS_CELDA ? '●' : '○').join('')}`).join(' · '); }
    } catch { /* */ }
    return { al, eq, sug, entregado, resumen, cal };
  }));
  const f = t => t && t.toDate ? t.toDate().toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : typeof t === 'number' ? new Date(t).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
  const inv = A.filas.filter(x => x[3]).length;
  wrap.innerHTML = `<h4 class="td-h4">Calificar: ${escaparHTML(nombreCatalogo(a))}</h4>
    ${enCatalogo ? '' : '<p class="aviso-td">⚠️ Esta tarea todavía no está en el catálogo: las calificaciones se guardan, pero no cuentan en el promedio hasta que la agregues.</p>'}
    <p class="field-hint">La calificación sugerida sale de qué tan completo está el cuadro: ${inv ? `8 puntos por las ${A.filas.length * A.columnas.length} celdas llenas (cuenta la que tiene ${MIN_PALABRAS_CELDA} palabras o más) y 2 por ${inv === 1 ? 'la fuente de la fila' : 'las fuentes de las filas'} de investigación` : 'celdas llenas'}. En equipo, todos reciben la misma sugerencia; puedes ajustar a quien no aportó (en el Monitor ves quién escribió qué).</p>
    <div class="quiz-actions" style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:10px;"><button type="button" class="btn btn-ghost-dark btn-small" id="td-usar">Usar sugeridas en las vacías</button><button type="button" class="btn btn-ghost-dark btn-small" id="td-cerrar">Cerrar</button></div>
    <div class="taller-tabla-wrap"><table class="taller-tabla td-tabla"><thead><tr><th>Alumno</th><th>Trabajo</th><th>Entrega</th><th>Sugerida</th><th>Calificación</th></tr></thead><tbody>
    ${filas.map(x => `<tr data-id="${x.al.id}"><td><b>${escaparHTML(x.al.nombre)}</b>${x.eq ? `<br><small>👥 ${escaparHTML(x.eq.nombre)}</small>` : ''}</td>
      <td><small>${escaparHTML(x.sug.detalle)}</small>${x.resumen ? `<details><summary>Ver</summary><small>${escaparHTML(x.resumen)}</small></details>` : ''}</td>
      <td>${x.entregado ? `<span class="td-ok">✓ ${escaparHTML(f(x.entregado.t))}</span>` : '<span class="td-no">No entregada</span>'}</td>
      <td><b class="td-sug">${x.sug.nota}</b></td>
      <td><input type="number" min="0" max="10" step="0.1" class="calif-input td-in" value="${x.cal}" placeholder="0-10" data-sug="${x.sug.nota}"></td></tr>`).join('')}</tbody></table></div>
    <button type="button" class="btn btn-primary btn-block" id="td-guardar">Guardar calificaciones</button><p class="save-msg" id="td-msg" hidden></p>`;
  document.getElementById('td-cerrar').addEventListener('click', () => { wrap.hidden = true; });
  document.getElementById('td-usar').addEventListener('click', () => wrap.querySelectorAll('.td-in').forEach(i => { if (i.value === '') i.value = i.dataset.sug; }));
  document.getElementById('td-guardar').addEventListener('click', async () => {
    const msg = document.getElementById('td-msg'), escr = [];
    wrap.querySelectorAll('tr[data-id]').forEach(tr => {
      const i = tr.querySelector('.td-in'), ref = doc(db, 'grupos', g, 'alumnos', tr.dataset.id, 'tareas', catalogoId(a.id));
      if (i.value === '') escr.push(deleteDoc(ref).catch(() => {}));
      else escr.push(setDoc(ref, { parcial: 'p2', nombre: nombreCatalogo(a), fecha: a.fecha, calificacion: Math.max(0, Math.min(10, parseFloat(i.value))), actualizado: serverTimestamp() }));
    });
    try { await Promise.all(escr); msg.textContent = '✓ Calificaciones guardadas. Ya se ven en Mi progreso.'; msg.hidden = false; }
    catch (e) { msg.textContent = 'No se pudo guardar: ' + (e.message || e); msg.hidden = false; }
  });
}

// ---- Monitor en vivo de los cuadros: equipos y alumnos solos, celdas llenas al instante, detalle y clave
const MON = { act: null, subs: [], eqSubs: [], datos: {}, todos: [], equipos: [], g: {}, grupo: null, reloj: null, abierto: null, clave: false };
const MON_ACTS = () => Object.values(TAREAS_DIG).filter(a => a.tipo === 'cuadro');
const ordenEqMon = (x, y) => (x.numero || 999) - (y.numero || 999) || (x.nombre || '').localeCompare(y.nombre || '', 'es');
function iniciarMonitor() {
  const grid = document.getElementById('mon-grid'); if (!grid) return;
  if (!grupoActivo) { grid.innerHTML = '<p class="empty-inline">Elige un grupo primero.</p>'; return; }
  const acts = MON_ACTS(); MON.act = MON.act || acts[0].id;
  const ca = document.getElementById('mon-act');
  if (!ca._listo) {
    ca._listo = true;
    ca.innerHTML = '<span>Actividad:</span>' + acts.map(a => `<button type="button" class="chip-mon" data-a="${a.id}" aria-pressed="${a.id === MON.act}">${a.icono} ${escaparHTML(a.nombre)}</button>`).join('')
      + '<button type="button" class="chip-mon mon-clave" id="mon-clave" aria-pressed="false">🔑 Liberar clave</button><button type="button" class="chip-mon" id="mon-qr">🔳 Códigos QR</button><button type="button" class="chip-mon" id="mon-full" aria-pressed="false">⛶ Pantalla completa</button>';
    ca.querySelectorAll('[data-a]').forEach(b => b.addEventListener('click', () => { MON.act = b.dataset.a; ca.querySelectorAll('[data-a]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); Object.keys(MON.datos).forEach(k => delete MON.datos[k]); pintarClaveMon(); suscribirMon(); pintarMonitor(); }));
    document.getElementById('mon-clave').addEventListener('click', async () => { const k = CUADROS[MON.act].clave; await setDoc(doc(db, 'grupos', grupoActivo), { claves: { [k]: !MON.clave } }, { merge: true }); });
    document.getElementById('mon-qr').addEventListener('click', () => abrirProyeccion(formacionDeTarea(MON.g, MON.act), false));
    document.getElementById('mon-full').addEventListener('click', e => { const on = document.body.classList.toggle('mon-completo'); e.currentTarget.setAttribute('aria-pressed', String(on)); e.currentTarget.textContent = on ? '✕ Salir de pantalla completa' : '⛶ Pantalla completa'; });
    document.getElementById('mon-det-cerrar').addEventListener('click', cerrarDetalle);
    document.getElementById('mon-detalle').addEventListener('click', e => { if (e.target.id === 'mon-detalle') cerrarDetalle(); });
  }
  detenerMonitor();
  MON.grupo = grupoActivo; MON.datos = {}; MON.todos = []; MON.equipos = []; MON.g = {};
  MON.subs.push(onSnapshot(doc(db, 'grupos', grupoActivo), sn => { MON.g = sn.exists() ? sn.data() : {}; pintarClaveMon(); const antes = MON.equipos.map(e => e.id).join(); filtrarMon(); if (antes !== MON.equipos.map(e => e.id).join()) { suscribirMon(); pintarMonitor(); } }, () => {}));
  MON.subs.push(onSnapshot(collection(db, 'grupos', grupoActivo, 'equipos'), sn => { MON.todos = sn.docs.map(d => ({ id: d.id, ...d.data() })); suscribirMon(); pintarMonitor(); }, () => {}));
  MON.reloj = setInterval(() => document.querySelectorAll('.mon-card').forEach(c => pintarTiempoMon(c, (MON.datos[c.dataset.clave] || {}).actualizado)), 10000);
  pintarMonitor();
}
function pintarClaveMon() { const b = document.getElementById('mon-clave'); if (!b || !MON.act) return; b.hidden = !!CUADROS[MON.act].sinClave; MON.clave = !!((MON.g.claves || {})[CUADROS[MON.act].clave]); b.setAttribute('aria-pressed', String(MON.clave)); b.textContent = MON.clave ? '🔒 Ocultar clave a los alumnos' : '🔑 Liberar clave'; }
function filtrarMon() { MON.equipos = equiposDe(MON.todos, formacionDeTarea(MON.g, MON.act)).sort(ordenEqMon); }
function suscribirMon() {
  MON.eqSubs.forEach(u => u()); MON.eqSubs = []; filtrarMon();
  const A = CUADROS[MON.act];
  MON.equipos.forEach(eq => MON.eqSubs.push(onSnapshot(doc(db, 'grupos', MON.grupo, 'equipos', eq.id, 'atlas', A.id), sn => { MON.datos['e:' + eq.id] = sn.exists() ? sn.data() : null; actualizarMon('e:' + eq.id); }, () => {})));
  alumnosCache.forEach(al => MON.eqSubs.push(onSnapshot(doc(db, 'grupos', MON.grupo, 'alumnos', al.id, 'atlas', A.ind), sn => { MON.datos['i:' + al.id] = sn.exists() ? { ...sn.data(), ultimoNombre: sn.data().ultimoNombre || al.nombre } : null; actualizarMon('i:' + al.id); }, () => {})));
}
function detenerMonitor() {
  document.body.classList.remove('mon-completo');
  MON.subs.forEach(u => u()); MON.subs = []; MON.eqSubs.forEach(u => u()); MON.eqSubs = [];
  clearInterval(MON.reloj); MON.reloj = null;
}
function tarjetasMon() {
  const out = MON.equipos.map(eq => ({ clave: 'e:' + eq.id, titulo: eq.nombre, sub: (eq.nombres || []).join(', ') || 'sin integrantes', tipo: 'equipo' }));
  alumnosCache.forEach(a => { if (MON.datos['i:' + a.id]) out.push({ clave: 'i:' + a.id, titulo: a.nombre, sub: 'trabajo individual', tipo: 'alumno' }); });
  return out;
}
function haceMon(ts) { const t = ts && ts.toMillis ? ts.toMillis() : typeof ts === 'number' ? ts : 0; if (!t) return { txt: 'sin actividad', cls: 'gris' }; const s = Math.max(0, (Date.now() - t) / 1000); return { txt: s < 60 ? `hace ${Math.round(s)} s` : s < 3600 ? `hace ${Math.round(s / 60)} min` : new Date(t).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }), cls: s < 120 ? 'verde' : s < 300 ? 'amarillo' : 'gris' }; }
function pintarTiempoMon(card, ts) { const h = haceMon(ts), p = card.querySelector('[data-punto]'); if (p) { p.className = 'mon-punto ' + h.cls; p.textContent = h.txt; } }
function pintarMonitor() {
  const grid = document.getElementById('mon-grid'); if (!grid || !MON.act) return;
  const ts = tarjetasMon(), A = CUADROS[MON.act];
  document.getElementById('mon-resumen').innerHTML = `${escaparHTML(TAREAS_DIG[MON.act].nombre)} · ${ts.length} en total · 👥 ${escaparHTML((formaciones(MON.g)[formacionDeTarea(MON.g, MON.act)] || {}).nombre || '')}`;
  grid.innerHTML = ts.length ? ts.map(t => `<button type="button" class="mon-card" data-clave="${t.clave}"><div class="mon-card-cab"><span class="mon-tipo">${t.tipo === 'equipo' ? '👥' : '👤'}</span><div><b>${escaparHTML(t.titulo)}</b><small>${escaparHTML(t.sub)}</small></div><span class="mon-punto" data-punto></span></div>
      <div class="mon-mapa" data-mapa></div><div class="mon-barra"><i data-barra></i></div><p class="mon-num" data-num></p><p class="mon-ult" data-ult></p></button>`).join('')
    : '<p class="empty-inline">Todavía no hay equipos para esta actividad ni alumnos trabajándola solos. Forma los equipos en Tareas → Tareas digitales → 👥, o desde 🔳 Códigos QR si ya existen.</p>';
  grid.querySelectorAll('.mon-card').forEach(b => { actualizarMon(b.dataset.clave, true); b.addEventListener('click', () => abrirDetalle(b.dataset.clave)); });
  const sin = alumnosCache.filter(a => !MON.datos['i:' + a.id] && !MON.equipos.some(e => (e.integrantes || []).includes(a.id)));
  document.getElementById('mon-sin').textContent = sin.length ? `Sin equipo y sin empezar: ${sin.map(a => a.nombre).join(', ')}.` : '';
  void A;
}
function actualizarMon(clave, nuevo) {
  const card = document.querySelector(`.mon-card[data-clave="${clave}"]`);
  if (!card) { if (clave.startsWith('i:') && MON.datos[clave]) pintarMonitor(); return; }
  const A = CUADROS[MON.act], d = MON.datos[clave] || {}, cel = d.celdas || {};
  const ok = k => ((cel[k] || '').trim().match(/\S+/g) || []).length >= MIN_PALABRAS_CELDA;
  const total = A.filas.length * A.columnas.length, llenas = A.filas.flatMap(([f]) => A.columnas.map(([c]) => ok(`${f}_${c}`))).filter(Boolean).length;
  card.querySelector('[data-mapa]').innerHTML = `<div class="cu-mini" style="grid-template-columns:repeat(${A.columnas.length},1fr)">${A.filas.map(([f]) => A.columnas.map(([c, , col]) => `<i style="${ok(`${f}_${c}`) ? `background:${col}` : (cel[`${f}_${c}`] || '').trim() ? `background:${col};opacity:.35` : ''}"></i>`).join('')).join('')}</div>`;
  card.querySelector('[data-barra]').style.width = Math.round(100 * llenas / total) + '%';
  card.querySelector('[data-num]').innerHTML = `<b>${llenas}/${total}</b> celdas · sugerida <b>${sugerirCuadro(A, cel).nota}</b>${d.entregado ? ' · ✅ entregada' : ''}`;
  card.querySelector('[data-ult]').innerHTML = d.ultimoCambio ? `✍️ <b>${escaparHTML(d.ultimoNombre || '')}</b> ${escaparHTML(d.ultimoCambio)}` : '<i>todavía no empiezan</i>';
  pintarTiempoMon(card, d.actualizado || null);
  if (!nuevo) { card.classList.remove('mon-latido'); void card.offsetWidth; card.classList.add('mon-latido'); }
  if (MON.abierto === clave) pintarDetalle();
}
function abrirDetalle(clave) { MON.abierto = clave; document.getElementById('mon-detalle').hidden = false; document.body.classList.add('con-qr'); pintarDetalle(); }
function cerrarDetalle() { MON.abierto = null; document.getElementById('mon-detalle').hidden = true; document.body.classList.remove('con-qr'); }
function pintarDetalle() {
  const clave = MON.abierto; if (!clave) return;
  const A = CUADROS[MON.act], t = tarjetasMon().find(x => x.clave === clave) || { titulo: '', sub: '' }, d = MON.datos[clave] || {}, cel = d.celdas || {}, por = d.por || {};
  const e = x => escaparHTML(x || '').replace(/\n/g, '<br>');
  document.getElementById('mon-det-titulo').textContent = t.titulo;
  document.getElementById('mon-det-sub').textContent = `${t.sub} · ${TAREAS_DIG[MON.act].nombre} · ${haceMon(d.actualizado).txt}`;
  document.getElementById('mon-det-cuerpo').innerHTML = `<div class="taller-tabla-wrap"><table class="cu-det"><thead><tr><th></th>${A.columnas.map(([, n, col]) => `<th style="color:${col}">${n}</th>`).join('')}</tr></thead><tbody>${A.filas.map(([f, n, , inv]) => `<tr><th>${inv ? '🔎 ' : ''}${n}${inv ? `<br><small class="mon-autor">📚 ${(cel[f + '_fuente'] || '').trim() ? escaparHTML(cel[f + '_fuente']) : '<i>sin fuente</i>'}</small>` : ''}</th>${A.columnas.map(([c]) => { const k = `${f}_${c}`; return `<td>${(cel[k] || '').trim() ? e(cel[k]) : '<span class="mon-vacio">—</span>'}${por[k] ? `<br><small class="mon-autor">✍️ ${escaparHTML(por[k])}</small>` : ''}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div>`;
}

// ---- ⚡ Arena en vivo (docente): grupos/{g}/arena/sala y .../sala/jugadores/{alumno}
const AR = { sala: null, jug: [], subs: [], reloj: null, auto: null };
const AR_COL = [['▲', '#C0503F'], ['◆', '#2E6FA8'], ['●', '#D9A441'], ['■', '#3F7A4F']];
const arPts = (r, dur) => r && r.o === 0 ? Math.round(500 + 500 * Math.max(0, 1 - (r.ms || 0) / ((dur || 20) * 1000))) : 0;
const arTot = j => Object.values((j.ronda === (AR.sala || {}).ronda && j.r) || {}).reduce((s, r) => s + arPts(r, (AR.sala || {}).dur), 0);
const arRef = () => doc(db, 'grupos', grupoActivo, 'arena', 'sala');
// ---- 🧪 Probar como alumno: abre Tareas como «Docente (prueba)» en el grupo elegido (ver tareas.js, arrancar()).
function probarComo(destino = '') {
  if (!grupoActivo) { alert('Elige un grupo primero.'); return; }
  window.open(`tareas.html?prueba=${encodeURIComponent(grupoActivo)}#${destino}`, '_blank');
}
on('prueba-abrir', 'click', () => probarComo(''));
on('prueba-borrar', 'click', async () => {
  if (!grupoActivo) { alert('Elige un grupo primero.'); return; }
  if (!confirm('¿Borrar todo lo que hiciste como alumno de prueba en este grupo? (cuadros, estrellas, votos de Arena y Tribunal, coevaluaciones y tu lugar en los equipos)')) return;
  const msg = document.getElementById('prueba-msg'); msg.hidden = false; msg.textContent = 'Borrando…';
  let n = 0;
  try {
    for (const sub of ['atlas', 'tareas', 'actividades', 'investigacion']) {
      const sn = await getDocs(collection(db, 'grupos', grupoActivo, 'alumnos', PRUEBA_ID, sub)).catch(() => null);
      if (sn) for (const d of sn.docs) { await deleteDoc(d.ref); n++; }
    }
    for (const sala of ['sala', 'tribunal']) { const r = doc(db, 'grupos', grupoActivo, 'arena', sala, 'jugadores', PRUEBA_ID); if ((await getDoc(r)).exists()) { await deleteDoc(r); n++; } }
    const eqs = await getDocs(collection(db, 'grupos', grupoActivo, 'equipos'));
    for (const d of eqs.docs) {
      const e = d.data(), i = (e.integrantes || []).indexOf(PRUEBA_ID);
      if (i < 0) continue;
      const integrantes = e.integrantes.filter(x => x !== PRUEBA_ID), nombres = (e.nombres || []).filter(x => x !== PRUEBA_NOMBRE);
      await updateDoc(d.ref, { integrantes, nombres }); n++;
    }
    msg.textContent = n ? `✓ Listo: ${n === 1 ? 'se borró 1 registro' : `se borraron ${n} registros`} de prueba. Si tenías Tareas abierto como alumno de prueba, dale «Salir» para limpiar también ese navegador.` : 'No había nada de prueba en este grupo.';
  } catch (e) { msg.textContent = 'No se pudo borrar todo: ' + (e.message || e); }
});
document.getElementById('cielo-proyectar')?.addEventListener('click', () => {
  if (!grupoActivo) { alert('Elige un grupo primero.'); return; }
  window.open(`laboratorio.html?cielo=${encodeURIComponent(grupoActivo)}#constelacion`, '_blank', 'noopener');
});
function iniciarArena() {
  const cont = document.getElementById('ar-panel'); if (!cont) return;
  if (!grupoActivo) { cont.innerHTML = '<p class="empty-inline">Elige un grupo primero.</p>'; return; }
  detenerArena();
  AR.grupo = grupoActivo;
  AR.subs.push(onSnapshot(arRef(), sn => { AR.sala = sn.exists() ? sn.data() : null; pintarArena(); }, () => {}));
  AR.subs.push(onSnapshot(collection(db, 'grupos', grupoActivo, 'arena', 'sala', 'jugadores'), sn => { AR.jug = sn.docs.map(d => ({ id: d.id, ...d.data() })); pintarArena(true); }, () => {}));
}
function detenerArena() { AR.subs.forEach(u => u()); AR.subs = []; clearInterval(AR.reloj); AR.reloj = null; }
const arJug = () => AR.jug.filter(j => AR.sala && j.ronda === AR.sala.ronda);
async function arEstado(cambios) { await setDoc(arRef(), cambios, { merge: true }); }
async function arPregunta(idx) {
  const P = ARENA[AR.sala.set].preguntas[idx], orden = [0, 1, 2, 3].slice(0, P.o.length).sort(() => Math.random() - .5);
  await arEstado({ estado: 'pregunta', idx, orden, t0: Date.now() });
}
function pintarArena(soloJug) {
  const cont = document.getElementById('ar-panel'); if (!cont) return;
  const S = AR.sala, js = S ? arJug() : [];
  if (soloJug && S && S.estado === 'pregunta') { const n = js.filter(j => (j.r || {})[S.idx]).length, el = document.getElementById('ar-resp'); if (el) el.textContent = `${n} de ${js.length} respondieron`; if (n && n === js.length) arRevelar(); return; }
  if (soloJug && S && S.estado === 'espera') { const el = document.getElementById('ar-unidos'); if (el) el.innerHTML = arUnidosHTML(js); return; }
  clearInterval(AR.reloj); AR.reloj = null;
  const proy = document.getElementById('ar-proy');
  if (!S || !S.estado || S.estado === 'cerrada') {
    cont.innerHTML = `<div class="bloques-activos-card"><h3 class="section-title" style="margin-top:0">⚡ Abrir una Arena</h3>
      <p class="field-hint">Elige las preguntas, abre la sala y proyecta: los alumnos entran desde su celular (Tareas → ⚡ Arena en vivo, o con el QR). Cada pregunta dura el tiempo que elijas; gana más quien responde bien y rápido.</p>
      <label class="field-label" for="ar-set">Preguntas</label><select id="ar-set">${Object.entries(ARENA).sort((x, y) => x[0].localeCompare(y[0])).map(([k, v]) => `<option value="${k}">${escaparHTML(v.titulo)} (${v.preguntas.length} preguntas)</option>`).join('')}</select>
      <label class="field-label" for="ar-dur">Segundos por pregunta</label><select id="ar-dur"><option>15</option><option selected>20</option><option>30</option></select>
      <button type="button" class="btn btn-primary btn-block" id="ar-abrir" style="margin-top:12px">Abrir la sala y proyectar</button></div>`;
    document.getElementById('ar-abrir').addEventListener('click', async () => {
      const set = document.getElementById('ar-set').value;
      await setDoc(arRef(), { estado: 'espera', set, n: ARENA[set].preguntas.length, dur: Number(document.getElementById('ar-dur').value), idx: 0, ronda: 'r' + Date.now().toString(36), orden: [0, 1, 2, 3] });
      abrirProyArena();
    });
    proy.hidden = true; document.body.classList.remove('con-qr');
    return;
  }
  const P = ARENA[S.set].preguntas[S.idx] || null;
  cont.innerHTML = `<div class="bloques-activos-card"><p><b>⚡ ${escaparHTML(ARENA[S.set].titulo)}</b> · ${js.length} jugador${js.length === 1 ? '' : 'es'} · estado: <b>${{ espera: 'esperando jugadores', pregunta: `pregunta ${S.idx + 1} de ${S.n}`, revela: `respuesta ${S.idx + 1} de ${S.n}`, fin: 'terminada' }[S.estado]}</b></p>
    <div class="eq-acciones"><button type="button" class="btn btn-primary" id="ar-ver">📽️ Proyectar</button><button type="button" class="btn" id="ar-yo">🧪 Jugar como alumno</button><button type="button" class="btn" id="ar-cerrar">Cerrar la Arena</button></div>
    <p class="field-hint">Los alumnos responden en su celular: Tareas → ⚡ Arena en vivo, o con el QR de la proyección. Para probarla tú, «🧪 Jugar como alumno» abre otra pestaña ya dentro de la Arena (fuera de concurso).</p></div>`;
  document.getElementById('ar-ver').addEventListener('click', abrirProyArena);
  document.getElementById('ar-yo').addEventListener('click', () => probarComo('arena'));
  document.getElementById('ar-cerrar').addEventListener('click', async () => { if (confirm('¿Cerrar la Arena? Se borra el marcador de esta ronda en las pantallas.')) { await arEstado({ estado: 'cerrada' }); } });
  // proyección
  const cuerpo = document.getElementById('ar-proy-cuerpo'), url = new URL('tareas.html#arena', location.href).href;
  const ranking = () => js.filter(j => j.id !== PRUEBA_ID).map(j => ({ n: j.nombre, p: arTot(j) })).sort((a, b) => b.p - a.p);
  if (S.estado === 'espera') {
    cuerpo.innerHTML = `<div class="arp-espera"><div><h2>⚡ ${escaparHTML(ARENA[S.set].titulo)}</h2><p>Entra desde tu celular: <b>Aula Virtual → Tareas → ⚡ Arena en vivo</b>, o escanea el código.</p><div id="ar-unidos" class="arp-unidos">${arUnidosHTML(js)}</div>
      <button type="button" class="btn btn-primary arp-boton" id="ar-empezar">▶ Empezar</button></div><div class="arp-qr">${qrSvg(url, { titulo: 'Arena' })}</div></div>`;
    document.getElementById('ar-empezar').addEventListener('click', () => arPregunta(0));
  } else if (S.estado === 'pregunta' && P) {
    const fin = (S.t0 || Date.now()) + S.dur * 1000;
    cuerpo.innerHTML = `<div class="arp-cab"><span>Pregunta ${S.idx + 1} de ${S.n}</span><span class="arp-seg" id="ar-seg">${S.dur}</span><span id="ar-resp">${js.filter(j => (j.r || {})[S.idx]).length} de ${js.length} respondieron</span></div>
      <h2 class="arp-q">${escaparHTML(P.q)}</h2><div class="arp-ops">${S.orden.map((o, k) => `<div class="arp-op" style="--c:${AR_COL[k][1]}"><span>${AR_COL[k][0]}</span>${escaparHTML(P.o[o])}</div>`).join('')}</div>
      <button type="button" class="btn arp-boton" id="ar-ya">Mostrar respuesta</button>`;
    document.getElementById('ar-ya').addEventListener('click', arRevelar);
    AR.reloj = setInterval(() => { const q = Math.ceil((fin - Date.now()) / 1000), el = document.getElementById('ar-seg'); if (el) el.textContent = Math.max(0, q); if (q <= 0) arRevelar(); }, 250);
  } else if (S.estado === 'revela' && P) {
    const cuenta = [0, 0, 0, 0]; js.forEach(j => { const r = (j.r || {})[S.idx]; if (r) cuenta[r.o]++; });
    const max = Math.max(1, ...cuenta), rk = ranking().slice(0, 5);
    cuerpo.innerHTML = `<div class="arp-cab"><span>Pregunta ${S.idx + 1} de ${S.n}</span><span>${cuenta.reduce((a, b) => a + b, 0)} respuestas</span></div>
      <h2 class="arp-q">${escaparHTML(P.q)}</h2>
      <div class="arp-barras">${S.orden.map((o, k) => `<div class="arp-barra ${o === 0 ? 'ok' : ''}" style="--c:${AR_COL[k][1]}"><i style="height:${Math.round(100 * cuenta[o] / max)}%"></i><b>${cuenta[o]}</b><span>${AR_COL[k][0]} ${escaparHTML(P.o[o])}${o === 0 ? ' ✓' : ''}</span></div>`).join('')}</div>
      <p class="arp-x">${escaparHTML(P.x)}</p>
      <div class="arp-pie"><ol class="arp-top">${rk.map((x, k) => `<li><span>${['🥇', '🥈', '🥉', '4.º', '5.º'][k]}</span>${escaparHTML(x.n)}<b>${x.p}</b></li>`).join('')}</ol>
      <button type="button" class="btn btn-primary arp-boton" id="ar-sig">${S.idx + 1 < S.n ? 'Siguiente pregunta →' : '🏁 Ver resultados'}</button></div>`;
    document.getElementById('ar-sig').addEventListener('click', () => S.idx + 1 < S.n ? arPregunta(S.idx + 1) : arEstado({ estado: 'fin' }));
  } else if (S.estado === 'fin') {
    const rk = ranking().slice(0, 5);
    cuerpo.innerHTML = `<div class="arp-fin"><h2>🏁 ¡Terminó la Arena!</h2><p>${escaparHTML(ARENA[S.set].titulo)} · ${js.length} jugadores</p>
      <ol class="arp-podio">${rk.map((x, k) => `<li class="p${k + 1}"><span>${['🥇', '🥈', '🥉', '4.º', '5.º'][k]}</span><b>${escaparHTML(x.n)}</b><em>${x.p} pts</em></li>`).join('')}</ol>
      <button type="button" class="btn arp-boton" id="ar-otra">Nueva Arena</button></div>`;
    document.getElementById('ar-otra').addEventListener('click', () => arEstado({ estado: 'cerrada' }));
  }
}
function arUnidosHTML(js) { return `<p class="arp-n">${js.length} jugador${js.length === 1 ? '' : 'es'} en la sala</p><div class="arp-nombres">${js.map(j => j.id === PRUEBA_ID ? '<span>👁 Docente</span>' : `<span>${escaparHTML((j.nombre || '').split(' ')[0])}</span>`).join('')}</div>`; }
let arRevelando = false;
async function arRevelar() { if (arRevelando || !AR.sala || AR.sala.estado !== 'pregunta') return; arRevelando = true; clearInterval(AR.reloj); try { await arEstado({ estado: 'revela' }); } finally { arRevelando = false; } }
function abrirProyArena() { document.getElementById('ar-proy').hidden = false; document.body.classList.add('con-qr'); pintarArena(); }
on('ar-proy-cerrar', 'click', () => { document.getElementById('ar-proy').hidden = true; document.body.classList.remove('con-qr'); });

// ---- ⚖️ Tribunal de la ciencia: grupos/{g}/arena/tribunal = {estado, ronda, casos[], idx, dur, t0, revelados[]};
// cada alumno en .../tribunal/jugadores/{a}: v.{caso} = {l, v, arg}. Casos y veredictos: data/laboratorio.json.
const TR = { sala: null, jug: [], subs: [], reloj: null, L: null };
const trRef = () => doc(db, 'grupos', grupoActivo, 'arena', 'tribunal');
const mdA = t => escaparHTML(t || '').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<em>$1</em>');
const trPal = t => (String(t || '').trim().match(/\S+/g) || []).length;
async function iniciarTribunal() {
  const cont = document.getElementById('tr-panel'); if (!cont) return;
  if (!grupoActivo) { cont.innerHTML = '<p class="empty-inline">Elige un grupo primero.</p>'; return; }
  detenerTribunal();
  if (!TR.L) { try { TR.L = await fetch('data/laboratorio.json').then(r => r.json()); } catch { cont.innerHTML = '<p class="empty-inline">No se pudieron cargar los casos.</p>'; return; } }
  TR.subs.push(onSnapshot(trRef(), sn => { TR.sala = sn.exists() ? sn.data() : null; pintarTribunal(); }, () => {}));
  TR.subs.push(onSnapshot(collection(db, 'grupos', grupoActivo, 'arena', 'tribunal', 'jugadores'), sn => { TR.jug = sn.docs.map(d => ({ id: d.id, ...d.data() })); pintarTribunal(true); }, () => {}));
}
function detenerTribunal() { TR.subs.forEach(u => u()); TR.subs = []; clearInterval(TR.reloj); TR.reloj = null; }
const trJug = () => TR.jug.filter(j => TR.sala && j.ronda === TR.sala.ronda);
const trCaso = id => TR.L.casos.find(c => c.id === id);
const trAutor = id => TR.L.autores.find(a => a.id === id) || { nombre: id, fam: '' };
const trTot = j => Object.entries(j.v || {}).reduce((t, [c, r]) => t + ((TR.sala.revelados || []).includes(c) ? trPuntos(r, trCaso(c)) : 0), 0);
async function trEstado(c) { await setDoc(trRef(), c, { merge: true }); }
function pintarTribunal(soloJug) {
  const cont = document.getElementById('tr-panel'); if (!cont || !TR.L) return;
  const S = TR.sala, js = S ? trJug() : [];
  const caso = S && trCaso((S.casos || [])[S.idx]);
  if (soloJug && S && S.estado === 'caso' && caso) { const el = document.getElementById('tr-votos'); if (el) { el.textContent = `${js.filter(j => (j.v || {})[caso.id]).length} de ${js.length} jueces votaron`; TR_LENTES.forEach(l => { const b = document.querySelector(`[data-banca="${l}"] .trp-n`); if (b) b.textContent = js.filter(j => ((j.v || {})[caso.id] || {}).l === l).length; }); } return; }
  if (soloJug && S && S.estado === 'espera') { const el = document.getElementById('ar-unidos'); if (el) el.innerHTML = arUnidosHTML(js); return; }
  clearInterval(TR.reloj); TR.reloj = null;
  const proy = document.getElementById('tr-proy');
  if (!S || !S.estado || S.estado === 'cerrada') {
    cont.innerHTML = `<div class="bloques-activos-card"><h3 class="section-title" style="margin-top:0">⚖️ Abrir el Tribunal de la ciencia</h3>
      <p class="field-hint">Proyectas un caso; cada alumno, desde su celular (Tareas → ⚖️ Tribunal), recibe la «toga» de un autor —Círculo de Viena, Popper, Kuhn, Lakatos o Feyerabend— y vota si el caso es ciencia <b>según ese autor</b>, con su argumento. La toga cambia en cada caso. Al dictar sentencia se ve cómo votó cada banca, qué habría dicho de verdad cada autor y el mejor argumento. Puntos: 100 por juzgar como su autor y 50 por argumentar con ${TR_MIN_ARG} palabras o más; cada acierto enciende la estrella de ese autor en su cielo.</p>
      <p class="field-label">Casos (en este orden)</p><div class="tr-elige">${TR.L.casos.map(c => `<label><input type="checkbox" value="${c.id}" ${TR_CASOS_SUGERIDOS.includes(c.id) ? 'checked' : ''}> ${escaparHTML(c.titulo)}</label>`).join('')}</div>
      <label class="field-label" for="tr-dur">Tiempo para deliberar</label><select id="tr-dur"><option value="60">1 minuto</option><option value="90" selected>1 minuto y medio</option><option value="120">2 minutos</option><option value="180">3 minutos</option></select>
      <button type="button" class="btn btn-primary btn-block" id="tr-abrir" style="margin-top:12px">Abrir la sala y proyectar</button></div>`;
    document.getElementById('tr-abrir').addEventListener('click', async () => {
      const casos = [...document.querySelectorAll('.tr-elige input:checked')].map(x => x.value);
      if (!casos.length) { alert('Elige al menos un caso.'); return; }
      await setDoc(trRef(), { estado: 'espera', casos, idx: 0, dur: Number(document.getElementById('tr-dur').value), ronda: 't' + Date.now().toString(36), revelados: [] });
      abrirProyTribunal();
    });
    proy.hidden = true; document.body.classList.remove('con-qr');
    return;
  }
  cont.innerHTML = `<div class="bloques-activos-card"><p><b>⚖️ Tribunal de la ciencia</b> · ${js.length} juez${js.length === 1 ? '' : 'es'} · ${{ espera: 'esperando jueces', caso: `deliberando el caso ${S.idx + 1} de ${S.casos.length}`, sentencia: `sentencia del caso ${S.idx + 1} de ${S.casos.length}`, fin: 'sesión terminada' }[S.estado] || ''}</p>
    <div class="eq-acciones"><button type="button" class="btn btn-primary" id="tr-ver">📽️ Proyectar</button><button type="button" class="btn" id="tr-yo">🧪 Votar como alumno</button><button type="button" class="btn" id="tr-cerrar">Cerrar el Tribunal</button></div>
    <p class="field-hint">Los alumnos votan en su celular: Tareas → ⚖️ Tribunal, o con el QR de la proyección. Para probarlo tú, «🧪 Votar como alumno» abre otra pestaña ya dentro del Tribunal (fuera de concurso).</p></div>`;
  document.getElementById('tr-ver').addEventListener('click', abrirProyTribunal);
  document.getElementById('tr-yo').addEventListener('click', () => probarComo('tribunal'));
  document.getElementById('tr-cerrar').addEventListener('click', async () => { if (confirm('¿Cerrar el Tribunal? Se borra el marcador de esta sesión en las pantallas.')) await trEstado({ estado: 'cerrada' }); });
  const cuerpo = document.getElementById('tr-proy-cuerpo'), url = new URL('tareas.html#tribunal', location.href).href;
  const ranking = () => js.filter(j => j.id !== PRUEBA_ID).map(j => ({ n: j.nombre, p: trTot(j) })).sort((a, b) => b.p - a.p);
  const banca = (l, interior) => { const A = trAutor(l), Lt = TR.L.lentes.find(x => x.id === l) || {}, col = (TR.L.familias[A.fam] || {}).color || '#2E4A85'; return `<div class="trp-banca" data-banca="${l}" style="--c:${col}"><div class="trp-toga"><b>${escaparHTML(A.nombre)}</b><small>${escaparHTML(Lt.pregunta || '')}</small></div>${interior}</div>`; };
  if (S.estado === 'espera') {
    cuerpo.innerHTML = `<div class="arp-espera"><div><h2>⚖️ Tribunal de la ciencia</h2><p>Entra desde tu celular: <b>Aula Virtual → Tareas → ⚖️ Tribunal</b>, o escanea el código. Te pondrán la toga de un autor y juzgarás <b>como él</b>.</p><div id="ar-unidos" class="arp-unidos">${arUnidosHTML(js)}</div>
      <button type="button" class="btn btn-primary arp-boton" id="tr-empezar">▶ Primer caso</button></div><div class="arp-qr">${qrSvg(url, { titulo: 'Tribunal' })}</div></div>`;
    document.getElementById('tr-empezar').addEventListener('click', () => trEstado({ estado: 'caso', idx: 0, t0: Date.now() }));
  } else if (S.estado === 'caso' && caso) {
    const fin = (S.t0 || Date.now()) + S.dur * 1000, votos = js.filter(j => (j.v || {})[caso.id]);
    cuerpo.innerHTML = `<div class="arp-cab"><span>⚖️ Caso ${S.idx + 1} de ${S.casos.length}</span><span class="arp-seg trp-seg" id="tr-seg"></span><span id="tr-votos">${votos.length} de ${js.length} jueces votaron</span></div>
      <div class="trp-caso"><h2>${escaparHTML(caso.titulo)}</h2><p>${mdA(caso.texto)}</p></div>
      <div class="trp-bancas">${TR_LENTES.map(l => banca(l, `<p class="trp-delib">🗳️ <span class="trp-n">${votos.filter(j => j.v[caso.id].l === l).length}</span> votos</p>`)).join('')}</div>
      <div class="trp-pie"><button type="button" class="btn btn-primary arp-boton" id="tr-sentencia">⚖️ Dictar sentencia</button></div>`;
    document.getElementById('tr-sentencia').addEventListener('click', () => trEstado({ estado: 'sentencia', revelados: [...new Set([...(S.revelados || []), caso.id])] }));
    const seg = () => { const q = Math.max(0, Math.ceil((fin - Date.now()) / 1000)), el = document.getElementById('tr-seg'); if (el) { el.textContent = q ? `${Math.floor(q / 60)}:${String(q % 60).padStart(2, '0')}` : '⏱'; el.classList.toggle('fin', !q); } };
    seg(); TR.reloj = setInterval(seg, 500);
  } else if (S.estado === 'sentencia' && caso) {
    const rk = ranking().slice(0, 5);
    cuerpo.innerHTML = `<div class="arp-cab"><span>⚖️ Sentencia · caso ${S.idx + 1} de ${S.casos.length}</span><span>${escaparHTML(caso.titulo)}</span></div>
      <div class="trp-bancas trp-sent">${TR_LENTES.map(l => {
        const [ver, exp] = caso.v[l] || [], vs = js.map(j => (j.v || {})[caso.id]).filter(r => r && r.l === l), n = vs.length;
        const cuenta = TR_VER.map(([k]) => vs.filter(r => r.v === k).length), V = TR_VER.find(x => x[0] === ver) || [];
        const mejor = vs.filter(r => r.v === ver && trPal(r.arg) >= TR_MIN_ARG && (js.find(j => (j.v || {})[caso.id] === r) || {}).id !== PRUEBA_ID).sort((a, b) => trPal(b.arg) - trPal(a.arg))[0];
        const quien = mejor ? (js.find(j => (j.v || {})[caso.id] === mejor) || {}).nombre : '';
        return banca(l, `<div class="trp-votos">${TR_VER.map(([k, ico], i) => `<span class="${k === ver ? 'ok' : ''}" style="--c:${TR_VER[i][3]}"><i style="height:${n ? Math.round(100 * cuenta[i] / n) : 0}%"></i><b>${cuenta[i]}</b>${ico}</span>`).join('')}</div>
          <p class="trp-ver" style="--c:${V[3]}">${V[1] || ''} ${escaparHTML(V[2] || '')}</p><p class="trp-exp">${mdA(exp)}</p>
          ${mejor ? `<blockquote class="trp-arg">«${escaparHTML(mejor.arg)}»<cite>— ${escaparHTML((quien || '').split(' ')[0])}</cite></blockquote>` : ''}`);
      }).join('')}</div>
      ${caso.nota ? `<p class="arp-x">💡 ${mdA(caso.nota)}</p>` : ''}
      <div class="arp-pie"><ol class="arp-top">${rk.map((x, k) => `<li><span>${['🥇', '🥈', '🥉', '4.º', '5.º'][k]}</span>${escaparHTML(x.n)}<b>${x.p}</b></li>`).join('')}</ol>
      <button type="button" class="btn btn-primary arp-boton" id="tr-sig">${S.idx + 1 < S.casos.length ? 'Siguiente caso →' : '🏛️ Levantar la sesión'}</button></div>`;
    document.getElementById('tr-sig').addEventListener('click', () => S.idx + 1 < S.casos.length ? trEstado({ estado: 'caso', idx: S.idx + 1, t0: Date.now() }) : trEstado({ estado: 'fin' }));
  } else if (S.estado === 'fin') {
    const rk = ranking().slice(0, 5);
    cuerpo.innerHTML = `<div class="arp-fin"><h2>🏛️ ¡Se levanta la sesión!</h2><p>Los mejores jueces del Tribunal de la ciencia · ${js.length} jueces · ${S.casos.length} casos</p>
      <ol class="arp-podio">${rk.map((x, k) => `<li class="p${k + 1}"><span>${['🥇', '🥈', '🥉', '4.º', '5.º'][k]}</span><b>${escaparHTML(x.n)}</b><em>${x.p} pts</em></li>`).join('')}</ol>
      <p class="arp-x">No hay una sola respuesta para todos: cada autor traza la frontera de la ciencia en un lugar distinto. Ese es el corazón del Tema 4.</p>
      <button type="button" class="btn arp-boton" id="tr-otra">Nueva sesión</button></div>`;
    document.getElementById('tr-otra').addEventListener('click', () => trEstado({ estado: 'cerrada' }));
  }
}
function abrirProyTribunal() { document.getElementById('tr-proy').hidden = false; document.body.classList.add('con-qr'); pintarTribunal(); }
on('tr-proy-cerrar', 'click', () => { document.getElementById('tr-proy').hidden = true; document.body.classList.remove('con-qr'); });

// ---- 🗣️ Coevaluación de las exposiciones: grupos/{g}.coev = {equipo, abierta}; cada alumno en alumnos/{a}/atlas/tarea-coev-{equipo}
const CO = { subs: [], equipos: [], g: {}, evals: {}, fichas: {} };
function iniciarCoev() {
  const cont = document.getElementById('co-panel'); if (!cont) return;
  if (!grupoActivo) { cont.innerHTML = '<p class="empty-inline">Elige un grupo primero.</p>'; return; }
  detenerCoev();
  CO.subs.push(onSnapshot(doc(db, 'grupos', grupoActivo), sn => { CO.g = sn.exists() ? sn.data() : {}; pintarCoev(); }, () => {}));
  CO.subs.push(onSnapshot(collection(db, 'grupos', grupoActivo, 'equipos'), sn => {
    CO.todos = sn.docs.map(d => ({ id: d.id, ...d.data() }));
    CO.todos.forEach(eq => { if (!(eq.id in CO.fichas)) { CO.fichas[eq.id] = ''; CO.subs.push(onSnapshot(doc(db, 'grupos', grupoActivo, 'equipos', eq.id, 'atlas', CUADROS['ficha-autor'].id), s => { CO.fichas[eq.id] = s.exists() ? ((s.data().celdas || {}).autor_ficha || '') : ''; pintarCoev(); }, () => {})); } });
    pintarCoev();
  }, () => {}));
  // una escucha por alumno y equipo, solo de los equipos de la formación de la ficha
  CO.subs.push(onSnapshot(collection(db, 'grupos', grupoActivo, 'equipos'), sn => {
    (CO.evSubs || []).forEach(u => u()); CO.evSubs = [];
    sn.docs.forEach(d => alumnosCache.forEach(al => CO.evSubs.push(onSnapshot(doc(db, 'grupos', grupoActivo, 'alumnos', al.id, 'atlas', 'tarea-coev-' + d.id), s => { CO.evals[d.id + '/' + al.id] = s.exists() ? s.data() : null; clearTimeout(CO.t); CO.t = setTimeout(pintarCoev, 150); }, () => {}))));
  }, () => {}));
}
function detenerCoev() { CO.subs.forEach(u => u()); CO.subs = []; (CO.evSubs || []).forEach(u => u()); CO.evSubs = []; CO.fichas = {}; }
function resumenCoev(eqId) {
  const evs = Object.entries(CO.evals).filter(([k, v]) => v && k.startsWith(eqId + '/')).map(([, v]) => v);
  const prom = Object.fromEntries(COEV.map(([k]) => { const xs = evs.map(e => (e.cal || {})[k]).filter(Boolean); return [k, xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0]; }));
  const general = COEV.reduce((s, [k]) => s + prom[k], 0) / COEV.length;
  return { evs, prom, general, sobre10: Math.round(general / 4 * 100) / 10, preguntas: evs.map(e => e.pregunta).filter(Boolean) };
}
function pintarCoev() {
  const cont = document.getElementById('co-panel'); if (!cont || !grupoActivo) return;
  const fid = formacionDeTarea(CO.g, 'ficha-autor'), eqs = equiposDe(CO.todos || [], fid).sort((x, y) => (x.numero || 999) - (y.numero || 999)), C = CO.g.coev || {};
  const act = document.activeElement; if (act && cont.contains(act) && act.tagName === 'TEXTAREA') return;
  cont.innerHTML = `<p class="field-hint">Cuando un equipo pase a exponer, toca <b>▶ Expone ahora</b>: a los demás les aparece la rúbrica en su celular (Tareas → Coevaluación de las exposiciones). Ves los promedios y las preguntas en vivo; <b>📽️ Proyectar</b> muestra los resultados y las preguntas al grupo. Los equipos son los de la ficha del autor («${escaparHTML((formaciones(CO.g)[fid] || {}).nombre || '')}»).</p>
    ${eqs.length ? `<div class="co-equipos">${eqs.map(eq => { const r = resumenCoev(eq.id), vivo = C.abierta && C.equipo === eq.id; return `<div class="bloques-activos-card co-eq ${vivo ? 'vivo' : ''}">
      <div class="co-eq-cab"><div><b>${escaparHTML(eq.nombre)}</b><small>${escaparHTML(CO.fichas[eq.id] || 'sin autor en su ficha')} · ${escaparHTML((eq.nombres || []).join(', '))}</small></div>
        <div class="co-eq-bot">${vivo ? '<span class="co-vivo">● Evaluando</span><button type="button" class="btn btn-small" data-co-cerrar>■ Cerrar evaluación</button>' : `<button type="button" class="btn btn-small btn-primary" data-co-abrir="${eq.id}">▶ Expone ahora</button>`}<button type="button" class="btn btn-small" data-co-proy="${eq.id}">📽️ Proyectar</button></div></div>
      <p class="co-num"><b>${r.evs.length}</b> evaluación${r.evs.length === 1 ? '' : 'es'}${r.evs.length ? ` · promedio <b>${r.general.toFixed(1)} de 4</b> (≈ ${r.sobre10} de 10)` : ''}</p>
      ${r.evs.length ? `<div class="co-barras">${COEV.map(([k, t]) => `<div><span>${escaparHTML(t)}</span><i><em style="width:${Math.round(100 * r.prom[k] / 4)}%"></em></i><b>${r.prom[k].toFixed(1)}</b></div>`).join('')}</div>` : ''}
      ${r.preguntas.length ? `<details><summary>${r.preguntas.length} pregunta${r.preguntas.length === 1 ? '' : 's'} del grupo</summary><ul>${r.preguntas.map(q => `<li>${escaparHTML(q)}</li>`).join('')}</ul></details>` : ''}</div>`; }).join('')}</div>`
      : '<p class="empty-inline">Todavía no hay equipos para la ficha del autor. Fórmalos en 👥 Equipos o en Tareas → Tareas digitales → 👥.</p>'}`;
  cont.querySelectorAll('[data-co-abrir]').forEach(b => b.addEventListener('click', () => setDoc(doc(db, 'grupos', grupoActivo), { coev: { equipo: b.dataset.coAbrir, abierta: true } }, { merge: true })));
  cont.querySelectorAll('[data-co-cerrar]').forEach(b => b.addEventListener('click', () => setDoc(doc(db, 'grupos', grupoActivo), { coev: { abierta: false } }, { merge: true })));
  cont.querySelectorAll('[data-co-proy]').forEach(b => b.addEventListener('click', () => { CO.proy = b.dataset.coProy; document.getElementById('co-proy').hidden = false; document.body.classList.add('con-qr'); pintarProyCoev(); }));
  if (CO.proy && !document.getElementById('co-proy').hidden) pintarProyCoev();
}
function pintarProyCoev() {
  const eq = (CO.todos || []).find(e => e.id === CO.proy); if (!eq) return;
  const r = resumenCoev(eq.id);
  document.getElementById('co-proy-cuerpo').innerHTML = `<div class="cop"><p class="cop-k">Coevaluación</p><h2>${escaparHTML(eq.nombre)}</h2><p class="cop-sub">${escaparHTML(CO.fichas[eq.id] || '')} · ${r.evs.length} evaluaciones · promedio ${r.general.toFixed(1)} de 4</p>
    <div class="cop-barras">${COEV.map(([k, t]) => `<div><span>${escaparHTML(t)}</span><i><em style="width:${Math.round(100 * r.prom[k] / 4)}%"></em></i><b>${r.prom[k].toFixed(1)}</b></div>`).join('')}</div>
    <h3>Preguntas del grupo</h3><ol class="cop-preg">${r.preguntas.map(q => `<li>${escaparHTML(q)}</li>`).join('') || '<li><i>Todavía no hay preguntas.</i></li>'}</ol></div>`;
}
on('co-proy-cerrar', 'click', () => { document.getElementById('co-proy').hidden = true; document.body.classList.remove('con-qr'); CO.proy = null; });
