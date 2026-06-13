import { useMemo, useState } from 'react';
import type { Turno, Paciente, HorarioBloqueado, Configuracion, Receta } from '../types';
import type { ReservaPublica } from '../lib/db';
import { AlertCircle, Clock, CheckCircle2, Users, CalendarPlus, UserPlus, ClipboardList, BarChart2, ArrowRight, FileText, X, Check, Link } from 'lucide-react';
import { FormTurno } from './Turnos';
import { FormPaciente } from './Pacientes';
import RecetasSection from './RecetaModal';

const RUBROS_CON_RECETA = ['odontologia','medicina','psicologia','psicopedagogia','kinesiologia'];

interface Props {
  turnos: Turno[];
  pacientes: Paciente[];
  bloqueados: HorarioBloqueado[];
  config: Configuracion;
  onNavigate: (page: string) => void;
  onSaveTurno: (t: Turno) => void;
  onSavePaciente: (p: Paciente) => void;
  recetas?: Receta[];
  onSaveReceta?: (r: Receta) => void;
  onDeleteReceta?: (id: string) => void;
  reservasPendientes?: ReservaPublica[];
  onAceptarReserva?: (r: ReservaPublica) => void;
  onRechazarReserva?: (id: string) => void;
}

const estadoStyle: Record<string, { bg: string; text: string; label: string }> = {
  pendiente:  { bg: '#FFF7ED', text: '#C2410C', label: 'Pendiente' },
  confirmado: { bg: '#EFF6FF', text: '#1D4ED8', label: 'Confirmado' },
  atendido:   { bg: '#F0FDF4', text: '#166534', label: 'Atendido' },
  cancelado:  { bg: '#F9FAFB', text: '#9CA3AF', label: 'Cancelado' },
};

