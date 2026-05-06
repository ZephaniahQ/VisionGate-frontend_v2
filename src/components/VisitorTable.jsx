import { useState } from "react";
import { visitorFlags, fmt } from "../utils/helpers";
import SnapCell, { SnapshotModal } from "./SnapCell";

function Flags({ list }) {
  if (!list.length) return <span className="time-none">—</span>;
  return (
    <div className="flags-cell">
      {list.map(f => <span key={f.key} className={`flag ${f.cls}`}>{f.label}</span>)}
    </div>
  );
}

function fmtStay(minutes) {
  if (minutes == null || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export default function VisitorTable({ records, visitors }) {
  const [modal, setModal] = useState(null); // { url, name } | null

  const visPresent  = (visitors || []).filter(v => v.in_building).length;
  const visDeparted = (visitors || []).filter(v => !v.in_building && v.first_seen_at).length;
  const visFlagged  = (visitors || []).filter(v =>
    v.person_type === "blocked" || (v.stay_minutes ?? 0) > 240
  ).length;

  return (
    <div className="section-block" style={{ marginTop: "8px" }}>
      {/* Lightbox */}
      {modal && (
        <SnapshotModal
          url={modal.url}
          name={modal.name}
          onClose={() => setModal(null)}
        />
      )}

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
                <th>Type</th>
                <th>Arrival</th>
                <th>Last Seen</th>
                <th>Stay</th>
                <th>Status</th>
                <th>Confidence</th>
                <th>Flags</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan="9" className="table-empty">— no visitor records today</td>
                </tr>
              ) : records.map(rec => {
                const flags     = visitorFlags(rec);
                const stay      = fmtStay(rec.stay_minutes);
                const isBlocked = rec.person_type === "blocked";
                const isUnknown = rec.person_type === "unknown";

                return (
                  <tr key={rec.id}>
                    {/* Snapshot */}
                    <td>
                      <SnapCell
                        url={rec.snapshot_url}
                        name={rec.display_name}
                        onExpand={(url, name) => setModal({ url, name })}
                      />
                    </td>

                    {/* ID / Name */}
                    <td>
                      <div className="person-id" title={rec.person_id}>
                        {rec.person_id ? rec.person_id.slice(0, 8) + "…" : "—"}
                      </div>
                      <div
                        className="person-name"
                        style={{ color: isBlocked ? "var(--danger)" : undefined }}
                      >
                        {rec.display_name || (isUnknown ? "Unknown Person" : "—")}
                      </div>
                    </td>

                    {/* Type badge */}
                    <td>
                      <span className={`dir-badge ${
                        isBlocked ? "dir-exit"
                        : isUnknown ? "dir-unknown"
                        : "dir-entry"
                      }`}>
                        {rec.person_type.charAt(0).toUpperCase() + rec.person_type.slice(1)}
                      </span>
                    </td>

                    {/* Arrival */}
                    <td>
                      {rec.first_seen_at
                        ? <div className="time-val">{fmt(rec.first_seen_at)}</div>
                        : <div className="time-none">—</div>}
                    </td>

                    {/* Last Seen */}
                    <td>
                      {rec.in_building ? (
                        <div className="time-none" style={{ color: "var(--blue)" }}>Still In</div>
                      ) : rec.last_seen_at ? (
                        <div className="time-val">{fmt(rec.last_seen_at)}</div>
                      ) : (
                        <div className="time-none">—</div>
                      )}
                    </td>

                    {/* Stay */}
                    <td>
                      {stay ? (
                        <div className={`time-val ${(rec.stay_minutes ?? 0) > 240 ? "stay-warn" : "stay-ok"}`}>
                          {stay}
                        </div>
                      ) : (
                        <div className="time-none">—</div>
                      )}
                    </td>

                    {/* Status */}
                    <td>
                      <span className={`dir-badge ${rec.in_building ? "dir-entry" : "dir-exit"}`}>
                        {rec.in_building ? "On Premises" : "Left"}
                      </span>
                    </td>

                    {/* Confidence */}
                    <td>
                      {rec.confidence != null ? (
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

                    {/* Flags */}
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
