import { useState, useMemo } from 'react';
import type { AttackPool, SurgeConversion } from './types';
import { calculateAttackPool } from './engine/probability';
import { DiceSelector } from './components/DiceSelector';
import { SurgeToggle } from './components/SurgeToggle';
import { NumberInputWithControls } from './components/NumberInputWithControls';
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
  const [ramX, setRamX] = useState<string>('');
  const [pointCost, setPointCost] = useState<string>('');

  const criticalXNum = criticalX === '' ? undefined : Math.max(0, Math.floor(Number(criticalX)) || 0);
  const surgeTokensNum = surgeTokens === '' ? 0 : Math.max(0, Math.floor(Number(surgeTokens)) || 0);
  const aimTokensNum = aimTokens === '' ? 0 : Math.max(0, Math.floor(Number(aimTokens)) || 0);
  const observeTokensNum = observeTokens === '' ? 0 : Math.max(0, Math.floor(Number(observeTokens)) || 0);
  const preciseNum = precise === '' ? 0 : Math.max(0, Math.floor(Number(precise)) || 0);
  const ramXNum = ramX === '' ? 0 : Math.max(0, Math.floor(Number(ramX)) || 0);
  const results = useMemo(
    () =>
      calculateAttackPool(
        pool,
        surge,
        criticalXNum,
        surgeTokensNum,
        aimTokensNum,
        observeTokensNum,
        preciseNum,
        ramXNum
      ),
    [pool, surge, criticalXNum, surgeTokensNum, aimTokensNum, observeTokensNum, preciseNum, ramXNum]
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
          <NumberInputWithControls
            id="surge-tokens"
            label="Surge Tokens"
            value={surgeTokens}
            onChange={setSurgeTokens}
            disabled={surge !== 'none'}
            title={surge !== 'none' ? 'Surge Tokens only apply when Surge Conversion is None.' : undefined}
          />
          <NumberInputWithControls
            id="aim-tokens"
            label="Aim Tokens"
            value={aimTokens}
            onChange={setAimTokens}
            title="Reroll up to 2 blank dice per Aim token"
          />
          <NumberInputWithControls
            id="observe-tokens"
            label="Observe Tokens"
            value={observeTokens}
            onChange={setObserveTokens}
            title="Reroll up to 1 blank die per Observe token"
          />
          <h3 className="app__section-heading">Keywords</h3>
          <NumberInputWithControls
            id="critical-x"
            label="Critical"
            value={criticalX}
            onChange={setCriticalX}
            title="Convert up to X surges to crits (before Surge Conversion)"
          />
          <NumberInputWithControls
            id="precise"
            label="Precise"
            value={precise}
            onChange={setPrecise}
            disabled={aimTokensNum === 0}
            title={aimTokensNum === 0 ? 'Precise only applies when using Aim tokens.' : 'Extra rerolls per Aim token when using Aim.'}
          />
          <NumberInputWithControls
            id="ram-x"
            label="Ram"
            value={ramX}
            onChange={setRamX}
            title="Convert up to X dice to crits after rerolls (blanks first, then hits)"
          />
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
