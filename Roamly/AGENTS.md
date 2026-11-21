# AGENTS.md — Roamly Frontend

## Overview
Angular 22+ standalone SPA with SSR (`@angular/ssr`). Single-feed travel journal ("field notes" paper/ink aesthetic). Communicates with Spring Boot backend at `http://localhost:8081`.

## Commands
- Dev server: `npm start` (port 4200)
- Build: `ng build --configuration development`
- Test: `ng test`
- Package manager: `npm` (run with `--legacy-peer-deps` if peer resolution fails)

## Architecture & Conventions
- Standalone components only (`imports: [...]`), no `NgModule`.
- Signal-based state (`signal()`, `computed()`), modern control flow (`@if`, `@for`).
- HttpClient via `provideHttpClient(withFetch(), withInterceptors([jwtInterceptor]))` in `app.config.ts`.
- Routing in `app.routes.ts` with lazy loading (`/home`, `/profile`, `/profile/:username`, `/login`, `/signup`). Dynamic routes (e.g. `profile/:username`) use `RenderMode.Client` in `app.routes.server.ts`.
- Guards: `authGuard` (protects `/home`, `/profile`, `/profile/:username`), `guestGuard` (redirects auth pages to `/home`).
- Feed cards truncate story previews via `getPostPreview()` (180 chars); opening a post displays the full story in the reader modal (`selectedPost`).

## Backend API Contract (`http://localhost:8081`)
- Auth: `POST /api/auth/login`, `POST /api/auth/signup` -> body `{ username, password }`.
  - JWT stored in `localStorage` under `jwt_token`, username under `roamly_username`.
  - SSR safe: all `localStorage` access gated by `isPlatformBrowser(platformId)`.
- Posts:
  - `GET /api/posts` -> `PostResponse[]`
  - `POST /api/posts` -> `CreatePostRequest`
  - `POST /api/posts/{id}/like` -> toggles "Keep" (like) via `KeepsService`, which also persists the user's Kept Collection per user in `localStorage` (`roamly_kept_posts_<username>`).
  - Database column is `cover_image_url` -> DTO field is `coverImageUrl`. Always send `coverImageUrl`.
  - Multiple photos (max 6): also send `imageUrls: string[]` (first item = `coverImageUrl`). Read via `getPostImages()`, which falls back to the single cover image.
  - Post author: DTO property `author` or `username`. Always fall back gracefully; author handles link to `/profile/:username`.
- Users & Profile (`/api/users`, `UserService`):
  - `GET /api/users/profile` -> `UserProfileDto` (logged-in user profile & `totalLikesReceived`)
  - `GET /api/users/profile/{username}` (alias `GET /api/users/{username}`) -> public `UserProfileDto`
  - `GET /api/users/{username}/likes` -> `{ username, totalLikesReceived }`
  - `/profile` shows total keeps received, entries filed, and the logged-in user's Kept Collection tab.
- AI Assistant (`/api/ai`):
  - `POST /api/ai/chat` -> body `{ message, prompt, conversationHistory }`
  - `POST /api/ai/generate-story` -> body `{ prompt, topic, destination, title }`
  - `GET /api/ai/stats` -> returns database counts (totalPosts, totalUsers, totalImages)
  - `GET /api/ai/search-posts?query=` -> returns semantic/AI search summaries `AiPostSummaryDto[]`

## Styling System
- Theme: "Field notes / vintage travel journal" defined in `src/styles.css`.
- Variables: `--paper (#f2ece0)`, `--card (#fbf8f1)`, `--ink (#1d1b18)`, `--stamp (#c8401c)`, `--sea (#2c5a5e)`.
- Fonts: `Fraunces` (display serif), `IBM Plex Sans` (body), `IBM Plex Mono` (code/labels).
- Do NOT re-introduce glassmorphism, purple gradients, or emoji-heavy AI slop UI.

## Token Efficiency Rules for Agents
- Keep edits localized with surgical replacements; do not rewrite entire files.
- Run builds (`ng build --configuration development`) to verify types and syntax rather than speculative refactoring.
- Do not output repetitive boilerplate or multi-paragraph commentary. State changes concisely.
- Follow existing project conventions.

