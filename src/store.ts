import type {
  Paciente, Turno, Consulta, HorarioBloqueado, Configuracion,
  Rubro, Servicio, Cobro, Gasto, Odontograma, Medicion, NotaClinica, HistorialServicio, Receta,
} from './types';

const KEYS = {
  pacientes:    'turnos_pacientes',
  turnos:       'turnos_turnos',
  consultas:    'turnos_consultas',
  bloqueados:   'turnos_bloqueados',
  config:       'turnos_config',
  cobros:       'turnos_cobros',
  gastos:       'turnos_gastos',
  odontogramas: 'turnos_odontogramas',
  mediciones:   'turnos_mediciones',
  notas:        'turnos_notas_clinicas',
  serviciosHist:'turnos_servicios_hist',
  recetas:      'turnos_recetas',
  logoApp:      'turnos_logo_app',
  logoReceta:   'turnos_logo_receta',
};

function load<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function save<T>(key: string, data: T[]) { localStorage.setItem(key, JSON.stringify(data)); }
function loadObj<T>(key: string, def: T): T {
  try { return JSON.parse(localStorage.getItem(key) || 'null') || def; } catch { return def; }
}

export function getPacientes(): Paciente[]             { return load(KEYS.pacientes); }
export function savePacientes(p: Paciente[])           { save(KEYS.pacientes, p); }
export function getTurnos(): Turno[]                   { return load(KEYS.turnos); }
export function saveTurnos(t: Turno[])                 { save(KEYS.turnos, t); }
export function getConsultas(): Consulta[]             { return load(KEYS.consultas); }
export function saveConsultas(c: Consulta[])           { save(KEYS.consultas, c); }
export function getHorariosBloqueados(): HorarioBloqueado[] { return load(KEYS.bloqueados); }
export function saveHorariosBloqueados(h: HorarioBloqueado[]) { save(KEYS.bloqueados, h); }

// Finance
export function getCobros(): Cobro[]   { return load(KEYS.cobros); }
export function saveCobros(c: Cobro[]) { save(KEYS.cobros, c); }
export function getGastos(): Gasto[]   { return load(KEYS.gastos); }
export function saveGastos(g: Gasto[]) { save(KEYS.gastos, g); }

// Professional tools
export function getOdontogramas(): Odontograma[] { return load(KEYS.odontogramas); }
export function saveOdontogramas(o: Odontograma[]) { save(KEYS.odontogramas, o); }
export function getMediciones(): Medicion[] { return load(KEYS.mediciones); }
export function saveMediciones(m: Medicion[]) { save(KEYS.mediciones, m); }
export function getNotasClinicas(): NotaClinica[] { return load(KEYS.notas); }
export function saveNotasClinicas(n: NotaClinica[]) { save(KEYS.notas, n); }
export function getHistorialServicios(): HistorialServicio[] { return load(KEYS.serviciosHist); }
export function saveHistorialServicios(h: HistorialServicio[]) { save(KEYS.serviciosHist, h); }

// Recetas
export function getRecetas(): Receta[] { return load(KEYS.recetas); }
export function saveRecetas(r: Receta[]) { save(KEYS.recetas, r); }

// Logos (stored separately — can be large base64 strings)
export function getLogoApp(): string { return localStorage.getItem(KEYS.logoApp) || ''; }
export function saveLogoApp(url: string) { localStorage.setItem(KEYS.logoApp, url); }
export function getLogoReceta(): string { return localStorage.getItem(KEYS.logoReceta) || ''; }
export function saveLogoReceta(url: string) { localStorage.setItem(KEYS.logoReceta, url); }

// ── Theme ─────────────────────────────────────────────────────────────────────

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return Math.round(255 * (l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1))).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function applyTheme(accentHex: string, darkHex: string) {
  const [h, s, l] = hexToHsl(accentHex);
  const root = document.documentElement;
  root.style.setProperty('--cyan',       accentHex);
  root.style.setProperty('--cyan-dark',  hslToHex(h, s, Math.max(l - 18, 15)));
  root.style.setProperty('--cyan-mid',   hslToHex(h, Math.max(s - 10, 20), Math.min(l + 20, 88)));
  root.style.setProperty('--cyan-light', hslToHex(h, Math.max(s - 30, 8),  Math.min(l + 38, 97)));
  root.style.setProperty('--dark',       darkHex);
  // also update shadcn primary token
  const [ph, ps, pl] = hexToHsl(accentHex);
  root.style.setProperty('--primary', `${ph} ${ps}% ${pl}%`);
}

// ── Rubro presets ─────────────────────────────────────────────────────────────

