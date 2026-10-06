import { rarityInfo } from '../rarity.js';

// How common a word is: 🟢 Common / 🟡 Medium / 🔴 Rare. `compact` shows just the dot.
export default function RarityBadge({ word, compact = false }) {
  const info = rarityInfo(word.rarity);
  if (!info) return null;
  const title = `${info.label} word (frequency ${word.freq} / 7). ${info.hint}`;
  return (
    <span className={`rarity rarity-${info.id} ${compact ? 'compact' : ''}`} title={title}>
      <span aria-hidden="true">{info.icon}</span>
      {compact ? <span className="sr-only">{info.label}</span> : ` ${info.label}`}
    </span>
  );
}
