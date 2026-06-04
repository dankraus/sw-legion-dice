import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CumulativeCurve, transformCumulativeData } from './CumulativeCurve';

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

describe('CumulativeCurve data transformation', () => {
  it('carries forward cumulative probabilities for missing values', () => {
    const primary = [
      { total: 0, probability: 1.0 },
      { total: 1, probability: 0.85 },
      { total: 3, probability: 0.50 },
    ];
    const secondary = [
      { total: 0, probability: 1.0 },
      { total: 2, probability: 0.60 },
    ];

    // This test verifies the internal transformation logic by checking
    // that the chart receives correct data. We'll add a test helper to expose this.
    const transformed = transformCumulativeData(primary, secondary);

    expect(transformed).toEqual([
      { total: 0, primary: 100, secondary: 100 },
      { total: 1, primary: 85, secondary: 100 }, // secondary carries forward
      { total: 2, primary: 85, secondary: 60 }, // primary carries forward
      { total: 3, primary: 50, secondary: 60 }, // secondary carries forward
    ]);
  });

  it('handles unsorted input arrays safely', () => {
    const primary = [
      { total: 3, probability: 0.50 }, // out of order
      { total: 0, probability: 1.0 },
      { total: 1, probability: 0.85 },
    ];
    const secondary = [
      { total: 2, probability: 0.60 }, // out of order
      { total: 0, probability: 1.0 },
    ];

    const transformed = transformCumulativeData(primary, secondary);

    expect(transformed).toEqual([
      { total: 0, primary: 100, secondary: 100 },
      { total: 1, primary: 85, secondary: 100 },
      { total: 2, primary: 85, secondary: 60 },
      { total: 3, primary: 50, secondary: 60 },
    ]);
  });
});
