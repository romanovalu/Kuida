import { useState, useEffect } from 'react';
import type { Paciente, Configuracion } from '../types';
import { getLogoApp } from '../store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Printer, X, ChevronDown } from 'lucide-react';

// ── Tipos de consentimiento ───────────────────────────────────────────────────

export type TipoConsentimiento =
  | 'extraccion'
  | 'extraccion_compleja'
  | 'implantes'
  | 'periodoncia'
  | 'endodoncia'
  | 'protesis_fija'
  | 'protesis_completa'
  | 'protesis_parcial'
  | 'biopsia'
  | 'odontopediatria'
  | 'ortopedia'
  | 'discapacidad'
  | 'sedoanalgesia'
  | 'imagenes_60'
  | 'covid19'
  | 'general';

interface ConsentimientoMeta {
  label: string;
  titulo: string;
  subtitulo?: string;
}

export const CONSENTIMIENTOS: Record<TipoConsentimiento, ConsentimientoMeta> = {
  extraccion: { label: 'Extracción', titulo: 'CONSENTIMIENTO INFORMADO PARA EXTRACCIÓN DENTARIA' },
  extraccion_compleja: { label: 'Extracción compleja / Cirugía', titulo: 'CONSENTIMIENTO INFORMADO PARA EXTRACCIÓN DENTARIA COMPLEJA O CIRUGÍA MAXILOFACIAL' },
  implantes: { label: 'Implantes', titulo: 'CONSENTIMIENTO INFORMADO PARA COLOCACIÓN DE IMPLANTES OSEOINTEGRADOS' },
  periodoncia: { label: 'Periodoncia', titulo: 'CONSENTIMIENTO INFORMADO PARA TRATAMIENTO PERIODONTAL' },
  endodoncia: { label: 'Tratamiento de conducto', titulo: 'CONSENTIMIENTO INFORMADO PARA TRATAMIENTO ENDODÓNTICO (DE CONDUCTO)' },
  protesis_fija: { label: 'Prótesis fija', titulo: 'CONSENTIMIENTO INFORMADO PARA PRÓTESIS FIJA' },
  protesis_completa: { label: 'Prótesis completa', titulo: 'CONSENTIMIENTO INFORMADO PARA PRÓTESIS COMPLETA' },
  protesis_parcial: { label: 'Prótesis parcial removible', titulo: 'CONSENTIMIENTO INFORMADO PARA PRÓTESIS PARCIAL REMOVIBLE' },
  biopsia: { label: 'Biopsia', titulo: 'CONSENTIMIENTO INFORMADO PARA BIOPSIA ORAL' },
  odontopediatria: { label: 'Odontopediatría', titulo: 'CONSENTIMIENTO INFORMADO PARA TRATAMIENTO ODONTOPEDIÁTRICO' },
  ortopedia: { label: 'Ortopedia / Ortodoncia', titulo: 'CONSENTIMIENTO INFORMADO PARA TRATAMIENTO DE ORTOPEDIA FUNCIONAL Y ORTODONCIA' },
  discapacidad: { label: 'Paciente con discapacidad', titulo: 'CONSENTIMIENTO INFORMADO PARA ATENCIÓN DE PACIENTE CON DISCAPACIDAD' },
  sedoanalgesia: { label: 'Sedoanalgesia', titulo: 'CONSENTIMIENTO INFORMADO PARA SEDACIÓN CONSCIENTE / SEDOANALGESIA' },
  imagenes_60: { label: 'Toma de imágenes (+60 años)', titulo: 'CONSENTIMIENTO INFORMADO PARA TOMA DE IMÁGENES RADIOLÓGICAS EN PACIENTES MAYORES DE 60 AÑOS' },
  covid19: { label: 'COVID-19', titulo: 'CONSENTIMIENTO BÁSICO DE ATENCIÓN ODONTOLÓGICA - COVID-19' },
  general: { label: 'General', titulo: 'CONSENTIMIENTO INFORMADO PARA TRATAMIENTO ODONTOLÓGICO' },
};

