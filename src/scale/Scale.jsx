import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { GROUP_BAG, GROUP_CUBE, UNIT, layoutItems, panItems, sideExpr, sideWeight } from "./model.js";

/*
 * Balance scale drawn in SVG.
 *
 * Why it now feels smooth: the beam angle is driven by a damped spring that
 * runs in requestAnimationFrame and writes the SVG transforms directly (no
 * React re-render per frame). The pans are positioned from the *animated*
 * angle every frame, so beam, strings and pans always move together (the old
 * version CSS-animated the beam while the hangers jumped). Pans also get a
 * small pendulum swing from the beam's angular velocity.
 */

const VB_W = 900;
const VB_H = 480;
const PX = 450; // pivot
const PY = 150;
const ARM = 262; // pivot → hook
const STRING = 132; // hook → pan rim
const PAN_HALF = 108;
const MAX_DEG = 14;

function reducedMotion() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/* ---------------- items ---------------- */

function Cube({ group }) {
  const c = group >= 0 ? GROUP_CUBE[group % GROUP_CUBE.length] : "#f59e0b";
  return (
    <g>
      <rect x={-10} y={-20} width={20} height={20} rx={3.5} fill={c} stroke="rgba(0,0,0,.35)" strokeWidth={1} />
      <rect x={-7} y={-17.5} width={14} height={4} rx={2} fill="#fff" opacity={0.35} />
    </g>
  );
}

function Crate() {
  return (
    <g>
      <rect x={-23} y={-26} width={46} height={26} rx={4} fill="#d97706" stroke="rgba(0,0,0,.4)" />
      <line x1={-23} y1={-13} x2={23} y2={-13} stroke="rgba(0,0,0,.18)" />
      <text x={0} y={-8.5} textAnchor="middle" fontSize={14} fontWeight={800} fill="#fff7e6">
        10
      </text>
    </g>
  );
}

function Bag({ group, letter, tag }) {
  const c = group >= 0 ? GROUP_BAG[group % GROUP_BAG.length] : "#7c5cff";
  return (
    <g>
      <path d="M-21 -4 Q-26 -28 -10 -40 L10 -40 Q26 -28 21 -4 Q0 4 -21 -4 Z" fill={c} stroke="rgba(0,0,0,.4)" />
      <path d="M-14 -30 Q-17 -18 -15 -8" stroke="#fff" strokeOpacity={0.25} strokeWidth={3} fill="none" strokeLinecap="round" />
      <path d="M-8 -39 L-12 -49 L-3 -44 L0 -50 L3 -44 L12 -49 L8 -39 Z" fill={c} stroke="rgba(0,0,0,.4)" />
      <rect x={-10} y={-42} width={20} height={4.5} rx={2} fill="#fbbf24" />
      <text x={0} y={tag != null ? -20 : -14} textAnchor="middle" fontSize={20} fontWeight={800} fontStyle="italic" fill="#fff">
        {letter}
      </text>
      {tag != null && (
        <text x={0} y={-7} textAnchor="middle" fontSize={11} fontWeight={700} fill="#ede9fe">
          {tag}
        </text>
      )}
    </g>
  );
}

function Item({ item, letter, tag }) {
  if (item.kind === "bag") return <Bag group={item.group} letter={letter} tag={tag} />;
  if (item.kind === "ten") return <Crate />;
  return <Cube group={item.group} />;
}

