import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useProfile } from '../../hooks/useProfile';
import { useOverviewStats, useTracks, useTrackDetail, useTrackTimeline, useAlbums, useTopArtists } from '../../hooks/useApi';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import './cosmos.css';

function Stars() {
  return (
    <div className="cosmos-stars">
      {Array.from({ length: 100 }).map((_, i) => (
        <div
          key={i}
          className="star"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            width: `${1 + Math.random() * 2}px`,
            height: `${1 + Math.random() * 2}px`,
          }}
        />
      ))}
    </div>
  );
}

function CosmosNav() {
  const location = useLocation();
  const { profiles, selectedProfileId, setSelectedProfileId } = useProfile();
  
  return (
    <nav className="cosmos-nav">
      <div className="cosmos-logo">
        <span className="cosmos-logo-orbit" />
        <span>COSMOS</span>
      </div>
      
      <ul className="cosmos-nav-links">
        <li>
          <Link 
            to="/5" 
            className={`cosmos-nav-link ${location.pathname === '/5' ? 'active' : ''}`}
          >
            Mission Control
          </Link>
        </li>
        <li>
          <Link 
            to="/5/explore" 
            className={`cosmos-nav-link ${location.pathname === '/5/explore' ? 'active' : ''}`}
          >
            Explore Tracks
          </Link>
        </li>
        <li>
          <Link 
            to="/5/albums" 
            className={`cosmos-nav-link ${location.pathname === '/5/albums' ? 'active' : ''}`}
          >
            Album Galaxy
          </Link>
        </li>
      </ul>
      
      <div className="flex items-center gap-4">
        <select
          value={selectedProfileId}
          onChange={(e) => setSelectedProfileId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="cosmos-select"
        >
          <option value="all">All Stations</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        
        <div className="cosmos-design-switcher">
          {[1, 2, 3, 4, 5].map((n) => (
            <Link
              key={n}
              to={`/${n}`}
              className={`cosmos-design-btn ${n === 5 ? 'active' : ''}`}
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
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
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

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Unknown';
  return new Date(dateStr).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

function CosmosMissionControl() {
  const { selectedProfileId } = useProfile();
  const { data: overview, isLoading } = useOverviewStats(selectedProfileId);
  const { data: topArtists } = useTopArtists(selectedProfileId, 5);
  const { data: tracksData } = useTracks({
    profileId: selectedProfileId,
    limit: 5,
    sortBy: 'totalPlays',
    sortOrder: 'DESC',
  });

  if (isLoading) {
    return (
      <div className="cosmos-loading">
        <div className="cosmos-loading-planet" />
      </div>
    );
  }

  return (
    <div className="cosmos-page p-8">
      {/* Hero */}
      <div className="cosmos-hero text-center mb-12">
        <h1 className="font-audiowide text-4xl text-white mb-4 tracking-wider">
          Mission <span className="text-cosmos-gold">Control</span>
        </h1>
        <p className="text-white/50 max-w-xl mx-auto">
          Your deep space exploration of musical data begins here
        </p>
      </div>

      {/* Mission Stats */}
      <div className="cosmos-stats-panel mb-12">
        <div className="cosmos-stat">
          <div className="cosmos-stat-icon">🌟</div>
          <div className="cosmos-stat-value">{formatNumber(overview?.totalPlays || 0)}</div>
          <div className="cosmos-stat-label">Total Transmissions</div>
        </div>
        <div className="cosmos-stat">
          <div className="cosmos-stat-icon">⏱️</div>
          <div className="cosmos-stat-value">{formatMinutes(overview?.totalMinutes || 0)}</div>
          <div className="cosmos-stat-label">Flight Time</div>
        </div>
        <div className="cosmos-stat">
          <div className="cosmos-stat-icon">🎵</div>
          <div className="cosmos-stat-value">{formatNumber(overview?.uniqueTracks || 0)}</div>
          <div className="cosmos-stat-label">Signals Detected</div>
        </div>
        <div className="cosmos-stat">
          <div className="cosmos-stat-icon">🌌</div>
          <div className="cosmos-stat-value">{formatNumber(overview?.uniqueArtists || 0)}</div>
          <div className="cosmos-stat-label">Star Systems</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Top Celestial Bodies (Artists) */}
        <div className="cosmos-card">
          <h2 className="cosmos-section-title">Brightest Stars</h2>
          <p className="text-white/40 text-sm mb-4">Your most played artists</p>
          {topArtists && topArtists.length > 0 ? (
            <div className="space-y-3">
              {topArtists.map((artist, i) => (
                <div key={artist.id} className="cosmos-artist">
                  <div className="cosmos-artist-rank">{i + 1}</div>
                  <div className="cosmos-artist-orbit">
                    <div 
                      className="cosmos-artist-planet" 
                      style={{ 
                        width: `${20 + (5 - i) * 4}px`,
                        height: `${20 + (5 - i) * 4}px`,
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="cosmos-artist-name">{artist.name}</div>
                    <div className="text-white/40 text-sm">{formatNumber(artist.plays)} plays</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/30">No data available</p>
          )}
        </div>

        {/* Top Signals (Tracks) */}
        <div className="cosmos-card">
          <h2 className="cosmos-section-title">Top Signals</h2>
          <p className="text-white/40 text-sm mb-4">Click to explore track in detail</p>
          {tracksData?.data && tracksData.data.length > 0 ? (
            <div className="space-y-3">
              {tracksData.data.map((track, i) => (
                <Link 
                  key={track.id} 
                  to={`/5/explore?track=${track.id}`}
                  className="cosmos-track block hover:bg-white/5 rounded-lg transition-colors"
                >
                  <div className="cosmos-track-rank">{i + 1}</div>
                  <div className="flex-1">
                    <div className="cosmos-track-name">{track.name || track.trackName}</div>
                    <div className="cosmos-track-artist">{track.artistName}</div>
                  </div>
                  <div className="cosmos-track-plays">{track.totalPlays}x</div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-white/30">No data available</p>
          )}
          <Link to="/5/explore" className="cosmos-btn mt-4 inline-block">
            Explore All Tracks →
          </Link>
        </div>
      </div>
    </div>
  );
}

function CosmosExplore() {
  const { selectedProfileId } = useProfile();
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  
  const { data: tracksData, isLoading } = useTracks({
    profileId: selectedProfileId,
    limit: 20,
    search: search || undefined,
    sortBy: 'totalPlays',
    sortOrder: 'DESC',
  });

  const { data: trackDetail } = useTrackDetail(selectedTrackId || 0, selectedProfileId);
  const { data: trackTimeline } = useTrackTimeline(selectedTrackId || 0, selectedProfileId);

  // Get track ID from URL if present
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const urlTrackId = urlParams.get('track');
  if (urlTrackId && !selectedTrackId) {
    setSelectedTrackId(Number(urlTrackId));
  }

  return (
    <div className="cosmos-page p-8">
      <div className="mb-8">
        <h1 className="font-audiowide text-3xl text-white mb-2">
          🔭 Track Explorer
        </h1>
        <p className="text-white/50">
          Deep dive into individual track data and play history
        </p>
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Track List */}
        <div className="cosmos-card">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search tracks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="cosmos-search"
            />
          </div>
          
          {isLoading ? (
            <div className="cosmos-loading-small" />
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {tracksData?.data?.map((track) => (
                <button
                  key={track.id}
                  onClick={() => setSelectedTrackId(track.id)}
                  className={`cosmos-track-btn w-full text-left ${selectedTrackId === track.id ? 'active' : ''}`}
                >
                  <div className="cosmos-track-btn-name">{track.name || track.trackName}</div>
                  <div className="cosmos-track-btn-artist">{track.artistName}</div>
                  <div className="cosmos-track-btn-plays">{track.totalPlays}x</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Track Detail */}
        <div className="col-span-2">
          {selectedTrackId && trackDetail ? (
            <div className="cosmos-card cosmos-card-detail">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="font-audiowide text-2xl text-white mb-1">{trackDetail.name}</h2>
                  <p className="text-cosmos-gold">{trackDetail.album?.artist?.name}</p>
                  <p className="text-white/40">{trackDetail.album?.name}</p>
                </div>
                <div className="text-right">
                  <div className="cosmos-detail-stat">
                    <span className="text-3xl font-bold text-cosmos-gold">{trackDetail.stats?.totalPlays}</span>
                    <span className="text-white/50 ml-2">plays</span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="cosmos-mini-stat">
                  <div className="cosmos-mini-stat-value">{formatMinutes(trackDetail.stats?.totalMinutes || 0)}</div>
                  <div className="cosmos-mini-stat-label">Total Time</div>
                </div>
                <div className="cosmos-mini-stat">
                  <div className="cosmos-mini-stat-value">{(trackDetail.stats?.skipPercentage || 0).toFixed(0)}%</div>
                  <div className="cosmos-mini-stat-label">Skip Rate</div>
                </div>
                <div className="cosmos-mini-stat">
                  <div className="cosmos-mini-stat-value">{formatDate(trackDetail.stats?.firstPlay)}</div>
                  <div className="cosmos-mini-stat-label">First Play</div>
                </div>
                <div className="cosmos-mini-stat">
                  <div className="cosmos-mini-stat-value">{formatDate(trackDetail.stats?.lastPlay)}</div>
                  <div className="cosmos-mini-stat-label">Last Play</div>
                </div>
              </div>

              {/* Timeline Chart */}
              {trackTimeline?.data && trackTimeline.data.length > 0 && (
                <div className="mb-6">
                  <h3 className="cosmos-section-title text-sm mb-4">Play Timeline</h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trackTimeline.data.slice(-60)}>
                        <defs>
                          <linearGradient id="cosmosGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ffd700" stopOpacity={0.4} />
                            <stop offset="100%" stopColor="#4a1f6e" stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                        <XAxis 
                          dataKey="date" 
                          stroke="rgba(255,255,255,0.2)"
                          tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                          interval="preserveStartEnd"
                        />
                        <YAxis 
                          stroke="rgba(255,255,255,0.2)"
                          tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            background: 'rgba(11,12,26,0.95)', 
                            border: '1px solid rgba(255,215,0,0.3)',
                            borderRadius: '8px',
                            color: '#fff',
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="plays" 
                          stroke="#ffd700"
                          strokeWidth={2}
                          fill="url(#cosmosGrad)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Recent Plays */}
              {trackDetail.recentPlays && trackDetail.recentPlays.length > 0 && (
                <div>
                  <h3 className="cosmos-section-title text-sm mb-4">Recent Transmissions</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {trackDetail.recentPlays.slice(0, 10).map((play) => (
                      <div key={play.id} className="cosmos-play-event">
                        <div className="cosmos-play-date">{formatDate(play.playedAt)}</div>
                        <div className="cosmos-play-platform">{play.platform}</div>
                        <div className="cosmos-play-country">{play.country}</div>
                        <div className={`cosmos-play-status ${play.skipped ? 'skipped' : 'complete'}`}>
                          {play.skipped ? 'Skipped' : 'Complete'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="cosmos-card text-center py-16">
              <div className="text-6xl mb-4">🔭</div>
              <h2 className="font-audiowide text-xl text-white mb-2">Select a Track</h2>
              <p className="text-white/50">
                Choose a track from the list to explore its detailed data
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CosmosAlbums() {
  const { selectedProfileId } = useProfile();
  const { data: albumsData, isLoading } = useAlbums({
    profileId: selectedProfileId,
    limit: 30,
    sortBy: 'plays',
    sortOrder: 'DESC',
  });

  return (
    <div className="cosmos-page p-8">
      <div className="mb-8">
        <h1 className="font-audiowide text-3xl text-white mb-2">
          🌌 Album Galaxy
        </h1>
        <p className="text-white/50">
          Explore your collection by album
        </p>
      </div>

      {isLoading ? (
        <div className="cosmos-loading"><div className="cosmos-loading-planet" /></div>
      ) : (
        <div className="cosmos-albums-grid">
          {albumsData?.data?.map((album, i) => (
            <div key={album.id} className="cosmos-album-card">
              <div className="cosmos-album-art">
                <span className="text-2xl">💿</span>
              </div>
              <div className="cosmos-album-rank">{i + 1}</div>
              <div className="cosmos-album-name">{album.name}</div>
              <div className="cosmos-album-artist">{album.artist}</div>
              <div className="cosmos-album-stats">
                {formatNumber(album.plays)} plays • {formatMinutes(album.minutes)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CosmosApp() {
  const location = useLocation();
  
  return (
    <div className="cosmos-app">
      <div className="cosmos-bg" />
      <Stars />
      <div className="cosmos-content">
        <CosmosNav />
        
        {location.pathname === '/5' && <CosmosMissionControl />}
        {location.pathname === '/5/explore' && <CosmosExplore />}
        {location.pathname === '/5/albums' && <CosmosAlbums />}
      </div>
    </div>
  );
}
