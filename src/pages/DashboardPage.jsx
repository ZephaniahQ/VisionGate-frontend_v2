import { useState } from "react";

import StreamViewer  from "../components/StreamViewer";
import StatCards     from "../components/StatCards";
import EmployeeTable from "../components/EmployeeTable";
import VisitorTable  from "../components/VisitorTable";

/**
 * DashboardPage
 *
 * Owns only the dashboard layout. All shared state (employees, visitors,
 * stream status) lives in App.jsx and is passed down as props so the
 * Realtime subscriptions and stream connection survive page navigation.
 *
 * Props:
 *   employees       DailyRecord[]   — employee rows from App state
 *   visitors        DailyRecord[]   — visitor rows from App state
 *   streamOverrides object          — URL/key overrides from DebugPanel
 *   onStreamState   fn(state)       — reports 'active' | 'error' | 'idle' up to App
 *   onWsMessage     fn(type,record) — forwards WS updates up to App
 *   onLog           fn(level,src,msg)
 */
export default function DashboardPage({
  employees,
  visitors,
  streamOverrides,
  onStreamState,
  onWsMessage,
  onLog,
}) {
  const [detections, setDetections] = useState([]);

  const {
    whepUrl,
    wsUrlOverride,
    supabaseUrl,
    rtcKey,
    wsKey,
  } = streamOverrides;

  return (
    <>
      <div className="monitor-grid">
        <StreamViewer
          onDetections={setDetections}
          onStreamState={onStreamState}
          onWsMessage={onWsMessage}
          onLog={onLog}
          whepUrl={whepUrl}
          wsUrlOverride={wsUrlOverride}
          supabaseUrl={supabaseUrl}
          rtcKey={rtcKey}
          wsKey={wsKey}
        />
        <StatCards employees={employees} visitors={visitors} />
      </div>

      <EmployeeTable records={employees} employees={employees} visitors={visitors} />
      <VisitorTable  records={visitors}  visitors={visitors} />
    </>
  );
}
