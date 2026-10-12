import { useState } from 'react'
import {
  Ellipsis,
  Heart,
  ListMusic,
  Maximize2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuArrow,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Slider } from '@/components/ui/slider'
import { Spinner } from '@/components/ui/spinner'
import QueuePanel from '@/components/layout/QueuePanel'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/utils'
import { formatDuration } from '@/utils'
import { usePlayerStore, PLAY_MODE_LABEL } from '@/store/player'
import './PlayerBar.scss'

export default function PlayerBar() {
  /** 拖动进度条期间的临时值：只在松手时才真正 seek，避免拖动中反复跳转产生杂音 */
  const [dragValue, setDragValue] = useState<number | null>(null)

  const current = usePlayerStore((state) => state.current)
  const isPlaying = usePlayerStore((state) => state.isPlaying)
  const loading = usePlayerStore((state) => state.loading)
  const progress = usePlayerStore((state) => state.progress)
  const duration = usePlayerStore((state) => state.duration)
  const error = usePlayerStore((state) => state.error)
  const toggle = usePlayerStore((state) => state.toggle)
  const seek = usePlayerStore((state) => state.seek)
  const next = usePlayerStore((state) => state.next)
  const prev = usePlayerStore((state) => state.prev)
  const queue = usePlayerStore((state) => state.queue)
  const queueOpen = usePlayerStore((state) => state.queueOpen)
  const setQueueOpen = usePlayerStore((state) => state.setQueueOpen)
  const playMode = usePlayerStore((state) => state.playMode)
  const cyclePlayMode = usePlayerStore((state) => state.cyclePlayMode)
  const notify = usePlayerStore((state) => state.notify)
  const volume = usePlayerStore((state) => state.volume)
  const muted = usePlayerStore((state) => state.muted)
  const setVolume = usePlayerStore((state) => state.setVolume)
  const toggleMute = usePlayerStore((state) => state.toggleMute)
  const setFullscreen = usePlayerStore((state) => state.setFullscreen)

  /** 静音时滑块显示 0，音量图标跟着音量档位变化 */
  const volumeValue = muted ? 0 : volume
  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2
  /** 还没选歌时（占位状态）播放键不可点 */
  const hasSong = Boolean(current.id)

  return (
    <footer className="player">
      <div className="player__inner">
        <div className="player__info">
          <button
            type="button"
            className="player__cover-wrap"
            aria-label="打开全屏播放"
            onClick={() => setFullscreen(true)}
          >
            <img className="player__cover" src={current.cover} alt={current.title} />
            <span className="player__cover-mask">
              <Maximize2 aria-hidden="true" />
            </span>
          </button>
          <div className="player__meta">
            <span className="player__title-line">
              <span className="player__title text-ellipsis">{current.title}</span>
              {current.vip ? <span className="player__vip">VIP</span> : null}
            </span>
            {/* 占位状态下没有歌手信息，不显示空行 */}
            {current.artists.length > 0 ? (
              <span className="player__artists text-ellipsis">
                {error ?? current.artists.join(' / ')}
              </span>
            ) : null}
          </div>
        </div>

        <div className="player__center">
          <div className="player__controls">
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="player__icon-btn" aria-label="喜欢">
                  <Heart />
                </button>
              </TooltipTrigger>
              <TooltipContent>喜欢</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="player__icon-btn"
                  aria-label="上一首"
                  onClick={() => prev()}
                >
                  <SkipBack />
                </button>
              </TooltipTrigger>
              <TooltipContent>上一首</TooltipContent>
            </Tooltip>

            <button
              type="button"
              className={cn('player__play', loading && 'is-loading')}
              onClick={toggle}
              disabled={!hasSong}
              aria-label={isPlaying ? '暂停' : '播放'}
              aria-busy={loading}
            >
              {loading ? (
                <Spinner className="player__spinner" />
              ) : isPlaying ? (
                <Pause />
              ) : (
                <Play />
              )}
            </button>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="player__icon-btn"
                  aria-label="下一首"
                  onClick={() => next()}
                >
                  <SkipForward />
                </button>
              </TooltipTrigger>
              <TooltipContent>下一首</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="player__icon-btn"
                  aria-label={PLAY_MODE_LABEL[playMode]}
                  onClick={() => notify(`已切换为${PLAY_MODE_LABEL[cyclePlayMode()]}`)}
                >
                  {playMode === 'repeat' ? (
                    <Repeat1 />
                  ) : playMode === 'shuffle' ? (
                    <Shuffle />
                  ) : (
                    <Repeat />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>{PLAY_MODE_LABEL[playMode]}</TooltipContent>
            </Tooltip>
          </div>

          <div className="player__progress">
            {/* 拖动中显示手指位置，松手后才真正跳转 */}
            <span className="player__time">
              {formatDuration(dragValue ?? progress)}
            </span>
            <Slider
              className="player__slider"
              value={[Math.min(dragValue ?? progress, duration)]}
              max={duration}
              step={1}
              // 拖动过程只更新显示，不动音频（后台照常播放，也不会因为反复跳转出杂音）
              onValueChange={([value]) => setDragValue(value)}
              // 松手才跳转；如果当时是暂停状态，跳完自动接着播
              onValueCommit={([value]) => {
                setDragValue(null)
                seek(value)
                const { isPlaying, toggle } = usePlayerStore.getState()
                if (!isPlaying) {
                  toggle()
                }
              }}
              aria-label="播放进度"
            />
            <span className="player__time">{formatDuration(duration)}</span>
          </div>
        </div>

        <div className="player__actions">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="player__icon-btn" aria-label="更多操作">
                <Ellipsis />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="player__menu">
              <DropdownMenuItem>添加到歌单</DropdownMenuItem>
              <DropdownMenuItem>下载</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>查看歌曲评论</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="player__queue-anchor">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className={cn('player__icon-btn', queueOpen && 'is-active')}
                  aria-label="播放列表"
                  aria-expanded={queueOpen}
                  onClick={() => setQueueOpen(!queueOpen)}
                >
                  <ListMusic />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {queue.length > 0 ? `播放列表（${queue.length}）` : '播放列表'}
              </TooltipContent>
            </Tooltip>
            {/* 面板贴在按钮正上方弹出 */}
            <QueuePanel />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="player__icon-btn"
                aria-label={muted ? '取消静音' : '静音'}
              >
                <VolumeIcon />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="player__volume">
              <div className="player__volume-panel">
                <Slider
                  className="player__volume-slider"
                  orientation="vertical"
                  value={[Math.round(volumeValue * 100)]}
                  max={100}
                  step={1}
                  onValueChange={([value]) => setVolume(value / 100)}
                  aria-label="音量"
                />
                {/* 百分比放在进度条下面 */}
                <span className="player__volume-value">{Math.round(volumeValue * 100)}%</span>
              </div>
              <div className="player__volume-divider" />
              <button
                type="button"
                className="player__volume-mute"
                aria-label={muted ? '取消静音' : '静音'}
                onClick={toggleMute}
              >
                <VolumeIcon aria-hidden="true" />
              </button>
              <DropdownMenuArrow className="player__volume-arrow" width={14} height={7} />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </footer>
  )
}
