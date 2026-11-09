// ruta-datos.js — «Clase autoguiada»: una clase que el alumno recorre solo, por estaciones que se desbloquean.
// Se guarda en grupos/{g}/alumnos/{a}/atlas/{RUTA.ind}:
//   hechas.{estación} = ms · checks.{tarjeta} = { ok, intentos } · juego = { bien, total }
//   salida.{p1,p2,p3} · bitacora.{campo} · entregado = { t }
// Cuenta como tarea del Parcial 2 (dig-clase-autoguiada). La bitácora de la conferencia, como participación.

const palabras = t => (String(t || '').trim().match(/\S+/g) || []).length;
const r1 = n => Math.round(n * 10) / 10;

export const MIN_SALIDA = 15;     // palabras por respuesta de salida
export const MIN_BITACORA = 8;    // palabras por campo de la bitácora

export const RUTAS = {
  'clase-autoguiada': {
    id: 'clase-autoguiada', ind: 'tarea-clase-autoguiada',
    titulo: 'Clase autoguiada · Temas 5 y 6',
    intro: 'Hoy no hay clase en el salón, así que la clase viene a ti. Recorre las estaciones en orden: cada una se desbloquea al terminar la anterior. Calcula unos <b>90 minutos</b>; puedes hacerla en partes, todo se guarda solo.',
    participacion: { id: 'dig-bitacora-conferencia', nombre: 'Bitácora de la conferencia', fecha: '2026-11-10' },
    estaciones: [
      { id: 'calienta', tipo: 'juego', ico: '🎮', titulo: 'Calentamiento: ¿Qué obstáculo es?', min: 5,
        desc: 'Juega una ronda (la que quieras). No importa cuántas aciertes: te prepara para la mini-lección. Al terminar la ronda se desbloquea la siguiente estación.' },

      { id: 'leccion5', tipo: 'leccion', ico: '📖', titulo: 'Mini-lección del Tema 5: el nuevo paradigma', min: 30,
        desc: 'Siete tarjetas. Lee cada una y contesta su pregunta: si aciertas, pasas a la siguiente; si no, lee la explicación y vuelve a intentar.',
        tarjetas: [
          { k: '5.1 · Inercia mental', t: '¿Por qué nos cuesta tanto cambiar?',
            texto: ['En física, la **inercia** es la tendencia de un cuerpo a seguir como está mientras ninguna fuerza lo cambie. La **inercia mental** es lo mismo, pero en la cabeza: seguir pensando como siempre aunque aparezcan razones para cambiar.',
              '**Miguel Martínez Miguélez** (1997) dice que el mayor obstáculo para una nueva forma de pensar no es la falta de argumentos, sino la **fuerza de los hábitos**: aprendimos a pensar de forma lineal, fragmentada y cuantitativa, y eso se volvió «natural». No lo elegimos: lo heredamos.'],
            ej: 'En una junta se propone evaluar con proyectos y rúbricas. Alguien dice: «**Así lo hemos hecho siempre**», «a mí me evaluaron así y salí bien». Eso no es un argumento: es inercia.',
            q: 'Según Martínez Miguélez, ¿cuál es el mayor obstáculo para adoptar una nueva forma de pensar?',
            ops: ['La fuerza de los hábitos mentales que heredamos', 'La falta de argumentos a favor del cambio', 'Que la ciencia todavía no tiene pruebas suficientes'], c: 0,
            x: 'Los argumentos suelen existir; lo que frena es el hábito: pensar como siempre se ha pensado.' },
          { k: '5.1 · Bachelard', t: 'Los obstáculos epistemológicos',
            texto: ['**Gaston Bachelard** (1938) observó que no aprendemos sobre una mente vacía, sino **contra** ideas previas mal hechas. A esas barreras las llamó **obstáculos epistemológicos**:',
              '• **Experiencia primera:** confiar en la primera impresión, sin crítica.\n• **Generalización apresurada:** concluir mucho con pocos casos.\n• **Obstáculo verbal:** creer que algo está explicado porque ya tiene nombre.\n• **Conocimiento unitario y pragmático:** explicarlo todo con un solo principio o por su utilidad.\n• **Sustancialista:** atribuir cualidades ocultas a las cosas.',
              'Para Bachelard, el problema del maestro no es que el alumno no sepa, sino que ya «sabe» algo que le impide aprender.'],
            ej: '«Ese niño no aprende porque es **flojo**». Parece una explicación, pero solo es una etiqueta: ponerle nombre no es explicarlo (obstáculo verbal).',
            video: { id: 'h2Gf17j-VZ4', pie: 'La noción de obstáculo epistemológico de Gaston Bachelard · Ajedrez Social. Opcional: con los primeros minutos basta.' },
            q: '«Los tres alumnos que se sientan atrás reprobaron, así que los de atrás no estudian». ¿Qué obstáculo es?',
            ops: ['Generalización apresurada', 'Obstáculo verbal', 'Sustancialista'], c: 0,
            x: 'Se saca una conclusión general (todos los de atrás) a partir de tres casos.' },
          { k: '5.2 · Desconstruir el método', t: 'La observación está cargada de teoría',
            texto: ['**Desconstruir** (Derrida) no es destruir: es desarmar con cuidado una idea para ver qué supuestos esconde. El método científico de los manuales supone que **la observación es neutral**, que sujeto y objeto están separados, que el método es un **algoritmo** de pasos fijos y que **solo vale lo medible**.',
              '**Norwood Russell Hanson** (1958) mostró que **toda observación está cargada de teoría**: lo que vemos depende de lo que ya sabemos.'],
            ej: 'Un médico ve en una radiografía una fractura; tú ves manchas grises. Miran lo mismo, pero **no ven lo mismo**.',
            q: '¿Qué quiere decir que «la observación está cargada de teoría»?',
            ops: ['Que lo que vemos depende de lo que ya sabemos', 'Que solo los científicos pueden observar bien', 'Que hay que leer la teoría antes de observar cualquier cosa'], c: 0,
            x: 'Nadie observa con la mente en blanco: nuestros conocimientos y expectativas deciden qué notamos y cómo lo interpretamos.' },
          { k: '5.2 · El método como camino', t: 'Método viene de «camino»',
            texto: ['Martínez Miguélez (2004) recuerda que *méthodos*, en griego, significa **camino**. Y el camino depende del terreno: no se sube una montaña igual que se cruza un río. Por eso:',
              '• **El método se adecua al objeto**, no al revés.\n• **El diseño puede ser emergente:** el plan se ajusta mientras avanza la investigación.\n• **La triangulación** (contrastar fuentes, métodos o investigadores) da solidez.\n• **Reflexividad:** el investigador reconoce sus propios supuestos en vez de fingir neutralidad.',
              'Hasta la física lo reconoce: **Ilya Prigogine** (Nobel 1977) mostró que la naturaleza no es solo un reloj predecible; también hay inestabilidad y orden que surge del desorden.'],
            ej: 'Si tu pregunta es «¿cómo viven los maestros la NEM?», una encuesta de opción múltiple quizá no sea el mejor camino; unas entrevistas, sí.',
            q: 'Una investigadora reconoce en su tesis que es maestra de la escuela que estudia y explica cómo eso puede influir en lo que ve. ¿Qué está haciendo?',
            ops: ['Reflexividad', 'Triangulación', 'Diseño emergente'], c: 0,
            x: 'Reflexividad: explicitar la propia posición y los propios supuestos. La triangulación sería contrastar varias fuentes o métodos.' },
          { k: '5.3 · Neurociencia', t: 'El cerebro no es un espejo: construye',
            texto: ['La neurociencia actual muestra que percibir no es recibir: el cerebro **completa, interpreta y anticipa**. Muchos lo describen como una **máquina de predicción** que lanza hipótesis sobre el mundo y las corrige con lo que llega de los sentidos (¡se parece a las conjeturas y refutaciones de Popper!).',
              '**Maturana y Varela** (1984), en *El árbol del conocimiento*: todo hacer es conocer y todo conocer es hacer. Lo que un ser vivo conoce depende de su estructura: un perro, un murciélago y tú «conocen» mundos distintos en el mismo lugar.'],
            ej: 'Las ilusiones ópticas: vemos movimiento donde no lo hay o completamos figuras que no existen.',
            video: { id: 'lyu7v7nWzfo', pie: 'Anil Seth · «Tu cerebro alucina tu realidad» (TED, con subtítulos en español). Basta con los primeros 6 minutos.', cc: true },
            q: '¿Cuál es la idea central que la neurociencia le aporta a la epistemología?',
            ops: ['El cerebro construye activamente lo que conoce', 'El cerebro copia la realidad tal como es', 'Solo se conoce lo que se puede medir en el cerebro'], c: 0,
            x: 'El cerebro no es un espejo de la realidad: predice, completa e interpreta.' },
          { k: '5.3 · Damasio', t: 'La emoción no es enemiga de la razón',
            texto: ['**Antonio Damasio** (1994), en *El error de Descartes*, estudió pacientes que razonaban perfectamente en abstracto pero no podían tomar buenas decisiones en su vida: habían perdido las señales emocionales.',
              'Su conclusión: **la emoción es condición de la razón**. El «error de Descartes» fue separar mente y cuerpo, razón y emoción. Conoce un **ser humano completo**, con cuerpo, emociones e historia.'],
            ej: 'Una maestra dedica tres minutos después del recreo a respirar y preguntar cómo se sienten. No es tiempo perdido: es crear una **condición para aprender**.',
            q: 'Según Damasio, ¿qué pasa cuando una persona pierde las señales emocionales?',
            ops: ['Puede razonar en abstracto, pero no decide bien en su vida', 'Razona mejor, porque ya nada la distrae', 'Deja de poder razonar en abstracto'], c: 0,
            x: 'Sus pacientes conservaban la lógica, pero sin emoción no sabían qué era importante, y su vida práctica se derrumbaba.' },
          { k: '5.4 · La dimensión dialógica', t: 'El conocimiento como conversación',
            texto: ['Si la observación está cargada de teoría y el investigador es parte de lo que estudia, ¿cómo llegamos a un conocimiento confiable? **Dialogando**.',
              '• **Gadamer:** cada quien mira desde su **horizonte**; comprender es una **fusión de horizontes** en la que ambos se amplían.\n• **Habermas:** en la **acción comunicativa** se impone la fuerza del mejor argumento, no la jerarquía.\n• **Freire:** el diálogo es el corazón de la educación liberadora; el educando también sabe.\n• **Morin:** su principio dialógico mantiene juntas ideas opuestas (orden y desorden, razón y emoción).',
              'Si el conocimiento se construye dialogando, los saberes de la comunidad pueden conversar con la ciencia: es el **diálogo de saberes** de la Nueva Escuela Mexicana.'],
            ej: 'Una discusión en la que el director gana «porque es el director» no es diálogo en el sentido de Habermas.',
            q: 'En una reunión se impone una decisión porque la propuso el supervisor, aunque nadie dio razones. ¿Qué criterio de Habermas falla?',
            ops: ['Que se imponga la fuerza del mejor argumento', 'La fusión de horizontes', 'El principio dialógico de Morin'], c: 0,
            x: 'Para Habermas, en un diálogo racional gana el mejor argumento, no la autoridad ni la jerarquía.' },
        ] },

      { id: 'inercia', tipo: 'cuadro', act: 'mi-inercia', ico: '🪞', titulo: 'Tu turno: «Mi inercia mental»', min: 15,
        desc: 'Ahora aplícalo a ti. Abre la actividad individual, escribe con honestidad una creencia tuya sobre la educación que nunca habías examinado y regresa aquí: se marca sola cuando ya escribiste.' },

      { id: 'leccion6', tipo: 'leccion', ico: '🌽', titulo: 'Mini-lección de 6.1 y 6.2: el saber de la vida', min: 20,
        desc: 'Cinco tarjetas sobre el conocimiento ordinario, el conocimiento local y el diálogo de saberes.',
        tarjetas: [
          { k: '6.1 · Aproximaciones', t: 'Muchas maneras de conocer',
            texto: ['Conocemos de muchas formas, y casi siempre las combinamos:',
              '• **Experiencia directa:** sé cómo pica el habanero porque lo probé.\n• **Testimonio:** sé que existe la Antártida porque confío en quienes fueron.\n• **Razonamiento:** si los mamíferos tienen pulmones y la ballena es mamífero…\n• **Investigación sistemática:** miles de estudios muestran que el tabaco causa cáncer.\n• **Práctica e intuición:** sé cuándo un grupo está por desbordarse.',
              'Ninguna es infalible. Incluso los científicos dependen del **testimonio**: nadie repite todos los experimentos de su disciplina.'],
            q: 'Sabes que el Sol está a unos 150 millones de km de la Tierra, aunque nunca lo has medido. ¿Por qué vía lo sabes?',
            ops: ['Por testimonio', 'Por experiencia directa', 'Por práctica e intuición'], c: 0,
            x: 'Confías en quienes lo midieron: es conocimiento por testimonio, como buena parte de lo que sabemos.' },
          { k: '6.1 · Polanyi', t: 'Sabemos más de lo que podemos decir',
            texto: ['**Michael Polanyi** (1966) lo llamó **conocimiento tácito**: reconoces la cara de un amigo entre miles, pero no sabes explicar cómo; andas en bicicleta, pero no puedes describir todos los ajustes de tu cuerpo.',
              'Todo conocimiento, incluso el científico, tiene una base tácita. Por eso la formación no se hace solo con libros: requiere aprender **junto a alguien que ya sabe**, como en los talleres artesanales.'],
            ej: 'Un buen maestro «sabe» cuándo insistir y cuándo dejar pasar algo, aunque no lo encuentres en ningún manual.',
            q: '¿Qué ejemplo describe mejor el conocimiento tácito?',
            ops: ['Una maestra con años de experiencia nota que algo pasa en casa de un alumno, pero no sabe explicar cómo lo notó', 'Un alumno memoriza la definición de conocimiento tácito', 'Un investigador publica sus resultados en una revista'], c: 0,
            x: 'Es un saber que se tiene y se usa, pero que no se puede poner completo en palabras.' },
          { k: '6.2 · Conocimiento ordinario y local', t: 'El saber de la comunidad',
            texto: ['El **conocimiento ordinario** (sentido común) es práctico, compartido, poco sistemático, poco crítico y **contextual**: funciona bien en su lugar, pero puede fallar fuera de él.',
              'El **conocimiento local** es el que una comunidad construye durante generaciones con su territorio. En México hay ejemplos extraordinarios: la **milpa** (el frijol aporta nitrógeno, el maíz lo sostiene, la calabaza guarda la humedad), la **nixtamalización**, la **herbolaria**, el saber de los **pescadores** del Golfo.'],
            ej: 'Los milperos mayas sabían que el frijol «alimenta la tierra» siglos antes de que la química explicara el ciclo del nitrógeno.',
            q: '¿Qué característica del conocimiento ordinario explica que un remedio funcione en un pueblo pero falle en otro lugar?',
            ops: ['Que es contextual', 'Que es compartido', 'Que es sistemático'], c: 0,
            x: 'El sentido común funciona bien en su contexto, pero puede fallar fuera de él. (Además, no es sistemático.)' },
          { k: '6.2 · Sousa Santos', t: 'La ecología de saberes',
            texto: ['**Boaventura de Sousa Santos** (2009) habla de **epistemologías del Sur**: los saberes de los pueblos colonizados, que fueron despreciados o destruidos. A esa destrucción la llama **epistemicidio**.',
              'Su propuesta es una **ecología de saberes**: la ciencia es muy valiosa, pero **no es el único** saber; distintos saberes pueden dialogar según el problema. Para llegar a la Luna se necesita la ciencia; para cuidar la biodiversidad de un territorio, quizá también el saber de quienes lo habitan desde hace siglos.',
              'La Nueva Escuela Mexicana retoma esta idea al pedir que se reconozcan los **saberes comunitarios**.'],
            video: { id: 'cPa7NLHJOgg', pie: '«El sistema epistemicida y la ecología de saberes (Fácil)». Opcional.' },
            q: '¿Qué es el «epistemicidio» para Sousa Santos?',
            ops: ['La destrucción o el desprecio de los saberes de pueblos colonizados', 'La muerte de una teoría científica cuando la refutan', 'El rechazo de los alumnos a la ciencia'], c: 0,
            x: 'Es la destrucción de formas de conocimiento de los pueblos colonizados; la ecología de saberes busca lo contrario: que dialoguen.' },
          { k: '6.2 · Dos riesgos', t: 'Ni cientificismo ni relativismo ingenuo',
            texto: ['El diálogo de saberes tiene dos trampas opuestas:',
              '• **Cientificismo:** creer que solo la ciencia produce conocimiento válido y despreciar todo lo demás. Desconecta la escuela de la vida.\n• **Relativismo ingenuo:** creer que todos los saberes valen lo mismo para todo, como si diera igual un antibiótico que un remedio sin eficacia comprobada.',
              'Dialogar no es decir que todo vale igual: cada saber se valora por lo que **responde bien en su contexto**, y las diferencias se discuten con respeto y con argumentos.'],
            ej: 'En una telesecundaria de Campeche, los abuelos explican la milpa, los alumnos investigan el nitrógeno y hacen un cartel en maya y español. Los dos saberes se enriquecen.',
            q: '«En la clase de salud no hace falta hablar de vacunas: los tés de la abuela curan igual». ¿Qué error es?',
            ops: ['Relativismo ingenuo', 'Cientificismo', 'Ecología de saberes'], c: 0,
            x: 'Pone todos los saberes al mismo nivel para todo, incluso donde hay evidencia de que no valen lo mismo.' },
        ] },

      { id: 'saberes', tipo: 'cuadro', act: 'saberes', ico: '🌽', titulo: 'En equipo: «Saberes de la vida»', min: 20,
        desc: 'El cuadro de su equipo es en vivo: cada quien escribe desde su casa y todos ven lo que escriben los demás. Pónganse de acuerdo por su grupo de mensajes y repártanse las filas. <b>Ojo:</b> quien no escriba nada en el cuadro sale con cero en esa tarea. Se marca sola cuando ya escribiste algo.' },

      { id: 'salida', tipo: 'salida', ico: '🚪', titulo: 'Boleto de salida', min: 10,
        desc: `Tres preguntas para cerrar la clase. Contesta con tus palabras, al menos ${MIN_SALIDA} palabras cada una. Al terminar, entrega tu clase.`,
        preguntas: [
          ['p1', 'Con tus palabras: ¿qué es un obstáculo epistemológico? ¿Cuál de los cinco ves más en la escuela? Da un ejemplo.'],
          ['p2', 'Si aceptamos que la observación está cargada de teoría, ¿qué cambia cuando un maestro investiga a su propio grupo?'],
          ['p3', 'Propón un ejemplo de diálogo de saberes para un aula de Campeche y explica cómo evitarías caer en el cientificismo o en el relativismo ingenuo.'],
        ] },
    ],
    bitacora: { id: 'conferencia', ico: '🎤', titulo: 'Bitácora de la conferencia', extra: true,
      desc: 'Hazla el mismo día de la conferencia, mientras la tienes fresca. Cuenta como <b>participación</b>. Se abre desde ahora, no necesitas terminar las otras estaciones.',
      campos: [
        ['tema', 'Título o tema de la conferencia y quién la dio', 'Ej.: «La inclusión en el aula», Mtra. …'],
        ['idea', 'Una idea que te llevaste, con tus palabras', '¿Qué dijo que te pareció importante o te hizo pensar?'],
        ['autor', 'Relaciónala con un autor o concepto del curso', 'Ej.: Bachelard (obstáculos), Kuhn (paradigma), Freire (diálogo), Polanyi (saber tácito)… ¿Por qué se relacionan?'],
        ['tipo', '¿Desde qué tipo de conocimiento habló?', '¿Científico (estudios, datos), ordinario o local (experiencia, comunidad), tácito (su práctica)? Justifica.'],
        ['pregunta', 'Una pregunta que le harías al ponente', 'Una pregunta de verdad, que te interese.'],
      ] },
  },
};

