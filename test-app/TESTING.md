# Testing Guide - LRGEX Kanban Board POC

## Quick Summary

This test app validates ALL LRGEX infrastructure components:
- ✅ PostgreSQL (via PgBouncer connection pooling)
- ✅ Authentik OAuth2/OIDC authentication
- ✅ Redis caching layer
- ✅ WAL-G continuous backup

---

## Prerequisites Checklist

- [ ] Docker and Docker Compose installed
- [ ] LRGEX infrastructure stack running
- [ ] Authentik OAuth client configured
- [ ] Network name matches between infra and app

---

## Method 1: Full Infrastructure Test (Recommended)

### Step 1: Generate & Deploy Infrastructure

```bash
# 1. Open lrgex-infrastructure-generator.html
# 2. Select: Full Auth Stack
# 3. Configure:
#    - Stack name: kanban-infra
#    - PostgreSQL password: (save this!)
#    - Authentik port: 9000
# 4. Click Generate → Download ZIP

# 5. Extract and deploy
unzip kanban-infra.zip
cd kanban-infra
bash deploy.sh
```

**Expected output:**
```
✓ PostgreSQL started on port 5432
✓ PgBouncer started on port 6432
✓ Authentik started on port 9000
✓ Redis started on port 6379
Network created: kanban-infra-network
```

### Step 2: Configure Authentik OAuth

1. Access `http://localhost:9000` (or your port)
2. Login with credentials from `kanban-infra/README.md`
3. Create OAuth application:
   - **Applications** → **Create**
   - Name: `LRGEX Kanban`
   - Slug: `lrgex-kanban`
   - Type: Native Application
   - Redirect URI: `http://localhost:3000/api/auth/callback`
4. Save Client ID and Secret

### Step 3: Deploy Test App

```bash
cd test-app

# Edit .env with your values
nano .env
```

Required `.env` values:
```bash
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@pgbouncer:6432/postgres
AUTHENTIK_CLIENT_ID=your-client-id-from-authentik
AUTHENTIK_CLIENT_SECRET=your-client-secret-from-authentik
JWT_SECRET=random-32-char-string
NETWORK_NAME=kanban-infra-network
```

```bash
# Deploy
export NETWORK_NAME=kanban-infra-network
docker-compose up -d --build
```

### Step 4: Test All Services

```bash
# 1. Health check (tests PostgreSQL + Redis + Authentik)
curl http://localhost:3000/api/health

# Expected response:
{
  "status": "healthy",
  "services": {
    "postgresql": { "status": "healthy", "responseTime": 15 },
    "redis": { "status": "healthy", "responseTime": 5 },
    "authentik": { "status": "healthy", "responseTime": 45 }
  }
}

# 2. Open browser
start http://localhost:3000

# 3. Click "Sign in with Authentik"
# Should redirect to Authentik, authorize, then back to /projects

# 4. Create test project
# - Click "New Project"
# - Fill name, description
# - Save

# 5. Create test tasks
# - Click project card
# - Add tasks to columns
# - Drag between columns

# 6. Test WAL-G backup
curl -X POST http://localhost:3000/api/backup-verify

# Expected response:
{
  "success": true,
  "message": "WAL-G backup test completed"
}
```

---

## Method 2: Minimal Test (No Auth)

If you just want to test PostgreSQL + Redis:

### Step 1: Start Minimal Services

```bash
cd test-app

# Create docker-compose.test.yml with only PostgreSQL + Redis
cat > docker-compose.test.yml << 'EOF'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: testpass
      POSTGRES_DB: kanban_test
    ports:
      - "5432:5432"
    networks:
      - test-network

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    networks:
      - test-network

networks:
  test-network:
    driver: bridge
EOF

docker-compose -f docker-compose.test.yml up -d
```

### Step 2: Test Direct Database Connection

```bash
# Run migrations
docker run --rm --network test-app_test-network \
  -e DATABASE_URL="postgresql://postgres:testpass@postgres:5432/kanban_test" \
  -v "$(pwd):/app" \
  oven/bun:1.3.8-alpine \
  sh -c "cd /app && bun install && bun run drizzle-kit push"

# Verify tables created
docker exec -it test-app-postgres-1 psql -U postgres -d kanban_test -c "\dt"
```

