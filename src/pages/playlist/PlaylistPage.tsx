import { useEffect, useMemo, useRef, useState } from 'react'
import {
  getHotPlaylistTags,
  getPlaylistCatlist,
  groupCatlist,
  pickHotTagNames
} from '@/apis'
import CategoryPanel from '@/components/music/CategoryPanel'
import FilterChips, { MoreChip } from '@/components/music/FilterChips'
import LoadMoreFooter from '@/components/music/LoadMoreFooter'
import PlaylistCard, {
  PlaylistCardSkeleton
} from '@/components/music/PlaylistCard'
import RequestState from '@/components/music/RequestState'
import { Separator } from '@/components/ui/separator'
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll'
import { usePlaylistFeed } from '@/hooks/use-playlist-feed'
import { useRequest } from '@/hooks/use-request'
import './PlaylistPage.scss'

/** 一屏三行（6 列） */
const LIST_LIMIT = 54
const ALL_TAG = '全部'
/** 外层胶囊的占位值：筛选来自面板时用它，保证外层没有任何胶囊高亮 */
const PANEL_SELECTION = '__panel__'

export default function PlaylistPage() {

  const [cat, setCat] = useState(ALL_TAG)
  /** 当前筛选是否来自「更多分类」面板：是则外层只高亮「更多分类」 */
  const [fromPanel, setFromPanel] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('')
  const filtersRef = useRef<HTMLDivElement>(null)

  // 热门歌单分类（顶部默认标签行）
  const hot = useRequest((signal) => getHotPlaylistTags({ signal }), [])
  // 歌单分类（更多分类面板：按接口返回的 category 分组）
  const catlist = useRequest((signal) => getPlaylistCatlist({ signal }), [])
  // 网友精选碟歌单：首屏 + 上拉加载更多
  const feed = usePlaylistFeed(cat, LIST_LIMIT)

  const hotTags = useMemo(
    () => (hot.data ? pickHotTagNames(hot.data) : []),
    [hot.data]
  )
  const groups = useMemo(
    () => (catlist.data ? groupCatlist(catlist.data) : []),
    [catlist.data]
  )
  // 面板里当前生效的 tab（数据未到时退回第一个分类）
  const currentTab = activeTab || groups[0]?.name || ''

  // 上拉加载：底部哨兵进入视口（提前 240px）就加载下一页
  const { sentinelRef, checkNow } = useInfiniteScroll(feed.loadMore)

  // 追加完成后如果哨兵还在视口里（内容不够高），继续补齐下一页
  useEffect(() => {
    if (!feed.loading && !feed.loadingMore) {
      checkNow()
    }
  }, [feed.items.length, feed.loading, feed.loadingMore, checkNow])

  // 展开时定位到当前选中标签所属的 category，未命中则用第一个分类
  const resolveTab = () => {
    const hit = groups.find((group) =>
      group.items.some((item) => item.name === cat)
    )
    return hit?.name ?? groups[0]?.name ?? ''
  }

  // 点击面板外或按 Esc 收起
  useEffect(() => {
    if (!panelOpen) {
      return
    }
    const onPointerDown = (event: MouseEvent) => {
      if (!filtersRef.current?.contains(event.target as Node)) {
        setPanelOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPanelOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [panelOpen])

  // 换分类后回到内容区顶部
  useEffect(() => {
    document.querySelector<HTMLElement>('.app__main')?.scrollTo({ top: 0 })
  }, [cat])

  const selectTag = (name: string, fromCategoryPanel = false) => {
    setCat(name)
    setFromPanel(fromCategoryPanel)
    if (!fromCategoryPanel) {
      setPanelOpen(false)
    }
  }

  const togglePanel = () => {
    if (panelOpen) {
      setPanelOpen(false)
      return
    }
    setActiveTab(resolveTab())
    setPanelOpen(true)
  }

  const showEmpty = !feed.loading && !feed.error && feed.items.length === 0

  return (
    <div className="page playlist-page">
      <div className="playlist-page__filters" ref={filtersRef}>
        {hot.error ? (
          <button type="button" className="chips__more" onClick={hot.refresh}>
            分类加载失败，点击重试
          </button>
        ) : (
          <FilterChips
            variant="brand"
            options={[ALL_TAG, ...hotTags]}
            value={fromPanel ? PANEL_SELECTION : cat}
            onValueChange={(value) => selectTag(value)}
          />
        )}

        <Separator orientation="vertical" className="playlist-page__divider" />

        <MoreChip
          isOpen={panelOpen}
          highlighted={panelOpen || fromPanel}
          onClick={togglePanel}
        />

        {panelOpen ? (
          <CategoryPanel
            groups={groups}
            loading={catlist.loading}
            error={catlist.error}
            onRetry={catlist.refresh}
            activeTab={currentTab}
            onTabChange={setActiveTab}
            selected={cat}
            onSelect={(name) => selectTag(name, true)}
          />
        ) : null}
      </div>

      {feed.error && !feed.loading ? (
        <RequestState error={feed.error} onRetry={feed.reload} />
      ) : showEmpty ? (
        <div className="playlist-page__empty">
          <p>「{cat}」下暂时没有歌单，换个标签试试</p>
        </div>
      ) : (
        <>
          <div className="card-grid">
            {feed.loading
              ? Array.from({ length: LIST_LIMIT }, (_, index) => (
                  <PlaylistCardSkeleton key={index} />
                ))
              : feed.items.map((playlist) => (
                  <PlaylistCard key={playlist.id} playlist={playlist} />
                ))}
          </div>

          {!feed.loading ? (
            <LoadMoreFooter
              loadingMore={feed.loadingMore}
              error={feed.loadMoreError}
              more={feed.more}
              onRetry={feed.loadMore}
              sentinelRef={sentinelRef}
            />
          ) : null}
        </>
      )}
    </div>
  )
}
