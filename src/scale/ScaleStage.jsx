import Scale from "./Scale.jsx";
import { cx } from "../ui/kit.jsx";

/** Algebra written next to the physical moves. */
export function AlgebraLog({ lines, title = "What we wrote" }) {
  if (!lines?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-[#0b1230]/80 p-3">
      <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">{title}</div>
      <ol className="grid gap-1">
        {lines.map((l, i) => (
          <li
            key={`${i}-${l.eq}`}
            className={cx(
              "algebra-line flex flex-wrap items-baseline justify-between gap-x-4 rounded-lg px-2.5 py-1",
              i === lines.length - 1 ? "bg-indigo-500/20" : "opacity-80"
            )}
          >
            <span className="font-mono text-lg font-bold tracking-wide">{l.eq}</span>
            {l.note && <span className="text-xs font-semibold text-amber-200">{l.note}</span>}
          </li>
        ))}
      </ol>
    </div>
  );
}

/** The right-hand stage: the scale plus (optionally) the algebra log. */
export default function ScaleStage({ lines, children, className = "", ...scaleProps }) {
  return (
    <div className={cx("stage grid gap-3 rounded-2xl p-3 sm:p-4", className)}>
      <Scale {...scaleProps} />
      {children}
      <AlgebraLog lines={lines} />
    </div>
  );
}
