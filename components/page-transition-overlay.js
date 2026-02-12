"use client";

export default function PageTransitionOverlay({ phase }) {
  const isActive = phase !== "idle";
  const phaseClass = phase === "entering" ? "is-entering" : phase === "exiting" ? "is-exiting" : "";

  return (
    <div className={`page-transition-overlay ${isActive ? "is-active" : ""} ${phaseClass}`} aria-hidden={!isActive}>
      <div className="page-transition-layer layer-back" />
      <div className="page-transition-layer layer-mid" />
      <div className="page-transition-layer layer-front" />

      <div className="page-transition-brand">
        <span className="page-transition-badge">LR</span>
        <span className="page-transition-wordmark">
          <strong>LI RILKO</strong>
          <small>IMPORTS</small>
        </span>
      </div>
    </div>
  );
}
