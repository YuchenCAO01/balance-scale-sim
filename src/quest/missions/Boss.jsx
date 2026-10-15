import { useMemo, useState } from "react";
import ScaleStage from "../../scale/ScaleStage.jsx";
import { Button, cx } from "../../ui/kit.jsx";
import { term } from "../../scale/model.js";
import { MissionLayout, Speech, useMission } from "../parts.jsx";

const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

function makeExam() {
  const q = [];
  {
    const x = rint(3, 12);
    const a = rint(3, 9);
    q.push({ order: "A crate of anchors", bags: 1, units: a, right: x + a, x });
  }
  {
    const x = rint(2, 8);
    const a = rint(2, 5);
    q.push({ order: "A load of ropes", bags: a, units: 0, right: a * x, x });
  }
  {
    const x = rint(2, 7);
    const a = rint(2, 4);
    const b = rint(1, 8);
    q.push({ order: "A pallet of paint tins", bags: a, units: b, right: a * x + b, x });
  }
  {
    const x = rint(2, 6);
    const a = rint(3, 4);
    const b = rint(2, 9);
    q.push({
      order: "A word problem",
      bags: a,
      units: b,
      right: a * x + b,
      x,
      words: `${a} identical parcels and ${b} cubes weigh ${a * x + b} kg altogether. How heavy is one parcel?`,
    });
  }
  return q.map((it) => ({ ...it, eq: `${term(it.bags, "x")}${it.units ? ` + ${it.units}` : ""} = ${it.right}` }));
}

function checkLine(q, v) {
  const lhs = q.bags * v + q.units;
  const expr = `${q.bags === 1 ? "" : `${q.bags} × `}${v}${q.units ? ` + ${q.units}` : ""}`;
  return { text: `${expr} = ${lhs}`, ok: lhs === q.right };
}

export default function Boss() {
  const { api } = useMission();
  const [exam] = useState(makeExam);
  const [idx, setIdx] = useState(-1);
  const [value, setValue] = useState("");
  const [given, setGiven] = useState(null);
  const [score, setScore] = useState(0);

  const q = exam[Math.max(0, idx)];
  const answered = given != null;
  const ok = answered && given === q.x;

  const left = useMemo(() => ({ bags: q.bags, units: q.units }), [q]);
  const right = useMemo(() => ({ units: q.right }), [q]);

  // After answering, the bag takes the student's value, so a wrong answer visibly tips the scale.
  const world = (
    <ScaleStage
      left={left}
      right={right}
      x={answered ? given : q.x}
      locked={idx === -1}
      tag={answered ? `${given} kg` : "?"}
      lines={idx === -1 ? null : answered ? [{ eq: q.eq }, { eq: `x = ${given}?`, note: `check: ${checkLine(q, given).text} ${ok ? "✓" : `≠ ${q.right}`}` }] : [{ eq: q.eq }]}
    />
  );

  const submit = () => {
    const v = Number(value.trim());
    if (!value.trim() || Number.isNaN(v)) return;
    setGiven(v);
    if (v === q.x) setScore((s) => s + 1);
  };

  const next = () => {
    if (idx === exam.length - 1) {
      const stars = score === 4 ? 3 : score === 3 ? 2 : 1;
      api.finish(stars, `${score} of 4 orders correct`);
      return;
    }
    setIdx((i) => i + 1);
    setValue("");
    setGiven(null);
  };

  return (
    <MissionLayout step={Math.max(0, idx)} total={exam.length} world={world}>
      {idx === -1 ? (
        <>
          <Speech who="rae">
            Four orders are waiting at the weighbridge. For each one, find x, and the scale will test your answer by
            substitution. Get all 4 for three stars.
          </Speech>
          <Speech who="cubby">Remember: same move on both sides, and undo loose cubes before sharing. You’ve got this!</Speech>
          <Button variant="primary" size="lg" onClick={() => setIdx(0)}>
            Start the exam
          </Button>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-300">
              Order {idx + 1} of {exam.length}
            </span>
            <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 font-bold text-amber-200">Score {score}</span>
          </div>
          <div className="text-xs font-bold uppercase tracking-wide text-amber-300">{q.order}</div>
          <div className="text-lg font-semibold">
            {q.words ? q.words : <>Solve <span className="font-mono">{q.eq}</span></>}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg font-bold">x =</span>
            <input
              className="field w-28 text-lg font-bold tabular-nums"
              inputMode="numeric"
              aria-label="Your answer"
              placeholder="?"
              value={value}
              disabled={answered}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
            <span className="font-semibold">kg</span>
            {!answered && (
              <Button variant="primary" onClick={submit} disabled={!value.trim()}>
                Test on the scale
              </Button>
            )}
          </div>
          {answered && (
            <div
              className={cx(
                "pop-in rounded-lg border px-3 py-2 text-sm",
                ok ? "border-green-400/30 bg-green-500/10 text-green-100" : "border-amber-400/30 bg-amber-500/10 text-amber-100"
              )}
            >
              {ok ? (
                <>
                  <b>Balanced, correct!</b> {checkLine(q, given).text} ✓
                </>
              ) : (
                <>
                  <b>The scale tipped.</b> {checkLine(q, given).text}, not {q.right}. The answer is <b>x = {q.x}</b>:{" "}
                  {checkLine(q, q.x).text} ✓
                </>
              )}
            </div>
          )}
          {answered && (
            <div className="flex justify-end">
              <Button variant="primary" onClick={next}>
                {idx === exam.length - 1 ? "See my result ✓" : "Next order →"}
              </Button>
            </div>
          )}
        </>
      )}
    </MissionLayout>
  );
}
