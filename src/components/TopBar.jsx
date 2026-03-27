import { useState, useEffect } from "react";

export default function TopBar({ streamActive, streamError }) {
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="topbar">
      <div className="topbar-left">
        <div className={`header-dot ${streamActive ? "active" : streamError ? "error" : ""}`} />
        <span className="header-title">VisionGate — Live Dashboard</span>
      </div>
      <span className="topbar-time">
        {clock.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
        {"  "}
        {clock.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </span>
    </div>
  );
}
