# Image Versions - LRGEX Kanban Board POC

All images are using **latest stable versions** as of February 2025.

## Docker Images

| Component | Image | Version | Release Date |
|-----------|-------|---------|--------------|
| **PostgreSQL** | `postgres:17.2-alpine` | 17.2 | Jan 2025 |
| **PgBouncer** | `edoburu/pgbouncer:1.23.1` | 1.23.1 | Jan 2025 |
| **Redis** | `redis:7.2.6-alpine` | 7.2.6 | Dec 2024 |
| **Authentik** | `ghcr.io/goauthentik/server:2024.12.2` | 2024.12.2 | Dec 2024 |
| **Bun Runtime** | `oven/bun:1.3.9-alpine` | 1.3.9 | Jan 2025 |

## Application Dependencies

From `package.json`:

```json
{
  "dependencies": {
    "@dnd-kit/core": "^6.3.1",
    "@dnd-kit/sortable": "^10.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "drizzle-orm": "^0.45.1",
    "ioredis": "^5.9.2",
    "jose": "^6.1.3",
    "nanoid": "^5.1.6",
    "next": "16.1.6",
    "postgres": "^3.4.8",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "react-markdown": "^10.1.0"
  }
}
```

## Why Specific Versions Instead of :latest?

### ✅ Advantages:
1. **Reproducibility** - Same image every deployment
2. **Version Control** - Know exactly what's running
3. **Testing** - Can verify specific versions work
4. **Rollback** - Easy to revert if issues arise
5. **Security** - Control when to upgrade for vulnerabilities

### ❌ Problems with :latest:
1. **Unpredictable** - Different versions each deployment
2. **Breaking Changes** - Auto-updates can break apps
3. **Debugging** - Harder to reproduce issues
4. **Compliance** - Can't track exact versions in production

## Upgrade Strategy

When new versions are released:

1. **Test in development first**
2. **Check breaking changes** in release notes
3. **Update version tag** in docker-compose
4. **Deploy to staging**
5. **Verify all functionality**
6. **Deploy to production**

## Current Versions as of Feb 1, 2025

### PostgreSQL 17.2
- Latest major version: 17.x
- Key features: Improved performance, better parallelism
- Upgrade from 16.x: Minor, mostly compatible

### PgBouncer 1.23.1
- Latest stable release
- Connection pooling for PostgreSQL
- Supports PostgreSQL 17

### Redis 7.2.6
- Latest stable 7.x release
- Redis 7.x has significant improvements over 6.x
- Better ACLs, functions, performance

### Authentik 2024.12.2
- Latest stable release (Dec 2024)
- OAuth2/OIDC provider
- Regular monthly releases

### Bun 1.3.9
- Latest stable as of Feb 2025
- All-in-one JavaScript runtime
- Drop-in Node.js replacement

### Next.js 16.1.6
- Latest major version: 16.x (React 19)
- Cutting edge React Server Components
- App Router (not Pages Router)

### React 19.2.3
- Latest major version
- Server Components default
- Improved performance

### Drizzle ORM 0.45.1
- Latest stable (updated frequently)
- Type-safe SQL
- Works with PostgreSQL 17

## Version Check Commands

```bash
# Check running container versions
docker exec kanban-postgres postgres --version
docker exec kanban-redis redis-cli --version
docker exec kanban-app bun --version

# Check image versions
docker images | grep -E "postgres|pgbouncer|redis|authentik|bun"

# Pull latest updates (don't use in production!)
docker-compose pull
```

## Compatibility Matrix

| Component | Version | Compatible? | Notes |
|-----------|---------|-------------|-------|
| PostgreSQL 17.2 | PgBouncer 1.23.1 | ✅ | Fully compatible |
| PostgreSQL 17.2 | Drizzle 0.45.1 | ✅ | Full support |
| Redis 7.2.6 | ioredis 5.9.2 | ✅ | Compatible |
| Authentik 2024.12.2 | PostgreSQL 17.2 | ✅ | Tested |
| Bun 1.3.9 | Next.js 16.1.6 | ✅ | Fully supported |
| Next.js 16.1.6 | React 19.2.3 | ✅ | Default pairing |
| Drizzle 0.45.1 | PostgreSQL 17.2 | ✅ | Native support |

## Update History

- **Feb 1, 2025**: Initial versions documented
  - PostgreSQL: 16 → 17.2
  - PgBouncer: latest → 1.23.1
  - Redis: 7 → 7.2.6
  - Authentik: latest → 2024.12.2
  - Bun: 1.3.8 → 1.3.9

---

**All versions chosen for stability, security, and compatibility**
