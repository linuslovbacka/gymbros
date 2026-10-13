export const TIMER_DONE_SRC = '/sounds/timer-done.wav';
export const TIMER_ALARM_REPEATS = 5;

let unlocked: HTMLAudioElement | null = null;

function makeAudio(): HTMLAudioElement {
  const audio = new Audio(TIMER_DONE_SRC);
  audio.preload = 'auto';
  return audio;
}

/** Call from a Start tap so later autoplay is allowed. */
export function unlockTimerAlarm(): void {
  if (typeof window === 'undefined') return;
  if (!unlocked) unlocked = makeAudio();
  const a = unlocked;
  a.currentTime = 0;
  const p = a.play();
  if (p) {
    void p.then(() => {
      a.pause();
      a.currentTime = 0;
    }).catch(() => {});
  }
}

export function stopTimerAlarm(): void {
  if (!unlocked) return;
  unlocked.pause();
  unlocked.currentTime = 0;
  unlocked.onended = null;
}

/** Play the done clip `repeats` times in sequence. */
export function playTimerAlarm(repeats = TIMER_ALARM_REPEATS): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  stopTimerAlarm();
  const audio = unlocked ?? makeAudio();
  unlocked = audio;

  return new Promise((resolve) => {
    let left = Math.max(1, repeats);
    const failSafe = window.setTimeout(() => {
      audio.onended = null;
      resolve();
    }, repeats * 4000);
    const playOnce = () => {
      audio.currentTime = 0;
      const p = audio.play();
      if (p) void p.catch(() => {});
    };
    audio.onended = () => {
      left -= 1;
      if (left <= 0) {
        audio.onended = null;
        window.clearTimeout(failSafe);
        resolve();
        return;
      }
      playOnce();
    };
    playOnce();
  });
}