// Anexo Odontopediatría — texto complementario al consentimiento base
export const TEXTO_ANEXO_ODONTOPEDIATRIA = [
  'ANEXO AL CONSENTIMIENTO INFORMADO DE ODONTOPEDIATRÍA',
  'Este anexo complementa el consentimiento informado de tratamiento odontopediátrico y detalla procedimientos específicos que pueden realizarse durante la atención del/la menor.',
  'SELLADORES DE FOSAS Y FISURAS: Aplicación de material plástico en las superficies de masticación de los dientes para prevenir caries. No requieren anestesia.',
  'PULPOTOMÍA / PULPECTOMÍA (tratamiento de nervio en dientes de leche): Cuando la caries ha comprometido la pulpa dentaria. Se realiza bajo anestesia local. Puede requerir corona pediátrica posterior.',
  'CORONAS PEDIÁTRICAS: Restauración de acero inoxidable o de resina para proteger dientes primarios muy destruidos. Son temporarias hasta la caída del diente de leche.',
  'MANTENEDORES DE ESPACIO: Aparatos fijos o removibles para preservar el espacio de dientes permanentes cuando se ha perdido un diente de leche prematuramente.',
  'EXTRACCIONES EN SERIE: En casos de maloclusión severa puede recomendarse la extracción programada de dientes para guiar la erupción.',
  'He sido informado/a de cada procedimiento en particular y autorizo la realización de los que sean necesarios según criterio profesional.',
];

// ── Textos de cada consentimiento ─────────────────────────────────────────────

