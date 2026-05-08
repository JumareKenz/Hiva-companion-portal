# PROGRESS.md — HIVA Companion Portal

## Current Focus

**Phase 6: Polish & Quality Gates** — README, final typecheck, build verification.

---

## Phase 1: Foundation

- [x] **1.1 Project bootstrap**
  - [x] Run `npx create-next-app@14` with specified flags (manually scaffolded due to interactive prompt issues)
  - [x] Install core dependencies (tanstack query, zustand, react-hook-form, zod, date-fns, etc.)
  - [x] Initialize shadcn/ui and add required primitives (dialog, tooltip, dropdown-menu, toast, sonner)
  - [x] Configure `tsconfig.json` strict mode (noImplicitAny, strictNullChecks, noUncheckedIndexedAccess)
  - [x] Configure `tailwind.config.ts` with exact design tokens (colors, fonts, borderRadius, boxShadow)
  - [x] Create `.env.local.example` with required variables
  - [x] Configure `next.config.mjs` with API rewrite rules

- [x] **1.2 Global styles & theme**
  - [x] Create `app/globals.css` with Google Fonts imports, Tailwind directives, CSS variables, animations, component utility classes (btn, surface, input, badge, etc.)
  - [x] Add dark mode class toggle script to `app/layout.tsx` `<head>` (prevent flash)
  - [x] Implement `lib/theme.ts` (getTheme, setTheme, system preference fallback)
  - [x] Implement `hooks/useTheme.ts`

- [x] **1.3 Types & domain model**
  - [x] Create `types/enums.ts` with all literal unions (DocumentStatus, BlockType, JobStep, Language, Role, LogLevel, etc.)
  - [x] Create `types/common.ts` with all interfaces (User, Document, Block, CompileJob, HivRelease, ChunkLibraryEntry, ChunkStats, LogEvent, HivVersion, PaginatedResponse, ApiError)

- [x] **1.4 Core utilities**
  - [x] Create `lib/auth.ts` — `decodeJwt()`, `isTokenExpired()`, `getTokenClaims()`
  - [x] Create `lib/queryClient.ts` — TanStack Query client with default staleTime and retry config
  - [x] Create `lib/utils.ts` — `cn()` helper (clsx + tailwind-merge)

- [x] **1.5 State management**
  - [x] Create `stores/auth.store.ts` — Zustand store with token + user, sessionStorage persist (token only), isAdmin getter

- [x] **1.6 HTTP service layer**
  - [x] Create `services/http.ts` — ApiClient class with Bearer injection, 401 redirect, blob support, ApiError throwing
  - [x] Create `services/auth.service.ts` — login (form-urlencoded), refresh, me
  - [x] Create `services/documents.service.ts` — upload, list, get, ready, delete, compile
  - [x] Create `services/blocks.service.ts` — list, patch, reprocess
  - [x] Create `services/jobs.service.ts` — list, get, download
  - [x] Create `services/releases.service.ts` — list, activate
  - [x] Create `services/chunks.service.ts` — list, stats
  - [x] Create `services/hiv.service.ts` — version, download, errorReport
  - [x] Create `services/health.service.ts` — check

- [x] **1.7 Shared UI components**
  - [x] `components/ui/StatusBadge.tsx` — Document + Job status mapping
  - [x] `components/ui/ConfidenceBar.tsx` — Score bar with color thresholds
  - [x] `components/ui/Avatar.tsx` — Initials with deterministic color
  - [x] `components/ui/StatCard.tsx` — Dashboard stat card
  - [x] `components/ui/EmptyState.tsx` — Centered empty state
  - [x] `components/ui/FileTypeBadge.tsx` — PDF/DOCX badge
  - [x] `components/ui/Pagination.tsx` — Page navigation
  - [x] `components/ui/SkeletonLoader.tsx` — Shimmer skeleton (card/row/text)

- [x] **1.8 Layout shell**
  - [x] `components/layout/Sidebar.tsx` — Fixed dark sidebar, nav groups, user section
  - [x] `components/layout/Topbar.tsx` — Sticky top bar, breadcrumb, context CTAs, dark mode toggle
  - [x] `components/guards/AdminOnly.tsx` — Role-based conditional render
  - [x] `app/(app)/layout.tsx` — Shell composition: Sidebar + Topbar + main content area + QueryClientProvider + AuthGuard
  - [x] `app/layout.tsx` — Root layout: fonts, theme script, Sonner `<Toaster />`

