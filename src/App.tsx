import { useState, useMemo, useEffect } from 'react';
import { parseFragment, buildFragment, type UrlState } from './urlState';
import type {
  AttackPool,
  SurgeConversion,
  DefenseDieColor,
  DefenseSurgeConversion,
  CoverLevel,
} from './types';
import { calculateAttackPool, calculateWounds } from './engine/probability';
import { DiceSelector } from './components/DiceSelector';
import { AttackSurgeToggle } from './components/AttackSurgeToggle';
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
  const initialFromUrl = useMemo(() => {
    const hash = window.location.hash;
    if (hash === '' || hash === '#') return null;
    return parseFragment(hash);
  }, []);

  const [pool, setPool] = useState<AttackPool>(() => ({
    red: initialFromUrl?.r ?? 0,
    black: initialFromUrl?.b ?? 0,
    white: initialFromUrl?.w ?? 0,
  }));
  const [surge, setSurge] = useState<SurgeConversion>(() => initialFromUrl?.surge ?? 'none');
  const [criticalX, setCriticalX] = useState<string>(() =>
    initialFromUrl ? (initialFromUrl.crit === 0 ? '' : String(initialFromUrl.crit)) : ''
  );
  const [surgeTokens, setSurgeTokens] = useState<string>(() =>
    initialFromUrl ? (initialFromUrl.sTok === 0 ? '' : String(initialFromUrl.sTok)) : ''
  );
  const [aimTokens, setAimTokens] = useState<string>(() =>
    initialFromUrl ? (initialFromUrl.aim === 0 ? '' : String(initialFromUrl.aim)) : ''
  );
  const [observeTokens, setObserveTokens] = useState<string>(() =>
    initialFromUrl ? (initialFromUrl.obs === 0 ? '' : String(initialFromUrl.obs)) : ''
  );
  const [preciseX, setPreciseX] = useState<string>(() =>
    initialFromUrl ? (initialFromUrl.precise === 0 ? '' : String(initialFromUrl.precise)) : ''
  );
  const [ramX, setRamX] = useState<string>(() =>
    initialFromUrl ? (initialFromUrl.ram === 0 ? '' : String(initialFromUrl.ram)) : ''
  );
  const [sharpshooterX, setSharpshooterX] = useState<string>(() =>
    initialFromUrl ? (initialFromUrl.sharp === 0 ? '' : String(initialFromUrl.sharp)) : ''
  );
  const [pierceX, setPierceX] = useState<string>(() =>
    initialFromUrl ? (initialFromUrl.pierce === 0 ? '' : String(initialFromUrl.pierce)) : ''
  );
  const [impactX, setImpactX] = useState<string>(() =>
    initialFromUrl ? (initialFromUrl.impact === 0 ? '' : String(initialFromUrl.impact)) : ''
  );
  const [pointCost, setPointCost] = useState<string>(() => initialFromUrl?.cost ?? '');
  const [defenseDieColor, setDefenseDieColor] = useState<DefenseDieColor>(() => initialFromUrl?.dColor ?? 'red');
  const [defenseSurge, setDefenseSurge] = useState<DefenseSurgeConversion>(() => initialFromUrl?.dSurge ?? 'none');
  const [defenseSurgeTokens, setDefenseSurgeTokens] = useState<string>(() =>
    initialFromUrl ? (initialFromUrl.dSurgeTok === 0 ? '' : String(initialFromUrl.dSurgeTok)) : ''
  );
  const [dodgeTokens, setDodgeTokens] = useState<string>(() =>
    initialFromUrl ? (initialFromUrl.dodge === 0 ? '' : String(initialFromUrl.dodge)) : ''
  );
  const [outmaneuver, setOutmaneuver] = useState<boolean>(() => initialFromUrl?.out ?? false);
  const [cover, setCover] = useState<CoverLevel>(() => initialFromUrl?.cover ?? 'none');
  const [lowProfile, setLowProfile] = useState<boolean>(() => initialFromUrl?.lowProf ?? false);
  const [suppressed, setSuppressed] = useState<boolean>(() => initialFromUrl?.sup ?? false);
  const [coverX, setCoverX] = useState<string>(() =>
    initialFromUrl ? (initialFromUrl.coverX === 0 ? '' : String(initialFromUrl.coverX)) : ''
  );
  const [armorX, setArmorX] = useState<string>(() =>
    initialFromUrl ? (initialFromUrl.armor === 0 ? '' : String(initialFromUrl.armor)) : ''
  );
  const [impervious, setImpervious] = useState<boolean>(() => initialFromUrl?.imp ?? false);
  const [suppressionTokens, setSuppressionTokens] = useState<string>(() =>
    initialFromUrl ? (initialFromUrl.suppTok === 0 ? '' : String(initialFromUrl.suppTok)) : ''
  );
  const [dangerSenseX, setDangerSenseX] = useState<string>(() =>
    initialFromUrl ? (initialFromUrl.danger === 0 ? '' : String(initialFromUrl.danger)) : ''
  );
  const [backup, setBackup] = useState<boolean>(() => initialFromUrl?.backup ?? false);
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);

  const urlState = useMemo<UrlState>(
    () => ({
      r: pool.red,
      b: pool.black,
      w: pool.white,
      surge,
      crit: criticalX === '' ? 0 : Math.max(0, Math.floor(Number(criticalX)) || 0),
      sTok: surgeTokens === '' ? 0 : Math.max(0, Math.floor(Number(surgeTokens)) || 0),
      aim: aimTokens === '' ? 0 : Math.max(0, Math.floor(Number(aimTokens)) || 0),
      obs: observeTokens === '' ? 0 : Math.max(0, Math.floor(Number(observeTokens)) || 0),
      precise: preciseX === '' ? 0 : Math.max(0, Math.floor(Number(preciseX)) || 0),
      ram: ramX === '' ? 0 : Math.max(0, Math.floor(Number(ramX)) || 0),
      sharp: sharpshooterX === '' ? 0 : Math.max(0, Math.floor(Number(sharpshooterX)) || 0),
      pierce: pierceX === '' ? 0 : Math.max(0, Math.floor(Number(pierceX)) || 0),
      impact: impactX === '' ? 0 : Math.max(0, Math.floor(Number(impactX)) || 0),
      cost: pointCost,
      dColor: defenseDieColor,
      dSurge: defenseSurge,
      dSurgeTok:
        defenseSurgeTokens === '' ? 0 : Math.max(0, Math.floor(Number(defenseSurgeTokens)) || 0),
      dodge: dodgeTokens === '' ? 0 : Math.max(0, Math.floor(Number(dodgeTokens)) || 0),
      out: outmaneuver,
      cover,
      lowProf: lowProfile,
      sup: suppressed,
      coverX: coverX === '' ? 0 : Math.min(2, Math.max(0, Math.floor(Number(coverX)) || 0)),
      armor: armorX === '' ? 0 : Math.max(0, Math.floor(Number(armorX)) || 0),
      imp: impervious,
      suppTok:
        suppressionTokens === ''
          ? 0
          : Math.max(0, Math.floor(Number(suppressionTokens)) || 0),
      danger: dangerSenseX === '' ? 0 : Math.max(0, Math.floor(Number(dangerSenseX)) || 0),
      backup,
    }),
    [
      pool.red,
      pool.black,
      pool.white,
      surge,
      criticalX,
      surgeTokens,
      aimTokens,
      observeTokens,
      preciseX,
      ramX,
      sharpshooterX,
      pierceX,
      impactX,
      pointCost,
      defenseDieColor,
      defenseSurge,
      defenseSurgeTokens,
      dodgeTokens,
      outmaneuver,
      cover,
      lowProfile,
      suppressed,
      coverX,
      armorX,
      impervious,
      suppressionTokens,
      dangerSenseX,
      backup,
    ]
  );

  useEffect(() => {
    const fragment = buildFragment(urlState);
    const url =
      window.location.pathname +
      window.location.search +
      (fragment ? '#' + fragment : '');
    window.history.replaceState(undefined, '', url);
  }, [urlState]);

  const criticalXNum = criticalX === '' ? undefined : Math.max(0, Math.floor(Number(criticalX)) || 0);
  const surgeTokensNum = surgeTokens === '' ? 0 : Math.max(0, Math.floor(Number(surgeTokens)) || 0);
  const aimTokensNum = aimTokens === '' ? 0 : Math.max(0, Math.floor(Number(aimTokens)) || 0);
  const observeTokensNum = observeTokens === '' ? 0 : Math.max(0, Math.floor(Number(observeTokens)) || 0);
  const preciseXNum = preciseX === '' ? 0 : Math.max(0, Math.floor(Number(preciseX)) || 0);
  const ramXNum = ramX === '' ? 0 : Math.max(0, Math.floor(Number(ramX)) || 0);
  const sharpshooterXNum = sharpshooterX === '' ? 0 : Math.max(0, Math.floor(Number(sharpshooterX)) || 0);
  const pierceXNum = pierceX === '' ? 0 : Math.max(0, Math.floor(Number(pierceX)) || 0);
  const defenseSurgeTokensNum =
    defenseSurgeTokens === '' ? 0 : Math.max(0, Math.floor(Number(defenseSurgeTokens)) || 0);
  const dodgeTokensNum = dodgeTokens === '' ? 0 : Math.max(0, Math.floor(Number(dodgeTokens)) || 0);
  const coverXNum = coverX === '' ? 0 : Math.min(2, Math.max(0, Math.floor(Number(coverX)) || 0));
  const armorXNum = armorX === '' ? 0 : Math.max(0, Math.floor(Number(armorX)) || 0);
  const suppressionTokensNum = suppressionTokens === '' ? 0 : Math.max(0, Math.floor(Number(suppressionTokens)) || 0);
  const dangerSenseXNum = dangerSenseX === '' ? 0 : Math.max(0, Math.floor(Number(dangerSenseX)) || 0);
  const impactXNum = impactX === '' ? 0 : Math.max(0, Math.floor(Number(impactX)) || 0);
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
        suppressed,
        coverXNum,
        sharpshooterXNum,
        backup,
        armorXNum,
        impactXNum,
        pierceXNum,
        impervious,
        suppressionTokensNum,
        dangerSenseXNum
      ),
    [results, defenseDieColor, defenseSurge, dodgeTokensNum, outmaneuver, defenseSurgeTokensNum, cover, lowProfile, suppressed, coverXNum, sharpshooterXNum, backup, armorXNum, impactXNum, pierceXNum, impervious, suppressionTokensNum, dangerSenseXNum]
  );

  const totalDice = pool.red + pool.black + pool.white;
  const parsedCost = Number(pointCost);

  const handleCopyLink = () => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(window.location.href).then(
        () => {
          setCopyFeedback(true);
          window.setTimeout(() => setCopyFeedback(false), 2000);
        },
        () => {}
      );
    }
  };

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
    setPierceX('');
    setImpactX('');
    setPointCost('');
    setDefenseDieColor('red');
    setDefenseSurge('none');
    setDefenseSurgeTokens('');
    setDodgeTokens('');
    setOutmaneuver(false);
    setCover('none');
    setLowProfile(false);
    setSuppressed(false);
    setCoverX('');
    setArmorX('');
    setImpervious(false);
    setSuppressionTokens('');
    setDangerSenseX('');
    setBackup(false);
  };

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__header-title">
          <h1>Legion Roller</h1>
          <p className="app__header-subtitle">Never tell me the odds!</p>
        </div>
        <div className="app__header-actions">
          <button
            type="button"
            className="app__reset"
            onClick={handleCopyLink}
            title="Copy URL with current settings"
          >
            {copyFeedback ? 'Copied!' : 'Copy link'}
          </button>
          <button type="button" className="app__reset" onClick={handleReset}>
            Reset
          </button>
        </div>
      </header>

      <div className="app__layout">
        <section className="app__pool">
          <div className="app__attack-pool">
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
          <AttackSurgeToggle value={surge} onChange={setSurge} />
          <h3 className="app__section-heading">Tokens</h3>
          <NumberInputWithControls
            id="surge-tokens"
            label="Surge"
            value={surgeTokens}
            onChange={setSurgeTokens}
            guideAnchor="surge-tokens"
          />
          <NumberInputWithControls
            id="aim-tokens"
            label="Aim"
            value={aimTokens}
            onChange={setAimTokens}
            title="Reroll up to 2 blank dice per Aim token"
            guideAnchor="aim"
          />
          <NumberInputWithControls
            id="observe-tokens"
            label="Observe"
            value={observeTokens}
            onChange={setObserveTokens}
            title="Reroll up to 1 blank die per Observe token"
            guideAnchor="observe-x"
          />
          <h3 className="app__section-heading">Keywords</h3>
          <NumberInputWithControls
            id="critical-x"
            label="Critical"
            value={criticalX}
            onChange={setCriticalX}
            title="Convert up to X surges to crits (before Surge Conversion)"
            guideAnchor="critical-x"
          />
          <NumberInputWithControls
            id="precise-x"
            label="Precise"
            value={preciseX}
            onChange={setPreciseX}
            title="Extra rerolls per Aim token when using Aim."
            guideAnchor="precise-x"
          />
          <NumberInputWithControls
            id="ram-x"
            label="Ram"
            value={ramX}
            onChange={setRamX}
            title="Convert up to X dice to crits after rerolls (blanks first, then hits)"
            guideAnchor="ram-x"
          />
          <NumberInputWithControls
            id="sharpshooter-x"
            label="Sharpshooter"
            value={sharpshooterX}
            onChange={setSharpshooterX}
            title="Reduce cover: 1 = heavy→light, light→none; 2 = heavy/light→none"
            guideAnchor="sharpshooter-x"
          />
          <NumberInputWithControls
            id="impact-x"
            label="Impact"
            value={impactX}
            onChange={setImpactX}
            min={0}
            title="Up to X hits bypass armor when determining how many hits armor cancels."
          />
          <NumberInputWithControls
            id="pierce-x"
            label="Pierce"
            value={pierceX}
            onChange={setPierceX}
            min={0}
            title="Cancel up to X blocks on the final defense roll"
            guideAnchor="pierce-x"
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
          </div>

          <div className="app__defense-pool">
            <h2 className="app__section-heading">Defense Pool</h2>
          <DefenseDiceToggle value={defenseDieColor} onChange={setDefenseDieColor} />
          <DefenseSurgeToggle value={defenseSurge} onChange={setDefenseSurge} />
          <CoverToggle value={cover} onChange={setCover} />

          <h3 className="app__section-heading">Keywords</h3>
          <CheckboxToggle
            id="low-profile"
            label="Low Profile"
            title="When in cover, cancel one hit before rolling cover dice."
            checked={lowProfile}
            onChange={setLowProfile}
            guideAnchor="low-profile"
          />
          <CheckboxToggle
            id="backup"
            label="Backup"
            title="Backup is possible for Ranged 3+ shots and removes up to two hits when rolling defense dice."
            checked={backup}
            onChange={setBackup}
            guideAnchor="backup"
          />

          <CheckboxToggle
            id="outmaneuver"
            label="Outmaneuver"
            title="Dodge tokens can cancel crits as well as hits."
            checked={outmaneuver}
            onChange={setOutmaneuver}
            guideAnchor="outmaneuver"
          />
          <CheckboxToggle
            id="suppressed"
            label="Suppressed"
            title="Improve cover by 1 for cover rolls (none→light, light→heavy)."
            checked={suppressed}
            onChange={setSuppressed}
            disabled={cover === 'heavy'}
            guideAnchor="suppressed"
          />
          <CheckboxToggle
            id="impervious"
            label="Impervious"
            title="While defending, roll extra defense dice equal to the attack pool's total Pierce X."
            checked={impervious}
            onChange={setImpervious}
          />
          <NumberInputWithControls
            id="cover-x"
            label="Cover"
            value={coverX}
            onChange={setCoverX}
            min={0}
            max={2}
            title="Improve cover by X for cover rolls (none=0, light=1, heavy=2); cannot exceed heavy."
            guideAnchor="cover-x"
          />
          <NumberInputWithControls
            id="armor-x"
            label="Armor"
            value={armorX}
            onChange={setArmorX}
            min={0}
            title="Cancel up to X hits after cover, before defense dice; crits are not reduced."
            guideAnchor="armor-x"
          />
          <NumberInputWithControls
            id="suppression-tokens"
            label="Suppression tokens"
            value={suppressionTokens}
            onChange={setSuppressionTokens}
            min={0}
            title="Number of suppression tokens on the defender; used by Danger Sense X for extra defense dice."
          />
          <NumberInputWithControls
            id="danger-sense-x"
            label="Danger Sense"
            value={dangerSenseX}
            onChange={setDangerSenseX}
            min={0}
            title="While defending, roll one extra defense die per suppression token, up to X extra dice."
          />
          <h3 className="app__section-heading">Tokens</h3>
          <NumberInputWithControls
            id="defense-surge-tokens"
            label="Surge"
            value={defenseSurgeTokens}
            onChange={setDefenseSurgeTokens}
            min={0}
            guideAnchor="surge-tokens"
          />
          <NumberInputWithControls
            id="dodge-tokens"
            label="Dodge"
            value={dodgeTokens}
            onChange={setDodgeTokens}
            title="Cancel one hit per token before rolling defense; crits cannot be dodged."
            guideAnchor="dodge"
          />
          </div>
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
                <div className="stats-summary__stat stats-summary__stat--wounds">
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
                barColor="#dc2626"
              />
              <CumulativeTable
                cumulative={woundsResults.cumulative}
                title="At Least N Wounds"
              />
            </>
          )}
        </section>
      </div>

      <p className="app__github-note">
        Spotted a problem?{' '}
        <a href="https://github.com/dskraus/legion-dice/issues" target="_blank" rel="noopener noreferrer">
          Open an issue on the Github page
        </a>{' '}
        and let me know.
      </p>

      <a href='https://ko-fi.com/E1E31V2I7V' target='_blank'>
        <img height='36' style={{ border: '0px', height: '36px' }} src='https://storage.ko-fi.com/cdn/kofi3.png?v=6' alt='Support Legion Roller on Ko-fi' />
      </a>

      <footer className="app__footer">
        Made in Massachusetts by{' '}
        <a href="http://www.dskraus.com" target="_blank" rel="noopener noreferrer">
          Dan Kraus
        </a>
      </footer>
    </div>
  );
}

export default App;
