export default function SecondaryBadge({ label, status }) {
  const loading = !status;
  const isOpen = status?.open;

  return (
    <div className={`secondary-badge ${loading ? "" : isOpen ? "sb-open" : "sb-closed"}`}>
      <span className="sb-dot"></span>
      <div className="sb-text">
        <span className="sb-label">{label}</span>
        <span className="sb-sub">{loading ? "Se calculează..." : status.sub}</span>
      </div>
      <span className="sb-state">{loading ? "…" : isOpen ? "Deschis" : "Închis"}</span>
    </div>
  );
}
