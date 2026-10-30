import { useEffect, useState } from 'react'

export function useApi(fetcher) {
  const [state, setState] = useState({ data: null, live: false, loading: true })

  useEffect(() => {
    let cancelled = false
    fetcher().then(({ data, live }) => {
      if (!cancelled) setState({ data, live, loading: false })
    })
    return () => {
      cancelled = true
    }
  }, [fetcher])

  return state
}
