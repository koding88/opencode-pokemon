// Standalone preview of the CR7 idea (not used by the plugin yet).
//   node preview-cr7.mjs           -> animated, colored, loops through every phase
//   node preview-cr7.mjs --static  -> prints the key frames once, no color

const W = 36;
const H = 8; // bubble row, 6 player rows, ground
const C = {
  hair: "#6D4C41",
  skin: "#E0AC69",
  shirt: "#E53935",
  number: "#FFD54F",
  shorts: "#43A047",
  boots: "#FAFAFA",
  ball: "#FFFFFF",
  goal: "#BDBDBD",
  net: "#5A5A5A",
  ground: "#3A3A3A",
  shout: "#FFD54F",
  caption: "#8A8A8A",
};

// Player sprites: 6 rows, colored by row (hair, face, shirt+arms, shorts, legs, feet).
const POSES = {
  idle: ["  ___  ", " (o_o) ", "_/|7|\\_", "  |__| ", "  /  \\ ", "_/    \\_"],
  runA: ["  ___  ", " (o_o) ", " /|7|\\ ", "  |__| ", "  /  \\ ", " /    >"],
  runB: ["  ___  ", " (o_o) ", " \\|7|/ ", "  |__| ", "   /|  ", "  / |_ "],
  kick: ["  ___  ", " (o_o) ", " /|7|\\ ", "  |__| ", "  /  \\__", " /      "],
  jump: ["  ___  ", " (^o^) ", "--|7|--", "  |__| ", "  /  \\ ", "       "],
  siuu: ["  ___   ", " (>o<)  ", " /|7|\\  ", "/ |__| \\", "  /  \\  ", " /    \\ "],
};
const GOAL = [" _____ ", "|:::::|", "|:::::|", "|:::::|"];
const ROW_COLOR = [C.hair, C.skin, C.shirt, C.shorts, C.skin, C.boots];

function blank() {
  return Array.from({ length: H }, () => Array.from({ length: W }, () => null));
}
function put(grid, r, c, ch, fg) {
  if (r >= 0 && r < H && c >= 0 && c < W && ch !== " ") grid[r][c] = { ch, fg };
}
function text(grid, r, c, s, fg) {
  [...s].forEach((ch, i) => put(grid, r, c + i, ch, fg));
}
function player(grid, pose, x, lift = 0) {
  POSES[pose].forEach((row, r) =>
    [...row].forEach((ch, c) => {
      let fg = ROW_COLOR[r];
      if (r === 2 && ch === "7") fg = C.number;
      else if (r === 2 && (ch === "/" || ch === "\\" || ch === "_" || ch === "-")) fg = C.skin;
      else if (r === 3 && (ch === "/" || ch === "\\")) fg = C.skin;
      put(grid, 1 + r - lift, x + c, ch, fg);
    }),
  );
}
function goal(grid) {
  GOAL.forEach((row, r) =>
    [...row].forEach((ch, c) => put(grid, 3 + r, W - GOAL[0].length + c, ch, ch === ":" ? C.net : C.goal)),
  );
}
function ground(grid) {
  for (let c = 0; c < W; c++) put(grid, H - 1, c, "·", C.ground);
}

// One scene per tick. Returns { grid, caption }.
function scene(phase, t) {
  const g = blank();
  ground(g);
  if (phase === "idle") {
    player(g, "idle", 3);
    return { grid: g, caption: "CR7 đang chờ" };
  }
  if (phase === "run") {
    const span = W - 12;
    const p = t % (span * 2);
    const x = p < span ? p : span * 2 - p; // dribble back and forth
    const pose = t % 2 ? "runA" : "runB";
    player(g, pose, x);
    put(g, 6, x + 8 + (t % 2), "o", C.ball);
    return { grid: g, caption: "CR7 đang dẫn bóng" };
  }
  // "done": shot -> goal -> SIUUU jump -> land
  goal(g);
  const goalX = W - GOAL[0].length;
  if (t < 3) {
    player(g, "runA", 3 + t);
    put(g, 6, 11 + t, "o", C.ball);
    return { grid: g, caption: "CR7 sút..." };
  }
  if (t < 12) {
    player(g, "kick", 6);
    const bx = 14 + (t - 3) * 2;
    const by = 5 - Math.min(2, Math.floor((t - 3) / 3));
    if (bx < goalX + 3) put(g, by, bx, "o", C.ball);
    return { grid: g, caption: "CR7 sút..." };
  }
  if (t < 18) {
    player(g, "kick", 6);
    put(g, 4, goalX + 3, "o", C.ball);
    if (t % 2 === 0) text(g, 0, 10, "GOOOOAL!", C.shout);
    return { grid: g, caption: "VÀOOO!" };
  }
  if (t < 24) {
    player(g, "jump", 10, t % 2 ? 1 : 0);
    put(g, 4, goalX + 3, "o", C.ball);
    text(g, 0, 17, "SIIIUUU", C.shout);
    return { grid: g, caption: "SIUUU!" };
  }
  player(g, "siuu", 10);
  put(g, 4, goalX + 3, "o", C.ball);
  text(g, 0, 6, "SIUUUUUUU!", C.shout);
  return { grid: g, caption: "SIUUUUU!" };
}

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).join(";");
function draw({ grid, caption }, color) {
  const lines = grid.map((row) =>
    row.map((cell) => (cell ? (color ? `\x1b[38;2;${hex(cell.fg)}m${cell.ch}\x1b[0m` : cell.ch) : " ")).join(""),
  );
  lines.push(color ? `\x1b[38;2;${hex(C.caption)}m${caption}\x1b[0m` : caption);
  return lines.join("\n");
}

if (process.argv.includes("--static")) {
  const frames = [
    ["Agent rảnh: đứng chờ", "idle", 0],
    ["Agent chạy: dẫn bóng (nhịp 1)", "run", 4],
    ["Agent chạy: dẫn bóng (nhịp 2)", "run", 5],
    ["Xong: sút", "done", 7],
    ["Xong: vào lưới", "done", 14],
    ["Xong: bật nhảy SIUUU", "done", 21],
    ["Xong: tiếp đất SIUUU", "done", 26],
  ];
  for (const [label, phase, t] of frames) console.log(`--- ${label}\n${draw(scene(phase, t), false)}\n`);
} else {
  const plan = [
    ["idle", 20],
    ["run", 60],
    ["done", 34],
  ];
  let i = 0;
  let t = 0;
  process.stdout.write("\x1b[?25l");
  process.on("SIGINT", () => {
    process.stdout.write("\x1b[?25h\n");
    process.exit(0);
  });
  setInterval(() => {
    const [phase, len] = plan[i];
    process.stdout.write(`\x1b[2J\x1b[H${draw(scene(phase, t), true)}\n\n(Ctrl+C để thoát)`);
    if (++t >= len) {
      t = 0;
      i = (i + 1) % plan.length;
    }
  }, 150);
}
