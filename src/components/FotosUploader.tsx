import { useState, useRef } from 'react';
import { Camera, X, Loader2, ZoomIn } from 'lucide-react';
import * as db from '../lib/db';

interface Props {
  fotos: string[];
  folder: string;         // ej: 'consultas/id' o 'ot/id'
  onChange: (fotos: string[]) => void;
  readonly?: boolean;
}

export default function FotosUploader({ fotos, folder, onChange, readonly = false }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError('');
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        if (file.size > 8 * 1024 * 1024) { setError('Cada foto debe pesar menos de 8 MB'); continue; }
        const url = await db.uploadFoto(file, folder);
        urls.push(url);
      }
      if (urls.length) onChange([...fotos, ...urls]);
    } catch {
      setError('Error al subir la foto. Verificá que el bucket "foto" esté creado en Supabase.');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(url: string) {
    onChange(fotos.filter(f => f !== url));
    await db.deleteFoto(url).catch(() => {});
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Fotos</p>
        {!readonly && (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40">
            {uploading ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
            {uploading ? 'Subiendo...' : 'Agregar foto'}
          </button>
        )}
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
          onChange={e => handleFiles(e.target.files)} />
      </div>

      {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

      {fotos.length === 0 && readonly && (
        <p className="text-xs text-gray-400">Sin fotos adjuntas</p>
      )}

      {fotos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {fotos.map((url, i) => (
            <div key={i} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
              <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
              {/* Overlay botones */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                <button onClick={() => setPreview(url)}
                  className="p-1 rounded-lg bg-white/20 text-white hover:bg-white/40 transition-colors">
                  <ZoomIn size={14} />
                </button>
                {!readonly && (
                  <button onClick={() => handleDelete(url)}
                    className="p-1 rounded-lg bg-red-500/80 text-white hover:bg-red-600 transition-colors">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview lightbox */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)' }} onClick={() => setPreview(null)}>
          <div className="relative max-w-2xl w-full">
            <button onClick={() => setPreview(null)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white">
              <X size={24} />
            </button>
            <img src={preview} alt="Preview" className="w-full rounded-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}