export const RUBROS: { value: Rubro; label: string; emoji: string }[] = [
  { value: 'odontologia',    label: 'Odontología',              emoji: '🦷' },
  { value: 'medicina',       label: 'Medicina',                 emoji: '🩺' },
  { value: 'psicologia',     label: 'Psicología / Psicopedagogía', emoji: '🧠' },
  { value: 'psicopedagogia', label: 'Psicopedagogía',           emoji: '📚' },
  { value: 'kinesiologia',   label: 'Kinesiología / Fisioterapia', emoji: '💪' },
  { value: 'nutricion',      label: 'Nutrición',                emoji: '🥗' },
  { value: 'peluqueria',     label: 'Peluquería / Barbería',    emoji: '✂️' },
  { value: 'estetica',       label: 'Estética / Mesoterapia',   emoji: '✨' },
  { value: 'otro',           label: 'Otro / Independiente',     emoji: '💼' },
];

function s(nombre: string, duracion: number, precio?: number): Servicio {
  return { id: uid(), nombre, duracion, precio };
}

export const SERVICIOS_PRESET: Record<Rubro, Servicio[]> = {
  odontologia: [
    s('Consulta / revisión', 30), s('Limpieza dental', 45), s('Extracción simple', 30),
    s('Extracción compleja', 60), s('Ortodoncia — control', 20), s('Blanqueamiento', 60),
    s('Implante', 90), s('Endodoncia', 60),
  ],
  medicina: [
    s('Primera consulta', 30), s('Consulta / control', 20), s('Consulta domiciliaria', 40),
  ],
  psicologia: [
    s('Sesión individual', 50), s('Sesión de pareja', 60), s('Sesión familiar', 60),
    s('Primera entrevista', 60), s('Sesión grupal', 90),
  ],
  psicopedagogia: [
    s('Evaluación inicial', 60), s('Sesión de tratamiento', 45),
    s('Orientación a padres', 45), s('Informe escolar', 60),
  ],
  kinesiologia: [
    s('Evaluación kinésica', 45), s('Sesión de rehabilitación', 40),
    s('Masoterapia', 30), s('Drenaje linfático', 50),
  ],
  nutricion: [
    s('Primera consulta', 45), s('Control mensual', 30), s('Plan alimentario', 45),
  ],
  peluqueria: [
    s('Corte dama', 40), s('Corte caballero', 25), s('Coloración completa', 90),
    s('Mechas / balayage', 120), s('Keratina', 120), s('Peinado', 45),
  ],
  estetica: [
    s('Limpieza facial', 60), s('Mesoterapia facial', 45), s('Mesoterapia corporal', 60),
    s('Depilación zona pequeña', 20), s('Depilación zona grande', 40),
    s('Masajes relajantes', 60), s('Tratamiento reductivo', 60),
  ],
  otro: [s('Consulta / sesión', 30), s('Seguimiento', 20)],
};

export const CAMPO_RUBRO: Record<Rubro, { label: string; tipo: 'text' | 'select'; opciones?: string[] } | null> = {
  odontologia:    { label: 'Pieza / zona', tipo: 'text' },
  medicina:       { label: 'Diagnóstico / motivo', tipo: 'text' },
  psicologia:     { label: 'Tipo de sesión', tipo: 'select', opciones: ['Individual', 'Pareja', 'Familia', 'Grupo'] },
  psicopedagogia: { label: 'Institución / grado', tipo: 'text' },
  kinesiologia:   { label: 'Zona / articulación', tipo: 'text' },
  nutricion:      { label: 'Objetivo', tipo: 'select', opciones: ['Descenso de peso', 'Aumento de peso', 'Mantenimiento', 'Patología específica'] },
  peluqueria:     { label: 'Cabina / nota', tipo: 'text' },
  estetica:       { label: 'Zona de tratamiento', tipo: 'text' },
  otro:           null,
};

// ── Configuración ─────────────────────────────────────────────────────────────

export const defaultConfig: Configuracion = {
  nombreProfesional: '',
  especialidad: '',
  rubro: 'otro',
  horaInicio: '09:00',
  horaFin: '18:00',
  diasLaborables: [1, 2, 3, 4, 5],
  intervaloGrilla: 15,
  servicios: [],
  setupDone: false,
  apariencia: { accentColor: '#0CCEDD', darkColor: '#0D1117' },
  recetario: { matricula: '', domicilio: '', telefonoConsultorio: '', piePagina: '', tamanoHoja: 'A5' },
};

