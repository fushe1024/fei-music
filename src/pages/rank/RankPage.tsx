import { useNavigate } from 'react-router-dom'
import { getToplist, normalizeUrl, withCoverSize } from '@/apis'
import FeatureCard, {
  FeatureCardSkeleton,
  RANK_GRADIENTS
} from '@/components/music/FeatureCard'
import RequestState from '@/components/music/RequestState'
import { useRequest } from '@/hooks/use-request'
import './RankPage.scss'

/** 首屏骨架：两行 */
const SKELETON_COUNT = 12

export default function RankPage() {
  // 所有榜单
  const toplist = useRequest((signal) => getToplist({ signal }), [])
  const navigate = useNavigate()

  const charts = toplist.data?.list ?? []

  return (
    <div className="page rank-page">
      {toplist.error && !toplist.loading ? (
        <RequestState error={toplist.error} onRetry={toplist.refresh} />
      ) : (
        <div className="card-grid rank-page__grid">
          {toplist.loading
            ? Array.from({ length: SKELETON_COUNT }, (_, index) => (
                <FeatureCardSkeleton key={index} />
              ))
            : charts.map((item, index) => (
                <FeatureCard
                  key={item.id}
                  title={item.name}
                  cover={withCoverSize(
                    normalizeUrl(item.coverImgUrl ?? ''),
                    400
                  )}
                  gradient={RANK_GRADIENTS[index % RANK_GRADIENTS.length]}
                  // 榜单本质也是歌单：点卡片进歌单详情页
                  onPlay={() => navigate(`/playlist/${item.id}`)}
                />
              ))}
        </div>
      )}
    </div>
  )
}
