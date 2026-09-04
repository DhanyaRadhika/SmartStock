---
name: Artifact API previews
description: Preview behavior for the registered SmartStock API artifact.
---

An API artifact can be preview-checked at its server root even when its declared routed path is `/api`. A healthy API should therefore return a small informational response from both `/` and `/api`, while retaining `/api/healthz` for health checks.

**Why:** The API server was healthy and its Angular frontend was healthy, but the preview reported 404 because the checker requested the API root, which had no route.

**How to apply:** When diagnosing a SmartStock preview 404, distinguish the web artifact from the API artifact and test `/`, `/api`, and `/api/healthz` separately before changing frontend routing.