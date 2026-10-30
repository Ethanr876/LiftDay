# LiftDay

Your strength program says "4 x 5 at 80%." Lift Day tells you that's 250, shows you the bar loaded with 45 + 45 + 10 + 2.5 on each side, and starts your rest timer when you're done.

It's a small web app for lifters, built first for athletes on teams that run percentage-based programs, and now for people training on their own too. Pick your lifts from a library of 460, put in your maxes, add today's workout, and it walks you through every set.

Live app: https://ethanr876.github.io/lift-day/ (MGIS130 Build Project, Web-App track, Fall 2026)

Why I built this

When I played O-line at Edinboro, every lift day started the same way: the coach's sheet says percentages, and 60 guys pull out their phones to figure out what 75% of their squat is. Then they round it, then they figure out the plates. There was always a line of people asking the coach "what's my weight?"

When you're tired and the clock is running, most people skip the math and eyeball it. That means lifting too light (no progress) or too heavy (getting hurt). Lift Day takes the math off your plate so the only thing you do at the rack is lift.

How to use it

First visit

Pick Just me (personal training) or My team (your coach writes the program). You can switch later.
Pick your lifts. The app starts empty. You see recommended lifts first; type in the search box to find anything else, or tap a muscle group. Every lift has a picture of the movement. Tap + to add it.
Personal only: add your bodyweight, your maxes (tap Estimate if you don't know one), and your gym (bar weight and the plates you own). Every step can be skipped.

Lift day

On Today, pick a lift and fill in the line. The form changes with the lift:
weighted lifts: sets, reps, and either % of max or lbs
bodyweight lifts (pull-ups, push-ups): sets and reps
holds and carries (plank, farmers walk): sets and seconds
cardio (treadmill, bike, rower, stairmaster): minutes
The big number at the top is your next set. Barbell lifts show the loaded bar and the plates per side; everything else shows the movement picture.
Lift, then tap Set done, start rest. The rest timer counts down (90 seconds to start; -15 / +15 changes it and it remembers). At zero it says GO, buzzes and beeps.
Tap any numbered circle to check off or undo a set.
Personal: tap Finish and save day to log it in History. Raise a max on Me and you get a New PR banner and a line in your PR log.

Change your lifts anytime on the Lifts tab. Can't find one? Search for it and add it as your own lift.

Search tips: shortcuts work, like db (dumbbell), bb (barbell), kb (kettlebell), rdl, ohp. "One arm", "one handed", "single arm" all find the same one-arm lifts.

The lift library

460 lifts in 12 groups: chest, shoulders, back, legs, glutes, biceps, triceps, abs, calves, grip & forearms, neck, and cardio.

396 come from my list.
I added Treadmill and Stairmaster to cardio, plus 26 cable variations and 36 one-arm variations that weren't on the list (cable shrug, cable squat, one-arm dumbbell row, one-arm cable lateral raise, and so on).
The pictures are drawings, not photos. Each lift is drawn as a simple made-up figure in one of 30 poses (squat, hinge, bench, row, pull-up, plank...) with its equipment at the hands: a plate for barbells, dumbbells, a cable line, a band, a kettlebell, a machine. Lifts with the same movement share a pose, so a pause squat and a box squat look alike.
Rules the app follows
Rounding: nearest 5 lbs on a 45 lb bar. 236 rounds to 235, 238 rounds to 240, and an exact tie (like 157.5) rounds up. With fewer plates (say no 2.5s), weights round in bigger steps counted from the bar, so you can always load what it shows.
Plates: heaviest first, using only the plates you own. If a weight is lighter than the bar, it tells you.
Estimated max: Epley formula, weight x (1 + reps / 30), rounded to 5. 225 x 5 = 265. Only for sets of 1 to 12 reps.
Pound-for-pound: max divided by bodyweight. 315 at 180 lbs = 1.75x BW.
Volume in History counts weighted sets only (weight x reps).
Privacy

There are no accounts and no server. Everything (your lifts, maxes, bodyweight, card, history) is saved in your own browser (localStorage) and never leaves your phone. Nothing personal is stored in this repo.

Running it yourself

It's plain HTML, CSS and JavaScript, so there's nothing to install.

Open index.html in a browser, or
Fork the repo and turn on GitHub Pages (Settings > Pages > deploy from the main branch).

To check the math and search, run the test with Node:

node tests/math-test.js

It runs 81 checks I worked out by hand: 20 set weights, rounding, plates, max estimates, home-gym rounding, search ("db curl", "rdl", "single arm row"), every kind of card line, and that saved cards from older versions still load.

Files
File	Layer	What it does
index.html	Display	The page: setup, tabs, the stage, the card, the forms
style.css	Display	The look (see DESIGN.md)
lifts.js	Data	The 460-lift library, recommended lifts, and search shortcuts
figures.js	Display	Draws the lift pictures (30 poses + equipment)
script.js	All three, labeled	Data (settings, saving), Rules (rounding, plates, search, estimates, card lines, input checks), Display (everything on screen)
tests/math-test.js		Hand-checked answers for everything in Rules
PRODUCT.md / DESIGN.md		Who it's for and the design decisions
Project plan and status

Each milestone gets a tagged commit (m1, m2, ...) so the history lines up with the plan.

 Oct 30: project plan done, status update #1
 m1: maxes and a workout, every line's weight calculated and rounded, saved in the browser
 m2: game-day look, plates per side on an animated barbell, set check-off, rest timer, pound-for-pound + PRs
 m2.5: Personal vs Team, personal setup (max estimator, home gym, history), 460-lift library with search and pictures
 m3 (Nov 13): lbs / kg, auto warm-up sets, status update #2, feature freeze
 m4 (Nov 16): edge cases, phone polish, accessibility pass
 Nov 18: "after" test with 5 lifters
 Nov 20: final submission

Not in scope: team leaderboards, team PR alerts and streaks (they'd need a server and accounts, and would put teammates' personal data online), tracking a lift's progress over time beyond the PR log, video, and writing programs for people.

How I'm measuring if it works

Five lifters get the same printed workout (5 sets of squat, 4 sets of bench at set percentages). First they work out every weight and the plates their normal way, on a phone calculator. Then they use Lift Day. I record:

seconds to get every weight and plate load
how many math or loading mistakes they make
a 1 to 5 rating on whether they'd actually use it on a lift day

The goal is under 30 seconds with zero mistakes. Results go here once the test is done.

Built with
HTML, CSS and JavaScript (no frameworks)
Archivo and Big Shoulders Display from Google Fonts
GitHub Pages for hosting
Claude (AI) helped write and review the code. What it got right, what it got wrong and what I changed is in my reflection.
