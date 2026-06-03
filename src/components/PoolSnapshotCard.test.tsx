import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PoolSnapshotCard } from './PoolSnapshotCard';
import { DEFAULT_POOL_CONFIG } from '../poolResults';

describe('PoolSnapshotCard', () => {
  it('renders label, attack section, and dice summary with zeros', () => {
    const { getByText } = render(
      <PoolSnapshotCard
        config={{
          ...DEFAULT_POOL_CONFIG,
          pool: { red: 3, black: 0, white: 0 },
        }}
        label="Heavy"
        accentColor="#2563eb"
      />
    );
    expect(getByText('Heavy')).toBeTruthy();
    expect(getByText('Attack', { selector: '.pool-snapshot__section-title' })).toBeTruthy();
    expect(getByText('3 red · 0 black · 0 white')).toBeTruthy();
    const attackSection = document.querySelector('.pool-snapshot__section');
    expect(attackSection?.textContent).toContain('Red');
    expect(attackSection?.textContent).toContain('3');
  });
});
