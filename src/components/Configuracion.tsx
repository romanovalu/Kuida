import { useState, useRef, useEffect } from 'react';
import type { Configuracion as Config, Servicio, Rubro, ConfigApariencia } from '../types';
import { RUBROS, SERVICIOS_PRESET, uid, applyTheme, saveLogoApp, getLogoApp, saveLogoReceta, getLogoReceta } from '../store';
import { getBookingLink, saveBookingLink, type BookingLink } from '../lib/db';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, Plus, Trash2, Pencil, X, RefreshCw, Upload, Image, Link, Copy } from 'lucide-react';

const RUBROS_SALUD = ['odontologia','medicina','psicologia','psicopedagogia','kinesiologia','nutricion'];

const PALETAS: { name: string; accent: string; dark: string }[] = [
  { name: 'Cian',     accent: '#0CCEDD', dark: '#0D1117' },
  { name: 'Violeta',  accent: '#8B5CF6', dark: '#0F0A1E' },
  { name: 'Esmeralda',accent: '#10B981', dark: '#0A1F18' },
  { name: 'Rosa',     accent: '#F43F5E', dark: '#1F0A12' },
  { name: 'Naranja',  accent: '#F97316', dark: '#1F1205' },
  { name: 'Azul',     accent: '#3B82F6', dark: '#0A0F1F' },
  { name: 'Dorado',   accent: '#F59E0B', dark: '#1A1200' },
  { name: 'Gris',     accent: '#64748B', dark: '#0F172A' },
];

interface Props { config: Config; onSave: (c: Config) => void; onResetSetup?: () => void; }

const DIAS = [
  { value: 0, label: 'Dom', full: 'Domingo' },
  { value: 1, label: 'Lun', full: 'Lunes' },
  { value: 2, label: 'Mar', full: 'Martes' },
  { value: 3, label: 'Mié', full: 'Miércoles' },
  { value: 4, label: 'Jue', full: 'Jueves' },
  { value: 5, label: 'Vie', full: 'Viernes' },
  { value: 6, label: 'Sáb', full: 'Sábado' },
];

