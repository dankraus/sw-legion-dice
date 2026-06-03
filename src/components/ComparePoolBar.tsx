import type { KeyboardEvent } from 'react';
import './ComparePoolBar.css';

const COLOR_A = '#2563eb';
const COLOR_B = '#f59e0b';

export type ComparePoolBarProps =
  | {
      mode: 'single';
      onStartCompare: () => void;
      startDisabled: boolean;
    }
  | {
      mode: 'compare';
      labelA: string;
      labelB: string;
      activePool: 'A' | 'B';
      onActivePoolChange: (pool: 'A' | 'B') => void;
      onEndCompare: () => void;
    };

function tabLabel(label: string, fallback: string): string {
  const trimmed = label.trim();
  return trimmed === '' ? fallback : trimmed;
}

export function ComparePoolBar(props: ComparePoolBarProps) {
  if (props.mode === 'single') {
    return (
      <div className="compare-bar compare-bar--single">
        <h2 className="compare-bar__heading">Compare pools</h2>
        <button
          type="button"
          className="compare-bar__start"
          onClick={props.onStartCompare}
          disabled={props.startDisabled}
          aria-label="Compare pools"
        >
          Compare Pools
        </button>
      </div>
    );
  }

  const {
    labelA,
    labelB,
    activePool,
    onActivePoolChange,
    onEndCompare,
  } = props;

  const displayA = tabLabel(labelA, 'A');
  const displayB = tabLabel(labelB, 'B');
  const activeLabel = activePool === 'A' ? displayA : displayB;
  const activeColor = activePool === 'A' ? COLOR_A : COLOR_B;

  function handleTabListKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowLeft' && activePool === 'B') {
      event.preventDefault();
      onActivePoolChange('A');
    } else if (event.key === 'ArrowRight' && activePool === 'A') {
      event.preventDefault();
      onActivePoolChange('B');
    }
  }

  return (
    <div className="compare-bar compare-bar--active">
      <div className="compare-bar__row">
        <div
          className="compare-bar__tabs"
          role="tablist"
          aria-label="Compare pools"
          onKeyDown={handleTabListKeyDown}
        >
          <button
            type="button"
            role="tab"
            aria-selected={activePool === 'A'}
            className={
              'compare-bar__tab' +
              (activePool === 'A' ? ' compare-bar__tab--active' : '')
            }
            style={
              activePool === 'A'
                ? { backgroundColor: COLOR_A, borderColor: COLOR_A }
                : { color: COLOR_A, borderColor: COLOR_A }
            }
            title={displayA}
            onClick={() => onActivePoolChange('A')}
          >
            {displayA}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activePool === 'B'}
            className={
              'compare-bar__tab' +
              (activePool === 'B' ? ' compare-bar__tab--active' : '')
            }
            style={
              activePool === 'B'
                ? { backgroundColor: COLOR_B, borderColor: COLOR_B }
                : { color: COLOR_B, borderColor: COLOR_B }
            }
            title={displayB}
            onClick={() => onActivePoolChange('B')}
          >
            {displayB}
          </button>
        </div>
        <button
          type="button"
          className="compare-bar__end"
          onClick={onEndCompare}
          aria-label="Clear comparison"
        >
          Clear
        </button>
      </div>
      <p className="compare-bar__editing" style={{ color: activeColor }}>
        <span className="compare-bar__editing-marker" style={{ color: activeColor }}>
          ■
        </span>{' '}
        Editing: {activeLabel}
      </p>
    </div>
  );
}
