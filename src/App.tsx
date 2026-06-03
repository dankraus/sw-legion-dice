import { useState, useMemo, useEffect } from 'react';
import { useDebouncedValue } from './useDebouncedValue';
import {
  parseFragment,
  buildFragment,
  DEFAULT_URL_STATE_POOL,
  type UrlState,
  type UrlPoolState,
} from './urlState';
import type {
  AttackPool,
  SurgeConversion,
  DefenseDieColor,
  DefenseSurgeConversion,
  CoverLevel,
  PoolConfig,
} from './types';
import { computePoolResults } from './poolResults';
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
import { ComparisonResults } from './components/ComparisonResults';
import { RulebookVersion } from './components/RulebookVersion';
import { DiceRollerModal } from './components/DiceRollerModal';
import { ShareModal } from './components/ShareModal';
import './App.css';

const numToInput = (value: number): string =>
  value === 0 ? '' : String(value);

function poolStateToConfig(pool: UrlPoolState): PoolConfig {
  return {
    pool: { red: pool.r, black: pool.b, white: pool.w },
    surge: pool.surge,
    criticalX: numToInput(pool.crit),
    surgeTokens: numToInput(pool.sTok),
    aimTokens: numToInput(pool.aim),
    observeTokens: numToInput(pool.obs),
    preciseX: numToInput(pool.precise),
    ramX: numToInput(pool.ram),
    sharpshooterX: numToInput(pool.sharp),
    pierceX: numToInput(pool.pierce),
    impactX: numToInput(pool.impact),
    pointCost: pool.cost,
    defenseDieColor: pool.dColor,
    defenseSurge: pool.dSurge,
    defenseSurgeTokens: numToInput(pool.dSurgeTok),
    dodgeTokens: numToInput(pool.dodge),
    shieldTokens: numToInput(pool.shield),
    outmaneuver: pool.out,
    cover: pool.cover,
    dugIn: pool.dugIn,
    lowProfile: pool.lowProf,
    suppressed: pool.sup,
    coverX: numToInput(pool.coverX),
    armorX: numToInput(pool.armor),
    impervious: pool.imp,
    suppressionTokens: numToInput(pool.suppTok),
    dangerSenseX: numToInput(pool.danger),
    uncannyLuckX: numToInput(pool.uLuck),
    backup: pool.backup,
  };
}

