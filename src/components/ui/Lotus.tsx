/** Small lotus mark (echoes the logo). Used as a separator in the announcement bar and as an ornament in the admin. */
export function Lotus({ width = 22, height = 15, className = "shrink-0" }: { width?: number; height?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 16" width={width} height={height} fill="none" stroke="currentColor" strokeWidth="1" aria-hidden className={className}>
      <path d="M12 1c2.2 2.4 2.2 7.6 0 12-2.2-4.4-2.2-9.6 0-12Z" />
      <path d="M12 13c-1.6-3.6-4.6-6-8-6.4.4 3.8 3.6 6.4 8 6.4Z" />
      <path d="M12 13c1.6-3.6 4.6-6 8-6.4-.4 3.8-3.6 6.4-8 6.4Z" />
    </svg>
  );
}
