import { useRef, useEffect, useState } from "react";

// ── Hardcoded endpoints ─────────────────────────────────────
const WHEP_URL = "https://visiongate-whep.serveousercontent.com/camera/whep";
const WS_URL   = "wss://visiongate-ws.serveousercontent.com";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500&family=IBM+Plex+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0a0a0a;
    --surface: #111111;
    --border: #1e1e1e;
    --border-active: #2e2e2e;
    --text: #e8e8e8;
    --text-dim: #555;
    --text-muted: #333;
    --accent: #00ff88;
    --accent-dim: rgba(0,255,136,0.08);
    --danger: #ff4444;
    --warn: #ffaa00;
    --mono: 'IBM Plex Mono', monospace;
    --sans: 'IBM Plex Sans', sans-serif;
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--sans);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .app {
    width: 100%;
    max-width: 960px;
    padding: 32px 24px;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 28px;
  }
  .header-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--text-muted);
    flex-shrink: 0;
    transition: background 0.3s, box-shadow 0.3s;
  }
  .header-dot.active { background: var(--accent); box-shadow: 0 0 8px var(--accent); }
  .header-dot.error  { background: var(--danger); }
  .header-title {
    font-family: var(--mono);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--text-dim);
  }

  .status-bar {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 8px 0 14px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 14px;
  }
  .status-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: var(--mono);
    font-size: 10px;
    color: var(--text-muted);
    letter-spacing: 0.05em;
  }
  .status-item.on { color: var(--text-dim); }
  .pip {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: var(--text-muted);
    flex-shrink: 0;
  }
  .pip.green  { background: var(--accent); box-shadow: 0 0 5px var(--accent); }
  .pip.red    { background: var(--danger); }
  .pip.yellow { background: var(--warn); animation: blink 1.2s ease-in-out infinite; }

  @keyframes blink {
    0%,100% { opacity:1; } 50% { opacity:0.25; }
  }

  .video-wrap {
    position: relative;
    width: 100%;
    aspect-ratio: 16/9;
    background: #000;
    border: 1px solid var(--border);
    border-radius: 4px;
    overflow: hidden;
  }

  .video-el {
    width: 100%; height: 100%;
    display: block;
    object-fit: contain;
    background: #000;
  }

  .canvas-el {
    position: absolute;
    inset: 0;
    width: 100%; height: 100%;
    pointer-events: none;
  }

  .idle-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    pointer-events: none;
  }
  .idle-ring {
    width: 38px; height: 38px;
    border: 1px solid var(--border-active);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    opacity: 0.5;
  }
  .idle-text {
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .error-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    background: rgba(10,10,10,0.88);
  }
  .error-title { font-family: var(--mono); font-size: 11px; color: var(--danger); letter-spacing: 0.08em; }
  .error-sub   { font-family: var(--mono); font-size: 10px; color: var(--text-muted); }

  .detections-panel {
    margin-top: 10px;
    border: 1px solid var(--border);
    border-radius: 4px;
    overflow: hidden;
  }
  .det-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 14px;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
  }
  .det-title {
    font-family: var(--mono);
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--text-dim);
  }
  .det-count { font-family: var(--mono); font-size: 10px; color: var(--accent); }

  .det-list {
    max-height: 96px;
    overflow-y: auto;
    padding: 6px 0;
  }
  .det-list::-webkit-scrollbar { width: 3px; }
  .det-list::-webkit-scrollbar-thumb { background: var(--border-active); border-radius: 2px; }

  .det-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 3px 14px;
    font-family: var(--mono);
    font-size: 11px;
    color: var(--text-dim);
  }
  .det-item:hover { background: var(--accent-dim); }
  .det-lbl  { font-weight: 500; min-width: 80px; }
  .det-conf { color: var(--accent); min-width: 40px; }
  .det-pos  { color: var(--text-muted); font-size: 10px; }

  .det-empty {
    padding: 14px;
    font-family: var(--mono);
    font-size: 10px;
    color: var(--text-muted);
    letter-spacing: 0.08em;
  }
