import { useState } from 'react';
import type { OrdenTrabajo, Vehiculo, Paciente, EstadoOT } from '../types';
import { ClipboardList, Plus, X, ChevronDown, Pencil, Trash2, DollarSign } from 'lucide-react';

interface Props {
  ordenes: OrdenTrabajo[];
  vehiculos: Vehiculo[];
  clientes: Paciente[];
  onSave: (o: OrdenTrabajo) => void;
  onDelete: (id: string) => void;
}

const ESTADOS: { value: EstadoOT; label: string; color: string; bg: string }[] = [
  { value: 'recibido',      label: 'Recibido',       color: '#6B7280', bg: '#1F2937' },
  { value: 'diagnostico',   label: 'Diagnóstico',    color: '#F59E0B', bg: '#78350F' },
  { value: 'en_reparacion', label: 'En reparación',  color: '#3B82F6', bg: '#1E3A5F' },
  { value: 'listo',         label: 'Listo',          color: '#10B981', bg: '#064E3B' },
  { value: 'entregado',     label: 'Entregado',      color: '#8B5CF6', bg: '#2E1065' },
  { value: 'cancelado',     label: 'Cancelado',      color: '#EF4444', bg: '#450A0A' },
];

const emptyForm = (): Omit<OrdenTrabajo, 'id' | 'createdAt'> => ({
  vehiculoId: '',
  clienteId: '',
  fecha: new Date().toISOString().slice(0, 10),
  descripcion: '',
  diagnostico: '',
  trabajoRealizado: '',
  presupuesto: undefined,
  montoFinal: undefined,
  estado: 'recibido',
  mecanico: '',
  notas: '',
});

