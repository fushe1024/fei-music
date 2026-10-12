/** 通用部分：曲目结构、受限判定、封面地址处理、接口模型 -> 页面模型 */

import type { Song } from '@/types/music'

/** 接口曲目的宽松结构：/playlist/detail 用 al/ar/dt，/personalized/newsong 用 album/artists/duration */
export interface SongLike {
  id: number
  name: string
  dt?: number
  duration?: number
  al?: { name?: string; picUrl?: string }
  album?: { name?: string; picUrl?: string }
  ar?: { name: string }[]
  artists?: { name: string }[]
  /** 版权/会员信息，用来判断是否受限（列表里打 VIP 标） */
  privilege?: {
    fee?: number
    st?: number
    pl?: number
    freeTrialPrivilege?: { cannotListenReason?: number | null }
  }
}

/** 是否受限（需会员 / 无版权）：cannotListenReason === 1 比只看 fee 更准 */
export function isRestrictedSong(track: SongLike): boolean {
  return track.privilege?.freeTrialPrivilege?.cannotListenReason === 1
}

/** 接口曲目 -> 播放器模型（同时兼容两种字段命名） */
export function toSong(track: SongLike): Song {
  const album = track.al ?? track.album
  const artists = track.ar ?? track.artists
  const duration = track.dt ?? track.duration
  return {
    id: String(track.id),
    title: track.name,
    artists: (artists ?? []).map((artist) => artist.name),
    album: album?.name ?? '',
    cover: withCoverSize(normalizeUrl(album?.picUrl ?? ''), 200),
    duration: Math.round((duration ?? 0) / 1000),
    vip: isRestrictedSong(track)
  }
}

/* 通用工具 */

/** 封面图床支持 ?param=WxH 返回缩略图，列表里用不到原图 */
export function withCoverSize(url: string, size = 400): string {
  if (!url || url.includes('?')) {
    return url
  }
  return `${url}?param=${size}y${size}`
}

/** 接口返回的封面有 http:// 的情况（/top/playlist），统一升到 https，避免 https 页面被拦 */
export function normalizeUrl(url: string): string {
  return url.startsWith('http://')
    ? `https://${url.slice('http://'.length)}`
    : url
}
