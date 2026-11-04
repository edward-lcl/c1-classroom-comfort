# Staff dashboard: design spec

Built with the dashboard-design skill process (steps 1–7) and the dataviz skill's palette validator. Layout approved by Edward on 4 Nov ("I'll let you decide" on the stack, so plain HTML/CSS/JS with no build step).

## 1. Question, numbers, problems, actions

**One question:** *Does this room need someone to check on it right now?*

| Number | Form | Why |
|---|---|---|
| Temperature °C (AHT20, else LM35) | KPI tile + sparkline | headline value, compared with the alert line |
| Humidity %RH | KPI tile + sparkline | headline value |
| Relative light (0–100 % of ADC range) | KPI tile + sparkline | relative only, raw value in the tooltip |
| eCO₂ estimate (ENS160) | KPI tile + sparkline, "est." chip, dotted line | an estimate; its validity flag is the baseline |
| Simulated CO₂ ppm | KPI tile + sparkline, "sim." chip, dashed line | synthetic; drives the demo alert |
| Discomfort reports (15 min) | ranked list with 3 px share bars + events on the timeline | counts per answer |

| Problem rule (illustrative thresholds, not safety limits) | Where it is flagged | Action beside it |
|---|---|---|
| Simulated CO₂ ≥ 1200 ppm for 2 samples (clears < 1000) | warm value + ▲ on the tile; warm band on the timeline; attention row | Record review (what was done + note) |
| Temperature ≥ 28 °C for 5 samples (clears < 27) | same | same |
| ≥ 3 identical discomfort reports in 15 min | warm row in Feedback; attention row | same |
| Sensor data older than 10 s / USB disconnected | "stale" chip on the tile; connection pill turns warm | Check USB (tooltip) |
| ENS160 not in normal operation | value crossed out, "warm-up" or "start-up" as the baseline | none; it is information, not an alarm |

## 2. Layout

```
Header:  Example Classroom · C1 prototype        [● Live 2 s] [Demo: Off|Normal|Stuffy|Vent] [QR] [CSV ▾] [◐]
Attention row (only when an alert is active): ▲ noun + number + since · [action ▾] [note] [Record]
KPI strip: one card, 5 tiles divided by hairlines; clicking a tile selects the timeline metric
Timeline: selected metric over 15/30/60 min, threshold line, alert band, gaps, feedback ▲/● strip, review ✓ markers
Panels (3 across ≥ 1100 px, 1 across on phones): Feedback | Reviews & alerts | Device
Footer: "How it works" (collapsed)
```

## 3. Tokens

These were checked with `dataviz/scripts/validate_palette.js`: both modes PASS (lightness band, CVD ΔE ≥ 23, contrast ≥ 3:1).

- Light: accent `#3e63dd`, warn `#a87200`
- Dark (default): accent `#6584f2`, warn `#c48600`

## 4. Known totals (fixture: `node tools/make-fixture.js`)

Expected answers, worked out by hand from `tools/make-fixture.js` (not from the dashboard's code):

| Component | Expected |
|---|---|
| Temperature tile | **24.2 °C**, sensor AHT20, live (LM35 stopped 5 min ago, so it is not used) |
| Humidity tile | **51.0 %RH** |
| Light tile | **68 %** (raw 700 / 1023), tooltip shows raw 700 |
| eCO₂ tile | **640**, est., Normal |
| Simulated CO₂ tile | **1250**, flagged (≥ 1200) |
| Active alerts | **2**: simulated CO₂ (open since 4 min ago) and "Too hot ×3 in 15 min" (opened at start-up) |
| Feedback, last 60 min | **7** responses: too hot 3 · comfortable 2 · too cold 1 · stuffy 1 · air OK 2 · unsure 1 · light OK 1 |
| Comments | 2 ("fine near the door", "back row warm") |
| Review log | 1 entry, "Opened a window or door — fixture review" |
| Earlier alerts | 1 (temperature, reviewed) |
| Timeline (temperature, 30 min) | a visible break between 20 and 15 min ago, last point 24.2 |
| After 10 s with no serial data | every measured tile shows "stale"; the connection pill shows no fresh data |
