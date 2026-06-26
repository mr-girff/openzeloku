import { boxDims, idx } from "./types";
import type { Grid, Size } from "./types";

export interface SolveResult {
  solved: boolean;
  unique: boolean;
  solution: Grid | null;
  solutionCount: number; // capped at 2
}

function candidates(grid: Grid, size: Size, r: number, c: number): number[] {
  const used = new Set<number>();
  for (let i = 0; i < size; i++) {
    used.add(grid[idx(r, i, size)]);
    used.add(grid[idx(i, c, size)]);
  }
  const { rows: br, cols: bc } = boxDims(size);
  const br0 = Math.floor(r / br) * br;
  const bc0 = Math.floor(c / bc) * bc;
  for (let i = 0; i < br; i++)
    for (let j = 0; j < bc; j++) used.add(grid[idx(br0 + i, bc0 + j, size)]);
  const out: number[] = [];
  for (let v = 1; v <= size; v++) if (!used.has(v)) out.push(v);
  return out;
}

// Count solutions up to `limit`; returns the first solution found if any.
export function countSolutions(grid: Grid, size: Size, limit = 2): SolveResult {
  const work = grid.slice();
  let count = 0;
  let firstSolution: Grid | null = null;

  function backtrack(): boolean {
    // MRV: find empty cell with fewest candidates
    let bestIdx = -1;
    let bestCands: number[] = [];
    for (let i = 0; i < work.length; i++) {
      if (work[i] === 0) {
        const r = Math.floor(i / size);
        const c = i % size;
        const cands = candidates(work, size, r, c);
        if (cands.length === 0) return false;
        if (bestIdx === -1 || cands.length < bestCands.length) {
          bestIdx = i;
          bestCands = cands;
          if (cands.length === 1) break;
        }
      }
    }
    if (bestIdx === -1) {
      count++;
      if (!firstSolution) firstSolution = work.slice();
      return count >= limit;
    }
    for (const v of bestCands) {
      work[bestIdx] = v;
      if (backtrack()) return true;
      work[bestIdx] = 0;
    }
    return false;
  }

  backtrack();
  return {
    solved: count >= 1,
    unique: count === 1,
    solution: firstSolution,
    solutionCount: count,
  };
}

export function solve(grid: Grid, size: Size): Grid | null {
  return countSolutions(grid, size, 1).solution;
}

export function isValidGrid(grid: Grid, size: Size): boolean {
  // Check no immediate conflicts among given clues
  for (let r = 0; r < size; r++) {
    const row = new Set<number>();
    for (let c = 0; c < size; c++) {
      const v = grid[idx(r, c, size)];
      if (v === 0) continue;
      if (v < 1 || v > size) return false;
      if (row.has(v)) return false;
      row.add(v);
    }
  }
  for (let c = 0; c < size; c++) {
    const col = new Set<number>();
    for (let r = 0; r < size; r++) {
      const v = grid[idx(r, c, size)];
      if (v === 0) continue;
      if (col.has(v)) return false;
      col.add(v);
    }
  }
  const { rows: br, cols: bc } = boxDims(size);
  for (let br0 = 0; br0 < size; br0 += br) {
    for (let bc0 = 0; bc0 < size; bc0 += bc) {
      const box = new Set<number>();
      for (let i = 0; i < br; i++)
        for (let j = 0; j < bc; j++) {
          const v = grid[idx(br0 + i, bc0 + j, size)];
          if (v === 0) continue;
          if (box.has(v)) return false;
          box.add(v);
        }
    }
  }
  return true;
}
