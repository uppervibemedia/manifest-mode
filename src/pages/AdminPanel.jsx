import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { useTestProfile } from "@/lib/testProfileContext";
import { Shield, Plus, Trash2, User, CheckCircle, LogOut, ChevronRight, AlertTriangle } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

const PRESET_PROFILES = [
  { label: "New User (no data)", email: "test+newuser@testprofile.local" },
  { label: "Mid Journey User", email: "test+miduser@testprofile.local" },
  { label: "Power User", email: "test+poweruser@testprofile.local" },
];

export default function AdminPanel() {
  const [realUser, setRealUser] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [newLabel, setNewLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const { testEmail, setTestEmail } = useTestProfile();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const u = await base44.auth.me();
      if (u?.role !== "admin") {
        navigate("/");
        return;
      }
      setRealUser(u);
      loadProfiles();
      setLoading(false);
    })();
  }, []);

  const loadProfiles = () => {
    const stored = JSON.parse(localStorage.getItem("b44_test_profiles") || "[]");
    setProfiles(stored);
  };

  const saveProfiles = (list) => {
    localStorage.setItem("b44_test_profiles", JSON.stringify(list));
    setProfiles(list);
  };

  const addProfile = () => {
    const label = newLabel.trim() || `Test Profile ${profiles.length + 1}`;
    const slug = label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const email = `test+${slug}@testprofile.local`;
    const newProfile = { label, email, created: new Date().toISOString() };
    saveProfiles([...profiles, newProfile]);
    setNewLabel("");
  };

  const addPreset = (preset) => {
    if (profiles.find(p => p.email === preset.email)) return;
    saveProfiles([...profiles, { ...preset, created: new Date().toISOString() }]);
  };

  const deleteProfile = (email) => {
    if (testEmail === email) setTestEmail(null);
    saveProfiles(profiles.filter(p => p.email !== email));
  };

  const switchTo = (email) => {
    setTestEmail(email);
    navigate("/");
  };

  const exitTestMode = () => {
    setTestEmail(null);
    navigate("/");
  };

  if (loading) return (
    <AppLayout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="px-5 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-primary/70 font-medium">Admin</p>
            <h1 className="font-playfair text-2xl font-semibold">Test Profiles</h1>
          </div>
        </div>

        {/* Current mode banner */}
        {testEmail ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="glass-card border border-amber-400/30 bg-amber-400/5 rounded-xl p-4 mb-5 flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-amber-400">Test Mode Active</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{testEmail}</p>
            </div>
            <button onClick={exitTestMode}
              className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 border border-amber-400/30 px-3 py-1.5 rounded-lg">
              <LogOut className="w-3.5 h-3.5" /> Exit
            </button>
          </motion.div>
        ) : (
          <div className="glass-card border border-emerald-500/20 rounded-xl p-4 mb-5 flex items-center gap-3">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-emerald-400">Real Account Active</p>
              <p className="text-xs text-muted-foreground mt-0.5">{realUser?.email}</p>
            </div>
          </div>
        )}

        {/* Preset profiles */}
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-2">Quick Presets</p>
        <div className="space-y-2 mb-5">
          {PRESET_PROFILES.map(preset => {
            const alreadyAdded = profiles.find(p => p.email === preset.email);
            return (
              <div key={preset.email} className="glass-card border border-border rounded-xl p-3 flex items-center gap-3">
                <User className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{preset.label}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{preset.email}</p>
                </div>
                {alreadyAdded ? (
                  <button onClick={() => switchTo(preset.email)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                      testEmail === preset.email
                        ? "bg-primary text-background border-primary"
                        : "border-primary/30 text-primary"
                    }`}>
                    {testEmail === preset.email ? "Active" : "Use"}
                  </button>
                ) : (
                  <button onClick={() => addPreset(preset)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border text-muted-foreground">
                    Add
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Custom profiles */}
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-2">Custom Profiles</p>

        {/* Create new */}
        <div className="glass-card border border-border rounded-xl p-4 mb-3 flex gap-2">
          <input
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addProfile()}
            placeholder="Profile name..."
            className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40"
          />
          <button onClick={addProfile}
            className="w-10 h-10 gold-gradient rounded-lg flex items-center justify-center text-background shrink-0">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          <AnimatePresence>
            {profiles.map((profile, i) => (
              <motion.div key={profile.email}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.04 }}
                className={`glass-card rounded-xl p-4 flex items-center gap-3 border transition-all ${
                  testEmail === profile.email ? "border-primary/40 bg-primary/5" : "border-border"
                }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  testEmail === profile.email ? "gold-gradient text-background" : "bg-muted text-muted-foreground"
                }`}>
                  {profile.label[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{profile.label}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{profile.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => testEmail === profile.email ? exitTestMode() : switchTo(profile.email)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                      testEmail === profile.email
                        ? "bg-primary/20 border-primary/40 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                    }`}>
                    {testEmail === profile.email ? "Active" : "Use"}
                  </button>
                  <button onClick={() => deleteProfile(profile.email)}
                    className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:bg-destructive/20 transition-colors">
                    <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {profiles.length === 0 && (
            <p className="text-center text-xs text-muted-foreground/50 italic py-4">
              No custom profiles yet — add one above.
            </p>
          )}
        </div>

        <div className="mt-6 glass-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground/70 leading-relaxed">
            <span className="font-semibold text-muted-foreground">How it works:</span> Switching to a test profile scopes all app data to that test email address. The app behaves as if you are a brand new user with that email. No real user data is affected.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}