export default function HolidayList({ holidays }) {
  if (!holidays?.length) {
    return (
      <div className="holiday-card">
        <div className="holiday-row">
          <span className="holiday-label">Fără program special momentan</span>
        </div>
      </div>
    );
  }

  return (
    <div className="holiday-card">
      {holidays.map((h, i) => (
        <div className="holiday-row" key={i}>
          <span className="holiday-label">{h.label}</span>
          <span className={`holiday-hours ${h.hours ? "" : "closed"}`}>
            {h.hours ? `${h.hours[0]} – ${h.hours[1]}` : "Închis"}
          </span>
        </div>
      ))}
    </div>
  );
}
