import { useCallback, useEffect, useRef } from 'react'

const MARGIN_RE = /(-?\d+(?:\.\d+)?)px/

/**
 * 上拉加载：sentinelRef 挂在列表底部，进入视口（提前 rootMargin）时触发 onReach；
 * checkNow() 手动补一次检查，避免「加载中哨兵再次进入视野被忙碌判断挡掉、之后没有新交叉事件」的竞态。
 * 用 callback ref 而不是 useRef + useEffect，条件渲染时也能正确挂载 / 解绑。
 */
export function useInfiniteScroll(onReach: () => void, rootMargin = '240px 0px') {
  const reachRef = useRef(onReach)
  useEffect(() => {
    reachRef.current = onReach
  })

  const observerRef = useRef<IntersectionObserver | null>(null)
  const nodeRef = useRef<HTMLElement | null>(null)

  const sentinelRef = useCallback(
    (node: HTMLElement | null) => {
      observerRef.current?.disconnect()
      nodeRef.current = node
      if (!node || typeof IntersectionObserver === 'undefined') {
        return
      }
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            reachRef.current()
          }
        },
        { rootMargin },
      )
      observer.observe(node)
      observerRef.current = observer
    },
    [rootMargin],
  )

  const margin = Number.parseFloat(rootMargin.match(MARGIN_RE)?.[1] ?? '0') || 0

  const checkNow = useCallback(() => {
    const node = nodeRef.current
    if (!node || typeof window === 'undefined') {
      return
    }
    if (node.getBoundingClientRect().top < window.innerHeight + margin) {
      reachRef.current()
    }
  }, [margin])

  return { sentinelRef, checkNow }
}
