/**
 * AuthModal Component
 * 
 * Sign in / Sign up modal for Settings page.
 */

import { Mail } from 'lucide-react';
import { Modal, Button, Input } from '@/components/ui';

interface AuthModalProps {
  isOpen: boolean;
  mode: 'signin' | 'signup';
  email: string;
  password: string;
  error: string | null;
  isSubmitting: boolean;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onModeChange: (mode: 'signin' | 'signup') => void;
  onSubmit: () => void;
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
  onClose
}: AuthModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'signin' ? 'Sign In' : 'Create Account'}
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="you@example.com"
          autoFocus
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          placeholder={mode === 'signup' ? 'At least 6 characters' : ''}
        />

        <Button
          className="w-full"
          onClick={onSubmit}
          disabled={isSubmitting || !email || !password}
        >
          <Mail className="w-4 h-4 mr-2" />
          {isSubmitting
            ? (mode === 'signin' ? 'Signing in...' : 'Creating account...')
            : (mode === 'signin' ? 'Sign In' : 'Create Account')
          }
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
      </div>
    </Modal>
  );
}
