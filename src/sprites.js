// Hand-drawn pixel sprites. One letter per pixel, "." is transparent.
// `eyes` are the letters that close when a Pokemon sleeps; `skin` replaces them.

export const SPRITES = {
  pikachu: {
    skin: "Y",
    eyes: "EW",
    palette: { Y: "#F8D030", y: "#C89A18", K: "#3A2A10", E: "#1E1E1E", W: "#FFFFFF", R: "#F05050", m: "#8A5A20", B: "#A0682D" },
    rows: [
      "K.......K..",
      "YK.....KY..",
      ".YY...YY..B",
      ".YYYYYYY.YY",
      "YEWYYYEWYY.",
      "YEEYYYEEYY.",
      "RYYYmYYYRY.",
      ".YYYYYYYY..",
      ".YYYYYYYY..",
      "..yy..yy...",
    ],
  },
  charmander: {
    skin: "O",
    eyes: "EW",
    palette: { O: "#F08030", o: "#B85A18", c: "#F8D8A0", F: "#FF5722", Y: "#FFD54F", E: "#1E1E1E", W: "#FFFFFF", m: "#8B3A1A" },
    rows: [
      "..OOOO....",
      ".OOOOOO...",
      ".EWOOEWO..",
      ".EEOOEEO..",
      ".OOmmOO.Y.",
      "..OOOO.FYF",
      ".OccccO.F.",
      ".OccccOOO.",
      "..OOOO....",
      ".oO..Oo...",
    ],
  },
  squirtle: {
    skin: "B",
    eyes: "EW",
    palette: { B: "#7EC8F0", b: "#4A98C8", S: "#B5651D", c: "#F8E0A0", E: "#1E1E1E", W: "#FFFFFF", m: "#2A4A6A" },
    rows: [
      "..BBBB....",
      ".BBBBBB...",
      ".EWBBEWB..",
      ".EEBBEEB..",
      ".BBmmBB...",
      ".SccccS...",
      "BSccccSB..",
      ".SccccSBB.",
      "..SSSS..b.",
      ".bB..Bb...",
    ],
  },
  bulbasaur: {
    skin: "T",
    eyes: "EW",
    palette: { T: "#78C8A8", t: "#4E9A7E", G: "#6CCF70", g: "#2E8B3A", E: "#D03030", W: "#FFFFFF", m: "#2F5E4E" },
    rows: [
      "...gGGg...",
      "..gGgGGg..",
      ".TTgGGgTT.",
      "TTTTTTTTTT",
      "TEWTTTTEWT",
      "TEETTTTEET",
      "TTTTmmTTTT",
      ".TtTTTTtT.",
      ".TT.TT.TT.",
      ".WT....TW.",
    ],
  },
  gengar: {
    skin: "P",
    eyes: "E",
    palette: { P: "#8A63D2", p: "#5B3A9A", E: "#FF3B3B", W: "#FFFFFF" },
    rows: [
      "P..P..P..P",
      "PPPPPPPPPP",
      "PEEPPPPEEP",
      "PPEPPPPEPP",
      "PWWWWWWWWP",
      "PPWPWPWPWP",
      "pPPWWWWPPp",
      ".PPPPPPPP.",
      "PP.P..P.PP",
    ],
  },
};

/** Sleeping variant: highlights vanish and only the bottom row of each eye stays, as a closed lid. */
export function sleepingRows(sprite) {
  const { rows, eyes, skin } = sprite;
  return rows.map((row, y) =>
    [...row]
      .map((ch, x) => {
        if (!eyes.includes(ch)) return ch;
        if (ch === "W") return skin;
        const below = rows[y + 1]?.[x];
        return below && eyes.includes(below) ? skin : ch;
      })
      .join(""),
  );
}
