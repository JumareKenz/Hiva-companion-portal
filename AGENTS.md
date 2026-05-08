# AGENTS.md — HIVA Companion Portal

## Project Overview

- **Name:** HIVA Companion Portal
- **Purpose:** A production-grade tool used by verified government health personnel to review clinical documents, run a 9-step AI compile pipeline, and publish signed `.hiv` bundles to frontline health workers across Nigeria.
- **Users:** Verified health personnel with two roles — `reviewer` (can review/approve blocks) and `admin` (can compile, download, delete, activate releases).
- **Problem Solved:** Bridges the gap between raw clinical guidelines (PDF/DOCX) and structured, translated, cryptographically signed offline bundles deployable to frontline workers with no internet connectivity.
- **Reference:** Like a CI/CD pipeline (GitHub Actions) but for clinical content compilation, with a document review workflow similar to Google Docs suggestions + a release management system similar to App Store Connect.

## Tech Stack

| Layer | Technology | Version | Install Command |
|---|---|---|---|
| Framework | Next.js | 14.2.x | `npx create-next-app@14` |
| Language | TypeScript | 5.x | Included with Next.js |
| Styling | Tailwind CSS | 3.4.x | Included with Next.js |
| UI Primitives | shadcn/ui | latest | `npx shadcn-ui@latest init` |
| Server State | TanStack Query | 5.x | `npm install @tanstack/react-query@5 @tanstack/react-query-devtools` |
| Client State | Zustand | 4.x | `npm install zustand` |
| Forms | React Hook Form | 7.x | `npm install react-hook-form` |
| Validation | Zod | 3.x | `npm install zod @hookform/resolvers` |
| PDF | react-pdf | 7.x | `npm install react-pdf pdfjs-dist` |
| Dates | date-fns | 3.x | `npm install date-fns` |
| Icons | lucide-react | latest | `npm install lucide-react` |
| Toasts | sonner | 1.x | `npx shadcn-ui@latest add sonner` |
| Utilities | clsx, tailwind-merge, class-variance-authority | latest | `npm install clsx tailwind-merge class-variance-authority` |
| Testing | Vitest + React Testing Library | 1.x / 14.x | `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react` |

**Fonts (loaded via Google Fonts in `app/layout.tsx`):**
- `Space Grotesk:wght@400;500;600;700` — Display headlines, stat values, nav
- `Plus Jakarta Sans:opsz,wght@0,400;0,500;0,600;0,700` — Body text, labels, UI copy
- `JetBrains Mono:wght@400;500;600` — Mono for code, hashes, timestamps

## Design System (World-Class Visual Layer)

This project follows a deliberate, craft-oriented design system. Every visual decision is intentional — no generic defaults, no unconsidered gradients, no lazy spacing. The result must feel like a product from Linear, Vercel, or Stripe.

### Philosophy
- **Restraint over decoration**: Every element earns its place.
- **Hierarchy through contrast**: Size, weight, color, and space create clear reading order.
- **Atmosphere through depth**: Subtle textures, layered surfaces, and controlled blur create spatial context.
- **Motion with purpose**: Transitions guide attention and confirm interactions — never animate for decoration alone.

### Typography

**Font Families:**
- **Display**: `Space Grotesk` — Geometric, characterful, modern. Used for headings, stat values, and brand moments.
- **Body**: `Plus Jakarta Sans` — Refined, excellent legibility, slightly warmer than Inter. Used for all body text, labels, and UI copy.
- **Mono**: `JetBrains Mono` — Technical, readable at small sizes. Used for code, hashes, metadata, and data-dense tables.

**Type Scale (CSS Custom Properties):**
```
--font-size-xs:   0.75rem   (12px)  — captions, timestamps, badges
--font-size-sm:   0.875rem  (14px)  — body small, buttons, table cells
--font-size-base: 1rem      (16px)  — body text, inputs
--font-size-lg:   1.125rem  (18px)  — lead paragraphs, section subtitles
--font-size-xl:   1.25rem   (20px)  — card titles, h4
--font-size-2xl:  1.5rem    (24px)  — section headings, h3
--font-size-3xl:  1.875rem  (30px)  — page titles, h2
--font-size-4xl:  2.25rem   (36px)  — major headings, h1
--font-size-5xl:  3rem      (48px)  — display text, hero headlines
--font-size-6xl:  3.75rem   (60px)  — hero display (login page only)
```

**Font Weights:**
- `300` — Light (rare, used for large display text only)
- `400` — Regular (body text, descriptions)
- `500` — Medium (labels, buttons, emphasized body)
- `600` — Semibold (card titles, nav items, table headers)
- `700` — Bold (headings, stat values, display)

**Line Heights:**
- `1.1` — Headings (tight)
- `1.4` — Body (comfortable)
- `1.6` — Long-form text (generous)
- `1.25` — Labels, mono text (compact)

