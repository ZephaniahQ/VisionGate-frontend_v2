import { visitorFlags, fmt, duration, stayMinutes } from "../utils/helpers";

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

export default function VisitorTable({ records, visitors }) {
  const visPresent  = visitors?.filter(v => v.is_present).length ?? 0;
  const visDeparted = visitors?.filter(v => v.exit_time).length ?? 0;
  const visFlagged  = visitors?.filter(v => v.is_blacklisted).length ?? 0;

  return (
    <div className="section-block" style={{ marginTop: "8px" }}>
      <div className="section-header">
        <div className="section-title-wrap">
          <span className="section-badge badge-vis">Visitors</span>
          <span className="section-title">Visitor Log</span>
        </div>
        <span className="section-count">
          {visPresent} on-site · {visDeparted} departed · {visFlagged} flagged
        </span>
      </div>
      <div className="table-wrap">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Snapshot</th>
                <th>ID / Name</th>
                <th>Purpose</th>
                <th>Arrival</th>
                <th>Departure</th>
                <th>Stay</th>
                <th>Direction</th>
                <th>Confidence</th>
                <th>Flags</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr><td colSpan="9" className="table-empty">— no visitor records today</td></tr>
              ) : records.map(rec => {
                const flags = visitorFlags(rec);
                const mins  = stayMinutes(rec.entry_time);
                const dur   = rec.exit_time
                  ? duration(rec.entry_time, rec.exit_time)
                  : rec.is_present && rec.entry_time
                    ? duration(rec.entry_time, new Date().toISOString())
                    : null;
                return (
                  <tr key={rec.id}>
                    <td><SnapCell url={rec.snapshot_url} name={rec.name} /></td>
                    <td>
                      <div className="person-id">{rec.id}</div>
                      <div className="person-name" style={{
                        color: rec.is_blacklisted ? "var(--danger)" : undefined
                      }}>{rec.name}</div>
                    </td>
                    <td><span className="person-dept">{rec.purpose || "—"}</span></td>
                    <td>
                      {rec.entry_time
                        ? <div className="time-val">{fmt(rec.entry_time)}</div>
                        : <div className="time-none">—</div>}
                    </td>
                    <td>
                      {rec.exit_time
                        ? <div className="time-val">{fmt(rec.exit_time)}</div>
                        : rec.is_present
                          ? <div className="time-none" style={{ color: "var(--blue)" }}>Still In</div>
                          : <div className="time-none">—</div>}
                    </td>
                    <td>
                      {dur
                        ? <div className={`time-val ${!rec.exit_time && mins > 240 ? "stay-warn" : "stay-ok"}`}>
                            {dur}
                          </div>
                        : <div className="time-none">—</div>}
                    </td>
                    <td>
                      <span className={`dir-badge ${rec.exit_time ? "dir-exit" : "dir-entry"}`}>
                        {rec.exit_time ? "Exited" : "Entry"}
                      </span>
                    </td>
                    <td>
                      {rec.confidence != null
                        ? <span className="conf-val" style={{
                            color: rec.confidence > 0.95 ? "var(--accent)"
                                 : rec.confidence > 0.8  ? "var(--warn)"
                                 : "var(--danger)"
                          }}>{Math.round(rec.confidence * 100)}%</span>
                        : <span className="time-none">—</span>}
                    </td>
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
