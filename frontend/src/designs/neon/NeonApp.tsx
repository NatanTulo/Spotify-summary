import { Link, useLocation } from 'react-router-dom';
import { useProfile } from '../../hooks/useProfile';
import { useOverviewStats, useTopArtists, useYearlyStats, useTracks, useTimeOfDay } from '../../hooks/useApi';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';
import './neon.css';

function NeonNav() {
  const location = useLocation();
  const { profiles, selectedProfileId, setSelectedProfileId } = useProfile();
  
  return (
    <nav className="neon-nav">
      <div className="neon-logo">NEON_STATS</div>
      
      <ul className="neon-nav-links">
        <li>
          <Link 
            to="/2" 
            className={`neon-nav-link ${location.pathname === '/2' ? 'active' : ''}`}
          >
            Dashboard
          </Link>
        </li>
        <li>
          <Link 
            to="/2/tracks" 
            className={`neon-nav-link ${location.pathname === '/2/tracks' ? 'active' : ''}`}
          >
            Tracks
          </Link>
        </li>
        <li>
          <Link 
            to="/2/analytics" 
            className={`neon-nav-link ${location.pathname === '/2/analytics' ? 'active' : ''}`}
          >
            Analytics
          </Link>
        </li>
      </ul>
      
      <div className="flex items-center gap-4">
        <select
          value={selectedProfileId}
          onChange={(e) => setSelectedProfileId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="neon-select"
        >
          <option value="all">&gt; ALL_PROFILES</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>&gt; {p.name.toUpperCase()}</option>
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

function StatCard({ value, label, color = 'cyan' }: { value: string | number; label: string; color?: 'cyan' | 'pink' | 'purple' }) {
  const gradients = {
    cyan: 'linear-gradient(180deg, #05d9e8 0%, #7b2dff 100%)',
    pink: 'linear-gradient(180deg, #ff2a6d 0%, #7b2dff 100%)',
    purple: 'linear-gradient(180deg, #7b2dff 0%, #05d9e8 100%)',
  };
  
  return (
    <div className="neon-card scanlines">
      <div className="text-center py-4">
        <div 
          className="neon-stat-value"
          style={{ background: gradients[color], WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >
          {value}
        </div>
        <div className="neon-stat-label">{label}</div>
      </div>
    </div>
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
    return `${days}D:${String(hours % 24).padStart(2, '0')}H`;
  }
  return `${hours}H:${String(Math.round(minutes % 60)).padStart(2, '0')}M`;
}

function NeonDashboard() {
  const { selectedProfileId } = useProfile();
  const { data: overview, isLoading: loadingOverview } = useOverviewStats(selectedProfileId);
  const { data: topArtists, isLoading: loadingArtists } = useTopArtists(selectedProfileId, 5);
  const { data: yearly } = useYearlyStats(selectedProfileId);
  const { data: tracksData } = useTracks({ 
    profileId: selectedProfileId, 
    limit: 5, 
    sortBy: 'totalPlays', 
    sortOrder: 'DESC' 
  });

  if (loadingOverview) {
    return (
      <div className="neon-loading">
        <div className="neon-loading-bar" />
      </div>
    );
  }

  const topTracks = tracksData?.data || [];

  return (
    <div className="p-8">
      {/* Hero */}
      <div className="mb-12">
        <h1 
          className="glitch font-orbitron text-5xl font-black text-white mb-4"
          data-text="SYSTEM_ONLINE"
        >
          SYSTEM_ONLINE
        </h1>
        <p className="text-white/50 font-jetbrains">
          &gt; Analyzing {formatNumber(overview?.totalPlays || 0)} audio streams...
        </p>
      </div>

      {/* Stats grid */}
      <div className="neon-grid neon-grid-4 mb-12">
        <StatCard value={formatNumber(overview?.totalPlays || 0)} label="TOTAL_PLAYS" color="cyan" />
        <StatCard value={formatMinutes(overview?.totalMinutes || 0)} label="TIME_PLAYED" color="pink" />
        <StatCard value={formatNumber(overview?.uniqueTracks || 0)} label="UNIQUE_TRACKS" color="purple" />
        <StatCard value={formatNumber(overview?.uniqueArtists || 0)} label="ARTISTS_DETECTED" color="cyan" />
      </div>

      <div className="neon-grid neon-grid-2 mb-12">
        {/* Top Artists */}
        <div className="neon-card">
          <h2 className="neon-section-title">TOP_ARTISTS</h2>
          {loadingArtists ? (
            <div className="neon-loading"><div className="neon-loading-bar" /></div>
          ) : (
            <div>
              {topArtists?.map((artist, index) => (
                <div key={artist.id} className="neon-track">
                  <div className="neon-track-number">[{String(index + 1).padStart(2, '0')}]</div>
                  <div className="neon-track-info">
                    <div className="neon-track-name">{artist.name}</div>
                    <div className="neon-track-artist">{formatMinutes(artist.minutes)} runtime</div>
                  </div>
                  <div className="neon-track-plays">{formatNumber(artist.plays)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Yearly Chart */}
        <div className="neon-card">
          <h2 className="neon-section-title">YEARLY_DATA</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearly || []}>
                <XAxis 
                  dataKey="year" 
                  stroke="#05d9e8" 
                  strokeOpacity={0.3}
                  tick={{ fill: '#05d9e8', opacity: 0.6, fontSize: 10 }}
                  axisLine={{ stroke: '#05d9e8', strokeOpacity: 0.2 }}
                />
                <YAxis 
                  stroke="#05d9e8" 
                  strokeOpacity={0.3}
                  tick={{ fill: '#05d9e8', opacity: 0.6, fontSize: 10 }}
                  axisLine={{ stroke: '#05d9e8', strokeOpacity: 0.2 }}
                  tickFormatter={(v) => formatNumber(v)}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: '#0a0a0f', 
                    border: '1px solid rgba(5, 217, 232, 0.3)',
                    color: '#05d9e8',
                    fontFamily: 'JetBrains Mono'
                  }}
                  formatter={(value: number) => [formatNumber(value), 'PLAYS']}
                />
                <Bar 
                  dataKey="plays" 
                  fill="url(#neonGradient)"
                />
                <defs>
                  <linearGradient id="neonGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff2a6d" />
                    <stop offset="100%" stopColor="#7b2dff" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Tracks */}
      <div className="neon-card">
        <h2 className="neon-section-title">TOP_TRACKS</h2>
        <div>
          {topTracks.map((track, index) => (
            <div key={track.id} className="neon-track">
              <div className="neon-track-number">[{String(index + 1).padStart(2, '0')}]</div>
              <div className="neon-track-info">
                <div className="neon-track-name">{track.name || track.trackName}</div>
                <div className="neon-track-artist">{track.artistName}</div>
              </div>
              <div className="neon-track-plays">{formatNumber(track.totalPlays)} plays</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NeonTracks() {
  const { selectedProfileId } = useProfile();
  const { data: tracksData, isLoading } = useTracks({ 
    profileId: selectedProfileId, 
    limit: 20, 
    sortBy: 'totalPlays', 
    sortOrder: 'DESC' 
  });

  const tracks = tracksData?.data || [];

  return (
    <div className="p-8">
      <h1 className="neon-section-title text-2xl mb-8">AUDIO_DATABASE</h1>
      
      {isLoading ? (
        <div className="neon-loading"><div className="neon-loading-bar" /></div>
      ) : (
        <div className="neon-card">
          {tracks.map((track, index) => (
            <div key={track.id} className="neon-track">
              <div className="neon-track-number">[{String(index + 1).padStart(2, '0')}]</div>
              <div className="neon-track-info">
                <div className="neon-track-name">{track.name || track.trackName}</div>
                <div className="neon-track-artist">
                  {track.artistName} :: {track.albumName}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="neon-progress w-32">
                  <div 
                    className="neon-progress-fill" 
                    style={{ width: `${Math.min(100, (track.totalPlays / 100) * 100)}%` }}
                  />
                </div>
                <div className="neon-track-plays">{formatNumber(track.totalPlays)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NeonAnalytics() {
  const { selectedProfileId } = useProfile();
  const { data: timeOfDay, isLoading } = useTimeOfDay(selectedProfileId);

  const formattedData = timeOfDay?.map((item) => ({
    hour: `${String(item.hour).padStart(2, '0')}:00`,
    plays: item.plays,
  })) || [];

  return (
    <div className="p-8">
      <h1 className="neon-section-title text-2xl mb-8">ANALYTICS_ENGINE</h1>
      
      {isLoading ? (
        <div className="neon-loading"><div className="neon-loading-bar" /></div>
      ) : (
        <div className="neon-card">
          <h2 className="neon-section-title">TIME_DISTRIBUTION</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formattedData}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff2a6d" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#7b2dff" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="hour" 
                  stroke="#05d9e8" 
                  strokeOpacity={0.3}
                  tick={{ fill: '#05d9e8', opacity: 0.6, fontSize: 9 }}
                  interval={2}
                />
                <YAxis 
                  stroke="#05d9e8" 
                  strokeOpacity={0.3}
                  tick={{ fill: '#05d9e8', opacity: 0.6, fontSize: 10 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: '#0a0a0f', 
                    border: '1px solid rgba(5, 217, 232, 0.3)',
                    color: '#05d9e8',
                    fontFamily: 'JetBrains Mono'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="plays" 
                  stroke="#ff2a6d"
                  strokeWidth={2}
                  fill="url(#areaGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
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
      <div className="neon-content">
        <NeonNav />
        
        {location.pathname === '/2' && <NeonDashboard />}
        {location.pathname === '/2/tracks' && <NeonTracks />}
        {location.pathname === '/2/analytics' && <NeonAnalytics />}
      </div>
    </div>
  );
}
