import { useState, useEffect, useRef } from "react";

const DEFAULT_WHEP        = "https://visiongate-whep.serveousercontent.com/camera/whep";
const DEFAULT_SUPABASE    = "https://ekenepjdjhsutkwbvcch.supabase.co";
const SS_WHEP             = "vg_debug_whep";
const SS_SUPABASE         = "vg_debug_supabase";
const SS_WS               = "vg_debug_ws";

function ChevronIcon({ open }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
    >
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────
// DebugPanel
//
// Props
//   open            — controlled open state
//   logs            — array of { id, ts, level, src, msg }
//   onClearLogs     — callback to clear logs
//   onApplyWhep(url)         — restart WebRTC with new URL
//   onApplySupabase(url)     — restart WS fetch with new Supabase URL
//   onApplyWsOverride(url)   — bypass Supabase, use direct WS URL
// ─────────────────────────────────────────────────────────────────────
export default function DebugPanel({
  open,
  logs = [],
  onClearLogs,
  onApplyWhep,
  onApplySupabase,
  onApplyWsOverride,
}) {
  // local field state — seeded from sessionStorage
  const [whepField,     setWhepField]     = useState(() => sessionStorage.getItem(SS_WHEP)     || "");
  const [supabaseField, setSupabaseField] = useState(() => sessionStorage.getItem(SS_SUPABASE) || "");
  const [wsField,       setWsField]       = useState(() => sessionStorage.getItem(SS_WS)       || "");

  // track which fields are actively overriding
  const [whepActive,     setWhepActive]     = useState(() => !!sessionStorage.getItem(SS_WHEP));
  const [supabaseActive, setSupabaseActive] = useState(() => !!sessionStorage.getItem(SS_SUPABASE));
  const [wsActive,       setWsActive]       = useState(() => !!sessionStorage.getItem(SS_WS));

  const logEndRef = useRef(null);
  const logContainerRef = useRef(null);

  // auto-scroll log to bottom — scoped to the log container only
  useEffect(() => {
    if (open && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, open]);

  // restore overrides on mount (so parent honours saved values on first load)
  useEffect(() => {
    const savedWhep     = sessionStorage.getItem(SS_WHEP);
    const savedSupabase = sessionStorage.getItem(SS_SUPABASE);
    const savedWs       = sessionStorage.getItem(SS_WS);
    if (savedWhep)     onApplyWhep?.(savedWhep);
    if (savedSupabase) onApplySupabase?.(savedSupabase);
    if (savedWs)       onApplyWsOverride?.(savedWs);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyWhep() {
    const url = whepField.trim();
    if (!url) return;
    sessionStorage.setItem(SS_WHEP, url);
    setWhepActive(true);
    onApplyWhep?.(url);
  }
  function resetWhep() {
    sessionStorage.removeItem(SS_WHEP);
    setWhepField("");
    setWhepActive(false);
    onApplyWhep?.(DEFAULT_WHEP);
  }

  function applySupabase() {
    const url = supabaseField.trim();
    if (!url) return;
    sessionStorage.setItem(SS_SUPABASE, url);
    setSupabaseActive(true);
    onApplySupabase?.(url);
  }
  function resetSupabase() {
    sessionStorage.removeItem(SS_SUPABASE);
    setSupabaseField("");
    setSupabaseActive(false);
    onApplySupabase?.(DEFAULT_SUPABASE);
  }

  function applyWs() {
    const url = wsField.trim();
    if (!url) return;
    sessionStorage.setItem(SS_WS, url);
    setWsActive(true);
    onApplyWsOverride?.(url);
  }
  function resetWs() {
    sessionStorage.removeItem(SS_WS);
    setWsField("");
    setWsActive(false);
    onApplyWsOverride?.("");
  }

  return (
    <div className="debug-panel" style={{ display: open ? undefined : "none" }}>
      <div className="debug-panel-header" style={{ cursor: "default" }}>
        <div className="debug-panel-title">
          <span className="debug-badge">DBG</span>
          Connection Override
        </div>
      </div>

      <div className="debug-panel-body">

        {/* WHEP URL */}
        <div className="debug-row">
          <div className="debug-row-label">WHEP Endpoint (WebRTC)</div>
          <div className="debug-row-controls">
            <input
              className={`debug-input ${whepActive ? "overridden" : ""}`}
              value={whepField}
              onChange={e => setWhepField(e.target.value)}
              onKeyDown={e => e.key === "Enter" && applyWhep()}
              placeholder={DEFAULT_WHEP}
              spellCheck={false}
            />
            <button className="debug-apply-btn" onClick={applyWhep}>Apply</button>
            {whepActive && <button className="debug-reset-btn" onClick={resetWhep}>Reset</button>}
          </div>
        </div>

        {/* Supabase URL */}
        <div className="debug-row">
          <div className="debug-row-label">Supabase Base URL (ws_url fetch)</div>
          <div className="debug-row-controls">
            <input
              className={`debug-input ${supabaseActive ? "overridden" : ""}`}
              value={supabaseField}
              onChange={e => setSupabaseField(e.target.value)}
              onKeyDown={e => e.key === "Enter" && applySupabase()}
              placeholder={DEFAULT_SUPABASE}
              spellCheck={false}
            />
            <button className="debug-apply-btn" onClick={applySupabase}>Apply</button>
            {supabaseActive && <button className="debug-reset-btn" onClick={resetSupabase}>Reset</button>}
          </div>
        </div>

        {/* WS direct override */}
        <div className="debug-row">
          <div className="debug-row-label">WebSocket URL (direct override — bypasses Supabase)</div>
          <div className="debug-row-controls">
            <input
              className={`debug-input ${wsActive ? "overridden" : ""}`}
              value={wsField}
              onChange={e => setWsField(e.target.value)}
              onKeyDown={e => e.key === "Enter" && applyWs()}
              placeholder="wss://your-ngrok-url.ngrok-free.app"
              spellCheck={false}
            />
            <button className="debug-apply-btn" onClick={applyWs}>Apply</button>
            {wsActive && <button className="debug-reset-btn" onClick={resetWs}>Reset</button>}
          </div>
        </div>

        <div className="debug-divider" />

        {/* Connection log */}
        <div className="debug-log">
          <div className="debug-log-header">
            <span className="debug-log-title">Connection Log</span>
            <button className="debug-log-clear" onClick={onClearLogs}>clear</button>
          </div>
          <div className="debug-log-lines" ref={logContainerRef}>
            {logs.length === 0 ? (
              <div className="debug-log-empty">— no log entries yet</div>
            ) : (
              logs.map(entry => (
                <div key={entry.id} className={`debug-log-line ${entry.level}`}>
                  <span className="ts">{entry.ts}</span>
                  <span className="src">{entry.src}</span>
                  <span className="msg">{entry.msg}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
