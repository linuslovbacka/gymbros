import { useState } from 'react';
import { useApp } from '../state/store';

// Linus generates a code and shares it; Oskar enters it (spec section 11).
export function PairScreen() {
  const { createPair, joinPair, signOut } = useApp();
  const [code, setCode] = useState('');
  const [generated, setGenerated] = useState<string>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function generate() {
    setBusy(true);
    try { setGenerated(await createPair()); }
    catch { setError('Could not create a pair. Try again.'); }
    setBusy(false);
  }

  async function join() {
    setBusy(true);
    setError(undefined);
    const { error } = await joinPair(code);
    setBusy(false);
    if (error) setError(error);
  }

  return (
    <div className="gate">
      <div>
        <div className="logo" style={{ fontSize: 40 }}>FIND YOUR BRO</div>
        <div className="tagline">Pair up to put your avatars side by side.</div>
      </div>

      {generated ? (
        <div className="stack">
          <div className="tiny">Share this code with your bro</div>
          <div className="invite-code">{generated}</div>
          <div className="muted" style={{ fontSize: 13, textAlign: 'center' }}>
            Once they enter it, you'll both show up on the VS screen. Waiting for them to join...
          </div>
        </div>
      ) : (
        <>
          <button className="btn btn-primary btn-block" onClick={() => void generate()} disabled={busy}>
            Create a pair
          </button>

          <div className="divider">or join with a code</div>

          <div className="stack">
            <input
              className="field"
              placeholder="6-character code"
              value={code}
              maxLength={6}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              style={{ textTransform: 'uppercase', letterSpacing: '0.3em', textAlign: 'center' }}
            />
            {error && <div className="error">{error}</div>}
            <button className="btn btn-block" onClick={() => void join()} disabled={busy || code.length < 4}>
              Join
            </button>
          </div>
        </>
      )}

      <div className="spacer" />
      <button className="btn btn-ghost btn-block muted" onClick={() => void signOut()}>Sign out</button>
    </div>
  );
}