**Letter Spacing:**
- `-0.02em` — Display headings (tight, confident)
- `-0.01em` — Headings
- `0` — Body text
- `0.05em` — Labels, uppercase mono (generous, readable)
- `0.1em` — Badge text, tracking-widest

**Rules:**
- NEVER use `Inter`, `Roboto`, `system-ui`, or `Arial` as primary fonts.
- NEVER use the same weight for everything. Headings are 600–700, body is 400–500, labels are 500–600.

### Color System

**Dominant Palette (Warm Stone Neutrals — NOT cold slate):**
```css
:root {
  /* Backgrounds */
  --bg-primary:   #fafaf9;
  --bg-secondary: #f5f5f4;
  --bg-tertiary:  #e7e5e4;

  /* Surfaces */
  --surface:           #ffffff;
  --surface-raised:    #ffffff;
  --surface-overlay:   rgba(255, 255, 255, 0.72);
  --surface-floating:  #ffffff;
  --surface-inset:     #f0efed;

  /* Text */
  --text-primary:   #1c1917;
  --text-secondary: #44403c;
  --text-muted:     #78716c;
  --text-faint:     #a8a29e;
  --text-inverse:   #fafaf9;

  /* Borders */
  --border-subtle:  rgba(28, 25, 23, 0.06);
  --border-default: rgba(28, 25, 23, 0.10);
  --border-strong:  rgba(28, 25, 23, 0.18);
  --border-accent:  #155D46;

  /* Accent (ONE sharp accent — Deep Teal) */
  --accent-50:  #e6f3ef;
  --accent-100: #b3ddd2;
  --accent-200: #80c7b5;
  --accent-300: #4db198;
  --accent-400: #269b7e;
  --accent-500: #1a7056;  /* base */
  --accent-600: #155D46;  /* PRIMARY action color */
  --accent-700: #114a38;  /* pressed/hover dark */
  --accent-800: #0e3d2f;  /* deepest */
  --accent-900: #0a2e23;

  /* Secondary accent (Warm Amber/Tan — used sparingly) */
  --brand-tan: #C9A96E;

  /* Semantic */
  --success: #10b981;
  --warning: #f59e0b;
  --error:   #ef4444;
  --info:    #3b82f6;

  /* Elevation (controlled, never heavy) */
  --shadow-xs:  0 1px 2px 0 rgba(28, 25, 23, 0.04);
  --shadow-sm:  0 1px 3px 0 rgba(28, 25, 23, 0.06), 0 1px 2px -1px rgba(28, 25, 23, 0.04);
  --shadow-md:  0 4px 6px -1px rgba(28, 25, 23, 0.05), 0 2px 4px -2px rgba(28, 25, 23, 0.03);
  --shadow-lg:  0 10px 15px -3px rgba(28, 25, 23, 0.06), 0 4px 6px -4px rgba(28, 25, 23, 0.03);
  --shadow-xl:  0 20px 25px -5px rgba(28, 25, 23, 0.07), 0 8px 10px -6px rgba(28, 25, 23, 0.04);
  --shadow-glow: 0 0 20px rgba(21, 93, 70, 0.15);

  /* Focus rings */
  --focus-ring:        0 0 0 3px rgba(21, 93, 70, 0.25);
  --focus-ring-error:  0 0 0 3px rgba(239, 68, 68, 0.25);
  --focus-ring-offset: 2px;

  /* Motion */
  --duration-fast:   150ms;
  --duration-base:   250ms;
  --duration-slow:   350ms;
  --ease-out-expo:   cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out:     cubic-bezier(0.4, 0, 0.2, 1);
  --ease-spring:     cubic-bezier(0.34, 1.56, 0.64, 1);

  /* Atmosphere */
  --noise-opacity: 0.025;
  --gradient-hero: linear-gradient(135deg, #fafaf9 0%, #f0efed 50%, #e7e5e4 100%);
  --gradient-subtle: linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(245,245,244,0.8) 100%);
}

[data-theme="dark"] {
  --bg-primary:   #0c0a09;
  --bg-secondary: #1c1917;
  --bg-tertiary:  #292524;

  --surface:           #1c1917;
  --surface-raised:    #23201e;
  --surface-overlay:   rgba(28, 25, 23, 0.72);
  --surface-floating:  #292524;
  --surface-inset:     #141210;

  --text-primary:   #f5f5f4;
  --text-secondary: #d6d3d1;
  --text-muted:     #a8a29e;
  --text-faint:     #78716c;
  --text-inverse:   #1c1917;

  --border-subtle:  rgba(255, 255, 255, 0.06);
  --border-default: rgba(255, 255, 255, 0.10);
  --border-strong:  rgba(255, 255, 255, 0.18);

  --shadow-xs:  0 1px 2px 0 rgba(0, 0, 0, 0.20);
  --shadow-sm:  0 1px 3px 0 rgba(0, 0, 0, 0.25), 0 1px 2px -1px rgba(0, 0, 0, 0.15);
  --shadow-md:  0 4px 6px -1px rgba(0, 0, 0, 0.30), 0 2px 4px -2px rgba(0, 0, 0, 0.20);
  --shadow-lg:  0 10px 15px -3px rgba(0, 0, 0, 0.35), 0 4px 6px -4px rgba(0, 0, 0, 0.25);
  --shadow-xl:  0 20px 25px -5px rgba(0, 0, 0, 0.40), 0 8px 10px -6px rgba(0, 0, 0, 0.30);
  --shadow-glow: 0 0 20px rgba(21, 93, 70, 0.25);

  --gradient-hero: linear-gradient(135deg, #0c0a09 0%, #141210 50%, #1c1917 100%);
  --gradient-subtle: linear-gradient(180deg, rgba(12,10,9,0) 0%, rgba(28,25,23,0.8) 100%);
}
```

