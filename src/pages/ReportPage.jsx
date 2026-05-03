import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ekenepjdjhsutkwbvcch.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrZW5lcGpkamhzdXRrd2J2Y2NoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1ODIyMDEsImV4cCI6MjA5MDE1ODIwMX0.iFXYc6uTyHJZltboGAQtBn0qyDPzRZHkLHxYfDQBZwg";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function toDateString(date) {
  return date.toISOString().split("T")[0];
}

async function triggerExport(type, date, rows) {
  const columns = type === "employee" ? EMPLOYEE_COLS : VISITOR_COLS;
  const csvContent = [
    columns.map(col => col.label).join(','),
    ...rows.map(row => columns.map(col => {
      let val = row[col.key];
      if (col.key === "attendance_status") {
        val = row.is_late ? "late" : row.in_building ? "present" : "absent";
      }
      if (val === null || val === undefined) return '';
      if (typeof val === 'boolean') return val ? 'Yes' : 'No';
      return String(val).replace(/"/g, '""'); // Escape quotes
    }).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(blob);
  anchor.download = `${type}-report-${date}.csv`;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

function StatusPill({ value }) {
  const map = {
    present: { label: "Present", bg: "#e6f4ea", color: "#1a7c3e" },
    absent: { label: "Absent", bg: "#fce8e8", color: "#b71c1c" },
    late: { label: "Late", bg: "#fff4e5", color: "#b45309" },
    true: { label: "Yes", bg: "#e6f4ea", color: "#1a7c3e" },
    false: { label: "No", bg: "#f3f3f3", color: "#666" },
  };
  const key = String(value).toLowerCase();
  const s = map[key] || { label: String(value), bg: "#f3f3f3", color: "#444" };
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        padding: "2px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 500,
        letterSpacing: "0.01em",
      }}
    >
      {s.label}
    </span>
  );
}

function PreviewTable({ rows, columns, loading, error }) {
  if (loading)
    return (
      <div style={styles.tableMsg}>
        <span style={styles.spinner} />
        Loading preview…
      </div>
    );
  if (error)
    return <div style={{ ...styles.tableMsg, color: "#b71c1c" }}>{error}</div>;
  if (!rows || rows.length === 0)
    return (
      <div style={styles.tableMsg}>No records found for this date.</div>
    );

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={styles.th}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={i % 2 === 0 ? {} : { background: "#fafafa" }}>
              {columns.map((col) => {
                let val = row[col.key];
                if (col.key === "attendance_status") {
                  val = row.is_late ? "late" : row.in_building ? "present" : "absent";
                }
                const isBool = typeof val === "boolean";
                const isStatus =
                  col.key === "status" ||
                  col.key === "attendance_status" ||
                  isBool;
                return (
                  <td key={col.key} style={styles.td}>
                    {isStatus ? (
                      <StatusPill value={val} />
                    ) : val === null || val === undefined ? (
                      <span style={{ color: "#bbb" }}>—</span>
                    ) : (
                      String(val)
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const EMPLOYEE_COLS = [
  { key: "display_name", label: "Name" },
  { key: "department", label: "Department" },
  { key: "first_seen_at", label: "Check In" },
  { key: "last_seen_at", label: "Check Out" },
  { key: "attendance_status", label: "Status" },
  { key: "is_late", label: "Late" },
];

const VISITOR_COLS = [
  { key: "display_name", label: "Name" },
  { key: "first_seen_at", label: "Check In" },
  { key: "last_seen_at", label: "Check Out" },
  { key: "attendance_status", label: "Status" },
];

function ReportPageContent() {
  const today = toDateString(new Date());
  const [date, setDate] = useState(today);
  const [activeTab, setActiveTab] = useState("employee");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [exportState, setExportState] = useState({
    employee: "idle",
    visitor: "idle",
  });
  const [exportError, setExportError] = useState({
    employee: null,
    visitor: null,
  });

  const fetchPreview = useCallback(
    async (tab, selectedDate) => {
      setLoading(true);
      setFetchError(null);
      setRows([]);
      try {
        const isEmployee = tab === "employee";
        let query = supabase
          .from("daily_records")
          .select("*")
          .eq("record_date", selectedDate);

        if (isEmployee) {
          query = query.eq("person_type", "employee");
        } else {
          query = query.eq("person_type", "visitor");
        }

        const { data, error } = await query.limit(50);
        if (error) throw error;
        setRows(data || []);
      } catch (err) {
        setFetchError("Could not load preview: " + (err.message || "Unknown error"));
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchPreview(activeTab, date);
  }, [activeTab, date, fetchPreview]);

  async function handleExport(type) {
    setExportState((s) => ({ ...s, [type]: "loading" }));
    setExportError((s) => ({ ...s, [type]: null }));
    try {
      await triggerExport(type, date);
      setExportState((s) => ({ ...s, [type]: "success" }));
      setTimeout(
        () => setExportState((s) => ({ ...s, [type]: "idle" })),
        2500
      );
    } catch (err) {
      setExportState((s) => ({ ...s, [type]: "error" }));
      setExportError((s) => ({
        ...s,
        [type]: err.message || "Export failed",
      }));
    }
  }

  const columns = activeTab === "employee" ? EMPLOYEE_COLS : VISITOR_COLS;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Reports</h2>
          <p style={styles.subtitle}>
            Export attendance data or preview records by date
          </p>
        </div>
        <div style={styles.datePicker}>
          <label style={styles.dateLabel}>Date</label>
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => setDate(e.target.value)}
            style={styles.dateInput}
          />
        </div>
      </div>

      <div style={styles.exportRow}>
        <ExportButton
          label="Export Employee CSV"
          icon="👤"
          state={exportState.employee}
          error={exportError.employee}
          onClick={() => handleExport("employee")}
        />
        <ExportButton
          label="Export Visitor CSV"
          icon="🪪"
          state={exportState.visitor}
          error={exportError.visitor}
          onClick={() => handleExport("visitor")}
        />
      </div>

      <div style={styles.card}>
        <div style={styles.tabRow}>
          {["employee", "visitor"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                ...styles.tab,
                ...(activeTab === tab ? styles.tabActive : {}),
              }}
            >
              {tab === "employee" ? "Employees" : "Visitors"}
              {activeTab === tab && rows.length > 0 && (
                <span style={styles.tabCount}>{rows.length}</span>
              )}
            </button>
          ))}
          <button
            onClick={() => fetchPreview(activeTab, date)}
            style={styles.refreshBtn}
            title="Refresh"
          >
            ↺
          </button>
        </div>

        <PreviewTable
          rows={rows}
          columns={columns}
          loading={loading}
          error={fetchError}
        />
      </div>
    </div>
  );
}

function ExportButton({ label, icon, state, error, onClick }) {
  const isLoading = state === "loading";
  const isSuccess = state === "success";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <button
        onClick={onClick}
        disabled={isLoading}
        style={{
          ...styles.exportBtn,
          ...(isLoading ? styles.exportBtnLoading : {}),
          ...(isSuccess ? styles.exportBtnSuccess : {}),
        }}
      >
        {isLoading ? (
          <>
            <span style={styles.spinner} /> Generating…
          </>
        ) : isSuccess ? (
          <>✓ Downloaded</>
        ) : (
          <>
            <span style={{ fontSize: 15 }}>{icon}</span> {label}
          </>
        )}
      </button>
      {error && <span style={styles.exportErr}>{error}</span>}
    </div>
  );
}

const styles = {
  page: {
    padding: "2rem 2.25rem",
    maxWidth: 980,
    fontFamily: "inherit",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "1rem",
    marginBottom: "1.75rem",
  },
  title: {
    fontSize: 22,
    fontWeight: 600,
    margin: 0,
    letterSpacing: "-0.01em",
    color: "#111",
  },
  subtitle: {
    fontSize: 13,
    color: "#888",
    margin: "4px 0 0",
  },
  datePicker: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#fff",
    border: "1px solid #e2e2e2",
    borderRadius: 8,
    padding: "6px 14px",
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: 500,
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  dateInput: {
    border: "none",
    outline: "none",
    fontSize: 14,
    color: "#111",
    background: "transparent",
    cursor: "pointer",
  },
  exportRow: {
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap",
    marginBottom: "2rem",
  },
  exportBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 22px",
    borderRadius: 8,
    border: "1.5px solid #222",
    background: "#fff",
    color: "#111",
    fontSize: 13.5,
    fontWeight: 500,
    cursor: "pointer",
    transition: "background 0.15s, color 0.15s",
    whiteSpace: "nowrap",
    minWidth: 210,
    justifyContent: "center",
  },
  exportBtnLoading: {
    opacity: 0.65,
    cursor: "not-allowed",
    background: "#f7f7f7",
  },
  exportBtnSuccess: {
    background: "#1a7c3e",
    color: "#fff",
    borderColor: "#1a7c3e",
  },
  exportErr: {
    fontSize: 12,
    color: "#b71c1c",
  },
  card: {
    background: "#fff",
    border: "1px solid #e5e5e5",
    borderRadius: 10,
    overflow: "hidden",
  },
  tabRow: {
    display: "flex",
    alignItems: "center",
    borderBottom: "1px solid #e5e5e5",
    padding: "0 1.25rem",
    gap: 4,
  },
  tab: {
    padding: "11px 16px",
    border: "none",
    borderBottom: "2px solid transparent",
    background: "transparent",
    fontSize: 13.5,
    fontWeight: 500,
    color: "#888",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 6,
    transition: "color 0.15s",
    marginBottom: -1,
  },
  tabActive: {
    color: "#111",
    borderBottomColor: "#111",
  },
  tabCount: {
    background: "#f0f0f0",
    color: "#555",
    fontSize: 11,
    fontWeight: 600,
    padding: "1px 7px",
    borderRadius: 999,
  },
  refreshBtn: {
    marginLeft: "auto",
    padding: "6px 10px",
    border: "none",
    background: "transparent",
    color: "#999",
    cursor: "pointer",
    fontSize: 16,
    borderRadius: 6,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13.5,
    tableLayout: "fixed",
  },
  th: {
    textAlign: "left",
    padding: "10px 16px",
    fontSize: 11.5,
    fontWeight: 600,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    borderBottom: "1px solid #eee",
    background: "#fafafa",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  td: {
    padding: "10px 16px",
    borderBottom: "1px solid #f2f2f2",
    color: "#222",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  tableMsg: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "2.5rem 1.5rem",
    color: "#999",
    fontSize: 13.5,
  },
  spinner: {
    display: "inline-block",
    width: 14,
    height: 14,
    border: "2px solid #ddd",
    borderTopColor: "#555",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },
};

export default function ReportPage() {
  return <ReportPageContent />;
}