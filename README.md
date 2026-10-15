# Balance Scale Simulator: Equation Quest

An interactive balance scale for **Year 7 Algebra**. Students solve linear equations with the balance
model, see every physical move written as algebra, and check answers by substitution.

**Live:** https://yuchencao01.github.io/balance-scale-sim/

## Equation Quest (story mode, about 20 minutes)

Students work the weighbridge at **Port Cubica** (the same harbour as
[Volume Quest](https://yuchencao01.github.io/vol-simulator/)). Every cube weighs 1 kg; mystery bags weigh x.
Each job follows **Predict → Test → Explain → Apply**.

| Job | Big question | What students do |
| --- | --- | --- |
| 1 · The Mystery Bag | What does the = sign really mean? | Predict the tilt for a 2 kg test weight, then test values until x + 3 = 8 balances |
| 2 · Keep It Level | How can we change an equation without breaking it? | Take a cube off one side (it tips!), then take the same off both sides until the bag is alone |
| 3 · Share It Out | How do we solve equations with more than one bag? | Split 3x = 12 into equal coloured shares; discover why 2x + 3 = 11 needs − 3 before ÷ 2 |
| Final · The Weighbridge Exam | Can you solve new equations and prove your answer? | Four randomised equations; each answer is tested on the scale (a wrong answer visibly tips it) |

Stars (predictions are never marked wrong), badges, a progress bar and a printable *Weighbridge Master*
certificate. **Teacher notes** include the learning intention, success criteria, the VC2M7A03 link,
discussion prompts and an *unlock every job* switch. Progress is saved in this browser only.

Direct links: `#/mission/m1`, `#/mission/m2`, `#/mission/m3`, `#/mission/boss`, `#/sandbox`.

## Sandbox

The original equation builder: choose ax + b = c, ax − b = c or ax = c, set a, b, c and the letter, then drag
the number line until the scale balances. Subtraction is shown with balloons that each lift 1 kg.

## What changed in this version

- **New look:** an SVG scale with a beam, dial, hanging pans, mystery bags, 1 kg cubes, 10 kg crates and
  balloons, replacing the circles and fixed 720 px frame (which overflowed its card).
- **Smooth motion:** the tilt is a damped spring driven by `requestAnimationFrame`, and the pans are
  positioned from the animated angle every frame, so beam, strings and pans move together (before, the
  beam animated with CSS while the hangers jumped). Pans swing slightly; cubes grow in and float away.
- The number line uses pointer events with capture (mouse, touch and pen) instead of global `window` flags,
  has keyboard support and readable ticks, and no longer overflows on small screens.
- "1c + 12" now shows as "c + 12"; the *Balanced!* banner no longer covers the scale.
- The tab title was still *Vite + React* with the Vite logo.
- The deploy workflow now uses Node 22 (Vite 7 needs Node 20.19+).

## Develop

```bash
npm ci
npm run dev
npm run build
```

Pushing to `main` deploys to GitHub Pages through `.github/workflows/deploy.yml`.
Built with React 19, SVG, Tailwind CSS 4 and Vite.
