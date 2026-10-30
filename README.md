# Lift Day

Your strength program says "4 x 5 at 80%." Lift Day tells you that's 250, shows you the bar loaded with 45 + 45 + 10 + 2.5 on each side, and starts your rest timer when you're done.

It's a small web app for lifters, built first for athletes on teams that run percentage-based programs, and now for people training on their own too. Pick your lifts from a library of 460, put in your maxes, add today's workout, and it walks you through every set.

**Live app:** https://ethanr876.github.io/lift-day/
*(MGIS130 Build Project, Web-App track, Fall 2026)*

## Why I built this

When I played O-line at Edinboro, every lift day started the same way: the coach's sheet says percentages, and 60 guys pull out their phones to figure out what 75% of their squat is. Then they round it, then they figure out the plates. There was always a line of people asking the coach "what's my weight?"

When you're tired and the clock is running, most people skip the math and eyeball it. That means lifting too light (no progress) or too heavy (getting hurt). Lift Day takes the math off your plate so the only thing you do at the rack is lift.

## The tabs

The tab bar sits at the bottom of the screen.

| Personal | Team | What's there |
| --- | --- | --- |
| **Home** | **Home** | Muscle recovery map; recent lift days and PRs (personal); your team (team) |
| **Workout** | **Workout** | Just Log, the next set, today's card, add a line |
| **Ranks** | | Overall rank with its badge, each lift's rank and roadmap, all 9 badges |
| | **Team** | Coach: workouts and the invite link. Player: join, load workouts |
| **Profile** | **Profile** | Maxes and bodyweight, My lifts, My gym and PR sound (personal), Personal/Team switch |

**Team stays professional:** ranks, the ghost race, the animal volume comparisons and the PR airhorn are only on the personal side. Team users still get a plain "New PR" banner.

## How to use it

**First visit**

1. Pick **Just me** (personal training) or **My team**. You can switch later.
   - **My team → Coach:** name your team, pick its lifts, then build workouts (see Teams below).
   - **My team → Player:** paste the team link or code your coach sent you, or just open the link.
