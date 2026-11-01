// Run with: node tests/math-test.js
// 20 answers worked out by hand. Rule: nearest 5 lbs, exact ties (x.5) round up.
const { setWeight, roundToLoadable, topWeights } = require("../script.js");

const cases = [
  // [max, %, expected]   hand math
  [315, 75, 235],   // 236.25
  [315, 80, 250],   // 252
  [315, 85, 270],   // 267.75
  [315, 90, 285],   // 283.5
  [225, 70, 160],   // 157.5, a tie, rounds up
  [225, 65, 145],   // 146.25
  [405, 60, 245],   // 243
  [405, 72.5, 295], // 293.625
  [185, 50, 95],    // 92.5, a tie, rounds up
  [185, 100, 185],  // 185
  [500, 77, 385],   // 385
  [275, 82, 225],   // 225.5
  [135, 40, 55],    // 54
  [350, 88, 310],   // 308
  [245, 73, 180],   // 178.85
  [300, 67.5, 205], // 202.5, a tie, rounds up
  [455, 95, 430],   // 432.25
  [200, 105, 210],  // 210
  [160, 55, 90],    // 88
  [380, 62, 235],   // 235.6
];

let failed = 0;
for (const [max, pct, expected] of cases) {
  const got = setWeight(max, pct);
  if (got !== expected) {
    failed++;
    console.log(`FAIL  ${pct}% of ${max}: expected ${expected}, got ${got}`);
  }
}

// The examples written in the project plan
if (roundToLoadable(236) !== 235 || roundToLoadable(238) !== 240) {
  failed++;
  console.log("FAIL  plan examples: 236 -> 235 and 238 -> 240");
}

// Top set = heaviest line per lift; lifts with no max are skipped
const tops = topWeights(
  [{ lift: "squat", pct: 70 }, { lift: "squat", pct: 85 }, { lift: "bench", pct: 75 }],
  { squat: 315 }
);
if (tops.squat !== 270 || "bench" in tops) {
  failed++;
  console.log("FAIL  topWeights:", tops);
}

// Plates per side, worked out by hand: (weight - 45 bar) / 2, heaviest plates first
const { platesPerSide, bodyweightRatio, nextSet } = require("../script.js");
const plateCases = [
  [45, []],                 // empty bar
  [135, [45]],              // 45 a side
  [185, [45, 25]],          // 70 a side
  [225, [45, 45]],          // 90 a side
  [235, [45, 45, 5]],       // 95 a side
  [250, [45, 45, 10, 2.5]], // 102.5 a side
  [315, [45, 45, 45]],      // 135 a side
  [95, [25]],               // 25 a side
  [40, null],               // lighter than the bar
];
for (const [w, expected] of plateCases) {
  const got = platesPerSide(w);
  if (JSON.stringify(got) !== JSON.stringify(expected)) {
    failed++;
    console.log(`FAIL  plates for ${w}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(got)}`);
  }
}

// Pound-for-pound
if (bodyweightRatio(315, 180) !== 1.75 || bodyweightRatio(225, 160) !== 1.41) {
  failed++;
  console.log("FAIL  bodyweightRatio");
}

// Next set skips the done ones
const ns = nextSet(
  [{ lift: "squat", sets: 2, reps: 5, pct: 80, done: [true, false] }],
  { squat: 315 }
);
if (!ns || ns.setIndex !== 1 || ns.weight !== 250) {
  failed++;
  console.log("FAIL  nextSet:", ns);
}

