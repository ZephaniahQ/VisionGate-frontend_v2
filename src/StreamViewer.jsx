import { useState, useRef, useEffect, useCallback } from "react";

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

  .input-row {
    display: flex;
    border: 1px solid var(--border);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 8px;
    transition: border-color 0.2s;
  }
  .input-row:focus-within { border-color: var(--border-active); }
  .input-row:last-of-type { margin-bottom: 20px; }

  .input-label {
    font-family: var(--mono);
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.15em;
    color: var(--text-muted);
    background: var(--surface);
    padding: 0 14px;
    display: flex;
    align-items: center;
    border-right: 1px solid var(--border);
    white-space: nowrap;
    user-select: none;
    min-width: 52px;
  }

  .url-input {
    flex: 1;
    background: var(--surface);
    border: none;
    outline: none;
    color: var(--text);
    font-family: var(--mono);
    font-size: 12px;
    font-weight: 300;
    padding: 12px 16px;
    caret-color: var(--accent);
  }
  .url-input::placeholder { color: var(--text-muted); }
  .url-input:disabled { opacity: 0.4; }

  .action-btn {
    background: transparent;
    border: none;
    border-left: 1px solid var(--border);
    color: var(--text-dim);
    font-family: var(--mono);
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    padding: 0 18px;
    cursor: pointer;
    transition: color 0.15s, background 0.15s;
    white-space: nowrap;
  }
  .action-btn:hover { color: var(--accent); background: var(--accent-dim); }
  .action-btn.stop  { color: var(--danger); }
  .action-btn.stop:hover { background: rgba(255,68,68,0.08); }

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

// Stable color per label
const labelColors = {};
const palette = ["#00ff88","#00aaff","#ff6644","#ffcc00","#cc44ff","#ff44aa","#44ffee","#ff8800"];
let ci = 0;
function colorFor(label) {
  if (!labelColors[label]) { labelColors[label] = palette[ci++ % palette.length]; }
  return labelColors[label];
}

