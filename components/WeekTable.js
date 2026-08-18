export default function WeekTable({ weekly, dayNames, todayIdx }) {
  return (
    <div className="schedule-card">
      <table>
        <thead>
          <tr>
            <th>Zi</th>
            <th style={{ textAlign: "right" }}>Interval orar</th>
          </tr>
        </thead>
        <tbody>
          {weekly.map((w, i) => (
            <tr key={i} className={i === todayIdx ? "today" : ""}>
              <td className="day-cell">{dayNames[i]}</td>
              <td className="hours-cell">{w ? `${w.open} – ${w.close}` : "Închis"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
