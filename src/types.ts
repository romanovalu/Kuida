export type EstadoTurno = 'pendiente' | 'confirmado' | 'atendido' | 'cancelado';

export type Rubro =
  | 'odontologia' | 'medicina' | 'psicologia' | 'psicopedagogia'
  | 'kinesiologia' | 'nutricion' | 'peluqueria' | 'estetica' | 'otro';

export interface Servicio {
  id: string;
  nombre: string;
  duracion: number;
  precio?: number;
}

export interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  edad: number;
  telefono: string;
  email: string;
  dni: string;
  obraSocial: string;
  alergias: string;
  antecedentes: string;
  notasAdicionales: string;
  fechaRegistro: string;
}

export interface Turno {
  id: string;
  pacienteId: string;
  fecha: string;
  hora: string;
  duracion: number;
  servicioId?: string;
  motivo: string;
  campoRubro?: string;
  estado: EstadoTurno;
  motivoCancelacion?: string;
  profesional: string;
  especialidad: string;
  createdAt: string;
}

export interface Consulta {
  id: string;
  pacienteId: string;
  turnoId?: string;
  fecha: string;
  tratamiento: string;
  notas: string;
  profesional: string;
  proximaVisita?: string;
}

export interface HorarioBloqueado {
  id: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  motivo: string;
}

export interface ConfigApariencia {
  accentColor: string;
  darkColor: string;
  tema?: 'oscuro' | 'claro';
}

export interface ConfigRecetario {
  matricula: string;
  domicilio: string;
  telefonoConsultorio: string;
  piePagina: string;       // texto legal / firma
  tamanoHoja: 'A4' | 'A5';
}

export interface Configuracion {
  nombreProfesional: string;
  especialidad: string;
  rubro: Rubro;
  horaInicio: string;
  horaFin: string;
  diasLaborables: number[];
  servicios: Servicio[];
  intervaloGrilla: number;
  setupDone?: boolean;
  apariencia?: ConfigApariencia;
  recetario?: ConfigRecetario;
}

// ── Recetas ──────────────────────────────────────────────────────────────────

export interface Receta {
  id: string;
  pacienteId: string;
  fecha: string;
  diagnostico?: string;
  medicamentos: string;    // texto libre, uno por línea
  indicaciones?: string;
  createdAt: string;
}

// ── Finanzas ─────────────────────────────────────────────────────────────────

export type MetodoPago = 'efectivo' | 'transferencia' | 'debito' | 'credito' | 'cheque' | 'otro';
export type TipoComprobante = 'factura_a' | 'factura_b' | 'factura_c' | 'recibo' | 'ticket' | 'ninguno';
export type CategoriaGasto =
  | 'alquiler' | 'materiales' | 'servicios_basicos' | 'equipamiento'
  | 'honorarios' | 'impuestos' | 'marketing' | 'otros';

export interface Cobro {
  id: string;
  fecha: string;
  concepto: string;
  monto: number;
  metodoPago: MetodoPago;
  pacienteId?: string;
  turnoId?: string;
  tipoComprobante: TipoComprobante;
  nroComprobante?: string;
  notas?: string;
  createdAt: string;
}

export interface Gasto {
  id: string;
  fecha: string;
  concepto: string;
  categoria: CategoriaGasto;
  monto: number;
  pacienteId?: string;
  proveedor?: string;
  nroComprobante?: string;
  notas?: string;
  createdAt: string;
}

// ── Herramientas profesionales ───────────────────────────────────────────────

// Odontograma (sistema oficial Colegio de Odontólogos de Córdoba)
export type CaraColor = '' | 'existente' | 'requerida';
export type TipoTooth = 'normal' | 'ausente' | 'protesis_fija' | 'protesis_removible' | 'corona';
export type TratamientoCara = CaraColor; // alias de compatibilidad
export interface DienteEstado {
  tipo?: TipoTooth;
  caras: Partial<Record<'oclusal' | 'vestibular' | 'lingual' | 'mesial' | 'distal', CaraColor>>;
  // legacy fields kept for backward compat with existing Supabase data
  ausente?: boolean;
}
export interface Odontograma {
  pacienteId: string;
  dientes: Record<string, DienteEstado>;
  notas: string;
  sarro?: boolean | null;
  enfermedadPeriodontal?: boolean | null;
  updatedAt: string;
}

// Mediciones antropométricas (nutrición, kinesiología)
export interface Medicion {
  id: string;
  pacienteId: string;
  fecha: string;
  peso?: number;      // kg
  talla?: number;     // cm
  imc?: number;
  cintura?: number;   // cm
  cadera?: number;
  brazo?: number;
  muslo?: number;
  presionSis?: number;
  presionDia?: number;
  glucemia?: number;
  notas?: string;
}