// ---------- Personal features ----------
const R = require("../script.js");
const extra = [
  // [label, got, expected]
  ["estimate 225 x 5 (262.5, tie rounds up)", R.estimateMax(225, 5), 265],
  ["estimate 315 x 3 (346.5)", R.estimateMax(315, 3), 345],
  ["estimate 185 x 10 (246.67)", R.estimateMax(185, 10), 245],
  ["estimate 405 x 1 (a single is the max)", R.estimateMax(405, 1), 405],
  ["load step, standard plates", R.loadStep(), 5],
  ["load step, no 2.5s", R.loadStep([45, 25, 10, 5]), 10],
  ["75% of 315, 10 lb jumps on a 45 bar (236.25 -> 45 + 190)", R.setWeight(315, 75, 10, 45), 235],
  ["75% of 265, 10 lb jumps on a 45 bar (198.75 -> 195, not 200)", R.setWeight(265, 75, 10, 45), 195],
  ["195 loads exactly with no 2.5s", R.loadedWeight(45, R.platesPerSide(195, 45, [45, 35, 25, 10, 5])), 195],
  ["35 bar, 5 lb jumps (157.5 -> 160)", R.setWeight(225, 70, 5, 35), 160],
  ["135 on a 35 bar, no 2.5s (50 a side)", JSON.stringify(R.platesPerSide(135, 35, [45, 25, 10, 5])), "[45,5]"],
  ["95 on a 15 bar (40 a side)", JSON.stringify(R.platesPerSide(95, 15, [25, 10, 5])), "[25,10,5]"],
  ["100 with only 45/25/10 loads 95", R.loadedWeight(45, R.platesPerSide(100, 45, [45, 25, 10])), 95],
  ["lift name cleaned", R.checkLiftName("  overhead   press ", ["Squat"]).name, "overhead press"],
  ["duplicate lift name", Boolean(R.checkLiftName("squat", ["Squat"]).error), true],
  ["lift id", R.liftIdFromName("Overhead Press"), "custom-overhead-press"],
  ["estimate needs 1-12 reps", R.checkEstimate(225, 15).length, 1],
];
const day = R.daySummary(
  [{ lift: "squat", sets: 4, reps: 5, pct: 80, done: [true, true, false, false] },
   { lift: "bench", sets: 3, reps: 5, pct: 75, done: [false, false, false] }],
  { squat: 315, bench: 225 }
);
extra.push(["day summary sets", day.sets, 2]);
extra.push(["day summary volume (2 x 5 x 250)", day.volume, 2500]);
extra.push(["day summary skips untouched lines", day.lines.length, 1]);

for (const [label, got, expected] of extra) {
  if (got !== expected) {
    failed++;
    console.log(`FAIL  ${label}: expected ${expected}, got ${got}`);
  }
}

// ---------- Lift library + search (uses the real lifts.js) ----------
const fs = require("fs");
const libSrc = fs.readFileSync(__dirname + "/../lifts.js", "utf8");
const { LIFT_ROWS, LIFT_GROUPS, SEARCH_SYNONYMS, RECOMMENDED } = new Function(libSrc + "; return { LIFT_ROWS, LIFT_GROUPS, SEARCH_SYNONYMS, RECOMMENDED };")();
const lib = R.buildLibrary(LIFT_ROWS, LIFT_GROUPS);
const ids = new Set(lib.map((l) => l.id));
const names = (q, g) => R.searchLifts(lib, q, SEARCH_SYNONYMS, g).map((l) => l.name);
const lib2 = [
  ["library has 460 lifts", lib.length, 460],
  ["ids are unique", ids.size, lib.length],
  ["every recommended lift exists", [...RECOMMENDED.team, ...RECOMMENDED.personal].every((id) => ids.has(id)), true],
  ["treadmill + stairmaster in cardio", ["treadmill", "stairmaster"].every((id) => lib.find((l) => l.id === id).group === "Cardio"), true],
  ["exact name ranks first", names("squat")[0], "Squat"],
  ["'db curl' finds Dumbbell Curl first", names("db curl")[0], "Dumbbell Curl"],
  ["'rdl' finds Romanian Deadlift", names("rdl").includes("Romanian Deadlift"), true],
  ["'single arm row' = one-arm rows", names("single arm row").every((n) => /one-(arm|handed)/i.test(n)) && names("single arm row").length >= 4, true],
  ["'one handed' and 'one arm' find the same lifts", names("one handed curl").join() === names("one arm curl").join(), true],
  ["group filter", names("", "Calves").length, lib.filter((l) => l.group === "Calves").length],
  ["cable search only cable lifts", names("cable").every((n) => lib.find((l) => l.name === n).equip === "cable"), true],
  ["nonsense finds nothing", names("zzqx").length, 0],
];
// Card lines of every kind
const lbsLine = { lift: "dumbbell-curl", sets: 3, reps: 10, unit: "reps", load: { type: "lbs", value: 35 }, done: [true, true, false] };
const repsLine = { lift: "pull-up", sets: 3, reps: 8, unit: "reps", load: null, done: [true, false, false] };
const timeLine = { lift: "plank", sets: 3, reps: 45, unit: "sec", load: null, done: [false, false, false] };
const cardioLine = { lift: "treadmill", sets: 1, reps: 20, unit: "min", load: null, done: [false] };
const oldLine = { lift: "squat", sets: 4, reps: 5, pct: 80 };
const d2 = R.daySummary([lbsLine, repsLine, timeLine], {});
lib2.push(
  ["old saved lines still work", R.entryWeight(oldLine, { squat: 315 }), 250],
  ["lbs load is used as-is", R.entryWeight(lbsLine, {}), 35],
  ["bodyweight line has no weight", R.entryWeight(repsLine, {}), undefined],
  ["% line without a max needs one", R.entryWeight(oldLine, {}), null],
  ["scheme: % line", R.schemeText(oldLine), "4 × 5 at 80%"],
  ["scheme: lbs line", R.schemeText(lbsLine), "3 × 10 at 35 lbs"],
  ["scheme: reps only", R.schemeText(repsLine), "3 × 8"],
  ["scheme: timed", R.schemeText(timeLine), "3 × 45 sec"],
  ["scheme: cardio", R.schemeText(cardioLine), "20 min"],
  ["day: counts sets of every kind done", d2.sets, 3],
  ["day: volume only from weighted reps (2 x 10 x 35)", d2.volume, 700],
  ["check: 90 sec plank ok", R.checkEntry(timeLine).length, 0],
  ["check: 2 sec plank too short", R.checkEntry({ ...timeLine, reps: 2 }).length, 1],
  ["check: cardio ignores sets", R.checkEntry({ ...cardioLine, sets: 0 }).length, 0],
  ["check: 2000 lbs too heavy", R.checkEntry({ ...lbsLine, load: { type: "lbs", value: 2000 } })[0][0], "load"],
  ["next set skips a lift's done sets", R.nextSet([lbsLine], {}).setIndex, 2],
);
for (const [label, got, expected] of lib2) {
  if (got !== expected) {
    failed++;
    console.log(`FAIL  ${label}: expected ${expected}, got ${got}`);
  }
}

