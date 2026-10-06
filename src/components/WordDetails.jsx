import SpeakButton from './SpeakButton.jsx';
import RarityBadge from './RarityBadge.jsx';

// Everything about one word, as stacked sections: memory line, meaning (+ Hindi),
// trick, how to use, examples (with the word highlighted).
export default function WordDetails({ word, showTitle = true }) {
  return (
    <div className="details">
      {showTitle && <h3 className="word-title">{word.word} <SpeakButton text={word.word} /></h3>}

      {word.memory && (
        <div className="d-memory" title="Memory line: say it aloud with the word">
          <span className="d-kicker">🧠 Memory line</span>
          <span className="d-memory-text">{word.memory}</span>
        </div>
      )}

      <section className="d-block">
        <div className="d-head">
          <span className="d-kicker">Meaning</span>
          <RarityBadge word={word} />
        </div>
        <p className="d-meaning">{word.meaning}</p>
        {word.hindi && (
          <p className="d-hindi" lang="hi"><span className="d-hindi-tag">हिंदी</span>{word.hindi}</p>
        )}
      </section>

      {word.trick && (
        <section className="d-trick">
          <span className="d-trick-icon" aria-hidden="true">💡</span>
          <p>{word.trick}</p>
        </section>
      )}

      {word.usage && (
        <section className="d-block">
          <div className="d-head">
            <span className="d-kicker">How to use</span>
            {word.usage.pos && <span className="d-pos">{word.usage.pos}</span>}
          </div>
          <p className="d-pattern">{word.usage.pattern}</p>
          {word.usage.partners.length > 0 && (
            <div className="d-partners">
              {word.usage.partners.map(p => <span key={p} className="d-partner">{p}</span>)}
            </div>
          )}
        </section>
      )}

      {word.examples.length > 0 && (
        <section className="d-block">
          <div className="d-head"><span className="d-kicker">Examples</span></div>
          <ul className="d-examples">
            {word.examples.map((e, i) => <li key={i}>{highlight(e, word.lower)}</li>)}
          </ul>
        </section>
      )}
    </div>
  );
}

// Wraps the word (or a form of it, e.g. "bawled" for "bawl") in <mark>.
// Each part of the word matches by its first few letters, so endings can differ.
function highlight(sentence, lower) {
  const parts = lower.split(/[\s-]+/).filter(Boolean)
    .map(p => escapeRegExp(p.slice(0, Math.max(3, p.length - 2))) + '[\\w\'’-]*');
  const re = new RegExp(`\\b(${parts.join('[\\s-]+')})`, 'i');
  const m = sentence.match(re);
  if (!m) return sentence;
  return (
    <>
      {sentence.slice(0, m.index)}
      <mark>{m[0]}</mark>
      {sentence.slice(m.index + m[0].length)}
    </>
  );
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
