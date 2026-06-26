// Zeloku Sudoku Core - shared types

export type Cell = number; // 0 means empty
export type Grid = Cell[]; // length = size*size; row-major
export type Size = 4 | 6 | 9;

export type DifficultyLabel = "easy" | "medium" | "hard" | "expert";
export type AgeSegment = "kids" | "teen" | "adult" | "all";

export type TechniqueName =
  | "naked_single"
  | "hidden_single"
  | "naked_pair"
  | "hidden_pair"
  | "pointing_pair"
  | "box_line_reduction"
  | "x_wing"
  | "swordfish"
  | "guess";

export interface Puzzle {
  size: Size;
  grid: Grid;       // initial clues; 0 = empty
  solution: Grid;
  cluesCount: number;
  difficultyScore: number;
  difficultyLabel: DifficultyLabel;
  techniques: TechniqueName[];
  estimatedMinutes: number;
}

export interface HintStep {
  row: number;
  col: number;
  value: number;
  technique: TechniqueName;
  explanation: string;
}

// Helpers for box geometry on rectangular subgrids (4=>2x2, 6=>2x3, 9=>3x3)
export function boxDims(size: Size): { rows: number; cols: number } {
  if (size === 4) return { rows: 2, cols: 2 };
  if (size === 6) return { rows: 2, cols: 3 };
  return { rows: 3, cols: 3 };
}

export function idx(r: number, c: number, size: Size): number {
  return r * size + c;
}
