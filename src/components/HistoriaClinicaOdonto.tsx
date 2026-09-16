import { useState, useEffect, useCallback } from 'react';
import type { Paciente, Odontograma, Consulta, HistoriaClinica, HCAnt, HCOdonto, HCDiag, SiNo, Configuracion } from '../types';
import { uid, getLogoApp } from '../store';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Printer, Save, X, ChevronLeft, ChevronRight } from 'lucide-react';

// ── Valores iniciales ─────────────────────────────────────────────────────────

const antDefault = (): HCAnt => ({
  padreVida: null, padreEnf: '',
  madreVida: null, madreEnf: '',
  hermanos: null, hermSanos: '',
  enfermedad: null, enfermedadCual: '',
  tratMedico: null, tratCual: '',
  medicHabitual: '', medic5anos: '',
  deporte: null, malDeporte: null,
  alergiaDroga: null, alAnestesia: null, alPenicilina: null, alOtros: '',
  cicatrizacion: '',
  colageno: null,
  fiebreReumatica: null, medFR: '',
  diabetico: null, diabControl: '',
  cardiaco: null, cardiacoCual: '',
  aspirina: null, aspirinFrec: '',
  presionAlta: null,
  chagas: null, chagasTrat: '',
  renales: null,
  ulcera: null,
  hepatitis: null, hepatTipo: '',
  hepatico: null, hepaticoCual: '',
  convulsiones: null,
  epileptico: null, epilepMed: '',
  sifilis: null,
  infecciosa: null,
  transfusiones: null,
  operado: null, operadoCual: '', operadoCuando: '',
  respiratorio: null, respirCual: '',
  fuma: null,
  embarazada: null, embMeses: '',
  otraEnf: null, otraEnfCual: '',
  tratAlternativo: '',
  medicoCabecera: '',
  hospitalDerivacion: '',
});

const hcoDefault = (): HCOdonto => ({
  motivo: '',
  consultoProfesional: null,
  tomoMed: null, medNombre: '', desde: '', resultados: null,
  dolor: null,
  dSuave: false, dModerado: false, dIntenso: false,
  dTemporario: false, dIntermitente: false, dContinuo: false,
  dEspontaneo: false, dProvocado: false, dFrio: false, dCalor: false,
  dLocalizado: false, dLocDonde: '',
  dIrradiado: false, dIrrHacia: '',
  dCalmar: '',
  golpe: null, golpeCuando: '', golpeComo: '',
  fractura: null, fracturaCual: '', fracturaTrat: '',
  difHablar: '', difMasticar: '', difAbrir: '', difTragar: '',
  labios: '', lengua: '', paladar: '', pisoBoca: '',
  carrillos: '', rebordes: '', trigono: '', retromolar: '',
  manchas: null, abultamiento: null, ulceraciones: null, ampollas: null, otrasLesiones: '',
  sangradoEncias: null, sangradoCuando: '',
  pus: null, pusDonde: '',
  movilidad: null, altos: '',
  hinchada: null, hinchadaQue: '',
  azucar: '', placa: '',
  higiene: '',
});

const diagDefault = (): HCDiag => ({
  sarro: null,
  periodontal: null,
  diagnostico: '',
  plan: '',
  planFecha: '',
  observaciones: '',
  estudios: '',
  continuaAnexo: '',
});

// ── Helpers UI ────────────────────────────────────────────────────────────────

function SiNoBtn({ label, value, onChange }: { label: string; value: SiNo; onChange: (v: SiNo) => void }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-[11px] text-gray-600 flex-1 leading-tight pt-0.5">{label}</span>
      <div className="flex gap-1 flex-shrink-0">
        <button type="button"
          onClick={() => onChange(value === true ? null : true)}
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border transition-colors ${value === true ? 'bg-green-600 text-white border-green-600' : 'border-gray-300 text-gray-400 hover:border-gray-500'}`}>SI</button>
        <button type="button"
          onClick={() => onChange(value === false ? null : false)}
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border transition-colors ${value === false ? 'bg-red-500 text-white border-red-500' : 'border-gray-300 text-gray-400 hover:border-gray-500'}`}>NO</button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">{label}</Label>
      {children}
    </div>
  );
}

function TxtInput({ value, onChange, placeholder = '', multiline = false }: { value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean }) {
  const cls = "w-full text-xs border-gray-200 rounded-lg";
  return multiline
    ? <Textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={2} className={cls + " resize-none"} />
    : <Input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cls} />;
}

// ── Odontograma SVG oficial (formato cuadrados clásico) ───────────────────────

const S = 18; // tamaño de cada diente en px

function ToothCell({ num, ausente }: { num: number; ausente?: boolean }) {
  // Cuadrado exterior + cuadrado interior (estilo oficial)
  const m = 2; // margen
  const inner = 5; // distancia al cuadrado interno
  return (
    <svg width={S} height={S + 9} viewBox={`0 0 ${S} ${S + 9}`} style={{ display: 'block' }}>
      {/* número */}
      <text x={S/2} y={7} textAnchor="middle" fontSize="6.5" fill="#000" fontFamily="Arial">{num}</text>
      {/* cuadrado exterior */}
      <rect x={m} y={9} width={S - m*2} height={S - m*2} fill="white" stroke="#000" strokeWidth="0.8" />
      {/* cuadrado interior (oclusal) */}
      <rect x={m + inner} y={9 + inner} width={S - m*2 - inner*2} height={S - m*2 - inner*2} fill="white" stroke="#000" strokeWidth="0.8" />
      {/* líneas que unen vértices (triángulos vestibular/lingual/mesial/distal) */}
      <line x1={m} y1={9} x2={m + inner} y2={9 + inner} stroke="#000" strokeWidth="0.6" />
      <line x1={S-m} y1={9} x2={S-m-inner} y2={9+inner} stroke="#000" strokeWidth="0.6" />
      <line x1={m} y1={S+9-m} x2={m+inner} y2={S+9-m-inner} stroke="#000" strokeWidth="0.6" />
      <line x1={S-m} y1={S+9-m} x2={S-m-inner} y2={S+9-m-inner} stroke="#000" strokeWidth="0.6" />
      {/* X si ausente */}
      {ausente && <>
        <line x1={m+1} y1={10} x2={S-m-1} y2={S+7} stroke="#000" strokeWidth="1" />
        <line x1={S-m-1} y1={10} x2={m+1} y2={S+7} stroke="#000" strokeWidth="1" />
      </>}
    </svg>
  );
}