`;

const labelColors = {};
const palette = ["#00ff88","#00aaff","#ff6644","#ffcc00","#cc44ff","#ff44aa","#44ffee","#ff8800"];
let ci = 0;
function colorFor(label) {
  if (!labelColors[label]) { labelColors[label] = palette[ci++ % palette.length]; }
  return labelColors[label];
}

export default function StreamViewer() {
  const [streamState, setStreamState] = useState("idle");  // idle | connecting | active | error
  const [wsConnected, setWsConnected] = useState(false);
  const [detections,  setDetections]  = useState([]);

  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const pcRef     = useRef(null);
  const wsRef     = useRef(null);
  const animRef   = useRef(null);
  const bboxRef   = useRef([]);
  const wsAlive   = useRef(true);  // prevents reconnect loop after unmount

  // ── Canvas draw loop ────────────────────────────────────────
  useEffect(() => {
    function draw() {
      const canvas = canvasRef.current;
      const video  = videoRef.current;

      if (canvas && video && video.readyState >= 2) {
        const cw = video.clientWidth;
        const ch = video.clientHeight;
        canvas.width  = cw;
        canvas.height = ch;

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, cw, ch);

        bboxRef.current.forEach(({ bbox, label, confidence }) => {
          if (!bbox) return;
          const [x, y, w, h] = bbox;
          const rx = x * cw, ry = y * ch;
          const rw = w * cw, rh = h * ch;
          const color = colorFor(label);

          ctx.fillStyle = color + "18";
          ctx.fillRect(rx, ry, rw, rh);

          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(rx, ry, rw, rh);

          const cs = Math.min(rw, rh, 12);
          ctx.lineWidth = 2;
          [[rx,ry],[rx+rw,ry],[rx,ry+rh],[rx+rw,ry+rh]].forEach(([cx,cy], i) => {
            const sx = i%2===0?1:-1, sy = i<2?1:-1;
            ctx.beginPath();
            ctx.moveTo(cx+sx*cs, cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy+sy*cs);
            ctx.stroke();
          });

          const conf = confidence > 0 ? ` ${Math.round(confidence*100)}%` : "";
          const tag  = label + conf;
          ctx.font = "500 10px 'IBM Plex Mono', monospace";
          const tw = ctx.measureText(tag).width;
          const ph = 18, pp = 7;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.roundRect(rx, ry - ph - 2, tw + pp*2, ph, 2);
          ctx.fill();
          ctx.fillStyle = "#000";
          ctx.fillText(tag, rx + pp, ry - 7);
        });
      }

      animRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  // ── WebRTC — auto-connect on mount ──────────────────────────
  useEffect(() => {
    let pc;

    async function startWebRTC() {
      try {
        pc = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
        });
        pcRef.current = pc;

        pc.addTransceiver("video", { direction: "recvonly" });
        pc.addTransceiver("audio", { direction: "recvonly" });

        pc.ontrack = (e) => {
          if (videoRef.current && e.streams[0]) {
            videoRef.current.srcObject = e.streams[0];
            videoRef.current.play().catch(() => {});
            setStreamState("active");
          }
        };

        pc.oniceconnectionstatechange = () => {
          if (pc.iceConnectionState === "failed" ||
              pc.iceConnectionState === "disconnected") {
            setStreamState("error");
          }
        };

        setStreamState("connecting");

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        const res = await fetch(WHEP_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/sdp",
            //"serveo-skip-browser-warning": "true",
          },
          body: offer.sdp,
        });

        if (!res.ok) throw new Error(`WHEP ${res.status}`);

        const sdpAnswer = await res.text();
        await pc.setRemoteDescription({ type: "answer", sdp: sdpAnswer });

      } catch (err) {
        console.error("WebRTC error:", err);
        setStreamState("error");
      }
    }

    startWebRTC();

    return () => {
      pc?.close();
      pcRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, []);

  // ── WebSocket — auto-connect with reconnect ─────────────────
  useEffect(() => {
    wsAlive.current = true;

    function connect() {
      if (!wsAlive.current) return;

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen  = () => setWsConnected(true);
      ws.onclose = () => {
        setWsConnected(false);
        bboxRef.current = [];
        setDetections([]);
        if (wsAlive.current) setTimeout(connect, 2000);
      };
      ws.onerror = () => ws.close();

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type !== "bbox") return;
          const faces = data.faces || [];
          bboxRef.current = faces;
          setDetections(faces);
        } catch {}
      };
    }

    connect();

    return () => {
      wsAlive.current = false;
      wsRef.current?.close();
    };
  }, []);

  return (
    <>
      <style>{styles}</style>
      <div className="app">

        <div className="header">
          <div className={`header-dot ${
            streamState === "active" ? "active" :
            streamState === "error"  ? "error"  : ""
          }`} />
          <span className="header-title">VisionGate — Live Monitor</span>
        </div>

        <div className="status-bar">
          <div className={`status-item ${streamState === "active" ? "on" : ""}`}>
            <div className={`pip ${
              streamState === "active"     ? "green"  :
              streamState === "error"      ? "red"    :
              streamState === "connecting" ? "yellow" : ""
            }`} />
            STREAM {
              streamState === "active"     ? "LIVE"       :
              streamState === "error"      ? "ERROR"      :
              streamState === "connecting" ? "CONNECTING" : "IDLE"
            }
          </div>
          <div className={`status-item ${wsConnected ? "on" : ""}`}>
            <div className={`pip ${wsConnected ? "green" : "yellow"}`} />
            AI ENGINE {wsConnected ? "CONNECTED" : "CONNECTING"}
          </div>
          <div className={`status-item ${detections.length > 0 ? "on" : ""}`}>
            <div className={`pip ${detections.length > 0 ? "green" : ""}`} />
            {detections.length} FACE{detections.length !== 1 ? "S" : ""}
          </div>
        </div>

        <div className="video-wrap">
          <video ref={videoRef} className="video-el" muted playsInline autoPlay />
          <canvas ref={canvasRef} className="canvas-el" />

          {streamState === "idle" && (
            <div className="idle-overlay">
              <div className="idle-ring">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              </div>
              <span className="idle-text">Connecting to stream...</span>
            </div>
          )}

          {streamState === "connecting" && (
            <div className="idle-overlay">
              <div className="idle-ring">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <span className="idle-text">Negotiating WebRTC...</span>
            </div>
          )}

          {streamState === "error" && (
            <div className="error-overlay">
              <span className="error-title">STREAM ERROR</span>
              <span className="error-sub">Check MediaMTX or serveo tunnel</span>
            </div>
          )}
        </div>

        <div className="detections-panel">
          <div className="det-header">
            <span className="det-title">Detections</span>
            {detections.length > 0 && (
              <span className="det-count">{detections.length} face{detections.length !== 1 ? "s" : ""}</span>
            )}
          </div>
          <div className="det-list">
            {detections.length === 0 ? (
              <div className="det-empty">
                {wsConnected ? "— awaiting detections" : "— connecting to AI engine"}
              </div>
            ) : detections.map((f, i) => (
              <div className="det-item" key={i}>
                <span className="det-lbl" style={{ color: colorFor(f.label) }}>{f.label}</span>
                <span className="det-conf">{f.confidence > 0 ? Math.round(f.confidence*100)+"%" : "—"}</span>
                <span className="det-pos">
                  {f.bbox ? `x:${Math.round(f.bbox[0]*100)}% y:${Math.round(f.bbox[1]*100)}% ${Math.round(f.bbox[2]*100)}×${Math.round(f.bbox[3]*100)}%` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}
