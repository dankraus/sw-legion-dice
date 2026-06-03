import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PoolSnapshotCard } from './PoolSnapshotCard';
import { DEFAULT_POOL_CONFIG } from '../poolResults';

describe('PoolSnapshotCard', () => {
  it('renders compact attack dice and surge without a duplicate Attack section', () => {
    const { getByDisplayValue, getByText, queryByText, getByLabelText } = render(
      <PoolSnapshotCard
        config={{
          ...DEFAULT_POOL_CONFIG,
          pool: { red: 3, black: 0, white: 0 },
          surge: 'hit',
        }}
        poolId="A"
        label="Heavy"
        onLabelChange={() => {}}
        accentColor="#2563eb"
      />
    );
    expect(getByDisplayValue('Heavy')).toBeTruthy();
    expect(getByLabelText('Label for pool A')).toBeTruthy();
    expect(getByText('Attack', { selector: '.pool-snapshot__pool-label' })).toBeTruthy();
    expect(getByText('×3')).toBeTruthy();
    expect(getByText('Hit')).toBeTruthy();
    expect(queryByText('Red', { selector: 'dt' })).toBeNull();
  });
});