function OdontogramaPrint({ odontograma }: { odontograma?: Odontograma }) {
  const ausente = (num: number) => odontograma?.dientes?.[String(num)]?.ausente;

  const rowStyle: React.CSSProperties = { display: 'flex', gap: '1px', justifyContent: 'center' };

  // Adulto superior: 18-11 | 21-28
  const adSup1 = [18,17,16,15,14,13,12,11];
  const adSup2 = [21,22,23,24,25,26,27,28];
  // Adulto inferior: 48-41 | 31-38
  const adInf1 = [48,47,46,45,44,43,42,41];
  const adInf2 = [31,32,33,34,35,36,37,38];
  // Niño superior: 55-51 | 61-65
  const niSup1 = [55,54,53,52,51];
  const niSup2 = [61,62,63,64,65];
  // Niño inferior: 85-81 | 71-75
  const niInf1 = [85,84,83,82,81];
  const niInf2 = [71,72,73,74,75];

  const Row = ({ left, right, label }: { left: number[]; right: number[]; label?: string }) => (
    <div style={{ display: 'flex', gap: '2px', alignItems: 'center', justifyContent: 'center' }}>
      <div style={rowStyle}>{left.map(n => <ToothCell key={n} num={n} ausente={ausente(n)} />)}</div>
      {label && <div style={{ width: '28px', textAlign: 'center', fontSize: '7pt', color: '#555', fontStyle: 'italic' }}>{label}</div>}
      <div style={rowStyle}>{right.map(n => <ToothCell key={n} num={n} ausente={ausente(n)} />)}</div>
    </div>
  );

  return (
    <div style={{ fontFamily: 'Arial' }}>
      <Row left={adSup1} right={adSup2} />
      <div style={{ height: '2px' }} />
      <Row left={adInf1} right={adInf2} />
      <div style={{ height: '6px', borderTop: '1px dashed #bbb', margin: '4px 0' }} />
      <Row left={niSup1} right={niSup2} label="D   I" />
      <div style={{ height: '2px' }} />
      <Row left={niInf1} right={niInf2} />
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

interface Props {
  paciente: Paciente;
  config: Configuracion;
  odontograma?: Odontograma;
  consultas: Consulta[];
  initialData: HistoriaClinica | null;
  onSave: (hc: HistoriaClinica) => void;
  onClose: () => void;
}

const TABS = ['Datos', 'Antecedentes', 'HC Odontológica', 'Diagnóstico'];

export default function HistoriaClinicaOdonto({ paciente, config, odontograma, consultas, initialData, onSave, onClose }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const logoApp = getLogoApp();

  const [tab, setTab] = useState(0);
  const [saving, setSaving] = useState(false);

  // Form state
  const [fecha, setFecha] = useState(initialData?.fecha || today);
  const [lugar, setLugar] = useState(initialData?.lugar || '');
  const [nroAfil, setNroAfil] = useState(initialData?.nroAfil || paciente.obraSocial || '');
  const [ant, setAnt] = useState<HCAnt>(initialData?.ant ?? antDefault());
  const [hco, setHco] = useState<HCOdonto>(initialData?.hco ?? hcoDefault());
  const [diag, setDiag] = useState<HCDiag>(initialData?.diag ?? diagDefault());

  const setA = useCallback(<K extends keyof HCAnt>(k: K, v: HCAnt[K]) => setAnt(a => ({ ...a, [k]: v })), []);
  const setH = useCallback(<K extends keyof HCOdonto>(k: K, v: HCOdonto[K]) => setHco(h => ({ ...h, [k]: v })), []);
  const setD = useCallback(<K extends keyof HCDiag>(k: K, v: HCDiag[K]) => setDiag(d => ({ ...d, [k]: v })), []);

  const currentHC = (): HistoriaClinica => ({
    id: initialData?.id || uid(),
    pacienteId: paciente.id,
    tipo: 'general',
    fecha, lugar, nroAfil, ant, hco, diag,
    createdAt: initialData?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const handleSave = async () => {
    setSaving(true);
    onSave(currentHC());
    setSaving(false);
  };

  const handlePrint = () => {
    onSave(currentHC()); // auto-save before print
    setTimeout(() => window.print(), 200);
  };

  // ── Print global style injection ──────────────────────────────────────────
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'hc-print-style';
    style.textContent = `
      @media print {
        body * { visibility: hidden !important; }
        #hc-print-root, #hc-print-root * { visibility: visible !important; }
        html, body { height: auto !important; overflow: visible !important; }
        #hc-print-root { display: block !important; position: absolute !important; top: 0 !important; left: 0 !important; right: 0 !important; margin: 0 !important; padding: 0 !important; }
        .screen-only { display: none !important; }
        @page { size: A4; margin: 10mm 12mm; }
      }
    `;
    document.head.appendChild(style);
    return () => document.getElementById('hc-print-style')?.remove();
  }, []);

  const sn = (v: SiNo) => v === true ? 'SI' : v === false ? 'NO' : '___';
  const bx = (v: boolean) => v ? '■' : '□';
  const snBx = (v: SiNo) => `SI ${v === true ? '■' : '□'}  NO ${v === false ? '■' : '□'}`;
  const hig = { muy_bueno: 'Muy bueno', bueno: 'Bueno', deficiente: 'Deficiente', malo: 'Malo', '': '' };
  const pr = (v: string, fallback = '___') => v?.trim() || fallback;

  const matricula = config.recetario?.matricula || '___________';
  const domConsultorio = config.recetario?.domicilio || '';
  const telConsultorio = config.recetario?.telefonoConsultorio || '';

  // ── Print view ────────────────────────────────────────────────────────────
  const PrintView = () => (
    <div id="hc-print-root" style={{ display: 'none', fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '9pt', lineHeight: '1.35', color: '#000' }}>
      {/* ===== PÁGINA 1 ===== */}
      <div style={{ pageBreakAfter: 'always', padding: '0' }}>
        {/* Encabezado profesional */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '2px solid #000', paddingBottom: '8px', marginBottom: '6px' }}>
          {logoApp && <img src={logoApp} alt="Logo" style={{ height: '50px', objectFit: 'contain' }} />}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 'bold', fontSize: '11pt' }}>{config.nombreProfesional}</div>
            <div>{config.especialidad}</div>
            {domConsultorio && <div>{domConsultorio}</div>}
            {telConsultorio && <div>Tel: {telConsultorio}</div>}
          </div>
          <div style={{ border: '1px solid #000', padding: '4px 8px', fontSize: '8pt' }}>
            <div style={{ fontWeight: 'bold' }}>Nº de Matrícula</div>
            <div style={{ textAlign: 'center', fontSize: '10pt', fontWeight: 'bold' }}>{matricula}</div>
          </div>
        </div>

        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '13pt', textDecoration: 'underline', marginBottom: '8px' }}>
          HISTORIA CLÍNICA GENERAL
        </div>

        {/* Datos básicos */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
          <span>Lugar: {pr(lugar)}</span>
          <span>Fecha: {fecha ? new Date(fecha + 'T12:00').toLocaleDateString('es-AR') : '___/___/______'}</span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '4px' }}>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #000', padding: '3px 6px', width: '60%' }}>
                <strong>PACIENTE:</strong> {paciente.nombre} {paciente.apellido}
              </td>
              <td style={{ border: '1px solid #000', padding: '3px 6px' }}>
                <strong>Nº AFIL:</strong> {pr(nroAfil, '...')}
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{ borderBottom: '1px dotted #000', paddingBottom: '2px', marginBottom: '2px', fontSize: '8.5pt' }}>
          O. Social: {pr(paciente.obraSocial)}{'  ·  '}F.Nac: ___________{'  ·  '}Tel: {pr(paciente.telefono)}
        </div>
        <div style={{ borderBottom: '1px dotted #000', paddingBottom: '2px', marginBottom: '2px', fontSize: '8.5pt' }}>
          Edad: {paciente.edad}{'  ·  '}DNI: {pr(paciente.dni)}{'  ·  '}E.Civil: ___________{'  ·  '}Nac: ___________
        </div>
        <div style={{ borderBottom: '1px dotted #000', paddingBottom: '2px', marginBottom: '4px', fontSize: '8.5pt' }}>
          Domicilio: _______________________________________________________________
        </div>

        {/* Dos columnas: antecedentes + HC Odonto */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {/* Columna izquierda: Antecedentes sistémicos */}
          <div>
            <div style={{ fontStyle: 'italic', fontSize: '8pt', marginBottom: '4px' }}>
              Este cuestionario tiene el tenor de una <em>"Declaración Jurada"</em>
            </div>
            {[
              [`Padre con vida?`, snBx(ant.padreVida), ant.padreEnf],
              [`Madre con vida?`, snBx(ant.madreVida), ant.madreEnf],
              [`Hermanos?`, snBx(ant.hermanos), ant.hermSanos],
              [`Sufre de alguna enfermedad?`, snBx(ant.enfermedad), ant.enfermedadCual],
              [`Hace algún tratamiento médico?`, snBx(ant.tratMedico), ant.tratCual],
            ].map(([lbl, sino, txt], i) => (
              <PRow key={i} lbl={String(lbl)} sino={String(sino)} txt={String(txt)} />
            ))}
            <div style={{ borderBottom: '1px dotted #ccc', paddingBottom: '2px', marginBottom: '2px' }}>
              Medicamentos habituales: {pr(ant.medicHabitual)}<br />
              Últimos 5 años: {pr(ant.medic5anos)}
            </div>
            {[
              [`Realiza algún deporte?`, snBx(ant.deporte), ''],
              [`Malestar al realizarlo?`, snBx(ant.malDeporte), ''],
            ].map(([lbl, sino, txt], i) => <PRow key={i} lbl={String(lbl)} sino={String(sino)} txt={String(txt)} />)}
            <div style={{ marginBottom: '2px' }}>
              <strong>¿Es alérgico a alguna droga?</strong> {snBx(ant.alergiaDroga)}<br />
              anestesia {snBx(ant.alAnestesia)} · penicilina {snBx(ant.alPenicilina)} · otros: {pr(ant.alOtros)}
            </div>
            <div style={{ marginBottom: '2px', borderBottom: '1px dotted #ccc', paddingBottom: '2px' }}>
              Cicatrización/sangrado: {pr(ant.cicatrizacion)}
            </div>
            {[
              [`Problema de colágeno?`, snBx(ant.colageno), ''],
              [`Fiebre reumática?`, snBx(ant.fiebreReumatica), ant.medFR],
              [`Es diabético?`, snBx(ant.diabetico), ant.diabControl ? `controlado con: ${ant.diabControl}` : ''],
              [`Problema cardíaco?`, snBx(ant.cardiaco), ant.cardiacoCual],
              [`Toma aspirina/anticoagulante?`, snBx(ant.aspirina), ant.aspirinFrec],
              [`Presión alta?`, snBx(ant.presionAlta), ''],
              [`Chagas?`, snBx(ant.chagas), ant.chagasTrat],
              [`Problemas renales?`, snBx(ant.renales), ''],
              [`Úlcera gástrica?`, snBx(ant.ulcera), ''],
              [`Tuvo hepatitis?`, snBx(ant.hepatitis), ant.hepatTipo ? `Tipo: ${ant.hepatTipo}` : ''],
              [`Problema hepático?`, snBx(ant.hepatico), ant.hepaticoCual],
              [`Convulsiones?`, snBx(ant.convulsiones), ''],
              [`Es epiléptico?`, snBx(ant.epileptico), ant.epilepMed],
              [`Sífilis o Gonorrea?`, snBx(ant.sifilis), ''],
              [`Otra enf. infecto-contagiosa?`, snBx(ant.infecciosa), ''],
              [`Transfusiones?`, snBx(ant.transfusiones), ''],
              [`Fue operado?`, snBx(ant.operado), ant.operadoCual],
              [`Problema respiratorio?`, snBx(ant.respiratorio), ant.respirCual],
              [`Fuma?`, snBx(ant.fuma), ''],
              [`Está embarazada?`, snBx(ant.embarazada), ant.embMeses ? `${ant.embMeses} meses` : ''],
              [`Otra enf./recom. médico?`, snBx(ant.otraEnf), ant.otraEnfCual],
            ].map(([lbl, sino, txt], i) => <PRow key={i} lbl={String(lbl)} sino={String(sino)} txt={String(txt)} />)}
            <div style={{ marginBottom: '2px', fontSize: '8pt' }}>
              Trat. homeopático/acupuntura: {pr(ant.tratAlternativo)}<br />
              Médico clínico: {pr(ant.medicoCabecera)}<br />
              Hospital/Clínica de derivación: {pr(ant.hospitalDerivacion)}
            </div>
          </div>

          {/* Columna derecha: Historia Clínica Odontológica */}
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '11pt', marginBottom: '4px', borderBottom: '1px solid #000', paddingBottom: '2px' }}>
              Historia Clínica Odontológica
            </div>
            <div style={{ marginBottom: '3px' }}>
              Por qué asistió a la consulta?<br />
              <span style={{ borderBottom: '1px dotted #000', display: 'block', minHeight: '14px' }}>{pr(hco.motivo)}</span>
            </div>
            <PRow lbl="Consultó otro profesional?" sino={snBx(hco.consultoProfesional)} txt="" />
            <PRow lbl="Tomó algún medicamento?" sino={snBx(hco.tomoMed)} txt={hco.medNombre} />
            {hco.tomoMed && <div style={{ fontSize: '8pt', paddingLeft: '8px' }}>Desde: {pr(hco.desde)} · Resultados: {snBx(hco.resultados)}</div>}
            <div style={{ marginBottom: '3px' }}>
              Ha tenido dolor? {snBx(hco.dolor)}<br />
              {hco.dolor && <>
                Tipo: {bx(hco.dSuave)} Suave {bx(hco.dModerado)} Moderado {bx(hco.dIntenso)} Intenso<br />
                {bx(hco.dTemporario)} Temporario {bx(hco.dIntermitente)} Intermitente {bx(hco.dContinuo)} Continuo<br />
                {bx(hco.dEspontaneo)} Espontáneo {bx(hco.dProvocado)} Provocado {bx(hco.dFrio)} Frío {bx(hco.dCalor)} Calor<br />
                Localizado {bx(hco.dLocalizado)}: {pr(hco.dLocDonde)}<br />
                Irradiado {bx(hco.dIrradiado)}: {pr(hco.dIrrHacia)}<br />
                Puede calmarlo con: {pr(hco.dCalmar)}
              </>}
            </div>
            <PRow lbl="Golpe en los dientes?" sino={snBx(hco.golpe)} txt={hco.golpeComo} />
            <PRow lbl="Se fracturó algún diente?" sino={snBx(hco.fractura)} txt={hco.fracturaCual} />
            {(hco.difHablar || hco.difMasticar || hco.difAbrir || hco.difTragar) && (
              <div style={{ marginBottom: '3px', fontSize: '8.5pt' }}>
                Dificultad hablar: {pr(hco.difHablar, '—')} · masticar: {pr(hco.difMasticar, '—')}<br />
                abrir boca: {pr(hco.difAbrir, '—')} · tragar: {pr(hco.difTragar, '—')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== PÁGINA 2 ===== */}
      <div style={{ padding: '0' }}>
        {/* Header simple página 2 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #000', paddingBottom: '4px', marginBottom: '6px', fontSize: '8.5pt' }}>
          <span><strong>{config.nombreProfesional}</strong> — MP {matricula}</span>
          <span>Paciente: <strong>{paciente.nombre} {paciente.apellido}</strong></span>
          <span>Fecha: {fecha ? new Date(fecha + 'T12:00').toLocaleDateString('es-AR') : '___'}</span>
        </div>

        {/* Continuación HC Odontológica: examen oral */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '6px' }}>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '9pt', marginBottom: '2px' }}>Examen de tejidos blandos</div>
            {([['Labios', hco.labios], ['Lengua', hco.lengua], ['Paladar', hco.paladar],
               ['Piso de boca', hco.pisoBoca], ['Carrillos', hco.carrillos]] as [string, string][]).map(([k, v]) =>
              <div key={k} style={{ marginBottom: '1px', fontSize: '8.5pt' }}>{k}: {pr(v)}</div>
            )}
            <div style={{ marginTop: '3px' }}>
              Lesiones presentes:<br />
              Manchas {snBx(hco.manchas)} · Abultamiento {snBx(hco.abultamiento)}<br />
              Ulceraciones {snBx(hco.ulceraciones)} · Ampollas {snBx(hco.ampollas)}<br />
              Otras: {pr(hco.otrasLesiones)}
            </div>
          </div>
          <div>
            <PRow lbl="Sangrado de encías?" sino={snBx(hco.sangradoEncias)} txt={hco.sangradoCuando} />
            <PRow lbl="Sale pus?" sino={snBx(hco.pus)} txt={hco.pusDonde} />
            <PRow lbl="Movilidad dentaria?" sino={snBx(hco.movilidad)} txt={hco.altos} />
            <PRow lbl="Cara hinchada?" sino={snBx(hco.hinchada)} txt={hco.hinchadaQue} />
            <div style={{ marginTop: '3px', fontSize: '8.5pt' }}>
              Momentos de azúcar diario: {pr(hco.azucar)}<br />
              Índice de placa: {pr(hco.placa)}
            </div>
            <div style={{ marginTop: '3px', fontSize: '8.5pt' }}>
              Estado de la higiene bucal:<br />
              {['muy_bueno', 'bueno', 'deficiente', 'malo'].map(v => (
                <span key={v}>{bx(hco.higiene === v)} {hig[v as keyof typeof hig]}{'  '}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Declaración */}
        <div style={{ fontStyle: 'italic', fontSize: '7.5pt', marginBottom: '6px', borderTop: '1px dotted #ccc', paddingTop: '4px' }}>
          Declaro que he contestado todas las preguntas con honestidad y según mi conocimiento. Asimismo, he sido informado que los datos suministrados quedan reservados en la presente <strong>Historia Clínica</strong> y amparados en secreto profesional.
        </div>

        {/* Odontograma */}
        <div style={{ border: '1px solid #888', padding: '6px', marginBottom: '6px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '8.5pt', marginBottom: '4px' }}>ODONTOGRAMA</div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <OdontogramaPrint odontograma={odontograma} />
            </div>
            <div style={{ width: '110px', fontSize: '7.5pt', border: '1px solid #000', padding: '4px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>REFERENCIAS</div>
              {[['■ ROJO', 'Prestaciones existentes'], ['■ AZUL', 'Prestaciones requeridas'],
                ['X', 'Diente ausente o a extraer']].map(([s, d]) => (
                <div key={s}><span style={{ color: s.includes('ROJO') ? 'red' : s.includes('AZUL') ? 'blue' : '#000' }}>{s}</span> {d}</div>
              ))}
            </div>
          </div>
          <div style={{ marginTop: '4px', fontSize: '8.5pt' }}>
            <strong>Estado bucal general:</strong> Presencia de sarro {snBx(diag.sarro)}{'   '}
            Enfermedad periodontal {snBx(diag.periodontal)}
          </div>
          {odontograma?.notas && <div style={{ fontSize: '8pt', marginTop: '2px', fontStyle: 'italic' }}>Notas: {odontograma.notas}</div>}
        </div>

        {/* Diagnóstico, plan, observaciones */}
        <div style={{ marginBottom: '4px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '9pt', textDecoration: 'underline' }}>Diagnóstico presuntivo</div>
          <div style={{ minHeight: '36px', borderBottom: '1px dotted #ccc', padding: '2px 0', fontSize: '8.5pt', whiteSpace: 'pre-wrap' }}>{pr(diag.diagnostico)}</div>
        </div>
        <div style={{ marginBottom: '4px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '9pt', textDecoration: 'underline' }}>
            Plan de tratamiento{'   '}<span style={{ fontSize: '8pt', fontWeight: 'normal' }}>fecha: {pr(diag.planFecha)}</span>
          </div>
          <div style={{ minHeight: '36px', borderBottom: '1px dotted #ccc', padding: '2px 0', fontSize: '8.5pt', whiteSpace: 'pre-wrap' }}>{pr(diag.plan)}</div>
        </div>
        <div style={{ marginBottom: '4px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '9pt', textDecoration: 'underline' }}>Observaciones</div>
          <div style={{ minHeight: '28px', borderBottom: '1px dotted #ccc', padding: '2px 0', fontSize: '8.5pt', whiteSpace: 'pre-wrap' }}>{pr(diag.observaciones)}</div>
        </div>

        {/* Consentimiento informado */}
        <div style={{ marginTop: '8px', fontSize: '8pt', borderTop: '1px solid #000', paddingTop: '4px' }}>
          He comprendido todas las explicaciones que se me han facilitado en lenguaje claro y sencillo, he podido realizar todas las observaciones y se me han aclarado todas las dudas; por lo que estoy completamente de acuerdo con el tratamiento que se me va a realizar.
        </div>
        <div style={{ marginTop: '4px', fontSize: '8pt' }}>
          El/la que suscribe _____________________________________ DNI Nº __________________ con domicilio en ___________________________
        </div>
        <div style={{ marginTop: '2px', fontSize: '8pt' }}>
          otorgo mi consentimiento para realizar el tratamiento necesario para rehabilitar mi salud bucodental propuesta por el/la Dr/a MP {matricula}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: '24px' }}>
          {[['Firma del paciente o tutor', ''], ['Aclaración', ''], ['DNI Nº', '']].map(([lbl]) => (
            <div key={lbl} style={{ borderTop: '1px solid #000', paddingTop: '2px', textAlign: 'center', fontSize: '8pt' }}>{lbl}</div>
          ))}
        </div>

        {/* Firma profesional */}
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '160px', borderTop: '1px solid #000', paddingTop: '2px', textAlign: 'center', fontSize: '8pt' }}>
            Firma y sello del profesional
          </div>
        </div>

        {/* Registro de prestaciones (consultas) */}
        {consultas.length > 0 && (
          <div style={{ marginTop: '12px', pageBreakBefore: 'always' }}>
            <div style={{ fontWeight: 'bold', fontSize: '11pt', textAlign: 'center', marginBottom: '6px' }}>Registro de Prestaciones</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8pt' }}>
              <thead>
                <tr>
                  {['Fecha y hora', 'Tratamiento realizado e indicaciones', 'Prof. actuante', 'Próxima consulta', 'Costo', 'Saldo'].map(h => (
                    <th key={h} style={{ border: '1px solid #000', padding: '3px 4px', textAlign: 'left', fontWeight: 'bold', fontSize: '7.5pt' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {consultas.map(c => (
                  <tr key={c.id}>
                    <td style={{ border: '1px solid #000', padding: '3px 4px', whiteSpace: 'nowrap' }}>
                      {new Date(c.fecha + 'T12:00').toLocaleDateString('es-AR')}
                    </td>
                    <td style={{ border: '1px solid #000', padding: '3px 4px' }}>{c.tratamiento}</td>
                    <td style={{ border: '1px solid #000', padding: '3px 4px' }}>{c.profesional}</td>
                    <td style={{ border: '1px solid #000', padding: '3px 4px' }}>{c.proximaVisita || ''}</td>
                    <td style={{ border: '1px solid #000', padding: '3px 4px' }}></td>
                    <td style={{ border: '1px solid #000', padding: '3px 4px' }}></td>
                  </tr>
                ))}
                {/* Filas vacías para completar a mano */}
                {Array.from({ length: Math.max(0, 10 - consultas.length) }).map((_, i) => (
                  <tr key={`empty-${i}`}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} style={{ border: '1px solid #000', padding: '6px 4px' }}></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  // ── Form sections ─────────────────────────────────────────────────────────

  const TabDatos = () => (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">Los datos del paciente se completan automáticamente desde su ficha. Completá los campos adicionales del formulario.</p>
      <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-xl p-3">
        <div><span className="text-[10px] text-gray-400 uppercase">Nombre</span><p className="text-sm font-semibold">{paciente.nombre} {paciente.apellido}</p></div>
        <div><span className="text-[10px] text-gray-400 uppercase">DNI</span><p className="text-sm">{paciente.dni || '—'}</p></div>
        <div><span className="text-[10px] text-gray-400 uppercase">Edad</span><p className="text-sm">{paciente.edad} años</p></div>
        <div><span className="text-[10px] text-gray-400 uppercase">Teléfono</span><p className="text-sm">{paciente.telefono || '—'}</p></div>
        <div><span className="text-[10px] text-gray-400 uppercase">Obra Social</span><p className="text-sm">{paciente.obraSocial || '—'}</p></div>
        <div><span className="text-[10px] text-gray-400 uppercase">Email</span><p className="text-sm">{paciente.email || '—'}</p></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Fecha HC"><Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="text-xs border-gray-200 rounded-lg" /></Field>
        <Field label="Lugar"><TxtInput value={lugar} onChange={setLugar} placeholder="Ciudad/Consultorio" /></Field>
        <Field label="Nº Afiliado"><TxtInput value={nroAfil} onChange={setNroAfil} placeholder="Número de afiliado" /></Field>
      </div>
    </div>
  );

  const TabAnt = () => (
    <div className="space-y-1">
      <p className="text-[10px] text-gray-400 italic mb-2">Este cuestionario tiene el tenor de una "Declaración Jurada"</p>
      <div className="grid grid-cols-1 gap-1.5">
        <SiNoBtn label="¿Padre con vida?" value={ant.padreVida} onChange={v => setA('padreVida', v)} />
        {ant.padreVida !== null && <TxtInput value={ant.padreEnf} onChange={v => setA('padreEnf', v)} placeholder="Enfermedad que padece o padeció" />}
        <SiNoBtn label="¿Madre con vida?" value={ant.madreVida} onChange={v => setA('madreVida', v)} />
        {ant.madreVida !== null && <TxtInput value={ant.madreEnf} onChange={v => setA('madreEnf', v)} placeholder="Enfermedad que padece o padeció" />}
        <SiNoBtn label="¿Tiene hermanos? ¿Son sanos?" value={ant.hermanos} onChange={v => setA('hermanos', v)} />
        <SiNoBtn label="¿Sufre de alguna enfermedad?" value={ant.enfermedad} onChange={v => setA('enfermedad', v)} />
        {ant.enfermedad && <TxtInput value={ant.enfermedadCual} onChange={v => setA('enfermedadCual', v)} placeholder="¿Cuál?" />}
        <SiNoBtn label="¿Hace algún tratamiento médico?" value={ant.tratMedico} onChange={v => setA('tratMedico', v)} />
        {ant.tratMedico && <TxtInput value={ant.tratCual} onChange={v => setA('tratCual', v)} placeholder="¿Cuál?" />}
        <Field label="Medicamentos que consume habitualmente"><TxtInput value={ant.medicHabitual} onChange={v => setA('medicHabitual', v)} multiline /></Field>
        <Field label="Medicamentos consumidos en los últimos 5 años"><TxtInput value={ant.medic5anos} onChange={v => setA('medic5anos', v)} multiline /></Field>
        <SiNoBtn label="¿Realiza algún deporte?" value={ant.deporte} onChange={v => setA('deporte', v)} />
        <SiNoBtn label="¿Nota malestar al realizarlo?" value={ant.malDeporte} onChange={v => setA('malDeporte', v)} />
        <SiNoBtn label="¿Es alérgico a alguna droga?" value={ant.alergiaDroga} onChange={v => setA('alergiaDroga', v)} />
        {ant.alergiaDroga && (
          <div className="pl-3 space-y-1">
            <SiNoBtn label="Alérgico a la anestesia" value={ant.alAnestesia} onChange={v => setA('alAnestesia', v)} />
            <SiNoBtn label="Alérgico a la penicilina" value={ant.alPenicilina} onChange={v => setA('alPenicilina', v)} />
            <TxtInput value={ant.alOtros} onChange={v => setA('alOtros', v)} placeholder="Otras alergias" />
          </div>
        )}
        <Field label="Cicatrización / Sangrado"><TxtInput value={ant.cicatrizacion} onChange={v => setA('cicatrizacion', v)} placeholder="¿Cicatriza bien? ¿Sangra mucho?" /></Field>
        <SiNoBtn label="¿Tiene problema de colágeno (hiperlaxitud)?" value={ant.colageno} onChange={v => setA('colageno', v)} />
        <SiNoBtn label="¿Antecedentes de fiebre reumática?" value={ant.fiebreReumatica} onChange={v => setA('fiebreReumatica', v)} />
        {ant.fiebreReumatica && <TxtInput value={ant.medFR} onChange={v => setA('medFR', v)} placeholder="¿Se protege con alguna medicación?" />}
        <SiNoBtn label="¿Es diabético?" value={ant.diabetico} onChange={v => setA('diabetico', v)} />
        {ant.diabetico && <TxtInput value={ant.diabControl} onChange={v => setA('diabControl', v)} placeholder="¿Está controlado? ¿Con qué?" />}
        <SiNoBtn label="¿Tiene algún problema cardíaco?" value={ant.cardiaco} onChange={v => setA('cardiaco', v)} />
        {ant.cardiaco && <TxtInput value={ant.cardiacoCual} onChange={v => setA('cardiacoCual', v)} placeholder="¿Cuál?" />}
        <SiNoBtn label="¿Toma aspirina y/o anticoagulante?" value={ant.aspirina} onChange={v => setA('aspirina', v)} />
        {ant.aspirina && <TxtInput value={ant.aspirinFrec} onChange={v => setA('aspirinFrec', v)} placeholder="¿Con qué frecuencia?" />}
        <SiNoBtn label="¿Tiene presión alta?" value={ant.presionAlta} onChange={v => setA('presionAlta', v)} />
        <SiNoBtn label="¿Chagas?" value={ant.chagas} onChange={v => setA('chagas', v)} />
        {ant.chagas && <TxtInput value={ant.chagasTrat} onChange={v => setA('chagasTrat', v)} placeholder="¿Está en tratamiento?" />}
        <SiNoBtn label="¿Tiene problemas renales?" value={ant.renales} onChange={v => setA('renales', v)} />
        <SiNoBtn label="¿Úlcera gástrica?" value={ant.ulcera} onChange={v => setA('ulcera', v)} />
        <SiNoBtn label="¿Tuvo hepatitis?" value={ant.hepatitis} onChange={v => setA('hepatitis', v)} />
        {ant.hepatitis && <TxtInput value={ant.hepatTipo} onChange={v => setA('hepatTipo', v)} placeholder="Tipo (A / B / C)" />}
        <SiNoBtn label="¿Tiene algún problema hepático?" value={ant.hepatico} onChange={v => setA('hepatico', v)} />
        {ant.hepatico && <TxtInput value={ant.hepaticoCual} onChange={v => setA('hepaticoCual', v)} placeholder="¿Cuál?" />}
        <SiNoBtn label="¿Tuvo convulsiones?" value={ant.convulsiones} onChange={v => setA('convulsiones', v)} />
        <SiNoBtn label="¿Es epiléptico?" value={ant.epileptico} onChange={v => setA('epileptico', v)} />
        {ant.epileptico && <TxtInput value={ant.epilepMed} onChange={v => setA('epilepMed', v)} placeholder="Medicación que toma" />}
        <SiNoBtn label="¿Tuvo Sífilis o Gonorrea?" value={ant.sifilis} onChange={v => setA('sifilis', v)} />
        <SiNoBtn label="¿Otra enfermedad infecto-contagiosa?" value={ant.infecciosa} onChange={v => setA('infecciosa', v)} />
        <SiNoBtn label="¿Tuvo transfusiones?" value={ant.transfusiones} onChange={v => setA('transfusiones', v)} />
        <SiNoBtn label="¿Fue operado alguna vez?" value={ant.operado} onChange={v => setA('operado', v)} />
        {ant.operado && (
          <div className="pl-3 grid grid-cols-2 gap-1.5">
            <TxtInput value={ant.operadoCual} onChange={v => setA('operadoCual', v)} placeholder="¿De qué?" />
            <TxtInput value={ant.operadoCuando} onChange={v => setA('operadoCuando', v)} placeholder="¿Cuándo?" />
          </div>
        )}
        <SiNoBtn label="¿Tiene algún problema respiratorio?" value={ant.respiratorio} onChange={v => setA('respiratorio', v)} />
        {ant.respiratorio && <TxtInput value={ant.respirCual} onChange={v => setA('respirCual', v)} placeholder="¿Cuál?" />}
        <SiNoBtn label="¿Fuma?" value={ant.fuma} onChange={v => setA('fuma', v)} />
        <SiNoBtn label="¿Está embarazada?" value={ant.embarazada} onChange={v => setA('embarazada', v)} />
        {ant.embarazada && <TxtInput value={ant.embMeses} onChange={v => setA('embMeses', v)} placeholder="¿De cuántos meses?" />}
        <SiNoBtn label="¿Hay otra enfermedad o recomendación médica?" value={ant.otraEnf} onChange={v => setA('otraEnf', v)} />
        {ant.otraEnf && <TxtInput value={ant.otraEnfCual} onChange={v => setA('otraEnfCual', v)} placeholder="¿Cuál?" multiline />}
        <Field label="Tratamiento homeopático/acupuntura/otros"><TxtInput value={ant.tratAlternativo} onChange={v => setA('tratAlternativo', v)} /></Field>
        <Field label="Médico clínico"><TxtInput value={ant.medicoCabecera} onChange={v => setA('medicoCabecera', v)} /></Field>
        <Field label="Clínica/Hospital de derivación"><TxtInput value={ant.hospitalDerivacion} onChange={v => setA('hospitalDerivacion', v)} /></Field>
      </div>
    </div>
  );

  const TabHCO = () => (
    <div className="space-y-2">
      <Field label="¿Por qué asistió a la consulta?"><TxtInput value={hco.motivo} onChange={v => setH('motivo', v)} placeholder="Motivo de consulta" multiline /></Field>
      <SiNoBtn label="¿Consultó antes con otro profesional?" value={hco.consultoProfesional} onChange={v => setH('consultoProfesional', v)} />
      <SiNoBtn label="¿Tomó algún medicamento?" value={hco.tomoMed} onChange={v => setH('tomoMed', v)} />
      {hco.tomoMed && (
        <div className="pl-3 space-y-1.5">
          <TxtInput value={hco.medNombre} onChange={v => setH('medNombre', v)} placeholder="Nombre del medicamento" />
          <div className="grid grid-cols-2 gap-2">
            <Field label="Desde cuándo"><TxtInput value={hco.desde} onChange={v => setH('desde', v)} /></Field>
            <SiNoBtn label="¿Obtuvo resultados?" value={hco.resultados} onChange={v => setH('resultados', v)} />
          </div>
        </div>
      )}

      <div className="border rounded-xl p-3 space-y-1.5">
        <SiNoBtn label="¿Ha tenido dolor?" value={hco.dolor} onChange={v => setH('dolor', v)} />
        {hco.dolor && (
          <>
            <div className="text-[10px] text-gray-500 uppercase tracking-wide mt-1">Tipo de dolor</div>
            <div className="grid grid-cols-3 gap-1">
              {([['dSuave','Suave'],['dModerado','Moderado'],['dIntenso','Intenso'],
                ['dTemporario','Temporario'],['dIntermitente','Intermitente'],['dContinuo','Continuo'],
                ['dEspontaneo','Espontáneo'],['dProvocado','Provocado'],['dFrio','Al frío'],['dCalor','Al calor']] as [keyof HCOdonto, string][]).map(([k, lbl]) => (
                <label key={k} className="flex items-center gap-1 text-[11px] cursor-pointer">
                  <input type="checkbox" checked={hco[k] as boolean} onChange={e => setH(k, e.target.checked as any)} className="w-3 h-3" />
                  {lbl}
                </label>
              ))}
            </div>
            <SiNoBtn label="¿Localizado?" value={hco.dLocalizado ? true : null} onChange={v => setH('dLocalizado', v === true)} />
            {hco.dLocalizado && <TxtInput value={hco.dLocDonde} onChange={v => setH('dLocDonde', v)} placeholder="¿Dónde?" />}
            <SiNoBtn label="¿Irradiado?" value={hco.dIrradiado ? true : null} onChange={v => setH('dIrradiado', v === true)} />
            {hco.dIrradiado && <TxtInput value={hco.dIrrHacia} onChange={v => setH('dIrrHacia', v)} placeholder="¿Hacia dónde?" />}
            <Field label="¿Puede calmarlo con algo?"><TxtInput value={hco.dCalmar} onChange={v => setH('dCalmar', v)} /></Field>
          </>
        )}
      </div>

      <SiNoBtn label="¿Sufrió algún golpe en los dientes?" value={hco.golpe} onChange={v => setH('golpe', v)} />
      {hco.golpe && (
        <div className="pl-3 grid grid-cols-2 gap-1.5">
          <TxtInput value={hco.golpeCuando} onChange={v => setH('golpeCuando', v)} placeholder="¿Cuándo?" />
          <TxtInput value={hco.golpeComo} onChange={v => setH('golpeComo', v)} placeholder="¿Cómo se produjo?" />
        </div>
      )}
      <SiNoBtn label="¿Se fracturó algún diente?" value={hco.fractura} onChange={v => setH('fractura', v)} />
      {hco.fractura && (
        <div className="pl-3 grid grid-cols-2 gap-1.5">
          <TxtInput value={hco.fracturaCual} onChange={v => setH('fracturaCual', v)} placeholder="¿Cuál?" />
          <TxtInput value={hco.fracturaTrat} onChange={v => setH('fracturaTrat', v)} placeholder="¿Recibió tratamiento?" />
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Field label="Dificultad para hablar"><TxtInput value={hco.difHablar} onChange={v => setH('difHablar', v)} /></Field>
        <Field label="Dificultad para masticar"><TxtInput value={hco.difMasticar} onChange={v => setH('difMasticar', v)} /></Field>
        <Field label="Dificultad para abrir la boca"><TxtInput value={hco.difAbrir} onChange={v => setH('difAbrir', v)} /></Field>
        <Field label="Dificultad para tragar"><TxtInput value={hco.difTragar} onChange={v => setH('difTragar', v)} /></Field>
      </div>

      <div className="border-t pt-2 mt-2">
        <p className="text-[10px] font-bold uppercase text-gray-500 mb-2">Examen de tejidos blandos</p>
        <div className="grid grid-cols-2 gap-1.5">
          {([['labios','Labios'],['lengua','Lengua'],['paladar','Paladar'],
            ['pisoBoca','Piso de boca'],['carrillos','Carrillos'],['rebordes','Rebordes']] as [keyof HCOdonto, string][]).map(([k, lbl]) => (
            <Field key={k} label={lbl}><TxtInput value={hco[k] as string} onChange={v => setH(k, v as any)} placeholder="Normal / Anormal..." /></Field>
          ))}
        </div>
        <div className="mt-2 space-y-1">
          <p className="text-[10px] font-bold uppercase text-gray-500">Tipo de lesiones</p>
          {([['manchas','Manchas'],['abultamiento','Abultamiento de tejidos'],
            ['ulceraciones','Ulceraciones'],['ampollas','Ampollas']] as [keyof HCOdonto, string][]).map(([k, lbl]) => (
            <SiNoBtn key={k} label={lbl} value={hco[k] as SiNo} onChange={v => setH(k, v as any)} />
          ))}
          <Field label="Otras lesiones"><TxtInput value={hco.otrasLesiones} onChange={v => setH('otrasLesiones', v)} /></Field>
        </div>
        <div className="mt-2 space-y-1">
          <SiNoBtn label="¿Le sangran las encías?" value={hco.sangradoEncias} onChange={v => setH('sangradoEncias', v)} />
          {hco.sangradoEncias && <TxtInput value={hco.sangradoCuando} onChange={v => setH('sangradoCuando', v)} placeholder="¿Cuándo?" />}
          <SiNoBtn label="¿Sale pus de algún lugar de la boca?" value={hco.pus} onChange={v => setH('pus', v)} />
          {hco.pus && <TxtInput value={hco.pusDonde} onChange={v => setH('pusDonde', v)} placeholder="¿De dónde?" />}
          <SiNoBtn label="¿Tiene movilidad en los dientes?" value={hco.movilidad} onChange={v => setH('movilidad', v)} />
          {hco.movilidad && <TxtInput value={hco.altos} onChange={v => setH('altos', v)} placeholder="¿Al morder siente los dientes altos?" />}
          <SiNoBtn label="¿Ha tenido la cara hinchada?" value={hco.hinchada} onChange={v => setH('hinchada', v)} />
          {hco.hinchada && <TxtInput value={hco.hinchadaQue} onChange={v => setH('hinchadaQue', v)} placeholder="¿Hielo? ¿Calor? ¿Otros?" />}
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Field label="Momentos de azúcar diario"><TxtInput value={hco.azucar} onChange={v => setH('azucar', v)} /></Field>
          <Field label="Índice de placa"><TxtInput value={hco.placa} onChange={v => setH('placa', v)} /></Field>
        </div>
        <div className="mt-2">
          <p className="text-[10px] font-bold uppercase text-gray-500 mb-1">Estado de la higiene bucal</p>
          <div className="flex gap-2">
            {(['muy_bueno','bueno','deficiente','malo'] as const).map(v => (
              <button key={v} type="button" onClick={() => setH('higiene', hco.higiene === v ? '' : v)}
                className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${hco.higiene === v ? 'bg-cyan-600 text-white border-cyan-600' : 'border-gray-300 text-gray-500'}`}>
                {hig[v]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const TabDiag = () => (
    <div className="space-y-3">
      <div className="flex gap-4">
        <SiNoBtn label="Presencia de sarro" value={diag.sarro} onChange={v => setD('sarro', v)} />
        <SiNoBtn label="Enfermedad periodontal" value={diag.periodontal} onChange={v => setD('periodontal', v)} />
      </div>
      <Field label="Diagnóstico presuntivo"><TxtInput value={diag.diagnostico} onChange={v => setD('diagnostico', v)} multiline placeholder="Diagnóstico presuntivo..." /></Field>
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2"><Field label="Plan de tratamiento"><TxtInput value={diag.plan} onChange={v => setD('plan', v)} multiline placeholder="Plan de tratamiento..." /></Field></div>
        <Field label="Fecha del plan"><Input type="date" value={diag.planFecha} onChange={e => setD('planFecha', e.target.value)} className="text-xs border-gray-200 rounded-lg" /></Field>
      </div>
      <Field label="Observaciones"><TxtInput value={diag.observaciones} onChange={v => setD('observaciones', v)} multiline placeholder="Observaciones..." /></Field>
      <Field label="Estudios radiográficos y/o complementarios"><TxtInput value={diag.estudios} onChange={v => setD('estudios', v)} multiline /></Field>
      <Field label="Continúa en Anexo Nº"><TxtInput value={diag.continuaAnexo} onChange={v => setD('continuaAnexo', v)} placeholder="Número de anexo" /></Field>
    </div>
  );

  const tabContent = [<TabDatos />, <TabAnt />, <TabHCO />, <TabDiag />];

  return (
    <>
      <PrintView />
      <div className="screen-only fixed inset-0 z-50 flex items-center justify-center p-2" style={{ background: 'rgba(0,0,0,0.5)' }}>
        <div className="bg-white rounded-2xl shadow-2xl flex flex-col" style={{ width: '640px', maxHeight: '94vh', height: '94vh' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <div>
              <h2 className="text-base font-extrabold text-gray-800">Historia Clínica General</h2>
              <p className="text-xs text-gray-400">{paciente.nombre} {paciente.apellido} · Colegio de Odontólogos de Córdoba</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handlePrint} className="rounded-full gap-1.5 text-xs">
                <Printer size={13} /> Imprimir
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving} className="rounded-full gap-1.5 text-xs" style={{ background: 'var(--cyan)', color: 'var(--dark)' }}>
                <Save size={13} /> {saving ? 'Guardando...' : 'Guardar'}
              </Button>
              <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400"><X size={16} /></button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b px-4 pt-1 gap-1 flex-shrink-0">
            {TABS.map((t, i) => (
              <button key={t} onClick={() => setTab(i)}
                className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors ${tab === i ? 'text-cyan-700 border-b-2 border-cyan-600' : 'text-gray-400 hover:text-gray-600'}`}>
                {t}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {tabContent[tab]}
          </div>

          {/* Footer nav */}
          <div className="flex items-center justify-between px-5 py-3 border-t bg-gray-50 rounded-b-2xl">
            <button onClick={() => setTab(t => Math.max(0, t - 1))} disabled={tab === 0}
              className="flex items-center gap-1 text-xs text-gray-500 disabled:opacity-30">
              <ChevronLeft size={14} /> Anterior
            </button>
            <span className="text-xs text-gray-400">{tab + 1} / {TABS.length}</span>
            <button onClick={() => setTab(t => Math.min(TABS.length - 1, t + 1))} disabled={tab === TABS.length - 1}
              className="flex items-center gap-1 text-xs text-gray-500 disabled:opacity-30">
              Siguiente <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Helper para filas de impresión
function PRow({ lbl, sino, txt }: { lbl: string; sino: string; txt: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px', borderBottom: '1px dotted #ccc', paddingBottom: '1px', marginBottom: '1px', fontSize: '8.5pt' }}>
      <span style={{ flex: 1 }}>{lbl}</span>
      <span style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>{sino}</span>
      {txt && <span style={{ fontSize: '8pt', color: '#333', flexShrink: 0, maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{txt}</span>}
    </div>
  );
}
