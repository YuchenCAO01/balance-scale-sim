import { useMemo, useState } from "react";
import ScaleStage from "../../scale/ScaleStage.jsx";
import { Button } from "../../ui/kit.jsx";
import { ChoiceTask, MissionLayout, NextRow, NumberTask, Speech, useMission } from "../parts.jsx";

const X = 6; // the bag's real weight
const START = { l: 4, r: 10 };
const APPLY = { a: 7, b: 19, x: 12 };

const eq = (l, r) => (l ? `x + ${l} = ${r}` : `x = ${r}`);

export default function M2KeepLevel() {
  const { api } = useMission();
  const [step, setStep] = useState(0);
  const [pred, setPred] = useState(null);
  const [l, setL] = useState(START.l);
  const [r, setR] = useState(START.r);
  const [tipped, setTipped] = useState(false);
  const [restored, setRestored] = useState(false);
  const [lines, setLines] = useState([{ eq: eq(START.l, START.r) }]);
  const [weightDone, setWeightDone] = useState(false);
  const [ruleDone, setRuleDone] = useState(false);
  const [apply, setApply] = useState({ l: APPLY.a, r: APPLY.b, done: false });

  const takeBoth = () => {
    if (l <= 0) return;
    const nl = l - 1;
    const nr = r - 1;
    setL(nl);
    setR(nr);
    setLines((ls) => [...ls, { eq: eq(nl, nr), note: "− 1 from both sides" }]);
  };

  const left = useMemo(() => ({ bags: 1, units: step === 3 ? apply.l : l }), [step, apply.l, l]);
  const right = useMemo(() => ({ units: step === 3 ? apply.r : r }), [step, apply.r, r]);

  const stageLines =
    step === 3
      ? apply.done
        ? [{ eq: "x + 7 = 19" }, { eq: "x = 12", note: "− 7 from both sides" }]
        : [{ eq: "x + 7 = 19" }]
      : step >= 1
        ? lines
        : null;

  const tag = step === 3 ? (apply.done ? "12 kg" : "?") : l === 0 && step >= 1 ? `${X} kg` : "?";

  const world = <ScaleStage left={left} right={right} x={step === 3 ? APPLY.x : X} tag={tag} lines={stageLines} />;

  return (
    <MissionLayout step={step} total={4} world={world}>
      {step === 0 && (
        <>
          <Speech who="rae">
            This bag plus 4 cubes balances 10 cubes: <b className="font-mono">x + 4 = 10</b>. We want the bag on its own, so
            some cubes have to come off.
          </Speech>
          <ChoiceTask
            prompt="Predict: if Cubby takes 1 cube off the LEFT pan only…"
            done={pred}
            options={[
              { id: "left", label: "the left side goes down" },
              { id: "right", label: "the right side goes down" },
              { id: "level", label: "it stays level" },
            ]}
            onDone={setPred}
          />
          {!tipped ? (
            <Button
              variant="warn"
              size="lg"
              disabled={!pred}
              onClick={() => {
                setL(START.l - 1);
                setTipped(true);
              }}
            >
              Take 1 cube off the left only
            </Button>
          ) : !restored ? (
            <>
              <Speech who="cubby">
                Whoa, it tipped! The left lost 1 kg, so the <b>right</b> side is heavier now. The two sides aren’t equal any
                more.
              </Speech>
              <Button
                size="lg"
                onClick={() => {
                  setL(START.l);
                  setRestored(true);
                }}
              >
                Put the cube back
              </Button>
            </>
          ) : (
            <>
              <Speech who="cubby">Level again. So how can we take cubes off and keep it level?</Speech>
              <NextRow onNext={() => setStep(1)} />
            </>
          )}
        </>
      )}

      {step === 1 && (
        <>
          <Speech who="rae">
            Here’s the trick: take the <b>same amount from both sides</b>. Keep going until the bag is alone on its pan.
          </Speech>
          <Button variant="primary" size="lg" onClick={takeBoth} disabled={l === 0}>
            Take 1 cube off both sides
          </Button>
          {l === 0 && (
            <>
              <Speech who="cubby">It stayed level the whole time! The bag is alone now.</Speech>
              <NumberTask
                prompt="So what does the bag weigh?"
                answer={X}
                unit="kg"
                hints={["Look at what is left on the right pan.", "The bag balances 6 cubes."]}
                onWrong={api.miss}
                onDone={() => setWeightDone(true)}
                after="x = 6. We took 4 off both sides: x + 4 − 4 = 10 − 4. Check: 6 + 4 = 10 ✓"
              />
            </>
          )}
          <NextRow onNext={() => setStep(2)} canNext={weightDone} />
        </>
      )}

      {step === 2 && (
        <>
          <Speech who="rae">Now without the scale. How would you solve x + 9 = 15 in one move?</Speech>
          <ChoiceTask
            correct="both"
            onWrong={api.miss}
            onDone={() => setRuleDone(true)}
            options={[
              { id: "leftonly", label: "Subtract 9 from the left side only", why: "Then the left is x but the right is still 15: the scale tips." },
              { id: "both", label: "Subtract 9 from both sides", why: "x + 9 − 9 = 15 − 9, so x = 6. Same move on both sides keeps it level." },
              { id: "add", label: "Add 9 to both sides", why: "That keeps it balanced, but gives x + 18 = 24. Further away, not closer!" },
            ]}
          />
          <NextRow onNext={() => setStep(3)} canNext={ruleDone} />
        </>
      )}

      {step === 3 && (
        <>
          <Speech who="rae">
            Last parcel: <b className="font-mono">x + 7 = 19</b>. Do it in your head, then I’ll take the cubes off.
          </Speech>
          <NumberTask
            prompt="x = ?"
            answer={APPLY.x}
            unit="kg"
            hints={["Undo + 7 by subtracting 7 from both sides.", "19 − 7 = ?"]}
            onWrong={api.miss}
            onDone={() => setApply({ l: 0, r: APPLY.x, done: true })}
            after="19 − 7 = 12. Check: 12 + 7 = 19 ✓"
          />
          <NextRow onNext={() => api.finish()} canNext={apply.done} nextLabel="Finish job ✓" />
        </>
      )}
    </MissionLayout>
  );
}