// ---------- Ranks, comparisons, Just Log, team links, ghost ----------
const bench225 = R.liftRank("bench", 225, 180, "men");
const team = { name: "Edinboro O-Line — Fall", coach: "Coach K", routines: [{ name: "Monday", lines: [oldLine, lbsLine, timeLine] }] };
const code = R.encodeTeam(team);
const back = R.decodeTeam("https://ethanr876.github.io/lift-day/#team=" + code);
const myL = lib.filter((l) => ["bench", "pull-up", "plank"].includes(l.id));
const fun = [
  ["bench 225 @ 180 (1.25x) = Platinum", bench225.rank, "Platinum"],
  ["next rank Diamond at 1.38 x 180 = 248.4 -> 250", bench225.next.weight, 250],
  ["stronger than ~53% (between 50% at 1.22 and 80% at 1.54)", bench225.percent, 53],
  ["squat 135 @ 200 (0.675x) = Wood", R.liftRank("squat", 135, 200).rank, "Wood"],
  ["Wood -> Bronze at 0.97 x 200 = 194 -> 195", R.liftRank("squat", 135, 200).next.weight, 195],
  ["deadlift 600 @ 200 (3.0x) = Olympian, no next", R.liftRank("deadlift", 600, 200).next, null],
  ["women's standards differ: bench 135 @ 140 = Diamond", R.liftRank("bench", 135, 140, "women").rank, "Diamond"],
  ["OHP has a rank but no percent", R.liftRank("overhead-press", 135, 180).percent, null],
  ["OHP 135 @ 180 (0.75x) = Diamond", R.liftRank("overhead-press", 135, 180).rank, "Diamond"],
  ["no standard for power clean", R.liftRank("clean", 200, 180), null],
  ["overall = average rank", R.overallRank([{ index: 4 }, { index: 0 }, { index: 8 }]).rank, "Platinum"],
  ["15,000 lbs = 1.2 African elephants", R.volumeComparison(15000).text, "about 1.2 African elephants"],
  ["700 lbs = 1.2 grizzly bears", R.volumeComparison(700).text, "about 1.2 grizzly bears"],
  ["450 lbs = 2 pandas", R.volumeComparison(450).text, "about 2 adult giant pandas"],
  ["tiny volume = nothing", R.volumeComparison(20), null],
  ["quick: bench 185 for 8", JSON.stringify(R.parseQuickLog("bench 185 for 8")), JSON.stringify({ query: "bench", weight: 185, reps: 8, unit: "reps" })],
  ["quick: Squat 225x5", R.parseQuickLog("Squat 225x5").weight + "/" + R.parseQuickLog("Squat 225x5").reps, "225/5"],
  ["quick: plank 60 sec", R.parseQuickLog("plank 60 sec").unit + R.parseQuickLog("plank 60 sec").reps, "sec60"],
  ["quick: treadmill 20 min", R.parseQuickLog("treadmill 20 min").unit, "min"],
  ["quick: pull ups 10 = reps only", R.parseQuickLog("pull ups 10").weight, null],
  ["quick: no number asks how many", Boolean(R.parseQuickLog("bench").error), true],
  ["quick: no lift asks which", Boolean(R.parseQuickLog("185 for 8").error), true],
  ["match 'pull ups' -> Pull-Up", R.matchLift("pull ups", myL, lib, SEARCH_SYNONYMS).id, "pull-up"],
  ["match prefers your lifts ('bench' -> Bench Press)", R.matchLift("bench", myL, lib, SEARCH_SYNONYMS).id, "bench"],
  ["team link round trip keeps the name", back && back.name, "Edinboro O-Line — Fall"],
  ["team link keeps workouts", back && back.routines[0].lines.length, 3],
  ["garbage link rejected", R.decodeTeam("not-a-team"), null],
  ["tampered line rejected", R.decodeTeam(R.encodeTeam({ name: "X", routines: [{ name: "a", lines: [{ lift: "squat", sets: 99, reps: 5, unit: "reps", load: null }] }] })), null],
  ["same workout = same signature", R.cardSignature([oldLine, lbsLine]) === R.cardSignature([{ ...oldLine }, { ...lbsLine, done: [false, false, false] }]), true],
  ["ghost: 2 sets done by 100s", R.ghostSetsAt([{ elapsed: 0 }, { elapsed: 95 }, { elapsed: 190 }], 100), 2],
];
for (const [label, got, expected] of fun) {
  if (got !== expected) {
    failed++;
    console.log(`FAIL  ${label}: expected ${expected}, got ${got}`);
  }
}

