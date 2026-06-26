import type { Grid, Size } from "./types";

// Compact string form: digits 0-9 for 9x9, or comma-separated for larger.
// 0 means empty.
export function gridToString(grid: Grid, size: Size): string {
  if (size <= 9) return grid.map((v) => String(v)).join("");
  return grid.join(",");
}

export function stringToGrid(s: string, size: Size): Grid {
  if (size <= 9) return s.split("").map((c) => parseInt(c, 10) || 0);
  return s.split(",").map((c) => parseInt(c, 10) || 0);
}
