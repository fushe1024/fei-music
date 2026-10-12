import { RefreshCw } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import type { ApiError } from '@/utils/request'
import './LoadMoreFooter.scss'

interface LoadMoreFooterProps {
  loadingMore: boolean
  /** 加载下一页失败 */
  error?: ApiError
  /** 是否还有下一页 */
  more: boolean
  /** 失败时点击重试 */
  onRetry: () => void
  /** useInfiniteScroll 返回的哨兵 ref */
  sentinelRef: (node: HTMLDivElement | null) => void
}

/**
 * 列表底部：加载中显示主色 loading 弧线（无文字），失败显示重试图标，
 * 加载到底才显示「没有更多了」。
 */
export default function LoadMoreFooter({
  loadingMore,
  error,
  more,
  onRetry,
  sentinelRef,
}: LoadMoreFooterProps) {
  return (
    <div className="load-more" ref={sentinelRef}>
      {loadingMore ? <Spinner /> : null}
      {!loadingMore && error ? (
        <button
          type="button"
          className="load-more__retry"
          aria-label="加载失败，点击重试"
          title="加载失败，点击重试"
          onClick={onRetry}
        >
          <RefreshCw aria-hidden="true" />
        </button>
      ) : null}
      {!loadingMore && !error && !more ? (
        <span className="load-more__end">没有更多了</span>
      ) : null}
    </div>
  )
}
