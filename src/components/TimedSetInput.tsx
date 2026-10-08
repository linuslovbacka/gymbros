'use client';

import { useEffect, useRef, useState } from 'react';

function formatDuration(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m > 0) return `${m}:${sec.toString().padStart(2, '0')}`;
  return `${sec}`;
}

function formatGoalRange(low: number, high: number): string {
  if (low === high) return `${formatDuration(low)} s`;
  if (low >= 60 || high >= 60) {
    return `${formatDuration(low)} – ${formatDuration(high)}`;
  }
  return `${low}–${high} s`;
}

export function TimedSetInput({
  label,
  targetLow,
  targetHigh,
  value,
  onChange,
}: {
  label: string;
  targetLow: number;
  targetHigh: number;
  value: number;
  onChange: (seconds: number) => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [logged, setLogged] = useState(value > 0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;
      return;
    }
    tickRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [running]);

  const metTarget = elapsed >= targetLow;
  const displaySec = running || elapsed > 0 ? elapsed : logged ? value : 0;

  function start() {
    setLogged(false);
    setElapsed(0);
    setRunning(true);
  }

  function pause() {
    setRunning(false);
  }

  function resume() {
    setRunning(true);
  }

  function logSet() {
    setRunning(false);
    const sec = Math.max(1, elapsed);
    onChange(sec);
    setLogged(true);
    setElapsed(0);
  }

  function reset() {
    setRunning(false);
    setElapsed(0);
    setLogged(false);
    onChange(0);
  }

  return (
    <div className="superset-set-block timed-set">
      <div className="superset-set-label">{label}</div>
      <p className="timed-set-goal muted">Goal: {formatGoalRange(targetLow, targetHigh)}</p>
      <div className={`timed-set-display${running ? ' is-running' : ''}`} aria-live="polite">
        {formatDuration(displaySec)}
      </div>
      {logged && !running && elapsed === 0 && (
        <p className="timed-set-logged muted tiny">Saved for this set</p>
      )}
      {running && metTarget && targetLow !== targetHigh && (
        <p className="timed-set-met tiny">Minimum reached — stop when you feel warm.</p>
      )}
      <div className="timed-set-actions">
        {!running && elapsed === 0 && !logged && (
          <button type="button" className="btn btn-primary" onClick={start}>
            Start timer
          </button>
        )}
        {running && (
          <>
            <button type="button" className="btn" onClick={pause}>
              Pause
            </button>
            <button type="button" className="btn btn-primary" onClick={logSet}>
              Log time
            </button>
          </>
        )}
        {!running && elapsed > 0 && !logged && (
          <>
            <button type="button" className="btn" onClick={resume}>
              Resume
            </button>
            <button type="button" className="btn btn-primary" onClick={logSet}>
              Log time
            </button>
            <button type="button" className="btn" onClick={reset}>
              Reset
            </button>
          </>
        )}
        {logged && !running && elapsed === 0 && (
          <button type="button" className="btn" onClick={reset}>
            Time again
          </button>
        )}
      </div>
    </div>
  );
}
