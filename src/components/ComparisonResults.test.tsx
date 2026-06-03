import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ComparisonResults } from './ComparisonResults';
import { computePoolResults, DEFAULT_POOL_CONFIG } from '../poolResults';

describe('ComparisonResults', () => {
  it('renders snapshot cards, labels, and delta table', () => {
    const configA = {
      ...DEFAULT_POOL_CONFIG,
      pool: { red: 3, black: 0, white: 0 },
    };
    const configB = {
      ...DEFAULT_POOL_CONFIG,
      pool: { red: 1, black: 0, white: 0 },
    };
    const resultsA = computePoolResults(configA);
    const resultsB = computePoolResults(configB);
    const { getAllByDisplayValue, getByText, getByLabelText, getAllByText } = render(
      <ComparisonResults
        configA={configA}
        configB={configB}
        resultsA={resultsA}
        resultsB={resultsB}
        costA=""
        costB=""
        labelA="DLT"
        labelB="Stock"
        onLabelAChange={() => {}}
        onLabelBChange={() => {}}
        activePool="B"
        onSelectPoolA={() => {}}
        onSelectPoolB={() => {}}
      />
    );
    expect(getByText('×3')).toBeTruthy();
    expect(getByText('×1')).toBeTruthy();
    expect(getAllByDisplayValue('DLT').length).toBeGreaterThan(0);
    expect(getAllByDisplayValue('Stock').length).toBeGreaterThan(0);
    expect(getByLabelText('Label for pool A')).toBeTruthy();
    expect(getByText('Avg total')).toBeTruthy();
    expect(getAllByText('Editing')).toHaveLength(1);
    expect(getByText('Editing').closest('.pool-snapshot')).toBeTruthy();
  });
});
