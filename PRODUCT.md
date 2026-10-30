# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static HTML/CSS/JS (index.html, style.css, script.js), no frameworks, hosted on GitHub Pages. No backend, no accounts, no API keys. Data saved in the browser with localStorage. Same setup as the user's MGIS130 D2 project.

## Users

The athlete at the rack: a college or club athlete on a team that runs a percentage-based strength program. They are mid-session, tired, on a clock, phone in one hand, often chalky or sweaty, standing in a loud weight room. Their job: turn "4 x 5 at 75%" into the actual weight for every set without doing math.

Strength coaches are a secondary audience (a shared coach link is a later nice-to-have, not m1).

## Product Purpose

Lift Day turns a day's percentage-based workout into every set's real weight, rounded to something you can load. It exists because athletes do this math by hand between sets, skip it under fatigue, and end up lifting the wrong weight. Success: every set's weight in under 30 seconds with zero mistakes, measured against the athlete's normal phone-calculator method.

## Positioning

Generic 1RM calculators give one number at a time. Lift Day gives the whole day at once, already rounded to loadable weight, built for use at the rack rather than at a desk.

## Operating Context

Used in a weight room between sets. Maxes are entered once and reused. A workout is a list of lifts, each with sets x reps at a percentage of that lift's max. Main lifts: squat, bench, deadlift, power clean.

## Capabilities and Constraints

- m1 (this build): enter maxes, enter a workout, see every set's weight rounded, saved in localStorage.
- Default rounding: nearest 5 lb, 45 lb bar. Round to nearest (236 -> 235, 238 -> 240).
- Later milestones (not m1): plates per side, custom plate inventory, auto warm-ups (m2); lbs/kg (m3); edge cases and accessibility pass (m4).
- Out of scope: tracking lifts over time, logins, video, writing programs.
- No personal data in the repo.

## Evidence on Hand

None yet. Before/after test with 5 lifters is planned for Nov 2 and Nov 18. Do not invent results, testimonials or user counts.

## Product Principles

1. The answer is the weight. The number you load is the biggest thing on screen.
2. Zero math left for the athlete. Every number shown is final and loadable.
3. Usable one-handed, tired, in a loud room.
4. Small and correct beats big and almost right.

## Accessibility & Inclusion

High contrast and large tap targets for use in a bright or dim weight room with sweaty hands.
