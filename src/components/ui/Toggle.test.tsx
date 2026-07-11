/**
 * Toggle Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Toggle } from './Toggle';

describe('Toggle', () => {
  it('renders as a switch with correct checked state', () => {
    render(<Toggle checked={true} onChange={() => {}} aria-label="Test toggle" />);

    const toggle = screen.getByRole('switch', { name: 'Test toggle' });
    expect(toggle.getAttribute('aria-checked')).toBe('true');
  });

  it('reflects unchecked state', () => {
    render(<Toggle checked={false} onChange={() => {}} aria-label="Test toggle" />);

    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('false');
  });

  it('calls onChange with the flipped value on click', () => {
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange} aria-label="Test toggle" />);

    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('does not fire onChange when disabled', () => {
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange} disabled aria-label="Test toggle" />);

    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('applies size variant classes', () => {
    const { rerender } = render(
      <Toggle checked={false} onChange={() => {}} size="sm" aria-label="Test toggle" />
    );
    expect(screen.getByRole('switch').className).toContain('h-5 w-9');

    rerender(<Toggle checked={false} onChange={() => {}} size="md" aria-label="Test toggle" />);
    expect(screen.getByRole('switch').className).toContain('h-6 w-11');
  });
});
