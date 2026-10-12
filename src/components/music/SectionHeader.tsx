import type { ReactNode } from 'react'
import { cn } from '@/utils'
import './SectionHeader.scss'

interface SectionHeaderProps {
  title: string
  /** 标题右侧的小图标按钮（如「推荐歌单」的刷新） */
  icon?: ReactNode
  /** 右侧更多入口 */
  action?: ReactNode
  className?: string
}

export default function SectionHeader({ title, icon, action, className }: SectionHeaderProps) {
  return (
    <div className={cn('section-header', className)}>
      <h2 className="section-header__title">{title}</h2>
      {icon}
      {action ? <div className="section-header__action">{action}</div> : null}
    </div>
  )
}
