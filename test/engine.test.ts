import { test } from "node:test";
import assert from "node:assert/strict";
import {
  generate,
  solve,
  countSolutions,
  isValidGrid,
  nextHint,
  rate,
  generateDailySet,
  gridToString,
  stringToGrid,
  seedFromString,
} from "../src/index.ts";

test("generate 9x9 returns a unique puzzle with valid clues", () => {
  const p = generate({ size: 9, difficulty: "easy", seed: 42 });
  assert.equal(p.size, 9);
  assert.equal(p.grid.length, 81);
  assert.equal(p.solution.length, 81);
  assert.ok(isValidGrid(p.grid, 9));
  // Solution must satisfy the puzzle
  for (let i = 0; i < 81; i++) {
    if (p.grid[i] !== 0) assert.equal(p.grid[i], p.solution[i]);
  }
  // Uniqueness
  const res = countSolutions(p.grid, 9, 2);
  assert.equal(res.unique, true);
});

test("generate is deterministic given a seed", () => {
  const a = generate({ size: 9, difficulty: "medium", seed: "openzeloku-2026-01-01" });
  const b = generate({ size: 9, difficulty: "medium", seed: "openzeloku-2026-01-01" });
  assert.deepEqual(a.grid, b.grid);
  assert.deepEqual(a.solution, b.solution);
});

test("solver recovers the full solution from clues", () => {
  const p = generate({ size: 9, difficulty: "hard", seed: 7 });
  const solved = solve(p.grid, 9);
  assert.ok(solved);
  assert.deepEqual(solved, p.solution);
});

test("supports 4x4 and 6x6 boards", () => {
  const p4 = generate({ size: 4, difficulty: "easy", seed: 1 });
  assert.equal(p4.grid.length, 16);
  assert.ok(isValidGrid(p4.grid, 4));
  assert.deepEqual(solve(p4.grid, 4), p4.solution);

  const p6 = generate({ size: 6, difficulty: "medium", seed: 2 });
  assert.equal(p6.grid.length, 36);
  assert.ok(isValidGrid(p6.grid, 6));
  assert.deepEqual(solve(p6.grid, 6), p6.solution);
});

test("nextHint suggests a legal move", () => {
  const p = generate({ size: 9, difficulty: "easy", seed: 99 });
  const h = nextHint(p.grid, 9);
  assert.ok(h, "expected at least one hint for an easy puzzle");
  if (h) {
    assert.equal(p.solution[h.row * 9 + h.col], h.value);
    assert.ok(h.explanation.length > 0);
  }
});

test("rater labels match generator targets within a tolerance", () => {
  for (const label of ["easy", "medium", "hard", "expert"] as const) {
    const p = generate({ size: 9, difficulty: label, seed: `rate-${label}` });
    const r = rate(p.grid, 9);
    assert.ok(["easy", "medium", "hard", "expert"].includes(r.label));
    assert.ok(r.score >= 0);
  }
});

test("generateDailySet returns one puzzle per difficulty", () => {
  const set = generateDailySet("2026-06-26", 9);
  assert.equal(set.length, 4);
  assert.deepEqual(
    set.map((p) => p.difficultyLabel),
    ["easy", "medium", "hard", "expert"]
  );
  // Same date => same puzzles
  const set2 = generateDailySet("2026-06-26", 9);
  assert.deepEqual(set[0].grid, set2[0].grid);
});

test("serialize round-trips", () => {
  const p = generate({ size: 9, difficulty: "easy", seed: 5 });
  const s = gridToString(p.grid, 9);
  assert.equal(s.length, 81);
  assert.deepEqual(stringToGrid(s, 9), p.grid);
});

test("seedFromString is stable", () => {
  assert.equal(seedFromString("zeloku"), seedFromString("zeloku"));
  assert.notEqual(seedFromString("zeloku"), seedFromString("Zeloku"));
});

test("rejects an invalid grid", () => {
  const bad = new Array(81).fill(0);
  bad[0] = 1;
  bad[1] = 1; // two 1s in the same row
  assert.equal(isValidGrid(bad, 9), false);
});
