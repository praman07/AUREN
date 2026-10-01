import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useSignIn } from '../../../core/auth/providers/MockClerkProvider';
import { AuthSplitLayout } from './layout/AuthSplitLayout';

export const LoginForm: React.FC = () => {
  const { signIn, isLoaded } = useSignIn();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = (location.state as any)?.from?.pathname || '/dashboard';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!isLoaded || !signIn) return;
      
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        navigate(from, { replace: true });
      } else {
        setError('Verification required. Check your email.');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthSplitLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-1">Sign in to EKOS</h1>
        <p className="text-sm text-muted-foreground">Enter your enterprise credentials to continue.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-600 font-medium">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground uppercase tracking-wide">Work Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-10 px-3 bg-white border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
            placeholder="name@company.com"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wide">Password</label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline font-medium">
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-10 px-3 bg-white border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-10 mt-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Authenticating...
            </>
          ) : (
            'Continue'
          )}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-border/50 text-center">
        <p className="text-xs font-medium text-muted-foreground mb-2">Development Demo Accounts:</p>
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            type="button"
            onClick={() => { setEmail('admin@ekos.app'); setPassword('admin12345'); }}
            className="px-2.5 py-1 bg-muted hover:bg-muted/80 text-foreground text-xs rounded transition-colors"
          >
            System Admin
          </button>
          <button
            type="button"
            onClick={() => { setEmail('praman.bhogal@northstar-test.local'); setPassword('password123'); }}
            className="px-2.5 py-1 bg-muted hover:bg-muted/80 text-foreground text-xs rounded transition-colors"
          >
            Praman Bhogal (Dept Head)
          </button>
          <button
            type="button"
            onClick={() => { setEmail('alice@ekos.app'); setPassword('alice12345'); }}
            className="px-2.5 py-1 bg-muted hover:bg-muted/80 text-foreground text-xs rounded transition-colors"
          >
            Alice (Engineering)
          </button>
          <button
            type="button"
            onClick={() => { setEmail('bob@ekos.app'); setPassword('bob12345'); }}
            className="px-2.5 py-1 bg-muted hover:bg-muted/80 text-foreground text-xs rounded transition-colors"
          >
            Bob (HR)
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Don't have an account?{' '}
          <Link to="/signup" className="text-primary hover:underline font-medium">
            Contact your IT Administrator
          </Link>
        </p>
      </div>
    </AuthSplitLayout>
  );
};
