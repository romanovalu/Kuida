import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { KuidaLogo } from './KuidaLogo';
import type { Configuracion } from '../types';

interface BookingLink {
  id: string;
  user_id: string;
  slug: string;
  mensaje: string;
}

interface Slot { hora: string; disponible: boolean; }

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function addMinutes(hora: string, min: number): string {
  const [h, m] = hora.split(':').map(Number);
  const total = h * 60 + m + min;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function generateSlots(config: Configuracion): string[] {
  const slots: string[] = [];
  let current = config.horaInicio;
  while (current < config.horaFin) {
    slots.push(current);
    current = addMinutes(current, config.intervaloGrilla || 30);
  }
  return slots;
}

function getNextDays(config: Configuracion, count = 30): Date[] {
  const days: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 1; days.length < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (config.diasLaborables.includes(d.getDay())) days.push(d);
  }
  return days;
}

function toISO(d: Date) { return d.toISOString().slice(0, 10); }

export default function BookingPage({ slug }: { slug: string }) {
  const [link, setLink] = useState<BookingLink | null>(null);
  const [config, setConfig] = useState<Configuracion | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [motivo, setMotivo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function init() {
      const { data: linkData } = await supabase
        .from('booking_links')
        .select('*')
        .eq('slug', slug)
        .eq('activo', true)
        .single();

      if (!linkData) { setNotFound(true); setLoading(false); return; }
      setLink(linkData);

      const { data: cfgData } = await supabase
        .from('configuracion')
        .select('datos')
        .eq('user_id', linkData.user_id)
        .single();

      if (cfgData?.datos) setConfig(cfgData.datos as Configuracion);
      setLoading(false);
    }
    init();
  }, [slug]);

  useEffect(() => {
    if (!selectedDate || !config || !link) return;
    loadSlots(selectedDate);
  }, [selectedDate]);

  async function loadSlots(date: Date) {
    if (!config || !link) return;
    setLoadingSlots(true);
    setSelectedSlot('');

    const fecha = toISO(date);
    const allSlots = generateSlots(config);

    const [{ data: turnos }, { data: reservas }] = await Promise.all([
      supabase.from('turnos').select('hora, duracion').eq('user_id', link.user_id).eq('fecha', fecha),
      supabase.from('reservas_publicas').select('hora, duracion').eq('user_id', link.user_id).eq('fecha', fecha).neq('estado', 'rechazado'),
    ]);

    const ocupados = new Set<string>();
    [...(turnos || []), ...(reservas || [])].forEach(t => {
      let h = t.hora;
      const fin = addMinutes(t.hora, t.duracion || 30);
      while (h < fin) {
        ocupados.add(h);
        h = addMinutes(h, config.intervaloGrilla || 30);
      }
    });

    setSlots(allSlots.map(h => ({ hora: h, disponible: !ocupados.has(h) })));
    setLoadingSlots(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDate || !selectedSlot || !link || !config) return;
    setSubmitting(true); setError('');

    const servicio = config.servicios?.[0];
    const { error: err } = await supabase.from('reservas_publicas').insert({
      user_id: link.user_id,
      fecha: toISO(selectedDate),
      hora: selectedSlot,
      duracion: servicio?.duracion || 30,
      nombre_paciente: nombre.trim(),
      telefono_paciente: telefono.trim(),
      motivo: motivo.trim(),
      estado: 'pendiente',
    });

    if (err) { setError('Hubo un error al reservar. Intentá de nuevo.'); setSubmitting(false); return; }
    setDone(true);
    setSubmitting(false);
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8FAFC' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="animate-pulse"><img src="/favicon.svg" width={48} alt="" /></div>
        <p style={{ color: '#888', fontSize: 14, fontFamily: 'sans-serif' }}>Cargando...</p>
      </div>
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#F8FAFC' }}>
      <div className="text-center">
        <KuidaLogo subtitle="Link no encontrado" />
        <p style={{ color: '#888', fontSize: 14, fontFamily: 'sans-serif', marginTop: 16 }}>
          Este link no existe o fue desactivado por el profesional.
        </p>
      </div>
    </div>
  );

  if (done) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#F8FAFC' }}>
      <div className="text-center max-w-sm">
        <div style={{ width: 64, height: 64, borderRadius: 32, background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <span style={{ fontSize: 28 }}>✓</span>
        </div>
        <h2 style={{ fontFamily: 'sans-serif', fontWeight: 800, fontSize: 20, color: '#0D1117', marginBottom: 8 }}>¡Turno solicitado!</h2>
        <p style={{ fontFamily: 'sans-serif', fontSize: 14, color: '#555', lineHeight: 1.6 }}>
          Tu solicitud fue enviada a {config?.nombreProfesional}.<br />
          Te van a contactar para confirmar el turno del{' '}
          <strong>{selectedDate && `${DIAS[selectedDate.getDay()]} ${selectedDate.getDate()} de ${MESES[selectedDate.getMonth()]}`} a las {selectedSlot}</strong>.
        </p>
        <p style={{ fontFamily: 'sans-serif', fontSize: 12, color: '#aaa', marginTop: 16 }}>
          Powered by <strong>kuida</strong>
        </p>
      </div>
    </div>
  );

  const availableDays = config ? getNextDays(config) : [];

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#0D1117', padding: '20px 20px 24px' }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <KuidaLogo dark />
          <div style={{ marginTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16 }}>
            <p style={{ color: '#0CCEDD', fontSize: 13, fontWeight: 700, margin: 0 }}>{config?.nombreProfesional}</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '2px 0 0' }}>{config?.especialidad}</p>
            {link?.mensaje && <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: '10px 0 0', lineHeight: 1.5 }}>{link.mensaje}</p>}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px 48px' }}>

        {/* Paso 1 — Elegir fecha */}
        {!selectedSlot && (
          <section style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12 }}>
              {selectedDate ? '2 · Elegí un horario' : '1 · Elegí un día'}
            </p>

            {!selectedDate ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {availableDays.slice(0, 20).map(d => (
                  <button key={toISO(d)} onClick={() => setSelectedDate(d)}
                    style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 12, padding: '10px 4px', cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#0CCEDD')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#E5E7EB')}>
                    <p style={{ fontSize: 10, color: '#aaa', margin: 0, textTransform: 'uppercase', letterSpacing: 0.5 }}>{DIAS[d.getDay()]}</p>
                    <p style={{ fontSize: 20, fontWeight: 800, color: '#0D1117', margin: '2px 0' }}>{d.getDate()}</p>
                    <p style={{ fontSize: 10, color: '#aaa', margin: 0 }}>{MESES[d.getMonth()].slice(0, 3)}</p>
                  </button>
                ))}
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <button onClick={() => { setSelectedDate(null); setSlots([]); }}
                    style={{ background: 'none', border: 'none', color: '#0CCEDD', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                    ← Cambiar día
                  </button>
                  <span style={{ fontSize: 13, color: '#555' }}>
                    {DIAS[selectedDate.getDay()]} {selectedDate.getDate()} de {MESES[selectedDate.getMonth()]}
                  </span>
                </div>

                {loadingSlots ? (
                  <p style={{ color: '#aaa', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>Verificando disponibilidad...</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {slots.map(s => (
                      <button key={s.hora} disabled={!s.disponible} onClick={() => setSelectedSlot(s.hora)}
                        style={{
                          padding: '10px 4px', borderRadius: 10, border: '1.5px solid',
                          borderColor: s.disponible ? '#E5E7EB' : '#F3F4F6',
                          background: s.disponible ? 'white' : '#F9FAFB',
                          color: s.disponible ? '#0D1117' : '#D1D5DB',
                          fontSize: 14, fontWeight: 600, cursor: s.disponible ? 'pointer' : 'not-allowed',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { if (s.disponible) e.currentTarget.style.borderColor = '#0CCEDD'; }}
                        onMouseLeave={e => { if (s.disponible) e.currentTarget.style.borderColor = '#E5E7EB'; }}>
                        {s.hora}
                      </button>
                    ))}
                    {slots.every(s => !s.disponible) && (
                      <p style={{ gridColumn: '1/-1', color: '#aaa', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>
                        No hay horarios disponibles para este día.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* Paso 2 — Formulario */}
        {selectedSlot && (
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <button onClick={() => setSelectedSlot('')}
                style={{ background: 'none', border: 'none', color: '#0CCEDD', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                ← Cambiar horario
              </button>
              <span style={{ fontSize: 13, color: '#555' }}>
                {selectedDate && `${DIAS[selectedDate.getDay()]} ${selectedDate.getDate()} de ${MESES[selectedDate.getMonth()]}`} · {selectedSlot}hs
              </span>
            </div>

            <p style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 16 }}>
              3 · Tus datos
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', marginBottom: 6 }}>
                  Nombre completo *
                </label>
                <input value={nombre} onChange={e => setNombre(e.target.value)} required placeholder="Tu nombre y apellido"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #E5E7EB', fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', marginBottom: 6 }}>
                  Teléfono
                </label>
                <input value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="Ej: 1123456789" type="tel"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #E5E7EB', fontSize: 15, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', marginBottom: 6 }}>
                  Motivo de la consulta
                </label>
                <textarea value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Contanos brevemente el motivo..." rows={3}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #E5E7EB', fontSize: 15, outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'sans-serif' }} />
              </div>

              {error && <p style={{ color: '#EF4444', fontSize: 13, background: '#FEF2F2', padding: '10px 14px', borderRadius: 10 }}>{error}</p>}

              <button type="submit" disabled={!nombre.trim() || submitting}
                style={{
                  background: '#0CCEDD', color: '#0D1117', border: 'none', borderRadius: 999,
                  padding: '14px 0', fontSize: 15, fontWeight: 800, cursor: 'pointer',
                  opacity: !nombre.trim() || submitting ? 0.5 : 1, transition: 'opacity 0.15s',
                }}>
                {submitting ? 'Enviando...' : 'Solicitar turno'}
              </button>

              <p style={{ fontSize: 11, color: '#ccc', textAlign: 'center' }}>
                Al solicitar, el profesional recibirá tu pedido y te contactará para confirmar.
              </p>
            </form>
          </section>
        )}
      </div>
    </div>
  );
}
