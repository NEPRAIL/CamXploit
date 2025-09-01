import "dotenv/config";
import { db } from "../lib/db";
import { checks, credentialTests } from "../db/schema";
import { checkRTSP } from "./rtspCheck";
import { checkHTTP } from "./httpCheck";
import { bruteForceCredentials } from "./credentialBrute";

const ENFORCE = process.env.ALLOWLIST_ENFORCED !== "false";
const ENABLE_BRUTE_FORCE = process.env.ENABLE_BRUTE_FORCE === "true";

async function getSecret(_: string | null | undefined) {
  // TODO: integrate your secret manager; return { username, password } | undefined
  return undefined;
}

async function main() {
  console.log("CCTV Guardian starting...");
  console.log(`Enforcement: ${ENFORCE ? "ENABLED" : "DISABLED"}`);
  console.log(`Brute Force Testing: ${ENABLE_BRUTE_FORCE ? "ENABLED" : "DISABLED"}`);
  
  // Authorized cameras only
  const rows: any = await db.execute(`
    SELECT id, name, ip, port, protocol, username_ref AS "usernameRef", password_ref AS "passwordRef",
           authorized, consent_proof AS "consentProof"
    FROM cameras WHERE authorized = true;
  `);
  
  console.log(`Found ${(rows as any[]).length} authorized cameras to check`);
  
  for (const cam of (rows as any[])) {
    // Security enforcement: Skip if not properly authorized
    if (ENFORCE && (!cam.authorized || !cam.consentProof)) {
      console.log(`⚠ Skipping camera ${cam.name} (${cam.ip}): Missing authorization or consent proof`);
      continue;
    }
    
    console.log(`\n📹 Checking camera: ${cam.name} (${cam.protocol}://${cam.ip}:${cam.port})`);
    
    const creds = await getSecret(cam.usernameRef);
    let res: { status: string; latencyMs?: number; detail?: string };
    
    // Perform basic connectivity check
    if (cam.protocol === "rtsp") {
      res = await checkRTSP({ 
        host: cam.ip, 
        port: cam.port, 
        username: (creds as any)?.username, 
        password: (creds as any)?.password, 
        timeoutMs: 5000 
      });
    } else {
      const secure = cam.port === 443 || cam.port === 8443 || cam.port === 9443;
      res = await checkHTTP({ 
        host: cam.ip, 
        port: cam.port, 
        secure, 
        timeoutMs: 5000 
      });
    }
    
    // Store basic check result
    await db.insert(checks).values({ 
      cameraId: cam.id, 
      status: res.status, 
      latencyMs: res.latencyMs, 
      detail: res.detail?.slice(0,500) 
    });
    
    console.log(`  Status: ${res.status} (${res.latencyMs}ms)`);
    if (res.detail) console.log(`  Detail: ${res.detail.slice(0, 100)}...`);
    
    // Perform brute force credential testing if enabled and camera requires auth
    if (ENABLE_BRUTE_FORCE && (res.status === "auth_required" || res.status === "auth_failed")) {
      console.log(`  🔐 Starting credential brute force testing...`);
      
      try {
        const secure = cam.protocol === "http" && (cam.port === 443 || cam.port === 8443 || cam.port === 9443);
        const bruteResults = await bruteForceCredentials({
          host: cam.ip,
          port: cam.port,
          protocol: cam.protocol as "rtsp" | "http",
          secure,
          timeoutMs: 3000,
          maxAttempts: 15, // Limit attempts to be respectful
          delayMs: 200 // Small delay between attempts
        });
        
        // Store all brute force results
        for (const result of bruteResults) {
          await db.insert(credentialTests).values({
            cameraId: cam.id,
            username: result.username,
            password: result.password,
            protocol: cam.protocol,
            success: result.success,
            responseCode: result.responseCode,
            responseTime: result.responseTime,
            detail: result.detail?.slice(0, 500)
          });
        }
        
        const successfulCreds = bruteResults.filter(r => r.success);
        if (successfulCreds.length > 0) {
          console.log(`  ✅ Found ${successfulCreds.length} valid credential(s):`);
          successfulCreds.forEach(cred => {
            console.log(`    - ${cred.username}:${cred.password} (${cred.responseTime}ms)`);
          });
        } else {
          console.log(`  ❌ No valid credentials found (tested ${bruteResults.length} combinations)`);
        }
        
      } catch (error) {
        console.error(`  ⚠ Brute force testing failed: ${error}`);
      }
    }
  }
  
  console.log("\n🎯 Guardian check complete");
  process.exit(0);
}
main().catch(e=>{ console.error(e); process.exit(1); });
