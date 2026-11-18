// seleccion-examen.js — Arma un examen a partir de un banco de reactivos.
// · cuotas: cuántas preguntas van de cada tema, p. ej. { "4": 6, "5": 8, "6": 8, "7": 8 }.
//   Dentro de cada tema se reparten entre sus subtemas en proporción a lo que hay en el banco.
//   Sin cuotas, el reparto es proporcional por subtema sobre el total.
// · maxPorTipo: tope de un tipo de reactivo, p. ej. { "caso": 6 }; lo que sobra se cambia
//   por otra pregunta del mismo subtema (o del mismo tema) que no sea de ese tipo.
// · rnd: función que devuelve un número entre 0 y 1 (con semilla en el examen real,
//   Math.random en el simulacro).
// La usan el examen en línea (examen.js) y el simulacro de Actividades (actividades.js).

const temaDe = r => String(r.subtema || '—').split('.')[0];

function barajar(arr, rnd) {
  const c = [...arr];
  for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [c[i], c[j]] = [c[j], c[i]]; }
  return c;
}

// Reparte n entre grupos en proporción a su tamaño (mayores residuos; desempate al azar).
function repartir(grupos, n, rnd) {
  const claves = [...grupos.keys()], total = claves.reduce((s, k) => s + grupos.get(k).length, 0);
  if (!total) return new Map();
  const c = claves.map(k => { const e = grupos.get(k).length * n / total; return { k, base: Math.min(Math.floor(e), grupos.get(k).length), resto: e - Math.floor(e) }; });
  let faltan = n - c.reduce((s, x) => s + x.base, 0);
  for (const x of barajar(c, rnd).sort((a, b) => b.resto - a.resto)) {
    if (faltan <= 0) break;
    if (x.base < grupos.get(x.k).length) { x.base++; faltan--; }
  }
  return new Map(c.map(x => [x.k, x.base]));
}

export function elegirConCuotas(reactivos, n, rnd, cfg = {}) {
  const porSub = new Map();
  reactivos.forEach(r => { const k = r.subtema || '—'; if (!porSub.has(k)) porSub.set(k, []); porSub.get(k).push(r); });
  const cuotaSub = new Map();
  if (cfg.cuotas) {
    Object.entries(cfg.cuotas).forEach(([tema, q]) => {
      const sub = new Map([...porSub].filter(([k]) => k.split('.')[0] === String(tema)));
      repartir(sub, q, rnd).forEach((v, k) => cuotaSub.set(k, v));
    });
  } else repartir(porSub, n, rnd).forEach((v, k) => cuotaSub.set(k, v));

  let elegidos = [];
  cuotaSub.forEach((q, k) => elegidos.push(...barajar(porSub.get(k), rnd).slice(0, q)));

  // Topes por tipo de reactivo.
  Object.entries(cfg.maxPorTipo || {}).forEach(([tipo, max]) => {
    let sobran = elegidos.filter(r => r.tipo === tipo).length - max;
    for (const r of barajar(elegidos.filter(x => x.tipo === tipo), rnd)) {
      if (sobran <= 0) break;
      const usados = new Set(elegidos.map(x => x.id));
      const libres = reactivos.filter(x => !usados.has(x.id) && x.tipo !== tipo);
      const sust = barajar(libres.filter(x => x.subtema === r.subtema), rnd)[0] || barajar(libres.filter(x => temaDe(x) === temaDe(r)), rnd)[0];
      if (!sust) continue;
      elegidos = elegidos.map(x => (x.id === r.id ? sust : x));
      sobran--;
    }
  });
  return barajar(elegidos, rnd);
}

// Generador con semilla (el mismo alumno siempre recibe el mismo examen).
export function rndConSemilla(semilla) {
  let s = semilla || 1;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}
