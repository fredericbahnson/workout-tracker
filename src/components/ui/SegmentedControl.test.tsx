/**
 * SegmentedControl Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SegmentedControl } from './SegmentedControl';

const OPTIONS = [
  { value: 'week', label: 'Week' },
  { value: 'cycle', label: 'Cycle' },
  { value: 'all', label: 'All Time' },
] as const;

describe('SegmentedControl', () => {
  it('renders a radiogroup with one radio per option', () => {
    render(
      <SegmentedControl
        options={[...OPTIONS]}
        value="week"
        onChange={() => {}}
        aria-label="Timeframe"
      />
    );

    expect(screen.getByRole('radiogroup', { name: 'Timeframe' })).toBeTruthy();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });

  it('marks only the selected option as checked', () => {
    render(
      <SegmentedControl
        options={[...OPTIONS]}
        value="cycle"
        onChange={() => {}}
        aria-label="Timeframe"
      />
    );

    expect(screen.getByRole('radio', { name: 'Cycle' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('radio', { name: 'Week' }).getAttribute('aria-checked')).toBe('false');
    expect(screen.getByRole('radio', { name: 'All Time' }).getAttribute('aria-checked')).toBe(
      'false'
    );
  });

  it('calls onChange with the tapped value', () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl
        options={[...OPTIONS]}
        value="week"
        onChange={onChange}
        aria-label="Timeframe"
      />
    );

    fireEvent.click(screen.getByRole('radio', { name: 'All Time' }));
    expect(onChange).toHaveBeenCalledWith('all');
  });
});
