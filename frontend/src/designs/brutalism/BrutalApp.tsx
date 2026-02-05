import { Link, useLocation } from 'react-router-dom';
import { useProfile } from '../../hooks/useProfile';
import { usePodcastStats, usePodcastShows, useTopPodcastShows, useTopPodcastEpisodes, useAudiobooks, useOverviewStats } from '../../hooks/useApi';
import './brutal.css';

function BrutalNav() {
  const location = useLocation();
  const { profiles, selectedProfileId, setSelectedProfileId } = useProfile();
  
  return (
    <nav className="brutal-nav">
      <div className="brutal-logo">
        <span className="brutal-logo-box">B</span>
        <span>BRUTAL</span>
      </div>
      
      <ul className="brutal-nav-links">
        <li>
          <Link 
            to="/4" 
            className={`brutal-nav-link ${location.pathname === '/4' ? 'active' : ''}`}
          >
            OVERVIEW
          </Link>
        </li>
        <li>
          <Link 
            to="/4/podcasts" 
            className={`brutal-nav-link ${location.pathname === '/4/podcasts' ? 'active' : ''}`}
          >
            PODCASTS
          </Link>
        </li>
        <li>
          <Link 
            to="/4/audiobooks" 
            className={`brutal-nav-link ${location.pathname === '/4/audiobooks' ? 'active' : ''}`}
          >
            AUDIOBOOKS
          </Link>
        </li>
      </ul>
      
      <div className="flex items-center gap-4">
        <select
          value={selectedProfileId}
          onChange={(e) => setSelectedProfileId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="brutal-select"
        >
          <option value="all">ALL PROFILES</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>
          ))}
        </select>
        
        <div className="brutal-design-switcher">
          {[1, 2, 3, 4, 5].map((n) => (
            <Link
              key={n}
              to={`/${n}`}
              className={`brutal-design-btn ${n === 4 ? 'active' : ''}`}
            >
              {n}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  return `${hours}h ${Math.round(minutes % 60)}m`;
}

function formatMs(ms: number): string {
  return formatMinutes(ms / 60000);
}

function BrutalOverview() {
  const { selectedProfileId } = useProfile();
  const { data: overview, isLoading } = useOverviewStats(selectedProfileId);
  const { data: podcastStats } = usePodcastStats(selectedProfileId);
  const { data: topShows } = useTopPodcastShows(selectedProfileId, 3);
  const { data: audiobooks } = useAudiobooks(selectedProfileId, { limit: 3 });

  if (isLoading) {
    return (
      <div className="brutal-loading">
        <div className="brutal-loading-box">LOADING...</div>
      </div>
    );
  }

  const musicMinutes = overview?.totalMinutes || 0;
  const podcastMinutes = podcastStats?.totalPodcastMinutes || 0;
  const totalMinutes = musicMinutes + podcastMinutes;
  const podcastRatio = totalMinutes > 0 ? (podcastMinutes / totalMinutes) * 100 : 0;

  return (
    <div className="brutal-page p-8">
      {/* Hero */}
      <div className="brutal-hero mb-8">
        <h1 className="brutal-title" style={{ transform: 'rotate(-2deg)' }}>
          YOUR AUDIO CONTENT
        </h1>
        <p className="text-xl mt-4">
          Music, podcasts, and audiobooks — all in one place
        </p>
      </div>

      {/* Content Ratio */}
      <div className="brutal-card brutal-card-yellow mb-8">
        <h2 className="brutal-section-title">CONTENT BALANCE</h2>
        <div className="flex items-center gap-8 mt-4">
          <div className="flex-1">
            <div className="brutal-ratio-bar">
              <div 
                className="brutal-ratio-music"
                style={{ width: `${100 - podcastRatio}%` }}
              >
                MUSIC {(100 - podcastRatio).toFixed(0)}%
              </div>
              <div 
                className="brutal-ratio-podcast"
                style={{ width: `${podcastRatio}%` }}
              >
                {podcastRatio > 15 && `PODCASTS ${podcastRatio.toFixed(0)}%`}
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center">
            <div className="brutal-stat-value">{formatNumber(overview?.totalPlays || 0)}</div>
            <div className="brutal-stat-label">MUSIC PLAYS</div>
          </div>
          <div className="text-center">
            <div className="brutal-stat-value">{formatNumber(podcastStats?.totalPodcastPlays || 0)}</div>
            <div className="brutal-stat-label">PODCAST PLAYS</div>
          </div>
          <div className="text-center">
            <div className="brutal-stat-value">{formatNumber(podcastStats?.uniqueShows || 0)}</div>
            <div className="brutal-stat-label">SHOWS</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Top Podcasts */}
        <div className="brutal-card">
          <h2 className="brutal-section-title">🎙️ TOP PODCASTS</h2>
          {topShows && topShows.length > 0 ? (
            <div className="space-y-3 mt-4">
              {topShows.map((show, i) => (
                <div key={show.id} className="brutal-show-card">
                  <div className="brutal-show-rank">{i + 1}</div>
                  <div className="flex-1">
                    <div className="brutal-show-name">{show.name}</div>
                    <div className="brutal-show-publisher">{show.publisher}</div>
                  </div>
                  <div className="text-right">
                    <div className="brutal-show-plays">{show.playCount} eps</div>
                    <div className="brutal-show-time">{formatMs(show.totalMs)}</div>
                  </div>
                </div>
              ))}
              <Link to="/4/podcasts" className="brutal-btn mt-4 inline-block">
                SEE ALL PODCASTS →
              </Link>
            </div>
          ) : (
            <div className="brutal-empty">
              <p>NO PODCASTS FOUND</p>
              <p className="text-sm mt-2">Start listening to podcasts on Spotify!</p>
            </div>
          )}
        </div>

        {/* Audiobooks */}
        <div className="brutal-card brutal-card-pink">
          <h2 className="brutal-section-title">📚 AUDIOBOOKS</h2>
          {audiobooks?.audiobooks && audiobooks.audiobooks.length > 0 ? (
            <div className="space-y-3 mt-4">
              {audiobooks.audiobooks.map((book, i) => (
                <div key={book.id} className="brutal-book-card">
                  <div className="brutal-book-rank">{i + 1}</div>
                  <div className="flex-1">
                    <div className="brutal-book-name">{book.name}</div>
                    <div className="brutal-book-author">{book.author}</div>
                  </div>
                </div>
              ))}
              <Link to="/4/audiobooks" className="brutal-btn brutal-btn-dark mt-4 inline-block">
                SEE ALL AUDIOBOOKS →
              </Link>
            </div>
          ) : (
            <div className="brutal-empty">
              <p>NO AUDIOBOOKS YET</p>
              <p className="text-sm mt-2">Discover audiobooks on Spotify!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BrutalPodcasts() {
  const { selectedProfileId } = useProfile();
  const { data: podcastStats, isLoading } = usePodcastStats(selectedProfileId);
  const { data: shows } = usePodcastShows(selectedProfileId, { limit: 50, sortBy: 'plays', order: 'desc' });
  const { data: topEpisodes } = useTopPodcastEpisodes(selectedProfileId, 10);

  return (
    <div className="brutal-page p-8">
      <div className="brutal-hero mb-8">
        <h1 className="brutal-title" style={{ transform: 'rotate(-1deg)' }}>
          🎙️ PODCAST LIBRARY
        </h1>
      </div>

      {isLoading ? (
        <div className="brutal-loading"><div className="brutal-loading-box">LOADING...</div></div>
      ) : (
        <>
          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="brutal-stat-card">
              <div className="brutal-stat-value">{formatNumber(podcastStats?.totalPodcastPlays || 0)}</div>
              <div className="brutal-stat-label">TOTAL PLAYS</div>
            </div>
            <div className="brutal-stat-card brutal-stat-card-yellow">
              <div className="brutal-stat-value">{formatMinutes(podcastStats?.totalPodcastMinutes || 0)}</div>
              <div className="brutal-stat-label">TIME LISTENED</div>
            </div>
            <div className="brutal-stat-card">
              <div className="brutal-stat-value">{podcastStats?.uniqueShows || 0}</div>
              <div className="brutal-stat-label">SHOWS</div>
            </div>
            <div className="brutal-stat-card brutal-stat-card-pink">
              <div className="brutal-stat-value">{podcastStats?.uniqueEpisodes || 0}</div>
              <div className="brutal-stat-label">EPISODES</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            {/* Shows Grid */}
            <div className="brutal-card">
              <h2 className="brutal-section-title">ALL SHOWS</h2>
              {shows?.shows && shows.shows.length > 0 ? (
                <div className="brutal-shows-grid mt-4">
                  {shows.shows.map((show, i) => (
                    <div key={show.id} className="brutal-show-tile">
                      <div className="brutal-show-tile-number">{i + 1}</div>
                      <div className="brutal-show-tile-name">{show.name}</div>
                      <div className="brutal-show-tile-stats">
                        {show.playCount} eps • {formatMs(show.totalMs)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="brutal-empty">NO SHOWS FOUND</div>
              )}
            </div>

            {/* Top Episodes */}
            <div className="brutal-card brutal-card-yellow">
              <h2 className="brutal-section-title">TOP EPISODES</h2>
              {topEpisodes && topEpisodes.length > 0 ? (
                <div className="space-y-2 mt-4">
                  {topEpisodes.map((ep, i) => (
                    <div key={ep.id} className="brutal-episode-card">
                      <div className="brutal-episode-rank">{String(i + 1).padStart(2, '0')}</div>
                      <div className="flex-1">
                        <div className="brutal-episode-name">{ep.name}</div>
                        <div className="brutal-episode-show">{ep.showName}</div>
                      </div>
                      <div className="brutal-episode-plays">{ep.playCount}x</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="brutal-empty">NO EPISODES FOUND</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function BrutalAudiobooks() {
  const { selectedProfileId } = useProfile();
  const { data: audiobooks, isLoading } = useAudiobooks(selectedProfileId, { limit: 50 });

  return (
    <div className="brutal-page p-8">
      <div className="brutal-hero mb-8">
        <h1 className="brutal-title" style={{ transform: 'rotate(1deg)' }}>
          📚 AUDIOBOOK SHELF
        </h1>
      </div>

      {isLoading ? (
        <div className="brutal-loading"><div className="brutal-loading-box">LOADING...</div></div>
      ) : audiobooks?.audiobooks && audiobooks.audiobooks.length > 0 ? (
        <>
          {/* Stats */}
          <div className="brutal-card brutal-card-pink mb-8">
            <div className="grid grid-cols-2 gap-8 text-center">
              <div>
                <div className="brutal-stat-value text-4xl">{audiobooks.pagination.total}</div>
                <div className="brutal-stat-label">AUDIOBOOKS</div>
              </div>
              <div>
                <div className="brutal-stat-value text-4xl">📚</div>
                <div className="brutal-stat-label">IN YOUR LIBRARY</div>
              </div>
            </div>
          </div>

          {/* Books Grid */}
          <div className="brutal-books-grid">
            {audiobooks.audiobooks.map((book) => (
              <div key={book.id} className="brutal-book-tile">
                <div className="brutal-book-icon">📖</div>
                <div className="brutal-book-tile-name">{book.name}</div>
                <div className="brutal-book-tile-author">{book.author}</div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="brutal-card text-center py-16">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="brutal-section-title mb-4">NO AUDIOBOOKS YET</h2>
          <p className="text-lg">
            Start exploring audiobooks on Spotify to see them here!
          </p>
        </div>
      )}
    </div>
  );
}

export default function BrutalApp() {
  const location = useLocation();
  
  return (
    <div className="brutal-app">
      <BrutalNav />
      
      {location.pathname === '/4' && <BrutalOverview />}
      {location.pathname === '/4/podcasts' && <BrutalPodcasts />}
      {location.pathname === '/4/audiobooks' && <BrutalAudiobooks />}
    </div>
  );
}