// ---------- Muscle recovery ----------
const L = (id) => lib.find((l) => l.id === id);
const H = 3600000, now = Date.UTC(2026, 9, 30, 12);
const groups = (id) => R.musclesFor(L(id)).map((m) => m.group + (m.heavy ? "*" : "")).join(",");
const rec = [
  ["squat works legs, heavy", groups("squat"), "Legs*"],
  ["deadlift works back + legs (heavy) + grip", groups("deadlift"), "Back,Legs*,Grip & forearms"],
  ["power clean works back + legs", groups("clean"), "Back,Legs"],
  ["dumbbell curl = biceps", groups("dumbbell-curl"), "Biceps"],
  ["hip thrust (glutes) counts as legs, not heavy", groups("hip-thrust"), "Legs"],
  ["leg press = legs, not heavy", groups("leg-press"), "Legs"],
  ["treadmill = no muscle group", groups("treadmill"), ""],
  ["never trained = ready", R.recoveryStatus("Chest", null, false, now).status, "ready"],
  ["chest 30 h ago = still resting (<48)", R.recoveryStatus("Chest", now - 30 * H, false, now).status, "rest"],
  ["chest 50 h ago = almost (48-72)", R.recoveryStatus("Chest", now - 50 * H, false, now).status, "almost"],
  ["chest 72 h ago = ready", R.recoveryStatus("Chest", now - 72 * H, false, now).status, "ready"],
  ["chest 50 h ago ready in 22 h", Math.round(R.recoveryStatus("Chest", now - 50 * H, false, now).readyIn), 22],
  ["legs 80 h after normal day = ready", R.recoveryStatus("Legs", now - 80 * H, false, now).status, "ready"],
  ["legs 80 h after heavy squats = almost (72-96)", R.recoveryStatus("Legs", now - 80 * H, true, now).status, "almost"],
  ["legs 60 h after heavy squats = rest", R.recoveryStatus("Legs", now - 60 * H, true, now).status, "rest"],
  ["abs 20 h ago = almost (18-24)", R.recoveryStatus("Abs", now - 20 * H, false, now).status, "almost"],
  ["abs 25 h ago = ready", R.recoveryStatus("Abs", now - 25 * H, false, now).status, "ready"],
  ["triceps 30 h = rest (<36)", R.recoveryStatus("Triceps", now - 30 * H, false, now).status, "rest"],
  ["hours text: 20 h, 60 h = 2.5 days, 96 h = 4 days, 20 min", [R.hoursText(20), R.hoursText(60), R.hoursText(96), R.hoursText(0.3)].join("|"), "20 h|2.5 days|4 days|under 1 h"],
];
for (const [label, got, expected] of rec) {
  if (got !== expected) {
    failed++;
    console.log(`FAIL  ${label}: expected ${expected}, got ${got}`);
  }
}

