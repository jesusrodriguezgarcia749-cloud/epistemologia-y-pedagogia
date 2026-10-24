// tareas-datos.js — Tareas digitales y juegos de Epistemología y Pedagogía (Parcial 2).
// Todo sale del libro de texto de la materia (compendio del Aula Virtual).

// tipo: cuadro (en equipo o individual, en vivo, con clave) · practica (juego sin calificación) · pronto
export const TEMAS_TAREAS = [
  { tema: '2 y 3', titulo: 'Naturaleza del conocimiento y racionalidad científica clásica', fecha: '2026-10-26', fechaTexto: 'Lun 26 de octubre', acts: [
    { id: 'paradigmas', tipo: 'cuadro', icono: '📋', nombre: 'Cuadro de los tres paradigmas', modo: 'En equipo · en vivo', desc: 'Positivista, interpretativo y sociocrítico: finalidad, realidad, métodos, autores y un ejemplo real de tesis que ustedes investigan.' },
    { id: 'que-paradigma', tipo: 'practica', icono: '🧭', nombre: '¿Qué paradigma es?', modo: 'Juego de práctica', desc: 'Títulos de tesis, fragmentos y autores: ¿positivista, interpretativo o sociocrítico? Y una ronda de pensamiento lineal contra sistémico.' },
  ] },
  { tema: '3 y 4', titulo: 'Lógica dialéctica y concepción contemporánea de la ciencia', fecha: '2026-10-27', fechaTexto: 'Mar 27 de octubre', acts: [
    { id: 'quien-lo-dijo', tipo: 'pronto', icono: '🗣️', nombre: '¿Quién lo dijo?', modo: 'Juego de práctica', desc: 'Frases y conceptos contra su autor: Popper, Kuhn, Lakatos, Feyerabend, Morin… Muy pronto.' },
    { id: 'ficha-autor', tipo: 'pronto', icono: '🧩', nombre: 'Ficha del autor', modo: 'En equipo · en vivo', desc: 'El rompecabezas del Tema 4: cada equipo se vuelve experto en un autor y lo expone. Muy pronto.' },
  ] },
];
export const TAREAS_DIG = Object.fromEntries(TEMAS_TAREAS.flatMap(t => t.acts.map(a => [a.id, { ...a, tema: t.tema, titulo: t.titulo, fecha: t.fecha, fechaTexto: t.fechaTexto }])));
export const califica = a => a && (a.tipo === 'cuadro');
export const catalogoId = id => 'dig-' + id;
export const nombreCatalogo = a => `${a.tema} · ${a.nombre}`;
const r1 = n => Math.round(n * 10) / 10;
const palabras = t => (String(t || '').trim().match(/\S+/g) || []).length;

