import { CircleAlert, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils'
import { ApiError } from '@/utils/request'
import './RequestState.scss'

interface RequestStateProps {
  error: unknown
  onRetry?: () => void
  className?: string
}

/** 列表/区块级的数据加载失败提示（整页级错误见 RouteErrorPage）。 */
export default function RequestState({ error, onRetry, className }: RequestStateProps) {
  const message = error instanceof ApiError ? error.message : '数据加载失败，请稍后再试'

  return (
    <div className={cn('request-state', className)}>
      <CircleAlert className="request-state__icon" aria-hidden="true" />
      <p className="request-state__message">{message}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw />
          重试
        </Button>
      ) : null}
    </div>
  )
}
