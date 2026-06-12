import { useState } from 'react';
import type { Paciente, Receta, Configuracion } from '../types';
import { uid, getLogoReceta } from '../store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, Printer, Plus, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

interface Props {
  paciente: Paciente;
  config: Configuracion;
  recetas: Receta[];
  onSave: (r: Receta) => void;
  onDelete: (id: string) => void;
}

export default function RecetasSection({ paciente, config, recetas, onSave, onDelete }: Props) {
  const misRecetas = recetas
    .filter(r => r.pacienteId === paciente.id)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({
    fecha: today,
    diagnostico: '',
    medicamentos: '',
    indicaciones: '',
  });

  const guardar = () => {
    if (!form.medicamentos.trim()) return;
    onSave({
      id: uid(),
      pacienteId: paciente.id,
      fecha: form.fecha,
      diagnostico: form.diagnostico || undefined,
      medicamentos: form.medicamentos,
      indicaciones: form.indicaciones || undefined,
      createdAt: new Date().toISOString(),
    });
    setForm({ fecha: today, diagnostico: '', medicamentos: '', indicaciones: '' });
    setShowForm(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Recetas / Indicaciones</p>
        <button
          onClick={() => setShowForm(x => !x)}
          className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full"
          style={{ background: 'var(--cyan-light)', color: 'var(--cyan-dark)' }}
        >
          <Plus size={12} /> Nueva receta
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Fecha</Label>
              <Input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} className="rounded-xl border-gray-200 h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Diagnóstico (opcional)</Label>
              <Input value={form.diagnostico} onChange={e => setForm(f => ({ ...f, diagnostico: e.target.value }))} placeholder="Ej: HTA, Faringitis..." className="rounded-xl border-gray-200 h-8 text-xs" />
            </div>
          </div>
          <div>
            <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Medicamentos *</Label>
            <Textarea
              value={form.medicamentos}
              onChange={e => setForm(f => ({ ...f, medicamentos: e.target.value }))}
              placeholder={'Ej:\nAmlodipina 5mg — 1 comp. por día\nEnalapril 10mg — 1 comp. cada 12hs\n...'}
              rows={5} className="rounded-xl border-gray-200 resize-none text-sm font-mono"
              autoFocus
            />
          </div>
          <div>
            <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Indicaciones adicionales</Label>
            <Textarea
              value={form.indicaciones}
              onChange={e => setForm(f => ({ ...f, indicaciones: e.target.value }))}
              placeholder="Ej: Tomar con alimentos. Control en 30 días."
              rows={2} className="rounded-xl border-gray-200 resize-none text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-full text-xs font-bold border border-gray-200 text-gray-500">Cancelar</button>
            <button onClick={guardar} className="flex-1 py-2 rounded-full text-xs font-bold" style={{ background: 'var(--cyan)', color: 'var(--dark)' }}>Guardar</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {misRecetas.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4">Sin recetas registradas</p>
        )}
        {misRecetas.map(r => (
          <div key={r.id} className="rounded-xl overflow-hidden" style={{ border: '1px solid #F3F4F6' }}>
            <button
              onClick={() => setExpanded(expanded === r.id ? null : r.id)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-gray-50"
            >
              <span className="text-xs font-bold text-gray-700">
                {new Date(r.fecha + 'T12:00').toLocaleDateString('es-AR')}
                {r.diagnostico && ` · ${r.diagnostico}`}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={e => { e.stopPropagation(); imprimirReceta(r, paciente, config); }}
                  className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full"
                  style={{ background: 'var(--cyan-light)', color: 'var(--cyan-dark)' }}
                >
                  <Printer size={11} /> Imprimir
                </button>
                {expanded === r.id
                  ? <ChevronUp size={13} className="text-gray-400" />
                  : <ChevronDown size={13} className="text-gray-400" />
                }
                <button onClick={e => { e.stopPropagation(); onDelete(r.id); }} className="p-1 text-gray-300 hover:text-red-400"><Trash2 size={12} /></button>
              </div>
            </button>
            {expanded === r.id && (
              <div className="px-4 pb-3 space-y-2">
                <p className="text-xs text-gray-500 whitespace-pre-wrap font-mono leading-relaxed">{r.medicamentos}</p>
                {r.indicaciones && <p className="text-xs text-gray-400 italic">{r.indicaciones}</p>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Print engine ──────────────────────────────────────────────────────────────

export function imprimirReceta(receta: Receta, paciente: Paciente, config: Configuracion) {
  const rc = config.recetario;
  const logo = getLogoReceta();
  const hoja = rc?.tamanoHoja || 'A5';

  const fechaStr = new Date(receta.fecha + 'T12:00').toLocaleDateString('es-AR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<title>Receta — ${paciente.nombre} ${paciente.apellido}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  @page { size: ${hoja}; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Plus Jakarta Sans', Arial, sans-serif;
    font-size: 11pt;
    color: #1a1a1a;
    background: white;
    width: ${hoja === 'A4' ? '210mm' : '148mm'};
    min-height: ${hoja === 'A4' ? '297mm' : '210mm'};
    padding: 0;
  }
  .page {
    width: ${hoja === 'A4' ? '210mm' : '148mm'};
    min-height: ${hoja === 'A4' ? '297mm' : '210mm'};
    padding: ${hoja === 'A4' ? '18mm 20mm' : '14mm 16mm'};
    display: flex;
    flex-direction: column;
  }

  /* ── Encabezado ── */
  .header {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding-bottom: 12px;
    border-bottom: 2.5px solid #111;
    margin-bottom: 14px;
  }
  .logo { width: 64px; height: 64px; object-fit: contain; flex-shrink: 0; }
  .logo-placeholder {
    width: 64px; height: 64px; flex-shrink: 0;
    border: 1.5px dashed #ccc; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    color: #bbb; font-size: 9pt;
  }
  .prof-name { font-size: 15pt; font-weight: 700; line-height: 1.2; }
  .prof-esp  { font-size: 9.5pt; color: #555; margin-top: 2px; }
  .prof-data { font-size: 8.5pt; color: #666; margin-top: 6px; line-height: 1.6; }

  /* ── Paciente ── */
  .patient-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 16px;
  }
  .patient-label { font-size: 8pt; color: #888; text-transform: uppercase; letter-spacing: .05em; }
  .patient-name  { font-size: 12.5pt; font-weight: 600; border-bottom: 1px solid #ddd; padding-bottom: 2px; min-width: 200px; }
  .fecha-label { font-size: 8pt; color: #888; text-transform: uppercase; letter-spacing: .05em; text-align: right; }
  .fecha-val   { font-size: 10pt; font-weight: 500; text-align: right; }

  /* ── Diagnóstico ── */
  .diag { font-size: 8.5pt; color: #555; margin-bottom: 14px; }
  .diag strong { color: #333; }

  /* ── Rx ── */
  .rx-title {
    font-size: 28pt;
    font-weight: 800;
    color: #111;
    letter-spacing: -1px;
    line-height: 1;
    margin-bottom: 10px;
  }
  .rx-title span { font-size: 13pt; font-weight: 400; color: #888; margin-left: 4px; vertical-align: middle; }
  .medicamentos {
    font-size: ${hoja === 'A4' ? '10.5pt' : '9.5pt'};
    line-height: 1.9;
    white-space: pre-wrap;
    flex: 1;
    padding: 10px 0;
    border-bottom: 1px dashed #ddd;
    min-height: ${hoja === 'A4' ? '120mm' : '80mm'};
  }
  .indicaciones {
    font-size: 8.5pt;
    color: #555;
    font-style: italic;
    margin-top: 10px;
    padding-top: 8px;
  }

  /* ── Firma ── */
  .firma-row {
    margin-top: 18px;
    display: flex;
    justify-content: flex-end;
  }
  .firma-block {
    text-align: center;
    width: ${hoja === 'A4' ? '180px' : '140px'};
  }
  .firma-line {
    border-bottom: 1px solid #333;
    margin-bottom: 4px;
    height: 36px;
  }
  .firma-label { font-size: 8pt; color: #555; }

  /* ── Pie ── */
  .footer {
    margin-top: auto;
    padding-top: 10px;
    border-top: 1px solid #ddd;
    font-size: 7.5pt;
    color: #888;
    line-height: 1.5;
    white-space: pre-wrap;
  }

  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="page">
  <!-- Encabezado -->
  <div class="header">
    ${logo
      ? `<img class="logo" src="${logo}" alt="Logo" />`
      : `<div class="logo-placeholder">LOGO</div>`
    }
    <div style="flex:1">
      <div class="prof-name">${config.nombreProfesional}</div>
      <div class="prof-esp">${config.especialidad || ''}</div>
      <div class="prof-data">${[
        rc?.matricula ? `Mat. N° ${rc.matricula}` : '',
        rc?.domicilio || '',
        rc?.telefonoConsultorio ? `Tel: ${rc.telefonoConsultorio}` : '',
      ].filter(Boolean).join('  ·  ')}</div>
    </div>
  </div>

  <!-- Paciente + Fecha -->
  <div class="patient-row">
    <div>
      <div class="patient-label">Paciente</div>
      <div class="patient-name">${paciente.nombre} ${paciente.apellido}${paciente.dni ? ` — DNI ${paciente.dni}` : ''}</div>
    </div>
    <div>
      <div class="fecha-label">Fecha</div>
      <div class="fecha-val">${fechaStr}</div>
    </div>
  </div>

  ${receta.diagnostico ? `<div class="diag"><strong>Diagnóstico:</strong> ${receta.diagnostico}</div>` : ''}

  <!-- Rx -->
  <div class="rx-title">Rp<span>/</span></div>
  <div class="medicamentos">${receta.medicamentos.replace(/</g, '&lt;')}</div>

  ${receta.indicaciones ? `<div class="indicaciones">Indicaciones: ${receta.indicaciones}</div>` : ''}

  <!-- Firma -->
  <div class="firma-row">
    <div class="firma-block">
      <div class="firma-line"></div>
      <div class="firma-label">${config.nombreProfesional}${rc?.matricula ? ` · Mat. ${rc.matricula}` : ''}</div>
    </div>
  </div>

  <!-- Pie -->
  ${rc?.piePagina ? `<div class="footer">${rc.piePagina.replace(/</g, '&lt;')}</div>` : ''}
</div>

<script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`;

  const win = window.open('', '_blank', `width=800,height=600`);
  if (!win) return;
  win.document.write(html);
  win.document.close();
}
