import { useEffect, useMemo, useRef, useState } from "react";
import ScaleStage from "../../scale/ScaleStage.jsx";
import { Button } from "../../ui/kit.jsx";
import { term } from "../../scale/model.js";
import { ChoiceTask, MissionLayout, NextRow, NumberTask, Speech, useMission } from "../parts.jsx";

const eq = (b, u, r) => `${term(b, "x")}${u ? ` + ${u}` : ""} = ${r}`;

/** A side of the scale as plain state: bags + loose cubes on the left, cubes on the right. */
function useSides(b, u, r) {
  const [s, setS] = useState({ b, u, r, groups: 0 });
  return [s, setS];
}

export default function M3ShareOut() {
  const { api } = useMission();
  const [step, setStep] = useState(0);
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));

  // Part A: 3x = 12
  const [a, setA] = useSides(3, 0, 12);
  const [aLines, setALines] = useState([{ eq: "3x = 12" }]);
  // Part B: 2x + 3 = 11
  const [b, setB] = useSides(2, 3, 11);
  const [bLines, setBLines] = useState([{ eq: "2x + 3 = 11" }]);
  const [warn, setWarn] = useState(false);
  const [orderDone, setOrderDone] = useState(false);
  // Apply: 3x + 5 = 20
  const [c, setC] = useSides(3, 5, 20);
  const [cLines, setCLines] = useState([{ eq: "3x + 5 = 20" }]);
  const [applyDone, setApplyDone] = useState(false);

  const cur = step === 0 ? a : step === 1 || step === 2 ? b : c;
  const left = useMemo(() => ({ bags: cur.b, units: cur.u, groups: cur.groups }), [cur.b, cur.u, cur.groups]);
  const right = useMemo(() => ({ units: cur.r, groups: cur.groups }), [cur.r, cur.groups]);
  const solved = cur.b === 1 && cur.u === 0;
  const lines = step === 0 ? aLines : step === 3 ? cLines : bLines;
  const world = <ScaleStage left={left} right={right} x={step === 3 ? 5 : 4} tag={solved ? `${cur.r} kg` : "?"} lines={lines} />;

  /* Part B tools */
  const takeBoth = () => {
    if (b.u === 0) return;
    const nb = { ...b, u: b.u - 1, r: b.r - 1 };
    setB(nb);
    setWarn(false);
    setBLines((l) => [...l, { eq: eq(nb.b, nb.u, nb.r), note: "− 1 from both sides" }]);
  };
  const shareB = () => {
    if (b.u > 0) {
      setWarn(true);
      return;
    }
    setB((s) => ({ ...s, groups: 2 }));
    later(() => {
      setB((s) => ({ b: 1, u: 0, r: s.r / 2, groups: 0 }));
      setBLines((l) => [...l, { eq: "x = 4", note: "÷ 2 on both sides" }]);
    }, 1100);
  };

  const animateApply = () => {
    setC((s) => ({ ...s, u: 0, r: 15 }));
    setCLines((l) => [...l, { eq: "3x = 15", note: "− 5 from both sides" }]);
    later(() => setC((s) => ({ ...s, groups: 3 })), 900);
    later(() => {
      setC({ b: 1, u: 0, r: 5, groups: 0 });
      setCLines((l) => [...l, { eq: "x = 5", note: "÷ 3 on both sides" }]);
    }, 2000);
  };

  return (
    <MissionLayout step={step} total={4} world={world}>
      {step === 0 && (
        <>
          <Speech who="rae">
            Three identical bags balance 12 cubes: <b className="font-mono">3x = 12</b>. There are no loose cubes to take off
            this time. What now?
          </Speech>
          <Speech who="cubby">Idea: share the right side out fairly, one share for each bag.</Speech>
          {a.groups === 0 && a.b === 3 && (
            <Button variant="warn" size="lg" onClick={() => setA((s) => ({ ...s, groups: 3 }))}>
              Split both sides into 3 equal shares
            </Button>
          )}
          {a.groups === 3 && (
            <>
              <Speech who="cubby">Each colour is one bag with its fair share: 12 cubes ÷ 3 bags = 4 cubes each.</Speech>
              <Button
                variant="primary"
                size="lg"
                onClick={() => {
                  setA({ b: 1, u: 0, r: 4, groups: 0 });
                  setALines((l) => [...l, { eq: "x = 4", note: "÷ 3 on both sides" }]);
                }}
              >
                Keep one share on each side
              </Button>
            </>
          )}
          {a.b === 1 && (
            <>
              <Speech who="cubby">
                Still level! One bag balances 4 cubes, so x = 4. Check: 3 × 4 = 12 ✓
              </Speech>
              <NextRow onNext={() => setStep(1)} />
            </>
          )}
        </>
      )}

      {step === 1 && (
        <>
          <Speech who="rae">
            Tricky one: <b className="font-mono">2x + 3 = 11</b>. Two bags <i>and</i> loose cubes. You have two tools. Which
            one first?
          </Speech>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button size="lg" onClick={takeBoth} disabled={b.u === 0 || b.b === 1}>
              − 1 cube from both sides
            </Button>
            <Button size="lg" variant="warn" onClick={shareB} disabled={b.groups > 0 || b.b === 1}>
              Share both sides between the 2 bags (÷ 2)
            </Button>
          </div>
          {warn && (
            <Speech who="cubby">
              Hmm, the {b.u} loose cube{b.u === 1 ? "" : "s"} on the left can’t be shared between 2 bags without cutting cubes in
              half! Clear the loose cubes first.
            </Speech>
          )}
          {b.u === 0 && b.b === 2 && b.groups === 0 && <Speech who="cubby">Now there are only bags on the left: 2x = 8. Time to share!</Speech>}
          {b.b === 1 && (
            <Speech who="cubby">
              x = 4. We undid the steps in <b>reverse order</b>: first − 3, then ÷ 2. Check: 2 × 4 + 3 = 11 ✓
            </Speech>
          )}
          <NextRow onNext={() => setStep(2)} canNext={b.b === 1} />
        </>
      )}

      {step === 2 && (
        <>
          <Speech who="rae">Which plan solves 4x + 2 = 18?</Speech>
          <ChoiceTask
            correct="subfirst"
            onWrong={api.miss}
            onDone={() => setOrderDone(true)}
            options={[
              { id: "divfirst", label: "÷ 4 first, then − 2", why: "Sharing first would split the 2 loose cubes between 4 bags. Clear loose cubes first." },
              { id: "subfirst", label: "− 2 from both sides, then ÷ 4", why: "4x + 2 = 18 → 4x = 16 → x = 4. Check: 4 × 4 + 2 = 18 ✓" },
              { id: "leftonly", label: "− 2 from the left only, then ÷ 4", why: "Taking from one side only tips the scale: 4x would no longer equal 18." },
            ]}
          />
          <NextRow onNext={() => setStep(3)} canNext={orderDone} />
        </>
      )}

      {step === 3 && (
        <>
          <Speech who="rae">
            Final parcel of the day: <b className="font-mono">3x + 5 = 20</b>. Solve it, and Cubby will act out your steps.
          </Speech>
          <NumberTask
            prompt="x = ?"
            answer={5}
            unit="kg"
            hints={["First take 5 off both sides. What’s left?", "3x = 15. Now share 15 between 3 bags."]}
            onWrong={api.miss}
            onDone={() => {
              setApplyDone(true);
              animateApply();
            }}
            after="20 − 5 = 15, then 15 ÷ 3 = 5. Check: 3 × 5 + 5 = 20 ✓"
          />
          <NextRow onNext={() => api.finish()} canNext={applyDone} nextLabel="Finish job ✓" />
        </>
      )}
    </MissionLayout>
  );
}
