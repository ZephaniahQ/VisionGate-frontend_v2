/**
 * SearchPage — assigned to: [Member B]
 *
 * ─────────────────────────────────────────────────────────────────
 * YOUR SANDBOX: Build everything inside <SearchPageContent />.
 * Do NOT modify anything outside this file.
 * Do NOT touch App.jsx, TopBar.jsx, or DashboardPage.jsx.
 * ─────────────────────────────────────────────────────────────────
 *
 * What this page should do (from the brief):
 *   - Let the user search across `daily_records` and/or `employees`
 *     and `visitors` tables by name, department, date range, or person_type.
 *   - Display results in a table or card list with relevant fields:
 *       display_name, department, first_seen_at, last_seen_at,
 *       confidence, is_late, out_of_hours, stay_minutes, snapshot_url.
 *   - Optionally filter by person_type: employee | visitor | unknown | blocked.
 *   - Optionally filter by date range (record_date column).
 *
 * Supabase credentials (anon key, read-only):
 *   URL  : https://ekenepjdjhsutkwbvcch.supabase.co
 *   KEY  : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrZW5lcGpkamhzdXRrd2J2Y2NoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1ODIyMDEsImV4cCI6MjA5MDE1ODIwMX0.iFXYc6uTyHJZltboGAQtBn0qyDPzRZHkLHxYfDQBZwg
 *
 * Example query to get you started:
 *
 *   import { createClient } from '@supabase/supabase-js'
 *   const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
 *
 *   const { data } = await supabase
 *     .from('daily_records')
 *     .select('*')
 *     .ilike('display_name', `%${searchTerm}%`)   // name search
 *     .eq('record_date', selectedDate)             // date filter
 *     .order('first_seen_at', { ascending: false })
 *
 * Tables you can read:
 *   - daily_records  (primary search target)
 *   - employees      (for department / scheduled_arrival metadata)
 *   - visitors       (for purpose metadata)
 *
 * Use your own local styles or add classes to global.css.
 * Ask the lead dev before touching any shared component or style.
 */

// ─── You may add your own imports below this line ────────────────

// ─────────────────────────────────────────────────────────────────

function SearchPageContent() {
  // TODO: implement search UI here

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Database Search</h2>
      <p style={{ opacity: 0.5 }}>
        [ Search page — implement search input, filters, and results table here ]
      </p>
    </div>
  );
}

// ── Do not edit below this line ───────────────────────────────────
export default function SearchPage() {
  return <SearchPageContent />;
}
