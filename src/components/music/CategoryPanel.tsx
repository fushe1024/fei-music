import { cn } from '@/utils'
import type { ApiError } from '@/utils/request'
import type { CatlistGroup } from '@/apis'
import './CategoryPanel.scss'

interface CategoryPanelProps {
  /** 分类 tab，来自 /playlist/catlist 的 categories */
  groups: CatlistGroup[]
  loading?: boolean
  error?: ApiError
  onRetry?: () => void
  activeTab: string
  onTabChange: (tab: string) => void
  /** 当前选中的标签名 */
  selected: string
  onSelect: (name: string) => void
}

/** 「更多分类」展开面板：上方是 catlist 的分类 tab，下方是该分类下的标签。 */
export default function CategoryPanel({
  groups,
  loading = false,
  error,
  onRetry,
  activeTab,
  onTabChange,
  selected,
  onSelect,
}: CategoryPanelProps) {
  if (groups.length === 0) {
    return (
      <div className="category-panel" role="dialog" aria-label="更多分类">
        <div className="category-panel__state">
          <span>{error ? '分类加载失败' : loading ? '分类加载中…' : '暂无分类'}</span>
          {error && onRetry ? (
            <button type="button" className="category-panel__retry" onClick={onRetry}>
              重试
            </button>
          ) : null}
        </div>
      </div>
    )
  }

  const items = groups.find((group) => group.name === activeTab)?.items.map((item) => item.name) ?? []

  return (
    <div className="category-panel" role="dialog" aria-label="更多分类">
      <div className="category-panel__tabs" role="tablist">
        {groups.map((group) => (
          <button
            key={group.name}
            type="button"
            role="tab"
            aria-selected={group.name === activeTab}
            className={cn('category-panel__tab', group.name === activeTab && 'is-active')}
            onClick={() => onTabChange(group.name)}
          >
            {group.name}
          </button>
        ))}
      </div>

      <div className="category-panel__items" role="tabpanel">
        {items.map((name) => (
          <button
            key={name}
            type="button"
            className={cn('category-panel__item', name === selected && 'is-active')}
            onClick={() => onSelect(name)}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  )
}
