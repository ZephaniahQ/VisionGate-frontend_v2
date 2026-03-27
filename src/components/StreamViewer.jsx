import { useRef, useEffect, useState } from "react";
import { colorFor } from "../utils/helpers";

const WHEP_URL = "https://visiongate-whep.serveousercontent.com/camera/whep";
const WS_URL   = "wss://visiongate-ws.serveousercontent.com";

export default function StreamViewer({ onDetections, onWsConnected, onStreamState, onWsMessage }) {
  const [streamState, setStreamState] = useState("idle"); // idle | connecting | active | error
  const [wsConnected, setWsConnected] = useState(false);
  const [detections,  setDetections]  = useState([]);

  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const pcRef     = useRef(null);
  const wsRef     = useRef(null);
  const animRef   = useRef(null);
  const bboxRef   = useRef([]);
  const wsAlive   = useRef(true);

  // ── Canvas draw loop ──────────────────────────────────────
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
          const rx = x*cw, ry = y*ch, rw = w*cw, rh = h*ch;
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
          ctx.roundRect(rx, ry-ph-2, tw+pp*2, ph, 2);
          ctx.fill();
          ctx.fillStyle = "#000";
          ctx.fillText(tag, rx+pp, ry-7);
        });
      }
      animRef.current = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  // ── WebRTC auto-connect ───────────────────────────────────
  useEffect(() => {
    let pc;
    async function startWebRTC() {
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
          }
        };
        pc.oniceconnectionstatechange = () => {
          if (pc.iceConnectionState === "failed" || pc.iceConnectionState === "disconnected")
            setStreamState("error");
        };
        setStreamState("connecting");
        onStreamState?.("connecting");
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        const res = await fetch(WHEP_URL, {
          method: "POST",
          headers: { "Content-Type": "application/sdp" },
          body: offer.sdp,
        });
        if (!res.ok) throw new Error(`WHEP ${res.status}`);
        const sdpAnswer = await res.text();
        await pc.setRemoteDescription({ type: "answer", sdp: sdpAnswer });
      } catch (err) {
        console.error("WebRTC error:", err);
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
  }, []);

  // ── WebSocket auto-connect with reconnect ─────────────────
  useEffect(() => {
    wsAlive.current = true;
    function connect() {
      if (!wsAlive.current) return;
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      ws.onopen  = () => { setWsConnected(true); onWsConnected?.(true); };
      ws.onclose = () => {
        setWsConnected(false);
        onWsConnected?.(false);
        bboxRef.current = [];
        setDetections([]);
        onDetections?.([]);
        if (wsAlive.current) setTimeout(connect, 2000);
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
          }
          if (data.type === "employee_update") onWsMessage?.("employee_update", data.record);
          if (data.type === "visitor_update")  onWsMessage?.("visitor_update",  data.record);
        } catch {}
      };
    }
    connect();
    return () => { wsAlive.current = false; wsRef.current?.close(); };
  }, []);

  return (
    <div className="video-col">
      {/* status */}
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

      {/* video */}
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
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
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

      {/* detections strip */}
      <div className="det-strip">
        <div className="det-strip-header">
          <span className="det-strip-title">Live Detections</span>
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
