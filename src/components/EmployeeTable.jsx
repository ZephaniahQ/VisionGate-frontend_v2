import { employeeFlags, fmt, duration } from "../utils/helpers";

function SnapCell({ url, name }) {
  return (
    <div className="snap-cell">
      {url ? (
        <img src={url} alt={name} className="snap-img" />
      ) : (
        <div className="snap-placeholder">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
        </div>
      )}
    </div>
  );
}

function Flags({ list }) {
  if (!list.length) return <span className="time-none">—</span>;
  return (
    <div className="flags-cell">
      {list.map(f => <span key={f.key} className={`flag ${f.cls}`}>{f.label}</span>)}
    </div>
  );
}

// Format stay_minutes (integer) into "Xh Ym"
function fmtStay(minutes) {
  if (minutes == null || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export default function EmployeeTable({ records, employees }) {
  // Use real daily_records fields:
  //   in_building  → currently present (no departure logic yet per spec)
  //   _isAbsent    → sentinel added by App for absent rows
  //   first_seen_at → arrival
  //   last_seen_at  → last seen / departure
  //   display_name  → name to show
  //   person_id     → uuid from employees table

  const empPresent  = (employees || []).filter(e => e.in_building && !e._isAbsent).length;
  const empDeparted = (employees || []).filter(e => !e.in_building && !e._isAbsent && e.first_seen_at).length;
  const empAbsent   = (employees || []).filter(e => e._isAbsent).length;

  return (
    <div className="section-block" style={{ marginTop: "8px" }}>
      <div className="section-header">
        <div className="section-title-wrap">
          <span className="section-badge badge-emp">Employees</span>
          <span className="section-title">Attendance Ledger</span>
        </div>
        <span className="section-count">
          {empPresent} present · {empDeparted} departed · {empAbsent} absent
        </span>
      </div>

      <div className="table-wrap">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Snapshot</th>
                <th>ID / Name</th>
                <th>Department</th>
                <th>Arrival</th>
                <th>Departure</th>
                <th>Duration</th>
                <th>Confidence</th>
                <th>Status / Flags</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan="8" className="table-empty">— no employee records today</td>
                </tr>
              ) : records.map(rec => {
                const flags  = employeeFlags(rec);
                const stay   = fmtStay(rec.stay_minutes);

                return (
                  <tr key={rec.id}>
                    {/* Snapshot */}
                    <td>
                      <SnapCell url={rec.snapshot_url} name={rec.display_name} />
                    </td>

                    {/* ID / Name — show short person_id + display_name */}
                    <td>
                      <div className="person-id" title={rec.person_id}>
                        {rec._isAbsent
                          ? <span style={{ color: "var(--text-dim)", fontSize: 11 }}>—</span>
                          : rec.person_id
                            ? rec.person_id.slice(0, 8) + "…"
                            : "—"
                        }
                      </div>
                      <div className="person-name">
                        {rec.display_name || "Unknown"}
                      </div>
                    </td>

                    {/* Department */}
                    <td>
                      <span className="person-dept">{rec.department || "—"}</span>
                    </td>

                    {/* Arrival */}
                    <td>
                      {rec.first_seen_at
                        ? <div className="time-val">{fmt(rec.first_seen_at)}</div>
                        : <div className="time-none">—</div>}
                    </td>

                    {/* Departure */}
                    <td>
                      {rec._isAbsent ? (
                        <div className="time-none">—</div>
                      ) : rec.in_building ? (
                        <div className="time-none" style={{ color: "var(--accent)" }}>Still In</div>
                      ) : rec.last_seen_at ? (
                        <div className="time-val">{fmt(rec.last_seen_at)}</div>
                      ) : (
                        <div className="time-none">—</div>
                      )}
                    </td>

                    {/* Duration — use pre-computed stay_minutes */}
                    <td>
                      {rec._isAbsent ? (
                        <div className="time-none">—</div>
                      ) : rec.in_building && rec.first_seen_at ? (
                        <div className="time-val" style={{ color: "var(--accent)" }}>
                          {stay || "< 1m"}
                        </div>
                      ) : stay ? (
                        <div className="time-val">{stay}</div>
                      ) : (
                        <div className="time-none">—</div>
                      )}
                    </td>

                    {/* Confidence */}
                    <td>
                      {!rec._isAbsent && rec.confidence != null ? (
                        <span className="conf-val" style={{
                          color: rec.confidence > 0.95 ? "var(--accent)"
                               : rec.confidence > 0.8  ? "var(--warn)"
                               : "var(--danger)"
                        }}>
                          {Math.round(rec.confidence * 100)}%
                        </span>
                      ) : (
                        <span className="time-none">—</span>
                      )}
                    </td>

                    {/* Status / Flags */}
                    <td><Flags list={flags} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}