export default function StreamViewer() {
  const [hlsUrl,      setHlsUrl]      = useState("http://localhost:8888/camera/index.m3u8");
  const [wsUrl,       setWsUrl]       = useState("ws://localhost:8765");
  const [streaming,   setStreaming]   = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [videoError,  setVideoError]  = useState(false);
  const [detections,  setDetections]  = useState([]);

  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const hlsRef    = useRef(null);
  const wsRef     = useRef(null);
  const animRef   = useRef(null);
  const bboxRef   = useRef([]);  // raw faces array, read directly by draw loop

  // ── Canvas draw loop (always running) ──────────────────────
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

        // bbox coords are normalized 0–1, so multiply directly by canvas size
        bboxRef.current.forEach(({ bbox, label, confidence }) => {
          if (!bbox) return;
          const [x, y, w, h] = bbox;
          const rx = x * cw, ry = y * ch;
          const rw = w * cw, rh = h * ch;
          const color = colorFor(label);

          // Fill tint
          ctx.fillStyle = color + "18";
          ctx.fillRect(rx, ry, rw, rh);

          // Box stroke
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(rx, ry, rw, rh);

          // Corner accents
          const cs = Math.min(rw, rh, 12);
          ctx.lineWidth = 2;
          [[rx,ry],[rx+rw,ry],[rx,ry+rh],[rx+rw,ry+rh]].forEach(([cx,cy], i) => {
            const sx = i%2===0?1:-1, sy = i<2?1:-1;
            ctx.beginPath();
            ctx.moveTo(cx+sx*cs, cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy+sy*cs);
            ctx.stroke();
          });

          // Label pill
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

  // ── HLS stream toggle ───────────────────────────────────────
  const toggleStream = useCallback(async () => {
    if (streaming) {
      hlsRef.current?.destroy();
      hlsRef.current = null;
      if (videoRef.current) videoRef.current.src = "";
      setStreaming(false);
      setVideoError(false);
      return;
    }

    setVideoError(false);
    setStreaming(true);

    const video = videoRef.current;
    if (!video) return;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = hlsUrl;
      video.play().catch(() => {});
    } else {
      try {
        const { default: Hls } = await import("https://cdn.jsdelivr.net/npm/hls.js@1.5.7/dist/hls.mjs");
        if (Hls.isSupported()) {
          const hls = new Hls({ lowLatencyMode: true, backBufferLength: 4 });
          hlsRef.current = hls;
          hls.loadSource(hlsUrl);
          hls.attachMedia(video);
          hls.on(Hls.Events.ERROR, (_, d) => { if (d.fatal) setVideoError(true); });
          video.play().catch(() => {});
        }
      } catch { setVideoError(true); }
    }
  }, [streaming, hlsUrl]);

  // ── WebSocket toggle ────────────────────────────────────────
  const toggleWs = useCallback(() => {
    if (wsConnected) {
      wsRef.current?.close();
      setWsConnected(false);
      bboxRef.current = [];
      setDetections([]);
      return;
    }

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen  = () => setWsConnected(true);
      ws.onclose = () => {
        setWsConnected(false);
        bboxRef.current = [];
        setDetections([]);
      };
      ws.onerror = () => setWsConnected(false);

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type !== "bbox") return;  // ignore seek/other messages
          const faces = data.faces || [];
          bboxRef.current = faces;           // draw loop reads this directly
          setDetections(faces);              // drives the detections panel
        } catch {}
      };
    } catch { setWsConnected(false); }
  }, [wsConnected, wsUrl]);

  // ── Cleanup ─────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      hlsRef.current?.destroy();
      wsRef.current?.close();
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onErr = () => setVideoError(true);
    v.addEventListener("error", onErr);
    return () => v.removeEventListener("error", onErr);
  }, []);

  const streamState = !streaming ? "idle" : videoError ? "error" : "active";

  return (
    <>
      <style>{styles}</style>
      <div className="app">

        <div className="header">
          <div className={`header-dot ${streaming && !videoError ? "active" : videoError ? "error" : ""}`} />
          <span className="header-title">VisionGate — Live Monitor</span>
        </div>

        <div className="input-row">
          <span className="input-label">HLS</span>
          <input
            className="url-input"
            value={hlsUrl}
            onChange={e => setHlsUrl(e.target.value)}
            placeholder="http://localhost:8888/camera/index.m3u8"
            disabled={streaming}
          />
          <button className={`action-btn ${streaming ? "stop" : ""}`} onClick={toggleStream}>
            {streaming ? "STOP" : "PLAY"}
          </button>
        </div>

        <div className="input-row">
          <span className="input-label">WS</span>
          <input
            className="url-input"
            value={wsUrl}
            onChange={e => setWsUrl(e.target.value)}
            placeholder="ws://localhost:8765"
            disabled={wsConnected}
          />
          <button className={`action-btn ${wsConnected ? "stop" : ""}`} onClick={toggleWs}>
            {wsConnected ? "DISCONNECT" : "CONNECT"}
          </button>
        </div>

        <div className="status-bar">
          <div className={`status-item ${streaming ? "on" : ""}`}>
            <div className={`pip ${streaming && !videoError ? "green" : videoError ? "red" : streaming ? "yellow" : ""}`} />
            STREAM {streaming ? (videoError ? "ERROR" : "LIVE") : "IDLE"}
          </div>
          <div className={`status-item ${wsConnected ? "on" : ""}`}>
            <div className={`pip ${wsConnected ? "green" : ""}`} />
            AI ENGINE {wsConnected ? "CONNECTED" : "OFFLINE"}
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
              <span className="idle-text">Enter HLS URL and press play</span>
            </div>
          )}

          {streamState === "error" && (
            <div className="error-overlay">
              <span className="error-title">STREAM ERROR</span>
              <span className="error-sub">Check URL or MediaMTX</span>
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
                {wsConnected ? "— awaiting detections" : "— connect AI engine to see detections"}
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