**Usage Rules:**
- NEVER use raw hex values in components. Always use CSS custom properties.
- NEVER use `bg-white` or `bg-black`. Use `--bg-primary`, `--surface`, `--text-primary`.
- The accent color `--accent-600` is the ONE sharp accent. Use it sparingly for primary actions, active states, and key data highlights.
- `--brand-tan` is a secondary accent used ONLY for: sidebar highlight borders, trust badges, and decorative accents.
- Semantic colors (`--success`, `--warning`, `--error`, `--info`) are reserved exclusively for status indicators, validation messages, and alerts.

### Spacing System (8pt Grid)

All spacing values MUST be multiples of 4px. The base unit is `4px` (`--space-1`).

```css
--space-0:  0px;
--space-1:  4px;
--space-2:  8px;
--space-3:  12px;
--space-4:  16px;
--space-5:  20px;
--space-6:  24px;
--space-8:  32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
--space-24: 96px;
```

**Usage Rules:**
- Padding inside cards: `--space-5` (20px) or `--space-6` (24px).
- Gap between related elements: `--space-3` (12px) or `--space-4` (16px).
- Gap between sections: `--space-8` (32px) or `--space-10` (40px).
- Page horizontal padding: `--space-6` to `--space-10` depending on breakpoint.
- NEVER use arbitrary pixel values like `13px`, `17px`, or `23px`. Round to the nearest 4px.

### Border Radius System

Intentional variation creates visual interest and hierarchy:
```css
--radius-none: 0px;     /* tables, full-width bars */
--radius-sm:   6px;     /* small buttons, tags, inline chips */
--radius-md:   8px;     /* inputs, small cards, dropdowns */
--radius-lg:   12px;    /* standard cards, modals, panels */
--radius-xl:   16px;    /* hero cards, feature panels */
--radius-2xl:  20px;    /* floating elements, large modals */
--radius-full: 9999px;  /* avatars, badges, pills */
```

**Usage Rules:**
- Buttons: `--radius-sm` (6px) for standard, `--radius-md` (8px) for large/hero buttons.
- Cards: `--radius-lg` (12px) for standard cards, `--radius-xl` (16px) for elevated/featured cards.
- Modals/Dialogs: `--radius-xl` (16px) or `--radius-2xl` (20px).
- Inputs: `--radius-md` (8px).
- NEVER use `rounded-lg` for everything. Vary radius based on element importance and container size.

### Elevation System

Elevation is created through a combination of **background color shifts**, **borders**, and **subtle shadows** — never heavy drop shadows alone.

| Level | Background | Border | Shadow | Use Case |
|---|---|---|---|---|
| **Base** | `--surface` | `1px solid var(--border-subtle)` | none | Static cards, panels |
| **Raised** | `--surface-raised` | `1px solid var(--border-default)` | `var(--shadow-sm)` | Hoverable cards, interactive tiles |
| **Floating** | `--surface-floating` | `1px solid var(--border-default)` | `var(--shadow-md)` | Dropdowns, popovers, menus |
| **Overlay** | `--surface-overlay` | `1px solid var(--border-default)` | `var(--shadow-lg)` | Modals, dialogs, toasts |
| **Inset** | `--surface-inset` | `1px solid var(--border-subtle) inset` | `inset var(--shadow-xs)` | Form fields, code blocks, terminals |

**Glass/Blur Pattern:**
For floating elements over content (modals, dropdowns, topbar):
```css
background: var(--surface-overlay);
backdrop-filter: blur(20px) saturate(180%);
-webkit-backdrop-filter: blur(20px) saturate(180%);
border: 1px solid var(--border-default);
```

### Atmosphere & Depth

**Background Texture:**
A subtle noise overlay is applied to the main background to prevent flatness:
```css
background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
background-size: 128px 128px;
opacity: var(--noise-opacity);
pointer-events: none;
```

