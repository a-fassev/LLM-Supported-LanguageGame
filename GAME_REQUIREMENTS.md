# Game requirements (from team joint session, 12 May 2026)

Summary of the discussed **functional and organizational requirements** for the language-learning game (Italian, school project). Source: meeting transcript; if this diverges from a later alignment with teaching staff, the updated agreement with Frau Bernhofer takes precedence.

---

## 1. Vision and context

- **Subject context:** Italian class / textbook tie-in; content is prepared by the content team and delivered in coordination with the teacher (including tasks from the book, partly adapted, and similar “error-spotting” texts).
- **Research setup:** There is a **research question** to be answered through **running the game**, supplemented by **pre- and post-tests**. Methodologically sound **rationale** is also needed for chosen **task types** and **content** (integration into the paper; bring in literature concepts early so they can inform the game).
- **Technology mix:** **Unity** on the client; **backend/hosting** (discussed: **Azure**, e.g. containers with existing credits). **LLM** is initially **highly constrained**: many task types as **fixed deterministic logic** on the backend; LLM only **sparingly** for **one or two** task types, expandable later step by step.

---

## 2. Game concept and UX (high level)

### 2.1 Navigation and world

- **No complex “hub”** where a character walks freely (external proposal was rejected).
- Instead: a **city map** as the top-level view.
- **Pins on the map**, whose visibility depends on **progress/level**.
- **Click pin** → start a **quest**; quests are **chained** (finish one → the next becomes relevant).

### 2.2 Mascot / character

- Mascot **does not** have to be a fully controllable avatar; option: character **static in a corner** (“like a screen”), without heavy movement controls.
- **Reward system (reference project Essen):** depending on performance **0–3 “pizza slices”**; used to **unlock skins** for the mascot.
- Optional: **different facial expressions** by situation (nice-to-have).
- **Visual idea:** e.g. **lion** (Bologna coat of arms) or neutral **boy/girl** (school-trip context)—not final.

### 2.3 Tasks and modularity

- Keep task types **modular** (example: **drag-and-drop**) so mainly **texts/content** swap without rebuilding core logic.
- The task-type list is a **team proposal** based on textbook-friendly formats; **LLM-heavy** or expensive types can be **cut or replaced** if implementation cost is too high.
- **Little free text** (desired from pedagogy/scoring angle).

### 2.4 Platform and access

- Reference from another school group: game **hosted for the browser**; participants **log in** with a **generated username** and password (not necessarily a native tablet app).
- Implementation implication: a **click/UI-heavy** design fits the **map** well and lowers control-risk.

---

## 3. Technical requirements

| Area    | Requirement |
|---------|--------------|
| Client  | Unity; core logic such that **at least one playable level per task type** exists (first expansion stage). |
| Backend | Fixed validation/task logic wherever possible; use LLM only in a bounded way. |
| Hosting | Azure (or similar) for API/hosting; cost frame aligned with university credits. |
| Data    | **No personal data** on students stored; **player names randomly generated** (numbers/letters etc.). |
| Metrics | Game metrics OK but **not personally identifiable**; sensitize schools that profiling without names can still be a topic in theory—communicate transparently. |

---

## 4. Privacy and school-side organization

- Plan **parent information/consent**; clarify **in writing** with the school what is collected and how the flow works.
- **Random names + password:** organizationally prepare **paper slips** for students to write them down (reference from conversation with another school).
- **EU hosting** alone does not replace communication with school/parents; if needed **privacy review** by an expert (as recommended for the reference project).
- If key people drop out technically: communicate **early** and **traceably** with support (Matthias) and the school.

---

## 5. Content delivery process

1. **Finalize the skeleton** (storyline, game name, chapter/quest structure, task categories) and send it to **Frau Bernhofer**.
2. After approval: prepare **task packs** from book/content team so they can ship as **default content** into the game.
3. Tech can build the **skeleton** in parallel; missing individual tasks matters less than missing **task-type mechanics**.

---

## 6. Timeline and school visit (from discussion)

- **School week** last mentioned for the run: **29 June–3 July** (align with breaks/end of term).
- Earlier cohort: several short slots across the semester; **now:** more **compressed** (e.g. **one–two blocks**/recap instead of six spread visits)—**align concretely with the teacher**.
- **Target mid-June:** first game version **feature-complete / “ready for tests”**; then **1–2 weeks** buffer for tests, fixes, and organization before the school date.
- Paper/write-up may continue **after** the field phase (e.g. until September—keep agreed frames flexible).

---

## 7. Aligned sprint/team goals (excerpt)

| Team / topic      | Goal (from meeting) |
|-------------------|------------------------|
| Content           | Send skeleton toward teacher by **Friday**; alignment **mid following week** (~**Wednesday**); then roll task packs. |
| Tech (Unity)      | By **Tuesday following week:** core logic, **one level per task type**, fully clickable (no polish/story cohesion yet). |
| Backend/hosting   | Stand up hosting skeleton (e.g. Azure) in parallel. |
| Research          | By **Tuesday following week:** **research question(s)**—optional **two variants** to choose from; **1–2 literature concepts**; optionally orient on paper/process of reference group. |

---

## 8. Open points / to clarify

- Exact **final task types** by feasibility and teacher feedback.
- **Deployment path:** WebGL vs. pure web frontend + API—align with “browser login” reference and Unity stack in the team.
- **LLM scope** per task type after first review with advisors.
- Final **mascot** and asset scope (skins, expressions).
- **Test strategy** (internal, with teacher, optional short external review for pedagogy/Italian).

---

*This document orients the team; detailed decisions belong with teacher and supervisors.*
