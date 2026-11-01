// Lift Day: lift pictures (DISPLAY layer, loaded before script.js)
// Every lift gets a still drawing of a made-up mannequin doing the movement.
// One pose per movement pattern (squat, hinge, bench...) plus the equipment drawn at the hands,
// so 460 lifts share about 30 poses. Side view, facing right, 120 x 120 box, floor at y = 108.

const POSES = {
  stand:    { head: [60, 24], sh: [60, 36], el: [60, 52], ha: [61, 68], hip: [60, 64], kn: [61, 86], ft: [60, 107] },
  carry:    { head: [60, 24], sh: [60, 36], el: [61, 52], ha: [62, 68], hip: [60, 64], kn: [61, 86], ft: [60, 107] },
  calf:     { head: [60, 18], sh: [60, 30], el: [61, 46], ha: [62, 62], hip: [60, 58], kn: [61, 80], ft: [62, 101], props: ["step"] },
  curl:     { head: [60, 24], sh: [60, 36], el: [60, 53], ha: [72, 44], hip: [60, 64], kn: [61, 86], ft: [60, 107] },
  raise:    { head: [60, 24], sh: [60, 36], el: [73, 39], ha: [88, 40], hip: [60, 64], kn: [61, 86], ft: [60, 107] },
  overhead: { head: [55, 30], sh: [59, 41], el: [66, 27], ha: [67, 13], hip: [60, 66], kn: [61, 87], ft: [60, 107] },
  frontrack:{ head: [56, 24], sh: [60, 36], el: [76, 46], ha: [74, 36], hip: [60, 64], kn: [61, 86], ft: [60, 107] },
  pushdown: { head: [63, 24], sh: [62, 36], el: [62, 52], ha: [68, 68], hip: [58, 64], kn: [60, 86], ft: [58, 107], cable: "high" },
  squat:    { head: [74, 36], sh: [64, 49], el: [54, 58], ha: [56, 48], hip: [46, 74], kn: [70, 76], ft: [60, 107] },
  hinge:    { head: [84, 50], sh: [74, 56], el: [74, 72], ha: [74, 87], hip: [44, 62], kn: [56, 84], ft: [56, 107] },
  row:      { head: [84, 50], sh: [74, 56], el: [60, 60], ha: [66, 70], hip: [44, 62], kn: [56, 84], ft: [56, 107] },
  lunge:    { head: [58, 30], sh: [58, 42], el: [58, 58], ha: [59, 73], hip: [58, 70], kn: [78, 84], ft: [80, 107], kn2: [44, 96], ft2: [28, 104] },
  jump:     { head: [64, 22], sh: [62, 34], el: [50, 40], ha: [44, 28], hip: [54, 60], kn: [70, 72], ft: [58, 90], el2: [52, 42], ha2: [46, 30] },
  bench:    { head: [90, 78], sh: [79, 83], el: [79, 68], ha: [79, 54], hip: [50, 83], kn: [30, 76], ft: [26, 107], props: ["bench"] },
  pushup:   { head: [92, 76], sh: [82, 81], el: [82, 94], ha: [82, 107], hip: [52, 88], kn: [36, 96], ft: [18, 104] },
  plank:    { head: [90, 84], sh: [80, 90], el: [80, 107], ha: [94, 107], hip: [50, 92], kn: [34, 98], ft: [18, 104] },
  crunch:   { head: [24, 84], sh: [32, 90], el: [26, 80], ha: [20, 88], hip: [56, 101], kn: [70, 86], ft: [86, 106] },
  bridge:   { head: [16, 99], sh: [27, 100], el: [42, 94], ha: [56, 80], hip: [56, 84], kn: [76, 82], ft: [82, 107] },
  prone:    { head: [92, 82], sh: [82, 86], el: [92, 96], ha: [100, 96], hip: [52, 86], kn: [32, 86], ft: [26, 68], props: ["bench"] },
  quad:     { head: [92, 76], sh: [82, 82], el: [82, 95], ha: [82, 107], hip: [52, 82], kn: [50, 106], ft: [30, 107], kn2: [32, 76], ft2: [14, 66] },
  seated:   { head: [50, 34], sh: [50, 46], el: [60, 60], ha: [70, 66], hip: [50, 76], kn: [72, 76], ft: [76, 106], props: ["seat"] },
  pulldown: { head: [56, 38], sh: [55, 50], el: [66, 38], ha: [62, 22], hip: [52, 78], kn: [74, 78], ft: [76, 106], props: ["seat"], cable: "high" },
  pullup:   { head: [60, 22], sh: [60, 34], el: [48, 24], ha: [58, 10], hip: [60, 62], kn: [66, 82], ft: [58, 98], props: ["bar"] },
  hang:     { head: [63, 28], sh: [60, 36], el: [60, 22], ha: [60, 10], hip: [60, 64], kn: [61, 86], ft: [60, 104], props: ["bar"] },
  hangleg:  { head: [64, 28], sh: [60, 36], el: [60, 22], ha: [60, 10], hip: [60, 64], kn: [80, 62], ft: [100, 66], props: ["bar"] },
  dip:      { head: [62, 36], sh: [60, 48], el: [48, 56], ha: [60, 66], hip: [58, 76], kn: [66, 92], ft: [56, 102], props: ["dipbars"] },
  run:      { head: [66, 22], sh: [63, 34], el: [54, 46], ha: [62, 56], hip: [58, 62], kn: [72, 74], ft: [74, 96], kn2: [52, 80], ft2: [40, 94], el2: [72, 44], ha2: [80, 36], props: ["treadmill"] },
  bike:     { head: [74, 30], sh: [66, 40], el: [76, 48], ha: [86, 52], hip: [46, 60], kn: [64, 66], ft: [58, 88], props: ["bike"] },
  rower:    { head: [34, 58], sh: [36, 70], el: [52, 80], ha: [62, 78], hip: [40, 98], kn: [60, 82], ft: [80, 98], props: ["rower"] },
  stair:    { head: [62, 20], sh: [60, 32], el: [70, 44], ha: [80, 50], hip: [58, 60], kn: [72, 66], ft: [72, 84], kn2: [56, 82], ft2: [52, 102], props: ["stairs"] },
};

