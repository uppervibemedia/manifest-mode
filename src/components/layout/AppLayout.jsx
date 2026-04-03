import { Link, useLocation } from "react-router-dom";
import { Home, Image, TrendingUp, Zap, User } from "lucide-react";

const NAV_ITEMS = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/vision-vault", icon: Image, label: "Vision" },
  { path: "/tracker", icon: TrendingUp, label: "Tracker" },
  { path: "/shift-plan", icon: Zap, label: "Shift" },
  { path: "/profile", icon: User, label: "Profile" },
];

export default function AppLayout({ children }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto relative">
      <main className="flex-1 overflow-y-auto pb-24">
        {children}
      </main>
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 glass-card border-t border-border">
        <div className="flex items-center justify-around px-2 py-3">
          {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
            const active = location.pathname === path;
            return (
              <Link key={path} to={path}
                className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all duration-200 ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}>
                <Icon className={`w-5 h-5 transition-all ${active ? "scale-110" : ""}`} />
                <span className={`text-[10px] font-medium ${active ? "text-primary" : ""}`}>{label}</span>
                {active && <div className="w-1 h-1 rounded-full bg-primary absolute -bottom-0" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}