**Mesh Gradient (Hero Areas Only):**
For the login left panel and dashboard hero, use a layered radial gradient:
```css
background:
  radial-gradient(ellipse 80% 50% at 20% 40%, rgba(21, 93, 70, 0.08), transparent),
  radial-gradient(ellipse 60% 40% at 80% 20%, rgba(201, 169, 110, 0.05), transparent),
  var(--bg-primary);
```

**Ambient Glow (Accent Elements):**
For active/primary elements, a subtle glow creates focus:
```css
box-shadow: var(--shadow-glow);
```

### Motion & Micro-interactions

**Transition Defaults:**
All interactive elements must have transitions:
```css
transition: background-color var(--duration-base) var(--ease-out-expo),
            border-color var(--duration-base) var(--ease-out-expo),
            color var(--duration-fast) var(--ease-out-expo),
            transform var(--duration-base) var(--ease-spring),
            box-shadow var(--duration-base) var(--ease-out-expo);
```

**Button Hover States:**
- **Primary**: `background` shifts to `--accent-500`, `translateY(-1px)`, subtle `shadow-glow` appears.
- **Secondary**: `background` shifts to `--bg-secondary`, border darkens slightly.
- **Ghost**: `background` shifts to `--bg-secondary`, text shifts to `--text-primary`.
- **Destructive**: `background` shifts to `red-600` (darker red).

**Card Hover States:**
- `translateY(-2px)` — subtle lift
- `box-shadow` elevates from level to level+1
- `border-color` shifts to `--border-strong`
- Duration: `--duration-base`

**Focus States:**
- All focusable elements: `outline: none`, then `box-shadow: var(--focus-ring)`.
- Focus ring color matches the element's intent (accent for primary, error for invalid).
- Focus ring offset: `--focus-ring-offset`.

**Stagger Entrance Animations:**
For page sections on load:
```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
.entrance { animation: fadeInUp 0.5s var(--ease-out-expo) both; }
.entrance-d1 { animation-delay: 0.05s; }
.entrance-d2 { animation-delay: 0.10s; }
.entrance-d3 { animation-delay: 0.15s; }
.entrance-d4 { animation-delay: 0.20s; }
.entrance-d5 { animation-delay: 0.25s; }
.entrance-d6 { animation-delay: 0.30s; }
```

**Loading States:**
- Skeletons use a shimmer animation with `background-size: 200% 100%` and `animation: shimmer 1.5s infinite linear`.
- Spinners use `animation: spin 1s linear infinite` on the icon.
- Progress bars use `transition: width var(--duration-slow) var(--ease-out-expo)`.

**Toast Notifications:**
- Enter: `translateY(-100%)` → `translateY(0)` with `opacity 0→1`, duration 300ms, ease spring.
- Exit: `translateY(0)` → `translateY(-100%)` with `opacity 1→0`, duration 200ms.

### Dark / Light Mode

**Implementation:**
- Root element: `<html data-theme="light">` or `<html data-theme="dark">`.
- CSS custom properties swap automatically based on `[data-theme]` attribute.
- All color references in components use `var(--*)` — never hardcoded values.

**Theme Toggle:**
- Location: Topbar, right side.
- Appearance: Animated icon toggle (Sun ↔ Moon) with smooth rotation.
- Persistence: `localStorage` key `hiva-theme`.
- First load: Check `localStorage`, fallback to `prefers-color-scheme`.
- Transition: `transition: background-color 0.2s var(--ease-in-out), color 0.2s var(--ease-in-out)` on `body` and `html`.
- No flash: Inline script in `<head>` sets theme before React hydrates.

### Component Design Rules

**Buttons:**
```
Base:    inline-flex, items-center, justify-center, gap-2, font-medium, rounded-sm
         transition-all, duration-base, focus:outline-none, focus:ring-2
Primary: bg-accent-600, text-inverse, hover:bg-accent-500, hover:-translate-y-px,
         hover:shadow-glow, active:bg-accent-700, active:translate-y-0
Secondary: bg-transparent, border border-default, text-primary, hover:bg-bg-secondary
Ghost:   bg-transparent, text-secondary, hover:bg-bg-secondary, hover:text-primary
Destructive: bg-error, text-inverse, hover:bg-red-600, active:bg-red-700
```

**Inputs:**
```
Base:    w-full, bg-surface, border border-default, rounded-md, px-3, py-2.5,
         text-base, text-primary, placeholder:text-faint,
         focus:outline-none, focus:border-accent-600, focus:ring-focus-ring,
         transition-colors, disabled:opacity-50
Error:   border-error, focus:ring-focus-ring-error
```

**Cards:**
```
Base:    bg-surface, border border-subtle, rounded-lg
Raised:  bg-surface-raised, border border-default, rounded-lg,
         shadow-sm, hover:shadow-md, hover:-translate-y-0.5,
         transition-all duration-base
Overlay: bg-surface-overlay, backdrop-blur-xl, border border-default,
         shadow-lg, rounded-xl
```