// ---------- Cuadros comparativos (en equipo: grupos/{g}/equipos/{e}/atlas/{id}; individual: alumnos/{a}/atlas/{ind})
// filas: [clave, título, ayuda, investiga?] · las filas con investiga piden su fuente ({fila}_fuente)
export const MIN_PALABRAS_CELDA = 5;
export const CUADROS = {
  paradigmas: {
    id: 'act-paradigmas', ind: 'tarea-paradigmas', clave: 'paradigmas',
    titulo: 'Cuadro de los tres paradigmas de la investigación educativa', kicker: 'Tema 3.1 · Bases epistemológicas de las ciencias sociales', archivo: 'Cuadro_paradigmas',
    ayuda: 'Escriban con sus palabras lo que aprendieron en clase y en el compendio (subtema 3.1). La fila marcada <b>🔎 Investiga</b> no viene en el compendio: busquen en Redalyc, SciELO, Dialnet o un repositorio de tesis un trabajo real de cada paradigma y anoten su fuente.',
    columnas: [['positivista', 'Positivista', '#2E6FA8'], ['interpretativo', 'Interpretativo', '#3F7A4F'], ['sociocritico', 'Sociocrítico', '#A63D2F']],
    filas: [
      ['finalidad', 'Finalidad', '¿Para qué investiga?'],
      ['realidad', 'Cómo entiende la realidad', '¿Objetiva, construida, atravesada por el poder?'],
      ['relacion', 'Relación investigador-objeto', '¿Distancia, interacción o compromiso?'],
      ['metodos', 'Métodos y técnicas típicos', 'Experimentos, entrevistas, talleres…'],
      ['autores', 'Autores de referencia', '¿Quiénes fundaron o sostienen esta tradición?'],
      ['ejemplo', 'Ejemplo en educación', 'Un ejemplo de investigación educativa de este paradigma.'],
      ['tesis', 'Una tesis o artículo real', 'Busquen un trabajo real de pedagogía de cada paradigma: título, autor y año.', true],
    ],
    respuestas: {
      finalidad: ['Explicar, predecir y controlar los fenómenos.', 'Comprender e interpretar el sentido que las personas dan a sus acciones.', 'Transformar la realidad y emancipar a las personas.'],
      realidad: ['Objetiva, externa y medible.', 'Construida socialmente y múltiple.', 'Histórica y atravesada por el poder.'],
      relacion: ['Distancia y neutralidad.', 'Interacción e implicación.', 'Compromiso y participación.'],
      metodos: ['Experimentos, encuestas y estadística.', 'Entrevistas, observación y etnografía.', 'Investigación-acción y talleres participativos.'],
      autores: ['Comte (estadio positivo) y Durkheim (tratar los hechos sociales como cosas).', 'Dilthey (comprender), Weber (sociología comprensiva) y Gadamer (hermenéutica).', 'Marx, la Escuela de Fráncfort, Habermas (interés emancipatorio), Freire, y Carr y Kemmis.'],
      ejemplo: ['Medir el efecto de un programa de lectura.', 'Entender cómo viven los docentes la reforma.', 'Que la comunidad escolar diagnostique y resuelva su problema de deserción.'],
      tesis: ['Respuesta abierta: un estudio que mida variables o compare grupos (por ejemplo, un cuasiexperimento o una encuesta con estadística).', 'Respuesta abierta: un estudio de caso, una etnografía o historias de vida.', 'Respuesta abierta: una investigación-acción o una intervención participativa.'],
    },
  },
};
export function sugerirCuadro(A, celdas) {
  celdas = celdas || {};
  const total = A.filas.length * A.columnas.length;
  const textos = A.filas.flatMap(([f]) => A.columnas.map(([c]) => celdas[`${f}_${c}`]));
  const llenas = textos.filter(v => palabras(v) >= MIN_PALABRAS_CELDA).length, cortas = textos.filter(v => palabras(v) > 0 && palabras(v) < MIN_PALABRAS_CELDA).length;
  const inv = A.filas.filter(x => x[3]), fu = inv.filter(([f]) => (celdas[`${f}_fuente`] || '').trim()).length;
  const nota = inv.length ? 8 * llenas / total + 2 * fu / inv.length : 10 * llenas / total;
  return { nota: r1(nota), detalle: `${llenas}/${total} celdas llenas${cortas ? ` (+${cortas} con menos de ${MIN_PALABRAS_CELDA} palabras, no cuentan)` : ''}${inv.length ? ` · ${fu}/${inv.length} fuente${inv.length === 1 ? '' : 's'} de investigación` : ''}` };
}

