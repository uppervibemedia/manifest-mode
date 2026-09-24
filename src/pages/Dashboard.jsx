import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useUserProfile } from '@/lib/UserProfileContext';
import { localDate } from '@/lib/trainingEngine';
import AppLayout from '@/components/layout/AppLayout';
import TodayView from '@/components/today/TodayView';

export default function Dashboard() {
  const { user, profile, loading: profileLoading } = useUserProfile();
  const navigate = useNavigate();
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const request = useRef(0);
  const load = useCallback(async () => {
    const id = ++request.current;
    if (!user?.email) { setData({}); setLoading(false); return; }
    setLoading(true); setError(''); setData({});
    const today = localDate();
    const results = await Promise.allSettled([
      base44.entities.ScoreHistory.filter({ user_email: user.email }, '-created_date', 1),
      base44.entities.DailyCheckIn.filter({ user_email: user.email, checkin_date: today }, '-created_date', 1),
      base44.entities.VisionItem.filter({ user_email: user.email, is_active: true }, '-created_date', 1),
      base44.entities.TrainingSession.filter({ created_by: user.email, session_date: today }, '-created_date', 1),
    ]);
    if (id !== request.current) return;
    const value = index => results[index].status === 'fulfilled' ? results[index].value : [];
    setData({ score: value(0)[0]?.overall_score ?? null, checkinDone: value(1).length > 0, vision: value(2)[0] || null, trained: value(3).length > 0 });
    if (results.some(result => result.status === 'rejected')) setError('Some progress couldn’t load. Your saved work hasn’t changed.');
    setLoading(false);
  }, [user?.email]);
  useEffect(() => { if (!profileLoading) load(); return () => { request.current++; }; }, [load, profileLoading]);
  useEffect(() => { if (!profileLoading && !user) navigate('/'); }, [user, profileLoading, navigate]);
  return <AppLayout><TodayView {...data} name={user?.full_name?.split(' ')[0] || 'there'} streak={profile?.streak_count || 0} points={profile?.alignment_points || 0} loading={loading || profileLoading} error={error} onRetry={load} onNavigate={navigate} /></AppLayout>;
}
