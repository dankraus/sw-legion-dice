import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import App from './App';

describe('App compare UI', () => {
  it('shows compare bar in pool column not header pin button', () => {
    const { queryByRole, getByRole } = render(<App />);
    expect(queryByRole('button', { name: /pin as a/i })).toBeNull();
    expect(getByRole('button', { name: /compare pools/i })).toBeTruthy();
  });
});
