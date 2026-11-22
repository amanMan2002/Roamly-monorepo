# Roamly Frontend

This directory contains the Angular frontend for Roamly, a full-stack travel journal application.

## Prerequisites

- Node.js
- npm
- Angular CLI 22
- The Roamly backend running at `http://localhost:8081`

## Setup

```bash
npm install
npm start
```

Open `http://localhost:4200`.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm start` | Start the development server |
| `npm run build` | Create a production build |
| `npm run watch` | Build in development mode and watch for changes |
| `npm test` | Run Vitest unit tests |
| `npm run serve:ssr:roamly` | Serve the SSR build |

The application uses route guards for authenticated pages and a JWT HTTP interceptor for backend requests. API endpoints are configured in the Angular services under `src/app/services/`.

See the repository-level `README.md` for full-stack setup, database configuration, and backend instructions.
