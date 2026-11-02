# Design

Game-day jersey: a deep navy field, your next weight set like a jersey number (white with a gold outline), and gold as the team color for anything you act on.

## Colors

Stadium lights at night: a cool navy field, one warm team gold that means "go", and a small set of status colors that always mean the same thing. Every color has one job.

| Token | Value | Job |
| --- | --- | --- |
| `--navy-900` | `#0b1730` | Page background |
| `--navy-800` | `#10213f` | Cards, inputs, panels |
| `--navy-700` | `#183059` | Secondary buttons, timer track, normal set badges |
| `--royal` | `#15336b` | The stage only: the one field that owns color, so the next set is the first thing you see |
| `--line` | `#2a4475` | Dividers, borders |
| `--white` | `#f4f6fa` | Main text, jersey number fill, 45 lb plates |
| `--soft` | `#a9b8d0` | Secondary text, and muscles that are fine |
| `--gold` | `#f3b62a` | **Go.** The jersey outline, the one main action on a screen, the next set's outline, the rest timer, focus rings, what a player is doing right now, chart data |
| `--sel` | `#f4f6fa` | **Selection.** The open tab, selected pills and toggles, a chosen lift, an open player card |
| `--ok` / `--ok-bg` | `#4fd18b` / `#12352f` | **Done and ready.** Checked sets (green check, green row), added lifts, workout days on the calendar, gains, "Live" |
| `--warn` / `--warn-bg` | `#f6c445` / `#3a3216` | **Almost.** Almost recovered, warm-up sets, short workouts |
| `--bad` / `--bad-bg` | `#ff7a6e` / `#3d1f2a` | **Stop.** Resting muscles, failure sets, errors, "tap again to clear" |
| `--info` / `--info-bg` | `#8fc3ff` / `#16305a` | **Reference.** Drop sets, links, Profile icons, last period on charts |

Rules: status shows as the hue on a dark tint of itself (the set badges, the Resting / Almost ready pills), never as a saturated block with white text. On Home only muscles that need attention get color; ready ones go quiet in soft grey. Every pair passes WCAG AA on every surface (lowest: coral on the royal stage, 4.8:1), and status is always also in words (Resting, Almost ready, W, F, D, a check).

## Type

- **Big Shoulders Display** (900): the jersey number, title, timer, big messages. Only for big numbers and short words.
- **Archivo**: everything else. Inputs are 18px so iPhones don't zoom on focus.
- All numbers use tabular figures so columns don't jump.

## Layout (phone first, max 34rem)

1. **Stage:** the next set (lift, set x of y, reps), the jersey number, the loaded barbell, "Each side: ...", then either "Set done, start rest" or the rest timer.
2. **Card:** one row per line of the workout, weight on the right, set circles underneath.
3. **Add to the card** form, then **Clear today's card**, set apart on its own.

Tap targets are at least 44px.

## Signature

The jersey number: `-webkit-text-stroke` in gold with `paint-order: stroke fill`, so the gold sits outside the white like tackle twill.

## Motion (from Emil Kowalski's animate skill)

| What | How | Why |
| --- | --- | --- |
| Plates load onto the bar | WAAPI, slide in 36px + fade, 200ms, `cubic-bezier(0.23, 1, 0.32, 1)`, 40ms stagger heaviest first | Shows the bar changing for the new set |
| Set circles, buttons | `scale(0.94-0.97)` on press, 120ms; color 150ms | Feedback only, these are tapped a lot |
| Rest timer | `scaleX` on the fill, 250ms linear | Constant progress |
| PR banner | slides down 300ms ease-out, leaves the same way after 3.2s | Rare moment, the one celebration |

Reduced motion: plates fade instead of slide, the banner fades, the timer bar jumps.

## States

Empty card, next set's lift has no max, weight lighter than the bar, just the bar, resting, rest over ("GO" + vibrate + beep), card done, invalid input, storage blocked.

## Lift library and pictures

