/**
 * AuthModal Component
 *
 * Sign in / Sign up modal for Settings page.
 */

import { useState } from 'react';
import { Mail, CheckCircle, RefreshCw } from 'lucide-react';
import { Modal, Button, Input } from '@/components/ui';

interface AuthModalProps {
  isOpen: boolean;
  mode: 'signin' | 'signup' | 'verify';
  email: string;
  password: string;
  error: string | null;
  isSubmitting: boolean;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onModeChange: (mode: 'signin' | 'signup' | 'verify') => void;
  onSubmit: () => void;
  onResendVerification: () => Promise<void>;
  onClose: () => void;
}

export function AuthModal({
  isOpen,
  mode,
  email,
  password,
  error,
  isSubmitting,
  onEmailChange,
  onPasswordChange,
  onModeChange,
  onSubmit,
  onResendVerification,
  onClose,
}: AuthModalProps) {
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleResend = async () => {
    setIsResending(true);
    setResendSuccess(false);
    try {
      await onResendVerification();
      setResendSuccess(true);
    } finally {
      setIsResending(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'signin':
        return 'Sign In';
      case 'signup':
        return 'Create Account';
      case 'verify':
        return 'Verify Your Email';
    }
  };

  // Reset resend success when modal closes or mode changes
  const handleClose = () => {
    setResendSuccess(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={getTitle()}>
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {mode === 'verify' ? (
          // Verification pending screen
          <>
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                We sent a verification email to:
              </p>
              <p className="font-medium text-gray-900 dark:text-gray-100 mb-4">{email}</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Click the link in the email to verify your account.
              </p>
            </div>

            {resendSuccess && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                <p className="text-sm text-green-700 dark:text-green-400">
                  Verification email sent!
                </p>
              </div>
            )}

            <Button
              className="w-full"
              variant="secondary"
              onClick={handleResend}
              disabled={isResending}
            >
              {isResending ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Mail className="w-4 h-4 mr-2" />
              )}
              {isResending ? 'Sending...' : 'Resend Verification Email'}
            </Button>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              <button
                className="text-primary-600 dark:text-primary-400 hover:underline"
                onClick={() => {
                  setResendSuccess(false);
                  onModeChange('signin');
                }}
              >
                Back to Sign In
              </button>
            </p>
          </>
        ) : (
          // Sign in / Sign up form
          <>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={e => onEmailChange(e.target.value)}
              placeholder="you@example.com"
              autoFocus
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={e => onPasswordChange(e.target.value)}
              placeholder={mode === 'signup' ? 'At least 6 characters' : ''}
            />

            <Button
              className="w-full"
              onClick={onSubmit}
              disabled={isSubmitting || !email || !password}
            >
              <Mail className="w-4 h-4 mr-2" />
              {isSubmitting
                ? mode === 'signin'
                  ? 'Signing in...'
                  : 'Creating account...'
                : mode === 'signin'
                  ? 'Sign In'
                  : 'Create Account'}
            </Button>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              {mode === 'signin' ? (
                <>
                  Don't have an account?{' '}
                  <button
                    className="text-primary-600 dark:text-primary-400 hover:underline"
                    onClick={() => onModeChange('signup')}
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    className="text-primary-600 dark:text-primary-400 hover:underline"
                    onClick={() => onModeChange('signin')}
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </>
        )}
      </div>
    </Modal>
  );
}
