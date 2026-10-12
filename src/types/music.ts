export interface Playlist {
  id: string
  /** 歌单标题（设计图中为两行展示） */
  title: string
  cover: string
  /** 播放量，展示为「264.2万」 */
  playCount: number
}

export interface SongDelta {
  /** up：上升（红三角 + 数字）；flat：持平（—） */
  type: 'up' | 'flat'
  value?: number
}

export interface Song {
  id: string
  title: string
  artists: string[]
  cover: string
  /** 专辑名（列表页的「专辑」列用） */
  album?: string
  vip?: boolean
  delta?: SongDelta
  /** 时长（秒） */
  duration: number
}

export interface Chart {
  id: string
  title: string
  songs: Song[]
}

export interface Artist {
  id: string
  name: string
  avatar: string
}

export interface Album {
  id: string
  title: string
  cover: string
  artists: string[]
}

/** MV（列表 / 详情共用） */
export interface Mv {
  id: string
  name: string
  /** 缩略图 / 播放器海报 */
  cover: string
  playCount: number
  /** 时长（秒） */
  duration: number
  artists: { id: string; name: string }[]
  /** 发布时间，形如 2020-04-19 */
  publishTime?: string
  desc?: string
}

export interface FeatureChart {
  id: string
  /** 卡片文案，按设计图分两行 */
  lines: [string, string]
  /** 特色榜卡片的渐变背景 */
  gradient: string
}

export interface FilterGroup {
  id: string
  options: string[]
  defaultValue: string
}