- **Picker** (setup and the Lifts tab): your lifts as removable chips, a search box, a scrolling row of muscle-group filters, then results. With nothing typed it shows recommended lifts; results come 24 at a time with "Show more".
- **Results:** a 56px picture, the name, "group · equipment", and a round + button that turns gold with a check once added.
- **Pictures** (`figures.js`): a made-up mannequin, side view, in one of 30 poses. The near side of the body is `--white`, the far limbs a muted blue for depth, equipment in gold, props (bench, bar, machine frame) in `--line`. A barbell is drawn end-on as a gold plate at the hands.
- **Today:** barbell lifts show the loaded bar; every other lift shows its picture at 176px instead. The big number is the weight, or the reps / seconds / minutes for lifts without weight.
- **Add form:** fields show and hide by lift type (weight, reps, time, cardio). Weighted lifts get a "% of max / Lbs" switch; barbell-type lifts start on %, the rest on lbs.

## Teams, Just Log, ghost, ranks

- **Coach or player:** same big choice cards as Personal/Team. The join screen previews the team (name in jersey type, coach, workouts) with one gold Join button; the footer button drops to "Join later" so there's never two gold buttons.
- **Team tab:** workouts as cards with Load to Today; coaches also get Save today's card and a share box with the link. A small note says plainly that there's no server.
- **Just Log:** a single input row above the stage (input, mic if the browser supports it, Log). Feedback appears on the line under it.
- **Ghost race:** two thin lanes under the timer, You in gold, Ghost in muted blue (60% opacity), with a one-line note (ahead/behind, lbs vs last time). Updates once a second, bars ease over 400ms.
- **Card done:** total volume in gold with the comparison and a Share it button.
- **Ranks:** overall rank in big jersey type colored by rank; each lift gets a colored pill (Wood brown, Bronze, Silver, Gold, Platinum teal, Diamond blue, Champion red, Titan purple, Olympian pale gold) and a gold "Next:" roadmap line. Sources linked under the list.
- **PR sound:** Airhorn / Bell / Off with a Test button; sound is generated in the browser (Web Audio), no audio files.

## Condensed layout (bottom tabs)

- **Tab bar** fixed to the bottom: Home, Workout, Ranks (personal) or Team (team), Profile. Line icons, label under each; the open tab is white with a short white bar on the top edge. Header shrinks to the title and date.
- **Profile** folds into sections (`<details>`): Maxes & bodyweight (open), My lifts (with a count), My gym and PR sound (personal), then the Personal/Team switch.
- **Rank badges** (`figures.js`, `rankBadgeSVG`): a hexagon with a star that gains a ring (Silver), a spiked rim (Gold, bigger at Platinum), wings (Diamond, bigger at Champion), a star crest (Titan) and a prismatic gradient (Olympian). Ranks you haven't reached show grayscale and dimmed on the ladder.
- **Recovery map** (`bodyMapSVG`): front view, muscle regions filled green `#4fd18b`, yellow `#f6c445`, red `#ff6b5e`. Next to it a legend; under it a list sorted by what needs the most rest.
- **Personal only:** ranks, ghost race, animal comparisons, PR sound. Team keeps a plain "New PR" banner.

## Workout builder

- **Exercise card:** picture, name in gold, scheme line, remove X. Under it a set table: Set · Previous · Lbs · Reps · check (Lbs hidden for bodyweight, timed and cardio lifts). Inputs are dark wells; the computed weight shows as the placeholder until you type your own.
- **Set badge:** a 40px rounded square. Normal sets are numbered; W (amber on amber tint), F (coral on coral tint), D (sky on sky tint). The next set to do gets a gold outline; done rows turn green with a filled green check.
- **Set menu and "Make this a routine?"** are bottom sheets (`<dialog>`), sliding up 240ms ease-out (none with reduced motion). The routine name is pre-filled ("Bench Press + Dumbbell Curl") and selected.
- **Add exercise** folds away after you add one, behind a gold "Add exercise" button. Routines list under it with Start / Delete; the one on today's card has a gold border.
- Editing a cell never redraws the table (so focus stays where you tapped); only the stage and totals update live.

