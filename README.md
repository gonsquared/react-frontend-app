# react-frontend-app

A React 19 + TypeScript frontend built with Vite. Renders a two-page SPA with navigation and a users table that pulls data from a separate backend API.

## Project Structure

```
react-frontend-app/
├── src/
│   ├── pages/          # Route-level page components
│   ├── interfaces/     # Shared TypeScript types
│   ├── App.tsx         # Root component — router, nav, layout
│   ├── App.module.scss # Scoped styles for App layout
│   ├── main.tsx        # Entry point
│   └── index.css       # Global styles
├── public/             # Static assets
├── index.html          # HTML entry point
├── vite.config.ts      # Vite configuration
├── Dockerfile          # Production Docker image build
├── docker-compose.yml  # Docker Compose service definition
├── nginx.conf          # Nginx static server config for Docker
├── .dockerignore       # Files excluded from Docker build context
├── bun.lock            # Bun dependency lockfile
├── tsconfig.json       # TypeScript project references root
├── tsconfig.app.json   # TypeScript config for src files
├── tsconfig.node.json  # TypeScript config for Vite config file
└── eslint.config.js    # ESLint flat config
```

## Tech Stack

| Category   | Technology                        |
| ---------- | --------------------------------- |
| Framework  | React 19                          |
| Language   | TypeScript 5.8                    |
| Build tool | Vite 7                            |
| Routing    | React Router v6                   |
| Styling    | SCSS Modules (`sass`)             |
| Linting    | ESLint 9 (flat config)            |
| Container  | Docker + Nginx                    |

## Prerequisites

- Bun 1.3.12 or newer

## Getting Started

```bash
# Install dependencies
bun install

# Start the development server
bun run dev
```

The app runs at `http://localhost:5173` by default.

## Backend Dependency

The app calls a separate backend API. By default, API requests use
`http://localhost:4000`. Override this per environment with:

```bash
VITE_API_BASE_URL=https://api.example.com
```

Start the backend service before using authenticated pages.

## Pages

| Route    | Component                                                        | Description                           |
| -------- | ---------------------------------------------------------------- | ------------------------------------- |
| `/`      | [src/pages/HomePage.tsx](src/pages/HomePage.tsx)                 | Home page                             |
| `/users` | [src/pages/UsersPage.tsx](src/pages/UsersPage.tsx)               | Fetches and displays users in a table |

## Available Scripts

| Command           | Description                                    |
| ----------------- | ---------------------------------------------- |
| `bun run dev`     | Start development server with HMR (port 5173)  |
| `bun run build`   | Type-check and produce a production build      |
| `bun run preview` | Serve the production build locally             |
| `bun run lint`    | Run ESLint across all TypeScript source files  |
| `bun run precommit` | Run lint, build, component tests, and e2e tests |
| `bun run test`    | Run Cypress component tests                    |
| `bun run test:e2e` | Run Cypress end-to-end tests                  |

## Git Hooks

This repo includes a tracked pre-commit hook in `.githooks/pre-commit`.

```bash
git config core.hooksPath .githooks
```

After that, every commit from `react-frontend-app` runs:

```bash
bun run precommit
```

The hook runs lint, build, Cypress component tests, and Cypress e2e tests. The
Cypress runs use the `cypress/included:15.15.0` Docker image so the browser
environment is consistent; Docker must be running before committing.

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

The Docker image builds the Vite app in a Bun stage, then serves the static `dist/` output with Nginx.

```bash
# Build the production image
docker build -t react-frontend-app .

# Run the container on http://localhost:5173
docker run --rm -p 5173:80 react-frontend-app

# Or build and run with Docker Compose
docker compose up -d
```

The production container exposes port `80`. The examples above map it to host port `5173`. Docker Compose runs the Vite dev server directly on host port `5173`.

API requests are made by the browser. When running the container locally, keep
the backend reachable from the browser at `VITE_API_BASE_URL`, or use the default
`http://localhost:4000`.

## Architecture Notes

- **Routing:** `App.tsx` owns the `<BrowserRouter>`, `<nav>`, and route layout. Two routes — `/` and `/users`.
- **Data fetching:** Pages use native `fetch()` with shared API URL and auth header helpers. No shared state management library.
- **Styling:** SCSS Modules for component-scoped styles; `src/index.css` for global styles.
- **Types:** Shared TypeScript interfaces live in `src/interfaces/`. Current types: `User` (`id`, `name`, `email`, `age`).
- **TypeScript config:** Split into three files — project references root in `tsconfig.json`, `tsconfig.app.json` for source, `tsconfig.node.json` for Vite config.

## Development Workflow

```bash
# 1. Install dependencies
bun install

# 2. Start the backend service (separate repo, port 4000)

# 3. Start the frontend dev server
bun run dev

# 4. Before committing — lint and build
bun run lint
bun run build

# Optional: build and run the production Docker image
docker build -t react-frontend-app .
docker run --rm -p 5173:80 react-frontend-app

# Or use Compose
docker compose up -d
```

## Testing

The app uses React Testing Library for component-level assertions and Cypress
as the browser test runner.

```bash
# Run component tests
bun run test

# Open component tests interactively
bun run test:component:open

# Run end-to-end tests
bun run test:e2e

# Open end-to-end tests interactively
bun run test:e2e:open
```

Component specs live next to the components as `*.cy.tsx` files. End-to-end
specs live in `cypress/e2e/`.

Bun blocks Cypress's postinstall by default. If Cypress has not been installed
on this machine yet, run `bunx cypress install` once before running the test
commands.

## Troubleshooting

**Users page shows nothing or errors in the console**
The backend at `http://localhost:4000` is not running. Start the backend service first.

**`bun run build` fails with type errors**
Run `bun run lint` to identify type issues before building. Ensure all TypeScript errors in `src/` are resolved.

**Port 5173 already in use**
Another Vite dev server is running. Stop it or run `bun run dev -- --port 5174` to use a different port.

**Docker container starts but authenticated pages cannot load data**
The frontend is served from the container, but API requests are made by your
browser. Start the backend service on the host or set `VITE_API_BASE_URL` to a
browser-reachable API origin.
