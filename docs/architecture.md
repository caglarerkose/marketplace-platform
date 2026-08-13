# Architecture and migration plan

## Current-state inventory (2026-08-13)

The repository began as three standalone demos and no build system. The original files remain untouched as migration references:

- `marketplace.html` (772 KB): home, categories, category results, product detail, favorites, cart, checkout, and account. Search, campaign shelves, banners, product cards, address/payment panels, order history, responsive mobile headers, and empty states are embedded in one document.
- `seller.html` (282 KB): application/login, dashboard, orders/shipping, products/import, stock, campaigns, finance/settlements, reports, reviews/questions, messages, settings, announcements, documents, integrations, shipping, instalments, ranking, showcase, templates, profile, and notifications.
- `admin.html` (307 KB): overview, sellers/applications, customers, product approvals/imports, categories, orders, campaigns, commissions/settlements, support/moderation, reports, documents, settings, homepage/banner/menu/footer/SEO/mobile configuration, ads/ranking, instalments, announcements, and logs.

The demos use view/section toggling rather than routes. They contain respectively 31/9/9 style blocks, 37/10/14 script blocks, 93/153/243 inline click handlers, and 0/0/0 API calls. Seller/admin contain 14/29 rendered tables. Cross-panel behavior is simulated with `localStorage`; most forms are drawer markup without semantic `<form>` elements or schema validation. Data, presentation, persistence, and navigation are tightly coupled in global scripts.

Reusable visual families are header/search/category navigation, sidebar/topbar, page header/actions, cards/KPIs, product cards, data tables, status pills, tabs/filters, drawers/modals, toast/empty/loading states, pagination, form fields, charts, order steppers, media upload, and confirmation dialogs. Brand-specific layout compositions remain app-local; only stable primitives and tokens move to `packages/ui`.

## Target architecture

The repository is a pnpm/Turborepo monorepo. Each web surface is independently deployable and uses Next.js App Router. `packages/ui` contains visual primitives only; feature components stay within their owning application. `packages/types` contains transport-safe TypeScript contracts, `packages/api-client` owns HTTP behavior, and `packages/utils` holds framework-independent helpers.

The backend is a Spring Boot modular monolith. Each business module owns its application, domain, and infrastructure code. Modules communicate through explicit application services/domain events rather than reaching into another module's repositories. Entities never cross the REST boundary; controllers expose DTOs.

Identity comes exclusively from the authenticated principal. Seller endpoints derive seller/store scope server-side. Admin mutations create append-only audit records. PostgreSQL is authoritative; Redis supports refresh-token/session metadata, rate limiting, and short-lived caching.

## Backend module boundaries

- Identity: auth, users, customers, sellers, seller-applications, stores
- Catalog: products, variants, categories, brands, attributes, media
- Commerce: carts, favorites, addresses, orders, order-items, coupons, campaigns
- Fulfilment: inventory, warehouses, shipments
- Finance: payments, refunds, commissions, settlements
- Trust: reviews, questions, notifications, moderation, audit

## Data model draft

- `users` -> roles and optional customer/seller memberships; refresh tokens are hashed and rotatable.
- `sellers` -> `stores`; seller staff membership records store role/scope.
- `products` belong to store, brand, and leaf category; lifecycle is draft/pending/active/rejected/archived.
- `product_variants` own SKU/barcode; variant attribute values form the sellable option combination.
- `prices` are currency-aware and time-bound; `inventory` is per variant/warehouse with `version` for optimistic locking.
- `inventory_transactions` append adjustments, reservations, releases, and sales.
- `orders` are customer-facing parents; `seller_orders` split fulfilment/finance by store; `order_items` snapshot product, variant, tax, commission, and price data.
- `payments` and `shipments` reference provider-neutral status and external identifiers. Provider adapters implement ports; card data is never persisted.
- `settlements` aggregate payable seller-order lines, commissions, refunds, and adjustments.
- `audit_logs` store actor, action, target, timestamp, request correlation ID, and redacted before/after metadata.

Database constraints enforce unique SKUs/barcodes where applicable, non-negative money/stock, immutable order snapshots, and ownership relations. Foreign keys and indexes are added around search, status, ownership, and date-based access paths. Relationships default to lazy loading; read APIs use projections/entity graphs deliberately.

## Marketplace gaps to validate against demos

The requirements demand authentication, authorization, catalog variants, seller isolation, inventory reservations, multi-vendor checkout/order splitting, payment/shipment ports, returns/refunds, settlement, moderation, audit, secure uploads, search, SEO, rate limiting, and operational states. These are assumed absent from static demos until inspection proves otherwise.

## Migration sequence

1. Preserve each source HTML and its assets as immutable migration references.
2. Inventory pages, responsive breakpoints, tokens, repeated regions, forms, tables, inline scripts, and mock datasets.
3. Extract design tokens and accessible primitives into `packages/ui`; record screenshot baselines.
4. Convert storefront routes and typed mocks, then seller routes, then admin routes.
5. Establish backend modules, migrations, error envelope, security, logging, and test containers.
6. Implement auth, catalog, seller/store, inventory reservation, cart, and transactional order splitting.
7. Add payment, shipment, admin, and seller APIs; replace mocks feature-by-feature through the shared client.
8. Add unit/integration/E2E coverage, Docker images, observability, security checks, and deployment documentation.

Every converted page must pass responsive visual comparison, keyboard/accessibility checks, strict type checking, and its relevant tests before the mock is removed.
