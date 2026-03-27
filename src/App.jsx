import { useState } from "react";
import "./styles/global.css";

import TopBar        from "./components/TopBar";
import StreamViewer  from "./components/StreamViewer";
import StatCards     from "./components/StatCards";
import EmployeeTable from "./components/EmployeeTable";
import VisitorTable  from "./components/VisitorTable";

import { MOCK_EMPLOYEES, MOCK_VISITORS } from "./data/mock";

export default function App() {
  const [streamActive, setStreamActive] = useState(false);
  const [streamError,  setStreamError]  = useState(false);
  const [detections,   setDetections]   = useState([]);
  const [employees,    setEmployees]    = useState(MOCK_EMPLOYEES);
  const [visitors,     setVisitors]     = useState(MOCK_VISITORS);

  // Called by StreamViewer when WS messages come in with record updates
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
      <TopBar streamActive={streamActive} streamError={streamError} />

      <div className="monitor-grid">
        <StreamViewer
          onDetections={setDetections}
          onStreamState={(state) => {
            setStreamActive(state === "active");
            setStreamError(state === "error");
          }}
          onWsMessage={handleWsMessage}
        />
        <StatCards employees={employees} visitors={visitors} />
      </div>

      <EmployeeTable
        records={employees}
        employees={employees}
        visitors={visitors}
      />

      <VisitorTable
        records={visitors}
        visitors={visitors}
      />
    </div>
  );
}
