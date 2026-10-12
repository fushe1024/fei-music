import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, isCanceledError } from '@/utils/request'

export interface RequestState<T> {
  data: T | undefined
  error: ApiError | undefined
  loading: boolean
  /** 重新发起请求（重试 / 换一批） */
  refresh: () => void
}

/**
 * 数据请求 Hook：管理 loading / error / 取消 / 重试。
 * fetcher 拿到的 AbortSignal 请透传给 api 函数，组件卸载或依赖变化时上一次请求会被取消。
 */
export function useRequest<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: unknown[] = [],
): RequestState<T> {
  const [data, setData] = useState<T>()
  const [error, setError] = useState<ApiError>()
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  // 用 ref 保存最新的 fetcher，调用方就不必再包 useCallback
  const fetcherRef = useRef(fetcher)
  useEffect(() => {
    fetcherRef.current = fetcher
  })

  useEffect(() => {
    const controller = new AbortController()
    let alive = true

    setLoading(true)
    setError(undefined)

    fetcherRef
      .current(controller.signal)
      .then((result) => {
        if (!alive) {
          return
        }
        setData(result)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (!alive || isCanceledError(err)) {
          return
        }
        setError(err instanceof ApiError ? err : new ApiError(String(err)))
        setLoading(false)
      })

    return () => {
      alive = false
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps])

  const refresh = useCallback(() => setTick((value) => value + 1), [])

  return { data, error, loading, refresh }
}
