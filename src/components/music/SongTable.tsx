import SongTableRow from '@/components/music/SongTableRow'
import type { Song } from '@/types/music'
import './SongTable.scss'

interface SongTableProps {
  songs: Song[]
  /** 接口给的曲目总数（未登录时 tracks 可能不完整，展示以它为准） */
  total?: number
  loading?: boolean
  /** 骨架行数 */
  skeletonCount?: number
  /** 正在播放的曲目 id，用于高亮当前行 */
  playingId?: string
  /** 表头是否显示「｜共 N 首」（搜索结果页按设计图不显示） */
  showTotal?: boolean
  /** 歌名用主色（搜索结果页按设计图是蓝色） */
  titleLink?: boolean
  onPlay: (song: Song) => void
  /** 双击行才播放（列表页默认单击封面播放键即可） */
  onSelect?: (song: Song) => void
}

/** 歌曲列表（# / 歌曲｜共 N 首 / 专辑 / 时长），discSong、歌单详情、搜索结果共用 */
export default function SongTable({
  songs,
  total,
  loading = false,
  skeletonCount = 10,
  playingId,
  showTotal = true,
  titleLink = false,
  onPlay,
  onSelect,
}: SongTableProps) {
  return (
    <div className="song-table">
      <div className="song-table__head">
        <span className="song-table__col-index">#</span>
        <span className="song-table__col-song">
          歌曲
          {showTotal ? (
            <span className="song-table__count">｜共 {total ?? songs.length} 首</span>
          ) : null}
        </span>
        <span className="song-table__col-album">专辑</span>
        <span className="song-table__col-duration">时长</span>
      </div>
      <ul className="song-table__body">
        {loading
          ? Array.from({ length: skeletonCount }, (_, index) => (
              <li key={index} className="song-table__skeleton" aria-hidden="true" />
            ))
          : songs.map((song, index) => (
              <SongTableRow
                key={`${song.id}-${index}`}
                song={song}
                index={index}
                playing={song.id === playingId}
                titleLink={titleLink}
                onPlay={() => onPlay(song)}
                onSelect={onSelect ? () => onSelect(song) : undefined}
              />
            ))}
      </ul>
    </div>
  )
}
