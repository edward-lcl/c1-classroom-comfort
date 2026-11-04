# IOT001TC course materials: notes for Group C1

Source folder: `course_materials/` (no `sample_products/` subfolder exists. Sample files are prefixed `sample_products_`.)
References: "p." means the PDF page index, which can differ from the footer slide number. "s." means a PPTX slide. [?] marks uncertainty.

## 1. Inventory

| File | What it is | C1 relevance |
|---|---|---|
| IOT001TC_Coursework- Project_Portfolio_Assessment_Brief_Revised-final V3.pdf | Official assessment brief + both rubrics + peer assessment (8 pp) | **High** |
| IOT001TC_Individual_Project_Report_Template.docx | Part 1 individual report template | **High** |
| IOT001TC_202627_SEM1_Module_Handbook.html | Module handbook: LOs, weekly syllabus, AI permissions | **High** |
| RLPBL_Student_AI_Guide W1-7.html | Stage-by-stage AI-use guide (DeepSeek/Doubao/Qwen prompts and checks) | High |
| Guide to Product Development.html | Design-thinking steps, product-type cards, "Watch Out" | High |
| Week 8 Which Solution Should We Go With.pdf | DVF framework, solution forms, IOT001 "must incorporate IoT/AIoT system" | High |
| Week 1_Welcome to RLPBL.pdf | RLPBL 5 phases, 13-week roadmap with Artifacts 1–6 | High |
| Ch1 Introduction_Enhanced_with_AIoT_AY26_27_V2.pdf | IoT/AIoT intro, layers, IoT vs AIoT, edge AI | **High** |
| Ch2 IOT001TC_Basic IoT Background-AY26_27_V1.pdf | Input-process-output, HW/SW/data/networking, micro:bit MakeCode | Med |
| Ch3 IOT001TC IoT development boards, Tool and Software-V1.pdf | MCU vs MPU, Arduino/ESP32/RPi, SDK, PCB | High |
| Ch3 IOT001TC In-class activity.pdf | micro:bit Python activity | Low |
| Ch4 IOT001TC Basic_Electronic_Circuit_AY26_27_V1.pdf | Charge/current/voltage/power, resistors, potentiometer | Med |
| Ch5 IOT001TC Arduino_Tinkercad_AY26_27_V1.pptx | Arduino Uno + Tinkercad: LED, button with pull-down, traffic light | High |
| Ch6 IOT001TC IoT Components-1 (Sensors)-AY25_26-V1.pptx | Device building blocks, analog vs digital sensors, terminology, ADC/PWM | **High** |
| Ch7 IOT001TC Basic_Electronic_Circuit_2_AY26_27_V1.pdf | Ohm/KCL/KVL, voltage divider (photoresistor example), LED resistor | **High** |
| IoT Components Sensors Week 6_21Oct2026.pdf | Guest sensor lecture: sensor definitions, AIoT+X framework, research | Med |
| IOT001TC_RLPBL_Topics_AY2627.pdf | 14 topics + inquiry prompts | Med |
| Artifact 1/2/3 [Template] + [Example].docx | Seminar artifacts (A08 "Bin Sight" example) | Med (Art. 3 AI declaration) |
| W3–W7 LIFE seminar PDFs | Problem, stakeholders, evidence/AI, data collection/analysis | Med (W5 AI rules, W6 survey wording, W7 declaration) |
| Week 2_What Are We Curious About.pdf | Topic exploration / Artifact 1 | Low |
| IoT in Action Real-World Use Cases-2026-En (+ Notes) | Advantech industry talk (HVAC ML p.53) | Low |
| Guest session_AIoT_Introduction; Guest_lecture_20261028 (USV); Wenzhang (wireless power); Photonic…; One Skill… | Guest/inspiration talks | Low |
| sample_products_* (2 handbook PDFs, 1 webpage HTML, 11 PNGs) | Example student products. PNGs not opened. | Low |

## 2. Constraints and guidance for prototype and deliverables

