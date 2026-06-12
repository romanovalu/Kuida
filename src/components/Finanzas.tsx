import { useState, useMemo } from 'react';
import type { Cobro, Gasto, Paciente, MetodoPago, TipoComprobante, CategoriaGasto } from '../types';
import { uid } from '../store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X, TrendingUp, TrendingDown, DollarSign, FileText, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  cobros: Cobro[];
  gastos: Gasto[];
  pacientes: Paciente[];
  onSaveCobro: (c: Cobro) => void;
  onDeleteCobro: (id: string) => void;
  onSaveGasto: (g: Gasto) => void;
  onDeleteGasto: (id: string) => void;
}

type Tab = 'resumen' | 'cobros' | 'gastos';

const METODOS: { value: MetodoPago; label: string }[] = [
  { value: 'efectivo',     label: 'Efectivo' },
  { value: 'transferencia',label: 'Transferencia' },
  { value: 'debito',       label: 'Débito' },
  { value: 'credito',      label: 'Crédito' },
  { value: 'cheque',       label: 'Cheque' },
  { value: 'otro',         label: 'Otro' },
];

const COMPROBANTES: { value: TipoComprobante; label: string }[] = [
  { value: 'ninguno',   label: 'Sin comprobante' },
  { value: 'recibo',    label: 'Recibo' },
  { value: 'factura_b', label: 'Factura B' },
  { value: 'factura_c', label: 'Factura C' },
  { value: 'factura_a', label: 'Factura A' },
  { value: 'ticket',    label: 'Ticket' },
];

const CATEGORIAS: { value: CategoriaGasto; label: string }[] = [
  { value: 'alquiler',          label: 'Alquiler / consultorio' },
  { value: 'materiales',        label: 'Materiales e insumos' },
  { value: 'servicios_basicos', label: 'Servicios (luz, agua, gas)' },
  { value: 'equipamiento',      label: 'Equipamiento' },
  { value: 'honorarios',        label: 'Honorarios / sueldos' },
  { value: 'impuestos',         label: 'Impuestos / monotributo' },
  { value: 'marketing',         label: 'Marketing / publicidad' },
  { value: 'otros',             label: 'Otros' },
];

const CAT_COLORS: Record<CategoriaGasto, string> = {
  alquiler:          '#818CF8',
  materiales:        '#F59E0B',
  servicios_basicos: '#06B6D4',
  equipamiento:      '#8B5CF6',
  honorarios:        '#EC4899',
  impuestos:         '#EF4444',
  marketing:         '#10B981',
  otros:             '#9CA3AF',
};

function fmt(n: number) {
  return n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
}

