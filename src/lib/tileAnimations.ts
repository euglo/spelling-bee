import type { Target, Transition } from 'framer-motion'

export interface TileAnimation {
  name: string
  initial: Target
  animate: Target
  transition: Transition
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

const SPIRAL_IN: TileAnimation = {
  name: 'spiral-in',
  initial: { opacity: 0, scale: 0.12, rotate: -900 },
  animate: {
    // opacity kept as a matching-length array (not a scalar) so it shares
    // the same `times` keyframes as scale/rotate — a mismatched length
    // here is what caused the stray fade near the end of the settle.
    opacity: [0, 1, 1, 1],
    scale: [0.12, 1.08, 0.97, 1],
    rotate: [-900, 12, -6, 0],
  },
  transition: { duration: 1.7, ease: 'easeOut', times: [0, 0.72, 0.88, 1] },
}

const ZOOM_BOUNCE: TileAnimation = {
  name: 'zoom-bounce',
  initial: { opacity: 0, scale: 0.2 },
  animate: {
    opacity: [0, 1, 1, 1, 1, 1, 1, 1],
    // a decaying sinusoidal bounce — overshoots big, then smaller and
    // smaller oscillations until it levels out at scale 1.
    scale: [0.2, 1.5, 0.75, 1.22, 0.9, 1.08, 0.97, 1],
  },
  transition: {
    duration: 1.6,
    ease: 'easeInOut',
    times: [0, 0.18, 0.36, 0.52, 0.66, 0.78, 0.9, 1],
  },
}

const SLIDE_SPIN_RIGHT: TileAnimation = {
  name: 'slide-spin-right',
  initial: { opacity: 0, x: '120vw', rotate: 0, scale: 0.9 },
  animate: { opacity: [0, 1, 1, 1], x: 0, rotate: 1080, scale: 1 },
  transition: { duration: 2.8, ease: 'linear' },
}

// Genuinely randomized each time — a fresh erratic flight path, not the same
// wiggle replayed. ~3 seconds of erratic hops before settling in place, like
// a bee darting around before landing.
function makeBeeFlight(): TileAnimation {
  const hops = 5
  const xs: number[] = []
  const ys: number[] = []
  const rotates: number[] = []
  const scales: number[] = []
  for (let i = 0; i < hops; i++) {
    xs.push(randomBetween(-280, 280))
    ys.push(randomBetween(-220, 220))
    rotates.push(randomBetween(-30, 30))
    scales.push(randomBetween(0.75, 1.15))
  }
  // final hop always settles dead center, facing normal
  xs.push(0)
  ys.push(0)
  rotates.push(0)
  scales.push(1)

  return {
    name: 'bee-flight',
    initial: { opacity: 0, x: xs[0], y: ys[0], rotate: rotates[0], scale: 0.4 },
    animate: {
      opacity: [1, 1, 1, 1, 1, 1],
      x: xs,
      y: ys,
      rotate: rotates,
      scale: scales,
    },
    transition: {
      duration: 3,
      ease: 'easeInOut',
      // the last leg gets proportionally more time — a slow-down-to-land feel
      times: [0, 0.14, 0.3, 0.48, 0.66, 1],
    },
  }
}

// Silly, randomized entrance animations for the clue card — picked fresh
// each time a tile is clicked, the same "random pick from a pool" idea as
// the sound effects manifest. Entries can be a static animation, or a
// zero-arg factory that builds fresh randomized keyframes per pick (used by
// bee-flight so its path is different every time, not a fixed wiggle).
type TileAnimationEntry = TileAnimation | (() => TileAnimation)

const TILE_ANIMATIONS: TileAnimationEntry[] = [
  SPIRAL_IN,
  ZOOM_BOUNCE,
  SLIDE_SPIN_RIGHT,
  makeBeeFlight,
]

export function pickTileAnimation(): TileAnimation {
  const entry = TILE_ANIMATIONS[Math.floor(Math.random() * TILE_ANIMATIONS.length)]
  return typeof entry === 'function' ? entry() : entry
}
