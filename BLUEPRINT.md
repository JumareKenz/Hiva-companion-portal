# BLUEPRINT.md — HIVA Companion Portal

## 1. Full Data Models

All types live in `types/enums.ts` and `types/common.ts`. No agent may modify, rename, or extend these without explicit approval documented in `PROGRESS.md`.

### enums.ts

```ts
export type DocumentStatus =
  | 'pending_review'
  | 'in_review'
  | 'ready_to_compile'
  | 'compiling'
  | 'compiled'
  | 'failed'

export type BlockType = 'paragraph' | 'heading' | 'table' | 'image_placeholder'
export type BlockStatus = 'pending' | 'approved' | 'flagged'

export type JobStatus = 'queued' | 'running' | 'complete' | 'failed'
export type JobStep =
  | 'chunk'
  | 'deduplicate'
  | 'process'
  | 'tone'
  | 'rule_compile'
  | 'translate'
  | 'validate'
  | 'package'
  | 'sign'
  | 'complete'

export type ChunkType = 'drug_table' | 'danger_sign' | 'decision_tree' | 'protocol' | 'faq'
export type Language = 'en' | 'ha' | 'yo' | 'ig' | 'pcm'
export type Role = 'admin' | 'reviewer'
export type LogLevel = 'info' | 'warn' | 'error'
```

### common.ts

```ts
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

export interface ApiError {
  status: number
  message: string
  detail: string | Record<string, unknown>
}

export interface User {
  id: string
  email: string
  full_name: string
  role: Role
  is_active: boolean
  created_at: string // ISO 8601
}

export interface Document {
  id: string
  name: string
  source: string
  year: string
  origin_language: string
  status: DocumentStatus
  file_path: string
  file_extension: '.pdf' | '.docx'
  created_by: string
  created_at: string
  updated_at: string
}

export interface Block {
  id: string
  document_id: string
  block_index: number
  block_type: BlockType
  raw_content: string
  structured_content: Record<string, unknown> | null
  confidence_score: number // 0.0 - 1.0
  status: BlockStatus
  reviewer_notes: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

export interface CompileJob {
  id: string
  document_id: string
  languages: Language[]
  status: JobStatus
  current_step: JobStep | null
  started_at: string | null
  completed_at: string | null
  hiv_file_path: string | null
  hiv_file_size_kb: number | null
  chunk_count: number | null
  reused_chunk_count: number | null
  validation_warnings: string[] | null
  error_message: string | null
  created_by: string
  created_at: string
}

export interface HivRelease {
  id: string
  version: string
  sha256: string
  size_kb: number
  chunk_count: number
  languages: Language[]
  is_active: boolean
  needs_review: boolean
}

export interface ChunkLibraryEntry {
  id: string
  content_hash: string
  compiled_en: Record<string, unknown> | null
  tone_applied: boolean
  rule_compiled: Record<string, unknown> | null
  translations: Record<string, unknown>
  embeddings_computed: boolean
  last_used_at: string
}

export interface ChunkStats {
  total: number
  compiled: number
  translated_by_lang: Record<string, number>
  reuse_rate: number
}

export interface LogEvent {
  timestamp: string
  step: JobStep | 'complete' | 'failed'
  level: LogLevel
  message: string
  progress_pct: number
}

export interface HivVersion {
  version: string
  size_kb: number
  sha256: string
  languages: Language[]
  chunk_count: number
  created_at: string
}
```

## 1.5 Visual Design Specification

This section maps every component and page to the exact design tokens it must use. Agents building components MUST reference this section — never invent styles.

### Global Layout Tokens

| Element | Token / Class | Value / Rule |
|---|---|---|
| Page background | `var(--bg-primary)` | `#fafaf9` light / `#0c0a09` dark |
| Page padding | `--space-6` to `--space-10` | `24px` mobile, `40px` desktop |
| Section gap | `--space-8` to `--space-10` | `32px–40px` between major sections |
| Content max-width | `max-w-7xl` (Tailwind) | `1280px` centered |
| Noise overlay | CSS pseudo-element on `<body>` | `opacity: var(--noise-opacity)` (0.025) |

### Typography Application

