
import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, WalletCards, AlertCircle, Fingerprint } from 'lucide-react';
import { isFirebaseActive } from '../services/storage';

interface AuthScreenProps {
  onLogin: (email: string, pass: string) => Promise<void>;
  onRegister: (email: string, pass: string) => Promise<void>;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onRegister }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isLive = isFirebaseActive();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      if (isLogin) {
        await onLogin(email, password);
      } else {
        await onRegister(email, password);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') {
        setError('E-Mail oder Passwort ist falsch.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Diese E-Mail wird bereits verwendet.');
      } else if (err.code === 'auth/weak-password') {
        setError('Das Passwort muss mindestens 6 Zeichen lang sein.');
      } else {
        setError('Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1e1e2e] flex items-center justify-center p-4">
      <div className="bg-[#181825] w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-[#313244] animate-in fade-in zoom-in duration-300">
        <div className={`${isLive ? 'bg-[#cba6f7]' : 'bg-[#89b4fa]'} p-8 text-center transition-colors relative overflow-hidden`}>
           {/* Decorative background element */}
           <div className="absolute top-0 left-0 w-full h-full bg-white/10 rotate-12 scale-150 transform origin-bottom-right pointer-events-none"></div>
           
          <div className="relative z-10 inline-flex p-4 bg-[#1e1e2e]/20 rounded-2xl mb-4 backdrop-blur-sm shadow-inner">
             <WalletCards className="w-10 h-10 text-[#1e1e2e]" />
          </div>
          <h1 className="relative z-10 text-3xl font-bold text-[#1e1e2e] mb-2 tracking-tight">Moneyboy</h1>
          <p className="relative z-10 text-[#1e1e2e]/80 font-bold text-sm">
            {isLive ? 'Deine Finanzen in der Cloud.' : 'Lokaler Demo Modus'}
          </p>
        </div>

        <div className="p-8">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => { setIsLogin(true); setError(null); }}
              className={`flex-1 pb-2 text-sm font-bold border-b-2 transition-colors ${
                isLogin ? (isLive ? 'border-[#cba6f7] text-[#cba6f7]' : 'border-[#89b4fa] text-[#89b4fa]') : 'border-transparent text-[#6c7086] hover:text-[#a6adc8]'
              }`}
            >
              Anmelden
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(null); }}
              className={`flex-1 pb-2 text-sm font-bold border-b-2 transition-colors ${
                !isLogin ? (isLive ? 'border-[#cba6f7] text-[#cba6f7]' : 'border-[#89b4fa] text-[#89b4fa]') : 'border-transparent text-[#6c7086] hover:text-[#a6adc8]'
              }`}
            >
              Registrieren
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-[#f38ba8]/10 text-[#f38ba8] text-sm rounded-lg flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-[#a6adc8] mb-1">E-Mail Adresse</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-5 h-5 text-[#6c7086]" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="username webauthn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#313244] border border-[#45475a] text-[#cdd6f4] placeholder-[#6c7086] focus:ring-2 focus:ring-[#cba6f7] focus:border-[#cba6f7] outline-none transition-shadow"
                  placeholder="name@beispiel.de"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-[#a6adc8] mb-1">Passwort</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-5 h-5 text-[#6c7086]" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete={isLogin ? "current-password webauthn" : "new-password"}
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#313244] border border-[#45475a] text-[#cdd6f4] placeholder-[#6c7086] focus:ring-2 focus:ring-[#cba6f7] focus:border-[#cba6f7] outline-none transition-shadow"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 text-[#1e1e2e] py-3 rounded-xl font-bold transition-all shadow-lg disabled:opacity-70 disabled:cursor-not-allowed ${
                isLive 
                  ? 'bg-[#cba6f7] hover:bg-[#cba6f7]/90 shadow-[#cba6f7]/20' 
                  : 'bg-[#89b4fa] hover:bg-[#89b4fa]/90 shadow-[#89b4fa]/20'
              }`}
            >
              {loading ? (
                <span>Wird geladen...</span>
              ) : (
                <>
                  <span>{isLogin ? 'Starten' : 'Kostenlos erstellen'}</span>
                  {isLogin ? <Fingerprint className="w-5 h-5 opacity-50" /> : <ArrowRight className="w-5 h-5" />}
                </>
              )}
            </button>
          </form>
          
          {!isLive && (
             <p className="mt-6 text-center text-xs text-[#6c7086]">
               Hinweis: Ohne Firebase werden Daten nur in diesem Browser gespeichert.
             </p>
          )}
        </div>
      </div>
    </div>
  );
};
