import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import './Fallback.scss'

export default function NotFoundPage() {
  return (
    <div className="fallback">
      <span className="fallback__code">404</span>
      <h1 className="fallback__title">这个页面走丢了</h1>
      <p className="fallback__desc">
        你访问的地址不存在，或者已经被移动到别处。
      </p>
      <Button asChild>
        <Link to="/recommend">回到推荐</Link>
      </Button>
    </div>
  )
}
