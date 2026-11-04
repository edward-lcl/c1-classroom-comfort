# Hardware guide: wiring, checks and soldering (C1)

Prepared 4 Nov 2026 by Claude (AI assistant) from datasheets, the group's notes and Edward's photos of the real parts. **Nothing in this guide has been checked on the real hardware yet.** Wiring diagrams: `docs/wiring/*.svg`, also shown step by step on the app's **Setup** page (http://localhost:3000/setup), which ticks each step off from live data. Tick each box only when a group member has actually done it. Write down who did it and what you saw.

> Earlier AI-generated breadboard pictures were wrong. Do not use them. Use the **electrical connections** below and check them against your own breadboard. Do not copy positions from a picture.

## 0. What you have (from Edward's photos, 4 Nov)

| Item | Status | Notes |
|---|---|---|
| Keyestudio **KS0069** basic starter kit | **seen in photos** | Box and leaflet |
| Keyestudio **UNO R3** | **seen**; ON LED lit on USB | ATmega328P (DIP). Header order as printed: IOREF · RESET · 3.3V · 5V · GND · GND · Vin \| A0–A5. R3 also has SDA/SCL pins beside AREF (same signals as A4/A5) |
| USB cable (blue) | seen | Data transfer not yet tested (step 1 below) |
| **LM35DZ** temperature sensor | **seen**: flat face printed "LM35 DZ" (National Semiconductor mark) | TO-92, 3 legs |
| Photoresistors | **3 seen** | No polarity |
| 10 kΩ resistors | **5 seen**, on tape labelled "10K" | Keep the tape label until used: the colour bands are hard to read |
| 830-hole breadboard | **seen** | Rows a–e and f–j, columns 1–60+, +/− rails top and bottom |
| Jumper wires | in kit (30) | — |
| **ENS160 + AHT21 module** (Taobao shop 都会明武电子 / Mingwu, ¥21) | **paid** (Edward, 4 Nov); not yet delivered | Pins: **VIN · 3V3 · GND · SCL · SDA · ADD · CS · INT**. Headers **not soldered**: the seller confirmed they don't solder ("没有提供焊接") and did not answer the 5V question |
| 60 W adjustable soldering iron kit (220 V, stand, solder, rosin, sponge, ¥13.8) | **paid** (Edward, 4 Nov); not yet delivered | Set it to about 320–350 °C |
| Multimeter | **not confirmed** | Needed for §3; ask the lab |
| Laptop with Arduino IDE 2 + Node.js | — | See USER_GUIDE.md |

