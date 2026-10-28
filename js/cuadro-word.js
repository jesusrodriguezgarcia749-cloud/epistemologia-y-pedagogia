// cuadro-word.js — Word de un cuadro (tareas): lo usa el alumno (tareas.js) y el docente (admin.js), para que salgan idénticos.
import { DocITES } from "./docx-ites.js?v=2026102708";

export const slugArchivo = n => String(n || '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

// A: definición del cuadro (CUADROS[id]); V: variante (o null); R: respuestas de la clave; S: {celdas, por};
// eq: equipo (o null); nombre: alumno si es individual; conClave: incluir la tabla de la clave.
export async function docCuadro({ A, V = null, R = null, S, eq = null, nombre = '', conClave = false }) {
  const D = new DocITES(); await D.cargarLogo();
  const celdas = (S && S.celdas) || {}, por = (S && S.por) || {};
  D.portada({ kicker: A.kicker, titulo: A.titulo, subtitulo: V ? 'Análisis de una afirmación con los autores del Tema 4' : 'Cuadro comparativo', etiqueta: eq ? `Equipo «${eq.nombre}»` : 'Alumno', personas: eq ? eq.nombres || [] : [nombre] });
  if (V) D.h1('La afirmación analizada', V.afirmacion);
  D.h1(V ? 'Nuestro análisis' : 'Cuadro comparativo');
  const celda = k => { const t = (celdas[k] || '').trim(), au = eq && por[k]; return { runs: [[t || '(sin escribir)', t ? {} : { i: true, color: '9A9389' }], ...(au ? [[`\n✍ ${au}`, { color: '3F7A4F', tam: 8 }]] : [])] }; };
  const cab = (f, t, inv) => { const fu = (celdas[`${f}_fuente`] || '').trim(); return inv ? { runs: [[t, { b: true }], [`\n🔎 Investigación${fu ? ' · Fuente: ' + fu : ' · sin fuente'}`, { color: '6B6358', tam: 8, i: !fu }]], fondo: 'F4EFE4' } : { t, b: true, fondo: 'F4EFE4' }; };
  const anchos = [1700, ...A.columnas.map(() => Math.floor(7660 / A.columnas.length))];
  D.tabla([['Apartado', ...A.columnas.map(c => c[1])], ...A.filas.map(([f, t, , inv]) => [cab(f, t, inv), ...A.columnas.map(([c]) => celda(`${f}_${c}`))])], { anchos });
  if (conClave && R) {
    D.h1('Comparación con la clave', V ? 'Las respuestas posibles que liberó el maestro, para comparar con lo que escribimos. No son las únicas válidas: cuenta que el análisis esté bien argumentado.' : 'La clave que liberó el maestro (del compendio y, en las filas de investigación, respuestas de referencia), para revisar lo que escribimos.');
    D.tabla([['Apartado', ...A.columnas.map(c => c[1])], ...A.filas.map(([f, t]) => [{ t, b: true, fondo: 'F4EFE4' }, ...R[f]])], { anchos });
  }
  return { D, archivo: `${A.archivo}_${slugArchivo(eq ? 'equipo ' + eq.nombre : nombre)}` };
}
