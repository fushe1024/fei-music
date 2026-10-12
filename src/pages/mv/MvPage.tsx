import { useCallback, useMemo, useState } from 'react'
import {
  getExclusiveMv,
  getLatestMv,
  getMvAll,
  getPersonalizedMv,
  toMv,
  type MvArea,
  type MvItem,
  type MvListResult,
  type MvOrder,
  type MvType
} from '@/apis'
import FilterChips from '@/components/music/FilterChips'
import LoadMoreFooter from '@/components/music/LoadMoreFooter'
import MvCard, { MvCardSkeleton } from '@/components/music/MvCard'
import RequestState from '@/components/music/RequestState'
import SectionHeader from '@/components/music/SectionHeader'
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll'
import { usePagedFeed } from '@/hooks/use-paged-feed'
import { useRequest } from '@/hooks/use-request'
import type { Mv } from '@/types/music'
import './MvPage.scss'

/** 全部 MV 每页 24 个（4 列 × 6 行） */
const ALL_PAGE = 24
/** 顶部三个模块各取 8 个 */
const SECTION_LIMIT = 8

const AREAS: MvArea[] = ['全部', '内地', '港台', '欧美', '日本', '韩国']
const TYPES: MvType[] = ['全部', '官方版', '原生', '现场版', '网易出品']
const ORDERS: MvOrder[] = ['上升最快', '最热', '最新']

/**
 * MV 页（原电台入口）：
 * 推荐 MV / 最新 MV / 独家推荐 MV 三个模块 + 「全部 MV」（地区 / 类型 / 排序筛选 + 上拉加载）。
 */
export default function MvPage() {
  const [area, setArea] = useState<MvArea>('全部')
  const [type, setType] = useState<MvType>('全部')
  const [order, setOrder] = useState<MvOrder>('上升最快')

  const personalized = useRequest((signal) => getPersonalizedMv({ signal }), [])
  const latest = useRequest(
    (signal) => getLatestMv({ limit: SECTION_LIMIT, signal }),
    []
  )
  const exclusive = useRequest(
    (signal) => getExclusiveMv({ limit: SECTION_LIMIT, signal }),
    []
  )

  const fetchAll = useCallback(
    async (offset: number, signal?: AbortSignal): Promise<{ items: Mv[]; more: boolean }> => {
      const result: MvListResult = await getMvAll({
        area,
        type,
        order,
        limit: ALL_PAGE,
        offset,
        signal
      })
      const items = (result.data ?? []).map(toMv)
      return {
        items,
        // 接口给了 hasMore 就用它，否则按「本页取满」判断
        more: result.hasMore ?? items.length >= ALL_PAGE
      }
    },
    [area, type, order]
  )
  const all = usePagedFeed(`mv-all|${area}|${type}|${order}`, fetchAll, {
    idOf: (mv: Mv) => mv.id
  })
  const { sentinelRef, checkNow } = useInfiniteScroll(all.loadMore)

  const personalizedItems = useMemo(
    () => (personalized.data?.result ?? []).map(toMv),
    [personalized.data]
  )
  const latestItems = useMemo(
    () => (latest.data?.data ?? []).map((item: MvItem) => toMv(item)),
    [latest.data]
  )
  const exclusiveItems = useMemo(
    () => (exclusive.data?.data ?? []).map((item: MvItem) => toMv(item)),
    [exclusive.data]
  )

  const renderGrid = (items: Mv[], loading: boolean, count = SECTION_LIMIT) => (
    <div className="mv-grid">
      {loading
        ? Array.from({ length: count }, (_, index) => <MvCardSkeleton key={index} />)
        : items.map((mv) => <MvCard key={mv.id} mv={mv} />)}
    </div>
  )

  return (
    <div className="page mv-page">
      <SectionHeader title="推荐 MV" />
      {personalized.error && !personalized.loading ? (
        <RequestState error={personalized.error} onRetry={personalized.refresh} />
      ) : (
        renderGrid(personalizedItems, personalized.loading, 4)
      )}

      <SectionHeader className="section-gap" title="最新 MV" />
      {latest.error && !latest.loading ? (
        <RequestState error={latest.error} onRetry={latest.refresh} />
      ) : (
        renderGrid(latestItems, latest.loading)
      )}

      <SectionHeader className="section-gap" title="独家推荐" />
      {exclusive.error && !exclusive.loading ? (
        <RequestState error={exclusive.error} onRetry={exclusive.refresh} />
      ) : (
        renderGrid(exclusiveItems, exclusive.loading)
      )}

      <SectionHeader className="section-gap" title="全部 MV" />

      <div className="mv-page__filters">
        <div className="mv-page__filter-row">
          <span className="mv-page__filter-label">地区</span>
          <FilterChips
            variant="brand"
            options={AREAS}
            value={area}
            onValueChange={(value) => setArea(value as MvArea)}
          />
        </div>
        <div className="mv-page__filter-row">
          <span className="mv-page__filter-label">类型</span>
          <FilterChips
            variant="brand"
            options={TYPES}
            value={type}
            onValueChange={(value) => setType(value as MvType)}
          />
          <span className="mv-page__filter-label mv-page__filter-label--gap">排序</span>
          <FilterChips
            options={ORDERS}
            value={order}
            onValueChange={(value) => setOrder(value as MvOrder)}
          />
        </div>
      </div>

      {all.error && !all.loading ? (
        <RequestState error={all.error} onRetry={all.reload} />
      ) : (
        <>
          <div className="mv-grid">
            {all.loading
              ? Array.from({ length: ALL_PAGE }, (_, index) => (
                  <MvCardSkeleton key={index} />
                ))
              : all.items.map((mv) => <MvCard key={mv.id} mv={mv} />)}
          </div>
          {!all.loading ? (
            <LoadMoreFooter
              loadingMore={all.loadingMore}
              error={all.loadMoreError}
              more={all.more}
              onRetry={() => {
                all.loadMore()
                checkNow()
              }}
              sentinelRef={sentinelRef}
            />
          ) : null}
        </>
      )}
    </div>
  )
}