| Element | Font | Size | Weight | Line Height | Letter Spacing | Color |
|---|---|---|---|---|---|---|
| H1 (page title) | Space Grotesk | `--font-size-3xl` | 700 | 1.1 | -0.02em | `--text-primary` |
| H2 (section title) | Space Grotesk | `--font-size-2xl` | 600 | 1.1 | -0.01em | `--text-primary` |
| H3 (card title) | Space Grotesk | `--font-size-xl` | 600 | 1.2 | -0.01em | `--text-primary` |
| Body | Plus Jakarta Sans | `--font-size-base` | 400 | 1.4 | 0 | `--text-secondary` |
| Label | Plus Jakarta Sans | `--font-size-xs` | 500 | 1.25 | 0.05em | `--text-muted` |
| Mono label | JetBrains Mono | `--font-size-xs` | 500 | 1.25 | 0.05em | `--text-muted` |
| Stat value | Space Grotesk | `--font-size-3xl` | 700 | 1.1 | -0.02em | `--text-primary` |
| Button text | Plus Jakarta Sans | `--font-size-sm` | 500 | 1 | 0 | varies by variant |
| Caption | Plus Jakarta Sans | `--font-size-xs` | 400 | 1.4 | 0 | `--text-faint` |
| Badge text | JetBrains Mono | `--font-size-xs` | 500 | 1 | 0.05em | varies by variant |

### Surface & Elevation Application

| Component | Surface Level | Background | Border | Radius | Shadow |
|---|---|---|---|---|---|
| Sidebar | Custom (always dark) | `--accent-800` | none | 0 | none |
| Topbar | Overlay | `--surface-overlay` + blur | `var(--border-default)` | 0 | none |
| Standard card | Base | `--surface` | `var(--border-subtle)` | `--radius-lg` | none |
| Hoverable card | Raised | `--surface-raised` | `var(--border-default)` | `--radius-lg` | `--shadow-sm` |
| Modal/Dialog | Overlay | `--surface-overlay` + blur | `var(--border-default)` | `--radius-xl` | `--shadow-lg` |
| Dropdown/Menu | Floating | `--surface-floating` | `var(--border-default)` | `--radius-lg` | `--shadow-md` |
| Form input | Inset | `--surface` | `var(--border-default)` | `--radius-md` | inset `--shadow-xs` |
| Terminal/Log | Inset | `--surface-inset` | `var(--border-subtle)` | `--radius-lg` | inset `--shadow-xs` |
| Button (primary) | Floating | `--accent-600` | none | `--radius-sm` | `--shadow-glow` on hover |
| Button (secondary) | Base | transparent | `var(--border-default)` | `--radius-sm` | none |
| Button (ghost) | Base | transparent | none | `--radius-sm` | none |

### Color Application by Component

**StatusBadge:**
- `pending_review`: `badge-ghost` (border `--border-default`, text `--text-muted`)
- `in_review`: `badge-warning` (bg `--warning`/10, text `--warning`)
- `ready_to_compile`: `badge-accent` (bg `--accent-600`/10, text `--accent-600`)
- `compiling`: `badge-accent` + pulse dot (bg `--accent-600`/10, text `--accent-600`, dot pulses)
- `compiled`: `badge-success` (bg `--success`/10, text `--success`)
- `failed`: `badge-error` (bg `--error`/10, text `--error`)

**ConfidenceBar:**
- Container: `h-1.5`, `bg-[var(--bg-tertiary)]`, `rounded-full`
- Fill `>= 0.90`: `bg-[var(--success)]`
- Fill `>= 0.75`: `bg-[var(--warning)]`
- Fill `< 0.75`: `bg-[var(--error)]`

**BlockCard (left border by status):**
- `pending`: `border-l-[3px] border-[var(--bg-tertiary)]`
- `approved`: `border-l-[3px] border-[var(--success)]`
- `flagged`: `border-l-[3px] border-[var(--warning)]`

**StepTracker circles:**
- `pending`: `border-2 border-[var(--bg-tertiary)] text-[var(--text-faint)]`
- `active`: `bg-[var(--accent-600)] text-[var(--text-inverse)] shadow-[var(--shadow-glow)]`
- `complete`: `bg-[var(--success)] text-[var(--text-inverse)]`
- `failed`: `bg-[var(--error)] text-[var(--text-inverse)]`

