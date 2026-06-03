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
        >
          Compare against this setup
        </button>
      </div>
    );
  }

  const displayA = tabLabel(props.labelA, 'A');
  const displayB = tabLabel(props.labelB, 'B');
  const activeLabel = props.activePool === 'A' ? displayA : displayB;
  const activeColor = props.activePool === 'A' ? COLOR_A : COLOR_B;

  function handleTabListKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowLeft' && props.activePool === 'B') {
      event.preventDefault();
      props.onActivePoolChange('A');
    } else if (event.key === 'ArrowRight' && props.activePool === 'A') {
      event.preventDefault();
      props.onActivePoolChange('B');
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
            aria-selected={props.activePool === 'A'}
            className={
              'compare-bar__tab' +
              (props.activePool === 'A' ? ' compare-bar__tab--active' : '')
            }
            style={
              props.activePool === 'A'
                ? { backgroundColor: COLOR_A, borderColor: COLOR_A }
                : { color: COLOR_A, borderColor: COLOR_A }
            }
            title={displayA}
            onClick={() => props.onActivePoolChange('A')}
          >
            {displayA}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={props.activePool === 'B'}
            className={
              'compare-bar__tab' +
              (props.activePool === 'B' ? ' compare-bar__tab--active' : '')
            }
            style={
              props.activePool === 'B'
                ? { backgroundColor: COLOR_B, borderColor: COLOR_B }
                : { color: COLOR_B, borderColor: COLOR_B }
            }
            title={displayB}
            onClick={() => props.onActivePoolChange('B')}
          >
            {displayB}
          </button>
        </div>
        <button
          type="button"
          className="compare-bar__end"
          onClick={props.onEndCompare}
          aria-label="Exit compare mode"
        >
          End compare
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
