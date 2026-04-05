import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { RefreshCw, ArrowRight, ChevronRight } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import ScoreRing from "@/components/score/ScoreRing";
import CategoryScoreCard from "@/components/score/CategoryScoreCard";

export default function ScorePage() {
  const [score, setScore] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const isOnboarding = new URLSearchParams(window.location.search).get("onboarding") === "1";

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const user = await base44.auth.me();
    const [scores, analyses] = await Promise.all([
      base44.entities.ScoreHistory.filter({ user_email: user.email }, "-created_date", 10),
      base44.entities.AIAnalysis.filter({ user_email: user.email }, "-created_date", 1),
    ]);
    setScore(scores[0] || null);
    setHistory(scores);
    setAnalysis(analyses[0] || null);
    setLoading(false);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  // ── Onboarding streamlined score reveal ──
  if (isOnboarding && score) {
    const strengthInsight = analysis?.strengths_summary || null;
    const gapInsight = analysis?.misalignment_summary || null;
    return (
      <div className="min-h-screen bg-background flex flex-col px-5 py-10 max-w-md mx-auto relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className={`flex-1 h-1 rounded-full ${n <= 1 ? "bg-primary" : "bg-border"}`} />
          ))}
        </div>

        <p className="text-xs uppercase tracking-widest text-primary/70 font-medium mb-1">Step 1 of 4</p>
        <h1 className="font-playfair text-2xl font-semibold mb-1">Your Reality Match Score</h1>
        <p className="text-sm text-muted-foreground mb-8">This is where you are today. Let's close the gap.</p>

        <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center mb-8">
          <ScoreRing score={score.overall_score} />
          <p className="text-sm text-muted-foreground mt-3 text-center max-w-xs">{score.insight_summary}</p>
        </motion.div>

        {strengthInsight && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="glass-card rounded-xl p-4 border border-emerald-500/20 mb-3">
            <p className="text-xs uppercase tracking-widest text-emerald-400 font-medium mb-1.5">✦ What's working</p>
            <p className="text-sm text-foreground/80 leading-relaxed">{strengthInsight}</p>
          </motion.div>
        )}

        {gapInsight && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="glass-card rounded-xl p-4 border border-orange-500/20 mb-8">
            <p className="text-xs uppercase tracking-widest text-orange-400 font-medium mb-1.5">⚡ Biggest gap</p>
            <p className="text-sm text-foreground/80 leading-relaxed">{gapInsight}</p>
          </motion.div>
        )}

        <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          onClick={() => navigate("/onboarding/future-self")}
          className="w-full py-4 gold-gradient text-background font-semibold rounded-xl flex items-center justify-center gap-2">
          Now let's build your Future Self <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
    );
  }

  const categories = score ? [
    { label: "Mindset", score: score.mindset_score, icon: "🧠" },
    { label: "Discipline", score: score.discipline_score, icon: "⚡" },
    { label: "Health", score: score.health_score, icon: "💪" },
    { label: "Financial", score: score.financial_score, icon: "💰" },
    { label: "Confidence", score: score.confidence_score, icon: "🔥" },
    { label: "Environment", score: score.environment_score, icon: "🌿" },
  ] : [];

  return (
    <AppLayout>
      <div className="px-5 pt-12 pb-32">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-widest text-primary/70 font-medium mb-1">Your Alignment</p>
          <h1 className="font-playfair text-2xl font-semibold">Reality Match Score</h1>
        </div>

        {!score ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 rounded-full glass-card border border-primary/20 flex items-center justify-center mb-6">
              <span className="text-4xl font-playfair font-bold text-muted-foreground">—</span>
            </div>
            <h2 className="font-playfair text-xl font-semibold mb-2">No Score Yet</h2>
            <p className="text-sm text-muted-foreground mb-8 max-w-xs">Complete your Reality Assessment to receive your personalized alignment score</p>
            <button onClick={() => navigate("/assessment")}
              className="px-6 py-3 gold-gradient text-background font-semibold rounded-xl flex items-center gap-2">
              Take Assessment <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        ) : (
          <>
            {/* Score Ring */}
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center mb-8">
              <ScoreRing score={score.overall_score} />
              <p className="text-sm text-muted-foreground mt-3 text-center max-w-xs">
                {score.insight_summary}
              </p>
            </motion.div>

            {/* Category Scores */}
            <div className="mb-6">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">Category Breakdown</p>
              <div className="grid grid-cols-2 gap-3">
                {categories.map((cat, i) => (
                  <motion.div key={cat.label} initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                    <CategoryScoreCard {...cat} />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Strengths & Blocks */}
            {analysis && (
              <>
                <div className="glass-card rounded-2xl p-4 mb-4 border border-emerald-500/20">
                  <p className="text-xs uppercase tracking-widest text-emerald-400 font-medium mb-2">✦ Strengths</p>
                  <p className="text-sm text-foreground/80 leading-relaxed">{analysis.strengths_summary}</p>
                </div>
                <div className="glass-card rounded-2xl p-4 mb-4 border border-orange-500/20">
                  <p className="text-xs uppercase tracking-widest text-orange-400 font-medium mb-2">⚠ Key Misalignments</p>
                  <p className="text-sm text-foreground/80 leading-relaxed">{analysis.misalignment_summary}</p>
                </div>

                {/* Limiting Beliefs */}
                <div className="glass-card rounded-2xl p-4 mb-4">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">Beliefs to Release</p>
                  <div className="space-y-2">
                    {analysis.limiting_beliefs?.map((b, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-orange-400 text-xs mt-0.5">✕</span>
                        <p className="text-sm text-muted-foreground">{b}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Replacement Beliefs */}
                <div className="glass-card rounded-2xl p-4 mb-6">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">Beliefs to Adopt</p>
                  <div className="space-y-2">
                    {analysis.replacement_beliefs?.map((b, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-primary text-xs mt-0.5">✦</span>
                        <p className="text-sm text-foreground/80">{b}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* History */}
            {history.length > 1 && (
              <div className="mb-6">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">Score History</p>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {history.map((h, i) => (
                    <div key={h.id} className="shrink-0 glass-card rounded-xl p-3 text-center min-w-[70px]">
                      <p className={`text-lg font-bold font-playfair ${
                        h.overall_score >= 75 ? "text-emerald-400" : h.overall_score >= 50 ? "text-yellow-400" : "text-orange-400"
                      }`}>{h.overall_score}</p>
                      <p className="text-[9px] text-muted-foreground mt-0.5">
                        {new Date(h.created_date).toLocaleDateString("en", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Retake */}
            <button onClick={() => navigate("/assessment")}
              className="w-full glass-card border border-border rounded-xl py-3 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:border-primary/30 transition-colors">
              <RefreshCw className="w-4 h-4" /> Retake Assessment
            </button>
          </>
        )}
      </div>
    </AppLayout>
  );
}