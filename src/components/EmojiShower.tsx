import { motion } from 'framer-motion'

const SHOWER_COUNT = 60

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

interface ShowerParticle {
  id: number
  topPercent: number
  size: number
  delay: number
  duration: number
  rotate: number
}

function makeParticles(): ShowerParticle[] {
  return Array.from({ length: SHOWER_COUNT }, (_, i) => ({
    id: i,
    topPercent: randomBetween(-5, 105),
    size: randomBetween(28, 64),
    delay: randomBetween(0, 1.3),
    duration: randomBetween(1.1, 2),
    rotate: randomBetween(-20, 20),
  }))
}

interface EmojiShowerProps {
  emoji: string
}

// A one-shot shower of a single emoji sweeping left to right across the
// whole screen — deliberately a different motion than <ParticleBurst>'s
// radial explosion, for variety between randomized tile-opening effects.
// The emoji is swappable (see src/lib/particleEffects.ts) so this same
// mechanic covers both the rainbow shower and the poop shower.
export function EmojiShower({ emoji }: EmojiShowerProps) {
  const particles = makeParticles()
  const travel = window.innerWidth + 200

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[60]">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          initial={{ opacity: 0, x: -150, rotate: 0 }}
          animate={{ opacity: [0, 1, 1, 0], x: travel, rotate: p.rotate }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'linear' }}
          className="absolute left-0"
          style={{ top: `${p.topPercent}%`, fontSize: p.size }}
        >
          {emoji}
        </motion.span>
      ))}
    </div>
  )
}
