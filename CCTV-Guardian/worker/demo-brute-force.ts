#!/usr/bin/env tsx
/**
 * Demo script showing CCTV Guardian brute force functionality
 * This demonstrates how the system works without requiring a database
 */

import { bruteForceCredentials, testSingleCredential } from "./credentialBrute";
import { checkHTTP } from "./httpCheck";
import { checkRTSP } from "./rtspCheck";

async function demonstrateBruteForce() {
  console.log("🎯 CCTV Guardian - Brute Force Components Demo");
  console.log("=" .repeat(60));
  console.log("⚠️  This demo shows functionality against non-existent targets");
  console.log("⚠️  In production, this ONLY works on authorized cameras with consent");
  console.log("");

  // Demo 1: Enhanced HTTP endpoint discovery
  console.log("📡 1. Enhanced HTTP Endpoint Discovery");
  console.log("-".repeat(40));
  
  console.log("Simulating HTTP check on camera at 192.168.1.100:80...");
  try {
    const httpResult = await checkHTTP({
      host: "127.0.0.1", // Use localhost to avoid network issues
      port: 9999, // Non-existent port
      timeoutMs: 1000
    });
    console.log(`  Status: ${httpResult.status}`);
    console.log(`  Latency: ${httpResult.latencyMs}ms`);
    console.log(`  Detail: ${httpResult.detail?.slice(0, 100)}...`);
  } catch (error) {
    console.log(`  Expected error: ${error}`);
  }

  // Demo 2: RTSP credential testing simulation
  console.log("\n📹 2. RTSP Credential Testing Simulation");
  console.log("-".repeat(40));
  
  console.log("Testing single credential: admin/admin123");
  const singleResult = await testSingleCredential({
    host: "127.0.0.1",
    port: 9999,
    protocol: "rtsp",
    username: "admin",
    password: "admin123",
    timeoutMs: 1000
  });
  
  console.log(`  Username: ${singleResult.username}`);
  console.log(`  Password: ${singleResult.password}`);
  console.log(`  Success: ${singleResult.success}`);
  console.log(`  Response Time: ${singleResult.responseTime}ms`);
  console.log(`  Detail: ${singleResult.detail}`);

  // Demo 3: Full brute force simulation
  console.log("\n🔐 3. Credential Brute Force Testing");
  console.log("-".repeat(40));
  
  console.log("Simulating brute force test with 5 common credentials...");
  const bruteResults = await bruteForceCredentials({
    host: "127.0.0.1",
    port: 9999,
    protocol: "http",
    maxAttempts: 5,
    timeoutMs: 500,
    delayMs: 100
  });

  console.log(`  Total attempts: ${bruteResults.length}`);
  console.log(`  Successful: ${bruteResults.filter(r => r.success).length}`);
  console.log(`  Failed: ${bruteResults.filter(r => !r.success).length}`);
  
  console.log("\n  Sample attempts:");
  bruteResults.slice(0, 3).forEach((result, i) => {
    console.log(`    ${i + 1}. ${result.username}:${result.password} -> ${result.success ? '✅' : '❌'} (${result.responseTime}ms)`);
  });

  // Demo 4: Show what happens with real authorized camera workflow
  console.log("\n🏭 4. Authorized Camera Workflow Simulation");
  console.log("-".repeat(40));
  
  console.log("Simulating guardian worker process:");
  console.log("1. Query authorized cameras from database");
  console.log("2. Verify consent proof exists");
  console.log("3. Perform basic connectivity check");
  console.log("4. If auth required, start brute force testing");
  console.log("5. Store all results in database");
  
  const mockCamera = {
    id: 1,
    name: "Office Security Camera",
    ip: "192.168.1.100",
    port: 554,
    protocol: "rtsp",
    authorized: true,
    consentProof: "Written consent obtained 2024-01-15. Ref: CONSENT-001"
  };
  
  console.log(`\nExample authorized camera:`);
  console.log(`  Name: ${mockCamera.name}`);
  console.log(`  Address: ${mockCamera.protocol}://${mockCamera.ip}:${mockCamera.port}`);
  console.log(`  Authorized: ${mockCamera.authorized ? '✅' : '❌'}`);
  console.log(`  Consent: ${mockCamera.consentProof ? '✅' : '❌'}`);

  // Demo 5: Security enforcement simulation
  console.log("\n🛡️  5. Security Enforcement");
  console.log("-".repeat(40));
  
  const unauthorizedCamera = {
    ...mockCamera,
    authorized: false,
    consentProof: undefined
  };
  
  console.log("Testing security enforcement with unauthorized camera:");
  console.log(`  Authorized: ${unauthorizedCamera.authorized ? '✅' : '❌'}`);
  console.log(`  Consent: ${unauthorizedCamera.consentProof ? '✅' : '❌'}`);
  console.log(`  Result: ${(!unauthorizedCamera.authorized || !unauthorizedCamera.consentProof) ? '🚫 BLOCKED' : '✅ ALLOWED'}`);

  console.log("\n✅ Demo Complete");
  console.log("=" .repeat(60));
  console.log("In production:");
  console.log("• Set ENABLE_BRUTE_FORCE=true to enable testing");
  console.log("• Only authorized cameras with consent will be tested");
  console.log("• All results are logged to database for analysis");
  console.log("• Built-in delays prevent overwhelming target systems");
}

// Run demo
demonstrateBruteForce()
  .then(() => {
    console.log("\n🎯 Ready for production use with authorized cameras!");
    process.exit(0);
  })
  .catch(error => {
    console.error("Demo failed:", error);
    process.exit(1);
  });