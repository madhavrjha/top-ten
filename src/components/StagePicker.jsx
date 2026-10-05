import { useEffect, useRef, useState } from 'react';
import { STAGES, stageInfo } from '../stages.js';

// Choose a word's stage. Full: a row of five chips (keys 1–5).
// Compact (Browse rows): a pill showing the stage that opens a small menu.
export default function StagePicker({ stage, onChange, compact = false, title, showKeys = false }) {
  if (compact) return <StageMenu stage={stage} onChange={onChange} title={title} />;
  return (
    <div className="stage-picker" role="group" aria-label="Stage">
      {STAGES.map((s, i) => (
        <button
          key={s.id}
          type="button"
          className={`set-chip ${s.id === stage ? 'active' : ''}`}
          aria-pressed={s.id === stage}
          title={s.hint}
          onClick={() => onChange(s.id)}
        >
          <span aria-hidden="true">{s.icon}</span> {s.label}
          {showKeys && <kbd>{i + 1}</kbd>}
        </button>
      ))}
    </div>
  );
}

function StageMenu({ stage, onChange, title }) {
  const [open, setOpen] = useState(false);
  const [up, setUp] = useState(false); // open upwards when there's no room below
  const ref = useRef(null);
  const info = stageInfo(stage);

  // Close on a click outside or Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = e => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onKey = e => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = e => {
    e.stopPropagation();
    if (!open) setUp(ref.current.getBoundingClientRect().bottom + 300 > window.innerHeight);
    setOpen(o => !o);
  };

  const choose = id => {
    onChange(id);
    setOpen(false);
  };

  return (
    <div className="stage-menu" ref={ref}>
      <button
        type="button"
        className={`stage-pill stage-${stage}`}
        title={title}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
      >
        <span aria-hidden="true">{info.icon}</span>
        <span className="stage-pill-label">{info.label}</span>
      </button>
      {open && (
        <div className={`stage-pop ${up ? 'up' : ''}`} role="menu">
          {STAGES.map(s => (
            <button
              key={s.id}
              type="button"
              role="menuitemradio"
              aria-checked={s.id === stage}
              className={s.id === stage ? 'current' : ''}
              onClick={e => { e.stopPropagation(); choose(s.id); }}
            >
              <span className="stage-pop-icon" aria-hidden="true">{s.icon}</span>
              <span className="stage-pop-text">
                <strong>{s.label}</strong>
                <span className="muted">{s.hint}</span>
              </span>
              {s.id === stage && <span className="stage-pop-check" aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
