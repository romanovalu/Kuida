import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Mode = 'login' | 'register' | 'forgot';

export default function Auth() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);

    try {
      if (mode === 'register') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess('¡Cuenta creada! Revisá tu email para confirmar.');
      } else if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        setSuccess('Te enviamos un link para restablecer tu contraseña.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado';
      if (msg.includes('Invalid login credentials')) setError('Email o contraseña incorrectos.');
      else if (msg.includes('User already registered')) setError('Ya existe una cuenta con ese email.');
      else if (msg.includes('Password should be')) setError('La contraseña debe tener al menos 6 caracteres.');
      else setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--dark)' }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black mx-auto mb-3"
            style={{ background: 'var(--cyan)', color: 'var(--dark)' }}>G</div>
          <h1 className="text-xl font-black text-white">GestiónTurnos</h1>
          <p className="text-xs text-white/40 mt-1">
            {mode === 'login' ? 'Ingresá a tu espacio de trabajo' :
             mode === 'register' ? '30 días gratis · Sin tarjeta' :
             'Recuperar contraseña'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider mb-1.5 block"
              style={{ color: 'rgba(255,255,255,0.5)' }}>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              autoFocus
              className="rounded-xl border-0 text-white placeholder:text-white/20 font-medium"
              style={{ background: 'rgba(255,255,255,0.07)' }}
            />
          </div>

          {mode !== 'forgot' && (
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider mb-1.5 block"
                style={{ color: 'rgba(255,255,255,0.5)' }}>Contraseña</Label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                className="rounded-xl border-0 text-white placeholder:text-white/20"
                style={{ background: 'rgba(255,255,255,0.07)' }}
              />
            </div>
          )}

          {error && (
            <div className="text-xs font-semibold px-4 py-3 rounded-xl"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#FCA5A5' }}>
              {error}
            </div>
          )}
          {success && (
            <div className="text-xs font-semibold px-4 py-3 rounded-xl"
              style={{ background: 'rgba(34,197,94,0.15)', color: '#86EFAC' }}>
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full font-bold text-sm transition-all disabled:opacity-50"
            style={{ background: 'var(--cyan)', color: 'var(--dark)' }}
          >
            {loading ? 'Cargando...' :
             mode === 'login' ? 'Ingresar' :
             mode === 'register' ? 'Crear cuenta gratis' :
             'Enviar link'}
          </button>
        </form>

        {/* Links */}
        <div className="mt-5 space-y-2 text-center">
          {mode === 'login' && (
            <>
              <button onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
                className="block w-full text-xs font-semibold transition-colors"
                style={{ color: 'var(--cyan)' }}>
                ¿No tenés cuenta? Registrate gratis
              </button>
              <button onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                className="block w-full text-xs text-white/30 hover:text-white/60 transition-colors">
                Olvidé mi contraseña
              </button>
            </>
          )}
          {(mode === 'register' || mode === 'forgot') && (
            <button onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
              className="text-xs font-semibold transition-colors"
              style={{ color: 'var(--cyan)' }}>
              ← Volver al inicio de sesión
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
