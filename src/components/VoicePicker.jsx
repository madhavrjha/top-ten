import { useEffect, useState } from 'react';
import { CAN_SPEAK, englishVoices, currentVoice, setVoiceName, onVoicesChanged, speak } from '../speech.js';

// Lets you pick which installed voice pronounces words, with a test button.
export default function VoicePicker() {
  const [voices, setVoices] = useState(englishVoices);
  const [selected, setSelected] = useState(() => currentVoice()?.name || '');

  // Browsers load voices asynchronously, so refresh when the list arrives.
  useEffect(() => onVoicesChanged(() => {
    setVoices(englishVoices());
    setSelected(currentVoice()?.name || '');
  }), []);

  if (!CAN_SPEAK || voices.length === 0) return null;

  const choose = name => {
    setVoiceName(name);
    setSelected(name);
    speak('Pronunciation');
  };

  return (
    <div className="voice-picker">
      <label htmlFor="voice">Voice</label>
      <select id="voice" value={selected} onChange={e => choose(e.target.value)}>
        {voices.map(v => (
          <option key={v.name} value={v.name}>
            {v.name.replace(/^Microsoft /, '')} ({v.lang})
          </option>
        ))}
      </select>
      <button type="button" className="ghost" onClick={() => speak('Pronunciation')}>Test</button>
    </div>
  );
}
