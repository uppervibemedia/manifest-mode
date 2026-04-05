import { Link, useLocation } from "react-router-dom";
import { Zap, Image, TrendingUp, User, Sparkles } from "lucide-react";

const NAV_ITEMS = [
  { path: "/daily-shift", icon: Zap, label: "Daily Shift", id: "shift" },
  { path: "/vision", icon: Image, label: "Vision", id: "vision" },
  { path: "/progress", icon: TrendingUp, label: "Progress", id: "progress" },
  { path: "/future-self", icon: Sparkles, label: "Future Self", id: "future" },
  { path: "/profile", icon: User, label: "Profile", id: "profile" },
];

// nav bar height ~72px + safe area. We give pages enough room so CTAs are never blocked.
export default function AppLayout({ children }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto relative">
      <main className="flex-1 overflow-y-auto" style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom, 0px))" }}>
        {children}
      </main>

      <nav
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 glass-card border-t border-border"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex items-center justify-around px-2 py-3">
          {NAV_ITEMS.map(({ path, icon: Icon, label, id }) => {
            const active = location.pathname === path || (path === "/daily-shift" && location.pathname === "/");
            return (
              <Link key={path} to={path}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-12 h-14 justify-center ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label={label}>
                <Icon className={`w-6 h-6 transition-all ${active ? "scale-110" : ""}`} />
                <span className={`text-[10px] font-medium leading-tight ${active ? "text-primary" : ""}`}>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}