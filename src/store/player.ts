import { create } from 'zustand'
import { getSongUrl, normalizeUrl, type SongLevel } from '@/apis'
import { defaultProgress, placeholderSong } from '@/constants/player'
import type { Song } from '@/types/music'

/** 默认音质：极高 */
const DEFAULT_LEVEL: SongLevel = 'exhigh'

/** 播放模式：顺序播放 / 单曲循环 / 随机播放 */
export type PlayMode = 'order' | 'repeat' | 'shuffle'

/** 模式中文名（提示、aria-label 都用它） */
export const PLAY_MODE_LABEL: Record<PlayMode, string> = {
  order: '顺序播放',
  repeat: '单曲循环',
  shuffle: '随机播放'
}

/** 点击时的轮换顺序 */
const PLAY_MODE_ORDER: PlayMode[] = ['order', 'repeat', 'shuffle']

/** 每次 play() 自增，用于丢弃「切歌期间」的过期结果 */
let playGeneration = 0

/** 轻提示的自动消失定时器 */
let noticeTimer: number | undefined

interface PlayerStore {
  /** 当前播放歌曲 */
  current: Song
  isPlaying: boolean
  /** 正在取播放地址 */
  loading: boolean
  /** 当前播放进度（秒） */
  progress: number
  /** 实际时长（秒），音频元数据到了之后以它为准 */
  duration: number
  /** 取不到播放地址等提示 */
  error?: string
  /** 音量 0~1 */
  volume: number
  /** 是否静音（静音时保留 volume，取消静音按它恢复） */
  muted: boolean
  /** 全屏播放页是否打开 */
  fullscreen: boolean
  /** 播放队列 */
  queue: Song[]
  /** 最近播放过的曲子（新的在后），随机播放的「上一首」靠它回到真正上一首 */
  recent: Song[]
  /** 播放列表面板是否打开 */
  queueOpen: boolean
  /** 轻提示（无法播放等），2.6s 后自动消失 */
  notice: string
  play: (song: Song) => void
  toggle: () => void
  seek: (seconds: number) => void
  appendQueue: (songs: Song[]) => void
  /** 下一首播放（把队列里的某首挪到当前之后） */
  playNext: (id: string) => void
  /** 从播放列表移除 */
  removeFromQueue: (id: string) => void
  /** 清空播放列表 */
  clearQueue: () => void
  setQueueOpen: (open: boolean) => void
  /** 播放模式 */
  playMode: PlayMode
  setPlayMode: (mode: PlayMode) => void
  /** 顺序 → 单曲 → 随机 轮换，返回新模式（方便提示） */
  cyclePlayMode: () => PlayMode
  /** auto=true 表示「播完自动切」，单曲循环与顺序播放到末尾的行为依赖它 */
  next: (options?: { auto?: boolean }) => void
  prev: () => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  setFullscreen: (open: boolean) => void
  notify: (message: string) => void
}

/** 播放地址缓存：id -> url（只存能播的，负结果不缓存，见 resolveUrl） */
const urlCache = new Map<string, string>()

/** 默认音量 15% */
const DEFAULT_VOLUME = 0.15

/** 静音前记录的音量，取消静音时恢复 */
let volumeBeforeMute = DEFAULT_VOLUME

let audio: HTMLAudioElement | null = null

/** 当前音频真实播放时间（秒）。逐字歌词需要比 timeupdate 更高的频率，直接读 audio.currentTime */
export function getAudioTime(): number {
  return audio?.currentTime ?? 0
}

/** 单例 <audio>，把音频事件同步回 store */
function getAudio(): HTMLAudioElement | null {  if (typeof window === 'undefined' || typeof Audio === 'undefined') {
    return null
  }
  if (audio) {
    return audio
  }
  const el = new Audio()
  el.preload = 'auto'
  const { volume, muted } = usePlayerStore.getState()
  el.volume = muted ? 0 : volume

  el.addEventListener('timeupdate', () => {
    usePlayerStore.setState({ progress: el.currentTime })
  })
  el.addEventListener('loadedmetadata', () => {
    if (Number.isFinite(el.duration) && el.duration > 0) {
      usePlayerStore.setState({ duration: el.duration })
    }
  })
  el.addEventListener('play', () => {
    usePlayerStore.setState({ isPlaying: true })
  })
  el.addEventListener('pause', () => {
    usePlayerStore.setState({ isPlaying: false })
  })
  el.addEventListener('ended', () => {
    // 播完自动切：交给播放模式决定（单曲循环重放、顺序到末尾停下、随机挑一首）
    usePlayerStore.getState().next({ auto: true })
  })
  el.addEventListener('error', () => {
    usePlayerStore.setState({ isPlaying: false, loading: false, error: '音频加载失败，换一首试试' })
  })

  audio = el
  return el
}

