interface SparkleIconProps {
  size: number
  color: string
}

// Shared 4-point sparkle glyph used by any particle effect that wants a
// crisp, recolorable star (unlike emoji, which can't be recolored via CSS).
export function SparkleIcon({ size, color }: SparkleIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ filter: `drop-shadow(0 0 3px ${color})` }}
    >
      <path
        d="M12 0 L14.6 9.4 L24 12 L14.6 14.6 L12 24 L9.4 14.6 L0 12 L9.4 9.4 Z"
        fill={color}
      />
    </svg>
  )
}
