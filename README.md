# openzeloku

> Fast, dependency-free Sudoku engine in TypeScript — generator, solver, technique-aware difficulty rater, and human-readable hint engine. Supports 4×4, 6×6, and 9×9 boards.

[![npm version](https://img.shields.io/npm/v/openzeloku.svg)](https://www.npmjs.com/package/openzeloku)
[![CI](https://github.com/mr-girff/openzeloku/actions/workflows/ci.yml/badge.svg)](https://github.com/mr-girff/openzeloku/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Types: TypeScript](https://img.shields.io/badge/types-TypeScript-blue.svg)](./src/types.ts)
[![Dependencies: 0](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](./package.json)

`openzeloku` is the open-source extraction of the Sudoku engine that powers **[zeloku.com](https://zeloku.com)** — a daily Sudoku site with kid-friendly 4×4 and 6×6 boards alongside the classic 9×9.

The engine is **pure TypeScript, zero runtime dependencies**, works in Node, the browser, Bun, Deno, and edge runtimes (Cloudflare Workers, Vercel Edge), and is **deterministic** when seeded — perfect for daily-puzzle sites where every visitor on a given day needs the same boards.

- Live demo & daily puzzles: **[zeloku.com](https://zeloku.com)**
- Kid-friendly 4×4 boards: **[zeloku.com/play/4x4](https://zeloku.com)**
- 6×6 (2×3 boxes): **[zeloku.com/play/6x6](https://zeloku.com)**

---

## Why another Sudoku library?

Most npm Sudoku packages are abandoned, JS-only, 9×9-only, or treat "difficulty" as a clue count. `openzeloku` is different:

| Feature                        | openzeloku | sudoku-gen | sudoku.js | @bobinrinder/sudoku |
| ------------------------------ | :--------: | :--------: | :-------: | :-----------------: |
| TypeScript types               |    ✅      |     ❌     |    ❌     |         ❌          |
| Zero runtime dependencies      |    ✅      |     ✅     |    ✅     |         ✅          |
| 4×4 / 6×6 / 9×9 boards         |    ✅      |     ❌     |    ❌     |         ❌          |
| Deterministic seeded generator |    ✅      |     ❌     |    ❌     |         ❌          |
| Uniqueness-checked puzzles     |    ✅      |     ✅     |    ✅     |         ✅          |
| Technique-aware difficulty     |    ✅      |     ❌     |    ❌     |         ❌          |
| Step-by-step hint engine       |    ✅      |     ❌     |    ❌     |         ❌          |
| Edge / Cloudflare Workers safe |    ✅      |     ⚠️     |    ⚠️     |         ⚠️          |
| ESM + CJS dual build           |    ✅      |     ❌     |    ❌     |         ❌          |

> Comparison reflects the state of the most popular Sudoku packages on npm as of 2026; PRs welcome if anything is out of date.

---

## Install

```bash
npm install openzeloku
# or
pnpm add openzeloku
# or
yarn add openzeloku
```

---

## Quick start

### Generate a puzzle

```ts
import { generate } from "openzeloku";

const puzzle = generate({ size: 9, difficulty: "medium" });

console.log(puzzle.difficultyLabel);   // "medium"
console.log(puzzle.cluesCount);         // ~32
console.log(puzzle.techniques);         // ["naked_single", "hidden_single", ...]
console.log(puzzle.estimatedMinutes);   // ~12
console.log(puzzle.grid);               // number[] length 81, 0 = empty
console.log(puzzle.solution);           // number[] length 81, fully solved
```

### Deterministic daily puzzles

The generator is deterministic when given a seed, so every visitor on a given day sees the same puzzle — no database required.

```ts
import { generate, generateDailySet } from "openzeloku";

// Same string → same puzzle, forever:
const today = new Date().toISOString().slice(0, 10); // e.g. "2026-06-26"
const puzzle = generate({ size: 9, difficulty: "hard", seed: today });

// Or get one puzzle per difficulty for the day in a single call:
const [easy, medium, hard, expert] = generateDailySet(today, 9);
```

### Solve any board

```ts
import { solve, countSolutions, isValidGrid } from "openzeloku";

const grid = [
  5,3,0, 0,7,0, 0,0,0,
  6,0,0, 1,9,5, 0,0,0,
  0,9,8, 0,0,0, 0,6,0,
  // ...
];

isValidGrid(grid, 9);                   // true / false
const solution = solve(grid, 9);        // number[] | null
const res = countSolutions(grid, 9, 2); // { unique, solutionCount, solution }
```

### Step-by-step hints

`nextHint` returns the next logically-deducible move with a plain-English explanation — drop it straight into your UI.

```ts
import { nextHint } from "openzeloku";

const hint = nextHint(puzzle.grid, 9);
// {
//   row: 4, col: 7, value: 3,
//   technique: "hidden_single",
//   explanation: "In row 5, the digit 3 can only go in R5C8 — every other cell in this row is blocked."
// }
```

### Smaller boards for kids & beginners

```ts
const tiny = generate({ size: 4, difficulty: "easy" });  // 4×4 with 2×2 boxes
const small = generate({ size: 6, difficulty: "easy" }); // 6×6 with 2×3 boxes
```

Play these live at [zeloku.com](https://zeloku.com).

### Serialize / deserialize

```ts
import { gridToString, stringToGrid } from "openzeloku";

const s = gridToString(puzzle.grid, 9); // "530070000600195000098000060..."
const back = stringToGrid(s, 9);
```

---

## API

| Export                | Signature                                                                  | Notes                                                                |
| --------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `generate(opts?)`     | `(opts?: { size?, difficulty?, seed? }) => Puzzle`                         | Default: 9×9 medium, random seed.                                    |
| `generateDailySet`    | `(dateISO: string, size?: Size) => Puzzle[]`                               | Returns one puzzle per difficulty for a given day.                   |
| `solve(grid, size)`   | `(grid, size) => Grid \| null`                                             | Returns the first solution found (or `null` if unsolvable).          |
| `countSolutions`      | `(grid, size, limit?) => SolveResult`                                      | Capped count — use to check uniqueness.                              |
| `isValidGrid`         | `(grid, size) => boolean`                                                  | Verifies clues don't conflict in any row, column, or box.            |
| `nextHint(grid,size)` | `(grid, size) => HintStep \| null`                                         | Naked single → hidden single, with human-readable explanation.       |
| `rate(grid, size)`    | `(grid, size) => RatingResult`                                             | Technique-aware score + label + estimated solve minutes.             |
| `gridToString`        | `(grid, size) => string`                                                   | Compact form for URLs and storage.                                   |
| `stringToGrid`        | `(s, size) => Grid`                                                        | Inverse of `gridToString`.                                           |
| `seedFromString`      | `(s: string) => number`                                                    | FNV-1a hash — used internally to derive deterministic numeric seeds. |

All exported types (`Size`, `Grid`, `DifficultyLabel`, `Puzzle`, `HintStep`, `TechniqueName`, …) are in [`src/types.ts`](./src/types.ts).

### Difficulty model

`openzeloku` rates difficulty by the **hardest technique required**, not just clue count. The current rater recognises:

- `naked_single`, `hidden_single` — beginner
- `naked_pair`, `pointing_pair` — intermediate (detected as difficulty signals)
- `x_wing`, `swordfish` — advanced (planned for full elimination support; PRs welcome)
- `guess` — if no technique chain solves it, the rater flags `guess` so you can decide whether to reject the puzzle

This is intentionally simpler than a full chained-solver implementation — fast enough to rate millions of puzzles per minute, accurate enough to keep difficulty buckets meaningful.

---

## Performance

Rough numbers on an M2 MacBook Air, Node 20:

| Operation                          | 9×9     | 6×6     | 4×4    |
| ---------------------------------- | ------- | ------- | ------ |
| `generate({ difficulty: "easy" })` | ~3 ms   | ~0.5 ms | ~0.2 ms |
| `generate({ difficulty: "hard" })` | ~15 ms  | ~1 ms   | ~0.3 ms |
| `solve(filled-clue grid)`          | < 1 ms  | < 1 ms  | < 1 ms  |
| `rate(grid)`                       | ~0.5 ms | ~0.2 ms | ~0.1 ms |

Numbers are indicative; expect more variance on hard/expert and on the first runs (JIT warm-up).

---

## Compatibility

- **Node**: 18+
- **Browsers**: any modern evergreen browser (ES2020+)
- **Bun**, **Deno**: works directly via the ESM build
- **Cloudflare Workers / Vercel Edge**: works — no `node:` imports, no globals, no `Date.now()` in the hot path when you pass a `seed`

---

## Used by

- **[zeloku.com](https://zeloku.com)** — daily Sudoku, kid-friendly 4×4 and 6×6 boards, technique-based hints

If you're using `openzeloku` in production, open a PR adding your project here.

---

## Contributing

Issues and PRs welcome. Especially:

- Additional techniques (`x_wing`, `swordfish` with actual candidate elimination, not just detection)
- Killer / Sandwich / Mini-Killer variants
- Wider hint coverage in `nextHint` (currently naked/hidden singles only)
- Benchmarks under real workloads

Local development:

```bash
git clone https://github.com/mr-girff/openzeloku.git
cd openzeloku
npm install
npm test
npm run build
```

---

## License

[MIT](./LICENSE) © [Zeloku](https://zeloku.com)
