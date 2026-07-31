export type ParticleEffect =
  | { kind: 'radial'; name: string; colors: string[] }
  | { kind: 'rainbow-shower'; name: string }

const SILVER_TONES = ['#FFFFFF', '#E7E9ED', '#CDD1D8', '#B8BCC4']

// Randomized particle-burst effects for the tile-opening moment — same
// "random pick from a pool" pattern as the sounds and tile animations.
// `radial` effects render via <ParticleBurst>; `rainbow-shower` renders via
// its own <RainbowShower> component since its motion (sweeping left to
// right) is fundamentally different from a burst radiating from center.
const PARTICLE_EFFECTS: ParticleEffect[] = [
  { kind: 'radial', name: 'silver-glitter', colors: SILVER_TONES },
  { kind: 'rainbow-shower', name: 'rainbow-shower' },
]

export function pickParticleEffect(): ParticleEffect {
  return PARTICLE_EFFECTS[Math.floor(Math.random() * PARTICLE_EFFECTS.length)]
}
