# Legion Roller

**[legionroller.com](http://www.legionroller.com)** — a dice simulator and probability calculator for [Star Wars: Legion](https://www.atomicmassgames.com/swlegion) by Atomic Mass Games.

Configure attack and defense pools, keywords, and modifiers, then see simulated odds for hits, crits, blocks, surges, and wounds. Results are simulation-based (10,000 runs) and represent typical expectations rather than exact probabilities. Share setups via URL fragments. Roll one off dice pools to see results.

This site is not affiliated with, endorsed by, or connected with Atomic Mass Games or The Walt Disney Company.

## Support

If Legion Roller helps your list-building or table math, consider [buying Dan a coffee on Buy Me a Coffee](https://ko-fi.com/dankraus). After covering hosting costs for the year (domain name), I will donate to local food banks.

## Development

Client-side only — React, TypeScript, and Vite. No backend, database, or Docker required.

**Prerequisites:** Node.js 20+

### Install

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Opens the dev server at [http://localhost:5173](http://localhost:5173) with hot module replacement.

### Build

```bash
npm run build
```

Type-checks with TypeScript, then produces a production bundle in `dist/`. Preview the build locally with:

```bash
npm run preview
```

### Test

```bash
npm run test
```

Runs the Vitest unit test suite once. For watch mode during development:

```bash
npm run test:watch
```

### Lint and format

```bash
npm run lint
npm run format:check
```

Use `npm run format` to apply Prettier formatting.