**LogStream panel:**
- Background: `--surface-inset` (darkened)
- Text: `--text-secondary`
- Timestamp: `--text-faint`
- Level `info`: `#60a5fa` (blue-400)
- Level `warn`: `#fbbf24` (amber-400)
- Level `error`: `#f87171` (red-400)

### Motion Application

| Interaction | Transform | Duration | Easing |
|---|---|---|---|
| Button hover (primary) | `translateY(-1px)` + glow | `--duration-base` | `--ease-spring` |
| Button active | `translateY(0)` | `--duration-fast` | `--ease-out-expo` |
| Card hover | `translateY(-2px)` + shadow elevation | `--duration-base` | `--ease-out-expo` |
| Modal enter | `opacity 0→1`, `scale(0.98)→scale(1)` | `--duration-slow` | `--ease-out-expo` |
| Modal exit | `opacity 1→0`, `scale(1)→scale(0.98)` | `--duration-base` | `--ease-in-out` |
| Toast enter | `translateY(-100%)→translateY(0)` | 300ms | `--ease-spring` |
| Toast exit | `translateY(0)→translateY(-100%)` | 200ms | `--ease-in-out` |
| Page section enter | `translateY(16px)→translateY(0)`, `opacity 0→1` | 500ms | `--ease-out-expo` |
| Skeleton shimmer | `background-position` shift | 1.5s | linear |
| Progress bar fill | `width` transition | `--duration-slow` | `--ease-out-expo` |
| Focus ring | `box-shadow` appear | `--duration-fast` | `--ease-out-expo` |

### Atmosphere Application

| Location | Effect | Implementation |
|---|---|---|
| `<body>` background | Noise texture | Pseudo-element with SVG noise filter, `opacity: var(--noise-opacity)` |
| Login left panel | Mesh gradient | `radial-gradient` layers with `--accent-600` and `--brand-tan` at low opacity |
| Dashboard hero | Subtle gradient | `var(--gradient-hero)` |
| Active release card | Gradient border | `linear-gradient` border-image or pseudo-element with `--accent-600` |
| Floating elements | Backdrop blur | `backdrop-filter: blur(20px) saturate(180%)` |

## 2. Full API Surface

All functions use `api` instance from `services/http.ts`. Return types are Promise-wrapped.

### Auth Service (`services/auth.service.ts`)

| Function | Method | Path | Input | Output | Auth |
|---|---|---|---|---|---|
| `login(credentials)` | POST | `/auth/login` | `URLSearchParams({ username: email, password })` | `{ access_token: string, token_type: string }` | No |
| `refresh()` | POST | `/auth/refresh` | — | `{ access_token: string }` | Yes (Bearer) |
| `me()` | GET | `/auth/me` | — | `User` | Yes |

### Documents Service (`services/documents.service.ts`)

| Function | Method | Path | Input | Output | Auth |
|---|---|---|---|---|---|
| `upload(formData)` | POST | `/documents` | `FormData` (file, name, source, year, origin_language) | `Document` | Yes |
| `list(params)` | GET | `/documents` | `?page&page_size` | `PaginatedResponse<Document>` | Yes |
| `get(id)` | GET | `/documents/:id` | — | `Document` | Yes |
| `markReady(id)` | POST | `/documents/:id/ready` | — | `Document` | Yes |
| `delete(id)` | DELETE | `/documents/:id` | — | `void` (204) | Yes |
| `compile(id, { languages })` | POST | `/documents/:id/compile` | `{ languages: Language[] }` | `CompileJob` | Yes |

### Blocks Service (`services/blocks.service.ts`)

| Function | Method | Path | Input | Output | Auth |
|---|---|---|---|---|---|
| `list(docId, params)` | GET | `/documents/:docId/blocks` | `?page&page_size&status` | `PaginatedResponse<Block>` | Yes |
| `patch(id, body)` | PATCH | `/blocks/:id` | `{ raw_content?, structured_content?, status?, reviewer_notes? }` | `Block` | Yes |
| `reprocess(id)` | POST | `/blocks/:id/reprocess` | — | `Block` | Yes |

### Jobs Service (`services/jobs.service.ts`)

