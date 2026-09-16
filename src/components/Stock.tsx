import { useState, useMemo } from 'react';
import type { StockItem } from '../types';
import { Package, Plus, Search, Pencil, Trash2, X, AlertTriangle } from 'lucide-react';

interface Props {
  stock: StockItem[];
  onSave: (s: StockItem) => void;
  onDelete: (id: string) => void;
}

const emptyForm = (): Omit<StockItem, 'id' | 'createdAt'> => ({
  nombre: '', descripcion: '', categoria: '',
  cantidad: 0, unidad: 'u', stockMinimo: 0,
  precioCosto: undefined, precioVenta: undefined,
});

const CATEGORIAS = ['Repuestos', 'Lubricantes', 'Filtros', 'Eléctrica', 'Herramientas', 'Insumos', 'Otro'];

export default function Stock({ stock, onSave, onDelete }: Props) {
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<StockItem | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [confirmarBorrar, setConfirmarBorrar] = useState<string | null>(null);
  const [soloAlerta, setSoloAlerta] = useState(false);

  const conAlerta = stock.filter(s => s.stockMinimo != null && s.cantidad <= (s.stockMinimo ?? 0));

  const filtrado = useMemo(() => {
    let items = stock;
    if (soloAlerta) items = items.filter(s => s.stockMinimo != null && s.cantidad <= (s.stockMinimo ?? 0));
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(s =>
        s.nombre.toLowerCase().includes(q) ||
        (s.categoria ?? '').toLowerCase().includes(q) ||
        (s.descripcion ?? '').toLowerCase().includes(q)
      );
    }
    return items.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [stock, search, soloAlerta]);

  function openNew() { setEditing(null); setForm(emptyForm()); setModal(true); }
  function openEdit(s: StockItem) {
    setEditing(s);
    setForm({ nombre: s.nombre, descripcion: s.descripcion, categoria: s.categoria, cantidad: s.cantidad, unidad: s.unidad, stockMinimo: s.stockMinimo, precioCosto: s.precioCosto, precioVenta: s.precioVenta });
    setModal(true);
  }
  function handleSave() {
    if (!form.nombre.trim()) return;
    onSave({ id: editing?.id ?? crypto.randomUUID(), createdAt: editing?.createdAt ?? new Date().toISOString(), ...form });
    setModal(false);
  }
  function ajustarCantidad(s: StockItem, delta: number) {
    onSave({ ...s, cantidad: Math.max(0, s.cantidad + delta) });
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
          <h1 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--dark)' }}>Stock</h1>
          <p className="text-sm text-gray-500">{stock.length} ítem{stock.length !== 1 ? 's' : ''}{conAlerta.length > 0 && <span className="ml-2 text-amber-600 font-semibold">· {conAlerta.length} bajo mínimo</span>}</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold hover:opacity-90 transition-opacity"
          style={{ background: 'var(--cyan)', color: 'var(--dark)' }}>
          <Plus size={14} /> Nuevo
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o categoría..."
            className="w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-200 bg-white shadow-sm text-sm outline-none text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-cyan-300" />
        </div>
        {conAlerta.length > 0 && (
          <button onClick={() => setSoloAlerta(x => !x)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold border transition-all"
            style={soloAlerta ? { background: '#FEF3C7', borderColor: '#D97706', color: '#92400E' } : { borderColor: '#E5E7EB', color: '#6B7280' }}>
            <AlertTriangle size={13} /> {conAlerta.length}
          </button>
        )}
      </div>

      {/* Lista */}
      {filtrado.length === 0 ? (
        <div className="text-center py-16">
          <Package size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">No hay ítems{search ? ' que coincidan' : ' en el inventario'}</p>
          {!search && <p className="text-xs mt-1 text-gray-400">Agregá repuestos, insumos o herramientas</p>}
        </div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          {filtrado.map((s, i) => {
            const bajo = s.stockMinimo != null && s.cantidad <= (s.stockMinimo ?? 0);
            return (
              <div key={s.id} className={`flex items-center gap-3 px-4 py-3.5 ${i !== 0 ? 'border-t border-gray-100' : ''} ${bajo ? 'bg-amber-50/50' : ''}`}>
                <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: bajo ? '#FEF3C7' : 'var(--cyan-light)', color: bajo ? '#92400E' : 'var(--cyan-dark)' }}>
                  {bajo ? <AlertTriangle size={16} /> : <Package size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-gray-900">{s.nombre}</span>
                    {s.categoria && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{s.categoria}</span>}
                    {bajo && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">Stock bajo</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs font-bold" style={{ color: bajo ? '#D97706' : 'var(--cyan-dark)' }}>
                      {s.cantidad} {s.unidad ?? 'u'}
                    </span>
                    {s.stockMinimo != null && <span className="text-xs text-gray-400">mín: {s.stockMinimo}</span>}
                    {s.precioVenta != null && <span className="text-xs text-gray-400">${s.precioVenta.toLocaleString('es-AR')}</span>}
                  </div>
                </div>
                {/* Ajuste rápido de cantidad */}
                <div className="flex items-center gap-1">
                  <button onClick={() => ajustarCantidad(s, -1)}
                    className="w-7 h-7 rounded-lg text-gray-500 hover:bg-gray-100 flex items-center justify-center font-bold text-base transition-colors">−</button>
                  <button onClick={() => ajustarCantidad(s, 1)}
                    className="w-7 h-7 rounded-lg text-gray-500 hover:bg-gray-100 flex items-center justify-center font-bold text-base transition-colors">+</button>
                  <button onClick={() => openEdit(s)}
                    className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors ml-1">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setConfirmarBorrar(s.id)}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 overflow-y-auto"
          style={{ background: 'rgba(0,0,0,0.5)' }} onClick={e => { if (e.target === e.currentTarget) setModal(false); }}>
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 space-y-4 shadow-2xl my-4">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-base text-gray-900">{editing ? 'Editar ítem' : 'Nuevo ítem'}</h2>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              {field('Nombre *', <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Filtro de aceite" className={inputCls} />)}
              {field('Categoría', (
                <select value={form.categoria ?? ''} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} className={inputCls}>
                  <option value="">Sin categoría</option>
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              ))}
              {field('Descripción', <input value={form.descripcion ?? ''} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Código, referencia..." className={inputCls} />)}
              <div className="grid grid-cols-3 gap-2">
                {field('Cantidad', <input type="number" value={form.cantidad} onChange={e => setForm(f => ({ ...f, cantidad: parseFloat(e.target.value) || 0 }))} className={inputCls} />)}
                {field('Unidad', <input value={form.unidad ?? ''} onChange={e => setForm(f => ({ ...f, unidad: e.target.value }))} placeholder="u / kg / L" className={inputCls} />)}
                {field('Stock mín.', <input type="number" value={form.stockMinimo ?? ''} onChange={e => setForm(f => ({ ...f, stockMinimo: e.target.value ? parseFloat(e.target.value) : undefined }))} placeholder="0" className={inputCls} />)}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {field('Costo ($)', <input type="number" value={form.precioCosto ?? ''} onChange={e => setForm(f => ({ ...f, precioCosto: e.target.value ? parseFloat(e.target.value) : undefined }))} placeholder="0" className={inputCls} />)}
                {field('Venta ($)', <input type="number" value={form.precioVenta ?? ''} onChange={e => setForm(f => ({ ...f, precioVenta: e.target.value ? parseFloat(e.target.value) : undefined }))} placeholder="0" className={inputCls} />)}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">Cancelar</button>
              <button onClick={handleSave} disabled={!form.nombre.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40 hover:opacity-90 transition-opacity"
                style={{ background: 'var(--cyan)', color: 'var(--dark)' }}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {confirmarBorrar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-xs bg-white rounded-2xl p-6 text-center space-y-4 shadow-2xl">
            <p className="font-bold text-gray-900">¿Eliminar ítem?</p>
            <p className="text-sm text-gray-500">Esta acción no se puede deshacer.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmarBorrar(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-500">Cancelar</button>
              <button onClick={() => { onDelete(confirmarBorrar); setConfirmarBorrar(null); }} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-600 text-white">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
