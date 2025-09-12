# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HandwerkOS - ModularERP is an E-Rechnung-compliant ERP system for German small businesses (Handwerk, Gastro, Dienstleister). The system implements XRechnung 3.0.1 and ZUGFeRD 2.3 standards with a multi-tenant architecture.

## Architecture

### Monorepo Structure
```
e-rechnung/
├── apps/
│   ├── web/        # Next.js 14 frontend (port 3000)
│   └── api/        # Fastify backend (port 3001)
├── packages/
│   ├── database/   # Prisma schema & client
│   ├── types/      # Shared TypeScript types
│   ├── ui/         # Shadcn/ui components
│   └── utils/      # Shared utilities
```

### Technology Stack
- **Frontend**: Next.js 14 App Router, Shadcn/ui, Tailwind CSS, TanStack Query, React Hook Form + Zod
- **Backend**: Fastify, Prisma ORM, JWT auth, BullMQ, MinIO
- **Database**: PostgreSQL 16 (multi-tenant), Redis 7 (cache/queue)
- **Infrastructure**: Docker Compose, PM2, Nginx

## Development Commands

### Essential Commands
```bash
# Start development
npm run dev              # Frontend + Backend
npm run dev:web          # Frontend only (port 3000)
npm run dev:api          # Backend only (port 3001)

# Database operations
npm run db:generate      # Generate Prisma client
npm run db:push         # Push schema changes
npm run db:migrate      # Run migrations
npm run db:studio       # Open Prisma Studio GUI
npm run db:seed         # Seed test data

# Code quality
npm run build           # Build all workspaces
npm run test            # Run tests
npm run lint            # Lint code
```

### Docker Services
Start services with `docker-compose up`:
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- MinIO: `localhost:9000` (console: 9001)
- Adminer: `localhost:8080`
- Redis Commander: `localhost:8081`
- MailHog: `localhost:8025`

## Database Architecture

### Multi-Tenant Design
- **Schema-per-tenant**: Complete data isolation using PostgreSQL schemas
- **Subdomain routing**: `firma.handwerkos.de` pattern
- **Connection**: Database URLs follow pattern: `postgresql://user:pass@localhost:5432/handwerkos?schema=tenant_[id]`

### Key Models (Prisma)
```prisma
// Core entities in packages/database/prisma/schema.prisma
Tenant        // Company with subscription plan
User          // Authentication & roles
Customer      // Business contacts
Invoice       // E-Rechnung compliant invoices
Quote/Order   // Document workflow
Product       // Catalog management
```

## E-Rechnung Compliance

### Standards Implementation
- **XRechnung 3.0.1**: XML generation in `apps/api/src/services/xml/xrechnung.service.ts`
- **ZUGFeRD 2.3**: Hybrid PDF+XML in `apps/api/src/services/pdf/zugferd.service.ts`
- **Leitweg-ID**: Government invoice routing support
- **Tax Calculation**: Automatic VAT handling with German tax rules

## API Structure

### Authentication Flow
```typescript
// JWT with refresh tokens
POST /api/auth/login     // Returns access + refresh token
POST /api/auth/refresh   // Refresh access token
POST /api/auth/logout    // Invalidate tokens

// Protected routes use Bearer token
Authorization: Bearer <access_token>
```

### Key API Endpoints
```
/api/invoices          // Invoice CRUD + E-Rechnung export
/api/customers         // Customer management
/api/dashboard/stats   // KPI metrics
/api/documents/*       // File uploads/downloads
```

## Frontend Architecture

### Page Structure (Next.js App Router)
```
apps/web/app/
├── (auth)/           # Public auth pages
├── (app)/            # Protected dashboard
│   ├── dashboard/    # Main dashboard
│   ├── invoices/     # Invoice management
│   ├── customers/    # Customer management
│   └── settings/     # User/company settings
```

### Component Patterns
- **UI Components**: Use `@/components/ui/*` from Shadcn
- **Forms**: React Hook Form + Zod validation
- **API Calls**: TanStack Query with `@/lib/api-client`
- **State**: Server state via TanStack Query, local state with React hooks

## Background Jobs

### BullMQ Workers
```typescript
// apps/api/src/workers/
EmailWorker      // Send transactional emails
InvoiceWorker    // Generate PDFs, process E-Rechnung
BackupWorker     // Database backups
```

## Testing

### Test Structure
```bash
# Unit tests (Jest)
npm run test

# E2E tests (Playwright)
npm run test:e2e

# Test single file
npm test -- path/to/file.test.ts
```

## Deployment

### PM2 Process Management
```bash
# Production deployment
pm2 start ecosystem.config.js
pm2 restart handwerkos-api
pm2 logs handwerkos-api
```

### Environment Variables
Key variables in `.env`:
- `DATABASE_URL`: PostgreSQL connection
- `REDIS_URL`: Redis connection
- `JWT_SECRET`: Authentication secret
- `MINIO_*`: S3 storage credentials
- `SMTP_*`: Email configuration

## Feature Flags

Located in `apps/api/src/config/features.ts`:
- `ENABLE_REGISTRATION`: User self-registration
- `ENABLE_EMAIL_VERIFICATION`: Email confirmation
- `ENABLE_2FA`: Two-factor authentication
- `ENABLE_INVOICE_EMAIL`: Email invoice sending
- `ENABLE_XRECHNUNG_EXPORT`: E-Rechnung exports

## Common Development Tasks

### Adding a New API Endpoint
1. Create service in `apps/api/src/services/`
2. Add route in `apps/api/src/routes/`
3. Define types in `packages/types/src/`
4. Update Prisma schema if needed
5. Run `npm run db:generate` after schema changes

### Creating UI Components
1. Use Shadcn CLI: `npx shadcn-ui@latest add [component]`
2. Components go in `apps/web/components/ui/`
3. Use CVA for variant styling
4. Follow existing patterns for consistency

### Multi-Tenant Operations
```typescript
// Always include tenantId in Prisma queries
const data = await prisma.invoice.findMany({
  where: { tenantId: req.user.tenantId }
});
```

## Security Considerations

- **Input Validation**: All API inputs validated with Zod
- **SQL Injection**: Protected via Prisma parameterized queries
- **XSS**: React's automatic escaping + Content Security Policy
- **Rate Limiting**: Configured per endpoint in Fastify
- **File Uploads**: Validated types, size limits, virus scanning planned