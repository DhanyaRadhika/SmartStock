---
name: Preview hostnames
description: Angular dev-server host validation for proxied preview environments.
---

For the SmartStock Angular development server, binding to `0.0.0.0` alone does not guarantee that a changing preview hostname from a hosting provider is accepted. Angular’s `--disable-host-check` option can permit a proxied preview host in this environment.

**Why:** A literal `--allowed-hosts all` value may still be treated as a hostname by some dev servers and return 403; a dev-only host-check bypass allows the proxied preview hostname and preserves a working preview.

**How to apply:** If the preview shows Vite’s “host is not allowed” message, verify the current Angular CLI behavior and keep the dev-only host validation setting aligned with your preview proxy; do not add one ephemeral UUID hostname.
