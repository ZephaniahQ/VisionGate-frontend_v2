import { useState, useCallback } from "react";

const API_URL =
  "https://ekenepjdjhsutkwbvcch.supabase.co/functions/v1/face-match";
const AUTH_TOKEN =
  "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrZW5lcGpkamhzdXRrd2J2Y2NoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1ODIyMDEsImV4cCI6MjA5MDE1ODIwMX0.iFXYc6uTyHJZltboGAQtBn0qyDPzRZHkLHxYfDQBZwg";

// ─── API helper ───────────────────────────────────────────────────────────────

async function callAPI(payload) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: AUTH_TOKEN,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// ─── Similarity badge ─────────────────────────────────────────────────────────

function SimilarityBadge({ similarity }) {
  const pct = Math.round(similarity * 100);
  const level = pct >= 85 ? "high" : pct >= 70 ? "med" : "low";
  const colors = {
    high: { bg: "#FEF2F2", text: "#991B1B", border: "#FECACA" },
    med:  { bg: "#FFFBEB", text: "#92400E", border: "#FDE68A" },
    low:  { bg: "#F0FDF4", text: "#166534", border: "#BBF7D0" },
  };
  const c = colors[level];
  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 600,
        padding: "3px 10px",
        borderRadius: 20,
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
        letterSpacing: "0.02em",
        fontFamily: "'DM Mono', monospace",
        whiteSpace: "nowrap",
      }}
    >
      {pct}% match
    </span>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, size = 40 }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => (w[0] ? w[0].toUpperCase() : ""))
    .join("");

  const hue = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  const bg = `hsl(${hue}, 45%, 88%)`;
  const fg = `hsl(${hue}, 45%, 28%)`;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
        color: fg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: size * 0.38,
        fontFamily: "'DM Sans', sans-serif",
        flexShrink: 0,
        letterSpacing: "0.02em",
      }}
    >
      {initials}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ icon, message }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        padding: "32px 0",
        color: "#9CA3AF",
      }}
    >
      <span style={{ fontSize: 32 }}>{icon}</span>
      <span style={{ fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
        {message}
      </span>
    </div>
  );
}

// ─── Main content ─────────────────────────────────────────────────────────────

