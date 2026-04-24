export function TopBar() {
  return (
    <header className="top-bar">
      <div className="traffic-lights" aria-hidden="true">
        <span className="traffic-light traffic-light-red" />
        <span className="traffic-light traffic-light-yellow" />
        <span className="traffic-light traffic-light-green" />
      </div>
    </header>
  );
}
