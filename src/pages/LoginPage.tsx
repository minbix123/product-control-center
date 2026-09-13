import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RetroButton } from '../components/ui/RetroButton';
import { LogIn, Mail, Lock, User } from 'lucide-react';

export function LoginPage() {
  const { loginWithGoogle, loginWithEmail, signUpWithEmail, error: authError, loading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [localError, setLocalError] = useState('');
  const navigate = useNavigate();

  const error = localError || authError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!email.trim() || !password.trim()) {
      setLocalError('Email and password are required');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }
    if (isSignUp && !name.trim()) {
      setLocalError('Name is required');
      return;
    }

    try {
      if (isSignUp) {
        await signUpWithEmail(email.trim(), password, name.trim());
      } else {
        await loginWithEmail(email.trim(), password);
      }
      navigate('/dashboard');
    } catch {
      // Error is set in auth context
    }
  };

  return (
    <div className="aqua-bg min-h-screen flex items-center justify-center p-4 relative">
      {/* Subtle background grid */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `radial-gradient(circle, #000 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
      }} />

      <div className="aqua-window w-full max-w-md relative z-10">
        {/* Titlebar */}
        <div className="aqua-titlebar">
          <div className="traffic-lights">
            <span className="traffic-light traffic-light-close" />
            <span className="traffic-light traffic-light-minimize" />
            <span className="traffic-light traffic-light-maximize" />
          </div>
          <span className="aqua-titlebar-title">Product Control Center</span>
          <div className="w-16" />
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
              <span className="text-3xl">⚙️</span>
            </div>
            <h1 className="text-xl font-bold text-[var(--aqua-text)] mb-1">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-sm text-[var(--aqua-text-muted)]">
              {isSignUp ? 'Set up your Product Control Center account' : 'Sign in to your Product Control Center'}
            </p>
          </div>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md p-3 mb-4 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="aqua-label" htmlFor="login-name">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--aqua-text-muted)]" />
                  <input
                    id="login-name"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="aqua-input pl-10"
                    placeholder="Your full name"
                    autoFocus={isSignUp}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="aqua-label" htmlFor="login-email">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--aqua-text-muted)]" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="aqua-input pl-10"
                  placeholder="you@company.com"
                  autoFocus={!isSignUp}
                  required
                />
              </div>
            </div>

            <div>
              <label className="aqua-label" htmlFor="login-password">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--aqua-text-muted)]" />
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="aqua-input pl-10"
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>
            </div>

            <RetroButton type="submit" variant="primary" size="lg" fullWidth loading={loading} icon={LogIn}>
              {isSignUp ? 'Create Account' : 'Sign In'}
            </RetroButton>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[var(--aqua-border)]" />
            <span className="text-xs text-[var(--aqua-text-muted)]">or</span>
            <div className="flex-1 h-px bg-[var(--aqua-border)]" />
          </div>

          {/* Google OAuth */}
          <RetroButton variant="secondary" size="lg" fullWidth onClick={loginWithGoogle}>
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </RetroButton>

          {/* Toggle mode */}
          <p className="text-center text-xs text-[var(--aqua-text-muted)] mt-6">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setLocalError(''); }}
              className="text-[#3b82f6] hover:underline font-medium"
              type="button"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
