import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Paciente, Configuracion } from '../types';
import { getLogoApp } from '../store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Printer, X } from 'lucide-react';

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type TipoConsentimiento =
  | 'extraccion' | 'extraccion_compleja' | 'implantes' | 'periodoncia'
  | 'endodoncia' | 'protesis_fija' | 'protesis_completa' | 'protesis_parcial'
  | 'biopsia' | 'odontopediatria' | 'ortopedia' | 'discapacidad'
  | 'sedoanalgesia' | 'imagenes_60' | 'covid19' | 'general';

export const CONSENTIMIENTOS: Record<TipoConsentimiento, { label: string; titulo: string }> = {
  extraccion:         { label: 'Extracción',                titulo: 'CONSENTIMIENTO INFORMADO EXTRACCIÓN' },
  extraccion_compleja:{ label: 'Extracción compleja / Cirugía', titulo: 'CONSENTIMIENTO INFORMADO EXTRACCIÓN COMPLEJA / CIRUGÍA' },
  implantes:          { label: 'Implantes',                 titulo: 'CONSENTIMIENTO INFORMADO IMPLANTES' },
  periodoncia:        { label: 'Periodoncia',               titulo: 'CONSENTIMIENTO INFORMADO DE PERIODONCIA' },
  endodoncia:         { label: 'Tratamiento de conducto',   titulo: 'CONSENTIMIENTO INFORMADO TRATAMIENTO DE CONDUCTO' },
  protesis_fija:      { label: 'Prótesis fija',             titulo: 'CONSENTIMIENTO INFORMADO PRÓTESIS FIJA' },
  protesis_completa:  { label: 'Prótesis completa',         titulo: 'CONSENTIMIENTO INFORMADO PRÓTESIS COMPLETA' },
  protesis_parcial:   { label: 'Prótesis parcial removible',titulo: 'CONSENTIMIENTO INFORMADO PRÓTESIS PARCIAL REMOVIBLE' },
  biopsia:            { label: 'Biopsia',                   titulo: 'CONSENTIMIENTO INFORMADO BIOPSIA' },
  odontopediatria:    { label: 'Odontopediatría',           titulo: 'CONSENTIMIENTO INFORMADO ODONTOPEDIATRIA' },
  ortopedia:          { label: 'Ortopedia / Ortodoncia',    titulo: 'CONSENTIMIENTO INFORMADO PARA TRATAMIENTOS ORTOPÉDICOS' },
  discapacidad:       { label: 'Paciente con discapacidad', titulo: 'CONSENTIMIENTO INFORMADO PARA ATENCIÓN ODONTOLÓGICA DE PACIENTES CON DISCAPACIDAD' },
  sedoanalgesia:      { label: 'Sedoanalgesia',             titulo: 'CONSENTIMIENTO INFORMADO PARA ATENCIÓN ODONTOLÓGICA BAJO CUIDADOS ANESTÉSICOS MONITOREADOS' },
  imagenes_60:        { label: 'Toma de imágenes',          titulo: 'CONSENTIMIENTO INFORMADO PARA LA TOMA DE IMÁGENES Y DIFUSIÓN' },
  covid19:            { label: 'COVID-19',                  titulo: 'CONSENTIMIENTO BÁSICO ATENCIÓN ODONTOLÓGICA - COVID-19' },
  general:            { label: 'General',                   titulo: 'CONSENTIMIENTO INFORMADO PARA TRATAMIENTO ODONTOLÓGICO' },
};

export const TEXTO_ANEXO_ODONTOPEDIATRIA: string[] = [];

// ── Bloques de texto estructurado ─────────────────────────────────────────────

type Block =
  | { t: 'p'; s: string }
  | { t: 'h'; s: string }
  | { t: 'ul'; items: string[] }
  | { t: 'blank'; label: string; value?: string }
  | { t: 'i'; s: string };