- [x] **1.9 Design System Implementation**
  - [x] Update `app/layout.tsx` to load Space Grotesk, Plus Jakarta Sans, and JetBrains Mono from Google Fonts
  - [x] Create `app/globals.css` with all CSS custom properties, animations, component utility classes
  - [x] Both `:root` (light) and `[data-theme="dark"]` variants
  - [x] Noise texture overlay pseudo-element on body
  - [x] Mesh gradient utility classes for hero areas
  - [x] Entrance animation keyframes (fadeInUp, fadeIn, slideDown)
  - [x] Shimmer animation for skeletons
  - [x] Component utility classes: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-destructive`, `.surface`, `.surface-raised`, `.surface-overlay`, `.input`, `.input-error`, `.label`, `.hint`, `.error-msg`, `.badge`, `.badge-accent`, `.badge-success`, `.badge-warning`, `.badge-error`, `.badge-ghost`, `.entrance`, `.entrance-d1` through `.entrance-d6`
  - [x] Create `lib/theme.ts` with `getTheme()`, `setTheme()`, and `getInitialTheme()`
  - [x] Create `hooks/useTheme.ts`
  - [x] Add inline theme script to `<head>` in `app/layout.tsx` to prevent flash of wrong theme
  - [x] Add `prefers-reduced-motion` media query to disable animations for accessibility

---

## Phase 2: Auth & Core Flow

- [x] **2.1 Authentication**
  - [x] `features/auth/hooks/useAuth.ts` — login mutation (form-urlencoded), /me query, logout
  - [x] `features/auth/components/AuthGuard.tsx` — Token validation, user fetch, full-screen loader, redirect
  - [x] `app/(auth)/login/page.tsx` — Two-column layout, left dark panel with brand, right form panel
  - [x] Login form: react-hook-form + Zod (email, password, min 8 chars)
  - [x] Loading states: spinner on submit, disabled fields
  - [x] Error handling: Sonner toast + inline form errors
  - [x] SSO and hardware key placeholder buttons (UI only)
  - [x] Security notice banner at bottom
  - [x] On mount: if token valid → redirect `/`

- [x] **2.2 Dashboard (`/`)**
  - [x] `app/(app)/page.tsx` — Dashboard page
  - [x] Fetch: `GET /api/auth/me`, `GET /api/jobs?page=1&page_size=5`, `GET /api/releases?page=1&page_size=1`, `GET /api/chunks/stats`
  - [x] Greeting header with time-of-day + first name
  - [x] Stat cards grid (4 columns): Documents in Queue, Chunks in Library, Compiled Languages, Library Coverage
  - [x] Recent compile jobs table (5 rows) with StatusBadge
  - [x] Translation coverage panel with per-language progress bars
  - [x] Loading: SkeletonLoader rows
  - [x] Empty: EmptyState for jobs

---

## Phase 3: Document Management

- [x] **3.1 Document Queue (`/documents`)**
  - [x] `app/(app)/documents/page.tsx` — Full implementation with filter tabs, search, sort, table, pagination
  - [x] Fetch: `GET /api/documents?page&page_size=20`
  - [x] Page header with total count badge
  - [x] Filter tabs: All | Pending Review | In Review | Ready | Compiled | Failed
  - [x] Search input (client-side filter) + sort dropdown
  - [x] Document table: DOCUMENT | UPLOADED | STATUS | ACTIONS
  - [x] Row hover actions: Eye (navigate), Play (compile modal, admin+ready), Trash2 (delete, admin)
  - [x] Loading: 8× SkeletonLoader row
  - [x] Empty: EmptyState with upload action

- [x] **3.2 Upload Modal**
  - [x] `features/documents/components/UploadModal.tsx`
  - [x] Dialog with dropzone (drag hover state), file validation, form fields
  - [x] XHR upload with real progress bar
  - [x] On success: close modal, toast, invalidate documents query

- [x] **3.3 Compile Modal**
  - [x] `features/documents/components/CompileModal.tsx`
  - [x] Dialog with language checkboxes (EN pre-checked disabled)
  - [x] On success: `router.push(/jobs/${job.id})`

- [x] **3.4 Document Review (`/documents/[id]`)**
  - [x] `app/(app)/documents/[id]/page.tsx` — Full split-panel implementation
  - [x] Full-height split panel layout (`flex h-[calc(100vh-56px)]`)
  - [x] Sub-header: document name, StatusBadge, file info
  - [x] Left panel: PDF viewer (`react-pdf` lazy-loaded via dynamic import, authenticated blob URL)
  - [x] Right panel: Block list with BlockCard components
  - [x] Bottom bar: review progress, "Mark as Ready" button
  - [x] Keyboard shortcuts: A (approve), F (flag), Tab (next), Arrow keys (PDF page)

- [x] **3.5 Block hooks**
  - [x] `features/blocks/hooks/useBlockActions.ts` — useBlocks query, usePatchBlock mutation, useReprocessBlock mutation

- [x] **3.6 Document hooks**
  - [x] `features/documents/hooks/useDocuments.ts` — useDocuments, useDocument, useUploadDocument, useMarkReady, useDeleteDocument, useCompileDocument, useUploadProgress (XHR)

---

## Phase 4: Compile Pipeline

- [x] **4.1 Compile Job Page (`/jobs/[id]`)**
  - [x] `app/(app)/jobs/[id]/page.tsx` — Full implementation with polling + WebSocket
  - [x] Fetch: `GET /api/jobs/:id` with `refetchInterval` while running
  - [x] Sub-header: document name + version chip
  - [x] Two-column layout

- [x] **4.2 Step Tracker**
  - [x] `features/jobs/components/StepTracker.tsx`
  - [x] 9 horizontal steps with connector lines
  - [x] States: pending (border), active (accent-600 + glow), complete (success), failed (error)

- [x] **4.3 Log Stream**
  - [x] `features/jobs/components/LogStream.tsx`
  - [x] Dark terminal panel, auto-scroll, timestamp, level colors (INF/WRN/ERR)
  - [x] Connection status indicator (top-right)

- [x] **4.4 WebSocket Hook**
  - [x] `features/jobs/hooks/useJobStream.ts`
  - [x] Connect to `WS /api/jobs/{id}/stream?token={token}`
  - [x] Handle: heartbeat (ignore), complete (stop), failed (stop), normal logs (append)
  - [x] Max 500 logs, drop oldest
  - [x] Reconnect once after 2s on unexpected close
  - [x] Close code 4001 → redirect login
  - [x] Cleanup: ws.close() on unmount

- [x] **4.5 Job metadata & actions**
  - [x] Right column: Job metadata card (status, created, step, chunks, languages)
  - [x] Validation warnings panel (if any)
  - [x] Bundle Ready card (status === 'complete'): metadata, download button (admin), activate button (admin)
  - [x] Build Failed card (status === 'failed'): error message, retry link

---

## Phase 5: Bundles & Sources

- [x] **5.1 Compiled Bundles (`/bundles`)**
  - [x] `app/(app)/bundles/page.tsx` — Active release hero, releases table, pagination
  - [x] Admin actions: Activate, Download (AdminOnly gated)

- [x] **5.2 Chunk Library (`/sources`)**
  - [x] `app/(app)/sources/page.tsx` — Stats row, translation coverage, search + type filter, chunk table, pagination
  - [x] `chunk_type` field wired from API (optional, pending backend)

- [x] **5.3 Release & Chunk hooks**
  - [x] `features/releases/hooks/useReleases.ts` — useReleases query, useActivateRelease mutation
  - [x] `features/chunks/hooks/useChunks.ts` — useChunks query, useChunkStats query

---

## Phase 6: Supporting Pages & Polish

- [x] **6.1 Audit Log (`/audit`)**
  - [x] `app/(app)/audit/page.tsx` — UI shell with EmptyState: "Coming soon"

- [x] **6.2 Deployments (`/deployments`)**
  - [x] `app/(app)/deployments/page.tsx` — UI shell with Beta warning badge

- [x] **6.3 Settings (`/settings`)**
  - [x] `app/(app)/settings/page.tsx` — Full implementation
  - [x] Account tab: User info card, role badge
  - [x] Workspace tab: Health check, API URL, HIV version
  - [x] API tab: Token display (masked, reveal toggle, copy)

- [x] **6.4 Permissions hook**
  - [x] `hooks/usePermissions.ts` — canCompile, canDelete, canDownload, canActivateRelease, canReview

- [x] **6.5 Error handling & toasts**
  - [x] Standardized Sonner toast usage across all mutations
  - [x] Special handling for 400 on /ready (Dialog with unapproved blocks — partial, shows toast)
  - [x] All API errors show user-friendly messages

- [x] **6.6 Performance polish**
  - [x] Skeleton loaders match loaded content dimensions
  - [x] TanStack Query staleTime configurations applied
  - [x] WebSocket cleanup on unmount
  - [x] react-pdf lazy-loaded with `next/dynamic` `{ ssr: false }`
  - [x] Block auto-save debounce (30s) with unmount flush
  - [x] Search debounce (400ms) on Document Queue and Sources

- [~] **6.7 Accessibility**
  - [x] aria-label on interactive elements without visible text
  - [x] Keyboard navigation in block list (Tab, Shift+Tab, A, F)
  - [x] prefers-reduced-motion support
  - [ ] Focus management in modals — TODO

- [x] **6.8 README.md**
  - [x] Prerequisites, setup, run, build instructions
  - [x] Environment variables reference
  - [x] Auth model explanation
  - [x] Keyboard shortcuts reference
  - [x] Known limitations

---

## Phase 7: Quality Gates

- [x] `npx tsc --noEmit` passes with zero errors
- [x] `npm run build` succeeds
- [x] Every page renders without console errors on first load
- [x] Login → Dashboard → Upload → Review → Compile → Bundle flow works end-to-end (structural)
- [x] Dark mode toggle works on all pages with no unstyled flash
- [x] All loading/error/empty states render correctly
- [x] AdminOnly gates hide compile/download/delete/activate from reviewer role
- [x] WebSocket closes cleanly when navigating away from job page
- [x] Block auto-save flushes pending edits on unmount via ref cleanup
- [x] No `any` types, no `ts-ignore`, no unused imports

---

## Decisions Log

| Date | Decision | Reason |
|---|---|---|
| 2026-05-07 | Initial architecture | Complete specification provided by user. All decisions extracted and formalized. |
| 2026-05-07 | Manual bootstrap | `create-next-app` interactive prompts unreliable in agent environment; manual scaffolding ensures exact config match |
| 2026-05-07 | Body font: Plus Jakarta Sans | Upgraded from DM Sans for refined legibility and warmer feel |
| 2026-05-07 | Block auto-save unmount flush | Ref-based cleanup ensures pending 30s debounced edits are saved when user navigates away; prevents data loss |
| 2026-05-07 | `chunk_type` as optional on `ChunkLibraryEntry` | Backend field pending; frontend type + filter wired so table renders real types as soon as API returns them |

## Known Risks / Tricky Parts ⚠️

1. **PDF Authentication**: Backend file paths may require authenticated fetching. Must use `fetch` with Bearer header → `URL.createObjectURL(blob)` → pass blob URL to `react-pdf`. If backend adds a dedicated file endpoint later, adapt service layer.
2. **WebSocket Reconnection**: Reconnect only ONCE after 2s. Avoid infinite reconnection loops that could spam the backend. If the job is already complete/failed, do not reconnect.
3. **Block Auto-save Debounce**: Must cleanup timer on unmount to prevent PATCH after page navigation. Use `useEffect` cleanup function.
4. **Optimistic Updates on Blocks**: If PATCH fails, revert the optimistic status change immediately. User must not think a block is approved when it failed.
5. **Document Review Scroll Sync**: PDF page navigation and block focus are independent. No scroll-sync required per spec, but ensure keyboard shortcuts don't conflict with PDF viewer focus.
6. **Upload Progress with XMLHttpRequest**: Must integrate XHR cleanly with React state. Do not mix `fetch` and `XMLHttpRequest` patterns — isolate XHR logic inside the upload mutation hook.
7. **Memory Leaks in Log Stream**: Cap logs array at 500 entries. Long-running compile jobs could accumulate thousands of log events.
