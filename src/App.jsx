import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import VisionVault from './pages/VisionVault';
import Assessment from './pages/Assessment';
import ScorePage from './pages/ScorePage';
import ShiftPlan from './pages/ShiftPlan';
import CheckIn from './pages/CheckIn';
import Blueprint from './pages/Blueprint';
import Journal from './pages/Journal';
import Profile from './pages/Profile';
import Pricing from './pages/Pricing';
import Progress from './pages/Progress';
import RealityShiftTracker from './pages/RealityShiftTracker';
import FutureSelfCoach from './pages/FutureSelfCoach';
import HabitTracker from './pages/HabitTracker';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-xs text-muted-foreground tracking-widest uppercase">Manifest Mode</p>
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
    }
  }

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/vision-vault" element={<VisionVault />} />
      <Route path="/assessment" element={<Assessment />} />
      <Route path="/score" element={<ScorePage />} />
      <Route path="/shift-plan" element={<ShiftPlan />} />
      <Route path="/checkin" element={<CheckIn />} />
      <Route path="/blueprint" element={<Blueprint />} />
      <Route path="/journal" element={<Journal />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/progress" element={<Progress />} />
      <Route path="/tracker" element={<RealityShiftTracker />} />
      <Route path="/coach" element={<FutureSelfCoach />} />
      <Route path="/daily-shift" element={<HabitTracker />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App