**Badges:**
```
Base:    inline-flex, items-center, gap-1.5, rounded-full, px-2.5, py-0.5,
         text-xs, font-mono, font-medium
Accent:  bg-accent-600/10, text-accent-600
Success: bg-success/10, text-success
Warning: bg-warning/10, text-warning
Error:   bg-error/10, text-error
Ghost:   border border-default, text-muted
```

## Complete Folder Tree

```
hiva-compiler-frontend/
├── app/                          # Next.js App Router
│   ├── (app)/                    # Authenticated route group
│   │   ├── layout.tsx            # App shell: Sidebar + Topbar + AuthGuard + QueryClientProvider
│   │   ├── page.tsx              # Dashboard (/)
│   │   ├── documents/
│   │   │   ├── page.tsx          # Document Queue (/documents)
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Document Review (/documents/:id)
│   │   ├── jobs/
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Compile Job (/jobs/:id)
│   │   ├── bundles/
│   │   │   └── page.tsx          # Compiled Bundles (/bundles)
│   │   ├── sources/
│   │   │   └── page.tsx          # Chunk Library (/sources)
│   │   ├── audit/
│   │   │   └── page.tsx          # Audit Log stub (/audit)
│   │   ├── deployments/
│   │   │   └── page.tsx          # Deployments stub (/deployments)
│   │   └── settings/
│   │       └── page.tsx          # Settings (/settings)
│   ├── (auth)/                   # Unauthenticated route group
│   │   └── login/
│   │       └── page.tsx          # Login (/login)
│   ├── layout.tsx                # Root layout: Google Fonts, theme script, Sonner Toaster
│   └── globals.css               # Tailwind directives, CSS variables, animations, component utility classes
├── components/                   # Shared UI components
│   ├── ui/                       # Atomic UI components (no business logic)
│   │   ├── StatusBadge.tsx       # Document/Job status mapping to badge styles
│   │   ├── ConfidenceBar.tsx     # 0-1 score bar with color coding
│   │   ├── Avatar.tsx            # Initials avatar with deterministic colors
│   │   ├── StatCard.tsx          # Dashboard stat card with optional trend
│   │   ├── EmptyState.tsx        # Centered empty state with icon + action
│   │   ├── FileTypeBadge.tsx     # .pdf / .docx colored badge
│   │   ├── Pagination.tsx        # Page navigation with ellipsis
│   │   └── SkeletonLoader.tsx    # Shimmer skeleton variants
│   ├── layout/                   # Shell components
│   │   ├── Sidebar.tsx           # 240px fixed dark sidebar with navigation
│   │   └── Topbar.tsx            # Sticky top bar with breadcrumb + actions
│   └── guards/
│       └── AdminOnly.tsx         # Conditionally renders children based on role
├── features/                     # Domain-specific modules (hooks + local components)
│   ├── auth/
│   │   ├── hooks/
│   │   │   └── useAuth.ts        # login/logout + /me query
│   │   └── components/
│   │       └── AuthGuard.tsx     # Client-side auth protection
│   ├── documents/
│   │   ├── hooks/
│   │   │   └── useDocuments.ts   # CRUD + upload + compile mutations
│   │   └── components/
│   │       ├── UploadModal.tsx   # File upload dialog with progress
│   │       └── CompileModal.tsx  # Language selection compile trigger
│   ├── blocks/
│   │   ├── hooks/
│   │   │   └── useBlockActions.ts # Block patch + reprocess mutations
│   │   └── components/
│   │       └── BlockCard.tsx     # Individual block review card
│   ├── jobs/
│   │   ├── hooks/
│   │   │   └── useJobStream.ts   # WebSocket hook for live logs
│   │   └── components/
│   │       ├── StepTracker.tsx   # 9-step horizontal progress
│   │       └── LogStream.tsx     # Terminal-style log panel
│   ├── releases/
│   │   └── hooks/
│   │       └── useReleases.ts    # Release list + activate mutation
│   └── chunks/
│       └── hooks/
│           └── useChunks.ts      # Chunk library + stats queries
├── hooks/                        # Cross-cutting hooks
│   ├── usePermissions.ts         # Role-based permission helpers
│   └── useTheme.ts               # Dark mode toggle + persistence
├── lib/                          # Utilities & configuration
│   ├── auth.ts                   # JWT decode, isTokenExpired, getTokenClaims
│   ├── theme.ts                  # getTheme, setTheme, system preference fallback
│   └── queryClient.ts            # TanStack Query client with default options
├── services/                     # API service layer — NO raw fetch in components
│   ├── http.ts                   # Base ApiClient: Bearer injection, 401 handling, blob support
│   ├── auth.service.ts           # POST /auth/login (form-urlencoded), /auth/refresh, /auth/me
│   ├── documents.service.ts      # Upload, list, get, ready, delete, compile
│   ├── blocks.service.ts         # List by doc, patch, reprocess
│   ├── jobs.service.ts           # List, get, download
│   ├── releases.service.ts       # List, activate
│   ├── chunks.service.ts         # List, stats
│   ├── hiv.service.ts            # Version, download, error-report
│   └── health.service.ts         # Health check
├── stores/
│   └── auth.store.ts             # Zustand auth store: token + user, sessionStorage persist
├── types/
│   ├── enums.ts                  # String literal unions: DocumentStatus, BlockType, JobStep, Language, Role, etc.
│   └── common.ts                 # Interfaces: User, Document, Block, CompileJob, HivRelease, PaginatedResponse, ApiError, etc.
├── TEMPLATES/                    # Code generation templates for agents
│   ├── component.template
│   ├── hook.template
│   ├── service.template
│   ├── api-route.template
│   ├── test.template
│   ├── store-slice.template
│   └── schema.template
└── PROMPTS/
    └── startup.md                # Agent session startup script
```

