import { useState } from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ChevronRight, Loader2, Sparkles } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";

export default function FutureSelfSetup() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [preview, setPreview] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [step, setStep] = useState("pick"); // "pick" | "preview"

  const handleGenerate = async () => {
    if (!selected) return;
    setGenerating(true);
    try {
      const user = await base44.auth.me();
      const analyses = await base44.entities.AIAnalysis.filter({ user_email: user.email }, "-created_date", 1);
      const analysis = analyses[0];

      const cat = CATEGORIES.find(c => c.id === selected);
      const prompt = `Based on someone who wants to transform their ${cat?.label || selected} (${cat?.meaning || ""}), write a single powerful 2-sentence Future Self identity statement in first person. It should feel aspirational, grounded, and specific to this area. Start with "I am" or "I have". Keep it under 50 words.${analysis?.future_self_statement ? ` Context: their overall identity is: "${analysis.future_self_statement}"` : ""}`;

      const result = await base44.integrations.Core.InvokeLLM({ prompt });
      setPreview(result);
      setStep("preview");
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const handleContinue = async () => {
    try {
      const user = await base44.auth.me();
      const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      if (profiles[0]) {
        await base44.entities.UserProfile.update(profiles[0].id, {
          primary_focus: selected,
          goal_categories: [selected],
        });
      }
    } catch (e) {
      console.error(e);
    }
    navigate("/onboarding/first-vision");
  };

  const focusCategories = CATEGORIES.filter(c =>
    ["wealth", "body", "love", "business", "lifestyle", "spiritual", "home"].includes(c.id)
  );

  return (
    <div className="min-h-screen bg-background flex flex-col px-5 py-10 max-w-md mx-auto relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3, 4].map(n => (
          <div key={n} className={`flex-1 h-1 rounded-full ${n <= 2 ? "bg-primary" : "bg-border"}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === "pick" && (
          <motion.div key="pick" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
            <p className="text-xs uppercase tracking-widest text-primary/70 font-medium mb-1">Step 2 of 4</p>
            <h1 className="font-playfair text-2xl font-semibold mb-2">Who do you want to become?</h1>
            <p className="text-sm text-muted-foreground mb-7">Choose the area you want to transform first.</p>

            <div className="grid grid-cols-2 gap-3 mb-8">
              {focusCategories.map(cat => (
                <button key={cat.id} onClick={() => setSelected(cat.id)}
                  className={`relative p-4 rounded-xl border text-left transition-all ${
                    selected === cat.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/30"
                  }`}>
                  <span className="text-2xl block mb-2">{cat.icon}</span>
                  <p className={`text-sm font-semibold ${selected === cat.id ? "text-primary" : "text-foreground"}`}>{cat.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{cat.meaning}</p>
                </button>
              ))}
            </div>

            <button
              onClick={handleGenerate}
              disabled={!selected || generating}
              className="w-full py-4 gold-gradient text-background font-semibold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2">
              {generating
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating your identity...</>
                : <>Generate My Future Self Preview <ChevronRight className="w-4 h-4" /></>
              }
            </button>
          </motion.div>
        )}

        {step === "preview" && (
          <motion.div key="preview" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className="flex flex-col">
            <p className="text-xs uppercase tracking-widest text-primary/70 font-medium mb-1">Your Future Self</p>
            <h1 className="font-playfair text-2xl font-semibold mb-6">This is who you're becoming</h1>

            <div className="glass-card glow-gold rounded-2xl p-6 border border-primary/25 mb-5 text-center">
              <div className="w-12 h-12 gold-gradient rounded-xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-background" />
              </div>
              <p className="text-sm font-medium text-foreground/90 leading-relaxed italic">
                "{preview}"
              </p>
            </div>

            <div className="glass-card rounded-xl p-4 border border-border mb-8">
              <p className="text-xs text-muted-foreground leading-relaxed">
                This identity will guide your daily habits, affirmations, and vision board. You can refine it anytime as you grow.
              </p>
            </div>

            <button onClick={handleContinue}
              className="w-full py-4 gold-gradient text-background font-semibold rounded-xl flex items-center justify-center gap-2">
              I'm ready — show me my vision <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}