export default function OrdenesTrabajo({ ordenes, vehiculos, clientes, onSave, onDelete }: Props) {
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<OrdenTrabajo | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [confirmarBorrar, setConfirmarBorrar] = useState<string | null>(null);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<EstadoOT | 'todos'>('todos');

  const activas = ordenes.filter(o => o.estado !== 'entregado' && o.estado !== 'cancelado');
  const filtradas = filtroEstado === 'todos'
    ? ordenes
    : ordenes.filter(o => o.estado === filtroEstado);

  const sorted = [...filtradas].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  function openNew() {
    setEditing(null);
    setForm(emptyForm());
    setModal(true);
  }

  function openEdit(o: OrdenTrabajo) {
    setEditing(o);
    setForm({
      vehiculoId: o.vehiculoId, clienteId: o.clienteId, fecha: o.fecha,
      descripcion: o.descripcion, diagnostico: o.diagnostico, trabajoRealizado: o.trabajoRealizado,
      presupuesto: o.presupuesto, montoFinal: o.montoFinal, estado: o.estado,
      mecanico: o.mecanico, notas: o.notas,
    });
    setModal(true);
  }

  function handleVehiculoChange(vehiculoId: string) {
    const v = vehiculos.find(x => x.id === vehiculoId);
    setForm(f => ({ ...f, vehiculoId, clienteId: v?.clienteId ?? f.clienteId }));
  }

  function handleSave() {
    if (!form.vehiculoId || !form.descripcion.trim()) return;
    const o: OrdenTrabajo = {
      id: editing?.id ?? crypto.randomUUID(),
      createdAt: editing?.createdAt ?? new Date().toISOString(),
      ...form,
    };
    onSave(o);
    setModal(false);
  }

  function cambiarEstado(o: OrdenTrabajo, estado: EstadoOT) {
    onSave({ ...o, estado });
  }

  const estadoInfo = (e: EstadoOT) => ESTADOS.find(x => x.value === e) ?? ESTADOS[0];

  const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm border outline-none transition-all';
  const inputStyle = { background: 'var(--ui-bg-2)', borderColor: 'var(--ui-border)', color: 'var(--ui-text)' };

  const field = (label: string, node: React.ReactNode) => (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--ui-text-muted)' }}>{label}</label>
      {node}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold" style={{ color: 'var(--ui-text)' }}>Órdenes de Trabajo</h1>
          <p className="text-sm" style={{ color: 'var(--ui-text-muted)' }}>
            {activas.length} activa{activas.length !== 1 ? 's' : ''} · {ordenes.length} total
          </p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: 'var(--cyan)', color: 'var(--dark)' }}>
          <Plus size={16} /> Nueva OT
        </button>
      </div>

      {/* Filtros de estado */}
      <div className="flex gap-1.5 flex-wrap">
        <button onClick={() => setFiltroEstado('todos')}
          className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all"
          style={filtroEstado === 'todos'
            ? { background: 'var(--cyan)', color: 'var(--dark)', borderColor: 'var(--cyan)' }
            : { borderColor: 'var(--ui-border)', color: 'var(--ui-text-muted)' }}>
          Todos
        </button>
        {ESTADOS.map(e => {
          const count = ordenes.filter(o => o.estado === e.value).length;
          if (count === 0 && filtroEstado !== e.value) return null;
          return (
            <button key={e.value} onClick={() => setFiltroEstado(e.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all"
              style={filtroEstado === e.value
                ? { background: e.color, color: '#fff', borderColor: e.color }
                : { borderColor: 'var(--ui-border)', color: 'var(--ui-text-muted)' }}>
              {e.label} {count > 0 && <span className="ml-1 opacity-70">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Lista */}
      {sorted.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--ui-text-muted)' }}>
          <ClipboardList size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No hay órdenes{filtroEstado !== 'todos' ? ' con este estado' : ''}</p>
          {filtroEstado === 'todos' && <p className="text-xs mt-1 opacity-60">Creá la primera OT</p>}
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map(o => {
            const vehiculo = vehiculos.find(v => v.id === o.vehiculoId);
            const cliente = clientes.find(c => c.id === o.clienteId);
            const est = estadoInfo(o.estado);
            const isOpen = expandido === o.id;
            return (
              <div key={o.id} className="rounded-2xl border overflow-hidden transition-all"
                style={{ background: 'var(--ui-bg)', borderColor: 'var(--ui-border)' }}>
                {/* Cabecera */}
                <button onClick={() => setExpandido(isOpen ? null : o.id)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold tracking-widest px-2 py-0.5 rounded-full"
                        style={{ background: est.bg, color: est.color }}>
                        {est.label}
                      </span>
                      {vehiculo && (
                        <span className="font-bold text-sm" style={{ color: 'var(--cyan)' }}>
                          {vehiculo.patente}
                        </span>
                      )}
                      {vehiculo && (
                        <span className="text-sm" style={{ color: 'var(--ui-text)' }}>
                          {vehiculo.marca} {vehiculo.modelo}
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--ui-text-muted)' }}>
                      {o.descripcion}{cliente ? ` · ${cliente.nombre} ${cliente.apellido}` : ''}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--ui-text-muted)' }}>
                      {new Date(o.fecha + 'T12:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {o.presupuesto ? ` · Ppto: $${o.presupuesto.toLocaleString('es-AR')}` : ''}
                      {o.montoFinal ? ` · Final: $${o.montoFinal.toLocaleString('es-AR')}` : ''}
                    </p>
                  </div>
                  <ChevronDown size={16} className={`flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    style={{ color: 'var(--ui-text-muted)' }} />
                </button>

                {/* Detalle expandido */}
                {isOpen && (
                  <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: 'var(--ui-border)' }}>
                    {/* Cambio de estado rápido */}
                    <div className="pt-3">
                      <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--ui-text-muted)' }}>Cambiar estado</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {ESTADOS.map(e => (
                          <button key={e.value} onClick={() => cambiarEstado(o, e.value)}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
                            style={o.estado === e.value
                              ? { background: e.color, color: '#fff' }
                              : { background: 'var(--ui-bg-2)', color: 'var(--ui-text-muted)' }}>
                            {e.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {o.diagnostico && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--ui-text-muted)' }}>Diagnóstico</p>
                        <p className="text-sm" style={{ color: 'var(--ui-text)' }}>{o.diagnostico}</p>
                      </div>
                    )}
                    {o.trabajoRealizado && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--ui-text-muted)' }}>Trabajo realizado</p>
                        <p className="text-sm" style={{ color: 'var(--ui-text)' }}>{o.trabajoRealizado}</p>
                      </div>
                    )}
                    {o.notas && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--ui-text-muted)' }}>Notas</p>
                        <p className="text-sm" style={{ color: 'var(--ui-text)' }}>{o.notas}</p>
                      </div>
                    )}
                    {o.mecanico && (
                      <p className="text-xs" style={{ color: 'var(--ui-text-muted)' }}>Mecánico: {o.mecanico}</p>
                    )}

                    <div className="flex gap-2 pt-1">
                      <button onClick={() => openEdit(o)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all"
                        style={{ borderColor: 'var(--ui-border)', color: 'var(--ui-text-muted)' }}>
                        <Pencil size={13} /> Editar
                      </button>
                      <button onClick={() => setConfirmarBorrar(o.id)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all"
                        style={{ borderColor: 'var(--ui-border)', color: '#EF4444' }}>
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

      {/* Modal nueva/editar OT */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 overflow-y-auto"
          style={{ background: 'rgba(0,0,0,0.7)' }} onClick={e => { if (e.target === e.currentTarget) setModal(false); }}>
          <div className="w-full max-w-sm rounded-3xl p-6 space-y-4 my-4"
            style={{ background: 'var(--ui-bg)', border: '1px solid var(--ui-border)' }}>
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-base" style={{ color: 'var(--ui-text)' }}>
                {editing ? 'Editar OT' : 'Nueva Orden de Trabajo'}
              </h2>
              <button onClick={() => setModal(false)} style={{ color: 'var(--ui-text-muted)' }}><X size={18} /></button>
            </div>

            <div className="space-y-3">
              {field('Vehículo *', (
                <select value={form.vehiculoId} onChange={e => handleVehiculoChange(e.target.value)}
                  className={inputCls} style={inputStyle}>
                  <option value="">Seleccionar vehículo...</option>
                  {vehiculos.map(v => {
                    const c = clientes.find(x => x.id === v.clienteId);
                    return (
                      <option key={v.id} value={v.id}>
                        {v.patente} — {v.marca} {v.modelo}{c ? ` (${c.nombre} ${c.apellido})` : ''}
                      </option>
                    );
                  })}
                </select>
              ))}

              {field('Fecha', (
                <input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                  className={inputCls} style={inputStyle} />
              ))}

              {field('Descripción del problema *', (
                <textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                  placeholder="¿Cuál es el problema o motivo del ingreso?" rows={2}
                  className={inputCls} style={{ ...inputStyle, resize: 'none' }} />
              ))}

              {field('Estado', (
                <select value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value as EstadoOT }))}
                  className={inputCls} style={inputStyle}>
                  {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                </select>
              ))}

              {field('Diagnóstico', (
                <textarea value={form.diagnostico ?? ''} onChange={e => setForm(f => ({ ...f, diagnostico: e.target.value }))}
                  placeholder="Diagnóstico técnico..." rows={2}
                  className={inputCls} style={{ ...inputStyle, resize: 'none' }} />
              ))}

              {field('Trabajo realizado', (
                <textarea value={form.trabajoRealizado ?? ''} onChange={e => setForm(f => ({ ...f, trabajoRealizado: e.target.value }))}
                  placeholder="Descripción del trabajo realizado..." rows={2}
                  className={inputCls} style={{ ...inputStyle, resize: 'none' }} />
              ))}

              <div className="grid grid-cols-2 gap-3">
                {field('Presupuesto ($)', (
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ui-text-muted)' }} />
                    <input type="number" value={form.presupuesto ?? ''} onChange={e => setForm(f => ({ ...f, presupuesto: e.target.value ? parseFloat(e.target.value) : undefined }))}
                      placeholder="0" className={inputCls + ' pl-8'} style={inputStyle} />
                  </div>
                ))}
                {field('Monto final ($)', (
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ui-text-muted)' }} />
                    <input type="number" value={form.montoFinal ?? ''} onChange={e => setForm(f => ({ ...f, montoFinal: e.target.value ? parseFloat(e.target.value) : undefined }))}
                      placeholder="0" className={inputCls + ' pl-8'} style={inputStyle} />
                  </div>
                ))}
              </div>

              {field('Mecánico', (
                <input value={form.mecanico ?? ''} onChange={e => setForm(f => ({ ...f, mecanico: e.target.value }))}
                  placeholder="Nombre del mecánico responsable" className={inputCls} style={inputStyle} />
              ))}

              {field('Notas internas', (
                <textarea value={form.notas ?? ''} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                  placeholder="Notas, repuestos, observaciones..." rows={2}
                  className={inputCls} style={{ ...inputStyle, resize: 'none' }} />
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border"
                style={{ borderColor: 'var(--ui-border)', color: 'var(--ui-text-muted)' }}>
                Cancelar
              </button>
              <button onClick={handleSave}
                disabled={!form.vehiculoId || !form.descripcion.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40"
                style={{ background: 'var(--cyan)', color: 'var(--dark)' }}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmar borrar */}
      {confirmarBorrar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-xs rounded-2xl p-6 text-center space-y-4"
            style={{ background: 'var(--ui-bg)', border: '1px solid var(--ui-border)' }}>
            <p className="font-bold" style={{ color: 'var(--ui-text)' }}>¿Eliminar OT?</p>
            <p className="text-sm" style={{ color: 'var(--ui-text-muted)' }}>Esta acción no se puede deshacer.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmarBorrar(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border"
                style={{ borderColor: 'var(--ui-border)', color: 'var(--ui-text-muted)' }}>
                Cancelar
              </button>
              <button onClick={() => { onDelete(confirmarBorrar); setConfirmarBorrar(null); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-600 text-white">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
