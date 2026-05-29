# react-frontend-app

A React 19 + TypeScript SPA built with Vite. Provides a full-featured web interface with authentication, role-based permissions, user management, and note management backed by a separate Python API service.

## Project Structure

```
react-frontend-app/
├── src/
│   ├── pages/                  # Route-level page components
│   │   ├── activate-account/   # Account activation flow
│   │   ├── home/               # Home dashboard
│   │   ├── login/              # Login form
│   │   ├── notes/              # Notes pages (admin + personal)
│   │   ├── profile/            # User profile
│   │   ├── register/           # Registration form
│   │   └── users/              # Users management (admin)
│   ├── layouts/                # Route wrapper layouts
│   │   ├── AuthorizedLayout.tsx  # Sidebar nav, auth guard, theme toggle
│   │   └── PublicLayout.tsx      # Wrapper for public-facing pages
│   ├── helpers/                # Shared utility modules
│   │   ├── api.ts              # API URL builder and response helpers
│   │   ├── authSession.ts      # Session storage, auth headers, logout
│   │   ├── sanitizeHtml.ts     # HTML sanitization utility
│   │   └── useDialogFocusTrap.ts # Reusable modal focus-trap hook
│   ├── interfaces/             # Shared TypeScript types
│   ├── App.tsx                 # Root component — router and route tree
│   ├── App.module.scss         # Scoped styles for App and layout
│   ├── main.tsx                # Entry point
│   └── index.css               # Global styles
├── public/                     # Static assets
├── scripts/
│   └── precommit.sh            # Pre-commit gate script
├── .githooks/
│   └── pre-commit              # Git hook that invokes precommit.sh
├── index.html                  # HTML entry point
├── vite.config.ts              # Vite configuration
├── Dockerfile                  # Multi-stage production image (Bun → Nginx)
├── docker-compose.yml          # Docker Compose — dev server in container
├── nginx.conf                  # Nginx static server config for production
├── .dockerignore               # Files excluded from Docker build context
├── bun.lock                    # Bun dependency lockfile
├── tsconfig.json               # TypeScript project references root
├── tsconfig.app.json           # TypeScript config for src/
├── tsconfig.node.json          # TypeScript config for Vite config
└── eslint.config.js            # ESLint flat config
```

## Tech Stack

| Category       | Technology                        |
| -------------- | --------------------------------- |
| Framework      | React 19                          |
| Language       | TypeScript 5.8                    |
| Build tool     | Vite 7                            |
| Routing        | React Router v6                   |
| Styling        | SCSS Modules (`sass`)             |
| Package manager | Bun 1.3.12                       |
| Linting        | ESLint 9 (flat config)            |
| Container      | Docker + Nginx                    |

## Prerequisites

- Bun 1.3.12 or newer
- Docker (required for the pre-commit gate and production image)

## Getting Started

```bash
# Install dependencies
bun install

# Start the development server
bun run dev
```

The app runs at `http://localhost:5173` by default.

## Backend Dependency

The app calls a separate backend API. By default, API requests use `http://localhost:4000`. Override this per environment with:

```bash
VITE_API_BASE_URL=https://api.example.com
```

Start the backend service before using any authenticated pages.

## Pages and Routes

| Route                | Access      | Description                                    |
| -------------------- | ----------- | ---------------------------------------------- |
| `/`                  | Public      | Redirects to `/login`                          |
| `/login`             | Public      | Login form                                     |
| `/register`          | Public      | Account registration form                      |
| `/activate-account`  | Public      | Account activation flow                        |
| `/home`              | Authorized  | Home dashboard                                 |
| `/my-notes`          | Authorized  | Personal notes list (`manage_own_notes`)        |
| `/my-notes/new`      | Authorized  | Create a new note                              |
| `/my-notes/:noteId`  | Authorized  | Edit an existing note                          |
| `/notes`             | Authorized  | All notes — admin view (`manage_notes`)        |
| `/profile`           | Authorized  | User profile page                              |
| `/users`             | Authorized  | Users management — admin view (`manage_users`) |

## Available Scripts

| Command              | Description                                          |
| -------------------- | ---------------------------------------------------- |
| `bun run dev`        | Start development server with HMR (port 5173)        |
| `bun run build`      | Type-check and produce a production build            |
| `bun run test:e2e`   | Run Cypress end-to-end tests                         |
| `bun run test:e2e:docker` | Run Cypress end-to-end tests in Docker          |
| `bun run cypress:open` | Open the Cypress app                               |
| `bun run preview`    | Serve the production build locally                   |
| `bun run lint`       | Run ESLint across all TypeScript source files        |
| `bun run precommit`  | Run the full pre-commit gate (lint and build)        |

