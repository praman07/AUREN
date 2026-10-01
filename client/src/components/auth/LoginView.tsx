import React, { useState } from 'react';
import { ArrowRight, Crown } from 'lucide-react';
import { Button } from '../ui/button';
import { useAuth } from '../../context/AuthContext';

interface LoginViewProps {
  onLogin?: (email: string) => void;
  onSuccess?: () => void;
  onNavigateSignup?: () => void;
  onNavigateOnboarding?: () => void;
  onGoToSignup?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLogin,
  onSuccess,
  onNavigateSignup,
  onNavigateOnboarding,
  onGoToSignup,
}) => {
  const { login, personas: _personas, switchPersona } = useAuth();
  const [email, setEmail] = useState('elena@example.com');
  const [password, setPassword] = useState('••••••••••••');
  const [isLoading, setIsLoading] = useState(false);

  const handleCompleteLogin = async (targetEmail: string, personaId?: string) => {
    setIsLoading(true);
    try {
      if (personaId) {
        await switchPersona(personaId);
      } else {
        await login(targetEmail);
      }

      if (onLogin) onLogin(targetEmail);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCompleteLogin(email);
  };

  const handleSignupClick = () => {
    if (onNavigateSignup) onNavigateSignup();
    else if (onGoToSignup) onGoToSignup();
  };

  return (
    <div className="min-h-screen w-full bg-[#FAFAFA] dark:bg-[#0A0B0D] flex flex-col justify-between p-6 sm:p-10 select-none text-neutral-900 dark:text-neutral-100">
      {/* Top Brand */}
      <div className="flex items-center justify-between max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm tracking-wider shadow-2xs">
            A
          </div>
          <span className="font-semibold text-base tracking-tight text-neutral-900 dark:text-neutral-100">
            AUREN
          </span>
        </div>

        {onNavigateOnboarding && (
          <button
            type="button"
            onClick={onNavigateOnboarding}
            className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1 font-medium"
          >
            <span>Take Onboarding Tour</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Center Auth Card */}
      <div className="max-w-md w-full mx-auto my-auto flex flex-col gap-6">
        <div className="flex flex-col gap-1.5 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Sign In to AUREN
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            Access your personal, departmental, or super-organizational knowledge vault.
          </p>
        </div>

        {/* 1-Click Role Login Cards (Real Seeded Accounts) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#141518] border border-neutral-200/80 dark:border-neutral-800/80 shadow-2xs space-y-2.5">
          <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block">
            Instant Demo Logins
          </span>

          {/* System Admin */}
          <button
            type="button"
            onClick={() => handleCompleteLogin('admin@ekos.app', 'persona_admin')}
            className="w-full p-2.5 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/40 hover:bg-amber-100/50 dark:bg-amber-950/20 dark:hover:bg-amber-950/40 transition-all flex items-center gap-3 text-left cursor-pointer group"
          >
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
                alt="System Admin"
                className="w-9 h-9 rounded-full object-cover ring-2 ring-amber-400 shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-0.5 text-white">
                <Crown className="w-2.5 h-2.5" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                  System Admin
                </span>
                <span className="text-[10px] font-bold uppercase bg-amber-500 text-white px-1.5 py-0.2 rounded">
                  Super Admin
                </span>
              </div>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block truncate">
                admin@ekos.app • Super Org Governance
              </span>
            </div>
          </button>

          {/* Praman Singh Bhogal (Core Arch Lead) */}
          <button
            type="button"
            onClick={() => handleCompleteLogin('praman.bhogal@northstar-test.local', 'persona_praman')}
            className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-[#1A1B1F] transition-all flex items-center gap-3 text-left cursor-pointer"
          >
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
              alt="Praman"
              className="w-9 h-9 rounded-full object-cover ring-1 ring-neutral-300 dark:ring-neutral-700 shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                  Praman Singh Bhogal
                </span>
                <span className="text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.2 rounded border border-blue-200 dark:border-blue-800">
                  Dept Head
                </span>
              </div>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block truncate">
                praman.bhogal@northstar-test.local • Core Architecture Lead
              </span>
            </div>
          </button>

          {/* Alice (Engineering) */}
          <button
            type="button"
            onClick={() => handleCompleteLogin('alice@ekos.app', 'persona_alice')}
            className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-[#1A1B1F] transition-all flex items-center gap-3 text-left cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0 ring-1 ring-emerald-300 dark:ring-emerald-700">
              AE
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                  Alice (Engineering)
                </span>
                <span className="text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">
                  Engineer
                </span>
              </div>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block truncate">
                alice@ekos.app • Senior Software Engineer
              </span>
            </div>
          </button>

          {/* Bob (HR) */}
          <button
            type="button"
            onClick={() => handleCompleteLogin('bob@ekos.app', 'persona_bob')}
            className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-[#1A1B1F] transition-all flex items-center gap-3 text-left cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-xs shrink-0 ring-1 ring-purple-300 dark:ring-purple-700">
              BH
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                  Bob (HR)
                </span>
                <span className="text-[10px] font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 px-1.5 py-0.2 rounded border border-purple-200 dark:border-purple-800">
                  HR Lead
                </span>
              </div>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block truncate">
                bob@ekos.app • HR Manager
              </span>
            </div>
          </button>
        </div>

        {/* Custom Form Login */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#141518] border border-neutral-200/80 dark:border-neutral-800/80 shadow-2xs flex flex-col gap-4">
          <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            Or Sign In with Email
          </span>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Work Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg bg-neutral-50 dark:bg-[#1B1C20] border border-neutral-200/80 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-400"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  Password
                </label>
                <span className="text-[10px] text-neutral-400">Demo: Any password</span>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg bg-neutral-50 dark:bg-[#1B1C20] border border-neutral-200/80 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-400"
              />
            </div>

            <Button
              variant="primary"
              size="md"
              type="submit"
              isLoading={isLoading}
              className="w-full mt-1 font-medium"
            >
              Sign In to Workspace
            </Button>
          </form>
        </div>

        {/* Footer Link */}
        <div className="text-center text-xs text-neutral-500 dark:text-neutral-400">
          Need a workspace invite?{' '}
          <button
            type="button"
            onClick={handleSignupClick}
            className="font-semibold text-neutral-900 dark:text-white underline underline-offset-2 cursor-pointer"
          >
            Create account
          </button>
        </div>
      </div>

      {/* Bottom Security Note */}
      <div className="max-w-md mx-auto text-center text-[11px] text-neutral-400">
        Protected by AUREN Sovereign Zero-Trust Knowledge Isolation.
      </div>
    </div>
  );
};
