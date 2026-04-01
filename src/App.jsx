import { useState, useCallback, useRef } from "react";
import "./styles/global.css";

import TopBar        from "./components/TopBar";
import StreamViewer  from "./components/StreamViewer";
import StatCards     from "./components/StatCards";
import EmployeeTable from "./components/EmployeeTable";
import VisitorTable  from "./components/VisitorTable";
import DebugPanel    from "./components/DebugPanel";

import { MOCK_EMPLOYEES, MOCK_VISITORS } from "./data/mock";

const LS_THEME = "vg-theme";

export default function App() {
  // ── Theme ──────────────────────────────────────────────────────
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem(LS_THEME) || "dark";
    document.documentElement.setAttribute("data-theme", saved);
    return saved;
  });

  function toggleTheme() {
    setTheme(prev => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem(LS_THEME, next);
      document.documentElement.setAttribute("data-theme", next);
      return next;
    });
  }

  // ── Debug panel ────────────────────────────────────────────────
  const [debugOpen, setDebugOpen] = useState(false);
  const [logs,      setLogs]      = useState([]);
  const logIdRef = useRef(0);

  const addLog = useCallback((level, src, msg) => {
    const ts = new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLogs(prev => {
      const entry = { id: logIdRef.current++, ts, level, src, msg };
      // keep last 100 lines
      return prev.length >= 100 ? [...prev.slice(1), entry] : [...prev, entry];
    });
  }, []);

  // URL overrides (lifted from DebugPanel, passed as props to StreamViewer)
  const [whepUrl,       setWhepUrl]       = useState("");
  const [supabaseUrl,   setSupabaseUrl]   = useState("");
  const [wsUrlOverride, setWsUrlOverride] = useState("");
  // bump these to force-restart connections
  const [rtcKey, setRtcKey] = useState(0);
  const [wsKey,  setWsKey]  = useState(0);

  function handleApplyWhep(url) {
    setWhepUrl(url);
    setRtcKey(k => k + 1);
  }
  function handleApplySupabase(url) {
    setSupabaseUrl(url);
    setWsKey(k => k + 1);
  }
  function handleApplyWsOverride(url) {
    setWsUrlOverride(url);
    setWsKey(k => k + 1);
  }

  // ── Stream / detection state ───────────────────────────────────
  const [streamActive, setStreamActive] = useState(false);
  const [streamError,  setStreamError]  = useState(false);
  const [detections,   setDetections]   = useState([]);
  const [employees,    setEmployees]     = useState(MOCK_EMPLOYEES);
  const [visitors,     setVisitors]      = useState(MOCK_VISITORS);

  function handleStreamState(state) {
    setStreamActive(state === "active");
    setStreamError(state === "error");
  }

  function handleWsMessage(type, record) {
    if (type === "employee_update") {
      setEmployees(prev => {
        const idx = prev.findIndex(r => r.id === record.id);
        if (idx >= 0) { const n = [...prev]; n[idx] = record; return n; }
        return [...prev, record];
      });
    }
    if (type === "visitor_update") {
      setVisitors(prev => {
        const idx = prev.findIndex(r => r.id === record.id);
        if (idx >= 0) { const n = [...prev]; n[idx] = record; return n; }
        return [...prev, record];
      });
    }
  }

  return (
    <div className="dashboard">
      <TopBar
        streamActive={streamActive}
        streamError={streamError}
        theme={theme}
        onThemeToggle={toggleTheme}
        debugOpen={debugOpen}
        onDebugToggle={() => setDebugOpen(o => !o)}
      />

      <div className="monitor-grid">
        <StreamViewer
          onDetections={setDetections}
          onStreamState={handleStreamState}
          onWsMessage={handleWsMessage}
          onLog={addLog}
          whepUrl={whepUrl || undefined}
          wsUrlOverride={wsUrlOverride}
          supabaseUrl={supabaseUrl || undefined}
          rtcKey={rtcKey}
          wsKey={wsKey}
        />
        <StatCards employees={employees} visitors={visitors} />
      </div>

      {/* Debug panel — full width, below grid */}
      <DebugPanel
        open={debugOpen}
        logs={logs}
        onClearLogs={() => setLogs([])}
        onApplyWhep={handleApplyWhep}
        onApplySupabase={handleApplySupabase}
        onApplyWsOverride={handleApplyWsOverride}
      />

      <EmployeeTable records={employees} employees={employees} visitors={visitors} />
      <VisitorTable  records={visitors}  visitors={visitors} />
    </div>
  );
}
