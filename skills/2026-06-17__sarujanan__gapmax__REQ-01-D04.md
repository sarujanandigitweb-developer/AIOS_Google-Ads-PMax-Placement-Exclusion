# Skill File — REQ-01-D04 (2026-06-17, Wednesday)

| Field | Value |
|---|---|
| date | 2026-06-17 |
| developer | sarujanan |
| project | Google Ads PMax Placement Exclusion |
| project_code | gapmax |
| phase | Phase 4 – Closure, Governance Hardening & Certification |
| requirement_id | REQ-01 |
| deliverable_id | D04 |
| status | COMPLETE (CLOSED — pending Coordinator sign-off) |
| evidence_location | `handover/PROJECT_FINAL_CLOSURE.md`; `implementation/build/dashboard/DASHBOARD_AS_BUILT.md` + 7 Superseded design docs; `implementation/build/apps_script/dashboard.gs`; `evidence/exports/GADS_PMAX_Placement Exclusion.json` (24 nodes); git `a7ed593`, `5f3cc52`, `010c91f`, `43fd7ae`, `ff5741e`, `37d4e65` |
| blos_keys_used | DASH_REFRESH_TOKEN (placeholder), IMPRESSION_FLOOR, EXCLUSION_CAP, priority cutoffs (High/Medium/Low) |
| hardcoded_thresholds | YES (unchanged) — `IMPRESSION_FLOOR=500`, `EXCLUSION_CAP=65000`, priority cutoffs `≥0.8 / ≥0.5`; `DASH_REFRESH_TOKEN` now a committed **placeholder** only |
| three_am_standard | PASS |
| llm_queryable | YES |
| company_knowledge_candidate | YES |
| domain | Advertising / Google Ads PMax |

## 1. SYSTEM STATE
The pipeline, dashboard, auto-refresh and evidence were all in place (D03), but the repository was **not closure-ready**: a real `DASH_REFRESH_TOKEN` had been committed, eight dashboard docs described **competing** designs with no authoritative source, several inter-doc links were dead, and there was no single document a reviewer could read to certify the project.

## 2. WHAT CHANGED TODAY
- **PROJECT_FINAL_CLOSURE.md** authored — one self-contained closure record (objective, scope, as-built architecture, evidence inventory, queryability, duplicate-truth, security, open items, sign-off table, final decision, next action).
- **Security cleanup** — exposed token removed from history-tracked files: `dashboard.gs` now holds placeholder `NEW_RANDOM_TOKEN_HERE`; workflow JSON `token` is placeholder `CHANGE_ME_SET_A_SECRET`. Real token to live **only** in the deployed Web App; rotation required.
- **Dashboard governance** — `DASHBOARD_AS_BUILT.md` declared authoritative; the **7** legacy design docs banner-marked **Superseded** (resolves the design contradiction).
- **Dead-link fixes** across handover/governance docs.
- **dashboard.gs** stabilization fixes committed (`a7ed593`, `5f3cc52`).
- **Repository certification** confirmed: JSON valid / 24 nodes, 8 screenshots, 5 validation + 5 audit evidence files, RunLog all-PASS.

## 3. POSTGRESQL / MCP FINDING
No DB (Google Sheets is the data store; PostgreSQL excluded this phase). **Closure finding:** the only non-repo dependency is the **deployed Apps Script Web App** — the live `/exec` endpoint serves the *deployed* snapshot and carries the *real* token, neither of which belongs in git. The repo therefore certifies as code+evidence complete while one **operational** action (token set/rotate in the deployment) remains outside version control.

## 4. GAP FOUND
- **Committed secret (now remediated)** — the real refresh token had been pushed in a shared config; repo files scrubbed to placeholders, but the **exposed value must still be rotated** so it is dead in history.
- **Unmanaged duplicate truth (now governed)** — 8 dashboard design docs with no owner; resolved by AS_BUILT + Superseded banners.
- **OI-02 (open, non-blocking)** — safeguard "related" keyword list is empty → validation **V6 = PENDING**; Rule 5 is a no-op until the list is provided (RunLog confirms `Pending=V6`, `Safeguard=0`).
- **OI-03 (open by design)** — live Google Ads exclusion apply **not implemented** (RED / out of scope).

## 5. VALIDATION RULE ADDED OR CHANGED
No business-logic change. **Closure / governance rules recorded:**
```
Secrets: no real token in tracked files; repo holds a placeholder; real value lives only in the deployed Web App and must be rotated if ever exposed.
Authoritative-doc rule: exactly one as-built doc per subsystem; every superseded doc carries a Superseded banner pointing to it.
Closure rule: a project is closure-ready only when what/why/how/evidence/open-items/next-action are answerable from repo files alone (no verbal hand-off).
Open-item rule: RED / out-of-scope items (OI-03) are declared, never silently dropped; PENDING non-blockers (OI-02) are labelled non-blocking with reason.
```

## 6. FAILURE MODE OR EDGE CASE
- **Secret-in-git** — scrubbing the working tree does **not** undo exposure; the value is still live until rotated in the source system.
- **Stale Web App deployment** (carried from D03) — editor saves ≠ live; the deployed token/version is what the `/exec` call actually uses.
- **Self-referential commit lag** — PROJECT_FINAL_CLOSURE.md cites `ff5741e` as "latest", but the commit that *adds* the doc (`37d4e65`) is necessarily later; expected, not an error.

## 7. DECISIONS MADE TODAY
- **Single closure document** (`PROJECT_FINAL_CLOSURE.md`) as the certification entry point.
- **Placeholder-in-repo, secret-in-deployment** for `DASH_REFRESH_TOKEN`.
- **One authoritative dashboard doc**; all others Superseded rather than deleted (preserves design history without competing truth).
- **Status = CLOSED, PASS, APPROVED FOR CLOSURE**, with the live token rotation logged as an **operational** (non-code) next action.

## 8. COMPANY KNOWLEDGE EXTRACT
- **Closure = queryability:** a project is "done" only when a new engineer can answer what/why/how/evidence/open/next from files alone — write the one document that proves it.
- **Secret remediation is two steps:** scrub the repo **and** rotate at the source; the first without the second is a false fix.
- **Kill duplicate truth by ownership, not deletion:** name one as-built source and banner-mark the rest Superseded — keeps history, removes ambiguity.
- **Declare RED items explicitly:** an out-of-scope feature stated as "not implemented by design" is governance; the same feature left unmentioned is a gap.
- **Certify against artifacts:** validate the exported JSON (parse + node/connection count), evidence file counts, and RunLog status — never against memory of the build.

## 9. LLM STANDARD CHECK
Consistent vocabulary ✅ · secret-vs-rotation distinction explained ✅ · every gap mapped to a remediation or a labelled open item ✅ · evidence linked (closure doc, JSON, dashboard docs, commits) ✅ · RED/PENDING items declared ✅ · **LLM Queryable: TRUE**.

## BLOS Governance note
No new thresholds introduced. `DASH_REFRESH_TOKEN` is now a **committed placeholder** — the real value is a **secret** that must live only in the deployed Web App and be **rotated** (it was previously exposed). `IMPRESSION_FLOOR`, `EXCLUSION_CAP`, the priority cutoffs (`0.80 / 0.50`), and the **unrelated-keyword + safeguard lists** remain BLOS-migration candidates carried forward from D01/D02/D03 (governed, reviewable, single source).