## New workout and the set list

- **New workout** sits at the top of the Workout tab. On an empty card it's the gold button and opens Add exercise. With exercises on the card it drops to a secondary button, and the first tap turns red ("Tap again to clear this card") for 4 seconds so a workout isn't wiped by accident.
- **Add exercise:** Lift, then a **Sets** dropdown (1 to 10), then the weight. Picking a number of sets draws that many rows underneath: set badge, a type dropdown (Warm-up, Normal, Failure, Drop, Remove set) and a Reps box.
- **Failure sets** have no rep count. The Reps box becomes a dashed "Until you can't" (on the card: "Fail"), and the stage shows MAX instead of a number. Failure sets don't count toward volume. Switching a set back from failure gives it a rep count again.

## Add exercise (search first)

- No lift dropdown. The form opens on a search box (focused), muscle-group chips, then **Recommended for you**: lifts you've done before first, tagged "Done before" in a small gold label, then popular lifts. A lift already on the card is tagged "On the card". The list scrolls inside the form (max 26rem) so the page doesn't jump.
- Tapping a lift swaps the search for a gold-bordered **chosen** row (picture, name, group, Change) and the fields slide in (200ms ease-out, none with reduced motion): Sets, weight, the set list, Add to workout.
- After adding, the form goes straight back to the search with a gold "Bench Press added" line, so you can add the next lift without extra taps. **Done** closes it.

## Team workouts (coach)

- Gold **Build a team workout** at the top of the coach's Team tab. The same builder (card + Add exercise) moves into the Team tab with a header: "New team workout", Cancel, and Save team workout. Check-off boxes are hidden. The coach's own card is set aside and comes back on save or cancel.

## Start a new routine

