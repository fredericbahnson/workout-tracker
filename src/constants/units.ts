/**
 * Weight Unit Configuration
 *
 * Centralized weight unit constants to enable future metric (kg) support.
 * All weight displays should use these constants and formatting functions.
 *
 * Future: Read unit preference from user settings and convert values accordingly.
 */

/**
 * Weight unit configuration object.
 * Future: This could be dynamically determined from user preferences.
 */
export const WEIGHT_UNIT = {
  /** Primary unit label (e.g., "lbs" or "kg") */
  label: 'lbs',
  /** Short form for compact displays */
  short: 'lbs',
  /** Conversion factor from base unit (lbs) - for future kg support */
  conversionFromLbs: 1,
} as const;

/**
 * Format a weight value with unit.
 * @param value Weight value
 * @returns Formatted string like "20 lbs"
 * @example formatWeight(20) // "20 lbs"
 */
export function formatWeight(value: number): string {
  return `${value} ${WEIGHT_UNIT.label}`;
}

/**
 * Format weight with "at" prefix for combined displays.
 * Used when showing weight alongside reps/time.
 * @param value Weight value
 * @returns Formatted string like "@ 20 lbs"
 * @example formatWeightAt(20) // "@ 20 lbs"
 */
export function formatWeightAt(value: number): string {
  return `@ ${value} ${WEIGHT_UNIT.label}`;
}

/**
 * Format a weight increment with plus sign.
 * Used for progression displays.
 * @param value Increment value
 * @returns Formatted string like "+5 lbs"
 * @example formatWeightIncrement(5) // "+5 lbs"
 */
export function formatWeightIncrement(value: number): string {
  return `+${value} ${WEIGHT_UNIT.label}`;
}

/**
 * Get the weight unit label for form inputs.
 * @returns Unit string like "lbs"
 */
export function getWeightUnitLabel(): string {
  return WEIGHT_UNIT.label;
}

/**
 * Format a label with weight unit in parentheses.
 * Used for input field labels.
 * @param labelText The base label text
 * @returns Formatted string like "Weight (lbs)"
 * @example formatWeightLabel('Weight') // "Weight (lbs)"
 * @example formatWeightLabel('Added Weight') // "Added Weight (lbs)"
 */
export function formatWeightLabel(labelText: string): string {
  return `${labelText} (${WEIGHT_UNIT.label})`;
}
