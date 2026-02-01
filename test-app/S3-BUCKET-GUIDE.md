# How to Choose & Configure S3 Bucket for WAL-G Backups

## The Key Setting: `WALG_S3_PREFIX`

This is the **ONLY** setting that determines which bucket to use:

```bash
# Format:
WALG_S3_PREFIX=s3://bucket-name/path/inside/bucket

# Examples:
WALG_S3_PREFIX=s3://kanban-backups                  # Root of bucket
WALG_S3_PREFIX=s3://my-backups/postgres            # Subfolder
WALG_S3_PREFIX=s3://company-dbs/prod/kanban        # Nested folders
```

## Step 1: Create S3 Bucket

### Option A: AWS S3 (Most Common)

**Using AWS Console:**
1. Go to https://s3.console.aws.amazon.com
2. Click **"Create bucket"**
3. Configure:
   - **Bucket name**: `kanban-backups-prod` (must be globally unique!)
   - **Region**: `us-east-1` (or closest to you)
   - **Block Public Access**: ✅ Enable (security best practice)
4. Click **"Create bucket"**

**Using AWS CLI:**
```bash
aws s3 mb s3://kanban-backups-prod --region us-east-1
```

**Update .env:**
```bash
AWS_ENDPOINT=https://s3.amazonaws.com
AWS_REGION=us-east-1
WALG_S3_PREFIX=s3://kanban-backups-prod
```

---

### Option B: Cloudflare R2 (Recommended - Free Egress!)

**Why R2?** No data transfer fees = huge savings!

**Using Cloudflare Dashboard:**
1. Go to https://dash.cloudflare.com
2. Navigate to **R2** → **Create Bucket**
3. Bucket name: `kanban-backups`
4. Click **"Create bucket"**
5. Go to **R2 Overview** → **Manage R2 API Tokens**
6. Create API Token with permissions:
   - Read & Write access to `kanban-backups`
7. Save Access Key ID & Secret Access Key

**Update .env:**
```bash
AWS_ACCESS_KEY_ID=your-r2-token-id
AWS_SECRET_ACCESS_KEY=your-r2-token-secret
AWS_ENDPOINT=https://abc123def456.r2.cloudflarestorage.com
AWS_REGION=auto
WALG_S3_PREFIX=s3://kanban-backups
```

---

### Option C: Wasabi (Cheapest Storage!)

**Why Wasabi?** $0.0059/GB/month (80% cheaper than AWS!)

**Using Wasabi Console:**
1. Go to https://console.wasabisys.com
2. Click **"Create Bucket"**
3. Bucket name: `kanban-backups`
4. Region: Choose closest (us-east-1, eu-central-1, etc.)
5. Click **"Create Bucket"**
6. Go to **Access Keys** → **Create New Access Key**
7. Save Access Key & Secret Key

**Update .env:**
```bash
AWS_ACCESS_KEY_ID=your-wasabi-access-key
AWS_SECRET_ACCESS_KEY=your-wasabi-secret-key
AWS_ENDPOINT=https://s3.wasabisys.com
AWS_REGION=us-east-1
WALG_S3_PREFIX=s3://kanban-backups
```

---

### Option D: Backblaze B2

**Using Backblaze Console:**
1. Go to https://secure.backblaze.com/b2_buckets.htm
2. Click **"Create a Bucket"**
3. Bucket name: `kanban-backups`
4. Files in Bucket: **Private**
5. Click **"Create a Bucket"**
6. Go to **App Keys** → **Add a New Application Key**
7. Restrict to `kanban-backups` bucket
8. Save keyID & applicationKey

**Update .env:**
```bash
AWS_ACCESS_KEY_ID=your-b2-key-id
AWS_SECRET_ACCESS_KEY=your-b2-application-key
AWS_ENDPOINT=https://s3.us-west-002.backblazeb2.com
AWS_REGION=us-west-002
WALG_S3_PREFIX=s3://kanban-backups
```

---

### Option E: MinIO (Self-Hosted / Local)

**Why MinIO?** Full control, no external dependencies, local testing

**Using Docker:**
```bash
docker run -d \
  --name minio \
  -p 9000:9000 \
  -p 9001:9001 \
  -v minio-data:/data \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  minio/minio server /data --console-address ":9001"
```

**Create Bucket:**
1. Open http://localhost:9001
2. Login: `minioadmin` / `minioadmin`
3. Click **"Buckets"** → **"Create Bucket"**
4. Name: `kanban-backups`
5. Go to **Access Keys** → **Create Access Key**

**Update .env:**
```bash
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_ENDPOINT=http://minio:9000
AWS_REGION=us-east-1
WALG_S3_PREFIX=s3://kanban-backups
```

---

## Step 2: Organize Buckets (Best Practices)

### Option 1: Single Bucket per App
```
s3://kanban-backups-prod/       # Production Kanban
s3://kanban-backups-staging/    # Staging Kanban
s3://kanban-backups-dev/        # Development Kanban
```

### Option 2: Single Bucket with Folders (Recommended)
```
s3://company-dbs/
├── kanban-prod/
├── kanban-staging/
├── kanban-dev/
├── other-app-prod/
└── other-app-staging/
```

**.env for folder approach:**
```bash
WALG_S3_PREFIX=s3://company-dbs/kanban-prod
```

### Option 3: Date-Based Folders
```
s3://kanban-backups/
├── 2025-01/
├── 2025-02/
└── 2025-03/
```

**.env for date folders:**
```bash
WALG_S3_PREFIX=s3://kanban-backups/$(date +%Y-%m)
```

---

## Step 3: Bucket Configuration (Required Settings)

