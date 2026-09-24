import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Pause, Play, Sparkles, Target, Trophy, X } from 'lucide-react';
import { FOCUS_SECONDS, MEMORY_ROUNDS, focusScore, makePattern, memoryScore, trainingXP, localDate } from '@/lib/trainingEngine';
import '@/styles/manifest.css';

export default function TrainingGame({ game, onExit, onSave }) {
  const isFocus = game === 'focus';
  const [phase, setPhase] = useState('intro');
  const [paused, setPaused] = useState(false);
  const [remaining, setRemaining] = useState(FOCUS_SECONDS);
  const [hits, setHits] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [target, setTarget] = useState(4);
  const [round, setRound] = useState(1);
  const [pattern, setPattern] = useState([]);
  const [selected, setSelected] = useState([]);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [result, setResult] = useState(null);
  const [saveState, setSaveState] = useState('');
  const run = useRef({ hits: 0, mistakes: 0, remaining: FOCUS_SECONDS, locked: false, finished: false });
  const saving = useRef(false);
  const memoryStarted = useRef(0);

  const save = async (record) => {
    if (saving.current) return;
    saving.current = true;
    setSaveState('saving');
    try { await onSave(record); setSaveState('saved'); }
    catch { setSaveState('error'); }
    finally { saving.current = false; }
  };
  const finish = (score, extra = {}) => {
    if (run.current.finished) return;
    run.current.finished = true;
    const record = {
      client_session_id: crypto.randomUUID(), game, score, xp: trainingXP(score),
      session_date: localDate(), completed_at: new Date().toISOString(),
      duration_seconds: isFocus ? FOCUS_SECONDS : Math.max(1, Math.round((Date.now() - memoryStarted.current) / 1000)),
      ...extra,
    };
    setResult(record); setPhase('result'); save(record);
  };

  useEffect(() => {
    if (!isFocus || phase !== 'playing' || paused) return;
    let previous = performance.now();
    const timer = setInterval(() => {
      const now = performance.now();
      run.current.remaining = Math.max(0, run.current.remaining - (now - previous) / 1000);
      previous = now;
      setRemaining(run.current.remaining);
      if (run.current.remaining <= 0) {
        finish(focusScore(run.current.hits, run.current.mistakes), { hits: run.current.hits, mistakes: run.current.mistakes });
      }
    }, 100);
    return () => clearInterval(timer);
  }, [isFocus, phase, paused]);

  useEffect(() => {
    if (!isFocus || phase !== 'playing' || paused) return;
    const timer = setInterval(() => setTarget(previous => {
      const offset = 1 + Math.floor(Math.random() * 8);
      return (previous + offset) % 9;
    }), 1300);
    return () => clearInterval(timer);
  }, [isFocus, phase, paused]);

  useEffect(() => {
    if (isFocus || phase !== 'reveal' || paused) return;
    const timer = setTimeout(() => setPhase('recall'), 1800);
    return () => clearTimeout(timer);
  }, [isFocus, phase, paused, round]);

  useEffect(() => {
    const hide = () => { if (document.hidden) setPaused(true); };
    document.addEventListener('visibilitychange', hide);
    return () => document.removeEventListener('visibilitychange', hide);
  }, []);

  const start = () => {
    memoryStarted.current = Date.now();
    if (isFocus) { setTarget(Math.floor(Math.random() * 9)); setPhase('playing'); }
    else { setPattern(makePattern(3)); setPhase('reveal'); }
  };
  const tapFocus = (index) => {
    if (paused || phase !== 'playing' || run.current.locked || run.current.remaining <= 0 || run.current.finished) return;
    // A very short lock prevents double taps on one visual target from earning two hits.
    run.current.locked = true;
    setTimeout(() => { run.current.locked = false; }, 120);
    if (index === target) {
      run.current.hits += 1; setHits(run.current.hits);
      setTarget((target + 1 + Math.floor(Math.random() * 8)) % 9);
    } else { run.current.mistakes += 1; setMistakes(run.current.mistakes); }
  };
  const tapMemory = (index) => {
    if (phase !== 'recall' || paused) return;
    setSelected(old => old.includes(index) ? old.filter(i => i !== index) : old.length < pattern.length ? [...old, index] : old);
  };
  const checkMemory = () => {
    if (run.current.locked || phase !== 'recall' || selected.length !== pattern.length) return;
    run.current.locked = true;
    const matched = selected.filter(i => pattern.includes(i)).length;
    setCorrect(correct + matched); setTotal(total + pattern.length);
    setFeedback(matched === pattern.length ? 'Perfect pattern.' : `${matched} of ${pattern.length} tiles matched.`);
    setPhase('feedback');
  };
  const nextRound = () => {
    if (round === MEMORY_ROUNDS) { finish(memoryScore(correct, total), { hits: correct, mistakes: total - correct }); return; }
    run.current.locked = false;
    setRound(round + 1); setPattern(makePattern(round + 3)); setSelected([]); setPhase('reveal');
  };

  if (result) return <div className="mm-page mm-game-screen"><div className="mm-result">
    <div className="mm-result-symbol"><Trophy size={32} /></div><span className="mm-eyebrow" style={{ justifyContent: 'center' }}>ONE MORE STEP FORWARD</span>
    <h1>Practice complete.</h1><div className="mm-result-score">{result.score}<span style={{ fontSize: 17, letterSpacing: 0 }}>/100</span></div>
    <p>{isFocus ? 'Focus Zone score' : 'Memory Grid accuracy'} · this session</p>
    <div className="mm-result-stats"><div><strong>+{result.xp}</strong><span>Training XP</span></div><div><strong>{result.hits}</strong><span>{isFocus ? 'Targets hit' : 'Tiles matched'}</span></div><div><strong>{result.mistakes}</strong><span>{isFocus ? 'Distractions tapped' : 'Tiles missed'}</span></div></div>
    <p>A little practice is progress.<br />Come back tomorrow and see how you do.</p>
    <div className={`mm-save-status ${saveState === 'error' ? 'error' : ''}`} role="status">{saveState === 'saving' ? 'Saving your session…' : saveState === 'saved' ? 'Session saved' : 'Couldn’t save this session. Keep this screen open to retry.'}</div>
    <div className="mm-game-actions">{saveState === 'error' && <button className="mm-secondary" onClick={() => save(result)}>Retry save</button>}<button className="mm-primary" onClick={onExit} disabled={saveState === 'saving'}>Back to training <ArrowRight size={17} /></button></div>
  </div></div>;

  return <div className="mm-page mm-game-screen">
    <div className="mm-game-top"><button onClick={onExit}><ArrowLeft size={17} /> Training</button>{phase !== 'intro' && <button aria-label={paused ? 'Resume game' : 'Pause game'} onClick={() => setPaused(!paused)}>{paused ? <Play size={18} /> : <Pause size={18} />}</button>}</div>
    <div className="mm-game-info"><span className="mm-eyebrow" style={{ justifyContent: 'center' }}>{isFocus ? 'ATTENTION · 30 SECONDS' : 'RECALL · 5 ROUNDS'}</span><h1>{isFocus ? 'Focus Zone' : 'Memory Grid'}</h1><p>{phase === 'intro' ? isFocus ? 'Tap the gold target. Ignore the distractions. Each target is +5 points; a distraction is −3.' : 'Remember the highlighted tiles. When they disappear, select those same tiles. Patterns grow each round.' : paused ? 'Take a breath. Resume when you’re ready.' : isFocus ? 'Find the target. Let everything else go.' : phase === 'reveal' ? 'Take a good look. Remember these tiles.' : phase === 'feedback' ? feedback : `Select the ${pattern.length} tiles you remember.`}</p></div>
    {phase === 'intro' ? <><div className="mm-play-grid" aria-hidden="true">{Array.from({ length: 9 }, (_, i) => <div key={i} className={`mm-play-cell ${isFocus && i === 4 ? 'target' : !isFocus && [1, 3, 5].includes(i) ? 'reveal' : ''}`}>{isFocus && i === 4 ? <Target size={32} /> : !isFocus && [1, 3, 5].includes(i) ? <Sparkles size={22} /> : null}</div>)}</div><div className="mm-game-actions"><button className="mm-primary" onClick={start}>Let’s practice <Play size={16} /></button></div></> : paused ? <div className="mm-game-actions"><button className="mm-primary" onClick={() => setPaused(false)}>Resume <Play size={16} /></button></div> : <>
      <div className="mm-game-hud"><strong>{isFocus ? `${Math.ceil(remaining)}s left` : `Round ${round} of ${MEMORY_ROUNDS}`}</strong><span>{isFocus ? `${hits} hits · ${mistakes} misses` : `${selected.length}/${pattern.length} selected`}</span></div>
      <div className="mm-game-meter"><span style={{ width: `${isFocus ? remaining / FOCUS_SECONDS * 100 : round / MEMORY_ROUNDS * 100}%` }} /></div>
      <div className="mm-play-grid">{Array.from({ length: 9 }, (_, i) => {
        const revealed = !isFocus && ['reveal', 'feedback'].includes(phase) && pattern.includes(i);
        const chosen = !isFocus && selected.includes(i);
        return <button key={i} aria-label={isFocus ? i === target ? 'Focus target' : `Distraction ${i + 1}` : `Tile ${i + 1}`} aria-pressed={!isFocus ? chosen : undefined} disabled={!isFocus && phase !== 'recall'} className={`mm-play-cell ${isFocus ? i === target ? 'target' : 'distractor' : revealed ? 'reveal' : chosen ? 'selected' : ''}`} onClick={() => isFocus ? tapFocus(i) : tapMemory(i)}>{isFocus ? i === target ? <Target size={32} /> : <X size={18} /> : revealed ? <Sparkles size={22} /> : chosen ? <Check size={24} /> : null}</button>;
      })}</div>
      {!isFocus && <div className="mm-game-actions">{phase === 'recall' ? <button className="mm-primary" onClick={checkMemory} disabled={selected.length !== pattern.length}>Check pattern <ArrowRight size={16} /></button> : phase === 'feedback' ? <button className="mm-primary" onClick={nextRound}>{round === MEMORY_ROUNDS ? 'See results' : 'Next pattern'} <ArrowRight size={16} /></button> : <p className="mm-loading" role="status">Remember the highlighted tiles…</p>}</div>}
    </>}
  </div>;
}
