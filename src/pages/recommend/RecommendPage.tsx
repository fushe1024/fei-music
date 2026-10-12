import { useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import {
  getNewAlbums,
  getPersonalizedNewsong,
  getPersonalizedPlaylists,
  toAlbum,
  toPlaylist,
  toSong,
} from '@/apis'
import AlbumCard, { AlbumCardSkeleton } from '@/components/music/AlbumCard'
import NewSongRow, { NewSongRowSkeleton } from '@/components/music/NewSongRow'
import PlaylistCard, {
  PlaylistCardSkeleton
} from '@/components/music/PlaylistCard'
import RequestState from '@/components/music/RequestState'
import SectionHeader from '@/components/music/SectionHeader'
import { useRequest } from '@/hooks/use-request'
import { usePlayerStore } from '@/store/player'
import type { Song } from '@/types/music'
import './RecommendPage.scss'

/** 推荐歌单：一行 6 张封面（接口不支持 offset） */
const RECOMMEND_LIMIT = 6
/** 新歌速递：三列三行 */
const NEW_SONG_LIMIT = 9
/** 新碟上架：一行 6 张，默认取全部地区的第一页 */
const ALBUM_LIMIT = 6

export default function RecommendPage() {
  const play = usePlayerStore((state) => state.play)
  const appendQueue = usePlayerStore((state) => state.appendQueue)

  const playlists = useRequest(
    (signal) => getPersonalizedPlaylists({ limit: RECOMMEND_LIMIT, signal }),
    []
  )
  const newsong = useRequest(
    (signal) => getPersonalizedNewsong({ limit: NEW_SONG_LIMIT, signal }),
    []
  )
  const albums = useRequest(
    (signal) => getNewAlbums({ area: 'ALL', limit: ALBUM_LIMIT, offset: 0, signal }),
    []
  )

  const playlistItems = useMemo(
    () => (playlists.data?.result ?? []).map(toPlaylist),
    [playlists.data]
  )
  const songs = useMemo(
    () =>
      (newsong.data?.result ?? [])
        .filter((item) => item.song)
        .map((item) => toSong(item.song!)),
    [newsong.data]
  )
  const albumItems = useMemo(
    () => (albums.data?.albums ?? []).slice(0, ALBUM_LIMIT).map(toAlbum),
    [albums.data]
  )

  const handlePlaySong = useCallback(
    (song: Song) => {
      appendQueue(songs)
      play(song)
    },
    [appendQueue, play, songs]
  )

  return (
    <div className="page recommend">
      <SectionHeader
        title="推荐歌单"
        action={
          <Link to="/playlist" className="section-more">
            邂逅你的真爱歌单
            <ChevronRight aria-hidden="true" />
          </Link>
        }
      />

      {playlists.error && !playlists.loading ? (
        <RequestState error={playlists.error} onRetry={playlists.refresh} />
      ) : (
        <div className="card-grid">
          {playlists.loading
            ? Array.from({ length: RECOMMEND_LIMIT }, (_, index) => (
                <PlaylistCardSkeleton key={index} />
              ))
            : playlistItems.map((playlist) => (
                <PlaylistCard key={playlist.id} playlist={playlist} />
              ))}
        </div>
      )}

      <SectionHeader
        className="section-gap"
        title="新歌速递"
        action={
          <Link to="/discSong" className="section-more">
            更多鲜乐更多快落
            <ChevronRight aria-hidden="true" />
          </Link>
        }
      />

      {newsong.error && !newsong.loading ? (
        <RequestState error={newsong.error} onRetry={newsong.refresh} />
      ) : (
        <div className="new-song-grid">
          {newsong.loading
            ? Array.from({ length: NEW_SONG_LIMIT }, (_, index) => (
                <NewSongRowSkeleton key={index} />
              ))
            : songs.map((song) => (
                <NewSongRow key={song.id} song={song} onPlay={handlePlaySong} />
              ))}
        </div>
      )}

      <SectionHeader
        className="section-gap"
        title="新碟上架"
        action={
          <Link to="/discSong" className="section-more">
            魔力新碟好听到爆
            <ChevronRight aria-hidden="true" />
          </Link>
        }
      />

      {albums.error && !albums.loading ? (
        <RequestState error={albums.error} onRetry={albums.refresh} />
      ) : (
        <div className="album-grid">
          {albums.loading
            ? Array.from({ length: ALBUM_LIMIT }, (_, index) => (
                <AlbumCardSkeleton key={index} />
              ))
            : albumItems.map((album) => <AlbumCard key={album.id} album={album} />)}
        </div>
      )}
    </div>
  )
}
