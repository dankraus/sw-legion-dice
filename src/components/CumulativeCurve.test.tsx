import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CumulativeCurve } from './CumulativeCurve';

describe('CumulativeCurve', () => {
  it('renders with primary data', () => {
    const data = [
      { total: 0, probability: 1.0 },
      { total: 1, probability: 0.85 },
      { total: 2, probability: 0.60 },
    ];

    render(<CumulativeCurve cumulative={data} />);

    expect(screen.getByText('Cumulative Probabilities')).toBeInTheDocument();
  });
});
