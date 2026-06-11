---
document: Continuation Guide
project_code: gapmax
requirement_id: REQ-01
date: 2026-06-11
author: sarujanan (Claude execution agent)
status: VALIDATED
aios_skill: 10_SKILL_UNKNOWN_DEVELOPER_TEST
---

# Continuation Guide — `gapmax` REQ-01

> For an unknown developer/LLM picking this up tomorrow with no verbal context.

## In one paragraph
This subfolder is the planning + evidence workbench for a weekly Google Ads PMax automation that
excludes placements unrelated to LED lighting (ledsone.fr). All analysis, canonical rules, query logic,
validation plan, risks, and decisions are documented. **Nothing has been deployed.** The next real work
is to resolve four open items, validate the filter logic on a sample export, then — only with written
approval — author and schedule the live script elsewhere.

## How to get oriented (10 min)
1. [START_HERE.md](../START_HERE.md) → [README.md](../README.md).
2. Canonical logic: [docs/D04_BUSINESS_RULES.md](../docs/D04_BUSINESS_RULES.md).
3. What's blocking: [OPEN_ITEMS.md](OPEN_ITEMS.md). What's next: [NEXT_STEPS.md](NEXT_STEPS.md).

## What is done vs not
- **Done:** D01–D09, query packs, validation plan, all governance reports, evidence/discovery.
- **Not done (RED, by design):** script deployment, exclusion-list creation, weekly schedule, live run.

## What you must NOT do
- Do not run/deploy anything against the live Google Ads account from this subfolder.
- Do not edit parent AIOS assets (`~/Downloads/AIOS GPT ...`).
- Do not redefine exclusion rules anywhere except D04.
- Do not invent the related-keyword safeguard — it needs business approval (OI-02).

## Where evidence goes
`evidence/discovery|validation|outputs|screenshots|audit/` — name files
`YYYY-MM-DD__<what>__<stage>.<ext>`; every evidence file states which asset it supports (Skill 12).

## How to continue safely
Operate the AIOS loop: structured prompt (from GPT/coordinator) → discovery/validation in scope →
review → evidence → closure. Treat any account-touching step as RED until approved (OI-03).