// Calificación sugerida (sobre 10): 6 puntos por las estaciones terminadas (una cada una),
// 1 por las tarjetas acertadas al primer intento y 3 por el boleto de salida (uno por respuesta completa).
export function sugerirRuta(R, S) {
  S = S || {};
  const est = R.estaciones, hechas = est.filter(e => (S.hechas || {})[e.id]).length;
  const tarjetas = est.filter(e => e.tipo === 'leccion').flatMap(e => e.tarjetas.map((_, i) => `${e.id}_${i}`));
  const primera = tarjetas.filter(k => { const c = (S.checks || {})[k]; return c && c.ok && (c.intentos || 1) === 1; }).length;
  const sal = est.find(e => e.tipo === 'salida'), resp = sal ? sal.preguntas.filter(([k]) => palabras((S.salida || {})[k]) >= MIN_SALIDA).length : 0;
  const nota = 6 * hechas / est.length + (tarjetas.length ? primera / tarjetas.length : 0) + (sal ? 3 * resp / sal.preguntas.length : 0);
  return { nota: r1(nota), hechas, total: est.length, primera, tarjetas: tarjetas.length, resp, preguntas: sal ? sal.preguntas.length : 0,
    detalle: `${hechas}/${est.length} estaciones · ${primera}/${tarjetas.length} tarjetas al primer intento · salida ${resp}/${sal ? sal.preguntas.length : 0}` };
}
export const bitacoraCompleta = (R, S) => { const B = (S && S.bitacora) || {}; return R.bitacora.campos.every(([k]) => palabras(B[k]) >= (k === 'tema' ? 2 : MIN_BITACORA)); };
export const bitacoraAvance = (R, S) => { const B = (S && S.bitacora) || {}; return R.bitacora.campos.filter(([k]) => palabras(B[k]) >= (k === 'tema' ? 2 : MIN_BITACORA)).length; };
