import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { HealthDisclaimer } from './HealthDisclaimer';

describe('HealthDisclaimer', () => {
  it('renders the disclaimer content', () => {
    render(<HealthDisclaimer onAcknowledge={() => {}} />);

    expect(screen.getByText('Your Health Comes First')).toBeTruthy();
    expect(screen.getByText(/Consult your doctor/)).toBeTruthy();
    expect(screen.getByText(/Listen to your body/)).toBeTruthy();
    expect(screen.getByText(/You are responsible/)).toBeTruthy();
  });

  it('calls onAcknowledge when button is clicked', () => {
    const mockAcknowledge = vi.fn();
    render(<HealthDisclaimer onAcknowledge={mockAcknowledge} />);

    fireEvent.click(screen.getByText('I Understand & Agree'));

    expect(mockAcknowledge).toHaveBeenCalledTimes(1);
  });

  it('shows loading state when isLoading is true', () => {
    render(<HealthDisclaimer onAcknowledge={() => {}} isLoading={true} />);

    // OnboardingSlide shows "Loading..." when isLoading prop is true
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('does not show skip button', () => {
    render(<HealthDisclaimer onAcknowledge={() => {}} />);

    expect(screen.queryByText('Skip')).toBeNull();
  });

  it('renders Terms of Service link', () => {
    render(<HealthDisclaimer onAcknowledge={() => {}} />);

    const link = screen.getByRole('link', { name: /Terms of Service/i });
    expect(link.getAttribute('href')).toBe('https://fredericbahnson.com/ascend/terms');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });
});
