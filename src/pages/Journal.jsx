import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Plus, ChevronLeft, Loader2, BookOpen } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { useNavigate } from "react-router-dom";

const PROMPTS = [
  "What about your vision matters most to you right now?",
  "What identity shift are you currently resisting — and why?",
  "What action would your future self take today that you're avoiding?",
  "What is one old pattern you must release to move forward?",
  "Who do you need to become in the next 90 days to change your reality?",
  "What are you tolerating that your future self would never accept?",
  "What does discipline look like in your future self's daily life?",
];

export default function Journal() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [user, setUser] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ prompt_question: "", response_text: "", title: "" });
  const [selectedPrompt, setSelectedPrompt] = useState(null);

  useEffect(() => {
    (async () => {
      const u = await base44.auth.me();
      setUser(u);
      const e = await base44.entities.JournalEntry.filter({ user_email: u.email }, "-created_date", 20);
      setEntries(e);
      setLoading(false);
    })();
  }, []);

  const openNew = (prompt) => {
    setSelectedPrompt(prompt);
    setForm({ prompt_question: prompt || "", response_text: "", title: "" });
    setShowNew(true);
  };

  const handleSave = async () => {
    if (!form.response_text.trim()) return;
    setSaving(true);
    const entry = await base44.entities.JournalEntry.create({
      user_email: user.email,
      title: form.title || `Journal — ${new Date().toLocaleDateString()}`,
      prompt_question: form.prompt_question,
      response_text: form.response_text,
      entry_type: form.prompt_question ? "guided" : "freeform",
    });
    setEntries(prev => [entry, ...prev]);
    setShowNew(false);
    setSaving(false);
  };

  return (
    <AppLayout>
      <div className="px-5 pt-12 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary/70 font-medium mb-1">Reflection</p>
            <h1 className="font-playfair text-2xl font-semibold">Journal</h1>
          </div>
          <button onClick={() => openNew(null)}
            className="w-10 h-10 gold-gradient rounded-xl flex items-center justify-center text-background">
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {!showNew && (
          <>
            {/* Guided Prompts */}
            <div className="mb-6">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">Guided Reflections</p>
              <div className="space-y-2">
                {PROMPTS.slice(0, 3).map((p, i) => (
                  <button key={i} onClick={() => openNew(p)}
                    className="w-full glass-card border border-border rounded-xl p-4 text-left hover:border-primary/30 transition-colors flex items-start gap-3">
                    <span className="text-primary text-sm font-bold shrink-0 mt-0.5">✦</span>
                    <p className="text-sm text-foreground/80 leading-relaxed">{p}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Past Entries */}
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : entries.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <BookOpen className="w-10 h-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No entries yet. Start reflecting.</p>
              </div>
            ) : (
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">Past Entries</p>
                <div className="space-y-3">
                  {entries.map((entry, i) => (
                    <motion.div key={entry.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      className="glass-card border border-border rounded-xl p-4">
                      <div className="flex items-start justify-between mb-1.5">
                        <p className="text-sm font-semibold text-foreground">{entry.title}</p>
                        <p className="text-[10px] text-muted-foreground shrink-0 ml-2">
                          {new Date(entry.created_date).toLocaleDateString("en", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                      {entry.prompt_question && (
                        <p className="text-xs text-primary/70 italic mb-1.5">{entry.prompt_question}</p>
                      )}
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{entry.response_text}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* New Entry Form */}
        <AnimatePresence>
          {showNew && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <button onClick={() => setShowNew(false)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground mb-5">
                <ChevronLeft className="w-3.5 h-3.5" /> Back
              </button>

              {form.prompt_question && (
                <div className="glass-card border-l-2 border-primary/50 rounded-xl p-4 mb-4">
                  <p className="text-xs uppercase tracking-widest text-primary/70 font-medium mb-1">Reflection Prompt</p>
                  <p className="text-sm text-foreground/80 italic">{form.prompt_question}</p>
                </div>
              )}

              <div className="mb-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5">Title (optional)</p>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Give this entry a name..."
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50" />
              </div>

              <div className="mb-6">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5">Your Thoughts</p>
                <textarea value={form.response_text} onChange={e => setForm(p => ({ ...p, response_text: e.target.value }))}
                  placeholder="Write freely. Be honest with yourself..."
                  rows={10}
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 resize-none" />
              </div>

              <button onClick={handleSave} disabled={saving || !form.response_text.trim()}
                className="w-full py-4 gold-gradient text-background font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-40">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Entry ✦"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}