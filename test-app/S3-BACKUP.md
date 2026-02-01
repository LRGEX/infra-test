# S3 Backup Configuration (WAL-G)

## Overview

WAL-G continuously backs up PostgreSQL to S3-compatible storage. Every change to the database is archived within seconds.

## Supported S3 Providers

- **AWS S3** - `https://s3.amazonaws.com`
- **Cloudflare R2** - `https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com`
- **Wasabi** - `https://s3.wasabisys.com`
- **Backblaze B2** - `https://s3.us-west-000.backblazeb2.com`
- **MinIO** - Self-hosted (your server URL)
- **MEGA S4** - Check provider docs

## Quick Setup

### 1. Get S3 Credentials

Create an S3 bucket and get:
- Access Key ID
- Secret Access Key
- Bucket Region
- Endpoint URL

### 2. Update .env.production

```bash
# Edit .env.production
nano .env.production
```

Update these values:
```bash
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_ENDPOINT=https://s3.amazonaws.com
AWS_REGION=us-east-1
WALG_S3_PREFIX=s3://my-backup-bucket/kanban
```

### 3. Start WAL-G Service

```bash
docker-compose up -d walg
```

WAL-G will:
- ✅ Install WAL-G binary
- ✅ Configure S3 connection
- ✅ Take initial full backup
- ✅ Continuously archive WAL files
- ✅ Compress backups (gzip)
- ✅ Upload to S3 every 60 seconds

## Testing WAL-G

### Check Backup Status

```bash
# List all backups
docker exec kanban-walg wal-g backup-list

# Expected output:
# name  last_modified  wal_segment_backup_start
# base  2025-02-01T12:00:00Z  000000010000000000000001
```

### Verify S3 Uploads

```bash
# Check S3 bucket (using AWS CLI)
aws s3 ls s3://kanban-backups/

# Or check WAL-G logs
docker logs kanban-walg
```

### Test Backup Create

```bash
# Manual backup
docker exec kanban-walg wal-g backup-name kanban-test-$(date +%Y%m%d)

# Push to S3
docker exec kanban-walg wal-g backup-push
```

### Test Backup Restore

```bash
# Stop PostgreSQL
docker-compose stop postgres

# Delete current data (DANGER!)
docker volume rm kanban-postgres-data

# Start PostgreSQL (empty)
docker-compose up -d postgres

# Wait for postgres to be ready
docker exec kanban-walg pg_isready -h postgres

# Restore from latest backup
docker exec kanban-walg wal-g backup-fetch /var/lib/postgresql/data LATEST

# Start PostgreSQL
docker-compose start postgres
```

## WAL-G Features

### Continuous Archiving
- WAL files uploaded every 60 seconds
- Automatic compression (gzip)
- Delta backups (incremental)
- No manual intervention needed

### Backup Retention
- Full backups: Daily
- WAL files: Continuous
- Retention: Configure as needed
- Storage cost: ~$0.023/GB/month (AWS)

### Performance
- Minimal impact on PostgreSQL
- Asynchronous uploads
- Connection pooling via PgBouncer
- Compression reduces bandwidth

## S3 Provider Examples

### AWS S3
```bash
AWS_ENDPOINT=https://s3.amazonaws.com
AWS_REGION=us-east-1
WALG_S3_PREFIX=s3://my-bucket/postgres
```

### Cloudflare R2 (Free Egress!)
```bash
AWS_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
AWS_REGION=auto
WALG_S3_PREFIX=s3://my-bucket/postgres
```

### Wasabi (Cheaper!)
```bash
AWS_ENDPOINT=https://s3.wasabisys.com
AWS_REGION=us-east-1
WALG_S3_PREFIX=s3://my-bucket/postgres
```

### MinIO (Self-hosted)
```bash
AWS_ENDPOINT=http://minio:9000
AWS_REGION=us-east-1
WALG_S3_PREFIX=s3://my-bucket/postgres
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
```

## Monitoring WAL-G

