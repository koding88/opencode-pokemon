// Dumps the sleep / walk / done scenes as JSON and renders them to art/scene_preview.png via Python.
//   node art/preview_scene.mjs [width]
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createState, render, step } from "../src/scene.js";

const width = Number(process.argv[2] ?? 36);
let seed = 7;
const rng = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;

const s = createState();
const scenes = {};
for (let i = 0; i < 4; i++) step(s, "idle", width, rng);
scenes.sleep = render(s);
for (let i = 0; i < 14; i++) step(s, "running", width, rng);
scenes.walk = render(s);
for (let i = 0; i < 4; i++) step(s, "idle", width, rng);
scenes.done = render(s);

const json = join(tmpdir(), "scene-preview.json");
writeFileSync(json, JSON.stringify(scenes));
const out = new URL("./scene_preview.png", import.meta.url).pathname;
execFileSync("python3", [new URL("./render_cells.py", import.meta.url).pathname, json, out], { stdio: "inherit" });
