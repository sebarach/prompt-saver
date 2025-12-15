import React, { useState } from 'react';
import { Button, Input } from './ui';
import { Terminal, Lock, Mail, Loader2, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthScreen = () => {
  const { loginWithDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Simulamos un pequeño delay para sensación de "proceso"
    setTimeout(() => {
        if (email.trim().length > 3 && email.includes('@')) {
            loginWithDemo(email);
        } else {
            setError("Por favor ingresa un email válido para la demo.");
            setLoading(false);
        }
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090b] text-white p-4 relative overflow-hidden">
       {/* Background Decor */}
       <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-900/10 blur-[120px] pointer-events-none" />
       <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-900/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md space-y-8 bg-zinc-900/50 p-8 rounded-2xl border border-white/5 backdrop-blur-xl shadow-2xl relative z-10">
        <div className="text-center">
            <div className="mx-auto h-12 w-12 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4">
                <Terminal className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Bienvenido a DevVault</h2>
            <p className="text-muted-foreground text-sm mt-2">
                Modo Local / Demo Activo
            </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
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

            {error && (
                <div className="text-xs text-red-400 bg-red-950/20 border border-red-900/30 p-2 rounded flex items-center gap-2">
                    <Info className="h-3 w-3" />
                    {error}
                </div>
            )}

            <div className="text-[10px] text-amber-200/80 bg-amber-900/20 border border-amber-900/30 p-2 rounded">
                <span className="font-bold">Nota:</span> Como no has configurado Supabase aún, ingresa cualquier correo para usar la versión Local Storage. Tus datos se guardarán en tu navegador.
            </div>

            <Button className="w-full bg-white text-black hover:bg-zinc-200 h-10 font-semibold" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                {loading ? 'Entrando...' : 'Entrar (Modo Local)'}
            </Button>
        </form>
        
        <p className="text-[10px] text-center text-muted-foreground/50">
            Powered by React & LocalStorage
        </p>
      </div>
    </div>
  );
};