export default function Configuracion({ config, onSave, onResetSetup }: Props) {
  const [form, setForm] = useState({
    ...config,
    apariencia: config.apariencia || { accentColor: '#0CCEDD', darkColor: '#0D1117' },
    recetario: config.recetario || { matricula: '', domicilio: '', telefonoConsultorio: '', piePagina: '', tamanoHoja: 'A5' as const },
  });
  const [saved, setSaved] = useState(false);
  const [editServicio, setEditServicio] = useState<Servicio | null>(null);
  const [showServicioForm, setShowServicioForm] = useState(false);
  const [logoApp, setLogoApp] = useState(getLogoApp());
  const [logoReceta, setLogoReceta] = useState(getLogoReceta());
  const [bookingLink, setBookingLink] = useState<BookingLink>({ slug: '', activo: false, mensaje: '' });
  const [linkCopied, setLinkCopied] = useState(false);
  const [linkSaved, setLinkSaved] = useState(false);

  useEffect(() => {
    getBookingLink().then(l => { if (l) setBookingLink(l); });
  }, []);

  const toSlug = (name: string) => name.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleSaveLink = async () => {
    await saveBookingLink(bookingLink);
    setLinkSaved(true);
    setTimeout(() => setLinkSaved(false), 2500);
  };

  const publicUrl = `https://www.kuida.com.ar/reservar/${bookingLink.slug}`;
  const logoAppRef = useRef<HTMLInputElement>(null);
  const logoRecetaRef = useRef<HTMLInputElement>(null);

  const toggleDia = (d: number) => {
    setForm(f => ({
      ...f,
      diasLaborables: f.diasLaborables.includes(d)
        ? f.diasLaborables.filter(x => x !== d)
        : [...f.diasLaborables, d].sort(),
    }));
  };

  const handleRubroChange = (rubro: Rubro) => {
    setForm(f => ({ ...f, rubro, servicios: SERVICIOS_PRESET[rubro] }));
  };

  const setApariencia = (partial: Partial<ConfigApariencia>) => {
    const next = { ...form.apariencia, ...partial };
    setForm(f => ({ ...f, apariencia: next }));
    applyTheme(next.accentColor, next.darkColor);
  };

  const handleLogoUpload = (file: File, tipo: 'app' | 'receta') => {
    const reader = new FileReader();
    reader.onload = e => {
      const url = e.target?.result as string;
      if (tipo === 'app') { saveLogoApp(url); setLogoApp(url); }
      else { saveLogoReceta(url); setLogoReceta(url); }
    };
    reader.readAsDataURL(file);
  };

  const guardar = () => {
    onSave(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const saveServicio = (s: Servicio) => {
    setForm(f => ({
      ...f,
      servicios: editServicio
        ? f.servicios.map(x => x.id === s.id ? s : x)
        : [...f.servicios, s],
    }));
    setShowServicioForm(false);
    setEditServicio(null);
  };

  const deleteServicio = (id: string) => {
    setForm(f => ({ ...f, servicios: f.servicios.filter(s => s.id !== id) }));
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl px-5 py-5" style={{ background: 'var(--dark)' }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--cyan)' }}>Ajustes</p>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Configuración</h1>
      </div>

      {/* Rubro */}
      <Section title="Rubro profesional">
        <p className="text-xs text-gray-400 mb-3">Al cambiar el rubro se cargan servicios predefinidos típicos. Podés editarlos libremente después.</p>
        <Select value={form.rubro} onValueChange={v => handleRubroChange(v as Rubro)}>
          <SelectTrigger className="rounded-xl border-gray-200"><SelectValue /></SelectTrigger>
          <SelectContent>
            {RUBROS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </Section>

      {/* Perfil */}
      <Section title="Perfil profesional">
        <div className="space-y-3">
          <Field label="Nombre completo">
            <Input value={form.nombreProfesional} onChange={e => setForm(f => ({ ...f, nombreProfesional: e.target.value }))} className="rounded-xl border-gray-200" />
          </Field>
          <Field label="Especialidad / descripción">
            <Input value={form.especialidad} onChange={e => setForm(f => ({ ...f, especialidad: e.target.value }))} placeholder="Ej: Psicología cognitiva, Peluquería artística..." className="rounded-xl border-gray-200" />
          </Field>
        </div>
      </Section>

      {/* Servicios */}
      <Section title={`Servicios (${form.servicios.length})`}>
        <p className="text-xs text-gray-400 mb-3">
          Cada servicio tiene su propia duración. Al crear un turno elegís el servicio y la app calcula los horarios disponibles automáticamente.
        </p>
        <div className="space-y-1.5 mb-3">
          {form.servicios.map(s => (
            <div key={s.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: 'var(--cyan-light)' }}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--dark)' }}>{s.nombre}</p>
                <p className="text-xs" style={{ color: 'var(--cyan-dark)' }}>
                  {s.duracion >= 60
                    ? `${Math.floor(s.duracion / 60)}h${s.duracion % 60 > 0 ? ` ${s.duracion % 60}min` : ''}`
                    : `${s.duracion} min`}
                  {s.precio ? ` · $${s.precio.toLocaleString('es-AR')}` : ''}
                </p>
              </div>
              <button onClick={() => { setEditServicio(s); setShowServicioForm(true); }} className="p-1.5 rounded-lg hover:bg-white/60 transition-colors" style={{ color: 'var(--cyan-dark)' }}>
                <Pencil size={13} />
              </button>
              <button onClick={() => deleteServicio(s.id)} className="p-1.5 rounded-lg hover:bg-red-100 transition-colors text-red-400">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          {form.servicios.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-4">Sin servicios. Agregá el primero.</p>
          )}
        </div>
        <button
          onClick={() => { setEditServicio(null); setShowServicioForm(true); }}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed text-sm font-bold transition-colors"
          style={{ borderColor: 'var(--cyan-mid)', color: 'var(--cyan-dark)' }}
        >
          <Plus size={15} /> Agregar servicio
        </button>
      </Section>

      {/* Horarios */}
      <Section title="Horario de atención">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Apertura">
              <Input type="time" value={form.horaInicio} onChange={e => setForm(f => ({ ...f, horaInicio: e.target.value }))} className="rounded-xl border-gray-200" />
            </Field>
            <Field label="Cierre">
              <Input type="time" value={form.horaFin} onChange={e => setForm(f => ({ ...f, horaFin: e.target.value }))} className="rounded-xl border-gray-200" />
            </Field>
          </div>
          <Field label="Intervalo de grilla (minutos)">
            <Input type="number" min={5} max={60} step={5} value={form.intervaloGrilla} onChange={e => setForm(f => ({ ...f, intervaloGrilla: Number(e.target.value) }))} className="rounded-xl border-gray-200" />
            <p className="text-[11px] text-gray-400 mt-1">
              Cada cuántos minutos aparece un horario en la agenda (ej: 15 → 9:00, 9:15, 9:30…)
            </p>
          </Field>
        </div>
      </Section>

      {/* Días */}
      <Section title="Días de atención">
        <div className="flex gap-2 flex-wrap">
          {DIAS.map(({ value, label }) => {
            const activo = form.diasLaborables.includes(value);
            return (
              <button key={value} onClick={() => toggleDia(value)} className="w-12 h-12 rounded-2xl text-xs font-bold transition-all"
                style={activo ? { background: 'var(--cyan)', color: 'var(--dark)' } : { background: '#F3F4F6', color: '#9CA3AF' }}>
                {label}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {form.diasLaborables.length === 0 ? 'Ningún día seleccionado' : form.diasLaborables.map(d => DIAS[d].full).join(' · ')}
        </p>
      </Section>

      {/* ── Apariencia ── */}
      <Section title="Apariencia">
        <div className="space-y-4">
          {/* Logo */}
          <div>
            <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Logo de la app</Label>
            <div className="flex items-center gap-3">
              {logoApp
                ? <img src={logoApp} alt="Logo" className="w-14 h-14 object-contain rounded-xl border border-gray-100" />
                : <div className="w-14 h-14 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center"><Image size={20} className="text-gray-300" /></div>
              }
              <div className="space-y-1.5">
                <button onClick={() => logoAppRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-gray-300">
                  <Upload size={12} /> {logoApp ? 'Cambiar logo' : 'Subir logo'}
                </button>
                {logoApp && <button onClick={() => { saveLogoApp(''); setLogoApp(''); }} className="text-[11px] text-red-400 font-medium">Quitar logo</button>}
              </div>
              <input ref={logoAppRef} type="file" accept="image/*" className="hidden"
                onChange={e => e.target.files?.[0] && handleLogoUpload(e.target.files[0], 'app')} />
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5">Aparece en la barra lateral. Se guarda en tu dispositivo (no se sube a ningún servidor).</p>
          </div>

          {/* Colores */}
          <div>
            <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Color de acento</Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {PALETAS.map(p => {
                const active = form.apariencia.accentColor === p.accent;
                return (
                  <button key={p.name} onClick={() => setApariencia({ accentColor: p.accent, darkColor: p.dark })}
                    title={p.name}
                    className="w-8 h-8 rounded-full border-2 transition-all"
                    style={{ background: p.accent, borderColor: active ? 'var(--dark)' : 'transparent', transform: active ? 'scale(1.2)' : 'scale(1)' }} />
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Color personalizado</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.apariencia.accentColor}
                    onChange={e => setApariencia({ accentColor: e.target.value })}
                    className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                  <span className="text-xs font-mono text-gray-500">{form.apariencia.accentColor}</span>
                </div>
              </div>
              <div>
                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Color de barra lateral</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.apariencia.darkColor}
                    onChange={e => setApariencia({ darkColor: e.target.value })}
                    className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                  <span className="text-xs font-mono text-gray-500">{form.apariencia.darkColor}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-xl overflow-hidden border border-gray-100">
            <div className="px-4 py-3 flex items-center gap-3" style={{ background: form.apariencia.darkColor }}>
              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black" style={{ background: form.apariencia.accentColor, color: form.apariencia.darkColor }}>G</div>
              <span className="text-xs font-bold text-white">GestiónTurnos</span>
              <div className="ml-auto px-2.5 py-1 rounded-full text-[10px] font-bold" style={{ background: form.apariencia.accentColor, color: form.apariencia.darkColor }}>Activo</div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Recetario ── */}
      {RUBROS_SALUD.includes(form.rubro) && (
        <Section title="Datos del recetario">
          <p className="text-xs text-gray-400 mb-3">Estos datos aparecen en el encabezado de cada receta al imprimir.</p>
          <div className="space-y-3">
            {/* Logo receta */}
            <div>
              <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Logo en receta</Label>
              <div className="flex items-center gap-3">
                {logoReceta
                  ? <img src={logoReceta} alt="Logo receta" className="w-12 h-12 object-contain rounded-xl border border-gray-100" />
                  : <div className="w-12 h-12 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center"><Image size={16} className="text-gray-300" /></div>
                }
                <div className="space-y-1">
                  <button onClick={() => logoRecetaRef.current?.click()}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border border-gray-200 text-gray-600">
                    <Upload size={11} /> {logoReceta ? 'Cambiar' : 'Subir logo'}
                  </button>
                  {logoReceta && <button onClick={() => { saveLogoReceta(''); setLogoReceta(''); }} className="text-[11px] text-red-400 font-medium block">Quitar</button>}
                </div>
                <input ref={logoRecetaRef} type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files?.[0] && handleLogoUpload(e.target.files[0], 'receta')} />
              </div>
            </div>

            <Field label="Matrícula / N° de registro">
              <Input value={form.recetario.matricula} onChange={e => setForm(f => ({ ...f, recetario: { ...f.recetario, matricula: e.target.value } }))}
                placeholder="Ej: MN 123456 / MP 98765" className="rounded-xl border-gray-200" />
            </Field>
            <Field label="Domicilio del consultorio">
              <Input value={form.recetario.domicilio} onChange={e => setForm(f => ({ ...f, recetario: { ...f.recetario, domicilio: e.target.value } }))}
                placeholder="Ej: Av. Corrientes 1234, CABA" className="rounded-xl border-gray-200" />
            </Field>
            <Field label="Teléfono del consultorio">
              <Input value={form.recetario.telefonoConsultorio} onChange={e => setForm(f => ({ ...f, recetario: { ...f.recetario, telefonoConsultorio: e.target.value } }))}
                placeholder="Ej: (011) 4321-0000" className="rounded-xl border-gray-200" />
            </Field>
            <Field label="Tamaño de hoja">
              <Select value={form.recetario.tamanoHoja} onValueChange={v => setForm(f => ({ ...f, recetario: { ...f.recetario, tamanoHoja: v as 'A4' | 'A5' } }))}>
                <SelectTrigger className="rounded-xl border-gray-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A5">A5 — Recetario tradicional (148 × 210 mm)</SelectItem>
                  <SelectItem value="A4">A4 — Hoja completa (210 × 297 mm)</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Pie de página / texto legal">
              <Textarea
                value={form.recetario.piePagina}
                onChange={e => setForm(f => ({ ...f, recetario: { ...f.recetario, piePagina: e.target.value } }))}
                placeholder={'Ej:\nProhibida su reproducción. Válida por 30 días.\nColegio Médico de Buenos Aires — T° X F° Y\nFirma y sello obligatorios.'}
                rows={4} className="rounded-xl border-gray-200 resize-none text-xs"
              />
              <p className="text-[11px] text-gray-400 mt-1">Aparece en el borde inferior de cada receta impresa.</p>
            </Field>
          </div>
        </Section>
      )}

      {/* ── Link de reserva online ── */}
      <Section title="Link de reserva online">
        <p className="text-xs text-gray-400 mb-4">Compartí un link para que tus pacientes pidan turno sin llamarte. Podés activarlo o desactivarlo cuando quieras.</p>

        {/* Toggle activo */}
        <div className="flex items-center justify-between mb-4 p-3 rounded-xl" style={{ background: '#F8FAFC', border: '1.5px solid #E5E7EB' }}>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--dark)' }}>Reservas online</p>
            <p className="text-xs text-gray-400">{bookingLink.activo ? 'Los pacientes pueden reservar' : 'Link desactivado'}</p>
          </div>
          <button
            onClick={() => setBookingLink(l => ({ ...l, activo: !l.activo }))}
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
            style={{ background: bookingLink.activo ? 'var(--cyan)' : '#D1D5DB' }}
          >
            <span
              className="inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform"
              style={{ transform: bookingLink.activo ? 'translateX(22px)' : 'translateX(2px)' }}
            />
          </button>
        </div>

        {/* Slug */}
        <Field label="Dirección de tu link">
          <div className="flex gap-2 items-center">
            <span className="text-xs text-gray-400 shrink-0 font-mono">kuida.com.ar/reservar/</span>
            <Input
              value={bookingLink.slug}
              onChange={e => setBookingLink(l => ({ ...l, slug: toSlug(e.target.value) }))}
              placeholder="tu-nombre"
              className="rounded-xl border-gray-200 font-mono text-sm flex-1"
            />
          </div>
          {!bookingLink.slug && form.nombreProfesional && (
            <button
              className="text-xs mt-1 font-bold"
              style={{ color: 'var(--cyan)' }}
              onClick={() => setBookingLink(l => ({ ...l, slug: toSlug(form.nombreProfesional) }))}
            >
              Usar "{toSlug(form.nombreProfesional)}"
            </button>
          )}
        </Field>

        {/* Copy URL */}
        {bookingLink.slug && (
          <div className="mt-3 flex items-center gap-2 p-3 rounded-xl" style={{ background: '#F0FDFE', border: '1.5px solid #A5F3FB' }}>
            <Link size={14} style={{ color: 'var(--cyan)', flexShrink: 0 }} />
            <span className="text-xs font-mono text-gray-600 truncate flex-1">{publicUrl}</span>
            <button
              onClick={() => { navigator.clipboard.writeText(publicUrl); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000); }}
              className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors"
              style={{ background: linkCopied ? '#22C55E' : 'var(--cyan)', color: linkCopied ? 'white' : 'var(--dark)' }}
            >
              {linkCopied ? <Check size={12} /> : <Copy size={12} />}
              {linkCopied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        )}

        {/* Mensaje de bienvenida */}
        <div className="mt-3">
          <Field label="Mensaje de bienvenida (opcional)">
            <Textarea
              value={bookingLink.mensaje}
              onChange={e => setBookingLink(l => ({ ...l, mensaje: e.target.value }))}
              placeholder="Ej: Bienvenido a mi consultorio. Elegí el día y horario que prefieras."
              rows={3}
              className="rounded-xl border-gray-200 resize-none text-sm"
            />
          </Field>
        </div>

        <button
          onClick={handleSaveLink}
          disabled={!bookingLink.slug}
          className="mt-3 w-full py-2.5 rounded-full text-sm font-extrabold transition-all flex items-center justify-center gap-2"
          style={linkSaved
            ? { background: '#22C55E', color: 'white' }
            : { background: bookingLink.slug ? 'var(--dark)' : '#E5E7EB', color: bookingLink.slug ? 'white' : '#9CA3AF' }}
        >
          {linkSaved && <Check size={15} />}
          {linkSaved ? 'Link guardado' : 'Guardar link'}
        </button>
      </Section>

      <button
        onClick={guardar}
        className="w-full py-3 rounded-full text-sm font-extrabold transition-all flex items-center justify-center gap-2"
        style={saved ? { background: '#22C55E', color: 'white' } : { background: 'var(--cyan)', color: 'var(--dark)' }}
      >
        {saved && <Check size={16} />}
        {saved ? 'Cambios guardados' : 'Guardar configuración'}
      </button>


      {showServicioForm && (
        <ServicioModal servicio={editServicio} onSave={saveServicio} onClose={() => { setShowServicioForm(false); setEditServicio(null); }} />
      )}
    </div>
  );
}

function ServicioModal({ servicio, onSave, onClose }: { servicio: Servicio | null; onSave: (s: Servicio) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    nombre: servicio?.nombre || '',
    duracion: servicio?.duracion ?? 30,
    precio: servicio?.precio !== undefined ? String(servicio.precio) : '',
  });
  const [error, setError] = useState('');

  const guardar = () => {
    if (!form.nombre.trim()) { setError('Ingresá el nombre del servicio'); return; }
    if (!form.duracion || Number(form.duracion) < 5) { setError('Duración mínima: 5 min'); return; }
    onSave({
      id: servicio?.id || uid(),
      nombre: form.nombre.trim(),
      duracion: Number(form.duracion),
      precio: form.precio !== '' ? Number(form.precio) : undefined,
    });
  };

  const dur = Number(form.duracion);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-base font-bold" style={{ color: 'var(--dark)' }}>{servicio ? 'Editar servicio' : 'Nuevo servicio'}</p>
          <button onClick={onClose} className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 transition-colors"><X size={16} /></button>
        </div>
        <Field label="Nombre">
          <Input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Limpieza dental, Corte dama..." className="rounded-xl border-gray-200" autoFocus />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Duración (min)">
            <Input type="number" min={5} max={480} step={5} value={form.duracion} onChange={e => setForm(f => ({ ...f, duracion: Number(e.target.value) }))} className="rounded-xl border-gray-200" />
          </Field>
          <Field label="Precio (opcional)">
            <Input type="number" min={0} step={100} value={form.precio} onChange={e => setForm(f => ({ ...f, precio: e.target.value }))} placeholder="$" className="rounded-xl border-gray-200" />
          </Field>
        </div>
        {dur >= 5 && (
          <div className="text-center py-2 rounded-xl text-xs font-bold" style={{ background: 'var(--cyan-light)', color: 'var(--cyan-dark)' }}>
            {dur >= 60 ? `${Math.floor(dur / 60)}h${dur % 60 > 0 ? ` ${dur % 60}min` : ''}` : `${dur} minutos`}
          </div>
        )}
        {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-full text-sm font-bold border border-gray-200 text-gray-500 hover:bg-gray-50">Cancelar</button>
          <button onClick={guardar} className="flex-1 py-2.5 rounded-full text-sm font-bold transition-opacity hover:opacity-80" style={{ background: 'var(--cyan)', color: 'var(--dark)' }}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl px-5 py-4 shadow-sm">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">{title}</p>
      {children}
    </div>
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