// ---------- Per-set rows: warm-up, normal, failure, drop ----------
const ex = R.newEntry("squat", 3, 5, "reps", { type: "pct", value: 80 });
ex.rows.unshift({ type: "warmup", reps: 5, lbs: 135, done: true });
ex.rows[1].done = true;                                   // first working set at 80% of 315 = 250
ex.rows[3].type = "drop"; ex.rows[3].lbs = 205; ex.rows[3].reps = 8; ex.rows[3].done = true;
const sum = R.daySummary([ex], { squat: 315 });
const rowsTests = [
  ["labels: W, 1, 2, D", R.setLabels(ex.rows).join(","), "W,1,2,D"],
  ["failure set labeled F", R.setLabels([{ type: "normal" }, { type: "failure" }]).join(","), "1,F"],
  ["row uses its own lbs", R.rowWeight(ex, ex.rows[0], { squat: 315 }), 135],
  ["row without lbs uses 80% of max", R.rowWeight(ex, ex.rows[1], { squat: 315 }), 250],
  ["volume skips warm-up: 5x250 + 8x205", sum.volume, 5 * 250 + 8 * 205],
  ["sets done counts warm-up too", sum.sets, 3],
  ["top weight ignores the 135 warm-up", R.topWeights([ex], { squat: 315 }).squat, 250],
  ["next set is the 2nd working set", R.nextSet([ex], { squat: 315 }).setIndex, 2],
  ["scheme shows the warm-up", R.schemeText(ex), "1 warm-up + 3 × 5 at 80%"],
  ["fresh copy unchecks every set", R.freshCopy([ex])[0].rows.every((r) => !r.done), true],
  ["fresh copy keeps set types", R.freshCopy([ex])[0].rows.map((r) => r.type).join(), "warmup,normal,normal,drop"],
  ["routine name from lifts", R.routineNameFor([ex, { lift: "bench" }], (id) => ({ squat: "Squat", bench: "Bench Press" }[id])), "Squat + Bench Press"],
  ["routine name, many lifts", R.routineNameFor([{ lift: "a" }, { lift: "b" }, { lift: "c" }], (id) => id.toUpperCase()), "A + 2 more"],
  ["bad set type rejected", R.checkEntry({ ...ex, rows: [{ type: "mega", reps: 5, lbs: null }] }).length > 0, true],
  ["team link keeps per-set rows", R.decodeTeam(R.encodeTeam({ name: "T", routines: [{ name: "Mon", lines: R.freshCopy([ex]) }] })).routines[0].lines[0].rows[3].type, "drop"],
  ["changing a set changes the ghost signature", R.cardSignature([ex]) === R.cardSignature(R.freshCopy([{ ...ex, rows: ex.rows.slice(1) }])), false],
];
for (const [label, got, expected] of rowsTests) {
  if (got !== expected) {
    failed++;
    console.log(`FAIL  ${label}: expected ${expected}, got ${got}`);
  }
}

// ---------- Setup + rank-ups ----------
const ru = R.rankUp;
const last = [
  ["rest defaults to 2:30", R.REST_DEFAULT, 150],
  ["5 ft 11 in = 71 in", R.heightInches(5, 11), 71],
  ["6 ft = 72 in", R.heightInches(6, 0), 72],
  ["12 inches isn't valid", R.heightInches(5, 12), null],
  ["9 ft isn't a height", R.heightInches(9, 0), null],
  ["height text", R.heightText(71), "5 ft 11 in"],
  ["first rank ever counts", JSON.stringify(ru({ lifts: {} }, { overall: 2, lifts: { bench: 2 } })), JSON.stringify({ kind: "overall", id: "overall", index: 2 })],
  ["no change = no celebration", ru({ overall: 3, lifts: { bench: 3 } }, { overall: 3, lifts: { bench: 3 } }), null],
  ["going down = no celebration", ru({ overall: 4, lifts: { bench: 4 } }, { overall: 3, lifts: { bench: 3 } }), null],
  ["biggest rank-up wins (squat to Titan over overall Gold)", ru({ overall: 2, lifts: { squat: 6, bench: 2 } }, { overall: 3, lifts: { squat: 7, bench: 2 } }).id, "squat"],
  ["tie goes to overall", ru({ overall: 4, lifts: { bench: 4 } }, { overall: 5, lifts: { bench: 5 } }).kind, "overall"],
  ["tiers: Silver pop, Gold rays, Diamond shockwave, Titan confetti", [2, 3, 5, 7, 8].map(R.celebrationTier).join(), "0,1,2,3,3"],
];
for (const [label, got, expected] of last) {
  if (got !== expected) {
    failed++;
    console.log(`FAIL  ${label}: expected ${expected}, got ${got}`);
  }
}

