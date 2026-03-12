"use client";

export default function PageTransitionOverlay({ phase, styleVars }) {
  const isActive = phase !== "idle";
  const phaseClass = phase === "entering" ? "is-entering" : phase === "exiting" ? "is-exiting" : "";

  return (
    <div
      className={`page-transition-overlay ${isActive ? "is-active" : ""} ${phaseClass}`}
      aria-hidden={!isActive}
      style={styleVars}
    >
      <div className="page-transition-layer layer-back" />
      <div className="page-transition-layer layer-mid" />
      <div className="page-transition-layer layer-front" />

      <div className="page-transition-brand">
        <img src="/logo-li-rilko-imports.png" alt="Li Rilko Imports" className="page-transition-logo" />
      </div>
    </div>
  );
}
