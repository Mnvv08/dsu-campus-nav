import { TURN_DEG } from '../lib/dirText';

// The icon beside each direction: a start ring, a finish flag, or an
// arrow turned the way the walker turns.
export default function StepIcon({ step, size = 'md' }) {
  if (step.kind === 'depart') {
    return (
      <span className={`stepicon stepicon-${size} stepicon-start`} aria-hidden="true">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" /></svg>
      </span>
    );
  }
  if (step.kind === 'arrive') {
    return (
      <span className={`stepicon stepicon-${size} stepicon-end`} aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M6 3v18h2v-7h9l-2-4 2-4H8V3z" /></svg>
      </span>
    );
  }
  const deg = TURN_DEG[step.turn ?? 'straight'] ?? 0;
  return (
    <span className={`stepicon stepicon-${size}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" style={{ transform: `rotate(${deg}deg)` }}>
        <path d="M12 3 5 11h4.5v10h5V11H19z" />
      </svg>
    </span>
  );
}
