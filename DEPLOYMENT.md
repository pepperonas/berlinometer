# BERLINOMETER DEPLOYMENT GUIDE

⚠️ **CRITICAL**: Read this entire document before deploying!

## Table of Contents
1. [Critical Incident Report](#critical-incident-report)
2. [Safe Deployment Process](#safe-deployment-process)
3. [Protected Files](#protected-files)
4. [Rollback Procedure](#rollback-procedure)
5. [Troubleshooting](#troubleshooting)

---

## Critical Incident Report

### Date: 2025-11-10
### Severity: HIGH
### Impact: Scraping system stopped for 3+ hours

**What Happened:**
During a routine frontend deployment using `rsync --delete`, critical backend scraper files (`scraper_wrapper.sh`, `scraper_healthcheck.sh`) were accidentally deleted because they were NOT in the `--exclude` list.

**Root Cause:**
- Used **Blacklist approach** (exclude specific files) with `--delete` flag
- Mixed frontend and backend files on the same server
- Backend scripts were not in the exclude list
- `rsync --delete` removed everything not in the local build directory

**Impact:**
- Cron job failed silently (scripts missing)
- No scraping from 16:08 to 19:30+
- System appeared to run but collected no data
- Required emergency fix and manual cron job update

**Prevention:**
1. ✅ Created `deploy-safe.sh` with **Whitelist approach**
2. ✅ Only deploys specific frontend files
3. ✅ Creates backups before deployment
4. ✅ Verifies protected files after deployment
5. ✅ Auto-rollback on failure

---

## Safe Deployment Process

### Prerequisites
```bash
# 1. Update version in package.json
# 2. Build frontend
npm run build

# 3. Verify build output
ls -la build/
```

### Deployment Command
```bash
# Use the safe deployment script
./deploy-safe.sh
```

### What the Script Does
1. ✅ Checks local build directory exists
2. ✅ Verifies all frontend files are present
3. ✅ Creates backup on VPS (with timestamp)
4. ✅ Verifies protected files are NOT in build
5. ✅ Deploys ONLY frontend files (whitelist)
6. ✅ Verifies website loads after deployment
7. ✅ Verifies backend files still exist
8. ✅ Cleans up old backups (keeps last 10)

### Manual Deployment (NOT RECOMMENDED)

If you must deploy manually, use this EXACT command:

```bash
# Build first
npm run build

# Deploy ONLY specific files
rsync -av build/index.html root@69.62.121.168:/var/www/html/popular-times/
rsync -av build/assets/ root@69.62.121.168:/var/www/html/popular-times/assets/
rsync -av build/manifest.json root@69.62.121.168:/var/www/html/popular-times/
rsync -av build/sw.js root@69.62.121.168:/var/www/html/popular-times/
rsync -av build/*.png root@69.62.121.168:/var/www/html/popular-times/
rsync -av build/favicon.ico root@69.62.121.168:/var/www/html/popular-times/
```

⚠️ **NEVER USE:**
```bash
# DANGEROUS - DO NOT USE
rsync -av --delete build/ root@69.62.121.168:/var/www/html/popular-times/
```

---

## Protected Files

**These files must NEVER be touched during deployment:**

### Critical Backend Scripts
```
server.py                    # Python Flask backend
requirements.txt             # Python dependencies
schedule_scraper.sh          # Cron scheduler script
run_scraper.sh              # Scraper wrapper script
process_json_to_db.py       # Database import script
gmaps-scraper-fast-robust.py # Playwright scraper
run_analytics.sh            # Analytics processor
```

### Directories
```
venv/                       # Python virtual environment
analytics/                  # Analytics data
popular-times-scrapings/    # Scraping JSON files
maps-playwrite-scraper/     # Scraper node_modules
__pycache__/               # Python cache
```

### Data Files
```
*.db                        # SQLite databases
*.log                       # Log files
```

### Configuration Files
```
.env                        # Environment variables
ecosystem.config.js         # PM2 config (if exists)
```

---

## Rollback Procedure

### Automatic Rollback
The safe deployment script automatically rolls back if:
- Website doesn't load (HTTP != 200)
- Protected files are missing after deployment

### Manual Rollback

```bash
# List available backups
ssh root@69.62.121.168 "ls -lt /var/www/html/popular-times/deployment-backups/"

# Rollback to specific backup
ssh root@69.62.121.168 "cp -r /var/www/html/popular-times/deployment-backups/frontend-TIMESTAMP/* /var/www/html/popular-times/"

# Example:
ssh root@69.62.121.168 "cp -r /var/www/html/popular-times/deployment-backups/frontend-20251110-193045/* /var/www/html/popular-times/"

# Verify rollback
curl https://berlinometer.de/
```

---

## Troubleshooting

### Issue: Website shows white screen

**Check:**
```bash
# 1. Verify index.html exists
ssh root@69.62.121.168 "ls -lh /var/www/html/popular-times/index.html"

# 2. Check asset files
ssh root@69.62.121.168 "ls -lh /var/www/html/popular-times/assets/"

# 3. Check nginx error log
ssh root@69.62.121.168 "tail -50 /var/log/nginx/berlinometer.de.error.log"
```

**Solution:**
```bash
# Rollback to last working version
./deploy-safe.sh --rollback
```

### Issue: API endpoints return HTML instead of JSON

**Cause:** Nginx routing issue, not deployment issue

**Check:**
```bash
curl -I https://berlinometer.de/latest-scraping
# Should show: Content-Type: application/json
```

**Solution:** Check nginx configuration, not deployment

### Issue: Scraping stopped after deployment

**CRITICAL:** This means protected files were deleted!

**Check:**
```bash
# Verify scraper files exist
ssh root@69.62.121.168 "ls -lh /var/www/html/popular-times/*.sh"
ssh root@69.62.121.168 "ls -lh /var/www/html/popular-times/server.py"

# Check cron job
ssh root@69.62.121.168 "crontab -l | grep schedule_scraper"
```

**Emergency Fix:**
```bash
# 1. Check git for deleted files
cd /var/www/html/popular-times
git status

# 2. Restore from git
git checkout -- schedule_scraper.sh run_scraper.sh

# 3. Restart cron job manually
/var/www/html/popular-times/schedule_scraper.sh
```

---

## Deployment Checklist

Before deploying, verify:

- [ ] Version updated in `package.json`
- [ ] Frontend built successfully (`npm run build`)
- [ ] Build directory contains all files
- [ ] Using `deploy-safe.sh` script (NOT manual rsync)
- [ ] VPS connection works (`ssh root@69.62.121.168`)
- [ ] No ongoing scraping process (check time)

After deploying, verify:

- [ ] Website loads: https://berlinometer.de
- [ ] Assets load correctly (no 404 errors)
- [ ] API endpoints work: `/latest-scraping`
- [ ] Backend server running: `ps aux | grep server.py`
- [ ] Scraper files exist: `ls /var/www/html/popular-times/*.sh`
- [ ] Version updated in footer

---

## Best Practices

### DO ✅
- Use `deploy-safe.sh` for all deployments
- Test locally before deploying
- Deploy during low-traffic hours (if possible)
- Keep backups for at least 10 deployments
- Document version changes in git commit

### DON'T ❌
- Never use `rsync --delete` with mixed frontend/backend
- Never deploy without backup
- Never skip verification steps
- Never modify backend files from local machine
- Never deploy if scraping is in progress

---

## Emergency Contacts

If deployment causes critical issues:

1. **Rollback immediately** using backup
2. **Check scraping system** is still running
3. **Verify API endpoints** return JSON
4. **Monitor error logs** for 15 minutes post-deployment

---

## Version History

| Date | Version | Changes | Issues |
|------|---------|---------|--------|
| 2025-11-10 | 2.5.2 | Mobile optimizations, S24 Ultra fixes | ✅ |
| 2025-11-10 | 2.5.1 | Mobile UI improvements | ❌ Deleted scraper files |
| 2025-11-10 | 2.3.0 | Initial deployment | ✅ |

---

## Notes

- Backups are stored in: `/var/www/html/popular-times/deployment-backups/`
- Old backups are automatically cleaned (keeps last 10)
- Scraping runs every 20-30 minutes (randomized)
- Python server runs 24/7 via long-running process
- Nginx handles routing between frontend and backend
