import { useEffect, useRef } from 'react'
import { Outlet, useLocation, useMatches } from 'react-router-dom'
import FullscreenPlayer from '@/components/layout/FullscreenPlayer'
import Header from '@/components/layout/Header'
import PlayerBar from '@/components/layout/PlayerBar'
import PlayerNotice from '@/components/layout/PlayerNotice'
import Sidebar from '@/components/layout/Sidebar'
import './AppLayout.scss'

interface RouteHandle {
  title?: string
}

export default function AppLayout() {
  const mainRef = useRef<HTMLElement>(null)
  const { pathname } = useLocation()
  const matches = useMatches()
  const title = (matches.at(-1)?.handle as RouteHandle | undefined)?.title

  // 滚动只发生在主内容区：切换路由时把它复位到顶部
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
  }, [pathname])

  useEffect(() => {
    document.title = title ? `${title} - 菲菲音乐` : '菲菲音乐 - 非你不可'
  }, [title])

  return (
    <div className="app">
      <Header />
      <Sidebar />
      <main className="app__main" ref={mainRef}>
        <Outlet />
      </main>
      <PlayerBar />
      <PlayerNotice />
      <FullscreenPlayer />
    </div>
  )
}
