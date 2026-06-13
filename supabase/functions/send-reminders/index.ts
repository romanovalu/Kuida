import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY      = Deno.env.get('RESEND_API_KEY')!;
const SUPABASE_URL        = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const DIAS  = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto',
               'septiembre','octubre','noviembre','diciembre'];

function formatFecha(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const fecha = new Date(y, m - 1, d);
  return `${DIAS[fecha.getDay()]} ${d} de ${MESES[m - 1]}`;
}

function emailHtml(params: {
  nombrePaciente: string;
  nombreProfesional: string;
  especialidad: string;
  fecha: string;
  hora: string;
  motivo?: string;
}): string {
  const { nombrePaciente, nombreProfesional, especialidad, fecha, hora, motivo } = params;
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F0F2F5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F2F5;padding:32px 16px">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden">

        <!-- Header -->
        <tr><td style="background:#0D1117;padding:28px 32px;text-align:center">
          <table cellpadding="0" cellspacing="0" style="display:inline-table">
            <tr>
              <td style="vertical-align:middle;padding-right:10px">
                <div style="width:36px;height:36px;background:#0CCEDD;border-radius:9px;display:inline-block;text-align:center;line-height:36px">
                  <svg width="22" height="22" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;margin-top:7px">
                    <path d="M28 8C18 14 8 22 8 33C8 43 17 50 28 50C39 50 48 43 48 33C48 22 38 14 28 8Z" fill="white"/>
                    <line x1="28" y1="12" x2="28" y2="38" stroke="#0CCEDD" stroke-width="3" stroke-linecap="round"/>
                    <line x1="28" y1="38" x2="20" y2="47" stroke="#0CCEDD" stroke-width="3" stroke-linecap="round"/>
                    <line x1="28" y1="38" x2="36" y2="47" stroke="#0CCEDD" stroke-width="3" stroke-linecap="round"/>
                  </svg>
                </div>
              </td>
              <td style="vertical-align:middle">
                <span style="font-family:Arial Black,Arial,sans-serif;font-weight:900;font-size:22px;color:#ffffff;letter-spacing:-0.5px">kuida</span>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px 32px 24px">
          <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#0CCEDD;text-transform:uppercase;letter-spacing:1px">Recordatorio de turno</p>
          <h1 style="margin:0 0 20px;font-size:22px;font-weight:800;color:#0D1117;line-height:1.2">
            Hola ${nombrePaciente}, tu turno es mañana 👋
          </h1>
          <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6">
            Te recordamos que tenés un turno agendado para <strong>${formatFecha(fecha)}</strong>.
          </p>

          <!-- Turno card -->
          <div style="background:#F8FAFC;border:1.5px solid #E5E7EB;border-radius:14px;padding:20px 24px;margin-bottom:24px">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:6px 0;font-size:13px;color:#888;font-weight:600;width:110px">📅 Fecha</td>
                <td style="padding:6px 0;font-size:13px;color:#0D1117;font-weight:700">${formatFecha(fecha)}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-size:13px;color:#888;font-weight:600">🕐 Hora</td>
                <td style="padding:6px 0;font-size:13px;color:#0D1117;font-weight:700">${hora} hs</td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-size:13px;color:#888;font-weight:600">👨‍⚕️ Profesional</td>
                <td style="padding:6px 0;font-size:13px;color:#0D1117;font-weight:700">${nombreProfesional}</td>
              </tr>
              ${especialidad ? `<tr>
                <td style="padding:6px 0;font-size:13px;color:#888;font-weight:600">🏥 Especialidad</td>
                <td style="padding:6px 0;font-size:13px;color:#0D1117;font-weight:700">${especialidad}</td>
              </tr>` : ''}
              ${motivo ? `<tr>
                <td style="padding:6px 0;font-size:13px;color:#888;font-weight:600">📝 Motivo</td>
                <td style="padding:6px 0;font-size:13px;color:#0D1117">${motivo}</td>
              </tr>` : ''}
            </table>
          </div>

          <p style="margin:0;font-size:13px;color:#999;line-height:1.6">
            Si necesitás reprogramar o cancelar, comunicate con ${nombreProfesional} lo antes posible.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#F8FAFC;padding:16px 32px;text-align:center;border-top:1px solid #E5E7EB">
          <p style="margin:0;font-size:11px;color:#aaa">
            Enviado por <strong style="color:#0CCEDD">kuida</strong> · Sistema de gestión de turnos
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'kuida <no-reply@kuida.com.ar>', to, subject, html }),
  });
  return res.ok;
}

Deno.serve(async (req) => {
  // Allow manual trigger via POST with optional { fecha } body
  let fechaObjetivo: string | null = null;
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      fechaObjetivo = body.fecha ?? null;
    } catch { /* ignore */ }
  }

  if (!fechaObjetivo) {
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    fechaObjetivo = manana.toISOString().slice(0, 10);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Fetch all turnos for the target date
  const { data: turnos, error: turnosError } = await supabase
    .from('turnos')
    .select('*')
    .eq('fecha', fechaObjetivo)
    .in('estado', ['pendiente', 'confirmado']);

  if (turnosError) return new Response(`Error: ${turnosError.message}`, { status: 500 });
  if (!turnos?.length) return new Response(JSON.stringify({ fecha: fechaObjetivo, enviados: 0, mensaje: 'Sin turnos' }), { headers: { 'Content-Type': 'application/json' } });

  let enviados = 0;
  let sinEmail = 0;

  for (const turno of turnos) {
    if (!turno.paciente_id) { sinEmail++; continue; }

    const [{ data: paciente }, { data: cfgRow }] = await Promise.all([
      supabase.from('pacientes').select('nombre,apellido,email').eq('id', turno.paciente_id).eq('user_id', turno.user_id).single(),
      supabase.from('configuracion').select('datos').eq('user_id', turno.user_id).single(),
    ]);

    if (!paciente?.email) { sinEmail++; continue; }

    const cfg = cfgRow?.datos as { nombreProfesional?: string; especialidad?: string } | null;
    const nombreProfesional = cfg?.nombreProfesional ?? 'Tu profesional';
    const especialidad = cfg?.especialidad ?? '';

    const html = emailHtml({
      nombrePaciente: paciente.nombre,
      nombreProfesional,
      especialidad,
      fecha: turno.fecha,
      hora: turno.hora,
      motivo: turno.motivo,
    });

    const ok = await sendEmail(
      paciente.email,
      `Recordatorio: turno mañana a las ${turno.hora} hs con ${nombreProfesional}`,
      html,
    );

    if (ok) enviados++;
  }

  const resultado = { fecha: fechaObjetivo, total: turnos.length, enviados, sinEmail };
  console.log('send-reminders:', resultado);
  return new Response(JSON.stringify(resultado), { headers: { 'Content-Type': 'application/json' } });
});
