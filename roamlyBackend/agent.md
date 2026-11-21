# AGENTS.md - Developer & AI Agent Guide for Roamly Backend

This guide provides instructions, architectural rules, workflow protocols, and environment configuration for AI coding agents (Devin, Cursor, Copilot, Codex, Gemini, Antigravity) working in this repository.

---

## 1. Project Synopsis

- **Project**: Roamly Backend
- **Repository Type**: Maven-based Spring Boot application (Spring Boot 3.x / 4.x)
- **Runtime**: Java 21 (Eclipse Adoptium OpenJDK 21+)
- **Port**: `8081` (accessible at `http://localhost:8081`)
- **Key Modules**:
  - Stateless JWT Authentication & User Management
  - Travel Post / Story Management (CRUD, user association)
  - Post Like & Save System (Toggling likes, saving posts into accounts, author like metrics)
  - Spring AI / Google GenAI Gemini integration (Travel Chatbot, RAG Tools, AI Story Generation)

---

## 2. Directory Layout & Working Paths

```
E:\roamlyBackend\
├── AGENTS.md                                   # AI agent guidelines
├── agent.md                                    # AI agent guidelines (alias / mirror)
├── CLAUDE.md                                   # Claude Code specific guidelines
├── roamlyBackend\                              # Main Maven module
│   ├── mvnw / mvnw.cmd                         # Maven wrapper scripts
│   ├── pom.xml                                 # Maven project dependencies & build plugins
│   └── src\
│       ├── main\
│       │   ├── java\com\example\roamlyBackend\
│       │   │   ├── RoamlyBackendApplication.java # Application entry point
│       │   │   ├── auth\                       # Authentication services & business logic
│       │   │   │   └── AuthService.java
│       │   │   ├── controllers\                # REST controllers
│       │   │   │   ├── AuthController.java     # /api/auth (login, signup)
│       │   │   │   ├── PostsController.java    # /api/posts (post CRUD, like, saved posts)
│       │   │   │   ├── UserController.java     # /api/users (profiles, author like metrics)
│       │   │   │   └── AiAssistantController.java # /api/ai (chat, story gen, stats, search)
│       │   │   ├── dto\                        # Request / Response transfer objects
│       │   │   │   ├── LoginRequestDto.java
│       │   │   │   ├── LoginResponseDto.java
│       │   │   │   ├── SignUpResponseDto.java
│       │   │   │   ├── UserProfileDto.java     # User profile with totalLikesReceived, totalPosts
│       │   │   │   ├── AiDto\                  # AI module DTOs
│       │   │   │   │   ├── AiChatRequestDto.java
│       │   │   │   │   ├── AiChatResponseDto.java
│       │   │   │   │   ├── AiDatabaseStatsDto.java
│       │   │   │   │   ├── AiPostSummaryDto.java
│       │   │   │   │   └── AiStoryGenerationRequestDto.java
│       │   │   │   └── PostDto\                # Post module DTOs
│       │   │   │       ├── CreatePostRequestDto.java
│       │   │   │       ├── PostResponseDto.java # Includes likesCount, likedByCurrentUser
│       │   │   │       └── LikeResponseDto.java # Result of like/unlike toggle
│       │   │   ├── entity\                     # JPA entities
│       │   │   │   ├── AppUser.java            # User entity (table: roamly)
│       │   │   │   ├── Posts.java              # Travel post entity (table: posts)
│       │   │   │   └── PostLike.java           # Post likes & bookmarks (table: post_likes)
│       │   │   ├── repo\                       # Spring Data JPA repositories
│       │   │   │   ├── PostsRepository.java
│       │   │   │   ├── UserRepository.java
│       │   │   │   └── PostLikeRepository.java
│       │   │   ├── security\                   # Security & JWT configuration
│       │   │   │   ├── AuthUtil.java
│       │   │   │   ├── CustomUserDetailsService.java
│       │   │   │   ├── JwtAuthenticationFilter.java
│       │   │   │   └── SecurityConfig.java
│       │   │   └── service\                    # Core domain & AI services
│       │   │       ├── JwtService.java
│       │   │       ├── PostsService.java
│       │   │       ├── UserService.java        # User profile & like aggregation logic
│       │   │       ├── AiAssistantService.java
│       │   │       └── AiDatabaseTools.java    # Spring AI @Tool function definitions
│       │   └── resources\
│       │       └── application.properties     # App configuration (DB, JWT, Gemini AI)
│       └── test\
│           └── java\com\example\roamlyBackend\ # Integration & unit tests
```

