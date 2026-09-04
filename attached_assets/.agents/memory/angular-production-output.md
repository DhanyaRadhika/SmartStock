---
name: Angular production output
description: Static deployment path for the SmartStock Angular application build.
---

The SmartStock Angular application builder emits the deployable `index.html` and browser assets in a `browser` subdirectory beneath the configured output path. Static hosting must point at that browser directory, not its parent.

**Why:** The local development server worked while the published root returned 404 because the deployment public directory contained no root `index.html`.

**How to apply:** When changing the Angular output path or deployment artifact settings, inspect the built directory and confirm the configured static `publicDir` contains `index.html` directly.