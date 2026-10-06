'use client';

import { useCallback, useState } from 'react';
import {
  VIDEO_POSTER_FALLBACK,
  isYoutubePlaceholderPoster,
  youtubePosterUrl,
} from '@/content/exercise-media';

export function ExerciseVideoPoster({
  videoId,
  rungName,
  onPlay,
}: {
  videoId: string;
  rungName: string;
  onPlay: () => void;
}) {
  const [src, setSrc] = useState(() => youtubePosterUrl(videoId, 'maxres'));
  const [qualityStep, setQualityStep] = useState(0);
  const [useFallback, setUseFallback] = useState(false);

  const goFallback = useCallback(() => {
    setUseFallback(true);
    setSrc(VIDEO_POSTER_FALLBACK);
  }, []);

  const handleError = useCallback(() => {
    if (useFallback) return;
    if (qualityStep === 0) {
      setQualityStep(1);
      setSrc(youtubePosterUrl(videoId, 'hq'));
      return;
    }
    if (qualityStep === 1) {
      setQualityStep(2);
      setSrc(youtubePosterUrl(videoId, 'sd'));
      return;
    }
    goFallback();
  }, [goFallback, qualityStep, useFallback, videoId]);

  const handleLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      if (useFallback) return;
      const { naturalWidth, naturalHeight } = e.currentTarget;
      if (isYoutubePlaceholderPoster(naturalWidth, naturalHeight)) {
        if (qualityStep < 2) {
          const next = qualityStep === 0 ? 'hq' : 'sd';
          setQualityStep(qualityStep + 1);
          setSrc(youtubePosterUrl(videoId, next === 'hq' ? 'hq' : 'sd'));
          return;
        }
        goFallback();
      }
    },
    [goFallback, qualityStep, useFallback, videoId],
  );

  return (
    <button
      type="button"
      className={`exercise-video-poster${useFallback ? ' is-fallback' : ''}`}
      onClick={onPlay}
      aria-label={`Load ${rungName} demo video`}
    >
      <img src={src} alt="" onError={handleError} onLoad={handleLoad} />
      <span className="exercise-video-play">▶ Watch demo</span>
    </button>
  );
}
