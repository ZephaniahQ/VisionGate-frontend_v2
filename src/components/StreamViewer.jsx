import { useRef, useEffect, useState, useCallback } from "react";
import { colorFor } from "../utils/helpers";

// ── Default endpoints (can be overridden via props from debug panel) ──
const DEFAULT_WHEP_URL     = "https://visiongate-whep.serveousercontent.com/camera/whep";
const DEFAULT_SUPABASE_URL = "https://ekenepjdjhsutkwbvcch.supabase.co";
const SUPABASE_KEY         = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrZW5lcGpkamhzdXRrd2J2Y2NoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1ODIyMDEsImV4cCI6MjA5MDE1ODIwMX0.iFXYc6uTyHJZltboGAQtBn0qyDPzRZHkLHxYfDQBZwg";

async function fetchWsUrl(supabaseUrl) {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/stream_config?id=eq.1&select=ws_url`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  );
  if (!res.ok) throw new Error(`Supabase ${res.status}`);
  const rows = await res.json();
  if (!rows[0]?.ws_url) throw new Error("ws_url empty — start Colab pipeline first");
  return rows[0].ws_url;
}

// ─────────────────────────────────────────────────────────────────────
// StreamViewer
//
// Props
//   onDetections(faces)       — called whenever bbox list updates
//   onStreamState(state)      — "idle" | "connecting" | "active" | "error"
//   onWsMessage(type, record) — forwarded WS messages (non-bbox)
//   onLog(level, src, msg)    — feed log lines to parent debug panel
//   whepUrl                   — override WHEP endpoint (from debug panel)
//   wsUrlOverride             — skip Supabase fetch, use this WS URL directly
//   supabaseUrl               — override Supabase base URL
//   rtcKey                    — bump to restart WebRTC connection
//   wsKey                     — bump to restart WebSocket connection
// ─────────────────────────────────────────────────────────────────────
export default function StreamViewer({
  onDetections,
  onStreamState,
  onWsMessage,
  onLog,
  whepUrl      = DEFAULT_WHEP_URL,
  wsUrlOverride = "",
  supabaseUrl  = DEFAULT_SUPABASE_URL,
  rtcKey       = 0,
  wsKey        = 0,
}) {
  const [streamState, setStreamState] = useState("idle");
  const [wsConnected, setWsConnected] = useState(false);
  const [wsStatus,    setWsStatus]    = useState("fetching");
  const [detections,  setDetections]  = useState([]);

  const videoRef    = useRef(null);
  const canvasRef   = useRef(null);
  const videoWrapRef= useRef(null);
  const pcRef       = useRef(null);
  const wsRef       = useRef(null);
  const animRef     = useRef(null);
  const bboxRef     = useRef([]);
  const wsAlive     = useRef(true);

  const log = useCallback((level, src, msg) => {
    onLog?.(level, src, msg);
  }, [onLog]);

  // ── Canvas draw loop ───────────────────────────────────────────
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

          ctx.fillStyle   = color + "18";
          ctx.fillRect(rx, ry, rw, rh);
          ctx.strokeStyle = color;
          ctx.lineWidth   = 1.5;
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
          ctx.font   = "500 10px 'IBM Plex Mono', monospace";
          const tw   = ctx.measureText(tag).width;
          const ph   = 18, pp = 7;
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

  // ── WebRTC — restarts when whepUrl or rtcKey changes ──────────
  useEffect(() => {
    let pc;

    async function startWebRTC() {
      log("info", "RTC", `Connecting → ${whepUrl}`);
      try {
        pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
        pcRef.current = pc;
        pc.addTransceiver("video", { direction: "recvonly" });
        pc.addTransceiver("audio", { direction: "recvonly" });

        pc.ontrack = (e) => {
          if (videoRef.current && e.streams[0]) {
            videoRef.current.srcObject = e.streams[0];
            videoRef.current.play().catch(() => {});
            setStreamState("active");
            onStreamState?.("active");
            log("ok", "RTC", "Track received — stream active");
          }
        };

        pc.oniceconnectionstatechange = () => {
          if (pc.iceConnectionState === "failed" || pc.iceConnectionState === "disconnected") {
            setStreamState("error");
            onStreamState?.("error");
            log("err", "RTC", `ICE ${pc.iceConnectionState}`);
          }
        };

        setStreamState("connecting");
        onStreamState?.("connecting");
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        const res = await fetch(whepUrl, {
          method: "POST",
          headers: { "Content-Type": "application/sdp" },
          body: offer.sdp,
        });
        if (!res.ok) throw new Error(`WHEP ${res.status}`);
        const sdpAnswer = await res.text();
        await pc.setRemoteDescription({ type: "answer", sdp: sdpAnswer });
        log("ok", "RTC", "SDP exchanged");
      } catch (err) {
        log("err", "RTC", err.message);
        setStreamState("error");
        onStreamState?.("error");
      }
    }

    startWebRTC();
    return () => {
      pc?.close();
      pcRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [whepUrl, rtcKey]);

  // ── WebSocket — restarts when wsUrlOverride/supabaseUrl/wsKey changes
  useEffect(() => {
    wsAlive.current = true;

    async function connect() {
      if (!wsAlive.current) return;
      let wsUrl;

      if (wsUrlOverride) {
        wsUrl = wsUrlOverride;
        log("info", "WS", `Using manual override: ${wsUrl}`);
      } else {
        try {
          setWsStatus("fetching");
          log("info", "WS", "Fetching ws_url from Supabase…");
          wsUrl = await fetchWsUrl(supabaseUrl);
          log("ok", "WS", `Got ws_url: ${wsUrl}`);
        } catch (err) {
          log("warn", "WS", `Fetch failed: ${err.message} — retrying in 5s`);
          if (wsAlive.current) setTimeout(connect, 5000);
          return;
        }
      }

      if (!wsAlive.current) return;
      setWsStatus("connecting");
      log("info", "WS", `Connecting…`);

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        setWsStatus("connected");
        log("ok", "WS", "Connected");
      };
      ws.onclose = () => {
        setWsConnected(false);
        bboxRef.current = [];
        setDetections([]);
        onDetections?.([]);
        log("warn", "WS", "Closed — reconnecting in 3s");
        if (wsAlive.current) setTimeout(connect, 3000);
      };
      ws.onerror = () => ws.close();

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === "bbox") {
            const faces = data.faces || [];
            bboxRef.current = faces;
            setDetections(faces);
            onDetections?.(faces);
          } else {
            onWsMessage?.(data.type, data);
          }
        } catch {}
      };
    }

    connect();
    return () => {
      wsAlive.current = false;
      wsRef.current?.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsUrlOverride, supabaseUrl, wsKey]);

  // ── Fullscreen ─────────────────────────────────────────────────
  function toggleFullscreen() {
    const el = videoWrapRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen();
    }
  }

  const wsPip   = wsStatus === "connected" ? "green" : "yellow";
  const wsLabel = wsStatus === "fetching" ? "FETCHING URL"
                : wsStatus === "connecting" ? "CONNECTING"
                : "CONNECTED";

  return (
    <div className="sv-wrap">
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
          <div className={`pip ${wsPip}`} />
          AI ENGINE {wsLabel}
        </div>
        <div className={`status-item ${detections.length > 0 ? "on" : ""}`}>
          <div className={`pip ${detections.length > 0 ? "green" : ""}`} />
          {detections.length} FACE{detections.length !== 1 ? "S" : ""}
        </div>
      </div>

      {/* video + canvas */}
      <div
        className="video-wrap"
        ref={videoWrapRef}
        onDoubleClick={toggleFullscreen}
      >
        <video ref={videoRef} className="video-el" muted playsInline autoPlay />
        <canvas ref={canvasRef} className="canvas-el" />

        {/* fullscreen button */}
        <button className="fs-btn" onClick={toggleFullscreen} title="Fullscreen (or double-click)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
            <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
          </svg>
        </button>

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
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <span className="idle-text">Negotiating WebRTC...</span>
          </div>
        )}
        {streamState === "error" && (
          <div className="error-overlay">
            <span className="error-title">STREAM ERROR</span>
            <span className="error-sub">Check MediaMTX or tunnel</span>
          </div>
        )}
      </div>

      {/* detections strip */}
      <div className="det-strip">
        <div className="det-strip-header">
          <span className="det-strip-title">Detections</span>
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
  );
}
