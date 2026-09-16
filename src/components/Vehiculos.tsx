import { useState } from 'react';
import type { Vehiculo, Paciente } from '../types';
import { Car, Plus, Search, Pencil, Trash2, X, ChevronRight } from 'lucide-react';

interface Props {
  vehiculos: Vehiculo[];
  clientes: Paciente[];
  onSave: (v: Vehiculo) => void;
  onDelete: (id: string) => void;
  onVerOrdenes?: (v: Vehiculo) => void;
}

const empty = (): Omit<Vehiculo, 'id' | 'createdAt'> => ({
  clienteId: '',
  patente: '',
  marca: '',
  modelo: '',
  anio: undefined,
  color: '',
  notas: '',
});

export default function Vehiculos({ vehiculos, clientes, onSave, onDelete, onVerOrdenes }: Props) {
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Vehiculo | null>(null);
  const [form, setForm] = useState(empty());
  const [confirmarBorrar, setConfirmarBorrar] = useState<string | null>(null);

  const filtered = vehiculos.filter(v => {
    const q = search.toLowerCase();
    const cliente = clientes.find(c => c.id === v.clienteId);
    return (
      v.patente.toLowerCase().includes(q) ||
      v.marca.toLowerCase().includes(q) ||
      v.modelo.toLowerCase().includes(q) ||
      (cliente && `${cliente.nombre} ${cliente.apellido}`.toLowerCase().includes(q))
    );
  });

  function openNew() {
    setEditing(null);
    setForm(empty());
    setModal(true);
  }

  function openEdit(v: Vehiculo) {
    setEditing(v);
    setForm({ clienteId: v.clienteId, patente: v.patente, marca: v.marca, modelo: v.modelo, anio: v.anio, color: v.color, notas: v.notas });
    setModal(true);
  }

  function handleSave() {
    if (!form.patente.trim() || !form.marca.trim() || !form.modelo.trim()) return;
    const v: Vehiculo = {
      id: editing?.id ?? crypto.randomUUID(),
      createdAt: editing?.createdAt ?? new Date().toISOString(),
      ...form,
      patente: form.patente.toUpperCase().trim(),
    };
    onSave(v);
    setModal(false);
  }

  function handleDelete(id: string) {
    onDelete(id);
    setConfirmarBorrar(null);
  }

  const field = (label: string, node: React.ReactNode) => (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--ui-text-muted)' }}>{label}</label>
      {node}
    </div>
  );

  const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm border outline-none focus:ring-2 transition-all';
  const inputStyle = { background: 'var(--ui-bg-2)', borderColor: 'var(--ui-border)', color: 'var(--ui-text)' };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold" style={{ color: 'var(--ui-text)' }}>Vehículos</h1>
          <p className="text-sm" style={{ color: 'var(--ui-text-muted)' }}>{vehiculos.length} registrado{vehiculos.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
          style={{ background: 'var(--cyan)', color: 'var(--dark)' }}>
          <Plus size={16} /> Nuevo
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ui-text-muted)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por patente, marca o cliente..."
          className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm border outline-none"
          style={{ background: 'var(--ui-bg-2)', borderColor: 'var(--ui-border)', color: 'var(--ui-text)' }} />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--ui-text-muted)' }}>
          <Car size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No hay vehículos{search ? ' que coincidan' : ' registrados'}</p>
          {!search && <p className="text-xs mt-1 opacity-60">Hacé clic en "Nuevo" para agregar el primero</p>}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(v => {
            const cliente = clientes.find(c => c.id === v.clienteId);
            return (
              <div key={v.id}
                className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all"
                style={{ background: 'var(--ui-bg)', borderColor: 'var(--ui-border)' }}>
                <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--cyan-light)', color: 'var(--cyan-dark)' }}>
                  <Car size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm tracking-widest" style={{ color: 'var(--cyan)' }}>{v.patente}</span>
                    <span className="text-sm font-semibold" style={{ color: 'var(--ui-text)' }}>{v.marca} {v.modelo}</span>
                    {v.anio && <span className="text-xs" style={{ color: 'var(--ui-text-muted)' }}>{v.anio}</span>}
                    {v.color && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--ui-bg-2)', color: 'var(--ui-text-muted)' }}>{v.color}</span>}
                  </div>
                  {cliente && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--ui-text-muted)' }}>
                      {cliente.nombre} {cliente.apellido} · {cliente.telefono}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {onVerOrdenes && (
                    <button onClick={() => onVerOrdenes(v)}
                      className="p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                      style={{ color: 'var(--cyan)' }} title="Ver órdenes de trabajo">
                      OT <ChevronRight size={14} />
                    </button>
                  )}
                  <button onClick={() => openEdit(v)}
                    className="p-2 rounded-lg transition-all" style={{ color: 'var(--ui-text-muted)' }}
                    title="Editar">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => setConfirmarBorrar(v.id)}
                    className="p-2 rounded-lg transition-all" style={{ color: 'var(--ui-text-muted)' }}
                    title="Eliminar">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal nuevo/editar */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }} onClick={e => { if (e.target === e.currentTarget) setModal(false); }}>
          <div className="w-full max-w-sm rounded-3xl p-6 space-y-4"
            style={{ background: 'var(--ui-bg)', border: '1px solid var(--ui-border)' }}>
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-base" style={{ color: 'var(--ui-text)' }}>
                {editing ? 'Editar vehículo' : 'Nuevo vehículo'}
              </h2>
              <button onClick={() => setModal(false)} style={{ color: 'var(--ui-text-muted)' }}><X size={18} /></button>
            </div>

            <div className="space-y-3">
              {field('Cliente', (
                <select value={form.clienteId} onChange={e => setForm(f => ({ ...f, clienteId: e.target.value }))}
                  className={inputCls} style={inputStyle}>
                  <option value="">Sin asignar</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>
                  ))}
                </select>
              ))}
              {field('Patente *', (
                <input value={form.patente} onChange={e => setForm(f => ({ ...f, patente: e.target.value }))}
                  placeholder="ABC 123" className={inputCls} style={inputStyle} />
              ))}
              <div className="grid grid-cols-2 gap-3">
                {field('Marca *', (
                  <input value={form.marca} onChange={e => setForm(f => ({ ...f, marca: e.target.value }))}
                    placeholder="Toyota" className={inputCls} style={inputStyle} />
                ))}
                {field('Modelo *', (
                  <input value={form.modelo} onChange={e => setForm(f => ({ ...f, modelo: e.target.value }))}
                    placeholder="Corolla" className={inputCls} style={inputStyle} />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {field('Año', (
                  <input type="number" value={form.anio ?? ''} onChange={e => setForm(f => ({ ...f, anio: e.target.value ? parseInt(e.target.value) : undefined }))}
                    placeholder="2018" className={inputCls} style={inputStyle} />
                ))}
                {field('Color', (
                  <input value={form.color ?? ''} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                    placeholder="Blanco" className={inputCls} style={inputStyle} />
                ))}
              </div>
              {field('Notas', (
                <textarea value={form.notas ?? ''} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                  placeholder="Observaciones, historial previo..." rows={2}
                  className={inputCls} style={{ ...inputStyle, resize: 'none' }} />
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all"
                style={{ borderColor: 'var(--ui-border)', color: 'var(--ui-text-muted)' }}>
                Cancelar
              </button>
              <button onClick={handleSave}
                disabled={!form.patente.trim() || !form.marca.trim() || !form.modelo.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
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
            <p className="font-bold" style={{ color: 'var(--ui-text)' }}>¿Eliminar vehículo?</p>
            <p className="text-sm" style={{ color: 'var(--ui-text-muted)' }}>Esta acción no se puede deshacer.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmarBorrar(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border"
                style={{ borderColor: 'var(--ui-border)', color: 'var(--ui-text-muted)' }}>
                Cancelar
              </button>
              <button onClick={() => handleDelete(confirmarBorrar)}
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