function configToPoolState(config: PoolConfig): UrlPoolState {
  const num = (value: string) =>
    value === '' ? 0 : Math.max(0, Math.floor(Number(value)) || 0);
  return {
    r: config.pool.red,
    b: config.pool.black,
    w: config.pool.white,
    surge: config.surge,
    crit: num(config.criticalX),
    sTok: num(config.surgeTokens),
    aim: num(config.aimTokens),
    obs: num(config.observeTokens),
    precise: num(config.preciseX),
    ram: num(config.ramX),
    sharp: num(config.sharpshooterX),
    pierce: num(config.pierceX),
    impact: num(config.impactX),
    cost: config.pointCost,
    dColor: config.defenseDieColor,
    dSurge: config.defenseSurge,
    dSurgeTok: num(config.defenseSurgeTokens),
    dodge: num(config.dodgeTokens),
    shield: num(config.shieldTokens),
    out: config.outmaneuver,
    cover: config.cover,
    dugIn: config.dugIn,
    lowProf: config.lowProfile,
    sup: config.suppressed,
    coverX: Math.min(2, num(config.coverX)),
    armor: num(config.armorX),
    imp: config.impervious,
    suppTok: num(config.suppressionTokens),
    danger: num(config.dangerSenseX),
    uLuck: num(config.uncannyLuckX),
    backup: config.backup,
  };
}

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
  const [surge, setSurge] = useState<SurgeConversion>(
    () => initialFromUrl?.surge ?? 'none'
  );
  const [criticalX, setCriticalX] = useState<string>(() =>
    initialFromUrl
      ? initialFromUrl.crit === 0
        ? ''
        : String(initialFromUrl.crit)
      : ''
  );
  const [surgeTokens, setSurgeTokens] = useState<string>(() =>
    initialFromUrl
      ? initialFromUrl.sTok === 0
        ? ''
        : String(initialFromUrl.sTok)
      : ''
  );
  const [aimTokens, setAimTokens] = useState<string>(() =>
    initialFromUrl
      ? initialFromUrl.aim === 0
        ? ''
        : String(initialFromUrl.aim)
      : ''
  );
  const [observeTokens, setObserveTokens] = useState<string>(() =>
    initialFromUrl
      ? initialFromUrl.obs === 0
        ? ''
        : String(initialFromUrl.obs)
      : ''
  );
  const [preciseX, setPreciseX] = useState<string>(() =>
    initialFromUrl
      ? initialFromUrl.precise === 0
        ? ''
        : String(initialFromUrl.precise)
      : ''
  );
  const [ramX, setRamX] = useState<string>(() =>
    initialFromUrl
      ? initialFromUrl.ram === 0
        ? ''
        : String(initialFromUrl.ram)
      : ''
  );
  const [sharpshooterX, setSharpshooterX] = useState<string>(() =>
    initialFromUrl
      ? initialFromUrl.sharp === 0
        ? ''
        : String(initialFromUrl.sharp)
      : ''
  );
  const [pierceX, setPierceX] = useState<string>(() =>
    initialFromUrl
      ? initialFromUrl.pierce === 0
        ? ''
        : String(initialFromUrl.pierce)
      : ''
  );
  const [impactX, setImpactX] = useState<string>(() =>
    initialFromUrl
      ? initialFromUrl.impact === 0
        ? ''
        : String(initialFromUrl.impact)
      : ''
  );
  const [pointCost, setPointCost] = useState<string>(
    () => initialFromUrl?.cost ?? ''
  );
  const [defenseDieColor, setDefenseDieColor] = useState<DefenseDieColor>(
    () => initialFromUrl?.dColor ?? 'red'
  );
  const [defenseSurge, setDefenseSurge] = useState<DefenseSurgeConversion>(
    () => initialFromUrl?.dSurge ?? 'none'
  );
  const [defenseSurgeTokens, setDefenseSurgeTokens] = useState<string>(() =>
    initialFromUrl
      ? initialFromUrl.dSurgeTok === 0
        ? ''
        : String(initialFromUrl.dSurgeTok)
      : ''
  );
  const [dodgeTokens, setDodgeTokens] = useState<string>(() =>
    initialFromUrl
      ? initialFromUrl.dodge === 0
        ? ''
        : String(initialFromUrl.dodge)
      : ''
  );
  const [shieldTokens, setShieldTokens] = useState<string>(() =>
    initialFromUrl
      ? initialFromUrl.shield === 0
        ? ''
        : String(initialFromUrl.shield)
      : ''
  );
  const [outmaneuver, setOutmaneuver] = useState<boolean>(
    () => initialFromUrl?.out ?? false
  );
  const [cover, setCover] = useState<CoverLevel>(
    () => initialFromUrl?.cover ?? 'none'
  );
  const [dugIn, setDugIn] = useState<boolean>(
    () => initialFromUrl?.dugIn ?? false
  );
  const [lowProfile, setLowProfile] = useState<boolean>(
    () => initialFromUrl?.lowProf ?? false
  );
  const [suppressed, setSuppressed] = useState<boolean>(
    () => initialFromUrl?.sup ?? false
  );
  const [coverX, setCoverX] = useState<string>(() =>
    initialFromUrl
      ? initialFromUrl.coverX === 0
        ? ''
        : String(initialFromUrl.coverX)
      : ''
  );
  const [armorX, setArmorX] = useState<string>(() =>
    initialFromUrl
      ? initialFromUrl.armor === 0
        ? ''
        : String(initialFromUrl.armor)
      : ''
  );
  const [impervious, setImpervious] = useState<boolean>(
    () => initialFromUrl?.imp ?? false
  );
  const [suppressionTokens, setSuppressionTokens] = useState<string>(() =>
    initialFromUrl
      ? initialFromUrl.suppTok === 0
        ? ''
        : String(initialFromUrl.suppTok)
      : ''
  );
  const [dangerSenseX, setDangerSenseX] = useState<string>(() =>
    initialFromUrl
      ? initialFromUrl.danger === 0
        ? ''
        : String(initialFromUrl.danger)
      : ''
  );
  const [uncannyLuckX, setUncannyLuckX] = useState<string>(() =>
    initialFromUrl
      ? initialFromUrl.uLuck === 0
        ? ''
        : String(initialFromUrl.uLuck)
      : ''
  );
  const [backup, setBackup] = useState<boolean>(
    () => initialFromUrl?.backup ?? false
  );
  const [shareOpen, setShareOpen] = useState(false);
  const [diceRollerOpen, setDiceRollerOpen] = useState(false);
  const [pinnedConfig, setPinnedConfig] = useState<PoolConfig | null>(() =>
    initialFromUrl?.cmp ? poolStateToConfig(initialFromUrl.a) : null
  );
  const [labelA, setLabelA] = useState<string>(() => initialFromUrl?.la ?? 'A');
  const [labelB, setLabelB] = useState<string>(() => initialFromUrl?.lb ?? 'B');

  const simulationInputs = useMemo(
    () => ({
      pool,
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
      shieldTokens,
      outmaneuver,
      cover,
      dugIn,
      lowProfile,
      suppressed,
      coverX,
      armorX,
      impervious,
      suppressionTokens,
      dangerSenseX,
      uncannyLuckX,
      backup,
    }),
    [
      pool,
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
      shieldTokens,
      outmaneuver,
      cover,
      dugIn,
      lowProfile,
      suppressed,
      coverX,
      armorX,
      impervious,
      suppressionTokens,
      dangerSenseX,
      uncannyLuckX,
      backup,
    ]
  );

  const debouncedInputs = useDebouncedValue(simulationInputs);

  const liveConfig = useMemo<PoolConfig>(
    () => ({
      pool: debouncedInputs.pool,
      surge: debouncedInputs.surge,
      criticalX: debouncedInputs.criticalX,
      surgeTokens: debouncedInputs.surgeTokens,
      aimTokens: debouncedInputs.aimTokens,
      observeTokens: debouncedInputs.observeTokens,
      preciseX: debouncedInputs.preciseX,
      ramX: debouncedInputs.ramX,
      sharpshooterX: debouncedInputs.sharpshooterX,
      pierceX: debouncedInputs.pierceX,
      impactX: debouncedInputs.impactX,
      pointCost: debouncedInputs.pointCost,
      defenseDieColor: debouncedInputs.defenseDieColor,
      defenseSurge: debouncedInputs.defenseSurge,
      defenseSurgeTokens: debouncedInputs.defenseSurgeTokens,
      dodgeTokens: debouncedInputs.dodgeTokens,
      shieldTokens: debouncedInputs.shieldTokens,
      outmaneuver: debouncedInputs.outmaneuver,
      cover: debouncedInputs.cover,
      dugIn: debouncedInputs.dugIn,
      lowProfile: debouncedInputs.lowProfile,
      suppressed: debouncedInputs.suppressed,
      coverX: debouncedInputs.coverX,
      armorX: debouncedInputs.armorX,
      impervious: debouncedInputs.impervious,
      suppressionTokens: debouncedInputs.suppressionTokens,
      dangerSenseX: debouncedInputs.dangerSenseX,
      uncannyLuckX: debouncedInputs.uncannyLuckX,
      backup: debouncedInputs.backup,
    }),
    [debouncedInputs]
  );

  const urlState = useMemo<UrlState>(
    () => ({
      r: debouncedInputs.pool.red,
      b: debouncedInputs.pool.black,
      w: debouncedInputs.pool.white,
      surge: debouncedInputs.surge,
      crit:
        debouncedInputs.criticalX === ''
          ? 0
          : Math.max(0, Math.floor(Number(debouncedInputs.criticalX)) || 0),
      sTok:
        debouncedInputs.surgeTokens === ''
          ? 0
          : Math.max(0, Math.floor(Number(debouncedInputs.surgeTokens)) || 0),
      aim:
        debouncedInputs.aimTokens === ''
          ? 0
          : Math.max(0, Math.floor(Number(debouncedInputs.aimTokens)) || 0),
      obs:
        debouncedInputs.observeTokens === ''
          ? 0
          : Math.max(0, Math.floor(Number(debouncedInputs.observeTokens)) || 0),
      precise:
        debouncedInputs.preciseX === ''
          ? 0
          : Math.max(0, Math.floor(Number(debouncedInputs.preciseX)) || 0),
      ram:
        debouncedInputs.ramX === ''
          ? 0
          : Math.max(0, Math.floor(Number(debouncedInputs.ramX)) || 0),
      sharp:
        debouncedInputs.sharpshooterX === ''
          ? 0
          : Math.max(0, Math.floor(Number(debouncedInputs.sharpshooterX)) || 0),
      pierce:
        debouncedInputs.pierceX === ''
          ? 0
          : Math.max(0, Math.floor(Number(debouncedInputs.pierceX)) || 0),
      impact:
        debouncedInputs.impactX === ''
          ? 0
          : Math.max(0, Math.floor(Number(debouncedInputs.impactX)) || 0),
      cost: debouncedInputs.pointCost,
      dColor: debouncedInputs.defenseDieColor,
      dSurge: debouncedInputs.defenseSurge,
      dSurgeTok:
        debouncedInputs.defenseSurgeTokens === ''
          ? 0
          : Math.max(
              0,
              Math.floor(Number(debouncedInputs.defenseSurgeTokens)) || 0
            ),
      dodge:
        debouncedInputs.dodgeTokens === ''
          ? 0
          : Math.max(0, Math.floor(Number(debouncedInputs.dodgeTokens)) || 0),
      shield:
        debouncedInputs.shieldTokens === ''
          ? 0
          : Math.max(0, Math.floor(Number(debouncedInputs.shieldTokens)) || 0),
      out: debouncedInputs.outmaneuver,
      cover: debouncedInputs.cover,
      dugIn: debouncedInputs.dugIn,
      lowProf: debouncedInputs.lowProfile,
      sup: debouncedInputs.suppressed,
      coverX:
        debouncedInputs.coverX === ''
          ? 0
          : Math.min(
              2,
              Math.max(0, Math.floor(Number(debouncedInputs.coverX)) || 0)
            ),
      armor:
        debouncedInputs.armorX === ''
          ? 0
          : Math.max(0, Math.floor(Number(debouncedInputs.armorX)) || 0),
      imp: debouncedInputs.impervious,
      suppTok:
        debouncedInputs.suppressionTokens === ''
          ? 0
          : Math.max(
              0,
              Math.floor(Number(debouncedInputs.suppressionTokens)) || 0
            ),
      danger:
        debouncedInputs.dangerSenseX === ''
          ? 0
          : Math.max(0, Math.floor(Number(debouncedInputs.dangerSenseX)) || 0),
      uLuck:
        debouncedInputs.uncannyLuckX === ''
          ? 0
          : Math.max(0, Math.floor(Number(debouncedInputs.uncannyLuckX)) || 0),
      backup: debouncedInputs.backup,
      cmp: pinnedConfig !== null,
      la: labelA,
      lb: labelB,
      a: pinnedConfig
        ? configToPoolState(pinnedConfig)
        : { ...DEFAULT_URL_STATE_POOL },
    }),
    [debouncedInputs, pinnedConfig, labelA, labelB]
  );

  useEffect(() => {
    const fragment = buildFragment(urlState);
    const url =
      window.location.pathname +
      window.location.search +
      (fragment ? '#' + fragment : '');
    window.history.replaceState(undefined, '', url);
  }, [urlState]);

  const { results, woundsResults } = useMemo(
    () => computePoolResults(liveConfig),
    [liveConfig]
  );

  const pinnedResults = useMemo(
    () => (pinnedConfig ? computePoolResults(pinnedConfig) : null),
    [pinnedConfig]
  );
  const liveResults = useMemo(
    () => ({ results, woundsResults }),
    [results, woundsResults]
  );

  const handlePin = () => setPinnedConfig(liveConfig);
  const handleClearCompare = () => setPinnedConfig(null);

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
    setPierceX('');
    setImpactX('');
    setPointCost('');
    setDefenseDieColor('red');
    setDefenseSurge('none');
    setDefenseSurgeTokens('');
    setDodgeTokens('');
    setShieldTokens('');
    setOutmaneuver(false);
    setCover('none');
    setDugIn(false);
    setLowProfile(false);
    setSuppressed(false);
    setCoverX('');
    setArmorX('');
    setImpervious(false);
    setSuppressionTokens('');
    setDangerSenseX('');
    setUncannyLuckX('');
    setBackup(false);
    setPinnedConfig(null);
    setLabelA('A');
    setLabelB('B');
  };

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__header-title">
          <h1>
            <img src="/logo.svg" alt="" className="app__header-logo" />
            Legion Roller
          </h1>
          <p className="app__header-subtitle">Never tell me the odds!</p>
          <RulebookVersion />
        </div>
        <div className="app__header-actions">
          <button
            type="button"
            className="app__reset"
            onClick={() => setDiceRollerOpen(true)}
            title="Roll a dice pool to see its outcome"
          >
            Quick Roll
          </button>
          <button
            type="button"
            className="app__reset"
            onClick={pinnedConfig ? handleClearCompare : handlePin}
            disabled={!pinnedConfig && totalDice === 0}
            title={
              pinnedConfig
                ? 'Exit compare mode and clear pinned pool A'
                : 'Pin the current pool as A to compare against'
            }
          >
            {pinnedConfig ? 'Clear compare' : 'Pin as A'}
          </button>
          <button
            type="button"
            className="app__reset"
            onClick={() => setShareOpen(true)}
            title="Share this setup as a link, text, or image"
          >
            Share
          </button>
          <button type="button" className="app__reset" onClick={handleReset}>
            Reset
          </button>
        </div>
      </header>

      {diceRollerOpen ? (
        <DiceRollerModal onClose={() => setDiceRollerOpen(false)} />
      ) : null}

      {shareOpen ? (
        <ShareModal
          url={window.location.href}
          live={{
            config: liveConfig,
            results: liveResults,
            label: labelB || 'B',
          }}
          pinned={
            pinnedConfig && pinnedResults
              ? {
                  config: pinnedConfig,
                  results: pinnedResults,
                  label: labelA || 'A',
                }
              : undefined
          }
          onClose={() => setShareOpen(false)}
        />
      ) : null}

      <main className="app__main">
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
                title="Each Aim token: reroll up to 2 blanks"
                guideAnchor="aim"
              />
              <NumberInputWithControls
                id="observe-tokens"
                label="Observe"
                value={observeTokens}
                onChange={setObserveTokens}
                title="Each Observe token: reroll 1 blank."
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
                title="Vs. a unit with Armor: convert up to X hit results to critical hit results before Armor cancels hit results (Armor affects hits only)."
                guideAnchor="impact-x"
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
              <DefenseDiceToggle
                value={defenseDieColor}
                onChange={setDefenseDieColor}
              />
              <DefenseSurgeToggle
                value={defenseSurge}
                onChange={setDefenseSurge}
              />
              <CoverToggle value={cover} onChange={setCover} />
              <CheckboxToggle
                id="dug-in"
                label="Dug In"
                title="When in cover, roll red defense dice for the cover roll instead of white."
                checked={dugIn}
                onChange={setDugIn}
              />

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
                title="If you roll at least one block (after surge conversion), Pierce X cancels one fewer block."
                checked={impervious}
                onChange={setImpervious}
                guideAnchor="impervious"
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
                id="danger-sense-x"
                label="Danger Sense"
                value={dangerSenseX}
                onChange={setDangerSenseX}
                min={0}
                title="While defending, roll one extra defense die per suppression token, up to X extra dice."
                guideAnchor="danger-sense-x"
              />
              <NumberInputWithControls
                id="uncanny-luck-x"
                label="Uncanny Luck"
                value={uncannyLuckX}
                onChange={setUncannyLuckX}
                min={0}
                title="While defending, reroll up to X defense dice that would not become blocks."
                guideAnchor="uncanny-luck-x"
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
                id="shield-tokens"
                label="Shield"
                value={shieldTokens}
                onChange={setShieldTokens}
                min={0}
                title="Cancel one hit or one crit per token before rolling defense (applied after cover, before dodge)."
                guideAnchor="shield-tokens"
              />
              <NumberInputWithControls
                id="dodge-tokens"
                label="Dodge"
                value={dodgeTokens}
                onChange={setDodgeTokens}
                title="Cancel one hit per token before rolling defense; crits cannot be dodged."
                guideAnchor="dodge"
              />
              <NumberInputWithControls
                id="suppression-tokens"
                label="Suppression"
                value={suppressionTokens}
                onChange={setSuppressionTokens}
                min={0}
                title="Number of suppression tokens on the defender; used by Danger Sense X for extra defense dice."
                guideAnchor="suppression"
              />
            </div>
          </section>

          <section className="app__results">
            {pinnedConfig && pinnedResults ? (
              <>
                <ComparisonResults
                  configA={pinnedConfig}
                  configB={liveConfig}
                  resultsA={pinnedResults}
                  resultsB={liveResults}
                  costA={pinnedConfig.pointCost}
                  costB={liveConfig.pointCost}
                  labelA={labelA || 'A'}
                  labelB={labelB || 'B'}
                  onLabelAChange={setLabelA}
                  onLabelBChange={setLabelB}
                />
              </>
            ) : totalDice === 0 ? (
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
                  {parsedCost > 0 && woundsResults.expectedWounds > 0 && (
                    <div className="stats-summary__stat stats-summary__stat--efficiency">
                      <span className="stats-summary__value">
                        {(parsedCost / woundsResults.expectedWounds).toFixed(1)}
                      </span>
                      <span className="stats-summary__label">
                        Pts / Avg Wound
                      </span>
                    </div>
                  )}
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
      </main>

      <footer className="app__footer">
        <div className="app__footer-bar">
          <a
            className="app__footer-kofi"
            href="https://ko-fi.com/E1E31V2I7V"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              height="36"
              style={{ border: '0px', height: '36px' }}
              src="https://storage.ko-fi.com/cdn/kofi3.png?v=6"
              alt="Support Legion Roller on Ko-fi"
            />
          </a>
          <p className="app__footer-links">
            Spotted a problem?{' '}
            <a
              href="https://github.com/dankraus/legion-roller/issues"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open an issue on the Github page
            </a>{' '}
            and let me know.
          </p>
        </div>
        <p className="app__footer-tagline">
          Legion Roller is a dice simulator and probability calculator for Star
          Wars Legion by Atomic Mass Games.
        </p>
        <p className="app__footer-disclaimer">
          This site is not affiliated with, endorsed by, or connected with
          Atomic Mass Games or The Walt Disney Company. Star Wars Legion and
          related marks are trademarks of their respective owners.
        </p>
        <p className="app__footer-credit">
          Made in Massachusetts by{' '}
          <a
            href="http://www.dskraus.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Dan Kraus
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
