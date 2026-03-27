export const labelColors = {};
const palette = ["#00ff88","#00aaff","#ff6644","#ffcc00","#cc44ff","#ff44aa","#44ffee","#ff8800"];
let ci = 0;
export function colorFor(label) {
  if (!labelColors[label]) labelColors[label] = palette[ci++ % palette.length];
  return labelColors[label];
}

export function fmt(ts) {
  if (!ts) return null;
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}

export function duration(entry, exit) {
  if (!entry || !exit) return null;
  const ms = new Date(exit) - new Date(entry);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function stayMinutes(entry) {
  if (!entry) return 0;
  return Math.round((Date.now() - new Date(entry)) / 60000);
}

export function employeeFlags(rec) {
  const flags = [];
  const OFFICE_START     = 9 * 60;
  const OFFICE_END       = 17 * 60;
  const GRACE            = 10;
  const LATE_NIGHT_START = 20 * 60;
  const LATE_NIGHT_END   = 5 * 60;

  const entryMin = rec.entry_time
    ? new Date(rec.entry_time).getHours() * 60 + new Date(rec.entry_time).getMinutes()
    : null;
  const exitMin = rec.exit_time
    ? new Date(rec.exit_time).getHours() * 60 + new Date(rec.exit_time).getMinutes()
    : null;

  if (rec.is_present && !rec.exit_time)
    flags.push({ key: "present", label: "In Office", cls: "flag-present" });
  if (entryMin !== null) {
    if (entryMin <= OFFICE_START + GRACE)
      flags.push({ key: "ontime", label: "On Time", cls: "flag-ok" });
    else
      flags.push({ key: "late", label: "Late Arrival", cls: "flag-late" });
  }
  if (exitMin !== null && exitMin < OFFICE_END)
    flags.push({ key: "early", label: "Left Early", cls: "flag-early" });
  if (rec.out_of_hours)
    flags.push({ key: "ooh", label: "Out-of-Hours", cls: "flag-danger" });
  if (entryMin !== null && (entryMin >= LATE_NIGHT_START || entryMin <= LATE_NIGHT_END))
    if (!flags.find(f => f.key === "ooh"))
      flags.push({ key: "night", label: "Late Night", cls: "flag-danger" });
  if (!rec.entry_time && !rec.is_present)
    flags.push({ key: "absent", label: "Absent", cls: "flag-danger" });

  return flags;
}

export function visitorFlags(rec, alertHours = 4) {
  const flags = [];
  const mins = stayMinutes(rec.entry_time);
  if (rec.is_blacklisted)
    flags.push({ key: "blacklist", label: "⚠ Blacklisted", cls: "flag-danger" });
  if (rec.person_type === "unknown")
    flags.push({ key: "unknown", label: "Unknown", cls: "flag-purple" });
  if (rec.is_present && !rec.exit_time && mins > alertHours * 60)
    flags.push({ key: "stay", label: `Stay Alert ${Math.floor(mins/60)}h`, cls: "flag-danger" });
  if (rec.out_of_hours)
    flags.push({ key: "ooh", label: "Out-of-Hours", cls: "flag-danger" });
  if (rec.is_present && !rec.exit_time && !rec.is_blacklisted)
    flags.push({ key: "inside", label: "On Premises", cls: "flag-blue" });
  return flags;
}