### Enable Versioning (Optional but Recommended)
**Why:** Protect against accidental deletions

```bash
# AWS S3
aws s3api put-bucket-versioning \
  --bucket kanban-backups-prod \
  --versioning-configuration Status=Enabled

# Cloudflare R2 (via API)
curl -X PUT \
  https://api.cloudflare.com/client/v4/accounts/{account_id}/r2/buckets/kanban-backups \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

### Set Lifecycle Policy (Auto-Delete Old Backups)
**Why:** Control storage costs

```bash
# Delete backups older than 90 days
aws s3api put-bucket-lifecycle-configuration \
  --bucket kanban-backups-prod \
  --lifecycle-configuration '{
    "Rules": [{
      "Id": "Delete-old-backups",
      "Status": "Enabled",
      "Prefix": "",
      "Expiration": { "Days": 90 }
    }]
  }'
```

### Enable Encryption (Recommended)
```bash
# AWS S3 (default encryption)
aws s3api put-bucket-encryption \
  --bucket kanban-backups-prod \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'
```

---

## Step 4: Update .env with Your Bucket

### Example 1: AWS S3 - Simple
```bash
WALG_S3_PREFIX=s3://kanban-backups-prod
```

### Example 2: Cloudflare R2 - With Subfolder
```bash
WALG_S3_PREFIX=s3://my-r2-bucket/databases/kanban/prod
```

### Example 3: Wasabi - Environment-Specific
```bash
# Production
WALG_S3_PREFIX=s3://kanban-backups-prod

# Staging
WALG_S3_PREFIX=s3://kanban-backups-staging
```

---

## Verification: Test Bucket Access

After configuring, test the connection:

```bash
# Load .env
set -a; source .env; set +a

# Test S3 access (using AWS CLI or compatible)
aws s3 ls $WALG_S3_PREFIX \
  --endpoint-url=$AWS_ENDPOINT \
  --access-key-id=$AWS_ACCESS_KEY_ID \
  --secret-access-key=$AWS_SECRET_ACCESS_KEY

# Expected output: (empty or list of existing files)
```

---

## WAL-G Bucket Structure

After WAL-G starts, your bucket will look like:

```
s3://kanban-backups-prod/
├── base_backups/
│   ├── 000000010000000000000001_20250201T120000Z
│   └── 000000010000000000000002_20250202T120000Z
├── wal_005/
│   ├── 000000010000000000000001
│   └── 000000010000000000000002
└── wal_006/
    └── ...
```

**What each folder means:**
- `base_backups/` - Full database backups
- `wal_XXX/` - Transaction log files (continuous backup)
- `.wal-g_backup_manifest.json` - Backup metadata

---

## Cost Estimation by Provider

### Database Size: 10GB

| Provider | Cost/Month | E Fees | Total/Month |
|----------|------------|--------|-------------|
| **AWS S3** | $0.23 | $0.09 | **$0.32** |
| **Cloudflare R2** | $0.15 | **$0.00** | **$0.15** ⭐ |
| **Wasabi** | $0.06 | $0.00 | **$0.06** ⭐⭐ |
| **Backblaze B2** | $0.10 | $0.01 | **$0.11** |
| **MinIO** | $0.00 (self-hosted) | $0.00 | **$0.00** 🏠 |

**Recommendation:**
- **Testing/Dev**: MinIO (free, local)
- **Production**: Cloudflare R2 (no egress fees) or Wasabi (cheapest)
- **Enterprise**: AWS S3 (most features)

---

## Quick Decision Guide

**Choose MinIO if:**
- Testing locally
- Want full control
- No external dependencies

**Choose Cloudflare R2 if:**
- Want to avoid egress fees
- Already using Cloudflare
- Need global distribution

**Choose Wasabi if:**
- Want cheapest storage
- Don't need advanced features
- OK with 90-day retention minimum

**Choose AWS S3 if:**
- Already in AWS ecosystem
- Need advanced features (Lambda, integrations)
- Want maximum compatibility

---

## Example: Complete Setup (Cloudflare R2)

```bash
# 1. Create bucket in Cloudflare Dashboard
#    Name: kanban-backups

# 2. Create R2 API Token
#    - Permissions: Read & Write
#    - Bucket: kanban-backups
#    - Save: Access Key ID & Secret Access Key

# 3. Update .env
cat >> .env << 'EOF'
AWS_ACCESS_KEY_ID=abc123def456
AWS_SECRET_ACCESS_KEY=xyz789ghi012
AWS_ENDPOINT=https://abc123def456.r2.cloudflarestorage.com
AWS_REGION=auto
WALG_S3_PREFIX=s3://kanban-backups
EOF

# 4. Test connection
set -a; source .env; set +a
aws s3 ls $WALG_S3_PREFIX --endpoint-url=$AWS_ENDPOINT

# 5. Start WAL-G
docker-compose up -d walg

# 6. Verify backups
docker exec kanban-walg wal-g backup-list
```

---

## Troubleshooting

### "Access Denied"
**Cause:** Wrong credentials or no permissions
**Fix:** Recheck API token has Read+Write permissions

### "Bucket Not Found"
**Cause:** Bucket doesn't exist or wrong name
**Fix:** Create bucket first, verify name in .env

### "Endpoint Connection Failed"
**Cause:** Wrong endpoint URL
**Fix:** Check provider docs for correct endpoint

### "No Such File" During Restore
**Cause:** No backups exist yet
**Fix:** Wait for WAL-G to create first backup (check logs)

---

**Choose your bucket, update .env, and WAL-G will handle the rest!** 🪣
