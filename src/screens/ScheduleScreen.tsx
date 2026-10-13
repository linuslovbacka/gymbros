'use client';

import Link from 'next/link';
import { useApp } from '@/state/store';
import {
  buildScheduleProgramOverview,
  SCHEDULE_GENERAL_LEAD,
  SCHEDULE_TRAIN_LEAD,
  SICK_TRAINING_GUIDE,
  SORENESS_TRAINING_GUIDE,
  type ScheduleProgramRow,
} from '@/content/schedule';
import { SICK_DAY_SCHEDULE_NOTE } from '@/content/diet';
import { weekTimelineMap } from '@/components/HabitTimeline';
import { ScheduleWeekStrip } from '@/components/ScheduleWeekStrip';
import { useHabitHistory } from '@/hooks/useHabitHistory';

const EXTRA_ROUTINE_TITLES = new Set(['Skills', 'Glute day', 'Mobility', 'Conditioning']);

function ProgramModeCard({ heading, rows }: { heading: string; rows: ScheduleProgramRow[] }) {
  const dividerAt = rows.findIndex(
    (r) => r.kind === 'block' && EXTRA_ROUTINE_TITLES.has(r.title),
  );
  const mainRows = dividerAt >= 0 ? rows.slice(0, dividerAt) : rows;
  const extraRows = dividerAt >= 0 ? rows.slice(dividerAt) : [];

  return (
    <div className="llplay-details-card">
      <h3 className="llplay-details-card-title">{heading}</h3>
      {mainRows.map((row) =>
        row.kind === 'beginner' ? (
          <div key="beginner" className="llplay-details-row">
            <div className="llplay-details-row-split">
              <span className="llplay-details-row-title">Beginner</span>
              <span className="llplay-details-row-title">W1-3</span>
            </div>
            <p className="llplay-details-row-sub">{row.sub}</p>
          </div>
        ) : (
          <div key={row.title} className="llplay-details-row">
            <p className="llplay-details-row-title">{row.title}</p>
            <p className="llplay-details-row-sub">{row.sub}</p>
          </div>
        ),
      )}
      {extraRows.length > 0 && <hr className="llplay-details-divider" />}
      {extraRows.map((row) =>
        row.kind === 'block' ? (
          <div key={row.title} className="llplay-details-row">
            <p className="llplay-details-row-title">{row.title}</p>
            <p className="llplay-details-row-sub">{row.sub}</p>
          </div>
        ) : null,
      )}
    </div>
  );
}

