import { Link } from 'react-router-dom'
import { Headphones, Play } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { formatPlayCount } from '@/utils'
import type { Playlist } from '@/types/music'
import './PlaylistCard.scss'

interface PlaylistCardProps {
  playlist: Playlist
}

/** 歌单卡片：点进歌单详情页 /playlist/:id */
export default function PlaylistCard({ playlist }: PlaylistCardProps) {
  return (
    <Link
      to={`/playlist/${playlist.id}`}
      className="playlist-card"
      title={playlist.title}
    >
      <span className="playlist-card__cover">
        <img src={playlist.cover} alt="" loading="lazy" />
        <span className="playlist-card__count">
          <Headphones aria-hidden="true" />
          {formatPlayCount(playlist.playCount)}
        </span>
        <span className="playlist-card__hover">
          <Play aria-hidden="true" />
        </span>
      </span>
      <span className="playlist-card__title text-clamp-2">{playlist.title}</span>
    </Link>
  )
}

/** 加载中的占位卡片，尺寸与真实卡片一致，避免首屏跳动 */
export function PlaylistCardSkeleton() {
  return (
    <div className="playlist-card playlist-card--skeleton" aria-hidden="true">
      <Skeleton className="playlist-card__cover-skeleton" />
      <Skeleton className="playlist-card__title-skeleton" />
    </div>
  )
}
