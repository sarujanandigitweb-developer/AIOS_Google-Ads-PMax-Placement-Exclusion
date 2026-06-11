---
document: D02 Technical Analysis
project_code: gapmax
requirement_id: REQ-01
deliverable_id: D02
date: 2026-06-11
last_updated: 2026-06-11
author: techclawweb (Claude execution agent)
reviewer: Technical reviewer (Sajeesan / assigned)
status: DRAFT
version: 1.0
source_documents:
  - "Automate Unrelated Placement Exclusion in PMAX Campaigns (ledsone.fr)"
related: [D01_REQUIREMENT_ANALYSIS.md, D03_WORKFLOW_ANALYSIS.md, D04_BUSINESS_RULES.md]
---

# D02 — Technical Analysis

## What / why
Technical breakdown of the 4-phase pipeline and the components, data shapes, and algorithm needed to
satisfy D01. No production code is deployed from here; this is the design of record.

## System architecture (logical)

```
Google Ads PMax campaign
      │  (Phase 1: export last 7 days)
      ▼
Placement dataset  [Placement | Type | Network | Impressions]
      │  → Google Sheet "Placement Exclusion" (Placements tab)
      ▼
Filter engine (Apps Script / Python / Ads Script)
      │  compute threshold; apply decision tree
      ├─► ToExclude tab  (clear + replace each run)
      └─► ToMonitor tab  (append, retain history)
      │  (Phase 3)
      ▼
Shared Library ▸ Placement Exclusion List  "PMax - Unrelated Placements - ledsone.fr"
      │  applied to PMax campaign
      ▼
(Phase 4) Weekly scheduler — Monday 06:00 CET, email on failure
```

## Data model

| Field | Type | Role | Notes |
|---|---|---|---|
| Placement | string | URL / app ID / YouTube channel | substring-matched against keyword & app-store patterns |
| Type | enum | Site, Mobile app, YouTube channel, … | Threshold computed over `Type = Site` only |
| Network | enum | Search, Display, YouTube, … | volume/context indicator |
| Impressions | int | priority + threshold input | the **only** quantitative signal available |

## Algorithm

1. **Filter to Sites** for threshold computation.
2. `threshold = Σ(impressions where Type=Site) / count(Type=Site)`. Apply a floor of **500–1000**
   (LLM-validation safeguard) to avoid pruning algorithm exploration.
3. For each placement, evaluate the decision tree (D04) **stopping at first match**:
   - Mobile app (Google Play / iTunes patterns) → EXCLUDE.
   - Site + unrelated keyword + impressions > threshold → EXCLUDE.
   - Site + unrelated keyword + impressions ≤ threshold → MONITOR.
   - else → KEEP.
4. Emit `to_exclude` (replace) and `to_monitor` (append).
5. Push `to_exclude`, **highest impressions first**, into the shared exclusion list until the
   per-campaign cap is reached.

## Component options (per source doc)

| Phase | Primary tool | Alternative |
|---|---|---|
| 1 Export | Google Ads Script → Sheet | Manual UI CSV (`placements_last7days.csv`) for first verification |
| 2 Filter | Apps Script or Python | Sheet formulas |
| 3 Apply | Google Ads Script | Manual UI (first run setup) |
| 4 Schedule | Google Ads Scripts scheduler (weekly) | Apps Script trigger |

## Non-functional considerations
- **Idempotency:** re-running same week must not double-add exclusions (dedupe by placement key).
- **Cap handling:** Google Ads limits exclusions/campaign → impression-priority ordering is mandatory.
- **Parameterisation:** `YOUR_SHEET_ID` and list name must be config, not hardcoded.
- **Observability:** email-on-failure; logs under Tools ▸ Scripts ▸ [script] ▸ Logs.

## Security considerations
- Script executes with account-level privileges → treat as RED for deployment; review required.
- Sheet ID is a secret-ish identifier; do not commit real IDs to a public repo.

## Pass / fail rule
- **PASS:** every FR in D01 maps to a component + algorithm step above.
- **FAIL:** any FR has no technical realisation path.

## Known limitations
- Substring keyword matching is heuristic → multilingual / ambiguous domains may misclassify.
- No conversion data → cannot rank by ROI, only by impressions.