// Nota clínica genérica (psicología, medicina, kinesiología)
export interface NotaClinica {
  id: string;
  pacienteId: string;
  fecha: string;
  tipo: 'sesion' | 'evolucion' | 'evaluacion' | 'informe' | 'soap';
  contenido: string;    // texto libre o JSON según tipo
  privada?: boolean;
  createdAt: string;
}

// Historia Clínica Odontológica (Colegio de Odontólogos de Córdoba)
export type SiNo = true | false | null;

export interface HCAnt {
  padreVida: SiNo; padreEnf: string;
  madreVida: SiNo; madreEnf: string;
  hermanos: SiNo; hermSanos: string;
  enfermedad: SiNo; enfermedadCual: string;
  tratMedico: SiNo; tratCual: string;
  medicHabitual: string; medic5anos: string;
  deporte: SiNo; malDeporte: SiNo;
  alergiaDroga: SiNo; alAnestesia: SiNo; alPenicilina: SiNo; alOtros: string;
  cicatrizacion: string;
  colageno: SiNo;
  fiebreReumatica: SiNo; medFR: string;
  diabetico: SiNo; diabControl: string;
  cardiaco: SiNo; cardiacoCual: string;
  aspirina: SiNo; aspirinFrec: string;
  presionAlta: SiNo;
  chagas: SiNo; chagasTrat: string;
  renales: SiNo;
  ulcera: SiNo;
  hepatitis: SiNo; hepatTipo: string;
  hepatico: SiNo; hepaticoCual: string;
  convulsiones: SiNo;
  epileptico: SiNo; epilepMed: string;
  sifilis: SiNo;
  infecciosa: SiNo;
  transfusiones: SiNo;
  operado: SiNo; operadoCual: string; operadoCuando: string;
  respiratorio: SiNo; respirCual: string;
  fuma: SiNo;
  embarazada: SiNo; embMeses: string;
  otraEnf: SiNo; otraEnfCual: string;
  tratAlternativo: string;
  medicoCabecera: string;
  hospitalDerivacion: string;
}

export interface HCOdonto {
  motivo: string;
  consultoProfesional: SiNo;
  tomoMed: SiNo; medNombre: string; desde: string; resultados: SiNo;
  dolor: SiNo;
  dSuave: boolean; dModerado: boolean; dIntenso: boolean;
  dTemporario: boolean; dIntermitente: boolean; dContinuo: boolean;
  dEspontaneo: boolean; dProvocado: boolean; dFrio: boolean; dCalor: boolean;
  dLocalizado: boolean; dLocDonde: string;
  dIrradiado: boolean; dIrrHacia: string;
  dCalmar: string;
  golpe: SiNo; golpeCuando: string; golpeComo: string;
  fractura: SiNo; fracturaCual: string; fracturaTrat: string;
  difHablar: string; difMasticar: string; difAbrir: string; difTragar: string;
  labios: string; lengua: string; paladar: string; pisoBoca: string;
  carrillos: string; rebordes: string; trigono: string; retromolar: string;
  manchas: SiNo; abultamiento: SiNo; ulceraciones: SiNo; ampollas: SiNo; otrasLesiones: string;
  sangradoEncias: SiNo; sangradoCuando: string;
  pus: SiNo; pusDonde: string;
  movilidad: SiNo; altos: string;
  hinchada: SiNo; hinchadaQue: string;
  azucar: string; placa: string;
  higiene: '' | 'muy_bueno' | 'bueno' | 'deficiente' | 'malo';
}

export interface HCDiag {
  sarro: SiNo;
  periodontal: SiNo;
  diagnostico: string;
  plan: string;
  planFecha: string;
  observaciones: string;
  estudios: string;
  continuaAnexo: string;
}

export interface HistoriaClinica {
  id: string;
  pacienteId: string;
  tipo: 'general' | 'pcd';
  fecha: string;
  lugar: string;
  nroAfil: string;
  ant: HCAnt;
  hco: HCOdonto;
  diag: HCDiag;
  createdAt: string;
  updatedAt: string;
}

// Historial de servicios (peluquería, estética)
export interface HistorialServicio {
  id: string;
  pacienteId: string;
  fecha: string;
  servicio: string;
  detalles: string;   // fórmula de color, zona tratada, producto, etc.
  resultado?: string;
  proximaVisita?: string;
  createdAt: string;
}
