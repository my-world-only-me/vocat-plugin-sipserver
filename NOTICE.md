# NOTICE — Modifications and Redistribution Restrictions

## Upstream projects

This repository contains a **modified version** of the VoCat SIP Server plugin,
derived from the following upstream work:

| Component | Upstream repository | Relationship |
|---|---|---|
| VoCat SIP Server plugin | `https://github.com/LAODiss/vocat-plugin-sipserver` | Based on upstream |
| VoCat main program (referenced by, not bundled here) | `https://github.com/MengMengCode/VoCat` | Interoperates with |

Copyright and license terms of the upstream projects are retained. See the
upstream repositories for the authoritative license text, in particular the
**Vocat Research & Evaluation License v1.0** which governs the VoCat main
program.

## Nature of this repository

This is a **private deployment repository**, maintained solely to build and
deploy the software for the maintainer's own authorized, non-commercial
research and hardware development use.

**This repository is NOT a distribution channel.** No binaries, container
images, or source archives produced from it are published for third-party
consumption.

## Material modifications made to the upstream plugin

The following material modifications have been made relative to upstream
`LAODiss/vocat-plugin-sipserver`. This list is maintained in accordance with
the requirement to identify material modifications.

### 1. VoCat integration fixes

- **`vocat-plugin.json`** — Changed all four `contributions[].after` values from
  plugin-local contribution ids to the VoCat built-in menu key `devices`, and
  reordered the `contributions` array. VoCat's sidebar assembly only inserts a
  plugin entry when `after` matches a built-in menu key; the previous values
  caused two of four menu entries to be silently dropped. Also updated
  `label` / `label_zh` display text.
- **`backend/main.go`** — Added `httpListenAddr()`, which reads the
  `VOCAT_PLUGIN_LISTEN` environment variable injected by VoCat. Upstream
  hard-coded the listen address to `:8080`, which conflicted with other
  services and caused a 502 from the VoCat plugin proxy.
- **`frontend/src/api.ts`** — Split the API base into `PROXY_PREFIX`
  (`/api/extensions/vocat-sipserver/backend`) and `BACKEND_API_PREFIX` (`/api`).
  Upstream issued requests to `/api/...`, which resolved against the VoCat main
  program instead of the plugin backend, producing 404/401 responses.
- **`frontend/src/hooks.ts`** — Routed the WebSocket through `PROXY_PREFIX` and
  added error handling to `useCalls`, `useSettings`, and `useDevices`.
- **`frontend/src/main.tsx`** — Replaced `BrowserRouter` with entry-filename
  based component selection. Inside a VoCat plugin iframe the `pathname` is an
  asset path (`/plugin-assets/<id>/index.html`), so client-side routing never
  matched and the page rendered blank.

### 2. Bug fixes

- **`frontend/src/pages/Settings.tsx`** — Moved a render-phase `setFormData`
  call into `useEffect`. The original code could call `setState` during render,
  causing `Too many re-renders` and a blank page whenever the backend returned
  settings identical to the form defaults.
- **`frontend/src/pages/Dashboard.tsx`** — Changed a root-relative link
  (`/call-log`) to a relative one (`call-log.html`). Inside the plugin iframe
  the root-relative form navigated to the VoCat SPA fallback, embedding the
  main application inside the plugin frame. Also removed a duplicate
  `formatDistanceToNow` definition.

## Prohibited downstream use

As the maintainer of this repository, I do not authorize redistribution of this
software or of any artifact built from it. Any party that obtains a copy must
independently comply with the upstream Vocat Research & Evaluation License,
including but not limited to its non-commercial restriction, its geographic
authorization requirement, its evaluation-period term, its SIM/eSIM and
MCC/MNC restrictions, and its prohibition on circumventing technical
safeguards.

If you have obtained this software and cannot satisfy those conditions, you must
not use it.

## Contact

For licensing inquiries, contact the upstream copyright holder.
