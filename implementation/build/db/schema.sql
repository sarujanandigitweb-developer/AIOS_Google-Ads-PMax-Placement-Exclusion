-- ============================================================================
-- gapmax REQ-01 — Postgres schema (project_db)
-- Mirrors the canonical Google Sheets tabs 1:1 so the pipeline can persist to
-- Postgres instead of (or alongside) Sheets. Column names and semantics are the
-- source of truth from:
--   - implementation/build/apps_script/build_output_tabs.gs   (tab headers)
--   - implementation/build/n8n/code_nodes/06_runlog_row.js    (RunLog row)
--   - implementation/build/dashboard/DASHBOARD_DATA_MODEL.md  (MONITOR_REVIEW)
-- Business rules: docs/D04_BUSINESS_RULES.md (canonical, read-only).
--
-- Apply with:
--   psql "postgresql://mcp_user:autoway23@<HOST>:5432/project_db" -f schema.sql
-- Idempotent: safe to re-run (IF NOT EXISTS throughout).
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS gapmax;
SET search_path TO gapmax, public;

-- ── 1. placements ──────────────────────────────────────────────────────────
-- Raw weekly export (last-7-days). One row per placement per run window.
-- Source: Sheets "Placement Data" tab; Query Pack assumed input `placements`.
CREATE TABLE IF NOT EXISTS placements (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    run_date      DATE        NOT NULL,
    placement     TEXT        NOT NULL,
    placement_url TEXT,
    type          TEXT,                              -- Site | Mobile application | YouTube video | Google products
    network       TEXT,
    impressions   INTEGER     NOT NULL DEFAULT 0,
    campaigns     TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_placements_run_date ON placements (run_date);
CREATE INDEX IF NOT EXISTS ix_placements_url      ON placements (placement_url);

-- ── 2. to_exclude ──────────────────────────────────────────────────────────
-- decision = 'EXCLUDE'. D04 Rule 6: REPLACE each run (truncate + reload).
-- Headers: Placement, Placement URL, Type, Impressions, Campaigns, Decision, RuleTrace, RunDate
CREATE TABLE IF NOT EXISTS to_exclude (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    placement     TEXT        NOT NULL,
    placement_url TEXT,
    type          TEXT,
    impressions   INTEGER     NOT NULL DEFAULT 0,
    campaigns     TEXT,
    decision      TEXT        NOT NULL DEFAULT 'EXCLUDE'
                  CHECK (decision = 'EXCLUDE'),
    rule_trace    TEXT,
    run_date      TIMESTAMPTZ NOT NULL
);

-- ── 3. to_monitor ──────────────────────────────────────────────────────────
-- decision = 'MONITOR'. D04 Rule 6: APPEND, retain history across runs.
-- Headers: Placement, Placement URL, Type, Impressions, Decision, RuleTrace, RunDate
CREATE TABLE IF NOT EXISTS to_monitor (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    placement     TEXT        NOT NULL,
    placement_url TEXT,
    type          TEXT,                              -- always 'Site' for MONITOR (Rule 3)
    impressions   INTEGER     NOT NULL DEFAULT 0,
    decision      TEXT        NOT NULL DEFAULT 'MONITOR'
                  CHECK (decision = 'MONITOR'),
    rule_trace    TEXT,                              -- order-3:Site+kw:<kw>+<impr><=<thr>
    run_date      TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_to_monitor_url      ON to_monitor (placement_url);
CREATE INDEX IF NOT EXISTS ix_to_monitor_run_date ON to_monitor (run_date);

-- ── 4. monitor_review ──────────────────────────────────────────────────────
-- Human-owned, persists ACROSS runs. Keyed by Placement URL. Dashboard
-- LEFT-JOINs this onto the latest MONITOR rows (DASHBOARD_DATA_MODEL.md K/L).
CREATE TABLE IF NOT EXISTS monitor_review (
    placement_url  TEXT PRIMARY KEY,
    review_status  TEXT NOT NULL DEFAULT 'New',      -- New | In Review | Keep | Exclude | ...
    reviewer_notes TEXT NOT NULL DEFAULT '',
    last_updated   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 5. run_log ─────────────────────────────────────────────────────────────
-- Exactly one row per pipeline run (06_runlog_row.js reducer).
-- Headers: RunDate, Total, Keep, Exclude, Monitor, Threshold, Pass, Failed, Pending, Keywords, Safeguard
CREATE TABLE IF NOT EXISTS run_log (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    run_date    TIMESTAMPTZ NOT NULL,
    total       INTEGER     NOT NULL DEFAULT 0,
    keep        INTEGER     NOT NULL DEFAULT 0,
    exclude     INTEGER     NOT NULL DEFAULT 0,
    monitor     INTEGER     NOT NULL DEFAULT 0,
    threshold   NUMERIC     NOT NULL DEFAULT 0,
    pass        TEXT        NOT NULL CHECK (pass IN ('PASS', 'FAIL')),
    failed      TEXT        NOT NULL DEFAULT '',      -- comma-joined check ids
    pending     TEXT        NOT NULL DEFAULT '',      -- comma-joined check ids
    keywords    INTEGER     NOT NULL DEFAULT 0,
    safeguard   INTEGER     NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS ix_run_log_run_date ON run_log (run_date);
