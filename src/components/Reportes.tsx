import { useMemo } from 'react';
import type { Turno, Paciente, Consulta, OrdenTrabajo, Cobro, Vehiculo, Configuracion } from '../types';

interface Props {
  turnos: Turno[];
  pacientes: Paciente[];
  consultas: Consulta[];
  ordenesTrabajo?: OrdenTrabajo[];
  cobros?: Cobro[];
  vehiculos?: Vehiculo[];
  config?: Configuracion;
}

export default function Reportes({ turnos, pacientes, consultas, ordenesTrabajo = [], cobros = [], vehiculos = [], config }: Props) {
  if (config?.rubro === 'taller') {
    return <ReportesTaller ordenesTrabajo={ordenesTrabajo} cobros={cobros} vehiculos={vehiculos} clientes={pacientes} />;
  }
  const stats = useMemo(() => {
    const total = turnos.length;
    const atendidos  = turnos.filter(t => t.estado === 'atendido').length;
    const cancelados = turnos.filter(t => t.estado === 'cancelado').length;
    const pendientes = turnos.filter(t => t.estado === 'pendiente').length;
    const confirmados= turnos.filter(t => t.estado === 'confirmado').length;

    const motivosCancelacion: Record<string, number> = {};
    turnos.filter(t => t.estado === 'cancelado' && t.motivoCancelacion).forEach(t => {
      const m = t.motivoCancelacion!;
      motivosCancelacion[m] = (motivosCancelacion[m] || 0) + 1;
    });

    const hoy = new Date();
    const semana = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(hoy.getTime() - (6 - i) * 86400000);
      const fecha = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('es-AR', { weekday: 'short' });
      return { label: `${label} ${d.getDate()}`, count: turnos.filter(t => t.fecha === fecha && t.estado !== 'cancelado').length };
    });

    const frecuencia: Record<string, number> = {};
    turnos.filter(t => t.estado === 'atendido').forEach(t => { frecuencia[t.pacienteId] = (frecuencia[t.pacienteId] || 0) + 1; });
    const top = Object.entries(frecuencia).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, count]) => {
      const p = pacientes.find(x => x.id === id);
      return { nombre: p ? `${p.nombre} ${p.apellido}` : 'Desconocido', count };
    });

    return { total, atendidos, cancelados, pendientes, confirmados, motivosCancelacion, semana, top };
  }, [turnos, pacientes]);

  const maxSemana = Math.max(...stats.semana.map(s => s.count), 1);
  const tasaAsistencia  = stats.total > 0 ? Math.round((stats.atendidos  / stats.total) * 100) : 0;
  const tasaCancelacion = stats.total > 0 ? Math.round((stats.cancelados / stats.total) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Header banner */}
      <div className="rounded-2xl px-5 py-5" style={{ background: 'var(--dark)' }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--cyan)' }}>Estadísticas</p>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Reportes</h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <Kpi label="Total turnos"   value={stats.total}    color="var(--cyan)" />
        <Kpi label="Atendidos"      value={stats.atendidos} color="#22C55E" />
        <Kpi label="Cancelados"     value={stats.cancelados} color="#F87171" />
        <Kpi label="Pacientes"      value={pacientes.length} color="#818CF8" />
      </div>

      {/* Tasas */}
      <Card title="Indicadores">
        <div className="space-y-4">
          <RateBar label="Tasa de asistencia" value={tasaAsistencia} color="var(--cyan)" />
          <RateBar label="Tasa de cancelación" value={tasaCancelacion} color="#F87171" />
        </div>
      </Card>

      {/* Gráfico semanal */}
      <Card title="Últimos 7 días">
        <div className="flex items-end gap-2 h-28 mt-3">
          {stats.semana.map(({ label, count }) => (
            <div key={label} className="flex-1 flex flex-col items-center gap-1">
              {count > 0 && <span className="text-[10px] font-bold" style={{ color: 'var(--dark)' }}>{count}</span>}
              <div
                className="w-full rounded-t-lg transition-all"
                style={{
                  height: `${(count / maxSemana) * 80}px`,
                  minHeight: count > 0 ? 4 : 0,
                  background: count > 0 ? 'var(--cyan)' : '#F3F4F6',
                }}
              />
              <span className="text-[9px] font-medium text-gray-400 text-center capitalize leading-tight">{label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Distribución */}
      <Card title="Distribución de estados">
        <div className="space-y-3 mt-1">
          {[
            { label: 'Atendidos',   count: stats.atendidos,   color: '#22C55E' },
            { label: 'Confirmados', count: stats.confirmados, color: 'var(--cyan)' },
            { label: 'Pendientes',  count: stats.pendientes,  color: '#F59E0B' },
            { label: 'Cancelados',  count: stats.cancelados,  color: '#F87171' },
          ].map(({ label, count, color }) => {
            const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
            return (
              <div key={label}>
                <div className="flex justify-between text-xs font-medium mb-1.5">
                  <span className="text-gray-600">{label}</span>
                  <span className="text-gray-500">{count} ({pct}%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Motivos cancelación */}
      {Object.keys(stats.motivosCancelacion).length > 0 && (
        <Card title="Motivos de cancelación">
          <div className="space-y-2 mt-1">
            {Object.entries(stats.motivosCancelacion).sort((a, b) => b[1] - a[1]).map(([motivo, count]) => (
              <div key={motivo} className="flex items-center justify-between text-xs">
                <span className="text-gray-600">{motivo}</span>
                <span
                  className="font-bold px-2.5 py-0.5 rounded-full text-[11px]"
                  style={{ background: '#FFF1F2', color: '#BE123C' }}
                >{count}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Top pacientes */}
      {stats.top.length > 0 && (
        <Card title="Pacientes con más visitas">
          <div className="space-y-2.5 mt-1">
            {stats.top.map(({ nombre, count }, i) => (
              <div key={nombre} className="flex items-center gap-3 text-xs">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                  style={{ background: 'var(--cyan-light)', color: 'var(--cyan-dark)' }}
                >
                  {i + 1}
                </span>
                <span className="flex-1 font-medium text-gray-700">{nombre}</span>
                <span
                  className="font-bold px-2.5 py-0.5 rounded-full text-[11px]"
                  style={{ background: 'var(--cyan-light)', color: 'var(--cyan-dark)' }}
                >
                  {count} visita{count !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card title="Consultas en historial">
        <p className="text-4xl font-extrabold tracking-tight mt-1" style={{ color: 'var(--cyan)' }}>{consultas.length}</p>
      </Card>
    </div>
  );
}

function Kpi({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm flex items-end justify-between">
      <div>
        <p className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--dark)' }}>{value}</p>
        <p className="text-xs font-semibold text-gray-500 mt-0.5">{label}</p>
      </div>
      <div className="w-2 h-10 rounded-full" style={{ background: color }} />
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl px-5 py-4 shadow-sm">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{title}</p>
      {children}
    </div>
  );
}

function RateBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs font-medium mb-1.5">
        <span className="text-gray-600">{label}</span>
        <span className="font-bold" style={{ color: 'var(--dark)' }}>{value}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div className="h-2 rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

// ── Reportes Taller ──────────────────────────────────────────────────────────
function ReportesTaller({ ordenesTrabajo, cobros, vehiculos, clientes }: {
  ordenesTrabajo: OrdenTrabajo[];
  cobros: Cobro[];
  vehiculos: Vehiculo[];
  clientes: Paciente[];
}) {
  const stats = useMemo(() => {
    const hoy = new Date();
    const mesActual = hoy.toISOString().slice(0, 7);
    // Últimos 6 meses
    const meses = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - (5 - i), 1);
      const key = d.toISOString().slice(0, 7);
      const label = d.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' });
      const ots = ordenesTrabajo.filter(o => o.createdAt.startsWith(key)).length;
      const ingresos = cobros.filter(c => c.fecha.startsWith(key)).reduce((a, c) => a + c.monto, 0);
      return { key, label, ots, ingresos };
    });

    const totalOTs       = ordenesTrabajo.length;
    const entregadas     = ordenesTrabajo.filter(o => o.estado === 'entregado').length;
    const canceladas     = ordenesTrabajo.filter(o => o.estado === 'cancelado').length;
    const activas        = ordenesTrabajo.filter(o => !['entregado','cancelado'].includes(o.estado)).length;
    const ingresosMes    = cobros.filter(c => c.fecha.startsWith(mesActual)).reduce((a, c) => a + c.monto, 0);
    const ingresosTotal  = cobros.reduce((a, c) => a + c.monto, 0);
    const otsMes         = ordenesTrabajo.filter(o => o.createdAt.startsWith(mesActual)).length;

    // Top vehículos por cantidad de OTs
    const freq: Record<string, number> = {};
    ordenesTrabajo.forEach(o => { if (o.vehiculoId) freq[o.vehiculoId] = (freq[o.vehiculoId] || 0) + 1; });
    const topVehiculos = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, count]) => {
      const v = vehiculos.find(x => x.id === id);
      const c = v?.clienteId ? clientes.find(x => x.id === v.clienteId) : undefined;
      return { label: v ? `${v.patente} — ${v.marca} ${v.modelo}` : '—', cliente: c ? `${c.nombre} ${c.apellido}` : '', count };
    });

    const estadoDist = [
      { label: 'Activas',    count: activas,    color: 'var(--cyan)' },
      { label: 'Entregadas', count: entregadas, color: '#22C55E' },
      { label: 'Canceladas', count: canceladas, color: '#F87171' },
    ];

    return { meses, totalOTs, entregadas, canceladas, activas, ingresosMes, ingresosTotal, otsMes, topVehiculos, estadoDist };
  }, [ordenesTrabajo, cobros, vehiculos, clientes]);

  const maxOTs      = Math.max(...stats.meses.map(m => m.ots), 1);
  const maxIngresos = Math.max(...stats.meses.map(m => m.ingresos), 1);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl px-5 py-5" style={{ background: 'var(--dark)' }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--cyan)' }}>Estadísticas</p>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Reportes del Taller</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Kpi label="Total OTs"      value={stats.totalOTs}    color="var(--cyan)" />
        <Kpi label="OTs este mes"   value={stats.otsMes}      color="#818CF8" />
        <Kpi label="Entregadas"     value={stats.entregadas}  color="#22C55E" />
        <Kpi label="Activas ahora"  value={stats.activas}     color="#F59E0B" />
      </div>

      <Card title="Ingresos totales">
        <p className="text-3xl font-extrabold mt-1" style={{ color: 'var(--cyan)' }}>
          ${stats.ingresosTotal.toLocaleString('es-AR')}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">Este mes: <span className="font-bold text-gray-700">${stats.ingresosMes.toLocaleString('es-AR')}</span></p>
      </Card>

      <Card title="OTs por mes (últimos 6 meses)">
        <div className="flex items-end gap-2 h-28 mt-3">
          {stats.meses.map(m => (
            <div key={m.key} className="flex-1 flex flex-col items-center gap-1">
              {m.ots > 0 && <span className="text-[10px] font-bold" style={{ color: 'var(--dark)' }}>{m.ots}</span>}
              <div className="w-full rounded-t-lg transition-all"
                style={{ height: `${(m.ots / maxOTs) * 80}px`, minHeight: m.ots > 0 ? 4 : 0, background: m.ots > 0 ? 'var(--cyan)' : '#F3F4F6' }} />
              <span className="text-[9px] font-medium text-gray-400 text-center capitalize">{m.label}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Ingresos por mes (últimos 6 meses)">
        <div className="flex items-end gap-2 h-28 mt-3">
          {stats.meses.map(m => (
            <div key={m.key} className="flex-1 flex flex-col items-center gap-1">
              {m.ingresos > 0 && <span className="text-[9px] font-bold" style={{ color: 'var(--dark)' }}>${(m.ingresos/1000).toFixed(0)}k</span>}
              <div className="w-full rounded-t-lg transition-all"
                style={{ height: `${(m.ingresos / maxIngresos) * 80}px`, minHeight: m.ingresos > 0 ? 4 : 0, background: '#34D399' }} />
              <span className="text-[9px] font-medium text-gray-400 text-center capitalize">{m.label}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Estados de OTs">
        <div className="space-y-3 mt-2">
          {stats.estadoDist.map(({ label, count, color }) => {
            const pct = stats.totalOTs > 0 ? Math.round((count / stats.totalOTs) * 100) : 0;
            return (
              <div key={label}>
                <div className="flex justify-between text-xs font-medium mb-1.5">
                  <span className="text-gray-600">{label}</span>
                  <span className="text-gray-500">{count} ({pct}%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {stats.topVehiculos.length > 0 && (
        <Card title="Vehículos más frecuentes">
          <div className="space-y-2.5 mt-1">
            {stats.topVehiculos.map(({ label, cliente, count }, i) => (
              <div key={label} className="flex items-center gap-3 text-xs">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                  style={{ background: 'var(--cyan-light)', color: 'var(--cyan-dark)' }}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-700 truncate">{label}</p>
                  {cliente && <p className="text-gray-400 text-[10px] truncate">{cliente}</p>}
                </div>
                <span className="font-bold px-2.5 py-0.5 rounded-full text-[11px]"
                  style={{ background: 'var(--cyan-light)', color: 'var(--cyan-dark)' }}>
                  {count} OT{count !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
