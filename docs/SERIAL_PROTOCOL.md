# Serial message format (version 1)

The UNO sends text over USB at **9600 baud**. Each line ends with `\n` and holds **one** JSON object, or a comment line starting with `#`. The sketch sends one sample every 2 seconds.

## Why this format

- One record per line: if a line is cut off (for example when the cable is unplugged mid-line), the laptop throws away just that line.
- JSON is readable in the Arduino Serial Monitor, so a student can see exactly what the board is sending.
- Each sensor has its own fields, so a broken sensor does not hide the others.

## Messages

**Boot** (sent once after reset; tells the laptop which sensors the sketch has switched on)
```json
{"t":"boot","v":1,"fw":"c1-station 1.0","ldr":1,"lm35":1,"aht":0,"ens":0}
```

**Sample**
```json
{"t":"s","v":1,"seq":42,"ms":84000,"light_raw":612,"lm35_raw":48,
 "aht_ok":1,"aht_t":23.41,"aht_rh":51.2,
 "ens_ok":1,"ens_val":0,"ens_aqi":2,"ens_tvoc":38,"ens_eco2":540,"ens_comp":1}
```
(The sample is shown on two lines here; the board sends it on one.)

| Field | Meaning | Valid range | Stored by the app as |
|---|---|---|---|
| `t` | `boot`, `s` (sample) or `err` | — | — |
| `v` | protocol version (must be 1) | 1 | — |
| `seq` | sample counter; restarts at 0 after a board reset | ≥ 0 | used to detect restarts |
| `ms` | `millis()` on the board | ≥ 0 | — |
| `light_raw` | photoresistor ADC reading on A1 | 0–1023 | `light_raw` (relative light, **not lux**) |
| `lm35_raw` | LM35 ADC reading on A0 | 0–1023 | `temperature_lm35_c` = raw × 5.0/1024 × 100 (rejected if outside 2–60 °C) |
| `aht_ok` | 1 = AHT20 read OK, 0 = no answer / CRC error | 0/1 | — |
| `aht_t`, `aht_rh` | AHT20 temperature (°C) and humidity (%RH) | −40–85, 0–100 | `temperature_aht_c`, `humidity_rh` |
| `ens_ok` | 1 = ENS160 read OK | 0/1 | — |
| `ens_val` | ENS160 validity flag: 0 normal, 1 warm-up, 2 initial start-up, 3 invalid | 0–3 | shown on the dashboard |
| `ens_eco2` | **equivalent** CO₂ estimate | 400–65000 | `ens160_eco2_ppm_equivalent` (never `co2`) |
| `ens_tvoc` | TVOC estimate (ppb) | 0–65000 | `ens160_tvoc_ppb` |
| `ens_aqi` | UBA air-quality index | 1–5 | `ens160_aqi_uba` |
| `ens_comp` | 1 = AHT20 values were written to the ENS160 for compensation this sample | 0/1 | shown on the dashboard |

A field is **absent** when that sensor is switched off in the sketch.

**Error / comment**
```
{"t":"err","v":1,"msg":"text"}
# any human-readable line
```

## What the laptop does with bad input

| Input | Result |
|---|---|
| empty line | ignored |
| `#` comment | shown as "Board message" on the dashboard, not counted as an error |
| not JSON, cut-off line, wrong version, unknown type, missing `seq`, longer than 300 characters | ignored, and the dashboard's "Malformed lines ignored" counter goes up |
| one field out of range | only that field is dropped; the reason is listed under "Sensor problems" |
| `seq` goes down, or a `boot` line arrives | logged as a board restart in `events.jsonl` |
| no valid sample for 10 s, or USB disconnected | values are marked **STALE** and kept only as "last received" |

Simulated CO₂ never comes from the UNO; the laptop app's scenario simulator generates it, and it is stored as `simulated_co2_ppm`.

You can see this behaviour without hardware: `npm run fake-uno` (add `--chaos` inside the script to mix in bad lines).
