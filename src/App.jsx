import { useState, useCallback, useRef } from "react";
import { Routes, Route } from "react-router-dom";
import "./styles/global.css";

import TopBar     from "./components/TopBar";
import DebugPanel from "./components/DebugPanel";

import DashboardPage from "./pages/DashboardPage";
import ReportPage    from "./pages/ReportPage";
import SearchPage    from "./pages/SearchPage";

import { MOCK_EMPLOYEES, MOCK_VISITORS } from "./data/mock";

const LS_THEME = "vg-theme";

export default function App() {
  // ── Theme ──────────────────────────────────────────────────────
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem(LS_THEME) || "light";
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
    const ts = new Date().toLocaleTimeString("en-US", {
      hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
    setLogs(prev => {
      const entry = { id: logIdRef.current++, ts, level, src, msg };
      return prev.length >= 100 ? [...prev.slice(1), entry] : [...prev, entry];
    });
  }, []);

  // ── URL overrides (passed down to DashboardPage → StreamViewer) ─
  const [whepUrl,       setWhepUrl]       = useState("");
  const [supabaseUrl,   setSupabaseUrl]   = useState("");
  const [wsUrlOverride, setWsUrlOverride] = useState("");
  const [rtcKey, setRtcKey] = useState(0);
  const [wsKey,  setWsKey]  = useState(0);

  function handleApplyWhep(url)        { setWhepUrl(url);       setRtcKey(k => k + 1); }
  function handleApplySupabase(url)    { setSupabaseUrl(url);   setWsKey(k => k + 1); }
  function handleApplyWsOverride(url)  { setWsUrlOverride(url); setWsKey(k => k + 1); }

  // ── Stream / detection state ───────────────────────────────────
  const [streamActive, setStreamActive] = useState(false);
  const [streamError,  setStreamError]  = useState(false);
  const [employees,    setEmployees]    = useState(MOCK_EMPLOYEES);
  const [visitors,     setVisitors]     = useState(MOCK_VISITORS);

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

  // ── Shared stream override props (passed to DashboardPage) ─────
  const streamOverrides = {
    whepUrl:       whepUrl || undefined,
    wsUrlOverride,
    supabaseUrl:   supabaseUrl || undefined,
    rtcKey,
    wsKey,
  };

  return (
    <div className="dashboard">
      {/* TopBar is always visible on every page */}
      <TopBar
        streamActive={streamActive}
        streamError={streamError}
        theme={theme}
        onThemeToggle={toggleTheme}
        debugOpen={debugOpen}
        onDebugToggle={() => setDebugOpen(o => !o)}
      />

      {/* Debug panel sits below TopBar, above page content */}
      <DebugPanel
        open={debugOpen}
        logs={logs}
        onClearLogs={() => setLogs([])}
        onApplyWhep={handleApplyWhep}
        onApplySupabase={handleApplySupabase}
        onApplyWsOverride={handleApplyWsOverride}
      />

      {/* Page content */}
      <Routes>
        <Route
          path="/"
          element={
            <DashboardPage
              employees={employees}
              visitors={visitors}
              streamOverrides={streamOverrides}
              onStreamState={handleStreamState}
              onWsMessage={handleWsMessage}
              onLog={addLog}
            />
          }
        />
        <Route path="/report"  element={<ReportPage />} />
        <Route path="/search"  element={<SearchPage />} />
      </Routes>
    </div>
  );
}
