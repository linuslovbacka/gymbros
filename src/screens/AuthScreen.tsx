import { useState } from 'react';
import { useApp } from '../state/store';

type Mode = 'in' | 'up' | 'forgot';

export function AuthScreen() {
  const { signInWithEmail, signUpWithEmail, resetPasswordForEmail } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<Mode>('in');
  const [error, setError] = useState<string>();
  const [info, setInfo] = useState<string>();
  const [busy, setBusy] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError(undefined);
    setInfo(undefined);
    if (next === 'forgot') setPassword('');
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    setInfo(undefined);
    setBusy(true);

    if (mode === 'forgot') {
      const { error: err } = await resetPasswordForEmail(email);
      setBusy(false);
      if (err) setError(err);
      else setInfo('Check your email for a reset link.');
      return;
    }

    const fn = mode === 'in' ? signInWithEmail : signUpWithEmail;
    const { error: err } = await fn(email, password);
    setBusy(false);
    if (err) setError(err);
    else if (mode === 'up') setInfo('Check your email to confirm, then sign in.');
  }

  const title =
    mode === 'forgot' ? 'Reset your password' : mode === 'up' ? 'Create your account' : 'Sign in';

  return (
    <div className="gate">
      <div>
        <div className="logo">GYMBROS</div>
        <div className="tagline">Two bros. One rivalry. Infinite gains.</div>
      </div>

      <form className="stack" onSubmit={submit}>
        <div className="muted" style={{ fontSize: 13, textAlign: 'center' }}>{title}</div>
        <input
          className="field"
          type="email"
          placeholder="Email"
          value={email}
          autoComplete="email"
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        {mode !== 'forgot' && (
          <input
            className="field"
            type="password"
            placeholder="Password"
            value={password}
            autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        )}
        {mode === 'in' && (
          <button
            type="button"
            className="btn btn-ghost"
            style={{ alignSelf: 'flex-end', marginTop: -8, fontSize: 13 }}
            onClick={() => switchMode('forgot')}
          >
            Forgot password?
          </button>
        )}
        {error && <div className="error">{error}</div>}
        {info && <div className="muted" style={{ fontSize: 13 }}>{info}</div>}
        <button className="btn btn-primary btn-block" disabled={busy} type="submit">
          {mode === 'forgot' ? 'Send reset link' : mode === 'in' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      {mode === 'forgot' ? (
        <button className="btn btn-ghost btn-block" onClick={() => switchMode('in')}>
          Back to sign in
        </button>
      ) : (
        <button className="btn btn-ghost btn-block" onClick={() => switchMode(mode === 'in' ? 'up' : 'in')}>
          {mode === 'in' ? 'No account? Sign up' : 'Have an account? Sign in'}
        </button>
      )}
    </div>
  );
}
