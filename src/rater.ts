import { boxDims, idx } from "./types";
import type { Grid, Size, DifficultyLabel, TechniqueName } from "./types";

export interface RatingResult {
  score: number;
  label: DifficultyLabel;
  techniques: TechniqueName[];
  estimatedMinutes: number;
}

// Lightweight technique-aware rater: tries to solve using progressively harder
// techniques. The hardest technique it needs to invoke dominates the score.
// This is intentionally simpler than a full solver chain but gives Zeloku a
// real signal beyond clue-count.
export function rate(grid: Grid, size: Size): RatingResult {
  const work = grid.slice();
  const techniques = new Set<TechniqueName>();
  let steps = 0;

  while (true) {
    const before = steps;

    if (applyNakedSingles(work, size)) {
      techniques.add("naked_single");
      steps++;
      continue;
    }
    if (applyHiddenSingles(work, size)) {
      techniques.add("hidden_single");
      steps++;
      continue;
    }
    // Pair-based techniques here are signal-only (they detect a pattern but
    // don't actually eliminate candidates), so we record them at most once
    // and then break — otherwise the outer loop would spin forever the
    // moment naked/hidden singles stop making progress.
    if (!techniques.has("naked_pair") && applyNakedPairs(work, size)) {
      techniques.add("naked_pair");
    }
    if (!techniques.has("pointing_pair") && applyPointingPairs(work, size)) {
      techniques.add("pointing_pair");
    }

    if (steps === before) break;
  }

  const solved = work.every((v) => v !== 0);
  if (!solved) techniques.add("guess");

  // Weight: hardest required technique dominates score.
  const weight: Record<TechniqueName, number> = {
    naked_single: 1,
    hidden_single: 2,
    naked_pair: 4,
    hidden_pair: 5,
    pointing_pair: 5,
    box_line_reduction: 6,
    x_wing: 8,
    swordfish: 10,
    guess: 12,
  };
  const maxW = Math.max(0, ...Array.from(techniques).map((t) => weight[t]));
  const cluesGiven = grid.filter((v) => v !== 0).length;
  const cluesScore = Math.max(0, (size * size - cluesGiven) / (size * size)) * 6;
  const score = +(maxW + cluesScore).toFixed(2);

  let label: DifficultyLabel = "easy";
  if (score >= 14) label = "expert";
  else if (score >= 9) label = "hard";
  else if (score >= 5) label = "medium";

  const baseMinutes: Record<DifficultyLabel, number> = {
    easy: 5,
    medium: 12,
    hard: 22,
    expert: 35,
  };
  const estimatedMinutes = Math.round(
    baseMinutes[label] * (size === 9 ? 1 : size === 6 ? 0.5 : 0.25)
  );

  return {
    score,
    label,
    techniques: Array.from(techniques),
    estimatedMinutes,
  };
}

// ---------- candidate computation ----------
function candidatesAt(g: Grid, size: Size, r: number, c: number): number[] {
  if (g[idx(r, c, size)] !== 0) return [];
  const used = new Set<number>();
  for (let i = 0; i < size; i++) {
    used.add(g[idx(r, i, size)]);
    used.add(g[idx(i, c, size)]);
  }
  const { rows: br, cols: bc } = boxDims(size);
  const br0 = Math.floor(r / br) * br;
  const bc0 = Math.floor(c / bc) * bc;
  for (let i = 0; i < br; i++)
    for (let j = 0; j < bc; j++) used.add(g[idx(br0 + i, bc0 + j, size)]);
  const out: number[] = [];
  for (let v = 1; v <= size; v++) if (!used.has(v)) out.push(v);
  return out;
}

function applyNakedSingles(g: Grid, size: Size): boolean {
  for (let i = 0; i < g.length; i++) {
    if (g[i] !== 0) continue;
    const r = Math.floor(i / size);
    const c = i % size;
    const cands = candidatesAt(g, size, r, c);
    if (cands.length === 1) {
      g[i] = cands[0];
      return true;
    }
  }
  return false;
}

function applyHiddenSingles(g: Grid, size: Size): boolean {
  const { rows: br, cols: bc } = boxDims(size);

  const units: number[][] = [];
  for (let r = 0; r < size; r++) {
    const u: number[] = [];
    for (let c = 0; c < size; c++) u.push(idx(r, c, size));
    units.push(u);
  }
  for (let c = 0; c < size; c++) {
    const u: number[] = [];
    for (let r = 0; r < size; r++) u.push(idx(r, c, size));
    units.push(u);
  }
  for (let br0 = 0; br0 < size; br0 += br) {
    for (let bc0 = 0; bc0 < size; bc0 += bc) {
      const u: number[] = [];
      for (let i = 0; i < br; i++)
        for (let j = 0; j < bc; j++) u.push(idx(br0 + i, bc0 + j, size));
      units.push(u);
    }
  }

  for (const unit of units) {
    for (let v = 1; v <= size; v++) {
      const spots = unit.filter((i) => {
        if (g[i] !== 0) return false;
        const r = Math.floor(i / size);
        const c = i % size;
        return candidatesAt(g, size, r, c).includes(v);
      });
      if (spots.length === 1) {
        g[spots[0]] = v;
        return true;
      }
    }
  }
  return false;
}

// Detect (but don't act on) naked pairs and pointing pairs — used only as
// difficulty signals here; full elimination would be implemented for hints.
function applyNakedPairs(g: Grid, size: Size): boolean {
  // signal-only: returns true if a naked pair pattern exists somewhere
  for (let r = 0; r < size; r++) {
    const cellsCands: { i: number; cands: number[] }[] = [];
    for (let c = 0; c < size; c++) {
      const i = idx(r, c, size);
      if (g[i] === 0) cellsCands.push({ i, cands: candidatesAt(g, size, r, c) });
    }
    for (let a = 0; a < cellsCands.length; a++) {
      for (let b = a + 1; b < cellsCands.length; b++) {
        const A = cellsCands[a].cands;
        const B = cellsCands[b].cands;
        if (A.length === 2 && B.length === 2 && A[0] === B[0] && A[1] === B[1])
          return true;
      }
    }
  }
  return false;
}

function applyPointingPairs(g: Grid, size: Size): boolean {
  const { rows: br, cols: bc } = boxDims(size);
  for (let br0 = 0; br0 < size; br0 += br) {
    for (let bc0 = 0; bc0 < size; bc0 += bc) {
      for (let v = 1; v <= size; v++) {
        const cells: { r: number; c: number }[] = [];
        for (let i = 0; i < br; i++)
          for (let j = 0; j < bc; j++) {
            const r = br0 + i;
            const c = bc0 + j;
            if (g[idx(r, c, size)] === 0 && candidatesAt(g, size, r, c).includes(v))
              cells.push({ r, c });
          }
        if (cells.length >= 2) {
          const sameRow = cells.every((x) => x.r === cells[0].r);
          const sameCol = cells.every((x) => x.c === cells[0].c);
          if (sameRow || sameCol) return true;
        }
      }
    }
  }
  return false;
}