## Code Style Rules

### ALWAYS
- Use **functional components** with named exports.
- Use **TypeScript strict mode** — no `any`, no `ts-ignore`, no implicit any.
- Define **props interfaces** for every component: `interface [ComponentName]Props { ... }`.
- Use **`clsx` + `tailwind-merge`** for conditional Tailwind classes (via `cn()` utility).
- Co-locate tests: `ComponentName.test.tsx` in the same folder as `ComponentName.tsx`.
- Use **`async/await`** over `.then()` chains in service/hook logic.
- Destructure props in function parameters: `function MyComponent({ prop1, prop2 }: MyComponentProps)`.
- Use **early returns** for guard clauses to reduce nesting.
- Use **template literals** for dynamic class names when `cn()` is insufficient.
- Apply **design tokens** for ALL colors, spacing, radius, shadows, and transitions. Never hardcode values.
- Add **motion** to every interactive element: `transition` with `--duration-base` and `--ease-out-expo`.

### NEVER
- Never use `var`. Use `const` by default, `let` only for reassignment.
- Never use `any` type. Use `unknown` with type guards if the type is truly unknown.
- Never use `ts-ignore`. If you must suppress, use `ts-expect-error` with a comment explaining why.
- Never write raw `fetch` in components or pages. Always use the service layer (`services/*.ts`).
- Never store the auth token in `localStorage`. Only `sessionStorage` via Zustand persist.
- Never use `dangerouslySetInnerHTML`. All content renders as React children/text nodes.
- Never leave `console.log` in production code. Use `console.error` only for actual errors in `catch` blocks.
- Never import from `@/components/ui` inside `features/` components — import specific files to avoid barrel file issues.
- Never create barrel `index.ts` files. Import from the specific file path.
- Never use `bg-white`, `bg-black`, `text-black`, `text-white`, or `shadow-md` as generic defaults. Use design tokens.
- Never use `Inter`, `Roboto`, `system-ui`, or `Arial` as primary fonts.
- Never use `rounded-lg` for every element. Vary radius intentionally per the Border Radius System.
- Never apply heavy box-shadows (`shadow-lg` and above) without a specific elevation reason.

## Naming Conventions

| Item | Convention | Example |
|---|---|---|---|
| Files (components) | PascalCase | `StatusBadge.tsx` |
| Files (hooks) | camelCase with `use` prefix | `useDocuments.ts` |
| Files (services) | camelCase with `.service.ts` suffix | `documents.service.ts` |
| Files (stores) | camelCase with `.store.ts` suffix | `auth.store.ts` |
| Files (types) | camelCase with `.ts` suffix | `common.ts` |
| Files (utils) | camelCase | `queryClient.ts` |
| Files (pages) | kebab-case if multi-word | `compile-modal.tsx` (but prefer single word) |
| Variables | camelCase | `const currentUser = ...` |
| Functions | camelCase, verb prefix | `function handleSubmit() {...}` |
| Boolean variables | is/has/should prefix | `const isLoading = true` |
| Types/Interfaces | PascalCase | `interface CompileJob { ... }` |
| Constants (module-level) | UPPER_SNAKE_CASE | `const MAX_FILE_SIZE_MB = 50` |
| CSS Classes (custom) | kebab-case | `fade-in-up` |
| Tailwind arbitrary values | Only when token missing | `w-[420px]` (for sidebar only) |

## Component Conventions

Every component file must follow this exact vertical order:

1. **Imports** (ordered per Import Order Rules below)
2. **Types/Interfaces** (`interface Props { ... }`)
3. **Constants** (module-level constants, config maps)
4. **Helper functions** (pure functions used only in this file)
5. **Component function** (exported default or named)
6. **Sub-components** (if small and co-located)
7. **Styles** (none — use Tailwind utility classes exclusively, referencing design tokens)

