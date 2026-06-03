import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { CumulativeTable } from './CumulativeTable';

describe('CumulativeTable', () => {
  it('renders an A and B column when secondary is provided', () => {
    const { getByText } = render(
      <CumulativeTable
        cumulative={[{ total: 1, probability: 0.8 }]}
        secondary={[{ total: 1, probability: 0.5 }]}
        primaryLabel="A"
        secondaryLabel="B"
      />
    );
    expect(getByText('A')).toBeTruthy();
    expect(getByText('B')).toBeTruthy();
    expect(getByText('80.0%')).toBeTruthy();
    expect(getByText('50.0%')).toBeTruthy();
  });

  it('renders rows for totals only present in the secondary pool', () => {
    const { getByText } = render(
      <CumulativeTable
        cumulative={[{ total: 1, probability: 0.5 }]}
        secondary={[
          { total: 1, probability: 0.9 },
          { total: 2, probability: 0.4 },
        ]}
        primaryLabel="A"
        secondaryLabel="B"
      />
    );
    const totalCell = getByText('2');
    expect(totalCell).toBeTruthy();
    const row = totalCell.closest('tr')!;
    expect(row.textContent).toContain('40.0%');
    expect(row.textContent).toContain('0.0%');
  });
});
