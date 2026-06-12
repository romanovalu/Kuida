import { useState, useMemo } from 'react';
import type { Turno, Paciente, EstadoTurno, HorarioBloqueado, Configuracion } from '../types';
import { uid, CAMPO_RUBRO } from '../store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Lock, MessageCircle, Pencil, AlertCircle, X, Clock } from 'lucide-react';

interface Props {
  turnos: Turno[];
  pacientes: Paciente[];
  bloqueados: HorarioBloqueado[];
  config: Configuracion;
  onSaveTurno: (t: Turno) => void;
  onUpdateTurno: (t: Turno) => void;
  onSaveBloqueado: (h: HorarioBloqueado) => void;
  onDeleteBloqueado: (id: string) => void;
}

const estadoStyle: Record<string, { bg: string; text: string; label: string }> = {
  pendiente:  { bg: '#FFF7ED', text: '#C2410C', label: 'Pendiente' },
  confirmado: { bg: '#E0F9FC', text: '#0E7490', label: 'Confirmado' },
  atendido:   { bg: '#F0FDF4', text: '#166534', label: 'Atendido' },
  cancelado:  { bg: '#F9FAFB', text: '#9CA3AF', label: 'Cancelado' },
};

// Convert HH:MM to total minutes
function toMins(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}
function fromMins(mins: number) {
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
}

// Generate grid of start times every `intervalo` minutes within working hours
function generarGrilla(inicio: string, fin: string, intervalo: number): string[] {
  const slots: string[] = [];
  let m = toMins(inicio);
  const finM = toMins(fin);
  while (m < finM) {
    slots.push(fromMins(m));
    m += intervalo;
  }
  return slots;
}

// Check if a proposed slot [start, start+duracion) overlaps with any existing turno
function slotLibre(
  fecha: string,
  start: string,
  duracion: number,
  turnos: Turno[],
  bloqueados: HorarioBloqueado[],
  skipId?: string,
  finHorario?: string,
): boolean {
  const startM = toMins(start);
  const endM = startM + duracion;

  // Must end within working hours
  if (finHorario && endM > toMins(finHorario)) return false;

  // Check blocked ranges
  for (const b of bloqueados) {
    if (b.fecha !== fecha) continue;
    if (startM < toMins(b.horaFin) && endM > toMins(b.horaInicio)) return false;
  }

  // Check existing turnos (considering their own duration)
  for (const t of turnos) {
    if (t.fecha !== fecha) continue;
    if (t.estado === 'cancelado') continue;
    if (t.id === skipId) continue;
    const tStart = toMins(t.hora);
    const tEnd = tStart + (t.duracion || 30);
    if (startM < tEnd && endM > tStart) return false;
  }

  return true;
}

