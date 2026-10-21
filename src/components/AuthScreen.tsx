import React, { useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { Activity, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';

type AuthMode = 'login' | 'signup';

interface AuthScreenProps {
  onContinueWithoutAccount: () => void;
  onAuthenticated: () => void;
}

export function AuthScreen({ onContinueWithoutAccount, onAuthenticated }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [providerNotice, setProviderNotice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setErrors({});
    setProviderNotice(false);
    setSuccessMessage('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      nextErrors.email = 'Enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!password) {
      nextErrors.password = 'Enter your password.';
    } else if (mode === 'signup' && password.length < 8) {
      nextErrors.password = 'Use at least 8 characters.';
    }

    if (mode === 'signup' && password !== confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(nextErrors);
    setProviderNotice(false);
    setSuccessMessage('');
    if (Object.keys(nextErrors).length > 0) return;
    if (!supabase || !isSupabaseConfigured) {
      setProviderNotice(true);
      return;
    }
    setLoading(true);
    try {
      const result = mode === 'signup'
        ? await supabase.auth.signUp({
            email: normalizedEmail,
            password,
            options: { emailRedirectTo: window.location.origin },
          })
        : await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
      if (result.error) throw result.error;
      if (mode === 'signup' && !result.data.session) {
        setSuccessMessage('Account created. Check your email for a confirmation link, then return here to log in.');
      } else {
        onAuthenticated();
      }
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        form: error instanceof Error ? error.message : 'Authentication failed. Please try again.',
      }));
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (hasError: boolean) =>
    `w-full rounded-xl border bg-zinc-950/80 py-3 pl-11 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/15 ${hasError ? 'border-rose-500/80' : 'border-zinc-800'}`;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 px-4 py-10 text-zinc-100">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-28 -top-24 h-80 w-80 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <section className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-400/40 bg-violet-500/15 text-xl font-black text-violet-200 shadow-[0_0_28px_rgba(176,38,255,0.18)]">
            Pf
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome to PulseFit</h1>
          <p className="mt-2 max-w-xs text-sm leading-6 text-zinc-400">
            Your fitness journey, built around your goals.
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-2xl shadow-black/30 sm:p-7">
          <div className="grid grid-cols-2 rounded-xl border border-zinc-800 bg-zinc-950/70 p-1" aria-label="Account options">
            <button type="button" onClick={() => switchMode('login')} aria-pressed={mode === 'login'}
              className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${mode === 'login' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-200'}`}>
              Log in
            </button>
            <button type="button" onClick={() => switchMode('signup')} aria-pressed={mode === 'signup'}
              className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${mode === 'signup' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-200'}`}>
              Sign up
            </button>
          </div>

          <div className="mb-5 mt-6">
            <h2 className="text-lg font-bold">{mode === 'login' ? 'Good to see you again' : 'Create your account'}</h2>
            <p className="mt-1 text-sm text-zinc-500">
              {mode === 'login' ? 'Enter your details to continue.' : 'A few details to get started.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="auth-email" className="mb-1.5 block text-xs font-semibold text-zinc-300">Email address</label>
              <div className="relative">
                <Mail aria-hidden="true" className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input id="auth-email" name="email" type="email" autoComplete="email" value={email}
                  onChange={(event) => { setEmail(event.target.value); setErrors((prev) => ({ ...prev, email: '' })); setProviderNotice(false); }}
                  placeholder="you@example.com" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'auth-email-error' : undefined}
                  className={inputClass(Boolean(errors.email))} />
              </div>
              {errors.email && <p id="auth-email-error" role="alert" className="mt-1.5 text-xs text-rose-400">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="auth-password" className="mb-1.5 block text-xs font-semibold text-zinc-300">Password</label>
              <div className="relative">
                <LockKeyhole aria-hidden="true" className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input id="auth-password" name="password" type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password}
                  onChange={(event) => { setPassword(event.target.value); setErrors((prev) => ({ ...prev, password: '' })); setProviderNotice(false); }}
                  placeholder={mode === 'signup' ? 'At least 8 characters' : 'Enter your password'}
                  aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'auth-password-error' : undefined}
                  className={`${inputClass(Boolean(errors.password))} pr-12`} />
                <button type="button" onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-500 hover:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-violet-400">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p id="auth-password-error" role="alert" className="mt-1.5 text-xs text-rose-400">{errors.password}</p>}
            </div>

            {mode === 'signup' && (
              <div>
                <label htmlFor="auth-confirm-password" className="mb-1.5 block text-xs font-semibold text-zinc-300">Confirm password</label>
                <div className="relative">
                  <LockKeyhole aria-hidden="true" className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input id="auth-confirm-password" name="confirmPassword" type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password" value={confirmPassword}
                    onChange={(event) => { setConfirmPassword(event.target.value); setErrors((prev) => ({ ...prev, confirmPassword: '' })); setProviderNotice(false); }}
                    placeholder="Re-enter your password" aria-invalid={Boolean(errors.confirmPassword)}
                    aria-describedby={errors.confirmPassword ? 'auth-confirm-password-error' : undefined}
                    className={inputClass(Boolean(errors.confirmPassword))} />
                </div>
                {errors.confirmPassword && <p id="auth-confirm-password-error" role="alert" className="mt-1.5 text-xs text-rose-400">{errors.confirmPassword}</p>}
              </div>
            )}

            {errors.form && <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{errors.form}</p>}
            {successMessage && <p role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">{successMessage}</p>}
            {providerNotice && (
              <div role="status" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-sm leading-5 text-amber-100">
                <p className="font-semibold">Authentication is not configured for this deployment.</p>
                <p className="mt-1 text-amber-100/75">Your details have not been submitted or saved. Check the Supabase environment variables and redeploy this preview.</p>
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full rounded-xl bg-violet-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-400 disabled:cursor-wait disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:ring-offset-2 focus:ring-offset-zinc-900">
              {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-wider text-zinc-600">
            <span className="h-px flex-1 bg-zinc-800" /> or <span className="h-px flex-1 bg-zinc-800" />
          </div>

          <button type="button" onClick={onContinueWithoutAccount}
            className="w-full rounded-xl border border-zinc-700 px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800/70 focus:outline-none focus:ring-2 focus:ring-violet-400">
            Continue without an account
          </button>

          <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-zinc-950/60 p-3 text-xs leading-5 text-zinc-500">
            <ShieldCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            <p>{isSupabaseConfigured ? 'Secure sign-in powered by Supabase. Email confirmation may be required for new accounts.' : 'You can still use PulseFit locally without an account; your fitness data stays in this browser.'}</p>
          </div>
        </div>

        <p className="mt-5 flex items-center justify-center gap-2 text-xs text-zinc-600">
          <Activity aria-hidden="true" className="h-3.5 w-3.5" /> Small steps. Stronger habits.
        </p>
      </section>
    </main>
  );
}
