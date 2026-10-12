import type { FilterGroup } from '@/types/music'

/** 歌手页筛选条件（首项「全部」对应接口的 -1，默认也选中「全部」） */
export const artistFilters: FilterGroup[] = [
  { id: 'region', options: ['全部', '华语', '欧美', '日韩'], defaultValue: '全部' },
  { id: 'gender', options: ['全部', '男', '女', '组合'], defaultValue: '全部' },
]

/** 歌手页字母索引（# 对应接口的 initial=0，排在 A 前面） */
export const artistLetters = ['#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')]
