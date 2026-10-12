/** 搜索：/cloudsearch、建议 /search/suggest、默认关键词 /search/default */

import request from '@/utils/request'
import { type AlbumItem } from './album'
import { type ArtistItem } from './artist'
import { type MvItem } from './mv'
import { type TopPlaylistItem } from './playlist'
import { type SongLike } from './shared'

/* 搜索：GET /search/suggest、/cloudsearch、/search/default */

/** 搜索类型：1 单曲 / 10 专辑 / 100 歌手 / 1000 歌单 / 1004 MV */
export type SearchType = 1 | 10 | 100 | 1000 | 1004

export interface SearchSuggestResult {
  code: number
  result?: {
    songs?: SongLike[]
    artists?: ArtistItem[]
    albums?: AlbumItem[]
    playlists?: TopPlaylistItem[]
  }
}

/** 搜索建议（同时包含单曲 / 歌手 / 歌单 / 专辑） */
export function getSearchSuggest({
  keywords,
  signal
}: {
  keywords: string
  signal?: AbortSignal
}) {
  return request.get<SearchSuggestResult>(
    '/search/suggest',
    { keywords },
    { signal }
  )
}

export interface SearchResult {
  code: number
  result?: {
    songCount?: number
    songs?: SongLike[]
    playlistCount?: number
    playlists?: TopPlaylistItem[]
    albumCount?: number
    albums?: AlbumItem[]
    artistCount?: number
    artists?: ArtistItem[]
    /** 视频（type=1004）走的是 MV 的结构 */
    mvCount?: number
    mvs?: MvItem[]
  }
}

/** 搜索：用 /cloudsearch（/search 的单曲缺 ar / al / privilege） */
export function getSearch({
  keywords,
  type = 1,
  limit = 30,
  offset = 0,
  signal
}: {
  keywords: string
  type?: SearchType
  limit?: number
  offset?: number
  signal?: AbortSignal
}) {
  return request.get<SearchResult>(
    '/cloudsearch',
    { keywords, type, limit, offset },
    { signal }
  )
}

export interface DefaultSearchResult {
  code: number
  data?: {
    /** 默认搜索关键词 */
    showKeyword?: string
    realkeyword?: string
  }
}

/** 默认搜索关键词 */
export function getDefaultSearchKeyword({
  signal
}: { signal?: AbortSignal } = {}) {
  return request.get<DefaultSearchResult>('/search/default', {}, { signal })
}

/** 搜索建议：接口的 allMatch 为空，从 songs / artists / albums / playlists 拼词并去重 */
export function toSuggestions(
  result: SearchSuggestResult['result'],
  limit = 9
): string[] {
  if (!result) {
    return []
  }
  const names = [
    ...(result.songs ?? []).map((song) => song.name),
    ...(result.artists ?? []).map((artist) => artist.name),
    ...(result.albums ?? []).map((album) => album.name),
    ...(result.playlists ?? []).map((playlist) => playlist.name)
  ]
  const unique: string[] = []
  for (const name of names) {
    const text = name?.trim()
    if (text && !unique.includes(text)) {
      unique.push(text)
    }
    if (unique.length >= limit) {
      break
    }
  }
  return unique
}

