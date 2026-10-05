// Chip row for choosing "All", the repeat list, or a single letter.
export default function SetPicker({ sets, value, onChange }) {
  const label = x => (x.id === 'all' ? 'All' : x.id === 'repeat' ? '🔁 Repeat' : x.id.toUpperCase());
  return (
    <div className="set-picker">
      {sets.map(x => (
        <button
          key={x.id}
          className={`set-chip ${x.id === 'repeat' ? 'repeat' : ''} ${x.id === value ? 'active' : ''}`}
          onClick={() => onChange(x.id)}
          aria-pressed={x.id === value}
        >
          <span>{label(x)}</span>
          <span className="count">{x.words.length}</span>
        </button>
      ))}
    </div>
  );
}
