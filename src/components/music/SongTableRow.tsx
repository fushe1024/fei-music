import { CirclePlay, Ellipsis, Heart, Play } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/utils'
import { formatDuration } from '@/utils'
import { usePlayerStore } from '@/store/player'
import type { Song } from '@/types/music'
import './SongTableRow.scss'

interface SongTableRowProps {
  song: Song
  /** 从 0 开始的下标，展示为 01 / 02 … */
  index: number
  /** 当前正在播放的歌曲 */
  playing?: boolean
  /** 歌名用主色（搜索结果页） */
  titleLink?: boolean
  onPlay: (song: Song) => void
  /** 双击整行时的回调（歌单详情页用） */
  onSelect?: (song: Song) => void
}

/** 新歌速递列表的一行（图二）：序号 + 封面 + 歌名/歌手 + 操作 + 专辑 + 时长 */
export default function SongTableRow({
  song,
  index,
  playing = false,
  titleLink = false,
  onPlay,
  onSelect,
}: SongTableRowProps) {
  const isPlaying = usePlayerStore((state) => state.isPlaying)
  const toggle = usePlayerStore((state) => state.toggle)

  return (
    <li
      className={cn('song-table-row', playing && 'is-playing')}
      data-song-id={song.id}
      onDoubleClick={onSelect ? () => onSelect(song) : undefined}
    >
      <span className="song-table-row__index">
        {String(index + 1).padStart(2, '0')}
      </span>

      <div className="song-table-row__song">
        <span className="song-table-row__art">
          <img className="song-table-row__cover" src={song.cover} alt="" loading="lazy" />
          {playing ? (
            /* 播放中：封面上常显浅色遮罩 + playing.webp，点它就是暂停/继续（与播放器联动） */
            <button
              type="button"
              className="song-table-row__mask"
              aria-label={isPlaying ? '暂停' : '播放'}
              onClick={(event) => {
                event.stopPropagation()
                toggle()
              }}
            >
              {isPlaying ? (
                <img
                  className="song-table-row__mask-icon"
                  src="/assets/playing.webp"
                  alt=""
                />
              ) : (
                <Play
                  className="song-table-row__mask-icon song-table-row__mask-icon--play"
                  aria-hidden="true"
                />
              )}
            </button>
          ) : (
            /* 未播放：鼠标移到封面上才出现播放键 */
            <button
              type="button"
              className="song-table-row__art-play"
              aria-label={`播放 ${song.title}`}
              onClick={() => onPlay(song)}
            >
              <Play aria-hidden="true" />
            </button>
          )}
        </span>
        <span className="song-table-row__info">
          <span className="song-table-row__title-line">
            <span
              className={cn(
                'song-table-row__title text-ellipsis',
                titleLink && 'is-link'
              )}
            >
              {song.title}
            </span>
            {song.vip ? <span className="song-table-row__vip">VIP</span> : null}
          </span>
          <span className="song-table-row__artists text-ellipsis">
            {song.artists.join(' / ')}
          </span>
        </span>

        {/* 悬停才出现的行内操作：圆形播放 + 喜欢 + 更多 */}
        <span className="song-table-row__actions">
          <button
            type="button"
            className="song-table-row__action"
            aria-label={`播放 ${song.title}`}
            onClick={() => onPlay(song)}
          >
            <CirclePlay aria-hidden="true" />
          </button>
          <button type="button" className="song-table-row__action" aria-label="喜欢">
            <Heart aria-hidden="true" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="song-table-row__action" aria-label="更多操作">
                <Ellipsis aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="song-table-row__menu">
              <DropdownMenuItem>添加到歌单</DropdownMenuItem>
              <DropdownMenuItem>下载</DropdownMenuItem>
              <DropdownMenuItem>添加到播放队列</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>查看歌曲评论</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </span>
      </div>

      <span className="song-table-row__album text-ellipsis" title={song.album}>
        {song.album}
      </span>
      <span className="song-table-row__duration">{formatDuration(song.duration)}</span>
    </li>
  )
}
