import { useLocation, useNavigate } from "react-router-dom";
import { useRef, useEffect } from "react";
import { Zap, Image, TrendingUp, User, Sparkles } from "lucide-react";
import { useModalState } from "@/lib/ModalContext";
import { trackPageVisit } from "@/lib/dailyRoutingEngine";

const NAV_ITEMS = [
  { path: "/daily-shift", icon: Zap, label: "Daily Shift", id: "shift" },
  { path: "/vision", icon: Image, label: "Vision", id: "vision" },
  { path: "/progress", icon: TrendingUp, label: "Progress", id: "progress" },
  { path: "/future-self", icon: Sparkles, label: "Future Self", id: "future" },
  { path: "/profile", icon: User, label: "Profile", id: "profile" },
];

const TAB_ROOTS = {
  shift: "/daily-shift",
  vision: "/vision",
  progress: "/progress",
  future: "/future-self",
  profile: "/profile",
};

// Module-level scroll positions — survive re-renders and tab switches
const tabScrollPositions = {
  shift: 0, vision: 0, progress: 0, future: 0, profile: 0,
};

export function getTabId(pathname) {
  if (pathname === "/" || pathname === "/daily-shift") return "shift";
  if (pathname.startsWith("/vision")) return "vision";
  if (pathname.startsWith("/progress")) return "progress";
  if (pathname.startsWith("/future-self")) return "future";
  if (pathname.startsWith("/profile")) return "profile";
  return null;
}

export default function AppLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const prevTabRef = useRef(getTabId(location.pathname));
  const { activeFullscreenModal } = useModalState();
  // Only hide the bottom nav for full-screen AI flows, not every modal
  const hideNav = activeFullscreenModal === "see-me-vision";

  const currentTabId = getTabId(location.pathname);

  // Track page visits for daily routing
  useEffect(() => {
    trackPageVisit(location.pathname);
  }, [location.pathname]);

  // Save scroll of leaving tab, restore scroll of arriving tab
  useEffect(() => {
    const prevTab = prevTabRef.current;
    const nextTab = currentTabId;

    // Save outgoing tab's scroll
    if (prevTab && prevTab !== nextTab && containerRef.current) {
      tabScrollPositions[prevTab] = containerRef.current.scrollTop;
    }

    prevTabRef.current = nextTab;

    // Restore incoming tab's scroll after paint
    if (nextTab) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (containerRef.current) {
            containerRef.current.scrollTo({ top: tabScrollPositions[nextTab] ?? 0, behavior: "instant" });
          }
        });
      });
    }
  }, [location.pathname]);

  const handleTabPress = (id, path) => {
    if (currentTabId === id) {
      // Re-tapping active tab: reset to root + scroll to top
      tabScrollPositions[id] = 0;
      if (containerRef.current) containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
      if (location.pathname !== TAB_ROOTS[id]) navigate(TAB_ROOTS[id]);
    } else {
      navigate(path);
    }
  };

  return (
    <div
      className="bg-background flex flex-col max-w-md mx-auto relative"
      style={{ minHeight: "100dvh" }}
    >
      <main
        ref={containerRef}
        className="flex-1 overflow-y-auto"
        style={{
          paddingTop: "calc(3.5rem + env(safe-area-inset-top, 0px))",
          paddingBottom: hideNav ? "0px" : "calc(6rem + env(safe-area-inset-bottom, 0px))",
        }}
      >
        {children}
      </main>

      {!hideNav && (
        <nav
          role="tablist"
          aria-label="Main navigation"
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-[60] glass-card border-t border-border"
        >
          <div className="flex items-center justify-around px-2 py-3" style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}>
            {NAV_ITEMS.map(({ path, icon: Icon, label, id }) => {
              const active = currentTabId === id;
              return (
                <button
                  key={path}
                  role="tab"
                  aria-selected={active}
                  aria-label={label}
                  onClick={() => handleTabPress(id, path)}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-12 h-14 justify-center ${
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className={`w-6 h-6 transition-all ${active ? "scale-110" : ""}`} aria-hidden="true" />
                  <span className={`text-[10px] font-medium leading-tight ${active ? "text-primary" : ""}`}>{label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}