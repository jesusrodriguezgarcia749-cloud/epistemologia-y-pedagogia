// tareas-datos.js — Tareas digitales y juegos de Epistemología y Pedagogía (Parcial 2).
// Todo sale del libro de texto de la materia (compendio del Aula Virtual).

// tipo: cuadro (en equipo o individual, en vivo, con clave) · practica (juego sin calificación) · pronto
export const TEMAS_TAREAS = [
  { tema: '2 y 3', titulo: 'Naturaleza del conocimiento y racionalidad científica clásica', fecha: '2026-10-26', fechaTexto: 'Lun 26 de octubre', acts: [
    { id: 'paradigmas', tipo: 'cuadro', icono: '📋', nombre: 'Cuadro de los tres paradigmas', modo: 'En equipo · en vivo', desc: 'Positivista, interpretativo y sociocrítico: finalidad, realidad, métodos, autores y un ejemplo real de tesis que ustedes investigan.' },
    { id: 'que-paradigma', tipo: 'practica', icono: '🧭', nombre: '¿Qué paradigma es?', modo: 'Juego de práctica', desc: 'Títulos de tesis, fragmentos y autores: ¿positivista, interpretativo o sociocrítico? Y una ronda de pensamiento lineal contra sistémico.' },
    { id: 'arena-t2', tipo: 'vivo', vivo: 'arena', set: 'tema2', icono: '⚡', nombre: 'Arena en vivo del Tema 2', modo: 'En vivo · en clase', desc: 'Preguntas contra el reloj, con podio. Entra cuando tu maestro abra la Arena.' },
  ] },
  { tema: '3 y 4', titulo: 'Lógica dialéctica y concepción contemporánea de la ciencia', fecha: '2026-10-27', fechaTexto: 'Mar 27 de octubre', acts: [
    { id: 'pon-a-prueba', tipo: 'cuadro', icono: '⚖️', nombre: 'Pon a prueba una idea', modo: 'En equipo · en vivo', desc: 'A cada equipo le toca por sorteo una afirmación que se oye en las escuelas. La analizan con los seis autores del Tema 4, buscan evidencia en el momento y dan su veredicto: ¿es ciencia?' },
    { id: 'quien-lo-dijo', tipo: 'practica', icono: '💬', nombre: '¿Quién lo dijo?', modo: 'Juego de práctica', desc: 'Frases y obras contra su autor: de Platón a Morin. Los 55 pensadores de la Constelación, con niveles y modo reto.' },
  ] },
  { tema: '4', titulo: 'Cierre del Tema 4: Lakatos, Feyerabend, Morin y las ciencias sociales', fecha: '2026-11-09', fechaTexto: 'Lun 9 de noviembre', acts: [
    { id: 'quien-avanza', tipo: 'practica', icono: '🎮', nombre: '¿Quién avanza así la ciencia?', modo: 'Juego de 5 minutos', desc: 'Aparece una idea: ¿es del Círculo de Viena, de Popper, Kuhn, Lakatos, Feyerabend o Morin?' },
    { id: 'mi-autor', tipo: 'cuadro', icono: '🧩', nombre: 'Mi autor en cuatro cuadros', modo: 'En equipo · en vivo', desc: 'A su equipo le toca por sorteo Lakatos, Feyerabend, Morin o la cientificidad de las ciencias sociales: su idea en una frase, un ejemplo en el aula, una crítica y qué le dice a su investigación.' },
  ] },
  { tema: '5 y 6', titulo: 'Nuevo paradigma epistemológico y conocimiento ordinario', fecha: '2026-11-10', fechaTexto: 'Mar 10 de noviembre', acts: [
    { id: 'clase-autoguiada', tipo: 'ruta', individual: true, icono: '🧭', nombre: 'Clase autoguiada: Temas 5 y 6', modo: 'Individual · a tu ritmo', desc: 'Hoy la clase la recorres tú: un juego, dos mini-lecciones con preguntas, tus dos actividades y un boleto de salida. Incluye la bitácora de la conferencia.' },
    { id: 'que-obstaculo', tipo: 'practica', icono: '🎮', nombre: '¿Qué obstáculo es?', modo: 'Juego de 5 minutos', desc: 'Frases que se oyen en la escuela: ¿qué obstáculo epistemológico de Bachelard hay detrás?' },
    { id: 'mi-inercia', tipo: 'cuadro', individual: true, icono: '🪞', nombre: 'Mi inercia mental', modo: 'Individual', desc: 'Una creencia tuya sobre la educación que nunca habías examinado: de dónde viene, qué obstáculo es y qué la pone en duda.' },
    { id: 'saberes', tipo: 'cuadro', icono: '🌽', nombre: 'Saberes de la vida', modo: 'En equipo · en vivo', desc: 'A su equipo le toca un saber local (la milpa, la nixtamalización, la herbolaria, la pesca, las parteras, el saber del maestro): compárenlo como saber de la comunidad y como conocimiento científico.' },
  ] },
  { tema: '6 y 7', titulo: 'Ciencia y arte, y neurociencia del aprendizaje', fecha: '2026-11-17', fechaTexto: 'Mar 17 de noviembre', acts: [
    { id: 'neuromito', tipo: 'practica', icono: '🎮', nombre: '¿Neuromito o evidencia?', modo: 'Juego de 5 minutos', desc: 'Lo que se dice del cerebro en las escuelas: ¿es un neuromito o tiene evidencia?' },
    { id: 'producto-neuro', tipo: 'cuadro', icono: '🧠', nombre: 'Analiza un producto «neuro»', modo: 'En equipo · en vivo', desc: 'A su equipo le toca un producto que se vende a las escuelas (gimnasia cerebral, apps, tests de estilos…): júzguenlo con la evidencia del Tema 7.' },
    { id: 'arena-repaso', tipo: 'vivo', vivo: 'arena', set: 'repasoP2', icono: '⚡', nombre: 'Arena de repaso del Parcial 2', modo: 'En vivo · en clase', desc: 'Preguntas contra el reloj del cierre del Tema 4 y los Temas 5 a 7, con podio. Entra cuando tu maestro abra la Arena.' },
    { id: 'tribunal-17', tipo: 'vivo', vivo: 'tribunal', icono: '⚖️', nombre: 'Tribunal de la ciencia', modo: 'En vivo · en clase', desc: 'Te ponen la toga de un autor y dictas si un caso es ciencia. Entra cuando tu maestro abra el Tribunal.' },
  ] },
];
export const TAREAS_DIG = Object.fromEntries(TEMAS_TAREAS.flatMap(t => t.acts.map(a => [a.id, { ...a, tema: t.tema, titulo: t.titulo, fecha: t.fecha, fechaTexto: t.fechaTexto }])));
export const califica = a => a && (a.tipo === 'cuadro' || a.tipo === 'ruta');
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
CUADROS['ficha-autor'] = {
  id: 'act-ficha-autor', ind: 'tarea-ficha-autor', clave: 'fichaAutor', sinClave: true,
  titulo: 'Ficha del autor', kicker: 'Tema 4 · Concepción contemporánea de la ciencia · Rompecabezas', archivo: 'Ficha_autor',
  ayuda: 'Su equipo es experto en <b>un autor</b> del Tema 4 (4.1 Positivismo lógico, 4.2 Popper, 4.3 Kuhn o 4.4 Lakatos). Llenen la ficha con el compendio y el Laboratorio (Constelación); con ella van a exponer en 6 o 7 minutos. La última fila es una cita textual con su fuente.',
  columnas: [['ficha', 'Lo que escribe el equipo', '#3E5BA8']],
  filas: [
    ['autor', 'Su autor', '¿Cuál les tocó? Positivismo lógico, Popper, Kuhn o Lakatos.'],
    ['quien', 'Quién fue', 'Época, país, formación y su obra principal (con año).'],
    ['idea', 'Idea central', 'En dos o tres oraciones: ¿qué propone?'],
    ['conceptos', 'Conceptos clave', 'Al menos tres conceptos con su definición breve.'],
    ['avanza', 'Cómo avanza la ciencia', '¿Acumulando verdades, refutando, por revoluciones, por programas de investigación?'],
    ['demarcacion', 'Qué hace científico a un conocimiento', 'Su criterio para distinguir la ciencia de lo que no lo es.'],
    ['ejemplo', 'Un ejemplo', 'El del compendio (los cisnes, el eclipse de 1919, el pato-conejo, el constructivismo…) u otro suyo.'],
    ['critica', 'Sus límites', '¿Qué le criticaron o dónde se queda corto? ¿Quién le respondió?'],
    ['pedagogia', 'Qué le dice a la pedagogía', '¿Cómo cambia la manera de investigar o de enseñar? Un ejemplo de aula.'],
    ['cita', 'Una cita del compendio', 'Cita textual entre comillas, con (Autor, año).', true],
  ],
};
CUADROS.teoricos = {
  id: 'act-teoricos', ind: 'tarea-teoricos', clave: 'teoricos',
  titulo: 'Cuadro comparativo de los teóricos de la ciencia del siglo XX', kicker: 'Tema 4 · Concepción contemporánea de la ciencia', archivo: 'Cuadro_teoricos',
  ayuda: 'Llénenlo con las exposiciones de los equipos, la clase sobre Feyerabend y Morin, y el compendio (4.1 a 4.6). La fila <b>🔎 Investiga</b> pide la referencia en APA 7 de la obra principal de cada autor (búsquenla y anoten de dónde la sacaron).',
  columnas: [['viena', 'Positivismo lógico', '#6B5B4B'], ['popper', 'Popper', '#A63D2F'], ['kuhn', 'Kuhn', '#2E6FA8'], ['lakatos', 'Lakatos', '#3F7A4F'], ['feyerabend', 'Feyerabend', '#E07B39'], ['morin', 'Morin', '#8E5BA8']],
  filas: [
    ['avanza', 'Cómo avanza la ciencia', '¿Acumulando, refutando, por revoluciones, por programas, sin método fijo, tejiendo?'],
    ['distingue', 'Qué distingue a la ciencia', 'Su criterio para separar la ciencia de lo que no lo es (o su crítica a ese criterio).'],
    ['comunidad', 'Papel de la comunidad científica', '¿Qué peso tiene la comunidad en lo que se acepta como ciencia?'],
    ['concepto', 'Concepto clave', 'El concepto que no puede faltar, con su definición.'],
    ['educacion', 'Qué le dice a la investigación educativa', 'Un ejemplo de cómo cambia la manera de investigar o de enseñar.'],
    ['obra', 'Obra principal en APA 7', 'Autor, A. (año). Título en cursivas. Editorial.', true],
  ],
  respuestas: {
    avanza: ['Por inducción: se observan casos, se generaliza una ley y se verifica; el conocimiento crece por acumulación.', 'Por conjeturas y refutaciones: hipótesis audaces que se intentan refutar; las que resisten quedan corroboradas provisionalmente.', 'Por ciclos: preciencia, ciencia normal, anomalías, crisis y revolución científica, y luego una nueva ciencia normal.', 'Por programas de investigación que compiten: los progresivos predicen hechos nuevos y desplazan a los degenerativos.', 'No hay un método único: toda regla ha sido violada con éxito alguna vez; avanza con pluralismo y proliferación de teorías («todo vale»).', 'Superando el paradigma de simplificación (disyunción, reducción, abstracción) con un pensamiento que une lo que está tejido junto.'],
    distingue: ['El principio de verificación: solo tiene sentido lo verificable con la experiencia o lo lógicamente verdadero.', 'La falsabilidad (criterio de demarcación): debe poder imaginarse una observación que la refute.', 'Una comunidad que comparte un paradigma y resuelve rompecabezas dentro de él (ciencia normal).', 'Ser un programa progresivo: sus ajustes anticipan hechos nuevos que luego se confirman.', 'Niega que exista un criterio fijo; critica que la ciencia ocupe un lugar de autoridad indiscutible.', 'Critica la ciencia fragmentada; pide un conocimiento pertinente que relacione y contextualice.'],
    comunidad: ['Verifica las afirmaciones con observaciones públicas; su peso no es central en la teoría.', 'Ejerce la crítica: el buen científico expone su teoría a ella (ética del conocimiento, sociedad abierta).', 'Decisivo: el paradigma se aprende en la formación y la comunidad decide, no sin resistencia, cambiar de paradigma.', 'Los investigadores deciden no tocar el núcleo duro y ajustan el cinturón protector.', 'En una sociedad libre, los ciudadanos podrían decidir democráticamente qué tradiciones enseñar.', 'Necesita diálogo entre disciplinas para comprender lo complejo.'],
    concepto: ['Principio de verificación (y el problema de la inducción).', 'Falsabilidad: la asimetría entre verificar y refutar.', 'Paradigma; también inconmensurabilidad.', 'Núcleo duro y cinturón protector.', 'Anarquismo epistemológico: «todo vale».', 'Complejidad (complexus, «lo que está tejido junto»): principios dialógico, de recursividad y hologramático.'],
    educacion: ['Su espíritu sigue en las pruebas estandarizadas y los indicadores: obliga a rendir cuentas, con el riesgo de reducir la educación a lo medible.', 'Formular hipótesis falsables: decir qué resultado desmentiría que un programa de lectura funciona.', 'La pedagogía también tiene paradigmas que cambian, por ejemplo del conductismo al constructivismo.', 'El constructivismo como programa: núcleo duro (el conocimiento se construye) y cinturón (conflicto cognitivo, aprendizaje entre pares, zona de desarrollo próximo).', 'No hay recetas: la ciencia es creativa y otros saberes merecen respeto, sin caer en el relativismo.', 'Inspiró los campos formativos y los ejes articuladores de la Nueva Escuela Mexicana; los siete saberes para la educación del futuro.'],
    obra: ['Hahn, Neurath y Carnap: La concepción científica del mundo (manifiesto del Círculo de Viena, 1929).', 'Popper, K. (1934/2008). La lógica de la investigación científica.', 'Kuhn, T. S. (1962/2013). La estructura de las revoluciones científicas.', 'Lakatos, I. (1978/1989). La metodología de los programas de investigación científica.', 'Feyerabend, P. (1975/1986). Tratado contra el método.', 'Morin, E. (1990/1994). Introducción al pensamiento complejo; y Morin (1999), Los siete saberes necesarios para la educación del futuro.'],
  },
};
// ⚖️ Pon a prueba una idea: una sola columna, pero cada equipo recibe por sorteo una afirmación distinta
// (variantes), con su propia clave de respuestas de referencia.
CUADROS['pon-a-prueba'] = {
  id: 'act-pon-a-prueba', ind: 'tarea-pon-a-prueba', clave: 'ponAPrueba',
  titulo: 'Pon a prueba una idea', kicker: 'Tema 4 · Concepción contemporánea de la ciencia', archivo: 'Pon_a_prueba',
  ayuda: 'A su equipo le tocó por sorteo la afirmación de arriba. Analícenla con los autores que acabamos de leer (4.1 a 4.6). No se trata de memorizar: piensen qué diría cada uno. La fila <b>🔎 Investiga</b> pide buscar en el celular un dato o un estudio real que la apoye o la contradiga, con su fuente.',
  columnas: [['equipo', 'Lo que escribe el equipo', '#3E5BA8']],
  filas: [
    ['viena', 'Círculo de Viena', '¿Se puede verificar con la experiencia? ¿Cómo lo comprobarían?'],
    ['popper', 'Popper', '¿Qué resultado la desmentiría? ¿Es falsable?'],
    ['kuhn', 'Kuhn', '¿Desde qué paradigma se dice? ¿Ven alguna anomalía, algo que no cuadra?'],
    ['lakatos', 'Lakatos', '¿Cuál sería su núcleo duro y qué ajustarían (cinturón protector) si falla?'],
    ['feyerabend', 'Feyerabend', '¿Qué otro saber o método podría aportar algo que el método científico deja fuera?'],
    ['morin', 'Morin', '¿Qué se pierde si se mira solo por partes? ¿Qué está «tejido junto»?'],
    ['evidencia', 'La evidencia', 'Un dato o un estudio real que la apoye o la contradiga: qué dice, quién lo hizo y cuándo.', true],
    ['veredicto', 'Veredicto del equipo', '¿Es ciencia, un neuromito, una creencia, una propuesta política? ¿Qué tipo de conocimiento es? Justifíquenlo.'],
  ],
  variantes: [
    { id: 'vak', ico: '👁️', afirmacion: '«Cada alumno aprende mejor según su estilo: visual, auditivo o kinestésico.»', respuestas: {
      viena: ['Sí se puede poner a prueba: se identifica el estilo de cada alumno y se compara si aprende más cuando la clase coincide con su estilo que cuando no coincide.'],
      popper: ['La desmiente que los alumnos enseñados «en su estilo» no aprendan más que los enseñados en otro. Eso es justo lo que han encontrado las revisiones de la evidencia.'],
      kuhn: ['Viene del paradigma de las diferencias individuales y de la psicología popular. La anomalía: aunque es muy popular entre docentes, los experimentos no encuentran el efecto prometido.'],
      lakatos: ['Núcleo duro: «las personas tienen estilos fijos que determinan cómo aprenden». Cuando falla, se ajusta el cinturón (más estilos, otros cuestionarios) sin predecir hechos nuevos: un programa degenerativo.'],
      feyerabend: ['Lo que el docente observa en su grupo (a quién le sirve un esquema, a quién la práctica) tiene valor, pero como diversidad de preferencias y estrategias, no como estilos fijos.'],
      morin: ['Reduce al alumno a un solo canal. Aprender integra todos los sentidos, la emoción, el contexto y el contenido: hay temas que piden imagen y otros que piden hacer, para todos.'],
      evidencia: ['Por ejemplo, la revisión de Pashler, McDaniel, Rohrer y Bjork (2008) en Psychological Science in the Public Interest no encontró evidencia sólida de que adaptar la enseñanza al estilo mejore el aprendizaje.'],
      veredicto: ['Es un neuromito: se presenta como científico y se puede poner a prueba, pero cuando se prueba, no se sostiene. Lo valioso es variar las estrategias según el contenido, no etiquetar al alumno.'] } },
    { id: 'voz-alta', ico: '📖', afirmacion: '«Leer en voz alta todos los días mejora la comprensión lectora.»', respuestas: {
      viena: ['Sí: se mide la comprensión antes y después en un grupo que lee en voz alta a diario y en otro que no, con la misma prueba.'],
      popper: ['La desmentiría que, después de un tiempo razonable, el grupo que lee en voz alta no comprenda mejor que el otro. Hay que decirlo antes de aplicar el programa.'],
      kuhn: ['Paradigma de la lectura como habilidad que se entrena (enfoque cognitivo). Anomalía posible: alumnos que leen en voz alta con fluidez pero no comprenden lo que leen.'],
      lakatos: ['Núcleo: «la fluidez libera atención para comprender». Cinturón: cuánto tiempo, qué textos, quién lee (docente o alumno). Es progresivo si predice mejoras que luego se confirman.'],
      feyerabend: ['La tradición oral de las comunidades (contar historias, leyendas, la lectura en familia) también forma lectores y no siempre cabe en una prueba estandarizada.'],
      morin: ['La comprensión depende también del vocabulario, el gusto por leer, el contexto familiar y la emoción. Medir solo la fluidez deja fuera lo que está tejido junto.'],
      evidencia: ['Por ejemplo, Westbrook, Sutherland, Oakhill y Sullivan (2019) encontraron que leer novelas completas en voz alta en clase mejoró la comprensión de alumnos de 12 y 13 años, sobre todo la de los lectores con más dificultades.'],
      veredicto: ['Es una hipótesis científica razonable y con evidencia a favor, si se mide bien. Conocimiento fáctico, de las ciencias de la educación; su alcance depende de cómo, cuánto y con qué textos se lee.'] } },
    { id: 'nem', ico: '🏫', afirmacion: '«La Nueva Escuela Mexicana es un cambio de paradigma.»', respuestas: {
      viena: ['Así dicha es difícil de verificar: «paradigma» no se observa directamente. Habría que traducirla a cambios medibles (en qué se enseña, cómo se evalúa, qué pasa en las aulas).'],
      popper: ['La desmentiría encontrar que las prácticas de aula siguen siendo las mismas (mismos contenidos, misma evaluación) aunque cambien los documentos. Así se vuelve falsable.'],
      kuhn: ['Kuhn habla de comunidades científicas, no de reformas. Si se usa su idea: ¿qué anomalías tenía el modelo anterior (por competencias), hubo crisis y cambió la manera de ver la educación de toda la comunidad docente?'],
      lakatos: ['Núcleo duro de la NEM: la comunidad como centro, el pensamiento crítico y la educación integral. Cinturón: programas analíticos, libros, proyectos. ¿Predice mejoras que luego se confirman?'],
      feyerabend: ['La propia NEM invita al diálogo de saberes: incluir los saberes comunitarios junto a los científicos. Feyerabend estaría de acuerdo en no imponer un solo método.'],
      morin: ['Los campos formativos y los ejes articuladores buscan unir lo que estaba separado en asignaturas: es justo la crítica de Morin a la fragmentación.'],
      evidencia: ['Por ejemplo, el Plan de Estudio 2022 de la SEP (documento oficial) o estudios y artículos recientes que analicen cómo la viven los docentes. Distingan lo que dice el documento de lo que muestran los datos.'],
      veredicto: ['Es una propuesta política y pedagógica, no una teoría científica. Puede estudiarse científicamente (con datos sobre su aplicación), pero llamarla «cambio de paradigma» es una interpretación discutible que hay que argumentar.'] } },
    { id: 'videojuegos', ico: '🎮', afirmacion: '«Los videojuegos bajan el rendimiento escolar.»', respuestas: {
      viena: ['Sí: se compara el tiempo de juego con las calificaciones, o se hace un estudio donde unos alumnos reciben una consola y otros no.'],
      popper: ['La desmentiría que los alumnos que juegan no tengan peor rendimiento que los que no juegan, cuando se comparan en igualdad de condiciones.'],
      kuhn: ['Viene de un paradigma que ve la pantalla como amenaza. Anomalía: estudios que encuentran que algunos juegos mejoran la atención o habilidades espaciales.'],
      lakatos: ['Núcleo: «el tiempo de juego le quita tiempo al estudio». Cinturón: qué tipo de juego, cuántas horas, a qué edad. Si solo se ajusta después de cada estudio que no cuadra, se vuelve degenerativo.'],
      feyerabend: ['Lo que saben los propios jugadores y sus familias (qué aprenden jugando, con quién juegan) también es un saber que vale escuchar.'],
      morin: ['No es solo el juego: influyen el sueño, la supervisión familiar, el tipo de juego y la motivación. Una relación no es necesariamente una causa.'],
      evidencia: ['Por ejemplo, Weis y Cerankosky (2010) encontraron que niños a quienes se les dio una consola bajaron en lectura y escritura; otros estudios (Bavelier y colaboradores) reportan mejoras en atención visual. La evidencia es mixta.'],
      veredicto: ['Es una hipótesis científica que se puede probar, pero así de general es demasiado simple: depende de cuánto, qué y cómo se juega. Conocimiento fáctico en construcción, no una verdad cerrada.'] } },
    { id: 'mozart', ico: '🎻', afirmacion: '«Escuchar música clásica mejora la concentración y la inteligencia.»', respuestas: {
      viena: ['Sí: se mide la concentración o una prueba de razonamiento después de escuchar música clásica, comparada con silencio u otra música.'],
      popper: ['La desmiente que quienes escuchan música clásica no rindan mejor que quienes están en silencio. Al repetir los experimentos, el efecto no aparece o es mínimo y pasajero.'],
      kuhn: ['Nació de un experimento de 1993 que se volvió fama popular («efecto Mozart»). Anomalía: los estudios posteriores no lograron repetirlo.'],
      lakatos: ['Núcleo: «la música clásica activa el cerebro». Cinturón: «solo Mozart», «solo en bebés», «solo para tareas espaciales»: ajustes para salvarla sin predecir nada nuevo.'],
      feyerabend: ['La música sí tiene valor en la escuela (emociones, gusto, cultura), y lo que sienten alumnos y maestros al escucharla importa, aunque no «aumente la inteligencia».'],
      morin: ['Concentrarse depende del ambiente, la tarea, el descanso y la emoción. Atribuirlo todo a un tipo de música reduce un fenómeno complejo a una sola causa.'],
      evidencia: ['Por ejemplo, Rauscher, Shaw y Ky (1993) reportaron un efecto breve en tareas espaciales; el metaanálisis de Pietschnig, Voracek y Formann (2010) concluyó que no hay un efecto Mozart confiable.'],
      veredicto: ['Es un neuromito: la idea popular exagera un resultado pequeño que no se replicó. La música puede ambientar y motivar, pero no «sube la inteligencia».'] } },
    { id: 'comunidad', ico: '🌽', afirmacion: '«El saber de la comunidad también debe enseñarse en la escuela.»', respuestas: {
      viena: ['Tal como está, es una afirmación de valor («debe»), no verificable. Lo que sí se puede verificar es si incluir esos saberes mejora la participación o el aprendizaje.'],
      popper: ['La parte del «debe» no es falsable. La parte empírica sí: la desmentiría que los alumnos no aprendan más ni participen más cuando la escuela incorpora saberes de su comunidad.'],
      kuhn: ['Viene del paradigma sociocrítico y del diálogo de saberes. Anomalía del modelo anterior: escuelas que enseñaban contenidos ajenos a la vida de sus alumnos.'],
      lakatos: ['Núcleo: «el aprendizaje es más significativo cuando parte de la realidad del alumno». Cinturón: qué saberes, cómo se integran, con quién. Progresivo si predice mejoras que se comprueban.'],
      feyerabend: ['Es su idea central: la ciencia es una tradición entre otras y no debe excluir otros saberes de antemano. La milpa, la apicultura o la medicina tradicional también son conocimiento.'],
      morin: ['Unir el saber escolar con el de la comunidad es «tejer junto». El riesgo es idealizar: también hay que ponerlo a dialogar con la ciencia.'],
      evidencia: ['Por ejemplo, el enfoque de los «fondos de conocimiento» de Moll, Amanti, Neff y González (1992), o la «ecología de saberes» de Sousa Santos, que está en la Constelación.'],
      veredicto: ['Es una postura ética y política (un «debe»), con una parte que sí se puede investigar científicamente. Conocimiento de tipo sociocrítico; coincide con la propuesta de la NEM.'] } },
  ],
};
// Sorteo de la afirmación: la misma formación de equipos baraja las variantes con su propio orden,
// y cada equipo toma la de su número (equipo 1 → primera del sorteo, equipo 2 → segunda…).
const semilla = s => [...String(s)].reduce((h, c) => (Math.imul(h ^ c.charCodeAt(0), 16777619)) >>> 0, 2166136261);
export function varianteDe(A, eq, alumnoId) {
  if (!A || !A.variantes) return null;
  const n = A.variantes.length, idx = [...Array(n).keys()];
  let r = semilla((eq ? eq.formacion || 'actual' : 'individual') + '|' + A.clave);
  for (let i = n - 1; i > 0; i--) { r = (Math.imul(r, 1103515245) + 12345) >>> 0; const j = r % (i + 1); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  const num = eq ? (Number(eq.numero) || (semilla(eq.id) % n) + 1) : (semilla(alumnoId || '') % n) + 1;
  return A.variantes[idx[(num - 1) % n]];
}
export const respuestasDe = (A, V) => (V && V.respuestas) || A.respuestas || {};

// Coevaluación: criterios de 1 a 4
export const COEV = [
  ['dominio', 'Dominio del autor', 'Explican sus ideas con seguridad y sin leer todo.'],
  ['claridad', 'Claridad', 'Se entiende; usan ejemplos y sus propias palabras.'],
  ['pedagogia', 'Relación con la pedagogía', 'Muestran qué le dice el autor a la educación.'],
  ['tiempo', 'Tiempo y ficha', 'Respetan el tiempo y su ficha está completa.'],
];
export const COEV_NIV = [[1, 'En inicio'], [2, 'En desarrollo'], [3, 'Bien'], [4, 'Excelente']];

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
  repasoP2: { titulo: 'Repaso del Parcial 2 · cierre del Tema 4 y Temas 5 a 7', preguntas: [
    {"q": "Para Lakatos, ¿cuándo es progresivo un programa de investigación?", "o": ["Cuando sus ajustes permiten predecir hechos nuevos que luego se confirman", "Cuando ajusta el cinturón para explicar lo que ya sabía", "Cuando nadie lo ha refutado", "Cuando lo acepta toda la comunidad"], "x": "Si solo se justifica después, sin anticipar nada nuevo, es degenerativo."},
    {"q": "Una maestra dice: «Todos los proyectos deben seguir exactamente los mismos pasos para ser científicos». ¿Qué autor del Tema 4 la cuestionaría con más fuerza?", "o": ["Paul Feyerabend", "Auguste Comte", "Ninguno, porque todos defendían un método único", "El Círculo de Viena"], "x": "Feyerabend sostuvo que imponer un método único empobrece el conocimiento."},
    {"q": "¿Qué significa complexus, raíz de \"complejidad\" según Morin?", "o": ["Lo que está tejido junto", "Lo que es difícil de entender", "Lo que no tiene orden", "Lo que se divide en partes"], "x": "Un fenómeno complejo tiene elementos entrelazados de manera inseparable."},
    {"q": "¿Qué criterios propios de rigor ha desarrollado la investigación cualitativa?", "o": ["Credibilidad, transferibilidad, consistencia y confirmabilidad", "Solo la validez estadística", "Rapidez, costo y popularidad", "Ninguno: la investigación cualitativa no tiene criterios de rigor"], "x": "No son los de la física, pero son exigentes."},
    {"q": "¿Cómo se refleja la influencia de Morin en la Nueva Escuela Mexicana?", "o": ["En los campos formativos y los ejes articuladores que buscan superar la fragmentación", "En la desaparición de la evaluación", "En el uso exclusivo de exámenes estandarizados", "En la separación estricta de las asignaturas"], "x": "El Plan de Estudio 2022 integra saberes en torno a problemas."},
    {"q": "¿Cuáles son las tres operaciones del paradigma de simplificación según Morin?", "o": ["Disyunción, reducción y abstracción", "Observación, hipótesis y experimentación", "Tesis, antítesis y síntesis", "Verificación, falsación y revolución"], "x": "Separar lo unido, explicar el todo por sus partes y aislar el objeto de su contexto."},
    {"q": "¿Qué es la inercia mental?", "o": ["La tendencia a seguir pensando como siempre aunque aparezcan razones para cambiar", "La incapacidad biológica de aprender cosas nuevas", "El cansancio que produce estudiar mucho tiempo", "La velocidad con que una comunidad adopta ideas nuevas"], "x": "Martínez Miguélez la señala como uno de los mayores obstáculos para una nueva racionalidad."},
    {"q": "Una tesista cambia sus preguntas de entrevista cuando descubre un tema inesperado. ¿Cómo se llama esto en investigación cualitativa?", "o": ["Diseño emergente", "Plagio", "Error de método", "Falsación"], "x": "El plan se ajusta conforme aparecen hallazgos."},
    {"q": "¿Cuál es el aporte central de la neurociencia a la epistemología según el compendio?", "o": ["El cerebro no es un espejo de la realidad, sino un constructor activo de ella", "El cerebro guarda cada recuerdo en un lugar fijo, como un archivero", "El cerebro solo recibe pasivamente la información de los sentidos", "La emoción estorba siempre al razonamiento"], "x": "La percepción completa, interpreta y anticipa."},
    {"q": "En una discusión de clase cada alumno defendió su opinión sin escuchar a los demás y ganó quien habló más fuerte. Según Habermas, ¿qué faltó?", "o": ["Que todos pudieran hablar y se impusiera el mejor argumento, no la fuerza ni la jerarquía", "Que el maestro diera la respuesta correcta desde el inicio", "Que hubiera menos participantes", "Que se votara para decidir quién tenía razón"], "x": "La situación ideal de habla sirve como criterio para evaluar los diálogos reales."},
    {"q": "¿Qué dijo Max Planck sobre cómo triunfan las nuevas verdades científicas?", "o": ["Cuando crece una generación familiarizada con ellas", "En cuanto se publican en una revista", "Cuando las aprueba el gobierno", "Nunca llegan a triunfar"], "x": "La inercia mental también es colectiva."},
    {"q": "Michael Polanyi resumió su idea de conocimiento tácito con la frase:", "o": ["Sabemos más de lo que podemos decir", "Solo sabemos lo que podemos demostrar", "Todo conocimiento puede escribirse en un manual", "Lo que no se dice no se sabe"], "x": "Reconocemos un rostro o andamos en bicicleta sin poder explicar cómo."},
    {"q": "¿Cuál de estas es una característica del conocimiento ordinario o de sentido común?", "o": ["Es práctico y se transmite en la familia y la comunidad", "Siempre se pone a prueba en un laboratorio", "Se organiza en teorías explícitas", "Es universal y nunca falla"], "x": "Es práctico, compartido, poco sistemático, poco crítico y contextual."},
    {"q": "¿Qué criticó Schön con la idea de «racionalidad técnica»?", "o": ["Que los profesionales solo aplican la teoría científica a la práctica", "El uso de computadoras en la escuela", "Que los maestros tengan vacaciones", "Que los alumnos lean mucho"], "x": "Esa visión no explica lo que hacen los buenos profesionales ante situaciones únicas."},
    {"q": "¿Qué sostuvo Lawrence Stenhouse sobre el currículo?", "o": ["Que es una hipótesis que el maestro pone a prueba en su salón", "Que es un programa cerrado que solo se aplica", "Que debe diseñarse sin participación de los docentes", "Que no tiene relación con la investigación"], "x": "Para Stenhouse, no hay desarrollo del currículo sin desarrollo del profesor."},
    {"q": "¿Qué ejemplos usa el compendio para ilustrar el conocimiento tácito?", "o": ["Andar en bicicleta y reconocer un rostro sin poder explicar cómo", "Resolver una ecuación", "Leer un manual", "Copiar un texto"], "x": "Polanyi (1966): sabemos más de lo que podemos decir."},
    {"q": "¿Qué ocurre con la memoria durante el sueño?", "o": ["El cerebro reactiva y reorganiza lo aprendido, consolidándolo", "El cerebro borra todo lo aprendido durante el día", "No ocurre nada relevante para el aprendizaje", "Solo se consolidan los recuerdos emocionales negativos"], "x": "Dormir poco perjudica el aprendizaje."},
    {"q": "Un maestro abre la clase preguntando por qué Campeche tenía murallas. ¿Por qué funciona según el tema?", "o": ["Despierta la curiosidad, y el cerebro se prepara para aprender y recordar mejor", "Porque los alumnos dejan de pensar en el tema", "Porque así se evita explicar el contenido", "Porque la curiosidad sustituye a la información"], "x": "La pregunta inicial no fue un truco motivacional: preparó el aprendizaje."},
    {"q": "¿Qué estudió Roger Sperry, de donde surgió (mal interpretado) el mito de los hemisferios?", "o": ["Pacientes a quienes se había cortado el cuerpo calloso para tratar epilepsias graves", "Niños que aprendían a leer con música", "Estudiantes con estilos de aprendizaje distintos", "Personas que usaban solo el 10 % del cerebro"], "x": "En esas condiciones excepcionales cada hemisferio procesaba distinto, pero en un cerebro sano trabajan juntos."},
    {"q": "Según la revisión de Dunlosky y colaboradores (2013), ¿qué técnicas de estudio tienen utilidad alta?", "o": ["La práctica de recuperación y la práctica espaciada", "Releer y subrayar", "Estudiar todo la noche anterior", "Escuchar música clásica mientras se lee"], "x": "Releer y subrayar, las más usadas, resultaron de baja utilidad."},
    {"q": "¿Qué propuso Donald Hebb en 1949?", "o": ["Que las neuronas que se activan juntas tienden a conectarse entre sí", "Que solo usamos el 10 % del cerebro", "Que el cerebro tiene tres capas evolutivas", "Que cada recuerdo se guarda en un solo lugar"], "x": "Por eso la práctica repetida consolida un aprendizaje."},
    {"q": "¿Qué sostuvieron Immordino-Yang y Damasio sobre la emoción en la educación?", "o": ["Que forma parte del aprendizaje: aprendemos lo que tiene significado emocional y social", "Que es un obstáculo que hay que dejar fuera del salón", "Que solo importa en el recreo", "Que no tiene relación con la memoria"], "x": "La separación entre salón para pensar y recreo para sentir es artificial."}
  ] },
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
  tema4: { titulo: 'Tema 4 · Concepción contemporánea de la ciencia', preguntas: [
    { q: 'Para el Círculo de Viena, una afirmación solo tiene sentido si…', o: ['Puede verificarse con la experiencia o es una verdad lógica', 'Puede refutarse', 'La acepta una comunidad científica', 'Tiene un núcleo duro'], x: 'Es el principio de verificación del positivismo lógico; lo demás sería un sinsentido.' },
    { q: 'Los europeos vieron millones de cisnes blancos… hasta que encontraron cisnes negros en Australia. ¿Qué problema ilustra?', o: ['El problema de la inducción', 'La inconmensurabilidad', 'La doble hermenéutica', 'El anarquismo epistemológico'], x: 'Por muchos casos que observemos, nunca sabemos si el siguiente será igual. Ya lo había señalado Hume.' },
    { q: 'Según Popper, una teoría es científica si…', o: ['Es falsable', 'Está verificada', 'Lo explica todo', 'La acepta la mayoría'], x: 'Debe ser posible imaginar una observación que la contradiga: es su criterio de demarcación.' },
    { q: '«Mil cisnes blancos no prueban que todos sean blancos, pero uno negro prueba que no.» ¿Qué idea de Popper es?', o: ['La asimetría entre verificar y refutar', 'La ciencia normal', 'El cinturón protector', 'El principio hologramático'], x: 'Ningún número de observaciones verifica una teoría universal, pero una sola puede refutarla.' },
    { q: '⚖️ Tribunal: la astrología, que cuando falla dice que «influyó otro planeta». Según Popper…', o: ['No es ciencia: nunca puede salir mal, no es falsable', 'Es ciencia, porque hace predicciones', 'Es ciencia normal', 'Es un programa progresivo'], x: 'Es su ejemplo clásico: lo que se reinterpreta para que nunca falle no es falsable.' },
    { q: 'La predicción de Einstein que se comprobó en el eclipse de 1919 le servía a Popper como ejemplo de…', o: ['Una predicción arriesgada que podía fallar', 'Una anomalía', 'Un programa degenerativo', 'Un sinsentido'], x: 'La relatividad se exponía a ser refutada; eso, para Popper, la hacía científica.' },
    { q: 'Para Kuhn, el periodo en que la comunidad resuelve «rompecabezas» dentro de un paradigma aceptado se llama…', o: ['Ciencia normal', 'Revolución', 'Preciencia', 'Crisis'], x: 'Los científicos no buscan refutar el paradigma, sino ampliarlo.' },
    { q: 'El ciclo de Kuhn en orden es…', o: ['Preciencia → ciencia normal → anomalías → crisis → revolución', 'Conjetura → refutación → corroboración', 'Núcleo → cinturón → programa', 'Observación → hipótesis → ley'], x: 'Y después de la revolución empieza una nueva ciencia normal.' },
    { q: 'El dibujo que puede verse como pato o como conejo le sirvió a Kuhn para explicar…', o: ['La inconmensurabilidad entre paradigmas', 'El problema de la inducción', 'La falsabilidad', 'El principio dialógico'], x: 'Los datos son los mismos, pero se ven de otra manera.' },
    { q: 'Según Lakatos, las hipótesis que los investigadores deciden no poner en duda forman…', o: ['El núcleo duro', 'El cinturón protector', 'La heurística positiva', 'El paradigma'], x: 'El cinturón protector, en cambio, se ajusta cuando llegan datos contrarios.' },
    { q: 'Un programa de investigación es progresivo cuando…', o: ['Predice hechos nuevos que luego se confirman', 'Solo explica después lo que ya pasó', 'Nunca cambia su cinturón', 'Lo apoya la mayoría'], x: 'Si solo hace ajustes para explicar a posteriori, es degenerativo.' },
    { q: '«Todo vale» (anything goes) es la provocación de…', o: ['Paul Feyerabend', 'Karl Popper', 'Imre Lakatos', 'Rudolf Carnap'], x: 'Ninguna regla fija garantiza el progreso; no quería decir que cualquier opinión vale lo mismo.' },
    { q: 'Morin recuerda que complexus significa…', o: ['Lo que está tejido junto', 'Lo que es difícil', 'Lo que se divide en partes', 'Lo que no se puede medir'], x: 'Un ser humano es a la vez biológico, psicológico, social, cultural e histórico.' },
    { q: '«La sociedad produce a los individuos y los individuos producen la sociedad.» ¿Qué principio de Morin es?', o: ['Recursividad organizacional', 'Dialógico', 'Hologramático', 'Verificación'], x: 'Los productos son, a la vez, productores de aquello que los produce.' },
    { q: 'Cuando la palabra «bullying» entró a las escuelas, cambió la manera de vivir ciertos conflictos. Es un ejemplo de…', o: ['La doble hermenéutica (Giddens)', 'El problema de la inducción', 'La ciencia normal', 'El cinturón protector'], x: 'Las ciencias sociales interpretan un mundo ya interpretado, y sus conceptos regresan a la sociedad y la transforman.' },
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

// ---------- ⚖️ Tribunal de la ciencia (en vivo): los casos y los veredictos vienen de data/laboratorio.json (casos, lentes).
// Cada alumno es juez con la «toga» de un autor; la toga cambia en cada caso para que todos pasen por varios autores.
export const TR_LENTES = ['viena', 'popper', 'kuhn', 'lakatos', 'feyerabend'];
export const TR_VER = [['si', '✅', 'Es ciencia', '#3F7A4F'], ['no', '❌', 'No es ciencia', '#C0503F'], ['dep', '🤔', 'Depende', '#C8952E']];
export const TR_MIN_ARG = 8;
const hashTxt = s => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
export const trLente = (alumnoId, idx) => TR_LENTES[(hashTxt(alumnoId) + idx) % TR_LENTES.length];
const nPal = t => (String(t || '').trim().match(/\S+/g) || []).length;
// 100 si coincide con lo que diría su autor; +50 si argumentó con al menos TR_MIN_ARG palabras.
export const trPuntos = (r, caso) => !r || !caso ? 0 : (r.v === (caso.v[r.l] || [])[0] ? 100 : 0) + (nPal(r.arg) >= TR_MIN_ARG ? 50 : 0);
export const TR_CASOS_SUGERIDOS = ['astro', 'psico', 'vak', 'homeo', 'milpa', 'ia'];

// ---------- 🧪 Modo prueba del docente: un «alumno» que no existe en la lista del grupo (no hay documento
// grupos/{g}/alumnos/prueba-docente), así no aparece en listas, calificaciones, reportes ni Coordinación.
// Escribe con la sesión del docente (las reglas ya le permiten todo). En los rankings va «fuera de concurso».
export const PRUEBA_ID = 'prueba-docente';
export const PRUEBA_NOMBRE = 'Docente (prueba)';

// ======================================================= ACTIVIDADES DESDE EL 9 DE NOVIEMBRE (sencillas, como en Orígenes)
// Cada clase: un juego de 5 minutos para calentar, una actividad corta (en equipo o individual), puesta en común y clave.

// ---------- 🧩 Mi autor en cuatro cuadros (Lun 9 nov · cierre del Tema 4). Una columna; a cada equipo le toca por
// sorteo un autor o subtema (variantes). La clave sale del compendio (4.4 a 4.7).
CUADROS['mi-autor'] = {
  id: 'act-mi-autor', ind: 'tarea-mi-autor', clave: 'miAutor',
  titulo: 'Mi autor en cuatro cuadros', kicker: 'Tema 4 · Concepción contemporánea de la ciencia (4.4 a 4.7)', archivo: 'Mi_autor',
  sorteo: 'El autor que le tocó a su equipo por sorteo', sorteoInd: 'Tu autor', nombreVariante: 'El autor',
  ayuda: 'Lean en el compendio el subtema de su autor y llenen los cuatro cuadros <b>con sus palabras</b>. Al final lo explican al grupo en un minuto.',
  columnas: [['equipo', 'Lo que escribe el equipo', '#3E5BA8']],
  filas: [
    ['idea', 'Su idea en una frase', '¿Qué propone? Díganlo como se lo dirían a un compañero.'],
    ['aula', 'Un ejemplo en el aula', 'Una situación de una escuela que se explica con esta idea.'],
    ['critica', 'Una crítica o un riesgo', '¿Dónde se queda corto o qué peligro tiene si se lee mal?'],
    ['investigo', 'Qué le dice a mi investigación', '¿Qué cambiaría en un protocolo (el suyo o uno de pedagogía) si se toma en serio esta idea?'],
  ],
  variantes: [
    { id: 'lakatos', ico: '🧱', afirmacion: '4.4 · Imre Lakatos: los programas de investigación', respuestas: {
      idea: ['La ciencia no avanza con teorías sueltas, sino con programas de investigación: un núcleo duro que no se toca y un cinturón protector de hipótesis que se ajusta cuando llegan datos contrarios. Un programa es progresivo si predice hechos nuevos y degenerativo si solo se justifica.'],
      aula: ['El constructivismo como programa: el núcleo es «el conocimiento se construye activamente»; si una estrategia falla, se ajusta el cinturón (faltó andamiaje, los conocimientos previos no eran los supuestos) en lugar de abandonar el núcleo.'],
      critica: ['Saber si un programa es progresivo o degenerativo solo se ve con el tiempo; mientras tanto, cualquier ajuste puede usarse para justificar fracasos.'],
      investigo: ['Distinguir mi supuesto central de mis hipótesis auxiliares, y preguntarme si mis ajustes predicen algo nuevo o solo explican lo que ya pasó.'] } },
    { id: 'feyerabend', ico: '🎭', afirmacion: '4.5 · Paul Feyerabend: contra el método', respuestas: {
      idea: ['Ninguna regla metodológica fija garantiza el progreso: en la historia de la ciencia todas se han violado alguna vez con éxito (Galileo). De ahí su «todo vale» y el anarquismo epistemológico: defender la proliferación de teorías y que la ciencia sea una tradición entre otras.'],
      aula: ['Una maestra exige que todos los proyectos sigan exactamente los mismos pasos del «método científico». Feyerabend diría que imponer un método único empobrece: cada pregunta puede pedir su propio camino.'],
      critica: ['Leído sin cuidado alimenta el relativismo extremo: «da igual la vacuna que el remedio milagroso». Esa lectura no le hace justicia, pero es un riesgo en tiempos de desinformación.'],
      investigo: ['No elegir el método «porque siempre se usa»; considerar otros saberes y teorías alternativas que muestren los puntos débiles de mi enfoque.'] } },
    { id: 'morin', ico: '🕸️', afirmacion: '4.6 · Edgar Morin: el pensamiento complejo', respuestas: {
      idea: ['La ciencia clásica simplificó con disyunción, reducción y abstracción, y fragmentó el conocimiento. Complexus es «lo que está tejido junto»: hay que pensar con los principios dialógico, de recursividad y hologramático.'],
      aula: ['Un salón demasiado ordenado no aprende y uno en caos tampoco (dialógico); cada alumno lleva en sí la cultura de su comunidad (hologramático). En la NEM: campos formativos y ejes articuladores.'],
      critica: ['«Todo está relacionado» puede volverse una frase vacía si no se concreta en métodos; la complejidad también hay que investigarla con rigor.'],
      investigo: ['No reducir mi fenómeno a una sola dimensión: mirar lo biológico, lo psicológico, lo social y lo cultural, y el contexto en que ocurre.'] } },
    { id: 'sociales', ico: '🏫', afirmacion: '4.7 · La cientificidad de las ciencias sociales', respuestas: {
      idea: ['Las ciencias sociales no fracasan por no parecerse a la física: su objeto, el ser humano que da sentido a sus acciones, pide métodos propios. Hay doble hermenéutica (Giddens) y criterios propios de rigor: credibilidad, transferibilidad, consistencia y confirmabilidad.'],
      aula: ['Cuando la palabra «bullying» entró a las escuelas cambió la manera en que alumnos y maestros viven ciertos conflictos: los conceptos regresan a la sociedad y la transforman. A las piedras no les pasa.'],
      critica: ['Si no se cuidan los criterios de rigor, «tener otro método» puede servir de excusa para la falta de rigor.'],
      investigo: ['Dar rigor a mi investigación con los criterios de calidad de la investigación cualitativa (o cuantitativa, según el caso), sin imitar un método idealizado.'] } },
  ],
};

// ---------- 🪞 Mi inercia mental (Mar 10 nov · Tema 5). Individual y sin clave: es personal.
CUADROS['mi-inercia'] = {
  id: 'act-mi-inercia', ind: 'tarea-mi-inercia', clave: 'miInercia', sinClave: true,
  titulo: 'Mi inercia mental', kicker: 'Tema 5.1 · Inercia mental y obstáculos epistemológicos', archivo: 'Mi_inercia',
  ayuda: 'Piensa en algo que das por hecho sobre la educación sin haberlo examinado nunca (por ejemplo, sobre los exámenes, las tareas, la disciplina o «los alumnos de hoy»). Escríbelo con honestidad: no hay respuestas malas.',
  columnas: [['yo', 'Lo que escribo', '#8E5BA8']],
  ejemplo: { caso: 'Una creencia de ejemplo (la tuya debe ser otra)', celdas: {
    creencia_yo: 'Creo que los alumnos que se sientan hasta atrás son los que no quieren estudiar.',
    origen_yo: 'Lo escuché de varios maestros en la secundaria y en la prepa, y lo veía en compañeros de atrás que platicaban mucho.',
    obstaculo_yo: 'Generalización apresurada: saqué una regla para todos los de atrás a partir de unos cuantos compañeros que conocí.',
    duda_yo: 'Hay alumnos que se sientan atrás por timidez, porque llegaron tarde o porque ven bien de lejos. Y con Hanson: quizá solo veo lo que ya espero ver.',
    cambio_yo: 'Me haría cambiar comparar las calificaciones por lugar en el salón. En mi investigación podría sesgarme a observar solo a los de atrás.',
  } },
  filas: [
    ['creencia', 'Mi creencia', '¿Qué doy por hecho sobre la educación?'],
    ['origen', '¿De dónde viene?', '¿La aprendí en mi casa, en mi escuela, de un maestro, de las redes?'],
    ['obstaculo', '¿Qué obstáculo de Bachelard es?', 'Experiencia primera, generalización apresurada, obstáculo verbal, conocimiento unitario o sustancialista. ¿Por qué?'],
    ['duda', '¿Qué la pone en duda?', 'Un dato, una experiencia o una lectura del compendio que la cuestione.'],
    ['cambio', '¿Qué me haría cambiar de opinión?', '¿Y cómo podría sesgar mi propia investigación? (pregunta 7 del proyecto)'],
  ],
};

// ---------- 🌽 Saberes de la vida (Mar 10 nov · 6.1 y 6.2). Es el cuadro comparativo del programa (actividad con
// docente). A cada equipo le toca por sorteo un saber local; la clave es la misma para todos (lo que dice el compendio).
CUADROS.saberes = {
  id: 'act-saberes', ind: 'tarea-saberes', clave: 'saberes',
  titulo: 'Saberes de la vida: conocimiento ordinario y conocimiento científico', kicker: 'Tema 6 · Conocimiento científico y conocimiento ordinario (6.1 y 6.2)', archivo: 'Saberes_de_la_vida',
  sorteo: 'El saber que le tocó a su equipo por sorteo', sorteoInd: 'Tu saber', nombreVariante: 'El saber',
  ayuda: 'Comparen su saber visto como <b>conocimiento ordinario o local</b> (como lo sabe la comunidad) y como <b>conocimiento científico</b> (como lo estudia la ciencia). Usen ejemplos de su comunidad o de la escuela. La fila <b>🔎 Investiga</b> pide una fuente de lo que dice la ciencia sobre su saber.',
  columnas: [['ordinario', 'Como saber de la comunidad', '#C98A2C'], ['cientifico', 'Como conocimiento científico', '#2E6FA8']],
  // Ejemplo resuelto con OTRO saber (que no le toca a ningún equipo), para que vean cómo se contesta sin copiarlo.
  ejemplo: { caso: '🐝 La miel de la abeja melipona (xunán kab) en la península', celdas: {
    origen_ordinario: 'Los mayas la cultivan desde hace siglos en jobones (troncos huecos). Lo produjeron generaciones de familias que observaron a las abejas en el monte.',
    origen_cientifico: 'Lo producen biólogos y químicos de universidades y centros de investigación que estudian a las abejas sin aguijón y analizan su miel en el laboratorio.',
    transmision_ordinario: 'En la familia: el abuelo le enseña al nieto a abrir el jobón sin dañar la cría y cuándo cosechar. Casi todo es oral y se aprende haciendo.',
    transmision_cientifico: 'Por escrito: artículos, tesis, congresos y cursos para productores. Cualquiera puede leerlo y revisarlo.',
    validacion_ordinario: 'Se cree porque «siempre ha funcionado»: las abuelas han visto por generaciones que la miel ayuda con los ojos y las heridas.',
    validacion_cientifico: 'Se pone a prueba: se analizan muestras en laboratorio para ver si de verdad combaten bacterias, y otros investigadores pueden repetirlo.',
    alcance_ordinario: 'Funciona en la península, con estas abejas, estas flores y este clima; en otra región quizá no aplica igual.',
    alcance_cientifico: 'Busca explicar por qué funciona en cualquier lugar (qué sustancias de la miel actúan), aunque sus resultados son provisionales.',
    fortalezas_ordinario: 'Cuida a la abeja y al monte, se basa en siglos de observación y es parte de la identidad de la comunidad.',
    fortalezas_cientifico: 'Puede comprobar qué usos sí funcionan, explicar por qué y ayudar a proteger a una abeja que está en peligro.',
    limites_ordinario: 'Algunas creencias no se han comprobado (por ejemplo, que cura cualquier enfermedad) y el saber se pierde si los jóvenes ya no lo aprenden.',
    limites_cientifico: 'Puede despreciar el saber de los meliponicultores o quedarse en artículos que la comunidad nunca lee.',
    dicen_ordinario: 'La comunidad la usa para los ojos y las heridas. La ciencia le dio la razón en parte: el saber local había notado algo real mucho antes.',
    dicen_cientifico: 'Hay estudios de laboratorio que encontraron que esta miel frena el crecimiento de algunas bacterias; no hay pruebas de que cure «de todo». (Abajo, en Fuente: autor, título, año y enlace).',
  } },
  filas: [
    ['origen', 'Origen', '¿De dónde sale? ¿Quién lo produce?'],
    ['transmision', 'Cómo se transmite', '¿En la familia y la comunidad, o en la escuela, las revistas y los congresos?'],
    ['validacion', 'Cómo se valida', '¿Porque funciona y se ha hecho siempre, o porque se pone a prueba y se somete a crítica?'],
    ['alcance', 'Alcance', '¿Local (funciona en su contexto) o universal?'],
    ['fortalezas', 'Fortalezas', '¿En qué es bueno este saber?'],
    ['limites', 'Limitaciones', '¿Dónde puede fallar?'],
    ['dicen', 'Lo que dice la ciencia de este saber', 'Busquen qué ha estudiado la ciencia sobre su saber: qué confirmó, qué explicó o qué no ha comprobado.', true],
  ],
  respuestas: {
    origen: ['La experiencia de generaciones en relación con su territorio: lo produce la comunidad.', 'La investigación sistemática de comunidades científicas, con teorías y métodos explícitos.'],
    transmision: ['De forma oral y práctica, en la familia y la comunidad: se aprende haciendo junto a quien sabe.', 'Por escrito y de forma pública: libros, revistas, congresos, la escuela y la universidad.'],
    validacion: ['Porque funciona en la práctica y ha resistido el tiempo; rara vez se pone a prueba deliberadamente (es poco crítico).', 'Se somete a prueba y a crítica pública (cánones de cientificidad): verificable, provisional, comunicable.'],
    alcance: ['Contextual: funciona muy bien en su territorio, pero puede fallar fuera de él.', 'Busca generalizar, aunque también tiene límites y sus verdades son provisionales.'],
    fortalezas: ['Práctico, pertinente y probado por generaciones; a veces la ciencia lo explica siglos después (milpa, nixtamalización).', 'Sistemático, crítico y comunicable; puede explicar por qué algo funciona y corregir errores.'],
    limites: ['Poco sistemático y poco crítico: también puede equivocarse gravemente (el Sol que «gira» alrededor de la Tierra).', 'Puede despreciar otros saberes (cientificismo, epistemicidio) o quedar lejos de la vida de las personas.'],
    dicen: ['Respuesta abierta: según su saber. Ojo con los dos riesgos del compendio: el cientificismo (solo vale la ciencia) y el relativismo ingenuo (todo vale igual para todo).', 'Respuesta abierta: por ejemplo, la ciencia de la nutrición explicó los beneficios de la nixtamalización; muchos medicamentos salieron de plantas medicinales, aunque no todo remedio resistió la comprobación.'],
  },
  variantes: [
    { id: 'milpa', ico: '🌽', afirmacion: 'La milpa: maíz, frijol y calabaza sembrados juntos' },
    { id: 'nixtamal', ico: '🫓', afirmacion: 'La nixtamalización: cocer el maíz con cal' },
    { id: 'herbolaria', ico: '🌿', afirmacion: 'La medicina tradicional y la herbolaria (remedios de plantas)' },
    { id: 'pesca', ico: '🎣', afirmacion: 'El conocimiento del mar de los pescadores del Golfo (temporadas, mareas, señales)' },
    { id: 'partera', ico: '🤱', afirmacion: 'El saber de las parteras tradicionales de la península' },
    { id: 'maestro', ico: '🍎', afirmacion: 'El saber tácito de un buen maestro: saber cuándo un grupo está a punto de desbordarse' },
  ],
};

// ---------- 🧠 Analiza un producto «neuro» (Mar 17 nov · Tema 7). Es la tarea del programa (análisis de un producto «neuro»).
CUADROS['producto-neuro'] = {
  id: 'act-producto-neuro', ind: 'tarea-producto-neuro', clave: 'productoNeuro',
  titulo: 'Analiza un producto «neuro»', kicker: 'Tema 7 · El proceso de enseñanza-aprendizaje a la luz de la neurociencia', archivo: 'Producto_neuro',
  sorteo: 'El producto que le tocó a su equipo por sorteo', sorteoInd: 'Tu producto', nombreVariante: 'El producto',
  ayuda: 'Imaginen que se lo quieren vender a su escuela. Júzguenlo con lo que dice el Tema 7 y con los cánones de cientificidad del Tema 2. La fila <b>🔎 Investiga</b> pide buscar en el celular un estudio o una revisión real, con su fuente.',
  columnas: [['equipo', 'Lo que escribe el equipo', '#3E5BA8']],
  ejemplo: { caso: '🍬 Un producto inventado: gomitas «NeuroMax», «30 % más memoria en una semana»', celdas: {
    promete_equipo: 'Que comer dos gomitas al día aumenta 30 % la memoria y mejora las calificaciones en una semana.',
    mito_equipo: 'Que el cerebro se «potencia» con una sustancia mágica, sin estudiar ni practicar (una solución rápida para algo complejo).',
    evidencia_equipo: 'Buscamos en Google Académico y no hay ningún estudio publicado sobre el producto; su página solo tiene testimonios. (Abajo, en Fuente: lo que consultaron, con enlace).',
    canones_equipo: 'No es verificable: no dice quién midió el 30 % ni cómo. Promete demasiado y vende algo.',
    mejor_equipo: 'Práctica de recuperación y práctica espaciada, y dormir bien: sí tienen evidencia y son gratis.',
    veredicto_equipo: 'No lo compraríamos: es publicidad con palabras científicas, no ciencia.',
  } },
  filas: [
    ['promete', 'Qué promete', '¿Qué dice que logra en los alumnos?'],
    ['mito', 'La idea que hay detrás', '¿Qué neuromito o qué idea sobre el cerebro lo sostiene?'],
    ['evidencia', 'Qué dice la evidencia', 'Un estudio o una revisión real: qué encontró, quién lo hizo y cuándo.', true],
    ['canones', 'Los cánones de cientificidad', '¿Cita investigaciones? ¿Son verificables? ¿Promete demasiado? ¿Vende algo?'],
    ['mejor', 'Qué usaríamos en su lugar', 'Un principio con evidencia del Tema 7 (pilares de Dehaene, práctica de recuperación, espaciada, sueño…).'],
    ['veredicto', 'Veredicto del equipo', '¿Lo comprarían para su escuela? ¿Por qué?'],
  ],
  variantes: [
    { id: 'brain-gym', ico: '🤸', afirmacion: '«Gimnasia cerebral»: ejercicios que conectan los dos hemisferios y mejoran el aprendizaje', respuestas: {
      promete: ['Que ciertos movimientos (cruzar brazos y piernas, botones del cerebro) conectan los hemisferios y mejoran la atención, la lectura y el aprendizaje.'],
      mito: ['Que los hemisferios trabajan separados y hay que «conectarlos» con ejercicios específicos.'],
      evidencia: ['El compendio (tabla de neuromitos): no hay evidencia de esos efectos específicos; la actividad física en general sí favorece la salud y el bienestar.'],
      canones: ['Cita poca investigación verificable, promete mucho y se vende en cursos y certificaciones.'],
      mejor: ['Pausas activas por bienestar, sin prometer efectos cerebrales, y atención y compromiso activo (Dehaene).'],
      veredicto: ['No: es un neuromito. Moverse está bien, pero por otras razones.'] } },
    { id: 'apps', ico: '📱', afirmacion: 'Una app de «entrenamiento cerebral»: 10 minutos diarios de juegos para ser más inteligente', respuestas: {
      promete: ['Que jugar sus juegos todos los días aumenta la inteligencia, la memoria y el rendimiento escolar.'],
      mito: ['Que entrenar una tarea mejora el cerebro «en general» (transferencia lejana).'],
      evidencia: ['Las revisiones muestran que se mejora en los juegos que se practican, pero casi no se transfiere a otras tareas ni a la escuela (por ejemplo, Simons et al., 2016).'],
      canones: ['Usa palabras científicas para vender una suscripción; promete demasiado.'],
      mejor: ['Práctica de recuperación y práctica espaciada sobre lo que sí se quiere aprender (Dunlosky et al., 2013).'],
      veredicto: ['No para mejorar el aprendizaje escolar; como juego, sin promesas, está bien.'] } },
    { id: 'vak', ico: '👁️', afirmacion: 'Un test para clasificar a cada alumno como visual, auditivo o kinestésico y enseñarle en su estilo', respuestas: {
      promete: ['Que cada alumno aprende mejor si se le enseña en su estilo, y que el test lo identifica.'],
      mito: ['Los estilos de aprendizaje como rasgos fijos que determinan cómo aprende cada quien.'],
      evidencia: ['Pashler et al. (2008): no hay evidencia de que adaptar la enseñanza al estilo preferido mejore el aprendizaje. Sí ayuda presentar la información en varios formatos a todos.'],
      canones: ['Muy popular, pero cuando se pone a prueba no se sostiene; se vende en cursos para docentes.'],
      mejor: ['Usar varios formatos para todos, según el contenido, y retroalimentación del error.'],
      veredicto: ['No: es un neuromito y además etiqueta a los alumnos.'] } },
    { id: 'hemisferios', ico: '🎨', afirmacion: 'Un curso para «activar el hemisferio derecho» de los alumnos creativos', respuestas: {
      promete: ['Que hay alumnos de hemisferio izquierdo (lógicos) y derecho (creativos), y que el curso activa el derecho.'],
      mito: ['El mito de los hemisferios, que salió de los estudios de Sperry mal interpretados.'],
      evidencia: ['En un cerebro sano los dos hemisferios trabajan juntos por el cuerpo calloso; no hay evidencia de un hemisferio dominante como rasgo de aprendizaje.'],
      canones: ['Se apoya en una investigación real (Sperry, Nobel 1981) pero la exagera; promete demasiado.'],
      mejor: ['La neurociencia habla de redes integradas: actividades que integran pensar, sentir y hacer para todos.'],
      veredicto: ['No: es un neuromito.'] } },
    { id: 'mozart', ico: '🎻', afirmacion: 'Discos de Mozart para que los bebés y los niños sean más inteligentes', respuestas: {
      promete: ['Que escuchar música clásica, sobre todo Mozart, hace más inteligentes a los niños.'],
      mito: ['El «efecto Mozart».'],
      evidencia: ['Fue un efecto pequeño y pasajero en adultos que no se ha confirmado de manera consistente (compendio, tabla de neuromitos).'],
      canones: ['Tomó un estudio pequeño y lo convirtió en un producto; no es verificable lo que promete.'],
      mejor: ['La música vale por sí misma; para aprender: atención, compromiso activo y sueño.'],
      veredicto: ['No para hacerlos más inteligentes; la música sí, por gusto y cultura.'] } },
    { id: 'tres-anos', ico: '👶', afirmacion: 'Un programa de estimulación temprana: «todo se juega antes de los tres años»', respuestas: {
      promete: ['Que si el niño no recibe cierta estimulación antes de los tres años, la oportunidad se pierde para siempre.'],
      mito: ['Que las «ventanas» del cerebro se cierran para siempre.'],
      evidencia: ['Hay periodos sensibles (como los sonidos de una lengua), pero la plasticidad dura toda la vida: nadie está condenado por su cerebro.'],
      canones: ['Usa el miedo de los padres para vender; exagera un hallazgo real.'],
      mejor: ['Ambientes ricos y afectivos a toda edad; en secundaria, aprovechar la plasticidad y cuidar el sueño.'],
      veredicto: ['No como lo vende: lo temprano importa, pero no «todo se juega» ahí.'] } },
  ],
};

// ---------- 🎮 Juegos de 5 minutos (práctica, sin calificación)
// ¿Quién avanza así la ciencia? (Lun 9 nov)
export const AUTORES_T4 = [['viena', 'Círculo de Viena', '#6B5B4B'], ['popper', 'Popper', '#A63D2F'], ['kuhn', 'Kuhn', '#2E6FA8'], ['lakatos', 'Lakatos', '#3F7A4F'], ['feyerabend', 'Feyerabend', '#E07B39'], ['morin', 'Morin', '#8E5BA8']];
export const QUIEN_AVANZA = [
  { e: '✅', q: 'La ciencia avanza verificando: solo tiene sentido lo que se puede comprobar con la experiencia.', c: 'viena', niv: 1, x: 'Es el principio de verificación del Círculo de Viena (positivismo lógico).' },
  { e: '🦢', q: 'Mil cisnes blancos no prueban que todos lo sean; un solo cisne negro lo refuta.', c: 'popper', niv: 1, x: 'La asimetría entre verificar y refutar: por eso Popper propone la falsabilidad.' },
  { e: '🎯', q: 'Una teoría es científica si se puede imaginar una observación que la desmienta.', c: 'popper', niv: 1, x: 'Es la falsabilidad, el criterio de demarcación de Popper.' },
  { e: '🔄', q: 'La ciencia pasa por ciencia normal, anomalías, crisis y revoluciones.', c: 'kuhn', niv: 1, x: 'Es el ciclo de La estructura de las revoluciones científicas (1962).' },
  { e: '🦆', q: 'Después de una revolución, los científicos ven el mundo de otra manera, como el dibujo del pato-conejo.', c: 'kuhn', niv: 1, x: 'Cambiar de paradigma es como un cambio de percepción.' },
  { e: '🧱', q: 'Hay un núcleo duro que no se toca y un cinturón protector que se ajusta cuando llegan datos contrarios.', c: 'lakatos', niv: 1, x: 'Es la estructura de un programa de investigación.' },
  { e: '📈', q: 'Un programa es progresivo si predice hechos nuevos; degenerativo si solo se justifica después.', c: 'lakatos', niv: 1, x: 'Es el criterio de Lakatos para elegir entre programas.' },
  { e: '🎭', q: '«Todo vale»: ninguna regla metodológica fija garantiza el progreso.', c: 'feyerabend', niv: 1, x: 'Es el anarquismo epistemológico del Tratado contra el método (1975).' },
  { e: '🔭', q: 'Galileo defendió a Copérnico con retórica y propaganda cuando la evidencia no lo favorecía: si hubiera seguido «el método», la ciencia moderna no habría nacido.', c: 'feyerabend', niv: 2, x: 'Es el ejemplo histórico de Feyerabend contra el método único.' },
  { e: '🕸️', q: 'Complexus: lo que está tejido junto.', c: 'morin', niv: 1, x: 'Es la raíz de «complejidad» en el pensamiento complejo.' },
  { e: '✂️', q: 'La ciencia clásica simplificó con disyunción, reducción y abstracción.', c: 'morin', niv: 1, x: 'Son las tres operaciones del paradigma de simplificación.' },
  { e: '📚', q: 'Los siete saberes necesarios para la educación del futuro, por encargo de la UNESCO.', c: 'morin', niv: 1, x: 'Morin (1999).' },
  { e: '🏫', q: 'Los campos formativos y los ejes articuladores de la NEM buscan superar la fragmentación del conocimiento.', c: 'morin', niv: 2, x: 'Es la influencia de Morin en la Nueva Escuela Mexicana.' },
  { e: '🌐', q: 'La sociedad produce a los individuos y los individuos producen la sociedad.', c: 'morin', niv: 2, x: 'Es el principio de recursividad organizacional.' },
  { e: '🧩', q: 'Cada alumno lleva en sí la cultura de su comunidad: el todo está en la parte.', c: 'morin', niv: 2, x: 'Es el principio hologramático.' },
  { e: '⚖️', q: 'Un salón demasiado ordenado no aprende y uno en caos tampoco: orden y desorden se necesitan.', c: 'morin', niv: 2, x: 'Es el principio dialógico.' },
  { e: '🌱', q: 'Es bueno que proliferen teorías alternativas, aunque contradigan lo establecido.', c: 'feyerabend', niv: 2, x: 'La proliferación de teorías permite ver los puntos débiles de la dominante.' },
  { e: '🗳️', q: 'En una sociedad libre, los ciudadanos deberían decidir qué tradiciones enseñar; la ciencia es una más.', c: 'feyerabend', niv: 2, x: 'Feyerabend criticó que la ciencia ocupara el lugar de autoridad que tuvo la religión.' },
  { e: '🚫', q: 'Heurística negativa: lo que no se debe tocar; heurística positiva: qué problemas investigar.', c: 'lakatos', niv: 2, x: 'Cada programa de investigación tiene las dos.' },
  { e: '🤝', q: 'Quería un camino intermedio: aceptar que no se abandona una teoría a la primera refutación, pero que elegir entre teorías sea racional.', c: 'lakatos', niv: 2, x: 'Lakatos, entre Popper y Kuhn.' },
  { e: '🍎', q: 'El constructivismo: su núcleo es que el conocimiento se construye; si una estrategia falla, se ajusta el andamiaje.', c: 'lakatos', niv: 2, x: 'Es el ejemplo del compendio para el aula mexicana.' },
  { e: '👥', q: 'La comunidad científica decide, no sin resistencia, cambiar de paradigma.', c: 'kuhn', niv: 2, x: 'Para Kuhn, la comunidad es decisiva.' },
  { e: '📏', q: 'Dos paradigmas no se pueden comparar con una medida común.', c: 'kuhn', niv: 2, x: 'Es la inconmensurabilidad.' },
  { e: '🌘', q: 'El eclipse de 1919 pudo desmentir a Einstein y no lo hizo: su teoría quedó corroborada.', c: 'popper', niv: 2, x: 'Popper admiraba que Einstein se arriesgara a una predicción que podía fallar.' },
  { e: '🔮', q: 'La astrología y el psicoanálisis lo explican todo… y por eso no son ciencia.', c: 'popper', niv: 2, x: 'Una teoría que nada puede refutar no es científica.' },
  { e: '🧪', q: 'De muchos casos observados se generaliza una ley (inducción).', c: 'viena', niv: 2, x: 'Así entendía el avance de la ciencia el positivismo lógico, hasta chocar con el problema de la inducción.' },
  { e: '📜', q: 'La concepción científica del mundo (1929): solo son significativas las afirmaciones verificables o lógicamente verdaderas.', c: 'viena', niv: 2, x: 'Es el manifiesto del Círculo de Viena.' },
];
// ¿Qué obstáculo es? (Mar 10 nov) · los obstáculos epistemológicos de Bachelard (5.1)
export const OBSTACULOS = [['experiencia', 'Experiencia primera', '#C0503F'], ['generalizacion', 'Generalización apresurada', '#E07B39'], ['verbal', 'Obstáculo verbal', '#2E6FA8'], ['unitario', 'Conocimiento unitario y pragmático', '#3F7A4F'], ['sustancialista', 'Sustancialista', '#8E5BA8']];
export const QUE_OBSTACULO = [
  { e: '👀', q: '«Se ve que el Sol gira alrededor de la Tierra: sale por un lado y se mete por el otro.»', c: 'experiencia', niv: 1, x: 'Confiar sin crítica en la primera impresión de los sentidos.' },
  { e: '🌡️', q: '«El metal está más frío que la madera: tócalo.» (Están a la misma temperatura.)', c: 'experiencia', niv: 1, x: 'La sensación engaña: el metal conduce mejor el calor. Es una idea previa típica de los alumnos.' },
  { e: '🙋', q: '«Este alumno se ve distraído, seguro no le interesa la clase.»', c: 'experiencia', niv: 2, x: 'Juzgar por la primera impresión, sin indagar.' },
  { e: '🧒', q: '«Dos alumnos de esa colonia reprobaron: los de esa colonia no estudian.»', c: 'generalizacion', niv: 1, x: 'Sacar una conclusión general de pocos casos.' },
  { e: '📱', q: '«Mi sobrino usa mucho el celular y saca malas calificaciones: el celular baja el rendimiento de todos.»', c: 'generalizacion', niv: 1, x: 'Un caso no basta para una ley general.' },
  { e: '🏫', q: '«Probé los proyectos con un grupo y no funcionó: los proyectos no sirven.»', c: 'generalizacion', niv: 2, x: 'Generalizar a partir de una sola experiencia.' },
  { e: '🏷️', q: '«No aprende porque tiene TDAH.» (Y con eso se da por explicado todo.)', c: 'verbal', niv: 1, x: 'Creer que se explica algo solo por ponerle nombre; la etiqueta no explica qué le pasa ni qué hacer.' },
  { e: '🧲', q: '«El imán atrae porque tiene fuerza magnética.»', c: 'verbal', niv: 1, x: 'El nombre se vuelve explicación: no dice nada nuevo.' },
  { e: '💬', q: '«Ese alumno es así por su personalidad.»', c: 'verbal', niv: 2, x: 'La palabra «personalidad» parece explicar, pero solo nombra.' },
  { e: '🔑', q: '«Todo se explica por la motivación: si el alumno quiere, aprende.»', c: 'unitario', niv: 1, x: 'Querer explicarlo todo con un solo principio.' },
  { e: '🛠️', q: '«Si una técnica funciona, no importa por qué funciona.»', c: 'unitario', niv: 2, x: 'Valorar el conocimiento solo por su utilidad inmediata.' },
  { e: '🧬', q: '«Todo es genética: el que nace inteligente, aprende.»', c: 'unitario', niv: 2, x: 'Un solo principio para explicarlo todo (y además, la plasticidad lo desmiente).' },
  { e: '✨', q: '«Hay niños que tienen “el don” para las matemáticas.»', c: 'sustancialista', niv: 1, x: 'Atribuir una cualidad oculta que estaría «dentro» de la persona.' },
  { e: '🪨', q: '«La piedra cae porque tiene “pesadez”.»', c: 'sustancialista', niv: 1, x: 'Una cualidad oculta en la cosa, como en la física antigua.' },
  { e: '💎', q: '«Esa escuela tiene algo especial: ahí los alumnos salen buenos.»', c: 'sustancialista', niv: 2, x: 'Una esencia misteriosa en lugar de buscar qué prácticas lo explican.' },
  { e: '🔥', q: '«La madera se quema porque tiene fuego dentro.»', c: 'sustancialista', niv: 2, x: 'Es como el viejo «flogisto»: una sustancia oculta.' },
];
// ¿Neuromito o evidencia? (Mar 17 nov) · Tema 7
export const NEURO_OP = [['M', 'Neuromito', '#C0503F'], ['E', 'Con evidencia', '#3F7A4F']];
export const NEUROMITOS = [
  { e: '💯', q: 'Solo usamos el 10 % del cerebro.', c: 'M', niv: 1, x: 'Usamos prácticamente todo el cerebro; distintas zonas se activan según la tarea.' },
  { e: '🎨', q: 'Hay personas de hemisferio izquierdo y personas de hemisferio derecho.', c: 'M', niv: 1, x: 'Los hemisferios trabajan juntos; el mito salió de los estudios de Sperry mal interpretados.' },
  { e: '👁️', q: 'Se aprende mejor si se enseña según el estilo: visual, auditivo o kinestésico.', c: 'M', niv: 1, x: 'No hay evidencia (Pashler et al., 2008). Sí ayuda presentar la información en varios formatos a todos.' },
  { e: '🤸', q: 'La «gimnasia cerebral» conecta los dos hemisferios.', c: 'M', niv: 1, x: 'No hay evidencia de esos efectos; la actividad física en general sí favorece la salud.' },
  { e: '🎻', q: 'Escuchar a Mozart hace más inteligentes a los niños.', c: 'M', niv: 1, x: 'Fue un efecto pequeño y pasajero que no se ha confirmado de manera consistente.' },
  { e: '👶', q: 'Todo se juega antes de los tres años.', c: 'M', niv: 1, x: 'Hay periodos sensibles, pero la plasticidad dura toda la vida.' },
  { e: '🍬', q: 'El azúcar provoca hiperactividad.', c: 'M', niv: 2, x: 'Los estudios controlados no han encontrado ese efecto.' },
  { e: '🦎', q: 'Tenemos un cerebro reptiliano, uno límbico y uno racional superpuestos.', c: 'M', niv: 2, x: 'El cerebro triuno de MacLean es una simplificación que la neurociencia actual no sostiene.' },
  { e: '🔁', q: 'El cerebro cambia sus conexiones con la experiencia toda la vida.', c: 'E', niv: 1, x: 'Es la plasticidad cerebral: nadie está condenado por su cerebro.' },
  { e: '😴', q: 'Dormir es necesario para consolidar lo aprendido.', c: 'E', niv: 1, x: 'Durante el sueño el cerebro reactiva y reorganiza lo aprendido.' },
  { e: '📝', q: 'Intentar recordar con preguntas fortalece la memoria más que releer.', c: 'E', niv: 1, x: 'Es la práctica de recuperación o efecto de prueba (Roediger y Karpicke, 2006).' },
  { e: '📅', q: 'Estudiar en varias sesiones es mejor que todo la noche antes del examen.', c: 'E', niv: 1, x: 'Es la práctica espaciada, de utilidad alta en la revisión de Dunlosky et al. (2013).' },
  { e: '❤️', q: 'La emoción forma parte del aprendizaje: aprendemos lo que nos importa.', c: 'E', niv: 1, x: 'Immordino-Yang y Damasio: pensar y sentir no se separan.' },
  { e: '🔗', q: 'Las neuronas que se activan juntas tienden a conectarse.', c: 'E', niv: 2, x: 'Es la propuesta de Donald Hebb (1949), base de la plasticidad.' },
  { e: '❓', q: 'La curiosidad prepara al cerebro para aprender mejor.', c: 'E', niv: 2, x: 'Por eso funciona abrir una clase con una pregunta (las murallas de Campeche).' },
  { e: '😰', q: 'El estrés intenso y prolongado afecta la memoria y el aprendizaje.', c: 'E', niv: 2, x: 'Un poco de tensión moviliza, pero el estrés crónico perjudica.' },
  { e: '🧑‍🎓', q: 'La corteza prefrontal termina de madurar después de la adolescencia.', c: 'E', niv: 2, x: 'El cerebro adolescente está en plena reorganización.' },
  { e: '🖍️', q: 'Releer y subrayar son las técnicas de estudio más eficaces.', c: 'M', niv: 2, x: 'Son las más usadas, pero resultaron de baja utilidad en la revisión de Dunlosky et al. (2013).' },
  { e: '❌', q: 'El error es información: el cerebro aprende de la diferencia entre lo que esperaba y lo que pasó.', c: 'E', niv: 2, x: 'Es la retroalimentación del error, uno de los cuatro pilares de Dehaene.' },
  { e: '🔀', q: 'Alternar tipos de problemas ayuda a distinguir cuándo usar cada estrategia.', c: 'E', niv: 2, x: 'Es la práctica intercalada.' },
];
