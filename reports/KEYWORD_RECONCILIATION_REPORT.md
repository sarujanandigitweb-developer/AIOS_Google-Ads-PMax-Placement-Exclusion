---
document: Keyword Reconciliation — D04 Rule 4 vs live "Unrelated keywords" sheet
project_code: gapmax
requirement_id: REQ-01
status: PARTIAL — live full list not obtainable from this environment (see §2)
author: sarujanan (Claude execution agent)
date: 2026-06-15
rule: evidence only; no guessed terms
---

# KEYWORD_RECONCILIATION_REPORT.md

## Evidence availability (read first)
- **D04 list:** fully available — [docs/D04_BUSINESS_RULES.md](../docs/D04_BUSINESS_RULES.md) Rule 4 (lines 67–76).
- **Live sheet full term list:** **NOT available.** It is not stored anywhere in the repo (searched: no CSV, no `__KEYWORDS__` fixture, no evidence export), and the live Google Sheet cannot be read from this execution environment. Only the **count** and **two confirmed members** are evidenced (see §2). Sections §3–§4 are therefore **partial** and require the sheet export to finalise. No terms are guessed.

## 1. Keywords in D04 documentation
**Source:** D04 Rule 4 (D04:67–76). **Exact count: 37 terms, all French.**

```
jeux, jeu, joueur, casino, pari, poker,
enfants, enfant, dessin, anime, manga,
sport, football, basket, tennis, rugby, f1,
musique, chanson, paroles, concert, playlist,
meteo, previsions,
actualite, actualites, info, infos, journal, presse,
rencontre, rencontres, celibataire,
divertissement, spectacle, celebrity, people
```
(Categories per D04:79 — gaming/gambling, children, sports, music, weather, news/press, dating, entertainment.)

## 2. Keywords in the live Google Sheet
**Count — evidenced as 40 terms** (4 independent references agree):
- [evidence/outputs/2026-06-12__validation_metrics.json:16](../evidence/outputs/2026-06-12__validation_metrics.json) → `"keyword_count": 40` (runtime, read from the actual sheet).
- [N8N_NODE_CONFIGURATION_REFERENCE.md:34](../implementation/build/n8n/N8N_NODE_CONFIGURATION_REFERENCE.md), [WORKFLOW_DESIGN.md:22](../implementation/build/n8n/WORKFLOW_DESIGN.md), [CONFIG_SPEC.md:25](../implementation/build/config/CONFIG_SPEC.md), [IMPLEMENTATION_ASSUMPTIONS.md:28](../implementation/build/config/IMPLEMENTATION_ASSUMPTIONS.md) → "40 terms".

**Confirmed members (from runtime ruleTrace evidence only):**
| Term | Evidence | In D04? |
|---|---|---|
| `jeux` | ToExclude rows `1001jeux.fr`, `jeux.fr` → `order-2:Site+kw:jeux` | ✅ yes |
| `game` | [classify_sample.json](../evidence/outputs/2026-06-12__classify_sample.json) `order-3:Site+kw:game`; ToExclude `1001games.com` | ❌ no (English) |

**Remaining 38 of 40 terms: UNKNOWN** — not captured in the repo; require sheet export.

## 3. Missing keywords (in D04, not in live sheet)
**Cannot be fully determined** without the live list. What is provable: the live sheet has **40** terms vs D04's **37**, so the live sheet is a *superset by count* (+3 net) — but per-term presence of each D04 word in the live sheet is **unverified**. ⚠ Needs export to confirm whether any of the 37 D04 terms are absent.

## 4. Additional keywords (in live sheet, not in D04)
**At least 1 confirmed:** `game` (matched at runtime, absent from D04's 37). By count, there are **≥3 additional** terms (40 − 37), and at least one is **English**. The remaining additional terms are **unverified** pending export.

## 5. Language differences (French vs English)
- **D04:** 100% French (37/37).
- **Live sheet:** **mixed** — contains at least one **English** term (`game`) alongside French (`jeux`). This is a confirmed FR/EN divergence: the deployed list is not purely French as D04 documents.

## 6. Does runtime behavior match documentation?
**No — confirmed mismatch on two independent measures:**
1. **Count:** runtime `keyword_count = 40` ≠ documented D04 list of **37**.
2. **Content:** runtime classified a placement using `kw:game`, a term **not present in D04 Rule 4**. So the executing logic is matching on terms the canonical document does not list.

(The *mechanism* matches D04 — substring, case-insensitive, Rule 2/3 — but the *list content* does not.)

## 7. Recommendation
The canonical document (D04) and the deployed sheet are **out of sync** (37 French vs 40 mixed FR/EN). Per AIOS, D04 is the single source of truth, so the two must be reconciled. The correct direction depends on intent, which I will not guess — but the evidence supports:

- [ ] Both are aligned — **NO** (disproven: 37 vs 40, `game` undocumented).
- [x] **Update documentation** — at minimum, D04 Rule 4 must be corrected to reflect the **actual 40 deployed terms** (it currently under-documents the running list, including the English terms). D04 is what reviewers trust; it is currently inaccurate.
- [x] **Update Google Sheet (conditional)** — *if* the English/extra terms were added unintentionally or risk false positives (e.g. short English substrings), trim the sheet back to the approved list. This is a business decision for the reviewer, not a code fact.

**To finalise §3 and §4 (the only blocked sections), provide one of:**
- the live `Unrelated keywords` column (paste the 40 cells), or
- a CSV/screenshot export of that tab.

With that, I will produce the exact missing/additional term diff and a definitive single recommendation. Until then, this report is accurate but **partial by design** — no terms have been fabricated.

## Reasoning path
1. D04 Rule 4 enumerated and counted programmatically → **37 French terms**.
2. Live count evidenced at **40** (runtime metric + 4 docs).
3. 40 ≠ 37 → lists differ in size.
4. Runtime matched `game` (English), absent from D04 → content + language divergence proven.
5. Full per-term diff blocked because the live 40 terms are not stored in the repo and the live sheet is unreadable here → §3/§4 marked partial, export requested.
