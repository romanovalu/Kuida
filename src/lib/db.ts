import { supabase } from './supabase';
import type {
  Paciente, Turno, Consulta, HorarioBloqueado,
  Cobro, Gasto, Receta, Odontograma, Medicion,
  NotaClinica, HistorialServicio, Configuracion,
} from '../types';

// ── Case conversion ───────────────────────────────────────────────────────────
const toCamel = (s: string) => s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
const toSnake = (s: string) => s.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);

function camelKeys<T>(obj: Record<string, unknown>): T {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [toCamel(k), v])
  ) as T;
}

function snakeKeys(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [toSnake(k), v])
  );
}

// ── Auth helper ───────────────────────────────────────────────────────────────
async function getUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');
  return user.id;
}

// ── Generic CRUD ──────────────────────────────────────────────────────────────
async function getAll<T>(table: string): Promise<T[]> {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(row => camelKeys<T>(row));
}

async function upsertRow(table: string, obj: Record<string, unknown>): Promise<void> {
  const userId = await getUserId();
  const row = { ...snakeKeys(obj), user_id: userId };
  const { error } = await supabase.from(table).upsert(row, { onConflict: 'id' });
  if (error) throw error;
}

async function deleteRow(table: string, id: string): Promise<void> {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
}

// ── Pacientes ─────────────────────────────────────────────────────────────────
export const getPacientes = () => getAll<Paciente>('pacientes');
export const upsertPaciente = (p: Paciente) => upsertRow('pacientes', p as unknown as Record<string, unknown>);
export const deletePaciente = (id: string) => deleteRow('pacientes', id);

// ── Turnos ────────────────────────────────────────────────────────────────────
export const getTurnos = () => getAll<Turno>('turnos');
export const upsertTurno = (t: Turno) => upsertRow('turnos', t as unknown as Record<string, unknown>);
export const deleteTurno = (id: string) => deleteRow('turnos', id);

// ── Consultas ─────────────────────────────────────────────────────────────────
export const getConsultas = () => getAll<Consulta>('consultas');
export const upsertConsulta = (c: Consulta) => upsertRow('consultas', c as unknown as Record<string, unknown>);
export const deleteConsulta = (id: string) => deleteRow('consultas', id);

// ── Horarios bloqueados ───────────────────────────────────────────────────────
export const getHorariosBloqueados = () => getAll<HorarioBloqueado>('horarios_bloqueados');
export const upsertHorarioBloqueado = (h: HorarioBloqueado) => upsertRow('horarios_bloqueados', h as unknown as Record<string, unknown>);
export const deleteHorarioBloqueado = (id: string) => deleteRow('horarios_bloqueados', id);

// ── Cobros ────────────────────────────────────────────────────────────────────
export const getCobros = () => getAll<Cobro>('cobros');
export const upsertCobro = (c: Cobro) => upsertRow('cobros', c as unknown as Record<string, unknown>);
export const deleteCobro = (id: string) => deleteRow('cobros', id);

// ── Gastos ────────────────────────────────────────────────────────────────────
export const getGastos = () => getAll<Gasto>('gastos');
export const upsertGasto = (g: Gasto) => upsertRow('gastos', g as unknown as Record<string, unknown>);
export const deleteGasto = (id: string) => deleteRow('gastos', id);

// ── Recetas ───────────────────────────────────────────────────────────────────
export const getRecetas = () => getAll<Receta>('recetas');
export const upsertReceta = (r: Receta) => upsertRow('recetas', r as unknown as Record<string, unknown>);
export const deleteReceta = (id: string) => deleteRow('recetas', id);

// ── Odontogramas (sin created_at, único por paciente) ─────────────────────────
export async function getOdontogramas(): Promise<Odontograma[]> {
  const { data, error } = await supabase.from('odontogramas').select('*');
  if (error) throw error;
  return (data || []).map(row => ({
    pacienteId: row.paciente_id as string,
    dientes: (row.dientes || {}) as Odontograma['dientes'],
    notas: (row.notas || '') as string,
    updatedAt: row.updated_at as string,
  }));
}

export async function upsertOdontograma(o: Odontograma): Promise<void> {
  const userId = await getUserId();
  const { error } = await supabase.from('odontogramas').upsert(
    {
      user_id: userId,
      paciente_id: o.pacienteId,
      dientes: o.dientes,
      notas: o.notas,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'paciente_id' }
  );
  if (error) throw error;
}

// ── Mediciones ────────────────────────────────────────────────────────────────
export const getMediciones = () => getAll<Medicion>('mediciones');
export const upsertMedicion = (m: Medicion) => upsertRow('mediciones', m as unknown as Record<string, unknown>);
export const deleteMedicion = (id: string) => deleteRow('mediciones', id);

// ── Notas clínicas ────────────────────────────────────────────────────────────
export const getNotasClinicas = () => getAll<NotaClinica>('notas_clinicas');
export const upsertNotaClinica = (n: NotaClinica) => upsertRow('notas_clinicas', n as unknown as Record<string, unknown>);
export const deleteNotaClinica = (id: string) => deleteRow('notas_clinicas', id);

// ── Historial servicios ───────────────────────────────────────────────────────
export const getHistorialServicios = () => getAll<HistorialServicio>('historial_servicios');
export const upsertHistorialServicio = (h: HistorialServicio) => upsertRow('historial_servicios', h as unknown as Record<string, unknown>);
export const deleteHistorialServicio = (id: string) => deleteRow('historial_servicios', id);

// ── Configuración ─────────────────────────────────────────────────────────────
export async function getConfigFromDB(): Promise<Configuracion | null> {
  const { data, error } = await supabase
    .from('configuracion')
    .select('datos')
    .maybeSingle();
  if (error || !data) return null;
  return data.datos as Configuracion;
}

export async function saveConfigToDB(config: Configuracion, logoApp?: string, logoReceta?: string): Promise<void> {
  const userId = await getUserId();
  const row: Record<string, unknown> = {
    user_id: userId,
    datos: config,
    updated_at: new Date().toISOString(),
  };
  if (logoApp !== undefined) row.logo_app = logoApp;
  if (logoReceta !== undefined) row.logo_receta = logoReceta;
  const { error } = await supabase.from('configuracion').upsert(row, { onConflict: 'user_id' });
  if (error) throw error;
}

export async function getLogosFromDB(): Promise<{ logoApp: string; logoReceta: string }> {
  const { data } = await supabase.from('configuracion').select('logo_app, logo_receta').maybeSingle();
  return {
    logoApp: (data?.logo_app as string) || '',
    logoReceta: (data?.logo_receta as string) || '',
  };
}

// ── Carga inicial completa ────────────────────────────────────────────────────
export async function loadAllData() {
  const [
    pacientes, turnos, consultas, bloqueados,
    cobros, gastos, recetas, odontogramas,
    mediciones, notas, servicios, config,
  ] = await Promise.all([
    getPacientes(),
    getTurnos(),
    getConsultas(),
    getHorariosBloqueados(),
    getCobros(),
    getGastos(),
    getRecetas(),
    getOdontogramas(),
    getMediciones(),
    getNotasClinicas(),
    getHistorialServicios(),
    getConfigFromDB(),
  ]);

  return { pacientes, turnos, consultas, bloqueados, cobros, gastos, recetas, odontogramas, mediciones, notas, servicios, config };
}
