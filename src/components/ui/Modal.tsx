import { type ReactNode, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
  /** Accessible label for modals without visible title */
  ariaLabel?: string;
}

// Get all focusable elements within a container
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const elements = container.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  return Array.from(elements).filter(el => !el.hasAttribute('disabled'));
}

export function Modal({ isOpen, onClose, title, children, size = 'md', ariaLabel }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const titleId = useRef(`modal-title-${Math.random().toString(36).slice(2, 9)}`);

  // Handle escape key and focus trapping
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Focus trapping
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = getFocusableElements(modalRef.current);
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // Shift + Tab: if on first element, wrap to last
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab: if on last element, wrap to first
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    },
    [onClose]
  );

  // Focus management and body scroll lock
  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element to restore later
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Add event listener
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';

      // Focus the modal or first focusable element
      requestAnimationFrame(() => {
        if (modalRef.current) {
          const focusableElements = getFocusableElements(modalRef.current);
          if (focusableElements.length > 0) {
            focusableElements[0].focus();
          } else {
            modalRef.current.focus();
          }
        }
      });
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';

      // Restore focus to the previously focused element
      if (
        previousActiveElement.current &&
        typeof previousActiveElement.current.focus === 'function'
      ) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    full: 'max-w-full mx-2',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId.current : undefined}
        aria-label={!title ? ariaLabel : undefined}
        tabIndex={-1}
        className={`
          relative w-full ${sizes[size]}
          bg-white dark:bg-dark-surface 
          rounded-xl shadow-xl
          max-h-[90vh] overflow-hidden
          flex flex-col
          outline-none
        `}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-dark-border">
            <h2
              id={titleId.current}
              className="text-lg font-semibold text-gray-900 dark:text-gray-100"
            >
              {title}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-1"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        )}

        {/* Content - reduced padding for full-size modals */}
        <div className={`flex-1 overflow-y-auto ${size === 'full' ? 'p-2' : 'p-4'}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
