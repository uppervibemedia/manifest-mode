import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Sparkles, MessageCircle, Lock, ArrowRight, Loader2, Send } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { useUserProfile } from "@/lib/UserProfileContext";
import ReactMarkdown from "react-markdown";

export default function FutureSelf() {
  const navigate = useNavigate();
  const { user, profile, loading: profileLoading } = useUserProfile();
  const [analysis, setAnalysis] = useState(null);
  const [activeTab, setActiveTab] = useState("blueprint"); // "blueprint" or "coach"
  const [loading, setLoading] = useState(true);

  // Coach state
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [coaching, setCoaching] = useState(false);

  useEffect(() => {
    if (profileLoading) return;
    if (!user) navigate("/");
  }, [user, profileLoading, navigate]);

  useEffect(() => {
    (async () => {
      if (!user || profileLoading) return;
      const data = await base44.entities.AIAnalysis.filter({ user_email: user.email }, "-created_date", 1);
      setAnalysis(data[0] || null);
      setLoading(false);
    })();
  }, [user?.email, profileLoading]);

  const handleCoachMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setCoaching(true);

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a Future Self Coach for a user named ${user?.full_name || "User"}. 

Their Future Self Blueprint:
- Identity: ${analysis?.future_self_statement || "Not yet defined"}
- Strengths: ${analysis?.strengths_summary || "To be discovered"}

User's latest message: "${input}"

Provide concise, identity-focused coaching. Reference their blueprint. Be warm and personalized. Keep response under 200 words.`,
      });

      setMessages(prev => [...prev, { role: "assistant", content: response }]);
    } catch (error) {
      console.error("Coach error:", error);
    } finally {
      setCoaching(false);
    }
  };

  const tier = profile?.subscription_tier || "free";
  const hasCoachAccess = tier === "premium" || tier === "supporter";

  if (loading || profileLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  const blueprint = analysis ? {
    identity: analysis.future_self_statement,
    mindset: (analysis.replacement_beliefs || [])[0] || "Think long-term. Act daily.",
    standards: (analysis.identity_shifts || [])[0] || "You operate from intention, not reaction.",
    activation: analysis.action_plan?.slice(0, 3) || [],
  } : null;

  return (
    <AppLayout>
      <div className="px-5 pt-6 pb-6">
        <p className="text-xs uppercase tracking-widest text-primary/70 font-medium mb-1">Who You're Becoming</p>
        <h1 className="font-playfair text-2xl font-semibold mb-6">Future Self</h1>

        {!analysis ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl glass-card border border-border flex items-center justify-center mb-4">
              <Sparkles className="w-7 h-7 text-muted-foreground" />
            </div>
            <h2 className="font-playfair text-lg font-semibold mb-2">Blueprint Not Ready</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">Complete your assessment to unlock your Future Self Blueprint and AI Coach</p>
            <button onClick={() => navigate("/assessment")}
              className="px-6 py-2.5 gold-gradient text-background font-semibold rounded-xl flex items-center gap-2">
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveTab("blueprint")}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === "blueprint"
                    ? "bg-card text-foreground border border-primary/30"
                    : "bg-background text-muted-foreground border border-border"
                }`}>
                Blueprint
              </button>
              <button
                onClick={() => setActiveTab("coach")}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  activeTab === "coach"
                    ? "bg-card text-foreground border border-primary/30"
                    : "bg-background text-muted-foreground border border-border"
                }`}>
                <MessageCircle className="w-3.5 h-3.5" /> Coach
              </button>
            </div>

            {/* Blueprint Tab */}
            <AnimatePresence mode="wait">
              {activeTab === "blueprint" && blueprint && (
                <motion.div key="blueprint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 mb-6">
                  {/* Your Future Self Is */}
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="glass-card rounded-2xl p-5 border border-primary/25">
                    <p className="text-xs uppercase tracking-widest text-primary/70 font-semibold mb-2">Your Future Self Is</p>
                    <p className="text-sm font-semibold text-foreground leading-relaxed">{blueprint.identity}</p>
                  </motion.div>

                  {/* How You Think */}
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                    className="glass-card rounded-2xl p-5 border border-border">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-2">How You Think</p>
                    <p className="text-sm text-foreground/80 leading-relaxed">{blueprint.mindset}</p>
                  </motion.div>

                  {/* Your Daily Standards */}
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="glass-card rounded-2xl p-5 border border-border">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-2">Your Daily Standards</p>
                    <p className="text-sm text-foreground/80 leading-relaxed">{blueprint.standards}</p>
                  </motion.div>

                  {/* Activation Steps */}
                  {blueprint.activation.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                      className="glass-card rounded-2xl p-5 border border-border">
                      <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3">Next Steps</p>
                      <div className="space-y-2">
                        {blueprint.activation.map((step, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="text-xs font-bold text-primary shrink-0 mt-0.5">{i + 1}</span>
                            <p className="text-sm text-foreground/80 leading-relaxed">{step}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Coach Tab */}
              {activeTab === "coach" && (
                <motion.div key="coach" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-[calc(100vh-280px)]">
                  {!hasCoachAccess ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                      <Lock className="w-8 h-8 text-muted-foreground mb-3" />
                      <h3 className="font-playfair text-lg font-semibold mb-2">Coach Access</h3>
                      <p className="text-sm text-muted-foreground mb-6 max-w-xs">AI coaching is available on Premium and Supporter plans</p>
                      <button onClick={() => navigate("/pricing")}
                        className="px-6 py-2 gold-gradient text-background font-semibold rounded-xl">
                        View Plans
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Messages */}
                      <div className="flex-1 overflow-y-auto mb-4 space-y-3">
                        {messages.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-8 text-center">
                            <Sparkles className="w-6 h-6 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">Ask your Future Self Coach for guidance</p>
                          </div>
                        ) : (
                          messages.map((msg, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                              <div className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                                msg.role === "user"
                                  ? "bg-primary text-background"
                                  : "bg-card border border-border text-foreground"
                              }`}>
                                <ReactMarkdown className="text-sm leading-relaxed prose prose-sm prose-invert max-w-none">
                                  {msg.content}
                                </ReactMarkdown>
                              </div>
                            </motion.div>
                          ))
                        )}
                        {coaching && (
                          <div className="flex justify-start">
                            <div className="px-4 py-3 rounded-2xl bg-card border border-border text-foreground">
                              <div className="flex gap-1">
                                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.2s" }} />
                                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.4s" }} />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Input */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={input}
                          onChange={e => setInput(e.target.value)}
                          onKeyPress={e => e.key === "Enter" && handleCoachMessage()}
                          placeholder="Ask for guidance..."
                          disabled={coaching}
                          className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 disabled:opacity-50"
                        />
                        <button
                          onClick={handleCoachMessage}
                          disabled={!input.trim() || coaching}
                          className="w-10 h-10 rounded-xl bg-primary text-background flex items-center justify-center disabled:opacity-50 shrink-0">
                          {coaching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </AppLayout>
  );
}