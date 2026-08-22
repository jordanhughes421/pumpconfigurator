# Render Deployment

Magnum Opus is deployed as three Render resources managed by the root `render.yaml` Blueprint:

- `jordanhughes-pumpconfigurator-web` — React/Vite static site
- `jordanhughes-pumpconfigurator-api` — Express/Prisma Node.js web service
- `pumpconfigurator-db` — PostgreSQL 16 database

## Deploy

1. In Render, create a new Blueprint and connect `jordanhughes421/pumpconfigurator`.
2. Use the repository-root `render.yaml` when prompted.
3. Review the three resources and deploy the Blueprint.
4. Wait for the database, API, and frontend deployments to complete.
5. Verify the API health endpoint at `/api/health` and then load the frontend.

The API's `DATABASE_URL` is populated automatically from the Render Postgres connection string. The API uses Render's `PORT` variable in production and falls back to `API_PORT=3001` locally.

## CORS and public URLs

The Blueprint configures the default Render URLs:

- Frontend: `https://jordanhughes-pumpconfigurator-web.onrender.com`
- API: `https://jordanhughes-pumpconfigurator-api.onrender.com`

The frontend receives the API URL through `VITE_API_URL` at build time. The API accepts browser requests from `WEB_ORIGIN`. `WEB_ORIGIN` also supports a comma-separated allowlist if multiple frontend origins are needed.

If Render assigns different service hostnames, or after adding custom domains, update both variables in `render.yaml` (or in the Render dashboard) so that they match the deployed public URLs.

For example, with custom domains:

```text
VITE_API_URL=https://api.configure.example.com
WEB_ORIGIN=https://configure.example.com
```

## Database migrations

Production schema migrations run before each API deployment with:

```bash
pnpm --filter @magnum-opus/api exec prisma migrate deploy
```

Do not use `prisma migrate dev` in production.

## Seed data

The repository seed data is sample/demo data. It is intentionally not run automatically by the Blueprint.

For a non-production demo environment, seed once after the database is provisioned:

```bash
pnpm --filter @magnum-opus/api seed
```

Do not configure the production deployment to reseed on each deploy.

## Local development

Root API/database settings are documented in `.env.example`. The frontend API URL is documented in `apps/web/.env.example`.

Local defaults remain:

- API: `http://localhost:3001`
- Frontend: `http://localhost:5173`
- PostgreSQL: `localhost:5432`
