import { usePlayerStore } from '@/store/player'
import './PlayerNotice.scss'

/** 播放器轻提示（例如受限曲目无法播放），2.6s 后自动消失 */
export default function PlayerNotice() {
  const notice = usePlayerStore((state) => state.notice)

  if (!notice) {
    return null
  }

  return (
    <div className="player-notice" role="status" aria-live="polite">
      {notice}
    </div>
  )
}