function SearchPageContent() {
  const [name, setName]                   = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [allLoading, setAllLoading]       = useState(false);
  const [searchResult, setSearchResult]   = useState(null);
  const [searchError, setSearchError]     = useState("");
  const [dupResult, setDupResult]         = useState(null);
  const [dupError, setDupError]           = useState("");
  const [activeTab, setActiveTab]         = useState("search");

  const handleSearch = useCallback(async () => {
    if (!name.trim()) return;
    setSearchLoading(true);
    setSearchError("");
    setSearchResult(null);
    try {
      const data = await callAPI({ mode: "search_person", name: name.trim() });
      setSearchResult(data);
    } catch (err) {
      setSearchError(err.message);
    } finally {
      setSearchLoading(false);
    }
  }, [name]);

  const handleFindAll = useCallback(async () => {
    setAllLoading(true);
    setDupError("");
    setDupResult(null);
    try {
      const data = await callAPI({ mode: "duplicates" });
      setDupResult(data);
    } catch (err) {
      setDupError(err.message);
    } finally {
      setAllLoading(false);
    }
  }, []);

  return (
    <>
      {/* Google Fonts + all styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&family=Syne:wght@700;800&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body { background: #F7F6F3; min-height: 100vh; }

        .page-root {
          min-height: 100vh;
          background: #F7F6F3;
          padding: 48px 24px 80px;
          font-family: 'DM Sans', sans-serif;
        }
        .inner { max-width: 680px; margin: 0 auto; }

        /* Header */
        .header { margin-bottom: 40px; text-align: center; }
        .header-eyebrow {
          display: inline-block;
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #6B6B6B;
          background: #ECEAE5;
          padding: 4px 12px;
          border-radius: 20px;
          margin-bottom: 14px;
        }
        .header-title {
          font-family: 'Syne', sans-serif;
          font-size: 38px;
          font-weight: 800;
          color: #111;
          line-height: 1.1;
          letter-spacing: -0.02em;
          margin-bottom: 10px;
        }
        .header-sub { font-size: 14px; color: #7A7A7A; line-height: 1.6; }

        /* Tabs */
        .tabs {
          display: flex;
          background: #ECEAE5;
          border-radius: 14px;
          padding: 4px;
          margin-bottom: 28px;
          gap: 4px;
        }
        .tab-btn {
          flex: 1;
          padding: 10px 16px;
          border: none;
          border-radius: 10px;
          background: transparent;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: #7A7A7A;
          cursor: pointer;
          transition: all 0.18s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
        }
        .tab-btn.active {
          background: #fff;
          color: #111;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08), 0 0 0 0.5px rgba(0,0,0,0.06);
        }
        .tab-dot { width: 7px; height: 7px; border-radius: 50%; }

        /* Card */
        .card {
          background: #fff;
          border-radius: 20px;
          border: 0.5px solid #E2E0DB;
          padding: 28px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }

        /* Input row */
        .input-row { display: flex; gap: 10px; margin-bottom: 24px; }
        .search-input {
          flex: 1;
          height: 44px;
          padding: 0 16px;
          border-radius: 12px;
          border: 1.5px solid #E2E0DB;
          background: #FAFAF8;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: #111;
          outline: none;
          transition: border-color 0.15s;
        }
        .search-input::placeholder { color: #BBBBB5; }
        .search-input:focus { border-color: #111; background: #fff; }

        /* Buttons */
        .btn-primary {
          height: 44px;
          padding: 0 22px;
          border-radius: 12px;
          border: none;
          background: #111;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .btn-primary:hover:not(:disabled) { background: #2A2A2A; }
        .btn-primary:active:not(:disabled) { transform: scale(0.98); }
        .btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }

        .btn-full {
          width: 100%;
          height: 48px;
          border-radius: 14px;
          border: none;
          background: #111;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        .btn-full:hover:not(:disabled) { background: #2A2A2A; }
        .btn-full:active:not(:disabled) { transform: scale(0.99); }
        .btn-full:disabled { opacity: 0.45; cursor: not-allowed; }

        /* Section label */
        .section-label {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #9CA3AF;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .section-label::after {
          content: '';
          flex: 1;
          height: 0.5px;
          background: #E2E0DB;
        }

        /* Searched person pill */
        .searched-pill {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: #F7F6F3;
          border: 0.5px solid #E2E0DB;
          border-radius: 12px;
          padding: 8px 14px 8px 8px;
          margin-bottom: 20px;
          width: 100%;
        }
        .searched-info { display: flex; flex-direction: column; gap: 1px; flex: 1; min-width: 0; }
        .searched-name { font-size: 13px; font-weight: 600; color: #111; line-height: 1.3; }
        .searched-meta { font-family: 'DM Mono', monospace; font-size: 11px; color: #9CA3AF; }
        .searched-label {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          background: #111;
          color: #fff;
          padding: 2px 8px;
          border-radius: 6px;
          flex-shrink: 0;
        }

        /* Match cards */
        .match-list { display: flex; flex-direction: column; gap: 8px; }
        .match-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          background: #FAFAF8;
          border: 0.5px solid #E8E6E1;
          border-radius: 14px;
          transition: border-color 0.15s, background 0.15s;
        }
        .match-card:hover { background: #F4F3EF; border-color: #D4D2CD; }
        .match-info { flex: 1; min-width: 0; }
        .match-name {
          font-size: 14px;
          font-weight: 600;
          color: #111;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .match-dept {
          font-size: 12px;
          color: #9CA3AF;
          margin-top: 2px;
          font-family: 'DM Mono', monospace;
        }

        /* Duplicate pair cards */
        .dup-card {
          padding: 14px 16px;
          background: #FAFAF8;
          border: 0.5px solid #E8E6E1;
          border-radius: 14px;
          margin-bottom: 8px;
          transition: border-color 0.15s, background 0.15s;
        }
        .dup-card:hover { background: #F4F3EF; border-color: #D4D2CD; }
        .dup-pair { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .dup-person { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
        .dup-name {
          font-size: 13px;
          font-weight: 600;
          color: #111;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .dup-dept {
          font-size: 11px;
          color: #9CA3AF;
          font-family: 'DM Mono', monospace;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .dup-arrow { font-size: 16px; color: #D1D5DB; flex-shrink: 0; }
        .dup-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 8px;
          border-top: 0.5px solid #ECEAE5;
        }
        .dup-footer-label {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          color: #BBBBB5;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        /* Stats row */
        .stats-row { display: flex; gap: 10px; margin-bottom: 20px; }
        .stat-chip {
          flex: 1;
          background: #F7F6F3;
          border: 0.5px solid #E2E0DB;
          border-radius: 12px;
          padding: 12px 14px;
          text-align: center;
        }
        .stat-num {
          font-family: 'Syne', sans-serif;
          font-size: 24px;
          font-weight: 700;
          color: #111;
          line-height: 1;
          margin-bottom: 4px;
        }
        .stat-label {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #9CA3AF;
        }

        /* Error */
        .error-box {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 14px;
          background: #FFF5F5;
          border: 0.5px solid #FEC5C5;
          border-radius: 12px;
          font-size: 13px;
          color: #B91C1C;
          font-family: 'DM Mono', monospace;
          word-break: break-word;
        }

        /* Spinner */
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }

        /* Description */
        .desc-text {
          font-size: 13px;
          color: #9CA3AF;
          line-height: 1.6;
          margin-bottom: 20px;
        }
      `}</style>

      <div className="page-root">
        <div className="inner">

          {/* ── Header ── */}
          <div className="header">
            <div className="header-eyebrow">Face Recognition System</div>
            <h1 className="header-title">Duplicate Face Finder</h1>
            <p className="header-sub">
              Search for a specific person or scan the entire database
              <br />
              to detect duplicate face embeddings.
            </p>
          </div>

          {/* ── Tabs ── */}
          <div className="tabs">
            <button
              className={`tab-btn ${activeTab === "search" ? "active" : ""}`}
              onClick={() => setActiveTab("search")}
            >
              <span
                className="tab-dot"
                style={{ background: activeTab === "search" ? "#4F46E5" : "#D1D5DB" }}
              />
              Search by Name
            </button>
            <button
              className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              <span
                className="tab-dot"
                style={{ background: activeTab === "all" ? "#DC2626" : "#D1D5DB" }}
              />
              Find All Duplicates
            </button>
          </div>

          {/* ── Tab: Search by Name ── */}
          {activeTab === "search" && (
            <div className="card">
              <p className="desc-text">
                Enter a name to find all employees whose face embedding is
                similar to that person's stored face vector.
              </p>

              <div className="input-row">
                <input
                  className="search-input"
                  placeholder="e.g. Ali, Sarah Khan, John…"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <button
                  className="btn-primary"
                  disabled={!name.trim() || searchLoading}
                  onClick={handleSearch}
                >
                  {searchLoading ? (
                    <>
                      <span className="spinner" />
                      Searching
                    </>
                  ) : (
                    "Search"
                  )}
                </button>
              </div>

              {searchError && (
                <div className="error-box" style={{ marginBottom: 16 }}>
                  ⚠ {searchError}
                </div>
              )}

              {searchResult && (
                <>
                  <div className="searched-pill">
                    <Avatar name={searchResult.searched_person.name} size={34} />
                    <div className="searched-info">
                      <span className="searched-name">
                        {searchResult.searched_person.name}
                      </span>
                      <span className="searched-meta">
                        {searchResult.searched_person.department || "No department"}
                      </span>
                    </div>
                    <span className="searched-label">Searched</span>
                  </div>

                  {searchResult.total === 0 ? (
                    <EmptyState
                      icon="🔍"
                      message="No duplicate faces found for this person"
                    />
                  ) : (
                    <>
                      <div className="section-label">
                        {searchResult.total} duplicate
                        {searchResult.total !== 1 ? "s" : ""} found
                      </div>
                      <div className="match-list">
                        {searchResult.matches.map((m) => (
                          <div className="match-card" key={m.id}>
                            <Avatar name={m.name} size={38} />
                            <div className="match-info">
                              <div className="match-name">{m.name}</div>
                              <div className="match-dept">
                                {m.department || "No department"}
                              </div>
                            </div>
                            <SimilarityBadge similarity={m.similarity} />
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Tab: Find All Duplicates ── */}
          {activeTab === "all" && (
            <div className="card">
              <p className="desc-text">
                Compares every face embedding pair in the database and returns
                all pairs with similarity ≥ 60%. Sorted by highest similarity first.
              </p>

              <button
                className="btn-full"
                disabled={allLoading}
                onClick={handleFindAll}
              >
                {allLoading ? (
                  <>
                    <span className="spinner" />
                    Scanning database…
                  </>
                ) : (
                  "Scan All Faces"
                )}
              </button>

              {dupError && (
                <div className="error-box" style={{ marginTop: 16 }}>
                  ⚠ {dupError}
                </div>
              )}

              {dupResult && (
                <div style={{ marginTop: 24 }}>
                  <div className="stats-row">
                    <div className="stat-chip">
                      <div className="stat-num">{dupResult.total_checked}</div>
                      <div className="stat-label">Faces Checked</div>
                    </div>
                    <div className="stat-chip">
                      <div
                        className="stat-num"
                        style={{ color: dupResult.total_duplicates > 0 ? "#DC2626" : "#111" }}
                      >
                        {dupResult.total_duplicates}
                      </div>
                      <div className="stat-label">Duplicate Pairs</div>
                    </div>
                  </div>

                  {dupResult.total_duplicates === 0 ? (
                    <EmptyState
                      icon="✅"
                      message="No duplicate faces found in the database"
                    />
                  ) : (
                    <>
                      <div className="section-label">
                        {dupResult.total_duplicates} pair
                        {dupResult.total_duplicates !== 1 ? "s" : ""} detected
                      </div>

                      {dupResult.duplicates.map((d, i) => (
                        <div
                          className="dup-card"
                          key={`${d.person1_id}-${d.person2_id}-${i}`}
                        >
                          <div className="dup-pair">
                            <div className="dup-person">
                              <Avatar name={d.person1} size={34} />
                              <div style={{ minWidth: 0 }}>
                                <div className="dup-name">{d.person1}</div>
                                <div className="dup-dept">{d.department1}</div>
                              </div>
                            </div>

                            <span className="dup-arrow">↔</span>

                            <div className="dup-person">
                              <Avatar name={d.person2} size={34} />
                              <div style={{ minWidth: 0 }}>
                                <div className="dup-name">{d.person2}</div>
                                <div className="dup-dept">{d.department2}</div>
                              </div>
                            </div>
                          </div>

                          <div className="dup-footer">
                            <span className="dup-footer-label">Face similarity</span>
                            <SimilarityBadge similarity={d.similarity} />
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
}

// ── Do not edit below this line ───────────────────────────────────
export default function SearchPage() {
  return <SearchPageContent />;
}
