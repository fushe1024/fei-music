/** MV：/personalized/mv、/mv/first、/mv/all、/mv/exclusive/rcmd、/mv/detail、/mv/url */

import type { Mv } from '@/types/music'
import request from '@/utils/request'
import { normalizeUrl, withCoverSize } from './shared'

/* ------------------------------------------------------------------ */
/* MV：/personalized/mv、/mv/first、/mv/all、/mv/exclusive/rcmd、       */
/*     /mv/detail、/mv/url                                             */
/* ------------------------------------------------------------------ */

/** 列表接口返回的 MV 条目（推荐用 picUrl，其它用 cover） */
export interface MvItem {
  id: number
  name: string
  picUrl?: string
  cover?: string
  playCount?: number
  /** 毫秒 */
  duration?: number
  artists?: { id: number; name: string; img1v1Url?: string | null }[]
  artistId?: number
  artistName?: string
  desc?: string | null
  briefDesc?: string | null
  publishTime?: string
}

export interface PersonalizedMvResult {
  code: number
  result?: MvItem[]
}

/** 推荐 MV。GET /personalized/mv */
export function getPersonalizedMv({ signal }: { signal?: AbortSignal } = {}) {
  return request.get<PersonalizedMvResult>('/personalized/mv', {}, { signal })
}

export interface MvListResult {
  code: number
  data?: MvItem[]
  /** 全部 MV 才有 */
  hasMore?: boolean
  count?: number
  /** 独家推荐用的是 more */
  more?: boolean
}

/** 最新 MV：不要传 area=全部（会返回空列表） */
export function getLatestMv({
  area,
  limit = 12,
  signal
}: {
  area?: MvArea
  limit?: number
  signal?: AbortSignal
} = {}) {
  const params: Record<string, unknown> = { limit }
  if (area && area !== '全部') {
    params.area = area
  }
  return request.get<MvListResult>('/mv/first', params, { signal })
}

/** 独家推荐 MV。GET /mv/exclusive/rcmd */
export function getExclusiveMv({
  limit = 12,
  offset = 0,
  signal
}: {
  limit?: number
  offset?: number
  signal?: AbortSignal
} = {}) {
  return request.get<MvListResult>(
    '/mv/exclusive/rcmd',
    { limit, offset },
    { signal }
  )
}

/** 地区 / 类型 / 排序的可选值（接口约定就是中文） */
export type MvArea = '全部' | '内地' | '港台' | '欧美' | '日本' | '韩国'
export type MvType = '全部' | '官方版' | '原生' | '现场版' | '网易出品'
export type MvOrder = '上升最快' | '最热' | '最新'

/** 全部 MV（分页）。GET /mv/all */
export function getMvAll({
  area = '全部',
  type = '全部',
  order = '上升最快',
  limit = 24,
  offset = 0,
  signal
}: {
  area?: MvArea
  type?: MvType
  order?: MvOrder
  limit?: number
  offset?: number
  signal?: AbortSignal
} = {}) {
  return request.get<MvListResult>(
    '/mv/all',
    { area, type, order, limit, offset },
    { signal }
  )
}

export interface MvDetailResult {
  code: number
  data?: MvItem & {
    /** 可选清晰度：240 / 480 / 720 / 1080 */
    brs?: { br: number; size: number }[]
    subCount?: number
    shareCount?: number
    commentCount?: number
  }
}

/** MV 详情（名字 / 歌手 / 发布时间 / 清晰度列表）。GET /mv/detail */
export function getMvDetail({
  mvid,
  signal
}: {
  mvid: number | string
  signal?: AbortSignal
}) {
  return request.get<MvDetailResult>('/mv/detail', { mvid }, { signal })
}

export interface MvUrlResult {
  code: number
  data?: {
    id: number
    url: string | null
    r?: number
    size?: number
    code?: number
    fee?: number
    mvFee?: number
    expi?: number
    msg?: string
  }
}

/** MV 播放地址（默认 1080，可用 r 指定）。GET /mv/url */
export function getMvUrl({
  id,
  r = 1080,
  signal
}: {
  id: number | string
  r?: number
  signal?: AbortSignal
}) {
  return request.get<MvUrlResult>('/mv/url', { id, r }, { signal })
}

/** 接口 MV -> 页面模型 */
export function toMv(item: MvItem): Mv {
  const artists = (item.artists ?? []).map((artist) => ({
    id: String(artist.id),
    name: artist.name
  }))
  if (artists.length === 0 && item.artistId) {
    artists.push({
      id: String(item.artistId),
      name: item.artistName ?? '未知歌手'
    })
  }
  return {
    id: String(item.id),
    name: item.name,
    cover: withCoverSize(normalizeUrl(item.picUrl ?? item.cover ?? ''), 480),
    // 搜索接口返回的 playCount / duration 可能是字符串，统一转成数字
    playCount: Number(item.playCount ?? 0) || 0,
    // 部分接口 duration 是 0，兜底成 0 秒，列表里不显示时长
    duration: Math.round((Number(item.duration ?? 0) || 0) / 1000),
    artists,
    publishTime: item.publishTime,
    desc: item.desc ?? item.briefDesc ?? ''
  }
}
