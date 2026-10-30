// Lift Day
// Turns "sets x reps at % of max" into the weight you actually load.
// Three layers: DATA (what we store), RULES (the math and checks), DISPLAY (the page).
// The lift library itself lives in lifts.js (DATA) and the lift pictures in figures.js (DISPLAY).

// =====================================================================
// DATA: settings, limits, and saving to the browser
// =====================================================================

const ROUND_TO = 5; // lbs: a pair of 2.5s is the smallest jump on a standard bar
const BAR = 45; // lbs
const PLATES = [45, 35, 25, 10, 5, 2.5]; // a standard US weight room, heaviest first
const BAR_OPTIONS = [45, 35, 15]; // standard, women's/shorter, technique bar
const REST_DEFAULT = 150; // seconds: 2:30 between sets
const PLATE_LIFTS = ["barbell"]; // equipment that gets the loaded-bar drawing

const LIMITS = {
  max: [45, 1500], // a max can't be lighter than the empty bar
  bodyweight: [80, 500],
  height: [36, 96], // inches (3 ft to 8 ft)
  sets: [1, 20],
  reps: [1, 50],
  sec: [5, 600],
  min: [1, 180],
  pct: [1, 120],
  lbs: [1, 1500],
  estimateWeight: [1, 1500],
  estimateReps: [1, 12], // estimates get unreliable past about 12 reps
  liftName: [1, 40], // characters
};

// localStorage can be blocked (private mode), so never let it crash the page.
function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

// =====================================================================
// RULES: the math, search, and input checks (no page code, so tests can run them)
// =====================================================================

// ---------- Weights and plates ----------

// Round to the nearest loadable weight. 236.25 -> 235, 238 -> 240, ties round up.
// Loads go up in steps FROM THE BAR: with 10 lb jumps on a 45 bar you can load 195 or 205, not 200.
function roundToLoadable(weight, step = ROUND_TO, bar = BAR) {
  return bar + Math.round((weight - bar) / step) * step;
}

// The smallest jump your plates allow: two of your lightest plate. No 2.5s -> 10 lb jumps.
function loadStep(plates = PLATES) {
  return plates.length ? 2 * Math.min(...plates) : ROUND_TO;
}

function setWeight(max, pct, step = ROUND_TO, bar = BAR) {
  return roundToLoadable((max * pct) / 100, step, bar);
}

// Plates to put on EACH side, heaviest first, using only the plates you own.
// 235 on a 45 bar -> [45, 45, 5]. [] = just the bar. null = lighter than the bar.
function platesPerSide(weight, bar = BAR, plates = PLATES) {
  if (weight < bar) return null;
  let left = (weight - bar) / 2;
  const result = [];
  for (const p of [...plates].sort((a, b) => b - a)) {
    while (left >= p) {
      result.push(p);
      left -= p;
    }
  }
  return result;
}

// What the bar actually weighs with those plates on both sides.
function loadedWeight(bar, platesEachSide) {
  return bar + 2 * platesEachSide.reduce((sum, p) => sum + p, 0);
}

// Estimated 1-rep max from a set you did (Epley formula), rounded to 5 lbs.
// 225 x 5 -> 262.5 -> 265. A single (1 rep) is your max as-is.
function estimateMax(weight, reps) {
  if (reps === 1) return weight;
  return Math.round((weight * (1 + reps / 30)) / ROUND_TO) * ROUND_TO;
}

// Pound-for-pound: how many times your bodyweight you lift. 315 at 180 -> 1.75.
function bodyweightRatio(max, bodyweight) {
  return Math.round((max / bodyweight) * 100) / 100;
}

// ---------- The lift library ----------

// Turn the rows in lifts.js into lift objects, then add the user's own lifts.
function buildLibrary(rows, groups, customLifts = []) {
  const lifts = rows.map(([id, name, g, equip, pattern, kind]) => ({ id, name, group: groups[g], equip, pattern, kind }));
  return lifts.concat(customLifts);
}

// Lower case, curly quotes straightened, and every way of saying "one arm" made the same.
function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/\b(one|single)[\s-]?(arm|armed|handed|hand)\b/g, "one-arm")
    .replace(/\s+/g, " ")
    .trim();
}

// Search: every word you type has to appear in the lift's name, muscle group, or equipment.
// Shortcuts like "db" or "rdl" are expanded first. Best matches first.
function searchLifts(library, query, synonyms = {}, group = "") {
  const words = normalize(query)
    .split(" ")
    .filter(Boolean)
    .flatMap((w) => normalize(synonyms[w] || w).split(" "));
  const q = normalize(query);
  const results = [];
  for (const lift of library) {
    if (group && lift.group !== group) continue;
    const name = normalize(lift.name);
    const haystack = `${name} ${normalize(lift.group)} ${normalize(lift.equip)}`;
    // "ups" also matches "up", so "pull ups" finds Pull-Up
    if (!words.every((w) => haystack.includes(w) || (w.length >= 3 && w.endsWith("s") && haystack.includes(w.slice(0, -1))))) continue;
    let rank = 3;
    if (q && name === q) rank = 0;
    else if (q && name.startsWith(q)) rank = 1;
    else if (words.length && name.split(/[\s-]/).some((part) => part.startsWith(words[0]))) rank = 2;
    results.push({ lift, rank });
  }
  results.sort((a, b) => a.rank - b.rank || a.lift.name.length - b.lift.name.length || a.lift.name.localeCompare(b.lift.name));
  return results.map((r) => r.lift);
}

// Your own lift names: trimmed, 1 to 40 characters, not already in the library.
function checkLiftName(name, existingNames) {
  const clean = name.trim().replace(/\s+/g, " ");
  if (!inRange(clean.length, LIMITS.liftName)) return { error: "Name it in 1 to 40 characters." };
  if (existingNames.some((n) => n.toLowerCase() === clean.toLowerCase())) return { error: `${clean} is already in the list.` };
  return { name: clean };
}

