import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import {
  getSearchSuggest,
  toSuggestions,
  type SearchSuggestResult
} from '@/apis'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRequest } from '@/hooks/use-request'
import { cn } from '@/utils'
import './Header.scss'

/** 输入到发请求之间的防抖时长 */
const DEBOUNCE_MS = 260

/** 把建议词里命中的部分标成主色（设计图里「失」是蓝色的） */
function highlight(text: string, keyword: string) {
  const index = keyword ? text.toLowerCase().indexOf(keyword.toLowerCase()) : -1
  if (index < 0) {
    return text
  }
  return (
    <>
      {text.slice(0, index)}
      <span className="header__suggest-hit">
        {text.slice(index, index + keyword.length)}
      </span>
      {text.slice(index + keyword.length)}
    </>
  )
}

export default function Header() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [debounced, setDebounced] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const wrapRef = useRef<HTMLDivElement>(null)

  // 输入防抖：停手 260ms 后再请求搜索建议
  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebounced(keyword.trim()),
      DEBOUNCE_MS
    )
    return () => window.clearTimeout(timer)
  }, [keyword])

  const suggest = useRequest(
    (signal) =>
      debounced
        ? getSearchSuggest({ keywords: debounced, signal })
        : Promise.resolve<SearchSuggestResult>({ code: 200 }),
    [debounced]
  )
  const suggestions = useMemo(
    () => toSuggestions(suggest.data?.result),
    [suggest.data]
  )

  // 点到外面就收起建议面板
  useEffect(() => {
    if (!open) {
      return
    }
    const onPointerDown = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  const goSearch = (value: string) => {
    const text = value.trim()
    if (!text) {
      return
    }
    setOpen(false)
    setActiveIndex(-1)
    navigate(`/search?keywords=${encodeURIComponent(text)}`)
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    goSearch(activeIndex >= 0 ? suggestions[activeIndex] : keyword)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setOpen(false)
      setActiveIndex(-1)
      return
    }
    if (event.key === 'Enter') {
      // 中文输入法组词中不算提交
      if (event.nativeEvent.isComposing) {
        return
      }
      event.preventDefault()
      goSearch(activeIndex >= 0 ? suggestions[activeIndex] : keyword)
      return
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (suggestions.length === 0) {
        return
      }
      setOpen(true)
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActiveIndex((index) => {
        const next = index + step
        if (next < 0) {
          return suggestions.length - 1
        }
        return next >= suggestions.length ? 0 : next
      })
    }
  }

  const showPanel = open && debounced.length > 0 && suggestions.length > 0

  return (
    <header className="header">
      <Link to="/recommend" className="header__logo" aria-label="菲菲音乐">
        <img src="/assets/logo.png" alt="菲菲音乐" />
      </Link>

      <div className="header__search-wrap" ref={wrapRef}>
        <form className="header__search" onSubmit={handleSubmit} role="search">
          <Search className="header__search-icon" aria-hidden="true" />
          <Input
            value={keyword}
            onChange={(event) => {
              setKeyword(event.target.value)
              setOpen(true)
              setActiveIndex(-1)
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            className="header__search-input"
            placeholder="歌曲、歌手以及更多内容"
            aria-label="搜索"
            aria-expanded={showPanel}
            aria-controls="header-suggest"
            autoComplete="off"
          />
          {keyword ? (
            <button
              type="button"
              className="header__search-clear"
              aria-label="清空"
              onClick={() => {
                setKeyword('')
                setDebounced('')
                setOpen(false)
              }}
            >
              <X aria-hidden="true" />
            </button>
          ) : null}
        </form>

        {showPanel ? (
          <ul className="header__suggest" id="header-suggest" role="listbox">
            {suggestions.map((item, index) => (
              <li key={item}>
                <button
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  className={cn(
                    'header__suggest-item',
                    index === activeIndex && 'is-active'
                  )}
                  // mousedown 早于 blur，保证点击能生效
                  onMouseDown={(event) => {
                    event.preventDefault()
                    goSearch(item)
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  {highlight(item, debounced)}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="header__actions">
        <Button variant="ghost" className="header__client">
          客户端
        </Button>
        <Button className="header__login">登录</Button>
      </div>
    </header>
  )
}
