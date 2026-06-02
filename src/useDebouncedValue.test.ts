import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebouncedValue } from './useDebouncedValue';

describe('useDebouncedValue', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebouncedValue('a', 150));
    expect(result.current).toBe('a');
  });

  it('updates after the delay', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 150),
      { initialProps: { value: 0 } }
    );

    rerender({ value: 1 });
    expect(result.current).toBe(0);

    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(result.current).toBe(1);
  });

  it('resets the timer when the value changes again', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 150),
      { initialProps: { value: 0 } }
    );

    rerender({ value: 1 });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    rerender({ value: 2 });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe(0);

    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(result.current).toBe(2);
  });
});
