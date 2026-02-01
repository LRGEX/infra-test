# Environment Configuration Guide

## Quick Setup

### Step 1: Copy .env Template
```bash
cd test-app
# .env is already created with default values
```

### Step 2: Update Required Values

Edit `.env`:
```bash
nano .env
```

## Configuration Fields

### 1. PostgreSQL Password (CHANGE THIS!)
```bash
POSTGRES_PASSWORD=kanban-postgres-pass-secure
```
**Action:** Change to a strong password
**Example:** `MyStr0ngP@ssw0rd!2025`

### 2. Authentik Secret Key (CHANGE THIS!)
```bash
AUTHENTIK_SECRET_KEY=kanban-authentik-secret-key-change-in-production
```
**Action:** Generate random string
**Command:** `openssl rand -base64 48`
**Example:** `aB3xK9mP2qL7vN8wR4sT6uY1cZ5dF8gH2jK3mL6nP9qR=`

### 3. OAuth Client Credentials (Configure After Authentik Starts)
```bash
AUTHENTIK_CLIENT_ID=configure-in-authentik-ui
AUTHENTIK_CLIENT_SECRET=configure-in-authentik-ui
```
**Action:**
1. Start services: `docker-compose up -d`
2. Open http://localhost:9000
3. Create Authentik admin account
4. Create OAuth Provider (note Client ID & Secret)
5. Update these values in `.env`
6. Restart: `docker-compose restart test-app`

### 4. JWT Secret (CHANGE THIS!)
```bash
JWT_SECRET=kanban-jwt-secret-minimum-32-characters-long
```
**Action:** Generate random string (min 32 chars)
**Command:** `openssl rand -base64 48`
**Example:** `xY7zK3mP9qL2vN5wR8sT1uY4cZ7dF0gH3jK6mL9nP0qR=`

### 5. S3 Backup Configuration (OPTIONAL - For WAL-G)
```bash
AWS_ACCESS_KEY_ID=your-s3-access-key-id
AWS_SECRET_ACCESS_KEY=your-s3-secret-access-key
AWS_ENDPOINT=https://s3.amazonaws.com
AWS_REGION=us-east-1
WALG_S3_PREFIX=s3://kanban-backups
```

#### If NOT Using S3 Backup:
**Option 1:** Leave as-is (WAL-G will fail but won't break the app)
**Option 2:** Comment out or remove these lines

#### If Using S3 Backup:

**AWS S3:**
```bash
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_ENDPOINT=https://s3.amazonaws.com
AWS_REGION=us-east-1
WALG_S3_PREFIX=s3://my-backup-bucket/kanban
```

**Cloudflare R2 (Recommended - Free Egress):**
```bash
AWS_ACCESS_KEY_ID=your-r2-access-key
AWS_SECRET_ACCESS_KEY=your-r2-secret-key
AWS_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
AWS_REGION=auto
WALG_S3_PREFIX=s3://my-r2-bucket/kanban
```

**Wasabi (Cheapest Storage):**
```bash
AWS_ACCESS_KEY_ID=your-wasabi-key
AWS_SECRET_ACCESS_KEY=your-wasabi-secret
AWS_ENDPOINT=https://s3.wasabisys.com
AWS_REGION=us-east-1
WALG_S3_PREFIX=s3://my-wasabi-bucket/kanban
```

**MinIO (Self-Hosted):**
```bash
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_ENDPOINT=http://minio-server:9000
AWS_REGION=us-east-1
WALG_S3_PREFIX=s3://kanban-backups/postgres
```

## Minimal .env for Testing

If you just want to test without S3 backup:

```bash
POSTGRES_PASSWORD=testpass123
AUTHENTIK_SECRET_KEY=$(openssl rand -base64 48)
AUTHENTIK_CLIENT_ID=test-client
AUTHENTIK_CLIENT_SECRET=test-secret
JWT_SECRET=$(openssl rand -base64 48)
# AWS_* lines can be removed or left with defaults
```

## Security Best Practices

1. **Never commit .env to git** (already in .gitignore)
2. **Use strong random passwords** (32+ chars)
3. **Rotate secrets regularly** (every 90 days)
4. **Use different secrets per environment**
5. **Limit S3 access** (only needed bucket, read/write)
6. **Enable S3 encryption** (at rest and in transit)

## Quick Generate Commands

```bash
# Generate all secrets at once
cat >> .env << 'EOF'
POSTGRES_PASSWORD=$(openssl rand -base64 32)
AUTHENTIK_SECRET_KEY=$(openssl rand -base64 48)
JWT_SECRET=$(openssl rand -base64 48)
EOF
```

## Verification

After updating `.env`, verify:
```bash
# Load environment
set -a; source .env; set +a

# Check values are loaded
echo $POSTGRES_PASSWORD
echo $AWS_ACCESS_KEY_ID

# Start services
docker-compose up -d
```

## Troubleshooting

### "Variable not set" errors
**Cause:** .env not loaded
**Fix:** Use `set -a; source .env; set +a` before docker-compose

### "Invalid credentials" for S3
**Cause:** Wrong S3 credentials
**Fix:** Double-check credentials, test with AWS CLI

### Authentik OAuth fails
**Cause:** Client ID/Secret not updated
**Fix:** Complete Authentik setup first, then update .env

## Example Complete .env

```bash
# PostgreSQL
POSTGRES_PASSWORD=rX7kP9mN2vL5wQ8sT1uY4cZ7dF0gH3jK6

# Authentik
AUTHENTIK_SECRET_KEY=aB3xK9mP2qL7vN8wR4sT6uY1cZ5dF8gH2jK3mL6nP9qR=

# OAuth (after Authentik setup)
AUTHENTIK_CLIENT_ID=kanban-app
AUTHENTIK_CLIENT_SECRET=authentik-generated-secret-here

# JWT
JWT_SECRET=xY7zK3mP9qL2vN5wR8sT1uY4cZ7dF0gH3jK6mL9nP0qR=

# S3 Backup (Cloudflare R2 example)
AWS_ACCESS_KEY_ID=1234567890abcdef
AWS_SECRET_ACCESS_KEY=abcdef1234567890abcdef1234567890abcdef
AWS_ENDPOINT=https://abc123.r2.cloudflarestorage.com
AWS_REGION=auto
WALG_S3_PREFIX=s3://kanban-backups/prod
```

---

**Update .env before starting services for the first time!** 🔐