// Failure sets: no rep count, and they don't break checks, volume or the scheme line
const plan = R.entryFromPlan("bench", [{ type: "warmup", reps: 10 }, { type: "normal", reps: 8 }, { type: "normal", reps: 8 }, { type: "failure", reps: 8 }], "reps", { type: "lbs", value: 135 });
const failDone = { ...plan, rows: plan.rows.map((r) => ({ ...r, done: true })) };
const flip = R.entryFromPlan("bench", [{ type: "normal", reps: 6 }], "reps", null);
R.changeSetType(flip, flip.rows[0], "failure");
const flipNull = flip.rows[0].reps;
R.changeSetType(flip, flip.rows[0], "normal");
const failTests = [
  ["failure set from the plan has no reps", plan.rows[3].reps, null],
  ["plan keeps 4 sets in order", plan.rows.map((r) => r.type[0]).join(""), "wnnf"],
  ["a plan with a failure set passes the checks", R.checkEntry(plan).length, 0],
  ["normal set with no reps still fails the checks", R.checkEntry(R.entryFromPlan("bench", [{ type: "normal", reps: null }], "reps", null)).length, 1],
  ["scheme: 1 warm-up + 2 × 8 + 1 to failure", R.schemeText(plan), "1 warm-up + 2 × 8 + 1 to failure at 135 lbs"],
  ["scheme: only failure sets", R.schemeText(R.entryFromPlan("push-up", [{ type: "failure" }, { type: "failure" }], "reps", null)), "2 to failure"],
  ["volume skips the failure set (135 × 16)", R.daySummary([failDone], {}).volume, 2160],
  ["switching to failure drops the reps", flipNull, null],
  ["switching back gives reps again", flip.rows[0].reps, 6],
];
for (const [label, got, expected] of failTests) {
  if (got !== expected) {
    failed++;
    console.log(`FAIL  ${label}: expected ${expected}, got ${got}`);
  }
}

// Helper muscles, recovery stamped at the finish, recommendations
const mk = (group, pattern, equip = "dumbbell", kind = "weight") => ({ group, pattern, equip, kind });
const groupsOf = (lift) => R.musclesFor(lift).map((m) => m.group).join();
const t0 = Date.parse("2026-11-01T10:00:00Z");
const finish = t0 + 3600000;
const lookup = (id) => ({ bench: mk("Chest", "bench", "barbell"), squat: mk("Legs", "squat", "barbell"), curl: mk("Biceps", "curl") }[id]);
const done = (lift, checked) => ({ lift, unit: "reps", reps: 5, load: null, rows: [{ type: "normal", reps: 5, lbs: null, done: checked }] });
const stamped = R.stampRecovery({ Chest: { at: t0 - 86400000, heavy: false } }, [done("bench", true), done("squat", true), done("curl", false)], lookup, finish);
const newTests = [
  ["bench works chest + triceps + shoulders", groupsOf(mk("Chest", "bench", "barbell")), "Chest,Triceps,Shoulders"],
  ["barbell row works back + biceps", groupsOf(mk("Back", "row", "barbell")), "Back,Biceps"],
  ["curl is just biceps", groupsOf(mk("Biceps", "curl")), "Biceps"],
  ["finish stamps chest at the finish time", stamped.Chest.at, finish],
  ["finish stamps the helpers too (triceps)", stamped.Triceps.at, finish],
  ["heavy squat puts legs on the long clock", stamped.Legs.heavy, true],
  ["unchecked exercise doesn't count (biceps)", stamped.Biceps, undefined],
  ["chest is red right after finishing", R.recoveryStatus("Chest", stamped.Chest.at, false, finish + 60000).status, "rest"],
  ["chest is yellow 50 h after finishing", R.recoveryStatus("Chest", stamped.Chest.at, false, finish + 50 * 3600000).status, "almost"],
  ["chest is green 72 h after finishing", R.recoveryStatus("Chest", stamped.Chest.at, false, finish + 72 * 3600000).status, "ready"],
  ["done-before lifts come first", R.recommendedLifts(["curl", "bench"], ["squat", "bench", "deadlift"], () => true).join(), "curl,bench,squat,deadlift"],
  ["unknown ids are skipped and the list is capped", R.recommendedLifts(["nope"], ["a", "b", "c"], (id) => id !== "nope", 2).join(), "a,b"],
];
for (const [label, got, expected] of newTests) {
  if (got !== expected) {
    failed++;
    console.log(`FAIL  ${label}: expected ${expected}, got ${got}`);
  }
}