| Function | Method | Path | Input | Output | Auth |
|---|---|---|---|---|---|
| `list(params)` | GET | `/jobs` | `?page&page_size` | `PaginatedResponse<CompileJob>` | Yes |
| `get(id)` | GET | `/jobs/:id` | — | `CompileJob` | Yes |
| `download(id)` | GET | `/jobs/:id/download` | — | `Blob` | Yes |

### Releases Service (`services/releases.service.ts`)

| Function | Method | Path | Input | Output | Auth |
|---|---|---|---|---|---|
| `list(params)` | GET | `/releases` | `?page&page_size` | `PaginatedResponse<HivRelease>` | Yes |
| `activate(id)` | POST | `/releases/:id/activate` | — | `HivRelease` | Yes |

### Chunks Service (`services/chunks.service.ts`)

| Function | Method | Path | Input | Output | Auth |
|---|---|---|---|---|---|
| `list(params)` | GET | `/chunks` | `?page&page_size&search&content_hash` | `PaginatedResponse<ChunkLibraryEntry>` | Yes |
| `stats()` | GET | `/chunks/stats` | — | `ChunkStats` | Yes |

### HIV Service (`services/hiv.service.ts`)

| Function | Method | Path | Input | Output | Auth |
|---|---|---|---|---|---|
| `version()` | GET | `/hiv/version` | — | `HivVersion` | No |
| `download()` | GET | `/hiv/download` | — | `Blob` | Yes |
| `errorReport(body)` | POST | `/hiv/error-report` | `Record<string, unknown>` | `void` (204) | No |

### Health Service (`services/health.service.ts`)

| Function | Method | Path | Input | Output | Auth |
|---|---|---|---|---|---|
| `check()` | GET | `/health` | — | `{ status: 'ok', service: string }` | No |

## 3. Full Component Map

### Layout Components

#### `components/layout/Sidebar.tsx`
- **Props:** none
- **Renders:** Fixed 240px dark sidebar. HIVA logo, navigation groups, user avatar + logout.
- **State:** none (reads `useAuthStore`)
- **Calls:** `useAuthStore`, `useRouter`

#### `components/layout/Topbar.tsx`
- **Props:** none
- **Renders:** Sticky 56px bar. Breadcrumb, dark mode toggle, notification bell, context CTA button.
- **State:** none
- **Calls:** `usePathname` (for context CTA), `useTheme`

### UI Primitive Components

#### `components/ui/StatusBadge.tsx`
- **Props:** `status: DocumentStatus | JobStatus; type: 'document' | 'job'`
- **Renders:** Badge with dot and optional pulse. Maps status to label + color class.
- **State:** none
- **Calls:** none

#### `components/ui/ConfidenceBar.tsx`
- **Props:** `score: number; showLabel?: boolean`
- **Renders:** Horizontal bar (0-100% width), color-coded by threshold.
- **State:** none

#### `components/ui/Avatar.tsx`
- **Props:** `name: string; size?: 'xs' | 'sm' | 'md' | 'lg'; className?: string`
- **Renders:** Circle with initials. Color derived from name hash.
- **State:** none

#### `components/ui/StatCard.tsx`
- **Props:** `label: string; value: string | number; trend?: { value: number; label: string; positive: boolean }; icon?: LucideIcon`
- **Renders:** Card with large value, label, optional trend row.
- **State:** none

#### `components/ui/EmptyState.tsx`
- **Props:** `icon: LucideIcon; title: string; description: string; action?: { label: string; onClick: () => void }`
- **Renders:** Centered icon, title, description, optional button.
- **State:** none

#### `components/ui/FileTypeBadge.tsx`
- **Props:** `type: '.pdf' | '.docx'`
- **Renders:** Small badge with type label and brand color.
- **State:** none

#### `components/ui/Pagination.tsx`
- **Props:** `page: number; totalPages: number; onPageChange: (page: number) => void`
- **Renders:** Previous/Next + numbered buttons + ellipsis.
- **State:** none

#### `components/ui/SkeletonLoader.tsx`
- **Props:** `variant: 'card' | 'row' | 'text'; className?: string`
- **Renders:** Shimmer placeholder matching real content dimensions.
- **State:** none

#### `components/guards/AdminOnly.tsx`
- **Props:** `children: React.ReactNode; fallback?: React.ReactNode`
- **Renders:** Children if `role === 'admin'`, otherwise `fallback` or `null`.
- **State:** none (reads `useAuthStore`)

