export interface LyricWord {
  /** 这个字的起始时间（秒） */
  start: number
  /** 这个字的结束时间（秒） */
  end: number
  text: string
}

export interface LyricLine {
  /** 该行开始时间（秒） */
  time: number
  text: string
  /** 逐字信息（YRC 才有），用于逐字高亮 */
  words?: LyricWord[]
}

/** LRC 时间标签：[mm:ss.xxx] / [mm:ss:xx] / [mm:ss] */
const TIME_TAG = /\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g

/** 解析 LRC：一行多个时间标签（重复副歌）会展开成多行，纯时间标签的空行丢掉 */
export function parseLyric(raw: string): LyricLine[] {
  const lines: LyricLine[] = []
  for (const rawLine of (raw ?? '').split('\n')) {
    const text = rawLine.replace(TIME_TAG, '').trim()
    if (!text) {
      continue
    }
    TIME_TAG.lastIndex = 0
    let match = TIME_TAG.exec(rawLine)
    while (match) {
      const minutes = Number(match[1])
      const seconds = Number(match[2])
      const fraction = match[3] ? Number(match[3].padEnd(3, '0')) / 1000 : 0
      lines.push({ time: minutes * 60 + seconds + fraction, text })
      match = TIME_TAG.exec(rawLine)
    }
  }
  return lines.sort((a, b) => a.time - b.time)
}

/** YRC 行头：[行起点ms,行时长ms] */
const YRC_LINE = /^\s*\[(\d+),(\d+)\]/
/** YRC 字标记：(字起点ms,字时长ms,0) */
const YRC_WORD = /\((\d+),(\d+),\d+\)/g

/**
 * 解析逐字歌词（YRC）。/lyric/new 的 yrc 是混合内容：前面几行是制作人 JSON（没有 [a,b] 行头），
 * 后面才是 `[24910,450](24910,450,0)话(25360,420,0)难…`；只认带行头的行，JSON 自动跳过。
 */
export function parseYrc(raw: string): LyricLine[] {
  const lines: LyricLine[] = []
  for (const rawLine of (raw ?? '').split('\n')) {
    const head = YRC_LINE.exec(rawLine)
    if (!head) {
      continue
    }
    const time = Number(head[1]) / 1000

    // 逐个「(起点,时长,0)」标记，字文本取到下一个标记之前
    const marks: { start: number; end: number; markerStart: number; textStart: number }[] = []
    YRC_WORD.lastIndex = 0
    let match = YRC_WORD.exec(rawLine)
    while (match) {
      const start = Number(match[1]) / 1000
      marks.push({
        start,
        end: start + Number(match[2]) / 1000,
        markerStart: match.index,
        textStart: match.index + match[0].length
      })
      match = YRC_WORD.exec(rawLine)
    }
    if (marks.length === 0) {
      continue
    }

    const words: LyricWord[] = marks.map((mark, index) => ({
      start: mark.start,
      end: mark.end,
      text: rawLine.slice(
        mark.textStart,
        index + 1 < marks.length ? marks[index + 1].markerStart : rawLine.length
      )
    }))
    const text = words.map((word) => word.text).join('').trim()
    if (!text) {
      continue
    }
    lines.push({ time, text, words })
  }
  return lines.sort((a, b) => a.time - b.time)
}

/** 给没有逐字数据的行按字数均分补齐时间（老歌常常不返回 yrc），让逐字高亮对所有歌生效 */
export function addWordTimings(lines: LyricLine[]): LyricLine[] {
  return lines.map((line, index) => {
    if (line.words?.length) {
      return line
    }
    const next = lines[index + 1]
    const span = Math.max(
      0.8,
      (next ? next.time : line.time + Math.max(2, line.text.length * 0.3)) - line.time
    )
    const chars = Array.from(line.text)
    const per = span / Math.max(1, chars.length)
    return {
      ...line,
      words: chars.map((char, charIndex) => ({
        text: char,
        start: line.time + charIndex * per,
        end: line.time + (charIndex + 1) * per
      }))
    }
  })
}

/** 当前播放时间对应的歌词行下标；还没到第一行时返回 -1 */
export function findLyricIndex(lines: LyricLine[], time: number): number {
  let index = -1
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].time <= time + 0.15) {
      index = i
    } else {
      break
    }
  }
  return index
}
