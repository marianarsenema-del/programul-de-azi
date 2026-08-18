export default function StoreChips({ items, currentKey, onSelect }) {
  return (
    <nav className="store-scroll" aria-label="Alege magazinul">
      {items.map(({ key, name }) => (
        <button
          key={key}
          className={`chip ${key === currentKey ? "active" : ""}`}
          aria-pressed={key === currentKey}
          onClick={() => onSelect(key)}
        >
          {name}
        </button>
      ))}
    </nav>
  );
}