// Profile stats
const at = (y, m, d) => new Date(y, m - 1, d, 12).getTime(); // noon local, clear of midnight
const iso = (t) => new Date(t).toISOString();
const nowP = at(2026, 11, 5); // Thursday
const hist = [
  { date: iso(at(2026, 11, 3)), lines: [{ lift: "bench", sets: 3, reps: 5, unit: "reps", weight: 205, totalReps: 15 }], sets: 3, volume: 3075, reps: 15, minutes: 50 },
  { date: iso(at(2026, 10, 28)), lines: [{ lift: "bench", sets: 4, reps: 5, unit: "reps", weight: 200, totalReps: 20 }, { lift: "dumbbell-curl", sets: 2, reps: 10, unit: "reps", weight: 30, totalReps: 20 }], sets: 6, volume: 5200, reps: 40, minutes: 60 },
  { date: iso(at(2026, 10, 20)), lines: [{ lift: "squat", sets: 5, reps: 5, unit: "reps", weight: 315, totalReps: 25 }], sets: 5, volume: 7875, reps: 25 },
  { date: iso(at(2026, 9, 2)), lines: [{ lift: "bench", sets: 3, reps: 5, unit: "reps", weight: 185, totalReps: 15 }], sets: 3, volume: 2775, reps: 15, minutes: 40 },
];
const times = hist.map((d) => Date.parse(d.date));
const wk = R.weeklySeries(hist, "volume", nowP, 4);
const mo = R.monthlySeries(hist, "workouts", nowP, 3);
const statLift = (id) => ({ bench: { group: "Chest", pattern: "bench", equip: "barbell", kind: "weight" }, "dumbbell-curl": { group: "Biceps", pattern: "curl", equip: "dumbbell", kind: "weight" }, squat: { group: "Legs", pattern: "squat", equip: "barbell", kind: "weight" } }[id]);
const ms = R.muscleSets(hist, statLift, R.startOfMonth(nowP, -1), R.startOfMonth(nowP, 1));
let wlog = R.logWeight([], at(2026, 10, 23), 245);
wlog = R.logWeight(wlog, at(2026, 11, 1), 243);
wlog = R.logWeight(wlog, at(2026, 11, 1) + 3600000, 242);
const statTests = [
  ["weeks start on Sunday", new Date(R.startOfWeek(nowP)).getDay(), 0],
  ["streak: this week, last week, the week before = 3", R.weekStreak(times, nowP), 3],
  ["streak still alive before you lift this week", R.weekStreak(times.slice(1), at(2026, 11, 2)), 2],
  ["streak broken after a skipped week", R.weekStreak(times.slice(1), at(2026, 11, 12)), 0],
  ["rest days since the last workout", R.restDays(times, nowP), 2],
  ["rest days with no workouts", R.restDays([], nowP), null],
  ["weekly volume, oldest to newest", wk.map((w) => w.value).join(), "0,7875,5200,3075"],
  ["monthly workouts Sep, Oct, Nov", mo.map((m) => m.value).join(), "1,2,1"],
  ["Oct + Nov: 3 workouts", R.totalsBetween(hist, R.startOfMonth(nowP, -1), R.startOfMonth(nowP, 1)).workouts, 3],
  ["duration skips days without a time", R.totalsBetween(hist, 0, Infinity).duration, 150],
  ["sets per muscle: chest gets bench sets (3+4)", ms.Chest, 7],
  ["helpers get half: triceps 3.5 from bench", ms.Triceps, 3.5],
  ["curls count for biceps (2) + bench rows none", ms.Biceps, 2],
  ["distribution: arms = biceps + triceps + grip", R.distribution(ms).Arms, 2 + 3.5],
  ["exercise history newest first", R.exerciseHistory(hist, "bench").map((h) => h.weight).join(), "205,200,185"],
  ["main exercise is bench (3 times)", R.mainExercises(hist)[0].lift + R.mainExercises(hist)[0].times, "bench3"],
  ["one bodyweight per day, newest replaces", wlog.map((e) => e.lbs).join(), "245,242"],
  ["nice axis tops", [37, 120, 2300, 0].map(R.niceMax).join(), "50,200,2500,1"],
];
for (const [label, got, expected] of statTests) {
  if (got !== expected) {
    failed++;
    console.log(`FAIL  ${label}: expected ${expected}, got ${got}`);
  }
}

