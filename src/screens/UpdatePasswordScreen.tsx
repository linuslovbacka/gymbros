import { useState } from 'react';
import { useApp } from '../state/store';

export function UpdatePasswordScreen() {
  const { updatePassword } = useApp();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    if (password.length < 8) {
      setError('Use at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    const { error: err } = await updatePassword(password);
    setBusy(false);
    if (err) setError(err);
  }

  return (
    <div className="gate">
      <div>
        <div className="logo">GYMBROS</div>
        <div className="tagline">Choose a new password</div>
      </div>

      <form className="stack" onSubmit={submit}>
        <input
          className="field"
          type="password"
          placeholder="New password"
          value={password}
          autoComplete="new-password"
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
        <input
          className="field"
          type="password"
          placeholder="Confirm password"
          value={confirm}
          autoComplete="new-password"
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={8}
        />
        {error && <div className="error">{error}</div>}
        <button className="btn btn-primary btn-block" disabled={busy} type="submit">
          Save password
        </button>
      </form>
    </div>
  );
}
