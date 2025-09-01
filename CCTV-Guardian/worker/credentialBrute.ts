import net from "net";
import http from "http";
import https from "https";
import base64 from "base-64";

// Common default credentials for CCTV cameras
const COMMON_CREDENTIALS = [
  { username: "admin", password: "admin" },
  { username: "admin", password: "password" },
  { username: "admin", password: "12345" },
  { username: "admin", password: "" },
  { username: "root", password: "root" },
  { username: "root", password: "password" },
  { username: "root", password: "" },
  { username: "user", password: "user" },
  { username: "guest", password: "guest" },
  { username: "guest", password: "" },
  { username: "admin", password: "1234" },
  { username: "admin", password: "admin123" },
  { username: "administrator", password: "administrator" },
  { username: "support", password: "support" },
  { username: "service", password: "service" },
  { username: "default", password: "default" },
  { username: "camera", password: "camera" },
  { username: "viewer", password: "viewer" },
  // Brand-specific defaults
  { username: "admin", password: "9999" },
  { username: "admin", password: "888888" },
  { username: "admin", password: "123456" },
];

export interface CredentialTestResult {
  username?: string;
  password?: string;
  success: boolean;
  responseCode?: number;
  responseTime: number;
  detail?: string;
}

export interface BruteForceOptions {
  host: string;
  port: number;
  protocol: "rtsp" | "http";
  secure?: boolean; // for HTTPS
  path?: string; // for HTTP endpoints
  timeoutMs?: number;
  maxAttempts?: number;
  delayMs?: number; // delay between attempts to avoid flooding
}

/**
 * Test RTSP credentials
 */
async function testRTSPCredentials(
  host: string,
  port: number,
  username: string,
  password: string,
  path: string = "/",
  timeoutMs: number = 5000
): Promise<CredentialTestResult> {
  const start = Date.now();
  const socket = new net.Socket();
  
  return new Promise((resolve) => {
    let done = false;
    const finish = (success: boolean, code?: number, detail?: string) => {
      if (done) return;
      done = true;
      try { socket.destroy(); } catch {}
      resolve({
        username,
        password,
        success,
        responseCode: code,
        responseTime: Date.now() - start,
        detail
      });
    };

    socket.setTimeout(timeoutMs, () => finish(false, undefined, "timeout"));
    socket.on("error", e => finish(false, undefined, String(e)));
    
    socket.connect(port, host, () => {
      const authHeader = `Authorization: Basic ${base64.encode(`${username}:${password}`)}\r\n`;
      const req = `DESCRIBE rtsp://${host}:${port}${path} RTSP/1.0\r\nCSeq: 1\r\nAccept: application/sdp\r\n${authHeader}\r\n`;
      socket.write(req);
    });

    socket.on("data", buf => {
      const response = buf.toString("utf8");
      const match = response.match(/RTSP\/1\.0\s+(\d{3})/);
      if (!match) return finish(false, undefined, "Invalid RTSP response");
      
      const code = Number(match[1]);
      if (code === 200) {
        finish(true, code, "Authentication successful");
      } else if (code === 401) {
        finish(false, code, "Authentication failed");
      } else {
        finish(false, code, `Unexpected response code: ${code}`);
      }
    });
  });
}

/**
 * Test HTTP credentials
 */
async function testHTTPCredentials(
  host: string,
  port: number,
  username: string,
  password: string,
  secure: boolean = false,
  path: string = "/",
  timeoutMs: number = 5000
): Promise<CredentialTestResult> {
  const start = Date.now();
  const protocol = secure ? "https" : "http";
  const url = `${protocol}://${host}:${port}${path}`;
  const auth = base64.encode(`${username}:${password}`);

  return new Promise((resolve) => {
    const client = secure ? https : http;
    
    const req = client.request(url, {
      method: "GET",
      timeout: timeoutMs,
      headers: {
        "Authorization": `Basic ${auth}`,
        "User-Agent": "CCTV-Guardian/1.0"
      }
    }, (res) => {
      const responseTime = Date.now() - start;
      const code = res.statusCode || 0;
      
      // Success codes: 200-299, or 404 (authenticated but resource not found)
      const success = (code >= 200 && code < 300) || code === 404;
      
      resolve({
        username,
        password,
        success,
        responseCode: code,
        responseTime,
        detail: success ? "Authentication successful" : "Authentication failed"
      });
      
      res.resume(); // Consume response to free up socket
    });

    req.on("timeout", () => {
      req.destroy();
      resolve({
        username,
        password,
        success: false,
        responseTime: Date.now() - start,
        detail: "Request timeout"
      });
    });

    req.on("error", (err) => {
      resolve({
        username,
        password,
        success: false,
        responseTime: Date.now() - start,
        detail: String(err)
      });
    });

    req.end();
  });
}

/**
 * Perform brute force credential testing on authorized cameras only
 */
export async function bruteForceCredentials(options: BruteForceOptions): Promise<CredentialTestResult[]> {
  const {
    host,
    port,
    protocol,
    secure = false,
    path = "/",
    timeoutMs = 5000,
    maxAttempts = COMMON_CREDENTIALS.length,
    delayMs = 100 // Small delay to be respectful
  } = options;

  const results: CredentialTestResult[] = [];
  const credentialsToTest = COMMON_CREDENTIALS.slice(0, maxAttempts);

  console.log(`Starting credential brute force for ${protocol}://${host}:${port} (${credentialsToTest.length} attempts)`);

  for (let i = 0; i < credentialsToTest.length; i++) {
    const { username, password } = credentialsToTest[i];
    
    try {
      let result: CredentialTestResult;
      
      if (protocol === "rtsp") {
        result = await testRTSPCredentials(host, port, username, password, path, timeoutMs);
      } else {
        result = await testHTTPCredentials(host, port, username, password, secure, path, timeoutMs);
      }
      
      results.push(result);
      
      // Log successful attempts immediately
      if (result.success) {
        console.log(`✓ Valid credentials found: ${username}:${password} (${result.responseTime}ms)`);
      }
      
      // Add delay between attempts to be respectful
      if (i < credentialsToTest.length - 1 && delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
      
    } catch (error) {
      results.push({
        username,
        password,
        success: false,
        responseTime: 0,
        detail: String(error)
      });
    }
  }

  const successfulAttempts = results.filter(r => r.success);
  console.log(`Credential testing complete: ${successfulAttempts.length}/${results.length} successful`);

  return results;
}

/**
 * Test a specific credential pair
 */
export async function testSingleCredential(options: BruteForceOptions & { username: string; password: string }): Promise<CredentialTestResult> {
  const { host, port, protocol, secure = false, path = "/", timeoutMs = 5000, username, password } = options;

  if (protocol === "rtsp") {
    return await testRTSPCredentials(host, port, username, password, path, timeoutMs);
  } else {
    return await testHTTPCredentials(host, port, username, password, secure, path, timeoutMs);
  }
}