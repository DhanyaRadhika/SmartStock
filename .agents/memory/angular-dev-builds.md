---
name: Angular dev builds
description: Workspace-specific Angular 20 builder behavior affecting development builds.
---

Keep the Angular application builder pointed at a dedicated app tsconfig that explicitly includes the browser entrypoint. In this workspace, enabling source maps for the development configuration caused the Angular dev builder to report that the entrypoint was missing even though TypeScript's own include/files program contained it.

**Why:** The production bundle and plain TypeScript check passed while the dev workflow failed, so a future agent could otherwise waste time debugging valid application code.

**How to apply:** If the SmartStock dev workflow reports that `src/main.ts` is missing from compilation, verify the dedicated app tsconfig and development source-map setting before changing application imports or routes.