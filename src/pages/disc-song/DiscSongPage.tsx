import { useCallback, useMemo, useState } from 'react'
import { Play } from 'lucide-react'
import {
  getNewAlbums,
  getTopSongs,
  toAlbum,
  toSong,
  type TopSongArea,
} from '@/apis'
import AlbumCard, { AlbumCardSkeleton } from '@/components/music/AlbumCard'
import FilterChips from '@/components/music/FilterChips'
import LoadMoreFooter from '@/components/music/LoadMoreFooter'
import RequestState from '@/components/music/RequestState'
import SongTable from '@/components/music/SongTable'
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll'
import { usePagedFeed } from '@/hooks/use-paged-feed'
import { useRequest } from '@/hooks/use-request'
import { cn } from '@/utils'
import { usePlayerStore } from '@/store/player'
import type { Album } from '@/types/music'
import './DiscSongPage.scss'

/** 顶部两个 tab */
const TABS = ['新歌速递', '新碟上架'] as const
type Tab = (typeof TABS)[number]

/** 新歌速递的地区筛选 = /top/song 的 type */
const SONG_AREAS: { label: string; value: TopSongArea }[] = [
  { label: '全部', value: 0 },
  { label: '华语', value: 7 },
  { label: '欧美', value: 96 },
  { label: '日本', value: 8 },
  { label: '韩国', value: 16 },
]

/** 新碟上架的地区筛选 = /album/new 的 area */
type AlbumArea = 'ALL' | 'ZH' | 'EA' | 'KR' | 'JP'
const ALBUM_AREAS: { label: string; value: AlbumArea }[] = [
  { label: '全部', value: 'ALL' },
  { label: '华语', value: 'ZH' },
  { label: '欧美', value: 'EA' },
  { label: '韩国', value: 'KR' },
  { label: '日本', value: 'JP' },
]

/** 新碟每页 18 张 */
const ALBUM_PAGE = 18

/**
 * 「更多鲜乐更多快落 / 魔力新碟好听到爆」跳转过来的页面（图二 / 图三）：
 * 两个 tab —— 新歌速递（表格，按 type 筛选）+ 新碟上架（六列卡片，按 area 筛选、上拉加载）。
 */
export default function DiscSongPage() {
  const appendQueue = usePlayerStore((state) => state.appendQueue)
  const play = usePlayerStore((state) => state.play)
  const currentId = usePlayerStore((state) => state.current.id)

  const [tab, setTab] = useState<Tab>('新歌速递')
  const [songArea, setSongArea] = useState<TopSongArea>(0)
  const [albumArea, setAlbumArea] = useState<AlbumArea>('ALL')

  // 新歌速递
  const songs = useRequest(
    (signal) => getTopSongs({ type: songArea, signal }),
    [songArea]
  )
  const songList = useMemo(
    () => (songs.data?.data ?? []).map(toSong),
    [songs.data]
  )

  // 新碟上架（offset 分页 + 上拉加载）
  const fetchAlbums = useCallback(
    async (offset: number, signal?: AbortSignal) => {
      const result = await getNewAlbums({
        area: albumArea,
        limit: ALBUM_PAGE,
        offset,
        signal,
      })
      const items = (result.albums ?? []).map(toAlbum)
      return { items, more: offset + items.length < (result.total ?? 0) }
    },
    [albumArea]
  )
  const albums = usePagedFeed(`new-albums|${albumArea}`, fetchAlbums, {
    idOf: (album: Album) => album.id,
  })
  const { sentinelRef, checkNow } = useInfiniteScroll(albums.loadMore)

  const playSong = (songId: string) => {
    const song = songList.find((item) => item.id === songId)
    if (song) {
      // 从列表点播：整张列表作为播放队列（受限曲目自动跳过、上一首/下一首都靠它）
      appendQueue(songList)
      play(song)
    }
  }

  const playAll = () => {
    if (songList.length > 0) {
      appendQueue(songList)
      play(songList[0])
    }
  }

  const songAreaLabel = SONG_AREAS.find((item) => item.value === songArea)?.label ?? '全部'
  const albumAreaLabel = ALBUM_AREAS.find((item) => item.value === albumArea)?.label ?? '全部'

  return (
    <div className="page disc-song-page">
      <div className="disc-song-page__tabs">
        {TABS.map((item) => (
          <button
            key={item}
            type="button"
            className={cn('disc-song-page__tab', tab === item && 'is-active')}
            onClick={() => setTab(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="disc-song-page__filters">
        {tab === '新歌速递' ? (
          <FilterChips
            variant="brand"
            options={SONG_AREAS.map((item) => item.label)}
            value={songAreaLabel}
            onValueChange={(label) => {
              const hit = SONG_AREAS.find((item) => item.label === label)
              if (hit) {
                setSongArea(hit.value)
              }
            }}
          />
        ) : (
          <FilterChips
            variant="brand"
            options={ALBUM_AREAS.map((item) => item.label)}
            value={albumAreaLabel}
            onValueChange={(label) => {
              const hit = ALBUM_AREAS.find((item) => item.label === label)
              if (hit) {
                setAlbumArea(hit.value)
              }
            }}
          />
        )}

        {tab === '新歌速递' ? (
          <div className="disc-song-page__tools">
            <button
              type="button"
              className="disc-song-page__tool disc-song-page__tool--primary"
              onClick={playAll}
            >
              <Play aria-hidden="true" />
              播放全部
            </button>
          </div>
        ) : null}
      </div>

      {tab === '新歌速递' ? (
        songs.error && !songs.loading ? (
          <RequestState error={songs.error} onRetry={songs.refresh} />
        ) : (
          <SongTable
            songs={songList}
            loading={songs.loading}
            playingId={currentId}
            onPlay={(song) => playSong(song.id)}
          />
        )
      ) : albums.error && !albums.loading ? (
        <RequestState error={albums.error} onRetry={albums.reload} />
      ) : (
        <>
          <div className="album-grid disc-song-page__albums">
            {albums.loading
              ? Array.from({ length: ALBUM_PAGE }, (_, index) => (
                  <AlbumCardSkeleton key={index} />
                ))
              : albums.items.map((album) => <AlbumCard key={album.id} album={album} />)}
          </div>
          {!albums.loading ? (
            <LoadMoreFooter
              loadingMore={albums.loadingMore}
              error={albums.loadMoreError}
              more={albums.more}
              onRetry={() => {
                albums.loadMore()
                checkNow()
              }}
              sentinelRef={sentinelRef}
            />
          ) : null}
        </>
      )}
    </div>
  )
}