function GuideSection({ heading, paragraphs }: { heading: string; paragraphs: readonly string[] }) {
  return (
    <div className="llplay-details-row">
      <p className="llplay-details-row-title">{heading}</p>
      <div className="llplay-details-prose">
        {paragraphs.map((line) => (
          <p key={line} className="llplay-details-row-sub">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

function GuideCard({
  title,
  disclaimer,
  sections,
  footnote,
}: {
  title: string;
  disclaimer: string;
  sections: { heading: string; paragraphs: readonly string[] }[];
  footnote?: string;
}) {
  return (
    <div className="llplay-details-card">
      <h3 className="llplay-details-card-title">{title}</h3>
      <p className="llplay-details-card-lead">{disclaimer}</p>
      {sections.map((sec) => (
        <GuideSection key={sec.heading} heading={sec.heading} paragraphs={sec.paragraphs} />
      ))}
      {footnote && <p className="llplay-details-card-lead">{footnote}</p>}
    </div>
  );
}

export function ScheduleScreen({
  embedded = false,
  variant = 'default',
}: {
  embedded?: boolean;
  variant?: 'default' | 'llplay';
}) {
  const { user, profile, habitsToday } = useApp();
  const { days: historyDays } = useHabitHistory(user?.id, profile, habitsToday, 7);
  const weekByDate = weekTimelineMap(historyDays);
  const sickToday = habitsToday?.sick ?? false;

  if (!profile) return null;

  if (embedded && variant === 'llplay') {
    const overview = buildScheduleProgramOverview(profile, user?.id);

    return (
      <div className="llplay-details-pane llplay-details-pane--schedule">
        <div className="llplay-details-general">
          <h2 className="llplay-details-general-title">general</h2>
          <p className="llplay-details-general-lead">{SCHEDULE_GENERAL_LEAD}</p>
        </div>

        <ProgramModeCard heading={overview.home.heading} rows={overview.home.rows} />
        <ProgramModeCard heading={overview.gym.heading} rows={overview.gym.rows} />

        <div className="llplay-details-card">
          <h3 className="llplay-details-card-title">This week</h3>
          <p className="llplay-details-card-lead">
            Mon–Sat are training days when you&apos;re well; Sunday is rest. Habit scores show how the day went — open
            TRAIN on home for today&apos;s session.
          </p>
          <ScheduleWeekStrip sickToday={sickToday} weekByDate={weekByDate} />
          {sickToday && <p className="llplay-details-schedule-note">{SICK_DAY_SCHEDULE_NOTE}</p>}
        </div>

        <GuideCard
          title={SORENESS_TRAINING_GUIDE.title}
          disclaimer={SORENESS_TRAINING_GUIDE.disclaimer}
          sections={[
            { heading: 'Usually OK', paragraphs: SORENESS_TRAINING_GUIDE.ok },
            { heading: SORENESS_TRAINING_GUIDE.swapTitle, paragraphs: SORENESS_TRAINING_GUIDE.swap },
            { heading: SORENESS_TRAINING_GUIDE.backOffTitle, paragraphs: SORENESS_TRAINING_GUIDE.backOff },
          ]}
        />

        <GuideCard
          title={SICK_TRAINING_GUIDE.title}
          disclaimer={SICK_TRAINING_GUIDE.disclaimer}
          sections={[
            { heading: SICK_TRAINING_GUIDE.skipTitle, paragraphs: SICK_TRAINING_GUIDE.skip },
            { heading: SICK_TRAINING_GUIDE.easyTitle, paragraphs: SICK_TRAINING_GUIDE.easy },
            { heading: SICK_TRAINING_GUIDE.comebackTitle, paragraphs: SICK_TRAINING_GUIDE.comeback },
          ]}
        />
      </div>
    );
  }

  return (
    <div className={embedded ? 'llplay-details-pane' : 'screen'}>
      {!embedded && (
        <div className="topbar">
          <Link className="back" href="/">
            Back
          </Link>
          <div className="topbar-title">Schedule</div>
        </div>
      )}

      <section className="stack">
        <h2 className="section-title">This week</h2>
        <p className="muted">{SCHEDULE_TRAIN_LEAD}</p>
        <p className="muted tiny">
          Mon–Sat are training days when you&apos;re well; Sunday is rest. Habit scores show how the day went — open
          TRAIN on home for today&apos;s session.
        </p>
        <ScheduleWeekStrip sickToday={sickToday} weekByDate={weekByDate} />
        {sickToday && <p className="muted schedule-sick-note">{SICK_DAY_SCHEDULE_NOTE}</p>}
      </section>

      <section className="stack">
        <h2 className="section-title">{SORENESS_TRAINING_GUIDE.title}</h2>
        <p className="muted tiny">{SORENESS_TRAINING_GUIDE.disclaimer}</p>
        <p className="muted">
          <strong>{SORENESS_TRAINING_GUIDE.okTitle}</strong>
        </p>
        <ul className="schedule-list muted">
          {SORENESS_TRAINING_GUIDE.ok.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="muted">
          <strong>{SORENESS_TRAINING_GUIDE.swapTitle}</strong>
        </p>
        <ul className="schedule-list muted">
          {SORENESS_TRAINING_GUIDE.swap.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="muted">
          <strong>{SORENESS_TRAINING_GUIDE.backOffTitle}</strong>
        </p>
        <ul className="schedule-list muted">
          {SORENESS_TRAINING_GUIDE.backOff.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="muted tiny">{SORENESS_TRAINING_GUIDE.appNote}</p>
      </section>

      <section className="stack">
        <h2 className="section-title">{SICK_TRAINING_GUIDE.title}</h2>
        <p className="muted tiny">{SICK_TRAINING_GUIDE.disclaimer}</p>
        <p className="muted">
          <strong>{SICK_TRAINING_GUIDE.skipTitle}</strong>
        </p>
        <ul className="schedule-list muted">
          {SICK_TRAINING_GUIDE.skip.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="muted">
          <strong>{SICK_TRAINING_GUIDE.easyTitle}</strong>
        </p>
        <ul className="schedule-list muted">
          {SICK_TRAINING_GUIDE.easy.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="muted">
          <strong>{SICK_TRAINING_GUIDE.comebackTitle}</strong>
        </p>
        <ul className="schedule-list muted">
          {SICK_TRAINING_GUIDE.comeback.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