/**
 * 取单曲播放地址：只按当前 id 请求，不做批量预热。
 * 只缓存拿到的地址；url: null（受限曲目）不缓存，否则第二次点同一首不会再发请求。
 * 请求本身失败会抛出，交给调用方区分「不可播放」和「网络失败」。
 */
async function resolveUrl(song: Song): Promise<string | null> {
  const cached = urlCache.get(song.id)
  if (cached) {
    return cached
  }
  const result = await getSongUrl({ id: song.id, level: DEFAULT_LEVEL })
  const url = result.data?.[0]?.url ? normalizeUrl(result.data[0].url!) : null
  if (url) {
    urlCache.set(song.id, url)
  }
  return url
}

/**
 * 按当前播放模式挑选「下一首」：
 * - 单曲循环：不分手动/自动，都是当前这首（外面会重播它）
 * - 顺序播放：往后走一格；到队尾时自动切返回 undefined（结束播放），手动点返回当前（停住不动）
 * - 随机播放：随机挑一首，尽量避开最近播放过的
 */
function pickNext(
  queue: Song[],
  current: Song,
  recent: Song[],
  mode: PlayMode,
  auto: boolean
): Song | undefined {
  if (queue.length === 0) {
    return undefined
  }
  if (mode === 'repeat') {
    return current
  }
  if (mode === 'shuffle') {
    return pickShuffle(queue, current, recent)
  }
  const index = queue.findIndex((song) => song.id === current.id)
  if (index === -1) {
    return queue[0]
  }
  const nextIndex = index + 1
  if (nextIndex >= queue.length) {
    return auto ? undefined : current
  }
  return queue[nextIndex]
}

/** 随机播放时，尽量避开最近播放过的这几首 */
const SHUFFLE_AVOID = 8

/** 从头重播当前这首（单曲循环、队列只有一首时用） */
function restartCurrent() {
  const el = getAudio()
  if (el) {
    el.currentTime = 0
    void el.play()
  }
  usePlayerStore.setState({ progress: 0, isPlaying: true })
}

/** 随机挑下一首：先排除最近播放过的 SHUFFLE_AVOID 首，全排除完就退回整个队列 */
function pickShuffle(queue: Song[], current: Song, recent: Song[]): Song {
  const others = queue.filter((song) => song.id !== current.id)
  if (others.length === 0) {
    return current
  }
  const avoid = new Set(recent.slice(-SHUFFLE_AVOID).map((song) => song.id))
  const fresh = others.filter((song) => !avoid.has(song.id))
  const pool = fresh.length > 0 ? fresh : others
  return pool[Math.floor(Math.random() * pool.length)]
}