> **IMPORTANT**: The Maven project files (`pom.xml`, `mvnw.cmd`) reside in the `roamlyBackend/` subdirectory. When executing build or test commands, ensure your working directory is `E:\roamlyBackend\roamlyBackend`.

---

## 3. Development Commands

Run all commands from `E:\roamlyBackend\roamlyBackend`:

```powershell
# 1. Compile project & verify dependencies
.\mvnw.cmd clean compile

# 2. Package JAR (skip tests)
.\mvnw.cmd clean package -DskipTests

# 3. Run application server (runs on port 8081)
.\mvnw.cmd spring-boot:run

# 4. Run test suite
.\mvnw.cmd test

# 5. Run single test
.\mvnw.cmd test -Dtest=RoamlyBackendApplicationTests
```

---

## 4. Key Architectural Patterns & API Endpoints

### 4.1 Layer Separation
Always adhere to strict layered architecture:
`Controller` -> `Service` -> `Repository` -> `Entity` / `Database`

- **Controllers**: Keep controllers lean. Validate incoming DTOs, invoke services, and return `ResponseEntity` or typed response DTOs.
- **DTOs**: Use dedicated request and response DTOs organized under `com.example.roamlyBackend.dto`. **Never return JPA entities directly** to the client.
- **Services**: Contain all domain logic, transaction boundaries (`@Transactional`), and security checks.
- **Repositories**: Standard Spring Data JPA interfaces extending `JpaRepository` with custom JPQL/derived queries where needed.

### 4.2 API Endpoints Matrix

#### Authentication (`/api/auth`)
| Method | Endpoint | Access | Body / Params | Description |
|---|---|---|---|---|
| `POST` | `/api/auth/signup` | Public | `LoginRequestDto` (`username`, `password`) | Register a new user |
| `POST` | `/api/auth/login` | Public | `LoginRequestDto` (`username`, `password`) | Authenticate user & return JWT |

#### Travel Posts (`/api/posts`)
| Method | Endpoint | Access | Body / Params | Description |
|---|---|---|---|---|
| `GET` | `/api/posts` | Public | None | Retrieve all published travel posts (with `likesCount`, `likedByCurrentUser`) |
| `GET` | `/api/posts/{id}` | Public | Path Variable: `id` | Retrieve single post by ID (with `likesCount`, `likedByCurrentUser`) |
| `POST` | `/api/posts` | Permitted / Authenticated | `CreatePostRequestDto` | Create post tied to authenticated user |
| `POST` | `/api/posts/{id}/like` | Authenticated | None | Toggle like/save on another user's post (disallows self-likes) |
| `DELETE` | `/api/posts/{id}/like` | Authenticated | None | Explicitly unlike & remove post from saved collection |
| `GET` | `/api/posts/{id}/like-status` | Public / Optional Auth | None | Retrieve like status & like count for post |
| `GET` | `/api/posts/saved` | Authenticated | None | Retrieve all posts liked & saved by current user |
| `GET` | `/api/posts/liked` | Authenticated | None | Alias for `/api/posts/saved` |
| `GET` | `/api/posts/my-posts` | Authenticated | None | Retrieve all posts authored by logged-in user |
| `GET` | `/api/posts/user/{username}` | Public | Path Variable: `username` | Retrieve all posts authored by specific user |

#### User Profiles & Author Like Counts (`/api/users`)
| Method | Endpoint | Access | Body / Params | Description |
|---|---|---|---|---|
| `GET` | `/api/users/profile` | Authenticated | None | Get current user profile (`totalPosts`, `totalLikesReceived`, `totalSavedPosts`) |
| `GET` | `/api/users/profile/{username}` | Public | Path Variable: `username` | Get public author profile with total likes received & total posts |
| `GET` | `/api/users/{username}` | Public | Path Variable: `username` | Alias for `/profile/{username}` |
| `GET` | `/api/users/{username}/likes` | Public | Path Variable: `username` | Quick lookup of total likes received by an author |

