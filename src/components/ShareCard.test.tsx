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
});