/** 全局播放状态（zustand）+ 真实音频播放 */
export const usePlayerStore = create<PlayerStore>((set, get) => ({
  current: placeholderSong,
  isPlaying: false,
  loading: false,
  progress: defaultProgress,
  duration: 0,
  volume: volumeBeforeMute,
  muted: false,
  fullscreen: false,
  queue: [],
  recent: [],
  queueOpen: false,
  playMode: 'order',
  notice: '',

  play: (song) => {
    // 占位状态（还没选歌）不触发任何请求
    if (!song.id) {
      return
    }
    const sameSong = get().current.id === song.id
    const generation = ++playGeneration
    // 先只进入 loading，不切换 current：受限曲目取不到地址时，
    // 播放器保持原样（还是上一首、还在播），只在下面弹个轻提示。
    set({ loading: true, error: undefined })

    void (async () => {
      let url: string | null = null
      let failed = false
      try {
        url = await resolveUrl(song)
      } catch {
        failed = true
      }
      if (generation !== playGeneration) {
        return
      }
      if (!url) {
        // 受限曲目（列表里带 VIP 标）：不改播放器状态，只提示
        set({ loading: false })
        get().notify(
          failed ? '获取播放地址失败，请稍后重试' : '该歌曲暂时无法播放（可能需要会员）'
        )
        return
      }

      // 确认能播之后才真正切歌
      set({
        current: song,
        loading: false,
        progress: sameSong ? get().progress : 0,
        duration: sameSong && get().duration > 0 ? get().duration : song.duration,
        // 记一笔播放历史（随机播放的上一首靠它）
        recent: [...get().recent.filter((item) => item.id !== song.id), song].slice(-50),
      })
      const el = getAudio()
      if (!el) {
        return
      }
      el.src = url
      try {
        await el.play()
        set({ isPlaying: true, error: undefined })
      } catch {
        set({ isPlaying: false, error: '浏览器阻止了自动播放，点一下播放键' })
      }
    })()
  },

  toggle: () => {
    const { isPlaying, current, loading } = get()
    // 还没有歌曲时播放键不可用（按钮本身也会 disabled）
    if (!current.id) {
      return
    }
    const el = getAudio()
    if (!el || loading) {
      return
    }
    if (isPlaying) {
      el.pause()
      set({ isPlaying: false })
      return
    }
    if (!el.src) {
      get().play(current)
      return
    }
    void el
      .play()
      .then(() => set({ isPlaying: true, error: undefined }))
      .catch(() => set({ isPlaying: false, error: '播放失败，换一首试试' }))
  },

  seek: (seconds) => {
    const el = getAudio()
    if (el) {
      el.currentTime = seconds
    }
    set({ progress: seconds })
  },

  /** 只记录播放队列（上一首 / 下一首用），不预取任何地址 */
  appendQueue: (songs) => {
    set({ queue: songs })
  },

  playNext: (id) => {
    const { queue, current } = get()
    const song = queue.find((item) => item.id === id)
    if (!song) {
      return
    }
    const rest = queue.filter((item) => item.id !== id)
    const index = rest.findIndex((item) => item.id === current.id)
    const next = [...rest]
    // 找不到当前歌曲时放到队首
    next.splice(index + 1, 0, song)
    set({ queue: next })
  },

  removeFromQueue: (id) => {
    set({ queue: get().queue.filter((item) => item.id !== id) })
  },

  clearQueue: () => set({ queue: [] }),

  setQueueOpen: (open) => set({ queueOpen: open }),

  next: (options) => {
    const { queue, current, playMode, recent } = get()
    if (queue.length === 0) {
      // 队列为空时给个反馈，不要静默无反应
      get().notify('播放列表是空的，先从歌单或排行榜里播一首吧')
      return
    }
    const song = pickNext(queue, current, recent, playMode, options?.auto ?? false)
    if (!song) {
      // 顺序播放：播完最后一首就结束
      getAudio()?.pause()
      set({ isPlaying: false, progress: 0 })
      return
    }
    if (song.id === current.id) {
      // 单曲循环（手动点也重播）/ 顺序播放已在队尾手动点：原地重播当前这首
      restartCurrent()
      return
    }
    get().play(song)
  },

  prev: () => {
    const { queue, current, playMode, recent } = get()
    if (queue.length === 0) {
      get().notify('播放列表是空的，先从歌单或排行榜里播一首吧')
      return
    }
    // 单曲循环：上一曲也是重播当前这首
    if (playMode === 'repeat') {
      restartCurrent()
      return
    }
    if (playMode === 'shuffle') {
      // 随机播放：回到真正播放过的上一首（历史里当前这首的前一首）
      const historyIndex = recent.findIndex((song) => song.id === current.id)
      const previous = historyIndex > 0 ? recent[historyIndex - 1] : undefined
      if (previous) {
        get().play(previous)
        return
      }
      get().play(pickShuffle(queue, current, recent))
      return
    }
    // 顺序播放：往前一格；已经是第一首就停住不动
    const index = queue.findIndex((song) => song.id === current.id)
    if (index <= 0) {
      return
    }
    get().play(queue[index - 1])
  },

  setPlayMode: (mode) => set({ playMode: mode }),

  cyclePlayMode: () => {
    const mode = PLAY_MODE_ORDER[
      (PLAY_MODE_ORDER.indexOf(get().playMode) + 1) % PLAY_MODE_ORDER.length
    ]
    set({ playMode: mode })
    return mode
  },

  setVolume: (value) => {
    const next = Math.min(1, Math.max(0, value))
    if (next > 0) {
      volumeBeforeMute = next
    }
    if (audio) {
      audio.volume = next
    }
    set({ volume: next, muted: next === 0 })
  },

  toggleMute: () => {
    const { muted, volume } = get()
    if (muted) {
      // 取消静音：恢复到静音前记录的音量
      const restored = volume > 0 ? volume : volumeBeforeMute
      if (audio) {
        audio.volume = restored
      }
      set({ muted: false, volume: restored })
      return
    }
    if (volume > 0) {
      volumeBeforeMute = volume
    }
    if (audio) {
      audio.volume = 0
    }
    set({ muted: true })
  },

  setFullscreen: (open) => set({ fullscreen: open }),

  notify: (message) => {
    set({ notice: message })
    window.clearTimeout(noticeTimer)
    noticeTimer = window.setTimeout(() => set({ notice: '' }), 2600)
  },
}))
