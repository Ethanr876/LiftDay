# LiftDay


Your strength program says "4 x 5 at 80%." Lift Day tells you that's 250, shows you the bar loaded with 45 + 45 + 10 + 2.5 on each side, and starts your rest timer when you're done.

It's a small web app for athletes on teams that run percentage-based lifting programs. You put in your maxes once, add today's workout, and it walks you through every set: the weight, the plates, and the rest.

Live app: https://ethanr876.github.io/lift-day/ (MGIS130 Build Project, Web-App track, Fall 2026)

Why I built this

When I played O-line at Edinboro, every lift day started the same way: the coach's sheet says percentages, and 60 guys pull out their phones to figure out what 75% of their squat is. Then they round it, then they figure out the plates. There was always a line of people asking the coach "what's my weight?"

When you're tired and the clock is running, most people skip the math and eyeball it. That means lifting too light (no progress) or too heavy (getting hurt). Lift Day takes the math off your plate so the only thing you do at the rack is lift.

How to use it
Open My maxes. Type your 1-rep max for squat, bench, deadlift and power clean, plus your bodyweight if you want your pound-for-pound numbers. It saves as you type.
Go to Today, pick a lift, enter the sets, reps and percent from your program, and tap Add to card.
The big number at the top is your next set. Under it, the bar shows exactly which plates go on each side.
Lift, then tap Set done, start rest. The rest timer counts down (90 seconds to start; use -15 / +15 to change it, and it remembers). At zero it says GO, buzzes and beeps.
You can also tap any set circle on the card to check it off or undo it.
Raise a max on My maxes and you get a New PR banner.

Rounding rule: nearest 5 lbs on a 45 lb bar. 236 rounds to 235, 238 rounds to 240, and an exact tie (like 157.5) rounds up.

Plates: standard US plates (45, 35, 25, 10, 5, 2.5), heaviest first. If a weight is lighter than the empty bar, the app tells you instead of drawing nonsense.

Pound-for-pound: your max divided by your bodyweight. 315 at 180 lbs bodyweight = 1.75x BW.

Privacy

There are no accounts and no server. Your maxes, bodyweight and card are saved in your own browser (localStorage) and never leave your phone. Nothing personal is stored in this repo.

Running it yourself

It's plain HTML, CSS and JavaScript, so there's nothing to install.

Open index.html in a browser, or
Fork the repo and turn on GitHub Pages (Settings > Pages > deploy from the main branch).

To check the math, run the test with Node:

node tests/math-test.js

It checks 33 answers I worked out by hand: 20 set weights, the rounding examples, the top set, 9 plate loads, pound-for-pound, and finding the next set.

Files
File	What it does
index.html	The page: tabs, the stage, the card, the forms
style.css	The look (see DESIGN.md)
script.js	Three labeled layers: Data (lifts, plates, settings, saving), Rules (rounding, plates per side, pound-for-pound, next set, input checks), Display (drawing the page, the barbell, the timer, handling taps)
tests/math-test.js	Hand-checked answers for everything in Rules
PRODUCT.md / DESIGN.md	Who it's for and the design decisions
Project plan and status

Each milestone gets a tagged commit (m1, m2, ...) so the history lines up with the plan.

 Oct 30: project plan done, status update #1
 m1: enter maxes and a workout, every line's weight calculated and rounded, saved in the browser
 m2: new game-day look, plates per side on an animated barbell, check off sets, rest timer, pound-for-pound + PR banner
 m3 (Nov 13): lbs / kg, auto warm-up sets, status update #2, feature freeze
 m4 (Nov 16): edge cases, phone polish, accessibility pass, custom plate inventory if there's time
 Nov 18: "after" test with 5 lifters
 Nov 20: final submission

Not in scope: tracking lifts over time, logins, video, or writing programs for people. I also cut team leaderboards, team PR alerts and streaks on purpose: they'd need a server and accounts, and they'd put teammates' personal data online. They're on the "if I kept going" list in my reflection.

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
