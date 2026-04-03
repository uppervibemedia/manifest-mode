import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Send, Sparkles, AlertTriangle } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import CoachMessage from "@/components/coach/CoachMessage";
import { buildCoachPrompt, SAFETY_KEYWORDS } from "@/lib/coachEngine";

const SUGGESTED_PROMPTS = [
  "Help me get back on track",
  "I feel unmotivated today",
  "What would my future self do here?",
  "Break this goal into small steps",
  "Reframe a limiting belief for me",
  "Help me reset after a bad week",
  "Why do I keep procrastinating?",
  "Build my confidence right now",
];

const SAFETY_RESPONSE = `I hear you, and I want to make sure you get the right support.

As your growth coach, I'm here for mindset, habits, and daily alignment — but what you're describing sounds like it may need qualified human support.

**Please reach out to someone who can truly help:**
- 🆘 Crisis line: **988** (call or text, US)
- 🌍 International: **findahelpline.com**
- 🏥 Your doctor, therapist, or a trusted person in your life

You don't have to face this alone. Once you're in a safer place, I'm here to help you build forward. 💛`;

export default function FutureSelfCoach() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState(null);
  const [contextLoading, setContextLoading] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    loadContext();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const loadContext = async () => {
    const user = await base44.auth.me();
    const today = new Date().toISOString().split("T")[0];
    const [profiles, scores, analyses, plans, checkins] = await Promise.all([
      base44.entities.UserProfile.filter({ user_email: user.email }),
      base44.entities.ScoreHistory.filter({ user_email: user.email }, "-created_date", 1),
      base44.entities.AIAnalysis.filter({ user_email: user.email }, "-created_date", 1),
      base44.entities.DailyShiftPlan.filter({ user_email: user.email, plan_date: today }),
      base44.entities.DailyCheckIn.filter({ user_email: user.email }, "-created_date", 3),
    ]);
    setContext({
      user,
      profile: profiles[0] || null,
      score: scores[0] || null,
      analysis: analyses[0] || null,
      plan: plans[0] || null,
      recentCheckins: checkins,
    });
    setContextLoading(false);

    // Welcome message
    const name = user.full_name?.split(" ")[0] || "there";
    const score = scores[0]?.overall_score;
    const streak = profiles[0]?.streak_count || 0;
    setMessages([{
      role: "assistant",
      content: `Hey ${name}. I'm your Future Self Coach.\n\nI have your full profile loaded — your Reality Match Score${score ? ` (${score}/100)` : ""}, your habits, your goals, and where you're at right now.\n\nI'm here to give you straight, practical guidance. No fluff. No generic advice.\n\n${streak > 0 ? `You're on a ${streak}-day streak. Let's keep that going.\n\n` : ""}What's on your mind today?`,
    }]);
  };

  const isSafetyTopic = (text) => {
    return SAFETY_KEYWORDS.some(kw => text.toLowerCase().includes(kw));
  };

  const sendMessage = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;
    setInput("");

    const userMsg = { role: "user", content: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    // Safety check
    if (isSafetyTopic(trimmed)) {
      setTimeout(() => {
        setMessages(prev => [...prev, { role: "assistant", content: SAFETY_RESPONSE, isSafety: true }]);
        setLoading(false);
      }, 600);
      return;
    }

    const systemPrompt = buildCoachPrompt(context);
    const conversationHistory = [...messages, userMsg].map(m => ({
      role: m.role,
      content: m.content,
    }));

    const fullPrompt = `${systemPrompt}\n\n---\nConversation so far:\n${conversationHistory.map(m => `${m.role === "user" ? "User" : "Coach"}: ${m.content}`).join("\n\n")}\n\nCoach:`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: fullPrompt,
    });

    const reply = typeof response === "string" ? response : response?.response || response?.text || "Let's keep going. What else is on your mind?";

    setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    setLoading(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const showSuggestions = messages.length <= 1;

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-80px)]">
        {/* Header */}
        <div className="px-5 pt-10 pb-3 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2.5 flex-1">
              <div className="w-9 h-9 gold-gradient rounded-xl flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-background" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground leading-none">Future Self Coach</p>
                <p className="text-[10px] text-primary/70 mt-0.5">Personalized · Practical · Grounded</p>
              </div>
            </div>
            {!contextLoading && context?.score && (
              <div className="px-2.5 py-1 glass-card rounded-full border border-primary/20">
                <span className="text-[10px] font-semibold text-primary">{context.score.overall_score}/100</span>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {contextLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="text-xs text-muted-foreground">Loading your profile...</p>
              </div>
            </div>
          ) : (
            <>
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <CoachMessage key={i} message={msg} index={i} />
                ))}
              </AnimatePresence>

              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 items-start">
                  <div className="w-7 h-7 gold-gradient rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-background" />
                  </div>
                  <div className="glass-card rounded-2xl rounded-tl-sm px-4 py-3 border border-border">
                    <div className="flex gap-1.5 items-center h-4">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Suggested prompts */}
              {showSuggestions && !loading && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                  className="pt-2">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-2.5 px-1">Quick starts</p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED_PROMPTS.map((p, i) => (
                      <button key={i} onClick={() => sendMessage(p)}
                        className="px-3 py-2 glass-card border border-border rounded-xl text-xs text-foreground/80 hover:border-primary/40 hover:text-primary transition-all">
                        {p}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="px-4 pb-4 pt-2 border-t border-border shrink-0">
          <div className="flex gap-2.5 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask your future self anything..."
              rows={1}
              disabled={loading || contextLoading}
              className="flex-1 bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 resize-none min-h-[46px] max-h-[120px] disabled:opacity-50"
              style={{ height: "46px", overflowY: input.split("\n").length > 2 ? "auto" : "hidden" }}
              onInput={e => {
                e.target.style.height = "46px";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
            />
            <button onClick={() => sendMessage()}
              disabled={!input.trim() || loading || contextLoading}
              className="w-11 h-11 gold-gradient rounded-xl flex items-center justify-center shrink-0 disabled:opacity-30 transition-opacity">
              <Send className="w-4 h-4 text-background" />
            </button>
          </div>
          <p className="text-[9px] text-muted-foreground/40 text-center mt-2">
            For mental health emergencies, please contact a qualified professional.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}