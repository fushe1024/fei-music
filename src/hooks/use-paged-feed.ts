import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, isCanceledError } from '@/utils/request'

export interface PagedFeed<T> {
  items: T[]
  /** 是否还有下一页 */
  more: boolean
  /** 首屏加载中 */
  loading: boolean
  /** 正在加载下一页 */
  loadingMore: boolean
  /** 首屏加载失败（整页错误态） */
  error?: ApiError
  /** 加载下一页失败（只在底部提示，已加载的数据保留） */
  loadMoreError?: ApiError
  /** 加载下一页 */
  loadMore: () => void
  /** 重新加载首屏（重试） */
  reload: () => void
}

export interface PagedFeedOptions<T> {
  /** 用 id 去重（offset 分页期间数据可能变动，跨页会重复） */
  idOf?: (item: T) => string
}

export interface FetchedPage<T> {
  items: T[]
  more: boolean
}

/**
 * 通用分页数据源：首屏 + 上拉加载更多。
 * key（分类 / 筛选）变化时从 offset 0 重拉；loading / items / error 由「已加载数据的 key
 * 是否等于当前 key」派生，切 key 时不闪旧数据；每轮请求带自增代次，过期响应丢弃；
 * 下一页失败只记 loadMoreError，已加载列表保留。
 */
export function usePagedFeed<T>(
  key: string,
  fetchPage: (offset: number, signal?: AbortSignal) => Promise<FetchedPage<T>>,
  options: PagedFeedOptions<T> = {},
): PagedFeed<T> {
  const [page, setPage] = useState<{ key: string; items: T[]; more: boolean }>()
  const [errorState, setErrorState] = useState<{ key: string; error: ApiError }>()
  const [loadMoreErrorState, setLoadMoreErrorState] = useState<{ key: string; error: ApiError }>()
  const [loadingMoreFor, setLoadingMoreFor] = useState<string>()
  const [tick, setTick] = useState(0)

  const generation = useRef(0)
  const moreController = useRef<AbortController | null>(null)
  /** fetchPage 每次渲染都是新函数，用 ref 保存最新的，避免把它放进依赖 */
  const fetchRef = useRef(fetchPage)
  useEffect(() => {
    fetchRef.current = fetchPage
  })
  const idOfRef = useRef(options.idOf)
  useEffect(() => {
    idOfRef.current = options.idOf
  })

  useEffect(() => {
    const id = ++generation.current
    const controller = new AbortController()
    moreController.current?.abort()

    fetchRef
      .current(0, controller.signal)
      .then((result) => {
        if (id !== generation.current) {
          return
        }
        setPage({ key, items: result.items, more: result.more })
      })
      .catch((err: unknown) => {
        if (id !== generation.current || isCanceledError(err)) {
          return
        }
        setErrorState({ key, error: err instanceof ApiError ? err : new ApiError(String(err)) })
      })

    return () => controller.abort()
  }, [key, tick])

  const loadMore = useCallback(() => {
    if (!page || page.key !== key || !page.more || loadingMoreFor === key) {
      return
    }
    const id = generation.current
    const controller = new AbortController()
    moreController.current = controller
    setLoadingMoreFor(key)
    setLoadMoreErrorState(undefined)

    fetchRef
      .current(page.items.length, controller.signal)
      .then((result) => {
        if (id !== generation.current) {
          return
        }
        setPage((prev) => {
          if (!prev || prev.key !== key) {
            return prev
          }
          const idOf = idOfRef.current
          const items = idOf
            ? result.items.filter(
                (item) => !prev.items.some((existing) => idOf(existing) === idOf(item)),
              )
            : result.items
          return { key, items: [...prev.items, ...items], more: result.more }
        })
      })
      .catch((err: unknown) => {
        if (id !== generation.current || isCanceledError(err)) {
          return
        }
        setLoadMoreErrorState({
          key,
          error: err instanceof ApiError ? err : new ApiError(String(err)),
        })
      })
      .finally(() => {
        setLoadingMoreFor((prev) => (prev === key ? undefined : prev))
      })
  }, [key, page, loadingMoreFor])

  const reload = useCallback(() => {
    // 重试时先清掉错误，让页面重新进入加载态
    setErrorState(undefined)
    setLoadMoreErrorState(undefined)
    setTick((value) => value + 1)
  }, [])

  const matched = page?.key === key ? page : undefined
  const failed = errorState?.key === key

  return {
    items: matched?.items ?? [],
    more: matched?.more ?? false,
    loading: !matched && !failed,
    loadingMore: loadingMoreFor === key,
    error: failed ? errorState?.error : undefined,
    loadMoreError: loadMoreErrorState?.key === key ? loadMoreErrorState.error : undefined,
    loadMore,
    reload,
  }
}