#### AI Assistant & Generation (`/api/ai`)
| Method | Endpoint | Access | Body / Params | Description |
|---|---|---|---|---|
| `POST` | `/api/ai/chat` | Public | `AiChatRequestDto` (`message`, `conversationId`) | Roamly AI chat with database tool calling & RAG |
| `POST` | `/api/ai/generate-story` | Public | `AiStoryGenerationRequestDto` (`destination`, `highlights`, `tone`) | Generates travel blog draft with title, sections, & tips |
| `GET` | `/api/ai/stats` | Public | None | Returns total posts and users count summary |
| `GET` | `/api/ai/search-posts` | Public | Query Param: `query` (optional) | Keyword search across post titles and content |

### 4.3 Like & Save System Rules
1. **Liking & Saving**: When user A likes user B's post via `POST /api/posts/{id}/like`, the post is bookmarked/saved into user A's account (`GET /api/posts/saved`).
2. **Self-Like Prevention**: Users cannot like their own posts. If user A attempts to like their own post, the API rejects the request with `400 Bad Request` ("You cannot like your own post").
3. **Toggle Behavior**: Calling `POST /api/posts/{id}/like` on an already-liked post unlikes it and removes it from the user's saved collection.
4. **Author Likes Received Metric**: The total number of likes an author receives across all their published posts is aggregated via `PostLikeRepository` (`countTotalLikesReceivedByUserId` / `countTotalLikesReceivedByUsername`) and exposed in `UserProfileDto` (`totalLikesReceived`).

---

## 5. Security & Authentication
- **Mechanism**: Stateless JWT authentication via `JwtAuthenticationFilter`.
- **JWT Header**: `Authorization: Bearer <token>`.
- **User Principal**: `AppUser` implements `UserDetails`. The `userId` is embedded as a custom claim (`userId`) in the token payload.
- **SecurityFilterChain**:
  - `OPTIONS /**` permitted for pre-flight checks.
  - `/api/auth/**`, `/error`, `/api/ai/**` are permitted.
  - `GET /api/posts/**` and `GET /api/users/**` are public.
  - `POST /api/posts/{id}/like`, `DELETE /api/posts/{id}/like`, `GET /api/posts/saved`, and `GET /api/users/profile` require valid JWT.
- **CORS**: Allowed origin `http://localhost:4200` with credentials and standard HTTP verbs (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`).

---

## 6. Database & Entities
- **Database**: PostgreSQL running on `localhost:5432`, database `demo`.
- **DDL Mode**: `spring.jpa.hibernate.ddl-auto=update`.
- **Table Names & Entities**:
  - User table: `roamly` (`AppUser.java`)
  - Posts table: `posts` (`Posts.java`)
  - Likes table: `post_likes` (`PostLike.java`) with unique constraint on `(user_id, post_id)` and cascade deletion on user/post removal.
- **Relationships**:
  - Each `Posts` entity belongs to an `AppUser` (`@ManyToOne` with `user_id` foreign key).
  - Each `PostLike` entity references `AppUser` (the liker) and `Posts` (the liked post).

---

## 7. Spring AI & Gemini Integration Details

- **Starter**: `spring-ai-starter-model-google-genai` (BOM version `2.0.2`).
- **Model**: `gemini-3.1-flash-lite` (configured in `application.properties` via `spring.ai.google.genai.chat.model`).
- **API Key**: `spring.ai.google.genai.api-key`.
- **Chat Assistant**: Prompt-engineered with travel domain restrictions and database grounding tools (`AiDatabaseTools`).
- **Travel Story Generation**: Accessible at `/api/ai/generate-story`.

---

## 8. Safe Modification Guidelines for Agents

- **Do NOT break database schema compatibility**: Be cautious when modifying existing `@Entity` field names or column types, as `ddl-auto=update` may cause alter errors or orphaned columns.
- **Do NOT commit raw API secrets to public repositories**: Pass `jwt.secret` and `spring.ai.google.genai.api-key` via environment variables or `.env` in production.
- **Always verify compilation**: Run `.\mvnw.cmd clean compile` from `E:\roamlyBackend\roamlyBackend` after modifying Java files to verify there are no compilation errors or missing imports.