export default function Turnos({ turnos, pacientes, bloqueados, config, onSaveTurno, onUpdateTurno, onSaveBloqueado, onDeleteBloqueado }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [fechaFiltro, setFechaFiltro] = useState(today);
  const [estadoFiltro, setEstadoFiltro] = useState<string>('todos');
  const [showForm, setShowForm] = useState(false);
  const [showBloqueo, setShowBloqueo] = useState(false);
  const [editTurno, setEditTurno] = useState<Turno | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState<Turno | null>(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [motivoCustom, setMotivoCustom] = useState('');

  const turnosFiltrados = useMemo(() =>
    turnos
      .filter(t => {
        if (fechaFiltro && t.fecha !== fechaFiltro) return false;
        if (estadoFiltro !== 'todos' && t.estado !== estadoFiltro) return false;
        return true;
      })
      .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora)),
    [turnos, fechaFiltro, estadoFiltro]
  );

  const getPaciente = (id: string) => pacientes.find(p => p.id === id);
  const getServicio = (id?: string) => id ? config.servicios.find(s => s.id === id) : null;

  const confirmarCancelacion = () => {
    if (!showCancelDialog) return;
    const motivo = motivoCancelacion === 'Otro' ? motivoCustom : motivoCancelacion;
    onUpdateTurno({ ...showCancelDialog, estado: 'cancelado', motivoCancelacion: motivo });
    setShowCancelDialog(null);
  };

  const cambiarEstado = (turno: Turno, estado: EstadoTurno) => {
    if (estado === 'cancelado') { setShowCancelDialog(turno); setMotivoCancelacion(''); return; }
    onUpdateTurno({ ...turno, estado });
  };

  const abrirWhatsApp = (turno: Turno) => {
    const p = getPaciente(turno.pacienteId);
    if (!p) return;
    const d = new Date(turno.fecha + 'T12:00:00');
    const fecha = d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
    const msg = encodeURIComponent(`Hola ${p.nombre}! Te recordamos tu turno con ${config.nombreProfesional} el ${fecha} a las ${turno.hora}hs. Por favor confirmá tu asistencia.`);
    window.open(`https://wa.me/54${p.telefono.replace(/\D/g, '')}?text=${msg}`, '_blank');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--dark)' }}>Turnos</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBloqueo(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-full border transition-colors"
            style={{ borderColor: 'var(--cyan)', color: 'var(--cyan-dark)', background: 'var(--cyan-light)' }}
          >
            <Lock size={12} /> Bloquear
          </button>
          <button
            onClick={() => { setEditTurno(null); setShowForm(true); }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-full transition-opacity hover:opacity-90"
            style={{ background: 'var(--cyan)', color: 'var(--dark)' }}
          >
            <Plus size={13} /> Nuevo turno
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl p-3 shadow-sm flex gap-2 flex-wrap items-center">
        <Input type="date" value={fechaFiltro} onChange={e => setFechaFiltro(e.target.value)} className="w-auto text-sm h-8 rounded-full border-gray-200" />
        <FilterBtn label="Hoy" active={fechaFiltro === today} onClick={() => setFechaFiltro(today)} />
        <FilterBtn label="Todos" active={fechaFiltro === ''} onClick={() => setFechaFiltro('')} />
        <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
          <SelectTrigger className="w-36 h-8 text-xs rounded-full border-gray-200"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="confirmado">Confirmado</SelectItem>
            <SelectItem value="atendido">Atendido</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista */}
      {turnosFiltrados.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border-2 border-dashed" style={{ borderColor: 'var(--cyan-mid)', background: 'var(--cyan-light)' }}>
          <p className="text-sm font-medium" style={{ color: 'var(--cyan-dark)' }}>Sin turnos con los filtros seleccionados</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          {turnosFiltrados.map((turno, i) => {
            const paciente = getPaciente(turno.pacienteId);
            const servicio = getServicio(turno.servicioId);
            const cancelado = turno.estado === 'cancelado';
            const est = estadoStyle[turno.estado];
            return (
              <div key={turno.id} className={`px-5 py-4 ${cancelado ? 'opacity-50' : ''}`}
                style={{ borderTop: i > 0 ? '1px solid #F3F4F6' : 'none' }}>
                <div className="flex items-center gap-3">
                  <div className="w-1 h-10 rounded-full flex-shrink-0"
                    style={{ background: turno.estado === 'atendido' ? '#22C55E' : turno.estado === 'confirmado' ? 'var(--cyan)' : turno.estado === 'cancelado' ? '#E5E7EB' : '#F59E0B' }} />
                  <div className="w-14 flex-shrink-0">
                    <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--dark)' }}>{turno.hora}</p>
                    <p className="text-[11px] text-gray-400 flex items-center gap-0.5">
                      <Clock size={9} />{turno.duracion}m
                    </p>
                    {!fechaFiltro && (
                      <p className="text-[10px] text-gray-400">
                        {new Date(turno.fecha + 'T12:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                      </p>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--dark)' }}>
                        {paciente ? `${paciente.nombre} ${paciente.apellido}` : 'Paciente eliminado'}
                      </p>
                      {paciente?.alergias && <AlertCircle size={12} style={{ color: '#F59E0B' }} className="flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-400 truncate">
                      {servicio ? servicio.nombre : turno.motivo}
                      {turno.campoRubro ? ` · ${turno.campoRubro}` : ''}
                    </p>
                    {turno.motivoCancelacion && <p className="text-[11px] text-red-400 mt-0.5">{turno.motivoCancelacion}</p>}
                  </div>
                  <span className="text-[11px] font-bold px-3 py-1 rounded-full flex-shrink-0" style={{ background: est.bg, color: est.text }}>
                    {est.label}
                  </span>
                </div>

                {!cancelado && turno.estado !== 'atendido' && (
                  <div className="flex gap-1.5 mt-3 flex-wrap ml-[72px]">
                    {turno.estado === 'pendiente' && <ActionChip label="Confirmar" color="cyan" onClick={() => cambiarEstado(turno, 'confirmado')} />}
                    <ActionChip label="Atendido" color="green" onClick={() => cambiarEstado(turno, 'atendido')} />
                    <ActionChip label="Cancelar" color="red" onClick={() => cambiarEstado(turno, 'cancelado')} />
                    {paciente?.telefono && <ActionChip label="WhatsApp" color="neutral" icon={<MessageCircle size={11} />} onClick={() => abrirWhatsApp(turno)} />}
                    <ActionChip label="Editar" color="neutral" icon={<Pencil size={11} />} onClick={() => { setEditTurno(turno); setShowForm(true); }} />
                  </div>
                )}
                {(cancelado || turno.estado === 'atendido') && (
                  <div className="flex gap-1.5 mt-2 ml-[72px]">
                    <ActionChip label="Editar" color="neutral" icon={<Pencil size={11} />} onClick={() => { setEditTurno(turno); setShowForm(true); }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <FormTurno turno={editTurno} pacientes={pacientes} turnos={turnos} bloqueados={bloqueados} config={config}
          onSave={t => { editTurno ? onUpdateTurno(t) : onSaveTurno(t); setShowForm(false); }}
          onClose={() => setShowForm(false)} />
      )}

      {showCancelDialog && (
        <Dialog open onOpenChange={() => setShowCancelDialog(null)}>
          <DialogContent className="max-w-sm rounded-2xl">
            <DialogHeader><DialogTitle className="text-base font-bold">Cancelar turno</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-gray-500">Seleccioná el motivo de cancelación</p>
              <Select value={motivoCancelacion} onValueChange={setMotivoCancelacion}>
                <SelectTrigger className="rounded-xl border-gray-200"><SelectValue placeholder="Motivo..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Paciente canceló">Paciente canceló</SelectItem>
                  <SelectItem value="Paciente no se presentó">Paciente no se presentó</SelectItem>
                  <SelectItem value="Profesional no disponible">Profesional no disponible</SelectItem>
                  <SelectItem value="Reprogramado">Reprogramado</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
              {motivoCancelacion === 'Otro' && (
                <Input placeholder="Especificar..." value={motivoCustom} onChange={e => setMotivoCustom(e.target.value)} className="rounded-xl border-gray-200" />
              )}
              <div className="flex gap-2 justify-end pt-1">
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => setShowCancelDialog(null)}>Volver</Button>
                <Button size="sm" className="rounded-full bg-red-500 hover:bg-red-600" onClick={confirmarCancelacion}>Confirmar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {showBloqueo && (
        <BloqueoDialog bloqueados={bloqueados} onSave={onSaveBloqueado} onDelete={onDeleteBloqueado} onClose={() => setShowBloqueo(false)} />
      )}
    </div>
  );
}

function FilterBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="px-4 py-1.5 text-xs font-bold rounded-full transition-all"
      style={active ? { background: 'var(--cyan)', color: 'var(--dark)' } : { background: '#F3F4F6', color: '#6B7280' }}>
      {label}
    </button>
  );
}

function ActionChip({ label, onClick, icon, color }: { label: string; onClick: () => void; icon?: React.ReactNode; color: string }) {
  const styles: Record<string, { bg: string; text: string }> = {
    cyan:    { bg: 'var(--cyan-light)', text: 'var(--cyan-dark)' },
    green:   { bg: '#F0FDF4', text: '#166534' },
    red:     { bg: '#FFF1F2', text: '#BE123C' },
    neutral: { bg: '#F3F4F6', text: '#374151' },
  };
  const s = styles[color] || styles.neutral;
  return (
    <button onClick={onClick} className="flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-full transition-opacity hover:opacity-80"
      style={{ background: s.bg, color: s.text }}>
      {icon}{label}
    </button>
  );
}

interface FormProps {
  turno: Turno | null; pacientes: Paciente[]; turnos: Turno[];
  bloqueados: HorarioBloqueado[]; config: Configuracion;
  onSave: (t: Turno) => void; onClose: () => void;
}

export function FormTurno({ turno, pacientes, turnos, bloqueados, config, onSave, onClose }: FormProps) {
  const today = new Date().toISOString().slice(0, 10);

  // Pre-select service from existing turno if editing
  const initialServicioId = turno?.servicioId || (config.servicios[0]?.id ?? '');
  const initialDuracion = turno?.duracion || config.servicios[0]?.duracion || 30;

  const [form, setForm] = useState({
    pacienteId: turno?.pacienteId || '',
    fecha: turno?.fecha || today,
    hora: turno?.hora || '',
    servicioId: initialServicioId,
    duracion: initialDuracion,
    motivo: turno?.motivo || '',
    campoRubro: turno?.campoRubro || '',
    estado: (turno?.estado || 'pendiente') as EstadoTurno,
  });
  const [error, setError] = useState('');

  const campoConfig = CAMPO_RUBRO[config.rubro];

  const horariosDisponibles = useMemo(() => {
    if (!form.fecha) return [];
    const dia = new Date(form.fecha + 'T12:00').getDay();
    if (!config.diasLaborables.includes(dia)) return [];
    const grilla = generarGrilla(config.horaInicio, config.horaFin, config.intervaloGrilla || 15);
    return grilla.filter(slot =>
      slotLibre(form.fecha, slot, form.duracion, turnos, bloqueados, turno?.id, config.horaFin)
    );
  }, [form.fecha, form.duracion, config, bloqueados, turnos, turno]);

  const diaSeleccionado = form.fecha ? new Date(form.fecha + 'T12:00').getDay() : -1;
  const diaHabilitado = form.fecha && config.diasLaborables.includes(diaSeleccionado);

  const handleServicioChange = (id: string) => {
    const s = config.servicios.find(x => x.id === id);
    setForm(f => ({ ...f, servicioId: id, duracion: s?.duracion || f.duracion, hora: '' }));
  };

  const guardar = () => {
    if (!form.pacienteId) { setError('Seleccioná un paciente'); return; }
    if (!form.fecha) { setError('Seleccioná una fecha'); return; }
    if (!diaHabilitado) { setError('Ese día no es laborable según la configuración'); return; }
    if (!form.hora) { setError('Seleccioná un horario'); return; }
    setError('');
    const servicio = config.servicios.find(s => s.id === form.servicioId);
    onSave({
      id: turno?.id || uid(),
      pacienteId: form.pacienteId,
      fecha: form.fecha,
      hora: form.hora,
      duracion: form.duracion,
      servicioId: form.servicioId || undefined,
      motivo: form.motivo || servicio?.nombre || '',
      campoRubro: form.campoRubro || undefined,
      estado: form.estado,
      profesional: turno?.profesional || config.nombreProfesional,
      especialidad: turno?.especialidad || config.especialidad,
      createdAt: turno?.createdAt || new Date().toISOString(),
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader><DialogTitle className="text-base font-bold">{turno ? 'Editar turno' : 'Nuevo turno'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="Paciente">
            <Select value={form.pacienteId} onValueChange={v => setForm(f => ({ ...f, pacienteId: v }))}>
              <SelectTrigger className="rounded-xl border-gray-200"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
              <SelectContent>{pacientes.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre} {p.apellido}</SelectItem>)}</SelectContent>
            </Select>
          </Field>

          {/* Servicio */}
          {config.servicios.length > 0 && (
            <Field label="Servicio">
              <Select value={form.servicioId} onValueChange={handleServicioChange}>
                <SelectTrigger className="rounded-xl border-gray-200"><SelectValue placeholder="Elegir servicio..." /></SelectTrigger>
                <SelectContent>
                  {config.servicios.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nombre} — {s.duracion >= 60 ? `${Math.floor(s.duracion / 60)}h${s.duracion % 60 > 0 ? `${s.duracion % 60}m` : ''}` : `${s.duracion}min`}
                      {s.precio ? ` · $${s.precio.toLocaleString('es-AR')}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Show duration badge */}
              {form.duracion > 0 && (
                <p className="text-[11px] mt-1 font-semibold" style={{ color: 'var(--cyan-dark)' }}>
                  Duración: {form.duracion >= 60 ? `${Math.floor(form.duracion / 60)}h${form.duracion % 60 > 0 ? ` ${form.duracion % 60}min` : ''}` : `${form.duracion} min`}
                </p>
              )}
            </Field>
          )}

          {/* Sin servicios configurados: mostrar duración manual */}
          {config.servicios.length === 0 && (
            <Field label="Duración (min)">
              <Input type="number" min={5} max={480} step={5} value={form.duracion}
                onChange={e => setForm(f => ({ ...f, duracion: Number(e.target.value), hora: '' }))}
                className="rounded-xl border-gray-200" />
            </Field>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Fecha">
              <Input type="date" min={today} value={form.fecha}
                onChange={e => setForm(f => ({ ...f, fecha: e.target.value, hora: '' }))}
                className="rounded-xl border-gray-200" />
            </Field>
            <Field label="Horario">
              {horariosDisponibles.length === 0 ? (
                <p className="text-xs text-red-500 mt-1 bg-red-50 p-2 rounded-xl">
                  {!diaHabilitado && form.fecha ? 'Día no laborable' : 'Sin horarios disponibles'}
                </p>
              ) : (
                <Select value={form.hora} onValueChange={v => setForm(f => ({ ...f, hora: v }))}>
                  <SelectTrigger className="rounded-xl border-gray-200"><SelectValue placeholder="Hora..." /></SelectTrigger>
                  <SelectContent>{horariosDisponibles.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                </Select>
              )}
            </Field>
          </div>

          {/* Campo rubro-específico */}
          {campoConfig && (
            <Field label={campoConfig.label}>
              {campoConfig.tipo === 'select' ? (
                <Select value={form.campoRubro} onValueChange={v => setForm(f => ({ ...f, campoRubro: v }))}>
                  <SelectTrigger className="rounded-xl border-gray-200"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    {campoConfig.opciones!.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={form.campoRubro} onChange={e => setForm(f => ({ ...f, campoRubro: e.target.value }))}
                  placeholder={`Ej: ${campoConfig.label}...`} className="rounded-xl border-gray-200" />
              )}
            </Field>
          )}

          <Field label="Notas / motivo">
            <Textarea value={form.motivo} onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))}
              placeholder="Observaciones adicionales..." rows={2} className="rounded-xl border-gray-200 resize-none" />
          </Field>

          <Field label="Estado">
            <Select value={form.estado} onValueChange={v => setForm(f => ({ ...f, estado: v as EstadoTurno }))}>
              <SelectTrigger className="rounded-xl border-gray-200"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="confirmado">Confirmado</SelectItem>
                <SelectItem value="atendido">Atendido</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </Field>

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

interface BloqueoProps { bloqueados: HorarioBloqueado[]; onSave: (h: HorarioBloqueado) => void; onDelete: (id: string) => void; onClose: () => void; }

function BloqueoDialog({ bloqueados, onSave, onDelete, onClose }: BloqueoProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ fecha: today, horaInicio: '09:00', horaFin: '10:00', motivo: '' });
  const guardar = () => {
    if (!form.fecha || !form.motivo.trim()) return;
    onSave({ id: uid(), ...form });
    setForm({ fecha: today, horaInicio: '09:00', horaFin: '10:00', motivo: '' });
  };
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader><DialogTitle className="text-base font-bold">Bloquear horario</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="Fecha"><Input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} className="rounded-xl border-gray-200" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Desde"><Input type="time" value={form.horaInicio} onChange={e => setForm(f => ({ ...f, horaInicio: e.target.value }))} className="rounded-xl border-gray-200" /></Field>
            <Field label="Hasta"><Input type="time" value={form.horaFin} onChange={e => setForm(f => ({ ...f, horaFin: e.target.value }))} className="rounded-xl border-gray-200" /></Field>
          </div>
          <Field label="Motivo"><Input value={form.motivo} onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))} placeholder="Ej: Almuerzo, Capacitación..." className="rounded-xl border-gray-200" /></Field>
          <button className="w-full py-2.5 rounded-full text-sm font-bold transition-opacity hover:opacity-90" style={{ background: 'var(--cyan)', color: 'var(--dark)' }} onClick={guardar}>
            Agregar bloqueo
          </button>
          {bloqueados.length > 0 && (
            <div className="border-t border-gray-100 pt-3 space-y-1.5 max-h-44 overflow-y-auto">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Bloqueados</p>
              {bloqueados.sort((a, b) => a.fecha.localeCompare(b.fecha)).map(b => (
                <div key={b.id} className="flex items-center justify-between text-xs px-3 py-2 rounded-xl" style={{ background: 'var(--cyan-light)', color: 'var(--cyan-dark)' }}>
                  <span>{new Date(b.fecha + 'T12:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })} · {b.horaInicio}–{b.horaFin} · {b.motivo}</span>
                  <button onClick={() => onDelete(b.id)} className="ml-2 hover:text-red-500 transition-colors"><X size={13} /></button>
                </div>
              ))}
            </div>
          )}
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
