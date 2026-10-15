import { useState } from "react";
import ScaleStage from "../../scale/ScaleStage.jsx";
import { Button, Stepper, cx } from "../../ui/kit.jsx";
import { ChoiceTask, MissionLayout, NextRow, NumberTask, Speech, useMission } from "../parts.jsx";

const LEFT = { bags: 1, units: 3 };
const RIGHT = { units: 8 };
const ANSWER = 5;
const APPLY = { left: { bags: 1, units: 6 }, right: { units: 15 }, x: 9 };

export default function M1MysteryBag() {
  const { api } = useMission();
  const [step, setStep] = useState(0);
  const [pred, setPred] = useState(null);
  const [trial, setTrial] = useState(null);
  const [tries, setTries] = useState({});
  const [eqDone, setEqDone] = useState(false);
  const [applyDone, setApplyDone] = useState(false);

  const test = (v) => {
    setTrial(v);
    setTries((t) => ({ ...t, [v]: v + LEFT.units }));
  };
  const found = tries[ANSWER] != null;
  const tried = Object.keys(tries)
    .map(Number)
    .sort((a, b) => a - b);

  let stage;
  if (step < 3) {
    stage = (
      <ScaleStage
        left={LEFT}
        right={RIGHT}
        x={trial ?? 0}
        locked={trial == null}
        tag={trial == null ? "?" : `${trial} kg`}
        leftCaption={trial == null ? "x + 3" : `${trial} + 3 = ${trial + 3} kg`}
        lines={found ? [{ eq: "x + 3 = 8" }, { eq: "x = 5", note: "check: 5 + 3 = 8 ✓" }] : null}
      />
    );
  } else {
    stage = (
      <ScaleStage
        left={APPLY.left}
        right={APPLY.right}
        x={APPLY.x}
        tag={applyDone ? "9 kg" : "?"}
        lines={applyDone ? [{ eq: "x + 6 = 15" }, { eq: "x = 9", note: "check: 9 + 6 = 15 ✓" }] : [{ eq: "x + 6 = 15" }]}
      />
    );
  }

  return (
    <MissionLayout step={step} total={4} world={stage}>
      {step === 0 && (
        <>
          <Speech who="rae">
            A mystery bag and <b>3 cubes</b> are on the left. <b>8 cubes</b> are on the right. Each cube weighs 1 kg. We write
            this as <b className="font-mono">x + 3 = 8</b>.
          </Speech>
          <Speech who="cubby">
            I’m holding the beam still. Let’s swap the bag for a <b>2 kg</b> test weight. What will happen when I let go?
          </Speech>
          <ChoiceTask
            prompt="Predict: if the bag weighs 2 kg…"
            done={pred}
            tested={trial != null}
            options={[
              { id: "left", label: "the left side goes down" },
              { id: "right", label: "the right side goes down" },
              { id: "level", label: "it stays level" },
            ]}
            onDone={setPred}
          />
          {trial == null ? (
            <Button variant="warn" size="lg" disabled={!pred} onClick={() => test(2)}>
              Let go and test 2 kg
            </Button>
          ) : (
            <>
              <Speech who="cubby">
                The <b>right</b> side went down. 2 + 3 = 5 kg is lighter than 8 kg, and{" "}
                <b>the heavier side always goes down</b>. {pred === "right" ? "Great prediction!" : "Did that surprise you?"}
              </Speech>
              <NextRow onNext={() => setStep(1)} />
            </>
          )}
        </>
      )}

      {step === 1 && (
        <>
          <Speech who="rae">
            Your turn. Change the test weight until the scale <b>balances</b>. Use what the tilt tells you!
          </Speech>
          <Stepper label="Test weight" value={trial ?? 2} min={0} max={12} unit="kg" onChange={test} />
          <table className="w-full overflow-hidden rounded-xl text-sm">
            <thead>
              <tr className="bg-[#0e1430] text-slate-300">
                <th className="px-2 py-1.5 text-left font-semibold">x</th>
                <th className="px-2 py-1.5 text-left font-semibold">Left: x + 3</th>
                <th className="px-2 py-1.5 text-left font-semibold">Right</th>
                <th className="px-2 py-1.5 text-left font-semibold">Result</th>
              </tr>
            </thead>
            <tbody>
              {tried.map((v) => {
                const l = tries[v];
                return (
                  <tr key={v} className={cx("border-t border-white/5", v === trial && "bg-indigo-500/15")}>
                    <td className="px-2 py-1 font-bold tabular-nums">{v}</td>
                    <td className="px-2 py-1 tabular-nums">{l} kg</td>
                    <td className="px-2 py-1 tabular-nums">8 kg</td>
                    <td className={cx("px-2 py-1 font-semibold", l === 8 ? "text-green-300" : "text-amber-200")}>
                      {l === 8 ? "balanced ✓" : l < 8 ? "too light" : "too heavy"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {found ? (
            <Speech who="cubby">
              <b>x = 5</b> balances the scale, so 5 is the <b>solution</b> of x + 3 = 8. We checked it by putting 5 in place of x:
              5 + 3 = 8 ✓
            </Speech>
          ) : (
            tried.length >= 3 && (
              <Speech who="cubby">Tip: if the left side is too light, should the next test weight be bigger or smaller?</Speech>
            )
          )}
          <NextRow
            onNext={() => {
              setTrial(ANSWER);
              setStep(2);
            }}
            canNext={found}
          />
        </>
      )}

      {step === 2 && (
        <>
          <Speech who="rae">Big question time. In x + 3 = 8, what does the = sign tell us?</Speech>
          <ChoiceTask
            correct="same"
            onWrong={api.miss}
            onDone={() => setEqDone(true)}
            options={[
              { id: "answer", label: "“The answer comes next.”", why: "That’s how a calculator uses =. In an equation, = is a balance point, not an instruction." },
              { id: "same", label: "Both sides have the same value: the scale balances.", why: "x + 3 and 8 weigh the same. That’s why the scale is level." },
              { id: "left", label: "Work out the left side first.", why: "We can’t work out x + 3 until we know x. = compares the two sides." },
            ]}
          />
          <NextRow onNext={() => setStep(3)} canNext={eqDone} />
        </>
      )}

      {step === 3 && (
        <>
          <Speech who="rae">
            New parcel: a mystery bag and <b>6 cubes</b> balance <b>15 cubes</b>. The scale is level, so x + 6 = 15.
          </Speech>
          <NumberTask
            prompt="What does the bag weigh?"
            answer={APPLY.x}
            unit="kg"
            hints={["Which number plus 6 makes 15?", "Try counting up from 6 to 15."]}
            onWrong={api.miss}
            onDone={() => setApplyDone(true)}
            after="x = 9. Check by substitution: 9 + 6 = 15 ✓"
          />
          <NextRow onNext={() => api.finish()} canNext={applyDone} nextLabel="Finish job ✓" />
        </>
      )}
    </MissionLayout>
  );
}
