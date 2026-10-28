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

export function refsSugeridas(D, LAB, hasta) {
  const ids = [...new Set(D.preguntas.filter(p => p.n <= hasta).flatMap(p => p.autores))];
  return ids.flatMap(id => ((LAB.autores.find(a => a.id === id) || {}).refs || []).map((r, i) => ({ id: `${id}-${i}`, apa: r.apa })));
}
export function refsElegidas(T, D, LAB, hasta) {
  const refs = T.refs || {}, S = new Set(refs.sel || []);
  return [...refsSugeridas(D, LAB, hasta).filter(r => S.has(r.id)).map(r => r.apa), ...String(refs.otras || '').split('\n').map(x => x.trim()).filter(Boolean)];
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