/** Items on one pan, with grow-in and float-away animations. */
function PanItems({ items, letter, tag }) {
  const pos = useMemo(() => layoutItems(items), [items]);
  const lastPos = useRef(pos);
  const prev = useRef(items);
  const timers = useRef([]);
  const [leaving, setLeaving] = useState([]);

  useLayoutEffect(() => {
    const now = new Set(items.map((i) => i.key));
    const gone = prev.current.filter((i) => !now.has(i.key)).map((i) => ({ item: i, p: lastPos.current[i.key] }));
    prev.current = items;
    lastPos.current = pos;
    if (gone.length) {
      setLeaving((l) => [...l.filter((g) => !now.has(g.item.key)), ...gone]);
      const t = setTimeout(() => setLeaving((l) => l.filter((g) => !gone.includes(g))), 480);
      timers.current.push(t);
    } else {
      setLeaving((l) => (l.some((g) => now.has(g.item.key)) ? l.filter((g) => !now.has(g.item.key)) : l));
    }
  }, [items, pos]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  return (
    <>
      {items.map((it) => {
        const p = pos[it.key];
        return (
          <g key={it.key} className="pan-item" style={{ transform: `translate(${p.x}px, ${p.y}px)` }}>
            <g className="item-in">
              <Item item={it} letter={letter} tag={tag} />
            </g>
          </g>
        );
      })}
      {leaving.map(({ item, p }) =>
        p ? (
          <g key={`out-${item.key}`} style={{ transform: `translate(${p.x}px, ${p.y}px)` }}>
            <g className="item-out">
              <Item item={item} letter={letter} tag={tag} />
            </g>
          </g>
        ) : null
      )}
    </>
  );
}

function Balloons({ count, dir }) {
  if (!count) return null;
  const big = Math.floor(count / 10);
  const small = count % 10;
  const list = [...Array.from({ length: big }, () => 17), ...Array.from({ length: small }, () => 11)];
  const tie = { x: dir * 70, y: STRING };
  return (
    <g className="balloons">
      {list.map((r, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const x = dir * (100 - col * 27);
        const y = -36 - row * 30 + (col % 2) * 8;
        return (
          <g key={i}>
            <path d={`M${x} ${y + r} Q${(x + tie.x) / 2 + dir * 8} ${(y + tie.y) / 2} ${tie.x} ${tie.y}`} stroke="#f9a8d4" strokeOpacity={0.6} fill="none" />
            <g className="bob" style={{ animationDelay: `${(i % 4) * 0.4}s` }}>
              <circle cx={x} cy={y} r={r} fill="#f472b6" stroke="#9d174d" strokeOpacity={0.5} />
              <circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.25} fill="#fff" opacity={0.45} />
              <text x={x} y={y + 3.5} textAnchor="middle" fontSize={r > 12 ? 11 : 8.5} fontWeight={800} fill="#fff">
                {r > 12 ? "−10" : "−1"}
              </text>
            </g>
          </g>
        );
      })}
    </g>
  );
}

function Pan({ panRef, items, balloons, dir, letter, tag, caption, accent }) {
  return (
    <g ref={panRef}>
      <circle cx={0} cy={0} r={5} fill="#fbbf24" />
      <path d={`M0 0 L${-PAN_HALF + 14} ${STRING} M0 0 L${PAN_HALF - 14} ${STRING}`} stroke="#c7d2fe" strokeOpacity={0.8} strokeWidth={2} />
      <Balloons count={balloons} dir={dir} />
      <path d={`M${-PAN_HALF} ${STRING} Q0 ${STRING + 46} ${PAN_HALF} ${STRING} Z`} fill="url(#panGrad)" stroke="#e0e7ff" strokeOpacity={0.6} />
      <line x1={-PAN_HALF} y1={STRING} x2={PAN_HALF} y2={STRING} stroke="#eef2ff" strokeWidth={3.5} strokeLinecap="round" />
      <g transform={`translate(0 ${STRING - 1.5})`}>
        <PanItems items={items} letter={letter} tag={tag} />
      </g>
      {caption && (
        <g transform={`translate(0 ${STRING + 58})`}>
          <rect x={-caption.length * 5.4 - 16} y={-17} width={caption.length * 10.8 + 32} height={32} rx={16} fill="#0e1430" stroke={accent} strokeOpacity={0.8} />
          <text x={0} y={5} textAnchor="middle" fontSize={17} fontWeight={700} fill="#e8ecff">
            {caption}
          </text>
        </g>
      )}
    </g>
  );
}

/* ---------------- scale ---------------- */

/**
 * @param left/right  { bags, units, balloons, groups }
 * @param x           weight of one bag (drives the tilt)
 * @param tag         text under the bag letter ("?" or a number), or null
 * @param locked      hold the beam level (before a test)
 */
