import { CAN_SPEAK, speak } from '../speech.js';

export default function SpeakButton({ text, className = '' }) {
  if (!CAN_SPEAK) return null;
  return (
    <button
      type="button"
      className={`speak-btn ${className}`}
      title={`Pronounce "${text}"`}
      aria-label={`Pronounce ${text}`}
      onClick={e => {
        e.stopPropagation();
        speak(text);
      }}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
        <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
  );
}
