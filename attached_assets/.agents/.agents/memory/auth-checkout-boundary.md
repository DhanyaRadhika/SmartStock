---
name: Authentication and checkout boundary
description: The deliberate access split between public shopping, guest checkout, customer history, and admin operations.
---

Catalog browsing and checkout remain available when Google OAuth is not configured, preserving a usable demo and the original no-account shopping path. Customer order history is session-protected, and all admin operations require an authenticated admin session.

**Why:** Google credentials are optional in development, but the storefront should still demonstrate real inventory, cart, checkout, and stock validation instead of failing closed at the first screen.

**How to apply:** Keep Google OAuth as the real customer sign-in path when configured. Do not expose customer order history or admin data to unauthenticated requests; guest orders can be placed with validated checkout details.