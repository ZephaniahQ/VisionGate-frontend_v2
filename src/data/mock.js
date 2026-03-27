export const MOCK_EMPLOYEES = [
  {
    id: "EMP_101", name: "Sarah Jenkins", department: "Engineering",
    entry_time: "2026-03-27T08:53:00Z", exit_time: null,
    is_present: true, confidence: 0.98, out_of_hours: false, snapshot_url: null,
  },
  {
    id: "EMP_204", name: "Marcus Webb", department: "Design",
    entry_time: "2026-03-27T09:28:00Z", exit_time: "2026-03-27T15:45:00Z",
    is_present: false, confidence: 0.961, out_of_hours: false, snapshot_url: null,
  },
  {
    id: "EMP_317", name: "Layla Hassan", department: "HR",
    entry_time: "2026-03-27T22:10:00Z", exit_time: null,
    is_present: true, confidence: 0.993, out_of_hours: true, snapshot_url: null,
  },
  {
    id: "EMP_402", name: "Tom Okafor", department: "Finance",
    entry_time: null, exit_time: null,
    is_present: false, confidence: null, out_of_hours: false, snapshot_url: null,
  },
  {
    id: "EMP_519", name: "Nina Petrova", department: "Engineering",
    entry_time: "2026-03-27T08:58:00Z", exit_time: "2026-03-27T17:05:00Z",
    is_present: false, confidence: 0.977, out_of_hours: false, snapshot_url: null,
  },
];

export const MOCK_VISITORS = [
  {
    id: "VIS_001", name: "James Whitfield", purpose: "Meeting – BD",
    person_type: "visitor", entry_time: "2026-03-27T10:05:00Z", exit_time: null,
    is_present: true, is_blacklisted: false, confidence: 0.94, out_of_hours: false, snapshot_url: null,
  },
  {
    id: "VIS_002", name: "Unknown", purpose: "—",
    person_type: "unknown", entry_time: "2026-03-27T11:30:00Z", exit_time: "2026-03-27T12:15:00Z",
    is_present: false, is_blacklisted: false, confidence: 0.71, out_of_hours: false, snapshot_url: null,
  },
  {
    id: "VIS_003", name: "Ravi Mehra", purpose: "Vendor – IT",
    person_type: "visitor", entry_time: "2026-03-27T08:20:00Z", exit_time: null,
    is_present: true, is_blacklisted: false, confidence: 0.989, out_of_hours: false, snapshot_url: null,
  },
  {
    id: "VIS_004", name: "BLACKLISTED", purpose: "—",
    person_type: "blacklist", entry_time: "2026-03-27T13:55:00Z", exit_time: null,
    is_present: true, is_blacklisted: true, confidence: 0.958, out_of_hours: false, snapshot_url: null,
  },
];
