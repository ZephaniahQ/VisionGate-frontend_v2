import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1"  x2="12" y2="3"/>  <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22"  x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>   <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

function BugIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 2l1.5 1.5"/><path d="M16 2l-1.5 1.5"/>
      <path d="M9 7h6a2 2 0 0 1 2 2v6a5 5 0 0 1-10 0V9a2 2 0 0 1 2-2z"/>
      <path d="M3 11h3m12 0h3M3 16h3m12 0h3"/>
      <path d="M9 3.5A2.5 2.5 0 0 1 12 1a2.5 2.5 0 0 1 3 2.5"/>
    </svg>
  );
}

export default function TopBar({
  streamActive,
  streamError,
  theme,
  onThemeToggle,
  debugOpen,
  onDebugToggle,
}) {
  const [clock, setClock] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="topbar">
      {/* Row 1: identity bar */}
      <div className="topbar-main">
        <div className="topbar-left">
          <div className={`header-dot ${streamActive ? "active" : streamError ? "error" : ""}`} />
          <span className="header-title">VisionGate</span>
        </div>

        <div className="topbar-right">
          <span className="topbar-time">
            {clock.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            {"  "}
            {clock.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
          <button
            className="topbar-btn"
            onClick={onThemeToggle}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
          <button
            className={`topbar-btn ${debugOpen ? "active" : ""}`}
            onClick={onDebugToggle}
            title="Debug panel"
          >
            <BugIcon />
          </button>
        </div>
      </div>

      {/* Row 2: tab strip — sits flush on the bottom border of the topbar */}
      <nav className="topbar-tabs">
        <NavLink to="/" end className={({ isActive }) => `topbar-tab${isActive ? " topbar-tab--active" : ""}`}>
          Dashboard
        </NavLink>
        <NavLink to="/report" className={({ isActive }) => `topbar-tab${isActive ? " topbar-tab--active" : ""}`}>
          Reports
        </NavLink>
        <NavLink to="/search" className={({ isActive }) => `topbar-tab${isActive ? " topbar-tab--active" : ""}`}>
          Search
        </NavLink>
      </nav>
    </div>
  );
}
