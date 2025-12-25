import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout';
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
  const { user, isLoading: authLoading, isConfigured } = useAuth();
  const { hasCompletedOnboarding, setHasCompletedOnboarding } = useAppStore();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Handler for when auth is complete
  const handleAuthComplete = (isNewUser: boolean) => {
    if (isNewUser && !hasCompletedOnboarding) {
      setShowOnboarding(true);
    }
  };

  // Handler for when onboarding is complete
  const handleOnboardingComplete = () => {
    setHasCompletedOnboarding(true);
    setShowOnboarding(false);
  };

  // Handler for skipping onboarding
  const handleOnboardingSkip = () => {
    setHasCompletedOnboarding(true);
    setShowOnboarding(false);
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
    return <AuthGate onAuthComplete={handleAuthComplete} />;
  }

  // If new user needs onboarding
  if (showOnboarding) {
    return (
      <OnboardingFlow 
        onComplete={handleOnboardingComplete} 
        onSkip={handleOnboardingSkip}
      />
    );
  }

  // Normal app
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<TodayPage />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/exercises" element={<ExercisesPage />} />
        <Route path="/exercises/:id" element={<ExerciseDetailPage />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Layout>
  );
}

function App() {
  const theme = useAppStore(state => state.theme);

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

  return (
    <AuthProvider>
      <SyncProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </SyncProvider>
    </AuthProvider>
  );
}

export default App;
