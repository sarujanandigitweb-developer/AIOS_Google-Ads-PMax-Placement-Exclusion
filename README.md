# Google Ads PMax — Unrelated Placement Exclusion (ledsone.fr)

| Field | Value |
|---|---|
| **Project code** | `gapmax` |
| **Requirement ID** | REQ-01 |
| **Mini-subfolder** | `/home/led-247/AIOS_Google Ads PMax Placement Exclusion` |
| **Parent domain** | Marketing / PPC — Google Ads Performance Max |
| **Account** | ledsone.fr (LED lighting e-commerce, France) |
| **Created** | 2026-06-11 |
| **Owner / staff** | sarujanan (confirmed via GitHub repo owner) |
| **Coordinator** | Sathees (or assigned coordinator) |
| **Technical reviewer** | Sajeesan / assigned senior dev |
| **Queryability reviewer** | Tamil Selvan / assigned reviewer |
| **Business validator** | Domain owner (PPC) |
| **Status** | PLANNING COMPLETE — implementation NOT started |
| **GitHub path** | https://github.com/sarujanandigitweb-developer/AIOS_Google-Ads-PMax-Placement-Exclusion (branch `main`) |

---

## What is this?

This mini-subfolder is the **planning, documentation, and evidence workbench** for automating the
identification and exclusion of *unrelated placements* (websites, apps, YouTube channels) from the
Performance Max campaigns of **ledsone.fr**.

A *placement* is any property where a PMax ad is shown. Some placements are irrelevant to LED lighting
(gaming apps, children's cartoon sites, sports/music portals). Clicks from them waste budget. Excluding
them gives: **same budget + better placement = more revenue**, and cleaner learning signals for the PMax
algorithm.

The workflow runs **weekly** over the **last 7 days** of placement data.

## What is this NOT?

- This is **not** the production automation itself. No Google Ads Script is deployed from here.
- This is **not** a second source of truth for the parent AIOS. It is a subfolder workbench.
- Applying exclusions, deploying scripts, or changing PPC logic is **RED work** — out of scope here
  (see [D01 Requirement Analysis](docs/D01_REQUIREMENT_ANALYSIS.md) §Scope).

## Start here

New reader? Open **[START_HERE.md](START_HERE.md)** first. It is the navigation map.

## Source of truth

The authoritative business/technical requirement is the supplied technical document:
*"Automate Unrelated Placement Exclusion in PMAX Campaigns"* (Ledsone.fr).
A captured copy / pointer is recorded in [evidence/discovery/DISCOVERY_REPORT.md](evidence/discovery/DISCOVERY_REPORT.md).

## Folder map

| Folder | Purpose |
|---|---|
| `docs/` | D01–D09 analysis & planning documents (authoritative within subfolder) |
| `evidence/` | Discovery, validation, screenshots, outputs, audit proof |
| `queries/` | Filter logic, validation, investigation query packs |
| `reports/` | Duplicate-truth, queryability, closure, compliance, risk reports |
| `handover/` | Continuation guide, next steps, open items, review requirements |
| `implementation/` | Task breakdown, execution plan, validation checklist, dependency & evidence trackers |
