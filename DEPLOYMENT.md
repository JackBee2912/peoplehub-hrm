# PeopleHub HRM - Deployment Guide

## Quick Start

```bash
cd backend
docker compose up -d --build
```

Wait for all services to be healthy (approx. 30 seconds), then:

```bash
# Run database migrations
docker exec peoplehub-backend npx prisma migrate deploy

# Seed the database
docker exec peoplehub-backend npm run prisma:seed
```

## Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5174 | React SPA (Ant Design) |
| Backend API | http://localhost:3002 | NestJS REST API |
| Swagger Docs | http://localhost:3002/docs | API documentation |
| Health Check | http://localhost:3002/api/v1/health | API health status |
| MinIO Console | http://localhost:9003 | Object storage UI |
| MinIO API | http://localhost:9002 | Object storage API |
| PostgreSQL | localhost:5433 | Database |
| Redis | localhost:6380 | Cache |

## Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@peoplehub.com | Admin@123 |
| HR Manager | hr@peoplehub.com | HrManager@123 |
| Manager | manager@peoplehub.com | Manager@123 |

## Architecture

```
                    docker compose up
                    =================
                          |
    +---------------------+---------------------+
    |                     |                     |
 [PostgreSQL]          [Redis]              [MinIO]
 port 5433             port 6380         ports 9002-9003
    |                     |                     |
    +----------+----------+----------+----------+
               |                     |
          [Backend]               [Frontend]
        port 3002                port 5174
       (NestJS 11)            (React 19 + Vite)
```

## Services

### Backend (NestJS 11)
- **Image**: `node:22-alpine` (dev mode)
- **Port Mapping**: `3002:3001`
- **Hot Reload**: Enabled (watch mode)
- **Health Check**: `/api/v1/health`

### Frontend (React 19 + Vite)
- **Image**: `node:22-alpine` (dev mode)
- **Port Mapping**: `5174:5173`
- **Hot Reload**: Enabled (with polling for Docker)
- **API Proxy**: Routes `/api` requests to backend

### PostgreSQL 16
- **Image**: `postgres:16-alpine`
- **Port Mapping**: `5433:5432`
- **Volume**: `postgres_data` for persistence

### Redis 7
- **Image**: `redis:7-alpine`
- **Port Mapping**: `6380:6379`
- **Volume**: `redis_data` for persistence

### MinIO
- **Image**: `minio/minio:latest`
- **Port Mapping**: `9002:9000` (API), `9003:9001` (Console)
- **Volume**: `minio_data` for persistence
- **Credentials**: `minioadmin` / `minioadmin`

## Environment Variables

Copy `.env.example` to `.env` and adjust values:

```bash
cp .env.example .env
```

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_ACCESS_SECRET_PATH` - Path to RSA public key
- `JWT_REFRESH_SECRET_PATH` - Path to RSA private key
- `CORS_ORIGIN` - Allowed frontend origin

## Common Commands

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Stop all services
docker compose down

# Stop and remove volumes (WARNING: deletes data)
docker compose down -v

# Restart a specific service
docker compose restart backend

# Run Prisma Studio (database GUI)
docker exec peoplehub-backend npx prisma studio

# Run migrations
docker exec peoplehub-backend npx prisma migrate deploy

# Create new migration
docker exec peoplehub-backend npx prisma migrate dev --name <migration_name>

# Seed database
docker exec peoplehub-backend npm run prisma:seed

# Run tests (backend)
docker exec peoplehub-backend npm test

# Run tests (frontend)
docker exec peoplehub-frontend npm test

# Access backend shell
docker exec -it peoplehub-backend sh

# Access frontend shell
docker exec -it peoplehub-frontend sh
```

## Troubleshooting

### Port Conflicts

If ports are already in use, modify the port mappings in `docker-compose.yml`:

```yaml
ports:
  - "CUSTOM_PORT:INTERNAL_PORT"
```

Current port assignments (to avoid conflicts with other projects):
- PostgreSQL: `5433` (instead of 5432)
- Redis: `6380` (instead of 6379)
- Backend: `3002` (instead of 3001)
- Frontend: `5174` (instead of 5173)
- MinIO: `9002` API, `9003` Console

### Backend Won't Start

1. Check PostgreSQL and Redis are healthy:
   ```bash
   docker ps --format '{{.Names}}: {{.Status}}'
   ```

2. Check backend logs:
   ```bash
   docker compose logs backend
   ```

3. Verify database connection:
   ```bash
   docker exec peoplehub-backend npx prisma db pull
   ```

### Frontend Shows Blank Page

1. Check frontend logs:
   ```bash
   docker compose logs frontend
   ```

2. Verify the dev server is running:
   ```bash
   docker exec peoplehub-frontend curl -s http://localhost:5173
   ```

3. Check that backend API is accessible from frontend:
   ```bash
   docker exec peoplehub-frontend wget -O- http://backend:3001/api/v1/health
   ```

### Database Migration Errors

```bash
# Reset database (WARNING: deletes all data)
docker exec peoplehub-backend npx prisma migrate reset --force

# Re-seed after reset
docker exec peoplehub-backend npm run prisma:seed
```

### JWT Key Errors

If you see errors about missing RSA keys, regenerate them:

```bash
openssl genrsa -out backend/config/jwtRS256.key 2048
openssl rsa -in backend/config/jwtRS256.key -pubout -out backend/config/jwtRS256.pem
docker compose restart backend
```

## Production Deployment

For production, use the production Dockerfiles:

```bash
# Update docker-compose.yml to use Dockerfile instead of Dockerfile.dev
# Build production images
docker compose -f docker-compose.prod.yml up -d --build
```

Production considerations:
- Use `.env.production` with secure credentials
- Enable HTTPS/TLS
- Use external secrets management
- Set up automated backups for PostgreSQL
- Configure proper CORS origins
- Disable Swagger in production (`SWAGGER_ENABLED=false`)
- Set `NODE_ENV=production`

## Release Information

- **Version**: v0.1.0
- **Release**: https://github.com/JackBee2912/peoplehub-hrm/releases/tag/v0.1.0
- **Branch**: feat/HRM-001-sprint1-foundation
- **Sprint**: 1 - Foundation & Core Employee Management
