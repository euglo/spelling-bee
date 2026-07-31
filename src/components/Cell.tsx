import { motion } from 'framer-motion'
import type { CellStatus } from '../types/game'

interface CellProps {
  points: number
  status: CellStatus
  disabled: boolean
  onClick: () => void
  accent: 'honey' | 'violet'
  shape?: 'hex' | 'rect'
  isLastResolved?: boolean
  onUndo?: () => void
}

const ACCENT_CLASSES: Record<'honey' | 'violet', string> = {
  honey: 'bg-ink text-yellow',
  violet: 'bg-violet text-yellow',
}

const ACCENT_RING: Record<'honey' | 'violet', string> = {
  honey: 'ring-ink/60',
  violet: 'ring-violet/70',
}

const HEX_CLIP = 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'

export function Cell({
  points,
  status,
  disabled,
  onClick,
  accent,
  shape = 'rect',
  isLastResolved,
  onUndo,
}: CellProps) {
  const clipStyle = shape === 'hex' ? { clipPath: HEX_CLIP } : undefined
  const baseShape = shape === 'hex' ? '' : 'rounded-md'
  const undoable = status === 'resolved' && Boolean(isLastResolved)
  const inPlay = status === 'in-play'
  const unplayed = status === 'unplayed'
  const interactive = undoable || (unplayed && !disabled)

  const handleClick = () => {
    if (undoable) onUndo?.()
    else if (unplayed) onClick()
  }

  let stateClasses: string
  if (undoable) {
    stateClasses =
      'bg-paper text-ink border-2 border-dashed border-ink/40 hover:bg-paper/70 cursor-pointer'
  } else if (status === 'resolved') {
    stateClasses = 'bg-ink/10 text-ink/30 border-2 border-ink/10 cursor-default'
  } else if (inPlay) {
    stateClasses = `ring-2 ${ACCENT_RING[accent]} bg-ink/5 text-ink/20 animate-pulse cursor-default`
  } else {
    stateClasses = `${ACCENT_CLASSES[accent]} shadow-md shadow-black/30 ${
      disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
    }`
  }

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      disabled={!interactive}
      initial={false}
      whileHover={interactive ? { scale: 1.05, filter: 'brightness(1.15)' } : undefined}
      whileTap={interactive ? { scale: 0.95 } : undefined}
      style={clipStyle}
      className={`aspect-[3/1] flex flex-col items-center justify-center gap-0.5 font-display transition-colors duration-200 ${baseShape} ${stateClasses}`}
    >
      {undoable ? (
        <>
          <span className="text-sm sm:text-base leading-none">↺</span>
          <span className="font-body text-[9px] sm:text-[10px] uppercase tracking-wide">
            Undo
          </span>
        </>
      ) : status === 'resolved' ? (
        <span className="text-lg sm:text-xl">✓</span>
      ) : unplayed ? (
        <span className="text-lg sm:text-2xl tracking-wide">${points}</span>
      ) : null}
    </motion.button>
  )
}
