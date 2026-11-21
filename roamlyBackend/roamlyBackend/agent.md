# AGENTS.md - Developer & AI Agent Guide for Roamly Backend

This guide provides instructions, architectural rules, workflow protocols, and environment configuration for AI coding agents (Devin, Cursor, Copilot, Codex, Gemini, Antigravity) working in this repository.

---

## 1. Project Synopsis

- **Project**: Roamly Backend
- **Repository Type**: Maven-based Spring Boot application
- **Runtime**: Java 21 (Eclipse Adoptium OpenJDK 21+)
- **Port**: `8081` (accessible at `http://localhost:8081`)
- **Key Modules**:
  - Stateless JWT Authentication & User Management
  - Travel Post / Story Management (CRUD, user association)
  - Spring AI / Google GenAI Gemini integration

---

## 2. Directory Layout & Working Paths

```
E:\roamlyBackend\
├── AGENTS.md                           # AI agent guidelines
├── agent.md                            # AI agent guidelines (alias)
├── CLAUDE.md                           # Claude Code specific guidelines
├── roamlyBackend\                      # Main Maven module
│   ├── mvnw / mvnw.cmd                 # Maven wrapper scripts
│   ├── pom.xml                         # Maven project dependencies & build plugins
│   └── src\
│       ├── main\
│       │   ├── java\com\example\roamlyBackend\
│       │   │   ├── auth\               # Auth services & business logic
│       │   │   ├── controllers\        # REST controllers (AuthController, PostsController)
│       │   │   ├── dto\                # Request / Response transfer objects
│       │   │   ├── entity\             # JPA entities (AppUser, Posts)
│       │   │   ├── repo\               # Spring Data JPA repositories
│       │   │   ├── security\           # SecurityConfig, JwtAuthenticationFilter, UserDetailsService
│       │   │   └── service\            # Business services (JwtService, PostsService)
│       │   └── resources\
│       │       └── application.properties # App configuration (DB, JWT, Gemini AI)
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

# 2. Package JAR
.\mvnw.cmd clean package -DskipTests

# 3. Run application server (runs on port 8081)
.\mvnw.cmd spring-boot:run

# 4. Run test suite
.\mvnw.cmd test

# 5. Run single test
.\mvnw.cmd test -Dtest=RoamlyBackendApplicationTests
```

---

## 4. Key Architectural Patterns & Constraints

### 4.1 Layer Separation
Always adhere to strict layered architecture:
`Controller` -> `Service` -> `Repository` -> `Entity` / `Database`

- **Controllers**: Keep controllers lean. Validate incoming DTOs, invoke services, and return `ResponseEntity` or typed response DTOs.
- **DTOs**: Use dedicated request and response DTOs under `com.example.roamlyBackend.dto`. **Never return JPA entities directly** to the client.
- **Services**: Contain all domain logic, transaction boundaries (`@Transactional`), and security checks.
- **Repositories**: Standard Spring Data JPA interfaces extending `JpaRepository`.

### 4.2 Security & Authentication
- **Mechanism**: Stateless JWT authentication via `JwtAuthenticationFilter`.
- **JWT Header**: `Authorization: Bearer <token>`.
- **User Principal**: `AppUser` implements `UserDetails`. The `userId` is embedded as a custom claim (`userId`) in the token payload.
- **Public Endpoints**:
  - `/api/auth/**` (login, signup)
  - `GET /api/posts` and `GET /api/posts/**`
  - Pre-flight `OPTIONS /**`
- **Protected Endpoints**:
  - `POST /api/posts` (requires valid JWT)
  - Any future PUT/PATCH/DELETE endpoints on posts or user resources.
- **CORS**: Origin `http://localhost:4200` is allowed with credentials and standard HTTP verbs (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`).

### 4.3 Database & Entities
- Database: PostgreSQL running on `localhost:5432`, database `demo`.
- DDL Mode: `spring.jpa.hibernate.ddl-auto=update`.
- Table Names:
  - User table: `roamly` (`AppUser.java`)
  - Posts table: `posts` (`Posts.java`)
- Relationships:
  - Each `Posts` entity belongs to an `AppUser` (`@ManyToOne` with `user_id` foreign key).

### 4.4 Spring AI / Gemini Integration
- Configured via `spring-ai-starter-model-google-genai` BOM version 2.0.2.
- Model property: `spring.ai.google.genai.chat.options.model=gemini-3.8-flash`.
- API key provided through `spring.ai.google.genai.api-key`.
- When developing AI features, inject `ChatModel` or `ChatClient` from Spring AI.

---

## 5. Coding Standards & Conventions

1. **Java Version**: Use Java 21 features where suitable (pattern matching, records, streams, switch expressions).
2. **Lombok**:
   - Use `@RequiredArgsConstructor` for constructor dependency injection.
   - Avoid manual getter/setter boilerplate; use `@Getter`, `@Setter`, `@Builder`, `@NoArgsConstructor`, `@AllArgsConstructor`.
3. **Null Safety & Validation**:
   - Return `Optional<T>` from repositories.
   - Handle missing resources gracefully by throwing descriptive exceptions (e.g. `ResponseStatusException(HttpStatus.NOT_FOUND)`).
4. **Dates & Timestamps**:
   - Use `java.time.LocalDateTime` or `Instant` for entity audit timestamps (`createdAt`, `updatedAt`).
5. **Logging**:
   - Prefer SLF4J (`@Slf4j` via Lombok) over `System.out.println` in production code.

---

## 6. Safe Modification Guidelines for Agents

- **Do NOT break database schema compatibility**: Be cautious when modifying existing `@Entity` field names or column types, as `ddl-auto=update` may cause alter errors or orphaned columns.
- **Do NOT hardcode environment secrets in Git**: In production, pass `jwt.secret` and `spring.ai.google.genai.api-key` via environment variables or `.env`.
- **Always verify compilation**: Run `.\mvnw.cmd clean compile` after modifying Java files to verify there are no compilation errors or missing imports.
