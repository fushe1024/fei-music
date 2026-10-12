import { Play } from 'lucide-react'
import { cn } from '@/utils'
import { usePlayerStore } from '@/store/player'
import type { Song } from '@/types/music'
import './NewSongRow.scss'

interface NewSongRowProps {
  song: Song
  onPlay?: (song: Song) => void
}

/**
 * 新歌速递的一行：封面 + 歌名 + 歌手（推荐页三列排布）。
 * 状态与其它列表保持一致：
 * - 播放中：歌名/歌手用主色，封面常显浅色遮罩 + playing.webp，点封面就是暂停/继续（与播放器联动）；
 * - 未播放：干净封面，鼠标移到封面上才出现播放键。
 */
export default function NewSongRow({ song, onPlay }: NewSongRowProps) {
  const currentId = usePlayerStore((state) => state.current.id)
  const isPlaying = usePlayerStore((state) => state.isPlaying)
  const toggle = usePlayerStore((state) => state.toggle)
  const playing = song.id === currentId

  return (
    <button
      type="button"
      className={cn('new-song-row', playing && 'is-playing')}
      data-song-id={song.id}
      title={`${song.title} - ${song.artists.join('/')}`}
      onClick={(event) => {
        // 播放中时点封面 = 暂停/继续，其余位置仍是播放这首歌
        const onMask = (event.target as HTMLElement).closest('.new-song-row__mask')
        if (playing && onMask) {
          toggle()
          return
        }
        onPlay?.(song)
      }}
    >
      <span className="new-song-row__art">
        <img className="new-song-row__cover" src={song.cover} alt="" loading="lazy" />
        {playing ? (
          <span className="new-song-row__mask" aria-hidden="true">
            {isPlaying ? (
              <img className="new-song-row__mask-icon" src="/assets/playing.webp" alt="" />
            ) : (
              <Play
                className="new-song-row__mask-icon new-song-row__mask-icon--play"
                aria-hidden="true"
              />
            )}
          </span>
        ) : (
          /* 只有鼠标移到封面上才出现的播放键 */
          <span className="new-song-row__play">
            <Play aria-hidden="true" />
          </span>
        )}
      </span>
      <span className="new-song-row__info">
        <span className="new-song-row__title-line">
          <span className="new-song-row__title text-ellipsis">{song.title}</span>
          {song.vip ? <span className="new-song-row__vip">VIP</span> : null}
        </span>
        <span className="new-song-row__artists text-ellipsis">{song.artists.join(' / ')}</span>
      </span>
    </button>
  )
}

/** 骨架：与真实行同尺寸 */
export function NewSongRowSkeleton() {
  return (
    <div className="new-song-row new-song-row--skeleton" aria-hidden="true">
      <span className="new-song-row__art new-song-row__art--skeleton" />
      <span className="new-song-row__info">
        <span className="new-song-row__title-skeleton" />
        <span className="new-song-row__artists-skeleton" />
      </span>
    </div>
  )
}
