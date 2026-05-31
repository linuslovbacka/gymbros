import { useState } from 'react';
import { useApp } from './state/store';
import { AuthScreen } from './screens/AuthScreen';
import { PairScreen } from './screens/PairScreen';
import { StartScreen } from './screens/StartScreen';
import { WorkoutScreen, type SessionDraft } from './screens/WorkoutScreen';
import { DoneScreen } from './screens/DoneScreen';

type View = 'start' | 'workout' | 'done';

export default function App() {
  const { ready, user, profile } = useApp();
  const [view, setView] = useState<View>('start');
  const [draft, setDraft] = useState<SessionDraft | null>(null);

  if (!ready) {
    return <div className="gate center"><div className="logo">GYMBROS</div></div>;
  }
  if (!user) return <AuthScreen />;
  if (!profile) return <div className="gate center"><div className="muted">Loading your locker...</div></div>;
  if (!profile.pair_id) return <PairScreen />;

  if (view === 'workout') {
    return (
      <WorkoutScreen
        onFinish={(d) => { setDraft(d); setView('done'); }}
        onCancel={() => setView('start')}
      />
    );
  }
  if (view === 'done' && draft) {
    return <DoneScreen draft={draft} onClose={() => { setDraft(null); setView('start'); }} />;
  }
  return <StartScreen onTrain={() => setView('workout')} />;
}
