# HIVA Companion Portal

> **The operational command center for HIVALINE** — where health personnel transform raw clinical guidelines into structured, cryptographically signed `.hiv` bundles deployed to frontline health workers across Nigeria, and where AI assistants are configured and deployed for patient-facing conversations.

---

## What is this?

The HIVA Companion Portal is a production-grade web application used by verified government health personnel to manage the entire lifecycle of clinical content — from raw PDF/DOCX upload through AI processing, review, and release to field devices. It spans two product lines:

### 1. HIVALINE Compiler
A document review and bundle compilation tool for the HIVALINE offline mobile app. Field workers in areas with limited connectivity rely on `.hiv` bundles to access clinical decision support. The portal enables:
- Uploading and reviewing clinical source documents
- A 9-step AI processing pipeline (chunk → deduplicate → LLM process → tone pass → rule compile → translate → validate → package → sign)
- Cryptographically signed bundle releases with SHA-256 verification
- Access code management for field device authentication

### 2. Live Chatbots
An RAG assistant builder for online deployment via web embed and WhatsApp. Health personnel can:
- Create and configure AI assistants with custom system prompts, tone settings, and knowledge bases
- Manage assistant channels (web embed, WhatsApp)
- Monitor conversations, satisfaction rates, and top queries via analytics

---

## Architecture

### Dual-Backend Design

