export default function WordDetails({ word, showTitle = true }) {
  return (
    <div className="details">
      {showTitle && <h3>{word.word}</h3>}
      <p><span className="label">Meaning:</span> {word.meaning}</p>
      {word.trick && <p><span className="label">Trick:</span> {word.trick}</p>}
      {word.examples.length > 0 && (
        <ul>{word.examples.map((e, i) => <li key={i}>{e}</li>)}</ul>
      )}
    </div>
  );
}
