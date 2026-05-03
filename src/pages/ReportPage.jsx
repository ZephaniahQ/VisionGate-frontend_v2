/**
 * ReportPage — assigned to: [Member A]
 *
 * ─────────────────────────────────────────────────────────────────
 * YOUR SANDBOX: Build everything inside <ReportPageContent />.
 * Do NOT modify anything outside this file.
 * Do NOT touch App.jsx, TopBar.jsx, or DashboardPage.jsx.
 * ─────────────────────────────────────────────────────────────────
 *
 * What this page should do (from the brief):
 *   - Show two export buttons: one for the employee CSV report,
 *     one for the visitor CSV report.
 *   - Trigger the Supabase Edge Function `report` on click:
 *       GET {SUPABASE_URL}/functions/v1/report?date=YYYY-MM-DD&type=employee
 *       GET {SUPABASE_URL}/functions/v1/report?date=YYYY-MM-DD&type=visitor
 *   - If you get a 401, append &apikey=SUPABASE_ANON_KEY to the URL.
 *   - Optionally show a date picker so the user can export past days.
 *   - Optionally show a preview table of today's data before exporting.
 *
 * Supabase credentials (anon key, read-only):
 *   URL  : https://ekenepjdjhsutkwbvcch.supabase.co
 *   KEY  : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrZW5lcGpkamhzdXRrd2J2Y2NoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1ODIyMDEsImV4cCI6MjA5MDE1ODIwMX0.iFXYc6uTyHJZltboGAQtBn0qyDPzRZHkLHxYfDQBZwg
 *
 * Tables you can read:
 *   - daily_records  (main source — has display_name, department, times, flags)
 *   - employees      (for employee metadata if needed)
 *   - visitors       (for visitor metadata if needed)
 *
 * Import supabase client like this:
 *   import { createClient } from '@supabase/supabase-js'
 *   const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
 *
 * Use your own local styles or add classes to global.css.
 * Ask the lead dev before touching any shared component or style.
 */

// ─── You may add your own imports below this line ────────────────

// ─────────────────────────────────────────────────────────────────

function ReportPageContent() {
  // TODO: implement report generation UI here

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Reports</h2>
      <p style={{ opacity: 0.5 }}>
        [ Report page — implement export buttons and preview table here ]
      </p>
    </div>
  );
}

// ── Do not edit below this line ───────────────────────────────────
export default function ReportPage() {
  return <ReportPageContent />;
}