export default function Dashboard({ turnos, pacientes, bloqueados, config, onNavigate, onSaveTurno, onSavePaciente, recetas = [], onSaveReceta, onDeleteReceta, reservasPendientes = [], onAceptarReserva, onRechazarReserva }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [showTurnoForm, setShowTurnoForm] = useState(false);
  const [showPacienteForm, setShowPacienteForm] = useState(false);
  const [showRecetaForm, setShowRecetaForm] = useState(false);
  const [recetaPacienteId, setRecetaPacienteId] = useState('');

  const showRecetaBtn = RUBROS_CON_RECETA.includes(config.rubro);

  const turnosHoy = useMemo(() =>
    turnos.filter(t => t.fecha === today).sort((a, b) => a.hora.localeCompare(b.hora)),
    [turnos, today]
  );

  const stats = useMemo(() => ({
    hoy:         turnosHoy.length,
    pendientes:  turnosHoy.filter(t => t.estado === 'pendiente').length,
    confirmados: turnosHoy.filter(t => t.estado === 'confirmado').length,
    atendidos:   turnosHoy.filter(t => t.estado === 'atendido').length,
    pacientes:   pacientes.length,
  }), [turnosHoy, pacientes]);

  const getPaciente = (id: string) => pacientes.find(p => p.id === id);

  const now = new Date();
  const hora = now.getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';
  const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const dias  = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  const fechaHoy = `${dias[now.getDay()]} ${now.getDate()} de ${meses[now.getMonth()]}`;

  return (
    <div className="space-y-6">

      {/* Hero */}
      <div className="rounded-2xl px-6 py-6" style={{ background: 'var(--ui-bg)' }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1 capitalize" style={{ color: 'var(--cyan)' }}>
          {fechaHoy}
        </p>
        <h1 className="text-2xl font-extrabold text-white tracking-tight leading-tight mb-4">
          {saludo},<br />
          <span style={{ color: 'var(--cyan)' }}>{config.nombreProfesional}</span>
        </h1>

        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Nuevo turno',    Icon: CalendarPlus,  action: () => setShowTurnoForm(true),    show: true },
            { label: 'Nuevo paciente', Icon: UserPlus,       action: () => setShowPacienteForm(true), show: true },
            { label: 'Nueva receta',   Icon: FileText,       action: () => setShowRecetaForm(true),   show: showRecetaBtn },
            { label: 'Historial',      Icon: ClipboardList,  action: () => onNavigate('historial'),   show: true },
            { label: 'Reportes',       Icon: BarChart2,      action: () => onNavigate('reportes'),    show: !showRecetaBtn },
          ].filter(b => b.show).map(({ label, Icon, action }) => (
            <button
              key={label}
              onClick={action}
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl font-bold text-sm transition-opacity hover:opacity-80 text-left"
              style={{ background: 'var(--cyan)', color: 'var(--dark)' }}
            >
              <Icon size={16} strokeWidth={2.5} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Turnos hoy"  value={stats.hoy}         sub="total"         Icon={Clock}        color="var(--cyan)" />
        <StatCard label="Pendientes"  value={stats.pendientes}  sub="sin confirmar" Icon={AlertCircle}  color="#F59E0B" />
        <StatCard label="Confirmados" value={stats.confirmados} sub="listos"        Icon={CheckCircle2} color="#22C55E" />
        <StatCard label="Pacientes"   value={stats.pacientes}   sub="registrados"   Icon={Users}        color="#818CF8" />
      </div>

      {/* Agenda hoy */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Agenda de hoy</h2>
          <button
            onClick={() => onNavigate('turnos')}
            className="flex items-center gap-1 text-xs font-semibold transition-colors"
            style={{ color: 'var(--cyan-dark)' }}
          >
            Ver todos <ArrowRight size={13} />
          </button>
        </div>

        {turnosHoy.length === 0 ? (
          <div className="text-center py-10 rounded-2xl border-2 border-dashed" style={{ borderColor: 'var(--cyan-mid)', background: 'var(--cyan-light)' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--cyan-dark)' }}>Sin turnos para hoy</p>
            <button
              onClick={() => setShowTurnoForm(true)}
              className="mt-3 text-xs font-bold px-4 py-2 rounded-full text-white transition-opacity hover:opacity-80"
              style={{ background: 'var(--cyan)' }}
            >
              Agregar turno
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
            {turnosHoy.map((turno, i) => {
              const paciente = getPaciente(turno.pacienteId);
              const est = estadoStyle[turno.estado];
              return (
                <div
                  key={turno.id}
                  className="flex items-center gap-4 px-5 py-3.5"
                  style={{ borderTop: i > 0 ? '1px solid #F3F4F6' : 'none' }}
                >
                  <div className="w-1 h-10 rounded-full flex-shrink-0"
                    style={{ background: turno.estado === 'atendido' ? '#22C55E' : turno.estado === 'confirmado' ? 'var(--cyan)' : turno.estado === 'cancelado' ? '#E5E7EB' : '#F59E0B' }} />
                  <span className="text-sm font-bold tabular-nums w-12 flex-shrink-0" style={{ color: 'var(--dark)' }}>{turno.hora}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--dark)' }}>
                        {paciente ? `${paciente.nombre} ${paciente.apellido}` : 'Paciente eliminado'}
                      </p>
                      {paciente?.alergias && <AlertCircle size={12} style={{ color: '#F59E0B' }} className="flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{turno.motivo}</p>
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0" style={{ background: est.bg, color: est.text }}>
                    {est.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Reservas online pendientes */}
      {reservasPendientes.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Link size={14} style={{ color: 'var(--cyan)' }} />
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Reservas online</h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#FFF7ED', color: '#C2410C' }}>
              {reservasPendientes.length} pendiente{reservasPendientes.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm divide-y divide-gray-100">
            {reservasPendientes.map(r => (
              <div key={r.id} className="px-4 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold" style={{ color: 'var(--dark)' }}>{r.nombre_paciente}</p>
                      <span className="text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full" style={{ background: 'var(--cyan-light)', color: 'var(--cyan-dark)' }}>
                        {r.fecha} · {r.hora}hs
                      </span>
                    </div>
                    {r.telefono_paciente && (
                      <p className="text-xs text-gray-400 mt-0.5">Tel: {r.telefono_paciente}</p>
                    )}
                    {r.motivo && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">"{r.motivo}"</p>
                    )}
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0 mt-0.5">
                    <button
                      onClick={() => onRechazarReserva?.(r.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Rechazar"
                    >
                      <X size={15} />
                    </button>
                    <button
                      onClick={() => onAceptarReserva?.(r)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors"
                      style={{ background: 'var(--cyan)', color: 'var(--dark)' }}
                      title="Aceptar y crear turno"
                    >
                      <Check size={13} />
                      Aceptar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Modales de acceso rápido */}
      {showTurnoForm && (
        <FormTurno
          turno={null}
          pacientes={pacientes}
          turnos={turnos}
          bloqueados={bloqueados}
          config={config}
          onSave={t => { onSaveTurno(t); setShowTurnoForm(false); }}
          onClose={() => setShowTurnoForm(false)}
        />
      )}
      {showPacienteForm && (
        <FormPaciente
          paciente={null}
          onSave={p => { onSavePaciente(p); setShowPacienteForm(false); }}
          onClose={() => setShowPacienteForm(false)}
          rubro={config.rubro}
        />
      )}

      {showRecetaForm && onSaveReceta && onDeleteReceta && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl w-full max-w-lg flex flex-col" style={{ maxHeight: '92vh' }}>
            <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100 flex-shrink-0">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--cyan-dark)' }}>Recetas / Indicaciones</p>
                <p className="text-sm text-gray-400 mt-0.5">
                  {recetaPacienteId
                    ? (() => { const p = pacientes.find(x => x.id === recetaPacienteId); return p ? `${p.nombre} ${p.apellido}` : ''; })()
                    : 'Seleccioná un paciente'}
                </p>
              </div>
              <button onClick={() => setShowRecetaForm(false)} className="p-2 rounded-xl text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>

            {/* Selector de paciente */}
            {!recetaPacienteId ? (
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">¿Para qué paciente?</p>
                {pacientes.length === 0 && <p className="text-xs text-gray-400">No hay pacientes registrados.</p>}
                {pacientes.map(p => (
                  <button key={p.id} onClick={() => setRecetaPacienteId(p.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left hover:bg-gray-50 transition-colors border border-gray-100">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: 'var(--cyan-light)', color: 'var(--cyan-dark)' }}>
                      {p.nombre[0]}{p.apellido[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--dark)' }}>{p.nombre} {p.apellido}</p>
                      {p.obraSocial && <p className="text-xs text-gray-400">{p.obraSocial}</p>}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-5 py-4">
                <button onClick={() => setRecetaPacienteId('')}
                  className="text-xs font-bold mb-4 flex items-center gap-1" style={{ color: 'var(--cyan-dark)' }}>
                  ← Cambiar paciente
                </button>
                <RecetasSection
                  paciente={pacientes.find(p => p.id === recetaPacienteId)!}
                  config={config}
                  recetas={recetas}
                  onSave={r => { onSaveReceta(r); }}
                  onDelete={onDeleteReceta}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, Icon, color }: {
  label: string; value: number; sub: string; Icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl px-4 py-4 shadow-sm flex items-start justify-between">
      <div>
        <p className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--dark)' }}>{value}</p>
        <p className="text-xs font-semibold text-gray-700 mt-0.5">{label}</p>
        <p className="text-[11px] text-gray-400">{sub}</p>
      </div>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
        <Icon size={17} style={{ color }} />
      </div>
    </div>
  );
}
