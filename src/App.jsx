import { useCallback, useEffect, useState } from "react";
import { Segment, Stars } from "./ui/kit.jsx";
import { useProgress } from "./lib/progress.js";
import Sandbox from "./sandbox/Sandbox.jsx";
import QuestHome from "./quest/QuestHome.jsx";
import TeacherNotes from "./TeacherNotes.jsx";
import { MissionFrame } from "./quest/parts.jsx";
import { MISSIONS, missionIndex } from "./quest/story.js";
import M1MysteryBag from "./quest/missions/M1MysteryBag.jsx";
import M2KeepLevel from "./quest/missions/M2KeepLevel.jsx";
import M3ShareOut from "./quest/missions/M3ShareOut.jsx";
import Boss from "./quest/missions/Boss.jsx";

/**
 * Balance Scale Simulator: Equation Quest
 *   #/                 harbour map (story mode)
 *   #/mission/<id>     one job (m1–m3, boss)
 *   #/sandbox          build-your-own equation on the scale
 */

const COMPONENTS = { m1: M1MysteryBag, m2: M2KeepLevel, m3: M3ShareOut, boss: Boss };

function readRoute() {
  const h = window.location.hash.replace(/^#/, "") || "/";
  return h.startsWith("/") ? h : `/${h}`;
}

function useHashRoute() {
  const [route, setRoute] = useState(readRoute);
  useEffect(() => {
    const on = () => setRoute(readRoute());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  const go = useCallback((to) => {
    if (readRoute() === to) setRoute(to);
    else window.location.hash = to;
    window.scrollTo({ top: 0 });
  }, []);
  return [route, go];
}

function Logo() {
  return (
    <svg viewBox="0 0 40 40" className="h-9 w-9 shrink-0" aria-hidden="true">
      <rect x="18.5" y="9" width="3" height="24" rx="1.5" fill="#4a5bb0" />
      <path d="M11 34h18l-3-4H14z" fill="#3f5ee8" />
      <rect x="5" y="9" width="30" height="4" rx="2" fill="#7d97ff" transform="rotate(-8 20 11)" />
      <path d="M3 22h12a6 3.5 0 0 1-12 0z" fill="#f59e0b" />
      <path d="M25 19h12a6 3.5 0 0 1-12 0z" fill="#7c5cff" />
      <circle cx="20" cy="11" r="3" fill="#fbbf24" />
    </svg>
  );
}

export default function App() {
  const [route, go] = useHashRoute();
  const { data: progress, complete, setUnlockAll, setName, reset } = useProgress();
  const [notesOpen, setNotesOpen] = useState(false);

  const missionMatch = route.match(/^\/mission\/(\w+)/);
  const missionId = missionMatch && COMPONENTS[missionMatch[1]] ? missionMatch[1] : null;
  const mode = route.startsWith("/sandbox") ? "sandbox" : "quest";
  const totalStars = MISSIONS.reduce((s, m) => s + (progress.missions[m.id]?.stars || 0), 0);

  useEffect(() => {
    const m = missionId ? MISSIONS[missionIndex(missionId)] : null;
    document.title = m
      ? `${m.kicker}: ${m.title} · Equation Quest`
      : mode === "sandbox"
        ? "Sandbox · Balance Scale Simulator"
        : "Equation Quest · Balance Scale Simulator";
  }, [missionId, mode]);

  let page;
  if (mode === "sandbox") {
    page = <Sandbox />;
  } else if (missionId) {
    const i = missionIndex(missionId);
    const mission = MISSIONS[i];
    const Comp = COMPONENTS[missionId];
    const nextMission = MISSIONS[i + 1];
    page = (
      <MissionFrame
        key={missionId}
        mission={mission}
        onComplete={complete}
        onHome={() => go("/")}
        onNext={() => nextMission && go(`/mission/${nextMission.id}`)}
        hasNext={!!nextMission}
      >
        <Comp />
      </MissionFrame>
    );
  } else {
    page = <QuestHome progress={progress} go={go} setName={setName} />;
  }

  return (
    <div className="app-bg min-h-screen w-full px-3 py-3 text-slate-100 sm:px-4 sm:py-4">
      <div className="mx-auto grid max-w-7xl gap-4">
        <header className="topbar no-print flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3">
          <button type="button" className="flex min-w-0 items-center gap-3 text-left" onClick={() => go("/")}>
            <Logo />
            <div className="min-w-0">
              <div className="truncate text-lg font-bold leading-tight">Balance Scale Simulator</div>
              <div className="truncate text-xs text-slate-300/80">Equation Quest · solving equations with the balance model</div>
            </div>
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <Segment
              items={[
                { value: "quest", label: "Equation Quest" },
                { value: "sandbox", label: "Sandbox" },
              ]}
              value={mode}
              onChange={(v) => go(v === "quest" ? "/" : "/sandbox")}
            />
            <span className="hidden items-center gap-1 rounded-xl border border-amber-400/30 bg-amber-500/10 px-2.5 py-1.5 text-sm font-bold text-amber-200 sm:inline-flex">
              <Stars n={1} of={1} size="text-sm" /> {totalStars}
            </span>
            <button
              type="button"
              onClick={() => setNotesOpen(true)}
              className="rounded-xl border border-[#31407a] px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/5"
            >
              Teacher notes
            </button>
          </div>
        </header>

        <main>{page}</main>

        <footer className="no-print pb-2 text-center text-xs text-slate-400/80">
          Built for Year 7 Algebra (Victorian Curriculum 2.0 · VC2M7A03). Progress is stored only in this browser.
        </footer>
      </div>
      <TeacherNotes
        open={notesOpen}
        onClose={() => setNotesOpen(false)}
        progress={progress}
        setUnlockAll={setUnlockAll}
        reset={reset}
      />
    </div>
  );
}
