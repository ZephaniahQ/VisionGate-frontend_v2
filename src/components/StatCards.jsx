import { employeeFlags, visitorFlags } from "../utils/helpers";

export default function StatCards({ employees, visitors }) {
  // employees = combined present + absent rows (daily_records shape)
  // visitors  = daily_records rows (visitor | unknown | blocked)

  const empPresent = employees.filter(e => e.in_building && !e._isAbsent).length;
  const empLate    = employees.filter(e => e.is_late && !e._isAbsent).length;

  const visPresent = visitors.filter(v => v.in_building).length;
  const visAlert   = visitors.filter(v =>
    v.person_type === "blocked" || (v.stay_minutes ?? 0) > 240
  ).length;

  return (
    <div className="stats-col">
      <div className="stat-card">
        <div className="stat-card-label">Employees In</div>
        <div className="stat-card-value accent">{empPresent}</div>
        <div className="stat-card-sub">of {employees.length} registered today</div>
      </div>

      <div className="stat-card">
        <div className="stat-card-label">Visitors On-Site</div>
        <div className="stat-card-value blue">{visPresent}</div>
        <div className="stat-card-sub">{visitors.length} total today</div>
      </div>

      <div className="stat-divider" />

      <div className="stat-card">
        <div className="stat-card-label">Late Arrivals</div>
        <div className={`stat-card-value ${empLate > 0 ? "warn" : "accent"}`}>{empLate}</div>
        <div className="stat-card-sub">employees past grace period</div>
      </div>

      <div className="stat-card">
        <div className="stat-card-label">Active Alerts</div>
        <div className={`stat-card-value ${visAlert > 0 ? "danger" : "accent"}`}>{visAlert}</div>
        <div className="stat-card-sub">blacklist / overstay flags</div>
      </div>

      <div className="stat-divider" />

      <div className="stat-card">
        <div className="stat-card-label">Office Hours</div>
        <div className="stat-card-value" style={{ fontSize: "16px", color: "var(--text-dim)" }}>
          09:00–17:00
        </div>
        <div className="stat-card-sub">grace period 5 min</div>
      </div>
    </div>
  );
}