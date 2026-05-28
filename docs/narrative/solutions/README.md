# Chapter test solutions (QA walkthroughs)

Fast answer keys for playtesting **without reading Italian**. Content is derived from **`supabase/migrations/`** (not from narrative markdown alone).

| Chapter | Solutions doc | Shipped in DB |
|---------|-----------------|---------------|
| 1 | [chapter-01-solutions.md](chapter-01-solutions.md) | Yes |
| 2 | [chapter-02-solutions.md](chapter-02-solutions.md) | Yes |
| 3 | [chapter-03-solutions.md](chapter-03-solutions.md) | Yes |
| 4 | [chapter-04-solutions.md](chapter-04-solutions.md) | Placeholder |
| 5 | [chapter-05-solutions.md](chapter-05-solutions.md) | Placeholder |
| 6 | [chapter-06-solutions.md](chapter-06-solutions.md) | Placeholder |

## How to use

1. Log in with a test account; open the chapter on the map.
2. **Cutscenes:** tap **Avanti** through all beats (no graded input).
3. **Tasks:** use the tables in the chapter doc, then **Controlla**.
4. **FreitextLlm:** paste the sample Italian block (or equivalent length + relative pronouns / criteria).
5. **Bonus matching:** only a subset of pairs appears per run — match by label text, not position.

## Regenerating after content changes

When a chapter migration changes, update the matching `chapter-NN-solutions.md` from the SQL `content_payload` JSON (`correctAnswers`, `correctOptionIds`, `correctPairs`, `correctItemIds`, etc.). Chapter 1 exemplar migrations: `20260527160000_*`, `20260527170000_*`, `20260628110000_*`.
