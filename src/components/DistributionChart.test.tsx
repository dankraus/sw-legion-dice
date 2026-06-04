import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { DistributionChart } from './DistributionChart';

describe('DistributionChart', () => {
  it('renders a legend with both series labels when a secondary distribution is given', () => {
    const { container, getByText } = render(
      <DistributionChart
        distribution={[
          { total: 0, probability: 0.5 },
          { total: 1, probability: 0.5 },
        ]}
        secondaryDistribution={[
          { total: 1, probability: 0.4 },
          { total: 2, probability: 0.6 },
        ]}
        seriesLabel="A"
        secondaryLabel="B"
      />
    );
    expect(getByText('A')).toBeTruthy();
    expect(getByText('B')).toBeTruthy();
    expect(container).toBeTruthy();
  });

  it('lists pool A before pool B in the legend when labels sort otherwise alphabetically', () => {
    const { container } = render(
      <DistributionChart
        distribution={[{ total: 0, probability: 1 }]}
        secondaryDistribution={[{ total: 0, probability: 1 }]}
        seriesLabel="Zebra"
        secondaryLabel="Apple"
      />
    );
    const legendLabels = Array.from(
      container.querySelectorAll('.recharts-legend-item-text')
    ).map((element) => element.textContent);
    expect(legendLabels).toEqual(['Zebra', 'Apple']);
  });
});
