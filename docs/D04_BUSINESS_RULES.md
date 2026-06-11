---
document: D04 Business Rules (CANONICAL)
project_code: gapmax
requirement_id: REQ-01
deliverable_id: D04
date: 2026-06-11
last_updated: 2026-06-11
author: sarujanan (Claude execution agent)
reviewer: Business validator (PPC) — REQUIRED before any implementation
status: DRAFT — authoritative within subfolder; pending business sign-off
version: 1.0
source_documents: ["Automate Unrelated Placement Exclusion in PMAX Campaigns (ledsone.fr)"]
canonical: true
note: "This is the SINGLE SOURCE OF TRUTH for the exclusion decision logic. Other docs reference it; none redefine it."
---

# D04 — Business Rules (Canonical)

## What / why
The exclusion logic must have exactly **one** authoritative definition (AIOS Skill 05 — Duplicate Truth
Prevention). This file is it. D02/D03/queries reference these rules; they must never restate them differently.

---

## Rule 1 — Threshold calculation

```
SITES          = all placements where Type = "Site"
threshold_raw  = SUM(impressions of SITES) / COUNT(SITES)      # average impressions per site
threshold      = MAX(threshold_raw, IMPRESSION_FLOOR)
IMPRESSION_FLOOR = 500   # recommended 500–1000 per LLM-validation safeguard (DEC-02)
```
- Threshold is recomputed **every run** over that run's 7-day Site population.
- Rationale for the floor: a low raw average can over-prune and starve PMax algorithm exploration.

---

## Rule 2 — Decision tree (apply IN ORDER, STOP at first match)

| Order | Condition | Action |
|---|---|---|
| **1** | Placement is a **Mobile app** (matches Google Play OR Apple iTunes pattern) | **EXCLUDE** immediately — no threshold check |
| **2** | `Type = Site` AND contains an **unrelated keyword** AND `impressions > threshold` | **EXCLUDE** |
| **3** | `Type = Site` AND contains an **unrelated keyword** AND `impressions ≤ threshold` | **MONITOR** |
| **4** | None of the above | **KEEP** |

> ⚠ **Ambiguity resolution (DEC-03):** The source document numbers these conditions inconsistently
> (its table calls the keyword/threshold rule "CONDITION 1" and the app rule "CONDITION 2", while its
> prose swaps them and the app rule is described as "Immediate Exclude"). The **resolved authoritative
> order** is the one above: **mobile-app exclusion is evaluated first** (it is unconditional), then the
> keyword+threshold rules. This is logically safe because the two branches are mutually exclusive by
> `Type`, but ordering is fixed for determinism.

---

## Rule 3 — App-store detection patterns (substring match in Placement)

| Store | Patterns (any match → Mobile app) |
|---|---|
| Google Play | `play.google.com`, `android-app://`, `google play`, `googleplay` |
| Apple iTunes | `itunes.apple.com`, `apps.apple.com`, `itunes`, `apple.com/app` |

---

## Rule 4 — Unrelated keyword list (French) — substring match, case-insensitive

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
Categories: gaming/gambling, children, sports, music, weather, news/press, dating, entertainment.

---

## Rule 5 — "Related" keyword safeguard (false-positive protection)
A protective allow-list of LED/lighting/DIY/design terms should override an EXCLUDE when present, to
protect quality DIY/design channels (LLM-validation "strong" point). **The exact related-keyword list
is an OPEN ITEM** — must be defined and approved by the business validator before implementation
(see [handover/OPEN_ITEMS.md](../handover/OPEN_ITEMS.md), OI-02).

---

## Rule 6 — Sheet maintenance
- `ToExclude` tab → **clear and replace** with latest run.
- `ToMonitor` tab → **append**, retain existing entries (history of watch-list).

## Rule 7 — Apply ordering
When pushing to the shared exclusion list, sort `to_exclude` by **impressions descending** and apply
until the Google Ads per-campaign exclusion cap is reached.

---

## Worked examples

| Placement | Type | Impr | Threshold | Trace | Result |
|---|---|---|---|---|---|
| `play.google.com/store/apps/...gamexyz` | Mobile app | 40 | 500 | Rule 2 order-1 hit | EXCLUDE |
| `jeux-enfants.fr` | Site | 1 200 | 500 | order-2: keyword `jeux`+`enfant`, 1200>500 | EXCLUDE |
| `chanson-paroles.fr` | Site | 90 | 500 | order-3: keyword `chanson`, 90≤500 | MONITOR |
| `eclairage-led-deco.fr` | Site | 800 | 500 | no unrelated keyword (and related safeguard) | KEEP |

## Pass / fail rule
- **PASS:** every classification in validation reproduces these rules exactly; one canonical definition only.
- **FAIL:** any divergent rule definition exists elsewhere, or related-keyword safeguard remains undefined at go-live.

## Known limitations
- Keyword matching is language- and substring-bound (e.g. `info` matches `infographie`) → safeguard list mitigates but does not eliminate false positives.
