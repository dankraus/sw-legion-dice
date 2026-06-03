import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ShareModal } from './ShareModal';
import { computePoolResults, DEFAULT_POOL_CONFIG } from '../poolResults';

vi.mock('html-to-image', () => ({
  toBlob: vi.fn(async () => new Blob(['x'], { type: 'image/png' })),
  toPng: vi.fn(async () => 'data:image/png;base64,AAAA'),
}));

const config = { ...DEFAULT_POOL_CONFIG, pool: { red: 2, black: 0, white: 0 } };
const live = { config, results: computePoolResults(config), label: 'B' };

describe('ShareModal', () => {
  it('renders the action buttons and closes on backdrop click', () => {
    const onClose = vi.fn();
    const { getByText, getByRole } = render(
      <ShareModal
        url="https://legionroller.com/#r=2"
        live={live}
        onClose={onClose}
      />
    );
    expect(getByText('Copy link')).toBeTruthy();
    expect(getByText('Copy text')).toBeTruthy();
    expect(getByText('Download PNG')).toBeTruthy();
    fireEvent.click(getByRole('dialog').parentElement as HTMLElement);
    expect(onClose).toHaveBeenCalled();
  });

  it('disables image/text actions when the pool is empty', () => {
    const emptyConfig = { ...DEFAULT_POOL_CONFIG };
    const { getByText } = render(
      <ShareModal
        url="https://legionroller.com/"
        live={{
          config: emptyConfig,
          results: computePoolResults(emptyConfig),
          label: 'B',
        }}
        onClose={() => {}}
      />
    );
    expect((getByText('Copy text') as HTMLButtonElement).disabled).toBe(true);
    expect((getByText('Copy link') as HTMLButtonElement).disabled).toBe(false);
  });
});
