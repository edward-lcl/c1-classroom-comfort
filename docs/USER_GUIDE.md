# User guide: run, demo, troubleshoot

## 1. One-time setup (each laptop that will present)

1. Install **Node.js 18 or newer** (LTS from nodejs.org) and **Arduino IDE 2** (arduino.cc).
2. Open a terminal in the `app/` folder and run:
   ```bash
   npm install
   ```
   This installs three pinned packages: `serialport` 13.0.0, `@serialport/parser-readline` 13.0.0 and `qrcode` 1.5.4.
3. Run the self-test: `npm test` should print `pass 21  fail 0`.

## 2. Start and stop

| You want to… | Command (inside `app/`) | Notes |
|---|---|---|
| Use the **real UNO** | `npm start` | Finds the UNO on USB automatically. **Close Arduino IDE's Serial Monitor first.** |
| Pick the port yourself | `node src/server.js --serial=/dev/cu.usbmodem1101` (Mac) or `--serial=COM3` (Windows) | `npm run list-ports` shows the port names |
| Demo **with no hardware** | `npm run demo` | Light, temperature and humidity are simulated, and a big orange banner says so |
| Rehearse with fake serial data | `npm run fake-uno` | Tests the whole serial path. The banner says "TEST INPUT" |
| Keep a real measuring session separate | `npm start -- --profile=room-test-2026-11-09` | Data goes to `data/room-test-2026-11-09/`, not the demo folder |
| Stop | `Ctrl + C` in the terminal | Data is already saved |
| Wipe demo data | `npm run reset-demo` | Deletes `data/demo/` only. Never touches the survey |

Then open **http://localhost:3000** on the same laptop. The terminal prints the phone link.

**Monday:** open **http://localhost:3000/setup** (the **Setup** button on the dashboard). It walks through USB → sketch → photoresistor → LM35 → ENS160 module → phone QR, with a wiring diagram at each step. Each step only turns green when the live data proves it works.

The dashboard and demo controls only open on the presenting laptop, so phones cannot change scenarios. Phones are sent to the feedback form.

## 3. Language: English / 中文

Every page opens in **English** by default. The **EN | 中** switch (top right of every page) changes everything the app writes to Simplified Chinese and back. Each device remembers its choice. Tooltips, alerts and the chart legend switch too, so every teammate can follow the demo.

A link can also pick the language: add `&lang=zh` to the feedback URL (e.g. `…/feedback?room=example-room&lang=zh`) if you want a QR that opens in Chinese. Text typed by people (comments, review notes) is shown as written and is not translated.

## 3b. QR code for phones

1. Open **http://localhost:3000/qr** on the laptop. It shows one QR code per network the laptop is on.
2. **Test it with a second phone before the demo.** Campus Wi-Fi often blocks one device from reaching another. If the phone can't open the page:
   - Turn on a **phone hotspot**, connect the laptop to it, reload `/qr` and scan the new code with another phone joined to the same hotspot.
   - A QR showing `localhost` would never work on a phone, so the page never shows one.
3. Print or screenshot the QR **after** you know the address. The address changes when the network changes.

We do not use public tunnels or cloud hosting. If you ever want a public link, decide as a group first (cost, data, who can access it).

## 4. Repeatable demo script (about 2 minutes inside the video)

Start with `npm start` (real UNO) or `npm run demo` (no hardware). Before you record, run `npm run reset-demo` and restart.

1. **Normal:** point at the five tiles. Values with no chip are measured; **est.** marks the ENS160 estimate (dotted line); **sim.** marks simulated values (dashed line). Hover any tile for its full explanation. Click a tile to show it on the timeline.
2. **Light:** cover the photoresistor with a hand, then shine a phone torch on it. The relative-light number falls, then rises.
3. **Student feedback:** a teammate scans the QR and sends "Too hot + Stuffy". It appears in the Feedback panel and as a ▲ on the timeline within about a second.
4. **Alert:** click **Stuffy** in the dashed **Demo** control at the top. Simulated CO₂ climbs. After about 2 minutes an amber alert row appears above the tiles, and the timeline shows a warm band. You can pre-record this part or narrate while it climbs.
5. **Human response:** in the alert row choose "Opened window/door", add a note (e.g. "role-play") and click **Log review**. A ✓ marker appears on the timeline.
6. **After:** click **Ventilated**. Simulated CO₂ falls, and the alert moves to "Earlier alerts" once it is below 1000.
7. **Honesty line:** "This is staged. Simulated CO₂ is not measured, and this demo cannot prove that opening a window caused any change."
8. Optional: unplug USB and show the tiles turning grey with an amber **stale** chip, then plug back in.

Three "too hot" or "stuffy" reports within 15 minutes also raise a prompt. Each phone must wait 10 s between submissions.

## 5. Troubleshooting

| Problem | Try |
|---|---|
| Chip says "Looking for Arduino…" | Use a USB **data** cable. Close Serial Monitor. Run `npm run list-ports`. On Windows, a CH340 clone may need its driver |
| "Could not open … busy / access denied" | Another program (Arduino IDE Serial Monitor, Tinkercad bridge, a second copy of the app) has the port |
| Upload fails in Arduino IDE | Tools → Board → *Arduino Uno*; Tools → Port → the USB one. Unplug the app first, because only one program can use the port |
| Tiles show "stale" | No valid sample for 10 s. Check the board's TX LED blinks every 2 s; see "Bad lines" and "Problems" in the Device panel (hover for details) |
| LM35 reading rejected as implausible | Wiring or pinout is wrong. **Feel whether the LM35 is hot (careful)**, and if so unplug and see HARDWARE_GUIDE §2.2 |
| `AHT20 not responding` / `ENS160 not responding` | Check power and SDA/SCL. Run `arduino/i2c_scanner`. Make sure the §3 checks in the hardware guide were done |
| ENS160 stays in "Initial start-up" | Normal for a new sensor. It needs about 1 h of operation, and the datasheet says this is only saved after 24 h continuous operation |
| Phone can't open form | Network isolation: use a phone hotspot (§3) |
| Port 3000 in use | `npm start -- --port=3005` |

## 6. Where data goes

`app/data/<profile>/*.jsonl`: one line per record (readings, feedback, alerts, actions, events). Export CSVs from the **CSV** menu in the header. The dashboard is dark by default; the ◐ button switches to light.

This is **demo/test data**. Keep it separate from the 51-response research survey (`source_pack/03_Survey_Evidence/`), which the app never reads or writes. Do not enter test responses into the real WJX survey.
