import { useCallback, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { Play } from 'lucide-react'
import {
  getArtistDetail,
  getArtistSongs,
  getSearch,
  normalizeUrl,
  toSong,
  type SearchResult
} from '@/apis'
import RequestState from '@/components/music/RequestState'
import SongTable from '@/components/music/SongTable'
import { useRequest } from '@/hooks/use-request'
import { usePlayerStore } from '@/store/player'
import type { Song } from '@/types/music'
import './ArtistDetailPage.scss'

/** 粉丝数按设计图显示成「83.2 万」 */
function formatFans(count: number): string {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)} 万粉丝`
  }
  return `${count} 粉丝`
}

/**
 * 歌手详情（设计图）：圆形大头像 + 名字 + 粉丝数 + 单曲/专辑数 + 播放全部 + 单曲列表。
 * 按需求不含 tab、不含专辑，只保留单曲。
 */
export default function ArtistDetailPage() {
  const { id = '' } = useParams()

  // 单曲（热门 50 首）+ 歌手基本信息
  const songsRequest = useRequest(
    (signal) => getArtistSongs({ id, signal }),
    [id]
  )
  // 歌手详情（头像 / 简介）
  const detailRequest = useRequest(
    (signal) => getArtistDetail({ id, signal }),
    [id]
  )

  const artist = useMemo(() => {
    const basic = songsRequest.data?.artist
    const detail = detailRequest.data?.data?.artist
    return {
      name: detail?.name ?? basic?.name ?? '',
      avatar: normalizeUrl(
        detail?.avatar ?? detail?.cover ?? basic?.picUrl ?? basic?.img1v1Url ?? ''
      ),
      briefDesc: detail?.briefDesc ?? basic?.briefDesc ?? '',
      musicSize: detail?.musicSize ?? basic?.musicSize ?? 0,
      alias: (basic?.alias ?? detail?.alias ?? []).filter(Boolean)
    }
  }, [songsRequest.data, detailRequest.data])

  // /artists 与 /artist/detail 都没有粉丝数，用搜索结果里的 fansSize 补上（拿不到就不显示）
  const fansRequest = useRequest(
    (signal) =>
      artist.name
        ? getSearch({ keywords: artist.name, type: 100, limit: 1, signal })
        : Promise.resolve<SearchResult>({ code: 200 }),
    [artist.name]
  )
  const fansHit = fansRequest.data?.result?.artists?.[0]
  const fansCount =
    fansHit && String(fansHit.id) === id ? (fansHit.fansSize ?? fansHit.fansCount ?? 0) : 0

  const songs = useMemo(
    () => (songsRequest.data?.hotSongs ?? []).map(toSong),
    [songsRequest.data]
  )

  const appendQueue = usePlayerStore((state) => state.appendQueue)
  const play = usePlayerStore((state) => state.play)
  const currentId = usePlayerStore((state) => state.current.id)

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
    // 优先挑第一首能播的（VIP 曲目点了不会切歌）
    play(songs.find((song) => !song.vip) ?? songs[0])
  }

  const error = songsRequest.error ?? detailRequest.error
  const loading = songsRequest.loading && !songsRequest.data

  if (error && !songsRequest.loading) {
    return (
      <div className="page artist-detail">
        <RequestState error={error} onRetry={songsRequest.refresh} />
      </div>
    )
  }

  return (
    <div className="page artist-detail">
      <div className="artist-detail__head">
        <span className="artist-detail__avatar">
          {artist.avatar ? (
            <img src={artist.avatar} alt={artist.name} />
          ) : (
            <span className="artist-detail__avatar-skeleton" aria-hidden="true" />
          )}
        </span>

        <div className="artist-detail__info">
          <h1 className="artist-detail__name">
            {artist.name || (loading ? '加载中…' : '歌手不存在')}
          </h1>

          {/* 设计图这里是粉丝数；这个部署的接口不返回粉丝数（fansSize 恒为 null），
              拿不到就退而显示歌手的英文名/别名，保证这一行有内容 */}
          {fansCount > 0 ? (
            <p className="artist-detail__fans">{formatFans(fansCount)}</p>
          ) : artist.alias.length > 0 ? (
            <p className="artist-detail__fans">{artist.alias.join(' · ')}</p>
          ) : null}

          <p className="artist-detail__counts">
            <span>
              单曲：<em>{artist.musicSize || songs.length}</em>
            </span>
          </p>

          <div className="artist-detail__actions">
            <button
              type="button"
              className="artist-detail__action"
              onClick={playAll}
              disabled={songs.length === 0}
            >
              <Play aria-hidden="true" />
              播放全部
            </button>
          </div>
        </div>
      </div>

      <SongTable
        songs={songs}
        total={artist.musicSize || songs.length}
        loading={songsRequest.loading}
        playingId={currentId}
        onPlay={playSong}
        onSelect={playSong}
      />
    </div>
  )
}
