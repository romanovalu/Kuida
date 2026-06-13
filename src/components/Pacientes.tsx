import { useState } from 'react';
import type { Paciente, Configuracion, Odontograma, Medicion, NotaClinica, HistorialServicio, Receta } from '../types';
import { uid } from '../store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Search, AlertCircle, Pencil, ClipboardList, Trash2, BookUser, FileText, X } from 'lucide-react';
import FichaProfesional from './FichaProfesional';
import RecetasSection from './RecetaModal';

interface Props {
  pacientes: Paciente[];
  onSave: (p: Paciente) => void;
  onDelete: (id: string) => void;
  onVerHistorial: (p: Paciente) => void;
  config?: Configuracion;
  odontogramas?: Odontograma[];
  mediciones?: Medicion[];
  notasClinicas?: NotaClinica[];
  historialServicios?: HistorialServicio[];
  onSaveOdontograma?: (o: Odontograma) => void;
  onSaveMedicion?: (m: Medicion) => void;
  onDeleteMedicion?: (id: string) => void;
  onSaveNota?: (n: NotaClinica) => void;
  onDeleteNota?: (id: string) => void;
  onSaveServicioHist?: (h: HistorialServicio) => void;
  onDeleteServicioHist?: (id: string) => void;
  recetas?: Receta[];
  onSaveReceta?: (r: Receta) => void;
  onDeleteReceta?: (id: string) => void;
}

const emptyForm = (): Omit<Paciente, 'id' | 'fechaRegistro'> => ({
  nombre: '', apellido: '', edad: 0, telefono: '', email: '',
  dni: '', obraSocial: '', alergias: '', antecedentes: '', notasAdicionales: '',
});

const RUBROS_CON_FICHA = ['odontologia','medicina','psicologia','psicopedagogia','kinesiologia','nutricion','peluqueria','estetica','otro'];
const RUBROS_CON_RECETA = ['odontologia','medicina','psicologia','psicopedagogia','kinesiologia'];
const RUBROS_CLIENTE = ['peluqueria','estetica','otro'];

function terminologia(rubro?: string) {
  const esCliente = rubro && RUBROS_CLIENTE.includes(rubro);
  return {
    singular: esCliente ? 'cliente' : 'paciente',
    plural:   esCliente ? 'clientes' : 'pacientes',
    titulo:   esCliente ? 'Clientes' : 'Pacientes',
    ficha:    esCliente ? 'Ficha cliente' : 'Ficha prof.',
    nuevo:    esCliente ? 'Nuevo cliente' : 'Nuevo paciente',
    sinRegistros: esCliente ? 'No hay clientes registrados' : 'No hay pacientes registrados',
  };
}

