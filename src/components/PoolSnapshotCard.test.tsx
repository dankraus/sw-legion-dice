import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
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

  it('shows Editing pill when active', () => {
    const { getByText } = render(
      <PoolSnapshotCard
        config={DEFAULT_POOL_CONFIG}
        poolId="B"
        label="Stock"
        onLabelChange={() => {}}
        accentColor="#f59e0b"
        isActive
      />
    );
    expect(getByText('Editing')).toBeTruthy();
  });

  it('calls onSelect when card clicked outside label input', () => {
    const onSelect = vi.fn();
    const { container } = render(
      <PoolSnapshotCard
        config={DEFAULT_POOL_CONFIG}
        poolId="A"
        label="Heavy"
        onLabelChange={() => {}}
        accentColor="#2563eb"
        onSelect={onSelect}
      />
    );
    fireEvent.click(container.querySelector('.pool-snapshot')!);
    expect(onSelect).toHaveBeenCalled();
  });
});
