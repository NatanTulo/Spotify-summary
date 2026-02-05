import { Link, useLocation } from 'react-router-dom';
import { useProfile } from '../../hooks/useProfile';
import { useOverviewStats, useTopArtists, useYearlyStats, useTracks } from '../../hooks/useApi';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import './vinyl.css';

function VinylNav() {
  const location = useLocation();
  const { profiles, selectedProfileId, setSelectedProfileId } = useProfile();
  
  return (
    <nav className="vinyl-nav">
      <div className="vinyl-logo">
        <div className="vinyl-logo-icon" />
        <span>Vinyl Analytics</span>
      </div>
      
      <ul className="vinyl-nav-links">
        <li>
          <Link 
            to="/1" 
            className={`vinyl-nav-link ${location.pathname === '/1' ? 'active' : ''}`}
          >
            Dashboard
          </Link>
        </li>
        <li>
          <Link 
            to="/1/tracks" 
            className={`vinyl-nav-link ${location.pathname === '/1/tracks' ? 'active' : ''}`}
          >
            Tracks
          </Link>
        </li>
        <li>
          <Link 
            to="/1/artists" 
            className={`vinyl-nav-link ${location.pathname === '/1/artists' ? 'active' : ''}`}
          >
            Artists
          </Link>
        </li>
      </ul>
      
      <div className="flex items-center gap-4">
        <select
          value={selectedProfileId}
          onChange={(e) => setSelectedProfileId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="vinyl-select"
        >
          <option value="all">All Profiles</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        
        <div className="vinyl-design-switcher">
          {[1, 2, 3, 4, 5].map((n) => (
            <Link
              key={n}
              to={`/${n}`}
              className={`vinyl-design-btn ${n === 1 ? 'active' : ''}`}
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
    <div className="vinyl-card">
      <div className="vinyl-stat">
        <div className="vinyl-stat-value">{value}</div>
        <div className="vinyl-stat-label">{label}</div>
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
    return `${days}d ${hours % 24}h`;
  }
  return `${hours}h ${Math.round(minutes % 60)}m`;
}

function VinylDashboard() {
  const { selectedProfileId } = useProfile();
  const { data: overview, isLoading: loadingOverview } = useOverviewStats(selectedProfileId);
  const { data: topArtists, isLoading: loadingArtists } = useTopArtists(selectedProfileId, 5);
  const { data: yearly, isLoading: loadingYearly } = useYearlyStats(selectedProfileId);
  const { data: tracksData } = useTracks({ 
    profileId: selectedProfileId, 
    limit: 5, 
    sortBy: 'totalPlays', 
    sortOrder: 'DESC' 
  });

  if (loadingOverview) {
    return (
      <div className="vinyl-loading">
        <div className="vinyl-loading-disc" />
      </div>
    );
  }

  const topTracks = tracksData?.data || [];

  return (
    <div className="p-8">
      {/* Hero section with vinyl disc */}
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="font-playfair text-5xl text-vinyl-cream mb-4">
            Your Music Journey
          </h1>
          <p className="text-vinyl-cream/60 text-lg">
            Spinning through {formatNumber(overview?.totalPlays || 0)} tracks
          </p>
        </div>
        <div className="vinyl-disc" />
      </div>

      {/* Stats grid */}
      <div className="vinyl-grid vinyl-grid-4 mb-12">
        <StatCard 
          value={formatNumber(overview?.totalPlays || 0)} 
          label="Total Plays" 
        />
        <StatCard 
          value={formatMinutes(overview?.totalMinutes || 0)} 
          label="Time Listened" 
        />
        <StatCard 
          value={formatNumber(overview?.uniqueTracks || 0)} 
          label="Unique Tracks" 
        />
        <StatCard 
          value={formatNumber(overview?.uniqueArtists || 0)} 
          label="Artists Discovered" 
        />
      </div>

      <div className="vinyl-grid vinyl-grid-2 mb-12">
        {/* Top Artists */}
        <div className="vinyl-card">
          <h2 className="vinyl-section-title">Top Artists</h2>
          {loadingArtists ? (
            <div className="vinyl-loading"><div className="vinyl-loading-disc" /></div>
          ) : (
            <div className="mt-8">
              {topArtists?.map((artist, index) => (
                <div key={artist.id} className="vinyl-track">
                  <div className="vinyl-track-number">{index + 1}</div>
                  <div className="vinyl-track-info">
                    <div className="vinyl-track-name">{artist.name}</div>
                    <div className="vinyl-track-artist">{formatMinutes(artist.minutes)} played</div>
                  </div>
                  <div className="vinyl-track-plays">{formatNumber(artist.plays)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Yearly Chart */}
        <div className="vinyl-card">
          <h2 className="vinyl-section-title">Years in Review</h2>
          {loadingYearly ? (
            <div className="vinyl-loading"><div className="vinyl-loading-disc" /></div>
          ) : (
            <div className="mt-8 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearly || []}>
                  <XAxis 
                    dataKey="year" 
                    stroke="#fef5e7" 
                    strokeOpacity={0.5}
                    tick={{ fill: '#fef5e7', opacity: 0.6 }}
                  />
                  <YAxis 
                    stroke="#fef5e7" 
                    strokeOpacity={0.5}
                    tick={{ fill: '#fef5e7', opacity: 0.6 }}
                    tickFormatter={(v) => formatNumber(v)}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: '#2d1810', 
                      border: '1px solid rgba(139, 69, 19, 0.3)',
                      borderRadius: '8px',
                      color: '#fef5e7'
                    }}
                    formatter={(value: number) => [formatNumber(value), 'Plays']}
                  />
                  <Bar 
                    dataKey="plays" 
                    fill="#ff6b35"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Top Tracks */}
      <div className="vinyl-card">
        <h2 className="vinyl-section-title">Most Played Records</h2>
        <div className="mt-8">
          {topTracks.map((track, index) => (
            <div key={track.id} className="vinyl-track">
              <div className="vinyl-track-number">{index + 1}</div>
              <div className="vinyl-track-info">
                <div className="vinyl-track-name">{track.name || track.trackName}</div>
                <div className="vinyl-track-artist">{track.artistName}</div>
              </div>
              <div className="vinyl-track-plays">{formatNumber(track.totalPlays)} plays</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VinylTracks() {
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
      <h1 className="vinyl-section-title text-3xl mb-8">Your Record Collection</h1>
      
      {isLoading ? (
        <div className="vinyl-loading"><div className="vinyl-loading-disc" /></div>
      ) : (
        <div className="vinyl-card">
          {tracks.map((track, index) => (
            <div key={track.id} className="vinyl-track">
              <div className="vinyl-track-number">{index + 1}</div>
              <div className="vinyl-track-info">
                <div className="vinyl-track-name">{track.name || track.trackName}</div>
                <div className="vinyl-track-artist">
                  {track.artistName} • {track.albumName}
                </div>
              </div>
              <div className="vinyl-track-plays">{formatNumber(track.totalPlays)} plays</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VinylArtists() {
  const { selectedProfileId } = useProfile();
  const { data: topArtists, isLoading } = useTopArtists(selectedProfileId, 20);

  return (
    <div className="p-8">
      <h1 className="vinyl-section-title text-3xl mb-8">Your Favorite Artists</h1>
      
      {isLoading ? (
        <div className="vinyl-loading"><div className="vinyl-loading-disc" /></div>
      ) : (
        <div className="vinyl-grid vinyl-grid-2">
          {topArtists?.map((artist, index) => (
            <div key={artist.id} className="vinyl-card">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-vinyl-orange to-vinyl-brown flex items-center justify-center">
                  <span className="font-playfair text-2xl text-vinyl-cream">{index + 1}</span>
                </div>
                <div>
                  <div className="font-playfair text-xl text-vinyl-cream">{artist.name}</div>
                  <div className="text-vinyl-cream/50">
                    {formatNumber(artist.plays)} plays • {formatMinutes(artist.minutes)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function VinylApp() {
  const location = useLocation();
  
  return (
    <div className="vinyl-app">
      <div className="vinyl-content">
        <VinylNav />
        
        {location.pathname === '/1' && <VinylDashboard />}
        {location.pathname === '/1/tracks' && <VinylTracks />}
        {location.pathname === '/1/artists' && <VinylArtists />}
      </div>
    </div>
  );
}