### Feature Components

#### `features/auth/components/AuthGuard.tsx`
- **Props:** `children: React.ReactNode`
- **Renders:** Full-screen spinner while loading, or children if authenticated. Redirects to `/login` if unauthenticated.
- **State:** `isLoading` (local)
- **Calls:** `useAuthStore`, `authService.me`, `useRouter`

#### `features/documents/components/UploadModal.tsx`
- **Props:** `open: boolean; onOpenChange: (open: boolean) => void`
- **Renders:** Dialog with dropzone, file info, form fields (name, source, year, origin_language), progress bar.
- **State:** `file`, `dragActive`, `progress`, form state via `react-hook-form`
- **Calls:** `useUploadDocument` mutation, `documentsService.upload` via XHR

#### `features/documents/components/CompileModal.tsx`
- **Props:** `open: boolean; onOpenChange: (open: boolean) => void; documentId: string; documentName: string`
- **Renders:** Dialog with language checkboxes (EN pre-checked, disabled).
- **State:** `selectedLanguages` (local)
- **Calls:** `useCompileDocument` mutation

#### `features/blocks/components/BlockCard.tsx`
- **Props:** `block: Block; onApprove: () => void; onFlag: () => void; onReprocess: () => void; onEdit: (content: string) => void`
- **Renders:** Card with left border color, type badge, confidence bar, content (text/table/placeholder), action icons, low-confidence warning, reviewer notes textarea.
- **State:** `isEditing`, `editValue`, `noteValue`
- **Calls:** debounced auto-save on blur

#### `features/jobs/components/StepTracker.tsx`
- **Props:** `currentStep: JobStep | null; failed: boolean`
- **Renders:** 9-step horizontal stepper with connector lines. Circles show pending/active/complete/failed states.
- **State:** none (derived from props)

#### `features/jobs/components/LogStream.tsx`
- **Props:** `logs: LogEvent[]; connectionStatus: 'connected' | 'reconnecting' | 'disconnected'`
- **Renders:** Dark terminal panel with auto-scroll, timestamp, level badge, message.
- **State:** `containerRef` for scroll-to-bottom
- **Calls:** `useEffect` for auto-scroll

## 4. Full User Flows

### Flow 1: Authentication
1. User navigates to `/login`.
2. `login/page.tsx` checks `useAuthStore` token on mount.
3. If token valid and not expired → `router.replace('/')`.
4. If no token → render login page.
5. User enters email + password.
6. `react-hook-form` validates via Zod (`email: string().email()`, `password: string().min(8)`).
7. On submit: `useAuth.login(email, password)`.
8. Service POSTs `application/x-www-form-urlencoded` to `/api/auth/login`.
9. On 200: `setToken(access_token)`. Then `GET /api/auth/me` → `setUser(user)`.
10. `router.push('/')`.
11. On 401/422: `toast.error()` + set form error state.
12. `AuthGuard` on `(app)/layout.tsx` validates token again before rendering children.

### Flow 2: Upload Document
1. User clicks "Upload Document" button (Dashboard or Document Queue).
2. `UploadModal` opens (`open = true`).
3. User drags file or clicks browse. File validated: extension `.pdf` or `.docx`, size < 50MB.
4. User fills name*, source*, year*, origin_language (default "English").
5. Submit button enabled only when file + required fields valid.
6. On submit: create `FormData`, append all fields + file.
7. Use `XMLHttpRequest` (not `fetch`) to POST `/api/documents/upload`.
8. `xhr.upload.onprogress` updates local `progress` state (0-100).
9. Progress bar animates in modal.
10. On success (200): close modal, `toast.success('Document uploaded...')`, invalidate `['documents']` query.
11. On error: `toast.error()` with `ApiError.detail`, keep modal open.

### Flow 3: Review Document
1. User clicks document name in queue → navigate to `/documents/:id`.
2. Page fetches `GET /api/documents/:id` and `GET /api/documents/:id/blocks`.
3. Left panel: Load PDF via authenticated blob URL. Use `react-pdf` `Document` + `Page`.
4. Right panel: Render `BlockCard` for each block.
5. User reviews block:
   - **Approve:** Click CheckCircle → optimistic PATCH `status: 'approved'` → invalidate blocks query on success.
   - **Flag:** Click Flag → PATCH `status: 'flagged'` + prompt for `reviewer_notes` if empty.
   - **Edit text:** Click text → textarea appears → blur after 1s debounce → PATCH `raw_content`.
   - **Reprocess:** Click RotateCw → POST reprocess → block resets to `pending`.
