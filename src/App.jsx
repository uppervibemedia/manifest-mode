import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, Outlet, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import PageNotFound from './lib/PageNotFound';
import LazyErrorBoundary from '@/lib/LazyErrorBoundary';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { UserProfileProvider, useUserProfile } from '@/lib/UserProfileContext';
import { ModalProvider, useModalState } from '@/lib/ModalContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import MobileHeader from '@/components/mobile/MobileHeader';
import AppLayout from '@/components/layout/AppLayout';

// Lazy load pages for code splitting
const DailyShift = lazy(() => import('./pages/DailyShift'));
const Vision = lazy(() => import('./pages/Vision'));
const Progress = lazy(() => import('./pages/Progress'));
const FutureSelf = lazy(() => import('./pages/FutureSelf'));
const Profile = lazy(() => import('./pages/Profile'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Assessment = lazy(() => import('./pages/Assessment'));
const ScorePage = lazy(() => import('./pages/ScorePage'));
const VisionVault = lazy(() => import('./pages/VisionVault'));
const Pricing = lazy(() => import('./pages/Pricing'));
const FutureSelfSetup = lazy(() => import('./pages/onboarding/FutureSelfSetup'));
const FirstVision = lazy(() => import('./pages/onboarding/FirstVision'));
const Blueprint = lazy(() => import('./pages/Blueprint'));

const LoadingFallback = () => (
  <AppLayout>
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  </AppLayout>
);

// Sync system dark/light mode preference with Tailwind's dark class
function useSystemColorScheme() {
  useEffect(() => {
    const apply = (dark) => {
      document.documentElement.classList.toggle('dark', dark);
    };
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    apply(mq.matches);
    const handler = (e) => apply(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
}

const AuthenticatedApp = () => {
  useSystemColorScheme();
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const location = useLocation();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-xs text-muted-foreground tracking-widest uppercase">Loading...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    } else {
      console.error('Auth error:', authError);
    }
  }

  return (
    <>
      <MobileHeader />
      <LazyErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18, ease: "easeInOut" }}
            style={{ minHeight: "100dvh" }}
          >
            <Routes location={location}>
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/onboarding/future-self" element={<FutureSelfSetup />} />
              <Route path="/onboarding/first-vision" element={<FirstVision />} />
              <Route path="/assessment" element={<Assessment />} />
              <Route path="/" element={<NewUserGate />} />
              <Route path="/score" element={<ScorePage />} />
              <Route path="/daily-shift" element={<DailyShift />} />
              <Route path="/vision" element={<Vision />} />
              <Route path="/vision-vault" element={<VisionVault />} />
              <Route path="/vision/add" element={<Vision />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/future-self" element={<FutureSelf />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/blueprint" element={<Blueprint />} />
              <Route path="*" element={<PageNotFound />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </Suspense>
      </LazyErrorBoundary>
    </>
  );
};

// Redirects new users (onboarding not complete) to assessment, otherwise to daily-shift
function NewUserGate() {
  const { user, profile, loading } = useUserProfile();
  
  if (loading) return null;
  
  // Public visitor — show onboarding
  if (!user) {
    return <Navigate to="/onboarding" replace />;
  }
  
  // Authenticated user — check onboarding status
  if (profile && !profile.onboarding_completed) {
    return <Navigate to="/assessment?onboarding=1" replace />;
  }
  
  return <Navigate to="/daily-shift" replace />;
}

function App() {
  return (
    <AuthProvider>
      <UserProfileProvider>
        <ModalProvider>
          <QueryClientProvider client={queryClientInstance}>
            <Router>
              <AuthenticatedApp />
            </Router>
            <Toaster />
          </QueryClientProvider>
        </ModalProvider>
      </UserProfileProvider>
    </AuthProvider>
  )
}

export default App