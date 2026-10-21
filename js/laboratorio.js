// laboratorio.js — Laboratorio de ideas de Epistemología y Pedagogía
// Seis módulos: constelación de pensadores, ¿esto es ciencia?, ciclo de Kuhn,
// cerebro y neuromitos, brújula del investigador y línea del tiempo de las ideas.
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const sv = (tag, attrs = {}, padre) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); if (padre) padre.appendChild(e); return e; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const md = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?![*\w])/g, '$1<em>$2</em>');
  const guarda = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
  const lee = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const reducido = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mezcla = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const enlaceTema = s => `<a class="chip-tema" href="tema.html?id=${encodeURIComponent(s)}">${esc(s)}</a>`;

  let L = null; const listo = {};
  const tabs = $$('.lab-tabs button');
  const MODULOS = { constelacion: iniciarConstelacion, ciencia: iniciarCiencia, kuhn: iniciarKuhn, cerebro: iniciarCerebro, brujula: iniciarBrujula, tiempo: iniciarTiempo };
  function abrir(nombre, extra) {
    if (!MODULOS[nombre]) nombre = 'constelacion';
    tabs.forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === nombre)));
    $$('.lab-panel').forEach(p => { p.hidden = p.id !== 'panel-' + nombre; });
    if (!listo[nombre]) { listo[nombre] = true; MODULOS[nombre](extra); }
    else if (extra && nombre === 'constelacion') elegirAutor(extra, false);
    else if (extra && nombre === 'ciencia') elegirCaso(extra);
  }
  const leerHash = () => { const [t, x] = (location.hash.slice(1) || 'constelacion').split('='); return [t, x ? decodeURIComponent(x) : x]; };
  tabs.forEach(b => b.addEventListener('click', () => { history.replaceState(null, '', '#' + b.dataset.tab); abrir(b.dataset.tab); }));
  fetch('data/laboratorio.json').then(r => r.json()).then(d => {
    L = d; abrir(...leerHash());
    window.addEventListener('hashchange', () => abrir(...leerHash()));
  }).catch(() => { $('#panel-constelacion').innerHTML = '<p class="aviso mal">No se pudo cargar el laboratorio. Revisa tu conexión y recarga la página.</p>'; });

  // ======================= 1. CONSTELACIÓN
  const POR_ID = {};
  let orden = [], selec = null, svgC = null;
  const escalaX = a => { // escala no lineal: la Antigüedad comprimida, el siglo XX amplio
    const P = [[-600, 0], [-300, 0.06], [1500, 0.09], [1700, 0.16], [1800, 0.24], [1850, 0.30], [1900, 0.38], [1950, 0.54], [1975, 0.72], [2000, 0.9], [2025, 1]];
    for (let i = 0; i < P.length - 1; i++) if (a <= P[i + 1][0]) { const [a0, x0] = P[i], [a1, x1] = P[i + 1]; return x0 + (x1 - x0) * (a - a0) / (a1 - a0); }
    return 1;
  };
  function iniciarConstelacion(extra) {
    L.autores.forEach(a => { POR_ID[a.id] = a; });
    orden = L.autores.slice().sort((x, y) => x.anio - y.anio);
    const p = $('#panel-constelacion');
    const temas = [...new Set(L.autores.flatMap(a => a.temas.map(t => t.split('.')[0])))].sort((a, b) => a - b);
    p.innerHTML = `<p class="lab-ayuda">Cada estrella es un autor del curso, ubicado según la época de su obra principal y agrupado por su corriente. Las líneas muestran quién influyó en quién o con quién discutió. Toca un autor para leer su ficha completa. También puedes ver solo los autores de un tema.</p>
      <div class="lab-chips" id="c-temas"><button class="chip-lab" aria-pressed="true" data-t="">Todos</button>${temas.map(t => `<button class="chip-lab" aria-pressed="false" data-t="${t}">Tema ${t}</button>`).join('')}</div>
      <div class="tema-info" id="tema-info" hidden></div>
      <div class="const-caja"><svg id="const-svg" class="const-svg" role="img" aria-label="Constelación de pensadores del curso"></svg></div>
      <div class="const-leyenda">${Object.entries(L.familias).map(([k, f]) => `<span><i style="background:${f.color}"></i>${esc(f.nombre)}</span>`).join('')}</div>
      <article class="ficha" id="ficha" aria-live="polite"></article>
      <div class="const-lista" id="const-lista"></div>`;
    dibujarConstelacion();
    $$('#c-temas .chip-lab').forEach(b => b.addEventListener('click', () => filtrarTema(b.dataset.t)));
    const lista = $('#const-lista');
    Object.entries(L.familias).forEach(([k, f]) => {
      const col = document.createElement('div');
      col.innerHTML = `<h4 style="color:${f.color}">${esc(f.nombre)}</h4>`;
      orden.filter(a => a.fam === k).forEach(a => { const b = document.createElement('button'); b.type = 'button'; b.textContent = a.nombre; b.addEventListener('click', () => elegirAutor(a.id, true)); col.appendChild(b); });
      lista.appendChild(col);
    });
    if (extra && POR_ID[extra]) elegirAutor(extra, false); else fichaInicial();
  }
  const corto = n => n.replace(/^(Georg W\. F\. |Jean |Lev |Karl |Thomas S\. |Imre |Paul |Michael |Mario |Luis |Ludwig von |Ilya |Edgar |Miguel |Hans-Georg |Jürgen |Paulo |Donald |Lawrence |Antonio |Stanislas |Pierre |Amartya |Hans |Gaston |René |John |David |Immanuel |Auguste |Émile |Wilhelm |Max |Boaventura de )/, '').replace('Humberto Maturana y Francisco Varela', 'Maturana y Varela').replace('Wilfred Carr y Stephen Kemmis', 'Carr y Kemmis').replace('Tony Booth y Mel Ainscow', 'Booth y Ainscow');
  function dibujarConstelacion() {
    svgC = $('#const-svg');
    const fams = Object.keys(L.familias), W = 1500, IZQ = 150, DER = 60, CARRIL = 118, ARR = 34, H = ARR + CARRIL * fams.length + 10;
    svgC.setAttribute('viewBox', `0 0 ${W} ${H}`);
    sv('rect', { class: 'cielo', x: 0, y: 0, width: W, height: H, rx: 14 }, svgC);
    // eje de épocas
    [[-400, 'Antigüedad'], [1600, 'Siglo XVII'], [1750, 'XVIII'], [1850, 'XIX'], [1900, '1900'], [1950, '1950'], [1975, '1975'], [2000, '2000']].forEach(([a, t]) => {
      const x = IZQ + escalaX(a) * (W - IZQ - DER);
      sv('line', { class: 'eje', x1: x, x2: x, y1: ARR - 6, y2: H - 6 }, svgC);
      const tx = sv('text', { class: 'eje-t', x, y: 20, 'text-anchor': 'middle' }, svgC); tx.textContent = t;
    });
    fams.forEach((k, i) => {
      const y = ARR + i * CARRIL;
      if (i % 2 === 0) sv('rect', { class: 'carril', x: 0, y, width: W, height: CARRIL }, svgC);
      const t = sv('text', { class: 'carril-t', x: 14, y: y + CARRIL / 2 + 4, fill: L.familias[k].color }, svgC);
      const pal = L.familias[k].nombre.split(' '); const mitad = Math.ceil(pal.length / 2);
      sv('tspan', { x: 14, dy: '-0.6em' }, t).textContent = pal.slice(0, mitad).join(' ');
      sv('tspan', { x: 14, dy: '1.2em' }, t).textContent = pal.slice(mitad).join(' ');
    });
    // posiciones con separación dentro del carril
    const pos = {};
    fams.forEach((k, i) => {
      const y0 = ARR + i * CARRIL + CARRIL / 2, ocupados = [];
      orden.filter(a => a.fam === k).forEach(a => {
        const x = IZQ + escalaX(a.anio) * (W - IZQ - DER), med = corto(a.nombre).length * 3.4 + 10;
        const offs = [0, -36, 36, -18, 18, -50, 50];
        const choca = o => ocupados.some(q => Math.abs(q.o - o) < 22 && Math.abs(q.x - x) < q.med + med);
        let off = offs.find(o => !choca(o)) ?? 0;
        ocupados.push({ x, o: off, med }); pos[a.id] = [x, y0 + off - 8];
      });
    });
    const gE = sv('g', { class: 'enlaces' }, svgC);
    L.relaciones.forEach(r => {
      const [x1, y1] = pos[r.de], [x2, y2] = pos[r.a], mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - Math.min(60, Math.abs(x2 - x1) / 4) - 10;
      const p = sv('path', { class: 'enlace', d: `M${x1},${y1} Q${mx},${my} ${x2},${y2}` }, gE); p.dataset.de = r.de; p.dataset.a = r.a;
    });
    const gN = sv('g', {}, svgC);
    L.autores.forEach(a => {
      const [x, y] = pos[a.id], col = L.familias[a.fam].color;
      const g = sv('g', { class: 'astro', tabindex: '0', role: 'button', 'aria-label': a.nombre, 'data-id': a.id }, gN);
      sv('circle', { class: 'halo', cx: x, cy: y, r: 15, fill: col }, g);
      sv('circle', { class: 'nucleo', cx: x, cy: y, r: 7.5, fill: col }, g);
      const t = sv('text', { class: 'astro-t', x, y: y + 22, 'text-anchor': 'middle' }, g); t.textContent = corto(a.nombre);
      g.addEventListener('click', () => elegirAutor(a.id, true));
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); elegirAutor(a.id, true); } });
    });
  }
  function limpiarSeleccion() {
    svgC.classList.remove('con-selec');
    $$('.enlace.activo', svgC).forEach(p => p.classList.remove('activo'));
    $$('.astro', svgC).forEach(g => g.classList.remove('sel', 'vecino'));
  }
  function filtrarTema(t) {
    $$('#c-temas .chip-lab').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.t === t)));
    limpiarSeleccion();
    svgC.classList.toggle('filtrado', !!t);
    const del = a => a.temas.some(s => s.split('.')[0] === t);
    $$('.astro', svgC).forEach(g => g.classList.toggle('en-tema', !!t && del(POR_ID[g.dataset.id])));
    $$('.enlace', svgC).forEach(p => p.classList.toggle('en-tema', !!t && del(POR_ID[p.dataset.de]) && del(POR_ID[p.dataset.a])));
    const info = $('#tema-info');
    if (!t) { info.hidden = true; return; }
    const lista = orden.filter(del);
    const subtemas = a => a.temas.filter(s => s.split('.')[0] === t).join(', ');
    info.hidden = false;
    info.innerHTML = `<p class="ficha-kicker">Tema ${t} · ${lista.length} autor${lista.length === 1 ? '' : 'es'}</p><h3>${esc(L.temas[t] || '')}</h3>
      <div class="tema-autores">${lista.map(a => `<button type="button" data-ir="${a.id}" style="--fam:${L.familias[a.fam].color}"><i></i>${esc(a.nombre)}<small>${esc(subtemas(a))}</small></button>`).join('')}</div>`;
    $$('#tema-info [data-ir]').forEach(x => x.addEventListener('click', () => elegirAutor(x.dataset.ir, true)));
  }
  function fichaInicial() {
    $('#ficha').innerHTML = `<p class="ficha-kicker">Constelación de pensadores · ${L.autores.length} autores</p><h2>Elige un autor</h2>
      <p>Cada ficha está pensada para estudiar: contexto, ideas explicadas paso a paso, conceptos clave, un ejemplo en el aula, con quién dialoga, sus límites y cómo citarlo en APA tal como aparece en el compendio.</p>
      <p>¿No sabes por dónde empezar? Recorre el corazón del curso en orden: <button class="link-btn" data-ir="viena">Círculo de Viena</button> → <button class="link-btn" data-ir="popper">Popper</button> → <button class="link-btn" data-ir="kuhn">Kuhn</button> → <button class="link-btn" data-ir="lakatos">Lakatos</button> → <button class="link-btn" data-ir="feyerabend">Feyerabend</button> → <button class="link-btn" data-ir="morin">Morin</button>.</p>`;
    $$('#ficha [data-ir]').forEach(b => b.addEventListener('click', () => elegirAutor(b.dataset.ir, true)));
  }
  function elegirAutor(id, desplazar) {
    const a = POR_ID[id]; if (!a) return; selec = id;
    svgC.classList.remove('filtrado'); $$('.astro.en-tema, .enlace.en-tema', svgC).forEach(g => g.classList.remove('en-tema'));
    $$('#c-temas .chip-lab').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.t === '')));
    svgC.classList.add('con-selec');
    const vecinos = new Set([id]);
    $$('.enlace', svgC).forEach(p => { const on = p.dataset.de === id || p.dataset.a === id; p.classList.toggle('activo', on); if (on) { vecinos.add(p.dataset.de); vecinos.add(p.dataset.a); } });
    $$('.astro', svgC).forEach(g => { g.classList.toggle('sel', g.dataset.id === id); g.classList.toggle('vecino', vecinos.has(g.dataset.id) && g.dataset.id !== id); });
    const fam = L.familias[a.fam];
    const rel = L.relaciones.filter(r => r.de === id || r.a === id).map(r => r.de === id
      ? `<li><strong>${esc(a.nombre)}</strong> ${esc(r.r)} <button class="link-btn" data-ir="${r.a}">${esc(POR_ID[r.a].nombre)}</button></li>`
      : `<li><button class="link-btn" data-ir="${r.de}">${esc(POR_ID[r.de].nombre)}</button> ${esc(r.r)} <strong>${esc(a.nombre)}</strong></li>`).join('');
    const i = orden.indexOf(a), ant = orden[i - 1], sig = orden[i + 1];
    const f = $('#ficha'); f.style.setProperty('--fam', fam.color);
    f.innerHTML = `<p class="ficha-kicker">${esc(fam.nombre)}</p>
      <h2>${esc(a.nombre)}</h2>
      <p class="ficha-datos">${esc(a.vida)} · ${esc(a.lugar)}</p>
      <p class="ficha-temas">Lo ves en: ${a.temas.map(enlaceTema).join(' ')}</p>
      <blockquote class="ficha-frase">${md(a.frase)}</blockquote>
      <div class="ficha-grid">
        <div>
          <h3>Contexto</h3><p>${md(a.contexto)}</p>
          <h3>Sus ideas, paso a paso</h3>
          <ol class="ficha-ideas">${a.ideas.map(x => `<li><strong>${md(x.t)}.</strong> ${md(x.x)}</li>`).join('')}</ol>
          <h3>En el aula</h3><p class="ficha-aula">${md(a.aula)}</p>
          <h3>Límites y críticas</h3><p>${md(a.critica)}</p>
        </div>
        <aside>
          <h3>Conceptos clave</h3><dl class="ficha-conceptos">${a.conceptos.map(c => `<dt>${md(c.t)}</dt><dd>${md(c.d)}</dd>`).join('')}</dl>
          <h3>Obras</h3><ul class="ficha-obras">${a.obras.map(o => `<li>${md(o)}</li>`).join('')}</ul>
          <h3>Cómo citarlo</h3><p class="ficha-cita">${md(a.cita)}</p>
          ${rel ? `<h3>Con quién dialoga</h3><ul class="ficha-rel">${rel}</ul>` : ''}
          <div class="ficha-pensar"><strong>Para pensar:</strong> ${md(a.pregunta)}</div>
        </aside>
      </div>
      <nav class="ficha-nav">${ant ? `<button class="btn-lab-l" data-ir="${ant.id}">← ${esc(ant.nombre)}</button>` : '<span></span>'}${sig ? `<button class="btn-lab-l" data-ir="${sig.id}">${esc(sig.nombre)} →</button>` : ''}</nav>`;
    $$('#ficha [data-ir]').forEach(b => b.addEventListener('click', () => elegirAutor(b.dataset.ir, true)));
    history.replaceState(null, '', '#constelacion=' + id);
    if (desplazar) f.scrollIntoView({ behavior: reducido ? 'auto' : 'smooth', block: 'start' });
  }

  // ======================= 2. ¿ESTO ES CIENCIA?
  const VERED = { si: 'Es ciencia', no: 'No es ciencia', dep: 'Depende' };
  let caso = null, resp = {};
  function iniciarCiencia(extra) {
    const p = $('#panel-ciencia');
    p.innerHTML = `<p class="lab-ayuda">Elige un caso. Para cada autor decide si lo consideraría ciencia, y después compara con lo que de verdad diría. No hay una sola respuesta para todos: ese es justamente el punto del tema 4.</p>
      <div class="lab-chips" id="casos">${L.casos.map(c => `<button class="chip-lab" aria-pressed="false" data-c="${c.id}">${esc(c.titulo)}</button>`).join('')}</div>
      <div id="caso"></div>`;
    $$('#casos .chip-lab').forEach(b => b.addEventListener('click', () => elegirCaso(b.dataset.c)));
    elegirCaso(L.casos.some(c => c.id === extra) ? extra : L.casos[0].id);
  }
  function elegirCaso(id) {
    caso = L.casos.find(c => c.id === id) || L.casos[0]; resp = {};
    $$('#casos .chip-lab').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.c === caso.id)));
    $('#caso').innerHTML = `<article class="caso-card"><h2>${esc(caso.titulo)}</h2><p>${md(caso.texto)}</p></article>
      <div class="lentes">${L.lentes.map(l => `<div class="lente" data-l="${l.id}">
        <div class="lente-cab"><strong>${esc(l.nombre)}</strong><span>${esc(l.pregunta)}</span></div>
        <div class="lente-ops">${Object.entries(VERED).map(([k, t]) => `<button type="button" class="op" data-v="${k}">${t}</button>`).join('')}</div>
        <div class="lente-exp" hidden></div></div>`).join('')}</div>
      <div class="caso-pie"><button class="btn-lab" id="ver-todo">Ver qué diría cada uno</button><span id="caso-res" aria-live="polite"></span></div>
      ${caso.nota ? `<p class="caso-nota" id="caso-nota" hidden>${md(caso.nota)}</p>` : ''}`;
    $$('#caso .lente').forEach(div => $$('.op', div).forEach(b => b.addEventListener('click', () => {
      if (div.classList.contains('revelada')) return;
      resp[div.dataset.l] = b.dataset.v; $$('.op', div).forEach(o => o.setAttribute('aria-pressed', String(o === b)));
      if (Object.keys(resp).length === L.lentes.length) revelar();
    })));
    $('#ver-todo').addEventListener('click', revelar);
    history.replaceState(null, '', '#ciencia=' + caso.id);
  }
  function revelar() {
    let coinc = 0;
    $$('#caso .lente').forEach(div => {
      const [v, x] = caso.v[div.dataset.l]; const mio = resp[div.dataset.l];
      div.classList.add('revelada'); if (mio === v) coinc++;
      $$('.op', div).forEach(o => { o.disabled = true; o.classList.toggle('correcta', o.dataset.v === v); o.classList.toggle('erronea', o.dataset.v === mio && mio !== v); });
      const e = $('.lente-exp', div); e.hidden = false; e.innerHTML = `<strong>${VERED[v]}.</strong> ${md(x)}`;
    });
    const n = Object.keys(resp).length;
    $('#caso-res').textContent = n ? `Coincidiste con ${coinc} de ${L.lentes.length} autores.` : '';
    const nota = $('#caso-nota'); if (nota) nota.hidden = false;
    $('#ver-todo').hidden = true;
  }

  // ======================= 3. CICLO DE KUHN
  let K = { ej: 0, fase: -1, raf: null, ang: -90, play: false, t: null };
  function iniciarKuhn() {
    const k = L.kuhn, p = $('#panel-kuhn');
    p.innerHTML = `<p class="lab-ayuda">Thomas Kuhn describió el desarrollo de la ciencia como un ciclo. Elige un ejemplo y recórrelo fase por fase, o presiona «Reproducir».</p>
      <div class="lab-chips" id="k-ej">${k.ejemplos.map((e, i) => `<button class="chip-lab" aria-pressed="${i === 0}" data-i="${i}">${esc(e.titulo)}</button>`).join('')}</div>
      <div class="kuhn-grid"><div class="kuhn-caja"><svg id="k-svg" viewBox="0 0 520 520" role="img" aria-label="Ciclo de Kuhn"></svg></div>
      <div><div class="kuhn-card" id="k-card"></div>
      <div class="ruta-ctrl"><button class="btn-lab-l" id="k-ant" aria-label="Fase anterior">◀</button><button class="btn-lab" id="k-play">▶ Reproducir</button><button class="btn-lab-l" id="k-sig" aria-label="Fase siguiente">▶</button></div></div></div>
      <div class="aviso-lab"><strong>Advertencia epistemológica.</strong> ${md(k.advertencia)}</div>
      <div class="ficha-pensar"><strong>Para pensar:</strong> ${md(k.pregunta)}</div>`;
    const s = $('#k-svg'), C = 260, R = 180, n = k.fases.length;
    sv('circle', { cx: C, cy: C, r: R, class: 'k-aro' }, s);
    k.fases.forEach((f, i) => {
      const a0 = -90 + i * 360 / n + 4, a1 = -90 + (i + 1) * 360 / n - 4, rad = a => a * Math.PI / 180;
      const P = (r, a) => [C + r * Math.cos(rad(a)), C + r * Math.sin(rad(a))];
      const [x0, y0] = P(R, a0), [x1, y1] = P(R, a1);
      sv('path', { class: 'k-arco', 'data-i': i, d: `M${x0},${y0} A${R},${R} 0 0 1 ${x1},${y1}` }, s);
      const am = (a0 + a1) / 2, [tx, ty] = P(R + 0, am);
      const g = sv('g', { class: 'k-fase', 'data-i': i, tabindex: '0', role: 'button', 'aria-label': f.nombre }, s);
      sv('circle', { cx: tx, cy: ty, r: 30 }, g);
      const num = sv('text', { x: tx, y: ty + 6, 'text-anchor': 'middle', class: 'k-num' }, g); num.textContent = i + 1;
      const [lx, ly] = P(R - 62, am);
      const t = sv('text', { x: lx, y: ly, 'text-anchor': 'middle', class: 'k-lbl' }, s);
      f.nombre.split(' ').forEach((w, j, arr) => { sv('tspan', { x: lx, dy: j === 0 ? `${-(arr.length - 1) * 0.55}em` : '1.1em' }, t).textContent = w; });
      g.addEventListener('click', () => { kDetener(); kIr(i); });
    });
    const cen = sv('text', { x: C, y: C - 4, 'text-anchor': 'middle', class: 'k-centro' }, s); cen.textContent = 'Paradigma';
    const cen2 = sv('text', { x: C, y: C + 20, 'text-anchor': 'middle', class: 'k-centro2' }, s); cen2.textContent = 'según Kuhn (1962)';
    K.marca = sv('circle', { r: 9, class: 'k-marca', cx: C, cy: C - R }, s);
    $$('#k-ej .chip-lab').forEach(b => b.addEventListener('click', () => { kDetener(); K.ej = +b.dataset.i; $$('#k-ej .chip-lab').forEach(x => x.setAttribute('aria-pressed', String(x === b))); kIr(Math.max(0, K.fase)); }));
    $('#k-sig').addEventListener('click', () => { kDetener(); kIr((K.fase + 1) % n); });
    $('#k-ant').addEventListener('click', () => { kDetener(); kIr((K.fase - 1 + n) % n); });
    $('#k-play').addEventListener('click', () => K.play ? kDetener() : kReproducir());
    $('#k-card').innerHTML = `<p class="ficha-kicker">6 fases</p><h3>Presiona «Reproducir» o toca una fase</h3><p>El ciclo empieza en la preciencia y termina en una nueva ciencia normal, que con el tiempo puede entrar otra vez en crisis.</p>`;
  }
  function kIr(i) {
    const k = L.kuhn, n = k.fases.length; K.fase = i;
    $$('#k-svg .k-arco').forEach(a => a.classList.toggle('on', +a.dataset.i <= i));
    $$('#k-svg .k-fase').forEach(g => { g.classList.toggle('on', +g.dataset.i === i); g.classList.toggle('visto', +g.dataset.i < i); });
    const f = k.fases[i], ej = k.ejemplos[K.ej];
    $('#k-card').innerHTML = `<p class="ficha-kicker">Fase ${i + 1} de ${n}</p><h3>${esc(f.nombre)}</h3><p>${md(f.txt)}</p><p class="k-ej"><strong>En el ejemplo:</strong> ${md(ej.pasos[i])}</p>`;
    const destino = -90 + (i + 0.5) * 360 / n; cancelAnimationFrame(K.raf);
    const ini = K.ang, fin = destino < ini ? destino + 360 : destino, t0 = performance.now(), dur = reducido ? 1 : 900;
    const paso = t => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); K.ang = ini + (fin - ini) * e;
      const r = K.ang * Math.PI / 180; K.marca.setAttribute('cx', 260 + 180 * Math.cos(r)); K.marca.setAttribute('cy', 260 + 180 * Math.sin(r));
      if (p < 1) K.raf = requestAnimationFrame(paso); else K.ang = ((K.ang + 90) % 360) - 90; };
    K.raf = requestAnimationFrame(paso);
  }
  function kReproducir() { K.play = true; $('#k-play').textContent = '⏸ Pausa'; let i = K.fase >= L.kuhn.fases.length - 1 ? 0 : K.fase + 1;
    const sig = () => { if (!K.play) return; kIr(i); i++; if (i >= L.kuhn.fases.length) { K.t = setTimeout(kDetener, 5000); return; } K.t = setTimeout(sig, 5000); }; sig(); }
  function kDetener() { K.play = false; clearTimeout(K.t); const b = $('#k-play'); if (b) b.textContent = '▶ Reproducir'; }

  // ======================= 4. CEREBRO Y NEUROMITOS
  function iniciarCerebro() {
    const p = $('#panel-cerebro');
    p.innerHTML = `<p class="lab-ayuda">Toca una zona del cerebro para ver qué hace y qué significa para el aula. Las estructuras internas están marcadas con línea punteada. Recuerda: el cerebro trabaja en redes; ninguna zona aprende sola.</p>
      <div class="cerebro-grid"><div class="cerebro-caja"><svg id="br-svg" viewBox="0 0 600 430" role="img" aria-label="Cerebro visto de lado, con la frente a la izquierda"></svg>
        <label class="br-toggle"><input type="checkbox" id="br-int" checked> Mostrar estructuras internas</label></div>
        <div class="br-card" id="br-card"><p class="ficha-kicker">Tema 7</p><h3>Elige una zona</h3><p>La neurociencia actual habla de redes que conectan zonas distantes: atención, control ejecutivo, memoria, lenguaje y emoción trabajan coordinadas.</p></div></div>
      <h2 class="lab-h2">Los cuatro pilares del aprendizaje (Dehaene, 2018/2019)</h2>
      <div class="pilares">${L.pilares.map((x, i) => `<div class="pilar"><span>${i + 1}</span><h4>${esc(x.t)}</h4><p>${md(x.x)}</p></div>`).join('')}</div>
      <h2 class="lab-h2">¿Mito o realidad?</h2>
      <p class="lab-ayuda">Dekker y sus colegas (2012) encontraron que los docentes aceptaban, en promedio, alrededor de la mitad de los neuromitos que se les presentaron. ¿Y tú?</p>
      <div class="mitos" id="mitos"></div>`;
    dibujarCerebro();
    $('#br-int').addEventListener('change', e => $('#br-svg').classList.toggle('sin-int', !e.target.checked));
    nuevaRondaMitos();
  }
  function dibujarCerebro() {
    const s = $('#br-svg');
    const contorno = 'M95,215 C80,140 135,70 230,52 C320,35 420,48 490,100 C545,142 560,205 535,250 C520,280 495,292 470,294 C455,300 440,300 425,296 C405,318 370,330 330,326 C300,322 280,312 262,300 C230,306 190,304 160,290 C120,272 102,250 95,215 Z';
    const defs = sv('defs', {}, s); const cp = sv('clipPath', { id: 'br-clip' }, defs); sv('path', { d: contorno }, cp);
    sv('path', { d: 'M440,300 C470,300 515,300 530,325 C540,345 520,372 488,375 C455,378 430,362 425,340 C420,322 425,306 440,300 Z', class: 'br-zona', 'data-z': 'cerebelo' }, s);
    sv('path', { d: 'M395,320 C400,345 402,370 398,410 L430,410 C428,380 430,350 428,325 Z', class: 'br-tronco' }, s);
    const g = sv('g', { 'clip-path': 'url(#br-clip)' }, s);
    sv('path', { d: 'M0,0 L235,0 L235,215 C200,225 150,240 0,260 Z', class: 'br-zona', 'data-z': 'prefrontal' }, g);
    sv('path', { d: 'M235,0 L330,0 L330,190 C300,200 265,208 235,215 Z', class: 'br-zona br-motor', 'data-z': 'prefrontal' }, g);
    sv('path', { d: 'M330,0 L470,0 L470,205 C420,200 370,195 330,190 Z', class: 'br-zona', 'data-z': 'parietal' }, g);
    sv('path', { d: 'M470,0 L620,0 L620,330 L470,330 L470,205 Z', class: 'br-zona', 'data-z': 'occipital' }, g);
    sv('path', { d: 'M0,260 C150,240 200,225 235,215 C265,208 300,200 330,190 C370,195 420,200 470,205 L470,330 L0,330 Z', class: 'br-zona', 'data-z': 'temporal' }, g);
    // surcos decorativos
    ['M150,110 C185,125 205,150 215,185', 'M300,70 C310,110 318,150 330,188', 'M380,90 C400,120 420,160 430,198', 'M180,262 C240,252 300,250 370,262', 'M120,160 C150,170 175,190 190,215'].forEach(d => sv('path', { d, class: 'br-surco' }, g));
    // lenguaje (superficie)
    sv('ellipse', { cx: 215, cy: 222, rx: 26, ry: 16, class: 'br-zona br-lenguaje', 'data-z': 'lenguaje' }, s);
    sv('ellipse', { cx: 405, cy: 228, rx: 28, ry: 16, class: 'br-zona br-lenguaje', 'data-z': 'lenguaje' }, s);
    // estructuras internas
    const gi = sv('g', { class: 'br-int' }, s);
    sv('path', { d: 'M215,150 C260,118 360,112 420,150 C405,140 360,135 330,138 C290,140 250,150 230,165 Z', class: 'br-zona br-interna', 'data-z': 'calloso' }, gi);
    sv('path', { d: 'M265,268 C290,282 330,288 370,270 C385,262 392,250 388,244 C370,262 330,270 295,262 Z', class: 'br-zona br-interna', 'data-z': 'hipocampo' }, gi);
    sv('circle', { cx: 258, cy: 262, r: 12, class: 'br-zona br-interna', 'data-z': 'amigdala' }, gi);
    sv('circle', { cx: 255, cy: 192, r: 13, class: 'br-zona br-interna', 'data-z': 'recompensa' }, gi);
    const etq = [[120, 150, 'Prefrontal'], [395, 140, 'Parietal'], [520, 200, 'Occipital'], [330, 300, 'Temporal'], [485, 342, 'Cerebelo']];
    etq.forEach(([x, y, t]) => { const e = sv('text', { x, y, class: 'br-etq', 'text-anchor': 'middle' }, s); e.textContent = t; });
    const fl = sv('text', { x: 40, y: 418, class: 'br-nota' }, s); fl.textContent = '← frente';
    s.addEventListener('click', e => { const z = e.target.dataset && e.target.dataset.z; if (z) elegirZona(z); });
    $$('.br-zona', s).forEach(z => { z.setAttribute('tabindex', '0'); z.setAttribute('role', 'button'); z.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); elegirZona(z.dataset.z); } }); });
  }
  function elegirZona(id) {
    const z = L.cerebro.find(c => c.id === id); if (!z) return;
    $$('#br-svg .br-zona').forEach(p => p.classList.toggle('on', p.dataset.z === id));
    $('#br-card').innerHTML = `<p class="ficha-kicker">${esc(z.tipo)}</p><h3>${esc(z.nombre)}</h3><p>${md(z.txt)}</p><p class="ficha-aula"><strong>En el aula:</strong> ${md(z.aula)}</p>`;
  }
  let M = null;
  function nuevaRondaMitos() { M = { lista: mezcla(L.mitos).slice(0, 10), i: 0, ok: 0 }; pintarMito(); }
  function pintarMito() {
    const c = $('#mitos');
    if (M.i >= M.lista.length) {
      const mejor = Math.max(Number(lee('lab_mitos') || 0), M.ok); guarda('lab_mitos', String(mejor));
      c.innerHTML = `<div class="mito-card"><p class="ficha-kicker">Resultado</p><h3>${M.ok} de ${M.lista.length}</h3><p>${M.ok >= 9 ? 'Excelente: tienes buenas defensas contra los neuromitos.' : M.ok >= 6 ? 'Bien. Revisa los que fallaste: son justo los que más circulan entre docentes.' : 'Estos mitos están en muchos cursos para maestros: vale la pena repasar el tema 7.4.'} Tu mejor resultado: ${mejor}.</p><button class="btn-lab" id="m-otra">Otra ronda</button></div>`;
      $('#m-otra').addEventListener('click', nuevaRondaMitos); return;
    }
    const m = M.lista[M.i];
    c.innerHTML = `<div class="mito-card"><p class="ficha-kicker">Afirmación ${M.i + 1} de ${M.lista.length} · aciertos: ${M.ok}</p><h3>«${esc(m.t)}»</h3>
      <div class="mito-ops"><button class="op" data-v="mito">Es un mito</button><button class="op" data-v="realidad">Tiene respaldo</button></div><div id="m-exp" aria-live="polite"></div></div>`;
    $$('#mitos .op').forEach(b => b.addEventListener('click', () => {
      const bien = b.dataset.v === m.v; if (bien) M.ok++;
      $$('#mitos .op').forEach(o => { o.disabled = true; o.classList.toggle('correcta', o.dataset.v === m.v); o.classList.toggle('erronea', o === b && !bien); });
      $('#m-exp').innerHTML = `<p class="mito-exp"><strong>${bien ? '¡Bien!' : 'No.'} ${m.v === 'mito' ? 'Es un neuromito.' : 'Tiene respaldo de la investigación.'}</strong> ${md(m.x)}</p><button class="btn-lab" id="m-sig">Siguiente</button>`;
      $('#m-sig').addEventListener('click', () => { M.i++; pintarMito(); }); $('#m-sig').focus();
    }));
  }

  // ======================= 5. BRÚJULA DEL INVESTIGADOR
  function iniciarBrujula() {
    const B = L.brujula, p = $('#panel-brujula');
    let borrador = ''; try { borrador = lee('lab_pregunta') || ''; } catch (e) {}
    p.innerHTML = `<p class="lab-ayuda">Responde cinco preguntas sobre tu investigación. La brújula te mostrará con qué paradigma encaja mejor tu postura (tema 3.1), qué enfoque, técnicas y criterios de rigor le corresponden y qué autores puedes citar para fundamentarla. Es un punto de partida para conversar con tu asesor, no un veredicto.</p>
      <label class="br-label" for="b-preg">Tu pregunta de investigación (opcional)</label>
      <textarea id="b-preg" rows="2" placeholder="Ejemplo: ¿Cómo viven los docentes de secundaria la elaboración del programa analítico?">${esc(borrador)}</textarea>
      <form id="b-form">${B.preguntas.map((q, i) => `<fieldset class="b-q"><legend>${i + 1}. ${esc(q.t)}</legend>${q.o.map(([t, v], j) => `<label><input type="radio" name="q${i}" value="${v}" ${''}> ${esc(t)}</label>`).join('')}</fieldset>`).join('')}
      <button class="btn-lab" type="submit">Ver mi brújula</button><span class="b-falta" id="b-falta" aria-live="polite"></span></form>
      <div id="b-res"></div>`;
    $('#b-preg').addEventListener('input', e => guarda('lab_pregunta', e.target.value));
    $('#b-form').addEventListener('submit', e => { e.preventDefault(); calcularBrujula(); });
  }
  function calcularBrujula() {
    const B = L.brujula, puntos = { P: 0, I: 0, S: 0 }; let mixto = false, faltan = 0;
    B.preguntas.forEach((q, i) => { const r = document.querySelector(`input[name="q${i}"]:checked`); if (!r) { faltan++; return; } if (r.value === 'M') { mixto = true; puntos.P += 0.5; puntos.I += 0.5; } else puntos[r.value]++; });
    if (faltan) { $('#b-falta').textContent = `Te falta${faltan > 1 ? 'n' : ''} ${faltan} pregunta${faltan > 1 ? 's' : ''}.`; return; }
    $('#b-falta').textContent = '';
    const tot = puntos.P + puntos.I + puntos.S, ord = Object.entries(puntos).sort((a, b) => b[1] - a[1]);
    let clave = ord[0][0]; if (mixto && ['P', 'I'].includes(ord[0][0]) && ['P', 'I'].includes(ord[1][0]) && ord[0][1] - ord[1][1] <= 1) clave = 'M';
    const pf = B.perfiles[clave], preg = $('#b-preg').value.trim();
    const lista = a => a.length > 1 ? a.slice(0, -1).join(', ') + ' y ' + a[a.length - 1] : a[0];
    const parrafo = `Esta investigación se ubica en ${clave === 'M' ? 'una perspectiva de complementariedad de paradigmas' : 'el ' + pf.nombre.toLowerCase()}, con un enfoque ${pf.enfoque.toLowerCase()}. Esta elección ${pf.frase}. ${preg ? `Para responder a la pregunta «${preg.replace(/[«»]/g, '')}», se` : 'Se'} recurrirá a técnicas como ${lista(pf.tecnicas.slice(0, 2).map(t => t.toLowerCase()))}, y la calidad del estudio se cuidará con criterios de ${lista(pf.rigor.map(t => t.toLowerCase()))}. Esta postura se fundamenta en autores como ${lista(pf.autores)}.`;
    const nombres = { P: 'Positivista', I: 'Interpretativo', S: 'Sociocrítico' };
    $('#b-res').innerHTML = `<div class="b-res">
      <div class="b-barras">${['P', 'I', 'S'].map(k => `<div class="b-barra"><span>${nombres[k]}</span><div><i style="width:${Math.round(100 * puntos[k] / tot)}%"></i></div><b>${Math.round(100 * puntos[k] / tot)} %</b></div>`).join('')}</div>
      <p class="ficha-kicker">Tu brújula apunta a</p><h2>${esc(pf.nombre)}</h2><p><strong>Enfoque:</strong> ${esc(pf.enfoque)} · <strong>Finalidad:</strong> ${esc(pf.finalidad)}</p>
      <div class="b-cols"><div><h3>Técnicas que encajan</h3><ul>${pf.tecnicas.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>
      <div><h3>Criterios de rigor</h3><ul>${pf.rigor.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>
      <div><h3>Autores para fundamentar</h3><ul>${pf.autores.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div></div>
      <p class="aviso-lab"><strong>Riesgo que debes vigilar:</strong> ${esc(pf.riesgo)}</p>
      <h3>Borrador de tu fundamentación epistemológica</h3><p class="b-parrafo" id="b-parrafo">${esc(parrafo)}</p>
      <button class="btn-lab" id="b-copiar" type="button">Copiar el párrafo</button> <span id="b-copiado" aria-live="polite"></span>
      <p class="lab-ayuda" style="margin-top:12px">Recuerda: ningún paradigma es superior en abstracto; cada uno responde a preguntas distintas (tema 1.3). Si tus respuestas se repartieron, quizá tu pregunta pide un enfoque mixto o necesita precisarse.</p></div>`;
    $('#b-copiar').addEventListener('click', () => { const t = $('#b-parrafo').textContent; (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => { $('#b-copiado').textContent = '¡Copiado!'; }).catch(() => { $('#b-copiado').textContent = 'Selecciónalo y cópialo manualmente.'; }); });
    $('#b-res').scrollIntoView({ behavior: reducido ? 'auto' : 'smooth', block: 'start' });
  }

  // ======================= 6. LÍNEA DEL TIEMPO DE LAS IDEAS
  const ERAS = [[-Infinity, 'Antigüedad'], [1500, 'Revolución científica y modernidad'], [1800, 'Siglo XIX: nacen las ciencias sociales'], [1900, 'Primera mitad del siglo XX'], [1950, 'Segunda mitad del siglo XX'], [2000, 'Siglo XXI']];
  const eraDe = a => { let n = ERAS[0][1]; ERAS.forEach(([d, x]) => { if (a >= d) n = x; }); return n; };
  let racha = 0;
  function iniciarTiempo() {
    const p = $('#panel-tiempo'), T = L.tiempo.slice().sort((a, b) => a.a - b.a);
    const temas = [...new Set(T.map(e => e.s.split('.')[0]))].sort((a, b) => a - b);
    p.innerHTML = `<div class="reto" id="reto"></div><div class="lab-chips" id="t-fil"><button class="chip-lab" aria-pressed="true" data-t="">Todos</button>${temas.map(t => `<button class="chip-lab" aria-pressed="false" data-t="${t}">Tema ${t}</button>`).join('')}</div><div class="linea" id="linea"></div>`;
    const cont = $('#linea'); let era = null;
    T.forEach(ev => {
      const e = eraDe(ev.a); if (e !== era) { era = e; const d = document.createElement('div'); d.className = 'era'; d.textContent = e; cont.appendChild(d); }
      const d = document.createElement('article'); d.className = 'evento'; d.dataset.t = ev.s.split('.')[0];
      d.innerHTML = `<span class="st">${enlaceTema(ev.s)}</span><span class="fecha">${esc(ev.f)}</span><h4>${md(ev.t)}</h4><p>${md(ev.x)}</p>`;
      cont.appendChild(d);
    });
    $$('#t-fil .chip-lab').forEach(b => b.addEventListener('click', () => {
      const t = b.dataset.t; $$('#t-fil .chip-lab').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      $$('#linea .evento').forEach(e => e.classList.toggle('oculto', !!t && e.dataset.t !== t));
      $$('#linea .era').forEach(era => { let n = era.nextElementSibling, alguno = false; while (n && !n.classList.contains('era')) { if (!n.classList.contains('oculto')) alguno = true; n = n.nextElementSibling; } era.style.display = alguno ? '' : 'none'; });
    }));
    nuevoReto();
  }
  function nuevoReto() {
    const T = L.tiempo; let a, b;
    do { a = T[Math.floor(Math.random() * T.length)]; b = T[Math.floor(Math.random() * T.length)]; } while (a === b || Math.abs(a.a - b.a) < 3);
    const mejor = Number(lee('lab_racha') || 0), r = $('#reto');
    r.innerHTML = `<h3>Reto: ¿qué fue primero?</h3><p>Elige la idea o la obra más antigua. Racha actual: <strong>${racha}</strong> · tu mejor racha: <strong>${mejor}</strong></p>
      <div class="reto-ops">${[a, b].map((e, i) => `<button type="button" data-i="${i}">${md(e.t)}<small>Tema ${esc(e.s)}</small></button>`).join('')}</div><div class="reto-pie" id="reto-pie"></div>`;
    const ops = $$('.reto-ops button', r), par = [a, b];
    ops.forEach(btn => btn.addEventListener('click', () => {
      const i = +btn.dataset.i, bien = par[i].a <= par[1 - i].a;
      ops.forEach((o, k) => { o.disabled = true; o.classList.add(par[k].a <= par[1 - k].a ? 'ok' : 'mal'); o.querySelector('small').textContent = par[k].f; });
      racha = bien ? racha + 1 : 0; if (racha > mejor) guarda('lab_racha', String(racha));
      $('#reto-pie').innerHTML = `<span>${bien ? '¡Bien!' : 'Casi.'}</span><button class="btn-lab" type="button" id="reto-sig">Otro reto</button>`;
      $('#reto-sig').addEventListener('click', nuevoReto);
    }));
  }
})();