6. Keyboard shortcuts (page-level `useEffect`):
   - `A` → approve focused block.
   - `F` → flag focused block.
   - `Tab` → next block, `Shift+Tab` → previous.
   - `ArrowLeft/Right` → PDF page navigation.
7. Bottom bar shows: "{reviewed} of {total} reviewed · {flagged} flagged" + progress bar.
8. Auto-save: debounce 30s on content changes → silent PATCH.
9. "Mark as Ready" button:
   - Disabled if any blocks are `pending`.
   - On click: `POST /api/documents/:id/ready`.
   - If 400 with `unapproved_count`: open Dialog listing unapproved blocks.
   - If flagged blocks remain: confirm Dialog "N blocks flagged. Mark ready anyway?"
   - On success: document status → `ready_to_compile`. Toast success.

### Flow 4: Compile & Monitor
1. Admin clicks "Compile" on ready document.
2. `CompileModal` opens.
3. Admin selects target languages (EN pre-checked, disabled).
4. Submit: `POST /api/documents/:id/compile` with `{ languages }`.
5. On success: `router.push(/jobs/${job.id})`.
6. Job page mounts:
   - `useQuery(['job', id], { refetchInterval: job?.status === 'running' ? 3000 : false })`
   - `useJobStream(id)` opens `WS /api/jobs/{id}/stream?token={token}`.
7. `StepTracker` derives step states from `job.current_step`.
8. `LogStream` receives messages:
   - `heartbeat` → ignored.
   - `complete` → `isComplete = true`, WS closes, polling stops.
   - `failed` → `isFailed = true`, `error = message`, WS closes.
   - Other → append to `logs` array (max 500), update `currentStep` and `progressPct`.
9. WS unexpected close → reconnect once after 2s.
10. WS close code 4001 → clear token, redirect `/login`.
11. On complete: show "Bundle Ready" card with metadata + Download/Activate buttons.
12. On failed: show "Build Failed" card with error message + retry link.

### Flow 5: Activate Release
1. Admin navigates to `/bundles`.
2. Page fetches `GET /api/releases` and `GET /api/hiv/version`.
3. Active release shown in hero card at top.
4. Admin clicks "Activate" on archived release row.
5. `POST /api/releases/:id/activate`.
6. On success: invalidate `['releases']` and `['hivVersion']` queries.
7. Toast: "Release activated".

### Flow 6: Chunk Library Browse
1. User navigates to `/sources`.
2. Page fetches `GET /api/chunks/stats` and `GET /api/chunks?page=1`.
3. Stats row shows total, compiled, cache hit rate, language count.
4. Translation coverage card shows progress bars per language.
5. User searches: debounce 400ms → `?search={term}` or `?content_hash={term}` if hash-like.
6. User filters by chunk type via dropdown.
7. Table renders with pagination.

## 5. Full State Map

