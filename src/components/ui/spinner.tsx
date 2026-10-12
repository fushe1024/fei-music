import * as React from 'react'
import { cn } from '@/utils'

/** 极简加载指示器：单圈弧线 + 自转，颜色跟随主色 */
function Spinner({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="spinner"
      role="status"
      aria-label="加载中"
      className={cn(
        'inline-block size-5 animate-spin rounded-full border-2 border-transparent border-t-primary',
        className,
      )}
      {...props}
    />
  )
}

export { Spinner }
