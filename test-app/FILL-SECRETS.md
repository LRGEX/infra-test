# How to Fill All Secrets in .env

Let's go through each secret step-by-step.

---

## 1. POSTGRES_PASSWORD (Database Password)

**What it's for:** Password for PostgreSQL database

**How to generate:**
```bash
# Option 1: Use openssl (recommended)
openssl rand -base64 32

# Option 2: Use any random string
# Just make sure it's 16+ characters, mixed case, numbers, symbols
```

**Example output:** `rX7kP9mN2vL5wQ8sT1uY4cZ7dF0gH3jK6`

**In .env:**
```bash
POSTGRES_PASSWORD=rX7kP9mN2vL5wQ8sT1uY4cZ7dF0gH3jK6
```

**That's it!** You don't need to remember this password. It's only used by Docker services internally.

---

## 2. AUTHENTIK_SECRET_KEY (Authentik Encryption Key)

**What it's for:** Encrypts sessions, tokens, and sensitive data in Authentik

**How to generate:**
```bash
openssl rand -base64 48
```

**Example output:** `aB3xK9mP2qL7vN8wR4sT6uY1cZ5dF8gH2jK3mL6nP9qR=`

**In .env:**
```bash
AUTHENTIK_SECRET_KEY=aB3xK9mP2qL7vN8wR4sT6uY1cZ5dF8gH2jK3mL6nP9qR=
```

**That's it!** Authentik uses this automatically when it starts.

---

## 3. AUTHENTIK_CLIENT_ID & CLIENT_SECRET (OAuth Credentials)

**What they're for:** These allow your app to talk to Authentik for login

**You DON'T generate these manually!** You get them from Authentik AFTER it's running.

### Step-by-Step:

#### Step 1: Start Services First
```bash
# Start Authentik (temporarily with placeholder values)
docker-compose up -d postgres authentik authentik-worker

# Wait 2-3 minutes for Authentik to initialize
# Watch logs: docker logs -f kanban-authentik
```

#### Step 2: Create Authentik Admin Account
1. Open browser: http://localhost:9000
2. Click **"Create Admin Account"**
3. Fill in:
   - Email: `admin@lrgex.local` (or your email)
   - Password: (create your own)
   - Confirm Password
4. Click **"Continue"**
5. Complete setup wizard (click through defaults)

#### Step 3: Create OAuth Provider
1. In Authentik, go to: **Applications** → **Providers**
2. Click **"Create"**
3. Select: **OAuth2/OpenID Provider**
4. Fill in:
   - Name: `Kanban OAuth`
   - Authentication flow: `authorization-code`
   - Authorization flow: `authorize`
5. Scroll to **"Protocol Settings"**
6. Client ID: `kanban-app` ← **Remember this!**
7. Client Secret: Click **"Generate"** → Click **"Generate"** again
8. **Copy the secret** (it shows only once!) ← **Remember this!**
9. Redirect URIs: `http://localhost:3000/api/auth/callback`
10. Post logout redirect URIs: `http://localhost:3000/login`
11. Click **"Create"**

#### Step 4: Create Application
1. Go to: **Applications** → **Applications**
2. Click **"Create"**
3. Fill in:
   - Name: `LRGEX Kanban`
   - Slug: `lrgex-kanban`
   - Provider: Select `Kanban OAuth` (from step 3)
   - Type: `Native Application`
4. Click **"Create"**

#### Step 5: Update .env with OAuth Credentials
```bash
nano .env
```

Update these lines:
```bash
AUTHENTIK_CLIENT_ID=kanban-app
AUTHENTIK_CLIENT_SECRET=paste-the-secret-you-copied-in-step-3
```

#### Step 6: Restart App
```bash
docker-compose restart test-app
```

**That's it!** Now OAuth login will work.

---

## 4. JWT_SECRET (Session Token Secret)

**What it's for:** Signs and encrypts user session cookies

**How to generate:**
```bash
openssl rand -base64 48
```

**Example output:** `xY7zK3mP9qL2vN5wR8sT1uY4cZ7dF0gH3jK6mL9nP0qR=`

**In .env:**
```bash
JWT_SECRET=xY7zK3mP9qL2vN5wR8sT1uY4cZ7dF0gH3jK6mL9nP0qR=
```

**That's it!** Your app uses this automatically.

---

## Quick: Generate ALL Secrets at Once

```bash
# Generate all secrets
POSTGRES_SECRET=$(openssl rand -base64 32)
AUTHENTIK_SECRET=$(openssl rand -base64 48)
JWT_SECRET=$(openssl rand -base64 48)

# Print them
echo "POSTGRES_PASSWORD=$POSTGRES_SECRET"
echo "AUTHENTIK_SECRET_KEY=$AUTHENTIK_SECRET"
echo "JWT_SECRET=$JWT_SECRET"
```

