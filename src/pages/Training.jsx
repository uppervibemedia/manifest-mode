import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useUserProfile } from '@/lib/UserProfileContext';
import AppLayout from '@/components/layout/AppLayout';
import TrainingView from '@/components/training/TrainingView';
import TrainingGame from '@/components/training/TrainingGame';

export default function Training() {
  const { user, loading: profileLoading } = useUserProfile();
  const [params] = useSearchParams();
  const game = params.get('game');
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const generation = useRef(0);
  const load = useCallback(async () => {
    const id = ++generation.current;
    if (!user?.email) { setSessions([]); setLoading(false); return; }
    setError(''); setLoading(true); setSessions([]);
    try {
      const records = await base44.entities.TrainingSession.filter({ created_by: user.email }, '-created_date', 100);
      if (id === generation.current) setSessions(records);
    } catch { if (id === generation.current) setError('Couldn’t load your training history. Please try again.'); }
    finally { if (id === generation.current) setLoading(false); }
  }, [user?.email]);
  useEffect(() => { if (!profileLoading) load(); return () => { generation.current++; }; }, [load, profileLoading]);
  useEffect(() => { if (!profileLoading && !user) navigate('/'); }, [profileLoading, user, navigate]);
  const save = async record => {
    if (!user) throw new Error('Sign in to save your session');
    // Keep retries idempotent after a response is lost. Session IDs are generated once per game.
    const existing = await base44.entities.TrainingSession.filter({ created_by: user.email, client_session_id: record.client_session_id });
    if (!existing.length) await base44.entities.TrainingSession.create(record);
    setSessions(old => [record, ...old.filter(item => item.client_session_id !== record.client_session_id)].slice(0, 100));
  };
  return <AppLayout>{['focus', 'memory'].includes(game) ? <TrainingGame key={`${game}:${user?.id}`} game={game} onSave={save} onExit={() => navigate('/train')} /> : <TrainingView sessions={sessions} loading={loading || profileLoading} error={error} onRetry={load} onNavigate={navigate} />}</AppLayout>;
}
