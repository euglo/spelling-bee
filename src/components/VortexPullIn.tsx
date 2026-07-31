import { motion } from 'framer-motion'
import { SparkleIcon } from './SparkleIcon'

const PARTICLE_COUNT = 90

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function toXY(angle: number, distance: number) {
  return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance }
}

interface Particle {
  id: number
  xs: number[]
  ys: number[]
  rotates: number[]
  delay: number
  size: number
  color: string
  isStar: boolean
}

function makeParticles(colors: string[]): Particle[] {
  // Start scattered across (and slightly past) the whole screen, same reach
  // as the outward burst, but spiral inward instead of exploding outward.
  const maxReach = Math.hypot(window.innerWidth, window.innerHeight) / 2
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const baseAngle = (i / PARTICLE_COUNT) * Math.PI * 2 + randomBetween(-0.4, 0.4)
    const baseDistance = randomBetween(maxReach * 0.5, maxReach * 1.05)
    const spinDirection = randomBetween(-720, 720)
    // 4 waypoints spiraling inward — angle keeps advancing while distance
    // shrinks toward 0, so the path curves rather than moving in a straight
    // line to center.
    const waypoints = [
      { angle: baseAngle, distance: baseDistance },
      { angle: baseAngle + 1.3, distance: baseDistance * 0.6 },
      { angle: baseAngle + 2.7, distance: baseDistance * 0.25 },
      { angle: baseAngle + 4.2, distance: 0 },
    ].map((w) => toXY(w.angle, w.distance))

    return {
      id: i,
      xs: waypoints.map((w) => w.x),
      ys: waypoints.map((w) => w.y),
      // matching-length rotate array (not a scalar) — accelerating spin as
      // it gets pulled toward the center, and length matches xs/ys/opacity
      // so they all share the same `times` keyframes cleanly.
      rotates: [0, spinDirection * 0.2, spinDirection * 0.55, spinDirection],
      delay: randomBetween(0, 0.3),
      size: randomBetween(12, 30),
      color: colors[i % colors.length],
      isStar: i % 2 === 0,
    }
  })
}

interface VortexPullInProps {
  colors: string[]
}

// A one-shot vortex — particles start scattered across the screen and
// spiral inward (accelerating, like water down a drain) instead of exploding
// outward like <ParticleBurst>.
export function VortexPullIn({ colors }: VortexPullInProps) {
  const particles = makeParticles(colors)
  const sharedTransitionBase = { duration: 1.6, ease: 'easeIn' as const, times: [0, 0.4, 0.75, 1] }

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[60]">
      {particles.map((p) =>
        p.isStar ? (
          <motion.span
            key={p.id}
            initial={{ opacity: 0, x: p.xs[0], y: p.ys[0], scale: 1, rotate: 0 }}
            animate={{
              opacity: [0, 1, 1, 0],
              x: p.xs,
              y: p.ys,
              scale: [1, 0.8, 0.5, 0],
              rotate: p.rotates,
            }}
            transition={{ ...sharedTransitionBase, delay: p.delay }}
            className="absolute"
          >
            <SparkleIcon size={p.size} color={p.color} />
          </motion.span>
        ) : (
          <motion.span
            key={p.id}
            initial={{ opacity: 0, x: p.xs[0], y: p.ys[0], scale: 1 }}
            animate={{ opacity: [0, 1, 1, 0], x: p.xs, y: p.ys, scale: [1, 0.8, 0.5, 0] }}
            transition={{ ...sharedTransitionBase, delay: p.delay }}
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
