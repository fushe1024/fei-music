import { Play } from 'lucide-react'
import type { Album } from '@/types/music'
import './AlbumCard.scss'

interface AlbumCardProps {
  album: Album
}

/** 新碟上架卡片：封面 + 露出的唱片圆片 + 专辑名 + 歌手 */
export default function AlbumCard({ album }: AlbumCardProps) {
  return (
    <div className="album-card" title={`${album.title} - ${album.artists.join('/')}`}>
      <div className="album-card__art">
        <img className="album-card__cover" src={album.cover} alt="" loading="lazy" />
        {/* 鼠标移到封面上才出现的播放键 */}
        <span className="album-card__play">
          <Play aria-hidden="true" />
        </span>
      </div>
      <span className="album-card__title text-ellipsis">{album.title}</span>
      <span className="album-card__artists text-ellipsis">{album.artists.join(' / ')}</span>
    </div>
  )
}

/** 骨架：与真实卡片同尺寸 */
export function AlbumCardSkeleton() {
  return (
    <div className="album-card album-card--skeleton" aria-hidden="true">
      <div className="album-card__art album-card__art--skeleton" />
      <span className="album-card__title-skeleton" />
      <span className="album-card__artists-skeleton" />
    </div>
  )
}