The portal proxies to two backend services to maintain clean separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    HIVA Companion Portal                     │
│                     (Next.js 14 App Router)                  │
│                                                              │
│  /api/*           →  compiler.hiva.chat (port 8700)          │
│  /api/v1/*        →  api.hiva.chat (port 8400)               │
└─────────────────────────────────────────────────────────────┘
```

| Backend | Port | Purpose | Auth |
|---|---|---|---|
| `compiler.hiva.chat` | 8700 | Document upload, block review, job compile, bundles, access codes | Compiler JWT |
| `api.hiva.chat` | 8400 | Chatbot CRUD, analytics, agency management | Platform JWT |

Token exchange: on login, the portal authenticates against the platform API and immediately exchanges the platform token for a compiler token via `POST /auth/exchange`.

### Frontend Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14.2+ (App Router, Server Components) |
| Language | TypeScript 5 (strict mode, no `any`) |
| Styling | Tailwind CSS 3.4 + CSS custom properties design system |
| UI Components | shadcn/ui + custom design tokens |
| Server State | TanStack Query v5 (staleTime-aware, mutation invalidation) |
| Client State | Zustand v4 (auth store only, sessionStorage-persisted) |
| Forms | React Hook Form v7 + Zod v3 |
| PDF Rendering | react-pdf (lazy-loaded via `next/dynamic`, SSR disabled) |
| Icons | lucide-react |
| Notifications | sonner (toast) |
| Fonts | Space Grotesk · Plus Jakarta Sans · JetBrains Mono |

---

## Features

### HIVALINE Compiler

#### Document Queue
- Upload PDF/DOCX files with XHR progress tracking
- Filter by status: pending review, in review, ready to compile, compiling, compiled, failed
- Uploaded files are automatically queued for block extraction

#### Document Review
- Side-by-side PDF viewer + block list
- Per-block review: approve, flag, add reviewer notes
- Block types: paragraph, heading, table, image placeholder
- Confidence score indicator per block
- Keyboard shortcuts: `A` approve, `F` flag, `Tab` next block, `Shift+Tab` prev
- Inline content editing with `structured_content: { text }` patch
- Reprocess individual blocks through the LLM pipeline

#### Compile Pipeline
- 9-step progression with real-time WebSocket log streaming
- Steps: chunk → deduplicate → process → tone → rule_compile → translate → validate → package → sign
- Step tracker visualization with color-coded status
- Progress percentage per step (5–100%)
- Terminal-style log panel with log level icons (info/warn/error)
- Terminal events detect completion via `data.type === 'complete' | 'error'` (not `data.step`)

#### Compiled Bundles
- Release table with version, SHA-256, size, language count, chunk count
- Active release hero card with instant download
- Version activation (compile auto-activates, manual override available)
- SHA-256 and Ed25519 signature for bundle integrity

#### Access Codes
- Create shareable codes (`HIVA-XXXX`) for field device authentication
- Configure max users (null = unlimited) and optional expiry dates
- Inline row editing (name, limit, expiry, notes)
- One-click revoke with confirmation
- Stats cards: active codes, total users, used today
- Admin-only (hidden from `reviewer` role)

### Live Chatbots

#### Assistants
- Create assistants with system prompt, welcome message, brand color
- Configure tone (formality, verbosity, empathy), confidence thresholds, domain strictness
- Multi-language: primary + secondary languages (en, ha, yo, ig, pcm)
- Toggle channels: web embed, WhatsApp
- Status management: draft, active, paused, archived

#### Embed & Share
- Script tag + iframe code generation
- Direct URL sharing

#### Analytics
- Total conversations and messages
- Average conversation length
- Satisfaction rate
- Top queries
- Daily stats trend

### Platform-Wide

- Role-based access: `admin` (full) vs `reviewer` (read + review)
- Dual-theme: light + dark mode with `data-theme` attribute
- Warm stone neutral palette with deep teal accent (`#155D46`)
- Subtle noise texture on backgrounds, ambient glow on active elements
- 8pt grid spacing, intentional border radius variation
- Expo easing (`cubic-bezier(0.16, 1, 0.3, 1)`) motion throughout
- Session-persisted auth tokens (never `localStorage`)

---

## Getting Started

### Prerequisites

- Node.js 20+ (LTS recommended)
- npm 10+
- Access to `compiler.hiva.chat` (port 8700) and `api.hiva.chat` (port 8400) backends

### Installation

```bash
# Clone the repository
git clone https://github.com/JumareKenz/Hiva-companion-portal.git
cd Hiva-companion-portal

# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env.local

# Edit .env.local with your backend URLs
# NEXT_PUBLIC_API_URL=http://localhost:8700  (compiler backend — local dev fallback)
```

### Development

```bash
npm run dev
# Open http://localhost:3000
```

### Production Build

```bash
npm run build
npm start
```

### Type Checking

```bash
npm run typecheck   # npx tsc --noEmit
```

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Compiler backend URL | `http://localhost:8700` |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL for job streaming | `ws://localhost:8700` |
| `NEXT_PUBLIC_APP_VERSION` | Display version string | `2.0.4` |

> **Note:** `NEXT_PUBLIC_` variables are inlined at dev server startup. Restart `npm run dev` after changing them.

---

## API Endpoints

### Compiler API (`/api/*` → compiler.hiva.chat:8700)

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/login` | Form-urlencoded login, returns JWT |
| `POST` | `/auth/exchange` | Exchange platform token for compiler token |
| `GET` | `/auth/me` | Current user info |
| `POST` | `/auth/logout` | Invalidate session |
| `POST` | `/auth/refresh` | Refresh JWT |
| `GET` | `/documents` | List documents (paginated) |
| `POST` | `/documents/upload` | Upload PDF/DOCX with XHR progress |
| `GET` | `/documents/:id` | Single document |
| `POST` | `/documents/:id/ready` | Mark document ready to compile |
| `DELETE` | `/documents/:id` | Delete document |
| `GET` | `/documents/:id/blocks` | List blocks |
| `PATCH` | `/blocks/:id` | Update block (status, notes, content) |
| `POST` | `/blocks/:id/reprocess` | Reprocess block through LLM |
| `GET` | `/jobs` | List compile jobs (paginated) |
| `GET` | `/jobs/:id` | Single job status |
| `GET` | `/jobs/:id/download` | Download compiled `.hiv` bundle |
| `POST` | `/jobs/:id/retry` | Retry failed job |
| `GET` | `/releases` | List compiled releases (paginated) |
| `POST` | `/releases/:id/activate` | Activate a release |
| `GET` | `/chunks` | List chunk library (paginated) |
| `GET` | `/chunks/stats` | Chunk statistics |
| `GET` | `/hiv/version` | Current active version (device polling) |
| `GET` | `/hiv/download` | Download active `.hiv` bundle |
| `POST` | `/hiv/error-report` | Send field error report |
| `GET` | `/health` | Backend health check |
| `GET` | `/access-codes` | List access codes (paginated) |
| `POST` | `/access-codes` | Create new access code |
| `PATCH` | `/access-codes/:id` | Update access code |
| `DELETE` | `/access-codes/:id` | Revoke access code |

### Platform API (`/api/v1/*` → api.hiva.chat:8400)

| Method | Path | Description |
|---|---|---|
| `GET` | `/agency/chatbots` | List chatbots (paginated) |
| `POST` | `/agency/chatbots` | Create chatbot |
| `GET` | `/agency/chatbots/:id` | Single chatbot |
| `PATCH` | `/agency/chatbots/:id` | Update chatbot settings |
| `DELETE` | `/agency/chatbots/:id` | Archive chatbot |
| `POST` | `/agency/chatbots/:id/activate` | Activate chatbot |
| `POST` | `/agency/chatbots/:id/pause` | Pause chatbot |
| `POST` | `/agency/chatbots/:id/embed-code` | Generate embed codes |
| `GET` | `/agency/chatbots/:id/documents` | List chatbot documents |
| `POST` | `/agency/chatbots/:id/documents` | Upload document to chatbot |
| `DELETE` | `/agency/chatbots/:id/documents/:docId` | Remove chatbot document |
| `GET` | `/agency/chatbots/:id/stats` | Chatbot analytics |

---

## Project Structure

```
hiva-compiler-frontend/
├── app/                          # Next.js App Router pages
│   ├── (app)/                    # Authenticated shell
│   │   ├── layout.tsx            # Sidebar + Topbar + AuthGuard
│   │   ├── page.tsx              # Dashboard
│   │   ├── documents/            # Document queue + review
│   │   ├── jobs/[id]/            # Compile job detail + live log stream
│   │   ├── bundles/              # Release management + download
│   │   ├── access-codes/         # Access code management (admin)
│   │   ├── sources/              # Chunk library browser
│   │   ├── assistants/           # Chatbot builder + embed
│   │   ├── deployments/          # Channel deployment (stub)
│   │   ├── audit/                # Audit log (stub)
│   │   └── settings/            # Account + workspace settings
│   ├── (auth)/                   # Unauthenticated shell
│   │   └── login/               # Login page
│   ├── layout.tsx                # Root: Google Fonts, theme script, Sonner
│   └── globals.css              # Tailwind + CSS custom properties
├── components/
│   ├── ui/                       # Atomic: StatusBadge, Avatar, StatCard, Pagination,
│   │                             #   SkeletonLoader, EmptyState, ConfidenceBar, FileTypeBadge,
│   │                             #   Logo, LogoAnimated, LogoBackground
│   ├── layout/                   # Sidebar, Topbar
│   ├── pdf/                      # PDFViewer (lazy-loaded, SSR disabled)
│   └── guards/                   # AdminOnly
├── features/                     # Domain modules (hooks + co-located components)
│   ├── auth/                     # AuthGuard, useAuth hook
│   ├── documents/                # UploadModal, CompileModal, useDocuments
│   ├── blocks/                   # BlockCard, useBlockActions
│   ├── jobs/                     # StepTracker, LogStream, useJobStream
│   ├── releases/                 # useReleases, useActivateRelease
│   ├── chunks/                   # useChunks
│   └── assistants/              # useAssistants
├── hooks/                        # Cross-cutting: useTheme, usePermissions, useDebounce
├── lib/                          # auth.ts (dual-token), queryClient.ts, theme.ts, utils.ts
├── services/                     # API layer — NO raw fetch in components
│   ├── compilerHttp.ts           # ApiClient for compiler backend (port 8700)
│   ├── platformHttp.ts          # ApiClient for platform backend (port 8400)
│   ├── auth.service.ts           # Login, logout, me, refresh
│   ├── documents.service.ts      # Upload, list, get, ready, delete
│   ├── blocks.service.ts         # List, patch, reprocess
│   ├── jobs.service.ts           # List, get, download, retry, failed
│   ├── releases.service.ts       # List, activate
│   ├── chunks.service.ts         # List, stats
│   ├── hiv.service.ts            # Version, download, error-report
│   ├── health.service.ts         # Health check
│   ├── accessCodes.service.ts    # List, create, update, revoke
│   ├── chatbots.service.ts       # CRUD + status management
│   ├── chatbotDocuments.service.ts
│   └── chatbotAnalytics.service.ts
├── stores/
│   └── auth.store.ts             # Zustand: user only, no token field
├── types/
│   ├── enums.ts                  # String literal unions
│   └── common.ts                 # Interfaces (PaginatedResponse, User, Document, Block,
│                                 #   CompileJob, HivRelease, ChunkLibraryEntry, Chatbot,
│                                 #   ChatbotStats, AccessCode, HealthCheck, etc.)
└── TEMPLATES/                    # Code generation templates for future use
```

---

## Design System

### Color Palette

**Dominant:** Warm stone neutrals — no cold slate, no generic blue.

```
Background    #fafaf9  (warm white)     →  #0c0a09  (dark mode)
Surface       #ffffff                       #1c1917
Text Primary  #1c1917                       #f5f5f4
Text Muted    #78716c                       #a8a29e
Border        rgba(28,25,23,0.10)           rgba(255,255,255,0.10)
```

**Accent (Deep Teal):** `#155D46` — used sparingly for primary actions, active states, key data highlights.

**Brand Tan:** `#C9A96E` — sidebar highlight, trust badges, decorative accents only.

### Typography

| Role | Font | Weights |
|---|---|---|
| Display (headlines, stat values, nav) | Space Grotesk | 400–700 |
| Body (text, labels, UI copy) | Plus Jakarta Sans | 400–600 |
| Mono (code, hashes, timestamps, badges) | JetBrains Mono | 400–600 |

### Motion

- **Expo easing** for snappy, modern feel: `cubic-bezier(0.16, 1, 0.3, 1)`
- Button hover: `-translateY(1px)` + `shadow-glow`
- Card hover: `translateY(-2px)` + elevated shadow
- Stagger entrance: `fadeInUp` with 50ms–300ms delays

### Dark Mode

Full `data-theme` attribute swap on `<html>`. Inline script in `<head>` prevents flash on hydration. Theme persisted in `localStorage`, falls back to `prefers-color-scheme`.

---

## Authentication Model

1. User submits credentials → `POST /api/v1/agency/auth/login`
2. Platform token stored in `sessionStorage`
3. Exchange for compiler token → `POST /api/auth/exchange` → `sessionStorage`
4. `AuthGuard` wraps all `(app)` routes:
   - No compiler token → redirect `/login`
   - Token expired → `clearTokens()` → redirect `/login`
   - Valid token → render children
5. All `compilerApi` calls inject `Authorization: Bearer ${token}`
6. On 401 → clear all tokens → `window.location.href = '/login'`
7. WebSocket auth via query param: `ws://...?token=${compilerToken}`

**Token storage:** Zustand store holds only the `user` object. The compiler token is read directly from `sessionStorage` via `lib/auth.ts` helpers at runtime. This avoids stale token issues from Zustand serialization.

---

## Keyboard Shortcuts — Document Review

| Key | Action |
|---|---|
| `A` | Approve focused block |
| `F` | Flag focused block |
| `Tab` | Move to next block |
| `Shift+Tab` | Move to previous block |
| `←` | Previous PDF page |
| `→` | Next PDF page |

---

## Development Notes

- **`sessionStorage` guards:** Token getter functions in `lib/auth.ts` check `typeof window === 'undefined'` to prevent SSG prerender crashes.
- **PaginatedResponse envelope:** `{ data: T[], meta: { total, page, per_page, total_pages } }`. The `ApiClient.request()` method auto-unwraps single-item responses (`{ data: T }` → `T`) but passes paginated responses through intact.
- **Chunk type filter:** Client-side only — backend `/api/chunks` does not support `?type=` yet. All filtering is done in the hook.
- **Compile auto-activates:** The backend sets `is_active: true` on the release upon successful compile. No manual activation needed.
- **No registration endpoint:** `POST /api/v1/agency/auth/register` does not exist. Accounts are created by the platform administrator.
- **PDF viewer:** Loaded with `next/dynamic({ ssr: false })` to avoid server-side rendering issues with the `window` object.

---

## Roadmap

- [ ] WhatsApp channel toggle once backend `PATCH /agency/chatbots/:id` with `whatsapp_enabled` is live
- [ ] Backend `?type=` filter support for `/api/chunks` endpoint
- [ ] Assistant analytics dashboard once `/agency/chatbots/:id/stats` is live
- [ ] End-to-end integration testing against production backend
- [ ] WebSocket job stream testing with actual compile job
- [ ] Chunk library virtualization if entries exceed 1000 rows

---

## License

Proprietary — HIVA Platform. All rights reserved.