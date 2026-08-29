# Bateau Ecole de la Loire

Web platform for a boating school in Nantes. Students browse permits, book theory and practical sessions with instructors, and track their training. Instructors manage availability. Admins manage the full catalog.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Angular (standalone components, signals) |
| Backend | ASP.NET Core Web API (.NET 8) |
| Database | PostgreSQL |
| ORM | EF Core |
| Local dev | Docker Compose |

## Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/) and npm
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Angular CLI](https://angular.io/cli): `npm install -g @angular/cli`

## Getting started

### 1. Start the database

```bash
docker-compose up -d db
```

### 2. Run the backend

```bash
cd backend/src
dotnet ef database update
dotnet run
```

API runs at `http://localhost:5000`. Swagger at `http://localhost:5000/swagger`.

### 3. Run the frontend

```bash
cd frontend
npm install
ng serve
```

App runs at `http://localhost:4200`.

## Project structure

```
/
├── backend/
│   ├── src/              # ASP.NET Core Web API source
│   └── CHANGELOG.md
├── frontend/
│   ├── src/              # Angular app source
│   └── CHANGELOG.md
├── docker-compose.yml
├── README.md
└── CLAUDE.md             # AI coding guidelines
```

## Environment variables

Copy `.env.example` to `.env` and fill in the values before running.

| Variable | Description |
|---|---|
| `DB_HOST` | PostgreSQL host (default: `localhost`) |
| `DB_PORT` | PostgreSQL port (default: `5432`) |
| `DB_NAME` | Database name |
| `DB_USER` | Database user |
| `DB_PASSWORD` | Database password |
| `JWT_SECRET` | Secret key for JWT token signing |
| `SMTP_HOST` | SMTP server for email notifications |
| `SMTP_PORT` | SMTP port |
| `SMTP_USER` | SMTP username |
| `SMTP_PASSWORD` | SMTP password |

## Key features

- **Permit catalog** — browse coastal, offshore, and inland waterway licenses with pricing
- **Session booking** — book theory or practical sessions with a specific instructor
- **Instructor availability** — instructors set their own calendar
- **Admin back-office** — manage sessions, bookings, exam dates, and content
- **Email notifications** — confirmation and reminders on booking events
- **Exam dates** — up-to-date exam schedule managed by admin
