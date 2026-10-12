/**
 * 全屏播放页的配色主题：每次打开随机取一套。
 * 背景是整屏渐变；进度条填充与底栏上方的渐隐都用同一色系，保证整体一致。
 */
export interface PlayerTheme {
  /** 整屏背景渐变 */
  background: string
  /** 背景底部颜色，用于底栏上方的同色渐隐 */
  bottom: string
  /** 进度条填充渐变（与背景同色系、更亮一点） */
  progress: string
}

const THEMES: PlayerTheme[] = [
  {
    background: 'linear-gradient(rgb(158, 44, 132) 0%, rgb(78, 20, 68) 100%)',
    bottom: 'rgb(78, 20, 68)',
    progress: 'linear-gradient(90deg, rgb(219, 120, 199) 0%, rgb(196, 88, 176) 100%)',
  },
  {
    background: 'linear-gradient(rgb(155, 105, 35) 0%, rgb(57, 36, 15) 100%)',
    bottom: 'rgb(57, 36, 15)',
    progress: 'linear-gradient(90deg, rgb(214, 168, 104) 0%, rgb(186, 132, 55) 100%)',
  },
  {
    background: 'linear-gradient(rgb(96, 62, 168) 0%, rgb(38, 22, 78) 100%)',
    bottom: 'rgb(38, 22, 78)',
    progress: 'linear-gradient(90deg, rgb(160, 126, 236) 0%, rgb(124, 88, 208) 100%)',
  },
  {
    background: 'linear-gradient(rgb(38, 108, 132) 0%, rgb(14, 42, 58) 100%)',
    bottom: 'rgb(14, 42, 58)',
    progress: 'linear-gradient(90deg, rgb(96, 180, 206) 0%, rgb(58, 142, 172) 100%)',
  },
  {
    background: 'linear-gradient(rgb(146, 52, 84) 0%, rgb(56, 18, 38) 100%)',
    bottom: 'rgb(56, 18, 38)',
    progress: 'linear-gradient(90deg, rgb(206, 106, 142) 0%, rgb(176, 74, 114) 100%)',
  },
  {
    background: 'linear-gradient(rgb(46, 108, 78) 0%, rgb(15, 44, 33) 100%)',
    bottom: 'rgb(15, 44, 33)',
    progress: 'linear-gradient(90deg, rgb(104, 182, 140) 0%, rgb(66, 142, 104) 100%)',
  },
]

/** 还没有歌曲时的中性深灰主题（参考图一） */
const PLACEHOLDER_THEME: PlayerTheme = {
  background: 'linear-gradient(rgb(74, 74, 78) 0%, rgb(32, 32, 35) 100%)',
  bottom: 'rgb(32, 32, 35)',
  progress: 'linear-gradient(90deg, rgb(158, 158, 164) 0%, rgb(118, 118, 124) 100%)',
}

/**
 * 每首歌固定一套主题：同一个 id 永远得到同一个渐变，
 * 所以反复打开/关闭全屏不会换色，不同歌曲之间才有区别。
 * 空 id（还没选歌）用中性深灰。
 */
export function themeForSong(id: string): PlayerTheme {
  if (!id) {
    return PLACEHOLDER_THEME
  }
  let hash = 0
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  }
  return THEMES[hash % THEMES.length]
}
