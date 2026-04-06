import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, Sparkles } from 'lucide-react';

const TAB_ROOTS = ['/daily-shift', '/vision', '/progress', '/future-self', '/profile'];

export default function MobileHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const isTabRoot = TAB_ROOTS.includes(location.pathname) || location.pathname === '/';

  return (
    <div
      className="fixed top-0 left-0 right-0 z-40 max-w-md mx-auto glass-card border-b border-border"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="flex items-center justify-between px-5 h-14">
        {isTabRoot ? (
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-playfair text-lg font-semibold gold-text">Manifest Mode</span>
          </div>
        ) : (
          <>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-11 h-11 rounded-lg hover:bg-card transition-colors active:bg-card/80 min-w-11"
              aria-label="Go back"
            >
              <ChevronLeft className="w-6 h-6 text-foreground" />
            </button>
            <h1 className="flex-1 text-center font-playfair text-base font-semibold truncate px-2">
              {getPageTitle(location.pathname)}
            </h1>
            <div className="w-11" />
          </>
        )}
      </div>
    </div>
  );
}

function getPageTitle(pathname) {
  const titles = {
    '/daily-shift': 'Daily Shift',
    '/vision': 'Vision',
    '/vision-vault': 'Vision Vault',
    '/progress': 'Progress',
    '/future-self': 'Future Self',
    '/profile': 'Profile',
    '/pricing': 'Plans',
    '/blueprint': 'Blueprint',
    '/score': 'Reality Match',
  };
  return titles[pathname] || 'Manifest Mode';
}