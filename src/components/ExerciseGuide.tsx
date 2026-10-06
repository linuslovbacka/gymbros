'use client';

import { useState } from 'react';
import { resolveExerciseMedia } from '@/content/exercise-media';
import { ExerciseVideoPoster } from '@/components/ExerciseVideoPoster';

export function ExerciseGuide({
  exerciseId,
  rungName,
}: {
  exerciseId: string;
  rungName: string;
}) {
  const media = resolveExerciseMedia(exerciseId, rungName);
  const [loadVideo, setLoadVideo] = useState(false);

  const videoId = media.youtubeVideoId;
  const start = media.youtubeStartSec;
  const embedQuery =
    start != null && start > 0
      ? `?rel=0&start=${start}`
      : '?rel=0';

  return (
    <div className="exercise-guide">
      <div className="exercise-video">
        {videoId && loadVideo ? (
          <iframe
            title={`${rungName} demo`}
            src={`https://www.youtube-nocookie.com/embed/${videoId}${embedQuery}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        ) : videoId ? (
          <ExerciseVideoPoster
            videoId={videoId}
            rungName={rungName}
            onPlay={() => setLoadVideo(true)}
          />
        ) : media.watchUrl ? (
          <a className="exercise-video-link" href={media.watchUrl} target="_blank" rel="noopener noreferrer">
            Find a form video
          </a>
        ) : (
          <span className="muted">Demo coming soon</span>
        )}
      </div>

      {media.credit && <div className="exercise-media-credit tiny muted">{media.credit}</div>}

      <ul className="exercise-tips">
        {media.tips.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
    </div>
  );
}
