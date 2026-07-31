import { motion } from 'framer-motion'
import type { CellStatus } from '../types/game'

interface CellProps {
  points: number
  status: CellStatus
  disabled: boolean
  onClick: () => void
  accent: 'honey' | 'violet'
  shape?: 'hex' | 'rect'
}

const ACCENT_CLASSES: Record<'honey' | 'violet', string> = {
  honey: 'bg-honey text-ink-deep',
  violet: 'bg-violet text-gold',
}

const HEX_CLIP = 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'

export function Cell({ points, status, disabled, onClick, accent, shape = 'rect' }: CellProps) {
  const played = status !== 'unplayed'

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled || played}
      initial={false}
      animate={{ scale: played ? 0.9 : 1, opacity: played ? 0.28 : 1 }}
      transition={{ duration: 0.3 }}
      style={shape === 'hex' ? { clipPath: HEX_CLIP } : undefined}
      className={`aspect-[3/2] flex items-center justify-center font-display text-3xl sm:text-4xl tracking-wide ${
        shape === 'hex' ? '' : 'rounded-md border-2 border-ink-deep/40'
      } ${played ? 'bg-ink/70 text-white/20 cursor-default' : `${ACCENT_CLASSES[accent]} hover:brightness-110 cursor-pointer shadow-lg shadow-black/30`}`}
    >
      {played ? '' : `$${points}`}
    </motion.button>
  )
}
