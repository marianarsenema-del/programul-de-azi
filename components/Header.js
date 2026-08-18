export default function Header({ clock }) {
  return (
    <header>
      <div className="wrap header-row">
        <div className="brand">
          Programul<span>DeAzi</span>
        </div>
        <div className="live-clock">
          <span className="dot"></span>
          <span>{clock || "--:--:--"}</span>
        </div>
      </div>
    </header>
  );
}
