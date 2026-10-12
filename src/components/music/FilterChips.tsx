import { ChevronDown } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/utils'
import './FilterChips.scss'

interface FilterChipsProps {
  options: string[]
  /** 非受控初始值 */
  defaultValue?: string
  /** 受控值（传入即受控） */
  value?: string
  onValueChange?: (value: string) => void
  /** default：白底描边（选中仅描边略深）；brand：选中为品牌色底 */
  variant?: 'default' | 'brand'
  className?: string
}

/** 设计图中的胶囊筛选标签，基于 shadcn Tabs 实现（支持受控 / 非受控）。 */
export default function FilterChips({
  options,
  defaultValue,
  value,
  onValueChange,
  variant = 'default',
  className,
}: FilterChipsProps) {
  return (
    <Tabs
      value={value}
      defaultValue={defaultValue ?? value}
      onValueChange={onValueChange}
      className={cn('chips', `chips--${variant}`, className)}
    >
      <TabsList className="chips__list">
        {options.map((option) => (
          <TabsTrigger key={option} value={option} className="chips__item">
            {option}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}

interface MoreChipProps {
  label?: string
  /** 面板是否展开：控制箭头方向 */
  isOpen?: boolean
  /** 是否高亮：展开中，或当前筛选来自面板 */
  highlighted?: boolean
  onClick?: () => void
}

/** 「更多分类」入口标签：默认与普通胶囊一致，展开中或筛选来自面板时整体高亮 */
export function MoreChip({
  label = '更多分类',
  isOpen = false,
  highlighted = false,
  onClick,
}: MoreChipProps) {
  return (
    <button
      type="button"
      className={cn('chips__more', isOpen && 'is-open', highlighted && 'is-active')}
      aria-expanded={isOpen}
      onClick={onClick}
    >
      {label}
      <ChevronDown aria-hidden="true" />
    </button>
  )
}
