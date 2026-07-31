import { useEffect, useState } from 'react'

const STORAGE_KEY = 'spelling-bee-sound-enabled'
let sharedEnabled = localStorage.getItem(STORAGE_KEY) !== 'false'
const listeners = new Set<(v: boolean) => void>()

function setSharedEnabled(v: boolean) {
  sharedEnabled = v
  localStorage.setItem(STORAGE_KEY, String(v))
  listeners.forEach((l) => l(v))
}

function beep(freq: number, duration: number) {
  const ctx = new AudioContext()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.frequency.value = freq
  osc.connect(gain)
  gain.connect(ctx.destination)
  gain.gain.setValueAtTime(0.15, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
  osc.start()
  osc.stop(ctx.currentTime + duration)
  osc.onended = () => ctx.close()
}

type SoundCategory = 'correct' | 'incorrect' | 'open'

type SoundManifest = Record<SoundCategory, string[]>

// Cached for the session — edit public/sounds/manifest.json and refresh to pick up changes.
let manifestPromise: Promise<SoundManifest | null> | null = null

function loadManifest(): Promise<SoundManifest | null> {
  if (!manifestPromise) {
    manifestPromise = fetch('/sounds/manifest.json')
      .then((res) => (res.ok ? (res.json() as Promise<SoundManifest>) : null))
      .catch(() => null)
  }
  return manifestPromise
}

function pickRandom<T>(items: T[]): T | undefined {
  if (items.length === 0) return undefined
  return items[Math.floor(Math.random() * items.length)]
}

async function playCustomOrFallback(category: SoundCategory, fallback: () => void) {
  if (!sharedEnabled) return

  const manifest = await loadManifest()
  const file = pickRandom(manifest?.[category] ?? [])
  if (!file) {
    fallback()
    return
  }

  const audio = new Audio(`/sounds/${category}/${file}`)
  audio.play().catch(() => fallback())
}

export function playCorrectSound() {
  playCustomOrFallback('correct', () => beep(880, 0.25))
}

export function playIncorrectSound() {
  playCustomOrFallback('incorrect', () => beep(160, 0.4))
}

export function playOpenSound() {
  playCustomOrFallback('open', () => beep(500, 0.15))
}

export function useSoundEnabled() {
  const [enabled, setEnabled] = useState(sharedEnabled)
  useEffect(() => {
    listeners.add(setEnabled)
    return () => {
      listeners.delete(setEnabled)
    }
  }, [])
  return [enabled, setSharedEnabled] as const
}
