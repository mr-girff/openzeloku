import { boxDims, idx } from "./types";
import type { Grid, Size, HintStep, TechniqueName } from "./types";

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

// Return the next pedagogically-useful step. Tries naked single, then hidden
// single. The explanation is human-readable so the UI can show it directly.
export function nextHint(grid: Grid, size: Size): HintStep | null {
  // Naked single
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[idx(r, c, size)] !== 0) continue;
      const cands = candidatesAt(grid, size, r, c);
      if (cands.length === 1) {
        return {
          row: r,
          col: c,
          value: cands[0],
          technique: "naked_single" as TechniqueName,
          explanation: `Cell R${r + 1}C${c + 1} has only one possible value: ${cands[0]}. Every other digit already appears in its row, column, or box.`,
        };
      }
    }
  }

  // Hidden single in any unit
  const { rows: br, cols: bc } = boxDims(size);
  const units: { name: string; cells: number[] }[] = [];
  for (let r = 0; r < size; r++)
    units.push({
      name: `row ${r + 1}`,
      cells: Array.from({ length: size }, (_, c) => idx(r, c, size)),
    });
  for (let c = 0; c < size; c++)
    units.push({
      name: `column ${c + 1}`,
      cells: Array.from({ length: size }, (_, r) => idx(r, c, size)),
    });
  let boxNum = 1;
  for (let br0 = 0; br0 < size; br0 += br)
    for (let bc0 = 0; bc0 < size; bc0 += bc) {
      const cells: number[] = [];
      for (let i = 0; i < br; i++)
        for (let j = 0; j < bc; j++) cells.push(idx(br0 + i, bc0 + j, size));
      units.push({ name: `box ${boxNum++}`, cells });
    }

  for (const unit of units) {
    for (let v = 1; v <= size; v++) {
      const spots = unit.cells.filter((i) => {
        if (grid[i] !== 0) return false;
        const r = Math.floor(i / size);
        const c = i % size;
        return candidatesAt(grid, size, r, c).includes(v);
      });
      if (spots.length === 1) {
        const r = Math.floor(spots[0] / size);
        const c = spots[0] % size;
        return {
          row: r,
          col: c,
          value: v,
          technique: "hidden_single" as TechniqueName,
          explanation: `In ${unit.name}, the digit ${v} can only go in R${r + 1}C${c + 1} — every other cell in this ${unit.name} is blocked.`,
        };
      }
    }
  }

  return null;
}
