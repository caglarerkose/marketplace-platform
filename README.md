# Marketplace Platform

Production-oriented C2C / multi-vendor marketplace monorepo. The three legacy HTML demos will be migrated into the frontend applications without redesigning their visual language.

## Applications

- `apps/storefront`: customer-facing Next.js application
- `apps/seller-panel`: seller and seller-staff Next.js application
- `apps/admin-panel`: admin and super-admin Next.js application
- `backend`: Java 21 / Spring Boot modular monolith
- `packages/*`: shared UI, types, utilities, and API client

## Local prerequisites

- Node.js 22+
- pnpm 10+
- Java 21
- Docker Desktop

Copy `.env.example` to `.env` for local infrastructure. Never commit the resulting file.

```powershell
pnpm install
pnpm dev
docker compose up -d postgres redis
```

Architecture and migration decisions are recorded in [docs/architecture.md](docs/architecture.md).