- Second button under New workout (always secondary). It opens Add exercise in routine mode: the stage becomes a "New routine" panel with a gold **Save routine** (once there's an exercise) and a quiet Cancel. Check-off boxes are hidden, Add exercise drops to secondary, and nothing gets logged. Saving asks for a name, then empties the card and the routine shows under My routines.

## Get your rank (Ranks tab)

- With no ranked lift yet, the Ranks tab shows a locked badge, one line on what ranks are, and a gold **Get your rank** button. Once ranked, an **Update my maxes** button sits under the list.
- The calculator opens at the top of the tab in a gold-bordered panel: bodyweight, then squat, bench, deadlift and overhead press, each with **Estimate** (weight × reps). Ranks update live underneath. The rank-up celebration waits for **See my rank**, so it doesn't cover the form while you type.

## Profile dashboard (after Hevy)

- **Header:** a round avatar with your initial (gold ring), your name with an edit pencil, then Workouts · Week streak · Volume.
- **Dashboard card:** the selected week's value as a big readout, a 12-week column chart (gold columns 24px max, 4px rounded tops, hairline grid at 0 / half / top, tap a column to read it), and Duration / Volume / Reps pills.
- **Four tiles:** Statistics, Exercises, Measurements, Calendar. Each opens a page inside Profile with a back arrow; the settings sections sit under them.
- **Statistics:** a 7-day strip (gold dot = workout, tap a day to filter), front and back body heat maps (one hue, gold, brighter = more sets), then links to Set count per muscle (week navigator + table), Muscle distribution (six-axis radar, this period `#c48508` over the one before `#5b8fd6`, both validated against the navy surface, with a legend and a table), Main exercises and Monthly report (12-month columns, summary cards against the month before, heaviest lifts).
- **Exercises:** search with your exercises first; each lift page shows heaviest, max, workouts, sets, a line of the heaviest set each time (2px line, 8px dots with a navy ring, 10% wash) and the full history.
- **Measurements:** latest weigh-in as the readout, 1M / 3M / 1Y / All, a line chart, an add form (lbs + date), and the history with delete. Changing bodyweight anywhere logs it here; the newest weigh-in becomes your bodyweight.
- **Calendar:** week streak and rest days on top, months with workout days as gold circles (today ringed), tap one to see that day's lifts.
- Stats show in team mode too (they're plain numbers, no jokes or ranks).

## Coach's live roster

- **Join card** asks "Your name" above the gold Join button, with one line saying what the coach sees and that it goes through ntfy.sh. Join won't go without a name.
- **Players** heading with a live pill on the right: green pulsing dot "Live", yellow "Connecting…", gray "Offline".
- **Player card:** initial avatar, name, a status dot (green = lifting in the last 20 min, gold = finished, gray = idle) with "just now / 5 min ago", the current exercise and set in gold ("Squat · set 2 of 2"), a soft line with the workout, exercise x of y and sets done, and a thin gold progress bar. Tap to open: Workouts finished and Sets hit tiles, Progress (first → best weight, gain in green), Recent workouts (short ones in yellow), and a quiet Remove.
- **Player's Team tab:** a card showing the name the coach sees, a Change form, and whether the last update reached the coach.

## Welcome (first visit)

- The first screen is a working demo, not a question: "Your max 315", percent pills 65 to 90, and the stage on royal blue showing "Squat · 80% of 315", the jersey number 250, the loaded bar and "Each side". Change either and the plates load again. One gold **Start lifting**, then a secondary **I lift with a team**, then one line: no account, switch anytime. The title is 44px (it's the one sales screen).

## Workout order

- Empty card: New workout (gold) and Start a new routine, Just log, then the stage's empty message and your routines.
- With a workout: the **stage leads**, then the card, Finish, Add exercise (secondary), Just log, and New workout / Start a new routine as one quiet row of two at the bottom. Done with CSS `order`, so nothing moves in the DOM.

## Home (answer first)

- The heading answers "what can I train today?": "Ready today: back, biceps, forearms and abs +1 more", a line naming what's still resting, and one gold **Start a workout** (or "Go to today's workout"). Then the body map at 12.5rem with the key in a row, then **Recovering**: only resting and almost-ready groups, each with a Resting / Almost ready tag and its ready-in time. Brand-new users open on Workout instead.

## Surfaces

- Resting cards (exercise cards, team cards, the dashboard, summary tiles, player cards) separate from the page by one tone step (`--navy-800` on `--navy-900`), no border. Controls keep their 1px border. Small labels are sentence case at 13px (Set · Previous · Lbs · Reps), never uppercase tracked. The tab bar is solid, no blur.

## Laptop (64rem and up)

- The bottom bar becomes a 15rem rail on the left (icon + label rows, the open one on `--navy-800`). Content sits beside it, up to 72rem.
- Two columns where a screen has two jobs: **Workout** (the stage stays put on the left while you work down the card on the right; jersey number 9rem), **Home** (answer and map | recovering list), **Profile** (you and your chart | tiles and settings), **Ranks** (your ranks | the whole ladder). Team, sub-pages and the welcome stay single columns.

## Rank-up celebration

Full-screen overlay (navy at 88%), the new badge, the rank name in its color, what ranked up, and "Let's go". The badge pops with a strong ease-out and a built-in overshoot (scale 0.4 to 1.08 to 1, 640ms); the title and lines rise in after it, staggered 100ms. It gets louder by tier:

| Tier | Ranks | Adds |
| --- | --- | --- |
| 0 | Wood, Bronze, Silver | Pop only, short buzz |
| 1 | Gold, Platinum | Slow-turning light rays (SVG, 22% opacity), 12 sparks bursting out, PR sound |
| 2 | Diamond, Champion | White flash, two shockwave rings in the rank color, 20 sparks, bigger badge |
| 3 | Titan, Olympian | Breathing halo, a third ring, 28 sparks, 44 pieces of confetti (prismatic for Olympian), longest buzz |

Closes itself after 5 to 8 seconds. Reduced motion: everything fades, no rays, rings, sparks or confetti. Personal side only.