// ---------- 🧭 ¿Qué paradigma es? · g: 'par' (P, I, S) o 'lin' (L lineal, S sistémica)
export const PARADIGMAS_OP = { par: [['P', 'Positivista', '#2E6FA8'], ['I', 'Interpretativo', '#3F7A4F'], ['S', 'Sociocrítico', '#A63D2F']], lin: [['L', 'Lineal', '#6B5B4B'], ['S', 'Sistémica', '#2BA3A0']] };
export const QUE_PARADIGMA = [
  { g: 'par', niv: 1, e: '📈', q: 'Efecto de un programa de lectura en voz alta sobre la comprensión lectora en alumnos de 4.º de primaria: estudio cuasiexperimental', c: 'P', x: 'Mide el efecto de una intervención comparando grupos: busca explicar y controlar. Es el ejemplo del compendio: «medir el efecto de un programa de lectura».' },
  { g: 'par', niv: 1, e: '📊', q: 'Relación entre el nivel socioeconómico y el rendimiento en matemáticas en telesecundarias de Campeche', c: 'P', x: 'Relaciona variables medibles para encontrar regularidades, como la tradición de Durkheim.' },
  { g: 'par', niv: 1, e: '🎙️', q: 'Ser maestra en una escuela multigrado: historias de vida de docentes rurales', c: 'I', x: 'Las historias de vida buscan comprender cómo viven las personas su experiencia: investigación cualitativa de la tradición comprensiva.' },
  { g: 'par', niv: 1, e: '🏫', q: 'Cómo viven los docentes de secundaria la llegada de la Nueva Escuela Mexicana: estudio fenomenológico', c: 'I', x: 'Busca el sentido que los docentes dan a la reforma: «entender cómo viven los docentes la reforma».' },
  { g: 'par', niv: 1, e: '🤝', q: 'Investigación-acción participativa con madres y padres para reducir la deserción en una secundaria técnica', c: 'S', x: 'La comunidad diagnostica y resuelve su propio problema: conocer para transformar.' },
  { g: 'par', niv: 1, e: '✊', q: 'Alfabetización crítica con jóvenes de una colonia popular desde la pedagogía de Paulo Freire', c: 'S', x: 'Freire y la educación popular son herederos de la tradición crítica: buscan la emancipación.' },
  { g: 'par', niv: 2, e: '🧪', q: 'Correlación entre las horas de sueño y el promedio escolar en estudiantes de bachillerato', c: 'P', x: 'Una correlación entre variables medidas: explicar y predecir.' },
  { g: 'par', niv: 2, e: '📝', q: 'Diseño y validación de un cuestionario para medir la ansiedad ante los exámenes', c: 'P', x: 'Construir un instrumento de medición confiable y válido es propio de la investigación cuantitativa.' },
  { g: 'par', niv: 2, e: '🌍', q: 'Comparación de los resultados de PISA entre escuelas públicas y privadas', c: 'P', x: 'Los grandes estudios internacionales como PISA son el ejemplo del compendio de la tradición positivista en educación.' },
  { g: 'par', niv: 2, e: '🔍', q: 'Los significados que los alumnos atendidos por USAER atribuyen a la inclusión: estudio de caso', c: 'I', x: 'El estudio de caso que busca significados es investigación interpretativa.' },
  { g: 'par', niv: 2, e: '🧸', q: 'Etnografía de un salón de preescolar: rutinas, juego y normas no escritas', c: 'I', x: 'La etnografía escolar es uno de los métodos típicos del paradigma interpretativo.' },
  { g: 'par', niv: 2, e: '♿', q: 'Talleres con la comunidad escolar para diagnosticar y transformar las prácticas de exclusión hacia alumnos con discapacidad', c: 'S', x: 'Talleres participativos con la intención de transformar: paradigma sociocrítico.' },
  { g: 'par', niv: 2, e: '🔁', q: 'Los docentes investigan su propia práctica para transformar la evaluación en su escuela', c: 'S', x: 'Es investigación-acción: los participantes investigan para cambiar su propia realidad.' },
  { g: 'par', niv: 2, e: '📋', q: '«La investigadora aplicó una encuesta a 400 docentes, mantuvo distancia y neutralidad y analizó los datos con estadística inferencial.»', c: 'P', x: 'Distancia, neutralidad, encuesta y estadística: los rasgos del paradigma positivista.' },
  { g: 'par', niv: 2, e: '📓', q: '«La investigadora convivió seis meses con la comunidad escolar, llevó un diario de campo y buscó comprender el sentido que las familias dan a la escuela.»', c: 'I', x: 'Interacción, implicación, observación y búsqueda de significados: paradigma interpretativo.' },
  { g: 'par', niv: 2, e: '⚖️', q: '«El conocimiento nunca es neutral: siempre está ligado a intereses, y esta investigación busca liberar a los participantes de la dominación.»', c: 'S', x: 'Es la tesis central de la tradición crítica, de Marx a la Escuela de Fráncfort.' },
  { g: 'par', niv: 3, e: '🧱', q: 'Durkheim: «hay que tratar los hechos sociales como cosas»', c: 'P', x: 'Las normas y las instituciones existen fuera de los individuos y pueden estudiarse objetivamente, desde fuera.' },
  { g: 'par', niv: 3, e: '🪜', q: 'Comte: la humanidad pasa por los estadios teológico, metafísico y positivo', c: 'P', x: 'En el estadio positivo solo se buscan, mediante la observación, las leyes que relacionan los hechos.' },
  { g: 'par', niv: 3, e: '💭', q: 'Weber: el científico social debe interpretar el sentido que los actores dan a sus acciones', c: 'I', x: 'Es la sociología comprensiva de Max Weber.' },
  { g: 'par', niv: 3, e: '🗨️', q: 'Gadamer: comprender es un diálogo entre el horizonte del intérprete y el de lo interpretado', c: 'I', x: 'La hermenéutica de Gadamer es el método general de las ciencias humanas.' },
  { g: 'par', niv: 3, e: '🛠️', q: 'Habermas: el interés técnico, que busca controlar la naturaleza', c: 'P', x: 'Es el interés de las ciencias empírico-analíticas.' },
  { g: 'par', niv: 3, e: '🤲', q: 'Habermas: el interés práctico, que busca el entendimiento entre las personas', c: 'I', x: 'Es el interés de las ciencias hermenéuticas.' },
  { g: 'par', niv: 3, e: '🕊️', q: 'Habermas: el interés emancipatorio, que busca liberar a las personas de la dominación', c: 'S', x: 'Es el interés de las ciencias críticas.' },
  { g: 'par', niv: 3, e: '🌐', q: 'La realidad es construida socialmente y hay múltiples realidades', c: 'I', x: 'Así entiende la realidad el paradigma interpretativo.' },
  { g: 'par', niv: 3, e: '🏛️', q: 'La realidad es histórica y está atravesada por relaciones de poder', c: 'S', x: 'Así entiende la realidad el paradigma sociocrítico.' },
  // pensamiento lineal o sistémico (3.2 y 3.3)
  { g: 'lin', niv: 1, e: '⏰', q: 'Kevin llega tarde, se le hace un reporte; si sigue llegando tarde, más reportes', c: 'L', x: 'Es la primera reacción lineal de la escuela en el caso de Kevin: causa → efecto. Los reportes se acumularon y nada cambió.' },
  { g: 'lin', niv: 1, e: '🏠', q: 'La trabajadora social descubre que Kevin cuida a sus hermanos porque su mamá entró al turno temprano; la escuela se coordina con una vecina', c: 'S', x: 'La escuela, la familia, el empleo de la madre y el transporte forman un sistema: la solución apareció al mirar el sistema completo.' },
  { g: 'lin', niv: 1, e: '🔄', q: 'El alumno no estudia porque no le gusta la materia, no le gusta porque reprueba y reprueba porque no estudia', c: 'S', x: 'Es una relación circular, con retroalimentación: no se entiende con una sola cadena de causas.' },
  { g: 'lin', niv: 2, e: '🧩', q: 'Para enseñar fracciones primero hay que dominar la división', c: 'L', x: 'Identificar prerrequisitos es un uso útil del pensamiento lineal en educación.' },
  { g: 'lin', niv: 2, e: '🌡️', q: 'El clima de una escuela surge de las relaciones entre todos, no de cada salón por separado', c: 'S', x: 'Es una propiedad emergente: el todo es más que la suma de las partes.' },
  { g: 'lin', niv: 2, e: '✂️', q: 'Descartes: dividir cada dificultad en tantas partes como sea posible para resolverla mejor', c: 'L', x: 'Es el precepto que la ciencia clásica combinó con el razonamiento lineal.' },
  { g: 'lin', niv: 2, e: '💧', q: 'El agua moja, pero ni el hidrógeno ni el oxígeno mojan por separado', c: 'S', x: 'Ejemplo de propiedad emergente de la Teoría General de los Sistemas de Bertalanffy.' },
  { g: 'lin', niv: 2, e: '🧮', q: 'Diseñar un experimento controlado: se cambia una sola variable y se mide su efecto', c: 'L', x: 'El experimento controlado aísla una causa y su efecto: pensamiento lineal.' },
  { g: 'lin', niv: 3, e: '🛤️', q: 'Equifinalidad: se puede llegar al mismo resultado por caminos distintos', c: 'S', x: 'Es una de las características de los sistemas.' },
  { g: 'lin', niv: 3, e: '🎯', q: 'Si A causa B y B causa C, conociendo A podemos predecir C, como fichas de dominó', c: 'L', x: 'Es la definición del razonamiento lineal de la ciencia clásica.' },
];

