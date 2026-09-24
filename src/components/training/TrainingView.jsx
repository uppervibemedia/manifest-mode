import { Sparkles, ArrowUpRight } from 'lucide-react';
import { GameCards } from '@/components/today/TodayView';
import { localDate } from '@/lib/trainingEngine';

export default function TrainingView({ sessions = [], onNavigate, error = '', onRetry, loading = false }) {
  const xp = sessions.reduce((sum, item) => sum + (Number(item.xp) || 0), 0);
  const today = sessions.filter(item => item.session_date === localDate());
  return <div className="mm-page mm-training"><span className="mm-eyebrow">MAKE TIME FOR YOUR MIND</span><h1>A little sharper.<br />One session at a time.</h1><p className="mm-training-intro">Short challenges for focus and recall.<br />Find your rhythm. Build a daily practice.</p>
    <GameCards onNavigate={onNavigate} />
    {loading && <p className="mm-loading" role="status">Loading your sessions…</p>}
    {error && <div className="mm-error" role="alert">{error}<button onClick={onRetry}>Try again</button></div>}
    <div className="mm-training-summary"><Sparkles size={24} /><div><strong>{today.length ? `${today.length} session${today.length === 1 ? '' : 's'} today. Keep showing up.` : 'Your next rep starts here.'}</strong><p>{xp.toLocaleString()} training XP across your latest {sessions.length} sessions</p></div></div>
    <div className="mm-section-heading"><h2>Recent practice</h2><ArrowUpRight size={16} /></div>
    {sessions.length ? <div className="mm-session-list">{sessions.slice(0, 6).map(item => <div key={item.client_session_id || item.id}><span>{item.game === 'focus' ? 'Focus Zone' : 'Memory Grid'}<small>{new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(item.completed_at))} · {item.score}/100</small></span><b>+{item.xp} XP</b></div>)}</div> : !loading && <div className="mm-empty">Your first session is a fresh start.<br />Pick a challenge above to begin.</div>}
    <p className="mm-closing">Game scores track your practice, not your intelligence.</p>
  </div>;
}