| State | Location | Type | Initial | Lifecycle | Reset Condition |
|---|---|---|---|---|---|
| token | Zustand authStore + sessionStorage | `string \| null` | null | App lifetime | `clearToken()`, 401, logout |
| user | Zustand authStore (memory) | `User \| null` | null | App lifetime | `clearToken()`, logout |
| documents | TanStack Query cache | `PaginatedResponse<Document>` | undefined | 30s staleTime | Invalidated on upload/delete |
| document (single) | TanStack Query cache | `Document` | undefined | 10s staleTime | Invalidated on markReady |
| blocks | TanStack Query cache | `PaginatedResponse<Block>` | undefined | 5s staleTime | Invalidated on patch/reprocess |
| jobs | TanStack Query cache | `PaginatedResponse<CompileJob>` | undefined | 3s staleTime | — |
| job (single) | TanStack Query cache | `CompileJob` | undefined | 3s polling while running | — |
| releases | TanStack Query cache | `PaginatedResponse<HivRelease>` | undefined | 60s staleTime | Invalidated on activate |
| chunks | TanStack Query cache | `PaginatedResponse<ChunkLibraryEntry>` | undefined | 60s staleTime | — |
| chunkStats | TanStack Query cache | `ChunkStats` | undefined | 120s staleTime | — |
| hivVersion | TanStack Query cache | `HivVersion` | undefined | 60s staleTime | — |
| health | TanStack Query cache | `{ status, service }` | undefined | 30s staleTime | — |
| uploadModalOpen | `useState` in parent | `boolean` | false | Page lifetime | Close modal |
| compileModalOpen | `useState` in parent | `boolean` | false | Page lifetime | Close modal |
| uploadProgress | `useState` in UploadModal | `number` | 0 | Modal lifetime | Reset on open |
| selectedFile | `useState` in UploadModal | `File \| null` | null | Modal lifetime | Reset on open |
| focusedBlockIndex | `useState` in DocumentReview | `number` | 0 | Page lifetime | Reset on doc change |
| wsLogs | `useState` in useJobStream | `LogEvent[]` | [] | Job page mount | Reset on jobId change |
| wsConnection | `useState` in useJobStream | `'connected' \| 'reconnecting' \| 'disconnected'` | 'connecting' | Job page mount | Reset on jobId change |
| wsComplete | `useState` in useJobStream | `boolean` | false | Job page mount | Reset on jobId change |
| wsFailed | `useState` in useJobStream | `boolean` | false | Job page mount | Reset on jobId change |
| theme | localStorage + HTML class | `'light' \| 'dark'` | system pref | Persistent | Toggle button |
| searchQuery | `useState` + debounce | `string` | '' | Page lifetime | — |
| currentPage | `useState` or URL param | `number` | 1 | Page lifetime | — |

## 6. Full Error Map

| Error Scenario | Source | Caught By | User Sees | Recovery |
|---|---|---|---|---|
| No auth token | `AuthGuard` mount | `AuthGuard` | Redirect to `/login` | Login |
| Token expired | `AuthGuard` / `api.request` | `AuthGuard` or `http.ts` | Redirect to `/login` | Re-login |
| 401 on API call | Backend | `api.request` | Redirect to `/login` | Re-login |
| 403 on admin action | Backend | Mutation `onError` | Toast: "Unauthorized" | — |
| 400 on markReady (unapproved blocks) | Backend | `useMarkReady` | Dialog listing unapproved blocks | Navigate to blocks |
| 400 on flag without notes | Frontend | Zod schema | Inline field error: "Notes required when flagging" | Add notes |
| 422 validation error | Backend | `api.request` | Toast with `detail` | Fix input |
| 500 server error | Backend | `api.request` | Toast: "Server error. Please retry." | Retry button |
| Network error (offline) | Browser | `api.request` / TanStack Query | Toast: "Connection lost" | Auto-retry 3× |
| WS close 4001 | Backend | `useJobStream` | Redirect to `/login` | Re-login |
| WS unexpected close | Network | `useJobStream` | "Reconnecting…" amber dot | Auto-reconnect once |
| File > 50MB | Frontend | UploadModal validation | Inline: "File must be under 50MB" | Select smaller file |
| Invalid file type | Frontend | UploadModal validation | Inline: "Only PDF and DOCX allowed" | Select valid file |
| PDF load failure | `react-pdf` | Error boundary / catch | "Unable to load document preview" | Retry download |
| Block patch failure | Backend | Mutation `onError` | Toast error, revert optimistic update | Retry action |

## 7. Full Security Map

