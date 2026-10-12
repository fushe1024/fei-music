import { NavLink } from 'react-router-dom'
import {
  CircleUserRound,
  Clapperboard,
  Disc3,
  Download,
  ListMusic,
  Trophy,
  type LucideIcon,
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/utils'
import './Sidebar.scss'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

/** 菜单与设计图一致：乐库->推荐、歌单广场->歌单；原「电台」入口换成 MV。 */
const navItems: NavItem[] = [
  { to: '/recommend', label: '推荐', icon: Disc3 },
  { to: '/playlist', label: '歌单', icon: ListMusic },
  { to: '/mv', label: 'MV', icon: Clapperboard },
  { to: '/rank', label: '排行榜', icon: Trophy },
  { to: '/artist', label: '歌手', icon: CircleUserRound },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <ScrollArea className="sidebar__scroll">
        <div className="sidebar__inner">
          <nav className="sidebar__nav">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => cn('sidebar__item', isActive && 'is-active')}
              >
                <Icon className="sidebar__icon" aria-hidden="true" />
                <span className="sidebar__label">{label}</span>
              </NavLink>
            ))}
          </nav>

          <Separator className="sidebar__divider" />

          <button type="button" className="sidebar__item sidebar__item--client">
            <Download className="sidebar__icon" aria-hidden="true" />
            <span className="sidebar__label">下载客户端</span>
          </button>
        </div>
      </ScrollArea>
    </aside>
  )
}