function getBlocks(
  tipo: TipoConsentimiento,
  paciente: Paciente,
  config: Configuracion,
  opts: { tutor: string; relacion: string; lugar: string; fecha: string; diente: string; notas: string }
): Block[] {
  const nombrePaciente = `${paciente.nombre} ${paciente.apellido}`;
  const dni = paciente.dni || '_______________';
  const mp = config.recetario?.matricula || '___________';
  const dr = `Dr./a. ${config.nombreProfesional} M.P. ${mp}`;
  const fechaStr = opts.fecha
    ? new Date(opts.fecha + 'T12:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '_____ de _________________ de _______';

  switch (tipo) {

    case 'extraccion':
    case 'extraccion_compleja':
      return [
        { t: 'p', s: `Usted tiene derecho a conocer el procedimiento al que va a ser sometido y las complicaciones más frecuentes que ocurren. Este documento intenta explicarle todas estas cuestiones, léalo atentamente y consulte todas las dudas que se le planteen. Le recordamos que por imperativo legal, tendrá que firmar, usted o su representante legal, el consentimiento informado para que pueda realizarle el procedimiento descripto a continuación.` },
        { t: 'p', s: `A propósito declaro haber sido informado y haber comprendido acabadamente la conveniencia y el objetivo de la/s extracción del/los elemento/s _______________________________________________ y las consecuencias de no llevar a cabo dicho tratamiento, devolviendo la salud bucal al paciente.` },
        { t: 'h', s: 'Tratamientos Alternativos: (Riesgos, Beneficios y Perjuicios):' },
        { t: 'blank', label: '' },
        { t: 'p', s: `Declaro que mi odontólogo ha examinado mi boca debidamente. Que se me ha explicado otras alternativas a este tratamiento, que se han estudiado y considerado estos métodos que se me informaron, siendo mi voluntad que se me realice el tratamiento objeto del presente consentimiento.` },
        { t: 'h', s: 'Riesgos, molestias y efectos adversos previsibles' },
        { t: 'ul', items: [
          'Molestias postoperatorias que puedan durar desde unas horas hasta varios días y para lo cual se administrará medicación en caso de ser necesario.',
          'Tumefacción (Hinchazón) post-operatorio del área gingival en la vecindad del diente extraído o tumefacción (hinchazón) facial, las cuales pueden persistir durante varios días.',
          'Infección y dolor.',
          'Trismus (limitación de la apertura de la boca), que usualmente dura algunos días pero puede persistir durante un período más prolongado.',
          'Posibilidad de producirse comunicación Bucosinusal (comunicación entre la cavidad bucal y el seno maxilar que es una cavidad que integra parte de las vías respiratorias).',
          'Parestesia (pérdida de la sensibilidad).',
          'Alveolitis (infección y dolor del sitio vacío dejado posterior a la extracción, para lo cual deberá regresar a la consulta y realizar el tratamiento correspondiente).',
          'Fractura del elemento y/o del hueso.',
          'Hemorragia (sangrado abundante).',
        ]},
        { t: 'h', s: 'Riesgos Personalizados' },
        { t: 'p', s: `Además de los riesgos antes descriptos, por mis circunstancias especiales hay que esperar los siguientes riesgos:` },
        { t: 'blank', label: '' },
        { t: 'h', s: 'Indicaciones' },
        { t: 'ul', items: [
          'La gasa protectora de la herida colocada por el profesional, retirarla al cabo de 1 hora de finalizada la intervención.',
          'Si le sangra en horas durante las cuales no pudiera concurrir al consultorio, haga un bollo de gasa esterilizada del tamaño de una nuez y aplíquela sobre la herida apretando fuertemente sobre los dientes opuestos.',
          'Guardar reposo por algunas horas. En caso de recostarse, hacerlo con la cabeza en alto. Puede colocar frío de manera intermitente durante 15 minutos con 15 minutos de descanso, no más de 2 o 3 veces.',
          'No fumar.',
          'No ingerir alimentos calientes, solo fríos o tibios (flan, yogurt, helado, gelatina, compota, entre otros).',
          'No realizar succión (no tomar mate, no usar sorbete). Puede disolver el coágulo sanguíneo y producir hemorragias o infecciones.',
          'No realizar enjuagatorios o buches.',
          'No realizar esfuerzo físico, ni permanecer expuesto a fuentes de calor (sol, estufas, hornos, plancha).',
          'No ingerir alimentos que presenten semillas pequeñas (tomate, kiwi, uva).',
          'No masticar del lado donde se realizó la extracción.',
          'No tocarse la zona con la mano.',
          'No realizar movimientos que impliquen el descenso brusco de la cabeza.',
        ]},
        { t: 'h', s: 'Medicación Indicada' },
        { t: 'blank', label: 'Pre quirúrgico:' },
        { t: 'blank', label: 'Pos quirúrgico:' },
        { t: 'h', s: 'Consecuencias de la no realización del procedimiento propuesto' },
        { t: 'p', s: `Usted puede padecer focos infecciosos, infección de otros órganos (corazón, riñón), quistes, tumores, pérdida de hueso, afección de elementos dentarios vecinos, sinusitis odontogénicas, problemas masticatorios, fonéticos y estéticos.` },
        { t: 'i', s: `Todas mis dudas han sido aclaradas y estoy completamente de acuerdo con lo consignado en esta fórmula de consentimiento. Si al momento de la intervención surgiera una situación anátomo-patológica distinta y más grave a la prevista, doy mi consentimiento para que se actúe del modo más conocido, según la ciencia y conciencia respecto a lo programado, por el exclusivo interés de mi salud. Asimismo, doy consentimiento para la administración de anestesia local que se aplicará para la realización de dicho tratamiento, delegando al odontólogo el tipo de anestesia, y me comprometo a regresar a la próxima consulta.` },
        { t: 'p', s: `El/la que suscribe ${nombrePaciente}, DNI N° ${dni}, con domicilio en calle _______________________________________________ otorgo mi consentimiento para que se me realice la/las extracción/es del/los elemento/s _______________ propuesto por ${dr}.` },
      ];

    case 'implantes':
      return [
        { t: 'p', s: `Por la presente se hace saber a Usted que tiene derecho a conocer el procedimiento al que va a ser sometido y las complicaciones más frecuentes que ocurren. Este documento explica todas estas cuestiones, léalo atentamente y consulte todas las dudas que se le planteen. Le recordamos que por imperativo legal, tendrá que firmar el consentimiento informado para que pueda realizarse dicho procedimiento.` },
        { t: 'p', s: `A propósito declaro haber sido informado y haber comprendido acabadamente el objetivo del tratamiento a realizar.` },
        { t: 'p', s: `Yo, ${nombrePaciente}, DNI ${dni}, domiciliado/a en _______________________________________________, he sido informado/a por el/la ${dr} de los procedimientos propios clínicos. Declaro que he sido debidamente informado y comprendo el objetivo y la naturaleza de la cirugía con implantes. Se me ha explicado y consiento en emplear un procedimiento quirúrgico para colocar los implantes por debajo de la encía y dentro del hueso, con el objetivo de reponer dientes con estabilidad similar o incluso superior a la de los naturales perdidos, obtener un anclaje para las prótesis dentales móviles, conseguir que el hueso de los maxilares mantenga su función y no pierda volumen por reabsorción, siendo de mi absoluta responsabilidad obedecer, cumpliendo los controles indicados por el profesional.` },
        { t: 'p', s: `Declaro que mi odontólogo ha examinado mi boca debidamente. Que se me ha explicado otras alternativas a este tratamiento, con prótesis convencionales (fijas y removibles), incluso de menor costo, y que se ha estudiado y considerado estos métodos que se me informaron, siendo mi voluntad que me coloquen implantes para reemplazar las piezas que he perdido o deseo sustituir.` },
        { t: 'p', s: `Declaro, además, que he sido informado de los riesgos y complicaciones posibles involucradas con el procedimiento quirúrgico, medicación y anestesia. Tales complicaciones incluyen: dolor, inflamación, infección y decoloraciones. Que puedo sufrir una insensibilidad de: labios, lengua, barbilla, mejillas y dientes. Que no existe tiempo exacto que durará esta sensación en caso de complicación, que no puede ser determinado y quizás sea irreversible según los casos y seriedad del problema. Que puede surgir también inflamación o daño del tejido de la zona (diente, hueso, mucosa), fractura ósea, penetración en el seno maxilar y piso de fosas nasales, cicatrización retardada, reacciones alérgicas a medicación, drogas o materiales empleados en la técnica quirúrgica, falla en la óseo-integración del implante que obligará a un re-tratamiento.` },
        { t: 'p', s: `Comprendo y entiendo que si no se me realiza un tratamiento odontológico, podría sufrir cualquiera de los siguientes problemas: enfermedad ósea, inflamación de las encías, infección, sensibilidad, movilidad de los dientes seguida por la necesidad de realizar la extracción. También es posible que pueda sufrir problemas de la unión témporomandibular (mandíbula), dolores de cabeza, dolores en la parte posterior del cuello y músculos faciales y cansancio de los músculos al masticar.` },
        { t: 'h', s: 'Especificación de tratamiento alternativo (riesgos, beneficios y perjuicios):' },
        { t: 'blank', label: '' },
        { t: 'p', s: `Declaro que se me ha explicado que no existe un método que pueda predecir con certeza la capacidad de cicatrización del hueso, de las encías y que es diferente en cada paciente, tras la colocación de implantes.` },
        { t: 'p', s: `Declaro que se me ha explicado que en algunos casos los implantes pueden fallar y deben ser retirados. Que se me ha informado y entiendo que las prácticas odontológicas no son una ciencia exacta; por lo tanto no se puede ofrecer garantías o seguridades sobre el resultado final del tratamiento o cirugía.` },
        { t: 'p', s: `Declaro que se me ha informado de la inconveniencia de fumar, de beber alcohol o tomar demasiada azúcar, para la cicatrización de las encías y tales hábitos ponen en compromiso el éxito del implante. Estoy plenamente de acuerdo con las instrucciones que me ha dado el odontólogo sobre el cuidado que debo realizar yo personalmente, en relación a la higiene de mi boca y he comprendido la manera de hacerlo. Me comprometo a acudir a la consulta de mi odontólogo con el fin de ser examinado e instruido, tal como él me lo indique.` },
        { t: 'p', s: `Estoy de acuerdo con ser sometido a anestesia local, sabiendo los riesgos que ello implica, delegando al odontólogo la elección del tipo de anestesia.` },
        { t: 'p', s: `Entiendo perfectamente que, durante y a continuación del procedimiento previsto, cirugía o tratamiento, pueden surgir condiciones que, según el criterio del profesional, requiera un plan de tratamiento complementario/alternativo, relacionado directamente con el éxito del tratamiento. También apruebo cualquier modificación en diseño, materiales o mantenimiento, si se considera que es para mi beneficio.` },
        { t: 'p', s: `Declaro que he sido informado que las complicaciones de oseointegración referidas a la colocación de implantes y de los riesgos de someterlos a movilidad posterior a su inserción y que se deberán respetar los controles odontológicos posteriores, extremándose en caso de existir prótesis.` },
        { t: 'p', s: `Me comprometo a tomar todos los cuidados y recaudos necesarios; a cumplir con la medicación estipulada, sin incorporar modificación alguna; asistir a los controles estipulados y a informar de inmediato al odontólogo responsable cualquier sintomatología que aparezca, a fin de tratarla precozmente.` },
        { t: 'i', s: `Confirmo que he leído y comprendido todo el escrito precedente y que el facultativo y su equipo me han explicado todo el acto quirúrgico y me han permitido realizar todas las preguntas necesarias, dándome respuestas a mis inquietudes, en un lenguaje claro y sencillo.` },
      ];

    case 'periodoncia':
      return [
        { t: 'blank', label: 'DIAGNÓSTICO:' },
        { t: 'p', s: `Usted tiene derecho a conocer el procedimiento al que va a ser sometido, y las complicaciones más frecuentes que ocurren. Este documento intenta explicarle todas estas cuestiones, léalo atentamente y consulte todas las dudas que se le planteen. Le recordamos que por imperativo legal, tendrá que firmar, usted o su representante legal, el consentimiento informado para que pueda realizarle dicho procedimiento.` },
        { t: 'p', s: `A propósito declaro haber sido informado y haber comprendido acabadamente el objeto del tratamiento que es la eliminación de los factores irritativos e infecciosos presentes en los tejidos que rodean al diente y/o implante (encía, hueso alveolar, ligamento periodontal, cemento radicular, superficie del implante), para conseguir el mantenimiento de los mismos en el tiempo, función y estética, evitando movilidad, pérdida de hueso y caída de los mismos.` },
        { t: 'p', s: `El tratamiento propuesto consiste en la eliminación de placa y cálculo (sarro) con curetas o ultrasonido (instrumentos afilados para el raspaje), en la cantidad de sesiones necesarias según el caso clínico y de ser necesario la cirugía de encía a colgajo para eliminar las bolsas infecciosas, agregado o reducción de tejido blando (injerto o gingivectomía), o aumentar el volumen de encía y tratar los defectos óseos. Estos procedimientos persiguen detener el avance de la enfermedad y limitar los daños generados, debiendo con control periódico y supervisión profesional mantener los resultados obtenidos en el tiempo.` },
        { t: 'p', s: `Estoy de acuerdo con ser sometido a anestesia local, sabiendo los riesgos que ello implica, delegando al odontólogo la elección del tipo de anestesia.` },
        { t: 'p', s: `En caso de ser necesario se podrá utilizar biomateriales como complemento al tratamiento.` },
        { t: 'p', s: `El beneficio al realizar el tratamiento periodontal es desarrollar un medio ambiente limpio en el cual las encías pueden cicatrizar; reducen las probabilidades de sufrir irritaciones e infecciones adicionales; le facilitan la limpieza de sus dientes; y disminuyen el costo de reemplazar los dientes perdidos a causa de la enfermedad periodontal, aumentar la posibilidad de retener sus dientes y su función; este plan de tratamiento ayudará a mejorar su estado de salud bucal y general (evitar el parto prematuro, evitar complicaciones en enfermedades sistémicas como diabetes, cardiopatías, entre otras) y evitar que la enfermedad se extienda.` },
        { t: 'h', s: 'Riesgos, molestias y efectos adversos' },
        { t: 'p', s: `Entiendo que mis encías pueden sangrar, inflamarse, o infectarse localmente, experimentar una molestia posterior al tratamiento. Si los problemas perduran durante más de unos pocos días me comunicaré con el odontólogo.` },
        { t: 'p', s: `Entiendo que mantener mi boca abierta durante el tratamiento puede hacer que mi mandíbula quede endurecida y adolorida temporalmente, y tal vez me sea difícil abrir bien la boca durante varios días.` },
        { t: 'p', s: `A medida que cicatriza el tejido de mi encía, el mismo puede encogerse un poco y dejar expuesta parte de la superficie de la raíz. Esto puede hacer que mis dientes se vuelvan más sensibles al calor o al frío y afectar el aspecto estético con la aparición de espacios entre los dientes lo cual puede generar atrapamiento de comida, aumentar la movilidad de los dientes y generar un aspecto de diente largo.` },
        { t: 'p', s: `Entiendo que dependiendo de mi condición dental actual, problemas de salud existentes, medicamentos que pueda estar tomando, predisposición genética o factores irritantes locales (tabaco, ortodoncia, prótesis mal adaptadas), estos métodos por sí solos tal vez no reviertan por completo los efectos de la enfermedad periodontal o prevengan problemas futuros.` },
        { t: 'p', s: `Como tratamiento alternativo a la periodoncia se puede considerar la exodoncia de la o las piezas afectadas, eliminando así los factores causales de la enfermedad, necesitando posteriormente la reposición de las piezas perdidas con prótesis fijas, removibles, implantes.` },
        { t: 'p', s: `Entiendo que si no se aplica ningún tratamiento, o el tratamiento comenzado es interrumpido o discontinuado, mi enfermedad periodontal puede continuar y probablemente empeorar. Esto puede causar una mayor inflamación e infección del tejido de la encía, caries por encima y por debajo del borde de la encía, deterioro del hueso que rodea el diente y finalmente, la pérdida de ciertos dientes, como así también afectar el estado de salud general.` },
        { t: 'i', s: `Entiendo que se harán todos los esfuerzos razonables para asegurar que mi afección sea tratada apropiadamente, pero no es posible garantizar resultados perfectos. Mediante mi firma más abajo, doy fe de que he recibido información adecuada sobre el tratamiento propuesto, de que entiendo dicha información, y de que todas mis preguntas han sido contestadas satisfactoriamente.` },
        { t: 'p', s: `El resultado del tratamiento depende en parte de que usted se comprometa a cepillarse los dientes y a usar el hilo dental después de cada comida, a recibir limpiezas según le sean indicadas, a seguir una dieta saludable, a evitar el tabaco y a cumplir con un plan de cuidado en el hogar que se le enseñará en este consultorio.` },
        { t: 'h', s: 'Indicaciones específicas:' },
        { t: 'blank', label: 'Medicación pre tratamiento:' },
        { t: 'blank', label: 'Medicación durante el tratamiento:' },
        { t: 'blank', label: 'Medicación pos tratamiento:' },
        { t: 'blank', label: 'Observaciones:' },
        { t: 'p', s: `El/la que suscribe ${nombrePaciente}, DNI N° ${dni}, con domicilio en calle _______________________________________________ otorgo mi consentimiento a la realización del tratamiento periodontal _______________________________________________ propuesta por el/la ${dr}.` },
      ];

    case 'endodoncia':
      return [
        { t: 'p', s: `El/la que suscribe ${nombrePaciente}, fecha de nacimiento _______________, DNI N° ${dni}, con domicilio _______________________________________________ otorgo mi consentimiento al tratamiento de conducto en el elemento N° ${opts.diente || '___'} propuesto por el/la ${dr}.` },
        { t: 'p', s: `A propósito declaro haber sido informado y haber comprendido acabadamente la conveniencia del Tratamiento de Conducto, proceso por el cual se remueve el nervio (pulpa dental) infectado, dañado o muerto del diente, como alternativa a la extracción de dicho elemento y las consecuencias de no llevar a cabo dicho tratamiento, así como las complicaciones que pueden asociarse con el tratamiento de conducto, las cuales incluyen (aunque no se limitan) a las siguientes:` },
        { t: 'ul', items: [
          'Molestias post-operatorias que pueden durar desde unas horas hasta varios días y para lo cual se administrará medicación en caso de ser necesario.',
          'Tumefacción post-operatorio del área gingival en la vecindad del diente tratado o tumefacción facial, las cuales pueden persistir durante varios días.',
          'Infección, para las cuales se indicará medicación.',
          'Trismus (limitación de la apertura de la boca), que usualmente dura algunos días pero puede persistir durante un período más prolongado.',
          'Fracaso del tratamiento. Si el tratamiento fracasa puede ser necesario un nuevo tratamiento, una intervención quirúrgica del extremo radicular (apicectomía), eliminación de la raíz afectada (radectomía) o la extracción del diente tratado.',
          'Ruptura de los instrumentos endodónticos en el interior del conducto durante el tratamiento. Doy mi consentimiento para que el profesional actúe del modo más conocido, dejar los restos en el conducto tratado o realizar una intervención quirúrgica con el fin de extraerlos, por el exclusivo interés de mi salud.',
          'La perforación del conducto radicular con instrumentos, lo que puede requerir un tratamiento correctivo quirúrgico adicional o traer como consecuencia la pérdida o extracción prematura del diente.',
          'Pérdida prematura del diente como consecuencia de enfermedad periodontal progresiva en el área circundante.',
          'El diente después de tratado endodónticamente está más expuesto a posibles fracturas por lo que debe ser restaurado adecuadamente entre 8 a 15 días de transcurrida la intervención endodóntica, aunque esto no garantice o prevenga las fracturas.',
        ]},
        { t: 'h', s: 'Indicaciones:' },
        { t: 'blank', label: '' },
        { t: 'h', s: 'Medicación Indicada:' },
        { t: 'blank', label: '' },
        { t: 'i', s: `Todas mis dudas han sido aclaradas y estoy completamente de acuerdo con lo consignado en esta fórmula de consentimiento. Si al momento de la intervención surgiera una situación anátomo-patológica distinta y más grave a la prevista, doy mi consentimiento para que se actúe del modo más conocido, según la ciencia y conciencia respecto a lo programado, por el exclusivo interés de mi salud. Asimismo, doy consentimiento para la administración de anestesia local que se aplicará para la realización de dicho tratamiento y me comprometo a regresar a la próxima consulta.` },
      ];

    case 'protesis_fija':
      return [
        { t: 'p', s: `Usted tiene derecho a conocer el procedimiento al que va a ser sometido y las complicaciones más frecuentes que ocurren. Este documento intenta explicarle todas estas cuestiones, léalo atentamente y consulte todas las dudas que se le planteen. Le recordamos que por imperativo legal, tendrá que firmar, usted o su representante legal, el consentimiento informado para que pueda realizarle el procedimiento descripto a continuación.` },
        { t: 'p', s: `A propósito declaro haber sido informado y haber comprendido acabadamente que el objeto del Tratamiento, es devolver la función, estética y fonética de la cavidad bucal a través de coronas (fundas) de diferentes materiales pudiendo o no necesitar colocar algunos aditamentos, como ser pernos (que se coloca en el interior del conducto del diente el cual previamente recibió el tratamiento de conducto correspondiente), o implantes (reemplazo de las raíces naturales), etc. cuyo destino es darle retención a la prótesis fija formada por las coronas.` },
        { t: 'p', s: `La prótesis fija proporciona una masticación similar a la natural y un habla adecuada aunque no permite cerrar los espacios que pudieran haberse creado entre los dientes cuando han menguado las encías y al hablar se puede escapar saliva o aire. Con el tiempo, el proceso de atrofia natural de los huesos maxilares y de las encías deja a la vista las uniones entre dientes y fundas, por lo que estéticamente puede necesitar reemplazo. Otras causas de sustitución pueden ser: lesiones irrecuperables (caries, fracturas, filtraciones marginales, cambios en los maxilares y en la posición de los dientes naturales), procesos inexorables del paso del tiempo y que se ven agravados por descuidos y falta de higiene.` },
        { t: 'p', s: `Para realizar un tratamiento de prótesis dental se me ha explicado la necesidad de tallar los dientes pilares de la prótesis fija, lo que puede conllevar la posibilidad de aproximación excesiva a la cámara pulpar (nervio) que nos obligaría a realizar un tratamiento de endodoncia y en algunos casos si el muñón queda frágil, se necesitará realizar un perno de fibra o colado (metálico).` },
        { t: 'p', s: `También se me ha explicado la necesidad de mantener una higiene escrupulosa y diaria para evitar el desarrollo de gingivitis y secundariamente enfermedad periodontal (que se manifiestan con inflamación de las encías, sangrado y a veces dolor).` },
        { t: 'p', s: `Se me ha aclarado que existe la posibilidad de fractura de cualquier componente de la prótesis, que implique la reparación, cambio total de la misma e incluso la pérdida de la pieza dentaria pilar.` },
        { t: 'h', s: 'Tratamiento alternativo: (Riesgo, Beneficios y Perjuicios):' },
        { t: 'blank', label: '' },
        { t: 'blank', label: 'Material convenido:' },
        { t: 'h', s: 'Riesgos' },
        { t: 'ul', items: [
          'Sensación de que los dientes artificiales son demasiado grandes o con diferencia en tamaño, forma y color con los naturales.',
          'La pronunciación de ciertos sonidos puede resultar un poco alterada.',
          'Es probable que se muerda fácilmente las mejillas y la lengua.',
          'Si se le ha cementado la prótesis provisionalmente: se le puede desprender o puede notar ligeras molestias en los dientes que sirven de sujeción, al consumir o ingerir bebidas o alimentos fríos, calientes y dulces.',
        ]},
        { t: 'p', s: `He leído las instrucciones de manejo, cuidado y mantenimiento y he comprendido todas las explicaciones que se me han facilitado en lenguaje claro y sencillo, he podido realizar todas las observaciones y se me han aclarado todas las dudas; por lo que estoy completamente de acuerdo con lo consignado en esta fórmula de consentimiento.` },
        { t: 'i', s: `Asimismo, entiendo que la colocación de la prótesis no constituye el acto final del tratamiento, sino que es necesario un proceso de adaptación que puede exigir retoques, por lo que me comprometo a regresar a la próxima consulta.` },
        { t: 'p', s: `El/la que suscribe ${nombrePaciente}, DNI N° ${dni}, con domicilio en calle _______________________________________________ otorgo mi consentimiento a la colocación de una prótesis fija en el/los elemento/s _______________ propuesta por el/la ${dr}.` },
      ];

    case 'protesis_completa':
      return [
        { t: 'p', s: `Usted tiene derecho a conocer el procedimiento al que va a ser sometido y las complicaciones más frecuentes que ocurren. Este documento intenta explicarle todas estas cuestiones, léalo atentamente y consulte todas las dudas que se le planteen. Le recordamos que por imperativo legal, tendrá que firmar, usted o su representante legal, el consentimiento informado para que pueda realizarle dicho procedimiento.` },
        { t: 'p', s: `A propósito declaro haber sido informado y haber comprendido acabadamente que el objeto del tratamiento es reemplazar los dientes naturales perdidos y rehabilitar la función estética y fonética de la cavidad bucal.` },
        { t: 'blank', label: 'Material Convenido:' },
        { t: 'h', s: 'Tratamiento alternativo: (Riesgo, Beneficios y Perjuicios):' },
        { t: 'blank', label: '' },
        { t: 'p', s: `Declaro que mi odontólogo ha examinado mi boca debidamente. Que se me ha explicado otras alternativas a este tratamiento, con prótesis convencionales (fija con implante dental como anclaje de distinto tipo de prótesis, con un costo mayor), y que se ha estudiado y considerado estos métodos que se me informaron, siendo mi voluntad que se me realice el tratamiento objeto del presente consentimiento.` },
        { t: 'h', s: 'Limitaciones:' },
        { t: 'p', s: `Al carecer de fijación mecánica al hueso, estos aparatos experimentan una cierta movilidad al comer, sobre todo el inferior. Una limitación estética derivada de esta inestabilidad es que, en prótesis completas, los dientes anteriores y superiores no siempre pueden montarse sobre los anteriores e inferiores, según las indicaciones técnicas y mecánicas derivadas de la confección de prótesis removible, en muchas ocasiones no será posible la reproducción de la posición de los dientes naturales. La duración de la prótesis removible es limitada por lo que deberá renovarse periódicamente.` },
        { t: 'h', s: 'Riesgos Típicos' },
        { t: 'ul', items: [
          'Sensación extraña de ocupación.',
          'Más producción de saliva de lo normal.',
          'Disminución del sentido del gusto.',
          'Dificultades de pronunciación de ciertos sonidos.',
          'Es probable que se muerda fácilmente en las mejillas o lengua.',
          'Algunas molestias (dolor, inflamación, ulceración) en las zonas donde apoyan las prótesis, sobretodo a la altura de los bordes.',
          'Probablemente se muevan mucho al comer, al menos inicialmente, por lo que deberá masticar de los dos lados.',
        ]},
        { t: 'h', s: 'Consecuencias de la no realización del tratamiento' },
        { t: 'ul', items: [
          'Reabsorción ósea (del hueso del maxilar y de la mandíbula).',
          'Problemas articulares y de oclusión.',
          'Problemas en la digestión.',
          'Alteración de la fonación y estética.',
        ]},
        { t: 'h', s: 'Indicaciones' },
        { t: 'ul', items: [
          'Lavar la prótesis y la boca después de cada comida, para evitar la formación de sarro.',
          'Quitarse la prótesis para dormir, para que los tejidos descansen.',
          'Mientras la prótesis esté fuera de la boca conviene conservarla en agua para evitar golpes y deformaciones.',
          'Es aconsejable que se dé masajes en las encías para mejorar la circulación y prevenir en lo posible su reabsorción.',
          'Se debe realizar revisión cada seis meses para observar el estado de los dientes y mucosas.',
          'Acudir a una consulta inmediata siempre que aparezcan heridas, llagas, dolor o inestabilidad de la prótesis.',
        ]},
        { t: 'i', s: `He leído las instrucciones de manejo, cuidado y mantenimiento y he comprendido todas las explicaciones que se me han facilitado en lenguaje claro y sencillo, he podido realizar todas las observaciones y se me han aclarado todas las dudas; por lo que estoy completamente de acuerdo con lo consignado en esta fórmula de consentimiento. Asimismo, entiendo que la colocación de la prótesis no constituye el acto final del tratamiento, sino que es necesario un proceso de adaptación que puede exigir retoques.` },
        { t: 'p', s: `El/la que suscribe ${nombrePaciente}, DNI N° ${dni}, con domicilio en calle _______________________________________________ otorgo mi consentimiento a la colocación de una prótesis dental completa en el/los maxilar/es _______________ propuesta por el/la ${dr}.` },
      ];

    case 'protesis_parcial':
      return [
        { t: 'p', s: `Usted tiene derecho a conocer el procedimiento al que va a ser sometido y las complicaciones más frecuentes que ocurren. Este documento intenta explicarle todas estas cuestiones, léalo atentamente y consulte todas las dudas que se le planteen. Le recordamos que por imperativo legal, tendrá que firmar usted o su representante legal, el consentimiento informado para que pueda realizarle el procedimiento descripto a continuación.` },
        { t: 'p', s: `A propósito declaro haber sido informado y haber comprendido acabadamente que el objeto del tratamiento que es reponer dientes ausentes a través de aparatos portadores de dientes artificiales que se sujetan a los naturales mediante dispositivos no rígidos (ganchos) y a veces se asientan sobre el hueso cubierto de mucosa.` },
        { t: 'blank', label: 'Material Convenido:' },
        { t: 'h', s: 'Tratamiento alternativo: (Riesgo, Beneficios, Perjuicios):' },
        { t: 'blank', label: '' },
        { t: 'p', s: `Aclaro que mi Odontólogo ha examinado mi boca debidamente. Que se me ha explicado otras alternativas a este tratamiento y que se ha estudiado y considerado estos métodos que se me informaron, siendo mi voluntad que se me realice el tratamiento objeto del presente consentimiento.` },
        { t: 'h', s: 'Limitaciones:' },
        { t: 'p', s: `Al carecer de fijación mecánica al hueso, estos aparatos experimentan una cierta movilidad, más evidente al comer, sobre todo el inferior. Otra limitación es de carácter estético, debido a que según las indicaciones técnicas y mecánicas derivadas de la confección de prótesis removible, en muchas ocasiones no será posible la reproducción de la posición de los dientes naturales. La duración de la prótesis removible es limitada por lo que deberá renovarse periódicamente.` },
        { t: 'h', s: 'Riesgos típicos:' },
        { t: 'ul', items: [
          'Sensación extraña de ocupación.',
          'Más producción de saliva de lo normal.',
          'Disminución del sentido del gusto.',
          'Dificultades de pronunciación de ciertos sonidos.',
          'Es probable que se muerda fácilmente en las mejillas o lengua.',
          'Algunas molestias (dolor, inflamación, ulceración) en las zonas donde apoyan las prótesis.',
          'Probablemente se muevan al comer, al menos inicialmente, por lo que deberá masticar de los dos lados.',
          'De no mantener una conducta de higiene y limpieza, es probable que cambie de color.',
        ]},
        { t: 'h', s: 'Consecuencias de la no realización del tratamiento:' },
        { t: 'ul', items: [
          'Reabsorción ósea (pérdida del volumen del hueso de ambos maxilares).',
          'Problemas en la articulación de la mandíbula.',
          'Problemas en la digestión.',
          'Alteración en la pronunciación de las palabras y estética.',
          'Cambios en la mordida normal.',
          'Mayor movilidad de los dientes. Problemas de encía.',
          'Pérdida de los dientes presentes en boca.',
        ]},
        { t: 'h', s: 'Indicaciones' },
        { t: 'ul', items: [
          'Lavar la prótesis y la boca después de cada comida, para evitar la formación de sarro.',
          'Limpie las partes metálicas con un hisopo embebido en alcohol, hasta que la superficie quede brillante.',
          'Quitarse la prótesis para dormir, para que los tejidos descansen.',
          'Mientras la prótesis esté fuera de la boca conviene conservarla en agua para evitar golpes y deformaciones.',
          'Es aconsejable que se dé masajes en las encías para mejorar la circulación y prevenir en lo posible su reabsorción.',
          'Se debe realizar revisión cada seis meses.',
          'Acudir a una consulta inmediata siempre que aparezcan heridas, llagas, dolor o inestabilidad de la prótesis.',
        ]},
        { t: 'i', s: `He leído las instrucciones de manejo, cuidado y mantenimiento y he comprendido todas las explicaciones que se me han facilitado en lenguaje claro y sencillo, he podido realizar todas las observaciones y se me han aclarado todas las dudas; por lo que estoy completamente de acuerdo con lo consignado en esta fórmula de consentimiento. Asimismo, entiendo que la colocación de la prótesis no constituye el acto final del tratamiento, sino que es necesario un proceso de adaptación que puede exigir retoques.` },
        { t: 'p', s: `El/la que suscribe ${nombrePaciente}, DNI N° ${dni}, con domicilio en calle _______________________________________________ otorgo mi consentimiento a la colocación de una prótesis dental parcial removible en el/los maxilar/es _______________ propuesta por el/la ${dr}.` },
      ];

    case 'biopsia':
      return [
        { t: 'p', s: `Usted tiene derecho a conocer el procedimiento al que va a ser sometido y las complicaciones más frecuentes que ocurren. Este documento intenta explicarle todas estas cuestiones, léalo atentamente y consulte todas las dudas que se le planteen. Le recordamos que por imperativo legal, tendrá que firmar, usted o su representante legal, el consentimiento informado para que pueda realizarle el procedimiento descripto a continuación.` },
        { t: 'p', s: `A propósito declaro haber sido informado y haber comprendido acabadamente la conveniencia y el objetivo de la biopsia _______________________________________________ y las consecuencias de no llevar a cabo dicho procedimiento quirúrgico, que consiste en realizar una toma de material, para obtener muestras de un tejido vivo por punción o escisión de los tejidos involucrados para analizarla posteriormente. La muestra será analizada por un patólogo especialista lo cual nos brindará un diagnóstico de certeza.` },
        { t: 'p', s: `Este procedimiento está indicado para lesiones que no pueden ser diagnosticadas por otros métodos, como ayuda en evolución diagnóstica de enfermedades infecciosas, micóticas y bacterianas, para determinar el tipo de tumor, en lesiones con sospecha de cáncer, cualquier lesión de aspecto clínico compatible con ulcera, ulceración, erosión, ampolla, y que no muestre evidencia de curación en 5 a 10 días, nódulos de crecimiento rápido, lesiones negras, lesiones blancas, lesiones rojas, cualquier tejido eliminado quirúrgicamente o eliminado espontáneamente.` },
        { t: 'h', s: 'Tratamientos Alternativos: (Riesgos, Beneficios y Perjuicios):' },
        { t: 'blank', label: '' },
        { t: 'p', s: `Declaro que mi odontólogo ha examinado mi boca debidamente. Que se me ha explicado otras alternativas a este procedimiento, que se han estudiado y considerado estos métodos que se me informaron, siendo mi voluntad que se me realice el procedimiento objeto del presente consentimiento.` },
        { t: 'h', s: 'Riesgos, molestias y efectos adversos previsibles' },
        { t: 'ul', items: [
          'Molestias postoperatorias que puedan durar desde unas horas hasta varios días y para lo cual se administrará medicación en caso de ser necesario.',
          'Tumefacción (Hinchazón) post-operatorio del área.',
          'Infección y dolor.',
          'Trismus (limitación de la apertura de la boca), que usualmente dura algunos días pero puede persistir durante un período más prolongado.',
          'Parestesia (pérdida de la sensibilidad).',
          'Hemorragia (sangrado abundante).',
        ]},
        { t: 'h', s: 'Riesgos Personalizados' },
        { t: 'blank', label: '' },
        { t: 'h', s: 'Medicación Indicada' },
        { t: 'blank', label: 'Pre quirúrgico:' },
        { t: 'blank', label: 'Post quirúrgico:' },
        { t: 'h', s: 'Consecuencias de la no realización del procedimiento propuesto' },
        { t: 'p', s: `La no realización de la toma de material, implica no poder brindar un diagnóstico de certeza sobre la patología que usted padece, impidiendo como consecuencia brindar un tratamiento adecuado al caso.` },
        { t: 'i', s: `Todas mis dudas han sido aclaradas y estoy completamente de acuerdo con lo consignado en esta fórmula de consentimiento. Si al momento de la intervención surgiera una situación anátomo-patológica distinta y más grave a la prevista, doy mi consentimiento para que se actúe del modo más conocido, según la ciencia y conciencia respecto a lo programado, por el exclusivo interés de mi salud. Asimismo, doy consentimiento para la administración de anestesia local que se aplicará para la realización de dicho tratamiento, delegando al odontólogo el tipo de anestesia, y me comprometo a regresar a la próxima consulta.` },
        { t: 'p', s: `El/la que suscribe ${nombrePaciente}, DNI N° ${dni}, con domicilio en calle _______________________________________________ otorgo mi consentimiento para que se me realice la/las biopsia/s propuesta por el/la ${dr}.` },
      ];

    case 'odontopediatria':
      return [
        { t: 'p', s: `Por la presente se hace saber a Usted que tiene derecho a conocer el procedimiento al que va a ser sometido el menor de edad y las complicaciones más frecuentes que ocurren. Este documento explica todas estas cuestiones, léalo atentamente y consulte todas las dudas que se le planteen. Le recordamos que por imperativo legal, tendrá que firmar, el representante legal, el consentimiento informado para que pueda realizarse dicho procedimiento.` },
        { t: 'p', s: `Yo, ${opts.tutor || '_______________________________________'}, de ________ edad, DNI _______________, domiciliado/a en _______________________________________________, como representante legal de ${nombrePaciente}, DNI: ${dni}, he sido informado/a por el/la ${dr} de los procedimientos propios clínicos en odontopediatría, que constan en el plan de tratamiento, otorgando mi consentimiento para realizar las prácticas necesarias al caso clínico.` },
        { t: 'p', s: `Estoy de acuerdo a que el niño/a sea sometido/a a anestesia local en caso que fuera necesario, sabiendo los riesgos que ello implica, delegando al odontólogo la elección del tipo de anestesia.` },
        { t: 'p', s: `Se me ha explicado el diagnóstico, la naturaleza de la enfermedad que padece mi representado/a y su evolución natural, objetivos del tratamiento propuesto, así como las alternativas del tratamiento que pueden ser practicadas, descripción de las consecuencias derivadas del tratamiento o intervención, beneficios y complicaciones comunes que se pueden desencadenar durante o después del mismo, riesgos personales y entendiendo que ante alguna manifestación de complicaciones deberé acudir nuevamente al profesional tratante de mi representado/a.` },
        { t: 'blank', label: 'Diagnóstico:' },
        { t: 'blank', label: 'Tratamiento al que va a ser sometido el menor de edad:' },
        { t: 'blank', label: 'Tratamientos alternativos:' },
        { t: 'h', s: 'Riesgos y complicaciones esperados:' },
        { t: 'ul', items: [
          'Dolor.',
          'Inflamación.',
          'Infección.',
          'Fractura del elemento dentario por deterioro.',
          'Pulpitis (inflamación del nervio): determina que se le realice al paciente un tratamiento del nervio.',
          'Hematomas y hemorragias (sangrado - moretones).',
        ]},
        { t: 'blank', label: 'Beneficios esperados del tratamiento:' },
        { t: 'p', s: `Comprendo y entiendo que si no se realiza el tratamiento odontológico, podría sufrir cualquiera de los siguientes problemas: enfermedad ósea, inflamación de las encías, infección, sensibilidad, movilidad de los dientes seguida por la necesidad de realizar la extracción.` },
        { t: 'blank', label: 'Consecuencias de la no realización del tratamiento:' },
        { t: 'blank', label: 'Observaciones:' },
        { t: 'p', s: `Comprendo que la Odontopediatría es el área de la odontología que se encarga de restablecer la salud bucal integral de niños y adolescentes. Comprendo que la odontología no es una ciencia exacta y por lo que los resultados están sujetos a múltiples factores.` },
        { t: 'i', s: `He tenido información clara y suficiente, la oportunidad de preguntar y he obtenido respuestas satisfactorias, me siento libre para decidir de acuerdo a mis valores e intereses y me declaro competente para tomar la decisión que corresponda. Asimismo doy fe que mi representado/a fue oído/a y/o dio su asentimiento a realizar el tratamiento.` },
        { t: 'p', s: `Por lo antes expuesto doy el consentimiento al/la ${dr} a realizar el tratamiento antes expuesto al menor de edad o discapacitado/a ${nombrePaciente}, DNI: ${dni}, según lo antes expuesto.` },
      ];

    case 'ortopedia':
      return [
        { t: 'p', s: `La Ortopedia Dentomaxilofacial y funcional es la especialidad odontológica que incluye el diagnóstico, prevención, intercepción y corrección de la maloclusión y las funciones asociadas como las anormalidades neuromusculares y esqueléticas de las estructuras orofaciales durante el crecimiento, desarrollo y maduración. En una primera fase, el tratamiento ortopédico/funcional en la cual se utiliza aparatos removibles (de quitar y poner) o fijo si el caso lo amerita.` },
        { t: 'p', s: `Paciente: ${nombrePaciente}   Edad: _______   Fecha Nacimiento: _______________` },
        { t: 'p', s: `Responsable legal / Tutor: ${opts.tutor || '______________________________'}   DNI: _______________   Tel: _______________` },
        { t: 'p', s: `En este acto manifiesto que he recibido por parte del/la profesional ${dr} la información necesaria, clara, precisa, adecuada y completa respecto a:` },
        { t: 'ul', items: [
          'Diagnóstico del estado buco-dental actual y el pronóstico de la libre evolución. Me ha explicado que mi hijo/a presenta un problema en el tamaño y la posición de los maxilares que necesitan un tratamiento ortopédico.',
          'El tratamiento ortopédico propuesto con especificación de los objetivos perseguidos en las etapas estipuladas. Me ha explicado que generalmente después de esta primera fase de tratamiento en la cual se reducirá en gran medida la maloclusión que presenta el paciente, es posible que sea necesaria en una segunda fase la colocación de aparatos fijos (Brackets). También me ha explicado que el uso de estos aparatos puede producir úlceras o llagas.',
          'Los beneficios esperados del procedimiento propuesto en cada etapa. Además, me explicó que el tratamiento de ortopedia puede ser largo, que no depende ni de la técnica empleada ni de la correcta realización de la misma, ni de factores generalmente biológicos o de respuesta del organismo totalmente impredecibles y, por supuesto, sí depende del número de horas de uso del aparato así como de la colaboración y el cuidado del aparato por parte del niño/a y que durante todo ese tiempo se deben extremar las medidas de higiene de la boca, sus dientes y su aparato para evitar mayor exposición a la caries y a la enfermedad de las encías. Además, es imprescindible que se realicen los controles periódicos del paciente como indique el profesional.',
          'Los riesgos, molestias y efectos adversos previsibles, los que fueron explicados de manera verbal respondiendo a todas mis inquietudes y dudas al respecto; es frecuente que se produzca mayor sensibilidad en los dientes/muelas sobre las que se apoya el aparato, que normalmente desaparecerá de modo espontáneo.',
          'Las consecuencias previsibles de la no realización del procedimiento propuesto o de las alternativas posibles especificadas y el no cumplimiento de las indicaciones de cuidado/higiene/activación/manipulación, etc. de la aparatología instalada.',
        ]},
        { t: 'blank', label: 'TIPO DE TRATAMIENTO:' },
        { t: 'blank', label: 'TIPO DE APARATOLOGÍA:' },
        { t: 'p', s: `Conozco que estas acciones serán efectuadas mediante un plan de tratamiento individualizado siguiendo un protocolo establecido por el/los profesional/es del equipo de trabajo, altamente capacitados en ortopedia/ortodoncia.` },
        { t: 'i', s: `He leído y comprendido la información sobre la intervención que se realizará. Autorizo al profesional/les a realizar el tratamiento propuesto, en la fecha y hora de los turnos que me indiquen. Por la presente, también autorizo para el uso los registros de ortopedia, que incluyen fotografías tomadas en el proceso de los exámenes y tratamiento, con el propósito de docencia, investigación, educación y/o publicación científica.` },
        { t: 'h', s: 'EXPRESO mi CONSENTIMIENTO a que se efectúe el TRATAMIENTO DE ORTOPEDIA.' },
      ];

    case 'discapacidad':
      return [
        { t: 'p', s: `Córdoba, _____ de _______________ de ________` },
        { t: 'p', s: `Por medio de la presente, doy mi consentimiento para ser atendido/a por el/la ${dr} y aseguro que la información que suministre en cuanto a mis antecedentes y salud en general es real y fidedigna.` },
        { t: 'p', s: `Me han explicado de forma clara y suficiente, el diagnóstico odontológico, la naturaleza de la patología que padezco, la evolución natural, objetivo del tratamiento propuesto, así como las alternativas de tratamiento, beneficios, riesgos comunes y naturales del tratamiento (posibles complicaciones que se pueden desencadenar durante o después del mismo), riesgos personalizados (por presentar problemas de salud general que incidan sobre el tratamiento), o la no realización de los mismos y sus posibles consecuencias. Se me explicó que los pacientes con discapacidad por su misma condición pueden presentar mayor riesgo y complicaciones en el tratamiento odontológico.` },
        { t: 'p', s: `Acepto que debo realizar los exámenes pertinentes que se me indiquen, previos al tratamiento. Se pueden requerir interconsultas con otro/a especialista odontólogo/a o médico/a para minimizar los riesgos y lograr el propósito del tratamiento. Acepto la realización de radiografías, fotografías y otros medios de diagnóstico que sea necesario, garantizándome la confidencialidad, el resguardo de mi identidad y su utilización solo con fines académicos, de investigación y/o científicos.` },
        { t: 'p', s: `Entiendo que se evaluarán las alternativas de tratamiento y se optará por aquella que sea más adecuada y conveniente. Los tratamientos en algunas ocasiones, entiendo que no sean ideales, ya que es más importante la función y el estado de salud, lo que conllevará a tratamientos más ajustados a la realidad de la situación que se nos presente.` },
        { t: 'p', s: `Comprendo que la odontología no es una ciencia exacta y por lo tanto la garantía de los resultados está sujeta a múltiples factores.` },
        { t: 'p', s: `Confío en el buen juicio y las decisiones del profesional durante el tratamiento, buscando siempre el mayor beneficio, razón por la cual, si surgiese cualquier situación inesperada durante el tratamiento, autorizo al profesional a realizar el procedimiento o maniobra que estime oportuna para la resolución de dicha situación.` },
        { t: 'p', s: `Se me ha informado que me darán las explicaciones pre y postoperatorias, medicación ambulatoria, según sea el caso, las cuales me comprometo a cumplir. Me comprometo a acudir a las citas y controles cuando el odontólogo/a así me lo indique, así como mantener una higiene bucal adecuada y cumplir con las instrucciones dadas.` },
        { t: 'i', s: `Confirmo que me siento informado/a, comprendo la información, libre, sin coacción, ni manipulación, para decidir voluntariamente, con el tiempo suficiente para meditar o consultar la decisión con quien considere pertinente, de acuerdo con mis valores e intereses y me declaro competente para tomar las decisiones que correspondan.` },
        { t: 'h', s: 'En tal sentido DOY MI CONSENTIMIENTO AL PROFESIONAL A REALIZAR EL TRATAMIENTO PERTINENTE ___   o   NO CONSIENTO ___' },
        { t: 'p', s: `Nombre del Paciente: ${nombrePaciente}   DNI: ${dni}   Edad: _______` },
        { t: 'p', s: `Domicilio: _____________________________________________________________` },
        { t: 'p', s: `En caso que corresponda:\nNombre del representante legal/curador/acompañante: ${opts.tutor || '______________________________'}\nDNI: _______________   Relación con el paciente: ${opts.relacion || '_______________'}\nNombre del profesional: ${config.nombreProfesional}   M.P.: ${mp}` },
      ];

    case 'sedoanalgesia':
      return [
        { t: 'p', s: `PACIENTE: ${nombrePaciente}   Edad: _______   Fecha Nacimiento: _______________` },
        { t: 'p', s: `Responsable legal/Tutor: ${opts.tutor || '______________________________'}   DNI: _______________   Tel: _______________` },
        { t: 'p', s: `Por el presente se hace saber a Usted que tiene derecho a conocer el procedimiento al que va a ser sometido y las complicaciones más frecuentes que pudieran ocurrir. Este documento explica estas cuestiones muy importantes, léalo atentamente y consulte todas las dudas que se le planteen.` },
        { t: 'p', s: `La sedación consciente es una combinación de medicamentos para ayudarlo a relajarse (un sedante) y para bloquear el dolor (un anestésico) durante el procedimiento odontológico al que será sometido, bajo cuidados anestésicos monitorizados y realizado por un médico anestesista matriculado. Usted verá reducida su actividad motora y refleja y mínimos cambios cardiovasculares. Puede permanecer dormido pero no inconsciente.` },
        { t: 'blank', label: 'Anestesista actuante:   M.P.:   Póliza N°:' },
        { t: 'blank', label: 'Motivo por el cual se realizará este tipo de intervención:' },
        { t: 'blank', label: 'Farmacología a emplearse para la sedación:' },
        { t: 'blank', label: 'Lugar a realizarse la intervención:' },
        { t: 'blank', label: 'Diagnóstico odontológico:' },
        { t: 'blank', label: 'Tratamiento al que va a ser sometido el paciente:' },
        { t: 'blank', label: 'Tratamientos alternativos:' },
        { t: 'h', s: 'RIESGOS que pueden ocurrir durante la intervención' },
        { t: 'h', s: 'Generales / a nivel sistémico' },
        { t: 'ul', items: [
          'La medicación aplicada en la nariz puede causar ardor durante pocos segundos.',
          'Náuseas y vómitos.',
          'Reacciones en la piel del anestésico, picor o erupciones.',
          'Sueño profundo que en ocasiones puede provocar problemas respiratorios, haciendo preciso el uso de oxígeno u otras ayudas para respirar, durante un período de tiempo.',
          'Hipertensión arterial, inestabilidad o shock cardiovascular.',
          'Reacciones alérgicas, o individuales inesperadas a los medicamentos utilizados que en ocasiones pueden ser graves y llegar a la muerte, o dejar secuelas neurológicas.',
          'Laringoespasmo.',
          'Apnea.',
          'Broncoaspiración.',
          'Riesgos relacionados con circunstancias específicas del paciente.',
          'Cansancio pos intervención y/o somnolencia.',
          'Dolor de cabeza persistente.',
        ]},
        { t: 'h', s: 'Local / odontológico' },
        { t: 'ul', items: [
          'Molestias en las zonas tratadas por las intervenciones odontológicas, y/o anestesia local efectuada.',
          'Tumefacción (hinchazón) facial, las cuales pueden persistir durante varios días.',
          'Infección y dolor.',
          'Trismus (limitación de la apertura de la boca), que usualmente dura algunos días pero puede persistir durante un período más prolongado.',
          'Fractura del elemento dentario y/o del hueso maxilar.',
          'Hematomas o hemorragia (sangrado abundante).',
          'Sensibilidad dentaria.',
          'Otras dependiendo del tratamiento odontológico realizado.',
        ]},
        { t: 'blank', label: 'Consecuencias de la no realización del tratamiento:' },
        { t: 'blank', label: 'Observaciones:' },
        { t: 'i', s: `He tenido información clara y suficiente, la oportunidad de preguntar y he obtenido respuestas satisfactorias, de las ventajas e inconvenientes de la analgesia y sedación y de que en cualquier momento puedo revocar mi consentimiento, me siento libre para decidir de acuerdo a mis valores e intereses y me declaro competente para tomar la decisión que corresponda. He podido formular todas las preguntas que he creído oportunas. Asimismo doy fe que mi representado/a fue oído/a y/o dio su asentimiento a realizar el tratamiento.` },
        { t: 'p', s: `Por lo antes expuesto doy el consentimiento al/la ${dr} a realizar el tratamiento antes expuesto.` },
        { t: 'p', s: `El/la que suscribe ${nombrePaciente}, DNI: ${dni}, domicilio: _______________________________________________.` },
      ];

    case 'imagenes_60':
      return [
        { t: 'p', s: `A través del presente autorizo al/la ${dr} a tomar imágenes de mi cavidad bucal y/o región labial (tercio inferior facial), tanto antes, durante y luego de la finalización del tratamiento profesional que se me está realizando.` },
        { t: 'p', s: `Las imágenes, sean fotografías, radiografías, filmaciones de video o similares, podrán ser utilizadas por el/la ${dr} para documentar el seguimiento de los tratamientos, o con finalidades científicas, didácticas y/o académicas.` },
        { t: 'p', s: `La suscripción del presente consentimiento importa la autorización expresa al profesional no solo de la toma de las imágenes de referencia sino asimismo a su difusión por los siguientes medios y redes sociales: _______________________________________________` },
        { t: 'p', s: `Se deja expresa constancia que por razones de privacidad, el/la odontólogo/a no divulgará el rostro del paciente, su nombre completo ni ningún dato que permita identificarlo, salvo que el paciente lo solicite expresamente, lo cual deberá constar por escrito en este documento.` },
        { t: 'p', s: `El/la odontólogo/a ${config.nombreProfesional} será responsable de la custodia y seguridad de las imágenes, adoptando las medidas necesarias para garantizar la privacidad del paciente.` },
        { t: 'p', s: `Se deja constancia que el paciente no recibirá ninguna compensación o retribución económica por la autorización de toma de imágenes ni tendrá derecho alguno a reclamarla en el futuro, salvo convención en contrario que formulen por escrito las partes.` },
        { t: 'p', s: `Si el paciente se arrepintiera de la presente autorización, deberá notificar fehacientemente de tal situación dejando sin efecto la presente.` },
        { t: 'i', s: `La suscripción del presente por parte del paciente importa su consentimiento y aceptación expresa.` },
        { t: 'p', s: `ODONTÓLOGO/A: ${config.nombreProfesional}   M.P.: ${mp}` },
        { t: 'p', s: `PACIENTE: ${nombrePaciente}   DNI: ${dni}` },
        { t: 'p', s: `PADRE, MADRE O TUTOR (en caso de ser menor de edad): _______________________________________________` },
      ];

    case 'covid19':
      return [
        { t: 'p', s: `Odontólogo/a: ${config.nombreProfesional}   M.P.: ${mp}` },
        { t: 'p', s: `Nombre y Apellido del Paciente: ${nombrePaciente}   DNI: ${dni}` },
        { t: 'p', s: `Nombre y Apellido del Responsable (en caso de que corresponda): _______________________________________________` },
        { t: 'h', s: 'EL PRESENTE CUESTIONARIO DEBE SER CONTESTADO DE PUÑO Y LETRA Y FIRMADO POR PARTE DEL PACIENTE Y/O TUTOR RESPONSABLE.' },
        { t: 'p', s: `Usted tiene derecho a conocer el motivo por el cual se desarrolla el presente cuestionario. Este documento intenta explicarle todas estas cuestiones, léalo atentamente y consulte todas las dudas que se le planteen. Le recordamos que, por imperativo legal, tendrá que firmar, usted o su representante legal, el consentimiento informado para que pueda realizarle los procedimientos odontológicos a futuro. A propósito, declaro haber sido informado y haber comprendido acabadamente la conveniencia y el objetivo del presente cuestionario "CONSENTIMIENTO BÁSICO ATENCIÓN ODONTOLÓGICA COVID-19" y las consecuencias de no responder correctamente las preguntas indicadas. Este procedimiento está indicado para detectar potenciales casos sospechosos de COVID-19.` },
        { t: 'ul', items: [
          '¿TIENE FIEBRE O LA HA TENIDO EN LOS ÚLTIMOS 14 DÍAS?   SI ___ / NO ___',
          '¿HA TENIDO PROBLEMAS RESPIRATORIOS (INCLUYENDO TOS) EN LOS ÚLTIMOS 14 DÍAS?   SI ___ / NO ___',
          '¿HA VIAJADO A PAÍSES DE RIESGO EN LOS ÚLTIMOS 14 DÍAS?   SI ___ / NO ___',
          '¿HA ESTADO EN CONTACTO CON ALGUNA PERSONA CON CONFIRMACIÓN DE CORONAVIRUS?   SI ___ / NO ___',
          '¿HA ESTADO EN CONTACTO ESTRECHO CON PERSONAS QUE PRESENTABAN CUADRO RESPIRATORIO AGUDO EN LOS ÚLTIMOS 14 DÍAS?   SI ___ / NO ___',
        ]},
        { t: 'p', s: `En función del presente documento el profesional tomará la decisión clínica de atender el paciente, demorar el tratamiento odontológico en el supuesto que sea posible o derivarlo a un centro asistencial.` },
        { t: 'h', s: 'Esquema de decisión:' },
        { t: 'ul', items: [
          'Respuesta SI a algunas de las preguntas: 1) Demorar el tratamiento dental (salvo urgencias) 14 días. 2) Si el paciente presenta fiebre (temperatura mayor a 37,3°) debe concurrir de inmediato a un centro asistencial.',
          'Respuesta NO a todas las preguntas: 1) Si el paciente presenta fiebre (mayor a 37,3°), demorar el tratamiento dental (salvo urgencias) 14 días. 2) Si el paciente no presenta fiebre, realizar el tratamiento con las medidas de bioseguridad correspondientes.',
        ]},
      ];

    default: // general
      return [
        { t: 'p', s: `Por la presente, ${nombrePaciente} (DNI N° ${dni}) da su consentimiento para recibir tratamiento odontológico por parte del/la ${dr}.` },
        { t: 'p', s: `He recibido información clara y suficiente sobre el diagnóstico de mi situación bucodental, el tratamiento propuesto, sus objetivos, alternativas disponibles y los riesgos potenciales asociados. He tenido la oportunidad de realizar preguntas y han sido respondidas satisfactoriamente.` },
        { t: 'p', s: `Entiendo que el resultado del tratamiento puede verse afectado por factores individuales y que es fundamental el cumplimiento de las indicaciones postoperatorias y los controles periódicos indicados por el/la profesional.` },
        { t: 'i', s: `Estoy de acuerdo con ser sometido/a a anestesia local, sabiendo los riesgos que ello implica, delegando al odontólogo/a la elección del tipo de anestesia.` },
      ];
  }
}

// ── PrintView ─────────────────────────────────────────────────────────────────

function renderBlock(b: Block, i: number) {
  const baseP: React.CSSProperties = { margin: '0 0 6pt 0', textAlign: 'justify', overflowWrap: 'break-word' };
  switch (b.t) {
    case 'h': return (
      <p key={i} style={{ ...baseP, fontWeight: 'bold', marginTop: '8pt', marginBottom: '3pt' }}>{b.s}</p>
    );
    case 'p': return (
      <p key={i} style={baseP}>{b.s}</p>
    );
    case 'i': return (
      <p key={i} style={{ ...baseP, fontStyle: 'italic', border: '1px solid #999', padding: '5pt 8pt', marginTop: '6pt' }}>{b.s}</p>
    );
    case 'ul': return (
      <ul key={i} style={{ margin: '3pt 0 6pt 0', paddingLeft: '14pt', listStyleType: 'none' }}>
        {b.items.map((item, j) => (
          <li key={j} style={{ ...baseP, marginBottom: '3pt', paddingLeft: '6pt', textIndent: '-6pt' }}>
            <span style={{ marginRight: '4pt' }}>›</span>{item}
          </li>
        ))}
      </ul>
    );
    case 'blank': return (
      <div key={i} style={{ margin: '3pt 0 5pt 0', overflowWrap: 'break-word' }}>
        {b.label && <span style={{ fontWeight: 'bold' }}>{b.label} </span>}
        <span style={{ display: 'inline-block', borderBottom: '1px solid #555', minWidth: '120pt', width: b.label ? '55%' : '90%' }}>&nbsp;</span>
      </div>
    );
    default: return null;
  }
}

// ── Componente principal ──────────────────────────────────────────────────────

interface Props {
  paciente: Paciente;
  config: Configuracion;
  tipo: TipoConsentimiento;
  onClose: () => void;
}

export default function ConsentimientoInformado({ paciente, config, tipo, onClose }: Props) {
  const logoApp = getLogoApp();
  const meta = CONSENTIMIENTOS[tipo];
  const mp = config.recetario?.matricula || '___________';
  const domConsultorio = config.recetario?.domicilio || '';
  const telConsultorio = config.recetario?.telefonoConsultorio || '';

  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [lugar, setLugar] = useState('');
  const [tutor, setTutor] = useState('');
  const [relacion, setRelacion] = useState('padre/madre');
  const [diente, setDiente] = useState('');
  const [notas, setNotas] = useState('');

  const needsTutor = ['odontopediatria', 'discapacidad', 'sedoanalgesia'].includes(tipo);
  const needsDiente = tipo === 'endodoncia';

  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'ci-print-style';
    style.textContent = `
      #ci-print-root { display: none; }
      @media print {
        html, body {
          width: auto !important;
          min-width: 0 !important;
          max-width: none !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: visible !important;
        }
        body > *:not(#ci-print-root) { display: none !important; }
        #ci-print-root {
          display: block !important;
          box-sizing: border-box;
          width: 100%;
          max-width: 100%;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 10pt;
          line-height: 1.45;
          color: #000;
          overflow-wrap: break-word;
          word-break: break-word;
        }
        #ci-print-root * { box-sizing: border-box; max-width: 100%; }
        #ci-print-root img { max-width: 100%; height: auto; }
        @page { size: A4; margin: 18mm 20mm; }
      }
    `;
    document.head.appendChild(style);
    return () => document.getElementById('ci-print-style')?.remove();
  }, []);

  const opts = { tutor, relacion, lugar, fecha, diente, notas };
  const blocks = getBlocks(tipo, paciente, config, opts);

  const fechaStr = fecha
    ? new Date(fecha + 'T12:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '_____ de _________________ de _______';

  const printContent = (
    <div id="ci-print-root">
      {/* ── Membrete ── */}
      <div style={{ display: 'flex', alignItems: 'stretch', gap: '10pt', marginBottom: '10pt', borderBottom: '3pt solid #1a1a2e', paddingBottom: '8pt' }}>
        {/* Logo */}
        {logoApp && (
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
            <img src={logoApp} alt="Logo" style={{ height: '46pt', width: 'auto', objectFit: 'contain' }} />
          </div>
        )}
        {/* Datos profesional */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1.5pt' }}>
          <div style={{ fontWeight: 800, fontSize: '12pt', letterSpacing: '-0.01em', color: '#1a1a2e' }}>{config.nombreProfesional}</div>
          {config.especialidad && <div style={{ fontSize: '9pt', color: '#444', fontWeight: 600 }}>{config.especialidad}</div>}
          {(domConsultorio || telConsultorio) && (
            <div style={{ fontSize: '8pt', color: '#666', marginTop: '1pt' }}>
              {domConsultorio}{domConsultorio && telConsultorio ? '  ·  ' : ''}{telConsultorio ? `Tel: ${telConsultorio}` : ''}
            </div>
          )}
        </div>
        {/* Matrícula */}
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1.5pt solid #1a1a2e', borderRadius: '3pt', padding: '5pt 10pt', minWidth: '54pt' }}>
          <div style={{ fontSize: '6.5pt', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#555', fontWeight: 600 }}>Matrícula Prof.</div>
          <div style={{ fontWeight: 800, fontSize: '14pt', color: '#1a1a2e', lineHeight: 1.1 }}>{mp || '______'}</div>
        </div>
      </div>

      {/* Título */}
      <div style={{ textAlign: 'center', fontWeight: 800, fontSize: '11pt', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '9pt', paddingBottom: '5pt', borderBottom: '0.75pt solid #ccc' }}>{meta.titulo}</div>

      {/* Lugar y fecha */}
      <p style={{ margin: '0 0 6pt 0', fontSize: '9pt' }}>
        <strong>Lugar y fecha:</strong> {lugar || '______________________________'} — {fechaStr}
      </p>

      {/* Datos del paciente */}
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1pt solid #666', marginBottom: '8pt', fontSize: '9pt' }}>
        <tbody>
          <tr>
            <td style={{ padding: '3pt 6pt', borderBottom: '1pt solid #ddd', borderRight: '1pt solid #ddd', width: '50%' }}><strong>Paciente:</strong> {paciente.nombre} {paciente.apellido}</td>
            <td style={{ padding: '3pt 6pt', borderBottom: '1pt solid #ddd', width: '50%' }}><strong>DNI:</strong> {paciente.dni || '_______________'}</td>
          </tr>
          <tr>
            <td style={{ padding: '3pt 6pt', borderRight: '1pt solid #ddd' }}><strong>Fecha de nac.:</strong> _______________</td>
            <td style={{ padding: '3pt 6pt' }}><strong>Obra social / Afil.:</strong> {paciente.obraSocial || '_______________'}</td>
          </tr>
          {needsTutor && (
            <tr>
              <td style={{ padding: '3pt 6pt', borderTop: '1pt solid #ddd', borderRight: '1pt solid #ddd' }}><strong>Responsable legal:</strong> {tutor || '______________________'}</td>
              <td style={{ padding: '3pt 6pt', borderTop: '1pt solid #ddd' }}><strong>Vínculo:</strong> {relacion}</td>
            </tr>
          )}
          {needsDiente && (
            <tr>
              <td colSpan={2} style={{ padding: '3pt 6pt', borderTop: '1pt solid #ddd' }}><strong>Pieza dentaria N°:</strong> {diente || '____'}</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Cuerpo */}
      <div>
        {blocks.map((b, i) => renderBlock(b, i))}
        {notas && <p style={{ margin: '6pt 0', fontStyle: 'italic', color: '#333', overflowWrap: 'break-word' }}>{notas}</p>}
      </div>

      {/* Firmas */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '28pt' }}>
        <tbody>
          <tr>
            <td style={{ width: '45%', textAlign: 'center', fontSize: '9pt', padding: '0 8pt 0 0', verticalAlign: 'top' }}>
              <div style={{ borderTop: '1.5pt solid #000', paddingTop: '4pt' }}>
                Firma{needsTutor ? ' representante legal' : ' del paciente'}
              </div>
              <div style={{ marginTop: '18pt', borderTop: '1pt dotted #888', paddingTop: '3pt', fontSize: '8.5pt' }}>
                Aclaración: {needsTutor ? (tutor || '______________________') : `${paciente.nombre} ${paciente.apellido}`}
              </div>
              <div style={{ marginTop: '2pt', fontSize: '8.5pt' }}>DNI: {needsTutor ? '_______________' : (paciente.dni || '_______________')}</div>
            </td>
            <td style={{ width: '10%' }} />
            <td style={{ width: '45%', textAlign: 'center', fontSize: '9pt', padding: '0 0 0 8pt', verticalAlign: 'top' }}>
              <div style={{ borderTop: '1.5pt solid #000', paddingTop: '4pt' }}>
                Firma y sello del profesional
              </div>
              <div style={{ marginTop: '18pt', borderTop: '1pt dotted #888', paddingTop: '3pt', fontSize: '8.5pt' }}>
                {config.nombreProfesional}
              </div>
              <div style={{ marginTop: '2pt', fontSize: '8.5pt' }}>M.P. {mp}</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Pie */}
      <div style={{ marginTop: '14pt', borderTop: '1pt solid #ccc', paddingTop: '4pt', fontSize: '7pt', color: '#666', textAlign: 'center' }}>
        Colegio de Odontólogos de Córdoba · Consentimiento informado según Ley 26.529 de Derechos del Paciente
      </div>
    </div>
  );

  return (
    <>
      {createPortal(printContent, document.body)}

      {/* Modal pantalla */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3" style={{ background: 'rgba(0,0,0,0.55)' }}>
        <div className="bg-white rounded-2xl shadow-2xl flex flex-col" style={{ width: '580px', maxHeight: '90vh' }}>
          <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b">
            <div>
              <h2 className="text-sm font-extrabold text-gray-800">Consentimiento Informado</h2>
              <p className="text-xs text-gray-400 mt-0.5">{meta.label} · {paciente.nombre} {paciente.apellido}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
              <Button size="sm" onClick={() => window.print()} className="rounded-full gap-1.5 text-xs" style={{ background: 'var(--cyan)', color: 'var(--dark)' }}>
                <Printer size={12} /> Imprimir / PDF
              </Button>
              <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400"><X size={15} /></button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            <p className="text-[11px] text-gray-500 bg-blue-50 rounded-xl px-3 py-2">
              Completá los datos opcionales antes de imprimir. El texto corresponde al modelo oficial del Colegio de Odontólogos de Córdoba.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">Fecha</label>
                <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="text-xs border-gray-200 rounded-lg" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">Lugar</label>
                <Input value={lugar} onChange={e => setLugar(e.target.value)} placeholder="Ej: Córdoba" className="text-xs border-gray-200 rounded-lg" />
              </div>
            </div>

            {needsDiente && (
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">Pieza dentaria N°</label>
                <Input value={diente} onChange={e => setDiente(e.target.value)} placeholder="Ej: 36" className="text-xs border-gray-200 rounded-lg w-32" />
              </div>
            )}

            {needsTutor && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">Nombre del responsable</label>
                  <Input value={tutor} onChange={e => setTutor(e.target.value)} placeholder="Nombre y apellido" className="text-xs border-gray-200 rounded-lg" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">Vínculo</label>
                  <Input value={relacion} onChange={e => setRelacion(e.target.value)} placeholder="padre/madre/tutor" className="text-xs border-gray-200 rounded-lg" />
                </div>
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">Notas adicionales (opcional)</label>
              <textarea value={notas} onChange={e => setNotas(e.target.value)}
                placeholder="Aclaraciones específicas del caso..."
                rows={2} className="w-full text-xs border border-gray-200 rounded-lg p-2 resize-none focus:outline-none focus:ring-1 focus:ring-cyan-400" />
            </div>

            <div className="border rounded-xl p-4 bg-gray-50 space-y-1.5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Vista previa</p>
              <p className="text-[11px] font-bold text-gray-700 text-center underline">{meta.titulo}</p>
              {blocks.slice(0, 3).map((b, i) =>
                b.t === 'p' || b.t === 'i' ? (
                  <p key={i} className="text-[10px] text-gray-600 leading-relaxed line-clamp-3">{b.s.slice(0, 200)}{b.s.length > 200 ? '…' : ''}</p>
                ) : null
              )}
              <p className="text-[10px] text-gray-400 italic">... (ver completo al imprimir)</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Selector ──────────────────────────────────────────────────────────────────

interface SelectorProps {
  paciente: Paciente;
  config: Configuracion;
  onSelect: (tipo: TipoConsentimiento) => void;
  onClose: () => void;
}

export function SelectorConsentimiento({ paciente, config, onSelect, onClose }: SelectorProps) {
  const grupos: { titulo: string; tipos: TipoConsentimiento[] }[] = [
    { titulo: 'Cirugía oral', tipos: ['extraccion', 'extraccion_compleja', 'implantes', 'biopsia'] },
    { titulo: 'Tratamientos', tipos: ['endodoncia', 'periodoncia', 'protesis_fija', 'protesis_completa', 'protesis_parcial'] },
    { titulo: 'Especialidades', tipos: ['odontopediatria', 'ortopedia', 'discapacidad', 'sedoanalgesia'] },
    { titulo: 'Otros', tipos: ['imagenes_60', 'covid19', 'general'] },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3" style={{ background: 'rgba(0,0,0,0.55)' }}>
      <div className="bg-white rounded-2xl shadow-2xl" style={{ width: '480px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b">
          <div>
            <h2 className="text-sm font-extrabold text-gray-800">Consentimientos Informados</h2>
            <p className="text-xs text-gray-400 mt-0.5">{paciente.nombre} {paciente.apellido} · Seleccioná el tipo</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400"><X size={15} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {grupos.map(g => (
            <div key={g.titulo}>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{g.titulo}</p>
              <div className="space-y-1">
                {g.tipos.map(t => (
                  <button key={t} onClick={() => onSelect(t)}
                    className="w-full text-left text-sm px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-between group">
                    <span>{CONSENTIMIENTOS[t].label}</span>
                    <span className="text-[10px] text-gray-400 group-hover:text-gray-600 truncate max-w-[260px] text-right">{CONSENTIMIENTOS[t].titulo}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
