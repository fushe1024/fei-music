import { Link } from 'react-router-dom'
import { Headphones, Play } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDuration, formatPlayCount } from '@/utils'
import type { Mv } from '@/types/music'
import './MvCard.scss'

interface MvCardProps {
  mv: Mv
}

/** MV 卡片：16:9 缩略图 + 播放量/时长角标，点进 MV 详情页 */
export default function MvCard({ mv }: MvCardProps) {
  return (
    <Link
      to={`/mv/${mv.id}`}
      // 把列表里的信息带进详情页：个别 MV 的 /mv/detail 会 404，用它兜底显示
      state={{ mv }}
      className="mv-card"
      title={mv.name}
    >
      <span className="mv-card__cover">
        <img src={mv.cover} alt="" loading="lazy" />
        <span className="mv-card__count">
          <Headphones aria-hidden="true" />
          {formatPlayCount(mv.playCount)}
        </span>
        {mv.duration > 0 ? (
          <span className="mv-card__duration">{formatDuration(mv.duration)}</span>
        ) : null}
        <span className="mv-card__hover">
          <Play aria-hidden="true" />
        </span>
      </span>
      <span className="mv-card__name text-clamp-2">{mv.name}</span>
      <span className="mv-card__artists text-ellipsis">
        {mv.artists.map((artist) => artist.name).join(' / ')}
      </span>
    </Link>
  )
}

/** 骨架：与真实卡片同尺寸 */
export function MvCardSkeleton() {
  return (
    <div className="mv-card mv-card--skeleton" aria-hidden="true">
      <Skeleton className="mv-card__cover-skeleton" />
      <Skeleton className="mv-card__name-skeleton" />
      <Skeleton className="mv-card__artists-skeleton" />
    </div>
  )
}