export default function Scale({
  left,
  right,
  x = 0,
  letter = "x",
  tag = null,
  locked = false,
  leftCaption,
  rightCaption,
  status,
  className = "",
}) {
  const lw = sideWeight(left, x);
  const rw = sideWeight(right, x);
  const diff = lw - rw;
  const balanced = Math.abs(diff) < 1e-9;
  const target = locked ? 0 : -MAX_DEG * Math.tanh(diff / 4);

  const beamRef = useRef(null);
  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const targetRef = useRef(target);
  targetRef.current = target;
  const sim = useRef({ a: target, v: 0, s: 0, sv: 0 });
  const raf = useRef(0);

  const apply = () => {
    const { a, s } = sim.current;
    const r = (a * Math.PI) / 180;
    const cx = Math.cos(r) * ARM;
    const cy = Math.sin(r) * ARM;
    beamRef.current?.setAttribute("transform", `rotate(${a.toFixed(3)} ${PX} ${PY})`);
    leftRef.current?.setAttribute("transform", `translate(${(PX - cx).toFixed(2)} ${(PY - cy).toFixed(2)}) rotate(${s.toFixed(3)})`);
    rightRef.current?.setAttribute("transform", `translate(${(PX + cx).toFixed(2)} ${(PY + cy).toFixed(2)}) rotate(${s.toFixed(3)})`);
  };

  useLayoutEffect(() => {
    apply();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (raf.current) return;
    if (reducedMotion()) {
      sim.current = { a: targetRef.current, v: 0, s: 0, sv: 0 };
      apply();
      return;
    }
    let last = performance.now();
    const H = 1 / 240; // fixed physics step: same motion at 30 fps or 120 fps
    const tick = (now) => {
      let dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const st = sim.current;
      const tgt = targetRef.current;
      while (dt > 0) {
        const h = Math.min(H, dt);
        dt -= h;
        // beam: slightly under-damped spring → gentle settle with a tiny overshoot
        const acc = -38 * (st.a - tgt) - 8.5 * st.v;
        st.v += acc * h;
        st.a += st.v * h;
        // pans: pendulum swing pushed by the beam's motion
        const swingTarget = Math.max(-7, Math.min(7, -st.v * 0.18));
        const sacc = -55 * (st.s - swingTarget) - 5 * st.sv;
        st.sv += sacc * h;
        st.s += st.sv * h;
      }
      apply();
      const settled = Math.abs(st.a - tgt) < 0.003 && Math.abs(st.v) < 0.01 && Math.abs(st.s) < 0.01 && Math.abs(st.sv) < 0.02;
      if (settled) {
        st.a = tgt;
        st.v = 0;
        st.s = 0;
        st.sv = 0;
        apply();
        raf.current = 0;
        return;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  useEffect(
    () => () => {
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    },
    []
  );

  const leftItems = useMemo(() => panItems("L", left), [left]);
  const rightItems = useMemo(() => panItems("R", right), [right]);

  const lc = leftCaption ?? (left.bags ? sideExpr(left, letter) : `${lw} ${UNIT}`);
  const rc = rightCaption ?? (right.bags ? sideExpr(right, letter) : `${rw} ${UNIT}`);

  const st =
    status ??
    (locked
      ? { text: "Locked: Cubby is holding the beam", tone: "muted" }
      : balanced
        ? { text: "Balanced", tone: "good" }
        : { text: diff > 0 ? "Left side is heavier" : "Right side is heavier", tone: "warn" });
  const tone = { good: ["#0f3a26", "#4ade80", "#bbf7d0"], warn: ["#3a2606", "#fbbf24", "#fde68a"], muted: ["#161e3d", "#6b7bc4", "#c7d2fe"] }[st.tone];

  return (
    <svg
      viewBox={`45 0 ${VB_W - 90} ${VB_H}`}
      className={`block h-auto w-full select-none ${className}`}
      role="img"
      aria-label={`Balance scale. Left: ${lc}. Right: ${rc}. ${st.text}.`}
    >
      <defs>
        <linearGradient id="beamGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#c7d2fe" />
          <stop offset="0.45" stopColor="#7d97ff" />
          <stop offset="1" stopColor="#3f5ee8" />
        </linearGradient>
        <linearGradient id="pillarGrad" x1="0" x2="1">
          <stop offset="0" stopColor="#25306c" />
          <stop offset="0.5" stopColor="#4a5bb0" />
          <stop offset="1" stopColor="#25306c" />
        </linearGradient>
        <linearGradient id="panGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#c7d2fe" stopOpacity={0.9} />
          <stop offset="1" stopColor="#5b6fd6" stopOpacity={0.9} />
        </linearGradient>
        <radialGradient id="floorGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#6d8bff" stopOpacity={0.22} />
          <stop offset="1" stopColor="#6d8bff" stopOpacity={0} />
        </radialGradient>
      </defs>

      {/* floor */}
      <ellipse cx={PX} cy={VB_H - 16} rx={400} ry={26} fill="url(#floorGlow)" />

      {/* status */}
      <g transform={`translate(${PX} 34)`}>
        <rect x={-st.text.length * 5 - 22} y={-17} width={st.text.length * 10 + 44} height={34} rx={17} fill={tone[0]} stroke={tone[1]} />
        <text x={0} y={6} textAnchor="middle" fontSize={17} fontWeight={800} fill={tone[2]}>
          {st.tone === "good" ? "✓ " : ""}
          {st.text}
        </text>
      </g>

      {/* dial */}
      <g opacity={0.9}>
        <path d={`M${PX - 50} ${PY - 50} A 70.7 70.7 0 0 1 ${PX + 50} ${PY - 50}`} stroke="#33418c" strokeWidth={8} fill="none" strokeLinecap="round" />
        {[-20, -10, 0, 10, 20].map((d) => {
          const r = ((d - 90) * Math.PI) / 180;
          return (
            <line
              key={d}
              x1={PX + Math.cos(r) * 63}
              y1={PY + Math.sin(r) * 63}
              x2={PX + Math.cos(r) * 78}
              y2={PY + Math.sin(r) * 78}
              stroke={d === 0 ? (balanced && !locked ? "#4ade80" : "#e8ecff") : "#6b7bc4"}
              strokeWidth={d === 0 ? 3.5 : 2}
              strokeLinecap="round"
            />
          );
        })}
      </g>

      {/* pillar + base */}
      <rect x={PX - 10} y={PY} width={20} height={VB_H - 44 - PY} rx={4} fill="url(#pillarGrad)" />
      <path
        d={`M${PX - 62} ${VB_H - 46} L${PX + 62} ${VB_H - 46} L${PX + 118} ${VB_H - 18} Q${PX + 122} ${VB_H - 12} ${PX + 114} ${VB_H - 12} L${PX - 114} ${VB_H - 12} Q${PX - 122} ${VB_H - 12} ${PX - 118} ${VB_H - 18} Z`}
        fill="#24306a"
        stroke="#4a5bb0"
      />

      {/* pans (positioned every frame) */}
      <Pan panRef={leftRef} items={leftItems} balloons={left.balloons || 0} dir={-1} letter={letter} tag={tag} caption={lc} accent="#7d97ff" />
      <Pan panRef={rightRef} items={rightItems} balloons={right.balloons || 0} dir={1} letter={letter} tag={tag} caption={rc} accent="#7d97ff" />

      {/* beam (rotated every frame) */}
      <g ref={beamRef}>
        <line x1={PX} y1={PY} x2={PX} y2={PY - 66} stroke="#fbbf24" strokeWidth={3.5} strokeLinecap="round" />
        <circle cx={PX} cy={PY - 68} r={5} fill="#fbbf24" />
        <rect x={PX - ARM - 22} y={PY - 8} width={2 * ARM + 44} height={16} rx={8} fill="url(#beamGrad)" stroke="#1d2763" strokeOpacity={0.6} />
        <circle cx={PX - ARM} cy={PY} r={7} fill="#fbbf24" stroke="#92400e" strokeOpacity={0.5} />
        <circle cx={PX + ARM} cy={PY} r={7} fill="#fbbf24" stroke="#92400e" strokeOpacity={0.5} />
      </g>
      <circle cx={PX} cy={PY} r={17} fill="#1d2763" stroke="#9fb3ff" strokeWidth={2} />
      <circle cx={PX} cy={PY} r={5.5} fill="#fbbf24" />

      {locked && (
        <g transform={`translate(${PX} ${PY + 44})`}>
          <path d="M-7 -6 V-11 A7 7 0 0 1 7 -11 V-6" stroke="#c7d2fe" strokeWidth={3} fill="none" />
          <rect x={-11} y={-7} width={22} height={17} rx={3} fill="#c7d2fe" />
          <circle cx={0} cy={1.5} r={2.5} fill="#1d2763" />
        </g>
      )}
    </svg>
  );
}
