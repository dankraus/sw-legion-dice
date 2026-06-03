import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ComparePoolBar } from './ComparePoolBar';

describe('ComparePoolBar', () => {
  it('renders start compare button in single mode', () => {
    const onStart = vi.fn();
    const { getByRole } = render(
      <ComparePoolBar mode="single" onStartCompare={onStart} startDisabled={false} />
    );
    fireEvent.click(getByRole('button', { name: /compare pools/i }));
    expect(onStart).toHaveBeenCalled();
  });

  it('renders label tabs and end compare in compare mode', () => {
    const onChange = vi.fn();
    const onEnd = vi.fn();
    const { getByRole, getByText } = render(
      <ComparePoolBar
        mode="compare"
        labelA="Heavy"
        labelB="Upgrade"
        activePool="B"
        onActivePoolChange={onChange}
        onEndCompare={onEnd}
      />
    );
    fireEvent.click(getByRole('tab', { name: 'Heavy' }));
    expect(onChange).toHaveBeenCalledWith('A');
    fireEvent.click(getByRole('button', { name: /clear/i }));
    expect(onEnd).toHaveBeenCalled();
    expect(getByText(/Editing: Upgrade/)).toBeTruthy();
  });

  it('moves focus between tabs with arrow keys', () => {
    const onChange = vi.fn();
    const { getByRole } = render(
      <ComparePoolBar
        mode="compare"
        labelA="Heavy"
        labelB="Upgrade"
        activePool="B"
        onActivePoolChange={onChange}
        onEndCompare={() => {}}
      />
    );
    const tabB = getByRole('tab', { name: 'Upgrade' });
    tabB.focus();
    fireEvent.keyDown(tabB, { key: 'ArrowLeft' });
    expect(onChange).toHaveBeenCalledWith('A');
  });
});