function liftIdFromName(name) {
  return "custom-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ---------- Card lines ----------
// A line on the card (one exercise):
//   { lift, unit: "reps" | "sec" | "min", reps, load: { type: "pct" | "lbs", value } | null,
//     rows: [{ type: "normal" | "warmup" | "failure" | "drop", reps, lbs, done }] }
// A failure set has no rep count (reps: null): you go until you can't.
// Each row is one set. A row's lbs is null when it uses the exercise's load (e.g. 75% of your max).
// "reps" holds the seconds or minutes for timed lifts. sets = rows.length.

const SET_TYPES = ["warmup", "normal", "failure", "drop"];
const SET_LETTER = { warmup: "W", failure: "F", drop: "D" };

// Older saved cards used { sets, reps, pct } or { sets, reps, load, done: [] }. Turn them into rows.
function normEntry(raw) {
  let e = raw;
  if (e.load === undefined) e = { ...e, unit: "reps", load: e.pct !== undefined ? { type: "pct", value: e.pct } : null };
  if (!Array.isArray(e.rows)) {
    const done = Array.isArray(e.done) ? e.done : [];
    e = { ...e, rows: Array.from({ length: e.sets || 1 }, (_, i) => ({ type: "normal", reps: e.reps, lbs: null, done: Boolean(done[i]) })) };
  }
  return { ...e, unit: e.unit || "reps", sets: e.rows.length };
}

// The unit and load a lift kind uses
function unitFor(kind) {
  return { weight: "reps", reps: "reps", time: "sec", cardio: "min" }[kind] || "reps";
}

// Weight for the whole exercise: a number, null when it needs a max you haven't entered, undefined when it has no weight.
function entryWeight(entry, maxes, step = ROUND_TO, bar = BAR) {
  const e = normEntry(entry);
  if (!e.load) return undefined;
  if (e.load.type === "lbs") return e.load.value;
  return maxes[e.lift] ? setWeight(maxes[e.lift], e.load.value, step, bar) : null;
}

// Weight for one set: the number typed in that row, or the exercise's weight.
function rowWeight(entry, row, maxes, step = ROUND_TO, bar = BAR) {
  if (typeof row.lbs === "number") return row.lbs;
  return entryWeight(entry, maxes, step, bar);
}

// Set labels: warm-ups are W, failure F, drop D, and normal sets are numbered 1, 2, 3...
function setLabels(rows) {
  let n = 0;
  return rows.map((r) => SET_LETTER[r.type] || String(++n));
}

function inRange(value, [low, high]) {
  return value >= low && value <= high;
}

// Returns a list of [field, message] problems. Empty list = OK.
function checkEntry(entry) {
  const e = normEntry(entry);
  const problems = [];
  const unit = e.unit;
  const label = { reps: "Reps must be 1 to 50.", sec: "Seconds must be 5 to 600.", min: "Minutes must be 1 to 180." }[unit];
  if (unit !== "min" && !inRange(e.rows.length, LIMITS.sets)) problems.push(["sets", "Sets must be 1 to 20."]);
  const badReps = (r) => (r.type === "failure" ? r.reps !== null && r.reps !== undefined && !inRange(r.reps, LIMITS[unit]) : !inRange(r.reps, LIMITS[unit]));
  if (!inRange(e.reps, LIMITS[unit]) || e.rows.some(badReps)) problems.push(["reps", label]);
  if (e.load && e.load.type === "pct" && !inRange(e.load.value, LIMITS.pct)) problems.push(["load", "Percent must be 1 to 120."]);
  if (e.load && e.load.type === "lbs" && !inRange(e.load.value, LIMITS.lbs)) problems.push(["load", "Weight must be 1 to 1500 lbs."]);
  if (e.rows.some((r) => !SET_TYPES.includes(r.type) || (r.lbs !== null && r.lbs !== undefined && !inRange(r.lbs, [0, 1500])))) problems.push(["load", "A set has a weight or type that doesn't fit."]);
  return problems;
}

function isValidMax(value) {
  return inRange(value, LIMITS.max);
}

function isValidBodyweight(value) {
  return inRange(value, LIMITS.bodyweight);
}

// Height from feet + inches. 5 ft 11 in -> 71. Returns null if it isn't a real height.
function heightInches(feet, inches) {
  const total = Number(feet) * 12 + Number(inches || 0);
  return Number.isFinite(total) && inRange(total, LIMITS.height) && Number(inches || 0) < 12 ? total : null;
}

function heightText(total) {
  return total ? `${Math.floor(total / 12)} ft ${total % 12} in` : "";
}

function checkEstimate(weight, reps) {
  const problems = [];
  if (!inRange(weight, LIMITS.estimateWeight)) problems.push("Enter the weight you lifted.");
  if (!inRange(reps, LIMITS.estimateReps)) problems.push("Use a set of 1 to 12 reps.");
  return problems;
}

// The heaviest working set on the card for each lift (the "top set"). Warm-ups don't count.
function topWeights(entries, maxes, step = ROUND_TO, bar = BAR) {
  const tops = {};
  for (const raw of entries) {
    const e = normEntry(raw);
    for (const r of e.rows) {
      if (r.type === "warmup") continue;
      const w = rowWeight(e, r, maxes, step, bar);
      if (typeof w !== "number") continue;
      if (!(e.lift in tops) || w > tops[e.lift]) tops[e.lift] = w;
    }
  }
  return tops;
}

// Every set on the card in order, with its weight. Used to find the next set to do.
function allSets(entries, maxes, step = ROUND_TO, bar = BAR) {
  const sets = [];
  entries.forEach((raw, entryIndex) => {
    const e = normEntry(raw);
    e.rows.forEach((r, s) => {
      sets.push({
        entryIndex,
        setIndex: s,
        lift: e.lift,
        reps: r.reps,
        unit: e.unit,
        type: r.type,
        weight: rowWeight(e, r, maxes, step, bar),
        done: Boolean(r.done),
      });
    });
  });
  return sets;
}

function nextSet(entries, maxes, step = ROUND_TO, bar = BAR) {
  return allSets(entries, maxes, step, bar).find((s) => !s.done) || null;
}

// What you actually did today, for the history log.
// Volume = weight x reps over every working set you checked off (warm-ups don't count).
function daySummary(entries, maxes, step = ROUND_TO, bar = BAR) {
  const lines = [];
  let sets = 0;
  let volume = 0;
  for (const raw of entries) {
    const e = normEntry(raw);
    const done = e.rows.filter((r) => r.done);
    if (!done.length) continue;
    const weights = done.map((r) => rowWeight(e, r, maxes, step, bar));
    if (weights.some((w) => w === null)) continue; // needed a max that was never entered
    const top = weights.some((w) => typeof w === "number") ? Math.max(...weights.filter((w) => typeof w === "number")) : undefined;
    const counted = done.filter((r) => typeof r.reps === "number");
    lines.push({ lift: e.lift, sets: done.length, reps: counted.length ? counted[counted.length - 1].reps : "failure", unit: e.unit, weight: top });
    sets += done.length;
    done.forEach((r, i) => {
      if (r.type !== "warmup" && typeof weights[i] === "number" && typeof r.reps === "number" && e.unit === "reps") volume += r.reps * weights[i];
    });
  }
  return { lines, sets, volume };
}

// How a line reads: "4 × 5 at 75%", "3 × 12", "3 × 45 sec", "20 min", "1 warm-up + 3 × 5 at 75%",
// "3 × 8 + 1 to failure", "2 to failure"
function schemeText(entry) {
  const e = normEntry(entry);
  if (e.unit === "min") return `${e.rows[0] ? e.rows[0].reps : e.reps} min`;
  const warm = e.rows.filter((r) => r.type === "warmup").length;
  const fail = e.rows.filter((r) => r.type === "failure").length;
  const working = e.rows.filter((r) => r.type !== "warmup" && r.type !== "failure");
  const sameReps = working.every((r) => r.reps === working[0].reps);
  const repText = sameReps && working.length ? working[0].reps : e.reps;
  const parts = [];
  if (working.length) parts.push(`${working.length} × ${repText}${e.unit === "sec" ? " sec" : ""}`);
  if (fail) parts.push(`${fail} to failure`);
  const base = `${warm ? `${warm} warm-up + ` : ""}${parts.join(" + ") || "0 sets"}`;
  if (!e.load) return base;
  return e.load.type === "pct" ? `${base} at ${e.load.value}%` : `${base} at ${e.load.value} lbs`;
}

// A blank exercise with n sets
function newEntry(lift, sets, reps, unit, load) {
  return { lift, unit, reps, load, rows: Array.from({ length: sets }, () => ({ type: "normal", reps, lbs: null, done: false })), sets };
}

// An exercise from a list of planned sets: [{ type, reps }]. Failure sets get no rep count.
function entryFromPlan(lift, plan, unit, load) {
  const rows = plan.map((p) => ({ type: p.type, reps: p.type === "failure" ? null : p.reps, lbs: null, done: false }));
  const firstCounted = rows.find((r) => typeof r.reps === "number");
  return { lift, unit, reps: firstCounted ? firstCounted.reps : (unit === "sec" ? 30 : 10), load, rows, sets: rows.length };
}

// Changing a set's type. Going to failure drops the rep count; coming back gives it one again.
function changeSetType(entry, row, type) {
  row.type = type;
  if (type === "failure") row.reps = null;
  else if (typeof row.reps !== "number") row.reps = entry.reps;
}

// The same exercises with every set unchecked (for routines and the next workout)
function freshCopy(entries) {
  return entries.map((raw) => {
    const e = normEntry(raw);
    return { lift: e.lift, unit: e.unit, reps: e.reps, load: e.load, rows: e.rows.map((r) => ({ type: r.type, reps: r.reps, lbs: r.lbs ?? null, done: false })), sets: e.rows.length };
  });
}

// The default name for a new routine: "Squat + Bench Press", or "Squat + 3 more"
function routineNameFor(entries, nameOf) {
  const names = [...new Set(entries.map((e) => nameOf(e.lift)))];
  if (!names.length) return "My routine";
  return names.length <= 2 ? names.join(" + ") : `${names[0]} + ${names.length - 1} more`;
}

// ---------- Ranks (Wood to Olympian) ----------
// Bodyweight multiples for Beginner, Novice, Intermediate, Advanced, Elite.
// Squat, bench and deadlift: worked out from Strength Level's 1RM-by-bodyweight tables
// (men at 180-200 lb, women at 140-150 lb), where those levels mean stronger than about
// 5%, 20%, 50%, 80% and 95% of lifters on that site. Overhead press: StrengthLog's tables
// (no percentiles published). The multiples shift a little with bodyweight, so ranks are approximate.
const STANDARDS = {
  squat:            { men: [0.97, 1.28, 1.65, 2.07, 2.51], women: [0.53, 0.81, 1.16, 1.57, 2.02], pct: true },
  bench:            { men: [0.71, 0.94, 1.22, 1.54, 1.88], women: [0.31, 0.51, 0.77, 1.09, 1.44], pct: true },
  deadlift:         { men: [1.12, 1.49, 1.93, 2.43, 2.97], women: [0.64, 0.92, 1.27, 1.67, 2.11], pct: true },
  "overhead-press": { men: [0.40, 0.56, 0.66, 0.77, 0.98], women: [0.22, 0.36, 0.44, 0.53, 0.69], pct: false },
};
const LEVEL_PCT = [5, 20, 50, 80, 95];
const RANKS = ["Wood", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Champion", "Titan", "Olympian"];

// The 8 cut-offs (as bodyweight multiples) between the 9 ranks:
// Bronze = Beginner, Silver = Novice, Gold = halfway to Intermediate, Platinum = Intermediate,
// Diamond = halfway to Advanced, Champion = Advanced, Titan = halfway to Elite, Olympian = Elite.
function rankCutoffs(levels) {
  const [b, n, i, a, e] = levels;
  return [b, n, (n + i) / 2, i, (i + a) / 2, a, (a + e) / 2, e];
}

// Rank for one lift. Returns { rank, index, next: { rank, weight } | null, percent | null }.
// percent = roughly what share of lifters you're stronger than (only where the source publishes it).
function liftRank(liftId, max, bodyweight, sex = "men") {
  const std = STANDARDS[liftId];
  if (!std || !max || !bodyweight) return null;
  const cut = rankCutoffs(std[sex]);
  const ratio = max / bodyweight;
  let index = 0;
  while (index < cut.length && ratio >= cut[index]) index++;
  const next = index < cut.length
    ? { rank: RANKS[index + 1], weight: Math.ceil((cut[index] * bodyweight) / ROUND_TO) * ROUND_TO }
    : null;
  return { rank: RANKS[index], index, next, percent: std.pct ? strongerThan(ratio, std[sex]) : null };
}

// Straight-line estimate between the published levels. Below Beginner it scales down to 0;
// above Elite it creeps toward 99.
function strongerThan(ratio, levels) {
  if (ratio < levels[0]) return Math.max(1, Math.round((LEVEL_PCT[0] * ratio) / levels[0]));
  for (let k = 0; k < levels.length - 1; k++) {
    if (ratio < levels[k + 1]) {
      const f = (ratio - levels[k]) / (levels[k + 1] - levels[k]);
      return Math.round(LEVEL_PCT[k] + f * (LEVEL_PCT[k + 1] - LEVEL_PCT[k]));
    }
  }
  return Math.min(99, Math.round(95 + (4 * (ratio - levels[4])) / (levels[4] * 0.25)));
}

// Overall rank: the average of your lift ranks (only lifts with a max count).
function overallRank(ranks) {
  const r = ranks.filter(Boolean);
  if (!r.length) return null;
  const index = Math.round(r.reduce((s, x) => s + x.index, 0) / r.length);
  return { rank: RANKS[index], index, lifts: r.length };
}

// Did anything rank up? before/after: { overall: index | undefined, lifts: { id: index } }.
// Returns the biggest new rank (the overall rank wins a tie), or null. A first-ever rank counts.
function rankUp(before, after) {
  const ups = [];
  if (after.overall !== undefined && (before.overall === undefined || after.overall > before.overall)) ups.push({ kind: "overall", id: "overall", index: after.overall });
  for (const [id, idx] of Object.entries(after.lifts || {})) {
    const was = (before.lifts || {})[id];
    if (was === undefined || idx > was) ups.push({ kind: "lift", id, index: idx });
  }
  if (!ups.length) return null;
  return ups.sort((a, b) => b.index - a.index || (a.kind === "overall" ? -1 : 1))[0];
}

// How big the celebration is: 0 = pop (Wood-Silver), 1 = rays (Gold-Platinum),
// 2 = shockwave (Diamond-Champion), 3 = confetti (Titan-Olympian)
function celebrationTier(index) {
  return index >= 7 ? 3 : index >= 5 ? 2 : index >= 3 ? 1 : 0;
}

// ---------- Fun volume comparisons ----------
// Rough real-world weights in lbs (averages; real animals vary a lot).
const THINGS = [
  ["golden retriever", "golden retrievers", 65],
  ["adult giant panda", "adult giant pandas", 225],
  ["grizzly bear", "grizzly bears", 600],
  ["grand piano", "grand pianos", 1000],
  ["dairy cow", "dairy cows", 1500],
  ["hippo", "hippos", 3300],
  ["African elephant", "African elephants", 13000],
  ["school bus", "school buses", 25000],
  ["humpback whale", "humpback whales", 66000],
  ["blue whale", "blue whales", 300000],
];

// "15,000 lbs" -> "about 1.2 African elephants". Picks the biggest thing you lifted at least one of.
function volumeComparison(lbs) {
  if (!lbs || lbs < 30) return null;
  let pick = THINGS[0];
  for (const t of THINGS) if (lbs / t[2] >= 1) pick = t;
  const count = lbs / pick[2];
  const shown = count < 2 ? Math.round(count * 10) / 10 : Math.round(count);
  return { count: shown, thing: shown === 1 ? pick[0] : pick[1], text: `about ${shown} ${shown === 1 ? pick[0] : pick[1]}` };
}

// ---------- Just Log: "bench 185 for 8" ----------
// Returns { query, weight, reps, unit } or { error }. Numbers: "185 for 8", "185x8", "185 x 8", "60 sec", "20 min", "12".
function parseQuickLog(text) {
  const t = text.toLowerCase().replace(/×/g, "x").replace(/,/g, " ").trim();
  if (!t) return { error: "Type a lift and what you did, like “bench 185 for 8”." };
  let weight = null, reps = null, unit = "reps", rest = t;
  let m = t.match(/(\d+(?:\.\d+)?)\s*(?:lbs?|pounds?)?\s*(?:for|x|by|times)\s*(\d+)\s*(?:reps?)?/);
  if (m) {
    weight = Number(m[1]); reps = Number(m[2]); rest = t.replace(m[0], " ");
  } else if ((m = t.match(/(\d+)\s*(seconds?|secs?|s|minutes?|mins?|m)\b/))) {
    reps = Number(m[1]); unit = /^m/.test(m[2]) ? "min" : "sec"; rest = t.replace(m[0], " ");
  } else if ((m = t.match(/(\d+)\s*(?:reps?)?\s*$/))) {
    reps = Number(m[1]); rest = t.replace(m[0], " ");
  }
  const query = rest.replace(/\b(for|x|reps?|lbs?|pounds?|did|i|just|of|at)\b/g, " ").replace(/\s+/g, " ").trim();
  if (!query) return { error: "Which lift? Try “squat 225 for 5”." };
  if (reps === null) return { error: `How many? Try “${query} 135 for 10” or “${query} 12”.` };
  return { query, weight, reps, unit };
}

// Find the lift for a quick log: your own lifts first, then the whole library.
function matchLift(query, myLiftObjects, library, synonyms = {}) {
  return searchLifts(myLiftObjects, query, synonyms)[0] || searchLifts(library, query, synonyms)[0] || null;
}

// ---------- Team links (no server: the whole team rides in the link) ----------
function toBase64Url(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(code) {
  const bin = atob(code.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

function encodeTeam(team) {
  return toBase64Url(JSON.stringify({ v: 1, name: team.name, coach: team.coach || "", routines: team.routines || [], custom: team.custom || [] }));
}

// Accepts a full link or just the code. Returns a checked team, or null if it isn't a valid team link.
function decodeTeam(input) {
  try {
    const code = (input.match(/team=([A-Za-z0-9_-]+)/) || [null, input.trim()])[1];
    const t = JSON.parse(fromBase64Url(code));
    if (t.v !== 1 || typeof t.name !== "string" || !t.name.trim() || t.name.length > 40 || !Array.isArray(t.routines) || t.routines.length > 30) return null;
    for (const r of t.routines) {
      if (typeof r.name !== "string" || !Array.isArray(r.lines) || r.lines.length > 30) return null;
      for (const l of r.lines) if (typeof l.lift !== "string" || checkEntry(l).length) return null;
    }
    return { name: t.name.trim(), coach: String(t.coach || "").slice(0, 40), routines: t.routines, custom: Array.isArray(t.custom) ? t.custom : [] };
  } catch {
    return null;
  }
}

// ---------- Ghost of your last session ----------
// The same workout = the same lines in the same order.
function cardSignature(entries) {
  return entries.map((raw) => {
    const e = normEntry(raw);
    return `${e.lift}:${e.rows.map((r) => `${r.type[0]}${r.reps}${r.lbs ?? ""}`).join(".")}${e.unit}:${e.load ? e.load.type + e.load.value : "-"}`;
  }).join("|");
}

// How many sets the ghost had finished after this many seconds.
function ghostSetsAt(ghostSets, seconds) {
  return ghostSets.filter((g) => g.elapsed <= seconds).length;
}

// ---------- Muscle recovery ----------
// Hours until a muscle group is ready again: [almost ready (yellow) from, fully ready (green) at].
// Ranges follow common recovery guidance: abs 24 h, biceps 24-48, forearms 24, calves 24-48, triceps 48,
// shoulders 48, chest 48-72, back 48-72, legs (quads, hamstrings, glutes) 48-72, up to 96 after heavy
// squats or deadlifts. Where the guidance gives one number, yellow starts at 3/4 of it.
const RECOVERY = {
  Abs: [18, 24],
  Biceps: [24, 48],
  "Grip & forearms": [18, 24],
  Calves: [24, 48],
  Triceps: [36, 48],
  Shoulders: [36, 48],
  Chest: [48, 72],
  Back: [48, 72],
  Legs: [48, 72],
  Neck: [18, 24],
};
const HEAVY_LEGS = [72, 96];
const HEAVY_EQUIP = ["barbell", "trap bar", "Smith machine"];

// Which recovery groups a lift works. Glutes count as legs. Heavy barbell squats and
// deadlifts also tax the legs for longer.
function musclesFor(lift) {
  if (!lift || lift.group === "Cardio" || lift.group === "My lifts") return [];
  const base = lift.group === "Glutes" ? "Legs" : lift.group;
  const barbell = HEAVY_EQUIP.includes(lift.equip) && lift.kind === "weight";
  const out = [{ group: base, heavy: false }];
  if (barbell && (lift.pattern === "squat" || lift.pattern === "hinge")) {
    out.length = 0;
    if (base !== "Legs") out.push({ group: base, heavy: false });
    out.push({ group: "Legs", heavy: true });
  } else if (barbell && (lift.pattern === "frontrack" || lift.pattern === "overhead") && base === "Back") {
    out.push({ group: "Legs", heavy: false });
  }
  return out;
}

// Status of one group given when it was last trained.
// "rest" (red) = still recovering, "almost" (yellow), "ready" (green).
function recoveryStatus(group, lastTrained, heavy, now) {
  const [almost, ready] = heavy && group === "Legs" ? HEAVY_LEGS : RECOVERY[group] || [18, 24];
  if (!lastTrained) return { status: "ready", hoursAgo: null, readyIn: 0 };
  const hoursAgo = (now - lastTrained) / 3600000;
  const status = hoursAgo >= ready ? "ready" : hoursAgo >= almost ? "almost" : "rest";
  return { status, hoursAgo, readyIn: Math.max(0, ready - hoursAgo) };
}

// "under 1 h", "20 h", "2.5 days" (read with "ago" or "ready in")
function hoursText(h) {
  if (h < 1) return "under 1 h";
  if (h < 48) return `${Math.round(h)} h`;
  return `${Math.round((h / 24) * 2) / 2} days`;
}

if (typeof module !== "undefined") {
  module.exports = {
    roundToLoadable, loadStep, setWeight, platesPerSide, loadedWeight, estimateMax, bodyweightRatio,
    buildLibrary, normalize, searchLifts, checkLiftName, liftIdFromName, normEntry, unitFor, entryWeight,
    SET_TYPES, rowWeight, setLabels, newEntry, entryFromPlan, changeSetType, freshCopy, routineNameFor,
    checkEntry, isValidMax, isValidBodyweight, checkEstimate, topWeights, allSets, nextSet, daySummary, schemeText,
    STANDARDS, RANKS, rankCutoffs, liftRank, strongerThan, overallRank, volumeComparison, parseQuickLog, matchLift,
    encodeTeam, decodeTeam, cardSignature, ghostSetsAt, heightInches, heightText, rankUp, celebrationTier, REST_DEFAULT, RECOVERY, musclesFor, recoveryStatus, hoursText,
  };
}

// =====================================================================
// DISPLAY: drawing the page and handling taps
// =====================================================================

if (typeof document !== "undefined") {
  // ---------- State (loaded from DATA) ----------
  let mode = load("liftday.mode", null); // "personal" | "team" | null (first visit)
  let maxes = load("liftday.maxes", {});
  let entries = load("liftday.card", []).map(normEntry);
  let bodyweight = load("liftday.bodyweight", null);
  let height = load("liftday.height", null); // inches
  let restSeconds = load("liftday.rest", REST_DEFAULT);
  let gym = load("liftday.gym", { bar: BAR, plates: [...PLATES] });
  let customLifts = load("liftday.lifts", []).map((l) => ({ group: "My lifts", equip: "other", pattern: "stand", kind: "weight", ...l }));
  let history = load("liftday.history", []);
  let prs = load("liftday.prs", []);
  let role = load("liftday.role", null); // team mode: "coach" | "player"
  let team = load("liftday.team", null); // coach: the team you run; player: the team you joined
  let bests = load("liftday.bests", {}); // best estimated max per lift, from logged sets
  let ghosts = load("liftday.ghosts", {}); // your last full session of each workout
  let session = load("liftday.session", null); // today's sets as you do them: { start, sets: [] }
  let sex = load("liftday.sex", "men"); // which strength standards to rank against
  let hype = load("liftday.hype", "airhorn"); // PR sound: airhorn | bell | off
  let routines = load("liftday.routines", []); // your saved routines: [{ name, lines }]
  let cardRoutine = load("liftday.cardRoutine", null); // the routine today's card came from, if any
  let previous = load("liftday.previous", {}); // last time's sets per lift: { lift: [{ lbs, reps }] }
  let muscleLog = load("liftday.muscles", {}); // last time each muscle group was trained: { group: { at, heavy } }
  let pendingTeam = typeof location !== "undefined" ? decodeTeam(location.hash) : null; // opened a team link
  let joinPreview = pendingTeam;

  let library = [];
  let liftMap = new Map();
  function rebuildLibrary() {
    library = buildLibrary(LIFT_ROWS, LIFT_GROUPS, customLifts);
    liftMap = new Map(library.map((l) => [l.id, l]));
  }
  rebuildLibrary();

  // Your picked lifts. Older versions had no picker, so carry over whatever was already in use.
  let myLifts = load("liftday.myLifts", null);
  if (!myLifts) {
    myLifts = mode ? [...new Set([...entries.map((e) => e.lift), ...Object.keys(maxes), ...customLifts.map((l) => l.id)])].filter((id) => liftMap.has(id)) : [];
    if (mode) save("liftday.myLifts", myLifts);
  }

  let rest = null; // { endAt, total, over } while resting
  let restTick = null;
  let lastBarKey = null;
  let audio = null;
  let setupStep = mode ? null : "choose"; // "choose" or an index into setupSteps()
  let finishNote = "";
  let loadType = "pct";
  let rankCalcOpen = false; // the Get your rank calculator on the Ranks tab
  let plan = [{ type: "normal", reps: 5 }]; // the sets in the Add exercise form, before they go on the card
  let newArmed = null; // timer while "Tap again to clear" is showing
  let armedFor = null; // which button is asking: "workout" or "routine"
  let routineDraft = false; // building a routine instead of doing a workout
  const MAX_PLAN_SETS = 10;
  const PLAN_TYPES = [["warmup", "Warm-up set"], ["normal", "Normal set"], ["failure", "Failure set"], ["drop", "Drop set"]];


  const $ = (id) => document.getElementById(id);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isPersonal = () => mode === "personal";
  const liftById = (id) => liftMap.get(id) || { id, name: "Removed lift", group: "", equip: "other", pattern: "stand", kind: "weight" };
  const liftName = (id) => liftById(id).name;
  const myLiftObjects = () => myLifts.map(liftById);
  const weightLifts = () => myLiftObjects().filter((l) => l.kind === "weight");
  const bar = () => (isPersonal() ? gym.bar : BAR);
  const plates = () => (isPersonal() ? gym.plates : PLATES);
  const step = () => loadStep(plates());
  const shortDate = (iso) => new Date(iso).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const equipLabel = (l) => (l.group === "Cardio" ? "machine" : l.equip === "other" ? "your own lift" : l.equip);

  $("today").textContent = shortDate(new Date().toISOString());

  // ---------- Icons + barbell drawing ----------
  const X_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor"
    stroke-width="2.25" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`;
  const CHECK_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor"
    stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`;
  const PLUS_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor"
    stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>`;
  const SEARCH_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor"
    stroke-width="2.25" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L20 20"/></svg>`;

  // Plate sizes in the drawing: [width, height]
  const PLATE_SIZE = { 45: [15, 112], 35: [13, 98], 25: [12, 82], 10: [9, 60], 5: [7, 46], 2.5: [6, 36] };

  function barbellSVG(load) {
    const mid = 65;
    let left = "", right = "";
    let lx = 104, rx = 296; // plates stack outward from each collar
    load.forEach((p, i) => {
      const [w, h] = PLATE_SIZE[p];
      const cls = `plate p${String(p).replace(".", "_")}`;
      lx -= w;
      left += `<rect class="${cls}" data-i="${i}" data-side="-1" x="${lx}" y="${mid - h / 2}" width="${w}" height="${h}" rx="2"/>`;
      right += `<rect class="${cls}" data-i="${i}" data-side="1" x="${rx}" y="${mid - h / 2}" width="${w}" height="${h}" rx="2"/>`;
      rx += w;
    });
    return `<svg class="barbell" viewBox="0 0 400 130" role="img" aria-label="Barbell loaded with ${load.length ? load.join(", ") + " on each side" : "no plates"}">
      <rect class="sleeve" x="8" y="58" width="96" height="14" rx="3"/>
      <rect class="sleeve" x="296" y="58" width="96" height="14" rx="3"/>
      <rect class="shaft" x="112" y="62" width="176" height="6" rx="3"/>
      <rect class="collar" x="104" y="52" width="8" height="26" rx="2"/>
      <rect class="collar" x="288" y="52" width="8" height="26" rx="2"/>
      ${left}${right}
    </svg>`;
  }

  // Plates slide onto the sleeves, heaviest first (Emil: 200ms ease-out, 40ms stagger)
  function loadPlates(svg) {
    for (const plate of svg.querySelectorAll(".plate")) {
      const side = Number(plate.dataset.side);
      plate.animate(
        reduceMotion
          ? [{ opacity: 0 }, { opacity: 1 }]
          : [{ transform: `translateX(${side * 36}px)`, opacity: 0 }, { transform: "none", opacity: 1 }],
        { duration: 200, delay: Number(plate.dataset.i) * 40, easing: "cubic-bezier(0.23, 1, 0.32, 1)", fill: "backwards" }
      );
    }
  }

  // =================================================================
  // First visit: Personal or Team, then pick lifts (+ a short setup for Personal)
  // =================================================================

  const setupSteps = () => {
    if (isPersonal()) return ["bw", "gym"];
    if (pendingTeam && role === "player") return ["join"];
    if (role === "coach") return ["role", "teamname"];
    if (role === "player") return ["role", "join"];
    return ["role"];
  };

  function renderSetup() {
    const box = $("onboarding");
    if (setupStep === "choose") {
      box.innerHTML = `<div class="ob-inner">
        <h1 class="ob-title">Lift Day</h1>
        <p class="ob-lead">Your program says a percent. Lift Day tells you the weight, loads the bar for you, and times your rest.</p>
        <h2>Who's lifting?</h2>
        <div class="choices">
          <button type="button" class="choice" data-choose="personal">
            <span class="choice-name">Just me</span>
            <span class="choice-desc">Your own training. Pick your lifts, set up your maxes and your gym, and keep a log of your lift days and PRs.</span>
          </button>
          <button type="button" class="choice" data-choose="team">
            <span class="choice-name">My team</span>
            <span class="choice-desc">Your coach writes the program. Pick the lifts your team does and get every set's weight.</span>
          </button>
        </div>
        <p class="hint">You can switch anytime.</p>
      </div>`;
      return;
    }

    const steps = setupSteps();
    const name = steps[setupStep];
    const last = setupStep === steps.length - 1;
    const content = {
      bw: {
        title: "About you",
        why: "Your height and weight. Bodyweight powers your pound-for-pound strength and your ranks. Both are optional and stay on this phone.",
        body: heightWeightHTML("ob"),
      },
      lifts: {
        title: "Pick your lifts",
        why: `Search ${library.length - customLifts.length} lifts or start with the recommended ones. Change them anytime in Profile.`,
        body: `<div class="picker" id="ob-picker"></div>`,
      },
      maxes: {
        title: "Your maxes",
        why: "Percent-based sets are a percent of these. Don't know one? Tap Estimate and enter a set you've done recently.",
        body: weightLifts().length
          ? `<div class="max-list" id="ob-maxes">${maxRowsHTML("ob")}</div>`
          : `<div class="empty-box"><p class="empty-title">Nothing to set</p><p class="hint">None of your lifts use weights. Add some in Profile later and their maxes show up there.</p></div>`,
      },
      gym: {
        title: "Your gym",
        why: "So the bar on screen matches yours. Barbell weights round to what you can actually load.",
        body: `<div id="ob-gym">${gymHTML()}</div>`,
      },
      role: {
        title: "Coach or player?",
        why: "Coaches build the team's workouts and share them. Players join a team and get every set's weight from their own maxes.",
        body: `<div class="choices">
            <button type="button" class="choice" data-role="coach" aria-pressed="${role === "coach"}">
              <span class="choice-name">Coach</span>
              <span class="choice-desc">Create your team, build workouts, and send players a link to join.</span>
            </button>
            <button type="button" class="choice" data-role="player" aria-pressed="${role === "player"}">
              <span class="choice-name">Player</span>
              <span class="choice-desc">Find your team with the link or code your coach sent you.</span>
            </button>
          </div>`,
      },
      teamname: {
        title: "Create your team",
        why: "Players see this name when they join. You'll build workouts on the Workout tab, then share a link.",
        body: `<div class="stack">
            <label class="field"><span>Team name</span><input id="team-name" maxlength="40" placeholder="Edinboro O-Line" value="${escapeHTML((team && team.name) || "")}"></label>
            <label class="field"><span>Your name (shown to players)</span><input id="coach-name" maxlength="40" placeholder="Coach Smith" value="${escapeHTML((team && team.coach) || "")}"></label>
          </div>`,
      },
      join: {
        title: "Find your team",
        why: "Paste the team link or code your coach sent you. No link yet? Ask your coach, or skip for now and join later on the Team tab.",
        body: `<div id="ob-join"></div>`,
      },
    }[name];

    box.innerHTML = `<div class="ob-inner">
      <div class="ob-top">
        <p class="ob-count">${steps.length > 1 ? `Step ${setupStep + 1} of ${steps.length}` : ""}</p>
        <button type="button" class="link" data-setup="skip">${steps.length > 1 ? "Skip setup" : "Skip for now"}</button>
      </div>
      ${steps.length > 1 ? `<div class="ob-progress" aria-hidden="true">${steps.map((_, n) => `<span class="${n <= setupStep ? "on" : ""}"></span>`).join("")}</div>` : `<div class="ob-progress-gap"></div>`}
      <h2 class="ob-step-title" tabindex="-1">${content.title}</h2>
      <p class="hint">${content.why}</p>
      ${content.body}
      <p class="status" id="ob-status" aria-live="polite"></p>
      <div class="ob-actions">
        <button type="button" class="secondary" data-setup="back">Back</button>
        ${name === "join"
          ? `<button type="button" class="secondary" data-setup="next">Join later</button>`
          : `<button type="button" class="primary" data-setup="next">${last ? "Start lifting" : "Next"}</button>`}
      </div>
    </div>`;
    if (name === "lifts") renderPicker("ob-picker");
    if (name === "join") renderJoin($("ob-join"));
    updateRatios();
    box.querySelector(".ob-step-title").focus();
  }

  function finishSetup() {
    if (isPersonal()) save("liftday.setupSeen", true);
    if (role === "coach" && team) save("liftday.team", team);
    save("liftday.myLifts", myLifts);
    setupStep = null;
    showApp();
  }

  $("onboarding").addEventListener("click", (e) => {
    const choose = e.target.closest("[data-choose]");
    if (choose) {
      mode = choose.dataset.choose;
      save("liftday.mode", mode);
      setupStep = 0;
      return renderSetup();
    }
    const roleBtn = e.target.closest("[data-role]");
    if (roleBtn) {
      role = roleBtn.dataset.role;
      save("liftday.role", role);
      if (role === "coach" && !(team && team.coach !== undefined && team.routines)) team = { name: "", coach: "", routines: [] };
      if (role === "player" && team && team.routines && !team.joined) team = null;
      setupStep = 1;
      return renderSetup();
    }
    const nav = e.target.closest("[data-setup]");
    if (!nav) return;
    const action = nav.dataset.setup;
    const current = setupSteps()[setupStep];
    if (action === "next" && current === "role" && !role) return showStatus("Pick Coach or Player.");
    if (action === "next" && current === "teamname") {
      const name = $("team-name").value.trim();
      if (!name) return showStatus("Give your team a name.");
      team = { ...(team || { routines: [] }), name, coach: $("coach-name").value.trim() };
      save("liftday.team", team);
    }
    if (action === "skip") return finishSetup();
    if (action === "back") {
      if (pendingTeam && current === "join") pendingTeam = null;
      setupStep = setupStep === 0 ? "choose" : setupStep - 1;
    }
    if (action === "next") {
      if (setupStep === setupSteps().length - 1) return finishSetup();
      setupStep += 1;
    }
    renderSetup();
  });

  // =================================================================
  // The lift picker (setup + Lifts tab): your lifts, search, pictures
  // =================================================================

  const pickers = {}; // per picker: { query, group, limit }

  function renderPicker(id) {
    const el = $(id);
    if (!el) return;
    const st = (pickers[id] = pickers[id] || { query: "", group: "", limit: 24 });
    el.innerHTML = `
      <div class="mine"></div>
      <label class="search">
        ${SEARCH_ICON}
        <span class="sr-only">Search lifts</span>
        <input type="search" class="lift-search" value="${st.query.replace(/"/g, "&quot;")}" placeholder="Search: squat, cable row, one-arm…" autocomplete="off" enterkeyhint="search">
      </label>
      <div class="group-chips" role="group" aria-label="Filter by muscle group">
        ${["", ...LIFT_GROUPS].map((g) => `<button type="button" class="group-chip" data-group="${g}" aria-pressed="${st.group === g}">${g || "All"}</button>`).join("")}
      </div>
      <p class="status picker-status" aria-live="polite"></p>
      <div class="results-area"></div>`;
    renderMine(el);
    renderResults(el);
  }

  function renderMine(el) {
    const mine = myLiftObjects();
    el.querySelector(".mine").innerHTML = `
      <p class="picker-sub">Your lifts <span class="count">${mine.length}</span></p>
      ${mine.length
        ? `<ul class="mine-list">${mine.map((l) => `<li class="mine-chip">${figureSVG(l.pattern, l.equip, "chip-fig")}<span>${l.name}</span>
            <button type="button" class="mine-x" data-unpick="${l.id}" aria-label="Remove ${l.name}">${X_ICON}</button></li>`).join("")}</ul>`
        : `<p class="hint">None yet. Tap a lift below to add it.</p>`}`;
  }

  function resultItem(l) {
    const picked = myLifts.includes(l.id);
    return `<li><button type="button" class="result" data-pick="${l.id}" aria-pressed="${picked}">
      ${figureSVG(l.pattern, l.equip, "thumb")}
      <span class="r-text"><span class="r-name">${l.name}</span><span class="r-meta">${l.group} · ${equipLabel(l)}</span></span>
      <span class="r-add" aria-hidden="true">${picked ? CHECK_ICON : PLUS_ICON}</span>
    </button></li>`;
  }

  function renderResults(el) {
    const st = pickers[el.id];
    const area = el.querySelector(".results-area");
    const searching = st.query.trim() || st.group;
    if (!searching) {
      const recs = RECOMMENDED[mode || "personal"].map(liftById).filter((l) => l.group);
      area.innerHTML = `<p class="picker-sub">Recommended</p><ul class="results">${recs.map(resultItem).join("")}</ul>
        <p class="hint small">Or search the full list of ${library.length} lifts, or tap a muscle group.</p>`;
      return;
    }
    const found = searchLifts(library, st.query, SEARCH_SYNONYMS, st.group);
    const shown = found.slice(0, st.limit);
    const q = st.query.trim();
    const exact = q && library.some((l) => l.name.toLowerCase() === q.toLowerCase());
    area.innerHTML = `<p class="picker-sub">${found.length} ${found.length === 1 ? "lift" : "lifts"}${st.group ? ` in ${st.group}` : ""}</p>
      ${found.length
        ? `<ul class="results">${shown.map(resultItem).join("")}</ul>`
        : `<div class="empty-box"><p class="empty-title">No lift matches “${escapeHTML(q)}”</p><p class="hint">Check the spelling, try fewer words, or add it as your own below.</p></div>`}
      ${found.length > shown.length ? `<button type="button" class="secondary more" data-more>Show ${Math.min(24, found.length - shown.length)} more</button>` : ""}
      ${q && !exact ? `<div class="own">
          <p class="own-q">Can't find it? Add “${escapeHTML(q)}” as your own lift:</p>
          <div class="own-kinds">
            <button type="button" class="secondary" data-own="weight">With weights</button>
            <button type="button" class="secondary" data-own="reps">Bodyweight reps</button>
            <button type="button" class="secondary" data-own="time">Timed</button>
          </div>
        </div>` : ""}`;
  }

  function escapeHTML(s) {
    return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  function pickerStatus(el, text) {
    el.querySelector(".picker-status").textContent = text;
  }

  function afterLiftsChanged() {
    save("liftday.myLifts", myLifts);
    $("lifts-count").textContent = myLifts.length;
    for (const id of ["ob-picker", "lifts-picker"]) {
      const el = $(id);
      if (el && el.innerHTML) { renderMine(el); renderResults(el); }
    }
    renderLiftPicker();
    renderMaxLists();
    renderToday();
  }

  document.addEventListener("input", (e) => {
    if (!e.target.classList.contains("lift-search")) return;
    const el = e.target.closest(".picker");
    pickers[el.id].query = e.target.value;
    pickers[el.id].limit = 24;
    renderResults(el);
  });

  document.addEventListener("click", (e) => {
    const el = e.target.closest(".picker");
    if (!el) return;
    const st = pickers[el.id];

    const groupBtn = e.target.closest("[data-group]");
    if (groupBtn) {
      st.group = st.group === groupBtn.dataset.group ? "" : groupBtn.dataset.group;
      st.limit = 24;
      for (const b of el.querySelectorAll("[data-group]")) b.setAttribute("aria-pressed", b.dataset.group === st.group);
      return renderResults(el);
    }
    const pick = e.target.closest("[data-pick]");
    if (pick && el.id === "add-picker") {
      const id = pick.dataset.pick;
      if (!myLifts.includes(id)) { myLifts.push(id); afterLiftsChanged(); }
      $("lift-field").hidden = false;
      $("lift").value = id;
      setFormFor(liftById(id), true);
      openAddPicker(false);
      $("lift-count-note").textContent = `${liftName(id)} picked.`;
      $("lifts-count").textContent = myLifts.length;
      return;
    }
    if (pick) {
      const id = pick.dataset.pick;
      if (myLifts.includes(id)) {
        if (entries.some((en) => en.lift === id)) return pickerStatus(el, `${liftName(id)} is on today's card. Take it off the card first.`);
        myLifts = myLifts.filter((x) => x !== id);
        pickerStatus(el, `Removed ${liftName(id)}.`);
      } else {
        myLifts.push(id);
        pickerStatus(el, `Added ${liftName(id)}.`);
      }
      return afterLiftsChanged();
    }
    const unpick = e.target.closest("[data-unpick]");
    if (unpick) {
      const id = unpick.dataset.unpick;
      if (entries.some((en) => en.lift === id)) return pickerStatus(el, `${liftName(id)} is on today's card. Take it off the card first.`);
      myLifts = myLifts.filter((x) => x !== id);
      pickerStatus(el, `Removed ${liftName(id)}.`);
      return afterLiftsChanged();
    }
    if (e.target.closest("[data-more]")) {
      st.limit += 24;
      return renderResults(el);
    }
    const own = e.target.closest("[data-own]");
    if (own) {
      const result = checkLiftName(st.query, library.map((l) => l.name));
      if (result.error) return pickerStatus(el, result.error);
      const kind = own.dataset.own;
      const lift = { id: liftIdFromName(result.name), name: result.name, group: "My lifts", equip: kind === "weight" ? "other" : "bodyweight", pattern: kind === "time" ? "plank" : "stand", kind };
      customLifts.push(lift);
      save("liftday.lifts", customLifts);
      rebuildLibrary();
      myLifts.push(lift.id);
      st.query = "";
      pickerStatus(el, `Added ${lift.name} to your lifts.`);
      el.querySelector(".lift-search").value = "";
      afterLiftsChanged();
    }
  });

  // =================================================================
  // The app: tabs
  // =================================================================

  const allTabs = [$("tab-home"), $("tab-card"), $("tab-ranks"), $("tab-team"), $("tab-me")];
  const visibleTabs = () => allTabs.filter((t) => !t.hidden);

  function showTab(tab) {
    for (const t of allTabs) {
      const on = t === tab;
      t.setAttribute("aria-selected", on);
      t.tabIndex = on ? 0 : -1;
      $(t.getAttribute("aria-controls")).hidden = !on;
    }
    // Tabs that show other tabs' data get redrawn when you open them
    if (tab.id === "tab-team") renderTeam();
    if (tab.id === "tab-ranks") renderRanks();
    if (tab.id === "tab-home") renderHome();
    window.scrollTo(0, 0);
  }

  allTabs.forEach((t) => {
    t.addEventListener("click", () => showTab(t));
    t.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const tabs = visibleTabs();
      const i = tabs.indexOf(t);
      const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
      showTab(next);
      next.focus();
    });
  });

  function showApp() {
    $("onboarding").hidden = true;
    $("onboarding").innerHTML = "";
    $("app").hidden = false;
    document.body.dataset.mode = mode;
    $("tab-ranks").hidden = !isPersonal();
    $("tab-team").hidden = isPersonal();
    renderAll();
    showTab(entries.length ? $("tab-card") : $("tab-home"));
  }

  function showSetup(index) {
    stopRest();
    setupStep = index;
    $("app").hidden = true;
    $("onboarding").hidden = false;
    renderSetup();
  }

  // =================================================================
  // Today: the stage (next set, bar or picture, rest timer)
  // =================================================================

  function renderStage() {
    const stage = $("stage");
    const ns = nextSet(entries, maxes, step(), bar());

    if (routineDraft) {
      const n = entries.length;
      stage.innerHTML = `<p class="done-msg">New routine</p>
        <p class="stage-label">${n
          ? `${n} ${n === 1 ? "exercise" : "exercises"} so far. Add more below, then save it. It'll be in My routines, ready to start with one tap.`
          : "Pick the exercises and sets below. Nothing gets logged; you're just building the plan."}</p>
        ${n ? `<button type="button" class="primary" id="save-draft">Save routine</button>` : ""}
        <button type="button" class="quiet gap-s" id="cancel-draft">Cancel</button>`;
      lastBarKey = null;
      stopGhostTick();
      return;
    }

    if (entries.length === 0) {
      stage.innerHTML = myLifts.length
        ? `<p class="done-msg">Empty card</p>
           <p class="stage-label">Tap New workout to pick your exercises and sets for today, or Start a new routine to build one you can reuse.</p>`
        : `<p class="done-msg">Let's lift</p>
           <p class="stage-label">Tap New workout to build today's workout and pick your lifts as you go. Lift Day walks you through every set.</p>`;
      lastBarKey = null;
      return;
    }
    if (!ns) {
      const vol = daySummary(entries, maxes, step(), bar()).volume;
      const fun = isPersonal() && volumeComparison(vol);
      stage.innerHTML = `<p class="done-msg">Card's done</p>
        ${fun ? `<p class="fun">You moved <strong>${vol.toLocaleString()} lbs</strong> today. That's ${fun.text}.</p>
          <button type="button" class="secondary" id="share-volume">Share it</button>` : ""}
        <p class="stage-label">${isPersonal()
          ? "Every set is checked off. Tap Finish workout to log it on Home."
          : "Every set is checked off. Tap Finish workout when you're done."}</p>
        <p class="status" id="share-status" aria-live="polite"></p>`;
      lastBarKey = null;
      stopGhostTick();
      return;
    }

    const lift = liftById(ns.lift);
    const entry = entries[ns.entryIndex];
    const setText = ns.unit === "min" ? "" : ` · set ${ns.setIndex + 1} of ${entry.sets}`;
    const amountText = ns.type === "failure" ? " · to failure" : ns.unit === "reps" && typeof ns.weight === "number" ? ` · ${ns.reps} reps` : "";
    const label = `<p class="stage-label"><strong>${lift.name}</strong>${setText}${amountText}</p>`;
    const picture = `<div class="stage-fig">${figureSVG(lift.pattern, lift.equip, "fig-lg")}</div>`;

    if (ns.weight === null) {
      stage.innerHTML = `${label}${picture}
        <button type="button" class="primary need-max-stage" data-lift="${ns.lift}">Add your ${lift.name.toLowerCase()} max</button>`;
      lastBarKey = null;
      return;
    }

    let big, visual, below = "";
    if (typeof ns.weight === "number") {
      big = `<p class="jersey">${ns.weight}<small>LBS</small></p>`;
      if (PLATE_LIFTS.includes(lift.equip)) {
        const load = platesPerSide(ns.weight, bar(), plates());
        if (load === null) {
          below = `Lighter than your ${bar()} lb bar. Use a lighter bar or dumbbells.`;
        } else if (load.length === 0) {
          below = "Just the bar";
        } else {
          below = `Each side: <strong>${load.join(" + ")}</strong>`;
          const actual = loadedWeight(bar(), load);
          if (actual !== ns.weight) below += `<br>Closest you can load with your plates: <strong>${actual}</strong>`;
        }
        visual = barbellSVG(load || []);
      } else {
        visual = picture;
      }
    } else {
      const unit = { reps: "REPS", sec: "SEC", min: "MIN" }[ns.unit];
      big = ns.type === "failure"
        ? `<p class="jersey">MAX<small>${unit}</small></p>`
        : `<p class="jersey">${ns.reps}<small>${unit}</small></p>`;
      visual = picture;
    }

    stage.innerHTML = `${label}${big}${visual}
      ${below ? `<p class="plates-text">${below}</p>` : ""}
      <div id="rest-area">${restHTML()}</div>
      <div id="ghost-area"></div>`;
    renderGhost();

    const svg = stage.querySelector(".barbell");
    const key = `${ns.entryIndex}-${ns.setIndex}-${ns.weight}-${bar()}-${plates().join()}`;
    if (svg && key !== lastBarKey) loadPlates(svg);
    lastBarKey = key;
    updateTimer();
  }

  function restHTML() {
    if (!rest) {
      return `<div class="stage-actions">
        <button type="button" class="primary" id="set-done">Set done, start rest</button>
      </div>`;
    }
    return `<div class="timer">
        <div class="timer-time" id="timer-time"></div>
        <div class="timer-track"><div class="timer-fill" id="timer-fill"></div></div>
        <div class="stage-actions">
          <button type="button" class="secondary" data-rest="-15" aria-label="15 seconds less rest">−15</button>
          <button type="button" class="primary" id="skip-rest">${rest.over ? "Go" : "Skip rest"}</button>
          <button type="button" class="secondary" data-rest="15" aria-label="15 seconds more rest">+15</button>
        </div>
      </div>`;
  }

  // ---------- Rest timer ----------
  function beep() {
    try {
      if (!audio) return;
      for (const start of [0, 0.25]) {
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.25, audio.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + start + 0.18);
        osc.connect(gain).connect(audio.destination);
        osc.start(audio.currentTime + start);
        osc.stop(audio.currentTime + start + 0.2);
      }
    } catch { /* sound is a bonus; the screen still says Go */ }
  }

  function startRest() {
    // Phones only allow sound after a tap, so set it up here
    try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); } catch { audio = null; }
    rest = { endAt: Date.now() + restSeconds * 1000, total: restSeconds, over: false };
    clearInterval(restTick);
    restTick = setInterval(updateTimer, 250);
  }

  function stopRest() {
    rest = null;
    clearInterval(restTick);
  }

  function updateTimer() {
    if (!rest) return;
    const left = Math.max(0, Math.ceil((rest.endAt - Date.now()) / 1000));
    const time = $("timer-time");
    const fill = $("timer-fill");
    if (!time) return;
    time.textContent = left > 0 ? `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}` : "GO";
    time.classList.toggle("go", left === 0);
    fill.style.transform = `scaleX(${left / rest.total})`;
    if (left === 0 && !rest.over) {
      rest.over = true;
      clearInterval(restTick);
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      beep();
      $("rest-area").innerHTML = restHTML();
      updateTimer();
    }
  }

  // =================================================================
  // Today: the card
  // =================================================================

  function renderCard() {
    const tops = topWeights(entries, maxes, step(), bar());
    const ns = nextSet(entries, maxes, step(), bar());
    const amountHead = { reps: "Reps", sec: "Sec", min: "Min" };

    $("card").innerHTML = entries.map((e, i) => {
      const lift = liftById(e.lift);
      const labels = setLabels(e.rows);
      const weighted = lift.kind === "weight" || e.load;
      const prev = previous[e.lift] || [];
      const def = entryWeight(e, maxes, step(), bar());
      const head = `<div class="ex-head">
          ${figureSVG(lift.pattern, lift.equip, "row-fig")}
          <div class="row-text">
            <span class="lift-name">${lift.name}</span>
            <span class="scheme">${schemeText(e)}${def === null ? ` · <button type="button" class="need-max" data-lift="${e.lift}">add your max</button>` : ""}</span>
          </div>
          <button type="button" class="remove" data-index="${i}" aria-label="Remove ${lift.name}">${X_ICON}</button>
        </div>`;
      const rows = e.rows.map((r, s) => {
        const w = rowWeight(e, r, maxes, step(), bar());
        const isNext = ns && ns.entryIndex === i && ns.setIndex === s;
        const isTop = typeof w === "number" && r.type !== "warmup" && w === tops[e.lift];
        const p = prev[s];
        return `<div class="set-row${r.done ? " done" : ""}${isNext ? " next" : ""}" role="row">
          <button type="button" class="set-type t-${r.type}" data-menu="${i}:${s}" aria-label="Set ${labels[s]}, ${r.type === "normal" ? "normal set" : r.type + " set"}. Change set type">${labels[s]}</button>
          <span class="prev">${p ? `${typeof p.lbs === "number" ? `${p.lbs} × ` : ""}${typeof p.reps === "number" ? p.reps : "fail"}` : "–"}</span>
          ${weighted ? `<input class="cell${isTop ? " top" : ""}" data-cell="lbs" data-at="${i}:${s}" type="number" inputmode="decimal" aria-label="Set ${labels[s]} pounds"
              value="${typeof r.lbs === "number" ? r.lbs : ""}" placeholder="${typeof w === "number" ? w : "lbs"}">` : ""}
          ${r.type === "failure"
            ? `<span class="cell fail-cell" aria-label="Set ${labels[s]}: to failure, no rep count">Fail</span>`
            : `<input class="cell" data-cell="reps" data-at="${i}:${s}" type="number" inputmode="numeric" aria-label="Set ${labels[s]} ${amountHead[e.unit].toLowerCase()}" value="${r.reps}">`}
          <button type="button" class="check" data-check="${i}:${s}" aria-pressed="${r.done}" aria-label="Set ${labels[s]} done">${CHECK_ICON}</button>
        </div>`;
      }).join("");
      return `<li class="ex${weighted ? "" : " no-lbs"}">
        ${head}
        <div class="set-table" role="table" aria-label="${lift.name} sets">
          <div class="set-row set-headrow" role="row">
            <span>Set</span><span>Previous</span>${weighted ? "<span>Lbs</span>" : ""}<span>${amountHead[e.unit]}</span><span class="sr-only">Done</span>${CHECK_ICON}
          </div>
          ${rows}
        </div>
        ${e.unit === "min" ? "" : `<button type="button" class="add-set" data-addset="${i}">${PLUS_ICON}Add set</button>`}
      </li>`;
    }).join("");

    $("clear-card").disabled = entries.length === 0;
    $("add-toggle").hidden = entries.length === 0 || addOpen;
    $("add-toggle").className = `${routineDraft && entries.length ? "secondary" : "primary"} add-toggle`;
    $("panel-card").classList.toggle("building", routineDraft);
    $("add-form").hidden = !addOpen;
    renderNewWorkout();
    const noLifts = myLifts.length === 0;
    $("lift-field").hidden = noLifts;
    if (noLifts) openAddPicker(true);
    renderRoutines();
  }

  // Personal: save what you did to History
  function renderFinish() {
    const area = $("finish-area");
    const summary = daySummary(entries, maxes, step(), bar());
    area.innerHTML = summary.sets && !routineDraft
      ? `<button type="button" class="primary finish-btn" id="finish-day">Finish workout</button>
         <p class="hint center">${summary.sets} ${summary.sets === 1 ? "set" : "sets"} done${summary.volume ? ` · ${summary.volume.toLocaleString()} lbs total volume` : ""}</p>`
      : finishNote ? `<p class="hint center">${finishNote}</p>` : "";
  }

  // ---------- The add form changes with the lift you pick ----------
  const BAR_LIKE = ["barbell", "trap bar", "Smith machine", "EZ bar", "landmine"];

  function renderLiftPicker() {
    const select = $("lift");
    const current = select.value;
    const mine = myLiftObjects();
    select.innerHTML = mine.map((l) => `<option value="${l.id}">${l.name}</option>`).join("");
    if (mine.some((l) => l.id === current)) select.value = current;
    setFormFor(liftById(select.value), select.value !== current);
  }

  function setFormFor(lift, resetValues) {
    const form = $("add-form");
    if (!lift || !lift.kind) return;
    form.dataset.kind = lift.kind;
    $("reps-label").textContent = { weight: "Reps", reps: "Reps", time: "Seconds", cardio: "Minutes" }[lift.kind];
    if (resetValues) {
      loadType = BAR_LIKE.includes(lift.equip) ? "pct" : "lbs";
      const defaults = { weight: [loadType === "pct" ? 4 : 3, loadType === "pct" ? 5 : 10], reps: [3, 10], time: [3, 30], cardio: [1, 20] }[lift.kind];
      form.reps.value = defaults[1];
      plan = Array.from({ length: defaults[0] }, () => ({ type: "normal", reps: defaults[1] }));
      renderPlan();
      form.load.value = loadType === "pct" ? 75 : "";
    }
    setLoadType(loadType);
  }

  function setLoadType(type) {
    loadType = type;
    for (const b of document.querySelectorAll("[data-loadtype]")) b.setAttribute("aria-checked", b.dataset.loadtype === type);
    $("load-label").textContent = type === "pct" ? "% of max" : "Lbs";
    $("add-form").load.placeholder = type === "pct" ? "75" : "lbs";
  }

  $("lift").addEventListener("change", (e) => setFormFor(liftById(e.target.value), true));

  $("add-form").addEventListener("click", (e) => {
    const b = e.target.closest("[data-loadtype]");
    if (b) setLoadType(b.dataset.loadtype);
  });

  function renderToday() {
    renderStage();
    renderCard();
    renderFinish();
  }

  function saveCard() { save("liftday.card", entries); }

  function goToMax(lift) {
    showTab($("tab-me"));
    $("sec-maxes").open = true;
    const input = $(`me-max-${lift}`);
    if (input) input.focus();
  }

  function goToLifts() {
    showTab($("tab-me"));
    $("sec-lifts").open = true;
    $("sec-lifts").scrollIntoView({ block: "start" });
    const search = document.querySelector("#lifts-picker .lift-search");
    if (search) search.focus({ preventScroll: true });
  }

  $("edit-lifts").addEventListener("click", goToLifts);

  // ---------- Taps on Today ----------
  $("stage").addEventListener("click", (e) => {
    if (e.target.closest("#set-done")) {
      const ns = nextSet(entries, maxes, step(), bar());
      entries[ns.entryIndex].rows[ns.setIndex].done = true;
      saveCard();
      recordSet(ns.lift, typeof ns.weight === "number" ? ns.weight : null, ns.reps, ns.unit);
      if (nextSet(entries, maxes, step(), bar())) startRest();
      renderToday();
    } else if (e.target.closest("#skip-rest")) {
      stopRest();
      renderToday();
    } else if (e.target.closest("[data-rest]")) {
      const change = Number(e.target.closest("[data-rest]").dataset.rest);
      restSeconds = Math.min(600, Math.max(15, restSeconds + change));
      save("liftday.rest", restSeconds);
      if (rest && !rest.over) {
        rest.endAt += change * 1000;
        rest.total = Math.max(1, rest.total + change);
        updateTimer();
      }
    } else if (e.target.closest(".need-max-stage")) {
      goToMax(e.target.closest(".need-max-stage").dataset.lift);

    } else if (e.target.closest("#save-draft")) {
      askRoutine();
    } else if (e.target.closest("#cancel-draft")) {
      routineDraft = false;
      entries = [];
      addOpen = false;
      saveCard();
      renderToday();
    }
  });

  $("card").addEventListener("click", (e) => {
    const check = e.target.closest("[data-check]");
    if (check) {
      const [i, s] = check.dataset.check.split(":").map(Number);
      const entry = entries[i];
      const row = entry.rows[s];
      row.done = !row.done;
      saveCard();
      if (row.done) {
        const w = rowWeight(entry, row, maxes, step(), bar());
        recordSet(entry.lift, typeof w === "number" ? w : null, row.reps, entry.unit);
        if (nextSet(entries, maxes, step(), bar())) startRest();
      }
      renderToday();
      return;
    }
    const menu = e.target.closest("[data-menu]");
    if (menu) return openSetMenu(menu.dataset.menu);
    const addSet = e.target.closest("[data-addset]");
    if (addSet) {
      const entry = entries[Number(addSet.dataset.addset)];
      const last = entry.rows[entry.rows.length - 1];
      if (entry.rows.length >= 20) return;
      entry.rows.push({ type: "normal", reps: last && typeof last.reps === "number" ? last.reps : entry.reps, lbs: last ? last.lbs ?? null : null, done: false });
      entry.sets = entry.rows.length;
      saveCard();
      renderToday();
      return;
    }
    const remove = e.target.closest(".remove");
    if (remove) {
      entries.splice(Number(remove.dataset.index), 1);
      saveCard();
      renderToday();
      return;
    }
    const needMax = e.target.closest(".need-max");
    if (needMax) goToMax(needMax.dataset.lift);
  });

  $("finish-area").addEventListener("click", (e) => {
    if (!e.target.closest("#finish-day")) return;
    // A workout you built yourself (not loaded from a routine): offer to keep it
    if (!cardRoutine) return askRoutine();
    finishWorkout();
  });

  function finishWorkout(note = "") {
    const summary = daySummary(entries, maxes, step(), bar());
    if (isPersonal()) {
      history.unshift({ date: new Date().toISOString(), ...summary });
      save("liftday.history", history);
    }
    saveGhost();
    commitPrevious();
    endSession();
    entries = freshCopy(entries);
    saveCard();
    stopRest();
    finishNote = `${note}${isPersonal() ? "Saved to Home. " : ""}Your card is reset for next time.`;
    renderToday();
    renderHistory();
  }

  // Remember what you did so the Previous column can show it next time
  function commitPrevious() {
    for (const e of entries) {
      const done = e.rows.filter((r) => r.done);
      if (!done.length) continue;
      previous[e.lift] = e.rows.map((r) => {
        const w = rowWeight(e, r, maxes, step(), bar());
        return r.done ? { lbs: typeof w === "number" ? w : null, reps: r.reps } : null;
      });
    }
    save("liftday.previous", previous);
  }

  // ---------- "Make this a routine?" ----------
  function askRoutine() {
    const dlg = $("routine-dialog");
    $("routine-title").textContent = routineDraft ? "Name your routine" : role === "coach" && !isPersonal() ? "Save as a team workout?" : "Make this a routine?";
    $("routine-skip").textContent = routineDraft ? "Keep editing" : "Not now";
    $("routine-why").textContent = routineDraft ? "You'll find it under My routines on this tab."
      : role === "coach" && !isPersonal()
      ? "Players get it the next time you send them the team link."
      : "Save these exercises and sets so you can start this workout again with one tap.";
    $("routine-name-input").value = routineNameFor(entries, liftName);
    $("routine-error").textContent = "";
    dlg.showModal();
    $("routine-name-input").select();
  }

  $("routine-dialog").addEventListener("click", (e) => {
    const dlg = $("routine-dialog");
    if (e.target.closest("#routine-skip") || e.target === dlg) { dlg.close(); return routineDraft ? null : finishWorkout(); }
    if (!e.target.closest("#routine-save")) return;
    const name = $("routine-name-input").value.trim().slice(0, 30);
    if (!name) { $("routine-error").textContent = "Give it a name."; return; }
    saveRoutine(name);
    dlg.close();
    if (routineDraft) {
      // The plan is saved; the card goes back to empty
      routineDraft = false;
      entries = [];
      cardRoutine = null;
      save("liftday.cardRoutine", null);
      addOpen = false;
      finishNote = `Saved “${escapeHTML(name)}”. Tap Start under My routines when you're ready to lift.`;
      saveCard();
      return renderToday();
    }
    finishWorkout(`Saved “${name}” as a routine. `);
  });

  $("routine-dialog").addEventListener("cancel", () => { if (!routineDraft) finishWorkout(); });

  function saveRoutine(name) {
    const lines = freshCopy(entries);
    if (role === "coach" && !isPersonal() && team) {
      team.routines = team.routines.filter((r) => r.name.toLowerCase() !== name.toLowerCase()).concat([{ name, lines }]);
      team.custom = customLifts.filter((c) => team.routines.some((r) => r.lines.some((l) => l.lift === c.id)));
      save("liftday.team", team);
    } else {
      routines = routines.filter((r) => r.name.toLowerCase() !== name.toLowerCase()).concat([{ name, lines }]);
      save("liftday.routines", routines);
    }
    cardRoutine = name;
    save("liftday.cardRoutine", cardRoutine);
  }

  // ---------- Your routines (start one with a tap) ----------
  function renderRoutines() {
    const el = $("routines-area");
    const list = role === "coach" && !isPersonal() ? [] : routines; // coaches keep theirs on the Team tab
    el.innerHTML = list.length
      ? `<h2 class="gap">My routines</h2>
         <ul class="routines">${list.map((r, i) => `<li class="routine${r.name === cardRoutine ? " current" : ""}">
            <p class="routine-name">${escapeHTML(r.name)}</p>
            <p class="hint small">${r.lines.map((l) => `${liftName(l.lift)} ${schemeText(l)}`).join(" · ")}</p>
            <div class="routine-actions">
              <button type="button" class="secondary" data-start-routine="${i}">${r.name === cardRoutine ? "Restart" : "Start"}</button>
              <button type="button" class="quiet-x" data-delete-myroutine="${i}">Delete</button>
            </div></li>`).join("")}</ul>`
      : "";
  }

  $("routines-area").addEventListener("click", (e) => {
    const start = e.target.closest("[data-start-routine]");
    if (start) {
      const r = routines[Number(start.dataset.startRoutine)];
      loadLines(r.lines, r.name);
      return;
    }
    const del = e.target.closest("[data-delete-myroutine]");
    if (del) {
      const r = routines.splice(Number(del.dataset.deleteMyroutine), 1)[0];
      save("liftday.routines", routines);
      if (r && r.name === cardRoutine) { cardRoutine = null; save("liftday.cardRoutine", null); }
      renderRoutines();
    }
  });

  function loadLines(lines, name) {
    routineDraft = false;
    commitPrevious();
    entries = freshCopy(lines);
    for (const l of entries) if (!myLifts.includes(l.lift)) myLifts.push(l.lift);
    save("liftday.myLifts", myLifts);
    cardRoutine = name;
    save("liftday.cardRoutine", cardRoutine);
    endSession();
    stopRest();
    finishNote = "";
    saveCard();
    renderAll();
    showTab($("tab-card"));
  }

  $("clear-card").addEventListener("click", () => {
    routineDraft = false;
    commitPrevious();
    entries = [];
    cardRoutine = null;
    save("liftday.cardRoutine", null);
    endSession();
    stopRest();
    saveCard();
    renderToday();
  });

  $("add-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.target;
    const lift = liftById(form.lift.value);
    const unit = unitFor(lift.kind);
    const load = lift.kind === "weight" ? { type: loadType, value: Number(form.load.value) } : null;
    const entry = lift.kind === "cardio"
      ? newEntry(lift.id, 1, Number(form.reps.value), unit, null)
      : entryFromPlan(lift.id, plan, unit, load);
    const problems = checkEntry(entry);

    for (const name of ["sets", "reps", "load"]) form[name].removeAttribute("aria-invalid");
    for (const box of $("set-plan").querySelectorAll("[data-plan-reps]")) {
      const r = plan[Number(box.dataset.planReps)];
      box.toggleAttribute("aria-invalid", !inRange(r.reps, LIMITS[unit]));
    }
    for (const [name] of problems) {
      if (name === "reps" && lift.kind !== "cardio") continue; // marked on the set rows above
      form[name].setAttribute("aria-invalid", "true");
    }
    $("add-error").textContent = problems.map((p) => p[1]).join(" ");
    if (problems.length) return;

    entries.push(entry);
    finishNote = "";
    addOpen = false;
    saveCard();
    renderToday();
  });

  // =================================================================
  // Maxes, estimates, bodyweight, PRs (used in setup and on Me)
  // =================================================================

  function maxRowsHTML(prefix) {
    return weightLifts().map((l) => `
      <div class="max-item">
        <div class="max-row">
          <div class="max-label">
            <label for="${prefix}-max-${l.id}">${l.name}</label>
            <button type="button" class="link est-toggle" data-lift="${l.id}" aria-expanded="false">Estimate</button>
          </div>
          <input id="${prefix}-max-${l.id}" class="max-input" data-lift="${l.id}" type="number" inputmode="numeric"
                 min="45" max="1500" placeholder="lbs" value="${maxes[l.id] || ""}">
          <span class="ratio" data-ratio="${l.id}"></span>
        </div>
        <div class="estimate" data-est="${l.id}" hidden>
          <p class="est-q">A set you did recently:</p>
          <div class="est-fields">
            <input class="est-w" type="number" inputmode="numeric" placeholder="lbs" aria-label="${l.name} weight lifted">
            <span aria-hidden="true">×</span>
            <input class="est-r" type="number" inputmode="numeric" placeholder="reps" aria-label="${l.name} reps">
          </div>
          <p class="est-out" aria-live="polite"></p>
        </div>
      </div>`).join("");
  }

  function renderMaxLists() {
    $("me-maxes").innerHTML = weightLifts().length
      ? maxRowsHTML("me")
      : `<div class="empty-box"><p class="empty-title">No weighted lifts yet</p><p class="hint">Add lifts under My lifts below. Any that use weights show up here so you can set a max.</p></div>`;
    $("bodyweight").value = bodyweight || "";
    $("me-height").innerHTML = heightWeightHTML("me").split('<div class="max-row bw-row">')[0];
    updateRatios();
  }

  function updateRatios() {
    for (const span of document.querySelectorAll("[data-ratio]")) {
      const lift = span.dataset.ratio;
      span.textContent = bodyweight && maxes[lift] ? `${bodyweightRatio(maxes[lift], bodyweight)}× BW` : "";
    }
    renderRanks();
  }

  function statusEl() {
    if (setupStep !== null) return $("ob-status");
    return rankCalcOpen && $("rank-calc").contains(document.activeElement) ? $("rank-status") : $("max-status");
  }

  function showStatus(text) {
    const el = statusEl();
    if (el) el.textContent = text;
  }

  function showSaved(ok) {
    showStatus(ok ? "Saved." : "Couldn't save on this browser (private mode?). It still works until you close it.");
  }

  function setMax(lift, value, input) {
    const before = maxes[lift];
    maxes[lift] = value;
    showSaved(save("liftday.maxes", maxes));
    if (input) input.value = value;
    if (before && value > before) logPR(lift, value, value - before);
    updateRatios();
    renderToday();
    checkRankUp();
  }

  // Typing in a max box
  document.addEventListener("focusin", (e) => {
    if (e.target.classList.contains("max-input")) e.target.dataset.before = maxes[e.target.dataset.lift] || "";
  });

  document.addEventListener("input", (e) => {
    const t = e.target;

    if (t.classList.contains("max-input")) {
      const value = Number(t.value);
      if (t.value === "") {
        delete maxes[t.dataset.lift];
      } else if (isValidMax(value)) {
        maxes[t.dataset.lift] = value;
      } else {
        t.setAttribute("aria-invalid", "true");
        showStatus("Enter a max between 45 and 1500 lbs.");
        return;
      }
      t.removeAttribute("aria-invalid");
      showSaved(save("liftday.maxes", maxes));
      updateRatios();
      renderToday();
    }

    if (t.id === "bodyweight" || t.classList.contains("bw-input")) {
      const value = Number(t.value);
      if (t.value === "") {
        bodyweight = null;
      } else if (isValidBodyweight(value)) {
        bodyweight = value;
      } else {
        t.setAttribute("aria-invalid", "true");
        showStatus("Enter a bodyweight between 80 and 500 lbs.");
        return;
      }
      t.removeAttribute("aria-invalid");
      showSaved(save("liftday.bodyweight", bodyweight));
      updateRatios();
    }

    // The estimate calculator works as you type
    if (t.classList.contains("est-w") || t.classList.contains("est-r")) {
      const box = t.closest(".estimate");
      const weight = Number(box.querySelector(".est-w").value);
      const reps = Number(box.querySelector(".est-r").value);
      const out = box.querySelector(".est-out");
      if (!box.querySelector(".est-w").value || !box.querySelector(".est-r").value) { out.innerHTML = ""; return; }
      const problems = checkEstimate(weight, reps);
      if (problems.length) { out.innerHTML = `<span class="error-text">${problems.join(" ")}</span>`; return; }
      const est = estimateMax(weight, reps);
      out.innerHTML = `Estimated max: <strong>${est} lbs</strong>
        <button type="button" class="secondary est-use" data-lift="${box.dataset.est}" data-value="${est}">Use ${est}</button>`;
    }
  });

  // Finished typing a max: was it a PR?
  document.addEventListener("change", (e) => {
    const t = e.target;
    if (!t.classList.contains("max-input")) return;
    const before = Number(t.dataset.before);
    const now = maxes[t.dataset.lift];
    if (before && now && now > before) {
      logPR(t.dataset.lift, now, now - before);
      t.dataset.before = now;
    }
  });

  document.addEventListener("click", (e) => {
    const toggle = e.target.closest(".est-toggle");
    if (toggle) {
      const box = toggle.closest(".max-item").querySelector(".estimate");
      box.hidden = !box.hidden;
      toggle.setAttribute("aria-expanded", !box.hidden);
      if (!box.hidden) box.querySelector(".est-w").focus();
      return;
    }
    const use = e.target.closest(".est-use");
    if (use) {
      const item = use.closest(".max-item");
      setMax(use.dataset.lift, Number(use.dataset.value), item.querySelector(".max-input"));
      item.querySelector(".estimate").hidden = true;
      item.querySelector(".est-toggle").setAttribute("aria-expanded", "false");
    }
  });

  let prTimer = null;
  function logPR(lift, max, gain, estimated = false) {
    prs.unshift({ date: new Date().toISOString(), lift, max, gain, estimated });
    save("liftday.prs", prs);
    renderHistory();

    const banner = $("pr-banner");
    const ratio = bodyweight ? ` · ${bodyweightRatio(max, bodyweight)}× bodyweight` : "";
    banner.innerHTML = `<span class="big">${estimated ? "New est. max" : "New PR"}</span>${liftName(lift)} ${max} lbs (+${gain})${ratio}`;
    banner.classList.add("show");
    playHype();
    clearTimeout(prTimer);
    prTimer = setTimeout(() => banner.classList.remove("show"), 3200);
  }

  // =================================================================
  // Personal: gym setup and history
  // =================================================================

  function gymHTML() {
    const s = loadStep(gym.plates);
    return `<div class="gym">
      <p class="gym-label" id="bar-label">Bar</p>
      <div class="seg" role="radiogroup" aria-labelledby="bar-label">
        ${BAR_OPTIONS.map((b) => `<button type="button" role="radio" class="seg-btn" data-bar="${b}" aria-checked="${gym.bar === b}">
          <strong>${b} lb</strong><span>${{ 45: "Standard", 35: "Women's", 15: "Technique" }[b]}</span></button>`).join("")}
      </div>
      <p class="gym-label" id="plates-label">Plates I own</p>
      <div class="plate-picks" role="group" aria-labelledby="plates-label">
        ${PLATES.map((p) => `<button type="button" class="plate-pick" data-plate="${p}" aria-pressed="${gym.plates.includes(p)}">${p}</button>`).join("")}
      </div>
      <p class="hint small gym-note">Smallest jump you can make: <strong>${s} lbs</strong>${s > ROUND_TO ? `, so barbell weights round to the nearest ${s} from the bar.` : "."}</p>
    </div>`;
  }

  function renderGyms() {
    for (const id of ["me-gym", "ob-gym"]) {
      const el = $(id);
      if (el) el.innerHTML = gymHTML();
    }
  }

  document.addEventListener("click", (e) => {
    const barBtn = e.target.closest("[data-bar]");
    if (barBtn) {
      gym.bar = Number(barBtn.dataset.bar);
      save("liftday.gym", gym);
      renderGyms();
      renderToday();
      return;
    }
    const plateBtn = e.target.closest("[data-plate]");
    if (plateBtn) {
      const p = Number(plateBtn.dataset.plate);
      if (gym.plates.includes(p)) {
        if (gym.plates.length === 1) return; // always keep at least one plate
        gym.plates = gym.plates.filter((x) => x !== p);
      } else {
        gym.plates = PLATES.filter((x) => x === p || gym.plates.includes(x));
      }
      save("liftday.gym", gym);
      renderGyms();
      renderToday();
    }
  });

  function historyLine(l) {
    if (l.unit === "min") return `${l.reps} min`;
    const base = l.reps === "failure" ? `${l.sets} to failure` : `${l.sets} × ${l.reps}${l.unit === "sec" ? " sec" : ""}`;
    return typeof l.weight === "number" ? `${base} at <strong>${l.weight}</strong>` : base;
  }

  function renderHistory() {
    $("history-list").innerHTML = history.length
      ? `<ol class="days">${history.map((d) => `<li class="day">
          <div class="day-head">
            <span class="day-date">${shortDate(d.date)}</span>
            <span class="day-vol">${d.volume ? `${d.volume.toLocaleString()} lbs` : `${d.sets} sets`}</span>
          </div>
          ${volumeComparison(d.volume) ? `<p class="fun small-fun">That's ${volumeComparison(d.volume).text}.</p>` : ""}
          <ul class="day-lines">${d.lines.map((l) => `<li><span>${liftName(l.lift)}</span><span>${historyLine(l)}</span></li>`).join("")}</ul>
        </li>`).join("")}</ol>`
      : `<div class="empty-box">
          <p class="empty-title">No lift days yet</p>
          <p class="hint">Check off your sets on Today, then tap Finish and save day. Each day lands here with what you did and your total volume.</p>
        </div>`;

    $("pr-list").innerHTML = prs.length
      ? `<ol class="prs">${prs.map((p) => `<li>
          <span class="pr-date">${shortDate(p.date)}</span>
          <span class="pr-lift">${liftName(p.lift)}</span>
          <span class="pr-max">${p.max} <small>+${p.gain}${p.estimated ? " est." : ""}</small></span>
        </li>`).join("")}</ol>`
      : `<div class="empty-box">
          <p class="empty-title">No PRs yet</p>
          <p class="hint">When you raise a max in Profile, it gets logged here with the date and how much you added.</p>
        </div>`;
  }

  // ---------- Personal / Team switch ----------
  function renderMode() {
    $("mode-text").textContent = isPersonal()
      ? "You're using Lift Day for your own training."
      : "You're using Lift Day with a team.";
    $("switch-mode").textContent = isPersonal() ? "Switch to team" : "Switch to personal";
    if (!isPersonal() && role) $("mode-text").textContent = `You're using Lift Day as a ${role} on a team.`;
  }

  $("switch-mode").addEventListener("click", () => {
    mode = isPersonal() ? "team" : "personal";
    save("liftday.mode", mode);
    if (isPersonal() && !load("liftday.setupSeen", false)) return showSetup(0); // first time personal: run setup
    if (!isPersonal() && !role) return showSetup(0); // first time team: coach or player
    showApp();
    showTab($("tab-me"));
  });

  $("redo-setup").addEventListener("click", () => showSetup(0));
  $("change-role").addEventListener("click", () => showSetup(0));

  function renderAll() {
    renderPicker("lifts-picker");
    renderLiftPicker();
    renderToday();
    renderMaxLists();
    renderGyms();
    renderHistory();
    renderMode();
    renderTeam();
    renderRanks();
    renderHype();
    renderHome();
    $("lifts-count").textContent = myLifts.length;
  }

  // =================================================================
  // Teams: coaches share a link, players join from it (no server)
  // =================================================================

  const teamLink = () => `${location.origin}${location.pathname}#team=${encodeTeam(team)}`;

  function routineSummary(r) {
    return r.lines.map((l) => `${liftName(l.lift)} ${schemeText(l)}`).join(" · ");
  }

  // Join box: paste a link or code, preview the team, then join
  function renderJoin(el) {
    if (!el) return;
    el.innerHTML = `
      <form class="inline-form join-form" novalidate>
        <label class="sr-only" for="${el.id}-code">Team link or code</label>
        <input id="${el.id}-code" class="join-code" placeholder="Paste your team link or code" autocomplete="off" value="">
        <button type="submit" class="secondary">Find team</button>
      </form>
      <p class="status join-status" aria-live="polite"></p>
      ${joinPreview ? `<div class="team-card">
          <p class="team-name">${escapeHTML(joinPreview.name)}</p>
          ${joinPreview.coach ? `<p class="hint">Coach: ${escapeHTML(joinPreview.coach)}</p>` : ""}
          <p class="hint">${joinPreview.routines.length} ${joinPreview.routines.length === 1 ? "workout" : "workouts"}${joinPreview.routines.length ? `: ${joinPreview.routines.map((r) => escapeHTML(r.name)).join(", ")}` : ""}</p>
          <button type="button" class="primary" data-join>Join ${escapeHTML(joinPreview.name)}</button>
        </div>` : ""}`;
  }

  function joinTeam(t) {
    for (const c of t.custom || []) {
      if (c && typeof c.id === "string" && !liftMap.has(c.id)) customLifts.push({ group: "My lifts", equip: "other", pattern: "stand", kind: "weight", ...c });
    }
    save("liftday.lifts", customLifts);
    rebuildLibrary();
    for (const r of t.routines) for (const l of r.lines) if (!myLifts.includes(l.lift)) myLifts.push(l.lift);
    team = { ...t, joined: true, joinedAt: new Date().toISOString() };
    mode = "team";
    role = "player";
    save("liftday.mode", mode);
    save("liftday.role", role);
    save("liftday.team", team);
    save("liftday.myLifts", myLifts);
    pendingTeam = null;
    joinPreview = null;
    if (location.hash) window.history.replaceState(null, "", location.pathname);
  }

  document.addEventListener("submit", (e) => {
    const form = e.target.closest(".join-form");
    if (!form) return;
    e.preventDefault();
    const box = form.parentElement;
    const found = decodeTeam(form.querySelector(".join-code").value);
    joinPreview = found;
    renderJoin(box);
    box.querySelector(".join-status").textContent = found ? "" : "That isn't a Lift Day team link. Ask your coach to send it again.";
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest("[data-join]") || !joinPreview) return;
    const name = joinPreview.name;
    joinTeam(joinPreview);
    if (setupStep !== null) return finishSetup();
    showApp();
    showTab($("tab-team"));
    $("team-status").textContent = `You joined ${name}.`;
  });

  function renderTeam() {
    const el = $("team-area");
    if (!el || isPersonal()) return;
    if (role === "coach") {
      const t = team || { name: "", coach: "", routines: [] };
      el.innerHTML = `
        <h2>${escapeHTML(t.name || "Your team")}</h2>
        ${t.coach ? `<p class="hint">Coach: ${escapeHTML(t.coach)}</p>` : ""}
        <h3 class="sub">Workouts</h3>
        ${t.routines.length
          ? `<ul class="routines">${t.routines.map((r, i) => `<li class="routine">
              <p class="routine-name">${escapeHTML(r.name)}</p>
              <p class="hint small">${routineSummary(r)}</p>
              <div class="routine-actions">
                <button type="button" class="secondary" data-load-routine="${i}">Load to Today</button>
                <button type="button" class="quiet-x" data-delete-routine="${i}">Delete</button>
              </div></li>`).join("")}</ul>`
          : `<div class="empty-box"><p class="empty-title">No workouts yet</p><p class="hint">Build a workout on Today, then save it here. Players get every workout you save when they open your link.</p></div>`}
        <form class="inline-form save-routine" id="save-routine" novalidate>
          <label class="sr-only" for="routine-name">Workout name</label>
          <input id="routine-name" maxlength="30" placeholder="${entries.length ? "Name this workout, e.g. Monday lower" : "Add lifts on Today first"}" ${entries.length ? "" : "disabled"}>
          <button type="submit" class="secondary" ${entries.length ? "" : "disabled"}>Save today's card</button>
        </form>
        <h3 class="sub">Invite players</h3>
        <p class="hint">Send this link to your players (group chat, email, text). Opening it lets them join and load your workouts. Changed a workout? Send the link again.</p>
        ${t.name ? `<div class="share-box">
            <input id="team-link" readonly value="${teamLink()}" aria-label="Team link">
            <div class="mode-actions">
              <button type="button" class="primary" id="copy-link">Copy link</button>
              ${navigator.share ? `<button type="button" class="secondary" id="share-link">Share</button>` : ""}
            </div>
          </div>` : `<p class="hint">Name your team first (Me > Change coach or player).</p>`}
        <p class="note">Lift Day has no server, so player join requests can't reach you here. Players join straight from your link, and nothing about them leaves their phones.</p>`;
    } else {
      el.innerHTML = team && team.joined
        ? `<h2>${escapeHTML(team.name)}</h2>
          ${team.coach ? `<p class="hint">Coach: ${escapeHTML(team.coach)}</p>` : ""}
          <h3 class="sub">Team workouts</h3>
          ${team.routines.length
            ? `<ul class="routines">${team.routines.map((r, i) => `<li class="routine">
                <p class="routine-name">${escapeHTML(r.name)}</p>
                <p class="hint small">${routineSummary(r)}</p>
                <div class="routine-actions"><button type="button" class="primary" data-load-routine="${i}">Load to Today</button></div></li>`).join("")}</ul>`
            : `<div class="empty-box"><p class="empty-title">No workouts yet</p><p class="hint">Your coach hasn't saved any. Ask for a new link when they do.</p></div>`}
          <h3 class="sub">New link from your coach?</h3>
          <div id="team-join"></div>
          <button type="button" class="quiet" id="leave-team">Leave ${escapeHTML(team.name)}</button>`
        : `<h2>Join your team</h2>
          <p class="hint">Paste the link or code your coach sent you.</p>
          <div id="team-join"></div>`;
      renderJoin($("team-join"));
    }
  }

  $("panel-team").addEventListener("click", async (e) => {
    const load = e.target.closest("[data-load-routine]");
    if (load) {
      const r = team.routines[Number(load.dataset.loadRoutine)];
      loadLines(r.lines, r.name);
      return;
    }
    const del = e.target.closest("[data-delete-routine]");
    if (del) {
      team.routines.splice(Number(del.dataset.deleteRoutine), 1);
      save("liftday.team", team);
      $("team-status").textContent = "Workout deleted. Send players the new link.";
      return renderTeam();
    }
    if (e.target.closest("#copy-link")) {
      try {
        await navigator.clipboard.writeText(teamLink());
        $("team-status").textContent = "Link copied. Paste it in your team chat.";
      } catch {
        $("team-link").select();
        $("team-status").textContent = "Select the link above and copy it.";
      }
      return;
    }
    if (e.target.closest("#share-link")) {
      try { await navigator.share({ title: team.name, text: `Join ${team.name} on Lift Day`, url: teamLink() }); } catch { /* closed the share sheet */ }
      return;
    }
    if (e.target.closest("#leave-team")) {
      $("team-status").textContent = `You left ${team.name}.`;
      team = null;
      save("liftday.team", team);
      renderTeam();
    }
  });

  $("panel-team").addEventListener("submit", (e) => {
    if (e.target.id !== "save-routine") return;
    e.preventDefault();
    const name = $("routine-name").value.trim().slice(0, 30);
    if (!name) { $("team-status").textContent = "Give the workout a name."; return; }
    const lines = freshCopy(entries);
    team.routines = team.routines.filter((r) => r.name.toLowerCase() !== name.toLowerCase()).concat([{ name, lines }]);
    team.custom = customLifts.filter((c) => team.routines.some((r) => r.lines.some((l) => l.lift === c.id)));
    save("liftday.team", team);
    $("team-status").textContent = `Saved ${name}. Send players the link again so they get it.`;
    renderTeam();
  });

  // =================================================================
  // Session log + ghost of your last time doing this workout
  // =================================================================

  let ghostTick = null;

  function recordSet(lift, weight, reps, unit) {
    const nowMs = Date.now();
    for (const m of musclesFor(liftById(lift))) {
      const prev = muscleLog[m.group];
      // a heavy squat earlier today keeps the legs on the long clock
      const heavy = m.heavy || Boolean(prev && prev.heavy && nowMs - prev.at < 12 * 3600000);
      muscleLog[m.group] = { at: nowMs, heavy };
    }
    save("liftday.muscles", muscleLog);
    if (!session) session = { start: Date.now(), sets: [] };
    session.sets.push({ lift, weight, reps, unit, elapsed: Math.round((Date.now() - session.start) / 1000) });
    save("liftday.session", session);
    if (!nextSet(entries, maxes, step(), bar())) saveGhost();
  }

  function saveGhost() {
    if (!session || !session.sets.length) return;
    ghosts[cardSignature(entries)] = { date: new Date().toISOString(), sets: session.sets };
    const keys = Object.keys(ghosts);
    if (keys.length > 20) delete ghosts[keys[0]];
    save("liftday.ghosts", ghosts);
  }

  function endSession() {
    session = null;
    save("liftday.session", session);
    stopGhostTick();
  }

  function stopGhostTick() {
    clearInterval(ghostTick);
    ghostTick = null;
  }

  const mmss = (s) => `${Math.floor(Math.abs(s) / 60)}:${String(Math.abs(Math.round(s)) % 60).padStart(2, "0")}`;

  function renderGhost() {
    const area = $("ghost-area");
    if (!area) return;
    const ghost = isPersonal() && ghosts[cardSignature(entries)];
    if (!ghost) { area.innerHTML = ""; stopGhostTick(); return; }
    const total = allSets(entries, maxes, step(), bar()).length;
    const mine = allSets(entries, maxes, step(), bar()).filter((x) => x.done).length;
    const elapsed = session ? (Date.now() - session.start) / 1000 : 0;
    const theirs = session ? Math.min(total, ghostSetsAt(ghost.sets, elapsed)) : 0;
    let note = `Your ghost is from ${shortDate(ghost.date)}. It starts when you finish your first set.`;
    if (session && session.sets.length) {
      const n = session.sets.length;
      const g = ghost.sets[n - 1];
      if (g) {
        const diff = g.elapsed - session.sets[n - 1].elapsed;
        note = `Set ${n}: ${Math.abs(diff) < 5 ? "dead even with" : diff > 0 ? `${mmss(diff)} ahead of` : `${mmss(diff)} behind`} your ghost.`;
        const was = g.weight, now = session.sets[n - 1].weight;
        if (typeof was === "number" && typeof now === "number" && was !== now) note += ` ${now > was ? "+" : ""}${now - was} lbs vs last time.`;
      }
    }
    area.innerHTML = `<div class="ghost" aria-label="Ghost race">
        <div class="lane"><span class="lane-name">You</span><div class="lane-track"><div class="lane-fill you" style="transform:scaleX(${mine / total})"></div></div><span class="lane-count">${mine}/${total}</span></div>
        <div class="lane"><span class="lane-name">Ghost</span><div class="lane-track"><div class="lane-fill ghosty" style="transform:scaleX(${theirs / total})"></div></div><span class="lane-count">${theirs}/${total}</span></div>
        <p class="ghost-note">${note}</p>
      </div>`;
    if (session && !ghostTick) ghostTick = setInterval(renderGhost, 1000);
  }

  // =================================================================
  // Just Log: type or say "bench 185 for 8"
  // =================================================================

  function quickStatus(text) { $("quick-status").textContent = text; }

  $("quick-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = $("quick-input");
    const parsed = parseQuickLog(input.value);
    if (parsed.error) return quickStatus(parsed.error);
    const lift = matchLift(parsed.query, myLiftObjects(), library, SEARCH_SYNONYMS);
    if (!lift) return quickStatus(`No lift called “${parsed.query}”. Add it under Profile > My lifts.`);
    const unit = parsed.unit !== "reps" ? parsed.unit : unitFor(lift.kind);

    // Check off the next open set of that lift, or add a new line for it
    const i = entries.findIndex((en) => en.lift === lift.id && en.rows.some((r) => !r.done));
    if (i >= 0) {
      const row = entries[i].rows.find((r) => !r.done);
      row.done = true;
      row.reps = parsed.reps;
      if (parsed.weight) row.lbs = parsed.weight;
    } else {
      const added = newEntry(lift.id, 1, parsed.reps, unit, parsed.weight ? { type: "lbs", value: parsed.weight } : null);
      added.rows[0].done = true;
      entries.push(added);
      if (!myLifts.includes(lift.id)) { myLifts.push(lift.id); save("liftday.myLifts", myLifts); renderLiftPicker(); }
    }
    saveCard();
    recordSet(lift.id, parsed.weight, parsed.reps, unit);

    let msg = `Logged ${lift.name} ${parsed.weight ? `${parsed.weight} × ${parsed.reps}` : `${parsed.reps}${unit === "reps" ? " reps" : ` ${unit}`}`}`;
    if (parsed.weight && unit === "reps" && parsed.reps <= 12) {
      const est = estimateMax(parsed.weight, parsed.reps);
      const before = Math.max(maxes[lift.id] || 0, bests[lift.id] || 0);
      msg += ` · est. max ${est}`;
      if (est > (bests[lift.id] || 0)) { bests[lift.id] = est; save("liftday.bests", bests); }
      if (before && est > before) logPR(lift.id, est, est - before, true);
    }
    quickStatus(msg + ".");
    checkRankUp();
    input.value = "";
    if (nextSet(entries, maxes, step(), bar())) startRest();
    renderToday();
    renderRanks();
  });

  // Voice: only where the browser supports speech recognition (Chrome, Edge, Safari 14.1+)
  const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (Speech) {
    $("quick-mic").hidden = false;
    $("quick-mic").addEventListener("click", () => {
      const rec = new Speech();
      rec.lang = "en-US";
      rec.interimResults = false;
      quickStatus("Listening… say something like “bench 185 for 8”.");
      rec.onresult = (ev) => {
        $("quick-input").value = ev.results[0][0].transcript;
        $("quick-form").requestSubmit();
      };
      rec.onerror = () => quickStatus("Didn't catch that. Try again or type it.");
      rec.start();
    });
  }

  // Share the volume comparison
  $("stage").addEventListener("click", async (e) => {
    if (!e.target.closest("#share-volume")) return;
    const vol = daySummary(entries, maxes, step(), bar()).volume;
    const text = `I moved ${vol.toLocaleString()} lbs today on Lift Day. That's ${volumeComparison(vol).text}.`;
    try {
      if (navigator.share) await navigator.share({ text });
      else { await navigator.clipboard.writeText(text); $("share-status").textContent = "Copied. Paste it anywhere."; }
    } catch { /* closed the share sheet */ }
  });

  // =================================================================
  // Ranks (Wood to Olympian) with the roadmap to the next one
  // =================================================================

  const RANKED = ["squat", "bench", "deadlift", "overhead-press"];

  function rankRows() {
    return RANKED.filter((id) => myLifts.includes(id) || maxes[id] || bests[id]).map((id) => {
      const best = Math.max(maxes[id] || 0, bests[id] || 0);
      return { id, best, estimated: (bests[id] || 0) > (maxes[id] || 0), r: liftRank(id, best, bodyweight, sex) };
    });
  }

  // ---------- Get your rank: maxes right here on the Ranks tab ----------

  function openRankCalc() {
    rankCalcOpen = true;
    const calc = $("rank-calc");
    const lifts = RANKED.map(liftById).filter(Boolean);
    calc.innerHTML = `<div class="rank-calc">
        <p class="sheet-title big">Get your rank</p>
        <p class="hint">Enter your bodyweight and a max for any of these lifts. Don't know a max? Tap <strong>Estimate</strong> and put in a recent set. Your rank updates as you type.</p>
        <div class="max-row bw-row">
          <label for="rk-bw">Bodyweight</label>
          <input id="rk-bw" class="bw-input" type="number" inputmode="numeric" min="80" max="500" placeholder="lbs" value="${bodyweight || ""}">
        </div>
        ${lifts.map((l) => `
        <div class="max-item">
          <div class="max-row">
            <div class="max-label">
              <label for="rk-max-${l.id}">${l.name}</label>
              <button type="button" class="link est-toggle" data-lift="${l.id}" aria-expanded="false">Estimate</button>
            </div>
            <input id="rk-max-${l.id}" class="max-input" data-lift="${l.id}" type="number" inputmode="numeric" min="45" max="1500" placeholder="lbs" value="${maxes[l.id] || ""}">
            <span class="ratio" data-ratio="${l.id}"></span>
          </div>
          <div class="estimate" data-est="${l.id}" hidden>
            <p class="est-q">A set you did recently:</p>
            <div class="est-fields">
              <input class="est-w" type="number" inputmode="numeric" placeholder="lbs" aria-label="${l.name} weight lifted">
              <span aria-hidden="true">×</span>
              <input class="est-r" type="number" inputmode="numeric" placeholder="reps" aria-label="${l.name} reps">
            </div>
            <p class="est-out" aria-live="polite"></p>
          </div>
        </div>`).join("")}
        <p class="status" id="rank-status" aria-live="polite"></p>
        <button type="button" class="primary gap-s" id="rank-calc-done">See my rank</button>
      </div>`;
    calc.hidden = false;
    renderRanks();
    updateRatios();
    $("rk-bw").focus();
  }

  function closeRankCalc() {
    rankCalcOpen = false;
    $("rank-calc").hidden = true;
    $("rank-calc").innerHTML = "";
    checkRankUp();
    renderRanks();
    $("panel-ranks").scrollIntoView({ block: "start" });
  }

  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-get-rank]")) return openRankCalc();
    if (e.target.closest("#rank-calc-done")) return closeRankCalc();
  });

  function renderRanks() {
    const el = $("ranks");
    if (!el || !isPersonal()) return;
    const sexSwitch = `<div class="seg two" role="radiogroup" aria-label="Strength standards">
        <button type="button" role="radio" class="seg-btn" data-sex="men" aria-checked="${sex === "men"}"><strong>Men's standards</strong></button>
        <button type="button" role="radio" class="seg-btn" data-sex="women" aria-checked="${sex === "women"}"><strong>Women's standards</strong></button>
      </div>`;
    const rows = bodyweight ? rankRows() : [];
    const overall = overallRank(rows.map((x) => x.r));

    let top;
    const ranked = rows.filter((x) => x.r);
    if (!ranked.length) {
      top = rankCalcOpen ? "" : `<div class="empty-box get-rank-box">
          ${rankBadgeSVG(0, "badge-xl", true)}
          <p class="empty-title">Where do you stack up?</p>
          <p class="hint">Your squat, bench press, deadlift and overhead press compared with your bodyweight, from Wood up to Olympian.</p>
          <button type="button" class="primary gap-s" data-get-rank>Get your rank</button>
        </div>`;
    } else {
      top = `${overall ? `<div class="overall">
          ${rankBadgeSVG(overall.index, "badge-xl")}
          <p class="overall-rank rank-${overall.rank.toLowerCase()}">${overall.rank}</p>
          <p class="hint small">Overall · average of your ${overall.lifts} ranked ${overall.lifts === 1 ? "lift" : "lifts"}</p>
        </div>` : ""}
        <ul class="rank-list">${rows.map(({ id, best, estimated, r }) => `<li class="rank-row">
            ${r ? rankBadgeSVG(r.index, "badge-sm") : `<span class="badge-sm"></span>`}
            <div class="rank-body">
              <div class="rank-top">
                <span class="lift-name">${liftName(id)}</span>
                ${r ? `<span class="rank-title rank-${r.rank.toLowerCase()}">${r.rank}</span>` : ""}
              </div>
              ${r ? `<p class="hint small">${best} lbs${estimated ? " est." : ""} · ${bodyweightRatio(best, bodyweight)}× BW${r.percent !== null ? ` · stronger than ~${r.percent}% of lifters` : ""}</p>
                <p class="roadmap">${r.next ? `Next: <strong>${r.next.rank}</strong> at <strong>${r.next.weight} lbs</strong> (+${r.next.weight - best})` : "Top rank reached."}</p>`
              : `<p class="hint small">No max yet. Tap Update my maxes below.</p>`}
            </div>
          </li>`).join("")}</ul>
        ${rankCalcOpen ? "" : `<button type="button" class="secondary gap-s full" data-get-rank>Update my maxes</button>`}`;
    }
    el.innerHTML = `${top}<div class="gap-s">${sexSwitch}</div>
      <p class="note">Ranks use your max or your best estimated max from logged sets, divided by your bodyweight. Cut-offs come from <a href="https://strengthlevel.com/strength-standards/bench-press/lb" target="_blank" rel="noopener">Strength Level</a> (squat, bench, deadlift; "stronger than" is among lifters on that site) and <a href="https://www.strengthlog.com/overhead-press-strength-standards-lb/" target="_blank" rel="noopener">StrengthLog</a> (overhead press). Approximate.</p>`;

    // The ladder: every rank, unlocked ones in full color
    const reached = overall ? overall.index : -1;
    $("rank-ladder").innerHTML = RANKS.map((name, i) => `<li class="ladder-step${i <= reached ? " got" : ""}${i === reached ? " current" : ""}">
        ${rankBadgeSVG(i, "badge-md", i > reached)}
        <span class="ladder-name">${name}</span>
      </li>`).join("");
  }

  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-goto-max]")) return goToMax(RANKED.find((id) => myLifts.includes(id)) || "");
    const sx = e.target.closest("[data-sex]");
    if (!sx) return;
    sex = sx.dataset.sex;
    save("liftday.sex", sex);
    syncRanks();
    renderRanks();
  });

  // =================================================================
  // Home: muscle recovery map (+ recent days for personal)
  // =================================================================

  const RECOVERY_ORDER = ["Chest", "Shoulders", "Back", "Biceps", "Triceps", "Grip & forearms", "Abs", "Legs", "Calves"];
  const STATUS_TEXT = { ready: "Ready", almost: "Almost ready", rest: "Resting" };

  function renderHome() {
    const now = Date.now();
    const rows = RECOVERY_ORDER.map((g) => {
      const log = muscleLog[g];
      return { group: g, ...recoveryStatus(g, log && log.at, log && log.heavy, now), heavy: log && log.heavy };
    });
    const statuses = Object.fromEntries(rows.map((r) => [r.group, r.status]));
    const order = { rest: 0, almost: 1, ready: 2 };
    const anyTrained = rows.some((r) => r.hoursAgo !== null);
    $("recovery").innerHTML = `
      <div class="recovery">
        <div class="body-wrap">${bodyMapSVG(statuses)}</div>
        <div class="recovery-side">
          <ul class="legend">
            <li><span class="dot ready"></span>Ready</li>
            <li><span class="dot almost"></span>Almost</li>
            <li><span class="dot rest"></span>Resting</li>
          </ul>
          <p class="hint small">Back and triceps aren't visible from the front. They're in the list below.</p>
        </div>
      </div>
      ${anyTrained ? "" : `<p class="hint">Everything's green until you log sets. Each set you finish starts that muscle's recovery clock.</p>`}
      <ul class="recovery-list">${[...rows].sort((a, b) => order[a.status] - order[b.status]).map((r) => `<li>
          <span class="dot ${r.status}"></span>
          <span class="rec-name">${r.group === "Grip & forearms" ? "Forearms" : r.group}</span>
          <span class="rec-text">${r.hoursAgo === null ? "Ready · not trained yet"
            : r.status === "ready" ? `Ready · trained ${hoursText(r.hoursAgo)} ago`
            : `${STATUS_TEXT[r.status]} · ${hoursText(r.hoursAgo)} ago · ready in ~${hoursText(r.readyIn)}${r.heavy && r.group === "Legs" ? " (heavy day)" : ""}`}</span>
        </li>`).join("")}</ul>
      <p class="note">Recovery windows: abs and forearms 24 h, biceps and calves 24 to 48 h, triceps and shoulders 48 h, chest, back and legs 48 to 72 h, legs up to 96 h after heavy squats or deadlifts. General guidance; how you feel matters more.</p>`;

    if (!isPersonal()) {
      $("home-team").innerHTML = team && (team.joined || role === "coach")
        ? `<h2 class="gap">${escapeHTML(team.name || "Your team")}</h2>
           <p class="hint">${team.routines.length} team ${team.routines.length === 1 ? "workout" : "workouts"}. Load one from the Team tab.</p>
           <button type="button" class="secondary" data-goto-team>Open Team</button>`
        : `<h2 class="gap">Your team</h2><p class="hint">${role === "coach" ? "Create your team and workouts on the Team tab." : "Join your team on the Team tab with the link your coach sent."}</p>
           <button type="button" class="secondary" data-goto-team>Open Team</button>`;
    }
  }

  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-goto-team]")) showTab($("tab-team"));
  });

  // =================================================================
  // PR hype: airhorn or bell + a big vibration
  // =================================================================

  function playHype() {
    if (hype === "off" || !isPersonal()) return;
    if (navigator.vibrate) navigator.vibrate([150, 60, 150, 60, 450]);
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const now = audio.currentTime;
      const blasts = hype === "airhorn" ? [0, 0.22, 0.44] : [0, 0.18];
      for (const t of blasts) {
        const freqs = hype === "airhorn" ? [415, 523, 622] : [1318];
        for (const f of freqs) {
          const osc = audio.createOscillator();
          const gain = audio.createGain();
          osc.type = hype === "airhorn" ? "sawtooth" : "sine";
          osc.frequency.setValueAtTime(f, now + t);
          if (hype === "airhorn") osc.frequency.linearRampToValueAtTime(f * 1.03, now + t + 0.18);
          const len = hype === "airhorn" ? (t === 0.44 ? 0.6 : 0.18) : 0.5;
          gain.gain.setValueAtTime(0.0001, now + t);
          gain.gain.exponentialRampToValueAtTime(hype === "airhorn" ? 0.12 : 0.3, now + t + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + t + len);
          osc.connect(gain).connect(audio.destination);
          osc.start(now + t);
          osc.stop(now + t + len + 0.05);
        }
      }
    } catch { /* no sound available; the banner still shows */ }
  }

  function renderHype() {
    const el = $("hype-setting");
    if (!el) return;
    el.innerHTML = `<div class="seg" role="radiogroup" aria-label="PR sound">
        ${[["airhorn", "Airhorn"], ["bell", "Bell"], ["off", "Off"]].map(([v, l]) => `<button type="button" role="radio" class="seg-btn" data-hype="${v}" aria-checked="${hype === v}"><strong>${l}</strong></button>`).join("")}
      </div>
      <button type="button" class="secondary gap-s" id="test-hype" ${hype === "off" ? "disabled" : ""}>Test it</button>`;
  }

  document.addEventListener("click", (e) => {
    const h = e.target.closest("[data-hype]");
    if (h) { hype = h.dataset.hype; save("liftday.hype", hype); renderHype(); return; }
    if (e.target.closest("#test-hype")) playHype();
  });

  // =================================================================
  // Workout builder: set-type menu, editing sets in the table, Add exercise
  // =================================================================

  let addOpen = false;
  let menuAt = null; // "entry:set" the set menu is open for

  // ---------- New workout ----------
  function renderNewWorkout() {
    const hasCard = entries.length > 0;
    const busy = hasCard || routineDraft;
    $("new-workout").className = `${busy ? "secondary" : "primary"} new-workout${armedFor === "workout" ? " armed" : ""}`;
    $("new-workout-text").textContent = armedFor === "workout" ? "Tap again to clear this card" : "New workout";
    $("new-routine").className = `secondary new-workout${armedFor === "routine" ? " armed" : ""}`;
    $("new-routine-text").textContent = armedFor === "routine" ? "Tap again to clear this card" : "Start a new routine";
    $("new-workout-bar").hidden = (!hasCard && addOpen) || routineDraft; // the form is already open
  }

  function disarmNew() {
    clearTimeout(newArmed);
    newArmed = null;
    armedFor = null;
    renderNewWorkout();
  }

  function startNewWorkout(kind = "workout") {
    if (entries.length) {
      // Something is on the card: ask once more before clearing it
      if (armedFor !== kind) {
        clearTimeout(newArmed);
        armedFor = kind;
        newArmed = setTimeout(disarmNew, 4000);
        return renderNewWorkout();
      }
      clearTimeout(newArmed);
      newArmed = null;
      armedFor = null;
      commitPrevious();
      entries = [];
      cardRoutine = null;
      save("liftday.cardRoutine", null);
      endSession();
      stopRest();
      saveCard();
    }
    finishNote = "";
    routineDraft = kind === "routine";
    addOpen = true;
    renderToday();
    if (myLifts.length) $("lift").focus();
    else { const box = document.querySelector("#add-picker input[type=search]"); if (box) box.focus(); }
  }

  $("new-workout").addEventListener("click", () => startNewWorkout("workout"));
  $("new-routine").addEventListener("click", () => startNewWorkout("routine"));

  // ---------- The set list in Add exercise ----------
  function renderSetsSelect() {
    $("sets-select").innerHTML = Array.from({ length: MAX_PLAN_SETS }, (_, i) =>
      `<option value="${i + 1}">${i + 1} ${i === 0 ? "set" : "sets"}</option>`).join("");
  }

  function planUnitLabel() {
    return $("add-form").dataset.kind === "time" ? "Seconds" : "Reps";
  }

  function defaultPlanReps() {
    const last = [...plan].reverse().find((p) => typeof p.reps === "number");
    return last ? last.reps : Number($("add-form").reps.value) || 5;
  }

  function renderPlan() {
    $("sets-select").value = String(plan.length);
    const labels = setLabels(plan);
    const unit = planUnitLabel();
    $("set-plan").innerHTML = `<div class="plan-head" aria-hidden="true"><span>Set</span><span>Type</span><span>${unit}</span></div>` +
      plan.map((p, i) => `<div class="plan-row" role="listitem">
        <span class="set-type t-${p.type}" aria-hidden="true">${labels[i]}</span>
        <select data-plan-type="${i}" aria-label="Set ${i + 1} type">
          ${PLAN_TYPES.map(([v, t]) => `<option value="${v}"${p.type === v ? " selected" : ""}>${t}</option>`).join("")}
          <option value="remove"${plan.length === 1 ? " disabled" : ""}>Remove set</option>
        </select>
        ${p.type === "failure"
          ? `<span class="cell fail-cell plan-fail">Until you can't</span>`
          : `<input class="cell" data-plan-reps="${i}" type="number" inputmode="numeric" min="1" value="${p.reps}" aria-label="Set ${i + 1} ${unit.toLowerCase()}">`}
      </div>`).join("");
  }

  $("sets-select").addEventListener("change", (e) => {
    const n = Number(e.target.value);
    while (plan.length < n) plan.push({ type: "normal", reps: defaultPlanReps() });
    plan.length = n;
    renderPlan();
  });

  $("set-plan").addEventListener("change", (e) => {
    const sel = e.target.closest("[data-plan-type]");
    if (!sel) return;
    const i = Number(sel.dataset.planType);
    if (sel.value === "remove") {
      if (plan.length > 1) plan.splice(i, 1);
    } else {
      const p = plan[i];
      p.type = sel.value;
      if (p.type === "failure") p.reps = null;
      else if (typeof p.reps !== "number") p.reps = defaultPlanReps();
    }
    renderPlan();
    const again = $("set-plan").querySelector(`[data-plan-type="${Math.min(i, plan.length - 1)}"]`);
    if (again) again.focus();
  });

  // Typing reps doesn't redraw the list, so the cursor stays put
  $("set-plan").addEventListener("input", (e) => {
    const box = e.target.closest("[data-plan-reps]");
    if (!box) return;
    plan[Number(box.dataset.planReps)].reps = box.value === "" ? null : Number(box.value);
    box.removeAttribute("aria-invalid");
  });

  renderSetsSelect();
  renderPlan();

  $("add-toggle").addEventListener("click", () => {
    addOpen = true;
    $("add-toggle").setAttribute("aria-expanded", "true");
    renderCard();
    if (myLifts.length) $("lift").focus();
  });

  function openSetMenu(at) {
    menuAt = at;
    const [i, s] = at.split(":").map(Number);
    const e = entries[i];
    const label = setLabels(e.rows)[s];
    $("set-menu-title").textContent = `${liftName(e.lift)} · set ${label}`;
    for (const b of $("set-menu").querySelectorAll("[data-settype]")) b.setAttribute("aria-current", b.dataset.settype === e.rows[s].type);
    $("set-menu").showModal();
  }

  $("set-menu").addEventListener("click", (ev) => {
    const dlg = $("set-menu");
    if (ev.target === dlg || ev.target.closest("[data-menu-close]")) return dlg.close();
    const [i, s] = menuAt.split(":").map(Number);
    const e = entries[i];
    const pick = ev.target.closest("[data-settype]");
    if (pick) {
      changeSetType(e, e.rows[s], pick.dataset.settype);
    } else if (ev.target.closest("[data-remove-set]")) {
      e.rows.splice(s, 1);
      if (!e.rows.length) entries.splice(i, 1); // last set gone: the exercise goes too
      else e.sets = e.rows.length;
    } else return;
    dlg.close();
    saveCard();
    renderToday();
  });

  // Typing a weight or reps into a set row
  $("card").addEventListener("input", (ev) => {
    const cell = ev.target.closest("[data-cell]");
    if (!cell) return;
    const [i, s] = cell.dataset.at.split(":").map(Number);
    const row = entries[i].rows[s];
    const v = cell.value === "" ? null : Number(cell.value);
    if (cell.dataset.cell === "lbs") {
      row.lbs = v !== null && v >= 0 && v <= 1500 ? v : null;
    } else if (v !== null && v >= 1) {
      row.reps = Math.min(v, entries[i].unit === "sec" ? 600 : entries[i].unit === "min" ? 180 : 50);
    }
    saveCard();
    renderStage();
    renderFinish();
  });


  // =================================================================
  // Height + weight inputs (setup and Profile)
  // =================================================================

  function heightWeightHTML(prefix) {
    const ft = height ? Math.floor(height / 12) : "";
    const inch = height ? height % 12 : "";
    return `<div class="max-row hw-row">
        <span class="hw-label" id="${prefix}-h-label">Height</span>
        <div class="hw-pair" role="group" aria-labelledby="${prefix}-h-label">
          <label><input class="h-ft" type="number" inputmode="numeric" min="3" max="8" value="${ft}" aria-label="Feet"><span>ft</span></label>
          <label><input class="h-in" type="number" inputmode="numeric" min="0" max="11" value="${inch}" aria-label="Inches"><span>in</span></label>
        </div>
      </div>
      <div class="max-row bw-row">
        <label for="${prefix}-bw">Bodyweight</label>
        <input id="${prefix}-bw" class="bw-input" type="number" inputmode="numeric" min="80" max="500" placeholder="lbs" value="${bodyweight || ""}">
        <span></span>
      </div>`;
  }

  document.addEventListener("input", (e) => {
    if (!e.target.classList.contains("h-ft") && !e.target.classList.contains("h-in")) return;
    const box = e.target.closest(".hw-pair");
    const ft = box.querySelector(".h-ft").value;
    const inch = box.querySelector(".h-in").value;
    if (!ft) { height = null; save("liftday.height", null); return showStatus("Saved."); }
    const h = heightInches(ft, inch);
    if (h === null) return showStatus("Enter a height between 3 ft and 8 ft (inches 0 to 11).");
    height = h;
    showSaved(save("liftday.height", height));
  });

  // =================================================================
  // Picking a lift inside Add exercise (search the whole library)
  // =================================================================

  function openAddPicker(show) {
    const el = $("add-picker");
    el.hidden = !show;
    $("find-lift").setAttribute("aria-expanded", show);
    $("find-lift").textContent = show ? "Close search" : "Search all lifts";
    if (show && !el.innerHTML) renderPicker("add-picker");
  }

  $("find-lift").addEventListener("click", () => {
    const show = $("add-picker").hidden;
    openAddPicker(show);
    if (show) $("add-picker").querySelector(".lift-search").focus();
  });

  // =================================================================
  // Rank-up celebration: bigger the higher you climb (personal only)
  // =================================================================

  let rankState = load("liftday.rankState", null);

  function currentRanks() {
    const state = { lifts: {} };
    if (!bodyweight) return state;
    const rows = rankRows().filter((r) => r.r);
    for (const r of rows) state.lifts[r.id] = r.r.index;
    const overall = overallRank(rows.map((r) => r.r));
    if (overall) state.overall = overall.index;
    return state;
  }

  function syncRanks() {
    rankState = currentRanks();
    save("liftday.rankState", rankState);
  }

  function checkRankUp() {
    if (!isPersonal() || rankCalcOpen) return; // the calculator celebrates once, on See my rank
    const now = currentRanks();
    const up = rankUp(rankState || { lifts: {} }, now);
    rankState = now;
    save("liftday.rankState", rankState);
    if (up) celebrate(up);
  }

  // Ranks change when a max, bodyweight or estimated max changes
  document.addEventListener("change", (e) => {
    if (e.target.classList.contains("max-input") || e.target.classList.contains("bw-input") || e.target.id === "bodyweight") checkRankUp();
  });

  let celebrateTimer = null;
  function celebrate(up) {
    const tier = celebrationTier(up.index);
    const name = RANKS[up.index];
    const colors = BADGE_COLORS[up.index];
    const what = up.kind === "overall" ? "Overall rank" : `${liftName(up.id)} rank`;
    const best = up.kind === "lift" ? Math.max(maxes[up.id] || 0, bests[up.id] || 0) : 0;

    let fx = "";
    if (tier >= 1) {
      const rays = Array.from({ length: 16 }, (_, i) => {
        const a = (Math.PI * 2 * i) / 16;
        const b = a + Math.PI / 32;
        return `<polygon points="200,200 ${200 + 400 * Math.cos(a)},${200 + 400 * Math.sin(a)} ${200 + 400 * Math.cos(b)},${200 + 400 * Math.sin(b)}"/>`;
      }).join("");
      fx += `<svg class="ru-rays" viewBox="0 0 400 400" aria-hidden="true"><g fill="${colors[1]}">${rays}</g></svg>`;
      const n = tier === 1 ? 12 : tier === 2 ? 20 : 28;
      fx += `<div class="ru-sparks" aria-hidden="true">${Array.from({ length: n }, (_, i) => {
        const a = (Math.PI * 2 * i) / n + Math.random() * 0.3;
        const d = 110 + Math.random() * (60 + tier * 30);
        return `<i style="--dx:${(Math.cos(a) * d).toFixed(0)}px;--dy:${(Math.sin(a) * d).toFixed(0)}px;--c:${colors[i % 3]};animation-delay:${(Math.random() * 120).toFixed(0)}ms"></i>`;
      }).join("")}</div>`;
    }
    if (tier >= 2) fx += `<div class="ru-flash" aria-hidden="true"></div><div class="ru-rings" aria-hidden="true"><span></span><span></span>${tier >= 3 ? "<span></span>" : ""}</div>`;
    if (tier >= 3) {
      const pal = up.index === 8 ? ["#ffe9a8", "#ff9ad5", "#9ad0ff", "#b6ffd9", "#ffffff"] : [...colors, "#ffffff", "#f3b62a"];
      fx += `<div class="ru-halo" aria-hidden="true"></div><div class="ru-confetti" aria-hidden="true">${Array.from({ length: 44 }, (_, i) => `<i style="--x:${(Math.random() * 100).toFixed(1)}vw;--drift:${(Math.random() * 30 - 15).toFixed(0)}vw;--rot:${(Math.random() * 720 - 360).toFixed(0)}deg;--c:${pal[i % pal.length]};animation-delay:${(Math.random() * 700).toFixed(0)}ms;animation-duration:${(1800 + Math.random() * 1200).toFixed(0)}ms"></i>`).join("")}</div>`;
    }

    const el = $("rankup");
    el.className = `rankup tier-${tier} rank-${name.toLowerCase()}`;
    el.innerHTML = `${fx}
      <div class="ru-card">
        <div class="ru-badge">${rankBadgeSVG(up.index, "badge-hero")}</div>
        <p class="ru-rank">${name}</p>
        <p class="ru-sub">${what}${best ? ` · ${best} lbs` : ""}</p>
        <p class="ru-sub small">${up.index === 8 ? "The top rank. Nothing left to unlock." : `Next up: ${RANKS[up.index + 1]}`}</p>
        <button type="button" class="primary ru-ok" id="rankup-ok">Let's go</button>
      </div>`;
    el.hidden = false;
    $("rankup-ok").focus();
    if (navigator.vibrate) navigator.vibrate([[80], [100, 50, 100], [150, 60, 150, 60, 300], [200, 80, 200, 80, 200, 80, 500]][tier]);
    if (tier >= 1) playHype();
    clearTimeout(celebrateTimer);
    celebrateTimer = setTimeout(closeRankUp, 5000 + tier * 1000);
    renderRanks();
  }

  function closeRankUp() {
    clearTimeout(celebrateTimer);
    const el = $("rankup");
    if (el.hidden) return;
    el.classList.add("leaving");
    setTimeout(() => { el.hidden = true; el.innerHTML = ""; el.className = "rankup"; }, 220);
  }

  $("rankup").addEventListener("click", (e) => {
    if (e.target.closest("#rankup-ok") || !e.target.closest(".ru-card")) closeRankUp();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeRankUp(); });

  // ---------- Start ----------
  if (!rankState) syncRanks();
  if (pendingTeam && !(role === "coach")) {
    // Opened a coach's team link: go straight to joining it
    if (!mode) { mode = "team"; save("liftday.mode", mode); }
    role = "player";
    $("onboarding").hidden = false;
    setupStep = 0;
    renderSetup();
  } else if (mode) {
    showApp();
  } else {
    $("onboarding").hidden = false;
    renderSetup();
  }
}
