import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ComparisonResults } from './ComparisonResults';
import { computePoolResults, DEFAULT_POOL_CONFIG } from '../poolResults';

describe('ComparisonResults', () => {
  it('renders the delta table with both labels and an Avg total row', () => {
    const a = computePoolResults({
      ...DEFAULT_POOL_CONFIG,
      pool: { red: 3, black: 0, white: 0 },
    });
    const b = computePoolResults({
      ...DEFAULT_POOL_CONFIG,
      pool: { red: 1, black: 0, white: 0 },
    });
    const { getAllByText, getByText } = render(
      <ComparisonResults
        resultsA={a}
        resultsB={b}
        costA=""
        costB=""
        labelA="DLT"
        labelB="Stock"
      />
    );
    expect(getAllByText('DLT').length).toBeGreaterThan(0);
    expect(getAllByText('Stock').length).toBeGreaterThan(0);
    expect(getByText('Avg total')).toBeTruthy();
  });
});
