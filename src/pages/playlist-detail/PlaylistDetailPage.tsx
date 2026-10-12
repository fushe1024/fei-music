import { useCallback, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ChevronDown, Ellipsis, Heart, Play } from 'lucide-react'
import { getPlaylistDetail, mergeTrackPrivileges, toSong } from '@/apis'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import RequestState from '@/components/music/RequestState'
import SongTable from '@/components/music/SongTable'
import { useRequest } from '@/hooks/use-request'
import { cn, formatPlayCount } from '@/utils'
import { usePlayerStore } from '@/store/player'
import type { Song } from '@/types/music'
import './PlaylistDetailPage.scss'

/**
 * 歌单详情（图）：头部歌单信息 + 歌曲列表。
 * 推荐歌单卡片、歌单页卡片、排行榜卡片都跳这里（排行榜本质也是歌单）。
 * 注意接口在未登录状态返回的 tracks 不完整（以 trackCount 为准）。
 */
export default function PlaylistDetailPage() {
  const { id = '' } = useParams()
  const detail = useRequest((signal) => getPlaylistDetail({ id, signal }), [id])

  const playlist = detail.data?.playlist
  const songs = useMemo(
    () =>
      mergeTrackPrivileges(playlist?.tracks ?? [], detail.data?.privileges).map(
        toSong
      ),
    [playlist, detail.data]
  )
  const total = playlist?.trackCount ?? songs.length

  const appendQueue = usePlayerStore((state) => state.appendQueue)
  const play = usePlayerStore((state) => state.play)
  const currentId = usePlayerStore((state) => state.current.id)

  const [expanded, setExpanded] = useState(false)

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
    // 「播放全部」优先挑第一首能播的（列表里的 VIP 曲目点了不会切歌）
    play(songs.find((song) => !song.vip) ?? songs[0])
  }

  if (detail.error && !detail.loading) {
    return (
      <div className="page playlist-detail">
        <RequestState error={detail.error} onRetry={detail.refresh} />
      </div>
    )
  }

  const description = playlist?.description?.trim() ?? ''
  const creator = playlist?.creator

  return (
    <div className="page playlist-detail">
      <div className="playlist-detail__head">
        <span className="playlist-detail__cover">
          {playlist ? (
            <img src={playlist.coverImgUrl} alt="" />
          ) : (
            <span className="playlist-detail__cover-skeleton" aria-hidden="true" />
          )}
        </span>

        <div className="playlist-detail__info">
          <h1 className="playlist-detail__name">
            {playlist?.name ?? (detail.loading ? '加载中…' : '歌单不存在')}
          </h1>

          {description ? (
            <div className="playlist-detail__desc-row">
              <p
                className={cn(
                  'playlist-detail__desc',
                  expanded ? 'is-expanded' : 'text-ellipsis'
                )}
              >
                {description}
              </p>
              <button
                type="button"
                className="playlist-detail__toggle"
                onClick={() => setExpanded((value) => !value)}
              >
                详情
                <ChevronDown
                  aria-hidden="true"
                  className={cn('playlist-detail__chevron', expanded && 'is-open')}
                />
              </button>
            </div>
          ) : null}

          <div className="playlist-detail__creator">
            {creator?.avatarUrl ? (
              <img className="playlist-detail__avatar" src={creator.avatarUrl} alt="" />
            ) : (
              <span className="playlist-detail__avatar playlist-detail__avatar--empty" />
            )}
            <span className="playlist-detail__nickname">{creator?.nickname ?? ''}</span>
            {playlist?.playCount ? (
              <span className="playlist-detail__plays">
                播放 {formatPlayCount(playlist.playCount)}
              </span>
            ) : null}
          </div>

          <div className="playlist-detail__actions">
            <button
              type="button"
              className="playlist-detail__action playlist-detail__action--primary"
              onClick={playAll}
            >
              <Play aria-hidden="true" />
              播放全部
            </button>
            <button type="button" className="playlist-detail__action">
              <Heart aria-hidden="true" className="is-filled" />
              收藏
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="playlist-detail__action playlist-detail__action--icon"
                  aria-label="更多操作"
                >
                  <Ellipsis aria-hidden="true" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="playlist-detail__menu">
                <DropdownMenuItem>收藏歌单</DropdownMenuItem>
                <DropdownMenuItem>下载全部</DropdownMenuItem>
                <DropdownMenuItem>分享歌单</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>复制链接</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <SongTable
        songs={songs}
        total={total}
        loading={detail.loading}
        playingId={currentId}
        onPlay={playSong}
        onSelect={playSong}
      />
    </div>
  )
}
