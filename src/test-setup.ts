import '@testing-library/jest-dom';

// jsdom has no layout engine, so recharts' ResponsiveContainer measures 0x0 and
// renders nothing. Provide a ResizeObserver and non-zero element dimensions so
// charts (and their legends) render during tests.
const CHART_WIDTH = 400;
const CHART_HEIGHT = 300;

class ResizeObserverMock {
  private readonly callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(target: Element): void {
    this.callback(
      [
        {
          target,
          contentRect: {
            width: CHART_WIDTH,
            height: CHART_HEIGHT,
            top: 0,
            left: 0,
            right: CHART_WIDTH,
            bottom: CHART_HEIGHT,
            x: 0,
            y: 0,
            toJSON: () => ({}),
          },
        } as unknown as ResizeObserverEntry,
      ],
      this as unknown as ResizeObserver
    );
  }

  unobserve(): void {}

  disconnect(): void {}
}

// The engine test files opt into a node environment where DOM globals are
// absent, so only install the chart-rendering shims when a DOM is present.
if (typeof HTMLElement !== 'undefined') {
  globalThis.ResizeObserver =
    globalThis.ResizeObserver ??
    (ResizeObserverMock as unknown as typeof ResizeObserver);

  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    value: CHART_WIDTH,
  });

  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    value: CHART_HEIGHT,
  });
}
