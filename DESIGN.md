# Design

Game-day jersey: a deep navy field, your next weight set like a jersey number (white with a gold outline), and gold as the team color for anything you act on.

## Colors

| Token | Value | Job |
| --- | --- | --- |
| `--navy-900` | `#0b1730` | Page background |
| `--navy-800` | `#10213f` | The stage panel, inputs |
| `--navy-700` | `#183059` | Secondary buttons, timer track |
| `--line` | `#2a4475` | Dividers, borders, open set circles |
| `--white` | `#f4f6fa` | Main text, jersey number fill, 45 lb plates |
| `--soft` | `#a9b8d0` | Labels and secondary text |
| `--gold` | `#f3b62a` | Team color: primary buttons, done sets, next set, top set, timer, PR banner |
| `--red` | `#ff7a6e` | Errors only |

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

- **Tab bar** fixed to the bottom: Home, Workout, Ranks (personal) or Team (team), Profile. Line icons, label under each, gold for the open tab. Header shrinks to the title and date.
- **Profile** folds into sections (`<details>`): Maxes & bodyweight (open), My lifts (with a count), My gym and PR sound (personal), then the Personal/Team switch.
- **Rank badges** (`figures.js`, `rankBadgeSVG`): a hexagon with a star that gains a ring (Silver), a spiked rim (Gold, bigger at Platinum), wings (Diamond, bigger at Champion), a star crest (Titan) and a prismatic gradient (Olympian). Ranks you haven't reached show grayscale and dimmed on the ladder.
- **Recovery map** (`bodyMapSVG`): front view, muscle regions filled green `#4fd18b`, yellow `#f6c445`, red `#ff6b5e`. Next to it a legend; under it a list sorted by what needs the most rest.
- **Personal only:** ranks, ghost race, animal comparisons, PR sound. Team keeps a plain "New PR" banner.

## Workout builder

- **Exercise card:** picture, name in gold, scheme line, remove X. Under it a set table: Set · Previous · Lbs · Reps · check (Lbs hidden for bodyweight, timed and cardio lifts). Inputs are dark wells; the computed weight shows as the placeholder until you type your own.
- **Set badge:** a 40px rounded square. Normal sets are numbered; W (amber), F (red), D (light blue). The next set to do gets a gold outline; done rows get a faint gold wash and a filled gold check.
- **Set menu and "Make this a routine?"** are bottom sheets (`<dialog>`), sliding up 240ms ease-out (none with reduced motion). The routine name is pre-filled ("Bench Press + Dumbbell Curl") and selected.
- **Add exercise** folds away after you add one, behind a gold "Add exercise" button. Routines list under it with Start / Delete; the one on today's card has a gold border.
- Editing a cell never redraws the table (so focus stays where you tapped); only the stage and totals update live.

## New workout and the set list

- **New workout** sits at the top of the Workout tab. On an empty card it's the gold button and opens Add exercise. With exercises on the card it drops to a secondary button, and the first tap turns red ("Tap again to clear this card") for 4 seconds so a workout isn't wiped by accident.
- **Add exercise:** Lift, then a **Sets** dropdown (1 to 10), then the weight. Picking a number of sets draws that many rows underneath: set badge, a type dropdown (Warm-up, Normal, Failure, Drop, Remove set) and a Reps box.
- **Failure sets** have no rep count. The Reps box becomes a dashed "Until you can't" (on the card: "Fail"), and the stage shows MAX instead of a number. Failure sets don't count toward volume. Switching a set back from failure gives it a rep count again.

## Rank-up celebration

Full-screen overlay (navy at 88%), the new badge, the rank name in its color, what ranked up, and "Let's go". The badge pops with a strong ease-out and a built-in overshoot (scale 0.4 to 1.08 to 1, 640ms); the title and lines rise in after it, staggered 100ms. It gets louder by tier:

| Tier | Ranks | Adds |
| --- | --- | --- |
| 0 | Wood, Bronze, Silver | Pop only, short buzz |
| 1 | Gold, Platinum | Slow-turning light rays (SVG, 22% opacity), 12 sparks bursting out, PR sound |
| 2 | Diamond, Champion | White flash, two shockwave rings in the rank color, 20 sparks, bigger badge |
| 3 | Titan, Olympian | Breathing halo, a third ring, 28 sparks, 44 pieces of confetti (prismatic for Olympian), longest buzz |

Closes itself after 5 to 8 seconds. Reduced motion: everything fades, no rays, rings, sparks or confetti. Personal side only.
