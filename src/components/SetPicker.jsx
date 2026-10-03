// Chip row for choosing "All" or a single letter.
export default function SetPicker({ sets, value, onChange, allLabel = 'All' }) {
  return (
    <div className="set-picker">
      {sets.map(x => (
        <button
          key={x.id}
          className={`set-chip ${x.id === value ? 'active' : ''}`}
          onClick={() => onChange(x.id)}
          aria-pressed={x.id === value}
        >
          <span>{x.id === 'all' ? allLabel : x.id.toUpperCase()}</span>
          <span className="count">{x.words.length}</span>
        </button>
      ))}
    </div>
  );
}