export default function Finanzas({ cobros, gastos, pacientes, onSaveCobro, onDeleteCobro, onSaveGasto, onDeleteGasto }: Props) {
  const [tab, setTab] = useState<Tab>('resumen');
  const [showCobroForm, setShowCobroForm] = useState(false);
  const [showGastoForm, setShowGastoForm] = useState(false);
  const [mesSeleccionado, setMesSeleccionado] = useState(() => new Date().toISOString().slice(0, 7));

  const cobrosMes = useMemo(() => cobros.filter(c => c.fecha.startsWith(mesSeleccionado)), [cobros, mesSeleccionado]);
  const gastosMes = useMemo(() => gastos.filter(g => g.fecha.startsWith(mesSeleccionado)), [gastos, mesSeleccionado]);

  const totalCobros = useMemo(() => cobrosMes.reduce((s, c) => s + c.monto, 0), [cobrosMes]);
  const totalGastos = useMemo(() => gastosMes.reduce((s, g) => s + g.monto, 0), [gastosMes]);
  const balance = totalCobros - totalGastos;

  const getPaciente = (id?: string) => id ? pacientes.find(p => p.id === id) : null;

  // Gastos por categoría
  const gastosPorCat = useMemo(() => {
    const map: Record<string, number> = {};
    gastosMes.forEach(g => { map[g.categoria] = (map[g.categoria] || 0) + g.monto; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [gastosMes]);

  // Months with data for selector
  const mesesDisponibles = useMemo(() => {
    const set = new Set<string>();
    [...cobros, ...gastos].forEach(x => set.add(x.fecha.slice(0, 7)));
    const current = new Date().toISOString().slice(0, 7);
    set.add(current);
    return Array.from(set).sort().reverse();
  }, [cobros, gastos]);

  const mesLabel = (m: string) => {
    const [y, mo] = m.split('-');
    const nombres = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${nombres[parseInt(mo) - 1]} ${y}`;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl px-5 py-5" style={{ background: 'var(--dark)' }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--cyan)' }}>Gestión</p>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Finanzas</h1>
        <div className="flex items-center gap-2 mt-3">
          <Select value={mesSeleccionado} onValueChange={setMesSeleccionado}>
            <SelectTrigger className="h-8 text-xs font-bold rounded-full border-0 w-36" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {mesesDisponibles.map(m => <SelectItem key={m} value={m}>{mesLabel(m)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl p-1 shadow-sm flex gap-1">
        {(['resumen', 'cobros', 'gastos'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2 text-xs font-bold rounded-xl transition-all capitalize"
            style={tab === t ? { background: 'var(--cyan)', color: 'var(--dark)' } : { color: '#6B7280' }}>
            {t === 'resumen' ? 'Resumen' : t === 'cobros' ? 'Cobros' : 'Gastos'}
          </button>
        ))}
      </div>

      {/* ── RESUMEN ── */}
      {tab === 'resumen' && (
        <div className="space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-3">
            <KpiCard label="Ingresos" value={totalCobros} color="var(--cyan)" Icon={TrendingUp} />
            <KpiCard label="Gastos" value={totalGastos} color="#F87171" Icon={TrendingDown} />
            <KpiCard label="Balance" value={balance} color={balance >= 0 ? '#22C55E' : '#EF4444'} Icon={DollarSign} />
          </div>

          {/* Gastos por categoría */}
          {gastosPorCat.length > 0 && (
            <div className="bg-white rounded-2xl px-5 py-4 shadow-sm">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Gastos por categoría</p>
              <div className="space-y-3">
                {gastosPorCat.map(([cat, monto]) => {
                  const pct = totalGastos > 0 ? (monto / totalGastos) * 100 : 0;
                  const label = CATEGORIAS.find(c => c.value === cat)?.label || cat;
                  const color = CAT_COLORS[cat as CategoriaGasto] || '#9CA3AF';
                  return (
                    <div key={cat}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-gray-600">{label}</span>
                        <span className="font-bold" style={{ color }}>{fmt(monto)}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full">
                        <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Últimos cobros */}
          {cobrosMes.length > 0 && (
            <div className="bg-white rounded-2xl px-5 py-4 shadow-sm">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Últimos cobros</p>
              <div className="space-y-2">
                {[...cobrosMes].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 5).map(c => {
                  const p = getPaciente(c.pacienteId);
                  return (
                    <div key={c.id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-semibold text-gray-800 text-xs">{c.concepto}</p>
                        {p && <p className="text-[11px] text-gray-400">{p.nombre} {p.apellido}</p>}
                      </div>
                      <span className="font-bold text-xs" style={{ color: 'var(--cyan-dark)' }}>{fmt(c.monto)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {cobrosMes.length === 0 && gastosMes.length === 0 && (
            <div className="text-center py-10 rounded-2xl border-2 border-dashed" style={{ borderColor: 'var(--cyan-mid)', background: 'var(--cyan-light)' }}>
              <p className="text-sm font-medium" style={{ color: 'var(--cyan-dark)' }}>Sin movimientos en {mesLabel(mesSeleccionado)}</p>
            </div>
          )}
        </div>
      )}

      {/* ── COBROS ── */}
      {tab === 'cobros' && (
        <div className="space-y-3">
          <button onClick={() => setShowCobroForm(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-opacity hover:opacity-80"
            style={{ background: 'var(--cyan)', color: 'var(--dark)' }}>
            <Plus size={15} /> Registrar cobro
          </button>

          {cobrosMes.length === 0 ? (
            <div className="text-center py-10 rounded-2xl border-2 border-dashed" style={{ borderColor: 'var(--cyan-mid)', background: 'var(--cyan-light)' }}>
              <p className="text-sm font-medium" style={{ color: 'var(--cyan-dark)' }}>Sin cobros en {mesLabel(mesSeleccionado)}</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              {[...cobrosMes].sort((a, b) => b.fecha.localeCompare(a.fecha)).map((c, i) => {
                const p = getPaciente(c.pacienteId);
                const metodo = METODOS.find(m => m.value === c.metodoPago)?.label || c.metodoPago;
                const comp = COMPROBANTES.find(x => x.value === c.tipoComprobante)?.label;
                return (
                  <div key={c.id} className="px-4 py-3.5 flex items-start gap-3"
                    style={{ borderTop: i > 0 ? '1px solid #F3F4F6' : 'none' }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--cyan-light)' }}>
                      <DollarSign size={14} style={{ color: 'var(--cyan-dark)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-800">{c.concepto}</p>
                        <span className="text-sm font-extrabold flex-shrink-0" style={{ color: 'var(--cyan-dark)' }}>{fmt(c.monto)}</span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {new Date(c.fecha + 'T12:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                        {p ? ` · ${p.nombre} ${p.apellido}` : ''}
                        {` · ${metodo}`}
                        {comp && comp !== 'Sin comprobante' ? ` · ${comp}${c.nroComprobante ? ` #${c.nroComprobante}` : ''}` : ''}
                      </p>
                      {c.notas && <p className="text-[11px] text-gray-400 mt-0.5">{c.notas}</p>}
                    </div>
                    <button onClick={() => onDeleteCobro(c.id)} className="p-1.5 text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
                      <X size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── GASTOS ── */}
      {tab === 'gastos' && (
        <div className="space-y-3">
          <button onClick={() => setShowGastoForm(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-opacity hover:opacity-80"
            style={{ background: 'var(--dark)', color: 'white' }}>
            <Plus size={15} /> Registrar gasto
          </button>

          {gastosMes.length === 0 ? (
            <div className="text-center py-10 rounded-2xl border-2 border-dashed" style={{ borderColor: 'var(--cyan-mid)', background: 'var(--cyan-light)' }}>
              <p className="text-sm font-medium" style={{ color: 'var(--cyan-dark)' }}>Sin gastos en {mesLabel(mesSeleccionado)}</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              {[...gastosMes].sort((a, b) => b.fecha.localeCompare(a.fecha)).map((g, i) => {
                const p = getPaciente(g.pacienteId);
                const cat = CATEGORIAS.find(c => c.value === g.categoria)?.label || g.categoria;
                const color = CAT_COLORS[g.categoria] || '#9CA3AF';
                return (
                  <div key={g.id} className="px-4 py-3.5 flex items-start gap-3"
                    style={{ borderTop: i > 0 ? '1px solid #F3F4F6' : 'none' }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}20` }}>
                      <TrendingDown size={14} style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-800">{g.concepto}</p>
                        <span className="text-sm font-extrabold flex-shrink-0" style={{ color: '#EF4444' }}>{fmt(g.monto)}</span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {new Date(g.fecha + 'T12:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                        {` · `}<span style={{ color }}>{cat}</span>
                        {p ? ` · ${p.nombre} ${p.apellido}` : ''}
                        {g.proveedor ? ` · ${g.proveedor}` : ''}
                        {g.nroComprobante ? ` · #${g.nroComprobante}` : ''}
                      </p>
                      {g.notas && <p className="text-[11px] text-gray-400 mt-0.5">{g.notas}</p>}
                    </div>
                    <button onClick={() => onDeleteGasto(g.id)} className="p-1.5 text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
                      <X size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {showCobroForm && (
        <CobroModal pacientes={pacientes}
          onSave={c => { onSaveCobro(c); setShowCobroForm(false); }}
          onClose={() => setShowCobroForm(false)} />
      )}
      {showGastoForm && (
        <GastoModal pacientes={pacientes}
          onSave={g => { onSaveGasto(g); setShowGastoForm(false); }}
          onClose={() => setShowGastoForm(false)} />
      )}
    </div>
  );
}

function KpiCard({ label, value, color, Icon }: { label: string; value: number; color: string; Icon: React.ElementType }) {
  return (
    <div className="bg-white rounded-2xl p-3 shadow-sm">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-2" style={{ background: `${color}18` }}>
        <Icon size={13} style={{ color }} />
      </div>
      <p className="text-lg font-extrabold leading-tight" style={{ color: 'var(--dark)' }}>
        {fmt(Math.abs(value))}
      </p>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mt-0.5">{label}</p>
    </div>
  );
}

// ── Modal cobro ──────────────────────────────────────────────────────────────

function CobroModal({ pacientes, onSave, onClose }: { pacientes: Paciente[]; onSave: (c: Cobro) => void; onClose: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    fecha: today, concepto: '', monto: '', metodoPago: 'efectivo' as MetodoPago,
    pacienteId: '', tipoComprobante: 'recibo' as TipoComprobante, nroComprobante: '', notas: '',
  });
  const [error, setError] = useState('');
  const [showExtra, setShowExtra] = useState(false);

  const guardar = () => {
    if (!form.concepto.trim()) { setError('Ingresá el concepto'); return; }
    if (!form.monto || Number(form.monto) <= 0) { setError('Ingresá un monto válido'); return; }
    onSave({
      id: uid(), fecha: form.fecha, concepto: form.concepto.trim(),
      monto: Number(form.monto), metodoPago: form.metodoPago,
      pacienteId: form.pacienteId || undefined,
      tipoComprobante: form.tipoComprobante,
      nroComprobante: form.nroComprobante || undefined,
      notas: form.notas || undefined,
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <ModalShell title="Registrar cobro" onClose={onClose}>
      <Field label="Concepto">
        <Input value={form.concepto} onChange={e => setForm(f => ({ ...f, concepto: e.target.value }))} placeholder="Ej: Consulta, Sesión, Tratamiento..." className="rounded-xl border-gray-200" autoFocus />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Monto ($)">
          <Input type="number" min={0} step={100} value={form.monto} onChange={e => setForm(f => ({ ...f, monto: e.target.value }))} placeholder="0" className="rounded-xl border-gray-200" />
        </Field>
        <Field label="Fecha">
          <Input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} className="rounded-xl border-gray-200" />
        </Field>
      </div>
      <Field label="Método de pago">
        <div className="flex flex-wrap gap-1.5">
          {METODOS.map(m => (
            <button key={m.value} onClick={() => setForm(f => ({ ...f, metodoPago: m.value }))}
              className="px-3 py-1.5 text-xs font-bold rounded-full transition-all"
              style={form.metodoPago === m.value ? { background: 'var(--cyan)', color: 'var(--dark)' } : { background: '#F3F4F6', color: '#6B7280' }}>
              {m.label}
            </button>
          ))}
        </div>
      </Field>

      <button onClick={() => setShowExtra(x => !x)} className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-gray-600">
        {showExtra ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        {showExtra ? 'Menos opciones' : 'Más opciones (paciente, comprobante)'}
      </button>

      {showExtra && (
        <>
          <Field label="Paciente (opcional)">
            <Select value={form.pacienteId || '__ninguno__'} onValueChange={v => setForm(f => ({ ...f, pacienteId: v === '__ninguno__' ? '' : v }))}>
              <SelectTrigger className="rounded-xl border-gray-200"><SelectValue placeholder="Sin vincular..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__ninguno__">Sin vincular</SelectItem>
                {pacientes.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre} {p.apellido}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Comprobante">
              <Select value={form.tipoComprobante} onValueChange={v => setForm(f => ({ ...f, tipoComprobante: v as TipoComprobante }))}>
                <SelectTrigger className="rounded-xl border-gray-200"><SelectValue /></SelectTrigger>
                <SelectContent>{COMPROBANTES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Nro. comprobante">
              <Input value={form.nroComprobante} onChange={e => setForm(f => ({ ...f, nroComprobante: e.target.value }))} placeholder="0001-00000123" className="rounded-xl border-gray-200" />
            </Field>
          </div>
          <Field label="Notas">
            <Textarea value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} placeholder="Observaciones..." rows={2} className="rounded-xl border-gray-200 resize-none" />
          </Field>
        </>
      )}

      {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-full text-sm font-bold border border-gray-200 text-gray-500">Cancelar</button>
        <button onClick={guardar} className="flex-1 py-2.5 rounded-full text-sm font-bold" style={{ background: 'var(--cyan)', color: 'var(--dark)' }}>Guardar</button>
      </div>
    </ModalShell>
  );
}

// ── Modal gasto ──────────────────────────────────────────────────────────────

function GastoModal({ pacientes, onSave, onClose }: { pacientes: Paciente[]; onSave: (g: Gasto) => void; onClose: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    fecha: today, concepto: '', monto: '', categoria: 'materiales' as CategoriaGasto,
    pacienteId: '', proveedor: '', nroComprobante: '', notas: '',
  });
  const [error, setError] = useState('');
  const [showExtra, setShowExtra] = useState(false);

  const guardar = () => {
    if (!form.concepto.trim()) { setError('Ingresá el concepto'); return; }
    if (!form.monto || Number(form.monto) <= 0) { setError('Ingresá un monto válido'); return; }
    onSave({
      id: uid(), fecha: form.fecha, concepto: form.concepto.trim(),
      categoria: form.categoria, monto: Number(form.monto),
      pacienteId: form.pacienteId || undefined,
      proveedor: form.proveedor || undefined,
      nroComprobante: form.nroComprobante || undefined,
      notas: form.notas || undefined,
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <ModalShell title="Registrar gasto" onClose={onClose}>
      <Field label="Concepto">
        <Input value={form.concepto} onChange={e => setForm(f => ({ ...f, concepto: e.target.value }))} placeholder="Ej: Alquiler junio, Materiales, Guantes..." className="rounded-xl border-gray-200" autoFocus />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Monto ($)">
          <Input type="number" min={0} step={100} value={form.monto} onChange={e => setForm(f => ({ ...f, monto: e.target.value }))} placeholder="0" className="rounded-xl border-gray-200" />
        </Field>
        <Field label="Fecha">
          <Input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} className="rounded-xl border-gray-200" />
        </Field>
      </div>
      <Field label="Categoría">
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIAS.map(c => (
            <button key={c.value} onClick={() => setForm(f => ({ ...f, categoria: c.value }))}
              className="px-3 py-1.5 text-xs font-bold rounded-full transition-all"
              style={form.categoria === c.value
                ? { background: CAT_COLORS[c.value], color: 'white' }
                : { background: '#F3F4F6', color: '#6B7280' }}>
              {c.label}
            </button>
          ))}
        </div>
      </Field>

      <button onClick={() => setShowExtra(x => !x)} className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-gray-600">
        {showExtra ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        {showExtra ? 'Menos opciones' : 'Más opciones (paciente, proveedor)'}
      </button>

      {showExtra && (
        <>
          <Field label="Paciente (si es material por paciente)">
            <Select value={form.pacienteId || '__ninguno__'} onValueChange={v => setForm(f => ({ ...f, pacienteId: v === '__ninguno__' ? '' : v }))}>
              <SelectTrigger className="rounded-xl border-gray-200"><SelectValue placeholder="Sin vincular..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__ninguno__">Sin vincular</SelectItem>
                {pacientes.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre} {p.apellido}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Proveedor">
              <Input value={form.proveedor} onChange={e => setForm(f => ({ ...f, proveedor: e.target.value }))} placeholder="Nombre proveedor" className="rounded-xl border-gray-200" />
            </Field>
            <Field label="Nro. comprobante">
              <Input value={form.nroComprobante} onChange={e => setForm(f => ({ ...f, nroComprobante: e.target.value }))} placeholder="Factura / ticket" className="rounded-xl border-gray-200" />
            </Field>
          </div>
          <Field label="Notas">
            <Textarea value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} placeholder="Observaciones..." rows={2} className="rounded-xl border-gray-200 resize-none" />
          </Field>
        </>
      )}

      {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-full text-sm font-bold border border-gray-200 text-gray-500">Cancelar</button>
        <button onClick={guardar} className="flex-1 py-2.5 rounded-full text-sm font-bold" style={{ background: 'var(--dark)', color: 'white' }}>Guardar</button>
      </div>
    </ModalShell>
  );
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-3 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <p className="text-base font-bold" style={{ color: 'var(--dark)' }}>{title}</p>
          <button onClick={onClose} className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600"><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}

export { METODOS, COMPROBANTES, CATEGORIAS };
