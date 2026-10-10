export function SoundToggle({ on, onToggle, className = "" }: { on: boolean; onToggle: () => void; className?: string }) {
  return (
    <button
      type="button"
      className={`sound-toggle ${className}`.trim()}
      aria-pressed={on}
      aria-label={on ? "Mute" : "Unmute"}
      title={on ? "Sound: on" : "Sound: muted"}
      onClick={onToggle}
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M11 5 6 9H3v6h3l5 4V5Z" />
        {on ? (
          <>
            <path d="M15.5 8.5a5 5 0 0 1 0 7" />
            <path d="M18.5 5.5a9 9 0 0 1 0 13" />
          </>
        ) : (
          <>
            <path d="m16 9 5 6" />
            <path d="m21 9-5 6" />
          </>
        )}
      </svg>
      <span>{on ? "Sound" : "Muted"}</span>
    </button>
  );
}
