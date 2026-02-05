import { Link, useLocation } from 'react-router-dom';
import { useProfile } from '../../hooks/useProfile';
import { useOverviewStats, useTopArtists, useYearlyStats, useTracks, useTimeOfDay } from '../../hooks/useApi';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ScatterChart, Scatter, ZAxis } from 'recharts';
import './cosmos.css';

function StarField() {
  const stars = Array.from({ length: 100 }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: ['small', 'medium', 'large'][Math.floor(Math.random() * 3)] as 'small' | 'medium' | 'large',
    delay: Math.random() * 3,
    duration: 2 + Math.random() * 4,
  }));

  return (
    <div className="cosmos-stars">
      {stars.map((star) => (
        <div
          key={star.id}
          className={`star ${star.size}`}
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            animationDelay: `${star.delay}s`,
            animationDuration: `${star.duration}s`,
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
        <div className="cosmos-logo-orbit" />
        <span>STELLAR DATA</span>
      </div>
      
      <ul className="cosmos-nav-links">
        <li>
          <Link 
            to="/5" 
            className={`cosmos-nav-link ${location.pathname === '/5' ? 'active' : ''}`}
          >
            Command
          </Link>
        </li>
        <li>
          <Link 
            to="/5/exploration" 
            className={`cosmos-nav-link ${location.pathname === '/5/exploration' ? 'active' : ''}`}
          >
            Exploration
          </Link>
        </li>
        <li>
          <Link 
            to="/5/telemetry" 
            className={`cosmos-nav-link ${location.pathname === '/5/telemetry' ? 'active' : ''}`}
          >
            Telemetry
          </Link>
        </li>
      </ul>
      
      <div className="flex items-center gap-4">
        <select
          value={selectedProfileId}
          onChange={(e) => setSelectedProfileId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="cosmos-select"
        >
          <option value="all">All Sectors</option>
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

function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="cosmos-card text-center">
      <div className="cosmos-stat-value">{value}</div>
      <div className="cosmos-stat-label">{label}</div>
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(2) + ' M';
  if (num >= 1000) return (num / 1000).toFixed(1) + ' K';
  return num.toLocaleString();
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }
  return `${hours}h ${Math.round(minutes % 60)}m`;
}

function CosmosDashboard() {
  const { selectedProfileId } = useProfile();
  const { data: overview, isLoading } = useOverviewStats(selectedProfileId);
  const { data: topArtists, isLoading: loadingArtists } = useTopArtists(selectedProfileId, 5);
  const { data: yearly } = useYearlyStats(selectedProfileId);

  if (isLoading) {
    return (
      <div className="cosmos-loading">
        <div className="cosmos-loading-sun" />
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Hero */}
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="font-audiowide text-4xl text-white mb-4 tracking-wider">
            Mission <span className="text-cosmos-gold">Control</span>
          </h1>
          <p className="text-white/50 tracking-wide">
            Audio telemetry from across the galaxy
          </p>
        </div>
        
        {/* Orbit visualization */}
        <div className="cosmos-orbit-container">
          <div className="cosmos-orbit" />
          <div className="cosmos-orbit" />
          <div className="cosmos-orbit" />
          <div className="cosmos-orbit" />
          <div className="cosmos-sun" />
        </div>
      </div>

      {/* Stats */}
      <div className="cosmos-grid cosmos-grid-4 mb-12">
        <StatCard value={formatNumber(overview?.totalPlays || 0)} label="Transmissions" />
        <StatCard value={formatMinutes(overview?.totalMinutes || 0)} label="Flight Time" />
        <StatCard value={formatNumber(overview?.uniqueTracks || 0)} label="Signals" />
        <StatCard value={formatNumber(overview?.uniqueArtists || 0)} label="Sources" />
      </div>

      <div className="cosmos-grid cosmos-grid-2 gap-8">
        {/* Top Artists */}
        <div className="cosmos-card">
          <h2 className="cosmos-section-title">Primary Sources</h2>
          {loadingArtists ? (
            <div className="cosmos-loading"><div className="cosmos-loading-sun" /></div>
          ) : (
            <div>
              {topArtists?.map((artist, index) => (
                <div key={artist.id} className="cosmos-track">
                  <div className="cosmos-track-rank">{index + 1}</div>
                  <div className="cosmos-track-info">
                    <div className="cosmos-track-name">{artist.name}</div>
                    <div className="cosmos-track-artist">{formatMinutes(artist.minutes)} contact</div>
                  </div>
                  <div className="cosmos-track-plays">{formatNumber(artist.plays)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Yearly Chart */}
        <div className="cosmos-card">
          <h2 className="cosmos-section-title">Temporal Analysis</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={yearly || []}>
                <defs>
                  <linearGradient id="cosmosGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffd700" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#4a1f6e" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="year" 
                  stroke="rgba(248, 248, 255, 0.3)"
                  tick={{ fill: 'rgba(248, 248, 255, 0.5)', fontFamily: 'IBM Plex Sans', fontSize: 11 }}
                />
                <YAxis 
                  stroke="rgba(248, 248, 255, 0.3)"
                  tick={{ fill: 'rgba(248, 248, 255, 0.5)', fontFamily: 'IBM Plex Sans', fontSize: 11 }}
                  tickFormatter={(v) => formatNumber(v)}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(11, 12, 26, 0.95)', 
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    borderRadius: '8px',
                    color: '#ffd700',
                    fontFamily: 'IBM Plex Sans',
                  }}
                  formatter={(value: number) => [formatNumber(value), 'Signals']}
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
      </div>
    </div>
  );
}

function CosmosExploration() {
  const { selectedProfileId } = useProfile();
  const { data: tracksData, isLoading } = useTracks({ 
    profileId: selectedProfileId, 
    limit: 12, 
    sortBy: 'totalPlays', 
    sortOrder: 'DESC' 
  });

  const tracks = tracksData?.data || [];

  return (
    <div className="p-8">
      <h1 className="cosmos-section-title text-2xl mb-8">Signal Archive</h1>
      
      {isLoading ? (
        <div className="cosmos-loading"><div className="cosmos-loading-sun" /></div>
      ) : (
        <div className="cosmos-grid cosmos-grid-2">
          {tracks.map((track, index) => (
            <div key={track.id} className="cosmos-card flex items-center gap-4">
              <div className="cosmos-track-rank text-lg">{index + 1}</div>
              <div className="flex-1">
                <div className="font-semibold text-white mb-1">{track.name || track.trackName}</div>
                <div className="text-sm text-white/50">{track.artistName}</div>
              </div>
              <div className="text-right">
                <div className="cosmos-track-plays text-lg">{formatNumber(track.totalPlays)}</div>
                <div className="text-xs text-white/40">transmissions</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CosmosTelemetry() {
  const { selectedProfileId } = useProfile();
  const { data: timeOfDay, isLoading } = useTimeOfDay(selectedProfileId);
  const { data: topArtists } = useTopArtists(selectedProfileId, 8);

  const radarData = topArtists?.map((artist) => ({
    name: artist.name.length > 10 ? artist.name.substring(0, 10) + '...' : artist.name,
    value: artist.plays,
  })) || [];

  const hourlyData = timeOfDay?.map((item) => ({
    hour: `${String(item.hour).padStart(2, '0')}:00`,
    plays: item.plays,
  })) || [];

  return (
    <div className="p-8">
      <h1 className="cosmos-section-title text-2xl mb-8">Telemetry Data</h1>
      
      <div className="cosmos-grid cosmos-grid-2 gap-8">
        {/* Radar Chart - Artist Constellation */}
        <div className="cosmos-card">
          <h2 className="cosmos-section-title">Source Constellation</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255, 215, 0, 0.2)" />
                <PolarAngleAxis 
                  dataKey="name" 
                  tick={{ fill: 'rgba(248, 248, 255, 0.6)', fontSize: 10 }}
                />
                <PolarRadiusAxis 
                  angle={30} 
                  domain={[0, 'auto']}
                  tick={{ fill: 'rgba(248, 248, 255, 0.4)', fontSize: 9 }}
                />
                <Radar 
                  name="Plays" 
                  dataKey="value" 
                  stroke="#ffd700" 
                  fill="#ffd700" 
                  fillOpacity={0.3}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(11, 12, 26, 0.95)', 
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    borderRadius: '8px',
                    color: '#ffd700',
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Timeline */}
        <div className="cosmos-card">
          <h2 className="cosmos-section-title">Temporal Distribution</h2>
          {isLoading ? (
            <div className="cosmos-loading"><div className="cosmos-loading-sun" /></div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyData}>
                  <defs>
                    <linearGradient id="telemetryGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ffd700" stopOpacity={0.6} />
                      <stop offset="50%" stopColor="#4a1f6e" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#0b0c1a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="hour" 
                    stroke="rgba(248, 248, 255, 0.2)"
                    tick={{ fill: 'rgba(248, 248, 255, 0.4)', fontSize: 9 }}
                    interval={3}
                  />
                  <YAxis 
                    stroke="rgba(248, 248, 255, 0.2)"
                    tick={{ fill: 'rgba(248, 248, 255, 0.4)', fontSize: 10 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'rgba(11, 12, 26, 0.95)', 
                      border: '1px solid rgba(255, 215, 0, 0.3)',
                      borderRadius: '8px',
                      color: '#ffd700',
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="plays" 
                    stroke="#ffd700"
                    strokeWidth={2}
                    fill="url(#telemetryGrad)"
                    dot={{ fill: '#ffd700', r: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CosmosApp() {
  const location = useLocation();
  
  return (
    <div className="cosmos-app">
      <StarField />
      <div className="cosmos-nebula" />
      <div className="cosmos-content">
        <CosmosNav />
        
        {location.pathname === '/5' && <CosmosDashboard />}
        {location.pathname === '/5/exploration' && <CosmosExploration />}
        {location.pathname === '/5/telemetry' && <CosmosTelemetry />}
      </div>
    </div>
  );
}
