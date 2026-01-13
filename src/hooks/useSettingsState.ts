/**
 * useSettingsState Hook
 *
 * Consolidates Settings page state management into a single reducer-based hook.
 * This reduces the number of useState calls and provides a cleaner API for state updates.
 */

import { useReducer, useCallback } from 'react';

// State Types
export interface SettingsState {
  // Modal visibility
  modals: {
    clearConfirm: boolean;
    auth: boolean;
    deleteAccount: boolean;
    changePassword: boolean;
  };

  // Auth form
  auth: {
    mode: 'signin' | 'signup';
    email: string;
    password: string;
    error: string | null;
    isSubmitting: boolean;
  };

  // Password change form
  passwordChange: {
    newPassword: string;
    confirmPassword: string;
    isChanging: boolean;
  };

  // Loading states for various operations
  loading: {
    exporting: boolean;
    importing: boolean;
    clearing: boolean;
    cleaningDuplicates: boolean;
    deleting: boolean;
  };

  // Status message
  message: { type: 'success' | 'error'; text: string } | null;
}

// Action Types
export type SettingsAction =
  // Modal actions
  | { type: 'OPEN_MODAL'; modal: keyof SettingsState['modals'] }
  | { type: 'CLOSE_MODAL'; modal: keyof SettingsState['modals'] }
  // Auth actions
  | { type: 'SET_AUTH_MODE'; mode: 'signin' | 'signup' }
  | { type: 'SET_AUTH_FIELD'; field: 'email' | 'password'; value: string }
  | { type: 'SET_AUTH_ERROR'; error: string | null }
  | { type: 'SET_AUTH_SUBMITTING'; isSubmitting: boolean }
  | { type: 'RESET_AUTH_FORM' }
  // Password change actions
  | { type: 'SET_PASSWORD_FIELD'; field: 'newPassword' | 'confirmPassword'; value: string }
  | { type: 'SET_CHANGING_PASSWORD'; isChanging: boolean }
  | { type: 'RESET_PASSWORD_FORM' }
  // Loading actions
  | { type: 'SET_LOADING'; operation: keyof SettingsState['loading']; isLoading: boolean }
  // Message actions
  | { type: 'SET_MESSAGE'; message: SettingsState['message'] }
  | { type: 'CLEAR_MESSAGE' };

// Initial State
const initialState: SettingsState = {
  modals: {
    clearConfirm: false,
    auth: false,
    deleteAccount: false,
    changePassword: false,
  },
  auth: {
    mode: 'signin',
    email: '',
    password: '',
    error: null,
    isSubmitting: false,
  },
  passwordChange: {
    newPassword: '',
    confirmPassword: '',
    isChanging: false,
  },
  loading: {
    exporting: false,
    importing: false,
    clearing: false,
    cleaningDuplicates: false,
    deleting: false,
  },
  message: null,
};

// Reducer
function settingsReducer(state: SettingsState, action: SettingsAction): SettingsState {
  switch (action.type) {
    // Modal actions
    case 'OPEN_MODAL':
      return {
        ...state,
        modals: { ...state.modals, [action.modal]: true },
      };
    case 'CLOSE_MODAL':
      return {
        ...state,
        modals: { ...state.modals, [action.modal]: false },
      };

    // Auth actions
    case 'SET_AUTH_MODE':
      return {
        ...state,
        auth: { ...state.auth, mode: action.mode },
      };
    case 'SET_AUTH_FIELD':
      return {
        ...state,
        auth: { ...state.auth, [action.field]: action.value },
      };
    case 'SET_AUTH_ERROR':
      return {
        ...state,
        auth: { ...state.auth, error: action.error },
      };
    case 'SET_AUTH_SUBMITTING':
      return {
        ...state,
        auth: { ...state.auth, isSubmitting: action.isSubmitting },
      };
    case 'RESET_AUTH_FORM':
      return {
        ...state,
        auth: { ...initialState.auth },
      };

    // Password change actions
    case 'SET_PASSWORD_FIELD':
      return {
        ...state,
        passwordChange: { ...state.passwordChange, [action.field]: action.value },
      };
    case 'SET_CHANGING_PASSWORD':
      return {
        ...state,
        passwordChange: { ...state.passwordChange, isChanging: action.isChanging },
      };
    case 'RESET_PASSWORD_FORM':
      return {
        ...state,
        passwordChange: { ...initialState.passwordChange },
      };

    // Loading actions
    case 'SET_LOADING':
      return {
        ...state,
        loading: { ...state.loading, [action.operation]: action.isLoading },
      };

    // Message actions
    case 'SET_MESSAGE':
      return {
        ...state,
        message: action.message,
      };
    case 'CLEAR_MESSAGE':
      return {
        ...state,
        message: null,
      };

    default:
      return state;
  }
}

/**
 * Hook for managing Settings page state.
 *
 * @example
 * const { state, actions } = useSettingsState();
 *
 * // Open a modal
 * actions.openModal('auth');
 *
 * // Set auth field
 * actions.setAuthField('email', 'user@example.com');
 *
 * // Show success message
 * actions.setMessage({ type: 'success', text: 'Saved!' });
 */
export function useSettingsState() {
  const [state, dispatch] = useReducer(settingsReducer, initialState);

  // Memoized action creators
  const actions = {
    // Modal actions
    openModal: useCallback((modal: keyof SettingsState['modals']) => {
      dispatch({ type: 'OPEN_MODAL', modal });
    }, []),

    closeModal: useCallback((modal: keyof SettingsState['modals']) => {
      dispatch({ type: 'CLOSE_MODAL', modal });
    }, []),

    // Auth actions
    setAuthMode: useCallback((mode: 'signin' | 'signup') => {
      dispatch({ type: 'SET_AUTH_MODE', mode });
    }, []),

    setAuthField: useCallback((field: 'email' | 'password', value: string) => {
      dispatch({ type: 'SET_AUTH_FIELD', field, value });
    }, []),

    setAuthError: useCallback((error: string | null) => {
      dispatch({ type: 'SET_AUTH_ERROR', error });
    }, []),

    setAuthSubmitting: useCallback((isSubmitting: boolean) => {
      dispatch({ type: 'SET_AUTH_SUBMITTING', isSubmitting });
    }, []),

    resetAuthForm: useCallback(() => {
      dispatch({ type: 'RESET_AUTH_FORM' });
    }, []),

    // Password change actions
    setPasswordField: useCallback((field: 'newPassword' | 'confirmPassword', value: string) => {
      dispatch({ type: 'SET_PASSWORD_FIELD', field, value });
    }, []),

    setChangingPassword: useCallback((isChanging: boolean) => {
      dispatch({ type: 'SET_CHANGING_PASSWORD', isChanging });
    }, []),

    resetPasswordForm: useCallback(() => {
      dispatch({ type: 'RESET_PASSWORD_FORM' });
    }, []),

    // Loading actions
    setLoading: useCallback((operation: keyof SettingsState['loading'], isLoading: boolean) => {
      dispatch({ type: 'SET_LOADING', operation, isLoading });
    }, []),

    // Message actions
    setMessage: useCallback((message: SettingsState['message']) => {
      dispatch({ type: 'SET_MESSAGE', message });
    }, []),

    clearMessage: useCallback(() => {
      dispatch({ type: 'CLEAR_MESSAGE' });
    }, []),
  };

  return { state, actions };
}
