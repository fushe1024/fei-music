import { Link } from 'react-router-dom'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import type { Artist } from '@/types/music'
import './ArtistCard.scss'

interface ArtistCardProps {
  artist: Artist
}

/** 歌手卡片：点进歌手详情页 /artist/:id */
export default function ArtistCard({ artist }: ArtistCardProps) {
  return (
    <Link
      to={`/artist/${artist.id}`}
      className="artist-card"
      title={artist.name}
    >
      <Avatar className="artist-card__avatar">
        <AvatarImage src={artist.avatar} alt={artist.name} loading="lazy" />
        <AvatarFallback className="artist-card__fallback">
          {artist.name.slice(0, 1)}
        </AvatarFallback>
      </Avatar>
      <span className="artist-card__name text-ellipsis">{artist.name}</span>
    </Link>
  )
}

/** 首屏骨架：与真实卡片同尺寸，避免加载时抖动 */
export function ArtistCardSkeleton() {
  return (
    <div className="artist-card artist-card--skeleton" aria-hidden="true">
      <Skeleton className="artist-card__avatar-skeleton" />
      <Skeleton className="artist-card__name-skeleton" />
    </div>
  )
}
