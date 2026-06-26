import { boxDims, idx } from "./types";
import type { Grid, Size, DifficultyLabel, Puzzle } from "./types";
import { countSolutions, solve } from "./solver";
import { rate } from "./rater";

// Deterministic PRNG (mulberry32) — lets us seed daily puzzles by date.
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedFromString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function shuffled<T>(arr: T[], rand: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Build a fully solved board by randomized backtracking.
function buildSolved(size: Size, rand: () => number): Grid {
  const g: Grid = new Array(size * size).fill(0);
  const nums = Array.from({ length: size }, (_, i) => i + 1);
  const { rows: br, cols: bc } = boxDims(size);

  function valid(r: number, c: number, v: number) {
    for (let i = 0; i < size; i++) {
      if (g[idx(r, i, size)] === v) return false;
      if (g[idx(i, c, size)] === v) return false;
    }
    const br0 = Math.floor(r / br) * br;
    const bc0 = Math.floor(c / bc) * bc;
    for (let i = 0; i < br; i++)
      for (let j = 0; j < bc; j++)
        if (g[idx(br0 + i, bc0 + j, size)] === v) return false;
    return true;
  }

  function fill(pos = 0): boolean {
    if (pos === size * size) return true;
    const r = Math.floor(pos / size);
    const c = pos % size;
    for (const v of shuffled(nums, rand)) {
      if (valid(r, c, v)) {
        g[idx(r, c, size)] = v;
        if (fill(pos + 1)) return true;
        g[idx(r, c, size)] = 0;
      }
    }
    return false;
  }
  fill();
  return g;
}

const TARGET_CLUES: Record<Size, Record<DifficultyLabel, number>> = {
  4: { easy: 9, medium: 7, hard: 6, expert: 5 },
  6: { easy: 20, medium: 16, hard: 13, expert: 11 },
  9: { easy: 38, medium: 32, hard: 28, expert: 24 },
};

export interface GenerateOptions {
  size?: Size;
  difficulty?: DifficultyLabel;
  seed?: number | string;
}

// Carve clues out of a solved board while preserving uniqueness.
export function generate(opts: GenerateOptions = {}): Puzzle {
  const size = opts.size ?? 9;
  const difficulty = opts.difficulty ?? "medium";
  const seed =
    typeof opts.seed === "string"
      ? seedFromString(opts.seed)
      : opts.seed ?? Math.floor(Math.random() * 2 ** 31);
  const rand = rng(seed);

  const solution = buildSolved(size, rand);
  const target = TARGET_CLUES[size][difficulty];
  const grid = solution.slice();

  const cellOrder = shuffled(
    Array.from({ length: size * size }, (_, i) => i),
    rand
  );

  let clues = size * size;
  for (const i of cellOrder) {
    if (clues <= target) break;
    const backup = grid[i];
    if (backup === 0) continue;
    grid[i] = 0;
    const res = countSolutions(grid, size, 2);
    if (!res.unique) {
      grid[i] = backup;
    } else {
      clues--;
    }
  }

  const rating = rate(grid, size);
  return {
    size,
    grid,
    solution,
    cluesCount: clues,
    difficultyScore: rating.score,
    difficultyLabel: rating.label,
    techniques: rating.techniques,
    estimatedMinutes: rating.estimatedMinutes,
  };
}

// Convenience: generate one puzzle per difficulty deterministically from a date string.
// We force the LABEL to match the requested target — the rater is approximate and
// occasionally promotes a "hard" generation to "expert", but for the daily-set UX
// we want exactly one of each bucket.
export function generateDailySet(dateISO: string, size: Size = 9) {
  const levels: DifficultyLabel[] = ["easy", "medium", "hard", "expert"];
  return levels.map((d) => {
    const p = generate({ size, difficulty: d, seed: `${dateISO}:${size}:${d}` });
    return { ...p, difficultyLabel: d };
  });
}

export { solve };
