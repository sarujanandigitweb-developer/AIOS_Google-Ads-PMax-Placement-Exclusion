---
document: Apps Script Web App — Deployment & Operation
project_code: gapmax
requirement_id: REQ-01
status: OPERATIONAL
author: sarujanan (Claude execution agent)
date: 2026-06-16
endpoint: dashboard.gs → doPost / doGet / handleRefresh_
---

# Apps Script Web App Deployment — Dashboard Refresh Endpoint

The dashboard auto-refreshes when n8n POSTs to an Apps Script Web App after writing
ToExclude / ToMonitor / RunLog. Endpoint lives in [dashboard.gs](dashboard.gs).

## Endpoint contract
- `doPost(e)` and `doGet(e)` → `handleRefresh_(e)`.
- Auth: shared token `DASH_REFRESH_TOKEN` (set in the script; **never commit the real value** — repo keeps the placeholder `CHANGE_ME_SET_A_SECRET`).
- On valid token → runs `buildMonitorDashboard()` → returns `{"ok":true,"message":...,"at":...}`.
- On bad token → `{"ok":false,"error":"unauthorized"}`.
- **Always HTTP 200** (ContentService) — callers must check the JSON `ok` field, not the status code.

## Deploy steps
1. Apps Script editor → set `DASH_REFRESH_TOKEN` to a real secret.
2. **Deploy → New deployment → type: Web app**.
3. **Execute as: Me** · **Who has access: Anyone** (n8n cannot do Google OAuth; the token is the guard).
4. Authorize (Google Sheets scope only).
5. Copy the **Web app URL** ending in **`/exec`**.

## Update without changing the URL
Editing code does NOT change the running version. To publish changes:
**Deploy → Manage deployments → (pencil) Edit → Version: New version → Deploy.**
(A *New deployment* mints a different URL; *New version* on the existing deployment keeps the same `/exec`.)

## n8n HTTP Request node
| Field | Value |
|---|---|
| Method | `POST` |
| URL | `https://script.google.com/macros/s/<WEBAPP_ID>/exec` |
| Headers | `Content-Type: application/json` |
| Body (JSON) | `{ "token": "<SECRET>", "source": "n8n", "trigger": "weekly-run" }` |
| Settings → **Execute Once** | **ON** (writers emit many items → one refresh, not hundreds) |
| Settings → **Continue On Fail** | **ON** (refresh is non-critical; pipeline proceeds to Wait/IF/Email) |
| Options → **Follow Redirects** | **ON** (Apps Script `/exec` returns 302) |

## Verify
- **Browser:** `…/exec?token=<SECRET>` → `{"ok":true}` and the **Dashboard** tab rebuilds.
- **n8n:** run the HTTP node → response `ok:true`; Apps Script **Executions** log shows one `doPost`.

## Troubleshooting `{"ok":false,"error":"unauthorized"}`
1. **Stale deployment (most common):** the `/exec` is running an older version where the token was still the placeholder. Fix: **Manage deployments → Edit → New version → Deploy**.
2. **Whitespace:** trailing space/newline in the token. (`handleRefresh_` trims both sides, but verify the body.)
3. **`/dev` vs `/exec`:** use `/exec` (deployed version); `/dev` needs an authenticated browser.
4. **Wrong deployment:** confirm the URL matches `ScriptApp.getService().getUrl()` (temporary diagnostic).

## Security
- Keep the token out of git; rotate if the URL leaks.
- "Anyone" access is required for server-to-server calls; the token is the access control.
