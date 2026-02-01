# Quick Start - Docker Compose Testing

Complete guide to test LRGEX Kanban Board with full infrastructure stack.

---

## Step 1: Start All Services

```bash
cd test-app

# Load environment variables
set -a; source .env.production; set +a

# Start everything
docker-compose up -d --build
```

**Expected output:**
```
✓ Creating network "kanban-network"
✓ Creating volume "kanban-postgres-data"
✓ Creating volume "kanban-redis-data"
✓ Starting kanban-postgres
✓ Starting kanban-pgbouncer
✓ Starting kanban-redis
✓ Starting kanban-authentik
✓ Starting kanban-authentik-worker
✓ Starting kanban-app
```

**Wait 2-3 minutes** for Authentik to initialize (it takes time on first run).

---

## Step 2: Verify Services are Running

```bash
# Check all containers
docker ps --format "table {{.Names}}\t{{.Status}}"

# Should show:
# kanban-postgres         Up
# kanban-pgbouncer        Up
# kanban-redis            Up
# kanban-authentik        Up
# kanban-authentik-worker Up
# kanban-app              Up
```

---

## Step 3: Setup Authentik OAuth

### 3.1 Access Authentik

Open browser: `http://localhost:9000`

**First login:**
- Click "Create Admin Account"
- Email: `admin@lrgex.local`
- Password: (create your own)
- Complete setup wizard

### 3.2 Create OAuth Provider

1. Navigate: **Providers** → **Create**
2. Select: **OAuth2/OpenID Provider**
3. Configure:
   - Name: `Kanban OAuth`
   - Authentication flow: `authorization-code`
   - Authorization flow: `authorize`
   - Client ID: `kanban-app` (note this down!)
   - Client Secret: Click "Generate" (note this down!)
   - Redirect URIs: `http://localhost:3000/api/auth/callback`
   - Post logout redirect URIs: `http://localhost:3000/login`
4. Click **Create**

### 3.3 Create Application

1. Navigate: **Applications** → **Create**
2. Configure:
   - Name: `LRGEX Kanban`
   - Slug: `lrgex-kanban`
   - Provider: Select `Kanban OAuth` (created above)
   - Type: `Native Application`
3. Click **Create**

### 3.4 Update .env with OAuth Credentials

```bash
# Edit .env.production
nano .env.production
```

Update these lines with values from Authentik:
```bash
AUTHENTIK_CLIENT_ID=kanban-app  # From Provider
AUTHENTIK_CLIENT_SECRET=your-generated-secret-here
```

Restart the app:
```bash
docker-compose restart test-app
```

---

## Step 4: Initialize Database

```bash
# Run database migrations
docker exec kanban-app bun run drizzle-kit push

# Verify tables created
docker exec kanban-postgres psql -U postgres -d postgres -c "\dt"
```

**Expected tables:** 11 tables (users, projects, tasks, columns, etc.)

---

## Step 5: Test the Application

### 5.1 Health Check

```bash
curl http://localhost:3000/api/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "services": {
    "postgresql": { "status": "healthy", "responseTime": 15 },
    "redis": { "status": "healthy", "responseTime": 5 },
    "authentik": { "status": "healthy", "responseTime": 45 }
  }
}
```

### 5.2 Open Application

```bash
# Windows
start http://localhost:3000

# Or open browser manually to:
# http://localhost:3000
```

### 5.3 Test OAuth Login

1. Click **"Sign in with Authentik"**
2. Should redirect to Authentik
3. Authorize the application
4. Redirect back to `/projects`
5. See empty projects list

### 5.4 Create Test Data

1. Click **"New Project"**
2. Name: `LRGEX Test Project`
3. Description: `Testing infrastructure integration`
4. Color: `#cb803c` (LRGEX orange)
5. Click **Create**

6. On project page, add columns:
   - Backlog
   - To Do
   - In Progress
   - Done

7. Add test tasks to columns

---

## Step 6: Test Infrastructure Components

### Test PostgreSQL via PgBouncer

```bash
# Connect via PgBouncer
docker exec kanban-postgres psql -U postgres -h pgbouncer -p 6432 -d postgres -c "SELECT COUNT(*) FROM users"

# Should return: 0 (or count of users)
```

### Test Redis Caching

```bash
# Check Redis is working
docker exec kanban-redis redis-cli ping
# Should return: PONG

# Check cached data
docker exec kanban-redis redis-cli KEYS "lrgex:*"
```

### Test Search (with Redis caching)

```bash
# Create some tasks first via UI, then:

curl "http://localhost:3000/api/search?q=test&projectId=first-project-id"

# First call: cached: false
# Second call within 5min: cached: true
```

### Test Health Monitoring

```bash
# Continuous health check
watch -n 5 'curl -s http://localhost:3000/api/health | jq'
```

---

## Step 7: Verify All Services

Run this checklist:

- [ ] PostgreSQL accepting connections on port 5432
- [ ] PgBouncer pooling connections on port 6432
- [ ] Redis caching on port 6379
- [ ] Authentik serving on port 9000
- [ ] Test app serving on port 3000
- [ ] OAuth login works
- [ ] Can create projects
- [ ] Can create/move tasks
- [ ] Health check returns all healthy
- [ ] Database migrations applied
- [ ] Redis cache working (search cached: true on second call)

---

## Troubleshooting

### Authentik won't start

```bash
# Check logs
docker logs kanban-authentik

# Common issue: Database not ready
# Solution: Wait longer, Authentik takes 2-3 minutes on first start
```

### OAuth callback fails with "invalid_client"

```bash
# Verify .env credentials match Authentik Provider
docker exec kanban-app env | grep AUTHENTIK

# Recheck Provider configuration in Authentik UI
# Ensure redirect URIs match exactly
```

### Database connection refused

```bash
# Check PgBouncer is running
docker exec kanban-pgbouncer pg_isready -h postgres -p 5432

# Check DATABASE_URL
docker exec kanban-app env | grep DATABASE_URL
```

### "Unauthorized" on API calls

```bash
# Clear browser cookies
# Open DevTools → Application → Cookies → localhost:3000
# Delete 'session' cookie
# Refresh and login again
```

### App won't build

```bash
# Check Bun is available
docker exec kanban-app bun --version

# Build manually
docker exec kanban-app bun run build

# Check logs
docker logs kanban-app
```

---

## Stopping Everything

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (deletes all data!)
docker-compose down -v

# View logs
docker-compose logs -f
```

---

## Performance Monitoring

```bash
# Container stats
docker stats

# Database size
docker exec kanban-postgres psql -U postgres -d postgres -c "SELECT pg_size_pretty(pg_database_size('postgres'));"

# Redis memory
docker exec kanban-redis redis-cli INFO memory

# PgBouncer stats
docker exec kanban-pgbouncer psql -h localhost -p 6432 -U postgres -d pgbouncer -c "SHOW STATS;"
```

---

## Next Steps

Once everything works:

1. **Create test users** in Authentik
2. **Add team members** to projects
3. **Test concurrent access** (multiple browsers)
4. **Monitor PgBouncer pooling**
5. **Test task search caching**
6. **Verify backup strategies**

---

**File Locations:**
- Full stack: `docker-compose.full.yml`
- Environment: `.env.production`
- Logs: `docker-compose logs [service-name]`

**Access Points:**
- Application: http://localhost:3000
- Authentik: http://localhost:9000
- PostgreSQL: localhost:5432
- PgBouncer: localhost:6432
- Redis: localhost:6379
