// ─────────────────────────────────────────────────────────────────────────────
// helpers.js — all field names match the real daily_records schema
//
// daily_records columns used here:
//   in_building   boolean   — true = currently present
//   is_late       boolean
//   out_of_hours  boolean
//   stay_minutes  int       — generated column (auto-computed server-side)
//   person_type   text      — 'employee' | 'visitor' | 'unknown' | 'blocked'
//   _isAbsent     boolean   — client-side sentinel for rows built from employees table
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format a timestamp string to HH:MM
 */
export function fmt(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Format stay in "Xh Ym" from two ISO timestamps (fallback for live duration).
 * Prefer stay_minutes from the record when available.
 */
export function duration(from, to) {
  if (!from || !to) return null;
  const ms = new Date(to) - new Date(from);
  if (ms <= 0) return null;
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

/**
 * Compute stay minutes from entry timestamp to now (for live "Still In" rows).
 */
export function stayMinutes(from) {
  if (!from) return 0;
  return Math.floor((Date.now() - new Date(from)) / 60000);
}

/**
 * Color per person_type — matches bbox overlay colors in StreamViewer.
 */
export function colorFor(personType) {
  const COLOR_MAP = {
    employee: "#22c55e",
    visitor:  "#3b82f6",
    blocked:  "#ef4444",
    unknown:  "#f97316",
  };
  return COLOR_MAP[personType] ?? COLOR_MAP.unknown;
}

// ── Employee flags ─────────────────────────────────────────────────────────
// All flags are pre-computed server-side; read directly from the record.
//
// Returns array of { key, label, cls } for rendering <span className={`flag ${cls}`}>

export function employeeFlags(rec) {
  const flags = [];

  if (rec._isAbsent) {
    flags.push({ key: "absent", label: "Absent", cls: "flag-danger" });
    return flags;
  }

  if (rec.is_late)      flags.push({ key: "late",      label: "Late",        cls: "flag-warn" });
  if (rec.out_of_hours) flags.push({ key: "oor",       label: "Out-of-Hours",cls: "flag-warn" });
  if (rec.in_building)  flags.push({ key: "in",        label: "In Office",   cls: "flag-ok"   });

  if (flags.length === 0) {
    // present and on time
    flags.push({ key: "ontime", label: "On Time", cls: "flag-ok" });
  }

  return flags;
}

// ── Visitor flags ──────────────────────────────────────────────────────────

export function visitorFlags(rec) {
  const flags = [];

  if (rec.person_type === "blocked") {
    flags.push({ key: "blocked",    label: "⚠ Blacklisted", cls: "flag-danger" });
  }
  if (rec.person_type === "unknown") {
    flags.push({ key: "unknown",    label: "Unknown",        cls: "flag-warn"   });
  }
  if (rec.out_of_hours) {
    flags.push({ key: "oor",        label: "Out-of-Hours",   cls: "flag-warn"   });
  }
  if ((rec.stay_minutes ?? 0) > 240) {
    flags.push({ key: "stay",       label: `Stay ${rec.stay_minutes}m`, cls: "flag-warn" });
  }
  if (rec.in_building) {
    flags.push({ key: "onpremises", label: "On Premises",    cls: "flag-ok"     });
  }

  return flags;
}