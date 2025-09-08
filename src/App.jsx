import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Balance Scale Equation Simulator — React + Tailwind (Layout v3.0)
 *
 * Major UI refresh per request:
 * 1) Two-column layout: LEFT = equation inputs; RIGHT = fixed-size Scale + Live values + Number Line.
 * 2) Scale physics fixed: heavier side goes DOWN. Linkage is now vertical (gravity) and anchored to the rotated beam via trig.
 * 3) Scale frame is FIXED size (no dynamic height). No overlap with following content.
 * 4) Visual redesign: clean cards, better spacing, classic scale silhouette.
 *
 * CSP-safe; no eval/new Function.
 */

// ---------------- helpers ----------------
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const isEqual = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;
const round1 = (n) => Math.round(n * 10) / 10;

// measure hook (for responsive widths)
function useMeasure() {
  const ref = useRef(null);
  const [rect, setRect] = useState({ width: 0, height: 0 });
  useEffect(() => {
    if (!ref.current) return;
    const obs = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setRect({ width: r.width, height: r.height });
    });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, rect];
}

// visual constants (scale frame)
const FRAME_W = 720;
const FRAME_H = 360;
const BEAM_LEN = 560;    // length of the beam
const BEAM_Y = 110;      // vertical position of beam center
const PIVOT_W = 16;      // pole width
const ROD_LEN = 110;     // vertical chain length
const BAR_H = 8;         // small bar under chain
const PAD_END = 86;      // horizontal distance from beam ends to hanger anchors
const DISC_MARGIN = 10;  // gap between bar and disc
const BASE_Y = 290;      // base top Y

// ---------------- equation shapes ----------------
const TYPES = {
  PLUS: "PLUS",   // A*x + B = C
  MINUS: "MINUS", // A*x - B = C
  TIMES: "TIMES", // A*x = C
};

function computeLHS(type, A, x, B) {
  switch (type) {
    case TYPES.PLUS: return A * x + B;
    case TYPES.MINUS: return A * x - B;
    case TYPES.TIMES: return A * x;
    default: return A * x + B;
  }
}

function lhsString(type, A, vName, x, B) {
  const Ashow = `${A}`;
  const xPart = `${vName}`;
  if (type === TYPES.PLUS) return `${Ashow}${xPart} + ${B}`;
  if (type === TYPES.MINUS) return `${Ashow}${xPart} - ${B}`;
  return `${Ashow}${xPart}`;
}

// angle mapping — IMPORTANT: diff>0 means LEFT heavier, which should tilt LEFT DOWN.
function angleFromDiff(lhs, rhs) {
  const diff = lhs - rhs; // >0 → left heavier
  // In CSS, positive angles rotate CLOCKWISE → right side down. We want left heavier → left down → NEGATIVE angle.
  return clamp((-diff / 10) * 6, -20, 20);
}

function weightSizeFromGrams(g) {
  const r = Math.sqrt(Math.max(0, g));
  return clamp(34 + r * 10, 26, 170);
}

// Compute hanger anchor (x,y) on the rotated beam given parameter t in [-0.5..0.5]
// t=-0.5: far left end; t=0.5: far right end; we use inward offset via PAD_END.
function beamAnchor(cx, cy, L, deg, t) {
  const rad = (deg * Math.PI) / 180;
  // Move anchor along the beam direction. In screen coords, y+ is downward.
  // Positive angle (clockwise) → right side down → dy should be positive on right (t>0).
  const vx = (L * t) * Math.cos(rad);
  const vy = (L * t) * Math.sin(rad); // <-- FIX: was negated; caused hangers to move opposite
  return { x: cx + vx, y: cy + vy };
};


// map from pixel size + label color
function plateVisuals(side) {
  return side === 'left'
    ? { disc: 'bg-sky-200 border-sky-400', text: 'text-sky-900' }
    : { disc: 'bg-emerald-200 border-emerald-400', text: 'text-emerald-900' };
}

