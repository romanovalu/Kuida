import { useState, useMemo } from 'react';
import type {
  Paciente, Rubro, Odontograma, DienteEstado, TipoTooth, CaraColor,
  Medicion, NotaClinica, HistorialServicio, Configuracion, Receta,
} from '../types';
import { uid } from '../store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Save, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import RecetasSection from './RecetaModal';

const RUBROS_SALUD = ['odontologia','medicina','psicologia','psicopedagogia','kinesiologia'];

interface Props {
  paciente: Paciente;
  config: Configuracion;
  odontogramas: Odontograma[];
  mediciones: Medicion[];
  notasClinicas: NotaClinica[];
  historialServicios: HistorialServicio[];
  recetas: Receta[];
  onSaveOdontograma: (o: Odontograma) => void;
  onSaveMedicion: (m: Medicion) => void;
  onDeleteMedicion: (id: string) => void;
  onSaveNota: (n: NotaClinica) => void;
  onDeleteNota: (id: string) => void;
  onSaveServicioHist: (h: HistorialServicio) => void;
  onDeleteServicioHist: (id: string) => void;
  onSaveReceta: (r: Receta) => void;
  onDeleteReceta: (id: string) => void;
  onClose: () => void;
}

export default function FichaProfesional({ paciente, config, odontogramas, mediciones, notasClinicas, historialServicios, recetas, onSaveOdontograma, onSaveMedicion, onDeleteMedicion, onSaveNota, onDeleteNota, onSaveServicioHist, onDeleteServicioHist, onSaveReceta, onDeleteReceta, onClose }: Props) {
  const rubro = config.rubro;

  const miOdontograma = odontogramas.find(o => o.pacienteId === paciente.id);
  const misMediciones = useMemo(() => mediciones.filter(m => m.pacienteId === paciente.id).sort((a, b) => b.fecha.localeCompare(a.fecha)), [mediciones, paciente.id]);
  const misNotas = useMemo(() => notasClinicas.filter(n => n.pacienteId === paciente.id).sort((a, b) => b.fecha.localeCompare(a.fecha)), [notasClinicas, paciente.id]);
  const misServicios = useMemo(() => historialServicios.filter(h => h.pacienteId === paciente.id).sort((a, b) => b.fecha.localeCompare(a.fecha)), [historialServicios, paciente.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl w-full max-w-lg flex flex-col" style={{ maxHeight: '92vh' }}>
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100 flex-shrink-0">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--cyan-dark)' }}>
              {['peluqueria','estetica','otro'].includes(rubro) ? 'Ficha cliente' : 'Ficha profesional'}
            </p>
            <p className="text-base font-extrabold" style={{ color: 'var(--dark)' }}>{paciente.nombre} {paciente.apellido}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* ── Odontograma ── */}
          {rubro === 'odontologia' && (
            <OdontogramaSection
              pacienteId={paciente.id}
              odontograma={miOdontograma}
              onSave={onSaveOdontograma}
            />
          )}

          {/* ── Notas clínicas: psicología, medicina, kinesiología ── */}
          {(['psicologia', 'psicopedagogia', 'medicina', 'kinesiologia'] as Rubro[]).includes(rubro) && (
            <NotasSection
              pacienteId={paciente.id}
              rubro={rubro}
              notas={misNotas}
              onSave={onSaveNota}
              onDelete={onDeleteNota}
            />
          )}

          {/* ── Mediciones: nutrición + kinesiología ── */}
          {(['nutricion', 'kinesiologia', 'medicina'] as Rubro[]).includes(rubro) && (
            <MedicionesSection
              pacienteId={paciente.id}
              rubro={rubro}
              mediciones={misMediciones}
              onSave={onSaveMedicion}
              onDelete={onDeleteMedicion}
            />
          )}

          {/* ── Historial de servicios: peluquería, estética ── */}
          {(['peluqueria', 'estetica'] as Rubro[]).includes(rubro) && (
            <ServiciosHistSection
              pacienteId={paciente.id}
              rubro={rubro}
              historial={misServicios}
              onSave={onSaveServicioHist}
              onDelete={onDeleteServicioHist}
            />
          )}

          {/* ── Otro ── */}
          {rubro === 'otro' && (
            <NotasSection
              pacienteId={paciente.id}
              rubro={rubro}
              notas={misNotas}
              onSave={onSaveNota}
              onDelete={onDeleteNota}
            />
          )}

          {/* ── Recetas (rubros de salud) ── */}
          {(RUBROS_SALUD as string[]).includes(rubro) && (
            <RecetasSection
              paciente={paciente}
              config={config}
              recetas={recetas}
              onSave={onSaveReceta}
              onDelete={onDeleteReceta}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Odontograma ──────────────────────────────────────────────────────────────

type PincelMode = 'existente' | 'requerida' | 'borrar' | 'ausente' | 'protesis_fija' | 'protesis_removible' | 'corona';

// Cuadrantes adultos: [der-sup, izq-sup, izq-inf, der-inf]
const SUP_DER = [18,17,16,15,14,13,12,11];
const SUP_IZQ = [21,22,23,24,25,26,27,28];
const INF_DER = [48,47,46,45,44,43,42,41];
const INF_IZQ = [31,32,33,34,35,36,37,38];
// Temporarios
const TMP_SUP_DER = [55,54,53,52,51];
const TMP_SUP_IZQ = [61,62,63,64,65];
const TMP_INF_DER = [85,84,83,82,81];
const TMP_INF_IZQ = [71,72,73,74,75];

type Cara = 'vestibular' | 'lingual' | 'mesial' | 'distal' | 'oclusal';

const CARA_COLORS: Record<string, string> = {
  existente: '#EF4444',
  requerida: '#3B82F6',
  '': '#FFFFFF',
};

function OdontogramaSection({ pacienteId, odontograma, onSave }: {
  pacienteId: string; odontograma?: Odontograma; onSave: (o: Odontograma) => void;
}) {
  const [dientes, setDientes] = useState<Record<string, DienteEstado>>(odontograma?.dientes || {});
  const [notas, setNotas] = useState(odontograma?.notas || '');
  const [sarro, setSarro] = useState<boolean | null>(odontograma?.sarro ?? null);
  const [perio, setPerio] = useState<boolean | null>(odontograma?.enfermedadPeriodontal ?? null);
  const [pincel, setPincel] = useState<PincelMode>('existente');
  const [saved, setSaved] = useState(false);

  const getDiente = (num: number): DienteEstado =>
    dientes[num] || { caras: {}, tipo: 'normal' };

  const getTipo = (num: number) => getDiente(num).tipo ?? (getDiente(num).ausente ? 'ausente' : 'normal');

  const pintarCara = (num: number, cara: Cara) => {
    if (['ausente', 'protesis_fija', 'protesis_removible', 'corona'].includes(pincel)) {
      setDientes(prev => {
        const d = prev[num] || { caras: {} };
        const currentTipo = d.tipo ?? (d.ausente ? 'ausente' : 'normal');
        const nextTipo = currentTipo === pincel ? 'normal' : pincel as TipoTooth;
        return { ...prev, [num]: { ...d, tipo: nextTipo, ausente: nextTipo === 'ausente', caras: nextTipo !== 'normal' ? {} : d.caras } };
      });
    } else {
      setDientes(prev => {
        const d = prev[num] || { caras: {} };
        const newCaras = { ...d.caras };
        if (pincel === 'borrar') {
          delete newCaras[cara];
        } else {
          const current = newCaras[cara];
          if (current === pincel) delete newCaras[cara];
          else newCaras[cara] = pincel as CaraColor;
        }
        return { ...prev, [num]: { ...d, caras: newCaras } };
      });
    }
  };

  const clickNumero = (num: number) => {
    if (['ausente', 'protesis_fija', 'protesis_removible', 'corona'].includes(pincel)) {
      setDientes(prev => {
        const d = prev[num] || { caras: {} };
        const currentTipo = d.tipo ?? (d.ausente ? 'ausente' : 'normal');
        const nextTipo = currentTipo === pincel ? 'normal' : pincel as TipoTooth;
        return { ...prev, [num]: { ...d, tipo: nextTipo, ausente: nextTipo === 'ausente', caras: nextTipo !== 'normal' ? {} : d.caras } };
      });
    }
  };

  const guardar = () => {
    onSave({ pacienteId, dientes, notas, sarro, enfermedadPeriodontal: perio, updatedAt: new Date().toISOString() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const getCaraColor = (num: number, cara: Cara) => {
    const d = getDiente(num);
    const tipo = d.tipo ?? (d.ausente ? 'ausente' : 'normal');
    if (tipo !== 'normal') return '#F3F4F6';
    return CARA_COLORS[d.caras[cara] || ''] ?? '#FFFFFF';
  };

  const PINCELES: { mode: PincelMode; label: string; bg: string; text: string; desc: string }[] = [
    { mode: 'existente',        label: 'Prestación existente',   bg: '#EF4444', text: 'white',   desc: 'Pinta caras en ROJO' },
    { mode: 'requerida',        label: 'Prestación requerida',   bg: '#3B82F6', text: 'white',   desc: 'Pinta caras en AZUL' },
    { mode: 'borrar',           label: 'Borrar cara',            bg: '#F9FAFB', text: '#374151', desc: 'Borra el color de una cara' },
    { mode: 'ausente',          label: '✕  Ausente / Extraer',   bg: '#F9FAFB', text: '#374151', desc: 'Marca el diente con X' },
    { mode: 'protesis_fija',    label: '▭  Prótesis Fija',       bg: '#F9FAFB', text: '#374151', desc: 'Prótesis fija' },
    { mode: 'protesis_removible', label: '▭  Prótesis Removible', bg: '#F9FAFB', text: '#374151', desc: 'Prótesis removible' },
    { mode: 'corona',           label: '○  Corona',              bg: '#F9FAFB', text: '#374151', desc: 'Corona' },
  ];

  const renderFila = (nums: number[], flip = false, size = 24) =>
    nums.map(num => (
      <DienteWidget key={num} num={num} diente={getDiente(num)} tipo={getTipo(num)} pincel={pincel}
        onPintarCara={cara => pintarCara(num, cara)}
        onClickNumero={() => clickNumero(num)}
        getCaraColor={cara => getCaraColor(num, cara)}
        size={size} flip={flip} />
    ));

  return (
    <div className="space-y-3">
      <SectionTitle>Odontograma</SectionTitle>

      {/* Referencias / Pinceles */}
      <div className="rounded-xl border border-gray-200 p-3 space-y-2">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Referencias</p>
        <div className="flex flex-wrap gap-1.5">
          {PINCELES.map(p => (
            <button key={p.mode} onClick={() => setPincel(p.mode)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold border-2 transition-all"
              style={{
                background: p.bg,
                color: p.text,
                borderColor: pincel === p.mode ? 'var(--dark)' : '#E5E7EB',
                fontWeight: pincel === p.mode ? 700 : 500,
              }}>
              {p.label}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-gray-400">
          {pincel === 'existente' || pincel === 'requerida' || pincel === 'borrar'
            ? 'Tocá una cara del diente para marcarla. Tocá de nuevo para desmarcar.'
            : 'Tocá el número del diente (o cualquier cara) para aplicar el marcador. Tocá de nuevo para quitar.'}
        </p>
      </div>

      {/* Cuadrícula */}
      <div className="overflow-x-auto pb-1">
        <div className="min-w-max space-y-px">
          {/* Labels */}
          <div className="flex items-center">
            <span className="text-[9px] font-bold text-gray-400 uppercase w-10 text-right pr-2">Der.</span>
            <div style={{ width: 8 * 24 + 7 }} />
            <div className="w-4" />
            <div style={{ width: 8 * 24 + 7 }} />
            <span className="text-[9px] font-bold text-gray-400 uppercase pl-2">Izq.</span>
          </div>
          {/* Superior adulto */}
          <div className="flex items-end">
            <span className="w-10" />
            {renderFila(SUP_DER)}
            <div className="w-4 self-center" style={{ borderLeft: '1.5px solid #9CA3AF', height: 36 }} />
            {renderFila(SUP_IZQ)}
          </div>
          {/* Superior temporario */}
          <div className="flex items-end">
            <span className="w-10 text-[8px] text-gray-400 text-right pr-1 self-end pb-1">temp</span>
            <div style={{ width: 3 * 24 + 2 }} />
            {renderFila(TMP_SUP_DER, false, 20)}
            <div className="w-4 self-center" style={{ borderLeft: '1.5px solid #9CA3AF', height: 28 }} />
            {renderFila(TMP_SUP_IZQ, false, 20)}
          </div>
          {/* Inferior temporario */}
          <div className="flex items-start">
            <span className="w-10" />
            <div style={{ width: 3 * 24 + 2 }} />
            {renderFila(TMP_INF_DER, true, 20)}
            <div className="w-4 self-center" style={{ borderLeft: '1.5px solid #9CA3AF', height: 28 }} />
            {renderFila(TMP_INF_IZQ, true, 20)}
          </div>
          {/* Inferior adulto */}
          <div className="flex items-start">
            <span className="w-10" />
            {renderFila(INF_DER, true)}
            <div className="w-4 self-center" style={{ borderLeft: '1.5px solid #9CA3AF', height: 36 }} />
            {renderFila(INF_IZQ, true)}
          </div>
        </div>
      </div>

      {/* Estado bucal */}
      <div className="flex flex-wrap gap-4 text-[12px]">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-600">Presencia de sarro:</span>
          {([true, false] as const).map(v => (
            <label key={String(v)} className="flex items-center gap-1 cursor-pointer">
              <input type="radio" name="sarro" checked={sarro === v} onChange={() => setSarro(v)} className="accent-red-500" />
              {v ? 'SI' : 'NO'}
            </label>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-600">Enfermedad Periodontal:</span>
          {([true, false] as const).map(v => (
            <label key={String(v)} className="flex items-center gap-1 cursor-pointer">
              <input type="radio" name="perio" checked={perio === v} onChange={() => setPerio(v)} className="accent-red-500" />
              {v ? 'SI' : 'NO'}
            </label>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Notas</Label>
        <Textarea value={notas} onChange={e => setNotas(e.target.value)} placeholder="Observaciones generales del odontograma..." rows={2} className="rounded-xl border-gray-200 resize-none text-sm" />
      </div>

      <button onClick={guardar}
        className="w-full py-2.5 rounded-full text-sm font-bold flex items-center justify-center gap-2 transition-all"
        style={saved ? { background: '#22C55E', color: 'white' } : { background: 'var(--cyan)', color: 'var(--dark)' }}>
        <Save size={14} />{saved ? 'Guardado' : 'Guardar odontograma'}
      </button>
    </div>
  );
}

function DienteWidget({ num, diente, tipo, pincel, onPintarCara, onClickNumero, getCaraColor, size = 24, flip = false }: {
  num: number; diente: DienteEstado; tipo: string; pincel: PincelMode;
  onPintarCara: (c: Cara) => void;
  onClickNumero: () => void;
  getCaraColor: (c: Cara) => string;
  size?: number; flip?: boolean;
}) {
  const SIZE = size;
  const c = SIZE / 2;
  const inner = SIZE * 0.28;
  const isNormal = tipo === 'normal';
  const numEl = (
    <button onClick={onClickNumero}
      className="text-[9px] font-bold leading-none select-none"
      style={{ color: isNormal ? 'var(--dark)' : '#6B7280', minWidth: SIZE }}>
      {num}
    </button>
  );

  const svgEl = (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ cursor: 'pointer', display: 'block' }}
      onClick={() => !isNormal && onClickNumero()}>
      {isNormal ? (
        <>
          <polygon points={`0,0 ${SIZE},0 ${c+inner},${c-inner} ${c-inner},${c-inner}`}
            fill={getCaraColor('vestibular')} stroke="#D1D5DB" strokeWidth="0.5"
            onClick={e => { e.stopPropagation(); onPintarCara('vestibular'); }} />
          <polygon points={`0,${SIZE} ${SIZE},${SIZE} ${c+inner},${c+inner} ${c-inner},${c+inner}`}
            fill={getCaraColor('lingual')} stroke="#D1D5DB" strokeWidth="0.5"
            onClick={e => { e.stopPropagation(); onPintarCara('lingual'); }} />
          <polygon points={`0,0 0,${SIZE} ${c-inner},${c+inner} ${c-inner},${c-inner}`}
            fill={getCaraColor('mesial')} stroke="#D1D5DB" strokeWidth="0.5"
            onClick={e => { e.stopPropagation(); onPintarCara('mesial'); }} />
          <polygon points={`${SIZE},0 ${SIZE},${SIZE} ${c+inner},${c+inner} ${c+inner},${c-inner}`}
            fill={getCaraColor('distal')} stroke="#D1D5DB" strokeWidth="0.5"
            onClick={e => { e.stopPropagation(); onPintarCara('distal'); }} />
          <rect x={c-inner} y={c-inner} width={inner*2} height={inner*2}
            fill={getCaraColor('oclusal')} stroke="#D1D5DB" strokeWidth="0.5"
            onClick={e => { e.stopPropagation(); onPintarCara('oclusal'); }} />
        </>
      ) : tipo === 'ausente' ? (
        <>
          <rect x="0" y="0" width={SIZE} height={SIZE} fill="#F9FAFB" stroke="#D1D5DB" strokeWidth="0.5" />
          <line x1="3" y1="3" x2={SIZE-3} y2={SIZE-3} stroke="#374151" strokeWidth="1.5" />
          <line x1={SIZE-3} y1="3" x2="3" y2={SIZE-3} stroke="#374151" strokeWidth="1.5" />
        </>
      ) : tipo === 'corona' ? (
        <>
          <rect x="0" y="0" width={SIZE} height={SIZE} fill="#FEF9C3" stroke="#D1D5DB" strokeWidth="0.5" />
          <ellipse cx={c} cy={c} rx={inner+1} ry={inner+1} fill="none" stroke="#374151" strokeWidth="1.5" />
        </>
      ) : tipo === 'protesis_fija' ? (
        <>
          <rect x="0" y="0" width={SIZE} height={SIZE} fill="#EFF6FF" stroke="#D1D5DB" strokeWidth="0.5" />
          <rect x="3" y="3" width={SIZE-6} height={SIZE-6} fill="none" stroke="#374151" strokeWidth="1.5" />
        </>
      ) : tipo === 'protesis_removible' ? (
        <>
          <rect x="0" y="0" width={SIZE} height={SIZE} fill="#F0FDF4" stroke="#D1D5DB" strokeWidth="0.5" />
          <rect x="3" y="3" width={SIZE-6} height={SIZE-6} fill="none" stroke="#374151" strokeWidth="1.5" strokeDasharray="2,1.5" />
        </>
      ) : null}
    </svg>
  );

  return (
    <div className="flex flex-col items-center" style={{ gap: 1 }}>
      {flip ? numEl : svgEl}
      {flip ? svgEl : numEl}
    </div>
  );
}

// ── Notas clínicas ───────────────────────────────────────────────────────────

const TIPOS_NOTA: Record<Rubro, { value: NotaClinica['tipo']; label: string }[]> = {
  psicologia:     [{ value: 'sesion', label: 'Nota de sesión' }, { value: 'evaluacion', label: 'Evaluación' }, { value: 'informe', label: 'Informe' }],
  psicopedagogia: [{ value: 'evaluacion', label: 'Evaluación' }, { value: 'sesion', label: 'Sesión' }, { value: 'informe', label: 'Informe escolar' }],
  medicina:       [{ value: 'soap', label: 'SOAP' }, { value: 'evolucion', label: 'Evolución' }, { value: 'informe', label: 'Informe' }],
  kinesiologia:   [{ value: 'evolucion', label: 'Evolución' }, { value: 'evaluacion', label: 'Evaluación kinésica' }, { value: 'informe', label: 'Informe' }],
  odontologia:    [{ value: 'evolucion', label: 'Evolución' }],
  nutricion:      [{ value: 'evolucion', label: 'Evolución' }],
  peluqueria:     [{ value: 'evolucion', label: 'Nota' }],
  estetica:       [{ value: 'evolucion', label: 'Nota' }],
  otro:           [{ value: 'evolucion', label: 'Nota' }, { value: 'informe', label: 'Informe' }],
};

function NotasSection({ pacienteId, rubro, notas, onSave, onDelete }: {
  pacienteId: string; rubro: Rubro;
  notas: NotaClinica[];
  onSave: (n: NotaClinica) => void;
  onDelete: (id: string) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const tipos = TIPOS_NOTA[rubro] || TIPOS_NOTA.otro;
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ tipo: tipos[0].value as NotaClinica['tipo'], contenido: '', privada: false, fecha: today });
  const [expanded, setExpanded] = useState<string | null>(null);

  const titulo = rubro === 'psicologia' || rubro === 'psicopedagogia' ? 'Notas de sesión' : 'Notas clínicas';

  const guardar = () => {
    if (!form.contenido.trim()) return;
    onSave({ id: uid(), pacienteId, fecha: form.fecha, tipo: form.tipo, contenido: form.contenido, privada: form.privada, createdAt: new Date().toISOString() });
    setForm(f => ({ ...f, contenido: '', privada: false }));
    setShowForm(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <SectionTitle>{titulo}</SectionTitle>
        <button onClick={() => setShowForm(x => !x)} className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full transition-all"
          style={{ background: 'var(--cyan-light)', color: 'var(--cyan-dark)' }}>
          <Plus size={12} /> Nueva nota
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Tipo</Label>
              <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v as NotaClinica['tipo'] }))}>
                <SelectTrigger className="rounded-xl border-gray-200 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{tipos.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Fecha</Label>
              <Input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} className="rounded-xl border-gray-200 h-8 text-xs" />
            </div>
          </div>
          <Textarea value={form.contenido} onChange={e => setForm(f => ({ ...f, contenido: e.target.value }))}
            placeholder={rubro === 'psicologia' ? 'Contenido de la sesión...' : rubro === 'medicina' ? 'S: Subjetivo\nO: Objetivo\nA: Valoración\nP: Plan' : 'Contenido...'}
            rows={4} className="rounded-xl border-gray-200 resize-none text-sm" autoFocus />
          {(rubro === 'psicologia' || rubro === 'psicopedagogia') && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.privada} onChange={e => setForm(f => ({ ...f, privada: e.target.checked }))} className="rounded" />
              <span className="text-xs font-semibold text-gray-500 flex items-center gap-1"><Lock size={11} /> Nota privada (solo visible aquí)</span>
            </label>
          )}
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-full text-xs font-bold border border-gray-200 text-gray-500">Cancelar</button>
            <button onClick={guardar} className="flex-1 py-2 rounded-full text-xs font-bold" style={{ background: 'var(--cyan)', color: 'var(--dark)' }}>Guardar</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {notas.length === 0 && <p className="text-xs text-gray-400 text-center py-4">Sin notas registradas</p>}
        {notas.map(n => {
          const tipo = tipos.find(t => t.value === n.tipo)?.label || n.tipo;
          const isExpanded = expanded === n.id;
          return (
            <div key={n.id} className="rounded-xl overflow-hidden" style={{ border: '1px solid #F3F4F6' }}>
              <button onClick={() => setExpanded(isExpanded ? null : n.id)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-gray-50">
                <div className="flex items-center gap-2">
                  {n.privada && <Lock size={10} className="text-gray-400" />}
                  <span className="text-xs font-bold text-gray-700">{new Date(n.fecha + 'T12:00').toLocaleDateString('es-AR')} · {tipo}</span>
                </div>
                <div className="flex items-center gap-2">
                  {isExpanded ? <ChevronUp size={13} className="text-gray-400" /> : <ChevronDown size={13} className="text-gray-400" />}
                  <button onClick={e => { e.stopPropagation(); onDelete(n.id); }} className="p-1 text-gray-300 hover:text-red-400"><X size={12} /></button>
                </div>
              </button>
              {isExpanded && (
                <div className="px-4 pb-3">
                  <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">{n.contenido}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Mediciones ───────────────────────────────────────────────────────────────

function MedicionesSection({ pacienteId, rubro, mediciones, onSave, onDelete }: {
  pacienteId: string; rubro: Rubro;
  mediciones: Medicion[];
  onSave: (m: Medicion) => void;
  onDelete: (id: string) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ fecha: today, peso: '', talla: '', cintura: '', cadera: '', brazo: '', muslo: '', presionSis: '', presionDia: '', glucemia: '', notas: '' });

  const titulo = rubro === 'nutricion' ? 'Mediciones antropométricas' : rubro === 'medicina' ? 'Signos vitales y mediciones' : 'Evaluaciones físicas';

  const guardar = () => {
    const n = (v: string) => v !== '' ? Number(v) : undefined;
    const m: Medicion = {
      id: uid(), pacienteId, fecha: form.fecha,
      peso: n(form.peso), talla: n(form.talla), cintura: n(form.cintura), cadera: n(form.cadera),
      brazo: n(form.brazo), muslo: n(form.muslo), presionSis: n(form.presionSis), presionDia: n(form.presionDia),
      glucemia: n(form.glucemia), notas: form.notas || undefined,
    };
    if (m.peso && m.talla) m.imc = Math.round((m.peso / Math.pow(m.talla / 100, 2)) * 10) / 10;
    onSave(m);
    setForm(f => ({ ...f, peso: '', talla: '', cintura: '', cadera: '', brazo: '', muslo: '', presionSis: '', presionDia: '', glucemia: '', notas: '' }));
    setShowForm(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <SectionTitle>{titulo}</SectionTitle>
        <button onClick={() => setShowForm(x => !x)} className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full"
          style={{ background: 'var(--cyan-light)', color: 'var(--cyan-dark)' }}>
          <Plus size={12} /> Nueva
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <MedField label="Peso (kg)" value={form.peso} onChange={v => setForm(f => ({ ...f, peso: v }))} />
            <MedField label="Talla (cm)" value={form.talla} onChange={v => setForm(f => ({ ...f, talla: v }))} />
            {(rubro === 'nutricion' || rubro === 'kinesiologia') && <>
              <MedField label="Cintura (cm)" value={form.cintura} onChange={v => setForm(f => ({ ...f, cintura: v }))} />
              <MedField label="Cadera (cm)" value={form.cadera} onChange={v => setForm(f => ({ ...f, cadera: v }))} />
              <MedField label="Brazo (cm)" value={form.brazo} onChange={v => setForm(f => ({ ...f, brazo: v }))} />
              <MedField label="Muslo (cm)" value={form.muslo} onChange={v => setForm(f => ({ ...f, muslo: v }))} />
            </>}
            {(rubro === 'medicina' || rubro === 'kinesiologia') && <>
              <MedField label="Presión sistólica" value={form.presionSis} onChange={v => setForm(f => ({ ...f, presionSis: v }))} />
              <MedField label="Presión diastólica" value={form.presionDia} onChange={v => setForm(f => ({ ...f, presionDia: v }))} />
              <MedField label="Glucemia (mg/dL)" value={form.glucemia} onChange={v => setForm(f => ({ ...f, glucemia: v }))} />
            </>}
          </div>
          <Input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} className="rounded-xl border-gray-200 text-xs" />
          <Input value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} placeholder="Notas..." className="rounded-xl border-gray-200 text-xs" />
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-full text-xs font-bold border border-gray-200 text-gray-500">Cancelar</button>
            <button onClick={guardar} className="flex-1 py-2 rounded-full text-xs font-bold" style={{ background: 'var(--cyan)', color: 'var(--dark)' }}>Guardar</button>
          </div>
        </div>
      )}

      {/* Gráfico de peso */}
      {mediciones.filter(m => m.peso).length > 1 && <PesoChart mediciones={mediciones} />}

      <div className="space-y-2">
        {mediciones.length === 0 && <p className="text-xs text-gray-400 text-center py-4">Sin mediciones registradas</p>}
        {mediciones.map((m, i) => (
          <div key={m.id} className="flex items-start justify-between px-4 py-3 rounded-xl" style={{ background: i === 0 ? 'var(--cyan-light)' : '#F9FAFB' }}>
            <div>
              <p className="text-xs font-bold" style={{ color: 'var(--dark)' }}>{new Date(m.fecha + 'T12:00').toLocaleDateString('es-AR')}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {[
                  m.peso && `${m.peso}kg`,
                  m.talla && `${m.talla}cm`,
                  m.imc && `IMC ${m.imc}`,
                  m.cintura && `Cin. ${m.cintura}cm`,
                  m.cadera && `Cad. ${m.cadera}cm`,
                  m.presionSis && m.presionDia && `${m.presionSis}/${m.presionDia}mmHg`,
                  m.glucemia && `Gluc. ${m.glucemia}mg/dL`,
                ].filter(Boolean).join(' · ')}
              </p>
              {m.notas && <p className="text-[11px] text-gray-400 mt-0.5">{m.notas}</p>}
            </div>
            <button onClick={() => onDelete(m.id)} className="p-1 text-gray-300 hover:text-red-400"><X size={12} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function MedField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">{label}</Label>
      <Input type="number" min={0} step={0.1} value={value} onChange={e => onChange(e.target.value)} className="rounded-xl border-gray-200 h-8 text-xs" />
    </div>
  );
}

function PesoChart({ mediciones }: { mediciones: Medicion[] }) {
  const data = mediciones.filter(m => m.peso).slice(0, 10).reverse();
  const pesos = data.map(m => m.peso!);
  const min = Math.min(...pesos) - 1;
  const max = Math.max(...pesos) + 1;
  const H = 60, W = 240;

  const x = (i: number) => (i / (data.length - 1)) * (W - 20) + 10;
  const y = (p: number) => H - ((p - min) / (max - min)) * (H - 10) - 5;

  const points = data.map((m, i) => `${x(i)},${y(m.peso!)}`).join(' ');

  return (
    <div className="bg-white rounded-xl p-3">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Evolución de peso</p>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}>
        <polyline points={points} fill="none" stroke="var(--cyan)" strokeWidth="1.5" strokeLinejoin="round" />
        {data.map((m, i) => (
          <circle key={i} cx={x(i)} cy={y(m.peso!)} r="3" fill="var(--cyan)" />
        ))}
        {data.map((m, i) => (
          <text key={i} x={x(i)} y={y(m.peso!) - 5} textAnchor="middle" fontSize="7" fill="#6B7280">{m.peso}</text>
        ))}
      </svg>
    </div>
  );
}

// ── Historial servicios (peluquería / estética) ──────────────────────────────

function ServiciosHistSection({ pacienteId, rubro, historial, onSave, onDelete }: {
  pacienteId: string; rubro: Rubro;
  historial: HistorialServicio[];
  onSave: (h: HistorialServicio) => void;
  onDelete: (id: string) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ fecha: today, servicio: '', detalles: '', resultado: '', proximaVisita: '' });

  const titulo = rubro === 'peluqueria' ? 'Historial de servicios' : 'Historial de tratamientos';
  const placeholder = rubro === 'peluqueria'
    ? 'Ej: Fórmula utilizada: 7/0 + 7/43, oxidante 20 vol...'
    : 'Ej: Zona tratada, productos utilizados, dosis...';

  const guardar = () => {
    if (!form.servicio.trim()) return;
    onSave({
      id: uid(), pacienteId, fecha: form.fecha, servicio: form.servicio,
      detalles: form.detalles, resultado: form.resultado || undefined,
      proximaVisita: form.proximaVisita || undefined, createdAt: new Date().toISOString(),
    });
    setForm(f => ({ ...f, servicio: '', detalles: '', resultado: '', proximaVisita: '' }));
    setShowForm(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <SectionTitle>{titulo}</SectionTitle>
        <button onClick={() => setShowForm(x => !x)} className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full"
          style={{ background: 'var(--cyan-light)', color: 'var(--cyan-dark)' }}>
          <Plus size={12} /> Nuevo
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
          <div>
            <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Servicio / tratamiento</Label>
            <Input value={form.servicio} onChange={e => setForm(f => ({ ...f, servicio: e.target.value }))} placeholder={rubro === 'peluqueria' ? 'Coloración, corte, keratina...' : 'Limpieza facial, mesoterapia...'} className="rounded-xl border-gray-200" autoFocus />
          </div>
          <div>
            <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">{rubro === 'peluqueria' ? 'Fórmula / detalles' : 'Detalles / productos'}</Label>
            <Textarea value={form.detalles} onChange={e => setForm(f => ({ ...f, detalles: e.target.value }))} placeholder={placeholder} rows={3} className="rounded-xl border-gray-200 resize-none text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Resultado / observaciones</Label>
              <Input value={form.resultado} onChange={e => setForm(f => ({ ...f, resultado: e.target.value }))} placeholder="Cómo quedó..." className="rounded-xl border-gray-200 text-xs" />
            </div>
            <div>
              <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Próxima visita</Label>
              <Input type="date" value={form.proximaVisita} onChange={e => setForm(f => ({ ...f, proximaVisita: e.target.value }))} className="rounded-xl border-gray-200 text-xs" />
            </div>
          </div>
          <Input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} className="rounded-xl border-gray-200 text-xs" />
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-full text-xs font-bold border border-gray-200 text-gray-500">Cancelar</button>
            <button onClick={guardar} className="flex-1 py-2 rounded-full text-xs font-bold" style={{ background: 'var(--cyan)', color: 'var(--dark)' }}>Guardar</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {historial.length === 0 && <p className="text-xs text-gray-400 text-center py-4">Sin historial registrado</p>}
        {historial.map(h => (
          <div key={h.id} className="rounded-xl p-3 space-y-1" style={{ background: '#F9FAFB', border: '1px solid #F3F4F6' }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-gray-800">{h.servicio}</p>
                <p className="text-[11px] text-gray-400">{new Date(h.fecha + 'T12:00').toLocaleDateString('es-AR')}</p>
              </div>
              <button onClick={() => onDelete(h.id)} className="p-1 text-gray-300 hover:text-red-400"><X size={12} /></button>
            </div>
            {h.detalles && <p className="text-[11px] text-gray-500 whitespace-pre-wrap">{h.detalles}</p>}
            {h.resultado && <p className="text-[11px] font-medium" style={{ color: 'var(--cyan-dark)' }}>→ {h.resultado}</p>}
            {h.proximaVisita && <p className="text-[11px] text-gray-400">Próxima visita: {new Date(h.proximaVisita + 'T12:00').toLocaleDateString('es-AR')}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{children}</p>;
}
