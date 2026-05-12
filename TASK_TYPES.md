# Task categories

Overview of the discussed task types for the language-learning game, grouped into **without LLM** (deterministically checkable) and **with LLM** (use only in a targeted way). Aligned with the content team’s task-category taxonomy.

---

## Without LLM

These types can be checked against stored solutions or patterns and suit a stable, predictable player experience.

### Error spotting

Students receive a sentence or short text containing a built-in error (grammar, word order, wrong form) and **mark or correct** it. The solution is stored; scoring is **deterministic**.

### Drag & drop

Players move elements to the correct position, for example:

- Sentence blocks in the right order
- Words into the right gaps
- Pronouns to their referents
- Terms into categories (e.g. *indicativo* / *congiuntivo*)

The task is **unambiguously** checkable against an answer pattern.

### Cloze text

A text with missing words or forms. Gaps are filled either:

- via **multiple choice** (very robust), or  
- via **free text**, compared to a list of **accepted solutions**

Well suited for drilling specific grammar forms.

### Matching

Two columns are paired, for example:

- Idiomatic verbs ↔ meanings
- Italian words ↔ English synonyms (mediation, as in the textbook)
- Pictures ↔ terms
- If-clauses ↔ matching main clauses (*periodo ipotetico*)

**Deterministic** pair scoring.

### Multiple choice

Pick the correct answer from typically **3–4 options**. Usable for:

- Listening (audio + options)
- Reading (text + comprehension questions)
- Mediation
- Grammar decisions (which form fits?)
- Cultural knowledge

Scoring is **deterministic**; the mechanic is **highly reusable**.

---

## With LLM

Use **only in a targeted way**: control and auditability are harder than for fixed tasks.

### Free text (scored)

Students write an **own answer** (e.g. answer an NPC, describe a situation, phrase a polite request). A language model scores using **predefined criteria**, e.g.:

- Presence of target structures (e.g. “must contain *congiuntivo*”)
- Communicative appropriateness
- Rough correctness

Possible outcomes: **pass/fail** or a score with short feedback.

**Note:** This category carries the **highest grading risk** (hallucinations, inconsistency across runs).

### Word descriptions with relative pronouns

A target word must be described **with relative clauses** (e.g. *è una cosa che…*, *è un posto dove…*, *è una persona la quale…*) **without** naming the target word. The model **guesses** the word from the description. If it hits within **1–3 tries**, the task passes.

Evaluation focus: **communicative comprehensibility**, not grammar perfection. Here the LLM’s strength is **language understanding** more than precise error diagnosis.

---

## Short summary for implementation

| Category          | LLM | Checkability        |
|-------------------|-----|---------------------|
| Error spotting    | no  | deterministic       |
| Drag & drop       | no  | vs. answer pattern |
| Cloze text        | no  | MC or solution list |
| Matching          | no  | pairs               |
| Multiple choice   | no  | fixed keys          |
| Free text         | yes | criteria + risk     |
| Relative-clause puzzle | yes | guess attempts |

The final list may still change based on **Unity feasibility**, **backend** constraints, and **pedagogical sign-off**; task types can be **removed or replaced** as needed.