The diagrams in `docs/wiring/` (and on the app's **Setup** page) are drawn for these parts.

## 1. Bring-up order (Monday)

Do one step at a time. If a step fails, stop and fix it before you add the next part.

1. **USB/serial check.** Upload `arduino/serial_check`. Open Serial Monitor at 9600. You should see `# tick 0, 1, 2…` and the L LED blinking. ☐ Done by ____
2. **Photoresistor only.** Wire it as in §2.1. In `c1_station.ino` set `ENABLE_LM35 0` and leave `ENABLE_LDR 1`, then upload. Cover the LDR, then shine a phone torch on it. `light_raw` should go **up** with more light. ☐ Dark ≈ ____ Bright ≈ ____
3. **LM35.** Check the pinout (§2.2), wire it, set `ENABLE_LM35 1` and upload. The value should be close to room temperature. Compare it with a thermometer if you have one. ☐ LM35 ____ °C vs thermometer ____ °C
4. **Run the laptop app** (`npm start` in `app/`). **Close the Serial Monitor first**, because only one program can use the port. The dashboard chip should say “Arduino connected”, and the cards should show MEASURED. ☐
5. **Unplug the USB cable.** The cards must turn STALE within about 10 s. Plug it back in and they should recover. ☐
6. **ENS160+AHT20 board:** only after §3 and §4 are complete.

## 2. Circuits

### 2.1 Photoresistor (relative light) → A1

```
 UNO 5V ──── LDR ────┬──── UNO A1
                     │
                   10 kΩ
                     │
 UNO GND ────────────┘
```

- This is a voltage divider (Ch7 p.34–35). More light lowers the LDR's resistance, so the voltage at A1 rises and `analogRead` gives a higher number (0–1023).
- Show it as **relative light**. It is **not lux**, because it has not been calibrated.
- Tinkercad version (saved 2 Nov): A1 read 54 in low light and 974 in bright light. That was a **simulation** only.

**Pin checklist**
- ☐ One LDR leg → 5V
- ☐ Other LDR leg → the junction row
- ☐ Junction row → A1
- ☐ Junction row → one end of the 10 kΩ resistor
- ☐ Other end of the 10 kΩ resistor → GND
- ☐ No wire goes directly from 5V to GND (that would be a short)

### 2.2 LM35DZ → A0

From the TI LM35 datasheet (SNIS159H, TO-92 “LP” package): **pin 1 = +VS, pin 2 = VOUT, pin 3 = GND**. TI draws this as a **bottom view**. Hold the flat face toward you with the legs pointing down. The usual reading is +VS on the left, VOUT in the middle and GND on the right. **Check this against figure “LP Package” in the datasheet before you power it on.** A reversed LM35 gets hot quickly.

```
 UNO 5V  ──── LM35 +VS (pin 1)
 UNO A0  ──── LM35 VOUT (pin 2)
 UNO GND ──── LM35 GND (pin 3)
```

- Output is 10 mV/°C. Formula: T(°C) = raw × 5.0 / 1024 × 100 ≈ raw × 0.488. Resolution is about 0.5 °C per step. Accuracy also depends on the real USB voltage, which is often 4.8–5.1 V, not exactly 5.0 V.
- The laptop app keeps the raw number and rejects readings below 2 °C or above 60 °C. Those usually mean a wiring fault.
- ☐ The sensor is not hot to the touch after 10 s. If it is, **unplug immediately**: it is probably reversed.

### 2.3 ENS160+AHT21 module → I²C (only after §3)

Diagram: `docs/wiring/ens160-aht21-i2c.svg`. Use the labels **printed on your module**.

```
 Module GND ──── UNO GND
 Module VIN ──── UNO 5V    (only if §3 shows it is meant for 5 V; otherwise UNO 3.3V)
 Module SDA ──── UNO A4 (SDA)
 Module SCL ──── UNO A5 (SCL)
 3V3, ADD, CS, INT: leave unconnected (3V3 is the module's own regulator output)
```

## 3. ENS160 + AHT21 module: check before connecting it to the UNO

**What we know about this board** (from the Mingwu listing photo; not yet measured):

- **Pin order:** VIN, 3V3, GND, SCL, SDA, ADD, CS, INT.
- **Regulators (likely):** two small 3-pin parts near VIN look like voltage regulators. They would make 3.3 V for the board and 1.8 V for the ENS160 chip, which needs 1.71–1.98 V.
- **Level shifter (likely):** two 6-pin parts beside resistor packs near SDA/SCL look like a MOSFET I²C level shifter. If that is right, VIN = 5 V and 5 V I²C would be fine. **This is a guess from a photo, so measure first.**
- **The ENS160 chip itself is not 5 V tolerant.** Its SDA/SCL absolute maximum is 3.6 V (ScioSense datasheet v1.3, §3), so the board's own circuitry has to protect it.
- **The seller gave no voltage answer.** Look on the product page (宝贝详情) for 工作电压 / 供电电压, and write it here: ____

**Check it like this.** One person reads the multimeter, a second writes the result down. Do these after soldering, with the **module only**: nothing connected to the UNO's A4/A5.

1. ☐ **Power off.** Check for shorts. VIN→GND and 3V3→GND must **not** beep on continuity.
2. ☐ **Power off.** Measure resistance from SDA to VIN, SDA to 3V3, SCL to VIN and SCL to 3V3. A few kΩ to a rail means the pull-up resistor goes to that rail.
3. ☐ Connect **only GND and VIN**: module GND to UNO GND, module VIN to UNO 5V. Then plug in USB and watch for 10 s: nothing should get hot.
   - If the product page says VIN is 3.3 V only, use UNO **3.3V** instead of 5V for this step.
4. ☐ Measure to GND and record each value:
   - 3V3 pin: ____ V (expect about 3.3 V)
   - SDA: ____ V
   - SCL: ____ V
   - CS: ____ V
   - ADD: ____ V
5. ☐ Decide:

| SDA / SCL measured | Meaning | What to do |
|---|---|---|
| ≈ 5 V (with VIN = 5 V) | Pull-ups go to VIN, so a level shifter is probably on the board | Connect SDA→A4 and SCL→A5 directly, keeping VIN = 5 V |
| ≈ 3.3 V | Pull-ups go to 3.3 V | Connect directly. This usually works but is slightly outside the UNO's spec (UNO wants ≥ 3.5 V for a "high"); note it as a limitation |
| ≈ 0 V | No pull-ups | Add 4.7 kΩ from SDA and SCL to **3.3 V**, never to 5 V |
| Anything else / unsure | — | Stop and ask the tutor or lab. The LDR, LM35 and simulation still give a full demo |

6. ☐ Check the other pins:
   - **CS** must read high, ≈ 3.3 V, for I²C mode.
   - **ADD** high means address 0x53; low means 0x52. The sketch tries both.
   - Leave **3V3** (a regulator output) and **INT** unconnected.
7. ☐ Upload `arduino/i2c_scanner`. Expect **0x38** (AHT21) and **0x53 or 0x52** (ENS160). Found: ____
8. ☐ In `c1_station.ino`, set `ENABLE_AHT20 1` and upload; check temperature and humidity look sensible. Then set `ENABLE_ENS160 1`. AHT21 uses the same commands and address as AHT20, so no code change is needed.

**Optional message to the seller** (copy it yourself if you want; I haven't sent anything):
> 你好，请问这款 ENS160+AHT21 模块的 VIN 供电范围是多少？SDA/SCL 上拉电阻接到 VIN 还是 3.3V？板上有没有 I2C 电平转换电路？可以提供原理图吗？谢谢！

(It asks: the VIN supply range; whether the SDA/SCL pull-ups go to VIN or 3.3 V; whether there is an I²C level shifter on the board; and whether they can provide the schematic.)

## 4. Soldering checklist (pin headers only)

You only solder the **header pins** to the board. **Never solder the sensor chips.**

- ☐ USB and power disconnected from everything.
- ☐ Safety glasses on. Work in a ventilated area or use fume extraction. Use a heat-resistant mat. The iron stays in its stand when you are not using it. Keep hands away from the tip.
- ☐ Decide the header side first: pins pointing down into the breadboard, with the labels still readable. Push the header into the breadboard and lay the board on top. The breadboard holds the pins straight.
- ☐ Solder one pin first, check the board is flat, then do the rest. Use a small amount of solder per pin, with the tip on the pin and pad for about 2–3 s.
- ☐ Keep heat, solder and flux away from the sensor's openings. Do not use cleaning solvents or alcohol on the board.
- ☐ Let it cool. Inspect each joint (use a phone camera zoom). Joints should be shiny and cone-shaped, with no bridges between neighbouring pins.
- ☐ Multimeter continuity check: VIN/3V3 to GND must **not** beep (no short). Also check that neighbouring pins are not connected.
- ☐ If unsure, ask an experienced person or the lab technician to check before power-on.
- ☐ At first power-on, watch and smell for 10 s before touching anything. If anything gets hot or smells, unplug immediately.

**Do not** use smoke, flames, solvents, alcohol or breath at close range to make the gas reading change. Use the simulated CO₂ scenarios in the app to demonstrate alerts.

## 5. What the ENS160 numbers mean

- **eCO₂ is an estimate.** The chip measures gases (VOCs and hydrogen) and *calculates* an “equivalent CO₂”. It is not a CO₂ measurement and must not be compared with CO₂ safety limits. The app labels it “eCO₂ estimate (ENS160) … not measured CO₂” and never uses it for alerts.
- **Validity flag** (DEVICE_STATUS bits 3:2): 0 = normal, 1 = warm-up (about 3 min after each power-on), 2 = initial start-up (about the first 1 h of the sensor's life), 3 = invalid. The dashboard crosses out the value until the flag is 0. The datasheet notes that initial start-up only counts as finished after 24 h of continuous operation. **A new sensor will therefore keep returning to “initial start-up” in short class sessions.** Expect that, and say so in the demo.
- **Compensation:** the sketch writes the AHT20 temperature and humidity into the ENS160 (TEMP_IN/RH_IN) when both are working. The dashboard shows whether this compensation is applied.

## Sources

- ScioSense ENS160 datasheet v1.3: https://www.sciosense.com/wp-content/uploads/2023/12/ENS160-Datasheet.pdf (§3–5, §10–11, §14, §16, §17)
- Aosong AHT20 datasheet: https://asairsensors.com/wp-content/uploads/2021/09/Data-Sheet-AHT20-Humidity-and-Temperature-Sensor-ASAIR-V1.0.03.pdf. The init command 0xBE comes from common AHT20 libraries, not this datasheet version.
- TI LM35 datasheet SNIS159H: https://www.ti.com/lit/ds/symlink/lm35.pdf
- ATmega328P datasheet (TWI input levels, internal pull-ups): https://ww1.microchip.com/downloads/aemDocuments/documents/MCU08/ProductDocuments/DataSheets/ATmega48A-PA-88A-PA-168A-PA-328-P-DS-DS40002061B.pdf
- Arduino AVR core Wire library (internal pull-ups enabled in `twi_init`): https://github.com/arduino/ArduinoCore-avr/blob/master/libraries/Wire/src/utility/twi.c
- Keyestudio KS0069 docs (kit contents, LM35 example): https://docs.keyestudio.com/projects/KS0069-KS0072-KS0073/en/latest/