Example:
```tsx
// 1. Imports
import React from 'react'
import { cn } from '@/lib/utils'

// 2. Types
interface ButtonProps {
  variant?: 'primary' | 'secondary'
  children: React.ReactNode
}

// 3. Constants
const VARIANT_CLASSES = {
  primary: 'bg-[var(--accent-600)] text-[var(--text-inverse)] hover:bg-[var(--accent-500)] hover:-translate-y-px hover:shadow-[var(--shadow-glow)]',
  secondary: 'bg-transparent border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]',
} as const

// 5. Component
export function Button({ variant = 'primary', children }: ButtonProps) {
  return (
    <button className={cn(
      'inline-flex items-center justify-center gap-2 font-medium rounded-sm transition-all duration-[var(--duration-base)]',
      VARIANT_CLASSES[variant]
    )}>
      {children}
    </button>
  )
}
```

## Import Order Rules

Within every file, imports must be grouped in this order with a blank line between groups:

1. **React and Next.js** built-ins: `react`, `next/*`
2. **Third-party libraries**: `@tanstack/react-query`, `zustand`, `lucide-react`, etc.
3. **Absolute project imports** (`@/*`): `@/types/*`, `@/services/*`, `@/stores/*`, `@/lib/*`, `@/hooks/*`
4. **Relative imports** (`./`, `../`): sibling/child components, local hooks
5. **Types-only imports** last within their group (if not using `import type`)

Example:
```tsx
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'

import { useAuthStore } from '@/stores/auth.store'
import { documentsService } from '@/services/documents.service'
import type { Document } from '@/types/common'

import { DocumentRow } from './DocumentRow'
```

## State Management Rules

### What goes in Zustand (auth.store.ts ONLY):
- `token`: JWT string | null
- `user`: User object | null
- `setToken`, `setUser`, `clearToken`, `isAdmin`

### What goes in TanStack Query:
- Every server entity list: documents, blocks, jobs, releases, chunks
- Every single entity fetch: document by id, job by id
- Computed stats: chunk stats, health check
- Mutation results (invalidate on success)

### What goes in local `useState`:
- UI ephemeral state: modal open/closed, dropdown open, current page number
- Form intermediate state before submission (but prefer `react-hook-form`)
- Focus state: focused block index, selected text range
- Local filters that don't need URL sync (debounced search input value)

### Adding New State:
1. Is it server data? → TanStack Query hook in `features/[domain]/hooks/`
2. Is it auth-related? → Zustand store (but auth store is complete; do not expand)
3. Is it UI-only and local? → `useState` in the component
4. Is it shared UI state across routes? → Consider URL search params first, then Zustand (rarely needed)

## Data Fetching Rules

### Pattern:
1. Define the service function in `services/[domain].service.ts` using `api.request()` or `api.get/post/patch/delete/upload/download()`.
2. Define the hook in `features/[domain]/hooks/use[Domain].ts` using `useQuery` or `useMutation`.
3. Use the hook in the page component. Never call `api.*` directly from a page/component.

### Loading States:
- Lists: Use `SkeletonLoader` with the exact same dimensions as the loaded content (no layout shift).
- Single entities: Use `SkeletonLoader` or a full-page spinner if critical.
- Buttons: Use `disabled` state + `Loader2` icon spin during mutation.

### Error States:
- Lists: Show `EmptyState` with retry action if error.
- Pages: Show inline error message with retry button.
- Mutations: Show Sonner toast with the `ApiError.detail` message.

### StaleTime Configuration (enforced):
- Documents list: `staleTime: 30 * 1000`
- Single document: `staleTime: 10 * 1000`
- Blocks: `staleTime: 5 * 1000`
- Jobs list: `staleTime: 3 * 1000`
- Single job: `refetchInterval: (query) => query.state.data?.status === 'running' ? 3000 : false`
- Releases: `staleTime: 60 * 1000`
- Chunks stats: `staleTime: 120 * 1000`

## Authentication Rules

### How Auth Works:
1. User submits credentials → `authService.login()` POSTs `application/x-www-form-urlencoded`.
2. On success: `useAuthStore.getState().setToken(access_token)`.
3. Immediately fetch `GET /api/auth/me` → `setUser(user)`.
4. `AuthGuard` wraps all `(app)` routes. On mount:
   - No token → redirect `/login`
   - Token expired → `clearToken()` → redirect `/login`
   - Token valid but no user → fetch `/me`
5. `api.request()` injects `Authorization: Bearer ${token}` on every request.
6. On 401 response: `clearToken()` → `window.location.href = '/login'`.

### Route Protection:
- `(app)` layout wraps children in `<AuthGuard>`.
- `/login` page checks for valid token on mount; if present, redirects `/`.
- Admin actions use `<AdminOnly>` component to hide UI. Backend must also return 403 for unauthorized actions.

