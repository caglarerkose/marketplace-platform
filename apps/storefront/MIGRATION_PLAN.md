# Marketplace HTML → Next.js Migration Plan

## Source of truth

`marketplace.html` runtime output and the supplied conversion specification are the visual contract. The legacy file is never served in production. Its final override layers are interpreted as computed-state evidence and consolidated into clean component styles.

## Phases

1. Foundations: Poppins typography, semantic colors, spacing, radius and elevation tokens.
2. App shell: `MarketplaceHeader`, contextual mobile header, `MobileBottomNav`, and `MarketplaceFooter`.
3. Commerce primitives: `ProductCard`, `ProductShelf`, `QuickAccess`, `CategoryCard`, `CategoryToolbar`.
4. Routes: home, categories, category results, product detail, favorites, cart, checkout, account.
5. State: typed catalog mocks followed by favorites, cart, recent products, dialogs and toasts. No DOM mutation or window globals.
6. Integrations: central API/Supabase boundaries; payment and shipment remain provider contracts/TODOs.
7. Parity: desktop 1920 reference, mobile ≤768 reference, wide ≥1400 runtime override; validate spacing, fonts, overflow, sticky/fixed elements and interaction states.
8. Verification: typecheck, production build, route smoke tests and visual comparison. Open gaps remain in `CHECKLIST.md`.

## Rules

- App Router routes replace legacy `switchView` state.
- Server Components are the default; client boundaries exist only for interaction.
- Existing assets live under `public/img` and render through `next/image` where practical.
- One source of truth owns product price, badge, favorite and cart state.
- No inline handlers, MutationObserver patches, HTML rewrites, duplicate mobile/desktop headers, or placeholder artwork.
