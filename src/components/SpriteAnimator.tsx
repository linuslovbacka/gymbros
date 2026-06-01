import { useEffect, useRef, useState } from 'react';

// Plays a clip from a spritesheet using `atlas` metadata (spec section 15:
// "play animation from spritesheet + atlas JSON; support static-frame fallback
// with code-driven motion"). When the atlas is missing or has a single frame we
// fall through to a static frame — the parent applies CSS motion as the
// fallback. This is the Phase-8-ready path; until approved art exists the
// resolver returns null and the SVG placeholder is shown instead.

export interface AtlasClip {
  /** Row index in the sheet (0-based). */
  row: number;
  /** Number of frames in the clip. */
  frames: number;
  /** Playback rate. */
  fps: number;
}

export interface AtlasMeta {
  frameWidth: number;
  frameHeight: number;
  clips: Record<string, AtlasClip>;
}

export function SpriteAnimator({ imageUrl, atlas, clip, flip }: {
  imageUrl: string;
  atlas: AtlasMeta | null;
  clip: string;
  flip?: boolean;
}) {
  const active = atlas?.clips[clip] ?? atlas?.clips.idle;
  const [frame, setFrame] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!atlas || !active || active.frames <= 1) return;
    let last = performance.now();
    let f = 0;
    const step = (now: number) => {
      if (now - last >= 1000 / active.fps) {
        f = (f + 1) % active.frames;
        setFrame(f);
        last = now;
      }
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [atlas, active]);

  if (!atlas || !active) {
    return (
      <img
        src={imageUrl}
        alt=""
        style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated', transform: flip ? 'scaleX(-1)' : undefined }}
      />
    );
  }

  const { frameWidth, frameHeight } = atlas;
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundImage: `url(${imageUrl})`,
        backgroundPosition: `-${frame * frameWidth}px -${active.row * frameHeight}px`,
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
        transform: flip ? 'scaleX(-1)' : undefined,
      }}
    />
  );
}
