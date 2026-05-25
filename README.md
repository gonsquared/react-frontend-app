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

- Node.js (use current LTS)
- npm

## Getting Started

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

The app runs at `http://localhost:5173` by default.

## Backend Dependency

The `/users` route fetches from `http://localhost:4000/api/users`. This is a separate MongoDB-backed service that must be running independently before navigating to that page. The URL is hardcoded in [src/pages/UsersPage.tsx](src/pages/UsersPage.tsx) — there is no Vite proxy or environment variable configured.

Start the backend service before using the Users page.

## Pages

| Route    | Component                                                        | Description                           |
| -------- | ---------------------------------------------------------------- | ------------------------------------- |
| `/`      | [src/pages/HomePage.tsx](src/pages/HomePage.tsx)                 | Home page                             |
| `/users` | [src/pages/UsersPage.tsx](src/pages/UsersPage.tsx)               | Fetches and displays users in a table |

## Available Scripts

| Command           | Description                                    |
| ----------------- | ---------------------------------------------- |
| `npm run dev`     | Start development server with HMR (port 5173)  |
| `npm run build`   | Type-check and produce a production build      |
| `npm run preview` | Serve the production build locally             |
| `npm run lint`    | Run ESLint across all TypeScript source files  |

## Linting

Uses ESLint 9 flat config with:

- `typescript-eslint` (recommended rules)
- `eslint-plugin-react-hooks`
- `eslint-plugin-react-refresh`

```bash
npm run lint
```

To enable stricter type-aware lint rules, update `eslint.config.js` to use `tseslint.configs.recommendedTypeChecked` and add `parserOptions.project` pointing to both `tsconfig.app.json` and `tsconfig.node.json`.

## Build

```bash
npm run build
```

Output goes to `dist/`. The build step runs `tsc -b` first to type-check, then Vite bundles for production.

## Docker

The Docker image builds the Vite app in a Node.js stage, then serves the static `dist/` output with Nginx.

```bash
# Build the production image
docker build -t react-frontend-app .

# Run the container on http://localhost:8081
docker run --rm -p 8081:80 react-frontend-app

# Or build and run with Docker Compose
docker compose up -d
```

The container exposes port `80`. The examples above map it to host port `8081`.

The Users page still fetches `http://localhost:4000/api/users` from the browser, so the backend service must be running on the host at port `4000` when you use the container locally.

## Architecture Notes

- **Routing:** `App.tsx` owns the `<BrowserRouter>`, `<nav>`, and route layout. Two routes — `/` and `/users`.
- **Data fetching:** Each page fetches its own data directly via `fetch()`. No shared data layer or state management library.
- **Styling:** SCSS Modules for component-scoped styles; `src/index.css` for global styles.
- **Types:** Shared TypeScript interfaces live in `src/interfaces/`. Current types: `User` (`id`, `name`, `email`, `age`).
- **TypeScript config:** Split into three files — project references root in `tsconfig.json`, `tsconfig.app.json` for source, `tsconfig.node.json` for Vite config.

## Development Workflow

```bash
# 1. Install dependencies
npm install

# 2. Start the backend service (separate repo, port 4000)

# 3. Start the frontend dev server
npm run dev

# 4. Before committing — lint and build
npm run lint
npm run build

# Optional: build and run the production Docker image
docker build -t react-frontend-app .
docker run --rm -p 8081:80 react-frontend-app

# Or use Compose
docker compose up -d
```

## Testing

No test suite is configured yet.

## Troubleshooting

**Users page shows nothing or errors in the console**
The backend at `http://localhost:4000` is not running. Start the backend service first.

**`npm run build` fails with type errors**
Run `npm run lint` to identify type issues before building. Ensure all TypeScript errors in `src/` are resolved.

**Port 5173 already in use**
Another Vite dev server is running. Stop it or run `npm run dev -- --port 5174` to use a different port.

**Docker container starts but `/users` cannot load data**
The frontend is served from the container, but the API request is made by your browser to `http://localhost:4000`. Start the backend service on the host before opening `/users`.
