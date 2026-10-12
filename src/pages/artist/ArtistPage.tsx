import { useEffect, useState } from 'react'
import type { ArtistArea, ArtistType } from '@/apis'
import ArtistCard, { ArtistCardSkeleton } from '@/components/music/ArtistCard'
import FilterChips from '@/components/music/FilterChips'
import LoadMoreFooter from '@/components/music/LoadMoreFooter'
import RequestState from '@/components/music/RequestState'
import { Separator } from '@/components/ui/separator'
import { artistFilters, artistLetters } from '@/constants/artist'
import { useArtistFeed } from '@/hooks/use-artist-feed'
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll'
import { cn } from '@/utils'
import './ArtistPage.scss'

/** 每页 50 个（两个接口都按 54 取） */
const PAGE_SIZE = 54
/** 首屏骨架：3 行 */
const SKELETON_COUNT = 18
const HOT = '热门'

/** 设计图的三档地区 + 「全部」-> 接口 area（-1 全部；日韩 = 日本 8 + 韩国 16，合并取数） */
const AREA_MAP: Record<string, ArtistArea[]> = {
  全部: [-1],
  华语: [7],
  欧美: [96],
  日韩: [8, 16]
}

/** 设计图的三档类型 + 「全部」-> 接口 type（-1 全部） */
const TYPE_MAP: Record<string, ArtistType> = {
  全部: -1,
  男: 1,
  女: 2,
  组合: 3
}

export default function ArtistPage() {
  const [areaLabel, setAreaLabel] = useState(
    artistFilters[0]?.defaultValue ?? '全部'
  )
  const [typeLabel, setTypeLabel] = useState(
    artistFilters[1]?.defaultValue ?? '全部'
  )
  /** 索引项：「热门」（initial=-1）/「#」（initial=0）/ A-Z */
  const [initial, setInitial] = useState<string>(HOT)

  const feed = useArtistFeed(
    {
      initial,
      areas: AREA_MAP[areaLabel] ?? [-1],
      type: TYPE_MAP[typeLabel] ?? -1
    },
    PAGE_SIZE
  )
  const { sentinelRef, checkNow } = useInfiniteScroll(feed.loadMore)

  // 追加完成后如果哨兵还在视口里（内容不够高），继续补齐下一页
  useEffect(() => {
    if (!feed.loading && !feed.loadingMore) {
      checkNow()
    }
  }, [feed.items.length, feed.loading, feed.loadingMore, checkNow])

  const selectHot = () => setInitial(HOT)

  const selectLetter = (letter: string) => setInitial(letter)

  const selectArea = (label: string) => setAreaLabel(label)

  const selectType = (label: string) => setTypeLabel(label)

  return (
    <div className="page artist-page">
      <div className="artist-page__filters">
        <FilterChips
          variant="brand"
          options={artistFilters[0]?.options ?? []}
          value={areaLabel}
          onValueChange={selectArea}
        />
        <FilterChips
          variant="brand"
          options={artistFilters[1]?.options ?? []}
          value={typeLabel}
          onValueChange={selectType}
        />
      </div>

      <div className="artist-page__index">
        <button
          type="button"
          className={cn('artist-page__hot', initial === HOT && 'is-active')}
          onClick={selectHot}
        >
          热门
        </button>
        <Separator
          orientation="vertical"
          className="artist-page__index-divider"
        />
        <ul className="artist-page__letters">
          {artistLetters.map((item) => (
            <li key={item}>
              <button
                type="button"
                className={cn(
                  'artist-page__letter',
                  initial === item && 'is-active'
                )}
                onClick={() => selectLetter(item)}
              >
                {item}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {feed.error && !feed.loading ? (
        <RequestState error={feed.error} onRetry={feed.reload} />
      ) : feed.loading ? (
        <div className="artist-page__grid">
          {Array.from({ length: SKELETON_COUNT }, (_, index) => (
            <ArtistCardSkeleton key={index} />
          ))}
        </div>
      ) : feed.items.length === 0 ? (
        <div className="artist-page__empty">
          该筛选下暂时没有歌手，换个条件试试
        </div>
      ) : (
        <>
          <div className="artist-page__grid">
            {feed.items.map((artist) => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </div>
          <LoadMoreFooter
            loadingMore={feed.loadingMore}
            error={feed.loadMoreError}
            more={feed.more}
            onRetry={feed.loadMore}
            sentinelRef={sentinelRef}
          />
        </>
      )}
    </div>
  )
}
