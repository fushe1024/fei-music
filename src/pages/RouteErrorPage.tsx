import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import './Fallback.scss'

/** 路由级错误边界（Data 模式的 errorElement）。 */
export default function RouteErrorPage() {
  const error = useRouteError()

  let code = '出错了'
  let desc = '页面渲染时发生未知错误，可以回到推荐页重试。'
  if (isRouteErrorResponse(error)) {
    code = `${error.status}`
    desc = error.statusText || desc
  } else if (error instanceof Error) {
    desc = error.message
  }

  return (
    <div className="fallback">
      <span className="fallback__code">{code}</span>
      <h1 className="fallback__title">页面暂时打不开</h1>
      <p className="fallback__desc">{desc}</p>
      <Button asChild>
        <Link to="/recommend">回到推荐</Link>
      </Button>
    </div>
  )
}
