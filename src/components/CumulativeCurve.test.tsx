import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('renders line chart with primary data', () => {
    const data = [
      { total: 0, probability: 1.0 },
      { total: 1, probability: 0.85 },
    ];

    render(<CumulativeCurve cumulative={data} />);

    // Recharts renders an SVG with role="application"
    const chart = screen.getByRole('application');
    expect(chart).toBeInTheDocument();
  });

  it('renders line chart with primary and secondary data', () => {
    const primary = [{ total: 0, probability: 1.0 }];
    const secondary = [{ total: 0, probability: 0.9 }];

    render(
      <CumulativeCurve
        cumulative={primary}
        secondary={secondary}
        primaryLabel="Pool A"
        secondaryLabel="Pool B"
      />
    );

    // Labels appear in both chart legend and table (which is always in DOM but collapsed)
    expect(screen.getAllByText('Pool A').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pool B').length).toBeGreaterThan(0);
  });

  it('has toggle button that starts collapsed', () => {
    const data = [{ total: 0, probability: 1.0 }];

    render(<CumulativeCurve cumulative={data} />);

    const button = screen.getByRole('button', { name: /show exact values/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('expands table when toggle button clicked', async () => {
    const user = userEvent.setup();
    const data = [{ total: 0, probability: 1.0 }];

    render(<CumulativeCurve cumulative={data} />);

    const button = screen.getByRole('button', { name: /show exact values/i });
    await user.click(button);

    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(button).toHaveTextContent(/hide exact values/i);
  });

  it('shows table when expanded', async () => {
    const user = userEvent.setup();
    const data = [
      { total: 0, probability: 1.0 },
      { total: 1, probability: 0.75 },
    ];

    render(<CumulativeCurve cumulative={data} />);

    const button = screen.getByRole('button', { name: /show exact values/i });
    const tableRegion = document.getElementById(
      button.getAttribute('aria-controls')!
    )!;

    // Table region exists but is collapsed
    expect(tableRegion).toHaveClass('cumulative-curve__table-wrapper--collapsed');
    expect(tableRegion).toHaveAttribute('aria-hidden', 'true');

    // Click toggle button
    await user.click(button);

    // Table region now expanded
    expect(tableRegion).toHaveClass('cumulative-curve__table-wrapper--expanded');
    expect(tableRegion).toHaveAttribute('aria-hidden', 'false');

    // Table content visible (use getAllByText since "At Least" appears in both chart and table)
    expect(screen.getAllByText('At Least').length).toBeGreaterThan(0);
    expect(screen.getByText('75.0%')).toBeInTheDocument();
  });

  it('respects defaultExpanded prop', () => {
    const data = [{ total: 0, probability: 1.0 }];

    render(<CumulativeCurve cumulative={data} defaultExpanded={true} />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(button).toHaveTextContent(/hide exact values/i);
  });

  it('handles empty data gracefully', () => {
    render(<CumulativeCurve cumulative={[]} />);

    expect(screen.getByText('Cumulative Probabilities')).toBeInTheDocument();
    // Chart should still render (Recharts handles empty data)
  });

  it('handles single data point', () => {
    const data = [{ total: 5, probability: 0.42 }];

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
