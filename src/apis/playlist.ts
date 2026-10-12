/** 歌单：推荐 /personalized、分类 /playlist/catlist、热门标签、/top/playlist、榜单 /toplist、详情 /playlist/detail */

import type { Playlist } from '@/types/music'
import request from '@/utils/request'
import { normalizeUrl, withCoverSize, type SongLike } from './shared'

/* 推荐歌单 GET /personalized */

export interface PersonalizedParams {
  /** 取出数量，默认 30（接口不支持 offset） */
  limit?: number
  /** 用于取消请求 */
  signal?: AbortSignal
}

/** 接口返回的单个歌单 */
export interface PersonalizedItem {
  id: number
  type: number
  name: string
  copywriter: string
  picUrl: string
  playCount: number
  trackCount: number
  trackNumberUpdateTime?: number
  highQuality?: boolean
  alg?: string
}

export interface PersonalizedResult {
  hasTaste: boolean
  code: number
  category: number
  result: PersonalizedItem[]
}

/** 推荐歌单：调用此接口可获取推荐歌单 */
export function getPersonalizedPlaylists({
  limit = 30,
  signal
}: PersonalizedParams = {}) {
  return request.get<PersonalizedResult>('/personalized', { limit }, { signal })
}

/* 歌单分类 GET /playlist/catlist */

/** 分类标签（歌单分类里的每一项，all 与 sub 共用这个结构） */
export interface CatlistItem {
  name: string
  /** 该分类下的歌单数量 */
  resourceCount: number
  imgId: number
  imgUrl: string | null
  /** 0 / 1，接口自带的分组标记 */
  type: number
  /** 所属分类的 key，对应 CatlistResult.categories 的键 */
  category: number
  resourceType: number
  /** 是否为热门标签 */
  hot: boolean
  activity: boolean
}

export interface CatlistResult {
  code: number
  /** 「全部歌单」这一项 */
  all: CatlistItem
  /** 所有子分类标签 */
  sub: CatlistItem[]
  /** 分类 key -> 分类名，如 { 0: '语种', 1: '风格', 2: '场景', 3: '情感', 4: '主题' } */
  categories: Record<string, string>
}

export interface CatlistParams {
  signal?: AbortSignal
}

/** 歌单分类：调用此接口可获取歌单分类，包含 category 信息 */
export function getPlaylistCatlist({ signal }: CatlistParams = {}) {
  return request.get<CatlistResult>('/playlist/catlist', undefined, { signal })
}

export interface CatlistGroup {
  /** 分类名，如「语种」「风格」 */
  name: string
  /** 该分类下的全部标签 */
  items: CatlistItem[]
  /** 该分类下的热门标签 */
  hot: CatlistItem[]
}

/** 把 sub 按 categories 分组，顺序与接口返回的 categories 一致 */
export function groupCatlist(result: CatlistResult): CatlistGroup[] {
  return Object.entries(result.categories ?? {})
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([key, name]) => {
      const items = result.sub.filter((item) => String(item.category) === key)
      return { name, items, hot: items.filter((item) => item.hot) }
    })
}

/* 热门歌单分类 GET /playlist/hot */

/** tags[].playlistTag：标签详情 */
export interface HotTagDetail {
  id: number
  name: string
  category: number
  usedCount: number
  type: number
  position: number
  createTime: number
  /** 1 表示优质标签，0 表示否 */
  highQuality: number
  highQualityPos: number
  officialPos: number
}

/** tags[]：热门标签条目（外层字段与 playlistTag 基本重复，接口原样返回） */
export interface HotTag {
  playlistTag: HotTagDetail
  activity: boolean
  name: string
  id: number
  /** 接口里恒为 1 */
  type: number
  usedCount: number
  hot: boolean
  /** 对应 CatlistResult.categories 的键 */
  category: number
  /** 展示顺序 */
  position: number
  createTime: number
}

export interface HotTagsResult {
  code: number
  /** 线上目前 10 个，按 position 排列 */
  tags: HotTag[]
}

export interface HotTagsParams {
  signal?: AbortSignal
}

/** 热门歌单分类：调用此接口可获取热门歌单分类标签 */
export function getHotPlaylistTags({ signal }: HotTagsParams = {}) {
  return request.get<HotTagsResult>('/playlist/hot', undefined, { signal })
}

/** 热门标签名称，顺序即接口的 position 顺序（可直接当一排胶囊） */
export function pickHotTagNames(result: HotTagsResult): string[] {
  return [...result.tags]
    .sort((a, b) => a.position - b.position)
    .map((tag) => tag.name)
}

/* 网友精选碟歌单 GET /top/playlist */

