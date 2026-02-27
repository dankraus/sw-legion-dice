import { useState, useMemo } from 'react';
import type {
  AttackPool,
  SurgeConversion,
  DefenseDieColor,
  DefenseSurgeConversion,
  CoverLevel,
} from './types';
import { calculateAttackPool, calculateWounds } from './engine/probability';
import { DiceSelector } from './components/DiceSelector';
import { SurgeToggle } from './components/SurgeToggle';
import { DefenseSurgeToggle } from './components/DefenseSurgeToggle';
import { DefenseDiceToggle } from './components/DefenseDiceToggle';
import { CoverToggle } from './components/CoverToggle';
import { CheckboxToggle } from './components/CheckboxToggle';
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
  const [preciseX, setPreciseX] = useState<string>('');
  const [ramX, setRamX] = useState<string>('');
  const [sharpshooterX, setSharpshooterX] = useState<string>('');
  const [pointCost, setPointCost] = useState<string>('');
  const [defenseDieColor, setDefenseDieColor] = useState<DefenseDieColor>('red');
  const [defenseSurge, setDefenseSurge] = useState<DefenseSurgeConversion>('none');
  const [defenseSurgeTokens, setDefenseSurgeTokens] = useState<string>('');
  const [dodgeTokens, setDodgeTokens] = useState<string>('');
  const [outmaneuver, setOutmaneuver] = useState<boolean>(false);
  const [cover, setCover] = useState<CoverLevel>('none');
  const [lowProfile, setLowProfile] = useState<boolean>(false);
  const [backup, setBackup] = useState<boolean>(false);

  const criticalXNum = criticalX === '' ? undefined : Math.max(0, Math.floor(Number(criticalX)) || 0);
  const surgeTokensNum = surgeTokens === '' ? 0 : Math.max(0, Math.floor(Number(surgeTokens)) || 0);
  const aimTokensNum = aimTokens === '' ? 0 : Math.max(0, Math.floor(Number(aimTokens)) || 0);
  const observeTokensNum = observeTokens === '' ? 0 : Math.max(0, Math.floor(Number(observeTokens)) || 0);
  const preciseXNum = preciseX === '' ? 0 : Math.max(0, Math.floor(Number(preciseX)) || 0);
  const ramXNum = ramX === '' ? 0 : Math.max(0, Math.floor(Number(ramX)) || 0);
  const sharpshooterXNum = sharpshooterX === '' ? 0 : Math.max(0, Math.floor(Number(sharpshooterX)) || 0);
  const defenseSurgeTokensNum =
    defenseSurgeTokens === '' ? 0 : Math.max(0, Math.floor(Number(defenseSurgeTokens)) || 0);
  const dodgeTokensNum = dodgeTokens === '' ? 0 : Math.max(0, Math.floor(Number(dodgeTokens)) || 0);
  const results = useMemo(
    () =>
      calculateAttackPool(
        pool,
        surge,
        criticalXNum,
        surgeTokensNum,
        aimTokensNum,
        observeTokensNum,
        preciseXNum,
        ramXNum
      ),
    [pool, surge, criticalXNum, surgeTokensNum, aimTokensNum, observeTokensNum, preciseXNum, ramXNum]
  );

  const woundsResults = useMemo(
    () =>
      calculateWounds(
        results,
        defenseDieColor,
        defenseSurge,
        dodgeTokensNum,
        outmaneuver,
        defenseSurgeTokensNum,
        cover,
        lowProfile,
        sharpshooterXNum,
        backup
      ),
    [results, defenseDieColor, defenseSurge, dodgeTokensNum, outmaneuver, defenseSurgeTokensNum, cover, lowProfile, sharpshooterXNum, backup]
  );

  const totalDice = pool.red + pool.black + pool.white;
  const parsedCost = Number(pointCost);

  const handleReset = () => {
    setPool({ red: 0, black: 0, white: 0 });
    setSurge('none');
    setCriticalX('');
    setSurgeTokens('');
    setAimTokens('');
    setObserveTokens('');
    setPreciseX('');
    setRamX('');
    setSharpshooterX('');
    setPointCost('');
    setDefenseDieColor('red');
    setDefenseSurge('none');
    setDefenseSurgeTokens('');
    setDodgeTokens('');
    setOutmaneuver(false);
    setCover('none');
    setLowProfile(false);
    setBackup(false);
  };

  return (
    <div className="app">
      <header className="app__header">
        <h1>Legion Dice Calculator</h1>
        <button type="button" className="app__reset" onClick={handleReset}>
          Reset
        </button>
      </header>

      <div className="app__layout">
        <section className="app__pool">
          <h2 className="app__section-heading">Attack Pool</h2>
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
          <h3 className="app__section-heading">Tokens</h3>
          <NumberInputWithControls
            id="surge-tokens"
            label="Surge"
            value={surgeTokens}
            onChange={setSurgeTokens}
            disabled={surge !== 'none'}
            title={surge !== 'none' ? 'Surge Tokens only apply when Surge Conversion is None.' : undefined}
          />
          <NumberInputWithControls
            id="aim-tokens"
            label="Aim"
            value={aimTokens}
            onChange={setAimTokens}
            title="Reroll up to 2 blank dice per Aim token"
          />
          <NumberInputWithControls
            id="observe-tokens"
            label="Observe"
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
            id="precise-x"
            label="Precise"
            value={preciseX}
            onChange={setPreciseX}
            disabled={aimTokensNum === 0}
            title={aimTokensNum === 0 ? 'Precise only applies when using Aim tokens. Increases the dice rerolled with an Aim token by X.' : 'Extra rerolls per Aim token when using Aim.'}
          />
          <NumberInputWithControls
            id="ram-x"
            label="Ram"
            value={ramX}
            onChange={setRamX}
            title="Convert up to X dice to crits after rerolls (blanks first, then hits)"
          />
          <NumberInputWithControls
            id="sharpshooter-x"
            label="Sharpshooter"
            value={sharpshooterX}
            onChange={setSharpshooterX}
            title="Reduce cover: 1 = heavy→light, light→none; 2 = heavy/light→none"
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

          <h2 className="app__section-heading">Defense</h2>
          <DefenseDiceToggle value={defenseDieColor} onChange={setDefenseDieColor} />
          <CoverToggle value={cover} onChange={setCover} />
          <CheckboxToggle
            id="low-profile"
            label="Low Profile"
            title="When in cover, cancel one hit before rolling cover dice."
            checked={lowProfile}
            onChange={setLowProfile}
            disabled={cover === 'none'}
          />
          <CheckboxToggle
            id="backup"
            label="Backup"
            title="Backup is possible for Ranged 3+ shots and removes up to two hits when rolling defense dice."
            checked={backup}
            onChange={setBackup}
          />
          <DefenseSurgeToggle value={defenseSurge} onChange={setDefenseSurge} />
          <h3 className="app__section-heading">Tokens</h3>
          <NumberInputWithControls
            id="defense-surge-tokens"
            label="Surge"
            value={defenseSurgeTokens}
            onChange={setDefenseSurgeTokens}
            min={0}
            disabled={defenseSurge === 'block'}
            title={
              defenseSurge === 'block'
                ? 'Defense Surge Tokens only apply when Defense Surge is None.'
                : undefined
            }
          />
          <NumberInputWithControls
            id="dodge-tokens"
            label="Dodge"
            value={dodgeTokens}
            onChange={setDodgeTokens}
            title="Cancel one hit per token before rolling defense; crits cannot be dodged."
          />
          <CheckboxToggle
            id="outmaneuver"
            label="Outmaneuver"
            title="Dodge tokens can cancel crits as well as hits."
            checked={outmaneuver}
            onChange={setOutmaneuver}
          />
        </section>

        <section className="app__results">
          {totalDice === 0 ? (
            <p className="app__empty">Add dice to see results.</p>
          ) : (
            <>
              <h3 className="app__results-heading">Attack</h3>
              <StatsSummary
                expectedHits={results.expectedHits}
                expectedCrits={results.expectedCrits}
                expectedTotal={results.expectedTotal}
                pointCost={parsedCost > 0 ? parsedCost : undefined}
              />
              <DistributionChart
                distribution={results.distribution}
                title="Attack Distribution"
                xAxisLabel="Total Successes"
              />
              <CumulativeTable
                cumulative={results.cumulative}
                title="Attack: At Least N Successes"
              />
              <h3 className="app__results-heading">Wounds</h3>
              <div className="stats-summary">
                <div className="stats-summary__stat stats-summary__stat--total">
                  <span className="stats-summary__value">
                    {woundsResults.expectedWounds.toFixed(2)}
                  </span>
                  <span className="stats-summary__label">Avg Wounds</span>
                </div>
              </div>
              <DistributionChart
                distribution={woundsResults.distribution}
                title="Wounds Distribution"
                xAxisLabel="Wounds"
              />
              <CumulativeTable
                cumulative={woundsResults.cumulative}
                title="At Least N Wounds"
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default App;
