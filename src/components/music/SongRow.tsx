import { Ellipsis, Heart, Play } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/utils'
import type { Song } from '@/types/music'
import './SongRow.scss'

interface SongRowProps {
  song: Song
  index: number
  onPlay: (song: Song) => void
}

export default function SongRow({ song, index, onPlay }: SongRowProps) {
  return (
    <li className="song-row">
      <button
        type="button"
        className="song-row__thumb"
        onClick={() => onPlay(song)}
        aria-label={`播放 ${song.title}`}
      >
        <img src={song.cover} alt="" loading="lazy" />
        <span className="song-row__thumb-mask">
          <Play aria-hidden="true" />
        </span>
      </button>

      <div className="song-row__rank">
        <span className="song-row__index">{index + 1}</span>
        {song.delta ? (
          <span className={cn('song-row__delta', song.delta.type === 'up' && 'is-up')}>
            {song.delta.type === 'up' ? (
              <>
                <i aria-hidden="true" />
                {song.delta.value}
              </>
            ) : (
              '—'
            )}
          </span>
        ) : null}
      </div>

      <div className="song-row__main">
        <div className="song-row__title-line">
          <span className="song-row__title text-ellipsis">{song.title}</span>
        </div>
        <div className="song-row__meta">
          {song.vip ? (
            <Badge variant="outline" className="song-row__vip">
              VIP
            </Badge>
          ) : null}
          <span className="song-row__artists text-ellipsis">{song.artists.join(' / ')}</span>
        </div>
      </div>

      <div className="song-row__actions">
        <button type="button" className="song-row__action" onClick={() => onPlay(song)} aria-label="播放">
          <Play />
        </button>
        <button type="button" className="song-row__action" aria-label="喜欢">
          <Heart />
        </button>
        <button type="button" className="song-row__action" aria-label="更多">
          <Ellipsis />
        </button>
      </div>
    </li>
  )
}
