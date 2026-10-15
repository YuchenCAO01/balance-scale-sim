import { useMemo, useState } from "react";
import ScaleStage from "../scale/ScaleStage.jsx";
import { Card, IntField, Segment, cx } from "../ui/kit.jsx";
import { term } from "../scale/model.js";
import NumberLine from "./NumberLine.jsx";

const TYPES = [
  { value: "plus", label: "ax + b = c" },
  { value: "minus", label: "ax − b = c" },
  { value: "times", label: "ax = c" },
];

const PRESETS = [
  { label: "c + 12 = 30", type: "plus", A: 1, B: 12, C: 30, v: "c", x: 10 },
  { label: "5b = 20", type: "times", A: 5, B: 0, C: 20, v: "b", x: 2 },
  { label: "2x + 13 = 21", type: "plus", A: 2, B: 13, C: 21, v: "x", x: 1 },
  { label: "3y − 4 = 11", type: "minus", A: 3, B: 4, C: 11, v: "y", x: 2 },
];

const X_MAX = 40;

export default function Sandbox() {
  const [type, setType] = useState("plus");
  const [A, setA] = useState(1);
  const [B, setB] = useState(12);
  const [C, setC] = useState(30);
  const [v, setV] = useState("c");
  const [x, setX] = useState(10);

  const b = type === "times" ? 0 : B;
  const lhs = type === "minus" ? A * x - b : A * x + b;
  const balanced = lhs === C;
  const solution = useMemo(() => {
    const s = type === "minus" ? (C + b) / A : (C - b) / A;
    return Number.isInteger(s) && s >= 0 && s <= X_MAX ? s : null;
  }, [type, A, b, C]);

  const sign = type === "minus" ? "−" : "+";
  const lhsExpr = `${term(A, v)}${b ? ` ${sign} ${b}` : ""}`;
  const subst = `${A === 1 ? "" : `${A} × `}${x}${b ? ` ${sign} ${b}` : ""}`;

  const left = useMemo(
    () => ({ bags: A, units: type === "plus" ? b : 0, balloons: type === "minus" ? b : 0 }),
    [A, b, type]
  );
  const right = useMemo(() => ({ units: C }), [C]);

  const apply = (p) => {
    setType(p.type);
    setA(p.A);
    setB(p.B);
    setC(p.C);
    setV(p.v);
    setX(p.x);
  };

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-xl font-bold">Sandbox</h1>
        <p className="text-sm text-slate-300/80">Build any equation, then slide the value of the letter until the scale balances.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <div className="order-2 grid content-start gap-4 lg:order-1">
          <Card className="grid gap-3">
            <div className="text-sm font-bold">Equation type</div>
            <Segment items={TYPES} value={type} onChange={setType} className="w-full [&>button]:flex-1" />
            <div className="grid grid-cols-4 gap-2">
              <IntField label="a" value={A} onChange={setA} min={1} max={8} id="sb-a" />
              <label className="flex flex-col gap-1" htmlFor="sb-v">
                <span className="text-xs text-slate-300/80">letter</span>
                <input
                  id="sb-v"
                  className="field w-full text-center font-bold italic"
                  value={v}
                  maxLength={1}
                  onChange={(e) => {
                    const ch = e.target.value.replace(/[^a-zA-Z]/g, "").slice(-1);
                    if (ch) setV(ch.toLowerCase());
                  }}
                />
              </label>
              <IntField label="b" value={B} onChange={setB} min={0} max={20} id="sb-b" className={type === "times" ? "opacity-40" : ""} />
              <IntField label="c" value={C} onChange={setC} min={0} max={60} id="sb-c" />
            </div>
            <div className="rounded-xl border border-white/10 bg-[#0e1430] px-3 py-2 text-center font-mono text-2xl font-bold">
              {lhsExpr} = {C}
            </div>
            <p className="text-xs text-slate-400">
              Bags are the letter, orange cubes weigh 1 kg (crates hold 10). In ax − b, pink balloons each lift 1 kg.
            </p>
          </Card>
          <Card className="grid gap-2">
            <div className="text-sm font-bold">Presets</div>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  type="button"
                  key={p.label}
                  onClick={() => apply(p)}
                  className="rounded-xl border border-violet-400/40 bg-violet-500/15 px-3 py-1.5 font-mono text-sm font-bold text-violet-100 hover:bg-violet-500/25"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </Card>
        </div>
        <div className="order-1 grid content-start gap-4 lg:order-2">
          <ScaleStage left={left} right={right} x={x} letter={v} tag={`${x} kg`} leftCaption={`${lhsExpr} = ${lhs} kg`}>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="text-base sm:text-lg">
                With <i className="font-bold">{v}</i> = <b>{x}</b>: left = <span className="font-mono">{subst}</span> ={" "}
                <b>{lhs}</b> kg, right = <b>{C}</b> kg
              </div>
              <div
                className={cx(
                  "rounded-full px-3 py-1 text-center text-sm font-bold",
                  balanced ? "bg-green-500/15 text-green-300" : "bg-amber-500/15 text-amber-200"
                )}
              >
                {balanced ? `✓ ${v} = ${x} is the solution` : lhs > C ? "Left heavier: try a smaller value" : "Right heavier: try a bigger value"}
              </div>
            </div>
            <NumberLine min={0} max={X_MAX} value={x} onChange={setX} letter={v} solution={solution} />
            {solution == null && (
              <div className="text-xs text-amber-200/80">
                This equation has no whole-number solution between 0 and {X_MAX}. Try changing a, b or c.
              </div>
            )}
          </ScaleStage>
        </div>
      </div>
    </div>
  );
}
