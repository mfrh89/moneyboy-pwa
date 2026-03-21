
import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, AlertCircle, Fingerprint } from 'lucide-react';
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
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="bg-surface-lowest w-full max-w-md rounded-ds-lg shadow-float overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="bg-primary p-8 text-center transition-colors relative overflow-hidden">
          <div className="relative z-10 mb-4">
            <img src="/icon-192.png" alt="Moneyboy" className="w-16 h-16 rounded-ds-md mx-auto" />
          </div>
          <h1 className="relative z-10 text-3xl font-bold text-on-primary mb-2 tracking-tight">Moneyboy</h1>
          <p className="relative z-10 text-on-primary/70 font-medium text-sm">
            {isLive ? 'Deine Finanzen in der Cloud.' : 'Lokaler Demo Modus'}
          </p>
        </div>

        <div className="p-8">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => { setIsLogin(true); setError(null); }}
              className={`flex-1 pb-2 text-sm font-bold border-b-2 transition-colors ${
                isLogin ? 'border-primary text-primary' : 'border-transparent text-outline-variant hover:text-on-surface-variant'
              }`}
            >
              Anmelden
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(null); }}
              className={`flex-1 pb-2 text-sm font-bold border-b-2 transition-colors ${
                !isLogin ? 'border-primary text-primary' : 'border-transparent text-outline-variant hover:text-on-surface-variant'
              }`}
            >
              Registrieren
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-surface-high text-on-surface text-sm rounded-ds-md flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-on-surface-variant mb-1">E-Mail Adresse</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-5 h-5 text-outline-variant" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="username webauthn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-ds-md bg-surface-low text-on-surface placeholder-outline-variant focus:ring-2 focus:ring-primary focus:bg-surface-highest outline-none transition-all"
                  placeholder="name@beispiel.de"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-on-surface-variant mb-1">Passwort</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-5 h-5 text-outline-variant" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete={isLogin ? "current-password webauthn" : "new-password"}
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-ds-md bg-surface-low text-on-surface placeholder-outline-variant focus:ring-2 focus:ring-primary focus:bg-surface-highest outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 text-on-primary py-3 rounded-ds-md font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed bg-primary hover:bg-primary-container"
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
             <p className="mt-6 text-center text-xs text-outline-variant">
               Hinweis: Ohne Firebase werden Daten nur in diesem Browser gespeichert.
             </p>
          )}
        </div>
      </div>
    </div>
  );
};
