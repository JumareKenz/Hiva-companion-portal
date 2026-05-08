# HIVA Companion Portal

A production-grade tool for verified government health personnel to review clinical documents, run a 9-step AI compile pipeline, and publish signed `.hiv` bundles to frontline health workers across Nigeria.

## Prerequisites

- Node.js 20+ (LTS recommended)
- npm 10+
- Backend API running at `http://localhost:8700` (or configure `NEXT_PUBLIC_API_URL`)

## Setup

```bash
# Install dependencies
npm install

# Copy environment template and configure
 cp .env.local.example .env.local
# Edit .env.local with your backend URL
```

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the HIVA backend API | `http://localhost:8700` |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL for job streaming | `ws://localhost:8700` |
| `NEXT_PUBLIC_APP_VERSION` | Display version string | `2.0.4` |

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm start
```

## Type Checking

```bash
npm run typecheck
```

## Testing

```bash
npm test
```

## Auth Model

- **Bearer JWT** stored in Zustand + `sessionStorage` (never `localStorage`)
- Token expiry checked client-side via `exp` claim
- Two roles: `reviewer` (review/approve blocks) and `admin` (compile, download, delete, activate)
- On 401: token cleared, redirected to `/login`
- WebSocket auth via query param `?token=`

## Keyboard Shortcuts (Document Review)

| Key | Action |
|---|---|
| `A` | Approve focused block |
| `F` | Flag focused block |
| `Tab` | Next block |
| `Shift + Tab` | Previous block |
| `←` | Previous PDF page |
| `→` | Next PDF page |

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5 (strict mode)
- **Styling**: Tailwind CSS 3.4 + custom design tokens
- **State**: Zustand (auth) + TanStack Query (server state)
- **Forms**: React Hook Form + Zod
- **PDF**: react-pdf (lazy-loaded)
- **Icons**: lucide-react
- **Toasts**: sonner

## Known Limitations

- **Team page**: No `/api/users` endpoint exists; team management is UI-only stub
- **Audit Log**: UI shell ready; backend endpoint not yet available
- **Deployments**: UI shell with proxy data from releases; full deployment pipeline in development
- **Hardware key sign-in**: UI placeholder only; backend integration pending

## Design System

This project uses a deliberate, craft-oriented design system with:
- **Fonts**: Space Grotesk (display), Plus Jakarta Sans (body), JetBrains Mono (mono)
- **Colors**: Warm stone neutrals + deep teal accent (`#155D46`)
- **Elevation**: Background shifts + borders + subtle shadows (never heavy drop shadows)
- **Motion**: Expo easing (`cubic-bezier(0.16, 1, 0.3, 1)`) for snappy, modern feel
- **Dark mode**: `data-theme` attribute with full CSS custom property swap

## Project Structure

```
app/                 # Next.js App Router pages
components/          # Shared UI components (ui/, layout/, guards/)
features/            # Domain-specific modules (auth, documents, blocks, jobs, releases, chunks)
hooks/               # Cross-cutting hooks (useTheme, usePermissions)
lib/                 # Utilities (auth, theme, queryClient, utils)
services/            # API service layer (NO raw fetch in components)
stores/              # Zustand stores (auth)
types/               # TypeScript types and enums
```
