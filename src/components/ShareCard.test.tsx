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
    const { getAllByText, getByText } = render(
      <ShareCard
        url="https://legionroller.com/#r=3"
        live={{ config, results: computePoolResults(config), label: 'B' }}
      />
    );
    expect(getAllByText('Red').length).toBe(2);
    expect(getByText('Black')).toBeTruthy();
    expect(getByText('×3')).toBeTruthy();
    expect(getByText('×1')).toBeTruthy();
    expect(getByText('Aim 2')).toBeTruthy();
    expect(getByText('Avg successes')).toBeTruthy();
  });

  it('renders a mini distribution with a left y-axis, bars, and success totals', () => {
    const config = {
      ...DEFAULT_POOL_CONFIG,
      pool: { red: 3, black: 0, white: 0 },
    };
    const results = computePoolResults(config);
    const { container } = render(
      <ShareCard
        url="https://legionroller.com/#r=3"
        live={{ config, results, label: 'B' }}
      />
    );
    const distributionWrap = container.querySelector('.share-card__dist-wrap');
    const distribution = container.querySelector('.share-card__dist');
    expect(distributionWrap).toBeTruthy();
    expect(distribution).toBeTruthy();
    expect(
      distribution?.querySelectorAll('.share-card__dist-bar').length
    ).toBeGreaterThan(0);
    expect(container.querySelector('.share-card__dist-yaxis')).toBeTruthy();
    expect(container.querySelector('.share-card__dist-prob')).toBeFalsy();
    const peak = results.results.distribution.reduce((best, entry) =>
      entry.probability > best.probability ? entry : best
    );
    expect(distribution?.textContent).toContain(String(peak.total));
    expect(distributionWrap?.textContent).toContain('0%');
    expect(
      distribution?.querySelectorAll('.share-card__dist-total').length
    ).toBe(results.results.distribution.length);
  });

  it('shows the defense die color', () => {
    const config = {
      ...DEFAULT_POOL_CONFIG,
      pool: { red: 2, black: 0, white: 0 },
      defenseDieColor: 'white' as const,
    };
    const { getAllByText } = render(
      <ShareCard
        url="https://legionroller.com/#r=2"
        live={{ config, results: computePoolResults(config), label: 'B' }}
      />
    );
    expect(getAllByText('White').length).toBeGreaterThan(0);
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
    expect(deltas?.textContent).toContain('Δ Avg successes');
    expect(deltas?.textContent).toContain('Δ Avg wounds');
  });

  it('keeps compact compare side by side', () => {
    const configA = {
      ...DEFAULT_POOL_CONFIG,
      pool: { red: 3, black: 0, white: 0 },
    };
    const configB = {
      ...DEFAULT_POOL_CONFIG,
      pool: { red: 1, black: 0, white: 0 },
    };
    const pinned = {
      config: configA,
      results: computePoolResults(configA),
      label: 'A',
    };
    const live = {
      config: configB,
      results: computePoolResults(configB),
      label: 'B',
    };
    const { container } = render(
      <ShareCard
        url="https://legionroller.com/#r=3"
        live={live}
        pinned={pinned}
      />
    );
    expect(container.querySelector('.share-card--compare-stacked')).toBeFalsy();
    expect(
      container.querySelector('.share-card__columns--stacked')
    ).toBeFalsy();
  });

  it('stacks compare pools when distributions are wide', () => {
    const largePool = { red: 8, black: 6, white: 0 };
    const configA = { ...DEFAULT_POOL_CONFIG, pool: largePool };
    const configB = {
      ...DEFAULT_POOL_CONFIG,
      pool: { red: 8, black: 3, white: 0 },
    };
    const pinned = {
      config: configA,
      results: computePoolResults(configA),
      label: 'A',
    };
    const live = {
      config: configB,
      results: computePoolResults(configB),
      label: 'B',
    };
    const { container } = render(
      <ShareCard
        url="https://legionroller.com/#r=8"
        live={live}
        pinned={pinned}
      />
    );
    expect(
      container.querySelector('.share-card--compare-stacked')
    ).toBeTruthy();
    expect(
      container.querySelector('.share-card__columns--stacked')
    ).toBeTruthy();
  });

  it('uses one attack chip per color in compare mode for large pools', () => {
    const largePool = { red: 8, black: 8, white: 0 };
    const configA = {
      ...DEFAULT_POOL_CONFIG,
      pool: largePool,
    };
    const configB = {
      ...DEFAULT_POOL_CONFIG,
      pool: largePool,
    };
    const { getAllByText, container } = render(
      <ShareCard
        url="https://legionroller.com/#r=8&b=8"
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
    expect(getAllByText('×8').length).toBe(4);
    expect(container.querySelectorAll('.share-card__die').length).toBe(6);
    expect(
      container.querySelector('.share-card--compare-stacked')
    ).toBeTruthy();
  });
});
