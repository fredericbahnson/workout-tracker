import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { Layout } from './components/layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { 
  TodayPage, 
  ExercisesPage, 
  ExerciseDetailPage, 
  ProgressPage, 
  SettingsPage,
  SchedulePage 
} from './pages';
import { useAppStore } from './stores/appStore';
import { AuthProvider, SyncProvider, useAuth } from './contexts';
import { AuthGate, OnboardingFlow } from './components/onboarding';

function AppContent() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, isConfigured, isNewUser, clearNewUserFlag } = useAuth();
  const { hasCompletedOnboarding, setHasCompletedOnboarding } = useAppStore();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Trigger onboarding for new users (detected via AuthContext)
  useEffect(() => {
    if (isNewUser && !hasCompletedOnboarding && user) {
      setShowOnboarding(true);
    }
  }, [isNewUser, hasCompletedOnboarding, user]);

  // Handler for when auth gate reports a new user (signup flow)
  const handleAuthComplete = (isNewUserFromGate: boolean) => {
    if (isNewUserFromGate && !hasCompletedOnboarding) {
      setShowOnboarding(true);
    }
  };

  // Handler for when onboarding is complete
  const handleOnboardingComplete = () => {
    setHasCompletedOnboarding(true);
    setShowOnboarding(false);
    clearNewUserFlag();
    navigate('/exercises');
  };

  // Handler for skipping onboarding
  const handleOnboardingSkip = () => {
    setHasCompletedOnboarding(true);
    setShowOnboarding(false);
    clearNewUserFlag();
    navigate('/exercises');
  };

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If Supabase is configured and no user, show auth gate
  if (isConfigured && !user) {
    return (
      <ErrorBoundary level="page">
        <AuthGate onAuthComplete={handleAuthComplete} />
      </ErrorBoundary>
    );
  }

  // If new user needs onboarding
  if (showOnboarding) {
    return (
      <ErrorBoundary level="page">
        <OnboardingFlow 
          onComplete={handleOnboardingComplete} 
          onSkip={handleOnboardingSkip}
        />
      </ErrorBoundary>
    );
  }

  // Normal app
  return (
    <Layout>
      <ErrorBoundary level="page">
        <Routes>
          <Route path="/" element={<TodayPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/exercises" element={<ExercisesPage />} />
          <Route path="/exercises/:id" element={<ExerciseDetailPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </ErrorBoundary>
    </Layout>
  );
}

function App() {
  const theme = useAppStore(state => state.theme);
  const fontSize = useAppStore(state => state.fontSize);

  // Apply theme on mount and when it changes
  useEffect(() => {
    const root = document.documentElement;
    
    const applyTheme = () => {
      if (theme === 'system') {
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('dark', systemDark);
      } else {
        root.classList.toggle('dark', theme === 'dark');
      }
    };

    applyTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme();
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Apply font size on mount and when it changes
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all font size classes
    root.classList.remove('font-small', 'font-default', 'font-large', 'font-xl');
    
    // Add current font size class
    root.classList.add(`font-${fontSize}`);
  }, [fontSize]);

  return (
    <ErrorBoundary level="app">
      <AuthProvider>
        <SyncProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </SyncProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
