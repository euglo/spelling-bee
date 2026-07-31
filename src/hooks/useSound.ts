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
  if (!sharedEnabled) return
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

export function playCorrectSound() {
  beep(880, 0.25)
}

export function playIncorrectSound() {
  beep(160, 0.4)
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
