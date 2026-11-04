# Individual report planning guide (Part 1, 65%)

This is a **planning aid**, not text to copy. The brief says each student's wording, explanation, analysis, contribution statement and reflection must be their own. Shared facts and the system diagram may be the same across the group. Your own contribution and reflection must be written by you; nobody else, including AI, can write them for you.

**Format:** use the official template (`course_materials/IOT001TC_Individual_Project_Report_Template.docx`) and keep every heading. One PDF, max **800 words** (diagram labels, references and the declaration are not counted), max **4 A4 pages including references**. Due **13 Dec, 23:59 Beijing time**. Anything over the limit is not marked.

| Section (template heading) | Limit | Rubric weight | Plan |
|---|---|---|---|
| 1. Project Overview and Individual Contribution | 120 words | Contribution 15% (with §4) | Purpose, users and setting, what the group produced (a prototype/demonstration with labelled simulation). Then **your** tasks, kept separate from group tasks. Use your own records |
| 2. IoT/AIoT System Explanation: A. labelled diagram, B. explanation | 300 words | System understanding 45% | Diagram of the final system. Name the elements, their roles and the end-to-end flow. Say why no AI is used |
| 3. Application, Design Analysis, and Evaluation (table, 2 rows) | 250 words | 40% | Pick 1–2 design decisions. Apply module knowledge. Evaluate them. Give ≥ 1 limitation and ≥ 1 realistic improvement |
| 4. Individual Reflection | 130 words | (15% with §1) | What you learned, one strength, one skill to develop, one feedback/teamwork experience |
| Academic Integrity and AI/Digital Tool Declaration | not counted | compliance | List the tools and what you used them for, plus any group material you adapted. Be truthful |

## Facts you can reuse (check each against the final system before using)

- **Layers (Ch1 p.24):** Sensing layer (LDR, LM35, AHT20/ENS160 on the UNO) → Networking layer (USB serial to the laptop; local Wi-Fi from phones) → Data analysis layer (freshness check, validation, threshold rules with hysteresis) → Application layer (dashboard, review prompt, review log).
- **Pipeline (Ch1 p.22):** Sense → Compute → Connect → Analyse → Act. Here, Act means a **person** reviews the room. There is no actuator.
- **Why no AI (Ch1 p.28–29, p.34):** there is one room and little data, and staff need prompts they can explain. A rule like "simulated CO₂ ≥ 1200 for 2 samples" is transparent and testable. There is no labelled dataset to train a model. Human oversight is kept.
- **Analog vs digital sensors (Ch6 s.10–11, s.20):** the LDR and LM35 are analog, read through the 10-bit ADC (0–1023). The AHT20 and ENS160 are digital, read over I²C.
- **Voltage divider (Ch7 p.34–35):** the LDR with a 10 kΩ resistor turns a resistance change into 0–5 V at A1.
- **Accuracy vs precision (Ch6 s.18–19):** the LM35 changes by about 0.49 °C per ADC step at a 5 V reference. Its accuracy also depends on the real USB voltage. The light reading is relative, not lux.
- **Data quality:** values are marked stale after 10 s, never filled with fake data, and simulated, estimate and measured values are kept separate.

## Possible Section 3 rows (choose and analyse yourself)

| Design decision | Module knowledge | Evaluation idea |
|---|---|---|
| USB serial to a laptop instead of Wi-Fi on the board | Networking layer choices; MCU vs gateway (Ch3) | Simple and reliable, with no extra hardware. Limitation: the laptop must stay in the room. Improvement: an ESP32 sending data over Wi-Fi |
| Threshold rules with hysteresis + human review instead of AI or automatic control | IoT vs AIoT (Ch1 p.29); human oversight (p.34) | Explainable and avoids alert floods. Limitation: fixed thresholds ignore context such as outdoor weather (Rawat). Improvement: per-room thresholds tuned with real data |
| ENS160 eCO₂ shown as an estimate, separate from simulated CO₂ | Sensor accuracy, range, measurand (Ch6; Week 6 sensors) | Honest labelling. Limitation: a MOX sensor cannot measure CO₂ directly. Improvement: an NDIR CO₂ sensor if a budget allows |
| Short QR form (≤ 1 min) | User-centred design and survey evidence (Q5, Q8) | Fast. Limitation: stated intention ≠ real use, and the QR depends on the network. Improvement: test with real students; offer a plain link |

## Keep a record now

For your Section 1 and reflection, keep a dated list of what **you** did, for example "wired LDR on 9 Nov, photo IMG_xxx" or "tested QR on hotspot". Also write down what Claude/AI did; see `AI_USE_RECORD.md`.
