import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { generateAnalysis } from "@/lib/aiEngine";

const INCOME_RANGES = ["Under $30k", "$30k–$60k", "$60k–$100k", "$100k–$200k", "$200k–$500k", "$500k+"];

const SLIDERS = [
  { key: "energy_level", label: "Energy Level", desc: "How energized do you feel daily?" },
  { key: "confidence_level", label: "Confidence", desc: "How confident do you feel in yourself?" },
  { key: "discipline_level", label: "Discipline", desc: "How consistent are you with your commitments?" },
  { key: "sleep_quality", label: "Sleep Quality", desc: "How well do you sleep on average?" },
  { key: "stress_level", label: "Stress Level", desc: "How often do you feel overwhelmed?" },
  { key: "productivity_level", label: "Productivity", desc: "How productive are your daily work sessions?" },
  { key: "fitness_habits", label: "Fitness Habits", desc: "How consistent are you with physical exercise?" },
  { key: "financial_habits", label: "Financial Habits", desc: "How intentional are you with money?" },
  { key: "emotional_state", label: "Emotional State", desc: "How balanced is your emotional wellbeing?" },
  { key: "self_image", label: "Self-Image", desc: "How positively do you view yourself?" },
  { key: "consistency_level", label: "Consistency", desc: "How reliably do you follow through on goals?" },
];

const STEPS = [
  { title: "Income & Environment", keys: ["income_range"] },
  { title: "Energy & Wellbeing", keys: ["energy_level", "sleep_quality", "stress_level", "emotional_state"] },
  { title: "Mindset & Identity", keys: ["confidence_level", "self_image", "limiting_beliefs"] },
  { title: "Discipline & Habits", keys: ["discipline_level", "consistency_level", "fitness_habits", "financial_habits", "productivity_level"] },
  { title: "Obstacles & Goals", keys: ["biggest_obstacles", "journal_notes"] },
];