// ---------------- Balance Scale (fixed frame) ----------------
function FixedScale({ lhs, rhs, unit = 'g' }) {
  const [frameRef] = useMeasure(); // width not used because frame is fixed
  const equal = isEqual(lhs, rhs);
  const angle = useMemo(() => angleFromDiff(lhs, rhs), [lhs, rhs]);

  const cx = FRAME_W / 2;
  const cy = BEAM_Y;

  // inward offsets from ends
  const tPad = (BEAM_LEN / 2 - PAD_END) / BEAM_LEN; // e.g. 0.5 - PAD_END/L
  const tLeft = -tPad;
  const tRight = tPad;

  const leftAnchor = beamAnchor(cx, cy, BEAM_LEN, angle, tLeft);
  const rightAnchor = beamAnchor(cx, cy, BEAM_LEN, angle, tRight);

  const leftSize = weightSizeFromGrams(Math.max(0, lhs));
  const rightSize = weightSizeFromGrams(Math.max(0, rhs));

  return (
    <div ref={frameRef} className="relative mx-auto bg-white/90 border border-cyan-200 rounded-2xl shadow-inner" style={{ width: FRAME_W, height: FRAME_H }}>
      {/* beam (rotated about center) */}
      <div
        className="absolute rounded bg-gradient-to-r from-sky-300 to-cyan-400 shadow"
        style={{
          width: BEAM_LEN,
          height: 10,
          left: cx - BEAM_LEN / 2,
          top: cy - 5,
          transform: `rotate(${angle}deg)`,
          transformOrigin: '50% 50%',
          transition: 'transform 240ms ease',
          zIndex: 1,
        }}
      >
        {/* end caps */}
        <div className="absolute left-0 -top-[2px] w-3 h-[14px] bg-cyan-500 rounded-r" />
        <div className="absolute right-0 -top-[2px] w-3 h-[14px] bg-cyan-500 rounded-l" />
      </div>

      {/* vertical hangers (not rotated) */}
      <HangerVisual anchor={leftAnchor} size={leftSize} grams={lhs} unit={unit} side="left" />
      <HangerVisual anchor={rightAnchor} size={rightSize} grams={rhs} unit={unit} side="right" />

      {/* central pole + base */}
      <div className="absolute bg-gray-500" style={{ left: cx - PIVOT_W / 2, top: cy, width: PIVOT_W, height: BASE_Y - cy, borderTopLeftRadius: 6, borderTopRightRadius: 6, zIndex: 0 }} />
      <div className="absolute" style={{ left: cx - 24, top: BASE_Y, width: 0, height: 0, borderLeft: '24px solid transparent', borderRight: '24px solid transparent', borderTop: '74px solid #6B7280' }} />

      {/* equal overlay */}
      <div className={`pointer-events-none absolute inset-0 flex items-center justify-center transition ${equal ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`} style={{ transitionProperty: 'opacity, transform' }}>
        <div className="flex items-center gap-3 bg-white/90 backdrop-blur px-4 py-2 rounded-2xl border border-emerald-300 shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-emerald-600"><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 0 0-1.22-.872l-3.236 4.53-1.64-1.64a.75.75 0 1 0-1.06 1.061l2.25 2.25a.75.75 0 0 0 1.145-.094l3.821-5.235Z" clipRule="evenodd"/></svg>
          <div className="text-emerald-700 font-semibold">Balanced!</div>
        </div>
      </div>
    </div>
  );
}

function HangerVisual({ anchor, size, grams, unit, side }) {
  const { disc, text } = plateVisuals(side);
  const barW = 140;
  const barX = anchor.x - barW / 2;
  const barY = anchor.y + ROD_LEN;
  const plateX = anchor.x - size / 2;
  const plateY = barY + BAR_H + DISC_MARGIN;

  return (
    <>
      {/* chain */}
      <div className="absolute" style={{ left: anchor.x - 1, top: anchor.y, width: 2, height: ROD_LEN, backgroundColor: '#374151', zIndex: 2 }} />
      {/* small bar */}
      <div className="absolute bg-gray-500 rounded" style={{ left: barX, top: barY, width: barW, height: BAR_H, zIndex: 2 }} />
      {/* plate */}
      <div className="absolute flex items-center justify-center" style={{ left: plateX, top: plateY, width: size, height: size, zIndex: 2 }}>
        <div className={`w-full h-full rounded-full ${disc} border-2 shadow`} />
        <div className={`absolute inset-0 flex items-center justify-center ${text} text-sm font-semibold select-none`}>{round1(grams)} {unit}</div>
      </div>
    </>
  );
}

