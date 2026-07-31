export type ParticleEffect =
  | { kind: 'radial'; name: string; colors: string[] }
  | { kind: 'emoji-shower'; name: string; emoji: string }
  | { kind: 'vortex-pull-in'; name: string; colors: string[] }
  | { kind: 'bee-swarm'; name: string }

const SILVER_TONES = ['#FFFFFF', '#E7E9ED', '#CDD1D8', '#B8BCC4']
const VOID_TONES = ['#BF5AF2', '#8B5CF6', '#5B3DF0', '#2E1A6B']

// Randomized particle effects for the tile-opening moment — same "random
// pick from a pool" pattern as the sounds and tile animations. Each `kind`
// maps to its own component in src/components/ since the motion differs
// enough (explosion vs sweep vs spiral vs scattered swarm) that forcing them
// through one shared mechanic wasn't a good fit — see JeopardyBoard.tsx.
const PARTICLE_EFFECTS: ParticleEffect[] = [
  { kind: 'radial', name: 'silver-glitter', colors: SILVER_TONES },
  { kind: 'emoji-shower', name: 'rainbow-shower', emoji: '🌈' },
  { kind: 'emoji-shower', name: 'poop-shower', emoji: '💩' },
  { kind: 'vortex-pull-in', name: 'vortex-pull-in', colors: VOID_TONES },
  { kind: 'bee-swarm', name: 'bee-swarm' },
]

export function pickParticleEffect(): ParticleEffect {
  return PARTICLE_EFFECTS[Math.floor(Math.random() * PARTICLE_EFFECTS.length)]
}
