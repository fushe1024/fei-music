/**
 * 接口层统一出口：按业务域拆分在 shared / song / playlist / album / artist / search / mv / lyric 里，
 * 页面一律从 '@/apis' 引入（如 import { getSongUrl, toSong } from '@/apis'）。
 */
export * from './shared'
export * from './song'
export * from './playlist'
export * from './album'
export * from './artist'
export * from './search'
export * from './mv'
export * from './lyric'
