# AI use and human-check record

Keep this updated. It feeds the group's AI declaration (Artifact 3 Part 3 style: *how was AI used, how were outputs checked, what did we contribute*) and each person's report declaration. **Do not rewrite older declarations as if Claude had been used then.** Claude was first used in this project on 4 Nov 2026.

## What Claude (Anthropic, Claude Code desktop app) did on 4 Nov 2026

Requested by Edward, working from the group's handoff file and source pack.

- Read the group's source pack and the assessment brief.
- Logged into nothing itself: Edward signed in to Learning Mall Core in the app's browser.
- Downloaded 56 course files (videos were skipped), and read and summarised them in `COURSE_MATERIALS_NOTES.md`.
- Confirmed on Learning Mall that Artifact 3 was submitted on 2 Nov 16:12, and found the Artifact 4 deadline (15 Nov).
- Researched the ENS160/AHT20/LM35 datasheets and Arduino libraries. These sources are cited in `HARDWARE_GUIDE.md`. Claude read them; the group did not.
- Wrote all code in `app/` and `arduino/`, the tests, and these docs.
- Ran the automated tests, compiled the sketches, and checked the app in a browser with fake serial data (see `TEST_REPORT.md`).
- Found and fixed one bug during testing: the review form was wiped by live updates.
- Redesigned the staff dashboard (same day) following the third-party "dashboard-design" and "dataviz" skills that Edward installed. Checked it with a fixed test dataset and screenshots (see `DASHBOARD_SPEC.md`, `TEST_REPORT.md` §C2). Found and fixed restored readings being shown as live after a restart.
- Added an English/中文 language switch; Claude wrote the Chinese text, and it should be checked by Chinese-speaking group members.

## What Claude did NOT do / could not check

- No physical hardware was touched or tested.
- No real phone was used.
- Nothing was submitted.
- Nothing was purchased.
- Nothing was published online.
- No survey responses were changed.
- The exact ENS160+AHT20 board is still unidentified. Wiring advice for it is conditional on the group's own measurements.
- The research papers were not re-reviewed for this build.

## Human checks the group should do and record

| Check | Who | Date | Result |
|---|---|---|---|
| Read the code comments in `app/src/hub.js` and `alerts.js` and be able to explain the alert rules | | | |
| Verify the LM35 pinout against the TI datasheet figure | | | |
| Do the board measurements in HARDWARE_GUIDE §3 | | | |
| Run the hardware bring-up steps 1–5 | | | |
| Test the QR on a second phone | | | |
| Check every number quoted in the video and reports against the source files | | | |

## Suggested wording for the declaration

Adapt this; don't copy it unchanged.

> Claude (Anthropic) was used from 4 Nov 2026 to write the prototype software and Arduino sketches, to summarise course materials, and to draft setup, hardware and testing documents. Datasheet facts were taken from the cited manufacturer documents. We checked outputs by running the tests, testing the hardware ourselves on [date], and comparing readings with [thermometer/…]. Our own work: [each member fills in].
