import { Link, useLocation } from 'react-router-dom';
import { useProfile } from '../../hooks/useProfile';
import { useOverviewStats, useMostSkippedTracks, useTracksByPlatform, useCountryStats, useTracks } from '../../hooks/useApi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import './neon.css';

function NeonNav() {
  const location = useLocation();
  const { profiles, selectedProfileId, setSelectedProfileId } = useProfile();
  
  return (
    <nav className="neon-nav">
      <div className="neon-logo">
        <span className="neon-logo-icon">◢◤</span>
        <span className="glitch" data-text="ANALYTICS">ANALYTICS</span>
      </div>
      
      <ul className="neon-nav-links">
        <li>
          <Link 
            to="/2" 
            className={`neon-nav-link ${location.pathname === '/2' ? 'active' : ''}`}
          >
            DASHBOARD
          </Link>
        </li>
        <li>
          <Link 
            to="/2/skip-radar" 
            className={`neon-nav-link ${location.pathname === '/2/skip-radar' ? 'active' : ''}`}
          >
            SKIP_RADAR
          </Link>
        </li>
        <li>
          <Link 
            to="/2/platforms" 
            className={`neon-nav-link ${location.pathname === '/2/platforms' ? 'active' : ''}`}
          >
            PLATFORMS
          </Link>
        </li>
      </ul>
      
      <div className="flex items-center gap-4">
        <select
          value={selectedProfileId}
          onChange={(e) => setSelectedProfileId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="neon-select"
        >
          <option value="all">ALL_USERS</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>
          ))}
        </select>
        
        <div className="neon-design-switcher">
          {[1, 2, 3, 4, 5].map((n) => (
            <Link
              key={n}
              to={`/${n}`}
              className={`neon-design-btn ${n === 2 ? 'active' : ''}`}
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

function formatPercent(num: number): string {
  return num.toFixed(1) + '%';
}

function NeonDashboard() {
  const { selectedProfileId } = useProfile();
  const { data: overview, isLoading } = useOverviewStats(selectedProfileId);
  const { data: skipped } = useMostSkippedTracks(selectedProfileId, 5);
  const { data: platforms } = useTracksByPlatform(selectedProfileId);
  const { data: countries } = useCountryStats(selectedProfileId);

  if (isLoading) {
    return (
      <div className="neon-loading">
        <div className="neon-loading-bar" />
      </div>
    );
  }

  const COLORS = ['#ff2a6d', '#05d9e8', '#d1f7ff', '#01012b', '#ff2a6d'];

  return (
    <div className="neon-page p-8">
      {/* Terminal Header */}
      <div className="neon-terminal mb-8">
        <div className="neon-terminal-header">
          <span className="neon-terminal-dot" />
          <span className="neon-terminal-dot" />
          <span className="neon-terminal-dot" />
          <span className="ml-4 text-white/50">system_analytics.exe</span>
        </div>
        <div className="neon-terminal-body">
          <p className="text-neon-cyan">{'>'} INITIALIZING ANALYTICS ENGINE...</p>
          <p className="text-neon-pink">{'>'} LOADED {formatNumber(overview?.totalPlays || 0)} DATA POINTS</p>
          <p className="text-white/70">{'>'} SYSTEM_STATUS: <span className="text-neon-cyan">ONLINE</span></p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="neon-stat-card">
          <div className="neon-stat-value">{formatNumber(overview?.totalPlays || 0)}</div>
          <div className="neon-stat-label">TOTAL_PLAYS</div>
        </div>
        <div className="neon-stat-card neon-stat-card-cyan">
          <div className="neon-stat-value">{formatNumber(overview?.uniqueTracks || 0)}</div>
          <div className="neon-stat-label">UNIQUE_TRACKS</div>
        </div>
        <div className="neon-stat-card">
          <div className="neon-stat-value">{formatNumber(overview?.uniqueArtists || 0)}</div>
          <div className="neon-stat-label">ARTISTS</div>
        </div>
        <div className="neon-stat-card neon-stat-card-cyan">
          <div className="neon-stat-value">{overview?.topCountry || 'N/A'}</div>
          <div className="neon-stat-label">TOP_REGION</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Skip Analysis Preview */}
        <div className="neon-card">
          <h2 className="neon-section-title">⚠ SKIP_ANALYSIS</h2>
          <p className="text-white/40 text-sm mb-4">Tracks with highest skip rates</p>
          {skipped && skipped.length > 0 ? (
            <div className="space-y-2">
              {skipped.slice(0, 5).map((track, i) => (
                <div key={track.id} className="neon-track">
                  <div className="neon-track-rank">{String(i + 1).padStart(2, '0')}</div>
                  <div className="flex-1">
                    <div className="neon-track-name">{track.name || track.trackName}</div>
                    <div className="neon-track-artist">{track.artistName}</div>
                  </div>
                  <div className="neon-skip-badge">
                    {formatPercent(track.skipPercentage || 0)}
                  </div>
                </div>
              ))}
              <Link to="/2/skip-radar" className="neon-btn mt-4 inline-block">
                VIEW_FULL_ANALYSIS →
              </Link>
            </div>
          ) : (
            <p className="text-white/30">NO_DATA_AVAILABLE</p>
          )}
        </div>

        {/* Platform Distribution */}
        <div className="neon-card">
          <h2 className="neon-section-title">📱 PLATFORM_MATRIX</h2>
          <p className="text-white/40 text-sm mb-4">Device usage distribution</p>
          {platforms && platforms.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={platforms.slice(0, 5)}
                    dataKey="plays"
                    nameKey="platform"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    label={({ platform }) => platform}
                  >
                    {platforms.slice(0, 5).map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      background: '#0a0a0f', 
                      border: '1px solid #ff2a6d',
                      color: '#fff',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-white/30">NO_DATA_AVAILABLE</p>
          )}
        </div>

        {/* Country Stats */}
        <div className="neon-card col-span-2">
          <h2 className="neon-section-title">🌍 GEO_DISTRIBUTION</h2>
          <p className="text-white/40 text-sm mb-4">Listening activity by region</p>
          {countries && countries.length > 0 ? (
            <div className="grid grid-cols-5 gap-4">
              {countries.slice(0, 10).map((country, i) => (
                <div key={country.country} className="neon-country-card">
                  <div className="neon-country-code">{country.country}</div>
                  <div className="neon-country-plays">{formatNumber(country.plays)}</div>
                  <div className="neon-country-bar">
                    <div 
                      className="neon-country-bar-fill"
                      style={{ 
                        width: `${(country.plays / countries[0].plays) * 100}%`,
                        background: i % 2 === 0 ? '#ff2a6d' : '#05d9e8'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/30">NO_GEO_DATA_AVAILABLE</p>
          )}
        </div>
      </div>
    </div>
  );
}

function NeonSkipRadar() {
  const { selectedProfileId } = useProfile();
  const { data: skipped, isLoading } = useMostSkippedTracks(selectedProfileId, 20);
  const { data: completed } = useTracks({
    profileId: selectedProfileId,
    limit: 10,
    sortBy: 'totalPlays',
    sortOrder: 'DESC',
  });

  // Find tracks with low skip rate (completed often)
  const completedTracks = completed?.data?.filter(t => (t.skipPercentage || 0) < 10) || [];

  return (
    <div className="neon-page p-8">
      <div className="mb-8">
        <h1 className="glitch text-3xl font-bold text-white mb-2" data-text="SKIP_RADAR">
          SKIP_RADAR
        </h1>
        <p className="text-white/50">
          {'>'} Analyzing track completion rates and skip patterns
        </p>
      </div>

      {isLoading ? (
        <div className="neon-loading"><div className="neon-loading-bar" /></div>
      ) : (
        <div className="grid grid-cols-2 gap-8">
          {/* Most Skipped */}
          <div className="neon-card">
            <h2 className="neon-section-title text-neon-pink">⚠ MOST_SKIPPED</h2>
            <p className="text-white/40 text-sm mb-4">Tracks you often skip</p>
            <div className="space-y-2">
              {skipped?.map((track, i) => (
                <div key={track.id} className="neon-track">
                  <div className="neon-track-rank text-neon-pink">{String(i + 1).padStart(2, '0')}</div>
                  <div className="flex-1">
                    <div className="neon-track-name">{track.name || track.trackName}</div>
                    <div className="neon-track-artist">{track.artistName}</div>
                  </div>
                  <div className="text-right">
                    <div className="neon-skip-badge">{formatPercent(track.skipPercentage || 0)}</div>
                    <div className="text-white/30 text-xs">{track.totalPlays} plays</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Completed Tracks */}
          <div className="neon-card">
            <h2 className="neon-section-title text-neon-cyan">✓ ALWAYS_COMPLETED</h2>
            <p className="text-white/40 text-sm mb-4">Tracks you listen to fully</p>
            <div className="space-y-2">
              {completedTracks.slice(0, 10).map((track, i) => (
                <div key={track.id} className="neon-track">
                  <div className="neon-track-rank text-neon-cyan">{String(i + 1).padStart(2, '0')}</div>
                  <div className="flex-1">
                    <div className="neon-track-name">{track.name || track.trackName}</div>
                    <div className="neon-track-artist">{track.artistName}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-neon-cyan">{formatPercent(100 - (track.skipPercentage || 0))}</div>
                    <div className="text-white/30 text-xs">completion rate</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NeonPlatforms() {
  const { selectedProfileId } = useProfile();
  const { data: platforms, isLoading } = useTracksByPlatform(selectedProfileId);
  const { data: countries } = useCountryStats(selectedProfileId);

  const COLORS = ['#ff2a6d', '#05d9e8', '#d1f7ff', '#01012b', '#ff2a6d', '#05d9e8'];

  return (
    <div className="neon-page p-8">
      <div className="mb-8">
        <h1 className="glitch text-3xl font-bold text-white mb-2" data-text="PLATFORM_MATRIX">
          PLATFORM_MATRIX
        </h1>
        <p className="text-white/50">
          {'>'} Device and geographic analytics
        </p>
      </div>

      {isLoading ? (
        <div className="neon-loading"><div className="neon-loading-bar" /></div>
      ) : (
        <div className="grid grid-cols-2 gap-8">
          {/* Platform Chart */}
          <div className="neon-card">
            <h2 className="neon-section-title">📱 DEVICE_BREAKDOWN</h2>
            {platforms && platforms.length > 0 ? (
              <>
                <div className="h-64 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={platforms} layout="vertical">
                      <XAxis type="number" stroke="#fff" tick={{ fill: '#fff' }} />
                      <YAxis 
                        type="category" 
                        dataKey="platform" 
                        stroke="#fff" 
                        tick={{ fill: '#fff', fontSize: 11 }}
                        width={100}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          background: '#0a0a0f', 
                          border: '1px solid #ff2a6d',
                          color: '#fff',
                        }}
                      />
                      <Bar dataKey="plays">
                        {platforms.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {platforms.map((p, i) => (
                    <div key={p.platform} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-white/70">{p.platform}</span>
                      </div>
                      <span className="font-mono text-white">{formatNumber(p.plays)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-white/30">NO_PLATFORM_DATA</p>
            )}
          </div>

          {/* Country Rankings */}
          <div className="neon-card">
            <h2 className="neon-section-title">🌍 REGION_RANKINGS</h2>
            {countries && countries.length > 0 ? (
              <div className="space-y-3 mt-4">
                {countries.slice(0, 8).map((country, i) => (
                  <div key={country.country} className="flex items-center gap-4">
                    <div className="neon-track-rank" style={{ color: COLORS[i % COLORS.length] }}>
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-white">{country.country}</span>
                        <span className="text-white/50">{formatNumber(country.plays)} plays</span>
                      </div>
                      <div className="neon-progress-bar">
                        <div 
                          className="neon-progress-fill"
                          style={{ 
                            width: `${(country.plays / countries[0].plays) * 100}%`,
                            background: COLORS[i % COLORS.length]
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/30">NO_GEO_DATA</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function NeonApp() {
  const location = useLocation();
  
  return (
    <div className="neon-app">
      <div className="neon-grid-bg" />
      <div className="neon-scanlines" />
      <div className="neon-content">
        <NeonNav />
        
        {location.pathname === '/2' && <NeonDashboard />}
        {location.pathname === '/2/skip-radar' && <NeonSkipRadar />}
        {location.pathname === '/2/platforms' && <NeonPlatforms />}
      </div>
    </div>
  );
}
