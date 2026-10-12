import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Play } from 'lucide-react'
import {
  getDefaultSearchKeyword,
  getSearch,
  toAlbum,
  toArtist,
  toMv,
  toPlaylist,
  toSong,
  type DefaultSearchResult,
  type SearchResult,
  type SearchType,
} from '@/apis'
import AlbumCard, { AlbumCardSkeleton } from '@/components/music/AlbumCard'
import ArtistCard, { ArtistCardSkeleton } from '@/components/music/ArtistCard'
import MvCard, { MvCardSkeleton } from '@/components/music/MvCard'
import PlaylistCard, { PlaylistCardSkeleton } from '@/components/music/PlaylistCard'
import RequestState from '@/components/music/RequestState'
import SongTable from '@/components/music/SongTable'
import { useRequest } from '@/hooks/use-request'
import { cn } from '@/utils'
import { usePlayerStore } from '@/store/player'
import type { Song } from '@/types/music'
import './SearchPage.scss'

/** tab 对应的值就是 /cloudsearch 的 type；视频用的是 MV 的 type=1004 */
const TABS: { label: string; type: SearchType }[] = [
  { label: '单曲', type: 1 },
  { label: '歌单', type: 1000 },
  { label: '专辑', type: 10 },
  { label: '歌手', type: 100 },
  { label: '视频', type: 1004 },
]

const LIMIT = 50

/**
 * 搜索结果页（设计图）：标题「xxx 的相关结果」+ 单曲 / 歌单 / 专辑 / 歌手 / 视频。
 * 单曲走列表（含 VIP 标），歌单 / 专辑 / 歌手 / 视频分别复用对应卡片。
 */
export default function SearchPage() {
  const [params, setParams] = useSearchParams()
  const keywords = (params.get('keywords') ?? '').trim()
  const type = (Number(params.get('type') ?? 1) as SearchType) || 1

  const result = useRequest(
    (signal) =>
      keywords
        ? getSearch({ keywords, type, limit: LIMIT, signal })
        : Promise.resolve<SearchResult>({ code: 200 }),
    [keywords, type]
  )
  // 没有关键词时给个默认搜索词（GET /search/default）
  const fallback = useRequest(
    (signal) =>
      keywords
        ? Promise.resolve<DefaultSearchResult | null>(null)
        : getDefaultSearchKeyword({ signal }),
    [keywords]
  )

  const appendQueue = usePlayerStore((state) => state.appendQueue)
  const play = usePlayerStore((state) => state.play)
  const currentId = usePlayerStore((state) => state.current.id)

  const songs = useMemo(
    () => (result.data?.result?.songs ?? []).map(toSong),
    [result.data]
  )
  const playlists = useMemo(
    () => (result.data?.result?.playlists ?? []).map(toPlaylist),
    [result.data]
  )
  const albums = useMemo(
    () => (result.data?.result?.albums ?? []).map(toAlbum),
    [result.data]
  )
  const artists = useMemo(
    // 搜索结果的歌手头像用 img1v1Url（方形头像），picUrl 多半是竖版宣传图
    () => (result.data?.result?.artists ?? []).map((item) => toArtist(item, 'img1v1')),
    [result.data]
  )

  const mvs = useMemo(
    () => (result.data?.result?.mvs ?? []).map(toMv),
    [result.data]
  )

  const counts: Record<SearchType, number> = {
    1: result.data?.result?.songCount ?? 0,
    1000: result.data?.result?.playlistCount ?? 0,
    10: result.data?.result?.albumCount ?? 0,
    100: result.data?.result?.artistCount ?? 0,
    1004: result.data?.result?.mvCount ?? 0,
  }

  const playSong = useCallback(
    (song: Song) => {
      appendQueue(songs)
      play(song)
    },
    [appendQueue, play, songs]
  )

  const playAll = () => {
    if (songs.length === 0) {
      return
    }
    appendQueue(songs)
    // 「播放全部」优先挑第一首能播的（VIP 曲目点了不会切歌）
    play(songs.find((song) => !song.vip) ?? songs[0])
  }

  const switchTab = (next: SearchType) => {
    setParams({ keywords, type: String(next) })
  }

  const switchKeywords = (next: string) => {
    setParams({ keywords: next, type: String(type) })
  }

  const total = counts[type] ?? 0
  const empty =
    !result.loading &&
    !result.error &&
    (type === 1
      ? songs.length === 0
      : type === 1000
        ? playlists.length === 0
        : type === 10
          ? albums.length === 0
          : type === 1004
            ? mvs.length === 0
            : artists.length === 0)

  return (
    <div className="page search-page">
      <h1 className="search-page__title">
        {keywords ? (
          <>
            <span className="search-page__keyword">{keywords}</span> 的相关结果
          </>
        ) : (
          '搜索'
        )}
      </h1>

      <div className="search-page__tabs">
        {TABS.map((tab) => (
          <button
            key={tab.type}
            type="button"
            className={cn('search-page__tab', type === tab.type && 'is-active')}
            onClick={() => switchTab(tab.type)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {type === 1 && keywords ? (
        <div className="search-page__tools">
          <button
            type="button"
            className="search-page__tool"
            onClick={playAll}
            disabled={songs.length === 0}
          >
            <Play aria-hidden="true" />
            播放全部
          </button>
        </div>
      ) : null}

      {result.error && !result.loading ? (
        <RequestState error={result.error} onRetry={result.refresh} />
      ) : !keywords ? (
        <p className="search-page__hint">
          输入关键词开始搜索
          {fallback.data?.data?.showKeyword ? (
            <>
              ，试试
              <button
                type="button"
                className="search-page__hint-keyword"
                onClick={() => switchKeywords(fallback.data?.data?.showKeyword ?? '')}
              >
                {fallback.data.data.showKeyword}
              </button>
            </>
          ) : null}
        </p>
      ) : type === 1 ? (
        <SongTable
          songs={songs}
          loading={result.loading}
          playingId={currentId}
          showTotal={false}
          titleLink
          onPlay={playSong}
          onSelect={playSong}
        />
      ) : type === 1004 ? (
        /* 视频 tab：MV 卡片（16:9 缩略图），样式与 MV 页一致 */
        <>
          <div className="mv-grid search-page__grid">
            {result.loading
              ? Array.from({ length: 8 }, (_, index) => <MvCardSkeleton key={index} />)
              : mvs.map((mv) => <MvCard key={mv.id} mv={mv} />)}
          </div>
          {!result.loading && total > 0 ? (
            <p className="search-page__count">共 {total} 条结果</p>
          ) : null}
        </>
      ) : (
        <>
          <div className="card-grid search-page__grid">
            {result.loading
              ? Array.from({ length: 12 }, (_, index) =>
                  type === 1000 ? (
                    <PlaylistCardSkeleton key={index} />
                  ) : type === 10 ? (
                    <AlbumCardSkeleton key={index} />
                  ) : (
                    <ArtistCardSkeleton key={index} />
                  )
                )
              : type === 1000
                ? playlists.map((playlist) => (
                    <PlaylistCard key={playlist.id} playlist={playlist} />
                  ))
                : type === 10
                  ? albums.map((album) => <AlbumCard key={album.id} album={album} />)
                  : artists.map((artist) => (
                      <ArtistCard key={artist.id} artist={artist} />
                    ))}
          </div>
          {!result.loading && total > 0 ? (
            <p className="search-page__count">共 {total} 条结果</p>
          ) : null}
        </>
      )}

      {empty ? <p className="search-page__hint">没有找到「{keywords}」的相关结果</p> : null}
    </div>
  )
}
