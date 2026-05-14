# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server (Vite, port 5173)
npm run build      # Type-check + production build
npm run lint       # Run ESLint
npm run preview    # Preview production build locally
```

There is no test suite configured yet.

## Architecture

This is a React 19 + TypeScript + Vite frontend that talks to a backend API at `http://localhost:4000`.

**Routing:** `App.tsx` sets up React Router v6 with two routes — `/` (HomePage) and `/users` (UsersPage). The `<Router>`, `<nav>`, and layout wrapper all live in `App.tsx`.

**Pages** (`src/pages/`) contain all route-level components. Each page fetches its own data directly via `fetch()` — there is no shared data-fetching layer or state management library.

**Interfaces** (`src/interfaces/`) hold shared TypeScript types. The only type so far is `User` (`id`, `name`, `email`, `age`).

**Styling:** SCSS Modules (`.module.scss`) for component-scoped styles; `src/index.css` for global styles.

**Backend dependency:** `UsersPage` fetches from `http://localhost:4000/api/users`. The backend is a separate MongoDB-backed service not in this repo — start it independently before using the `/users` route. The URL is hardcoded directly in `UsersPage.tsx`; there is no env var or Vite proxy configured.

**TypeScript config:** Split across three files — `tsconfig.json` (project references root), `tsconfig.app.json` (src files), `tsconfig.node.json` (vite config). Both app and node configs are needed for type-aware ESLint rules.

**ESLint:** Uses flat config (`eslint.config.js`) with `typescript-eslint`, `eslint-plugin-react-hooks`, and `eslint-plugin-react-refresh`. Currently uses `tseslint.configs.recommended` (not type-checked); upgrade to `recommendedTypeChecked` if stricter linting is needed.