### Check Logs
```bash
# Real-time logs
docker logs -f kanban-walg

# Should show:
# [2025-02-01 12:00:00] Checking backup status...
# [2025-02-01 12:00:01] base  2025-02-01T12:00:00Z
# [2025-02-01 12:00:01] Forcing WAL switch...
# [2025-02-01 12:00:02] Waiting 60 seconds...
```

### Backup Size
```bash
# Check S3 bucket size
aws s3 ls s3://kanban-backups/ --recursive --summarize
```

### WAL Uploads
```bash
# See WAL files in S3
aws s3 ls s3://kanban-backups/wal_005/
```

## Troubleshooting

### "No such file or directory" Error

**Cause:** WAL-G binary not installed

**Fix:**
```bash
docker-compose restart walg
# Wait for installation to complete
docker logs kanban-walg
```

### S3 Connection Failed

**Cause:** Wrong credentials or endpoint

**Fix:**
1. Verify `.env.production` values
2. Check bucket exists
3. Test S3 access:
```bash
aws s3 ls s3://kanban-backups/ --access-key-id XXX --secret-access-key YYY
```

### No Backups Created

**Cause:** PostgreSQL not ready or WAL-G misconfigured

**Fix:**
```bash
# Check PostgreSQL is running
docker exec kanban-postgres pg_isready

# Check WAL-G configuration
docker exec kanban-walg cat /root/.walg.json

# Manual WAL switch
docker exec kanban-walg psql -h postgres -U postgres -c "SELECT pg_switch_wal();"
```

### Out of Memory

**Cause:** WAL-G using too much memory during backup

**Fix:**
```bash
# Limit WAL-G memory in docker-compose.yml
# Add to walg service:
deploy:
  resources:
    limits:
      memory: 512M
```

## Backup Strategy

### Recommended Settings
- Full backup: Every 24 hours (automatic)
- WAL retention: 30 days
- Compression: gzip (enabled)
- Encryption: S3 server-side (configure in bucket)

### Testing Backups
1. Weekly: Verify backup-list works
2. Monthly: Test restore on staging
3. Quarterly: Full disaster recovery test

### Recovery Time Objectives (RTO)
- **Point-in-Time Recovery**: WAL streaming = 0-60 seconds data loss
- **Restore Time**: 5-30 minutes (depends on backup size)
- **Verification**: Always test before production

## Cost Estimation

### AWS S3 (us-east-1)
- Storage: $0.023/GB/month
- Requests: $0.0004 per 1,000 requests
- Example: 10GB database = $0.23/month

### Cloudflare R2
- Storage: $0.015/GB/month
- **FREE Egress** (huge savings!)
- Example: 10GB database = $0.15/month

### Wasabi
- Storage: $0.0059/GB/month
- No egress fees
- Example: 10GB database = $0.06/month

## Best Practices

1. **Test restores regularly** - Backups are useless if you can't restore
2. **Monitor costs** - Set up billing alerts
3. **Use lifecycle policies** - Auto-delete old backups
4. **Encrypt at rest** - Enable S3 bucket encryption
5. **Document recovery** - Step-by-step restore guide
6. **Cross-region replication** - For critical data

## Emergency Recovery

If everything fails:

```bash
# 1. Stop all services
docker-compose down

# 2. Remove PostgreSQL volume
docker volume rm kanban-postgres-data

# 3. Start PostgreSQL (empty)
docker-compose up -d postgres

# 4. Restore from S3
docker exec kanban-walg wal-g backup-fetch /var/lib/postgresql/data LATEST

# 5. Start all services
docker-compose up -d
```

## WAL-G Commands Reference

```bash
# List backups
docker exec kanban-walg wal-g backup-list

# Create backup
docker exec kanban-walg wal-g backup-push

# Restore backup
docker exec kanban-walg wal-g backup-fetch /restore/path LATEST

# Delete old backups
docker exec kanban-walg wal-g delete --confirm RETAIN 7

# Check backup size
docker exec kanban-walg wal-g backup-list --detail

# Backup info
docker exec kanban-walg wal-g backup-info LATEST
```

---

**WAL-G ensures you never lose data!** 💾
