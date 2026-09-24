import { useEffect, useRef, useState } from 'react';
import { Sun, Grid2X2, Image, TrendingUp, Sparkles, User, X, ArrowLeft } from 'lucide-react';
import TodayView from '@/components/today/TodayView';
import TrainingView from '@/components/training/TrainingView';
import TrainingGame from '@/components/training/TrainingGame';
import { localDate } from '@/lib/trainingEngine';
import '@/index.css';
import './preview.css';

const KEY = 'manifestmode-design-preview-sessions-v1';
const tabs = [{ path:'/today', label:'Today', icon:Sun }, { path:'/train', label:'Train', icon:Grid2X2 }, { path:'/vision', label:'Vision', icon:Image }, { path:'/progress', label:'Progress', icon:TrendingUp }, { path:'/future-self', label:'Future Self', icon:Sparkles }];
const pageNames = { '/daily-shift': 'Daily Shift', '/vision':'Vision', '/progress':'Progress', '/future-self':'Future Self', '/profile':'Profile' };
export default function Preview() {
  const [route, setRoute] = useState('/today');
  const [notice, setNotice] = useState('');
  const [sessions, setSessions] = useState(() => {
    try { const values = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(values) ? values.filter(v => ['focus','memory'].includes(v.game) && Number.isFinite(v.score) && v.completed_at).slice(0,100) : []; } catch { return []; }
  });
  const scroll = useRef(null);
  const dialog = useRef(null);
  const pathname = route.split('?')[0];
  const game = new URLSearchParams(route.split('?')[1]).get('game');
  const navigate = path => {
    if (path.startsWith('/today') || path.startsWith('/train')) { setRoute(path); scroll.current?.scrollTo(0,0); }
    else { setNotice(pageNames[path] || 'ManifestMode'); }
  };
  useEffect(() => { if (notice) dialog.current?.showModal(); }, [notice]);
  const save = async record => {
    const next = [record, ...sessions.filter(item => item.client_session_id !== record.client_session_id)].slice(0,100);
    localStorage.setItem(KEY, JSON.stringify(next));
    setSessions(next);
  };
  return <div className="mm-preview-stage">
    <aside className="mm-preview-context"><div className="mm-preview-wordmark"><Sparkles size={20} /> MANIFESTMODE</div><span className="mm-preview-kicker">THE NEXT CHAPTER</span><h1>A daily practice.<br />A different future.</h1><p>A calmer home for your goals.<br />A little more play for your mind.</p><div className="mm-preview-features"><span>01 <b>A clearer daily starting point</b></span><span>02 <b>Playable focus & memory challenges</b></span><span>03 <b>Progress that feels personal</b></span></div><div className="mm-preview-disclaimer">Interactive design preview · Sample account<br />Games work. Preview sessions save on this browser.<br />Apple payments and live account data are not connected.</div></aside>
    <div className="mm-preview-phone"><div className="mm-preview-label">INTERACTIVE PREVIEW · SAMPLE DATA</div><header className="mm-preview-header"><div><Sparkles size={20} /><strong>manifest<span>mode</span></strong></div><button aria-label="Open profile" onClick={() => navigate('/profile')}><User size={18} /></button></header>
      <main ref={scroll} className="mm-preview-scroll">{pathname === '/today' ? <TodayView name="Jamal" streak={7} points={340} score={68} checkinDone trained={sessions.some(s=>s.session_date===localDate())} vision={{ title:'More freedom. More life.' }} onNavigate={navigate} /> : game ? <TrainingGame key={game} game={game} onSave={save} onExit={()=>navigate('/train')} /> : <TrainingView sessions={sessions} onNavigate={navigate} />}</main>
      <nav className="mm-preview-nav" aria-label="Main navigation">{tabs.map(({path,label,icon:Icon})=><button key={path} aria-current={pathname===path?'page':undefined} onClick={()=>navigate(path)}><Icon size={21} /><span>{label}</span></button>)}</nav><div className="mm-preview-homebar" />
    </div>
    <dialog className="mm-preview-dialog" ref={dialog} onClose={()=>setNotice('')}><button className="mm-dialog-close" aria-label="Close" onClick={()=>dialog.current.close()}><X size={20} /></button><span className="mm-eyebrow">PREVIEW SCOPE</span><h2>{notice}</h2><p>This screen already exists in your connected app. This design preview lets you explore the new Today screen and play the two training games.</p><button className="mm-primary" onClick={()=>dialog.current.close()}><ArrowLeft size={16} /> Back to preview</button></dialog>
  </div>;
}
