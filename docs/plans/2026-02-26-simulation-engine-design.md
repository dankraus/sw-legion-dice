# Simulation Engine – Design

**Implemented:** 2026-02-26 (see `docs/plans/2026-02-26-simulation-engine-plan.md`).

## Goal

Replace the analytic probability engine with a simulation-based engine so that "typical" or "average" results and distributions are produced by rolling the pool many times (e.g. 10,000) and aggregating. Exact probabilities are not required; the product goal is what a player can generally expect (effectiveness). This also makes it easier to add new rules later (e.g. Cover, Outmaneuver) by implementing the rule in the pipeline instead of deriving new math. **This design and the first implementation do not add Cover, Outmaneuver, or any other new rules**—those will be designed and added later.

## Why simulation

- **Extensibility (A):** Each new keyword today requires new closed-form math and branches. With simulation, add a rule = implement the rule once in the pipeline and run N times.
- **Exploration (B):** Trying "what if" mechanics is run N times and inspect expectations/distributions; no derivation.
- **Product fit:** We care about typical/average and what players can expect, not exact-to-many-decimals. Simulation with a fixed N (e.g. 10,000) gives stable, interpretable numbers and smooth-enough distributions.

## Architecture

- **Single pipeline:** For each of N runs: (1) Roll attack pool (sample each die), (2) Resolve (Critical X → surge conversion → surge tokens), (3) Rerolls (Aim/Observe/Precise: reroll up to capacity blanks, count hits/crits from rerolled dice), (4) Ram X (convert blanks then hits to crits), (5) For wounds: defense dice count = crits + max(0, hits − dodge), (6) Roll defense dice, (7) Wounds = max(0, attack total − blocks). Aggregate over N runs to get expected values and distributions.
- **Output shape unchanged:** Same public API and types: `AttackResults`, `DefenseResults`, `WoundsResults`; `calculateAttackPool(...)`, `calculateWounds(...)`, `getDefenseDistributionForDiceCount(...)`, `calculateDefensePool(...)`. Callers (App, tests) do not change except tests that assert exact equality will assert within tolerance.
- **N:** Fixed default (e.g. 10,000) so expectations and distributions are stable. Optional config (e.g. for tests) to use a seed and/or smaller N for determinism/speed.
- **Rerolls:** Simulated exactly: for each run, after resolve, identify blanks, cap reroll count by capacity, roll that many dice again and add their hit/crit outcomes (surge conversion applied). No pool-average approximation.

## Testing

- **Tolerance-based:** Existing tests that assert exact expected values or probabilities will be updated to assert within a small tolerance (e.g. expected total ±0.05, or probability ±0.02). This keeps the same test cases as behavioral specs.
- **Determinism (optional):** For CI, either use a fixed seed so runs are reproducible, or use sufficiently large N and tolerances so flakiness is negligible.
- **Known cases:** A few tests can stay "exact" where the outcome is deterministic (e.g. zero dice → 0 hits, 0 wounds).

## Out of scope (this phase)

- Cover, Outmaneuver, and any other new rules. They will be designed and implemented in a later phase.