export function getConfig(): Configuracion {
  const stored = loadObj<Configuracion>(KEYS.config, defaultConfig);
  return { ...defaultConfig, ...stored, servicios: stored.servicios?.length ? stored.servicios : [] };
}
export function saveConfig(c: Configuracion) { localStorage.setItem(KEYS.config, JSON.stringify(c)); }

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function initSampleData(config: Configuracion) {
  if (getPacientes().length > 0) return;
  const now = new Date();
  const today     = now.toISOString().slice(0, 10);
  const tomorrow  = new Date(now.getTime() + 86400000).toISOString().slice(0, 10);
  const yesterday = new Date(now.getTime() - 86400000).toISOString().slice(0, 10);
  const prof = config.nombreProfesional || 'Profesional';
  const esp  = config.especialidad || config.rubro;

  const pacientes: Paciente[] = [
    { id: 'p1', nombre: 'María',  apellido: 'González', edad: 34, telefono: '1123456789', email: 'maria@email.com',  dni: '28123456', obraSocial: 'OSDE',          alergias: 'Penicilina', antecedentes: 'Hipertensión leve',  notasAdicionales: 'Prefiere mañanas', fechaRegistro: yesterday },
    { id: 'p2', nombre: 'Carlos', apellido: 'Rodríguez',edad: 45, telefono: '1134567890', email: 'carlos@email.com', dni: '20234567', obraSocial: 'Swiss Medical',  alergias: '',           antecedentes: 'Diabetes tipo 2',    notasAdicionales: '', fechaRegistro: yesterday },
    { id: 'p3', nombre: 'Laura',  apellido: 'Martínez', edad: 28, telefono: '1145678901', email: 'laura@email.com',  dni: '35345678', obraSocial: 'Galeno',         alergias: 'Ibuprofeno', antecedentes: '',                   notasAdicionales: 'Ansiosa con procedimientos', fechaRegistro: today },
    { id: 'p4', nombre: 'Jorge',  apellido: 'López',    edad: 52, telefono: '1156789012', email: 'jorge@email.com',  dni: '18456789', obraSocial: 'Sin cobertura',  alergias: '',           antecedentes: 'Fumador',            notasAdicionales: '', fechaRegistro: today },
    { id: 'p5', nombre: 'Ana',    apellido: 'Fernández',edad: 22, telefono: '1167890123', email: 'ana@email.com',    dni: '40567890', obraSocial: 'IOMA',           alergias: '',           antecedentes: '',                   notasAdicionales: 'Primera consulta', fechaRegistro: today },
  ];

  const servicios = config.servicios;
  const s0 = servicios[0];
  const s1 = servicios[1];

  const turnos: Turno[] = [
    { id: 't1', pacienteId: 'p1', fecha: today,     hora: '09:00', duracion: s0?.duracion||30, servicioId: s0?.id, motivo: s0?.nombre||'Consulta',  estado: 'confirmado', profesional: prof, especialidad: esp, createdAt: yesterday },
    { id: 't2', pacienteId: 'p2', fecha: today,     hora: '10:00', duracion: s1?.duracion||30, servicioId: s1?.id, motivo: s1?.nombre||'Control',   estado: 'pendiente',  profesional: prof, especialidad: esp, createdAt: yesterday },
    { id: 't3', pacienteId: 'p3', fecha: today,     hora: '11:30', duracion: s0?.duracion||30, servicioId: s0?.id, motivo: s0?.nombre||'Consulta',  estado: 'confirmado', profesional: prof, especialidad: esp, createdAt: today },
    { id: 't4', pacienteId: 'p4', fecha: today,     hora: '14:00', duracion: s0?.duracion||30, servicioId: s0?.id, motivo: s0?.nombre||'Consulta',  estado: 'pendiente',  profesional: prof, especialidad: esp, createdAt: today },
    { id: 't5', pacienteId: 'p5', fecha: tomorrow,  hora: '09:30', duracion: s0?.duracion||30, servicioId: s0?.id, motivo: 'Primera consulta',       estado: 'pendiente',  profesional: prof, especialidad: esp, createdAt: today },
    { id: 't6', pacienteId: 'p1', fecha: yesterday, hora: '10:00', duracion: s0?.duracion||30, servicioId: s0?.id, motivo: s0?.nombre||'Consulta',  estado: 'atendido',   profesional: prof, especialidad: esp, createdAt: yesterday },
    { id: 't7', pacienteId: 'p2', fecha: yesterday, hora: '15:00', duracion: s0?.duracion||30, servicioId: s0?.id, motivo: s0?.nombre||'Consulta',  estado: 'cancelado',  motivoCancelacion: 'Paciente no se presentó', profesional: prof, especialidad: esp, createdAt: yesterday },
  ];

  const consultas: Consulta[] = [
    { id: 'c1', pacienteId: 'p1', turnoId: 't6', fecha: yesterday, tratamiento: 'Revisión general. Sin novedades importantes.', notas: 'Continuar tratamiento', profesional: prof, proximaVisita: tomorrow },
    { id: 'c2', pacienteId: 'p2', fecha: yesterday, tratamiento: 'Control de rutina.', notas: 'Próximo control en 30 días', profesional: prof },
  ];

  savePacientes(pacientes);
  saveTurnos(turnos);
  saveConsultas(consultas);
}
