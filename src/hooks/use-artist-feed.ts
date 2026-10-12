import { useCallback } from 'react'
import {
  getArtistList,
  toArtist,
  type ArtistArea,
  type ArtistType,
} from '@/apis'
import { usePagedFeed, type PagedFeed } from '@/hooks/use-paged-feed'
import type { Artist } from '@/types/music'

export interface ArtistQuery {
  /** 「热门」或 A-Z 或 # */
  initial: string
  /** 地区，可能多个（日韩 = 日本 + 韩国） */
  areas: ArtistArea[]
  type: ArtistType
}

/** 界面上的索引项 -> 接口 initial：热门 -1、# 0、字母原样传 */
function toInitialParam(initial: string): string | number {
  if (initial === '热门') {
    return -1
  }
  if (initial === '#') {
    return 0
  }
  return initial
}

/**
 * 歌手列表分页数据源（每页 50），全部走 `/artist/list`：
 * - 「热门」→ `initial=-1`
 * - 「#」→ `initial=0`
 * - A-Z → `initial=<字母>`
 * 再叠加当前的 area / type；地区有多个时（日韩）按地区各取一半合并成一页。
 */
export function useArtistFeed(query: ArtistQuery, pageSize = 50): PagedFeed<Artist> {
  const { initial, areas, type } = query
  const key = `list|${initial}|${areas.join('+')}|${type}|${pageSize}`

  const fetchPage = useCallback(
    async (offset: number, signal?: AbortSignal) => {
      const initialValue = toInitialParam(initial)

      if (areas.length <= 1) {
        const result = await getArtistList({
          area: areas[0] ?? -1,
          type,
          initial: initialValue,
          limit: pageSize,
          offset,
          signal,
        })
        return {
          items: (result.artists ?? []).map((item) => toArtist(item)),
          more: Boolean(result.more),
        }
      }

      const perArea = Math.ceil(pageSize / areas.length)
      const sourceOffset = Math.floor(offset / areas.length)
      const results = await Promise.all(
        areas.map((area) =>
          getArtistList({
            area,
            type,
            initial: initialValue,
            limit: perArea,
            offset: sourceOffset,
            signal,
          }),
        ),
      )
      return {
        items: results.flatMap((result) =>
          (result.artists ?? []).map((item) => toArtist(item))
        ),
        more: results.some((result) => Boolean(result.more)),
      }
    },
    [initial, areas, type, pageSize],
  )

  return usePagedFeed(key, fetchPage, { idOf: (item) => item.id })
}
