/** 新碟上架 GET /album/new */

import type { Album } from '@/types/music'
import request from '@/utils/request'
import { normalizeUrl, withCoverSize } from './shared'

export interface AlbumItem {
  id: number
  name: string
  picUrl?: string
  publishTime?: number
  artist?: { name: string }
  artists?: { name: string }[]
}

/** 新碟上架（分页）：用 /album/new；/top/album 忽略 limit / offset 且慢，未采用 */
export function getNewAlbums({
  area = 'ALL',
  limit = 6,
  offset = 0,
  signal
}: {
  area?: 'ALL' | 'ZH' | 'EA' | 'KR' | 'JP'
  limit?: number
  offset?: number
  signal?: AbortSignal
} = {}) {
  return request.get<NewAlbumResult>(
    '/album/new',
    { area, limit, offset },
    { signal }
  )
}

export interface NewAlbumResult {
  code: number
  total?: number
  albums: AlbumItem[]
}

/** 接口新碟 -> 页面模型 */
export function toAlbum(item: AlbumItem): Album {
  return {
    id: String(item.id),
    title: item.name,
    cover: withCoverSize(normalizeUrl(item.picUrl ?? ''), 300),
    artists: (item.artists ?? (item.artist ? [item.artist] : [])).map(
      (artist) => artist.name
    )
  }
}

