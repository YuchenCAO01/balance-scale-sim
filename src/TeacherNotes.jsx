import { Button, Modal } from "./ui/kit.jsx";
import { MISSIONS } from "./quest/story.js";

const PROMPTS = {
  m1: "Before letting go: “Which way will it tip, and why?” After: “How did the tilt tell you whether to go bigger or smaller?” Draw out = as “the same value as”, not “the answer is”.",
  m2: "Ask a student to explain why taking from one side tips the scale. Link − 1 from both sides to writing x + 4 − 1 = 10 − 1 on the board.",
  m3: "Let students try ÷ 2 first in 2x + 3 = 11 and discuss Cubby’s warning. Connect “reverse order” to backtracking flowcharts (× 2, + 3 ↔ − 3, ÷ 2).",
  boss: "Use as an exit ticket. Wrong answers are tested on the scale, so students see why they don’t work (substitution).",
};

export default function TeacherNotes({ open, onClose, progress, setUnlockAll, reset }) {
  return (
    <Modal open={open} onClose={onClose} title="Teacher notes" wide>
      <div className="grid gap-4 text-sm leading-relaxed text-slate-200">
        <section className="grid gap-1">
          <h3 className="text-base font-bold text-white">Learning intention</h3>
          <p>We are learning to solve linear equations using the balance model and to check our solutions by substitution.</p>
        </section>
        <section className="grid gap-1">
          <h3 className="text-base font-bold text-white">Success criteria</h3>
          <ul className="list-disc space-y-0.5 pl-5">
            <li>I can explain that = means both sides have the same value, like a balanced scale.</li>
            <li>I can find a solution by testing values, and check it by substitution.</li>
            <li>I can keep an equation balanced by doing the same operation to both sides.</li>
            <li>I can solve two-step equations by undoing the operations in reverse order (backtracking).</li>
          </ul>
        </section>
        <section className="grid gap-1">
          <h3 className="text-base font-bold text-white">Curriculum link</h3>
          <p>
            Victorian Curriculum Mathematics 2.0, Level 7 Algebra, <b>VC2M7A03</b>: solving one-variable linear equations with
            natural number solutions and verifying solutions by substitution. The elaborations include solving equations with
            concrete materials, the balance model and backtracking, which is what these jobs do.
          </p>
        </section>
        <section className="grid gap-1">
          <h3 className="text-base font-bold text-white">How the jobs are built</h3>
          <p>
            Three short jobs and a 4-question final (about 20–25 minutes in total). Each job follows{" "}
            <b>Predict → Test → Explain → Apply</b>. Predictions are never marked wrong; stars come from the explain and apply
            questions. Every physical move on the scale is written as algebra beside it, so students see the symbols and the
            model together.
          </p>
          <ul className="list-disc space-y-0.5 pl-5">
            <li>
              <b>Sandbox:</b> build ax + b = c, ax − b = c or ax = c (balloons show subtraction) and slide the value of the letter
              until the scale balances. Good for a whole-class “guess and check” warm-up.
            </li>
            <li>
              <b>Direct links:</b> add <code>#/mission/m2</code> (or m1, m3, boss) or <code>#/sandbox</code> to the page address.
            </li>
            <li>Progress is saved in this browser only, and nothing is sent anywhere.</li>
          </ul>
        </section>
        <section className="grid gap-1">
          <h3 className="text-base font-bold text-white">Discussion prompts</h3>
          <ul className="space-y-1.5">
            {MISSIONS.map((m) => (
              <li key={m.id}>
                <b className="text-amber-200">
                  {m.kicker} · {m.title}:
                </b>{" "}
                {PROMPTS[m.id]}
              </li>
            ))}
          </ul>
        </section>
        <section className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-[#0e1430] p-3">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={progress.unlockAll}
              onChange={(e) => setUnlockAll(e.target.checked)}
              className="h-4 w-4 accent-indigo-500"
            />
            Unlock every job (for demos)
          </label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (window.confirm("Reset all stars and badges on this device?")) reset();
            }}
          >
            Reset progress on this device
          </Button>
        </section>
      </div>
    </Modal>
  );
}
