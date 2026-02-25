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
  const [criticalX, setCriticalX] = useState<string>('');
  const [surgeTokens, setSurgeTokens] = useState<string>('');
  const [aimTokens, setAimTokens] = useState<string>('');
  const [observeTokens, setObserveTokens] = useState<string>('');
  const [precise, setPrecise] = useState<string>('');
  const [pointCost, setPointCost] = useState<string>('');

  const criticalXNum = criticalX === '' ? undefined : Math.max(0, Math.floor(Number(criticalX)) || 0);
  const surgeTokensNum = surgeTokens === '' ? 0 : Math.max(0, Math.floor(Number(surgeTokens)) || 0);
  const aimTokensNum = aimTokens === '' ? 0 : Math.max(0, Math.floor(Number(aimTokens)) || 0);
  const observeTokensNum = observeTokens === '' ? 0 : Math.max(0, Math.floor(Number(observeTokens)) || 0);
  const preciseNum = precise === '' ? 0 : Math.max(0, Math.floor(Number(precise)) || 0);
  const results = useMemo(
    () =>
      calculateAttackPool(
        pool,
        surge,
        criticalXNum,
        surgeTokensNum,
        aimTokensNum,
        observeTokensNum,
        preciseNum
      ),
    [pool, surge, criticalXNum, surgeTokensNum, aimTokensNum, observeTokensNum, preciseNum]
  );

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
          <div className="app__critical-x">
            <label htmlFor="critical-x">Keyword: Critical X</label>
            <input
              id="critical-x"
              type="number"
              min="0"
              placeholder="0"
              value={criticalX}
              onChange={(e) => setCriticalX(e.target.value)}
              title="Convert up to X surges to crits (before Surge Conversion)"
            />
          </div>
          <div className="app__surge-tokens">
            <label htmlFor="surge-tokens">Surge Tokens</label>
            <input
              id="surge-tokens"
              type="number"
              min="0"
              placeholder="0"
              value={surgeTokens}
              onChange={(e) => setSurgeTokens(e.target.value)}
              disabled={surge !== 'none'}
              title={surge !== 'none' ? 'Surge Tokens only apply when Surge Conversion is None.' : undefined}
            />
          </div>
          <div className="app__token-input">
            <label htmlFor="aim-tokens">Aim Tokens</label>
            <input
              id="aim-tokens"
              type="number"
              min="0"
              placeholder="0"
              value={aimTokens}
              onChange={(e) => setAimTokens(e.target.value)}
              title="Reroll up to 2 blank dice per Aim token"
            />
          </div>
          <div className="app__token-input">
            <label htmlFor="precise">Keyword: Precise</label>
            <input
              id="precise"
              type="number"
              min={0}
              placeholder="0"
              value={precise}
              onChange={(e) => setPrecise(e.target.value)}
              disabled={aimTokensNum === 0}
              title={aimTokensNum === 0 ? 'Precise only applies when using Aim tokens.' : 'Extra rerolls per Aim token when using Aim.'}
            />
          </div>
          <div className="app__token-input">
            <label htmlFor="observe-tokens">Observe Tokens</label>
            <input
              id="observe-tokens"
              type="number"
              min="0"
              placeholder="0"
              value={observeTokens}
              onChange={(e) => setObserveTokens(e.target.value)}
              title="Reroll up to 1 blank die per Observe token"
            />
          </div>
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
