import { useEffect, useState } from 'react'
import type { Board } from '../types/board'

export function useBoardData<TCell>(path: string) {
  const [data, setData] = useState<Board<TCell> | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setData(null)
    setError(null)

    fetch(path)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`)
        return res.json() as Promise<Board<TCell>>
      })
      .then((json) => {
        if (!cancelled) setData(json)
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })

    return () => {
      cancelled = true
    }
  }, [path])

  return { data, loading: !data && !error, error }
}
