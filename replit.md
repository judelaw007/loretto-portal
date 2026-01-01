# Loretto School Portal

## Overview

A modular school management portal for Loretto School of Childhood, Nigeria. The system serves four user roles: Super Admin (full system control), Admin (staff like teachers, accountants, registrars), Parent (unified dashboard for all children), and Student (individual academic portal). The architecture centers around a dynamic app system where Super Admins can create and assign modular applications to specific roles, admin types, or class levels.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript with strict mode
- **Styling**: CSS Modules with CSS Variables (no external UI library)
- **Icons**: Custom SVG icon components in `src/components/icons.tsx`
- **Path Aliases**: `@/*` maps to `./src/*`

### Backend Architecture
- **API Routes**: Next.js API routes in `src/app/api/`
- **Authentication**: JWT-based with HTTP-only cookies (`loretto_session`)
- **Password Hashing**: bcryptjs with 12 rounds
- **Session Management**: Database-stored sessions with 7-day expiry

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL
- **Schema**: Defined in `src/lib/schema.ts` using pgTable and pgEnum
- **Connection**: `src/lib/db.ts` using postgres.js driver
- **Migrations**: Drizzle Kit for schema management (`db:generate`, `db:push`, `db:migrate`)

### Key Database Tables
- `users` - All user types with role-specific fields (adminType, classLevel, etc.)
- `sessions` - JWT session storage
- `apps` - Modular application definitions
- `appPermissions` - Role/user app access control
- `announcements`, `feeStructures`, `feePayments`, `parentChildren`

### Role-Based Access Control
- Super Admin: Full access, manages apps and permissions
- Admin: Access based on adminType (teacher, accountant, registrar, principal, general)
- Parent/Student: Access to client-facing apps only

### Route Structure
- `/` - Public landing page
- `/login`, `/register`, `/forgot-password` - Auth flows
- `/dashboard` - Parent/Student dashboard
- `/admin` - Admin staff dashboard
- `/super-admin` - Super Admin dashboard with user/app/permission management

### Data Operations
- `src/lib/database.ts` - Database operations layer (Users, Sessions, Apps, AppPermissions, etc.)
- `src/lib/auth.ts` - Authentication utilities (password hashing, JWT, sessions)

## External Dependencies

### Database
- **PostgreSQL**: Primary database (connection via `DATABASE_URL` environment variable)
- **Drizzle ORM**: Database toolkit for TypeScript

### Authentication
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT token generation and verification

### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT signing (defaults to development value if not set)

### Development Tools
- **Drizzle Kit**: Database migration and studio tools
- **ts-node**: TypeScript execution for scripts

### Runtime
- Server runs on port 5000 (`-H 0.0.0.0 -p 5000`)
- Node.js 18+ required