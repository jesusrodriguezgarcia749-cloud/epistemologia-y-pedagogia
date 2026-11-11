// taller-word.js — Word del ensayo «Pienso, luego investigo» (Entrega 1, Entrega 2 y Entrega final).
// Lo usan el alumno (taller.js) y el docente (admin.js), para que el documento salga idéntico.
import { descargarAPA } from "./apa-word.js?v=2026102708";

export const TITULOS = {
  intro: 'Introducción',
  1: 'Tema y pregunta de investigación', 2: 'Tipo de conocimiento que quiero producir', 3: 'Ubicación en la clasificación de las ciencias',
  4: 'Paradigma de la investigación', 5: 'Hipótesis o supuesto y falsabilidad', 6: 'Paradigma dominante y anomalías',
  7: 'Obstáculos epistemológicos y sesgos', 8: 'Método y su adecuación al objeto de estudio', 9: 'Diálogo con saberes no científicos',
  10: 'Rigor de la investigación', 11: 'Neuromitos y creencias sin evidencia', 12: 'Interés que guía la investigación',
  13: 'Una objeción a mi método y mi respuesta', 14: 'Tesis provisional', 15: 'Barreras y desigualdades',
  16: 'Dilemas éticos', 17: 'Relación con la Nueva Escuela Mexicana', 18: 'Conclusión: ¿mi investigación es ciencia?',
};
export const ENTREGAS = {
  entrega1: { titulo: 'primera parte del ensayo', archivo: 'preguntas_1_a_6', minRefs: 3, boton: 'la primera parte del ensayo (preguntas 1 a 6)' },
  entrega2: { titulo: 'borrador completo del ensayo', archivo: 'preguntas_1_a_14', minRefs: 6, boton: 'el borrador completo (preguntas 1 a 14)' },
  entregaFinal: { titulo: 'ensayo final', archivo: 'ensayo_final', minRefs: 8, minArticulos: 2, minPal: 2500, maxPal: 3500, intro: true, boton: 'el ensayo final completo' },
};
export const palabras = t => (String(t || '').trim().match(/\S+/g) || []).length;
export const numsDe = (D, ent) => D.preguntas.filter(p => p.entrega === ent).map(p => p.n);
export const hastaDe = (D, ent) => Math.max(...numsDe(D, ent));
export const tieneCita = t => /\([^()]*\d{4}[^()]*\)/.test(t || '');
// Un artículo académico en APA lleva revista con volumen(número), páginas o DOI.
export const esArticulo = r => /doi\.org|doi:|\b\d+\s*\(\d+\)\s*,\s*\d+|\be\d{4,}\b/i.test(String(r || '').replace(/\*/g, ''));
export const slugArchivo = n => String(n || '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

// Normaliza para comparar apellidos sin acentos ni mayúsculas.
const sinAcento = t => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
// Autores que cita el borrador de la brújula (pregunta 4): también deben aparecer como referencias sugeridas.
function idsBrujula(LAB, T) {
  const pf = T && T.brujula && T.brujula.clave && LAB.brujula ? LAB.brujula.perfiles[T.brujula.clave] : null; if (!pf) return [];
  return pf.autores.flatMap(txt => { const ap = sinAcento(txt.replace(/\(.*$/, '')).split(/\s+y\s+/).map(x => x.trim().split(/\s+/)[0]);
    const a = LAB.autores.find(x => ap.includes(sinAcento(x.nombre).split(/\s+/).slice(-1)[0]) || ap.some(w => sinAcento(x.nombre).split(/\s+/).includes(w)) || ap.includes(x.id)); return a ? [a.id] : []; });
}
export function refsSugeridas(D, LAB, hasta, T) {
  const ids = [...new Set([...D.preguntas.filter(p => p.n <= hasta).flatMap(p => p.autores), ...(hasta >= 4 ? idsBrujula(LAB, T) : [])])];
  return ids.flatMap(id => ((LAB.autores.find(a => a.id === id) || {}).refs || []).map((r, i) => ({ id: `${id}-${i}`, apa: r.apa })));
}
export function refsElegidas(T, D, LAB, hasta) {
  const refs = T.refs || {}, S = new Set(refs.sel || []);
  return [...refsSugeridas(D, LAB, hasta, T).filter(r => S.has(r.id)).map(r => r.apa), ...String(refs.otras || '').split('\n').map(x => x.trim()).filter(Boolean)];
}
// Lo que entra al Word de cada entrega.
export function textosDe(T, D, ent) {
  const hasta = hastaDe(D, ent), r = T.respuestas || {};
  return [...(ENTREGAS[ent].intro ? [['intro', T.intro || '']] : []), ...D.preguntas.filter(p => p.n <= hasta).map(p => [p.n, r[p.n] || ''])];
}
// Huella del texto entregado: si cambia después de entregar, el docente lo ve.
export function huella(T, D, ent) {
  const s = textosDe(T, D, ent).map(([, t]) => String(t).replace(/\s+/g, ' ').trim()).join('|') + '|' + JSON.stringify(T.refs || {});
  let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h.toString(36);
}
export function estadoEntrega(T, D, ent) {
  const e = (T.entregado || {})[ent]; if (!e) return { entregada: false };
  return { entregada: true, t: e.t, modificada: e.huella !== huella(T, D, ent) };
}
// Qué parte de un texto viene de la respuesta base que propone la plataforma (secuencias de 5 palabras iguales).
const normal = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').match(/[a-zñ0-9]+/g) || [];
export function porcentajePlataforma(texto, base) {
  const w = normal(texto), b = normal(base); if (!w.length || b.length < 5) return 0;
  const G = new Set(); for (let i = 0; i + 5 <= b.length; i++) G.add(b.slice(i, i + 5).join(' '));
  const marca = new Array(w.length).fill(false);
  for (let i = 0; i + 5 <= w.length; i++) if (G.has(w.slice(i, i + 5).join(' '))) for (let j = i; j < i + 5; j++) marca[j] = true;
  return Math.round(100 * marca.filter(Boolean).length / w.length);
}

export async function wordTaller(T, D, LAB, ent, nombre, { soloBlob = false } = {}) {
  const E = ENTREGAS[ent], hasta = hastaDe(D, ent), refs = refsElegidas(T, D, LAB, hasta);
  return descargarAPA({
    titulo: `Pienso, luego investigo: ${E.titulo}`,
    autor: nombre || '',
    programa: 'Licenciatura en Pedagogía', institucion: 'ITES René Descartes',
    curso: 'Epistemología y Pedagogía', docente: 'Mtro. Jesús Rodríguez García',
    secciones: textosDe(T, D, ent).map(([n, t]) => ({ titulo: n === 'intro' ? TITULOS.intro : `${n}. ${TITULOS[n]}`, parrafos: String(t).split(/\n+/) })),
    referencias: refs.length ? refs : ['Agrega aquí tus referencias en APA 7, en orden alfabético y con sangría francesa.'],
    archivo: `Pienso_luego_investigo_${E.archivo}_${slugArchivo(nombre || 'borrador')}`,
    soloBlob,
  });
}

// ---- Revisión de citas: autores citados en el texto que no están en Referencias, y referencias que no se citan.
const NO_AUTOR = new Set(['esta', 'este', 'esto', 'estos', 'estas', 'segun', 'como', 'para', 'desde', 'aunque', 'pregunta', 'tema', 'obra', 'original', 'mi', 'la', 'el', 'los', 'las', 'en', 'con', 'que', 'trad', 'ed']);
const palabrasAutor = t => sinAcento(t).replace(/et al\.?/g, ' ').split(/[^a-zñü'-]+/).filter(w => w.length >= 3 && !NO_AUTOR.has(w) && w !== 'y');
export function citasDe(texto) {
  const t = String(texto || ''), out = [], ANIO = '(\\d{4}(?:\\/\\d{4})?|s\\.\\s?f\\.)';
  // Narrativa: Apellido (2004) · Apellido y Apellido (1987) · Apellido et al. (2014)
  const N = new RegExp(`((?:[A-ZÁÉÍÓÚÑ][\\wáéíóúñü'-]+)(?:\\s+(?:[A-ZÁÉÍÓÚÑ][\\wáéíóúñü'-]+|y|de|del|van|von|et al\\.))*)\\s*\\(${ANIO}`, 'g');
  let m; while ((m = N.exec(t))) out.push({ quien: m[1].trim(), anio: m[2] });
  // Parentética: (Apellido, 2004) · (A, 2000; B y C, 2001)
  const P = /\(([^()]*\d{4}[^()]*)\)/g;
  while ((m = P.exec(t))) m[1].split(';').forEach(seg => { const k = seg.match(new RegExp(`^\\s*([^,]+?),\\s*${ANIO}`)); if (k) out.push({ quien: k[1].trim(), anio: k[2] }); });
  return out.filter(c => palabrasAutor(c.quien).length);
}
export function revisarCitas(textos, refs) {
  const autoresRef = refs.map(r => { const t = String(r).replace(/\*/g, ''); return { r, ap: palabrasAutor(t.split('(')[0]), anios: t.match(/\b(1[5-9]|20)\d{2}\b/g) || [] }; });
  const citas = citasDe(textos.join('\n')), vistos = new Set(), sinRef = [];
  citas.forEach(c => {
    const w = palabrasAutor(c.quien), an = (c.anio.match(/\d{4}/g) || []), mismos = autoresRef.filter(a => w.some(x => a.ap.includes(x)));
    // Si no hay año (s. f.) basta el apellido; si hay año, debe coincidir con el de alguna de sus referencias.
    const ok = mismos.some(a => !an.length || an.some(y => a.anios.includes(y)));
    if (!ok) { const k = c.quien + ' (' + c.anio + ')' + (mismos.length ? ' —el año no coincide con tu referencia—' : ''); if (!vistos.has(k)) { vistos.add(k); sinRef.push(k); } }
  });
  const todo = sinAcento(textos.join(' '));
  const sinCitar = autoresRef.filter(a => { const pri = a.ap[0]; return pri && !citas.some(c => palabrasAutor(c.quien).includes(pri)) && !new RegExp(`\\b${pri}\\b`).test(todo); }).map(a => String(a.r).replace(/\*/g, '').split('(')[0].trim().replace(/,$/, ''));
  return { sinRef, sinCitar };
}
