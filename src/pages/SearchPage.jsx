import { useState } from "react";


function SearchPageContent() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("");
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");

  const API_URL = "https://ekenepjdjhsutkwbvcch.supabase.co/functions/v1/face-match";

  const callAPI = async (payload, type) => {
    setLoading(true);
    setError("");
    setResults([]);
    setMode(type);

    try {
      

      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrZW5lcGpkamhzdXRrd2J2Y2NoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1ODIyMDEsImV4cCI6MjA5MDE1ODIwMX0.iFXYc6uTyHJZltboGAQtBn0qyDPzRZHkLHxYfDQBZwg",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Request failed");
      }

      if (type === "name") {
        setResults(data.matches || []);
      } else {
        setResults(data.duplicates || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={container}>
      <h1 style={title}>🔍 Duplicate Face Finder</h1>

      {/* SEARCH BY NAME */}
      <div style={section}>
        <h3 style={sectionTitle}>Search by Name</h3>

        <div style={row}>
          <input
            style={input}
            placeholder="Enter name (e.g. Ali)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <button
            style={btnPrimary}
            disabled={!name || loading}
            onClick={() =>
              callAPI({ mode: "search_person", name }, "name")
            }
          >
            {loading && mode === "name" ? "Searching..." : "Search"}
          </button>
        </div>

        {mode === "name" && (
          <div style={resultsBox}>
            {results.length === 0 && !loading && (
              <p style={empty}>No face found</p>
            )}

            {results.length > 0 && (
              <>
                <p style={count}>
                  {results.length} face(s) found
                </p>

                {results.map((r, i) => (
                  <div key={i} style={card}>
                    <div style={cardTitle}>{r.name}</div>
                    <div style={cardSub}>
                      Department: {r.department || "N/A"}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* ALL DUPLICATES */}
      <div style={section}>
        <h3 style={sectionTitle}>Find All Duplicates</h3>

        <button
          style={btnSecondary}
          disabled={loading}
          onClick={() =>
            callAPI({ mode: "duplicates" }, "all")
          }
        >
          {loading && mode === "all" ? "Processing..." : "Find All"}
        </button>

        {mode === "all" && (
          <div style={resultsBox}>
            {results.length === 0 && !loading && (
              <p style={empty}>No duplicates found</p>
            )}

            {results.length > 0 && (
              <>
                <p style={count}>
                  {results.length} duplicate pair(s)
                </p>

                {results.map((r, i) => (
                  <div key={i} style={card}>
                    <div style={pair}>
                      <span>{r.person1}</span>
                      <span style={arrow}>↔</span>
                      <span>{r.person2}</span>
                    </div>

                    <div style={cardSub}>
                      {r.department1 || "N/A"} •{" "}
                      {r.department2 || "N/A"}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* STATUS */}
      {loading && <p style={loadingText}>Processing...</p>}
      {error && <p style={errorText}>{error}</p>}
    </div>
  );
}

/* ================= STYLES ================= */

const container = {
  padding: "2rem",
  maxWidth: "900px",
  margin: "auto",
  fontFamily: "sans-serif",
};

const title = {
  textAlign: "center",
  marginBottom: "30px",
};

const section = {
  marginBottom: "30px",
  padding: "20px",
  borderRadius: "12px",
  background: "#f8fafc",
  boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
};

const sectionTitle = {
  marginBottom: "15px",
};

const row = {
  display: "flex",
  gap: "10px",
};

const input = {
  flex: 1,
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #ccc",
};

const btnPrimary = {
  padding: "10px 16px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
};

const btnSecondary = {
  padding: "10px 16px",
  background: "#111827",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
};

const resultsBox = {
  marginTop: "15px",
};

const count = {
  fontWeight: "bold",
  marginBottom: "10px",
};

const empty = {
  opacity: 0.6,
};

const card = {
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #e5e7eb",
  marginBottom: "10px",
  background: "white",
};

const cardTitle = {
  fontWeight: "bold",
  fontSize: "16px",
};

const cardSub = {
  fontSize: "14px",
  color: "#555",
};

const pair = {
  display: "flex",
  justifyContent: "space-between",
  fontWeight: "bold",
};

const arrow = {
  margin: "0 10px",
};

const loadingText = {
  textAlign: "center",
  marginTop: "10px",
};

const errorText = {
  color: "red",
  textAlign: "center",
  marginTop: "10px",
};
// ── Do not edit below this line ───────────────────────────────────
export default function SearchPage() {
  return <SearchPageContent />;
}
