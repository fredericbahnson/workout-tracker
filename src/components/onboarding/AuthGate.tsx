import { useState } from 'react';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Loader2, RefreshCw, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts';
import { Button } from '@/components/ui';

interface AuthGateProps {
  onAuthComplete: (isNewUser: boolean) => void;
}

export function AuthGate({ onAuthComplete }: AuthGateProps) {
  const { signIn, signUp, resetPassword, isConfigured } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [showResetSent, setShowResetSent] = useState(false);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === 'signin') {
        const result = await signIn(email, password);
        if (result.error) {
          setError(result.error.message);
        } else {
          onAuthComplete(false);
        }
      } else if (mode === 'signup') {
        const result = await signUp(email, password);
        if (result.error) {
          setError(result.error.message);
        } else {
          // Show verification message - don't auto-proceed
          setShowVerificationMessage(true);
        }
      } else if (mode === 'forgot') {
        const result = await resetPassword(email);
        if (result.error) {
          setError(result.error.message);
        } else {
          setShowResetSent(true);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckVerification = async () => {
    setIsCheckingVerification(true);
    setError(null);

    try {
      // Try to sign in with the credentials
      const result = await signIn(email, password);
      if (result.error) {
        if (result.error.message.includes('Email not confirmed')) {
          setError(
            'Email not yet verified. Please check your inbox and click the verification link.'
          );
        } else {
          setError(result.error.message);
        }
      } else {
        // Successfully signed in after verification
        onAuthComplete(true);
      }
    } finally {
      setIsCheckingVerification(false);
    }
  };

  const handleBackToSignIn = () => {
    setShowVerificationMessage(false);
    setShowResetSent(false);
    setMode('signin');
    setError(null);
  };

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError(null);
  };

  if (!isConfigured) {
    // If Supabase isn't configured, skip auth entirely
    return null;
  }

  // Password reset sent confirmation
  if (showResetSent) {
    return (
      <div className="fixed inset-0 bg-gray-50 dark:bg-dark-bg flex items-center justify-center p-6 z-50">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <Mail className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Check your email
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-2">We sent a password reset link to:</p>
          <p className="text-primary-600 dark:text-primary-400 font-medium mb-6">{email}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Click the link in your email to reset your password.
          </p>

          <Button onClick={handleBackToSignIn} className="w-full py-3">
            Back to Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (showVerificationMessage) {
    return (
      <div className="fixed inset-0 bg-gray-50 dark:bg-dark-bg flex items-center justify-center p-6 z-50">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <Mail className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Verify your email
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-2">We sent a verification link to:</p>
          <p className="text-primary-600 dark:text-primary-400 font-medium mb-6">{email}</p>

          <div className="text-left bg-gray-100 dark:bg-gray-800/50 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              To complete signup:
            </p>
            <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-2 list-decimal list-inside">
              <li>Open the email from Ascend</li>
              <li>Tap the verification link</li>
              <li>Return to this app and tap the button below</li>
            </ol>
          </div>

          {error && (
            <div className="p-3 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleCheckVerification}
              disabled={isCheckingVerification}
              className="w-full py-3"
            >
              {isCheckingVerification ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <RefreshCw className="w-5 h-5 mr-2" />
                  I've Verified My Email
                </>
              )}
            </Button>

            <button
              onClick={handleBackToSignIn}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Back to sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-50 dark:bg-dark-bg flex flex-col z-50 safe-area-top safe-area-bottom">
      {/* Scrollable content area for keyboard visibility on mobile */}
      <div className="flex-1 overflow-y-auto">
        {/* Use pt for top spacing and pb-64 to allow scrolling above mobile keyboard */}
        <div className="flex flex-col items-center px-6 pt-12 pb-64">
          {/* Logo */}
          <div className="mb-8 flex flex-col items-center">
            <img
              src="/app-icon-80.png"
              alt="Ascend"
              className="w-20 h-20 mb-4 rounded-2xl shadow-lg"
            />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Ascend</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {mode === 'forgot' ? 'Reset your password' : 'Progressive calisthenics training'}
            </p>
          </div>

          {/* Auth form */}
          <div className="w-full max-w-sm">
            {mode === 'forgot' && (
              <button
                onClick={handleBackToSignIn}
                className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </button>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-colors"
                />
              </div>

              {mode !== 'forgot' && (
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={mode === 'signup' ? 'Create password (6+ characters)' : 'Password'}
                    required
                    minLength={mode === 'signup' ? 6 : undefined}
                    className="w-full pl-11 pr-12 py-3 rounded-xl border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting || !email || (mode !== 'forgot' && !password)}
                className="w-full py-3 text-base font-medium"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {mode === 'signin'
                      ? 'Sign In'
                      : mode === 'signup'
                        ? 'Create Account'
                        : 'Send Reset Link'}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </form>

            {mode === 'signin' && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => {
                    setMode('forgot');
                    setError(null);
                  }}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {mode !== 'forgot' && (
              <div className="mt-6 text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                  <button
                    onClick={toggleMode}
                    className="text-primary-600 dark:text-primary-400 font-medium hover:underline"
                  >
                    {mode === 'signin' ? 'Sign up' : 'Sign in'}
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 text-center">
        <p className="text-xs text-gray-400 dark:text-gray-500">Part of the BetterDays suite</p>
      </div>
    </div>
  );
}
