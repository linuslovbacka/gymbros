import { useState } from 'react';
import { useApp } from '../state/store';

export function AuthScreen() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    setBusy(true);
    const fn = mode === 'in' ? signInWithEmail : signUpWithEmail;
    const { error } = await fn(email, password);
    setBusy(false);
    if (error) setError(error);
    else if (mode === 'up') setError('Check your email to confirm, then sign in.');
  }

  return (
    <div className="gate">
      <div>
        <div className="logo">GYMBROS</div>
        <div className="tagline">Two bros. One rivalry. Infinite gains.</div>
      </div>

      <button className="btn btn-primary btn-block" onClick={() => void signInWithGoogle()}>
        Continue with Google
      </button>

      <div className="divider">or</div>

      <form className="stack" onSubmit={submit}>
        <input
          className="field"
          type="email"
          placeholder="Email"
          value={email}
          autoComplete="email"
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="field"
          type="password"
          placeholder="Password"
          value={password}
          autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <div className="error">{error}</div>}
        <button className="btn btn-block" disabled={busy} type="submit">
          {mode === 'in' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      <button className="btn btn-ghost btn-block" onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setError(undefined); }}>
        {mode === 'in' ? 'No account? Sign up' : 'Have an account? Sign in'}
      </button>
    </div>
  );
}
