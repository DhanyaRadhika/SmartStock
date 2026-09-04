# SmartStock Inventory Manager

SmartStock is a full-stack retail inventory and order management system. It gives customers a searchable catalog and a simple cash-on-delivery checkout, while administrators manage products, stock, suppliers, order progress, sales reporting, and reorder recommendations.

## Run locally

```bash
pnpm install
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/smartstock run dev
```

The workspace workflows run both services for preview environments. The web app uses the shared `/api` route for backend requests. The API connects to MongoDB before listening, so `MONGODB_URI` must be available in the server environment.

## Configuration

Copy `.env.example` into your environment or add the values through your platform's secret store. The server reads:

- `MONGODB_URI` for the MongoDB connection string.
- `SESSION_SECRET` for signing the HttpOnly session cookie.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_CALLBACK_URL` for customer Google OAuth.
- `ADMIN_EMAIL` and `ADMIN_PASSWORD_HASH` (Node scrypt format `scrypt$N$r$p$base64Salt$base64Hash`) for the admin account.

The application starts without Google settings and displays “Google Sign-In is not configured yet.” instead of crashing. Admin credentials are never provided with a fallback; configure both variables before using admin login.

## Before publishing to GitHub

- Do NOT commit `.env` or other files containing secrets. This repository now ignores `.env` and provides `.env.example` with placeholders.
- Replace placeholders in `.env.example` with your real values locally and keep the real file out of source control.
- If you previously committed secrets, rotate them (change passwords/keys) before publishing; removing them from git does not invalidate past commits.

### Configure Google OAuth

1. Create or configure a Google OAuth application.
2. Create OAuth credentials for a web application.
3. Add the exact `GOOGLE_CALLBACK_URL` value as an authorized redirect URI.
4. Store the Client ID and Client Secret in your deployment platform's secret store.
5. Set `GOOGLE_CALLBACK_URL` to the public callback URL used by your running app.
6. Restart the application.

The client secret is only read by the backend and is never sent to the browser. Google passwords are not stored. Successful Google users are created as customers and receive an application session.

## Demo navigation

- Open `/` to choose the customer catalog or admin workspace.
- Customer sign-in is available at `/login`; it requires the Google OAuth settings above.
- Admin sign-in is available at `/admin/login` and checks the backend-only admin environment variables.
- Customers can browse products, filter by category, adjust a persistent cart, place a cash-on-delivery order, and view their own orders.
- Admins can manage products, suppliers, stock adjustments, order statuses, reports, low-stock alerts, and reorder recommendations.

## Architecture

The web artifact is an Angular application with a typed REST client. The shared Express API handles validation, signed session cookies, role checks, stock verification, order totals, and business rules. Mongoose models persist users, products, suppliers, orders, inventory adjustments, and sessions in MongoDB. A small seed set is inserted into empty collections to make a fresh development database usable; it is not an in-memory runtime store.

The backend never trusts client-submitted product prices or customer email addresses: it loads products, derives the customer from the session, checks available quantity, calculates line items and totals, then decreases inventory before returning the order.

## Interview talking points

- **Concurrency:** order creation runs inside a MongoDB transaction and atomically decrements each product only when enough stock remains.
- **Security:** customer and admin routes are protected on the server as well as in Angular route guards; session cookies are HttpOnly and signed.
- **Maintainability:** request validation is centralized in shared Zod schemas, while the Angular UI keeps customer and operator workflows route-aware.
- **Operational visibility:** low-stock status, status transitions, sales summaries, best sellers, and reorder recommendations are exposed as separate REST capabilities.