// ---------- ⚡ Arena en vivo: conjuntos de preguntas (o[0] es la correcta; se barajan)
export const ARENA = {
  tema2: { titulo: 'Tema 2 · Naturaleza del conocimiento', preguntas: [
    { q: 'El pescador de Champotón sabe en qué temporada sale el pulpo. ¿Qué tipo de conocimiento tiene?', o: ['Empírico o cotidiano', 'Científico', 'Filosófico', 'Religioso'], x: 'Práctico, útil y preciso, pero adquirido por experiencia y tradición, no sistematizado.' },
    { q: '¿Qué tipo de conocimiento se valida por argumentación coherente?', o: ['Filosófico', 'Artístico', 'Empírico', 'Religioso'], x: 'Usa la razón y los argumentos, no los experimentos. La epistemología misma es conocimiento filosófico.' },
    { q: 'El conjunto de comunidades, universidades, revistas y congresos es la ciencia como…', o: ['Institución', 'Producto', 'Proceso', 'Método'], x: 'Producto: los conocimientos acumulados. Proceso: la actividad de investigar. Institución: la práctica social.' },
    { q: '¿Qué distingue a la ciencia, según la definición de trabajo del curso?', o: ['Somete sus afirmaciones a prueba y a crítica pública', 'Posee verdades eternas', 'Sigue siempre los mismos cinco pasos', 'Se hace en un laboratorio'], x: 'Lo que la distingue es que está organizada para detectar y corregir sus propios errores.' },
    { q: 'El «método científico» de pasos fijos que se enseña en la escuela…', o: ['Es una herramienta didáctica que no describe cómo trabaja realmente la ciencia', 'Es el único método válido de todas las ciencias', 'Lo inventó Popper', 'Solo sirve en las ciencias sociales'], x: 'Un astrónomo no experimenta con galaxias ni un historiador repite la Independencia: cada ciencia adapta su método.' },
    { q: 'En las ciencias sociales, en lugar de «objetividad» se prefiere hablar de…', o: ['Intersubjetividad', 'Provisionalidad', 'Neutralidad absoluta', 'Sistematicidad'], x: 'Que varias personas, siguiendo los mismos procedimientos, lleguen a conclusiones compatibles.' },
    { q: '«Ninguna verdad científica es definitiva.» ¿Qué canon de cientificidad es?', o: ['Provisionalidad', 'Coherencia', 'Comunicabilidad', 'Sistematicidad'], x: 'La ciencia avanza corrigiéndose: no es una debilidad, sino su mayor fortaleza.' },
    { q: 'Ante «está comprobado científicamente», la orientadora preguntó quién hizo el estudio, dónde se publicó y cuántos niños participaron. ¿Qué hizo?', o: ['Aplicó los cánones de cientificidad', 'Descalificó al papá', 'Aceptó la afirmación', 'Aplicó el método de Dilthey'], x: 'Una afirmación que no puede rastrearse hasta su fuente no puede evaluarse.' },
    { q: 'Según Dilthey, las ciencias del espíritu buscan…', o: ['Comprender', 'Explicar', 'Demostrar', 'Medir'], x: 'Las ciencias de la naturaleza explican por leyes; las del espíritu comprenden desde dentro (Verstehen).' },
    { q: 'Para Mario Bunge, la lógica y las matemáticas son ciencias…', o: ['Formales', 'Fácticas', 'Del espíritu', 'Naturales'], x: 'No estudian hechos del mundo, sino relaciones entre signos y formas.' },
    { q: 'Las ciencias formales se validan por…', o: ['Demostración', 'Experiencia', 'Consenso', 'Revelación'], x: 'Las fácticas, en cambio, se validan por la experiencia.' },
    { q: '¿Dónde queda la pedagogía en la clasificación de Bunge?', o: ['Ciencias fácticas sociales', 'Ciencias formales', 'Ciencias fácticas naturales', 'No es ciencia'], x: 'Junto a la sociología, la psicología, la historia, la economía y la antropología.' },
    { q: '¿Cómo llamó Comte primero a la sociología?', o: ['Física social', 'Ciencia del espíritu', 'Pedagogía general', 'Filosofía positiva'], x: 'Para Comte, todas las ciencias debían seguir el modelo de las ciencias naturales.' },
    { q: '¿Qué tradición impuso la expresión plural «ciencias de la educación»?', o: ['La francesa', 'La alemana', 'La inglesa', 'La estadounidense'], x: 'La alemana defendió la pedagogía como ciencia unitaria; la francesa, desde la segunda mitad del siglo XX, habló de ciencias de la educación.' },
  ] },
  tema3: { titulo: 'Tema 3 · Racionalidad científica clásica', preguntas: [
    { q: '¿Qué imagen del mundo surgió de la revolución científica de los siglos XVI y XVII?', o: ['Mecanicista: el universo como un reloj', 'Sistémica', 'Dialéctica', 'Hermenéutica'], x: 'Conocer era descomponer el todo en sus partes, medirlas y encontrar causas y efectos.' },
    { q: '¿Quién propuso tratar «los hechos sociales como cosas»?', o: ['Durkheim', 'Weber', 'Dilthey', 'Habermas'], x: 'Normas, costumbres e instituciones existen fuera de los individuos y pueden estudiarse objetivamente.' },
    { q: 'Los tres estadios del conocimiento (teológico, metafísico y positivo) son de…', o: ['Comte', 'Durkheim', 'Marx', 'Gadamer'], x: 'En el estadio positivo se renuncia a las causas últimas y se buscan leyes por observación.' },
    { q: 'La sociología comprensiva y los tipos ideales son de…', o: ['Max Weber', 'Auguste Comte', 'Karl Marx', 'Ludwig von Bertalanffy'], x: 'Hay que interpretar el sentido que los actores dan a sus acciones.' },
    { q: 'El interés emancipatorio de Habermas corresponde al paradigma…', o: ['Sociocrítico', 'Positivista', 'Interpretativo', 'Mecanicista'], x: 'Técnico → empírico-analíticas; práctico → hermenéuticas; emancipatorio → críticas.' },
    { q: '«Entender cómo viven los docentes la reforma» es un ejemplo del paradigma…', o: ['Interpretativo', 'Positivista', 'Sociocrítico', 'Lineal'], x: 'Busca comprender significados, con entrevistas, observación o etnografía.' },
    { q: '¿Quién propuso la Teoría General de los Sistemas?', o: ['Ludwig von Bertalanffy', 'Edgar Morin', 'René Descartes', 'Isaac Newton'], x: 'Un organismo es un sistema: el todo es más que la suma de las partes.' },
    { q: 'El agua moja, pero ni el hidrógeno ni el oxígeno mojan por separado. Es un ejemplo de…', o: ['Propiedad emergente', 'Equifinalidad', 'Principio de identidad', 'Tercero excluido'], x: 'Cuando las partes se relacionan aparecen propiedades que no existen en ninguna por separado.' },
    { q: 'En el caso de Kevin, ¿qué resolvió el problema?', o: ['Mirar el sistema completo: familia, empleo de la madre y escuela', 'Acumular más reportes', 'Suspenderlo una semana', 'Cambiarlo de grupo'], x: 'La solución —una vecina y un ajuste de horario— solo apareció con la mirada sistémica.' },
    { q: '«Una afirmación es verdadera o falsa; no hay una tercera opción.» ¿Qué principio es?', o: ['Tercero excluido', 'Identidad', 'No contradicción', 'Retroalimentación'], x: 'Es uno de los tres principios de la lógica clásica de Aristóteles.' },
    { q: '¿Quién propuso dividir cada dificultad en tantas partes como sea posible?', o: ['Descartes', 'Aristóteles', 'Galileo', 'Hegel'], x: 'Es el precepto que la ciencia clásica sumó al razonamiento lineal.' },
    { q: '¿Para qué sí sirve el pensamiento lineal en educación?', o: ['Para planificar una secuencia didáctica e identificar prerrequisitos', 'Para entender el clima de una escuela', 'Para explicar relaciones circulares', 'Para nada'], x: 'Se queda corto ante fenómenos complejos, con causas múltiples que se influyen entre sí.' },
  ] },
};