export default function Assessment() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    income_range: "",
    energy_level: 5,
    confidence_level: 5,
    discipline_level: 5,
    sleep_quality: 5,
    stress_level: 5,
    productivity_level: 5,
    fitness_habits: 5,
    financial_habits: 5,
    emotional_state: 5,
    self_image: 5,
    consistency_level: 5,
    limiting_beliefs: "",
    biggest_obstacles: "",
    journal_notes: "",
  });

  const setField = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const handleFinish = async () => {
    setLoading(true);
    const user = await base44.auth.me();
    const assessment = await base44.entities.Assessment.create({
      ...form,
      user_email: user.email,
    });

    const analysis = generateAnalysis(form);
    const score = await base44.entities.ScoreHistory.create({
      user_email: user.email,
      assessment_id: assessment.id,
      overall_score: analysis.overall_score,
      mindset_score: analysis.mindset_score,
      discipline_score: analysis.discipline_score,
      financial_score: analysis.financial_score,
      health_score: analysis.health_score,
      confidence_score: analysis.confidence_score,
      environment_score: analysis.environment_score,
      insight_summary: analysis.insight_summary,
    });

    await base44.entities.AIAnalysis.create({
      user_email: user.email,
      assessment_id: assessment.id,
      score_id: score.id,
      strengths_summary: analysis.strengths_summary,
      misalignment_summary: analysis.misalignment_summary,
      limiting_beliefs: analysis.limiting_beliefs,
      replacement_beliefs: analysis.replacement_beliefs,
      habit_upgrades: analysis.habit_upgrades,
      daily_focus: analysis.daily_focus,
      future_self_statement: analysis.future_self_statement,
      affirmations: analysis.affirmations,
      action_plan: analysis.action_plan,
      identity_shifts: analysis.identity_shifts,
    });

    // Generate daily plan
    const today = new Date().toISOString().split("T")[0];
    const existingPlan = await base44.entities.DailyShiftPlan.filter({ user_email: user.email, plan_date: today });
    if (existingPlan.length === 0) {
      await base44.entities.DailyShiftPlan.create({
        user_email: user.email,
        plan_date: today,
        habits: analysis.habit_upgrades.slice(0, 3),
        mindset_focus: analysis.daily_focus,
        affirmation: analysis.affirmations[0],
        action_challenge: analysis.action_plan[0],
        visualization_prompt: `Visualize yourself living as ${analysis.future_self_statement}. Feel the energy of that reality now.`,
        reflection_prompt: "What one action today moves me closest to my future self?",
        completed_habits: [],
        is_completed: false,
      });
    }

    // Save affirmations
    for (const aff of analysis.affirmations.slice(0, 3)) {
      await base44.entities.Affirmation.create({
        user_email: user.email,
        text: aff,
        source_type: "ai",
        is_favorited: false,
      });
    }

    // Mark onboarding complete
    const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
    if (profiles[0]) {
      await base44.entities.UserProfile.update(profiles[0].id, { onboarding_completed: true });
    }

    navigate("/score");
  };

  const currentStepData = STEPS[step];
  const relevantSliders = SLIDERS.filter(s => currentStepData.keys.includes(s.key));

  const sliderColor = (val) => {
    if (val >= 7) return "bg-emerald-500";
    if (val >= 5) return "bg-yellow-500";
    return "bg-orange-500";
  };

  return (
    <AppLayout>
      <div className="px-5 pt-12 pb-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center">
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <p className="text-xs uppercase tracking-widest text-primary/70 font-medium">Assessment {step + 1}/{STEPS.length}</p>
            <h1 className="font-playfair text-xl font-semibold">{currentStepData.title}</h1>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-border rounded-full mb-8 overflow-hidden">
          <motion.div animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            className="h-full gold-gradient rounded-full" transition={{ duration: 0.4 }} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }} className="space-y-6">

            {/* Income select - Step 0 */}
            {currentStepData.keys.includes("income_range") && (
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">Current Annual Income</p>
                <p className="text-xs text-muted-foreground mb-3">Approximate range is fine</p>
                <div className="grid grid-cols-2 gap-2">
                  {INCOME_RANGES.map(r => (
                    <button key={r} onClick={() => setField("income_range", r)}
                      className={`py-3 px-4 rounded-xl text-sm font-medium border transition-all ${
                        form.income_range === r
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground hover:border-primary/30"
                      }`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sliders */}
            {relevantSliders.map(slider => (
              <div key={slider.key}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-foreground">{slider.label}</p>
                  <span className={`text-sm font-bold ${
                    form[slider.key] >= 7 ? "text-emerald-400" : form[slider.key] >= 5 ? "text-yellow-400" : "text-orange-400"
                  }`}>{form[slider.key]}/10</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{slider.desc}</p>
                <div className="relative">
                  <input type="range" min="1" max="10" value={form[slider.key]}
                    onChange={e => setField(slider.key, parseInt(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, hsl(45 80% 60%) ${(form[slider.key] - 1) / 9 * 100}%, hsl(220 15% 18%) ${(form[slider.key] - 1) / 9 * 100}%)`
                    }} />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground/50 mt-1">
                  <span>Low</span><span>High</span>
                </div>
              </div>
            ))}

            {/* Limiting beliefs */}
            {currentStepData.keys.includes("limiting_beliefs") && (
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">Limiting Beliefs</p>
                <p className="text-xs text-muted-foreground mb-3">What negative thoughts hold you back most? Be honest.</p>
                <textarea value={form.limiting_beliefs}
                  onChange={e => setField("limiting_beliefs", e.target.value)}
                  placeholder="e.g. I don't deserve success, I'm not smart enough, Money is hard to make..."
                  rows={4}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 resize-none" />
              </div>
            )}

            {/* Biggest obstacles */}
            {currentStepData.keys.includes("biggest_obstacles") && (
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">Biggest Obstacles</p>
                <p className="text-xs text-muted-foreground mb-3">What's standing between you and your vision?</p>
                <textarea value={form.biggest_obstacles}
                  onChange={e => setField("biggest_obstacles", e.target.value)}
                  placeholder="e.g. Lack of time, inconsistency, fear of failure, financial pressure..."
                  rows={4}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 resize-none" />
              </div>
            )}

            {/* Journal notes */}
            {currentStepData.keys.includes("journal_notes") && (
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">Anything Else?</p>
                <p className="text-xs text-muted-foreground mb-3">Share anything else about your current reality</p>
                <textarea value={form.journal_notes}
                  onChange={e => setField("journal_notes", e.target.value)}
                  placeholder="Optional: Add context about your current situation..."
                  rows={3}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 resize-none" />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8">
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)}
              className="w-full py-4 gold-gradient text-background font-semibold rounded-xl flex items-center justify-center gap-2">
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleFinish} disabled={loading}
              className="w-full py-4 gold-gradient text-background font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-40">
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing your reality...</>
              ) : (
                <>Generate My Reality Match Score ✦</>
              )}
            </button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}