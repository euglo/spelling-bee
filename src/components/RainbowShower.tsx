import { motion } from 'framer-motion'

const RAINBOW_COUNT = 60

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

interface RainbowParticle {
  id: number
  topPercent: number
  size: number
  delay: number
  duration: number
  rotate: number
}

function makeRainbows(): RainbowParticle[] {
  return Array.from({ length: RAINBOW_COUNT }, (_, i) => ({
    id: i,
    topPercent: randomBetween(-5, 105),
    size: randomBetween(28, 64),
    delay: randomBetween(0, 1.3),
    duration: randomBetween(1.1, 2),
    rotate: randomBetween(-20, 20),
  }))
}

// A one-shot shower of 🌈 sweeping left to right across the whole screen —
// deliberately a different motion than <ParticleBurst>'s radial explosion,
// for variety between randomized tile-opening effects.
export function RainbowShower() {
  const rainbows = makeRainbows()
  const travel = window.innerWidth + 200

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[60]">
      {rainbows.map((r) => (
        <motion.span
          key={r.id}
          initial={{ opacity: 0, x: -150, rotate: 0 }}
          animate={{ opacity: [0, 1, 1, 0], x: travel, rotate: r.rotate }}
          transition={{ duration: r.duration, delay: r.delay, ease: 'linear' }}
          className="absolute left-0"
          style={{ top: `${r.topPercent}%`, fontSize: r.size }}
        >
          🌈
        </motion.span>
      ))}
    </div>
  )
}
