# Test report

Status words: **PASSED** = run and worked · **FAILED** = run and did not work · **NOT RUN** = possible but not done yet · **BLOCKED** = cannot run until something else exists.

Run by Claude (AI assistant) on 4 Nov 2026, on Edward's MacBook: macOS, Node 26.13.0, arduino-cli 1.5.1, AVR core 1.8.8. **No physical Arduino, sensor or second phone was used.** The phone form was tested in a desktop browser set to phone size, which is not the same as testing on a real phone.

## A. Automated tests (`cd app && npm test`)

21/21 **PASSED** (re-run after the dashboard redesign). They cover:

| Area | What is checked |
|---|---|
| Serial parsing | valid lines; ENS160 warm-up flagged as not usable; eCO₂ never stored as CO₂; 9 kinds of malformed or partial lines rejected without crashing; out-of-range field dropped while the other fields are kept; sensor-not-responding reported; LM35 maths; boot and comment lines |
| Freshness | live → stale after 10 s; USB disconnect makes values stale immediately; values restored after a restart are never shown as live |
| Labels | light sensor = MEASURED and simulated CO₂ = SIMULATED in the same snapshot; ENS160 = ESTIMATE + validity; simulated-sensor mode labels everything SIMULATED and ignores serial |
| Alerts | stuffy scenario raises exactly **one** alert; review is logged; ventilation scenario resolves it with no repeat alerts; a single temperature spike does **not** alert, 5 hot samples in a row do |
| Feedback | invalid answers, missing answers, wrong room and comments over 200 characters are rejected; double tap is stored once; the same device within 10 s gets "please wait"; 3 discomfort reports raise the feedback alert, which clears after 15 min; HTML in comments is stored as plain text |
| Restart | feedback, reviews, active alerts and chart history survive an app restart |
| HTTP | all pages load; path tricks such as `/static/../src` are blocked; bad JSON returns 400; QR URLs never use localhost; CSV export neutralises spreadsheet formulas |

## B. Arduino compile (`arduino-cli compile -b arduino:avr:uno`)

| Sketch | Flash | RAM (of 2048 B) | Result |
|---|---|---|---|
| serial_check | 2,426 B (7%) | 192 B (9%) | **PASSED**, no warnings |
| i2c_scanner | 4,196 B (13%) | 404 B (19%) | **PASSED** |
| c1_station (default: LDR + LM35) | 3,578 B (11%) | 309 B (15%) | **PASSED** |
| c1_station (all four sensors on) | 8,004 B (24%) | 440 B (21%) | **PASSED**, `--warnings all` clean |

Compiling only shows the code is valid for an UNO. It does **not** show the sensors work.

## C. Manual run in the browser (fake-UNO test generator → app → dashboard)

| Check | Result |
|---|---|
| Dashboard shows MEASURED/ESTIMATE/SIMULATED badges, and a "TEST INPUT" banner for fake data | **PASSED** |
| ENS160 value crossed out during warm-up/start-up, shown normally once the flag = 0 | **PASSED** |
| Malformed lines from `--chaos` counted ("Malformed lines ignored: 6"), app kept running | **PASSED** |
| Phone-size form: select, comment, submit → thank-you screen | **PASSED** (desktop browser at 375 px width, not a real phone) |
| Tapping submit 3 times quickly → stored once | **PASSED** |
| Same device sending again within 10 s → polite "please wait" | **PASSED** |
| Stuffy scenario → "Please review the room" prompt at 1213 ppm simulated | **PASSED** |
| Typing a review note is not wiped by live updates | **FAILED at first, fixed, then PASSED** (the dashboard used to redraw the alert every 2 s) |
| Review recorded → alert shows "Reviewed" with action and note | **PASSED** |
| Fake UNO stops (like unplugging USB) → serial "disconnected", values STALE within 5 s | **PASSED** |

## C2. Dashboard redesign QA (dashboard-design skill process, 4 Nov)

