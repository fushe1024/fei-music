import { useCallback } from 'react'
import { getTopPlaylists, toPlaylist } from '@/apis'
import { usePagedFeed, type PagedFeed } from '@/hooks/use-paged-feed'
import type { Playlist } from '@/types/music'

/**
 * 歌单列表分页数据源：首屏 + 上拉加载更多（offset 分页）。
 * 切分类会重新从 offset 0 拉取；跨页重复的歌单按 id 去掉。
 */
export function usePlaylistFeed(cat: string, pageSize = 18): PagedFeed<Playlist> {
  const fetchPage = useCallback(
    async (offset: number, signal?: AbortSignal) => {
      const result = await getTopPlaylists({ cat, limit: pageSize, offset, signal })
      return {
        items: (result.playlists ?? []).map(toPlaylist),
        more: Boolean(result.more),
      }
    },
    [cat, pageSize],
  )

  return usePagedFeed(cat, fetchPage, { idOf: (item) => item.id })
}
