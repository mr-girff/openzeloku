# Changelog

All notable changes to `openzeloku` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-06-26

Initial public release. Extracted from the production engine that powers
[zeloku.com](https://zeloku.com).

### Added

- **Generator** (`generate`, `generateDailySet`)
  - Uniqueness-checked puzzle generation for 4×4, 6×6, and 9×9 boards
  - Deterministic seeded generation (seed by number or string) — same seed always yields the same puzzle, ideal for daily-puzzle sites
  - Per-size, per-difficulty clue targets (`easy` / `medium` / `hard` / `expert`)
  - `generateDailySet(dateISO, size)` returns one puzzle per difficulty for a given day
- **Solver** (`solve`, `countSolutions`, `isValidGrid`)
  - MRV (minimum remaining values) backtracking solver
  - Solution counting capped at a configurable limit — fast uniqueness checks
  - Grid validity check for arbitrary clue placements
- **Difficulty rater** (`rate`)
  - Technique-aware: recognises naked singles, hidden singles, naked pairs, pointing pairs
  - Returns a numeric score, a label (`easy` / `medium` / `hard` / `expert`), the list of techniques required, and an estimated solve time in minutes
- **Hint engine** (`nextHint`)
  - Returns the next logically-deducible move with a human-readable explanation
  - Currently covers naked singles and hidden singles in rows, columns, and boxes
- **Serialization** (`gridToString`, `stringToGrid`, `seedFromString`)
  - Compact string form for URLs and storage
  - FNV-1a string hashing for deterministic numeric seeds

### Packaging

- Pure TypeScript, zero runtime dependencies
- ESM + CJS dual build (~14 KB per format, gzip much smaller)
- Full `.d.ts` type definitions
- Works in Node 18+, modern browsers, Bun, Deno, Cloudflare Workers, Vercel Edge
- MIT licensed

### Known limitations

- `x_wing`, `swordfish`, `box_line_reduction` are recognised as `TechniqueName` values but the rater currently does not detect them. The detected pair-based techniques are signal-only (they confirm the pattern exists but don't actually eliminate candidates). PRs welcome.
- `nextHint` covers naked / hidden singles only. More techniques will be added in future minor releases.
- The rater for `hard` puzzles can occasionally promote a generation to `expert`; `generateDailySet` works around this by forcing the requested label.

[0.1.0]: https://github.com/mr-girff/openzeloku/releases/tag/v0.1.0
