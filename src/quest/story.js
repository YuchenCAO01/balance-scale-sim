/* Story + mission metadata for Equation Quest (deliberately shorter than Volume Quest). */

export const STORY = {
  title: "Equation Quest: The Port Cubica Weighbridge",
  intro: [
    "Welcome back to Port Cubica! Before any cargo is loaded, it crosses the weighbridge: a giant balance scale.",
    "Every cube weighs exactly 1 kg. Some parcels are mystery bags. We don’t know what they weigh, so we call their weight x.",
    "Your job is to find x without ever opening a bag. Three jobs and a short final, and you’re a Weighbridge Master.",
  ],
};

export const MISSIONS = [
  {
    id: "m1",
    kicker: "Job 1",
    title: "The Mystery Bag",
    question: "What does the = sign really mean?",
    blurb: "Test weights on the scale until it balances.",
    badge: { name: "Fair Tester", icon: "=" },
    keyIdea:
      "An equation is a balanced scale: both sides have the same value. The solution is the number that makes it balance. Check it by substituting: if x = 5, then 5 + 3 = 8 ✓.",
  },
  {
    id: "m2",
    kicker: "Job 2",
    title: "Keep It Level",
    question: "How can we change an equation without breaking it?",
    blurb: "Take cubes off the scale without letting it tip.",
    badge: { name: "Level Keeper", icon: "−" },
    keyIdea:
      "Whatever you do to one side, do to the other, and the scale stays balanced. To undo + 4, subtract 4 from both sides.",
  },
  {
    id: "m3",
    kicker: "Job 3",
    title: "Share It Out",
    question: "How do we solve equations with more than one bag?",
    blurb: "Split both sides fairly, then work backwards.",
    badge: { name: "Fair Sharer", icon: "÷" },
    keyIdea:
      "3x = 12 means 3 equal bags, so divide both sides by 3. For 2x + 3 = 11, undo in reverse order (backtracking): first − 3 from both sides, then ÷ 2.",
  },
  {
    id: "boss",
    kicker: "Final",
    title: "The Weighbridge Exam",
    question: "Can you solve new equations and prove your answer?",
    blurb: "Four quick orders. Solve, then check by substitution.",
    badge: { name: "Weighbridge Master", icon: "★" },
    keyIdea:
      "Solve by doing the same to both sides, undoing operations in reverse order. Always check by substituting your answer back into the equation.",
  },
];

export const missionIndex = (id) => MISSIONS.findIndex((m) => m.id === id);
