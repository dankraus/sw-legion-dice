import { useState, useMemo } from 'react';
import type { AttackPool, SurgeConversion } from './types';
import { calculateAttackPool } from './engine/probability';
import { DiceSelector } from './components/DiceSelector';
import { SurgeToggle } from './components/SurgeToggle';
import { StatsSummary } from './components/StatsSummary';
import { DistributionChart } from './components/DistributionChart';
import { CumulativeTable } from './components/CumulativeTable';
import './App.css';

function App() {
  const [pool, setPool] = useState<AttackPool>({ red: 0, black: 0, white: 0 });
  const [surge, setSurge] = useState<SurgeConversion>('none');
  const [pointCost, setPointCost] = useState<string>('');

  const results = useMemo(() => calculateAttackPool(pool, surge), [pool, surge]);

  const totalDice = pool.red + pool.black + pool.white;
  const parsedCost = Number(pointCost);

  return (
    <div className="app">
      <header className="app__header">
        <h1>Legion Dice Calculator</h1>
      </header>

      <div className="app__layout">
        <section className="app__pool">
          <h2>Attack Pool</h2>
          <DiceSelector
            color="red"
            count={pool.red}
            onChange={(n) => setPool((p) => ({ ...p, red: n }))}
          />
          <DiceSelector
            color="black"
            count={pool.black}
            onChange={(n) => setPool((p) => ({ ...p, black: n }))}
          />
          <DiceSelector
            color="white"
            count={pool.white}
            onChange={(n) => setPool((p) => ({ ...p, white: n }))}
          />
          <SurgeToggle value={surge} onChange={setSurge} />
          <div className="app__point-cost">
            <label htmlFor="point-cost">Unit Point Cost</label>
            <input
              id="point-cost"
              type="number"
              min="0"
              placeholder="Optional"
              value={pointCost}
              onChange={(e) => setPointCost(e.target.value)}
            />
          </div>
        </section>

        <section className="app__results">
          {totalDice === 0 ? (
            <p className="app__empty">Add dice to see results.</p>
          ) : (
            <>
              <StatsSummary
                expectedHits={results.expectedHits}
                expectedCrits={results.expectedCrits}
                expectedTotal={results.expectedTotal}
                pointCost={parsedCost > 0 ? parsedCost : undefined}
              />
              <DistributionChart distribution={results.distribution} />
              <CumulativeTable cumulative={results.cumulative} />
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default App;
