# World Cup Fantasy 2026

A full-stack fantasy sports application for the 2026 FIFA World Cup. Users create up to three bracket entries, predict group-stage results and knockout advancement, and build 11-player squads — competing on a live leaderboard backed by real ESPN data.

---

## Architecture Overview

```
worldcupapp/
├── backend/    Java 17 / Spring Boot 3 REST API
└── frontend/   React 18 / Vite single-page application
```

The frontend communicates with the backend over a JSON REST API secured with JWT tokens. Live World Cup data (standings, scoreboard, rosters, per-player match statistics) is sourced from the ESPN public API and cached server-side.

```
┌────────────────────────────┐        REST/JSON        ┌──────────────────────────┐
│  React SPA (Vite)          │ ──────────────────────► │  Spring Boot API (:8080) │
│  CloudFront → S3 (prod)    │ ◄────────────────────── │   Spring Security + JWT  │
│  localhost:3000 (dev)      │                         └──────────┬───────────────┘
└────────────────────────────┘                                    │
                                                  ┌───────────────┼────────────────┐
                                                  ▼               ▼                ▼
                                             PostgreSQL      ESPN API          Caffeine
                                             (H2 local)   (site + Core v2)     Cache
                                                                  │
                                                          ┌───────┴───────┐
                                                          ▼               ▼
                                                   Scoreboard /    Per-player match
                                                   standings /     stats → FPL points
                                                   rosters         (@Scheduled, 5 min)
```

**Production infrastructure:** EC2 t3.micro running Docker + Nginx (HTTP → Spring Boot). A second CloudFront distribution sits in front of EC2 and provides free HTTPS via `*.cloudfront.net`. GitHub Actions builds the Docker image, pushes to ECR, and deploys via SSH.

---

## Backend

**[backend/README.md](backend/README.md)**

| Detail | Value |
|--------|-------|
| Language | Java 17 |
| Framework | Spring Boot 3.3 |
| Build | Maven 3.8+ |
| Database (prod) | PostgreSQL on RDS (Flyway migrations) |
| Database (local) | H2 in-memory |
| Auth | JWT via JJWT 0.12.6 |
| Caching | Caffeine (1 min – 24 h TTL per cache) |
| External data | ESPN site API + ESPN Core v2 API |
| Deployment | EC2 t3.micro + Docker + Nginx + CloudFront |

### Key API areas

| Area | Endpoints |
|------|-----------|
| Auth | `POST /api/auth/register`, `POST /api/auth/login` |
| Tournament data | `GET /api/groups`, `/api/standings`, `/api/matches`, `/api/tournament/status` |
| Entries | `GET/POST /api/entries`, `GET /api/entries/{id}/picks` |
| Picks | `PUT /api/entries/{id}/picks/groups`, `.../third-place`, `.../knockout` |
| Players | `GET /api/teams/athletes`, `GET /api/players/points` |

### Quick start

```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=local
# Runs on :8080 with H2 database
# Seed accounts: player1@test.com / player2@test.com  (password: password)
```

See [backend/README.md](backend/README.md) for production setup, environment variables, and full API reference.

---

## Frontend

**[frontend/README.md](frontend/README.md)**

| Detail | Value |
|--------|-------|
| Framework | React 18.3 |
| Build tool | Vite 5.4 |
| Routing | React Router v6 |
| Server state | TanStack React Query 5 |
| Styling | Tailwind CSS 3.4 |
| HTTP client | Axios |

### Pages

| Page | Route | Description |
|------|-------|-------------|
| Auth | `/` | Login and registration |
| Dashboard | `/dashboard` | Entry management (up to 3 brackets) |
| Group Stage | `/groups` | Predict group winners and runners-up |
| Bracket | `/bracket` | Knockout round predictions |
| Squad | `/squad` | Build an 11-player fantasy squad |
| Leaderboard | `/leaderboard` | Live standings |

### Quick start

```bash
cd frontend
npm install
npm run dev
# Runs on :3000; proxies /api/* to :8080
```

See [frontend/README.md](frontend/README.md) for environment variables, mock data usage, and component structure.

---

## Game Rules Summary

1. **Group Stage** — Pick 1st and 2nd place finisher for each of 12 groups, plus which third-place teams advance.
2. **Knockout Bracket** — Predict the winner of every round-of-32 through final match.
3. **Squad** — Select 11 players; earn FPL-style fantasy points based on real match performance.
4. **Multiple entries** — Each user may create up to 3 independent entries, scored separately.
5. **Lock times** — Picks for each phase are locked once that phase begins; deadlines are surfaced via a countdown banner.

---

## Development Workflow

Both services must be running for the full application to work.

```bash
# Terminal 1 — backend
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=local

# Terminal 2 — frontend
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
