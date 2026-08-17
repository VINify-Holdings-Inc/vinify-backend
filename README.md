# VINify Backend

The API backend for [VINify](https://app.getvinify.com) — a vehicle title and VIN (Vehicle Identification Number) data verification service. It validates vehicle title data against AAMVA's NMVTIS (National Motor Vehicle Title Information System), manages the resulting dashboard/alerts data, and handles user accounts for the frontend at `app.getvinify.com`.

## What it does

- **VIN / title validation** — authenticates against AAMVA's SOAP API and validates vehicle title data against NMVTIS.
- **NMVTIS file exchange** — generates and uploads VIN request files, and reads back title/brand/JSI response files, via scheduled FTP jobs against AAMVA's servers.
- **Dashboard & alerts** — VIN summary data, new-alert and unread-notification feeds, title-history comparisons, and PDF/CSV export for the frontend dashboard.
- **User accounts** — registration/login (bcrypt-hashed, with a self-migrating upgrade path from a legacy plaintext scheme), password reset, profile management, and self-service account closure with a 90-day data-retention grace period before hard deletion.
- **Contact form** submissions.

## Stack

- Node.js / Express / TypeScript, run via `ts-node` under PM2 (no build step in production — see `deploy/`)
- PostgreSQL via TypeORM (Active Record pattern), behind RDS Proxy in production
- Jest for testing, ESLint for linting
- Swagger UI at `/api-doc`

## Local development

```bash
npm install
npm run dev              # nodemon, ts-node
npm test                 # Jest
npm run lint             # ESLint (npm run format to auto-fix)
```

Requires a `.env` — see `src/index.ts` / `src/DbConfig/TypeOrm.ts` for the variables it expects (DB connection, JWT secret, SOAP/FTP credentials for the AAMVA integration, SMTP for outbound email).

### Database migrations

```bash
npm run migration:generate   # generate from entity changes
npm run migration:run
npm run migration:revert
```

## Deployment

Merging to `main` triggers a GitHub Actions workflow that deploys to production via AWS SSM, using an atomic-release pattern (fresh release directory per deploy, symlink cutover, automated health check with automatic rollback on failure). See `deploy/remote-deploy.sh` and `deploy/asg-bootstrap.sh`.

## Compliance & operations documentation

The `docs/` directory is the real, actively-maintained record of how this system is actually built, secured, and operated — not aspirational documentation. Start with whichever is relevant:

- [`AWS-Security-Setup-Guide.md`](docs/AWS-Security-Setup-Guide.md) — IAM, network, encryption, logging
- [`architecture-diagram.md`](docs/architecture-diagram.md) — network architecture and traffic flow
- [`SDLC-Policy.md`](docs/SDLC-Policy.md) — development lifecycle, testing, DAST
- [`Change-Management-Policy.md`](docs/Change-Management-Policy.md) — how changes reach production, patch management, incident escalation
- [`Business-Continuity-and-Recovery-Policy.md`](docs/Business-Continuity-and-Recovery-Policy.md) — recovery mechanisms, tested RTO/RPO, exit strategy
- [`Data-Governance-and-Classification-Policy.md`](docs/Data-Governance-and-Classification-Policy.md) and [`Data-Retention-Policy.md`](docs/Data-Retention-Policy.md) — what data is held, how it's classified, how long it's kept
- [`Key-Management-Policy.md`](docs/Key-Management-Policy.md) — KMS key inventory and lifecycle procedures
