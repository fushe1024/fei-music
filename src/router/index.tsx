import { createBrowserRouter, Navigate } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import ArtistPage from '@/pages/artist/ArtistPage'
import ArtistDetailPage from '@/pages/artist-detail/ArtistDetailPage'
import DiscSongPage from '@/pages/disc-song/DiscSongPage'
import MvPage from '@/pages/mv/MvPage'
import MvDetailPage from '@/pages/mv-detail/MvDetailPage'
import NotFoundPage from '@/pages/NotFoundPage'
import PlaylistPage from '@/pages/playlist/PlaylistPage'
import PlaylistDetailPage from '@/pages/playlist-detail/PlaylistDetailPage'
import RankPage from '@/pages/rank/RankPage'
import RecommendPage from '@/pages/recommend/RecommendPage'
import RouteErrorPage from '@/pages/RouteErrorPage'
import SearchPage from '@/pages/search/SearchPage'

/**
 * react-router Data 模式：路由以对象数组声明（createBrowserRouter）
 * handle 用于给页面挂元信息（如标题）
 * basename 取 Vite 的 BASE_URL：部署到子路径（如 GitHub Pages 的 /fei-music/）时路由依然可用
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <Navigate to="/recommend" replace /> },
      {
        path: 'recommend',
        element: <RecommendPage />,
        handle: { title: '推荐' }
      },
      {
        path: 'playlist',
        element: <PlaylistPage />,
        handle: { title: '歌单' }
      },
      {
        path: 'playlist/:id',
        element: <PlaylistDetailPage />,
        handle: { title: '歌单详情' }
      },
      { path: 'rank', element: <RankPage />, handle: { title: '排行榜' } },
      {
        path: 'discSong',
        element: <DiscSongPage />,
        handle: { title: '新歌新碟' }
      },
      { path: 'artist', element: <ArtistPage />, handle: { title: '歌手' } },
      {
        path: 'artist/:id',
        element: <ArtistDetailPage />,
        handle: { title: '歌手详情' }
      },
      { path: 'search', element: <SearchPage />, handle: { title: '搜索' } },
      { path: 'mv', element: <MvPage />, handle: { title: 'MV' } },
      {
        path: 'mv/:id',
        element: <MvDetailPage />,
        handle: { title: 'MV 详情' }
      },
      { path: '*', element: <NotFoundPage />, handle: { title: '页面不存在' } }
    ]
  }
], {
  basename: import.meta.env.BASE_URL
})