2. Personal: enter your **height and weight**, then your **gym** (bar weight and the plates you own). Coaches name their team. Every step can be skipped.
3. The app starts with no lifts. You **pick lifts when you build a workout**: in **Add exercise**, search the library (or use the recommended ones). Every lift has a picture of the movement. Set maxes any time in Profile (tap **Estimate** if you don't know one).

**Building a workout (Workout tab)**

1. Tap **New workout**, then pick one of your lifts (or tap **Search all lifts** to find a new one; it's added to your list). Choose **how many sets** from the dropdown and that many rows appear. Give each set a type (warm-up, normal, failure, drop, or remove it) and its reps. Failure sets don't take a rep count: you go until you can't. Set the weight (% of max or lbs) and tap **Add to workout**. Add more with **Add exercise**.
   - To build a routine without lifting yet, tap **Start a new routine**, add the exercises and sets, then **Save routine** and name it. It shows under My routines with a Start button.
2. Each exercise shows a table: **Set · Previous · Lbs · Reps · ✓**. Type a different weight or reps into any set. **Previous** shows what you did last time for that set.
3. **Add set** adds another set (copying the last one).
4. **Tap a set number** to change it: **Warm-up** (W), **Normal** (numbered), **Failure** (F), **Drop set** (D), or **Remove set**. Warm-ups don't count toward volume or your top set.
5. Tap **✓** when a set is done. Rest starts automatically.
6. Tap **Finish workout**. If you built it yourself, it asks **"Make this a routine?"** Name it and it's saved under **My routines** on the Workout tab, ready to **Start** next time. (Coaches: it's saved as a team workout instead.)

**Lift day**

1. On **Today**, pick a lift and fill in the line. The form changes with the lift:
   - weighted lifts: sets, reps, and either **% of max** or **lbs**
   - bodyweight lifts (pull-ups, push-ups): sets and reps
   - holds and carries (plank, farmers walk): sets and seconds
   - cardio (treadmill, bike, rower, stairmaster): minutes
2. The big number at the top is your **next set**. Barbell lifts show the loaded bar and the plates per side; everything else shows the movement picture.
3. Lift, then tap **Set done, start rest**. The rest timer counts down (2:30 to start, enough to recover between heavy sets; -15 / +15 changes it and it remembers). At zero it says GO, buzzes and beeps.
4. Tap any numbered circle to check off or undo a set.
5. Personal: tap **Finish and save day** to log it in **History**. Raise a max on **Me** and you get a **New PR** banner and a line in your PR log.

**Just Log:** at the top of Today, type (or tap the mic and say) something like `bench 185 for 8`, `squat 225x5`, `pull ups 10`, `plank 60 sec` or `treadmill 20 min`. It checks off the next set of that lift (or adds it), starts your rest, and works out your estimated max. Beat your best and you get a **New est. max** banner. Voice works in Chrome, Edge and newer Safari.

**Ghost:** finish a workout once and next time you do the exact same workout, a ghost of your last session races you set by set: a You vs Ghost bar, how far ahead or behind you are, and whether you're lifting more than last time.

**Card done:** you see your total volume as something real ("9,575 lbs, about 3 hippos") with a **Share it** button.

**Ranks (personal):** Wood, Bronze, Silver, Gold, Platinum, Diamond, Champion, Titan, Olympian, for squat, bench, deadlift and overhead press, plus an overall rank. Each lift shows your bodyweight multiple, roughly what share of lifters you're stronger than, and the exact weight you need for the next rank. Men's or women's standards.

**Rank-up celebrations (personal):** the first time you earn a rank, or any time a lift or your overall rank goes up, a celebration plays. It gets bigger as you climb: Wood to Silver, the badge pops in; Gold and Platinum add spinning light rays and sparks; Diamond and Champion add a flash and shockwave rings; Titan and Olympian add a breathing glow and confetti in the rank's colors. Tap **Let's go** (or anywhere) to close. With "reduce motion" on, it just fades in.

**PR sound (personal, in Profile):** an airhorn or a bell (or off) plus a big vibration when you set a PR.

**Muscle recovery (Home):** a front-of-body map colors each muscle group green (ready), yellow (almost ready) or red (still resting), with a list underneath showing when you last trained it and how long until it's ready. Back and triceps can't be seen from the front, so they're only in the list. The clock starts when you finish a set (Set done, a numbered circle, or Just Log), so it always counts from the workout you actually logged.

**Change your lifts anytime** on the **Lifts** tab. Can't find one? Search for it and add it as your own lift.

**Search tips:** shortcuts work, like `db` (dumbbell), `bb` (barbell), `kb` (kettlebell), `rdl`, `ohp`. "One arm", "one handed", "single arm" all find the same one-arm lifts.

## Teams (no server)

Lift Day has no server, so the whole team lives in a link.

1. The **coach** builds a workout on Today, then on the **Team** tab saves it with a name ("Monday lower"). Save as many as you want.
2. The coach taps **Copy link** (or **Share**) and sends it to the team chat.
3. A **player** opens the link (or pastes it), sees the team, coach and workouts, and taps **Join**. The team's lifts are added to their list.
4. Players tap **Load to Today** on a workout, and every set's weight comes from *their own* maxes.
5. When the coach changes workouts, they send the link again and players open it to update.

**What it can't do:** without a server, a player tapping Join can't send a request to the coach's phone, and the coach can't see a roster. That's on purpose: no accounts, and no player's name or maxes ever leave their phone. Real join requests would need online accounts and a database (Firebase or Supabase); see "Not in scope" below.

## The lift library

460 lifts in 12 groups: chest, shoulders, back, legs, glutes, biceps, triceps, abs, calves, grip & forearms, neck, and cardio.

- 396 come from my list.
- I added Treadmill and Stairmaster to cardio, plus 26 cable variations and 36 one-arm variations that weren't on the list (cable shrug, cable squat, one-arm dumbbell row, one-arm cable lateral raise, and so on).
- **The pictures are drawings, not photos.** Each lift is drawn as a simple made-up figure in one of 30 poses (squat, hinge, bench, row, pull-up, plank...) with its equipment at the hands: a plate for barbells, dumbbells, a cable line, a band, a kettlebell, a machine. Lifts with the same movement share a pose, so a pause squat and a box squat look alike.

## Rules the app follows

- **Rounding:** nearest 5 lbs on a 45 lb bar. 236 rounds to 235, 238 rounds to 240, and an exact tie (like 157.5) rounds up. With fewer plates (say no 2.5s), weights round in bigger steps counted from the bar, so you can always load what it shows.
- **Plates:** heaviest first, using only the plates you own. If a weight is lighter than the bar, it tells you.
- **Estimated max:** Epley formula, weight x (1 + reps / 30), rounded to 5. 225 x 5 = 265. Only for sets of 1 to 12 reps.
- **Pound-for-pound:** max divided by bodyweight. 315 at 180 lbs = 1.75x BW.
- **Recovery windows:** abs and forearms 24 h, biceps and calves 24 to 48 h, triceps and shoulders 48 h, chest, back and legs (quads, hamstrings, glutes) 48 to 72 h, and legs up to 96 h after heavy barbell squats or deadlifts. Green once the full window has passed, yellow inside the range (or the last quarter of a single number, like 18 to 24 h for abs), red before that. Each lift counts toward its muscle group from the library; heavy barbell squats and deadlifts put legs on the 72 to 96 h clock, and deadlifts count for back too. General guidance, not medical advice.
- **Volume** in History counts weighted sets only (weight x reps).
- **Volume comparisons** use rough average weights: golden retriever 65 lbs, giant panda 225, grizzly bear 600, grand piano 1,000, dairy cow 1,500, hippo 3,300, African elephant 13,000, school bus 25,000, humpback whale 66,000, blue whale 300,000. It picks the biggest thing you lifted at least one of.
- **Ranks** compare your max (or your best estimated max from Just Log) to your bodyweight. The rank cut-offs come from bodyweight-ratio standards worked out from [Strength Level](https://strengthlevel.com/strength-standards/bench-press/lb) (squat, bench, deadlift) and [StrengthLog](https://www.strengthlog.com/overhead-press-strength-standards-lb/) (overhead press). Strength Level's levels mean stronger than about 5% (Beginner), 20% (Novice), 50% (Intermediate), 80% (Advanced) and 95% (Elite) of lifters on that site; the app estimates in between. Bronze = Beginner, Silver = Novice, Platinum = Intermediate, Champion = Advanced, Olympian = Elite, with Gold, Diamond and Titan halfway between. The ratios shift a little with bodyweight, so treat ranks as approximate. Overhead press has no published percentiles, so it shows a rank only.

## Privacy

There are no accounts and no server. Everything (your lifts, maxes, bodyweight, card, history) is saved in your own browser (localStorage) and never leaves your phone. Nothing personal is stored in this repo.

## Running it yourself

It's plain HTML, CSS and JavaScript, so there's nothing to install.

- Open `index.html` in a browser, or
- Fork the repo and turn on GitHub Pages (Settings > Pages > deploy from the `main` branch).

To check the math and search, run the test with Node:

```
node tests/math-test.js
```

It runs 167 checks I worked out by hand: 20 set weights, rounding, plates, max estimates, home-gym rounding, search ("db curl", "rdl", "single arm row", "pull ups"), every kind of card line, ranks and roadmaps, muscle recovery (which groups each lift works, and red/yellow/green at the right hours), per-set rows (warm-up, failure and drop sets, failure sets with no rep count, their own weights, warm-ups left out of volume), height, rank-up detection and celebration tiers, volume comparisons, Just Log parsing, team links (including rejecting broken or tampered ones), ghost pacing, and that saved cards from older versions still load.

## Files

| File | Layer | What it does |
| --- | --- | --- |
| `index.html` | Display | The page: setup, tabs, the stage, the card, the forms |
| `style.css` | Display | The look (see `DESIGN.md`) |
| `lifts.js` | Data | The 460-lift library, recommended lifts, and search shortcuts |
| `figures.js` | Display | Draws the lift pictures (30 poses + equipment), the 9 rank badges, and the body recovery map |
| `script.js` | All three, labeled | **Data** (settings, saving), **Rules** (rounding, plates, search, estimates, card lines, ranks, volume comparisons, Just Log parsing, team links, ghost pacing, input checks), **Display** (everything on screen) |
| `tests/math-test.js` | | Hand-checked answers for everything in Rules |
| `PRODUCT.md` / `DESIGN.md` | | Who it's for and the design decisions |

## Project plan and status

Each milestone gets a tagged commit (`m1`, `m2`, ...) so the history lines up with the plan.

- [x] **Oct 30:** project plan done, status update #1
- [x] **m1:** maxes and a workout, every line's weight calculated and rounded, saved in the browser
- [x] **m2:** game-day look, plates per side on an animated barbell, set check-off, rest timer, pound-for-pound + PRs
- [x] **m2.5:** Personal vs Team, personal setup (max estimator, home gym, history), 460-lift library with search and pictures
- [x] **m2.6:** coach/player teams by share link, Just Log (type or voice), ghost of your last session, ranks with roadmap, volume comparisons, PR sound
- [x] **m2.9:** height + weight setup, lifts picked inside Add exercise, 2:30 default rest, rank-up celebrations
- [x] **m2.10:** New workout button, Sets dropdown that draws one row per set with its type and reps, failure sets with no rep count
- [x] **m2.11:** Get your rank calculator on the Ranks tab (maxes and estimates right there), Start a new routine (build and save a routine without logging a workout); sample day removed
- [x] **m2.8:** workout builder with a set table, set types (warm-up, normal, failure, drop), Add set, "Make this a routine?" and saved routines
- [x] **m2.7:** bottom tab bar (Home, Workout, Ranks/Team, Profile), rank badges, muscle recovery map, fun features personal-only
- [ ] **m3 (Nov 13):** lbs / kg, auto warm-up sets, status update #2, **feature freeze**
- [ ] **m4 (Nov 16):** edge cases, phone polish, accessibility pass
- [ ] **Nov 18:** "after" test with 5 lifters
- [ ] **Nov 20:** final submission

**Not in scope:** real join requests and team rosters, team leaderboards, team PR alerts, streaks, and racing a friend's ghost (all need a server and accounts, and would put teammates' personal data online); "Gym Tetris" equipment swapping; readiness/fatigue scores (a website can't read sleep data, and swapping lifts for joint pain is medical advice); Apple Watch haptics; video; writing programs for people.

## How I'm measuring if it works

Five lifters get the same printed workout (5 sets of squat, 4 sets of bench at set percentages). First they work out every weight and the plates their normal way, on a phone calculator. Then they use Lift Day. I record:

- seconds to get every weight and plate load
- how many math or loading mistakes they make
- a 1 to 5 rating on whether they'd actually use it on a lift day

The goal is under 30 seconds with zero mistakes. Results go here once the test is done.

## Built with

- HTML, CSS and JavaScript (no frameworks)
- [Archivo](https://fonts.google.com/specimen/Archivo) and [Big Shoulders Display](https://fonts.google.com/specimen/Big+Shoulders+Display) from Google Fonts
- GitHub Pages for hosting
- Claude (AI) helped write and review the code. What it got right, what it got wrong and what I changed is in my reflection.
