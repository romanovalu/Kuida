import { useState } from 'react';
import type { OrdenTrabajo, Vehiculo, Paciente, EstadoOT, StockItem, Cobro, RepuestoOT } from '../types';
import { ClipboardList, Plus, X, ChevronDown, Pencil, Trash2, DollarSign, Printer, ChevronLeft } from 'lucide-react';
import FotosUploader from './FotosUploader';

interface Props {
  ordenes: OrdenTrabajo[];
  vehiculos: Vehiculo[];
  clientes: Paciente[];
  stock: StockItem[];
  onSave: (o: OrdenTrabajo) => void;
  onDelete: (id: string) => void;
  onCreateCobro: (c: Cobro) => void;
  vehiculoFiltroId?: string;
  onClearFiltroVehiculo?: () => void;
  nombreTaller?: string;
}

const ESTADOS: { value: EstadoOT; label: string; color: string; bg: string; light: string }[] = [
  { value: 'recibido',      label: 'Recibido',      color: '#374151', bg: '#374151', light: '#F3F4F6' },
  { value: 'diagnostico',   label: 'Diagnóstico',   color: '#92400E', bg: '#D97706', light: '#FEF3C7' },
  { value: 'en_reparacion', label: 'En reparación', color: '#1E3A5F', bg: '#3B82F6', light: '#EFF6FF' },
  { value: 'listo',         label: 'Listo',         color: '#064E3B', bg: '#10B981', light: '#ECFDF5' },
  { value: 'entregado',     label: 'Entregado',     color: '#2E1065', bg: '#8B5CF6', light: '#F5F3FF' },
  { value: 'cancelado',     label: 'Cancelado',     color: '#7F1D1D', bg: '#EF4444', light: '#FEF2F2' },
];

const emptyForm = (): Omit<OrdenTrabajo, 'id' | 'createdAt'> => ({
  vehiculoId: '', clienteId: '',
  fecha: new Date().toISOString().slice(0, 10),
  descripcion: '', diagnostico: '', trabajoRealizado: '',
  presupuesto: undefined, montoFinal: undefined,
  estado: 'recibido', mecanico: '', notas: '', fotos: [], repuestos: [],
});