function getTexto(tipo: TipoConsentimiento, profesional: string, matricula: string): string[] {
  const dr = `Dr/a. ${profesional} (M.P. ${matricula})`;

  const riesgos_generales = `La anestesia local puede producir, en raras ocasiones, reacciones alérgicas, hematomas, lipotimias o parestesias transitorias. Todo acto quirúrgico puede conllevar riesgo de infección postoperatoria, hemorragia, edema o equimosis. Se realizará el procedimiento siguiendo las normas de bioseguridad vigentes.`;

  switch (tipo) {
    case 'extraccion':
      return [
        `El/la profesional ${dr} me ha informado que se realizará la extracción del/los diente/s indicado/s como necesaria para preservar mi salud bucodental.`,
        `Me ha explicado que pueden presentarse las siguientes complicaciones: dolor postoperatorio, infección, trismus, alveolitis (inflamación del alvéolo), hemorragia, lesión de dientes o estructuras adyacentes, comunicación bucosinusal (en piezas superiores), parestesias temporarias o permanentes del nervio dentario (en piezas inferiores).`,
        riesgos_generales,
        `He recibido instrucciones sobre los cuidados postoperatorios y las indicaciones respecto a la medicación a tomar. Sé que debo consultar ante cualquier eventualidad.`,
        `He podido realizar todas las preguntas que consideré necesarias y se me ha explicado en lenguaje claro y sencillo el procedimiento a realizar.`,
      ];
    case 'extraccion_compleja':
      return [
        `El/la profesional ${dr} me ha informado que se realizará una extracción dentaria compleja o cirugía oral que puede incluir: extracciones de piezas retenidas (cordales/muelas del juicio), odontosección, alveoloplastia u otras maniobras quirúrgicas necesarias.`,
        `He sido informado/a que pueden presentarse las siguientes complicaciones: dolor e inflamación postoperatoria de varios días de duración, trismus (dificultad para abrir la boca), parestesia transitoria o permanente del nervio dentario inferior o lingual, hemorragia, hematoma, infección, comunicación bucosinusal, fractura de piezas o tejidos óseos adyacentes, y necesidad de revisión quirúrgica.`,
        riesgos_generales,
        `El/la profesional me ha indicado el reposo necesario, la medicación a tomar y los cuidados post-quirúrgicos que debo seguir estrictamente. Entiendo que el incumplimiento de las indicaciones puede agravar mi situación.`,
      ];
    case 'implantes':
      return [
        `El/la profesional ${dr} me ha explicado que el procedimiento de colocación de implantes oseointegrados consiste en la inserción quirúrgica de un dispositivo de titanio en el hueso maxilar/mandibular, sobre el que se apoyará la prótesis definitiva.`,
        `He sido informado/a de que el éxito del tratamiento depende de factores generales (diabetes, osteoporosis, uso de bifosfonatos, tabaquismo, enfermedades sistémicas) y locales (cantidad y calidad ósea, higiene bucal). No puedo garantizarse el éxito al 100%.`,
        `Conozco los riesgos posibles: fracaso de la oseointegración (el cuerpo rechaza el implante), infección periimplantaria, parestesias, lesión de estructuras adyacentes, necesidad de injertos óseos o membranas adicionales, fractura del implante.`,
        `Entiendo que el tratamiento implica varias etapas y tiempos de espera (período de oseointegración de 3 a 6 meses), y que debo mantener controles periódicos de por vida. El implante puede fallar y requerir retiro.`,
        `He sido informado/a sobre el costo del tratamiento y las distintas etapas quirúrgicas y protéticas. Acepto las condiciones y me comprometo a seguir las indicaciones de higiene y controles.`,
      ];
    case 'periodoncia':
      return [
        `El/la profesional ${dr} me ha informado que presento enfermedad periodontal (de las encías y el hueso de soporte de los dientes) que requiere tratamiento.`,
        `El tratamiento puede incluir: raspado y alisado radicular (curetaje), instrucción de higiene, cirugía periodontal (colgajo, injertos), extracciones de piezas con pronóstico comprometido y, eventualmente, regeneración ósea guiada.`,
        `He sido informado/a que sin tratamiento la enfermedad progresará y puede producir pérdida dentaria. Con tratamiento, la mejoría depende en gran medida del cumplimiento estricto de las instrucciones de higiene y de los controles periódicos de mantenimiento.`,
        `Riesgos del tratamiento: hipersensibilidad dentaria postoperatoria, recesión gingival visible, espacios interdentales más visibles, recidiva de la enfermedad por mala higiene. En cirugías: infección, edema, dolor, hematoma.`,
        riesgos_generales,
      ];
    case 'endodoncia':
      return [
        `El/la profesional ${dr} me ha informado que el diente Nº ____ presenta una patología pulpar (necrosis, pulpitis irreversible, lesión periapical) que requiere tratamiento de conductos radiculares (endodoncia).`,
        `El tratamiento consiste en la eliminación del tejido pulpar infectado o inflamado, limpieza y conformación de los conductos radiculares y su obturación hermética con materiales biocompatibles.`,
        `He sido informado/a sobre los riesgos posibles: fractura de instrumentos dentro del conducto, perforación radicular, sobrextensión de material de obturación, falla del tratamiento con necesidad de retratamiento o cirugía periapical (apicectomía), y eventualmente extracción de la pieza.`,
        `Entiendo que la endodoncia no garantiza la vitalidad futura del diente. Después del tratamiento el diente queda más frágil y será necesaria una restauración definitiva (coronas, postes) para protegerlo de fracturas.`,
        riesgos_generales,
      ];
    case 'protesis_fija':
      return [
        `El/la profesional ${dr} me ha informado que necesito la confección de una prótesis fija (corona/s y/o puente/s) para restablecer la función y estética de mi boca.`,
        `El tratamiento incluye el tallado (desgaste) de los dientes pilares, la toma de impresiones, la confección de provisorios y la colocación de la prótesis definitiva. El laboratorio dental interviene en la fabricación.`,
        `He sido informado/a que pueden ocurrir: sensibilidad dentaria postoperatoria, necesidad de tratamiento de conductos por daño pulpar, falla del cementado, fractura de la porcelana, recidiva de caries bajo la corona, problemas de oclusión.`,
        `Entiendo que la prótesis fija requiere controles periódicos, una higiene estricta (especialmente bajo el póntico/puente) y que su vida útil promedio es de 10 a 15 años, pudiendo variar según el cuidado y factores individuales.`,
        `He sido informado/a sobre los materiales disponibles (metal-cerámica, zirconio, disilicato de litio) y sus características, y he elegido de acuerdo a las indicaciones del profesional y mis posibilidades.`,
      ];
    case 'protesis_completa':
      return [
        `El/la profesional ${dr} me ha informado que, por la ausencia total de piezas dentarias, necesito la confección de prótesis completas (dentaduras postizas) superior y/o inferior.`,
        `He sido informado/a que la adaptación a las prótesis completas lleva tiempo y práctica: al principio puede producir incomodidad, dificultad para hablar o masticar, y úlceras de adaptación que requieren ajustes.`,
        `Entiendo que la retención y estabilidad de la prótesis completa dependen en gran medida de la anatomía individual (reborde residual, paladar, saliva) y que no siempre puede lograrse un ajuste perfecto, especialmente en la mandíbula.`,
        `He sido informado/a que el reborde óseo continúa reabsorbiéndose con el tiempo y que la prótesis deberá ser rebasada o reemplazada periódicamente (generalmente cada 5-7 años o antes si hay cambios importantes).`,
        `Conozco las instrucciones de uso y mantenimiento: retirar las prótesis por la noche, cepillarlas, almacenarlas en agua, acudir a controles periódicos.`,
      ];
    case 'protesis_parcial':
      return [
        `El/la profesional ${dr} me ha informado que necesito una prótesis parcial removible (PPR) para reemplazar las piezas dentarias faltantes y preservar la función masticatoria y la estética.`,
        `La PPR puede ser metálica (esquelético o cromo-cobalto), acrílica o flexible, según el caso clínico. El tratamiento puede requerir preparación previa de los dientes pilares.`,
        `He sido informado/a de los posibles inconvenientes: período de adaptación inicial, úlceras por presión que requieren ajustes, movilización de dientes pilares a largo plazo si la higiene es deficiente, fractura de ganchos o base acrílica, pérdida de retención con el tiempo.`,
        `Entiendo que debo mantener una higiene estricta tanto de la prótesis como de los dientes remanentes, y acudir a controles regulares para detectar problemas a tiempo.`,
        `Soy consciente de que la PPR es una solución removible y que, dependiendo de mi evolución, puede plantearse en el futuro una solución fija o sobre implantes.`,
      ];
    case 'biopsia':
      return [
        `El/la profesional ${dr} me ha informado que presenta una lesión en la mucosa oral cuya naturaleza requiere estudio histopatológico para establecer el diagnóstico definitivo.`,
        `El procedimiento consiste en la toma de una muestra de tejido (biopsia), que puede ser incisional (parcial) o excisional (total de la lesión), bajo anestesia local.`,
        `He sido informado/a de los riesgos: dolor postoperatorio, infección, hemorragia, dehiscencia de la sutura, cicatriz residual. El resultado del estudio anatomopatológico puede requerir tratamientos adicionales.`,
        `Entiendo que la biopsia es indispensable para descartar patologías graves (incluyendo lesiones premalignas o malignas) y que el resultado es el único modo de obtener un diagnóstico certero.`,
        riesgos_generales,
        `El resultado de la biopsia será comunicado por el profesional actuante. En caso de diagnóstico de patología maligna o lesión de comportamiento agresivo, seré derivado/a al especialista correspondiente.`,
      ];
    case 'odontopediatria':
      return [
        `Yo, _______________________, en calidad de padre/madre/tutor/a del/la menor ${'{nombre_paciente}'}, autorizo al/a la profesional ${dr} para realizar el tratamiento odontológico indicado, que puede incluir: revisación, profilaxis, aplicación de flúor, selladores, restauraciones (obturaciones), extracciones, pulpotomías, coronas pediátricas y/u otros procedimientos necesarios.`,
        `He sido informado/a que el tratamiento en niños/as puede requerir técnicas especiales de manejo conductual (decir-mostrar-hacer, control de voz, distracción), y en casos de niños muy pequeños, miedosos o con necesidades especiales, puede requerirse sedación o derivación a un especialista.`,
        `Entiendo que los dientes de leche (primarios) son importantes para la masticación, el habla y el espacio para los permanentes, y que su cuidado y tratamiento oportuno es esencial.`,
        `He sido informado/a de los riesgos inherentes a cada procedimiento, los cuidados postoperatorios necesarios y la importancia del control periódico cada 6 meses.`,
        `Me comprometo a reforzar los hábitos de higiene bucal en el hogar y a traer al/la menor a los controles indicados.`,
      ];
    case 'ortopedia':
      return [
        `El/la profesional ${dr} me ha informado (o informado al padre/madre/tutor del/la menor) que existe una alteración en el desarrollo de los maxilares y/o en la posición de los dientes que requiere tratamiento de ortopedia funcional y/u ortodoncia.`,
        `El tratamiento puede incluir: aparatos removibles (placas de ortopedia), aparatos fijos (brackets), extracciones dentarias previas, y controles de seguimiento periódicos. La duración varía según cada caso (generalmente 1 a 3 años o más).`,
        `He sido informado/a que el éxito del tratamiento depende en gran medida de la colaboración del/la paciente (uso correcto de los aparatos, higiene, asistencia a controles). La falta de colaboración puede prolongar el tratamiento, disminuir los resultados o hacerlo fracasar.`,
        `Los riesgos posibles incluyen: caries bajo los brackets por higiene deficiente, reabsorción radicular (acortamiento de las raíces), recidiva de la maloclusión si no se usa la contención indicada, y en casos con extracciones, los riesgos propios de ese procedimiento.`,
        `Entiendo que el resultado final puede diferir de los objetivos iniciales por factores de crecimiento, colaboración del paciente u otras causas. Al finalizar el tratamiento activo deberé usar aparatos de contención.`,
        `He sido informado/a del cronograma estimado de controles y del costo del tratamiento completo.`,
      ];
    case 'discapacidad':
      return [
        `Yo, _______________________, en calidad de ${'{relacion}'} del/la paciente ${'{nombre_paciente}'}, acepto y autorizo al/a la profesional ${dr} para realizar el tratamiento odontológico indicado.`,
        `He sido informado/a que la atención odontológica de personas con discapacidad puede requerir técnicas especiales de manejo, mayor tiempo por sesión, y en algunos casos sedación o anestesia general para garantizar la seguridad y el bienestar del/la paciente.`,
        `Entiendo que la colaboración del paciente puede ser variable según el día y el estado de salud general, y que el profesional puede interrumpir el tratamiento si lo considera necesario para la seguridad.`,
        `He sido informado/a de todos los riesgos inherentes a cada procedimiento específico y de las adaptaciones realizadas para la atención de este/a paciente.`,
        `Me comprometo a proveer información actualizada sobre el estado de salud general del/la paciente, la medicación que toma y cualquier cambio en su condición.`,
      ];
    case 'sedoanalgesia':
      return [
        `El/la profesional ${dr} me ha informado que, para garantizar mi bienestar y cooperación durante el tratamiento odontológico, se propone la realización de sedación consciente (óxido nitroso/oxígeno, sedación oral o intravenosa según el caso).`,
        `He sido informado/a que la sedación consciente reduce la ansiedad y el dolor pero no implica pérdida total del conocimiento. Permaneceré consciente y podré responder a indicaciones verbales.`,
        `Conozco los requisitos previos: ayuno de __ horas, no conducir vehículos ni tomar decisiones importantes durante las siguientes 24 horas, venir acompañado/a por un adulto responsable.`,
        `He sido informado/a de los posibles efectos adversos: náuseas, vómitos, cefalea, mareos, excitación paradojal (más frecuente en niños), y en casos excepcionales, depresión respiratoria.`,
        `He informado al profesional sobre todas mis enfermedades, alergias y medicamentos actuales, en particular los que actúan sobre el sistema nervioso central.`,
        riesgos_generales,
      ];
    case 'imagenes_60':
      return [
        `El/la profesional ${dr} me ha informado que, para el correcto diagnóstico y planificación de mi tratamiento odontológico, es necesaria la toma de imágenes radiológicas (radiografías periapicales, panorámica, CBCT u otras).`,
        `En mi caso particular, como paciente mayor de 60 años, se ha evaluado la relación riesgo-beneficio de las radiaciones ionizantes, y el profesional me ha explicado que la dosis utilizada en odontología es mínima y que el beneficio diagnóstico supera ampliamente el riesgo.`,
        `He sido informado/a que se utilizarán las técnicas de protección estándar (delantal de plomo, collarín tiroideo) según corresponda, y que los equipos están calibrados y en cumplimiento de la normativa vigente.`,
        `Entiendo que sin las imágenes diagnósticas el profesional no puede garantizar un diagnóstico completo ni planificar el tratamiento con seguridad.`,
        `Autorizo la toma de las imágenes necesarias para mi tratamiento.`,
      ];
    case 'covid19':
      return [
        `En el contexto de la pandemia/post-pandemia por COVID-19, declaro que en los últimos 14 días NO he tenido: fiebre, tos, dificultad respiratoria, pérdida de olfato o gusto, ni contacto estrecho con personas confirmadas de COVID-19.`,
        `He sido informado/a de los protocolos de bioseguridad implementados en el consultorio (ventilación, esterilización reforzada, uso de EPP por parte del equipo de salud, distanciamiento en sala de espera, higiene de manos).`,
        `Entiendo que, a pesar de los protocolos de protección, la atención odontológica implica un nivel de riesgo de exposición a enfermedades de transmisión aérea o por gotas, y acepto este riesgo inherente al procedimiento.`,
        `Me comprometo a informar inmediatamente al consultorio si en los 14 días posteriores a la consulta desarrollo síntomas compatibles con COVID-19 o resultado positivo, para permitir el rastreo de contactos.`,
        `Autorizo al equipo odontológico a tomar mis datos de contacto para esta finalidad.`,
      ];
    default: // general
      return [
        `El/la profesional ${dr} me ha explicado el diagnóstico de mi situación bucodental y el tratamiento propuesto para mejorar mi salud oral.`,
        `He recibido información clara sobre los procedimientos a realizar, sus objetivos, alternativas de tratamiento y los riesgos potenciales.`,
        riesgos_generales,
        `He podido hacer todas las preguntas que consideré necesarias y han sido respondidas satisfactoriamente.`,
        `Entiendo que el resultado del tratamiento puede verse afectado por factores individuales y que es fundamental el cumplimiento de las indicaciones y los controles periódicos.`,
      ];
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
  const matricula = config.recetario?.matricula || '___________';
  const domConsultorio = config.recetario?.domicilio || '';
  const telConsultorio = config.recetario?.telefonoConsultorio || '';

  const today = new Date().toISOString().slice(0, 10);
  const [fecha, setFecha] = useState(today);
  const [lugar, setLugar] = useState('');
  const [tutor, setTutor] = useState('');
  const [relacion, setRelacion] = useState('padre/madre');
  const [diente, setDiente] = useState('');
  const [notasExtra, setNotasExtra] = useState('');

  const needsTutor = ['odontopediatria', 'discapacidad'].includes(tipo);
  const needsDiente = tipo === 'endodoncia';

  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'ci-print-style';
    style.textContent = `
      @media print {
        body * { visibility: hidden !important; }
        #ci-print-root, #ci-print-root * { visibility: visible !important; }
        #ci-print-root { display: block !important; position: fixed; top: 0; left: 0; width: 100%; }
        @page { size: A4; margin: 12mm 14mm; }
      }
    `;
    document.head.appendChild(style);
    return () => document.getElementById('ci-print-style')?.remove();
  }, []);

  const paragraphs = getTexto(tipo, config.nombreProfesional, matricula)
    .map(p => p
      .replace('{nombre_paciente}', `${paciente.nombre} ${paciente.apellido}`)
      .replace('{relacion}', relacion)
      .replace('____', diente || '____')
    );

  const fechaStr = fecha
    ? new Date(fecha + 'T12:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '_____ de ________________ de ______';

  const PrintView = () => (
    <div id="ci-print-root" style={{ display: 'none', fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '10pt', lineHeight: '1.5', color: '#000' }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '2.5px solid #000', paddingBottom: '10px', marginBottom: '12px' }}>
        {logoApp && <img src={logoApp} alt="Logo" style={{ height: '56px', objectFit: 'contain', flexShrink: 0 }} />}
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold', fontSize: '12pt' }}>{config.nombreProfesional}</div>
          <div style={{ fontSize: '10pt' }}>{config.especialidad}</div>
          {domConsultorio && <div style={{ fontSize: '9pt', color: '#444' }}>{domConsultorio}</div>}
          {telConsultorio && <div style={{ fontSize: '9pt', color: '#444' }}>Tel: {telConsultorio}</div>}
        </div>
        <div style={{ textAlign: 'right', fontSize: '9pt', border: '1px solid #000', padding: '5px 10px', flexShrink: 0 }}>
          <div style={{ fontWeight: 'bold', fontSize: '8pt', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Matrícula Profesional</div>
          <div style={{ fontWeight: 'bold', fontSize: '13pt', marginTop: '2px' }}>{matricula}</div>
        </div>
      </div>

      {/* Título */}
      <div style={{ textAlign: 'center', marginBottom: '12px' }}>
        <div style={{ fontWeight: 'bold', fontSize: '13pt', textDecoration: 'underline', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          {meta.titulo}
        </div>
        {meta.subtitulo && <div style={{ fontSize: '10pt', marginTop: '4px', fontStyle: 'italic' }}>{meta.subtitulo}</div>}
      </div>

      {/* Datos paciente */}
      <div style={{ border: '1px solid #888', borderRadius: '4px', padding: '8px 12px', marginBottom: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '9.5pt' }}>
        <div><strong>Paciente:</strong> {paciente.nombre} {paciente.apellido}</div>
        <div><strong>DNI:</strong> {paciente.dni || '_______________'}</div>
        <div><strong>Fecha de nacimiento:</strong> _______________</div>
        <div><strong>Obra social / Nº afiliado:</strong> {paciente.obraSocial || '_______________'}</div>
        {needsTutor && <>
          <div><strong>Responsable:</strong> {tutor || '___________________________'}</div>
          <div><strong>Vínculo:</strong> {relacion}</div>
        </>}
        {needsDiente && <div><strong>Pieza dentaria:</strong> {diente || '____'}</div>}
        <div><strong>Lugar:</strong> {lugar || '___________________________'}</div>
        <div><strong>Fecha:</strong> {fechaStr}</div>
      </div>

      {/* Cuerpo del consentimiento */}
      <div style={{ marginBottom: '12px' }}>
        {paragraphs.map((p, i) => (
          <p key={i} style={{ marginBottom: '8px', textAlign: 'justify' }}>
            {p}
          </p>
        ))}
        {notasExtra && (
          <p style={{ marginBottom: '8px', textAlign: 'justify', fontStyle: 'italic' }}>
            {notasExtra}
          </p>
        )}
      </div>

      {/* Declaración final */}
      <div style={{ marginBottom: '14px', padding: '8px 12px', border: '1px solid #aaa', borderRadius: '4px', fontSize: '9.5pt', fontStyle: 'italic', textAlign: 'justify' }}>
        En virtud de lo expuesto, habiendo comprendido la información proporcionada y habiendo tenido la posibilidad de realizar todas las preguntas necesarias, otorgo mi consentimiento libre e informado para la realización del tratamiento indicado por el/la profesional actuante.
      </div>

      {/* Firmas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginTop: '36px' }}>
        <div>
          <div style={{ borderTop: '1.5px solid #000', paddingTop: '4px', textAlign: 'center', fontSize: '9pt' }}>
            <div>Firma del paciente{needsTutor ? ' / responsable' : ''}</div>
            <div style={{ marginTop: '24px', borderTop: '1px dotted #555', paddingTop: '4px', color: '#444' }}>
              Aclaración: {needsTutor ? (tutor || '_______________________') : `${paciente.nombre} ${paciente.apellido}`}
            </div>
            <div style={{ marginTop: '6px', color: '#444' }}>DNI: {needsTutor ? '_______________' : (paciente.dni || '_______________')}</div>
          </div>
        </div>
        <div>
          <div style={{ borderTop: '1.5px solid #000', paddingTop: '4px', textAlign: 'center', fontSize: '9pt' }}>
            <div>Firma y sello del profesional</div>
            <div style={{ marginTop: '24px', borderTop: '1px dotted #555', paddingTop: '4px', color: '#444' }}>
              {config.nombreProfesional}
            </div>
            <div style={{ marginTop: '6px', color: '#444' }}>M.P. {matricula}</div>
          </div>
        </div>
      </div>

      {/* Pie de página */}
      <div style={{ marginTop: '24px', borderTop: '1px solid #ccc', paddingTop: '6px', fontSize: '7.5pt', color: '#666', textAlign: 'center' }}>
        Colegio de Odontólogos de Córdoba · Este documento tiene validez como instrumento de consentimiento informado según Ley 26.529 de Derechos del Paciente
      </div>
    </div>
  );

  return (
    <>
      <PrintView />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3" style={{ background: 'rgba(0,0,0,0.55)' }}>
        <div className="bg-white rounded-2xl shadow-2xl flex flex-col" style={{ width: '580px', maxHeight: '90vh' }}>
          {/* Header */}
          <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b">
            <div>
              <h2 className="text-sm font-extrabold text-gray-800 leading-tight">Consentimiento Informado</h2>
              <p className="text-xs text-gray-400 mt-0.5">{meta.label} · {paciente.nombre} {paciente.apellido}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
              <Button size="sm" onClick={() => window.print()} className="rounded-full gap-1.5 text-xs" style={{ background: 'var(--cyan)', color: 'var(--dark)' }}>
                <Printer size={12} /> Imprimir / PDF
              </Button>
              <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400"><X size={15} /></button>
            </div>
          </div>

          {/* Form */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            <p className="text-[11px] text-gray-500 bg-blue-50 rounded-xl px-3 py-2">
              Completá los datos opcionales antes de imprimir. El texto del consentimiento corresponde al modelo oficial del Colegio de Odontólogos de Córdoba.
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
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">Pieza dentaria Nº</label>
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
              <textarea value={notasExtra} onChange={e => setNotasExtra(e.target.value)}
                placeholder="Aclaraciones específicas del caso..."
                rows={2} className="w-full text-xs border border-gray-200 rounded-lg p-2 resize-none focus:outline-none focus:ring-1 focus:ring-cyan-400" />
            </div>

            {/* Preview del texto */}
            <div className="border rounded-xl p-4 bg-gray-50 space-y-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Vista previa del contenido</p>
              <p className="text-[11px] font-bold text-gray-700 text-center underline">{meta.titulo}</p>
              {paragraphs.map((p, i) => (
                <p key={i} className="text-[11px] text-gray-600 leading-relaxed">{p}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Selector de consentimiento (modal de elección) ────────────────────────────

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
                {g.tipos.map(tipo => (
                  <button key={tipo} onClick={() => onSelect(tipo)}
                    className="w-full text-left px-3 py-2.5 rounded-xl border border-gray-100 hover:border-cyan-400 hover:bg-cyan-50 transition-colors flex items-center justify-between group">
                    <span className="text-xs font-medium text-gray-700">{CONSENTIMIENTOS[tipo].label}</span>
                    <ChevronDown size={12} className="text-gray-300 rotate-[-90deg] group-hover:text-cyan-500 transition-colors" />
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
