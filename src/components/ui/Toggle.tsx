/**
 * Accessible toggle switch.
 *
 * Replaces the hand-rolled switch buttons that previously lived inline on the
 * Today page, Timer settings, and Exercise form. Size variants match those
 * original visuals exactly so adoption causes no visual shift.
 */

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** sm = h-5 w-9 (compact rows), md = h-6 w-11 (settings/forms). Default md. */
  size?: 'sm' | 'md';
  disabled?: boolean;
  /** Required when no visible label is associated with the toggle */
  'aria-label'?: string;
  id?: string;
}

const SIZE_STYLES = {
  sm: {
    track: 'h-5 w-9',
    trackOn: 'bg-primary-500',
    trackOff: 'bg-gray-300 dark:bg-gray-600',
    knob: 'h-3.5 w-3.5',
    knobOn: 'translate-x-[18px]',
    knobOff: 'translate-x-[3px]',
  },
  md: {
    track: 'h-6 w-11',
    trackOn: 'bg-primary-600',
    trackOff: 'bg-gray-200 dark:bg-gray-700',
    knob: 'h-4 w-4',
    knobOn: 'translate-x-6',
    knobOff: 'translate-x-1',
  },
} as const;

export function Toggle({
  checked,
  onChange,
  size = 'md',
  disabled = false,
  'aria-label': ariaLabel,
  id,
}: ToggleProps) {
  const s = SIZE_STYLES[size];

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      id={id}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex flex-shrink-0 items-center rounded-full transition-colors
        after:absolute after:-inset-3 after:content-['']
        ${s.track}
        ${checked ? s.trackOn : s.trackOff}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <span
        className={`
          inline-block transform rounded-full bg-white shadow-sm transition-transform
          ${s.knob}
          ${checked ? s.knobOn : s.knobOff}
        `}
      />
    </button>
  );
}
