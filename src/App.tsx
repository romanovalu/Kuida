import { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabase';
import type { Session } from '@supabase/supabase-js';
import * as db from './lib/db';
import {
  applyTheme, RUBROS, SERVICIOS_PRESET, defaultConfig,
} from './store';
import type {
  Paciente, Turno, Consulta, HorarioBloqueado, Configuracion,
  Cobro, Gasto, Odontograma, Medicion, NotaClinica, HistorialServicio, Receta, Rubro,
} from './types';
import Dashboard from './components/Dashboard';
import Turnos from './components/Turnos';
import Pacientes from './components/Pacientes';
import Historial from './components/Historial';
import Reportes from './components/Reportes';
import ConfigPage from './components/Configuracion';
import Finanzas from './components/Finanzas';
import Auth from './components/Auth';
import { KuidaLogo, KuidaCompact, KuidaIcon } from './components/KuidaLogo';
import { LayoutDashboard, CalendarDays, Users, ClipboardList, BarChart2, Settings, Wallet, LogOut } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Page = 'dashboard' | 'turnos' | 'pacientes' | 'historial' | 'reportes' | 'config' | 'finanzas';

const RUBROS_CLIENTE = ['peluqueria', 'estetica', 'otro'];

function navItems(rubro: string) {
  const esCliente = RUBROS_CLIENTE.includes(rubro);
  return [
    { id: 'dashboard' as Page, label: 'Inicio',                             Icon: LayoutDashboard },
    { id: 'turnos'    as Page, label: 'Turnos',                             Icon: CalendarDays },
    { id: 'pacientes' as Page, label: esCliente ? 'Clientes' : 'Pacientes', Icon: Users },
    { id: 'historial' as Page, label: 'Historial',                          Icon: ClipboardList },
    { id: 'finanzas'  as Page, label: 'Finanzas',                           Icon: Wallet },
    { id: 'reportes'  as Page, label: 'Reportes',                           Icon: BarChart2 },
    { id: 'config'    as Page, label: 'Config',                             Icon: Settings },
  ];
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  const [page, setPage] = useState<Page>('dashboard');
  const [config, setConfig] = useState<Configuracion>(defaultConfig);
  const [showSetup, setShowSetup] = useState(false);

  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [bloqueados, setBloqueados] = useState<HorarioBloqueado[]>([]);
  const [cobros, setCobros] = useState<Cobro[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [odontogramas, setOdontogramas] = useState<Odontograma[]>([]);
  const [mediciones, setMediciones] = useState<Medicion[]>([]);
  const [notasClinicas, setNotasClinicas] = useState<NotaClinica[]>([]);
  const [historialServicios, setHistorialServicios] = useState<HistorialServicio[]>([]);
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [pacienteHistorial, setPacienteHistorial] = useState<Paciente | null>(null);
  const [reservasPublicas, setReservasPublicas] = useState<db.ReservaPublica[]>([]);

  // ── Auth listener ────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSession(session);
        setShowPasswordReset(true);
        setAuthLoading(false);
        return;
      }
      setShowPasswordReset(false);
      setSession(session);
      setAuthLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Carga de datos al autenticar ─────────────────────────────────────────────
  useEffect(() => {
    if (!session) return;
    loadAll();
  }, [session]);

  async function loadAll() {
    setDataLoading(true);
    try {
      const data = await db.loadAllData();
      setPacientes(data.pacientes);
      setTurnos(data.turnos);
      setConsultas(data.consultas);
      setBloqueados(data.bloqueados);
      setCobros(data.cobros);
      setGastos(data.gastos);
      setRecetas(data.recetas);
      setOdontogramas(data.odontogramas);
      setMediciones(data.mediciones);
      setNotasClinicas(data.notas);
      setHistorialServicios(data.servicios);

      const reservas = await db.getReservasPublicas();
      setReservasPublicas(reservas.filter(r => r.estado === 'pendiente'));

      if (data.config) {
        setConfig(data.config);
        if (data.config.apariencia) applyTheme(data.config.apariencia.accentColor, data.config.apariencia.darkColor);
        setShowSetup(!data.config.setupDone);
      } else {
        setShowSetup(true);
      }
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setDataLoading(false);
    }
  }

  // ── Handlers — optimistic update + sync a Supabase ───────────────────────────

  const handleSavePaciente = useCallback((p: Paciente) => {
    setPacientes(prev => {
      const n = prev.find(x => x.id === p.id) ? prev.map(x => x.id === p.id ? p : x) : [...prev, p];
      return n;
    });
    db.upsertPaciente(p).catch(console.error);
  }, []);

  const handleDeletePaciente = useCallback((id: string) => {
    setPacientes(prev => prev.filter(x => x.id !== id));
    db.deletePaciente(id).catch(console.error);
  }, []);

  const handleSaveTurno = useCallback((t: Turno) => {
    setTurnos(prev => [...prev, t]);
    db.upsertTurno(t).catch(console.error);
  }, []);

  const handleUpdateTurno = useCallback((t: Turno) => {
    setTurnos(prev => prev.map(x => x.id === t.id ? t : x));
    db.upsertTurno(t).catch(console.error);
  }, []);

  const handleSaveConsulta = useCallback((c: Consulta) => {
    setConsultas(prev => {
      const n = prev.find(x => x.id === c.id) ? prev.map(x => x.id === c.id ? c : x) : [...prev, c];
      return n;
    });
    db.upsertConsulta(c).catch(console.error);
  }, []);

  const handleDeleteConsulta = useCallback((id: string) => {
    setConsultas(prev => prev.filter(x => x.id !== id));
    db.deleteConsulta(id).catch(console.error);
  }, []);

  const handleSaveBloqueado = useCallback((h: HorarioBloqueado) => {
    setBloqueados(prev => [...prev, h]);
    db.upsertHorarioBloqueado(h).catch(console.error);
  }, []);

  const handleDeleteBloqueado = useCallback((id: string) => {
    setBloqueados(prev => prev.filter(x => x.id !== id));
    db.deleteHorarioBloqueado(id).catch(console.error);
  }, []);

  const handleAceptarReserva = useCallback((r: db.ReservaPublica) => {
    const nuevoTurno: Turno = {
      id: crypto.randomUUID(),
      fecha: r.fecha,
      hora: r.hora,
      duracion: r.duracion,
      pacienteId: '',
      motivo: r.motivo || '',
      estado: 'confirmado',
      notas: `Reserva online — ${r.nombre_paciente}${r.telefono_paciente ? ` · Tel: ${r.telefono_paciente}` : ''}`,
    };
    setTurnos(prev => [...prev, nuevoTurno]);
    db.upsertTurno(nuevoTurno).catch(console.error);
    setReservasPublicas(prev => prev.filter(x => x.id !== r.id));
    db.updateReservaEstado(r.id, 'aceptado').catch(console.error);
  }, []);

  const handleRechazarReserva = useCallback((id: string) => {
    setReservasPublicas(prev => prev.filter(x => x.id !== id));
    db.updateReservaEstado(id, 'rechazado').catch(console.error);
  }, []);

  const handleSaveConfig = useCallback((c: Configuracion) => {
    setConfig(c);
    if (c.apariencia) applyTheme(c.apariencia.accentColor, c.apariencia.darkColor);
    db.saveConfigToDB(c).catch(console.error);
  }, []);

  const handleSaveReceta = useCallback((r: Receta) => {
    setRecetas(prev => [...prev, r]);
    db.upsertReceta(r).catch(console.error);
  }, []);

  const handleDeleteReceta = useCallback((id: string) => {
    setRecetas(prev => prev.filter(x => x.id !== id));
    db.deleteReceta(id).catch(console.error);
  }, []);

  const handleSaveCobro = useCallback((c: Cobro) => {
    setCobros(prev => {
      const n = prev.find(x => x.id === c.id) ? prev.map(x => x.id === c.id ? c : x) : [...prev, c];
      return n;
    });
    db.upsertCobro(c).catch(console.error);
  }, []);

  const handleDeleteCobro = useCallback((id: string) => {
    setCobros(prev => prev.filter(x => x.id !== id));
    db.deleteCobro(id).catch(console.error);
  }, []);

  const handleSaveGasto = useCallback((g: Gasto) => {
    setGastos(prev => {
      const n = prev.find(x => x.id === g.id) ? prev.map(x => x.id === g.id ? g : x) : [...prev, g];
      return n;
    });
    db.upsertGasto(g).catch(console.error);
  }, []);

  const handleDeleteGasto = useCallback((id: string) => {
    setGastos(prev => prev.filter(x => x.id !== id));
    db.deleteGasto(id).catch(console.error);
  }, []);

  const handleSaveOdontograma = useCallback((o: Odontograma) => {
    setOdontogramas(prev => {
      const n = prev.find(x => x.pacienteId === o.pacienteId)
        ? prev.map(x => x.pacienteId === o.pacienteId ? o : x)
        : [...prev, o];
      return n;
    });
    db.upsertOdontograma(o).catch(console.error);
  }, []);

  const handleSaveMedicion = useCallback((m: Medicion) => {
    setMediciones(prev => [...prev, m]);
    db.upsertMedicion(m).catch(console.error);
  }, []);

  const handleDeleteMedicion = useCallback((id: string) => {
    setMediciones(prev => prev.filter(x => x.id !== id));
    db.deleteMedicion(id).catch(console.error);
  }, []);

  const handleSaveNota = useCallback((n: NotaClinica) => {
    setNotasClinicas(prev => [...prev, n]);
    db.upsertNotaClinica(n).catch(console.error);
  }, []);

  const handleDeleteNota = useCallback((id: string) => {
    setNotasClinicas(prev => prev.filter(x => x.id !== id));
    db.deleteNotaClinica(id).catch(console.error);
  }, []);

  const handleSaveServicioHist = useCallback((h: HistorialServicio) => {
    setHistorialServicios(prev => [...prev, h]);
    db.upsertHistorialServicio(h).catch(console.error);
  }, []);

  const handleDeleteServicioHist = useCallback((id: string) => {
    setHistorialServicios(prev => prev.filter(x => x.id !== id));
    db.deleteHistorialServicio(id).catch(console.error);
  }, []);

  const navToHistorial = useCallback((p: Paciente) => {
    setPacienteHistorial(p); setPage('historial');
  }, []);

  const navigate = useCallback((p: string) => setPage(p as Page), []);

  // ── Estados de carga ─────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--dark)' }}>
        <div className="flex flex-col items-center gap-4">
          <KuidaIcon size={56} dark />
          <p className="text-white/40 text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  if (showPasswordReset) return <PasswordResetForm onDone={() => setShowPasswordReset(false)} />;

  if (!session) return <Auth />;

  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--dark)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="animate-pulse"><KuidaIcon size={56} dark /></div>
          <p className="text-white/40 text-sm">Cargando tu espacio de trabajo...</p>
        </div>
      </div>
    );
  }

  // ── Setup wizard ─────────────────────────────────────────────────────────────
  if (showSetup) {
    return (
      <SetupWizard onComplete={async cfg => {
        const full = { ...cfg, setupDone: true as const };
        setConfig(full);
        await db.saveConfigToDB(full);
        setShowSetup(false);
      }} />
    );
  }

  // ── Main app ─────────────────────────────────────────────────────────────────

  const profToolsProps = {
    odontogramas, mediciones, notasClinicas, historialServicios, recetas,
    onSaveOdontograma: handleSaveOdontograma,
    onSaveMedicion: handleSaveMedicion, onDeleteMedicion: handleDeleteMedicion,
    onSaveNota: handleSaveNota, onDeleteNota: handleDeleteNota,
    onSaveServicioHist: handleSaveServicioHist, onDeleteServicioHist: handleDeleteServicioHist,
    onSaveReceta: handleSaveReceta, onDeleteReceta: handleDeleteReceta,
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--surface)' }}>
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 min-h-screen fixed left-0 top-0 z-10"
        style={{ background: 'var(--dark)', color: 'white' }}>
        <div className="px-5 py-6 border-b border-white/5">
          <KuidaCompact dark />
          <p className="text-xs mt-3 font-medium truncate" style={{ color: 'var(--cyan)' }}>{config.nombreProfesional}</p>
          <p className="text-xs text-white/40 truncate">{config.especialidad}</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems(config.rubro).map(({ id, label, Icon }) => {
            const active = page === id;
            return (
              <button key={id} onClick={() => setPage(id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={active ? { background: 'var(--cyan)', color: 'var(--dark)' } : { color: 'rgba(255,255,255,0.5)' }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'white'; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)'; }}>
                <Icon size={16} strokeWidth={active ? 2.5 : 2} />{label}
              </button>
            );
          })}
        </nav>
        <div className="px-4 py-4 border-t border-white/5">
          <button
            onClick={() => supabase.auth.signOut()}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-white/30 hover:text-white/70 transition-colors">
            <LogOut size={14} /> Cerrar sesión
          </button>
          <p className="text-[10px] text-white/20 tracking-wide mt-2 px-3">v2.0</p>
        </div>
      </aside>

      <main className="flex-1 md:ml-56 pb-24 md:pb-0">
        <header className="md:hidden sticky top-0 z-10 px-4 py-3 flex items-center justify-between border-b border-white/10"
          style={{ background: 'var(--dark)' }}>
          <KuidaCompact dark />
          <button onClick={() => supabase.auth.signOut()} className="p-2 text-white/30">
            <LogOut size={16} />
          </button>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-6">
          {page === 'dashboard' && <Dashboard turnos={turnos} pacientes={pacientes} bloqueados={bloqueados} config={config} onNavigate={navigate} onSaveTurno={handleSaveTurno} onSavePaciente={handleSavePaciente} recetas={recetas} onSaveReceta={handleSaveReceta} onDeleteReceta={handleDeleteReceta} reservasPendientes={reservasPublicas} onAceptarReserva={handleAceptarReserva} onRechazarReserva={handleRechazarReserva} />}
          {page === 'turnos'    && <Turnos turnos={turnos} pacientes={pacientes} bloqueados={bloqueados} config={config} onSaveTurno={handleSaveTurno} onUpdateTurno={handleUpdateTurno} onSaveBloqueado={handleSaveBloqueado} onDeleteBloqueado={handleDeleteBloqueado} />}
          {page === 'pacientes' && <Pacientes pacientes={pacientes} onSave={handleSavePaciente} onDelete={handleDeletePaciente} onVerHistorial={navToHistorial} config={config} {...profToolsProps} />}
          {page === 'historial' && <Historial consultas={consultas} pacientes={pacientes} turnos={turnos} pacienteSeleccionado={pacienteHistorial} onSave={handleSaveConsulta} onDelete={handleDeleteConsulta} config={config} />}
          {page === 'finanzas'  && <Finanzas cobros={cobros} gastos={gastos} pacientes={pacientes} onSaveCobro={handleSaveCobro} onDeleteCobro={handleDeleteCobro} onSaveGasto={handleSaveGasto} onDeleteGasto={handleDeleteGasto} />}
          {page === 'reportes'  && <Reportes turnos={turnos} pacientes={pacientes} consultas={consultas} />}
          {page === 'config'    && <ConfigPage config={config} onSave={handleSaveConfig} onResetSetup={async () => { const c = { ...config, setupDone: false }; await db.saveConfigToDB(c); setShowSetup(true); }} />}
        </div>
      </main>

      {/* Bottom nav mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-10 border-t border-white/10"
        style={{ background: 'var(--dark)' }}>
        <div className="flex">
          {navItems(config.rubro).map(({ id, label, Icon }) => {
            const active = page === id;
            return (
              <button key={id} onClick={() => setPage(id)}
                className="flex-1 flex flex-col items-center py-3 gap-1 transition-colors"
                style={{ color: active ? 'var(--cyan)' : 'rgba(255,255,255,0.4)' }}>
                <Icon size={18} strokeWidth={active ? 2.5 : 1.75} />
                <span className="text-[9px] font-semibold tracking-wide">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

// ── Setup Wizard ──────────────────────────────────────────────────────────────

function PasswordResetForm({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return; }
    setLoading(true); setError('');
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) { setError(err.message); setLoading(false); return; }
    setDone(true);
    setTimeout(() => { onDone(); }, 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0D1117' }}>
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center"><KuidaLogo dark subtitle="Nueva contraseña" /></div>
        {done ? (
          <div className="text-center">
            <p className="text-green-400 font-bold text-sm">¡Contraseña actualizada! Redirigiendo...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-1.5">Nueva contraseña</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres" autoFocus required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.1)', color: 'white' }}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-1.5">Repetir contraseña</label>
              <input
                type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="Repetí la contraseña" required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.1)', color: 'white' }}
              />
            </div>
            {error && <p className="text-red-400 text-xs bg-red-950/50 px-3 py-2 rounded-xl">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-full text-sm font-extrabold transition-opacity"
              style={{ background: 'var(--cyan)', color: '#0D1117', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Guardando...' : 'Cambiar contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function SetupWizard({ onComplete }: { onComplete: (c: Configuracion) => Promise<void> }) {
  const [step, setStep] = useState(0);
  const [nombre, setNombre] = useState('');
  const [especialidad, setEspecialidad] = useState('');
  const [rubro, setRubro] = useState<Rubro>('otro');
  const [saving, setSaving] = useState(false);

  const base: Configuracion = {
    nombreProfesional: nombre,
    especialidad: especialidad || RUBROS.find(r => r.value === rubro)?.label || '',
    rubro,
    horaInicio: '09:00',
    horaFin: '18:00',
    diasLaborables: [1, 2, 3, 4, 5],
    intervaloGrilla: 15,
    servicios: SERVICIOS_PRESET[rubro],
    setupDone: true,
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--dark)' }}>
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <KuidaLogo dark subtitle={`Configuración inicial · Paso ${step + 1} de 2`} />
        </div>

        <div className="flex gap-2 mb-8">
          {[0, 1].map(i => (
            <div key={i} className="flex-1 h-1 rounded-full transition-all"
              style={{ background: i <= step ? 'var(--cyan)' : 'rgba(255,255,255,0.1)' }} />
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-extrabold text-white mb-1">¿Cuál es tu profesión?</h2>
              <p className="text-sm text-white/40">Configura los servicios y herramientas disponibles</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {RUBROS.map(r => (
                <button key={r.value} onClick={() => setRubro(r.value)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-2xl text-center transition-all"
                  style={rubro === r.value
                    ? { background: 'var(--cyan)', color: 'var(--dark)' }
                    : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)' }}>
                  <span className="text-xl">{r.emoji}</span>
                  <span className="text-[10px] font-bold leading-tight">{r.label.split(' / ')[0]}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setStep(1)}
              className="w-full py-3 rounded-full font-bold text-sm transition-all"
              style={{ background: 'var(--cyan)', color: 'var(--dark)' }}>
              Continuar →
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-extrabold text-white mb-1">Sobre vos</h2>
              <p className="text-sm text-white/40">Estos datos aparecen en los turnos y consultas</p>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider mb-1.5 block"
                  style={{ color: 'rgba(255,255,255,0.5)' }}>Tu nombre completo</Label>
                <Input value={nombre} onChange={e => setNombre(e.target.value)}
                  placeholder="Ej: Dra. María García"
                  className="rounded-xl border-0 text-white placeholder:text-white/20 font-medium"
                  style={{ background: 'rgba(255,255,255,0.07)' }} autoFocus />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider mb-1.5 block"
                  style={{ color: 'rgba(255,255,255,0.5)' }}>Especialidad (opcional)</Label>
                <Input value={especialidad} onChange={e => setEspecialidad(e.target.value)}
                  placeholder={`Ej: ${RUBROS.find(r => r.value === rubro)?.label || 'Tu especialidad'}`}
                  className="rounded-xl border-0 text-white placeholder:text-white/20"
                  style={{ background: 'rgba(255,255,255,0.07)' }} />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(0)}
                className="flex-1 py-3 rounded-full font-bold text-sm border border-white/10 text-white/50">
                ← Atrás
              </button>
              <button
                onClick={async () => {
                  if (!nombre.trim() || saving) return;
                  setSaving(true);
                  await onComplete(base);
                  setSaving(false);
                }}
                disabled={!nombre.trim() || saving}
                className="flex-1 py-3 rounded-full font-bold text-sm transition-all disabled:opacity-40"
                style={{ background: 'var(--cyan)', color: 'var(--dark)' }}>
                {saving ? 'Guardando...' : 'Comenzar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
