/** 歌词：/lyric（普通 LRC）、/lyric/new（逐字 YRC） */

import request from '@/utils/request'

/* 歌词：GET /lyric（普通 LRC）、GET /lyric/new（逐字 YRC） */

export interface LyricResult {
  code: number
  /** 原文歌词（LRC，或新接口里的制作人 JSON） */
  lrc?: { lyric?: string }
  /** 逐字歌词。混合内容：前面几行是制作人 JSON，后面才是 [行起点,行时长](字起点,字时长,0)字… */
  yrc?: { lyric?: string }
  /** 翻译歌词 */
  tlyric?: { lyric?: string }
}

/** 获取歌词（普通 LRC） */
export function getLyric({
  id,
  signal
}: {
  id: number | string
  signal?: AbortSignal
}) {
  return request.get<LyricResult>('/lyric', { id }, { signal })
}

/** 逐字歌词：没有 yrc 时退回 /lyric */
export function getLyricNew({
  id,
  signal
}: {
  id: number | string
  signal?: AbortSignal
}) {
  return request.get<LyricResult>('/lyric/new', { id }, { signal })
}
