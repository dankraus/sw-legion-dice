import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ShareCard } from './ShareCard';
import { computePoolResults, DEFAULT_POOL_CONFIG } from '../poolResults';

describe('ShareCard', () => {
  it('shows pool composition, an active modifier, and headline stats', () => {
    const config = {
      ...DEFAULT_POOL_CONFIG,
      pool: { red: 3, black: 1, white: 0 },
      aimTokens: '2',
    };
    const { getByText } = render(
      <ShareCard
        url="https://legionroller.com/#r=3"
        live={{ config, results: computePoolResults(config), label: 'B' }}
      />
    );
    expect(getByText(/3 red/)).toBeTruthy();
    expect(getByText('Aim 2')).toBeTruthy();
    expect(getByText('Avg total')).toBeTruthy();
  });

  it('renders a mini distribution with bars', () => {
    const config = {
      ...DEFAULT_POOL_CONFIG,
      pool: { red: 3, black: 0, white: 0 },
    };
    const { container } = render(
      <ShareCard
        url="https://legionroller.com/#r=3"
        live={{ config, results: computePoolResults(config), label: 'B' }}
      />
    );
    const distribution = container.querySelector('.share-card__dist');
    expect(distribution).toBeTruthy();
    expect(
      distribution?.querySelectorAll('.share-card__dist-bar').length
    ).toBeGreaterThan(0);
  });

  it('shows the defense die color', () => {
    const config = {
      ...DEFAULT_POOL_CONFIG,
      pool: { red: 2, black: 0, white: 0 },
      defenseDieColor: 'white' as const,
    };
    const { getByText } = render(
      <ShareCard
        url="https://legionroller.com/#r=2"
        live={{ config, results: computePoolResults(config), label: 'B' }}
      />
    );
    expect(getByText('White defense die')).toBeTruthy();
  });

  it('shows a delta summary in compare mode', () => {
    const configA = {
      ...DEFAULT_POOL_CONFIG,
      pool: { red: 3, black: 0, white: 0 },
    };
    const configB = {
      ...DEFAULT_POOL_CONFIG,
      pool: { red: 1, black: 0, white: 0 },
    };
    const { container } = render(
      <ShareCard
        url="https://legionroller.com/#r=3"
        live={{
          config: configB,
          results: computePoolResults(configB),
          label: 'B',
        }}
        pinned={{
          config: configA,
          results: computePoolResults(configA),
          label: 'A',
        }}
      />
    );
    const deltas = container.querySelector('.share-card__deltas');
    expect(deltas).toBeTruthy();
    expect(deltas?.textContent).toContain('Δ Avg total');
    expect(deltas?.textContent).toContain('Δ Avg wounds');
  });
});
