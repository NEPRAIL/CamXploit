import net from "net";
import base64 from "base-64";

type Opts = { host:string; port:number; path?:string; username?:string; password?:string; timeoutMs?:number; };
export async function checkRTSP(opts: Opts): Promise<{status:string, latencyMs?:number, detail?:string}> {
  const { host, port, path = "/", username, password, timeoutMs = 5000 } = opts;
  const start = Date.now();
  const socket = new net.Socket();
  const authHeader = (username && password) ? `Authorization: Basic ${base64.encode(`${username}:${password}`)}\r\n` : "";
  const req = `DESCRIBE rtsp://${host}:${port}${path} RTSP/1.0\r\nCSeq: 1\r\nAccept: application/sdp\r\n${authHeader}\r\n`;
  return new Promise((resolve) => {
    let done=false; const finish=(s:string,d?:string)=>{ if(done) return; done=true; try{socket.destroy();}catch{}; resolve({status:s,detail:d,latencyMs:Date.now()-start}); };
    socket.setTimeout(timeoutMs, ()=>finish("timeout"));
    socket.on("error", e=>finish("error", String(e)));
    socket.connect(port, host, ()=>socket.write(req));
    socket.on("data", buf=>{
      const m = buf.toString("utf8").match(/RTSP\/1\.0\s+(\d{3})/); if(!m) return finish("error","No RTSP status");
      const code=Number(m[1]);
      if(code===200) return finish("online");
      if(code===401) return finish(authHeader ? "auth_failed" : "auth_required");
      if(code===404) return finish("error","not_found");
      return finish("error",`code_${code}`);
    });
  });
}
