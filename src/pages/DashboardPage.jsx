import { useState } from "react";

import StreamViewer  from "../components/StreamViewer";
import StatCards     from "../components/StatCards";
import EmployeeTable from "../components/EmployeeTable";
import VisitorTable  from "../components/VisitorTable";

export default function DashboardPage({
  employees,        // daily_records rows — person_type === 'employee'
  absentEmployees,  // shaped employee rows with no record today
  visitors,         // daily_records rows — visitor | unknown | blocked
  dbLoading,
  streamOverrides,
  onStreamState,
  onWsMessage,
  onLog,
}) {
  const [detections, setDetections] = useState([]);
  const { whepUrl, wsUrlOverride, supabaseUrl, rtcKey, wsKey } = streamOverrides;

  // Combine present + absent into one list for the ledger
  // Present employees always come first (sorted by first_seen_at desc from App)
  const allEmployeeRows = [...employees, ...absentEmployees];

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
        <StatCards
          employees={allEmployeeRows}
          visitors={visitors}
        />
      </div>

      {dbLoading ? (
        <div style={{
          textAlign: "center",
          padding: "2rem",
          color: "var(--text-dim)",
          fontSize: 13,
          fontFamily: "'IBM Plex Mono', monospace",
          letterSpacing: "0.05em",
        }}>
          Loading daily records…
        </div>
      ) : (
        <>
          <EmployeeTable
            records={allEmployeeRows}
            employees={allEmployeeRows}
          />
          <VisitorTable
            records={visitors}
            visitors={visitors}
          />
        </>
      )}
    </>
  );
}