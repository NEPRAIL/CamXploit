# CCTV Guardian - Brute Force Components Documentation

## Overview

The CCTV Guardian application now includes comprehensive brute force components for checking and password testing of authorized cameras. These components are designed with strict security constraints to ensure ethical usage.

## Security Constraints

⚠️ **CRITICAL SECURITY REQUIREMENTS:**

1. **Authorization Required**: Only cameras with `authorized=true` will be tested
2. **Consent Proof Required**: Cameras must have valid `consent_proof` documentation
3. **No Unauthorized Scanning**: The system will never perform attacks on unauthorized targets
4. **Respectful Testing**: Built-in delays and limits prevent overwhelming target systems

## Components

### 1. Credential Brute Force (`worker/credentialBrute.ts`)

**Features:**
- Tests common default credentials for CCTV cameras
- Supports both RTSP and HTTP protocols
- Configurable timeout, delay, and attempt limits
- Detailed result logging and error handling

**Common Credentials Tested:**
- admin/admin, admin/password, admin/12345
- root/root, user/user, guest/guest
- Brand-specific defaults (admin/9999, admin/888888, etc.)

**Usage:**
```typescript
import { bruteForceCredentials } from './credentialBrute';

const results = await bruteForceCredentials({
  host: "192.168.1.100",
  port: 554,
  protocol: "rtsp",
  timeoutMs: 3000,
  maxAttempts: 15,
  delayMs: 200
});
```

### 2. Enhanced HTTP Checker (`worker/httpCheck.ts`)

**Enhancements:**
- Expanded endpoint discovery (30+ common camera paths)
- Authentication endpoint identification
- Server fingerprinting
- Comprehensive status reporting

**New Endpoints Scanned:**
- `/web/`, `/webpages/`, `/live`, `/livestream`
- `/video/mjpg.cgi`, `/mjpg/video.cgi`
- `/onvif/`, `/device_service`, `/MediaInput/`
- And many more camera-specific endpoints

### 3. Guardian Worker (`worker/guardian.ts`)

**New Features:**
- Integrated brute force testing
- Detailed logging and progress reporting
- Environment-based configuration
- Results stored in database

**Environment Variables:**
- `ENABLE_BRUTE_FORCE=true` - Enable credential testing
- `ALLOWLIST_ENFORCED=true` - Enforce authorization requirements

### 4. Database Schema (`db/schema.ts`)

**New Table: `credential_tests`**
```sql
CREATE TABLE credential_tests (
  id SERIAL PRIMARY KEY,
  camera_id INTEGER NOT NULL,
  username VARCHAR(120),
  password VARCHAR(120),
  protocol VARCHAR(10) NOT NULL,
  success BOOLEAN NOT NULL,
  response_code INTEGER,
  response_time_ms INTEGER,
  detail TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Usage Instructions

### 1. Setup Environment

```bash
# Copy environment template
cp .env.example .env

# Configure database connection
DATABASE_URL="postgresql://user:pass@localhost:5432/cctv_guardian"

# Enable brute force testing (ONLY for authorized cameras)
ENABLE_BRUTE_FORCE="true"
```

### 2. Update Database Schema

```bash
npm run db:generate
npm run db:push
```

### 3. Add Authorized Cameras

Cameras must be properly authorized before testing:

```typescript
// Example: Adding an authorized camera
await db.insert(cameras).values({
  name: "Test Camera",
  ip: "192.168.1.100",
  port: 554,
  protocol: "rtsp",
  authorized: true,
  consentProof: "Written consent obtained on 2024-01-15. Ref: CONSENT-001",
  lat: 40.7128,
  lng: -74.0060
});
```

### 4. Run Guardian Worker

```bash
# Test the components first
npm run worker:test

# Run the full guardian with brute force capabilities
npm run worker:run
```

## Example Output

```
CCTV Guardian starting...
Enforcement: ENABLED
Brute Force Testing: ENABLED

📹 Checking camera: Office Camera (rtsp://192.168.1.100:554)
  Status: auth_required (156ms)
  Detail: RTSP/1.0 401 Unauthorized...

  🔐 Starting credential brute force testing...
  ✓ Valid credentials found: admin:admin123 (234ms)
  ✅ Found 1 valid credential(s):
    - admin:admin123 (234ms)

🎯 Guardian check complete
```

## Database Results

### Basic Connectivity (`checks` table)
- Overall camera status (online, auth_required, offline, etc.)
- Response times and server details
- Endpoint discovery results

### Credential Testing (`credential_tests` table)
- All tested username/password combinations
- Success/failure status for each attempt
- Response codes and timing information
- Detailed error messages

## Security Best Practices

1. **Only test authorized cameras** - Never bypass the authorization check
2. **Maintain consent documentation** - Keep detailed records of permission
3. **Use reasonable limits** - Don't overwhelm target systems
4. **Monitor results carefully** - Review findings responsibly
5. **Secure credential storage** - Never log successful passwords in plain text

## Configuration Options

### Worker Settings

```bash
# Timeout for individual credential tests
WORKER_TIMEOUT_MS="3000"

# Delay between brute force attempts
WORKER_DELAY_MS="200"

# Maximum credential combinations to test
WORKER_MAX_ATTEMPTS="15"
```

### Security Enforcement

```bash
# Require authorization and consent (RECOMMENDED: true)
ALLOWLIST_ENFORCED="true"

# Enable brute force testing (ONLY for authorized cameras)
ENABLE_BRUTE_FORCE="true"
```

## Troubleshooting

### Common Issues

1. **"No authorized cameras found"**
   - Ensure cameras have `authorized=true`
   - Verify `consent_proof` is provided
   - Check database connectivity

2. **"Brute force testing disabled"**
   - Set `ENABLE_BRUTE_FORCE=true` in environment
   - Restart the worker process

3. **"Database schema out of date"**
   - Run `npm run db:generate && npm run db:push`
   - Verify database connection

### Testing Components

```bash
# Test all brute force components
npm run worker:test

# Check specific component functionality
tsx worker/credentialBrute.ts --test
```

## Ethical Considerations

This tool is designed for **authorized security testing only**. Users must:

- Obtain proper written consent before testing any cameras
- Comply with all local laws and regulations
- Use findings responsibly to improve security
- Never use against unauthorized targets
- Respect rate limits and system resources

## Contributing

When adding new credential combinations or endpoints:

1. Research common defaults for specific camera brands
2. Test against known test environments
3. Ensure no false positives
4. Document sources and reasoning
5. Maintain security constraints