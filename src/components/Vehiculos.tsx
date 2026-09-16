import { useState } from 'react';
import type { Vehiculo, Paciente } from '../types';
import { Car, Plus, Search, Pencil, Trash2, X, ChevronRight, QrCode } from 'lucide-react';
import QRModal from './QRModal';

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
  const [qrVehiculo, setQrVehiculo] = useState<Vehiculo | null>(null);

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

  function openNew() { setEditing(null); setForm(empty()); setModal(true); }
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
          <h1 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--dark)' }}>Vehículos</h1>
          <p className="text-sm text-gray-500">{vehiculos.length} registrado{vehiculos.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold hover:opacity-90 transition-opacity"
          style={{ background: 'var(--cyan)', color: 'var(--dark)' }}>
          <Plus size={14} /> Nuevo
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por patente, marca o cliente..."
          className="w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-200 bg-white shadow-sm text-sm outline-none text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-cyan-300" />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Car size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium text-gray-500">No hay vehículos{search ? ' que coincidan' : ' registrados'}</p>
          {!search && <p className="text-xs mt-1 text-gray-400">Hacé clic en "Nuevo" para agregar el primero</p>}
        </div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          {filtered.map((v, i) => {
            const cliente = clientes.find(c => c.id === v.clienteId);
            return (
              <div key={v.id}
                className={`flex items-center gap-3 px-4 py-3.5 ${i !== 0 ? 'border-t border-gray-100' : ''}`}>
                <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--cyan-light)', color: 'var(--cyan-dark)' }}>
                  <Car size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm tracking-widest" style={{ color: 'var(--cyan-dark)' }}>{v.patente}</span>
                    <span className="text-sm font-semibold text-gray-800">{v.marca} {v.modelo}</span>
                    {v.anio && <span className="text-xs text-gray-400">{v.anio}</span>}
                    {v.color && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{v.color}</span>}
                  </div>
                  {cliente && (
                    <p className="text-xs mt-0.5 text-gray-500">
                      {cliente.nombre} {cliente.apellido}{cliente.telefono ? ` · ${cliente.telefono}` : ''}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {onVerOrdenes && (
                    <button onClick={() => onVerOrdenes(v)}
                      className="p-2 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-gray-50 transition-colors"
                      style={{ color: 'var(--cyan-dark)' }} title="Ver órdenes de trabajo">
                      OT <ChevronRight size={13} />
                    </button>
                  )}
                  <button onClick={() => setQrVehiculo(v)}
                    className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                    title="Código QR">
                    <QrCode size={15} />
                  </button>
                  <button onClick={() => openEdit(v)}
                    className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => setConfirmarBorrar(v.id)}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }} onClick={e => { if (e.target === e.currentTarget) setModal(false); }}>
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-base text-gray-900">{editing ? 'Editar vehículo' : 'Nuevo vehículo'}</h2>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              {field('Cliente', (
                <select value={form.clienteId} onChange={e => setForm(f => ({ ...f, clienteId: e.target.value }))}
                  className={inputCls}>
                  <option value="">Sin asignar</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>)}
                </select>
              ))}
              {field('Patente *', (
                <input value={form.patente} onChange={e => setForm(f => ({ ...f, patente: e.target.value }))}
                  placeholder="ABC 123" className={inputCls} />
              ))}
              <div className="grid grid-cols-2 gap-3">
                {field('Marca *', <input value={form.marca} onChange={e => setForm(f => ({ ...f, marca: e.target.value }))} placeholder="Toyota" className={inputCls} />)}
                {field('Modelo *', <input value={form.modelo} onChange={e => setForm(f => ({ ...f, modelo: e.target.value }))} placeholder="Corolla" className={inputCls} />)}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {field('Año', <input type="number" value={form.anio ?? ''} onChange={e => setForm(f => ({ ...f, anio: e.target.value ? parseInt(e.target.value) : undefined }))} placeholder="2018" className={inputCls} />)}
                {field('Color', <input value={form.color ?? ''} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} placeholder="Blanco" className={inputCls} />)}
              </div>
              {field('Notas', (
                <textarea value={form.notas ?? ''} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                  placeholder="Observaciones, historial previo..." rows={2}
                  className={inputCls} style={{ resize: 'none' }} />
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSave}
                disabled={!form.patente.trim() || !form.marca.trim() || !form.modelo.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40 transition-opacity hover:opacity-90"
                style={{ background: 'var(--cyan)', color: 'var(--dark)' }}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {qrVehiculo && (() => {
        const c = clientes.find(x => x.id === qrVehiculo.clienteId);
        // Solo campos estables: el QR no cambia si se edita el cliente
        const datos = [
          `ID: ${qrVehiculo.id}`,
          `Patente: ${qrVehiculo.patente}`,
          `Vehículo: ${qrVehiculo.marca} ${qrVehiculo.modelo}${qrVehiculo.anio ? ` (${qrVehiculo.anio})` : ''}`,
        ].filter(Boolean).join('\n');
        return (
          <QRModal
            titulo={qrVehiculo.patente}
            subtitulo={`${qrVehiculo.marca} ${qrVehiculo.modelo}${c ? ` · ${c.nombre} ${c.apellido}` : ''}`}
            datos={datos}
            onClose={() => setQrVehiculo(null)}
          />
        );
      })()}

      {/* Confirmar borrar */}
      {confirmarBorrar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-xs bg-white rounded-2xl p-6 text-center space-y-4 shadow-2xl">
            <p className="font-bold text-gray-900">¿Eliminar vehículo?</p>
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