// What each piece of equipment looks like (side view, so a barbell is seen end-on as a plate)
const FIG = { body: "#eef2f8", far: "#7f90ad", kit: "#f3b62a", line: "#a9b8d0", prop: "#2a4475", floor: "#2a4475" };

function figureSVG(pattern, equip, cls = "fig") {
  const p = POSES[pattern] || POSES.stand;
  const L = (a, b, color, w) => `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`;
  const path = (pts, color, w) => `<polyline points="${pts.map((q) => q.join(",")).join(" ")}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const ha = p.ha;
  let back = "", props = "", kit = "";

  // Props behind the person
  for (const prop of p.props || []) {
    if (prop === "bench") props += `<rect x="22" y="88" width="76" height="7" rx="2" fill="${FIG.prop}"/>${L([34, 95], [34, 108], FIG.prop, 4)}${L([86, 95], [86, 108], FIG.prop, 4)}`;
    if (prop === "seat") props += `<rect x="36" y="80" width="30" height="6" rx="2" fill="${FIG.prop}"/>${L([44, 86], [44, 108], FIG.prop, 4)}${L([36, 82], [36, 46], FIG.prop, 5)}`;
    if (prop === "bar") props += L([30, 9], [96, 9], FIG.line, 4);
    if (prop === "dipbars") props += `${L([44, 67], [80, 67], FIG.line, 4)}${L([76, 67], [76, 108], FIG.prop, 4)}`;
    if (prop === "step") props += `<rect x="46" y="101" width="34" height="7" rx="1" fill="${FIG.prop}"/>`;
    if (prop === "treadmill") props += `<rect x="20" y="97" width="80" height="8" rx="4" fill="${FIG.prop}"/>${L([96, 97], [100, 52], FIG.prop, 4)}${L([92, 52], [104, 52], FIG.prop, 4)}`;
    if (prop === "bike") props += `<circle cx="84" cy="96" r="11" fill="none" stroke="${FIG.prop}" stroke-width="4"/>${L([46, 62], [60, 98], FIG.prop, 4)}${L([60, 98], [84, 96], FIG.prop, 4)}${L([84, 96], [86, 52], FIG.prop, 4)}${L([38, 62], [52, 62], FIG.prop, 5)}`;
    if (prop === "rower") props += `<rect x="16" y="100" width="94" height="5" rx="2" fill="${FIG.prop}"/><circle cx="102" cy="86" r="11" fill="${FIG.prop}"/>${L([62, 78], [96, 84], FIG.line, 2)}`;
    if (prop === "stairs") props += `<path d="M30 108 V96 H52 V84 H72 V72 H92 V108 Z" fill="${FIG.prop}"/>${L([84, 50], [96, 50], FIG.line, 4)}`;
  }

  // Equipment
  const eq = equip;
  if (["barbell", "EZ bar", "trap bar", "Smith machine"].includes(eq)) {
    if (eq === "Smith machine") back += L([ha[0] + 16, 4], [ha[0] + 16, 108], FIG.prop, 4);
    kit += `<circle cx="${ha[0]}" cy="${ha[1]}" r="12" fill="${FIG.kit}"/><circle cx="${ha[0]}" cy="${ha[1]}" r="3" fill="#0b1730"/>`;
  } else if (eq === "dumbbell") {
    kit += `<rect x="${ha[0] - 7}" y="${ha[1] - 5}" width="14" height="10" rx="3" fill="${FIG.kit}"/>`;
    if (p.ha2) kit += `<rect x="${p.ha2[0] - 7}" y="${p.ha2[1] - 5}" width="14" height="10" rx="3" fill="${FIG.kit}"/>`;
  } else if (eq === "kettlebell") {
    kit += `<circle cx="${ha[0]}" cy="${ha[1] + 8}" r="7" fill="${FIG.kit}"/><path d="M${ha[0] - 4} ${ha[1] + 3} Q${ha[0]} ${ha[1] - 4} ${ha[0] + 4} ${ha[1] + 3}" fill="none" stroke="${FIG.kit}" stroke-width="2.5"/>`;
  } else if (eq === "cable" || eq === "machine") {
    const high = p.cable === "high" || ["overhead", "pulldown", "pushdown", "crunch"].includes(pattern);
    const anchor = high ? [108, 8] : [108, 102];
    back += `<rect x="104" y="6" width="8" height="102" rx="2" fill="${FIG.prop}"/>${L(ha, anchor, FIG.line, 2)}<circle cx="${anchor[0]}" cy="${anchor[1]}" r="3.5" fill="${FIG.line}"/>`;
    if (eq === "machine") back += `<rect x="98" y="70" width="14" height="38" rx="2" fill="${FIG.line}" opacity="0.5"/>`;
    kit += `<rect x="${ha[0] - 4}" y="${ha[1] - 3}" width="8" height="6" rx="2" fill="${FIG.kit}"/>`;
  } else if (eq === "band") {
    kit += `<path d="M${ha[0]} ${ha[1]} Q${ha[0] + 14} ${(ha[1] + 108) / 2} ${ha[0] + 4} 107" fill="none" stroke="${FIG.kit}" stroke-width="2.5" stroke-dasharray="5 3"/>`;
  } else if (eq === "landmine") {
    kit += `${L(ha, [ha[0] - 44, 106], FIG.line, 3)}<circle cx="${ha[0] + 4}" cy="${ha[1] - 3}" r="9" fill="${FIG.kit}"/>`;
  } else if (eq === "medicine ball") {
    kit += `<circle cx="${ha[0] + 4}" cy="${ha[1] - 2}" r="9" fill="${FIG.kit}"/>`;
  } else if (eq === "plate") {
    kit += `<circle cx="${ha[0]}" cy="${ha[1]}" r="10" fill="none" stroke="${FIG.kit}" stroke-width="5"/>`;
  } else if (eq === "rings") {
    kit += `${L([ha[0], 0], [ha[0], ha[1] - 5], FIG.line, 1.5)}<circle cx="${ha[0]}" cy="${ha[1]}" r="5" fill="none" stroke="${FIG.kit}" stroke-width="3"/>`;
  } else if (eq === "sled") {
    kit += `<path d="M${ha[0] + 4} ${ha[1] - 4} L${ha[0] + 14} 106 H${ha[0] + 40} V88 H${ha[0] + 18}" fill="${FIG.kit}"/>`;
  } else if (eq === "ab wheel") {
    kit += `<circle cx="${ha[0] + 2}" cy="101" r="7" fill="${FIG.kit}"/>`;
  } else if (eq === "gripper" || eq === "wrist roller") {
    kit += `<rect x="${ha[0] - 3}" y="${ha[1] - 6}" width="6" height="12" rx="2" fill="${FIG.kit}"/>`;
  }

  // The person: far limbs first (darker), then the near side on top
  const kn2 = p.kn2 || [p.kn[0] - 4, p.kn[1]];
  const ft2 = p.ft2 || [p.ft[0] - 5, p.ft[1]];
  const el2 = p.el2 || [p.el[0] - 3, p.el[1]];
  const ha2 = p.ha2 || [p.ha[0] - 3, p.ha[1]];
  const person =
    path([p.hip, kn2, ft2], FIG.far, 7) +
    path([p.sh, el2, ha2], FIG.far, 6) +
    L(p.sh, p.hip, FIG.body, 11) +
    path([p.hip, p.kn, p.ft], FIG.body, 7.5) +
    path([p.sh, p.el, p.ha], FIG.body, 6.5) +
    `<circle cx="${p.head[0]}" cy="${p.head[1]}" r="7.5" fill="${FIG.body}"/>`;

  return `<svg class="${cls}" viewBox="0 0 120 120" aria-hidden="true">
    ${L([4, 108], [116, 108], FIG.floor, 2)}${back}${props}${person}${kit}
  </svg>`;
}

// ---------------------------------------------------------------------
// Rank badges: a hexagon with a star that gets fancier as you climb.
// Wood/Bronze: plain hex. Silver: ring. Gold: spiked rim. Platinum: bigger spikes.
// Diamond: small wings. Champion: big wings. Titan: wings + crest. Olympian: all of it, prismatic.
// ---------------------------------------------------------------------
const BADGE_COLORS = [
  ["#a77a50", "#6b4526", "#4a2e18"], // Wood
  ["#e39a5f", "#a3592b", "#6e3412"], // Bronze
  ["#eef2f7", "#a6b1c0", "#6b7686"], // Silver
  ["#ffe07a", "#f0a91c", "#a76a06"], // Gold
  ["#c4fbf4", "#5cc7bb", "#2a7d74"], // Platinum
  ["#d6ecff", "#6aa8f5", "#2f62b8"], // Diamond
  ["#ffb3a6", "#f05a47", "#9d2318"], // Champion
  ["#e2d4ff", "#9c7af2", "#5233a8"], // Titan
  ["#fff3c4", "#ff9ad5", "#8fc6ff"], // Olympian
];

function hexPoints(cx, cy, r) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
}

function starPoints(cx, cy, r1, r2, n = 5) {
  return Array.from({ length: n * 2 }, (_, i) => {
    const r = i % 2 ? r2 : r1;
    const a = (Math.PI / n) * i - Math.PI / 2;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
}

let badgeCount = 0;
function rankBadgeSVG(index, cls = "badge-svg", locked = false) {
  const [light, mid, dark] = BADGE_COLORS[index];
  const id = `bg${index}-${badgeCount++}`;
  const fillTop = index === 8 ? `url(#${id}p)` : `url(#${id}g)`;
  let wings = "", spikes = "", crest = "";

  if (index >= 3) {
    const n = index >= 4 ? 12 : 6;
    const len = index >= 4 ? 13 : 10;
    for (let i = 0; i < n; i++) {
      const a = ((Math.PI * 2) / n) * i - Math.PI / 2 + (n === 6 ? Math.PI / 6 : 0);
      const tip = [60 + (38 + len) * Math.cos(a), 62 + (38 + len) * Math.sin(a)];
      const l = [60 + 34 * Math.cos(a - 0.22), 62 + 34 * Math.sin(a - 0.22)];
      const r = [60 + 34 * Math.cos(a + 0.22), 62 + 34 * Math.sin(a + 0.22)];
      spikes += `<polygon points="${l.map((v) => v.toFixed(1)).join(",")} ${tip.map((v) => v.toFixed(1)).join(",")} ${r.map((v) => v.toFixed(1)).join(",")}" fill="${dark}"/>`;
    }
  }
  if (index >= 5) {
    const span = index >= 6 ? 1 : 0.7;
    const wing = (dir) => {
      const x = (v) => (60 + dir * v).toFixed(1);
      const feathers = [0, 1, 2].map((k) => {
        const y = 52 + k * 13;
        const reach = (52 - k * 8) * span;
        return `<path d="M${x(30)} ${y} Q${x(30 + reach * 0.6)} ${y - 10} ${x(30 + reach)} ${y - 4} Q${x(30 + reach * 0.7)} ${y + 6} ${x(30)} ${y + 10} Z" fill="${k === 0 ? light : mid}" stroke="${dark}" stroke-width="1.5"/>`;
      });
      return feathers.reverse().join("");
    };
    wings = wing(-1) + wing(1);
  }
  if (index >= 7) {
    crest = `<polygon points="${starPoints(60, 14, 11, 5)}" fill="${index === 8 ? "#fff3c4" : light}" stroke="${dark}" stroke-width="1.5"/>`;
  }

  return `<svg class="${cls}${locked ? " locked" : ""}" viewBox="-4 -4 128 128" aria-hidden="true">
    <defs>
      <linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${light}"/><stop offset="1" stop-color="${mid}"/></linearGradient>
      <linearGradient id="${id}p" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe9a8"/><stop offset="0.35" stop-color="#ff9ad5"/><stop offset="0.7" stop-color="#9ad0ff"/><stop offset="1" stop-color="#b6ffd9"/></linearGradient>
    </defs>
    ${wings}${spikes}
    <polygon points="${hexPoints(60, 62, 38)}" fill="${fillTop}" stroke="${dark}" stroke-width="3"/>
    <polygon points="${hexPoints(60, 62, 28)}" fill="${dark}" opacity="${index === 8 ? 0.35 : 0.55}"/>
    ${index >= 2 ? `<circle cx="60" cy="62" r="20" fill="none" stroke="${light}" stroke-width="2.5" opacity="0.9"/>` : ""}
    <polygon points="${starPoints(60, 62, index >= 4 ? 17 : 15, index >= 4 ? 6.5 : 6, index >= 6 ? 8 : 5)}" fill="${index === 8 ? "#ffffff" : light}" stroke="${dark}" stroke-width="1"/>
    ${crest}
  </svg>`;
}

// ---------------------------------------------------------------------
// Front-of-body muscle map. Each muscle region is colored by its recovery status.
// Regions drawn on the left side and mirrored. viewBox 160 x 320.
// ---------------------------------------------------------------------
const BODY_REGIONS = {
  Shoulders: ["M44 55 C50 49 58 50 61 53 L58 72 C52 76 44 80 39 78 C37 68 39 60 44 55 Z"],
  Chest: ["M61 56 C68 54 76 55 79 57 L79 88 C72 92 64 92 58 87 C55 80 56 68 61 56 Z"],
  Biceps: ["M39 81 C44 80 50 78 54 79 L51 112 C47 117 41 117 37 112 C36 102 36 90 39 81 Z"],
  "Grip & forearms": ["M36 118 C41 120 48 120 51 117 L46 168 C42 172 36 172 32 168 C31 150 32 132 36 118 Z"],
  Abs: ["M67 95 L93 95 L92 148 C86 153 74 153 68 148 Z", "M58 94 L65 96 L66 146 C62 142 58 134 56 126 Z"],
  Legs: ["M56 170 C64 168 74 172 79 178 L77 236 C71 240 63 240 59 236 C53 216 52 192 56 170 Z"],
  Calves: ["M59 248 C64 246 70 246 74 248 L71 298 C67 301 63 301 61 298 C57 282 57 264 59 248 Z"],
};

function mirrorPath(d) {
  return d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${160 - Number(x)} ${y}`);
}

// Back of the body (left half; mirrored for the right)
const BACK_REGIONS = {
  Back: [
    "M66 50 C72 48 80 47 80 47 L80 82 C74 77 68 68 62 59 C62 55 63 51 66 50 Z",      // trapezius
    "M60 68 C66 74 73 82 79 86 L79 124 C72 128 64 126 58 120 C55 104 56 86 60 68 Z", // lats
    "M64 129 L79 129 L79 150 C73 152 67 150 63 146 Z",                               // lower back
  ],
  Shoulders: ["M44 55 C50 49 58 50 61 54 L58 72 C52 76 44 80 39 78 C37 68 39 60 44 55 Z"],
  Triceps: ["M39 81 C44 80 50 78 54 79 L51 112 C47 117 41 117 37 112 C36 102 36 90 39 81 Z"],
  "Grip & forearms": ["M36 118 C41 120 48 120 51 117 L46 168 C42 172 36 172 32 168 C31 150 32 132 36 118 Z"],
  Legs: [
    "M58 153 C66 151 74 153 79 157 L79 186 C72 190 62 188 56 182 C54 172 55 161 58 153 Z", // glutes
    "M57 192 C64 192 72 194 78 198 L76 238 C70 242 63 242 59 238 C55 222 55 206 57 192 Z", // hamstrings
  ],
  Calves: ["M59 248 C65 244 72 246 75 250 L72 292 C68 297 63 297 61 292 C56 278 56 262 59 248 Z"],
};

const BODY_SILHOUETTE = `
    <ellipse cx="80" cy="24" rx="14" ry="17"/>
    <rect x="72" y="38" width="16" height="14" rx="4"/>
    <path d="M46 52 C60 46 100 46 114 52 C124 56 126 66 124 80 L118 116 L127 168 C128 176 124 182 118 180 L110 120 L104 150 L108 172 L104 244 L101 300 C101 308 106 312 100 314 L88 314 C84 312 86 306 86 300 L82 244 L80 190 L78 244 L74 300 C74 306 76 312 72 314 L60 314 C54 312 59 308 59 300 L56 244 L52 172 L56 150 L50 120 L42 180 C36 182 32 176 33 168 L42 116 L36 80 C34 66 36 56 46 52 Z"/>`;

// How much each muscle was worked: levels { group: 0..1 }. One hue (gold), brighter = more sets.
function bodyHeatSVG(levels, side = "front", cls = "body-heat") {
  const regions = side === "back" ? BACK_REGIONS : BODY_REGIONS;
  let muscles = "";
  for (const [group, paths] of Object.entries(regions)) {
    const level = levels[group] || 0;
    const fill = level > 0 ? "#f3b62a" : "#22396a";
    const opacity = level > 0 ? (0.3 + 0.7 * level).toFixed(2) : "1";
    for (const d of paths) {
      for (const shape of [d, mirrorPath(d)]) {
        muscles += `<path d="${shape}" fill="${fill}" fill-opacity="${opacity}" stroke="#0b1730" stroke-width="1.5"><title>${group}</title></path>`;
      }
    }
  }
  const lines = side === "back"
    ? `<path d="M80 48 V150" stroke="#0b1730" stroke-width="1.5" fill="none"/>`
    : `<path d="M80 96 V150 M68 112 H92 M68 129 H92" stroke="#0b1730" stroke-width="1.5" fill="none"/>`;
  return `<svg class="${cls}" viewBox="0 0 160 320" role="img" aria-label="${side === "back" ? "Back" : "Front"} of the body, muscles shaded by sets">
    <g fill="#183059" stroke="#2a4475" stroke-width="1.5">${BODY_SILHOUETTE}</g>
    ${muscles}${lines}
  </svg>`;
}

// statuses: { group: "ready" | "almost" | "rest" }
function bodyMapSVG(statuses, cls = "body-map") {
  const color = { ready: "#4fd18b", almost: "#f6c445", rest: "#ff6b5e" };
  let muscles = "";
  for (const [group, paths] of Object.entries(BODY_REGIONS)) {
    const fill = color[statuses[group] || "ready"];
    for (const d of paths) {
      for (const shape of [d, mirrorPath(d)]) {
        muscles += `<path d="${shape}" fill="${fill}" fill-opacity="0.9" stroke="#0b1730" stroke-width="1.5"><title>${group}</title></path>`;
      }
    }
  }
  // six-pack lines
  const abLines = `<path d="M80 96 V150 M68 112 H92 M68 129 H92" stroke="#0b1730" stroke-width="1.5" fill="none"/>`;
  const silhouette = `
    <ellipse cx="80" cy="24" rx="14" ry="17"/>
    <rect x="72" y="38" width="16" height="14" rx="4"/>
    <path d="M46 52 C60 46 100 46 114 52 C124 56 126 66 124 80 L118 116 L127 168 C128 176 124 182 118 180 L110 120 L104 150 L108 172 L104 244 L101 300 C101 308 106 312 100 314 L88 314 C84 312 86 306 86 300 L82 244 L80 190 L78 244 L74 300 C74 306 76 312 72 314 L60 314 C54 312 59 308 59 300 L56 244 L52 172 L56 150 L50 120 L42 180 C36 182 32 176 33 168 L42 116 L36 80 C34 66 36 56 46 52 Z"/>`;
  return `<svg class="${cls}" viewBox="0 0 160 320" role="img" aria-label="Front of the body, muscles colored by recovery">
    <g fill="#183059" stroke="#2a4475" stroke-width="1.5">${silhouette}</g>
    ${muscles}${abLines}
  </svg>`;
}
