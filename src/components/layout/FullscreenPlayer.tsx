import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import {
  ChevronDown,
  Ellipsis,
  Heart,
  ListMusic,
  Minimize2,
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
import { getLyric, getLyricNew } from '@/apis'
import {
  addWordTimings,
  findLyricIndex,
  parseLyric,
  parseYrc,
  type LyricLine
} from '@/utils/lyric'
import { themeForSong } from '@/utils/theme'
import { getAudioTime, usePlayerStore, PLAY_MODE_LABEL } from '@/store/player'
import QueuePanel from '@/components/layout/QueuePanel'
import { useRequest } from '@/hooks/use-request'
import './FullscreenPlayer.scss'

/** 歌词缓存：同一首歌反复进入全屏不再请求（空结果也缓存，避免反复打接口） */
const lrcCache = new Map<string, LyricLine[]>()
const yrcCache = new Map<string, { yrc: LyricLine[]; lrc: LyricLine[] }>()

/** 全屏播放页。底部控制条与 PlayerBar 不共用组件；音量区为左静音 + 右拖动 */
export default function FullscreenPlayer() {
  const open = usePlayerStore((state) => state.fullscreen)
  const setFullscreen = usePlayerStore((state) => state.setFullscreen)
  const current = usePlayerStore((state) => state.current)
  const isPlaying = usePlayerStore((state) => state.isPlaying)
  const progress = usePlayerStore((state) => state.progress)
  const duration = usePlayerStore((state) => state.duration)
  const volume = usePlayerStore((state) => state.volume)
  const muted = usePlayerStore((state) => state.muted)
  const setVolume = usePlayerStore((state) => state.setVolume)
  const toggleMute = usePlayerStore((state) => state.toggleMute)
  const toggle = usePlayerStore((state) => state.toggle)
  const next = usePlayerStore((state) => state.next)
  const prev = usePlayerStore((state) => state.prev)
  const seek = usePlayerStore((state) => state.seek)
  const queue = usePlayerStore((state) => state.queue)
  const queueOpen = usePlayerStore((state) => state.queueOpen)
  const setQueueOpen = usePlayerStore((state) => state.setQueueOpen)
  const playMode = usePlayerStore((state) => state.playMode)
  const cyclePlayMode = usePlayerStore((state) => state.cyclePlayMode)
  const notify = usePlayerStore((state) => state.notify)

  /** 每首歌固定一套渐变主题（同一个 id 永远同色，不随开关切换） */
  const theme = useMemo(() => themeForSong(current.id), [current.id])

  /** 关闭时先播「自上而下收缩」动画，动画结束再卸载 */
  const [closing, setClosing] = useState(false)
  const close = useCallback(() => {
    setClosing(true)
    window.setTimeout(() => {
      setClosing(false)
      setFullscreen(false)
    }, 280)
  }, [setFullscreen])

  /** 还没选歌（占位状态）：不取歌词、播放键不可点 */
  const hasSong = Boolean(current.id)

  // 歌词两个接口并发：/lyric 快，先把歌词显示出来；/lyric/new 的逐字数据到了再替换
  const legacyLyric = useRequest(
    async (signal) => {
      if (!hasSong) {
        return [] as LyricLine[]
      }
      const cached = lrcCache.get(current.id)
      if (cached) {
        return cached
      }
      const result = await getLyric({ id: current.id, signal })
      // 老接口只有整行时间，按字数均分补出「逐字」，歌词一样能逐字高亮
      const parsed = addWordTimings(parseLyric(result.lrc?.lyric ?? ''))
      lrcCache.set(current.id, parsed)
      return parsed
    },
    [current.id]
  )

  const freshLyric = useRequest(
    async (signal) => {
      if (!hasSong) {
        return { yrc: [] as LyricLine[], lrc: [] as LyricLine[] }
      }
      const cached = yrcCache.get(current.id)
      if (cached) {
        return cached
      }
      const result = await getLyricNew({ id: current.id, signal })
      const value = {
        yrc: parseYrc(result.yrc?.lyric ?? ''),
        lrc: addWordTimings(parseLyric(result.lrc?.lyric ?? ''))
      }
      yrcCache.set(current.id, value)
      return value
    },
    [current.id]
  )

  const lines = useMemo(() => {
    const fresh = freshLyric.data
    if (fresh?.yrc.length) {
      return fresh.yrc
    }
    if (fresh?.lrc.length) {
      return fresh.lrc
    }
    return legacyLyric.data ?? []
  }, [freshLyric.data, legacyLyric.data])

  const lyricLoading = !freshLyric.data && !legacyLyric.data && hasSong
  const activeIndex = findLyricIndex(lines, progress)

  // 当前行滚到 pane 顶部与播放条之间的中点（设计图红线处），而不是歌词列表自身的中点
  const lyricRef = useRef<HTMLUListElement>(null)
  useEffect(() => {
    const list = lyricRef.current
    const line = list?.querySelector<HTMLElement>('.fullscreen-player__line.is-active')
    if (!list || !line) {
      return
    }
    const pane = list.closest<HTMLElement>('.fullscreen-player__lyric-pane')
    const bar = document.querySelector<HTMLElement>('.fullscreen-player__bottom')
    const lineBox = line.getBoundingClientRect()
    const paneTop = (pane ?? list).getBoundingClientRect().top
    const barTop = bar?.getBoundingClientRect().top ?? window.innerHeight
    const target = (paneTop + barTop) / 2
    const delta = lineBox.top + lineBox.height / 2 - target
    if (Math.abs(delta) < 1) {
      return
    }
    list.scrollTo({ top: Math.max(0, list.scrollTop + delta), behavior: 'smooth' })
  }, [activeIndex, lines.length])

  // 逐字高亮：用 rAF 直接改当前行每个字的 CSS 变量（不动 React 状态，避免整页重渲染）
  const activeLineRef = useRef<HTMLLIElement>(null)
  useEffect(() => {
    const paint = (time: number) => {
      const node = activeLineRef.current
      if (!node) {
        return
      }
      for (const word of node.querySelectorAll<HTMLElement>('[data-word-start]')) {
        const start = Number(word.dataset.wordStart)
        const end = Number(word.dataset.wordEnd)
        const ratio =
          end > start
            ? Math.min(1, Math.max(0, (time - start) / (end - start)))
            : time >= start
              ? 1
              : 0
        word.style.setProperty('--word-p', ratio.toFixed(3))
      }
    }

    if (!isPlaying) {
      paint(getAudioTime())
      return
    }
    let raf = 0
    const tick = () => {
      paint(getAudioTime())
      raf = window.requestAnimationFrame(tick)
    }
    raf = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(raf)
  }, [isPlaying, activeIndex])

  // 进度条：拖动中只改显示，松手才跳转；暂停态松手后自动续播
  const barRef = useRef<HTMLDivElement>(null)
  const [dragValue, setDragValue] = useState<number | null>(null)
  /** 是否正在拖动（不依赖 hasPointerCapture，合成事件下也可靠） */
  const [dragging, setDragging] = useState(false)
  const shown = dragValue ?? progress
  const percent = duration > 0 ? Math.min(100, Math.max(0, (shown / duration) * 100)) : 0

  const ratioFromEvent = (clientX: number) => {
    const rect = barRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0) {
      return 0
    }
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
  }

  const commit = (ratio: number) => {
    setDragValue(null)
    seek(ratio * duration)
    const { isPlaying: playing, toggle: resume } = usePlayerStore.getState()
    if (!playing) {
      resume()
    }
  }

  if (!open && !closing) {
    return null
  }

  const volumeValue = muted ? 0 : volume
  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2

  return (
    <div
      className={closing ? 'fullscreen-player is-closing' : 'fullscreen-player'}
      style={
        {
          backgroundImage: theme.background,
          '--fs-fade': theme.bottom,
          '--fs-progress': theme.progress,
        } as CSSProperties
      }
    >
      <button
        type="button"
        className="fullscreen-player__collapse"
        aria-label="收起全屏播放"
        onClick={close}
      >
        <ChevronDown />
      </button>

      <div className="fullscreen-player__body">
        <div className="fullscreen-player__disc-wrap">
          {/* 结构同参考实现：vinyl-cover（player-bg.png 当底）里放 album-cover */}
          <div className={isPlaying ? 'fullscreen-player__disc is-playing' : 'fullscreen-player__disc'}>
            <img
              className="fullscreen-player__disc-art"
              src={current.cover}
              alt={current.title}
            />
          </div>
        </div>

        <div className="fullscreen-player__lyric-pane">
          <h2 className="fullscreen-player__song">{current.title}</h2>
          <p className="fullscreen-player__artist">{current.artists.join(' / ')}</p>
          {lines.length > 0 ? (
            <ul className="fullscreen-player__lyrics" ref={lyricRef}>
              {lines.map((line, index) => {
                const isActive = index === activeIndex
                return (
                  <li
                    key={`${line.time}-${index}`}
                    ref={isActive ? activeLineRef : undefined}
                    className={
                      isActive
                        ? 'fullscreen-player__line is-active'
                        : 'fullscreen-player__line'
                    }
                  >
                    {/* 当前行且有逐字信息：按字拆开，rAF 驱动逐字高亮 */}
                    {isActive && line.words?.length
                      ? line.words.map((word, wordIndex) => (
                          <span
                            key={`${word.start}-${wordIndex}`}
                            className="fullscreen-player__word"
                            data-word-start={word.start}
                            data-word-end={word.end}
                          >
                            {word.text}
                          </span>
                        ))
                      : line.text}
                  </li>
                )
              })}
            </ul>
          ) : hasSong ? (
            <p className="fullscreen-player__lyric-empty">
              {lyricLoading ? '歌词加载中…' : '暂无歌词'}
            </p>
          ) : null}
        </div>
      </div>

      <div className="fullscreen-player__bottom">
        {/* 底栏上沿：一条与背景同色的渐隐，让歌词自然融进底栏 */}
        <div className="fullscreen-player__fade" aria-hidden="true" />

        {/* 全宽进度条，同时充当底栏的上边框 */}
        <div
          className="fullscreen-player__bar"
          ref={barRef}
          role="slider"
          tabIndex={0}
          aria-label="播放进度"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(shown)}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture?.(event.pointerId)
            setDragging(true)
            setDragValue(ratioFromEvent(event.clientX) * duration)
          }}
          onPointerMove={(event) => {
            if (!dragging) {
              return
            }
            setDragValue(ratioFromEvent(event.clientX) * duration)
          }}
          onPointerUp={(event) => {
            if (!dragging) {
              return
            }
            setDragging(false)
            commit(ratioFromEvent(event.clientX))
          }}
          onPointerCancel={() => {
            setDragging(false)
            setDragValue(null)
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight') {
              commit(Math.min(1, (shown + 5) / Math.max(1, duration)))
            }
            if (event.key === 'ArrowLeft') {
              commit(Math.max(0, (shown - 5) / Math.max(1, duration)))
            }
          }}
        >
          <div className="fullscreen-player__bar-fill" style={{ width: `${percent}%` }} />
          <span className="fullscreen-player__bar-thumb" style={{ left: `${percent}%` }} />
        </div>

        <div className="fullscreen-player__controls">
          <div className="fullscreen-player__now">
            {/* 与外面「打开全屏」按钮同款位置，只显示 icon（不放封面图） */}
            <button
              type="button"
              className="fullscreen-player__shrink"
              aria-label="收起全屏播放"
              onClick={close}
            >
              <Minimize2 aria-hidden="true" />
            </button>
            <div className="fullscreen-player__now-text">
              <span className="fullscreen-player__now-title-line">
                <span className="fullscreen-player__now-title text-ellipsis">
                  {current.title}
                </span>
                {current.vip ? <span className="fullscreen-player__vip">VIP</span> : null}
              </span>
              {current.artists.length > 0 ? (
                <span className="fullscreen-player__now-artist text-ellipsis">
                  {current.artists.join(' / ')}
                </span>
              ) : null}
            </div>
          </div>

          <div className="fullscreen-player__buttons">
            <button type="button" className="fullscreen-player__icon-btn" aria-label="喜欢">
              <Heart />
            </button>
            <button
              type="button"
              className="fullscreen-player__icon-btn"
              aria-label="上一首"
              onClick={prev}
            >
              <SkipBack />
            </button>
            <button
              type="button"
              className="fullscreen-player__play"
              aria-label={isPlaying ? '暂停' : '播放'}
              disabled={!hasSong}
              onClick={toggle}
            >
              {isPlaying ? <Pause /> : <Play />}
            </button>
            <button
              type="button"
              className="fullscreen-player__icon-btn"
              aria-label="下一首"
              onClick={() => next()}
            >
              <SkipForward />
            </button>
            <button
              type="button"
              className="fullscreen-player__icon-btn"
              aria-label={PLAY_MODE_LABEL[playMode]}
              title={PLAY_MODE_LABEL[playMode]}
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
          </div>

          <div className="fullscreen-player__side">
            <button type="button" className="fullscreen-player__icon-btn" aria-label="更多操作">
              <Ellipsis />
            </button>
            <div className="fullscreen-player__queue-anchor">
              <button
                type="button"
                className="fullscreen-player__icon-btn"
                aria-label="播放列表"
                aria-expanded={queueOpen}
                onClick={() => setQueueOpen(!queueOpen)}
              >
                <ListMusic />
              </button>
              <QueuePanel />
            </div>
            <span className="fullscreen-player__queue-count">{queue.length}</span>

            {/* 音量区：左边静音/取消静音，右边拖动调音量 */}
            <div className="fullscreen-player__volume">
              <button
                type="button"
                className="fullscreen-player__icon-btn"
                aria-label={muted ? '取消静音' : '静音'}
                onClick={toggleMute}
              >
                <VolumeIcon />
              </button>
              <input
                className="fullscreen-player__volume-range"
                type="range"
                min={0}
                max={100}
                step={1}
                value={Math.round(volumeValue * 100)}
                aria-label="音量"
                onChange={(event) => setVolume(Number(event.target.value) / 100)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
