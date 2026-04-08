import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { BookOpen, Sparkles, ChevronDown, ChevronUp, Loader2, Check } from "lucide-react";

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

  const getExistingEntry = (promptId) => {
    const prompt = PROMPTS.find(p => p.id === promptId);
    return prompt ? entries.find(e => e.title?.includes(prompt.label)) : undefined;
  };

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