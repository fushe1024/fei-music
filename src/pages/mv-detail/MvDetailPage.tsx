import { useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { Video, VideoPlayer, VideoSkin } from '@videojs/react/video'
import '@videojs/react/video/skin.css'
import {
  getExclusiveMv,
  getMvDetail,
  getMvUrl,
  normalizeUrl,
  toMv,
  type MvUrlResult
} from '@/apis'
import MvCard, { MvCardSkeleton } from '@/components/music/MvCard'
import RequestState from '@/components/music/RequestState'
import { useRequest } from '@/hooks/use-request'
import { cn, formatPlayCount } from '@/utils'
import type { Mv } from '@/types/music'
import './MvDetailPage.scss'

/** 优先尝试的清晰度（接口 brs 里有的才会显示） */
const QUALITIES = [1080, 720, 480, 240]

/**
 * MV 详情页：Video.js v10（@videojs/react）播放器 + 歌曲信息 + 更多 MV。
 * 播放地址走 /mv/url（MV 视频有防盗链，必须用它拿直链）。
 */
export default function MvDetailPage() {
  const { id = '' } = useParams()
  const location = useLocation()
  const [quality, setQuality] = useState(1080)

  /** 从列表点进来时带过来的信息（个别 MV 的 /mv/detail 会 404，用它兜底） */
  const stateMv = (location.state as { mv?: Mv } | null)?.mv

  const detail = useRequest((signal) => getMvDetail({ mvid: id, signal }), [id])
  const url = useRequest(
    (signal) =>
      id
        ? getMvUrl({ id, r: quality, signal })
        : Promise.resolve<MvUrlResult>({ code: 200 }),
    [id, quality]
  )
  // 更多 MV（用独家推荐的列表做推荐位）
  const more = useRequest(
    (signal) => getExclusiveMv({ limit: 8, signal }),
    []
  )

  const data = detail.data?.data
  const mv = useMemo(() => (data ? toMv(data) : stateMv), [data, stateMv])
  const qualities = useMemo(() => {
    const list = (data?.brs ?? []).map((item) => item.br)
    return QUALITIES.filter((value) => list.includes(value))
  }, [data])

  const playUrl = url.data?.data?.url ? normalizeUrl(url.data.data.url) : ''
  const moreItems = useMemo(
    () => (more.data?.data ?? []).map(toMv),
    [more.data]
  )

  // 详情接口挂了、又没有列表带来的兜底数据时，才整页报错
  if (detail.error && !detail.loading && !mv) {
    return (
      <div className="page mv-detail">
        <RequestState error={detail.error} onRetry={detail.refresh} />
      </div>
    )
  }

  const videoState = playUrl
    ? 'ready'
    : url.loading || detail.loading
      ? 'loading'
      : 'failed'

  return (
    <div className="page mv-detail">
      <div className="mv-detail__player">
        {videoState === 'ready' ? (
          <VideoPlayer poster={mv?.cover}>
            <VideoSkin>
              <Video src={playUrl} playsInline />
            </VideoSkin>
          </VideoPlayer>
        ) : (
          <div className="mv-detail__placeholder">
            <span>
              {videoState === 'loading' ? '视频加载中…' : '该 MV 暂时无法播放'}
            </span>
          </div>
        )}
      </div>

      <div className="mv-detail__info">
        <h1 className="mv-detail__name">{mv?.name ?? (detail.loading ? '加载中…' : 'MV 不存在')}</h1>

        <div className="mv-detail__artists">
          {(mv?.artists ?? []).map((artist, index) => (
            <span key={artist.id}>
              {index > 0 ? <span className="mv-detail__sep">/</span> : null}
              <Link className="mv-detail__artist" to={`/artist/${artist.id}`}>
                {artist.name}
              </Link>
            </span>
          ))}
        </div>

        <div className="mv-detail__meta">
          {mv?.publishTime ? <span>发行：{mv.publishTime}</span> : null}
          {mv ? <span>播放：{formatPlayCount(mv.playCount)}</span> : null}
          {typeof data?.subCount === 'number' ? <span>收藏：{formatPlayCount(data.subCount)}</span> : null}
          {typeof data?.commentCount === 'number' ? <span>评论：{data.commentCount}</span> : null}
        </div>

        {qualities.length > 1 ? (
          <div className="mv-detail__qualities">
            <span className="mv-detail__qualities-label">清晰度</span>
            {qualities.map((value) => (
              <button
                key={value}
                type="button"
                className={cn('mv-detail__quality', value === quality && 'is-active')}
                onClick={() => setQuality(value)}
              >
                {value}P
              </button>
            ))}
          </div>
        ) : null}

        {mv?.desc ? <p className="mv-detail__desc">{mv.desc}</p> : null}
      </div>

      <h2 className="mv-detail__more-title">更多 MV</h2>
      {more.error && !more.loading ? (
        <RequestState error={more.error} onRetry={more.refresh} />
      ) : (
        <div className="mv-grid">
          {more.loading
            ? Array.from({ length: 8 }, (_, index) => <MvCardSkeleton key={index} />)
            : moreItems.map((item) => <MvCard key={item.id} mv={item} />)}
        </div>
      )}
    </div>
  )
}