Copy those into `.env`. Then you'll still need to do the OAuth Client ID/Secret from Authentik (see above).

---

## Complete .env Example

Here's a fully filled `.env` (using example values - DON'T use these!):

```bash
# PostgreSQL
POSTGRES_PASSWORD=rX7kP9mN2vL5wQ8sT1uY4cZ7dF0gH3jK6

# Authentik Secret
AUTHENTIK_SECRET_KEY=aB3xK9mP2qL7vN8wR4sT6uY1cZ5dF8gH2jK3mL6nP9qR=

# OAuth (from Authentik UI - see steps above)
AUTHENTIK_CLIENT_ID=kanban-app
AUTHENTIK_CLIENT_SECRET=abc123def456789-generated-by-authentik

# JWT
JWT_SECRET=xY7zK3mP9qL2vN5wR8sT1uY4cZ7dF0gH3jK6mL9nP0qR=

# S3 Backup (you already know this part)
AWS_ACCESS_KEY_ID=your-s3-key
AWS_SECRET_ACCESS_KEY=your-s3-secret
AWS_ENDPOINT=https://s3.amazonaws.com
AWS_REGION=us-east-1
WALG_S3_PREFIX=s3://kanban-backups
```

---

## Order of Operations

### 1. Before Starting Anything:
Generate secrets you can:
```bash
# Generate these 3 secrets
openssl rand -base64 32  # For POSTGRES_PASSWORD
openssl rand -base64 48  # For AUTHENTIK_SECRET_KEY
openssl rand -base64 48  # For JWT_SECRET
```

Put them in `.env`:
```bash
POSTGRES_PASSWORD=<first output>
AUTHENTIK_SECRET_KEY=<second output>
JWT_SECRET=<third output>
AUTHENTIK_CLIENT_ID=placeholder-will-fill-later
AUTHENTIK_CLIENT_SECRET=placeholder-will-fill-later
AWS_*=<your S3 credentials>
```

### 2. Start Services:
```bash
docker-compose up -d postgres authentik authentik-worker
```

### 3. Configure OAuth in Authentik:
Follow steps 1-6 above to get CLIENT_ID and CLIENT_SECRET

### 4. Update .env:
```bash
nano .env
# Replace placeholder values with actual values from Authentik
```

### 5. Start Everything:
```bash
docker-compose up -d --build
```

---

## Testing Your Configuration

After filling all secrets:

```bash
# 1. Load environment
set -a; source .env; set +a

# 2. Test PostgreSQL
docker exec kanban-postgres psql -U postgres -c "SELECT 1"

# 3. Test Authentik
curl http://localhost:9000

# 4. Test App
curl http://localhost:3000/api/health

# 5. Test WAL-G (if S3 configured)
docker exec kanban-walg wal-g backup-list
```

---

## Summary

| Secret | How to Get | When to Fill |
|--------|-----------|--------------|
| **POSTGRES_PASSWORD** | Generate with `openssl rand -base64 32` | Before starting |
| **AUTHENTIK_SECRET_KEY** | Generate with `openssl rand -base64 48` | Before starting |
| **AUTHENTIK_CLIENT_ID** | Create in Authentik UI (step 3 above) | After Authentik starts |
| **AUTHENTIK_CLIENT_SECRET** | Create in Authentik UI (step 3 above) | After Authentik starts |
| **JWT_SECRET** | Generate with `openssl rand -base64 48` | Before starting |
| **AWS_\*** | Your S3 provider (you know this) | Before starting |

**Key Point:** Only CLIENT_ID and CLIENT_SECRET come from Authentik UI. Everything else you generate yourself!

---

## One-Command Setup (with placeholders)

```bash
# Generate secrets and create .env
cat > .env << 'EOF'
# PostgreSQL
POSTGRES_PASSWORD=$(openssl rand -base64 32)

# Authentik
AUTHENTIK_SECRET_KEY=$(openssl rand -base64 48)

# OAuth (fill after Authentik setup)
AUTHENTIK_CLIENT_ID=FILL_LATER
AUTHENTIK_CLIENT_SECRET=FILL_LATER

# JWT
JWT_SECRET=$(openssl rand -base64 48)

# S3 (fill with your S3 credentials)
AWS_ACCESS_KEY_ID=your-s3-key
AWS_SECRET_ACCESS_KEY=your-s3-secret
AWS_ENDPOINT=https://s3.amazonaws.com
AWS_REGION=us-east-1
WALG_S3_PREFIX=s3://kanban-backups
EOF

# Then start Authentik
docker-compose up -d postgres authentik authentik-worker

# After Authentik starts, configure OAuth (see steps above)
# Then update .env with real CLIENT_ID and CLIENT_SECRET
```

---

**Need help?** The Authentik OAuth setup is the only tricky part. Everything else is just generating random strings!
