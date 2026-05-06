import { useEffect } from "react";

// ── Lightbox Modal ─────────────────────────────────────────────
export function SnapshotModal({ url, name, onClose }) {
  // Close on Escape key
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!url) return null;

  return (
    <div className="snapshot-backdrop" onClick={onClose}>
      <div className="snapshot-modal" onClick={e => e.stopPropagation()}>
        <img src={url} alt={name || "Snapshot"} className="snapshot-modal-img" />
        <div className="snapshot-modal-label">
          <span className="snapshot-modal-name">{name || "Unknown"}</span>
          <button className="snapshot-modal-close" onClick={onClose} title="Close (Esc)">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Clickable Snap Cell ────────────────────────────────────────
export default function SnapCell({ url, name, onExpand }) {
  return (
    <div className="snap-cell">
      {url ? (
        <img
          src={url}
          alt={name}
          className="snap-img snap-img--clickable"
          onClick={() => onExpand(url, name)}
          title="Click to expand"
        />
      ) : (
        <div className="snap-placeholder">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
        </div>
      )}
    </div>
  );
}