export interface TopPlaylistParams {
  /** 分类标签，默认「全部」，取值见 /playlist/catlist 或 /playlist/hot */
  cat?: string
  /** 取出数量，默认 50 */
  limit?: number
  /** 偏移量，用于分页：(页码 - 1) * limit */
  offset?: number
  signal?: AbortSignal
}

/** 歌单创建者（接口返回的 user 对象字段很多，这里只声明用得上的） */
export interface PlaylistCreator {
  userId: number
  nickname: string
  avatarUrl: string
  signature?: string
}

/** /top/playlist 返回的歌单（接口实际返回 50+ 字段，这里只声明常用的） */
export interface TopPlaylistItem {
  id: number
  name: string
  coverImgUrl: string
  playCount: number
  trackCount: number
  /** 更新时间戳 */
  updateTime: number
  createTime: number
  description?: string | null
  /** 歌单标签 */
  tags?: string[]
  /** 收藏人数 */
  subscribedCount?: number
  commentCount?: number
  shareCount?: number
  creator?: PlaylistCreator
}

export interface TopPlaylistResult {
  code: number
  /** 是否还有下一页 */
  more: boolean
  /** 当前分类，如「全部」 */
  cat: string
  /** 该分类下的歌单总数 */
  total: number
  playlists: TopPlaylistItem[]
}

/** 网友精选碟歌单。order 固定 hot：后端 order=new 会返回空列表 */
export function getTopPlaylists({
  cat = '全部',
  limit = 54,
  offset,
  signal
}: TopPlaylistParams = {}) {
  return request.get<TopPlaylistResult>(
    '/top/playlist',
    { order: 'hot', cat, limit, offset },
    { signal }
  )
}


/* 榜单：所有榜单 GET /toplist、榜单曲目 GET /playlist/detail */

export interface ToplistItem {
  id: number
  name: string
  /** 榜单封面（卡片不用，留作兜底） */
  coverImgUrl?: string
  /** 更新频率文案，如「刚刚更新」「每周四更新」 */
  updateFrequency?: string
  trackCount?: number
  playCount?: number
  description?: string
}

export interface ToplistResult {
  code: number
  list: ToplistItem[]
  /** 歌手榜（单独一项，页面按普通榜单一起渲染） */
  artistToplist?: { name: string; id?: number }
}

/** 所有榜单 */
export function getToplist({ signal }: { signal?: AbortSignal } = {}) {
  return request.get<ToplistResult>('/toplist', undefined, { signal })
}

export interface PlaylistDetailResult {
  code: number
  playlist?: {
    id: number
    name: string
    coverImgUrl?: string
    /** 歌单简介 */
    description?: string | null
    /** 曲目总数：未登录时 tracks 不完整，但这里是准的 */
    trackCount?: number
    /** 播放量 / 收藏量 */
    playCount?: number
    subscribedCount?: number
    tags?: string[]
    /** 创建者 */
    creator?: {
      nickname?: string
      avatarUrl?: string
    }
    tracks?: SongLike[]
  }
  /** 会员 / 版权信息：歌单详情的 tracks 不带 privilege，权限在顶层这个数组里（按 id 对应） */
  privileges?: (NonNullable<SongLike['privilege']> & { id?: number })[]
}

/** 歌单 / 榜单详情：未登录时 tracks 不完整，trackCount / trackIds 才准 */
export function getPlaylistDetail({
  id,
  signal
}: {
  id: number | string
  signal?: AbortSignal
}) {
  return request.get<PlaylistDetailResult>(
    '/playlist/detail',
    { id },
    { signal }
  )
}

/** 把顶层 privileges 合并回每首曲目，这样 toSong 能判出 VIP */
export function mergeTrackPrivileges(
  tracks: SongLike[],
  privileges?: PlaylistDetailResult['privileges']
): SongLike[] {
  if (!privileges || privileges.length === 0) {
    return tracks
  }
  const byId = new Map(privileges.map((item) => [String(item.id), item]))
  return tracks.map((track) => {
    if (track.privilege) {
      return track
    }
    const privilege = byId.get(String(track.id))
    return privilege ? { ...track, privilege } : track
  })
}

/** 接口歌单 -> 页面模型（兼容推荐歌单 picUrl 与网友精选碟 coverImgUrl） */
export function toPlaylist(item: PersonalizedItem | TopPlaylistItem): Playlist {
  const cover = 'coverImgUrl' in item ? item.coverImgUrl : item.picUrl
  return {
    id: String(item.id),
    title: item.name,
    cover: withCoverSize(normalizeUrl(cover)),
    playCount: item.playCount
  }
}
