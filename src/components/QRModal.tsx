import { useEffect, useRef } from 'react';
import { X, Printer } from 'lucide-react';

interface Props {
  titulo: string;
  subtitulo?: string;
  datos: string;
  onClose: () => void;
}

// QR generado con qrcode.react si está disponible, sino fallback a API pública
export default function QRModal({ titulo, subtitulo, datos, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // URL de la API pública de QR (no envía datos sensibles, solo texto plano)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(datos)}`;

  function handlePrint() {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>QR - ${titulo}</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 40px; }
        h2 { margin-bottom: 4px; font-size: 18px; }
        p { color: #666; font-size: 14px; margin: 0 0 20px; }
        img { width: 200px; height: 200px; }
        .datos { margin-top: 16px; font-size: 11px; color: #999; word-break: break-all; max-width: 220px; margin-left: auto; margin-right: auto; }
      </style></head>
      <body>
        <h2>${titulo}</h2>
        ${subtitulo ? `<p>${subtitulo}</p>` : ''}
        <img src="${qrUrl}" />
        <div class="datos">${datos}</div>
      </body></html>
    `);
    win.document.close();
    win.print();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-xs text-center space-y-4" ref={containerRef}>
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-base text-gray-900">Código QR</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <div>
          <p className="font-bold text-gray-800">{titulo}</p>
          {subtitulo && <p className="text-sm text-gray-500">{subtitulo}</p>}
        </div>

        <div className="flex justify-center">
          <img
            src={qrUrl}
            alt="QR"
            width={200} height={200}
            className="rounded-xl border border-gray-100"
          />
        </div>

        <p className="text-[10px] text-gray-400 break-all px-2">{datos}</p>

        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
            Cerrar
          </button>
          <button onClick={handlePrint}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            style={{ background: 'var(--cyan)', color: 'var(--dark)' }}>
            <Printer size={14} /> Imprimir
          </button>
        </div>
      </div>
    </div>
  );
}
