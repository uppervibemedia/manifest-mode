import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { BookOpen, Sparkles, ChevronDown, ChevronUp, Loader2, Check, Brain } from "lucide-react";

const PROMPTS = [
  {
    id: "no_longer_accept",
    label: "Release",
    question: "What would my future self no longer accept?",
    placeholder: "The version of me who already has this life would never tolerate...",
    icon: "🛡️",
  },
  {
    id: "releasing_identity",
    label: "Identity Shift",
    question: "What part of my old identity am I releasing right now?",
    placeholder: "I am letting go of the version of me who...",
    icon: "🔓",
  },
  {
    id: "raise_standard",
    label: "Standards",
    question: "What standard do I need to raise to match my vision?",
    placeholder: "To become who I need to be, I must start holding myself to...",
    icon: "⭐",
  },
  {
    id: "future_self_next",
    label: "Next Move",
    question: "What would the version of me who already has this life do next?",
    placeholder: "She/he wouldn't hesitate. She/he would...",
    icon: "⚡",
  },
];

function WeeklyInsights({ userEmail }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const generateInsights = async () => {
    setLoading(true);
    setOpen(true);
    try {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const entries = await base44.entities.JournalEntry.filter(
        { user_email: userEmail, entry_type: "guided" },
        "-created_date",
        20
      );

      const recent = entries.filter(e => e.created_date >= oneWeekAgo);
      if (recent.length === 0) {
        setInsights({ empty: true });
        setLoading(false);
        return;
      }

      const combined = recent
        .map(e => `[${e.title}]: ${e.response_text}`)
        .join("\n\n");

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a Future Self transformation coach analyzing a user's identity journal entries from the past week.

Journal entries:
${combined}

Based on these, provide a brief, emotionally resonant analysis. Be warm, insightful, and identity-focused.

Return a JSON object with:
- breakthrough: (string) The biggest identity shift or positive pattern emerging
- pattern: (string) A recurring emotional theme or limiting belief to watch
- affirmation: (string) A powerful, personalized affirmation based on their entries (1-2 sentences, start with "I am" or "I choose")`,
        response_json_schema: {
          type: "object",
          properties: {
            breakthrough: { type: "string" },
            pattern: { type: "string" },
            affirmation: { type: "string" },
          },
        },
      });

      setInsights(result);
    } catch (e) {
      console.error("Weekly insights error:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-4">
      <button
        onClick={() => (insights || loading) ? setOpen(o => !o) : generateInsights()}
        className="w-full flex items-center justify-between px-4 py-3 glass-card border border-primary/20 rounded-xl hover:border-primary/40 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Brain className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Weekly Pattern Analysis</span>
          {!insights && !loading && (
            <span className="text-[9px] font-bold uppercase tracking-widest bg-primary/10 text-primary rounded-full px-2 py-0.5">AI</span>
          )}
        </div>
        {loading ? (
          <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
        ) : open ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      <AnimatePresence>
        {open && !loading && insights && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            {insights.empty ? (
              <div className="pt-3 px-1">
                <p className="text-xs text-muted-foreground">Write at least one Future Self journal entry this week to unlock pattern analysis.</p>
              </div>
            ) : (
              <div className="pt-3 space-y-3">
                <div className="glass-card border border-emerald-500/20 rounded-xl p-4">
                  <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-semibold mb-1.5">✦ Breakthrough Emerging</p>
                  <p className="text-sm text-foreground/85 leading-relaxed">{insights.breakthrough}</p>
                </div>
                <div className="glass-card border border-orange-400/20 rounded-xl p-4">
                  <p className="text-[10px] uppercase tracking-widest text-orange-400 font-semibold mb-1.5">⚡ Pattern to Watch</p>
                  <p className="text-sm text-foreground/85 leading-relaxed">{insights.pattern}</p>
                </div>
                <div className="glass-card border border-primary/25 rounded-xl p-4">
                  <p className="text-[10px] uppercase tracking-widest text-primary/70 font-semibold mb-1.5">Your Affirmation This Week</p>
                  <p className="text-sm font-medium text-foreground italic leading-relaxed">"{insights.affirmation}"</p>
                </div>
                <button
                  onClick={generateInsights}
                  className="text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" /> Refresh analysis
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function JournalPrompt({ prompt, userEmail, existingEntry }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(existingEntry?.response_text || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(!!existingEntry);

  const handleSave = async () => {
    if (!text.trim()) return;
    setSaving(true);
    if (existingEntry) {
      await base44.entities.JournalEntry.update(existingEntry.id, { response_text: text.trim() });
    } else {
      await base44.entities.JournalEntry.create({
        user_email: userEmail,
        title: `Future Self: ${prompt.label}`,
        prompt_question: prompt.question,
        response_text: text.trim(),
        category: "mindset",
        entry_type: "guided",
      });
    }
    setSaved(true);
    setSaving(false);
    setOpen(false);
  };

  return (
    <div className={`glass-card rounded-xl border transition-all ${saved ? "border-primary/20" : "border-border"}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start gap-3 p-4 text-left"
      >
        <span className="text-xl shrink-0 mt-0.5">{prompt.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{prompt.label}</p>
            {saved && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
          </div>
          <p className="text-sm font-medium text-foreground mt-0.5 leading-snug">{prompt.question}</p>
          {!open && saved && text && (
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1 italic">"{text}"</p>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              <textarea
                value={text}
                onChange={e => { setText(e.target.value); setSaved(false); }}
                placeholder={prompt.placeholder}
                rows={4}
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 resize-none mb-3"
              />
              <button
                onClick={handleSave}
                disabled={!text.trim() || saving}
                className="w-full py-2.5 gold-gradient text-background text-sm font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {saving ? "Saving..." : "Save Entry"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FutureSelfJournal({ userEmail }) {
  const [entries, setEntries] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!userEmail) return;
    (async () => {
      const data = await base44.entities.JournalEntry.filter(
        { user_email: userEmail, entry_type: "guided" },
        "-created_date",
        40
      );
      setEntries(data);
      setLoaded(true);
    })();
  }, [userEmail]);

  const getExistingEntry = (promptId) =>
    entries.find(e => e.title?.includes(PROMPTS.find(p => p.id === promptId)?.label || ""));

  if (!loaded) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
      className="mb-8"
    >
      {/* Section header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <BookOpen className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="font-playfair text-lg font-semibold text-foreground">Future Self Journal</h2>
          <p className="text-xs text-muted-foreground">Identity work. Who you are becoming.</p>
        </div>
      </div>

      {/* Weekly AI insights */}
      <WeeklyInsights userEmail={userEmail} />

      {/* Guided prompts */}
      <div className="space-y-3">
        {PROMPTS.map((prompt) => (
          <JournalPrompt
            key={prompt.id}
            prompt={prompt}
            userEmail={userEmail}
            existingEntry={getExistingEntry(prompt.id)}
          />
        ))}
      </div>
    </motion.div>
  );
}