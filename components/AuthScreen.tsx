import React, { useState } from 'react';
import { Button, Input } from './ui';
import { Terminal, Lock, Mail, Loader2, Info, KeyRound, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export const AuthScreen = () => {
  const { loginWithDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const env = (import.meta as any).env || {};
  const supabaseReady =
    env.VITE_SUPABASE_URL &&
    !env.VITE_SUPABASE_URL.includes('placeholder') &&
    env.VITE_SUPABASE_ANON_KEY &&
    !env.VITE_SUPABASE_ANON_KEY.includes('placeholder');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!supabaseReady) {
      setTimeout(() => {
        if (email.trim().length > 3 && email.includes('@')) {
          loginWithDemo(email);
        } else {
          setError('Por favor ingresa un email válido para la demo.');
        }
        setLoading(false);
      }, 800);
      return;
    }

    if (password.trim().length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      setLoading(false);
      return;
    }

    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess('Cuenta creada correctamente. Revisa tu correo si se requiere confirmación.');
      }
    } catch (err: any) {
      setError(err.message || 'No fue posible autenticarse.');
    } finally {
      setLoading(false);
    }
  };

  const handleLocalDemo = () => {
    setError('');
    if (email.trim().length > 3 && email.includes('@')) {
      loginWithDemo(email);
    } else {
      setError('Para modo local, ingresa un email válido.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090b] text-white p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-900/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md space-y-8 bg-zinc-900/50 p-8 rounded-2xl border border-white/5 backdrop-blur-xl shadow-2xl relative z-10">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4">
            <Terminal className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Bienvenido a DevVault</h2>
          <p className="text-muted-foreground text-sm mt-2">
            {supabaseReady ? 'Conecta tu cuenta de Supabase' : 'Modo Local / Demo Activo'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="tu@email.com"
                className="pl-9 bg-black/40 border-white/10 h-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {supabaseReady && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground ml-1">Contraseña</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="pl-9 bg-black/40 border-white/10 h-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {error && (
            <div className="text-xs text-red-400 bg-red-950/20 border border-red-900/30 p-2 rounded flex items-center gap-2">
              <Info className="h-3 w-3" />
              {error}
            </div>
          )}

          {success && (
            <div className="text-xs text-emerald-300 bg-emerald-950/20 border border-emerald-900/40 p-2 rounded">
              {success}
            </div>
          )}

          {!supabaseReady && (
            <div className="text-[10px] text-amber-200/80 bg-amber-900/20 border border-amber-900/30 p-2 rounded">
              <span className="font-bold">Nota:</span> Como no has configurado Supabase aún, ingresa cualquier correo para usar la versión Local Storage. Tus datos se guardarán en tu navegador.
            </div>
          )}

          {supabaseReady && (
            <div className="grid grid-cols-2 gap-2 text-xs uppercase font-semibold text-center bg-white/5 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`py-2 rounded-md transition ${authMode === 'login' ? 'bg-white text-black font-bold shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
              >
                Ingresar
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className={`py-2 rounded-md transition ${authMode === 'signup' ? 'bg-white text-black font-bold shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
              >
                Crear Cuenta
              </button>
            </div>
          )}

          <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white h-11 font-bold shadow-indigo-500/20 shadow-lg border-none" disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : authMode === 'signup' && supabaseReady ? (
              <UserPlus className="mr-2 h-4 w-4" />
            ) : (
              <Lock className="mr-2 h-4 w-4" />
            )}
            {loading
              ? 'Procesando...'
              : supabaseReady
              ? authMode === 'signup'
                ? 'Crear cuenta'
                : 'Iniciar sesión'
              : 'Entrar (Modo Local)'}
          </Button>
        </form>

        {supabaseReady && (
          <div className="space-y-2">
            <p className="text-[11px] text-center text-muted-foreground">¿Solo quieres probar sin backend?</p>
            <Button
              variant="ghost"
              className="w-full border border-dashed border-white/10 text-xs"
              type="button"
              onClick={handleLocalDemo}
            >
              Usar modo local
            </Button>
          </div>
        )}

        <p className="text-[10px] text-center text-muted-foreground/50">Powered by React & LocalStorage</p>
      </div>
    </div>
  );
};
