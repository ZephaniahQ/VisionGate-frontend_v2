import { useState, useCallback, useRef, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import "./styles/global.css";

import TopBar     from "./components/TopBar";
import DebugPanel from "./components/DebugPanel";

import DashboardPage from "./pages/DashboardPage";
import ReportPage    from "./pages/ReportPage";
import SearchPage    from "./pages/SearchPage";

// ── Supabase ──────────────────────────────────────────────────────────
const SUPABASE_URL      = "https://ekenepjdjhsutkwbvcch.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrZW5lcGpkamhzdXRrd2J2Y2NoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1ODIyMDEsImV4cCI6MjA5MDE1ODIwMX0.iFXYc6uTyHJZltboGAQtBn0qyDPzRZHkLHxYfDQBZwg";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const LS_THEME = "vg-theme";

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function upsertById(prev, record) {
  const idx = prev.findIndex(r => r.id === record.id);
  if (idx >= 0) {
    const next = [...prev];
    next[idx] = record;
    return next;
  }
  return [record, ...prev];
}

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

  // ── URL overrides ──────────────────────────────────────────────
  const [whepUrl,       setWhepUrl]       = useState("");
  const [supabaseUrl,   setSupabaseUrl]   = useState("");
  const [wsUrlOverride, setWsUrlOverride] = useState("");
  const [rtcKey, setRtcKey] = useState(0);
  const [wsKey,  setWsKey]  = useState(0);

  function handleApplyWhep(url)       { setWhepUrl(url);       setRtcKey(k => k + 1); }
  function handleApplySupabase(url)   { setSupabaseUrl(url);   setWsKey(k => k + 1); }
  function handleApplyWsOverride(url) { setWsUrlOverride(url); setWsKey(k => k + 1); }

  // ── Stream state ───────────────────────────────────────────────
  const [streamActive, setStreamActive] = useState(false);
  const [streamError,  setStreamError]  = useState(false);

  function handleStreamState(state) {
    setStreamActive(state === "active");
    setStreamError(state === "error");
  }

  // ── Data state ─────────────────────────────────────────────────
  const [employees,       setEmployees]       = useState([]);
  const [visitors,        setVisitors]        = useState([]);
  const [absentEmployees, setAbsentEmployees] = useState([]);
  const [dbLoading,       setDbLoading]       = useState(true);

  // ── Initial data load ──────────────────────────────────────────
  useEffect(() => {
    const today = todayStr();
    addLog("info", "DB", `Fetching daily_records for ${today}…`);

    async function loadData() {
      try {
        const { data: records, error: recErr } = await supabase
          .from("daily_records")
          .select("*")
          .eq("record_date", today)
          .order("first_seen_at", { ascending: false });

        if (recErr) throw recErr;

        const emps = (records || []).filter(r => r.person_type === "employee");
        const vis  = (records || []).filter(r =>
          ["visitor", "unknown", "blocked"].includes(r.person_type)
        );
        setEmployees(emps);
        setVisitors(vis);
        addLog("ok", "DB", `${emps.length} employee records, ${vis.length} visitor records`);

        const { data: allEmps, error: empErr } = await supabase
          .from("employees")
          .select("id, name, department");

        if (empErr) {
          addLog("warn", "DB", `employees table fetch failed: ${empErr.message}`);
        } else {
          const presentPersonIds = new Set(emps.map(r => r.person_id).filter(Boolean));
          const absent = (allEmps || [])
            .filter(e => !presentPersonIds.has(e.id))
            .map(e => ({
              id:            `absent-${e.id}`,
              person_id:     e.id,
              person_type:   "employee",
              display_name:  e.name,
              department:    e.department,
              record_date:   today,
              first_seen_at: null,
              last_seen_at:  null,
              in_building:   false,
              is_late:       false,
              out_of_hours:  false,
              stay_minutes:  null,
              confidence:    null,
              snapshot_url:  null,
              _isAbsent:     true,
            }));
          setAbsentEmployees(absent);
          addLog("ok", "DB", `${absent.length} employees absent`);
        }
      } catch (err) {
        addLog("err", "DB", `Load failed: ${err.message}`);
      } finally {
        setDbLoading(false);
      }
    }

    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Realtime subscription ──────────────────────────────────────
  useEffect(() => {
    addLog("info", "RT", "Subscribing to realtime…");

    const channel = supabase
      .channel("vg-live")
      .on("broadcast", { event: "new_detection" }, ({ payload }) => {
        addLog("info", "RT", `Broadcast: ${payload?.person_type} — ${payload?.display_name}`);
      })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "daily_records" },
        ({ eventType, new: rec, old }) => {
          addLog("info", "RT",
            `${eventType} → ${rec?.display_name ?? old?.id} (${rec?.person_type ?? "?"})`
          );

          if (eventType === "DELETE") {
            const delId = old?.id;
            setEmployees(prev => prev.filter(r => r.id !== delId));
            setVisitors(prev  => prev.filter(r => r.id !== delId));
            return;
          }

          if (!rec) return;

          if (rec.person_type === "employee") {
            setEmployees(prev => upsertById(prev, rec));
            if (rec.person_id) {
              setAbsentEmployees(prev =>
                prev.filter(e => e.person_id !== rec.person_id)
              );
            }
          } else {
            setVisitors(prev => upsertById(prev, rec));
          }
        }
      )
      .subscribe(status => {
        if (status === "SUBSCRIBED") addLog("ok",  "RT", "Realtime active ✓");
        else if (["CHANNEL_ERROR", "TIMED_OUT"].includes(status))
          addLog("err", "RT", `Realtime error: ${status}`);
      });

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── WS message fallback ────────────────────────────────────────
  function handleWsMessage(type, record) {
    if (type === "employee_update") setEmployees(prev => upsertById(prev, record));
    if (type === "visitor_update")  setVisitors(prev  => upsertById(prev, record));
  }

  const streamOverrides = {
    whepUrl:     whepUrl || undefined,
    wsUrlOverride,
    supabaseUrl: supabaseUrl || undefined,
    rtcKey,
    wsKey,
  };

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

      <DebugPanel
        open={debugOpen}
        logs={logs}
        onClearLogs={() => setLogs([])}
        onApplyWhep={handleApplyWhep}
        onApplySupabase={handleApplySupabase}
        onApplyWsOverride={handleApplyWsOverride}
      />

      <Routes>
        <Route
          path="/"
          element={
            <DashboardPage
              employees={employees}
              absentEmployees={absentEmployees}
              visitors={visitors}
              dbLoading={dbLoading}
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