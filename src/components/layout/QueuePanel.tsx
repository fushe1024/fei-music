import { useEffect, useRef } from 'react'
import { Ellipsis, Heart, ListMusic, Play, Plus, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn, formatDuration } from '@/utils'
import { usePlayerStore } from '@/store/player'
import './QueuePanel.scss'

/**
 * 播放列表面板（设计图）：右侧抽屉。
 * 顶部「播放列表」+ 添加到 / 清空，下面「歌曲｜共 N 首 / 时长」和队列行；
 * 当前播放的一行高亮、歌名用主色，悬停出现喜欢与更多操作。
 */
export default function QueuePanel() {
  const open = usePlayerStore((state) => state.queueOpen)
  const setQueueOpen = usePlayerStore((state) => state.setQueueOpen)
  const queue = usePlayerStore((state) => state.queue)
  const currentId = usePlayerStore((state) => state.current.id)
  const play = usePlayerStore((state) => state.play)
  const toggle = usePlayerStore((state) => state.toggle)
  const isPlaying = usePlayerStore((state) => state.isPlaying)
  const playNext = usePlayerStore((state) => state.playNext)
  const removeFromQueue = usePlayerStore((state) => state.removeFromQueue)
  const clearQueue = usePlayerStore((state) => state.clearQueue)
  const notify = usePlayerStore((state) => state.notify)

  const listRef = useRef<HTMLUListElement>(null)

  // Esc 收起
  useEffect(() => {
    if (!open) {
      return
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setQueueOpen(false)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, setQueueOpen])

  /**
   * 点面板外面任何地方（其它按钮、播放键、搜索框、导航…）都收起面板。
   * 用捕获阶段的 pointerdown：先关面板再执行被点按钮自己的逻辑；
   * Radix 的触发器会在 pointerdown 里 preventDefault，用 mousedown 会漏掉它们，所以监听 pointerdown。
   * 触发按钮本身要排除，否则会「先关掉又被 toggle 打开」。
   */
  useEffect(() => {
    if (!open) {
      return
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) {
        return
      }
      if (target.closest('.queue-panel') || target.closest('[aria-label="播放列表"]')) {
        return
      }
      setQueueOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [open, setQueueOpen])

  // 打开时把当前播放的那首滚进视野
  useEffect(() => {
    if (!open) {
      return
    }
    listRef.current
      ?.querySelector('.queue-row.is-playing')
      ?.scrollIntoView({ block: 'center' })
  }, [open, currentId])

  return (
    <aside
      className={cn('queue-panel', open && 'is-open')}
      aria-hidden={!open}
      aria-label="播放列表"
    >
      <div className="queue-panel__head">
        <h2 className="queue-panel__title">播放列表</h2>
        <div className="queue-panel__head-actions">
          <button
            type="button"
            className="queue-panel__head-btn"
            onClick={() => notify('暂不支持添加到歌单')}
          >
            <Plus aria-hidden="true" />
            添加到
          </button>
          <button
            type="button"
            className="queue-panel__head-btn"
            disabled={queue.length === 0}
            onClick={() => {
              clearQueue()
              notify('已清空播放列表')
            }}
          >
            <Trash2 aria-hidden="true" />
            清空
          </button>
        </div>
      </div>

      <div className="queue-panel__sub">
        <span>
          歌曲
          <span className="queue-panel__count">｜共 {queue.length} 首</span>
        </span>
        <span className="queue-panel__sub-duration">时长</span>
      </div>

      <ul className="queue-panel__list" ref={listRef}>
        {queue.map((song) => (
          <li
            key={song.id}
            className={cn('queue-row', song.id === currentId && 'is-playing')}
            data-song-id={song.id}
          >
            <span className="queue-row__art" onClick={() => play(song)}>
              <img src={song.cover} alt="" loading="lazy" />
              {/* 正在播放的一行：悬停封面上出现遮罩按钮（playing.webp），点击暂停/继续 */}
              {song.id === currentId ? (
                <button
                  type="button"
                  className="queue-row__mask"
                  aria-label={isPlaying ? '暂停' : '播放'}
                  onClick={(event) => {
                    event.stopPropagation()
                    toggle()
                  }}
                >
                  {isPlaying ? (
                    <img
                      className="queue-row__mask-icon"
                      src="/assets/playing.webp"
                      alt=""
                    />
                  ) : (
                    <Play
                      className="queue-row__mask-icon queue-row__mask-icon--play"
                      aria-hidden="true"
                    />
                  )}
                </button>
              ) : null}
            </span>

            <button
              type="button"
              className="queue-row__main"
              onClick={() => play(song)}
              title={song.title}
            >
              <span className="queue-row__info">
                <span className="queue-row__title text-ellipsis">{song.title}</span>
                <span className="queue-row__artists text-ellipsis">
                  {song.artists.join(' / ')}
                </span>
              </span>
            </button>

            <span className="queue-row__actions">
              <button type="button" className="queue-row__action" aria-label="喜欢">
                <Heart aria-hidden="true" />
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="queue-row__action" aria-label="更多操作">
                    <Ellipsis aria-hidden="true" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="queue-panel__menu">
                  <DropdownMenuItem onClick={() => playNext(song.id)}>
                    下一首播放
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => play(song)}>立即播放</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => removeFromQueue(song.id)}>
                    从列表移除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </span>

            <span className="queue-row__duration">{formatDuration(song.duration)}</span>
          </li>
        ))}
      </ul>

      {queue.length === 0 ? (
        <div className="queue-panel__empty">
          <ListMusic aria-hidden="true" />
          <p>播放列表还是空的</p>
          <span>去歌单或排行榜点一首歌试试</span>
        </div>
      ) : null}
    </aside>
  )
}