| Check | Result |
|---|---|
| Known totals: fixture (`tools/make-fixture.js`) vs rendered dashboard, all 11 expected answers in `DASHBOARD_SPEC.md` | **PASSED** (tiles 24.2 / 51.0 / 68 / 640 / 1250; 2 alerts; 7 responses with correct breakdown; 2 comments; 1 review; 1 earlier alert) |
| Restored values shown as live although nothing new had arrived (connection pill said "no data") | **FAILED, fixed, then PASSED.** Values restored after a restart now stay stale until a new sample arrives (new unit-test assertions) |
| Stale state: tiles grey with "stale N s" chip, pill agrees | **PASSED** |
| Salience: eye lands on the alert rows and the flagged tile first | **PASSED** (screenshot) |
| 1440 × 900: alerts, tiles and timeline above the fold | **PASSED** |
| 375 px phone: no horizontal scroll (`scrollWidth 375 = innerWidth`); alert rows and tiles wrap instead of truncating | **PASSED after a fix** |
| 3440 px ultrawide: content grows (1640 → 2200 px) instead of a narrow column | **PASSED after a fix** |
| Light and dark themes | **PASSED** (dark is the default) |
| Chart palette (accent + warning) validated in both modes with the dataviz validator | **PASSED** (lightness band, CVD ΔE ≥ 23, contrast ≥ 3:1) |
| Comment containing `<script>` shown as plain text | **PASSED** |
| English / 中文 switch: dashboard (header, alert row, tiles, tooltips, chart, panels, device), phone form, QR page; default English; choice remembered | **PASSED** (checked in the browser at 1440 px and 375 px; Chinese wording written by Claude and **not yet checked by a native speaker in the group**) |
| Colour-blindness emulation, keyboard-only walk-through | **NOT RUN** (provenance and problems also use shape: ▲, dashed/dotted lines, chips) |

## C3. Polish pass and setup page (4 Nov, evening)

| Check | Result |
|---|---|
| Timeline blank for up to 4 s after reload | **FAILED, fixed, then PASSED.** The chart now draws on the first state |
| Known totals re-checked after the layout change (fixture) | **PASSED**: all values match; verdict "Needs review · 2"; restored values correctly marked stale (4 chips) |
| Room-status verdict (Needs review / Reviewed · watching / All clear / No live data); never "All clear" without live data | **PASSED** (seen in each state except "Reviewed · watching" on screenshot) |
| "No data" periods shaded and labelled on the timeline | **PASSED** |
| App-generated messages (bad-line reasons, sensor problems, serial errors) translated; student comments marked as original text | **PASSED** (EN + 中文) |
| Setup page `/setup`: steps tick off only from real evidence; fake UNO shows "Test input only", never "Done" | **PASSED** with fake UNO. **Real-hardware ticks not yet seen** |
| Wiring diagrams match the electrical plan (LDR 20/22/26 → A1, LM35 10/11/12 → A0, rails, module pin order) | **PASSED** (reviewed visually by Claude). **Must still be checked by the group against the real board** |
| 375 px: dashboard and setup page have no horizontal scroll (diagrams scroll inside their box) | **PASSED** |

## C4. Follow-up polish (4 Nov, late)

| Check | Result |
|---|---|
| Breadboard diagram shows exactly which UNO pins are used (coloured ring + tag on 5V, GND, A0, A1) | **PASSED** (visual) |
| "How it works" is a flow diagram with data labels and the human feedback loop, translated | **PASSED** (EN checked on screenshot) |
| QR pop-up on the dashboard (closes with ✕, Esc, or a click outside); full QR page kept for projecting | **PASSED** |
| QR showed a second, unreachable VPN address (100.88.x.x) | **FAILED, fixed, then PASSED.** VPN/link-local addresses are skipped; new unit test (22/22 pass) |

## D. Not run yet / blocked

| Check | Status | Needs |
|---|---|---|
| Real UNO upload + Serial Monitor (`serial_check`) | **BLOCKED** | UNO + data cable (Monday) |
| Photoresistor on real hardware, light up → number up | **BLOCKED** | wiring |
| LM35 vs a thermometer | **BLOCKED** | wiring + thermometer |
| App auto-finds the real UNO port; unplug/replug recovery on real USB | **BLOCKED** | UNO |
| ENS160+AHT20: board identity, voltage checks, soldering inspection, I²C scan, readings | **BLOCKED** | board arrival, soldering, multimeter |
| ENS160 compensation actually applied | **BLOCKED** | working board |
| QR scanned by a **separate phone** on campus Wi-Fi or a hotspot | **NOT RUN** | 2 devices on the same network |
| Real students using the form (≥ 2 people outside the group, per the Product Guide) | **NOT RUN** | group to organise |
| Windows laptop (if a teammate presents) | **NOT RUN** | teammate's laptop; `serialport` supports Windows |
| Original survey files unchanged | **PASSED**: the app never reads or writes `source_pack/`; check with `shasum -a 256` against `FILE_MANIFEST.csv` | — |

Add your own rows when you test the hardware: date, who, what you saw, and a photo if possible.