export default function Pacientes({ pacientes, onSave, onDelete, onVerHistorial, config, odontogramas = [], mediciones = [], notasClinicas = [], historialServicios = [], recetas = [], onSaveOdontograma, onSaveMedicion, onDeleteMedicion, onSaveNota, onDeleteNota, onSaveServicioHist, onDeleteServicioHist, onSaveReceta, onDeleteReceta }: Props) {
  const [busqueda, setBusqueda] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editPaciente, setEditPaciente] = useState<Paciente | null>(null);
  const [verDetalle, setVerDetalle] = useState<Paciente | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Paciente | null>(null);
  const [fichaP, setFichaP] = useState<Paciente | null>(null);
  const [recetaP, setRecetaP] = useState<Paciente | null>(null);

  const t = terminologia(config?.rubro);
  const showFichaBtn = config && RUBROS_CON_FICHA.includes(config.rubro);
  const showRecetaBtn = config && RUBROS_CON_RECETA.includes(config.rubro);

  const filtrados = pacientes.filter(p =>
    `${p.nombre} ${p.apellido} ${p.dni} ${p.telefono}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  const iniciales = (p: Paciente) => `${p.nombre.charAt(0) || '?'}${p.apellido.charAt(0) || ''}`.toUpperCase();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--dark)' }}>{t.titulo}</h1>
        <button
          onClick={() => { setEditPaciente(null); setShowForm(true); }}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-full transition-opacity hover:opacity-90"
          style={{ background: 'var(--cyan)', color: 'var(--dark)' }}
        >
          <Plus size={13} /> Nuevo
        </button>
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Buscar por nombre, DNI o teléfono..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="pl-9 rounded-full border-gray-200 bg-white shadow-sm"
        />
      </div>

      <p className="text-xs font-medium text-gray-400">{filtrados.length} {filtrados.length !== 1 ? t.plural : t.singular}</p>

      {filtrados.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border-2 border-dashed" style={{ borderColor: 'var(--cyan-mid)', background: 'var(--cyan-light)' }}>
          <p className="text-sm font-medium" style={{ color: 'var(--cyan-dark)' }}>
            {busqueda ? 'Sin resultados' : t.sinRegistros}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          {filtrados.map((p, i) => (
            <div key={p.id} className="px-5 py-3.5" style={{ borderTop: i > 0 ? '1px solid #F3F4F6' : 'none' }}>
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: 'var(--cyan-light)', color: 'var(--cyan-dark)' }}
                >
                  {iniciales(p)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold" style={{ color: 'var(--dark)' }}>{p.nombre} {p.apellido}</p>
                    {p.alergias && <AlertCircle size={12} style={{ color: '#F59E0B' }} className="flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-gray-400">{p.edad ? `${p.edad} años · ` : ''}{p.telefono}</p>
                </div>
              </div>
              <div className="flex gap-1.5 mt-2.5 flex-wrap">
                <Chip label="Ver detalle" onClick={() => setVerDetalle(p)} />
                <Chip label="Editar" icon={<Pencil size={11} />} onClick={() => { setEditPaciente(p); setShowForm(true); }} />
                <Chip label="Historial" icon={<ClipboardList size={11} />} onClick={() => onVerHistorial(p)} />
                {showRecetaBtn && <Chip label="Receta" icon={<FileText size={11} />} onClick={() => setRecetaP(p)} color="cyan" />}
                {showFichaBtn && <Chip label={t.ficha} icon={<BookUser size={11} />} onClick={() => setFichaP(p)} />}
                <Chip label="" icon={<Trash2 size={11} />} onClick={() => setConfirmDelete(p)} color="red" />
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <FormPaciente paciente={editPaciente} onSave={p => { onSave(p); setShowForm(false); }} onClose={() => setShowForm(false)} rubro={config?.rubro} />
      )}

      {verDetalle && (
        <Dialog open onOpenChange={() => setVerDetalle(null)}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold">
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: 'var(--cyan-light)', color: 'var(--cyan-dark)' }}
                >
                  {iniciales(verDetalle)}
                </span>
                {verDetalle.nombre} {verDetalle.apellido}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-1.5">
              {verDetalle.edad > 0 && <InfoRow label="Edad" value={`${verDetalle.edad} años`} />}
              <InfoRow label="Teléfono" value={verDetalle.telefono} />
              <InfoRow label="Email" value={verDetalle.email} />
              {!t.plural.includes('cliente') && <>
                <InfoRow label="DNI" value={verDetalle.dni} />
                <InfoRow label="Obra social" value={verDetalle.obraSocial || 'Sin cobertura'} />
              </>}
              {verDetalle.alergias && (
                <InfoRow
                  label={config?.rubro === 'peluqueria' ? 'Alergias a productos' : config?.rubro === 'estetica' ? 'Sensibilidades cutáneas' : 'Alergias'}
                  value={verDetalle.alergias} accent
                />
              )}
              {verDetalle.antecedentes && (
                <InfoRow
                  label={config?.rubro === 'peluqueria' ? 'Preferencias' : config?.rubro === 'estetica' ? 'Historial de tratamientos' : 'Antecedentes'}
                  value={verDetalle.antecedentes}
                />
              )}
              {verDetalle.notasAdicionales && <InfoRow label="Notas" value={verDetalle.notasAdicionales} />}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {recetaP && config && onSaveReceta && onDeleteReceta && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl w-full max-w-lg flex flex-col" style={{ maxHeight: '92vh' }}>
            <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100 flex-shrink-0">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--cyan-dark)' }}>Recetas / Indicaciones</p>
                <p className="text-base font-extrabold" style={{ color: 'var(--dark)' }}>{recetaP.nombre} {recetaP.apellido}</p>
              </div>
              <button onClick={() => setRecetaP(null)} className="p-2 rounded-xl text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <RecetasSection
                paciente={recetaP}
                config={config}
                recetas={recetas}
                onSave={onSaveReceta}
                onDelete={onDeleteReceta}
              />
            </div>
          </div>
        </div>
      )}

      {fichaP && config && onSaveOdontograma && onSaveMedicion && onDeleteMedicion && onSaveNota && onDeleteNota && onSaveServicioHist && onDeleteServicioHist && onSaveReceta && onDeleteReceta && (
        <FichaProfesional
          paciente={fichaP} config={config}
          odontogramas={odontogramas} mediciones={mediciones} notasClinicas={notasClinicas} historialServicios={historialServicios} recetas={recetas}
          onSaveOdontograma={onSaveOdontograma} onSaveMedicion={onSaveMedicion} onDeleteMedicion={onDeleteMedicion}
          onSaveNota={onSaveNota} onDeleteNota={onDeleteNota} onSaveServicioHist={onSaveServicioHist} onDeleteServicioHist={onDeleteServicioHist}
          onSaveReceta={onSaveReceta} onDeleteReceta={onDeleteReceta}
          onClose={() => setFichaP(null)}
        />
      )}

      {confirmDelete && (
        <Dialog open onOpenChange={() => setConfirmDelete(null)}>
          <DialogContent className="max-w-sm rounded-2xl">
            <DialogHeader><DialogTitle className="text-base font-bold">Eliminar paciente</DialogTitle></DialogHeader>
            <p className="text-sm text-gray-500">
              ¿Eliminar a <span className="font-semibold" style={{ color: 'var(--dark)' }}>{confirmDelete.nombre} {confirmDelete.apellido}</span>? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2 justify-end mt-3">
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
              <Button size="sm" className="rounded-full bg-red-500 hover:bg-red-600" onClick={() => { onDelete(confirmDelete.id); setConfirmDelete(null); }}>Eliminar</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function Chip({ label, onClick, icon, color = 'default' }: { label: string; onClick: () => void; icon?: React.ReactNode; color?: string }) {
  const styles: Record<string, { bg: string; text: string }> = {
    default: { bg: '#F3F4F6', text: '#374151' },
    red:     { bg: '#FFF1F2', text: '#BE123C' },
    cyan:    { bg: 'var(--cyan-light)', text: 'var(--cyan-dark)' },
  };
  const s = styles[color] || styles.default;
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-full transition-opacity hover:opacity-80"
      style={{ background: s.bg, color: s.text }}
    >
      {icon}{label}
    </button>
  );
}

function InfoRow({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  if (!value) return null;
  return (
    <div
      className="flex gap-3 px-3 py-2 rounded-xl text-sm"
      style={accent ? { background: '#FFFBEB' } : { background: '#F9FAFB' }}
    >
      <span className="text-xs font-bold min-w-[90px]" style={{ color: accent ? '#D97706' : '#9CA3AF' }}>{label}</span>
      <span className="text-xs" style={{ color: accent ? '#92400E' : 'var(--dark)', fontWeight: accent ? 600 : 400 }}>{value}</span>
    </div>
  );
}

interface FormProps { paciente: Paciente | null; onSave: (p: Paciente) => void; onClose: () => void; rubro?: string; }

export function FormPaciente({ paciente, onSave, onClose, rubro }: FormProps) {
  const [form, setForm] = useState(paciente ? { ...paciente } : { ...emptyForm(), id: '', fechaRegistro: '' });
  const [error, setError] = useState('');
  const set = (k: keyof typeof form, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  const esCliente = rubro && ['peluqueria', 'estetica', 'otro'].includes(rubro);
  const esPeluqueria = rubro === 'peluqueria';
  const esEstetica = rubro === 'estetica';
  const titulo = esCliente
    ? (paciente ? 'Editar cliente' : 'Nuevo cliente')
    : (paciente ? 'Editar paciente' : 'Nuevo paciente');

  const guardar = () => {
    if (!form.nombre.trim() || !form.apellido.trim()) { setError('Nombre y apellido son obligatorios'); return; }
    if (!form.telefono.trim()) { setError('El teléfono es obligatorio'); return; }
    setError('');
    onSave({ ...form, id: paciente?.id || uid(), fechaRegistro: paciente?.fechaRegistro || new Date().toISOString().slice(0, 10), edad: form.edad ? Number(form.edad) : 0 });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader><DialogTitle className="text-base font-bold">{titulo}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nombre *"><Input value={form.nombre} onChange={e => set('nombre', e.target.value)} className="rounded-xl border-gray-200" /></Field>
            <Field label="Apellido *"><Input value={form.apellido} onChange={e => set('apellido', e.target.value)} className="rounded-xl border-gray-200" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Teléfono *"><Input value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="11XXXXXXXX" className="rounded-xl border-gray-200" /></Field>
            <Field label="Email"><Input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="rounded-xl border-gray-200" /></Field>
          </div>

          {/* Campos según rubro */}
          {!esCliente && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="DNI"><Input value={form.dni} onChange={e => set('dni', e.target.value)} className="rounded-xl border-gray-200" /></Field>
                <Field label="Edad"><Input type="number" value={form.edad || ''} onChange={e => set('edad', e.target.value)} className="rounded-xl border-gray-200" /></Field>
              </div>
              <Field label="Obra social"><Input value={form.obraSocial} onChange={e => set('obraSocial', e.target.value)} className="rounded-xl border-gray-200" /></Field>
              <Field label="Alergias">
                <Input value={form.alergias} onChange={e => set('alergias', e.target.value)} placeholder="Ej: Penicilina, Ibuprofeno..." className="rounded-xl border-amber-200 bg-amber-50/40" />
              </Field>
              <Field label="Antecedentes médicos">
                <Textarea value={form.antecedentes} onChange={e => set('antecedentes', e.target.value)} rows={2} className="rounded-xl border-gray-200 resize-none" />
              </Field>
            </>
          )}

          {esCliente && (
            <>
              <Field label="Edad (opcional)">
                <Input type="number" value={form.edad || ''} onChange={e => set('edad', e.target.value)} className="rounded-xl border-gray-200" />
              </Field>
              {(esPeluqueria) && (
                <Field label="Alergias / reacciones a productos">
                  <Input value={form.alergias} onChange={e => set('alergias', e.target.value)} placeholder="Ej: amoniaco, keratina..." className="rounded-xl border-amber-200 bg-amber-50/40" />
                </Field>
              )}
              {(esEstetica) && (
                <Field label="Alergias / sensibilidades cutáneas">
                  <Input value={form.alergias} onChange={e => set('alergias', e.target.value)} placeholder="Ej: fragancias, latex, productos específicos..." className="rounded-xl border-amber-200 bg-amber-50/40" />
                </Field>
              )}
              <Field label={esPeluqueria ? 'Preferencias y características' : esEstetica ? 'Historial de tratamientos / observaciones' : 'Notas'}>
                <Textarea value={form.antecedentes} onChange={e => set('antecedentes', e.target.value)}
                  placeholder={esPeluqueria ? 'Tipo de cabello, coloraciones previas, técnicas preferidas...' : esEstetica ? 'Tratamientos previos, tipo de piel, objetivos...' : ''}
                  rows={2} className="rounded-xl border-gray-200 resize-none" />
              </Field>
            </>
          )}

          <Field label="Notas adicionales">
            <Textarea value={form.notasAdicionales} onChange={e => set('notasAdicionales', e.target.value)}
              placeholder={esCliente ? 'Preferencias de día/hora, cómo nos conoció...' : ''}
              rows={2} className="rounded-xl border-gray-200 resize-none" />
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}
