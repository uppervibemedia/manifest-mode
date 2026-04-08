import { useState } from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ChevronRight, Sparkles, Eye, Brain, BarChart3, Zap, Star, Crown, Check } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import NotificationOptIn from "@/components/onboarding/NotificationOptIn";

const SLIDES = [
  {
    icon: <Eye className="w-10 h-10" />,
    title: "Living Vision Board",
    subtitle: "Your future, made visual",
    desc: "Upload images of the life you intend to live — wealth, body, love, home, business, lifestyle, and spiritual growth — all in one intelligent, premium space.",
  },
  {
    icon: <Brain className="w-10 h-10" />,
    title: "Analyze Your Alignment",
    subtitle: "AI-powered reality check",
    desc: "Our AI measures the gap between who you are now and who you need to become to achieve your vision.",
  },
  {
    icon: <Zap className="w-10 h-10" />,
    title: "Rewire Your Identity",
    subtitle: "Daily habits & mindset shifts",
    desc: "Receive personalized belief rewrites, habit upgrades, and a daily plan built around your specific gaps.",
  },
  {
    icon: <BarChart3 className="w-10 h-10" />,
    title: "Track Your Evolution",
    subtitle: "Watch your reality shift",
    desc: "Your Reality Match Score updates as your habits, mindset, and actions align with your future self.",
  },
];

const UPSELL_FEATURES = [
  { icon: "🧠", text: "Full AI Reality Match assessment" },
  { icon: "📊", text: "Score history & progress tracking" },
  { icon: "🔮", text: "Future Self Blueprint & AI coach" },
  { icon: "🖼️", text: "Up to 15 vision board items" },
];

export default function Onboarding() {
  const [step, setStep] = useState(0); // 0=slides, 1=categories, 2=notifications, 3=upsell
  const [slideIndex, setSlideIndex] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const toggleCategory = (id) => {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const saveAndProceed = async () => {
    setLoading(true);
    const user = await base44.auth.me();
    const existing = await base44.entities.UserProfile.filter({ user_email: user.email });
    if (existing.length > 0) {
      await base44.entities.UserProfile.update(existing[0].id, { goal_categories: selectedCategories });
    } else {
      await base44.entities.UserProfile.create({
        user_email: user.email,
        goal_categories: selectedCategories,
        subscription_tier: "free",
        onboarding_completed: false,
        streak_count: 0,
      });
    }
    setLoading(false);
    setStep(2);
  };

  const handleFinish = () => navigate("/assessment");

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 py-10 pb-32 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-64 h-64 rounded-full bg-accent/5 blur-3xl pointer-events-none" />

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="slides"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-sm flex flex-col items-center"
          >
            {/* Logo */}
            <div className="flex items-center gap-2 mb-10">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="font-playfair text-xl font-semibold gold-text">Manifest Mode</span>
            </div>

            {/* Slide */}
            <AnimatePresence mode="wait">
              <motion.div
                key={slideIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="glass-card rounded-2xl p-8 w-full text-center mb-8"
              >
                <div className="w-20 h-20 gold-gradient rounded-2xl flex items-center justify-center mx-auto mb-6 text-background">
                  {SLIDES[slideIndex].icon}
                </div>
                <p className="text-xs uppercase tracking-widest text-primary/70 mb-2 font-medium">
                  {SLIDES[slideIndex].subtitle}
                </p>
                <h2 className="font-playfair text-2xl font-semibold text-foreground mb-3">
                  {SLIDES[slideIndex].title}
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {SLIDES[slideIndex].desc}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Dots */}
            <div className="flex gap-2 mb-8">
              {SLIDES.map((_, i) => (
                <button key={i} onClick={() => setSlideIndex(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === slideIndex ? "w-6 bg-primary" : "w-1.5 bg-border"}`}
                />
              ))}
            </div>

            {/* Buttons */}
            {slideIndex < SLIDES.length - 1 ? (
              <div className="w-full flex gap-3">
                <button onClick={() => setStep(1)}
                  className="flex-1 py-3 text-sm text-muted-foreground border border-border rounded-xl">
                  Skip
                </button>
                <button onClick={() => setSlideIndex(i => i + 1)}
                  className="flex-1 py-3 text-sm font-medium gold-gradient text-background rounded-xl flex items-center justify-center gap-2">
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button onClick={() => setStep(1)}
                className="w-full py-4 font-semibold gold-gradient text-background rounded-xl flex items-center justify-center gap-2">
                Get Started <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="categories"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-sm"
          >
            <div className="text-center mb-8">
              <p className="text-xs uppercase tracking-widest text-primary/70 mb-2 font-medium">Step 1 of 5</p>
              <h2 className="font-playfair text-2xl font-semibold text-foreground mb-2">
                Choose Your Focus
              </h2>
              <p className="text-muted-foreground text-sm">Select the areas of your life you want to transform</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-8">
              {CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => toggleCategory(cat.id)}
                  className={`relative p-4 rounded-xl border text-left transition-all duration-200 ${
                    selectedCategories.includes(cat.id)
                      ? "border-primary bg-primary/10 glow-gold"
                      : "border-border bg-card hover:border-primary/40"
                  }`}>
                  <span className="text-2xl block mb-2">{cat.icon}</span>
                  <p className="text-sm font-semibold text-foreground">{cat.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{cat.meaning}</p>
                  {selectedCategories.includes(cat.id) && (
                    <Star className="w-3 h-3 text-primary absolute top-3 right-3 fill-primary" />
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={saveAndProceed}
              disabled={selectedCategories.length === 0 || loading}
              className="w-full py-4 font-semibold gold-gradient text-background rounded-xl disabled:opacity-40 flex items-center justify-center gap-2">
              {loading ? (
                <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
              ) : (
                <>Continue <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <NotificationOptIn
            onContinue={() => setStep(3)}
            onSkip={() => setStep(3)}
          />
        )}

        {step === 3 && (
          <motion.div
            key="upsell"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-sm"
          >
            <div className="text-center mb-6">
              <div className="w-14 h-14 gold-gradient rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Crown className="w-7 h-7 text-background" />
              </div>
              <p className="text-xs uppercase tracking-widest text-primary/70 mb-2 font-medium">Unlock Your Potential</p>
              <h2 className="font-playfair text-2xl font-semibold text-foreground mb-2">
                Start with Plus — Free for 7 Days
              </h2>
              <p className="text-muted-foreground text-sm">Get the full experience. No charge today.</p>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-primary/20 glow-gold mb-5">
              <div className="space-y-3">
                {UPSELL_FEATURES.map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-lg">{f.icon}</span>
                    <span className="text-sm text-foreground">{f.text}</span>
                    <Check className="w-4 h-4 text-primary ml-auto shrink-0" />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4 text-center">Then $7.99/month · Cancel anytime</p>
            </div>

            <button
              onClick={() => navigate("/pricing")}
              className="w-full py-4 font-semibold gold-gradient text-background rounded-xl flex items-center justify-center gap-2 mb-3">
              Start Free Trial <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleFinish}
              className="w-full py-3 text-sm text-muted-foreground border border-border rounded-xl">
              Continue with Free Plan
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}