export default function StatusCard({ label, status, badgeText }) {
  const loading = !status;
  const isOpen = status?.open;

  return (
    <section className={`status-card ${loading ? "" : isOpen ? "is-open" : "is-closed"}`}>
      <div className="store-name">{label}</div>
      <div className="status-text">{loading ? "—" : isOpen ? "DESCHIS ACUM" : "ÎNCHIS ACUM"}</div>
      <div className="status-sub">{loading ? "Se calculează programul..." : status.sub}</div>
      {badgeText && (
        <div className="status-badge">
          <span className="dotw"></span>
          <span>{badgeText}</span>
        </div>
      )}
    </section>
  );
}
