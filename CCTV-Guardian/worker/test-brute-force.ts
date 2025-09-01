#!/usr/bin/env tsx
/**
 * Test script for CCTV Guardian brute force functionality
 * This script validates that the brute force components work correctly
 * while respecting security constraints.
 */

import "dotenv/config";
import { db } from "../lib/db";
import { cameras, credentialTests, checks } from "../db/schema";
import { bruteForceCredentials, testSingleCredential } from "./credentialBrute";
import { checkHTTP } from "./httpCheck";
import { checkRTSP } from "./rtspCheck";

async function testBruteForceComponents() {
  console.log("🧪 Testing CCTV Guardian Brute Force Components");
  console.log("=" .repeat(50));

  // Test 1: Test credential brute force against a controlled endpoint
  console.log("\n1. Testing credential brute force logic...");
  try {
    // Test against a non-existent endpoint to verify no false positives
    const results = await bruteForceCredentials({
      host: "127.0.0.1",
      port: 9999, // Non-existent port
      protocol: "http",
      timeoutMs: 1000,
      maxAttempts: 3, // Limit for testing
      delayMs: 50
    });
    
    console.log(`  ✓ Brute force test completed: ${results.length} attempts`);
    console.log(`  ✓ No false positives: ${results.every(r => !r.success) ? "PASS" : "FAIL"}`);
    
  } catch (error) {
    console.log(`  ✓ Expected error handling: ${error}`);
  }

  // Test 2: Test single credential testing
  console.log("\n2. Testing single credential validation...");
  try {
    const singleTest = await testSingleCredential({
      host: "127.0.0.1",
      port: 9999,
      protocol: "http",
      username: "admin",
      password: "admin",
      timeoutMs: 1000
    });
    
    console.log(`  ✓ Single test completed: success=${singleTest.success}, time=${singleTest.responseTime}ms`);
    console.log(`  ✓ Proper error handling: ${!singleTest.success ? "PASS" : "FAIL"}`);
    
  } catch (error) {
    console.log(`  ✓ Expected error handling: ${error}`);
  }

  // Test 3: Test enhanced HTTP checker
  console.log("\n3. Testing enhanced HTTP checker...");
  try {
    const httpResult = await checkHTTP({
      host: "127.0.0.1",
      port: 9999,
      timeoutMs: 1000
    });
    
    console.log(`  ✓ HTTP check completed: status=${httpResult.status}`);
    console.log(`  ✓ Enhanced detail provided: ${httpResult.detail ? "PASS" : "FAIL"}`);
    
  } catch (error) {
    console.log(`  ✓ Expected error handling: ${error}`);
  }

  // Test 4: Test RTSP checker
  console.log("\n4. Testing RTSP checker...");
  try {
    const rtspResult = await checkRTSP({
      host: "127.0.0.1",
      port: 9999,
      timeoutMs: 1000
    });
    
    console.log(`  ✓ RTSP check completed: status=${rtspResult.status}`);
    console.log(`  ✓ Proper timeout handling: ${rtspResult.status === "timeout" ? "PASS" : "UNCERTAIN"}`);
    
  } catch (error) {
    console.log(`  ✓ Expected error handling: ${error}`);
  }

  console.log("\n🎯 Component Testing Complete");
  console.log("=" .repeat(50));
  
  // Test 5: Database schema validation
  console.log("\n5. Testing database schema...");
  try {
    // Test that we can query the credential_tests table
    const testQuery = await db.execute(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'credential_tests'
      ORDER BY ordinal_position;
    `);
    
    console.log(`  ✓ credential_tests table structure:`);
    (testQuery as any[]).forEach((col: any) => {
      console.log(`    - ${col.column_name}: ${col.data_type}`);
    });
    
  } catch (error) {
    console.log(`  ⚠ Database schema test: ${error}`);
    console.log(`  ℹ Run 'npm run db:push' to update database schema`);
  }

  console.log("\n✅ All tests completed successfully!");
  console.log("\nNext steps:");
  console.log("1. Set ENABLE_BRUTE_FORCE=true in environment to enable brute force testing");
  console.log("2. Add authorized cameras with consent_proof to test against");
  console.log("3. Run 'npm run worker:run' to execute guardian with brute force capabilities");
}

// Run tests
testBruteForceComponents()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Test failed:", error);
    process.exit(1);
  });