function printOT(o: OrdenTrabajo, vehiculo: Vehiculo | undefined, cliente: Paciente | undefined, nombreTaller: string) {
  const reps = o.repuestos ?? [];
  const costoReps = reps.reduce((a, r) => a + r.cantidad * (r.precioUnitario ?? 0), 0);
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
  <title>OT — ${vehiculo?.patente ?? o.id.slice(0, 8)}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, sans-serif; padding: 32px; color: #111; font-size: 13px; }
    h1 { font-size: 20px; font-weight: 900; margin-bottom: 2px; }
    .sub { color: #555; font-size: 12px; margin-bottom: 20px; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 16px; }
    .ot-num { font-size: 11px; color: #666; font-weight: bold; text-transform: uppercase; letter-spacing: .05em; }
    .section { margin-bottom: 14px; }
    .label { font-size: 10px; text-transform: uppercase; letter-spacing: .08em; color: #888; font-weight: bold; margin-bottom: 3px; }
    .value { font-size: 13px; color: #111; }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
    table { width: 100%; border-collapse: collapse; margin-top: 6px; }
    th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: .06em; color: #666; border-bottom: 1px solid #ddd; padding: 4px 6px; }
    td { padding: 5px 6px; border-bottom: 1px solid #f0f0f0; font-size: 12px; }
    .total-row { font-weight: bold; background: #f8f8f8; }
    .firma { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
    .firma-line { border-top: 1px solid #999; padding-top: 6px; font-size: 11px; color: #666; text-align: center; }
    .badge { display:inline-block; padding: 2px 10px; border-radius: 20px; font-size: 11px; font-weight: bold; background: #f0f0f0; color: #444; }
    @media print { body { padding: 18px; } }
  </style></head><body>
  <div class="header">
    <div><h1>${nombreTaller || 'Taller Mecánico'}</h1><p class="sub">Orden de Trabajo</p></div>
    <div style="text-align:right">
      <p class="ot-num">OT # ${o.id.slice(0, 8).toUpperCase()}</p>
      <p style="font-size:12px;color:#555">${new Date(o.fecha + 'T12:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
      <span class="badge">${o.estado.replace('_', ' ')}</span>
    </div>
  </div>
  <div class="grid2">
    <div class="section">
      <p class="label">Vehículo</p>
      <p class="value" style="font-weight:bold;font-size:15px">${vehiculo?.patente ?? '—'}</p>
      <p class="value">${vehiculo ? `${vehiculo.marca} ${vehiculo.modelo}${vehiculo.anio ? ` (${vehiculo.anio})` : ''}` : '—'}</p>
      ${vehiculo?.color ? `<p class="value" style="color:#666">${vehiculo.color}</p>` : ''}
    </div>
    <div class="section">
      <p class="label">Cliente</p>
      <p class="value">${cliente ? `${cliente.nombre} ${cliente.apellido}` : '—'}</p>
      ${cliente?.telefono ? `<p class="value" style="color:#555">${cliente.telefono}</p>` : ''}
      ${cliente?.email ? `<p class="value" style="color:#555">${cliente.email}</p>` : ''}
    </div>
  </div>
  <div class="section">
    <p class="label">Motivo de ingreso</p>
    <p class="value">${o.descripcion}</p>
  </div>
  ${o.diagnostico ? `<div class="section"><p class="label">Diagnóstico</p><p class="value">${o.diagnostico}</p></div>` : ''}
  ${o.trabajoRealizado ? `<div class="section"><p class="label">Trabajo realizado</p><p class="value">${o.trabajoRealizado}</p></div>` : ''}
  ${reps.length > 0 ? `
  <div class="section">
    <p class="label">Repuestos y materiales</p>
    <table>
      <tr><th>Ítem</th><th style="text-align:right">Cant.</th><th style="text-align:right">P. Unit.</th><th style="text-align:right">Subtotal</th></tr>
      ${reps.map(r => `<tr><td>${r.nombre}</td><td style="text-align:right">${r.cantidad}</td><td style="text-align:right">${r.precioUnitario ? '$' + r.precioUnitario.toLocaleString('es-AR') : '—'}</td><td style="text-align:right">${r.precioUnitario ? '$' + (r.cantidad * r.precioUnitario).toLocaleString('es-AR') : '—'}</td></tr>`).join('')}
      ${costoReps > 0 ? `<tr class="total-row"><td colspan="3">Total repuestos</td><td style="text-align:right">$${costoReps.toLocaleString('es-AR')}</td></tr>` : ''}
    </table>
  </div>` : ''}
  <div class="grid2" style="margin-top:8px">
    ${o.presupuesto ? `<div class="section"><p class="label">Presupuesto</p><p class="value" style="font-size:16px;font-weight:bold">$${o.presupuesto.toLocaleString('es-AR')}</p></div>` : ''}
    ${o.montoFinal ? `<div class="section"><p class="label">Monto final</p><p class="value" style="font-size:16px;font-weight:bold">$${o.montoFinal.toLocaleString('es-AR')}</p></div>` : ''}
  </div>
  ${o.mecanico ? `<div class="section"><p class="label">Mecánico</p><p class="value">${o.mecanico}</p></div>` : ''}
  ${o.notas ? `<div class="section"><p class="label">Notas</p><p class="value" style="color:#555;font-style:italic">${o.notas}</p></div>` : ''}
  <div class="firma">
    <div class="firma-line">Firma del mecánico</div>
    <div class="firma-line">Conformidad del cliente</div>
  </div>
  <script>window.onload=()=>{window.print();}</script>
  </body></html>`);
  win.document.close();
}

export default function OrdenesTrabajo({ ordenes, vehiculos, clientes, stock, onSave, onDelete, onCreateCobro, vehiculoFiltroId, onClearFiltroVehiculo, nombreTaller }: Props) {
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<OrdenTrabajo | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [confirmarBorrar, setConfirmarBorrar] = useState<string | null>(null);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<EstadoOT | 'todos'>('todos');
  // Oferta de cobro al entregar
  const [ofrecerCobro, setOfrecerCobro] = useState<OrdenTrabajo | null>(null);
  // Picker de repuesto en el form
  const [repStock, setRepStock] = useState('');
  const [repCant, setRepCant] = useState(1);

  const vehiculoFiltro = vehiculoFiltroId ? vehiculos.find(v => v.id === vehiculoFiltroId) : undefined;
  const ordenesPorVehiculo = vehiculoFiltroId ? ordenes.filter(o => o.vehiculoId === vehiculoFiltroId) : ordenes;
  const activas = ordenesPorVehiculo.filter(o => o.estado !== 'entregado' && o.estado !== 'cancelado');
  const filtradas = filtroEstado === 'todos' ? ordenesPorVehiculo : ordenesPorVehiculo.filter(o => o.estado === filtroEstado);
  const sorted = [...filtradas].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  function openNew() { setEditing(null); setForm(emptyForm()); setRepStock(''); setRepCant(1); setModal(true); }
  function openEdit(o: OrdenTrabajo) {
    setEditing(o);
    setForm({ vehiculoId: o.vehiculoId, clienteId: o.clienteId, fecha: o.fecha, descripcion: o.descripcion, diagnostico: o.diagnostico, trabajoRealizado: o.trabajoRealizado, presupuesto: o.presupuesto, montoFinal: o.montoFinal, estado: o.estado, mecanico: o.mecanico, notas: o.notas, fotos: o.fotos ?? [], repuestos: o.repuestos ?? [] });
    setRepStock(''); setRepCant(1);
    setModal(true);
  }
  function handleVehiculoChange(vehiculoId: string) {
    const v = vehiculos.find(x => x.id === vehiculoId);
    setForm(f => ({ ...f, vehiculoId, clienteId: v?.clienteId ?? f.clienteId }));
  }
  function handleSave() {
    if (!form.vehiculoId || !form.descripcion.trim()) return;
    onSave({ id: editing?.id ?? crypto.randomUUID(), createdAt: editing?.createdAt ?? new Date().toISOString(), ...form });
    setModal(false);
  }

  // Cambio rápido de estado: si es 'entregado' y hay monto, ofrece crear cobro
  function cambiarEstado(o: OrdenTrabajo, nuevoEstado: EstadoOT) {
    const updated = { ...o, estado: nuevoEstado };
    onSave(updated);
    if (nuevoEstado === 'entregado' && (o.montoFinal ?? o.presupuesto)) {
      setOfrecerCobro(updated);
    }
  }

  // Agregar repuesto al form
  function addRepuesto() {
    const item = stock.find(s => s.id === repStock);
    if (!item || repCant <= 0) return;
    const rep: RepuestoOT = {
      stockItemId: item.id,
      nombre: item.nombre,
      cantidad: repCant,
      precioUnitario: item.precioVenta,
    };
    setForm(f => ({ ...f, repuestos: [...(f.repuestos ?? []), rep] }));
    setRepStock(''); setRepCant(1);
  }
  function removeRepuesto(idx: number) {
    setForm(f => ({ ...f, repuestos: (f.repuestos ?? []).filter((_, i) => i !== idx) }));
  }

  // Crear cobro desde oferta
  function confirmarCobro(o: OrdenTrabajo) {
    const monto = o.montoFinal ?? o.presupuesto ?? 0;
    const vehiculo = vehiculos.find(v => v.id === o.vehiculoId);
    const cobro: Cobro = {
      id: crypto.randomUUID(),
      fecha: new Date().toISOString().slice(0, 10),
      concepto: `OT — ${vehiculo?.patente ?? ''} ${vehiculo?.marca ?? ''} ${vehiculo?.modelo ?? ''}`.trim(),
      monto,
      metodoPago: 'efectivo',
      pacienteId: o.clienteId || undefined,
      tipoComprobante: 'recibo',
      createdAt: new Date().toISOString(),
    };
    onCreateCobro(cobro);
    setOfrecerCobro(null);
  }

  const estadoInfo = (e: EstadoOT) => ESTADOS.find(x => x.value === e) ?? ESTADOS[0];

  const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-cyan-300 transition-all text-gray-900 placeholder:text-gray-400';
  const field = (label: string, node: React.ReactNode) => (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-gray-500">{label}</label>
      {node}
    </div>
  );

  // Costo total repuestos en el form
  const costoRepuestos = (form.repuestos ?? []).reduce((acc, r) => acc + r.cantidad * (r.precioUnitario ?? 0), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      {vehiculoFiltro && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: 'var(--cyan-light)', color: 'var(--cyan-dark)' }}>
          <button onClick={onClearFiltroVehiculo} className="p-1 rounded-lg hover:bg-black/10 transition-colors">
            <ChevronLeft size={15} />
          </button>
          <span className="font-bold tracking-wider">{vehiculoFiltro.patente}</span>
          <span className="text-sm">{vehiculoFiltro.marca} {vehiculoFiltro.modelo}</span>
          <span className="ml-auto text-xs opacity-70">{ordenesPorVehiculo.length} OT{ordenesPorVehiculo.length !== 1 ? 's' : ''}</span>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--dark)' }}>Órdenes de Trabajo</h1>
          <p className="text-sm text-gray-500">{activas.length} activa{activas.length !== 1 ? 's' : ''} · {ordenesPorVehiculo.length} total</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold hover:opacity-90 transition-opacity"
          style={{ background: 'var(--cyan)', color: 'var(--dark)' }}>
          <Plus size={14} /> Nueva OT
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-1.5 flex-wrap">
        <button onClick={() => setFiltroEstado('todos')}
          className="px-3 py-1.5 rounded-full text-xs font-bold border transition-all"
          style={filtroEstado === 'todos' ? { background: 'var(--cyan)', color: 'var(--dark)', borderColor: 'var(--cyan)' } : { borderColor: '#E5E7EB', color: '#6B7280' }}>
          Todos
        </button>
        {ESTADOS.map(e => {
          const count = ordenes.filter(o => o.estado === e.value).length;
          if (count === 0 && filtroEstado !== e.value) return null;
          return (
            <button key={e.value} onClick={() => setFiltroEstado(e.value)}
              className="px-3 py-1.5 rounded-full text-xs font-bold border transition-all"
              style={filtroEstado === e.value
                ? { background: e.bg, color: '#fff', borderColor: e.bg }
                : { borderColor: '#E5E7EB', color: '#6B7280' }}>
              {e.label}{count > 0 ? ` (${count})` : ''}
            </button>
          );
        })}
      </div>

      {/* Lista */}
      {sorted.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ClipboardList size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium text-gray-500">No hay órdenes{filtroEstado !== 'todos' ? ' con este estado' : ''}</p>
          {filtroEstado === 'todos' && <p className="text-xs mt-1">Creá la primera OT con el botón de arriba</p>}
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map(o => {
            const vehiculo = vehiculos.find(v => v.id === o.vehiculoId);
            const cliente = clientes.find(c => c.id === o.clienteId);
            const est = estadoInfo(o.estado);
            const isOpen = expandido === o.id;
            const reps = o.repuestos ?? [];
            return (
              <div key={o.id} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                <button onClick={() => setExpandido(isOpen ? null : o.id)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: est.light, color: est.color }}>
                        {est.label}
                      </span>
                      {vehiculo && <span className="font-bold text-sm" style={{ color: 'var(--cyan-dark)' }}>{vehiculo.patente}</span>}
                      {vehiculo && <span className="text-sm font-semibold text-gray-800">{vehiculo.marca} {vehiculo.modelo}</span>}
                    </div>
                    <p className="text-xs mt-0.5 text-gray-500 truncate">
                      {o.descripcion}{cliente ? ` · ${cliente.nombre} ${cliente.apellido}` : ''}
                    </p>
                    <p className="text-xs mt-0.5 text-gray-400">
                      {new Date(o.fecha + 'T12:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {o.presupuesto ? ` · Ppto: $${o.presupuesto.toLocaleString('es-AR')}` : ''}
                      {o.montoFinal ? ` · Final: $${o.montoFinal.toLocaleString('es-AR')}` : ''}
                      {reps.length > 0 ? ` · ${reps.length} repuesto${reps.length !== 1 ? 's' : ''}` : ''}
                    </p>
                  </div>
                  <ChevronDown size={16} className={`flex-shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
                    {/* Cambio rápido de estado */}
                    <div className="pt-3">
                      <p className="text-xs font-bold uppercase tracking-wider mb-2 text-gray-500">Cambiar estado</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {ESTADOS.map(e => (
                          <button key={e.value} onClick={() => cambiarEstado(o, e.value)}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
                            style={o.estado === e.value
                              ? { background: e.bg, color: '#fff' }
                              : { background: '#F3F4F6', color: '#6B7280' }}>
                            {e.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {o.diagnostico && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider mb-1 text-gray-400">Diagnóstico</p>
                        <p className="text-sm text-gray-800">{o.diagnostico}</p>
                      </div>
                    )}
                    {o.trabajoRealizado && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider mb-1 text-gray-400">Trabajo realizado</p>
                        <p className="text-sm text-gray-800">{o.trabajoRealizado}</p>
                      </div>
                    )}
                    {reps.length > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider mb-1 text-gray-400">Repuestos utilizados</p>
                        <div className="space-y-1">
                          {reps.map((r, i) => (
                            <div key={i} className="flex items-center justify-between text-xs text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg">
                              <span>{r.nombre} × {r.cantidad}</span>
                              {r.precioUnitario && <span className="text-gray-400">${(r.cantidad * r.precioUnitario).toLocaleString('es-AR')}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {o.notas && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider mb-1 text-gray-400">Notas</p>
                        <p className="text-sm text-gray-800">{o.notas}</p>
                      </div>
                    )}
                    {o.mecanico && <p className="text-xs text-gray-500">Mecánico: {o.mecanico}</p>}
                    <FotosUploader
                      fotos={o.fotos ?? []}
                      folder={`ot/${o.id}`}
                      onChange={fotos => onSave({ ...o, fotos })}
                    />
                    <div className="flex gap-2 pt-1 flex-wrap">
                      <button onClick={() => openEdit(o)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                        <Pencil size={13} /> Editar
                      </button>
                      <button onClick={() => printOT(o, vehiculo, cliente, nombreTaller ?? '')}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                        <Printer size={13} /> Imprimir
                      </button>
                      <button onClick={() => setConfirmarBorrar(o.id)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-red-100 text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 size={13} /> Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal crear/editar */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-start justify-center overflow-y-auto"
          style={{ background: 'rgba(0,0,0,0.5)' }} onClick={e => { if (e.target === e.currentTarget) setModal(false); }}>
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 space-y-4 shadow-2xl my-4 mx-4 md:my-8">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-base text-gray-900">{editing ? 'Editar OT' : 'Nueva Orden de Trabajo'}</h2>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              {field('Vehículo *', (
                <select value={form.vehiculoId} onChange={e => handleVehiculoChange(e.target.value)} className={inputCls}>
                  <option value="">Seleccionar vehículo...</option>
                  {vehiculos.map(v => {
                    const c = clientes.find(x => x.id === v.clienteId);
                    return <option key={v.id} value={v.id}>{v.patente} — {v.marca} {v.modelo}{c ? ` (${c.nombre} ${c.apellido})` : ''}</option>;
                  })}
                </select>
              ))}
              {field('Fecha', <input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} className={inputCls} />)}
              {field('Descripción del problema *', (
                <textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                  placeholder="¿Cuál es el problema o motivo del ingreso?" rows={2}
                  className={inputCls} style={{ resize: 'none' }} />
              ))}
              {field('Estado', (
                <select value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value as EstadoOT }))} className={inputCls}>
                  {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                </select>
              ))}
              {field('Diagnóstico', (
                <textarea value={form.diagnostico ?? ''} onChange={e => setForm(f => ({ ...f, diagnostico: e.target.value }))}
                  placeholder="Diagnóstico técnico..." rows={2} className={inputCls} style={{ resize: 'none' }} />
              ))}
              {field('Trabajo realizado', (
                <textarea value={form.trabajoRealizado ?? ''} onChange={e => setForm(f => ({ ...f, trabajoRealizado: e.target.value }))}
                  placeholder="Descripción del trabajo..." rows={2} className={inputCls} style={{ resize: 'none' }} />
              ))}
              <div className="grid grid-cols-2 gap-3">
                {field('Presupuesto ($)', (
                  <div className="relative">
                    <DollarSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="number" value={form.presupuesto ?? ''} onChange={e => setForm(f => ({ ...f, presupuesto: e.target.value ? parseFloat(e.target.value) : undefined }))}
                      placeholder="0" className={inputCls + ' pl-8'} />
                  </div>
                ))}
                {field('Monto final ($)', (
                  <div className="relative">
                    <DollarSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="number" value={form.montoFinal ?? ''} onChange={e => setForm(f => ({ ...f, montoFinal: e.target.value ? parseFloat(e.target.value) : undefined }))}
                      placeholder="0" className={inputCls + ' pl-8'} />
                  </div>
                ))}
              </div>
              {field('Mecánico', <input value={form.mecanico ?? ''} onChange={e => setForm(f => ({ ...f, mecanico: e.target.value }))} placeholder="Nombre del mecánico" className={inputCls} />)}
              {field('Notas internas', (
                <textarea value={form.notas ?? ''} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                  placeholder="Repuestos, observaciones..." rows={2} className={inputCls} style={{ resize: 'none' }} />
              ))}

              {/* ── Repuestos del stock ── */}
              {stock.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Repuestos / Materiales</p>
                  {/* Lista de repuestos ya agregados */}
                  {(form.repuestos ?? []).length > 0 && (
                    <div className="space-y-1">
                      {(form.repuestos ?? []).map((r, i) => (
                        <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2 text-xs">
                          <div>
                            <span className="font-semibold text-gray-800">{r.nombre}</span>
                            <span className="text-gray-400 ml-2">× {r.cantidad}</span>
                            {r.precioUnitario && <span className="text-gray-400 ml-2">${(r.cantidad * r.precioUnitario).toLocaleString('es-AR')}</span>}
                          </div>
                          <button onClick={() => removeRepuesto(i)} className="text-red-400 hover:text-red-600 ml-2">
                            <X size={13} />
                          </button>
                        </div>
                      ))}
                      {costoRepuestos > 0 && (
                        <p className="text-xs text-right font-bold text-gray-600 pr-1">
                          Costo repuestos: ${costoRepuestos.toLocaleString('es-AR')}
                        </p>
                      )}
                    </div>
                  )}
                  {/* Picker para agregar */}
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <select value={repStock} onChange={e => setRepStock(e.target.value)} className={inputCls}>
                        <option value="">Seleccionar ítem...</option>
                        {stock.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.nombre} (stock: {s.cantidad} {s.unidad ?? 'u'})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-20 flex-shrink-0">
                      <input type="number" min={1} value={repCant}
                        onChange={e => setRepCant(parseFloat(e.target.value) || 1)}
                        className={inputCls} placeholder="Cant." />
                    </div>
                    <button onClick={addRepuesto} disabled={!repStock}
                      className="flex-shrink-0 px-3 py-2.5 rounded-xl text-xs font-bold disabled:opacity-40 transition-opacity"
                      style={{ background: 'var(--cyan)', color: 'var(--dark)' }}>
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={!form.vehiculoId || !form.descripcion.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40 hover:opacity-90 transition-opacity"
                style={{ background: 'var(--cyan)', color: 'var(--dark)' }}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Oferta de cobro al entregar */}
      {ofrecerCobro && (() => {
        const monto = ofrecerCobro.montoFinal ?? ofrecerCobro.presupuesto ?? 0;
        const vehiculo = vehiculos.find(v => v.id === ofrecerCobro.vehiculoId);
        const cliente = clientes.find(c => c.id === ofrecerCobro.clienteId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)' }}>
            <div className="w-full max-w-xs bg-white rounded-3xl p-6 space-y-4 shadow-2xl text-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
                style={{ background: 'var(--cyan-light)', color: 'var(--cyan-dark)' }}>
                <DollarSign size={22} />
              </div>
              <div>
                <p className="font-extrabold text-gray-900 text-base">¿Registrar cobro?</p>
                <p className="text-sm text-gray-500 mt-1">
                  {vehiculo ? `${vehiculo.patente} · ${vehiculo.marca} ${vehiculo.modelo}` : ''}
                  {cliente ? ` · ${cliente.nombre} ${cliente.apellido}` : ''}
                </p>
                <p className="text-2xl font-extrabold mt-2" style={{ color: 'var(--dark)' }}>
                  ${monto.toLocaleString('es-AR')}
                </p>
                <p className="text-xs text-gray-400 mt-1">Se va a registrar en Finanzas como cobro en efectivo</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setOfrecerCobro(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                  Omitir
                </button>
                <button onClick={() => confirmarCobro(ofrecerCobro)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
                  style={{ background: 'var(--cyan)', color: 'var(--dark)' }}>
                  Registrar cobro
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {confirmarBorrar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-xs bg-white rounded-2xl p-6 text-center space-y-4 shadow-2xl">
            <p className="font-bold text-gray-900">¿Eliminar OT?</p>
            <p className="text-sm text-gray-500">Esta acción no se puede deshacer.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmarBorrar(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-500">Cancelar</button>
              <button onClick={() => { onDelete(confirmarBorrar); setConfirmarBorrar(null); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-600 text-white">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
