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
  accentColor: string;   // hex, e.g. #0CCEDD
  darkColor: string;     // hex, e.g. #0D1117
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

// Odontograma
export type TratamientoCara = '' | 'caries' | 'restauracion' | 'corona' | 'fractura' | 'sellador' | 'endodoncia';
export interface DienteEstado {
  ausente?: boolean;
  implante?: boolean;
  caras: Partial<Record<'oclusal' | 'vestibular' | 'lingual' | 'mesial' | 'distal', TratamientoCara>>;
  nota?: string;
}
export interface Odontograma {
  pacienteId: string;
  dientes: Record<string, DienteEstado>;
  notas: string;
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
