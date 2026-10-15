import { useRef } from "react";

/**
 * Number-line slider for the value of the variable.
 * Pointer events with capture (mouse, touch and pen), arrow keys, and a
 * CSS-transitioned handle so it glides instead of jumping.
 */
export default function NumberLine({ min = 0, max = 40, value, onChange, letter = "x", solution }) {
  const trackRef = useRef(null);
  const dragging = useRef(false);
  const span = max - min;
  const pct = (v) => ((v - min) / span) * 100;
  const major = span > 40 ? 10 : 5;

  const fromEvent = (e) => {
    const r = trackRef.current.getBoundingClientRect();
    const t = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const v = Math.round(min + t * span);
    if (v !== value) onChange(v);
  };

  return (
    <div className="select-none">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-300">
          Drag to choose the value of <i className="font-bold text-violet-200">{letter}</i>
        </span>
        <div className="flex items-center gap-1.5">
          <button type="button" className="step-btn" aria-label="decrease value" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}>
            −
          </button>
          <span className="min-w-20 whitespace-nowrap text-center font-mono text-lg font-bold">
            {letter} = {value}
          </span>
          <button type="button" className="step-btn" aria-label="increase value" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}>
            +
          </button>
        </div>
      </div>
      <div
        ref={trackRef}
        className="relative mx-3 h-16 cursor-pointer touch-none"
        onPointerDown={(e) => {
          dragging.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          fromEvent(e);
        }}
        onPointerMove={(e) => dragging.current && fromEvent(e)}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
      >
        <div className="absolute inset-x-0 top-6 h-1.5 rounded-full bg-[#26336e]" />
        <div className="absolute left-0 top-6 h-1.5 rounded-full bg-violet-500/70 transition-[width] duration-150" style={{ width: `${pct(value)}%` }} />
        {Array.from({ length: span + 1 }, (_, i) => {
          const v = min + i;
          const isMajor = v % major === 0;
          return (
            <div key={v} className="absolute top-[30px] -translate-x-1/2" style={{ left: `${pct(v)}%` }}>
              <div className={isMajor ? "mx-auto h-3 w-0.5 bg-slate-300" : "mx-auto h-1.5 w-px bg-slate-500"} />
              {isMajor && <div className="mt-0.5 text-[11px] font-semibold text-slate-400">{v}</div>}
            </div>
          );
        })}
        {solution != null && solution >= min && solution <= max && solution === value && (
          <div className="absolute -top-1 -translate-x-1/2 text-xs font-bold text-green-300" style={{ left: `${pct(value)}%` }}>
            balanced
          </div>
        )}
        <div
          role="slider"
          tabIndex={0}
          aria-label={`value of ${letter}`}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowDown") onChange(Math.max(min, value - 1));
            if (e.key === "ArrowRight" || e.key === "ArrowUp") onChange(Math.min(max, value + 1));
          }}
          className="absolute top-[11px] grid h-8 w-8 -translate-x-1/2 place-items-center rounded-full border-2 border-violet-300 bg-violet-600 text-sm font-black text-white shadow-[0_4px_14px_rgba(124,92,255,0.55)] outline-none transition-[left] duration-150 ease-out focus-visible:ring-4 focus-visible:ring-violet-400/40"
          style={{ left: `${pct(value)}%` }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