// ---------------- LEFT: inputs ----------------
function NumberBox({ value, onChange, min = -100, max = 100, step = 1, width = "5rem" }) {
  return (
    <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} min={min} max={max} step={step} className="text-center text-base md:text-lg font-semibold bg-white border border-cyan-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 px-3 py-2" style={{ width }} />
  );
}

function VarBox({ value, onChange, width = "3.5rem" }) {
  return (
    <input value={value} onChange={(e) => onChange((e.target.value || 'x').slice(0, 1))} maxLength={1} className="text-center text-base md:text-lg font-semibold bg-white border border-cyan-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 px-3 py-2" style={{ width }} />
  );
}

function TypeSwitcher({ type, setType }) {
  const btn = (key, label) => (
    <button key={key} onClick={() => setType(key)} className={`px-3 py-1.5 rounded-xl text-sm font-medium border ${type === key ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-white border-cyan-200 text-cyan-800 hover:bg-cyan-50'}`}>{label}</button>
  );
  return (
    <div className="flex flex-wrap gap-2" role="tablist">
      {btn(TYPES.PLUS, 'Type 1: +')}
      {btn(TYPES.MINUS, 'Type 2: −')}
      {btn(TYPES.TIMES, 'Type 3: ×')}
    </div>
  );
}

function PrettyEquationRow({ type, A, setA, B, setB, C, setC, vName, setVName }) {
  return (
    <div className="w-full items-center justify-center gap-3 md:gap-4 flex-wrap">
      <NumberBox value={A} onChange={setA} min={-20} max={40} width="3.5rem" />
      <span className="text-2xl font-bold text-cyan-900">×</span>
      <VarBox value={vName} onChange={setVName} />
      {type !== TYPES.TIMES && (<span className="text-2xl font-bold text-cyan-900">{type === TYPES.PLUS ? '+' : '−'}</span>)}
      {type !== TYPES.TIMES && (<NumberBox value={B} onChange={setB} min={0} max={200} width="4.5rem" />)}
      <span className="text-2xl font-bold text-cyan-900">=</span>
      <NumberBox value={C} onChange={setC} min={-200} max={400} width="4.5rem" />
    </div>
  );
}

// ---------------- RIGHT: Number Line ----------------
function NumberLine({ min, max, step = 1, value, onChange, label }) {
  const [ref, rect] = useMeasure();
  const width = clamp(rect.width - 24, 460, 1200);
  const height = 84;
  const pct = (value - min) / (max - min);
  const xPos = clamp(pct * width, 0, width);
  const tickEvery = Math.max(step, Math.round((max - min) / 20));
  const labelEvery = Math.max(tickEvery * 2, 2);

  const setFromClientX = (clientX) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const x = clamp(clientX - r.left, 0, r.width);
    const raw = min + (x / r.width) * (max - min);
    const snapped = Math.round(raw / step) * step;
    onChange(clamp(snapped, min, max));
  };

  useEffect(() => {
    const move = (e) => { if (!window.__nlDragging) return; const clientX = (e.touches?.[0]?.clientX) ?? e.clientX; setFromClientX(clientX); };
    const up = () => { window.__nlDragging = false; };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); window.removeEventListener('touchmove', move); window.removeEventListener('touchend', up); };
  }, []);

  return (
    <div ref={ref} className="w-full mx-auto select-none">
      {label && <div className="text-sm text-cyan-800 mb-2">{label}</div>}
      <div className="relative" style={{ width: `${width}px`, height: `${height}px` }} onMouseDown={(e) => { window.__nlDragging = true; setFromClientX(e.clientX); }} onTouchStart={(e) => { window.__nlDragging = true; setFromClientX(e.touches[0].clientX); }}>
        {/* axis */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-cyan-400" />
        {/* ticks */}
        {Array.from({ length: Math.floor((max - min) / tickEvery) + 1 }).map((_, i) => {
          const v = min + i * tickEvery;
          const x = ((v - min) / (max - min)) * width;
          return (
            <div key={v} className="absolute" style={{ left: x - 1, top: height / 2 - 12 }}>
              <div className="w-[2px] h-6 bg-cyan-500" />
              {(v - min) % labelEvery === 0 && (<div className="text-[10px] text-cyan-800 text-center translate-x-[-50%] mt-0.5">{v}</div>)}
            </div>
          );
        })}
        {/* handle */}
        <div role="slider" aria-valuemin={min} aria-valuemax={max} aria-valuenow={value} tabIndex={0} onKeyDown={(e) => { if (e.key === 'ArrowLeft') onChange(clamp(value - step, min, max)); if (e.key === 'ArrowRight') onChange(clamp(value + step, min, max)); }} className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-white border-2 border-cyan-500 shadow-lg flex items-center justify-center text-cyan-700 font-bold cursor-pointer" style={{ left: xPos }} onMouseDown={(e) => { e.stopPropagation(); window.__nlDragging = true; }} onTouchStart={(e) => { e.stopPropagation(); window.__nlDragging = true; }}>●</div>
      </div>
      <div className="mt-1 text-2xl text-cyan-700 flex justify-between" style={{ width: `${width}px` }}>
        <span>min: {min}</span><span>value: {value}</span><span>max: {max}</span>
      </div>
    </div>
  );
}

