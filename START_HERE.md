# START HERE — Google Ads PMax Placement Exclusion (`gapmax`, REQ-01)

> **Purpose:** Give any reader (human or LLM) the fastest safe path into this mini-subfolder.
> **Read order matters.** Follow the sequence below.

## 30-second orientation

- **Goal:** weekly auto-exclusion of unrelated placements from ledsone.fr PMax campaigns.
- **Current state:** planning + documentation scaffold complete. **No production change made.**
- **What's blocking implementation:** see [handover/OPEN_ITEMS.md](handover/OPEN_ITEMS.md).
- **What you must NOT do here:** deploy scripts, apply exclusions, change PPC logic (RED work).

## Read order

1. [README.md](README.md) — what this is.
2. [docs/D01_REQUIREMENT_ANALYSIS.md](docs/D01_REQUIREMENT_ANALYSIS.md) — business + technical requirement, scope.
3. [docs/D02_TECHNICAL_ANALYSIS.md](docs/D02_TECHNICAL_ANALYSIS.md) — how the 4-phase workflow works.
4. [docs/D03_WORKFLOW_ANALYSIS.md](docs/D03_WORKFLOW_ANALYSIS.md) — phase-by-phase flow.
5. [docs/D04_BUSINESS_RULES.md](docs/D04_BUSINESS_RULES.md) — the decision tree, threshold, keyword lists (canonical rules).
6. [queries/QUERY_PACK.md](queries/QUERY_PACK.md) — the filter logic in pseudo/SQL form.
7. [docs/D05_IMPLEMENTATION_PLAN.md](docs/D05_IMPLEMENTATION_PLAN.md) — what to build, in what order.
8. [docs/D06_VALIDATION_PLAN.md](docs/D06_VALIDATION_PLAN.md) — how to prove it works.
9. [docs/D08_RISK_REGISTER.md](docs/D08_RISK_REGISTER.md) + [docs/D09_DECISION_LOG.md](docs/D09_DECISION_LOG.md) — risks & decisions.
10. [handover/CONTINUATION_GUIDE.md](handover/CONTINUATION_GUIDE.md) — how to continue tomorrow.

## Canonical rules quick-reference (do not redefine elsewhere)

- **Threshold** = average impressions per `Site`-type placement = (Σ impressions of all Sites) ÷ (count of Sites).
- **Decision tree (stop at first match):**
  1. Mobile app (Google Play / iTunes) → **EXCLUDE** immediately (no threshold).
  2. Site + contains unrelated keyword + impressions > threshold → **EXCLUDE**.
  3. Site + contains unrelated keyword + impressions ≤ threshold → **MONITOR**.
  4. Otherwise → **KEEP**.
- Full keyword & app-store pattern lists live in **[D04_BUSINESS_RULES.md](docs/D04_BUSINESS_RULES.md)** — the single source of truth.

> ⚠ Note: the source technical document labels the conditions inconsistently (CONDITION 1 vs 2 swap
> between the table and the prose). The **resolved, authoritative** ordering is the one above and in D04.
> See [D09_DECISION_LOG.md](docs/D09_DECISION_LOG.md) decision DEC-03.