// Live team progress
const ch = R.channelFrom(Array.from({ length: 24 }, (_, i) => i * 11));
const teamWithCh = R.decodeTeam(R.encodeTeam({ name: "OL", coach: "R", routines: [], ch }));
const card = [
  { lift: "squat", unit: "reps", reps: 5, load: null, rows: [{ type: "normal", reps: 5, lbs: null, done: true }, { type: "normal", reps: 5, lbs: null, done: false }] },
  { lift: "bench", unit: "reps", reps: 5, load: null, rows: [{ type: "normal", reps: 5, lbs: null, done: false }] },
];
const st = R.progressStatus(card);
const msg = (o) => JSON.stringify({ app: "liftday", v: 1, pid: "p1234567", name: "Ethan", state: "lifting", at: 1000, ...o });
let roster = {};
roster = R.applyProgress(roster, R.parseProgress(msg({ state: "lifting", at: 1000, lift: "Squat", ex: 1, exTotal: 2, set: 2, setsInEx: 2, done: 1, total: 3 })));
roster = R.applyProgress(roster, R.parseProgress(msg({ state: "done", at: 2000, workout: "Mon", done: 3, total: 3, lines: [{ lift: "squat", sets: 2, weight: 315 }] })));
roster = R.applyProgress(roster, R.parseProgress(msg({ state: "lifting", at: 1500 }))); // late, older update
roster = R.applyProgress(roster, R.parseProgress(msg({ state: "done", at: 2000, workout: "Mon", done: 3, total: 3 }))); // replayed
roster = R.applyProgress(roster, R.parseProgress(msg({ state: "done", at: 3000, workout: "Wed", done: 2, total: 4, lines: [{ lift: "squat", sets: 1, weight: 325 }] })));
const pp = R.playerProgress(roster.p1234567);
const liveTests = [
  ["channel is valid and url-safe", R.isChannel(ch) && ch.startsWith("liftday-"), true],
  ["team link carries the channel", teamWithCh.ch, ch],
  ["a bad channel in a link is dropped", R.decodeTeam(R.encodeTeam({ name: "OL", routines: [], ch: "short" })).ch, ""],
  ["next set: squat set 2 of 2, exercise 1 of 2", `${st.lift} ${st.set}/${st.setsInEx} ${st.ex}/${st.exTotal}`, "squat 2/2 1/2"],
  ["sets done / total", `${st.done}/${st.total}`, "1/3"],
  ["all checked = finished", R.progressStatus(card.map((e) => ({ ...e, rows: e.rows.map((r) => ({ ...r, done: true })) }))).finished, true],
  ["not Lift Day = ignored", R.parseProgress('{"hello":1}'), null],
  ["junk = ignored", R.parseProgress("not json"), null],
  ["names are cleaned of tags", R.parseProgress(msg({ name: "<b>Ethan</b>" })).name, "bEthan/b"],
  ["huge numbers are zeroed", R.parseProgress(msg({ done: 99999 })).done, 0],
  ["older update doesn't replace the newest", roster.p1234567.last.at, 3000],
  ["a replayed finish isn't counted twice", roster.p1234567.workouts.length, 2],
  ["hit rate: 5 of 7 sets", pp.hitRate, 71],
  ["squat went 315 to 325", `${pp.lifts.squat.first}-${pp.lifts.squat.best}`, "315-325"],
];
for (const [label, got, expected] of liveTests) {
  if (got !== expected) {
    failed++;
    console.log(`FAIL  ${label}: expected ${expected}, got ${got}`);
  }
}

const total = cases.length + 2 + plateCases.length + 2 + extra.length + lib2.length + fun.length + rec.length + rowsTests.length + last.length + failTests.length + newTests.length + statTests.length + liveTests.length;
console.log(failed ? `${failed} check(s) failed` : `All ${total} checks passed`);
process.exit(failed ? 1 : 0);
