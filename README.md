# Roamly

Roamly is a full-stack travel journal for sharing field notes, discovering posts, keeping favourite entries, viewing traveller profiles, and using an AI travel assistant.

## Features

- Sign up and log in with JWT authentication
- Create, browse, and read travel posts
- Keep or remove posts from a personal collection
- View profiles and posts by username
- Ask the AI assistant for help, post summaries, and story ideas
- Responsive Angular interface with server-side rendering

## Tech Stack

### Frontend

- Angular 22
- TypeScript
- Angular SSR and Express
- RxJS
- Vitest

### Backend

- Java 21
- Spring Boot 4
- Spring Security and JWT
- Spring Data JPA
- PostgreSQL
- Spring AI with Google Gemini
- Maven

## Repository Structure

```text
.
|-- Roamly/          Angular frontend
|   |-- src/app/     Components, routes, guards, services, and interceptors
|   `-- public/      Static public assets
`-- roamlyBackend/   Spring Boot backend
    `-- roamlyBackend/
        |-- src/main/java/
        `-- src/main/resources/
```

## Prerequisites

- Node.js and npm
- Angular CLI 22 (`npm install -g @angular/cli@22`)
- Java 21
- PostgreSQL 14 or newer
- A Google Gemini API key for AI features

## Database Setup

Create a PostgreSQL database named `demo`:

```sql
CREATE DATABASE demo;
```

The backend uses JPA with `spring.jpa.hibernate.ddl-auto=update`, so tables are created or updated automatically at startup.

## Configuration

The backend configuration is in `roamlyBackend/roamlyBackend/src/main/resources/application.properties`.

Before running locally, configure:

- PostgreSQL URL, username, and password
- A Base64-encoded JWT secret
- `GEMINI_API_KEY` in your environment

Example:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/demo
spring.datasource.username=postgres
spring.datasource.password=your_database_password
jwt.secret=your_base64_encoded_secret
jwt.expiration-ms=1000000
spring.ai.google.genai.api-key=${GEMINI_API_KEY}
```

Generate a Base64 secret with:

```bash
openssl rand -base64 48
```

Keep real credentials out of source control.

## Run Locally

### 1. Start PostgreSQL

Ensure PostgreSQL is running and the `demo` database is available.

### 2. Start the backend

```bash
cd roamlyBackend/roamlyBackend
export GEMINI_API_KEY="your_api_key"
./mvnw spring-boot:run
```

The API will run at `http://localhost:8081`.

On Windows:

```powershell
$env:GEMINI_API_KEY="your_api_key"
.\mvnw.cmd spring-boot:run
```

### 3. Start the frontend

Open another terminal:

```bash
cd Roamly
npm install
npm start
```

Open `http://localhost:4200`.

The frontend sends API requests to `http://localhost:8081`, and CORS is configured for `http://localhost:4200`.

## Available Scripts

Inside `Roamly/`:

| Command | Purpose |
| --- | --- |
| `npm start` | Start the Angular development server |
| `npm run build` | Create a production build |
| `npm run watch` | Build in development mode and watch for changes |
| `npm test` | Run unit tests with Vitest |
| `npm run serve:ssr:roamly` | Serve the generated SSR application |

Inside `roamlyBackend/roamlyBackend/`:

| Command | Purpose |
| --- | --- |
| `./mvnw spring-boot:run` | Start the backend |
| `./mvnw test` | Run backend tests |
| `./mvnw package` | Build the backend JAR |

## API Overview

| Area | Base path |
| --- | --- |
| Authentication | `/api/auth` |
| Posts | `/api/posts` |
| Users | `/api/users` |
| AI assistant | `/api/ai` |

Authentication endpoints include signup and login. Protected requests must include a JWT returned by the backend.