**Assessment brief (V3)**
- Project scope (p.1): a "beginner-level IoT/AIoT response" that must sense or collect, communicate, process or interpret data, and give an output, decision or action. "A fully functioning product is not required." Technical complexity is not itself assessed.
- **Part 1 Individual report (65%)** (p.3–4): max 800 words, excluding diagram labels, references and the declaration. One PDF, max 4 A4 pages including references. Due 13 Dec 23:59 Beijing time. "Use the provided template and keep all section headings." Content beyond the limits is not marked. The group may share project facts and architecture, but each student's wording, analysis, contribution and reflection must be their own.
- Part 1 rubric (p.5): System Understanding 45%, Application/Design Analysis & Evaluation 40%, Contribution & Reflection 15%.
- **Part 2 Group video (35%)** (p.6–7): 5–6 min, built on 3–5 artifacts across Sense/Frame/Investigate/Create/Refine. At least 2 presenters with faces visible. Upload to Mediasite and submit the link on LM. A broken link is treated as no submission. Criteria (25% each): Context & Problem, Investigation & Evidence (including AI/digital tool verification), **Evolution & Iteration ("use a feedback record or early draft")**, Collaboration & Reflection. (Ch1 p.12 says "5-minute"; the brief's 5–6 min is authoritative.)
- Peer assessment (p.7–8): rate others 0–5 on Workload, Engagement, Quality, Communication and Reliability. Due 23:59 13 Dec 2026. **Missing it costs 10% of the final mark.** Late penalty: 5% per working day, up to 5 days.

**Report template: exact headings** (`IOT001TC Project Portfolio Part 1 Individual IoT/AIoT Project Report and Reflection`)
- Header fields: Student Name, Student ID, Group Number, Project Title, Word Count, Final Project Output (Concept / design / prototype / demonstration / other)
- `1. Project Overview and Individual Contribution (maximum 120 words)`: Final project overview / My individual contribution / Connection to the final project
- `2. IoT/AIoT System Explanation`: `A. Labelled system diagram` ("one diagram of the FINAL project system… show the end-to-end flow… Add the operating environment and important feedback loops where relevant"); `B. Individual explanation (maximum 300 words)`: System type / Principal elements and roles / End-to-end operation / Role of AI
- `3. Application, Design Analysis, and Evaluation (maximum 250 words)`: table with columns Project feature / design decision | IoT/AIoT knowledge applied and why | Evaluation: effectiveness, limitation, or improvement. Rows: Feature or decision 1, 2. "Include at least one limitation and one realistic improvement across the table."
- `4. Individual Reflection (maximum 130 words)`: (1) learned about IoT/AIoT, (2) one strength, (3) one skill to develop, (4) one feedback/teamwork/project experience
- `Academic Integrity and AI/Digital Tool Declaration (not marked)`: AI/digital tools used ("List tool names and purposes, or write 'None'"), Use of shared group material ("Identify any group-created diagram or text adapted"), Student confirmation checkbox: "I confirm that the explanation, analysis, contribution statement, and reflection are my own work, and that any shared or external material has been acknowledged."

**AI rules**
- Handbook (Assessment Details): AI is allowed "only within the permitted scope" and must be disclosed in the short Academic Integrity and AI/Digital Tool Declaration. Explanation, analysis, contribution and reflection must be the student's own. The handbook does not define the "permitted scope" further [?].
- RLPBL AI Guide: the recommended tools are DeepSeek, Doubao and Qwen. It treats AI output as "unsure (?)" until verified, and says AI must not invent the User/Need/Why or stakeholders. Check AI timelines against the real deadlines. Pilot any AI-drafted survey. It covers stages W1–7 only and has nothing on prototype or code.
- W5 p.12–14: "AI is a research assistant, not the researcher". It lists fabrication (AI-invented data or references), plagiarism and ghostwriting as misconduct. Ch1 p.6 says submitting fabricated AI references counts as dishonesty, and every citation must be verified.
- Artifact 3 Part 3 + W7 p.11: the group AI-Use Declaration should answer *How was it used? How were outputs checked? What were your contributions?* and be kept updated.
- Product Guide: the Vibe-coded webpage example includes "a PDF explaining how AI was used at each step".

**Product Guide / Week 8**
- Product Guide steps: Empathise, Define, Ideate, Prototype ("rough is fine"), Test. Show the product to people outside the group and "Document what changed between your first draft and final version". Watch Out: the product must follow from research (or lose marks on "Problem Clarity"), avoid over-ambitious scope, get feedback from ≥2 people outside the group.
- Week 8 p.7–9: decide using DVF: Desirability (evidence and stakeholder need), Viability (time, scope, resources, e.g. 4 weeks), Feasibility (skills). p.11: "IOT001: incorporate an IoT/AIoT system". p.2: all forms can earn full marks, and "If you have other ideas, please check with your teacher." (An Arduino prototype is not one of the listed cards [?], so confirm with the tutor.)
- **Artifact 4 "Initial Prototype / Draft Output"** appears only on Week 1 p.6 roadmap (Week 9 "Drafting & Prototyping"). Artifact 5 "Revised Output" is Week 11 and Artifact 6 "Project Narrative & Process Reflection" is Week 12. None of the downloaded files gives Artifact 4's due date or file name. The 15 Nov / "Group C1_First Draft" details must come from LM.

## 3. Technical terminology to reuse

- **Layer model (Ch1 p.24):** *Sensing layer → Networking layer → Data analysis layer → Application layer (AI, robotics, etc.)*. Pipeline (p.22): *Sense → Compute → Connect → Analyse → Act*. Its example is a room temperature sensor triggering an alert/HVAC, which closely matches C1. Ecosystem steps (p.23): devices/sensors → gateway/edge → network → cloud/data platform → dashboards/alerts/decisions → commands back.
- **IoT vs AIoT (Ch1 p.28–29):** fixed rules/thresholds are "IoT… not necessarily AIoT" ("IF temperature > 28°C, turn on the fan"). The slide asks "do we really need AI, or is a simple and reliable rule enough?" AIoT loop (p.30): Sense, Connect, Understand, Decide, Act. Where AI runs (p.31): Device/TinyML, Edge/Gateway, Cloud. Responsibilities (p.34): data quality, security & privacy, human oversight. These give C1 its rationale for a non-AI or rule-based approach.
- **Ch2:** Input/Data → Processing → Output/Information (p.10). Hardware / Software / Data / Communication-Networking (p.12).
- **Ch3:** MCU vs MPU/SBC (p.14, p.19 table). Arduino = board + Arduino IDE (p.7). SDK (p.22). The laptop plays the "Linux IoT gateway… dashboards, MQTT brokers, databases" role given to RPi (p.17) [our analogy].
- **Ch4:** active vs passive elements (p.27), potentiometer (p.36).
- **Ch7:** Ohm's law, series/parallel, KCL/KVL. **Voltage divider (p.34–35):** "A photoresistor circuit often uses a voltage divider", shown as "5V → fixed resistor → A0 → sensor resistor → GND", then analogRead 0–1023 and a "software decision". "Arduino Uno analog pins should stay within 0–5 V." LED resistor calculation (p.38). Sensor input chain (p.40): Physical quantity → Sensor resistance/voltage → Arduino ADC → Software decision.
- **Ch5:** Uno = ATmega328P, 14 digital / 6 analog pins, 3.3V and 5V pins (s.7–8). setup()/loop() (s.10). Pull-down resistor and floating inputs (s.25–26). The only pull-up mention is "Without a pull-up or pull-down arrangement…" (s.26). Simulation vs real hardware differences (s.30).
- **Ch6:** device = Sensing, Decision/Processing, Action/Communication (s.6). Analog vs digital sensors, ADC (s.10–11): "Analog sensors… often require more careful calibration". Categories include "Gas / air quality", Temperature, Humidity (s.12). Terminology (s.18–19): **Sensitivity, Range, Accuracy, Precision**. Selection criteria (s.20) list the interface types "Analog, digital, I2C, SPI, UART". ADC formula `voltage = 5.0 × (sensorValue / 1023.0)` (s.25). PWM/map() (s.26–29). Tinkercad sensor lab names **photoresistor, TMP36, HC-SR04** (s.24), but the photoresistor/TMP36 task slides are not in the deck.
- **Week 6 sensors PDF:** "a device that converts a physical phenomenon into an electrical signal" (Wilson 2005), plus measurand/stimulus (p.7–8). AIoT + X Framework (p.4).
- **Not covered anywhere:** LM35, DHT/AHT20, ENS160, CO2/eCO2/TVOC, MOX gas sensors, I2C detail (only named), level shifting, sensor calibration procedures. C1 must cite datasheets for these and explain them in the module's terms (analog vs digital, accuracy/precision, ADC).

## 4. Labs, kits, equipment, sessions

- Tutorials (LIFE) run **Mondays** 11–12, 12–13, 16–17, 17–18 (Ch1 p.2). Lectures run Wednesday 14:00–16:00 / 16:00–18:00 (Ch1 p.2; Week 1 p.3 says "Wed 2-4 pm").
- No file mentions Arduino kits being handed out, hardware borrowing, assembly in class or soldering. Ch5 s.12: Tinkercad means "No physical kit is required at the beginning". s.15: the breadboard allows building "without soldering". Ch2 p.27 shows micro:bit + Motor:bit but says "we will use a simulation rather than a hardware component". Week 1 p.11: each group brings 1–2 digital devices (laptop/iPad). Ch4 p.37 and Ch7 p.42 refer to "future IoT labs" without details [?].

## 5. Assessment hints

- System diagram (template 2A + brief p.3): one labelled diagram of the **final** system, showing end-to-end flow, the operating environment and feedback loops. Elements to name: sensors/inputs, embedded/edge devices, communication/networking, data storage/processing, AI or decision-making, actuators/outputs, users, environment.
- **AI vs non-AI:** this sits in the top rubric band: "The role of AI, or the rationale for a non-AI IoT approach, is precise and appropriate" (p.5). If AI is not used, "explain why a basic IoT approach is appropriate" (p.3). Use Ch1 p.29 (rule vs learned model) and p.34 (data quality, human oversight).
- Section 3 must analyse the **completed** project, not a new proposal, with ≥1 limitation and ≥1 realistic improvement. For Excellent, "Module knowledge is applied insightfully". Candidate C1 features: the LDR voltage divider (Ch7 p.34–35) and the analog LM35 vs digital I2C sensor choice (Ch6 s.10–11, s.20).
- Contribution must "distinguish clearly between work completed by the group and work for which you were personally responsible" (p.3).
- Marks are for understanding, "not for visual polish or technical complexity alone" (p.4).
- Video: show an early draft or feedback record and the before/after change, explain how evidence and AI output were verified, and show at least 2 faces.
