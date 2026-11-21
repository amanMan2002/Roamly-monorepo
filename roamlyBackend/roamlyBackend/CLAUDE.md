# CLAUDE.md - Roamly Backend Guidelines

This document provides essential instructions, commands, architecture details, and coding conventions for AI agents (specifically Claude Code) working on the **Roamly Backend** project.

---

## 1. Project Overview

- **Application Name**: Roamly Backend (`roamlyBackend`)
- **Type**: RESTful API Backend Service
- **Framework**: Spring Boot 4.x / 3.x with Java 21
- **Domain**: Travel and blogging platform supporting user authentication, travel posts/stories management, and AI-assisted generation/enrichment.
- **Project Structure**:
  - Workspace Root: `E:\roamlyBackend`
  - Maven Project Root: `E:\roamlyBackend\roamlyBackend` (contains `pom.xml`, `mvnw`, `mvnw.cmd`, and `src/`)

---

## 2. Tech Stack & Dependencies

- **Language**: Java 21
- **Build Tool**: Apache Maven (wrapper scripts `mvnw` and `mvnw.cmd` included)
- **Framework**: Spring Boot (`spring-boot-starter-webmvc`)
- **Security**: Spring Security + Stateless JWT (`jjwt-api`, `jjwt-impl`, `jjwt-jackson` 0.12.6)
- **Database / ORM**: Spring Data JPA + PostgreSQL JDBC Driver
- **Boilerplate Reduction**: Project Lombok 1.18.46
- **AI Integration**: Spring AI Google GenAI starter (`spring-ai-starter-model-google-genai` BOM 2.0.2)
- **Cross-Origin**: CORS enabled for frontend client (`http://localhost:4200`)

---

## 3. Essential Commands

All Maven commands should be run from the Maven project directory (`E:\roamlyBackend\roamlyBackend`):

### Build & Compilation
```powershell
# Navigate to maven module
cd E:\roamlyBackend\roamlyBackend

# Clean compile
.\mvnw.cmd clean compile

# Full package (skip tests if needed)
.\mvnw.cmd clean package -DskipTests
```

### Running the Application
```powershell
# Run with Spring Boot Maven plugin (starts on port 8081)
.\mvnw.cmd spring-boot:run
```

### Testing
```powershell
# Run all tests
.\mvnw.cmd test

# Run a specific test class
.\mvnw.cmd test -Dtest=RoamlyBackendApplicationTests

# Run a specific test method
.\mvnw.cmd test -Dtest=RoamlyBackendApplicationTests#contextLoads
```

---

## 4. Architecture & Directory Structure

```
E:\roamlyBackend\roamlyBackend\src\main\java\com\example\roamlyBackend\
├── RoamlyBackendApplication.java     # Main Spring Boot entry point
├── auth\
│   └── AuthService.java              # User registration & authentication logic
├── controllers\
│   ├── AuthController.java           # Authentication endpoints (/api/auth)
│   └── PostsController.java          # Post management endpoints (/api/posts)
├── dto\                              # Request and Response DTOs
│   ├── CreatePostRequestDto.java
│   ├── LoginRequestDto.java
│   ├── LoginResponseDto.java
│   ├── PostRequestDto.java
│   ├── PostResponseDto.java
│   ├── SignUpResponseDto.java
│   └── UpdatePostRequestDto.java
├── entity\                           # JPA Entity definitions
│   ├── AppUser.java                  # User entity (implements Spring UserDetails)
│   └── Posts.java                    # Travel posts entity (linked to AppUser)
├── repo\                             # Spring Data JPA Repositories
│   ├── PostsRepository.java
│   └── UserRepository.java
├── security\                         # Security filters, handlers, and configuration
│   ├── AuthUtil.java                 # Authentication utility helpers
│   ├── CustomUserDetailsService.java # UserDetailsService implementation
│   ├── JwtAuthenticationFilter.java  # OncePerRequestFilter for Bearer token validation
│   └── SecurityConfig.java           # SecurityFilterChain, PasswordEncoder, CORS config
└── service\                          # Core domain services
    ├── JwtService.java               # Token generation, claims extraction, validation
    └── PostsService.java             # Post retrieval and creation business logic
```

---

## 5. API Endpoints & Contracts

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Request Body | Response |
|---|---|---|---|---|
| `POST` | `/api/auth/signup` | Public | `LoginRequestDto` (`username`, `password`) | `SignUpResponseDto` (`id`, `username`) |
| `POST` | `/api/auth/login` | Public | `LoginRequestDto` (`username`, `password`) | `LoginResponseDto` (`token`, `userId`) |

### Posts (`/api/posts`)
| Method | Endpoint | Access | Request Body | Response |
|---|---|---|---|---|
| `GET` | `/api/posts` | Public | None | `List<PostResponseDto>` |
| `GET` | `/api/posts/{id}` | Public | Path Variable: `id` | `PostResponseDto` |
| `POST` | `/api/posts` | Bearer Token Required | `CreatePostRequestDto` (`title`, `content`, `coverImageUrl`) | `PostResponseDto` |

---

## 6. Configuration & Environment (`application.properties`)

- **Server Port**: `8081`
- **Database URL**: `jdbc:postgresql://localhost:5432/demo`
- **Database Credentials**: Username `postgres`
- **Hibernate DDL**: `spring.jpa.hibernate.ddl-auto=update`
- **JWT**:
  - `jwt.secret`: Base64 HMAC secret key
  - `jwt.expiration-ms`: `600000` (10 minutes)
- **Spring AI**:
  - Model: `gemini-3.8-flash`
  - Key: `spring.ai.google.genai.api-key`

---

## 7. Code Style & Engineering Standards

1. **DTO Layer**: Always communicate with controllers through DTOs. Never return entities (`AppUser`, `Posts`) directly in API responses.
2. **Lombok Usage**: Use `@Getter`, `@Setter`, `@NoArgsConstructor`, `@AllArgsConstructor`, and `@Builder` consistently. Use `@RequiredArgsConstructor` for constructor dependency injection.
3. **Security Context**:
   - Extract the authenticated user via `SecurityContextHolder.getContext().getAuthentication()` or `@AuthenticationPrincipal`.
   - Ensure `JwtAuthenticationFilter` gracefully passes non-authenticated requests down the filter chain (`filterChain.doFilter(request, response)`).
4. **Exception Handling**:
   - Throw clear domain exceptions or `ResponseStatusException`.
   - Prefer centralized `@RestControllerAdvice` for uniform JSON error responses.
5. **Database Entities**:
   - Use `GenerationType.IDENTITY` for IDs.
   - Specify column definitions like `columnDefinition = "TEXT"` for large content fields.
   - Maintain proper JPA relationship annotations (`@ManyToOne`, `@JoinColumn`, `@OneToMany`).
6. **Cross-Origin Requests**:
   - Keep CORS configured in `SecurityConfig.java` to support Angular/React frontends (`http://localhost:4200`).
