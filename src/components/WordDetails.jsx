import SpeakButton from './SpeakButton.jsx';

export default function WordDetails({ word, showTitle = true }) {
  return (
    <div className="details">
      {showTitle && <h3 className="word-title">{word.word} <SpeakButton text={word.word} /></h3>}
      <p><span className="label">Meaning:</span> {word.meaning}</p>
      {word.trick && <p><span className="label">Trick:</span> {word.trick}</p>}
      {word.usage && (
        <div className="usage">
          <p>
            <span className="label">How to use:</span>{' '}
            {word.usage.pos && <span className="pos">{word.usage.pos}</span>}{' '}
            <span className="pattern">{word.usage.pattern}</span>
          </p>
          {word.usage.partners.length > 0 && (
            <div className="partners">
              {word.usage.partners.map(p => <span key={p} className="partner">{p}</span>)}
            </div>
          )}
        </div>
      )}
      {word.examples.length > 0 && (
        <ul>{word.examples.map((e, i) => <li key={i}>{e}</li>)}</ul>
      )}
    </div>
  );
}
