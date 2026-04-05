import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { UserProfileProvider } from '@/lib/UserProfileContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import DailyShift from './pages/DailyShift';
import Vision from './pages/Vision';
import Progress from './pages/Progress';
import FutureSelf from './pages/FutureSelf';
import Profile from './pages/Profile';
import Onboarding from './pages/Onboarding';
import Assessment from './pages/Assessment';
import ScorePage from './pages/ScorePage';
import VisionVault from './pages/VisionVault';
import Pricing from './pages/Pricing';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

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
    <Routes>
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/assessment" element={<Assessment />} />
      <Route path="/score" element={<ScorePage />} />
      <Route path="/daily-shift" element={<DailyShift />} />
      <Route path="/vision" element={<Vision />} />
      <Route path="/vision-vault" element={<VisionVault />} />
      <Route path="/vision/add" element={<Vision />} />
      <Route path="/progress" element={<Progress />} />
      <Route path="/future-self" element={<FutureSelf />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/" element={<DailyShift />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <UserProfileProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </UserProfileProvider>
    </AuthProvider>
  )
}

export default App