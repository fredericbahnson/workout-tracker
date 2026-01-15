import { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { Layout } from './components/layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PageSkeleton } from './components/ui/Skeleton';
import { useAppStore, useThemeEffect } from './stores/appStore';
import {
  AuthProvider,
  SyncProvider,
  useAuth,
  SyncedPreferencesProvider,
  EntitlementProvider,
  useEntitlement,
} from './contexts';
import { AuthGate, OnboardingFlow } from './components/onboarding';
import { PaywallModal } from './components/paywall';

// Lazy-loaded page components
const TodayPage = lazy(() =>
  import('./pages/Today').then(module => ({ default: module.TodayPage }))
);
const SchedulePage = lazy(() =>
  import('./pages/Schedule').then(module => ({ default: module.SchedulePage }))
);
const ExercisesPage = lazy(() =>
  import('./pages/Exercises').then(module => ({ default: module.ExercisesPage }))
);
const ExerciseDetailPage = lazy(() =>
  import('./pages/ExerciseDetail').then(module => ({ default: module.ExerciseDetailPage }))
);
const ProgressPage = lazy(() =>
  import('./pages/Progress').then(module => ({ default: module.ProgressPage }))
);
const SettingsPage = lazy(() =>
  import('./pages/Settings').then(module => ({ default: module.SettingsPage }))
);

/**
 * Paywall container that renders the modal based on entitlement context state.
 */
function PaywallContainer() {
  const { paywall, closePaywall } = useEntitlement();

  return (
    <PaywallModal
      isOpen={paywall.isOpen}
      onClose={closePaywall}
      requiredTier={paywall.requiredTier}
      reason={paywall.reason}
    />
  );
}

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
        <OnboardingFlow onComplete={handleOnboardingComplete} onSkip={handleOnboardingSkip} />
      </ErrorBoundary>
    );
  }

  // Normal app
  return (
    <Layout>
      <ErrorBoundary level="page">
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            <Route path="/" element={<TodayPage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/exercises" element={<ExercisesPage />} />
            <Route path="/exercises/:id" element={<ExerciseDetailPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </Layout>
  );
}

function App() {
  // Apply theme (consolidated in useThemeEffect hook)
  useThemeEffect();

  const fontSize = useAppStore(state => state.fontSize);

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
          <SyncedPreferencesProvider>
            <EntitlementProvider>
              <BrowserRouter>
                <AppContent />
                <PaywallContainer />
              </BrowserRouter>
            </EntitlementProvider>
          </SyncedPreferencesProvider>
        </SyncProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
