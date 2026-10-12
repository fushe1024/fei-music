/** 歌手：列表 /artist/list、单曲 /artists、详情 /artist/detail */

import type { Artist } from '@/types/music'
import request from '@/utils/request'
import { normalizeUrl, withCoverSize, type SongLike } from './shared'

/* 歌手：分类列表 GET /artist/list（热门、#、A-Z 都走它） */

/** 地区：-1 全部 / 7 华语 / 96 欧美 / 8 日本 / 16 韩国 / 0 其他 */
export type ArtistArea = -1 | 0 | 7 | 8 | 16 | 96
/** 类型：-1 全部 / 1 男 / 2 女 / 3 乐队 */
export type ArtistType = -1 | 1 | 2 | 3
/** 首字母索引：A-Z，热门传 -1，# 传 0 */
export type ArtistInitial = string | number

export interface ArtistItem {
  id: number
  name: string
  /** 头像，注意可能是 http:// */
  picUrl: string
  /** 方形头像（搜索结果里用它，picUrl 常常是竖版宣传图） */
  img1v1Url?: string
  /** 粉丝数（搜索结果里有，歌手详情接口没有，详情页拿它补设计图上的「xx 万粉丝」） */
  fansSize?: number
  fansCount?: number
  /** 别名（英文名等） */
  alias?: string[]
  albumSize?: number
  musicSize?: number
  briefDesc?: string
  followed?: boolean
  trans?: string | null
}

export interface ArtistListResult {
  code: number
  /** 是否还有下一页 */
  more: boolean
  artists: ArtistItem[]
}

export interface ArtistListParams {
  area?: ArtistArea
  type?: ArtistType
  initial?: ArtistInitial
  /** 每页数量，默认 30（页面按需求传 50） */
  limit?: number
  offset?: number
  signal?: AbortSignal
}

/** 歌手分类列表：按地区 / 类型 / 首字母索引查询（热门 initial=-1、# initial=0） */
export function getArtistList({
  area = -1,
  type = -1,
  initial = -1,
  limit = 54,
  offset,
  signal
}: ArtistListParams = {}) {
  return request.get<ArtistListResult>(
    '/artist/list',
    { area, type, initial, limit, offset },
    { signal }
  )
}

/** 接口歌手 -> 页面模型 */
export function toArtist(
  item: ArtistItem,
  source: 'pic' | 'img1v1' = 'pic'
): Artist {
  const raw =
    source === 'img1v1' ? (item.img1v1Url ?? item.picUrl) : item.picUrl
  return {
    id: String(item.id),
    name: item.name,
    avatar: withCoverSize(normalizeUrl(raw), 200)
  }
}


/** 歌手基本信息（/artists 与 /artist/detail 的公共字段） */
export interface ArtistInfo {
  id: number
  name: string
  picUrl?: string
  img1v1Url?: string
  avatar?: string
  cover?: string
  alias?: string[]
  transNames?: string[]
  briefDesc?: string
  /** 单曲数 */
  musicSize?: number
  /** 专辑数 */
  albumSize?: number
  mvSize?: number
}

export interface ArtistSongsResult {
  code: number
  artist?: ArtistInfo
  /** 热门歌曲（约 50 首），带 privilege 可判 VIP */
  hotSongs?: SongLike[]
  more?: boolean
}

/** 歌手单曲 + 热门歌曲。GET /artists?id= */
export function getArtistSongs({
  id,
  signal
}: {
  id: number | string
  signal?: AbortSignal
}) {
  return request.get<ArtistSongsResult>('/artists', { id }, { signal })
}

export interface ArtistDetailResult {
  code: number
  data?: {
    artist?: ArtistInfo
  }
}

/** 歌手详情（头像 / 简介）。GET /artist/detail?id= */
export function getArtistDetail({
  id,
  signal
}: {
  id: number | string
  signal?: AbortSignal
}) {
  return request.get<ArtistDetailResult>('/artist/detail', { id }, { signal })
}

