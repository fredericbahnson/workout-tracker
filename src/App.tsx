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
import { AuthGate, OnboardingFlow, HealthDisclaimer } from './components/onboarding';
import { useSyncedPreferences } from './contexts';
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
 * Wrapped in ErrorBoundary to handle payment flow errors gracefully.
 */
function PaywallContainer() {
  const { paywall, closePaywall } = useEntitlement();

  return (
    <ErrorBoundary level="component" fallback={<PaywallErrorFallback onClose={closePaywall} />}>
      <PaywallModal
        isOpen={paywall.isOpen}
        onClose={closePaywall}
        requiredTier={paywall.requiredTier}
        reason={paywall.reason}
      />
    </ErrorBoundary>
  );
}

/**
 * Fallback UI when paywall encounters an error.
 */
function PaywallErrorFallback({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 m-4 max-w-sm text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Something went wrong
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          We couldn't load the purchase options. Please try again later.
        </p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, isConfigured, isNewUser, clearNewUserFlag } = useAuth();
  const {
    hasCompletedOnboarding,
    setHasCompletedOnboarding,
    hasStartedOnboarding,
    setHasStartedOnboarding,
  } = useAppStore();
  const {
    hasAcknowledgedHealthDisclaimer,
    acknowledgeHealthDisclaimer,
    isLoading: preferencesLoading,
  } = useSyncedPreferences();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isAcknowledgingHealth, setIsAcknowledgingHealth] = useState(false);

  // Trigger onboarding for new users (detected via AuthContext)
  useEffect(() => {
    // New user signing up for the first time
    if (isNewUser && !hasCompletedOnboarding && user) {
      setHasStartedOnboarding(true);
      setShowOnboarding(true);
      return;
    }
    // Resuming incomplete onboarding (app was closed mid-flow)
    if (hasStartedOnboarding && !hasCompletedOnboarding && user) {
      setShowOnboarding(true);
    }
  }, [isNewUser, hasCompletedOnboarding, hasStartedOnboarding, user, setHasStartedOnboarding]);

  // Handler for when auth gate reports a new user (signup flow)
  const handleAuthComplete = (isNewUserFromGate: boolean) => {
    if (isNewUserFromGate && !hasCompletedOnboarding) {
      setShowOnboarding(true);
    } else {
      // Established user - navigate to Today view
      navigate('/');
    }
  };

  // Handler for when onboarding is complete
  const handleOnboardingComplete = () => {
    setHasCompletedOnboarding(true);
    setHasStartedOnboarding(false);
    setShowOnboarding(false);
    clearNewUserFlag();
    navigate('/exercises');
  };

  // Handler for skipping onboarding
  const handleOnboardingSkip = () => {
    setHasCompletedOnboarding(true);
    setHasStartedOnboarding(false);
    setShowOnboarding(false);
    clearNewUserFlag();
    navigate('/exercises');
  };

  // Handler for standalone health disclaimer (existing users)
  const handleStandaloneHealthAcknowledge = async () => {
    setIsAcknowledgingHealth(true);
    try {
      await acknowledgeHealthDisclaimer();
    } catch (error) {
      console.error('Failed to save health acknowledgment:', error);
      // Still allow progress - the acknowledgment will be retried on next sync
    } finally {
      setIsAcknowledgingHealth(false);
    }
  };

  // Show loading state while checking auth AND preferences
  if (authLoading || preferencesLoading) {
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

  // CRITICAL: Health disclaimer gate for ALL users
  // This catches:
  // - Existing users who haven't seen the disclaimer
  // - Users who somehow skipped it
  // - Users on older app versions updating
  if (!hasAcknowledgedHealthDisclaimer) {
    return (
      <ErrorBoundary level="page">
        <HealthDisclaimer
          onAcknowledge={handleStandaloneHealthAcknowledge}
          isLoading={isAcknowledgingHealth}
        />
      </ErrorBoundary>
    );
  }

  // If new user needs onboarding (health already acknowledged above)
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
