/** 歌曲：播放地址 /song/url/v1、新歌速递 /top/song、推荐新音乐 /personalized/newsong */

import request from '@/utils/request'
import { type SongLike } from './shared'

/* 新歌速递：GET /top/song */

/** 地区类型 id：全部 0 / 华语 7 / 欧美 96 / 日本 8 / 韩国 16 */
export type TopSongArea = 0 | 7 | 8 | 16 | 96

export interface TopSongResult {
  code: number
  /** 曲目列表（标准歌曲结构，含 duration / artists / album） */
  data: SongLike[]
}

/** 新歌速递（按地区类型取最新歌曲） */
export function getTopSongs({
  type = 0,
  signal
}: {
  type?: TopSongArea
  signal?: AbortSignal
} = {}) {
  return request.get<TopSongResult>('/top/song', { type }, { signal })
}


/* 推荐页：新歌速递 GET /personalized/newsong、新碟上架 GET /top/album */

/** /personalized/newsong 的条目：外层给封面，内层 song 是曲目 */
export interface NewSongItem {
  id: number
  name: string
  picUrl?: string
  song?: SongLike
}

export interface NewSongResult {
  code: number
  result: NewSongItem[]
}

/** 推荐新音乐（不支持 offset） */
export function getPersonalizedNewsong({
  limit = 10,
  signal
}: {
  limit?: number
  signal?: AbortSignal
} = {}) {
  return request.get<NewSongResult>(
    '/personalized/newsong',
    { limit },
    { signal }
  )
}

/* 播放地址：GET /song/url/v1 */

/** 播放音质等级 */
export type SongLevel =
  | 'standard'
  | 'higher'
  | 'exhigh'
  | 'lossless'
  | 'hires'
  | 'jyeffect'
  | 'sky'
  | 'dolby'
  | 'jymaster'

export interface SongUrlItem {
  id: number
  /** 可取到时才是可播放的；未登录 / 非会员 / 版权受限会返回 null */
  url: string | null
  /** 码率 */
  br?: number
  /** 时长（毫秒） */
  time?: number
  level?: string | null
  code?: number
  fee?: number
  freeTrialInfo?: { start: number; end: number } | null
}

export interface SongUrlResult {
  code: number
  data: SongUrlItem[]
}

/** 播放地址（/song/url/v1，可传多个 id）。realIP 由请求层统一附加；未登录时受限曲目返回 url: null */
export function getSongUrl({
  id,
  level = 'exhigh',
  signal
}: {
  id: number | string
  level?: SongLevel
  signal?: AbortSignal
}) {
  return request.get<SongUrlResult>(
    '/song/url/v1',
    { id, level, cookie: 'os=pc' },
    { signal }
  )
}
