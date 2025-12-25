import { useState } from 'react';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Mountain, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts';
import { Button, Input } from '../ui';

interface AuthGateProps {
  onAuthComplete: (isNewUser: boolean) => void;
}

export function AuthGate({ onAuthComplete }: AuthGateProps) {
  const { signIn, signUp, isConfigured } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);

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
      } else {
        const result = await signUp(email, password);
        if (result.error) {
          setError(result.error.message);
        } else {
          // Show verification message and then proceed
          setShowVerificationMessage(true);
          setTimeout(() => {
            onAuthComplete(true);
          }, 2000);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError(null);
  };

  if (!isConfigured) {
    // If Supabase isn't configured, skip auth entirely
    return null;
  }

  if (showVerificationMessage) {
    return (
      <div className="fixed inset-0 bg-gray-50 dark:bg-[#121212] flex items-center justify-center p-6 z-50">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <Mail className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Check your email
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            We sent a verification link to {email}. Click it to verify your account.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
            Continuing to app...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-50 dark:bg-[#121212] flex flex-col z-50 safe-area-top safe-area-bottom">
      {/* Header with branding */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="w-20 h-20 mb-4 rounded-2xl bg-gradient-to-br from-indigo-950 to-cyan-500 flex items-center justify-center shadow-lg">
            <Mountain className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Ascend
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Progressive calisthenics training
          </p>
        </div>

        {/* Auth form */}
        <div className="w-full max-w-sm">
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
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 dark:border-[#2D2D4A] bg-white dark:bg-[#1A1A2E] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-colors"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'Create password (6+ characters)' : 'Password'}
                required
                minLength={mode === 'signup' ? 6 : undefined}
                className="w-full pl-11 pr-12 py-3 rounded-xl border border-gray-300 dark:border-[#2D2D4A] bg-white dark:bg-[#1A1A2E] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !email || !password}
              className="w-full py-3 text-base font-medium"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </form>

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
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 text-center">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Part of the BetterDays suite
        </p>
      </div>
    </div>
  );
}
