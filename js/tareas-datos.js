// tareas-datos.js — Tareas digitales y juegos de Epistemología y Pedagogía (Parcial 2).
// Todo sale del libro de texto de la materia (compendio del Aula Virtual).

// tipo: cuadro (en equipo o individual, en vivo, con clave) · practica (juego sin calificación) · pronto
export const TEMAS_TAREAS = [
  { tema: '2 y 3', titulo: 'Naturaleza del conocimiento y racionalidad científica clásica', fecha: '2026-10-26', fechaTexto: 'Lun 26 de octubre', acts: [
    { id: 'paradigmas', tipo: 'cuadro', icono: '📋', nombre: 'Cuadro de los tres paradigmas', modo: 'En equipo · en vivo', desc: 'Positivista, interpretativo y sociocrítico: finalidad, realidad, métodos, autores y un ejemplo real de tesis que ustedes investigan.' },
    { id: 'que-paradigma', tipo: 'practica', icono: '🧭', nombre: '¿Qué paradigma es?', modo: 'Juego de práctica', desc: 'Títulos de tesis, fragmentos y autores: ¿positivista, interpretativo o sociocrítico? Y una ronda de pensamiento lineal contra sistémico.' },
  ] },
  { tema: '3 y 4', titulo: 'Lógica dialéctica y concepción contemporánea de la ciencia', fecha: '2026-10-27', fechaTexto: 'Mar 27 de octubre', acts: [
    { id: 'pon-a-prueba', tipo: 'cuadro', icono: '⚖️', nombre: 'Pon a prueba una idea', modo: 'En equipo · en vivo', desc: 'A cada equipo le toca por sorteo una afirmación que se oye en las escuelas. La analizan con los seis autores del Tema 4, buscan evidencia en el momento y dan su veredicto: ¿es ciencia?' },
    { id: 'ficha-autor', tipo: 'cuadro', icono: '🧩', nombre: 'Ficha del autor (rompecabezas)', modo: 'En equipo · en vivo', desc: 'Cada equipo se vuelve experto en su autor del Tema 4: idea central, conceptos, cómo avanza la ciencia, críticas y qué le dice a la pedagogía. Con ella exponen.' },
    { id: 'coevaluacion', tipo: 'coev', icono: '🗣️', nombre: 'Coevaluación de las exposiciones', modo: 'Individual · en vivo', desc: 'Mientras expone cada equipo, califícalo con la rúbrica desde tu celular y déjale una pregunta.' },
    { id: 'teoricos', tipo: 'cuadro', icono: '📊', nombre: 'Cuadro comparativo de los seis teóricos', modo: 'En equipo · en vivo', desc: 'Positivismo lógico, Popper, Kuhn, Lakatos, Feyerabend y Morin: cómo avanza la ciencia, qué la distingue, conceptos clave, obras y qué le dicen a la educación.' },
    { id: 'quien-lo-dijo', tipo: 'practica', icono: '💬', nombre: '¿Quién lo dijo?', modo: 'Juego de práctica', desc: 'Frases y obras contra su autor: de Platón a Morin. Los 55 pensadores de la Constelación, con niveles y modo reto.' },
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
