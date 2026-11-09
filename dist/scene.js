// Pure animation logic: no OpenTUI, so it can be run and checked with plain Node.
// A team of pixel-art Pokemon in a small landscape, drawn with half blocks (2 pixels per cell).
// Agent idle: night, everyone sleeps. Running: daytime, they walk and hop.
// Just finished: sunset with fireworks, they jump for joy.
import { SPRITES, sleepingRows } from "./sprites.js";

export const TICK_MS = 140;
export const PIXEL_H = 34; // 17 terminal rows, plus one caption row
const DONE_TICKS = 36;
const HILL_TOP = 15;
const MEADOW_TOP = 21;
const LANE_FEET = [22, 32]; // pixel row under the feet: back lane, front lane

// Back lane first, so the front lane is drawn over it.
const TEAM = [
  { name: "bulbasaur", lane: 0, at: 0.0 },
  { name: "gengar", lane: 0, at: 0.5 },
  { name: "squirtle", lane: 0, at: 1.0 },
  { name: "charmander", lane: 1, at: 0.12 },
  { name: "pikachu", lane: 1, at: 0.78 },
];

const THEMES = {
  sleep: {
    sky: ["#0B1426", "#13213A", "#1B2D4A"],
    hills: "#1A2E2A",
    meadow: ["#1C3A24", "#17311F"],
    flower: ["#5C6B8A", "#6E5C8A"],
    star: "#E8E8C8",
  },
  walk: {
    sky: ["#2E6FA8", "#4A8CC4", "#6FA9D8"],
    hills: "#3D7F4E",
    meadow: ["#3F8A45", "#357A3B"],
    flower: ["#F8E16C", "#F48FB1"],
    sun: "#FFE27A",
    cloud: "#EAF4FB",
  },
  done: {
    sky: ["#2A1B4A", "#6A2E5E", "#C0603A"],
    hills: "#3A2E4A",
    meadow: ["#3A5A34", "#30502C"],
    flower: ["#F8E16C", "#F48FB1"],
    fireworks: ["#FFD54F", "#FF6B9A", "#7FDBFF", "#B9F27C"],
  },
};

export const COLORS = { zzz: "#8EC5FF", spark: "#FFF59D", caption: "#8A8A8A" };
const CAPTIONS = {
  sleep: "Cả đội đang ngủ · zzz",
  walk: "Cả đội đang làm việc...",
  done: "Xong rồi! Cả đội ăn mừng",
};

const mirror = (rows) => rows.map((row) => [...row].reverse().join(""));
const FRAMES = Object.fromEntries(
  Object.entries(SPRITES).map(([name, sprite]) => {
    const width = Math.max(...sprite.rows.map((row) => row.length));
    const pad = (rows) => rows.map((row) => row.padEnd(width, "."));
    const awake = pad(sprite.rows);
    const asleep = pad(sleepingRows(sprite));
    return [name, { width, awake, asleep, awakeLeft: mirror(awake), asleepLeft: mirror(asleep) }];
  }),
);

export function createState() {
  return { frame: 0, width: 0, mode: "sleep", doneTick: 0, prevStatus: undefined, mons: [], stars: [] };
}

function layout(state, width, rng) {
  state.width = width;
  state.mons = TEAM.map((member, i) => {
    const w = FRAMES[member.name].width;
    return { ...member, x: Math.round(member.at * Math.max(0, width - w)), w, dir: i % 2 ? -1 : 1, hop: 0, phase: i * 3 };
  });
  state.stars = Array.from({ length: Math.max(6, Math.floor(width / 3)) }, () => ({
    x: 1 + Math.floor(rng() * Math.max(1, width - 2)),
    y: 1 + Math.floor(rng() * (HILL_TOP - 2)),
    phase: Math.floor(rng() * 12),
  }));
}

const blocked = (state, mon, x) =>
  state.mons.some((other) => other !== mon && other.lane === mon.lane && x < other.x + other.w + 1 && other.x < x + mon.w + 1);

/** Advances one tick. `status` is the agent's status: "idle" | "running". */
export function step(state, status, width, rng = Math.random) {
  if (state.width !== width) layout(state, width, rng);
  if (state.prevStatus === "running" && status !== "running") {
    state.mode = "done";
    state.doneTick = 0;
  } else if (status === "running") state.mode = "walk";
  else if (state.mode === "done" && state.doneTick >= DONE_TICKS) state.mode = "sleep";
  state.prevStatus = status;
  state.frame += 1;
  if (state.mode === "done") state.doneTick += 1;

  for (const mon of state.mons) {
    const maxX = Math.max(0, width - mon.w);
    const t = state.frame + mon.phase;
    if (state.mode === "walk") {
      if (t % 2 === 0) {
        const next = mon.x + mon.dir;
        if (next < 0 || next > maxX || blocked(state, mon, next) || rng() < 0.03) mon.dir = -mon.dir;
        else mon.x = next;
      }
      mon.hop = t % 4 < 2 ? 1 : 0;
    } else if (state.mode === "done") {
      mon.hop = [0, 2, 3, 3, 2, 0][t % 6];
    } else {
      mon.hop = 0;
    }
  }
  return state;
}