| Attack Vector | Defense | Implementation Location |
|---|---|---|
| XSS (Reflected/Stored) | React auto-escapes HTML | All components — never use `dangerouslySetInnerHTML` |
| XSS via PDF | `react-pdf` renders to canvas/text layer | `app/(app)/documents/[id]/page.tsx` left panel |
| CSRF | Bearer token in header (not cookie) | `services/http.ts` — no cookies sent |
| Token Theft via XSS | `sessionStorage` (tab-scoped) | `stores/auth.store.ts` persist config |
| Token Theft via physical access | `sessionStorage` cleared on tab close | Browser default behavior |
| Unauthorized Admin Actions | UI hidden + backend 403 | `AdminOnly.tsx` + backend role checks |
| Missing Authentication | Client redirect + backend 401 | `AuthGuard.tsx` + `api.request` 401 handler |
| Token Expiry | Client-side `exp` check | `lib/auth.ts` `isTokenExpired()` + `AuthGuard` |
| Input Injection | Zod validation on all forms | Every `react-hook-form` with `zodResolver` |
| File Upload Abuse | Extension + size validation | `UploadModal.tsx` — `.pdf,.docx`, max 50MB |
| PDF CORS leak | Authenticated blob fetch | Fetch with Bearer → `URL.createObjectURL(blob)` |
| Secret Leak in Code | Env vars only | `.env.local` — never commit |
| Query Parameter Injection | Typed service layer | `services/*.ts` — no raw string concat |
| WebSocket Hijacking | Token validated by backend | `WS /stream?token=...` — backend validates, 4001 on invalid |
| Information Disclosure | Generic error messages to user | `api.request` logs detail in dev only |
| Race Conditions (optimistic) | Revert on error | TanStack Query `onError` revert in mutations |

## 8. Architecture Decisions Log

### State Management
- **✅ CHOSEN: Zustand (auth) + TanStack Query (server)** — Minimal boilerplate, excellent caching, built-in polling for jobs.
- **❌ REJECTED: Redux Toolkit** — Unnecessary complexity for a single auth slice and CRUD server state.
- **❌ REJECTED: Context API for server state** — No caching, no deduplication, no staleTime control.

### Authentication Storage
- **✅ CHOSEN: sessionStorage** — Spec requirement. Auto-cleared on tab close reduces physical-access attack surface.
- **❌ REJECTED: localStorage** — Spec explicitly forbids. Persists across sessions.
- **❌ REJECTED: httpOnly cookie** — Backend uses Bearer tokens, not cookies. Middleware cannot read sessionStorage.

### Data Fetching Transport
- **✅ CHOSEN: REST via custom ApiClient** — Backend is REST. Spec already defined clean service layer.
- **❌ REJECTED: GraphQL** — No GraphQL endpoint exists. Adds unnecessary bundle size (Apollo Client).
- **❌ REJECTED: tRPC** — Requires tRPC router on backend. Not available.

### Real-Time Transport
- **✅ CHOSEN: Native WebSocket** — Backend contract explicitly defines WS endpoint for job streaming.
- **❌ REJECTED: SSE** — Backend does not support SSE. WS also supports bidirectional if needed later.
- **❌ REJECTED: Polling-only** — Insufficient for live log streaming; spec requires WS.

### PDF Rendering
- **✅ CHOSEN: react-pdf** — Supports text layer, annotation layer, and authenticated blob loading.
- **❌ REJECTED: iframe/embed** — Cannot set `Authorization` headers, causing CORS/auth issues with backend file paths.

### Form Management
- **✅ CHOSEN: react-hook-form + Zod** — Spec requirement. Best performance (uncontrolled inputs) + type-safe validation.
- **❌ REJECTED: Formik** — Controlled inputs cause re-renders on every keystroke. More boilerplate.

### UI Foundation
- **✅ CHOSEN: Tailwind CSS + shadcn/ui primitives** — Spec provides exact design tokens. Tailwind utilities map 1:1 to token spec. shadcn provides accessible primitive behavior.
- **❌ REJECTED: CSS Modules** — Slower to iterate, harder to enforce token consistency across team.
- **❌ REJECTED: Material UI** — Would conflict with custom warm-stone palette and Space Grotesk typography.

### File Upload Progress
- **✅ CHOSEN: XMLHttpRequest with onprogress** — Only browser API that exposes upload progress events.
- **❌ REJECTED: fetch with ReadableStream** — Too complex for simple progress tracking. No native upload progress.

### Testing Strategy
- **✅ CHOSEN: Vitest + RTL** — Fast, modern, excellent TypeScript support, works with Next.js 14.
- **❌ REJECTED: Jest** — Slower, more config, struggles with ESM/modern packages.

### Theme / Dark Mode
- **✅ CHOSEN: CSS variables + class toggle** — `dark` class on `<html>`, CSS variables switch values. Zero flash if inline script runs before hydration.
- **❌ REJECTED: Tailwind darkMode: 'media'` — No manual toggle possible. Spec requires explicit toggle button.
