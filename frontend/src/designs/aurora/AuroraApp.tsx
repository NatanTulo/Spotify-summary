import { Link, useLocation } from 'react-router-dom';
import { useProfile } from '../../hooks/useProfile';
import { useOverviewStats, useTopArtists, useYearlyStats, useTracks, useTimeOfDay } from '../../hooks/useApi';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import './aurora.css';

function Particles() {
  return (
    <div className="aurora-particles">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 15}s`,
            animationDuration: `${15 + Math.random() * 10}s`,
          }}
        />
      ))}
    </div>
  );
}

function AuroraNav() {
  const location = useLocation();
  const { profiles, selectedProfileId, setSelectedProfileId } = useProfile();
  
  return (
    <nav className="aurora-nav">
      <div className="aurora-logo">
        <div className="aurora-logo-blob" />
        <span>Fluid Stats</span>
      </div>
      
      <ul className="aurora-nav-links">
        <li>
          <Link 
            to="/3" 
            className={`aurora-nav-link ${location.pathname === '/3' ? 'active' : ''}`}
          >
            Overview
          </Link>
        </li>
        <li>
          <Link 
            to="/3/library" 
            className={`aurora-nav-link ${location.pathname === '/3/library' ? 'active' : ''}`}
          >
            Library
          </Link>
        </li>
        <li>
          <Link 
            to="/3/insights" 
            className={`aurora-nav-link ${location.pathname === '/3/insights' ? 'active' : ''}`}
          >
            Insights
          </Link>
        </li>
      </ul>
      
      <div className="flex items-center gap-4">
        <select
          value={selectedProfileId}
          onChange={(e) => setSelectedProfileId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="aurora-select"
        >
          <option value="all">All Profiles</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        
        <div className="aurora-design-switcher">
          {[1, 2, 3, 4, 5].map((n) => (
            <Link
              key={n}
              to={`/${n}`}
              className={`aurora-design-btn ${n === 3 ? 'active' : ''}`}
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
    <div className="aurora-card text-center">
      <div className="aurora-stat-value">{value}</div>
      <div className="aurora-stat-label">{label}</div>
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
    return `${days} days`;
  }
  return `${hours}h ${Math.round(minutes % 60)}m`;
}

function AuroraDashboard() {
  const { selectedProfileId } = useProfile();
  const { data: overview, isLoading: loadingOverview } = useOverviewStats(selectedProfileId);
  const { data: topArtists, isLoading: loadingArtists } = useTopArtists(selectedProfileId, 5);
  const { data: yearly } = useYearlyStats(selectedProfileId);

  if (loadingOverview) {
    return (
      <div className="aurora-loading">
        <div className="aurora-loading-blob" />
      </div>
    );
  }

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#a8c0ff', '#d4a5ff'];

  return (
    <div className="p-8">
      {/* Hero */}
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="font-outfit text-5xl font-bold text-white mb-4">
            Your Sound <span className="gradient-text bg-gradient-to-r from-aurora-start via-aurora-mid to-aurora-end">Flow</span>
          </h1>
          <p className="text-white/50 text-lg">
            Dive into the rhythm of your listening journey
          </p>
        </div>
        <div className="aurora-blob-container">
          <div className="aurora-blob" />
          <div className="aurora-blob" />
          <div className="aurora-blob" />
          <div className="relative z-10 font-outfit text-2xl font-bold text-white text-center">
            {formatNumber(overview?.totalPlays || 0)}
            <div className="text-sm font-normal text-white/50">plays</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="aurora-grid aurora-grid-4 mb-12">
        <StatCard value={formatNumber(overview?.totalPlays || 0)} label="Total Plays" />
        <StatCard value={formatMinutes(overview?.totalMinutes || 0)} label="Listened" />
        <StatCard value={formatNumber(overview?.uniqueTracks || 0)} label="Tracks" />
        <StatCard value={formatNumber(overview?.uniqueArtists || 0)} label="Artists" />
      </div>

      <div className="aurora-grid aurora-grid-2 gap-8">
        {/* Top Artists */}
        <div className="aurora-card">
          <h2 className="aurora-section-title">Top Artists</h2>
          {loadingArtists ? (
            <div className="aurora-loading"><div className="aurora-loading-blob" /></div>
          ) : (
            <div>
              {topArtists?.map((artist, index) => (
                <div key={artist.id} className="aurora-track">
                  <div className="aurora-track-number">{index + 1}</div>
                  <div className="aurora-track-info">
                    <div className="aurora-track-name">{artist.name}</div>
                    <div className="aurora-track-artist">{formatMinutes(artist.minutes)}</div>
                  </div>
                  <div className="aurora-track-plays">{formatNumber(artist.plays)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Yearly Chart */}
        <div className="aurora-card">
          <h2 className="aurora-section-title">Through the Years</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={yearly || []}>
                <defs>
                  <linearGradient id="auroraGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f093fb" stopOpacity={0.6} />
                    <stop offset="50%" stopColor="#764ba2" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#667eea" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="year" 
                  stroke="rgba(248,248,255,0.3)"
                  tick={{ fill: 'rgba(248,248,255,0.5)', fontSize: 12 }}
                />
                <YAxis 
                  stroke="rgba(248,248,255,0.3)"
                  tick={{ fill: 'rgba(248,248,255,0.5)', fontSize: 12 }}
                  tickFormatter={(v) => formatNumber(v)}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(26,26,46,0.9)', 
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '12px',
                    color: '#f8f8ff',
                    backdropFilter: 'blur(10px)',
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="plays" 
                  stroke="#f093fb"
                  strokeWidth={2}
                  fill="url(#auroraGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuroraLibrary() {
  const { selectedProfileId } = useProfile();
  const { data: tracksData, isLoading } = useTracks({ 
    profileId: selectedProfileId, 
    limit: 15, 
    sortBy: 'totalPlays', 
    sortOrder: 'DESC' 
  });

  const tracks = tracksData?.data || [];

  return (
    <div className="p-8">
      <h1 className="aurora-section-title text-3xl mb-8">Your Library</h1>
      
      {isLoading ? (
        <div className="aurora-loading"><div className="aurora-loading-blob" /></div>
      ) : (
        <div className="aurora-card">
          {tracks.map((track, index) => (
            <div key={track.id} className="aurora-track">
              <div className="aurora-track-number">{index + 1}</div>
              <div className="aurora-track-info">
                <div className="aurora-track-name">{track.name || track.trackName}</div>
                <div className="aurora-track-artist">
                  {track.artistName} • {track.albumName}
                </div>
              </div>
              <div className="aurora-track-plays">{formatNumber(track.totalPlays)} plays</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AuroraInsights() {
  const { selectedProfileId } = useProfile();
  const { data: timeOfDay, isLoading } = useTimeOfDay(selectedProfileId);
  const { data: topArtists } = useTopArtists(selectedProfileId, 6);

  const formattedTime = timeOfDay?.map((item) => ({
    hour: `${item.hour}h`,
    plays: item.plays,
  })) || [];

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#a8c0ff', '#d4a5ff', '#8c9eff'];

  return (
    <div className="p-8">
      <h1 className="aurora-section-title text-3xl mb-8">Deep Insights</h1>
      
      <div className="aurora-grid aurora-grid-2 gap-8">
        {/* Time of Day */}
        <div className="aurora-card">
          <h2 className="aurora-section-title">Listening Rhythm</h2>
          {isLoading ? (
            <div className="aurora-loading"><div className="aurora-loading-blob" /></div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formattedTime}>
                  <defs>
                    <linearGradient id="timeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#667eea" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="#f093fb" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="hour" 
                    stroke="rgba(248,248,255,0.3)"
                    tick={{ fill: 'rgba(248,248,255,0.5)', fontSize: 10 }}
                    interval={3}
                  />
                  <YAxis 
                    stroke="rgba(248,248,255,0.3)"
                    tick={{ fill: 'rgba(248,248,255,0.5)', fontSize: 10 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'rgba(26,26,46,0.9)', 
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '12px',
                      color: '#f8f8ff',
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="plays" 
                    stroke="#667eea"
                    strokeWidth={2}
                    fill="url(#timeGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Artist Distribution */}
        <div className="aurora-card">
          <h2 className="aurora-section-title">Artist Mix</h2>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={topArtists?.map(a => ({ name: a.name, value: a.plays })) || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {topArtists?.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(26,26,46,0.9)', 
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '12px',
                    color: '#f8f8ff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {topArtists?.slice(0, 4).map((artist, i) => (
              <div key={artist.id} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} />
                <span className="text-white/70">{artist.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuroraApp() {
  const location = useLocation();
  
  return (
    <div className="aurora-app">
      <div className="aurora-bg" />
      <Particles />
      <div className="aurora-content">
        <AuroraNav />
        
        {location.pathname === '/3' && <AuroraDashboard />}
        {location.pathname === '/3/library' && <AuroraLibrary />}
        {location.pathname === '/3/insights' && <AuroraInsights />}
      </div>
    </div>
  );
}
