// tema.js — página de un subtema individual (tema.html?id=4.3). Reconoce
// "§ " como título de sección, "• " como punto de lista, "TABLA: " como tabla,
// los recuadros del libro ("PARA PENSAR:", "EN EL AULA MEXICANA:",
// "ACTIVIDAD:", "TALLER APA:"…) como cajas de color, y cualquier otra línea
// como párrafo. Admite **negritas** y *cursivas*.
//
// Si se llega con ?buscar=término, ese término se resalta y la página salta
// automáticamente al primer párrafo donde aparece.

const DATA_FILES = Array.from({ length: 10 }, (_, i) => `data/bloque${i + 1}.json`);

function escaparHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Marcado ligero dentro del texto: **negritas** y *cursivas*.
function marcado(htmlEscapado) {
  return htmlEscapado
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

// Escapa, aplica el marcado y resalta el término buscado solo en el texto
// (nunca dentro de las etiquetas HTML).
function resaltarTexto(texto, termino) {
  const html = marcado(escaparHTML(texto));
  if (!termino) return html;
  const seguro = termino.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(${seguro})`, 'ig');
  return html.split(/(<[^>]+>)/).map(trozo =>
    trozo.startsWith('<') ? trozo : trozo.replace(re, '<mark class="tema-highlight">$1</mark>')
  ).join('');
}

// Recuadros del libro. Cada uno es una sola línea "ETIQUETA: texto"; dentro
// del texto, " ¶ " separa párrafos y "¶• " marca un punto de lista.
const RECUADROS = {
  'RECUERDA': 'callout',
  'IMPORTANTE': 'callout',
  'NOTA': 'callout',
  'PREGUNTAS DE ARRANQUE': 'arranque',
  'PARA PENSAR': 'pensar',
  'EN EL AULA MEXICANA': 'aula',
  'ACTIVIDAD': 'actividad',
  'TALLER APA': 'apa',
  'CONEXIÓN CON TU CARRERA': 'conexion',
  'IDEA CLAVE': 'idea',
  'RESUMEN DEL TEMA': 'resumen',
};
const RE_RECUADRO = new RegExp(`^(${Object.keys(RECUADROS).join('|')}):\\s*(.*)$`, 's');

function tipoDeLinea(linea) {
  if (linea.startsWith('§ ')) return 'titulo';
  if (linea.startsWith('TABLA: ')) return 'tabla';
  if (RE_RECUADRO.test(linea)) return 'recuadro';
  if (linea.startsWith('• ')) return 'bullet';
  return 'parrafo';
}

function cuerpoRecuadro(texto, termino) {
  let html = '';
  let lista = [];
  const cerrar = () => { if (lista.length) { html += `<ul class="tema-bullet-list">${lista.join('')}</ul>`; lista = []; } };
  texto.split(/\s*¶\s*/).forEach(trozo => {
    if (!trozo) return;
    if (trozo.startsWith('• ')) { lista.push(`<li>${resaltarTexto(trozo.slice(2), termino)}</li>`); return; }
    cerrar();
    html += `<p>${resaltarTexto(trozo, termino)}</p>`;
  });
  cerrar();
  return html;
}

function tablaHTML(texto, termino) {
  const filas = texto.split(/\s*¶\s*/).filter(Boolean).map(f => f.split('|').map(c => c.trim()));
  const [cab, ...resto] = filas;
  return `<div class="tema-tabla-wrap"><table class="tema-tabla">
    <thead><tr>${cab.map(c => `<th>${resaltarTexto(c, termino)}</th>`).join('')}</tr></thead>
    <tbody>${resto.map(f => `<tr>${f.map(c => `<td>${resaltarTexto(c, termino)}</td>`).join('')}</tr>`).join('')}</tbody>
  </table></div>`;
}

function renderContenido(contenido, termino) {
  let html = '';
  let bulletBuffer = [];

  const cerrarLista = () => {
    if (bulletBuffer.length) {
      html += `<ul class="tema-bullet-list">${bulletBuffer.map(b => `<li>${resaltarTexto(b, termino)}</li>`).join('')}</ul>`;
      bulletBuffer = [];
    }
  };

  contenido.forEach(linea => {
    const tipo = tipoDeLinea(linea);
    if (tipo === 'bullet') { bulletBuffer.push(linea.slice(2)); return; }
    cerrarLista();

    if (tipo === 'titulo') {
      html += `<h3 class="tema-section-title">${resaltarTexto(linea.slice(2), termino)}</h3>`;
    } else if (tipo === 'tabla') {
      html += tablaHTML(linea.slice(7), termino);
    } else if (tipo === 'recuadro') {
      const m = linea.match(RE_RECUADRO);
      const etiqueta = m[1].toUpperCase();
      const clase = RECUADROS[etiqueta];
      if (clase === 'callout') {
        html += `<div class="tema-callout"><span class="tema-callout-tag">${etiqueta}</span><p>${resaltarTexto(m[2], termino)}</p></div>`;
      } else if (clase === 'idea') {
        html += `<blockquote class="tema-idea">${resaltarTexto(m[2], termino)}</blockquote>`;
      } else {
        html += `<div class="tema-recuadro tema-recuadro-${clase}"><span class="tema-recuadro-tag">${etiqueta}</span>${cuerpoRecuadro(m[2], termino)}</div>`;
      }
    } else {
      html += `<p>${resaltarTexto(linea, termino)}</p>`;
    }
  });

  cerrarLista();
  return html;
}

async function init(idDirecto) {
  const params = new URLSearchParams(window.location.search);
  const idBuscado = idDirecto || params.get('id');
  const termino = idDirecto ? '' : (params.get('buscar') || '').trim();
  const root = document.getElementById('tema-root');
  const pager = document.getElementById('tema-pager');

  if (!idBuscado) {
    root.innerHTML = `<div class="tema-card"><p>No se especificó ningún subtema. <a href="compendio.html">Volver al compendio</a>.</p></div>`;
    return;
  }

  const bloquesData = await Promise.all(DATA_FILES.map(url => fetch(url).then(r => r.json())));

  const plano = [];
  bloquesData.forEach(b => {
    b.subtemas.forEach(s => plano.push({ bloqueNum: b.bloque, bloqueNombre: b.nombre, subtema: s }));
  });

  const idx = plano.findIndex(item => item.subtema.id === idBuscado);

  if (idx === -1) {
    root.innerHTML = `<div class="tema-card"><p>No encontramos el subtema "${escaparHTML(idBuscado)}". <a href="compendio.html">Volver al compendio</a>.</p></div>`;
    return;
  }

  const actual = plano[idx];
  const s = actual.subtema;

  document.title = `${s.titulo} — Epistemología y Pedagogía`;

  const notaBusqueda = termino
    ? `<p class="tema-buscar-nota" style="margin:0 0 16px; font-size:.85em; color:#8A8177;">
        Resultado para "<strong>${escaparHTML(termino)}</strong>" —
        <a href="compendio.html?buscar=${encodeURIComponent(termino)}">ver todos los resultados</a>
      </p>`
    : '';

  root.innerHTML = `
    <article class="tema-card">
      <p class="tema-block-label">Tema ${actual.bloqueNum} · ${escaparHTML(actual.bloqueNombre)}</p>
      <div class="tema-head">
        <span class="tema-id">${escaparHTML(s.id)}</span>
        <h1>${resaltarTexto(s.titulo, termino)}</h1>
      </div>
      ${notaBusqueda}
      ${renderContenido(s.contenido, termino)}
    </article>
  `;

  if (termino) {
    requestAnimationFrame(() => {
      const marca = root.querySelector('mark.tema-highlight');
      if (marca) marca.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  const anterior = idx > 0 ? plano[idx - 1] : null;
  const siguiente = idx < plano.length - 1 ? plano[idx + 1] : null;

  pager.innerHTML = `
    ${anterior
      ? `<a href="tema.html?id=${encodeURIComponent(anterior.subtema.id)}"><span class="pager-label">← Anterior</span><span class="pager-title">${anterior.subtema.id} ${escaparHTML(anterior.subtema.titulo)}</span></a>`
      : `<span class="placeholder"></span>`}
    ${siguiente
      ? `<a href="tema.html?id=${encodeURIComponent(siguiente.subtema.id)}" class="next"><span class="pager-label">Siguiente →</span><span class="pager-title">${siguiente.subtema.id} ${escaparHTML(siguiente.subtema.titulo)}</span></a>`
      : `<span class="placeholder"></span>`}
  `;
  document.dispatchEvent(new CustomEvent('tema:renderizado', { detail: { id: s.id } }));
}

function conectarBuscador() {
  const form = document.getElementById('tema-search-form');
  const input = document.getElementById('tema-search-input');
  if (!form || !input) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (q) window.location.href = `compendio.html?buscar=${encodeURIComponent(q)}`;
  });
}

// Cambia de subtema sin recargar la página (lo usa el lector en voz alta
// para seguir leyendo el siguiente subtema sin interrumpirse).
window.irASubtema = async (id) => {
  history.pushState({ id }, '', `tema.html?id=${encodeURIComponent(id)}`);
  await init(id);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
window.addEventListener('popstate', () => init());

document.addEventListener('DOMContentLoaded', () => {
  conectarBuscador();
  init();
});
