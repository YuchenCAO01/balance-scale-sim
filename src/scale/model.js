/* Pan contents → drawable items, and small equation helpers. */

export const UNIT = "kg";

/** "1x" → "x", "3x" → "3x" (the old app printed "1c + 12"). */
export function term(a, v) {
  if (a === 0) return "0";
  if (a === 1) return v;
  return `${a}${v}`;
}

/** Side expression, e.g. side(2, 3, "x") → "2x + 3"; side(0, 8) → "8". */
export function sideExpr({ bags = 0, units = 0, balloons = 0 }, v = "x") {
  const parts = [];
  if (bags) parts.push(term(bags, v));
  let s = parts.join("");
  if (units) s = s ? `${s} + ${units}` : String(units);
  if (balloons) s = s ? `${s} − ${balloons}` : `−${balloons}`;
  return s || "0";
}

export function sideWeight({ bags = 0, units = 0, balloons = 0 }, x) {
  return bags * x + units - balloons;
}

export const GROUP_CUBE = ["#f59e0b", "#22c55e", "#ec4899", "#38bdf8", "#a78bfa"];
export const GROUP_BAG = ["#7c5cff", "#16a34a", "#db2777", "#0284c7", "#9333ea"];

/**
 * Build the item list for one pan.
 *  side: { bags, units, balloons, groups? }  groups = split both into n coloured shares
 *  Small amounts are drawn as individual 1 kg cubes; big amounts use 10 kg crates.
 */
export function panItems(prefix, side) {
  const { bags = 0, units = 0, groups = 0 } = side;
  const items = [];
  const g = (i, n) => (groups ? Math.floor((i * groups) / n) : -1);
  for (let i = 0; i < bags; i++) items.push({ key: `${prefix}b${i}`, kind: "bag", group: g(i, bags) });
  if (units <= 24 || groups) {
    for (let i = 0; i < units; i++) items.push({ key: `${prefix}u${i}`, kind: "unit", group: g(i, units) });
  } else {
    const tens = Math.floor(units / 10);
    for (let i = 0; i < tens; i++) items.push({ key: `${prefix}t${i}`, kind: "ten", group: -1 });
    for (let i = 0; i < units % 10; i++) items.push({ key: `${prefix}u${i}`, kind: "unit", group: -1 });
  }
  const order = { bag: 0, ten: 1, unit: 2 };
  if (groups) items.sort((a, b) => a.group - b.group || order[a.kind] - order[b.kind]);
  return items;
}

export const SIZES = {
  bag: { w: 46, h: 52 },
  ten: { w: 46, h: 26 },
  unit: { w: 20, h: 20 },
};

/** Flow layout: rows of items, centred, stacked upwards from y = 0. */
export function layoutItems(items, maxW = 196, gap = 4) {
  const rows = [];
  let row = [];
  let rowW = 0;
  for (const it of items) {
    const { w } = SIZES[it.kind];
    if (row.length && rowW + gap + w > maxW) {
      rows.push(row);
      row = [];
      rowW = 0;
    }
    rowW += (row.length ? gap : 0) + w;
    row.push(it);
  }
  if (row.length) rows.push(row);

  const pos = {};
  let y = 0;
  for (const r of rows) {
    const width = r.reduce((s, it) => s + SIZES[it.kind].w, 0) + gap * (r.length - 1);
    const h = Math.max(...r.map((it) => SIZES[it.kind].h));
    let x = -width / 2;
    for (const it of r) {
      const { w } = SIZES[it.kind];
      pos[it.key] = { x: x + w / 2, y };
      x += w + gap;
    }
    y -= h + gap;
  }
  return pos;
}
