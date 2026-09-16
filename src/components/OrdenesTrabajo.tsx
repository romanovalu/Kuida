import { useState } from 'react';
import type { OrdenTrabajo, Vehiculo, Paciente, EstadoOT } from '../types';
import { ClipboardList, Plus, X, ChevronDown, Pencil, Trash2, DollarSign } from 'lucide-react';
import FotosUploader from './FotosUploader';

interface Props {
  ordenes: OrdenTrabajo[];
  vehiculos: Vehiculo[];
  clientes: Paciente[];
  onSave: (o: OrdenTrabajo) => void;
  onDelete: (id: string) => void;
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
  estado: 'recibido', mecanico: '', notas: '', fotos: [],
});

export default function OrdenesTrabajo({ ordenes, vehiculos, clientes, onSave, onDelete }: Props) {
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<OrdenTrabajo | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [confirmarBorrar, setConfirmarBorrar] = useState<string | null>(null);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<EstadoOT | 'todos'>('todos');

  const activas = ordenes.filter(o => o.estado !== 'entregado' && o.estado !== 'cancelado');
  const filtradas = filtroEstado === 'todos' ? ordenes : ordenes.filter(o => o.estado === filtroEstado);
  const sorted = [...filtradas].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  function openNew() { setEditing(null); setForm(emptyForm()); setModal(true); }
  function openEdit(o: OrdenTrabajo) {
    setEditing(o);
    setForm({ vehiculoId: o.vehiculoId, clienteId: o.clienteId, fecha: o.fecha, descripcion: o.descripcion, diagnostico: o.diagnostico, trabajoRealizado: o.trabajoRealizado, presupuesto: o.presupuesto, montoFinal: o.montoFinal, estado: o.estado, mecanico: o.mecanico, notas: o.notas, fotos: o.fotos ?? [] });
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

  const estadoInfo = (e: EstadoOT) => ESTADOS.find(x => x.value === e) ?? ESTADOS[0];

  const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-cyan-300 transition-all text-gray-900 placeholder:text-gray-400';
  const field = (label: string, node: React.ReactNode) => (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-gray-500">{label}</label>
      {node}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--dark)' }}>Órdenes de Trabajo</h1>
          <p className="text-sm text-gray-500">{activas.length} activa{activas.length !== 1 ? 's' : ''} · {ordenes.length} total</p>
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
                          <button key={e.value} onClick={() => onSave({ ...o, estado: e.value })}
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
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => openEdit(o)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                        <Pencil size={13} /> Editar
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

      {/* Modal */}
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
