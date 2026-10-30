# LiftDay


Your strength program says "4 x 5 at 75%." Lift Day tells you that's 235.

It's a small web app for athletes on teams that run percentage-based lifting programs. You put in your maxes once, add today's workout, and it shows the weight for every line, already rounded to something you can actually load on a bar.

Live app: https://ethanr876.github.io/lift-day/ (MGIS130 Build Project, Web-App track, Fall 2026)

Why I built this

When I played O-line at Edinboro, every lift day started the same way: the coach's sheet says percentages, and 60 guys pull out their phones to figure out what 75% of their squat is. Then they round it, then they figure out the plates. There was always a line of people asking the coach "what's my weight?"

When you're tired and the clock is running, most people skip the math and eyeball it. That means lifting too light (no progress) or too heavy (getting hurt). Lift Day takes the math off your plate so the only thing you do at the rack is lift.

How to use it
Open My maxes and type your 1-rep max for squat, bench, deadlift and power clean. It saves as you type.
Go back to Today, pick a lift, and enter the sets, reps and percent from your program. Tap Add to card.
Read your weight on the right. The heaviest line for each lift (your top set) is underlined in red.
Tap the X on a line to remove it, or Clear today's card to start a new day.

If you add a lift you don't have a max for yet, the card shows a link to go add it.

Rounding rule: nearest 5 lbs on a 45 lb bar. 236 rounds to 235, 238 rounds to 240, and an exact tie (like 157.5) rounds up.

Privacy

There are no accounts and no server. Your maxes and your card are saved in your own browser (localStorage) and never leave your phone. Nothing personal is stored in this repo.

Running it yourself

It's plain HTML, CSS and JavaScript, so there's nothing to install.

Open index.html in a browser, or
Fork the repo and turn on GitHub Pages (Settings > Pages > deploy from the main branch).

To check the math, run the test with Node:

node tests/math-test.js

It checks 20 answers I worked out by hand, plus the rounding examples and the top-set logic.

Files
File	What it does
index.html	The page: tabs, the lift card, the forms
style.css	The look (see DESIGN.md)
script.js	The math at the top, saving in the middle, the page at the bottom
tests/math-test.js	Hand-checked answers for the math
PRODUCT.md / DESIGN.md	Who it's for and the design decisions
Project plan and status

Each milestone gets a tagged commit (m1, m2, ...) so the history lines up with the plan.

 Oct 30: project plan done, status update #1
 m1 (Nov 6): enter maxes and a workout, every line's weight calculated and rounded, saved in the browser
 m2 (Nov 11): plates per side, your gym's plate inventory, auto warm-up sets
 m3 (Nov 13): lbs / kg, status update #2, feature freeze
 m4 (Nov 16): edge cases (max lighter than the bar, weights you can't load exactly), phone polish, accessibility pass
 Nov 18: "after" test with 5 lifters
 Nov 20: final submission

Not in scope: tracking lifts over time, logins, video, or writing programs for people.

How I'm measuring if it works

Five lifters get the same printed workout (5 sets of squat, 4 sets of bench at set percentages). First they work out every weight their normal way, on a phone calculator. Then they use Lift Day. I record:

seconds to get every weight
how many math or loading mistakes they make
a 1 to 5 rating on whether they'd actually use it on a lift day

The goal is under 30 seconds with zero mistakes. Results go here once the test is done.

Built with
HTML, CSS and JavaScript (no frameworks)
Archivo from Google Fonts
GitHub Pages for hosting
Claude (AI) helped write and review the code. What it got right, what it got wrong and what I changed is in my reflection.