### Token Rules:
- Decode via `lib/auth.ts` `decodeJwt()` (base64 decode, NO signature verification — backend verifies).
- Check expiry via `isTokenExpired()` (compare `exp` claim to `Date.now() / 1000`).
- Token lives in Zustand memory + `sessionStorage` for refresh survival.
- Never log the token. Never put it in URLs (except WS query param as required by spec).

## Security Rules

### Input Validation:
- Every form uses Zod schema + `react-hook-form` resolver.
- File uploads: restrict to `.pdf,.docx`, max 50MB (validate before submit).
- Block patch: `reviewer_notes` is required when `status === 'flagged'` (Zod conditional or manual check).

### Sanitization:
- React handles XSS sanitization. Do NOT use `dangerouslySetInnerHTML`.
- PDF content is rendered inside `react-pdf` canvas/text layers — no HTML injection.

### Secrets:
- Backend URL in `.env.local` as `NEXT_PUBLIC_API_URL`.
- Never commit `.env.local`. Provide `.env.local.example` only.
- No API keys or secrets in client-side code.

### Auth Guards:
- Client: `AdminOnly` component, `usePermissions` hook.
- Server: Every admin endpoint returns 403 if `role !== 'admin'`.
- `AuthGuard` redirects before rendering protected content.

## Error Handling Rules

### Service Layer (`services/http.ts`):
- On `!res.ok`: parse JSON error body, throw `{ status, message, detail }` as `ApiError`.
- On `res.status === 401`: clear token, redirect login, then throw.
- On `res.status === 204`: return `undefined`.
- On blob requests: return `res.blob()` directly.

### Hook Layer (`features/*/hooks/*.ts`):
- Wrap mutations in `try/catch` or use `onError` callback.
- Extract `ApiError.detail` for user-facing messages.
- Call `toast.error()` with the detail message.

### Component Layer:
- Use `useQuery`'s `isError` + `error` states to show inline errors.
- Use `EmptyState` for empty lists, not error states (unless fetch failed).
- Use `SkeletonLoader` for loading; never show "Loading..." text without a skeleton.

### Special Errors:
- **400 on /ready**: Show `Dialog` with list of unapproved blocks. Do NOT show a generic toast.
- **WS 4001**: Redirect to login immediately.
- **Network failure**: TanStack Query retries 3× automatically. Show toast only after final failure.

## Testing Rules

### What Must Be Tested:
- Every utility function in `lib/`.
- Every service function (mock `fetch`).
- Every hook (mock API client, wrap in QueryClientProvider).
- Every UI component that has conditional rendering logic (loading/error/empty states).
- Auth guard behavior (redirect on missing token).

### What NOT to Test:
- Pure presentational components with no logic (StatusBadge, Avatar).
- Third-party library internals.
- CSS/styling (Tailwind classes).
- Design token values (they are declarative, not logic).

### Test File Naming:
- Co-located: `MyComponent.test.tsx` next to `MyComponent.tsx`.
- Or `__tests__/my-component.test.tsx` for page-level tests.

### Test Structure:
```tsx
describe('FeatureName', () => {
  describe('happy path', () => {
    it('should do the expected thing', () => { ... })
  })

  describe('edge cases', () => {
    it('should handle empty input', () => { ... })
  })

  describe('failure cases', () => {
    it('should throw on invalid input', () => { ... })
  })
})
```

### Mocking:
- Mock `services/http.ts` for unit tests (do not hit real API).
- Mock `next/navigation` for router-dependent components.
- Mock `zustand` stores by resetting state in `beforeEach`.

## Performance Rules

### Lazy Loading:
- `react-pdf` and PDF viewer components MUST be loaded with `next/dynamic` and `{ ssr: false }`.
- Modals can be lazy-loaded if they are heavy, but keep simple modals inline.

### Memoization:
- Use `React.memo()` for list item components that receive stable IDs (e.g., `BlockCard`, `DocumentRow`).
- Use `useMemo()` for expensive computations (e.g., filtering/sorting large arrays).
- Use `useCallback()` for event handlers passed to memoized children.

### Debounce:
- Search inputs: 400ms debounce before triggering query.
- Block auto-save: 30s debounce on content changes.
- Window resize: 200ms debounce if measuring DOM.

### Image Optimization:
- This project has no user-uploaded images (only PDF/DOCX). No `next/image` needed for content.
- Icons come from `lucide-react` (SVG, no optimization needed).

### List Virtualization:
- Not required for MVP. Block lists max 50 per page. Document lists max 20 per page.
- If chunk library grows beyond 1000 rows, implement virtualization later (note in PROGRESS.md).

## Git Commit Format

Use **Conventional Commits**:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, missing semicolons, etc (no code change)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `test`: Adding or correcting tests
- `chore`: Build process, dependencies, tooling

Examples:
```
feat(documents): add upload modal with XHR progress tracking
fix(auth): redirect to login on 401 websocket close
docs(readme): add keyboard shortcuts section
```
