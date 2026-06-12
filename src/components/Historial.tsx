import { useState, useMemo } from 'react';
import type { Consulta, Paciente } from '../types';
import { uid } from '../store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, CalendarClock } from 'lucide-react';

const TODOS = '__todos__';

interface Props {
  consultas: Consulta[];
  pacientes: Paciente[];
  turnos: any[];
  pacienteSeleccionado: Paciente | null;
  onSave: (c: Consulta) => void;
  onDelete: (id: string) => void;
  config: { nombreProfesional: string };
}

export default function Historial({ consultas, pacientes, pacienteSeleccionado, onSave, onDelete, config }: Props) {
  const [filtroPaciente, setFiltroPaciente] = useState<string>(pacienteSeleccionado?.id || TODOS);
  const [showForm, setShowForm] = useState(false);
  const [editConsulta, setEditConsulta] = useState<Consulta | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtroReal = filtroPaciente === TODOS ? '' : filtroPaciente;

  const consultasFiltradas = useMemo(() =>
    consultas
      .filter(c => !filtroReal || c.pacienteId === filtroReal)
      .sort((a, b) => b.fecha.localeCompare(a.fecha)),
    [consultas, filtroReal]
  );

  const getPaciente = (id: string) => pacientes.find(p => p.id === id);
  const pacienteActual = filtroReal ? getPaciente(filtroReal) : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--dark)' }}>Historial</h1>
        <button
          onClick={() => { setEditConsulta(null); setShowForm(true); }}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-full transition-opacity hover:opacity-90"
          style={{ background: 'var(--cyan)', color: 'var(--dark)' }}
        >
          <Plus size={13} /> Nueva
        </button>
      </div>

      {/* Filtro */}
      <div>
        <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Filtrar por paciente</Label>
        <Select value={filtroPaciente} onValueChange={setFiltroPaciente}>
          <SelectTrigger className="rounded-xl border-gray-200 bg-white shadow-sm">
            <SelectValue placeholder="Todos los pacientes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos los pacientes</SelectItem>
            {pacientes.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.nombre} {p.apellido}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Paciente activo */}
      {pacienteActual && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{ background: 'var(--dark)' }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: 'var(--cyan)', color: 'var(--dark)' }}
          >
            {pacienteActual.nombre[0]}{pacienteActual.apellido[0]}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{pacienteActual.nombre} {pacienteActual.apellido}</p>
            <p className="text-xs" style={{ color: 'var(--cyan)' }}>{pacienteActual.edad} años · {pacienteActual.telefono}</p>
          </div>
        </div>
      )}

      <p className="text-xs font-medium text-gray-400">{consultasFiltradas.length} consulta{consultasFiltradas.length !== 1 ? 's' : ''}</p>

      {consultasFiltradas.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border-2 border-dashed" style={{ borderColor: 'var(--cyan-mid)', background: 'var(--cyan-light)' }}>
          <p className="text-sm font-medium" style={{ color: 'var(--cyan-dark)' }}>
            {filtroReal ? 'Sin consultas para este paciente' : 'No hay consultas registradas'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {consultasFiltradas.map(c => {
            const paciente = getPaciente(c.pacienteId);
            return (
              <div key={c.id} className="bg-white rounded-2xl px-5 py-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wide"
                        style={{ background: 'var(--cyan-light)', color: 'var(--cyan-dark)' }}
                      >
                        {new Date(c.fecha + 'T12:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      {!filtroReal && paciente && (
                        <span className="text-xs font-semibold text-gray-700">
                          {paciente.nombre} {paciente.apellido}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{c.tratamiento}</p>
                    {c.notas && (
                      <p className="text-xs text-gray-400 mt-1.5 italic leading-relaxed">{c.notas}</p>
                    )}
                    {c.proximaVisita && (
                      <div className="flex items-center gap-1.5 mt-2.5">
                        <CalendarClock size={13} style={{ color: 'var(--cyan)' }} />
                        <span className="text-xs font-semibold" style={{ color: 'var(--cyan-dark)' }}>
                          Próxima: {new Date(c.proximaVisita + 'T12:00').toLocaleDateString('es-AR')}
                        </span>
                      </div>
                    )}
                    <p className="text-[11px] text-gray-300 mt-2">{c.profesional}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => { setEditConsulta(c); setShowForm(true); }} className="p-2 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => setConfirmDelete(c.id)} className="p-2 rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <FormConsulta
          consulta={editConsulta}
          pacientes={pacientes}
          pacientePreseleccionado={filtroReal}
          profesional={config.nombreProfesional}
          onSave={c => { onSave(c); setShowForm(false); }}
          onClose={() => setShowForm(false)}
        />
      )}

      {confirmDelete && (
        <Dialog open onOpenChange={() => setConfirmDelete(null)}>
          <DialogContent className="max-w-sm rounded-2xl">
            <DialogHeader><DialogTitle className="text-base font-bold">Eliminar consulta</DialogTitle></DialogHeader>
            <p className="text-sm text-gray-500">¿Eliminar esta consulta del historial? No se puede deshacer.</p>
            <div className="flex gap-2 justify-end mt-3">
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
              <Button size="sm" className="rounded-full bg-red-500 hover:bg-red-600" onClick={() => { onDelete(confirmDelete); setConfirmDelete(null); }}>Eliminar</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

interface FormProps {
  consulta: Consulta | null; pacientes: Paciente[];
  pacientePreseleccionado: string; profesional: string;
  onSave: (c: Consulta) => void; onClose: () => void;
}

function FormConsulta({ consulta, pacientes, pacientePreseleccionado, profesional, onSave, onClose }: FormProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    pacienteId: consulta?.pacienteId || pacientePreseleccionado || '',
    fecha: consulta?.fecha || today,
    tratamiento: consulta?.tratamiento || '',
    notas: consulta?.notas || '',
    proximaVisita: consulta?.proximaVisita || '',
  });
  const [error, setError] = useState('');

  const guardar = () => {
    if (!form.pacienteId) { setError('Seleccioná un paciente'); return; }
    if (!form.tratamiento.trim()) { setError('Describí el tratamiento realizado'); return; }
    setError('');
    onSave({
      id: consulta?.id || uid(),
      pacienteId: form.pacienteId, turnoId: consulta?.turnoId,
      fecha: form.fecha, tratamiento: form.tratamiento,
      notas: form.notas, proximaVisita: form.proximaVisita || undefined,
      profesional: consulta?.profesional || profesional,
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader><DialogTitle className="text-base font-bold">{consulta ? 'Editar consulta' : 'Nueva consulta'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="Paciente">
            <Select value={form.pacienteId} onValueChange={v => setForm(f => ({ ...f, pacienteId: v }))}>
              <SelectTrigger className="rounded-xl border-gray-200"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
              <SelectContent>{pacientes.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre} {p.apellido}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Fecha"><Input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} className="rounded-xl border-gray-200" /></Field>
          <Field label="Tratamiento *"><Textarea value={form.tratamiento} onChange={e => setForm(f => ({ ...f, tratamiento: e.target.value }))} rows={3} className="rounded-xl border-gray-200 resize-none" placeholder="Describí el tratamiento..." /></Field>
          <Field label="Notas adicionales"><Textarea value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} rows={2} className="rounded-xl border-gray-200 resize-none" /></Field>
          <Field label="Próxima visita"><Input type="date" value={form.proximaVisita} onChange={e => setForm(f => ({ ...f, proximaVisita: e.target.value }))} className="rounded-xl border-gray-200" /></Field>
          {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
          <div className="flex gap-2 justify-end pt-1">
            <Button variant="outline" size="sm" className="rounded-full" onClick={onClose}>Cancelar</Button>
            <Button size="sm" className="rounded-full font-bold" style={{ background: 'var(--cyan)', color: 'var(--dark)' }} onClick={guardar}>Guardar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
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