function paintBackground(px, state, theme, width) {
  const { frame } = state;
  for (let y = 0; y < PIXEL_H; y++) {
    for (let x = 0; x < width; x++) {
      if (y < MEADOW_TOP) px[y][x] = theme.sky[Math.min(2, Math.floor((y / MEADOW_TOP) * 3))];
    }
  }
  // Rolling hills.
  for (let x = 0; x < width; x++) {
    const top = HILL_TOP + Math.round(2 + 2 * Math.sin(x / 4.5) + Math.sin(x / 1.7));
    for (let y = top; y < MEADOW_TOP; y++) px[y][x] = theme.hills;
  }
  // Meadow with stripes and a few flowers.
  for (let y = MEADOW_TOP; y < PIXEL_H; y++) {
    for (let x = 0; x < width; x++) px[y][x] = theme.meadow[(x + y * 3) % 7 === 0 ? 1 : 0];
  }
  for (let x = 0; x < width; x++) {
    if ((x * 13) % 11 === 3) px[LANE_FEET[1] + 1][x] = theme.flower[x % 2];
    if ((x * 7) % 9 === 4) px[LANE_FEET[0] + 2][x] = theme.flower[(x + 1) % 2];
  }

  if (theme.star) {
    for (const star of state.stars) if ((frame + star.phase) % 12 < 9) px[star.y][star.x] = theme.star;
    // Crescent moon.
    const mx = width - 7;
    [".MMM.", "MM...", "MM...", ".MMM."].forEach((row, r) =>
      [...row].forEach((ch, c) => ch === "M" && (px[2 + r][mx + c] = "#F4F1C8")),
    );
  }
  if (theme.sun) {
    const sx = width - 8;
    const sy = 2;
    [".SSS.", "SSSSS", "SSSSS", ".SSS."].forEach((row, r) =>
      [...row].forEach((ch, c) => ch === "S" && sy + r < PIXEL_H && (px[sy + r][sx + c] = theme.sun)),
    );
  }
  if (theme.cloud) {
    const span = width + 12;
    for (const [offset, y] of [[0, 3], [span / 2, 7]]) {
      const cx = Math.floor((frame / 3 + offset) % span) - 8;
      [".CCC..", "CCCCCC"].forEach((row, r) =>
        [...row].forEach((ch, c) => {
          const x = cx + c;
          if (ch === "C" && x >= 0 && x < width) px[y + r][x] = theme.cloud;
        }),
      );
    }
  }
  if (theme.fireworks) {
    const bursts = [
      [6, 5, 0],
      [Math.floor(width / 2), 3, 4],
      [width - 12, 6, 8],
    ];
    for (const [bx, by, delay] of bursts) {
      const t = (state.doneTick + 12 - delay) % 12;
      if (t > 5) continue;
      const color = theme.fireworks[(bx + delay) % theme.fireworks.length];
      const r = t < 2 ? t : 2 + (t - 2) / 2;
      for (let a = 0; a < 8; a++) {
        const x = Math.round(bx + Math.cos((a * Math.PI) / 4) * r * 1.6);
        const y = Math.round(by + Math.sin((a * Math.PI) / 4) * r);
        if (x >= 0 && x < width && y >= 0 && y < HILL_TOP) px[y][x] = color;
      }
    }
  }
}

/** Rows of colored segments ({ text, fg, bg }) for the current state, plus a caption row. */
export function render(state) {
  const width = state.width;
  const theme = THEMES[state.mode];
  const px = Array.from({ length: PIXEL_H }, () => Array(width).fill(null));
  const text = Array.from({ length: PIXEL_H / 2 }, () => Array(width).fill(null));
  paintBackground(px, state, theme, width);

  const sleeping = state.mode === "sleep";
  for (const mon of state.mons) {
    const f = FRAMES[mon.name];
    const sprite = SPRITES[mon.name];
    const left = mon.dir < 0;
    const rows = sleeping ? (left ? f.asleepLeft : f.asleep) : left ? f.awakeLeft : f.awake;
    const breathe = sleeping && (state.frame + mon.phase) % 16 < 8 ? 1 : 0;
    const top = LANE_FEET[mon.lane] - rows.length - mon.hop + breathe;
    rows.forEach((row, r) =>
      [...row].forEach((ch, c) => {
        const y = top + r;
        const x = mon.x + c;
        if (ch !== "." && y >= 0 && y < PIXEL_H && x >= 0 && x < width) px[y][x] = sprite.palette[ch];
      }),
    );

    const headRow = Math.floor(top / 2) - 1;
    if (sleeping && mon.lane === 1) {
      const z = Math.floor((state.frame + mon.phase) / 5) % 3;
      const zx = mon.x + (left ? -1 - z : f.width + z - 1);
      if (headRow - z >= 0 && zx >= 0 && zx < width) text[headRow - z][zx] = { ch: z === 2 ? "Z" : "z", fg: COLORS.zzz };
    } else if (state.mode === "done" && (state.frame + mon.phase) % 4 < 2) {
      for (const sx of [mon.x - 1, mon.x + f.width]) {
        if (headRow >= 0 && sx >= 0 && sx < width) text[headRow][sx] = { ch: "*", fg: COLORS.spark };
      }
    }
  }

  const rows = [];
  for (let r = 0; r < PIXEL_H / 2; r++) {
    const segments = [];
    for (let x = 0; x < width; x++) {
      const top = px[2 * r][x];
      const bottom = px[2 * r + 1][x];
      const overlay = text[r][x];
      const cell = overlay
        ? { ch: overlay.ch, fg: overlay.fg, bg: top ?? bottom ?? undefined }
        : top && bottom
          ? { ch: "▀", fg: top, bg: bottom }
          : top
            ? { ch: "▀", fg: top }
            : bottom
              ? { ch: "▄", fg: bottom }
              : { ch: " " };
      const last = segments[segments.length - 1];
      if (last && last.fg === cell.fg && last.bg === cell.bg) last.text += cell.ch;
      else segments.push({ text: cell.ch, fg: cell.fg, bg: cell.bg });
    }
    rows.push(segments);
  }
  rows.push([{ text: CAPTIONS[state.mode], fg: COLORS.caption }]);
  return rows;
}
