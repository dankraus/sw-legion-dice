# AGENTS.md

## Cursor Cloud specific instructions

This is a client-side-only React + TypeScript + Vite application (Legion Dice Calculator). There is no backend, database, or Docker dependency.

### Services

| Service    | Command         | Notes                                         |
| ---------- | --------------- | --------------------------------------------- |
| Dev server | `npm run dev`   | Vite HMR on port 5173                         |
| Lint       | `npm run lint`  | ESLint 9 with typescript-eslint               |
| Tests      | `npm run test`  | Vitest (29 unit tests for probability engine) |
| Build      | `npm run build` | `tsc -b && vite build`, outputs to `dist/`    |

### Caveats

- Node.js 20+ is required (uses React 19, Vite 6, Vitest 4, TypeScript 5.9).
- The build produces a chunk >500 kB warning; this is expected and non-blocking.
- All computation is client-side; no network services or secrets are needed.
