import { motion } from 'framer-motion'

const BEE_COUNT = 45
const HOPS = 5

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

interface Bee {
  id: number
  xs: number[]
  ys: number[]
  rotates: number[]
  delay: number
  duration: number
  size: number
}

function makeBees(): Bee[] {
  const halfW = window.innerWidth / 2
  const halfH = window.innerHeight / 2
  return Array.from({ length: BEE_COUNT }, (_, i) => ({
    id: i,
    xs: Array.from({ length: HOPS }, () => randomBetween(-halfW * 0.95, halfW * 0.95)),
    ys: Array.from({ length: HOPS }, () => randomBetween(-halfH * 0.95, halfH * 0.95)),
    rotates: Array.from({ length: HOPS }, () => randomBetween(-45, 45)),
    delay: randomBetween(0, 0.6),
    duration: randomBetween(1.8, 2.6),
    size: randomBetween(20, 38),
  }))
}

// A swarm of 🐝 darting erratically around the whole screen before fading
// out — same erratic-hops idea as the bee-flight card animation, but as a
// scattered background swarm rather than one path converging on a point.
export function BeeSwarm() {
  const bees = makeBees()

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[60]">
      {bees.map((b) => (
        <motion.span
          key={b.id}
          initial={{ opacity: 0, x: b.xs[0], y: b.ys[0], rotate: b.rotates[0], scale: 0.5 }}
          animate={{
            opacity: [0, 1, 1, 1, 0],
            x: b.xs,
            y: b.ys,
            rotate: b.rotates,
            scale: [0.5, 1, 1.05, 0.95, 0.7],
          }}
          transition={{
            duration: b.duration,
            delay: b.delay,
            ease: 'easeInOut',
            times: [0, 0.15, 0.45, 0.75, 1],
          }}
          className="absolute"
          style={{ fontSize: b.size }}
        >
          🐝
        </motion.span>
      ))}
    </div>
  )
}
