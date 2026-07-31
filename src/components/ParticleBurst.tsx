import { motion } from 'framer-motion'
import { SparkleIcon } from './SparkleIcon'

const PARTICLE_COUNT = 130

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

interface Particle {
  id: number
  x: number
  y: number
  rotate: number
  delay: number
  size: number
  color: string
  isStar: boolean
}

function makeParticles(colors: string[]): Particle[] {
  // Reach nearly to (and slightly past) the corners of the viewport, not
  // just a small radius — scales with screen size so it fills the screen
  // on any display.
  const maxReach = Math.hypot(window.innerWidth, window.innerHeight) / 2
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + randomBetween(-0.5, 0.5)
    const distance = randomBetween(maxReach * 0.1, maxReach * 1.08)
    return {
      id: i,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      rotate: randomBetween(-300, 300),
      delay: randomBetween(0, 0.5),
      size: randomBetween(14, 38),
      color: colors[i % colors.length],
      isStar: i % 2 === 0,
    }
  })
}

interface ParticleBurstProps {
  colors: string[]
}

// A one-shot particle burst, radiating from the center of the screen —
// accompanies the tile-opening moment (spiral animation + open sound).
// The color palette is swappable (see src/lib/particleEffects.ts) so this
// same burst mechanic can read as silver glitter, a rainbow shower, etc.
// Re-mount with a fresh `key` to trigger a new burst.
export function ParticleBurst({ colors }: ParticleBurstProps) {
  const particles = makeParticles(colors)

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[60]">
      {particles.map((p) =>
        p.isStar ? (
          <motion.span
            key={p.id}
            initial={{ opacity: 1, x: 0, y: 0, scale: 0, rotate: 0 }}
            animate={{
              opacity: [1, 1, 0],
              x: p.x,
              y: p.y,
              scale: [0, 1, 0.6],
              rotate: p.rotate,
            }}
            transition={{ duration: 1.7, delay: p.delay, ease: 'easeOut' }}
            className="absolute"
          >
            <SparkleIcon size={p.size} color={p.color} />
          </motion.span>
        ) : (
          <motion.span
            key={p.id}
            initial={{ opacity: 1, x: 0, y: 0, scale: 0 }}
            animate={{ opacity: [1, 1, 0], x: p.x, y: p.y, scale: [0, 1, 0.6] }}
            transition={{ duration: 1.7, delay: p.delay, ease: 'easeOut' }}
            className="absolute rounded-full"
            style={{
              width: p.size * 0.4,
              height: p.size * 0.4,
              background: p.color,
              boxShadow: `0 0 4px ${p.color}`,
            }}
          />
        ),
      )}
    </div>
  )
}