## Git Hooks

This repo includes a tracked pre-commit hook in `.githooks/pre-commit`. Register it once after cloning:

```bash
git config core.hooksPath .githooks
```

Every commit triggers `bun run precommit`, which runs lint and a production build.

## Cypress

Cypress end-to-end tests live in `cypress/e2e`. Start the Vite dev server before running the suite:

```bash
bun run dev
bun run test:e2e
```

Use `bun run test:e2e:docker` to run the same suite in the official Cypress Docker image.

Cypress is intentionally not part of the pre-commit hook.

## Linting

Uses ESLint 9 flat config with:

- `typescript-eslint` (recommended rules)
- `eslint-plugin-react-hooks`
- `eslint-plugin-react-refresh`

```bash
bun run lint
```

To enable stricter type-aware lint rules, update `eslint.config.js` to use `tseslint.configs.recommendedTypeChecked` and add `parserOptions.project` pointing to both `tsconfig.app.json` and `tsconfig.node.json`.

## Build

```bash
bun run build
```

Output goes to `dist/`. The build step runs `tsc -b` first to type-check, then Vite bundles for production.

## Docker

The Dockerfile is a multi-stage build: a Bun stage builds the Vite app, then Nginx serves the static `dist/` output.

```bash
# Build the production image
docker build -t react-frontend-app .

# Run the container on http://localhost:5173
docker run --rm -p 5173:80 react-frontend-app

# Or build and run with Docker Compose (runs the Vite dev server)
docker compose up -d
docker compose down
```

The production container exposes port `80`. Docker Compose mounts the local source tree and runs the Vite dev server on host port `5173`.

## Architecture Notes

- **Routing and layouts:** `App.tsx` owns the `<BrowserRouter>` and splits routes into two layout groups — `PublicLayout` (login, register, activate-account) and `AuthorizedLayout` (all other pages). `AuthorizedLayout` acts as the auth guard: unauthenticated users are redirected to `/login`.
- **Auth:** Session state is stored in `localStorage` (`accessToken`, `tokenType`, `authUser`). `authSession.ts` provides helpers for reading/clearing the session, building `Authorization: Bearer` headers, and force-logging out on a 401.
- **Permissions:** Users have a `role` (`admin` | `user`) and an optional `permissions` array. Navigation links and page access are gated by `hasPermission()`. Admins default to all permissions; regular users default to `manage_own` and `manage_own_notes`.
- **Data fetching:** Pages use native `fetch()` with the `getApiUrl()` and `getAuthHeaders()` helpers. No shared state management library.
- **Styling:** SCSS Modules for component-scoped styles; `src/index.css` for global styles. Light/dark theme is toggled via a CSS class on the root element and persisted to `localStorage`.
- **Types:** Shared TypeScript types live in `src/interfaces/`. `User` carries `id`, `firstName`, `lastName`, `email`, `status`, `role`, `permissions`, and `avatarUrl`.
- **TypeScript config:** Split into three files — project references root (`tsconfig.json`), `tsconfig.app.json` for `src/`, and `tsconfig.node.json` for the Vite config file.

## Development Workflow

```bash
# 1. Install dependencies
bun install

# 2. Register the pre-commit hook (once after cloning)
git config core.hooksPath .githooks

# 3. Start the backend service (separate repo, port 4000)

# 4. Start the frontend dev server
bun run dev

# 5. Before committing — lint and build pass automatically via the hook
#    Run manually if needed:
bun run lint
bun run build
```

## Troubleshooting

**Users page shows nothing or errors in the console**
The backend at `http://localhost:4000` is not running. Start the backend service first.

**Authenticated pages redirect back to `/login`**
No session found in `localStorage`. Log in again.

**`bun run build` fails with type errors**
Run `bun run lint` to surface type issues first. Ensure all TypeScript errors in `src/` are resolved.

**Port 5173 already in use**
Another Vite dev server is running. Stop it or run `bun run dev -- --port 5174` to use a different port.

**Docker container starts but authenticated pages cannot load data**
API requests are made by your browser, not the container. Start the backend service on the host or set `VITE_API_BASE_URL` to a browser-reachable API origin.
