import { Music2, Play } from 'lucide-react'
import { cn } from '@/utils'
import './FeatureCard.scss'

/** 封面加载失败时的兜底渐变（取自设计图，按顺序循环） */
export const RANK_GRADIENTS = [
  'linear-gradient(150deg, #f4541f 0%, #f4736d 55%, #fab0a7 100%)',
  'linear-gradient(150deg, #4131c4 0%, #26227b 55%, #2f2e9f 100%)',
  'linear-gradient(150deg, #050716 0%, #c35a22 60%, #fcb934 100%)',
  'linear-gradient(150deg, #0e2018 0%, #499349 55%, #d6b867 100%)',
  'linear-gradient(150deg, #3fa0eb 0%, #1e57be 50%, #74d2d9 100%)',
]

const LATIN = /[A-Za-z0-9]/

/**
 * 长名字按两行排（设计图里卡片标题都是两行，且第一行偏短，例如「全网 / 热歌榜」）。
 * 折行点尽量靠近中间，但不把英文/数字从中间切开（否则会出现「黑胶VI / P爱听榜」）。
 */
export function splitTitle(name: string, maxChars = 4): string[] {
  if (name.length <= maxChars) {
    return [name]
  }

  const target = name.length / 2
  let cut = 0
  for (let i = 1; i < name.length; i += 1) {
    // 断点落在英文/数字串中间（前后都是拉丁字符）时跳过
    if (LATIN.test(name[i - 1]) && LATIN.test(name[i])) {
      continue
    }
    // 更靠近中间者胜出；同样近时保留靠前的位置（第一行更短）
    if (cut === 0 || Math.abs(i - target) < Math.abs(cut - target)) {
      cut = i
    }
  }

  if (cut === 0) {
    cut = Math.ceil(name.length / 2)
  }
  return [name.slice(0, cut), name.slice(cut)]
}

interface FeatureCardProps {
  /** 榜单名 */
  title: string
  /** 榜单封面（接口 coverImgUrl），作为卡片底图 */
  cover?: string
  /** 封面加载失败时的兜底渐变 */
  gradient: string
  /** 点击播放该榜单 */
  onPlay?: () => void
  /** 正在拉取曲目 */
  playing?: boolean
  className?: string
}

export default function FeatureCard({
  title,
  cover,
  gradient,
  onPlay,
  playing = false,
  className,
}: FeatureCardProps) {
  const lines = splitTitle(title)

  return (
    <button
      type="button"
      className={cn('feature-card', className)}
      style={{ backgroundImage: gradient }}
      aria-label={`打开 ${title}`}
      onClick={onPlay}
    >
      {cover ? (
        <img className="feature-card__cover" src={cover} alt="" loading="lazy" />
      ) : null}
      <span className="feature-card__badge">
        <Music2 aria-hidden="true" />
      </span>
      {/*
        接口返回的榜单封面本身就是带榜单名的渐变图，所以有封面时不再叠一层标题（避免同一个名字出现两次）；
        只有在没有封面、走渐变兜底时才显示两行标题。
      */}
      {cover ? null : (
        <span className="feature-card__text">
          {lines.map((line, index) => (
            <span key={line + index} className="feature-card__line">
              {line}
            </span>
          ))}
        </span>
      )}
      <span className={cn('feature-card__play', playing && 'is-playing')}>
        <Play aria-hidden="true" />
      </span>
    </button>
  )
}

/** 首屏骨架：与真实卡片同尺寸 */
export function FeatureCardSkeleton() {
  return <div className="feature-card feature-card--skeleton" aria-hidden="true" />
}
