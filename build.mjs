// Compiles src/tui.jsx with Solid's universal JSX for OpenTUI, like opencode-quota does.
import fs from "node:fs/promises";
import babel from "@babel/core";
import solidPreset from "babel-preset-solid";

const source = new URL("./src/tui.jsx", import.meta.url);
const out = await babel.transformAsync(await fs.readFile(source, "utf8"), {
  filename: source.pathname,
  configFile: false,
  babelrc: false,
  presets: [[solidPreset, { moduleName: "@opentui/solid", generate: "universal" }]],
});
await fs.mkdir(new URL("./dist/", import.meta.url), { recursive: true });
await fs.writeFile(new URL("./dist/tui.js", import.meta.url), `${out.code}\n`);
for (const file of ["scene.js", "sprites.js"]) {
  await fs.copyFile(new URL(`./src/${file}`, import.meta.url), new URL(`./dist/${file}`, import.meta.url));
}
