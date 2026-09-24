import { ArrowUpRight, ArrowRight, Flame, Check, Sun, Target, Sparkles, Grid2X2, Zap, ChevronRight } from 'lucide-react';
import '@/styles/manifest.css';

export function OrbitArt({ small = false }) {
  return <div className={`mm-orbit ${small ? 'mm-orbit-small' : ''}`} aria-hidden="true">
    <div className="mm-orbit-line mm-orbit-one" /><div className="mm-orbit-line mm-orbit-two" />
    <div className="mm-orbit-line mm-orbit-three" /><div className="mm-orbit-core"><Sparkles /></div>
    <i className="mm-orbit-dot" /><i className="mm-orbit-dot second" />
  </div>;
}

export function GameCards({ onNavigate }) {
  return <div className="mm-game-cards">
    <button className="mm-game-card focus" onClick={() => onNavigate('/train?game=focus')}>
      <div className="mm-game-visual"><div className="mm-target"><span /><Target size={32} /></div><span className="mm-game-time">30 SEC</span></div>
      <h3>Focus Zone</h3><p>Find your focus. Tune out noise.</p><span className="mm-card-footer">ATTENTION <ArrowUpRight size={18} /></span>
    </button>
    <button className="mm-game-card memory" onClick={() => onNavigate('/train?game=memory')}>
      <div className="mm-game-visual"><div className="mm-mini-grid" aria-hidden="true">{Array.from({ length: 9 }, (_, i) => <i key={i} className={[1, 3, 5, 7].includes(i) ? 'lit' : ''} />)}</div><span className="mm-game-time">5 ROUNDS</span></div>
      <h3>Memory Grid</h3><p>Notice the pattern. Make it stick.</p><span className="mm-card-footer">RECALL <ArrowUpRight size={18} /></span>
    </button>
  </div>;
}

export default function TodayView({ name = 'there', streak = 0, points = 0, score = null, checkinDone = false, trained = false, vision = null, onNavigate, loading = false, error = '', onRetry }) {
  const date = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).format(new Date());
  const completed = Number(checkinDone) + Number(trained);
  return <div className="mm-page mm-today">
    <div className="mm-date-row"><span>{date}</span><span className="mm-streak"><Flame size={15} /> {streak} day{streak === 1 ? '' : 's'}</span></div>
    <div className="mm-greeting"><p>YOUR NEXT CHAPTER STARTS TODAY</p><h1>Small steps.<br /><span>Different future.</span></h1><div>Make a little room for the person you’re becoming, {name}.</div></div>
    {error && <div className="mm-error" role="alert">{error}<button onClick={onRetry}>Try again</button></div>}
    {loading && <p className="mm-loading" role="status">Loading your latest progress…</p>}
    <section className="mm-daily-hero" aria-labelledby="daily-heading">
      <div className="mm-hero-copy"><span className="mm-eyebrow"><span className="mm-status-dot" /> YOUR DAILY RESET</span><h2 id="daily-heading">A clearer mind.<br />A more intentional day.</h2><p>Check in. Set your intention.<br />Take your next step.</p><button className="mm-primary" onClick={() => onNavigate('/daily-shift')}>{checkinDone ? 'Continue your shift' : 'Start your daily shift'} <ArrowRight size={17} /></button></div>
      <OrbitArt />
    </section>
    <div className="mm-stats">
      <button onClick={() => onNavigate('/progress')}><span>REALITY MATCH <ArrowUpRight size={13} /></span><strong>{score == null ? '—' : Math.round(score)}<small>/100</small></strong><p>{score == null ? 'Discover your starting point' : 'Your latest check-in score'}</p></button>
      <button onClick={() => onNavigate('/profile')}><span>ALIGNMENT POINTS <Zap size={13} /></span><strong>{points.toLocaleString()}</strong><p>Every intentional action counts</p></button>
    </div>
    <section aria-labelledby="momentum-heading">
      <div className="mm-section-heading"><h2 id="momentum-heading">Build your momentum</h2><span>{completed}/2 today</span></div>
      <div className="mm-missions">
        <button onClick={() => onNavigate('/daily-shift')}><span className={`mm-mission-icon ${checkinDone ? 'done' : ''}`}>{checkinDone ? <Check size={19} /> : <Sun size={19} />}</span><span><strong>Meet yourself where you are</strong><small>{checkinDone ? 'Daily check-in complete' : 'A quick energy and mindset check-in'}</small></span><ChevronRight size={17} /></button>
        <button onClick={() => onNavigate('/train')}><span className={`mm-mission-icon purple ${trained ? 'done' : ''}`}>{trained ? <Check size={19} /> : <Grid2X2 size={19} />}</span><span><strong>Give your mind a little practice</strong><small>{trained ? 'Training session complete' : 'Play one focus or memory challenge'}</small></span><ChevronRight size={17} /></button>
      </div>
    </section>
    <section aria-labelledby="training-heading"><div className="mm-section-heading"><h2 id="training-heading">Your mental gym</h2><button onClick={() => onNavigate('/train')}>Explore <ArrowRight size={14} /></button></div><GameCards onNavigate={onNavigate} /></section>
    <section aria-labelledby="vision-heading"><div className="mm-section-heading"><h2 id="vision-heading">Keep your future in sight</h2><button onClick={() => onNavigate('/vision')}>Open vision <ArrowUpRight size={14} /></button></div>
      <button className="mm-vision-card" onClick={() => onNavigate('/vision')}><div className="mm-horizon" aria-hidden="true"><i /><i /><i /></div><div className="mm-vision-copy"><span>YOUR WHY</span><h3>{vision?.title || 'Make space for your next chapter.'}</h3><p>{vision ? 'A reminder of what you’re working toward.' : 'Add a vision. Turn it into a next step.'}</p></div><span className="mm-round-arrow"><ArrowUpRight size={21} /></span></button>
    </section>
    <p className="mm-closing"><Sparkles size={13} /> Show up for yourself. The rest starts there.</p>
  </div>;
}
