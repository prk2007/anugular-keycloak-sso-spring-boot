# Docker Setup Guide

This guide explains how to run the entire Spring Boot + Keycloak + Angular application using Docker Compose.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose installed (comes with Docker Desktop)

## Architecture

The docker-compose.yml defines the following services:

```
┌─────────────────────────────────────────────────────────┐
│                     Docker Network                      │
│                                                         │
│  ┌────────────┐    ┌───────────┐    ┌──────────────┐  │
│  │  Angular   │───>│ Spring    │───>│  Keycloak    │  │
│  │  (nginx)   │    │  Boot     │    │  (Auth)      │  │
│  │  :80       │    │  :8080    │    │  :8081       │  │
│  └────────────┘    └───────────┘    └──────────────┘  │
│                           │                  │          │
│                           └──────────┬───────┘          │
│                                      │                  │
│                              ┌───────▼──────┐           │
│                              │  PostgreSQL  │           │
│                              │  :5432       │           │
│                              └──────────────┘           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| **angular-app** | 4200 | Angular frontend served by nginx |
| **spring-app** | 8080 | Spring Boot backend API |
| **keycloak** | 8081 | Keycloak authentication server |
| **postgres** | 5432 | PostgreSQL database |
| **pgadmin** | 81 | pgAdmin database management UI |

## Quick Start

### 1. Build and Start All Services

From the project root directory:

```bash
docker compose up --build
```

This will:
- Build the Angular app (multi-stage Docker build)
- Build the Spring Boot app (multi-stage Docker build with Maven)
- Pull and start PostgreSQL, Keycloak, and pgAdmin
- Wait for services to be healthy before starting dependent services

### 2. Access the Application

Once all services are running (wait 1-2 minutes for initial startup):

- **Angular App**: http://localhost:4200
- **Spring Boot API**: http://localhost:8080
- **Keycloak Admin**: http://localhost:8081 (admin/admin)
- **pgAdmin**: http://localhost:81 (admin@admin.com/admin)

## Initial Setup

### First Time Setup

The first time you run the application, you need to configure Keycloak:

1. Access Keycloak Admin Console: http://localhost:8081
2. Login with: `admin` / `admin`
3. Follow the steps in the main README.md to:
   - Create the `test-app` realm
   - Create `frontend` and `backend` clients
   - Create the `user` role
   - Configure default role assignment
   - Create test users

## Service Management

### Stop All Services

```bash
docker compose down
```

### Stop and Remove Volumes (Fresh Start)

```bash
docker compose down -v
```

This will delete the PostgreSQL data volume, requiring Keycloak reconfiguration.

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f spring-app
docker compose logs -f angular-app
docker compose logs -f keycloak
```

### Restart a Single Service

```bash
docker compose restart spring-app
```

### Rebuild a Service

```bash
# Rebuild and restart Angular
docker compose up -d --build angular-app

# Rebuild and restart Spring Boot
docker compose up -d --build spring-app
```

## Health Checks

All services have health checks configured:

```bash
# Check service status
docker compose ps

# Check Spring Boot health
curl http://localhost:8080/actuator/health

# Check Keycloak health
curl http://localhost:8081/health
```

## Troubleshooting

### Services Not Starting

Check the logs:
```bash
docker compose logs
```

### PostgreSQL Connection Issues

Ensure PostgreSQL is healthy before other services start:
```bash
docker compose ps postgres
```

### Keycloak Not Accessible

Wait for Keycloak to fully initialize (can take 30-60 seconds):
```bash
docker compose logs -f keycloak
```

Look for: `Keycloak 20.0.0 on JVM ... started in ...`

### Spring Boot Failing to Connect

Check that:
1. PostgreSQL is running and healthy
2. Keycloak is running and accessible
3. The `ewizitingDB` database was created (check init-db.sql)

```bash
# Verify database
docker exec -it postgres psql -U admin -c "\l"
```

### Angular App Not Loading

Check nginx logs:
```bash
docker compose logs -f angular-app
```

### Port Conflicts

If ports are already in use, modify docker-compose.yml:
```yaml
ports:
  - "4201:80"  # Change host port to 4201
```

## Development Workflow

### Making Code Changes

**Angular:**
1. Make changes in `angular-app/src`
2. Rebuild: `docker compose up -d --build angular-app`

**Spring Boot:**
1. Make changes in `spring-app/src`
2. Rebuild: `docker compose up -d --build spring-app`

### Accessing PostgreSQL

Using psql:
```bash
docker exec -it postgres psql -U admin -d ewizitingDB
```

Using pgAdmin:
1. Access http://localhost:81
2. Login: admin@admin.com / admin
3. Add server:
   - Host: postgres
   - Port: 5432
   - Username: admin
   - Password: admin

## Environment Variables

### Spring Boot (docker)

Configured in `spring-app/src/main/resources/application-docker.properties`:
- Uses Docker service names (postgres, keycloak)
- Profile activated via `SPRING_PROFILES_ACTIVE=docker`

### Angular (production)

Configured in `angular-app/src/environments/environment.prod.ts`:
- Keycloak URL must be accessible from browser (http://localhost:8081)
- API calls proxied through nginx to spring-app

## Volumes

### Persistent Data

- **postgres_data**: Persists PostgreSQL data including Keycloak configuration

To reset everything:
```bash
docker compose down -v
rm -rf volumes/
```

## Network

All services communicate via a Docker bridge network. Service names are used as hostnames:
- Spring Boot connects to: `postgres:5432` and `keycloak:8081`
- Angular nginx proxies to: `spring-app:8080`
- Browser connects to: `localhost:4200`, `localhost:8081`

## Production Considerations

This Docker setup is for **development only**. For production:

1. Use proper secrets management (not hardcoded passwords)
2. Enable HTTPS/TLS
3. Use production-grade PostgreSQL configuration
4. Configure Keycloak for production mode
5. Set appropriate CORS policies
6. Use environment-specific configurations
7. Implement proper logging and monitoring
8. Scale services as needed (Kubernetes, etc.)

## Clean Rebuild

For a completely fresh start:

```bash
# Stop and remove everything
docker compose down -v

# Remove images
docker rmi springboot-keycloak-angular-spring-app
docker rmi springboot-keycloak-angular-angular-app

# Rebuild and start
docker compose up --build
```