// ---------------- Page ----------------
export default function App() {
  const [type, setType] = useState(TYPES.PLUS);
  const [A, setA] = useState(1);
  const [B, setB] = useState(12);
  const [C, setC] = useState(30);
  const [vName, setVName] = useState('c');
  const [x, setX] = useState(18);

  const lhs = computeLHS(type, A, x, B);
  const rhs = C;

  const presets = [
    { label: 'c + 12 = 30', type: TYPES.PLUS, A: 1, B: 12, C: 30, vName: 'c', x: 18 },
    { label: '5b = 20',     type: TYPES.TIMES, A: 5, B: 0,  C: 20, vName: 'b', x: 4 },
    { label: '2x + 13 = 21',type: TYPES.PLUS, A: 2, B: 13, C: 21, vName: 'x', x: 4 },
  ];

  const applyPreset = (p) => { setType(p.type); setA(p.A); setB(p.B ?? 0); setC(p.C); setVName(p.vName); setX(p.x); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-cyan-50 to-white p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT */}
          <aside className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl bg-white/90 backdrop-blur border border-cyan-200 p-4">
              <h2 className="text-lg font-bold text-cyan-900 mb-2">Equation Type</h2>
              <TypeSwitcher type={type} setType={setType} />
              <div className="mt-4" />
              <PrettyEquationRow type={type} A={A} setA={setA} B={B} setB={setB} C={C} setC={setC} vName={vName} setVName={setVName} />
              <p className="text-xs text-cyan-700 mt-2">Edit A/B/C or the variable letter. Right panel updates instantly.</p>
            </div>
            <div className="rounded-2xl bg-white/90 backdrop-blur border border-cyan-200 p-4">
              <h2 className="text-lg font-bold text-cyan-900 mb-2">Presets</h2>
              <div className="flex flex-wrap gap-2">
                {presets.map((p) => (
                  <button key={p.label} onClick={() => applyPreset(p)} className="px-3 py-1.5 rounded-xl text-sm bg-cyan-600 text-white hover:bg-cyan-700">{p.label}</button>
                ))}
              </div>
            </div>
          </aside>

          {/* RIGHT */}
          <main className="lg:col-span-8 space-y-4">
            <div className="rounded-2xl bg-white/90 backdrop-blur border border-cyan-200 p-6">
              <FixedScale lhs={lhs} rhs={rhs} />
              <div className="mt-4 rounded-xl bg-cyan-50/60 border border-cyan-200 p-3">
                <div className="text-xl font-semibold text-cyan-800 mb-1">Live values</div>
                <div className="flex flex-col md:flex-row md:items-center md:gap-10 text-xl text-gray-800">
                  <div>with {vName} = <span className="font-semibold">{x}</span> , LHS = <span className="font-semibold">{lhsString(type, A, vName, x, B)}</span> = <span className="font-semibold">{round1(lhs)} g</span></div>
                  <div>RHS = <span className="font-semibold">{C} g</span></div>
                  {/* <div>Diff (L − R) = <span className={`font-semibold ${lhs > rhs ? 'text-rose-700' : lhs < rhs ? 'text-indigo-700' : 'text-emerald-700'}`}>{round1(lhs - rhs)} g</span></div> */}
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-white/90 backdrop-blur border border-cyan-200 p-6">
              <NumberLine min={-10} max={40} step={1} value={x} onChange={setX} label={`Number line for ${vName}`} />
            </div>
          </main>
        </div>

      </div>
    </div>
  );
}

