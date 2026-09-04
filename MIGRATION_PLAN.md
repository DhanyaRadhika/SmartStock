# SmartStock Angular + MongoDB Migration Plan

## Goal

Preserve the existing SmartStock retail workflows while moving the production
architecture to:

```text
Angular + TypeScript + Angular Router + Reactive Forms + HttpClient
                                ↓
                        Express REST API
                                ↓
                         MongoDB + Mongoose
```

React and the process-local seeded store will not remain in the final
production path.

## Current-state inventory

### Backend

The Express API is mounted at `/api` and currently implements:

- `GET /healthz`
- Authentication: `GET /auth/session`, `GET /auth/google`,
  `GET /auth/google/callback`, `POST /auth/admin/login`, and
  `POST /auth/logout`
- Public catalog: `GET /products`, `GET /products/:id`
- Admin catalog CRUD: `POST /products`, `PUT /products/:id`,
  `DELETE /products/:id`
- Orders: `GET /orders`, public `POST /orders`, `GET /orders/:id`, and
  admin `PUT /orders/:id/status`
- Admin suppliers: `GET /suppliers`, `POST /suppliers`, `PUT /suppliers/:id`,
  `DELETE /suppliers/:id`
- Inventory: `GET /inventory`, `PUT /inventory/:id`,
  `GET /inventory/low-stock`
- Reports: `GET /reports/summary`, `/reports/bestsellers`,
  `/reports/category-sales`, and `/reports/reorder`

The current store models users, suppliers, products, orders, order items, and
inventory adjustments. Checkout aggregates duplicate cart lines, re-reads
product-owned prices, validates stock, snapshots order items, decrements stock,
and creates a pending cash-on-delivery order. Stock status is derived from
`quantity === 0` and `quantity <= minimumStock`; reorder guidance uses four
weeks of observed sales. Order statuses cannot move backwards, delivered
orders cannot change, and cancelled orders remain terminal.

### Frontend

The React client currently provides:

- Public home/marketing page and sign-in entry
- Customer product catalog with search, category filtering, sorting, product
  detail, local cart, quantity controls, checkout, and order history/detail
- Admin sign-in, dashboard, product list/create/edit/delete, inventory
  adjustments, supplier CRUD, order list/detail/status changes, reports,
  bestsellers, category sales, low-stock and reorder recommendations
- Customer/admin route protection based on the session endpoint
- Same-origin `/api` calls and session-cookie authentication

### Authentication

The code currently mixes custom signed-looking process-local session IDs,
Google OAuth helpers, admin credential login, and a partial Clerk bridge.
The migration will keep Google OAuth as the canonical customer sign-in path
and store users/sessions persistently in MongoDB. Admin credentials will be
server-only, hashed, and compared in constant time. Clerk-specific code will
not be used by the Angular app unless it is explicitly made the canonical
provider in a later decision.

## Safe implementation phases

1. **Mongo foundation:** add Mongoose, connection lifecycle, schema models,
   indexes, validation, seed-on-empty behavior, and a repository/service layer.
   Keep the existing store only as a temporary seed source during this phase.
2. **REST persistence migration:** move each route group from arrays to
   Mongoose queries. Preserve endpoint paths, payloads, status codes, response
   envelopes, stock rules, authorization, and order transition rules.
   Implement an atomic conditional stock decrement/transaction for checkout.
3. **Authentication cleanup:** persist users and sessions, remove the
   process-local session map and fallback credentials, keep Google OAuth
   redirects/callback behavior, and ensure all cookie mutations have secure
   same-origin protections. Update OpenAPI auth documentation.
4. **Angular application shell:** create the Angular standalone app with
   Router, HttpClient, Reactive Forms, route guards, API services, shared
   types, and the existing SmartStock visual language. Keep the React app
   available only as a temporary migration reference.
5. **Angular customer workflows:** port home, catalog, product detail, cart,
   checkout, order history, and order detail. Preserve local cart behavior,
   guest checkout, authenticated history, loading/error/empty states, and
   real API response handling.
6. **Angular admin workflows:** port dashboard, catalog CRUD, inventory,
   suppliers, order operations, reports, bestsellers, and reorder guidance.
7. **Cutover and cleanup:** make Angular the registered SmartStock artifact,
   remove React from the final frontend package, remove the in-memory store
   from runtime code, retire unused PostgreSQL/Drizzle paths, update docs and
   environment examples, and keep Express as the API service.
8. **Verification:** run API contract tests, checkout/stock regression tests,
   customer and admin workflow tests, Mongo-backed startup tests, Angular
   typecheck/build, API build, deep-link checks, and workflow smoke tests.

## Acceptance criteria

- No React runtime, React routes, or React Query remains in the final
  SmartStock frontend artifact.
- No in-memory array or process-local session is used as the production data
  or auth layer.
- MongoDB/Mongoose is required and documented through `MONGODB_URI`.
- All existing customer and admin features listed above remain available.
- REST paths and business rules remain compatible with the current contract.
- Checkout cannot oversell stock under concurrent requests.
- Angular uses `HttpClient` with same-origin credentials and guards protected
  routes using the server session.
- API and Angular build/typecheck commands pass, and the app starts through the
  configured preview workflows.