Expected output:
```
         List of relations
 Schema |     Name      | Type  |  Owner
--------+---------------+-------+----------
 public | users         | table | postgres
 public | projects      | table | postgres
 public | project_members | table | postgres
 public | columns       | table | postgres
 public | tasks         | table | postgres
 public | task_comments | table | postgres
 public | activity_logs | table | postgres
 public | tags          | table | postgres
 public | task_tags     | table | postgres
 public | notifications | table | postgres
 public | settings      | table | postgres
```

---

## Troubleshooting

### "Connection refused" to PostgreSQL

**Symptom:** `Error: connect ECONNREFUSED pgbouncer:6432`

**Cause:** App not on same network as infrastructure

**Fix:**
```bash
# Check network name in infra
docker network ls | grep kanban

# Update .env
export NETWORK_NAME=kanban-infra-network

# Rebuild app
docker-compose down
docker-compose up -d
```

### "Unauthorized" on all API endpoints

**Symptom:** 401 errors on `/api/projects`, `/api/tasks`, etc.

**Cause:** Not authenticated or session expired

**Fix:**
```bash
# Clear cookies and re-login
# 1. Open browser DevTools
# 2. Application → Cookies → localhost:3000
# 3. Delete 'session' cookie
# 4. Refresh page
```

### Authentik OAuth error "invalid_client"

**Symptom:** OAuth callback fails with error

**Cause:** Client ID/Secret mismatch

**Fix:**
1. Recheck `.env` values
2. Ensure redirect URI matches exactly (no trailing slashes)
3. Verify Authentik application is active

### Redis cache not working

**Symptom:** Search always returns `cached: false`

**Cause:** Redis connection failed

**Fix:**
```bash
# Test Redis from app container
docker exec kanban-app redis-cli -h redis ping
# Should return: PONG

# Check Redis logs
docker logs kanban-infra-redis-1
```

### WAL-G backup test fails

**Symptom:** `/api/backup-verify` returns 500 error

**Cause:** S3 not configured or WAL-G not setup

**Fix:**
```bash
# Check PostgreSQL container logs
docker logs kanban-infra-postgres-1 | grep -i walg

# Verify WAL-G environment variables
docker exec kanban-infra-postgres-1 env | grep AWS_
```

---

## Verification Checklist

Run this checklist to validate infrastructure:

### Database Layer
- [ ] Can connect to PostgreSQL via PgBouncer
- [ ] All 11 tables created successfully
- [ ] Can insert/query test data
- [ ] WAL-G backup verification passes

### Authentication Layer
- [ ] OAuth login redirects to Authentik
- [ ] User profile syncs on first login
- [ ] Session cookie persists
- [ ] Logout clears session

### Cache Layer
- [ ] Redis ping responds
- [ ] Search results cache for 5 minutes
- [ ] Cache invalidation works on updates

### Application Layer
- [ ] Can create projects
- [ ] Can create/move tasks
- [ ] Can post comments
- [ ] Health check returns all services healthy

---

## Performance Benchmarks

Expected response times (on healthy infrastructure):

```
Health check:          < 100ms
PostgreSQL query:      < 50ms  (via PgBouncer)
Redis cache hit:       < 10ms
Authentik OAuth:       < 500ms (first time)
Project list:          < 200ms
Task search (cached):  < 50ms
```

If slower, check:
- Docker resource limits
- Network latency
- PgBouncer pool size (default: 10 connections)

---

## Next Steps After Testing

Once all tests pass:

1. **Create demo data:**
   - Multiple projects
   - Tasks across columns
   - Team members

2. **Test backup/restore:**
   - Insert test data
   - Trigger WAL archive
   - Verify backup in S3

3. **Load testing:**
   - Simulate 10+ concurrent users
   - Monitor PgBouncer connection pool
   - Check Redis memory usage

4. **Production prep:**
   - Enable HTTPS (Traefik)
   - Configure domain names
   - Set up monitoring

---

## Emergency Reset

If everything breaks:

```bash
# Stop everything
cd test-app && docker-compose down
cd ../kanban-infra && docker-compose down

# Remove volumes (deletes all data!)
docker volume rm kanban-infra-postgres-data

# Start fresh
cd kanban-infra && docker-compose up -d
cd ../test-app && docker-compose up -d --build
```

---

**Generated for LRGEX Infrastructure Testing Platform**
